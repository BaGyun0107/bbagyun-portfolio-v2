# Feature Specification: 하네스 패키지화 — 버전 캐시와 lock 기반 배포 (Phase 2)

**Feature Branch**: `005-harness-packaging`

**Created**: 2026-07-15

**Status**: Draft

**Input**: User description: "하네스 공유 본체를 semver 릴리스로 배포하고,
다운스트림은 머신 글로벌 버전 캐시 + 커밋된 lock 한 줄로 소비한다. 상위 설계:
설계 초안(2026-07-18 정리 — git history) (B절)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - lock 기반 설치와 materialize (Priority: P1)

다운스트림 레포는 커밋된 lock 파일이 가리키는 하네스 버전을 머신 글로벌
캐시에서 받아, 에이전트가 읽는 트리(.claude/.codex)를 캐시 참조로 구성한다.
그 상태에서 Claude Code와 Codex의 훅·룰·스킬이 지금과 동일하게 동작한다.
공유 본체 파일은 더 이상 레포 커밋에 존재하지 않는다.

**Why this priority**: 패키지 소비의 핵심 경로. 이것이 되어야 "레포마다 공유
파일 전체 복사"가 사라진다.

**Independent Test**: 로컬 가짜 업스트림(태그 있는 git repo)과 임시 캐시로
설치를 실행 → materialize된 트리에서 훅 실행·룰 로드가 성공하면 완료.

**Acceptance Scenarios**:

1. **Given** lock이 버전 X를 가리키고 캐시가 빈 머신, **When** 설치를
   실행하면, **Then** 캐시에 X가 받아지고 .claude/.codex 트리가 X를
   가리키도록 구성되며 검증(doctor)이 통과한다.
2. **Given** 같은 머신의 두 레포가 서로 다른 버전을 pin, **When** 각각
   설치하면, **Then** 두 레포는 각자의 버전으로 동시에 정상 동작한다.
3. **Given** materialize 완료 상태, **When** Claude/Codex 세션에서 가드레일
   훅과 룰·스킬을 사용하면, **Then** 커밋 보유 방식과 기능 차이가 없다.

### User Story 2 - 세션 시작 자동 업데이트 (Priority: P2)

lock이 자동 채널일 때, 새 minor/patch 릴리스는 다음 세션 시작 시점에
자동으로 받아져 반영된다. 진행 중인 세션의 버전은 절대 바뀌지 않고, major
(breaking) 릴리스는 자동 반영에서 제외되어 안내만 표시된다.

**Why this priority**: "동기화 수고 0"이라는 이 구조 전환의 핵심 약속.

**Independent Test**: 가짜 업스트림에 새 patch 태그 추가 → 세션 시작 훅
경로 실행 → 캐시에 새 버전 수신·반영 확인. major 태그만 추가한 경우 반영
없이 안내만 출력.

**Acceptance Scenarios**:

1. **Given** 자동 채널 lock과 상위 patch 릴리스 존재, **When** 새 세션이
   시작되면, **Then** 새 버전이 캐시에 받아지고 트리가 그 버전으로 바뀐다.
2. **Given** major 릴리스만 존재, **When** 새 세션이 시작되면, **Then**
   현재 버전이 유지되고 수동 업그레이드 안내가 표시된다.
3. **Given** 세션이 진행 중, **When** 그 사이 새 릴리스가 나와도, **Then**
   진행 중 세션이 참조하는 버전은 바뀌지 않는다.

### User Story 3 - pin / 롤백 / 오프라인 (Priority: P3)

행동 드리프트가 의심되면 개발자는 커맨드 하나로 특정 버전에 고정(pin)하거나
이전 버전으로 되돌린다. 네트워크가 없어도 캐시에 있는 현재 버전으로 모든
기능이 동작하며, 업데이트 확인만 조용히 생략된다.

**Why this priority**: 자동 최신 정책의 안전판. 이것이 있어야 자동 채널을
기본값으로 둘 수 있다.

**Independent Test**: pin 실행 → lock이 고정 버전으로 바뀌고 트리가 즉시
그 버전을 가리킴. 네트워크 차단 상태에서 세션 시작 → 기능 정상 + 확인 스킵.

**Acceptance Scenarios**:

1. **Given** 자동 채널로 버전 Y 사용 중, **When** 버전 X로 pin하면,
   **Then** lock이 X 고정으로 바뀌고 트리가 즉시 X를 가리킨다(캐시에 X가
   있으면 네트워크 불필요).
2. **Given** 오프라인 머신, **When** 세션을 시작하면, **Then** 현재 캐시
   버전으로 정상 동작하고 실패나 지연이 발생하지 않는다.

### User Story 4 - 업스트림 릴리스 발행 (Priority: P3)

하네스 관리자는 변경을 semver 버전 하나로 발행한다. breaking 변경은 major,
그 외는 minor/patch로 구분하고, 변경 내용은 CHANGELOG에 기록한다. 발행
실수를 막는 검증(태그 형식, CHANGELOG 항목 존재)이 있다.

**Why this priority**: 소비(US1~US3)가 있으려면 발행이 있어야 하지만,
초기에는 수동 절차+검증 스크립트로 충분하다.

**Independent Test**: 릴리스 커맨드/절차를 임시 레포에서 실행 → 형식에 맞는
태그와 CHANGELOG 항목이 만들어지고, 형식 위반 시 발행이 거부된다.

**Acceptance Scenarios**:

1. **Given** 릴리스할 변경이 쌓인 상태, **When** 릴리스 절차를 실행하면,
   **Then** semver 태그와 CHANGELOG 항목이 함께 만들어진다.
2. **Given** CHANGELOG 항목 없이 태그만 만들려는 시도, **When** 검증이
   실행되면, **Then** 발행이 거부되고 이유가 안내된다.

### Edge Cases

- lock이 가리키는 버전이 캐시에 없고 오프라인: 명확한 에러와 함께 기존
  materialize 상태를 그대로 유지한다 (부분 적용 금지).
- lock이 가리키는 태그가 업스트림에 존재하지 않음: 에러 + 사용 가능한 버전
  안내. 트리는 바뀌지 않는다.
- materialize 대상 경로에 사용자가 만든 실파일(비심링크)이 존재: 덮어쓰지
  않고 경고한다. 기존 커밋 보유 레포의 전환은 Phase 3(migrate) 범위.
- 업데이트 적용 도중 실패(네트워크 끊김 등): 이전 버전 트리가 그대로
  남는다 — 전환은 원자적이어야 한다.
- 캐시 디렉토리가 손상/삭제됨: 다음 설치·세션 시작에서 재수신으로 복구된다.
- 여러 세션이 동시에 시작되어 같은 버전을 받으려 함: 중복 수신이 발생해도
  결과가 손상되지 않는다.
- 검증 V2: `.claude/rules/`가 심링크 경유로도 자동 로드되는지 실측 — 안
  되면 그 디렉토리만 실파일 복사로 materialize한다 (기능 동등성 우선).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 다운스트림 레포는 커밋된 lock 파일 하나로 소비할 하네스
  버전을 선언해야 한다 — 자동 채널(minor/patch 추적) 또는 고정 버전.
- **FR-002**: 하네스 버전은 머신 글로벌 캐시에 버전별 불변 디렉토리로
  저장되며, 같은 머신의 모든 레포가 공유한다.
- **FR-003**: 설치는 에이전트가 읽는 트리(.claude/.codex)를 캐시 참조로
  생성(materialize)해야 하며, 생성물은 git-ignore된다. 프로젝트 소유물
  (`specs/`, `skills-local/`, `project-profile.yaml`)은 절대 건드리지 않는다.
- **FR-004**: 버전 반영은 세션 시작 시점에만 일어난다. 진행 중 세션이
  참조하는 버전은 어떤 경우에도 바뀌지 않는다.
- **FR-005**: 자동 채널은 minor/patch만 반영한다. major는 명시적 업그레이드
  커맨드로만 반영되고, 감지 시 안내만 표시한다.
- **FR-006**: 커맨드 하나로 특정 버전에 고정(pin)·롤백할 수 있어야 하며,
  캐시에 있는 버전으로의 전환은 네트워크 없이 즉시 완료된다.
- **FR-007**: 오프라인에서는 캐시의 현재 버전으로 전 기능이 동작하고,
  업데이트 확인은 조용히 생략된다.
- **FR-008**: 릴리스는 semver 태그 + CHANGELOG 항목으로 발행되며, 형식
  위반(태그 형식 오류, CHANGELOG 누락)은 발행 검증이 거부한다.
- **FR-009**: materialize된 트리에서 Claude/Codex의 훅·룰·스킬 동작은 커밋
  보유 방식과 동등해야 한다 (V2 실측 포함, 미동작 항목은 실파일 복사 폴백).
- **FR-010**: 버전 전환은 원자적이어야 한다 — 실패 시 이전 버전 트리가
  그대로 유지되고, 부분 적용 상태가 남지 않는다.
- **FR-011**: 미설치 상태(clone 직후)를 런처가 감지하면 설치(bootstrap)를
  안내해야 한다.

### Key Entities

- **harness.lock**: 레포가 소비할 하네스 버전 선언 (커밋됨). 채널(자동
  minor/patch) 또는 고정 버전 중 하나.
- **버전 캐시**: 머신 글로벌, 버전별 불변 디렉토리. 여러 레포·여러 버전
  공존. 삭제되어도 재수신으로 복구 가능한 파생 저장소.
- **materialize된 트리**: .claude/.codex 아래의 생성물(심링크/파일).
  캐시의 특정 버전을 가리키는 파생물이며 git-ignore된다.
- **릴리스**: semver 태그 + CHANGELOG 항목의 쌍. 업스트림에서만 만들어진다.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 하네스 새 minor/patch를 다운스트림에 반영하는 데 필요한
  개발자 작업이 0건이다 (자동 채널 기준; pin 레포는 lock 1줄 변경).
- **SC-002**: 세션 시작의 업데이트 확인·반영이 시작을 5초 이상 지연시키지
  않으며, 오프라인에서는 지연이 체감되지 않는다.
- **SC-003**: pin/롤백은 커맨드 1회로 1분 이내에 완료된다 (캐시 보유 버전
  기준 즉시).
- **SC-004**: 같은 머신에서 서로 다른 버전을 쓰는 레포들이 기능 충돌 0건으로
  공존한다.
- **SC-005**: materialize 상태에서 기존 검증(doctor, 전체 테스트, 훅 동작)이
  커밋 보유 방식과 동일하게 통과한다.
- **SC-006**: 공유 본체 동기화로 인한 dirty-path 충돌·덮어쓰기 사고가
  구조적으로 0건이 된다 (공유 파일이 레포 커밋에 없으므로).

## Assumptions

- 하네스 레포 자체(업스트림)는 계속 전체 파일을 커밋으로 보유한다 —
  패키지의 원천이므로 lock 소비자가 아니다.
- Phase 2의 소비자는 **신규** 다운스트림 프로젝트(init-project로 생성)다.
  기존 다운스트림의 전환(migrate)과 구 동기화 흐름(update.sh/manifest) 제거는
  Phase 3 범위.
- 배포 채널은 private 하네스 레포의 git 태그이며, 다운스트림 개발자의 기존
  git 인증을 재사용한다 (Phase 1 결정과 동일).
- 대상 플랫폼은 macOS (Phase 1과 동일). CI(ubuntu)의 lock 기반 설치는 캐시
  경로만 다를 뿐 같은 흐름을 쓰되, 이번 spec의 실측 검증은 macOS 기준.
- Superpowers·GStack 등 외부 도구 설치는 Phase 1 bootstrap 담당이며 이
  spec은 하네스 본체 배포만 다룬다.
- V2(.claude/rules 심링크 자동 로드)는 plan 단계에서 실측으로 확정하고,
  결과와 무관하게 실파일 복사 폴백으로 기능 동등성이 보장된다.
