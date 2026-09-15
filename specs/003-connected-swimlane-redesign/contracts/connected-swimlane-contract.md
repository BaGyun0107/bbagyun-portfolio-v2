# Contract: Connected Portfolio Swimlane

## Purpose

이 계약은 구조화 작업물 상세의 선택형 스윔레인이 공개 페이지에서 전체 연결 흐름과
텍스트 대체 설명으로 어떻게 표현되는지 정의한다. 외부 API 계약이 아니라 build-time
데이터·검증기와 공개 UI의 동작 계약이다.

## Data Contract

### Valid flow

- 책임 lane, step, edge, 전체 흐름 설명과 exception 배열을 제공한다.
- 정확히 하나의 start와 end가 있다.
- start에서 end까지 normal edge만으로 이어진다.
- stop을 제외한 모든 step이 start→end 정상 경로에 참여하고 normal edge는 더 큰 row로
  진행한다.
- step 위치는 같은 lane/row에서 겹치지 않는다.
- exception은 하나 이상의 exception edge와 방문자용 trigger/response를 가진다.
- 모든 exception edge는 하나 이상의 방문자용 exception 설명에 포함된다.

### Invalid flow

`validateFeatureDetail(detail)`은 다음을 식별 가능한 path와 함께 오류로 반환한다.

- 빈 필수 문자열
- 중복 swimlane/lane/step/edge/exception ID
- 중복 lane/row 위치
- 존재하지 않는 lane·step·edge 참조
- 유효하지 않은 row·route 좌표
- start/end 개수 오류
- start→end 정상 경로 단절
- normal/exception과 outcome의 잘못된 조합
- 비어 있거나 normal edge만 참조하는 exception 설명

입력을 자동 수정하거나 잘못된 node·edge를 조용히 생략하지 않는다.

## Visual Contract

- 책임 주체는 좌→우 세로 lane으로 구분한다.
- 진행 방향은 위→아래다.
- process는 사각형, decision은 마름모, start/end는 둥근 도형, stop은 명시적인 중단
  도형으로 구분한다.
- normal path는 실선과 정상 진행 문맥을 사용한다.
- exception path는 점선과 조건 문구를 사용한다.
- 설계 흐름의 `리뷰·검증`은 decision이고 정상 `통과` edge 뒤의 `완료`가 end다.
- 모든 decision의 정상·예외 분기선은 결과를 설명하는 비어 있지 않은 label을 가진다.
- edge는 node 경계를 anchor로 사용하며 선택 waypoint 순서로 연결된다.
- 시각 요소는 기존 semantic color token을 사용하고 밝은/어두운 화면에서 의미를
  유지한다.

## Public Copy Contract

- 다이어그램 제목과 목적을 먼저 제공한다.
- 시각 영역의 접근 가능한 이름은 `<스윔레인 제목> 전체 흐름`이며 보이는
  `전체 흐름 설명`과 설명 관계로 연결된다.
- `전체 흐름 설명`은 정상 여섯 단계의 순서를 일반 문장으로 제공한다.
- exception이 있으면 `예외 상황과 대응` 아래에 trigger와 response를 제공한다.
- 공개 화면에 `연결과 분기`, `순서형 대체 설명`, `이전 단계로 복구`, `계속`을
  표시하지 않는다.
- exception이 없으면 빈 예외 영역을 만들지 않는다.

## Interaction and Accessibility Contract

- 다이어그램 scroll region은 `<스윔레인 제목> 다이어그램`이라는 이름을 가진다.
- 넓은 다이어그램은 자체 region만 가로 overflow를 가진다.
- region은 키보드로 한 번 초점을 받고 좌우 방향키 탐색을 허용한다.
- 정적 lane, node, edge와 label은 별도 tab stop이 아니다.
- 시각 diagram을 사용하지 않아도 전체 흐름 설명과 exception 문장으로 같은 의미를
  얻을 수 있다.
- 색상 외에 선 스타일, 도형과 문구로 의미를 구분한다.

## Metric Scope Contract

| 입력 | 공개 결과 |
| --- | --- |
| `estimated` + caveat | `산정 범위: <caveat>` |
| `measured` + caveat | `측정 범위: <caveat>` |
| `reported` + caveat | `관찰 범위: <caveat>` |
| caveat 없음 | 범위 영역 없음 |

`제한:` label은 표시하지 않는다. 기존 metric value, evidence와 as-of 값은 변경하지 않는다.

## Compatibility Contract

- 하네스에는 연결형 스윔레인 두 개만 표시한다.
- 하네스의 demo 부재와 나머지 상세 정보 순서를 유지한다.
- 구조화 상세가 없는 7개 작업물은 기존 Markdown fallback을 유지한다.
- `generateStaticParams()`가 생성하는 8개 작업물 공개 경로를 유지한다.
- 스윔레인이 없는 작업물에는 빈 diagram 또는 exception 영역이 없다.

## Automated Proof Contract

- data test는 모든 invalid flow 조건과 승인된 두 flow instance를 검증한다.
- geometry test는 lane/row 좌표, node anchor, waypoint와 polyline 직렬화를 검증한다.
- server rendering test는 figure/image semantics, node shape, edge kind와 공개 금지 문구를
  검증한다.
- E2E는 두 흐름, 320/768/1024/1440px overflow, 키보드 내부 scroll, 다크 모드와 8개
  작업물 공개 경로를 검증한다.
