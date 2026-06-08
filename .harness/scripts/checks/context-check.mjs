#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(join(import.meta.dirname, "..", "..", ".."));

let failures = 0;
let warnings = 0;

function ok(message) {
  console.log(`ok: ${message}`);
}

function warn(message) {
  warnings += 1;
  console.log(`warn: ${message}`);
}

function fail(message) {
  failures += 1;
  console.log(`fail: ${message}`);
}

function readRelative(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) {
    fail(`${path} is missing`);
    return "";
  }

  ok(`${path} exists`);
  return readFileSync(fullPath, "utf8");
}

function lineCount(text) {
  if (text.length === 0) return 0;
  return text.split(/\r?\n/).length;
}

function requireIncludes(path, text, needles) {
  for (const needle of needles) {
    if (text.includes(needle)) {
      ok(`${path} references ${needle}`);
    } else {
      fail(`${path} must reference ${needle}`);
    }
  }
}

function checkEntrypointSize(path, text) {
  const lines = lineCount(text);
  if (lines <= 200) {
    ok(`${path} is within the 200-line context budget (${lines} lines)`);
  } else if (lines <= 260) {
    warn(`${path} is above the 200-line target (${lines} lines)`);
  } else {
    fail(`${path} is too large for an entrypoint (${lines} lines)`);
  }
}

const agents = readRelative("AGENTS.md");
const claude = readRelative("CLAUDE.md");

for (const path of [
  ".harness/policies/context-engineering.md",
  ".harness/policies/scenario-phase-routing.md",
  ".harness/policies/tool-permissions.md",
  ".harness/policies/guardrails.md",
  ".harness/policies/rule-lifecycle.md",
  ".harness/config/project-profile.yaml",
  ".harness/skills",
  "CONTRIBUTING.md",
]) {
  if (existsSync(join(root, path))) {
    ok(`${path} exists`);
  } else {
    fail(`${path} is missing`);
  }
}

checkEntrypointSize("AGENTS.md", agents);
checkEntrypointSize("CLAUDE.md", claude);

requireIncludes("AGENTS.md", agents, [
  ".harness/policies/context-engineering.md",
  ".harness/policies/scenario-phase-routing.md",
  ".harness/prompt-style/karpathy.md",
  ".harness/config/project-profile.yaml",
  ".harness/policies/tool-permissions.md",
  ".harness/skills",
  ".agents/skills",
  "CONTRIBUTING.md",
]);

requireIncludes("CLAUDE.md", claude, [
  "AGENTS.md",
  ".harness/policies/context-engineering.md",
  ".harness/policies/scenario-phase-routing.md",
  ".harness/prompt-style/karpathy.md",
  ".harness/config/project-profile.yaml",
  ".harness/policies/tool-permissions.md",
  ".harness/skills",
  ".claude/skills",
  "CONTRIBUTING.md",
]);

if (claude.includes("Follow the same repository rules as `AGENTS.md`.")) {
  ok("CLAUDE.md delegates common rules to AGENTS.md");
} else {
  fail("CLAUDE.md must delegate common rules to AGENTS.md");
}

if (agents.includes("Codex reads them through `.agents/skills`")) {
  ok("AGENTS.md declares the Codex skill path");
} else {
  fail("AGENTS.md must declare the Codex skill path");
}

console.log(`\nContext check complete: ${failures} failure(s), ${warnings} warning(s)`);

if (failures > 0) {
  process.exit(1);
}
