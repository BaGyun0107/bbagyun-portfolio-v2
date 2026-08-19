# Quickstart: 연결형 기능 허브 v2 검증

## 1. Automated tests

```bash
node --test tests/feature-hub-spec-detail.test.mjs
node --test tests/feature-hub-scan-traceability.test.mjs
node --test tests/feature-hub-scan-user-flows.test.mjs
node --test tests/feature-hub-linked-model.test.mjs
node --test tests/feature-hub-delivery-evidence.test.mjs
node --test tests/feature-hub-render.test.mjs
node --test tests/feature-hub-sitemap-build.test.mjs
node --test tests/feature-hub-status-sync.test.mjs
npm test
```

Expected: 모든 test pass, fail-open fixture에서도 build exit 0.

## 2. Generate hub

```bash
mise run docs:build
```

Expected: `docs/index.html` 생성. 현재 사용자 소유 sample sitemap 때문에
기존 미배치/빈 node 힌트는 남을 수 있으나 relation/flow 부재는 비차단 안내다.

## 3. Manual browser checks

- 기능 상세에서 spec의 scenario/acceptance/edge/FR/SC와 원본 링크 확인
- relation/tree/table/flow 왕복 시 필터와 선택 상태 유지
- relation node 선택 시 인접 관계 강조 + 동일한 텍스트 목록 확인
- flow의 actor/goal/분기/순환/종료와 연결 screen/feature 확인
- 키보드만으로 view 전환, node/step 선택, 상세 열기 수행
- feature status 카드에서 next action, last transition, open decisions,
  verification coverage 확인

## 4. Status gate

fixture에서 다음 조합을 확인한다.

| Tasks | Verification | Open decisions | Expected |
| --- | --- | --- | --- |
| 100% | 100% | 0 | `in-review → done` 제안 |
| 100% | 미기록 | 0 | 제안 없음 |
| 100% | 일부 | 0 | 제안 없음 |
| 100% | 100% | 1+ | 제안 없음 |
| 일부 | 100% | 0 | 제안 없음 |

## 5. Performance fixture

500 features, 100 screens, 50 flows fixture로 build를 3회 실행한다. 각 실행
2초 이내, entity count 손실 0, broken/orphan count가 fixture 기대값과 같아야 한다.

