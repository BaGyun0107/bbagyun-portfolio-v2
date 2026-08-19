# Skill Usage Recheck (2026-08-06)

Executed per the pre-committed plan in
`docs/audits/2026-08-skill-usage-recheck-plan.md`. All metrics, thresholds,
and commands come from that plan; nothing was re-derived.

## Window

- `--since 2026-07-07 --until 2026-08-06`, main-session files: 461.
- Command: `node docs/audits/tools/skill-usage.mjs --since 2026-07-07
  --until 2026-08-06 --out /tmp/skill-usage-window2.json`.
- Ignore list applied per plan (CLI built-ins such as clear, compact,
  model). `loop` is not on the plan's ignore list but is a CLI recurring
  runner, not a harness skill; it is annotated in the raw list and excluded
  from every A-C metric.

## Raw top-20

    115 clear                    (ignored: CLI built-in)
     66 speckit-specify
     58 speckit-tasks
     55 loop                     (CLI recurring-runner, not a harness skill)
     55 speckit-plan
     47 model                    (ignored: CLI built-in)
     35 brainstorming
     35 speckit-implement
     29 speckit-analyze
     18 speckit-clarify
     14 codi-dependency-review
      9 compact                  (ignored: CLI built-in)
      7 gsd-plan-phase           (legacy engine residue, last 2026-07-08)
      6 browse                   (GStack utility, exempt)
      6 codi-auto-loop
      6 systematic-debugging
      5 codi-feature-hub
      5 test-driven-development
      4 code-review              (CLI built-in review command)
      4 codi-frontend

Full output saved at `/tmp/skill-usage-window2.json` (local machine only).
All `gsd-*` entries date to 2026-07-07/08 (migration tail); none after.

## Decision A-C outcomes

### A. GStack gates — KEEP opt-in (>=1 gate invocation)

Non-exempt GStack invocations in the window: 2 — `design-review` 1
(last 2026-07-17) and `investigate` 1 (last 2026-07-07). Utility usage
(`browse` 6) is exempt and does not count. Per plan rule A, opt-in status
is kept, no action taken.

### B. Superpowers — record only (retained by user decision)

Total 59: brainstorming 35, systematic-debugging 6,
test-driven-development 5, writing-plans 4, requesting-code-review 3,
executing-plans 2, subagent-driven-development 1, receiving-code-review 1,
finishing-a-development-branch 1, using-superpowers 1. Up from 44 in the
previous window; brainstorming remains the dominant entry point.

### C. Spec Kit adoption — adoption confirmed

1. `speckit-*` invocations: **264** (specify 66, tasks 58, plan 55,
   implement 35, analyze 29, clarify 18, constitution 2, converge 1).
2. Fragmentation check: the fixed grep returned 76 session files across 9
   project roots (codi-harness-v2, php-gnuboard5-6-32, belleforet-front,
   codi-hansi, php-gnuboard5-6-26, codi-rs-module, codi-gtn, php-hecto,
   codi-STICKY-v1). Every one of the 9 projects shows an in-window
   `speckit-*` invocation and/or a Write under `specs/` (php-hecto:
   specs Write only). Fragmentation does NOT persist; no strengthening
   proposal needed.
3. ROADMAP.md presence for projects with a `specs/` directory (record
   only): yes — codi-gtn, codi-harness-v2, codi-hipasshub-admin,
   codi-liveview, codi-planning-hub, codi-rs-module. no — belleforet_front,
   codi-crew, codi-hansi, codi-hipass, codi-liveview-admin, codi-STICKY-v1.

## Actions taken

- Ran the fixed measurement and fragmentation/ROADMAP checks.
- Wrote this result doc and flipped the plan Status to DONE with a link.
- No uninstalls, no hook/policy changes (none were triggered by the rules).

## Deferred to user

- Nothing requires a decision under rules A-C this window: gates saw use
  (rule A keep), Superpowers is record-only, Spec Kit adoption took.
- Optional follow-up (informational, not a plan rule): 6 specs/-holding
  projects lack a root ROADMAP.md — doctor already surfaces this per
  project; no harness-side action proposed.
