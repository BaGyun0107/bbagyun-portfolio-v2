# Implementation Plan: 기능정의서 탭 데이터 소스 전환

**Branch**: `003-feature-definition-source` | **Date**: 2026-07-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-feature-definition-source/spec.md`

## Summary

기능정의서 탭의 데이터 소스를, 특정 머신에 하드코딩된 STICKY v1 서비스정의 HTML에서
저장소 내 규약 경로의 정규화 산출물(`data/feature-definitions.json`)로 전환한다.
렌더러가 소비하는 serviceDefinition 모델 계약(`{ sourcePath, columns, rows, warning }`)은
그대로 유지하고, **소스를 읽는 부분(scanner)만 교체**한다. STICKY 절대경로 기본값과
`SERVICE_DEFINITION_HTML` 환경변수 우회를 제거하고, 소스 부재/손상 시 기존 fail-open
동작(빈 탭 + 빌드 성공)을 유지한다.

## Technical Context

**Language/Version**: Node.js 24 (mise 관리, ESM `.mjs`)

**Primary Dependencies**: 없음(런타임 외부 의존성 0). 기존 하네스 docs 생성기 모듈만
사용 — `build-hub.mjs`, `render-hub.mjs`, `feature-definition-schema.mjs`.

**Storage**: 파일 기반. 입력 = 저장소 루트 `data/feature-definitions.json`(선택적),
스키마 = `.harness/config/feature-definition-schema.json`, 출력 = `docs/index.html`.

**Testing**: `node --test` (기존 `tests/*.test.mjs` 관례), `mise run test` 경유.

**Target Platform**: 로컬 CLI (`mise run docs:build`), 오프라인 단일 HTML 산출.

**Project Type**: 저장소 내부 도구 (하네스 docs 생성기). 앱(front/back) 스택 아님 —
project-profile mode와 무관.

**Performance Goals**: 해당 없음(수십~수백 행 규모의 정적 렌더).

**Constraints**: 외부 네트워크/CDN 의존 금지(FR 유지), fail-open(잘못된 입력은
건너뛰고 경고, 빌드는 성공), 특정 로컬 절대경로 참조 0건.

**Scale/Scope**: 파일 3~4개 수정(scanner, build-hub 배선, 테스트), 신규 fixture 소수.
렌더러(`render-hub.mjs`)는 계약 유지로 무변경.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

프로젝트 constitution은 아직 template placeholder 상태이므로, 하네스 자체 정책을
게이트로 적용한다.

- **TDD (`.harness/policies/tdd.md`)**: 비trivial 구현이므로 테스트 우선. scanner
  단위 테스트(정상/부재/손상)를 구현 전에 작성한다. → PASS 예정
- **작업 안전 (`.harness/policies/guardrails.md`)**: 보호 브랜치 아님(현재
  `feat/feature-definition-schema`), 파괴적/시크릿/외부 side effect 없음. → PASS
- **컨텍스트 엔지니어링 (`context-engineering.md`)**: durable 상태는 이 spec
  디렉터리에. → PASS
- **skill-ownership**: `.harness/scripts/docs/**`는 공유 하네스 코드지만
  `.harness/skills/**`가 아니므로 skill-ownership 가드 대상 아님. 이 저장소는 harness
  upstream이라 shared docs 생성기 수정이 허용됨. → PASS
- **단일 스키마 원천**: canonical 컬럼을 새로 정의하지 않고 기존
  `feature-definition-schema.json`을 재사용(FR-002). → PASS

**게이트 위반 없음.** Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/003-feature-definition-source/
├── plan.md              # 이 파일
├── research.md          # Phase 0 산출물
├── data-model.md        # Phase 1 산출물
├── quickstart.md        # Phase 1 산출물
├── contracts/           # Phase 1 산출물 (scanner 입출력 계약)
└── tasks.md             # /speckit-tasks 산출물 (이 명령이 만들지 않음)
```

### Source Code (repository root)

```text
.harness/scripts/docs/
├── build-hub.mjs                       # 배선 변경: scanServiceDefinition 호출부에서
│                                       #   STICKY 절대경로 fallback + env 우회 제거
└── lib/
    ├── scan-service-definition.mjs     # 핵심 변경: HTML const DATA 정규식 파싱 →
    │                                   #   data/feature-definitions.json 읽기로 교체
    ├── feature-definition-schema.mjs   # 무변경 (컬럼 원천 재사용)
    └── render-hub.mjs                  # 무변경 (serviceDefinition 계약 유지)

.harness/config/
└── feature-definition-schema.json      # 무변경 (canonical 필드 원천)

data/
└── feature-definitions.json            # 신규 소스 규약 경로 (선택적, 없어도 빌드 성공)

tests/
├── feature-hub-service-definition.test.mjs  # 재작성: HTML 케이스 → JSON 소스 케이스
└── fixtures/feature-hub/                     # 신규 fixture (정상/손상 JSON)
```

**Structure Decision**: 기존 하네스 docs 생성기 구조를 그대로 유지한다. 변경은
`lib/scan-service-definition.mjs`(소스 읽기)와 `build-hub.mjs`(호출 배선)에 국한되며,
렌더러·스키마 모듈은 계약 경계를 지켜 무변경으로 둔다.
