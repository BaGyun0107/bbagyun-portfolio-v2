#!/usr/bin/env node
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// 루트와 cwd를 모두 realpath로 맞춰 symlink 리다이렉션 차이를 없앤다.
let rootDir = resolve(__dirname, "../..");
try {
  rootDir = realpathSync(rootDir);
} catch {}
const configPath = join(rootDir, ".harness/config/tool-permissions.json");

function readInput() {
  try {
    const raw = readFileSync(0, "utf8");
    if (!raw.trim()) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function block(reason) {
  process.stdout.write(
    JSON.stringify({
      decision: "block",
      reason,
    }),
  );
}

function getCommand(input) {
  return input?.tool_input?.command;
}

// 패키지 매니저 "실행" 감지 — 커맨드 위치 매칭 (specs/004-onboarding-bootstrap R5).
// 문자열 전체 \b매칭은 검색 인자(rg "bun")와 mise 도구 관리(mise use bun@1)까지
// 차단하는 오탐을 냈다. 단순 커맨드(;, &&, ||, |) 분리 후 각 세그먼트의 선행
// 토큰(env 할당·mise exec --·corepack 제거 후)이 매니저일 때만 사용으로 본다.
const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun"];

function leadingPackageManager(segment) {
  const tokens = segment.trim().split(/\s+/);
  let i = 0;
  while (i < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i])) i += 1;
  if (tokens[i] === "mise") {
    // `mise exec -- <pm> ...`만 매니저 실행이다. use/install/ls 등은 도구 관리.
    if (tokens[i + 1] !== "exec") return null;
    const dash = tokens.indexOf("--", i + 2);
    if (dash === -1) return null;
    i = dash + 1;
  }
  if (tokens[i] === "corepack") i += 1;
  const head = (tokens[i] ?? "").replace(/^["']+|["']+$/g, "");
  return PACKAGE_MANAGERS.includes(head) ? head : null;
}

function packageManagersFromCommand(command) {
  const found = [];
  for (const segment of command.split(/\|\||&&|;|\|/)) {
    const used = leadingPackageManager(segment);
    if (used && !found.includes(used)) found.push(used);
  }
  return found;
}

function findTargetDir(command, cwd) {
  // `apps/front-old` 같은 이웃 경로가 앱 경로로 분류되지 않게 segment 경계를 요구한다.
  const SEGMENT_TERMINATOR = `[\\s"';|&<>]|$`;
  const candidates = [
    {
      pattern: new RegExp(`\\bapps\\/front(?:\\/|(?=${SEGMENT_TERMINATOR}))`),
      dir: "apps/front",
    },
    {
      pattern: new RegExp(`\\bapps\\/back(?:\\/|(?=${SEGMENT_TERMINATOR}))`),
      dir: "apps/back",
    },
    {
      pattern: new RegExp(
        `--prefix\\s+(?:\\.\\/)?apps\\/front(?:\\/|(?=${SEGMENT_TERMINATOR}))`,
      ),
      dir: "apps/front",
    },
    {
      pattern: new RegExp(
        `--prefix\\s+(?:\\.\\/)?apps\\/back(?:\\/|(?=${SEGMENT_TERMINATOR}))`,
      ),
      dir: "apps/back",
    },
    { pattern: /--filter\s+['"]?front['"]?/, dir: "apps/front" },
    { pattern: /--filter\s+['"]?back['"]?/, dir: "apps/back" },
  ];

  const hit = candidates.find((candidate) => candidate.pattern.test(command));
  if (hit) return join(rootDir, hit.dir);

  let resolvedCwd = cwd ? resolve(rootDir, cwd) : rootDir;
  try {
    resolvedCwd = realpathSync(resolvedCwd);
  } catch {}
  // 현재 경로도 정확한 앱 경로 또는 실제 하위 경로일 때만 앱 대상으로 본다.
  const rel = relative(rootDir, resolvedCwd);
  if (rel && !rel.startsWith("..")) {
    const posixRel = rel.split(sep).join("/");
    if (posixRel === "apps/front" || posixRel.startsWith("apps/front/")) {
      return join(rootDir, "apps/front");
    }
    if (posixRel === "apps/back" || posixRel.startsWith("apps/back/")) {
      return join(rootDir, "apps/back");
    }
  }
  return rootDir;
}

function detectStack(targetDir) {
  const packageJsonPath = join(targetDir, "package.json");
  if (!existsSync(packageJsonPath)) return { area: "unknown", stack: "unknown" };

  const pkg = readJson(packageJsonPath);
  if (!pkg) return { area: "unknown", stack: "unknown" };

  const deps = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
    ...(pkg.peerDependencies ?? {}),
  };

  const relative = targetDir.replace(rootDir, "").replace(/^\//, "");
  if (relative === "apps/front") {
    if (deps.next) return { area: "frontend", stack: "next" };
    if (deps.react) return { area: "frontend", stack: "react" };
  }

  if (relative === "apps/back") {
    if (deps["@nestjs/core"]) return { area: "backend", stack: "nestjs" };
    if (deps.express) return { area: "backend", stack: "express" };
  }

  return { area: "root", stack: "harness" };
}

function expectedPackageManager(config, area, stack) {
  return config?.package_managers?.[area]?.[stack] ?? null;
}

// 설치류 서브커맨드 판정: npm/pnpm install, add, npm i 단축형.
// `mise exec -- pnpm install` 같은 래핑 형태도 매칭하도록 mise 접두를 무시한다.
function isInstallCommand(command) {
  const normalized = command.replace(/^\s*mise\s+exec\s+--\s+/, "").trim();
  return /^(?:corepack\s+)?(?:npm|pnpm)\s+(?:install|add|i)(?:\s|$)/.test(normalized);
}

// 루트 install 차단은 실제 앱이 있는 다운스트림 모노레포에서만 적용한다.
// 판정 기준은 `apps/*/package.json` 존재다. 하네스 레포는 apps/ 를 템플릿으로만
// 두고 apps/*/package.json 이 없으므로 자동으로 제외되어, 하네스 루트의 도구
// 의존성 install 은 차단되지 않는다.
function isAppMonorepo(appDirs) {
  return appDirs.some((dir) => existsSync(join(rootDir, dir, "package.json")));
}

function guardRootInstall(input, config) {
  if (input?.tool_name !== "Bash") return false;
  if (config?.package_managers?.no_root_install !== true) return false;

  const command = getCommand(input);
  if (!command || typeof command !== "string") return false;
  if (!isInstallCommand(command)) return false;

  const dirs = config?.package_managers?.app_install_dirs ?? [
    "apps/front",
    "apps/back",
  ];
  if (!isAppMonorepo(dirs)) return false;

  const cwd = input?.tool_input?.cwd;
  const targetDir = findTargetDir(command, cwd);
  // 앱을 못 찾으면 rootDir를 반환하므로 루트 대상 install로 본다.
  if (targetDir !== rootDir) return false;

  block(
    `Package manager policy blocked a root-level install in a monorepo. ` +
      `Run the install inside an app directory instead, e.g. ` +
      `'cd ${dirs[0] ?? "apps/front"} && <pnpm|npm> install' or ` +
      `'pnpm --dir ${dirs[0] ?? "apps/front"} install'. ` +
      `Do not hoist dependencies or create a lockfile at the repo root.`,
  );
  return true;
}

function expectedFromScaffoldCommand(command) {
  if (/\bcreate\s+(?:next-app|next)\b|\bcreate-next-app\b|\bnext(?:-app)?@latest\b/.test(command)) {
    return { expected: "pnpm", label: "frontend/next scaffold" };
  }

  if (/\bcreate\s+vite\b|\bvite@latest\b/.test(command)) {
    return { expected: "npm", label: "frontend/react scaffold" };
  }

  if (/\b@nestjs\/cli\b|\bnest\s+new\b/.test(command)) {
    return { expected: "pnpm", label: "backend/nestjs scaffold" };
  }

  if (/\bexpress-generator\b|\bexpress\s+--view\b/.test(command)) {
    return { expected: "npm", label: "backend/express scaffold" };
  }

  return null;
}

function isDatabaseMcp(toolName) {
  return /(?:database|postgres|mysql|mariadb|sqlite|supabase|prisma|drizzle|sql|db)/i.test(toolName);
}

function isWriteLikeMcp(toolName) {
  return /(?:write|insert|update|delete|drop|truncate|execute|mutate|migrate|apply)/i.test(toolName);
}

function isDropLikeMcp(toolName) {
  return /(?:drop|truncate|reset|destroy|destructive)/i.test(toolName);
}

function isExternalSideEffectMcp(toolName) {
  return /(?:stripe|payment|refund|capture|twilio|sms|sendgrid|resend|mail|email|push|webhook|customer|notification|openai|anthropic)/i.test(toolName);
}

function inputText(input) {
  try {
    return JSON.stringify(input?.tool_input ?? {});
  } catch {
    return "";
  }
}

function inputLooksProduction(input) {
  return /(?:\bprod\b|\bproduction\b|\blive\b)/i.test(inputText(input));
}

function guardPackageManager(input, config) {
  if (input?.tool_name !== "Bash") return false;

  const command = getCommand(input);
  if (!command || typeof command !== "string") return false;

  const usedManagers = packageManagersFromCommand(command);
  if (usedManagers.length === 0) return false;

  const banned = config?.package_managers?.banned ?? [];
  const bannedUsed = usedManagers.find((used) => banned.includes(used));
  if (bannedUsed) {
    block(
      `Package manager policy blocked '${bannedUsed}'. This harness allows only npm and pnpm. React/Express use npm; Next.js/NestJS use pnpm.`,
    );
    return true;
  }

  const used = usedManagers[0];
  const scaffold = expectedFromScaffoldCommand(command);
  if (scaffold && !usedManagers.includes(scaffold.expected)) {
    block(
      `Package manager policy blocked '${used}' for ${scaffold.label}. Use '${scaffold.expected}' for this target.`,
    );
    return true;
  }

  const cwd = input?.tool_input?.cwd;
  const targetDir = findTargetDir(command, cwd);
  const { area, stack } = detectStack(targetDir);
  const expected = expectedPackageManager(config, area, stack);

  if (expected && used !== expected) {
    block(
      `Package manager policy blocked '${used}' for ${area}/${stack}. Use '${expected}' for this target.`,
    );
    return true;
  }

  return false;
}

function guardMcp(input) {
  const toolName = input?.tool_name;
  if (!toolName || !toolName.startsWith("mcp__")) return false;

  const role = process.env.CODI_AGENT_ROLE || "default";
  if (isExternalSideEffectMcp(toolName) && (isWriteLikeMcp(toolName) || inputLooksProduction(input))) {
    block(
      "Tool permission policy blocked external side-effect access. Ask for explicit user approval and confirm sandbox/dry-run target, idempotency, and stop/rollback plan.",
    );
    return true;
  }

  if (!isDatabaseMcp(toolName)) return false;

  if (inputLooksProduction(input)) {
    block(
      "Tool permission policy blocked production database/data access. Ask for explicit user approval and use minimized, redacted evidence instead of raw records.",
    );
    return true;
  }

  if (isDropLikeMcp(toolName)) {
    block(
      "Tool permission policy blocked database drop/reset/destructive DDL access. Ask for explicit user approval and use an admin-controlled path with backup and rollback evidence.",
    );
    return true;
  }

  if (role === "frontend" && isWriteLikeMcp(toolName)) {
    block(
      "Tool permission policy blocked frontend-role database write access. Ask the user to approve a backend/admin role boundary before continuing.",
    );
    return true;
  }

  if ((role === "default" || role === "security") && isWriteLikeMcp(toolName)) {
    block(
      "Tool permission policy blocked database write access for this role. Use a backend/admin role only after explicit user approval.",
    );
    return true;
  }

  return false;
}

const input = readInput();
if (!input) process.exit(0);

const config = readJson(configPath);
if (!config) process.exit(0);

if (guardPackageManager(input, config)) process.exit(0);
if (guardRootInstall(input, config)) process.exit(0);
if (guardMcp(input, config)) process.exit(0);
