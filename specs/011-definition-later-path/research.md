# Research: 정의-후행 경량 경로

Phase 0 산출물. NEEDS CLARIFICATION은 clarify 세션(spec 참조)에서 모두
해소되었고, 여기서는 구현 지점 결정을 기록한다.

## D1. 미등록 버킷의 구현 지점

- **Decision**: `normalize-feature-work-items.mjs`의 reference-broken
  분기에서 항목을 drop(`item: null`)하지 않고 `registered: false`
  마커와 함께 유지한다. health 진단은 그대로 남긴다. 다른 검증
  실패(필수 필드 누락 등)는 지금처럼 drop.
- **Rationale**: 투영 규칙의 단일 소스가 normalize 계층이다. 렌더러가
  버킷을 별도 스캔하면 로직이 중복되고, 가짜 FeatureDefinition을
  주입하면 정의/현황 소유권 경계가 흐려진다.
- **Alternatives considered**: (a) 렌더러 측 재스캔 — 중복·불일치
  위험, (b) synthetic stub feature 자동 주입 — FR-010(자동 승격 금지)
  위반.

## D2. stub 등록 명령의 형태

- **Decision**: 신규 `feature-stub.mjs` + `mise run feature:stub
  "<FEAT-ID>" "<title>" [--summary ...]`. 대상은 기본 워크스페이스의
  planningSource `feature-definitions.json`(없으면 생성)이며 draft
  항목 추가와 함께 `decisions.json`에 소급 상세 열린 결정을 남긴다.
  기존 ID가 있으면 아무것도 쓰지 않고 안내만 한다(seed-check 로직
  재사용).
- **Rationale**: clarify 확정(명시 명령 + 비차단 제안). mise 태스크는
  기존 feature:* 네임스페이스와 일관.
- **Alternatives considered**: normalizer 스킬 경유(외부 문서 변환
  용도라 부적합), authoring 스킬 수동 작성(11그룹 요구로 과중).

## D3. 역방향 연결과 우선순위

- **Decision**: `scan-specs.mjs`(yaml-lite)가 status.yaml의 선택 필드
  `featureId`를 읽어 spec 레코드에 싣고, `build-linked-hub-model.mjs`
  연결 우선순위를 (1) planning 명시 관계(specified-by/specIds), (2)
  역방향 `featureId`, (3) ID 동일성 순으로 한다. (1)과 (2)가 다른
  대상을 가리키면 conflict health를 추가한다.
- **Rationale**: clarify 확정(planning 우선 + 진단). 기존 explicit >
  id-동일 순서에 한 단계 끼워 넣는 최소 변경.
- **Alternatives considered**: spec 우선(planning-owned 관계의 권위
  약화), 동률 표시(추적성 집계 모호).

## D4. specs deliverySource 투영

- **Decision**: `loadPlanningWorkspace`가 deliverySource 경로에서
  `delivery-evidence.json`을 읽은 뒤, 그 경로가 spec 디렉터리 구조
  (`*/status.yaml` 존재)면 `scanSpecs` 결과를 legacy `features` 형태
  (featureId, status, tasks{done,total})로 변환해 evidence에 **없는**
  기능만 보충한다. 연결 기능 ID는 D3 우선순위를 따른다.
- **Rationale**: clarify 확정(evidence 우선 + 보충). legacy features
  투영 경로(기능당 최대 1개 unspecified)를 재사용하므로 렌더러 변경이
  최소화된다.
- **Alternatives considered**: 별도 rollup 축 신설(렌더러 대수술),
  spec 우선(명시 기록 우선 원칙 위반).

## D5. 게이트와 힌트

- **Decision**: `planning-check.mjs`는 미등록 기능 work item을 실패로
  만들지 않고 `미등록 기능 N건` 경고를 리포트에 추가한다.
  `build-hub.mjs` 힌트에도 같은 개수와 `mise run feature:stub` 안내를
  더한다.
- **Rationale**: clarify 확정(경고 + 개수). fail-open 원칙과 일치.
- **Alternatives considered**: 게이트 실패(급한 유지보수 차단),
  워크스페이스 설정 분기(설정 표면 증가).
