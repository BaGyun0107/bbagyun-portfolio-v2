import { aggregateAllFeatures } from './aggregate-feature-work-items.mjs';
import { normalizeFeatureWorkItems } from './normalize-feature-work-items.mjs';

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function valueAtPath(value, path) {
  return String(path || '').split('.').reduce((current, key) => current?.[key], value);
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function proposalFor(feature, fact, index) {
  const plannedValue = fact.plannedValue !== undefined ? fact.plannedValue : valueAtPath(feature, fact.fieldPath);
  return {
    id: `PROP-${feature.id}-${String(index + 1).padStart(3, '0')}`,
    entity: { type: 'feature', id: feature.id },
    fieldPath: fact.fieldPath,
    plannedValue: clone(plannedValue),
    observedValue: clone(fact.value),
    evidence: [{ certainty: fact.certainty, source: fact.source }],
    rationale: '승인 계획과 downstream 근거의 값이 달라 사람의 판단이 필요합니다.',
    proposer: 'planning-reconcile',
    decisionOwner: feature.owner || 'product',
    status: 'open',
  };
}

function featureResult(feature, delivery) {
  if (!delivery) return { featureId: feature.id, status: 'behind', differences: [], nextAction: '구현·검증 근거를 수집하세요.' };
  const differences = [];
  let conflict = false;
  for (const fact of delivery.facts || []) {
    const plannedValue = fact.plannedValue !== undefined ? fact.plannedValue : valueAtPath(feature, fact.fieldPath);
    if (fact.conflict) conflict = true;
    if (plannedValue !== undefined && !sameValue(plannedValue, fact.value)) differences.push(fact);
  }
  const status = conflict ? 'conflicted' : differences.length ? 'drifted' : 'aligned';
  return {
    featureId: feature.id,
    status,
    deliveryStatus: delivery.deliveryStatus || delivery.status || '근거 수집됨',
    differences: differences.map((fact) => ({ fieldPath: fact.fieldPath, plannedValue: clone(fact.plannedValue !== undefined ? fact.plannedValue : valueAtPath(feature, fact.fieldPath)), observedValue: clone(fact.value), evidence: { certainty: fact.certainty, source: fact.source } })),
    nextAction: status === 'aligned' ? '계획과 근거가 일치합니다.' : status === 'conflicted' ? '계획 책임자가 충돌을 판정하세요.' : '변경 제안을 검토하세요.',
  };
}

const STATUS_ORDER = ['collection-failed', 'conflicted', 'drifted', 'behind', 'aligned'];

function summarizeWorkItems(features, evidence) {
  const normalized = normalizeFeatureWorkItems({ features, evidence });
  const rollups = aggregateAllFeatures({ features, items: normalized.items });
  const byStatus = {
    planned: 0,
    'in-progress': 0,
    'in-review': 0,
    done: 0,
  };
  let total = 0;
  let blockedDoneCount = 0;
  let aggregationInvalidCount = 0;
  for (const rollup of Object.values(rollups)) {
    for (const status of Object.keys(byStatus)) byStatus[status] += rollup.counts[status];
    total += rollup.counts.total;
    blockedDoneCount += rollup.blockedDoneCount;
    aggregationInvalidCount += rollup.invalidItemCount;
  }
  const normalizedInvalidItemIds = new Set(
    normalized.health.map(({ itemId }) => itemId).filter((itemId) => itemId !== undefined),
  );
  return {
    total,
    byStatus,
    blockedDoneCount,
    invalidCount: normalizedInvalidItemIds.size + aggregationInvalidCount,
  };
}

export function reconcilePlanningDelivery({
  workspaceId,
  manifest,
  lock,
  evidence,
  collectionError = null,
  previousResult = null,
  generatedAt = new Date().toISOString(),
} = {}) {
  const workItemSummary = summarizeWorkItems(manifest?.features || [], evidence);
  if (collectionError) {
    return {
      workspaceId,
      planningDigest: manifest?.digest || null,
      deliveryRevision: evidence?.sourceRevision || null,
      status: 'collection-failed',
      generatedAt,
      featureResults: [],
      proposals: [],
      workItemSummary,
      health: [{ code: 'collection-failed', message: collectionError.message, impact: '현재 근거를 신뢰할 수 없습니다.', action: '수집기를 복구한 뒤 다시 동기화하세요.' }],
      lastSuccessfulAt: previousResult?.generatedAt || previousResult?.lastSuccessfulAt || null,
      lastGood: clone(previousResult),
    };
  }
  if (!manifest || !lock) throw new Error('planning manifest and lock are required');
  if (manifest.projectId !== lock.projectId) throw new Error('planning lock projectId mismatch');
  const manifestFeatures = manifest.features || [];
  if (lock.digest !== manifest.digest) {
    return {
      workspaceId,
      planningDigest: manifest.digest,
      deliveryRevision: evidence?.sourceRevision || null,
      status: 'behind',
      generatedAt,
      featureResults: manifestFeatures.map((feature) => ({ featureId: feature.id, status: 'behind', differences: [], nextAction: '명시적 planning:pull을 검토하세요.' })),
      proposals: [],
      workItemSummary,
      health: [{ code: 'planning-lock-behind', message: 'Planning Lock이 현재 manifest digest와 다릅니다.', impact: '새 계획이 downstream에 적용되지 않았습니다.', action: '후보를 검증한 뒤 명시적 planning:pull을 실행하세요.' }],
      lastSuccessfulAt: previousResult?.generatedAt || null,
    };
  }
  if (evidence && evidence.consumedManifestDigest !== lock.digest) throw new Error('delivery evidence digest does not match planning lock');
  const featureById = new Map(manifestFeatures.map((feature) => [feature.id, feature]));
  const deliveryById = new Map((evidence?.features || []).map((item) => [item.featureId || item.id, item]));
  const featureResults = manifestFeatures.map((feature) => featureResult(feature, deliveryById.get(feature.id)));
  const proposals = [];
  for (const result of featureResults) {
    const feature = featureById.get(result.featureId);
    const delivery = deliveryById.get(result.featureId);
    for (const fact of delivery?.facts || []) {
      const plannedValue = fact.plannedValue !== undefined ? fact.plannedValue : valueAtPath(feature, fact.fieldPath);
      if (plannedValue !== undefined && !sameValue(plannedValue, fact.value)) proposals.push(proposalFor(feature, fact, proposals.length));
    }
  }
  const status = STATUS_ORDER.find((candidate) => featureResults.some((item) => item.status === candidate)) || 'aligned';
  return {
    workspaceId,
    planningDigest: manifest.digest,
    deliveryRevision: evidence?.sourceRevision || null,
    status,
    generatedAt,
    featureResults,
    proposals,
    workItemSummary,
    health: [],
    lastSuccessfulAt: generatedAt,
  };
}
