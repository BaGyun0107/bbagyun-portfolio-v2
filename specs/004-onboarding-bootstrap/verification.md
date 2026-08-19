# Verification Record: 004-onboarding-bootstrap

**Date**: 2026-07-15 | **Branch**: feature/bootstrap-packaging-design

## 테스트 (typecheck 해당 없음 → unit/flow)

- `npm test`: **309/309 pass** (carve-out 16케이스, bootstrap 플로우 12케이스
  포함, 기존 회귀 무결)
- TDD 준수: T002(16 red)→T003(green), T005(5 red)→T006~T009(green),
  T011 신규 엣지(1 red)→수정(green), T014(3 red)→T015(green)

## Quickstart 실측

- 시나리오 1 (dry-run): `./harness bootstrap --dry-run` — 7단계 순서 출력,
  변경 0건, exit 0 ✅
- 시나리오 2 (멱등 재실행): `time ./harness bootstrap` — **18.9초**(기준 1분
  이내), doctor 실패 0·경고 0, `grep -c "mise activate" ~/.zshrc` == 1
  (실행 전후 동일) ✅
- 시나리오 3 (미지원 OS): `tests/bootstrap-flow.test.mjs` 스텁 케이스 green ✅
- 시나리오 4 (carve-out 회귀): `tests/tool-permission-guard-carveout.test.mjs`
  16/16 green ✅
- 시나리오 5 (신규 머신 실사용, SC-001/002/005): **미실시** — 다음 팀원
  온보딩 시 수행하고 이 파일에 추가 기록 (T021)

## 실측 중 발견·수정된 결함

- 사용자가 마커 없이 직접 추가한 `mise activate` 라인이 있으면 중복
  append되는 문제 — 실머신 검증에서 발견, 검사를 "임의 형태 존재"로 확장
  (커밋 a109f9b)

## e2e 게이트

- 웹 사용자 플로우 아님(개발자 CLI 도구) — e2e 비대상,
  `touches-user-flow` 마커 미설정.

## 재검증 체크리스트 (2026-07-18)

- [x] harness CLI 진입·install·doctor 경로 정합 —
  `tests/harness-cli.test.mjs` 통과
- [x] 전체 스위트 내 부트스트랩 회귀 없음 (npm test 625/625, 2026-07-18)

상태 판단: T021(신규 머신 실사용 온보딩 검증)은 사람 게이트로 미완 —
자동 근거는 완비됐으나 004는 `in-review`를 유지한다.
