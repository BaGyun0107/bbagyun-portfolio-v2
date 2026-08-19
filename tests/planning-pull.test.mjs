import { tmp } from './helpers/fixture-base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { applyPlanningLock } from '../.harness/scripts/docs/lib/apply-planning-lock.mjs';
import { compilePlanningManifest } from '../.harness/scripts/docs/lib/compile-planning-manifest.mjs';

function manifest(projectId = 'community-app') {
  return compilePlanningManifest({ projectId, sourceRevision: 'planning-rev-2' });
}

test('candidate schema/project/digest를 모두 검증한 뒤 lock을 원자 교체한다', () => {
  const root = tmp('planning-pull-');
  const lockPath = join(root, 'planning.lock.json');
  writeFileSync(lockPath, '{"digest":"old"}\n');
  const candidate = manifest();
  const lock = applyPlanningLock({ lockPath, candidateManifest: candidate, expectedProjectId: 'community-app', importedAt: '2026-07-16T03:00:00.000Z' });
  assert.equal(lock.digest, candidate.digest);
  assert.equal(lock.appliedState, 'applied');
  assert.deepEqual(JSON.parse(readFileSync(lockPath, 'utf8')), lock);
});

test('검증 실패 또는 replace 중단 시 기존 lock byte를 보존한다', () => {
  const root = tmp('planning-pull-fail-');
  const lockPath = join(root, 'planning.lock.json');
  const original = '{"digest":"last-good"}\n';
  writeFileSync(lockPath, original);
  const invalid = { ...manifest(), digest: `sha256:${'0'.repeat(64)}` };
  assert.throws(() => applyPlanningLock({ lockPath, candidateManifest: invalid, expectedProjectId: 'community-app' }), /digest mismatch/);
  assert.equal(readFileSync(lockPath, 'utf8'), original);
  assert.throws(() => applyPlanningLock({ lockPath, candidateManifest: manifest(), expectedProjectId: 'community-app', replace: () => { throw new Error('interrupted'); } }), /interrupted/);
  assert.equal(readFileSync(lockPath, 'utf8'), original);
});

test('다른 project candidate는 lock에 쓰지 않는다', () => {
  const root = tmp('planning-pull-project-');
  const lockPath = join(root, 'planning.lock.json');
  writeFileSync(lockPath, '{"digest":"last-good"}\n');
  assert.throws(() => applyPlanningLock({ lockPath, candidateManifest: manifest('other-app'), expectedProjectId: 'community-app' }), /projectId/);
  assert.equal(readFileSync(lockPath, 'utf8'), '{"digest":"last-good"}\n');
});
