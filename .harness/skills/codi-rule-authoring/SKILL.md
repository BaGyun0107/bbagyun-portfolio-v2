---
name: codi-rule-authoring
description: Use when adding, changing, auditing, or deleting harness rules, policies, native Codex/Claude mirrors, guardrails, skill behavior, or agent workflow constraints. Use this whenever the user mentions rules, policies, Codex/Claude parity, "Claude follows it but Codex does not", hooks, execpolicy, AGENTS/CLAUDE files, .codex/rules, .claude/rules, or replay/context checks.
---

# Codi Rule Authoring

Use this skill to keep shared harness rules effective across Claude Code,
Codex, subagents, hooks, native rule layers, and tests.

The failure mode this skill prevents is common: a rule is written into a policy
file, but Codex does not reliably act on it because Codex has no per-prompt
UserPromptSubmit hook. Treat rule work as distribution and verification work,
not just documentation editing.

## Required Reading

Read these files before changing rule behavior:

1. `.harness/policies/context-engineering.md`
2. `.harness/policies/rule-lifecycle.md`
3. `.harness/policies/scenario-phase-routing.md` when the rule affects phase,
   Spec Kit, subagent, planning, or size routing.
4. `references/steering-taxonomy.md` whenever placing a NEW component or
   choosing between layers (rule vs skill vs hook vs CLAUDE.md) — answer
   its five questions before deciding.
5. One reference from this skill, chosen by the work:
   - `references/codex-mirror-map.md` for Codex behavior or parity changes.
   - `references/claude-mirror-map.md` for Claude hook/rule changes.
   - `references/rule-test-patterns.md` for test coverage design.

## Workflow

1. **Name the source of truth.**
   Prefer `.harness/policies/*.md` for shared team rules. Do not start with a
   Claude-only or Codex-only file when both runtimes must follow the rule.

2. **Classify the rule surface.**
   Decide whether the rule is:
   - narrative guidance only,
   - command execution policy,
   - path-aware or branch-aware enforcement,
   - phase/routing behavior,
   - skill triggering or skill-body behavior,
   - replay-verifiable transcript behavior.

   Then pick the mechanism layer with the five questions in
   `references/steering-taxonomy.md` (compaction survival, persistence,
   trigger, scope, override). Deterministic behavior goes to hooks,
   procedures to skills, conditional invariants to path-scoped rules.

3. **Map runtime mirrors deliberately.**
   For Codex, decide whether the rule needs `AGENTS.md`, `.codex/rules/*.rules`,
   `agent-preflight.sh`, a relevant `.harness/skills/*/SKILL.md`, and replay
   tests. Codex policy text alone is not enough for Medium+ workflow behavior.

4. **Add enforcement where possible.**
   Use hooks for path-aware, branch-aware, or full-command inspection. Use
   `.codex/rules/*.rules` only for prefix-level command execution decisions.
   Do not pretend execpolicy can inspect cwd, branch, dynamic shell strings, or
   arbitrary file paths.

5. **Add regression tests.**
   A rule change is incomplete until the relevant checks prove both the happy
   path and a representative failure path. Prefer:
   - `context-check` for mirror drift.
   - `rule-check` for native rule lifecycle.
   - `codex-replay-check` for Codex transcript behavior.
   - focused hook/tool tests for deterministic blocking.

6. **Report residual runtime gaps.**
   If Codex cannot enforce a rule directly, state the limitation and the
   compensating controls: narrative entrypoint, preflight reminder, replay test,
   hook coverage in Claude, or explicit user approval.

## Codex Hard Questions

Ask these before finishing any shared rule change:

- Will Codex see this rule after the first turn, or only at launcher preflight?
- Does this need a `.codex/rules` mirror, or is execpolicy too weak for it?
- Does this need a transcript replay fixture because the behavior is narrative?
- Did we avoid accepting nearby implementation details, such as skimming
  `specs/*/` files, as proof that the required workflow, such as running
  `speckit-specify` or resuming unchecked tasks.md items, actually ran?
- Is a test proving that the previous bad behavior fails now?

For Planning Hub automation, keep source classification and sync behavior in the
shared Stop adapter. Claude and Codex hook configuration may normalize runtime
payloads only. Preserve fail-open Stop behavior, exclude generated outputs, and
use `planning:check` in CI as the deterministic direct-edit/merge-ready control.
No ordinary hook path may invoke the explicit Planning Lock pull transition.

## Claude 5-Era Authoring Notes

Claude 5-generation models (Fable 5, Opus 5, Sonnet 5) follow instructions
more literally and exercise better judgment than prior models. When authoring
or auditing rules, skills, and review gates, apply these principles:

- **Review/QA rules: coverage first, filter later.** Do not write severity or
  conservatism filters into the finding stage ("only report high-severity",
  "be conservative", "don't nitpick") — these models follow such filters
  literally and silently drop real findings, depressing recall. Instruct
  reviewers to report every finding with confidence and severity attached,
  and move filtering to a separate downstream pass.
- **State goals and constraints, not step enumerations.** Over-prescriptive
  step-by-step scaffolding written for older models reduces output quality on
  Claude 5-generation models. Prefer stating the goal, the constraints, and
  the verification criteria; reserve rigid micro-constraints for
  safety-critical areas (guardrails, destructive operations, secrets).
- **Write each instruction once, in its source of truth.** Do not repeat the
  same guidance across entry points, policies, and skills — duplication was a
  prior-model reinforcement habit and now only spends context budget and
  creates drift surfaces. Keep skills lightweight and split long bodies into
  `references/` files loaded on demand (progressive disclosure).
- **Do not add self-check or verification instructions to prompts.** These
  models verify their own work; "double-check your answer" style instructions
  cause over-verification and wasted tokens. Harness verification gates
  (evidence-based reporting, e2e records) are reporting-honesty controls and
  stay — the rule targets redundant re-check loops, not evidence requirements.

## Completion Checklist

Before claiming the rule work is complete:

- Source of truth updated.
- Layer choice validated against `references/steering-taxonomy.md`
  (five questions) for any new or moved component.
- Runtime mirrors updated or explicitly ruled out with a reason.
- Context/mirror checks updated.
- Regression test added for the failure mode when behavior is observable.
- `npm test`, `./harness context-check`, and relevant targeted checks run.
- Residual Codex/Claude asymmetry reported.
