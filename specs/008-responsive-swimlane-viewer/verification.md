# Verification: 반응형 스윔레인 뷰어

**Date**: 2026-09-01

## 범위

구조화 작업물 4개에 있는 스윔레인 6개의 공개 데이터와 문구를 유지하면서 공통
뷰어를 다음 계약으로 변경했다.

- 본문 미리보기와 페이지에 가로 스크롤을 만들지 않는다.
- 명시적인 `크게 보기` 버튼으로 같은 데이터를 Dialog에서 제공한다.
- 상·하·좌·우 변을 사용하는 둥근 직교선, 2px 선, 6px 화살촉과 최대 8px 곡률을
  사용하고 도착점에 포트·점·halo를 만들지 않는다.
- 긴 한글 라벨을 여러 줄 pill로 표시하고 다이어그램 경계 안에 둔다.
- 보이는 전체 흐름 설명, 예외 대응, 고유한 접근 이름과 focus 복귀를 유지한다.

작업물 본문과 기존 스윔레인 입력 데이터는 변경하지 않았다.

## TDD Evidence

### 본문 맞춤 보기와 Dialog

- RED: 기존 scroll region의 `overflow-x-auto`, `role=region`, `tabIndex=0` 계약이
  no-scroll 미리보기 테스트와 충돌했고, `크게 보기` 버튼·Dialog·보기별 식별자가 없어
  렌더링 테스트가 실패했다.
- GREEN: scroll region을 제거하고 같은 `FeatureSwimlane`을 inline/Dialog 공통
  renderer에 전달했다. 클릭·tap·Enter·Space·Escape와 focus 복귀는 Playwright로
  검증했다.

### 연결선과 라벨 geometry

- RED: 기존 polyline, marker 비례, 도착 직선, layer 순서와 라벨 경계가 승인 계약을
  만족하지 못했다.
- GREEN: 상대 위치 기반 anchor, 명시 override, 직교점 정규화, 최대 8px 둥근 path,
  10px 이상 수직 도착 구간, 6px marker, 다중 행 CJK 라벨과 경계 clamp를 순수 함수로
  구현했다.
- 리뷰 보완 RED/GREEN: 180도 hairpin, 중간 node 관통, node 내부 waypoint와 긴 한글
  라벨 fixture를 추가해 실패를 확인한 뒤 dogleg·장애물 회피·공유 충돌 검증·다중 행
  측정으로 전환했다. 특히 unrelated step 내부 waypoint 테스트는 validator가 오류를
  반환하지 않는 RED에서 시작해 renderer와 같은 기하 계약으로 차단하는 GREEN이 됐다.

### 콘텐츠·접근성 회귀

- 구조화 작업물 4개·스윔레인 6개의 lane, step, edge, label, summary와 exception 전체
  필드를 정본 fixture로 고정했다.
- inline/Dialog의 title·description·marker ID, 접근 이름, summary 연결, 정적 도형의
  tab stop 0개와 normal/exception 실선·점선 구분을 검사했다.

## Final Verification

검증은 2026-09-01에 최종 구현을 기준으로 새로 실행했다.

| 순서 | 명령 | 결과 |
| --- | --- | --- |
| 1. 타입 | `pnpm exec tsc --noEmit` | PASS — 오류 0건 |
| 2. 관련 테스트 | `pnpm vitest run src/components/projects/project-swimlane-layout.test.ts src/components/projects/project-detail-rendering.test.tsx src/data/portfolio/feature-detail-quality.test.ts` | PASS — 3 files, 107 tests |
| 3. 전체 테스트 | `pnpm vitest run` | PASS — 5 files, 203 tests |
| 4. 변경 범위 lint | `pnpm exec eslint <공통 뷰어·geometry·validator·관련 테스트·E2E>` | PASS — 오류·경고 0건 |
| 5. production build | `pnpm run build` | PASS — 38/38 static pages |
| 6. fresh production E2E | `pnpm exec playwright test --config=playwright.feature-008.prod.config.ts --reporter=line` | PASS — 별도 포트 12109, 72/72 tests |
| 7. 공백 | `git diff --check` | PASS |

키보드 E2E는 Enter와 Space를 각각 새 navigation에서 실행해 이전 Dialog의 animation
상태에 의존하지 않도록 독립 검증했다. 375px·1440px parity E2E는 모든 스윔레인에서
inline/Dialog lane·step·edge·label이 같고 SVG 라벨 text가 pill과 viewBox 경계 안에
있는지 실제 `getBBox()`로 확인했다.

`mise run e2e:changed`는 공유 worktree의 기존 unstaged/untracked 변경을 임의로 stage하지
않은 상태에서 실행됐고, 변경 증거 stamp 대상이 없어 skip됐다. 이 결과와 위 fresh
production E2E 72/72 증거를 구분했다.

## 화면 검사

- [모바일 Blackstone 스윔레인](../../apps/front/test-results/swimlane-viewer-mobile-approved.png):
  320px 카드 안에서 전체 흐름·요약·예외가 가로 넘침 없이 표시된다.
- [데스크톱 Harness 확대 Dialog](../../apps/front/test-results/swimlane-viewer-desktop-approved.png):
  1440×1000 화면에서 전체 스윔레인, 라벨, 화살촉과 요약을 한 번에 확인할 수 있다.

두 PNG를 원본 크기로 직접 검사해 가로 넘침, 화살촉 접선, 긴 라벨 잘림과 Dialog
가독성 문제 없음으로 판정했다.

## Review

`superpowers:requesting-code-review`로 독립 리뷰를 수행했다. 1차 리뷰의 Important 5건은
다음과 같았다.

1. 180도 방향 전환에서 hairpin이 생길 수 있음
2. edge가 연결 대상이 아닌 node를 통과할 수 있음
3. 한글 라벨의 단일 행 폭 추정으로 pill이 과도하게 넓어질 수 있음
4. 같은 페이지의 `크게 보기` 버튼 접근 이름이 구분되지 않음
5. 기존 4개 작업물·6개 스윔레인 정본 fixture가 전체 필드를 고정하지 않음

dogleg·장애물 회피, 다중 행 CJK 측정, 제목이 포함된 버튼 접근 이름과 full-field
fixture로 해소했다. 재리뷰에서 validator와 renderer의 node 충돌 규칙 차이 1건을
추가로 발견해 `swimlane-geometry.ts`의 node 크기·격자·여백·충돌 함수를 공유하고
회귀 테스트를 추가했다.

최종 독립 리뷰 결과는 Critical 0건, Important 0건, Minor 0건, Ready다.

## Convergence

`speckit-converge` 기준으로 FR 24개, SC 10개, 사용자 수용 시나리오, 계획·데이터
모델·UI 계약과 현재 코드·테스트를 대조했다. 리뷰 보완에서 도입한 공유 기하 계약을
plan·research·data-model·contract·quickstart에 동기화했다. missing, partial,
contradicts, unrequested finding은 모두 0건이며 추가 task 없이 `Converged`다.

## 환경 정리와 보존

- `mise run feature:status:sync`는 등록된 task가 없어 실행되지 않았다. 자동 전이를
  주장하지 않고 spec 상태와 `ROADMAP.md`의 feature 008 완료 항목을 수동으로 맞췄다.
- 포트 12109의 소유한 production process를 종료했고 listener가 남지 않았다.
- 임시 `playwright.feature-008.prod.config.ts`, screenshot spec과 `.last-run.json`을
  삭제했으며 승인 PNG 2장만 보존했다.
- 기존 포트 1104 listener PID 72370과 `apps/front/.next/dev/lock`을 그대로 보존했다.
- 관련 없는 파일을 포맷하거나 기존 사용자 변경을 stage하지 않았다.

## 2026-09-01 후속 가독성 구현 검증

고정 viewBox 축소를 제거하고 실제 inline/Dialog 컨테이너 폭을 각각 측정하는 layout으로
전환했다. 252·307·684·766.7px 순수 layout과 320·375·768·1024·1440px 실제 화면에서
노드 문구와 edge label을 다시 계산한다.

### TDD와 브라우저 회귀

- RED: compact SSR에서 SSO의 `provider-cache-fallback` 경로 중앙이 오른쪽 경계에 붙어
  3줄 label도 배치할 수 없었고 해당 작업물의 스윔레인 전체가 렌더링되지 않았다.
- GREEN: 같은 오른쪽 anchor를 쓰는 경로가 노드 바깥의 최소 side channel을 사용하도록
  라우팅했다. label의 x는 rounded path 누적 길이 50% 지점에 그대로 두고, 경로 자체가
  compact 경계 안쪽에 형성되도록 했다.
- Vitest는 1줄→2줄→3줄→오류, `0/-1/+1/-2/+2` 최소 빈 track, explicit label 고정,
  Blackstone 4개 label 충돌 0건과 SSO 오른쪽 예외 경계 회귀를 포함한다.
- 기존 포트 1104 listener를 재사용한 개발 환경 E2E에서 4개 작업물·6개 스윔레인의
  inline/Dialog를 5개 viewport로 검사해 14/14가 통과했다. 실제 `getBBox()` 기준 node
  text overflow, label-label·label-node·label-boundary 충돌은 모두 0건이었다.

### T047 정적 검증

| 순서 | 명령 | 결과 |
| --- | --- | --- |
| 1. 타입 | `pnpm exec tsc --noEmit` | PASS — 오류 0건 |
| 2. 관련 테스트 | `pnpm exec vitest run <layout·responsive·rendering·quality 4 files>` | PASS — 4 files, 128 tests |
| 3. 전체 테스트 | `pnpm exec vitest run` | PASS — 6 files, 224 tests |
| 4. 변경 범위 lint | `pnpm exec eslint <후속 변경 TS/TSX 8 files>` | PASS — 오류·경고 0건 |
| 5. production build | `pnpm run build` | PASS — 38/38 static pages |
| 6. 공백 | `git diff --check` | PASS |

### T048 production E2E

- 기존 dev 서버와 분리된 포트 12110에서 `next start`를 실행했다.
- `pnpm exec playwright test --config=playwright.feature-008.prod.config.ts --reporter=line`:
  PASS — 5 files, 75 tests.
- 실행 전후 포트 1104 listener PID 67331과 `.next/dev/lock`을 그대로 확인했다.

### T049 화면 검사

- [Blackstone 320px inline](../../apps/front/test-results/feature-008-followup-blackstone-mobile-inline.png)
- [Blackstone 1440px Dialog](../../apps/front/test-results/feature-008-followup-blackstone-desktop-dialog.png)
- [Hanmaum 320px inline](../../apps/front/test-results/feature-008-followup-hanmaum-mobile-inline.png)
- [Hanmaum 1440px Dialog](../../apps/front/test-results/feature-008-followup-hanmaum-desktop-dialog.png)

네 이미지를 원본 크기로 직접 확인했다. 모바일에서는 10px 글자를 축소하지 않고 좁은
lane 안에서 node 높이를 늘려 줄바꿈하며, 상세 판독은 같은 카드의 Dialog가 보완한다.
edge label은 rounded path 중앙 x를 유지하고 필요할 때 위·아래 track 또는 2~3줄을
사용한다. 모바일과 Dialog 모두 label-label·label-node 겹침, 경계 잘림, 화살촉 파손과
가로 스크롤이 보이지 않았다.

### T050 환경 정리

- 소유한 포트 12110 production process를 종료해 listener가 없음을 확인했다.
- 임시 `playwright.feature-008.prod.config.ts`, 캡처용 spec과 `.last-run.json`을
  삭제했고 위 승인 PNG 4장만 남겼다.
- 기존 포트 1104 listener PID 67331과 `apps/front/.next/dev/lock`은 그대로 보존했다.

### T051 독립 리뷰와 보완

독립 리뷰 1차 결과는 Critical 0건, Important 1건이었다. 반응형 renderer가 쓰는 일부
compact 경로에서 둥근 마지막 corner가 도착 직선을 소모해 FR-013의 표시 직선 10px를
지키지 못했다. `ambiguity-return` 252px 사례는 약 0.775px로 재현됐다.

모든 반응형 routing 분기를 공통 도착 finalizer로 통과시키고, target 변 수직 진입과
최소 10px raw segment를 보장했다. SVG path와 rounded path midpoint 계산은 같은 corner
radius 함수를 사용하며, 마지막 radius는 표시 직선 10px를 침범하지 않게 제한했다.
상·하·좌·우 anchor와 4개 작업물의 모든 edge를 252·307·684·766.7px에서 고정한 회귀
테스트를 추가했다.

보완 후 결과는 관련 60 tests, 전체 224 tests, dev E2E 14/14, production E2E 75/75,
38/38 static build가 PASS다. 승인 PNG 4장도 새 build로 다시 캡처해 원본 크기로 확인했다.
재리뷰 결과는 Critical 0건, Important 0건, Ready다. punctuation 우선 줄바꿈과 직접적인
`ResizeObserver` lifecycle 단위 테스트는 현재 실제 콘텐츠·production E2E 계약을
깨뜨리지 않는 Minor 2건으로 기록하고 이번 승인 범위에는 추가하지 않았다.

### T052 최종 수렴과 상태

31개 FR, 15개 SC, 21개 사용자 수용 시나리오와 5개 헌법 원칙을 현재 구현·테스트·화면
증거에 대조했다. missing, partial, contradicts, unrequested finding은 모두 0건이며 새
Convergence task를 추가하지 않았다. **✅ Converged — the implementation satisfies the
spec, plan, and tasks.**

`mise run feature:status:sync`는 저장소에 해당 task가 없어 실행되지 않았다. 자동 상태
전이를 주장하지 않고 `tasks.md` 체크 상태와 `ROADMAP.md`의 완료 설명을 수동으로
동기화했다.

저장소 전역 lint는 기존 baseline 때문에 실행하지 않았고, 이번 후속 구현 파일만
Prettier와 ESLint 대상으로 제한했다. Next.js의 복수 lockfile workspace root 경고와
Vitest의 향후 config loader 변경 안내는 기존 환경 경고이며 결과에는 영향을 주지 않았다.

## Residual Risk

- 320px 본문 미리보기는 전체 구조 우선이라 세부 글자가 작다. 같은 카드의 명시적
  `크게 보기`와 보이는 전체 흐름 설명이 읽기 경로를 보완한다.
- Next.js는 저장소 루트의 복수 lockfile로 workspace root 추론 경고를 출력한다.
  build·route 생성·E2E에는 영향을 주지 않았으며 이번 feature 범위에서 lockfile을
  삭제하거나 루트 설정을 바꾸지 않았다.
- Vitest는 향후 Vite `configLoader: native` 기본값 변경 안내를 출력한다. 현재 전체
  203개 테스트는 통과하며 이번 feature에서 설정을 변경하지 않았다.

## 2026-09-01 사용자 화면 피드백 경로 회귀 보완

### 원인과 RED

기존 상·하 anchor 특수 분기는 두 node 사이 장애물을 찾을 때 가로 범위만 비교했다.
그 결과 아래쪽 두 node를 잇는 edge가 훨씬 위쪽 node를 장애물로 오인했고, 특수 분기의
경로가 공통 obstacle 검사를 거치지 않아 비연결 node와 문구를 관통했다.

- 순수 layout RED: `codi-harness-dx-platform/cicd-secrets-deployment/target-secrets/252px`가
  y=610.47에서 y=254로 역주행하며 `quality` node를 통과했다.
- 브라우저 RED: 기존 1440px 공통 뷰어 검사에서 `/projects/codi-harness-dx-platform`의
  `edgeNodeCollisions`가 1건으로 재현됐다.

### 구현과 GREEN

- 장애물 후보를 source exit와 target approach 사이의 실제 세로 구간에 걸치는 node로
  제한했다.
- 장애물의 위·아래 빈 통로 후보 중 진행 구간 안에서 길이와 교차 비용이 가장 작은
  직교 경로를 선택하고, 상·하·같은 측면 특수 분기도 공통 obstacle 검사를 거치게 했다.
- 정상적인 짧은 경로로 복귀하면서 인접 분기 label이 몰린 구간만 필요한 만큼 row gap을
  늘렸다. 다른 row와 lane/node/edge 데이터는 변경하지 않았다.
- renderer에 `data-edge-from`과 `data-edge-to`를 추가하고 Playwright가 실제 SVG path를
  1 geometry 단위로 따라가며 source·target 이외 node fill과의 교차를 검사한다.

### 검증 결과

| 검증 | 결과 |
| --- | --- |
| 신규 순수 geometry 회귀 | PASS — 실제 4개 작업물·6개 스윔레인, 252·307·684·766.7px |
| 관련 Vitest | PASS — 4 files, 129 tests |
| 전체 Vitest | PASS — 6 files, 225 tests |
| TypeScript | PASS — 오류 0건 |
| 변경 파일 ESLint | PASS — 오류·경고 0건 |
| production build | PASS — 38/38 static pages |
| dev 공통 스윔레인 E2E | PASS — 14/14 |
| 별도 포트 production 전체 E2E | PASS — 75/75 |
| `git diff --check` | PASS |

새 production build를 포트 12111에서 실행해 다음 화면을 원본 크기로 직접 확인했다.

- [Blackstone 320px inline](../../apps/front/test-results/feature-008-followup-blackstone-mobile-inline.png)
- [Blackstone 1440px inline](../../apps/front/test-results/feature-008-followup-blackstone-desktop-inline.png)
- [Blackstone 1440px Dialog](../../apps/front/test-results/feature-008-followup-blackstone-desktop-dialog.png)
- [Hanmaum 320px inline](../../apps/front/test-results/feature-008-followup-hanmaum-mobile-inline.png)
- [Hanmaum 1440px Dialog](../../apps/front/test-results/feature-008-followup-hanmaum-desktop-dialog.png)

Blackstone의 정상·세 예외 경로와 Hanmaum의 정상·재실행 경로가 가까운 행 사이에서
연결되며 비연결 node와 node 문구를 통과하지 않는다. 모바일에서도 기존 lane 열과 전체
문구, 가로 overflow 0px 계약을 유지한다.

### 수렴과 환경 정리

32개 FR, 16개 SC, 22개 acceptance scenario, 13개 research 결정과 5개 헌법 원칙을
현재 코드·테스트·화면 증거에 대조했다. missing, partial, contradicts, unrequested finding은
모두 0건이다. **✅ Converged — the implementation satisfies the spec, plan, and tasks.**

소유한 포트 12111 production process, 임시 Playwright config, 임시 debug PNG와
`.last-run.json`을 삭제했다. 포트 12111은 해제됐고 기존 포트 1104 listener PID 62284와
`apps/front/.next/dev/lock`은 보존했다. `mise run feature:status:sync`는 저장소에 해당
task가 없어 실행되지 않았으며 자동 상태 전이를 주장하지 않는다.

## 2026-09-01 결과 분기 대응 관계 보완

### 승인 방향과 RED

사용자는 Harness의 `배포 중단`으로 들어오는 두 예외선의 도착 변을 교환하고,
Blackstone 결제 결과 네 분기를 왼쪽→오른쪽 순서의 높이로 구분하되 더 자연스러운 공통
규칙이 있으면 이를 적용하도록 승인했다.

- Harness fixture RED: `quality-stop`이 기존 `top`, `secrets-stop`이 기존 `right`라 승인
  방향 `right`·`top`과 불일치했다.
- Blackstone geometry RED: 252·307·684·766.7px 모두 세 cross-lane 분기가 같은 수평
  통로를 사용해 네 폭에서 각각 실패했다.
- 총 5개 RED를 확인한 뒤 구현을 시작했다.

### 구현과 화면 결과

- Harness의 `quality-stop`은 `배포 중단` 오른쪽 변, `secrets-stop`은 위쪽 변으로
  도착하게 교환했다. 오른쪽 변 도착에서 hairpin을 만들던 `quality-stop` 수동 waypoint는
  제거해 자동 직교 경로가 짧게 진입하도록 했다.
- 공통 라우터는 같은 source·같은 target 행의 세 개 이상 상·하 분기를 target x 순서로
  정렬하고 공통 진행 구간에 서로 다른 우선 수평 통로를 배정한다.
- 같은 x의 target은 순서 계산에는 포함하지만 인위적인 dogleg 없이 수직 직선으로
  연결한다. 우선 통로가 node와 충돌하면 기존 obstacle-safe 후보로 폴백한다.
- label은 변경하지 않고 각 rounded path의 50% 기본 위치와 기존 충돌 resolver를 계속
  사용한다.

실제 포트 1104 화면을 원본 크기로 확인했다.

- [Harness CI/CD·시크릿·배포 inline](../../apps/front/test-results/feature-008-branch-clarity-harness-desktop-inline.png)
- [Blackstone 결제·보상취소 inline](../../apps/front/test-results/feature-008-branch-clarity-blackstone-desktop-inline.png)

Harness 품질 실패선은 hairpin 없이 오른쪽 변으로, 시크릿 불일치선은 위쪽 변으로
구분된다. Blackstone은 완료 분기가 가장 위 통로, 보상취소와 조기 실패가 순서대로 아래
통로를 사용하며, 가운데 PMS 장애는 판단 node에서 결과 node까지 수직으로 직접 이어진다.

### 검증 결과

| 검증 | 결과 |
| --- | --- |
| 신규 RED | PASS — Harness 1건 + Blackstone 4개 폭, 총 5개 실패 확인 |
| focused layout GREEN | PASS — 48/48 tests |
| 관련 Vitest | PASS — 4 files, 134/134 tests |
| 전체 Vitest | PASS — 6 files, 230/230 tests |
| TypeScript | PASS — 오류 0건 |
| 변경 파일 ESLint | PASS — 오류·경고 0건 |
| production build | PASS — 38/38 static pages |
| 별도 포트 production 전체 E2E | PASS — 75/75 tests, port 12112 |
| `git diff --check` | PASS |

Next.js의 복수 lockfile workspace root 경고와 Vitest의 향후 native config loader 안내는
기존 환경 경고이며 검증 결과에는 영향을 주지 않았다. production E2E 중 기존 404 경로
검사에서 출력된 `NoFallbackError`도 해당 테스트가 통과한 기존 서버 로그다.

### 수렴과 환경 정리

33개 FR, 17개 SC, 23개 acceptance scenario, 14개 research 결정과 5개 헌법 원칙을
현재 구현·테스트·화면 증거에 대조했다. missing, partial, contradicts, unrequested finding은
모두 0건이다. **✅ Converged — the implementation satisfies the spec, plan, and tasks.**

소유한 임시 `playwright.feature-008.prod.config.ts`, root debug PNG와 `.last-run.json`을
삭제했고 포트 12112가 해제된 것을 확인했다. 기존 포트 1104 listener PID 62284와
`.next/dev/lock`은 보존했다. `mise run feature:status:sync`는 저장소에 해당 task가 없어
실행되지 않았으며 자동 상태 전이를 주장하지 않는다.

## 2026-09-02 Harness 시크릿 예외선의 아래쪽 도착 보완

### RED와 원인

사용자 화면 검토에서 `시크릿 조회 → 배포 중단` 예외선이 위쪽 변으로 들어오며 node
윤곽과 제목을 가리는 문제가 확인됐다.

- 승인 방향을 `bottom`으로 바꾼 anchor·데이터 fixture 테스트 3건이 기존 `top` 값 때문에
  RED가 되는 것을 먼저 확인했다.
- anchor만 변경한 실제 화면에서는 선이 target 중앙을 가로지른 뒤 아래로 돌아왔다.
- 마지막 도착 segment 전에는 target 내부를 통과하지 않아야 한다는 geometry 테스트를
  추가했고 기존 경로에서 RED를 확인했다.

### 구현과 범위 제한

- `secrets-stop.toAnchor`를 `bottom`으로 변경했다.
- source와 target이 같은 행이고 left/right에서 출발해 top/bottom으로 도착하는 경우에만
  source 쪽에서 target approach y로 먼저 이동한 뒤 target 바깥을 지나 지정 변으로
  진입하도록 공통 라우터를 보완했다.
- 첫 구현은 서로 다른 행에도 적용돼 기존 실제 작업물 테스트 3건을 깨뜨렸고, 조건을
  same-row로 제한해 회귀를 제거했다.

최종 화면에서는 `불일치` 선이 `배포 중단` 아래를 지나 아래쪽 변으로 올라오며 node
제목과 윤곽을 가리지 않는다.

- [Harness 시크릿 불일치 bottom anchor](../../apps/front/test-results/feature-008-harness-secrets-bottom-anchor.png)

### 검증 결과와 정리

| 검증 | 결과 |
| --- | --- |
| anchor·fixture RED | PASS — 3개 실패 확인 |
| target 내부 교차 RED | PASS — 1개 실패 확인 |
| focused Vitest | PASS — 2 files, 117/117 tests |
| 전체 Vitest | PASS — 6 files, 231/231 tests |
| TypeScript | PASS — 오류 0건 |
| 변경 파일 ESLint | PASS — 오류·경고 0건 |
| production build | PASS — 38/38 static pages |
| 별도 포트 production E2E | PASS — 75/75 tests, port 12113 |
| 실제 1104 화면 검사 | PASS — node 제목·윤곽 가림 0건 |
| `git diff --check` | PASS |

34개 FR, 18개 SC, 24개 acceptance scenario, 15개 research 결정과 5개 헌법 원칙을
현재 구현·테스트·화면 증거에 대조했고 잔여 finding은 0건이다.
**✅ Converged — the implementation satisfies the spec, plan, and tasks.**

임시 production Playwright config와 `.last-run.json`을 삭제하고 포트 12113 해제를
확인했다. 기존 포트 1104 listener PID 62284와 `.next/dev/lock`은 보존했다.
`mise run feature:status:sync`는 저장소에 해당 task가 없어 실행되지 않았으며 자동 상태
전이를 주장하지 않는다.
