import test from 'node:test';
import assert from 'node:assert/strict';

const modulePath = '../.harness/scripts/docs/lib/canonical-json.mjs';

test('canonical JSON은 object key를 재귀 정렬하고 array 순서를 보존한다', async () => {
  const { canonicalJson } = await import(modulePath);
  assert.equal(
    canonicalJson({ z: 1, a: { y: 2, x: 1 }, list: ['b', 'a'] }),
    '{"a":{"x":1,"y":2},"list":["b","a"],"z":1}',
  );
});

test('manifest digest는 volatile field를 제외하고 같은 의미에 반복 가능한 SHA-256을 만든다', async () => {
  const { manifestDigest } = await import(modulePath);
  const base = {
    schemaVersion: 1,
    manifestVersion: '1.0.0',
    projectId: 'demo',
    sourceRevision: 'rev-1',
    generatedAt: '2026-07-16T00:00:00.000Z',
    digest: 'sha256:old',
    needs: [], screens: [], features: [], featureDetails: [], flows: [], relations: [], decisions: [],
  };
  const first = manifestDigest(base);
  const second = manifestDigest({ ...base, generatedAt: '2027-01-01T00:00:00.000Z', digest: first });
  assert.match(first, /^sha256:[a-f0-9]{64}$/);
  assert.equal(first, second);
});

test('canonical JSON은 undefined, 함수, 순환 참조와 비유한 숫자를 거부한다', async () => {
  const { canonicalJson } = await import(modulePath);
  assert.throws(() => canonicalJson({ invalid: undefined }), /JSON value/);
  assert.throws(() => canonicalJson({ invalid: () => true }), /JSON value/);
  assert.throws(() => canonicalJson({ invalid: Number.NaN }), /finite/);
  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(() => canonicalJson(cyclic), /circular/);
});
