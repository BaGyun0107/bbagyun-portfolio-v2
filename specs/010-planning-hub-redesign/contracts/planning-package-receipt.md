# Contract: Immutable Planning Package Receipt

## Purpose

Allow a future standalone planning-hub to hand one project an immutable planning package
without silently replacing project-owned Spec, task, work status or verification evidence.

## Package ownership

planning-hub owns a project-scoped package containing project ID, version, digest, Releases,
sitemap, feature definitions, user flows and decisions. The package is immutable after
publication. The current `PlanningManifest` v1 envelope is its serialization contract.

## Explicit receipt

The receiving project records:

- `consumedVersion` (`PlanningLock.manifestVersion` in v1)
- `consumedDigest` (`PlanningLock.digest` in v1)
- `acceptedAt` (`PlanningLock.importedAt` in v1)

Receipt requires complete schema, project identity, version and digest validation before an
atomic lock replacement. Ordinary build, check, watch and agent hooks remain read-only.

## Update proposal behavior

- Added definition: show as new and propose Spec/work analysis.
- Changed definition: identify changed fields and linked project-owned artifacts for review.
- Removed definition: mark remaining Spec/work as orphan; never auto-delete.
- Invalid package: retain current Planning Lock and last-good projection.

No added, changed or removed definition directly edits project-owned source. A human adopts
a change proposal before the relevant owner updates that source.

## Explicit non-scope

This contract does not implement a standalone repository, network publish/pull transport,
cross-repository write, bidirectional merge or automatic PR creation/merge.
