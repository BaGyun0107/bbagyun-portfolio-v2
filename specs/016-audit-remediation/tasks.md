# Tasks: 감사 발견 일괄 수정 (1차)

**Input**: spec.md, plan.md, research.md (R1~R7), quickstart.md (V1~V5)

TDD: 동작 변경 항목(US1, US3-회귀, US4-일부)은 회귀 테스트를 구현보다 먼저 작성한다
(red 확인 후 구현으로 green).

## Phase 1: Setup

- [x] T001 감사 보고서 저장본 확인 후 스펙 산출물과 함께 1차 커밋
      (docs/audits/2026-07-31-full-harness-audit.md, specs/016-audit-remediation/)

## Phase 2: User Story 1 - lock 전환 소실 방지 + 드리프트 가드 (P1)

- [x] T002 [US1] (test, red) tests/prune-downstream-project-state.test.mjs 의 드리프트
      가드를 교체: 픽스처에서 materialize 실행으로 링크 집합 수집(collectLinks 재사용)
      → 링크 ∖ allowlist == STALE_WORKCOPY_PATHS 중 .harness/* == lockModeEntries 중
      .harness/* 정확 일치 양방향 + `.harness/docs` 기대 멤버십 단언. allowlist 원소의
      실재도 단언. red 확인 (R1)
- [x] T003 [US1] (test, red) 같은 파일 또는 tests/materialize-relative-links.test.mjs 에
      lock 픽스처 materialize 후 `.harness/docs` 링크 존재 + gitignore lock 블록 등재
      단언 추가. red 확인
- [x] T004 [US1] .harness/scripts/pkg/materialize.sh 링크 루프에 `docs` 추가
- [x] T005 [US1] .harness/config/required-gitignore.json lockModeEntries 와
      .harness/scripts/setup/upstream-project-state.mjs STALE_WORKCOPY_PATHS 에
      `.harness/docs` 추가, 과장된 가드 주석 정정 → T002/T003 green
- [x] T006 [US1] (test, red) ROADMAP 바이트 판정 회귀: 수정본 보존(red) + 패키지
      사본과 동일본 삭제 유지. 기존 224-234 부근 픽스처를 동일본 케이스로 수정 (R2)
- [x] T007 [US1] upstream-project-state.mjs / prune-downstream.mjs 에 ROADMAP.md
      바이트 일치 판정 구현 → T006 green
- [x] T008 [US1] V1 시뮬레이션 검증(링크 루프에서 docs 임시 제거 → 가드 실패 → 원복,
      역방향 포함) 수행·기록

## Phase 3: User Story 2 - 문서 서술 부채 정정 (P2)

- [x] T009 [P] [US2] H-2: .harness/policies/update-policy.md gitignore 절 3중 오류
      수정 + .harness/config/required-gitignore.json description 동일 오류 수정
- [x] T010 [P] [US2] H-3: .harness/scripts/setup/project-owned.mjs examples 주석
      재작성(두 개념 분리) + update-policy.md 표 examples 행 각주
- [x] T011 [P] [US2] H-4: README.md·CONTRIBUTING.md·.harness/docs/project-init-guide.md·
      .harness/docs/update-guide.md 의 init 정리 서술 정정("--reset-git 무관 항상
      실행") + 하드코딩 경로 목록·수동 rm -rf 예시를 정본 참조로 대체
- [x] T012 [P] [US2] M-8: CONTRIBUTING.md migrate 절을 packaging-guide 7절 포인터로
      축약(git add -u 경고 보존, specs/006 참조 제거)
- [x] T013 [P] [US2] M-9: README.md bootstrap/install 자기모순 해소(표의 install 행
      수정 + "팀원 일상 명령은 bootstrap 하나" 명시)
- [x] T014 [P] [US2] M-10: harness 런처와 .harness/scripts/pkg/pkg-sync.sh 의
      restore-harness 안내를 실행 가능한 토큰 주입 절차로 교체
- [x] T015 [P] [US2] M-21+L-5: docs/audits/tools/skill-usage.mjs 헤더 경로 정정 +
      .harness/scripts/setup/bootstrap.sh 주석에서 reclaim-shared 제거
- [x] T016 [US2] V4 grep 검증 수행·기록

## Phase 4: User Story 3 - 테스트 인프라 위생 (P3)

- [x] T017 [US3] tests/helpers/fixture-base.mjs 신규: tmp 레지스트리 + exit 일괄 정리
      (KEEP_TMP=1 우회) + 전역 격리 git 실행기(GIT_CONFIG_GLOBAL/SYSTEM=/dev/null,
      commit.gpgsign=false) + write/lexists (R3)
- [x] T018 [US3] (test) tests/fixture-base.test.mjs: gpgsign=true 전역 설정 흉내 환경
      에서 픽스처 커밋 성공 + tmp 레지스트리 정리 동작 단언
- [x] T019 [US3] tests/helpers/pkg-fixture.mjs 를 fixture-base 기반으로 개편(공개 API
      유지, 인라인 mkdtemp 제거)
- [x] T020 [US3] tests/helpers/downstream-fixture.mjs 를 fixture-base 기반으로 개편
      (공개 API 유지)
- [x] T021 [US3] V3 검증: npm test 전후 temp `codi-*` 순증가 0 확인·기록

## Phase 5: User Story 4 - 배포 표면·카탈로그 실재화 (P4)

- [x] T022 [US4] 1-3: git mv .harness/scripts/setup/test-init-project-flows.sh
      tests/init-project-flows.sh + ./harness manifest 재생성 + mise.toml
      [tasks.init-rehearse] 등재 + tests/harness-cli.test.mjs 의 원문 검사 경로 갱신
      + 헤더에 INIT_PROJECT_TEST_WORK_DIR 사용법 주석 (R4)
- [x] T023 [US4] 1-4: .harness/config/codi-config.yaml 유령 5건 제거·누락 7건 추가 +
      .harness/manifest.json team_skills 동기화 + codi-phase-routing/SKILL.md 문서화
      보강 → 기존 카탈로그 테스트 green (R5)
- [x] T024 [P] [US4] 1-5: .harness/scripts/pkg/release-check.sh 중복 case 블록 제거
      (grep 검증만 유지)
- [x] T025 [P] [US4] M-6: .harness/scripts/checks/ci-node-verify.sh planning-check
      부재 시 경고 로그 + .github/workflows/ci-node.yml 주석 1줄 (R6)

## Phase 6: User Story 5 - 플래닝 표면 최신화 (P5)

- [x] T026 [US5] M-18+M-20: ROADMAP.md 에 015 행 추가 + "예정 작업" 절(2026-08-03
      스킬 재측정, docs/audits/2026-08-skill-usage-recheck-plan.md 링크) 추가

## Phase 7: Polish & 검증

- [x] T027 data/feature-definitions.json·feature-relations.json 에 016 등재 +
      tests/feature-hub-canonical-data.test.mjs 카운트 갱신(15→16)
- [x] T028 npm test 전체 + ./harness doctor green (V5) — docs/index.html 재생성
      잔여물은 커밋 전 정리
- [x] T029 specs/016-audit-remediation/verification.md 에 V1~V5 증거 기록(체크리스트
      형식) + mise run feature:status:sync
- [x] T030 리뷰(superpowers:requesting-code-review) 후 지적 반영, 커밋 정리

## Dependencies

- US1 내부: T002/T003 (red) → T004/T005 (green), T006 (red) → T007 (green)
- US3 내부: T017 → T018~T020 → T021
- T027 은 spec 산출물 확정 후(T029 직전이 무난). 그 외 스토리 간 의존 없음 — US2~US5
  는 병렬 가능.

## Implementation Strategy

MVP = US1 (소실 방지 + 실효 가드). 이후 US2~US5 는 독립 증분. 전 항목이 한 릴리스
(v1.3.2 예정)에 묶인다.
