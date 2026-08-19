const BASE_STATUSES = new Set(['planned', 'in-progress', 'in-review', 'done']);
const EMPTY_COUNTS = Object.freeze({
  planned: 0,
  'in-progress': 0,
  'in-review': 0,
  done: 0,
  onHold: 0,
  total: 0,
});

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isStableString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function emptyCounts() {
  return { ...EMPTY_COUNTS };
}

function isUniqueStableStringArray(value, { nonempty = false } = {}) {
  if (!Array.isArray(value) || (nonempty && value.length === 0)) return false;
  const seen = new Set();
  for (const entry of value) {
    if (!isStableString(entry) || seen.has(entry)) return false;
    seen.add(entry);
  }
  return true;
}

function acceptanceResultsPass(source) {
  if (!isUniqueStableStringArray(source.requiredAcceptanceCriterionIds, { nonempty: true })) {
    return false;
  }
  if (!Array.isArray(source.acceptanceResults) || source.acceptanceResults.length === 0) {
    return false;
  }

  const resultByCriterionId = new Map();
  for (const result of source.acceptanceResults) {
    if (
      !isPlainObject(result)
      || !isStableString(result.criterionId)
      || !isStableString(result.status)
      || resultByCriterionId.has(result.criterionId)
    ) {
      return false;
    }
    resultByCriterionId.set(result.criterionId, result.status);
  }

  return source.requiredAcceptanceCriterionIds.every(
    (criterionId) => resultByCriterionId.get(criterionId) === 'passed',
  );
}

function issue(code, itemId, action) {
  return { code, itemId, action };
}

function itemLabel(item, index) {
  return isStableString(item?.id) ? item.id : `items[${index}]`;
}

export function canCompleteWorkItem(item = {}) {
  const source = isPlainObject(item) ? item : {};
  const missing = [];
  const tasksComplete = isPlainObject(source.tasks)
    && Number.isSafeInteger(source.tasks.done)
    && Number.isSafeInteger(source.tasks.total)
    && source.tasks.total > 0
    && source.tasks.done >= 0
    && source.tasks.done <= source.tasks.total
    && source.tasks.done === source.tasks.total;
  const acceptanceResultsPassed = acceptanceResultsPass(source);
  const evidencePresent = Array.isArray(source.evidenceRefs)
    && source.evidenceRefs.length > 0
    && source.evidenceRefs.every(isStableString);
  const blockersEmpty = source.blockingDecisions === undefined
    || (Array.isArray(source.blockingDecisions) && source.blockingDecisions.length === 0);

  if (!tasksComplete) missing.push('tasks');
  if (!acceptanceResultsPassed) missing.push('acceptance-verification');
  if (!evidencePresent) missing.push('evidence');
  if (!blockersEmpty) missing.push('blocking-decision');

  return { complete: missing.length === 0, missing };
}

export function aggregateFeatureWorkItems(options = {}) {
  const source = isPlainObject(options) ? options : {};
  const featureDefinitionId = source.featureDefinitionId;
  const releaseId = source.releaseId ?? null;
  const hasReleaseFilter = source.releaseId !== undefined && source.releaseId !== null;
  const items = Array.isArray(source.items) ? source.items : [];
  const counts = emptyCounts();
  const health = [];
  let invalidItemCount = 0;
  let blockedDoneCount = 0;

  if (!isStableString(featureDefinitionId)) {
    health.push(issue(
      'feature-rollup-id-invalid',
      'featureDefinitionId',
      'featureDefinitionId를 비어 있지 않은 문자열로 제공하세요.',
    ));
    return {
      featureDefinitionId,
      releaseId,
      status: 'work-not-created',
      counts,
      blockedDoneCount,
      health,
      invalidItemCount: 1,
    };
  }

  for (const [index, item] of items.entries()) {
    if (!isPlainObject(item)) {
      health.push(issue(
        'work-item-not-object',
        itemLabel(item, index),
        'FeatureWorkItem을 객체로 수정하세요.',
      ));
      invalidItemCount += 1;
      continue;
    }
    if (item.featureDefinitionId !== featureDefinitionId) continue;
    if (hasReleaseFilter && item.releaseId !== source.releaseId) continue;
    if (!BASE_STATUSES.has(item.status)) {
      health.push(issue(
        'work-item-invalid-status',
        itemLabel(item, index),
        'status를 지원되는 기본 상태로 수정하세요.',
      ));
      invalidItemCount += 1;
      continue;
    }

    let effectiveStatus = item.status;
    if (effectiveStatus === 'done' && !canCompleteWorkItem(item).complete) {
      effectiveStatus = 'in-review';
      blockedDoneCount += 1;
    }

    counts[effectiveStatus] += 1;
    if (item.hold?.active === true) counts.onHold += 1;
    counts.total += 1;
  }

  const status = counts.total === 0
    ? 'work-not-created'
    : counts.done === counts.total
      ? 'done'
      : counts['in-progress'] > 0
        ? 'in-progress'
        : counts['in-review'] > 0
          ? 'in-review'
          : 'planned';

  return {
    featureDefinitionId,
    releaseId,
    status,
    counts,
    blockedDoneCount,
    health,
    invalidItemCount,
  };
}

// 미등록(registered:false) work item 요약 — 렌더러/게이트/힌트가 공용으로 쓴다.
export function unregisteredWorkItemSummary(items = []) {
  const featureIds = [];
  const seen = new Set();
  let itemCount = 0;
  for (const item of Array.isArray(items) ? items : []) {
    if (!isPlainObject(item) || item.registered !== false) continue;
    itemCount += 1;
    const featureId = isStableString(item.featureDefinitionId) ? item.featureDefinitionId : '(미상)';
    if (!seen.has(featureId)) {
      seen.add(featureId);
      featureIds.push(featureId);
    }
  }
  return { itemCount, featureIds };
}

export function aggregateAllFeatures(options = {}) {
  const source = isPlainObject(options) ? options : {};
  const features = Array.isArray(source.features) ? source.features : [];
  const items = Array.isArray(source.items) ? source.items : [];
  const releaseId = source.releaseId ?? null;
  const seenIds = new Set();
  const rollups = [];
  const itemsByFeatureId = new Map();

  for (const item of items) {
    if (!isPlainObject(item) || !isStableString(item.featureDefinitionId)) continue;
    const bucket = itemsByFeatureId.get(item.featureDefinitionId) ?? [];
    bucket.push(item);
    itemsByFeatureId.set(item.featureDefinitionId, bucket);
  }

  for (const feature of features) {
    if (!isPlainObject(feature) || !isStableString(feature.id) || seenIds.has(feature.id)) continue;
    seenIds.add(feature.id);
    rollups.push([
      feature.id,
      aggregateFeatureWorkItems({
        featureDefinitionId: feature.id,
        releaseId,
        items: itemsByFeatureId.get(feature.id) ?? [],
      }),
    ]);
  }

  return Object.fromEntries(rollups);
}
