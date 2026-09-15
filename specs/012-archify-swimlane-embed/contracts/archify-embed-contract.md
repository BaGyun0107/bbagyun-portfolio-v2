# Contract: Archify Embed

**Date**: 2026-09-10

## Purpose

실제 Archify 생성 HTML을 현재 포트폴리오 카드와 Dialog 안에서 표시 전용 스윔레인으로 사용하는 계약이다.

## Data boundary

~~~ts
interface FeatureSwimlaneArchifyEmbed {
  url: string;
}
~~~

- 선택 필드이며 metadata가 없으면 기존 renderer만 사용한다.
- URL은 query/hash 없는 same-origin /diagrams/*.html만 허용한다.
- label과 새 탭 action은 제거한다.
- 대상은 호텔 예약 시스템의 platform-change-verification-deployment 한 건이다.

## Artifact boundary

- Source: apps/front/diagrams/hotel-reservation-platform/platform-change-verification-deployment.json
- Generated HTML: apps/front/public/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html
- 두 파일의 Feature 011 SHA-256와 byte count가 유지되어야 한다.
- node 10개·edge 12개의 ID, 방향, label과 variant를 변경하지 않는다.
- Feature 012 구현은 두 파일을 직접 편집하거나 재생성하지 않는다.

## Runtime preparation

iframe load 뒤 다음 순서를 하나의 준비 transaction으로 처리한다.

1. contentDocument에 same-origin 접근한다.
2. .diagram-container > svg 존재를 검사한다.
3. root에 data-embed="true", data-motion="still"을 적용한다.
4. preview는 data-detail-level="map", Dialog는 data-detail-level="read"를 적용한다.
5. portfolio theme variables를 iframe root에 연결한다.
6. body와 iframe interaction을 차단한다.
7. Viewer chrome과 탐색 기능이 보이지 않음을 확인한다.
8. 모든 단계가 성공한 뒤 iframe을 공개하고 상태를 ready로 바꾼다.

중간 단계가 실패하면 부분 준비 화면을 공개하지 않는다.

## Load scheduling

- preview는 viewport의 240px root margin 안에 들어올 때만 iframe을 mount한다.
- Dialog iframe은 Dialog가 열린 동안만 mount한다.
- page 진입 시 preview와 Dialog iframe을 동시에 eager mount하지 않는다.
- Dialog를 다시 열면 READ 밀도와 현재 theme를 새 lifecycle에서 다시 준비한다.

## Fallback

다음은 모두 ResponsiveSwimlaneDiagram으로 대체한다.

- iframe load error
- 5초 준비 제한 시간 초과
- cross-origin 또는 contentDocument 접근 실패
- .diagram-container > svg 부재
- 필수 theme/interaction adapter 적용 실패

fallback에서도 카드 제목·목적·전체 흐름 설명·예외 대응과 기존 크게 보기 계약을 유지한다.

## Acceptance

- preview와 Dialog는 같은 URL과 topology를 사용한다.
- preview의 node sublabel과 edge label 노출은 0건이다.
- Dialog의 승인된 node sublabel과 의미 있는 edge label 누락은 0건이다.
- 별도 Archify로 보기 링크와 새 탭 동작은 0건이다.
- 비대상 스윔레인의 DOM·동작 변경은 0건이다.
