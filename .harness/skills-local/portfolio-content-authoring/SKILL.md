---
name: portfolio-content-authoring
description: Use when creating, editing, migrating, fact-correcting, or reviewing portfolio project details, study records, or insights, including requests limited to one linked record, standardized headings, independent articles, diagrams, public copy, or changes to roles, figures, dates, causes, and outcomes.
---

# Portfolio Content Authoring

Keep source records and insights trustworthy: the portfolio owner is a
co-author, a project or study supplies context, and an insight deepens one
reusable question.

## Load the relevant contracts

Read [evidence-and-linking.md](references/evidence-and-linking.md) for every
task. Read [project-detail-contract.md](references/project-detail-contract.md)
for source records; for insights also read
[insight-contract.md](references/insight-contract.md) and
[visual-evidence.md](references/visual-evidence.md). Load only relevant
interview/feature evidence; public copy is not approval.

## Authoring workflow

Determine the requested mode first:

- **Review/audit**: report affected records, contradictions, gaps, and blockers;
  do not edit unless mutation was requested. A read-only audit may proceed
  without an interview, but its findings are not approved replacement copy.
- **Author/edit/correction/migration**: correct every affected in-scope record
  together or block completion when evidence, user input, or content approval
  is missing.

## User co-authoring gate

Treat project details, study records, and insights as the portfolio owner's
account, not copy that an agent may finalize from files alone. For every new
record, migration, or substantive public-content edit:

1. Reuse approved interview answers and exact corrections so the user does not
   repeat settled facts. Then ask focused questions for unresolved facts and
   authorial choices: intended emphasis, mistakes and limits to disclose,
   decision or learning rationale, present retrospective, transferable or
   avoid conditions, and visual preference when relevant. Use the record-
   specific prompts in `project-detail-contract.md`.
2. Do not write or mutate final public copy before this question-and-answer
   pass. A non-public evidence matrix or clearly labeled draft may be prepared,
   but never infer the owner's opinion from existing copy, tests, agent
   consensus, or technical documentation.
3. Present the answer-backed draft or representative replacement copy and ask
   for explicit content approval. Apply the approved copy and declare the
   content complete only after that approval. If the user requests revisions,
   continue the question-and-answer loop and re-present the affected copy.

Workflow approval is not content approval. Spec Kit clarify being skipped and
approval of a design, spec, plan, tasks, implementation start, test result, or
technical merge do not waive either co-authoring gate. If asked to proceed
without questions, preserve current public copy and ask the smallest set of
material questions instead of silently authoring.

When the user supplies exact final wording and an exact change scope, that
message is both an answer and approval for that wording only; do not ask them
to repeat it. Any surrounding sentence, new interpretation, emphasis,
retrospective, or linked-record rewrite composed by the agent still requires
the question-and-answer and content-approval gates.

When reporting a pending co-authoring gate, always state which prior answers or
exact wording will be reused, ask the smallest unresolved record-specific
questions, explicitly name `Spec Kit clarify` and state that skipping it does
not replace the content interview, state that technical workflow approvals do
not replace content approval, and explain that the answer-backed draft will
return for explicit approval before public mutation or completion.

## Approved-copy fast path

Use a direct content-only edit once the question-and-answer pass has identified
the exact record or records, the owner has approved the exact final wording,
and no unresolved fact or authorial choice remains. The editorial decision has
already been made with the owner, so repeating product delivery gates does not
add evidence to a literal copy replacement.

On this path:

- apply only the approved text to the named existing fields and records;
- do not declare or calculate a Size, create or extend Spec Kit artifacts,
  start an auto-loop, or run E2E;
- verify with a scoped read-back and diff, plus only the narrow syntax or static
  check needed by the edited file format; and
- do not broaden the edit to surrounding prose or linked records unless they
  are named in the approved scope.

Leave the fast path and use normal repository routing when the work changes a
schema, type, validator, component, layout, rendered visual, route or link
target, navigation or accessibility behavior, or introduces a fact not covered
by the approved wording. If a linked record exposes a contradiction, report it
and ask to expand the copy scope instead of silently turning the edit into a
larger feature.

Then follow this order. Never fill a gap with a plausible claim.

1. **Evidence** — Locate the approved interview, relevant feature artifacts,
   source record, linked records, and current public copy. Resolve conflicts by
   the precedence and evidence classes in `evidence-and-linking.md`. If public
   replacement copy lacks evidence, only remove or narrow the unsupported claim;
   put the exact evidence gap in the non-public matrix, not new technical advice.
2. **Type** — Identify a provisional `project-case` or
   `technical-exploration` review lens. Do not finalize it until the source gate
   passes, and do not add a hybrid or convenience type.
3. **Source** — Validate a project origin for a project case or a study origin
   for a technical exploration. The independent gate applies only to an
   existing technical article with no evidenced origin. If no study exists and
   the independent reason fails, set classification/type/source metadata to
   `missing/deferred`, preserve route and body, and never output a type-bearing
   metadata patch. State `Public source rendering: no empty source
   link/card/placeholder; route/body preserved.` Keep the final visual decision
   separate.
4. **Meaning** — Complete the applicable semantic matrix. Preserve natural
   headings and order; semantic coverage, not heading equality, is required.
5. **Visual** — Complete the inventory, then give each reviewed source and
   insight its own final status: exactly `not-needed`, `recommended`, or
   `provided`, even while public checks are pending. Never use defer, proposal,
   candidate, or conditional as a status. Insufficient relationships or
   evidence mean `not-needed` now with a specific rationale; track unresolved
   rendered-visual verification separately. The rationale must say a diagram
   could visually strengthen or legitimize the unsupported claim. Also state
   whether each existing visual is retained, replaced, or removed.
6. **Cross-check** — Compare roles, figures, baselines, dates, causes,
   alternatives, implementation, outcomes, limits, and duplication. A review
   reports affected records without editing; a mutation corrects all affected
   in-scope records in the same feature or blocks completion. For paired
   project-case replacement copy, keep the project as a project-wide summary;
   make the insight one narrow question, analysis/decision rule, and apply/avoid
   boundary. Remove repeated full role, chronology, alternatives, and result,
   then record the duplication check before completion.
7. **Public verification** — For the approved-copy fast path, use the scoped
   read-back and diff above; rendered E2E is not required. Otherwise exercise
   the required public matrix against the rendered records, including actual
   reciprocal movement, keyboard behavior, responsive widths, and separate
   long-form and visual duplication gates.

## Deliverable expectations

Keep a compact editorial decision record with these required artifacts:

- semantic coverage, including the technical-exploration re-review matrix, in
  `insight-contract.md`;
- visual necessity inventory in `visual-evidence.md`; and
- public verification matrix in `evidence-and-linking.md`.

Also record scope, evidence classes and gaps, type/source disposition, and the
accept/reject/defer result for unsupported replacement copy. Record the
question-and-answer source for authorial choices and whether explicit content
approval is pending or granted. Every matrix row must be `supported` with
evidence, `missing` with the exact evidence or action needed, or `N/A` with a
record-specific reason. A blank or generic unknown blocks completion.

When an independent reason fails, the deliverable must say
`Classification/type/source metadata: missing/deferred`, preserve route/body,
and contain no type-bearing metadata patch. The technical matrix is only a
provisional review lens.

Write a separate `Visual decision: <final status> — <rationale>` for every
reviewed source and insight. Public replacement paragraphs may only narrow or
remove unsupported claims; absent criteria, metrics, mechanisms, retry
strategies, and alternatives belong in non-public missing-evidence rows.

When copy is requested for multiple linked records, deliver for every record a
labeled screen role/overview and at least one labeled representative
replacement paragraph, or explicitly block that record with the exact missing
evidence. Matrices never substitute for copy. Study copy preserves dated
learning and change; insight copy focuses on its one question.

Metadata consistency is not public evidence; exercise rendered routes and
links.

Do not auto-delete, merge, unpublish, rename a route, or turn a visual
recommendation into an implementation without the corresponding user approval.
