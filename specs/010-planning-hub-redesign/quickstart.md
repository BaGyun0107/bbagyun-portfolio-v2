# Quickstart: Planning Hub 재설계 검증

This guide is executed incrementally during implementation. Test tasks are written first and
must fail before the corresponding production change.

## Prerequisites

- Node.js 24 through the repository `mise.toml`
- current dirty worktree preserved; do not reset unrelated 007-009 changes
- active feature state points to `specs/010-planning-hub-redesign`

## 1. Contract baseline

```bash
mise run test
```

Expected after the contract slice:

- legacy feature/sitemap/relation/flow tests remain green
- valid v1 detail/manifest/evidence/proposal/workspace fixtures pass
- duplicate ID, broken reference, digest mismatch and unsafe path fixtures fail with stable
  diagnostics
- same semantic manifest input produces the same digest repeatedly

## 2. Demo compilation

```bash
mise run docs:build
mise run planning:check
```

Expected:

- Community Demo compiles to the checked manifest and expected health snapshot
- 6 needs, 14 screens, 12 features and 3 flows are present
- seeded missing-feature, definition-gap, missing-Spec, unverified-criterion, 10-vs-4 drift
  and stale-lock cases match expected results
- Harness Internal source files are byte-for-byte unchanged

## 3. Browser acceptance

Open generated `docs/planning.html` and verify:

1. Community Demo is default and visibly labeled `DEMO DATA` in the harness preview.
2. Harness Internal switch preserves existing data and document access.
3. 화면 구조 shows screen-only nodes, solid hierarchy and dotted direct navigation.
4. Tree/table alternatives expose the same screens and edges.
5. 기능 정의 shows `우선순위 P1`, rich behavior/state/acceptance and separate status groups.
6. 사용자 흐름은 정상 경로와 복구를, 추적성은 coverage와 누락을, 기능 현황은
   delivery evidence와 완료 차단을 각각 설명한다.
7. 운영·고급은 package version/digest, sync health, recovery와 automation history를
   표시하며 현재 제품 보기 선택을 바꾸지 않는다.
8. Keyboard-only navigation reaches workspace switch, views, sitemap nodes and detail panel.
9. Narrow and wide viewports do not hide legends, source identity or recovery actions.

## 4. Reconcile acceptance

```bash
mise run planning:check
```

Expected:

- matching planning/evidence → `aligned`
- newer planning digest than lock → `behind`
- planned 10 images vs observed 4 → `drifted` plus proposal
- incompatible changes on both sides → `conflicted`
- invalid/missing evidence → `collection-failed` with last good context
- neither planning nor downstream source is modified

## 4.1 Explicit planning receipt

```bash
mise run planning:pull
```

Expected:

- an invalid, incompatible or digest-mismatched candidate leaves the current lock unchanged
- a fully valid candidate atomically replaces the downstream lock
- ordinary `planning:sync`, watcher and agent Stop paths never advance the lock
- interrupted temporary writes do not become an applied lock

## 5. Automation parity

```bash
mise run planning:sync
mise run planning:pull
mise run planning:check
npm run codex:replay-check
```

Expected:

- manual, Claude Stop and Codex Stop normalize to the same changed-source groups
- relevant changes outside `specs/` trigger sync
- generated `docs/index.html` does not retrigger the sync input set
- generated `docs/planning.html` does not retrigger the sync input set
- no-op input skips redundant writes
- hook failure remains non-destructive and the manual/CI command recovers

Optional local feedback:

```bash
mise run planning:watch
```

The watcher is development convenience only. Stop it before completion; CI remains the
required merge-ready gate.

## 5.1 Document library and page split

Open `docs/index.html` using a local file URL.

1. `#harness` immediately shows the harness guide list and first document body.
2. `#project` immediately shows the project document list and first document body.
3. Selecting a document updates the fragment; reload restores category, title and path.
4. Heading, list, table, link, inline code and code block samples remain readable.
5. The Planning Hub link opens `docs/planning.html` without a nested iframe.
6. Planning sidebar document links return to the requested `index.html` fragment.

Expected build output contains both pages. Temporarily changing either generated file must
make `mise run planning:check` fail; rebuilding restores green.

## 5.2 Organization chart and shared selection

In `docs/planning.html`:

1. 화면 구조 switches between structure search and horizontal organization chart.
2. Community Demo exposes exactly 14 screen nodes; features, Specs and tests are absent.
3. Solid hierarchy and dotted direct-navigation arrows match sitemap source.
4. Pan, zoom and fit keep labels readable; selecting a node opens the same screen detail as
   structure search/tree/table.
5. Select one feature in 기능 정의 and open 기능 현황; the same stable ID remains selected.
6. Repeat at 1280×720, 768×1024 and 375×812 and with keyboard-only input.

## 5.3 Feature work-item contract and rollup

Write the focused tests first, confirm RED, then implement the contract/normalizer/rollup:

```bash
node --test tests/planning-feature-work-items.test.mjs
```

Expected after GREEN:

- one FeatureDefinition accepts multiple explicit FeatureWorkItems
- work types are limited to frontend/backend/db/qa/infra/unspecified
- Release is preserved as a work-item attribute and filter
- duplicate/broken/invalid records produce health without input mutation
- legacy-only evidence yields at most one `unspecified`/`unassigned` item per feature
- zero work is `작업 미생성`; hold is counted without a fifth status column
- requested done remains in review until task, acceptance, evidence and decision guards pass

## 5.4 Placement explorer and work-item status

```bash
node --test tests/planning-feature-workbench-render.test.mjs \
  tests/feature-hub-render.test.mjs
```

Open `docs/planning.html` after GREEN and verify:

1. 기능 정의 is explored by Surface/Screen → feature group → definition.
2. Search matches title, user goal, screen and group; Release/status filters preserve the
   same selected feature ID.
3. `기능 현황에서 보기` opens the same feature context.
4. Kanban has planned, in-progress, in-review and done columns; cards are work items.
5. Hold appears on its base-column card with reason/release condition.
6. 기능별 보기 groups the same filtered work items under each definition.
7. Task, acceptance, code/test evidence and completion blockers appear in selected detail.

## 5.5 Goal flow and scalable traceability

```bash
node --test tests/planning-user-flow-story.test.mjs \
  tests/planning-traceability-coverage.test.mjs
```

Expected:

- each actor/goal card shows a left-to-right normal path
- decision, failure and recovery attach to the source step and preserve screen/feature IDs
- cyclic/broken flows terminate with health and retain the ordered text alternative
- coverage totals and severity-sorted gaps are the default traceability view
- selecting one gap opens a bounded Need/Feature/Screen/Flow/Spec/WorkItem/Verification
  neighborhood
- grouped matrix and CSV remain secondary; the full graph is not active by default

## 5.6 Navigation, operations and package receipt

In `docs/planning.html` verify exactly six product views: 개요, 화면 구조, 기능 정의,
기능 현황, 사용자 흐름 and 추적성. `전달 현황` and `동기화` are not product-view
buttons. Open `운영·고급` and verify package version/digest, sync recovery and automation
history without changing the selected product view.

For package receipt regression, use the existing pull tests and confirm an added, changed,
removed or invalid definition never rewrites project-owned Spec/task/work-item source before
explicit receipt and human proposal adoption.

## 6. Full verification

```bash
npm test
mise run planning:check
mise run docs:build
mise run feature:status:sync
```

The full performance sample is 500 feature definitions, 2,000 work items, 100 screens and
50 flows. The two generated pages must complete under two seconds without external network,
the selected neighborhood must remain bounded and browser console errors must be zero.

Then run browser verification, record checked acceptance results in
`specs/010-planning-hub-redesign/verification.md`, run Spec Kit convergence and update the
root roadmap only after the feature actually meets completion criteria.
