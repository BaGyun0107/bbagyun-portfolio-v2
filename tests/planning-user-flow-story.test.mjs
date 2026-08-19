import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { buildUserFlowStory } from '../.harness/scripts/docs/lib/build-user-flow-story.mjs';
import { renderUserFlowStoryView } from '../.harness/scripts/docs/lib/render-user-flow-story-view.mjs';
import { renderPlanningPage } from '../.harness/scripts/docs/lib/render-planning-page.mjs';

const FLOW = {
  id: 'FLOW-PUBLISH',
  title: '게시물 발행',
  actor: 'member',
  goal: '콘텐츠를 안전하게 발행한다',
  entryStepId: 'start',
  steps: [
    { id: 'start', title: '시작한다', kind: 'start', next: [{ to: 'input' }] },
    {
      id: 'input', title: '내용을 입력한다', kind: 'action',
      screenIds: ['SCREEN-CREATE'], featureIds: ['FEAT-POST-CREATE'], next: [{ to: 'validate' }],
    },
    {
      id: 'validate', title: '입력을 검증한다', kind: 'decision',
      next: [
        { to: 'publish', condition: 'valid', kind: 'normal' },
        { to: 'input', condition: 'invalid', kind: 'recovery' },
      ],
    },
    { id: 'publish', title: '발행한다', kind: 'system', systemOwner: 'publishing-api', next: [{ to: 'done' }] },
    { id: 'done', title: '완료한다', kind: 'success', next: [] },
  ],
};

test('story projection은 정상 path와 발생 단계에 붙은 recovery branch를 분리한다', () => {
  const story = buildUserFlowStory(FLOW);

  assert.equal(story.actor, 'member');
  assert.equal(story.goal, '콘텐츠를 안전하게 발행한다');
  assert.deepEqual(story.normalPath.map(({ id }) => id), ['start', 'input', 'validate', 'publish', 'done']);
  assert.deepEqual(story.branches, [
    { from: 'validate', condition: 'invalid', to: 'input', kind: 'recovery' },
  ]);
  assert.deepEqual(story.normalPath[1].screenIds, ['SCREEN-CREATE']);
  assert.deepEqual(story.normalPath[1].featureIds, ['FEAT-POST-CREATE']);
  assert.deepEqual(story.health, []);
});

test('정상 path는 명시적 source semantics가 없으면 success를 추측하지 않는다', () => {
  const story = buildUserFlowStory({
    id: 'FLOW-AMBIGUOUS', actor: 'user', goal: '추측 없이 분기를 본다', entryStepId: 'start',
    steps: [
      { id: 'start', title: '시작', kind: 'start', next: [{ to: 'choice' }] },
      { id: 'choice', title: '선택', kind: 'decision', next: [{ to: 'left' }, { to: 'right' }] },
      { id: 'left', title: '왼쪽', kind: 'end', next: [] },
      { id: 'right', title: '오른쪽', kind: 'end', next: [] },
    ],
  });

  assert.deepEqual(story.normalPath.map(({ id }) => id), ['start', 'choice']);
  assert.deepEqual(story.branches, [
    { from: 'choice', condition: '', to: 'left', kind: 'decision' },
    { from: 'choice', condition: '', to: 'right', kind: 'decision' },
  ]);
  assert.ok(story.health.some(({ type, from }) => type === 'ambiguous-branch' && from === 'choice'));
});

test('조건이 모두 있어도 explicit normal 표기가 없는 decision은 첫 edge를 정상 경로로 추측하지 않는다', () => {
  const story = buildUserFlowStory({
    id: 'FLOW-CONDITIONED-AMBIGUOUS', actor: 'user', goal: '조건과 정상 의도를 구분한다', entryStepId: 'start',
    steps: [
      { id: 'start', title: '시작', kind: 'start', next: [{ to: 'choice' }] },
      { id: 'choice', title: '선택', kind: 'decision', next: [{ to: 'left', condition: 'A' }, { to: 'right', condition: 'B' }] },
      { id: 'left', title: '왼쪽', kind: 'end', next: [] },
      { id: 'right', title: '오른쪽', kind: 'end', next: [] },
    ],
  });

  assert.deepEqual(story.normalPath.map(({ id }) => id), ['start', 'choice']);
  assert.ok(story.health.some(({ type, from }) => type === 'ambiguous-branch' && from === 'choice'));
});

test('유일한 success target은 explicit step kind semantics로 정상 경로를 유지한다', () => {
  const story = buildUserFlowStory({
    id: 'FLOW-SUCCESS-TARGET', actor: 'user', goal: '성공 target을 따른다', entryStepId: 'choice',
    steps: [
      { id: 'choice', title: '선택', kind: 'decision', next: [{ to: 'retry', condition: '실패' }, { to: 'done', condition: '성공' }] },
      { id: 'retry', title: '재시도', kind: 'failure', next: [] },
      { id: 'done', title: '완료', kind: 'success', next: [] },
    ],
  });

  assert.deepEqual(story.normalPath.map(({ id }) => id), ['choice', 'done']);
  assert.equal(story.health.some(({ type }) => type === 'ambiguous-branch'), false);
});

test('명시된 normal edge 외 분류 불가 edge를 unclassified branch와 health로 보존한다', () => {
  const flow = {
    id: 'FLOW-UNCLASSIFIED', title: '미분류 branch', actor: 'user', goal: '분기를 잃지 않는다', entryStepId: 'start',
    steps: [
      { id: 'start', title: '시작', kind: 'start', normalNextId: 'done', next: [
        { to: 'done', condition: '정상' },
        { to: 'alternate', condition: '다른 경로' },
      ] },
      { id: 'alternate', title: '대안', kind: 'action', next: [] },
      { id: 'done', title: '완료', kind: 'end', next: [] },
    ],
  };
  const story = buildUserFlowStory(flow);
  const html = renderUserFlowStoryView({ flows: [flow] });

  assert.deepEqual(story.normalPath.map(({ id }) => id), ['start', 'done']);
  assert.deepEqual(story.branches, [
    { from: 'start', condition: '다른 경로', to: 'alternate', kind: 'unclassified' },
  ]);
  assert.ok(story.health.some(({ type, from, to }) => type === 'unclassified-branch' && from === 'start' && to === 'alternate'));
  assert.match(html, /data-flow-branch-kind="unclassified"/);
  assert.match(html, /미분류 분기/);
  assert.match(html, /<ol data-flow-ordered-text>[\s\S]*다른 경로/);
});

test('Community Demo의 multi-edge 정상 의도는 normalNextId로 명시되어 전체 정상 경로를 만든다', () => {
  const flows = JSON.parse(readFileSync(new URL('../examples/community-app/planning/user-flows.json', import.meta.url), 'utf8')).flows;
  const stories = new Map(flows.map((flow) => [flow.id, buildUserFlowStory(flow)]));

  assert.deepEqual(stories.get('FLOW-DISCOVER').normalPath.map(({ id }) => id), ['feed', 'open', 'success']);
  assert.deepEqual(stories.get('FLOW-PUBLISH').normalPath.map(({ id }) => id), ['compose', 'validate', 'published']);
  assert.deepEqual(stories.get('FLOW-MODERATE').normalPath.map(({ id }) => id), ['report', 'review', 'action']);
  assert.deepEqual(stories.get('FLOW-DISCOVER').branches, [
    { from: 'feed', condition: '찾는 결과 없음', to: 'search', kind: 'recovery' },
  ]);
  assert.deepEqual(stories.get('FLOW-PUBLISH').branches, [
    { from: 'validate', condition: '오류', to: 'recover', kind: 'failure' },
  ]);
  assert.deepEqual(stories.get('FLOW-MODERATE').branches, [
    { from: 'review', condition: '위반 아님', to: 'dismiss', kind: 'decision' },
  ]);
  for (const story of stories.values()) assert.deepEqual(story.health, []);
});

test('broken target와 cycle을 health로 남기고 모든 원본 단계와 branch를 ordered text에 보존한다', () => {
  const story = buildUserFlowStory({
    id: 'FLOW-BROKEN', actor: 'user', goal: '안전하게 멈춘다', entryStepId: 'start',
    steps: [
      { id: 'start', title: '시작', kind: 'start', next: [{ to: 'loop' }] },
      { id: 'loop', title: '반복', kind: 'action', next: [{ to: 'start' }, { to: 'missing', condition: '실패', kind: 'failure' }] },
      { id: 'orphan', title: '도달하지 않는 원본 단계', kind: 'end', next: [] },
    ],
  });

  assert.deepEqual(story.normalPath.map(({ id }) => id), ['start', 'loop']);
  assert.deepEqual(story.branches, [
    { from: 'loop', condition: '실패', to: 'missing', kind: 'failure' },
  ]);
  assert.ok(story.health.some(({ type, from, to }) => type === 'broken-target' && from === 'loop' && to === 'missing'));
  assert.ok(story.health.some(({ type, from, to }) => type === 'cycle' && from === 'loop' && to === 'start'));
  assert.ok(story.orderedText.some((line) => line.includes('도달하지 않는 원본 단계')));
  assert.ok(story.orderedText.some((line) => line.includes('실패') && line.includes('missing')));
});

test('renderer는 decision/failure branch kind, flow health와 전체 ordered 대안을 표면화한다', () => {
  const brokenFlow = {
    id: 'FLOW-BROKEN', title: '중단 흐름', actor: 'user', goal: '안전하게 멈춘다', entryStepId: 'start',
    steps: [
      { id: 'start', title: '시작', kind: 'start', next: [{ to: 'loop' }] },
      { id: 'loop', title: '반복', kind: 'action', next: [{ to: 'start' }, { to: 'missing', condition: '실패', kind: 'failure' }] },
      { id: 'orphan', title: '도달하지 않는 원본 단계', kind: 'end', next: [] },
    ],
  };
  const decisionFlow = {
    id: 'FLOW-DECIDE', title: '결정 흐름', actor: 'user', goal: '분기를 본다', entryStepId: 'review',
    steps: [
      { id: 'review', title: '검토', kind: 'decision', normalNextId: 'approve', next: [
        { to: 'approve', condition: '승인' },
        { to: 'dismiss', condition: '위반 아님', kind: 'decision' },
      ] },
      { id: 'approve', title: '승인 처리', kind: 'success', next: [] },
      { id: 'dismiss', title: '기각', kind: 'end', next: [] },
    ],
  };
  const html = renderUserFlowStoryView({ flows: [brokenFlow, decisionFlow] });

  assert.match(html, /data-flow-branch-kind="failure"/);
  assert.match(html, /data-flow-branch-kind="decision"/);
  assert.match(html, /class="flow-story-health" role="status"/);
  assert.match(html, /broken-target · loop → missing/);
  assert.match(html, /cycle · loop → start/);
  const orderedText = html.slice(html.indexOf('<ol data-flow-ordered-text>'), html.indexOf('</ol>', html.indexOf('<ol data-flow-ordered-text>')));
  assert.match(orderedText, /도달하지 않는 원본 단계/);
  assert.match(orderedText, /실패/);
  assert.match(orderedText, /missing/);
});

test('projection은 malformed/empty 입력에서 결정적이며 원본을 수정하지 않는다', () => {
  const source = {
    id: 'FLOW-MALFORMED', actor: '<actor>', goal: '<goal>', entryStepId: 'missing',
    steps: [null, { id: '', title: '<invalid>', next: 'broken' }, { id: 'valid', title: '<valid>', screenIds: 'broken', featureIds: [null, 'FEAT-X'], next: [] }],
  };
  const before = structuredClone(source);
  const first = buildUserFlowStory(source);
  const second = buildUserFlowStory(source);

  assert.deepEqual(source, before);
  assert.deepEqual(first, second);
  assert.deepEqual(first.normalPath, []);
  assert.ok(first.health.some(({ type }) => type === 'broken-entry'));
  assert.deepEqual(buildUserFlowStory(null), {
    actor: '', goal: '', normalPath: [], branches: [], health: [{ type: 'invalid-flow' }], orderedText: [],
  });
});

test('renderer는 가로 normal path, attached branch, 선택 상세와 전체 ordered 대안을 안전하게 렌더한다', () => {
  const hostile = '</button><img src=x onerror="globalThis.attacked=1">';
  const html = renderUserFlowStoryView({ flows: [{
    ...FLOW,
    title: hostile,
    steps: FLOW.steps.map((step) => step.id === 'input' ? { ...step, title: hostile, actor: 'member' } : step),
  }] });

  for (const marker of [
    'data-user-flow-story-view',
    'data-flow-select="FLOW-PUBLISH"',
    'data-flow-story="FLOW-PUBLISH"',
    'data-flow-normal-path',
    'data-flow-step-select="input"',
    'data-flow-branches-for="validate"',
    'data-flow-branch-kind="recovery"',
    'data-flow-step-detail="input"',
    'data-flow-role-lanes',
    '<ol data-flow-ordered-text',
  ]) assert.match(html, new RegExp(marker));
  assert.match(html, /SCREEN-CREATE/);
  assert.match(html, /FEAT-POST-CREATE/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;\/button&gt;&lt;img/);

  const withoutOwnership = renderUserFlowStoryView({ flows: [{
    ...FLOW,
    steps: FLOW.steps.map(({ systemOwner: _systemOwner, actor: _actor, ...step }) => step),
  }] });
  assert.doesNotMatch(withoutOwnership, /data-flow-role-lanes/);
});

test('Planning page는 explicit empty/malformed flow state를 stale manifest로 대체하지 않는다', () => {
  const emptyHtml = renderPlanningPage({ workspaceHub: { defaultWorkspaceId: 'empty', workspaces: [{
    id: 'empty', title: 'Empty', features: [], featureDetails: [], userFlows: { flows: [] },
    planningManifest: { flows: [FLOW] },
  }] } });
  const malformedHtml = renderPlanningPage({ workspaceHub: { defaultWorkspaceId: 'malformed', workspaces: [{
    id: 'malformed', title: 'Malformed', features: [], featureDetails: [], userFlows: { flows: 'broken' },
    planningManifest: { flows: [FLOW] },
  }] } });
  const nullHtml = renderPlanningPage({ workspaceHub: { defaultWorkspaceId: 'null', workspaces: [{
    id: 'null', title: 'Null', features: [], featureDetails: [], userFlows: null,
    planningManifest: { flows: [FLOW] },
  }] } });
  const undefinedHtml = renderPlanningPage({ workspaceHub: { defaultWorkspaceId: 'undefined', workspaces: [{
    id: 'undefined', title: 'Undefined', features: [], featureDetails: [], userFlows: undefined,
    planningManifest: { flows: [FLOW] },
  }] } });
  const missingHtml = renderPlanningPage({ workspaceHub: { defaultWorkspaceId: 'missing', workspaces: [{
    id: 'missing', title: 'Missing', features: [], featureDetails: [],
    planningManifest: { flows: [FLOW] },
  }] } });

  const emptyFlowView = emptyHtml.slice(emptyHtml.indexOf('<section data-workspace-view="flows"'), emptyHtml.indexOf('<section data-workspace-view="traceability"'));
  const malformedFlowView = malformedHtml.slice(malformedHtml.indexOf('<section data-workspace-view="flows"'), malformedHtml.indexOf('<section data-workspace-view="traceability"'));
  const nullFlowView = nullHtml.slice(nullHtml.indexOf('<section data-workspace-view="flows"'), nullHtml.indexOf('<section data-workspace-view="traceability"'));
  const undefinedFlowView = undefinedHtml.slice(undefinedHtml.indexOf('<section data-workspace-view="flows"'), undefinedHtml.indexOf('<section data-workspace-view="traceability"'));
  const missingFlowView = missingHtml.slice(missingHtml.indexOf('<section data-workspace-view="flows"'), missingHtml.indexOf('<section data-workspace-view="traceability"'));
  assert.match(emptyFlowView, /사용자 흐름 미수집/);
  assert.doesNotMatch(emptyFlowView, /FLOW-PUBLISH/);
  assert.match(malformedFlowView, /사용자 흐름 미수집/);
  assert.doesNotMatch(malformedFlowView, /FLOW-PUBLISH/);
  assert.match(nullFlowView, /사용자 흐름 미수집/);
  assert.doesNotMatch(nullFlowView, /FLOW-PUBLISH/);
  assert.match(undefinedFlowView, /FLOW-PUBLISH/);
  assert.match(missingFlowView, /FLOW-PUBLISH/);
});

test('generated client는 flow/step click·Enter·Space와 workspace별 선택 재수화를 처리한다', () => {
  const flowA2 = { ...FLOW, id: 'FLOW-A2', title: 'A2', entryStepId: 'start' };
  const flowB = { ...FLOW, id: 'FLOW-B', title: 'B', entryStepId: 'start' };
  const html = renderPlanningPage({ workspaceHub: { defaultWorkspaceId: 'a', workspaces: [
    { id: 'a', title: 'A', features: [], featureDetails: [], userFlows: { flows: [FLOW, flowA2] } },
    { id: 'b', title: 'B', features: [], featureDetails: [], userFlows: { flows: [flowB] } },
  ] } });

  const flowButtons = ['FLOW-PUBLISH', 'FLOW-A2', 'FLOW-B'].map((flowSelect) => fakeElement({ flowSelect }));
  const storyPanels = ['FLOW-PUBLISH', 'FLOW-A2', 'FLOW-B'].map((flowStory) => fakeElement({ flowStory }));
  const stepButtons = [
    fakeElement({ flowStepSelect: 'start', flowId: 'FLOW-PUBLISH' }),
    fakeElement({ flowStepSelect: 'input', flowId: 'FLOW-PUBLISH' }),
    fakeElement({ flowStepSelect: 'validate', flowId: 'FLOW-A2' }),
    fakeElement({ flowStepSelect: 'publish', flowId: 'FLOW-A2' }),
    fakeElement({ flowStepSelect: 'done', flowId: 'FLOW-B' }),
  ];
  const details = stepButtons.map((button) => fakeElement({ flowStepDetail: button.dataset.flowStepSelect, flowId: button.dataset.flowId }));
  const body = fakeElement();
  body.innerHTML = 'A flows';
  const panel = fakeElement({ workspaceView: 'flows' });
  panel.querySelector = () => body;
  const templateB = fakeElement({ workspaceTemplate: 'b', view: 'flows' });
  templateB.innerHTML = 'B flows';
  const runtime = executeClient(html, {
    '[data-flow-select]': flowButtons,
    '[data-flow-story]': storyPanels,
    '[data-flow-step-select]': stepButtons,
    '[data-flow-step-detail]': details,
    '[data-workspace-view]': [panel],
  }, {
    'template[data-workspace-template="b"][data-view="flows"]': templateB,
  });

  runtime.click(target({ '[data-flow-select]': flowButtons[1] }));
  runtime.keydown(target({ '[data-flow-step-select]': stepButtons[3] }), 'Enter');
  assert.equal(flowButtons[1].attributes['aria-pressed'], 'true');
  assert.equal(stepButtons[3].attributes['aria-pressed'], 'true');
  assert.equal(details[3].classList.has('hidden'), false);

  runtime.change({ id: 'workspaceSelect', value: 'b', dataset: {} });
  runtime.keydown(target({ '[data-flow-step-select]': stepButtons[4] }), ' ');
  assert.equal(body.innerHTML, 'B flows');
  assert.equal(flowButtons[2].attributes['aria-pressed'], 'true');
  assert.equal(stepButtons[4].attributes['aria-pressed'], 'true');

  runtime.change({ id: 'workspaceSelect', value: 'a', dataset: {} });
  assert.equal(body.innerHTML, 'A flows');
  assert.equal(flowButtons[1].attributes['aria-pressed'], 'true');
  assert.equal(stepButtons[3].attributes['aria-pressed'], 'true');
  assert.equal(stepButtons[4].attributes['aria-pressed'], 'false', '다른 workspace 선택이 stale 상태로 남지 않음');
});

test('planning page는 skip link, 광역 reduced-motion과 분기 kind의 비색상 구분 CSS 계약을 담는다', () => {
  const html = renderPlanningPage({ workspaceHub: { defaultWorkspaceId: 'a11y', workspaces: [{
    id: 'a11y', title: 'A11y', features: [], featureDetails: [], userFlows: { flows: [FLOW] },
  }] } });
  const style = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] || '';

  assert.match(html, /<a class="skip-link" href="#planningMain">/);
  assert.match(style, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.planning-page \*/);
  assert.match(style, /\.flow-story-selector \{/);
  assert.match(style, /\.flow-normal-path \{/);
  assert.match(style, /\.flow-branch-panel\[data-flow-branch-kind="failure"\]/);
  assert.match(style, /\.flow-branch-panel\[data-flow-branch-kind="recovery"\]/);
});

function fakeElement(dataset = {}) {
  const classes = new Set();
  return {
    dataset: { ...dataset }, attributes: {}, value: '', innerHTML: '', textContent: '', disabled: false, children: [], parentElement: null,
    classList: {
      toggle(name, force) { if (force) classes.add(name); else classes.delete(name); },
      add(name) { classes.add(name); }, remove(name) { classes.delete(name); }, has(name) { return classes.has(name); },
    },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    appendChild(child) { this.children.push(child); child.parentElement = this; return child; },
    focus() {}, querySelector() { return null; }, closest() { return null; },
  };
}

function target(matches) {
  return { closest(selector) { return matches[selector] || null; } };
}

function executeClient(html, selectors = {}, singles = {}) {
  const scripts = html.match(/<script>const DATA = ([\s\S]*?);<\/script><script>([\s\S]*?)<\/script>/);
  assert.ok(scripts);
  const listeners = {};
  const document = {
    querySelectorAll(selector) { return selectors[selector] || []; },
    querySelector(selector) { return singles[selector] || null; },
    getElementById() { return null; },
    addEventListener(type, listener) { listeners[type] = listener; },
  };
  vm.runInNewContext(`const DATA = ${scripts[1]};${scripts[2]}`, { document, console });
  return {
    click(eventTarget) { listeners.click({ target: eventTarget }); },
    change(eventTarget) { listeners.change({ target: eventTarget }); },
    keydown(eventTarget, key) { listeners.keydown({ target: eventTarget, key, preventDefault() {} }); },
  };
}
