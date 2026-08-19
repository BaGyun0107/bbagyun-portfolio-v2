# Feature Specification: 감사 발견 일괄 수정 (1차)

**Feature Branch**: `fix/016-audit-remediation`

**Created**: 2026-07-31

**Status**: Draft

**Input**: 2026-07-31 전수 감사(docs/audits/2026-07-31-full-harness-audit.md, 검증 34건) 중
소유자 결정이 불필요한 항목의 1차 일괄 수정. TDD — 동작 변경 항목은 회귀 테스트 선행.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - lock 전환에서 하네스 가이드가 사라지지 않는다 (Priority: P1)

다운스트림 팀원이 lock 모드로 전환하거나 bootstrap 을 실행해도 `.harness/docs/**`
가이드 13개가 링크로 유지되고, 링크·ignore·정리 목록의 드리프트는 테스트가 즉시 잡는다.

**Why this priority**: H-1 은 복원 경로 없는 영구 소실이고, 그것을 못 잡은 원인이
H-7(무효 가드)이라 반드시 한 묶음으로 처리해야 한다. M-5(ROADMAP 무판정 삭제)도
같은 "프로젝트 durable state 보호" 부류다.

**Independent Test**: 픽스처 다운스트림에서 migrate→materialize 후 `.harness/docs`
링크가 존재하고, 세 목록 중 하나에서 항목을 빼면 드리프트 가드 테스트가 실패한다.

**Acceptance Scenarios**:

1. **Given** lock 모드 다운스트림, **When** materialize 실행, **Then** `.harness/docs` 가
   패키지로의 상대경로 링크로 존재하고 gitignore lock 항목에 등재된다.
2. **Given** materialize 링크 루프에서 대상 하나 제거(시뮬레이션), **When** 드리프트 가드
   테스트 실행, **Then** 해당 테스트가 실패한다(양방향: 목록 추가 누락도 실패).
3. **Given** 프로젝트가 자체 내용으로 채운 ROADMAP.md, **When** `prune-downstream --apply`,
   **Then** ROADMAP.md 는 보존된다(패키지 사본과 바이트 일치할 때만 삭제).

---

### User Story 2 - 문서를 따라 해도 잔재·오작동이 생기지 않는다 (Priority: P2)

운영자/에이전트가 정책·가이드 문서를 따라 진단하거나 절차를 수행할 때 낡은 서술이
잘못된 결론이나 잔재 재생산으로 이어지지 않는다.

**Why this priority**: H-4 의 하드코딩 `rm -rf` 예시는 따라 하면 잔재 3건이 첫 커밋에
들어가는 실행 가능한 해악이고, H-2·H-3·M-8·M-9·M-10·M-21·L-5 는 같은 "서술 부채" 부류다.

**Independent Test**: 각 문서/주석에서 낡은 서술(grep 가능한 문자열)이 사라지고 정본
참조로 대체됐는지 확인한다.

**Acceptance Scenarios**:

1. **Given** update-policy.md gitignore 절, **When** 읽으면, **Then** 메커니즘 3개와
   모드별 적용 경로가 실제 코드와 일치하고 "currently empty" 류 낡은 단정이 없다.
2. **Given** init 관련 4개 문서, **When** 정리 절차를 따르면, **Then** `--reset-git` 조건
   서술과 하드코딩 경로 목록 대신 정본(UPSTREAM_PROJECT_STATE_PATHS) 참조를 만난다.
3. **Given** 업스트림 접근 실패 안내, **When** 출력을 읽으면, **Then** 삭제된
   restore-harness 액션 대신 실행 가능한 토큰 주입 절차를 안내한다.

---

### User Story 3 - 테스트가 머신을 오염시키지 않는다 (Priority: P3)

`npm test` 실행이 시스템 temp 에 디렉터리를 누적하지 않고, 개발자의 전역 git 설정
(서명 등)과 무관하게 항상 같은 결과를 낸다.

**Why this priority**: 실측 5.3GB/78,230개 누수(H-6)와 gpgsign 미격리(M-17)는 모두
헬퍼 이원화(L-9)가 원인이라 공통 기반 추출 한 번으로 함께 해소된다.

**Independent Test**: 테스트 전후 temp 의 `codi-*` 디렉터리 수가 같고, gpgsign 을 켠
환경 변수 조합에서도 픽스처 커밋이 성공한다.

**Acceptance Scenarios**:

1. **Given** 전체 테스트 실행, **When** 종료 후 temp 를 세면, **Then** 이번 실행이 만든
   `codi-*` 잔여 디렉터리가 0개다.
2. **Given** 전역 git 설정에 `commit.gpgsign=true`, **When** 픽스처로 레포 생성·커밋,
   **Then** 서명 시도 없이 성공한다.

---

### User Story 4 - 배포 표면과 카탈로그가 실재와 일치한다 (Priority: P4)

다운스트림에 배포되는 파일 집합과 스킬 카탈로그가 실재 파일과 일치하고, CI 게이트는
스킵되더라도 조용히 사라지지 않는다.

**Why this priority**: 1-3(미실행 리허설의 다운스트림 배포)·1-4(유령 스킬 5건)·
1-5(중복 검증)·M-6(조용한 CI 스킵)은 모두 "표면 ↔ 실재 불일치" 부류다.

**Independent Test**: shared-manifest 에 리허설 스크립트가 없고, 스킬 카탈로그의 모든
항목이 실재 디렉터리와 일치하며, CI 로그에 스킵 사유가 남는다.

**Acceptance Scenarios**:

1. **Given** 리허설 스크립트를 tests/ 로 이동, **When** manifest 재생성, **Then**
   shared-manifest 에서 빠지고(project-owned) mise 태스크로 실행 경로가 생긴다.
2. **Given** codi-config.yaml 스킬 목록, **When** 실재 스킬 디렉터리와 대조, **Then**
   유령 항목 0건, 실재 스킬 누락 0건이다.
3. **Given** planning-check 스크립트가 없는 lock 다운스트림 CI, **When** ci-node-verify
   실행, **Then** "스킵" 경고 한 줄이 로그에 남는다.

---

### User Story 5 - 플래닝 표면이 출하 실적을 반영한다 (Priority: P5)

ROADMAP 이 015 를 포함한 전 기능을 담고, 예정 작업(2026-08-03 스킬 재측정)이 세션이
바뀌어도 발견 가능한 표면에 등재된다.

**Why this priority**: M-18·M-20 — cross-feature 정본이라는 ROADMAP 의 목적 유지.

**Independent Test**: ROADMAP 에 015 행과 예정 작업 절이 존재한다.

**Acceptance Scenarios**:

1. **Given** ROADMAP.md, **When** 015 를 찾으면, **Then** spec 링크가 있는 행이 존재한다.

### Edge Cases

- 드리프트 가드의 "정확 일치"가 의도적 비대상(예: `.harness/scripts`, `.harness/config`
  — materialize 가 링크하지만 stale-workcopy 대상이 아님)을 오검출하지 않아야 한다 →
  명시적 allowlist 로 예외를 선언하고 예외 자체도 테스트에 기록한다.
- ROADMAP 바이트 판정: 패키지에 ROADMAP.md 사본이 없는 구버전 패키지에서는 보수적으로
  보존한다(오삭제보다 잔재).
- temp 정리는 헬퍼가 만든 경로만 지운다 — 테스트가 실패해도 after 훅이 다른 경로를
  건드리지 않는다.
- 리허설 스크립트 이동 시 기존 `harness-cli.test.mjs` 의 옛 경로 부재 검사와 충돌하지
  않아야 한다(검사는 유지, 새 경로로 보강).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (H-1): lock 모드 materialize 는 `.harness/docs` 를 링크 대상에 포함하고,
  gitignore lock 항목과 stale-workcopy 정리 목록에도 같은 경로가 등재돼야 한다.
- **FR-002** (H-7): 드리프트 가드는 materialize 가 실제 생성하는 링크 집합과
  lockModeEntries·STALE_WORKCOPY_PATHS 를 **정확 일치 양방향**으로 대조해야 하며,
  의도적 예외는 allowlist 로 명시한다. 세 목록 중 한쪽만 갱신되면 테스트가 실패한다.
- **FR-003** (M-5): `prune-downstream --apply` 의 ROADMAP.md 삭제는 패키지 사본과
  바이트 일치할 때만 수행한다. 사본 부재 시 보존한다.
- **FR-004** (H-2): update-policy.md required-gitignore 절은 실제 메커니즘
  3개(entries/lockModeEntries/managedBlocks)·모드별 적용 경로·현행 항목을 반영해야
  하며, required-gitignore.json 의 description 동일 오류도 함께 수정한다.
- **FR-005** (H-3): project-owned.mjs 의 examples 주석은 "update 미덮어쓰기"와
  "clone 잔재 정리 대상"을 분리 서술해야 한다. update-policy.md 표에도 같은 각주.
- **FR-006** (H-4): README·CONTRIBUTING·project-init-guide·update-guide 의 init 정리
  서술은 "`--reset-git` 무관 항상 실행"으로 정정하고, 하드코딩 경로 목록과 수동
  `rm -rf` 예시를 정본 참조로 대체한다.
- **FR-007** (H-6/M-17/L-9): 두 픽스처 헬퍼는 공통 기반(fixture-base)을 공유하고,
  생성한 temp 경로를 레지스트리에 등록해 종료 시 일괄 정리하며, git 실행은 전역
  설정(gpgsign 포함)에서 격리돼야 한다.
- **FR-008** (M-6): ci-node-verify 는 planning-check 스크립트 부재 시 경고 로그를
  남겨야 한다(조용한 스킵 금지).
- **FR-009** (1-3): 리허설 스크립트는 tests/ 로 이동해 다운스트림 배포에서 제외하고,
  mise 태스크로 실행 경로를 부여한다. 기존 dev-runner 경로 가드는 유지한다.
- **FR-010** (1-4): codi-config.yaml/manifest.json 의 스킬 목록은 실재 스킬과
  일치해야 한다 — 유령 5건 제거, 누락 7건 추가. 기존 카탈로그 문서화 테스트는 유지.
- **FR-011** (1-5): release-check.sh 의 태그 검증은 엄격한 쪽(grep 정규식) 하나만
  남긴다.
- **FR-012** (M-8~M-10, M-21, L-5): CONTRIBUTING migrate 절은 packaging-guide 정본
  포인터로 축약(`git add -u` 경고는 보존), README 의 bootstrap/install 자기모순 해소,
  restore-harness 안내 문구를 실행 가능한 절차로 교체, skill-usage.mjs 헤더 경로 정정,
  bootstrap.sh 주석에서 reclaim-shared 제거.
- **FR-013** (M-18, M-20): ROADMAP.md 에 015 행과 "예정 작업" 절(2026-08-03 스킬
  재측정)을 추가한다.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: lock 전환 픽스처에서 `.harness/docs` 가이드가 소실 0건으로 유지된다
  (전환 후 링크 존재 + gitignore 등재 + stale-workcopy 정리 대상).
- **SC-002**: 세 목록(링크/ignore/정리) 중 어느 한쪽의 단독 변경도 테스트 1건 이상을
  실패시킨다 — 시뮬레이션(항목 제거/추가)으로 입증.
- **SC-003**: 프로젝트가 수정한 ROADMAP.md 는 `--apply` 후에도 남는다.
- **SC-004**: 전체 테스트 실행이 temp 에 남기는 `codi-*` 디렉터리 순증가 0개.
- **SC-005**: 감사 보고서가 지목한 낡은 서술 문자열(restore-harness 안내, "currently
  empty", `--reset-git` 조건 정리, 하드코딩 rm -rf 예시, `.planning` 실행 경로,
  reclaim-shared 주석)이 대상 파일에서 0건 검출된다.
- **SC-006**: 스킬 카탈로그 유령 항목 0건·실재 스킬 누락 0건, shared-manifest 에서
  리허설 스크립트 0건.
- **SC-007**: 기존 전체 테스트(`npm test`)와 `./harness doctor` 가 green 을 유지한다.

## Assumptions

- 감사 보고서의 34건 판정(반증 통과)은 재검증 없이 사실로 신뢰한다. 구현 중 보고서와
  코드가 어긋나면 코드 실측을 우선하고 어긋남을 verification.md 에 기록한다.
- 범위 밖(명시): D-1~D-6 결정 항목, M-19(v1.3.1 재발행 후), M-1~M-4·M-7·M-11~M-16
  및 나머지 LOW(후속 웨이브). 후속 웨이브 항목은 감사 보고서가 backlog 역할을 한다.
- 이 수정들은 다음 릴리스(v1.3.2 예정)에 묶여 나간다. 릴리스 발행 자체(D-1 결제 해소)는
  사용자 작업으로 선행 조건이 아니다.
