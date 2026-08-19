---
name: codi-auto-loop
description: Automated feature loop after clarify. Runs speckit-plan through tasks/analyze, pauses once for the mandatory tasks.md review gate, then loops implement -> verify -> review -> converge until done. Use when the user asks for the auto loop ("자동 루프", "루프 시작", "run the loop") on a clarified spec.
---

# Codi Auto Loop

Run the tail of the feature pipeline as one supervised automation. The
interactive part of the flow (brainstorming, `speckit-specify`,
`speckit-clarify`) stays a human conversation; this skill owns everything
after it, with exactly one built-in pause.

## Preconditions

- `specs/<NNN-feature>/spec.md` exists and clarify answers are already encoded
  in it (the clarify human gate happened in conversation).
- The user explicitly asked to start the loop. The loop is opt-in; it is not a
  default phase step.
- Declare the Size (Medium or larger) and record the
  `.harness/state/current-size` marker per the phase-routing rules.
- Check for other in-flight features first (unchecked `specs/*/tasks.md`
  items) and resume or defer them per `scenario-phase-routing.md`.

## Stage A - Planning (automatic)

Run in order without pausing between steps:

1. `speckit-plan`
2. `speckit-tasks` - always append "include test tasks (TDD)" to the request;
   Spec Kit generates test tasks only when asked.
3. `speckit-analyze`

## Stage B - tasks.md review gate (mandatory, never skipped)

Present a summary of `tasks.md` plus the analyze findings, then stop and wait
for user approval. This is the "reviewing tasks.md before implementation
starts" human gate from `scenario-phase-routing.md`; the loop never skips it
and never answers clarify questions itself. Stopping here follows the
`./harness notify-decision` rule.

## Stage C - Implementation loop (automatic)

Repeat until the exit criteria or a stop condition is met:

1. `speckit-implement` - task traversal, ordering, and `[X]` marking belong to
   Spec Kit. The actual work inside each task follows Superpowers discipline:
   `superpowers:test-driven-development` while coding and
   `superpowers:verification-before-completion` before marking a task done.
   The implement step never commits; atomic commits and quality/e2e gates are
   harness rules.
2. Verification chain, in order: typecheck -> unit -> integration -> e2e
   (`mise run e2e:changed` by default). Follow the e2e marker and evidence
   rules (`touches-user-flow`, quality-gates policy).
3. `superpowers:requesting-code-review` - dispatch the reviewer subagent and
   act on findings per `superpowers:receiving-code-review`.
4. When a failure or finding requires document changes, update `spec.md` /
   `plan.md` first, run `speckit-converge` so remaining work lands in
   `tasks.md` as tasks, then continue the loop from step 1.

## Exit (success)

All of: every `tasks.md` item is `[X]`, `speckit-converge` reports
"Converged", the verification chain is green, and the review has no Critical
or Important findings left. Then:

- Record the evidence (commands, key output, review outcome, loop rounds) in
  `specs/<NNN-feature>/verification.md`.
- Run `mise run feature:status:sync` when `specs/` or Planning Hub sources
  changed.
- Reset the Size marker (`printf 'Small\n' > .harness/state/current-size`)
  and report completion with the evidence summary.

## Stop conditions (return to the user)

Stop the loop and return control (following `./harness notify-decision`) when:

- The same failure survives three loop rounds.
- A fix would change the spec's requirements themselves (a design change, not
  a bug fix).
- Any Spec Kit or Superpowers skill raises its own user-confirmation gate -
  honor the gate; do not answer it on the user's behalf.
- An operation needs explicit approval under the work-safety guardrails.

## Upgrade resilience

This skill references external skills by name only and owns just the
contract: stage order, the tasks.md review gate, exit criteria, and stop
conditions. Do not restate or depend on the internal steps of Spec Kit or
Superpowers skills - defer mechanics to each skill's current version, so
vendor and plugin upgrades flow through without editing this file. Subagent
dispatch is owned by the Superpowers review skills and adapts per runtime; on
Codex, reviewer subagents need `multi_agent = true` in the Codex config -
when unavailable, follow the Superpowers Codex guidance instead of skipping
review.
