# Feature Specification: 기능정의서 탭 데이터 소스 전환

**Feature Branch**: `feat/feature-definition-schema`

**Created**: 2026-07-10

**Status**: Draft

**Input**: 기능정의서 탭의 데이터 소스를 STICKY v1 HTML 하드코딩에서 normalizer
산출물(`data/feature-definitions.json`)로 전환한다. 002-feature-hub의 후속 기능.
STICKY 절대경로 하드코딩 제거, 소스 부재 시 빈 탭 + 빌드 성공.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 정규화 산출물이 기능정의서 탭에 표시됨 (Priority: P1)

기능정의 담당자(PM/PL)가 외부 문서를 `codi-feature-definition-normalizer`로 정규화해
`data/feature-definitions.json`을 만들고 허브를 생성하면, 그 내용이 기능정의서 탭에
엑셀형 마스터 테이블로 표시된다.

**Why this priority**: 이 기능의 핵심 가치. normalizer 산출물과 허브 사이의 끊긴
연결(adapter 미구현)을 잇는 것이며, 이것 없이는 기능정의서 탭이 어떤 프로젝트에서도
정상 동작하지 않는다.

**Independent Test**: 저장소 루트에 `data/feature-definitions.json`을 두고
`mise run docs:build`를 실행하면, 생성된 HTML의 기능정의서 탭에 그 행들이
canonical 컬럼으로 렌더되고 검색·필터가 동작하는 것으로 검증 가능.

**Acceptance Scenarios**:

1. **Given** 저장소 루트에 유효한 `data/feature-definitions.json`이 있는 상태,
   **When** 허브 생성을 실행하면, **Then** 기능정의서 탭에 그 행들이 스키마 canonical
   컬럼으로 표시된다.
2. **Given** 생성된 기능정의서 탭, **When** 사용자가 상세 검색어를 입력하면,
   **Then** 일치하는 기능정의 행만 실시간으로 필터링된다.
3. **Given** `data/feature-definitions.json`의 행 수가 N개인 상태, **When** 허브를
   생성하면, **Then** 생성 로그에 기능정의 건수 N이 보고된다.

---

### User Story 2 - 소스가 없어도 허브 생성이 성공함 (Priority: P1)

기능정의 데이터가 아직 없는 프로젝트(예: 새로 clone한 팀원 머신)에서 허브를
생성해도, 기능정의서 탭만 비어 있을 뿐 나머지 허브(역할 카드, 문서 색인, 기능 현황)는
정상 생성되고 빌드가 실패하지 않는다.

**Why this priority**: 현재 STICKY 하드코딩 경로가 팀원 머신에 없어 발생하던 문제를
근본적으로 해결한다. 소스 부재가 정상 상태여야 팀 공유가 가능하다.

**Independent Test**: 저장소에 `data/feature-definitions.json`이 없는 상태에서
`mise run docs:build`를 실행하면 exit 0으로 성공하고, 기능정의서 탭은 "기능정의
데이터 없음" 상태로 렌더되며, 다른 탭은 정상 표시되는 것으로 검증 가능.

**Acceptance Scenarios**:

1. **Given** 저장소에 `data/feature-definitions.json`이 없는 상태, **When** 허브
   생성을 실행하면, **Then** 빌드가 성공하고 기능정의서 탭은 `specs/`의 각 기능이
   자동 파생된 canonical 행(`Source=spec`)으로 렌더된다. spec도 소스도 하나도 없을
   때만 완전히 비어 있다(US4 후속 반영).
2. **Given** 소스 파일이 없는 상태, **When** 허브를 생성하면, **Then** 역할 카드·문서
   색인·기능 현황 탭은 영향 없이 정상 표시된다.
3. **Given** 소스 파일이 없는 상태, **When** 허브를 생성하면, **Then** 어떤 로컬 절대
   경로(특정 머신의 STICKY 경로 등)도 참조하지 않는다.

---

### User Story 4 - specs가 기능정의서에 자동 반영됨 (Priority: P1, 후속 2026-07-10)

`specs/<NNN>/status.yaml`이 있는 기능은 `data/feature-definitions.json` 유무와
무관하게 기능정의서 탭에 canonical 행으로 자동 표시된다. 이로써 기능현황 탭과
기능정의서 탭이 항상 같은 기능 집합을 본다(동기화). normalizer 산출물이 있고 그
행의 `Row_ID`가 spec id와 일치하면 normalizer 행이 우선하며, normalizer가 비워둔
컬럼만 spec status.yaml 값으로 채워진다(fill-in). 소스가 먼저 있든 spec이 먼저 있든
같은 결과로 수렴한다.

**Why this priority**: 기능현황과 기능정의서가 다른 소스라 동기화되지 않던 문제를
해소한다. 두 탭이 같은 기능을 보여야 팀이 하나의 기준으로 문서를 읽는다.

**Independent Test**: `data/feature-definitions.json` 없이 `mise run docs:build`를
실행하면 기능정의서 탭에 각 spec이 canonical 행으로 나타나고 `Source` 컬럼이 `spec`,
`Row_ID`가 spec id로 표시된다. 빌드는 exit 0.

**Acceptance Scenarios**:

1. **Given** 소스 없이 specs만 있는 상태, **When** 허브를 생성하면, **Then**
   기능정의서 탭에 spec 수만큼 파생 행이 `Source=spec`으로 표시된다.
2. **Given** `Row_ID`가 spec id와 같은 normalizer 행이 있는 상태, **When** 허브를
   생성하면, **Then** 그 행은 normalizer 값을 유지하고 빈 컬럼만 spec 값으로 채워지며
   중복 행은 생기지 않는다.
3. **Given** normalizer 행과 spec의 id가 다른 상태, **When** 허브를 생성하면, **Then**
   두 행이 각각 독립 행으로 표시된다.

---

### User Story 3 - 손상된 소스에서도 빌드가 무너지지 않음 (Priority: P2)

`data/feature-definitions.json`이 깨진 JSON이거나 스키마와 맞지 않아도, 허브 생성은
경고를 남기고 계속 진행되어 나머지 허브를 만든다.

**Why this priority**: 기존 허브 생성기의 fail-open 원칙(잘못된 입력은 건너뛰고
경고)과 일관성을 유지한다. 한 입력 파일의 문제가 전체 허브를 막지 않아야 한다.

**Independent Test**: 깨진 JSON 파일을 두고 허브를 생성하면 exit 0으로 성공하고,
경고 메시지가 출력되며, 기능정의서 탭은 빈 상태로 렌더되는 것으로 검증 가능.

**Acceptance Scenarios**:

1. **Given** 파싱 불가능한 `data/feature-definitions.json`, **When** 허브를 생성하면,
   **Then** 빌드가 실패하지 않고 경고를 출력하며 기능정의서 탭은 빈 상태가 된다.
2. **Given** 최상위 구조가 기대와 다른 소스 파일, **When** 허브를 생성하면,
   **Then** 경고를 남기고 인식 가능한 행만 표시하거나 빈 상태로 처리한다.

---

### User Story 5 - top-down 중복 방지 (Priority: P2, 후속 2026-07-10)

기능정의서를 먼저 선언한 뒤 그 기능의 spec을 만들 때, spec id가 원장 Row_ID와
어긋나면 기능정의서에 원장 행과 spec 파생 행이 중복 생성될 수 있다. 이를 예방(생성
전 `feature:seed-check` 탐색)·유도(스킬 절차)·탐지(`docs:build` 비차단 중복 경고)
3층으로 막는다.

**Independent Test**: 원장 `010-login` + spec `010-login-flow`로 빌드하면 `▸ 중복
의심` 경고가 출력되고, `feature:seed-check "로그인"`은 `010-login`을 안내한다.

### Edge Cases

- 소스 파일은 있으나 행 배열이 비어 있을 때 → 빈 테이블로 렌더(경고 없이 정상).
- 개별 행에 canonical 필드 일부가 없을 때 → 해당 셀을 빈 값으로 채우고 행은 표시.
- 소스 파일에 스키마에 없는 추가 필드가 있을 때 → canonical 컬럼만 사용하고 무시.
- 색인/렌더 대상이 전혀 없을 때에도 단일 HTML은 생성되어야 한다.

## Requirements *(mandatory)*

### Functional Requirements

**기능정의서 소스 전환 (US1)**

- **FR-001**: 시스템은 기능정의서 탭의 데이터를 저장소 루트의 정규화된 기능정의
  산출물 파일에서 읽어야 한다. 이 파일은 `codi-feature-definition-normalizer`가
  산출하는 계약 형식을 따른다.
- **FR-002**: 시스템은 기능정의서 탭을 렌더할 때 기능정의 스키마의 canonical
  필드/컬럼 정의를 사용해야 하며, 별도의 중복 컬럼 정의를 만들지 않아야 한다(단일
  스키마 원천 유지).
- **FR-003**: 시스템은 허브 생성 시 기능정의서 탭에 반영된 기능정의 행 수를 보고해야
  한다.

**소스 부재/견고성 (US2, US3)**

- **FR-004**: 정규화된 기능정의 소스 파일이 존재하지 않아도 허브 생성은 실패하지
  않아야 하며, 기능정의서 탭은 비어 있음을 알리는 상태로 렌더되어야 한다.
- **FR-005**: 소스 파일이 없거나 손상되었을 때에도 역할 카드·문서 색인·기능 현황 탭은
  영향 없이 정상 생성되어야 한다.
- **FR-006**: 소스 파일이 손상되었거나(파싱 불가) 최상위 구조가 기대와 다를 때,
  시스템은 빌드를 중단하지 않고 경고를 남기며 인식 가능한 데이터만 반영하거나 빈
  상태로 처리해야 한다.

**STICKY 하드코딩 제거 (US2)**

- **FR-007**: 시스템은 특정 로컬 머신에 종속된 절대경로(STICKY v1 서비스정의 HTML
  경로 등)를 기본 소스로 사용하지 않아야 하며, 어떤 코드 경로에서도 그 경로를
  참조하지 않아야 한다.
- **FR-008**: 기능정의서 데이터 소스를 지정하는 기존 환경변수 기반 우회
  (`SERVICE_DEFINITION_HTML`)는 제거되어야 하며, 소스 위치는 정해진 저장소 내
  규약 경로로 고정되어야 한다.

**품질/경계**

- **FR-009**: 기능정의서 소스를 읽는 구성 단위는 (정상 입력, 소스 부재, 손상된 입력)
  각각에 대해 독립적으로 단위 테스트 가능해야 한다.
- **FR-010**: 기능 현황 탭(specs/status.yaml 기반)의 동작, registry 병합 로직,
  normalizer 스킬의 정규화 로직은 이 기능으로 변경되지 않아야 한다.

### Key Entities *(include if feature involves data)*

- **기능정의 행(Feature Definition Row)**: 기능정의 마스터 테이블의 한 행. 기능정의
  스키마의 canonical 필드(Row ID, 제목 등)를 값으로 가진다. 정규화 산출물 파일의 한
  항목에 대응한다.
- **정규화 기능정의 소스(Normalized Feature Definition Source)**: 저장소 내 규약
  경로에 위치한 정규화 산출물. 기능정의 행의 배열을 담는다. 선택적으로 존재하며,
  없을 수 있다.
- **기능정의 스키마(Feature Definition Schema)**: canonical 필드와 허브 테이블 컬럼의
  단일 원천 정의. 렌더러와 normalizer가 공유한다(기존 자산, 이 기능이 새로 만들지
  않음).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 저장소 루트에 정규화된 기능정의 소스를 두고 허브를 생성하면, 그 모든
  행이 기능정의서 탭 마스터 테이블에 canonical 컬럼으로 100% 표시된다.
- **SC-002**: 소스 파일이 없는 저장소에서 허브 생성 커맨드가 성공(exit 0)하고,
  기능정의서 탭은 비어 있음 안내로, 나머지 탭은 정상으로 렌더된다.
- **SC-003**: 손상된 소스 파일이 있어도 허브 생성이 성공하고 경고가 출력된다.
- **SC-004**: 생성 코드 및 그 의존 모듈 어디에도 특정 로컬 머신 절대경로가 남아
  있지 않다(정적 검색으로 0건).
- **SC-005**: 기능정의서 소스를 읽는 구성 단위에 대해 정상/부재/손상 세 경우의 자동
  테스트가 존재하고 통과한다.
- **SC-006**: 이 기능 적용 전후로 기능 현황 탭·registry 병합·문서 색인의 렌더 결과가
  동일하다(회귀 없음).

## Assumptions

- 정규화된 기능정의 산출물은 `codi-feature-definition-normalizer`가 만들며, 그 계약
  형식(canonical 필드 기반 행 배열)은 기존 스킬 문서에 정의되어 있다. 이 기능은 그
  형식을 소비만 하고 새로 정의하지 않는다.
- 소스 파일 위치는 저장소 내 규약 경로 하나로 고정한다(플랜 단계에서 정확한 경로
  확정). 여러 후보 경로 탐색은 범위 밖.
- 기능정의 스키마의 canonical 필드/컬럼 정의는 기존
  `feature-definition-schema.json`을 그대로 재사용한다.
- 허브 생성기의 fail-open 원칙(잘못된 입력은 건너뛰고 경고, 빌드는 성공)은 기존
  동작을 따른다.

## Out of Scope

- 기능 현황 탭(specs/status.yaml)의 스캔·상태전이·렌더 동작 변경.
- normalizer 스킬 자체의 정규화 로직 변경(이미 JSON을 산출함).
- registry.json 병합 로직 변경.
- STICKY v1 서비스정의 데이터의 재이식·마이그레이션(원본 데이터를 새 소스로 옮기는
  일회성 작업은 이 기능이 아니라 normalizer 사용으로 처리).
- 커밋 시 허브를 자동 재생성하는 훅.
- 여러 소스 경로 자동 탐색이나 소스 병합.
