# Feature Specification: 하네스 정보구조·기능 추적성·사용자 흐름 정본화

**Feature Branch**: `009-harness-information-architecture`

**Created**: 2026-07-16

**Status**: Implemented

**Input**: User description: "승인된 근거 우선 혼합안에 따라 실제 하네스 사이트맵, 최종 9개 기능의 typed 관계, 온보딩·기능 전달·하네스 배포 사용자 흐름을 사람과 AI가 함께 이해할 수 있는 정본으로 만든다. include test tasks (TDD)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 실제 하네스 구조 탐색 (Priority: P1)

PM/PL, 개발자와 AI가 범용 샘플이 아닌 현재 팀 기능 허브의 화면·콘텐츠
계층을 관계도, 트리와 표에서 같은 안정적 ID로 탐색한다.

**Why this priority**: 실제 제품 구조와 무관한 샘플 사이트맵은 기능 배치와
누락 진단을 왜곡하므로 다른 추적성 작업보다 먼저 정본화해야 한다.

**Independent Test**: 실제 `data/sitemap.json`만 스캔해 세 surface와 17개
node의 순서·ID·계층, 비어 있는 관리자 surface를 검증한다.

**Acceptance Scenarios**:

1. **Given** 생성된 기능 허브, **When** 사이트맵을 열면, **Then** 현재 허브의 가이드·프로젝트 문서·기능정의서·기능 현황·공통 상태만 보인다.
2. **Given** 현재 별도 관리자 웹 화면이 없음, **When** 관리자 surface를 보면, **Then** 추측한 화면 없이 빈 node 목록으로 표시된다.
3. **Given** 범용 사이트맵 예시가 필요함, **When** contract와 fixture를 확인하면, **Then** 예시는 보존되지만 실제 `data/`에는 포함되지 않는다.

---

### User Story 2 - 최종 9개 기능의 근거와 관계 추적 (Priority: P1)

PM/PL과 리뷰어가 사용자 필요에서 기능, 주 화면, Spec, 의존 기능과 실제
검증 기록까지 양방향으로 따라가며 각 명시적 관계의 근거와 확실성을 확인한다.

**Why this priority**: 기능 목록만으로는 왜 만드는지, 어디에 나타나는지,
무엇에 의존하고 어떻게 검증됐는지 판단할 수 없다.

**Independent Test**: 001~009 각 기능이 need, screen, spec에 정확히 한 번
이상 연결되고 status 의존성 및 존재하는 verification 연결이 손실 없이 모델에
보존되는지 검증한다.

**Acceptance Scenarios**:

1. **Given** 최종 기능 9개, **When** 관계 coverage를 계산하면, **Then** 모든 기능이 need·주 화면·Spec과 연결된다.
2. **Given** `status.yaml`의 `depends_on`, **When** typed relation을 읽으면, **Then** 모든 의존성이 같은 방향의 `depends-on` 링크로 보존된다.
3. **Given** 근거 있는 추론 관계, **When** 상세를 열면, **Then** `inferred — PM/PL review` 표시와 근거 경로가 함께 보인다.
4. **Given** verification 문서가 실제로 존재함, **When** 검증 관계를 확인하면, **Then** 기록된 문서만 `verified-by`로 연결되고 미기록 기능을 완료로 추정하지 않는다.

---

### User Story 3 - 세 목표 사용자 흐름 탐색 (Priority: P1)

새 팀원, PM/PL, 하네스 유지보수자가 각각 온보딩, 기능 전달, 하네스 배포
목표를 달성하는 단계·결정·회복 종료점을 관련 기능·화면과 함께 탐색한다.

**Why this priority**: 사이트맵의 구조만으로는 실제 목표 달성 과정과 분기,
실패 복구, 구조에서 빠진 기능을 검증할 수 없다.

**Independent Test**: 세 flow가 actor, goal, 유효한 시작 단계, 결정 단계,
종료 단계, feature/screen 연결을 갖고 broken next나 순환 없이 로드되는지 검증한다.

**Acceptance Scenarios**:

1. **Given** 온보딩 flow, **When** 신규 팀원이 흐름을 따르면, **Then** 준비·초기화·검증·완료 또는 복구 종료를 구분할 수 있다.
2. **Given** 기능 전달 flow, **When** PM/PL이 기능을 추적하면, **Then** 요구·명세·계획·구현·검토·완료 판단과 미충족 종료가 보인다.
3. **Given** 하네스 배포 flow, **When** 유지보수자가 릴리스를 판단하면, **Then** 변경·검증·패키징·배포 준비와 실패 종료가 보인다.
4. **Given** 사용자가 시각화를 사용할 수 없음, **When** 텍스트 또는 표 대체를 보면, **Then** 같은 stable ID와 단계 의미를 확인할 수 있다.

---

### User Story 4 - 오류가 있는 정본의 유효 데이터 보존 (Priority: P2)

문서 소유자가 JSON 원본 전체 또는 일부를 잘못 작성해도 허브 생성이 중단되지
않고 유효한 항목은 유지되며 broken, duplicate, orphan과 미배치가 진단된다.

**Why this priority**: 사람 소유 파일은 점진적으로 편집되므로 일부 오류가
전체 문서 탐색을 막으면 운영 가능한 진실의 원천이 될 수 없다.

**Independent Test**: 기존 scanner의 전체 오류 및 item/edge 오류 fixture와
최종 canonical data를 함께 실행해 fail-open 동작과 health 0건을 각각 검증한다.

**Acceptance Scenarios**:

1. **Given** JSON 파싱 또는 최상위 구조 오류, **When** 빌드하면, **Then** 해당 원본만 비활성화되고 기존 허브는 생성된다.
2. **Given** 일부 link 또는 flow edge 오류, **When** 빌드하면, **Then** 잘못된 항목만 제외되고 나머지는 제공된다.
3. **Given** 최종 canonical data, **When** linked model health를 계산하면, **Then** unassigned·broken·duplicate·orphan이 모두 0이다.

### Edge Cases

- 009 Spec 생성으로 기능 수가 8개에서 9개로 늘어나므로 009도 동일한 coverage 대상에 포함한다.
- 현재 관리자 웹 화면이 없으면 screen을 추론하지 않고 `nodes: []`를 유지한다.
- 한 기능에 여러 `appears-on` 링크가 있으면 첫 유효 링크를 주 화면으로 사용하고 나머지는 보조 화면으로 보존한다.
- `inferred` 관계는 label과 evidence에 검토 필요를 표시하며 근거 없는 `question`은 정본 JSON에서 제외한다.
- 재시도는 graph cycle로 표현하지 않고 recovery end에서 새 flow 실행으로 안내한다.
- relation 또는 flow 원본 전체가 손상되면 해당 원본 단위로, 개별 endpoint가 손상되면 item/edge 단위로 fail-open한다.
- builders와 상태 동기화는 사람이 소유한 `data/` 파일을 자동 수정하지 않는다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 실제 `data/sitemap.json`은 현재 허브 화면·콘텐츠 계층만 표현해야 한다.
- **FR-002**: 범용 샘플은 actual `data/`가 아니라 contract 또는 fixture에만 있어야 한다.
- **FR-003**: 최종 9개 기능은 각각 need, primary screen, spec과 연결되어야 한다.
- **FR-004**: `status.yaml`의 `depends_on`은 typed `depends-on` 관계로 보존되어야 한다.
- **FR-005**: 기록된 verification만 `verified-by` endpoint로 연결해야 한다.
- **FR-006**: 모든 explicit relation은 evidence를 가지며 inferred 관계는 label로 표시해야 한다.
- **FR-007**: 세 flow는 actor, goal, start, decision, recovery/end, feature/screen ID를 가져야 한다.
- **FR-008**: JSON 전체 오류는 원본 단위 fail-open, 개별 오류는 item/edge 단위 fail-open으로 처리해야 한다.
- **FR-009**: 최종 canonical model은 unassigned, broken, duplicate, orphan 0을 달성해야 한다.
- **FR-010**: 이번 기능은 renderer, scanner와 schema를 변경하지 않아야 한다.
- **FR-011**: builders는 human-owned `data/`를 쓰거나 자동 보정하지 않아야 한다.
- **FR-012**: 관계·흐름은 시각화와 텍스트·표 대체에서 같은 stable ID를 사용해야 한다.

### Key Entities

- **Sitemap Surface/Node**: 현재 허브의 화면·콘텐츠 계층. stable ID, 제목, 설명과 자식 node를 가진다.
- **Need**: 기능이 해결하는 사용자·팀의 필요. 한 feature와 `satisfied-by`로 연결된다.
- **Feature**: Spec Kit 기능 001~009. need, screen, spec, 의존성과 선택적 verification에 연결된다.
- **Traceability Link**: 두 entity를 typed relation으로 연결하고 근거와 선택적 추론 표시를 가진다.
- **User Flow/Step**: actor의 목표 달성 과정. 시작·행동·결정·종료 step과 screen/feature 참조를 가진다.
- **Evidence Decision**: confirmed, inferred 또는 question 수준과 출처, 영향 ID, 검토 결과를 기록한다.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: actual sitemap 스캔에서 surface 3개와 node 17개의 ID·순서가 정확히 보존되고 범용 샘플 node는 0개다.
- **SC-002**: 기능 9개 모두 need, primary screen, spec coverage가 100%다.
- **SC-003**: `status.yaml`에서 확인된 의존 관계 10개가 typed relation에 100% 보존된다.
- **SC-004**: 명시적 relation 64개 모두 evidence를 가지며 inferred link는 모두 검토 label을 가진다.
- **SC-005**: 세 user flow 모두 actor, goal, 유효한 시작·결정·종료와 feature/screen 연결을 갖고 broken next와 cycle이 0개다.
- **SC-006**: canonical linked model의 unassigned feature, broken link, duplicate link와 feature/screen/flow/spec/verification orphan이 모두 0개다.
- **SC-007**: focused test, 전체 Node test, rule lifecycle check와 docs build가 모두 성공한다.
- **SC-008**: Chromium desktop과 375×812에서 relation/tree/table/flow/detail을 탐색하며 console error와 수평 overflow가 0개다.

## Assumptions

- 008의 선택형 schema, fail-open scanner, linked model과 네 view는 구현 완료 상태이며 이번 기능은 실제 정본 데이터만 제공한다.
- 009 기능은 Spec 디렉터리 생성 즉시 허브 scan 대상이 되므로 최종 기능 수에 포함한다.
- 관리자 CLI와 백그라운드 자동화는 사이트맵 screen이 아니라 feature와 flow step으로 표현한다.
- evidence level은 `feature-relations.json` 스키마를 바꾸지 않고 `label`과 `evidence` 텍스트 규칙으로 표현한다.
- `004-onboarding-bootstrap`의 미완료 실기기 검증은 이 기능으로 전환하되 상태를 변경하지 않는다.
- 커밋과 PR은 별도 사용자 승인 전 수행하지 않는다.
