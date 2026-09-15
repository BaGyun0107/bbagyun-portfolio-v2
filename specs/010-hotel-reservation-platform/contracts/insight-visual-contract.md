# Contract: 일반화된 인사이트 시각 자료

**Date**: 2026-09-09

## 공통 입력 계약

`InsightVisual`은 기존 `data-flow | before-after` 선택형 값을 유지한다. 공통 필드 `id`, `title`, `question`, `textAlternative`는 비어 있으면 안 된다.

typed visual이 있으면 `visualAssessment.decision = provided`여야 하며 assessment와 visual의 `question`, `textAlternative`가 일치해야 한다.

## data-flow

- 고유한 node와 edge ID
- `state | data | action | terminal` node 역할 유지
- `normal | success | failure | retry` edge 결과 유지
- 모든 edge의 시작·도착 node 존재
- 빈 node·edge label 없음
- 특정 outcome 조합은 공통 계약이 아니라 개별 콘텐츠 계약에서 요구
- 코드 경계 visual은 세 분류를 `normal` edge label로 표현
- 하이패스 정산 visual은 콘텐츠 회귀 계약에서 success·failure·retry를 계속 요구

## before-after

- 정확히 `before`, `after` 두 패널
- 패널별 고유 actor와 connection ID
- 기존 `server | room | recipient | unrelated` actor 역할 유지
- `source | relay | boundary | consumer` actor 역할 추가
- 기존 `intended | overbroad` connection 범위 유지
- `indirect | direct` connection 범위 추가
- 모든 connection의 시작·도착 actor가 같은 패널에 존재
- 각 패널에 최소 1개 connection 존재
- Props Drilling visual은 Before `indirect`, After `direct` 관계를 사용
- Socket.io visual은 콘텐츠 회귀 계약에서 Before `overbroad`, After `intended` 관계를 계속 요구

## 표시 계약

- 시각 자료는 excerpt 뒤, Markdown 본문 앞에 한 번만 표시
- visual이 없는 인사이트에는 빈 heading, card, placeholder 없음
- 제목, 질문, node/actor 이름과 관계 label은 실제 텍스트로 존재
- 분류와 Before/After 관계는 색상 외 label·선·테두리·DOM 순서로 구분
- data-flow의 출발과 도착, before-after의 간접·직접 경로가 문자로 읽힘
- text alternative는 diagram과 programmatic하게 연결됨
- 기존 하이패스 visual의 표시와 의미가 변하지 않음
- 고객 정보, 예약·결제 식별자, 시크릿, private payload/log/source 없음

## 반응형 계약

- 320/768/1024/1440px에서 document `scrollWidth <= clientWidth`
- 시각 컨테이너가 본문 폭을 초과하지 않음
- 320px에서 node와 panel 관계를 세로 흐름으로 읽을 수 있음
- node·actor·relation label과 제목이 서로의 bounding box를 침범하지 않음
- 긴 한글 label은 2~3줄로 줄바꿈하되 잘리지 않음

## 접근성 계약

- diagram group은 보이는 제목을 접근 가능한 이름으로 사용
- 질문과 text alternative를 접근 가능한 설명으로 연결
- 패널·단계의 DOM 읽기 순서와 시각 순서 일치
- 장식 화살표는 중복 낭독되지 않음
- 관련 작업물 링크와 이전·다음 링크의 키보드 동작을 방해하지 않음
