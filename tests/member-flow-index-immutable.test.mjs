// 팀원 플로우 인덱스 불변 회귀 (specs/015 T012, US2·갭 6).
// 계약: specs/015-downstream-residue-cleanup/contracts/cli.md — pkg-sync 는
// 보고만 한다. 인덱스 변경(git rm --cached)은 소유자 명령
// (prune-downstream --apply) 전용이다. 팀원 머신에서 인덱스가 바뀌면
// bootstrap 후 워킹트리가 dirty 가 되어 "bootstrap 하나로 완결"이 깨진다.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  makeLegacyDownstream,
  makeMigrateUpstream,
  makeIsolatedEnv,
  addUpstreamVersion,
} from './helpers/pkg-fixture.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const SHARED = {
  '.harness/hooks/guardrails.mjs': '// hook',
  '.harness/policies/guardrails.md': 'policy',
  harness: '#!/bin/sh\necho launcher\n',
};
const LATE_PATH = '.harness/config/late-schema.json';
const LATE = { [LATE_PATH]: '{"late":true}' };

function runSh(script, repo, env, upstream, args = []) {
  return spawnSync('sh', [join(root, script), ...args], {
    cwd: repo,
    encoding: 'utf8',
    env: {
      ...process.env,
      CODI_HARNESS_CACHE_DIR: env.cacheDir,
      CODI_HARNESS_UPSTREAM_URL: upstream.bare,
    },
  });
}

function lsFiles(repo) {
  return execFileSync('git', ['-C', repo, 'ls-files'], { encoding: 'utf8' });
}

// 잔재가 남은 레포(전환 후 LATE 가 공유로 뒤늦게 승격된 상황)를 만든다.
function setupResidueRepo() {
  const upstream = makeMigrateUpstream({ version: '1.0.0', sharedFiles: SHARED });
  const env = makeIsolatedEnv();
  const repo = makeLegacyDownstream({
    sharedFiles: { ...SHARED, ...LATE },
    projectFiles: { 'specs/001-own/spec.md': 'my spec' },
  });
  const migrate = runSh('.harness/scripts/pkg/migrate.sh', repo, env, upstream);
  assert.equal(migrate.status, 0, migrate.stderr);
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
  return { upstream, env, repo };
}

test('US2: 잔재가 있어도 pkg-sync 는 인덱스를 바꾸지 않고 보고만 한다', () => {
  const { upstream, env, repo } = setupResidueRepo();
  const before = lsFiles(repo);
  assert.ok(before.split('\n').includes(LATE_PATH), '사전 조건: 잔재가 추적 중');

  const sync = runSh('.harness/scripts/pkg/pkg-sync.sh', repo, env, upstream);
  assert.equal(sync.status, 0, sync.stderr + sync.stdout);

  // 인덱스 불변 — 회수는 소유자 명령의 몫
  assert.equal(lsFiles(repo), before, '팀원 표면이 인덱스를 바꿨다');
  // 잔재 보고 + 소유자 절차 안내
  assert.match(sync.stdout, /잔재/);
  assert.match(sync.stdout, /prune-downstream/);
  // bootstrap 요약 파일에 residue 라인 기록
  const summaryPath = join(repo, '.harness/state/bootstrap-summary');
  assert.ok(existsSync(summaryPath), 'bootstrap-summary 가 없다');
  assert.match(readFileSync(summaryPath, 'utf8'), /^residue [0-9]+$/m);
});

test('US2: 소유자 정리·커밋 후에는 residue 라인을 남기지 않는다', () => {
  const { upstream, env, repo } = setupResidueRepo();
  // 실제 순서(R9): 신규 버전 수신 → 소유자 정리 → 커밋 → 이후 동기화는 조용.
  const first = runSh('.harness/scripts/pkg/pkg-sync.sh', repo, env, upstream);
  assert.equal(first.status, 0, first.stderr + first.stdout);

  const prune = spawnSync(
    'node',
    [join(root, '.harness/scripts/setup/prune-downstream.mjs'), '--apply'],
    { cwd: repo, encoding: 'utf8' },
  );
  assert.equal(prune.status, 0, prune.stderr + prune.stdout);
  // add -u: 추적 파일의 삭제·수정만 스테이징 — 비추적 materialize 링크를
  // 도로 담지 않는다 (prune-downstream 안내 문구와 동일한 절차).
  execFileSync('git', ['-C', repo, 'add', '-u'], { cwd: repo });
  execFileSync('git', ['-C', repo, 'commit', '-q', '-m', 'cleanup'], { cwd: repo });

  // bootstrap 이 매 회차 요약을 비우는 것을 재현한다.
  rmSync(join(repo, '.harness/state/bootstrap-summary'), { force: true });
  const sync = runSh('.harness/scripts/pkg/pkg-sync.sh', repo, env, upstream);
  assert.equal(sync.status, 0, sync.stderr + sync.stdout);
  const summaryPath = join(repo, '.harness/state/bootstrap-summary');
  const summary = existsSync(summaryPath) ? readFileSync(summaryPath, 'utf8') : '';
  assert.doesNotMatch(summary, /residue/);
});
