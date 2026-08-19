# Research: 연결형 기능 허브 v2

## D1. 기존 원본 연결 우선

- Decision: feature row는 얇은 카탈로그로 유지하고 spec/status/tasks/
  verification을 scanner에서 파생한다.
- Rationale: 상세와 진행률 중복 저장으로 인한 drift를 막는다.
- Alternatives: feature row schema에 상세 전체 추가 — 중복과 정규화 비용으로 기각.

## D2. spec 연결 우선순위

- Decision: 명시적 `specified-by` relation → 동일 ID spec → 미연결 순서.
- Rationale: 일반 사례는 설정 없이 동작하고 예외만 명시한다.
- Alternatives: 새 `feature-detail-links.csv` — 기존 안내만 있고 계약·scanner가 없어 기각.

## D3. typed endpoint

- Decision: endpoint는 `{ "type": "feature", "id": "FEAT-001" }`처럼
  type과 stable ID를 분리한다.
- Rationale: 문자열 prefix 파싱과 자유 텍스트 추론 없이 결정적 검증이 가능하다.
- Alternatives: `FEATURE:FEAT-001` 단일 문자열 — 단순하지만 escape와 type
  확장 시 parser 의미가 늘어 기각.

## D4. derived entity와 supplemental entity

- Decision: feature, screen, flow, spec, verification은 기존 원본에서
  registry를 파생하고 need/design/api/data/test만 relation 파일의
  `entities`로 보충할 수 있다.
- Rationale: 기존 진실의 원천을 복사하지 않으면서 외부 산출물도 연결한다.
- Alternatives: 모든 entity를 relation 파일에 재선언 — drift 위험으로 기각.

## D5. 사이트맵과 flow 계약 분리

- Decision: 화면 계층은 기존 sitemap, 행동·분기는 `user-flows.json`이 소유한다.
- Rationale: hierarchy와 행동 graph의 validation·표현·소유권이 다르다.
- Alternatives: sitemap node에 flow step 삽입 — 파일 역할 혼합으로 기각.

## D6. fail-open 수준

- Decision: 파일 전체 구조가 깨지면 해당 원본을 null로 처리하고, 개별
  entity/link/flow 오류는 해당 항목만 제외한 뒤 경고한다.
- Rationale: 기존 hub 가용성과 가능한 유효 데이터 활용을 함께 보장한다.
- Alternatives: 첫 오류에 전체 빌드 실패 — 기존 007 무중단 계약 위반.

## D7. cycle 처리

- Decision: flow cycle은 retry/복귀 흐름일 수 있으므로 soft warning으로
  유지하고 렌더한다. broken next만 해당 edge를 제외한다.
- Rationale: cycle 자체를 오류로 보면 정상적인 반복 UX를 표현할 수 없다.
- Alternatives: DAG 강제 — 실제 user flow 표현력 부족으로 기각.

## D8. 관계도 렌더링

- Decision: 외부 graph library 없이 DOM swimlane + 선택 node 중심 edge
  강조 + 텍스트 관계 목록을 제공한다.
- Rationale: 단일 정적 HTML·외부 의존성 0과 키보드 접근성을 유지한다.
- Alternatives: SVG 전체 edge layout — 수백 node에서 복잡하고 text fallback이 별도 필요.

## D9. verification evidence

- Decision: `verification.md`의 Markdown 체크박스를 evidence로 계산한다.
  파일 부재 또는 체크박스 0개는 `미기록`, 일부 미완료는 coverage 비율로 표시한다.
- Rationale: 현재 durable evidence 패턴을 재사용하고 완료를 추측하지 않는다.
- Alternatives: e2e stamp만 사용 — 수동 acceptance와 열린 항목을 표현하지 못함.

## D10. done gate

- Decision: 자동 `in-review → done` 제안은 task 100%, verification 100%,
  `open_decisions` 0건을 모두 요구한다. 수동 전이는 기존 명령으로 가능하다.
- Rationale: 자동화만 보수적으로 만들고 사람의 명시적 판단은 차단하지 않는다.
- Alternatives: task 또는 e2e stamp 단독 — 불완전한 검수의 자동 완료 위험.

## D11. 사용자 소유 데이터

- Decision: 구현·테스트는 fixture를 사용하고 현재 작업트리의 `data/`는 건드리지 않는다.
- Rationale: 현재 파일은 미추적 사용자 변경이며 샘플 제거/교체 권한이 없다.
- Alternatives: 실제 IA로 자동 교체 — 사용자 데이터 소유권 위반.

