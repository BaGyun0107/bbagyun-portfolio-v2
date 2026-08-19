// CLI 계열 테스트 공용 실행기 (specs/017 M-15 분할 지원).
// 전역/시스템 git 설정 격리(GIT_ISOLATED_ENV)를 기본 적용한다 — 픽스처와
// 하위 스크립트가 실행하는 git 이 개발자 전역 설정에 좌우되지 않게 한다.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GIT_ISOLATED_ENV } from './fixture-base.mjs';

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function runNode(relativeScript, args = [], options = {}) {
  return spawnSync(process.execPath, [join(repoRoot, relativeScript), ...args], {
    cwd: options.cwd ?? repoRoot,
    input: options.input,
    encoding: 'utf8',
    env: { ...process.env, ...GIT_ISOLATED_ENV, ...(options.env ?? {}) },
  });
}

export function runCommand(command, args = [], options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    input: options.input,
    encoding: 'utf8',
    env: { ...process.env, ...GIT_ISOLATED_ENV, ...(options.env ?? {}) },
  });
}
