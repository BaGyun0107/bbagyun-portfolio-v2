# Verification: 호텔 예약 플랫폼 구조화 상세와 연결 인사이트 정정

**Started**: 2026-09-09

## 기준선

- Branch: `chore/cleanup-downstream-harness`
- Size: Large
- 사용자 실행 dev server: PID `36986`, `*:1104` listener. 이 기능에서는 종료·재시작하지 않는다.
- 2026-09-09 확인한 기존 공개 경로:
  - `200 /projects/hotel-reservation-platform`
  - `200 /insights/config-driven-architecture-react`
  - `200 /insights/context-api-encapsulation-and-router-level-isolation`
- 승인 전 1440px full-page 화면은 `/tmp/feature010-project-before.png`, `/tmp/feature010-config-waited.png`, `/tmp/feature010-context-waited.png`에서 확인했다. `/tmp` 산출물은 검증용이며 저장소에 포함하지 않는다.
- 두 인사이트는 최초 자동 캡처에서 로딩 화면이 보였고, 약 4초 뒤 제목과 본문이 정상 표시됐다. 후속 브라우저 검증은 제목 표시를 기다린 뒤 캡처한다.
- 승인 전 화면과 본문에서 프로젝트 복제, 무수정 온보딩, Provider Hell·접근 통제, `localStorage`, 가격·재고 재검증 등 Feature 010의 철회 대상 문구가 남아 있음을 확인했다.

## 구현 전 자동 테스트

```text
Command: pnpm vitest run
Result: PASS
Test Files: 7 passed
Tests: 267 passed
Duration: 932ms
```

Vite의 future `configLoader: native` 관련 기존 경고가 출력됐지만 테스트 실패는 없었다.

## RED/GREEN 기록

### T007~T009 작업물 구조화 상세 RED

```text
Command: pnpm vitest run src/data/portfolio/content-quality.test.ts src/data/portfolio/feature-detail-quality.test.ts src/components/projects/project-detail-rendering.test.tsx src/components/projects/project-swimlane-layout.test.ts
Result: FAIL (expected RED)
Test Files: 4 failed
Tests: 13 failed, 194 passed
```

실패는 호텔 예약 플랫폼 detail 미등록, legacy `content` 잔존, 신규 스윔레인 부재에서 발생했다. 기존 검사 194건은 통과했으며 구현 전 기능 부재를 확인하는 RED로 판정했다.

### T010~T012 작업물 구조화 상세 GREEN

```text
Command: pnpm vitest run src/data/portfolio/content-quality.test.ts src/data/portfolio/feature-detail-quality.test.ts src/components/projects/project-detail-rendering.test.tsx src/components/projects/project-swimlane-layout.test.ts
Result: PASS
Test Files: 4 passed
Tests: 207 passed
```

승인된 역할·기간·세 지표와 구조화 본문을 등록하고 legacy 본문을 제거했다. 플랫폼 변경 스윔레인은 252px·307px·684px·766.7px에서 연결선의 노드 관통과 종단 직선 길이 회귀 검사를 통과했다.

### T013~T016 코드 경계 인사이트 RED → GREEN

```text
RED: 2 test files failed, 3 failed / 72 passed
Cause: 기존 제목과 legacy 본문만 있고 editorial data-flow가 없음

GREEN command: pnpm vitest run src/data/portfolio/insight-editorial-quality.test.ts src/components/insights/insight-visual-rendering.test.tsx
Result: PASS
Test Files: 2 passed
Tests: 76 passed
```

Config 이후의 배치 질문만 남기고 core·rsConfig·platform으로 분류되는 normal 관계 visual을 추가했다. 작업물 연혁·Context·NICEPAY를 반복하지 않는 계약도 함께 통과했다.

### T017~T020 예약 Context 인사이트 RED → GREEN

```text
RED: 2 test files failed, 3 failed / 76 passed
Cause: 기존 제목과 legacy 본문만 있고 editorial before-after가 없음

GREEN command: pnpm vitest run src/data/portfolio/insight-editorial-quality.test.ts src/components/insights/insight-visual-rendering.test.tsx
Result: PASS
Test Files: 2 passed
Tests: 80 passed
```

직접 문제를 Props Drilling로 제한하고 Redux 비교, 예약 라우터의 ReservationProvider 생명주기와 useReservation 직접 소비를 공개했다. 접근 권한·성능·순차성 보장이 아니라는 한계도 계약으로 고정했다.

### T021~T023 공개 경로와 양방향 연결 RED → GREEN

```text
RED command: pnpm exec playwright test e2e/portfolio-insight-contract.spec.ts --grep "목록은 migration 대상|legacy 7개 route" --workers=1
Result: FAIL (expected RED), 2 failed
Cause: 화면은 project-case 12개와 정정 제목을 제공하지만 E2E는 기존 10개·legacy 제목을 기대함

GREEN command: pnpm exec playwright test e2e/portfolio-insight-contract.spec.ts --grep "목록은 migration 대상|/projects/hotel-reservation-platform에서|legacy 5개 route" --workers=1
Result: PASS, 4 passed
```

세 기존 route를 유지하고 작업물에서 두 인사이트로, 각 인사이트에서 작업물로 keyboard Enter 왕복을 확인했다. 사용자 소유 1104 process는 재시작하지 않았다.

### T024~T027 시각 자료 통합 RED → GREEN과 1104 검토

```text
Static contract: 2 test files passed, 146 tests passed

Initial E2E: 7 passed, 1 failed
Failure: /insights/config-driven-architecture-react @ 320px
Observed: document scrollWidth 327px / clientWidth 320px
Root cause: 288px H1에서 core·rsConfig·platform 문자열이 줄바꿈되지 않아 H1 scrollWidth가 311px까지 증가

Fix: 전역 base `h1` 규칙에 `overflow-wrap: anywhere`를 추가해 긴 기술 식별자도 컨테이너 안에서 줄바꿈
GREEN: 8 passed
```

1104에서 다음 시각 자료를 1440px로 캡처하고 직접 검토했다.

- `/tmp/feature010-project-swimlane-1104.png`
- `/tmp/feature010-config-visual-1104.png`
- `/tmp/feature010-context-visual-1104.png`
- `/tmp/feature010-hipass-settlement-visual-1104.png`
- `/tmp/feature010-hipass-socket-visual-1104.png`

새 작업물 스윔레인은 코드 배치·검증·배포와 패리티 복구를, 첫 인사이트는 세 코드 배치 기준을, 두 번째 인사이트는 props 간접 전달과 route-scoped 직접 소비를 각각 구분했다. node·actor·relation label의 잘림이나 겹침은 확인되지 않았다. 기존 하이패스 visual의 성공·실패·재시도와 공용 Room·User Room 의미도 보존됐다. 캡처 중 고정 header가 긴 스윔레인 locator 위에 보이는 것은 Playwright가 긴 요소를 캡처하기 위해 스크롤한 시점의 fixed header이며 diagram 내부 겹침은 아니다. 사용자 소유 PID `36986`은 종료·재시작하지 않았다.

### T002~T006 공통 visual 계약

- RED: `pnpm vitest run src/data/portfolio/insight-editorial-quality.test.ts src/components/insights/insight-visual-rendering.test.tsx`
  - 결과: 2 files failed, 6 tests failed, 66 passed
  - 이유: 공통 validator가 normal-only 흐름에 success·failure·retry를, indirect/direct 비교에 overbroad·intended를 강제했고 빈 패널 관계를 거부하지 않았다. renderer에는 새 actor role attribute·문자 역할과 scope별 semantic token 스타일이 없었다.
- GREEN: 같은 scoped 명령
  - 결과: 2 files passed, 72 tests passed
  - 기존 하이패스 정산 success·failure·retry와 Socket.io overbroad·intended fixture 및 renderer 회귀를 포함한다.
- 참고: 두 실행 모두 기존 Vite future `configLoader: native` 경고가 출력됐으며 테스트 실패 원인은 아니었다.

## 최종 검증

### 정적 검사와 build

| 검사 | 결과 |
| --- | --- |
| `pnpm exec tsc --noEmit` | PASS, 오류 0건 |
| Feature 010 scoped Vitest | PASS, 6 files / 289 tests |
| `pnpm vitest run` | PASS, 7 files / 291 tests |
| 실제 변경 TS/TSX·E2E scoped ESLint | PASS, 오류·경고 0건 |
| `pnpm run build` | PASS, Next.js 16.1.6, 38개 static page 생성 |
| `git diff --check` | PASS |

Vitest의 향후 native config loader 안내와 Next.js의 복수 lockfile workspace-root 안내는 기존 환경 경고다. H1 줄바꿈을 위해 `globals.css`의 기존 base `h1`에 `overflow-wrap: anywhere` 한 줄만 추가했다. CSS 파일 전체의 기존 Prettier 편차는 관련 없는 포맷 변경을 피하기 위해 수정하지 않았다.

### Fresh production E2E

포트 12112가 비어 있음을 확인하고 production build를 기동한 뒤 임시 `playwright.feature-010.prod.config.ts`로 네 suite를 실행했다.

첫 전체 실행은 **58/60 PASS**였다. Feature 009의 “visual 없는 legacy” 표본이 이번에 visual을 얻은 Config 글을 가리켜 1건이 실패했고, 첫 하이패스 복합 route 이동에서 일회성 30초 load timeout 1건이 발생했다. legacy 표본을 실제 visual 없는 NestJS 글로 교체한 뒤 두 focused 검사는 **2/2 PASS**했고 timeout은 재현되지 않았다.

최종 전체 재실행:

```text
Command: pnpm exec playwright test e2e/hotel-reservation-platform.spec.ts e2e/portfolio-insight-contract.spec.ts e2e/hipass-structured-detail.spec.ts e2e/swimlane-viewer.spec.ts --config=playwright.feature-010.prod.config.ts --reporter=line --workers=2
Result: PASS
Tests: 60 passed
Duration: 1.2m
```

세 신규 route, 12:1 유형 목록, 작업물↔두 인사이트 keyboard 왕복, 5개 legacy route, 320·768·1024·1440px overflow, 기존 하이패스 visual과 7개 공통 swimlane inline/Dialog 회귀를 포함한다.

### Production 화면 검토

다음 6개 full-page 캡처를 `view_image`로 확인했다.

- `/tmp/feature010-prod-project-320.png`
- `/tmp/feature010-prod-config-320.png`
- `/tmp/feature010-prod-context-320.png`
- `/tmp/feature010-prod-project-1440.png`
- `/tmp/feature010-prod-config-1440.png`
- `/tmp/feature010-prod-context-1440.png`

320px에서는 긴 제목이 문서 폭 안에서 줄바꿈되고 visual node·relation이 세로로 읽힌다. 작업물의 긴 swimlane은 축소 preview와 명시적 `크게 보기`를 유지한다. 1440px에서는 작업물 본문과 사이드바, data-flow 카드, before/after 두 패널이 분리되며 라벨 잘림·겹침·오독 가능성을 확인하지 못했다.

### 독립 리뷰 보완

독립 리뷰에서 Critical은 없었고 Important 3건을 확인해 모두 보완했다.

1. before 패널의 간접 props 전달 끝점도 `consumer`라는 이유만으로 `직접 소비자`로 표시되던 의미 모순을 제거했다. actor 역할은 중립적인 `상태 사용 지점`으로 표시하고 직접·간접 여부는 connection scope가 설명한다.
2. 분기 가능한 data-flow 노드를 배열 순서대로 `단계 N`이라고 표시하던 오독 가능성을 제거했다. 노드는 `기준 상태`·`입력`·`처리`·`결과`라는 역할 label을 사용하며, Config의 core·rsConfig·platform 세 노드는 모두 동등한 `결과`로 표시한다.
3. T024의 요소 겹침 검사가 내부 clipping만 확인하던 누락을 보완했다. data-flow node·edge와 before-after 패널별 actor·connection에 pairwise bounding-box 검사를 추가했다.
4. 공통 data-flow 관계 목록의 접근성 이름을 하이패스 전용 문구에서 `${visual.title} 연결 관계`로 바꿨다.
5. 긴 인사이트 제목의 줄바꿈 규칙을 전역 `h1`에서 인사이트 상세 제목의 `[overflow-wrap:anywhere]`로 좁혔다.

```text
RED command: pnpm vitest run src/components/insights/insight-visual-rendering.test.tsx
Result: FAIL (expected RED), 3 failed / 6 passed
Cause: 단계 번호와 직접 소비자 label이 남아 있음

GREEN command: pnpm vitest run src/components/insights/insight-visual-rendering.test.tsx
Result: PASS, 9 passed

Production E2E command: pnpm exec playwright test e2e/hotel-reservation-platform.spec.ts --config=playwright.feature-010.prod.config.ts --reporter=line --workers=2
Result: PASS, 8 passed
Coverage: 320·768·1024·1440px document overflow, element clipping, pairwise bounding-box overlap

Fresh regression command: pnpm vitest run
Result: PASS, 7 files / 291 tests
Renderer·renderer test·Feature 010 E2E scoped ESLint and git diff --check: PASS
```

위 보완을 모두 반영한 최종 production build는 다시 38개 정적 페이지를 생성했다. 이어 같은 네 suite를 재실행한 결과 **60/60 PASS (40.5s)**였으며, 새 pairwise overlap 검사와 기존 하이패스·공통 swimlane 회귀를 최종 코드 상태에서 함께 확인했다.

인사이트 상세 page는 Feature 010 시작 전부터 파일 전체에 formatting/import-order baseline이 있었고, 최종 scoped ESLint에서 기존 68건이 그대로 보고됐다. 이번에 수정한 H1 class line의 오류는 0건이며, 관련 없는 전체 page 포맷은 수행하지 않았다.

### 자동화·환경 상태

- `mise run e2e:changed`: exit 0. staged 변경이 없어 `no changed app with an e2e suite, skipping (no evidence stamped)`로 종료했다. 사용자 변경을 stage하지 않았으며 별도 production E2E 60/60을 실제 증거로 사용한다.
- `mise run feature:status:sync`: exit 1. 저장소에 `//:feature:status:sync` task가 없어 `--apply`를 실행하지 않았고 자동 상태 전이를 주장하지 않는다.
- 임시 `playwright.feature-010.prod.config.ts`와 소유한 12112 production process를 제거했고 포트 12112 해제를 확인했다.
- `/tmp/feature010-playwright-results` 삭제는 저장소 guard가 재귀 삭제를 차단해 우회하지 않았다. 저장소 밖의 실패 캡처 임시 폴더만 남아 있다.
- 1104의 사용자 dev server는 build 직전 PID 36986을 확인했으나 build 뒤 listener가 사라지고 `.next/dev/lock`만 남았다. 해당 PID에 신호를 보내지 않았다. 사용자에게 상황과 새 PID가 필요함을 보고하고 명시적 승인을 받은 뒤 정확한 stale lock 파일만 제거해 `pnpm dev`를 다시 실행했다.
- 복구된 1104 listener는 PID `46911`이며 `/projects/hotel-reservation-platform`, `/insights/config-driven-architecture-react`, `/insights/context-api-encapsulation-and-router-level-isolation` 세 경로가 모두 HTTP 200으로 응답했다. 포트 12112는 해제됐고 임시 production config는 저장소에 남지 않았다.

## 최종 수렴

`speckit-converge` 기준으로 spec·plan·research·data model·contracts·tasks·verification과 실제 구현을 교차 점검했다.

- Functional Requirements: 38개 추적 완료
- Success Criteria: 9개 추적 완료
- Acceptance Scenarios: 20개 추적 완료
- Edge Cases: 9개 추적 완료
- Research Decisions: 11개 구현·검증 상태와 일치
- Constitution Principles: 5개 모두 PASS
- 미완료 task 및 checklist: 0개
- 모순·중복·불명확·미검증 finding: 0개

**결과: ✅ Converged**

독립 최종 리뷰도 최신 코드와 검증 기록을 다시 확인했으며 **Critical 0 / Important 0 / Minor 0 / Ready to merge: Yes**로 판정했다. data-flow 접근성 이름, 인사이트 상세에 국소화한 긴 제목 줄바꿈, 역할 기반 분기 label, 간접·직접 관계, pairwise overlap 검사와 하이패스 회귀가 모두 승인 계약과 일치함을 확인했다.

최종 자동 상태 동기화는 `mise run feature:status:sync` task가 저장소에 없어 exit 1로 종료됐다. `--apply` 우회는 하지 않았으며 `spec.md`, `tasks.md`, `ROADMAP.md`를 검증 증거에 따라 수동 완료 상태로 맞췄다.

잔여 환경 상태는 다음과 같다.

- 인사이트 상세 페이지의 기존 formatting/import-order baseline 68건은 이번 범위와 무관해 포맷하지 않았다. 이번 H1 class line 자체 오류는 없다.
- Next.js의 복수 lockfile workspace-root 경고와 Vitest의 향후 native config loader 경고는 기존 환경 경고다.
- 저장소 밖 `/tmp/feature010-playwright-results`는 재귀 삭제 guard 때문에 우회 삭제하지 않았다.
- 사용자 승인으로 복구한 1104 dev server PID `46911`은 계속 실행 중이다.
