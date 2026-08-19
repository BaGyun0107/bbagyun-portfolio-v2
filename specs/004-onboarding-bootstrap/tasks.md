# Tasks: 하네스 원클릭 온보딩 부트스트랩 (Phase 1)

**Input**: Design documents from `specs/004-onboarding-bootstrap/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/bootstrap-cli.md, quickstart.md

**Tests**: TDD 명시 요청됨 — 각 구현 태스크 전에 실패하는 테스트 태스크 배치.

**Organization**: 사용자 스토리(US1 원클릭, US2 멱등, US3 Superpowers) 단위로
독립 구현·테스트 가능하게 구성.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

**Purpose**: 도구 버전 정의(단일 출처) 확장

- [x] T001 루트 `mise.toml` `[tools]`에 bun·uv·pnpm·gh 추가 (research.md R1의
  백엔드 선택 반영; node = "24"는 유지)

---

## Phase 2: Foundational — V3 가드레일 carve-out (blocking)

**Purpose**: 패키지 매니저 정책을 "커맨드 위치 매칭"으로 정밀화 — 이후 모든
bun 관련 개발·테스트 커맨드의 오탐 차단을 제거 (research.md R5)

- [x] T002 [TDD] `tests/tool-permission-guard-carveout.test.mjs` 작성 — 차단
  유지 케이스(`bun install`, `yarn add`, `mise exec -- bun run x`)와 통과
  케이스(`mise use bun@1`, `mise install`, `rg "bun" file`, 파이프/체인 내
  위치별 케이스)를 고정하고 **실패를 확인**한다
- [x] T003 `.harness/hooks/tool-permission-guard.mjs`의
  `guardPackageManager`/`packageManagerFromCommand`를 단순 커맨드 분리(;,
  &&, ||, |) 후 첫 토큰(래퍼 `mise exec --`·`corepack` 제거 후) 매칭으로
  수정 — T002 green 확인
- [x] T004 전체 회귀: `npm test` 실행 (297/297 pass),
  `tests/guardrails-fp-battery.test.mjs` 포함 green 확인

**Checkpoint**: 이후 어떤 스토리 작업도 가드 오탐 없이 진행 가능

---

## Phase 3: US1 — 신규 팀원 원클릭 온보딩 (P1) 🎯 MVP

**Goal**: 도구 없는 macOS 머신에서 커맨드 하나로 온보딩 완료 (US1)

**Independent Test**: quickstart 시나리오 1(dry-run)과
`tests/bootstrap-flow.test.mjs`의 US1 케이스만으로 검증 가능

- [x] T005 [US1] [TDD] `tests/bootstrap-flow.test.mjs` 작성 — 스텁 PATH(가짜
  uname/xcode-select/mise/gh 스크립트 주입)로 다음 케이스 고정 후 **실패
  확인**: ① 미지원 OS → exit 2 + 변경 0건 ② `--dry-run` → 7단계 순서 출력
  ③ CLT 부재 → 설치 창 실행 후 exit 3 ④ gh 미인증 거부 → exit 3
  (계약: contracts/bootstrap-cli.md)
- [x] T006 [US1] `.harness/scripts/setup/bootstrap.sh` 골격 작성 — OS 확인,
  단계 러너(`[bootstrap N/7]` 한국어 출력), `--dry-run` 지원(기존 install.sh
  `run()` 컨벤션), 종료 코드 0/1/2/3 계약 구현
- [x] T007 [US1] 단계 2~5 구현 — git/CLT 확인(`xcode-select -p`), mise
  설치(`curl https://mise.run | sh`) + `~/.zshrc` activate 라인 마커 기반
  추가, `mise install`, `gh auth status` 확인/`gh auth login` 안내
  (in `.harness/scripts/setup/bootstrap.sh`)
- [x] T008 [US1] 단계 6~7 구현 — `./harness install` 위임, `./harness
  doctor` 실행, 성공/스킵/실패 요약 블록 출력
  (in `.harness/scripts/setup/bootstrap.sh`)
- [x] T009 [P] [US1] `harness` 런처에 `bootstrap` case와 help 항목 추가
- [x] T010 [US1] T005 전 케이스 green + quickstart 시나리오 1 실측
  (`./harness bootstrap --dry-run` — 실제 변경 0건, exit 0)

**Checkpoint**: US1 단독으로 MVP 배포 가능

---

## Phase 4: US2 — 재실행해도 안전한 멱등 실행 (P2)

**Goal**: 재실행 안전 — 충족 단계 스킵, 중복 설정 0, 실패 지점 재개 (US2)

**Independent Test**: 완료 상태 재실행과 중간 실패 재개를 스텁 환경에서
단독 검증 가능

- [x] T011 [US2] [TDD] `tests/bootstrap-flow.test.mjs`에 멱등 케이스 추가 후
  **실패 확인** — ① 전부 충족 상태 재실행 → 모든 단계 "확인됨" + 변경 0건
  ② zshrc에 activate 라인 기존재 → 중복 append 없음 ③ 중간 단계 실패 상태
  재실행 → 완료 단계 스킵 후 이어서 진행
- [x] T012 [US2] 멱등 로직 구현/보강 — 각 단계 "검사 → 충족 시 확인됨 출력
  후 스킵" 패턴 일관 적용, 셸 프로필은 마커 grep 후에만 append, 삭제·수정
  금지(추가만) (in `.harness/scripts/setup/bootstrap.sh`)
- [x] T013 [US2] T011 green + quickstart 시나리오 2 실측(현재 머신 재실행
  1분 이내, `grep -c 'mise activate' ~/.zshrc` == 1)

**Checkpoint**: "막히면 다시 실행하세요" 단일 안내 성립

---

## Phase 5: US3 — Superpowers 플러그인 자동 준비 (P3)

**Goal**: Superpowers 자동 설치 시도 + 안내 폴백 (US3, research.md R4)

**Independent Test**: 스텁 claude CLI로 설치/부재/기설치 세 경로를 단독
검증 가능

- [x] T014 [US3] [TDD] `tests/bootstrap-flow.test.mjs`에 Superpowers 케이스
  추가 후 **실패 확인** — ① 스텁 claude 존재 + 미설치 →
  `claude plugin install superpowers@claude-plugins-official` 호출됨
  ② claude 부재 → 수동 안내문이 요약에 포함 ③ 이미 설치
  (`claude plugin list` 스텁) → 중복 시도 없이 "확인됨"
- [x] T015 [US3] 구현 — `claude plugin marketplace add
  anthropics/claude-plugins-official`(멱등) 후 `claude plugin install`
  비대화식 실행, 실패/부재 시 안내 폴백; `.harness/scripts/setup/install.sh`의
  낡은 "비대화형 설치 경로 미지원" 안내문을 R4 사실로 갱신
- [x] T016 [P] [US3] 프로젝트 `.claude/settings.json`에 `enabledPlugins`
  보강 선언 추가(`superpowers@claude-plugins-official: true`) — 미설치
  사용자가 세션에서 설치 명령 안내를 받도록 (v2.1.195+ 동작)
- [x] T017 [US3] T014 green 확인

**Checkpoint**: 자동 설치 성공 또는 명확한 수동 안내 중 하나 보장 (FR-010)

---

## Phase 6: Polish & Cross-Cutting

- [x] T018 [P] README.md 온보딩 절에 `./harness bootstrap` 안내 추가, 기존
  수동 설치 안내를 부트스트랩 우선으로 재정렬
- [x] T019 [P] `./harness help` 출력과 CONTRIBUTING.md 워크플로 문서에
  bootstrap 항목 반영 (T009에서 help는 추가됨 — 문구 정리)
- [x] T020 전체 검증 — `node --test tests/` green, quickstart 시나리오 1·2·
  3·4 실측 기록, `mise run feature:status:sync` 실행 후 상태 전이 확인
- [ ] T021 신규 머신 실사용 검증(SC-001/002/005)은 팀원 1인 온보딩 시
  quickstart 시나리오 5로 수행 — 결과를 spec 디렉토리에 기록 (릴리스 후
  확인 항목)

---

## Dependencies

- Phase 1(T001) → Phase 2(T002~T004) → 사용자 스토리 순차: US1(T005~T010)
  → US2(T011~T013) → US3(T014~T017) → Polish(T018~T021)
- Phase 2가 모든 스토리를 블로킹: carve-out 없이는 bun 관련 테스트·검증
  커맨드가 가드에 오탐 차단됨
- US2·US3는 US1의 bootstrap.sh 골격에 의존하지만 서로는 독립 — US1 완료 후
  병렬 진행 가능
- [P] 태스크: T009(런처)는 T006 이후 테스트 작성과 병렬 가능,
  T016(settings)·T018·T019(문서)는 서로 다른 파일이라 병렬 가능

## Implementation Strategy

- **MVP = Phase 1~3 (US1)**: dry-run과 스텁 테스트가 green이면 배포 가치
  있음 — 이 시점에 팀 공유 가능
- 증분 전달: US2(멱등 보강) → US3(Superpowers) 순으로 각 체크포인트에서
  커밋·검증
- TDD 규율: 각 [TDD] 태스크에서 테스트 실패를 먼저 확인한 뒤 구현 태스크
  진행 (superpowers:test-driven-development 스킬 적용)
- 검증 규율: 완료 주장 전 superpowers:verification-before-completion 적용,
  quickstart 시나리오 실측 출력을 증거로 남김
