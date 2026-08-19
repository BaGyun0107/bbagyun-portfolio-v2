import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// 019 US3: 최소 스켈레톤 시작점 — 런처 + harness.lock + 씨앗 파일만 담고,
// 하네스-자체 작업 상태는 절대 포함하지 않는다. 나머지는 bootstrap의 lock
// materialize가 채운다.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(ROOT, '.harness', 'scripts', 'setup', 'new-project-skeleton.sh');

function generate() {
  const dir = mkdtempSync(join(tmpdir(), 'skeleton-019-'));
  execFileSync('sh', [SCRIPT, dir], { encoding: 'utf8' });
  return dir;
}

test('스켈레톤 생성 스크립트가 존재하고 문법이 유효하다', () => {
  assert.ok(existsSync(SCRIPT), 'new-project-skeleton.sh 부재');
  execFileSync('sh', ['-n', SCRIPT]);
});

test('필수 파일이 생성된다 (정본 목록)', () => {
  const dir = generate();
  for (const file of [
    'harness', 'harness.lock', 'mise.toml', '.gitignore',
    'AGENTS.md', 'CLAUDE.md', 'README.md',
    '.harness/config/project-profile.yaml',
  ]) {
    assert.ok(existsSync(join(dir, file)), `누락: ${file}`);
  }
  // 배포/CI 워크플로는 포함, 업스트림 전용(release, harness-ci)은 제외
  const workflows = readdirSync(join(dir, '.github', 'workflows'));
  assert.ok(workflows.length > 0, '.github/workflows 비어 있음');
  assert.ok(!workflows.includes('release.yml'), 'upstream 전용 release.yml 포함됨');
  assert.ok(!workflows.includes('harness-ci.yml'), 'upstream 전용 harness-ci.yml 포함됨');
  const lock = JSON.parse(readFileSync(join(dir, 'harness.lock'), 'utf8'));
  assert.equal(lock.schema_version, 1);
  assert.ok(lock.channel, 'lock channel 누락');
  assert.ok(lock.repo, 'lock repo 누락');
  execFileSync('sh', ['-n', join(dir, 'harness')]);
});

test('하네스-자체 작업 상태가 포함되지 않는다', () => {
  const dir = generate();
  for (const residue of ['specs', 'docs', 'tests', 'data', '.specify']) {
    assert.ok(!existsSync(join(dir, residue)), `잔재 존재: ${residue}`);
  }
  // .harness는 project-owned 씨앗(config)만 담는다 — 스크립트/정책은
  // bootstrap materialize가 채운다.
  assert.deepEqual(readdirSync(join(dir, '.harness')), ['config']);
});

test('비어 있지 않은 디렉터리에는 생성을 거부한다 (멱등 재실행 제외)', () => {
  const dir = generate();
  // 같은 디렉터리 재실행은 멱등(에러 없이 통과)
  execFileSync('sh', [SCRIPT, dir], { encoding: 'utf8' });
  // 스켈레톤 외 파일이 있는 디렉터리는 거부
  const dirty = mkdtempSync(join(tmpdir(), 'skeleton-019-dirty-'));
  execFileSync('sh', ['-c', `touch '${dirty}/existing.txt'`]);
  assert.throws(() => execFileSync('sh', [SCRIPT, dirty], { encoding: 'utf8' }));
});
