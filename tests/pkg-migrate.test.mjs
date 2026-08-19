// harness migrate (specs/006-harness-migrate). 계약: contracts/migrate-cli.md.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeRemovals } from '../.harness/scripts/pkg/migrate-plan.mjs';
import {
  makeLegacyDownstream,
  makeMigrateUpstream,
  makeIsolatedEnv,
  addUpstreamVersion,
} from './helpers/pkg-fixture.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATE = join(root, '.harness/scripts/pkg/migrate.sh');

const SHARED = {
  '.claude/rules/phase-routing.md': 'shared rule',
  '.harness/hooks/guardrails.mjs': '// hook',
  '.harness/policies/guardrails.md': 'policy',
  // 링크(.harness/policies) 아래 한 단계 더 중첩된 경로 — 조상 심링크 검사가
  // 부모 한 단계만 보면 캐시 원본이 삭제된다 (2026-07-29 실제 사고).
  '.harness/policies/nested/deep.md': 'nested policy',
  // CI가 호출하는 KEEP_COMMITTED 스크립트 — 심링크 아래 갇히면 안 된다.
  '.harness/scripts/checks/ci-node-verify.sh': '# ci verify',
  '.claude/settings.json': '{"hooks":{"pkg":true}}',
  harness: '#!/bin/sh\necho new-launcher\n',
};
// 구버전에만 있던 stale 공유 파일 — 새 manifest에는 없다 (리허설 발견 결함)
const STALE = {
  '.harness/scripts/agent/old-preflight.sh': '# stale',
};
// 전환 시점 manifest 에는 없다가 이후 버전에서 공유로 승격되는 파일.
// 실제 사례: .harness/config/*-schema.json 9개 (2026-07-30 codi-hansi).
const LATE_PATH = '.harness/config/late-schema.json';
const LATE = { [LATE_PATH]: '{"late":true}' };
const PROJECT = {
  'specs/001-feature/spec.md': 'my spec',
  '.harness/skills-local/my-skill/SKILL.md': 'my skill',
  '.harness/config/project-profile.yaml': 'mode: split',
};

function setupMigrate() {
  const upstream = makeMigrateUpstream({ version: '1.0.0', sharedFiles: SHARED });
  const env = makeIsolatedEnv();
  const repo = makeLegacyDownstream({
    sharedFiles: {
      ...SHARED,
      ...STALE,
      // 레포에는 구버전 런처가 커밋되어 있다 — migrate가 패키지 버전으로 갱신해야 함
      harness: '#!/bin/sh\necho old-launcher\n',
    },
    projectFiles: PROJECT,
  });
  return { upstream, env, repo };
}

function runMigrate(repo, env, upstream, args = []) {
  return spawnSync('sh', [MIGRATE, ...args], {
    cwd: repo,
    encoding: 'utf8',
    env: {
      ...process.env,
      CODI_HARNESS_CACHE_DIR: env.cacheDir,
      CODI_HARNESS_UPSTREAM_URL: upstream ? upstream.bare : '/nonexistent/upstream.git',
    },
  });
}

function runPkgSync(repo, env, upstream) {
  return spawnSync('sh', [join(root, '.harness/scripts/pkg/pkg-sync.sh')], {
    cwd: repo,
    encoding: 'utf8',
    env: {
      ...process.env,
      CODI_HARNESS_CACHE_DIR: env.cacheDir,
      CODI_HARNESS_UPSTREAM_URL: upstream.bare,
    },
  });
}

function gitStatus(repo) {
  return execFileSync('git', ['-C', repo, 'status', '--porcelain'], {
    encoding: 'utf8',
  });
}

// --- US1: migrate 플로우 ---

test('US1: dry-run은 목록만 출력하고 변경 0건', () => {
  const { upstream, env, repo } = setupMigrate();
  const r = runMigrate(repo, env, upstream, ['--dry-run']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /\.claude\/rules\/phase-routing\.md/);
  assert.equal(gitStatus(repo), '');
  assert.equal(existsSync(join(repo, 'harness.lock')), false);
});

test('US1: 전환 — lock 생성 + 공유 제거 + 소유물 보존', () => {
  const { upstream, env, repo } = setupMigrate();
  const r = runMigrate(repo, env, upstream);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.ok(existsSync(join(repo, 'harness.lock')));
  assert.equal(existsSync(join(repo, '.claude/rules/phase-routing.md')), false);
  // policies는 디렉토리 링크로 대체 — 파일은 패키지 경유로만 존재하고
  // 커밋 추적에서는 빠져야 한다
  assert.ok(lstatSync(join(repo, '.harness/policies')).isSymbolicLink());
  const tracked = execFileSync('git', ['-C', repo, 'ls-files'], {
    encoding: 'utf8',
  });
  assert.doesNotMatch(tracked, /\.harness\/policies\/guardrails\.md/);
  assert.doesNotMatch(tracked, /\.claude\/rules\/phase-routing\.md/);
  for (const rel of Object.keys(PROJECT)) {
    assert.equal(readFileSync(join(repo, rel), 'utf8'), PROJECT[rel]);
  }
  assert.equal(
    readFileSync(join(repo, '.claude/rules/shared/phase-routing.md'), 'utf8'),
    'shared rule',
  );
  assert.match(r.stdout, /git restore/);
});

test('US1: 겹침 경로는 제거 후 링크로 대체된다 (리허설 결함 1)', () => {
  const { upstream, env, repo } = setupMigrate();
  const r = runMigrate(repo, env, upstream);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  // 커밋 실파일이었던 자리에 링크가 존재하고 내용이 패키지 버전이어야 한다
  assert.ok(lstatSync(join(repo, '.claude/settings.json')).isSymbolicLink());
  assert.equal(
    readFileSync(join(repo, '.claude/settings.json'), 'utf8'),
    '{"hooks":{"pkg":true}}',
  );
  assert.equal(
    readFileSync(join(repo, '.harness/hooks/guardrails.mjs'), 'utf8'),
    '// hook',
  );
});

test('US1: stale 공유 파일도 전용 디렉토리에서 제거된다 (리허설 결함 2)', () => {
  const { upstream, env, repo } = setupMigrate();
  const r = runMigrate(repo, env, upstream);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(
    existsSync(join(repo, '.harness/scripts/agent/old-preflight.sh')),
    false,
  );
});

test('US1: KEEP_COMMITTED 런처는 패키지 버전으로 갱신된다 (리허설 결함 3)', () => {
  const { upstream, env, repo } = setupMigrate();
  const r = runMigrate(repo, env, upstream);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(
    readFileSync(join(repo, 'harness'), 'utf8'),
    '#!/bin/sh\necho new-launcher\n',
  );
});

test('US1: 레포 자신의 스크립트 사본으로 실행해도 전환 완료 (자기 삭제 회귀)', () => {
  // 실제 다운스트림은 ./harness migrate → 레포에 커밋된 사본을 실행한다.
  // git rm이 그 사본의 디렉토리를 지우므로, 이후 단계(materialize·
  // ensure-gitignore)는 캐시 패키지 스크립트로 위임돼야 한다.
  const real = (rel) => readFileSync(join(root, rel), 'utf8');
  const tooling = {
    '.harness/scripts/pkg/migrate.sh': real('.harness/scripts/pkg/migrate.sh'),
    '.harness/scripts/pkg/migrate-plan.mjs': real('.harness/scripts/pkg/migrate-plan.mjs'),
    '.harness/scripts/pkg/resolve-version.mjs': real('.harness/scripts/pkg/resolve-version.mjs'),
    '.harness/scripts/pkg/fetch-version.sh': real('.harness/scripts/pkg/fetch-version.sh'),
    '.harness/scripts/pkg/materialize.sh': real('.harness/scripts/pkg/materialize.sh'),
    '.harness/scripts/pkg/apply-version.sh': real('.harness/scripts/pkg/apply-version.sh'),
    '.harness/scripts/pkg/keep-committed.sh': real('.harness/scripts/pkg/keep-committed.sh'),
    '.harness/scripts/setup/project-owned.mjs': real('.harness/scripts/setup/project-owned.mjs'),
    '.harness/scripts/setup/ensure-gitignore.mjs': real('.harness/scripts/setup/ensure-gitignore.mjs'),
    '.harness/config/required-gitignore.json': real('.harness/config/required-gitignore.json'),
    'lint-staged.config.mjs': 'export default {};\n',
  };
  // gitignore된 공유 복사본도 함께 둔다: 잔재 정리 블록이 레포 사본 경로로
  // migrate-plan을 찾으면(자기 삭제 이후라 이미 없음) 조용히 실패해 vendor가
  // 남는다 — codi-crew에서 실제로 발생한 결함.
  const shared = {
    ...SHARED,
    ...tooling,
    '.harness/vendor/speckit/VENDOR-INFO.json': '{"speckit_version":"v1.0.0"}',
  };
  const upstream = makeMigrateUpstream({ version: '1.0.0', sharedFiles: shared });
  const env = makeIsolatedEnv();
  const repo = makeLegacyDownstream({
    sharedFiles: { ...shared, harness: '#!/bin/sh\necho old-launcher\n' },
    projectFiles: PROJECT,
  });
  // 이후에 ignore로 전환 — 파일은 디스크에 남고 인덱스에서만 빠진다.
  writeFileSync(join(repo, '.gitignore'), 'vendor/\n');
  execFileSync('git', ['-C', repo, 'rm', '-r', '--cached', '-q', '.harness/vendor']);
  execFileSync('git', ['-C', repo, 'add', '-A']);
  execFileSync('git', ['-C', repo, 'commit', '-q', '-m', 'ignore vendor']);
  const res = spawnSync('sh', [join(repo, '.harness/scripts/pkg/migrate.sh')], {
    cwd: repo,
    encoding: 'utf8',
    env: {
      ...process.env,
      CODI_HARNESS_CACHE_DIR: env.cacheDir,
      CODI_HARNESS_UPSTREAM_URL: upstream.bare,
    },
  });
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /전환 완료/);
  assert.ok(
    lstatSync(join(repo, 'lint-staged.config.mjs')).isSymbolicLink(),
    'lint-staged 설정이 패키지 링크로 제공되어야 pre-commit이 동작한다',
  );
  assert.match(
    readFileSync(join(repo, '.gitignore'), 'utf8'),
    /lint-staged\.config\.mjs/,
    'lock 모드 gitignore가 materialize 링크를 덮어야 한다',
  );
  assert.doesNotMatch(res.stderr, /심링크가 아닌 실파일이라 보존/);
  assert.ok(
    lstatSync(join(repo, '.harness/vendor')).isSymbolicLink(),
    'ignore된 vendor 잔재도 정리되어 링크로 대체돼야 한다 (자기 삭제 이후에도)',
  );
});

test('US1: dirty 워킹트리는 중단한다', () => {
  const { upstream, env, repo } = setupMigrate();
  writeFileSync(join(repo, '.harness/policies/guardrails.md'), 'edited');
  const r = runMigrate(repo, env, upstream);
  assert.equal(r.status, 1);
  assert.equal(existsSync(join(repo, 'harness.lock')), false);
});

test('US1: 업스트림 하네스 레포에서는 거부한다', () => {
  const { upstream, env, repo } = setupMigrate();
  execFileSync('git', ['-C', repo, 'branch', 'v2'], { encoding: 'utf8' });
  const r = runMigrate(repo, env, upstream);
  assert.equal(r.status, 2);
  assert.equal(existsSync(join(repo, 'harness.lock')), false);
});

test('US1: 전환 완료 후 재실행은 멱등', () => {
  const { upstream, env, repo } = setupMigrate();
  assert.equal(runMigrate(repo, env, upstream).status, 0);
  execFileSync('git', ['-C', repo, 'add', '-A']);
  execFileSync('git', ['-C', repo, 'commit', '-m', 'migrate'], { cwd: repo });
  const r = runMigrate(repo, env, upstream);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /이미/);
});

// --- US2: 룰 이중 로드 해소 (--fresh, init-project 경로) ---

test('US2: --fresh는 untracked 복사본도 제거해 단일 출처를 만든다', () => {
  const upstream = makeMigrateUpstream({ version: '1.0.0', sharedFiles: SHARED });
  const env = makeIsolatedEnv();
  // init 직후 상태 재현: 프로젝트 소유물만 커밋, 공유 복사본은 untracked
  const repo = makeLegacyDownstream({ sharedFiles: {}, projectFiles: PROJECT });
  for (const [rel, content] of Object.entries(SHARED)) {
    const abs = join(repo, rel);
    execFileSync('mkdir', ['-p', dirname(abs)]);
    writeFileSync(abs, content);
  }
  const r = runMigrate(repo, env, upstream, ['--fresh']);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(existsSync(join(repo, '.claude/rules/phase-routing.md')), false);
  assert.equal(
    readFileSync(join(repo, '.claude/rules/shared/phase-routing.md'), 'utf8'),
    'shared rule',
  );
  assert.doesNotMatch(r.stdout, /리뷰/);
  for (const rel of Object.keys(PROJECT)) {
    assert.equal(readFileSync(join(repo, rel), 'utf8'), PROJECT[rel]);
  }
});

test('US2: --fresh 재실행은 혼합 상태(lock+current+복사본 잔존)를 복구한다', () => {
  // init 도중 pkg-sync가 먼저 materialize 해 lock/current가 생긴 뒤에도
  // 복사본이 남아 있으면 --fresh가 끝까지 진행해 정리해야 한다
  // (시나리오 A 리허설 발견 결함).
  const upstream = makeMigrateUpstream({ version: '1.0.0', sharedFiles: SHARED });
  const env = makeIsolatedEnv();
  const repo = makeLegacyDownstream({ sharedFiles: {}, projectFiles: PROJECT });
  for (const [rel, content] of Object.entries(SHARED)) {
    const abs = join(repo, rel);
    execFileSync('mkdir', ['-p', dirname(abs)]);
    writeFileSync(abs, content);
  }
  const first = runMigrate(repo, env, upstream, ['--fresh']);
  assert.equal(first.status, 0, first.stderr + first.stdout);

  // 혼합 상태 재현: 전환 후 공유 복사본(실디렉토리)이 다시 남은 경우
  const leftover = join(repo, '.harness/policies/guardrails.md');
  execFileSync('rm', ['-f', join(repo, '.harness/policies')]);
  execFileSync('mkdir', ['-p', dirname(leftover)]);
  writeFileSync(leftover, 'stale copy');

  const second = runMigrate(repo, env, upstream, ['--fresh']);
  assert.equal(second.status, 0, second.stderr + second.stdout);
  assert.doesNotMatch(second.stdout, /이미 lock 모드/);
  assert.ok(
    lstatSync(join(repo, '.harness/policies')).isSymbolicLink(),
    '잔존 실디렉토리가 다시 패키지 링크로 대체되어야 한다',
  );
  assert.equal(
    readFileSync(leftover, 'utf8'),
    'policy',
    '경로가 잔존 복사본이 아니라 패키지 원본을 보여야 한다',
  );
});

test('US1: 오프라인이면 lock 미생성 상태로 중단', () => {
  const { env, repo } = setupMigrate();
  const r = runMigrate(repo, env, null); // 존재하지 않는 업스트림 URL
  assert.equal(r.status, 1);
  assert.equal(existsSync(join(repo, 'harness.lock')), false);
  assert.equal(gitStatus(repo), '');
});

// --- Foundational: 제거 목록 계산 (research.md R1) ---

test('plan: manifest ∩ tracked − project-owned − keep-committed', () => {
  const manifestFiles = [
    '.claude/rules/phase-routing.md',
    '.harness/hooks/guardrails.mjs',
    '.harness/config/project-profile.yaml', // project-owned — 제외
    'harness', // keep-committed — 제외
    'mise.toml', // keep-committed — 제외
    'AGENTS.md', // keep-committed(진입점) — 제외
    '.harness/policies/guardrails.md',
  ];
  const trackedFiles = [
    '.claude/rules/phase-routing.md',
    '.harness/hooks/guardrails.mjs',
    '.harness/config/project-profile.yaml',
    'harness',
    'mise.toml',
    'AGENTS.md',
    // .harness/policies/guardrails.md 는 tracked 아님 — 제외
    'specs/001-feature/spec.md',
  ];
  const removals = computeRemovals({ manifestFiles, trackedFiles });
  assert.deepEqual(removals, [
    '.claude/rules/phase-routing.md',
    '.harness/hooks/guardrails.mjs',
  ]);
});

test('plan: 프로젝트 소유물은 manifest에 있어도 절대 제거되지 않는다', () => {
  const owned = [
    '.harness/skills-local/my-skill/SKILL.md',
    'specs/002-x/spec.md',
    '.harness/config/project-profile.yaml',
  ];
  const removals = computeRemovals({
    manifestFiles: owned,
    trackedFiles: owned,
  });
  assert.deepEqual(removals, []);
});

// --- 회귀: gitignore된 공유 복사본 / --fresh 캐시 파괴 (2026-07-29) ---

test('회귀: .gitignore로 무시된 공유 복사본도 전환에서 정리된다', () => {
  // 패키지가 vendor를 공유 자산으로 배포하는 상황을 재현한다.
  const shared = {
    ...SHARED,
    '.harness/vendor/speckit/VENDOR-INFO.json': '{"speckit_version":"v1.0.0"}',
  };
  const upstream = makeMigrateUpstream({ version: '1.0.0', sharedFiles: shared });
  const env = makeIsolatedEnv();
  const repo = makeLegacyDownstream({
    sharedFiles: { ...shared, ...STALE, harness: '#!/bin/sh\necho old\n' },
    projectFiles: PROJECT,
  });
  // 다운스트림이 공유 경로를 미리 ignore한 상태 (실제 codi-hansi/hipass 재현):
  // git rm은 untracked를 못 지우므로 실디렉토리가 남아 링크가 걸리지 않았다.
  // 다운스트림이 공유 경로를 ignore하고 인덱스에서도 빼 둔 상태를 재현한다
  // (codi-hansi/hipass 실제 상태: 파일은 디스크에 있지만 untracked).
  writeFileSync(join(repo, '.gitignore'), '.harness/vendor\n');
  execFileSync('git', ['-C', repo, 'rm', '-r', '--cached', '-q', '.harness/vendor']);
  execFileSync('git', ['-C', repo, 'add', '-A']);
  execFileSync('git', ['-C', repo, 'commit', '-q', '-m', 'ignore vendor']);
  assert.ok(existsSync(join(repo, '.harness/vendor/speckit/VENDOR-INFO.json')));

  const r = runMigrate(repo, env, upstream);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.doesNotMatch(r.stderr, /심링크가 아닌 실파일이라 보존/);
  assert.ok(
    lstatSync(join(repo, '.harness/vendor')).isSymbolicLink(),
    '.harness/vendor 는 패키지 링크여야 한다',
  );
});

test('회귀: --fresh 재실행이 심링크를 따라가 공유 캐시를 파괴하지 않는다', () => {
  const { upstream, env, repo } = setupMigrate();
  const first = runMigrate(repo, env, upstream);
  assert.equal(first.status, 0, first.stderr);
  // 전환 후 .harness/scripts 등은 캐시를 가리키는 심링크다. 여기서 --fresh가
  // 디스크 후보를 rm -f 하면 링크를 따라가 공유 캐시 원본을 파괴한다.
  const cachedScript = join(
    env.cacheDir,
    'versions/1.0.0/.harness/hooks/guardrails.mjs',
  );
  assert.ok(existsSync(cachedScript), '사전 조건: 캐시 원본 존재');
  // 링크 아래 한 단계 더 들어간 경로 — 직속 부모(.harness/scripts/pkg)는
  // 실디렉토리로 보이므로, 조상 전체를 검사하지 않으면 지워진다(실제 사고).
  const cachedNested = join(
    env.cacheDir,
    'versions/1.0.0/.harness/policies/nested/deep.md',
  );
  assert.ok(existsSync(cachedNested), '사전 조건: 중첩 캐시 원본 존재');

  // --fresh는 혼합 상태 복구를 위해 계속 진행하지만(v1.0.3), 삭제 루프가
  // 심링크 경유 경로를 건너뛰어야 캐시가 살아남는다.
  const r = runMigrate(repo, env, upstream, ['--fresh']);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.ok(
    existsSync(cachedScript),
    '공유 캐시 원본이 보존되어야 한다 (다른 레포도 같은 캐시를 쓴다)',
  );
  assert.ok(
    existsSync(cachedNested),
    '링크 아래 중첩 경로의 캐시 원본도 보존되어야 한다',
  );
});

test('회귀: ensure-gitignore는 아직 실파일인 공유 경로를 lock 항목으로 올리지 않는다', () => {
  // lock 생성 후 migrate 완료 전에 update 등이 이 스크립트를 돌리면, 공유
  // 복사본이 미리 ignore되어 git rm이 지우지 못하는 상태가 만들어졌다.
  const repo = makeLegacyDownstream({
    sharedFiles: {
      '.harness/config/required-gitignore.json': readFileSync(
        join(root, '.harness/config/required-gitignore.json'),
        'utf8',
      ),
    },
    projectFiles: { ...PROJECT, '.gitignore': 'node_modules\n' },
  });
  writeFileSync(join(repo, 'harness.lock'), '{"schema_version":1}\n');
  mkdirSync(join(repo, '.harness/vendor/speckit'), { recursive: true });
  writeFileSync(join(repo, '.harness/vendor/speckit/VENDOR-INFO.json'), '{}');

  execFileSync('node', [join(root, '.harness/scripts/setup/ensure-gitignore.mjs')], {
    env: { ...process.env, ROOT_DIR: repo },
  });

  const ignore = existsSync(join(repo, '.gitignore'))
    ? readFileSync(join(repo, '.gitignore'), 'utf8')
    : '';
  const bare = ignore.split('\n').map((l) => l.trim());
  assert.ok(
    !bare.includes('.harness/vendor'),
    '실디렉토리 상태의 공유 경로는 아직 ignore되면 안 된다',
  );
  // 아직 존재하지 않는 경로는 등재해 둔다(생성 시 심링크가 되므로).
  assert.ok(bare.includes('.harness/current'));
});

// --- CI 스크립트 KEEP_COMMITTED (2026-07-29) ---

test('CI가 호출하는 스크립트는 lock 모드에서도 커밋으로 남는다', async () => {
  // lock 모드에서 .harness/** 는 git 비추적이라 CI checkout 에는 없다.
  // 이 4개만 커밋으로 남기면 CI는 토큰·복원 스텝 없이 그대로 동작한다.
  const mod = await import('../.harness/scripts/pkg/migrate-plan.mjs');
  const ciScripts = [
    '.harness/scripts/checks/ci-node-verify.sh',
    '.harness/scripts/deploy/node-package-manager.sh',
    '.harness/scripts/audit/osv-severity-gate.js',
    '.harness/scripts/audit/dependency-impact-report.js',
  ];
  const removals = mod.computeRemovals({
    manifestFiles: ciScripts,
    trackedFiles: ciScripts,
  });
  assert.deepEqual(removals, [], 'CI 스크립트는 제거 대상이 아니어야 한다');
});

test('KEEP_COMMITTED 목록은 단일 출처를 공유한다', async () => {
  // migrate.sh 와 pkg-sync.sh 가 각자 목록을 하드코딩하면 드리프트한다.
  const mod = await import('../.harness/scripts/pkg/migrate-plan.mjs');
  assert.ok(Array.isArray(mod.KEEP_COMMITTED));
  assert.ok(mod.KEEP_COMMITTED.includes('harness'));
  assert.ok(mod.KEEP_COMMITTED.includes('.harness/scripts/checks/ci-node-verify.sh'));

  const migrateSh = readFileSync(join(root, '.harness/scripts/pkg/migrate.sh'), 'utf8');
  const pkgSync = readFileSync(join(root, '.harness/scripts/pkg/pkg-sync.sh'), 'utf8');
  const applySh = readFileSync(join(root, '.harness/scripts/pkg/apply-version.sh'), 'utf8');
  // 두 경로 모두 단일 진입점(apply-version)을 경유하고, keep-committed 는
  // 그 진입점이 materialize 와 함께 수행한다 (specs/017 M-1).
  assert.match(migrateSh, /apply-version/);
  assert.match(pkgSync, /apply-version/);
  assert.match(applySh, /keep-committed/);
});

test('KEEP_COMMITTED 파일은 심링크 아래에 갇히지 않는다', () => {
  const { upstream, env, repo } = setupMigrate();
  const r = runMigrate(repo, env, upstream);
  assert.equal(r.status, 0, r.stderr + r.stdout);

  // .harness/scripts 를 통째로 링크하면 그 아래 KEEP_COMMITTED 파일을
  // git이 "beyond a symbolic link"로 거부해 커밋 자체가 불가능하다.
  // CI 스크립트를 담는 하위 디렉터리는 실디렉터리로 남아야 한다.
  for (const sub of ['checks', 'deploy', 'audit']) {
    const p = join(repo, '.harness/scripts', sub);
    if (!existsSync(p)) continue;
    assert.ok(
      !lstatSync(p).isSymbolicLink(),
      `.harness/scripts/${sub} 는 실디렉터리여야 한다 (KEEP_COMMITTED 수용)`,
    );
  }
  // 나머지 하위는 링크로 제공돼 패키지 버전을 따른다.
  const pkgOnly = join(repo, '.harness/scripts/pkg');
  if (existsSync(pkgOnly)) {
    assert.ok(lstatSync(pkgOnly).isSymbolicLink(), '.harness/scripts/pkg 는 링크여야 한다');
  }
});

test('회귀: 구버전이 만든 scripts 통짜 심링크를 하위 링크 구조로 교체한다', () => {
  const { upstream, env, repo } = setupMigrate();
  const first = runMigrate(repo, env, upstream);
  assert.equal(first.status, 0, first.stderr);

  // v1.1.2 이하가 만든 상태를 재현: scripts 를 통째 심링크로 되돌린다.
  // 이 상태에서는 git이 하위 파일을 "beyond a symbolic link"로 거부해
  // KEEP_COMMITTED 가 무력화된다 (codi-hansi 실측).
  const scripts = join(repo, '.harness/scripts');
  execFileSync('rm', ['-rf', scripts]);
  execFileSync('ln', ['-s', join(repo, '.harness/current/.harness/scripts'), scripts]);
  assert.ok(lstatSync(scripts).isSymbolicLink(), '사전 조건: 통짜 심링크');

  // pkg-sync(materialize 재실행)가 구조를 고쳐야 한다.
  const sync = spawnSync('sh', [join(root, '.harness/scripts/pkg/pkg-sync.sh')], {
    cwd: repo,
    encoding: 'utf8',
    env: {
      ...process.env,
      CODI_HARNESS_CACHE_DIR: env.cacheDir,
      CODI_HARNESS_UPSTREAM_URL: upstream.bare,
    },
  });
  assert.equal(sync.status, 0, sync.stderr + sync.stdout);
  assert.ok(!lstatSync(scripts).isSymbolicLink(), 'scripts 는 실디렉터리로 복구돼야 한다');
  assert.ok(
    !lstatSync(join(repo, '.harness/scripts/checks')).isSymbolicLink(),
    'checks 는 KEEP_COMMITTED 수용을 위해 실디렉터리여야 한다',
  );
  assert.ok(
    existsSync(join(repo, '.harness/scripts/checks/ci-node-verify.sh')),
    'CI 스크립트가 실파일로 존재해야 한다',
  );
});

test('회귀: lock gitignore는 CI 스크립트만 열고 나머지는 무시한다', () => {
  const cfg = JSON.parse(
    readFileSync(join(root, '.harness/config/required-gitignore.json'), 'utf8'),
  );
  const entries = cfg.lockModeEntries;
  // .harness/scripts 를 통째로 무시하면 KEEP_COMMITTED 가 무력화된다.
  assert.ok(
    !entries.includes('.harness/scripts'),
    '.harness/scripts 통짜 무시는 KEEP_COMMITTED 를 막는다',
  );
  // CI 스크립트가 사는 디렉터리는 "무시 + 예외" 쌍으로 등재돼야 한다.
  for (const [dir, keep] of [
    ['checks', 'ci-node-verify.sh'],
    ['deploy', 'node-package-manager.sh'],
    ['audit', 'osv-severity-gate.js'],
  ]) {
    assert.ok(entries.includes(`.harness/scripts/${dir}/*`), `${dir}/* 무시 필요`);
    assert.ok(
      entries.includes(`!.harness/scripts/${dir}/${keep}`),
      `${dir}/${keep} 예외 필요`,
    );
  }
  // 구버전이 남긴 통짜 규칙은 managed block 이 중화한다.
  const block = (cfg.managedBlocks || []).find((b) => b.id === 'lock-scripts');
  assert.ok(block, 'lock-scripts managed block 필요');
  assert.ok(block.neutralize.includes('.harness/scripts'));
});

test('회귀: 공유 루트 문서는 lock 모드에서도 링크로 복구된다', () => {
  // manifest 공유 파일은 migrate가 git rm 으로 지운다. materialize의 링크
  // 대상에서 빠지면 영구 소실된다 — CONTRIBUTING.md 가 실제로 그랬고
  // 다운스트림 3곳에서 context-check 실패로 드러났다 (2026-07-29).
  const mat = readFileSync(join(root, '.harness/scripts/pkg/materialize.sh'), 'utf8');
  for (const f of ['ARCHITECTURE.md', 'CONTRIBUTING.md']) {
    assert.ok(mat.includes(f), `${f} 는 materialize 링크 대상이어야 한다`);
  }
  // 링크 산출물이므로 lock gitignore 에도 등재돼야 한다.
  const cfg = JSON.parse(
    readFileSync(join(root, '.harness/config/required-gitignore.json'), 'utf8'),
  );
  for (const f of ['ARCHITECTURE.md', 'CONTRIBUTING.md']) {
    assert.ok(cfg.lockModeEntries.includes(f), `${f} lock gitignore 등재 필요`);
  }
});

test('pkg-sync: 전환 후 승격된 공유 잔재를 보고하고, 회수는 소유자 명령이 한다', () => {
  // 실제 결함(2026-07-30 codi-hansi 실측): migrate 시점의 manifest 에 없던
  // 공유 파일은 git rm 대상이 아니라 커밋에 남는다. 이후 버전에서 manifest 에
  // 추가되면 materialize 가 그 자리를 심링크로 덮어 git status 가 영구히
  // "M" 상태가 된다. specs/015 부터 pkg-sync 는 팀원 표면이라 인덱스를 바꾸지
  // 않고 보고만 하며(US2·갭 6), 회수는 prune-downstream --apply 가 담당한다.
  // v1.0.0 으로 전환한다 — 이때 LATE 파일은 공유로 선언돼 있지 않다.
  const upstream = makeMigrateUpstream({ version: '1.0.0', sharedFiles: SHARED });
  const env = makeIsolatedEnv();
  const repo = makeLegacyDownstream({
    sharedFiles: { ...SHARED, ...LATE },
    projectFiles: PROJECT,
  });
  const first = runMigrate(repo, env, upstream);
  assert.equal(first.status, 0, first.stderr);

  // 사전 조건: LATE 는 manifest 밖이라 커밋에 그대로 남아 있다.
  const tracked = execFileSync('git', ['-C', repo, 'ls-files'], { encoding: 'utf8' });
  assert.ok(tracked.includes(LATE_PATH), `사전 조건: ${LATE_PATH} 가 추적 중이어야 한다`);

  // v1.0.1 에서 LATE 를 공유로 승격한다 — manifest 에도 함께 올린다.
  const promoted = { ...SHARED, ...LATE };
  addUpstreamVersion(upstream, {
    version: '1.0.1',
    files: {
      ...promoted,
      '.harness/shared-manifest.json': JSON.stringify(
        {
          schema_version: 1,
          file_count: Object.keys(promoted).length,
          files: Object.keys(promoted).sort(),
        },
        null,
        2,
      ),
    },
  });

  const sync = runPkgSync(repo, env, upstream);
  assert.equal(sync.status, 0, sync.stderr + sync.stdout);

  // 팀원 표면: 인덱스 불변 + 잔재 보고 (specs/015 US2).
  const after = execFileSync('git', ['-C', repo, 'ls-files'], { encoding: 'utf8' });
  assert.ok(
    after.split('\n').includes(LATE_PATH),
    `${LATE_PATH} 는 pkg-sync 가 회수하면 안 된다 (소유자 명령 몫)`,
  );
  assert.match(sync.stdout, /잔재/);
  assert.match(sync.stdout, /prune-downstream/);

  // 소유자 명령이 실제 회수를 수행한다.
  const prune = spawnSync(
    'node',
    [join(root, '.harness/scripts/setup/prune-downstream.mjs'), '--apply'],
    { cwd: repo, encoding: 'utf8' },
  );
  assert.equal(prune.status, 0, prune.stderr + prune.stdout);
  const reclaimed = execFileSync('git', ['-C', repo, 'ls-files'], { encoding: 'utf8' });
  assert.ok(
    !reclaimed.split('\n').includes(LATE_PATH),
    `${LATE_PATH} 가 prune-downstream --apply 로 회수돼야 한다`,
  );
});

test('pkg-sync: 회수할 잔재가 없으면 인덱스를 건드리지 않는다', () => {
  // 오탐이 있으면 매 pkg-sync 마다 워킹트리가 더러워져 dirty 검사와 충돌한다.
  const { upstream, env, repo } = setupMigrate();
  const first = runMigrate(repo, env, upstream);
  assert.equal(first.status, 0, first.stderr);
  // migrate 가 스테이징한 삭제만 커밋한다 (add -A 로 심링크를 담지 않는다 —
  // 실제 흐름에서는 ensure-gitignore 가 그 경로들을 무시 처리한다).
  execFileSync('git', ['-C', repo, 'commit', '-q', '-m', 'lock 전환']);

  const before = execFileSync('git', ['-C', repo, 'ls-files'], { encoding: 'utf8' });
  const sync = runPkgSync(repo, env, upstream);
  assert.equal(sync.status, 0, sync.stderr + sync.stdout);
  const after = execFileSync('git', ['-C', repo, 'ls-files'], { encoding: 'utf8' });

  assert.equal(after, before, '잔재가 없는데 인덱스가 바뀌면 오탐이다');
  assert.doesNotMatch(sync.stdout, /회수했습니다/);
});

test('lock gitignore: 공유 config 파일은 빠짐없이 등재된다', () => {
  // 정책이 일부만 열거하면 회수한 파일이 "??" 로 남아 워킹트리가 계속
  // 더럽다 (2026-07-30 codi-hansi: 14개 중 5개만 등재돼 9개가 표류).
  // shared-manifest 를 단일 출처로 삼아 누락을 잡는다.
  const manifest = JSON.parse(
    readFileSync(join(root, '.harness/shared-manifest.json'), 'utf8'),
  );
  const cfg = JSON.parse(
    readFileSync(join(root, '.harness/config/required-gitignore.json'), 'utf8'),
  );
  const entries = new Set(cfg.lockModeEntries);
  const projectOwned = new Set([
    '.harness/config/project-profile.yaml',
    '.harness/config/skill-triggers.local.json',
  ]);
  const missing = (manifest.files ?? [])
    .filter((f) => f.startsWith('.harness/config/'))
    .filter((f) => !projectOwned.has(f) && !entries.has(f));
  assert.deepEqual(missing, [], `lock gitignore 미등재 공유 config: ${missing.join(', ')}`);
});
