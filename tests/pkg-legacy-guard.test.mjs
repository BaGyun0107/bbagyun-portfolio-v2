// 구 동기화 흐름의 lock 모드 가드 (specs/006-harness-migrate US3, R4).
// lock 모드 레포에서는 변경 0건 + pkg 흐름 안내, lock 없으면 기존 동작.
// 예외: prune-downstream 은 2026-07-30 에 가드를 걷어냈다 — 아래 "US3 개정"
// 참조. pkg 흐름이 그 잔재를 정리한다는 전제가 실측으로 반증됐다.
import { tmp } from './helpers/fixture-base.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function makeRepo({ withLock }) {
  const repo = tmp('codi-legacy-guard-');
  mkdirSync(join(repo, '.harness/scripts/setup'), { recursive: true });
  if (withLock) {
    writeFileSync(
      join(repo, 'harness.lock'),
      '{"schema_version":1,"channel":"latest-minor","repo":"https://example.com/h.git"}\n',
    );
  }
  return repo;
}

test('US3: lock 모드에서 update.sh 적용은 안내 후 무변경 종료', () => {
  const repo = makeRepo({ withLock: true });
  cpSync(
    join(root, '.harness/scripts/setup/update.sh'),
    join(repo, '.harness/scripts/setup/update.sh'),
  );
  cpSync(
    join(root, '.harness/scripts/setup/project-owned-fallback.sh'),
    join(repo, '.harness/scripts/setup/project-owned-fallback.sh'),
  );
  const r = spawnSync('sh', [join(repo, '.harness/scripts/setup/update.sh')], {
    encoding: 'utf8',
    env: { ...process.env, HARNESS_SOURCE_REPO: '/nonexistent/upstream.git' },
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout + r.stderr, /pkg-sync|lock 모드/);
});

test('US3 개정: lock 모드에서도 prune-downstream 은 잔재를 정리한다', () => {
  // 원 계약(specs/006 US3)은 "lock 모드에서는 pkg 흐름이 정리를 담당한다"는
  // 전제로 조기 종료를 요구했다. 그 전제가 거짓임이 확인됐다: migrate 는 이미
  // 전환된 레포를 거부하고, pkg-sync 는 공유 파일만 다뤄 upstream clone
  // 잔재(tests/ROADMAP.md 등)를 손대지 않는다. 결과로 lock 레포에는 정리
  // 경로가 아예 없었다 (2026-07-30 codi-crawling: 하네스 테스트 90개 잔존).
  const repo = makeRepo({ withLock: true });
  // ROADMAP 은 바이트 판정 대상이라(감사 M-5) 무조건 삭제 검증에는 부적합 —
  // 이름 판정 경로인 docs/index.html 로 잔재를 재현한다.
  mkdirSync(join(repo, 'docs'), { recursive: true });
  writeFileSync(join(repo, 'docs/index.html'), '<html>upstream state</html>');
  spawnSync('git', ['init', '-q'], { cwd: repo });
  const r = spawnSync(
    process.execPath,
    [join(root, '.harness/scripts/setup/prune-downstream.mjs'), '--apply'],
    {
      encoding: 'utf8',
      env: { ...process.env, HARNESS_ROOT: repo },
    },
  );
  assert.equal(r.status, 0, r.stderr);
  assert.equal(existsSync(join(repo, 'docs/index.html')), false);
  assert.doesNotMatch(r.stdout + r.stderr, /migrate 흐름이 담당/);
});

// --- 014 US2: copy 은퇴 예고 (FR-006/007) ---

function git(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
}

// copy 모드 갱신이 실제로 끝까지 도는 경로여야 종료 코드 불변을 주장할 수
// 있으므로, 최소 upstream/project 쌍을 만들어 실제로 적용시킨다.
test('US2: copy 모드 갱신은 은퇴 예고와 migrate 안내를 stdout 에 낸다', () => {
  const source = tmp('codi-retire-source-');
  const project = tmp('codi-retire-project-');
  for (const dir of [source, project]) {
    git(dir, ['init', '-q']);
    git(dir, ['config', 'user.email', 'test@example.com']);
    git(dir, ['config', 'user.name', 'Harness Test']);
    mkdirSync(join(dir, '.harness/scripts/setup'), { recursive: true });
  }
  mkdirSync(join(source, '.harness/policies'), { recursive: true });
  writeFileSync(join(source, '.harness/policies/base.md'), 'upstream policy\n');
  git(source, ['add', '-A']);
  git(source, ['commit', '-qm', 'source']);
  git(source, ['branch', 'v2']);

  cpSync(
    join(root, '.harness/scripts/setup/update.sh'),
    join(project, '.harness/scripts/setup/update.sh'),
  );
  cpSync(
    join(root, '.harness/scripts/setup/project-owned-fallback.sh'),
    join(project, '.harness/scripts/setup/project-owned-fallback.sh'),
  );
  git(project, ['add', '-A']);
  git(project, ['commit', '-qm', 'project']);

  const r = spawnSync(
    'sh',
    [
      join(project, '.harness/scripts/setup/update.sh'),
      '--apply-harness',
      '--source-repo',
      source,
      '--source-ref',
      'v2',
    ],
    { cwd: project, encoding: 'utf8' },
  );
  // 예고는 안내이지 실패가 아니므로 stdout 이어야 한다.
  assert.match(r.stdout, /copy 방식 하네스는 단계적으로 은퇴/);
  assert.match(r.stdout, /\.\/harness migrate/);
  assert.doesNotMatch(r.stderr, /copy 방식 하네스는 단계적으로 은퇴/);
  // 예고 후에도 갱신은 정상 완료된다 — 종료 코드 불변.
  assert.equal(r.status, 0, r.stderr);
  assert.ok(
    readdirSync(join(project, '.harness/policies')).includes('base.md'),
    '갱신이 실제로 적용되어야 한다',
  );
});

test('US2: lock 모드에서는 은퇴 예고가 나오지 않는다', () => {
  const repo = makeRepo({ withLock: true });
  cpSync(
    join(root, '.harness/scripts/setup/update.sh'),
    join(repo, '.harness/scripts/setup/update.sh'),
  );
  cpSync(
    join(root, '.harness/scripts/setup/project-owned-fallback.sh'),
    join(repo, '.harness/scripts/setup/project-owned-fallback.sh'),
  );
  const r = spawnSync(
    'sh',
    [join(repo, '.harness/scripts/setup/update.sh'), '--apply-harness'],
    {
      encoding: 'utf8',
      env: { ...process.env, HARNESS_SOURCE_REPO: '/nonexistent/upstream.git' },
    },
  );
  assert.equal(r.status, 0, r.stderr);
  assert.doesNotMatch(r.stdout + r.stderr, /단계적으로 은퇴/);
});

test('US3: lock 모드에서 restore-missing-shared는 목록을 내지 않는다', () => {
  const repo = makeRepo({ withLock: true });
  const manifest = join(repo, 'manifest.json');
  writeFileSync(
    manifest,
    '{"schema_version":1,"files":[".harness/policies/missing.md"]}\n',
  );
  const r = spawnSync(
    process.execPath,
    [join(root, '.harness/scripts/setup/restore-missing-shared.mjs')],
    {
      encoding: 'utf8',
      env: { ...process.env, ROOT_DIR: repo, MANIFEST_FILE: manifest },
    },
  );
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), '');
});

test('US3: lock이 없으면 restore-missing-shared는 기존대로 목록을 낸다', () => {
  const repo = makeRepo({ withLock: false });
  const manifest = join(repo, 'manifest.json');
  writeFileSync(
    manifest,
    '{"schema_version":1,"files":[".harness/policies/missing.md"]}\n',
  );
  const r = spawnSync(
    process.execPath,
    [join(root, '.harness/scripts/setup/restore-missing-shared.mjs')],
    {
      encoding: 'utf8',
      env: { ...process.env, ROOT_DIR: repo, MANIFEST_FILE: manifest },
    },
  );
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /\.harness\/policies\/missing\.md/);
});
