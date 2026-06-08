# Context Engineering Policy

This document keeps Codex and Claude Code reading the same team conventions.

The reference pattern uses `CLAUDE.md` as the team-convention entry point, but
this harness does not copy the Claude-only structure verbatim. Codex must follow
the same rules, so common policy lives under `.harness`, and `AGENTS.md` and
`CLAUDE.md` stay as thin entry points.

## Source of Truth

| Scope | Source |
| --- | --- |
| Codex / generic agents entry point | `AGENTS.md` |
| Claude Code entry point | `CLAUDE.md` |
| Common policy | `.harness/policies/*.md` |
| Tool-specific narrative rules | `.claude/rules/*.md` (Claude Code), `AGENTS.md` (Codex) |
| Tool-specific command-execution rules | `.codex/rules/*.rules` (Codex execpolicy) |
| Stack-specific rules | `.harness/imported-rules/*.md`, `.harness/skills/*` |
| Per-project team rules | `apps/*/AGENTS.md`, `apps/*/CLAUDE.md` |
| Work state | `.planning/` |
| Project structure mode | `.harness/config/project-profile.yaml` |
| Permission and tool policy | `.harness/policies/tool-permissions.md` |

`CLAUDE.md` declares it follows the same rules as `AGENTS.md` and adds only
Claude-specific hook/launcher/skill paths. Do not duplicate common rules at
length across both files.

The root `AGENTS.md` and `CLAUDE.md` are the harness-managed common entry
points. Durable per-project rules live in `.harness/config/project-profile.yaml`
or app-local `apps/*/AGENTS.md` and `apps/*/CLAUDE.md`.

## Codex / Claude Parity

`.harness/policies` and `.harness/imported-rules` hold the common, tool-neutral
policy that both Codex and Claude Code must follow.

On top of that common layer, each tool also has a native rule layer that the
other tool does not read. These are not a substitute for `.harness` policy;
they are the tool-native enforcement surface for it.

- `.claude/rules/*.md` — Claude Code's path-scoped or always-on narrative rules.
  Loaded automatically by Claude Code. Codex does not read this directory.
- `.codex/rules/*.rules` — Codex execpolicy (Starlark) rules that allow,
  prompt, or forbid command execution. Loaded by Codex only when the project is
  trusted. This is a command-execution policy, not a context document.
- `.harness/policies/rule-lifecycle.md` — the checklist for adding, mirroring,
  testing, and validating new rules.

Rules:

- A new rule that applies to both tools goes into `.harness` first as the
  common source of truth.
- Codex reads the common `.harness` policy through `AGENTS.md`; Claude Code
  reads it through `CLAUDE.md`.
- When a rule needs tool-native enforcement, mirror it into the matching tool
  layer: a Claude `.claude/rules/*.md` file and the Codex-side narrative in
  `AGENTS.md` (plus a `.codex/rules/*.rules` entry when command execution must
  be gated). Keep the mirrored copies in sync; a test should assert parity.
- Do not hide common team rules in a nested `CLAUDE.md` that only Claude Code
  auto-merges. App-level rules may live in app-local `AGENTS.md` and
  `CLAUDE.md` side by side.
- Do not create a Codex-only `.codex/skills` directory or a Codex-only context
  document such as `.codex/AGENTS.md`. `.codex/rules/` is allowed because it is
  a command-execution policy, not a context file, so it does not break parity.
- Codex does not support a UserPromptSubmit hook, which makes it asymmetric to
  Claude Code's runtime skill-injector. Bridge the gap through text policy
  (the Phase table in `AGENTS.md`) and the preflight reminder.
- Run `./harness rule-check` after adding or changing `.claude/rules` or
  `.codex/rules` so orphaned or undocumented native rule files are caught.

## WHAT / WHY / HOW

Agent context should cover three axes.

| Axis | Content | Location |
| --- | --- | --- |
| WHAT | tech stack, active apps, primary paths, runtime | `.harness/config/project-profile.yaml`, app-local `apps/*/AGENTS.md` / `apps/*/CLAUDE.md`, app runtime files |
| WHY | background of architecture decisions, tradeoffs, exception rationale | `.planning/`, `ARCHITECTURE.md` |
| HOW | commands, verification, branch/PR, permissions, skill usage order | `CONTRIBUTING.md`, `.harness/policies/*.md` |

Do not list rules alone; leave the reason for important constraints. When an
exception is required, record the reason and expiry condition in
`decisions.md`.

## Context Budget

`AGENTS.md` and `CLAUDE.md` are loaded as fixed context at session start, so:

- Target each root entry-point file at 200 lines or fewer.
- Do not include long code examples; reference actual file paths or policy
  documents.
- Do not restate formatting rules already enforced by ESLint, Prettier, or
  TypeScript.
- Delegate stack-specific detail to `.harness/skills` or
  `.harness/imported-rules`.
- Delegate project-specific detail to `.harness/config/project-profile.yaml`
  or app-local agent docs.
- A decision that only exists in chat is not source of truth; move it into
  `.planning/` or a policy file.

## Local Overrides

Personal preferences do not override team rules.

- Keep personal preferences in each tool's global config.
- `*.local.md` override files inside the repo are not source of truth.
- Common rules that the team must share land in `.harness` or the root entry
  points via PR.
- Rules that apply only to a specific app land in app-local
  `apps/*/AGENTS.md` or `apps/*/CLAUDE.md` via PR.
- App-local rules may add stricter constraints, stack facts, commands, and
  ownership notes, but they must not weaken `.harness/policies`,
  `.harness/imported-rules`, root `AGENTS.md`, or root `CLAUDE.md`.
- If an app needs an exception from shared policy, record the reason, owner,
  expiry condition, and safer compensating control in `.planning/` or an
  architecture decision before relying on the exception.
- When shared and app-local rules conflict, follow the shared rule until the
  conflict is resolved through a policy change.

Treat `AGENTS.local.md` and `CLAUDE.local.md` as personal scratch notes only.
Shared rules that both tools must follow live in this harness's common policy
files; app-level rules live in app-local documents.

## Drift Prevention

Check for context drift in any of these situations:

- The stack, runtime, package manager, or project profile changed.
- The branch / PR / deploy policy changed.
- A new skill or policy was added.
- `AGENTS.md` or `CLAUDE.md` was modified.
- The harness was merged into a downstream project.

Check command:

```sh
./harness context-check
./harness rule-check
```

`./harness doctor` runs the same checks as part of its pipeline.

## Maintenance Rule

When an agent finds a stale rule, do not patch the implementation immediately;
follow this order:

1. Inspect the actual code and configuration.
2. Record which document is stale in `.planning/` or the review log.
3. If a policy change is needed, confirm with the user.
4. After approval, update the source of truth under `.harness`.
5. Verify with `./harness context-check` and `./harness doctor`.
