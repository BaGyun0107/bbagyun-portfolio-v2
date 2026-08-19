# Implementation Basis: 기능정의·사이트맵·기능현황 허브 후속 판단

- Date: 2026-07-16
- Scope: `007-sitemap-board` 구현 이후의 구조·문서·UI 개선 판단 근거
- Decision status: 조사 완료, 후속 구현 미승인
- Source of truth: 이 문서는 판단 기록이며, 실제 후속 구현 계획은 별도
  Spec Kit 기능 원장에서 확정한다.

## 1. Executive Decision

현재 허브는 기능 카탈로그와 전달 상태를 탐색하는 MVP로는 유효하다.
그러나 PM/PL, 디자이너, 개발자, AI가 동일한 근거로 실제 구현을 판단하는
시스템으로 확장하려면 다음 구조가 필요하다.

1. 사이트맵은 화면·콘텐츠의 계층과 탐색 구조를 표현한다.
2. 사용자 흐름은 목표 달성을 위한 행동·분기·종료 조건을 표현한다.
3. 기능정의 행은 얇은 카탈로그로 유지하고, 상세 동작과 인수 조건은
   Spec Kit `spec.md`에서 가져온다.
4. 사용자 요구, 기능, 화면, 흐름, 설계, 테스트 사이의 다대다 관계는
   자유 텍스트가 아니라 구조화된 ID로 추적한다.
5. 허브는 관계도·트리·표·상세 패널을 같은 원본에서 파생해 보여준다.

권장 구현안은 **Option B: 기존 진실의 원천을 연결하는 점진적 허브 v2**다.
현재 007의 범위를 확대해 구현하지 않고, 007을 검수 완료한 뒤 별도 후속
기능으로 계획한다.

## 2. Questions This Record Answers

- 사이트맵은 첨부 예시처럼 박스와 연결선으로 보여야 하는가?
- 사이트맵과 기능정의서는 어떤 순서로 작성해야 하는가?
- 기능정의 상세에 무엇이 있어야 사람이 구현 내용을 이해할 수 있는가?
- AI가 누락·충돌·미검증 상태를 판단하려면 어떤 구조가 필요한가?
- 현재 007 구현에서 그대로 유지할 부분과 후속 기능으로 분리할 부분은
  무엇인가?

## 3. Current-State Evidence

### E1. 기능정의 행의 최소 유효성은 카탈로그 수준이다

현재 필수 필드는 `Row_ID`, `Title`뿐이며, 내용은 `Why`,
`Change_Summary`, `Used_In` 중 하나로 대체할 수 있다. Actor, 사용자
목표, 동작 흐름, 예외, 인수 조건이 없어도 유효한 행이 된다.

- Evidence: [feature-definition-schema.json](../../.harness/config/feature-definition-schema.json)
- Interpretation: 현재 계약은 기능 인덱스에는 적합하지만 engineering-ready
  상세 명세 계약은 아니다.

### E2. 화면 연결은 `Area` 자유 텍스트의 정확 일치다

사이트맵 노드 배치는 `Area`를 trim한 뒤 node `id`, `aliases` 순서로
정확히 일치시킨다. `Area` 정의는 화면과 도메인 영역을 함께 허용한다.

- Evidence: [sitemap-schema.json](../../.harness/config/sitemap-schema.json)
- Evidence: [feature-definition-schema.json](../../.harness/config/feature-definition-schema.json)
- Interpretation: 화면 하나에 여러 기능, 기능 하나에 여러 화면이 연결되는
  다대다 관계와 user flow 연결을 안정적으로 표현하기 어렵다.

### E3. 현재 작업트리의 확정 사이트맵은 샘플 데이터다

현재 `data/sitemap.json`은 회원/온보딩, 투어/미션, 운영 대시보드,
알림/메시징 노드를 포함하지만 하네스 내부 기능 행에는 대응 `Area`가 없다.
따라서 브라우저 화면에서 전체 기능이 미배치로 표시된다.

- Evidence: [data/sitemap.json](../../data/sitemap.json)
- Evidence: [verification.md](./verification.md)의 US2 실제 실행 기록은
  샘플 사이트맵 검증 후 제거하고 파생 모드로 복귀하도록 설명한다.
- Interpretation: 렌더러의 계산 오류는 아니지만, 현재 화면은 실제 하네스
  구조를 설명하지 못하므로 후속 UI 판단용 기준 데이터로 사용하면 안 된다.

### E4. 기능 상세 패널은 기존 행을 재배열한다

`화면/UI 구성안`은 `Surface`, `Area`, `Used_In`을 나열하고,
`상태/예외`는 처리 상태, 결정 레벨, 확인 질문을 나열한다. 정상 흐름,
대안 흐름, 오류 상태, 인수 조건은 표시하지 않는다.

- Evidence: [render-hub.mjs](../../.harness/scripts/docs/lib/render-hub.mjs)
- Evidence: [spec.md](./spec.md)에는 이미 사용자 시나리오, 인수 시나리오,
  edge case, 기능 요구사항, 성공 기준이 있다.
- Interpretation: 상세 정보가 없는 것이 아니라, 기능정의 상세 뷰가 기존
  Spec Kit 정보를 소비하지 않는 연결 문제다.

### E5. 상세 문서 연결 안내와 실제 계약이 불일치한다

렌더러는 `data/feature-detail-links.csv`에 상세 문서를 연결한다고
안내하지만 현재 저장소에는 해당 파일, 스키마, 스캐너가 없다.

- Evidence: [render-hub.mjs](../../.harness/scripts/docs/lib/render-hub.mjs)
- Interpretation: 새 CSV 계약을 추가하기보다 기존 `spec_link`와 Spec Kit
  문서를 상세 원본으로 사용하는 것이 현재 아키텍처와 일관된다.

### E6. 007은 아직 `in-review`가 적절하다

`tasks.md`의 구현 태스크는 완료됐지만 `verification.md`의 수동 브라우저
검증 5개는 아직 체크되지 않았다. `status.yaml`도 `in-review`다.

- Evidence: [tasks.md](./tasks.md)
- Evidence: [verification.md](./verification.md)
- Evidence: [status.yaml](./status.yaml)
- Interpretation: 후속 v2 구현 전에 현재 007의 동적 UI 검수와 기준 데이터
  정리가 먼저 완료되어야 한다.

## 4. External Research Findings

### R1. 사이트맵과 사용자 흐름은 다른 질문에 답한다

사이트맵은 페이지·화면의 조직과 계층을 보여준다. 사용자 흐름은 사용자가
목표를 달성하기 위해 거치는 행동, 결정 지점, 종료점을 보여준다. 하나의
복잡한 그림으로 합치기보다 연결된 별도 뷰로 관리한다.

- [Figma: What Is a User Flow?](https://www.figma.com/resource-library/user-flow/)
- [Yale: Site Mapping and Information Architecture](https://usability.yale.edu/ux/plan/establish-structure-findability/site-mapping-and-information-architecture)

### R2. 시작점은 화면이 아니라 사용자 요구다

사용자의 문제와 목표를 먼저 이해하고, 그 요구에서 구체적인 user story와
기능·콘텐츠를 도출한다. 사용자 요구와 user story 사이의 추적 관계를
유지해야 한다.

- [GOV.UK: Learning about users and their needs](https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs)
- [GOV.UK: Writing user stories](https://www.gov.uk/service-manual/agile-delivery/writing-user-stories)

### R3. 요구사항과 IA는 선형으로 동결하지 않는다

인간 중심 설계는 시스템 생애주기 전체에 걸친 활동이며, 사용자 요구와
설계는 개발 단계마다 검증·수정된다. 권장 순서는 존재하지만 사이트맵과
기능정의는 반복적으로 함께 갱신하는 살아있는 산출물이다.

- [ISO 9241-210:2019](https://www.iso.org/standard/77520.html)
- [Atlassian: Product Requirements Document](https://www.atlassian.com/agile/product-management/requirements/)

### R4. 구현 가능한 기능정의에는 목적과 검증 가능성이 필요하다

user story는 Actor, 사용자가 하려는 일, 목표를 포함하고, 인수 조건은
사용자 요구를 충족했는지 확인하는 결과 체크리스트여야 한다. 요구사항은
명확하고, 단일 의미이며, 실행 가능하고, 검증 가능해야 한다.

- [GOV.UK: Writing user stories](https://www.gov.uk/service-manual/agile-delivery/writing-user-stories)
- [NASA: System Engineering Handbook Appendix](https://www.nasa.gov/reference/system-engineering-handbook-appendix/)

### R5. 상태만이 아니라 출처와 관계를 추적해야 한다

전문 요구사항 관리는 요구의 상태, 출처, 의존성, 관련 설계·문서·테스트,
변경과 위험을 수명주기 전체에서 추적한다. 양방향 추적 모델은 누락된
요구와 근거 없는 구현을 찾는 데 사용한다.

- [PMI-PBA Examination Content Outline](https://www.pmi.org/the-project-economy/sitecore/content/home/certifications/types/-/media/pmi/documents/public/pdf/certifications/professional-business-analysis-exam-outline.pdf?v=d7ca9eef-fe72-4005-91fc-c13706d6b524)
- [IIBA: The Business Analysis Standard](https://production.iiba.org/globalassets/business-analysis-resources/the-business-analysis-standard/files/the-business-analysis-standard.pdf)

### R6. 관계도에는 트리·표·텍스트 대체가 필요하다

시각화는 관계와 패턴을 빠르게 전달하지만, 원본 표와 핵심 의미를 설명하는
텍스트를 함께 제공해야 한다. 카드는 상세 정보로 들어가는 요약에 적합하고,
동일 구조 데이터를 비교하는 작업은 표에 적합하다.

- [USWDS: Data visualizations](https://designsystem.digital.gov/components/data-visualizations/)
- [USWDS: Card](https://designsystem.digital.gov/components/card/)
- [USWDS: Table](https://designsystem.digital.gov/components/table/)

## 5. Recommended Artifact Model

| Artifact | Answers | Recommended source |
| --- | --- | --- |
| User need / brief | 왜 만들며 누구의 어떤 문제인가 | `spec.md` 또는 연결된 brief |
| Sitemap / IA | 어떤 화면이 있고 어떻게 조직되는가 | `data/sitemap.json` |
| User flow | 사용자가 어떤 행동·분기를 거치는가 | 후속 flow 계약 |
| Feature catalog | 어떤 기능이 존재하고 현재 분류는 무엇인가 | feature-definition row |
| Feature detail | 어떻게 동작하고 무엇을 만족해야 하는가 | `specs/<NNN>/spec.md` |
| Delivery status | 누가 어디까지 만들고 무엇이 남았는가 | `status.yaml`, `tasks.md` |
| Verification | 요구가 실제로 충족됐는가 | `verification.md`, test evidence |
| Traceability | 위 산출물이 어떻게 연결되는가 | 후속 relation 계약 또는 파생 모델 |

### Professional authoring flow

```text
사용자·사업 요구
  -> 대략적 capability/기능 목록
  -> 사이트맵·IA <-> 핵심 사용자 흐름
  -> 상세 기능정의·인수 조건
  -> 화면설계·API·데이터·정책
  -> 구현 작업·기능 현황
  -> 검증 증거·성과 측정
  -> 발견된 내용으로 앞 단계 갱신
```

사이트맵이 상세 기능정의보다 먼저 구조 기준을 제공하는 것은 맞다. 단,
사이트맵 전에 최소한의 사용자 요구와 capability 목록이 있어야 하며,
기능정의 중 새 화면과 흐름이 발견되면 사이트맵을 갱신한다.

## 6. Feature Detail Content Contract

### 6.1 Identity and status

- stable ID, title, one-line summary
- priority, phase/release, owner
- lifecycle status, last reviewed date
- blocker count, open decision count

### 6.2 Intent and user value

- problem/opportunity
- actor and linked user need
- user goal and expected outcome
- evidence and assumptions
- scope and explicit non-goals

### 6.3 Behavior

- trigger and preconditions
- happy path
- alternative paths
- loading, empty, error, retry, permission-denied states
- postconditions and user-visible feedback

### 6.4 Rules, data, and interfaces

- business rules and validation rules
- inputs, outputs, data lifecycle
- permissions and roles
- API, external integration, admin/operations dependencies
- relevant non-functional requirements: performance, accessibility, security,
  availability, privacy

### 6.5 Acceptance and verification

- measurable acceptance criteria
- Given-When-Then scenarios where useful
- success metrics
- linked tests and verification results
- unverified criteria and rollout/operations checks

### 6.6 Traceability and change

- linked need, sitemap node, flow, design, API/data model
- linked spec, task, issue, PR, test, verification
- change reason and prior/next target
- open question, decision owner, due date

## 7. Sitemap Presentation Contract

### Default relation view

- surface별 swimlane: user, admin, common
- node: screen ID, title, route/type, access, feature count, state
- solid connector: parent-child hierarchy
- dotted connector: cross-navigation or external connection
- legend, zoom/fit, minimap, selected-node detail
- visible unassigned and empty-node warnings

### Required alternative views

- Relation view: 전체 구조와 연결
- Tree view: 큰 구조의 검색과 탐색
- Table view: 정렬, 비교, export
- User-flow view: 목표별 단계, 분기, 예외, 종료

사이트맵 관계도는 화면 계층을 중심으로 유지한다. 사용자 행동 분기나 시스템
처리 흐름은 관계도에 과도하게 합치지 않고 user-flow view로 분리한다.

## 8. Data and Traceability Direction

### Keep the catalog thin

`feature-definition-schema.json`을 모든 상세 정보의 저장소로 확장하지 않는다.
현재 행은 검색·필터·정규화·요약을 위한 카탈로그로 유지하고 상세 동작은
Spec Kit에서 가져온다.

카탈로그에 직접 추가할 수 있는 최소 후보는 다음과 같다.

- `Summary`
- `User_Need_IDs`
- `Screen_IDs`
- `Flow_IDs`
- `Priority`
- `Owner`
- `Last_Reviewed_At`

`Spec_Link`, 진행률, delivery status, acceptance status는 기존 spec,
tasks, status, verification에서 파생해 중복 저장하지 않는 편을 권장한다.

### Preferred relationship model

다대다 관계가 늘어나면 행 배열보다 별도 relation contract가 유리하다.

```json
{
  "links": [
    { "from": "NEED-001", "to": "FEAT-010", "type": "satisfied-by" },
    { "from": "FEAT-010", "to": "SCREEN-U2-1", "type": "appears-on" },
    { "from": "FLOW-CHECKOUT", "to": "FEAT-010", "type": "uses" },
    { "from": "FEAT-010", "to": "TEST-E2E-042", "type": "verified-by" }
  ]
}
```

이 모델의 목적은 그래프 UI 자체가 아니라 다음 orphan/coverage 검출이다.

- 사용자 요구와 연결되지 않은 기능
- 기능이 연결되지 않은 화면
- 화면이나 flow가 없는 사용자 기능
- 요구와 연결되지 않은 구현·테스트
- 구현됐지만 검증되지 않은 기능

## 9. Implementation Options

### Option A. Current-board polish only

- Scope: 스타일, 카드 정보, 레이아웃만 개선
- Advantages: 가장 작고 빠르며 기존 계약 변경 없음
- Limits: 상세 명세와 추적성 문제를 해결하지 못함
- Completeness: 4/10
- Decision: 단독안으로 기각

### Option B. Incremental linked hub v2 — recommended

- Scope: 기존 sitemap/spec/status/tasks/verification을 연결하고,
  detail aggregation -> traceability -> relation/flow view 순으로 확장
- Advantages: 기존 진실의 원천을 재사용하고 단계별 독립 검증 가능
- Limits: relation contract와 renderer/scanner 변경을 위한 새 spec 필요
- Completeness: 9/10
- Decision: 권장

### Option C. Full graph workbench

- Scope: 모든 artifact를 그래프 DB 또는 전용 편집 UI에서 관리
- Advantages: 고급 질의, 편집, 영향 분석 가능
- Limits: 외부 의존성 0, 단일 정적 HTML, 파일 기반 workflow와 충돌하며
  현재 규모에 과도함
- Completeness: 10/10, proportionality: 3/10
- Decision: 현 단계 기각

## 10. Recommended Implementation Order

### Gate 0. Close 007 review

1. `verification.md`의 수동 동적 UI 5개를 실제 브라우저에서 검증한다.
2. 샘플 `data/sitemap.json`을 제거할지 실제 하네스 구조로 교체할지
   사용자가 결정한다.
3. `mise run feature:status:sync`가 007의 다음 상태를 제안할 수 있도록
   검증 증거를 최신화한다.

Gate 0 전에는 후속 UI 결과를 현재 샘플 화면으로 평가하지 않는다.

### Slice 1. Detail aggregation

- 기능 카드에서 같은 ID의 `spec.md` 상세로 연결
- user scenarios, acceptance scenarios, edge cases, functional requirements,
  success criteria를 섹션별 렌더
- 존재하지 않는 `feature-detail-links.csv` 안내 제거 또는 실제 계약화

### Slice 2. Structured traceability

- user need, feature, screen, flow, design, test relation contract 확정
- orphan/coverage 계산과 비차단 힌트 추가
- `Area` exact match는 하위 호환 fallback으로 유지

### Slice 3. Sitemap relation view and user-flow view

- 현재 tree/table을 유지한 채 관계도 추가
- 같은 원본에서 관계도·트리·표 파생
- user-flow는 별도 계약과 뷰로 추가
- 텍스트 요약과 표 대체를 제공해 접근성 유지

### Slice 4. Delivery intelligence

- status card에 blocker, next action, last transition, open decisions,
  acceptance/verification coverage 표시
- `done` 판단은 task 100%만이 아니라 acceptance와 verification 증거를 포함

## 11. Decision Gates Before a New Feature Starts

후속 구현 spec을 만들기 전에 사용자가 다음 결정을 확정해야 한다.

| ID | Decision | Recommendation |
| --- | --- | --- |
| D1 | 샘플 sitemap 처리 | 제거 후 파생 모드 또는 실제 하네스 IA로 교체 |
| D2 | 상세 원본 | 새 상세 CSV보다 Spec Kit `spec.md` 우선 |
| D3 | 관계 저장 | 행의 free text보다 별도 typed relation contract |
| D4 | 시각화 범위 | 사이트맵 hierarchy와 user flow를 별도 view로 제공 |
| D5 | 완료 기준 | task 진행률 + acceptance + verification 결합 |
| D6 | 후속 기능 경계 | 007 확장이 아니라 별도 Large feature로 계획 |

## 12. Verification Criteria for the Follow-up

### Data integrity

- 모든 화면·기능·flow ID가 유일하다.
- 모든 relation endpoint가 존재한다.
- 의도하지 않은 미배치 기능은 0건이다.
- orphan screen/feature/test는 명시적인 예외 사유를 가진다.

### Human comprehension

- PM/PL이 첫 화면에서 미배치, 미결정, 미검증, 장기 미갱신 수를 확인한다.
- 디자이너가 두 번 이하의 선택으로 화면별 기능과 flow에 도달한다.
- 개발자가 feature detail만 보고 happy path, error path, rules,
  acceptance criteria, dependency를 식별한다.

### AI readability

- AI가 자유 텍스트 추론 없이 need -> feature -> screen/flow -> test를 추적한다.
- 누락된 acceptance, broken relation, orphan implementation을 결정적으로
  보고한다.
- 중복된 status/progress 원본이 없어 서로 다른 값을 만들지 않는다.

### UI and accessibility

- relation, tree, table view가 같은 필터와 선택 상태를 공유한다.
- 시각화의 핵심 의미를 텍스트와 표에서도 확인할 수 있다.
- 키보드로 node 선택, 상세 열기, view 전환이 가능하다.
- 수백 기능/수십 화면에서 빌드와 탐색 성능 회귀가 없다.

### Delivery governance

- `in-review`에는 최신 verification evidence가 연결된다.
- `done`에는 미해결 acceptance와 열린 결정이 없다.
- status 변경 이력과 결정 근거가 보존된다.

## 13. Scope Boundary

이 문서는 후속 구현의 근거 기록이며 다음을 수행하지 않는다.

- 현재 schema, renderer, scanner, CSS 변경
- `data/sitemap.json` 수정 또는 삭제
- 007 status 자동 전이
- 새 relation/flow 파일 생성
- 후속 feature ID 선점

위 변경은 007 검수 완료와 D1~D6 결정 후 별도 Spec Kit 기능에서
`specify -> clarify -> plan -> tasks -> analyze`를 거쳐 수행한다.

## 14. Remaining Risk

- 실제 다운스트림 앱의 사이트맵 규모와 기능 수를 아직 검증하지 않았다.
- 정적 단일 HTML에서 관계도 렌더링 성능과 접근성 구현 방식을 선택하지 않았다.
- 사용자 요구 ID의 현재 진실의 원천이 정의되어 있지 않다.
- user-flow 파일 형식과 편집 소유권이 정의되어 있지 않다.
- 007 수동 브라우저 검증이 아직 durable evidence로 완료되지 않았다.

이 위험들은 후속 기능의 clarify 단계에서 결정하거나 spike로 검증한다.
