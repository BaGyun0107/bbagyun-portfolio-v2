#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { platform } from "node:os";

function readInput() {
  try {
    const raw = readFileSync(0, "utf8");
    if (!raw.trim()) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function escapeAppleScript(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function notify(message) {
  const title = "Codi Harness: 결정 필요";
  const cleanMessage = message.slice(0, 240) || "에이전트가 사용자 결정을 기다리고 있습니다.";

  if (platform() === "darwin") {
    const script = `display notification "${escapeAppleScript(cleanMessage)}" with title "${escapeAppleScript(title)}" sound name "Glass"`;
    const result = spawnSync("osascript", ["-e", script], { stdio: "ignore" });
    if (result.status === 0) return;
  }

  process.stderr.write(`\u0007[${title}] ${cleanMessage}\n`);
}

function flattenText(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(flattenText).filter(Boolean).join("\n");
  if (typeof value === "object") {
    if (typeof value.text === "string") return value.text;
    if (typeof value.content === "string") return value.content;
    if (Array.isArray(value.content)) return flattenText(value.content);
    if (value.message) return flattenText(value.message);
  }
  return "";
}

function extractFromInput(input) {
  const candidates = [
    input.response,
    input.result,
    input.output,
    input.message,
    input.assistant_message,
    input.assistant,
  ];
  return candidates.map(flattenText).filter(Boolean).join("\n");
}

function extractFromTranscript(path) {
  if (!path || !existsSync(path)) return "";
  try {
    const lines = readFileSync(path, "utf8").trim().split("\n").slice(-30).reverse();
    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        const role = event.message?.role || event.role;
        if (role !== "assistant") continue;
        const text = flattenText(event.message?.content || event.content);
        if (text) return text;
      } catch {
        // 손상된 transcript 라인은 무시한다.
      }
    }
  } catch {
    return "";
  }
  return "";
}

function needsDecision(text) {
  if (!text) return false;
  const recent = text.slice(-2000);
  const patterns = [
    /사용자.*(확인|승인|허락|결정)/i,
    /(확인|승인|허락).*필요/i,
    /(선택|결정).*해주세요/i,
    /진행해도\s*(될까요|되나요|괜찮을까요)/i,
    /어떻게\s*(할까요|진행할까요)/i,
    /(원하시나요|하시겠어요)\?/i,
    /need(s)? (your )?(approval|confirmation|decision)/i,
    /please (confirm|choose|decide)/i,
    /should I proceed/i,
  ];
  return patterns.some((pattern) => pattern.test(recent));
}

const input = readInput();
const text = extractFromInput(input) || extractFromTranscript(input.transcript_path);
if (!needsDecision(text)) process.exit(0);

notify("에이전트가 사용자 확인 또는 결정을 기다리고 있습니다.");
