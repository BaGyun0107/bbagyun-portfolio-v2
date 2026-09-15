# Verification: 골프 예약 시스템 구조화 상세

**Date**: 2026-09-11

## Execution baseline

- Branch: `chore/cleanup-downstream-harness`
- Baseline commit: `3359935d28fce32c1df958fff5fd9b214d29305f`
- Worktree: 기존 사용자 변경이 다수 존재하는 shared dirty worktree. Feature 014 범위 밖 파일은 복구·포맷·stage하지 않는다.
- In-flight redirect: 사용자가 Feature 014를 명시적으로 시작했다. Feature 013의 T045, T047, T048은 미완료 상태로 별도 보존한다.
- Size: Large.
- Subagents: 2026-09-11 구현 시작과 함께 사용 승인됨. 콘텐츠/TDD, Archify artifact, browser QA 경계를 분리한다.
- Commit policy: 구현 단계에서는 stage, commit, push를 수행하지 않는다.

## 1104 baseline

| 확인 | 결과 | 근거 |
| --- | --- | --- |
| listener | supported | PID 46911의 Node process가 TCP `*:1104`를 점유 중이며 종료·재시작하지 않는다 |
| project route | supported | `GET /projects/the-siena-golf-reservation` HTTP 200 |
| insight route | supported | `GET /insights/logging-decoupling-and-buffering-in-external-api-systems` HTTP 200 |
| project rendering | supported | 현재 `features.ts`의 legacy `content`를 사용하는 기준선이며 구조화 detail과 예약 Archify artifact는 아직 없다 |
| insight rendering | supported | 현재 승인된 로그 분리 제목·본문·before/after visual과 원본 작업물 연결을 보존 대상으로 둔다 |

## Approved public-content checklist

| 항목 | 상태 | 근거 / 공개 경계 |
| --- | --- | --- |
| 첫 프로젝트 | supported | 2026-09-11 승인 인터뷰 |
| 최초 구축 책임 | supported | 정해진 구조 안에서 예약 화면, PHP 요청 처리, 외부 PMS 연동, 중복 방어, 통신 로그 기록을 FE/BE 범위 모두 단독으로 구현 |
| 아키텍처 역할 | supported | 전체 아키텍처·최초 구조 단독 설계 주장은 공개하지 않음 |
| 최초 구축 기간 | supported | 사용자 보고값 `2023.05 – 2023.06` |
| 현재 유지보수 | supported | 사용자 보고값 `2023년 오픈 – 현재`, 기준 `2026-09` |
| 로그 분리 시점 | supported | 정확한 날짜는 기억나지 않아 `운영 유지보수 과정`으로만 표현 |
| 로그 규모 | supported | 장애 조사 당시 DB GUI에서 직접 확인한 `수백만 건`; 정확한 전수 건수는 복원하지 않음 |
| 화면 중복 완화 | supported | 요청 즉시 버튼 비활성화·스피너 표시 |
| 서버 중복 완화 | supported | 동일 PHP 세션·같은 요청·2초 이내를 외부 PMS 호출 전에 차단 |
| 외부 장애 분기 | supported | 30초 timeout, PMS 5xx 재시도 안내, timeout 혼잡 안내 |
| 운영 결과 | supported | 직접 유지보수 범위의 통신 로그·접수 CS에서 동일 예약 중복 호출 이력과 관련 CS 미확인 |
| 결과 한계 | supported | 전체 예약 건수 분모, 비율, 중복률 0%, 전수·영구 보장으로 확대하지 않음 |
| 로그 문제 | supported | 예약 기능 자체 영향은 거의 없었고 장애 조사 시 당사 로그 조회가 불가능했던 문제 |
| syslog 결과 | supported | 분리 후 실제 예약 문제에서 당사 시스템 로그의 요청·응답을 확인 |
| 회고 | supported | 인증값·개인정보 마스킹, 추적에 필요한 정보만 기록, 보존 기간 관리 |
| 비공개 경계 | supported | 고객 예약 내역, 실제 값, 인증 정보, 개인정보, 시크릿, 비공개 소스는 공개하지 않음 |

## Authoring and visual decisions

- Question-and-answer source: `docs/portfolio-interviews/2026-08-21-the-siena-golf-reservation.md`의 2026-09-11 승인 답변과 대화에서 승인된 전체 공개 문안.
- Content approval: granted before specification and implementation.
- Project visual decision: `provided` — 네 책임 경계와 정상·예외 세 경로를 문장만으로 읽을 때 분기 위치를 혼동할 수 있어 예약 처리 swimlane을 제공한다. 로그 저장 전후는 포함하지 않는다.
- Insight visual decision: `provided` — 업무 DB와 `syslog`의 저장 경계 변화가 핵심 질문이므로 기존 before/after visual을 유지한다.
- Existing insight visual disposition: retain existing before-after.
- Long-form role: project는 전체 역할·예약 방어·운영 결과, insight는 로그 저장 경계 판단을 맡는다.
- Visual role: project는 예약 정상·예외 swimlane, insight는 로그 저장 위치 before/after를 맡는다.

## Prohibited claims

다음 문자열과 의미는 공개 작업물·인사이트에 0건이어야 한다.

- 전체 아키텍처·최초 구조 단독 설계
- 정확한 로그 분리 연월
- 전체 예약 건수, 중복률 `0%`, 중복 제거율, 영구적인 무결성 보장
- 처리 시간·장애율·이탈률·전환율 개선
- 20건, 2초마다 flush, 파일 I/O 약 95% 감소, 요청 간 인메모리 버퍼링 성과
- ELK, Loki, Datadog, Redis TTL lock, queue, 별도 로그 DB를 당시 실제 대안으로 검토했다는 주장
- 로그 테이블 문제로 예약 기능 자체가 중단됐다는 주장
- 고객 예약 내역, 실제 요청·응답 값, 인증 정보, 개인정보, 시크릿, 비공개 소스

## Evidence log

### T004–T010 — TDD RED contracts

- Command: `pnpm --dir apps/front test src/data/portfolio/content-quality.test.ts src/data/portfolio/feature-detail-quality.test.ts src/components/projects/project-detail-rendering.test.tsx src/components/projects/project-swimlane-layout.test.ts src/components/projects/archify-swimlane-embed.test.tsx`
- Result: expected RED, exit 1 — 5 files failed, 11 Siena contract tests failed, 241 existing tests passed.
- Expected causes: legacy period/content, missing structured detail and fallback swimlane, missing typed Archify target/public artifact/preview ratio.
- Baseline separation: no syntax, import, TypeScript, or unrelated existing-test failure. The Vite native-config message is a pre-existing future warning.
- Review: initial test review found scope gaps and over-coupling. After three bounded corrections, the contracts protect initial ownership, 2023-open-to-2026-09 observed scope, PMS ownership/relay, unknown syslog migration date, denominator/exhaustive-coverage limits, investigation-vs-reservation impact, and context-aware prohibited claims. Final controller RED rerun reproduced only the 11 expected feature-absence failures.
- Review constraint: no commit range exists because repository policy prohibits implementation commits; review used `.superpowers/sdd/tasks/content-red-review-package.md` and the exact scoped test blocks.

### T011–T016, T020 — Structured content and React fallback

- Implemented `FeatureDetailDto`: approved initial-build ownership, three evidence cards, operating investigation boundary, maintenance `syslog` decision/implementation, observed duplicate-call/CS limit, and retrospective masking/retention scope.
- Updated card period to `2023.05 – 현재` and removed legacy `content`; slug and routes remain unchanged.
- Registered exactly one swimlane with four lanes and nine steps. Duplicate requests stop before PMS; 5xx and timeout lead to distinct guidance; only the normal PMS-result edge carries `예약 성공 결과` semantics. All paths converge on the neutral `사용자 결과·안내 완료` node.
- Registered the exact typed feature/swimlane/artifact target and updated stale target fixtures from eight to nine.
- Focused result before artifact delivery: 250/252 passed. The only remaining RED cases are the intentionally absent public HTML and preview aspect ratio.
- Geometry: `project-swimlane-layout.test.ts` passed 51/51 at the 252px compact contract.
- Review: first review found the error guidance paths merging into a success-named node. The node and edge semantics were changed to a neutral completion, and normal success was isolated to the normal PMS edge. Critical 0; remaining Important 0 after controller inspection.
- Existing insight production content and common renderer components were not changed in this batch.

### T017–T023 — Archify source, delivery and preview

- Diagram type: `workflow`, schema version 2, quality profile `showcase`.
- Final validation: 9/9 artifact checks, composition errors 0, warnings 0. One focused correction shortened the neutral completion node context after a desktop-readability diagnostic; the passing candidate was then frozen.
- Source: `apps/front/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.json`
  - SHA-256: `f6c372b24546bb4350c9e0812881e0cdd6b9cad0a71e232a5112d945bc496da9`
  - Bytes: `3,802`
- Delivered HTML: `apps/front/public/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html`
  - SHA-256: `9ead909a6fa95bd8c9f012278cfbe2fc9bf4f51611b6e9a1adf82d0097903261`
  - Bytes: `711,649`
  - Generated by Archify delivery; not manually edited.
- ViewBox: `1362 × 652`; registered preview ratio: `1362 / 652` (`2.088957055214724`).
- Semantic parity: all nine fallback node IDs, ten edge IDs, four lane meanings, directions and normal/duplicate/5xx/timeout results are represented. Only the normal PMS result edge carries success meaning; log-storage before/after content remains insight-only.
- Automated browser evidence: `visual-check` status `pass`; light-theme containment/readability/viewer chrome passed at 1440×900, 1600×1000, 1920×1080 and 2048×1320, with light/dark endpoint captures and no horizontal or vertical overflow.
- Perceptual review: `passed`, correction rounds `1`. Controller inspected the exact delivered 1440×900 light/dark and 2048×1320 light screenshots. Lane labels, nine nodes and all branch labels are readable; paths do not cover nodes; duplicate, 5xx, timeout and success destinations remain visually distinguishable; no clipping or conspicuous imbalance was found.
- Focused Vitest: 5 files passed, 252 tests passed. The existing Vite native-config future warning remains non-failing baseline output.

### T024–T029 — Paired project/insight contract

- Existing `insight-editorial-quality.test.ts` already protects the approved insight title, `project-case` type, Siena source slug, architecture visual decision, business-DB→`syslog` boundary, request/response evidence and limitation language; no duplicate test block was added.
- Feature 014 content/rendering tests protect the reciprocal link, project/insight claim boundary, prohibited buffer/infrastructure claims and distinct project-reservation vs insight-log-storage visuals.
- `insights.ts` and `insight-editorial.ts` matched the approved contract, so T027 correctly produced no file change.
- Final prose comparison: the project summarizes the operational reason and outcome, then links out; the insight owns the detailed storage-boundary reasoning and before/after visual. Long-form duplication 0, visual duplication 0, fact contradiction 0.
- Command: `pnpm --dir apps/front test src/data/portfolio/insight-editorial-quality.test.ts src/data/portfolio/content-quality.test.ts src/components/projects/project-detail-rendering.test.tsx`
- Result: 3 files passed, 163 tests passed. Only the pre-existing Vite future warning was emitted.

### T030–T034 — Browser contracts and review correction

- Added `golf-reservation-structured-detail.spec.ts`: `/projects` → 골프 작업물 → 로그 인사이트 → 작업물의 Enter 이동, 세 route HTTP 200, 320·768·1024·1440px overflow, preview/dialog, Escape와 focus 복귀를 검증한다.
- The existing insight regression already contained the approved Siena title and reciprocal project/insight fixture, so T032 added no duplicate assertion.
- Added Siena to the shared nine-artifact viewer matrix with the exact public URL and `1362 / 652` ratio.
- First E2E review: Critical 0, Important 2. It found that the first draft checked only four node boxes and inherited a hotel-only theme contract.
- Corrections: the five core edge-label visual groups, including the normal `중복 아님` branch and each mask/text pair, are compared with all nine node shapes; a Siena-specific light/dark synchronization assertion checks the success-emphasis edge and label without iframe reload.
- Post-correction discovery: 3 files, 50 tests registered. Scoped E2E ESLint passed. No shared renderer change was required for T034.

### T035–T037 — Unit, type, scoped lint and build

- Full Vitest before final review: 8 files, 335/335 tests passed. The existing Vite native-config future warning remains non-failing.
- TypeScript: `pnpm --dir apps/front exec tsc --noEmit` passed after changing one test-only union access to a `toMatchObject` assertion that preserves the same content contract.
- Scoped ESLint: the explicit Feature 014 production, test and three E2E files passed with 0 errors. An initial run found one Prettier line-wrap violation in the Siena detail; only that line was wrapped. Repository-wide lint was not run because the known baseline and shared worktree are outside this feature.
- Production build: `pnpm --dir apps/front run build` passed. Next.js compiled, type-checked and generated all 38 static pages; the pre-existing multiple-lockfile workspace-root inference warning was non-failing.

### T038–T041 — Isolated production E2E and visual review

- Preflight: port 12116 had no listener. Port 1104 remained owned by PID 46911 and was never stopped or restarted.
- A temporary `apps/front/playwright.feature-014.prod.config.ts` pointed Playwright to `http://127.0.0.1:12116`; the production server returned HTTP 200 for both approved public routes.
- Production E2E command: `pnpm --dir apps/front exec playwright test e2e/golf-reservation-structured-detail.spec.ts e2e/portfolio-insight-contract.spec.ts e2e/swimlane-viewer.spec.ts --config=playwright.feature-014.prod.config.ts --reporter=line`.
- Result: 50/50 passed in 2.7 minutes. This covers keyboard round trips, nine shared artifacts, four viewports, document/card/dialog overflow, all-nine-node label geometry, preview/READ dialog parity, shared legend, Siena theme synchronization, fallback error/timeout and focus restoration.
- Automated visual-capture run: 2/2 passed, producing project, insight and open-dialog captures at 320px and 1440px.
- Perceptual review: all six captures were inspected separately from automated geometry. At 320px, headings wrap without collision, the compact preview remains contained and the dialog provides the readable mobile transcript below it. At 1440px, the four lanes, nine nodes and normal/duplicate/5xx/timeout paths are legible; the dialog title, close control, legend and diagram are not clipped. Project and insight pages have no visible horizontal overflow or overlapping content.
- Cleanup: the temporary Playwright config and capture-only spec were deleted with `apply_patch`; only the owned 12116 process was stopped. Final checks found no 12116 listener, while 1104 PID 46911 and both public-route HTTP 200 responses remained intact.

### T042–T044 — Final content, scope and changed-E2E gate

- Interview/contract comparison: three evidence cards are supported 3/3 (100%). Their kind, as-of value and caveat remain present.
- Prohibited-claim review: 0 unsupported positive claims. Strings such as `전체 예약 전수 집계`, `영구적인 예약 무결성 보장` and unmeasured reductions appear only as explicit non-claims/limitations, not achievements. No buffer, flush, ELK/Loki/Datadog, Redis TTL, queue or separate-log-DB decision is attributed to the work.
- Duplication: project long-form owns role, request defense and observed operation; the linked insight owns log-storage-boundary reasoning. Long-form duplicate 0, visual duplicate 0, contradiction 0.
- `git diff --check`: passed. Feature 013 T045/T047/T048 remain unchecked and were not modified. The Archify source and generated HTML hashes still match the frozen T017–T023 receipt.
- `mise run e2e:changed`: exited 0 but correctly skipped with `no changed app with an e2e suite, skipping (no evidence stamped)` because this shared worktree has no staged files. No staging workaround was used. The isolated production run above is the substitute browser evidence.

### Final independent review corrections

- Review result before correction: Critical 0, Important 2, Minor 1.
- Important 1: the interview-approved `FE/BE 단독` responsibility had been weakened to `FE/BE 구분 없이`. The project role, card team label, spec, research, data model, public contract and tests now say that the implementation covered both FE/BE alone while retaining the separate limitation that the overall architecture was already defined.
- Important 2: the shared source/generated HTML/fallback parity loop skipped Siena. The skip was removed and a Siena-specific exact contract now fixes nine step IDs, ten edge ID/from/to/kind/outcome/label tuples, three exception IDs and generated artifact IDs/labels.
- Minor: the normal `중복 아님` edge label was added to the all-nine-node visual-group overlap check. Direct path/node intersections are not asserted because valid source/target endpoints necessarily meet their nodes; Archify `visual-check`, the generated topology parity and perceptual review cover the routed arrows.
- Post-correction focused Vitest: 2 files, 162/162 passed. Final full Vitest: 8 files, 336/336 passed. TypeScript and corrected-file scoped ESLint passed.
- Post-correction production build: compiled, type-checked and generated 38/38 pages. Isolated 12116 Playwright rerun selected the golf suite, Siena reciprocal insight cases and Siena theme contract: 8/8 passed in 9.7 seconds.
- Second cleanup again removed the temporary config and owned 12116 server. Final state: 12116 listener none; 1104 PID 46911 preserved; project and insight routes both HTTP 200.

### T045 — Spec Kit convergence

- Result: **✅ Converged — the implementation satisfies the spec, plan, and tasks.**
- Inventory checked: 34 functional requirements, 8 success criteria, 16 acceptance scenarios, 10 edge cases, 12 research/plan decisions and 5 constitution principles.
- Findings: missing 0, partial 0, contradicts 0, unrequested 0; Critical 0, High 0, Medium 0, Low 0.
- The converge pass left `tasks.md` without a new convergence section because no actionable work remained.
- Final independent review after corrections: Critical 0, Important 0, Minor 0.

### T046 — Feature status synchronization

- `mise run feature:status:sync` was executed and returned `no task //:feature:status:sync found` with the current task list.
- No deterministic automated transition or `--apply` result is claimed. Feature completion is recorded manually in `ROADMAP.md`, matching the repository's existing workflow note.
- T001–T046 are all checked. Final `tasks.md` SHA-256: `fc696b80430b6fab0e55b29fb6add1915b2836127bd744d97843e5e50634a8a4`.
