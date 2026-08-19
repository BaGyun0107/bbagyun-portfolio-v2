import { tmp } from './helpers/fixture-base.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyManifestDigest } from '../.harness/scripts/docs/lib/canonical-json.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLISH_SCRIPT = join(HERE, '..', '.harness/scripts/docs/planning-publish.mjs');
const DEMO_PLANNING = join(HERE, '..', 'examples/community-app/planning');

function withRoot() {
  const root = tmp('codi-publish-');
  mkdirSync(join(root, 'data'), { recursive: true });
  cpSync(DEMO_PLANNING, join(root, 'planning'), { recursive: true });
  rmSync(join(root, 'planning', 'planning-manifest.json'), { force: true });
  writeFileSync(join(root, 'data', 'hub-workspaces.json'), JSON.stringify({
    version: 1,
    defaultWorkspaceId: 'proj',
    workspaces: [{
      id: 'proj', title: 'Proj', kind: 'downstream', root: '.',
      planningSource: 'planning', deliverySource: 'downstream',
    }],
  }));
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

function runPublish(root, args = []) {
  return spawnSync('node', [PUBLISH_SCRIPT, ...args], {
    encoding: 'utf8',
    env: { ...process.env, HUB_ROOT: root },
  });
}

test('publish: planningSource를 컴파일해 유효한 manifest를 쓴다', () => {
  const { root, done } = withRoot();
  const res = runPublish(root, ['--revision', 'proj-rev-1']);
  const manifestPath = join(root, 'planning', 'planning-manifest.json');
  const created = existsSync(manifestPath);
  const manifest = created ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;
  done();

  assert.equal(res.status, 0, res.stderr);
  assert.equal(created, true);
  assert.equal(manifest.projectId, 'proj');
  assert.equal(manifest.sourceRevision, 'proj-rev-1');
  assert.equal(verifyManifestDigest(manifest), true);
  assert.match(res.stdout, /planning:pull/);
});

test('publish: 기존 manifest가 있으면 projectId를 보존하고 revision을 증가시킨다', () => {
  const { root, done } = withRoot();
  runPublish(root, ['--revision', 'proj-rev-1']);
  const first = JSON.parse(readFileSync(join(root, 'planning', 'planning-manifest.json'), 'utf8'));
  const res = runPublish(root);
  const second = JSON.parse(readFileSync(join(root, 'planning', 'planning-manifest.json'), 'utf8'));
  done();

  assert.equal(res.status, 0, res.stderr);
  assert.equal(first.projectId, second.projectId);
  assert.equal(second.sourceRevision, 'proj-rev-2');
  assert.equal(verifyManifestDigest(second), true);
});

test('publish: planning 원본이 불완전하면 실패하고 기존 manifest를 보존한다', () => {
  const { root, done } = withRoot();
  runPublish(root, ['--revision', 'proj-rev-1']);
  const before = readFileSync(join(root, 'planning', 'planning-manifest.json'), 'utf8');
  rmSync(join(root, 'planning', 'needs.json'));
  const res = runPublish(root);
  const after = readFileSync(join(root, 'planning', 'planning-manifest.json'), 'utf8');
  done();

  assert.equal(res.status, 1);
  assert.equal(before, after);
});

test('publish: demo 워크스페이스는 명시 지정 없이는 대상이 아니다', () => {
  const { root, done } = withRoot();
  writeFileSync(join(root, 'data', 'hub-workspaces.json'), JSON.stringify({
    version: 1,
    defaultWorkspaceId: 'demo',
    workspaces: [{
      id: 'demo', title: 'Demo', kind: 'demo', badge: 'DEMO DATA', root: '.',
      planningSource: 'planning', deliverySource: 'downstream',
    }],
  }));
  const res = runPublish(root);
  const skipped = !existsSync(join(root, 'planning', 'planning-manifest.json'));
  const forced = runPublish(root, ['demo', '--revision', 'demo-rev-9']);
  const created = existsSync(join(root, 'planning', 'planning-manifest.json'));
  done();

  assert.equal(res.status, 1);
  assert.equal(skipped, true);
  assert.equal(forced.status, 0, forced.stderr);
  assert.equal(created, true);
});
