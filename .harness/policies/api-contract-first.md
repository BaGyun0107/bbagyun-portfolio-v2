# API Contract-First Policy (Front/Back Parallel Work)

This policy governs parallel frontend/backend work in `split-front-back`
projects: the frontend may build against mock data before the backend
endpoint exists, but only inside the anchoring chain defined here.

## The Anchoring Chain

Three layers, each anchored to the one above it:

1. **DB schema** — the single source of truth. The schema is whatever the
   backend already owns in `apps/back` (migrations, ORM entities, Prisma
   schema). Do NOT maintain a separate schema copy for this policy; a
   second copy creates a second source of truth and defeats the gate.
2. **API contract** — `api-contracts/<domain>.md` files (template:
   `.harness/skills/codi-backend/resources/api-contracts/`). Every
   response field must be anchored to the schema layer.
3. **Frontend mock** — mock data used while the real endpoint does not
   exist yet. Mocks may only use fields present in an agreed contract.

Reading across the boundary is always allowed: a frontend session may
read `apps/back` schema files to verify anchoring. Only editing the
other side's app surface is restricted.

## Field Anchoring Rules

Every field in a contract response schema must declare its basis:

- **Stored**: maps to a real column — annotate as `table.column`.
- **Derived**: computed from stored fields — annotate as
  `derived(<source fields or rule>)`, e.g. `derived(order.price * order.qty)`.
- No basis: the field may not enter the contract. See the stop rule.

## Stop Rule: No Schema Basis, No Mock

When frontend work needs a field, resolve it in this order:

1. The field is in an agreed contract: proceed with the mock.
2. Not in a contract, but the schema has it (verified by reading
   `apps/back` schema files): propose a contract addition, then proceed
   once agreed.
3. Not in the schema either: **stop**. Do not invent the field in mock
   data. File a request to the backend owner (see request flow below).
   Silent mock-only fields are how frontends drift from reality.

An agent that hits case 3 must say so explicitly instead of continuing
with invented data. The user may explicitly approve a
prototype-only exception; record that approval in the contract file as
`status: prototype-only` so it is visibly not backend-agreed.

## Request Flow (Frontend to Backend)

Contracts travel through git, so the flow works across separate clones:

1. The requesting side drafts or edits `api-contracts/<domain>.md` with
   `status: proposed` and the anchoring annotations it can verify.
2. The draft is committed on the requester's working branch and lands in
   the shared repo through the normal PR flow.
3. The backend owner reviews: fields anchor to the schema (or a planned
   migration named in the contract), then flips `status: agreed`.
4. Backend implements exactly the agreed contract; frontend replaces the
   mock with the real endpoint and deletes the mock.
5. Any change after `agreed` goes back to step 1 as a new proposal —
   neither side may unilaterally diverge from an agreed contract.

## Greenfield: When No Schema Exists Yet

An empty schema does not block work; it forces the order. The schema
slice for the current feature becomes the first deliverable:

1. Feature planning defines the data model for this feature only.
   Schema grows migration by migration, feature by feature — do not
   design the whole database up front.
2. Either side drafts the contract with `status: proposed`. A
   frontend-authored draft is a valid schema request: it tells the
   backend owner what shape the UI needs.
3. The backend owner's first deliverable is the schema skeleton
   (migration/entity files only — endpoint logic may be zero lines),
   then flips the contract to `agreed` with real `table.column` anchors.
4. From `agreed`, work is fully parallel: frontend builds mocks and UI
   while the backend implements the endpoint.

Mocks start only after `agreed` (strict mode is this team's default).
While a contract is in review, frontend work that does not depend on
the data shape (layout, routing, design-system states, other features)
is not gated by this policy.

## Mock Data Rules

- Mocks live under `apps/front` only, clearly separated (for example a
  `mocks/` module or MSW handlers), never inline in components.
- Each mock cites its contract: a comment naming
  `api-contracts/<domain>.md` and the endpoint it stands in for.
- Mock shape must match the agreed contract exactly — same field names,
  same types, same nullability. A mock is a contract test, not a sketch.
- When the real endpoint ships, the mock is deleted in the same change
  that wires the real call. Stale mocks are drift.

## Enforcement and Runtime Mirrors

This policy is documentation-only by design. Whether a mock field has a
schema basis is a semantic judgment; no hook or Codex execpolicy prefix
rule can inspect it (execpolicy too weak — it sees command prefixes, not
data lineage). Compensating controls:

- Distribution is skill-trigger based: `codi-frontend` and `codi-backend`
  both point here, and both skills are shared by Claude Code and Codex,
  so the rule reaches both runtimes without a native mirror.
- The contract file itself is the reviewable artifact: PR review of
  `api-contracts/*.md` (plus optional CODEOWNERS on `apps/*`) is the
  human gate.
- Template and completion checklist:
  `.harness/skills/codi-backend/resources/api-contracts/README.md`.
