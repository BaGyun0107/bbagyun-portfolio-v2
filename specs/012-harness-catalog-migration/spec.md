# Feature Specification: 하네스 카탈로그 전환 + legacy 기능정의서 표 은퇴

**Feature Branch**: `012-harness-catalog-migration`

**Created**: 2026-07-17

**Status**: Draft

**Input**: User description: "하네스 자신이 자기 기능을 FeatureDefinition
카탈로그로 관리하고, 문서 허브의 legacy 21필드 표를 은퇴시켜 이중
모델을 해소한다. spec ID 재사용, 상세 처리 전략, advisory health 구분,
legacy 하위호환 유지. include test tasks (TDD)"

## Clarifications

### Session 2026-07-17

- Q: 11개 기능 상세(11그룹) 처리는? → A: 카탈로그 우선 도입, 상세는
  '정의 불완전' advisory로 노출하고 소급 작성 계획을 열린 결정 1건으로
  기록한다.
- Q: legacy 21필드 표 은퇴 방식은? → A: **즉시 제거**. 조사 결과 legacy
  표는 현재 생성 페이지에 렌더되지 않으며(010 분리에서 이미 화면 제거),
  실체는 죽은 렌더러(render-hub.mjs)와 잔재다 — 죽은 코드·미사용
  파일을 물리 제거하고, legacy 행 입력은 신규 작성 계약에서 제거한다.
- 사용자 지시(2026-07-17): 현재 구조에 맞지 않는 구 문서·사용하지 않는
  파일은 대부분 제거한다 — 낡은 잔재가 사람과 AI의 환각(잘못된 근거
  참조)을 유발하기 때문. 제거는 참조 0 확인(코드·테스트·문서 grep) 후
  수행한다.
- Q: invalid와 advisory 구분 방식은? → A: 코드 부류 기반 — 파싱 실패·
  unsafe 경로 등 원본 가용성 코드는 source invalid, 정의 품질·연결
  품질·미등록 코드는 advisory. 분류에 없는 새 코드는 기본 advisory로
  두어 고장 오탐보다 힌트 누락을 택한다.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 계획 품질 힌트가 워크스페이스를 고장으로 표시하지 않는다 (Priority: P1)

카탈로그에 상세가 아직 없는 기능이 있어도, 워크스페이스 원본 상태는
"사용 가능"으로 남고 정의 품질 문제는 별도의 안내(advisory)로 보인다.

**Why this priority**: 원본 파싱 실패(진짜 고장)와 계획 품질
힌트(할 일)가 한 축에 섞여 있으면, 카탈로그를 점진 도입하는 순간
워크스페이스 전체가 invalid로 표시되어 전환 자체가 막힌다. 다른 두
스토리의 전제 조건이다.

**Independent Test**: 상세 없는 카탈로그 항목을 가진 워크스페이스를
빌드해 source 상태가 available로 유지되고, 정의 품질 항목은 advisory로
구분 노출되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 상세 없는 카탈로그 항목, **When** 워크스페이스를 로드하면,
   **Then** source 상태는 available이고 `feature-detail-missing`은
   advisory 목록에 나타난다.
2. **Given** 파싱 불가능한 원본 JSON, **When** 로드하면, **Then**
   source 상태는 invalid로 유지된다(기존 동작 보존).
3. **Given** 데모 워크스페이스의 의도된 정의 불완전 시드, **When**
   빌드하면, **Then** 기존 health 노출(운영·고급, expected snapshot)이
   회귀 없이 유지된다.

---

### User Story 2 - 하네스가 자기 기능을 카탈로그로 관리한다 (Priority: P1)

하네스 팀이 Planning Hub에서 하네스 자신의 기능 정의(카탈로그)와 구현
현황을 데모가 아닌 실제 워크스페이스로 본다. 기존 spec ID·관계·추적성·
spec 유래 현황은 그대로 유지된다.

**Why this priority**: 이중 모델 해소의 실체다. 하네스가 자기 도구를
자기 계획에 쓰는 것(dogfooding)이 downstream 신뢰의 근거가 된다.

**Independent Test**: 실제 저장소 빌드에서 harness-internal이 planning
경로로 로드되어 카탈로그 기능들이 기능 정의 화면에 나오고, spec 유래
현황(진행률·상태)이 기능 현황에 투영되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** spec ID를 재사용한 하네스 카탈로그, **When** 빌드하면,
   **Then** harness-internal이 planning 경로로 로드되고 기존
   canonical 관계·추적성 집계가 깨지지 않는다.
2. **Given** 카탈로그 기능과 대응 spec, **When** 기능 현황을 보면,
   **Then** spec 유래 work item(`spec-scan`)이 상태·진행률과 함께
   보인다.
3. **Given** 상세 미작성 기능, **When** 기능 정의 화면을 보면, **Then**
   정의 불완전 안내와 소급 작성 유도가 보이되 화면은 정상 동작한다.

---

### User Story 3 - legacy 잔재의 즉시 제거 (Priority: P2)

죽은 렌더러·미사용 파일·구 문서가 저장소에서 사라져, 사람과 AI가 낡은
근거를 참조해 환각을 일으킬 여지가 없어진다. legacy 21필드 행은 신규
작성 계약에서 제거되고, 남은 legacy 데이터에는 카탈로그 변환 안내가
나온다.

**Why this priority**: 화면 이중성은 010에서 이미 해소됐고, 남은 위험은
"코드베이스에 존재하지만 아무도 쓰지 않는" 잔재다. 잔재는 스킬·문서·
에이전트가 잘못 참조하는 순간 실제 오류가 된다.

**Independent Test**: 제거 목록의 각 항목에 대해 저장소 전체 참조가
0임을 확인한 뒤 제거하고, 전체 테스트·게이트가 통과하는지 본다.

**Acceptance Scenarios**:

1. **Given** 프로덕션 import가 0인 구 렌더러(render-hub.mjs)와 그
   전용 테스트, **When** 제거하면, **Then** 빌드·전체 테스트·게이트가
   통과하고 생성 페이지는 변하지 않는다.
2. **Given** 소비처가 0인 미사용 파일(예: expected/hub-snapshot.json),
   **When** 제거하면, **Then** 어떤 테스트·스크립트도 깨지지 않는다.
3. **Given** legacy 21필드 행만 있는 데이터 파일, **When** 빌드하면,
   **Then** 빌드는 성공하되 "카탈로그로 변환하세요(normalizer)" 안내가
   힌트로 나온다.
4. **Given** normalizer 산출 계약, **When** 확인하면, **Then** Layer
   1(카탈로그)만 신규 작성 경로이고 legacy 행 산출 절은 제거되어 있다.

---

### User Story 4 - 구 문서·미사용 파일 정리 스윕 (Priority: P3)

기능정의/허브 도메인의 구 설계 문서와 현재 구조에 맞지 않는 문서가
정리되어, 저장소를 읽는 사람·AI가 항상 현행 정본만 만난다.

**Why this priority**: 사용자 지시 — 낡은 문서가 환각의 원천. 단, 이력
가치가 있는 기록(감사, spec)은 남기고 "설계 초안류·중복 해설류"만
정리한다.

**Independent Test**: 정리 대상 인벤토리 각 항목에 대해 참조 검사 후
제거/이관하고, 깨진 링크가 0건인지 확인한다.

**Acceptance Scenarios**:

1. **Given** 구 설계 문서 인벤토리(예: docs/superpowers 설계 초안류),
   **When** 정리하면, **Then** 현행 문서·spec에서 깨진 링크가 없고
   필요한 참조는 갱신되어 있다.
2. **Given** 정리 후 저장소, **When** 기능정의 관련 문서를 검색하면,
   **Then** 서로 모순되는 구버전 설명이 검색되지 않는다.

---

### Edge Cases

- advisory 분류 후에도 진짜 고장(JSON 파싱 실패, unsafe 경로)은 invalid
  유지 — 분류 기준이 코드로 고정되어야 한다.
- 하네스 카탈로그 도입 후 미등록 work item 경고·열린 결정 힌트가
  하네스 자신에게도 적용된다 — 소음 수준이 수용 가능한지 확인.
- canonical 스냅샷 테스트(11 기능/84 링크)는 카탈로그 도입으로 기능
  수가 달라지지 않아야 한다(spec ID 재사용이므로 동일 집합).
- legacy 행과 카탈로그 항목이 한 파일에 혼재하면? (기존 스캐너 허용 —
  deprecated 안내는 legacy 행 존재 여부로 판단)
- 데모 워크스페이스는 이 전환의 영향을 받지 않아야 한다(격리 유지).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 워크스페이스 health는 두 부류로 구분되어야 한다 — 원본
  가용성 문제(파싱 실패, unsafe 경로 등)는 source 상태를 invalid로
  만들고, 계획 품질 항목(정의 불완전, 상세 없음, 미등록 등)은 advisory
  로 노출되되 source 상태를 바꾸지 않는다.
- **FR-002**: advisory 항목은 사라지지 않고 Planning Hub(운영·고급/기능
  정의 화면)와 빌드 힌트에서 계속 보여야 한다(기존 노출 회귀 금지).
- **FR-003**: 하네스 자신의 기능 카탈로그가 workspace planningSource에
  존재해야 하며, 카탈로그 ID는 기존 spec ID를 재사용해 관계·추적성·
  spec 연결이 무변경으로 유지되어야 한다.
- **FR-004**: 카탈로그 항목은 기존 기능 집합(canonical 11개)과 동일한
  집합이어야 하며, 각 항목은 title/summary/actor/definitionStatus와
  화면 배치(placements)를 가진다. 상세 미작성은 허용되고 소급 작성
  필요가 열린 결정 1건으로 기록된다(기능별 남발 금지).
- **FR-005**: 카탈로그 도입 후 harness-internal은 planning 경로로
  로드되고, spec 유래 현황이 delivery 근거로 투영되어 기존에 보이던
  정보(상태·진행률·검증)가 손실되지 않아야 한다.
- **FR-006**: 프로덕션 참조가 0인 legacy 잔재 — 구 단일 페이지
  렌더러(render-hub.mjs)와 그 전용 테스트·템플릿, 소비처 없는 미사용
  파일 — 는 참조 0 확인 후 물리 제거한다. 제거 후 생성 페이지 산출은
  변하지 않아야 한다.
- **FR-007**: legacy 21필드 행은 신규 작성 계약에서 제거한다 —
  normalizer 산출은 카탈로그 전용이 되고, legacy 행만 있는 데이터
  파일에는 빌드가 "normalizer로 카탈로그 변환" 안내를 힌트로 낸다.
  내부 플러밍의 legacy 행 투영(사이트맵 힌트 계산 등)은 이 spec에서
  카탈로그 직접 소비로 대체하거나, 대체 불가 시 내부 표현으로만 남김을
  기록한다.
- **FR-008**: 기능정의/허브 도메인의 구 설계 문서·중복 해설 문서를
  인벤토리로 만들어 참조 검사 후 정리한다. 이력 가치가 있는 기록
  (specs/, docs/audits/)은 보존하고, 깨지는 링크는 갱신한다.
- **FR-009**: 전 과정은 fail-open이어야 하며 데모 워크스페이스의 기존
  동작·golden·테스트는 회귀 없이 유지되어야 한다.

### Key Entities

- **advisory health**: source 상태에 영향을 주지 않는 계획 품질 항목.
  기존 health 코드 중 정의 품질/연결 품질 부류가 여기 속한다.
- **하네스 카탈로그**: `spec ID = 카탈로그 ID`인 FeatureDefinition
  집합. definitionStatus는 spec 상태와 별개인 정의 lifecycle이다.
- **deprecated 안내**: legacy 행 데이터 존재 시 표에 붙는 비차단 안내.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 상세 없는 카탈로그 도입 시 워크스페이스 source 상태가
  available로 유지된다(현재 0% — 즉시 invalid).
- **SC-002**: 하네스 기능 11개가 Planning Hub 기능 정의/기능 현황
  화면에서 데모 전환 없이 보이고, spec 유래 현황 정보 손실이 0건이다.
- **SC-003**: legacy 잔재(죽은 렌더러, 미사용 golden, 구 설계 문서
  초안류)의 저장소 내 참조가 0건이 되고, 기능 정의 신규 작성 경로는
  카탈로그 단일 모델만 남는다.
- **SC-004**: 기존 전체 테스트·planning:check·데모 golden이 회귀 없이
  통과한다.

## Assumptions

- **상세 처리**: 11개 기능의 풀 11그룹 상세는 이 spec 범위가 아니다.
  카탈로그 우선 도입 + 소급 상세는 열린 결정 1건(백필 계획)으로
  기록한다. US1의 advisory 구분이 이를 안전하게 만든다.
- **은퇴 방식**: clarify에서 즉시 제거로 확정(위 세션 기록). 다운스트림
  legacy 파일은 빌드 실패가 아니라 변환 안내 힌트를 받는다(fail-open은
  유지하되 신규 계약에서는 제거).
- **advisory 분류 기준**: health 항목의 부류(코드 집합)로 판단하며,
  기본 분류는 계획 품질 코드(definition-incomplete,
  feature-detail-missing, work item 관련, 관계 품질)를 advisory로,
  파싱·경로 안전 문제를 source 문제로 둔다.
- **범위 제외**: 데모 워크스페이스 구조 변경, legacy 렌더 코드 삭제,
  다운스트림 자동 마이그레이션 도구.
