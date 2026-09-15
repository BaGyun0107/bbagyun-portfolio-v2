# Verification: Archify 스윔레인 파일럿

**Date**: 2026-09-09
**Status**: Complete
**Size**: Large

## 기준선

- Git branch: `chore/cleanup-downstream-harness`
- 공유 worktree는 Feature 001~010과 harness 관련 기존 수정·미추적 파일이 다수 존재한다. Feature 011은 관련 파일만 수정하고 다른 변경을 stage·format·삭제하지 않는다.
- port 1104 listener: Node PID `46911`, `TCP *:1104 (LISTEN)`
- `GET /projects/hotel-reservation-platform`: HTTP `200`
- 기준선 HTML에는 기존 `크게 보기`가 존재하고 `Archify로 보기`는 없다.
- `apps/front/src/data/portfolio/feature-details/hotel-reservation-platform.ts`의 대상 스윔레인은 step `10개`, edge `12개`다.
- 기존 React preview, summary, exceptions와 `크게 보기` Dialog는 Feature 010에서 검증된 상태이며 Feature 011의 보존 대상이다.

## 제작 도구와 앱 의존성 기준선

- `/Users/codiworks_dev/.agents/skills/archify/bin/archify.mjs doctor`: exit `0`, Node.js·template·workflow renderer/schema·visual-check를 포함한 모든 항목 `[ok]`
- installed Archify skill version: `2.17`
- `apps/front/package.json`의 dependency/devDependency에서 Archify package: 없음
- `apps/front/.prettierignore`: `node_modules`, `.next`, build/dist/coverage와 lockfile을 제외하며 소스 파일을 포맷 대상에서 숨기지 않는다.

## TDD 기록

### 선택형 link contract

- RED: `pnpm vitest run src/data/portfolio/feature-detail-quality.test.ts` → 신규 invalid metadata 4건만 실패, 기존 75건 통과
- 실패 원인: 기존 validator가 빈 label, 외부 URL, `/diagrams/` 밖 path와 non-HTML path를 무시함
- GREEN: `FeatureSwimlaneArchifyLink`와 same-origin `/diagrams/*.html` validator 추가 후 동일 명령 `79/79` 통과
- Vitest의 Vite native config loader 사전 경고는 기존 설정 baseline이며 test 실패가 아니다.

### 대상 link와 artifact

- RED: 두 targeted test file에서 신규 2건만 실패, 기존 99건 통과
  - 대상 스윔레인에 `archify` metadata가 없음
  - `ProjectSwimlane`에 Archify link가 없음
- metadata와 조건부 link 구현 뒤 renderer test는 통과하고 artifact 부재 1건만 예상대로 남았다.
- frozen JSON과 delivered HTML 생성 뒤 동일 targeted suite `101/101` 통과

### 기존 React experience 회귀

- 기존 preview·summary·exceptions·`크게 보기`와 metadata 없는 스윔레인의 Archify UI 부재 characterization 추가
- targeted Vitest: `104/104` 통과
- port 1104 대상 모바일 touch Playwright: 호텔 예약 시스템의 `크게 보기` tap, Dialog 표시, Escape 닫기, trigger focus 복귀 `1/1` 통과

## Archify 증거

### Candidate와 showcase validation

- candidate: `apps/front/diagrams/hotel-reservation-platform/platform-change-verification-deployment.json`
- first candidate update check: `silent`, `current`
- 1차 validation: 한글 label·sublabel 너비 12건 실패
- correction round 1: 의미 문구는 유지하고 validator가 지목한 9개 node width만 조정
- 최종 validation: artifact check `9/9`, composition status `pass`, error `0`, warning `0`
- 최초 통과 뒤 JSON을 동결했으나 visual-check에서 원본의 `플랫폼 확장` lane을 `rsConfig`와 `platform`으로 잘못 나눈 의미 불일치와 세로 overflow를 확인해 시각 보정을 열었다.
- 시각 보정 1: 원본처럼 rsConfig와 platform을 같은 경계에 합쳤으나 4개 lane 배치는 1440×900에서 세로 overflow와 최소 글자 6px 조건을 동시에 만족하지 못했다.
- 시각 보정 2: node·edge·문구 10개·12개를 그대로 유지하면서 `기준 코드`와 `플랫폼 확장`을 `코드 경계` presentation band로 묶었다. 각 node 이름이 core·rsConfig·platform 배치 판단을 그대로 드러내며, 자동 legend는 숨겼다.
- 최종 validation: artifact check `9/9`, composition status `pass`, error `0`, warning `0`. 이 통과 뒤 source를 다시 동결했다.

### Deterministic delivery

- output: `apps/front/public/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html`
- specification SHA-256: `b5472af8952722b9b5fea87fc930f2c5880634ff8da5f17f16c6aaa4f819c419`
- specification bytes: `4355`
- artifact SHA-256: `a23ebd2219cda3bad5deccc3461e7d6522cfc90d5e34d6d4dffd5469817f49d3`
- artifact bytes: `714531`
- delivery validation: `9/9`, showcase pass, error `0`, warning `0`
- `deliver`는 frozen source의 정확한 bytes를 private snapshot으로 처리한 뒤 HTML을 원자적으로 생성했다. private snapshot은 별도 장기 파일이 아니며 provenance는 receipt로 보존한다.

### Frozen source 재검증과 공개 경계

- frozen JSON 재검증: showcase `9/9`, composition error `0`, warning `0`
- 로컬 SHA-256·byte 재계산 결과가 delivery receipt와 일치한다.
- authored node·edge text는 한국어를 유지하고 source에 지원하지 않는 locale을 지정하지 않았다.
- generated HTML은 `<html lang="en">` fallback을 사용한다.
- 프로젝트 본문과 연결 인사이트에는 `Archify` 문구가 삽입되지 않았다.
- authored text의 고객명·예약번호·결제번호·token/key/password와 미승인 자동화·성과 금지어 검사: `0건`
- `git diff`에는 Feature 011 시작 전부터 존재하던 Feature 001~010 콘텐츠 변경이 포함돼 있으므로, Feature 011의 copy 비변경은 신규 test와 이번 실행에서 수정한 파일 목록을 기준으로 판정했다.
- 최종 source/artifact 기준 targeted Vitest: `111/111` 통과

## 브라우저·시각 증거

- 기존 React Dialog 모바일 touch 회귀: port 1104에서 `1/1` 통과
- `Archify로 보기` keyboard Enter·새 page URL·원본 tab 유지: port 1104에서 `1/1` 통과
- original page responsive geometry: 320·375·768·1024·1440px에서 title/action 겹침, document/card 가로 넘침, 다른 작업물의 Archify action을 검사해 `5/5` 통과
- responsive 검증에서 실제 UI 실패가 없어 T023의 조건부 production 수정은 수행하지 않았다. 기존 Dialog markup과 header 구현을 유지한다.
- Archify visual-check 최종 결과: `pass`, diagnostics `0건`
- containment: 1440×900·1600×1000·1920×1080·2048×1320 모두 가로·세로 overflow `false`
- readability: 모든 viewport 통과, 최소 요구값 6px 이상이며 receipt상 최소 projected node text는 7px
- viewer chrome: navigation dock과 stage 사이 요구 간격 충족, 충돌 `0건`
- artifact SHA-256 `a23ebd2219cda3bad5deccc3461e7d6522cfc90d5e34d6d4dffd5469817f49d3`에 바인딩된 visual-check receipt와 1440×900 light/dark·2048×1320 light/dark 네 screenshot을 `view_image`로 다시 검토했다. node 관통, 관계선 충돌, label 잘림·겹침이 보이지 않았고 공통·값·화면/로직 세 분기, 검증 통과, 패리티 누락→감사→수동 이식→재검증 경로가 색과 label로 구분된다.
- visual-check PNG·contact sheet·JSON receipt와 production capture는 로컬 검증 증거로만 유지하도록 app `.gitignore`에 등록했다. 절대 로컬 path가 들어가는 receipt나 캡처가 `public` 배포물에 포함되지 않으며, 최종 standalone HTML은 ignore 대상이 아니다.
- port 1104의 호텔·블랙스톤 route는 각각 HTTP `200`; 호텔에는 기존 `크게 보기`와 `Archify로 보기`가 있고 블랙스톤에는 Archify action이 없다. listener는 기존 Node PID `46911`로 보존됐다.

### 검증 실패에서 얻은 교훈

- 문제: 여러 프로젝트를 빠르게 순회하는 responsive E2E에서 제목과 action locator는 각각 1개였지만 `boundingBox()`가 간헐적으로 `null`을 반환했다.
- 원인: 아래쪽 card의 layout이 측정 가능한 상태인지 기다리지 않고 곧바로 좌표를 읽은 테스트 동기화 문제였다. 개별 route를 다시 확인했을 때 실제 요소 누락이나 겹침은 재현되지 않았다.
- 수정: 각 card를 viewport로 이동하고 제목과 action이 visible 상태가 될 때까지 조건 기반으로 기다린 뒤 좌표를 측정한다.
- 예방: geometry E2E는 locator 존재만으로 준비 상태를 판단하지 않고, 측정 대상의 visible/layout 조건을 먼저 확인한다.
- Archify visual-check 첫 실행은 Chrome inspection timeout으로 캡처 전 종료됐고, 재실행에서는 캡처가 완료돼 실제 진단이 가능했다.
- visual-check가 드러낸 문제: source가 원본의 `플랫폼 확장` lane을 `rsConfig`와 `platform`으로 나눠 5개 lane이 되었고, 그 결과 1440×900~2048×1320에서 세로 overflow가 발생했다.
- 최종 보정 원칙: 원본 node·edge·문구는 유지하되, 세부 코드 ownership은 node 이름으로 보존하고 Archify lane은 `코드 경계` 한 band로 압축해 화면 수용성과 읽기 기준을 동시에 충족한다.

## 최종 검증

- `pnpm exec tsc --noEmit`: exit `0`
- reviewer 보완 TDD RED: exact JSON parity 검사 추가 뒤 기존 semantic type 집합과 기대값 `frontend` 불일치로 `feature-detail-quality` test `1/81` 실패를 확인했다.
- reviewer 보완 GREEN: Archify source의 10개 node type을 `frontend`로 정정하고 exact lane·node·순서·mapping·type·sublabel·edge·수량 계약과 URL query/hash/protocol-relative/traversal/encoded separator/empty segment 거부를 포함한 `feature-detail-quality` test `88/88`이 통과했다.
- targeted Vitest (`feature-detail-quality`, `project-detail-rendering`): test file `2/2`, test `111/111` 통과
- full Vitest: test file `7/7`, test `308/308` 통과
- scoped ESLint: 첫 실행에서 변경 파일 3곳의 Prettier 줄바꿈만 지적됐다. 해당 줄만 `apply_patch`로 맞춘 뒤 동일 7개 TS/TSX/test 경로가 exit `0`; 저장소 전역 lint나 관련 없는 파일 포맷은 실행하지 않았다.
- `pnpm run build`: Next.js production build와 38개 static page 생성 통과. root lockfile 추론 경고는 기존 monorepo baseline이며 build 실패가 아니다.
- reviewer 보완 뒤 별도 production server를 port `12113`에 다시 실행해 기존 1104 PID `46911`을 보존했다.
- production E2E 3종 (`swimlane-viewer`, `hotel-reservation-platform`, `portfolio-insight-contract`): fresh 실행 `47/47` 통과
- production capture: `apps/front/test-results/feature-011/`에 original card 320·1440px와 standalone viewer 1440×900·1920×1080을 저장했다.
- capture 직접 검토: 원본 card는 기존 React 미리보기·두 action·요약·예외를 유지하며, locator가 viewport보다 긴 card를 stitching할 때 sticky site header가 중간에 합성되는 것은 캡처 방식의 특성이다. standalone viewer는 두 해상도 모두 한 화면에 들어오고 node·label·arrow 잘림이나 겹침이 없다.
- 임시 Playwright config는 `apply_patch`로 삭제했고 소유한 production PID만 종료했다. port 12113은 해제됐으며 사용자 소유 1104 listener는 PID `46911`로 유지된다.
- `git diff --check`: exit `0`
- `mise run e2e:changed`: staged app 변경이 없어 의도대로 evidence stamp 없이 skip했다. dirty shared worktree를 stage해 우회하지 않았다.
- `mise run feature:status:sync`: 현재 root mise에 해당 task가 등록되어 있지 않아 `no task //:feature:status:sync found`로 실행 불가. 저장소 안에도 동등한 script가 없으며 기존 harness baseline을 Feature 011 범위에서 수정하지 않는다.
- Vitest의 Vite native config loader 경고는 기존 baseline이며 실패가 아니다.

## 독립 코드 리뷰

- 1차 리뷰의 Important 2건과 Minor 2건 중 구현 관련 4건을 모두 보완했다.
- exact JSON parity와 4개 canonical lane→3개 presentation band mapping을 test·data model·artifact contract에 고정했다.
- Archify component에 지원하지 않는 backend/security/cloud 의미를 제거하고 모든 node를 표현 목적의 `frontend` type으로 통일했다.
- 안전 경로 거부 사례를 query, fragment, protocol-relative URL, traversal, encoded separator와 empty segment까지 확장했다.
- 1차 재리뷰에서 코드·artifact의 추가 Critical/Important는 없었고, stale receipt·test 수치와 완료 상태 갱신만 남은 것으로 확인됐다. 이 문서에 현재 hash·byte·test·이미지 근거를 반영한 뒤 다시 검토받았다.
- 최종 독립 리뷰: **Critical 0 / Important 0 / Minor 0 / Ready to merge: Yes**. 현재 source·HTML hash와 byte, artifact-bound screenshot 검토, targeted `111/111`, full `308/308`, Complete·T035·Converged·ROADMAP 상태가 모두 일치함을 확인했다.

## 최종 수렴

`speckit-converge` 기준으로 spec·plan·research·data model·contracts·tasks·verification과 실제 구현을 교차 점검했다.

- Functional Requirements: 32개 추적 완료
- Success Criteria: 11개 추적 완료
- Acceptance Scenarios: 16개 추적 완료
- Edge Cases: 10개 추적 완료
- Research Decisions: 10개 구현·검증 상태와 일치
- Constitution Principles: 5개 모두 PASS
- 미완료 task 및 checklist: 0개
- missing·partial·contradicts·unrequested finding: 각각 0개

**결과: ✅ Converged — the implementation satisfies the spec, plan, and tasks.**

## 잔여 위험

- Archify Viewer의 고정 UI 언어와 generated HTML의 `lang="en"` fallback은 제작 도구 경계이며, authored 한국어 node·edge content는 보존된다.
- 기존 React의 canonical 4개 lane과 Archify의 3개 presentation band는 동일한 10개 node·12개 edge를 표현하기 위한 의도적 시각 매핑이다. exact parity test와 문서 계약이 이 차이를 고정한다.
- `mise run feature:status:sync` task가 현재 root mise에 없어 자동 상태 동기화는 실행할 수 없다. 구현·검증 결과와 `tasks.md`를 수동으로 일치시키며 harness baseline은 이 feature에서 변경하지 않는다.
