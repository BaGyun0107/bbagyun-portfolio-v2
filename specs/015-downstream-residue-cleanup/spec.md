# Feature Specification: 다운스트림 잔재 정리 완결

**Feature Branch**: `015-downstream-residue-cleanup`

**Created**: 2026-07-30

**Status**: Draft

**Input**: 하네스 clone 기반 다운스트림 레포에서 업스트림 전용 파일이 영구 잔존하는 구조적 갭 6개를 닫고, 기존 6개 다운스트림 레포(codi-hansi, codi-hipass, codi-account, codi-crew, codi-crawling, codi-liveview-admin)를 일괄 정리한다. 팀원은 `./harness bootstrap` 하나로 버전관리가 완결되어야 하며, 잔재 정리 커밋은 소유자 플로우에서 1회 수행한다.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - 소유자 일괄 정리: 한 번의 정리로 잔재 0 (Priority: P1)

하네스 소유자가 다운스트림 레포에서 정리 명령을 실행하면, 업스트림 전용 잔재(하네스 `.specify` 상태, 하네스 README, package.json의 harness-self 스크립트, `docs/audits` 하네스 사본, 커밋된 소비 측 스킬 링크, 디렉터리 자체 링크)가 전부 식별·정리되어 한 번의 커밋으로 끝난다.

**Why this priority**: 반복 수정 5회의 근본 원인 — 정리 로직이 flow 1(init-project)에만 있고 flow 2(전환 레포)에 없어서 잔재가 영구 잔존한다. 이 갭을 닫지 않으면 나머지 스토리의 효과가 유지되지 않는다.

**Independent Test**: 잔재가 있는 다운스트림 레포 픽스처에서 정리 명령 실행 → 감사 스크립트가 잔재 0을 보고하고, 프로젝트 소유 파일(자체 spec/테스트/수정된 README)은 그대로 남는 것을 확인.

**Acceptance Scenarios**:

1. **Given** flow 2로 전환된 레포에 하네스 `.specify/feature.json`(하네스 spec을 가리킴)·하네스 README·`docs/audits` 사본이 커밋되어 있음, **When** 소유자가 정리 명령을 실행함, **Then** 해당 잔재가 정리 대상으로 보고되고 `--apply` 시 제거·정규화된다
2. **Given** 프로젝트가 README를 수정했고 자체 audit 문서를 추가함, **When** 정리 명령을 실행함, **Then** 수정된 README와 자체 audit 문서는 보존된다
3. **Given** `.claude/skills/*`·`.agents/skills/*` 심링크와 `.harness/vendor` 디렉터리 링크가 커밋되어 있음, **When** 소유자 동기화·정리를 실행함, **Then** 인덱스에서 회수되어 다음 커밋에서 사라진다

---

### User Story 2 - 팀원 bootstrap 단일 표면 (Priority: P1)

팀원이 정리 완료된 다운스트림 레포를 clone 한 뒤 `./harness bootstrap` 하나만 실행하면 하네스 버전 수신·링크 구성·도구 설치가 끝나고, 워킹트리와 인덱스는 clean 하게 유지된다. 이후 일상 갱신도 같은 명령 하나로 완결된다.

**Why this priority**: 사용자가 지정한 목표 최종 상태다. 팀원 머신에서 인덱스가 변경되면 "bootstrap 하나로 완결"이 깨지고 팀원이 정리 커밋을 떠안게 된다.

**Independent Test**: 정리 완료된 레포를 새 경로에 clone → `./harness bootstrap` 실행 → `git status` clean, doctor 통과, 스킬·설정 링크 유효 확인.

**Acceptance Scenarios**:

1. **Given** 소유자가 정리 커밋을 push 한 레포, **When** 팀원이 clone 후 bootstrap을 실행함, **Then** 링크·도구가 준비되고 `git status` 가 clean 이다
2. **Given** 팀원 레포에 아직 잔재가 남아 있음(소유자가 정리 전), **When** bootstrap을 실행함, **Then** 인덱스는 변경되지 않고 잔재 발견 사실과 소유자 정리 절차 안내만 출력된다
3. **Given** 하네스 새 버전이 릴리스됨, **When** 팀원이 bootstrap을 재실행함, **Then** 새 버전이 수신·materialize 되고 KEEP_COMMITTED 진입점이 갱신된다

---

### User Story 3 - lock 모드 gitignore 자동 최신화 (Priority: P2)

lock 모드 다운스트림 레포가 동기화(pkg-sync)될 때마다 하네스가 요구하는 gitignore 항목이 자동으로 최신화되어, 이후 추가되는 링크·공유 경로가 실수로 커밋되지 않는다.

**Why this priority**: 스키마 링크 9개가 6개 레포 전부에 커밋된 근본 원인이다. 이 경로가 없으면 US1 정리 후에도 같은 부류의 잔재가 재발한다.

**Independent Test**: lockModeEntries 에 새 항목을 추가한 패키지로 pkg-sync 실행 → 다운스트림 `.gitignore` 에 항목이 반영되고, 프로젝트가 직접 쓴 항목·관리 블록 밖 내용은 변경되지 않음을 확인.

**Acceptance Scenarios**:

1. **Given** 구버전 gitignore 스냅샷을 가진 lock 레포, **When** 동기화가 실행됨, **Then** 누락된 필수 항목이 idempotent 하게 추가된다
2. **Given** 프로젝트가 gitignore 에 자체 항목을 추가해 둠, **When** 동기화가 실행됨, **Then** 자체 항목은 그대로 유지된다

---

### User Story 4 - 리포 내부 링크의 이식성 (Priority: P2)

하네스가 생성하는 리포 내부 심링크는 어떤 머신·어떤 경로에 clone 해도 유효하다. 링크가 실수로 커밋되더라도 다른 팀원의 머신에서 깨지지 않는다.

**Why this priority**: 절대경로 링크는 생성자 머신에서만 동작해 "clone 한 두 번째 사람"에게서 처음 결함이 드러난다. 심층 방어로서 링크 자체를 이식 가능하게 만든다.

**Independent Test**: materialize·skills-link 실행 후 생성된 링크가 전부 상대경로임을 확인하고, 레포를 다른 경로로 복사해도 링크 해석이 유효함을 확인.

**Acceptance Scenarios**:

1. **Given** 다운스트림 레포에서 동기화 실행, **When** 링크가 생성·재생성됨, **Then** 링크 값은 리포 내부 상대경로다 (홈 디렉터리 절대경로 없음)
2. **Given** 절대경로 링크가 남아 있는 레포, **When** 동기화가 재실행됨, **Then** 기존 링크가 상대경로로 재작성된다

---

### User Story 5 - 기존 6개 레포 일괄 정리 (Priority: P3)

소유자가 codi-hansi, codi-hipass, codi-account, codi-crew, codi-crawling, codi-liveview-admin 6개 레포에 정리 절차를 적용하고, 각 레포의 잔재가 0이 되었음을 검증 기록으로 남긴다.

**Why this priority**: 코드 갭을 닫아도 이미 커밋된 잔재는 남는다. 실측 기준: 공통(스키마 링크 9, `.specify` 19, `docs/audits` 10, 하네스 README) + 레포별 추가(hipass: 하네스 specs/tests 사본 137·examples 13, account: 스킬 링크 37·speckit 실파일 20, crew: `.harness/vendor` 링크 등).

**Independent Test**: 각 레포에서 감사 스크립트 실행 → 잔재 분류별 0건 보고.

**Acceptance Scenarios**:

1. **Given** 6개 레포 각각, **When** 소유자가 갱신된 하네스로 정리 절차를 실행하고 커밋함, **Then** 감사 기준 잔재 0이 되고 검증 기록이 남는다
2. **Given** 정리 완료된 레포, **When** 팀원이 clone + bootstrap 함, **Then** US2 시나리오가 성립한다

### Edge Cases

- 다운스트림이 업스트림과 같은 파일명으로 자체 문서를 만든 경우(예: `docs/audits/` 자체 감사): 이름 일치만으로 지우면 오삭제 — 내용 일치 판정 또는 업스트림 사본 목록 기반 선별이 필요하다.
- 프로젝트가 README·package.json·`.specify/memory/constitution.md` 를 이미 고쳐 쓴 경우: 업스트림 원본과 내용이 다르면 보존한다 (기존 원칙: 오삭제보다 잔재).
- `.specify` 런타임 상태의 `feature_directory` 가 프로젝트 자체 spec 을 가리키는 경우: 리셋하면 진행 중 기능의 체크포인트가 사라진다 — 하네스 spec 을 가리킬 때만 잔재로 판정한다.
- 팀원 머신에서 정리 대상이 발견된 경우: 인덱스를 건드리면 팀원 워킹트리가 dirty 가 된다 — 보고·안내만 하고 변경은 소유자 플로우로 넘긴다.
- gitignore 를 프로젝트가 수동 편집·재정렬한 경우: 항목 단위 idempotent 반영이어야 하며 프로젝트 항목을 삭제·재배치하지 않는다.
- 이미 git 추적 중인 파일은 ignore 항목 추가만으로는 무효: 추적 해제(회수)까지 이어져야 하고, 회수는 소유자 플로우에서만 커밋된다.
- 절대경로 링크가 이미 커밋된 레포에서 상대경로 재생성 시: git 이 링크 값 변경을 감지한다 — 정리 커밋에 함께 포함되도록 소유자 플로우에서 처리한다.
- 오프라인·업스트림 접근 불가 상태의 bootstrap: 기존 동작(현재 캐시 버전 유지) 을 해치지 않아야 한다.
- copy 모드(비 lock) 레포: lock 전용 정리·gitignore 반영이 copy 레포를 훼손하지 않아야 한다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: lock 모드 다운스트림의 정기 동기화 경로는 하네스 필수 gitignore 항목을 매 실행 idempotent 하게 반영해야 한다. lock 레포에 gitignore 갱신 경로가 존재하지 않는 현재 상태(update 조기 종료, 동기화 미호출)를 해소한다. [갭 1]
- **FR-002**: 소유자 정리 경로는 flow 1(init-project)에만 존재하는 project-state 정리와 동등한 정리를 flow 2 전환 레포에도 제공해야 한다. 대상: 하네스 `.specify` 상태(하네스 spec 을 가리키는 런타임 상태·하네스 constitution), 하네스 README, package.json 의 harness-self 항목(name, test/codex:replay-check, check 의 `npm test`), 하네스 `package-lock.json`, `docs/audits` 하네스 사본. [갭 2]
- **FR-003**: 소유자 정리·회수 경로는 materialize·skills-link 가 생성하는 소비 측 링크(`.claude/skills/*`, `.agents/skills/*`, `.claude/rules/shared`, `.harness/config/*` 링크 등)의 git 추적분을 회수 대상으로 포착해야 한다. [갭 3]
- **FR-004**: 회수 판정은 공유 디렉터리의 파일뿐 아니라 디렉터리 자체가 링크로 추적된 경우(`.harness/vendor` 등)도 포착해야 한다. [갭 4]
- **FR-005**: 하네스가 생성하는 모든 리포 내부 심링크는 상대경로여야 하며, 기존 절대경로 링크는 동기화 재실행 시 상대경로로 재작성되어야 한다. 리포 밖(버전 캐시 `.harness/current` 대상)을 가리키는 링크는 예외로 명시한다. [갭 5]
- **FR-006**: git 인덱스를 변경하는 정리·회수는 소유자 플로우에서만 수행한다. 팀원 갱신 표면(bootstrap)은 인덱스를 변경하지 않으며, 정리 대상 발견 시 보고와 소유자 절차 안내만 출력한다. [갭 6 재해석: prune 을 bootstrap 에 자동 편입하는 대신 check 모드 보고만 편입]
- **FR-007**: 잔재 판정의 분류 기준(커밋 유지 / 공유 링크 / 업스트림 전용 / 프로젝트 소유)은 기존 단일 출처 모듈을 재사용·확장해야 하며, 동일 기준이 정리·회수·감사에 공통 적용되어야 한다.
- **FR-008**: 잔재 유무를 분류별로 보고하는 감사(검증) 수단을 제공해야 한다. 소유자가 정리 완료를 판정하고 검증 기록을 남길 수 있어야 한다.
- **FR-009**: 오삭제 방지 원칙을 유지해야 한다: 이름·내용·참조 대상이 업스트림과 일치할 때만 잔재로 판정하고, 불확실하면 보존한다.
- **FR-010**: 기존 6개 다운스트림 레포에 정리 절차를 적용하고 레포별 검증 기록을 남겨야 한다.
- **FR-011**: 새 동작(갭 1~6)에 대한 회귀 테스트를 TDD 로 작성해야 한다. 기존 테스트(guardrails, migrate 등)는 계속 통과해야 한다.

### Key Entities

- **분류 체계(Classification)**: 업스트림 추적 파일 각각의 다운스트림 최종 상태를 정의 — 커밋 유지(진입점·CI 스크립트), 공유(링크 제공·비추적), 업스트림 전용(삭제), 선별 삭제(이름/내용 일치 사본), 프로젝트 소유(보존). 단일 출처 모듈이 정본.
- **잔재(Residue)**: 다운스트림에 커밋·잔존하지만 분류상 있어서는 안 되는 업스트림 유래 파일/링크. 부류: 공유 추적분, 업스트림 상태, 소비 측 링크, project-owned 로 오보호되는 하네스 자기 상태.
- **소유자 플로우(Owner flow)**: 전환·정리·회수·커밋을 수행하는 경로. 인덱스 변경 허용.
- **팀원 플로우(Member flow)**: `./harness bootstrap` 단일 표면. 수신·materialize·도구 설치·검증만 수행, 인덱스 불변.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 6개 다운스트림 레포 전부에서 감사 기준 잔재 0건 (공유 추적분 0, 업스트림 상태 0, 소비 측 링크 추적분 0, 하네스 자기 상태 0). 기준선: 현재 공통 잔재 약 40건/레포, 최대 213건(codi-account).
- **SC-002**: 정리 완료 레포를 새 경로에 clone 한 팀원이 `./harness bootstrap` 1회 실행만으로 작업 가능 상태가 되고, 실행 직후 `git status` 변경 0건.
- **SC-003**: 하네스가 새 필수 gitignore 항목을 추가하면, 다운스트림의 다음 정기 동기화 1회 안에 반영된다 (현재: 반영 경로 없음 = 영구 미반영).
- **SC-004**: 하네스가 생성한 리포 내부 링크 중 절대경로 0건 — 어느 머신·경로에 clone 해도 링크가 유효하다.
- **SC-005**: 이 정리 이후 같은 부류의 잔재가 재발하면 감사 수단이 이를 검출한다 (재발 시 무증상으로 누적되는 현재 상태의 종료).

## Assumptions

- 갭 6("prune-downstream 이 bootstrap 자동 경로에 없음")은 "bootstrap 이 정리를 자동 실행"이 아니라 "bootstrap 이 정리 필요를 보고"로 해소한다. 인덱스 변경이 팀원 머신에서 일어나면 US2(clean 유지)와 모순되기 때문이다. 정리 실행은 소유자 플로우 전용.
- README·package.json·constitution 등의 정규화는 업스트림 원본과 내용이 일치(또는 harness-self 항목이 명확히 식별)할 때만 자동 수행하고, 프로젝트가 수정한 흔적이 있으면 보존 후 보고만 한다.
- `.specify` 런타임 상태는 그 참조가 패키지에 실린 업스트림 spec 목록과 일치할 때만 잔재로 판정한다 (판정 기준은 패키지에서 읽어 버전과 함께 자동 갱신).
- 6개 레포의 정리 커밋·push 는 소유자(사용자)가 로컬에서 수행하고, AI 는 정리 실행과 검증까지 담당한다 (PR 머지는 사용자).
- 기존 다운스트림에 하네스 신규 동작이 도달하는 경로는 하네스 릴리스(버전 태그) → pkg-sync 수신이다. 즉 6개 레포 정리 전에 새 버전 릴리스가 선행된다.
- 상대경로 전환의 예외: `.harness/current` 처럼 리포 밖(머신 캐시)을 가리키는 링크는 절대경로가 정당하며 gitignore 로 비추적을 보장한다.
- 실측 기준선(2026-07-30 감사): 스키마 링크 9개·`.specify` 19개·`docs/audits` 10개·하네스 README 는 6/6 레포 공통, hipass 는 하네스 specs/tests 사본 137개, account 는 스킬 링크 37개 + speckit 실파일 20개 추가.
