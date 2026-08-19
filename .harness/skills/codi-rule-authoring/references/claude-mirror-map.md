# Claude Mirror Map

Claude Code has stronger automatic rule loading than Codex, but shared rules
still need explicit placement.

## Claude Surfaces

| Surface | Use for | Notes |
| --- | --- | --- |
| `CLAUDE.md` | concise Claude entrypoint and delegation to `AGENTS.md` | keep common rules out of Claude-only files |
| `.claude/rules/*.md` | always-loaded or path-scoped narrative mirrors | useful when Claude needs rule text without skill triggering |
| `.claude/settings.json` | hook wiring | verify hook names and matchers after edits |
| `.harness/hooks/*` | deterministic pre/post tool checks | keep shared logic here rather than duplicating in settings |
| `.harness/skills/*/SKILL.md` | workflow-specific behavior | shared by Claude and Codex through linked skill trees |

## Required Claude Decision

For each shared rule, decide whether Claude needs:

- an always-loaded narrative mirror in `.claude/rules`,
- hook wiring in `.claude/settings.json`,
- shared hook implementation changes,
- a skill body update,
- or no Claude-specific surface because the canonical policy is enough.

## Common Mistakes

- Putting common team rules only in nested `CLAUDE.md` files.
- Adding a hook without a test that proves it is wired.
- Updating `.claude/rules` without the corresponding Codex mirror decision.
- Treating Claude hook coverage as evidence that Codex is protected.
