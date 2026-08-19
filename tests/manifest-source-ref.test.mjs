// source_ref 안정화 회귀: manifest 의 source_ref 는 릴리스 라인 식별자다.
// 피처 브랜치의 pre-commit 재생성이 브랜치명을 찍으면 모든 동시 PR 이 같은
// 줄을 바꿔 병합 충돌을 보장한다 (2026-08-12 실측). 릴리스 브랜치(vN)에서만
// 갱신하고 그 외에는 기존 값을 보존해야 한다.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmp, initGitRepo, write, gitRaw } from './helpers/fixture-base.mjs';
import { runNode } from './helpers/cli-fixture.mjs';

const SCRIPT = '.harness/scripts/setup/generate-manifest.mjs';

// 원격 없는 fresh clone 판정(v2 branch marker)을 쓰는 하네스 픽스처.
function makeHarnessFixture() {
  const dir = tmp('codi-manifest-ref-');
  initGitRepo(dir, { branch: 'v2' });
  write(dir, 'README.md', 'fixture');
  write(dir, '.harness/.gitkeep', ''); // manifest 기록 대상 디렉터리 보장
  gitRaw(dir, 'add', '.');
  gitRaw(dir, 'commit', '-q', '-m', 'init');
  return dir;
}

function readManifest(dir) {
  return JSON.parse(
    readFileSync(join(dir, '.harness/shared-manifest.json'), 'utf8'),
  );
}

test('릴리스 브랜치(v2)에서는 source_ref 를 브랜치명으로 갱신한다', () => {
  const dir = makeHarnessFixture();
  const res = runNode(SCRIPT, [], { cwd: dir });
  assert.equal(res.status, 0, res.stderr);
  assert.equal(readManifest(dir).source_ref, 'v2');
});

test('피처 브랜치에서는 기존 source_ref 를 보존한다 (병합 충돌 방지)', () => {
  const dir = makeHarnessFixture();
  runNode(SCRIPT, [], { cwd: dir }); // v2 에서 최초 생성 → source_ref v2
  gitRaw(dir, 'checkout', '-q', '-b', 'feat/some-feature');
  write(dir, 'new-file.md', 'x'); // files 목록을 바꿔 재작성을 강제한다
  const res = runNode(SCRIPT, [], { cwd: dir });
  assert.equal(res.status, 0, res.stderr);
  const manifest = readManifest(dir);
  assert.ok(manifest.files.includes('new-file.md'), 'files 목록은 갱신되어야 한다');
  assert.equal(manifest.source_ref, 'v2', '피처 브랜치명이 찍히면 안 된다');
});

test('기존 manifest 가 없으면 현재 브랜치로 폴백한다', () => {
  const dir = makeHarnessFixture();
  gitRaw(dir, 'checkout', '-q', '-b', 'feat/fresh');
  rmSync(join(dir, '.harness/shared-manifest.json'), { force: true });
  const res = runNode(SCRIPT, [], { cwd: dir });
  assert.equal(res.status, 0, res.stderr);
  assert.equal(readManifest(dir).source_ref, 'feat/fresh');
});
