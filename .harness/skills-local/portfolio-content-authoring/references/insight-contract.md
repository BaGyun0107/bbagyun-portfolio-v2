# Insight Contract

## Choose exactly one type

Use `project-case` or `technical-exploration`. Do not create a hybrid, generic,
or public/private type to avoid the source rules.

### Project case

Use `project-case` when the article originates in an actual project decision or
incident. It requires one existing project source and cannot use an independent
reason instead.

Across the whole article, make these meanings discoverable:

- the author's actual role and responsibility;
- the real problem and its time;
- constraints and decision criteria;
- alternatives actually considered, if any;
- the selected approach and implementation performed;
- outcome evidence and its measurement or attribution boundary;
- unverified scope, limitations, and retrospective judgment;
- the originating project record.

### Required project-case re-review matrix

Record `supported` with evidence, `missing` with the specific evidence needed,
or `N/A` with a record-specific reason for every row.

| Row | Evidence required |
| --- | --- |
| Role and responsibility | The author's actual ownership and boundary. |
| Problem and time | The observed problem, discovery path, and relevant date or period. |
| Constraints and criteria | Constraints and the documented decision criteria. |
| Considered alternatives | Only alternatives evidenced as reviewed at the time. |
| Selection and implementation | The selected approach, selection rationale, and implementation actually performed. |
| Outcome evidence | Measurement or report class, baseline, period, attribution, and limits. |
| Limits and retrospective | Named unverified scope and clearly retrospective judgment. |
| Project origin | Existing originating project and reciprocal public relationship. |

A general "needs more evidence" note is not sufficient. Name the missing fact
or artifact before treating the project case as complete.

### Technical exploration

Use `technical-exploration` when the article originates in study, reference
analysis, or direct experimentation. A valid study link is the normal source.

Across the whole article, make these meanings discoverable:

- the learning question;
- external references separated from direct experiments;
- concepts and meaningful alternatives;
- conditions where the approach fits and where it should be avoided;
- limitations and further verification;
- the originating study record or an approved independent reason.

### Required technical-exploration re-review matrix

Complete this matrix even when the final type or publication decision is
deferred. Record `supported` with evidence, `missing` with the specific evidence
needed, or `N/A` with a record-specific reason for every row.

| Row | Evidence required |
| --- | --- |
| Learning question | The question the study or article actually investigates. |
| External references | Dated primary or named reference material, explicitly separated from author-run observation. |
| Direct experiments | Author-run setup and observations, explicitly separated from referenced claims; use `missing` when none can be evidenced. |
| Concepts and alternatives | Concepts and alternatives actually compared, without inventing historical review. |
| Apply conditions | Conditions where the conclusion is supported. |
| Avoid conditions | Conditions where it should not be applied or remains unsafe to generalize. |
| Limits and further verification | Unverified scope and the next evidence needed. |
| Origin disposition | Existing study, approved independent reason, or deferred source decision with the missing evidence named. |

Do not merge external references and direct experiments into one generic
"evidence" row. Deferring classification does not defer this separation.

## Common semantic contract

Every reviewed insight should communicate:

- the core question and conclusion;
- background and problem awareness;
- constraints and decision criteria;
- analysis, comparison, or solution process;
- outcome evidence or application criteria;
- limits and reflection;
- the related origin record.

These are meanings, not mandatory Markdown headings or a mandatory order.
Retain natural, topic-specific headings when they already communicate the
contract. Do not rewrite two different articles into identical section names
for visual consistency alone.

## Independent technical insight gate

An independent exception is only for an existing technical article whose
project or study origin cannot be supported after a real evidence search. It is
not a shortcut for a missing link.

Approve the exception only when the reason:

- is non-empty and specific to why the article remains independently valuable;
- describes its evidence and editorial boundary;
- explains why no existing project or study is an honest origin; and
- is stronger than preferences such as "good content" or "keep it public."

If those conditions are not met, classify the article as a merge or unpublish
review candidate. Preserve its route and body pending explicit user approval;
do not auto-delete or fabricate a source.

When there is no study source and this gate fails, do not assign or finalize an
insight type and do not produce publishable editorial metadata. Write
`Classification/type/source metadata: missing/deferred`, preserve the existing
route and body, and never output a metadata patch containing
`type: technical-exploration`. The technical-exploration matrix remains only a
provisional review lens; its completion does not approve classification. Make
the final visual decision independently using the three allowed visual values.
Also state exactly: `Public source rendering: no empty source
link/card/placeholder; route/body preserved.` A missing source must not create
an empty or "unclassified" public source UI.

## Source and duplication checks

- A project case must not carry a study origin.
- A technical exploration must not carry a project origin.
- A study link and an independent reason are mutually exclusive.
- A linked insight and source must navigate to each other publicly.
- An insight should not copy the source's long chronology, complete project
  narrative, or visual. Summarize only the context needed to analyze its one
  question.

For paired project-case replacement copy, the project summarizes project-wide
role, problem, choice, and result. The insight states one narrow question, its
analysis or decision rule, and explicit apply/avoid boundary. It must not repeat
the project's full role, chronology, alternatives, and result merely because
the facts agree. Record a dedicated replacement-copy duplication check before
completion.

At the public gate, report long-form duplication and visual duplication as two
separate results. Re-open the current source record and its visual before the
check; an earlier assessment does not prove the current pair is non-duplicative.

Do not require the same number of insights per project. A candidate becomes an
insight only when it has a distinct question, sufficient evidence, and enough
analysis to stand on its own.
