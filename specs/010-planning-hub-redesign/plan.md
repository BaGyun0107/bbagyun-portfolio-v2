# Implementation Plan: Planning Hub 데모·동기화·기능 허브 재설계

**Branch**: `010-planning-hub-redesign` | **Date**: 2026-07-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-planning-hub-redesign/spec.md` and the
approved continuation design
`설계 초안(2026-07-18 정리 — git history)`

## Summary

현재 Node 기반 정적 기능 허브를 workspace-aware planning projection으로 확장한다.
기존 `data/`와 001~009 Spec을 Harness Internal 원본으로 보존하면서, shared
`examples/community-app/`에 격리된 Community Demo를 추가한다. 기존 v1
row/sitemap/relation/flow 계약은 호환 입력으로 유지하고 rich feature detail,
Planning Manifest, Planning Lock, Delivery Evidence, Change Proposal과 workspace
config의 versioned 계약을 추가한다.

서버측 생성기는 각 workspace를 scan/validate/compile/reconcile한 뒤 공통 model을
문서 허브와 Planning Hub의 두 정적 HTML로 직렬화한다. 후속 slice는 planning-owned
FeatureDefinition과 project-owned FeatureWorkItem의 1:N 경계를 추가하고, 기능 정의를
화면 배치 중심 탐색으로, 기능 현황을 작업 Kanban으로 바꾼다. Planning Hub의 일상
navigation은 여섯 제품 보기로 줄이고 delivery evidence는 기능 현황에, package
version/digest·sync·automation은 운영·고급에 배치한다. 사용자 흐름은 goal story,
추적성은 coverage/gap/local neighborhood를 기본으로 사용한다. Claude/Codex Stop
adapter, 선택적 watcher, 수동 sync/check와 CI는 같은 결정론적 코어를 호출하며 계획과
구현 원본은 projection 생성 중 절대 쓰지 않는다.

## Technical Context

**Language/Version**: Node.js 24, ESM JavaScript, browser-native HTML/CSS/JavaScript

**Primary Dependencies**: Node.js standard library (`fs`, `path`, `crypto`), existing
repository scanners/renderers; no new runtime dependency

**Storage**: Versioned JSON source and snapshot files under `data/`, `examples/`,
`specs/`; generated static `docs/index.html` and `docs/planning.html`; ephemeral run/digest state under
`.harness/state/`

**Testing**: `node:test` through `npm test`, isolated temporary-directory contract and
integration tests, deterministic build comparison, browser interaction/accessibility
verification, `mise` validation tasks

**Target Platform**: Local static browser on macOS/Linux and GitHub Actions Linux CI

**Project Type**: Static documentation hub generator plus CLI/check/watch automation

**Performance Goals**: Preserve the existing build contract of fewer than 2 seconds for
500 features, 2,000 feature work items, 100 screens and 50 flows on the test environment;
unchanged input must short-circuit redundant local rebuilds

**Constraints**: No database or mandatory long-running service; no blind cross-source
write; existing v1 data and generated hub remain readable during migration; no demo
fallback in actual downstream mode; graph must have tree/table/text alternatives;
generated outputs cannot retrigger themselves; no new package dependency

**Scale/Scope**: Demo target 6 needs, 14 screens, 12 feature definitions, explicit 1:N
work-item samples and 3 flows; supported regression scale 500 features, 2,000 work items,
100 screens and 50 flows; one or more static workspaces embedded in one generated Planning
Hub plus one generated document reader

## Constitution Check

*GATE: Passed before Phase 0 and re-checked after Phase 1.*

`.specify/memory/constitution.md` is an uninitialized template and contains no enforceable
project-specific principles. The effective gates come from `AGENTS.md` and `.harness`
policies:

- **Plan of record**: PASS — feature state lives in `specs/010-planning-hub-redesign/`.
- **TDD**: PASS — task generation must place contract/integration/render/hook tests before
  each implementation slice.
- **Runtime/package policy**: PASS — preserves root Node 24 and adds no dependency or root
  package-manager change.
- **Source ownership**: PASS — actual `data/`, `specs/`, `.specify/`, `docs/index.html`,
  tests and workflow config remain project-owned; shared demo assets are intentionally
  harness-owned examples.
- **Claude/Codex parity**: PASS — one core implementation with thin event adapters; no
  fictitious Codex `UserPromptSubmit` support.
- **GStack gates**: PASS — no optional decision/review gate is invoked by default.
- **Git safety**: PASS — no commit, merge, reset, destructive operation or cross-repository
  write is part of implementation.
- **Dirty worktree preservation**: PASS — migrations are additive and tests must prove
  current source files are not rewritten.
- **Generated page split**: PASS — both pages are produced from one immutable model and
  strict validation treats them as one projection set.

## Project Structure

### Documentation (this feature)

```text
specs/010-planning-hub-redesign/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── feature-detail.md
│   ├── planning-manifest.md
│   ├── delivery-evidence.md
│   ├── feature-work-item.md
│   ├── planning-package-receipt.md
│   ├── change-proposal.md
│   ├── workspace-config.md
│   └── hub-view-contract.md
├── checklists/
│   └── requirements.md
├── status.yaml
└── tasks.md
```

### Source Code (repository root)

```text
.harness/config/
├── feature-definition-schema.json       # existing v1 compatibility contract
├── feature-detail-schema.json           # new rich definition contract
├── feature-work-item-schema.json        # project-owned implementation work contract
├── planning-manifest-schema.json        # published top-down envelope
├── delivery-evidence-schema.json        # bottom-up facts
├── change-proposal-schema.json          # reviewed reverse proposal
├── hub-workspace-schema.json            # workspace/default/source declaration
├── sitemap-schema.json                   # existing screen hierarchy contract
├── traceability-schema.json              # existing typed links
└── user-flow-schema.json                 # existing actor/goal flow

.harness/scripts/docs/
├── build-hub.mjs                         # workspace-aware orchestrator
├── planning-sync.mjs                     # sync plus explicit --pull entrypoint
├── planning-check.mjs                    # strict merge-ready validation
├── planning-watch.mjs                    # optional debounced local watcher
└── lib/
    ├── canonical-json.mjs                # stable serialization and digest
    ├── scan-workspaces.mjs               # config/default resolution
    ├── scan-feature-details.mjs           # rich detail validation
    ├── compile-planning-manifest.mjs      # top-down compilation
    ├── apply-planning-lock.mjs             # explicit validated atomic pull
    ├── scan-delivery-evidence.mjs         # declared + Spec evidence
    ├── reconcile-planning-delivery.mjs    # status/drift/conflict/proposal projection
    ├── build-workspace-hub-model.mjs      # per-workspace joined model
    ├── normalize-feature-work-items.mjs    # explicit/legacy work-item projection
    ├── aggregate-feature-work-items.mjs    # completion and feature rollups
    ├── build-user-flow-story.mjs           # normal route plus recovery branches
    ├── build-traceability-coverage.mjs     # coverage, gaps and bounded neighborhood
    ├── build-linked-hub-model.mjs         # existing typed relation compatibility
    ├── build-document-projections.mjs     # categorized safe document reader model
    ├── render-markdown-document.mjs       # dependency-free safe Markdown projection
    ├── layout-sitemap-org-chart.mjs       # deterministic horizontal screen layout
    ├── render-docs-page.mjs               # document library static renderer
    ├── render-planning-page.mjs           # six product views plus operations shell
    ├── render-feature-workbench-view.mjs  # placement explorer and work-item status views
    ├── render-user-flow-story-view.mjs    # goal story and ordered alternative
    ├── render-traceability-coverage-view.mjs # dashboard, gaps and local relations
    └── render-hub.mjs                     # shared escaping/shell compatibility exports

.harness/scripts/docs/templates/
└── hub.css                                # planning hub visual system

.harness/hooks/
├── docs-build-on-stop.mjs                 # shared relevant-change adapter core
└── codex-stop.mjs                         # Codex payload adapter, same core

examples/community-app/
├── planning/
│   ├── needs.json
│   ├── sitemap.json
│   ├── feature-definitions.json
│   ├── feature-details.json
│   ├── user-flows.json
│   ├── feature-relations.json
│   ├── decisions.json
│   └── planning-manifest.json
├── downstream/
│   ├── planning.lock.json
│   ├── delivery-evidence.json
│   └── change-proposals.json
└── expected/
    ├── health-report.json
    └── hub-snapshot.json

data/
└── hub-workspaces.json                    # harness preview workspace selection

tests/
├── planning-contracts.test.mjs
├── planning-manifest.test.mjs
├── planning-demo-data.test.mjs
├── planning-sitemap-render.test.mjs
├── planning-feature-detail.test.mjs
├── planning-delivery-evidence.test.mjs
├── planning-reconcile.test.mjs
├── planning-pull.test.mjs
├── planning-workspaces.test.mjs
├── planning-automation.test.mjs
├── planning-check.test.mjs
├── planning-portability.test.mjs
├── planning-feature-work-items.test.mjs
├── planning-feature-workbench-render.test.mjs
├── planning-user-flow-story.test.mjs
├── planning-traceability-coverage.test.mjs
├── docs-page-render.test.mjs              # category/list/reader/hash/page split
├── planning-org-chart.test.mjs            # node/edge/layout/alternative parity
├── feature-hub-render.test.mjs            # extend current render contract
├── feature-hub-sitemap-build.test.mjs     # preserve scale and legacy behavior
├── docs-build-on-stop.test.mjs            # broaden source-group detection
└── codex-stop.test.mjs                    # parity adapter contract

mise.toml                                  # planning sync/check/watch tasks
.harness/scripts/checks/ci-node-verify.sh  # required merge-ready planning check
docs/index.html                            # regenerated document hub
docs/planning.html                         # regenerated Planning Hub
```

**Structure Decision**: Keep the current dependency-free static generator and add small,
testable scan/compile/reconcile modules under its existing `lib/` boundary. Do not route
this harness-owned static UI through the empty `apps/front` or `apps/back` policy shells.
`examples/community-app/` is shared harness example content, while actual planning and
delivery inputs under `data/` and `specs/` stay project-owned.

## Phase 0 Research Decisions

See [research.md](./research.md). The implementation-critical decisions are:

1. JSON is the canonical v1 contract and digest input; optional YAML authoring is deferred.
2. Current row/sitemap/relation/flow v1 data remains readable through compatibility adapters.
3. Planning intent and downstream evidence have separate ownership and are joined without
   source mutation.
4. Workspace config chooses the harness preview default; downstream without config defaults
   to actual project data and never demo fallback.
5. Reconciliation is field- and evidence-aware with explicit proposals, not last-write-wins.
6. Preview is fail-open with stale/error labels; `planning:check` and CI are strict.
7. Stop hooks, optional watcher, manual commands and CI invoke the same sync/check core;
   only an explicit pull mode may atomically update the downstream lock.
8. Guide/project documents use a dedicated list-plus-reader page; planning views move to a
   separate page and the two pages link through stable local fragments.
9. Markdown is projected at build time because `file://` runtime fetch is not reliable; the
   renderer escapes hostile HTML and never executes source markup.
10. The organization chart is a deterministic dependency-free SVG view over the existing
    screen-only sitemap, not a new planning source.
11. FeatureDefinition and FeatureWorkItem remain separate ownership domains with a 1:N
    relationship; work type is explicit and never inferred from titles or paths.
12. Release is a work-item attribute/filter, not a technical split axis or repository field.
13. The immutable planning package is explicitly received through Planning Lock; package
    changes create review proposals and never overwrite project-owned Spec/tasks/work items.
14. Feature-context Kanban is the default status view, with feature-grouped hierarchy over
    the same normalized records as an alternative.
15. Coverage/gap queue and bounded neighborhood replace full matrix as the default
    traceability projection; matrix/CSV remains secondary.

## Phase 1 Design Outputs

- [Data model](./data-model.md): entity fields, ownership, validation and state transitions.
- [Contracts](./contracts/): rich feature definition, manifest, evidence, proposal,
  work item, package receipt, workspace and view behavior.
- [Quickstart](./quickstart.md): TDD and end-to-end validation scenarios.

## Delivery Slices

### Slice 1 — Contract and deterministic foundation

Add versioned schemas, stable JSON serialization/digest, compatibility adapters, workspace
config resolution and strict/preview validation modes. No UI behavior changes until contract
tests fail then pass.

### Slice 2 — Community Demo and workspace projection

Add the isolated demo planning/downstream/expected dataset, compile its manifest and make
the builder emit multiple workspace models while preserving Harness Internal. Validate all
seeded health cases before selecting the demo by default in the harness preview.

### Slice 3 — Separated hub views

Restructure navigation to overview, screen structure, feature definition, user flow,
traceability, delivery and sync. Preserve current document search/detail as an overview
resource. Implement screen-only sitemap first, then rich feature detail and accessible
matrix/flow alternatives.

### Slice 4 — Evidence reconciliation and delivery intelligence

Join manifest lock, declared evidence and scanned Spec/task/verification data. Calculate
definition/delivery/sync status separately and produce drift/conflict/change-proposal
projections without writing either source.

### Slice 5 — Automation parity and strict merge gate

Broaden change classification beyond `specs/`, add manual sync/check and optional watch,
route Claude/Codex Stop through the shared core, and require strict planning validation in
CI. Verify idempotency, timeout recovery and generated-output loop prevention.

### Slice 6 — Documentation, compatibility and extraction readiness

Update the feature hub/normalizer/rule guidance, document future planning-hub extraction,
regenerate the static hub, run legacy and new tests, browser-verify approved layouts and
record verification without creating the external repository.

### Slice 7 — Generated page separation and document reader

Split the current mixed renderer into a document library and a dedicated Planning Hub whose
product navigation is finalized to six views plus operations in Slice 12.
Build a safe categorized document projection, preserve the selected document in a local
fragment and generate both static files from one model. Extend strict stale checks and Stop
generated-output exclusions to the complete page set.

### Slice 8 — Organization chart and shared selection

Add the home-centered horizontal organization layout using the same screen IDs as structure
search, keyboard tree and comparison table. Share selected screen across all structure views
and selected feature across feature definition/status. Browser-verify local navigation,
pan/zoom/fit, responsive layouts and accessibility before convergence.

### Slice 9 — Feature work-item contract and deterministic projection

Add work-item metadata, explicit/legacy normalization, completion guards and Release-aware
feature rollups. Contract and pure-model tests fail first. Invalid records report health
without mutating input; explicit records suppress same-feature legacy projection.

### Slice 10 — Workspace integration and owned demo evidence

Attach work items and rollups to workspace models without changing planning drift semantics.
Extend reconciliation with a work-item health summary only, then seed Community Demo with
frontend/backend/QA work for one feature while preserving intentional drift fixtures.

### Slice 11 — Placement explorer and hybrid status workbench

Render Surface/Screen → group → definition navigation and shared feature selection. Add the
feature-context four-column work-item Kanban and feature-grouped alternative over one client
model. Remove the old feature-level status list only after focused render/client tests pass.

### Slice 12 — Goal flows, scalable traceability and navigation hierarchy

Project flow normal paths and attached decision/failure/recovery branches with an ordered
alternative. Replace default matrix with coverage/gap/local neighborhood. Reduce daily
navigation to six views, move sync/automation to operations and rename the auxiliary tree to
`계층 목록(접근성 보기)`.

### Slice 13 — Responsive system, documentation and convergence

Add semantic CSS/accessibility contracts, update user/agent documentation, regenerate the
two-page set and run focused/full/browser/performance verification. Preserve the existing
T098 five-person usability gate and T101 roadmap/changelog completion gate until the
redesigned screen is validated.

## Continuation File and Test Ownership Boundaries

| Boundary | Source owner | Primary tests | Mutation rule |
| --- | --- | --- | --- |
| Work-item contract/normalization/rollup | project delivery projection | `tests/planning-feature-work-items.test.mjs` | never write planning or delivery input |
| Workspace/reconcile integration | joined generated model | `tests/planning-workspaces.test.mjs`, `tests/planning-reconcile.test.mjs`, `tests/planning-demo-data.test.mjs` | work progress never changes planning drift |
| Definition/status workbench | Planning renderer | `tests/planning-feature-workbench-render.test.mjs`, `tests/feature-hub-render.test.mjs` | client selection/filter only |
| Goal flow story | flow projection/renderer | `tests/planning-user-flow-story.test.mjs` | preserve every source step and broken-reference health |
| Traceability coverage | relation projection/renderer | `tests/planning-traceability-coverage.test.mjs` | bounded active neighborhood; matrix is secondary |
| Navigation/operations/accessibility | Planning page shell/CSS | focused render tests and browser QA | operations does not change product-view selection |
| Generated two-page set | build/check pipeline | `tests/planning-check.test.mjs`, full `npm test` | atomic pair and strict stale comparison |

Implementation work is sequential where files overlap (`render-planning-page.mjs`,
`render-feature-workbench-view.mjs`, `hub.css`). Tests in different focused files may be
prepared independently, but each RED assertion precedes its source implementation.

## Post-design Constitution Check

PASS. Phase 1 and the approved continuation preserve the pre-research gates. The largest
complexity is the set of versioned contracts and new projections, but each corresponds to a
distinct ownership boundary and focused test file. The renderer stays dependency-free;
automation reuses one core; legacy sources are adapted rather than rewritten; and strict CI
validation is separated from fail-open local preview. Package receipt remains explicit and
project-owned sources are never auto-merged.

## Complexity Tracking

No constitution violation. The broad scope is controlled through thirteen independently
tested slices and compatibility gates. A single bidirectional mutable store was rejected
because it would violate the approved planning/downstream ownership boundary. The new
work-item model and specialized render modules are justified by the 1:N ownership boundary,
large traceability scale and independently testable user questions.
