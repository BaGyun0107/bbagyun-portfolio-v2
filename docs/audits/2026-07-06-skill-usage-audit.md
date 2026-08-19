# Skill Usage Audit (2026-07-06)

Measurement of actual skill invocations across all harness-using projects,
as step 1 of the surface-reduction plan. Superpowers is explicitly retained
by user decision regardless of counts.

## Method and window

- Source: Claude Code main-session transcripts, all projects under
  `~/.claude/projects` (131 session files; subagent transcripts checked
  separately — only 3 Skill calls, excluded as orchestrator-induced).
- Signals: `Skill` tool_use (158) + user-typed slash commands (~60 relevant).
- Window: 2026-06-01 ~ 2026-07-06 (about 5 weeks).
- Codex: `$gsd-*` mention counts only (weak proxy — preflight text inflates
  `$gsd-progress`/`$gsd-manager`); direction matches the Claude core loop.
- Top projects by volume: php-gnuboard5-6-26 (71), codi-rs-module (37),
  codi-hansi (15), codi-hipass-delivery (15).

## Results by family (invocations / distinct used / distinct surfaced)

| Family | Invocations | Used | Surfaced | Note |
| --- | --- | --- | --- | --- |
| GSD | ~136 | 20 | ~80 | 85% of use in 8 core-loop commands |
| Superpowers | 44 | 8 | 14 | kept by user decision |
| GStack | 8 | 5 | ~55 | zero use of its phase-map gate roles |
| codi-* (local) | ~17 | 8 | ~10 | dependency-review and rule-authoring lead |

## Detail

GSD top: plan-phase 35, execute-phase 29, discuss-phase 20, code-review 10,
secure-phase 8, validate-phase 5, audit-milestone 6, ui-phase 5,
new-milestone 4. Long tail of 11 commands used once or twice.

Superpowers: systematic-debugging 13, brainstorming 13, writing-plans 7,
subagent-driven-development 3, executing-plans 3, test-driven-development 2,
finishing-a-development-branch 2, writing-skills 1. Never invoked:
verification-before-completion, requesting/receiving-code-review,
dispatching-parallel-agents, using-git-worktrees.

GStack: browse 3, connect-chrome 2, qa-only 1, codex 1,
design-consultation 1. Never invoked: cso (P1 default gate), review (P4),
qa, ship (P5 default gate), investigate, spec, guard, freeze, health, retro,
autoplan, all four plan-*-review skills, land-and-deploy, and the rest.

## Findings

1. The GSD core loop (discuss -> plan -> execute -> code-review plus
   milestone bookkeeping) is the real workflow. 60 of ~80 surfaced GSD
   commands were never invoked in 5 weeks.
2. The phase map's GStack default gates (P1 cso, P4 review/qa, P5 ship)
   recorded zero real invocations. Design and usage have fully diverged:
   GStack is used only as a browser utility (browse/connect-chrome).
3. Superpowers usage concentrates in brainstorming and systematic-debugging,
   confirming the user's keep decision. brainstorming 13 + writing-plans 7
   running beside gsd-discuss 20 quantifies the plan-document fragmentation.
4. Caveats: 5-week window, Claude-centric; a surfaced-but-never-invoked
   skill can still shape behavior via its description in context, so
   removal candidates should be de-surfaced (reversible, e.g. gsd-surface)
   rather than uninstalled first.

## Recommended next steps

- Demote GStack from default phase-map gates to opt-in; keep browse-related
  utilities surfaced.
- Apply a GSD surface profile keeping the core loop + milestone commands
  (~15) and de-surfacing the rest.
- Keep Superpowers as is; converge its outputs into `.planning/` via the
  plan-of-record gate (separate work item).
- Re-measure after 4 weeks before any uninstall-level removal.

Raw data: scratchpad `skill-usage.json` (regenerate with the script in the
audit session if needed).

## Applied (2026-07-06, same day)

All three steps were applied in order 1 -> 3 -> 2:

1. **GStack demoted to opt-in** — phase-map defaults rewritten in
   `scenario-phase-routing.md` ("GStack Gates Are Opt-In" section) and
   mirrored in AGENTS.md, CLAUDE.md, quality-gates.md, agent-routing.md,
   and the codi-phase-routing skill. Browser utilities stay in normal use.
2. **GSD surface reduced on this machine (Claude side)** — disabled clusters
   `research_ideate`, `ns_meta`, `ai_eval` via `~/.claude/.gsd-surface.json`
   (67 -> 54 staged skills; removes sketch/spike/explore/forensics/graphify,
   all ns-*, ai-integration-phase, eval-review — note eval-review is
   cluster-deleted even though audit_review also lists it). Per-machine
   setting: run `gsd-surface disable research_ideate,ns_meta,ai_eval` (or
   the equivalent) on other machines. Revert: `gsd-surface enable <cluster>`
   or delete `.gsd-surface.json`. A `~/.claude/.gsd-source` marker was
   created pointing at the @opengsd npm package's `commands/gsd` (version-
   pinned mise path — refresh it after a Node upgrade if surface commands
   fail to resolve). Codex-side GSD skills (`~/.codex/skills/gsd-*`) are
   untouched.
3. **Plan-of-Record gate added** — "Plan of Record" section in
   `scenario-phase-routing.md` (runtime-neutral), "Plan-of-Record Gate" in
   `.claude/rules/phase-routing.md`, AGENTS.md mirror, and a non-blocking
   `guardrails.mjs` hint when new design docs are created under
   `docs/superpowers/**` / `docs/plans/**` (tests:
   `tests/plan-of-record-hint.test.mjs`). Superpowers itself is retained.

Re-measure on/after 2026-08-03 before any uninstall-level removal. The
pre-committed, agent-agnostic procedure (fixed metrics, thresholds, candidate
lists, and commands) lives in
`.planning/audits/2026-08-skill-usage-recheck-plan.md`; the reusable
measurement script is `.planning/audits/tools/skill-usage.mjs`.
