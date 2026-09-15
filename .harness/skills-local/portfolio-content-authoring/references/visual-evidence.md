# Visual Evidence Contract

## Decide necessity; do not mandate a diagram

Every reviewed record needs one final decision. The status vocabulary is
exactly:

- `not-needed`: prose or an existing table/visual communicates the relationship
  clearly enough;
- `recommended`: a verified visual would materially improve understanding, but
  it is not yet provided;
- `provided`: the article includes a verified and accessible visual.

Never emit `defer`, `proposal`, `candidate`, `conditional`, or another value as
the visual status. `Recommended` is a final decision for the current review; it
may name a future candidate kind in its rationale.

Record a rationale specific to the article. A copied statement such as
"diagrams improve readability" is not a necessity assessment.

When a task edits both a project or study record and its insight, assess each
record separately and write `Visual decision: <final status> — <rationale>` for
each, even when public verification remains pending. Only the insight is
required to persist `visualAssessment` editorial metadata; the source decision
may live in feature verification. One decision cannot stand in for the other.

For each record whose inventory reports a current visual, also record one
explicit existing-visual disposition:

- `retain existing <kind>`;
- `replace existing <kind>`; or
- `remove existing <kind>`.

If the source says a visual is present and no approval or evidence supports its
removal, write `retain existing <kind>`. Do this even when accessibility or
relationship verification leaves `provided` eligibility unconfirmed. Retention
is a present-tense disposition, never a proposal or candidate. Keep missing
`provided` verification in the public matrix and choose the separate final
visual status from the three allowed values based on current evidence.

## Required visual necessity inventory

Complete this inventory for each reviewed record before choosing its visual
status. For every row, record the relationship as `present`, `absent`, or
`unknown`, then record evidence status as `supported`, `missing` with the named
evidence needed, or `N/A` with a record-specific reason.

| Inventory row | What to inspect separately |
| --- | --- |
| Actors and components | Count and ownership or trust boundaries. |
| Parallel paths | Concurrent or alternative execution paths. |
| Failure paths | Behavior after an operation fails. |
| Retry paths | Whether and how an operation is attempted again. |
| Recovery paths | How service or state returns to an acceptable condition. |
| Data relationships | Entities, ownership, cardinality, and storage boundaries. |
| Alternatives | Number of evidenced options and comparison criteria. |
| Time evolution | Number and meaning of design or operating stages. |
| Existing source visual | Current kind, scope, text alternative, and overlap with this record. |

Do not combine parallel, failure, retry, and recovery into a single "branches"
or "exception paths" statement. `Unknown` requires a named missing-evidence
entry, but an unknown current source visual does not defer the final visual
status; rendered-visual verification and duplication remain separate public
matrix rows.

## Assess the question before the format

First identify the relationship a visual would help the reader answer. Give a
visual stronger consideration when the core includes:

- three or more actors or components crossing ownership boundaries;
- normal, failure, retry, recovery, or compensation paths;
- entity relationships, ownership, cardinality, or storage boundaries;
- state changes whose valid and invalid transitions matter;
- three or more alternatives whose criteria are hard to compare in prose;
- multiple time stages where evolution is the point of the article.

Then choose the smallest suitable kind:

| Reader question | Candidate kind |
| --- | --- |
| Who acts across lanes and where does responsibility move? | swimlane |
| In what call order do components interact? | sequence |
| How do data entities relate? | ERD |
| Where are trust, ownership, or system boundaries? | architecture or data flow |
| Which states and transitions are valid? | state transition |
| How do several alternatives compare? | decision matrix |
| How did a design evolve over time? | timeline |

Do not choose an ERD when there are no evidenced entities or relationships, or
a swimlane for a single linear transformation simply because the page needs a
picture.

## Valid `not-needed` decisions

Use `not-needed` when a short sequential explanation is clearer, a table
already expresses the comparison, or the linked source already contains the
same overall flow. State why prose or the existing evidence is sufficient and
how avoiding another visual prevents duplication.

Also choose final `not-needed` for the current record or change when the
provided relationships do not justify a new visual, or evidence is insufficient
to support a candidate visual. Give that current rationale, mark existing
rendered-visual verification or duplication `missing` separately, and require
reassessment if the source visual later changes. The rationale must explicitly
state that drawing or recommending the diagram could visually strengthen or
legitimize an unsupported claim; "insufficient evidence" alone is incomplete.

Re-open the source's current visual and confirm its scope before relying on
duplication as the rationale. If the source visual changed, reassess both
records instead of carrying forward an older `not-needed` decision.

`not-needed` is a complete editorial decision, not a missing artifact.

## `recommended` is not `provided`

Use `recommended` only when the relationships are evidenced and a candidate
kind follows from the reader question. It is final for the current review while
the named kind remains future work. Do not draw the visual, imply it exists, or
invent missing actors, branches, entities, or causality.

## Requirements for `provided`

A provided visual must include:

- the question it answers;
- relationships grounded in approved evidence;
- clear normal/exception or selected/rejected distinctions when relevant;
- a text alternative that communicates the same essential relationship; and
- a reason it does not duplicate the linked source's visual.

The surrounding prose must remain understandable without seeing the image.
Treat decorative visuals and a copied source diagram as duplication, not
evidence.
