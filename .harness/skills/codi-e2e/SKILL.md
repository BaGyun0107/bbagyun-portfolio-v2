---
name: codi-e2e
description: E2E validation setup and usage for the harness gate. Use when scaffolding mise e2e tasks into a project, installing Playwright, running e2e:changed / e2e, fixing "no task e2e found", stamp/evidence or touches-user-flow marker issues, and e2e troubleshooting.
---

# Codi E2E - Gate Setup and Usage

## Role split (do not blur it)

- The **invariant** (user-facing flow -> e2e required + marker + evidence)
  lives in `.claude/rules/e2e-validation.md` and
  `.harness/policies/quality-gates.md`. This skill never overrides it.
- This skill owns the **procedure**: getting the tasks installed and run
  correctly in a downstream project.

## Canonical task source

`resources/mise-e2e-tasks.toml` in this skill is the canonical body of the
two root-level tasks (`e2e`, `e2e:changed`). New projects get them from
`./harness init-project` automatically. For an existing project where
`mise run e2e:changed` reports "no task found":

1. Append `resources/mise-e2e-tasks.toml` verbatim to the project's root
   `mise.toml` (it is project-owned — never overwritten by harness updates).
2. Do NOT edit the stamp/guard logic inside the tasks. The refuse-to-stamp
   guards (unstaged/untracked tree, uncovered changed app) are what keep the
   commit-time evidence honest.

## Per-app suite scaffolding (judgment required)

The root tasks delegate to per-app tasks `//apps/front:e2e` and
`//apps/back:e2e`. If a changed app has no suite, `e2e:changed` refuses to
stamp — that is the signal to scaffold:

- `apps/front` (Next.js/React): `pnpm|npm create playwright@latest` inside
  the app; expose it as `[tasks.e2e]` in the app-level `mise.toml`
  (`run = "pnpm exec playwright test"` or the npm equivalent — follow the
  package-manager table in `.claude/rules/monorepo-packages.md`).
- `apps/back` (API): prefer supertest-based integration-style e2e exposed the
  same way; Playwright API testing also works.
- Cover **critical flows only** (login/auth, payment/order, core CRUD paths)
  — never one test per feature.

## Running and evidence mechanics

- Default: `mise run e2e:changed` (index-scoped — only staged app changes).
  Full: `mise run e2e`.
- A real pass stamps `.harness/state/e2e-last-run` (staged-tree hash) and
  auto-lowers `touches-user-flow` to `no`. A graceful skip stamps nothing on
  purpose.
- Run it AFTER `git add` of everything you tested: the stamp is the staged
  tree, so unstaged/untracked files make the task refuse to stamp.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `no task e2e:changed found` | Root tasks not scaffolded — step 1 above |
| "refusing to stamp (test tree != staged tree)" | Unstaged or untracked files; `git add -A` what you tested, re-run |
| "changed app(s) without an e2e suite" | Scaffold the per-app suite, or lower the marker if the change is genuinely not user-facing |
| Reminder keeps firing at commit | Evidence hash != staged tree (you changed code after the run) — re-run e2e; escalation resets on a fresh stamp |
| Suite exists but task skipped | Per-app task name must match `//apps/<app>:e2e` exactly (`mise tasks ls`) |

## Pointers

- Pipeline rationale and full mise.toml example:
  `.harness/skills/codi-dev-workflow/resources/validation-pipeline.md`
  (its e2e code block mirrors this skill's canonical resource — keep in sync).
- Commit-time assist internals: `maybeWarnE2eGate` in
  `.harness/hooks/guardrails.mjs`.
