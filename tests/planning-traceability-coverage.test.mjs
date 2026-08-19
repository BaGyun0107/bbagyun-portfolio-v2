import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { buildTraceabilityCoverage } from '../.harness/scripts/docs/lib/build-traceability-coverage.mjs';
import { renderTraceabilityCoverageView } from '../.harness/scripts/docs/lib/render-traceability-coverage-view.mjs';
import { renderPlanningPage } from '../.harness/scripts/docs/lib/render-planning-page.mjs';

function sampleWorkspace() {
  return {
    id: 'demo', title: 'Demo', kind: 'demo',
    features: [
      { id: 'FEAT-FULL', title: '완결 기능', needIds: ['NEED-1'], screenIds: ['SCREEN-1'], flowIds: ['FLOW-1'], detailId: 'FEAT-FULL' },
      { id: 'FEAT-GAP', title: '누락 기능', needIds: [], screenIds: [], flowIds: [], detailId: 'FEAT-GAP' },
    ],
    featureDetails: [
      { id: 'FEAT-FULL', readiness: { ready: true }, acceptance: [{ id: 'AC-1', statement: '동작한다' }], traceability: { specIds: ['010-demo'] } },
      { id: 'FEAT-GAP', readiness: { ready: false, missing: ['states.errorRetry'] }, acceptance: [], traceability: {} },
    ],
    featureWorkItems: [
      { id: 'WORK-1', featureDefinitionId: 'FEAT-FULL', title: '구현', workType: 'frontend', releaseId: 'R1', status: 'done', taskRefs: ['specs/010/tasks.md'], acceptanceResults: [{ criterionId: 'AC-1', status: 'passed' }], evidenceRefs: ['tests/full.test.mjs'], blockingDecisions: [] },
    ],
    sitemap: { surfaces: [{ key: 'user', title: '사용자', nodes: [{ id: 'SCREEN-1', title: '화면 1' }, { id: 'SCREEN-EMPTY', title: '기능 없는 화면' }] }] },
    userFlows: { flows: [{ id: 'FLOW-1', title: '흐름 1', actor: 'member', goal: '완료한다', entryStepId: 's1', steps: [{ id: 's1', title: '시작', kind: 'start', screenIds: ['SCREEN-1'], featureIds: ['FEAT-FULL'], next: [] }] }] },
    planningManifest: { needs: [{ id: 'NEED-1', title: '요구 1' }] },
    deliveryEvidence: { features: [{ featureId: 'FEAT-FULL', deliveryStatus: 'verified' }] },
    linkedHub: { traceability: { configured: true, entities: [], links: [], health: { brokenLinks: [{ from: { type: 'feature', id: 'FEAT-GAP' }, to: { type: 'screen', id: 'SCREEN-MISSING' }, type: 'appears-on', reason: 'missing endpoint: screen:SCREEN-MISSING' }], duplicateLinks: [], orphans: {}, counts: { broken: 1, duplicate: 0, orphan: 0, flowBroken: 0, flowCycle: 0 } } } },
  };
}

test('coverage summary는 원인별 gap 명칭·심각도·복구 행동과 함께 정확한 수를 계산한다', () => {
  const coverage = buildTraceabilityCoverage(sampleWorkspace());

  assert.equal(coverage.summary.total, 2);
  assert.equal(coverage.summary.complete, 1);
  assert.equal(coverage.summary.evidenceMissing, 1);
  assert.equal(coverage.summary.broken, 1);

  assert.ok(coverage.gaps.length >= 3);
  for (const gap of coverage.gaps) {
    assert.ok(['critical', 'high', 'medium', 'low'].includes(gap.severity), `severity: ${gap.severity}`);
    assert.ok(typeof gap.type === 'string' && gap.type.length > 0);
    assert.ok(typeof gap.action === 'string' && gap.action.length > 0, 'gap마다 복구 행동이 있어야 한다');
  }
  const ranks = { critical: 0, high: 1, medium: 2, low: 3 };
  const order = coverage.gaps.map(({ severity }) => ranks[severity]);
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'gap은 severity 정렬이어야 한다');

  const types = coverage.gaps.map(({ type }) => type);
  assert.ok(types.includes('깨진 관계'));
  assert.ok(types.includes('정의 불완전'));
  assert.ok(types.includes('연결된 기능정의 없음'), '기능 없는 화면은 원인별 gap으로 노출한다');
  assert.ok(types.includes('구현 근거 미수집'));
  assert.ok(!types.includes('빈 화면'), 'FR-013: 빈 화면이라는 명칭을 쓰지 않는다');
});

test('typed satisfied-by/specified-by 관계를 coverage가 소비한다 (linked self-match는 제외)', () => {
  const workspace = {
    id: 'ws',
    features: [{ id: 'F-TYPED', title: 'typed 기능', screenIds: ['SCREEN-1'], flowIds: ['FLOW-X'] }],
    featureDetails: [],
    featureWorkItems: [{
      id: 'W-1', featureDefinitionId: 'F-TYPED', title: '작업', workType: 'backend',
      releaseId: 'R1', status: 'in-progress', taskRefs: [], evidenceRefs: ['src/x.ts'],
    }],
    sitemap: { surfaces: [{ key: 'user', title: '사용자', nodes: [{ id: 'SCREEN-1', title: '화면' }] }] },
    traceability: {
      entities: [],
      links: [
        { from: { type: 'need', id: 'NEED-T' }, to: { type: 'feature', id: 'F-TYPED' }, type: 'satisfied-by' },
        { from: { type: 'feature', id: 'F-TYPED' }, to: { type: 'spec', id: '099-spec' }, type: 'specified-by' },
      ],
    },
    linkedHub: {
      featureDetails: { 'F-TYPED': { rowId: 'F-TYPED', source: 'id', specId: '099-spec' } },
      traceability: { health: { brokenLinks: [], counts: {} } },
    },
  };
  const coverage = buildTraceabilityCoverage(workspace);
  const types = coverage.gaps.map((gap) => gap.type);
  assert.ok(!types.includes('요구 연결 없음'), '요구 연결 없음이 나오면 안 된다');
  assert.ok(!types.includes('Spec 연결 없음'), 'Spec 연결 없음이 나오면 안 된다');
  const row = coverage.matrixRows.find((entry) => entry.featureId === 'F-TYPED');
  assert.deepEqual(row.needIds, ['NEED-T']);
  assert.deepEqual(row.specIds, ['099-spec']);
});

test('bounded neighborhood는 선택 기능의 7종 국소 관계만 담고 다른 기능을 포함하지 않는다', () => {
  const coverage = buildTraceabilityCoverage(sampleWorkspace(), { selectedFeatureId: 'FEAT-FULL' });
  const nodeKeys = coverage.neighborhood.nodes.map(({ type, id }) => `${type}:${id}`);

  assert.equal(coverage.neighborhood.selectedFeatureId, 'FEAT-FULL');
  assert.ok(nodeKeys.includes('feature:FEAT-FULL'));
  assert.ok(nodeKeys.includes('need:NEED-1'));
  assert.ok(nodeKeys.includes('screen:SCREEN-1'));
  assert.ok(nodeKeys.includes('flow:FLOW-1'));
  assert.ok(nodeKeys.includes('spec:010-demo'));
  assert.ok(nodeKeys.includes('work-item:WORK-1'));
  assert.ok(nodeKeys.some((key) => key.startsWith('verification:')));
  assert.ok(!nodeKeys.includes('feature:FEAT-GAP'), '선택 깊이 밖 기능은 포함하지 않는다');
  assert.ok(!nodeKeys.includes('screen:SCREEN-EMPTY'), '연결 없는 화면은 neighborhood에 없다');
  for (const edge of coverage.neighborhood.edges) {
    assert.ok(nodeKeys.includes(`${edge.from.type}:${edge.from.id}`));
    assert.ok(nodeKeys.includes(`${edge.to.type}:${edge.to.id}`));
  }
});

test('matrixRows와 CSV는 보조 진단으로 전체 기능을 담고 결정적이다', () => {
  const workspace = sampleWorkspace();
  const first = buildTraceabilityCoverage(workspace);
  const second = buildTraceabilityCoverage(workspace);

  assert.equal(first.matrixRows.length, 2);
  assert.deepEqual(first, second, '같은 입력은 같은 결과여야 한다');
  assert.match(first.csv, /FEAT-FULL/);
  assert.match(first.csv, /FEAT-GAP/);
  assert.ok(first.csv.split('\n').length >= 3, 'header + 기능 행');
});

test('projection은 원본 workspace를 수정하지 않고 malformed 입력에 결정적으로 동작한다', () => {
  const workspace = sampleWorkspace();
  const before = structuredClone(workspace);
  buildTraceabilityCoverage(workspace, { selectedFeatureId: 'FEAT-FULL' });
  assert.deepEqual(workspace, before);

  const empty = buildTraceabilityCoverage(null);
  assert.equal(empty.summary.total, 0);
  assert.deepEqual(empty.gaps, []);
  assert.deepEqual(empty.neighborhood.nodes, []);

  const malformed = buildTraceabilityCoverage({ features: 'broken', featureWorkItems: null, sitemap: { surfaces: 'broken' } });
  assert.equal(malformed.summary.total, 0);
});

test('500 기능/2,000 작업 표본에서 coverage 수가 정확하고 neighborhood는 bounded다', () => {
  const features = Array.from({ length: 500 }, (_, index) => ({
    id: `FEAT-${String(index).padStart(4, '0')}`,
    title: `기능 ${index}`,
    needIds: index % 2 === 0 ? [`NEED-${index}`] : [],
    screenIds: [`SCREEN-${index % 100}`],
    flowIds: index % 5 === 0 ? ['FLOW-1'] : [],
    detailId: `FEAT-${String(index).padStart(4, '0')}`,
  }));
  const featureWorkItems = Array.from({ length: 2000 }, (_, index) => ({
    id: `WORK-${String(index).padStart(4, '0')}`,
    featureDefinitionId: `FEAT-${String(index % 500).padStart(4, '0')}`,
    title: `작업 ${index}`, workType: 'frontend', releaseId: 'R1', status: 'in-progress',
    taskRefs: [], acceptanceResults: [], evidenceRefs: [`tests/scale-${index}.mjs`], blockingDecisions: [],
  }));
  const screens = Array.from({ length: 100 }, (_, index) => ({ id: `SCREEN-${index}`, title: `화면 ${index}` }));
  const workspace = {
    id: 'scale', features, featureWorkItems,
    featureDetails: features.map(({ id }) => ({ id, readiness: { ready: true }, acceptance: [], traceability: { specIds: [`SPEC-${id}`] } })),
    sitemap: { surfaces: [{ key: 'user', title: '사용자', nodes: screens }] },
    userFlows: { flows: [{ id: 'FLOW-1', title: '흐름', actor: 'u', goal: 'g', entryStepId: 's', steps: [{ id: 's', title: 's', kind: 'start', next: [] }] }] },
    planningManifest: { needs: Array.from({ length: 250 }, (_, index) => ({ id: `NEED-${index * 2}`, title: `요구 ${index * 2}` })) },
    deliveryEvidence: { features: [] },
    linkedHub: { traceability: { configured: true, entities: [], links: [], health: { brokenLinks: [], duplicateLinks: [], orphans: {}, counts: { broken: 0, duplicate: 0, orphan: 0, flowBroken: 0, flowCycle: 0 } } } },
  };

  const startedAt = performance.now();
  const coverage = buildTraceabilityCoverage(workspace, { selectedFeatureId: 'FEAT-0000' });
  const duration = performance.now() - startedAt;

  assert.equal(coverage.summary.total, 500);
  assert.equal(coverage.summary.broken, 0);
  const flowGaps = coverage.gaps.filter(({ type }) => type === '흐름 연결 없음').length;
  assert.equal(flowGaps, 400, '흐름 미연결 기능 수가 정확히 일치해야 한다');
  const needGaps = coverage.gaps.filter(({ type }) => type === '요구 연결 없음').length;
  assert.equal(needGaps, 250);
  assert.ok(coverage.neighborhood.nodes.length <= 32, `선택 깊이 밖 관계망을 담지 않는다: ${coverage.neighborhood.nodes.length}`);
  assert.ok(duration < 1000, `coverage 계산이 상한을 넘었다: ${duration}ms`);
});

test('renderer는 coverage dashboard, gap queue, 국소 탐색기와 접힌 matrix/CSV를 렌더하고 hostile text를 escape한다', () => {
  const workspace = sampleWorkspace();
  const hostile = '<img src=x onerror="globalThis.attacked=1">';
  workspace.features[1].title = hostile;
  const html = renderTraceabilityCoverageView({ workspace, selectedFeatureId: 'FEAT-FULL' });

  assert.match(html, /data-traceability-coverage/);
  assert.match(html, /data-traceability-gap-queue/);
  assert.match(html, /data-gap-select="FEAT-GAP"/);
  assert.match(html, /data-traceability-neighborhood/);
  assert.match(html, /data-neighborhood-kind="need"/);
  assert.match(html, /data-neighborhood-kind="verification"/);
  assert.match(html, /<details[^>]*data-traceability-matrix/);
  assert.match(html, /<details[^>]*data-traceability-csv/);
  assert.doesNotMatch(html, /<details[^>]*data-traceability-matrix[^>]*open/);
  assert.match(html, /복구 행동|행동:/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x/);

  const emptyHtml = renderTraceabilityCoverageView({ workspace: { features: [] } });
  assert.match(emptyHtml, /추적성 대상 미수집/);
});

test('Planning page 추적성 view는 coverage가 기본이고 gap 선택이 기능 선택·국소 탐색을 공유한다', () => {
  const html = renderPlanningPage({ workspaceHub: { version: 1, defaultWorkspaceId: 'demo', workspaces: [sampleWorkspace()] } });

  const viewStart = html.indexOf('<section data-workspace-view="traceability"');
  const viewEnd = html.indexOf('<details class="planning-operations"');
  const traceabilityView = html.slice(viewStart, viewEnd);
  assert.match(traceabilityView, /data-traceability-coverage/);
  assert.match(traceabilityView, /data-traceability-gap-queue/);
  assert.match(traceabilityView, /data-traceability-neighborhood/);
  assert.match(traceabilityView, /<details[^>]*data-traceability-matrix/);

  const gapButton = fakeElement({ gapSelect: 'FEAT-GAP' });
  const definitionButton = fakeElement({ planningFeatureId: 'FEAT-GAP' });
  const neighborhood = fakeElement();
  const runtime = executeClient(html, {
    '[data-gap-select]': [gapButton],
    '[data-planning-feature-id]': [definitionButton],
  }, {
    '[data-traceability-neighborhood]': neighborhood,
  });

  runtime.click(target({ '[data-gap-select]': gapButton }));
  assert.equal(definitionButton.attributes['aria-pressed'], 'true', 'gap 선택은 공유 feature 선택을 갱신한다');
  assert.equal(gapButton.attributes['aria-pressed'], 'true');
  assert.match(neighborhood.innerHTML, /FEAT-GAP/, '선택 기능의 국소 관계를 다시 그린다');
});

test('coverage 화면 CSS는 gap severity 비색상 배지와 반응형 neighborhood grid 계약을 담는다', () => {
  const html = renderPlanningPage({ workspaceHub: { version: 1, defaultWorkspaceId: 'demo', workspaces: [sampleWorkspace()] } });
  const style = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] || '';

  assert.match(style, /\.traceability-coverage \{/);
  assert.match(style, /\.traceability-gap-queue \{/);
  assert.match(style, /\.gap-severity\[data-severity="critical"\]/);
  assert.match(style, /\.gap-severity\[data-severity="high"\]/);
  assert.match(style, /\.neighborhood-grid \{/);
  assert.match(html, /data-traceability-neighborhood aria-live="polite"/);
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
    input(eventTarget) { listeners.input({ target: eventTarget }); },
  };
}
