# Agent Harness

All agent behavior in this repository follows `.harness/prompt-style/karpathy.md`.

Shared context engineering rules are defined in `.harness/policies/context-engineering.md`. Keep this file as a thin Codex/generic-agent entrypoint and put durable team rules in `.harness` policies, imported rules, or skills, and durable feature state in committed `specs/<NNN-feature>/` directories.

## Required Flow

For non-trivial feature work, bug fixes, refactors, migrations, and reviews:

1. Brainstorming
2. Planning
3. Execution
4. Review
5. Verification

Do not skip directly to implementation unless the task is explicitly trivial.
This flow does not mean every tool is used together on every phase. Follow the
scenario and phase routing in `.harness/policies/scenario-phase-routing.md`,
`.harness/policies/agent-routing.md`, and `.harness/workflow.md` to choose the
smallest useful role set.

### Phase 1~5 routing summary

- P1 Strategy: Superpowers brainstorming for creative/product/architecture changes.
- P2 Specify and plan: `speckit-specify` (request test tasks explicitly) -> `speckit-clarify` -> `speckit-plan` -> `speckit-tasks` -> `speckit-analyze`.
- P3 Execution: implementation guided by unchecked tasks.md items plus Superpowers TDD/debugging/plan execution; the implement step never commits.
- P4 Review and verification: `speckit-converge` until "Converged" plus Superpowers verification discipline; Playwright MCP browser QA when live verification helps.
- P5 Ship and completion: converge green -> update the root `ROADMAP.md` -> PR prep from the spec directory.

For the canonical skill mapping, runtime syntax, escalation rules, and
conditional skills, see `.harness/policies/scenario-phase-routing.md`.

### Size routing summary

Size controls routing, not elapsed time or raw file count. Small = fixed
direction, obvious target, localized, reversible, directly verifiable. Medium
starts as soon as the agent must decide what to inspect, change, or verify.
Large adds multiple ownership boundaries, phases, role gates, handoff, or
user/API impact. Extra large or risky covers production, data, auth/security,
secrets, and other hard-to-reverse work. The canonical criteria and boundary
rules live in `.harness/policies/scenario-phase-routing.md` ("Size Routing");
this summary must not drift from it.

For work that is not clearly Small (Medium+), declare the Size before
implementing (`Size: <Medium|Large|Extra large>, because ...`); Small work is
handled directly with no declaration. The plan of record for Medium+ work
lives in a committed `specs/<NNN-feature>/` directory before implementation
starts — Superpowers/brainstorm outputs are input material, fed to
`speckit-specify`
(see "Plan of Record" in `.harness/policies/scenario-phase-routing.md`). Medium may go direct only when the work is
localized, single-stream, and does not need durable state; app scaffolds, split
frontend/backend work, scaffold/import work, multi-stage implementation, and
session-continuity work are Large/spec cases, not Medium direct cases.

## Codex automation limits

Unlike Claude Code, the Codex CLI does not support a UserPromptSubmit hook.
`./harness codex` runs `.harness/scripts/agent/agent-preflight.sh` once at startup and
prints a phase routing reminder from there.

For every later response, the Codex agent must apply the Phase 1~5 summary
above and `.harness/policies/scenario-phase-routing.md` directly. There is no
runtime keyword-matching skill-injector equivalent to Claude Code.

Codex hard stop for split app work: before editing implementation files for
split frontend/backend, scaffold/import, or other multi-workstream app work,
Codex must first load `codi-phase-routing`, read the project profile, and check
for in-flight features (unchecked `specs/<NNN-*>/tasks.md` items); then write
the literal `Subagent decision:`
block from `.harness/policies/agent-routing.md`. Without explicit user
authorization for subagents, the selected action is `ask`, and Codex must stop
for approval in that same response. Do not proceed inline, do not start package
scaffolding, and do not write `specs/` only after implementation as a
substitute for the Spec Kit planning stages.

To preserve Codex/Claude parity, do not create Codex-only context files (such
as `.codex/AGENTS.md`); see `.harness/policies/context-engineering.md`.

## Tool Responsibilities

Spec Kit owns feature specs and plans (committed `specs/<NNN-feature>/` — spec.md, plan.md, tasks.md, design artifacts), task decomposition, verification records, and session continuity (unchecked tasks.md items plus `.specify/` runtime state).

Playwright MCP provides ad-hoc browser QA (page loads, snapshots, form
interaction, screenshots) for both runtimes via a user-level registration;
claude-in-chrome covers real-browser session cases. See "Browser QA via
Playwright MCP" in `.harness/policies/scenario-phase-routing.md` and the
version pin in `.harness/policies/tool-permissions.md`.

Superpowers owns execution discipline. Use test-driven development during implementation unless the task is documentation-only, configuration-only, or explicitly exempt.

Use external Spec Kit and Superpowers commands/skills directly. The repo-local `codi-phase-routing` skill only summarizes routing; it is not a replacement for upstream tools. Use `karpathy-style` for prompt shape.

Repo-local Codi skills adapt execution to the actual stack. The skill source of truth is `.harness/skills`; Codex reads them through `.agents/skills`.

- Backend work: `codi-backend`
- Frontend work: `codi-frontend`
- Database work: `codi-db`
- Developer workflow / mise work: `codi-dev-workflow`
- Dependency audit, OSV, Renovate, and lockfile update review: `codi-dependency-review`
- E2E gate setup/run/troubleshooting: `codi-e2e`
- Gnuboard5/PHP mall work (php-monolith profile): `codi-gnuboard`
- NestJS-specific work: load `nestjs-expert` when NestJS is detected
- Harness rule/policy authoring and Codex/Claude parity audits: `codi-rule-authoring`

Before finishing feature work that touches `specs/` or the feature hub, run
`mise run feature:status:sync`; apply deterministic adjacent transitions with
`mise run feature:status:sync --apply`, and report ambiguous or `on-hold`
cases instead of auto-applying them.

For the practical step-by-step workflow, follow `CONTRIBUTING.md`.

Before app work, read `.harness/config/project-profile.yaml`.

Project-specific team rules belong in committed app-local files such as
`apps/*/AGENTS.md` or `apps/*/CLAUDE.md`. Personal preferences belong in local
override files such as `AGENTS.local.md` or `CLAUDE.local.md` and are not source
of truth.

## Language and Environment

- Write code comments, commit descriptions, PR titles, issue titles, and PR/issue bodies in Korean unless an external API or standard term must remain in English. Code comments are written for human reviewers, not for AI — keep them Korean even when the surrounding code is in an AI-read file like a hook script or scanner.
- AI-read files are written in English: `AGENTS.md`, `CLAUDE.md`, and everything under `.harness/skills/`, `.harness/imported-rules/`, `.harness/policies/`, `.claude/rules/` (including `.claude/rules/references/`), and `.codex/rules/`. This applies to the *prose* in those files (rule text, headings, descriptions) — code comments inside scripts or examples in those files still follow the Korean-comment rule above. User-facing docs (`README.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `apps/*/AGENTS.md`, `apps/*/CLAUDE.md`) may stay in Korean.
- Keep identifiers, function names, file names, and directory names in English.
- Use commit messages in the form `<type>: <Korean description>`.
- App repo branch/environment mapping: `dev -> dev/development`, `main -> prod/production`.
- The harness repo itself uses version branches and does not enforce the app repo `dev -> main` PR flow.
- GitHub Secrets should only contain `INFISICAL_CLIENT_ID` and `INFISICAL_CLIENT_SECRET`; other secrets belong in Infisical.
- Tool and MCP permission priority is defined in `.harness/policies/tool-permissions.md`.
- App package managers are stack-specific: React-only and Express use `npm`; Next.js and NestJS use `pnpm`. Do not run `yarn` or `bun` as a package manager for app dependencies — the guard blocks them when invoked as a command.
- In a monorepo, each app under `apps/` owns its own `package.json`, lockfile, and `node_modules`. Run installs inside the app directory or name the target explicitly (`pnpm --dir apps/front install`, `npm --prefix apps/front install`), never at the repo root — a root lockfile or root `pnpm-workspace.yaml` hoists dependencies and breaks per-app builds. Codex prefix rules cannot inspect cwd, so `.codex/rules/monorepo-packages.rules` keeps install commands as `prompt`; use explicit `--dir` / `--prefix` examples to reduce ambiguity. See `.harness/policies/tool-permissions.md`.
- Skill ownership: `.harness/skills/` is shared and upstream-owned; `.harness/skills-local/` is project-owned. New skills in a downstream project go under `.harness/skills-local/<name>/`, never under `.harness/skills/`. Read-only inspection and safe diffs of `.harness/skills/**` are allowed; downstream writes are not. Name collisions between the two are rejected by `./harness skills-link`. See `.claude/rules/skill-ownership.md` and `.codex/rules/skill-ownership.rules`.
- Project-owned rules: committed project-wide team rules live in `.harness/rules-local/*.md` (project-owned — harness updates never overwrite, delete, or prune them). When that directory has files, load them all as always-on project rules at session start; Claude also receives them through the `.claude/rules/local/` link tree built by `./harness skills-link`.

## Branch, PR, and Guardrails

Follow `.harness/policies/guardrails.md`.
Follow `.harness/policies/tool-permissions.md` for permission priority, MCP access, and package manager decisions.

- Do not work directly on `main` or `dev`; create a working branch first.
- AI may create PRs, but must never merge PRs.
- App repo normal flow: feature branch -> `dev` PR -> user merge -> `dev` to `main` PR -> user merge.
- In the harness repo, PRs may target version branches; choose the target based on user request or the current release branch.
- For a hotfix, skip the app repo normal flow and open a PR directly against `main`, with user merge.
- After a hotfix is merged to `main`, proceed with a `main -> dev` reverse-sync PR and remind the user that it must be merged.
- Always ask explicit approval before destructive or history-rewriting operations such as `rm -rf`, `DROP TABLE`, `git push --force`, `git reset --hard`, or production deploy/rollback. `gh pr merge` is stricter: AI must never run it, even with approval; the user merges PRs in GitHub.
- E2E gate: when a change touches a user-facing flow, e2e run evidence is required in the verification record. Runtime mirrors: `.claude/rules/e2e-validation.md` (Claude, auto-loaded) and `.codex/rules/e2e-validation.rules` (Codex); full policy in `.harness/policies/quality-gates.md`.
- When stopping to ask the user for a decision, approval, or choice, run `./harness notify-decision "<short Korean reason>"` before asking when practical.

## Source of Truth

Chat is not the source of truth. For Medium or larger multi-stage work, use the
Spec Kit feature flow and keep committed `specs/<NNN-feature>/` directories as
durable state; Spec Kit runtime state lives in `.specify/`, and the
cross-feature overview lives in the thin, manually maintained root
`ROADMAP.md`. Audit records live in `docs/audits/` (harness-owned, active);
a leftover legacy `.planning/` directory is scheduled for removal per
`docs/audits/2026-07-07-planning-retirement.md` — never read or update it
for routing. The 1-5 phase model is a thinking flow, not a local
feature-spec file convention.

## Spec Kit and Context Budget

Use Spec Kit before implementation for Medium or larger work, cross-repository
changes, CI/CD or security operations, migrations, release-risk work, and any
task expected to span multiple stages or sessions.

Spec Kit reduces main-orchestrator context pressure by moving durable state
out of chat and into committed `specs/<NNN-feature>/` directories. Record
goals, assumptions, decisions, task boundaries, commands, verification
results, and handoff notes there. The main orchestrator should load only the
spec state needed for the current stage (the spec.md summary, plan.md, and
unchecked tasks) instead of carrying the full conversation forward.

At the start of a new Medium or larger task, check for in-flight features
before creating new work. If any `specs/<NNN-*>/tasks.md` has unchecked
items, resume or resolve that feature first unless the user explicitly
redirects; unchecked tasks plus `.specify/` state are the checkpoint.

Spec Kit does not automatically create subagents. When independent work
streams are useful and the active environment allows subagents, route that
execution through the relevant Superpowers parallel-agent workflow and keep
the committed spec directory as the shared source of truth.

## Update Checks

Use `./harness codex` instead of invoking `codex` directly. The launcher runs the date-based update check, context-check, JSON config parse, and a skill-injector smoke check before starting the agent.

Harness runtime versions are managed by `mise`; the harness root pins Node.js 24 in `mise.toml`.

For target applications, preserve the app-declared runtime from app-local `mise.toml`, `.node-version`, `.nvmrc`, `package.json#engines`, or CI config. Do not upgrade Node.js 20/22 projects to Node.js 24 unless the user explicitly requests a runtime upgrade.
