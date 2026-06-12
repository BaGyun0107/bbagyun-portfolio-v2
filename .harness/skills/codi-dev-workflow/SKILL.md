---
name: codi-dev-workflow
description: Node.js monorepo developer workflow specialist. Use for mise tasks, git hooks, CI/CD pipelines, build automation, testing workflows, database migrations, and release coordination.
---

# Dev Workflow - Monorepo Task Automation Specialist

## Scheduling

### Goal
Set up, run, optimize, and troubleshoot reproducible Node.js + npm development workflows in monorepos using the target project's runtime, `mise`, task automation, validation pipelines, CI/CD, migrations, i18n builds, and release coordination.

### Intent signature
- User asks about dev servers, mise tasks, lint/format/typecheck/test/build, git hooks, CI/CD, migrations, generated clients, i18n builds, or release automation.
- User needs workflow execution or developer environment setup rather than product feature implementation.

### When to use

- Running development servers for monorepo with multiple applications
- Executing lint, format, typecheck across multiple apps in parallel
- Managing database migrations and schema changes
- Generating API clients or code from schemas
- Building internationalization (i18n) files
- Executing production builds and deployment preparation
- Running parallel tasks in monorepo context
- Setting up pre-commit validation workflows
- Troubleshooting mise task failures or configuration issues
- Optimizing CI/CD pipelines with mise

### When NOT to use

- Database schema design or query tuning -> use DB Agent
- Backend API implementation -> use Backend Agent
- Frontend UI implementation -> use Frontend Agent
- Mobile development -> use Mobile Agent

### Expected inputs
- Requested workflow operation, affected apps/packages, and current monorepo structure
- `mise.toml`, task definitions, CI files, migration/i18n/build configs, and failure logs when relevant
- Desired validation, setup, or release outcome

### Expected outputs
- Executed or documented mise task workflow
- Updated workflow config, CI/CD pipeline, hooks, env template, or release guidance when requested
- Status report with commands, outputs, failures, and next actions

### Dependencies
- `mise`, project task definitions, app-specific Node.js runtime versions, and npm scripts behind mise tasks
- Resource guides for validation, database patterns, API workflows, i18n, release coordination, and troubleshooting

### Control-flow features
- Branches by affected apps, task dependency graph, port availability, task failure, and CI/release context
- Calls local process commands; may write workflow/config files
- Must avoid destructive tasks and secrets in workflow configs

## Structural Flow

### Entry
1. Identify affected apps/packages and requested workflow outcome.
2. Read `mise.toml`, `package.json`, lock files, and available tasks.
3. Determine whether tasks can run in parallel or must be sequential.

### Scenes
1. **PREPARE**: Analyze requirements, task graph, runtime prerequisites, and ports.
2. **ACQUIRE**: Inspect mise config, task definitions, CI hooks, env patterns, and logs.
3. **ACT**: Run or modify mise tasks, workflow configs, or validation pipelines.
4. **VERIFY**: Check exit codes, generated artifacts, logs, and CI compatibility.
5. **FINALIZE**: Report command status, duration, failures, and next steps.

### Transitions
- If runtime versions changed, run `mise install`.
- If changed-file tasks exist, prefer changed-scope validation.
- If port is occupied, resolve or select another port before starting dev server.
- If a task is unfamiliar, read its definition before running.

### Failure and recovery
- If task is missing, run `mise tasks --all`.
- If runtime is missing, run or recommend `mise install`.
- If task hangs, check for prompts or long-running dev-server behavior.
- If destructive task is requested, require confirmation.

### Exit
- Success: workflow runs or config changes are verified.
- Partial success: task failures, missing runtime, or CI/environment blockers are explicit.

## Logical Operations

### Actions
| Action | SSL primitive | Evidence |
|--------|---------------|----------|
| Read task definitions | `READ` | `mise.toml`, CI config |
| Select task strategy | `SELECT` | Parallel/sequential/changed-scope |
| Run workflow commands | `CALL_TOOL` | `mise run`, `mise install`, `mise tasks` |
| Write workflow config | `WRITE` | Hooks, CI, env templates |
| Validate outputs | `VALIDATE` | Exit codes, logs, artifacts |
| Report status | `NOTIFY` | Final workflow summary |

### Tools and instruments
- `mise`, shell, CI/CD tooling, npm scripts behind mise
- Resource guides for validation, database, API, i18n, release, and troubleshooting

### Canonical command path
```bash
mise tasks --all
mise install
mise run lint
mise run test
```

For app-specific tasks:
```bash
mise run //{path}:{task}
```

### Resource scope
| Scope | Resource target |
|-------|-----------------|
| `CODEBASE` | `mise.toml`, CI configs, scripts, generated clients |
| `LOCAL_FS` | Env templates, build outputs, logs |
| `PROCESS` | mise, build, test, lint, dev-server commands |
| `CREDENTIALS` | Secrets must not be hardcoded in workflow configs |

### Preconditions
- Target workflow and affected project area are identifiable.
- Task definitions can be discovered or missing-task state is reported.

### Effects and side effects
- May start dev servers, run tests/builds, generate clients, run migrations, or edit workflow configs.
- May consume CPU/time or occupy ports.

### Guardrails

mise/패키지 매니저/CI 공통 규칙은 `../../imported-rules/dev-workflow.md`의 12 Core Rules를 따른다. 아래는 그 규칙에 없는 SKILL 전용 운영 규칙이다.

1. Run pre-commit validation pipeline for staged files only
2. Verify task output and exit codes for CI/CD integration
3. Document task dependencies in mise.toml comments
4. Use consistent task naming conventions across apps
5. Enable mise in CI/CD pipelines for reproducible builds
6. Test tasks locally before committing CI/CD changes
7. Never skip `mise install` after toolchain version updates
8. Never run dev servers without checking port availability first
9. Never commit without running validation on affected apps
10. Never ignore task failures - always investigate root cause
11. Never assume task availability - always verify with `mise tasks`
12. Never run destructive tasks (clean, reset) without confirmation

### Technical Guidelines

### Runtime Standard

```toml
[tools]
node = "24"

[env]
npm_config_engine_strict = "true"
```

This is the harness/new-project default. Existing projects may intentionally use Node.js 20 or 22. In that case, preserve the app-local runtime from `mise.toml`, `.node-version`, `.nvmrc`, `package.json#engines`, or CI config unless the user explicitly requests a runtime upgrade.

Use package scripts through mise tasks. Prefer:

```bash
mise run typecheck
mise run test
mise run lint
```

Only use direct package manager commands when no mise task exists. React-only and Express use `mise exec -- npm ...`; Next.js and NestJS use `mise exec -- pnpm ...`. Do not use yarn or bun.

### Prerequisites

mise 설치 절차와 모노레포 디렉터리 구조 예시는 `resources/setup-examples.md` 참고.

### Task Syntax

**Root-level tasks:**
```bash
mise run lint        # Lint all apps (parallel)
mise run test        # Test all apps (parallel)
mise run dev         # Start all dev servers
mise run build       # Production builds
```

**App-specific tasks:**
```bash
# Syntax: mise run //{path}:{task}
mise run //apps/api:dev
mise run //apps/api:test
mise run //apps/web:build
```

### Common Task Patterns

| Task Type | Purpose | Example |
|-----------|---------|---------|
| `dev` | Start development server | `mise run //apps/api:dev` |
| `build` | Production build | `mise run //apps/web:build` |
| `test` | Run test suite | `mise run //apps/api:test` |
| `lint` | Run linter | `mise run lint` |
| `format` | Format code | `mise run format` |
| `typecheck` | Type checking | `mise run typecheck` |
| `migrate` | Database migrations | `mise run //apps/api:migrate` |

### Reference Guide

| Topic | Resource File | When to Load |
|-------|---------------|--------------|
| Validation Pipeline | `resources/validation-pipeline.md` | Git hooks, CI/CD, change-based testing |
| Database & Infrastructure | `resources/database-patterns.md` | Migrations, local Docker infra |
| API Generation | `resources/api-workflows.md` | Generating API clients |
| i18n Patterns | `resources/i18n-patterns.md` | Internationalization |
| Release Coordination | `resources/release-coordination.md` | Versioning, changelog, releases |
| Troubleshooting | `resources/troubleshooting.md` | Debugging issues |

### Task Dependencies

Define dependencies in `mise.toml`:

```toml
[tasks.build]
depends = ["lint", "test"]
run = "echo 'Building after lint and test pass'"

[tasks.dev]
depends = ["//apps/api:dev", "//apps/web:dev"]
```

### Parallel vs Sequential Execution

병렬/순차 실행 bash 예시와 모노레포 환경 변수 예시는 `resources/setup-examples.md` 참고.

### Output Templates

When setting up development environment:
1. Runtime installation verification (`mise list`)
2. Dependency installation commands per app
3. Environment variable template (.env.example)
4. Development server startup commands
5. Common task quick reference

When running tasks:
1. Command executed with full path
2. Expected output summary
3. Duration and success/failure status
4. Next recommended actions

When troubleshooting:
1. Diagnostic commands (`mise config`, `mise doctor`)
2. Common issue solutions
3. Port/process conflict resolution
4. Cleanup commands if needed

### Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| Task not found | Run `mise tasks --all` to list available tasks |
| Runtime not found | Run `mise install` to install missing runtime |
| Task hangs | Check for interactive prompts, use `--yes` if available |
| Port already in use | Find process: `lsof -ti:PORT` then kill |
| Permission denied | Check file permissions, try with proper user |
| Missing dependencies | Run `mise run install` or app-specific install |

### How to Execute

Follow the core workflow step by step:
1. **Analyze Task Requirements** - Identify which apps are affected and task dependencies
2. **Check mise Configuration** - Verify mise.toml structure and available tasks
3. **Determine Execution Strategy** - Decide between parallel vs sequential task execution
4. **Run Prerequisites** - Install runtimes, dependencies if needed
5. **Execute Tasks** - Run mise tasks with proper error handling
6. **Verify Results** - Check output, logs, and generated artifacts
7. **Report Status** - Summarize success/failure with actionable next steps

### Execution Protocol (CLI Mode)

Source files live under `../_shared/runtime/execution-protocols/` (claude.md, codex.md).

## References

- Clarification: `../_shared/core/clarification-protocol.md`
- Difficulty assessment: `../_shared/core/difficulty-guide.md`
