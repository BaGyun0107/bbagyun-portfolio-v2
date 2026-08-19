#!/usr/bin/env node
// 하위 프로젝트로 전파되는 공용 파일 목록을 생성한다.
// 하네스 repo에서만 실행하며 `./harness manifest`로 수동 재생성할 수 있다.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { isProjectOwned } from "./project-owned.mjs";

const root = resolve(process.cwd());

// 정식 harness repo 클론인지 판별한다. doctor 의 is_harness_repo /
// init-project 의 origin_matches_harness 와 동형이며, 단순 substring 이 아니라
// canonical owner/repo/host 로만 매칭한다. 다운스트림에서는 manifest 를
// 재생성하면 안 된다(source_ref 가 그 프로젝트 브랜치명으로 오염됨).
function isHarnessRepo() {
  let originUrl = "";
  try {
    originUrl = execFileSync("git", ["remote", "get-url", "origin"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    originUrl = "";
  }
  if (originUrl) {
    const trimmed = originUrl.replace(/\/$/, "").replace(/\.git$/, "");
    const canonical = new Set([
      "https://github.com/CODIWORKS-Engineer/codi-harness",
      "https://github.com/CODIWORKS-Engineer/codi-harness-v2",
      "git@github.com:CODIWORKS-Engineer/codi-harness",
      "git@github.com:CODIWORKS-Engineer/codi-harness-v2",
      "ssh://git@github.com/CODIWORKS-Engineer/codi-harness",
      "ssh://git@github.com/CODIWORKS-Engineer/codi-harness-v2",
    ]);
    return canonical.has(trimmed);
  }
  // 원격이 전혀 없는 fresh local clone 만 v1/v2 branch marker 를 허용한다.
  let remotes = "";
  try {
    remotes = execFileSync("git", ["remote"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    remotes = "";
  }
  if (remotes) return false;
  for (const ref of ["refs/heads/v1", "refs/heads/v2"]) {
    try {
      execFileSync("git", ["show-ref", "--verify", "--quiet", ref], {
        cwd: root,
        stdio: ["ignore", "ignore", "ignore"],
      });
      return true;
    } catch {
      // 해당 ref 없음 — 다음 후보 확인
    }
  }
  return false;
}

if (!isHarnessRepo()) {
  // 다운스트림: manifest 는 upstream 소유이므로 재생성하지 않는다.
  process.exit(0);
}

function gitLsFiles(args) {
  const out = execFileSync("git", ["ls-files", "-z", ...args], {
    cwd: root,
    encoding: "buffer",
    stdio: ["ignore", "pipe", "pipe"],
    // 대형 레포의 ls-files 출력이 기본 1MB 버퍼를 넘으면 ENOBUFS로 죽는다.
    maxBuffer: 64 * 1024 * 1024,
  });
  return out
    .toString("utf8")
    .split("\0")
    .filter((p) => p.length > 0);
}

function listManifestCandidateFiles() {
  const tracked = gitLsFiles([]);
  const untracked = gitLsFiles(["--others", "--exclude-standard"]);
  return [...new Set([...tracked, ...untracked])];
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
const candidates = listManifestCandidateFiles();
const shared = candidates.filter((p) => !isProjectOwned(p)).sort();

// 목록 파일 자체도 하위 프로젝트에 적용되어야 하므로 목록에 보장한다.
if (!shared.includes(".harness/shared-manifest.json")) {
  shared.push(".harness/shared-manifest.json");
  shared.sort();
}

// source_ref 는 릴리스 라인 식별자다 (release-check L-11, 다운스트림 출처 표시).
// 피처 브랜치명을 찍으면 모든 동시 PR 이 같은 줄을 바꿔 병합 충돌을 보장하므로,
// 릴리스 브랜치(vN)에서만 갱신하고 그 외에는 기존 값을 보존한다.
// 기존 manifest 가 없거나 값이 비어 있을 때만 현재 브랜치/SHA 로 폴백한다.
let previous = null;
try {
  previous = readFileSync(manifestPath, "utf8");
} catch {}

let previousRef = null;
if (previous !== null) {
  try {
    previousRef = JSON.parse(previous).source_ref ?? null;
  } catch {}
}

const currentRef = detectSourceRef();
const isReleaseRef = currentRef !== null && /^v\d+$/.test(currentRef);
const sourceRef = isReleaseRef ? currentRef : (previousRef ?? currentRef);

const manifest = {
  schema_version: 1,
  source_ref: sourceRef,
  file_count: shared.length,
  files: shared,
};

const serialized = `${JSON.stringify(manifest, null, 2)}\n`;

// 내용이 바뀐 경우에만 파일을 다시 쓴다.

if (previous === serialized) {
  console.log(`shared-manifest.json is up to date (${shared.length} files).`);
  process.exit(0);
}

writeFileSync(manifestPath, serialized);
console.log(`Wrote shared-manifest.json with ${shared.length} files.`);
