# Agent Harness

All agent behavior in this repository follows `.harness/prompt-style/karpathy.md`.

Shared context engineering rules are defined in `.harness/policies/context-engineering.md`. Keep this file as a thin Codex/generic-agent entrypoint and put durable team rules in `.harness` policies, imported rules, skills, or `.planning/`.

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

- P1 Strategy: GStack `cso` as the default non-trivial security gate, plus other decision gates and Superpowers brainstorming when needed.
- P2 Project and plan: GSD codebase mapping, milestone setup, discussion, and phase planning.
- P3 Execution: GSD phase execution plus Superpowers TDD/debugging/plan execution.
- P4 Review and verification: GSD review/verification plus GStack review and QA gates.
- P5 Ship and completion: GStack `ship` release gate plus GSD milestone audit, summary, and completion; use GSD `gsd-ship` first only when PR prep should come from GSD state.

For the canonical skill mapping, runtime syntax, escalation rules, and
conditional skills, see `.harness/policies/scenario-phase-routing.md`.

### Size routing summary

Size controls routing, not elapsed time or raw file count. Small requires fixed
direction, an obvious target, localized edits, low blast radius, easy rollback,
and direct verification. Medium starts when the agent must decide what to
inspect, what to change, or how to verify it. Large adds multiple ownership
boundaries, phases, role gates, handoff, or user/API impact. Extra large or
risky covers production, deploy/rollback, CI/CD, infrastructure, database/data
movement, auth, permissions, payments, security, secrets, privacy, destructive
operations, or hard-to-reverse work.

## Codex automation limits

Unlike Claude Code, the Codex CLI does not support a UserPromptSubmit hook.
`./harness codex` runs `.harness/scripts/agent/agent-preflight.sh` once at startup and
prints a phase routing reminder from there.

For every later response, the Codex agent must apply the Phase 1~5 summary
above and `.harness/policies/scenario-phase-routing.md` directly. There is no
runtime keyword-matching skill-injector equivalent to Claude Code.

To preserve Codex/Claude parity, do not create Codex-only context files (such
as `.codex/AGENTS.md`); see `.harness/policies/context-engineering.md`.

## Tool Responsibilities

GSD owns milestones, phase state, context continuity, task decomposition, execution boundaries, verification records, and `.planning/`.

GStack owns decision gates and role review:

- Product and scope: `plan-ceo-review`
- Architecture and engineering tradeoffs: `plan-eng-review`
- UX and product surface: `plan-design-review`
- Security: `cso`
- QA and release confidence: `qa` or `qa-only`
- Branch review: `review`

Superpowers owns execution discipline. Use test-driven development during implementation unless the task is documentation-only, configuration-only, or explicitly exempt.

Use external GSD, GStack, and Superpowers commands/skills directly. The repo-local `codi-phase-routing` skill only summarizes routing; it is not a replacement for upstream tools. Use `karpathy-style` for prompt shape.

Repo-local Codi skills adapt execution to the actual stack. The skill source of truth is `.harness/skills`; Codex reads them through `.agents/skills`.

- Backend work: `codi-backend`
- Frontend work: `codi-frontend`
- Database work: `codi-db`
- Developer workflow / mise work: `codi-dev-workflow`
- Dependency audit, OSV, Renovate, and lockfile update review: `codi-dependency-review`
- NestJS-specific work: load `nestjs-expert` when NestJS is detected

For the practical step-by-step workflow, follow `CONTRIBUTING.md`.

Before app work, read `.harness/config/project-profile.yaml`.

Project-specific team rules belong in committed app-local files such as
`apps/*/AGENTS.md` or `apps/*/CLAUDE.md`. Personal preferences belong in local
override files such as `AGENTS.local.md` or `CLAUDE.local.md` and are not source
of truth.

## Language and Environment

- Write code comments, commit descriptions, PR titles, issue titles, and PR/issue bodies in Korean unless an external API or standard term must remain in English. Code comments are written for human reviewers, not for AI — keep them Korean even when the surrounding code is in an AI-read file like a hook script or scanner.
- AI-read files are written in English: `AGENTS.md`, `CLAUDE.md`, and everything under `.harness/skills/`, `.harness/imported-rules/`, and `.harness/policies/`. This applies to the *prose* in those files (rule text, headings, descriptions) — code comments inside scripts or examples in those files still follow the Korean-comment rule above. User-facing docs (`README.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `apps/*/AGENTS.md`, `apps/*/CLAUDE.md`) may stay in Korean.
- Keep identifiers, function names, file names, and directory names in English.
- Use commit messages in the form `<type>: <Korean description>`.
- App repo branch/environment mapping: `dev -> dev/development`, `main -> prod/production`.
- The harness repo itself uses version branches and does not enforce the app repo `dev -> main` PR flow.
- GitHub Secrets should only contain `INFISICAL_CLIENT_ID` and `INFISICAL_CLIENT_SECRET`; other secrets belong in Infisical.
- Tool and MCP permission priority is defined in `.harness/policies/tool-permissions.md`.
- App package managers are stack-specific: React-only and Express use `npm`; Next.js and NestJS use `pnpm`. Do not use `yarn` or `bun`.
- In a monorepo, each app under `apps/` owns its own `package.json`, lockfile, and `node_modules`. Run installs inside the app directory or name the target explicitly (`pnpm --dir apps/front install`, `npm --prefix apps/front install`), never at the repo root — a root lockfile or root `pnpm-workspace.yaml` hoists dependencies and breaks per-app builds. Codex prefix rules cannot inspect cwd, so `.codex/rules/monorepo-packages.rules` keeps install commands as `prompt`; use explicit `--dir` / `--prefix` examples to reduce ambiguity. See `.harness/policies/tool-permissions.md`.
- Skill ownership: `.harness/skills/` is shared and upstream-owned; `.harness/skills-local/` is project-owned. New skills in a downstream project go under `.harness/skills-local/<name>/`, never under `.harness/skills/`. Read-only inspection and safe diffs of `.harness/skills/**` are allowed; downstream writes are not. Name collisions between the two are rejected by `./harness skills-link`. See `.claude/rules/skill-ownership.md` and `.codex/rules/skill-ownership.rules`.

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
- When stopping to ask the user for a decision, approval, or choice, run `./harness notify-decision "<short Korean reason>"` before asking when practical.

## Source of Truth

Chat is not the source of truth. For Medium or larger multi-phase work, use the
external GSD flow and commit `.planning/` as the durable project state. The 1-5
phase model is a thinking flow, not a local feature-spec file convention.

## GSD and Context Budget

Use GSD before implementation for Medium or larger work, cross-repository
changes, CI/CD or security operations, migrations, release-risk work, and any
task expected to span multiple phases or sessions.

GSD reduces main-orchestrator context pressure by moving durable state out of
chat and into `.planning/`. Record goals, assumptions, decisions, phase
boundaries, commands, verification results, and handoff notes there.
The main orchestrator should load only the `.planning/` state needed for the
current phase instead of carrying the full conversation forward.

At the start of a new Medium or larger task, check existing `.planning/` state
with GSD progress/manager workflows before creating new work. If
`.planning/.continue-here.md`, a paused state, or an in-progress phase exists,
resume or resolve it first unless the user explicitly redirects.

GSD does not automatically create subagents. When independent work streams are
useful and the active environment allows subagents, route that execution through
the relevant Superpowers parallel-agent workflow and keep GSD `.planning/` as
the shared source of truth.

## Update Checks

Use `./harness codex` instead of invoking `codex` directly. The launcher runs the date-based update check, context-check, JSON config parse, and a skill-injector smoke check before starting the agent.

Harness runtime versions are managed by `mise`; the harness root pins Node.js 24 in `mise.toml`.

For target applications, preserve the app-declared runtime from app-local `mise.toml`, `.node-version`, `.nvmrc`, `package.json#engines`, or CI config. Do not upgrade Node.js 20/22 projects to Node.js 24 unless the user explicitly requests a runtime upgrade.
