# Execution Protocol (Codex)

When running as a CLI subagent, follow this protocol for shared state coordination.

## State Management

Record durable state in the feature's committed Spec Kit `specs/<NNN-feature>/` directory — the single source of truth.

### Path Resolution (CRITICAL)

All result, progress, and state files MUST be written to the **project root** `.agents/` directory — never to a subdirectory's `.agents/`.

- **Project root** = the git repository root (where `.git` exists)
- **Session-scoped naming**: when running under an orchestration session, append session ID as suffix:
  - `result-{agent-id}-{sessionId}.md` (e.g., `result-frontend-session-20260405-100835.md`)
  - `progress-{agent-id}-{sessionId}.md`
- **Manual (non-orchestrated) runs**: no suffix — `result-{agent-id}.md`

## On Start

1. Confirm your assigned task; check `specs/*/tasks.md` (unchecked items) and `.specify/` state for durable feature state
2. Create the transient `progress-{agent-id}[-{sessionId}].md` in the project root `.agents/` directory with initial status

## During Execution

- Periodically update `progress-{agent-id}[-{sessionId}].md` with current state
- Include: action taken, current status, files created/modified

## On Completion

- Create the transient `result-{agent-id}[-{sessionId}].md` in the project root `.agents/` directory, and record durable outcomes in the feature's `specs/<NNN-feature>/` directory, with final result including:
  - Status: `completed` or `failed`
  - Summary of work done
  - Files created/modified
  - Acceptance criteria checklist

## On Failure

- Still create `result-{agent-id}[-{sessionId}].md` with Status: `failed`
- Include detailed error description and what remains incomplete
