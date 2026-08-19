# Contract: Feature Work Item v1

## Purpose

Represent project-owned implementation work without putting implementation status or
repository topology into planning-owned feature definitions.

## Ownership and relationship

- Cardinality is `FeatureDefinition 1 : N FeatureWorkItem`.
- planning-hub owns immutable feature definitions and target intent.
- The receiving project owns Spec, task, work-item split, status, hold, evidence and
  completion decisions.
- planning-hub does not pre-create frontend/backend/DB/QA/infra work.
- Neither FeatureDefinition nor FeatureWorkItem requires a downstream repository field.

## Required record

- stable `id`
- valid `featureDefinitionId`
- `title`
- `workType`: `frontend`, `backend`, `db`, `qa`, `infra`, or `unspecified`
- `releaseId`; `unassigned` is reserved for unclassified legacy projection
- `status`: `planned`, `in-progress`, `in-review`, or `done`
- `taskRefs[]`
- `evidenceRefs[]`
- `source`: `explicit` or `legacy-delivery-evidence`

Optional hold data contains `active`, `reason` and `releaseCondition`. Hold never replaces
the base status and never creates a fifth Kanban column.

## Completion rule

`done` is accepted only when every linked task is complete, every required acceptance
criterion has passing verification, required code/test/verification evidence exists and no
blocking decision remains. Otherwise the projection keeps the item in `in-review` and lists
the missing condition plus a recovery action.

For a requested `done`, `requiredAcceptanceCriterionIds[]` and `acceptanceResults[]` are
required even though they are optional for other base states. Required criterion IDs must be
non-empty, stable and unique. Acceptance results must be plain `{ criterionId, status }`
records with unique criterion IDs, and every required criterion ID must be covered exactly
once by a result whose status is `passed`.

## Legacy compatibility

When a feature has no explicit work item, one legacy item may be projected:

```text
id: WORK-<feature-id>-LEGACY
workType: unspecified
releaseId: unassigned
source: legacy-delivery-evidence
```

Explicit items suppress the legacy projection for the same feature. Titles, paths and task
text are never used to infer a technical work type.

## Failure behavior

Duplicate IDs, broken parent features, unsupported work type/status, malformed hold or
repository-shaped fields exclude only the invalid item from preview and emit stable health
with source, impact and recovery action. Strict validation fails. Input objects and
project-owned source files remain unchanged.
