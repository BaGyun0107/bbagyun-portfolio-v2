# Tasks: rules-local 보장 경로와 배포 이력 기반 stale 삭제 제한

**Input**: Design documents from `specs/020-rules-local-protection/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-behavior.md

**Tests**: 요청됨 (TDD) — 각 스토리에서 RED 테스트 태스크가 구현 태스크에 선행한다.

**Organization**: 유저 스토리별 독립 구현·검증 단위.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 베이스라인 확인: `npm test` 전체 그린 상태 기록 (회귀 기준점) — specs/020 카탈로그 등록(data 2파일+status.yaml+verification.md)으로 자체 유발 RED 해소, 외부 021 미등록 갭은 verification.md에 기록

---

## Phase 2: Foundational

없음 — 스토리 간 공유 선행 작업이 없다 (US1·US2·US3은 서로 독립).

---

## Phase 3: User Story 1 - 프로젝트 규칙의 보장된 저장 경로 (P1) 🎯 MVP

**Goal**: `.harness/rules-local/` 신설 + project-owned 보호 + Claude 링크 배선.

**Independent Test**: quickstart V2 + `npm test`의 US1 테스트 묶음.

- [X] T002 [US1] RED: project-owned 분류 테스트 추가 — `.harness/rules-local`·`.claude/rules/local`이 project-owned로 분류되는지 단언 (tests/harness-cli.test.mjs 의 L-1 정합 테스트 블록 확장; 분류기 미수정 상태에서 실패 확인)
- [X] T003 [P] [US1] RED: skills-link rules 링크 테스트 추가 — 링크 생성·상대경로·멱등·고아 링크 정리·`.md` 외 무시·rules-local 부재 시 지연 생성 (tests/harness-cli.test.mjs skills-link 테스트 블록 확장)
- [X] T004 [P] [US1] RED: 업스트림 배포 금지 가드 테스트 추가 — shared-manifest 생성 결과에 `.claude/rules/local/` 경로가 실리면 실패 (tests/manifest-coverage.test.mjs)
- [X] T005 [US1] GREEN: PROJECT_OWNED_DIRS에 `.harness/rules-local`·`.claude/rules/local` 추가 + 항목 메모 주석 (.harness/scripts/setup/project-owned.mjs)
- [X] T006 [US1] GREEN: 셸 fallback 동일 항목 동기 (.harness/scripts/setup/project-owned-fallback.sh)
- [X] T007 [US1] GREEN: skills-link.sh에 rules 링크 단계 구현 — `.harness/rules-local/*.md` → `.claude/rules/local/<name>.md` 상대경로 심링크, 멱등·고아 정리·지연 생성 (.harness/scripts/setup/skills-link.sh)
- [X] T008 [US1] GREEN: 소비 링크 트리 gitignore 등재 — `.claude/rules/local` 항목 추가 (.harness/config/required-gitignore.json)
- [X] T009 [US1] T002~T004 테스트 GREEN 확인 + US1 원자 커밋

---

## Phase 4: User Story 2 - 배포한 적 없는 파일은 stale로 삭제하지 않음 (P2)

**Goal**: update stale 삭제를 prior local shared-manifest 실재 파일로 제한 + 이전 안내 + doctor 감지.

**Independent Test**: quickstart V3 + update 적용 회귀 테스트 묶음.

- [X] T010 [US2] RED: update 적용 회귀 테스트 추가 — (a) prior manifest에 없는 커밋 파일(.claude/rules/my-rule.md) 보존 + rules-local 이전 안내 경고, (b) prior manifest 실재 stale 파일 삭제 유지, (c) prior manifest 부재 시 stale 삭제 전체 생략 (tests/harness-cli.test.mjs update 테스트 블록 확장)
- [X] T011 [P] [US2] RED: doctor 감지 테스트 추가 — 배포 이력 없는 파일 존재 시 비차단 경고 출력, 종료 코드 불변 (tests/harness-cli.test.mjs doctor 테스트 블록 확장)
- [X] T012 [US2] GREEN: update.sh stale 삭제 루프 분기 — prior_manifest_list 대조로 distributed-stale만 삭제, unknown-file 보존+이전 안내, 목록 읽기 실패 시 전체 생략 fail-safe (.harness/scripts/setup/update.sh)
- [X] T013 [US2] GREEN: doctor에 unknown-file 감지 항목 추가 — prune-stale 감지 + prior manifest 대조 재사용 (.harness/scripts/checks/doctor.sh)
- [X] T014 [US2] 기존 "830 사고 형태" 핀 테스트 포함 전체 update 회귀 그린 확인 + US2 원자 커밋

---

## Phase 5: User Story 3 - Codex 세션의 프로젝트 규칙 인지 (P3)

**Goal**: AGENTS.md 로드 문구 + agent-preflight 목록 출력.

**Independent Test**: quickstart V4.

- [X] T015 [US3] RED: agent-preflight 출력 테스트 추가 — rules-local 파일 존재 시 목록 1줄 출력, 부재 시 무출력·종료 코드 불변 (tests/harness-cli.test.mjs preflight 테스트 블록 확장)
- [X] T016 [US3] GREEN: agent-preflight.sh에 rules-local 목록 출력 구현 (.harness/scripts/agent/agent-preflight.sh)
- [X] T017 [US3] GREEN: AGENTS.md에 rules-local 조건부 로드 문구 1개 추가 — 200줄 thin 원칙 유지 (AGENTS.md)
- [X] T018 [US3] T015 그린 확인 + `./harness context-check` 통과 + US3 원자 커밋

---

## Final Phase: Polish & Cross-Cutting

- [X] T019 [P] update-policy.md 갱신 — rules-local 소유권·stale 삭제 제한(분류 4종)·이전 안내 서술 (.harness/policies/update-policy.md)
- [X] T020 [P] 상시 로드 룰 문서에 rules-local 관례 편입 — 새 룰 파일 신설 없이 기존 문서(예: .claude/rules/skill-ownership.md의 소유권 절) 확장 + Codex 미러 여부 판정 기록
- [X] T021 품질 게이트 일괄: `npm test` + `./harness context-check` + `./harness rule-check` + `./harness doctor` 전부 통과 확인
- [X] T022 verification.md 작성(명령·핵심 출력·리뷰 결과·e2e 비대상 근거) + `mise run feature:status:sync` + Polish 원자 커밋

---

## Phase 7: Convergence

- [X] T023 rules 링크의 lock 모드 경로 테스트 추가 — HARNESS_ROOT_DIR 재지정(materialize 경유와 동형)으로 skills-link 실행 시 .claude/rules/local 링크가 대상 레포에 생기는지 검증 (tests/harness-cli.test.mjs) per plan: 테스트 목록 (partial)

---

## Dependencies

- Phase 1(T001) → 모든 스토리의 선행.
- US1(T002~T009), US2(T010~T014), US3(T015~T018)은 상호 독립 — 우선순위
  순서(P1→P2→P3)로 진행하되 병행 가능.
- US1 내부: T002~T004(RED) → T005~T008(GREEN) → T009. T005→T006 순서
  고정(정합 테스트가 양쪽 일치를 요구).
- US2 내부: T010~T011(RED) → T012~T013(GREEN) → T014.
- US3 내부: T015(RED) → T016~T017(GREEN) → T018.
- Final Phase(T019~T022)는 모든 스토리 완료 후.

## Implementation Strategy

- **MVP = US1**: 보장 경로+보호+Claude 배선만으로 "규칙을 안전하게 둘
  자리"가 성립.
- 증분 배송: US1 → US2(기존 위험 파일의 구조적 보호) → US3(패리티
  마무리) → Polish(문서·게이트).
- 병렬 기회: [P] 표시 — T003/T004(서로 다른 테스트 파일),
  T011(별도 테스트 블록), T019/T020(서로 다른 문서).
- 커밋 단위: 스토리별 원자 커밋(T009·T014·T018) + Polish 커밋(T022).
  implement 단계는 커밋하지 않고 각 확인 태스크에서 수행.
