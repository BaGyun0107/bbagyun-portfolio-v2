# Claude Code Harness

Follow the same repository rules as `AGENTS.md`.

The shared prompt style is `.harness/prompt-style/karpathy.md`.

Shared context engineering rules are defined in `.harness/policies/context-engineering.md`. Keep this file as a thin Claude Code entrypoint and put common team rules in the same `.harness` sources used by Codex.

Use the required workflow for non-trivial work:

1. Brainstorming
2. Planning
3. Execution
4. Review
5. Verification

GSD owns milestones, phase state, `.planning/`, and context preservation. GStack owns decision gates. Superpowers owns execution discipline and TDD.
Do not merge all three tools into every phase by default. Follow the phase
routing in `.harness/policies/scenario-phase-routing.md`,
`.harness/policies/agent-routing.md`, and `.harness/workflow.md` to choose the
smallest useful role set.

Routing summary: P1 uses GStack `cso` as the default non-trivial security gate;
P2 uses GSD for map/discuss/plan; P3 uses GSD execute plus Superpowers
TDD/debugging discipline; P4 uses GSD review/verify plus GStack review/QA; P5
uses GStack `ship` as the release gate and only runs GSD `gsd-ship` first when
PR prep must come from GSD state.

Size summary: Small requires fixed direction, an obvious target, localized
edits, low blast radius, easy rollback, and direct verification. Medium starts
when the agent must decide what to inspect, change, or verify. Large adds
multiple ownership boundaries, phases, role gates, handoff, or user/API impact.
Extra large or risky covers production, deploy/rollback, CI/CD, infrastructure,
database/data movement, auth, permissions, payments, security, secrets, privacy,
destructive operations, or hard-to-reverse work.

Shared Codi skills live in `.harness/skills`; Claude Code reads them through `.claude/skills`.

The UserPromptSubmit hook in `.claude/settings.json` runs `.harness/hooks/skill-injector.mjs`, which *suggests* skills via keyword matching (suggestion only, not enforced). For detailed phase mapping, see `.harness/policies/scenario-phase-routing.md`.

The repo-local `codi-phase-routing` skill summarizes how to call external GSD, GStack, and Superpowers tools. It is a routing guide, not a replacement for upstream tools. External installs and updates are still handled by `./harness install` and the update-check flow.

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

GSD and context budget rules:

- Use GSD before implementation for Medium or larger work, cross-repository changes, CI/CD or security operations, migrations, release-risk work, and any task expected to span multiple phases or sessions.
- GSD reduces main-orchestrator context pressure by moving durable state out of chat and into `.planning/`.
- Record goals, assumptions, decisions, phase boundaries, commands, verification results, and handoff notes in GSD state.
- The main orchestrator should load only the `.planning/` state needed for the current phase instead of carrying the full conversation forward.
- At the start of a new Medium or larger task, check existing `.planning/` state with GSD progress/manager workflows before creating new work. If `.planning/.continue-here.md`, a paused state, or an in-progress phase exists, resume or resolve it first unless the user explicitly redirects.
- GSD does not automatically create subagents. When independent work streams are useful and the active environment allows subagents, route that execution through the relevant Superpowers parallel-agent workflow and keep `.planning/` as the shared source of truth.

Language and environment rules:

- Write code comments, commit descriptions, PR titles, issue titles, and PR/issue bodies in Korean unless an external API or standard term must remain in English. Code comments are written for human reviewers, not for AI — keep them Korean even when the surrounding code is in an AI-read file like a hook script or scanner.
- AI-read files are written in English: `AGENTS.md`, `CLAUDE.md`, and everything under `.harness/skills/`, `.harness/imported-rules/`, and `.harness/policies/`. This applies to the *prose* in those files (rule text, headings, descriptions) — code comments inside scripts or examples in those files still follow the Korean-comment rule above. User-facing docs (`README.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `apps/*/AGENTS.md`, `apps/*/CLAUDE.md`) may stay in Korean.
- Keep identifiers, function names, file names, and directory names in English.
- Use commit messages in the form `<type>: <Korean description>`.
- App repo branch/environment mapping: `dev -> dev/development`, `main -> prod/production`.
- The harness repo itself uses version branches and does not enforce the app repo `dev -> main` PR flow.
- GitHub Secrets should only contain `INFISICAL_CLIENT_ID` and `INFISICAL_CLIENT_SECRET`; other secrets belong in Infisical.
- Tool and MCP permission priority is defined in `.harness/policies/tool-permissions.md`.
- App package managers are stack-specific: React-only and Express use `npm`; Next.js and NestJS use `pnpm`. Do not use `yarn` or `bun`.
- In a monorepo, each app under `apps/` owns its own `package.json`, lockfile, and `node_modules`. Run installs inside the app directory or name the target explicitly (`pnpm --dir apps/front install`, `npm --prefix apps/front install`), never at the repo root. `.claude/rules/monorepo-packages.md` is loaded automatically with the full rule and rationale; `.harness/hooks/tool-permission-guard.mjs` blocks a root-level install.
- Skill ownership: `.harness/skills/` is shared/upstream and overwritten on every `./harness update --apply-harness`; `.harness/skills-local/` is project-owned and never overwritten. New skills in this project go under `.harness/skills-local/<name>`. Read-only inspection and safe diffs of `.harness/skills/**` are allowed; downstream writes are not. `./harness skills-link` rebuilds `.claude/skills` and `.agents/skills` from both sources and rejects name collisions. Full rule in `.claude/rules/skill-ownership.md`.

Branch, PR, and guardrail rules:

- Follow `.harness/policies/guardrails.md`.
- Follow `.harness/policies/tool-permissions.md` for permission priority, MCP access, and package manager decisions.
- Do not work directly on `main` or `dev`; create a working branch first.
- AI may create PRs, but must never merge PRs.
- App repo normal flow: feature branch -> `dev` PR -> user merge -> `dev` to `main` PR -> user merge.
- In the harness repo, PRs may target version branches; choose the target based on user request or the current release branch.
- For a hotfix, skip the app repo normal flow and open a PR directly against `main`, with user merge.
- After a hotfix is merged to `main`, proceed with a `main -> dev` reverse-sync PR and remind the user that it must be merged.
- Always ask explicit approval before destructive or history-rewriting operations such as `rm -rf`, `DROP TABLE`, `git push --force`, `git reset --hard`, or production deploy/rollback. `gh pr merge` is stricter: AI must never run it, even with approval; the user merges PRs in GitHub.
- When stopping to ask the user for a decision, approval, or choice, run `./harness notify-decision "<short Korean reason>"` before asking when practical. Claude also has a Stop hook that attempts to notify automatically when the final answer is a decision question.

Harness runtime versions are managed by `mise`; the harness root pins Node.js 24 in `mise.toml`.

For target applications, preserve the app-declared runtime from app-local `mise.toml`, `.node-version`, `.nvmrc`, `package.json#engines`, or CI config. Do not upgrade Node.js 20/22 projects to Node.js 24 unless the user explicitly requests a runtime upgrade.

Prefer starting Claude Code through:

```sh
./harness claude
```

Claude Code may also run `.harness/scripts/setup/update-check.sh` from a project hook before prompts or sessions.
