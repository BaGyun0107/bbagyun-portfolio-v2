# Agent Harness

All agent behavior in this repository follows `.harness/prompt-style/karpathy.md`.

Shared context engineering rules are defined in `.harness/policies/context-engineering.md`. Keep this file as a thin Codex/generic-agent entrypoint and put durable team rules in `.harness` policies, imported rules, or skills, and durable feature state in committed `specs/<NNN-feature>/` directories.

## Required Flow

Apply the common scenario/phase contract in
`.harness/policies/scenario-phase-routing.md` and role ownership in
`.harness/policies/agent-routing.md`. Think through strategy, planning,
execution, review and verification without invoking every skill on every task.

Spec-required work uses Spec Kit before implementation: new subsystems, split
apps/imports, multiple owners, public contracts, persistent data, deployment/
security controls, distributed harness behavior or multi-session continuity.
Localized reversible fixes and read-only audits may proceed directly.
Medium+ declares Size; size alone does not require a new spec or approval.

Spec Kit owns the single spec/plan/tasks record. Conditional clarify resolves
material decisions; then prepare plan/tasks/analyze as one reviewable package.
The codi-auto-loop skill handles requested end-to-end application. Continue
within existing user authorization; otherwise request review before implementation.
Never invent human-owned checklist answers or approvals. Native tool permissions
and destructive/production/secret-access approvals remain separate.

Resume the related feature; unrelated unchecked/deferred tasks do not block work.
Use the session/worktree selection in the canonical policy when working concurrently.
Keep decisions, failed approaches, evidence and remaining work in committed specs.
Superpowers provides conditional brainstorming, TDD/debugging and review/evidence
discipline without a second plan/task ledger.

## Runtime Capabilities

Both Claude Code and supported Codex CLI installations have prompt/tool hooks.
Check actual version, trust, configuration and host support; report unsupported,
absent, unwired or unknown states. The shared adapters normalize runtime events.
When hooks are unavailable, apply the common policy directly after launcher preflight.
Model identity is not proof that a hook or subagent tool is available.

For independent implementation streams, record a `Subagent decision:` with scope,
authority, action and context boundaries. Delegate only when useful and authorized;
bounded inline execution is valid when delegation is unavailable. Ask only when
a real permission or independence requirement prevents progress.
Before app work load codi-phase-routing and the project profile, then owner skills.

To preserve parity, do not create Codex-only context documents such as
`.codex/AGENTS.md`; use `.harness/policies/context-engineering.md`.

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
- App lint/format and dependency inspection or repair: `codi-app-quality`
- Harness version updates and cache maintenance: `codi-harness-update`
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
- Comment content follows `.harness/policies/code-comment-style.md`: body comments state the why/constraints the code cannot show (no what-summaries or spec/task provenance headers); `TODO`/`FIXME` need a trackable issue or spec-task reference; public API contracts go in JSDoc/TSDoc. Review nearby existing comments too, and run `./harness comment-check` for changed sources.
- AI-read files are written in English: `AGENTS.md`, `CLAUDE.md`, and everything under `.harness/skills/`, `.harness/imported-rules/`, `.harness/policies/`, `.claude/rules/` (including `.claude/rules/references/`), and `.codex/rules/`. This applies to the *prose* in those files (rule text, headings, descriptions) — code comments inside scripts or examples in those files still follow the Korean-comment rule above. User-facing docs (`README.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `apps/*/AGENTS.md`, `apps/*/CLAUDE.md`) may stay in Korean.
- Keep identifiers, function names, file names, and directory names in English.
- Use commit messages in the form `<type>: <Korean description>`; the full
  convention (types, no `[claude]` tags, no emoji, PR shape) is `.harness/policies/commit-pr-style.md`.
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
- Harness repo release gate: a PR that changes shared-distributed paths (members of `.harness/shared-manifest.json`) must add a new `## vX.Y.Z` section to `CHANGELOG.md` in the same PR, or explicitly declare batching in the PR body — a merge without a section releases nothing and never reaches downstream. See "Release gate and changelog" in `.harness/policies/update-policy.md`.
- For a hotfix, skip the app repo normal flow and open a PR directly against `main`, with user merge.
- After a hotfix is merged to `main`, proceed with a `main -> dev` reverse-sync PR and remind the user that it must be merged.
- Always ask explicit approval before destructive or history-rewriting operations such as `rm -rf`, `DROP TABLE`, `git push --force`, `git reset --hard`, or production deploy/rollback. `gh pr merge` is stricter: AI must never run it, even with approval; the user merges PRs in GitHub.
- E2E gate: when a change touches a user-facing flow, e2e run evidence is required in the verification record. Runtime mirrors: `.claude/rules/e2e-validation.md` (Claude, auto-loaded) and `.codex/rules/e2e-validation.rules` (Codex); full policy in `.harness/policies/quality-gates.md`.
- When stopping to ask the user for a decision, approval, or choice, run `./harness notify-decision "<short Korean reason>"` before asking when practical.

## Source of Truth

Chat is not the source of truth. For spec-required work, use the
Spec Kit feature flow and keep committed `specs/<NNN-feature>/` directories as
durable state; Spec Kit runtime state lives in `.specify/`, and the
cross-feature overview lives in the thin, manually maintained root
`ROADMAP.md`. Audit records live in `docs/audits/` (harness-owned, active);
a leftover legacy `.planning/` directory is scheduled for removal per
`docs/audits/2026-07-07-planning-retirement.md` — never read or update it
for routing. The 1-5 phase model is a thinking flow, not a local
feature-spec file convention.

## Spec Kit and Context Budget

Use Spec Kit for the boundaries in the canonical scenario-phase-routing policy:
new subsystems, multiple owners, public contracts, data, deployment/security
controls, distributed behavior and multi-session continuity. Local reversible
fixes and read-only audits may proceed directly.

Spec Kit reduces main-orchestrator context pressure by moving durable state
out of chat and into committed `specs/<NNN-feature>/` directories. Record
goals, assumptions, decisions, task boundaries, commands, verification
results, and handoff notes there. The main orchestrator should load only the
spec state needed for the current stage (the spec.md summary, plan.md, and
unchecked tasks) instead of carrying the full conversation forward.

At the start of spec-required work, check for related in-flight features.
Resume the related feature's unchecked tasks and explicit selection; unrelated
deferred or external tasks are not a repository-wide lock.

Spec Kit does not automatically create subagents. When independent work
streams are useful and the active environment allows subagents, route that
execution through the relevant Superpowers parallel-agent workflow and keep
the committed spec directory as the shared source of truth.

## Update Checks

Use `./harness codex` instead of invoking `codex` directly. The launcher runs the date-based update check, context-check, JSON config parse, and a skill-injector smoke check before starting the agent.

Harness runtime versions are managed by `mise`; the harness root pins Node.js 24 in `mise.toml`.

For target applications, preserve the app-declared runtime from app-local `mise.toml`, `.node-version`, `.nvmrc`, `package.json#engines`, or CI config. Do not upgrade Node.js 20/22 projects to Node.js 24 unless the user explicitly requests a runtime upgrade.

For delegated work, apply **Delegated Worker Scope** in
`.harness/policies/agent-routing.md`: the user-facing coordinator owns the request;
workers return evidence for their assigned scope without restarting the whole loop.
