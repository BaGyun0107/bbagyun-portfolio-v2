# Dynamic Context Loading Guide

Agents should not read all resources at once. Instead, load only necessary resources based on task type.
This saves context window and prevents confusion from irrelevant information.

---

## Loading Order (Common to All Agents)

### Always Load (Required)
1. `SKILL.md` — Auto-loaded
2. `resources/execution-protocol.md` — Execution protocol

### Load at Task Start
3. `difficulty-guide.md` — Difficulty assessment (Step 0)

### Load Based on Difficulty
4. **Simple**: Proceed to implementation without additional loading
5. **Medium**: `resources/examples.md` (reference similar examples)
6. **Complex**: `resources/examples.md` + `stack/tech-stack.md` + `stack/snippets.md`

### Load During Execution as Needed
7. `resources/checklist.md` — Load at Step 4 (Verify)
8. `resources/error-playbook.md` — Load only when errors occur
9. `common-checklist.md` — For final verification of Complex tasks
10. `../runtime/memory-protocol.md` — CLI mode only

### Load on Measurement / Exploration (Conditional)
11. `../conditional/exploration-loop.md` — Load only when a gate fails twice on the same issue

---

## Task Type → Resource Mapping by Agent

### Backend Agent

| Task Type                     | Required Resources                          |
| ----------------------------- | ------------------------------------------- |
| CRUD API creation             | stack/snippets.md (route, schema, model, test)    |
| Authentication implementation | stack/snippets.md (JWT, password) + stack/tech-stack.md |
| DB migration                  | stack/snippets.md (migration)                     |
| Performance optimization      | examples.md (N+1 example)                   |
| Existing code modification    | examples.md                                 |

### Frontend Agent

| Task Type           | Required Resources                                     |
| ------------------- | ------------------------------------------------------ |
| Component creation  | snippets.md (component, test) + component-template.tsx |
| Form implementation | snippets.md (form + Zod)                               |
| API integration     | snippets.md (TanStack Query)                           |
| Styling             | tailwind-rules.md                                      |
| Page layout         | snippets.md (grid) + examples.md                       |

### Developer Workflow Expert

| Task Type                   | Required Resources                                            |
| --------------------------- | ------------------------------------------------------------- |
| API Workflow Setup          | resources/api-workflows.md + resources/validation-pipeline.md |
| Database Migration Workflow | resources/database-patterns.md                                |
| Release Coordination        | resources/release-coordination.md                             |
| Troubleshooting             | resources/troubleshooting.md                                  |

---

## Orchestrator Only: Composing Subagent Prompts

When the Orchestrator composes subagent prompts, reference the mapping above
to include only resource paths matching the task type in the prompt.

```
Prompt composition:
1. Agent SKILL.md's Core Rules section
2. execution-protocol.md
3. Resources matching task type (see tables above)
4. error-playbook.md (always include — recovery is essential)
5. Memory protocol (`../runtime/memory-protocol.md`, CLI mode)
```

This approach avoids loading unnecessary resources, maximizing subagent context efficiency.

---

## Conditional Protocol Loading (Measurement & Exploration)

The following protocols are **NOT** loaded at Phase 0 / Step 0. They are loaded on-demand:

| Protocol | Trigger | Loaded By |
|----------|---------|-----------|
| `exploration-loop.md` | Same gate fails twice on same issue | Orchestrator (inline, before spawning hypothesis agents) |
