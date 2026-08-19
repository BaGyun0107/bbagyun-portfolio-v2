# Verification: Planning Hub 데모·동기화·기능 허브 재설계

## Baseline — 2026-07-16

- Branch: `feature/harness-migrate`
- Existing dirty worktree: preserved; no reset, checkout, commit or source rewrite performed.
- `npm test`: 1 pre-existing failure, `tests/feature-hub-canonical-data.test.mjs` expected 9 canonical features but current 007-009 source exposes 10. The failure is retained as baseline debt and must be green or explicitly reconciled before completion.
- Focused baseline: 41 test files passed and the same canonical-count assertion failed (`10 !== 9`).
- `mise run docs:build`: passed; generated 128 documents, 10 features and 10 feature-definition rows. Existing hints reported one unplaced definition, ten empty screen nodes and two traceability orphans.
- Baseline `data/` checksums:
  - `data/feature-relations.json`: `d76188f1bb1a05e8d04988aca1401f1a43a20d1bc763e5e0447f13a1471ec9b5`
  - `data/sitemap.json`: `b253efee4aed56395186854496a4298cb134b8f514a6f05945634a636db4d8b8`
  - `data/user-flows.json`: `a0d3a26708c07289b352621dc3e25cc785852eca128092dc237d1b3d6f135316`

## US1 — 제품 구조

- [x] Community Demo → Harness Internal 전환 시 overview가 Harness Internal로 원자
  교체되고, actual badge/17 screen이 표시된 뒤 다시 Demo로 복귀함을 확인했다.
- [x] surface `admin` 필터는 4개 관리자 화면만, `게시물` 검색은 2개 화면만 남겼고,
  zoom-in은 canvas scale을 `1.1`로 변경했다. 화면 선택 시 route/access/direct 이동
  상세가 같은 stable ID로 표시됐다.
- [x] 1280×720, 768×1024, 375×812 screenshot을 확인했다. 375px에서 document
  `scrollWidth=375`, `innerWidth=375`였고 keyboard tree/table 대체 뷰가 유지됐다.
- [x] workspace select에 focus 후 Tab→Tab→Enter만으로 화면 구조 view에 진입했다.

## US2 — 기능 정의

- [x] FEAT-POST-CREATE 상세에서 processing, emptyOrNoInput, errorRetry,
  permissionDenied와 6개 detail section을 확인했다.
- [x] FEAT-SETTINGS 선택 시 `정의 불완전 · states.errorRetry` 및 구체적 복구 행동이
  표시됐다. hostile external text escaping은 renderer 단위 테스트로 통과했다.

## US3 — 계획과 전달 조정

- [x] `tests/planning-reconcile.test.mjs`에서 aligned / behind / drifted /
  conflicted / collection-failed 전이와 last-good 보존을 검증했다.
- [x] `tests/planning-pull.test.mjs`에서 schema/project/digest validate-before-write,
  temporary file 원자 교체, 중단·실패 시 기존 lock byte 보존을 검증했다.
- [x] Community Demo에 계획 이미지 10장과 observed 4장 차이를 넣어 `drifted` 및
  `PROP-FEAT-POST-CREATE-001`을 생성했다. proposal은 두 source를 변경하지 않는다.
- [x] focused US3 command: delivery/pull/reconcile/render 38 tests passed.

## US4 — 자동화

- [x] `tests/planning-automation.test.mjs`에서 manual/Claude/Codex trigger 정규화,
  input digest, duration, last-success run과 no-op skip을 검증했다.
- [x] `tests/docs-build-on-stop.test.mjs`와 `tests/codex-stop.test.mjs`에서 source-group
  분류, generated output 제외, shared adapter, Codex exit 0 + JSON stdout을 검증했다.
- [x] ordinary `mise run planning:sync` 전후 Planning Lock SHA-256은 모두
  `bb2bd3e32252f99582a611194076549f00a2b67e7c068d0ffb7459b3a9a866f7`였다.
- [x] 동일 planning 입력을 10회 반복한 SC-006 회귀에서 input digest는 1종으로
  유지됐고 결과는 success 1회 + skipped 9회, build 1회, Planning Lock byte 불변이었다.
- [x] hook/sync/watch/check 모듈 `node --check` 통과. CI Node verify 끝에 strict
  planning check가 연결되어 direct-edit/stale/conflict 단위 테스트를 재사용한다.
- [x] shared Stop 경계에 projection 실패를 주입했을 때 Claude/Codex 모두 경고만
  남기고 비차단으로 종료하는 fail-open 회귀를 추가했다.
- [x] focused US4 command: 16 tests passed. 실제 `mise run planning:check`도 통과했다.

## US5 — 이식성

- [x] 서로 다른 두 임시 repository path에 동일 planning source를 복제했을 때 stable
  feature ID와 manifest digest가 동일함을 검증했다.
- [x] repository-relative descriptor만 해석했으며 path escape, credential URL,
  command/executable/secret field를 거부했다(contracts/workspace 포함 10 tests passed).
- [x] 외부 repository 생성, write, push, PR 작업은 수행하지 않았다. 향후 ownership과
  publish/pull/proposal 절차는 `docs/planning-hub-handoff.md`에 기록했다.

## Final Verification

- [x] 최종 전체 `npm test`: 483 tests, 483 pass, 0 fail, 40.8s.
- [x] strict `mise run planning:check`: manifest, lock, evidence, relation, sync,
  generated output 일치. `mise run docs:build`도 130 documents, 10 features,
  10 feature-definition rows로 재생성에 성공했다.
- [x] 규칙 회귀: `./harness context-check` 0 failure/0 warning,
  `./harness rule-check` 통과, `npm run codex:replay-check` 54/54 통과.
- [x] `mise run feature:status:sync` check-only 결과는 `상태 전이 제안 없음`이었다.
  사람 대상 사용성 검증이 남아 있어 `in-progress`를 유지했고 `--apply`는 실행하지
  않았다.
- [x] 초기 구현 브라우저 조작 검증: 7개 view, workspace 전환, filter/search/zoom, rich detail,
  3개 flow, 12행 matrix, 세 delivery lens, `drifted · 제안 1`, 동일 digest와 복구 행동.
- [x] 접근성/성능 자동 검증: graph 없는 tree/table/text/matrix, 500 feature/100
  screen/50 flow build 45ms 미만, 브라우저 console error 0, local load 66ms.
- [x] 실제 사용자 5명 사용성 검증(2분 내 목적 구분·탐색)은 **수행하지 않은
  채 요구가 철회되어 종결됐다** (2026-08-03 소유자 결정 — 하단 "종결 기록"
  절). 자동/에이전트 검증으로 대체하지 않았고, 검증을 수행했다는 주장이
  아니다.
- [x] Spec Kit converge 점검: prerequisite script가 010 feature와 design 문서를
  정상 식별했다. FR-001~FR-040 및 SC-002~SC-010을 구현 파일·계약 테스트·브라우저
  증거에 대조했고 새 구현 누락은 발견하지 않았다. 특히 SC-006은 동일 입력 10회
  회귀 테스트로 보강했다.
- [x] 당시 전체 결과는 `Converged`가 아니었다(T098/SC-001 미완료로 T101
  반영 보류). **2026-08-03 T098 요구 철회로 잔여 조건이 해소되어 보류를
  풀고 종결했다** — "종결 기록" 절.

## US6 continuation verification — 2026-07-16

### Focused and regression evidence

- [x] Markdown projection/document reader focused suite는 hostile HTML, relative Markdown
  link, conversion isolation, full-content search와 fragment 복원을 포함해 33/33 통과했다.
- [x] Planning renderer/sitemap suite는 8개 view, shared feature/screen selection,
  14-node organization layout, keyboard, fit/pan/zoom, XSS와 대형 model 회귀를 포함해
  46/46 통과했다.
- [x] Page-set build/check/sync/Stop/Code adapter 확대 회귀는 실제 EISDIR rollback,
  porcelain `-z`, configured evidence, symlink/limit와 deterministic error projection을
  포함해 136/136 통과했다. 독립 품질 재검토의 집중 suite도 42/42 통과했다.
- [x] 문서 허브 CSS 누락을 `file://` QA에서 발견했다. 원인은 공용 CSS에 docs selector가
  없었던 것이며, CSS 계약 RED 후 desktop 3-pane, 900px 2-column, 600px 1-column과
  bounded list scroll을 추가했다. docs/Markdown/Planning CSS 회귀는 74/74 통과했다.
- [x] `codi-feature-hub`와 사용자 문서의 split page-set/ownership 계약 테스트는 13/13
  통과했고 `./harness context-check`에서 skill metadata를 포함해 0 failure/0 warning이었다.

### Full command evidence

- [x] 최종 `npm test`와 후속 `node --test --test-reporter=dot tests/*.test.mjs`는 exit 0이었다.
- [x] `mise run docs:build`는 `docs/index.html`과 `docs/planning.html`을 132 documents,
  10 features, 10 feature-definition rows로 함께 생성했다.
- [x] 생성 직후와 최종 CSS 반영 뒤 `mise run planning:check`를 실행했으며 manifest,
  lock, evidence, relation, sync와 두 generated output이 strict 일치했다.
- [x] `./harness context-check`는 0 failure/0 warning, `./harness rule-check`는 통과,
  `npm run codex:replay-check`는 57/57 통과했다. `git diff --check`도 통과했다.
- [x] `mise run feature:status:sync` check-only 결과는 `상태 전이 제안 없음`이었다.
  deterministic adjacent transition이 없어 `--apply`는 실행하지 않았다.
- [x] mise 사용자 cache 경고는 sandbox의 사용자 cache write 제한이며 모든 task의
  exit code는 0이었다.

### `file://` browser evidence

- [x] 문서 허브에서 하네스 12건/프로젝트 120건 전환, 직접
  `#project:docs%2Fplanning-hub-handoff.md` 복원, `planning-hub-handoff` content 검색,
  reader path/body와 Planning 왕복 링크를 확인했다. console error는 0이었다.
- [x] 문서 허브를 1280×720, 768×1024, 375×812에서 확인했다. desktop은 sidebar/list/
  reader 3-pane, tablet은 category nav + list/reader 2-column, mobile은 category → 42vh
  bounded list → reader 1-column으로 표시됐고 document-level horizontal overflow는 없었다.
- [x] Planning Hub는 정확히 `overview,screens,features,status,flows,traceability,delivery,sync`
  8개 view와 Community Demo/Harness Internal workspace를 제공했다. mobile nav는
  `overflow-x:auto`이며 마지막 sync view 선택 시 `scrollLeft=167`, visible view=`sync`였다.
- [x] organization view에서 실제 screen node 14개, `SCREEN-HOME` 선택 상세와 fit transform을
  확인했다. keyboard로 `SCREEN-FEED` focus 후 Enter 선택, canvas ArrowRight/+ pan·zoom 후
  transform=`translate(39.2589 -35.5) scale(1.1)`을 확인했고 console error는 0이었다.
- [x] `FEAT-POST-CREATE`를 기능 정의에서 선택한 뒤 기능 현황으로 이동했을 때 동일 ID가
  양쪽에서 selected였고 Spec 근거, Task 3/5, acceptance criterion과 observed evidence가
  같은 상세에 표시됐다.
- [x] Planning organization view의 1280×720, 768×1024, 375×812 screenshot과 문서 허브의
  동일 viewport screenshot을 직접 확인했다. 색상 범례, solid hierarchy, dotted direct
  navigation, focus/selection과 responsive layout을 구분할 수 있었다.

### Remaining human evidence

- [x] T098/SC-001의 실사용자 5명 세션은 **수행하지 않은 채 요구 철회로
  종결됐다** (2026-08-03 — "종결 기록" 절). 에이전트 browser QA나 자동
  테스트로 대체하지 않았다.

## US7 feature workbench continuation — 2026-07-16

### T102/T106 contract foundation

- [x] RED: `node --test tests/planning-feature-work-items.test.mjs tests/feature-definition-schema.test.mjs tests/planning-contracts.test.mjs`는 최초 14건 중 3건이 실패했다. 새 work-item schema 부재, feature-detail 배치 필수 필드 부재, Delivery Evidence의 optional workItems 계약 부재가 각각 원인이었다.
- [x] 런타임 validator 보완 RED는 feature-detail 필수 배치 필드 누락과 workItems-only evidence 거부 2건, malformed workspace 순회 2건, non-object source descriptor 3건을 재현했다.
- [x] GREEN: 같은 focused command를 최종 재실행해 21/21 통과, `git diff --check`도 통과했다.
- [x] 별도 spec review에서 metadata와 runtime validator의 explicit/legacy 호환, placement 계약과 repository 비소유를 승인했다.
- [x] 별도 quality review에서 malformed workspace/source descriptor의 fail-open 결함을 발견해 TDD로 보완했고, 재검토 결과 남은 Critical/Important 이슈 없이 승인됐다.
- [x] 커밋과 push는 수행하지 않았다.

### T103/T107 work-item normalization

- [x] 최초 RED는 `normalize-feature-work-items.mjs` 부재로 0/1 실패했다. 후속 RED에서 invalid-first duplicate, explicit/legacy generated-ID 충돌, invalid explicit의 legacy fallback, non-JSON nested 값 허용을 각각 재현했다.
- [x] explicit FeatureWorkItem 1:N, first source occurrence ID 예약, same-feature legacy suppression, legacy `unspecified`, 확인 가능한 Release 보존/미확인 `unassigned`, broken parent와 malformed container health를 구현했다.
- [x] BigInt, Map, Date, 순환 참조, undefined, 비유한 수, 함수·symbol, 위험 key와 custom prototype을 거부하고 JSON-compatible nested 값만 깊은 복제하도록 보완했다.
- [x] 최종 `node --test tests/planning-feature-work-items.test.mjs`는 11/11 통과했고 `git diff --check`도 통과했다.
- [x] 별도 spec review와 quality review 모두 최종 승인했다. 커밋과 push는 수행하지 않았다.

### T104/T108 completion and rollup

- [x] 최초 RED는 aggregate module 부재였고, 후속 RED에서 정본 `acceptanceResults` 필드 불일치, 필수 criterion 부분 coverage, 분수/unsafe task count, 비문자 evidence, invalid target/item 진단 누락을 재현했다.
- [x] requested `done`은 safe integer task 완료, stable unique `requiredAcceptanceCriterionIds`, unique plain acceptance result의 exact passed coverage, nonempty stable evidence와 blocking decision 0건을 모두 요구한다.
- [x] 근거 없는 `done`은 `in-review`와 `blockedDoneCount`로 강등하며, Release filter·hold count·zero work·상태 우선순위와 invalid health를 분리했다.
- [x] 전체 기능 집계는 feature별 item bucket을 한 번 구성하는 O(features + items) 경로로 바꿨고 500 feature/2,000 item 표본은 약 4ms로 exact count를 유지했다.
- [x] schema/data-model/FeatureWorkItem 계약에 completion-required field를 동기화했다. 최종 focused test 20/20, node syntax와 `git diff --check` 통과, spec/quality review 승인, commit/push 없음.

### T105/T109/T110 workspace and demo integration

- [x] RED는 workspace fields, reconcile summary와 demo metadata/workItems 부재로 6/15 실패했다. 새 feature-detail required metadata가 기존 demo detail을 깨는 별도 RED도 확인한 뒤 같은 planning metadata만 최소 동기화했다.
- [x] 실제 workspace load 경로에 normalize→aggregate를 연결해 `featureWorkItems`, `featureRollups`, `workItemHealth`와 전체 health를 clone 경계로 제공한다.
- [x] reconcile은 planning drift/proposal lifecycle을 바꾸지 않고 effective work-item status, blocked done과 invalid count summary만 추가한다.
- [x] Community Demo의 `FEAT-POST-CREATE` R1에 frontend/planned, backend/in-progress, qa/in-review 3개 작업을 추가했고 12개 feature의 group/typed placements/target Release 및 legacy screenIds를 함께 유지했다.
- [x] late-read source 오류 badge, nested plannedValue alias와 O(F²) proposal lookup을 품질 검토에서 발견해 각각 RED 후 source health 순서, output clone, featureById Map으로 보완했다.
- [x] 최종 focused 5파일 41/41, production syntax와 `git diff --check` 통과. 6 needs/14 screens/12 features/3 flows 및 10→4 intentional drift/proposal을 유지했고 spec/quality review 승인, commit/push 없음.

### T111/T113/T114 placement-first feature explorer

- [x] RED는 explorer marker, 새 module, pure model과 generated client filter/status 이동 부재로 focused 4/4 실패했다.
- [x] Surface/Screen, 선택 화면의 group/list, 선택 정의 detail 세 영역과 placement fallback, rollup/search model, priority-secondary 목록을 구현했다.
- [x] screen/group/query filter, 기능 현황 이동의 shared feature ID/focus, workspace 재수화와 hostile/empty/malformed source를 실행 테스트로 검증했다.
- [x] `FEAT-POST-CREATE`에 기존 traceability와 일치하는 `SCREEN-POST-DETAIL` result placement를 추가하고 legacy screenIds 집합을 동기화했다.
- [x] 품질 검토에서 zero-result filter가 이전 detail을 남기는 문제를 발견해 RED 후 local empty sentinel, detail hide, status 이동 disabled와 filter clear 복구를 구현했다.
- [x] 최종 focused 3파일 50/50, renderer syntax와 `git diff --check` 통과. spec/quality review 승인, commit/push 없음.

### T112/T115 feature-context Kanban

- [x] RED는 4개 Kanban 열과 독립 feature/work-item client state 부재로 6/8 실패했다. 첫 8/8 GREEN 뒤에만 기존 feature-level status renderer를 제거했다.
- [x] FeatureWorkItem 단일 카드 집합, planned/in-progress/in-review/done 4열, hold 카드 조건, 기능별 대안 보기와 Release/group/workType/hold/query 필터를 구현했다.
- [x] selectedFeatureDefinitionId와 selectedWorkItemId를 분리하고 정의↔현황, 보기 전환, zero-result, workspace 재수화에서 stale detail 없이 같은 선택을 유지했다.
- [x] task/acceptance/evidence/blocker 상세와 근거 부족 done의 in-review 차단 표시를 추가했다.
- [x] 품질 검토에서 acceptance duplicate/extra 과다 집계와 Kanban/grouped 카드·상세 DOM 중복을 발견해 RED 후 required criterion 교집합 dedupe, 단일 카드 node 이동과 단일 textContent 상세 패널로 보완했다.
- [x] 2,000 work-item 표본은 active card 2,000개·detail 1개로 약 87ms에 렌더/전환됐고, 최종 focused 4파일 74/74, syntax와 `git diff --check` 통과. spec/quality review 승인, commit/push 없음.

### T116/T119/T120 user-flow goal story — 2026-07-17 정합 기록

- [x] 체크 정합: `build-user-flow-story.mjs`, `render-user-flow-story-view.mjs`와
  `tests/planning-user-flow-story.test.mjs`는 이전 세션에서 이미 구현·연결되어
  있었으나 체크박스 갱신 전에 세션이 종료됐다. 구현이 선행됐고 테스트는 사후
  확인했다는 사실을 그대로 기록한다(RED 증거 없음, 기록 과장 금지).
- [x] 잔여 render 검증 갭을 보강했다: decision/failure branch kind의 render 표면화,
  flow health(`broken-target`/`cycle`)의 render 표면화, ordered 대안의 orphan
  step·branch 완전성. 보강 직후 실행에서 즉시 통과해 구현 완전성을 확인했다.
- [x] `node --test tests/planning-user-flow-story.test.mjs`: 12/12 통과.

### Spec Kit convergence result

- [x] prerequisite는 feature dir `specs/010-planning-hub-redesign`와 research,
  data-model, contracts, quickstart, tasks를 정상 식별했다. extension pre/after hook은 없었다.
- [x] FR-001~FR-050, SC-002~SC-015, US1~US6 acceptance와 plan의 8개 delivery
  slice를 구현·계약·테스트·브라우저 증거에 대조했다. constitution은 미작성 template이라
  검사에서 제외했다.
- [x] 새로 append할 `missing`, `partial`, `contradicts`, `unrequested` buildable finding은
  0건이었다. 따라서 converge는 새 Phase나 task를 추가하지 않았다.
- [x] 당시 기준 feature 전체 완료가 아니었다(SC-001/T098 증거 미확보).
  **2026-08-03 T098 요구 철회로 조건이 해소되어 종결** — ROADMAP/CHANGELOG
  반영은 specs/017 T002 에서 수행 ("종결 기록" 절).

## US7 completion — 2026-07-17 (T117~T130)

### T118/T123 여섯 제품 보기 + 운영·고급

- [x] RED: 여섯 보기·delivery/sync 버튼 제거·operations open/close·`계층 목록(접근성
  보기)` parity 테스트 5건이 8-view 구현에서 실패함을 확인했다.
- [x] GREEN: `PLANNING_VIEWS` 6개 축소, `운영·고급` disclosure(data-operations-disclosure,
  workspace별 template + client cache), delivery lens·변경 제안·다음 행동의 개요 흡수,
  화면 상세 근거 버튼의 status 재지정, FR-070 명칭 정정(render-planning-page +
  render-hub)을 구현해 전부 통과했다.
- [x] 운영·고급 토글은 제품 보기 선택을 바꾸지 않고, workspace 전환 시 운영 내용이
  template/cache로 함께 갱신됨을 client 실행 테스트로 검증했다.

### FR-059 Kanban 선택 기능 범위 (결정 12 조건 이행)

- [x] RED 2건 확인 후 selectedWorkScope 상태, scope 필터 결합(Release·유형·보류·검색과
  동시 적용), `전체 작업` 명시 전환, aria-live 범위 라벨을 구현했다. 속성 없는 카드는
  fail-open으로 표시를 유지한다. contracts/hub-view-contract.md에 범위 계약을 명문화했다.

### T117/T121/T122 추적성 coverage/gap/bounded neighborhood

- [x] RED(모듈 부재) 확인 후 `build-traceability-coverage.mjs`(summary·severity 정렬
  gap·bounded neighborhood·matrixRows·CSV)와 `render-traceability-coverage-view.mjs`
  (coverage dashboard, 누락 작업함, 국소 탐색기, 접힌 matrix/CSV)를 구현해 연결했다.
- [x] gap은 FR-013 원인별 명칭(정의 불완전, 연결된 기능정의 없음, 구현 근거 미수집 등)과
  복구 행동을 포함하고 severity 정렬을 테스트로 고정했다.
- [x] SC-020 규모 검증: 500 기능/2,000 작업 표본에서 흐름·요구 누락 수가 기대값과 100%
  일치(400/250), neighborhood ≤32 node, 계산 약 8ms. gap 선택은 공유 feature 선택과
  국소 탐색 재렌더를 함께 갱신한다(client 실행 테스트).

### T124/T125 반응형·접근성

- [x] RED 3건(CSS 계약 테스트) 확인 후 skip link(+`#planningMain` tabindex=-1),
  workbench/story/coverage/overview/operations 스타일, planning breakpoint 900px/600px
  재조정(600px에서 44px 컨트롤), 광역 prefers-reduced-motion, gap severity·flow branch
  kind·선택 상태의 비색상 채널(border-style·굵기), bounded 카드 렌더(content-visibility
  + 열 내부 스크롤)를 hub.css에 구현해 통과했다. docs hub의 900/600 블록은 locator만
  정정(lastIndexOf)하고 동작은 유지했다.

### T126 문서·스킬 정합

- [x] README, CONTRIBUTING, planning-hub-handoff, codi-feature-hub SKILL, research R8
  (수정 이력 명시 amend), feature-definition-planning-hub-guide에서 8개 보기 서술을
  0건으로 정리하고 여섯 보기 + 운영·고급 + 1:N/Release/legacy unspecified 계약을
  반영했다. `./harness context-check` 0 failure/0 warning.

### T127/T128 전체 명령·규모 검증

- [x] 최종 `node --test tests/*.test.mjs`: 621/621 통과(신규 16개 테스트 포함).
- [x] `mise run docs:build` 후 `mise run planning:check`: manifest, lock, evidence,
  relation, sync, generated output strict 일치(exit 0).
- [x] `./harness context-check` 0/0, `./harness rule-check` 통과,
  `npm run codex:replay-check` 61/61, `git diff --check` 통과.
- [x] SC-023: 500 기능/2,000 작업/100 화면/50 흐름 표본의 두 페이지 page-set 생성이
  2초 미만이며 active workspace template 비중복과 bounded neighborhood를
  `tests/feature-hub-render.test.mjs`에서 회귀로 고정했다.

### T129 `file://` 브라우저 검증 (headless Chromium, 2026-07-17)

- [x] `docs/planning.html`을 file://로 열어 콘솔 에러 0을 확인했다. 제품 보기 버튼은
  정확히 6개(overview…traceability), delivery 버튼 0개, 운영·고급/skip link/gap
  queue/국소 탐색기/범위 토글 존재를 DOM으로 확인했다.
- [x] 1280×720·768×1024·375×812 screenshot을 확인했고 375px에서
  `scrollWidth=375=innerWidth`(2차원 스크롤 없음)였다.
- [x] 상호작용: 운영·고급 open/close 후에도 추적성 보기 선택 유지, gap 클릭 시 공유
  feature 선택 + 국소 탐색기 갱신, Kanban 범위 기본(선택 기능)에서 다른 기능 카드
  숨김·`전체 작업` 전환 시 4/4 표시, 기능 탐색기 12 정의/14 화면, Kanban↔기능별 전환,
  keyboard 첫 Tab에서 skip link 노출(left:0)과 Enter 활성화를 확인했다.
- [x] 초기 선택 기능(FEAT-FEED)은 작업 0개로 빈 상태 안내가 표시되며, 범위·필터 안내
  문구를 보강했다.
  - 2026-07-17 주석: 데모 delivery evidence 보강 이후 FEAT-FEED는 legacy 투영
    work item 1개를 가지므로 이 관측은 당시 데이터 기준이다. 빈 상태 안내
    자체는 렌더러에 유지되며 `tests/planning-feature-workbench-render.test.mjs`가
    빈 상태 UI를 계속 검증한다.

### T130 수렴 점검과 다각 리뷰

- [x] `mise run feature:status:sync` check-only: `상태 전이 제안 없음` — T098(사람
  검증) 미완료로 in-progress 유지가 맞다. `--apply`는 실행하지 않았다.
- [x] FR-016/017/059/060/062/063/070과 SC-020~SC-024를 6개 렌즈(정확성·계약·주입·접근성·
  문서·완결성) 병렬 리뷰 + 발견별 3표 적대 검증(60 agent)으로 대조했다. 발견 18건 중
  16건은 검증 전 선반영 수정으로 해소, 확정 2건(가이드 문서 stale 서술)은 본 세션에서
  수정했다. P0/P1 잔존 0건.
- [x] 남은 미완료: T098(실사용자 5명, 자동 검증으로 대체하지 않음), T101(완료 후
  ROADMAP/CHANGELOG 반영). ROADMAP에는 진행 중 1줄만 등재했다(사용자 확인 대상).

### 기능 정의·기능 현황 시각 QA 보완 — 2026-07-17 (사용자 가독성 지적)

- [x] 실브라우저 QA에서 실제 클라이언트 결함 1건을 발견·수정했다: 카드 버튼이
  `data-work-detail-*` 속성을 함께 갖고 있어 `selectWorkItem`의 전역
  `querySelector`가 상세 패널 대신 첫 카드를 잡아 카드 본문을 상세 값으로
  덮어썼다(vm 기반 테스트는 요소 주입 방식이라 미검출). 필드 셀렉터를
  `[data-work-item-detail]` 범위로 한정했고, 기존 상세 동기화 테스트가 스코프
  셀렉터를 고정한다.
- [x] 기능 정의 배치 탐색기(3영역)와 기능 현황 workbench의 미스타일 마크업을
  hub.css로 정비했다: 화면 트리(불릿 제거·계층 들여쓰기·선택 상태), 목록·상세
  카드, segmented 보기/범위 토글, 필터 select, Kanban 열 헤더·카드 위계,
  컨텍스트/근거 패널 라벨 그리드, 900px 스택. 텍스트 라벨과 테두리 채널을
  유지해 색상 비의존 원칙을 지켰다.
- [x] 검증: 전체 621/621 통과, `planning:check` exit 0, `file://` 콘솔 에러 0,
  375px `scrollWidth=375`. before/after screenshot으로 두 화면을 대조했다.

## 종결 기록 (2026-08-03)

- [x] T098 사용성 검증(실사용자 5명)은 소유자 결정으로 **철회** — 감사 D-2,
  결정 근거: Planning Hub 기능의 존속 여부 자체가 미정이라 검증 투자가
  정당화되지 않음. "자동 검증으로 대체 금지" 원칙은 대체가 아니라 요구
  철회로 종결한 것이며, 기능 존속 확정 시 별도 spec 으로 재개한다.
- [x] SC-001 은 미검증 상태로 기록 보존 — 충족 주장 아님.
- [x] 종결 절차는 specs/017-audit-wave2 T002 로 수행.
