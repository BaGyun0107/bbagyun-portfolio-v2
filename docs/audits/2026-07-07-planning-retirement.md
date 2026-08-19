# .planning Retirement Decision — 2026-07-07

Status: ACTIVE (per-project removal in progress)
Decided by: user (ai@co-di.com), 2026-07-07 session

## Decision

The migration plan's original stance ("freeze `.planning/`, keep committed")
is replaced: **`.planning/` is removed entirely, per project.** Git history
is the archive — `git log -- .planning` reproduces every document forever.
Audit records move to `docs/audits/` and stay alive there.

Rationale: after the Spec Kit migration (#65), `.planning/` is never read
for routing. Keeping the directory forces permanent "this is legacy"
narration in always-loaded context and resurrects the directory in new
projects through the audits convention — both are standing context costs
with no functional benefit over git history.

## Per-project removal procedure

Executable form: run the `codi-planning-retirement` skill in the
downstream session ("`.planning` 정리해줘") — it implements the steps
below with preflight checks and a human gate on distillation.

1. Distill still-true decisions into `speckit.constitution` /
   `ARCHITECTURE.md` (cutover step; verify "no undecided still-valid
   decision left behind").
2. Move active audit records: `git mv .planning/audits docs/audits`
   (keep filenames; fix any relative links).
3. Delete the rest: `git rm -r .planning` and commit. No separate archive
   needed — git history preserves all content.
4. The deletion commit message should link this document.

## Harness-side changes shipped with this decision

- `docs/audits/` is the audits home (guardrails allowed destination,
  update-policy project-owned, tests repointed).
- The 2026-08 recheck plan was rewritten free of previous-engine content
  (rules now cover GStack, Superpowers, Spec Kit adoption only).
- Legacy ".planning is frozen history" narration in always-loaded surfaces
  is replaced by one transition line in `scenario-phase-routing.md`
  ("if `.planning/` still exists, run the removal procedure").

## Expiry / follow-up

- Transition machinery (gitignore planning managed block + neutralize
  logic, update-policy `.planning/**` project-owned entry, the transition
  line above) exists only to protect not-yet-cut-over downstreams. Remove
  it after all downstream projects have deleted `.planning/` — check at the
  2026-08 recheck.
- Machine-global previous-engine skill uninstall stays a separate user
  decision (tracked in session memory, not in plan docs).
