// lock 모드 심링크 경유 실행에서 CLI 진입점이 조용히 no-op 하지 않아야 한다.
//
// 회귀 배경: `import.meta.url === `file://${process.argv[1]}`` 가드는 lock 모드
// (`.harness/scripts`가 버전 캐시를 가리키는 심링크)에서 항상 false가 되어
// docs:build / planning:check가 출력도 종료코드 오류도 없이 no-op 했다.
import { tmp } from './helpers/fixture-base.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdirSync, symlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// 실제 lock 모드와 같은 모양: 레포의 .harness/scripts가 다른 트리를 가리키는 심링크.
function makeSymlinkedRepo() {
  const repo = tmp('codi-lockcli-');
  mkdirSync(join(repo, '.harness'), { recursive: true });
  symlinkSync(join(root, '.harness/scripts'), join(repo, '.harness/scripts'));
  symlinkSync(join(root, '.harness/hooks'), join(repo, '.harness/hooks'));
  return repo;
}

const ENTRYPOINTS = [
  '.harness/scripts/docs/build-hub.mjs',
  '.harness/scripts/docs/planning-check.mjs',
];

for (const entry of ENTRYPOINTS) {
  test(`lock 모드 심링크 경유 실행에서 ${entry} 가 실제로 동작한다`, () => {
    const repo = makeSymlinkedRepo();
    const r = spawnSync('node', [entry], {
      cwd: repo,
      encoding: 'utf8',
    });
    // 심링크 가드 오탐이면 stdout/stderr 모두 비고 exit 0인 조용한 no-op이 된다.
    assert.notEqual(
      (r.stdout + r.stderr).trim(),
      '',
      '심링크 경유 실행이 아무 출력 없이 끝났다 — 직접 실행 가드 오탐(no-op) 회귀',
    );
  });
}

test('직접 실행 가드는 심링크에 안전한 형태만 쓴다', () => {
  const r = spawnSync(
    'grep',
    ['-rn', 'import.meta.url === `file://', '.harness/'],
    { cwd: root, encoding: 'utf8' },
  );
  assert.equal(
    r.stdout.trim(),
    '',
    `심링크에서 깨지는 가드가 남아 있다 (lib/is-main.mjs의 isMain 사용):\n${r.stdout}`,
  );
});
