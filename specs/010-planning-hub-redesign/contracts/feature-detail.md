# Contract: Rich Feature Detail v1

## Purpose

Define the planning-owned information a human or AI needs to judge what a feature must do.
This contract supplements, and does not replace, legacy feature-definition catalog rows.

## Required groups

1. identity and lifecycle
2. intent and actor value
3. scope and explicit non-goals
4. trigger, preconditions and behavior paths
5. applicable UI/system states and recovery
6. business, validation, permission and data-lifecycle rules
7. inputs, outputs, integrations and operations dependencies
8. applicable quality requirements
9. measurable acceptance criteria
10. traceability, evidence and decisions

## Readiness rules

- `approved` is a planning decision, not an implementation status.
- An approved detail missing actor, goal, happy path or acceptance criterion produces a
  `definition-incomplete` health issue.
- Loading/empty/error/permission/offline states are required when applicable. A state may be
  exempted only with an explicit reason.
- Open decisions require an owner and resolve-by condition; their count is shown separately.
- Evidence certainty is preserved; inferred content is never rendered as confirmed.

## Legacy mapping

| Legacy field | New use |
| --- | --- |
| `Row_ID` | catalog/detail stable ID candidate |
| `Title` | title |
| `Actor` | actor candidate |
| `Phase_Suggestion` | legacy priority candidate, never release phase |
| `Why` | intent source material, not complete detail |
| `Used_In`/`Area` | relation candidates, resolved to stable IDs explicitly |
| `Status`/`Decision_Level` | preserved legacy metadata; no automatic lifecycle promotion |

## UI contract

- Definition exploration follows Surface → Screen → feature group → definition.
- A feature declares `featureGroupId`, `targetReleaseId` and typed `placements` with
  `primary`, `entry`, `result` and `support` roles.
- A user-visible feature has exactly one primary placement; legacy `screenIds` remains a
  compatibility input until consumers migrate.
- List shows primary placement, group and linked work-item distribution; priority may remain
  detail metadata but does not lead the card.
- Detail groups follow the approved six-section human reading order.
- P1/P2/P3 display as `우선순위 Pn` with a project legend.
- Missing detail identifies exact group/field, impact and next action.
- Definition status is planning-owned. Implementation status is read only from linked
  project-owned FeatureWorkItems.
