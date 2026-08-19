# Research: Planning Hub 데모·동기화·기능 허브 재설계

## R1. Canonical authoring and digest format

**Decision**: Use versioned JSON as the canonical contract and digest input for this feature.
Human-authored YAML remains a possible future planning-hub editor format that must compile
to the same JSON contract.

**Rationale**: Current hub contracts and scanners are JSON, browser embedding already uses
JSON, and Node provides deterministic serialization and SHA-256 without dependencies. This
keeps the first cross-repository contract small and testable.

**Alternatives considered**:

- YAML as canonical now: rejected because the repo has only narrow YAML-lite status parsing;
  a complete parser or dependency would add unrelated risk.
- Markdown front matter as canonical: rejected because nested states, acceptance criteria and
  typed relations become ambiguous.

**Evidence**: `.harness/config/*-schema.json`, `.harness/scripts/docs/build-hub.mjs`,
`package.json`; approved design §7.

## R2. Legacy feature-definition compatibility

**Decision**: Keep `feature-definition-schema.v1` as the irregular/legacy catalog input.
Add a separate rich detail contract instead of changing existing keys in place. Map
`Phase_Suggestion` only to a legacy priority candidate and preserve `Status`/
`Decision_Level` as legacy processing metadata unless an explicit rich definition supplies
the new lifecycle state.

**Rationale**: Current fields do not mean definition lifecycle or delivery status. Silent
reinterpretation would falsely mark old rows approved or implemented.

**Alternatives considered**:

- Rename and mutate v1 fields: rejected as a breaking semantic change.
- Put all detail fields into each row: rejected because comparison catalog and behavioral
  specification have different shapes and change cadence.

**Evidence**: `.harness/config/feature-definition-schema.json`; 007 implementation basis E1,
E4; approved design §3.2, §6 and §7.

## R3. Planning Manifest compilation and identity

**Decision**: Compile top-down entities into a versioned manifest envelope with project ID,
schema version, manifest version, source revision, generation time and SHA-256 digest.
Compute digest over canonical content with volatile fields excluded from the digest payload.

**Rationale**: A pinned digest lets downstream distinguish aligned, behind and invalid lock
states and makes repeated processing idempotent.

**Alternatives considered**:

- Git revision only: rejected because the same repo revision may contain multiple project
  plans and does not validate content serialization.
- Latest-only mutable file: rejected because downstream cannot reproduce what it consumed.

**Evidence**: approved design §7.3 and §8.2; existing harness lock/version principles in
specs 005-006.

## R4. Workspace source resolution

**Decision**: Add an optional project-owned workspace config. In this harness repository it
declares Community Demo as preview default and Harness Internal as an actual workspace. If a
downstream has no config, the only/default workspace is its actual root data. Missing actual
sources never fall back to demo.

**Rationale**: The harness needs an understandable product demo without replacing its own
feature state. Downstream projects need safe defaults and must not confuse samples with facts.

**Alternatives considered**:

- Detect repository name: rejected as hardcoded and fragile after forks/renames.
- Always embed and default demo everywhere: rejected because it can hide collection failure.
- Replace `data/` with demo: rejected because it destroys actual harness traceability.

**Evidence**: user-approved demo mockup; approved design §10; `project-owned.mjs` ownership
rules.

## R5. Demo ownership

**Decision**: Treat `examples/community-app/` as shared harness-owned example content, not
project-owned mutable downstream state. Actual project inputs stay under project-owned
`data/` and `specs/`. The example is visibly labeled and can be updated with harness releases.

**Rationale**: The demo defines and tests the shared UI contract. Downstream customization
belongs in its real planning source, not in the reference example.

**Alternatives considered**:

- Mark all `examples/` project-owned: rejected because fixes to the shared reference would not
  reach downstream projects.
- Store demo in `data/`: rejected because it mixes sample and actual ownership.

**Evidence**: `.harness/scripts/setup/project-owned.mjs`, update-policy shared/new directory
rule; approved design §10.

## R6. Delivery evidence layering

**Decision**: Merge three evidence layers without overstating certainty: existing
Spec/status/tasks/verification scan, optional declared screen/route/API/test evidence, and
scanner-observed artifacts where a project profile supports them. Each item carries source,
revision, collected time and certainty.

**Rationale**: Current Spec scanning already produces useful delivery evidence. Arbitrary
code cannot always reveal business meaning reliably, so observed facts must not become
approved planning intent automatically.

**Alternatives considered**:

- Code scan only: rejected due stack variance and semantic false positives.
- Manual evidence only: rejected because task/verification status would drift unnecessarily.
- Infer missing definitions from implementation: rejected because it violates source
  ownership.

**Evidence**: `.harness/scripts/docs/lib/scan-specs.mjs`,
`tests/feature-hub-delivery-evidence.test.mjs`; approved design §8.3.

## R7. Reconciliation and conflict policy

**Decision**: Join by stable entity ID and compare owned fields. Produce `aligned`, `behind`,
`drifted`, `conflicted` and `collection-failed` projections. Difference resolution is a
change proposal with planned/observed values and evidence; no source file is written.

**Rationale**: Planning and implementation are both legitimate but different sources. A
calculated projection preserves provenance and makes human decisions auditable.

**Alternatives considered**:

- Last-write-wins: rejected because timestamps do not encode decision authority.
- Downstream overwrites planning: rejected because observed limitations can be defects.
- Planning always overwrites downstream: rejected because discovered constraints and shipped
  reality would be hidden.

**Evidence**: IIBA traceability and W3C PROV sources recorded in the approved design §2;
approved design §8.4.

## R8. Hub navigation and document preservation

**Decision**: Make the planning questions the primary navigation in a dedicated
Planning page. Preserve harness/project document search and detail in a separate document
library. Rename the mixed `관계도` to `추적성 그래프`; sitemap defaults to a screen-only
diagram with tree/table alternatives. (Amended by the 2026-07-16 clarification: the
primary navigation is the six product views — 개요, 화면 구조, 기능 정의, 기능 현황,
사용자 흐름, 추적성 — and delivery/sync moved into feature status/overview and the
`운영·고급` disclosure; see FR-063.)

**Rationale**: Users need semantic separation without losing existing guide/document access.
Graph and pipeline remain useful in their correct diagnostic contexts.

**Alternatives considered**:

- Keep four current tabs and add nested toggles: rejected because it retains the ambiguity
  reported by the user.
- Delete guide/project views: rejected because the feature hub still indexes those documents.
- Make graph the default sitemap: rejected because it mixes entity types and scales poorly.

**Evidence**: `.harness/scripts/docs/lib/render-hub.mjs`; Yale/Figma/USWDS sources in the
approved design §2; approved visual choices A.

## R9. Static sitemap rendering

**Decision**: Render semantic screen nodes and hierarchy/direct-navigation edge data into the
static page, draw visual connectors with dependency-free browser SVG/CSS, and expose the same
source through keyboard-operable tree and table views.

**Rationale**: This matches the requested conventional sitemap while preserving static file
delivery and accessibility. Tests can validate semantic nodes/edges independently from pixel
layout; browser verification covers geometry and responsiveness.

**Alternatives considered**:

- Add graph library: rejected due dependency and bundle complexity.
- CSS tree only: rejected because direct navigation and wide structures become unclear.
- Server-rendered fixed coordinates: rejected because labels and responsive widths vary.

**Evidence**: current dependency-free renderer and approved sitemap mockup; approved design
§5 and §11.

## R10. Fail-open preview and fail-closed gate

**Decision**: Local `docs:build` preserves valid sources and last good projection while
showing missing/invalid/stale states. Strict `planning:check` fails canonical schema,
digest, broken reference, unexpected projection and unresolved configured release conflicts.
CI runs the strict check.

**Rationale**: Documentation preview should remain usable during editing, while merge-ready
state cannot silently accept corrupt planning contracts.

**Alternatives considered**:

- Fail all local builds: rejected because one optional source would hide unrelated valid
  documentation.
- Fail-open everywhere: rejected because stale generated files could merge unnoticed.

**Evidence**: existing sitemap/relation fail-open scanners; `ci-node-verify.sh`; approved
design §9 and §13.

## R11. Shared automation core

**Decision**: Implement one planning sync/check core. Manual task, optional debounced watcher,
Claude Stop and Codex Stop adapter invoke it with normalized context. Change classification
uses relevant source groups and content digests, excluding generated outputs. CI reruns strict
check independently of hooks.

**Rationale**: Claude and Codex expose different events, and direct editor changes expose no
agent event. Result parity is achievable through a shared deterministic core and final CI,
not identical hook names.

**Alternatives considered**:

- Separate Claude/Codex implementations: rejected due drift.
- Hooks as sole guarantee: rejected because killed sessions and human edits are uncovered.
- Mandatory watcher: rejected because a long-running process is unsuitable for all users.

**Evidence**: `.claude/settings.json`, `.codex/hooks.json`, `docs-build-on-stop.mjs`,
`codex-stop.mjs`, AGENTS Codex automation limits; approved design §9.

## R12. CI integration

**Decision**: Add `planning:check` as a root mise task and invoke it from the existing Node
verification workflow after tests. Keep pre-commit advisory/lightweight; CI is the required
merge gate.

**Rationale**: The current CI already verifies the root Node package and runs tests. Reusing it
avoids a parallel workflow and catches direct edits regardless of local agent/tool.

**Alternatives considered**:

- New standalone workflow: rejected as duplicated checkout/runtime/test setup.
- Pre-commit only: rejected because hooks may be skipped and only see local state.

**Evidence**: `mise.toml`, `.github/workflows/ci-node.yml`,
`.harness/scripts/checks/ci-node-verify.sh`, `lint-staged.config.mjs`.

## R13. Explicit planning pull and atomic lock update

**Decision**: Expose planning receipt only through an explicit `planning:pull` action backed
by the shared sync core. It validates the complete manifest, supported schema, source
identity and digest before writing a temporary lock and atomically replacing the applied
Planning Lock. Stop hooks, watchers and ordinary sync/check never advance the lock.

**Rationale**: Detecting `behind` without a safe receipt action leaves the handoff incomplete,
while automatic latest-following would violate the approved pinned-version ownership model.
Atomic replacement preserves the last valid lock and projection on validation or process
failure.

**Alternatives considered**:

- Advance lock on every Stop/watch event: rejected because review and reproducibility vanish.
- Rewrite lock before validation: rejected because partial or incompatible manifests could
  become the apparent current plan.
- Separate implementation from the shared sync core: rejected because validation/digest
  behavior could drift.

**Evidence**: spec FR-021 and US3 acceptance scenario 1; approved design §8.2 and §9.1;
analysis finding A1 approved by the user.

## R14. Generated page separation

**Decision**: Generate `docs/index.html` as a document library and
`docs/planning.html` as the integrated Planning Hub from one immutable build model.

**Rationale**: The current sidebar changes a hidden legacy panel inside a collapsed region,
so the selected guide/project content is not visible. An iframe adds nested focus, scroll and
history problems, while a single mixed page preserves the conflicting information architecture.

**Alternatives considered**:

- Embedded iframe: rejected because local history, focus and responsive scrolling become
  two nested application surfaces.
- One enlarged `index.html`: rejected because document reading and product planning remain
  coupled and the wide sitemap loses space.

**Evidence**: approved page-separation design and visual choice A; spec FR-041~FR-043.

## R15. Build-time Markdown projection

**Decision**: Read and safely project supported Markdown during `docs:build`; do not fetch
local Markdown from browser JavaScript.

**Rationale**: Local `file://` fetch behavior is inconsistent and would make the document
reader depend on browser permissions. Build-time projection preserves one-file operation and
allows hostile HTML and links to be escaped before embedding.

**Alternatives considered**:

- Runtime fetch: rejected because local file access can fail and produces blank readers.
- Raw Markdown links only: rejected because the user leaves the list context and browser
  rendering quality is not guaranteed.
- New Markdown dependency: rejected because the required subset can reuse current parsing
  patterns without expanding the runtime supply chain.

**Evidence**: approved document-reader visual choice A; spec FR-044~FR-045.

## R16. Dependency-free horizontal organization layout

**Decision**: Derive deterministic horizontal SVG coordinates from the existing screen tree.
Place the root above primary branches, spread branches horizontally and place descendants
below their parents. Render hierarchy and direct navigation as separate edge layers.

**Rationale**: This matches the approved reference while keeping `data/sitemap.json` as the
single human-owned source. Deterministic positions support stable tests and offline output.

**Alternatives considered**:

- Vertical organization chart: rejected because height grows quickly and the overall product
  structure becomes harder to compare.
- Surface swimlanes only: rejected because surface boundaries are clear but parent-child
  hierarchy is weaker than the requested reference.
- External layout library: rejected because it adds a dependency and nondeterministic layout
  risk for a small screen tree.

**Evidence**: approved organization-chart visual choice A; spec FR-046~FR-048.
