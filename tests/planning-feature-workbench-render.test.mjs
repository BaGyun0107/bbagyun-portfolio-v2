import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { loadPlanningWorkspace } from '../.harness/scripts/docs/lib/build-workspace-hub-model.mjs';
import { renderPlanningPage } from '../.harness/scripts/docs/lib/render-planning-page.mjs';

const COMMUNITY_ROOT = fileURLToPath(new URL('../examples/community-app', import.meta.url));

function communityWorkspace() {
  return loadPlanningWorkspace({
    id: 'community-demo',
    title: 'Community Demo',
    kind: 'demo',
    badge: 'DEMO DATA',
    rootPath: COMMUNITY_ROOT,
    planningSource: 'planning',
    deliverySource: 'downstream',
  });
}

test('Community Demo 기능 정의는 placement-first 세 영역과 검색·rollup을 렌더한다', () => {
  const workspace = communityWorkspace();
  const html = renderPlanningPage({ workspaceHub: { defaultWorkspaceId: workspace.id, workspaces: [workspace] } });

  for (const marker of [
    'data-feature-definition-explorer',
    'data-feature-surface-screen-region',
    'data-feature-group-list-region',
    'data-feature-detail-region',
    'data-feature-screen="SCREEN-CREATE"',
    'data-feature-group="GROUP-PUBLISHING"',
    'data-placement-role="primary"',
    'data-placement-role="result"',
    'data-placement-role="support"',
    'data-feature-rollup="FEAT-POST-CREATE"',
  ]) assert.match(html, new RegExp(marker));
  assert.match(html, /기능명, 사용자 목표, 화면 검색/);
  assert.match(html, /기능 현황에서 보기/);
  assert.match(html, /frontend 1/);
  assert.match(html, /backend 1/);
  assert.match(html, /qa 1/);
  const postRow = html.match(/<button[^>]*data-planning-feature-id="FEAT-POST-CREATE"[\s\S]*?<\/button>/)?.[0] || '';
  const postRowContent = postRow.slice(postRow.indexOf('>') + 1);
  const ordered = ['게시물 작성 및 발행', 'GROUP-PUBLISHING', '주 화면 SCREEN-CREATE', 'frontend 1', 'Release R1', '우선순위 P1'];
  for (let index = 1; index < ordered.length; index += 1) {
    assert.ok(postRowContent.indexOf(ordered[index - 1]) < postRowContent.indexOf(ordered[index]), `${ordered[index - 1]} 다음에 ${ordered[index]} 표시`);
  }
});

test('client model은 legacy screenIds fallback과 기본 rollup을 순수하고 결정적으로 만든다', async () => {
  const { buildFeatureDefinitionClientModel } = await import('../.harness/scripts/docs/lib/render-feature-workbench-view.mjs');
  const source = {
    features: [{
      id: 'FEAT-LEGACY', title: 'Legacy', actor: 'member', userGoal: '안전하게 연다',
      featureGroupId: 'GROUP-A', placements: [{ screenId: '', role: 'primary' }, null],
      screenIds: ['SCREEN-A', 'SCREEN-B'], targetReleaseId: 'R2',
    }],
  };
  const before = structuredClone(source);
  const first = buildFeatureDefinitionClientModel(source);
  const second = buildFeatureDefinitionClientModel(source);

  assert.deepEqual(source, before);
  assert.deepEqual(first, second);
  assert.deepEqual(first[0].placements, [
    { screenId: 'SCREEN-A', role: 'primary' },
    { screenId: 'SCREEN-B', role: 'support' },
  ]);
  assert.equal(first[0].primaryScreenId, 'SCREEN-A');
  assert.equal(first[0].rollup.status, 'work-not-created');
  assert.equal(first[0].rollup.counts.total, 0);
  for (const term of ['legacy', '안전하게 연다', 'screen-a', 'group-a', 'r2']) {
    assert.match(first[0].searchText, new RegExp(term));
  }
  assert.deepEqual(buildFeatureDefinitionClientModel({ features: 'broken' }), []);
});

test('renderer는 hostile text와 empty/malformed placement를 실행 가능한 HTML로 만들지 않는다', async () => {
  const { renderFeatureDefinitionView } = await import('../.harness/scripts/docs/lib/render-feature-workbench-view.mjs');
  const hostile = '<img src=x onerror="globalThis.attacked=1">';
  const html = renderFeatureDefinitionView({ workspace: {
    features: [{ id: 'FEAT-X', title: hostile, placements: 'broken', screenIds: [] }],
    sitemap: { surfaces: 'broken' },
  } });
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x onerror=&quot;globalThis\.attacked=1&quot;&gt;/);
  assert.match(html, /화면 구조 미수집/);
  assert.match(html, /배치 미정/);
  assert.match(renderFeatureDefinitionView({ workspace: { features: [] } }), /연결된 기능 정의 없음/);
});

test('generated client는 screen·group·query를 필터하고 status 이동 시 feature ID를 공유한다', () => {
  const workspace = communityWorkspace();
  const html = renderPlanningPage({ workspaceHub: { defaultWorkspaceId: workspace.id, workspaces: [workspace] } });
  const post = fakeElement({ planningFeatureId: 'FEAT-POST-CREATE', featureScreens: '["SCREEN-CREATE","SCREEN-POST-DETAIL"]', featureGroup: 'GROUP-PUBLISHING', featureSearch: '게시물 작성 member screen-create group-publishing r1' });
  const reaction = fakeElement({ planningFeatureId: 'FEAT-REACTION', featureScreens: '["SCREEN-FEED","SCREEN-POST-DETAIL"]', featureGroup: 'GROUP-ENGAGEMENT', featureSearch: '좋아요 member screen-feed group-engagement r1' });
  const screen = fakeElement({ featureScreenSelect: 'SCREEN-CREATE' });
  const resultScreen = fakeElement({ featureScreenSelect: 'SCREEN-POST-DETAIL' });
  const group = fakeElement({ featureGroupFilter: 'true' });
  const query = fakeElement({ featureQuery: 'true' });
  const statusButton = fakeElement({ openFeatureStatus: 'FEAT-POST-CREATE' });
  const views = ['features', 'status'].map((key) => fakeElement({ workspaceView: key }));
  const viewButtons = ['features', 'status'].map((key) => fakeElement({ planningViewButton: key }));
  const statusFocus = fakeElement({ planningFeatureId: 'FEAT-POST-CREATE' });
  const runtime = executeClient(html, {
    '[data-feature-definition-row]': [post, reaction],
    '[data-feature-screen-select]': [screen, resultScreen],
    '[data-planning-feature-id]': [post, reaction, statusFocus],
    '[data-workspace-view="status"] [data-planning-feature-id]': [statusFocus],
    '[data-workspace-view]': views,
    '[data-planning-view-button]': viewButtons,
  }, {
    '[data-feature-group-filter]': group,
    '[data-feature-query]': query,
  });

  runtime.click(target({ '[data-feature-screen-select]': screen }));
  assert.equal(post.classList.has('hidden'), false);
  assert.equal(reaction.classList.has('hidden'), true);
  runtime.click(target({ '[data-feature-screen-select]': resultScreen }));
  group.value = 'GROUP-ENGAGEMENT';
  runtime.change(group);
  assert.equal(post.classList.has('hidden'), true);
  assert.equal(reaction.classList.has('hidden'), false);
  query.value = '게시물 작성';
  runtime.input(query);
  assert.equal(reaction.classList.has('hidden'), true);
  query.value = '좋아요';
  runtime.input(query);
  assert.equal(reaction.classList.has('hidden'), false);
  runtime.click(target({ '[data-open-feature-status]': statusButton }));
  assert.equal(statusFocus.attributes['aria-pressed'], 'true');
  assert.equal(viewButtons[1].attributes['aria-pressed'], 'true');
  assert.equal(statusFocus.focused, true);
});

test('generated client는 filter 결과가 0이면 이전 정의 상세를 숨기고 clear 시 유효 선택을 복구한다', () => {
  const html = renderPlanningPage({ workspaceHub: { defaultWorkspaceId: 'filters', workspaces: [{
    id: 'filters', title: 'Filters', sitemap: null, featureDetails: [],
    features: [
      { id: 'FEAT-A', title: 'Alpha', featureGroupId: 'GROUP-A', screenIds: ['SCREEN-A'] },
      { id: 'FEAT-B', title: 'Beta', featureGroupId: 'GROUP-B', screenIds: ['SCREEN-B'] },
    ],
  }] } });
  assert.match(html, /data-feature-selection-empty/);
  assert.match(html, /현재 필터에서 선택할 기능 정의가 없습니다/);

  const rowA = fakeElement({ planningFeatureId: 'FEAT-A', featureScreens: '["SCREEN-A"]', featureGroup: 'GROUP-A', featureSearch: 'alpha screen-a group-a' });
  const rowB = fakeElement({ planningFeatureId: 'FEAT-B', featureScreens: '["SCREEN-B"]', featureGroup: 'GROUP-B', featureSearch: 'beta screen-b group-b' });
  const detailA = fakeElement({ featureDefinitionDetail: 'FEAT-A' });
  const detailB = fakeElement({ featureDefinitionDetail: 'FEAT-B' });
  const statusDetailA = fakeElement({ statusFeatureDetail: 'FEAT-A' });
  const statusDetailB = fakeElement({ statusFeatureDetail: 'FEAT-B' });
  const screenA = fakeElement({ featureScreenSelect: 'SCREEN-A' });
  const screenB = fakeElement({ featureScreenSelect: 'SCREEN-B' });
  const screenMissing = fakeElement({ featureScreenSelect: 'SCREEN-MISSING' });
  const group = fakeElement({ featureGroupFilter: 'true' });
  const query = fakeElement({ featureQuery: 'true' });
  const listEmpty = fakeElement({ featureFilterEmpty: 'true' });
  const detailEmpty = fakeElement({ featureSelectionEmpty: 'true' });
  const openA = fakeElement({ openFeatureStatus: 'FEAT-A' });
  const openB = fakeElement({ openFeatureStatus: 'FEAT-B' });
  const runtime = executeClient(html, {
    '[data-feature-definition-row]': [rowA, rowB],
    '[data-feature-definition-detail]': [detailA, detailB],
    '[data-status-feature-detail]': [statusDetailA, statusDetailB],
    '[data-feature-screen-select]': [screenA, screenB, screenMissing],
    '[data-feature-filter-empty]': [listEmpty],
    '[data-feature-selection-empty]': [detailEmpty],
    '[data-open-feature-status]': [openA, openB],
    '[data-planning-feature-id]': [rowA, rowB],
  }, {
    '[data-feature-group-filter]': group,
    '[data-feature-query]': query,
  });

  function assertDefinitionEmpty() {
    assert.equal(detailA.classList.has('hidden'), true);
    assert.equal(detailB.classList.has('hidden'), true);
    assert.equal(listEmpty.classList.has('hidden'), false);
    assert.equal(detailEmpty.classList.has('hidden'), false);
    assert.equal(openA.disabled, true);
    assert.equal(openB.disabled, true);
  }

  runtime.click(target({ '[data-feature-screen-select]': screenMissing }));
  assertDefinitionEmpty();
  assert.equal(statusDetailA.classList.has('hidden'), false, '0건이어도 shared status feature 선택은 유지');
  runtime.click(target({ '[data-feature-screen-select]': screenA }));
  assert.equal(detailA.classList.has('hidden'), false);
  assert.equal(detailEmpty.classList.has('hidden'), true);
  assert.equal(openA.disabled, false);

  runtime.click(target({ '[data-feature-screen-select]': screenB }));
  group.value = 'GROUP-A';
  runtime.change(group);
  assertDefinitionEmpty();
  assert.equal(statusDetailB.classList.has('hidden'), false, 'group 0건이어도 최근 shared status 선택은 유지');
  group.value = '';
  runtime.change(group);
  assert.equal(detailB.classList.has('hidden'), false);

  query.value = 'no-result';
  runtime.input(query);
  assertDefinitionEmpty();
  query.value = '';
  runtime.input(query);
  assert.equal(detailB.classList.has('hidden'), false);
  assert.equal(detailEmpty.classList.has('hidden'), true);
});

test('기능 정의 boot는 전체 화면이 기본이고 그룹 필터 단독 변경은 카탈로그 전체에서 동작한다', () => {
  const html = renderPlanningPage({ workspaceHub: { defaultWorkspaceId: 'boot', workspaces: [{
    id: 'boot', title: 'Boot', featureDetails: [],
    sitemap: { surfaces: [{ key: 'user', title: 'User', nodes: [{ id: 'SCREEN-A', title: 'A' }, { id: 'SCREEN-B', title: 'B' }] }] },
    features: [
      { id: 'FEAT-A', title: 'Alpha', featureGroupId: 'GROUP-A', screenIds: ['SCREEN-A'] },
      { id: 'FEAT-B', title: 'Beta', featureGroupId: 'GROUP-B', screenIds: ['SCREEN-B'] },
    ],
  }] } });

  assert.match(html, /data-feature-screen-select=""[^>]*aria-pressed="true"[^>]*>전체 화면/);
  assert.doesNotMatch(html, /data-feature-screen-select="SCREEN-[^"]*"[^>]*aria-pressed="true"/);
  assert.doesNotMatch(html, /planning-feature-row[^"]* hidden/);

  const rowA = fakeElement({ planningFeatureId: 'FEAT-A', featureScreens: '["SCREEN-A"]', featureGroup: 'GROUP-A', featureSearch: 'alpha screen-a group-a' });
  const rowB = fakeElement({ planningFeatureId: 'FEAT-B', featureScreens: '["SCREEN-B"]', featureGroup: 'GROUP-B', featureSearch: 'beta screen-b group-b' });
  const clearScreen = fakeElement({ featureScreenSelect: '' });
  const screenA = fakeElement({ featureScreenSelect: 'SCREEN-A' });
  const group = fakeElement({ featureGroupFilter: 'true' });
  const runtime = executeClient(html, {
    '[data-feature-definition-row]': [rowA, rowB],
    '[data-feature-screen-select]': [clearScreen, screenA],
    '[data-planning-feature-id]': [rowA, rowB],
  }, {
    '[data-feature-group-filter]': group,
  });

  assert.equal(rowA.classList.has('hidden'), false, 'boot: 화면 필터 없이 모든 정의가 보인다');
  assert.equal(rowB.classList.has('hidden'), false, 'boot: 화면 필터 없이 모든 정의가 보인다');
  assert.equal(clearScreen.attributes['aria-pressed'], 'true', 'boot: 전체 화면이 선택 상태다');

  group.value = 'GROUP-B';
  runtime.change(group);
  assert.equal(rowA.classList.has('hidden'), true);
  assert.equal(rowB.classList.has('hidden'), false, '그룹 단독 변경은 화면과 무관하게 그룹 기능을 보여준다');

  runtime.click(target({ '[data-feature-screen-select]': screenA }));
  assert.equal(rowA.classList.has('hidden'), true, '선택 화면과 그룹 교집합이 0이면 숨긴다');
  assert.equal(rowB.classList.has('hidden'), true);
  runtime.click(target({ '[data-feature-screen-select]': clearScreen }));
  assert.equal(screenA.attributes['aria-pressed'], 'false');
  assert.equal(clearScreen.attributes['aria-pressed'], 'true');
  assert.equal(rowB.classList.has('hidden'), false, '전체 화면 복귀로 그룹 결과가 복구된다');
});

test('generated client는 workspace 왕복 시 유효한 feature 선택을 안전하게 재수화한다', () => {
  const html = renderPlanningPage({ workspaceHub: { defaultWorkspaceId: 'a', workspaces: [
    { id: 'a', title: 'A', features: [{ id: 'FEAT-A1', title: 'A1', screenIds: ['SCREEN-A'] }, { id: 'FEAT-A2', title: 'A2', screenIds: ['SCREEN-A'] }], featureWorkItems: [{ id: 'WORK-A1' }, { id: 'WORK-A2' }], featureDetails: [], sitemap: null },
    { id: 'b', title: 'B', features: [{ id: 'FEAT-B1', title: 'B1', screenIds: ['SCREEN-B'] }], featureWorkItems: [{ id: 'WORK-B1' }], featureDetails: [], sitemap: null },
  ] } });
  const buttons = ['FEAT-A1', 'FEAT-A2', 'FEAT-B1'].map((planningFeatureId) => fakeElement({ planningFeatureId }));
  const workButtons = ['WORK-A1', 'WORK-A2', 'WORK-B1'].map((workSelect) => fakeElement({ workSelect }));
  const body = fakeElement();
  body.innerHTML = 'A';
  const panel = fakeElement({ workspaceView: 'features' });
  panel.querySelector = () => body;
  const templateB = fakeElement({ workspaceTemplate: 'b', view: 'features' });
  templateB.innerHTML = 'B';
  const runtime = executeClient(html, {
    '[data-planning-feature-id]': buttons,
    '[data-work-select]': workButtons,
    '[data-work-record]': workButtons,
    '[data-workspace-view]': [panel],
  }, {
    'template[data-workspace-template="b"][data-view="features"]': templateB,
  });

  runtime.click(target({ '[data-planning-feature-id]': buttons[1] }));
  runtime.click(target({ '[data-work-select]': workButtons[1] }));
  runtime.change({ id: 'workspaceSelect', value: 'b', dataset: {} });
  assert.equal(buttons[2].attributes['aria-pressed'], 'true');
  assert.equal(workButtons[2].attributes['aria-pressed'], 'true');
  assert.equal(body.innerHTML, 'B');
  runtime.change({ id: 'workspaceSelect', value: 'a', dataset: {} });
  assert.equal(buttons[1].attributes['aria-pressed'], 'true');
  assert.equal(workButtons[1].attributes['aria-pressed'], 'true');
  assert.equal(body.innerHTML, 'A');
});

test('기능 현황은 네 base status 열에 FeatureWorkItem을 렌더하고 hold를 카드 조건으로 표시한다', async () => {
  const workspace = communityWorkspace();
  const html = renderPlanningPage({ workspaceHub: { defaultWorkspaceId: workspace.id, workspaces: [workspace] } });

  assert.equal((html.match(/data-kanban-column="/g) || []).length, 4);
  for (const status of ['planned', 'in-progress', 'in-review', 'done']) {
    assert.match(html, new RegExp(`data-kanban-column="${status}"`));
  }
  assert.doesNotMatch(html, /data-kanban-column="on-hold"/);
  for (const id of [
    'WORK-POST-CREATE-FRONTEND',
    'WORK-POST-CREATE-BACKEND',
    'WORK-POST-CREATE-QA',
  ]) {
    assert.match(html, new RegExp(`data-work-item-id="${id}"`));
  }
  assert.equal((html.match(/data-work-item-feature="FEAT-POST-CREATE"/g) || []).length, 3);
  for (const marker of [
    'data-feature-status-context',
    'data-status-view="kanban"',
    'data-status-view="feature-grouped"',
    'data-status-view-select="kanban"',
    'data-status-view-select="feature-grouped"',
    'data-work-release-filter',
    'data-work-group-filter',
    'data-work-type-filter',
    'data-work-hold-filter',
    'data-work-query',
    'data-return-feature-definition',
  ]) assert.match(html, new RegExp(marker));
  for (const label of ['주 화면', '기능 그룹', 'Target Release', 'Task', 'Acceptance', 'Evidence', 'Blocker']) {
    assert.match(html, new RegExp(label));
  }

  const { buildFeatureStatusClientModel, renderFeatureStatusView } = await import('../.harness/scripts/docs/lib/render-feature-workbench-view.mjs');
  const hostile = '<img src=x onerror="globalThis.attacked=1">';
  const source = {
    features: [{
      id: 'FEAT-X', title: 'Feature X', featureGroupId: 'GROUP-X', targetReleaseId: 'R1',
      placements: [{ screenId: 'SCREEN-X', role: 'primary' }],
    }],
    featureWorkItems: [{
      id: 'WORK-X', featureDefinitionId: 'FEAT-X', title: hostile, workType: 'qa', releaseId: 'R1', status: 'done',
      hold: { active: true, reason: '결정 대기', releaseCondition: '승인 완료' },
      taskRefs: ['tasks.md#x'], tasks: { done: 0, total: 1 },
      requiredAcceptanceCriterionIds: ['AC-X'], acceptanceResults: [{ criterionId: 'AC-X', status: 'pending' }],
      evidenceRefs: [], blockingDecisions: ['DECISION-X'],
    }],
  };
  const before = structuredClone(source);
  const first = buildFeatureStatusClientModel(source);
  const second = buildFeatureStatusClientModel(source);
  const hostileHtml = renderFeatureStatusView({ workspace: source });

  assert.deepEqual(source, before);
  assert.deepEqual(first, second);
  assert.equal(first[0].requestedStatus, 'done');
  assert.equal(first[0].status, 'in-review');
  assert.equal(first[0].blockedDone, true);
  assert.match(hostileHtml, /data-work-item-hold="true"/);
  assert.match(hostileHtml, /완료 차단/);
  assert.match(hostileHtml, /결정 대기/);
  assert.match(hostileHtml, /승인 완료/);
  assert.doesNotMatch(hostileHtml, /<img src=x/);
  assert.match(hostileHtml, /&lt;img src=x onerror=&quot;globalThis\.attacked=1&quot;&gt;/);
});

test('미등록 기능 work item은 미등록 묶음으로 표시되고 stub 등록 안내가 나온다', async () => {
  const { buildFeatureStatusClientModel, renderFeatureStatusView } = await import('../.harness/scripts/docs/lib/render-feature-workbench-view.mjs');
  const workspace = {
    features: [{ id: 'FEAT-KNOWN', title: '정식 기능', featureGroupId: 'GROUP-K' }],
    featureWorkItems: [
      {
        id: 'WORK-KNOWN', featureDefinitionId: 'FEAT-KNOWN', title: '정식 작업',
        workType: 'backend', releaseId: 'R1', status: 'planned',
        taskRefs: [], evidenceRefs: [], source: 'explicit',
      },
      {
        id: 'WORK-ORPHAN', featureDefinitionId: 'FEAT-NOT-YET', title: '먼저 구현한 작업',
        workType: 'frontend', releaseId: 'R1', status: 'in-progress',
        taskRefs: [], evidenceRefs: [], source: 'explicit', registered: false,
      },
    ],
  };

  const records = buildFeatureStatusClientModel(workspace);
  assert.deepEqual(records.map(({ id }) => id), ['WORK-KNOWN', 'WORK-ORPHAN']);
  const orphan = records.find(({ id }) => id === 'WORK-ORPHAN');
  assert.equal(orphan.unregistered, true);
  assert.equal(orphan.featureTitle, '미등록 기능');

  const html = renderFeatureStatusView({ workspace });
  assert.match(html, /미등록 기능 1건/);
  assert.match(html, /feature:stub/);
  assert.match(html, /data-work-item-unregistered="true"/);
});

test('Acceptance 요약은 required criterion 교집합을 criterionId별 한 번만 집계한다', async () => {
  const { buildFeatureStatusClientModel, renderFeatureStatusView } = await import('../.harness/scripts/docs/lib/render-feature-workbench-view.mjs');
  const workspace = {
    features: [{ id: 'FEAT-AC', title: 'Acceptance', featureGroupId: 'GROUP-AC' }],
    featureWorkItems: [{
      id: 'WORK-AC', featureDefinitionId: 'FEAT-AC', title: 'Acceptance 검증', workType: 'qa', releaseId: 'R1', status: 'in-review',
      taskRefs: [], evidenceRefs: [], requiredAcceptanceCriterionIds: ['AC-1'],
      acceptanceResults: [
        { criterionId: 'AC-1', status: 'passed' },
        { criterionId: 'AC-1', status: 'passed' },
        { criterionId: 'AC-EXTRA', status: 'passed' },
        { criterionId: '', status: 'passed' },
        null,
      ],
    }],
  };

  const records = buildFeatureStatusClientModel(workspace);
  const html = renderFeatureStatusView({ workspace });

  assert.deepEqual(records[0].acceptanceResults, [
    { criterionId: 'AC-1', status: 'passed' },
    { criterionId: 'AC-EXTRA', status: 'passed' },
  ]);
  assert.match(html, /1\/1 passed/);
  assert.doesNotMatch(html, /[234]\/1 passed/);
});

test('2,000 work items는 단일 카드 노드 집합과 단일 선택 상세 패널로 2초 안에 렌더된다', async () => {
  const { renderFeatureStatusView } = await import('../.harness/scripts/docs/lib/render-feature-workbench-view.mjs');
  const features = Array.from({ length: 20 }, (_, index) => ({
    id: `FEAT-${index}`, title: `Feature ${index}`, featureGroupId: `GROUP-${index % 4}`,
  }));
  const featureWorkItems = Array.from({ length: 2_000 }, (_, index) => ({
    id: `WORK-${index}`, featureDefinitionId: `FEAT-${index % features.length}`, title: `Work ${index}`,
    workType: ['frontend', 'backend', 'qa', 'infra'][index % 4], releaseId: `R${index % 3}`, status: ['planned', 'in-progress', 'in-review'][index % 3],
    taskRefs: [], evidenceRefs: [],
  }));
  const startedAt = performance.now();
  const html = renderFeatureStatusView({ workspace: { features, featureWorkItems } });
  const elapsed = performance.now() - startedAt;

  assert.ok(elapsed < 2_000, `2,000 item render ${elapsed.toFixed(1)}ms`);
  assert.equal((html.match(/data-(?:grouped-)?work-item-id="/g) || []).length, 2_000);
  assert.equal((html.match(/data-work-item-detail(?=[\s>])/g) || []).length, 1);
  assert.equal((html.match(/data-grouped-work-items="/g) || []).length, features.length);

  const cards = featureWorkItems.map((item) => fakeElement({
    workItemId: item.id, workSelect: item.id, workItemFeature: item.featureDefinitionId,
    workStatus: item.status, workRelease: item.releaseId, workGroup: `GROUP-${Number(item.featureDefinitionId.split('-')[1]) % 4}`,
    workType: item.workType, workHold: 'false', workSearch: item.title.toLowerCase(), workDetailTitle: item.title,
  }));
  const statusContainers = ['planned', 'in-progress', 'in-review', 'done'].map((statusWorkItems) => fakeElement({ statusWorkItems }));
  const groupedContainers = features.map((feature) => fakeElement({ groupedWorkItems: feature.id }));
  const statusViews = [fakeElement({ statusView: 'kanban' }), fakeElement({ statusView: 'feature-grouped' })];
  const statusButtons = [fakeElement({ statusViewSelect: 'kanban' }), fakeElement({ statusViewSelect: 'feature-grouped' })];
  const interactionStartedAt = performance.now();
  const page = renderPlanningPage({ workspaceHub: { defaultWorkspaceId: 'large', workspaces: [{ id: 'large', features, featureWorkItems }] } });
  const runtime = executeClient(page, {
    '[data-work-item-id]': cards,
    '[data-work-select]': cards,
    '[data-work-record]': cards,
    '[data-status-work-items]': statusContainers,
    '[data-grouped-work-items]': groupedContainers,
    '[data-status-view]': statusViews,
    '[data-status-view-select]': statusButtons,
  }, { '[data-work-item-detail]': fakeElement() });
  runtime.click(target({ '[data-status-view-select]': statusButtons[1] }));
  assert.equal(groupedContainers.reduce((sum, container) => sum + container.children.length, 0), 2_000);
  runtime.click(target({ '[data-status-view-select]': statusButtons[0] }));
  assert.equal(statusContainers.reduce((sum, container) => sum + container.children.length, 0), 2_000);
  const interactionElapsed = performance.now() - interactionStartedAt;
  assert.ok(interactionElapsed < 2_000, `2,000 item render/interaction ${interactionElapsed.toFixed(1)}ms`);
});

test('generated client는 feature 선택과 work-item 선택을 분리하고 공통 필터와 보기 전환의 빈 상태를 관리한다', () => {
  const html = renderPlanningPage({ workspaceHub: { defaultWorkspaceId: 'work', workspaces: [{
    id: 'work', title: 'Work', sitemap: null, featureDetails: [],
    features: [
      { id: 'FEAT-A', title: 'Alpha', featureGroupId: 'GROUP-A', targetReleaseId: 'R1', screenIds: ['SCREEN-A'] },
      { id: 'FEAT-B', title: 'Beta', featureGroupId: 'GROUP-B', targetReleaseId: 'R2', screenIds: ['SCREEN-B'] },
    ],
    featureWorkItems: [
      { id: 'WORK-A1', featureDefinitionId: 'FEAT-A', title: 'Alpha front', workType: 'frontend', releaseId: 'R1', status: 'planned', taskRefs: [], evidenceRefs: [], source: 'explicit' },
      { id: 'WORK-A2', featureDefinitionId: 'FEAT-A', title: 'Alpha QA', workType: 'qa', releaseId: 'R2', status: 'in-review', taskRefs: [], evidenceRefs: [], source: 'explicit' },
      { id: 'WORK-B1', featureDefinitionId: 'FEAT-B', title: 'Beta backend', workType: 'backend', releaseId: 'R1', status: 'in-progress', taskRefs: [], evidenceRefs: [], source: 'explicit' },
    ],
  }] } });
  assert.match(html, /selectedFeatureDefinitionId/);
  assert.match(html, /selectedWorkItemId/);

  const definitionA = fakeElement({ planningFeatureId: 'FEAT-A' });
  const definitionB = fakeElement({ planningFeatureId: 'FEAT-B' });
  const openStatus = fakeElement({ openFeatureStatus: 'FEAT-A' });
  const workA1 = fakeElement({ workItemId: 'WORK-A1', workSelect: 'WORK-A1', workItemFeature: 'FEAT-A', workStatus: 'planned', workRelease: 'R1', workGroup: 'GROUP-A', workType: 'frontend', workHold: 'false', workSearch: 'work-a1 alpha front feat-a group-a r1 frontend', workDetailTitle: 'Alpha front' });
  const workA2 = fakeElement({ workItemId: 'WORK-A2', workSelect: 'WORK-A2', workItemFeature: 'FEAT-A', workStatus: 'in-review', workRelease: 'R2', workGroup: 'GROUP-A', workType: 'qa', workHold: 'false', workSearch: 'work-a2 alpha qa feat-a group-a r2 qa', workDetailTitle: 'Alpha QA' });
  const workB1 = fakeElement({ workItemId: 'WORK-B1', workSelect: 'WORK-B1', workItemFeature: 'FEAT-B', workStatus: 'in-progress', workRelease: 'R1', workGroup: 'GROUP-B', workType: 'backend', workHold: 'false', workSearch: 'work-b1 beta backend feat-b group-b r1 backend', workDetailTitle: 'Beta backend' });
  const detail = fakeElement();
  const detailTitle = fakeElement();
  const groupedA = fakeElement({ groupedWorkItems: 'FEAT-A' });
  const groupedB = fakeElement({ groupedWorkItems: 'FEAT-B' });
  const plannedItems = fakeElement({ statusWorkItems: 'planned' });
  const progressItems = fakeElement({ statusWorkItems: 'in-progress' });
  const reviewItems = fakeElement({ statusWorkItems: 'in-review' });
  const contextA = fakeElement({ statusFeatureContext: 'FEAT-A' });
  const contextB = fakeElement({ statusFeatureContext: 'FEAT-B' });
  const kanban = fakeElement({ statusView: 'kanban' });
  const grouped = fakeElement({ statusView: 'feature-grouped' });
  const kanbanButton = fakeElement({ statusViewSelect: 'kanban' });
  const groupedButton = fakeElement({ statusViewSelect: 'feature-grouped' });
  const workEmpty = fakeElement({ workFilterEmpty: 'true' });
  const detailEmpty = fakeElement({ workSelectionEmpty: 'true' });
  const release = fakeElement({ workReleaseFilter: 'true' });
  const group = fakeElement({ workGroupFilter: 'true' });
  const workType = fakeElement({ workTypeFilter: 'true' });
  const hold = fakeElement({ workHoldFilter: 'true' });
  const query = fakeElement({ workQuery: 'true' });
  const returnDefinition = fakeElement({ returnFeatureDefinition: 'true' });
  const views = ['features', 'status'].map((key) => fakeElement({ workspaceView: key }));
  const viewButtons = ['features', 'status'].map((key) => fakeElement({ planningViewButton: key }));
  const runtime = executeClient(html, {
    '[data-planning-feature-id]': [definitionA, definitionB],
    '[data-status-feature-context]': [contextA, contextB],
    '[data-work-item-id]': [workA1, workA2, workB1],
    '[data-work-select]': [workA1, workA2, workB1],
    '[data-work-record]': [workA1, workA2, workB1],
    '[data-grouped-work-items]': [groupedA, groupedB],
    '[data-status-work-items]': [plannedItems, progressItems, reviewItems],
    '[data-status-view]': [kanban, grouped],
    '[data-status-view-select]': [kanbanButton, groupedButton],
    '[data-work-filter-empty]': [workEmpty],
    '[data-work-selection-empty]': [detailEmpty],
    '[data-workspace-view]': views,
    '[data-planning-view-button]': viewButtons,
    '[data-workspace-view="status"] [data-work-item-id]': [workA1, workA2, workB1],
  }, {
    '[data-work-release-filter]': release,
    '[data-work-group-filter]': group,
    '[data-work-type-filter]': workType,
    '[data-work-hold-filter]': hold,
    '[data-work-query]': query,
    '[data-work-item-detail]': detail,
    '[data-work-item-detail] [data-work-detail-title]': detailTitle,
  });

  runtime.click(target({ '[data-open-feature-status]': openStatus }));
  assert.equal(contextA.classList.has('hidden'), false);
  assert.equal(viewButtons[1].attributes['aria-pressed'], 'true');
  runtime.click(target({ '[data-work-select]': workA2 }));
  assert.equal(workA2.attributes['aria-pressed'], 'true');
  assert.equal(detail.classList.has('hidden'), false);
  assert.equal(detailTitle.textContent, 'Alpha QA');
  assert.equal(definitionA.attributes['aria-pressed'], 'true', 'work 선택은 feature 선택을 바꾸지 않음');

  release.value = 'R1';
  runtime.change(release);
  assert.equal(workA1.classList.has('hidden'), false);
  assert.equal(workA2.classList.has('hidden'), true);
  assert.equal(workB1.classList.has('hidden'), true, '기본 범위는 선택 기능이므로 다른 기능 카드는 숨긴다');
  assert.equal(detail.classList.has('hidden'), false, '필터 후 첫 visible work 상세를 선택');
  assert.equal(detailTitle.textContent, 'Alpha front');

  runtime.click(target({ '[data-status-view-select]': groupedButton }));
  assert.equal(grouped.classList.has('hidden'), false);
  assert.equal(kanban.classList.has('hidden'), true);
  assert.equal(groupedButton.attributes['aria-pressed'], 'true');
  assert.deepEqual(groupedA.children, [workA1, workA2]);
  assert.deepEqual(groupedB.children, [workB1]);

  query.value = 'no-results';
  runtime.input(query);
  assert.equal(workEmpty.classList.has('hidden'), false);
  assert.equal(detailEmpty.classList.has('hidden'), false);
  assert.equal(detail.classList.has('hidden'), true);

  query.value = '';
  runtime.input(query);
  runtime.click(target({ '[data-status-view-select]': kanbanButton }));
  assert.deepEqual(plannedItems.children, [workA1]);
  runtime.click(target({ '[data-return-feature-definition]': returnDefinition }));
  assert.equal(viewButtons[0].attributes['aria-pressed'], 'true');
  assert.equal(definitionA.attributes['aria-pressed'], 'true', '정의 화면으로 돌아가도 feature ID 유지');
});

test('Kanban은 선택 기능 범위가 기본이고 전체 작업 보기는 명시 전환·라벨로 제공한다', () => {
  const html = renderPlanningPage({ workspaceHub: { defaultWorkspaceId: 'scope', workspaces: [{
    id: 'scope', title: 'Scope', sitemap: null, featureDetails: [],
    features: [
      { id: 'FEAT-A', title: 'Alpha', featureGroupId: 'GROUP-A', targetReleaseId: 'R1', screenIds: ['SCREEN-A'] },
      { id: 'FEAT-B', title: 'Beta', featureGroupId: 'GROUP-B', targetReleaseId: 'R2', screenIds: ['SCREEN-B'] },
    ],
    featureWorkItems: [
      { id: 'WORK-A1', featureDefinitionId: 'FEAT-A', title: 'Alpha front', workType: 'frontend', releaseId: 'R1', status: 'planned', taskRefs: [], evidenceRefs: [], source: 'explicit' },
      { id: 'WORK-A2', featureDefinitionId: 'FEAT-A', title: 'Alpha QA', workType: 'qa', releaseId: 'R2', status: 'in-review', taskRefs: [], evidenceRefs: [], source: 'explicit' },
      { id: 'WORK-B1', featureDefinitionId: 'FEAT-B', title: 'Beta backend', workType: 'backend', releaseId: 'R1', status: 'in-progress', taskRefs: [], evidenceRefs: [], source: 'explicit' },
    ],
  }] } });

  assert.match(html, /data-work-scope-select="feature"[^>]*aria-pressed="true"/);
  assert.match(html, /data-work-scope-select="all"[^>]*aria-pressed="false"/);
  assert.match(html, /data-work-scope-label/);
  assert.match(html, /전체 작업/);

  const definitionA = fakeElement({ planningFeatureId: 'FEAT-A' });
  const definitionB = fakeElement({ planningFeatureId: 'FEAT-B' });
  const workA1 = fakeElement({ workItemId: 'WORK-A1', workSelect: 'WORK-A1', workItemFeature: 'FEAT-A', workStatus: 'planned', workRelease: 'R1', workGroup: 'GROUP-A', workType: 'frontend', workHold: 'false', workSearch: 'work-a1 alpha front', workDetailTitle: 'Alpha front' });
  const workA2 = fakeElement({ workItemId: 'WORK-A2', workSelect: 'WORK-A2', workItemFeature: 'FEAT-A', workStatus: 'in-review', workRelease: 'R2', workGroup: 'GROUP-A', workType: 'qa', workHold: 'false', workSearch: 'work-a2 alpha qa', workDetailTitle: 'Alpha QA' });
  const workB1 = fakeElement({ workItemId: 'WORK-B1', workSelect: 'WORK-B1', workItemFeature: 'FEAT-B', workStatus: 'in-progress', workRelease: 'R1', workGroup: 'GROUP-B', workType: 'backend', workHold: 'false', workSearch: 'work-b1 beta backend', workDetailTitle: 'Beta backend' });
  const scopeFeatureButton = fakeElement({ workScopeSelect: 'feature' });
  const scopeAllButton = fakeElement({ workScopeSelect: 'all' });
  const scopeLabel = fakeElement({ workScopeLabel: 'true' });
  const release = fakeElement({ workReleaseFilter: 'true' });
  const runtime = executeClient(html, {
    '[data-planning-feature-id]': [definitionA, definitionB],
    '[data-work-item-id]': [workA1, workA2, workB1],
    '[data-work-select]': [workA1, workA2, workB1],
    '[data-work-record]': [workA1, workA2, workB1],
    '[data-work-scope-select]': [scopeFeatureButton, scopeAllButton],
  }, {
    '[data-work-release-filter]': release,
    '[data-work-scope-label]': scopeLabel,
  });

  assert.equal(workA1.classList.has('hidden'), false, '기본 범위: 선택 기능 FEAT-A의 카드는 보인다');
  assert.equal(workA2.classList.has('hidden'), false);
  assert.equal(workB1.classList.has('hidden'), true, '기본 범위: 다른 기능 카드는 숨긴다');
  assert.match(scopeLabel.textContent, /FEAT-A/);

  runtime.click(target({ '[data-work-scope-select]': scopeAllButton }));
  assert.equal(scopeAllButton.attributes['aria-pressed'], 'true');
  assert.equal(scopeFeatureButton.attributes['aria-pressed'], 'false');
  assert.equal(workB1.classList.has('hidden'), false, '전체 작업 전환 시 모든 기능 카드가 보인다');
  assert.match(scopeLabel.textContent, /전체 작업/);

  release.value = 'R2';
  runtime.change(release);
  assert.equal(workA1.classList.has('hidden'), true);
  assert.equal(workA2.classList.has('hidden'), false, '전체 범위에서도 Release 필터는 결합 동작한다');
  assert.equal(workB1.classList.has('hidden'), true);
  release.value = '';
  runtime.change(release);

  runtime.click(target({ '[data-work-scope-select]': scopeFeatureButton }));
  assert.equal(scopeFeatureButton.attributes['aria-pressed'], 'true');
  assert.equal(workB1.classList.has('hidden'), true, '선택 기능 범위로 복귀');

  runtime.click(target({ '[data-planning-feature-id]': definitionB }));
  assert.equal(workA1.classList.has('hidden'), true, '기능 선택 변경 시 보드 카드가 따라 필터된다');
  assert.equal(workA2.classList.has('hidden'), true);
  assert.equal(workB1.classList.has('hidden'), false);
  assert.match(scopeLabel.textContent, /FEAT-B/);
});

test('planning CSS는 900px/600px breakpoint, 44px 컨트롤, sticky 보드 header와 bounded 카드 렌더 계약을 담는다', () => {
  const html = renderPlanningPage({ workspaceHub: { defaultWorkspaceId: 'css', workspaces: [{
    id: 'css', title: 'CSS', sitemap: null, featureDetails: [],
    features: [{ id: 'FEAT-A', title: 'A' }],
    featureWorkItems: [{ id: 'WORK-A', featureDefinitionId: 'FEAT-A', title: '작업', workType: 'frontend', releaseId: 'R1', status: 'planned', taskRefs: [], evidenceRefs: [], source: 'explicit' }],
  }] } });
  const style = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] || '';

  assert.match(style, /@media \(max-width: 900px\)/);
  assert.match(style, /@media \(max-width: 600px\) \{[\s\S]*?min-height: 44px/);
  assert.match(style, /\.skip-link/);
  assert.match(style, /\.feature-status-workbench \{/);
  assert.match(style, /\.feature-status-board > header \{[^}]*position: sticky/);
  assert.match(style, /\.feature-work-item-card \{[^}]*content-visibility: auto/);
  assert.match(html, /<a class="skip-link" href="#planningMain">/);
  assert.match(html, /id="planningMain"/);
  assert.match(html, /data-work-scope-label role="status" aria-live="polite"/);
});

function fakeElement(dataset = {}) {
  const classes = new Set();
  const element = {
    dataset: { ...dataset }, attributes: {}, value: '', innerHTML: '', textContent: '', focused: false, disabled: false, children: [], parentElement: null,
    classList: {
      toggle(name, force) { if (force) classes.add(name); else classes.delete(name); },
      add(name) { classes.add(name); }, remove(name) { classes.delete(name); }, has(name) { return classes.has(name); },
    },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    appendChild(child) {
      if (child.parentElement) child.parentElement.children = child.parentElement.children.filter((item) => item !== child);
      this.children.push(child);
      child.parentElement = this;
      return child;
    },
    focus() { this.focused = true; },
    querySelector() { return null; }, closest() { return null; },
  };
  return element;
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
    input(eventTarget) { listeners.input({ target: eventTarget }); },
    change(eventTarget) { listeners.change({ target: eventTarget }); },
  };
}
