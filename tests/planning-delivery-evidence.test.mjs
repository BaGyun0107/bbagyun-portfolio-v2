import test from 'node:test';
import assert from 'node:assert/strict';

import { collectDeliveryEvidence } from '../.harness/scripts/docs/lib/scan-delivery-evidence.mjs';

const digest = `sha256:${'a'.repeat(64)}`;
const manifest = {
  projectId: 'community-app',
  digest,
  features: [{ id: 'FEAT-POST-CREATE' }, { id: 'FEAT-SEARCH' }],
};

test('declared, Spec, observed 근거를 feature별로 합치고 certainty/source를 보존한다', () => {
  const result = collectDeliveryEvidence({
    manifest,
    sourceRevision: 'downstream-rev-1',
    collectedAt: '2026-07-16T02:00:00.000Z',
    declaredEvidence: {
      schemaVersion: 1,
      projectId: 'community-app',
      consumedManifestDigest: digest,
      sourceRevision: 'downstream-rev-1',
      collectedAt: '2026-07-16T01:00:00.000Z',
      features: [{ featureId: 'FEAT-POST-CREATE', deliveryStatus: 'in-progress', facts: [{ fieldPath: 'rules.imageLimit', value: 10, certainty: 'confirmed', source: 'delivery-evidence.json' }] }],
    },
    specEvidence: [{ featureId: 'FEAT-POST-CREATE', tasks: { done: 3, total: 5 }, certainty: 'confirmed', source: 'specs/010/tasks.md' }],
    observedEvidence: [{ featureId: 'FEAT-POST-CREATE', facts: [{ fieldPath: 'rules.imageLimit', value: 4, certainty: 'observed', source: 'src/post.ts:18' }] }],
  });

  assert.equal(result.features.length, 1);
  assert.equal(result.features[0].deliveryStatus, 'in-progress');
  assert.deepEqual(result.features[0].tasks, { done: 3, total: 5 });
  assert.deepEqual(result.features[0].facts.map((fact) => fact.certainty), ['confirmed', 'observed']);
  assert.deepEqual(result.features[0].facts.map((fact) => fact.source), ['delivery-evidence.json', 'src/post.ts:18']);
});

test('consumed digest 불일치와 허용되지 않은 certainty를 거부한다', () => {
  const base = {
    schemaVersion: 1,
    projectId: 'community-app',
    consumedManifestDigest: `sha256:${'b'.repeat(64)}`,
    sourceRevision: 'rev',
    collectedAt: '2026-07-16T00:00:00.000Z',
    features: [],
  };
  assert.throws(() => collectDeliveryEvidence({ manifest, declaredEvidence: base }), /consumed manifest digest/);
  assert.throws(() => collectDeliveryEvidence({
    manifest,
    declaredEvidence: { ...base, consumedManifestDigest: digest, features: [{ featureId: 'FEAT-SEARCH', facts: [{ fieldPath: 'x', value: true, certainty: 'guessed', source: 'scanner' }] }] },
  }), /certainty/);
});

test('근거가 없는 계획 기능을 완료로 추론하지 않는다', () => {
  const result = collectDeliveryEvidence({ manifest, declaredEvidence: null });
  assert.deepEqual(result.features, []);
  assert.match(result.warnings[0].message, /구현 근거 미수집/);
});
