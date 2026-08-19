import { tmp } from './helpers/fixture-base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { collectConfiguredEvidencePaths, planningInputDigest, planningSourceGroups, runPlanningSync } from '../.harness/scripts/docs/planning-sync.mjs';
import { collectPlanningWatchSources } from '../.harness/scripts/docs/planning-watch.mjs';

function setup() {
  const root = tmp('planning-automation-');
  mkdirSync(join(root, 'data'), { recursive: true });
  mkdirSync(join(root, 'examples'), { recursive: true });
  mkdirSync(join(root, '.harness', 'state'), { recursive: true });
  writeFileSync(join(root, 'data', 'source.json'), '{"version":1}\n');
  writeFileSync(join(root, 'planning.lock.json'), '{"digest":"last-good"}\n');
  return root;
}

test('manual/Claude/Codex trigger를 정규화하고 run digest/duration/last-success를 기록한다', () => {
  const root = setup();
  const first = runPlanningSync({ root, trigger: 'Claude Stop', sourceGroups: ['data'], build: () => ({ ok: true }), now: () => '2026-07-16T04:00:00.000Z' });
  assert.equal(first.trigger, 'claude-stop');
  assert.equal(first.result, 'success');
  assert.match(first.inputDigest, /^sha256:/);
  assert.equal(first.durationMs, 0);
  assert.equal(first.lastSuccessfulRunId, first.runId);
  const recorded = JSON.parse(readFileSync(join(root, '.harness/state/planning-automation.json'), 'utf8'));
  assert.equal(recorded.lastRun.runId, first.runId);

  const second = runPlanningSync({ root, trigger: 'codex', sourceGroups: ['data'], build: () => { throw new Error('no-op must skip'); }, now: () => '2026-07-16T04:00:01.000Z' });
  assert.equal(second.trigger, 'codex-stop');
  assert.equal(second.result, 'skipped');
  assert.equal(second.lastSuccessfulRunId, first.runId);
});

test('ordinary sync/watch/Stop은 Planning Lock을 변경하지 않는다', () => {
  for (const trigger of ['manual', 'watch', 'claude-stop', 'codex-stop']) {
    const root = setup();
    const lockPath = join(root, 'planning.lock.json');
    const before = readFileSync(lockPath, 'utf8');
    runPlanningSync({ root, trigger, sourceGroups: ['data'], build: () => ({ ok: true }) });
    assert.equal(readFileSync(lockPath, 'utf8'), before, trigger);
  }
});

test('evidence 그룹은 downstream 근거 변경을 감지해 projection을 다시 만든다', () => {
  const root = setup();
  const evidenceDirectory = join(root, 'examples', 'community-app', 'downstream');
  const evidencePath = join(evidenceDirectory, 'delivery-evidence.json');
  mkdirSync(evidenceDirectory, { recursive: true });
  writeFileSync(evidencePath, '{"observedRevision":"rev-1"}\n');

  let buildCount = 0;
  const first = runPlanningSync({
    root,
    trigger: 'claude-stop',
    sourceGroups: ['evidence'],
    build: () => { buildCount += 1; return { ok: true }; },
    now: () => '2026-07-16T04:00:02.000Z',
  });

  writeFileSync(evidencePath, '{"observedRevision":"rev-2"}\n');
  const second = runPlanningSync({
    root,
    trigger: 'claude-stop',
    sourceGroups: ['evidence'],
    build: () => { buildCount += 1; return { ok: true }; },
    now: () => '2026-07-16T04:00:03.000Z',
  });

  assert.equal(first.result, 'success');
  assert.equal(second.result, 'success');
  assert.notEqual(second.inputDigest, first.inputDigest);
  assert.equal(buildCount, 2);
});

test('동일 planning 입력을 10회 처리해도 digest와 Lock은 같고 build loop가 없다', () => {
  const root = setup();
  const lockPath = join(root, 'planning.lock.json');
  const lockBefore = readFileSync(lockPath, 'utf8');
  let buildCount = 0;
  const runs = [];

  for (let index = 0; index < 10; index += 1) {
    runs.push(runPlanningSync({
      root,
      trigger: index === 0 ? 'manual' : 'watch',
      sourceGroups: ['data'],
      build: () => { buildCount += 1; return { ok: true }; },
      now: () => `2026-07-16T04:01:${String(index).padStart(2, '0')}.000Z`,
    }));
  }

  assert.equal(new Set(runs.map(({ inputDigest }) => inputDigest)).size, 1);
  assert.deepEqual(runs.map(({ result }) => result), ['success', ...Array(9).fill('skipped')]);
  assert.equal(buildCount, 1);
  assert.equal(readFileSync(lockPath, 'utf8'), lockBefore);
});

test('두 generated page 변경은 planning input digest를 바꾸지 않는다', () => {
  const root = setup();
  mkdirSync(join(root, 'docs'), { recursive: true });
  const documentsPath = join(root, 'docs', 'index.html');
  const planningPath = join(root, 'docs', 'planning.html');
  writeFileSync(documentsPath, 'documents-v1');
  writeFileSync(planningPath, 'planning-v1');
  const first = planningInputDigest(root, ['docs']);

  writeFileSync(documentsPath, 'documents-v2');
  writeFileSync(planningPath, 'planning-v2');
  const second = planningInputDigest(root, ['docs']);

  assert.equal(second, first);
});

test('기본/CLI source groups는 configured delivery evidence를 포함하고 변경 시 build를 다시 실행한다', () => {
  const root = setup();
  const evidenceDirectory = join(root, 'reports', 'delivery');
  const evidencePath = join(evidenceDirectory, 'evidence.json');
  mkdirSync(evidenceDirectory, { recursive: true });
  writeFileSync(join(root, 'data', 'hub-workspaces.json'), JSON.stringify({
    version: 1,
    defaultWorkspaceId: 'actual',
    workspaces: [{ id: 'actual', title: 'Actual', kind: 'downstream', root: '.', deliverySource: 'reports/delivery' }],
  }));
  writeFileSync(evidencePath, '{"revision":"rev-1"}\n');
  let buildCount = 0;

  const first = runPlanningSync({ root, build: () => { buildCount += 1; }, now: () => '2026-07-16T05:00:00.000Z' });
  writeFileSync(evidencePath, '{"revision":"rev-2"}\n');
  const second = runPlanningSync({ root, build: () => { buildCount += 1; }, now: () => '2026-07-16T05:00:01.000Z' });

  assert.deepEqual(planningSourceGroups(root), ['data', 'specs', 'examples', 'evidence']);
  assert.deepEqual(first.sourceGroups, ['data', 'specs', 'examples', 'evidence']);
  assert.notEqual(first.inputDigest, second.inputDigest);
  assert.equal(buildCount, 2);
});

test('watch source 목록은 기본 source와 configured evidence 파일·디렉터리를 포함한다', () => {
  const root = setup();
  mkdirSync(join(root, 'reports', 'delivery'), { recursive: true });
  mkdirSync(join(root, 'reports', 'snapshots'), { recursive: true });
  writeFileSync(join(root, 'reports', 'snapshots', 'current.json'), '{}\n');
  writeFileSync(join(root, 'data', 'hub-workspaces.json'), JSON.stringify({
    version: 1,
    defaultWorkspaceId: 'directory',
    workspaces: [
      { id: 'directory', title: 'Directory', kind: 'downstream', root: '.', deliverySource: 'reports/delivery' },
      { id: 'file', title: 'File', kind: 'downstream', root: '.', deliverySource: 'reports/snapshots/current.json' },
    ],
  }));

  const sources = collectPlanningWatchSources(root);
  assert.ok(sources.some(({ sourcePath, kind }) => sourcePath === 'reports/delivery' && kind === 'directory'));
  assert.ok(sources.some(({ sourcePath, kind }) => sourcePath === 'reports/snapshots/current.json' && kind === 'file'));
  assert.ok(sources.some(({ sourcePath }) => sourcePath === 'data'));
});

test('digest walker는 symlink를 따라가지 않고 외부 변경·cycle에 안정적이다', () => {
  const root = setup();
  const outside = tmp('planning-digest-outside-');
  writeFileSync(join(outside, 'secret.json'), '{"secret":"v1"}\n');
  symlinkSync(outside, join(root, 'data', 'external'));
  symlinkSync('.', join(root, 'data', 'cycle'));
  const first = planningInputDigest(root, ['data']);
  writeFileSync(join(outside, 'secret.json'), '{"secret":"v2"}\n');
  const second = planningInputDigest(root, ['data']);
  assert.equal(second, first);

  writeFileSync(join(root, 'data', 'another.json'), '{}\n');
  assert.throws(() => planningInputDigest(root, ['data'], { limits: { maxFiles: 1, maxBytes: 1024, maxDepth: 8 } }), /file limit/i);
  rmSync(outside, { recursive: true, force: true });
});

test('configured delivery path 자체가 symlink이면 status/digest source에서 제외하고 health를 남긴다', () => {
  const root = setup();
  const outside = tmp('planning-delivery-outside-');
  writeFileSync(join(outside, 'evidence.json'), '{"revision":"v1"}\n');
  symlinkSync(outside, join(root, 'reports'));
  writeFileSync(join(root, 'data', 'hub-workspaces.json'), JSON.stringify({
    version: 1,
    defaultWorkspaceId: 'actual',
    workspaces: [{ id: 'actual', title: 'Actual', kind: 'downstream', root: '.', deliverySource: 'reports' }],
  }));

  const configured = collectConfiguredEvidencePaths(root);
  assert.deepEqual(configured.paths, []);
  assert.match(configured.health.map(({ code }) => code).join('\n'), /delivery-source-symlink/);
  const first = planningInputDigest(root);
  writeFileSync(join(outside, 'evidence.json'), '{"revision":"v2"}\n');
  assert.equal(planningInputDigest(root), first);
  rmSync(outside, { recursive: true, force: true });
});
