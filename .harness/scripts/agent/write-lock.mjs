#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2];
if (!root) {
  console.error("usage: write-lock.mjs <repo-root>");
  process.exit(2);
}

const lockPath = join(root, ".harness", "lock.json");
const lock = JSON.parse(readFileSync(lockPath, "utf8"));

// 이전 planning engine은 더 이상 lock으로 관리하지 않는다. Spec Kit은
// 사용자가 uvx로 프로젝트별 설치하므로 lock 대상 도구가 아니다.
// Playwright MCP는 사용자 레벨 등록 + 점검 스크립트의 핀 상수로 관리한다.

// Superpowers는 Claude Code / Codex plugin marketplace 가 자체 관리하므로
// lock.json 에 ref / sha 를 기록하지 않는다. install_via / marketplace_id 만
// 정책으로 남긴다.

lock.updated_at = new Date().toISOString();

writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
