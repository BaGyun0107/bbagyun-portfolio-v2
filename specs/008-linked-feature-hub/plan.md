# Implementation Plan: 연결형 기능 허브 v2

**Branch**: `008-linked-feature-hub` | **Date**: 2026-07-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-linked-feature-hub/spec.md`

## Summary

기존 기능정의 행, Spec Kit, 사이트맵, task/status/verification을 중복 저장
없이 연결한다. 선택적 typed relation과 user-flow 원본을 fail-open으로
스캔하고, 서버 측에서 상세·coverage·delivery 모델을 만든 뒤 단일 정적
허브에 relation/tree/table/flow와 근거 기반 상태 정보를 렌더한다.

## Technical Context

**Language/Version**: Node.js 24, ECMAScript modules, 브라우저 표준 JavaScript

**Primary Dependencies**: Node.js 내장 모듈만 사용; 외부 런타임/시각화 의존성 없음

**Storage**: 사람이 소유하는 JSON/Markdown/YAML 파일과 생성된 단일 HTML

**Testing**: `node --test` 기반 단위·통합·렌더 테스트, `mise run docs:build`, 브라우저 수동 검증

**Target Platform**: 로컬 파일로 여는 최신 Chromium 계열 브라우저와 Node.js CLI

**Project Type**: 하네스 내부 정적 문서 생성기

**Performance Goals**: 500 features, 100 screens, 50 flows fixture의 build 2초 이내

**Constraints**: fail-open, 외부 의존성 0, 단일 `docs/index.html`, 사용자 소유 `data/` 자동 변경 금지, 기존 tree/table 하위 호환

**Scale/Scope**: 4개 독립 user story, 신규 선택 계약 2개, scanner/model/renderer/status sync 교차 변경

## Constitution Check

`.specify/memory/constitution.md`는 미치환 템플릿으로 ratified 원칙이 없다.
따라서 저장소의 `AGENTS.md`, `.harness/policies/scenario-phase-routing.md`,
`.harness/policies/guardrails.md`를 적용한다.

- PASS: Medium+ durable state를 `specs/008-linked-feature-hub/`에 먼저 기록.
- PASS: 테스트 태스크를 명시하고 Red → Green 순서로 실행.
- PASS: 사용자 소유 `data/`를 빌드나 agent가 자동 수정하지 않음.
- PASS: 기존 단일 HTML·외부 의존성 0·fail-open 계약 유지.
- PASS: 커밋·PR·merge는 이번 사용자 요청 범위가 아니므로 수행하지 않음.
- PASS: 독립 구현 스트림은 있으나 서브에이전트 권한이 없어 단일 스트림으로 순차 실행.

## Project Structure

### Documentation (this feature)

```text
specs/008-linked-feature-hub/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── traceability-schema.md
│   ├── user-flow-schema.md
│   └── hub-view-contract.md
├── checklists/requirements.md
├── tasks.md
├── status.yaml
└── verification.md
```

### Source Code (repository root)

```text
.harness/config/
├── traceability-schema.json      # data/feature-relations.json 계약
└── user-flow-schema.json         # data/user-flows.json 계약

.harness/scripts/docs/
├── build-hub.mjs                 # scanner/model 조합, 힌트, DATA 주입
└── lib/
    ├── parse-spec-detail.mjs     # spec Markdown의 상세 섹션 파생
    ├── scan-specs.mjs            # delivery evidence 포함 feature scan
    ├── scan-traceability.mjs     # 관계 원본 fail-open 검증
    ├── scan-user-flows.mjs       # flow 원본 fail-open 검증
    ├── build-linked-hub-model.mjs# endpoint registry, 관계/coverage 모델
    ├── merge-sitemap.mjs         # 명시적 screen 관계 우선 + Area fallback
    ├── status-sync.mjs           # evidence-gated done 제안
    ├── transition.mjs            # 근거 기반 비차단 힌트
    └── render-hub.mjs            # 상세/relation/flow/delivery UI

.harness/scripts/docs/templates/hub.css

tests/
├── fixtures/feature-hub/
│   ├── feature-relations.valid.json
│   ├── feature-relations.invalid.json
│   ├── user-flows.valid.json
│   ├── user-flows.invalid.json
│   └── specs/003-sample/verification.md
├── feature-hub-spec-detail.test.mjs
├── feature-hub-scan-traceability.test.mjs
├── feature-hub-scan-user-flows.test.mjs
├── feature-hub-linked-model.test.mjs
├── feature-hub-delivery-evidence.test.mjs
├── feature-hub-render.test.mjs
├── feature-hub-sitemap-merge.test.mjs
├── feature-hub-sitemap-build.test.mjs
└── feature-hub-status-sync.test.mjs
```

**Structure Decision**: 기존 `.harness/scripts/docs/lib`의 pure scanner/merge
패턴을 유지하고 renderer에 비즈니스 검증을 넣지 않는다. Markdown 파싱,
파일 검증, graph 모델, UI를 각각 분리해 fixture 단위로 검증한다.

## Implementation Phases

1. **Foundation**: 계약·fixture·spec detail/delivery 파생기를 TDD로 고정.
2. **US1**: 기능 ID 또는 `specified-by`로 spec 상세를 연결하고 상세 UI 제공.
3. **US2**: typed relation scanner, endpoint registry, broken/orphan health 추가.
4. **US3**: user-flow scanner와 relation/flow UI, 접근 가능한 대체 목록 추가.
5. **US4**: next action, transition, decision/verification coverage와 done gate 추가.
6. **Integration**: 대규모 fixture, 전체 테스트, docs build, 브라우저 검증.

## Complexity Tracking

| Complexity | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| 선택 JSON 계약 2개 | 화면 계층과 행동 flow는 identity·검증 규칙이 다름 | 하나의 범용 graph 파일은 작성·검증 의미가 불명확해짐 |
| graph model 모듈 | scanner 결과와 UI 사이 endpoint/coverage 계산을 한 곳에서 결정 | renderer 내부 계산은 Node test와 브라우저 계산이 중복됨 |
| 4개 view | 관계, 계층 탐색, 비교, 행동 분기는 서로 다른 사용자 질문 | 단일 relation view는 대규모 탐색과 접근성 대체를 충족하지 못함 |

## Post-design Constitution Re-check

초기 gate와 동일하게 PASS. 새 계약은 선택·fail-open이며 기존 프로젝트를
차단하지 않는다. 실제 `data/feature-relations.json`, `data/user-flows.json`,
`data/sitemap.json`은 구현 중 생성·수정하지 않는다.

