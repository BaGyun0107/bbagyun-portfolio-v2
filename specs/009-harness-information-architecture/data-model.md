# Data Model: 하네스 정보구조·기능 추적성·사용자 흐름 정본화

## 공통 원칙

- 모든 ID는 파일과 view를 가로질러 안정적으로 재사용한다.
- 사람 소유 원본은 `data/`에 있고 builder는 읽기만 한다.
- 스키마와 scanner는 007/008 계약을 재사용한다.
- explicit relation은 evidence를 가진다. 추론은 label에도 검토 상태를 쓴다.
- 전체 원본 오류는 원본 단위, 개별 오류는 item/edge 단위 fail-open이다.

## Sitemap

### Surface

| Field | Type | Rule |
| --- | --- | --- |
| `key` | enum | `user`, `admin`, `common`; 한 번씩 순서대로 선언 |
| `title` | string | 사람에게 보이는 surface 이름 |
| `nodes` | Node[] | 실제 화면·콘텐츠 계층만 포함; 빈 배열 허용 |

### Node

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | `HUB-*`; 전체 sitemap에서 유일 |
| `title` | string | 화면 또는 UI 상태 이름 |
| `description` | string? | 필요할 때 역할을 설명 |
| `children` | Node[]? | containment 계층; cycle 금지 |

최종 cardinality는 surface 3개, node 17개다. `admin.nodes`는 현재 0개다.

## Traceability

### Supplemental entity

이번 원본은 9개 `need` entity를 보충한다. feature, screen, spec과 verification
entity는 기존 spec/sitemap/verification scan 결과에서 파생한다.

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | `NEED-*`; 유일 |
| `type` | enum | 이번 원본에서는 `need` |
| `title` | string | 기능이 해결하는 사용자·팀 필요 |

### Link

| Field | Type | Rule |
| --- | --- | --- |
| `from` / `to` | endpoint | `{type, id}`; 유효 entity를 참조 |
| `type` | enum | `satisfied-by`, `appears-on`, `specified-by`, `depends-on`, `verified-by` |
| `label` | string? | inferred면 `inferred — PM/PL review` 포함 |
| `evidence` | string | 로컬 경로와 section/결정 ID |

최종 link 수는 64개다: `satisfied-by` 9, `appears-on` 33,
`specified-by` 9, `depends-on` 10, `verified-by` 3. 한 기능의 첫 유효
`appears-on`이 primary screen이며 나머지는 보조 화면이다.

### Required coverage

각 feature 001~009는 정확히 하나의 need에서 `satisfied-by`되고, 최소 하나의
screen에 `appears-on`, 동일 ID spec에 `specified-by`된다. `depends-on`은
각 `status.yaml`의 `depends_on`과 동일해야 한다. `verified-by`는 실제
`verification.md`가 있는 007~009만 선언한다.

## User flow

### Flow

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | `FLOW-*`; 유일 |
| `title` | string | 목표 흐름 이름 |
| `actor` | string | 주 행동자 |
| `goal` | string | 관찰 가능한 완료 목표 |
| `startStepId` | string | 같은 flow의 유효 step |
| `steps` | Step[] | 유일 ID, 도달 가능, cycle 금지 |

### Step

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | flow 안에서 유일 |
| `title` | string | 사람이 이해하는 행동 또는 상태 |
| `kind` | enum | 기존 user-flow schema가 허용하는 start/action/decision/end 계열 |
| `screenIds` | string[]? | sitemap의 stable node ID |
| `featureIds` | string[]? | 001~009 feature ID |
| `next` | edge[]? | 대상 step과 선택적 조건 |

정본 flow는 `FLOW-ONBOARD`, `FLOW-FEATURE-DELIVERY`,
`FLOW-HARNESS-DELIVERY` 세 개다. 실패·재시도는 recovery end에서 종료하고
새 flow invocation을 안내하므로 graph cycle을 만들지 않는다.

## State and validation

- 원본 부재 또는 최상위 파싱 실패: `not-configured`/invalid warning과 빈 유효 집합.
- 개별 중복·broken endpoint/next: 해당 item 또는 edge 제외, warning 누적.
- 최종 정본 성공 조건: unassigned, broken, duplicate와 entity type별 orphan 0.
- 생성된 `docs/index.html`은 projection이며 정본이 아니다.
