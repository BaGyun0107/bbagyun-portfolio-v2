#!/usr/bin/env node
// 프로젝트 소유/공용 분류의 단일 기준이다.
//
// `./harness update`, manifest 생성, stale prune가 모두 이 함수를 쓴다.
// 셸 fallback은 Node를 쓸 수 없는 환경만 위한 보조 경로다.

// 테이블 기반으로 선언한다 (감사 L-1) — 셸 fallback
// (project-owned-fallback.sh)과의 항목 집합 일치를 테스트가 기계 대조할 수
// 있게 하기 위함이다. 항목을 바꾸면 fallback 도 함께 바꿔야 테스트가 통과한다.
//
// 항목 메모:
// - .planning 은 제거 예정 legacy 의 전환기 보호다
//   (docs/audits/2026-07-07-planning-retirement.md; 전 다운스트림 삭제 후 제거).
// - docs/superpowers·docs/prompts 는 상류 설계 이력 문서 — 배포 금지
//   (2026-07-31 감사 1-1·M-4, 2026-08-03 D-5 집행).
// - CHANGELOG.md 는 릴리스 게이트 입력(업스트림 전용), harness.lock.example 은
//   상류 문서 표본 (감사 M-4).
// - projects/ 는 planning-only 저장소의 planning source, registry.json 은
//   docs:build 가 읽는 루트 기능 시드.
// - examples/ 는 harness 데모 워크스페이스다. project-owned = "update 가
//   덮어쓰지 않는다"는 뜻일 뿐, clone 잔재 정리 대상 여부는 별개 개념이다 —
//   그 판정은 upstream-project-state.mjs 가 정하고 examples/ 는 실제 prune
//   대상이다 (커밋 92fa706, 감사 H-3).

// 디렉터리(자기 자신 + 하위 전부).
export const PROJECT_OWNED_DIRS = [
  ".planning",
  "docs/audits",
  "docs/superpowers",
  "docs/prompts",
  "data",
  "projects",
  "specs",
  ".specify",
  ".github",
  ".harness/state",
  ".harness/skills-local",
  "tests",
  "examples",
  "apps",
  // 다운스트림 이관/운영 도구 관례 경로 — 2026-08-07 gnuboard 사고(구버전
  // update.sh가 830개 파일을 구버전으로 오판·삭제) 재발 방지 2선.
  "tools",
  // 프로젝트 소유 규칙: 소스(.harness/rules-local)와 소비 링크 트리
  // (.claude/rules/local). skills-local 패턴의 규칙판 (specs/020).
  ".harness/rules-local",
  ".claude/rules/local",
];

// 단일 파일.
export const PROJECT_OWNED_FILES = [
  "docs/index.html",
  "docs/planning.html",
  "CHANGELOG.md",
  "harness.lock.example",
  "registry.json",
  "ROADMAP.md",
  "README.md",
  "mise.toml",
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "renovate.json",
  ".gitignore",
  ".harness/config/project-profile.yaml",
  ".harness/config/skill-triggers.local.json",
];

export function isProjectOwned(path) {
  if (PROJECT_OWNED_FILES.includes(path)) return true;
  return PROJECT_OWNED_DIRS.some(
    (dir) => path === dir || path.startsWith(`${dir}/`),
  );
}

// 모듈로 import될 때는 CLI 부작용이 없어야 한다. realpath는 macOS /var 리다이렉션
// 때문에 필요하다.
const isMain = await (async () => {
  try {
    const { fileURLToPath } = await import("node:url");
    const { realpathSync } = await import("node:fs");
    const argvPath = realpathSync(process.argv[1]);
    const modulePath = realpathSync(fileURLToPath(import.meta.url));
    return argvPath === modulePath;
  } catch {
    return false;
  }
})();

if (isMain) {
  const args = process.argv.slice(2);
  const mode = args[0];

  if (mode === "--check") {
    const path = args[1];
    if (typeof path !== "string" || path.length === 0) {
      console.error("usage: project-owned.mjs --check <path>");
      process.exit(2);
    }
    process.exit(isProjectOwned(path) ? 0 : 1);
  } else if (mode === "--filter") {
    const { createInterface } = await import("node:readline");
    const rl = createInterface({ input: process.stdin });
    for await (const line of rl) {
      if (line.length === 0) continue;
      if (!isProjectOwned(line)) {
        process.stdout.write(`${line}\n`);
      }
    }
  } else {
    console.error("usage: project-owned.mjs --check <path>");
    console.error("       project-owned.mjs --filter   # stdin → shared-only stdout");
    process.exit(2);
  }
}
