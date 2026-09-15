# 반응형 스윔레인 뷰어와 연결선 개선 설계

- 작성일: 2026-09-01
- 대상: 포트폴리오 작업물 상세의 공통 스윔레인 렌더러
- 상태: 사용자 승인 설계를 문서화한 구현 전 기준

## 1. 배경과 문제

현재 스윔레인 SVG는 lane 수와 고정 lane 폭으로 자연 크기를 계산하고, 본문에서는
가로 스크롤 영역 안에 원본 크기로 렌더링한다. 이 때문에 작업물 상세를 읽다가
가로로 이동해야 하며 전체 흐름을 한눈에 파악하기 어렵다.

연결선은 polyline과 큰 marker를 사용한다. 모서리가 각지게 꺾이고, 라벨은 선 위에
stroke를 덧대는 방식이라 긴 문구가 SVG 경계에서 잘리거나 선과 겹쳐 보일 수 있다.
노드가 연결선 다음 레이어에 렌더링되므로 도착 화살촉 일부가 노드에 가려져 깨져
보일 가능성도 있다.

## 2. 목표

1. 본문 다이어그램의 가로 스크롤을 제거하고 카드 너비 안에서 전체 구조를 먼저
   파악할 수 있게 한다.
2. `크게 보기`를 통해 동일한 다이어그램을 더 넓은 Dialog에서 확인하게 한다.
3. 상·하·좌·우 어느 변에 연결되더라도 곡선과 화살촉이 하나의 접선으로 자연스럽게
   이어지게 한다.
4. 라벨이 선과 겹치거나 SVG 경계에서 잘리지 않도록 별도의 pill로 표현한다.
5. 기존 작업물 데이터의 anchor, waypoint, labelAt 표현력을 보존한다.
6. 마우스·키보드·터치 환경에서 같은 정보를 이용할 수 있게 한다.

## 3. 비목표

- 사용자가 노드를 끌어 이동하는 편집기 기능
- 자유 곡선을 직접 그리는 캔버스
- 확대·축소 비율을 저장하는 상태 관리
- 작업물별로 서로 다른 렌더러를 만드는 것
- 스윔레인 데이터 내용이나 작업물 서술을 변경하는 것

## 4. 사용자 경험

### 4.1 본문 미리보기

- 스윔레인 카드 상단에는 제목·목적과 함께 우측에 `크게 보기` 버튼을 배치한다.
- SVG는 자신의 viewBox를 유지하면서 카드의 가용 너비에 맞춰 축소한다.
- 본문에는 가로 스크롤바를 만들지 않는다.
- 좁은 화면에서 본문 SVG는 전체 구조를 파악하는 미리보기 역할을 한다.
- SVG 다음의 `전체 흐름 설명`과 `예외 상황과 대응`은 현재처럼 텍스트로 제공한다.
- 기존 가로 스크롤 region의 `tabIndex=0`은 제거한다. 키보드 포커스는 실제 동작이
  있는 `크게 보기` 버튼에만 제공한다.

### 4.2 크게 보기

- 버튼을 클릭하거나 키보드로 실행하면 shadcn Dialog를 연다.
- 마우스 hover만으로 Dialog를 열지 않는다. 의도하지 않은 열림을 막고 터치·키보드
  환경과 동일한 조작 방식을 유지하기 위해서다.
- 데스크톱에서는 viewport 대부분을 사용하는 대형 Dialog로 표시한다.
- 모바일에서는 전체 화면에 가까운 Dialog로 표시한다.
- 본문과 Dialog는 같은 `ProjectSwimlaneDiagram`을 사용한다. 별도 SVG나 축약 데이터를
  만들지 않는다.
- Dialog 내부 SVG도 가용 폭과 높이에 맞추며 별도의 가로 스크롤은 만들지 않는다.
- Escape로 닫을 수 있고 닫힌 뒤 포커스는 `크게 보기` 버튼으로 돌아온다.

## 5. 연결선 시각 규칙

### 5.1 Anchor 선택

- 기본 경로는 source와 target 노드의 상대 위치를 기준으로 자연스러운 변을 선택한다.
- 가로 간격이 우세하면 `right → left` 또는 `left → right`를 우선한다.
- 세로 간격이 우세하면 `bottom → top` 또는 `top → bottom`을 우선한다.
- 데이터에 `fromAnchor`·`toAnchor`가 명시된 경우에는 자동 선택보다 우선하는 override로
  사용한다.
- anchor 좌표는 반드시 노드 변 위에서 계산한다. 모서리 좌표를 anchor로 만들지 않는다.

```text
top    = (centerX, y)
right  = (x + width, centerY)
bottom = (centerX, y + height)
left   = (x, centerY)
```

### 5.2 Path와 화살촉

- polyline 대신 하나의 SVG path를 사용한다.
- 직교 구간의 모서리는 quadratic curve로 둥글게 잇는다.
- 화살촉은 별도 삼각형으로 그리지 않고 path의 `markerEnd`로 렌더링한다.
- marker는 마지막 직선 구간의 접선을 따라 `orient=auto`로 회전한다.
- 마지막 직선 구간은 최소 10px을 확보하고 target 변에 수직으로 진입한다.
- 시각값은 다음으로 통일한다.

| 항목 | 값 |
| --- | --- |
| 연결선 굵기 | 2px |
| 화살촉 크기 | 6px |
| 모서리 곡률 | 8px |
| line cap | butt |
| line join | round |
| 정상 흐름 | foreground 실선 |
| 예외 흐름 | destructive 점선 |

- 수신 포트, 굵은 점, halo는 사용하지 않는다.
- 화살촉 아래에 둥근 line-cap이 겹치지 않도록 `butt` 종단을 사용한다.
- marker 크기는 SVG 확대 여부와 무관하게 연결선과 같은 비율로 보이도록 한 좌표계에서
  관리한다.

### 5.3 Layer 순서

레이어는 다음 순서를 유지한다.

1. lane body와 header
2. node shape
3. edge path와 marker
4. node text
5. edge label pill

edge path는 노드 내부를 통과하지 않고 변의 anchor에서 끝나야 한다. 따라서 node shape
위에 edge를 렌더링해도 연결선이 노드 내부를 침범하지 않는다. marker가 노드 뒤에
가려져 잘리는 문제도 방지한다.

### 5.4 라벨

- 기본 위치는 경로에서 라벨을 놓을 수 있는 가장 긴 빈 직선 구간의 중앙이다.
- pill 배경으로 뒤의 연결선을 가리고 텍스트와 선을 시각적으로 분리한다.
- 라벨 문자열의 예상 폭과 좌우 padding을 계산해 pill의 너비를 정한다.
- 계산된 pill이 SVG 경계를 벗어나면 pill 반 너비와 diagram padding을 기준으로 x 좌표를
  보정한다.
- 자동 위치가 노드나 다른 중요 경로와 충돌하는 복잡한 흐름에서는 기존 `labelAt`을
  명시적인 override로 사용한다.

## 6. 컴포넌트 경계

### ProjectSwimlane

- 카드 제목, 목적, 본문 미리보기, 크게 보기 trigger와 Dialog를 조합한다.
- Dialog 상호작용이 필요한 최소 client boundary를 담당한다.
- 전체 흐름 설명과 예외 상황 텍스트를 유지한다.

### ProjectSwimlaneDiagram

- 본문과 Dialog가 공유하는 순수 SVG 렌더러다.
- display mode 또는 className을 받아 컨테이너 크기에 맞게 표현한다.
- `inline`과 `dialog` instance key를 받아 title·description·marker ID에 포함한다. 같은
  스윔레인을 두 번 렌더링해도 DOM ID가 충돌하지 않게 한다.
- lane, node, edge, label의 레이어 순서를 책임진다.

### project-swimlane-layout

- 노드 geometry와 네 방향 anchor를 계산한다.
- 상대 위치 기반 기본 anchor와 명시적 override를 해석한다.
- waypoint를 포함한 직교점 배열을 둥근 SVG path로 변환한다.
- 마지막 직선 길이와 라벨 배치 가능 구간을 계산한다.
- 라벨 pill geometry와 SVG 경계 보정을 계산한다.

### shadcn Dialog

- 기존 `components/ui/dialog.tsx`를 가져다 사용한다.
- 프로젝트 공용 shadcn 원본은 수정하지 않는다.
- 스윔레인 전용 조합 컴포넌트에서 크기와 배치를 구성한다.

## 7. 데이터 흐름과 호환성

1. `FeatureSwimlane` 데이터를 `ProjectSwimlane`이 받는다.
2. 본문과 Dialog가 같은 데이터를 `ProjectSwimlaneDiagram`에 전달한다.
3. layout 함수가 lane·row·node shape에서 geometry를 계산한다.
4. 각 edge의 명시적 anchor가 있으면 이를 사용하고, 없으면 상대 위치로 기본 anchor를
   선택한다.
5. waypoint와 anchor를 path로 변환하고 marker와 label geometry를 함께 반환한다.
6. 기존 스윔레인 내용과 ID는 변경하지 않는다.

DTO의 `fromAnchor`와 `toAnchor`는 optional로 변경한다. 값이 없는 edge는 상대 위치 기반
기본 anchor를 사용하고, 현재 데이터에 이미 있는 값은 모두 명시적 override로 유지한다.
따라서 기존 데이터는 같은 의미로 렌더링되며 신규 흐름만 자동 선택을 사용할 수 있다.

## 8. 실패 처리와 방어 규칙

- source 또는 target 노드가 없으면 기존 상세 validator가 오류를 반환한다.
- anchor나 waypoint가 유효하지 않으면 렌더링 단계에서 임의 좌표를 만들지 않고 validator
  오류로 처리한다.
- 둥근 모서리를 만들 직선 길이가 16px보다 짧으면 해당 모서리 radius를 절반 이하로
  축소한다.
- 마지막 직선 10px을 확보할 수 없는 자동 경로는 다른 target 변을 다시 평가한다.
- 명시적 override에서도 마지막 직선이 부족하면 radius를 줄이되 anchor 자체는 변경하지
  않는다.
- 라벨을 놓을 충분한 구간이 없고 `labelAt`도 없다면 경로 중앙에 배치한 뒤 diagram
  경계만 보정한다. 텍스트를 자르거나 숨기지 않는다.

## 9. 접근성

- 본문과 Dialog의 SVG는 각각 고유한 title·description·marker ID를 사용한다.
- SVG는 `role=img`, 작업물 흐름에 맞는 접근 가능한 이름과 기존 summary 연결을 유지한다.
- `크게 보기` 버튼은 스윔레인 제목을 포함한 접근 가능한 이름을 제공한다.
- Dialog는 보이는 제목과 설명을 가진다.
- 키보드 focus trap, Escape 닫기, trigger focus 복귀는 Dialog primitive에 맡긴다.
- 정적인 node와 edge는 tab stop으로 만들지 않는다.
- 정상·예외 흐름은 색상뿐 아니라 실선·점선으로도 구분한다.

## 10. 검증 전략

### 단위 테스트

- 네 방향 anchor가 각 노드 변 중앙을 반환하는지 검증한다.
- 상대 위치에 따라 가로·세로 anchor 쌍이 선택되는지 검증한다.
- rounded path의 모든 도착 구간이 target 변에 수직인지 검증한다.
- 6px marker, 8px radius, 2px stroke, butt cap 계약을 검증한다.
- 짧은 구간에서 radius가 안전하게 축소되는지 검증한다.
- 라벨 pill이 diagram 경계를 벗어나지 않는지 검증한다.
- explicit anchor·waypoint·labelAt override가 유지되는지 검증한다.

### 컴포넌트 테스트

- 본문에서 `overflow-x-auto`, 스크롤 region과 `tabIndex=0`이 제거되는지 검증한다.
- 크게 보기 버튼과 Dialog의 접근 가능한 이름을 검증한다.
- 본문과 Dialog가 같은 스윔레인 데이터를 렌더링하는지 검증한다.
- SVG marker ID가 동일 페이지의 여러 다이어그램 사이에서 충돌하지 않는지 검증한다.
- 포트·circle·halo가 연결선 종단에 생성되지 않는지 검증한다.

### 브라우저 검증

- 375px 모바일, 태블릿, 데스크톱에서 본문 가로 스크롤이 생기지 않는지 확인한다.
- 크게 보기 열기·Escape 닫기·포커스 복귀를 확인한다.
- 상·하·좌·우 연결선의 곡선과 화살촉 접선이 깨져 보이지 않는지 확인한다.
- 긴 한글 라벨이 잘리거나 노드와 겹치지 않는지 확인한다.
- Blackstone, Hanmaum, Harness, 중앙 회원 서버의 실제 스윔레인을 모두 확인한다.

## 11. 수용 기준

- 작업물 상세 본문에 스윔레인 가로 스크롤이 없다.
- 모든 스윔레인 카드 상단에 크게 보기 버튼이 있다.
- 본문과 Dialog에서 동일한 흐름과 라벨을 표시한다.
- 화살촉과 곡선의 크기가 6px·8px 비례로 일관된다.
- 도착점에 포트나 굵은 점이 없고 화살촉이 변에 수직으로 닿는다.
- 긴 라벨이 SVG 경계에서 잘리지 않는다.
- 기존 네 작업물의 스윔레인 데이터와 텍스트 의미가 바뀌지 않는다.
- 접근성 테스트와 모바일·데스크톱 브라우저 검증을 통과한다.
