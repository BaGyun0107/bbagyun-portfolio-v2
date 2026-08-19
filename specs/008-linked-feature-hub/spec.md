# Feature Specification: 연결형 기능 허브 v2

**Feature Branch**: `008-linked-feature-hub`

**Created**: 2026-07-16

**Status**: Implemented

**Input**: User description: "007-sitemap-board의 구현 판단 근거를 바탕으로 기능 상세 aggregation, 구조화된 traceability, 사이트맵 관계도와 user-flow view, delivery intelligence를 기존 진실의 원천을 연결하는 방식으로 구현한다. include test tasks (TDD)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 구현 가능한 기능 상세 확인 (Priority: P1)

PM/PL, 디자이너, 개발자, AI가 기능 카드 하나에서 기능의 목적, 사용자
시나리오, 인수 조건, 예외, 요구사항, 성공 기준과 원본 문서를 함께 확인한다.

**Why this priority**: 현재 허브의 가장 큰 공백은 정보 부재가 아니라 이미
존재하는 Spec Kit 상세 정보가 기능정의 상세와 연결되지 않는 점이다.

**Independent Test**: 상세 spec이 연결된 기능과 연결되지 않은 기능을 각각
열어, 전자는 구조화된 상세와 원본 링크를 표시하고 후자는 명확한 미연결
상태를 표시하는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 기능 ID와 같은 spec이 존재, **When** 기능 상세를 열면,
   **Then** 요약, 사용자 시나리오, 인수 조건, edge case, 기능 요구사항,
   성공 기준과 원본 링크가 섹션별로 보인다.
2. **Given** 명시적 `specified-by` 관계가 존재, **When** 기능 상세를 열면,
   **Then** ID 자동 연결보다 명시적 관계가 우선해 지정된 spec을 사용한다.
3. **Given** 연결된 spec이 없음, **When** 기능 상세를 열면, **Then** 기존
   행 정보는 유지되고 상세 원본 미연결 안내가 보인다.

---

### User Story 2 - 누락과 끊어진 관계 탐지 (Priority: P2)

PM/PL과 AI가 사용자 요구, 기능, 화면, 흐름, spec, 테스트 사이의 관계를
구조화된 ID로 추적하고 orphan, broken link, 미검증 상태를 한눈에 찾는다.

**Why this priority**: 자유 텍스트 연결만으로는 누락과 충돌을 결정적으로
검출할 수 없고, 구현 범위와 테스트 근거가 쉽게 분리된다.

**Independent Test**: 유효 관계, 존재하지 않는 endpoint, 중복 관계,
미연결 기능을 포함한 fixture를 빌드해 유효 관계는 유지되고 문제는 비차단
힌트와 health 요약으로 보고되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 유효한 관계 원본, **When** 허브를 생성하면, **Then** 관계별
   출발·도착 entity와 유형을 탐색할 수 있다.
2. **Given** endpoint가 없거나 관계가 중복됨, **When** 허브를 생성하면,
   **Then** 생성은 성공하고 broken/duplicate 건수가 경고와 요약에 나온다.
3. **Given** 사용자 요구, 화면, 흐름, spec 또는 검증과 연결되지 않은 기능,
   **When** health 요약을 보면, **Then** orphan 유형별 건수를 확인할 수 있다.

---

### User Story 3 - 사이트맵 관계와 사용자 흐름 탐색 (Priority: P3)

사용자가 같은 기능정의서 화면에서 사이트맵 계층은 관계도로, 목표 달성
과정은 user-flow로 구분해 보고, 트리·표와 동일한 선택·필터 상태로 탐색한다.

**Why this priority**: 사이트맵과 사용자 흐름은 서로 다른 질문에 답하지만
같은 기능·화면 ID를 공유할 때 전체 구조를 빠르게 이해할 수 있다.

**Independent Test**: 화면 계층, 교차 관계, 분기형 flow fixture로 관계도와
flow view를 전환하고 키보드 탐색, 상세 선택, 텍스트/표 대체를 확인한다.

**Acceptance Scenarios**:

1. **Given** 확정 사이트맵, **When** 관계도 보기를 선택하면, **Then**
   surface별 화면 계층, 기능 수, 빈 화면, 미배치 상태가 보인다.
2. **Given** 화면 간 관계, **When** 노드를 선택하면, **Then** 연결 대상과
   관계 유형이 시각적 연결과 텍스트 목록으로 함께 제공된다.
3. **Given** 분기를 가진 사용자 흐름, **When** flow 보기를 선택하면,
   **Then** actor, goal, 단계, 조건, 종료 상태와 연결 기능·화면이 보인다.
4. **Given** 검색·Phase·처리 상태 필터와 선택 노드, **When** relation,
   tree, table, flow를 왕복하면, **Then** 가능한 범위에서 동일한 상태가
   유지된다.

---

### User Story 4 - 검증 근거로 완료 판단 (Priority: P4)

PL과 리뷰어가 기능 현황에서 진행률뿐 아니라 다음 작업, 마지막 상태 변경,
열린 결정, 인수·검증 coverage를 확인하고 증거가 갖춰진 기능만 완료 후보로
판단한다.

**Why this priority**: task 100%만으로 완료를 판단하면 수동 인수 검증이나
열린 결정이 남은 기능도 완료처럼 보일 수 있다.

**Independent Test**: task 완료 여부, verification 체크박스, 열린 결정이
서로 다른 feature fixtures를 스캔해 카드 지표와 상태 전이 제안이 기대한
조합에서만 나오는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 미완료 task가 있음, **When** 기능 현황을 보면, **Then** 첫
   미완료 task가 다음 작업으로 보인다.
2. **Given** 상태 이력이 있음, **When** 기능 현황을 보면, **Then** 마지막
   전이 상태와 날짜가 보인다.
3. **Given** task가 모두 완료됐지만 검증 체크나 결정이 남음, **When** 상태
   동기화를 실행하면, **Then** `done` 전이를 제안하지 않는다.
4. **Given** task·검증이 모두 완료되고 열린 결정이 없음, **When** 상태
   동기화를 실행하면, **Then** `in-review`에서 `done`으로의 인접 전이를
   제안한다.

### Edge Cases

- 관계 또는 user-flow 파일이 없거나 파싱·스키마 검증에 실패해도 기존
  허브 생성은 성공하고 해당 뷰는 안내형 빈 상태를 표시한다.
- 같은 endpoint 쌍과 relation type이 반복되면 첫 선언만 사용하고 중복을
  경고한다.
- 명시적 spec 관계와 ID 자동 연결이 충돌하면 명시적 관계가 우선한다.
- flow step의 `next`가 존재하지 않는 step을 가리키거나 순환하면 경고하고
  접근 가능한 나머지 flow는 표시한다.
- spec의 선택 섹션이 없으면 존재하는 섹션만 표시하고 내용을 추측하지 않는다.
- verification 파일이 없으면 0%가 아니라 `미기록`으로 구분한다.
- 필터로 flow의 모든 연결 기능이 제외되면 flow 자체를 숨기지 않고 `일치
  기능 0건` 상태를 표시한다.
- 수백 개 node·feature가 있어 시각적 선이 복잡해지면 선택 노드 중심으로
  관계를 강조하고 전체 관계는 텍스트 목록에서 탐색할 수 있어야 한다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 기능정의 행은 검색·분류용 카탈로그로 유지하고 상세 spec,
  진행, 검증 정보를 기존 원본에서 파생해야 한다.
- **FR-002**: 기능과 spec은 동일 ID 자동 연결을 기본으로 하되 명시적
  `specified-by` 관계가 있으면 이를 우선해야 한다.
- **FR-003**: 연결된 spec에서 사용자 시나리오, 인수 조건, edge case,
  기능 요구사항, 성공 기준을 구조화해 기능 상세에 표시해야 한다.
- **FR-004**: 상세 spec이 없거나 일부 섹션이 없을 때 기존 행 상세를
  유지하고 누락 상태를 명시해야 한다.
- **FR-005**: 선택적 typed relation 원본은 stable entity ID, 출발·도착
  entity type, relation type을 가지며 중복과 broken endpoint를 검출해야 한다.
- **FR-006**: 관계 원본 부재·손상은 전체 빌드를 차단하지 않아야 한다.
- **FR-007**: relation health는 broken, duplicate, orphan feature/screen/
  flow/spec/verification을 유형별로 보고해야 한다.
- **FR-008**: 선택적 user-flow 원본은 flow ID, actor, goal, 단계 ID,
  단계 종류, 조건부 다음 단계, 연결 화면·기능을 표현해야 한다.
- **FR-009**: flow의 중복 ID, broken next, broken screen/feature 연결,
  순환을 검출하고 접근 가능한 데이터는 계속 제공해야 한다.
- **FR-010**: 기능정의서에는 relation, tree, table, flow 보기가 제공되고
  검색·분류 필터와 선택 상태를 공유해야 한다.
- **FR-011**: relation view는 surface별 화면 계층과 교차 관계를 구분하고
  선택 node의 인접 관계를 강조해야 한다.
- **FR-012**: 시각적 관계와 flow의 핵심 의미는 키보드로 탐색 가능한
  텍스트 또는 표 형태로도 제공해야 한다.
- **FR-013**: 기능 현황은 다음 미완료 task, 마지막 상태 전이, 열린 결정,
  task 진행률과 verification coverage를 표시해야 한다.
- **FR-014**: verification 파일이 없거나 체크 항목이 없으면 완료로
  추정하지 않고 `미기록`으로 표시해야 한다.
- **FR-015**: `in-review`에서 `done` 전이는 task 100%, verification
  100%, 열린 결정 0건인 경우에만 제안해야 한다.
- **FR-016**: 기존 `Area` exact-match 사이트맵 배치는 하위 호환 fallback으로
  유지하고 명시적 screen 관계가 있으면 이를 우선해야 한다.
- **FR-017**: 새 원본의 오류와 orphan coverage는 생성 종료 시 비차단
  힌트로 보고해야 한다.
- **FR-018**: 기존 tree/table, 검색, 필터, 상세 열기, 단일 정적 문서,
  외부 런타임 의존성 없는 동작을 유지해야 한다.
- **FR-019**: 구현은 사용자 소유 `data/sitemap.json`을 자동 수정하거나
  샘플 여부를 추측해 삭제해서는 안 된다.

### Key Entities

- **Feature Catalog Row**: 검색·분류용 기능 ID와 요약 메타데이터.
- **Spec Detail**: 기존 feature spec에서 파생한 시나리오, 인수 조건,
  edge case, 요구사항, 성공 기준.
- **Traceability Link**: 두 entity endpoint와 관계 유형을 잇는 typed link.
- **User Flow**: actor와 goal을 가진 단계 그래프. 단계는 화면·기능과 연결된다.
- **Coverage Health**: broken, duplicate, orphan, verification 상태의 집계.
- **Delivery Evidence**: task, verification, 열린 결정, 상태 이력에서 파생한
  기능별 완료 판단 정보.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 연결된 기능은 카드 선택 후 1개 화면 안에서 정상 흐름,
  예외, 인수 조건, 의존성과 원본 링크를 확인할 수 있다.
- **SC-002**: 사용자는 2회 이하의 선택으로 화면 node에서 연결 기능·flow,
  또는 기능에서 연결 화면·spec·검증으로 이동할 수 있다.
- **SC-003**: fixture에 주입한 broken·duplicate·orphan 관계의 100%가 유형별
  health 결과에 포함되고 유효 관계는 손실되지 않는다.
- **SC-004**: 관계·flow 원본이 부재하거나 손상된 모든 검증 시나리오에서
  기존 기능정의 탐색과 문서 생성이 계속 성공한다.
- **SC-005**: relation, tree, table, flow 전환 후 검색·분류 필터와 선택
  상태가 100% 유지된다.
- **SC-006**: 키보드만 사용해 view 전환, node/flow 선택, 상세 열기와
  대체 관계 목록 탐색을 완료할 수 있다.
- **SC-007**: `done` 후보는 task·verification 100%와 열린 결정 0건을 모두
  충족하며, 하나라도 충족하지 않은 fixture에는 완료 전이가 제안되지 않는다.
- **SC-008**: 500개 기능, 100개 화면, 50개 flow fixture에서 문서 생성이
  2초 이내에 완료되고 생성된 화면이 모든 entity를 탐색 가능하게 유지한다.

## Assumptions

- 승인된 방향은 `007`의 Option B와 D2~D6 권고다: 기존 Spec Kit 원본을
  재사용하고 typed relation과 별도 user-flow 계약을 점진적으로 추가한다.
- D1은 사용자 데이터 소유권 때문에 구현과 분리한다. 현재 미추적
  `data/sitemap.json`은 수정·삭제하지 않고 fixture로 기능을 검증한다.
- 새 relation과 user-flow 원본은 선택 사항이며 없는 프로젝트는 기존
  sitemap board만 사용한다.
- 관계 편집 UI, 그래프 데이터베이스, 외부 시각화 라이브러리, 협업 편집,
  import/export 편집기는 이번 범위에서 제외한다.
- 실제 구현은 TDD로 진행하며 각 behavior 구현 전에 실패 테스트를 만든다.
