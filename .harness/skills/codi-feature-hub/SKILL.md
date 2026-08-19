---
name: codi-feature-hub
description: Use when working on the document hub, Planning Hub, feature definitions, feature status, sitemap, Delivery Evidence, Planning Lock, docs:build, planning:check, registry.json, or Korean requests containing 기능 허브, 기능정의서, 기능 현황, or 사이트맵.
---

# Codi Feature Hub

Use this skill to maintain the generated document library, integrated Planning Hub,
and feature-status workflow without confusing human-owned sources with projections.

## Generated Page Set

`mise run docs:build` scans the source/model once and generates two self-contained
pages:

| Output | Purpose | Local entry points |
| --- | --- | --- |
| `docs/index.html` | Document hub with Harness/Project categories, search, and reader | `docs/index.html#harness`, `docs/index.html#project` |
| `docs/planning.html` | Planning Hub with definition and delivery status in one workspace | `docs/planning.html` |

Never edit either HTML file directly. Change Markdown, Specs, planning data, or
downstream evidence and rebuild.

The document hub renders repository Markdown safely and keeps source-relative
Markdown links inside the reader. The Planning Hub has exactly six product views:
overview, screens, features, status, flows, and traceability. `운영·고급`
(operations) is a secondary disclosure, not a seventh view — it holds planning
package version/digest, sync health with recovery actions, and automation run
history, and toggling it never changes the selected product view. Delivery
evidence (task/code/acceptance verification and completion blockers) is absorbed
into feature status cards/detail and the overview summary; there is no separate
delivery or sync product view. The screen view offers structure,
organization-chart, `계층 목록(접근성 보기)` tree, and table presentations over
the same screen IDs. Feature definition and feature status share one selected
feature ID, so selecting a feature updates both views instead of creating
parallel records. The status Kanban defaults to the selected feature's work
items; the explicit `전체 작업` scope toggle shows every work item. Traceability
defaults to coverage totals plus a severity-sorted gap queue with a bounded
selected-feature neighborhood; the full matrix and CSV export stay collapsed as
secondary diagnostics.

A FeatureDefinition owns what to build and never stores implementation status; it
relates 1:N to project-owned FeatureWorkItems. Release is a work-item attribute
(never a repository location on the definition), and legacy delivery evidence
without explicit work items is projected as at most one `unspecified` work item
per feature.

## Renderer and Build Contract

The exact implementation entry points are:

- `.harness/scripts/docs/build-hub.mjs` scans source/model once, calls both
  renderers, and owns the generated page-set transaction.
- `.harness/scripts/docs/lib/build-document-projections.mjs` creates safe Markdown
  projections for the document reader.
- `.harness/scripts/docs/lib/render-docs-page.mjs` renders `docs/index.html`.
- `.harness/scripts/docs/lib/render-planning-page.mjs` renders
  `docs/planning.html`.
- `.harness/scripts/docs/planning-check.mjs` rebuilds in no-write mode and strictly
  compares both generated files.
- `.harness/hooks/docs-build-on-stop.mjs` exports the shared
  `runPlanningSyncIfRelevant` Stop adapter used by Claude and Codex.

`build(root, { write: false })` is the no-write preview. Its canonical output fields
are `documentsHtml` and `planningHtml`; the legacy `html` alias points to
`documentsHtml` only.

Page replacement is transactional at the page-set level: both renderers must finish
before writes begin, both outputs are staged to temporary files, and replacement
failure rolls back already-replaced targets. Existing generated targets that are
symlinks are rejected. A failed render or staged replacement must preserve the last
good page set as far as rollback permits.

## Commands

- `mise run docs:build` regenerates both pages and prints non-blocking source hints.
- `mise run planning:sync` validates sources, collects configured downstream
  evidence, reconciles differences, rebuilds the projection, and records an
  automation run.
- `mise run planning:check` is the strict merge-ready gate for manifests, Planning
  Lock, Delivery Evidence, relations, unresolved conflicts, and missing/stale
  `docs/index.html` or `docs/planning.html`.
- `mise run planning:watch` provides optional debounced local feedback through the
  same sync core.
- `mise run planning:pull` is the only command allowed to replace Planning Lock; it
  validates a complete candidate before atomic replacement.
- `mise run feature:status <id> <state>` transitions one feature and records history.
- `mise run feature:status:sync` prints safe transition suggestions. Add `--apply`
  only for deterministic adjacent transitions.

If generated pages are missing or stale, run `mise run docs:build`, then
`mise run planning:check`. If watch configuration or a configured evidence root is
added while `planning:watch` is already running, restart the watcher: watched roots
are collected only at process startup.

## Source and Generated Ownership

| Layer | Owner | Typical source | Generator behavior |
| --- | --- | --- | --- |
| Document content | Repository maintainers | `README.md`, `docs/**/*.md`, `.harness/docs/**/*.md`, `specs/**/*.md` | Read and safely project |
| Planning intent | PM/PL or planning owner | needs, screens, feature catalog/detail, flows, decisions, relations | Read only outside an approval workflow |
| Planning contract | Planning publisher | `planning-manifest.json` | Compiler-generated |
| Received plan | Downstream project | `planning.lock.json` | Replaced only by `planning:pull` |
| Delivery facts | Developers and verifiers | Spec/task/code/test facts and Delivery Evidence | Scanned bottom-up |
| Reconciliation | Sync projection | Sync Result and Change Proposal | Never edits planning or implementation source |
| Display | Page-set generator | `docs/index.html`, `docs/planning.html` | Generated together |

Planning owns what should be built. Downstream evidence owns what was implemented
and verified. Reconciliation may describe a difference, but it cannot silently
promote either source into the other.

## Planning Hub Sources

- `.harness/config/feature-definition-schema.json` is the source of truth for
  canonical feature-definition fields and table columns. Keep scanners, renderers,
  and `codi-feature-definition-normalizer` aligned with it.
- `.harness/config/sitemap-schema.json` defines `data/sitemap.json` with `user`,
  `admin`, and `common` surfaces.
- `.harness/config/traceability-schema.json` defines the human-owned
  `data/feature-relations.json` source.
- `.harness/config/user-flow-schema.json` defines the human-owned
  `data/user-flows.json` source.
- `specs/<NNN>/status.yaml` is the source of truth for the **spec status
  axis** (the `feature:status*` commands and Spec Kit flow). Planning Hub
  feature-status cards are a different axis: project-owned FeatureWorkItems
  from Delivery Evidence (see the FeatureWorkItem contract below). The two
  axes track different objects — a spec vs an implementation work item — and
  connect only through the feature ID. Neither `registry.json` nor a
  generated HTML page is authoritative for either axis.

The harness repository itself keeps its own catalog in
`data/feature-definitions.json` (catalog IDs reuse spec IDs, 012) — the
harness-internal workspace loads through the planning path with spec-scan
delivery projection. Legacy 21-field rows are no longer a writing contract:
existing files stay readable (fail-open) but the build hints
`legacy 기능정의 행 N건` toward normalizer conversion. Workspace source
health only turns invalid on availability problems (parse/unsafe path);
planning-quality findings (definition-incomplete, feature-detail-missing,
unregistered work items, open decisions) are advisory and never flip it.

`data/sitemap.json`, `data/feature-relations.json`, and `data/user-flows.json` are
human-owned, not generated. `docs:build` reads them but never creates, normalizes, or
rewrites them. Missing or partially invalid optional sources are fail-open in the
local projection and produce health hints; strict planning contract failures still
fail `planning:check`.

A valid typed `appears-on` relation overrides legacy `Area`/alias mapping. Otherwise,
the legacy mapping remains active. Unmatched feature definitions appear in an
unassigned bucket, and screens with no features remain visible so missing definition
work is explicit.

## Planning and Delivery Flow

**Top-down:** normalize external CSV, Markdown, HTML, or irregular feature material
with `codi-feature-definition-normalizer`; confirm stable IDs; publish planning
intent; then seed Spec Kit work with the same feature ID. Use
`mise run feature:seed-check "<feature name>"` before creating a Spec to avoid
duplicates — it matches by title similarity and exact (normalized) ID.

**Bottom-up (definition-later):** start from `speckit-specify`, keep
`specs/<NNN>/status.yaml`, tasks, verification, and delivery evidence current.
Link a spec to a feature by adding optional `featureId: "FEAT-*"` to
`status.yaml` (reverse link; a planning-side `specified-by` relation wins on
conflict, surfaced as a `spec-feature-link-conflict` hint). A work item whose
`featureDefinitionId` is not in the catalog is NOT dropped: it projects into
the 미등록 기능 bucket with `registered: false`, the build/`planning:check`
report `미등록 기능 N건` as a non-blocking warning, and
`mise run feature:stub "<FEAT-ID>" "<제목>"` registers a draft
FeatureDefinition (minimal fields + open decision for the 11-group detail —
never auto-created, never overwrites an existing ID, skips demo workspaces).
When a workspace `deliverySource` is a spec directory, spec scan results are
projected as supplemental delivery items (`source: spec-scan`); explicit
`delivery-evidence.json` always wins per feature. Optional `registry.json`
may seed features without a Spec, but is never required.

The future split-repository architecture may place planning intent in a separate
`planning-hub` repository and publish an immutable manifest to downstream projects.
That cross-repository transport is not implemented by the current commands. Today,
configured sources must already be available through safe repository-relative paths.
Future transport must preserve explicit review: downstream applies a candidate only
through `planning:pull`, and bottom-up Change Proposals never auto-edit the planning
repository.

## Shared Stop Automation

Claude and Codex Stop paths call the same `runPlanningSyncIfRelevant` adapter. It
classifies relevant `data/`, `specs/`, `examples/`, and configured `deliverySource`
changes, then invokes the shared sync core once.

- Stop is fail-open, never stages or commits, and never replaces Planning Lock.
- `docs/index.html`, `docs/planning.html`, and the automation state log are generated
  outputs and excluded from trigger/digest loops.
- Direct editor changes can bypass Stop. `planning:check` remains the deterministic
  merge gate.
- A configured `deliverySource` must stay inside the repository root. Symlinked
  evidence roots are not followed. Invalid or unsafe roots become health findings.
- Input digest traversal skips symlinks and is bounded by file-count, byte-count, and
  depth limits. Do not weaken these limits to make an unsafe source pass.
- Stop, watch, sync, and CI never write to an external repository, push, open PRs, or
  approve planning changes.

This is deterministic shared implementation, not a new narrative rule. Do not add
Claude-only or Codex-only mirrors for the page-set contract; update the shared
builder/hook and focused tests when behavior changes.

## FeatureWorkItem Recording Contract (기능 현황의 입력)

Feature status cards are FeatureWorkItems: project-owned records of
implementation work, linked 1:N to a planning-owned FeatureDefinition by
`featureDefinitionId`. They live in the workspace `deliverySource`'s
`delivery-evidence.json` under `workItems` (schema:
`.harness/config/feature-work-item-schema.json`).

Required fields per item: `id` (stable `WORK-*`), `featureDefinitionId`
(existing `FEAT-*`), `workType` (frontend/backend/db/qa/infra/unspecified),
`title`, `releaseId`, `status` (planned/in-progress/in-review/done),
`taskRefs`, `evidenceRefs`. Completion additionally requires
`requiredAcceptanceCriterionIds` + `acceptanceResults`. Optional: `tasks`
(`{done,total}`), `hold` (`{active, reason, releaseCondition}` — 보류는 열이
아니라 조건 라벨), `blockingDecisions`.

Recording rules:

- 구현 상태 변화(착수, 작업 완료, 인수 통과, 증거 추가)는 채팅이나 커밋
  메시지가 아니라 work item 갱신으로 표현해야 기능 현황에 반영된다.
  Stop 훅이 specs 진행 변화(tasks/status) 대비 evidence 미갱신을
  감지하면 `[workitem-reminder]` 비차단 안내를 낸다 — deliverySource가
  spec 디렉터리인 워크스페이스는 spec 갱신 자체가 evidence라 침묵한다.
  새 explicit 항목은 `mise run feature:workitem "<FEAT-ID>" <workType>
  "<제목>"`으로 기록한다(생성 status는 planned/in-progress/in-review만,
  `done`은 완료 가드를 통과하는 갱신으로만 도달).
- `done` 요청은 완료 가드를 통과해야 한다: task 전부 완료, 필수 acceptance
  criterion 전부 `passed`, evidence 존재, blocking decision 0건. 근거가
  부족하면 `in-review`로 강등되고 차단 사유가 카드에 표시된다.
- Release는 work item 속성이다. FeatureDefinition에는 저장소 위치·구현 상태를
  저장하지 않는다 (`repository` 필드 금지 — 스키마가 거부한다).
- 명시적 work item이 없는 legacy delivery evidence는 기능당 최대 1개의
  `unspecified` 작업으로만 투영된다. 새 기록은 항상 explicit `workItems`로
  작성한다.
- 카탈로그에 없는 `featureDefinitionId`의 work item은 버려지지 않고
  `registered: false`로 미등록 묶음에 투영된다(경고 유지). draft stub을
  등록하면 정식 기능 아래로 이동한다. draft 정의는 acceptance가 없으므로
  완료 가드가 `done`을 자동 차단한다.
- work item ID도 불변이다. 재사용하지 않고, 분할 시 `-A`/`-B` 접미사를 쓴다.

## Feature Status Rules

These rules govern `specs/<NNN>/status.yaml` transitions (the spec status
axis). They are separate from the FeatureWorkItem completion guard above:
a work item `done` requires passed acceptance results and evidence, while a
spec `in-review -> done` suggestion requires tasks, `verification.md`, and
zero open decisions. Do not mix the two checklists.

Valid forward transitions are `planned -> in-progress -> in-review -> done`, one
adjacent step at a time. `on-hold` is manual and may be entered or left from any
state. Undefined jumps require explicit `--force`; backward transitions warn and
record history.

Progress is derived from checked and unchecked `tasks.md` items, never stored in
`status.yaml`. QA is represented by `in-review`, not added to `owner_roles`.
`in-review -> done` is suggested only when all tasks are checked,
`verification.md` exists with every checklist item checked, and there are zero open
decisions. A fresh E2E stamp alone is not completion evidence, and no suggestion is
applied without explicit `--apply`.

Before finishing feature work, run `mise run feature:status:sync`. Apply only a
deterministic adjacent transition; report ambiguous or `on-hold` cases to the user.

## Do Not

- Do not edit either generated HTML file directly.
- Do not treat priority (`P1/P2/P3`), definition lifecycle, delivery status, and sync
  status as interchangeable fields.
- Do not put feature, Spec, test, or evidence nodes into the screen-only sitemap;
  connect them in traceability.
- Do not persist calculated progress or make `registry.json` mandatory.
- Do not auto-apply `on-hold`, Planning Lock, or a Change Proposal.
- Do not block preview builds only because an optional relation or flow source is
  absent; expose actionable health instead.
