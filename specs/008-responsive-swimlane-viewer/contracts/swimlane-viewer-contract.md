# UI Contract: 반응형 스윔레인 뷰어

**Date**: 2026-09-01

## 1. ProjectSwimlane

입력은 기존 `FeatureSwimlane` 하나다. 컴포넌트는 다음 읽기 순서를 제공한다.

1. 제목과 목적
2. `크게 보기` 버튼
3. 본문 다이어그램 미리보기
4. 전체 흐름 설명
5. 예외가 있을 때만 예외 상황과 대응

본문 미리보기 컨테이너는 가로 스크롤 영역이나 키보드 정지점이 아니다.
`overflow-x-auto`, `role=region`, `tabIndex=0` 계약을 제거한다.
본문과 Dialog의 diagram wrapper는 각자 자신의 실제 폭을 측정하며, 유효한 정수 폭이
바뀔 때만 같은 원본 데이터로 layout을 다시 계산한다.

## 2. 크게 보기 Dialog

- 버튼은 click, touch, Enter와 Space로 실행할 수 있다.
- hover만으로 열리지 않는다.
- Dialog title은 `{swimlane.title} 크게 보기`다.
- Dialog description은 기존 purpose를 사용한다.
- 내부에는 본문과 같은 `FeatureSwimlane`을 받은 공통 renderer가 나타난다.
- Escape와 닫기 버튼으로 닫을 수 있다.
- 닫힌 뒤 포커스는 실행한 `크게 보기` 버튼으로 돌아온다.
- Dialog 자체와 내부 다이어그램은 viewport 가용 폭을 넘겨 가로 스크롤을 만들지 않는다.

## 3. ProjectSwimlaneDiagram

필수 입력:

| 입력 | 의미 |
| --- | --- |
| `swimlane` | 본문과 Dialog가 공유하는 원본 데이터 |
| `describedBy` | 보이는 전체 흐름 설명의 ID |
| `instanceKey` | `inline` 또는 `dialog` |
| `layout` | 측정 viewport에서 계산된 lane·node·edge·label geometry |

출력 계약:

- `role=img`를 유지한다.
- inline 접근 이름은 `{title} 전체 흐름 미리보기`다.
- dialog 접근 이름은 `{title} 전체 흐름 크게 보기`다.
- `aria-describedby`는 보이는 전체 흐름 설명과 연결한다.
- 정적인 lane, step과 edge는 개별 tab stop을 만들지 않는다.
- 동일 페이지의 모든 title/description/marker ID는 고유하다.
- inline과 dialog의 lane/step/edge/label 데이터 개수와 문자열은 동일하다.
- SVG의 width와 viewBox는 계산된 layout size를 사용하며 CSS 전체 축소로 10px 미만의
  실제 node 글자를 만들지 않는다.

## 4. 반응형 layout 계약

- lane 수, lane 순서, node 소속과 edge 연결 관계는 viewport와 관계없이 유지한다.
- wrapper 폭이 유효하지 않거나 `ResizeObserver`를 사용할 수 없으면 읽기 가능한 compact
  fallback layout을 사용한다.
- node font size는 실제 10px 이상이다.
- node 문구가 안전 폭보다 길면 공백·구두점 경계를 우선해 줄바꿈하고, 긴 token만 글자
  단위로 나눈다.
- node 높이는 줄 수와 padding에 맞춰 늘어나고 같은 row의 최대 node 높이가 row 간격을
  결정한다.
- decision node 문구는 diamond 내부 안전 영역을 벗어나지 않는다.
- 좁은 화면은 lane 구조를 바꾸거나 가로 스크롤을 추가하지 않고 diagram 높이를 늘린다.

## 5. 연결선 표현

- edge는 `polyline`이 아니라 단일 둥근 직교 `path`로 표현한다.
- stroke width는 2px, 기본 corner radius는 최대 8px, marker 크기는 6px이다.
- line cap은 butt, line join은 round다.
- 마지막 직선은 최소 10px이며 target 변에 수직이다.
- 화살촉은 마지막 path 접선을 따른다.
- source와 target 사이의 실제 진행 행 구간에 걸치는 node만 우회 후보로 사용한다.
- source와 target이 아닌 node 도형·문구를 통과하지 않는다.
- 도착점에 receive port, 굵은 점, circle 또는 halo를 추가하지 않는다.
- normal은 실선, exception은 점선이며 기존 foreground/destructive 의미를 유지한다.

테스트 가능한 속성으로 기존 `data-edge-kind`, `data-swimlane-step`,
`data-swimlane-lane-*`을 유지한다. path와 보기 구분을 검증할 수 있도록 공통 renderer에
안정적인 view/path 식별 속성과 `data-edge-from`·`data-edge-to`를 제공하되 사용자 콘텐츠
식별자로 사용하지 않는다.

## 6. 라벨 표현

- label이 있을 때만 pill과 text를 생성한다.
- pill은 뒤의 선을 가리고 전체 문자열을 표시한다.
- 자동 위치는 quadratic corner를 포함한 rounded path 전체 누적 길이의 50% 지점이다.
- 한 줄 pill을 우선하고 충돌이 없으면 중앙에서 이동하지 않는다.
- 충돌하면 x 중심은 유지하고 `0, -1, +1, -2, +2` 순서로 위·아래 트랙을 평가한다.
- 트랙 간격은 현재 pill 높이 + 8px이며 가장 작은 이동량의 유효 후보를 선택한다.
- 한 줄 후보가 없을 때만 2줄, 다음 3줄을 시도한다.
- 명시 `labelAt`은 먼저 고정하고 자동 label만 이를 피한다.
- explicit → normal automatic → exception automatic → 원본 edge 배열 순서로 결정적으로 배치한다.
- pill은 다른 pill, node와 diagram 경계에 겹치지 않는다.
- normal/exception 라벨은 흐름 의미와 충분한 대비를 유지한다.

## 7. 호환성과 실패 계약

- 기존 명시 anchor·waypoint·labelAt은 같은 의미로 동작한다.
- anchor가 없을 때만 상대 위치 기반 기본 방향을 사용한다.
- 잘못된 node/lane 참조, 허용되지 않는 anchor, 유효하지 않은 좌표와 연결 대상이 아닌
  node 내부의 waypoint는 게시 전 검증에서 오류로 반환한다.
- 작업물의 summary, exception, lane/node/edge/label 문구는 변경하지 않는다.
- 스윔레인이 없는 legacy 작업물에는 버튼, Dialog 또는 빈 다이어그램 영역을 만들지 않는다.
- 명시 `labelAt`이 node나 boundary와 충돌하면 임의 이동하거나 clamp하지 않고 layout
  검증 오류로 반환한다.
- 자동 label이 3줄 후보까지 충돌을 피하지 못하면 생략·잘림·겹침으로 게시하지 않고
  layout 검증 오류로 반환한다.
- 동일 source가 같은 target 행의 세 개 이상 node로 분기하면 cross-lane 경로는 target
  좌→우 순서와 일치하는 서로 다른 수평 통로를 사용하고 same-lane 경로는 직접 연결한다.
- 명시 anchor를 변경한 edge에서 기존 waypoint가 hairpin을 만들면 승인된 의미를 보존하는
  범위에서 waypoint를 제거하고 공통 자동 routing을 사용한다.
- 같은 행의 left/right 출발과 top/bottom 도착 조합은 target 내부를 먼저 가로지르지 않고
  target 바깥쪽에서 지정 변으로 수직 진입한다.
