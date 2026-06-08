#!/usr/bin/env node
// 목록에는 없지만 로컬에 남은 공용 파일을 stdout으로 출력한다.
// 이 목록은 update.sh가 받아 오래된 파일을 정리한다.
// 입력: MANIFEST_FILE, ROOT_DIR.
import { readFileSync, readdirSync, lstatSync, realpathSync } from "node:fs";
import { join, relative } from "node:path";
import { isProjectOwned } from "./project-owned.mjs";

const manifestPath = process.env.MANIFEST_FILE;
const rawRoot = process.env.ROOT_DIR;
if (!manifestPath || !rawRoot) {
  console.error("MANIFEST_FILE and ROOT_DIR must be set");
  process.exit(2);
}
// 경로 비교는 macOS /var 리다이렉션에서도 맞도록 root를 realpath로 맞춘다.
let root = rawRoot;
try {
  root = realpathSync(rawRoot);
} catch {}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch {
  process.exit(0);
}
if (!manifest || !Array.isArray(manifest.files)) process.exit(0);

const shared = new Set(manifest.files);

const SCAN_ROOTS = [
  ".harness",
  ".claude/rules",
  ".codex/rules",
  ".agents/results",
];

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    const rel = relative(root, full);
    if (rel === ".harness/state" || rel.startsWith(".harness/state/")) continue;
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    if (entry.isSymbolicLink()) {
      out.push(rel);
      continue;
    }
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile()) {
      out.push(rel);
    }
  }
}

const found = [];
for (const sub of SCAN_ROOTS) {
  const full = join(root, sub);
  try {
    const s = lstatSync(full);
    if (s.isSymbolicLink()) {
      found.push(sub);
      continue;
    }
    if (!s.isDirectory()) continue;
  } catch {
    continue;
  }
  walk(full, found);
}

const stale = found
  .filter((p) => !shared.has(p))
  .filter((p) => !isProjectOwned(p))
  .sort();

for (const p of stale) process.stdout.write(`${p}\n`);
