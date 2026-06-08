#!/usr/bin/env node
// shared-manifest.json에 등록된 shared 파일 중 다운스트림에 존재하지 않는
// 파일 경로를 stdout에 한 줄씩 출력한다. update.sh가 이 목록을 받아
// FETCH_HEAD에서 복원한다.
//
// 환경변수:
//   MANIFEST_FILE  shared-manifest.json 경로 (필수). update.sh는 FETCH_HEAD의
//                  manifest를 임시 파일로 떨궈 전달한다.
//   ROOT_DIR       다운스트림 프로젝트 루트 (필수).
//
// 종료 코드:
//   0  성공 (목록이 비어 있어도 정상)
//   1  치명적 오류 (필수 env 누락, manifest 파싱 실패 등)
//
// project-owned 경로는 출력에서 제외한다. 다운스트림이 자신의 .gitignore나
// .harness/config/project-profile.yaml을 들고 있어도 그건 복구 대상이 아니다.
import { readFileSync, existsSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { isProjectOwned } from "./project-owned.mjs";

const manifestPath = process.env.MANIFEST_FILE;
const rawRoot = process.env.ROOT_DIR;
if (!manifestPath || !rawRoot) {
  console.error("MANIFEST_FILE and ROOT_DIR must be set");
  process.exit(1);
}

let root = rawRoot;
try {
  root = realpathSync(rawRoot);
} catch {
  // realpath 실패는 보통 root가 아직 존재하지 않는 임시 디렉터리일 때 발생한다.
  // 그 경우 rawRoot를 그대로 쓴다.
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (error) {
  console.error(`Failed to parse ${manifestPath}: ${error.message}`);
  process.exit(1);
}

if (!manifest || !Array.isArray(manifest.files)) {
  process.exit(0);
}

for (const relPath of manifest.files) {
  if (typeof relPath !== "string" || relPath.length === 0) continue;
  if (isProjectOwned(relPath)) continue;
  const absPath = join(root, relPath);
  if (existsSync(absPath)) continue;
  console.log(relPath);
}
