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
  if (existsSync(fullPath)) {
    ok(`${path} exists`);
    return readFileSync(fullPath, "utf8");
  }

  // lock 모드는 공유 룰을 .claude/rules/shared/ 아래 링크로 제공한다.
  // Claude Code 는 .claude/rules 를 재귀 탐색하므로 정상 로드되지만,
  // 고정 경로만 보면 "missing" 으로 오탐한다 (2026-07-29 다운스트림 실측).
  if (path.startsWith(".claude/rules/")) {
    const shared = join(
      root,
      ".claude/rules/shared",
      path.slice(".claude/rules/".length),
    );
    if (existsSync(shared)) {
      ok(`${path} exists (lock 모드: .claude/rules/shared 경유)`);
      return readFileSync(shared, "utf8");
    }
  }

  fail(`${path} is missing`);
  return "";
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

function forbidMatches(path, text, patterns) {
  for (const [label, pattern] of patterns) {
    if (pattern.test(text)) {
      fail(`${path} must not contain ${label}`);
    } else {
      ok(`${path} does not contain ${label}`);
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
  ".harness/policies/api-contract-first.md",
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

const scenarioPhaseRouting = readRelative(".harness/policies/scenario-phase-routing.md");
const agentRouting = readRelative(".harness/policies/agent-routing.md");
const ruleLifecycle = readRelative(".harness/policies/rule-lifecycle.md");
const codiPhaseRouting = readRelative(".harness/skills/codi-phase-routing/SKILL.md");
const codiRuleAuthoring = readRelative(".harness/skills/codi-rule-authoring/SKILL.md");
const codiFrontendSkill = readRelative(".harness/skills/codi-frontend/SKILL.md");
const codiBackendSkill = readRelative(".harness/skills/codi-backend/SKILL.md");
const apiContractFirst = readRelative(".harness/policies/api-contract-first.md");
const codiRuleCodexMap = readRelative(".harness/skills/codi-rule-authoring/references/codex-mirror-map.md");
const codiRuleTestPatterns = readRelative(".harness/skills/codi-rule-authoring/references/rule-test-patterns.md");
const agentPreflight = readRelative(".harness/scripts/agent/agent-preflight.sh");
const codexPhaseRoutingRule = readRelative(".codex/rules/phase-routing.rules");
const gitignore = readRelative(".gitignore");

requireIncludes(".harness/policies/scenario-phase-routing.md", scenarioPhaseRouting, [
  "Codex Medium+ Hard Gate",
  "Superpowers `docs/superpowers/*` must not replace `specs/<NNN-feature>/`",
  "spec? unchecked tasks? subagents? Codi skills? commit permission?",
  "absence of `specs/` is not a no-spec reason",
  "Existing unchecked tasks.md items are an even stronger",
  "before subagent, design, or implementation",
  "Skimming spec files without adopting their unchecked tasks",
  "must not downshift the same task",
  "has unchecked items, resume that feature",
  "speckit-specify",
]);

requireIncludes(".harness/policies/agent-routing.md", agentRouting, [
  "Codex Subagent Routing",
  "Listing Codi owner skills is not a subagent routing decision",
  "`Subagent decision:`",
  "not the first routing step",
  "must load `codi-phase-routing`, read the project profile, and\ncheck for in-flight features",
  "Skimming spec files without adopting their unchecked tasks",
  "Without explicit user authorization for subagents",
  "selected action must be `ask`",
  "do not replace the block with a prose question",
  "the response is a hard stop",
  "Updating the spec directory only after code was written",
  "Codex Stack-Skill Declaration",
  "Codex Commit Guard",
]);

requireIncludes(".harness/policies/rule-lifecycle.md", ruleLifecycle, [
  "codi-rule-authoring",
  "runtime mirrors and regression tests",
]);

requireIncludes(".harness/policies/api-contract-first.md", apiContractFirst, [
  "The Anchoring Chain",
  "Stop Rule: No Schema Basis, No Mock",
  "Greenfield: When No Schema Exists Yet",
  "derived(",
  "status: proposed",
  "execpolicy too weak",
]);

requireIncludes(".harness/skills/codi-frontend/SKILL.md", codiFrontendSkill, [
  ".harness/policies/api-contract-first.md",
]);

requireIncludes(".harness/skills/codi-backend/SKILL.md", codiBackendSkill, [
  ".harness/policies/api-contract-first.md",
]);

const projectProfilePolicy = readRelative(".harness/policies/project-profile.md");
requireIncludes(".harness/policies/project-profile.md", projectProfilePolicy, [
  "Developer Role (Per-Machine Write Scope)",
  "Writes are blocked, reads always pass.",
  ".harness/state/dev-role",
]);

requireIncludes(".harness/skills/codi-phase-routing/SKILL.md", codiPhaseRouting, [
  "Codex Medium+ Checklist",
  "Superpowers `docs/superpowers/*` is not durable feature state",
  "commit permission?",
  "Size Self-Check",
  "Size marker?",
  ".harness/state/current-size",
  "shared team asset committed via git",
  "Direct execution is allowed only",
  "are Large/spec cases, not Medium",
  "do not treat absence of `specs/` as",
  "permission to skip the spec flow",
  "resumed or explicitly deferred by the user",
  "Skimming spec files without adopting their",
  "include test tasks (TDD)",
  "do not",
  "downshift the same task",
  "speckit-specify",
  "Listing owner skills is",
  "not enough",
  "`Subagent decision:`",
  "do not replace the block with a prose question",
  "Without explicit subagent",
  "authorization, choose `ask` and stop",
  "choose `ask` and stop",
  "`ask` is a hard\n  stop",
  "writing a spec directory only after",
]);

requireIncludes(".harness/skills/codi-rule-authoring/SKILL.md", codiRuleAuthoring, [
  "Codex has no per-prompt\nUserPromptSubmit hook",
  "Name the source of truth",
  "Map runtime mirrors deliberately",
  "Add regression tests",
  "Codex Hard Questions",
]);

requireIncludes(".harness/skills/codi-rule-authoring/references/codex-mirror-map.md", codiRuleCodexMap, [
  ".codex/rules/*.rules",
  "replay checks",
  "execpolicy too weak",
  "Treating direct SDK/helper commands as proof",
]);

requireIncludes(".harness/skills/codi-rule-authoring/references/rule-test-patterns.md", codiRuleTestPatterns, [
  "Bad transcript",
  "Good transcript",
  "I skimmed specs/003-upload/tasks.md",
  "Selected action: ask",
]);

const claudePhaseRoutingRule = readRelative(".claude/rules/phase-routing.md");
requireIncludes(".claude/rules/phase-routing.md", claudePhaseRoutingRule, [
  "Medium+ Hard Gate",
  "Small work is NOT gated",
  "Direct execution is allowed only",
  "Plan-of-Record Gate (the destination is `specs/`)",
  "is not a no-spec reason",
  "speckit-specify",
]);

requireIncludes(".codex/rules/phase-routing.rules", codexPhaseRoutingRule, [
  "Absence of specs/ is not a no-spec reason",
  "specs/NNN-*/tasks.md with unchecked items gets resumed first",
  "Skimming spec files without adopting the",
  "do not downshift the same split app",
  "Subagent decision before implementation",
  "resume that feature before subagent,",
  "specs/ is a shared team asset",
  ".harness/state/current-size",
  "Writing a spec only after implementation",
  "If selected action is ask, stop",
]);

requireIncludes(".harness/scripts/agent/agent-preflight.sh", agentPreflight, [
  "spec? unchecked tasks? subagents? Codi skills? commit permission?",
  ".harness/policies/scenario-phase-routing.md",
]);

requireIncludes("AGENTS.md", readRelative("AGENTS.md"), [
  "Codex hard stop for split app work",
  "must first load `codi-phase-routing`, read the project profile, and check\nfor in-flight features",
  "Without explicit user",
  "authorization for subagents, the selected action is `ask`",
  "do not write `specs/` only after implementation",
  "Harness rule/policy authoring and Codex/Claude parity audits: `codi-rule-authoring`",
]);

// .planning 은 제거 예정 legacy 다(docs/audits/2026-07-07-planning-retirement.md).
// 제거는 git rm 경유이며, ignore 로 숨기면 다운스트림의 삭제 절차와 공유 상태가
// 깨지므로 전체 무시를 막는다. 모든 다운스트림이 삭제한 뒤 이 가드도 제거한다.
if (/^\.planning(\/(\*|\*\*))?$/m.test(gitignore)) {
  fail(".gitignore must NOT ignore all of .planning (`.planning`, `.planning/*`, `.planning/**`); a leftover legacy .planning/ is removed via git rm (docs/audits/2026-07-07-planning-retirement.md), never hidden by ignore");
} else {
  ok(".gitignore does not blanket-ignore .planning (leftover legacy is removed via git rm, not ignore)");
}

// CLAUDE.md is a thin delta over the @AGENTS.md import: only Claude-specific
// wiring is asserted here; the common references are asserted on AGENTS.md.
requireIncludes("CLAUDE.md", claude, [
  "AGENTS.md",
  ".claude/skills",
  ".claude/rules",
  "./harness claude",
  "skill-injector",
]);

// The common rule body loads only through a BARE import line: the Claude
// Code import parser skips code spans/fences, so a backticked `@AGENTS.md`
// mention silently loads nothing.
if (/^@AGENTS\.md$/m.test(claude)) {
  ok("CLAUDE.md imports AGENTS.md via a bare @AGENTS.md line");
} else {
  fail("CLAUDE.md must contain a bare `@AGENTS.md` import line (not inside backticks or a code fence)");
}

if (agents.includes("Codex reads them through `.agents/skills`")) {
  ok("AGENTS.md declares the Codex skill path");
} else {
  fail("AGENTS.md must declare the Codex skill path");
}

forbidMatches("AGENTS.md", agents, [
  ["broad Medium no-spec shortcut", /`specs\/` is not required for Medium|no[- ]spec, going direct/],
]);

forbidMatches(".harness/skills/codi-phase-routing/SKILL.md", codiPhaseRouting, [
  ["broad Medium no-spec shortcut", /`specs\/` is optional here|no[- ]spec, going direct/],
]);

forbidMatches(".claude/rules/phase-routing.md", claudePhaseRoutingRule, [
  ["broad Medium no-spec shortcut", /`specs\/` is \*\*not required\*\*|no[- ]spec, going direct/],
]);

forbidMatches(".codex/rules/phase-routing.rules", codexPhaseRoutingRule, [
  // .planning 은 제거 예정 legacy 다. 옛 local-only 정책 문구가 다시 들어오면 회귀로 본다.
  ["local-only .planning regression", /local-only \.planning\/ state/],
]);

console.log(`\nContext check complete: ${failures} failure(s), ${warnings} warning(s)`);

if (failures > 0) {
  process.exit(1);
}
