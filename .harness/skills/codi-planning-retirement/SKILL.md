---
name: codi-planning-retirement
description: Use when removing a legacy .planning directory from a project after the Spec Kit migration — distill still-valid decisions into the constitution, move audits to docs/audits, carry unresolved items to the thin root ROADMAP, delete .planning, and commit. Trigger words include ".planning 정리", ".planning 삭제", "planning retirement", "legacy planning 제거".
---

# Codi Planning Retirement

One-time-per-project retirement of the previous planning engine's
`.planning/` directory. The canonical decision and rationale live in
`docs/audits/2026-07-07-planning-retirement.md`; this skill is its
executable form. Git history is the archive — `git log -- .planning`
reproduces every removed document forever, so deletion loses nothing.

This skill itself is transition tooling: once every downstream project has
run it, the skill is removable (checked at the 2026-08 recheck).

## Preflight (stop if any check fails)

1. On a working branch (never `main`/`dev`).
2. Spec Kit installed: `.specify/` exists. If not, install first (README
   "Spec Kit 설치" section — three verified commands).
3. `.planning/` exists. If not, report "nothing to retire" and stop.
4. No in-flight phase: scan `.planning/ROADMAP.md` progress rows and
   `.planning/phases/**` for non-complete status. In-flight work must be
   finished or re-specified (`speckit-specify`, remaining scope only)
   BEFORE retirement.

## Step 1 — Distill (human gate, the only judgment step)

1. Read `.planning/PROJECT.md`, `REQUIREMENTS.md`, and any decision
   records; extract decisions and constraints that are STILL TRUE
   (architecture strategy, domain rules, non-negotiable constraints).
2. Write them into the project constitution via `speckit-constitution`
   (create or update).
3. Present to the user: (a) what was distilled, (b) what was deliberately
   dropped as obsolete. Get explicit confirmation that no undecided
   still-valid decision is left behind. Do not continue without it.

## Step 2 — Move audit records

If `.planning/audits/` exists: `git mv .planning/audits docs/audits`
(if `docs/audits/` already exists, `git mv` file-by-file). Then fix
relative links inside the moved files (`.planning/audits` → `docs/audits`).
Audit records stay alive — they are the only content that moves instead of
being deleted.

## Step 3 — Thin root ROADMAP

From the old `.planning/ROADMAP.md`, carry over ONLY unresolved, deferred,
or backlog rows into the root `ROADMAP.md` (columns: feature | status |
`specs/NNN` link or `-`). Completed rows are history — git keeps them.

## Step 4 — Delete

1. `git rm -r .planning`
2. Untracked local leftovers (`STATE.md`, `.continue-here.md`) may remain
   on disk; remove those specific files individually, then remove the
   empty directory.

## Step 5 — Commit and verify

- Commit on the working branch with a Korean message; the body links
  `docs/audits/2026-07-07-planning-retirement.md`.
- Verify: `git grep -l "\.planning"` returns only harness-delivered
  transition machinery (or nothing project-owned); `./harness doctor` is
  green (the specs/ROADMAP advisory passes).
- Rollback: the retirement is one commit — `git revert` restores
  everything.

## Boundaries

- Never run on `main`/`dev`; never merge the PR yourself.
- If the project shows recent previous-engine activity (someone is still
  routing work through it), stop and surface the ordering problem to the
  user instead of deleting under their feet.
