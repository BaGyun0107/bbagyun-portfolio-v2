# E2E Validation

This rule applies to every session. It is the always-in-context driver for the
harness e2e validation gate; the `guardrails.mjs` hook is only a
navigate-by-mistake assist, not the enforcement.

## When e2e is required

When a change adds or alters a **user-facing flow**, e2e is required and the
verification record must include e2e run evidence (which flows passed, the
command, the observed output).

A user-facing flow includes: a new page/route, the user flow created by a new
API endpoint, login/auth, payment/order, and end-to-end paths of core domain
CRUD. It excludes: selector/style-only changes, internal utils/refactors,
config/build, docs, and logging.

## Validation order

Run in order: **typecheck → unit → integration → e2e**. e2e does not replace
unit tests — run it after unit and integration are green. Cover **critical
flows only** — do not write a test per feature.

## Self-declare marker (same habit as the Size marker)

When your change touches a user-facing flow, declare it so the commit-time
assist can see it (chat text is invisible to hooks):

    printf 'yes\n' > .harness/state/touches-user-flow

Run e2e with `mise run e2e:changed` (default) or `mise run e2e` (full). A real
passing run stamps `.harness/state/e2e-last-run` and auto-clears the marker
back to `no` (the stamping lives inside the task bodies).

**Setup and troubleshooting live in the `codi-e2e` skill.** The root
`e2e` / `e2e:changed` tasks ship in the harness root `mise.toml` (new projects
inherit them; without per-app suites they skip gracefully and stamp nothing).
Per-app suite scaffolding, older projects missing the tasks, and
refuse-to-stamp messages are handled by `codi-e2e` (canonical task source:
`.harness/skills/codi-e2e/resources/mise-e2e-tasks.toml`). A missing task or
suite is a scaffolding signal, not permission to skip e2e.

When you drop back to non-flow work (docs, refactor, config), lower the marker
so a stale `yes` does not fire the reminder on every later commit:

    printf 'no\n' > .harness/state/touches-user-flow

`.harness/state/` is git-ignored, so both markers are per-session and local.

## The commit-time assist

At `git commit`, if `touches-user-flow` is `yes` and there is no fresh e2e
evidence (the recorded staged-tree hash does not match the commit's staged
tree), `guardrails.mjs` emits a **non-blocking** reminder. It never blocks —
there is nothing to bypass with `--no-verify`. If the marker is missing or
`no`, the hook stays silent. The reminder escalates in tone as unheeded
commits accumulate (`.harness/state/e2e-warn-count`) and resets the moment
evidence is fresh or the marker is lowered — intensity changes, blocking
never does.

This is the Claude-side mirror of the Codex e2e rule in
`.codex/rules/e2e-validation.rules` — both runtimes behave the same.
