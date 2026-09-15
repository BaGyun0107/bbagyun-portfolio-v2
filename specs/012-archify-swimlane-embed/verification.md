# Verification: Archify 스윔레인 임베드 전환

**Date**: 2026-09-10

## Scope and Baseline

- Size: Large
- Branch: chore/cleanup-downstream-harness
- Frontend-only target: apps/front
- Existing user dev server: port 1104, PID 46911, target page HTTP 200
- Shared worktree is dirty with user-owned changes; unrelated files are not formatted, staged, deleted or reset.
- Repository-wide lint has a known baseline. Feature verification uses only changed TypeScript/TSX/test files.
- Checklist gate: requirements.md 16/16 checked, 0 unchecked, PASS
- Spec Kit extension hooks: none

## Frozen Archify Evidence

| Artifact | SHA-256 | Bytes |
| --- | --- | ---: |
| diagrams/hotel-reservation-platform/platform-change-verification-deployment.json | b5472af8952722b9b5fea87fc930f2c5880634ff8da5f17f16c6aaa4f819c419 | 4,355 |
| public/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html | a23ebd2219cda3bad5deccc3461e7d6522cfc90d5e34d6d4dffd5469817f49d3 | 714,531 |

- Semantic source: node 10개, edge 12개
- Feature 012는 두 artifact를 직접 수정하거나 재생성하지 않는다.

## Pre-implementation Baseline

| Check | Command | Result |
| --- | --- | --- |
| Target Vitest | pnpm exec vitest run src/data/portfolio/feature-detail-quality.test.ts src/components/projects/project-detail-rendering.test.tsx | PASS — 2 files, 111 tests |
| TypeScript | pnpm exec tsc --noEmit | PASS |

Vitest는 Vite native config loader의 향후 변경 안내 warning을 출력했지만 테스트 실패는 아니다.

## TDD Evidence

### T004~T009: url-only metadata와 새 탭 제거

- RED: 대상 Vitest 4개 실패. 기존 validator가 label을 요구했고 데이터에 label이 남아 있었으며 ProjectSwimlane이 Archify 새 탭 anchor를 렌더링했다.
- GREEN: FeatureSwimlaneArchifyEmbed를 url-only로 변경하고 validator·호텔 데이터·새 탭 UI를 최소 수정했다.
- 결과: 2 files, 111 tests PASS. TypeScript PASS.

### T010~T018: MAP preview

- RED: 신규 adapter module 부재와 대상 preview wrapper 부재로 2개 경계가 실패했다.
- GREEN: preview idle→loading→ready, 240px root margin, same-origin DOM 검사, MAP, A1 theme bridge, 준비 전 React fallback과 표시 전 비노출을 구현했다.
- 결과: adapter/rendering 2 files, 27 tests PASS. TypeScript PASS.

### T019~T024: READ Dialog

- RED: 상세 초기 상태·READ 준비·즉시 iframe mount 3개가 실패했다.
- GREEN: Dialog mount 시 loading, READ density, same artifact URL, body inert, aria-hidden/tabIndex/pointer 차단과 allow-scripts 없는 sandbox를 구현했다.
- 결과: adapter/rendering 2 files, 30 tests PASS. TypeScript PASS.

### T025~T029: fallback

- RED: same-origin iframe preparation 경계가 없어 fallback 계약 1개가 실패했다.
- GREEN: load event adapter가 contentDocument 접근과 필수 diagram DOM을 검증하고 모든 실패와 5초 timeout을 fallback reducer로 수렴시킨다. timer·IntersectionObserver·theme MutationObserver cleanup을 소유 lifecycle에 배치했다.
- 결과: adapter/rendering 2 files, 31 tests PASS. TypeScript PASS.

### T030~T032: provenance와 범위

- JSON SHA-256/4,355 bytes와 HTML SHA-256/714,531 bytes가 Feature 011 기록과 일치한다.
- node 10개, edge 12개와 verify-audit security, port-reverify dashed의 ID·방향·variant를 자동 검사한다.
- 대상 외 Archify metadata 0건, 공개 본문·연결 인사이트의 Archify 제작 문구 노출 0건이다.
- 동결 JSON·HTML의 git diff는 0건이다.
- 결과: 3 files, 120 tests PASS.

### T033~T036: production browser 계약 작성

- 기존 React SVG 동일성 검사는 비대상 7개 흐름으로 한정하고 호텔 파일럿은 별도의 실제 iframe 계약으로 분리했다.
- preview lazy MAP, Dialog on-demand READ, 동일 URL, 새 탭 action 부재, viewer 상호작용 차단, reload 없는 theme bridge, 4개 viewport 반응형, malformed DOM fallback과 비대상 회귀를 추가했다.
- `pnpm --dir apps/front exec playwright test e2e/swimlane-viewer.spec.ts --list`: PASS — 1 file, 22 tests collected. 실제 production 실행 결과는 T041에 기록한다.

### T037: 표시 분기 정리

- preview/Dialog에 중복됐던 Archify 선택과 React fallback 생성을 `SwimlaneVisual` 경계로 합쳤다. Dialog subtree 내부 mount 시점은 유지한다.
- 대상 Vitest 3 files, 120 tests PASS. TypeScript PASS.

### T038~T039: frontend regression과 scoped lint

| Check | Result |
| --- | --- |
| `pnpm --dir apps/front exec tsc --noEmit` | PASS |
| `pnpm --dir apps/front test` | PASS — 최종 8 files, 318 tests |
| 변경 TS/TSX/test 9개 파일 scoped ESLint | PASS — 0 errors, 0 warnings |

- 포맷은 lint가 지적한 Feature 012 파일 4개에만 적용했다. 저장소 전역 lint와 관련 없는 파일 포맷은 실행하지 않았다.
- Vitest의 Vite native config loader 안내는 기존 warning이며 실패가 아니다.

### T040: production build

- `pnpm --dir apps/front build`: PASS — Next.js 16.1.6, 38개 정적/동적 route 생성 완료.
- `package.json`과 lockfile에 Archify 제작 도구 또는 신규 dependency를 추가하지 않았다. 생성된 동결 HTML은 정적 public artifact로만 포함된다.
- Next.js가 저장소 root의 기존 복수 lockfile을 감지했다는 warning은 build 실패가 아니다.

## Lessons

### 2026-09-10: Frontend testing - 제거 대상 selector의 범위를 페이지 전체 속성으로 확대하지 않는다

- **Problem**: Archify 새 탭 제거 GREEN 검사에서 페이지의 기존 외부 인사이트 링크까지 target="_blank"로 감지해 1개 테스트가 실패했다.
- **Root Cause**: 제거하려는 Archify anchor가 아니라 전체 render output의 일반 속성을 부정했다.
- **Fix Applied**: 동결 Archify URL을 가진 anchor의 부재를 직접 검사하도록 assertion 범위를 좁혔다.
- **Prevention**: 제거 회귀 테스트는 대상 URL·role·data attribute처럼 제품 경계를 특정하고, 공유 페이지의 정상적인 다른 링크 속성을 금지하지 않는다.

### 2026-09-10: Frontend testing - DOM 경계 test double은 의도적인 최소 타입임을 명시한다

- **Problem**: fallback Vitest는 통과했지만 contentDocument 접근 예외를 만드는 최소 iframe fixture가 TS2352로 typecheck를 실패했다.
- **Root Cause**: 브라우저 경계의 특정 getter만 필요한 test double을 완전한 HTMLIFrameElement처럼 직접 단언했다.
- **Fix Applied**: test-only fixture를 unknown 경유로 단언해 의도적인 부분 구현임을 타입 시스템에 명시했다.
- **Prevention**: 실제 DOM 객체 전체를 만들 수 없는 순수 경계 테스트는 필요한 side effect를 완전히 모사하되, 부분 double이라는 사실을 test code에서 명시한다.

## Browser and Visual Evidence

### T041: production E2E

- 기존 dev server: port 1104, PID 46911 유지.
- 별도 production server: port 12114에서 build artifact로 실행.
- `pnpm --dir apps/front exec playwright test e2e/swimlane-viewer.spec.ts --config=playwright.feature-012.prod.config.ts --reporter=line`: PASS — 최종 24/24.
- 검증 범위: preview lazy mount/MAP, Dialog on-demand/READ, 동일 source, Viewer control·포인터·키보드 비활성, reload 없는 light/dark token bridge, mouse/touch/keyboard Dialog, 320/768/1024/1440 overflow, malformed fallback, 비대상 React renderer.
- 최초 실행의 2건 실패는 제품 결함이 아니라 복수 SVG locator에 단일 strict matcher를 사용하고, ancestor `display:none`과 `body[inert]`를 무시한 focusable 계산이었다. 동결 HTML의 실제 CSS 계약인 context opacity와 inert/렌더 박스 기준으로 수정한 뒤 targeted와 full suite를 재확인했다.

### T042: visual review

- `/tmp/feature-012-preview-light.png`, `/tmp/feature-012-preview-dark.png`, `/tmp/feature-012-dialog-light.png`, `/tmp/feature-012-dialog-dark.png`를 original detail로 검토했다.
- preview: MAP에서 context·edge label이 제거되고 10개 node와 12개 edge topology, 검증 예외 점선이 카드 폭 안에 유지됐다.
- Dialog: READ context와 의미 있는 edge label이 복원됐고 node/edge/arrow clipping, label 겹침, 예외 경로 단절, Dialog close 겹침이 보이지 않았다.
- light/dark 모두 portfolio token이 적용됐으며 Viewer toolbar/search/export/theme/presentation chrome 노출은 없었다.
- 첫 preview 캡처의 상단 겹침은 sticky portfolio header가 locator 캡처 위에 놓인 촬영 조건이었다. 160px scroll offset으로 다시 캡처해 diagram 자체의 잘림이 아님을 확인했다.

### T043~T044: cleanup과 불변성

- 캡처용 임시 spec과 `apps/front/playwright.feature-012.prod.config.ts`를 apply_patch로 삭제했다.
- 소유한 12114 process를 종료해 listener 0건을 확인했고, 사용자 소유 1104 PID 46911은 유지했다.
- frozen JSON: SHA-256 `b5472af8952722b9b5fea87fc930f2c5880634ff8da5f17f16c6aaa4f819c419`, 4,355 bytes, node 10개, edge 12개.
- frozen HTML: SHA-256 `a23ebd2219cda3bad5deccc3461e7d6522cfc90d5e34d6d4dffd5469817f49d3`, 714,531 bytes.
- `git diff --check`: PASS.
- `mise run e2e:changed`: PASS with skip — 이 task는 staged diff만 판별하지만 현재 scope는 stage하지 않으므로 evidence stamp를 만들지 않았다. 대신 위 별도 production E2E 24/24를 직접 증거로 기록했다.

## Review and Convergence

### Independent code review

- 독립 reviewer 결과: Critical 0, Important 3, Minor 1, 최초 verdict `No`.
- Important — idle/loading React SVG가 ready Archify 비율로 급격히 줄어드는 layout shift: 최종 비율 placeholder를 idle/loading에 예약하고 실제 실패가 확정됐을 때만 React fallback을 표시하도록 수정했다. 지연 response E2E에서 loading/ready 높이 차이 1px 이하와 viewport 잔류를 확인했다.
- Important — fallback lifecycle 증거 부족: malformed DOM 외에 실제 iframe network abort와 5초 stalled response를 production E2E에 추가했다. same-origin access 예외는 helper test, reducer는 idle/loading/ready 실패 전이를 검사한다. observer는 공통 fail 경계에서 즉시 disconnect하고 ref를 비우도록 수정했다.
- Minor — theme 재적용 실패 시 observer 유지: 공통 `fail()` cleanup으로 해결했다.
- 보완 후 targeted Vitest 120/120, TypeScript, scoped ESLint, production build, production E2E 24/24가 통과했다.
- preview 가독성 정책은 사용자가 A로 확정했다. 작은 보기는 실제 Archify 10개 node·12개 edge 전체 topology의 무스크롤 구조 미리보기로 유지하고 좁은 화면의 문구 판독 책임은 `크게 보기`가 맡는다.
- 1차 follow-up review는 320px Dialog의 Archify READ 자체도 node 약 4px, context 약 3px여서 새 판독 책임을 충족하지 못한다고 Important 1건을 추가했다.
- 모바일·태블릿 Dialog에 기존 `FeatureSwimlane` 데이터를 사용하는 `SwimlaneDialogTranscript`를 추가했다. 10개 단계명·설명과 라벨이 있는 관계 6개를 14px 구조화 텍스트로 표시하고 `lg`(1024px) 이상에서는 숨긴다. 실제 Archify READ iframe은 그대로 유지한다.
- `feature-012-dialog-mobile-read.png`와 `feature-012-dialog-mobile-relationship.png`를 검토해 첫 단계부터 마지막 복구 관계까지 Dialog scroll 안에서 줄바꿈과 판독이 가능한 것을 확인했다.
- 최종 fresh evidence: Vitest 8 files 318/318, TypeScript PASS, scoped ESLint PASS, production build PASS, production E2E 24/24.
- 최종 독립 재리뷰: Critical 0, Important 0, `Ready to merge: Yes`. preview A 정책, 모바일 READ transcript, layout 안정성, 실제 network/timeout fallback과 observer cleanup이 모두 해소 상태임을 확인했다.

### Speckit convergence

- 검사 범위: FR 34개, SC 12개, acceptance scenario 16개, research/plan decision 12개, constitution principle 5개.
- findings: missing 0, partial 0, contradicts 0, unrequested 0; severity별 finding 0.
- `tasks.md`에 추가 convergence task를 만들지 않았다.
- 결과: **✅ Converged — the implementation satisfies the spec, plan, and tasks.**

### Feature status sync

- `mise run feature:status:sync`: FAIL — 이 저장소에 해당 mise task가 없다. available task 목록으로 부재를 확인했다.
- 자동 상태 전이 또는 `--apply`는 실행하지 않았다. `spec.md` 상태와 `ROADMAP.md` Completed 항목을 현재 검증 근거에 맞춰 수동으로 동기화했다.

### T048: final scope and completion sync

- 최종 breakpoint 보완 뒤 별도 production server에서 호텔 Archify 시나리오를 320·768·1024·1440px로 다시 실행해 4/4 PASS를 확인했다. 320px와 768px에서는 transcript가 표시되고 1024px와 1440px에서는 숨겨진다.
- `archify:` metadata 검색 결과는 `hotel-reservation-platform.ts`의 `platform-change-verification-deployment` 한 건뿐이다. 다른 스윔레인은 이번 기능에서 전환하지 않았으며 후속 확대는 별도의 사용자 승인과 기능 범위가 필요하다.
- 기존 port 1104 PID 46911은 유지했고 port 12114 listener는 0건이다. 임시 Playwright config와 검토 screenshot은 삭제했다.
- 동결 JSON·HTML의 SHA-256, byte count와 JSON node 10개·edge 12개를 다시 대조해 모두 기준값과 일치함을 확인했다.
- T001~T048은 모두 checked이고 최종 `tasks.md` SHA-256은 `3ff6fff62833d58411734c5740a74f1a79f76663d0bfd408c9b90e0505a5db6a`다.

## User-approved line legend follow-up

- 실제 embed theme에서는 Archify `default`·`emphasis`가 테마 기본색 실선으로, `security`·`dashed`가 예외색 점선으로 수렴한다. 사용하지 않는 조합의 의미를 새로 만들지 않고 `일반 진행·검증 통과`, `예외 발견·복구 및 재검증` 두 항목만 표시한다.
- 작은 보기와 `크게 보기`는 같은 React 범례를 공유한다. 동결 artifact는 수정하지 않았으며 색상만이 아니라 실선·점선과 문구를 함께 사용한다.
- 1024px 미만 Dialog transcript의 예외 관계 두 건에는 `예외·복구 흐름` 배지를 추가했다.
- TDD RED: `project-detail-rendering.test.tsx`의 범례와 transcript 표기 계약 2건이 누락 상태에서 실패했다. GREEN: focused Vitest 24/24 PASS.
- 후속 보정에서 `검증 통과` 선은 `a-emphasis`, 라벨은 `t-backend`를 사용해 색상 변수가 갈라진 원인을 확인했다. 강조 선의 edge ID와 같은 관계 라벨을 `var(--arrow-emphasis)`에 연결해 특정 문구나 ID를 하드코딩하지 않고 선·글씨 색상을 일치시켰다.
- 라벨 보정 TDD RED는 기존 라벨 `fill`이 `undefined`여서 1건 실패했고, 최소 수정 뒤 focused Vitest 9/9 PASS로 전환됐다. 실제 iframe에서도 기본·light·dark 상태마다 `검증 통과` 선의 computed `stroke`와 라벨의 computed `fill`이 같은 값임을 확인했다.
- Fresh verification: TypeScript PASS, 전체 Vitest 8 files 319/319 PASS, 변경 파일 scoped ESLint PASS, production build 38 routes PASS.
- 시스템 Chrome으로 기존 port 1104를 사용해 320·768·1024·1440px를 확인했다. 768·1024·1440px는 첫 실행에서 통과했고, dev server 초기 준비가 5초를 넘긴 320px은 같은 준비된 서버에서 재실행해 통과했다. 모든 폭에서 preview/Dialog 범례 2개, document/card/Dialog overflow 0과 모바일 예외 배지 2개를 확인했다.
