# Tasks: 그누보드5 PHP 쇼핑몰 프로젝트 하네스 지원

**Input**: Design documents from `specs/021-gnuboard-php-support/`

**Prerequisites**: plan.md, spec.md, research.md(D1~D8), data-model.md, contracts/

**Tests**: 요청됨(TDD) — 계약 테스트를 구현 태스크보다 앞에 배치.

**Organization**: 유저 스토리 단위. US1 온보딩(P1), US2 도커 환경(P2),
US3 프로필·라우팅(P3).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [x] T001 스킬 골격 생성: `.harness/skills/codi-gnuboard/SKILL.md`
      (frontmatter만: name, description)와 빈 `resources/` 디렉터리를
      만들고 `./harness skills-link`로 병합 링크가 생기는지 확인

---

## Phase 2: Foundational (계약 테스트 — red 상태 허용)

- [x] T002 [P] 스킬 계약 테스트 작성
      `tests/codi-gnuboard-skill-contract.test.mjs` —
      contracts/skill-codi-gnuboard.md의 구조·resources·내용 계약을
      검증 (선례: `tests/design-system-skill-contract.test.mjs`)
- [x] T003 [P] 프로필 계약 테스트 작성
      `tests/profile-php-monolith.test.mjs` —
      contracts/profile-php-monolith.md의 CLI 렌더/check, 가드
      차단/통과 행렬(기존 5개 모드 회귀 포함), 인젝터 모드 스킵 검증

**Checkpoint**: 두 테스트가 존재하고 red(미구현으로 실패)임을 확인

---

## Phase 3: User Story 1 - 서버 상주 몰 코드의 깃 온보딩 (P1)

**Goal**: codi-gnuboard 스킬이 온보딩 절차를 단계별로 안내 (SC-001)

**Independent Test**: 그누보드 구조 흉내 테스트 디렉터리에 절차 적용 →
`data/`·`*.sql`·설정 미추적 저장소 생성 확인

- [x] T004 [P] [US1] `resources/gitignore.gnuboard` 작성 —
      `apps/*/data/`, `*.sql`, `.env*`, OS 잡파일 (research D5)
- [x] T005 [US1] SKILL.md 구조 지식 섹션 작성 — 파일럿
      `apps/gnu-og`(5.6.32 순정 원본)를 기준으로 디렉터리 지도(`adm/`,
      `bbs/`, `shop/`, `skin/`, `extend/`, `data/`), 코어 무수정
      원칙(`extend/`), 버전 차이 확인 지점 (research D8; 산문 영어)
- [x] T006 [US1] SKILL.md 깃 온보딩 절차 섹션 작성 — SSH 내려받기 →
      몰당 1레포 + `apps/<mall>/` 배치 → gitignore 적용 → 초기 커밋 →
      rsync/git 반영 경로, 라이브 서버 직접 수정은 승인 대상 명시
      (research D5, clarify Q2)
- [x] T007 [US1] 온보딩 검증: 임시 디렉터리에 그누보드 유사 구조를
      만들어 절차 적용, `git status`에 `data/`·`*.sql` 미노출 확인 후
      결과를 `specs/021-gnuboard-php-support/verification.md`에 기록

**Checkpoint**: US1 관련 계약 테스트 항목 green

---

## Phase 4: User Story 2 - 로컬 도커 환경으로 몰 띄우기 (P2)

**Goal**: compose 템플릿으로 로컬 실행 환경 제공 (SC-002)

**Independent Test**: 템플릿 기동 → 브라우저에서 그누보드 화면 확인

- [x] T008 [P] [US2] `resources/docker-compose.gnuboard.yml` 작성 —
      php:7.4-apache(mysqli·gd), mysql:5.7 + platform + `--sql-mode=`
      + healthcheck, 레포 루트 `/repo` 마운트, `<mall>` 플레이스홀더,
      data/ 네임드 볼륨 (research D4; 주석 한국어)
- [x] T009 [P] [US2] `resources/e2e-suite-example.sh` 작성 — docker
      절대경로 폴백 → 컨테이너 확인 → 없으면 skip(0 종료) → 있으면
      실행 패턴 (research D6)
- [x] T010 [US2] SKILL.md 로컬 도커 환경 + e2e 게이트 연결 섹션 작성 —
      템플릿 사용법, DB 덤프 임포트, 함정 4종 설명, 게이트 소유는
      codi-e2e 명시 (research D4·D6, clarify Q4)
- [x] T011 [US2] `npm test` 중 codi-gnuboard 계약 테스트 전체 green
      확인

**Checkpoint**: 스킬 단독으로 US1+US2 가치 전달 가능 (MVP+)

---

## Phase 5: User Story 3 - PHP 몰 프로필 인식과 라우팅 (P3)

**Goal**: php-monolith 모드로 Node 전제 오진 차단 (SC-003, SC-005)

**Independent Test**: 테스트 프로필로 가드/인젝터 행렬 검증, 기존 5개
모드 회귀 없음

- [x] T012 [US3] `.harness/scripts/tooling/profile.mjs` — modes에
      `php-monolith` 추가(front/back disabled), renderProfile rules
      블록·checkProfile forbidden 기대 확장 (research D1)
- [x] T013 [US3] `.harness/hooks/project-profile-guard.mjs` —
      php-monolith에서 apps/front·back 대상 차단 분기 추가, 안내
      문구는 codi-gnuboard/`apps/<mall>` 라우팅 (research D2)
- [x] T014 [US3] `.harness/hooks/skill-injector.mjs` — php-monolith
      에서 codi-backend·codi-frontend 제안 스킵 (research D3)
- [x] T015 [US3] `.harness/config/skill-triggers.json` —
      `codi-gnuboard` 키워드 항목 추가 (research D3)
- [x] T016 [P] [US3] `.harness/policies/project-profile.md` —
      php-monolith 모드 문서 추가(허용/금지 경로, 라우팅)
- [x] T017 [P] [US3] path-scoped 룰 `.claude/rules/php-monolith.md`
      (paths: `**/*.php`) + Codex 미러
      `.codex/rules/php-monolith.rules` 작성 (research D7)
- [x] T018 [P] [US3] 엔트리포인트 1줄 갱신 — CLAUDE.md path-scoped
      목록, AGENTS.md 스킬 책임 목록에 codi-gnuboard
- [x] T019 [US3] `tests/profile-php-monolith.test.mjs` green 확인 +
      기존 프로필 관련 테스트(harness-cli, codex-pretooluse 등) 회귀
      없음 확인

**Checkpoint**: 전 스토리 완료

---

## Phase 6: Polish & Cross-Cutting

- [x] T020 전체 게이트 실행: `npm test`, `./harness rule-check`,
      `./harness context-check`, `./harness doctor` 전부 통과 (SC-004)
- [x] T021 `./harness skills-link` 재실행 + 인젝터 스모크
      (`그누보드 스킨 수정` 프롬프트 → codi-gnuboard 제안, SC-005)
      결과를 verification.md에 기록
- [x] T022 다운스트림 수동 시나리오(quickstart 4): 임시 레포 +
      compose 기동 + 브라우저 확인(SC-001·SC-002), 증적을
      verification.md에 기록
- [x] T023 루트 `ROADMAP.md` 갱신 + `mise run feature:status:sync`
      실행(모호/on-hold는 보고만)

## Phase 7: Convergence

- [x] T024 SKILL.md 온보딩 섹션에 운영 DB 덤프 취급 시 가드레일
      민감정보 승인 규칙 참조 추가 per Edge Case(운영 덤프 PII)
      (partial)

## Dependencies

- Phase 1 → Phase 2 → US1(P3단계) → US2 → US3 → Polish 순서가 기본.
- US2는 US1의 SKILL.md 파일에 섹션을 추가하므로 같은 파일 직렬
  (T005·T006 → T010). resources 파일들(T004·T008·T009)은 상호 독립 [P].
- US3는 스킬 존재(T001)만 전제하므로 US1·US2와 파일 충돌 없는 태스크
  (T012~T018)는 병렬 진행 가능하나, 계약 테스트 green 판정(T011·T019)
  은 해당 구현 완료 후.

## Parallel Example

- T002 ∥ T003 (다른 테스트 파일)
- T004 ∥ T008 ∥ T009 (다른 resources 파일)
- T016 ∥ T017 ∥ T018 (정책/룰/엔트리포인트 — 서로 다른 파일)

## Implementation Strategy

MVP = US1(온보딩)만으로도 "서버 직접 수정" 위험 제거 가치 전달.
이후 US2(로컬 환경) → US3(프로필)로 증분 배포. 각 스토리 종료 시점에
계약 테스트 green을 확인하고 커밋 단위를 스토리로 맞춘다.
