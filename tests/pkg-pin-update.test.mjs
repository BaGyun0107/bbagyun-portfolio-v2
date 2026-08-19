// 자동 업데이트(US2)와 pin/롤백/오프라인(US3) 플로우
// (specs/005-harness-packaging T011~T017). 계약: contracts/pkg-cli.md.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readlinkSync, renameSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  makeFakeUpstream,
  addUpstreamVersion,
  makeIsolatedEnv,
  makeDownstreamRepo,
} from './helpers/pkg-fixture.mjs';
import { track } from './helpers/fixture-base.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PKG = join(root, '.harness/scripts/pkg');

function run(script, args, repo, env) {
  return spawnSync('sh', [join(PKG, script), ...args], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, CODI_HARNESS_CACHE_DIR: env.cacheDir },
  });
}

function currentVersion(repo) {
  return basename(readlinkSync(join(repo, '.harness/current')));
}

// v1.0.0이 설치된 채널 모드 다운스트림을 준비한다.
function installedRepo() {
  const upstream = makeFakeUpstream([
    { version: '1.0.0', files: { '.claude/rules/base.md': 'r1' } },
  ]);
  const env = makeIsolatedEnv();
  const repo = makeDownstreamRepo({
    schema_version: 1,
    channel: 'latest-minor',
    repo: upstream.bare,
  });
  const sync = run('pkg-sync.sh', [], repo, env);
  assert.equal(sync.status, 0, sync.stderr);
  assert.equal(currentVersion(repo), '1.0.0');
  return { upstream, env, repo };
}

// --- US2: 자동 업데이트 ---

test('US2: patch 수신은 pending까지만 — current 불변', () => {
  const { upstream, env, repo } = installedRepo();
  addUpstreamVersion(upstream, { version: '1.0.1' });
  const r = run('pkg-update-check.sh', [], repo, env);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(
    readFileSync(join(repo, '.harness/state/pkg-pending'), 'utf8').trim(),
    '1.0.1',
  );
  assert.ok(existsSync(join(env.cacheDir, 'versions/1.0.1')));
  assert.equal(currentVersion(repo), '1.0.0');
});

test('US2: preflight apply — flip + pending 해제', () => {
  const { upstream, env, repo } = installedRepo();
  addUpstreamVersion(upstream, { version: '1.0.1' });
  run('pkg-update-check.sh', [], repo, env);
  const r = run('pkg-apply-pending.sh', [], repo, env);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(currentVersion(repo), '1.0.1');
  assert.equal(existsSync(join(repo, '.harness/state/pkg-pending')), false);
});

test('US2: major만 있으면 반영 없이 안내', () => {
  const { upstream, env, repo } = installedRepo();
  addUpstreamVersion(upstream, { version: '2.0.0' });
  const r = run('pkg-update-check.sh', [], repo, env);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(existsSync(join(repo, '.harness/state/pkg-pending')), false);
  assert.match(r.stdout, /update --major/);
  assert.equal(currentVersion(repo), '1.0.0');
});

// --- US3: pin / 롤백 / 오프라인 ---

test('US3: 캐시 보유 버전 pin은 오프라인에서도 즉시 전환', () => {
  const upstream = makeFakeUpstream([
    { version: '1.0.0', files: { '.claude/rules/base.md': 'r1' } },
    { version: '1.0.1', files: { '.claude/rules/base.md': 'r2' } },
  ]);
  const env = makeIsolatedEnv();
  const repo = makeDownstreamRepo({
    schema_version: 1,
    channel: 'latest-minor',
    repo: upstream.bare,
  });
  run('pkg-sync.sh', [], repo, env); // 1.0.1 설치
  run('fetch-version.sh', [upstream.bare, '1.0.0'], repo, env); // 롤백 대상 확보
  renameSync(upstream.bare, track(upstream.bare + ".gone")); // 오프라인
  const r = run('pin.sh', ['1.0.0'], repo, env);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(currentVersion(repo), '1.0.0');
  const lock = JSON.parse(readFileSync(join(repo, 'harness.lock'), 'utf8'));
  assert.equal(lock.version, '1.0.0');
  assert.equal(lock.channel, undefined);
});

test('US3: 캐시 없음 + 오프라인 pin은 lock·트리 불변 exit 1', () => {
  const { upstream, env, repo } = installedRepo();
  const lockBefore = readFileSync(join(repo, 'harness.lock'), 'utf8');
  renameSync(upstream.bare, track(upstream.bare + ".gone"));
  const r = run('pin.sh', ['1.5.0'], repo, env);
  assert.equal(r.status, 1);
  assert.equal(readFileSync(join(repo, 'harness.lock'), 'utf8'), lockBefore);
  assert.equal(currentVersion(repo), '1.0.0');
});

test('US3: --channel 복귀는 lock을 채널 형태로 되돌린다', () => {
  const { env, repo } = installedRepo();
  run('pin.sh', ['1.0.0'], repo, env);
  const r = run('pin.sh', ['--channel', 'latest-minor'], repo, env);
  assert.equal(r.status, 0, r.stderr);
  const lock = JSON.parse(readFileSync(join(repo, 'harness.lock'), 'utf8'));
  assert.equal(lock.channel, 'latest-minor');
  assert.equal(lock.version, undefined);
});

test('US3: 버전 형식 오류는 exit 2', () => {
  const { env, repo } = installedRepo();
  const r = run('pin.sh', ['v1.2'], repo, env);
  assert.equal(r.status, 2);
});

test('US3: update --major는 명시 실행 시에만 상위 major로 전환', () => {
  const { upstream, env, repo } = installedRepo();
  addUpstreamVersion(upstream, { version: '2.0.0' });
  const r = run('pkg-update-major.sh', [], repo, env);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(currentVersion(repo), '2.0.0');
});

test('US2: 오프라인이면 조용히 스킵', () => {
  const { upstream, env, repo } = installedRepo();
  renameSync(upstream.bare, track(upstream.bare + ".gone"));
  const r = run('pkg-update-check.sh', [], repo, env);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(existsSync(join(repo, '.harness/state/pkg-pending')), false);
  assert.equal(currentVersion(repo), '1.0.0');
});
