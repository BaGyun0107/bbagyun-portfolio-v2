#!/usr/bin/env node
// .harness/config/required-gitignore.json에 정의된 필수 entry를 다운스트림
// .gitignore에 idempotent하게 추가한다. .gitignore는 project-owned이므로
// 덮어쓰지 않고 누락된 라인만 append한다. 같은 pattern이 다른 형태로 이미
// 있으면 (예: dist vs /dist) 추가하지 않는다.
//
// 환경변수:
//   ROOT_DIR  대상 프로젝트 루트 (필수)
//
// 종료 코드:
//   0  성공 (변경 여부와 무관)
//   1  치명적 오류 (설정 파일 누락, 파싱 실패 등)
//
// stdout: 추가된 entry pattern을 한 줄씩 출력. 변경이 없으면 비어 있음.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.env.ROOT_DIR;
if (!root) {
  console.error("ROOT_DIR must be set");
  process.exit(1);
}

const configPath = join(root, ".harness/config/required-gitignore.json");
if (!existsSync(configPath)) {
  // 설정 파일이 없으면 보장할 것도 없으므로 정상 종료한다.
  process.exit(0);
}

let config;
try {
  config = JSON.parse(readFileSync(configPath, "utf8"));
} catch (error) {
  console.error(`Failed to parse ${configPath}: ${error.message}`);
  process.exit(1);
}

if (!config || !Array.isArray(config.entries)) {
  process.exit(0);
}

const gitignorePath = join(root, ".gitignore");
let existing = "";
if (existsSync(gitignorePath)) {
  existing = readFileSync(gitignorePath, "utf8");
}

// 라인 단위로 비교하되, leading slash 변형은 같은 것으로 본다. 예를 들어
// `/dist`와 `dist`처럼 leading slash만 다른 항목은 동일 패턴으로 취급한다. 주석과 빈 줄은
// 비교 대상에서 제외한다.
const existingPatterns = new Set();
for (const raw of existing.split("\n")) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  // gitignore negation `!`도 정규화 시 보존한다.
  const stripped = line.replace(/^\/+/, "");
  existingPatterns.add(stripped);
}

const additions = [];
for (const entry of config.entries) {
  if (!entry || typeof entry.pattern !== "string") continue;
  const normalized = entry.pattern.replace(/^\/+/, "");
  if (existingPatterns.has(normalized)) continue;
  additions.push(entry);
}

if (additions.length === 0) {
  process.exit(0);
}

// 기존 .gitignore에 trailing newline이 없으면 추가한다.
let next = existing;
if (next.length > 0 && !next.endsWith("\n")) {
  next += "\n";
}

for (const entry of additions) {
  // 빈 줄로 새 섹션을 구분한다.
  if (next.length > 0 && !next.endsWith("\n\n")) {
    next += "\n";
  }
  if (entry.section) {
    next += `${entry.section}\n`;
  }
  next += `${entry.pattern}\n`;
  console.log(entry.pattern);
}

writeFileSync(gitignorePath, next);
