# Feature Specification: 최초 프로젝트 설정 단순화

**Feature Branch**: `feature/019-first-setup-simplification`

**Created**: 2026-08-06

**Status**: Draft

**Input**: User description: "소비자(bootstrap 1회)와 최초 생성자(clone → init-project 플래그 나열 + full clone 잔재 구조) 경험 격차 해소 — (A) 단기: init-project 스킬 기본 경로 승격 + --reset-git 갭 수정, (B) 중기: 정리된 시작점 자동 발행으로 최초 생성도 bootstrap 경험으로 통일"

## Clarifications

### Session 2026-08-06

- Q: 시작점(새 프로젝트 출발 저장소)의 형태는? → A: 최소 스켈레톤 +
  `harness.lock` — 런처와 lock 선언만 담고 나머지는 bootstrap이
  materialize (014 lock 모드 정합)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 대화형 초기화가 기본 경로가 된다 (Priority: P1)

새 프로젝트 최초 생성자가 플래그를 외우지 않고, 하네스를 clone한 뒤
에이전트 세션에서 대화(신규/임포트, 스택 선택, org, git 히스토리 재시작)로
초기화를 끝낸다. init-project 스킬이 이 경험을 이미 제공하므로, 문서의
기본 안내를 스킬 경로로 승격하고 스킬의 빈틈을 메운다.

**Why this priority**: 구현이 거의 없는 문서·스킬 정비로 즉시 체감되는
개선이며, 중기(US3) 전환 전까지의 기본 경로가 된다.

**Independent Test**: 신규 폴더에 clone → 에이전트 세션에서 "새 프로젝트
초기화" 요청 → 대화만으로 초기화 완료. 플래그 문서를 열지 않아도 된다.

**Acceptance Scenarios**:

1. **Given** 하네스를 clone한 새 폴더, **When** 에이전트에게 초기화를
   요청하면, **Then** 신규/임포트·스택·git 히스토리 재시작 여부를 질문받고
   답변만으로 초기화가 완료된다.
2. **Given** 신규 프로젝트 경로 선택, **When** 스킬이 초기화를 실행하면,
   **Then** git 히스토리 재시작(--reset-git 상당)이 반드시 적용되거나
   명시적으로 확인받는다 (현재 갭: import 참조 문서에만 존재).
3. **Given** README 시나리오 A를 읽는 신규 사용자, **When** 안내를 따르면,
   **Then** 스킬 대화 경로가 기본으로 제시되고 CLI 플래그는 스크립트/CI용
   참고로 남는다.

---

### User Story 2 - CLI 정본은 유지되고 회귀하지 않는다 (Priority: P2)

스크립트/CI/재현 시나리오에서는 여전히 `./harness init-project <flags>`
CLI가 정본으로 동작한다. 스킬은 CLI를 감싸는 오케스트레이터일 뿐, 초기화
로직이 두 곳으로 갈라지지 않는다.

**Why this priority**: 단일 정본이 깨지면 스킬과 CLI의 동작이 달라져
디버깅 불가능한 초기화 차이가 생긴다.

**Independent Test**: 스킬 문서가 안내하는 모든 실행 명령이 정본
CLI 호출임을 검사로 확인.

**Acceptance Scenarios**:

1. **Given** 스킬 경로와 CLI 경로, **When** 같은 답변/플래그로 초기화하면,
   **Then** 결과 상태가 동일하다.

---

### User Story 3 - 정리된 시작점으로 최초 생성도 bootstrap 경험 (Priority: P3)

업스트림이 릴리스마다 "정리된 시작점"(하네스-자체 작업 상태가 없는 새
프로젝트용 출발 저장소/스켈레톤)을 자동 발행한다. 최초 생성자는 시작점으로
repo를 만들고 clone 후 `./harness bootstrap` — 합류자와 동일한 경험이 된다.
init-project는 앱 스캐폴드·GitHub 권한·Infisical 연결 등 고유 역할만
담당한다.

**Why this priority**: prune/reset-git이 필요한 구조적 원인(하네스 full
clone 출발)을 제거하는 근본 해결이지만, 발행 파이프라인 구축 비용이 있어
단기(US1) 이후에 진행한다.

**Independent Test**: 시작점에서 새 repo 생성 → clone → bootstrap →
doctor 통과 + 하네스-자체 잔재(upstream spec/테스트/허브 산출물) 0건.

**Acceptance Scenarios**:

1. **Given** 발행된 최신 시작점, **When** repo 생성 → clone → bootstrap을
   실행하면, **Then** doctor가 통과하고 하네스-자체 작업 상태가 존재하지
   않는다.
2. **Given** 하네스 새 릴리스, **When** 릴리스 절차가 완료되면, **Then**
   시작점이 자동으로 같은 버전으로 갱신된다.
3. **Given** 시작점 출발 프로젝트, **When** init-project(스킬/CLI)를
   실행하면, **Then** 히스토리 정리·잔재 정리 단계 없이 앱 스캐폴드·권한·
   Infisical 연결만 수행된다.

### Edge Cases

- 스킬 대화 중 사용자가 세션을 중단하면? (재실행 시 멱등 — 이미 완료된
  단계는 건너뜀, 기존 init-project 재실행 안전성 유지)
- gh 미인증/미설치 상태에서 스킬이 repo 생성 단계에 도달하면? (세션 안
  `! gh auth login` 안내 후 계속)
- 시작점이 구버전으로 방치되면? (bootstrap의 기존 update-check가 최신
  하네스로 끌어올림 — 시작점 신선도는 편의이지 정합성 조건이 아니어야 함)
- 시작점 발행이 실패한 릴리스는? (이전 시작점이 유효하게 남고, 발행 실패가
  릴리스 자체를 막지 않되 알림은 남김)
- 기존 방식(full clone → init-project)으로 만든 프로젝트는? (영향 없음 —
  시작점은 신규 생성 경로의 추가 선택지로 도입 후 기본으로 승격)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: init-project 스킬은 신규 프로젝트 경로에서 git 히스토리
  재시작 적용 여부를 필수 질문에 포함하고, 기본값은 "재시작"이어야 한다.
- **FR-002**: README의 새 프로젝트 최초 생성(시나리오 A) 안내는 스킬 대화
  경로를 기본으로, CLI 플래그 경로를 스크립트/CI용 보조로 제시해야 한다.
- **FR-003**: 스킬이 실행하는 초기화 명령은 정본 CLI와 동일해야 하며,
  초기화 로직이 스킬 쪽에 별도로 존재해서는 안 된다.
- **FR-004**: 업스트림 릴리스 절차는 최소 스켈레톤 시작점(런처 +
  `harness.lock` + 최소 설정, 하네스-자체 작업 상태 없음)을 자동 발행해야
  한다. 스켈레톤에 포함할 파일 목록은 단일 정본으로 관리하고, 나머지는
  bootstrap의 lock 모드 materialize가 채운다.
- **FR-005**: 시작점에서 생성한 프로젝트는 clone 후 bootstrap 한 번으로
  doctor 통과 상태에 도달해야 한다.
- **FR-006**: 시작점 출발 프로젝트에서 init-project는 히스토리/잔재 정리
  단계를 건너뛰고 고유 역할(앱 스캐폴드, GitHub 권한, Infisical 연결)만
  수행해야 한다.
- **FR-007**: 시작점 발행 실패는 릴리스를 차단하지 않되 감지 가능한 알림을
  남겨야 하며, 직전 시작점은 계속 유효해야 한다.
- **FR-008**: 회귀 검증(TDD): US1의 스킬 질문 계약과 US3의 시작점 구성
  (하네스-자체 잔재 0건, bootstrap 도달성)을 검사하는 테스트를 구현 전에
  작성해 현 상태에서 실패를 확인한 뒤 진행한다.
- **FR-009**: AI는 PR을 머지하지 않으며, 구현 착수는 018 정리(머지) 후로
  한다 — 그 전에는 계획 산출물만 커밋한다.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 신규 생성자가 플래그 문서를 열지 않고 대화만으로 초기화를
  완료한다 (필수 입력: 질문 답변뿐).
- **SC-002**: 신규 프로젝트에서 git 히스토리 재시작 누락이 발생할 수 없다
  (스킬 계약 테스트로 상시 보장).
- **SC-003**: 스킬 경로와 CLI 경로의 초기화 결과가 동일하다.
- **SC-004**: 시작점 경로에서 "repo 생성 → clone → bootstrap" 2단계(+repo
  생성 클릭)만으로 doctor 통과에 도달한다 — 합류자 경험과 단계 수 동일.
- **SC-005**: 시작점 출발 프로젝트에 하네스-자체 작업 상태(업스트림 spec·
  테스트·허브 산출물·감사 기록)가 0건이다.
- **SC-006**: 릴리스마다 시작점이 사람 개입 없이 갱신된다 (수동 발행 0회).

## Assumptions

- 하네스-자체 vs 공유 파일 분류는 기존 정본(`shared-manifest`,
  `upstream-project-state` 목록)을 재사용하며 새 분류 체계를 만들지 않는다.
- 스킬 대화 경로의 전제(에이전트 세션)는 수용 가능하다 — 초기화하는 사람은
  이미 Claude Code 또는 Codex를 사용하는 팀원이다.
- 기존 full clone 경로는 당분간 병행 유지하고, 시작점 경로가 검증된 뒤
  기본 안내를 교체한다 (하위 호환 유지).
- 2인 팀이므로 GitHub 조직 권한·시크릿 등록 절차는 현행 그대로 둔다.
- 018(브라우저 QA 대체)과 코드 충돌 가능성이 있는 파일(README,
  install/bootstrap 계열)은 018 머지 후 구현을 시작해 리베이스 비용을
  없앤다.
