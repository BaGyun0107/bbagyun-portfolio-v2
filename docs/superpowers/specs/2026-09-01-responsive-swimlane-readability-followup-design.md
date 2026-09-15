# 반응형 스윔레인 가독성 후속 설계

**Date**: 2026-09-01
**Feature**: `008-responsive-swimlane-viewer` follow-up
**Status**: 사용자 설계 승인

## 1. 배경과 측정 근거

feature 008은 본문 다이어그램을 고정 viewBox 전체 축소 방식으로 카드 폭에 맞췄다.
가로 스크롤은 제거됐지만 SVG 내부 글자와 라벨도 함께 축소됐고, edge 라벨끼리의
충돌은 검증하지 않았다.

실제 포트 1104에서 Blackstone과 Hanmaum 상세를 측정한 결과는 다음과 같다.

| 화면 폭 | 본문 SVG 렌더 폭 | 4-lane viewBox | 배율 | 12px node 글자의 실제 크기 |
| ---: | ---: | ---: | ---: | ---: |
| 320px | 252px | 940px | 0.268 | 약 3.2px |
| 768px | 684px | 940px | 0.728 | 약 8.7px |
| 1440px | 766.7px | 940px | 0.816 | 약 9.8px |

Blackstone의 label 네 개에 대해서는 다음 세 충돌이 모든 화면 폭에서 동일하게
발생했다.

- `evaluate-complete` ↔ `evaluate-outage`
- `evaluate-compensate` ↔ `evaluate-outage`
- `evaluate-compensate` ↔ `evaluate-timeout`

각 edge 전체 길이의 중앙점도 x 약 255.5, 360, 466.5, 576.5로 서로 달랐지만,
y가 약 624.5~632의 같은 가로 통로에 모였다. label 폭은 97~199px로 중앙점 간격
약 104~110px보다 커서 중앙점만 바꾸면 같은 세 충돌이 유지됐다.

## 2. 목표

- 기존 lane 열, node, edge, 진행 순서와 분기 의미를 유지한다.
- 작업물의 스윔레인 데이터와 공개 문구를 수정하지 않는다.
- 본문과 `크게 보기`에서 node 글자의 실제 표시 크기를 최소 10px로 유지한다.
- edge label의 기본 의미 위치를 각 경로의 중앙으로 통일한다.
- label은 한 줄을 우선하고, 충돌할 때만 가장 가까운 위·아래 위치로 이동한다.
- label끼리, label과 node, label과 다이어그램 경계의 충돌을 0건으로 만든다.
- 기존 no-scroll, Dialog, 키보드, 접근성, normal/exception 표현 계약을 유지한다.

## 3. 비목표

- 스윔레인을 세로 timeline이나 카드 목록으로 바꾸지 않는다.
- lane을 제거하거나 node를 번호형 범례로 치환하지 않는다.
- 작업물별 좌표·문구를 수동으로 고쳐 공통 문제를 우회하지 않는다.
- 가로 스크롤, 고정 최소 폭 canvas 또는 hover 전용 확대를 다시 도입하지 않는다.
- edge label을 기본적으로 여러 줄로 만들지 않는다.

## 4. 승인된 시각 규칙

### 4.1 구조 보존

화면 폭과 관계없이 같은 lane, node, edge와 분기 관계를 표시한다. 반응형 변경 대상은
geometry뿐이다. 좁은 화면에서도 네 lane은 네 열로 남으며, node가 속한 lane과 edge가
가리키는 대상이 달라지지 않는다.

### 4.2 node 가독성

- 고정 940px 좌표계를 통째로 축소하지 않는다.
- 본문과 Dialog의 실제 컨테이너 폭을 측정해 lane 폭과 canvas 폭을 계산한다.
- node 글자의 실제 표시 크기는 최소 10px다.
- node 폭이 문구의 한 줄 폭보다 작으면 node 안에서 여러 줄로 표시한다.
- node 높이는 line count, line height와 상하 padding으로 계산한다.
- decision node는 diamond의 실제 내부 안전 폭을 기준으로 줄바꿈한다.
- 같은 row의 node 중 가장 높은 node와 필요한 여백을 기준으로 row 간격을 계산한다.
- 화면이 좁을수록 가로 구조를 바꾸는 대신 diagram 높이가 늘어난다.

### 4.3 edge label 위치

1. 직선과 최대 8px quadratic corner를 포함한 실제 rounded path의 누적 길이를 순수
   geometry로 계산한다.
2. rounded path 전체 길이의 50% 지점을 자동 label의 기본 중심으로 사용한다.
3. 한 줄 label rectangle이 다른 label, node 또는 diagram 경계와 충돌하지 않으면
   중앙 위치를 그대로 사용한다.
4. 충돌하면 x 중심은 유지하고, 중앙에서 가까운 순서로 위·아래 후보를 평가한다.
   기본 간격은 `label height + 8px`이며 `0, -1, +1, -2, +2` 트랙 순서로 검사한다.
5. 이동량이 가장 작고 충돌이 없는 첫 후보를 선택한다.
6. 한 줄 후보로 공간을 찾지 못했을 때만 가용 폭 안에서 2줄, 이후 3줄 후보를
   순서대로 평가한다.
7. 3줄 후보까지 충돌하면 게시 가능한 geometry로 취급하지 않고 layout 검증기가
   실패를 반환한다. 문구를 생략하거나 잘라서 통과시키지 않는다.

명시적인 `labelAt`은 고정 위치로 먼저 배치한다. 자동 label은 명시 label을 장애물로
취급해 피하며, `labelAt` 자체를 자동 이동하지 않는다. 명시 label이 node나 경계와
충돌하면 위치를 임의 보정하지 않고 layout 검증 오류로 반환한다.

label을 위·아래로 이동해도 edge data와 label 문구는 그대로다. 별도의 leader line이나
수신 포트는 추가하지 않는다.

## 5. 구현 경계

### 5.1 컨테이너 측정

`ProjectSwimlane`은 이미 client boundary이므로 본문과 Dialog의 diagram wrapper가 각자
자신의 폭을 측정한다. `ResizeObserver` callback에서 정수 단위 폭 변경만 반영하고,
동일 폭의 반복 갱신은 무시한다.

서버 렌더와 hydration의 첫 render는 읽기 가능한 보수적 compact 폭을 사용한다.
observer가 실제 폭을 전달하면 같은 데이터로 geometry를 다시 계산한다. effect 본문에서
동기적으로 state를 복사하지 않고 observer event에서만 폭을 갱신한다.

측정 폭이 0이거나 유한하지 않으면 마지막 정상 폭 또는 compact fallback을 유지한다.
observer를 사용할 수 없는 환경에서도 compact fallback은 최소 글자 크기를 만족해야 한다.

### 5.2 순수 layout 입력

layout 함수는 전역 고정 상수 대신 다음 입력을 받는다.

```ts
interface SwimlaneLayoutViewport {
  width: number;
  minimumFontSize: number;
}
```

이 입력으로 diagram padding, lane width, node width·height, row center, anchor, edge path와
label geometry를 한 번에 계산한다. renderer는 계산 결과만 SVG로 표시한다.

### 5.3 text layout

기존 CJK·Latin·space 폭 추정 규칙을 node와 edge label이 공유한다. 가능한 경우 공백과
구두점 경계를 먼저 사용하고, 하나의 token이 안전 폭보다 길 때만 글자 단위로 나눈다.
각 결과는 `lines`, `width`, `height`, `lineHeight`를 포함한다.

### 5.4 label collision resolver

resolver 입력은 edge path, 자연 한 줄 label geometry, node rectangle, 먼저 확정된
label rectangle과 diagram boundary다. 출력은 선택한 중심점, lines와 최종 rectangle이다.

배치 순서는 다음처럼 결정적이어야 한다.

1. 명시 `labelAt` label
2. normal edge의 자동 label
3. exception edge의 자동 label
4. 같은 그룹에서는 기존 edge 배열 순서

같은 데이터와 viewport 입력은 항상 같은 배치를 반환해야 한다.

## 6. 컴포넌트 흐름

```text
ProjectSwimlane
  ├─ inline ResponsiveSwimlaneDiagram ─┐
  └─ Dialog ResponsiveSwimlaneDiagram ─┤
                                       ▼
                              measured container width
                                       ▼
                           calculateSwimlaneLayout(...)
                         ┌─────────────┼──────────────┐
                         ▼             ▼              ▼
                    node layout    edge routing   label resolver
                         └─────────────┼──────────────┘
                                       ▼
                          ProjectSwimlaneDiagram SVG
```

본문과 Dialog는 독립적으로 폭을 측정하지만 같은 데이터, layout 함수와 렌더링 규칙을
사용한다. 기존 instance key와 고유 marker/title/description ID 규칙은 유지한다.

## 7. 검증 계약

### 7.1 순수 geometry 테스트

- 4-lane 및 3-lane fixture를 252·307·684·766.7px 폭으로 계산한다.
- 모든 node text의 계산 글자 크기가 최소 10px다.
- 모든 node text rectangle이 node 안전 영역 안에 존재한다.
- node line 증가에 맞춰 node height와 row 간격이 증가한다.
- rounded path 전체 누적 길이의 50% 지점을 정확히 계산한다.
- 충돌이 없으면 label이 중앙점에 남는다.
- 충돌하면 최소 이동량의 위·아래 후보를 선택한다.
- Blackstone label 네 개 사이의 collision이 0건이다.
- 명시 `labelAt`은 이동하지 않고 자동 label만 피한다.
- 한 줄 → 2줄 → 3줄 → 실패 순서가 결정적으로 동작한다.

### 7.2 렌더링 테스트

- node와 edge label은 계산된 line별 `tspan`을 렌더링한다.
- inline/Dialog의 고유 ID와 접근 이름이 유지된다.
- lane → node shape → edge → node text → edge label layer 순서를 유지한다.
- normal 실선, exception 점선, 2px path, 6px marker, port·dot·halo 0개를 유지한다.
- 구조화 작업물 4개·스윔레인 6개의 입력 데이터와 공개 문자열을 exact fixture로 보존한다.

### 7.3 production E2E

320·375·768·1024·1440px에서 구조화 작업물 4개와 스윔레인 6개의 inline/Dialog를
검사한다.

- document, card와 Dialog의 가로 overflow 0px
- 실제 node text 표시 크기 최소 10px
- node text와 node shape 경계 교차 0건
- edge label rectangle 간 교차 0건
- edge label과 node rectangle 교차 0건
- label과 SVG viewBox 경계 교차 0건
- inline/Dialog의 lane·step·edge·label·summary 동일성
- click·tap·Enter·Space 열기, Escape 닫기와 trigger focus 복귀

E2E는 기존 포트 1104 서버와 `.next/dev` lock을 건드리지 않고 새 production build를
별도 포트에서 실행한다. 최종 모바일 Blackstone과 Hanmaum, 데스크톱 Dialog 화면을
캡처해 직접 검사한다.

## 8. 완료 조건

- 사용자 승인 label 중앙·위아래 조정 규칙과 node 최소 글자 크기 규칙이 모두 구현된다.
- 기존 스윔레인 구조와 공개 데이터 손실이 0건이다.
- 관련 Vitest, 전체 Vitest, TypeScript, 변경 범위 ESLint, production build와 fresh E2E가
  모두 통과한다.
- 독립 리뷰의 Critical·Important 지적이 0건이다.
- feature 008 spec·plan·tasks·verification과 ROADMAP이 후속 완료 상태로 동기화된다.

## 9. 사용자 화면 피드백에 따른 경로 회귀 보완

2026-09-01 실제 포트 1104의 Blackstone과 Hanmaum 화면에서 일부 연결선이 먼 위쪽으로
우회한 뒤 비연결 node와 문구를 관통하는 문제가 확인됐다. 사용자는 기존 구조를 유지하고
공통 라우터를 보완하는 방식을 승인했다.

- 장애물 후보는 연결선의 가로 통과 범위뿐 아니라 출발·도착 사이의 세로 구간에도 실제로
  걸치는 node로 제한한다.
- 각 edge는 source와 target을 제외한 모든 node rectangle과 교차하지 않아야 한다.
- 특수 상·하 anchor 경로도 공통 obstacle 검증을 거치며, 충돌을 숨기기 위해 선을 node
  뒤로 보내는 방식은 사용하지 않는다.
- 실제 4개 작업물·6개 스윔레인 데이터를 지원 폭으로 계산하는 단위 회귀와 브라우저의
  SVG path·비연결 node 교차 검사를 함께 통과해야 한다.

## 10. 결과 분기 대응 관계 보완

2026-09-01 후속 화면 검토에서 Harness의 두 `배포 중단` 분기는 도착 변만 교환하고,
Blackstone의 네 결과 분기는 목적지 좌→우 순서에 맞는 통로 높이로 구분하기로 승인했다.

- Harness의 품질 실패는 `배포 중단` 오른쪽 변으로 도착한다. 시크릿 불일치는 초기
  위쪽 승인 후 §11의 후속 피드백에 따라 아래쪽 변으로 정정한다.
- 품질 실패의 기존 waypoint는 새 오른쪽 도착에서 hairpin을 만들므로 제거한다.
- 같은 source에서 같은 target 행의 세 개 이상 node로 갈라지는 cross-lane 경로는 target
  x 순서로 서로 다른 수평 통로를 사용한다.
- source와 target의 x가 같은 분기는 인위적으로 꺾지 않고 수직 직선을 유지한다.
- 통로가 obstacle과 충돌하면 가장 가까운 안전 통로로 폴백하며 기존 교차 0건 계약을 유지한다.

## 11. 같은 행의 세로 anchor 도착 보완

Harness의 `시크릿 조회 → 배포 중단` 예외선은 위쪽 도착에서 node 제목을 가려 아래쪽
도착으로 변경했다. 단순 anchor 변경만 적용하면 일반 직교 경로가 node 중앙을 먼저
가로지른 뒤 아래로 돌아오므로 다음 공통 규칙을 함께 적용한다.

- source와 target이 같은 행이고 left/right에서 출발해 top/bottom으로 도착하는 경우만
  target 바깥쪽 y 통로로 먼저 이동한다.
- 마지막 직선만 지정된 target 변으로 진입하며 이전 segment는 target 내부를 통과하지 않는다.
- 서로 다른 행의 기존 가로→세로 경로에는 적용하지 않아 다른 작업물의 routing을 보존한다.
