# Phase 0 Research: 반응형 스윔레인 뷰어

**Date**: 2026-09-01

Technical Context의 미확정 항목은 없다. 사용자 승인 설계, 현재 공통 renderer,
DTO 검증기, Vitest/Playwright 구성과 기존 네 작업물 데이터를 확인해 아래 결정을
확정했다. D-002와 D-005는 1차 구현 뒤 실제 화면 측정에서 한계가 확인되어 아래 내용으로
대체했으며, 나머지 결정은 계속 유효하다.

## D-001. 본문과 Dialog는 하나의 renderer와 데이터를 공유한다

**Decision**: `ProjectSwimlane`이 `크게 보기` 버튼과 Dialog를 조합하고,
본문·Dialog 모두 같은 `FeatureSwimlane` 객체를 `ProjectSwimlaneDiagram`에 전달한다.
Dialog 때문에 필요한 client boundary는 이 조합 컴포넌트에만 둔다.

**Rationale**: 별도 축약 데이터나 확대 전용 SVG를 만들면 lane/node/edge/label이
서로 달라질 수 있다. 동일 renderer를 두 위치에 재사용하면 내용 보존을 구조적으로
보장할 수 있다.

**Alternatives considered**:
- 본문 이미지를 확대: 기각. 텍스트와 벡터 선명도, 접근 가능한 이름을 유지하기 어렵다.
- hover 확대: 기각. 터치·키보드에서 동등하게 사용할 수 없고 의도하지 않은 열림이 생긴다.

## D-002. 실제 컨테이너 폭으로 layout geometry를 다시 계산한다

**Decision**: 고정 940px viewBox 전체를 축소하지 않는다. inline과 Dialog wrapper가
각자 실제 폭을 측정해 `SwimlaneLayoutViewport`로 전달하고, layout 함수가 lane 폭,
node 크기·줄바꿈·row 높이·edge path와 label geometry를 함께 계산한다. 기존
`overflow-x-auto`, scroll region과 `tabIndex=0` 제거 상태는 유지한다.

**Rationale**: 4-lane 본문에서 12px 글자가 실제 3.2~9.8px로 축소되는 것을 측정했다.
구조를 유지하면서 읽을 수 있게 하려면 SVG 표시 배율이 아니라 내부 geometry 자체가
가용 폭에 맞아야 한다.

**Alternatives considered**:
- 고정 viewBox fit과 Dialog 보완: 기각. 본문 자체의 node와 분기 label을 읽을 수 없다.
- 기존 내부 스크롤 복원: 기각. 승인된 no-scroll 읽기 흐름을 깨뜨린다.
- lane을 세로 timeline으로 전환: 기각. 기존 lane과 edge 관계를 보존하지 못한다.

## D-003. anchor는 선택 입력이며 상대 위치를 기본값으로 사용한다

**Decision**: `fromAnchor`와 `toAnchor`를 선택 필드로 완화한다. 값이 있으면 현재처럼
override로 사용하고, 없으면 source/target 중심점의 가로·세로 차이 중 우세한 축을
기준으로 가까운 좌우 또는 상하 변을 선택한다. anchor 좌표는 항상 변 중앙이며
모서리를 사용하지 않는다.

**Rationale**: 기존 데이터 표현력을 잃지 않으면서 새 edge가 매번 방향을 수동 지정할
필요를 없앤다. 상대 위치 선택은 예측 가능하고 독립 테스트가 가능하다.

**Alternatives considered**:
- 모든 기존 anchor 제거: 기각. 의도적으로 우회하는 예외 경로가 달라질 수 있다.
- 모든 edge에 anchor 계속 강제: 기각. 자동 배치라는 승인 요구를 충족하지 못한다.

## D-004. 연결선은 둥근 직교 단일 path로 계산한다

**Decision**: anchor와 waypoint 사이를 직교 점 배열로 정규화하고, 연속·중복·공선
점을 정리한 뒤 각 모서리를 최대 8px의 quadratic curve로 잇는다. 짧은 구간에서는
반경을 인접 구간의 절반 이하로 줄인다. target 앞에는 target 변과 수직인 10px 이상의
직선 구간을 확보한다. 2px butt-cap path 하나에 6px marker를 연결한다.

**Rationale**: 선과 화살촉을 한 경로의 접선으로 묶으면 상·하·좌·우 어느 도착에서도
화살촉 방향이 깨지지 않는다. 짧은 구간에서 반경을 줄여 curve와 marker 겹침을 막는다.

**Alternatives considered**:
- 별도 삼각형 화살촉: 기각. path 접선과 회전을 따로 맞춰야 해 방향별 깨짐이 재발한다.
- 자유 곡선 자동 routing: 기각. 현재 정적 데이터에 비해 복잡하고 결과가 예측하기 어렵다.

## D-005. label은 전체 rounded path 중앙을 기준으로 충돌을 해소한다

**Decision**: 최대 8px quadratic corner를 포함한 실제 rounded path의 누적 길이를 계산해
50% 지점을 자동 label의 기본 중심으로 삼는다. 한 줄 pill을 먼저 시도하고 다른 label,
node 또는 boundary와 충돌할 때만 `0, -1, +1, -2, +2` 순서의 세로 트랙을 평가한다.
한 줄 후보가 모두 실패하면 2줄, 다음 3줄을 시도하며 그래도 실패하면 layout 오류다.
명시 `labelAt`은 먼저 고정하고 자동 label만 이를 피한다.

**Rationale**: Blackstone 네 label의 기존 위치에서 세 쌍의 충돌을 확인했다. 각 path
중앙은 서로 달랐지만 같은 가로 통로에 모였으므로 의미상 중앙을 기준으로 유지하면서
충돌한 label만 최소 이동해야 한다.

**Alternatives considered**:
- 가장 긴 직선 구간 중앙: 기각. 서로 다른 edge가 같은 통로를 공유할 때 label이 겹친다.
- 모든 label을 기본 여러 줄로 표시: 기각. 읽기 흐름과 승인된 한 줄 우선 원칙에 맞지 않는다.
- `labelAt`까지 자동 이동: 기각. 명시 override의 의미를 훼손한다.

## D-006. 레이어와 인스턴스 식별자를 분리한다

**Decision**: lane → node shape → edge path/marker → node text → label pill 순서로
렌더링한다. 본문과 Dialog는 `inline`/`dialog` instance key를 title·description·marker
식별자에 포함하고 접근 가능한 이름도 `미리보기`/`크게 보기`로 구분한다.

**Rationale**: edge가 node 뒤에서 잘리는 문제를 막으면서 텍스트 가독성을 유지한다.
같은 데이터가 동시에 두 번 존재해도 marker와 접근성 관계가 충돌하지 않는다.

**Alternatives considered**:
- edge를 항상 node 아래에 유지: 기각. marker가 node에 가려질 수 있다.
- swimlane ID만 사용: 기각. Dialog가 열리면 동일 DOM ID가 중복된다.

## D-007. DTO 검증은 선택 anchor를 허용하되 잘못된 값은 차단한다

**Decision**: validator는 anchor가 `undefined`이면 자동 선택 대상으로 허용하고,
값이 존재할 때만 네 방향 집합을 검사한다. 현재 edge 참조, waypoint, labelAt,
normal/exception과 도달성 검증은 그대로 유지한다. 경로 계산이 회피할 수 없는 명시
waypoint가 연결 대상이 아닌 node 내부에 있으면 게시 전 검증에서 차단하며, validator와
renderer는 같은 node 크기·격자·충돌 여백 계약을 사용한다.

**Rationale**: 타입만 완화하고 런타임 검증기를 그대로 두면 유효한 신규 데이터가
게시 전에 거부된다. 반대로 임의 문자열까지 허용하면 잘못된 geometry가 생성된다.

**Alternatives considered**:
- validator에서 anchor 검사 삭제: 기각. 명시 입력 오류를 차단할 수 없다.
- 자동 anchor를 데이터 전처리로 저장: 기각. 파생값이 원본 콘텐츠에 섞인다.

## D-008. TDD와 실제 네 작업물 production E2E를 함께 사용한다

**Decision**: 순수 geometry 테스트에서 네 방향, 직교성, 10px 진입, 8px 이하 곡률,
6px marker 계약과 label clamp를 먼저 RED로 만든다. 렌더링 테스트는 스크롤 region 제거,
두 인스턴스, 고유 식별자, layer 순서와 기존 content 보존을 확인한다. Playwright는
320/375/768/1024/1440px, Dialog open/Escape/focus, 네 작업물 6개 스윔레인을 검증한다.

E2E는 `pnpm run build` 뒤 포트 1104가 아닌 별도 포트의 production server를 사용한다.
임시 Playwright config와 임시 결과는 실행 후 삭제하고 1104 process는 건드리지 않는다.

**Rationale**: geometry는 DOM snapshot만으로 방향 정확성을 보장하기 어렵고,
Dialog 포커스와 실제 overflow는 브라우저 검증이 필요하다. 두 계층을 나눠야 실패 원인을
빠르게 좁힐 수 있다.

**Alternatives considered**:
- 현재 1104 dev server 재사용: 기각. stale 상태와 `.next/dev` lock 때문에 변경 반영을 보장하지 못한다.
- E2E 생략: 기각. 사용자-facing 흐름이며 헌법과 품질 게이트에 위배된다.

## D-009. 공개 콘텐츠와 의존성은 변경하지 않는다

**Decision**: Blackstone, Hanmaum, Harness, 중앙 회원 서버의 lane/node/edge/label,
summary와 exception 문구를 변경하지 않는다. 기존 Dialog primitive를 재사용하고 패키지를
추가하지 않는다.

**Rationale**: 이번 기능은 표현 품질 개선이며 콘텐츠 인터뷰 결과를 다시 해석하는 작업이
아니다. 범위를 공통 UI로 제한해야 기존 사실 계약을 보호할 수 있다.

**Alternatives considered**:
- 새 다이어그램 라이브러리 도입: 기각. 현재 정적 규모에 비해 의존성과 스타일 통합 비용이 크다.
- 작업물별 좌표 재작성: 기각. 콘텐츠 변경과 renderer 변경이 섞여 회귀 원인을 구분하기 어렵다.

## D-010. 컨테이너 측정은 작은 client wrapper에 격리한다

**Decision**: `ResponsiveSwimlaneDiagram`이 wrapper와 `ResizeObserver`를 소유한다.
observer callback에서 유한하고 0보다 큰 정수 폭만 반영하고 동일 폭은 무시한다. SSR과
observer 부재 시에는 최소 글자 크기를 만족하는 compact fallback 폭을 사용한다.

**Rationale**: `ProjectSwimlane`은 이미 client boundary이며 inline과 Dialog의 가용 폭이
다르다. 측정과 순수 layout을 분리하면 hydration 초기 상태와 geometry 테스트를 각각
결정적으로 검증할 수 있다.

**Alternatives considered**:
- window 폭 사용: 기각. 카드와 Dialog의 실제 내부 폭을 반영하지 못한다.
- SVG 내부에서 직접 DOM 측정: 기각. renderer가 계산과 표현을 함께 책임하게 된다.

## D-011. node와 label은 같은 text 측정 규칙을 공유한다

**Decision**: CJK·Latin·space 예상 폭, 공백·구두점 우선 분할과 긴 token의 글자 단위
fallback을 공통 text layout 함수로 만든다. node는 shape별 안전 폭으로 줄바꿈하고
line count·line height·padding으로 높이를 계산한다. 같은 row의 최대 node 높이와 여백이
다음 row 중심을 결정한다.

**Rationale**: 실제 Canvas 측정에 의존하지 않는 순수 계산이어야 SSR, Vitest와 브라우저가
같은 geometry를 사용한다. decision diamond는 외접 사각형보다 내부 안전 폭이 작으므로
shape별 안전 영역이 필요하다.

**Alternatives considered**:
- CSS 자동 줄바꿈만 사용: 기각. SVG text와 node shape 높이 및 edge routing을 함께 계산할 수 없다.
- 글자 크기 축소: 기각. 실제 표시 크기 10px 이상이라는 승인 기준을 위반한다.

## D-012. label 배치는 고정된 우선순위로 결정한다

**Decision**: 명시 `labelAt` → normal 자동 label → exception 자동 label 순으로 배치하고,
같은 그룹은 원본 edge 배열 순서를 유지한다. 먼저 확정된 rectangle을 다음 label의
장애물로 사용한다. explicit label이 node나 boundary와 충돌하면 이동하지 않고 실패한다.

**Rationale**: 같은 데이터와 viewport가 항상 같은 결과를 내야 snapshot과 E2E가 안정적이고,
명시 override와 normal/exception 의미 순서를 예측할 수 있다.

**Alternatives considered**:
- edge 배열 전체를 그대로 순회: 기각. explicit override가 뒤에서 자동 label과 충돌할 수 있다.
- 무작위 또는 비용 최적화 탐색: 기각. 작은 정적 데이터에 비해 복잡하고 결과 재현성이 낮다.

## D-013. 직교 경로는 실제 진행 행 구간 안에서 가장 가까운 빈 통로를 선택한다

**Decision**: 상·하 anchor를 잇는 경로의 장애물 후보는 가로 통과 범위와 함께 source
exit부터 target approach까지의 세로 구간에 실제로 걸치는 node로 제한한다. 후보 node의
위·아래 통로 중 진행 구간 안에 있는 경로를 비교하고, 길이와 교차 비용이 가장 작은
직교 경로를 선택한다. 모든 분기는 source·target 이외 node와의 교차 검사를 거친다.

**Rationale**: 가로 범위만 비교하면 아래쪽 두 node를 잇는 선이 훨씬 위쪽 node를
장애물로 오인해 역주행하고, node와 문구를 관통할 수 있다. 행 구간을 함께 사용하면
현재 구조를 바꾸지 않고 가까운 빈 공간에서 흐름을 연결할 수 있다.

**Alternatives considered**:
- 작업물별 waypoint 추가: 기각. 공통 라우터 결함을 데이터별 수동 좌표로 숨기게 된다.
- edge를 node 뒤 레이어로 이동: 기각. 실제 교차는 남고 화살촉이 node에 가려질 수 있다.
- 전면 격자 탐색 라우터: 기각. 현재 정적 규모와 직교 행 구조에 비해 복잡도가 과하다.

## D-014. 같은 판단에서 갈라지는 결과 경로는 목적지 순서로 계단형 통로를 배정한다

**Decision**: 같은 source에서 같은 target 행의 세 개 이상 node로 상·하 분기할 때 target
x 좌표로 sibling을 정렬하고, 공통 진행 구간을 균등 분할한 높이를 각 cross-lane 경로의
우선 통로로 사용한다. 같은 x의 target은 인위적인 dogleg 없이 직접 수직 연결한다. 우선
통로가 node를 관통하면 가장 가까운 안전 후보로 폴백하고 공통 obstacle 검사를 유지한다.

Harness의 `품질 검사 실패 → 배포 중단`은 오른쪽 변으로 도착하고 실패선의 기존
waypoint는 오른쪽 변 도착에서 hairpin을 만들므로 제거한다. `시크릿 불일치 → 배포 중단`은
초기 승인에서 위쪽 변으로 교환했지만, node 제목을 가린다는 후속 화면 피드백에 따라
D-015에서 아래쪽 변으로 최종 정정한다.

**Rationale**: 모든 분기가 같은 가로선을 공유하면 라벨은 보이더라도 조건과 결과의 대응을
추적하기 어렵다. 목적지 순서와 통로 순서를 맞추면 구조를 바꾸지 않고도 연결 관계를
예측할 수 있으며, 같은 lane의 직선은 가장 명확하고 짧은 표현이다.

**Alternatives considered**:
- 네 경로 모두 강제 dogleg: 기각. 같은 lane의 명확한 수직 연결까지 불필요하게 꺾인다.
- 작업물별 waypoint 네 세트: 기각. viewport마다 좌표를 유지해야 하고 공통 규칙이 되지 않는다.
- 라벨 위치만 수동 조정: 기각. 겹침은 줄어도 어떤 선이 어느 target으로 가는지 모호함이 남는다.

## D-015. 같은 행의 가로 출발·세로 도착 경로는 target 바깥 통로를 사용한다

**Decision**: source와 target이 같은 행이고 연결선이 left/right anchor에서 출발해
top/bottom anchor로 도착하면, source exit에서 target approach의 y까지 먼저 이동한 뒤
target 바깥에서 수평으로 접근하고 마지막 직선으로 지정 변에 진입한다. 이 특수 규칙은
같은 행에만 적용하고 기존 서로 다른 행의 routing은 변경하지 않는다.

**Rationale**: 일반 직교화는 source와 target 중심 y가 같을 때 target 중심을 먼저
가로지른 뒤 도착 변으로 돌아오는 경로를 만들 수 있다. 도착 anchor만 아래로 바꾸는 것으로는
node 문구 가림이 해결되지 않으므로 target 바깥 통로가 필요하다.

**Alternatives considered**:
- anchor만 bottom으로 변경: 기각. 선이 node 중앙을 통과한 뒤 아래로 돌아왔다.
- Harness edge에 viewport별 waypoint 추가: 기각. 공통 geometry 문제를 데이터 좌표로 숨긴다.
- 모든 가로→세로 경로에 적용: 기각. 서로 다른 행의 기존 obstacle-safe 경로에 회귀가 발생했다.
