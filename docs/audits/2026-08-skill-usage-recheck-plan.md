# Skill Usage Recheck Plan — execute on/after 2026-08-03

Status: DONE (2026-08-06) — result:
`docs/audits/2026-08-06-skill-usage-recheck.md`

REWRITTEN 2026-07-07: the previous planning engine was fully replaced by
Spec Kit (pilot PASS, migration merged via #65). All rules about that
engine's runtime surface were removed. This plan now measures GStack gates,
Superpowers, and Spec Kit adoption only.

Pre-committed follow-up to `docs/audits/2026-07-06-skill-usage-audit.md`.
Any agent (Claude Code or Codex) executing this plan must produce the same
decisions: every metric, threshold, and command is fixed here. Do not
re-derive candidates or thresholds; if reality contradicts this plan, stop
and surface the contradiction to the user instead of improvising.

## Fixed inputs

- Measurement window: `--since 2026-07-07 --until <run date>`.
- Measurement command (deterministic output, run on the machine that holds
  `~/.claude/projects`):

      node docs/audits/tools/skill-usage.mjs \
        --since 2026-07-07 --until <run-date> \
        --out /tmp/skill-usage-window2.json

- Ignore in all analyses (CLI built-ins, not skills): clear, compact, model,
  usage, resume, exit, login, feedback, upgrade, plugin, reload-plugins,
  workflows, config, ultraplan, deep-research.
- Result doc: create `docs/audits/<run-date>-skill-usage-recheck.md` with
  sections: Window / Raw top-20 / Decision A-C outcomes / Actions taken /
  Deferred to user.

## Decision rules (pre-committed)

### A. GStack gates

SUPERSEDED 2026-08-06: rule A's ">=1 -> keep" outcome was overridden by an
explicit USER decision to remove GStack entirely and replace browser QA
with Playwright MCP (spec: `specs/018-gstack-to-playwright-mcp/`,
rationale: replacement parity confirmed by pilot, not the gate-count
threshold below). Kept for the record; do not re-run this rule.

Metric: total invocations of any GStack skill EXCEPT the utility exempt list
(browse, connect-chrome, scrape, setup-browser-cookies).

- 0 gate invocations -> record "gates unused after demotion". Prepare an
  uninstall proposal for the USER (evidence + revert path). Do NOT uninstall
  anything autonomously — GStack removal affects all projects and is a user
  decision. Utility usage does not count against this.
- >=1 gate invocation -> keep opt-in status, no action, record which gates
  were actually requested.

### B. Superpowers

Measure and record only. Retained by explicit user decision (2026-07-06).
Never remove or de-surface, regardless of counts.

### C. Spec Kit adoption

Metrics (all from the same JSON plus the fixed greps below):

1. Spec Kit flow invocations in the window: sum of skills matching
   `speckit-*` (specify, clarify, plan, tasks, analyze, implement, converge,
   constitution, checklist).
2. Fragmentation check — Superpowers plan docs created without a spec:

       grep -rn '"name":"Write"' ~/.claude/projects --include="*.jsonl" -l \
         | xargs grep -l "docs/superpowers/\|docs/plans/" | wc -l

   For each project hit, check the same window for any `speckit-*`
   invocation or a Write under `specs/`. If none, fragmentation persists:
   report the project names to the user and propose strengthening (do not
   change hooks autonomously).
3. Record, per project that has a `specs/` directory, whether root
   `ROADMAP.md` exists (doctor also checks this; record only).

- If metric 1 is 0 across all projects -> surface to the user: "Spec Kit
  adoption did not take in the window" with the raw data. Whether to adjust
  rules/training or reconsider the engine is the user's decision.
- Otherwise record adoption counts per project.

## Approval boundaries

- Autonomous (pre-approved by this plan): running the measurement, writing
  the result doc, flipping this plan's Status.
- User decision required (use `./harness notify-decision`): GStack uninstall
  (rule A), any hook/policy text change (rule C), anything not listed here.

## Execution checklist

1. Run the measurement command; save JSON and paste top-20 into result doc.
2. Apply rules A-C in order; record each outcome.
3. Write the result doc; flip this plan's Status to DONE with a link.
4. Commit `docs/audits/**` on a working branch and open a PR (never merge
   it yourself).
