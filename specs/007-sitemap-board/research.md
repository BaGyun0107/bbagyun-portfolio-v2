# Research: 007-sitemap-board

Phase 0 — 기술 결정 기록. NEEDS CLARIFICATION 0건(브레인스토밍에서
사용자와 합의 완료). 아래는 구현 결정과 근거다.

> Post-review research: PM/PL 문서 구조, 사이트맵·user flow 구분,
> 기능 상세 계약, traceability, 후속 UI 대안과 구현 게이트는
> [implementation-basis.md](./implementation-basis.md)에 기록한다.
> 기존 D1~D7은 007 구현 당시 결정이며, 후속 v2 권고가 이를 소급해
> 변경하지 않는다.

## D1. 노드 id / alias 충돌 처리

- Decision: 스키마 검증에서 경고를 내고 먼저 선언된 노드가 우선한다.
  빌드는 계속한다(fail-open).
- Rationale: 비차단 원칙과 일관. 사람이 소유하는 파일이므로 경고로
  교정을 유도하면 충분하다.
- Alternatives: 빌드 실패(차단) — 하네스 비차단 철학 위반으로 기각.

## D2. 파생 모드(사이트맵 부재) 그룹핑

- Decision: 기존 `sitemapGroups()` 로직을 재사용해 사용자/관리자
  2그룹 유사 트리를 만들고 같은 보드 UI로 렌더한다.
- Rationale: 검증된 로직 재사용, UI 단일화로 분기 최소화.
- Alternatives: 파생 모드에서 기존 표만 노출 — 뷰 이원화로 유지보수
  부담 증가, 기각.

## D3. 뷰 토글/필터 상태 관리

- Decision: 기존 렌더러의 in-memory `state` 객체 패턴을 확장한다
  (`viewMode`, `selectedNode` 추가). 영속화 없음.
- Rationale: 허브는 재생성되는 정적 파일 — 기존 패턴과 동일하게 페이지
  수명 내 상태면 충분하다.
- Alternatives: localStorage/URL 해시 — 기존 허브에 없는 패턴 도입,
  YAGNI로 기각.

## D4. 스키마 검증 방식

- Decision: 외부 validator 없이 손검증 함수로 구현한다. 기존
  `feature-definition-schema.mjs`(config JSON을 읽어 모듈로 노출)
  패턴을 따라 `sitemap-schema` 로더 + 검증기를 lib에 둔다.
- Rationale: 외부 의존성 0 제약. 검증 항목이 작다(필수 키, surface
  key 3종, id 문자열, children 배열, 중복 id/alias).
- Alternatives: ajv 등 JSON Schema validator — 의존성 추가로 기각.

## D5. Area ↔ 노드 매칭 규칙

- Decision: `trim` 후 정확 일치. 우선순위 노드 `id` → `aliases`.
  기존 `rowArea(row)` 헬퍼를 매칭 입력으로 재사용한다.
- Rationale: 느슨한 매칭(부분 일치)은 오배치 위험이 더 크다. 미배치
  버킷 + 힌트가 교정 루프를 담당한다.
- Alternatives: 대소문자 무시/부분 일치 — 예측 불가 배치로 기각.

## D6. data/ 경로 project-owned 분류

- Decision: 구현 중 `prune-stale.mjs`, `generate-manifest.mjs`, 셸
  fallback, 정책 문서에서 `data/`(또는 `data/sitemap.json`) 분류를
  확인하고 누락 시 함께 갱신한다. 전용 테스트로 고정한다.
- Rationale: specs/.specify 오등재 버그(4c48359) 재발 방지 — 새
  프로젝트-소유 경로는 3경로(Node 분류기·셸 fallback·정책) 동시 갱신.
- Alternatives: 없음(저장소 규칙).

## D7. 사이트맵 보드 마크업 방식

- Decision: 기존 렌더러와 동일하게 문자열 결합 + `escapeHtml`로
  생성한다. 트리는 `<details>`/버튼 기반 접이식, 카드는 기존
  doc-card 패턴 변형.
- Rationale: 렌더러 전체가 이 패턴 — 일관성 유지, 프레임워크 도입
  금지 제약.
- Alternatives: 템플릿 라이브러리 — 의존성 0 위반으로 기각.

## Post-review Direction

- Decision: 007은 현재 합의된 사이트맵 보드 MVP 범위로 검수를 마친다.
- Decision: 상세 명세 aggregation, typed traceability, 관계도/user-flow
  view, delivery intelligence는 별도 후속 기능으로 계획한다.
- Rationale: 위 항목은 007의 명시적 비범위와 `Area` 재사용 계약을 넘어
  schema/scanner/renderer/status 의미를 함께 바꾸는 새로운 범위다.
- Evidence: [implementation-basis.md](./implementation-basis.md)의
  E1~E6, R1~R6, Option B, Gate 0~Slice 4.
