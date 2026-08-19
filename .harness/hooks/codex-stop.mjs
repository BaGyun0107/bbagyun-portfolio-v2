#!/usr/bin/env node
// Codex Stop adapter — shared planning sync 자동 트리거의 Codex 미러.
//
// Codex Stop 훅 계약(Claude와 다른 점):
//  - matcher 없음(Stop은 matcher 무시).
//  - payload.cwd로 실행되며 저장소 루트 보장이 없다 → cwd를 root로 넘긴다.
//  - exit 0일 때 stdout은 JSON을 기대한다(plain text는 invalid) → `{}`를 출력.
//
// 실제 판정/빌드 로직은 docs-build-on-stop.mjs와 공유한다(one implementation).
// 비차단: build 실패해도 turn을 막지 않고 통과한다.

import { spawnSync } from "node:child_process";
import { runPlanningSyncIfRelevant } from "./docs-build-on-stop.mjs";

// payload.cwd가 서브디렉토리일 수 있으므로 git으로 저장소 루트를 확정한다.
function resolveRoot(cwd) {
  if (!cwd) return undefined;
  const res = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    encoding: "utf8",
  });
  if (res.status === 0 && res.stdout.trim()) return res.stdout.trim();
  return cwd; // git 실패 시 cwd로 폴백
}

let raw = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) raw += chunk;

let cwd;
try {
  cwd = JSON.parse(raw)?.cwd;
} catch {
  cwd = undefined;
}

try {
  runPlanningSyncIfRelevant(resolveRoot(cwd), "codex-stop");
} catch {
  // 비차단: 어떤 실패도 turn을 막지 않는다.
}

// Codex Stop 계약: exit 0 + JSON stdout.
process.stdout.write("{}");
process.exit(0);
