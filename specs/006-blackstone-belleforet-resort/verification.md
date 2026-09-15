# Verification: 블랙스톤 벨포레 리조트 구조화 상세 이전

**Date**: 2026-08-24

## Baseline

구현 전 `apps/front`의 기존 구조화 2개·legacy 6개 상태를 확인했다.

| 구분 | 명령 | 결과 |
| --- | --- | --- |
| 대상 단위 테스트 | `pnpm vitest run src/data/portfolio/content-quality.test.ts src/data/portfolio/feature-detail-quality.test.ts` | PASS — 2 files, 78 tests |
| TypeScript | `pnpm exec tsc --noEmit` | PASS — 오류 0건 |

Vitest는 기존 `configLoader: native` 예정 변경 안내를 출력했지만 테스트 실패나
이번 feature 변경에서 발생한 경고는 아니다.

## TDD Evidence

### US1 — 구조화 상세와 exact 회귀 계약

- RED: `pnpm vitest run src/data/portfolio/content-quality.test.ts src/data/portfolio/feature-detail-quality.test.ts`
  - 3개 테스트가 예상대로 실패했다: legacy `content` 잔존, 구조화 목록에
    블랙스톤 누락, 상세 registry 미등록.
- GREEN: 같은 명령으로 2 files, 80 tests 통과.
- TypeScript: `pnpm exec tsc --noEmit` 통과.
- exact 구조화 대상은 공개 목록 순서와 무관한 집합 계약이므로 정렬 후 세 slug를
  비교한다. legacy 5개 fixture의 순서와 본문 길이 계약은 그대로 유지한다.

### US2 — 지표 근거와 금지 수치

- RED: `pnpm vitest run src/data/portfolio/content-quality.test.ts`
  - 누락된 세 지표와 PMS 근거 등급 때문에 2개 테스트가 예상대로 실패했다.
  - 결제 총량·누적·비율 금지 계약은 구현 전부터 통과했고 새 회귀 계약으로 잠갔다.
- GREEN: 같은 명령으로 1 file, 24 tests 통과.

### US3 — 사실 정정 6종과 연결 인사이트

- RED: `pnpm vitest run src/data/portfolio/content-quality.test.ts`
  - timeout 실제 순서, PHP 보상 방식의 실제 판단, WebView·인사이트 정합성
    3개 테스트가 예상대로 실패했다.
- GREEN: 같은 명령으로 1 file, 29 tests 통과.
- 전체 단위 회귀: `pnpm vitest run` — 4 files, 110 tests 통과.

### US4 — 결제·보상취소 스윔레인

- RED: `pnpm vitest run src/data/portfolio/feature-detail-quality.test.ts`
  - 스윔레인 미구현으로 exact 1개 및 lane 4·step 9·edge 8·exception 3 계약
    2개가 예상대로 실패했다.
- GREEN: 대상 1 file, 61 tests 통과.
- 전체 단위 회귀: 4 files, 112 tests 통과.

## Final Verification

검증은 2026-08-24에 다음 순서로 새로 실행했다.

| 순서 | 명령 | 결과 |
| --- | --- | --- |
| 1. 타입 | `pnpm exec tsc --noEmit` | PASS — 오류 0건 |
| 2. 단위 | `pnpm vitest run` | PASS — 4 files, 112 tests |
| 3. 변경 범위 lint | `pnpm exec eslint <신규 상세·registry·feature·테스트·E2E>` | PASS — 오류 0건 |
| 3a. 인사이트 의미 규칙 | `pnpm exec eslint src/data/portfolio/insights.ts --rule 'prettier/prettier: off'` | PASS — 블랙스톤 변경부와 Prettier 외 ESLint 오류 0건 |
| 4. 빌드 | `pnpm run build` | PASS — 38/38 static pages, 블랙스톤 route 포함 |
| 5. fresh E2E | `pnpm exec playwright test --config=playwright.feature-006.fresh.config.ts --reporter=line` | PASS — 별도 포트 12106, 31/31 tests |
| 6. 공백 | `git diff --check` | PASS |

Fresh E2E는 포트 1104의 dev 서버를 재사용하지 않았다. 실행 뒤 임시 설정
`apps/front/playwright.feature-006.fresh.config.ts`를 삭제했고 포트 12106에 남은
listener가 없음을 확인했다.

리뷰 보강 뒤 위 체인을 다시 실행했다. 최종 결과는 TypeScript PASS, 단위 112개
PASS, 변경 범위 lint PASS, build 38/38, fresh production E2E 31/31,
`git diff --check` PASS다.

## Review

`superpowers:requesting-code-review`로 사실 정확성, 회귀 테스트 강제력, 지표
근거 범위, 공개 경로 계약을 검토했다.

1차 리뷰에서는 구현 콘텐츠 자체의 사실 오류는 없었지만 Important 2건이 나왔다.

1. 사실 정정 테스트가 일부 substring만 검사해 부정문과 인과관계 역전을 막지 못함
2. 네 지표의 전체 근거 객체와 feature 메타·연결 인사이트의 금지 수치를 모두
   고정하지 못함

다음과 같이 해소했다.

- 역할·신규 구축·컴플레인 하한·timeout 인과 순서·PHP 보상 판단·WebView 한계를
  완전 문장 또는 exact 값으로 고정했다.
- 네 지표의 ID·label·value·kind·asOf·evidence·caveat를 exact 배열로 고정했다.
- 금지 수치와 운영 중 서비스 오해 표현을 feature 메타·상세·연결 인사이트 전체에서
  검사한다.
- 보강 테스트가 부정문으로 남아 있던 "운영 중 서비스를 옮기는 선택이 아니라"를
  실제로 검출해 해당 전제 자체를 제거했다.

재리뷰 결과 Critical 0건, Important 0건, Ready 판정이다.

## Convergence

`speckit-converge` 기준으로 FR 23개, SC 7개, 사용자 수용 시나리오 22개,
계획 결정 D-001~D-008, 헌법 원칙 5개를 현재 코드와 대조했다. missing, partial,
contradicts, unrequested finding은 모두 0건이며 추가 태스크 없이 `Converged`다.

이 저장소에는 `feature:status:sync` mise task가 없어 `ROADMAP.md`와 `tasks.md`를
수동 상태 정본으로 갱신했다.

## Residual Risk

- `insights.ts`에는 블랙스톤 블록 밖 기존 Prettier baseline 11건이 남아 있다.
  관련 없는 인사이트를 포맷하지 않았으며 Prettier 규칙을 제외한 ESLint는 통과했다.
- Next.js build와 fresh 서버는 저장소 루트의 복수 lockfile 추론 경고를 출력한다.
  빌드·route 생성·E2E 결과에는 영향을 주지 않았다.
- Vitest는 향후 Vite `configLoader: native` 기본값 변경 안내를 출력한다. 현재
  112개 테스트는 정상 통과하며 이번 feature에서 설정을 변경하지 않았다.

## 2026-08-25 후속 사실 정정

### 범위와 판단

- PMS 약 20초와 장애 약 1시간은 결과 카드에서 제거했다.
- 운영 관찰 기간은 `2024년 오픈 ~ 현재 진행 중`으로 바꾸고, 시스템 전수 집계가
  아닌 유지보수 회고 범위라는 caveat를 유지했다.
- WebView 제약에서 일반 공개 제한 문장을 제거하되, 원인이 앱 개발자에게 전달받은
  내용이라는 근거 한계와 브릿지 구현 사실은 유지했다.
- 약 20초는 정상 평균 응답 속도가 아니라 당시 API 문제로 지연된 상태였고 현재는
  API가 수정됐다는 시점을 구분했다. timeout을 근거 없이 정하지 않아야 한다는
  설계 교훈으로 재서술했다.
- `resvId`·`tid`·결제 fallback은 기존 자료 요약에만 있고 Q&A에서 직접 확인되지
  않아 공개 상세·스윔레인·회고에서 제거했다. 외부 PMS 장애 분기는 로그의 최초
  발생·종료 시각으로 장애 구간을 확인한 범위만 남겼다.

### TDD RED/GREEN

- RED: 대상 Vitest 2개 파일에서 6개 테스트가 예상대로 실패했다.
  - 지표 4개 → 2개 exact 계약
  - 운영 관찰 기간의 현재 진행 중 표기
  - 당시 API 문제와 현재 수정 상태를 구분한 timeout 서사
  - WebView 제약의 불필요한 공개 제한 문장 제거
  - 상세와 스윔레인의 fallback 식별자 제거
- GREEN: 같은 대상 명령으로 2 files, 91 tests 통과.

### 검증 결과

| 순서 | 명령 | 결과 |
| --- | --- | --- |
| 1. 타입 | `pnpm exec tsc --noEmit` | PASS — 오류 0건 |
| 2. 전체 단위 | `pnpm vitest run` | PASS — 4 files, 113 tests |
| 3. 변경 범위 lint | `pnpm exec eslint <블랙스톤 상세·콘텐츠 테스트·상세 테스트·E2E>` | 첫 실행에서 새 문자열 줄바꿈 1건 검출 후 수정, 재실행 PASS |
| 4. 빌드 | `pnpm run build` | PASS — 38/38 static pages |
| 5. fresh E2E | `pnpm exec playwright test --config=playwright.feature-006-followup.config.ts --reporter=line` | PASS — 최종 별도 포트 12108, 31/31 tests |
| 6. 공백 | `git diff --check` | PASS |

Fresh E2E 뒤 `apps/front/playwright.feature-006-followup.config.ts`를 삭제했고 포트
12108 listener가 없음을 확인했다. `mise run feature:status:sync`는 기존과 같이
등록된 task가 없어 실행되지 않았으며 `ROADMAP.md`의 완료 상태는 변경할 필요가 없다.

### 후속 리뷰와 수렴

독립 리뷰 1차 결과는 Critical 0건, Important 2건이었다.

1. PMS 장애 분기의 로그 근거 범위가 문장 단위 테스트로 고정되지 않음
2. WebView 일반 공개 제한 문장 제거와 fallback 금지의 공개 범위가 FR에서 불명확함

다음과 같이 해소했다.

- PMS 장애 예외의 `trigger`·`response`·`edgeIds`를 exact 객체로 고정했다. 응답을
  임시로 `외부 PMS 장애를 조사했습니다`로 약화했을 때 대상 테스트 1건이 RED가
  되는 것을 확인한 뒤 원문을 복원해 61/61 GREEN을 확인했다.
- FR-017에 불필요한 일반 공개 제한 문장 금지를 명시하고, FR-019·SC-004의
  `resvId`·`tid`·fallback 금지를 핵심 구현·결과·회고를 포함한 공개 상세 전체로
  확장했다.
- 재리뷰 결과 Critical 0건, Important 0건, Ready 판정이다.

최종 수렴 점검은 FR 23개, SC 7개, 수용 시나리오 22개, D-001~D-008, 헌법
원칙 5개를 대조했다. missing·partial·contradicts·unrequested finding은 모두
0건이며 추가 task 없이 `Converged`다.

### 후속 잔여 위험

- `현재 진행 중`은 사용자 요청에 따른 운영 상태 표현이며, 향후 유지보수가 종료되면
  인터뷰와 카드의 기준 시점을 다시 고정해야 한다.
- 기존 workspace root·복수 lockfile 경고와 Vitest configLoader 안내는 동일하게
  남아 있으나 build·test·E2E 결과에는 영향을 주지 않았다.
