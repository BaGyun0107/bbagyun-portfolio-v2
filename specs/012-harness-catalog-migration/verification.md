# Verification: 하네스 카탈로그 전환 + legacy 잔재 제거

날짜: 2026-07-18. TDD — 각 스토리 RED 확인 후 GREEN, 제거는 참조 0 확인
후 수행.

## User Story 검증

- [x] US1 advisory 분리: 상세 없는 카탈로그 → source available +
  `feature-detail-missing` advisory 유지, 손상 JSON → invalid 유지
  (RED→GREEN). 데모 seeded health·automation·portability 회귀 없음.
- [x] US2 하네스 카탈로그: `data/feature-definitions.json` 12항목
  (spec ID 재사용, appears-on→placements, 전 항목 배치),
  `DEC-HARNESS-DETAIL-BACKFILL` 열린 결정 1건. harness-internal이
  planning 경로로 로드되고 spec-scan work item 12건 투영. canonical
  집계 12 기능/91 링크로 정합.
- [x] US3 잔재 제거: render-hub.mjs + 전용 테스트 + 미사용
  hub-snapshot.json 제거. 제거 전후 생성 페이지 해시 동일
  (planning 3bb410f1…, index 471a69df…). screen-only 사이트맵 불변식
  4건은 현행 렌더러 테스트로 이식. legacy 행 감지 힌트
  (`legacy 기능정의 행 N건`) TDD 추가, normalizer Layer 2를 입력 호환
  참조로 강등.
- [x] US4 구 문서 정리: docs/superpowers 설계 초안 16파일 제거,
  이력 spec들의 링크/경로 참조를 정리 주석으로 갱신(깨진 링크 0),
  빅 가이드의 render-hub 서술 갱신. deep-research 프롬프트는 감사
  기록의 짝 문서로 유지.

## 회귀 게이트 (T014 최종)

- [x] npm test 전체 — 아래 최종 실행 기록 참조
- [x] mise run docs:build — 열린 결정 1건 힌트(의도), 빈 화면 노드 7개
- [x] mise run planning:check — 경고(열린 결정)와 함께 exit 0
- [x] mise run feature:status:sync — 아래 기록 참조
