# Contract: Delivery Evidence v1

## Purpose

Publish downstream-owned facts about planning consumption, implementation and verification
without redefining planning intent.

## Evidence layers

1. **Spec evidence**: status, remaining task, decisions, verification ratio and linked files.
2. **Declared evidence**: screen/route/API/data/integration and criterion results recorded by
   the project.
3. **Observed evidence**: scanner findings supported by source path/revision.

Each fact includes certainty (`confirmed`, `observed`, `inferred`) and a source reference.

## Required envelope

- schema version and project ID
- consumed planning digest
- downstream source revision and collection time
- explicit feature work-item records (preferred) or legacy feature delivery records
- collection warnings

## Feature work items

An explicit `workItems` array follows [Feature Work Item v1](./feature-work-item.md). Release
is a work-item property/filter. One feature may have multiple frontend, backend, DB, QA,
infra or unspecified work items in different base states.

The legacy `features` array remains readable. It yields at most one `unspecified` work item
per feature only when no explicit item exists for that feature.

## Completion rule

Definition approval is not completion. A feature is delivery-ready only when required tasks
are complete, required acceptance criteria have passing verification and no blocking open
decision remains. Required code/test/verification evidence must also exist. Release state
remains downstream-owned.

## Failure behavior

- Missing evidence is `구현 근거 미수집`, not success or not-started by inference.
- Scanner failure preserves valid declared/Spec evidence and marks affected groups stale.
- Evidence referring to a different consumed manifest is `behind` or invalid, not aligned.
- A requested `done` item missing a completion condition remains `in-review` with the missing
  evidence and recovery action.
- Invalid work items do not mutate valid evidence or planning definitions; preview reports
  item health and strict validation fails.
