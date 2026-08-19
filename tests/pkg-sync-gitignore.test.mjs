// pkg-sync gitignore 자동 최신화 회귀 (specs/015 T016, US3·갭 1).
// 실측 근거: update.sh 는 lock 모드에서 조기 종료(update.sh:20)하고 pkg-sync 에
// ensure-gitignore 호출이 없어, lock 레포의 gitignore 는 전환 시점 스냅샷으로
// 영구 고정됐다 — 스키마 링크 9개가 6/6 레포에 커밋된 근본 원인 (2026-07-30).
import { tmp } from './helpers/fixture-base.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import * as fsSync from 'node:fs';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  makeLegacyDownstream,
  makeMigrateUpstream,
  makeIsolatedEnv,
} from './helpers/pkg-fixture.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const SHARED = {
  '.harness/hooks/guardrails.mjs': '// hook',
  '.harness/policies/guardrails.md': 'policy',
  harness: '#!/bin/sh\necho launcher\n',
  // 패키지가 싣는 gitignore 정책 — materialize 가 레포 config 로 링크한다.
  // real:true 항목을 포함해 통합 경로가 실디렉터리 분기(v1.3.1)를 지나가게
  // 한다 (2026-07-31 감사 M-11: 단위 테스트만 있고 통합 픽스처는 문자열뿐이었다).
  '.harness/config/required-gitignore.json': JSON.stringify(
    {
      entries: ['.claude/skills', '.agents/skills'],
      lockModeEntries: [
        '.harness/current',
        '.harness/hooks',
        '.harness/policies',
        { pattern: '.specify/templates', real: true },
      ],
    },
    null,
    2,
  ),
};

function setup() {
  const upstream = makeMigrateUpstream({ version: '1.0.0', sharedFiles: SHARED });
  const env = makeIsolatedEnv();
  const repo = makeLegacyDownstream({
    sharedFiles: SHARED,
    projectFiles: { 'specs/001-own/spec.md': 'my spec' },
  });
  const migrate = spawnSync('sh', [join(root, '.harness/scripts/pkg/migrate.sh')], {
    cwd: repo,
    encoding: 'utf8',
    env: {
      ...process.env,
      CODI_HARNESS_CACHE_DIR: env.cacheDir,
      CODI_HARNESS_UPSTREAM_URL: upstream.bare,
    },
  });
  assert.equal(migrate.status, 0, migrate.stderr);
  return { upstream, env, repo };
}

function runSync(repo, env, upstream) {
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

test('US3: pkg-sync 가 필수 gitignore 항목을 반영하고 프로젝트 항목은 보존한다', () => {
  const { upstream, env, repo } = setup();
  // gitignore 를 구버전 스냅샷(누락 상태)으로 만들고 프로젝트 항목을 심는다.
  const gitignorePath = join(repo, '.gitignore');
  writeFileSync(gitignorePath, 'node_modules/\nmy-project-secret.txt\n');
  // real:true 경로는 install 이 만드는 실디렉터리 — 통합 경로 검증용 (M-11).
  fsSync.mkdirSync(join(repo, '.specify/templates'), { recursive: true });

  const sync = runSync(repo, env, upstream);
  assert.equal(sync.status, 0, sync.stderr + sync.stdout);

  const gitignore = readFileSync(gitignorePath, 'utf8');
  // lockModeEntries 중 materialize 가 링크로 만든 경로가 등재된다.
  for (const entry of ['.harness/hooks', '.harness/policies', '.harness/current']) {
    assert.ok(gitignore.includes(entry), `${entry} 가 gitignore 에 없다`);
  }
  // real:true 실디렉터리도 통합 경로에서 등재된다 (M-11).
  assert.ok(gitignore.includes('.specify/templates'), 'real:true 항목이 통합 경로에서 누락');
  // 모드 무관 필수 entries (specs/015 T018).
  for (const entry of ['.claude/skills', '.agents/skills']) {
    assert.ok(gitignore.includes(entry), `${entry} 가 gitignore 에 없다`);
  }
  // 프로젝트 소유 항목은 그대로.
  assert.ok(gitignore.includes('my-project-secret.txt'));
  assert.ok(gitignore.includes('node_modules/'));
  // 요약 파일에 gitignore 라인 기록.
  const summary = readFileSync(join(repo, '.harness/state/bootstrap-summary'), 'utf8');
  assert.match(summary, /^gitignore [0-9]+$/m);
});

test('US3: 재실행은 멱등 — 두 번째 sync 가 gitignore 를 바꾸지 않는다', () => {
  const { upstream, env, repo } = setup();
  const first = runSync(repo, env, upstream);
  assert.equal(first.status, 0, first.stderr + first.stdout);
  const after = readFileSync(join(repo, '.gitignore'), 'utf8');

  const second = runSync(repo, env, upstream);
  assert.equal(second.status, 0, second.stderr + second.stdout);
  assert.equal(readFileSync(join(repo, '.gitignore'), 'utf8'), after);
});

test('lockModeEntries real 플래그: 실디렉터리도 등재한다 (v1.3.1 후속 3)', () => {
  // .specify 벤더 경로는 install 이 만드는 실디렉터리라 영원히 심링크가 되지
  // 않는다 — 기본 "심링크가 된 뒤 등재" 가드를 real:true 로 명시적으로 푼다.
  const { mkdirSync, writeFileSync, readFileSync } = fsSync;
  const repo = tmp('codi-gitignore-real-');
  writeFileSync(join(repo, 'harness.lock'), '{"schema_version":1}\n');
  mkdirSync(join(repo, '.specify/templates'), { recursive: true });
  mkdirSync(join(repo, '.harness/hooks'), { recursive: true });
  mkdirSync(join(repo, '.harness/config'), { recursive: true });
  writeFileSync(
    join(repo, '.harness/config/required-gitignore.json'),
    JSON.stringify({
      entries: [],
      lockModeEntries: [
        { pattern: '.specify/templates', real: true },
        '.harness/hooks',
      ],
    }),
  );
  const result = spawnSync(
    'node',
    [join(root, '.harness/scripts/setup/ensure-gitignore.mjs')],
    { encoding: 'utf8', env: { ...process.env, ROOT_DIR: repo } },
  );
  assert.equal(result.status, 0, result.stderr);
  const gitignore = readFileSync(join(repo, '.gitignore'), 'utf8');
  assert.ok(gitignore.includes('.specify/templates'), 'real:true 실디렉터리 미등재');
  assert.ok(!gitignore.includes('.harness/hooks'), '실디렉터리 문자열 항목은 유예돼야 한다');
});

test('required-gitignore: .specify 벤더 3경로가 real 항목으로 등재된다 (v1.3.1 후속 3)', () => {
  const cfg = JSON.parse(
    readFileSync(join(root, '.harness/config/required-gitignore.json'), 'utf8'),
  );
  for (const p of ['.specify/templates', '.specify/scripts', '.specify/workflows']) {
    const entry = cfg.lockModeEntries.find(
      (e) => typeof e === 'object' && e?.pattern === p,
    );
    assert.ok(entry?.real === true, `${p} 가 {pattern, real:true} 로 등재돼야 한다`);
  }
  // 프로젝트 상태는 등재 금지 — 커밋 가능해야 한다.
  const flat = JSON.stringify(cfg.lockModeEntries) + JSON.stringify(cfg.entries);
  assert.ok(!flat.includes('.specify/memory'), 'constitution 은 커밋 가능해야 한다');
  assert.ok(!flat.includes('feature.json'), 'feature.json 은 커밋 가능해야 한다');
});

test('버전 스큐: real 미지원 구버전 ensure-gitignore 는 객체 항목을 조용히 건너뛴다 (M-11 특성 고정)', () => {
  // pkg-sync 는 캐시된 패키지 버전의 ensure-gitignore 를 우선 실행한다.
  // 구버전에 핀 고정된 다운스트림에서는 {pattern, real} 객체를 해석하지 못해
  // 해당 항목만 누락된다 — 침묵 누락이 현재 계약임을 특성 테스트로 고정한다
  // (동작을 바꾸려면 이 테스트를 의도적으로 갱신하라). 최신 채널은 영향 없음.
  const oldEnsure = [
    '// 구버전 흉내: 문자열 항목만 처리, 객체 항목 무시',
    "import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';",
    "import { join } from 'node:path';",
    "const root = process.env.ROOT_DIR || process.cwd();",
    "const cfg = JSON.parse(readFileSync(join(root, '.harness/config/required-gitignore.json'), 'utf8'));",
    "const gi = join(root, '.gitignore');",
    "if (!existsSync(gi)) writeFileSync(gi, '');",
    "const cur = readFileSync(gi, 'utf8');",
    "for (const e of cfg.lockModeEntries || []) {",
    "  if (typeof e !== 'string') continue;",
    "  if (!cur.includes(e)) { appendFileSync(gi, e + '\\n'); console.log(e); }",
    '}',
    '',
  ].join('\n');
  const upstream = makeMigrateUpstream({
    version: '1.0.0',
    sharedFiles: {
      ...SHARED,
      '.harness/scripts/setup/ensure-gitignore.mjs': oldEnsure,
    },
  });
  const env = makeIsolatedEnv();
  const repo = makeLegacyDownstream({
    sharedFiles: {
      ...SHARED,
      '.harness/scripts/setup/ensure-gitignore.mjs': oldEnsure,
    },
    projectFiles: { 'specs/001-own/spec.md': 'my spec' },
  });
  const migrate = spawnSync('sh', [join(root, '.harness/scripts/pkg/migrate.sh')], {
    cwd: repo,
    encoding: 'utf8',
    env: {
      ...process.env,
      CODI_HARNESS_CACHE_DIR: env.cacheDir,
      CODI_HARNESS_UPSTREAM_URL: upstream.bare,
    },
  });
  assert.equal(migrate.status, 0, migrate.stderr);
  fsSync.mkdirSync(join(repo, '.specify/templates'), { recursive: true });
  const sync = runSync(repo, env, upstream);
  assert.equal(sync.status, 0, sync.stderr + sync.stdout);
  const gitignore = readFileSync(join(repo, '.gitignore'), 'utf8');
  assert.ok(gitignore.includes('.harness/hooks'), '문자열 항목은 구버전에서도 반영돼야 한다');
  assert.ok(
    !gitignore.includes('.specify/templates'),
    '구버전은 객체 항목을 건너뛴다 — 동작이 바뀌었으면 이 특성 테스트를 의도적으로 갱신하라',
  );
});

test('US3: copy 모드(lock 없음)에서는 아무것도 바꾸지 않는다', () => {
  const upstream = makeMigrateUpstream({ version: '1.0.0', sharedFiles: SHARED });
  const env = makeIsolatedEnv();
  const repo = makeLegacyDownstream({
    sharedFiles: SHARED,
    projectFiles: { '.gitignore': 'node_modules/\n' },
  });
  const before = readFileSync(join(repo, '.gitignore'), 'utf8');
  const sync = runSync(repo, env, upstream);
  assert.equal(sync.status, 0, sync.stderr + sync.stdout);
  assert.equal(readFileSync(join(repo, '.gitignore'), 'utf8'), before);
  assert.match(sync.stdout, /lock 모드 아님|건너뜁니다/);
});
