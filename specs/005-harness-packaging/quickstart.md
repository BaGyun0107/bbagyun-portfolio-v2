# Quickstart Validation: 하네스 패키지화 (Phase 2)

계약: [contracts/pkg-cli.md](./contracts/pkg-cli.md) ·
데이터: [data-model.md](./data-model.md)

모든 시나리오는 가짜 업스트림(태그 있는 로컬 bare repo)과
`CODI_HARNESS_CACHE_DIR` 격리로 실행 가능하다.

## 시나리오 1 — lock 설치 (US1)

```sh
node --test tests/pkg-fetch-materialize.test.mjs
```

기대: 빈 캐시에서 lock 버전 수신 → `.harness/current` flip →
materialize 트리의 심링크가 캐시를 가리킴. 서로 다른 버전을 pin한 두 레포
공존 케이스 green.

## 시나리오 2 — 자동 채널 업데이트 (US2)

기대: 가짜 업스트림에 patch 태그 추가 → 백그라운드 수신 + pending →
preflight에서 flip. major 태그만 있으면 유지 + 안내. 진행 중 세션 불변
(pending 상태에서 flip 전까지 current 불변) green.

## 시나리오 3 — pin/롤백/오프라인 (US3)

기대: `pin` 즉시 전환(네트워크 차단 상태에서 캐시 보유 버전), 오프라인
세션 시작 무지연·무실패, 캐시 없는 버전 pin은 트리 불변 + exit 1.

## 시나리오 4 — 릴리스 검증 (US4)

기대: CHANGELOG 절 없는 태그 생성 시도 → 거부. 정상 절 존재 → annotated
tag 생성, push 안 함.

## 시나리오 5 — 기능 동등성 실측 (V2, SC-005)

임시 프로젝트를 lock 모드로 구성한 뒤 실제 Claude Code 헤드리스 실행으로
심링크 rules 로드를 확인하고, doctor·훅 동작을 커밋 보유 방식과 비교한다.
결과는 research.md R4와 verification.md에 기록.
