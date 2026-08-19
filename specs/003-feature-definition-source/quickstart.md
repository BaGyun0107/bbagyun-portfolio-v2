# Quickstart: 기능정의서 탭 데이터 소스 전환

이 기능이 end-to-end로 동작함을 증명하는 검증 시나리오. 계약과 데이터 형태는
[contracts/scanner-contract.md](./contracts/scanner-contract.md),
[data-model.md](./data-model.md) 참조.

## 사전 준비

- Node.js 24 (mise 관리). `mise install` 완료 상태.
- 저장소 루트에서 실행.

## 검증 1 — 정상 소스가 기능정의서 탭에 표시 (US1, SC-001)

1. 저장소 루트에 `data/feature-definitions.json`을 둔다(정상 배열, 몇 행).
2. 실행:
   ```sh
   mise run docs:build
   ```
3. 기대:
   - 생성 로그에 "기능정의 N건" (N = 소스 행 수, FR-003).
   - `docs/index.html`의 기능정의서 탭에 그 행들이 canonical 컬럼으로 표시.
   - 상세 검색 입력 시 일치 행만 필터(렌더러 기존 동작).

## 검증 2 — 소스 부재 시 빌드 성공 (US2, SC-002)

1. 저장소 루트에 `data/feature-definitions.json`이 **없는** 상태.
2. 실행: `mise run docs:build`
3. 기대:
   - exit 0 성공.
   - 기능정의서 탭은 "데이터 없음" 상태로 렌더.
   - 역할 카드·문서 색인·기능 현황 탭은 정상.
   - 로그/코드 어디에도 STICKY 로컬 절대경로 참조 없음.

## 검증 3 — 손상된 소스에서도 무너지지 않음 (US3, SC-003)

1. 저장소 루트에 깨진 JSON(`{ 로 시작하고 닫히지 않음)을 둔다.
2. 실행: `mise run docs:build`
3. 기대:
   - exit 0 성공 + 경고 출력.
   - 기능정의서 탭은 빈 상태.

## 검증 4 — 단위 테스트 (SC-005)

```sh
mise run test
```

기대: `tests/feature-hub-service-definition.test.mjs`의 정상/부재/손상 케이스가 모두
통과. 다른 feature-hub 테스트(회귀)도 통과(SC-006).

## 검증 5 — 로컬 절대경로 정적 검색 0건 (SC-004)

```sh
grep -rn "codi-STICKY-v1" .harness/scripts/docs
grep -rn "SERVICE_DEFINITION_HTML" .harness/scripts/docs
```

기대: 두 검색 모두 결과 0건.
