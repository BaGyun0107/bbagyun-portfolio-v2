# Implementation Plan: 정의-후행(definition-later) 경량 경로

**Branch**: `feature/harness-migrate` (spec dir: `011-definition-later-path`) | **Date**: 2026-07-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/011-definition-later-path/spec.md`

## Summary

bottom-up/유지보수 흐름을 1급 시민으로: (1) 미등록 기능 work item을
버리지 않고 버킷으로 투영, (2) 명시 명령형 FEAT stub 등록, (3)
status.yaml `featureId` 역방향 연결(planning 우선), (4) specs
deliverySource의 spec 스캔 결과를 delivery 근거로 투영(evidence 우선).
전부 fail-open, 게이트는 경고 + 개수 노출.

## Technical Context

**Language/Version**: Node.js (mise 관리 버전), ESM(.mjs)

**Primary Dependencies**: 없음(표준 라이브러리만). 기존
`.harness/scripts/docs/lib` 모듈 재사용

**Storage**: 파일 기반 — workspace planningSource JSON,
`specs/<NNN>/status.yaml`(yaml-lite 파서)

**Testing**: node:test (`tests/*.test.mjs`), TDD

**Target Platform**: 하네스 저장소 + 다운스트림 프로젝트 (macOS/Linux)

**Project Type**: 내부 도구(문서/허브 빌드 파이프라인 + mise CLI 태스크)

**Performance Goals**: docs:build 전체 2초 이내 유지(기존 테스트 기준)

**Constraints**: fail-open 원칙, 자동 승격 금지, ID 불변 규칙,
생성 HTML 직접 수정 금지, 새 프레임워크 도입 금지

**Scale/Scope**: 카탈로그 수백 기능 · work item 수백 건 수준

## Constitution Check

`.specify/memory/constitution.md`는 미작성 템플릿이므로 게이트 없음.
대신 저장소 상위 규칙을 게이트로 적용한다: TDD(테스트 선행), fail-open,
자동 승격 금지(FR-010), planning source human-owned, 페이지 셋
트랜잭션 유지. → 본 계획은 전부 준수(위반 없음, Complexity Tracking
불필요).

## Project Structure

### Documentation (this feature)

```text
specs/011-definition-later-path/
├── spec.md
├── plan.md              # 이 파일
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1
└── tasks.md             # /speckit-tasks 출력
```

### Source Code (repository root)

```text
.harness/scripts/docs/
├── feature-stub.mjs                       # 신규 — stub 등록 명령 본체
├── planning-check.mjs                     # 수정 — 미등록 경고+개수
├── build-hub.mjs                          # 수정 — 미등록 힌트 안내
└── lib/
    ├── normalize-feature-work-items.mjs   # 수정 — 미등록 버킷 투영
    ├── aggregate-feature-work-items.mjs   # 수정 — 버킷 rollup
    ├── render-feature-workbench-view.mjs  # 수정 — 버킷 표시+안내
    ├── scan-specs.mjs                     # 수정 — featureId 읽기
    ├── build-linked-hub-model.mjs         # 수정 — 역방향 연결+충돌 진단
    └── build-workspace-hub-model.mjs      # 수정 — specs deliverySource 투영

mise.toml                                  # 수정 — feature:stub 태스크
.harness/skills/codi-feature-hub/SKILL.md  # 수정 — bottom-up 계약 갱신
.harness/docs/feature-hub-guide.md         # 수정 — 흐름 문서 갱신

tests/
├── planning-feature-work-items.test.mjs   # 수정 — 버킷 투영
├── planning-feature-workbench-render.test.mjs # 수정 — 버킷 표시
├── feature-hub-sitemap-build.test.mjs     # 수정 — specs 투영 빌드
├── feature-hub-spec-detail.test.mjs       # 수정 — 역방향 연결
└── feature-stub.test.mjs                  # 신규 — stub 명령
```

**Structure Decision**: 기존 단일 파이프라인 구조를 유지하고 새
디렉터리를 만들지 않는다. 신규 파일은 stub 명령 스크립트와 그 테스트
2개뿐이며 나머지는 기존 모듈의 국소 수정이다.
