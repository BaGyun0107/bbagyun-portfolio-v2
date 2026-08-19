import { validateContract } from './planning-contracts.mjs';

function isDefinedState(value) {
  if (typeof value === 'string') return value.trim().length > 0;
  return Boolean(value?.exempt && value?.reason);
}

function readiness(detail) {
  const missing = [];
  const requireValue = (path, value) => {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) missing.push(path);
  };
  requireValue('intent.actor', detail?.intent?.actor);
  requireValue('intent.goal', detail?.intent?.goal);
  requireValue('behavior.happyPath', detail?.behavior?.happyPath);
  for (const state of ['processing', 'emptyOrNoInput', 'errorRetry', 'permissionDenied']) {
    if (!isDefinedState(detail?.states?.[state])) missing.push(`states.${state}`);
  }
  if (!Array.isArray(detail?.acceptance) || detail.acceptance.length === 0) missing.push('acceptance');
  else detail.acceptance.forEach((criterion, index) => {
    if (!criterion?.statement) missing.push(`acceptance[${index}].statement`);
    if (!criterion?.metric) missing.push(`acceptance[${index}].metric`);
  });
  (detail?.decisions || []).forEach((decision, index) => {
    if (decision.status !== 'open') return;
    if (!decision.owner) missing.push(`decisions[${index}].owner`);
    if (!decision.resolveBy) missing.push(`decisions[${index}].resolveBy`);
  });
  return { ready: missing.length === 0, missing };
}

export function scanFeatureDetails(details = [], { catalog = [] } = {}) {
  const health = [];
  const byId = {};
  const normalized = [];
  for (const detail of details || []) {
    const contract = validateContract('feature-detail', detail, { mode: 'preview' });
    const result = readiness(detail);
    result.missing.push(...contract.errors.filter((error) => !result.missing.includes(error)));
    result.ready = result.missing.length === 0;
    if (byId[detail.id]) {
      health.push({ code: 'duplicate-feature-detail', featureId: detail.id, impact: '상세 선택이 모호함', action: 'stable ID를 고유하게 수정하세요.' });
      continue;
    }
    const enriched = { ...detail, readiness: result };
    normalized.push(enriched);
    byId[detail.id] = enriched;
    if (!result.ready) health.push({ code: 'definition-incomplete', featureId: detail.id, missing: result.missing, impact: '구현 완료 조건을 판단할 수 없음', action: '누락된 상세 그룹을 정의하거나 명시적으로 면제하세요.' });
  }
  for (const feature of catalog || []) {
    // detailId 를 명시 선언한 기능만 상세를 기대한다 — 미선언은 카탈로그-only
    // 운영(정상 상태)이다 (2026-08-03 DEC-HARNESS-DETAIL-BACKFILL 종결, 감사 D-3).
    const declared = typeof feature.detailId === 'string' && feature.detailId.trim() !== '';
    if (declared && !byId[feature.detailId]) health.push({ code: 'feature-detail-missing', featureId: feature.id, impact: '기능 상세 없음', action: 'feature detail을 연결하세요.' });
  }
  return { details: normalized, byId, health };
}
