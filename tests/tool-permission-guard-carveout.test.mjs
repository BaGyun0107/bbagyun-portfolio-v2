// 패키지 매니저 정책 carve-out 회귀 (specs/004-onboarding-bootstrap T002/T003).
// 정책 의도: 앱 의존성을 banned 매니저(yarn/bun)로 "실행"하는 것만 차단한다.
// 검색 인자, mise 도구 관리, 파일 내용 언급은 차단 대상이 아니다.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function runGuard(command) {
  return spawnSync(
    process.execPath,
    [join(root, '.harness/hooks/tool-permission-guard.mjs')],
    {
      cwd: root,
      input: JSON.stringify({
        tool_name: 'Bash',
        tool_input: { command, cwd: root },
      }),
      encoding: 'utf8',
    },
  );
}

const BLOCK_PATTERN = /Package manager policy blocked/;

const blockedCommands = [
  // banned 매니저를 커맨드로 실행 — 계속 차단되어야 한다
  'bun install',
  'yarn add react',
  'mise exec -- bun run build',
  'corepack yarn install',
  'cd apps/front && bun install',
  'echo start | bun run script.ts',
  // 컴파운드 뒤쪽 세그먼트의 banned 실행 — 기존 substring 방식도 이건
  // 앞의 npm에 먼저 매치해 놓쳤다. carve-out은 세그먼트별로 본다.
  'npm install && yarn install',
  // 선행 env 할당이 있어도 실행이면 차단
  'CI=1 bun test',
];
const allowedCommands = [
  // mise 도구 관리 — bun을 "설치 대상"으로만 언급, 실행 아님
  'mise use bun@1',
  'mise install',
  'mise ls --current',
  // 검색/읽기 인자 속 언급 — 실행 아님
  'rg "bun" .harness/scripts/setup/install.sh',
  'grep -n "yarn add" docs/notes.md',
  'git log --grep yarn --oneline',
  // 허용 매니저는 그대로 통과
  'npm install',
  'mise exec -- npm test',
];

for (const command of blockedCommands) {
  test(`blocks: ${command}`, () => {
    const result = runGuard(command);
    assert.equal(result.status, 0);
    assert.match(result.stdout, BLOCK_PATTERN);
  });
}

for (const command of allowedCommands) {
  test(`allows: ${command}`, () => {
    const result = runGuard(command);
    assert.equal(result.status, 0);
    assert.doesNotMatch(result.stdout ?? '', BLOCK_PATTERN);
  });
}
