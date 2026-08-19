# Verification: 연결형 기능 허브 v2

검증일: 2026-07-16

## 자동 검증

- [x] `node --test --test-reporter=dot tests/*.test.mjs` — 433개 전체 Node 테스트 통과, exit 0.
- [x] `node .harness/scripts/checks/rule-check.mjs` — `ok: rule lifecycle checks passed`.
- [x] `node --test tests/feature-hub-render.test.mjs tests/feature-hub-status-sync.test.mjs tests/feature-hub-transition.test.mjs tests/design-system-contrast.test.mjs` — 50개 테스트 통과.
- [x] 대규모 build fixture — 500 feature, 100 screen, 50 flow와 500 typed relation, 100 flow link의 count 보존; 약 38~50ms로 2초 기준 통과.

## 생성물·브라우저 검증

- [x] `mise run docs:build` — exit 0, `docs/index.html` 생성; 문서 102건, 기능 8건, 기능정의 8건.
- [x] Chromium local file load — `file:///Users/codiworks_dev/Desktop/codi-harness-v2/docs/index.html` HTTP-equivalent status 200, console error 0건.
- [x] 기능정의 4-view — 사이트맵 기본 표시 후 관계도, 표, 사용자 흐름 패널 전환과 가시성 확인.
- [x] shared state — 기능정의 검색어 `허브` 입력 후 사용자 흐름에서 사이트맵으로 전환해도 값이 유지됨.
- [x] fail-open empty state — 현재 사람 소유 `data/feature-relations.json`, `data/user-flows.json`이 없는 상태에서 관계/흐름 원본 미정의 안내가 표시되고 build는 성공함.
- [x] delivery evidence — 기능 카드 8개 모두 근거 요약을 렌더하고, 008 상세에서 다음 작업·검증 범위·열린 결정 항목을 확인함.
- [x] mobile 375×812 — 최초 브라우저 점검에서 사이트맵 2열 때문에 195px body overflow를 발견; 회귀 테스트와 1열 media rule 추가 후 overflow 0px, console error 0건 확인.

## 현재 데이터 진단

- relation/flow 원본 부재는 계약상 허용되는 `not-configured` 상태이며 구현 실패가 아니다.
- 현재 사이트맵 기준 기능정의 8건이 모두 미배치이고 빈 화면 노드 5개가 남아 있다. 이는 사람이 소유한 `data/sitemap.json`과 기능정의 `Area`를 후속 정합화할 때 해소할 데이터 품질 항목이다.
- 완료 상태 전이는 `tasks.md` 전체 완료, `verification.md` 체크리스트 전체 완료, 열린 결정 0건을 모두 만족할 때만 제안한다.

## Convergence

- [x] 1차 대조에서 FR-011의 surface hierarchy와 flow 0-match 유지 gap 2건을 찾아 T038~T040으로 append하고 구현함.
- [x] 2차 대조에서 FR 19개, SC 8개, 인수 조건 14개, plan/contracts/tasks와 구현을 재검토함. 추가 gap 0건 — Converged.
- [x] 전체 433개 테스트, rule check, docs build, Chromium desktop/mobile 검증을 최종 재실행함.
- [x] `mise run feature:status:sync` check-only와 `--apply` — 결정적 인접 전이 `in-progress → in-review`, 이후 evidence gate의 `in-review → done`을 순차 적용; 모두 exit 0.
