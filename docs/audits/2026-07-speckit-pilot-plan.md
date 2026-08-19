# Spec Kit Pilot Plan — decided 2026-07-06

Status: DONE — PASS 2026-07-07 (4/4 criteria same-or-better, #3 resume
better). Result doc: codi-hansi
`.planning/audits/2026-07-07-speckit-pilot-result.md`. Staged migration
started 2026-07-07 per the sections below.

User decision (2026-07-06): the harness's planning engine role is narrowed to
"concretize + document Superpowers brainstorm output so a new session can
continue the work". Superpowers stays (non-negotiable). Running two planning
stacks side-by-side is rejected. GSD full replacement by Spec Kit is the
direction IF this pilot passes; primary-source comparison lives in the
2026-07-06 session record and `.planning/audits/2026-07-06-skill-usage-audit.md`.

## Pilot design

- Scope: ONE real feature in one downstream project (pick the next Medium+
  feature that would normally get a GSD phase).
- Flow under test: Superpowers `brainstorming` -> feed the brainstorm doc to
  `/speckit.specify` -> `/speckit.clarify` -> `/speckit.plan` ->
  `/speckit.tasks` (request test tasks explicitly — see rule H1) ->
  `/speckit.analyze` -> implement guided by tasks.md under normal harness
  discipline (TDD, e2e gate, commit rules) -> `/speckit.converge` until
  "Converged".
- Baseline: the team's current GSD flow experience on comparable recent
  features (no need to run a parallel GSD arm — compare against the last two
  completed GSD phases in the same project).

## Pilot runtime isolation (no GSD removal needed)

Installing Spec Kit is ADDITIVE (`specify init --here` adds `.specify/` and
`/speckit.*` commands; no name collision with `gsd-*`). Do NOT scrub GSD for
the pilot — other work in the project stays on GSD, and the judgment
criteria need the GSD baseline. Instead, isolate per feature:

1. At pilot start, create `<downstream>/.planning/audits/<date>-speckit-pilot-run.md`
   declaring: the pilot feature name, "this feature's plan of record lives in
   `specs/NNN-*/` + `.specify/feature.json` + unchecked tasks.md items — do
   not route it through GSD", the exemption's reason (this plan) and expiry
   (pilot conclusion). This satisfies the shared-policy exception rule
   (reason/owner/expiry recorded in `.planning/`) AND exploits the existing
   session-start habit: any future session that checks `.planning/` first —
   as the rules already demand — finds the pilot pointer immediately.
2. Contamination rules: never run `gsd-*` on the pilot feature; never run
   `/speckit.*` on non-pilot work. One feature, one vocabulary.
3. Expected in-context noise (documented, do not "fix" mid-pilot): the
   Medium+ gate, Plan-of-Record gate, and guardrails hints still name GSD.
   For the pilot feature they are overridden by the pilot-run doc + the
   user's pilot instruction. Count any confusion this causes as data for
   judgment criterion #4 (user interventions) — it measures real migration
   friction.

## Pre-committed judgment criteria

Score each 1-4 vs the GSD baseline (worse / same / better / much better):

1. Spec rework: times implementation had to go back and change the spec.
2. Drift: gaps found by `/speckit.converge` at completion vs gaps found by
   GSD verify-work on baseline phases.
3. Session resume cost: turns needed for a FRESH session to correctly resume
   mid-implementation (test this deliberately once: kill the session mid-way,
   start new, count turns to productive work using feature.json + tasks.md).
4. User interventions: corrections the user had to type during the flow.

Pass rule: 3 of 4 criteria at "same" or better, with resume cost (#3) not
"worse". If pass -> staged migration below. If fail -> stay on GSD, record
why, revert nothing (pilot leaves no harness changes behind).

## Harness compensation rules (apply at migration, NOT during pilot)

- H1 tests: Spec Kit generates test tasks only on request. Harness rule must
  require "include test tasks (TDD)" in every specify/tasks invocation.
- H2 sinks: Plan-of-Record gate and session-continuity rules repoint from
  `.planning/` phases to `specs/NNN-*/` + `.specify/feature.json` + unchecked
  tasks.md items. `.planning/audits/**` stays harness-owned and alive.
- H3 overview: no cross-feature roadmap in Spec Kit. Keep a thin,
  harness-owned `ROADMAP.md` (manual) or adopt `/speckit.taskstoissues`;
  decide during migration, default = thin ROADMAP.md.
- H4 commits/verification: implement does not commit; atomic-commit and
  e2e/quality gates remain harness rules (already runtime-enforced).

## Per-project cutover checklist (after pass)

1. Finish or re-specify (remaining scope only) any in-flight GSD phase.
2. Distill still-true decisions from `.planning/PROJECT.md`, REQUIREMENTS,
   and decision records into `/speckit.constitution` — verify "no undecided
   still-valid decision left behind" before freezing.
3. Freeze `.planning/` (keep committed; do not delete). Audits continue.
4. Repoint harness rules (H2), add H1/H3/H4 rules, update AGENTS/CLAUDE
   mirrors, run rule-check/context-check/npm test.
5. De-surface GSD via gsd-surface (reversible). Uninstall only after 4+ weeks
   of clean operation.

## Interim convention (until this pilot concludes)

Spec Kit runs NOWHERE except the pilot feature. Harness-repo governance work
and downstream work keep the current pattern: Size declaration, Medium-direct
when localized/single-stream, GSD for Large/durable-state, results recorded
in `.planning/audits/**`. A chat-approved Medium design executed immediately
with self-documenting outputs does not require a separate plan doc. This is
the transition order working as intended, not a routing gap.

## Migration scrub inventory (execute at migration, pre-enumerated 2026-07-06)

Stale GSD references confuse agents (proven twice today: GStack root-doc
drift; dead e2e command). At migration, ALL GSD routing content must be
removed or rewritten — 37 files carry GSD references as of 2026-07-06:

- Root docs (5): README.md (also ADD a Spec Kit install section here),
  AGENTS.md, CLAUDE.md, CONTRIBUTING.md, ARCHITECTURE.md.
- Rules (2): .claude/rules/phase-routing.md, .codex/rules/phase-routing.rules.
- Policies (5): scenario-phase-routing.md (largest), agent-routing.md,
  update-policy.md (careful: .planning/audits convention and parts of the
  gitignore managedBlock survive), tdd.md, .harness/workflow.md.
- Skills (8): codi-phase-routing (retire or rewrite whole skill),
  codi-rule-authoring (+references/rule-test-patterns.md), karpathy-style,
  team-mode-operator (+resources/memory-protocol.md),
  _shared/runtime/execution-protocols/{claude,codex}.md,
  _shared/conditional/exploration-loop.md, _shared/core/lessons-learned.md.
- Config (3): skill-triggers.json (gsd keywords), codi-config.yaml,
  required-gitignore.json (planning managedBlock: STATE/.continue-here
  ignores become obsolete).
- Hooks/scripts (10): guardrails.mjs (planning-route warning +
  plan-of-record hint repoint to specs/), agent-preflight.sh (gsd
  checklist), install.sh (stops installing GSD runtime), update.sh,
  update-check.sh, doctor.sh, context-check.mjs, codex-replay-check.mjs
  (+fixtures), profile.mjs, write-lock.mjs.
- Tests: harness-cli.test.mjs and replay fixtures asserting $gsd-* routing.
- External (per machine): de-surface then uninstall ~/.claude/skills/gsd-*
  and ~/.codex/skills/gsd-* (uninstall only after 4+ weeks clean).
- EXEMPT (history, keep verbatim): .planning/audits/**, .claude/archive/**,
  auto-memory files.

Done criterion (mechanical): `grep -ril gsd` over the non-exempt surfaces
above returns nothing. Run rule-check, context-check, doctor, npm test after.

Spec Kit install (pilot executor, in the target downstream project).
`init` only takes ONE agent; add the second with `integration install`
(verified against the CLI 2026-07-06 — integrations coexist, `use` only
sets the default):

    uvx --from git+https://github.com/github/spec-kit.git \
      specify init --here            # pick: claude
    uvx --from git+https://github.com/github/spec-kit.git \
      specify integration install codex
    uvx --from git+https://github.com/github/spec-kit.git \
      specify integration status     # confirm both installed

## Interaction with the 2026-08 recheck plan

`2026-08-skill-usage-recheck-plan.md` rules B/C are superseded by this
migration once the pilot passes; still run the measurement for the record.
If the pilot fails, the August plan applies unchanged.

## Approval boundaries

- Autonomous: running the pilot flow in the downstream project, writing the
  result doc, updating this plan's Status.
- User decision required: declaring pass/fail (present scores + evidence),
  starting the staged migration, GSD uninstall.
