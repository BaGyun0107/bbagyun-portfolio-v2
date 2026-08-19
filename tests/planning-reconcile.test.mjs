import test from 'node:test';
import assert from 'node:assert/strict';

import { reconcilePlanningDelivery } from '../.harness/scripts/docs/lib/reconcile-planning-delivery.mjs';

const digest = `sha256:${'c'.repeat(64)}`;
const manifest = {
  projectId: 'community-app',
  digest,
  features: [
    { id: 'FEAT-A', owner: 'product', rules: { limit: 10 } },
    { id: 'FEAT-B', owner: 'product' },
    { id: 'FEAT-C', owner: 'product' },
    { id: 'FEAT-D', owner: 'product', rules: { mode: 'strict' } },
  ],
};
const lock = { projectId: 'community-app', digest, appliedState: 'applied' };

function evidence(features) {
  return { projectId: 'community-app', consumedManifestDigest: digest, sourceRevision: 'downstream-1', features };
}

test('aligned, behind, drifted, conflicted 상태와 evidence-backed proposal을 계산한다', () => {
  const manifestBefore = structuredClone(manifest);
  const delivery = evidence([
    { featureId: 'FEAT-A', deliveryStatus: 'verified', facts: [{ fieldPath: 'rules.limit', value: 10, certainty: 'observed', source: 'test:a' }] },
    { featureId: 'FEAT-C', deliveryStatus: 'in-progress', facts: [{ fieldPath: 'summary', plannedValue: 'planned', value: 'observed', certainty: 'observed', source: 'src:c' }] },
    { featureId: 'FEAT-D', deliveryStatus: 'in-progress', facts: [{ fieldPath: 'rules.mode', plannedValue: 'relaxed', value: 'legacy', conflict: true, certainty: 'observed', source: 'src:d' }] },
  ]);
  const deliveryBefore = structuredClone(delivery);
  const result = reconcilePlanningDelivery({ workspaceId: 'demo', manifest, lock, evidence: delivery });

  assert.equal(result.featureResults.find((item) => item.featureId === 'FEAT-A').status, 'aligned');
  assert.equal(result.featureResults.find((item) => item.featureId === 'FEAT-B').status, 'behind');
  assert.equal(result.featureResults.find((item) => item.featureId === 'FEAT-C').status, 'drifted');
  assert.equal(result.featureResults.find((item) => item.featureId === 'FEAT-D').status, 'conflicted');
  assert.equal(result.status, 'conflicted');
  const proposal = result.proposals.find((item) => item.entity.id === 'FEAT-C');
  assert.equal(proposal.fieldPath, 'summary');
  assert.equal(proposal.plannedValue, 'planned');
  assert.equal(proposal.observedValue, 'observed');
  assert.equal(proposal.status, 'open');
  assert.equal(proposal.evidence[0].source, 'src:c');
  assert.deepEqual(manifest, manifestBefore);
  assert.deepEqual(delivery, deliveryBefore);
});

test('work-item 상태와 근거 변화는 기존 planning drift lifecycle을 바꾸지 않는다', () => {
  const legacyFeatures = [
    { featureId: 'FEAT-A', deliveryStatus: 'verified', facts: [{ fieldPath: 'rules.limit', value: 10, certainty: 'observed', source: 'test:a' }] },
    { featureId: 'FEAT-C', deliveryStatus: 'in-progress', facts: [{ fieldPath: 'summary', plannedValue: 'planned', value: 'observed', certainty: 'observed', source: 'src:c' }] },
    { featureId: 'FEAT-D', deliveryStatus: 'in-progress', facts: [{ fieldPath: 'rules.mode', plannedValue: 'relaxed', value: 'legacy', conflict: true, certainty: 'observed', source: 'src:d' }] },
  ];
  const before = evidence(legacyFeatures);
  before.workItems = [{
    id: 'WORK-A',
    featureDefinitionId: 'FEAT-A',
    title: 'A frontend',
    workType: 'frontend',
    releaseId: 'R1',
    status: 'planned',
    taskRefs: [],
    evidenceRefs: [],
  }];
  const after = structuredClone(before);
  after.workItems[0].status = 'in-progress';
  after.workItems[0].evidenceRefs = ['tests/a.test.ts'];

  const beforeResult = reconcilePlanningDelivery({ workspaceId: 'demo', manifest, lock, evidence: before });
  const afterResult = reconcilePlanningDelivery({ workspaceId: 'demo', manifest, lock, evidence: after });

  assert.deepEqual(afterResult.featureResults, beforeResult.featureResults);
  assert.deepEqual(afterResult.proposals, beforeResult.proposals);
  assert.equal(afterResult.status, beforeResult.status);
  assert.notDeepEqual(afterResult.workItemSummary, beforeResult.workItemSummary);
});

test('work-item summary는 invalid와 completion-blocked done을 분리 집계하고 입력을 바꾸지 않는다', () => {
  const delivery = evidence([]);
  delivery.workItems = [
    {
      id: 'WORK-A-DONE-BLOCKED',
      featureDefinitionId: 'FEAT-A',
      title: '완료 근거가 부족한 작업',
      workType: 'backend',
      releaseId: 'R1',
      status: 'done',
      taskRefs: ['specs/a/tasks.md#T1'],
      evidenceRefs: [],
    },
    {
      id: 'WORK-B-INVALID',
      featureDefinitionId: 'FEAT-B',
      title: '지원하지 않는 상태',
      workType: 'qa',
      releaseId: 'R1',
      status: 'blocked',
      taskRefs: [],
      evidenceRefs: [],
    },
  ];
  const manifestBefore = structuredClone(manifest);
  const lockBefore = structuredClone(lock);
  const deliveryBefore = structuredClone(delivery);

  const result = reconcilePlanningDelivery({ workspaceId: 'demo', manifest, lock, evidence: delivery });

  assert.deepEqual(result.workItemSummary, {
    total: 1,
    byStatus: {
      planned: 0,
      'in-progress': 0,
      'in-review': 1,
      done: 0,
    },
    blockedDoneCount: 1,
    invalidCount: 1,
  });
  assert.deepEqual(manifest, manifestBefore);
  assert.deepEqual(lock, lockBefore);
  assert.deepEqual(delivery, deliveryBefore);
});

test('nested planned values는 proposal과 difference 출력에서 입력과 분리한다', () => {
  const nestedManifest = {
    projectId: 'community-app',
    digest,
    features: [{
      id: 'FEAT-NESTED',
      owner: 'product',
      rules: {
        manifestPlan: { limits: { images: 10 } },
        explicitPlan: { limits: { images: 10 } },
      },
    }],
  };
  const delivery = evidence([{
    featureId: 'FEAT-NESTED',
    deliveryStatus: 'in-progress',
    facts: [
      {
        fieldPath: 'rules.manifestPlan',
        value: { limits: { images: 4 } },
        certainty: 'observed',
        source: 'src:manifest-plan',
      },
      {
        fieldPath: 'rules.explicitPlan',
        plannedValue: { limits: { images: 8 } },
        value: { limits: { images: 3 } },
        certainty: 'observed',
        source: 'src:explicit-plan',
      },
    ],
  }]);
  const manifestBefore = structuredClone(nestedManifest);
  const deliveryBefore = structuredClone(delivery);

  const result = reconcilePlanningDelivery({
    workspaceId: 'demo',
    manifest: nestedManifest,
    lock,
    evidence: delivery,
  });
  const proposalByPath = Object.fromEntries(result.proposals.map((item) => [item.fieldPath, item]));
  const differenceByPath = Object.fromEntries(
    result.featureResults[0].differences.map((item) => [item.fieldPath, item]),
  );

  proposalByPath['rules.manifestPlan'].plannedValue.limits.images = 99;
  proposalByPath['rules.explicitPlan'].plannedValue.limits.images = 98;
  differenceByPath['rules.manifestPlan'].plannedValue.limits.images = 97;
  differenceByPath['rules.explicitPlan'].plannedValue.limits.images = 96;

  assert.deepEqual(nestedManifest, manifestBefore);
  assert.deepEqual(delivery, deliveryBefore);
});

test('large reconciliation은 manifest feature ID를 선형 횟수로만 조회한다', () => {
  const featureCount = 500;
  let idReadCount = 0;
  const features = Array.from({ length: featureCount }, (_, index) => {
    const id = `FEAT-LARGE-${index}`;
    return {
      get id() {
        idReadCount += 1;
        return id;
      },
      title: `Large feature ${index}`,
      owner: 'product',
    };
  });
  const largeManifest = {
    projectId: 'community-app',
    digest,
    features,
  };
  const delivery = evidence(Array.from({ length: featureCount }, (_, index) => ({
    featureId: `FEAT-LARGE-${index}`,
    deliveryStatus: 'in-progress',
    facts: [],
  })));

  const result = reconcilePlanningDelivery({
    workspaceId: 'large',
    manifest: largeManifest,
    lock,
    evidence: delivery,
  });

  assert.equal(result.featureResults.length, featureCount);
  assert.equal(result.proposals.length, 0);
  assert.ok(
    idReadCount <= featureCount * 20,
    `feature id was read ${idReadCount} times for ${featureCount} features`,
  );
});

test('새 계획 digest를 아직 pull하지 않았으면 behind로 분류한다', () => {
  const result = reconcilePlanningDelivery({ workspaceId: 'demo', manifest, lock: { ...lock, digest: `sha256:${'d'.repeat(64)}` }, evidence: evidence([]) });
  assert.equal(result.status, 'behind');
  assert.match(result.health[0].action, /pull/);
});

test('수집 실패는 last-good 결과를 보존하고 collection-failed로 전이한다', () => {
  const previousResult = { status: 'aligned', generatedAt: '2026-07-15T00:00:00.000Z', featureResults: [{ featureId: 'FEAT-A', status: 'aligned' }] };
  const result = reconcilePlanningDelivery({ workspaceId: 'demo', manifest, lock, collectionError: new Error('scanner timeout'), previousResult });
  assert.equal(result.status, 'collection-failed');
  assert.deepEqual(result.lastGood, previousResult);
  assert.match(result.health[0].message, /scanner timeout/);
});
