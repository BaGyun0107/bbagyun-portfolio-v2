# Team-Mode File Exchange Protocol

Durable state (decisions, phase boundaries, verification evidence, handoffs)
lives in GSD `.planning/` as the single source of truth. This file-exchange
protocol applies ONLY to transient team-mode pane coordination.

## Path Resolution (CRITICAL)

All transient coordination files (task board, progress, result) MUST be written
to the **project root** `.agents/results/` directory — never to a
subdirectory's `.agents/`.

- **Project root** = the git repository root (where `.git` exists)
- **Session-scoped naming**: when running under an orchestration session, append session ID as suffix:
  - `result-{agent-id}-{sessionId}.md` (e.g., `result-frontend-session-20260405-100835.md`)
  - `progress-{agent-id}-{sessionId}.md`
- **Manual (non-orchestrated) runs**: no suffix — `result-{agent-id}.md`

## On Start

1. Read `.agents/results/task-board.md` to confirm your assigned task
2. Create `.agents/results/progress-{agent-id}[-{sessionId}].md` with initial status

## During Execution

- Periodically update `progress-{agent-id}[-{sessionId}].md` with current state
- Include: action taken, current status, files created/modified

## On Completion

- Create `.agents/results/result-{agent-id}[-{sessionId}].md` with final result including:
  - Status: `completed` or `failed`
  - Summary of work done
  - Files created/modified
  - Acceptance criteria checklist
- Promote durable outcomes into GSD `.planning/`; do not treat the transient result file as the record of truth

## On Failure

- Still create `result-{agent-id}[-{sessionId}].md` with Status: `failed`
- Include detailed error description and what remains incomplete
