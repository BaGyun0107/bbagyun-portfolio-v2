# Tasks: 감사 후속 웨이브 (2차)

TDD: 동작 변경(R2·R4·R5·R6·M-11·M-12)은 회귀 테스트 선행.

## Phase 1: Setup

- [x] T001 spec 산출물 1차 커밋 (spec/plan/tasks + feature.json)

## Phase 2: US1 결정 집행 (P1)

- [x] T002 [US1] D-2: specs/010 T098/T101 철회 주석과 함께 체크,
      verification.md 결정 기록, status done 전이, ROADMAP 010 행 갱신
- [x] T003 [US1] (test, red) D-3: canonical-data 테스트를 카탈로그-only 기대로
      교체 — feature-detail-missing 0건, DEC resolved, detailId 부재
- [x] T004 [US1] D-3 구현: scan-feature-details 경고를 detailId 명시 시로 한정,
      decisions.json resolved, feature-definitions detailId 16건 제거 → green
- [x] T005 [US1] D-5: 설계 초안 git rm + feature-definitions 인용 3건을
      specs/010 정본으로 교체
- [x] T006 [US1] D-5/M-4: project-owned 에 docs/superpowers/·docs/prompts/·
      CHANGELOG.md·harness.lock.example 추가 — node+셸 fallback 2곳+정책 표+
      동등성 테스트 동시 갱신, manifest 재생성

## Phase 3: US2 갱신 체인·manifest (P2)

- [x] T007 [US2] (test, red) M-4 고아 회귀: manifest 파일 ∀ ∈ (링크 ∪ ignore ∪
      KEEP_COMMITTED ∪ 명시 예외) 단언 테스트 신설
- [x] T008 [US2] M-4 구현: docs/harness-overview.md·docs/planning-hub-handoff.md
      를 materialize 루트 루프+lockModeEntries+STALE_WORKCOPY_PATHS+가드 픽스처에
      추가 → T007·016 가드 green
- [x] T009 [US2] (test, red) M-1 소스 대조: materialize.sh 직접 호출은
      apply-version.sh 뿐임을 단언
- [x] T010 [US2] M-1 구현: apply-version.sh 신설 + 5개 호출부 교체 → green
- [x] T011 [US2] M-2: mise tasks.update description·launcher help 문구 실동작화
- [x] T012 [US2] M-3: init-project fallback 제거(명시 실패) + 관련 테스트 정본
      경로화

## Phase 4: US3 테스트 견고화 (P3)

- [x] T013 [US3] M-11: pkg-sync 통합 픽스처에 real:true 항목 추가 + 구버전
      ensure-gitignore 시나리오 고정
- [x] T014 [US3] M-12: `.harness/skills` 실디렉터리 --apply 회귀 +
      skills-local 보존 단언
- [x] T015 [US3] M-13: 카탈로그 카운트를 유도값으로 교체 (R7)
- [x] T016 [US3] M-14: 소스 정규식 단언을 행위 검증으로 교체
- [x] T017 [US3] M-15/16: prune-downstream·init-project 블록 분할 이동 +
      공용 cli-fixture 추출 + 인라인 잔재 픽스처 헬퍼화
- [x] T018 [US3] 분할 후 전체 스위트 시간 비교 기록 (SC-005)

## Phase 5: US4 LOW 마감 (P4)

- [x] T019 [P] [US4] L-1: project-owned 셸 fallback 공용 .sh 추출 + mjs 정본
      대조 테스트
- [x] T020 [P] [US4] L-2: launcher prune-downstream 에 HARNESS_ROOT 전달
- [x] T021 [P] [US4] L-6: package.json start 3종에 스캐폴드 안내
- [x] T022 [P] [US4] L-7+L-8: copy 모드 help 문구 + 은퇴 예고 문서 3곳
- [x] T023 [P] [US4] L-10: skill-triggers 에 codi-feature-hub·codi-rule-authoring
      추가 + "모든 스킬은 트리거 보유(예외 allowlist)" 테스트
- [x] T024 [P] [US4] L-11: release-check 에 source_ref 검증 추가
- [x] T025 [P] [US4] L-13: harness.lock.example 에 repo 필드 반영
- [x] T026 [P] [US4] L-14: doctor 모드 보고를 packaging-guide·README 에 안내
- [x] T027 [US4] L-15: 패키징 픽스처 읽기 전용 업스트림 공유 (전용 인스턴스
      예외 유지)

## Phase 6: Polish

- [x] T028 data 카탈로그에 017 등재 + status.yaml + 카운트(유도식이면 자동)
- [x] T029 CHANGELOG v1.3.3 절 + npm test/doctor green + verification.md 기록
- [x] T030 리뷰(requesting-code-review) 후 반영, PR

## Dependencies

- T003→T004, T007→T008, T009→T010. T006 은 T005 뒤(같은 파일군).
- T015 는 T028 앞이면 카운트 갱신 불필요. T017 은 T014·T016 뒤(같은 파일 이동).
