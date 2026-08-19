# Verification: Unify Spec Kit Naming and Entry-Point Structure

**Date**: 2026-07-29 | **Branch**: `feature/013-unify-naming-entrypoints`
**Loop rounds**: 2 (round 2 = code-review findings fixed; see Review round)

## Checklist

- [x] SC-001 live-surface sweep clean (quickstart §1)
- [x] SC-002 bare `@AGENTS.md` import present (structural; manual `/context` deferred)
- [x] SC-003 check pipeline green (npm test, context-check, rule-check, doctor)
- [x] SC-004 AGENTS.md not weakened (diff review)
- [x] SC-005 entry-point line budgets met
- [x] FR-002 historical records untouched
- [x] T016 manual `/context` confirmation (user-assisted, 2026-07-29):
  the Memory Files table lists `AGENTS.md` as its own loaded entry (5.1k
  tokens) alongside the new `CLAUDE.md` (617 tokens) — the `@AGENTS.md`
  import is live. SC-002 fully confirmed.

## TDD evidence

- T002 RED: `./harness context-check` -> `fail: CLAUDE.md must contain a
  bare @AGENTS.md import line` (1 failure) before the CLAUDE.md rewrite.
- T007 RED: new sweep test failed with 23 offending live files before the
  rename; GREEN after (`npm test` 638/638).

## Quickstart results (SC-001..SC-005)

- §1 sweep: grep over live surfaces returned no matches (exit 1). SC-001 PASS.
- §2 import: `grep -n "^@AGENTS.md$" CLAUDE.md` -> line 1; AGENTS.md
  contains hyphenated names (2 `speckit-specify` hits). SC-002 structural
  PASS (manual `/context` check deferred — see T016).
- §3 checks: `npm test` 638/638 pass, `./harness context-check` 0 failures
  0 warnings, `./harness rule-check` ok, `./harness doctor` (see T015).
  SC-003 PASS.
- §4 AGENTS.md diff vs v2: 4 insertions / 3 deletions; deletions are
  naming-only (dotted -> hyphen), insertion is the e2e-gate bullet absorbed
  from old CLAUDE.md (FR-005 case found by rule-check). No rule removed or
  weakened. SC-004 PASS.
- §5 historical records: `git diff v2 --stat` over docs/audits and completed
  specs 002/008 is empty. FR-002 PASS.
- Line budgets: AGENTS.md 190 lines (<=200), CLAUDE.md 68 -> 32 lines.
  SC-005 PASS.

## Verification chain

- typecheck: N/A (no typed sources changed).
- unit/integration: `npm test` 638/638 (includes the new sweep regression
  test and renamed replay fixtures).
- e2e: N/A — no user-facing flow touched (docs/checks/entry points only);
  `touches-user-flow` marker stays `no`.

## Review round (loop round 2)

`superpowers:requesting-code-review` subagent on `v2..0dd6bad` returned:
Critical 1, Important 2, Minor 3 — all accepted and fixed:

- **Critical**: creating `specs/013/` broke the feature-hub catalog parity
  test (`13 !== 12`) — the earlier "638/638" was recorded before
  `status.yaml` landed, so the final state was actually 637/1. Fixed by
  registering 013 in `data/feature-definitions.json` +
  `data/feature-relations.json` (need `NEED-ONE-RULE-BODY`, 6 links) per the
  spec-012 precedent, and updating the count assertions in
  `tests/feature-hub-canonical-data.test.mjs` (13 features, 103 links).
  A `verified-by` link also required this file to carry a checklist section
  (scan-specs counts checkboxes) — added above.
- **Important**: `docs/index.html` regenerated via `mise run docs:build`
  after the catalog change; `planning:check` reports manifest/evidence/sync
  all consistent. T014/T015 checkbox state reconciled with this record.
- **Minor**: sweep test hardened — recursive walk over all `.md` under
  `.harness/skills` (catches `resources/`, `variants/`, `_shared/`),
  `checklist|taskstoissues` added to the pattern, stale-list comment added.

Final state after fixes: `npm test` **638/638 pass**, `context-check` 0,
`rule-check` ok, `doctor` 0 failures (1 environment-only warning: duplicate
claude binaries on PATH), `planning:check` consistent.

## Notes

- `codex-replay-check` invocation detector now accepts both `speckit-` and
  legacy `speckit.` forms so replays of pre-rename transcripts still count
  Spec Kit evidence.
- T016 (manual `/context` confirmation in a fresh Claude session) deferred
  to the user at review time; structural guard is the context-check
  assertion.
