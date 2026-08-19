# Steering Taxonomy Audit (2026-07-06)

One-pass mapping of harness components onto Anthropic's seven official
steering mechanisms (CLAUDE.md, rules, skills, subagents, hooks, output
styles, system-prompt append; blog 2026-06-18), checking each component sits
in the right layer per the decision questions (compaction survival,
persistence, trigger, scope, override).

## Mapping and verdicts

| Component | Layer used | Verdict |
| --- | --- | --- |
| CLAUDE.md / AGENTS.md thin entry points | CLAUDE.md | Correct — 62/175 lines, within budget; matches AGENTS.md-standard pattern |
| Safety blocks (branch, dangerous cmds, shared-skill writes) | hooks (guardrails.mjs; + Codex PreToolUse adapter since today) | Correct — "must happen deterministically" belongs in hooks; survives compaction by design |
| Non-blocking nudges (Size, e2e, plan-of-record; escalating) | hooks (additionalContext) | Correct — deterministic trigger, advisory content |
| phase-routing, work-safety, payload-safety rules | rules (unscoped) | Correct — cross-cutting invariants that apply to any file |
| monorepo-packages rule | rules (path-scoped as of today) | Fixed today — loads with package/app files; hook stays always-on |
| e2e-validation rule | rules (unscoped) | Candidate: path-scope to `apps/**` once downstream template lands — conditional by nature, hook carries the commit-time assist |
| skill-ownership rule | rules (unscoped) | Candidate: path-scope to `.harness/**` — Bash guard is hook-enforced; narrative only matters near the skills tree. Defer until one path-scoped rule has proven itself |
| skill-ownership enforcement internals | rules/references (on-demand) | Correct — right pattern for heavy detail (skill-like lazy load) |
| Stack guidance (codi-backend/frontend/db/...) | skills | Correct — procedural, loads on demand |
| Routing summary (codi-phase-routing) | skills | Acceptable — known duplication with rules; monitor |
| Prompt shape (karpathy-style) | skills | Acceptable — output styles would also fit; not worth migrating |
| Role separation (team mode env vars, GSD agents) | subagents | Correct — external tools own their agent definitions |
| Output styles / system-prompt append | unused | Fine — no current need; revisit only for headless automation |

## Findings

1. No component is in a wrong layer outright. The two follow-up candidates
   (e2e-validation, skill-ownership) are always-on rules whose narrative is
   conditional by nature; their enforcement is already hook-based, so
   path-scoping is a context-cost optimization, not a safety change.
2. Anthropic's guidance "procedural detail belongs in skills" is already the
   harness's direction (references/ file, codi skills). Remaining procedural
   text inside rules (marker printf snippets) is small enough to keep.
3. Compaction: hooks and unscoped rules survive; skills reinject within a
   shared budget (oldest-first drop) — nothing load-bearing lives only in a
   skill body, so no change needed.

Follow-up (not urgent): after 2-3 weeks of path-scoped monorepo-packages with
no misses, scope e2e-validation and skill-ownership the same way.
