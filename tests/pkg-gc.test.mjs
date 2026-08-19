// pkg-gc — 버전 캐시 정리. 참조 중(current/pending)·최신 버전은 보존하고
// 미참조 구버전만 제거한다. 레지스트리가 없으면 아무것도 지우지 않는다.
import { tmp } from './helpers/fixture-base.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const GC = join(root, '.harness/scripts/pkg/pkg-gc.sh');
const MATERIALIZE = join(root, '.harness/scripts/pkg/materialize.sh');

function makeCache(versions) {
  const cache = tmp('codi-gc-cache-');
  for (const v of versions) {
    mkdirSync(join(cache, 'versions', v), { recursive: true });
    writeFileSync(join(cache, 'versions', v, 'VERSION.txt'), v);
  }
  return cache;
}

function makeConsumer(cache, version, { pending } = {}) {
  const repo = tmp('codi-gc-repo-');
  mkdirSync(join(repo, '.harness/state'), { recursive: true });
  symlinkSync(join(cache, 'versions', version), join(repo, '.harness/current'));
  if (pending) writeFileSync(join(repo, '.harness/state/pkg-pending'), `${pending}\n`);
  return repo;
}

function runGc(cache, args = []) {
  return spawnSync('sh', [GC, ...args], {
    encoding: 'utf8',
    env: { ...process.env, CODI_HARNESS_CACHE_DIR: cache },
  });
}

test('레지스트리가 없으면 안내만 하고 아무것도 지우지 않는다', () => {
  const cache = makeCache(['0.0.1', '0.0.2']);
  const r = runGc(cache);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /pkg-sync/);
  assert.ok(existsSync(join(cache, 'versions/0.0.1')));
  assert.ok(existsSync(join(cache, 'versions/0.0.2')));
});

test('참조 버전·pending·최신은 보존하고 미참조 구버전만 제거한다', () => {
  const cache = makeCache(['0.0.1', '0.0.2', '0.0.3', '0.0.4']);
  const repoA = makeConsumer(cache, '0.0.2');
  const repoB = makeConsumer(cache, '0.0.3', { pending: '0.0.1' });
  writeFileSync(
    join(cache, 'repos'),
    `${repoA}\n${repoB}\n${join(tmpdir(), 'codi-gc-gone-repo')}\n`,
  );

  const dry = runGc(cache, ['--dry-run']);
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /변경 없음/);
  assert.ok(existsSync(join(cache, 'versions/0.0.1')), 'dry-run은 지우지 않는다');

  const r = runGc(cache);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(join(cache, 'versions/0.0.1')), 'pending 버전 보존');
  assert.ok(existsSync(join(cache, 'versions/0.0.2')), 'current 참조 버전 보존');
  assert.ok(existsSync(join(cache, 'versions/0.0.3')), 'current 참조 버전 보존');
  assert.ok(existsSync(join(cache, 'versions/0.0.4')), '최신 버전 보존');
  const registry = readFileSync(join(cache, 'repos'), 'utf8');
  assert.doesNotMatch(registry, /gone-repo/, '사라진 레포 경로는 레지스트리에서 정리');
});

test('미참조 구버전이 실제로 제거된다', () => {
  const cache = makeCache(['0.0.1', '0.0.2']);
  const repo = makeConsumer(cache, '0.0.2');
  writeFileSync(join(cache, 'repos'), `${repo}\n`);
  const r = runGc(cache);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(existsSync(join(cache, 'versions/0.0.1')), false, '미참조 구버전 제거');
  assert.ok(existsSync(join(cache, 'versions/0.0.2')));
});

test('materialize가 소비 레포를 레지스트리에 등록한다', () => {
  const cache = makeCache(['9.9.9']);
  const repo = tmp('codi-gc-mat-repo-');
  const r = spawnSync('sh', [MATERIALIZE, '9.9.9'], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, CODI_HARNESS_CACHE_DIR: cache },
  });
  assert.equal(r.status, 0, r.stderr);
  const registry = readFileSync(join(cache, 'repos'), 'utf8').split('\n');
  assert.ok(
    registry.includes(repo) || registry.includes(realpathSync(repo)),
    'materialize 후 레포가 등록되어야 한다',
  );
});
