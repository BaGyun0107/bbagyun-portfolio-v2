#!/usr/bin/env node
import { existsSync, readFileSync, realpathSync } from "node:fs";
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

// 상대/절대 file path를 모두 project root 기준으로 정규화한 뒤 앱 영역을 판정한다.
function targetsAppArea(rawText, appPath) {
  // 먼저 문자열에 드러난 상대경로를 빠르게 확인한다.
  if (new RegExp(`(^|["'\\s])${appPath.replace("/", "\\/")}(\\/|["'\\s]|$)`).test(rawText)) {
    return true;
  }
  // 파일 경로류 값은 root 기준 절대경로로 정규화한다.
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
}
