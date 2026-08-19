// M-1 (specs/017 US2): materialize + keep-committed 는 단일 진입점
// apply-version.sh 로만 묶여 호출된다. 호출부마다 keep-committed 동반 여부가
// 달라 런처·엔트리포인트가 다음 pkg-sync 까지 낡은 채 남던 드리프트의 재발
// 방지 (2026-07-31 감사 M-1).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot, tmp, write } from './helpers/downstream-fixture.mjs';

const PKG_DIR = join(repoRoot, '.harness/scripts/pkg');
// materialize 를 직접 부를 수 있는 유일한 스크립트.
const ENTRYPOINT = 'apply-version.sh';
const CALLERS = [
  'pkg-sync.sh',
  'pkg-apply-pending.sh',
  'pkg-update-major.sh',
  'pin.sh',
  'migrate.sh',
];

test('M-1: materialize.sh 직접 호출은 apply-version.sh 뿐이다', () => {
  assert.ok(existsSync(join(PKG_DIR, ENTRYPOINT)), 'apply-version.sh 가 없다');
  const entry = readFileSync(join(PKG_DIR, ENTRYPOINT), 'utf8');
  assert.match(entry, /materialize\.sh/);
  assert.match(entry, /keep-committed\.sh/);
  for (const name of CALLERS) {
    const src = readFileSync(join(PKG_DIR, name), 'utf8');
    assert.doesNotMatch(
      src,
      /materialize\.sh/,
      `${name} 이 materialize.sh 를 직접 호출한다 — apply-version.sh 를 경유하라`,
    );
    assert.match(src, /apply-version\.sh/, `${name} 이 단일 진입점을 쓰지 않는다`);
  }
});

test('M-1: apply-version 은 링크 구성과 KEEP_COMMITTED 갱신을 함께 수행한다', () => {
  const cacheDir = tmp('codi-apply-cache-');
  const pkg = join(cacheDir, 'versions', '1.0.0');
  write(pkg, '.harness/policies/guardrails.md', 'policy\n');
  write(pkg, 'harness', '#!/bin/sh\necho new launcher\n');
  const repo = tmp('codi-apply-repo-');
  write(repo, 'harness', '#!/bin/sh\necho old launcher\n');
  const result = spawnSync('sh', [join(PKG_DIR, ENTRYPOINT), '1.0.0'], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, CODI_HARNESS_CACHE_DIR: cacheDir },
  });
  assert.equal(result.status, 0, result.stderr);
  // materialize 결과: 링크 생성.
  assert.ok(existsSync(join(repo, '.harness/policies')), '정책 링크가 없다');
  // keep-committed 결과: 커밋 파일이 패키지 버전으로 갱신된다.
  assert.match(readFileSync(join(repo, 'harness'), 'utf8'), /new launcher/);
});
