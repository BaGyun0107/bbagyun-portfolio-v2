# Shared Resource Layout

`_shared/` contains cross-skill resources grouped by loading behavior and ownership.

## Structure

- `core/`
  - Always-on or commonly referenced rules and guides.
  - Examples: context loading, clarification, difficulty, reasoning, lessons learned.
- `conditional/`
  - Load only when the workflow reaches a specific trigger.
  - Examples: exploration loop.
- `runtime/`
  - Runtime-injected or CLI-specific protocols.
  - Examples: memory protocol, execution protocols.

## Load Classes

- `always`: load at task start or during normal execution
- `conditional`: load only on the documented trigger
- `runtime-injected`: supplied automatically by CLI/runtime code
