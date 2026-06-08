#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { platform } from "node:os";

function escapeAppleScript(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function notify(title, message) {
  const cleanTitle = title.slice(0, 80) || "Codi Harness";
  const cleanMessage = message.slice(0, 240) || "사용자 확인이 필요합니다.";

  if (platform() === "darwin") {
    const script = `display notification "${escapeAppleScript(cleanMessage)}" with title "${escapeAppleScript(cleanTitle)}" sound name "Glass"`;
    const result = spawnSync("osascript", ["-e", script], { stdio: "ignore" });
    if (result.status === 0) return;
  }

  process.stderr.write(`\u0007[${cleanTitle}] ${cleanMessage}\n`);
}

const [, , kind = "decision", ...rest] = process.argv;
const message = rest.join(" ").trim() || "사용자 결정이 필요합니다. 에이전트 질문을 확인해주세요.";

const titleByKind = {
  decision: "Codi Harness: 결정 필요",
  guard: "Codi Harness: 승인 필요",
  done: "Codi Harness: 작업 완료",
};

notify(titleByKind[kind] || "Codi Harness", message);
