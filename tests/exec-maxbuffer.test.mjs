// 대형 레포 회귀: git 출력이 Node 기본 maxBuffer(1MB)를 넘어도 하네스
// 스크립트가 ENOBUFS로 죽지 않아야 한다 (2026-08-07 gnuboard 파일럿 실측).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { tmp } from './helpers/fixture-base.mjs';
import { runCommand, runNode } from './helpers/cli-fixture.mjs';

function makeHugeIndexRepo() {
  const dir = tmp('codi-enobufs-test-');
  runCommand('git', ['init', '-q'], { cwd: dir });
  const blob = execFileSync('git', ['hash-object', '-w', '--stdin'], {
    cwd: dir,
    input: 'x',
    encoding: 'utf8',
  }).trim();
  // 디스크 파일 없이 인덱스 엔트리만 대량 등록한다 — ls-files 출력을
  // 1MB 초과(약 1.5MB)로 만드는 가장 빠른 방법.
  const seg = 'a'.repeat(60);
  let info = '';
  for (let i = 0; i < 12000; i += 1) {
    info += `100644 ${blob}\t${seg}/${seg}/f${String(i).padStart(5, '0')}.txt\n`;
  }
  execFileSync('git', ['update-index', '--index-info'], {
    cwd: dir,
    input: info,
    encoding: 'utf8',
  });
  const size = execFileSync('git', ['ls-files'], {
    cwd: dir,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }).length;
  assert.ok(size > 1024 * 1024, `fixture ls-files must exceed 1MB (got ${size})`);
  return dir;
}

test('migrate-plan survives >1MB git ls-files output (no ENOBUFS)', () => {
  const repo = makeHugeIndexRepo();
  const manifest = join(repo, 'manifest.json');
  writeFileSync(manifest, JSON.stringify({ files: ['.harness/workflow.md'] }));

  const res = runNode('.harness/scripts/pkg/migrate-plan.mjs', [repo, manifest]);
  assert.equal(res.status, 0, res.stderr);
  assert.doesNotMatch(res.stderr ?? '', /ENOBUFS/);
});

test('prune-downstream check mode survives >1MB git output (no ENOBUFS)', () => {
  const repo = makeHugeIndexRepo();
  mkdirSync(join(repo, '.harness'), { recursive: true });

  const res = runNode('.harness/scripts/setup/prune-downstream.mjs', [], { cwd: repo });
  assert.doesNotMatch(res.stderr ?? '', /ENOBUFS/);
  assert.doesNotMatch(res.stdout ?? '', /ENOBUFS/);
});
