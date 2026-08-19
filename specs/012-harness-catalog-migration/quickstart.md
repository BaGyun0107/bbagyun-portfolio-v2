# Quickstart: 하네스 카탈로그 전환 검증

## 시나리오 1 — advisory 분리 (US1)

1. 상세 없는 카탈로그 항목만 있는 임시 워크스페이스 빌드(자동화 테스트
   포함): source 상태 available + `feature-detail-missing` advisory.
2. 손상 JSON 원본으로 재빌드: source 상태 invalid 유지.

## 시나리오 2 — 하네스 카탈로그 (US2)

1. `mise run docs:build` 후 `docs/planning.html`에서 harness-internal
   워크스페이스의 기능 정의 화면에 11개 기능 표시 확인.
2. 기능 현황에서 spec 유래 work item(상태·진행률) 확인.
3. `node --test tests/feature-hub-canonical-data.test.mjs` — 관계·집계
   불변.

## 시나리오 3 — 잔재 제거 (US3/US4)

1. 제거 각 항목: `grep -rn "<파일명>" . --exclude-dir=.git` 참조 0 확인.
2. render-hub 제거 전후 `mise run docs:build` 산출 diff 없음 확인.
3. `npm test` 전체 + `mise run planning:check` 통과.
4. docs/superpowers 링크 갱신 후 저장소에 깨진 링크 grep 0건.

## 회귀 게이트

```sh
npm test
mise run docs:build
mise run planning:check
mise run feature:status:sync
```
