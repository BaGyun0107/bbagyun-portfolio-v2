# Codex Mirror Map

Codex does not have Claude Code's per-prompt UserPromptSubmit hook. A shared
rule that depends on later-turn behavior needs more than a policy paragraph.

## Codex Surfaces

Use the smallest set that can make the rule visible and testable:

| Surface | Use for | Limits |
| --- | --- | --- |
| `AGENTS.md` | high-level shared rules Codex should see at repo entry | context budget is tight; keep summaries short |
| `.harness/policies/*.md` | canonical shared source of truth | Codex may not reread it each turn |
| `.harness/skills/*/SKILL.md` | behavior tied to a triggerable skill | only helps when the skill is selected and read |
| `.codex/rules/*.rules` | command prefix allow/prompt/forbid decisions | cannot inspect branch, cwd, dynamic shell, arbitrary paths, or transcript behavior |
| `.harness/scripts/agent/agent-preflight.sh` | launcher-time reminders for recurring Codex limits | only runs once when using `./harness codex` |
| replay checks | transcript-level workflow behavior | heuristic by design; keep fixtures realistic |
| hooks under `.harness/hooks` | path/branch/full-command checks, mostly Claude today | Codex cannot rely on all hook events yet |

## Required Codex Decision

For each new or changed rule, write down which of these is true:

- **Command-prefix enforceable:** add or update `.codex/rules/*.rules`.
- **Path/branch/full-input dependent:** document the Codex limitation, use hooks
  where available, and add narrative/preflight guidance.
- **Workflow/transcript dependent:** add replay-check coverage.
- **Skill-trigger dependent:** update the relevant `.harness/skills/*/SKILL.md`
  and context-check coverage.
- **Documentation-only:** state why no native Codex mirror is needed.

If execpolicy is too weak for the rule, record "execpolicy too weak" directly
and choose a
compensating control instead of creating a symbolic `.codex/rules` file.

## Common Mistakes

- Treating `AGENTS.md` as enough for detailed multi-turn behavior.
- Treating `.codex/rules` as path-aware. It is prefix-based.
- Treating direct SDK/helper commands as proof that a named workflow was used.
- Mirroring a rule into Claude but leaving Codex with only the canonical policy.
- Adding a Codex rule without updating `rule-check` or `context-check`.
