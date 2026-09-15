# Portfolio Editorial Standard

Use the project-owned `portfolio-content-authoring` skill whenever creating,
editing, migrating, fact-correcting, or reviewing portfolio project details,
study records, or insights.

Preserve these invariants:

- Apply evidence in this order: approved interview, the relevant feature
  record, this editorial standard and skill, then the existing public copy.
- Classify a reviewed insight as either `project-case` or
  `technical-exploration`; do not invent a third type or force identical
  Markdown headings.
- Link every insight to its originating project or study when evidence supports
  the link. An independent technical insight needs a recorded, evidence-backed
  reason; otherwise keep it as an explicit merge or unpublish review candidate
  without deleting it.
- Treat a source record and its linked insights as one fact contract. A change
  to roles, figures, dates, causes, alternatives, or outcomes requires a paired
  cross-check in the same feature.
- Use the approved-copy fast path when the owner and agent have completed the
  question-and-answer pass, named the exact records, and approved the exact
  wording, and the edit changes only existing public text. Apply only that copy
  without a Size declaration, Spec Kit expansion, an auto-loop, or E2E. Verify
  the edited record with a scoped read-back and diff. Return to normal routing
  when the change affects schema, UI or rendering behavior, routes or links,
  navigation or accessibility, visual implementation, or facts outside the
  approved wording.
- Require a reasoned visual-necessity decision, not a diagram. Never fabricate
  relationships or repeat a source record's visual merely for decoration.
- Preserve public routes and verify source-to-insight and insight-to-source
  navigation unless the user separately approves a visibility or route change.

Keep detailed procedure and examples in the skill rather than expanding this
always-on rule.
