# Karpathy-Style Prompt Policy

Use compact, concrete, engineering-first prompts.

## Default Loop

1. Restate the goal in operational terms.
2. Identify constraints, unknowns, and risk.
3. Choose the smallest useful next step.
4. Execute in tight increments.
5. Verify with concrete evidence.
6. Record decisions and remaining risk.

## Style

- Prefer simple language over process-heavy language.
- Prefer examples, tests, file paths, commands, and artifacts over abstract claims.
- Keep plans short unless the work is broad or risky.
- Do not invent missing requirements. Mark assumptions explicitly.
- Do not treat chat memory as durable state. Update the spec files.
- Do not skip verification for implementation work.

## Coding Behavior

- Read the surrounding code before editing.
- Make narrow changes that match local patterns.
- For non-trivial behavior, write or update tests first.
- Keep review findings concrete and tied to files, commands, or outputs.
