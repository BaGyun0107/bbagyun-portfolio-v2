# API Contracts

Template for `api-contracts/<domain>.md` files used during front/back
parallel work. Policy (anchoring chain, stop rule, request flow):
`.harness/policies/api-contract-first.md`.

## Usage

Contracts are plain committed markdown files in the project repo (for
example `docs/api-contracts/` or a location the team fixes once). They
travel through git and PRs, so they work across separate clones.

- **Requester** (usually frontend): drafts the contract with
  `status: proposed` before building mocks.
- **Backend owner**: reviews anchoring against the `apps/back` schema,
  flips `status: agreed`, implements exactly as specified.
- **Consumer** (frontend/mobile): builds types and mocks from the agreed
  contract only.

## Contract Format

```markdown
# {Domain} API Contract

Status: proposed | agreed | prototype-only

## POST /api/{resource}
- **Auth**: Required (JWT Bearer)
- **Request Body**:
  ```json
  { "field": "type", "field2": "type" }
  ```
- **Response 200**:
  ```json
  { "id": "uuid", "field": "value", "created_at": "ISO8601" }
  ```
- **Field anchoring** (required for every response field):
  - `id` — {table}.id
  - `field` — {table}.{column}
  - `total` — derived({table}.price * {table}.qty)
- **Response 401**: `{ "detail": "Not authenticated" }`
- **Response 422**: `{ "detail": [{ "field": "error message" }] }`
```

## When to Create

- **New API endpoint**: contract exists before frontend mocks or backend implementation start
- **Existing API schema change**: update the contract first (back to `status: proposed`), then notify the other side
- **Cross-platform feature**: contract must exist before backend/frontend/mobile tasks start

## Completion Criteria

- [ ] Request schema defined with all required/optional fields
- [ ] Response schema defined (200, 201, etc.)
- [ ] Every response field anchored: `table.column` or `derived(...)`
- [ ] Error cases documented (400, 401, 403, 404, 422, 500)
- [ ] Authentication requirements specified
- [ ] Rate limiting noted (if applicable)
- [ ] Backend owner reviewed anchoring against `apps/back` schema and set `status: agreed`
- [ ] Consumer side reviewed and approved

## Rules

1. Contract before implementation: no frontend mock and no backend endpoint without a contract
2. Backend must not implement differently from the agreed contract
3. Frontend/mobile defines types and mocks from the agreed contract only
4. A field with no schema basis may not enter the contract — stop and request a schema change first (see the policy's stop rule)
5. Changes after `agreed` go back to `proposed` and through review again
