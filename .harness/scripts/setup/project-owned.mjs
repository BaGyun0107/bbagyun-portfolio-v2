#!/usr/bin/env node
// 프로젝트 소유/공용 분류의 단일 기준이다.
//
// `update --apply-harness`, manifest 생성, stale prune가 모두 이 함수를 쓴다.
// 셸 fallback은 Node를 쓸 수 없는 환경만 위한 보조 경로다.

export function isProjectOwned(path) {
  if (
    path === ".planning" ||
    path.startsWith(".planning/") ||
    path === ".github" ||
    path.startsWith(".github/") ||
    path === "README.md" ||
    path === "mise.toml" ||
    path === "package.json" ||
    path === "package-lock.json" ||
    path === "pnpm-lock.yaml" ||
    path === "pnpm-workspace.yaml" ||
    path === "renovate.json" ||
    path === ".gitignore" ||
    path === ".harness/config/project-profile.yaml" ||
    path === ".harness/config/skill-triggers.local.json" ||
    path === ".harness/state" ||
    path.startsWith(".harness/state/") ||
    path === ".harness/skills-local" ||
    path.startsWith(".harness/skills-local/") ||
    path === "apps" ||
    path.startsWith("apps/")
  ) {
    return true;
  }
  return false;
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
