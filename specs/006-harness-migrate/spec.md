# Feature Specification: 기존 다운스트림 migrate와 구 동기화 은퇴 (Phase 3)

**Feature Branch**: `006-harness-migrate`

**Created**: 2026-07-15

**Status**: Draft

**Input**: User description: "기존(복사본 커밋) 다운스트림을 lock 모드로
전환하는 harness migrate, 룰 이중 로드 해소, 구 동기화 흐름 은퇴, 문서
정합화. 상위 설계: 설계 초안(2026-07-18 정리 — git history),
specs/005-harness-packaging/verification.md의 전환기 제약."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 기존 다운스트림의 lock 모드 전환 (Priority: P1)

기존 프로젝트 팀은 커맨드 하나로 자신들의 레포를 lock 모드로 전환한다.
전환은 워킹트리 변경으로만 만들어져 팀이 diff를 리뷰한 뒤 직접 커밋하고,
마음이 바뀌면 git 복원으로 즉시 되돌린다. dry-run으로 어떤 파일이 제거·
생성될지 미리 볼 수 있고, 프로젝트 소유물은 절대 건드리지 않는다.

**Why this priority**: Phase 3의 존재 이유 — 기존 레포가 전환되어야
"복사+동기화" 구조가 실제로 은퇴한다.

**Independent Test**: 복사본 커밋 형태의 가짜 다운스트림 레포에서 migrate
실행 → 공유 파일 제거 + lock 생성 + 트리 구성 + 검증 통과를 격리 확인.

**Acceptance Scenarios**:

1. **Given** 복사본 커밋 형태의 기존 레포, **When** migrate를 dry-run으로
   실행하면, **Then** 제거·생성될 파일 목록만 출력되고 변경은 0건이다.
2. **Given** 같은 레포, **When** migrate를 실행하면, **Then** harness.lock
   생성 + 공유 파일 제거 + gitignore 갱신 + 패키지 트리 구성이 워킹트리
   변경으로 만들어지고 검증(doctor)이 통과한다.
3. **Given** 공유 파일에 로컬 수정이 있는 레포, **When** migrate를
   실행하면, **Then** 수정 파일 목록을 보여주고 중단한다 (데이터 소실 방지).
4. **Given** 전환 완료 레포, **When** migrate를 재실행하면, **Then**
   "이미 전환됨"으로 멱등 종료한다.

### User Story 2 - 공유 룰 이중 로드 해소 (Priority: P2)

lock 모드 레포에서 공유 룰은 패키지 경유(single source)로만 로드된다.
Phase 2가 남긴 전환기 제약 — 복사본 룰과 `rules/shared` 링크가 같은 내용을
이중 로드하는 상태 — 를 없앤다. 신규 프로젝트는 처음부터 단일 출처다.

**Why this priority**: 컨텍스트 낭비와 "어느 쪽이 진짜 룰인가" 혼동 제거.

**Independent Test**: migrate 후(또는 신규 init 후) 레포에서 같은 룰 파일이
복사본과 shared 링크 양쪽에 존재하지 않음을 확인.

**Acceptance Scenarios**:

1. **Given** migrate가 끝난 레포, **When** 룰 디렉토리를 검사하면, **Then**
   공유 룰은 shared 링크 한 곳에만 존재하고 복사본은 없다.
2. **Given** 신규 생성 프로젝트, **When** 첫 설치가 끝나면, **Then** 공유
   룰이 단일 출처로만 로드된다 (프로젝트 소유 룰 실파일은 그대로 공존).

### User Story 3 - 구 동기화 흐름 은퇴 (Priority: P3)

lock 모드 레포에서 복사+동기화 시대의 커맨드(공유 파일 덮어쓰기 적용,
다운스트림 잔여 파일 정리)는 실행되지 않고 "lock 모드에서는 pkg 흐름을
사용하세요" 안내로 대체된다. 업스트림 하네스 레포 자체의 동작은 바뀌지
않는다 (업스트림은 소비자가 아니므로).

**Why this priority**: 두 동기화 체계가 같은 레포에서 겹쳐 돌면 되돌리기
어려운 혼합 상태를 만들 수 있다.

**Independent Test**: lock 모드 가짜 레포에서 구 동기화 커맨드 실행 → 변경
0건 + 안내 출력. lock 없는(업스트림/미전환) 레포에서는 기존 동작 유지.

**Acceptance Scenarios**:

1. **Given** lock 모드 레포, **When** 구 동기화 적용 커맨드를 실행하면,
   **Then** 파일 변경 없이 pkg 흐름 안내를 출력한다.
2. **Given** lock 파일이 없는 레포, **When** 같은 커맨드를 실행하면,
   **Then** 기존과 동일하게 동작한다.

### User Story 4 - 정책 문서 정합화 (Priority: P3)

패키지화 이후 낡아진 서술을 실제 동작과 일치시킨다. 대표: AGENTS.md의
"Do not use yarn or bun" — 앱 패키지 매니저 금지는 유지하되, mise가 관리하는
빌드 도구(bun은 GStack setup 용)는 별개 경로임을 명시한다.

**Why this priority**: 규칙 문서가 실제 정책(커맨드 위치 매칭 가드,
mise 도구 선언)과 어긋나면 사람과 에이전트 모두 혼동한다.

**Independent Test**: 문서 리뷰 — 금지 문구와 도구 선언이 서로 모순 없이
읽히는지 확인.

**Acceptance Scenarios**:

1. **Given** AGENTS.md의 패키지 매니저 절, **When** 읽으면, **Then** 앱
   의존성 설치 금지(yarn/bun)와 mise 빌드 도구 허용이 구분되어 서술된다.

### Edge Cases

- git 워킹트리가 이미 dirty한 레포에서 migrate: 전환 diff가 기존 변경과
  섞이지 않도록 중단하고 "커밋/스태시 후 재실행" 안내.
- 공유 파일에 로컬 수정(업스트림과 다른 내용) 존재: 목록 표시 후 중단 —
  삭제하면 소실되므로 사용자 판단으로 넘긴다.
- 업스트림 하네스 레포 자체에서 migrate 실행: 거부한다 (패키지의 원천은
  소비자가 될 수 없음).
- 오프라인에서 migrate: 패키지 수신이 불가하므로 변경 없이 중단 + 안내
  (전환 도중 실패로 어정쩡한 상태를 만들지 않는다).
- `.harness/skills-local/` 스킬 이름이 패키지 스킬과 충돌: 기존 충돌 규칙
  (fail-fast) 유지 — migrate가 임의로 어느 한쪽을 지우지 않는다.
- 전환 후 팀원이 pull 받은 시점: 공유 파일이 사라진 트리 + lock — 첫
  `./harness install`(또는 bootstrap)이 트리를 구성하도록 안내가 출력된다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 단일 커맨드로 기존 레포를 lock 모드로 전환하며, dry-run은
  변경 0건으로 제거·생성 목록만 보여준다.
- **FR-002**: 제거 대상은 공유/프로젝트-소유 분류의 단일 출처에 근거해야
  하며, 프로젝트 소유물(`specs/`, `skills-local/`, `project-profile.yaml`,
  앱 코드 등)은 어떤 경우에도 제거되지 않는다.
- **FR-003**: 로컬 수정된 공유 파일이 있으면 목록을 보여주고 중단한다.
- **FR-004**: 전환은 워킹트리 변경으로만 만들어진다 — 커밋·push는 사용자가
  수행하고, 되돌리기는 git 복원으로 가능함을 안내한다.
- **FR-005**: 전환 직후 패키지 동기화와 검증(doctor)이 통과해야 하며,
  실패 시 원인과 다음 행동을 안내한다.
- **FR-006**: 업스트림 하네스 레포에서의 실행은 거부한다.
- **FR-007**: 전환 완료 레포에서 재실행은 멱등이다.
- **FR-008**: lock 모드 레포에서 공유 룰은 단일 출처로만 로드된다 — 복사본
  룰과 shared 링크의 이중 로드를 migrate와 신규 생성 경로 모두에서 없앤다.
- **FR-009**: lock 모드 레포에서 구 동기화 적용 커맨드는 파일 변경 없이
  안내로 대체되고, lock이 없는 레포(업스트림 포함)에서는 기존 동작을
  유지한다.
- **FR-010**: 패키지 매니저 정책 문서는 앱 의존성 금지(yarn/bun)와 mise
  빌드 도구 허용을 구분해 서술한다.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 기존 레포 전환이 "커맨드 1회 + diff 리뷰 커밋 1회"로 완료된다.
- **SC-002**: 전환 후 doctor·훅·스킬 동작이 커밋 보유 방식과 동등하게
  통과한다 (기능 회귀 0건).
- **SC-003**: 전환 diff에 프로젝트 소유물 변경이 0건이다.
- **SC-004**: lock 모드 레포에서 동일 공유 룰이 두 경로로 로드되는 사례가
  0건이다.
- **SC-005**: 은퇴 이후 공유 파일 동기화로 인한 dirty-path 충돌·의도치 않은
  덮어쓰기 사고가 구조적으로 0건이 된다.

## Assumptions

- Phase 2(specs/005) 위에 스택된 작업이다 — lock/캐시/materialize 메커니즘이
  존재함을 전제한다 (PR #82 → #83 → 이 작업 순서로 머지).
- 공유/프로젝트-소유 분류는 기존 분류기(단일 출처)를 재사용한다. 과거
  specs/.specify 오등재 사례처럼 분류기·정책·테스트 3경로가 함께 갱신되어야
  한다.
- 실제 다운스트림 레포 1곳의 전환 리허설은 이 spec의 테스트(가짜 레포)와
  별개로, 릴리스 후 사용자와 함께 수행하는 확인 항목이다.
- 업스트림 하네스 레포는 계속 전체 파일을 커밋으로 보유한다.
- 첫 하네스 semver 태그(v1.0.0) 발행은 이 Phase의 릴리스 시점에 사용자가
  `./harness release`로 수행한다.
