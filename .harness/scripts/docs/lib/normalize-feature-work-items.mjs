const STATUSES = new Set(['planned', 'in-progress', 'in-review', 'done']);
const WORK_TYPES = new Set(['frontend', 'backend', 'db', 'qa', 'infra', 'unspecified']);
const REQUIRED_STRINGS = ['id', 'featureDefinitionId', 'title', 'releaseId'];
const REQUIRED_STRING_ARRAYS = ['taskRefs', 'evidenceRefs'];
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isStableString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every(isStableString);
}

function issue(code, itemId, action) {
  return { code, itemId: String(itemId), action };
}

function cloneJsonCompatible(value, ancestors = new WeakSet()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return { valid: true, value };
  }
  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? { valid: true, value }
      : { valid: false, value: null };
  }
  if (typeof value !== 'object' || ancestors.has(value)) {
    return { valid: false, value: null };
  }

  ancestors.add(value);
  if (Array.isArray(value)) {
    const keys = Object.keys(value);
    const symbols = Object.getOwnPropertySymbols(value);
    const dense = keys.length === value.length
      && keys.every((key, index) => key === String(index));
    if (!dense || symbols.length > 0) {
      ancestors.delete(value);
      return { valid: false, value: null };
    }
    const cloned = [];
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
        ancestors.delete(value);
        return { valid: false, value: null };
      }
      const result = cloneJsonCompatible(descriptor.value, ancestors);
      if (!result.valid) {
        ancestors.delete(value);
        return result;
      }
      cloned.push(result.value);
    }
    ancestors.delete(value);
    return { valid: true, value: cloned };
  }

  if (!isPlainObject(value)) {
    ancestors.delete(value);
    return { valid: false, value: null };
  }
  const keys = Object.keys(value);
  if (Reflect.ownKeys(value).length !== keys.length || keys.some((key) => DANGEROUS_KEYS.has(key))) {
    ancestors.delete(value);
    return { valid: false, value: null };
  }
  const cloned = {};
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
      ancestors.delete(value);
      return { valid: false, value: null };
    }
    const result = cloneJsonCompatible(descriptor.value, ancestors);
    if (!result.valid) {
      ancestors.delete(value);
      return result;
    }
    cloned[key] = result.value;
  }
  ancestors.delete(value);
  return { valid: true, value: cloned };
}

function itemLabel(item, index, prefix = 'workItems') {
  return isStableString(item?.id) ? item.id : `${prefix}[${index}]`;
}

function validateExplicitItem(item, index, featureIds, seenIds) {
  const health = [];
  const itemId = itemLabel(item, index);
  if (!isPlainObject(item)) {
    return {
      health: [issue('work-item-not-object', itemId, 'FeatureWorkItem을 객체로 수정하세요.')],
      item: null,
    };
  }
  const duplicateId = isStableString(item.id) && seenIds.has(item.id);
  if (isStableString(item.id)) seenIds.add(item.id);

  for (const field of REQUIRED_STRINGS) {
    if (!isStableString(item[field])) {
      health.push(issue(
        'work-item-required-string-invalid',
        itemId,
        `${field}를 비어 있지 않은 문자열로 수정하세요.`,
      ));
    }
  }
  for (const field of REQUIRED_STRING_ARRAYS) {
    if (!isStringArray(item[field])) {
      health.push(issue(
        'work-item-required-array-invalid',
        itemId,
        `${field}를 비어 있지 않은 문자열 배열로 수정하세요.`,
      ));
    }
  }
  if (!STATUSES.has(item.status)) {
    health.push(issue('work-item-invalid-status', itemId, 'status를 지원되는 기본 상태로 수정하세요.'));
  }
  if (!WORK_TYPES.has(item.workType)) {
    health.push(issue('work-item-invalid-work-type', itemId, 'workType을 지원되는 기술 작업 유형으로 수정하세요.'));
  }
  const referenceBroken = isStableString(item.featureDefinitionId)
    && !featureIds.has(item.featureDefinitionId);
  if (referenceBroken) {
    health.push(issue(
      'work-item-feature-reference-broken',
      itemId,
      'featureDefinitionId를 존재하는 기능 정의 ID로 수정하거나 feature:stub으로 draft 정의를 등록하세요.',
    ));
  }

  const repositoryField = Object.keys(item).find((field) => /repository/i.test(field));
  if (repositoryField) {
    health.push(issue(
      'work-item-repository-field-forbidden',
      itemId,
      `${repositoryField}를 FeatureWorkItem에서 제거하고 workspace source에 두세요.`,
    ));
  }
  if (duplicateId) {
    health.push(issue('work-item-id-duplicate', itemId, '중복되지 않는 stable work item ID를 사용하세요.'));
  }
  // 미등록 참조는 항목을 버리지 않고 registered:false로 투영한다(정의-후행 경로).
  if (health.length > (referenceBroken ? 1 : 0)) return { health, item: null };

  const cloned = cloneJsonCompatible(item);
  if (!cloned.valid) {
    return {
      health: [issue(
        'work-item-not-json-compatible',
        itemId,
        'FeatureWorkItem의 모든 값을 순환 참조와 위험 키가 없는 JSON 호환 값으로 수정하세요.',
      )],
      item: null,
    };
  }
  return {
    health,
    item: referenceBroken
      ? { ...cloned.value, source: 'explicit', registered: false }
      : { ...cloned.value, source: 'explicit' },
  };
}

function legacyFeatureId(feature) {
  for (const field of ['featureDefinitionId', 'featureId', 'id']) {
    if (isStableString(feature?.[field])) return feature[field];
  }
  return null;
}

function projectLegacyItem(feature, index, {
  featureById,
  explicitFeatureIds,
  explicitIds,
  seenFeatureIds,
}) {
  const fallbackId = itemLabel(feature, index, 'features');
  if (!isPlainObject(feature)) {
    return {
      health: [issue('legacy-feature-not-object', fallbackId, 'legacy feature evidence를 객체로 수정하세요.')],
      item: null,
    };
  }

  const featureId = legacyFeatureId(feature);
  const itemId = featureId ? `WORK-${featureId}-LEGACY` : fallbackId;
  if (!featureId) {
    return {
      health: [issue('legacy-feature-required-string-invalid', itemId, 'featureId를 비어 있지 않은 문자열로 추가하세요.')],
      item: null,
    };
  }
  if (!featureById.has(featureId)) {
    return {
      health: [issue('legacy-feature-reference-broken', itemId, 'featureId를 존재하는 기능 정의 ID로 수정하세요.')],
      item: null,
    };
  }
  if (explicitIds.has(itemId)) {
    return {
      health: [issue('work-item-id-duplicate', itemId, 'legacy 생성 ID와 충돌하지 않는 explicit work item ID를 사용하세요.')],
      item: null,
    };
  }
  if (explicitFeatureIds.has(featureId)) return { health: [], item: null };
  if (seenFeatureIds.has(featureId)) {
    return {
      health: [issue('legacy-feature-duplicate', itemId, '기능별 legacy evidence를 하나로 합치세요.')],
      item: null,
    };
  }

  const status = feature.status ?? feature.deliveryStatus ?? 'planned';
  if (!STATUSES.has(status)) {
    return {
      health: [issue('legacy-feature-invalid-status', itemId, 'legacy delivery status를 지원되는 기본 상태로 수정하세요.')],
      item: null,
    };
  }
  const releaseId = feature.releaseId ?? 'unassigned';
  if (!isStableString(releaseId)) {
    return {
      health: [issue('legacy-feature-release-invalid', itemId, 'releaseId를 비어 있지 않은 문자열로 수정하거나 생략하세요.')],
      item: null,
    };
  }
  for (const field of REQUIRED_STRING_ARRAYS) {
    if (feature[field] !== undefined && !isStringArray(feature[field])) {
      return {
        health: [issue('legacy-feature-array-invalid', itemId, `${field}를 비어 있지 않은 문자열 배열로 수정하세요.`)],
        item: null,
      };
    }
  }

  seenFeatureIds.add(featureId);
  const definition = featureById.get(featureId);
  const title = isStableString(feature.title)
    ? feature.title
    : isStableString(definition.title)
      ? definition.title
      : `Legacy delivery evidence: ${featureId}`;
  return {
    health: [],
    item: {
      id: itemId,
      featureDefinitionId: featureId,
      title,
      workType: 'unspecified',
      releaseId,
      status,
      taskRefs: cloneJsonCompatible(feature.taskRefs ?? []).value,
      evidenceRefs: cloneJsonCompatible(feature.evidenceRefs ?? []).value,
      source: 'legacy-delivery-evidence',
    },
  };
}

export function normalizeFeatureWorkItems(input = {}) {
  const source = isPlainObject(input) ? input : {};
  const features = source.features ?? [];
  const evidence = source.evidence ?? null;
  const items = [];
  const health = [];

  if (!Array.isArray(features)) {
    health.push(issue('feature-definitions-not-array', 'features', 'features를 배열로 수정하세요.'));
  }
  const featureById = new Map();
  for (const feature of Array.isArray(features) ? features : []) {
    if (isPlainObject(feature) && isStableString(feature.id) && !featureById.has(feature.id)) {
      featureById.set(feature.id, feature);
    }
  }

  if (evidence === null || evidence === undefined) return { items, health };
  if (!isPlainObject(evidence)) {
    health.push(issue('delivery-evidence-not-object', 'evidence', 'delivery evidence를 객체로 수정하세요.'));
    return { items, health };
  }

  const workItems = evidence.workItems === undefined ? [] : evidence.workItems;
  const legacyFeatures = evidence.features === undefined ? [] : evidence.features;
  if (!Array.isArray(workItems)) {
    health.push(issue('work-items-not-array', 'workItems', 'workItems를 배열로 수정하세요.'));
  }
  if (!Array.isArray(legacyFeatures)) {
    health.push(issue('legacy-features-not-array', 'features', 'legacy features를 배열로 수정하세요.'));
  }

  const seenIds = new Set();
  const explicitFeatureIds = new Set();
  const featureIds = new Set(featureById.keys());
  for (const [index, item] of (Array.isArray(workItems) ? workItems : []).entries()) {
    if (
      isPlainObject(item)
      && isStableString(item.featureDefinitionId)
      && featureById.has(item.featureDefinitionId)
    ) {
      explicitFeatureIds.add(item.featureDefinitionId);
    }
    const result = validateExplicitItem(item, index, featureIds, seenIds);
    health.push(...result.health);
    if (result.item) items.push(result.item);
  }

  const seenLegacyFeatureIds = new Set();
  for (const [index, feature] of (Array.isArray(legacyFeatures) ? legacyFeatures : []).entries()) {
    const result = projectLegacyItem(feature, index, {
      featureById,
      explicitFeatureIds,
      explicitIds: seenIds,
      seenFeatureIds: seenLegacyFeatureIds,
    });
    health.push(...result.health);
    if (result.item) items.push(result.item);
  }

  return { items, health };
}
