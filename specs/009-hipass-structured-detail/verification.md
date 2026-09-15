# Verification: 하이패스 B2B 플랫폼 구조화 상세와 연결 인사이트 정정

**Date**: 2026-09-04

## 사전 상태

- Branch: `chore/cleanup-downstream-harness` (`main`/`dev` 아님)
- 작업 크기: Large
- 요구사항 checklist: 16/16 checked, 0 unchecked
- 공유 worktree: 앞선 포트폴리오 기능과 harness 관련 변경이 다수 존재함. feature 009 대상 파일만 수정하고 관련 없는 변경은 보존한다.
- 포트 1104: 구현 시작 시 listener와 `apps/front/.next/dev/lock` 모두 확인되지 않음. 최종 E2E는 계획대로 별도 production 포트를 사용한다.
- 앱 의존성: `apps/front/node_modules`가 없어 첫 baseline 명령에서 `tsc`, `vitest`를 찾지 못했다. 이 실패는 기능 RED로 취급하지 않았다. 사용자 구현 승인 범위에서 `pnpm --dir apps/front install --frozen-lockfile`을 실행해 lockfile 변경 없이 695개 패키지를 설치했다.
- TypeScript baseline: `pnpm exec tsc --noEmit` PASS
- 관련 Vitest baseline: 4 files, 180 tests PASS. 기존 Vite native config 전환 예고 warning 1건은 feature 009와 무관한 baseline이다.

### 대상 공개 데이터 baseline

- `hipass-b2b-platform`: legacy `content`만 존재하고 structured detail은 미등록. 상태는 `Production`이며 description/overview에 `간이 Outbox`와 측정하지 않은 개선 주장이 남아 있다.
- `json-outbox-pattern-for-settlement`: slug와 `featureSlug: hipass-b2b-platform` 연결은 존재하나 제목·본문이 간이 Outbox, MQ 비교, 다음 영업일 재처리와 DB 재조회 0회를 주장한다.
- `socketio-realtime-architecture-and-reliability`: slug와 `featureSlug: hipass-b2b-platform` 연결은 존재하나 공용 Room을 현재 구조로 설명하고 ACK·DLQ·Redis 계열 미검토 로드맵과 성능 가정을 포함한다.
- 세 slug와 두 insight→project 연결은 보존 대상이며 하이패스 project→두 insight 연결은 structured detail 등록 후 공통 renderer로 제공한다.

## TDD 증거

### Foundation RED — T003~T005

Command:

```bash
pnpm vitest run \
  src/data/portfolio/insight-editorial-quality.test.ts \
  src/components/insights/insight-visual-rendering.test.tsx
```

Result: 2 files FAIL, 7 tests failed, 53 passed.

- validator는 typed visual을 전혀 읽지 않아 provided 일치, dangling node, 필수 success/failure/retry, before/after 패널 오류를 모두 빈 오류 배열로 통과시켰다.
- `InsightVisual.tsx`가 아직 없어 renderer 존재 assertion이 실패했다.
- 실패는 문법·fixture 오류가 아니라 새 계약과 renderer 부재로 발생했으므로 유효한 RED다.

### Foundation GREEN — T006~T010

- `InsightVisual`을 data-flow/before-after 선택형 DTO로 추가하고 visual이 있는 경우만 assessment 일치와 내부 참조를 검증한다.
- 기존 typed visual이 없는 legacy provided 글은 그대로 허용한다.
- insight 상세의 excerpt와 Markdown 본문 사이에 visual이 있을 때만 공통 renderer를 표시한다.
- `pnpm vitest run ...insight-editorial-quality... ...insight-visual-rendering...`: 2 files, 60 tests PASS
- `pnpm exec tsc --noEmit`: PASS

### US1 RED/GREEN — T011~T018

- RED: 3 files에서 10 tests failed, 127 passed. legacy content/status, structured detail 부재, 지표·결제 flow 부재와 renderer 연결 부재를 확인했다.
- GREEN: 하이패스 metadata를 `Archived`와 현재 조회·보존 상태로 정정하고, 네 측정 카드와 결제·보상 취소 스윔레인 하나를 갖는 structured detail을 등록했다.
- 이중 실패는 자동 복구가 없는 stop으로 끝내고 운영자 알림·수동 확인은 현재 회고로만 분리했다.
- 관련 Vitest: 3 files, 137 tests PASS
- `pnpm exec tsc --noEmit`: PASS

### US2 RED — T019~T021

Command:

```bash
pnpm vitest run \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/insight-editorial-quality.test.ts
```

Result: 2 files FAIL, 12 tests failed, 99 passed.

- 기존 글은 승인된 제목 대신 `간이 Outbox`를 사용했고, DB 상태와 JSON 재처리 입력의 역할을 분리하지 않았다.
- 성공 제거·실패 보존, 매일 10시·14시 재시도, 단일 PM2 실행 목적과 단일 서버 적용 경계가 없었다.
- 당시 검토하지 않은 Outbox·MQ·Redis 계열 로드맵과 근거 없는 무결성 표현이 남아 있었다.
- project-case editorial metadata와 provided data-flow가 없어 exact migrated set, visual 관계, deep-copy 계약이 실패했다.

### US2 GREEN — T022~T024

- 제목과 본문을 DB의 `PENDING → PROCESSING → COMPLETED` 판단, JSON 계산·재처리 입력, 성공 제거·실패 보존, 매일 10시·14시 재조회 중심으로 정정했다.
- 단일 PM2 프로세스는 웹 워커의 스케줄 중복 실행을 막고 요청 처리와 정산 작업을 분리한 실제 목적만 설명한다.
- 단일 서버·단일 스케줄러·작은 규모 적용 조건과 로컬 파일 기반 scale-out 한계를 공개하고, Redis·DB 단독·스케줄러 변경은 미검증 회고로 남겼다.
- 작업물의 결제·보상 스윔레인과 다른 질문을 답하는 정산 data-flow와 텍스트 대안을 추가했다.
- 관련 Vitest: 3 files, 114 tests PASS
- `pnpm exec tsc --noEmit`: PASS

### US3 RED — T025~T027

Command:

```bash
pnpm vitest run \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/insight-editorial-quality.test.ts
```

Result: 2 files FAIL, 13 tests failed, 105 passed.

- 기존 글은 신규 구축 당시의 Polling 비교가 아니라 기존 Polling 제거로 읽히고, 공용 Room을 현재 구조처럼 설명했다.
- 개발 중 코드 재검토와 서로 다른 화원 계정 확인, `user_<gardenId>` 전환 사실이 없었다.
- User Room 변경과 메시지 도달 보장을 분리하지 않았고 성능·ACK·DLQ·Redis 계열의 미검증 주장을 포함했다.
- 운영 PM2 3개 워커·cluster adapter의 브라우저 관찰과 워커 간 전달 미검증 범위가 없었다.
- project-case editorial metadata와 provided before/after visual이 없어 exact migrated set과 visual 계약이 실패했다.

### US3 GREEN — T028~T030

- 신규 구축에서 Polling과 Socket.io를 비교한 선택, 개발 중 코드 재검토로 공용 Room의 과도한 전달 범위를 발견한 과정을 복원했다.
- 주문·수주 화원의 `user_<gardenId>` Room으로 제한하고 서로 다른 화원 계정에서 관련 사용자 화면 갱신을 확인한 실제 범위만 공개했다.
- 공용 Room 시절 수신 실패 관찰과 User Room 이후 재현 방법을 찾지 못한 한계를 분리해 Room 변경을 전달 보장으로 확대하지 않았다.
- PM2 3개 워커와 Socket.io cluster adapter의 브라우저 동작 관찰, 워커 간 전달 구조 미이해·미검증을 함께 기록했다.
- ACK·DLQ·Redis 계열과 k6·성능 수치를 제거하고 공용 Room/User Room before-after를 추가했다.
- 관련 Vitest: 3 files, 121 tests PASS
- `pnpm exec tsc --noEmit`: PASS

### US4 RED — T031~T033

- 시각 자료 node·edge·panel·actor·connection을 브라우저에서 개별 검증할 수 있는 semantic data contract를 추가했다.
- 320·768·1024·1440px에서 세 route의 document overflow와 같은 집합 요소의 bounding-box 겹침을 검사하는 E2E를 작성했다. production server 전이므로 아직 실행하지 않았다.
- `pnpm vitest run src/components/insights/insight-visual-rendering.test.tsx`: 1 file FAIL, 3 tests failed, 2 passed.
- 실패 원인은 mobile 단일 열 class와 개별 관계 data attribute 부재이며, 새 계약을 구현하기 전의 유효한 RED다.

### US4 GREEN — T034~T036

- 320px 기본 배치에서는 source→label→target을 세로 한 열로 쌓고 `sm` 이상에서만 좌→우 관계로 전환했다.
- 연결 관계를 선이 텍스트 위를 지나는 canvas/SVG가 아니라 독립 relation row로 유지해 비연결 node·actor 텍스트를 관통하지 않도록 했다.
- node·edge·panel·actor·connection에 semantic data attribute를 추가해 viewport E2E에서 요소별 겹침을 판정할 수 있게 했다.
- 결제 보상, 정산 상태·재처리, Socket.io 수신 대상의 질문·대체 설명·비중복 근거를 서로 대조했다.
- 관련 Vitest: 3 files, 25 tests PASS
- `pnpm exec tsc --noEmit`: PASS

### US5 통합 GREEN — T037~T042

- 세 공개 slug와 두 `featureSlug`, 작업물 본문의 정정 제목 링크, project detail 카드의 href·visible accessible name을 계약으로 고정했다.
- migrated insight exact set은 project-case 10건과 technical-exploration 1건, legacy 7건으로 갱신했다.
- 공통 `ProjectDetailContent`와 insight sidebar 링크 구현은 변경하지 않고 데이터와 렌더링 테스트로 양방향 연결을 확인했다.
- 목록 유형 수, 두 인사이트의 프로젝트 왕복, 키보드 Enter 활성화는 `portfolio-insight-contract.spec.ts`에 추가했다.
- T037 계약은 US2·US3가 제목·metadata·fixture를 단계적으로 먼저 갱신한 뒤 추가되어 별도 RED 없이 즉시 GREEN이었다. 실패를 인위적으로 만들지 않고 이 순서 차이를 기록한다.
- 관련 Vitest: 4 files, 143 tests PASS

## 콘텐츠 리뷰 — T043

| 검토 항목 | 결과 | 근거와 경계 |
| --- | --- | --- |
| 역할 | supported | 백엔드 단독, 프론트엔드 사용자 포함 2인을 작업물에서 구분했다. 두 인사이트는 각 질문에 필요한 책임만 짧게 남겼다. |
| 기간·현재 상태 | supported | 코드 작업 `2024.08–2025.08`, 신규 거래 운영 종료 `2026-06`, 현재 관리자 조회·데이터 보존을 분리했다. |
| 운영 수치 | supported | 월 주문 약 100건, 월 결제 약 400~500만 원, 정산 포함 완료 주문 약 70건, 등록 약 50곳 중 실지급 약 10~20곳을 서로 다른 단위로 표시했다. |
| 결제 보상 | supported | 개발 환경에서 자동 취소 성공과 취소 API 실패를 각각 확인했고, 이중 실패 자동 복구는 없다고 썼다. |
| 정산 상태·입력 | supported | DB 상태가 지급 기준이고 JSON은 계산·재처리 입력이며, 성공 제거·실패 보존·10시/14시 DB 재확인을 설명했다. |
| Socket.io | supported | 공용 Room→화원별 User Room의 수신 범위 변경과 도달 보장 미검증을 분리했다. |
| 운영 결과 | supported | 2026-06까지의 월말 대사와 직접 관찰 범위에서만 불일치·중복·파일 문제를 확인하지 못했다고 제한했다. |
| 금지 주장 | supported | 대상 공개 데이터 검색에서 Outbox·MQ·k6·ACK·DLQ·Redis 계열, 다음 영업일, DB 재조회 0회와 가공 성능 수치가 0건이었다. |
| 비공개 경계 | supported | 고객 거래 원문, 계좌·인증·시크릿, 실제 payload·로그·비공개 소스는 게시하지 않았다. |

### 장문·시각 비중복

- 작업물 장문: 프로젝트 전체 역할, 주문·결제·정산·실시간·협업과 운영 결과의 요약.
- 정산 인사이트 장문: 지급 판단 상태와 재처리 입력을 나눈 한 질문, 적용/회피 조건과 미검증 회고. 작업물의 전체 역할·결제 연대기를 반복하지 않았다.
- Socket.io 인사이트 장문: 이벤트 수신 범위와 도달 보장을 나눈 한 질문. 작업물의 정산·결제 흐름을 반복하지 않았다.
- Visual decision: 작업물 `provided` — 기존 결제·보상 취소 swimlane을 유지한다.
- Visual decision: 정산 인사이트 `provided` — DB 상태와 JSON 입력의 성공·실패·재시도 data-flow를 제공하며 작업물 결제 흐름과 질문이 다르다.
- Visual decision: Socket.io 인사이트 `provided` — 공용 Room/화원별 User Room의 수신 대상 before-after를 제공하며 결제·정산 시각과 겹치지 않는다.

## 정적 검증 — T044~T047

- `pnpm exec tsc --noEmit`: PASS
- 관련 Vitest 5 files: 214 tests PASS
- 전체 `pnpm vitest run`: 초기 구현 7 files, 265 tests PASS. 독립 리뷰 보완 후 7 files, 267 tests PASS
- 새 파일과 관련 공유 파일 ESLint: PASS
- `insights.ts`와 insight detail page의 configured lint는 기존 Prettier/import-order baseline 때문에 실패했다. 두 파일을 `prettier/prettier`·`import/order`만 비활성화해 다시 검사한 결과 다른 ESLint 오류는 0건이었다. 관련 없는 대형 파일 전체를 포맷하지 않았다.
- `pnpm run build`: PASS, 38개 static page 생성. `/projects/[slug]` 8개와 `/insights/[slug]` 18개가 SSG에 포함됐다.
- 기존 warning: 여러 lockfile로 인한 Next.js workspace root 추론 warning과 Vitest native config 예고 warning은 feature 009 외 baseline이다.

## 프로덕션 E2E와 시각 검토 — T048~T050

- 별도 production 포트: `1114` (`pnpm exec next start -p 1114`)
- E2E command: `pnpm exec playwright test --config=playwright.feature009.config.ts e2e/hipass-structured-detail.spec.ts e2e/portfolio-insight-contract.spec.ts e2e/swimlane-viewer.spec.ts`
- 첫 실행: 48 passed, 1 failed. 작업물 heading selector가 실제 제목의 가운데점과 `흐름`을 누락한 테스트 문구 오류였다.
- selector를 실제 공개 제목 `주문·결제·보상 취소 흐름`으로 고친 초기 GREEN은 49 passed였다.
- 독립 리뷰에서 하이패스 스윔레인의 node·edge label bbox 검증 누락을 확인해 공통 structured project 목록에 하이패스를 추가했다. legacy visual 미제공 route의 빈 영역 부재 검사도 더한 뒤 최종 실행은 **50 passed (34.4s)**였다.
- 통과 범위: 세 route 시각 자료, 320/768/1024/1440px overflow·node/edge/actor/connection 겹침, 320/375/768/1024/1440px의 하이패스 포함 7개 inline/Dialog node text·edge label·edge-node bbox, 인사이트 목록 10:1 유형, legacy 7개 보존, 작업물↔두 인사이트 키보드 왕복.
- 수동 캡처: `apps/front/test-results/feature009-{project,settlement,socket}-{320,1440}.png`
- `view_image` 결과: 두 폭 모두 글자 잘림과 문서 가로 스크롤이 없고, 관계 label이 node/actor를 침범하지 않았다. 320px은 한 열, 1440px은 정산 2열 node·Socket.io 2패널로 읽혔다.
- 임시 `playwright.feature009.config.ts` 삭제, 소유한 1114 process 종료. 1104 listener와 `.next/dev/lock`은 시작·종료 시 모두 없었으며 새로 만들지 않았다.

## 독립 리뷰와 보완 — T051

- `superpowers:requesting-code-review` 절차로 독립 reviewer가 인터뷰, spec, 두 contract와 구현을 read-only 대조했다.
- 1차 판정: Critical 0건, Important 4건, Minor 3건.
- 공개일 모순: 두 인사이트의 전면 개정·승인 시점인 `2026-09-04`를 공개일로 정정했다.
- 결제 topology: `주문 저장 실패 → 하이패스 서버 rollback·결제 취소 요청 → 결제 취소 성공(end) / 취소 API 실패(stop)`로 공통 중간 단계를 추가했다. 복구 성공용 추가 end를 표현할 수 있도록 validator는 start 1개, end 1개 이상, normal-only start→end 최소 1개, 모든 non-stop node의 정상·복구 도달성과 end 도달성을 함께 검사한다.
- 주체 경계: `rollback·결제 취소 요청` node를 하이패스 서버 lane에 두고 Toss 결제 lane에는 취소 성공·실패 결과만 두었다.
- Socket 범위: 공용 Room→주문·수주 화원은 `intended`, 공용 Room→관계없는 사용자만 `overbroad`로 정정했다.
- 회귀 보강: typed visual root와 모든 중첩 배열·대표 객체 deep-copy, visual 없는 legacy route의 빈 UI 부재, visual별 before/after heading ID 고유성, 하이패스 공통 swimlane bbox를 고정했다.
- 보완 TDD: 강화 전 focused Vitest는 4 tests FAIL / 135 PASS였고, 보완 뒤 3 files, 139 tests PASS였다.
- 최종 reviewer follow-up: Critical 0건, Important 0건, `Ready to merge: Yes`. reviewer가 최신 320px·1440px 캡처 6개에서도 날짜, 결제 보상 분기, Socket intended/overbroad 구분과 글자 겹침 부재를 재확인했다.

## 최종 검증 준비 — T052

- `mise run e2e:changed`: exit 0, staged file이 없어 `no changed app with an e2e suite, skipping (no evidence stamped)`로 종료했다. 사용자 소유 변경을 stage하지 않았으며, 별도 production server의 수동 명시 실행 50/50을 실제 E2E 근거로 사용한다.
- `git diff --check`: PASS.
- 잔여 baseline: `insights.ts`와 insight detail page의 기존 Prettier/import-order 불일치, Next.js multiple-lockfile warning, Vitest native-config 예고 warning은 기능 밖이다. 관련 없는 파일 전체 formatting이나 root lockfile 변경은 수행하지 않았다.

### Spec Kit converge

- 확인 범위: FR 31개, SC 8개, acceptance scenario 20개, edge case 9개, plan 결정 14개, constitution 원칙 5개.
- finding: missing 0, partial 0, contradicts 0, unrequested 0. severity별 Critical/High/Medium/Low 모두 0건.
- `tasks.md`에 convergence task를 append하지 않았다.
- 결과: **✅ Converged — the implementation satisfies the spec, plan, and tasks.**

## 상태 동기화 — T053

- `mise run feature:status:sync`: exit 1, `no task //:feature:status:sync found`.
- 사용 가능한 mise task 목록에도 `feature:status:sync`가 없어 `--apply`를 실행하지 않았다.
- 자동 상태 전이는 주장하지 않으며, Converged와 전체 task 완료를 확인한 뒤 feature spec과 root ROADMAP을 수동으로 갱신한다.

## 최종 handoff — T054

- feature status: `Complete` (자동 동기화 task 부재로 수동 반영)
- root `ROADMAP.md`: Feature 009 완료 근거와 남은 작업물 2개 순서를 갱신했다.
- 구현은 commit·stage·push·PR 생성 없이 현재 worktree에 남겼다.
- 임시 Playwright config와 소유한 production server를 정리했고, 포트 1104·1114 listener와 `.next/dev/lock`이 없음을 확인했다.
