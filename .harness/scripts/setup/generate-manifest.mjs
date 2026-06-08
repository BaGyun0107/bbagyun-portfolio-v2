#!/usr/bin/env node
// 하위 프로젝트로 전파되는 공용 파일 목록을 생성한다.
// 하네스 repo에서만 실행하며 `./harness manifest`로 수동 재생성할 수 있다.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { isProjectOwned } from "./project-owned.mjs";

const root = resolve(process.cwd());

function listTrackedFiles() {
  const out = execFileSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "buffer",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return out
    .toString("utf8")
    .split("\0")
    .filter((p) => p.length > 0);
}

function detectSourceRef() {
  try {
    const branch = execFileSync(
      "git",
      ["rev-parse", "--abbrev-ref", "HEAD"],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    if (branch && branch !== "HEAD") return branch;
  } catch {}
  try {
    const sha = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (sha) return sha;
  } catch {}
  return null;
}

const manifestPath = resolve(root, ".harness", "shared-manifest.json");
const tracked = listTrackedFiles();
const shared = tracked.filter((p) => !isProjectOwned(p)).sort();

// 목록 파일 자체도 하위 프로젝트에 적용되어야 하므로 목록에 보장한다.
if (!shared.includes(".harness/shared-manifest.json")) {
  shared.push(".harness/shared-manifest.json");
  shared.sort();
}

const sourceRef = detectSourceRef();

const manifest = {
  schema_version: 1,
  source_ref: sourceRef,
  file_count: shared.length,
  files: shared,
};

const serialized = `${JSON.stringify(manifest, null, 2)}\n`;

// 내용이 바뀐 경우에만 파일을 다시 쓴다.
let previous = null;
try {
  previous = readFileSync(manifestPath, "utf8");
} catch {}

if (previous === serialized) {
  console.log(`shared-manifest.json is up to date (${shared.length} files).`);
  process.exit(0);
}

writeFileSync(manifestPath, serialized);
console.log(`Wrote shared-manifest.json with ${shared.length} files.`);
