import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeRegistry } from '../.harness/scripts/docs/lib/merge-registry.mjs';

// specFeatures: scan-specs 결과 형태 { id, title, status, phase, spec_link, ... }
// registry: { features: [...] } 또는 null

test('merge: specs만 있으면 그대로 반환(registry 없음)', () => {
  const specs = [{ id: '002-hub', title: '허브', status: 'in-progress', spec_link: 'specs/002-hub' }];
  const merged = mergeRegistry(specs, null);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, '002-hub');
  assert.equal(merged[0].status, 'in-progress');
});

test('merge: registry에만 있는 기능은 planned로 포함', () => {
  const registry = { features: [{ id: '090-only', title: '레지전용', status: 'planned', spec_link: null }] };
  const merged = mergeRegistry([], registry);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, '090-only');
  assert.equal(merged[0].spec_link, null);
});

test('merge: 같은 id는 spec 우선, spec_link 자동 연결', () => {
  const specs = [{ id: '003-sample', title: '스펙제목', status: 'done', phase: 'P1', spec_link: 'specs/003-sample' }];
  const registry = { features: [{ id: '003-sample', title: '레지제목', status: 'planned', phase: 'P2', spec_link: null }] };
  const merged = mergeRegistry(specs, registry);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].title, '스펙제목');       // spec 우선
  assert.equal(merged[0].status, 'done');          // spec 우선
  assert.equal(merged[0].spec_link, 'specs/003-sample'); // 자동 연결
});

test('merge: 결과는 id 기준 정렬', () => {
  const specs = [{ id: '005-b', title: 'b', spec_link: 'specs/005-b' }];
  const registry = { features: [{ id: '001-a', title: 'a', status: 'planned', spec_link: null }] };
  const merged = mergeRegistry(specs, registry);
  assert.deepEqual(merged.map((m) => m.id), ['001-a', '005-b']);
});

test('merge: registry-먼저와 spec-먼저 경로가 같은 결과로 수렴 (US3)', () => {
  // 경로 A: registry에 먼저 있고 나중에 spec 생김
  const pathA = mergeRegistry(
    [{ id: '007-x', title: 'X기능', status: 'in-review', spec_link: 'specs/007-x' }],
    { features: [{ id: '007-x', title: 'X(레지)', status: 'planned', spec_link: null }] },
  );
  // 경로 B: spec만 있고 registry 없음
  const pathB = mergeRegistry(
    [{ id: '007-x', title: 'X기능', status: 'in-review', spec_link: 'specs/007-x' }],
    null,
  );
  assert.equal(pathA[0].title, pathB[0].title);
  assert.equal(pathA[0].status, pathB[0].status);
  assert.equal(pathA[0].spec_link, pathB[0].spec_link);
});

test('merge: registry 없어도(빈/누락) spec만으로 동작 (FR-013)', () => {
  const specs = [{ id: '002-hub', title: '허브', status: 'planned', spec_link: 'specs/002-hub' }];
  assert.equal(mergeRegistry(specs, null).length, 1);
  assert.equal(mergeRegistry(specs, { features: [] }).length, 1);
  assert.equal(mergeRegistry(specs, {}).length, 1);
});
