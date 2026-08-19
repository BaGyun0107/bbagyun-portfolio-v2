#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

function readInput() {
  try {
    const raw = readFileSync(0, "utf8");
    if (!raw.trim()) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function block(reason) {
  process.stdout.write(JSON.stringify({ decision: "block", reason }));
}

function readMode(root) {
  const profilePath = join(root, ".harness", "config", "project-profile.yaml");
  if (!existsSync(profilePath)) return "split-front-back";
  const body = readFileSync(profilePath, "utf8");
  const match = body.match(/^\s*mode:\s*([A-Za-z0-9_-]+)/m);
  return match?.[1] || "split-front-back";
}

// 비차단 경고(guardrails.mjs warn과 동형): permission 결정은 건드리지 않는다.
function warn(context) {
  process.stdout.write(
    JSON.stringify({
      systemMessage: context,
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        additionalContext: context,
      },
    }),
  );
}

// 개발자별 역할 마커(.harness/state/dev-role, git-ignored).
// front | back | fullstack | 미설정. 프로젝트 모드(project-profile.yaml)와
// 별개의 "사람 축" — 커밋되지 않으므로 머신마다 달라도 충돌이 없다.
function readRole(root) {
  const rolePath = join(root, ".harness", "state", "dev-role");
  if (!existsSync(rolePath)) return "";
  try {
    return readFileSync(rolePath, "utf8").trim().toLowerCase();
  } catch {
    return "";
  }
}

function stringify(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const input = readInput();
if (!input) process.exit(0);

const rawRoot = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
// 절대경로와 root 비교가 symlink 리다이렉션에 흔들리지 않게 맞춘다.
let root = rawRoot;
try {
  root = realpathSync(rawRoot);
} catch {}

const mode = readMode(root);
const text = stringify(input.tool_input);

// tool_input의 파일 경로를 root 기준 상대경로로 정규화해 앱 영역 소속을 판정한다.
// (raw text 언급 검사와 분리 — role 가드는 Write content 속 경로 "언급"에
// 오탐하면 안 되므로 경로 전용 판정이 필요하다.)
function filePathTargets(appPath) {
  const pathLike =
    input.tool_input?.file_path ||
    input.tool_input?.path ||
    input.tool_input?.filename ||
    null;
  if (typeof pathLike !== "string" || pathLike.length === 0) return false;
  let absolute = isAbsolute(pathLike) ? pathLike : resolve(root, pathLike);
  try {
    absolute = realpathSync(absolute);
  } catch {
    // 파일이 없으면 가장 가까운 기존 부모를 기준으로 정규화한다.
    let probe = absolute;
    const segments = [];
    while (probe && probe !== sep) {
      try {
        const realParent = realpathSync(probe);
        absolute = segments.length === 0
          ? realParent
          : join(realParent, ...segments.reverse());
        break;
      } catch {
        segments.push(probe.split(sep).pop());
        probe = probe.substring(0, probe.lastIndexOf(sep));
      }
    }
  }
  const rel = relative(root, absolute);
  if (rel.startsWith("..")) return false;
  const posixRel = rel.split(sep).join("/");
  return posixRel === appPath || posixRel.startsWith(`${appPath}/`);
}

// 프로필 모드 판정: 문자열 언급(빠른 검사) 또는 정규화된 파일 경로.
function targetsAppArea(rawText, appPath) {
  if (new RegExp(`(^|["'\\s])${appPath.replace("/", "\\/")}(\\/|["'\\s]|$)`).test(rawText)) {
    return true;
  }
  return filePathTargets(appPath);
}

if (mode === "planning-only" && (targetsAppArea(text, "apps/front") || targetsAppArea(text, "apps/back"))) {
  block(
    "Project profile is planning-only, so both app surfaces are disabled. This repository holds planning sources only; implementation belongs in the downstream application repositories.",
  );
  process.exit(0);
}

if (mode === "php-monolith" && (targetsAppArea(text, "apps/front") || targetsAppArea(text, "apps/back"))) {
  block(
    "Project profile is php-monolith, so the Node app surfaces (apps/front, apps/back) are disabled. Mall code lives under apps/<mall>/; route PHP mall work through the codi-gnuboard skill.",
  );
  process.exit(0);
}

if (["next-fullstack", "frontend-only"].includes(mode) && targetsAppArea(text, "apps/back")) {
  block(
    `Project profile is ${mode}, so apps/back is disabled. Ask the user to approve a profile change to split-front-back before creating or modifying apps/back.`,
  );
  process.exit(0);
}

if (mode === "backend-only" && targetsAppArea(text, "apps/front")) {
  block(
    "Project profile is backend-only, so apps/front is disabled. Ask the user to approve a profile change before creating or modifying apps/front.",
  );
  process.exit(0);
}

// ---- Developer role guard (write-scope only; reads always pass) ----
// 계약-우선 정책(api-contract-first.md)은 상대 영역 "읽기"를 전제로 하므로
// 여기서는 쓰기 형태만 차단한다. navigate-by-mistake 방어 — 셸 변수 간접
// 참조 등은 skill-ownership 가드와 동일하게 out-of-scope.
function bashWritesToArea(cmd, appPath) {
  const p = appPath.replace("/", "\\/");
  if (!new RegExp(`(^|["'\\s=])${p}(\\/|["'\\s]|$)`).test(cmd)) return false;
  // 영역 경로로의 리다이렉트
  if (new RegExp(`>{1,2}\\s*["']?${p}\\/`).test(cmd)) return true;
  // 파일 쓰기 계열 명령이 영역을 언급
  if (/(^|[;&|]{1,2}\s*)(cp|mv|rm|mkdir|touch|tee|rsync|dd|truncate|ln)\b/.test(cmd)) return true;
  // sed 인플레이스 편집
  if (/\bsed\b[^|;&]*\s-[a-zA-Z]*i/.test(cmd)) return true;
  // 영역 내부 의존성 변경
  if (/\b(npm|pnpm|yarn|bun)\s+(install|ci|add|remove|uninstall|update|up)\b/.test(cmd)) return true;
  // 워킹트리를 다시 쓰는 git 하위 명령
  if (/\bgit\b[^|;&]*\s(checkout|restore|clean|rm|mv|apply|stash)\b/.test(cmd)) return true;
  return false;
}

const bashCommand = typeof input.tool_input?.command === "string" ? input.tool_input.command : "";

function writesToArea(appPath) {
  // Bash는 쓰기 형태 패턴으로, 그 외(Write/Edit/MultiEdit 등록 도구)는
  // 정규화된 file_path로만 판정한다.
  if (bashCommand) return bashWritesToArea(bashCommand, appPath);
  return filePathTargets(appPath);
}

const role = readRole(root);
const ROLE_FORBIDS = { front: "apps/back", back: "apps/front" };
const forbidden = ROLE_FORBIDS[role];

if (forbidden && writesToArea(forbidden)) {
  block(
    `Developer role on this machine is "${role}" (.harness/state/dev-role), so ${forbidden} is write-protected. ` +
      `Reading ${forbidden} is allowed; request changes through the API contract flow ` +
      `(.harness/policies/api-contract-first.md), or run "./harness role fullstack" if this machine owns both surfaces.`,
  );
  process.exit(0);
}

// role 미설정: 차단 없이 1회성 안내만 (신규 clone 마찰 방지).
if (!role && (writesToArea("apps/front") || writesToArea("apps/back"))) {
  const hintPath = join(root, ".harness", "state", "dev-role-hint-shown");
  if (!existsSync(hintPath)) {
    try {
      mkdirSync(join(root, ".harness", "state"), { recursive: true });
      writeFileSync(hintPath, `${new Date().toISOString()}\n`);
      warn(
        "Tip: this machine has no developer role set. If this developer owns only one app surface, " +
          'run "./harness role front|back|fullstack" to write-protect the other surface (one-time hint).',
      );
    } catch {}
  }
}
