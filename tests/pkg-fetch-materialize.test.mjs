// 캐시 수신 + materialize (specs/005-harness-packaging T005~T007).
// 계약: contracts/pkg-cli.md, data-model.md, research.md R2/R3/R4.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn, spawnSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  makeFakeUpstream,
  makeIsolatedEnv,
  makeDownstreamRepo,
} from './helpers/pkg-fixture.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FETCH = join(root, '.harness/scripts/pkg/fetch-version.sh');
const MATERIALIZE = join(root, '.harness/scripts/pkg/materialize.sh');

const PKG_FILES = {
  '.claude/rules/base.md': 'shared rule v1',
  '.harness/skills/demo-skill/SKILL.md': 'demo skill v1',
};

// 동일 구성 업스트림은 읽기 전용으로 1회만 만든다 (감사 L-15 — bare+work
// 실 git 레포 2개 생성이 호출당 비용의 대부분). 태그를 추가·변형하는
// 시나리오는 반드시 전용 인스턴스를 새로 만들 것.
let sharedUpstreamCache = null;
function sharedUpstream() {
  sharedUpstreamCache ??= makeFakeUpstream([{ version: '1.0.0', files: PKG_FILES }]);
  return sharedUpstreamCache;
}

function runFetch(upstream, version, env) {
  return spawnSync('sh', [FETCH, upstream.bare, version], {
    encoding: 'utf8',
    env: { ...process.env, CODI_HARNESS_CACHE_DIR: env.cacheDir },
  });
}

function runMaterialize(repo, version, env) {
  return spawnSync('sh', [MATERIALIZE, version], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, CODI_HARNESS_CACHE_DIR: env.cacheDir },
  });
}

test('US1: 빈 캐시 수신 — partial 없이 확정 디렉토리만 남는다', () => {
  const upstream = sharedUpstream();
  const env = makeIsolatedEnv();
  const r = runFetch(upstream, '1.0.0', env);
  assert.equal(r.status, 0, r.stderr);
  const versionDir = join(env.cacheDir, 'versions/1.0.0');
  assert.equal(readFileSync(join(versionDir, 'VERSION.txt'), 'utf8'), '1.0.0');
  const leftovers = readdirSync(join(env.cacheDir, 'versions')).filter((n) =>
    n.includes('.partial'),
  );
  assert.deepEqual(leftovers, []);
});

test('US1: 기수신 버전은 재수신하지 않는다', () => {
  const upstream = sharedUpstream();
  const env = makeIsolatedEnv();
  assert.equal(runFetch(upstream, '1.0.0', env).status, 0);
  const sentinel = join(env.cacheDir, 'versions/1.0.0/sentinel.txt');
  writeFileSync(sentinel, 'keep');
  assert.equal(runFetch(upstream, '1.0.0', env).status, 0);
  assert.equal(readFileSync(sentinel, 'utf8'), 'keep');
});

test('US1: materialize — current flip + 문서화된 심링크 형태', () => {
  const upstream = sharedUpstream();
  const env = makeIsolatedEnv();
  runFetch(upstream, '1.0.0', env);
  const repo = makeDownstreamRepo({ schema_version: 1, version: '1.0.0' });
  const r = runMaterialize(repo, '1.0.0', env);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(lstatSync(join(repo, '.harness/current')).isSymbolicLink());
  assert.ok(
    lstatSync(join(repo, '.claude/rules/shared')).isSymbolicLink(),
  );
  assert.equal(
    readFileSync(join(repo, '.claude/rules/shared/base.md'), 'utf8'),
    'shared rule v1',
  );
  assert.ok(lstatSync(join(repo, '.claude/skills/demo-skill')).isSymbolicLink());
  assert.equal(
    readFileSync(join(repo, '.claude/skills/demo-skill/SKILL.md'), 'utf8'),
    'demo skill v1',
  );
});

test('US1: 두 레포가 서로 다른 버전으로 공존', () => {
  const upstream = makeFakeUpstream([
    { version: '1.0.0', files: PKG_FILES },
    {
      version: '1.2.0',
      files: { '.claude/rules/base.md': 'shared rule v2' },
    },
  ]);
  const env = makeIsolatedEnv();
  runFetch(upstream, '1.0.0', env);
  runFetch(upstream, '1.2.0', env);
  const repoA = makeDownstreamRepo({ schema_version: 1, version: '1.0.0' });
  const repoB = makeDownstreamRepo({ schema_version: 1, version: '1.2.0' });
  runMaterialize(repoA, '1.0.0', env);
  runMaterialize(repoB, '1.2.0', env);
  assert.equal(
    readFileSync(join(repoA, '.claude/rules/shared/base.md'), 'utf8'),
    'shared rule v1',
  );
  assert.equal(
    readFileSync(join(repoB, '.claude/rules/shared/base.md'), 'utf8'),
    'shared rule v2',
  );
});

test('US1: 동시 수신 — 두 프로세스 모두 성공, 캐시 무결', async () => {
  const upstream = sharedUpstream();
  const env = makeIsolatedEnv();
  const spawnFetch = () =>
    new Promise((resolve) => {
      const p = spawn('sh', [FETCH, upstream.bare, '1.0.0'], {
        env: { ...process.env, CODI_HARNESS_CACHE_DIR: env.cacheDir },
      });
      p.on('exit', (code) => resolve(code));
    });
  const codes = await Promise.all([spawnFetch(), spawnFetch()]);
  assert.deepEqual(codes, [0, 0]);
  assert.equal(
    readFileSync(join(env.cacheDir, 'versions/1.0.0/VERSION.txt'), 'utf8'),
    '1.0.0',
  );
});

test('US1: pkg-sync — 채널 lock 첫 설치는 최신 버전을 받아 materialize', () => {
  const upstream = makeFakeUpstream([
    { version: '1.0.0', files: PKG_FILES },
    { version: '1.2.0', files: { '.claude/rules/base.md': 'shared rule v2' } },
  ]);
  const env = makeIsolatedEnv();
  const repo = makeDownstreamRepo({
    schema_version: 1,
    channel: 'latest-minor',
    repo: upstream.bare,
  });
  const r = spawnSync('sh', [join(root, '.harness/scripts/pkg/pkg-sync.sh')], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, CODI_HARNESS_CACHE_DIR: env.cacheDir },
  });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(
    readFileSync(join(repo, '.claude/rules/shared/base.md'), 'utf8'),
    'shared rule v2',
  );
});

test('US1: pkg-sync — 이미 최신이어도 소비 레포를 레지스트리에 등록한다', () => {
  const upstream = sharedUpstream();
  const env = makeIsolatedEnv();
  const repo = makeDownstreamRepo({
    schema_version: 1,
    channel: 'latest-minor',
    repo: upstream.bare,
  });
  const runSync = () =>
    spawnSync('sh', [join(root, '.harness/scripts/pkg/pkg-sync.sh')], {
      cwd: repo,
      encoding: 'utf8',
      env: { ...process.env, CODI_HARNESS_CACHE_DIR: env.cacheDir },
    });
  assert.equal(runSync().status, 0);
  rmSync(join(env.cacheDir, 'repos'));
  const r = runSync();
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /최신입니다/);
  const registry = readFileSync(join(env.cacheDir, 'repos'), 'utf8').split('\n');
  assert.ok(
    registry.includes(repo) || registry.includes(realpathSync(repo)),
    '이미 최신인 pkg-sync 후에도 레포가 등록되어야 한다',
  );
});

test('US1: 대상 경로의 사용자 실파일은 보존하고 경고한다', () => {
  const upstream = sharedUpstream();
  const env = makeIsolatedEnv();
  runFetch(upstream, '1.0.0', env);
  const repo = makeDownstreamRepo({ schema_version: 1, version: '1.0.0' });
  mkdirSync(join(repo, '.claude/rules/shared'), { recursive: true });
  writeFileSync(join(repo, '.claude/rules/shared/mine.md'), 'user content');
  const r = runMaterialize(repo, '1.0.0', env);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(
    readFileSync(join(repo, '.claude/rules/shared/mine.md'), 'utf8'),
    'user content',
  );
  assert.match(r.stderr + r.stdout, /경고/);
  assert.equal(existsSync(join(repo, '.harness/current')), true);
});
