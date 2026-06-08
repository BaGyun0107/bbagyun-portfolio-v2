#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { isAbsolute, join } from "node:path";

const root = process.argv[2];
if (!root) {
  console.error("usage: write-lock.mjs <repo-root>");
  process.exit(2);
}

const lockPath = join(root, ".harness", "lock.json");
const lock = JSON.parse(readFileSync(lockPath, "utf8"));
const gstackSourceDir = process.env.GSTACK_SOURCE_DIR || join(process.env.HOME || "", ".claude", "skills", "gstack");
if (!isAbsolute(gstackSourceDir)) {
  console.error(`GSTACK_SOURCE_DIR must be an absolute path: ${gstackSourceDir}`);
  process.exit(2);
}
if (!process.env.HOME && !process.env.GSTACK_SOURCE_DIR) {
  console.error("HOME is required unless GSTACK_SOURCE_DIR is set");
  process.exit(2);
}

function tryExec(command, args) {
  try {
    return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

const gsdPackage = lock.tools?.gsd?.package || "@opengsd/get-shit-done-redux";
const gsdVersion = tryExec("mise", ["exec", "--", "npm", "view", gsdPackage, "version"]);
if (gsdVersion) {
  lock.tools.gsd.version = gsdVersion;
}

if (existsSync(join(gstackSourceDir, ".git"))) {
  const sha = tryExec("git", ["-C", gstackSourceDir, "rev-parse", "HEAD"]);
  if (sha) {
    lock.tools.gstack.ref = sha;
  }
}

// Superpowers는 Claude Code / Codex plugin marketplace 가 자체 관리하므로
// lock.json 에 ref / sha 를 기록하지 않는다. install_via / marketplace_id 만
// 정책으로 남긴다.

lock.updated_at = new Date().toISOString();

writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
