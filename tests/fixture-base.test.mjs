// fixture-base 회귀 (specs/016 감사 H-6·M-17).
// 계약: (1) tmp() 로 만든 디렉터리는 프로세스 종료 시 정리된다(KEEP_TMP=1 우회),
// (2) git 실행기는 전역/시스템 git 설정(서명·훅 경로)에서 격리된다.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync, chmodSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { gitRaw, initGitRepo, tmp, write } from './helpers/fixture-base.mjs';

const HELPER = new URL('./helpers/fixture-base.mjs', import.meta.url).href;

function spawnTmpChild(env = {}) {
  // 자식 프로세스에서 tmp() 만 호출하고 경로를 출력한 뒤 종료한다.
  const script = `import(${JSON.stringify(HELPER)}).then((m) => {
    process.stdout.write(m.tmp('codi-fbase-child-'));
  });`;
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  assert.equal(child.status, 0, child.stderr);
  const dir = child.stdout.trim();
  assert.ok(dir.includes('codi-fbase-child-'), `자식 출력이 경로가 아니다: ${dir}`);
  return dir;
}

test('tmp(): 프로세스 종료 시 만든 디렉터리를 정리한다 (H-6)', () => {
  const dir = spawnTmpChild();
  assert.ok(!existsSync(dir), `${dir} 이 종료 후에도 남았다`);
});

test('tmp(): KEEP_TMP=1 이면 정리를 건너뛴다 (디버깅 경로)', () => {
  const dir = spawnTmpChild({ KEEP_TMP: '1' });
  assert.ok(existsSync(dir), 'KEEP_TMP=1 인데 정리됐다');
  rmSync(dir, { recursive: true, force: true }); // 검증 후 직접 정리
});

test('git 실행기: 전역 서명·훅 설정을 상속하지 않는다 (M-17)', () => {
  // 항상 실패하는 pre-commit 훅 + 서명 강제라는 적대적 전역 설정을 흉내낸다.
  const fakeHome = tmp('codi-fbase-home-');
  const hooks = join(fakeHome, 'hooks');
  write(fakeHome, 'hooks/pre-commit', '#!/bin/sh\nexit 1\n');
  chmodSync(join(hooks, 'pre-commit'), 0o755);
  write(
    fakeHome,
    'gitconfig',
    `[commit]\n\tgpgsign = true\n[user]\n\tsigningkey = 0xDEAD\n[core]\n\thooksPath = ${hooks}\n`,
  );
  const prevGlobal = process.env.GIT_CONFIG_GLOBAL;
  process.env.GIT_CONFIG_GLOBAL = join(fakeHome, 'gitconfig');
  try {
    const repo = tmp('codi-fbase-repo-');
    initGitRepo(repo);
    write(repo, 'a.txt', 'x\n');
    gitRaw(repo, 'add', '-A');
    // 격리가 없으면 gpg 부재/훅 실패로 여기서 죽는다.
    gitRaw(repo, 'commit', '-q', '-m', 'isolated commit');
    assert.match(gitRaw(repo, 'log', '--oneline'), /isolated commit/);
  } finally {
    if (prevGlobal === undefined) delete process.env.GIT_CONFIG_GLOBAL;
    else process.env.GIT_CONFIG_GLOBAL = prevGlobal;
  }
});
