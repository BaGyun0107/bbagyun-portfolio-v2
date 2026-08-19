import { tmp } from './helpers/fixture-base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { checkGeneratedPageSet, checkPlanningState, collectPlanningWarnings, runPlanningCheck } from '../.harness/scripts/docs/planning-check.mjs';
import { build } from '../.harness/scripts/docs/build-hub.mjs';
import { compilePlanningManifest } from '../.harness/scripts/docs/lib/compile-planning-manifest.mjs';

function valid() {
  const manifest = compilePlanningManifest({
    projectId: 'demo', sourceRevision: 'rev',
    needs: [{ id: 'NEED-1' }], screens: [{ id: 'SCREEN-1' }], features: [{ id: 'FEAT-1' }],
    relations: [{ from: { type: 'need', id: 'NEED-1' }, to: { type: 'feature', id: 'FEAT-1' }, type: 'satisfied-by' }],
  });
  return {
    manifest,
    lock: { projectId: 'demo', digest: manifest.digest },
    evidence: { projectId: 'demo', consumedManifestDigest: manifest.digest },
    syncResult: { status: 'aligned' },
    generatedOutput: '<html>same</html>',
    expectedOutput: '<html>same</html>',
  };
}

test('valid planning state는 strict check를 통과한다', () => assert.deepEqual(checkPlanningState(valid()).errors, []));

test('열린 결정도 실패가 아니라 경고로 집계된다', () => {
  const warnings = collectPlanningWarnings([
    {
      id: 'ws-a',
      featureWorkItems: [],
      decisions: [
        { id: 'DEC-STUB-FEAT-X', status: 'open', owner: 'product' },
        { id: 'DEC-DONE', status: 'approved', owner: 'product' },
      ],
    },
  ]);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /열린 결정 1건/);
  assert.match(warnings[0], /DEC-STUB-FEAT-X/);
});

test('미등록 기능 work item은 실패가 아니라 경고로 집계된다', () => {
  const warnings = collectPlanningWarnings([
    {
      id: 'ws-a',
      featureWorkItems: [
        { id: 'W1', featureDefinitionId: 'FEAT-X', registered: false },
        { id: 'W2', featureDefinitionId: 'FEAT-Y' },
      ],
    },
    { id: 'ws-b', featureWorkItems: [] },
  ]);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /ws-a/);
  assert.match(warnings[0], /미등록 기능 1건/);
  assert.match(warnings[0], /feature:stub/);
});

test('invalid digest, broken relation, stale output과 conflict를 각각 실패시킨다', () => {
  const invalidDigest = valid(); invalidDigest.manifest.digest = `sha256:${'0'.repeat(64)}`;
  assert.match(checkPlanningState(invalidDigest).errors.join('\n'), /digest/);
  const broken = valid(); broken.manifest.relations.push({ from: { type: 'feature', id: 'MISSING' }, to: { type: 'screen', id: 'SCREEN-1' }, type: 'appears-on' });
  assert.match(checkPlanningState(broken).errors.join('\n'), /broken relation/);
  const stale = valid(); stale.generatedOutput = '<html>old</html>';
  assert.match(checkPlanningState(stale).errors.join('\n'), /stale/);
  const conflict = valid(); conflict.syncResult.status = 'conflicted';
  assert.match(checkPlanningState(conflict).errors.join('\n'), /conflict/);
});

test('두 생성 페이지 중 missing/stale 결과를 경로와 복구 명령으로 구분한다', () => {
  const result = checkGeneratedPageSet({
    expected: {
      'docs/index.html': '<html>documents-new</html>',
      'docs/planning.html': '<html>planning-new</html>',
    },
    actual: {
      'docs/index.html': null,
      'docs/planning.html': '<html>planning-old</html>',
    },
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    'missing generated output: docs/index.html — run mise run docs:build',
    'stale generated output: docs/planning.html — run mise run docs:build',
  ]);
});

test('strict check는 workspace 유무와 무관하게 생성 페이지 하나의 누락을 실패시킨다', () => {
  const root = tmp('planning-page-set-check-');
  mkdirSync(join(root, 'data'), { recursive: true });
  mkdirSync(join(root, 'specs'), { recursive: true });
  build(root);
  rmSync(join(root, 'docs', 'planning.html'));

  const result = runPlanningCheck(root);

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /missing generated output: docs\/planning\.html/);
  assert.match(result.errors.join('\n'), /mise run docs:build/);
  rmSync(root, { recursive: true, force: true });
});
