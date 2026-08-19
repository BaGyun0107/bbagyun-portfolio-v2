---
description: Node.js monorepo developer workflow standards - mise tasks, stack package managers, git hooks, CI/CD, release automation
globs:
alwaysApply: false
---

# Developer Workflow Standards

## Runtime

- The harness default pins Node.js 24 in root `mise.toml`
- Existing app-local projects may pin Node.js 20, 22, or 24; preserve that runtime unless a runtime upgrade is explicitly requested
- Harness root uses npm
- App package managers are stack-specific: React-only and Express use npm; Next.js and NestJS use pnpm
- yarn and bun are not used
- Prefer `mise run <task>` over direct package scripts
- When no mise task exists, use `mise exec -- npm ...` or `mise exec -- pnpm ...` according to the target stack

## Core Rules

1. Use `mise run` tasks instead of direct package manager commands when a task exists
2. Run `mise install` after pulling changes that update runtime versions
3. Use parallel tasks for independent operations
4. Run lint/test only on apps with changed files
5. Validate commit messages with commitlint before committing
6. Configure CI to skip unchanged apps for faster builds
7. Check `mise tasks --all` to discover available tasks before running
8. Pin runtime versions in mise.toml for consistency
9. Never use direct package manager commands when mise tasks exist
10. Never modify mise.toml without understanding task dependencies
11. Never hardcode secrets in mise.toml files
12. Never skip reading task definitions before running unfamiliar tasks
