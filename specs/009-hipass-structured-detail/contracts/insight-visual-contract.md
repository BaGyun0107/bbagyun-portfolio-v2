# Contract: 인사이트 시각 자료

**Date**: 2026-09-04

## 입력 계약

`InsightVisual`은 `data-flow | before-after` 선택형 값이다. 공통 필드 `id`, `title`, `question`, `textAlternative`는 비어 있으면 안 된다.

### data-flow

- 고유한 node와 edge ID
- `state | data | action | terminal` node 역할
- `normal | success | failure | retry` edge 결과
- 모든 edge의 시작/도착 node 존재
- 성공·실패·재시도 관계 각각 최소 1개

### before-after

- 정확히 `before`, `after` 두 패널
- 패널별 고유 actor와 connection ID
- `server | room | recipient | unrelated` actor 역할
- `intended | overbroad` connection 범위
- 모든 connection의 시작/도착 actor가 같은 패널에 존재
- before에 `overbroad`, after에 `intended` 관계 각각 최소 1개

## Editorial 일치 계약

- typed visual이 있으면 `visualAssessment.decision = provided`
- `data-flow` ↔ assessment `kind = data-flow`
- `before-after` ↔ assessment `kind = architecture`
- assessment와 visual의 `question`, `textAlternative` 동일
- `rationale`, `nonDuplicationReason`은 해당 글의 질문과 연결 작업물과의 차이를 명시
- typed visual이 없는 legacy provided 글은 점진 이전 대상으로 허용

## 표시 계약

- 시각 자료는 excerpt 뒤, Markdown 본문 앞에 한 번만 표시
- visual이 없는 인사이트에는 빈 heading, card, placeholder 없음
- 제목, 질문, node/actor 이름과 관계 label은 실제 텍스트로 존재
- 정상·성공·실패·재시도, 변경 전·후, 의도 범위·과도 범위는 색상 외 문자와 선/테두리로 구분
- data-flow 성공/실패 분기는 어떤 node에서 갈라져 어디로 가는지 읽을 수 있음
- before/after 패널은 각각 독립된 접근 가능한 이름과 요약을 가짐
- text alternative는 diagram과 programmatic하게 연결됨
- customer/account/payment identifiers, secrets, private payload/log/source 없음

## 반응형 계약

- 320/768/1024/1440px에서 document `scrollWidth <= clientWidth`
- 시각 컨테이너가 본문 폭을 초과하지 않음
- 320px에서 노드와 패널을 세로 흐름으로 읽을 수 있음
- 노드·actor 본문, 관계 label, 제목이 서로의 bounding box를 침범하지 않음
- 연결선은 source/target 외 node·actor 텍스트 영역을 가로지르지 않음
- 긴 한글 label은 2~3줄로 줄바꿈하되 잘리지 않음

## 접근성 계약

- diagram group은 보이는 제목을 접근 가능한 이름으로 사용
- 질문과 text alternative를 접근 가능한 설명으로 연결
- 패널/단계 순서는 DOM 읽기 순서와 시각 순서가 일치
- 장식 연결선은 중복 낭독되지 않음
- 관련 작업물 링크와 목록/이전/다음 링크의 키보드 동작을 방해하지 않음
