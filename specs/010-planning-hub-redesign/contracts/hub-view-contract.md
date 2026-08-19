# Contract: Planning Hub Views

## Navigation

Primary views are:

1. 개요
2. 화면 구조
3. 기능 정의
4. 기능 현황
5. 사용자 흐름
6. 추적성

`운영·고급` is a secondary disclosure, not a seventh product view. It contains planning
version/digest, sync health and recovery, and automation run history. Delivery evidence is
shown in feature status and overview rather than a separate product view.

`docs/index.html` is the document library. `docs/planning.html` owns the views above. Both
pages expose direct local links to the other page; no iframe or collapsed legacy hub is used.

## Document library

- Sidebar categories: 하네스 가이드, 프로젝트 문서, Planning Hub link.
- Desktop layout: category sidebar, filtered document list, selected body reader.
- Selection fragment: `#harness[:encoded-path]` or `#project[:encoded-path]`.
- Supported body projection: headings, paragraphs, lists, tables, links, inline code and
  fenced code blocks.
- Conversion failure keeps other documents available and shows source path plus recovery.

## Screen structure

- Default node set: screens/content destinations only.
- Solid edge: parent-child hierarchy.
- Dotted edge: direct/cross navigation.
- Node color: surface, never delivery status.
- Selected detail: stable ID, type, parent, route, access, direct navigation and links to
  feature, flow and feature-status evidence views.
- Required alternatives: diagram, keyboard tree, comparison table.
- The keyboard tree is labeled `계층 목록(접근성 보기)` because it is the accessible text
  alternative to the same sitemap, not a second sitemap.
- Secondary organization view: deterministic horizontal root/branch/descendant layout.
- Organization hierarchy is solid; direct navigation is a dotted arrow; surface uses color
  plus a text legend.
- Structure search, organization view, tree and table share selected screen ID.

## Feature definition

- Three bounded regions: Surface/Screen structure, selected-screen feature groups/list and
  selected rich definition detail.
- Search covers feature title, user goal, screen, group, linked status and target Release.
- Definition cards lead with placement and feature group, then linked work-item distribution;
  priority is secondary metadata.
- Applicable behavior states and acceptance verification gaps are explicit.
- Feature definition and feature status share selected feature ID.

## Feature status

- The default is selected feature context plus four-column work-item Kanban: planned,
  in-progress, in-review and done.
- Board cards are filtered to the selected feature by default. Showing every work item
  requires the explicit labeled `전체 작업` scope toggle; implicit full display is not
  allowed, and the active scope is announced by a visible label.
- Cards represent FeatureWorkItems, not FeatureDefinitions. Hold is a labeled condition on
  the base column.
- The alternative groups the same items under FeatureDefinition.
- Release, feature group, work type, hold and query filters operate on the same normalized
  client records.
- Task, code, acceptance and verification evidence plus completion blockers appear in card
  detail.

## User flow

- Actor and goal identify each story card.
- The normal route is left-to-right; decision, failure and recovery attach to their source
  step and preserve screen/feature IDs.
- Ordered text alternative exposes all source steps and branches. Role swimlanes are
  secondary and appear only when ownership data exists.

## Traceability

- Coverage totals and a severity-sorted gap queue are default.
- Selecting a gap/feature opens only the bounded Need, Feature, Screen, Flow, Spec,
  FeatureWorkItem and Verification neighborhood.
- A grouped matrix and filtered CSV export remain secondary diagnostics.
- Broken, duplicate and orphan relations identify source, impact and recovery.

## Operations and evidence

- Overview summarizes project-wide implementation and verification readiness.
- Feature status owns task/code/test/verification evidence and blocking next actions.
- Operations shows package version/digest, last success, stale/failure/conflict, recovery and
  automation history without changing the selected product view.

## Accessibility and language

- Color is never the only signal.
- Interactive nodes are keyboard-operable and expose accessible names.
- P1/P2/P3 accessible name includes `우선순위`.
- User-facing text is Korean; schema keys and stable IDs are English.
