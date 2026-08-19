// 테스트 픽스처 공통 기반 (specs/016 감사 H-6·M-17·L-9).
// 두 픽스처 헬퍼(pkg-fixture / downstream-fixture)가 갈라져 있던 결과로
// 임시 디렉터리 미정리(실측 5.3GB 누적)와 전역 git 설정 미격리가 한쪽에만
// 생겼다 — 공통 기반을 여기로 모은다.
import { execFileSync } from 'node:child_process';
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

// 이 프로세스가 만든 임시 디렉터리 레지스트리. node --test 는 테스트 파일마다
// 프로세스를 띄우므로 exit 훅이 파일 단위로 자기 몫만 정리한다. 실패한
// 실행에서도 동작하며, 디버깅이 필요하면 KEEP_TMP=1 로 정리를 끈다.
const tmpRegistry = [];
process.on('exit', () => {
  if (process.env.KEEP_TMP === '1') return;
  for (const dir of tmpRegistry) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // 종료 중 정리 실패는 다음 실행을 막지 않는다.
    }
  }
});

export function tmp(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tmpRegistry.push(dir);
  return dir;
}

// 헬퍼 밖에서 생긴 경로(예: rename 오프라인 시뮬레이션의 `.gone` 사본)도
// 종료 정리에 등록한다. 경로를 그대로 돌려줘 호출부에 끼워 넣기 쉽게 한다.
export function track(path) {
  tmpRegistry.push(path);
  return path;
}

// 개발자의 전역/시스템 git 설정(commit.gpgsign, core.hooksPath,
// init.templateDir 등)이 픽스처 레포에 상속되지 않도록 격리한다.
// 전역 서명을 켠 머신에서 픽스처 커밋이 GPG 프롬프트로 멈추는 잠복 파손 방지.
export const GIT_ISOLATED_ENV = {
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_SYSTEM: '/dev/null',
};

// 격리 환경으로 git 을 실행한다. 반환값은 원문(트림 없음).
export function gitRaw(cwd, ...args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...GIT_ISOLATED_ENV },
  });
}

// 픽스처 레포 초기화 — 커밋에 필요한 로컬 설정까지 한 번에.
export function initGitRepo(dir, { branch } = {}) {
  gitRaw(dir, 'init', '-q', ...(branch ? [`--initial-branch=${branch}`] : []));
  gitRaw(dir, 'config', 'user.email', 'test@example.com');
  gitRaw(dir, 'config', 'user.name', 'Test');
  gitRaw(dir, 'config', 'commit.gpgsign', 'false');
}

export function write(base, relPath, content = '') {
  const abs = join(base, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
  return abs;
}

// 심링크 자체의 존재 확인 — existsSync 는 링크를 따라가 broken link 에
// false 를 주므로 링크 검증에는 lstat 을 쓴다.
export function lexists(path) {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}
