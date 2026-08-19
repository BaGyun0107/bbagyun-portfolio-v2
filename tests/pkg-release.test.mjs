// 릴리스 발행 검증 (specs/005-harness-packaging T018/T019, US4).
// 계약: contracts/pkg-cli.md — 검증 통과 시에만 annotated tag, push는 안 한다.
import { tmp } from './helpers/fixture-base.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE = join(root, '.harness/scripts/pkg/release-check.sh');

// CHANGELOG 내용을 지정해 커밋 하나가 있는 임시 업스트림 작업 레포를 만든다.
function makeReleaseRepo(changelog) {
  const repo = tmp('codi-pkg-release-');
  execFileSync('git', ['init', '--initial-branch=main', '.'], { cwd: repo });
  execFileSync('git', ['config', 'user.email', 't@example.com'], { cwd: repo });
  execFileSync('git', ['config', 'user.name', 'release-test'], { cwd: repo });
  if (changelog !== null) {
    writeFileSync(join(repo, 'CHANGELOG.md'), changelog);
  }
  writeFileSync(join(repo, 'README.md'), 'x');
  execFileSync('git', ['add', '-A'], { cwd: repo });
  execFileSync('git', ['commit', '-m', 'seed'], { cwd: repo });
  return repo;
}

function runRelease(repo, version) {
  return spawnSync('sh', [RELEASE, version], { cwd: repo, encoding: 'utf8' });
}

function tagList(repo) {
  return execFileSync('git', ['tag'], { cwd: repo, encoding: 'utf8' }).trim();
}

test('US4: 형식 위반 태그는 거부한다', () => {
  const repo = makeReleaseRepo('## v1.0.0\n- init\n');
  for (const bad of ['v1.2', '1.2.3', 'vX']) {
    const r = runRelease(repo, bad);
    assert.notEqual(r.status, 0, `should reject: ${bad}`);
  }
  assert.equal(tagList(repo), '');
});

test('US4: CHANGELOG 절이 없으면 거부한다', () => {
  const repo = makeReleaseRepo('## v0.9.0\n- old\n');
  const r = runRelease(repo, 'v1.0.0');
  assert.equal(r.status, 1);
  assert.match(r.stderr + r.stdout, /CHANGELOG/);
  assert.equal(tagList(repo), '');
});

test('US4: 정상이면 annotated tag 생성, push는 하지 않는다', () => {
  const repo = makeReleaseRepo('## v1.0.0\n- 첫 릴리스\n');
  const r = runRelease(repo, 'v1.0.0');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(tagList(repo), 'v1.0.0');
  const type = execFileSync('git', ['cat-file', '-t', 'v1.0.0'], {
    cwd: repo,
    encoding: 'utf8',
  }).trim();
  assert.equal(type, 'tag'); // annotated
  assert.match(r.stdout, /push/); // push는 사람이 하라는 안내
});

test('US4: 중복 태그는 거부한다', () => {
  const repo = makeReleaseRepo('## v1.0.0\n- 첫 릴리스\n');
  assert.equal(runRelease(repo, 'v1.0.0').status, 0);
  const r = runRelease(repo, 'v1.0.0');
  assert.equal(r.status, 1);
});
