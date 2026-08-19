# Planning Hub 구조 개선 심층 조사

- 조사일: 2026-07-17
- 조사 프롬프트: `docs/prompts/claude-code-planning-hub-deep-research.md`
- 성격: 읽기·분석·보고서 작성만 수행 (구현 변경 없음)

## 1. Executive Summary

**종합 판정: 설계는 건전하고 외부 표준과 정합하며, 문제는 "잘못 만든 것"이
아니라 "덜 만든 것"이다.** 승인된 17개 결정은 전부 유지 가치가 있고(15개
유지, 2개 조건부 유지, 변경·제거 0개), 데이터 계층(FeatureDefinition 1:N
FeatureWorkItem, immutable manifest/digest, Planning Lock, Change Proposal,
완료 가드)은 구현·테스트 완료에 소유권 침범 0건으로 확인됐다(P0 없음).
반면 화면 계층은 US7 후반(T117~T130)이 미착수라 승인안과 3곳에서 어긋난다.

핵심 발견 (P1 5건):

1. **여섯 제품 보기 미전환** — 현행 렌더러는 delivery·sync를 포함한 8개 평면
   탭이다. 처음 보는 사용자가 제품 보기와 운영 화면을 구분하지 못한다.
2. **추적성이 전체 matrix뿐** — coverage·gap queue·neighborhood 모듈이 파일
   수준에서 부재하다. 500 기능 규모에서 행동 가능한 정보를 주지 못한다.
3. **Kanban이 선택 기능으로 카드를 필터하지 않음** — "선택 기능 컨텍스트"
   라벨과 실제 동작(전체 작업 표시)이 어긋나 완료 판단을 흐린다.
4. **문서·스킬의 8개 보기 잔존** — codi-feature-hub SKILL, handoff, README가
   옛 구조를 정본처럼 안내해 사람과 AI를 오도한다.
5. **merge gate 실효성 미확인** — planning-check의 fail-closed 보장이 GitHub
   branch protection 설정(저장소 밖)에 달려 있다.

즉시 상태 이슈: 현 워킹트리에서 `planning:check`가 exit 1이다
(`docs/index.html` stale — `mise run docs:build`로 복구). 또한 flow story
(T116·T119·T120)는 구현·테스트가 실존·통과하는데 체크박스만 미갱신이라
세션 연속성 기록이 실제보다 과소하다.

외부 검증 요약: 기능정의 계약은 ISO/IEC/IEEE 29148:2018의 9개 요구 특성을
충족하고(7절), 기능 현황의 완료 가드는 공식 Kanban Guide의 "명시적 상태
정책" 원칙에 부합하며(11절), coverage 우선 추적성·screen-only 사이트맵·goal
story 흐름은 각각 표준·NN/g 근거와 정합한다(9·12·13절). 접근성은 WCAG 2.2
Level A/AA 핵심(색상 비의존·키보드)을 갖췄고 skip link 등 보완이 남았다.

권장 다음 순서(21절 Now): 생성물 복구(N1) → tasks 체크 정합(N2) → **여섯
보기 전환 + Kanban 필터 + 문서 갱신을 한 변경 단위로**(N3~N5) → branch
protection 확인(N6). 이후 coverage 추적성(T117·T121·T122)과 접근성
보완(T124·T125)이 Next다. 구현 시작 전 사용자 승인이 필요한 결정은 23절에
6건으로 정리했다.

## 2. 조사 범위와 방법

조사는 세 층으로 분리해 수행했다.

1. **Repository evidence**: 병렬 조사 에이전트 6개가 각각 (a) 010 스펙 문서와
   설계 원본, (b) 스키마·렌더러 구현, (c) 테스트 커버리지와 실제 실행, (d) 훅·
   자동화·CI 수렴성, (e) 생성 화면(`docs/index.html`, `docs/planning.html`)과
   `data/`·`examples/community-app/` 원본, (f) 문서 드리프트를 조사했다. 모든
   근거는 `상대경로:줄번호`로 인용한다.
2. **External deep research**: deep-research 워크플로(검색 fan-out → 원문 fetch →
   주장별 3표 적대 검증 → 종합)로 PM/PL 산출물 흐름, IA/사이트맵 대 user flow,
   Kanban 원칙, 요구사항 추적성, 접근성(WCAG 2.2), immutable artifact/provenance,
   multi-repo 수렴, LLM schema 문서 생성을 조사했다. 접근일 2026-07-17.
3. **Synthesis**: 외부 모범 사례를 그대로 복사하지 않고 dependency-free 정적 HTML
   생성기, `file://` 동작, 소유권 분리, fail-open preview / fail-closed check,
   기능 500·work item 2,000·화면 100·흐름 50 규모 제약에 맞춰 판정했다.

제약 준수: 이번 조사는 읽기·분석·보고서 작성만 수행했다. 구현 코드, schema,
source data, test, hook, 생성 HTML은 수정하지 않았다. 시작 시점 git 상태
스냅샷(125개 변경 파일, 기존 dirty worktree)을 보존해 종료 시 비교했다
(24절 참조). 불확실한 사실은 `확인됨 / 추론 / 가설 / 미확인`으로 구분한다.

## 3. 현재 시스템은 정확히 무엇인가

상태: 확인됨

현재 시스템은 **Node.js 24 ESM 기반, 외부 의존성 없는 정적 HTML 생성기**로,
사람이 소유한 계획·구현 원본을 읽어 두 개의 생성 페이지를 만든다.

- **문서 허브** (`docs/index.html`): `README.md`, `docs/**/*.md`,
  `.harness/docs/**/*.md`, `specs/**/*.md`를 안전한 HTML projection으로 변환한
  범주·검색·목록·reader 화면 (`docs/planning-hub-handoff.md:29-31`).
- **Planning Hub** (`docs/planning.html`): 계획(사이트맵·기능 정의·사용자 흐름·
  추적성)과 구현 현황(기능 현황·전달 근거·동기화)을 stable ID로 연결한 화면.
  현행 구현은 8개 보기이며 (`docs/planning-hub-handoff.md:33-42`,
  `specs/010-planning-hub-redesign/verification.md:134-136`), 승인된 목표 구조는
  여섯 제품 보기 + `운영·고급` disclosure다 (`specs/010-planning-hub-redesign/spec.md:330-333`).

데이터 계층의 핵심 개념(모두 `specs/010-planning-hub-redesign/data-model.md`):

- planning-owned **FeatureDefinition** (카탈로그+상세의 결합 보기, 구현 상태를
  소유하지 않음, `data-model.md:117-142`) 1:N project-owned **FeatureWorkItem**
  (workType·Release·status·hold·task/evidence 참조, `data-model.md:228-258`).
- **PlanningManifest/Package**: schemaVersion·manifestVersion·projectId·
  sourceRevision·digest를 가진 immutable 배포 단위 (`data-model.md:160-187`).
- **PlanningLock**: 명시적 `planning:pull`만 원자 교체하는 수신 기록
  (`data-model.md:189-226`).
- **DeliveryEvidence**: consumed digest + downstream revision 기반의 구현·검증
  사실 (`data-model.md:300-319`).
- **SyncResult/ChangeProposal**: 양쪽 원본을 수정하지 않는 조정 projection과
  사람 결정이 필요한 역방향 제안 (`data-model.md:347-391`).

자동화는 Claude/Codex Stop hook(공용 adapter, fail-open) → 명시적
`mise run docs:build`/`planning:sync` → merge 전 `planning:check`(fail-closed)의
3층 구조다 (`docs/planning-hub-handoff.md:113-125`).

## 4. Source of Truth와 생성물 지도

상태: 확인됨

`data-model.md:3-22`의 Ownership Summary와 `docs/planning-hub-handoff.md:49-63`이
같은 소유권 지도를 선언한다.

| 계층 | 소유자 | 원본 | projection이 원본을 쓰는가 |
| --- | --- | --- | --- |
| 제품 계획 (need, screen-only sitemap, feature definition, flow, decision) | PM/PL·기획 | `data/sitemap.json`, `data/feature-relations.json`, `data/user-flows.json`, planning source | 아니오 |
| 게시 계약 | planning publisher | `planning-manifest.json` | compiler만 생성 |
| 계획 수신 | downstream 프로젝트 | `planning.lock.json` | `planning:pull`의 원자 교체만 |
| 구현 근거 | 개발·검증 담당 | `specs/<NNN>/status.yaml`·`tasks.md`·`verification.md`, test/code, Delivery Evidence | 원본 소유자만 |
| 차이 조정 | reconcile projection | Sync Result, Change Proposal | 어느 원본도 수정하지 않음 |
| 표시 | page-set generator | `docs/index.html`, `docs/planning.html` | 생성물만 교체 (양쪽 성공 시) |

주의할 성질: (a) 생성 HTML은 원본이 아니므로 절대 직접 편집하지 않는다
(`docs/planning-hub-handoff.md:63`). (b) 생성 출력은 다시 source 변경으로
취급되지 않아 재생성 loop가 차단된다 (`spec.md:401-402` FR-029,
`docs/planning-hub-handoff.md:120-121`). (c) 부분 실패 시 last-good 페이지
세트를 보존한다 (`docs/planning-hub-handoff.md:74-78`).

## 5. 구현 현황: 계획됨 / 부분 구현 / 완료 / 검증됨

상태: 확인됨 (tasks.md 체크 상태 + verification.md 기록 + 코드·테스트 대조)

`specs/010-planning-hub-redesign/tasks.md`는 130개 태스크 중 113개 완료,
17개 미완료다. 미완료 태스크는 US7 후반부와 최종 검증에 집중된다.

| 영역 | 상태 | 근거 |
| --- | --- | --- |
| 스키마·계약 (work-item, feature-detail, manifest, lock, evidence, proposal) | 구현 완료 + 테스트됨 | `specs/010-planning-hub-redesign/verification.md:156-161` (T102/T106 21/21) |
| FeatureWorkItem 정규화 (explicit/legacy, unspecified, unassigned) | 구현 완료 + 테스트됨 | `verification.md:165-169` (11/11) |
| 완료 가드·rollup (O(features+items), 500/2,000 표본 ~4ms) | 구현 완료 + 테스트됨 | `verification.md:173-177` (20/20) |
| workspace·demo 통합 (12 features, 3 flows, 의도적 drift) | 구현 완료 + 테스트됨 | `verification.md:181-186` (41/41) |
| 배치 중심 기능 탐색기 (Surface→Screen→그룹→정의) | 구현 완료 + 테스트됨 | `verification.md:190-195` (50/50) |
| 기능 컨텍스트 4열 Kanban (2,000 item ~87ms) | 구현 완료 + 테스트됨 | `verification.md:199-204` (74/74) |
| **여섯 제품 보기 + 운영·고급 재구성 (T118, T123)** | **계획됨 (미구현)** | `tasks.md:347,355` 미체크; 현 렌더러는 8개 view — `verification.md:134-136` |
| **사용자 흐름 goal story (T116, T119, T120)** | **계획됨 (미구현)** | `tasks.md:345,351-352` 미체크 |
| **추적성 coverage·gap·neighborhood (T117, T121, T122)** | **계획됨 (미구현)** | `tasks.md:346,353-354` 미체크; 현행은 12행 matrix — `verification.md:80` |
| **반응형·접근성 CSS 보완 (T124, T125)** | **계획됨 (미구현)** | `tasks.md:372,376` 미체크 |
| **문서·스킬 반영 (T126)** | **계획됨 (미구현)** | `tasks.md:385` 미체크 — 문서 드리프트의 구조적 원인 |
| 최종 통합 검증 (T127~T130) | 계획됨 (미실행) | `tasks.md:386-389` 미체크 |
| SC-001 실사용자 5명 사용성 세션 (T098) | 미수행 (의도적 보류) | `verification.md:149-150` — 자동 검증으로 대체하지 않음을 명시 |
| ROADMAP/CHANGELOG 완료 반영 (T101) | 의도적 보류 | `verification.md:215-216` |

브라우저 검증 주장의 범위: `verification.md`의 `file://` 브라우저 증거(US6,
2026-07-16)는 **8-view 구조 기준**의 검증이다(`verification.md:128-145`).
US7에서 추가된 탐색기·Kanban은 실행 테스트와 렌더러 테스트로 검증됐으나,
여섯 보기 재구성·flow story·traceability coverage는 화면 자체가 아직 없으므로
브라우저 검증도 존재하지 않는다. 과장 없이 정리하면: **데이터 계층은 완료·
테스트됨, 화면 계층은 US7 목표 IA의 약 절반이 미구현**이다.

## 6. PM/PL 표준 산출물 흐름 조사

외부 조사는 deep-research 워크플로(5개 각도, 원문 27건 fetch, 주장 115건 중
상위 25건 3표 적대 검증 → 23건 확정)로 수행했다. 접근일 2026-07-17.

### 6.1 산출물 생성 순서와 반복 관계

product goal → user journey → IA/sitemap → feature definition →
acceptance criteria → delivery tracking → traceability의 흐름은 개별 산출물
단위의 권위 근거들로 뒷받침되는 **종합 판단**이다(단일 표준이 이 순서 전체를
규정하지는 않는다 — 이 한계를 명시한다). 개별 근거:

- 요구사항 추적성은 상향 유도 경로와 하향 할당 경로를 모두 문서화하는 것으로
  정의되고(3.1.23), RTM은 요구사항과 분리된 "structured information artifact"다
  (3.1.24) — [ISO/IEC/IEEE 29148:2018](https://iso.org/standard/72089.html)
  (원문 대조는 제3자 호스팅 PDF로 수행, 정본은 유료 — 한계 명시). 검증 3-0.
- 사이트맵은 계층·그룹핑을 시각화해 정보를 찾게 하는 **조망(orientation)
  산출물**이다 — [Site Map Usability, NN/g](https://www.nngroup.com/reports/site-map-usability/).
  검증 3-0.
- acceptance criteria가 정의를 "구현 가능"하게 만드는 마지막 요소라는 판단은
  INVEST의 Testable("테스트를 쓸 수 있을 만큼 이해했다는 암묵적 약속")과
  29148의 Verifiable 특성으로 뒷받침된다 —
  [INVEST in Good Stories, Bill Wake](https://xp123.com/invest-in-good-stories-and-smart-tasks/). 검증 3-0.

현행 구조 대응: 저장소의 need → screen-only sitemap → feature
definition/detail → acceptance → work item → delivery evidence →
traceability link 파이프라인(`data-model.md` 전체)은 위 흐름과 정렬된다.
반복 관계는 Spec Kit Clarifications(`spec.md:19-38`)와 Change Proposal
역방향 흐름이 담당한다 — 표준 흐름의 "반복"을 자동 덮어쓰기가 아니라 사람
결정 게이트로 구현한 형태다.

### 6.2 조사 한계

progressive disclosure·recognition over recall·information scent의 NN/g
원문과 ISO 9241 대화 원칙은 fetch됐으나 이번 검증 표본(상위 25건)에 들지
않아 **적대 검증을 통과한 주장 집합에는 없다**. 해당 원칙을 인용하는 절
(9·10절)에서는 이를 "fetch됨·모순 미발견·미검증"으로 구분 표기한다. 출처를
만들어내지 않는다.

## 7. 기능정의서의 최소 구현 정보

상태: 확인됨 (외부 표준 ↔ 현행 계약 대조)

### 7.1 외부 기준

- **ISO/IEC/IEEE 29148:2018 5.2.5**: 개별 요구사항이 "shall possess"해야 하는
  9개 특성 — Necessary, Appropriate, Unambiguous, Complete, Singular,
  Feasible, **Verifiable**, Correct, Conforming
  ([ISO 29148:2018](https://iso.org/standard/72089.html), 검증 3-0).
  Verifiable은 "유한하고 비용 효율적인 과정으로 충족을 증명할 수 있고,
  측정 가능할 때 강화된다".
- **INVEST의 Testable**: 스토리 카드는 "테스트를 쓸 수 있을 만큼 요구를
  이해했다는 암묵적 약속"을 담는다
  ([Bill Wake, 2003](https://xp123.com/invest-in-good-stories-and-smart-tasks/), 검증 3-0).
- "사람과 AI 모두에게 구현 가능"이라는 프레이밍은 표준 인용이 아니라 설계
  추론임을 명시한다(검증 노트 그대로).

### 7.2 현행 FeatureDetail 계약 대조

`data-model.md:99-115`의 11개 그룹(identity, intent, scope, behavior, states,
rules, interfaces, quality, acceptance, traceability, decisions)을 9개 특성에
대응하면:

| 29148 특성 | 현행 계약의 대응 |
| --- | --- |
| Verifiable | acceptance 그룹 — "최소 1개의 측정 가능한 criterion" 필수 (`data-model.md:111`), 완료 가드가 passed 결과를 요구 (`data-model.md:262-275`) |
| Complete / Singular | behavior(정상·대안·실패)와 states(processing/empty/error/permission) 그룹의 "적용 가능 상태 정의 또는 사유 있는 면제" (`data-model.md:107`) |
| Unambiguous / Correct | provenance 보존 — confirmed/inferred/question 구분, 미확인 사실 생성 금지 (FR-012, `spec.md:354-356`) |
| Necessary / Appropriate | intent 그룹의 problem·actor·goal·outcome·evidence (`data-model.md:104`) |
| Feasible / Conforming | decisions 그룹(열린 결정에 owner·해결 조건)과 schema validation |

판정: **현행 FeatureDetail 계약은 표준이 요구하는 최소 정보를 충족하고
일부(상태별 면제 사유, provenance 구분)는 표준을 상회한다.** "어디에(placements
primary/entry/result/support), 무엇을(behavior), 왜(intent.problem/goal), 어떤
조건에서 완료(acceptanceCriteria + 완료 가드)"가 모두 계약에 존재하므로 조사
질문 2의 답은 "계약상 가능"이다. 남는 조건은 실데이터 품질 — Community Demo
표본은 SC-003 계열 검증을 통과했고(`verification.md:28-31`), 실제 프로젝트
데이터에서는 `정의 불완전` health가 누락을 노출한다 (FR-013).

AI 생성 관점의 한계: LLM이 schema 문서를 생성할 때 provenance·unknown·
confidence·validation을 보존하는 **권위 있는 필드 수준 패턴은 외부 조사에서
검증 생존하지 못했다**(워크플로 open question). 현행 confirmed/inferred/
question 3값 설계는 표준 부재 속의 자체 설계이며, 외부 근거로 정당화하지
않는다.

## 8. 현재 정보구조와 화면 사용성 평가

상태: 확인됨 (생성 HTML + 렌더러 코드 대조)

### 8.1 상위 정보구조 — 승인안과 다른 8개 평면 탭

현행 `docs/planning.html` 사이드바는 **8개 보기가 동급으로 평면 노출**된다:
개요·화면 구조·기능 정의·기능 현황·사용자 흐름·추적성·**전달 현황·동기화**
(`docs/planning.html:2236`, `.harness/scripts/docs/lib/render-planning-page.mjs:16-25`
`PLANNING_VIEWS` 8개). `운영·고급` disclosure는 존재하지 않는다. 승인 결정
2·3·4(여섯 제품 보기 + 운영·고급, Delivery Evidence 흡수)와 어긋나며, 원인은
T118/T123 미착수다 (`specs/010-planning-hub-redesign/tasks.md:347,355`).

### 8.2 보기별 현황

| 보기 | 현행 상태 | 승인안 대비 |
| --- | --- | --- |
| 화면 구조 | screen-only. 조직도(SVG, 실선 hierarchy/점선 direct-nav + 범례) + `키보드 트리`(`role="tree"`) + 화면 비교표 3표현이 같은 screen ID 공유 (`docs/planning.html:2238-2263`, `layout-sitemap-org-chart.mjs:135-146`) | 일치 (결정 5·6·7). 단 보조 트리 명칭이 `계층 목록(접근성 보기)`가 아니라 `키보드 트리` — FR-070 위반 (`spec.md:504-505`) |
| 기능 정의 | Surface→Screen→기능 그룹→정의 배치 탐색기 구현 (`render-feature-workbench-view.mjs`) | 일치 (결정 8·9) |
| 기능 현황 | 4열 Kanban(예정/진행 중/검토·검증/완료) + 좌측 선택 기능 컨텍스트 카드. **그러나 보드 카드는 선택 기능으로 필터되지 않음** — `selectFeature`는 컨텍스트 카드·상세만 토글하고(`render-planning-page.mjs:257-263`) `applyWorkItemFilters`는 Release·그룹·workType·보류·검색만 적용 (`render-planning-page.mjs:300-326`) | 부분 구현 (결정 12). 실질은 "전체 작업 Kanban + 기능 컨텍스트 패널" |
| 사용자 흐름 | actor/goal story + 결정·실패·복구 분기 + 순서형 대안 + bounded traversal/cycle 감지 구현 (`build-user-flow-story.mjs:164-185`, `docs/planning.html:2555-2564`). `tests/planning-user-flow-story.test.mjs` 직접 실행 pass (exit 0) | 실질 일치 (결정 13). 단 tasks.md T116·T119·T120 체크박스 미갱신 |
| 추적성 | **전체 matrix 한 장**(기능·요구·화면·흐름·Spec 5열 전량 나열, `render-planning-page.mjs:175-180`). coverage·gap queue·local neighborhood 없음 — `build-traceability-coverage.mjs`/`render-traceability-coverage-view.mjs` 파일 자체가 부재 | 미구현 (결정 14). T117·T121·T122 미착수 |
| 전달 현황 / 동기화 | 독립 탭 2개로 존재 (3개 렌즈 카드 + 변경 제안 / source 해시·drift 상태) | 승인안은 흡수·이동 (결정 3·4) — 미전환 |

### 8.3 근거 충돌 기록과 해소

조사 중 두 에이전트의 판정이 충돌했다: 생성 HTML 구조 조사는 기능 현황을
"선택 기능 컨텍스트 방식"으로, 렌더러 코드 조사는 "전체 작업 Kanban"으로
판정했다. 클라이언트 스크립트를 직접 확인한 결과
(`render-planning-page.mjs:257-326`) 선택 기능은 컨텍스트 카드·상세 표시만
바꾸고 보드 카드 집합은 바꾸지 않으므로 **후자가 정확하다**. HTML 구조만
보면 컨텍스트 방식으로 오인되는 점 자체가 이 화면의 의미 전달 문제를
보여준다 (18절 P1 발견으로 기록).

### 8.4 접근성 현황

갖춘 것: `prefers-reduced-motion` 1건(`docs/planning.html:1885`),
`role="tree"`+`aria-level` 키보드 대안, `role="status"` 36건, surface 색상에
텍스트 라벨 병기(색상 비의존), 조직도 캔버스 tabindex+방향키 조작,
hub.css에 focus-visible/reduced-motion 15곳.

빈 곳: skip link 0건, `aria-live` 속성 0건(role="status"로만 대체),
sr-only 유틸 0건, 900px·600px breakpoint와 44px 컨트롤 등 T124/T125 접근성
보완 미착수 (`tasks.md:372,376`). bounded rendering(활성 DOM 상한)도 없어
2,000 work item이 전량 DOM에 렌더된다 (`render-feature-workbench-view.mjs:382-388`).

## 9. 사이트맵 표현 방식 비교

외부 기준: 사이트맵의 1차 기능은 계층·그룹핑 시각화를 통한 findability다
([NN/g Site Map Usability](https://www.nngroup.com/reports/site-map-usability/),
검증 3-0). 캔버스형 표현은 WCAG 2.2 Reflow(1.4.10, 320 CSS px에서 2차원
스크롤 금지)와 Keyboard(2.1.1)의 제약을 받는다
([W3C Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow), 검증 3-0).

| 기준 | 가로 조직도 (현행 기본) | 자유 그래프 | 계층 트리·표 (현행 대안) |
| --- | --- | --- | --- |
| 장점 | 홈 중심 공간 조망, surface 군집, hierarchy/direct-nav 구분 표현 | 임의 관계 표현 자유, 순환·교차 링크 자연스러움 | 검색·정렬·스크린리더 최적, reflow 완전 대응, 구현 단순 |
| 단점 | 캔버스 접근성 보완 필수(대안 제공 시 해소), 대규모에서 pan/zoom 의존 | 100 screen에서 hairball화, 결정론적 배치 곤란(빌드 재현성 위협), 접근성 최악 | 공간 조망 부족, direct-nav 표현이 셀 텍스트로 제한 |
| 인지 비용 | 중 (범례 학습 후 낮음) | 높음 | 낮음 (단 전체 구조 파악은 느림) |
| 확장성 (100 screen) | 중 — fit/zoom·surface filter 필요 | 낮음 | 높음 |
| 접근성 | 대안 병행 필수 (현행: 트리·표 제공) | 대안 필수 + 좌표 의미 전달 곤란 | 그 자체가 접근성 보기 |
| 데이터 계약 영향 | 없음 (OrganizationLayout은 generated-only, `data-model.md:430-444`) | 결정론 좌표 계약 신설 필요 | 없음 |
| 현 구조 구현 비용 | 0 (구현·검증됨) | M~L | 0 (구현됨) |

**판정: 현행 "조직도 기본 + 트리·표 대안" 병행 유지.** 자유 그래프는
결정론적 생성(FR-029, 같은 입력=같은 결과)과 정면 충돌해 배제한다. 유지
조건: (a) 보조 트리 명칭을 FR-070대로 `계층 목록(접근성 보기)`로 정정,
(b) 100 screen 규모에서 surface filter·검색이 조직도와 동기화됨을 유지.

첨부 이미지(`social-media-app-sitemap.png` — 세로형 손그림 사이트맵) 대비:
이미지의 표현 풍부함(유형별 색·아이콘, 양방향 화살표, 유틸리티 페이지 우측
군집, 의미 클러스터)은 현행 조직도의 규칙화된 표현(surface 3색+라벨,
실선/점선)보다 시각적 밀도가 높다. 그러나 색·아이콘 의존 표현은 WCAG
1.4.1(색상 비의존, Level A,
[W3C Understanding Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color),
검증 3-0)과 충돌 위험이 있어, 채택한다면 텍스트 라벨 병기를 유지한 채 "기능
그룹 시각 군집"만 선택적으로 검토할 것을 권장한다 (P3, 필수 아님).

## 10. 기능 정의 탐색 방식 비교

외부 기준: recognition over recall과 faceted search 원칙의 NN/g 원문은
fetch됐으나 적대 검증 표본에 들지 않았다(6.2절) — 아래 판단은 저장소 근거와
검증된 사이트맵 원칙(조망 산출물로서의 배치 계층)에 우선 의존한다.

| 기준 | 배치 중심 (현행: Surface→Screen→그룹→정의) | 기능 목록 중심 | 문서 목차 중심 |
| --- | --- | --- | --- |
| 장점 | "어디에 무엇을 만드는가"에 직접 답, 화면 문맥 유지, 중복 정의 발견 용이 | 대규모 스캔·정렬·비교 유리, 구현 단순 | 정적 문서 친화, 인쇄·공유 용이 |
| 단점 | 미배치 기능의 별도 버킷 필요(현행 구현됨), 탐색 깊이 3~4단계 | 화면 문맥 상실 — 같은 이름 기능의 배치 구분 곤란 | 500개 규모에서 탐색성 최저, 상태·관계 표현 부적합 |
| 인지 비용 | 낮음 (제품 구조 그대로) | 중 (필터 조합 학습) | 높음 (스크롤 탐색) |
| 확장성 (500 기능) | 높음 — 화면당 기능 수로 자연 분할 | 중 — 검색·가상화 필요 | 낮음 |
| 접근성 | 트리·목록 기반이라 양호 | 표 기반 양호 | 양호하나 깊은 스크롤 |
| 데이터 계약 영향 | 없음 (placements 계약 기구현) | 없음 | 없음 |
| 현 구조 구현 비용 | 0 (T111~T114 구현·테스트됨) | 0 (검색·필터가 이미 목록 축 제공) | 불채택 권장 |

**판정: 배치 중심 유지 (결정 8), 검색 다축(이름·목표·화면·그룹, 결정 9)이
목록 중심의 장점을 이미 흡수한다.** 유지 조건: zero-result 필터 시 이전
상세를 남기지 않는 현행 동작(`verification.md:194`)과 미배치 기능 버킷 유지.

## 11. 기능 현황 표현 방식 비교

외부 기준: 공식 [Kanban Guide](https://kanbanguides.org/the-kanban-guide/)의
Definition of Workflow(DoW)는 6개 필수 요소를 요구한다 — work item 정의,
started/finished 경계, 정의된 상태들, WIP 통제 방식, **상태별 명시적 흐름
정책**, SLE (검증 3-0, v2025.5와 2020.12 판 동일). "최소 DoW 요소를 보드에
투명하게 표시하는 것이 essential"이다 (검증 3-0).

현행 구조 대조: FeatureWorkItem의 4개 base status = 정의된 상태들, 완료
가드(task 완료+acceptance passed+evidence+blocker 0) = 상태별 명시적 정책의
모범적 구현이며 카드에 차단 사유가 표시된다. `hold`를 별도 열이 아닌 속성으로
둔 것은 Guide가 blocked를 상태가 아닌 능동 관리 대상으로 다루는 방향과
부합한다. WIP limit과 SLE는 없다 — 이 허브는 실행 보드가 아니라 **현황
projection**이므로 pull 신호가 성립하지 않아 미채택이 타당하다(다만 전체
작업 Kanban을 기본으로 삼으면 WIP 통제 없는 전체 흐름 보드가 되어 Guide
관점에서도 어중간해진다).

| 기준 | 선택 기능 작업 Kanban (승인안) | 전체 작업 Kanban (현행 동작) | 기능별 계층·목록 (현행 대안) |
| --- | --- | --- | --- |
| 장점 | 기능 완료 판단에 직결, 카드 수 자연 bounded, 정의↔현황 왕복과 정합 | 팀 전체 흐름·병목 조망 | 1:N 관계 명시적, 정의 문맥 유지 |
| 단점 | 전체 조망은 별도 진입 필요 | 2,000 카드 시 인지·DOM 부담, "선택 기능" 컨텍스트와 의미 충돌(8.3절 오인 사례) | 흐름·병목 시각화 없음 |
| 인지 비용 | 낮음 | 높음 (규모 비례) | 중 |
| 확장성 (2,000 작업) | 높음 (기능당 수십 개) | 낮음 — bounded rendering 필수 | 중 |
| 접근성 | 열 4개 고정, 카드 소수 — 키보드 순회 용이 | 카드 수천 개 순회 부담 | 목록 기반 양호 |
| 데이터 계약 영향 | 없음 (rollup·필터 계약 기구현) | 없음 | 없음 |
| 현 구조 구현 비용 | S — selectFeature에 카드 필터 추가 | 0 (현행) | 0 (구현됨) |

**판정: 결정 12 유지 — 선택 기능 컨텍스트 Kanban을 기본으로, "전체 작업
보기"는 명시적 전환으로 제공.** 현행 구현은 사실상 두 번째 열(전체 Kanban)에
머물러 있으므로 P1 발견 3의 필터 보완이 필요하다. 완료 가드·hold 정책·차단
사유 표시는 외부 기준(명시적 상태 정책의 투명한 표시)에 정확히 부합하므로
그대로 유지한다.

## 12. 사용자 흐름 표현 방식 비교

외부 기준: 사이트맵(구조 조망) 대 user flow(단계 경로)의 역할 구분은 NN/g
근거로 검증됐다(3-0, 단 명시적 대비는 종합임을 병기 — 6.1절). 표현 선택에는
WCAG Keyboard 2.1.1(Level A)·Reflow 1.4.10(AA)이 정규 제약으로 작용한다.

| 기준 | goal story (현행) | swimlane | BPMN·전통 flowchart |
| --- | --- | --- | --- |
| 장점 | actor·goal 명시, 정상 경로 순서 + 분기를 발생 단계에 부착, 순서형 텍스트 대안이 자연스러움 | 다역할 책임 구분 시각화 | 표준 기호, 도구 생태계 |
| 단점 | 다역할 동시 표현 약함(조건부 role lane로 보완됨) | 가로 폭 소비 커서 320px reflow 곤란, 정적 생성 복잡 | PM/PL 비전문 사용자에 기호 학습 비용, dependency-free 정적 생성에 과중 |
| 인지 비용 | 낮음 (이야기 순서) | 중 | 높음 |
| 확장성 (50 flow) | 높음 — flow당 독립 story | 중 | 중 |
| 접근성 | 순서형 대안 내장 (`docs/planning.html:2435`) | 2차원 격자라 선형화 비용 큼 | 도식 의존 — 대안 별도 제작 필요 |
| 데이터 계약 영향 | 없음 (UserFlowStory projection 기구현) | lane 축 필드 신설 필요 | 표기 변환 계층 신설 필요 |
| 현 구조 구현 비용 | 0 (구현·테스트 통과 — 본 조사에서 직접 실행) | M | L |

**판정: goal story 유지 (결정 13).** 결정·실패·복구 분기가 발생 단계에
연결되고(`build-user-flow-story.mjs:164-185` bounded traversal + cycle 감지)
순서형 대안이 접근성 요건을 충족한다. swimlane은 다역할 흐름이 실제로
필요해질 때 조건부 role lane 확장(T120에 부분 구현)으로 대응하고, BPMN은
사용자·제약 양쪽에 맞지 않아 배제한다.

## 13. 대규모 추적성 표현 방식 비교

외부 기준: ISO/IEC/IEEE 29148:2018은 추적성을 상향(parent·stakeholder needs)과
하향(하위 요구·아키텍처·구현 요소·검증/테스트) **다방향 1급 링크**로 정의하고
(maintain-traceability 절, 검증 3-0), RTM을 요구사항 원본과 분리된 "structured
information artifact"(3.1.24)로 규정한다 — 즉 matrix는 원본이 아니라
projection이며, 기본 화면일 필요가 없다는 현행 설계 방향과 부합한다.

한계 명시: 대규모 matrix/graph의 **인지부담을 줄이는 표현 기법**에 대한 1차
출처 주장은 검증에서 생존하지 못했다(워크플로 open question). 아래 인지 비용
평가는 (a) 검증된 WCAG Reflow 제약(320 CSS px에서 2차원 스크롤 금지 — 수백
열·행 matrix 기본 화면에 정규적으로 불리), (b) 저장소의 규모 목표(SC-020:
기본 관계 탐색기는 선택 깊이 밖 전체 관계망을 표시하지 않음)에 근거한다.

| 기준 | coverage + gap queue + local neighborhood (승인안) | 전체 matrix (현행) | 전체 graph |
| --- | --- | --- | --- |
| 장점 | 행동 가능(무엇부터 고칠지 정렬), bounded DOM, 선택 문맥 유지 | 전수 조망, 진단·CSV export에 적합, 구현 단순 | 관계 구조 직관 |
| 단점 | 구현 비용 최대, 전수 확인은 보조 보기로 이동 | 500행×5열에서 스캔 불가, reflow 곤란, "다음 행동" 부재 | hairball, 결정론 배치 곤란, 접근성 최악 |
| 인지 비용 | 낮음 (요약→큐→국소 확장) | 높음 (규모 비례) | 매우 높음 |
| 확장성 (500 기능/2,000 작업) | 높음 — neighborhood 깊이 상한 | 낮음 | 낮음 |
| 접근성 | 요약 카드+목록 기반 양호 | 거대 표 — 스크린리더 순회 부담, 320px에서 2차원 스크롤 | 대안 별도 제작 필요 |
| 데이터 계약 영향 | 없음 — TraceabilityCoverage 계약 기정의 (`data-model.md:334-345`) | 없음 | 결정론 레이아웃 계약 신설 |
| 현 구조 구현 비용 | L (T117·T121·T122) | 0 (현행) | 불채택 권장 |

**판정: 결정 14 유지 — coverage+gap+bounded neighborhood 기본, matrix/CSV
보조.** 전체 graph는 사이트맵 자유 그래프와 같은 이유(결정론·접근성)로
배제한다. 유지 조건: gap 항목은 severity 정렬 + 복구 행동 포함(FR-016),
neighborhood는 Need·Feature·Screen·Flow·Spec·WorkItem·Verification 7종
인덱스를 워크스페이스당 1회 구축(`data-model.md:344-345`)해 SC-020 성능
목표를 지킨다.

## 14. Top-down / Bottom-up / Planning Hub 분리 아키텍처

상태: 확인됨 (구현), 일부 추론 (향후 분리 시나리오)

### 14.1 현행 구조

Top-down: planning source(need·screen-only sitemap·feature definition·flow·
decision) → `compile-planning-manifest.mjs`가 canonical JSON + SHA-256 digest로
immutable manifest 생성 (`compile-planning-manifest.mjs:35-44`) → downstream이
`mise run planning:pull`로만 명시 수신, Planning Lock 원자 교체
(`apply-planning-lock.mjs:25-46`). Stop hook·watcher·CI는 Lock을 바꾸지 않는다
(`docs/planning-hub-handoff.md:91-93`).

Bottom-up: downstream의 `specs/<NNN>/status.yaml`·`tasks.md`·`verification.md`·
test/code 근거 → Delivery Evidence(consumed digest + source revision 포함) →
reconcile이 stable ID·digest 비교로 aligned/behind/drifted/conflicted/
collection-failed 계산 (`reconcile-planning-delivery.mjs:110-123`). 차이는
Change Proposal로만 표현되고 어느 원본도 수정되지 않는다
(`docs/planning-hub-handoff.md:102-106`, `data-model.md:373-391`).

경계 방어: 입력은 `structuredClone`으로 복제돼 원본이 보호되고
(`build-workspace-hub-model.mjs:10-12,35-46`), path는 저장소 밖 접근·symlink·
credential URL·command/executable 필드를 거부한다
(`planning-contracts.mjs:114-140`, `planning-sync.mjs:49-53,87-88`). invalid
항목은 버리고 health로 보고하며 last-good projection을 보존한다
(`reconcile-planning-delivery.mjs:92-105`) — FR-069 일치.

### 14.2 향후 별도 `planning-hub` 저장소 분리 가능성

판정: **분리 가능한 계약이 이미 준비돼 있다** (조건부).

- 이식성은 US5에서 계약 수준으로 검증됐다: 서로 다른 두 저장소 경로에 동일
  planning source를 복제해 stable feature ID와 manifest digest 동일성을 확인
  (`verification.md:61-66`).
- `data-model.md:160-165`가 PlanningPackage를 "manifest envelope의 후속 의미"로
  정의해 transport 교체 시에도 entity 식별과 수신 의미가 보존되도록 했다.
- 분리 시 유지해야 할 계약 (`docs/planning-hub-handoff.md:141-159`):
  repository-relative descriptor, stable ID, canonical digest, 명시적 수신
  경계(`planning:pull`), Change Proposal 역방향 흐름.
- 분리 시에도 금지해야 할 자동 쓰기: candidate manifest 자동 적용, 자동
  latest 추종(`behind` 상태 + 명시 수신만 허용, `spec.md:185-187`), planning
  저장소가 downstream의 Spec·task·work item을 사전 생성·수정하는 것
  (FR-066·067, `spec.md:493-497`), 원격 저장소 clone/fetch/push·PR 자동 생성
  (`docs/planning-hub-handoff.md:143-144`).

남은 위험 (추론): (a) transport 계층(원격 manifest 수신)의 인증·무결성 검증은
미설계 — 후속 feature에서 digest 검증을 유지한 채 추가해야 한다. (b) 현재
Delivery Evidence 수집기는 단일 저장소 내 상대 경로 기반이므로, 분리 후
multi-repo evidence 집계 방식(프로젝트별 수집 → planning 저장소 게시)은 별도
승인 결정이 필요하다 (23절 열린 질문).

## 15. Claude / Codex / 사람 편집 자동화와 수렴성

상태: 확인됨

### 15.1 수렴 구조 — 같은 코어, 두 정책 계층

세 편집 경로(Claude, Codex, 사람 직접 편집)는 **동일한 코어 구현**
(`planning-sync.mjs`/`build-hub.mjs`/`planning-check.mjs`)으로 수렴한다.

- Claude Stop: `.claude/settings.json:104-117` →
  `.harness/hooks/docs-build-on-stop.mjs:128` `runPlanningSyncIfRelevant()`.
- Codex Stop: `.codex/hooks.json:16-27` → `.harness/hooks/codex-stop.mjs:9,13`이
  같은 함수 호출. 차이는 trigger 라벨(`codex-stop.mjs:38`), root 재확정
  (`git rev-parse`, `codex-stop.mjs:16-24`), stdin/stdout 계약(`:26-45`)뿐.
- 사람 직접 편집: hook을 타지 않지만
  `.harness/scripts/checks/ci-node-verify.sh:302-305`가 `planning-check.mjs`를
  무조건 실행하고, `.github/workflows/pipeline.yml:3-6,76-80`이
  `pull_request: [dev,main]`에서 이를 호출한다.

정책 분리: preview(Stop hook)는 fail-open — 예외를 삼키고 경고만 출력
(`docs-build-on-stop.mjs:91-102`), config 오류도 health로 강등
(`scan-workspaces.mjs:28,33,42-43`). merge-ready(CI)는 fail-closed —
stale/missing 생성물, digest 불일치, broken relation, unresolved conflict에서
exit 1 (`planning-check.mjs:44-78`). 같은 코어에 mode(`preview`/`strict`)만
바꿔 두 정책을 구현한다. 이는 승인 결정 17과 정확히 일치한다.

### 15.2 소유권 침범 없음 — 자동 쓰기 전수 확인

자동화가 쓰는 대상은 생성물 2개(`docs/index.html`, `docs/planning.html`,
`build-hub.mjs:151-158`)와 자동화 기록(`.harness/state/planning-automation.json`,
`planning-sync.mjs:157-158`)뿐이다. manifest·lock·evidence·status.yaml에 대한
자동 쓰기 경로는 없다: `status-sync.mjs:76-92`는 `--apply`일 때만 수정(기본
check-only), `aggregate-feature-work-items.mjs`는 writeFileSync 0건, Planning
Lock 쓰기는 `--pull` 명시 실행 하나뿐이다 (`planning-sync.mjs:170-183`,
`apply-planning-lock.mjs:25-46` — projectId 불일치 throw + 임시파일 원자
교체). 생성물 경로는 change-detection 입력에서 제외돼 재생성 loop가 차단된다
(`docs-build-on-stop.mjs:26-28`, `planning-sync.mjs:95`). 동일 입력은 input
digest로 skip돼 멱등이다 (`planning-sync.mjs:148-152`).

### 15.3 수렴성 갭 4건

1. **[P1] CI check의 실효성이 branch protection 설정에 의존** —
   `planning-check`는 CI의 한 step이며, 저장소 안에서는 required status check
   지정 여부를 확인할 수 없다. required가 아니면 CI가 실패해도 merge가
   가능해 fail-closed가 무력화된다. 사용자 확인 필요 (23절).
2. **[P3] commit 시점 gate 없음** — 정합성 검사는 Stop(비차단)과 CI(merge)에만
   있다. 의도된 설계(비차단 편의 + merge gate)로 판단한다.
3. **[P3] CI는 검증만, self-heal 없음** — 사람이 소스만 고치고 push하면 CI가
   stale generated output으로 차단하지만 자동 수정은 하지 않는다. CI read-only
   원칙과 일치하는 의도적 설계다.
4. **[P3] Codex root 폴백 엣지** — `git rev-parse` 실패 시 cwd 폴백
   (`codex-stop.mjs:23`)으로 서브디렉토리에서 상위 planning 변경을 놓칠 수
   있다. fail-open이라 손실은 projection 최신성뿐이다.

## 16. 승인된 17개 결정 검증

판정 기준: 결정 자체의 타당성(유지/조건부 유지/변경/제거)과 구현 상태를
분리해 기록한다. 17개 결정 모두 spec 문서에 명시 위치가 존재한다(미명시 0건).

| # | 결정 | 판정 | 구현 상태 | 핵심 근거 |
| --- | --- | --- | --- | --- |
| 1 | 문서 허브·Planning Hub 별도 HTML | 유지 | 구현 완료 | `spec.md:432-433` FR-041, `build-hub.mjs:148-158` 원자적 page-set 교체 |
| 2 | 일상 제품 보기 정확히 여섯 개 | 유지 | **미구현** (8개 평면 탭) | `spec.md:486-488` FR-063 vs `render-planning-page.mjs:16-25` |
| 3 | version/digest·sync·automation은 운영·고급 | 유지 | **미구현** (sync 독립 탭) | `contracts/hub-view-contract.md:11-13` vs 생성물 8탭 |
| 4 | Delivery Evidence를 개요·기능 현황에 흡수 | 유지 | **미구현** (delivery 독립 탭) | `spec.md:478-479` FR-060; 기능 현황 카드에 Task/Acceptance/Evidence/Blocker 이미 표시돼 흡수 기반은 존재 |
| 5 | 사이트맵은 screen만 | 유지 | 구현 완료 | `spec.md:333-334` FR-004, 생성물에 기능/Spec/test 노드 0개 |
| 6 | hierarchy ≠ direct navigation | 유지 | 구현 완료 | `layout-sitemap-org-chart.mjs:135-146` 실선/점선+범례 |
| 7 | 조직도·계층 목록·비교표 = 같은 screen ID | 유지 | 구현 (명칭 갭) | 3표현 존재·ID 공유 확인. 단 보조 트리 명칭이 `키보드 트리`로 FR-070의 `계층 목록(접근성 보기)`와 불일치 |
| 8 | 탐색축 Surface→Screen→기능 그룹→정의 | 유지 | 구현 완료 | `spec.md:458-460` FR-052, `render-feature-workbench-view.mjs` 탐색기 |
| 9 | 검색: 이름+사용자 목표+화면+기능 그룹 | 유지 | 구현 완료 | `spec.md:463-464` FR-054 |
| 10 | FeatureDefinition 1:N FeatureWorkItem | 유지 | 구현 완료 + 테스트 | `feature-work-item-schema.json:8` featureDefinitionId, `normalize-feature-work-items.mjs:133-139` |
| 11 | Release는 work item 속성; 정의에 저장소 위치 금지 | 유지 | 구현 완료 (스키마 강제) | `feature-work-item-schema.json:12` repository 필드 금지, `normalize-feature-work-items.mjs:141-148` |
| 12 | 기능 현황 기본 = 선택 기능 컨텍스트 4열 Kanban | **조건부 유지** | 부분 구현 | 4열·컨텍스트 카드·기능별 대안은 있으나 선택 기능이 보드 카드를 필터하지 않음 (`render-planning-page.mjs:257-326`). 조건: 선택 기능 필터를 카드 집합에 적용하고 "전체 작업 보기"로 나가는 명시적 전환을 함께 제공 |
| 13 | 사용자 흐름 = actor/goal story + 결정·실패·복구 | 유지 | 구현 실질 완료 (체크박스 미갱신) | `build-user-flow-story.mjs:164-185`, 테스트 직접 실행 pass |
| 14 | 추적성 기본 = coverage+gap+bounded neighborhood | 유지 | **미구현** (전체 matrix만) | `render-planning-page.mjs:175-180`; coverage 모듈 파일 부재 |
| 15 | planning package immutable 명시 수신 | 유지 | 구현 완료 + 테스트 | `apply-planning-lock.mjs:25-46`, `planning-sync.mjs:170-183` --pull 전용 |
| 16 | bottom-up 차이는 Change Proposal | 유지 | 구현 완료 + 테스트 | `reconcile-planning-delivery.mjs:110-123`, 원본 미수정 검증 (`verification.md:39-40`) |
| 17 | Stop hook은 피드백, 최종 보장은 sync/check+CI | **조건부 유지** | 구현 완료 | 코어 공유·fail-open/closed 분리 확인 (15절). 조건: `planning-check`가 포함된 CI job을 branch protection required check로 지정했는지 확인 — 미지정이면 fail-closed가 무력 |

요약: 결정 자체를 변경하거나 제거할 것은 없다. 15개 유지, 2개(12·17) 조건부
유지. 미구현 4건(2·3·4·14)은 결정의 문제가 아니라 T117~T123 미착수의 문제로,
모두 기존 계약을 보존하는 추가 구현으로 해결된다.

## 17. 15개 항목 Scorecard

각 10점 만점. `현재 → 목표`와 도달 조건을 함께 기록한다. 외부 판단 기준은
6~13절에서 검증된 근거를 참조한다.

| # | 항목 | 현재 | 목표 | 근거와 도달 조건 |
| --- | --- | --- | --- | --- |
| 1 | 목적과 용어의 명확성 | 6 | 9 | 8개 평면 탭이 제품/운영 목적을 섞음(`render-planning-page.mjs:16-25`); 용어 자체(우선순위 legend, DEMO DATA 배지)는 우수. 조건: T123 여섯 보기+운영·고급 전환, T126 문서 정합 |
| 2 | 첫 화면의 정보 위계 | 6 | 9 | 개요가 delivery 렌즈·coverage 요약을 아직 흡수하지 않음(FR-017 미구현). 조건: 개요에 "계획·전달·조정 coverage와 다음 행동" 흡수 |
| 3 | 화면·기능 배치 탐색성 | 8 | 9 | Surface→Screen→그룹→정의 탐색기 구현·테스트됨(50/50, `verification.md:190-195`). 조건: zero-result·미배치 버킷 동작 유지 + FR-070 명칭 정정 |
| 4 | 기능정의의 구현 가능성 | 9 | 9 | ISO 29148 5.2.5의 9특성 충족(7.2절 대조); acceptance 필수·완료 가드 구현. 조건: 실데이터에서 `정의 불완전` health 운용 유지 |
| 5 | FeatureDefinition 1:N FeatureWorkItem 적합성 | 9 | 9 | 스키마 강제(repository 필드 금지 포함)+정규화+legacy 투영+테스트(`normalize-feature-work-items.mjs`). 감점 1은 실프로젝트 적용 실적 부재 |
| 6 | 기능현황의 행동 가능성 | 6 | 9 | 완료 가드·차단 사유 표시는 Kanban Guide의 명시적 정책 원칙에 부합(11절); 선택 기능 필터 부재가 완료 판단을 흐림. 조건: P1 발견 3 보완 |
| 7 | 사용자 흐름의 이해 가능성 | 8 | 9 | goal story+분기+순서형 대안 구현, 테스트 통과(본 조사 직접 실행). 조건: render 테스트 잔여분 확인 + 체크박스 정합(N2) |
| 8 | 대규모 추적성의 사용성 | 3 | 8 | 전체 matrix만 존재(13절); SC-020 미검증. 조건: T117·T121·T122 + 규모 회귀 |
| 9 | source of truth와 provenance 명확성 | 9 | 10 | 소유권 표(`data-model.md:3-22`)+digest 계약+생성물 명시("생성물 · mise run docs:build" 표기). 조건: 화면에 원본 경로 노출을 운영·고급에서 일관 제공 |
| 10 | top-down/bottom-up 조정 안전성 | 9 | 9 | 자동 쓰기 전수 확인 결과 침범 0(15.2절), last-good 보존, Change Proposal 원본 미수정 검증(`verification.md:39-40`) |
| 11 | Claude/Codex/사람 자동화 동등성 | 8 | 9 | 동일 코어+mode 분리(15.1절), SC-007 계열 테스트 통과. 조건: branch protection required check 확인(P1 발견 5) |
| 12 | 접근성 및 반응형 설계 | 6 | 8 | reduced-motion·role=tree·색상 비의존 라벨은 구현(8.4절, WCAG 1.4.1/2.1.1 부합); skip link·aria-live·44px·600px breakpoint 미비. 조건: T124·T125 + SC-022 기록. 참고: prefers-reduced-motion의 근거 SC 2.3.3은 Level AAA(모범 사례) |
| 13 | 정적 생성 성능과 bounded rendering | 5 | 8 | 빌드 45ms·로드 66ms는 우수(`verification.md:81-82`)하나 활성 DOM 상한 없음(2,000 카드 전량). 조건: T128 + SC-023 검증 기록 |
| 14 | 향후 planning-hub 분리 가능성 | 8 | 9 | US5 이식성 계약 검증(`verification.md:61-66`), in-toto/SLSA digest-anchor 패턴과 정합(14.2절). 조건: transport·multi-repo evidence 설계는 별도 spec |
| 15 | 문서·스키마·코드·테스트 일관성 | 5 | 9 | 스키마↔코드↔테스트는 정합(605 pass)이나 문서 드리프트 4건(D1)+tasks 체크 드리프트+stale 생성물(planning:check exit 1). 조건: N1·N2·N5 완료 |

합계: 현재 105/150 → 목표 133/150. 최저점 3개(8·13·15)가 모두 미착수
태스크(T117~T130)와 문서 정합(N1·N2·N5)에 대응한다 — 점수를 올리는 길이
곧 기존 backlog의 완주다.

## 18. 발견 사항과 위험: P0 / P1 / P2 / P3

**P0(데이터 손상·잘못된 source of truth·자동 덮어쓰기·핵심 계약 위반): 0건.**
자동화의 쓰기 대상 전수 확인(15.2절), 원본 clone 격리, invalid 항목의
last-good 보존, Planning Lock의 --pull 전용 쓰기가 모두 코드·테스트로
확인됐다. 소유권 계층은 안전하다.

### [P1] 승인된 여섯 제품 보기가 미전환 — 8개 평면 탭이 현행 정본

- 상태: 확인됨
- 사용자 영향: 처음 보는 PM/PL·개발자가 `전달 현황`·`동기화`를 일상 제품
  보기로 오인하고, 어떤 화면이 "제품을 설명"하고 어떤 화면이 "운영을
  설명"하는지 구분하지 못한다 (조사 질문 1의 직접 답).
- 저장소 근거: `.harness/scripts/docs/lib/render-planning-page.mjs:16-25`
  (PLANNING_VIEWS 8개), `docs/planning.html:2236`, 목표는
  `specs/010-planning-hub-redesign/spec.md:486-488` (FR-063)
- 외부 근거: 9절·8절의 progressive disclosure 근거 참조
- 원인: T118(테스트)·T123(구현) 미착수 (`tasks.md:347,355`)
- 권장 조치: T118→T123 순서로 여섯 보기 + `운영·고급` disclosure 전환,
  delivery 렌즈·변경 제안은 개요/기능 현황에 흡수
- 수용 기준: 사이드바 노출 제품 보기 정확히 6개, delivery/sync 독립 버튼 0개,
  운영·고급 open/close 상태 유지, 기존 stable ID 왕복 링크 무손실
- 변경 영향: UI, renderer, test
- 예상 난이도: M
- 선행 조건: 없음 (계약·데이터는 준비됨)

### [P1] 추적성 기본 화면이 전체 matrix — coverage/gap/neighborhood 미구현

- 상태: 확인됨
- 사용자 영향: 기능 500개·work item 2,000개 규모에서 전체 matrix는 행동
  가능한 정보를 주지 못하고(무엇부터 고칠지 알 수 없음), DOM 전량 렌더로
  성능도 저하된다. SC-020 미충족.
- 저장소 근거: `render-planning-page.mjs:175-180` (5열 matrix 전량),
  `build-traceability-coverage.mjs`·`render-traceability-coverage-view.mjs`
  파일 부재, `tests/planning-traceability-coverage.test.mjs` 부재
- 외부 근거: 13절 비교 참조
- 원인: T117·T121·T122 미착수 (`tasks.md:346,353-354`)
- 권장 조치: coverage 요약 + severity 정렬 gap queue + 선택 기능 bounded
  neighborhood를 기본으로, matrix/CSV는 접힌 보조 보기로 강등
- 수용 기준: 기본 DOM에 전체 관계망 미출현, 500/2,000 표본에서 coverage·누락
  수 100% 일치 (SC-020), gap 항목마다 복구 행동 표시
- 변경 영향: UI, renderer, test
- 예상 난이도: L
- 선행 조건: 없음 (TraceabilityLink·인덱스 계약은 `data-model.md:321-345`에 준비됨)

### [P1] Kanban이 선택 기능 컨텍스트로 카드를 필터하지 않음 — 결정 12 부분 구현

- 상태: 확인됨
- 사용자 영향: "선택 기능의 작업 현황"을 본다고 믿지만 실제로는 워크스페이스
  전체 작업을 보고 있어, 기능 단위 완료 판단이 왜곡될 수 있다. HTML 구조
  조사조차 컨텍스트 방식으로 오판했을 만큼(8.3절) 의미 전달이 모호하다.
- 저장소 근거: `render-planning-page.mjs:257-263` (selectFeature가 컨텍스트
  카드만 토글), `:300-326` (applyWorkItemFilters에 featureDefinitionId 필터
  부재), 목표는 `spec.md:476-477` (FR-059)
- 외부 근거: 11절 비교 참조
- 원인: T112/T115가 보드·필터·상세를 구현했으나 기능 컨텍스트 필터는 T124
  검증 범위와 함께 남음
- 권장 조치: 선택 기능이 있으면 카드 집합을 해당 기능으로 필터하고, "전체
  작업 보기" 전환을 명시 버튼으로 제공 (암묵 전체 표시 금지)
- 수용 기준: 기능 선택 시 보드 카드 전부 해당 featureDefinitionId, 전환
  상태가 UI에 라벨로 표시, 기존 Release·유형·보류 필터와 결합 동작
- 변경 영향: UI, renderer, test
- 예상 난이도: S
- 선행 조건: 없음

### [P1] 문서·스킬이 옛 8개 보기 구조를 안내 — 신규 사용자·AI 오도

- 상태: 확인됨
- 사용자 영향: 스킬을 읽는 AI와 문서를 읽는 사람이 8개 보기 구조를 정본으로
  학습한다. 특히 `codi-feature-hub` 스킬은 매 세션 Planning Hub 작업의
  진입점이므로 오도 파급이 크다.
- 저장소 근거: `.harness/skills/codi-feature-hub/SKILL.md:26-29` ("eight
  views"), `docs/planning-hub-handoff.md:33-42` ("8개 보기"), `README.md:272`,
  `specs/010-planning-hub-redesign/research.md:141` (R8 "eight")
- 외부 근거: 해당 없음 (내부 정합성 문제)
- 원인: T126(문서 반영) 미착수 + 구현 미전환 상태에서 문서가 현행을 따라간
  구조적 결과
- 권장 조치: T123 구현 완료와 같은 변경 단위에서 T126 문서 갱신을 함께 수행
  (구현과 문서가 다시 갈라지지 않도록)
- 수용 기준: 위 4개 파일에서 8개 보기 서술 0건, 여섯 보기 + 운영·고급 서술로
  대체, `./harness context-check` 통과
- 변경 영향: docs
- 예상 난이도: S
- 선행 조건: T123 완료 (먼저 갱신하면 문서가 미래 상태를 선서술하게 됨)

### [P1] merge-ready gate의 실효성이 branch protection 설정에 의존 — 미확인

- 상태: 미확인 (저장소 밖 설정)
- 사용자 영향: `planning-check`가 포함된 CI job이 GitHub branch protection의
  required status check가 아니면, 빨간 CI에서도 merge가 가능해 결정 17의
  fail-closed 보장이 무력화된다.
- 저장소 근거: `.harness/scripts/checks/ci-node-verify.sh:302-305`,
  `.github/workflows/pipeline.yml:3-6,76-80`
- 외부 근거: 해당 없음
- 원인: required check 지정은 저장소 파일로 확인 불가
- 권장 조치: 사용자가 GitHub 설정에서 `ci-node` verify job의 required 지정
  여부를 확인·지정 (23절 승인 필요 항목)
- 수용 기준: dev·main 대상 PR에서 planning-check 실패 시 merge 버튼 차단 확인
- 변경 영향: automation (설정)
- 예상 난이도: S
- 선행 조건: 저장소 관리자 권한

### [P2] 현재 워킹트리에서 planning:check 실패 — docs/index.html stale

- 상태: 확인됨 (본 세션에서 exit 1 재확인)
- 사용자 영향: 지금 문서 허브를 여는 사용자는 최신 렌더러 소스와 다른 옛
  화면을 본다. merge-ready gate는 정확히 차단 중이므로 계약 위반은 아니다.
- 저장소 근거: `node .harness/scripts/docs/planning-check.mjs` → exit 1,
  `stale generated output: docs/index.html`; 워킹트리 렌더러 수정
  (`render-hub.mjs` +722줄, `hub.css` +1,239줄)
- 원인: 소스 수정 후 `mise run docs:build` 미실행 (Stop hook은 fail-open이라
  비차단)
- 권장 조치: 다음 구현 세션 시작 시 `mise run docs:build` → `mise run
  planning:check` 순서로 복구
- 수용 기준: planning:check exit 0
- 변경 영향: 생성물만
- 예상 난이도: S / 선행 조건: 없음

### [P2] bounded rendering 부재 — 대규모 표본에서 활성 DOM 무제한

- 상태: 확인됨
- 사용자 영향: 2,000 work item이 카드 전량으로 DOM에 렌더된다(측정 ~87ms,
  `verification.md:204`). 현 규모에서는 동작하나 SC-020/SC-023의 상한 검증이
  없어 500 기능·2,000 작업 기준의 성능·접근성 보장이 미확인이다.
- 저장소 근거: `render-feature-workbench-view.mjs:382-388` (전량 렌더),
  T124/T125/T128 미착수 (`tasks.md:372,376,388`)
- 원인: US7 Phase 14 미착수
- 권장 조치: coverage 추적성(T121·T122)의 bounded neighborhood 계약을 다른
  보기에도 적용 — Kanban·목록에 표시 상한+필터 유도, T128 규모 회귀 추가
- 수용 기준: SC-020(선택 깊이 밖 관계망 미표시), SC-023(2초 내 생성·console
  error 0) 검증 기록
- 변경 영향: UI, renderer, test / 예상 난이도: M / 선행 조건: T121·T122

### [P2] tasks.md 체크 상태가 실제 구현을 과소 보고 — T116·T119·T120

- 상태: 확인됨
- 사용자 영향: flow story는 모듈·렌더러·테스트가 실존하고 통과하는데
  체크박스가 미체크라, 다음 세션이 이미 있는 작업을 다시 구현하거나 잘못된
  잔여 범위를 보고할 위험이 있다 (세션 연속성은 spec 디렉터리가 checkpoint).
- 저장소 근거: `.harness/scripts/docs/lib/build-user-flow-story.mjs`,
  `render-user-flow-story-view.mjs`, `tests/planning-user-flow-story.test.mjs`
  (실행 pass) vs `tasks.md:345,351-352` 미체크
- 원인: 구현 세션이 체크박스 갱신 전에 종료된 것으로 추정 (추론)
- 권장 조치: story render 테스트 잔여분(T116의 render 부분) 보완 여부를 확인한
  뒤 실제 상태에 맞게 체크박스를 갱신하고 verification.md에 근거를 기록
- 수용 기준: 체크 상태가 파일 존재·테스트 결과와 100% 일치
- 변경 영향: docs (spec 기록) / 예상 난이도: S / 선행 조건: 잔여 render 테스트 확인

### [P2] ROADMAP.md에 010 미등재 — 세션 연속성 위험

- 상태: 확인됨
- 사용자 영향: phase-routing 규칙은 미완료 tasks가 있는 in-flight feature를
  우선 재개하도록 하는데, 크로스-feature 개요인 ROADMAP이 009에서 멈춰 있어
  다음 세션이 010을 발견하지 못할 수 있다.
- 저장소 근거: `ROADMAP.md:1-14` (009까지), `specs/010-planning-hub-redesign/`
  존재, T101이 완료 후 반영으로 보류 중 (`tasks.md:273`)
- 원인: T101이 "완료 조건 충족 뒤에만" 반영하도록 설계돼 진행 중 상태가
  로드맵에 비가시화됨
- 권장 조치: 완료 반영과 별개로 "진행 중" 한 줄 등재는 허용하도록 T101 해석을
  조정 (사용자 승인 필요 — 23절)
- 수용 기준: ROADMAP에 010이 상태와 함께 1줄 존재
- 변경 영향: docs / 예상 난이도: S / 선행 조건: 사용자 승인

### [P2] 접근성 잔여 갭 — skip link·aria-live·FR-070 명칭·44px 컨트롤

- 상태: 확인됨
- 사용자 영향: 키보드·보조기술 사용자가 8개 탭 사이드바를 매번 순회해야
  하고(skip link 0건), 동적 갱신 안내가 role="status"에만 의존한다. 보조
  트리 명칭이 `키보드 트리`라 FR-070의 `계층 목록(접근성 보기)` 계약과 다르다.
- 저장소 근거: `docs/planning.html` skip link 0건·aria-live 0건 (8.4절),
  `spec.md:504-505` FR-070, T124/T125 미착수
- 외부 근거: 8절·12절의 WCAG 2.2 근거 참조
- 권장 조치: T125에서 skip link, 명칭 정정, 44px 컨트롤, 900px/600px
  breakpoint를 일괄 반영
- 수용 기준: SC-022 키보드·색상 비의존 검증 기록
- 변경 영향: UI, renderer, docs / 예상 난이도: M / 선행 조건: T123 (6뷰 전환과 함께)

### [P3] 낮은 우선순위 항목

1. **normalizer 스킬 용어 레거시** — `codi-feature-definition-normalizer/
   SKILL.md:42-47`이 "service-definition model" 용어 사용. 실체는 현행이므로
   명명만 정리 (docs, S).
2. **화면 상세의 "관련 전달 현황 보기" 버튼** — 삭제 예정 delivery 탭 참조
   (`render-planning-page.mjs:384-386`). T123 재편 시 함께 정리 (UI, S).
3. **`status-file.mjs` applyStatusEdit 직접 유닛 테스트 부재** — status-sync
   경유 간접 커버만 존재. 편집 병합 엣지케이스 직접 테스트 추가 (test, S).
4. **Codex root 폴백 엣지** — `codex-stop.mjs:23` cwd 폴백으로 서브디렉토리
   실행 시 projection 최신성 손실 가능. fail-open이라 영향 제한적 (automation, S).
5. **specs/007 문서의 단일 페이지 서술** — 역사적 기록으로 보존 (수정 금지
   제약). 신규 독자 오해 방지는 T126 문서 갱신으로 충분 (docs, S).

## 19. 권장 목표 정보구조와 사용자 여정

권장 목표는 승인안(여섯 제품 보기 + 운영·고급)을 그대로 추진하되, 흡수·전환
위치를 다음과 같이 구체화하는 것이다. 전면 재작성이 아니라 현재 계약을
보존하는 최소 변경이다.

```text
Planning Hub
├─ 개요            ← delivery 렌즈 A~C 요약 + coverage 스냅샷 + 다음 행동 흡수
├─ 화면 구조        (조직도 · 계층 목록(접근성 보기) · 비교표 — 명칭 정정)
├─ 기능 정의        (Surface → Screen → 기능 그룹 → FeatureDefinition)
├─ 기능 현황        ← 선택 기능 필터 Kanban 기본 + "전체 작업" 명시 전환
│                    + 카드·상세에 Task/Acceptance/Evidence/Blocker (이미 구현)
├─ 사용자 흐름      (actor/goal story — 이미 구현)
├─ 추적성          ← coverage + gap queue 기본, 선택 기능 neighborhood 확장,
│                    matrix/CSV는 접힌 보조
└─ 운영·고급 (disclosure)
    ├─ package version/digest · Planning Lock 상태
    ├─ 동기화 health (구 sync 탭 내용)
    └─ automation run 기록
```

사용자 여정 (같은 stable ID로 왕복):

- **PM/PL**: 개요(coverage·다음 행동) → 기능 정의(배치·인수 조건) → 기능
  현황(선택 기능 작업 상태) → 추적성 gap queue(누락 처리). 동기화 내부는
  운영·고급에서만.
- **개발자**: 기능 정의(행동·규칙·인수 조건) → 기능 현황 Kanban(자기 작업)
  → 완료 요청 시 완료 가드가 요구하는 근거 확인 → 사용자 흐름(실패·복구
  경로 구현 확인).
- **AI 에이전트**: 스키마(`.harness/config/*schema.json`)로 구조 생성,
  stable ID로 관계 기술, provenance(confirmed/inferred/question) 보존,
  생성물이 아닌 원본만 수정.

## 20. 권장 데이터·계약 변경

핵심: **데이터·계약 변경은 거의 필요 없다.** 미구현 화면들의 계약이 이미
`data-model.md`와 `contracts/`에 정의돼 있으므로 구현만 남았다. 제안하는
소폭 변경은 3건이다.

1. **기능 현황 view 계약에 "기능 필터 상태" 명시** — 결정 12의 조건부 유지
   조건. `contracts/hub-view-contract.md`의 기능 현황 절에 "선택 기능 필터
   기본 + 전체 작업 전환은 명시 라벨" 문장을 추가해 렌더러 구현이 다시
   모호해지지 않게 한다 (docs 변경, 스키마 무변경).
2. **FR-070 명칭 반영** — 보조 트리 UI 라벨을 `계층 목록(접근성 보기)`로
   정정 (renderer 문자열만).
3. **multi-repo Delivery Evidence 집계 계약은 후속 결정으로 분리** — 현
   단일 저장소 상대 경로 계약을 지금 바꾸지 않는다. 분리 저장소 feature에서
   transport(수신 인증·무결성)와 함께 승인받는다 (23절).

변경하지 않아야 할 것: FeatureWorkItem 스키마(완료 가드 포함), manifest
canonical serialization과 digest 규칙, Planning Lock 전이, Change Proposal
필드 — 모두 테스트로 고정된 안전 계약이며 바꿀 근거가 없다.

## 21. 단계별 개선 Backlog

### Now (다음 구현 세션 — 각 항목에 파일 영향 범위와 측정 가능한 수용 기준)

| # | 항목 | 파일 영향 | 수용 기준 | 난이도 |
| --- | --- | --- | --- | --- |
| N1 | 생성물 복구: `mise run docs:build` → `planning:check` | `docs/*.html` (생성물만) | planning:check exit 0 | S |
| N2 | tasks.md 체크 정합 (T116·T119·T120 실상 반영) | `specs/010-.../tasks.md`, `verification.md` | 체크 상태 = 파일·테스트 실재와 100% 일치 | S |
| N3 | T118 테스트 → T123 여섯 보기 + 운영·고급 전환 | `render-planning-page.mjs`, `tests/feature-hub-render.test.mjs`, `tests/planning-sitemap-render.test.mjs` | 제품 보기 정확히 6개, delivery/sync 버튼 0개, disclosure open/close 유지 | M |
| N4 | Kanban 선택 기능 필터 + 전체 작업 명시 전환 | `render-planning-page.mjs`, workbench 테스트 | 기능 선택 시 카드 100% 해당 기능, 전환 상태 라벨 표시 | S |
| N5 | T126 문서·스킬 갱신 (SKILL.md, handoff, README, research R8) | docs 4개 파일 | 8개 보기 서술 0건, context-check 통과 | S |
| N6 | branch protection required check 확인 (사용자) | GitHub 설정 | planning-check 실패 시 merge 차단 확인 | S |

N3~N5는 같은 변경 단위로 묶어야 구현·문서 드리프트가 재발하지 않는다.

### Next

- T117 → T121·T122: coverage + gap queue + bounded neighborhood 추적성 (L).
  500 기능/2,000 작업 규모 테스트 포함 (SC-020).
- T124·T125: skip link, `계층 목록(접근성 보기)` 명칭, 44px 컨트롤,
  900px/600px breakpoint, reduced-motion 보강 (M). SC-022 검증 기록.
- T127·T128: 전체 명령 검증 + 규모 회귀 → verification.md 기록 (M).

### Later

- T129: `file://` 3개 viewport 키보드 브라우저 검증 기록.
- T098: 실사용자 5명 사용성 세션 (SC-001) — 자동 검증으로 대체 금지 유지.
- T101: ROADMAP/CHANGELOG 완료 반영 (T098 후).
- planning-hub 분리 저장소: transport 인증·무결성 + multi-repo evidence 집계
  설계를 별도 spec으로 승인.

## 22. 유지 / 단순화 / 제거 / 추가 표

| 분류 | 항목 | 근거 |
| --- | --- | --- |
| 유지 | 데이터 계층 전부 — 1:N 모델, 완료 가드, manifest/digest, Planning Lock, Change Proposal, reconcile | 테스트로 고정된 안전 계약 (5·14·15절) |
| 유지 | 사이트맵 screen-only + 3표현 + 실선/점선 구분 | 구현·계약 일치 (8.2절) |
| 유지 | 사용자 흐름 goal story | 구현 실질 완료, 테스트 통과 |
| 유지 | 두 생성 페이지 분리, page-set 원자 교체, fail-open/fail-closed automation | 15절 |
| 단순화 | 상위 IA: 8개 평면 탭 → 여섯 제품 보기 + 운영·고급 disclosure | 결정 2·3, P1 발견 1 |
| 단순화 | 추적성: 전체 matrix를 기본에서 보조로 강등 | 결정 14, P1 발견 2 |
| 단순화 | 화면 상세의 delivery 탭 참조 링크 → 기능 현황 근거로 연결 | P3-2 |
| 제거 | `전달 현황`·`동기화` 독립 일상 탭 (내용은 개요·기능 현황·운영·고급으로 흡수, 데이터 계약은 무손실) | 결정 3·4 |
| 추가 | coverage + gap queue + bounded neighborhood 화면 | 결정 14, `data-model.md:334-345` 계약 기구현 |
| 추가 | Kanban 선택 기능 필터 + 전체 작업 명시 전환 | 결정 12 조건 |
| 추가 | skip link·aria-live 등 접근성 보강, FR-070 명칭 | P2 접근성 발견 |
| 추가 | ROADMAP 010 등재 (진행 중 1줄) | P2, 사용자 승인 후 |
| 추가 | branch protection required check | P1 발견 5 |

## 23. 열린 질문과 사용자 승인 필요 결정

다음 구현 전에 사용자 결정이 필요한 항목:

1. **branch protection required check 지정** (P1 발견 5): `ci-node` verify
   job(planning-check 포함)을 dev·main PR의 required status check로 지정할지.
   미지정이면 결정 17의 fail-closed 보장이 설정 수준에서 무력화된다.
2. **ROADMAP 진행 중 등재 허용** (P2): T101은 "완료 후에만 반영"인데, 진행 중
   상태 1줄 등재를 허용하도록 해석을 조정할지. 세션 연속성과 완료 기준 보존
   사이의 트레이드오프.
3. **tasks.md 체크박스 소급 갱신 방식** (P2): T116·T119·T120을 실상에 맞게
   체크할 때, TDD 순서 기록(RED 증거)이 없는 항목을 어떻게 기록할지 —
   verification.md에 "구현 선행, 테스트 사후 확인" 사실을 그대로 남기는 것을
   권장한다 (기록 과장 금지).
4. **N3~N5 묶음 실행 승인**: 여섯 보기 전환(T118·T123) + Kanban 필터 +
   문서 갱신(T126)을 한 변경 단위로 진행할지. 본 조사의 권장은 묶음 실행이다.
5. **multi-repo evidence 집계 계약** (14.2절): planning-hub 분리 시 downstream
   여러 프로젝트의 Delivery Evidence를 어떻게 수집·게시할지는 미설계다. 별도
   spec(specify→clarify→plan)으로 승인받아야 한다.
6. **T098 사용성 세션 일정**: SC-001(실사용자 5명, 2분 내 구분)은 사람 참여가
   필요해 자동화로 대체할 수 없다. 참여자 확보 방식과 시점.

조사 중 해소되지 않은 열린 질문:

- 현 워킹트리의 미커밋 planning 하위시스템 전체(스키마 8종 + planning-*.mjs +
  테스트)가 어느 시점·어느 브랜치로 커밋될 예정인지 — 조사 제약상 커밋하지
  않았고, 다음 세션의 커밋 전략(단일 대형 커밋 vs US 단위 분할)은 사용자
  결정이 필요하다.

## 24. 검증 명령과 결과

모두 읽기 전용 또는 no-write 검증 목적으로만 실행했다. `docs:build` 등 생성
명령은 실행하지 않았다.

| 명령 | exit | 결과 | 실행 주체 |
| --- | --- | --- | --- |
| `git status --porcelain` (시작 스냅샷) | 0 | 기존 dirty worktree 125개 변경 항목 보존 확인 | 본 세션 |
| `grep -c '^\- \[[Xx ]\]' specs/010-planning-hub-redesign/tasks.md` | 0 | 완료 113 / 미완료 17 | 본 세션 |
| `node --test tests/planning-user-flow-story.test.mjs` | 0 | fail 0 (T116 테스트 실존·통과) | 본 세션 |
| `node .harness/scripts/docs/planning-check.mjs` | **1** | `stale generated output: docs/index.html — run mise run docs:build` | 본 세션 (조사 에이전트 결과 재확인) |
| `node --test tests/planning-*.test.mjs` | 0 | 104 pass / 0 fail | 조사 에이전트 |
| `node --test tests/feature-hub-*.test.mjs` | 0 | 175 pass / 0 fail | 조사 에이전트 |
| `node --test tests/*.test.mjs` (전체) | 0 | 605 pass / 0 fail | 조사 에이전트 |

실패 1건의 해석: `planning:check`의 실패는 검사기 결함이 아니라 설계 의도대로
동작한 것이다 — 워킹트리에 렌더러 소스 대량 수정(`render-hub.mjs` +722줄,
`hub.css` +1,239줄 등)이 있는데 `docs/index.html`이 그 이후 재생성되지 않아
stale로 정확히 감지됐다. 복구는 `mise run docs:build` 후 재검사다(이번 조사
제약상 실행하지 않음). `tests/planning-check.test.mjs:29,40`이 정확히 이
판정을 검증한다.

종료 시 무변경 확인: 조사 종료 시점 `git status --porcelain`을 시작 스냅샷과
비교한 결과, 본 조사가 만든 변경은 본 보고서
`docs/audits/2026-07-17-planning-hub-deep-research.md` 신규 1건이다.

예외 기록 (미확인): 비교에서 `docs/feature-definition-planning-hub-guide.md`
신규 1건이 추가로 나타났다. 이 파일은 본 조사(메인 세션·조사 에이전트 6개 —
모두 읽기 전용 지시)가 생성하지 않았고 어떤 조사 보고에도 생성 기록이 없다.
파일 시각(02:27)이 조사 시간대와 겹치므로 **동시에 진행 중인 다른 세션의
산출물로 추정**된다(추론). 조사 제약에 따라 삭제·수정하지 않고 사실만
기록한다 — 출처 확인은 사용자 판단이 필요하다.

## 25. Source Index

### 저장소 근거 (주요)

- `specs/010-planning-hub-redesign/` — spec.md, plan.md, tasks.md, research.md,
  data-model.md, quickstart.md, verification.md, contracts/ 8개
- `docs/planning-hub-handoff.md`, `docs/superpowers/specs/2026-07-16-*.md` 3개
- `.harness/config/*schema.json` (feature-detail, feature-work-item,
  planning-manifest, delivery-evidence, change-proposal, hub-workspace,
  traceability, user-flow)
- `.harness/scripts/docs/` — build-hub.mjs, planning-sync.mjs,
  planning-check.mjs, lib/*.mjs (render-planning-page,
  render-feature-workbench-view, build-user-flow-story,
  normalize-feature-work-items, aggregate-feature-work-items,
  apply-planning-lock, reconcile-planning-delivery, compile-planning-manifest,
  layout-sitemap-org-chart, scan-workspaces, status-sync)
- `.harness/hooks/docs-build-on-stop.mjs`, `codex-stop.mjs`,
  `.claude/settings.json`, `.codex/hooks.json`,
  `.harness/scripts/checks/ci-node-verify.sh`, `.github/workflows/*.yml`
- 생성물 `docs/index.html`, `docs/planning.html` (원본 아님 — 구조 확인용)
- `data/`, `examples/community-app/`, `tests/planning-*.test.mjs`,
  `tests/feature-hub-*.test.mjs`, `mise.toml`, `package.json`
- `social-media-app-sitemap.png`, `.harness/skills/codi-feature-hub/SKILL.md`,
  `.harness/skills/codi-feature-definition-normalizer/SKILL.md`, `README.md`,
  `CONTRIBUTING.md`, `ROADMAP.md`, `CHANGELOG.md`

### 외부 근거 (접근일 2026-07-17, 3표 적대 검증 통과분)

| 출처 | 문서 | 용도 |
| --- | --- | --- |
| [ISO/IEC/IEEE 29148:2018](https://iso.org/standard/72089.html) | Systems and software engineering — Life cycle processes — Requirements engineering | 9개 요구 특성(5.2.5), 추적성 정의(3.1.23/24). 원문 대조는 제3자 호스팅 PDF, 정본은 유료 |
| [W3C WAI](https://www.w3.org/TR/WCAG22/) | WCAG 2.2 + Understanding [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow) · [Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color) · [Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard) · [Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) · [Technique C39](https://www.w3.org/WAI/WCAG21/Techniques/css/C39) | 접근성 정규 기준. SC 2.3.3은 Level AAA(모범 사례)임을 병기 |
| [Kanban Guides](https://kanbanguides.org/the-kanban-guide/) | The Kanban Guide (v2025.5 및 [2020.12 PDF](https://kanbanguides.org/the-kanban-guide/2020.12/pdf/kanban-guide.v2020.12.en.pdf)) | DoW 6개 필수 요소, 명시적 상태 정책, WIP 통제 |
| [NN/g](https://www.nngroup.com/reports/site-map-usability/) | Site Map Usability | 사이트맵 = 계층·그룹핑 조망 산출물 |
| [Bill Wake / XP123](https://xp123.com/invest-in-good-stories-and-smart-tasks/) | INVEST in Good Stories, and SMART Tasks | Testable 기준 |
| [in-toto](https://github.com/in-toto/attestation/blob/main/spec/v1/statement.md) | Attestation Framework Statement v1 (+ [digest_set](https://github.com/in-toto/attestation/blob/main/spec/v1/digest_set.md)) | digest 고정 immutable subject 패턴 |
| [SLSA](https://slsa.dev/spec/v1.0/provenance) | SLSA v1.0 Provenance | 산출물 provenance 정의 |

### fetch됐으나 검증 표본 밖 (모순 미발견, 핵심 근거로 미사용)

[NN/g Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/),
[NN/g Recognition and Recall](https://www.nngroup.com/articles/recognition-and-recall/),
[NN/g User Journeys vs. User Flows](https://www.nngroup.com/articles/user-journeys-vs-user-flows/),
[ISO 9241-110 대화 원칙 해설](https://www.dialogdesign.dk/isos-dialogue-principles-2019/),
[MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

### 검증에서 기각된 주장 (사용하지 않음)

- Kanban WIP의 "purpose" 광의 표현 (1-2 기각) — 정밀 인용본만 사용
- SLSA가 build definition과 run details를 "구조적으로 분리"한다는 주장 (1-2 기각)
