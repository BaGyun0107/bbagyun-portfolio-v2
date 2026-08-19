# Tasks: 다운스트림 잔재 정리 완결

**Input**: Design documents from `/specs/015-downstream-residue-cleanup/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli.md, quickstart.md

**Tests**: TDD 요청됨 — 각 갭의 회귀 테스트를 구현 전에 작성하고, 실패를 확인한 뒤 구현한다.

**Organization**: user story 단위 phase. 판정 로직(단일 출처 모듈)은 US1·US2가 공유하므로 Foundational에 둔다.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 기존 테스트 픽스처 패턴(tests/bootstrap-flow.test.mjs 등) 검토 후 다운스트림 잔재 픽스처 헬퍼를 tests/helpers/downstream-fixture.mjs 로 추출 (git 레포 + 패키지 캐시 + 잔재 파일 생성 유틸)

---

## Phase 2: Foundational (판정 단일 출처 — US1·US2 공통 선행)

**⚠️ CRITICAL**: US1~US3 는 이 phase 완료 후 시작

- [X] T002 [P] TDD: 디렉터리-자체-링크(.harness/vendor)와 소비 측 링크(.claude/skills/* 등) 추적분이 제거 대상에 포함되는 실패 테스트를 tests/migrate-plan-residue.test.mjs 에 작성 (갭 3·4 — 현재 동작으로는 실패해야 함)
- [X] T003 [P] TDD: harness-selfstate 판정(.specify feature.json 의 패키지 spec 참조, README/package-lock 바이트 일치, docs/audits 이름+내용 일치) 실패 테스트를 tests/upstream-project-state.test.mjs 에 작성 (갭 2)
- [X] T004 [P] TDD: package.json 정규화(name=codi-harness-v2 교체, test/codex:replay-check 제거, check 의 npm test 제거) 실패 테스트를 tests/normalize-root-package.test.mjs 에 작성
- [X] T005 .harness/scripts/pkg/migrate-plan.mjs 확장 — CONSUMER_LINK_ROOTS/CONSUMER_LINK_PATHS export 추가, computeRemovals 가 SHARED_DIR_ROOTS 의 디렉터리 자체 추적분과 소비 측 링크 추적분을 포함 (T002 green)
- [X] T006 .harness/scripts/setup/upstream-project-state.mjs 확장 — harness-selfstate 판정 함수 추가 (판정 기준은 항상 .harness/current 패키지에서 읽음, 불확실하면 보존) (T003 green)
- [X] T007 .harness/scripts/setup/normalize-root-package.mjs 신규 — init-project.sh 의 normalize_root_scripts 인라인 로직 추출 + name 정규화 추가, init-project.sh 는 모듈 호출로 대체 (T004 green)

**Checkpoint**: 판정 로직 단일 출처 완성 — npm test green

---

## Phase 3: User Story 1 - 소유자 일괄 정리 (Priority: P1) 🎯 MVP

**Goal**: prune-downstream 이 모든 잔재 부류를 보고(check)·정리(--apply)하는 소유자 표면 완성

**Independent Test**: 잔재 픽스처 레포에서 check → --apply → check 재실행 0건, 프로젝트 소유물 보존 (quickstart V3)

- [X] T008 [US1] TDD: prune-downstream 확장 실패 테스트를 tests/prune-downstream-project-state.test.mjs 에 작성 — check 분류별 출력(contracts/cli.md 형식), --apply 의 rm --cached/삭제/README 스텁/package.json 정규화/lock 삭제/.specify 리셋, 프로젝트 소유물 보존 케이스
- [X] T009 [US1] .harness/scripts/setup/prune-downstream.mjs check 모드 확장 — 분류별(shared-tracked/consumer-link/upstream-state/upstream-copy/harness-selfstate) 보고 구현
- [X] T010 [US1] .harness/scripts/setup/prune-downstream.mjs --apply 확장 — 분류별 apply 동작(data-model.md 1절) 구현, 커밋 안내 출력 (T008 green). .specify 구분 주의: 벤더 자산(바이트 일치)은 rm --cached만(파일 유지), 하네스 참조 런타임 상태는 파일 삭제
- [X] T011 [US1] upstream 실행 거부·copy 모드 무해성 회귀 케이스를 tests/prune-downstream-project-state.test.mjs 에 보강하고 통과 확인

**Checkpoint**: US1 단독 검증 가능 — 픽스처에서 quickstart V3 성립

---

## Phase 4: User Story 2 - 팀원 bootstrap 단일 표면 (Priority: P1)

**Goal**: pkg-sync/bootstrap 은 보고만 — 인덱스 불변, 잔재 발견 시 소유자 절차 안내

**Independent Test**: bootstrap 전후 git 인덱스 동일 + 잔재 레포에서 residue 보고 (quickstart V4)

- [X] T012 [US2] TDD: 인덱스 불변·residue 보고 실패 테스트를 tests/member-flow-index-immutable.test.mjs 에 작성 (현재 reclaim-shared 자동 회수 때문에 실패해야 함)
- [X] T013 [US2] .harness/scripts/pkg/reclaim-shared.sh 를 보고 전용으로 전환 (판정은 prune-downstream 공용 경로 위임, thin wrapper + 은퇴 예고 주석) 하고 .harness/scripts/pkg/pkg-sync.sh 의 호출부를 잔재 보고 + bootstrap-summary `residue <N>` 기록으로 변경 (T012 green)
- [X] T014 [US2] .harness/scripts/setup/bootstrap-summary.mjs 에 residue 라인 해석·소유자 안내 문구 추가
- [X] T015 [US2] 기존 tests/bootstrap-flow.test.mjs·tests/bootstrap-summary.test.mjs 를 새 계약에 맞게 갱신하고 통과 확인

**Checkpoint**: US1+US2 — 소유자/팀원 플로우 분리 완성

---

## Phase 5: User Story 3 - lock 모드 gitignore 자동 최신화 (Priority: P2)

**Goal**: pkg-sync 가 매 실행 ensure-gitignore 를 idempotent 반영

**Independent Test**: 패키지에 신규 항목 추가 → pkg-sync → 다운스트림 .gitignore 반영, 프로젝트 항목 불변 (quickstart V5)

- [X] T016 [US3] TDD: pkg-sync 의 gitignore 반영 실패 테스트를 tests/pkg-sync-gitignore.test.mjs 에 작성 (신규 항목 반영·프로젝트 항목 불변·copy 모드 무해·lock 생성 후 미전환 레포 가드)
- [X] T017 [US3] .harness/scripts/pkg/pkg-sync.sh 에 materialize 직후 ensure-gitignore.mjs 호출 편입 (패키지 쪽 스크립트 우선, ROOT_DIR 전달, summary `gitignore <N>` 기록) (T016 green)
- [X] T018 [P] [US3] .harness/config/required-gitignore.json entries 에 .claude/skills·.agents/skills 추가

**Checkpoint**: 스키마 링크류 커밋 사고 재발 경로 차단

---

## Phase 6: User Story 4 - 리포 내부 링크 이식성 (Priority: P2)

**Goal**: materialize/skills-link 생성 링크 전부 상대경로 (.harness/current 만 절대 예외)

**Independent Test**: 실행 후 절대경로 링크 1건(current)만, 레포 복사 후에도 링크 유효, 멱등 재작성 (quickstart V2)

- [X] T019 [US4] TDD: 상대경로 불변식 실패 테스트를 tests/materialize-relative-links.test.mjs 에 작성 (materialize + skills-link, 절대 링크 잔존 레포의 멱등 수렴 포함)
- [X] T020 [US4] .harness/scripts/pkg/materialize.sh 에 relative_target 헬퍼(node path.relative) 추가, link_entry 와 개별 ln -s 호출 전부 상대경로 적용 (T019 green)
- [X] T021 [US4] .harness/scripts/setup/skills-link.sh 상대경로 적용 — 링크 생성·기대값 비교(readlink 비교) 로직을 상대 기준으로 갱신

**Checkpoint**: 절대경로 심층 방어 완성 — 전체 npm test green

---

## Phase 7: User Story 5 - 6개 레포 일괄 정리 (Priority: P3)

**Goal**: 신규 동작을 릴리스로 실어 6개 레포 잔재 0 + 검증 기록

**Independent Test**: 레포별 prune-downstream check 0건, 샘플 레포 clone+bootstrap clean (quickstart V6)

- [X] T022 [US5] 검증 파이프라인 실행(npm test, ./harness context-check, ./harness rule-check, ./harness doctor) 및 CHANGELOG.md 갱신 후 릴리스 준비 상태 보고
- [X] T023 [US5] 하네스 릴리스 태그 발행 — ⚠️ 사용자 승인 게이트 (버전·태그 명시)
- [X] T024 [US5] 6개 레포(codi-hansi, codi-hipass, codi-account, codi-crew, codi-crawling, codi-liveview-admin) 각각: pkg-sync → prune-downstream check 검토 → ⚠️ 레포별 사용자 승인 후 --apply → 소유자 커밋·push 안내
- [X] T025 [US5] specs/015-downstream-residue-cleanup/rollout-record.md 에 레포별 결과 기록(quickstart V6 표) + 샘플 1개 레포에서 팀원 시나리오(V4) 검증

**Checkpoint**: SC-001~SC-005 충족 확인

---

## Phase 8: Polish & Cross-Cutting

- [X] T026 [P] .harness/docs/ 의 업데이트·패키징 관련 문서에 소유자/팀원 플로우 분리와 prune-downstream 확장 반영 (구체 파일은 grep 으로 특정: bootstrap/packaging/update-policy 언급 문서)
- [X] T027 quickstart.md V1~V5 전체 재실행·기록, mise run feature:status:sync 실행 후 결과 보고

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → (Phase 3 | Phase 4 | Phase 5) — US1·US2·US3 는 Foundational 이후 병렬 가능
- Phase 6 (US4) 은 Phase 1 이후 언제든 병렬 가능 (판정 로직과 독립)
- Phase 7 (US5) 은 Phase 3~6 전부 완료 + 릴리스 후
- 각 story 내부: TDD 테스트(실패 확인) → 구현 → green
- T013 은 T009 의 check 로직을 재사용하므로 US1 완료 후 착수 권장 (테스트 T012 는 선행 작성 가능)

## Parallel Example

```text
Phase 2: T002 + T003 + T004 동시 작성 (서로 다른 테스트 파일)
Foundational 후: US3(T016~) 과 US4(T019~) 는 US1 과 병렬 가능
```

## Implementation Strategy

- MVP = Phase 1~3 (US1): 소유자 정리만으로도 픽스처 검증 가능한 완결 단위
- 이후 US2 → US3 → US4 순 증분, 각 checkpoint 에서 npm test green 유지
- US5 는 릴리스 게이트(사용자 승인)와 레포별 --apply 승인(사용자)이 있는 운영 단계 — AI 는 커밋/push/머지 하지 않음
