import { assertContract } from './planning-contracts.mjs';

const CERTAINTY = new Set(['confirmed', 'observed', 'inferred']);

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function assertProvenance(feature) {
  for (const fact of feature?.facts || []) {
    if (!CERTAINTY.has(fact.certainty)) throw new Error(`delivery fact certainty is invalid: ${fact.certainty}`);
    if (!fact.source) throw new Error('delivery fact source is required');
  }
  if (feature?.certainty && !CERTAINTY.has(feature.certainty)) throw new Error(`delivery certainty is invalid: ${feature.certainty}`);
  if (feature && !feature.featureId && !feature.id) throw new Error('delivery featureId is required');
}

function mergeFeature(target, incoming) {
  const facts = [...(target.facts || []), ...(incoming.facts || [])];
  return { ...target, ...clone(incoming), featureId: incoming.featureId || incoming.id || target.featureId, facts };
}

export function collectDeliveryEvidence({
  manifest,
  declaredEvidence = null,
  specEvidence = [],
  observedEvidence = [],
  sourceRevision,
  collectedAt = new Date().toISOString(),
} = {}) {
  if (!manifest?.projectId || !manifest?.digest) throw new Error('planning manifest projectId and digest are required');
  if (declaredEvidence) {
    assertContract('delivery-evidence', declaredEvidence);
    if (declaredEvidence.projectId !== manifest.projectId) throw new Error('delivery evidence projectId does not match manifest');
    if (declaredEvidence.consumedManifestDigest !== manifest.digest) throw new Error('delivery evidence consumed manifest digest does not match planning manifest');
  }

  const merged = new Map();
  for (const feature of declaredEvidence?.features || []) {
    assertProvenance(feature);
    merged.set(feature.featureId || feature.id, clone(feature));
  }
  for (const feature of [...specEvidence, ...observedEvidence]) {
    assertProvenance(feature);
    const id = feature.featureId || feature.id;
    merged.set(id, mergeFeature(merged.get(id) || { featureId: id, facts: [] }, feature));
  }

  const warnings = clone(declaredEvidence?.warnings || []);
  if (merged.size === 0) warnings.push({ code: 'delivery-evidence-missing', message: '구현 근거 미수집: 계획 기능을 완료로 추론하지 않습니다.' });
  return {
    schemaVersion: 1,
    projectId: manifest.projectId,
    consumedManifestDigest: manifest.digest,
    sourceRevision: sourceRevision || declaredEvidence?.sourceRevision || 'uncollected',
    collectedAt,
    features: [...merged.values()],
    warnings,
  };
}
