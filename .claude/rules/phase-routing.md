# Phase Routing

Use Spec Kit for feature planning and durable state, Superpowers for
execution discipline, and Playwright MCP for ad-hoc browser QA.

Before new Medium or larger work, check for in-flight features: any
`specs/<NNN-*>/tasks.md` with unchecked items gets resumed first (unchecked
tasks + `.specify/` state are the checkpoint).

Stages run P1 Strategy, P2 Specify and plan, P3 Execution, P4 Review and
verification, and P5 Ship and completion, each routed to the smallest useful
Spec Kit and Superpowers set. Size runs Small, Medium, Large, and
Extra large or risky, where size is a routing decision, not a time or
file-count estimate.

The full stage map, scenario defaults, and size criteria live only in
`.harness/policies/scenario-phase-routing.md`. Use it as the source of truth.

When work touches `specs/` or Planning Hub sources, finish by running the shared
planning/status checks required by the active feature tasks. Stop automation is
non-blocking convenience; it never replaces explicit verification or advances a
Planning Lock.

Keep durable feature state in committed `specs/<NNN-feature>/` output;
cross-feature overview lives in the thin root `ROADMAP.md`. Audit records
live in `docs/audits/` (harness-owned, active); a leftover legacy
`.planning/` directory is scheduled for removal per
`docs/audits/2026-07-07-planning-retirement.md` — never read or update it
for routing.

## Plan-of-Record Gate (the destination is `specs/`)

Which skill you explore with is free; where the plan lands is not. For
Medium+ work, the plan of record must exist as a `specs/<NNN-feature>/`
directory (Spec Kit flow: `speckit-specify` -> `clarify` -> `plan` ->
`tasks`) **before the first implementation-code edit**.

- Superpowers `brainstorming` / `writing-plans` outputs (`docs/superpowers/**`,
  `docs/plans/**`) are exploration input, never the plan of record. Feed
  them to `speckit-specify` before implementing.
- Always request test tasks explicitly in specify/tasks invocations
  ("include test tasks (TDD)") — Spec Kit generates them only on request.
- Do not leave a plan only in chat or only as a claude.ai Artifact — hooks
  cannot see Artifacts and the next session cannot resume from them. Store
  the plan in the repo.
- Rule of thumb: if the work deserves a plan document, that document is a
  spec directory. Small work needs no plan document at all.
- Assist: `guardrails.mjs` emits a non-blocking hint when a new design doc is
  created under the Superpowers doc paths, and the Medium+ marker warning
  below still applies. Neither blocks — the rule, not the hook, is the
  control. Canonical statement: "Plan of Record" in
  `.harness/policies/scenario-phase-routing.md`.

## Medium+ Hard Gate (declare Size before implementing)

This rule is always loaded, so it applies even when no skill keyword matched the
prompt. It is the Claude-side mirror of the Codex Medium+ Hard Gate in
`.harness/policies/scenario-phase-routing.md` — both runtimes behave the same.

- **Small work is NOT gated.** If the direction is fixed, the target is obvious,
  the edit is localized, reversible, and directly verifiable, just do it — no
  Size declaration, no routing ceremony. This preserves the existing "Small,
  obvious edits can be handled directly" behavior. Do not block small tasks.
- **For work that is not clearly Small (Medium+)**, state the Size in the turn
  before writing implementation code: `Size: <Medium|Large|Extra large>,
  because <one-line reason>`. Use the Size Self-Check in the `codi-phase-routing`
  skill, or the criteria in `scenario-phase-routing.md`.
- **When you declare Medium+, also record the Size marker** so the warning hook
  can see your declaration (chat text is invisible to hooks). In the same turn,
  write the single word to the local-only marker file:

  ```sh
  printf 'Medium\n' > .harness/state/current-size   # or Large / Extra-large
  ```

  `.harness/state/` is git-ignored, so the marker is per-session and local-only.
  When the Medium+ task is finished (or you drop back to Small work), clear it:
  `printf 'Small\n' > .harness/state/current-size`. A missing or `Small` marker
  means "no active Medium+ declaration" and the hook stays silent.
- **Medium**: declare the Size, then route to the smallest useful tool set.
  Direct execution is allowed only for localized, single-stream work that does
  not need durable state.
- **Large or larger**: route through the Spec Kit planning stages
  (specify -> clarify -> plan -> tasks -> analyze) before code. App
  scaffolds, split frontend/backend work, scaffold/import work, multi-stage
  implementation, and session-continuity work are Large/spec cases; absence
  of `specs/` is not a no-spec reason for those cases.
- If a task that looked Small exposes a decision point, stop, re-declare a
  larger Size, and route accordingly.

This gate is advisory (soft): it is **not enforced by a blocking hook**. It
works by being in context every session, independent of keyword matching.

There is one **non-blocking** assist: when the Size marker says Medium+ and you
try to write a design-style `.md` outside `specs/` while `specs/` holds no
feature output, `.harness/hooks/guardrails.mjs` emits a warning (not a block) —
"this looks Medium+; did you route through `specs/`?". It never stops the
write, so it cannot be worked around with `--no-verify` and creates no bypass
habit. If the marker is missing or `Small`, the hook stays silent and Small work
is never gated. The marker is a hint you record, not a lock — the hook only
reflects what you already declared.
