# Quickstart: 정의-후행 경량 경로 검증

전제: 저장소 루트, `mise` 설치, `npm test` 통과 상태.

## 시나리오 1 — 미등록 버킷 (US1)

1. 데모 delivery-evidence.json에 카탈로그에 없는
   `featureDefinitionId: "FEAT-TEMP-X"` work item을 임시 추가.
2. `mise run docs:build` 실행.
3. 기대: 빌드 성공, 힌트에 `미등록 기능 1건` + stub 안내,
   `docs/planning.html` 기능 현황에 미등록 묶음 카드 표시.
4. 임시 항목 제거 후 재빌드로 원복.

## 시나리오 2 — stub 등록 (US2)

1. `mise run feature:stub "FEAT-QS-TEST" "퀵스타트 검증"`.
2. 기대: planningSource `feature-definitions.json`에 draft 항목,
   `decisions.json`에 열린 결정 추가, 같은 명령 재실행 시 "이미 존재"
   안내만 출력.
3. 검증 후 두 파일에서 항목 제거로 원복.

## 시나리오 3 — 역방향 연결 (US3)

1. 임의 spec의 `status.yaml`에 `featureId: "FEAT-QS-TEST"` 추가.
2. `mise run docs:build` 후 해당 기능 상세/추적성에 spec 연결 표시
   확인. planning 관계와 충돌시키면 conflict health 확인.

## 시나리오 4 — specs deliverySource 투영 (US4)

1. 임시 루트에 카탈로그 + specs deliverySource 워크스페이스 구성
   (자동화 테스트 `feature-hub-sitemap-build.test.mjs`가 동일 시나리오
   포함 — `node --test tests/feature-hub-sitemap-build.test.mjs`).
2. 기대: spec 유래 상태·진행률이 delivery 근거로 투영, 명시 evidence
   존재 기능은 evidence 우선.

## 회귀 게이트

```sh
npm test               # 전체 node:test
mise run planning:check
mise run feature:status:sync
```
