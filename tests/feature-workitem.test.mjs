import { tmp } from './helpers/fixture-base.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '.harness/scripts/docs/feature-workitem.mjs',
);

const SINGLE = {
  version: 1,
  defaultWorkspaceId: 'proj',
  workspaces: [{
    id: 'proj', title: 'Proj', kind: 'downstream', root: '.',
    planningSource: 'planning', deliverySource: 'downstream',
  }],
};

function withRoot() {
  const root = tmp('codi-workitem-');
  mkdirSync(join(root, 'data'), { recursive: true });
  writeFileSync(join(root, 'data', 'hub-workspaces.json'), JSON.stringify(SINGLE));
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

function run(root, args) {
  return spawnSync('node', [SCRIPT, ...args], {
    encoding: 'utf8',
    env: { ...process.env, HUB_ROOT: root },
  });
}

test('workitem: evidence 파일이 없으면 스켈레톤과 함께 explicit 항목을 만든다', () => {
  const { root, done } = withRoot();
  const res = run(root, ['FEAT-X', 'frontend', '검색 화면 구현']);
  const evidence = JSON.parse(readFileSync(join(root, 'downstream', 'delivery-evidence.json'), 'utf8'));
  done();

  assert.equal(res.status, 0, res.stderr);
  assert.equal(evidence.projectId, 'proj');
  assert.equal(evidence.workItems.length, 1);
  assert.deepEqual(evidence.workItems[0], {
    id: 'WORK-X-FRONTEND',
    featureDefinitionId: 'FEAT-X',
    title: '검색 화면 구현',
    workType: 'frontend',
    releaseId: 'unassigned',
    status: 'planned',
    taskRefs: [],
    evidenceRefs: [],
  });
  assert.match(res.stdout, /feature:stub/);
});

test('workitem: 같은 ID가 있으면 실패하고 아무것도 바꾸지 않는다', () => {
  const { root, done } = withRoot();
  run(root, ['FEAT-X', 'frontend', '첫 작업']);
  const before = readFileSync(join(root, 'downstream', 'delivery-evidence.json'), 'utf8');
  const res = run(root, ['FEAT-X', 'frontend', '중복 작업']);
  const after = readFileSync(join(root, 'downstream', 'delivery-evidence.json'), 'utf8');
  done();

  assert.equal(res.status, 1);
  assert.match(res.stderr, /WORK-X-FRONTEND/);
  assert.equal(before, after);
});

test('workitem: done 상태와 잘못된 workType은 거부한다', () => {
  const { root, done } = withRoot();
  const doneRes = run(root, ['FEAT-X', 'backend', '작업', 'done']);
  const typeRes = run(root, ['FEAT-X', 'mobile', '작업']);
  done();

  assert.equal(doneRes.status, 1);
  assert.match(doneRes.stderr, /acceptance/);
  assert.equal(typeRes.status, 1);
  assert.match(typeRes.stderr, /workType/);
});
