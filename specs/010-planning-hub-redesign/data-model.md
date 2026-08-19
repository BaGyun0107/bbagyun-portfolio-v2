# Data Model: Planning Hub 데모·동기화·기능 허브 재설계

## Ownership Summary

| Entity | Canonical owner | Projection may write source? |
| --- | --- | --- |
| Workspace configuration | current project | no |
| User need, screen, feature detail, flow, planning decision | planning source | no |
| Feature definition group and screen placement | planning source | no |
| Planning manifest | planning publisher/generated snapshot | compiler only |
| Planning lock | downstream project | explicit pull only |
| Spec, task, code and verification facts | downstream project | existing owner only |
| Feature work item, status, hold and evidence | downstream project | existing owner only |
| Delivery evidence | downstream collector/generated snapshot | collector only |
| Sync result and health | reconcile projection | generated state only |
| Change proposal | downstream/reconcile suggestion; planning reviewer disposition | proposal file only |
| Hub HTML | generator | generated output only |
| Document projection | generator from Markdown | generated model only |
| Generated page set | generator | generated output only |
| Organization layout | generator from sitemap | generated model only |
| Feature status rollup | generator from project-owned work items | generated model only |
| Traceability coverage and neighborhood | generator from typed relations | generated model only |

## WorkspaceConfig

Represents available sources and the default hub workspace.

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `version` | integer | yes | `1` |
| `defaultWorkspaceId` | string | yes when workspaces exist | must reference one workspace |
| `workspaces` | array | yes | unique non-empty IDs |
| `workspaces[].id` | string | yes | stable kebab-case ID |
| `workspaces[].title` | string | yes | user-facing Korean/locale title |
| `workspaces[].kind` | enum | yes | `demo`, `internal`, `downstream` |
| `workspaces[].root` | relative path | yes | inside repository root |
| `workspaces[].badge` | string | demo only | must visibly state demo status |
| `workspaces[].planningSource` | relative path | optional | manifest or source directory |
| `workspaces[].deliverySource` | relative path | optional | evidence/Spec root |

Default resolution:

1. Valid config → declared default.
2. No config → one `actual-project` downstream workspace at repository root.
3. Invalid actual source → error state; never substitute a demo workspace.

## UserNeed

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `id` | string | yes | unique stable `NEED-*` |
| `title` | string | yes | concise problem statement |
| `description` | string | yes | user/business problem, not solution only |
| `actors` | string[] | yes | at least one actor |
| `sources` | EvidenceRef[] | yes | at least one confirmed or explicit assumption |
| `status` | enum | yes | `draft`, `in-review`, `approved`, `deprecated` |
| `owner` | string | yes | decision owner |

## Screen

Extends the existing sitemap node without turning non-screen artifacts into nodes.

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `id` | string | yes | unique across all surfaces and aliases |
| `title` | string | yes | user-facing screen/content title |
| `surface` | enum | yes | `user`, `admin`, `common` |
| `type` | enum | optional | page, detail, modal, policy, external |
| `route` | string | optional | expected/declared route, not secret URL |
| `access` | string[] | optional | actors/roles |
| `aliases` | string[] | optional | unique migration lookup only |
| `children` | Screen[] | optional | acyclic hierarchy |
| `directNavigation` | string[] | optional | valid target screen IDs; dotted edge |

Validation rejects duplicate IDs/aliases in strict mode and reports broken direct navigation.

## FeatureCatalogEntry

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `id` | string | yes | unique stable feature ID |
| `title` | string | yes | human-readable feature name |
| `summary` | string | yes for new contract | one-line user value |
| `actor` | string | yes for new contract | primary actor |
| `priority` | string | yes for new contract | project-defined; UI prefixes `우선순위` |
| `releasePhase` | string | optional | never inferred from priority |
| `owner` | string | yes for new contract | accountable planning role |
| `definitionStatus` | enum | yes for new contract | definition lifecycle only |
| `lastReviewedAt` | date-time | yes for approved | provenance |
| `needIds` | string[] | yes | valid needs |
| `screenIds` | string[] | conditional | user-visible features normally require at least one |
| `featureGroupId` | string | yes for new contract | product capability group, not technical team |
| `placements` | FeaturePlacement[] | yes for new contract | at least one `primary` for user-visible features |
| `targetReleaseId` | string | optional | planning target; does not assign implementation repository |
| `flowIds` | string[] | optional | valid flow IDs |
| `detailId` | string | yes for new contract | exact FeatureDetail ID |
| `legacy` | object | optional | unmapped v1 processing metadata |

## FeatureDetail

| Group | Key fields | Validation |
| --- | --- | --- |
| identity | `id`, `summary`, `owner`, `definitionStatus`, `review` | ID matches catalog |
| intent | `problem`, `actor`, `goal`, `outcome`, `evidence`, `assumptions` | non-empty for ready definition |
| scope | `inScope`, `nonGoals` | explicit arrays |
| behavior | `trigger`, `preconditions`, `happyPath`, `alternativePaths`, `failures`, `postconditions` | happy path has ordered steps |
| states | `processing`, `emptyOrNoInput`, `errorRetry`, `permissionDenied`, optional offline/timeout | applicable states defined or exempted with reason |
| rules | business/validation rules, permissions, lifecycle | stable rule IDs preferred |
| interfaces | inputs, outputs, APIs/integrations, admin/operations | no secrets |
| quality | accessibility, performance, privacy, security, availability | applicable requirements or exemption |
| acceptance | criterion ID, statement/scenario, metric, verification status | at least one measurable criterion |
| traceability | need/screen/flow/design/spec/task/test/verification refs | typed valid IDs/paths |
| decisions | open/resolved question refs | open items have owner and resolve condition |

Readiness calculation is a projection; it never changes `definitionStatus`.

## FeatureDefinition and FeaturePlacement

`FeatureDefinition` is the joined planning-owned view of `FeatureCatalogEntry` and
`FeatureDetail`. It never owns implementation status.

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `id` | string | yes | stable feature ID; parent key for work items |
| `title` | string | yes | user-facing capability name |
| `featureGroupId` | string | yes | product grouping such as post, reaction, account, notification |
| `placements` | FeaturePlacement[] | yes | unique `(screenId, role)` pairs |
| `actor` / `userGoal` | string | yes for ready | human intent, searchable |
| `behavior` / `rules` / `states` | object/arrays | yes when applicable | planning intent only |
| `acceptanceCriteria` | array | yes for ready | measurable criteria |
| `targetReleaseId` | string | optional | planning target, not work completion state |

FeaturePlacement fields:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `screenId` | string | yes | existing Screen ID |
| `role` | enum | yes | `primary`, `entry`, `result`, `support` |

Each user-visible feature has exactly one `primary` placement. Other roles may repeat across
different screens. Legacy `screenIds` remains compatibility input; it does not override an
explicit placement. No repository or downstream source location is stored on the definition.

## UserFlowStory

Read-only projection of an existing UserFlow for goal-oriented display.

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `actor` | string | yes | flow owner/user role |
| `goal` | string | yes | outcome-oriented title |
| `normalPath` | FlowStep[] | yes | bounded ordered traversal from `entryStepId` |
| `branches` | FlowBranch[] | yes | decision, failure or recovery attached to source step |
| `orderedText` | string[] | yes | all source steps/branches for accessible alternative |
| `health` | HealthIssue[] | yes | broken target, ambiguous branch and cycle diagnostics |

Each step preserves `screenIds` and `featureIds`. Traversal uses a visited set; it never
guesses a success path when source branch kind/condition is absent.

## PlanningPackage / PlanningManifest

`PlanningPackage` is the product-level immutable unit. In the current v1 implementation the
`PlanningManifest` envelope serializes that package; a future repository split may change
transport without changing entity identity or receipt semantics.

| Field | Type | Required | Digest participation |
| --- | --- | --- | --- |
| `schemaVersion` | integer | yes | yes |
| `manifestVersion` | semver string | yes | yes |
| `projectId` | string | yes | yes |
| `sourceRevision` | string | yes | yes |
| `generatedAt` | date-time | yes | no |
| `digestAlgorithm` | string | yes | yes (`sha256`) |
| `digest` | string | yes | excluded while computing itself |
| `needs` | UserNeed[] | yes | yes |
| `screens` | Screen[] | yes | yes |
| `features` | FeatureCatalogEntry[] | yes | yes |
| `featureDetails` | FeatureDetail[] | yes | yes |
| `flows` | UserFlow[] | yes | yes |
| `relations` | TraceabilityLink[] | yes | yes |
| `decisions` | PlanningDecision[] | yes | yes |
| `releases` | Release[] | yes for new package | yes |

Canonical serialization recursively sorts object keys, preserves array order where the
contract defines semantic order, normalizes line endings and rejects non-JSON values.

## PlanningLock

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `version` | integer | yes | `1` |
| `projectId` | string | yes | matches manifest |
| `sourceRepository` | string | optional | non-credential identifier |
| `sourceRef` | string | optional | branch/tag/ref |
| `manifestVersion` | string | yes | exact consumed version |
| `schemaVersion` | integer | yes | supported version |
| `digest` | string | yes | exact manifest digest |
| `importedAt` | date-time | yes | audit only |
| `appliedState` | enum | yes | `pending`, `applied`, `invalid` |

Receipt semantics map the approved package terms to the existing lock fields:

| Receipt term | PlanningLock field | Rule |
| --- | --- | --- |
| `consumedVersion` | `manifestVersion` | exact immutable package version |
| `consumedDigest` | `digest` | exact validated package digest |
| `acceptedAt` | `importedAt` | set only by explicit receipt |

A project receipt records adoption; it does not copy, regenerate or overwrite Spec, task,
FeatureWorkItem or verification source.

### Planning Lock update transition

```text
current lock
  → explicit pull request
  → fetch/read complete candidate manifest
  → schema + project + source revision + digest validation
       fail → keep current lock and last good projection
       pass → write complete temporary lock
              → atomic replace
              → applied
```

Ordinary build, check, watcher and Stop-hook runs are read-only with respect to the lock.
Only the explicit pull action may perform this transition.

## FeatureWorkItem

Represents project-owned technical work derived after the project receives a planning
package. Relationship: `FeatureDefinition 1 : N FeatureWorkItem`.

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `id` | string | yes | unique stable work ID |
| `featureDefinitionId` | string | yes | existing parent feature; immutable relationship key |
| `title` | string | yes | concrete technical outcome |
| `workType` | enum | yes | `frontend`, `backend`, `db`, `qa`, `infra`, `unspecified` |
| `releaseId` | string | yes | Release attribute/filter; `unassigned` only for unclassified legacy projection |
| `status` | enum | yes | `planned`, `in-progress`, `in-review`, `done` |
| `hold` | object/null | optional | `{ active, reason, releaseCondition }`; does not replace status |
| `taskRefs` | string[] | yes | project-owned task references |
| `requiredAcceptanceCriterionIds` | string[] | optional | required for requested `done`; non-empty unique stable criterion IDs |
| `acceptanceResults` | array | optional | required for requested `done`; unique plain `{ criterionId, status }` results, with every required criterion ID covered exactly once by a `passed` result |
| `evidenceRefs` | string[] | yes | code/test/verification references |
| `blockingDecisions` | string[] | optional | unresolved decisions that prevent completion |
| `source` | enum | yes | `explicit`, `legacy-delivery-evidence` |

Validation rules:

- Technical work is never inferred from a definition title, path or task prose.
- Duplicate work IDs, broken parent IDs and unsupported enum values are excluded from the
  current projection and produce stable health diagnostics.
- A repository field is not part of this entity. Workspace/source configuration owns
  repository location outside the feature definition contract.
- Explicit work items replace the legacy projection for the same feature.
- Legacy-only evidence yields at most `WORK-<feature-id>-LEGACY`, `workType: unspecified`,
  `releaseId: unassigned`.

### Completion guard

For a requested `done`, `requiredAcceptanceCriterionIds` and `acceptanceResults` become
required completion metadata. Both ID sets must be structurally valid and unique, and every
required criterion ID must have exactly one matching result whose status is `passed`.

```text
requested done
  + every linked task complete
  + every required acceptance criterion passed
  + required code/test/verification evidence present
  + no blocking open decision
    → done
otherwise
    → in-review + missing conditions + recovery action
```

## FeatureStatusRollup

Read-only projection keyed by feature ID and optional Release filter.

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `featureDefinitionId` | string | yes | rollup parent |
| `releaseId` | string/null | yes | null means all releases |
| `status` | enum | yes | `work-not-created`, `planned`, `in-progress`, `in-review`, `done` |
| `counts` | object | yes | base status, `onHold`, total counts |

Rollup precedence:

```text
0 items                              → work-not-created
all filtered items done              → done
any filtered item in-progress        → in-progress
no active item, any item in-review   → in-review
otherwise                            → planned
```

`onHold` is counted independently and never creates a fifth Kanban column.

## DeliveryEvidence

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `schemaVersion` | integer | yes | `1` |
| `projectId` | string | yes | manifest project |
| `consumedManifestDigest` | string | yes | planning lock digest |
| `sourceRevision` | string | yes | downstream commit/tree identity |
| `collectedAt` | date-time | yes | audit only |
| `features` | FeatureDelivery[] | compatibility | unique feature IDs; legacy input |
| `workItems` | FeatureWorkItem[] | preferred | unique work IDs with valid parent features |
| `artifacts` | ArtifactEvidence[] | optional | screen/route/API/data/design refs |
| `warnings` | CollectionWarning[] | optional | never treated as pass |

FeatureDelivery includes delivery status, Spec/task summary, criterion verification,
declared/observed values and evidence refs. Each fact has `certainty` (`confirmed`,
`observed`, `inferred`) and `source`.

Explicit `workItems` are the current project-owned status source. Legacy `features` remain
readable but are projected only when the same feature has no explicit work item.

## TraceabilityLink

Uses the existing typed endpoints and extends evidence metadata.

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `from`/`to` | typed ID refs | yes | endpoint exists |
| `type` | enum | yes | allowed direction/type |
| `evidence` | EvidenceRef | yes for new manifests | source + certainty |
| `label` | string | optional | user-facing context |

Duplicate same-direction links are health warnings; missing endpoints are broken references.

## TraceabilityCoverage

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `summary` | object | yes | total, complete, evidence missing and broken counts |
| `gaps` | Gap[] | yes | stable type, feature ID, severity and recovery action |
| `neighborhood.nodes` | EntityRef[] | yes | selected entity within bounded depth only |
| `neighborhood.edges` | TraceabilityLink[] | yes | endpoints both present in neighborhood |
| `matrixRows` | array | optional | secondary grouped matrix/CSV source |

Indexes cover Need, Feature, Screen, Flow, Spec, FeatureWorkItem and Verification once per
workspace. The default view does not materialize the complete relation graph in active DOM.

## SyncResult

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `workspaceId` | string | yes | current workspace |
| `planningDigest` | string/null | yes | null on missing source |
| `deliveryRevision` | string/null | yes | null on missing evidence |
| `status` | enum | yes | aggregate status |
| `featureResults` | FeatureSyncResult[] | yes | field-level details |
| `health` | HealthIssue[] | yes | severity, source, impact, action |
| `lastSuccessfulAt` | date-time/null | yes | visible recovery context |

### Sync status transitions

```text
collection-failed --successful collection--> behind | aligned | drifted | conflicted
behind --matching evidence imported--------> aligned
aligned --one-side incompatible change-----> drifted
drifted --both sides incompatible change---> conflicted
drifted/conflicted --human resolution-------> aligned | behind
any --collection failure--------------------> collection-failed
```

The previous successful projection remains available when current status is
`collection-failed`.

## ChangeProposal

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `id` | string | yes | unique stable proposal ID |
| `entity` | typed ID ref | yes | valid planned entity |
| `fieldPath` | string | yes | allowed non-secret field |
| `plannedValue` | JSON value | yes | manifest snapshot value |
| `observedValue` | JSON value | yes | evidence value |
| `evidence` | EvidenceRef[] | yes | at least one confirmed/observed source |
| `rationale` | string | yes | why review is required |
| `proposer` | string | yes | person/system role |
| `decisionOwner` | string | yes | planning authority |
| `status` | enum | yes | `open`, `accepted`, `rejected`, `deferred`, `resolved` |
| `resolution` | enum | conditional | implementation-fix, planning-change, defer, reject |
| `decidedAt`/`decisionReason` | fields | conditional | required after open |

## AutomationRun

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `runId` | string | yes | unique per invocation |
| `trigger` | enum | yes | manual, watch, claude-stop, codex-stop, ci |
| `sourceGroups` | string[] | yes | classified changed inputs |
| `inputDigests` | object | yes | no prompt or secret values |
| `startedAt`/`finishedAt` | date-time | yes | duration derived |
| `result` | enum | yes | success, warning, failed, skipped |
| `warnings` | summary[] | optional | safe user-facing text |
| `lastSuccessfulRunId` | string/null | yes | recovery reference |

## DocumentProjection

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `path` | repository-relative string | yes | unique, inside repository |
| `href` | local relative string | yes | points to source path only |
| `category` | enum | yes | `하네스 가이드`, `프로젝트 문서`, `진입점` |
| `title` | string | yes | first heading or filename fallback |
| `snippet` | string | yes | plain-text summary |
| `bodyHtml` | string | yes | escaped supported Markdown projection |
| `health` | enum | yes | `available`, `conversion-failed` |
| `recovery` | string/null | conditional | required on failure |

Document source remains immutable. Executable HTML, scriptable URL schemes and inline event
handlers are never carried into `bodyHtml`.

## GeneratedPageSet

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `documentsHtml` | string | yes | complete `docs/index.html` |
| `planningHtml` | string | yes | complete `docs/planning.html` |
| `sourceDigest` | string | yes | same semantic input for both pages |

Build writes the pair only after both renders succeed. Strict validation compares both current
files with an in-memory no-write build.

## OrganizationLayout

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `nodes` | array | yes | screen IDs only, unique |
| `nodes[].id` | string | yes | exact sitemap screen ID |
| `nodes[].x` / `nodes[].y` | number | yes | deterministic finite coordinates |
| `nodes[].depth` | integer | yes | hierarchy depth, root is 0 |
| `nodes[].surface` | enum | yes | user, admin, common |
| `hierarchyEdges` | array | yes | parent-child solid edges |
| `directEdges` | array | yes | valid direct-navigation dotted arrows |
| `bounds` | object | yes | min/max canvas extents for fit |

Selection is client state keyed by screen ID and is shared with structure search, tree and
table. Layout never writes coordinates back to sitemap source.
