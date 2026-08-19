# Data Model: 연결형 기능 허브 v2

## 1. Entity Reference

| Field | Rule |
| --- | --- |
| `type` | `need`, `feature`, `screen`, `flow`, `spec`, `design`, `api`, `data`, `test`, `verification` 중 하나 |
| `id` | type 범위 안에서 유일한 비어 있지 않은 stable string |

Entity key는 내부적으로 `${type}:${id}`로 만들며 대소문자를 보존한다.

## 2. Traceability Entity

기존 원본에 없는 entity만 `feature-relations.json.entities`로 선언한다.

| Field | Required | Validation |
| --- | --- | --- |
| `type` | yes | 허용 entity type |
| `id` | yes | 같은 type 안에서 unique |
| `title` | yes | non-empty string |
| `href` | no | 로컬 또는 https 문서 참조 |
| `description` | no | 짧은 설명 |

Derived registry:

- feature: feature-definition `Row_ID`
- screen: sitemap node `id`
- flow: user flow `id`
- spec: `status.yaml.id`
- verification: verification 체크가 기록된 spec `id`

## 3. Traceability Link

| Field | Required | Validation |
| --- | --- | --- |
| `from` | yes | Entity Reference, endpoint 존재 |
| `to` | yes | Entity Reference, endpoint 존재 |
| `type` | yes | 허용 relation type |
| `label` | no | 사용자 표시용 조건/설명 |
| `evidence` | no | 근거 문서 참조 |

허용 relation type: `satisfied-by`, `appears-on`, `uses`, `specified-by`,
`designed-by`, `depends-on`, `verified-by`.

중복 key는 `fromKey|type|toKey`; 선선언 우선이다.

## 4. User Flow

| Field | Required | Validation |
| --- | --- | --- |
| `id` | yes | 전체 flow에서 unique |
| `title` | yes | non-empty |
| `actor` | yes | non-empty |
| `goal` | yes | non-empty |
| `entryStepId` | yes | 해당 flow step 존재 |
| `steps` | yes | 1개 이상 |

## 5. Flow Step

| Field | Required | Validation |
| --- | --- | --- |
| `id` | yes | flow 안에서 unique |
| `title` | yes | non-empty |
| `kind` | yes | `start`, `action`, `decision`, `system`, `end` |
| `screenIds` | no | 존재하는 screen ID만 edge 생성 |
| `featureIds` | no | 존재하는 feature ID만 edge 생성 |
| `next` | no | `{to, condition?}` 배열, 존재 step만 edge 생성 |

cycle은 허용하되 warning을 남긴다. broken 참조는 edge만 제외한다.

## 6. Spec Detail

`spec.md`에서 파생하며 원문을 변경하지 않는다.

```text
summary
userStories[]: title, priority, body, acceptanceScenarios[]
edgeCases[]
functionalRequirements[]: id, text
successCriteria[]: id, text
```

명시적 `specified-by` link가 여러 개면 선선언 첫 유효 link를 사용하고
나머지는 duplicate/conflict warning으로 보고한다.

## 7. Delivery Evidence

```text
taskProgress: done, total
nextAction: first unchecked task text | null
lastTransition: at, to | null
openDecisionCount: status.open_decisions + spec clarification markers
verification: recorded, done, total, percent | null
doneEligible: boolean
```

`doneEligible`은 task total > 0 및 100%, verification recorded 및 100%,
openDecisionCount = 0일 때만 true다.

## 8. Coverage Health

```text
brokenLinks[]
duplicateLinks[]
brokenFlowEdges[]
flowCycles[]
orphans: feature[], screen[], flow[], spec[], verification[]
counts: 각 배열 길이
```

Orphan은 연결 정책의 대상 관계가 한 건도 없는 entity다. 파일 부재로
relation 기능이 비활성인 경우 모든 entity를 orphan으로 오인하지 않고
health 상태를 `not-configured`로 표시한다.

