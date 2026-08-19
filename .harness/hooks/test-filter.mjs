#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readInput() {
  try {
    const raw = readFileSync(0, "utf8");
    if (!raw.trim()) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function output(updatedInput) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        updatedInput,
      },
    }),
  );
}

const TEST_PATTERNS = [
  /\bvitest\b/,
  /\bjest\b/,
  /\bmocha\b/,
  /\bnpm\s+(run\s+)?test\b/,
  /\bpnpm\s+(run\s+)?test\b/,
  /\bpytest\b/,
  /\bgo\s+test\b/,
  /\bcargo\s+test\b/,
  /\bmise\s+run\s+test\b/,
  /\bmise\s+run\s+[^ ]*:test\b/,
];

const EXCLUDE_PATTERNS = [
  /\b(install|add|remove|uninstall|init)\b/,
  /\b(cat|head|tail|less|more|wc)\b.*\.(test|spec)\./,
];

const input = readInput();
if (!input) process.exit(0);

if (input.tool_name !== "Bash") process.exit(0);

const command = input.tool_input?.command;
if (!command || typeof command !== "string") process.exit(0);

if (!TEST_PATTERNS.some((pattern) => pattern.test(command))) process.exit(0);
if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(command))) process.exit(0);

const projectDir = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
const filterScript = join(projectDir, ".harness", "hooks", "filter-test-output.sh");
if (!existsSync(filterScript)) process.exit(0);

output({
  ...input.tool_input,
  command: `set -o pipefail; (${command}) 2>&1 | bash "${filterScript}"`,
});
