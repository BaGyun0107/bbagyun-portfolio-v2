#!/usr/bin/env node
// Codex PreToolUse adapter (2026-07-06 parity pilot).
//
// OpenAI Codex now ships official lifecycle hooks whose PreToolUse payload
// carries cwd + tool_name + tool_input.command — exactly what execpolicy
// prefix rules could never see. This adapter translates the Codex payload
// into the Claude PreToolUse shape and reuses guardrails.mjs verbatim, so
// both runtimes enforce the same Bash blocks (protected branches, dangerous
// commands, shared-skill writes) from ONE implementation.
//
// Pilot scope: BLOCKS only. guardrails' non-blocking warnings
// (additionalContext) are Claude-shaped and are dropped here; porting them
// is a follow-up. Rejection uses the official contract: exit 2 + reason on
// stderr. Unparseable/unknown payloads fail open (exit 0) — execpolicy and
// the narrative rules remain the outer layers, same "navigate-by-mistake"
// stance as the Claude hook.

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const GUARDRAILS = join(HERE, "guardrails.mjs");
const PROFILE_GUARD = join(HERE, "project-profile-guard.mjs");

let raw = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) raw += chunk;

let payload;
try {
  payload = JSON.parse(raw);
} catch {
  process.exit(0);
}

const toolName = String(payload?.tool_name || "");
const command = payload?.tool_input?.command;
if (!command || typeof command !== "string") process.exit(0);
if (!/^(bash|shell|local_shell)$/i.test(toolName)) process.exit(0);

const claudeShaped = JSON.stringify({
  tool_name: "Bash",
  cwd: payload.cwd,
  tool_input: { command, cwd: payload.cwd },
});

// Claude PreToolUse와 같은 순서로 두 가드를 모두 통과해야 한다:
// guardrails(보호 브랜치·위험 명령·공유 스킬 쓰기) + project-profile-guard
// (프로필별 앱 표면 차단 — planning-only는 apps/** 전체).
for (const hook of [GUARDRAILS, PROFILE_GUARD]) {
  const res = spawnSync("node", [hook], {
    input: claudeShaped,
    encoding: "utf8",
    timeout: 10000,
  });
  try {
    const parsed = JSON.parse(res.stdout || "");
    if (parsed.decision === "block") {
      process.stderr.write(parsed.reason || "Blocked by harness hooks.");
      process.exit(2);
    }
  } catch {
    // 출력 없음(허용) 또는 경고 JSON — 파일럿에서는 통과.
  }
}
process.exit(0);
