# Data Model: 연결형 스윔레인 재설계

## 1. FeatureMetric 공개 범위 label

기존 데이터 필드는 유지한다.

| 필드 | 타입 | 규칙 |
| --- | --- | --- |
| `kind` | `measured \| reported \| estimated` | 근거 종류를 결정한다. |
| `caveat` | `string?` | 존재할 때 근거 종류별 공개 범위 label과 함께 표시한다. |

공개 label mapping:

| `kind` | 공개 label |
| --- | --- |
| `estimated` | 산정 범위 |
| `measured` | 측정 범위 |
| `reported` | 관찰 범위 |

`caveat`가 없으면 빈 범위 label과 영역을 만들지 않는다. 기존 estimated caveat 필수 규칙은
유지한다.

## 2. FeatureSwimlane

| 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `id` | `string` | 예 | 한 상세 안에서 고유하다. |
| `title` | `string` | 예 | 공개 제목과 접근 가능한 이름의 기준이다. |
| `purpose` | `string` | 예 | 다이어그램이 증명하는 내용을 설명한다. |
| `lanes` | `FeatureSwimlaneLane[]` | 예 | 책임 주체의 좌→우 순서를 정한다. |
| `steps` | `FeatureSwimlaneStep[]` | 예 | node 위치, 의미와 공개 문구다. |
| `edges` | `FeatureSwimlaneEdge[]` | 예 | node 사이의 방향성 연결이다. |
| `summary` | `string` | 예 | 시각 흐름과 같은 정상 순서를 일반 문장으로 설명한다. |
| `exceptions` | `FeatureSwimlaneException[]` | 예 | 예외가 없으면 빈 배열이며 UI 영역을 생략한다. |

## 3. FeatureSwimlaneLane

| 필드 | 타입 | 규칙 |
| --- | --- | --- |
| `id` | `string` | 스윔레인 안에서 고유한 stable key다. |
| `label` | `string` | 공개 책임 주체명이다. |

배열 순서가 가로 column을 결정한다.

## 4. FeatureSwimlaneStep

| 필드 | 타입 | 규칙 |
| --- | --- | --- |
| `id` | `string` | 스윔레인 안에서 고유하다. |
| `laneId` | `string` | 존재하는 lane을 참조한다. |
| `row` | `number` | 0 이상의 유한한 정수이며 세로 진행 위치다. |
| `shape` | `start \| process \| decision \| end \| stop` | node의 의미와 도형을 결정한다. |
| `label` | `string` | 핵심 단계 또는 보조 상태명이다. |
| `description` | `string` | 단계의 판단·행동·결과를 설명한다. |

한 lane의 같은 row에는 step을 하나만 배치할 수 있다. 각 스윔레인에는 `start`와 `end`가
정확히 하나씩 있어야 한다. `stop`은 정상 여섯 단계에 포함되지 않는 보조 상태로 사용할
수 있다. 설계 흐름의 핵심 단계 `리뷰·검증`은 성공과 실패를 판정하는 `decision`이며,
정상 `통과` edge 뒤의 `완료`는 핵심 여섯 단계에 포함되지 않는 보조 `end`다.

## 5. FeatureSwimlanePoint

| 필드 | 타입 | 규칙 |
| --- | --- | --- |
| `column` | `number` | 유한한 grid column이다. `-0.5` 이상, 마지막 lane 바깥 경계 이하의 소수를 허용한다. |
| `row` | `number` | 0 이상 최대 step row 이하의 유한한 grid row다. |

point는 edge의 선택 waypoint와 label 위치에만 사용한다. 실제 픽셀 좌표는 데이터에
저장하지 않는다.

## 6. FeatureSwimlaneEdge

| 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `id` | `string` | 예 | 스윔레인 안에서 고유하다. |
| `from` | `string` | 예 | 존재하는 서로 다른 시작 step이다. |
| `to` | `string` | 예 | 존재하는 서로 다른 도착 step이다. |
| `kind` | `normal \| exception` | 예 | 정상 진행과 중단·되돌림을 구분한다. |
| `outcome` | `continue \| recover \| stop` | 예 | 연결 이후 결과다. |
| `fromAnchor` | `top \| right \| bottom \| left` | 예 | 시작 node의 연결 면이다. |
| `toAnchor` | `top \| right \| bottom \| left` | 예 | 도착 node의 연결 면이다. |
| `label` | `string?` | 아니오 | 시각선에 필요한 짧은 조건이다. |
| `labelAt` | `FeatureSwimlanePoint?` | 아니오 | label의 grid 위치다. |
| `waypoints` | `FeatureSwimlanePoint[]?` | 아니오 | node를 피하는 순서형 경유점이다. |

`normal`은 `continue`만 허용한다. `exception`은 `recover` 또는 `stop`만 허용한다. edge는
시작 anchor → waypoint 순서 → 도착 anchor의 polyline으로 표시한다.

## 7. FeatureSwimlaneException

| 필드 | 타입 | 규칙 |
| --- | --- | --- |
| `id` | `string` | 스윔레인 안에서 고유하다. |
| `trigger` | `string` | 방문자가 이해할 발생 조건이다. |
| `response` | `string` | 중단 범위, 복귀 대상과 다음 행동을 설명하는 완성된 문장이다. |
| `edgeIds` | `string[]` | 하나 이상의 `exception` edge만 참조한다. |

동일한 재실행 edge를 여러 exception이 공유할 수 있다. UI는 edge의 내부 outcome 대신
`trigger`와 `response`만 공개한다.

## 8. Cross-field Validation

1. swimlane, lane, step, edge와 exception ID는 각각의 범위에서 고유해야 한다.
2. 모든 필수 문자열은 trim 후 비어 있지 않아야 한다.
3. 모든 step은 존재하는 lane을 참조하고 `[laneId, row]` 위치가 중복되지 않아야 한다.
4. `row`, waypoint와 label point 좌표는 모두 유한해야 한다.
5. start와 end step은 정확히 하나씩 존재해야 한다.
6. 모든 edge는 존재하는 서로 다른 step을 연결해야 한다.
7. start에서 end까지 `normal` edge만으로 도달 가능해야 한다.
8. `stop`을 제외한 모든 step은 start에서 normal edge로 도달 가능하고 normal edge로
   end에 도달할 수 있어야 한다.
9. normal edge의 도착 step row는 시작 step row보다 커야 한다.
10. normal/exception의 허용 outcome 조합을 위반하면 안 된다.
11. exception은 존재하는 exception edge를 하나 이상 참조해야 한다.
12. 모든 exception edge는 최소 한 개의 exception 설명에 포함돼야 한다.
13. exception의 trigger 또는 response가 비어 있으면 게시할 수 없다.
14. `stop` outcome의 도착 step은 `stop` shape여야 하고 normal edge는 `stop`으로 갈 수 없다.
15. 모든 exception edge는 비어 있지 않은 조건 label을 가져야 한다.

## 9. Approved Flow Instances

### 설계·개발·검증

- lanes: 사용자, AI 에이전트, 계획·구현, 리뷰·검증
- main steps: 요청·맥락 전달 → 문제 정의 → 명세·계획 → 승인 → 테스트·구현 → 리뷰·검증
- auxiliary step: 완료
- exceptions: 모호성, 계획 미승인, 검증 실패

### CI/CD·시크릿·배포

- lanes: GitHub 저장소, GitHub Actions, Infisical, 배포 대상
- main steps: 변경 감지 → 품질 검사 → 환경·대상 결정 → 시크릿 조회 → 병렬 배포 → 결과 확인
- auxiliary step: 배포 중단
- exceptions: 품질 검사 실패, 환경·시크릿 불일치, 원인 수정 후 전체 재실행

## State Transitions

```text
validated start
  → normal process / decision
  → validated end

process / decision
  → exception stop or recover
  → visitor-facing response
  → declared return or restart target
```

잘못된 데이터는 자동 보정하지 않고 레지스트리 초기화 전에 오류 목록으로 반환한다.
