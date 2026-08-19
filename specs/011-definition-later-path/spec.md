# Feature Specification: 정의-후행(definition-later) 경량 경로

**Feature Branch**: `011-definition-later-path`

**Created**: 2026-07-17

**Status**: Draft

**Input**: User description: "정의-후행(definition-later) 경량 경로:
기능정의서에 없는 기능을 먼저 구현하는 bottom-up/유지보수 흐름을 1급
시민으로 지원한다. FEAT stub 경량 등록, 미등록 기능 버킷 투영,
status.yaml featureId 역방향 연결, specs deliverySource 투영.
include test tasks (TDD)"

## Clarifications

### Session 2026-07-17

- Q: FEAT stub(draft 정의)의 생성 방식은? → A: 명시 명령(mise 태스크)
  으로만 생성하고, 미등록 work item 발견 시 빌드/sync가 등록 명령을
  비차단 제안으로 안내한다. 자동 생성·자동 승격은 하지 않는다.
- Q: specs deliverySource와 delivery-evidence.json 공존 시 우선순위는?
  → A: 명시 evidence가 우선하고, spec 스캔 투영은 evidence에 없는
  기능만 보충한다(명시 기록 우선 원칙).
- Q: 역방향 `featureId`와 planning 명시 관계가 충돌하면? → A: planning
  관계가 우선하고 충돌은 health 진단으로 노출한다(typed relation
  override 선례와 일관).
- Q: 미등록 기능 work item에 대한 merge 게이트(planning:check) 취급은?
  → A: 실패시키지 않고 경고 + 미등록 기능 개수를 리포트에 노출한다.
  항목 3(워크플로 통합) 도입 후 조이기를 재검토할 수 있다.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 미등록 기능의 작업이 보인다 (Priority: P1)

개발자가 카탈로그에 아직 없는 기능 ID로 work item을 기록해도, 기능
현황에서 그 작업이 "미등록 기능" 묶음으로 보이고 정의가 필요하다는
안내가 함께 표시된다.

**Why this priority**: 현재는 미등록 ID의 work item이 health 진단만
남기고 조용히 버려진다. bottom-up 흐름의 최소 안전망이며, 이것 하나만
있어도 "먼저 구현" 작업 기록이 데이터를 잃지 않는다.

**Independent Test**: 카탈로그에 없는 `FEAT-X`를 가리키는 explicit
work item 하나로 허브를 빌드해, 카드가 미등록 묶음에 표시되고 정의
생성 안내가 보이는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 카탈로그에 없는 `featureDefinitionId`의 유효한 work item,
   **When** 허브를 빌드하면, **Then** 카드가 미등록 기능 묶음에
   나타나고 기존 health 진단도 유지된다.
2. **Given** 미등록 묶음의 기능이 이후 카탈로그에 정식 등록됨,
   **When** 재빌드하면, **Then** 같은 work item이 정식 기능 아래로
   이동하고 미등록 묶음에서 사라진다.

---

### User Story 2 - FEAT stub 경량 등록 (Priority: P2)

구현을 시작하는 사람이 11그룹 상세를 쓰지 않고도 최소 필드(id, title,
summary, `definitionStatus: draft`)만으로 기능을 카탈로그에 등록해
연결 고리를 확보한다. 소급 상세 작성은 열린 결정으로 남는다.

**Why this priority**: 유지보수 한 건에 정식 계약(11그룹 + acceptance)
을 요구하면 현실적으로 스킵되고 데이터가 부패한다. 경량 등록이 있어야
미등록 묶음이 상시 적체되지 않는다.

**Independent Test**: stub 등록 경로를 실행해 카탈로그에 draft 항목이
생기고, 소급 상세 필요가 열린 결정으로 남으며, 완료 판정이 차단 사유와
함께 막히는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 카탈로그에 없는 기능명, **When** stub 등록 경로를
   실행하면, **Then** draft 항목이 생성되고 열린 결정(소급 상세 필요)이
   함께 기록된다.
2. **Given** draft stub에 연결된 work item의 `done` 요청, **When**
   완료 가드를 평가하면, **Then** acceptance 부재로 차단되고 사유가
   카드에 표시된다(기존 가드와 일관).
3. **Given** 이미 존재하는 ID로 stub 등록 시도, **When** 실행하면,
   **Then** 생성 대신 기존 항목을 안내하고 아무것도 덮어쓰지 않는다.

---

### User Story 3 - spec에서 기능으로 역방향 연결 (Priority: P2)

spec을 만드는 사람이 `specs/<NNN>/status.yaml`에 기능 ID를 적으면,
planning 원본을 고치지 않아도 spec과 기능 정의가 연결되어 기능 상세와
추적성에 반영된다.

**Why this priority**: 현재 연결은 planning 쪽(`traceability.specIds`,
`specified-by`)에서만 가능해 bottom-up 작업자가 연결을 만들 수 없다.

**Independent Test**: `featureId`를 가진 status.yaml 하나로 빌드해
해당 기능의 상세에 spec 연결이 나타나는지, planning 쪽 명시 관계와
충돌 시 진단이 나오는지 확인한다.

**Acceptance Scenarios**:

1. **Given** `featureId: FEAT-X`를 가진 spec status.yaml, **When**
   빌드하면, **Then** FEAT-X의 상세/추적성에 해당 spec 연결이 보인다.
2. **Given** planning 쪽 명시 관계가 같은 spec을 다른 기능에 연결,
   **When** 빌드하면, **Then** planning 관계가 우선하고 충돌 진단이
   health로 표시된다.

---

### User Story 4 - specs 기반 워크스페이스의 현황 유지 (Priority: P3)

deliverySource가 spec 디렉터리인 워크스페이스(예: harness-internal)에
카탈로그가 도입되어도, spec 유래 상태·진행률이 사라지지 않고 delivery
근거로 투영된다.

**Why this priority**: 현재 planning 경로는 `delivery-evidence.json`만
읽어, 카탈로그 도입 순간 spec 유래 행이 화면에서 사라진다(재현 확인됨).
bottom-up 프로젝트의 이행 경로를 막는 잠복 회귀다.

**Independent Test**: 카탈로그 + specs deliverySource 워크스페이스를
빌드해 spec 유래 현황이 delivery 근거로 나타나는지 확인한다.

**Acceptance Scenarios**:

1. **Given** planningSource에 카탈로그가 있고 deliverySource가 spec
   디렉터리인 워크스페이스, **When** 빌드하면, **Then** spec 스캔
   결과(상태·진행률)가 해당 기능의 delivery 근거로 투영된다.
2. **Given** 같은 디렉터리에 `delivery-evidence.json`도 존재, **When**
   빌드하면, **Then** 명시 evidence가 우선하고 spec 투영은 evidence에
   없는 기능만 보충한다.

---

### Edge Cases

- 미등록 묶음의 work item이 가리키는 ID가 이후 다른 의미로 재사용되면?
  (ID 불변 규칙 위반 — 진단으로 노출하되 자동 병합하지 않는다)
- draft stub만 있고 work item이 없는 기능은 어디에 보이는가? (정의
  목록에 draft 배지로 표시, 현황에는 작업 없음)
- `featureId`가 존재하지 않는 FEAT ID를 가리키면? (미등록 기능과 같은
  안내 — stub 등록 유도)
- status.yaml `featureId`와 planning 관계가 순환/상호 모순이면?
  (planning 우선 + conflict 진단, 빌드는 성공)
- stub 생성 경로가 planning source 쓰기 권한이 없는 환경(분리 저장소
  전환 후)에서 실행되면? (제안만 남기고 실패하지 않는다)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 카탈로그에 없는 `featureDefinitionId`를 가진 유효한
  explicit work item은 버려지지 않고 "미등록 기능" 묶음으로 투영되어
  기능 현황에 표시되어야 한다. 기존 health 진단은 유지된다.
- **FR-002**: 미등록 묶음은 정식 기능과 시각적으로 구분되고, 정의
  생성(stub 등록) 유도 안내를 함께 표시해야 한다.
- **FR-003**: 최소 필드(id, title, summary, `definitionStatus: draft`)
  만으로 기능을 등록하는 **명시 명령형** stub 경로가 있어야 하며,
  11그룹 상세를 강제하지 않고 소급 상세 필요를 열린 결정으로 남겨야
  한다. 미등록 work item 발견 시 빌드/sync는 이 명령을 비차단 제안으로
  안내한다.
- **FR-004**: stub 등록은 기존 ID를 덮어쓰지 않아야 하며, ID 중복 시
  생성 대신 기존 항목을 안내해야 한다(ID 불변 규칙 유지).
- **FR-005**: draft 정의에 연결된 work item의 완료 판정은 기존 완료
  가드에 따라 차단되고, 차단 사유(acceptance 부재)가 명확히 표시되어야
  한다.
- **FR-006**: `specs/<NNN>/status.yaml`은 선택 필드 `featureId`를
  지원하고, 스캐너는 이를 spec→기능 연결로 반영해야 한다.
- **FR-007**: 역방향 연결(`featureId`)과 planning 순방향 연결
  (`traceability.specIds`/`specified-by`)이 충돌하면 planning 쪽이
  우선하고 충돌은 health 진단으로 노출되어야 한다.
- **FR-008**: planning 경로 워크스페이스에서 deliverySource가 spec
  디렉터리 구조이면 spec 스캔 결과(상태·진행률)를 delivery 근거로
  투영해야 한다. `delivery-evidence.json`이 함께 있으면 명시 evidence가
  우선하고 spec 투영은 누락 기능만 보충한다.
- **FR-009**: 이 경로 전체는 fail-open이어야 한다 — 원본 문제는
  힌트/health로 노출하고 빌드는 성공한다.
- **FR-011**: merge 게이트(planning:check)는 미등록 기능 work item을
  실패로 취급하지 않고, 경고와 미등록 기능 개수를 리포트에 노출해야
  한다.
- **FR-010**: stub 생성이 자동으로 planning source를 편집해서는 안
  된다. 명시 실행(명령) 또는 사람이 승인하는 제안 경로만 허용한다
  (자동 승격 금지 원칙 유지).

### Key Entities

- **FEAT stub**: `definitionStatus: draft`인 최소 FeatureDefinition.
  정식 정의와 같은 ID 공간을 쓰며, 완료 판정이 차단된 상태임이 구분
  표시된다.
- **미등록 기능 묶음**: 카탈로그에 없는 ID를 가리키는 work item들의
  투영 그룹. 정식 기능이 생기면 해체된다.
- **역방향 연결**: spec status.yaml의 `featureId`. planning 순방향
  연결과 함께 양방향 정합 규칙(planning 우선)을 따른다.
- **spec 유래 delivery 근거**: spec 스캔 결과를 delivery 축으로 투영한
  레코드. 명시 evidence보다 후순위다.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 카탈로그에 없는 기능 ID로 기록한 work item이 기능 현황
  화면에서 100% 표시된다(현재 0% — 조용히 드롭).
- **SC-002**: 정의 없이 시작한 기능을 연결 상태(정의 stub + spec 연결
  + 작업 카드)로 만드는 데 필요한 수작업이 파일 3곳 편집에서 1회
  등록 + 1개 필드 기입 이하로 줄어든다.
- **SC-003**: harness-internal처럼 spec 기반으로 운영되던 워크스페이스에
  카탈로그를 도입해도 기존에 보이던 spec 유래 현황 정보가 손실 없이
  유지된다.
- **SC-004**: draft 정의의 완료 차단 사유가 현황 카드에서 즉시 확인
  가능하고, 소급 상세 필요 항목이 열린 결정 목록에 누락 없이 나타난다.
- **SC-005**: 기존 전체 테스트와 planning:check 게이트가 회귀 없이
  통과한다.

## Assumptions

- stub 생성 방식, evidence 우선순위, 연결 충돌 규칙, 게이트 취급은
  Clarifications(Session 2026-07-17)에서 확정되어 FR-003/007/008/010/011
  에 반영되었다.
- **범위 제외**: 분리 저장소(planning-hub repo) 전환 후의 stub 전송
  경로는 이 기능의 범위가 아니다(현행 단일 저장소 기준). 미등록 묶음의
  자동 정식 승격도 범위 밖이다.
- **대상 사용자**: 하네스를 쓰는 다운스트림 프로젝트의 개발자와
  harness-internal 워크스페이스. 데모 워크스페이스는 회귀 검증용으로만
  다룬다.
