# 기능정의서와 Planning Hub 설계·구현 안내서

작성 기준일: 2026-07-17

계획 원본: [`specs/010-planning-hub-redesign/`](../specs/010-planning-hub-redesign/)

생성 화면: [`docs/index.html`](index.html), [`docs/planning.html`](planning.html)

이 문서는 지금까지 기능정의서와 Planning Hub가 어떤 문제를 해결하기 위해 변화했는지,
각 파일이 어떤 역할과 소유권을 가지는지, 현재 화면에서 무엇을 볼 수 있는지, 앞으로
별도 `planning-hub` 저장소로 분리할 때 어떤 계약을 유지해야 하는지를 한곳에서 설명한다.

이 문서의 핵심은 다음 세 문장이다.

1. `docs/index.html`은 문서를 읽는 곳이고 `docs/planning.html`은 제품을 계획하고 구현
   상태를 판단하는 곳이다.
2. 기능정의는 “무엇을 만들어야 하는가”를 소유하고, 기능현황은 “프로젝트가 무엇을
   구현하고 검증했는가”를 소유한다.
3. 두 영역은 같은 stable ID로 연결되지만 어느 한쪽이 다른 쪽 원본을 자동으로
   덮어쓰지 않는다.

> 현재 상태(2026-07-17 갱신): 승인된 최종 구조가 구현됐다. 탐색 메뉴는
> 개요·화면 구조·기능 정의·기능 현황·사용자 흐름·추적성 여섯 제품 보기이고,
> version/digest·동기화·자동화 기록은 `운영·고급` disclosure에 있다. 추적성은
> coverage/gap/bounded neighborhood가 기본이며 전체 matrix/CSV는 접힌 보조다.
> Kanban은 선택 기능 범위가 기본이고 `전체 작업` 전환이 명시 제공된다. 남은 것은
> 실제 사용자 5명 검증(T098)과 완료 후 ROADMAP/CHANGELOG 반영(T101)이다.
> 아래 본문에서 "승인된 목표"로 표기된 구조는 이제 현행 구현이다.

---

## 1. 이 시스템은 무엇인가

현재 구조는 단순한 “기능 목록 HTML”이 아니다. 네 가지 층을 가진 정적 계획·문서
시스템이다.

| 층 | 답하는 질문 | 대표 원본 | 결과 |
| --- | --- | --- | --- |
| 문서 | 하네스와 프로젝트를 어떻게 이해하고 사용하는가? | Markdown, Spec | 문서 허브 |
| 제품 계획 | 사용자가 무엇을 어디에서 어떤 규칙으로 사용해야 하는가? | need, sitemap, feature definition/detail, flow, decision | Planning Manifest와 계획 화면 |
| 구현·검증 | 프로젝트는 계획을 어떤 작업으로 나누고 어디까지 완료했는가? | Spec, task, FeatureWorkItem, code/test/verification evidence | 기능현황과 Delivery Evidence |
| 조정·운영 | 계획과 실제가 어디서 다르고 어떻게 복구해야 하는가? | Planning Lock, Sync Result, Change Proposal, automation state | 동기화 health와 검토 제안 |

사람은 이 화면을 통해 문서, 화면 구조, 기능의 의미, 구현 작업, 사용자 목표 흐름,
누락된 근거를 탐색한다. Claude와 Codex는 같은 schema와 stable ID를 사용해 원본을 읽고,
검증하고, 필요한 변경 제안을 만든다.

### 1.1 기능정의서와 기능현황은 같은 문서가 아니다

기능정의서는 planning owner가 소유한다.

- 누가 사용하는가
- 어떤 문제와 목표를 해결하는가
- 어느 화면에 배치되는가
- 정상·대안·실패·복구 동작은 무엇인가
- 어떤 규칙과 상태를 지켜야 하는가
- 무엇을 검증하면 기능이 요구대로 동작한다고 판단하는가

기능현황은 downstream 프로젝트가 소유한다.

- 프론트엔드, 백엔드, DB, QA, 인프라 중 어떤 작업이 필요한가
- 각 작업은 어느 Release에 속하는가
- 현재 예정, 진행 중, 검토·검증, 완료 중 어디에 있는가
- 연결 task, acceptance result, 코드·테스트·검증 근거가 있는가
- 완료를 막는 결정이나 누락된 근거가 있는가

따라서 관계는 1:1이 아니라 다음과 같다.

```text
FeatureDefinition 1
├─ FeatureWorkItem N: frontend
├─ FeatureWorkItem N: backend
├─ FeatureWorkItem N: db
├─ FeatureWorkItem N: qa
└─ FeatureWorkItem N: infra
```

기능정의 화면과 기능현황 화면은 같은 `featureDefinitionId` 선택을 공유한다. 반면
Kanban에서 선택하는 `FeatureWorkItem` ID는 별도 상태다. 기능을 바꿨다고 작업의 정체성이
바뀌지 않고, 작업을 선택했다고 planning 정의가 수정되지 않는다.

### 1.2 사이트맵, 사용자 흐름, 추적성은 서로 다른 질문에 답한다

| 산출물 | 핵심 질문 | 들어가는 것 | 들어가지 않는 것 |
| --- | --- | --- | --- |
| 사이트맵 | 어떤 화면이 있고 계층과 이동은 어떻게 되는가? | screen, parent-child, direct navigation | 기능, Spec, task, test |
| 기능정의 | 각 화면에서 무엇을 제공해야 하는가? | feature, placement, behavior, rules, acceptance | 실제 구현 상태 |
| 사용자 흐름 | 특정 actor가 목표를 어떤 정상·실패·복구 경로로 달성하는가? | step, decision, failure, recovery, screen/feature refs | 전체 화면 계층 |
| 추적성 | need부터 구현·검증까지 무엇이 연결됐고 무엇이 비었는가? | typed entity/link, evidence, gap | 화면 전용 사이트맵 노드의 대체 |

첨부 예시와 같은 가로 조직도는 사이트맵을 보는 표현 중 하나다. 조직도 자체가
기능정의서나 추적성 그래프는 아니다.

---

## 2. 설계가 만들어진 과정

현재 구조는 한 번에 설계된 결과가 아니다. 단일 HTML 기능 허브에서 시작해 데이터 원본,
사이트맵, 추적성, 페이지 분리, 구현 작업 모델을 단계적으로 분리했다.

### 2.1 002: 단일 오프라인 기능 허브

초기 설계는 STICKY-v1의 역할별 진입 화면과 기능 상태 대시보드를 Spec Kit 기반
하네스로 옮기는 것이었다.

- 한 번의 `docs:build`로 `docs/index.html` 한 파일을 생성했다.
- 역할별 진입 카드, Markdown 색인, 기능 상태 대시보드를 한 페이지에 넣었다.
- 기능 상태의 원본은 `specs/<NNN>/status.yaml`이었다.
- 진행률은 `tasks.md` 체크박스에서 계산했다.
- `registry.json`은 아직 Spec이 없는 기능을 위한 선택적 seed였다.
- HTML은 읽기 전용 생성물이고 직접 수정하지 않는다는 원칙을 세웠다.

관련 원본:

- [`specs/002-feature-hub/spec.md`](../specs/002-feature-hub/spec.md)
- [`기능 허브 + 기능정의 상태 flow 설계`](superpowers/specs/2026-07-08-feature-hub-and-status-flow-design.md)

이 단계의 장점은 외부 서버 없이 파일 하나로 전체 상황을 볼 수 있다는 점이었다. 하지만
문서 읽기, 기능정의, 구현 상태가 한 페이지에 누적되면서 정보의 목적이 섞이기 시작했다.

### 2.2 003: 외부 기능정의 원본과 canonical schema

다음 단계에서 기능정의 데이터의 출처를 하드코딩된 HTML이나 특정 로컬 경로에서
`data/feature-definitions.json`으로 옮겼다.

- `.harness/config/feature-definition-schema.json`이 21개 canonical field와 8개 표 컬럼을
  정의했다.
- `codi-feature-definition-normalizer`가 CSV, Markdown, HTML 등 불규칙한 자료를
  canonical row로 변환하는 역할을 맡았다.
- 기능정의 원본이 없어도 Spec에서 최소 row를 파생해 화면이 완전히 비지 않게 했다.
- `Row_ID`와 Spec ID가 같으면 두 원본을 병합하고, 다르면 별도 기능으로 유지했다.
- 문자열 유사도는 중복 의심 경고에만 사용하고 자동 병합하지 않았다.

관련 원본:

- [`specs/003-feature-definition-source/spec.md`](../specs/003-feature-definition-source/spec.md)
- [`specs → 기능정의서 자동 반영 설계`](superpowers/specs/2026-07-10-spec-to-definition-sync-design.md)

이 시점의 기능정의는 “기능을 검색하고 분류하는 catalog”였다. `Why`, `Area`,
`Decision_Question` 같은 필드는 있었지만, 구현자가 정상·오류·권한 상태와 측정 가능한
acceptance criterion을 판단하기에는 부족했다.

### 2.3 007: 사이트맵을 기능정의보다 앞에 두기

기능정의를 8컬럼 표로만 보여주면 기능이 어느 화면에 들어가는지 한눈에 알기 어려웠다.
그래서 사이트맵을 별도 사람 소유 원본으로 만들고 기능정의의 배치 기준으로 사용했다.

권장 작성 흐름은 다음과 같되 선형 동결이 아니라 반복 루프다.

```text
사용자/비즈니스 필요
    ↓
사이트맵 초안과 화면 ID 확인
    ↓
기능정의 catalog/detail 작성
    ↓
새 화면 발견 시 사이트맵 갱신
    ↺
```

- `data/sitemap.json`은 사람이 소유한다.
- `docs:build`는 읽기만 하고 생성하거나 덮어쓰지 않는다.
- 기능이 없는 화면도 표시해 “아직 정의되지 않은 화면”을 드러낸다.
- 화면에 배치되지 않은 기능은 숨기지 않고 미배치 상태로 표시한다.
- 화면이 없는 API·정책·시스템 기능은 억지로 배치하지 않고 미배치로 둔다.
  배치를 위해 가짜 화면 노드를 만들지 않으며(`common` surface는 여러
  surface가 공유하는 실제 화면용), 연결이 필요하면 traceability 관계로
  표현한다. (`codi-feature-definition-authoring`·normalizer와 공통 규칙)
- 사용자 행위와 관리자 처리가 모두 있는 도메인(예: 신고 접수와 신고
  검토)은 actor별로 기능을 분리한다(FEAT-REPORT / FEAT-MODERATION 패턴).
  한 기능을 user와 admin surface에 동시에 배치하지 않는다. actor↔surface
  불일치는 빌드가 비차단 힌트로 알린다.

관련 원본:

- [`specs/007-sitemap-board/spec.md`](../specs/007-sitemap-board/spec.md)
- [`기능정의서 사이트맵 보드 설계`](superpowers/specs/2026-07-16-feature-definition-sitemap-board-design.md)

### 2.4 008과 009: typed relation, Spec 상세, 사용자 흐름

사이트맵과 기능정의 row만으로는 need, Spec, 검증, 사용자 목표 흐름을 설명할 수 없었다.
008에서는 선택적인 typed relation과 user-flow 계약을 추가했고, 009에서는 실제 하네스
데이터를 이 계약에 맞게 정본화했다.

- 기능과 Spec은 같은 ID를 기본 연결로 사용한다.
- 명시적 `specified-by`, `appears-on`, `verified-by` 관계가 있으면 legacy 추정보다 우선한다.
- `parse-spec-detail.mjs`가 Spec의 시나리오, acceptance, edge case, requirement,
  success criteria를 읽기 모델로 변환한다.
- `data/feature-relations.json`은 need, feature, screen, flow, spec, verification을
  typed link로 연결한다.
- `data/user-flows.json`은 actor, goal, step, decision, recovery와 관련 screen/feature
  ID를 기록한다.
- broken, duplicate, orphan, cycle은 유효 데이터를 버리지 않고 health로 보고한다.

관련 원본:

- [`specs/008-linked-feature-hub/spec.md`](../specs/008-linked-feature-hub/spec.md)
- [`specs/009-harness-information-architecture/spec.md`](../specs/009-harness-information-architecture/spec.md)
- [`하네스 정보구조·추적성·사용자 흐름 설계`](superpowers/specs/2026-07-16-harness-information-architecture-design.md)

### 2.5 010: Demo, 계획 전달 계약, 두 페이지 분리

하네스 자체 기능만 화면에 넣자 사용자는 제품 기능정의가 아니라 “하네스를 어떻게
버전업하는가”를 보고 있다고 느꼈다. 실제 제품 예시를 별도 workspace로 격리하고, 계획과
구현 근거가 다른 소유자에게 있다는 사실을 명시할 필요가 생겼다.

010은 다음을 추가했다.

- `Community Demo`와 `Harness Internal` workspace 분리
- rich `FeatureDetail`
- immutable `PlanningManifest`
- 명시적으로 수신한 버전을 기록하는 `PlanningLock`
- downstream 구현·검증 근거인 `DeliveryEvidence`
- 계획과 실제 차이를 사람에게 제안하는 `ChangeProposal`
- Claude, Codex, 수동 명령, CI가 공유하는 동기화 코어
- `docs/index.html`과 `docs/planning.html` 분리
- 가로 조직도형 사이트맵
- `FeatureDefinition 1:N FeatureWorkItem`
- 기능 배치 중심 탐색과 작업 Kanban

관련 원본:

- [`specs/010-planning-hub-redesign/spec.md`](../specs/010-planning-hub-redesign/spec.md)
- [`Planning Hub 데모·동기화 재설계`](superpowers/specs/2026-07-16-planning-hub-demo-sync-redesign.md)
- [`문서 허브·Planning Hub 페이지 분리 설계`](superpowers/specs/2026-07-16-docs-planning-page-separation-design.md)
- [`Planning Hub 기능 워크벤치 재설계`](superpowers/specs/2026-07-16-planning-hub-feature-workbench-redesign.md)

---

## 3. `docs/index.html`에서 분리한 이유

### 3.1 기존 단일 페이지의 문제

분리 전에는 다음 내용이 한 생성물 안에 있었다.

- 하네스 가이드
- 프로젝트 문서
- 문서 검색
- 기능정의 표
- 기능현황
- 사이트맵과 관계도
- 사용자 흐름
- 전달·동기화 정보

사이드바에서 “하네스 가이드”를 눌러도 접힌 legacy 영역과 Planning UI가 같은 페이지에
남았다. 사용자는 지금 문서를 읽는지, 제품 구조를 보는지, 구현 상태를 판단하는지 바로
알기 어려웠다. 조직도형 사이트맵에는 넓은 캔버스가 필요한데 문서 reader와 같은 레이아웃을
공유하면 양쪽 모두 좁아졌다.

### 3.2 검토한 대안

| 안 | 장점 | 문제 | 결론 |
| --- | --- | --- | --- |
| 두 HTML | 책임이 분명하고 `file://`에서 독립 실행 가능 | 페이지 간 이동 필요 | 채택 |
| iframe | 기존 문서 허브 안에 Planning 화면 삽입 가능 | 이중 스크롤, focus, URL 공유, 뒤로가기 복잡 | 거절 |
| 단일 페이지 유지 | 생성물이 하나 | 목적 혼합과 좁은 캔버스 문제 반복 | 거절 |

### 3.3 현재 페이지 책임

```text
docs/index.html                       docs/planning.html
┌──────────────────────────┐          ┌──────────────────────────┐
│ 하네스 가이드             │          │ 제품 개요                 │
│ 프로젝트 문서             │  링크 ↔  │ 화면 구조                 │
│ 문서 검색·목록·reader     │          │ 기능 정의·기능 현황       │
│ Planning Hub 이동         │          │ 사용자 흐름·추적성·운영   │
└──────────────────────────┘          └──────────────────────────┘
```

두 페이지는 다른 목적을 가지지만 한 번의 `mise run docs:build`에서 같은 source/model을
읽고 함께 생성된다. 한쪽만 새 버전으로 남는 것을 막기 위해 page-set 단위로 stage하고
교체한다. 두 renderer 중 하나라도 실패하면 기존 정상 파일을 복구한다.

---

## 4. 전체 아키텍처와 데이터 흐름

### 4.1 읽기와 생성 흐름

```text
사람 소유 planning source                    프로젝트 소유 delivery source
need / sitemap / feature / flow              Spec / task / FeatureWorkItem
decision / relation                          code / test / verification
             │                                           │
             ├──────── scan + validate ───────────────────┤
             │                                           │
             ▼                                           ▼
    Planning Manifest                         Delivery Evidence
    version + digest                          consumed digest + revision
             │                                           │
             └──────────── reconcile ─────────────────────┘
                              │
                              ▼
              Workspace Hub Model + health/proposal
                       ↙                    ↘
          Document Projection             Planning Projection
                  │                              │
                  ▼                              ▼
          docs/index.html                docs/planning.html
```

### 4.2 쓰기 권한 경계

| 원본/생성물 | 소유자 | 일반 build/sync가 쓸 수 있는가? |
| --- | --- | --- |
| Markdown, Spec | 각 문서·프로젝트 소유자 | 아니오 |
| sitemap, feature, flow, relation, decision | PM/PL 또는 planning owner | 아니오 |
| Planning Manifest | planning compiler | manifest snapshot만 생성 가능 |
| Planning Lock | downstream 프로젝트 | `planning:pull`만 교체 가능 |
| FeatureWorkItem, task, code, test | downstream 구현 담당 | 아니오 |
| Delivery Evidence | downstream collector | evidence snapshot만 생성 가능 |
| Change Proposal | reconcile/제안 작성자, planning reviewer | proposal 파일만 기록 |
| Sync Result, automation state | 생성 코어 | 생성 state만 기록 |
| `docs/index.html`, `docs/planning.html` | page-set generator | 두 파일을 함께 재생성 |

“동기화”는 두 원본을 같은 내용으로 자동 복사하는 기능이 아니다. 같은 ID, version, digest와
근거를 비교해 `aligned`, `behind`, `drifted`, `conflicted`, `collection-failed`를 계산하는
것이다.

### 4.3 preview와 strict check

- 브라우저 preview는 fail-open이다. 일부 선택 원본이 손상돼도 유효한 화면과 데이터를
  보여주고 health와 복구 행동을 표시한다.
- merge-ready `planning:check`와 CI는 fail-closed다. manifest, lock, evidence, relation,
  conflict와 두 generated HTML의 stale 여부를 엄격히 검사한다.
- actual downstream 원본이 손상됐다고 Demo 데이터로 대체하지 않는다.
- 마지막 정상 projection과 실패 원인을 구분한다.

---

## 5. 핵심 데이터 모델

### 5.1 Stable ID 연결 구조

```text
Need
  └─ satisfied-by → FeatureDefinition
                         ├─ appears-on → Screen
                         ├─ uses/linked → UserFlow
                         ├─ specified-by → Spec
                         ├─ 1:N → FeatureWorkItem
                         │          ├─ taskRefs
                         │          ├─ acceptanceResults
                         │          └─ evidenceRefs
                         └─ verified-by → Verification
```

제목은 바뀔 수 있지만 ID는 관계의 기준이다. 제목 유사도나 파일 경로만으로 기능·작업 유형을
추론하지 않는다.

### 5.2 Feature catalog와 rich detail의 차이

`.harness/config/feature-definition-schema.json`의 21개 필드는 외부 자료 호환과 검색·분류를
위한 legacy catalog 계약이다. 다음과 같은 정보를 빠르게 정규화한다.

- Row ID, 제목, actor, surface, area
- 우선순위 후보
- 처리/검토 메타데이터
- 변경 종류와 변경 대상
- 정의 요약과 이유
- 사용 화면, 관리자·정책 의존성
- 확인할 질문과 출처

이 catalog만으로는 기능 구현을 판단하기 어렵다. 그래서 rich `FeatureDetail`은 다음 그룹을
별도로 가진다.

| 그룹 | 사람이 판단하는 내용 |
| --- | --- |
| identity/lifecycle | 기능 ID, owner, 정의 상태, 검토 이력 |
| intent | 문제, actor, 목표, 기대 결과, 근거, 가정 |
| scope | 포함 범위와 명시적 비목표 |
| behavior | trigger, precondition, 정상 경로, 대안, 실패, 사후 조건 |
| states | 처리 중, 빈 상태, 오류·재시도, 권한 거부, 필요 시 offline/timeout |
| rules | 비즈니스·검증·권한·생명주기 규칙 |
| interfaces | 입력, 출력, API·integration, 운영 의존성 |
| quality | 접근성, 성능, 개인정보, 보안, 가용성 요구 |
| acceptance | 측정 가능한 criterion, metric, 검증 상태 |
| traceability/decisions | need, screen, flow, Spec, task, test, verification와 열린 결정 |

`approved`는 정의가 승인됐다는 뜻이지 구현이 완료됐다는 뜻이 아니다. 필요한 상태나
acceptance가 없으면 `definition-incomplete` health를 표시한다.

### 5.3 Feature placement

기능 하나는 여러 화면에 나타날 수 있다.

| role | 의미 |
| --- | --- |
| `primary` | 기능을 기본으로 분류하고 찾는 주 화면 |
| `entry` | 기능을 시작하는 진입 화면 |
| `result` | 수행 결과를 확인하는 화면 |
| `support` | 설정·도움·보조 동작 화면 |

사용자에게 보이는 기능은 정확히 하나의 `primary` placement를 가져야 한다. 기존
`screenIds`는 호환 입력으로 유지하지만 명시적 `placements`를 덮어쓰지 않는다.

### 5.4 FeatureWorkItem과 상태

작업 상태는 네 개다.

```text
planned → in-progress → in-review → done
```

사용자 표시명은 `예정`, `진행 중`, `검토·검증`, `완료`다. `on-hold`는 다섯 번째 열이
아니다. 기존 상태 카드 위에 보류 사유와 해제 조건을 표시하는 조건이다.

`done` 요청은 다음 조건을 모두 만족해야 한다.

- 연결 task 완료
- required acceptance criterion을 정확히 한 번씩 passed로 검증
- 필요한 코드·테스트·검증 evidence 존재
- 열린 blocking decision 없음

조건이 부족하면 projection은 작업을 `in-review`에 유지하고 누락 항목과 복구 행동을
표시한다.

기능 집계는 다음 규칙을 사용한다.

```text
작업 0개                         → 작업 미생성
필터된 작업이 모두 done          → 완료
하나라도 in-progress             → 진행 중
진행 작업 없이 in-review 존재    → 검토·검증
그 외                            → 예정
```

Release는 작업의 속성과 필터다. 기능정의에 downstream repository 경로를 넣거나 Release를
기술팀 분할 축으로 사용하지 않는다.

### 5.5 Planning Manifest, Lock, Evidence, Proposal

- `PlanningManifest`: planning source를 project ID, version, source revision, SHA-256
  digest와 함께 묶은 immutable package다.
- `PlanningLock`: downstream이 어떤 manifest version/digest를 명시적으로 수신했는지
  기록한다.
- `DeliveryEvidence`: 수신한 digest를 기준으로 Spec, task, work item, code/test/
  verification 사실을 기록한다.
- `SyncResult`: 계획과 실제를 비교한 계산 결과다.
- `ChangeProposal`: planned value와 observed value가 다를 때 근거·이유·결정 owner를
  포함해 사람이 검토하도록 만든다.

새 manifest가 있어도 기존 Spec, task, FeatureWorkItem을 자동 수정하지 않는다. 삭제된
기능도 연결된 프로젝트 작업을 자동 삭제하지 않고 orphan과 검토 제안으로 남긴다.

---

## 6. 현재 생성 화면

### 6.1 문서 허브: `docs/index.html`

문서 허브는 문서를 찾고 읽는 페이지다.

#### 화면 구성

1. 왼쪽 범주 사이드바
   - 하네스 가이드
   - 프로젝트 문서
   - Planning Hub 이동 링크
2. 문서 목록
   - 제목
   - 원본 경로
   - 발췌
   - 제목·경로·본문 검색
3. 읽기 패널
   - 선택 문서 제목과 원본 경로
   - heading, paragraph, list, table, link, inline code, fenced code block
   - 변환 실패 시 원본과 복구 행동

#### URL 상태

```text
index.html#harness
index.html#project
index.html#harness:<encoded-path>
index.html#project:<encoded-path>
```

fragment는 새로고침과 링크 전달 후에도 범주와 선택 문서를 복원한다. `file://` 브라우저가
로컬 Markdown을 다시 fetch하지 않도록 빌드 시점에 안전한 HTML projection을 포함한다.
`javascript:` 같은 실행 가능 링크와 원본 HTML은 실행 가능한 markup으로 승격하지 않는다.

### 6.2 Planning Hub 공통 프레임

Planning Hub 상단에는 현재 workspace와 데이터 종류가 표시된다.

- `Community Demo`: `DEMO DATA` 배지
- `Harness Internal`: 실제 하네스 planning source
- downstream project: Demo fallback 없이 actual source health 표시

workspace를 바꾸면 모든 view가 같은 workspace model로 원자적으로 바뀐다. 서로 다른
workspace의 기능·화면·근거를 한 화면에 섞지 않는다.

#### 현재 메뉴 구조 (승인된 목표와 일치, 2026-07-17)

| 화면 | 현재 구현 |
| --- | --- |
| 개요 | 제품 보기 (delivery lens·변경 제안·다음 행동 요약 흡수) |
| 화면 구조 | 제품 보기 |
| 기능 정의 | 제품 보기 |
| 기능 현황 | 제품 보기 (task/acceptance/evidence/blocker 상세 흡수) |
| 사용자 흐름 | 제품 보기 |
| 추적성 | 제품 보기 (coverage/gap/neighborhood 기본, matrix/CSV 보조) |
| 운영·고급 | 보조 disclosure — version/digest, 동기화 health, 자동화 기록 |

과거의 독립 `전달 현황`·`동기화` 탭은 제거·흡수됐다(6.9절 참조).

현재 코드의 `PLANNING_VIEWS`는 여섯 제품 보기를 렌더하고 `운영·고급` disclosure가
별도로 렌더된다(T118/T123 완료, 2026-07-17). 계약은
[`hub-view-contract.md`](../specs/010-planning-hub-redesign/contracts/hub-view-contract.md)에
기록돼 있다.

### 6.3 개요

현재 개요는 다음을 요약한다.

- 현재 workspace와 source revision/root
- screen, feature, flow 수
- source health와 첫 복구 행동

최종 목표에서는 프로젝트 전체 구현·검증 readiness와 Delivery Evidence 요약도 개요에
흡수한다.

### 6.4 화면 구조

화면 구조의 노드는 screen/content destination만 사용한다. 기능, Spec, task, test는
화면 노드가 아니다.

#### 구조 탐색

- surface별 화면 목록
- screen 검색
- stable screen ID, type, route, access
- parent-child 관계
- direct navigation
- 관련 기능정의·사용자 흐름·근거 화면으로 이동

#### 가로 조직도

- 홈/root에서 큰 영역이 가로로 펼쳐진다.
- 하위 화면은 아래 방향으로 배치된다.
- parent-child hierarchy는 실선이다.
- 직접 이동은 점선 화살표다.
- surface는 색과 text label을 함께 사용한다.
- pan, zoom, fit과 node 선택을 제공한다.
- 좌표는 sitemap 원본에 저장하지 않고 deterministic layout으로 계산한다.

#### 대체 보기

- 현재 화면 문구: `계층 목록(접근성 보기)` (FR-070 명칭 정정 완료, 2026-07-17)
- 비교표: screen ID, surface, parent, direct navigation, access

트리와 표는 별도 사이트맵이 아니다. 구조 탐색과 조직도에 사용하는 동일한 screen ID를
텍스트와 표로 제공하는 접근성 대안이다.

### 6.5 기능 정의

현재 구현은 배치 중심 세 영역이다.

1. Surface와 Screen 구조
2. 선택 화면의 기능 그룹과 기능 목록
3. 선택 기능의 상세

기능명, 사용자 목표, screen ID와 기능 그룹으로 검색할 수 있다. 기능 카드에서 priority는
`우선순위 P1`처럼 전체 의미를 표시하지만, 배치와 사용자 목표보다 앞세우지 않는다.

상세에는 다음 정보가 보인다.

- stable ID, 제목, 요약
- 사용자 목표와 기능 그룹
- target Release
- primary/entry/result/support 화면 배치
- 정의 상태, 구현 집계 상태, 동기화 상태
- 목적과 범위
- 행동과 상태
- 규칙과 데이터
- 품질과 보안
- acceptance criterion
- 근거와 결정
- 연결된 작업 분포
- 같은 feature ID로 기능현황 이동

필터 결과가 0이면 이전 상세를 남기지 않고 “현재 필터에서 선택할 기능 정의가 없음”을
표시한다.

### 6.6 기능 현황

기능현황의 기본은 선택 기능 컨텍스트와 4열 Kanban이다.

#### 왼쪽 기능 컨텍스트

- feature ID와 제목
- 주 화면과 기능 그룹
- target Release
- 예정·진행·검토·완료·보류 수
- task, acceptance, evidence, blocker 수
- 기능 정의로 돌아가기

#### 오른쪽 작업 영역

- Kanban 열: 예정, 진행 중, 검토·검증, 완료
- 카드 단위: `FeatureWorkItem`
- 카드 정보: 작업명, work type, Release, hold, 근거 상태
- 보기 전환: Kanban / 기능별
- 필터: Release, 기능 그룹, work type, hold, 검색
- 선택 작업 상세: task, acceptance, evidence, blocker, 완료 차단 이유

Kanban과 기능별 보기는 동일한 정규화 작업 node 집합을 이동해 사용한다. 같은 작업을 두
DOM 집합으로 복제해 서로 다른 상태가 되지 않게 설계했다.

### 6.7 사용자 흐름

현재 코드에는 actor와 goal 중심 story projection이 구현돼 있다.

- 정상 경로를 순서대로 표시한다.
- decision, failure, recovery를 발생한 source step에 연결한다.
- step마다 screen ID와 feature ID를 보존한다.
- broken target, ambiguous branch, cycle을 health로 보고한다.
- 모든 source step과 branch를 순서형 text alternative로 제공한다.
- owner/role 정보가 있는 복잡한 흐름만 보조 role lane을 표시한다.

관련 task T116/T119/T120은 2026-07-17에 실상과 정합됐다(구현 선행, 렌더 검증 갭 보강
후 체크). 근거는 `specs/010-planning-hub-redesign/verification.md`의 flow story 절에
기록돼 있다.

### 6.8 추적성

현재 화면은 승인된 목표 구조 그대로다(T117/T121/T122 완료, 2026-07-17).

1. coverage 요약 (전체·완결·근거 누락·깨진 관계)
2. severity 순 누락 작업함 — 각 항목에 원인별 명칭과 복구 행동
3. 선택 기능의 Need, Feature, Screen, Flow, Spec, FeatureWorkItem, Verification
   bounded local neighborhood
4. 전체 matrix와 CSV는 접힌 보조 진단

구현 모듈은 `build-traceability-coverage.mjs`(모델)와
`render-traceability-coverage-view.mjs`(화면)이고, 500 기능/2,000 작업 규모 회귀는
`tests/planning-traceability-coverage.test.mjs`가 고정한다.

### 6.9 흡수된 전달 현황과 운영·고급 (전환 완료)

과거의 독립 `전달 현황` 탭(세 lens + 변경 제안)은 제거됐다. 세 lens 요약과 변경
제안·다음 행동은 개요가, task/acceptance/evidence/blocker 상세는 기능 현황 카드·상세가
담당한다(FR-017/FR-060).

과거의 독립 `동기화` 탭 내용은 `운영·고급` disclosure로 이동했다.

- planning package revision, manifest version과 digest
- delivery source revision과 consumed digest
- 동기화 health, 마지막 정상 수집 시각(자동화 기록)
- 복구 행동

이 정보는 제품 기능을 매일 탐색하는 메뉴보다 운영 정보에 가깝다. `운영·고급`을
열 때만 표시되고, 열고 닫아도 현재 제품 view와 feature 선택이 유지된다.

---

## 7. 파일별 역할

이 절은 “어떤 내용을 고치려면 어느 파일을 봐야 하는가”에 답한다.

### 7.1 계획과 설계의 원본

| 파일 | 역할 |
| --- | --- |
| `specs/010-planning-hub-redesign/spec.md` | 사용자 시나리오, 기능 요구사항, 성공 기준의 정본 |
| `specs/010-planning-hub-redesign/plan.md` | 아키텍처, 구현 slice, 기술 경계와 파일 구조 |
| `specs/010-planning-hub-redesign/tasks.md` | 실행 순서와 완료 여부를 기록하는 durable checkpoint |
| `specs/010-planning-hub-redesign/research.md` | format, ownership, reconcile, page split 등 조사 결정 |
| `specs/010-planning-hub-redesign/data-model.md` | entity, field, validation, 상태 전이와 소유권 |
| `specs/010-planning-hub-redesign/contracts/*.md` | manifest, evidence, work item, view 등 외부 관찰 가능 계약 |
| `specs/010-planning-hub-redesign/quickstart.md` | 단계별 검증 방법과 기대 결과 |
| `specs/010-planning-hub-redesign/verification.md` | 실제 실행 명령, 테스트, 브라우저와 미완료 사람 검증 기록 |
| `specs/010-planning-hub-redesign/status.yaml` | Spec Kit 기능의 현재 lifecycle 상태 |
| `docs/superpowers/specs/*.md` | 승인 전·후 브레인스토밍과 설계 선택의 배경. plan of record는 아님 |

설계가 충돌하면 `specs/010`의 최신 requirement, contract, task가 우선한다. 탐색 문서는
결정 배경을 설명하지만 현재 구현 상태를 단독으로 판정하는 원본이 아니다.

### 7.2 Schema와 계약 파일

| 파일 | 소유권 | 역할 |
| --- | --- | --- |
| `.harness/config/feature-definition-schema.json` | harness contract | legacy catalog의 21개 field, 8개 table column, 상태·결정 값 |
| `.harness/config/feature-detail-schema.json` | planning source contract | rich detail 필수 그룹, 정의 상태, placement role, provenance level |
| `.harness/config/feature-work-item-schema.json` | project delivery contract | 1:N 구현 작업, work type, 상태, hold, 완료 필수 field |
| `.harness/config/sitemap-schema.json` | planning source contract | user/admin/common surface와 screen hierarchy |
| `.harness/config/user-flow-schema.json` | planning source contract | actor/goal/entry/step/edge와 정상·실패·복구 종류 |
| `.harness/config/traceability-schema.json` | planning source contract | entity type, relation type, typed endpoint |
| `.harness/config/planning-manifest-schema.json` | publisher snapshot contract | immutable package envelope와 digest 제외 field |
| `.harness/config/delivery-evidence-schema.json` | downstream snapshot contract | consumed digest, source revision, workItems 우선과 legacy features 호환 |
| `.harness/config/change-proposal-schema.json` | reconcile/review contract | 계획·관찰 값, evidence, decision owner, 처리 상태 |
| `.harness/config/hub-workspace-schema.json` | current project contract | workspace ID, root, source descriptor와 안전하지 않은 field 금지 |

`feature-definition-schema.json`과 `feature-detail-schema.json`은 같은 파일의 구버전·신버전
관계가 아니다. 전자는 불규칙한 외부 자료를 잃지 않고 담는 catalog이고, 후자는 구현 판단에
필요한 rich definition이다.

### 7.3 사람 또는 프로젝트가 소유하는 데이터

| 파일/경로 | 역할 | generator 동작 |
| --- | --- | --- |
| `data/sitemap.json` | 실제 하네스 screen-only 사이트맵 | 읽기·검증만 수행 |
| `data/feature-relations.json` | 실제 하네스 typed relation | 읽기·health 계산만 수행 |
| `data/user-flows.json` | 실제 하네스 actor/goal flow | 읽기·health 계산만 수행 |
| `data/feature-definitions.json` | 존재할 경우 legacy canonical catalog | 읽고 Spec 파생 row와 병합 |
| `data/hub-workspaces.json` | default workspace와 source root 선언 | 저장소 내부 안전 경로만 해석 |
| `specs/<NNN>/status.yaml` | 기능 lifecycle, owner, dependency | 기능현황/legacy feature scan |
| `specs/<NNN>/tasks.md` | project-owned 실행 task | 진행률과 다음 작업 계산 |
| `specs/<NNN>/verification.md` | 검증 checklist와 실행 근거 | verification coverage 계산 |

사람 소유 JSON은 build가 자동 정규화하거나 다시 쓰지 않는다. 개별 오류는 가능한 범위에서
제외하고 health를 보여준다.

### 7.4 Community Demo

| 파일 | 역할 |
| --- | --- |
| `examples/community-app/planning/needs.json` | Demo 사용자의 필요 |
| `examples/community-app/planning/sitemap.json` | 14개 screen의 제품 구조 |
| `examples/community-app/planning/feature-definitions.json` | 12개 feature catalog와 group/placement/target Release |
| `examples/community-app/planning/feature-details.json` | 12개 rich detail |
| `examples/community-app/planning/user-flows.json` | 발견, 게시, 신고·운영 3개 목표 흐름 |
| `examples/community-app/planning/feature-relations.json` | Demo typed relation |
| `examples/community-app/planning/decisions.json` | planning decision |
| `examples/community-app/planning/planning-manifest.json` | immutable Demo planning package |
| `examples/community-app/downstream/planning.lock.json` | Demo 프로젝트가 수신한 package |
| `examples/community-app/downstream/delivery-evidence.json` | legacy delivery facts와 명시적 work item |
| `examples/community-app/downstream/change-proposals.json` | 계획과 실제 차이의 검토 제안 |
| `examples/community-app/expected/*.json` | Demo health와 hub snapshot 기대값 |

`FEAT-POST-CREATE`에는 R1의 frontend/planned, backend/in-progress,
qa/in-review 작업을 넣어 1:N 관계를 실제 화면에서 확인하게 했다. 계획의 이미지 10장과
관찰된 4장 차이도 의도적으로 남겨 drift와 Change Proposal을 설명한다.

### 7.5 Scanner와 compatibility adapter

| 파일 | 역할 |
| --- | --- |
| `scan-md.mjs` | README, docs, `.harness/docs`, specs의 Markdown 제목·경로·본문 수집 |
| `build-document-projections.mjs` | 문서별 안전한 HTML body와 conversion health 생성 |
| `render-markdown-document.mjs` | 외부 의존성 없이 지원 Markdown을 escape된 HTML로 변환 |
| `scan-specs.mjs` | status.yaml, tasks, verification, Spec detail을 읽어 기능 상태 모델 생성 |
| `scan-service-definition.mjs` | legacy `data/feature-definitions.json` 읽기 |
| `merge-service-definition.mjs` | normalizer row와 Spec 파생 row를 stable ID로 병합 |
| `merge-registry.mjs` | 선택적 registry와 Spec 기능을 병합 |
| `scan-sitemap.mjs` | sitemap 구조, ID, alias를 fail-open 검증 |
| `merge-sitemap.mjs` | screen assignment/Area를 sitemap node에 연결하고 미배치·빈 화면 계산 |
| `scan-traceability.mjs` | typed entity/link 구조 검증 |
| `scan-user-flows.mjs` | flow/step/edge, broken next, cycle 검증 |
| `scan-feature-details.mjs` | rich detail contract와 readiness health 계산 |
| `scan-delivery-evidence.mjs` | declared evidence와 Spec evidence 수집 |
| `parse-spec-detail.mjs` | Spec Markdown의 시나리오·acceptance·edge case·requirement 추출 |
| `scan-workspaces.mjs` | workspace config, default, repository-relative source 해석 |

### 7.6 Model, 정규화와 조정

| 파일 | 역할 |
| --- | --- |
| `build-linked-hub-model.mjs` | feature, screen, flow, Spec, verification registry와 typed link/health 결합 |
| `build-workspace-hub-model.mjs` | 한 workspace의 planning, delivery, work item, rollup, sync를 독립 모델로 구성 |
| `normalize-feature-work-items.mjs` | explicit work item 검증, legacy 단일 작업 투영, invalid 격리 |
| `aggregate-feature-work-items.mjs` | done guard, Release-aware 기능 상태 집계, hold count |
| `build-user-flow-story.mjs` | 정상 경로와 decision/failure/recovery를 bounded traversal로 변환 |
| `reconcile-planning-delivery.mjs` | manifest/lock/evidence를 비교해 status, drift, proposal 계산 |
| `canonical-json.mjs` | 의미가 같은 JSON의 안정 직렬화와 SHA-256 digest |
| `compile-planning-manifest.mjs` | planning source를 immutable manifest로 컴파일·검증 |
| `apply-planning-lock.mjs` | 완전 검증 후 Planning Lock을 임시 파일에서 원자 교체 |
| `planning-contracts.mjs` | 계약 validation, safe path, source descriptor 검증 |
| `layout-sitemap-org-chart.mjs` | screen-only 가로 조직도의 deterministic 좌표와 edge 계산 |

승인됐지만 아직 없는 파일:

- `build-traceability-coverage.mjs`
- `render-traceability-coverage-view.mjs`

이 두 파일은 추적성 기본 화면을 matrix에서 coverage/gap/local neighborhood로 바꿀 때
추가할 예정이다.

### 7.7 Renderer와 CSS

| 파일 | 역할 |
| --- | --- |
| `render-docs-page.mjs` | 문서 범주, 검색, 목록, reader와 fragment 복원 HTML |
| `render-planning-page.mjs` | Planning shell, workspace switch, view navigation, 공유 client state |
| `render-feature-workbench-view.mjs` | 배치 중심 기능정의와 FeatureWorkItem Kanban/기능별 보기 |
| `render-user-flow-story-view.mjs` | goal story, branch, detail, ordered text, 조건부 role lane |
| `templates/hub.css` | 문서 허브와 Planning Hub 공용 visual system, 반응형·상태·조직도 스타일 |

이전 단일 허브 renderer(`render-hub.mjs`)는 2026-07-18에 제거됐다(012) —
프로덕션 참조 0 확인 후 삭제, screen-only 사이트맵 불변식 테스트는 현행
Planning 렌더러로 이식됨.

`render-planning-page.mjs`의 전환은 완료됐다(2026-07-17). 여섯 제품 view와
operations disclosure를 렌더하고, 보조 tree 명칭은 `계층 목록(접근성 보기)`다.

### 7.8 생성, 동기화, 명령과 hook

| 파일 | 역할 |
| --- | --- |
| `build-hub.mjs` | 모든 source/model을 수집하고 두 renderer 완료 후 page set 기록 |
| `planning-sync.mjs` | source group digest, no-op skip, build/reconcile, automation run 기록 |
| `planning-check.mjs` | manifest/lock/evidence/relation/conflict와 두 HTML strict 비교 |
| `planning-watch.mjs` | 선택적 로컬 변경 감시와 debounce sync |
| `feature-seed-check.mjs` | top-down Spec 생성 전 유사 기능·ID 중복 탐색 |
| `feature-status.mjs` | 명시적 기능 상태 전이와 이력 기록 |
| `feature-status-sync.mjs` | task/verification/decision 기반 인접 상태 전이 제안·선택 적용 |
| `.harness/hooks/docs-build-on-stop.mjs` | Claude/Codex가 공유하는 관련 변경 분류와 비차단 Stop sync |
| `.harness/hooks/codex-stop.mjs` | Codex payload/cwd를 공용 Stop 코어에 맞추는 얇은 adapter |
| `mise.toml` | `docs:build`, `planning:*`, `feature:status*` 사용자 명령 등록 |
| `.harness/scripts/checks/ci-node-verify.sh` | merge-ready strict planning check를 CI 검증에 연결 |

Stop hook은 편의 기능이다. 사람의 직접 편집이나 hook 미실행을 막지 못하므로 최종 통제는
`planning:check`와 CI다. Stop은 stage, commit, push, PR, Planning Lock 교체를 하지 않는다.

### 7.9 생성물과 상태 파일

| 파일 | 역할 | 직접 수정 |
| --- | --- | --- |
| `docs/index.html` | 자체 완결 문서 허브 | 금지 |
| `docs/planning.html` | 자체 완결 Planning Hub | 금지 |
| `.harness/state/planning-automation.json` | 마지막 자동화 run과 digest | 생성 상태 |

생성 대상이 symlink면 쓰지 않는다. 두 HTML을 임시 파일로 모두 준비한 후 교체하며, 중간
실패 시 가능한 범위에서 이전 byte를 복구한다.

### 7.10 테스트 파일 역할

| 테스트 | 검증 범위 |
| --- | --- |
| `docs-page-render.test.mjs` | 문서 범주, 목록, reader, fragment, 안전성 |
| `docs-markdown-projection.test.mjs` | Markdown 변환, hostile HTML, link 처리 |
| `planning-contracts.test.mjs` | manifest/detail/evidence/proposal/workspace 계약 |
| `planning-manifest.test.mjs` | canonical digest와 manifest validation |
| `planning-workspaces.test.mjs` | Demo/actual workspace 격리와 fail-open health |
| `planning-demo-data.test.mjs` | Demo 건수, 의도적 gap/drift와 snapshot |
| `planning-feature-detail.test.mjs` | rich detail readiness와 누락 field |
| `planning-feature-work-items.test.mjs` | 1:N, legacy, done guard, Release, hold, invalid |
| `planning-feature-workbench-render.test.mjs` | 배치 탐색, Kanban, 필터, 선택 상태, 대규모 작업 |
| `planning-user-flow-story.test.mjs` | 정상 경로, branch, cycle, text alternative |
| `planning-sitemap-render.test.mjs` | screen-only 표현과 선택 동기화 |
| `planning-org-chart.test.mjs` | deterministic layout와 screen-only edge |
| `planning-reconcile.test.mjs` | aligned/behind/drifted/conflicted/failed |
| `planning-pull.test.mjs` | validate-before-write와 lock 원자 교체 |
| `planning-automation.test.mjs` | trigger parity, digest, no-op, last success |
| `planning-check.test.mjs` | stale page와 strict contract failure |
| `docs-build-on-stop.test.mjs` | source group 분류, generated 제외, fail-open |
| `codex-stop.test.mjs` | Codex adapter와 Claude 공용 코어 동등성 |
| `feature-hub-*.test.mjs` | 기존 기능 허브와 legacy contract 회귀 |

`planning-traceability-coverage.test.mjs`는 아직 존재하지 않는다. 추적성 후속 구현의 첫 RED
test가 될 예정이다.

---

## 8. Top-down과 Bottom-up 동작

### 8.1 Top-down: 무엇을 만들어야 하는가

```text
외부 요구/기능 자료
  → normalizer가 불확실성·출처를 보존해 catalog 후보 생성
  → 사이트맵 초안 확인과 stable screen ID 확정
  → FeatureDefinition catalog + FeatureDetail 작성
  → flow/relation/decision 연결
  → Planning Manifest version/digest 발행
  → downstream이 명시적으로 Planning Lock 수신
  → 같은 feature ID로 Spec과 FeatureWorkItem 분석 시작
```

중복 방지를 위해 Spec을 만들기 전에 다음을 실행한다.

```bash
mise run feature:seed-check "기능명"
```

AI가 normalizer를 사용하더라도 확인되지 않은 actor, 상태, 규칙, acceptance를 사실처럼
채우지 않는다. `confirmed`, `inferred`, `question`과 열린 결정을 보존한다.

### 8.2 Bottom-up: 무엇이 구현·검증됐는가

```text
Spec / task / code / test / verification
  → project가 FeatureWorkItem을 명시적으로 분할
  → Delivery Evidence 수집
  → work item normalize + completion guard + rollup
  → consumed manifest와 planning source 비교
  → 기능현황, Sync Result, Change Proposal projection
```

legacy evidence에 명시적 work item이 없으면 기능당 하나의
`WORK-<feature-id>-LEGACY`, `workType: unspecified`, `releaseId: unassigned`를 만든다.
frontend/backend/QA를 제목이나 경로에서 추론하지 않는다. 명시적 work item이 생기면 같은
기능의 legacy projection을 억제한다.

### 8.3 왜 자동 양방향 병합을 하지 않는가

planning owner와 project owner는 서로 다른 사실을 소유한다. 구현에서 이미지 제한이 4장으로
관찰됐다고 planning의 10장을 자동으로 4장으로 바꾸면, 버그와 의도 변경을 구분할 수 없다.
반대로 새 planning package의 10장을 프로젝트 코드와 task에 자동 덮어쓰면 진행 중인 작업과
검증 근거를 손상할 수 있다.

그래서 차이는 다음 중 하나로 사람이 결정한다.

- `implementation-fix`: 계획을 유지하고 프로젝트 구현을 수정
- `planning-change`: planning workflow에서 정의 변경 검토
- `defer`: 조건과 함께 차이를 유지
- `reject`: 관찰 근거나 제안을 채택하지 않음

---

## 9. 명령과 운영 방법

### 9.1 문서와 Planning Hub 생성

```bash
mise run docs:build
```

결과:

- `docs/index.html`
- `docs/planning.html`

두 파일을 직접 수정하지 않는다. Markdown, Spec, planning source 또는 delivery source를
수정한 뒤 다시 생성한다.

### 9.2 동기화와 strict 검사

```bash
mise run planning:sync
mise run planning:check
```

- `planning:sync`는 관련 source digest가 같으면 중복 build를 건너뛴다.
- `planning:check`는 no-write build 결과와 디스크의 두 HTML을 byte 단위로 비교한다.
- 하나라도 오래됐거나 없으면 실패한다.

선택적인 로컬 watcher:

```bash
mise run planning:watch
```

watcher는 시작할 때 root를 수집한다. 실행 중 workspace config나 delivery source root를
추가했다면 watcher를 재시작한다.

### 9.3 새 계획 package 수신

```bash
mise run planning:pull
```

이 명령만 Planning Lock을 바꿀 수 있다. candidate manifest 전체의 schema, project ID,
version, digest를 검증한 뒤 임시 파일을 원자 교체한다. 실패하면 기존 lock byte와 마지막 정상
projection을 유지한다.

### 9.4 기능 상태

```bash
mise run feature:status <feature-id> <state>
mise run feature:status:sync
mise run feature:status:sync --apply
```

`feature:status:sync` 기본은 제안만 한다. `--apply`는 결정 가능한 인접 전이에만 사용한다.
`on-hold`와 모호한 상태는 자동 적용하지 않는다.

### 9.5 자주 보는 오류

| 증상 | 의미 | 복구 |
| --- | --- | --- |
| `stale generated output` | 원본과 HTML이 다름 | `docs:build` 후 `planning:check` |
| `Planning Lock mismatch` | 프로젝트가 소비한 package와 evidence가 다름 | package/evidence 검토 후 필요한 경우만 pull |
| `definition-incomplete` | 구현 판단에 필요한 detail 누락 | 누락 field 정의 또는 명시적 exempt reason |
| `작업 미생성` | 0%가 아니라 FeatureWorkItem이 아직 없음 | 프로젝트에서 작업 분할 검토 |
| `done`이 `in-review`로 보임 | 완료 근거 조건 부족 | task, acceptance, evidence, blocker 확인 |
| `미배치` | feature가 screen과 연결되지 않음 | placement 또는 typed `appears-on` 검토 |
| `broken relation/flow` | 참조 ID가 존재하지 않음 | source ID와 endpoint 수정 |
| `collection-failed` | 현재 source 수집 실패 | last-good 시각과 health action 확인 |

---

## 10. Claude, Codex, 사람 편집의 자동화

목표는 모든 편집을 hook으로 강제하는 것이 아니라, 어떤 경로로 편집해도 같은 core 검증으로
수렴하게 하는 것이다.

```text
Claude Stop ─┐
Codex Stop ──┼─→ runPlanningSyncIfRelevant ─→ runPlanningSync ─→ shared build
watcher ─────┤
수동 sync ───┘

사람 직접 편집 ─────────────────────────────→ planning:check / CI
```

- Claude와 Codex의 차이는 payload와 cwd를 읽는 adapter뿐이다.
- 변경 경로를 `data`, `specs`, `examples`, configured evidence로 분류한다.
- generated HTML과 automation log는 입력 digest에서 제외해 무한 rebuild loop를 막는다.
- Stop 실패는 사용자 turn을 막지 않는다.
- hook은 Planning Lock, planning source, project source를 쓰지 않는다.
- prompt 내용과 secret은 automation digest/state에 저장하지 않는다.
- 직접 편집은 hook을 우회할 수 있으므로 CI가 최종 보장이다.

Codex에는 Claude Code의 `UserPromptSubmit`과 같은 hook이 없으므로 시작 preflight와 Stop,
명시적 check로 동등성을 맞춘다. 존재하지 않는 hook이 실행됐다고 가정하지 않는다.

---

## 11. 향후 별도 `planning-hub` 저장소

현재 구현은 저장소 내부의 repository-relative source를 읽는다. 원격 저장소 publish/pull,
자동 PR, 양방향 쓰기는 아직 구현하지 않았다.

목표 구조는 다음과 같다.

```text
planning-hub repository
  project A planning source
    → immutable PlanningPackage v1.2.0 + digest
                     │
                     │ 승인된 transport로 candidate 전달
                     ▼
downstream project A
  PlanningLock(consumedVersion, consumedDigest)
  Spec / task / FeatureWorkItem / evidence
                     │
                     ▼
  DeliveryEvidence + ChangeProposal
                     │
                     └─ planning-hub review workflow로 전달
```

분리할 때 유지해야 할 계약:

- project-scoped stable entity ID
- schema version과 manifest version
- canonical digest
- immutable published package
- explicit receipt와 atomic Planning Lock
- planning source와 project source의 별도 owner
- evidence provenance와 certainty
- added/changed/removed 정의의 proposal
- invalid package에서 last-good 보존
- external repository에 대한 자동 write 금지

분리 이후에도 FeatureDefinition에 downstream repository 위치를 넣지 않는다. workspace/source
descriptor가 transport와 repository 경계를 담당한다. credential URL, command, executable,
token, password, secret field는 계약에서 거부한다.

---

## 12. 현재 구현 완료와 남은 작업

### 구현·검증된 축

- 문서 허브와 Planning Hub 두 페이지 생성
- Markdown reader, 검색, fragment 복원과 안전한 projection
- workspace 격리와 Demo/actual fallback 금지
- screen-only sitemap과 deterministic 가로 조직도
- rich FeatureDetail readiness
- immutable manifest/digest, lock, evidence, proposal와 reconcile
- Claude/Codex 공용 Stop core와 manual/check/CI 경계
- `FeatureDefinition 1:N FeatureWorkItem`
- work item validation, legacy compatibility, done guard, Release rollup
- 배치 중심 기능정의 explorer
- 선택 기능 중심 4열 Kanban과 기능별 대안 보기
- task/acceptance/evidence/blocker 상세
- goal story model/renderer 코드와 focused test

### 전환 완료 축과 남은 축 (2026-07-17 갱신)

| 항목 | 현재 | 관련 task |
| --- | --- | --- |
| 사용자 흐름 durable state | 정합 완료 — 체크·검증 기록 존재 | T116, T119, T120 완료 |
| 추적성 | coverage/gap/local neighborhood 기본, matrix/CSV 보조 | T117/T121/T122 완료 |
| navigation | 6개 제품 보기 + 운영·고급 disclosure | T118/T123 완료 |
| 접근성 명칭 | `계층 목록(접근성 보기)` | T118/T123 완료 |
| 반응형·접근성 CSS | skip link, 900px/600px, 44px, reduced-motion, 비색상 채널 | T124/T125 완료 |
| 성능 전체 표본 | 500/2,000/100/50 표본 2초 내 page-set + bounded neighborhood 회귀 고정 | T128 완료 |
| 문서 동기화 | README/CONTRIBUTING/handoff/skill이 여섯 보기 계약 서술 | T126 완료 |
| 전체 수렴 | 전체 test/build/check/rule 게이트 통과 기록 | T127/T130 기록 |
| 사람 사용성 | 자동·브라우저 QA 존재 | PM/PL·개발자 5명 중 4명 성공 T098 남음 |

여섯 제품 보기와 coverage 기본 추적성은 이제 현행 구현이다. 남은 사람 검증(T098)과
완료 반영(T101)만 승인 목표와 현행의 차이로 남아 있다.

---

## 13. 용어 정리

| 용어 | 의미 |
| --- | --- |
| Feature catalog | 검색·분류와 외부 자료 호환을 위한 얇은 기능 row |
| FeatureDefinition | catalog와 rich detail을 결합한 planning-owned 기능 정의 |
| FeatureDetail | 행동, 상태, 규칙, 품질, acceptance와 근거의 상세 |
| FeaturePlacement | 기능이 screen에서 맡는 primary/entry/result/support 역할 |
| FeatureWorkItem | 프로젝트가 기능을 구현하기 위해 만든 기술 작업 |
| FeatureStatusRollup | 연결 작업을 Release와 상태 규칙으로 집계한 읽기 모델 |
| Sitemap | screen 계층과 direct navigation 원본 |
| UserFlowStory | actor/goal 흐름을 정상 경로와 branch로 읽기 쉽게 만든 projection |
| Traceability | need, feature, screen, flow, Spec, work, verification의 typed 연결 |
| PlanningPackage | planning-hub가 발행하는 immutable 프로젝트 계획 단위 |
| PlanningManifest | 현재 v1 PlanningPackage 직렬화 envelope |
| PlanningLock | downstream이 명시적으로 수신한 version/digest 기록 |
| DeliveryEvidence | 실제 구현·검증 사실의 downstream snapshot |
| SyncResult | 계획과 evidence 차이를 계산한 읽기 모델 |
| ChangeProposal | 차이를 자동 수정하지 않고 사람에게 제안하는 기록 |
| Projection | 원본을 수정하지 않고 화면·집계·health로 변환한 결과 |
| Stable ID | 제목·위치가 변해도 entity 관계를 유지하는 식별자 |

---

## 14. 관련 문서

- [`Planning Hub 운영과 분리 저장소 인계`](planning-hub-handoff.md)
- [`010 데이터 모델`](../specs/010-planning-hub-redesign/data-model.md)
- [`Planning Hub View Contract`](../specs/010-planning-hub-redesign/contracts/hub-view-contract.md)
- [`Rich Feature Detail Contract`](../specs/010-planning-hub-redesign/contracts/feature-detail.md)
- [`Feature Work Item Contract`](../specs/010-planning-hub-redesign/contracts/feature-work-item.md)
- [`Planning Package / Manifest Contract`](../specs/010-planning-hub-redesign/contracts/planning-manifest.md)
- [`Immutable Planning Package Receipt`](../specs/010-planning-hub-redesign/contracts/planning-package-receipt.md)
- [`Delivery Evidence Contract`](../specs/010-planning-hub-redesign/contracts/delivery-evidence.md)
- [`Change Proposal Contract`](../specs/010-planning-hub-redesign/contracts/change-proposal.md)
- [`010 검증 Quickstart`](../specs/010-planning-hub-redesign/quickstart.md)
- [`010 현재 Task`](../specs/010-planning-hub-redesign/tasks.md)
- [`010 검증 기록`](../specs/010-planning-hub-redesign/verification.md)

이 문서를 수정할 때는 설명을 현재 코드에 억지로 맞추거나 승인 목표를 구현 완료로 표현하지
않는다. `spec.md`, contracts, unchecked tasks, 실제 renderer와 test를 함께 확인한 뒤 현재와
목표를 구분해 갱신한다.
