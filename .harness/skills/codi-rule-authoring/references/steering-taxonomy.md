# Steering Taxonomy — layer selection for any new harness component

Source of record: Anthropic blog "Steering Claude Code: skills, hooks,
rules, subagents and more" (2026-06-18) plus the official docs (hooks,
skills, memory pages). Facts below were verified 3-0 against primary
sources on 2026-07-06. If observed behavior contradicts this file,
re-verify against the current docs before trusting either.

## The seven mechanisms

CLAUDE.md · rules (`.claude/rules/*.md`) · skills · subagents · hooks ·
output styles · system-prompt append.

## The five questions (answer ALL before placing a component)

1. Must it survive compaction?
2. How persistent must it be (session / project / org)?
3. What triggers it — an event, reading a file, or an invocation?
4. What scope does it need (every session / matching files / on demand)?
5. What must it override, and what may override it?

## Placement rules (the part that decides most cases)

| Need | Layer | Why |
| --- | --- | --- |
| Must happen deterministically (block a command, stamp evidence) | hook | Config lives outside context; bypasses compaction entirely; 5 types (command, HTTP, mcp_tool, prompt, agent) |
| Cross-cutting invariant, any file, every session | unscoped rule | Loaded at launch, reinjected at compaction |
| Invariant that only matters near certain files | path-scoped rule (`paths:` frontmatter) | Loads when Claude reads a matching file — not on every tool use |
| Multi-step procedure / how-to | skill | Progressive disclosure: name+description at start, body on invoke; compaction reinjection shares a 25,000-token budget (first 5,000 per skill, oldest dropped first) |
| Isolated context for a sub-task | subagent | Fresh context per spawn |
| Team facts Claude needs every session | CLAUDE.md (<200 lines) | Project-root copy is re-read from disk after compaction; nested copies reload on next file read; HTML comments are stripped |
| Hard enforcement independent of model judgment | managed settings / permissions.deny | CLAUDE.md and rules are context, not enforcement |

Anti-patterns the taxonomy forbids: procedural detail in CLAUDE.md or
rules (move to a skill); safety-critical behavior only in narrative text
(add a hook); always-on rules whose content is conditional by nature
(scope with `paths` once the hook carries enforcement).

## Dual-runtime note (this harness)

Codex has no path-scoped rules and no compaction-reinjection contract.
Whatever you scope or slim on the Claude side must keep its Codex
narrative in `AGENTS.md`/policies, and deterministic checks port through
the Codex PreToolUse adapter (`.harness/hooks/codex-pretooluse.mjs`).
Claude does not read `AGENTS.md` natively — the thin-CLAUDE.md entry
point pattern stays.

## Re-running the audit

Map every harness component to (layer used, verdict, follow-up) using the
five questions. Prior result and table format:
`docs/audits/2026-07-06-steering-taxonomy-audit.md`. Re-run after
adding a mechanism class, or roughly quarterly. Known follow-ups from the
last run: path-scope `e2e-validation` and `skill-ownership` after the
`monorepo-packages` path-scoping proves itself (2-3 weeks clean).

Sources:
- https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more
- https://code.claude.com/docs/en/hooks · /skills · /memory
