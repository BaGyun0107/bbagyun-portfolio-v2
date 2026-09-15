# Phase 1 Data Model: 반응형 스윔레인 뷰어

**Date**: 2026-09-01

기존 `FeatureSwimlane` 콘텐츠 구조와 1차 구현에서 완화한 선택 edge anchor 계약을
그대로 보존한다. 이번 후속 범위는 실제 컨테이너 폭에서 계산하는 파생 layout 모델이며
포트폴리오 데이터에 저장하지 않는다.

## 1. 공개 입력 계약

### FeatureSwimlaneEdge

| 필드 | 타입 | 처리 |
| --- | --- | --- |
| `id` | `string` | 유지, 스윔레인 안에서 고유 |
| `from`, `to` | `string` | 유지, 존재하는 step 참조 |
| `kind` | `normal \| exception` | 유지 |
| `outcome` | `continue \| recover \| stop` | 유지 |
| `fromAnchor` | `FeatureSwimlaneAnchor?` | 선택 필드로 완화. 존재하면 자동 선택보다 우선 |
| `toAnchor` | `FeatureSwimlaneAnchor?` | 선택 필드로 완화. 존재하면 자동 선택보다 우선 |
| `label` | `string?` | 유지. decision/exception 제약 유지 |
| `labelAt` | `FeatureSwimlanePoint?` | 유지. 자동 라벨 위치보다 우선 |
| `waypoints` | `FeatureSwimlanePoint[]?` | 유지. 자동 직교 경로의 경유 입력 |

`FeatureSwimlaneAnchor`는 계속 `top | right | bottom | left` 네 값만 허용한다.
기존 네 작업물의 명시 anchor는 수정하지 않으며 동일한 override로 동작해야 한다.

## 2. Layout viewport와 text 모델

### SwimlaneLayoutViewport

| 필드 | 타입 | 검증 |
| --- | --- | --- |
| `width` | `number` | 유한하고 0보다 큰 정수 px. 아니면 마지막 정상값 또는 compact fallback 사용 |
| `minimumFontSize` | `number` | 실제 표시 기준 10px 이상 |

inline과 Dialog가 독립 viewport를 만들지만 같은 layout 함수에 전달한다. viewport는
공개 DTO나 URL 상태가 아니며 측정 wrapper의 런타임 입력이다.

### TextLayout

| 필드 | 의미 |
| --- | --- |
| `text` | 생략하지 않은 원본 문자열 |
| `lines` | 공백·구두점 우선, 필요할 때만 글자 단위로 나눈 줄 |
| `fontSize` | 10px 이상의 실제 SVG 글자 크기 |
| `lineHeight` | 줄 중심 사이의 거리 |
| `width`, `height` | 모든 줄과 padding을 포함한 계산 영역 |

CJK·Latin·space 폭 추정 규칙을 node와 edge label이 공유한다. 모든 줄을 합치면 공백을
포함한 원본 문자열과 같아야 한다.

## 3. 파생 geometry 모델

### NodeGeometry

노드 중심점 `x`, `y`, `width`, `height`, shape별 안전 영역과 `TextLayout`을 가진다.
lane 수와 소속 lane은 그대로 유지하되 viewport 폭으로 lane·node 폭을 계산한다. node
높이는 줄 수, line height와 상하 padding으로 결정하고 같은 row의 최대 높이가 다음 row
중심과 diagram 높이에 반영된다. decision은 diamond 내부 안전 폭을 사용한다.

### ResolvedAnchors

| 필드 | 의미 |
| --- | --- |
| `fromAnchor` | 명시값 또는 상대 위치로 선택한 출발 변 |
| `toAnchor` | 명시값 또는 상대 위치로 선택한 도착 변 |
| `fromPoint` | 출발 노드 변 중앙 좌표 |
| `toPoint` | 도착 노드 변 중앙 좌표 |

자동 선택 규칙:

1. `abs(target.x - source.x) >= abs(target.y - source.y)`이면 가로축을 우선한다.
2. target이 오른쪽이면 `right → left`, 왼쪽이면 `left → right`를 선택한다.
3. 세로축이 우세하고 target이 아래면 `bottom → top`, 위면 `top → bottom`을 선택한다.
4. 한쪽 anchor만 명시된 경우 그 값은 고정하고 반대쪽만 상대 위치에 맞춰 선택한다.

### RoutedEdgeGeometry

| 필드 | 의미 |
| --- | --- |
| `points` | 직교·중복 제거가 끝난 경로 기준점 |
| `path` | 모서리가 둥글게 변환된 단일 path 문자열 |
| `pathSegments` | 직선과 quadratic corner의 길이·위치 계산용 구간 |
| `fromAnchor`, `toAnchor` | 최종 선택 방향 |
| `label` | label이 있을 때만 생성되는 `LabelGeometry` |

경로 불변 조건:

- 모든 인접 기준점은 x 또는 y 중 하나를 공유한다.
- 중복점과 같은 방향의 불필요한 중간점은 제거한다.
- 각 모서리 반경은 `min(8, 이전 구간 길이 / 2, 다음 구간 길이 / 2)` 이하다.
- 마지막 직선은 최소 10px이며 target 변에 수직이다.
- path 끝과 marker 방향은 동일한 접선을 공유한다.
- source와 target이 아닌 node의 도형·문구 안전 영역과 교차하지 않는다.
- 상·하 진행 경로는 source exit와 target approach 사이의 세로 구간 밖으로 역주행하지 않는다.

### LabelGeometry

| 필드 | 의미 |
| --- | --- |
| `x`, `y` | pill 중심 좌표 |
| `width`, `height` | 전체 문자열과 padding을 포함한 배경 크기 |
| `text` | 생략되지 않은 원본 label |
| `lines` | 한 줄 우선, 필요할 때만 2줄 또는 3줄 |
| `basePoint` | rounded path 전체 누적 길이 50% 지점 또는 명시 `labelAt` |
| `track` | 자동 label의 세로 이동 배수. 명시 label은 0 고정 |
| `placement` | `explicit | automatic` |

자동 위치는 실제 rounded path 전체 누적 길이의 50% 지점이다. 한 줄 rectangle을
`0, -1, +1, -2, +2` 트랙 순서로 평가하고, 트랙 간격은 현재 label 높이 + 8px이다.
한 줄 후보가 없으면 같은 순서로 2줄, 다음 3줄을 평가한다. node rectangle, 먼저 확정된
label rectangle 또는 diagram boundary와 면적이 겹치면 후보에서 제외한다.

명시적 `labelAt`은 해당 grid 좌표에 먼저 고정한다. 자동 label은 이를 장애물로 피하지만
명시 위치를 clamp하거나 이동하지 않는다. 명시 label이 node 또는 boundary와 충돌하거나
3줄 자동 후보까지 실패하면 `SwimlaneLayoutError`를 반환한다.

### SwimlaneLayout

| 필드 | 의미 |
| --- | --- |
| `viewport` | 정규화된 측정 폭과 최소 글자 크기 |
| `size` | viewport 폭과 동적 row 높이를 반영한 SVG width·height |
| `lanes` | 기존 순서가 유지된 lane rectangle과 header geometry |
| `nodes` | 원본 step ID·관계와 동적 shape/text geometry |
| `edges` | 원본 edge ID·관계와 routed path/label geometry |

layout은 같은 `FeatureSwimlane`과 viewport 입력에 항상 같은 결과를 반환한다. lane, node,
edge 개수·ID·소속·연결 대상과 공개 문자열은 입력과 동일해야 한다.

동일 source·동일 target row의 상·하 분기가 세 개 이상이면 layout은 target x 좌표와 edge
ID로 sibling 순서를 결정한다. cross-lane edge는 공통 진행 구간에서 `(순번 + 1) / (전체 + 1)`
비율의 수평 통로를 우선 사용하며, source와 target의 x가 같은 edge는 채널 순번만 예약하고
수직 직선을 유지한다. 이 값은 입력 DTO에 저장하지 않는 결정적 파생 geometry다.

## 4. 보기 인스턴스

`ProjectSwimlaneDiagram`은 같은 `FeatureSwimlane`과 다음 보기 문맥을 받는다.

| 값 | 접근 가능한 이름 | 용도 |
| --- | --- | --- |
| `inline` | `{title} 전체 흐름 미리보기` | 본문 카드의 반응형 보기 |
| `dialog` | `{title} 전체 흐름 크게 보기` | 열린 Dialog의 대형 표시 |

보기 문맥은 title, description, normal marker, exception marker 식별자에 포함된다.
동일 페이지에 스윔레인 6개와 각 Dialog 인스턴스가 존재해도 식별자가 중복되면 안 된다.

각 보기의 wrapper는 `ResizeObserver`로 자신의 폭을 측정한다. 최초 SSR/hydration과
observer 부재 시 compact fallback을 사용하고, 동일 정수 폭은 다시 반영하지 않는다.

## 5. Dialog 상태

```text
closed
  └─ click / touch / Enter / Space ─> open
open
  ├─ Escape / 닫기 버튼 / 바깥 영역 ─> closed + trigger focus 복귀
  └─ hover ─> 상태 변화 없음
```

상태는 `ProjectSwimlane` 인스턴스별로 독립적이다. 한 Dialog의 열림이 다른 스윔레인의
데이터나 상태를 바꾸지 않는다.

## 6. 런타임 검증 규칙

기존 `validateFeatureDetail` 규칙을 모두 유지한다.

- lane/step/edge/exception ID 유일성
- 존재하는 lane과 step만 참조
- row와 point가 유한하고 허용 범위 안에 존재
- waypoint가 연결 대상이 아닌 step의 node 영역과 충돌하지 않음
- normal/exception kind와 outcome 조합
- decision·exception label 필수 조건
- start에서 end까지의 normal path 도달성
- exception 설명과 edge 참조 일치

anchor 변경 규칙:

- `fromAnchor` 또는 `toAnchor`가 없으면 유효하며 자동 선택 대상으로 본다.
- 값이 있으면 네 방향 중 하나여야 한다.
- 빈 문자열이나 임의 문자열은 계속 오류다.

renderer 방어 규칙:

- 존재하지 않는 step/lane 참조는 임의 좌표로 그리지 않고 오류로 처리한다.
- label이 없으면 빈 pill을 만들지 않는다.
- 경로 계산 결과가 유한하지 않거나 마지막 직선 조건을 만족하지 못하면 게시 가능한
  다이어그램으로 취급하지 않는다.
- node 크기·격자·충돌 여백은 validator와 renderer가 공유하는 기하 계약을 사용한다.
- 실제 node font size가 10px 미만이면 layout 오류다.
- node text rectangle이 shape 안전 영역을 벗어나면 layout 오류다.
- label rectangle끼리, label과 node 또는 label과 boundary가 겹치면 layout 오류다.
- edge path가 source와 target이 아닌 node 도형을 통과하면 layout 오류다.
- 같은 source·같은 target 행의 세 개 이상 분기는 target 좌→우 순서로 별도 수평 통로를 사용한다.
- 같은 lane의 sibling 분기는 인위적인 waypoint 없이 수직 직선을 유지한다.
- 같은 행의 가로 출발·세로 도착 경로는 target 바깥 통로를 지난 뒤 마지막 도착 직선만
  target 영역에 진입한다.
- explicit label은 충돌 시 자동 이동하지 않으며 오류 위치와 edge ID를 반환한다.

## 7. 데이터 보존 계약

다음 구조화 작업물의 공개 lane·step·edge·label·summary·exception 의미를 수정하지 않는다.
Harness의 승인된 두 도착 anchor 교환과 불필요한 waypoint 제거는 geometry override 정정으로
관리하며 공개 문자열과 연결 대상은 그대로 유지한다.

| 작업물 | 스윔레인 수 |
| --- | ---: |
| `codi-harness-dx-platform` | 2 |
| `hanmaum-science-institute` | 2 |
| `blackstone-belleforet-resort` | 1 |
| `integrated-sso-server` | 1 |

총 6개 스윔레인의 lane, step, edge, label, summary, exception 개수와 문자열을 구현 전후
동일하게 유지한다. 변경되는 것은 승인된 anchor override와 표시 geometry뿐이다.
