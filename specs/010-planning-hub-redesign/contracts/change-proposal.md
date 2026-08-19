# Contract: Change Proposal v1

## Purpose

Represent an evidence-backed difference between approved planning and observed delivery for
human disposition. A proposal never edits planning or implementation source by itself.

## Required fields

- proposal ID and target typed entity
- field path
- planned and observed values
- one or more evidence references
- rationale, proposer and decision owner
- status and timestamps
- decision reason and resolution after review

## Allowed resolutions

- `implementation-fix`: keep plan, change downstream
- `planning-change`: review and update planning source in its own workflow
- `defer`: retain difference with reason/condition
- `reject`: observed evidence or proposal is not accepted

## Conflict rules

- One-sided downstream difference → drift/proposal.
- Planning updated after consumed digest → downstream behind.
- Both sides changed incompatibly → conflict; no auto-resolution.
- Deleted/renamed ID without alias/migration → broken reference plus proposal/decision need.

