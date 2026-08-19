# Verification: 정의-후행(definition-later) 경량 경로

날짜: 2026-07-17. TDD로 구현 — 각 스토리 RED 실패 확인 후 GREEN.

## User Story 검증

- [x] US1 미등록 버킷: normalize가 미등록 item을 `registered: false`로
  유지(테스트 2건 RED→GREEN), 렌더러가 미등록 묶음 + `feature:stub`
  안내 표시, build 힌트/planning:check 경고에 `미등록 기능 N건` 노출.
  재등록 시 마커 해제 테스트 포함.
- [x] US2 stub 등록: tests/feature-stub.test.mjs 5건 (생성, 중복
  무변경, FEAT- 형식 검증, mise 태스크 존재, demo 제외 대상 선택).
  draft done 차단 회귀 고정 테스트 추가.
- [x] US3 역방향 연결: scan-specs featureId 파싱(빈 값 무시 경고
  fail-open), linked model 우선순위 explicit > reverse > id,
  `spec-feature-link-conflict` 진단 + build 힌트.
- [x] US4 specs 투영: build 테스트로 spec 유래 item(`source:
  spec-scan`, status/tasks 투영)과 evidence 우선 보충 검증. 손상
  status.yaml 포함 시에도 빌드 성공(fail-open).

## T018 harness-internal 실검증

- 시나리오: 임시 루트에 카탈로그(FEAT-A) + `deliverySource: specs`
  (spec 001-sample, `featureId: FEAT-A`, tasks 없음) 구성 후 build.
- 결과: planning 경로로 로드되면서도 spec 유래 work item 1건이
  보존됨 (`workItems: 1`). 카탈로그 도입 시 spec 현황 소실 리스크(감사
  기록 R2) 해소.
- 실제 저장소 `mise run docs:build` 정상. 새 비차단 힌트 2건(미배치
  기능정의 1건, traceability orphan 2건)은 011 spec 신규 추가에 따른
  예상 힌트.

## 회귀 게이트 (2026-07-17 최종)

- [x] npm test 전체 — 644/644 통과
- [x] mise run docs:build — 정상. 011의 미배치/orphan 힌트는
  `data/feature-relations.json` canonical 편입(need/spec/화면/검증
  관계 7건)으로 해소, 빈 화면 노드 10→8개
- [x] mise run planning:check — exit 0 (경고 없음)
- [x] mise run feature:status:sync — 상태 전이 제안 없음 (011은
  in-review, T098류 사람 게이트 없음이나 사용자 리뷰 대기)

## Canonical 편입 기록

011을 하네스 IA 정본에 편입: NEED-DEFINITION-LATER need 신설,
satisfied-by/specified-by/depends-on×2/verified-by/appears-on×2 링크
추가, 스냅샷 테스트(feature-hub-canonical-data)를 11 기능/84 링크로
갱신.
