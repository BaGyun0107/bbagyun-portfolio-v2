// migrate 제거 목록 계산 (specs/006-harness-migrate R1).
// 제거 목록 = 패키지 shared-manifest ∩ git tracked − project-owned − KEEP_COMMITTED.
// 분류의 단일 출처(project-owned.mjs)를 재사용한다 — 목록 하드코딩 금지(FR-002).
import { lstatSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { isProjectOwned } from "../setup/project-owned.mjs";

// lock 모드에서도 반드시 커밋으로 남아야 하는 파일 — clone 직후 설치 전에
// 필요한 진입점들이다. (mise.toml/README/.gitignore 등은 project-owned
// 분류가 이미 보호한다.)
// lock 모드에서도 커밋으로 남는 파일. 두 부류다:
//   1. clone 직후 설치 전에 필요한 진입점 (harness, AGENTS.md, CLAUDE.md)
//   2. CI가 직접 호출하는 스크립트 — .harness/** 는 git 비추적이라
//      actions/checkout 에는 없다. 이 4개만 커밋으로 남기면 CI는 복원
//      스텝이나 업스트림 인증 토큰 없이 그대로 동작한다 (2026-07-29).
//      전부 Node 내장 모듈만 쓰는 자기완결 스크립트다.
// 이 목록은 migrate.sh / pkg-sync.sh 가 keep-committed.sh 를 통해 공유한다.
export const KEEP_COMMITTED = [
  "harness",
  "AGENTS.md",
  "CLAUDE.md",
  ".harness/scripts/checks/ci-node-verify.sh",
  ".harness/scripts/deploy/node-package-manager.sh",
  ".harness/scripts/audit/osv-severity-gate.js",
  ".harness/scripts/audit/dependency-impact-report.js",
];
// manifest 커버리지 테스트(tests/manifest-coverage.test.mjs)가 참조하므로 export.
export const KEEP_COMMITTED_PREFIXES = [".husky/"];

// 패키지가 통째로 소유하는 디렉토리 — 이 아래의 tracked 파일은 새 manifest에
// 없어도(업스트림에서 개명·삭제된 stale 잔재) 제거 대상이다. materialize.sh의
// 공유 인프라 링크 목록과 짝을 이루므로 함께 갱신할 것.
// (.claude/rules 는 프로젝트 룰 실파일과 혼재라 파일 단위로만 다룬다.)
export const SHARED_DIR_ROOTS = [
  ".harness/hooks/",
  ".harness/scripts/",
  ".harness/policies/",
  ".harness/imported-rules/",
  ".harness/prompt-style/",
  ".harness/vendor/",
  ".harness/skills/", // skill-ownership 규칙상 전적으로 upstream 소유 (skills-local 별도)
  ".codex/rules/",
];

// 소비 측 링크 경로 — materialize/skills-link 가 만드는 링크로, manifest 에는
// 없지만 git 에 추적되면 안 되는 경로다 (2026-07-30 codi-account 실측: 스킬
// 링크 37개 + speckit 실파일 20개 커밋). 회수·감사가 이 목록을 공유한다.
export const CONSUMER_LINK_ROOTS = [".claude/skills/", ".agents/skills/"];
export const CONSUMER_LINK_PATHS = [".claude/rules/shared"];

function keepCommitted(path) {
  if (KEEP_COMMITTED.includes(path)) return true;
  return KEEP_COMMITTED_PREFIXES.some((p) => path.startsWith(p));
}

// 디렉터리 자체가 링크로 추적된 경우도 잡는다: `.harness/vendor` 링크는
// `startsWith('.harness/vendor/')` 에 걸리지 않는다 (2026-07-30 codi-crew 실측).
function underRoot(path, roots) {
  return roots.some((root) => path === root.slice(0, -1) || path.startsWith(root));
}

export function computeRemovals({ manifestFiles, trackedFiles }) {
  const manifest = new Set(manifestFiles);
  const removable = (f) =>
    (manifest.has(f) ||
      underRoot(f, SHARED_DIR_ROOTS) ||
      underRoot(f, CONSUMER_LINK_ROOTS) ||
      CONSUMER_LINK_PATHS.includes(f)) &&
    !isProjectOwned(f) &&
    !keepCommitted(f);
  return [...new Set(trackedFiles)].filter(removable).sort();
}

// CLI: node migrate-plan.mjs <repoRoot> [manifestPath]
// manifest(기본: 패키지 .harness/current 경유)와 repo의 tracked 목록으로
// 제거 목록을 한 줄에 하나씩 출력한다. dry-run은 캐시 경로를 직접 넘긴다.
// 심링크 경유 실행에서도 main 판정이 되도록 realpath 비교 (resolve-version 동일)
const isMain = await (async () => {
  try {
    const { realpathSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    return (
      realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
})();

if (isMain) {
  const args = process.argv.slice(2).filter((a) => a !== "--disk");
  const diskMode = process.argv.includes("--disk");
  const repoRoot = args[0] ?? process.cwd();
  const manifestPath =
    args[1] ?? `${repoRoot}/.harness/current/.harness/shared-manifest.json`;
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    // --disk: 신규(init 직후) 레포는 복사본이 untracked라 tracked 대신
    // "디스크 존재"를 후보로 쓴다 (specs/006 US2). 심링크는 materialize
    // 산출물이므로 후보에서 제외한다.
    const candidates = diskMode
      ? (manifest.files ?? []).filter((f) => {
          try {
            return lstatSync(`${repoRoot}/${f}`).isFile();
          } catch {
            return false;
          }
        })
      : execFileSync("git", ["-C", repoRoot, "ls-files"], {
          encoding: "utf8",
          // 대형 레포의 ls-files 출력이 기본 1MB 버퍼를 넘으면 ENOBUFS로
          // 죽는다 (2026-08-07 gnuboard 파일럿 실측 1.4MB).
          maxBuffer: 64 * 1024 * 1024,
        })
          .split("\n")
          .filter(Boolean);
    const removals = computeRemovals({
      manifestFiles: manifest.files ?? [],
      trackedFiles: candidates,
    });
    process.stdout.write(removals.map((f) => `${f}\n`).join(""));
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  }
}
