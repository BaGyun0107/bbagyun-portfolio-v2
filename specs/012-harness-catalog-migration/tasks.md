# Tasks: 하네스 카탈로그 전환 + legacy 잔재 제거

**Input**: Design documents from `specs/012-harness-catalog-migration/`

**Tests**: TDD — 각 스토리에서 테스트가 구현보다 먼저. 제거는 "참조 0
확인 → 이식 → 삭제 → 검증" 순서 고정.

## Phase 1: User Story 1 - advisory/source health 분리 (P1)

- [X] T001 [US1] RED: 상세 없는 카탈로그 → source available + advisory
  유지, 손상 JSON → invalid 유지 테스트를
  tests/planning-workspaces.test.mjs에 추가하고 실패를 확인한다
- [X] T002 [US1] GREEN: .harness/scripts/docs/lib/build-workspace-hub-model.mjs
  에 SOURCE_HEALTH_CODES 부류 판정을 구현한다 (분류 밖 코드는 advisory)
- [X] T003 [US1] 데모 seeded health 노출 회귀 확인 — 기존
  planning-demo-data/automation/워크스페이스 테스트 전체 통과

## Phase 2: User Story 2 - 하네스 카탈로그 도입 (P1)

- [X] T004 [US2] data/feature-definitions.json 11항목(D2 규칙: spec ID
  재사용, appears-on→placements)과 data/decisions.json 백필 열린 결정
  1건을 작성한다
- [X] T005 [US2] RED→GREEN: harness-internal이 planning 경로로 로드되고
  spec-scan 투영·canonical 집계(11 기능/84 링크)·serviceDefinition rows
  가 불변임을 tests/feature-hub-sitemap-build.test.mjs,
  tests/feature-hub-canonical-data.test.mjs에서 검증한다
- [X] T006 [US2] 실검증: mise run docs:build 후 기능 정의/기능 현황
  화면 확인 결과를 verification.md 초안에 기록한다

## Phase 3: User Story 3 - legacy 잔재 즉시 제거 (P2)

- [X] T007 [US3] tests/feature-hub-render.test.mjs,
  tests/planning-sitemap-render.test.mjs가 검증하는 살아있는 공유
  로직을 식별해 현행 렌더러(render-planning-page) 대상 테스트로
  이식한다 (커버리지 손실 0)
- [X] T008 [US3] .harness/scripts/docs/lib/render-hub.mjs와 전용 테스트
  2파일을 참조 0 확인 후 제거하고, docs:build 산출 불변과 전체 테스트
  통과를 확인한다
- [X] T009 [US3] examples/community-app/expected/hub-snapshot.json을
  참조 0 재확인 후 제거한다
- [X] T010 [US3] TDD: data/feature-definitions.json의 legacy(Row_ID형)
  행 감지 시 "normalizer로 카탈로그 변환" 힌트를 build-hub에 추가하고,
  normalizer SKILL.md의 Layer 2 산출 절을 카탈로그 전용으로 정리한다

## Phase 4: User Story 4 - 구 문서 정리 스윕 (P3)

- [X] T011 [US4] docs/superpowers 설계 초안 7파일의 저장소 참조를
  조사하고, specs/010 spec.md의 Design Basis 링크를 텍스트 주석으로
  갱신한 뒤 파일을 제거한다 (깨진 링크 0 확인)
- [X] T012 [US4] 기능정의/허브 도메인 구 문서 스윕 — 현행 구조와
  모순되는 해설·중복 문서를 grep으로 찾아 정리하고 결과를
  verification.md에 기록한다

## Phase 5: Polish

- [X] T013 스킬(codi-feature-hub 등)·가이드에 하네스 카탈로그 도입
  사실과 legacy 신규 계약 제거를 반영한다
- [X] T014 전체 검증(npm test, docs:build, planning:check,
  feature:status:sync) 후 verification.md 완성, 감사 문서·ROADMAP 갱신
- [X] T015 status.yaml 상태 전이를 mise run feature:status로 기록한다

## Dependencies & Execution Order

- US1 → US2 (카탈로그 도입이 advisory 분리에 의존). US3/US4는 US2와
  독립이나 T005의 산출 불변 확인이 T008보다 먼저 오면 진단이 쉽다.
- 순서: US1 → US2 → US3 → US4 → Polish.

## Implementation Strategy

- MVP는 US1+US2(카탈로그 전환). US3/US4는 제거 증분.
- 각 제거 태스크는 단독 커밋 가능한 단위로 수행해 회귀 시 역추적을
  쉽게 한다.
