# Orchestration Loop Policy

The orchestration loop — the orchestrator vs phase-worker split, framework
placement, context budget, and the phase handoff contract — is defined in
`.harness/policies/agent-routing.md`. Use that file as the source of truth.

Do not use headless execution to bypass approval for destructive commands,
external service changes, secret writes, or production deploys.
