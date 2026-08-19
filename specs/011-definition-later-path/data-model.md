# Data Model: 정의-후행 경량 경로

## FEAT stub (draft FeatureDefinition)

`feature-definitions.json` 항목의 부분집합. 필드:

- `id` (필수, `FEAT-*`, 불변, 기존 ID와 충돌 금지)
- `title` (필수)
- `summary` (선택, 명령 인자로 받으면 기록)
- `definitionStatus`: 항상 `"draft"`
- `lastReviewedAt`: 생성 시각

정식 정의로의 승격은 사람이 카탈로그/상세를 채우는 것으로 이뤄지며
stub 경로는 관여하지 않는다. draft 정의에는 acceptance가 없으므로 기존
완료 가드가 자동으로 done을 차단한다(추가 상태 불필요).

## 미등록 work item 투영

normalize 결과 item에 붙는 마커:

- `registered: false` — `featureDefinitionId`가 카탈로그에 없는 유효
  항목. 그 외 항목은 `registered` 필드 없음(= 등록됨).
- health `work-item-feature-reference-broken`은 기존대로 유지된다.

렌더러는 `registered === false` 항목을 "미등록 기능" 묶음으로 그룹화해
정식 기능 목록과 구분 표시하고 `mise run feature:stub` 안내를 붙인다.

## status.yaml 확장

- `featureId` (선택, `FEAT-*` 문자열 1개) — spec→기능 역방향 연결.
- 연결 우선순위: planning 명시 관계 > `featureId` > ID 동일성.
- 충돌 시 health: `spec-feature-link-conflict` (planning 우선 적용).

## spec 유래 delivery 근거 (D4 투영 레코드)

legacy `features` 항목과 같은 모양으로 변환:

- `featureId`: D3 우선순위로 결정된 연결 기능 ID
- `status`: spec status를 base 상태로 매핑
  (planned/in-progress/in-review/done, `on-hold`는 hold 라벨)
- `tasks`: tasks.md 체크박스 집계 `{done,total}` (없으면 생략)
- `source`: `spec-scan` (명시 evidence와 구분)

명시 evidence에 같은 featureId가 있으면 투영하지 않는다.

## 열린 결정 항목 (stub 생성 시)

`decisions.json`에 추가되는 항목:

- `id`: `DEC-STUB-<FEAT-ID>`
- `question`: 소급 상세(11그룹·acceptance) 작성 필요
- `ownerRole`: 등록 실행자가 인자로 지정(기본 `product`)
- `resolutionCondition`: feature detail 작성 후 definitionStatus 승격
