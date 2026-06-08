---
name: codi-dependency-review
description: Use when reviewing npm audit, OSV, Renovate, dependency update PRs, lockfile-only changes, package.json version bump decisions, vulnerability fixes, or dependency security updates.
---

# Codi Dependency Review

Use this skill to decide how to handle dependency updates after reading Actions
logs, OSV output, npm audit output, Renovate PRs, and the
`dependency-impact-report.js` PR comment.

This skill owns the agent judgment. `.harness/scripts/audit/dependency-impact-report.js`
stays a factual PR comment generator and does not decide whether code, lockfiles,
or manifests should change.

## Workflow

1. Identify the cause: npm audit, OSV gate, Renovate update, manual dependency
   request, or lockfile drift.
2. Classify each package as direct or transitive by checking `package.json`,
   lockfiles, and the reported dependency path.
3. Classify impact as runtime, dev/toolchain, framework/platform, auth, DB, or
   payment.
4. Search source usage before touching runtime dependencies:
   `rg "from ['\"]<pkg>|require\\(['\"]<pkg>|<pkg>"`.
5. Choose the update shape using the decision table below.
6. Run focused verification first, then broader install/typecheck/build/test or
   smoke checks based on impact.
7. Write the PR/update summary in Korean with cause, direct/transitive status,
   changed files, verification, and residual risk.

## Decision Table

| Situation | Default decision |
| --- | --- |
| Direct dependency security fix | Update `package.json` to the safe minimum version and refresh the lockfile. |
| Transitive dependency fix | Prefer lockfile-only refresh. Change `package.json` only when the parent package must move. |
| Runtime dependency change | Search imports/usages, review affected execution paths, and run smoke/build/typecheck verification. |
| DevDependency or toolchain change | Verify install plus CI/build/test/lint behavior touched by that tool. |
| Major update or known breaking package | Do not auto-decide. Read changelog/release notes and review source impact first. |
| Framework/auth/DB/payment package | Require manual source impact review even for minor updates. |
| `npm audit fix --force` downgrade, placeholder, or breaking change | Do not apply. Split into a deliberate migration or separate PR. |

Known breaking/manual-review families include React, Next.js, NestJS, Express,
ORM/DB libraries, auth libraries, payment SDKs, build systems, and test runners.

## Verification Selection

- Lockfile-only transitive update: install verification plus the package
  manager's lockfile consistency check.
- Runtime package update: install, typecheck, build if available, focused tests,
  and one smoke check for the importing app path.
- Toolchain update: install and the relevant CI scripts, usually typecheck,
  build, test, or lint depending on what the tool owns.
- Framework/auth/DB/payment/major update: changelog review, source usage review,
  focused tests, broader regression checks, and human final review.

Prefer harness/mise tasks when they exist. React-only and Express projects use
`mise exec -- npm ...`; Next.js and NestJS projects use `mise exec -- pnpm ...`.

## Escalation

- Use `gstack`/`cso` when OSV, npm audit, or security severity determines merge
  risk.
- Use `gstack`/`review` when the update changes source, framework behavior,
  auth, DB, payment, or release-critical tooling.
- Use Superpowers `systematic-debugging` when a security or CI failure root
  cause is unclear.
- Use Superpowers `test-driven-development` when the dependency update requires
  source changes.

## PR Summary Checklist

- Cause: audit/OSV/Renovate/manual and vulnerability IDs when present.
- Update shape: `package.json + lockfile`, lockfile-only, or separate migration.
- Direct/transitive classification and source usage result.
- Commands run and exit status.
- Residual risk and manual-review items.
