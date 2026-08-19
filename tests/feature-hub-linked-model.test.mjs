import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLinkedHubModel } from '../.harness/scripts/docs/lib/build-linked-hub-model.mjs';
import { buildWorkspaceHubModel } from '../.harness/scripts/docs/lib/build-workspace-hub-model.mjs';

const FEATURES = [
  {
    id: '003-sample',
    spec_link: 'specs/003-sample',
    spec_detail: { summary: '동일 ID 상세', userStories: [], edgeCases: [], functionalRequirements: [], successCriteria: [] },
    delivery: { nextAction: 'T002', verification: { recorded: true, done: 1, total: 2, percent: 50 } },
  },
  {
    id: '099-override',
    spec_link: 'specs/099-override',
    spec_detail: { summary: '명시 연결 상세', userStories: [], edgeCases: [], functionalRequirements: [], successCriteria: [] },
    delivery: { nextAction: null, verification: { recorded: true, done: 1, total: 1, percent: 100 } },
  },
];

const ROWS = [
  { Row_ID: '003-sample', Title: '자동 연결' },
  { Row_ID: 'EXT-001', Title: '명시 연결' },
  { Row_ID: 'NO-SPEC', Title: '미연결' },
];

test('linked-model: 같은 ID의 feature row와 spec을 자동 연결한다', () => {
  const model = buildLinkedHubModel({ features: FEATURES, rows: ROWS });
  assert.equal(model.featureDetails['003-sample'].source, 'id');
  assert.equal(model.featureDetails['003-sample'].specId, '003-sample');
  assert.equal(model.featureDetails['003-sample'].specDetail.summary, '동일 ID 상세');
});

test('linked-model: 명시적 specified-by가 ID 자동 연결보다 우선한다', () => {
  const traceability = {
    entities: [],
    links: [{
      from: { type: 'feature', id: 'EXT-001' },
      to: { type: 'spec', id: '099-override' },
      type: 'specified-by',
    }],
  };
  const model = buildLinkedHubModel({ features: FEATURES, rows: ROWS, traceability });
  assert.equal(model.featureDetails['EXT-001'].source, 'explicit');
  assert.equal(model.featureDetails['EXT-001'].specId, '099-override');
  assert.equal(model.featureDetails['EXT-001'].specDetail.summary, '명시 연결 상세');
});

const REVERSE_SPEC = {
  id: '100-reverse',
  featureId: 'EXT-001',
  spec_link: 'specs/100-reverse',
  spec_detail: { summary: '역방향 상세', userStories: [], edgeCases: [], functionalRequirements: [], successCriteria: [] },
  delivery: { nextAction: null, verification: { recorded: false, done: 0, total: 0, percent: 0 } },
};

test('linked-model: status.yaml featureId 역방향 연결이 ID 동일성보다 우선한다', () => {
  const model = buildLinkedHubModel({ features: [...FEATURES, REVERSE_SPEC], rows: ROWS });
  assert.equal(model.featureDetails['EXT-001'].source, 'reverse');
  assert.equal(model.featureDetails['EXT-001'].specId, '100-reverse');
  assert.equal(model.featureDetails['EXT-001'].specDetail.summary, '역방향 상세');
  assert.deepEqual(model.linkConflicts, []);
});

test('linked-model: planning 명시 연결이 역방향과 다르면 planning이 이기고 conflict를 남긴다', () => {
  const traceability = {
    entities: [],
    links: [{
      from: { type: 'feature', id: 'EXT-001' },
      to: { type: 'spec', id: '099-override' },
      type: 'specified-by',
    }],
  };
  const model = buildLinkedHubModel({ features: [...FEATURES, REVERSE_SPEC], rows: ROWS, traceability });
  assert.equal(model.featureDetails['EXT-001'].source, 'explicit');
  assert.equal(model.featureDetails['EXT-001'].specId, '099-override');
  assert.deepEqual(model.linkConflicts, [{
    code: 'spec-feature-link-conflict',
    featureId: 'EXT-001',
    planningSpecId: '099-override',
    reverseSpecId: '100-reverse',
  }]);
});

test('linked-model: needs/verificationIds 옵션이 registry에 등록되어 typed 관계가 검증된다', () => {
  const traceability = {
    entities: [],
    links: [
      { from: { type: 'need', id: 'NEED-R' }, to: { type: 'feature', id: 'EXT-001' }, type: 'satisfied-by' },
      { from: { type: 'feature', id: 'EXT-001' }, to: { type: 'verification', id: '099-override' }, type: 'verified-by' },
    ],
  };
  const model = buildLinkedHubModel({
    features: FEATURES,
    rows: ROWS,
    traceability,
    needs: [{ id: 'NEED-R', title: '요구 R' }],
    verificationIds: ['099-override'],
  });
  assert.deepEqual(model.traceability.health.brokenLinks, []);

  // FEATURES 픽스처의 099-override는 delivery 경로로 verification이 이미
  // 등록되므로, 옵션 없이 깨지는 것은 need 미등록 1건이다.
  const without = buildLinkedHubModel({ features: FEATURES, rows: ROWS, traceability });
  assert.equal(without.traceability.health.brokenLinks.length, 1);
  assert.equal(without.traceability.health.brokenLinks[0].from.type, 'need');
});

test('linked-model: 연결 spec이 없으면 행을 유지하고 미연결로 표시한다', () => {
  const model = buildLinkedHubModel({ features: FEATURES, rows: ROWS });
  assert.deepEqual(model.featureDetails['NO-SPEC'], {
    rowId: 'NO-SPEC',
    source: 'none',
    specId: null,
    specLink: null,
    specDetail: null,
    delivery: null,
  });
});

test('linked-model: endpoint를 검증하고 broken·duplicate·orphan health를 계산한다', () => {
  const sitemap = {
    version: 1,
    surfaces: [{ key: 'user', title: '사용자', nodes: [
      { id: 'U1-1', title: '로그인' },
      { id: 'U2', title: '빈 화면' },
    ] }],
  };
  const appearsOn = {
    from: { type: 'feature', id: '003-sample' },
    to: { type: 'screen', id: 'U1-1' },
    type: 'appears-on',
  };
  const traceability = {
    entities: [{ type: 'need', id: 'NEED-1', title: '검토 요구' }],
    links: [
      appearsOn,
      appearsOn,
      {
        from: { type: 'need', id: 'NEED-1' },
        to: { type: 'feature', id: 'MISSING' },
        type: 'satisfied-by',
      },
      {
        from: { type: 'feature', id: '003-sample' },
        to: { type: 'spec', id: '003-sample' },
        type: 'specified-by',
      },
    ],
  };
  const model = buildLinkedHubModel({ features: FEATURES, rows: ROWS, sitemap, traceability });
  assert.equal(model.traceability.configured, true);
  assert.equal(model.traceability.links.length, 2, '유효 중복은 첫 선언만 유지');
  assert.equal(model.traceability.health.brokenLinks.length, 1);
  assert.equal(model.traceability.health.duplicateLinks.length, 1);
  assert.ok(model.traceability.health.orphans.feature.some((entity) => entity.id === 'NO-SPEC'));
  assert.ok(model.traceability.health.orphans.screen.some((entity) => entity.id === 'U2'));
  assert.deepEqual(model.screenAssignments['003-sample'], ['U1-1']);
});

test('linked-model: relation 미설정은 orphan 0이 아니라 not-configured로 구분한다', () => {
  const model = buildLinkedHubModel({ features: FEATURES, rows: ROWS });
  assert.equal(model.traceability.configured, false);
  assert.equal(model.traceability.health.status, 'not-configured');
  assert.deepEqual(model.traceability.health.orphans.feature, []);
});

test('linked-model: flow의 screen/feature 연결과 broken 참조를 graph health에 합친다', () => {
  const sitemap = {
    version: 1,
    surfaces: [{ key: 'user', title: '사용자', nodes: [{ id: 'U1-1', title: '로그인' }] }],
  };
  const userFlows = {
    version: 1,
    flows: [{
      id: 'FLOW-1',
      title: '검토',
      actor: 'PM',
      goal: '검토한다',
      entryStepId: 'start',
      steps: [{
        id: 'start',
        title: '시작',
        kind: 'start',
        screenIds: ['U1-1', 'MISSING-SCREEN'],
        featureIds: ['003-sample', 'MISSING-FEATURE'],
        next: [],
      }],
    }],
    health: {
      brokenFlowEdges: [{ flowId: 'FLOW-1', from: 'start', to: 'missing', reason: 'broken next' }],
      flowCycles: [{ flowId: 'FLOW-1', from: 'start', to: 'start' }],
    },
  };
  const model = buildLinkedHubModel({ features: FEATURES, rows: ROWS, sitemap, userFlows });
  assert.equal(model.flowLinks.length, 2, '유효 screen/feature 연결만 유지');
  assert.equal(model.traceability.health.brokenFlowEdges.length, 3);
  assert.equal(model.traceability.health.flowCycles.length, 1);
  assert.ok(model.flowLinks.some((link) => link.to.type === 'screen' && link.to.id === 'U1-1'));
  assert.ok(model.flowLinks.some((link) => link.to.type === 'feature' && link.to.id === '003-sample'));
});

test('workspace adapter: 기존 v1 feature/sitemap/relation/flow를 변경 없이 workspace model로 감싼다', () => {
  const source = {
    id: 'harness-internal',
    title: 'Harness Internal',
    kind: 'internal',
    features: FEATURES,
    serviceDefinition: { rows: ROWS, columns: [], warning: '' },
    sitemap: { version: 1, surfaces: [{ key: 'user', title: '사용자', nodes: [{ id: 'U1-1', title: '로그인' }] }] },
    traceability: { version: 1, entities: [], links: [] },
    userFlows: { version: 1, flows: [] },
  };
  const before = JSON.stringify(source);
  const model = buildWorkspaceHubModel(source);
  assert.equal(JSON.stringify(source), before, 'legacy source를 mutation하지 않는다');
  assert.equal(model.id, 'harness-internal');
  assert.equal(model.features.length, FEATURES.length);
  assert.equal(model.sitemap.surfaces[0].nodes[0].id, 'U1-1');
  assert.equal(model.linkedHub.traceability.configured, true);
});
