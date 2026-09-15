# Project Detail and Source-Record Contract

## Content roles

Give each record a distinct job:

- A **project detail** is the primary decision entry point. It lets a reader
  quickly understand the problem, the author's role and responsibility,
  constraints, choices, key implementation, evidence-backed outcome, and
  retrospective limits.
- A **study record** preserves a learning trajectory: the question, references,
  direct experiments, how understanding changed, what conditions affect
  application, and what remains to verify.
- An **insight** expands one question that originated in a project or study. It
  explains the reasoning deeply enough to transfer the judgment to another
  situation.

Do not make the source record and insight repeat the same long narrative. Keep
the overall story and navigation context in the project or study; keep one
focused question, its analysis, and reusable decision criteria in the insight.

## Paired project-case replacement copy

When both records need replacement copy:

- The project gives the project-wide role, problem, choice, and result summary.
- The insight frames one narrow question, analyzes it, states the transferable
  decision rule, and gives an explicit apply/avoid boundary.
- The insight does not repeat the project's full role, chronology, alternatives,
  and result even when every repeated fact is accurate.

Before completion, compare the proposed paragraphs and record which project-wide
details were removed from the insight. A generic "facts match" result is not a
duplication check.

## Evidence authority

Use the canonical source precedence, evidence classes, confidentiality
boundary, and instruction-trust boundary in
[evidence-and-linking.md](evidence-and-linking.md). An older public sentence
does not outrank an approved correction, and a new editorial preference does
not override evidence.

## Record-specific co-authoring questions

Ask only what prior approved answers do not already settle, but always cover
the owner's unresolved authorial choices before changing public copy.

For a **project detail**, ask about:

- the decision or contribution the owner most wants a reader to remember;
- the exact responsibility boundary and any collaboration to preserve;
- mistakes, uncertainty, or sensitive limits they want disclosed and at what
  level;
- the outcome they consider meaningful and the evidence boundary; and
- what they would repeat, change, or investigate now.

For a **project-case insight**, ask about:

- the one question that deserves a separate article;
- why the decision mattered in that incident;
- the transferable apply condition and the explicit avoid boundary;
- which project context should not be repeated; and
- whether a visual would improve their intended explanation.

For a **study record or technical-exploration insight**, ask about:

- the personal learning trigger and question;
- which statements came from references and which came from direct experiment;
- the point where understanding changed;
- the current apply and avoid conditions; and
- what the owner wants to verify next.

After drafting, show the affected record's reader role and representative or
full replacement copy. Ask for explicit content approval and keep the record
pending until the owner approves it. A feature, implementation, or test approval
does not satisfy this gate.

## Project-detail authoring boundary

For a project detail, make the reader able to answer:

- What real problem existed, and when?
- What was the author's actual role and responsibility?
- What constraints limited the decision?
- What alternatives were actually considered?
- What was actually selected and implemented?
- What evidence supports the result, and what was not measured?
- What would the author repeat, change, or verify next?

Use only as many linked insights as the evidence supports. Do not impose a
portfolio-wide count. Each insight needs a distinct question and its own
evidence boundary.

## Study-record authoring boundary

Keep chronology and learning change in the study rather than duplicating it in
the linked insight. Distinguish material learned from references from behavior
observed in direct experiments. Record conditions, failed hypotheses, and
remaining experiments when they materially shaped the conclusion.

The linked technical insight may summarize the relevant experiment, but should
focus on the narrower concept, comparison, or application decision that the
study produced.

## Multi-record copy deliverable

When a request asks to edit or propose copy for multiple linked records, provide
both of these labeled artifacts for each record:

1. `Screen role/overview` describing that screen's distinct reader purpose.
2. `Representative replacement paragraph` containing at least one concrete
   proposed paragraph.

If evidence cannot support a paragraph, replace that artifact with
`Blocked — missing evidence: <exact evidence>` for that record. Matrices,
metadata recommendations, or a paragraph for only one side never satisfy a
multi-record copy request. Study replacement copy preserves dated learning and
how understanding changed; insight replacement copy analyzes its one question
without copying the study chronology.

## Paired feature scope

For future project migrations, keep these activities in one feature scope:

1. user question-and-answer, evidence capture, and authorial-choice record;
2. structured project-detail authoring or correction;
3. insight-candidate assessment;
4. linked insight creation or correction;
5. user review and explicit content approval of the affected copy;
6. source/insight fact and duplication cross-check;
7. public reciprocal-navigation verification.

Do not postpone an affected linked insight solely to ship the project copy
first. If a source correction changes a role, figure, date, cause, alternative,
implementation claim, or outcome:

- a review or audit reports every affected record, contradiction, evidence gap,
  and required correction without editing content; and
- an author, edit, correction, or migration task updates every affected
  in-scope linked record together or blocks the pair from completion.

When a source and insight are both edited, record a separate visual status and
rationale for each record. Re-evaluate the source's current visual rather than
assuming an earlier absence, presence, or scope still applies.
