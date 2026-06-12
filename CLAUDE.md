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

전체 단계/작업 규모 라우팅은 `.claude/rules/phase-routing.md`(자동 로드)와 정식 정의인 `.harness/policies/scenario-phase-routing.md`를 참고한다.

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

Before app work, read `.harness/config/project-profile.yaml`. Project-specific team rules belong in committed app-local files such as `apps/*/AGENTS.md` or `apps/*/CLAUDE.md`; personal preferences belong in local override files such as `CLAUDE.local.md` and are not source of truth.

Shared rule pointers (full rule bodies live in `AGENTS.md`):

- GSD and context budget rules: the "GSD and Context Budget" section of `AGENTS.md` plus `.harness/policies/agent-routing.md`.
- Language and environment rules: the "Language and Environment" section of `AGENTS.md`. Tool and MCP permission priority is defined in `.harness/policies/tool-permissions.md`.
- Branch, PR, and guardrail rules: the "Branch, PR, and Guardrails" section of `AGENTS.md` plus `.harness/policies/guardrails.md`. The app repo normal flow is feature branch -> `dev` PR -> `dev` to `main` PR, with user merges; the harness repo itself uses version branches.
- Monorepo package rules: `.claude/rules/monorepo-packages.md` (auto-loaded).
- Skill ownership: `.claude/rules/skill-ownership.md` (auto-loaded).
- Work safety: `.claude/rules/work-safety.md` (auto-loaded).
- Runtime versions: `mise` rules in the "Update Checks" section of `AGENTS.md`.

When stopping to ask the user for a decision, approval, or choice, follow the `./harness notify-decision` rule in `AGENTS.md`; Claude also has a Stop hook that attempts to notify automatically when the final answer is a decision question.

Prefer starting Claude Code through:

```sh
./harness claude
```

Claude Code may also run `.harness/scripts/setup/update-check.sh` from a project hook before prompts or sessions.
