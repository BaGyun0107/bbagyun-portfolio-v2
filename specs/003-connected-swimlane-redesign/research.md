# Research: 연결형 스윔레인 재설계

## 1. 표현 방식

**Decision**: 책임 주체를 세로 lane으로 두고 시간은 위에서 아래로 흐르는 연결형 교차
기능 다이어그램을 사용한다.

**Rationale**: 사용자가 제공한 참고 이미지와 승인 시안은 단계가 어느 책임 주체로
넘어가고 어디서 되돌아가는지를 하나의 흐름으로 보여준다. 현재 lane별 카드와 별도 edge
목록은 이 공간 관계를 전달하지 못한다.

**Alternatives considered**:

- 가로 진행형 lane: 일반적인 형태지만 작은 화면에서 긴 가로 이동이 필요하다.
- 주 흐름과 예외 카드만 분리: 독해는 빠르지만 책임 경계를 공간적으로 보여주는
  스윔레인의 의미가 약하다.

## 2. 렌더링 경계

**Decision**: 위치 데이터 기반의 공통 정적 SVG renderer를 사용하고 외부 diagram
library나 클라이언트 layout runtime을 추가하지 않는다.

**Rationale**: 흐름은 build-time 정적 데이터이고 두 다이어그램의 배치가 승인돼 있어
자동 layout engine이 필요하지 않다. 명시적 위치와 route는 시각 결과를 통제하며 React
Server Component로 hydration 없이 출력할 수 있다.

**Alternatives considered**:

- 하네스 전용 SVG: 가장 빠르지만 후속 작업물에서 재사용할 수 없고 콘텐츠 수정 시
  좌표와 markup이 결합된다.
- Mermaid/React Flow: 자동 배치는 편하지만 의존성, runtime과 스타일 통제 비용이
  정적 포트폴리오 범위보다 크다.

## 3. 데이터 모델

**Decision**: step은 책임 lane, 세로 row와 도형 의미를 갖고 edge는 시작·도착 anchor와
선택 waypoint를 갖는다. 정상과 예외 연결을 구분하고 공개 예외 문장은 별도 exception
entity에서 edge와 연결한다.

**Rationale**: node 위치와 line route를 데이터로 분리하면 renderer가 특정 하네스
단계명을 알 필요가 없다. 내부 edge 상태와 방문자가 읽을 자연어 문장을 분리하면
`recover`, `continue` 같은 구현 용어가 공개 화면으로 새지 않는다.

**Alternatives considered**:

- step 순서만으로 자동 좌표 계산: 정상선은 가능하지만 복귀선이 node와 겹칠 수 있다.
- edge label을 그대로 공개: 데이터는 단순하지만 현재의 `연결과 분기` 문제를 반복한다.

## 4. 연결 무결성

**Decision**: 게시 전에 시작·완료 node의 단일성, 같은 lane/row 위치 중복, 모든 참조,
유효 좌표, 정상 경로 도달 가능성과 exception 설명을 검증한다. 모든 비중단 step은
start에서 도달 가능하고 end로 도달할 수 있어야 하며 normal edge는 더 큰 row로 진행해야
한다. 모든 exception edge는 최소 한 개의 방문자용 exception 설명에 포함돼야 한다.

**Rationale**: 정적 데이터 오류는 build 결과에 그대로 노출된다. 단순 참조 검증만으로는
시작과 완료가 있어도 서로 연결되지 않은 다이어그램이나 고립된 정상 단계를 차단할 수
없으므로 양방향 reachability 검사가 필요하다.

**Alternatives considered**:

- TypeScript 타입만 사용: 중복 위치와 graph reachability 같은 교차 필드 조건을 검증할
  수 없다.
- renderer에서 누락 항목 무시: 잘못된 공개 콘텐츠를 조용히 게시해 헌법의 사실성 원칙에
  어긋난다.

## 5. 접근성·반응형

**Decision**: 각 흐름은 이름 있는 figure와 image, 한 번만 초점을 받는 내부 scroll
region, 일반 문장으로 된 전체 흐름 설명과 예외 대응을 제공한다. image 설명은 보이는
`전체 흐름 설명`과 직접 연결하고 정적 node와 edge는 개별 tab stop이 아니다.

**Rationale**: SVG의 공간 관계를 사용할 수 없는 방문자도 동일한 흐름을 이해해야 한다.
작은 화면에서는 고정된 diagram 최소 너비를 유지하고 컨테이너만 가로 이동해야 lane과
연결선이 찌그러지지 않는다.

**Alternatives considered**:

- SVG node마다 tab stop: 정보 탐색 비용만 늘리고 상호작용이 없는 요소를 조작 가능한
  것처럼 만든다.
- 전체 페이지 축소: 문구와 node가 읽기 어려워지고 책임 공간 관계가 무너진다.

## 6. 지표 범위 용어

**Decision**: 기존 `caveat` 데이터는 유지하되 공개 label만 추정값 `산정 범위`, 측정값
`측정 범위`, 보고값 `관찰 범위`로 매핑한다.

**Rationale**: `제한`은 성과의 단점처럼 읽히지만 실제 문장은 비용 포함 범위, 측정 표본,
운영 관찰 기간을 설명한다. 내부 필드를 바꾸지 않아 기존 데이터 호환성을 보존한다.

**Alternatives considered**:

- 모두 `참고`로 표시: 문구는 부드럽지만 세 근거의 해석 차이가 다시 흐려진다.
- 데이터 필드 세 개로 분리: 현재 한 지표에 하나의 근거 종류만 있어 불필요한 타입
  복잡도를 만든다.

## 7. 호환성과 검증

**Decision**: 하네스 구조화 상세과 공통 renderer만 변경하고 legacy fallback, 공개 데모
부재, 여덟 작업물 경로와 기존 인사이트 사실을 보존한다. TDD는 데이터→geometry→server
rendering→E2E 순서로 진행한다.

**Rationale**: 이번 변경의 원인은 흐름 전달 방식과 지표 label이며 이미 승인된 다른
콘텐츠를 다시 수정할 근거가 없다. 순수 계층부터 검증하면 SVG 회귀의 원인을 빠르게
분리할 수 있다.

**Alternatives considered**:

- 상세 페이지 전체 재설계: 사용자 피드백 범위를 넘어가며 기존 검증 증거를 무효화한다.
- 시각 snapshot만 사용: 연결 의미와 접근 가능한 문구를 안정적으로 검증하기 어렵다.

## 8. 판단과 완료의 의미 분리

**Decision**: 설계 흐름의 `리뷰·검증`은 decision node로 표현하고 정상 `통과` edge 뒤에
보조 `완료` end node를 둔다. 모든 decision의 나가는 edge에는 `승인`/`미승인`,
`통과`/`실패`, `일치`/`불일치`처럼 결과를 설명하는 짧은 label을 둔다.

**Rationale**: 완료 도형에서 실패 복귀선이 출발하면 이미 종료된 상태와 검증 중인 상태가
섞인다. 판단과 완료를 분리하면 핵심 여섯 단계는 유지하면서 정상 종료와 실패 복귀를
동시에 정확하게 표현할 수 있고, 선 색상을 보지 않아도 분기 결과를 이해할 수 있다.

**Alternatives considered**:

- `리뷰·검증`을 end로 유지: 완료 상태에 outgoing 실패선이 생겨 의미가 모순된다.
- decision/end 복합 도형: 단일 도형은 줄지만 공통 renderer와 접근성 계약이 복잡해진다.
