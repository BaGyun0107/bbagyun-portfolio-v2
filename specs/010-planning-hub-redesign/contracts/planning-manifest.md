# Contract: Planning Package / Manifest v1

## Purpose

Publish an immutable, validated project package of planning-owned intent for explicit
downstream receipt. `PlanningManifest` is the current v1 envelope for `PlanningPackage`.

## Envelope

Required: schema version, manifest version, project ID, source revision, generated time,
digest algorithm, digest, Releases, needs, screens, feature catalog, feature details, flows, typed
relations and planning decisions.

## Digest

1. Remove `digest` and volatile `generatedAt` from the digest payload.
2. Canonically serialize supported JSON values.
3. Hash with SHA-256 and prefix the encoded result with `sha256:`.
4. Recomputing the same semantic payload must return the same digest.

## Validation

- All stable IDs are unique in their type scope.
- All relation endpoints, screen direct-navigation targets and catalog detail references exist.
- Feature details and catalog identity/lifecycle values do not conflict.
- Screen hierarchy is acyclic.
- User-flow entry/next references are valid and decision branches are labeled.
- Manifest data contains no command, secret value or path outside the declared source root.

## Consumption

- Downstream records exact version/digest in Planning Lock.
- The receipt time is written only after complete candidate validation and explicit adoption.
- A new available manifest does not silently replace an applied lock.
- Ordinary sync/check/watch/agent-hook runs are read-only with respect to Planning Lock.
- An explicit pull validates the entire candidate first, writes a complete temporary lock and
  atomically replaces the applied lock only after every validation succeeds.
- Pull validation or replacement failure preserves the previous lock and last good projection.
- Schema versions unsupported by the consumer produce `collection-failed`/incompatible state.
- Preview may retain the last good manifest; strict check fails the invalid current source.
- Receipt never creates or rewrites downstream Spec, task, FeatureWorkItem or verification
  evidence. Package differences produce review proposals only.
