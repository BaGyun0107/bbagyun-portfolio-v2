# Data Model: 기능정의서 탭 데이터 소스 전환

Phase 1 산출물. 이 기능이 다루는 데이터 엔티티와 그 형태를 정의한다.
새 스키마를 만들지 않고 기존 `feature-definition-schema.json`을 재사용한다.

## 엔티티

### 1. 기능정의 행 (Feature Definition Row)

기능정의 마스터 테이블의 한 행. key는 스키마의 `canonicalFields[].key`.

- **필수 필드**: `Row_ID`, `Title` (스키마 `requiredFields`).
- **선택 필드**: 나머지 canonical 필드(Master_Group, Record_Type, Function_Type,
  Area, Actor, Surface, Phase_Suggestion, Status, Decision_Level, Change_Type,
  Change_Target, Change_Summary, Why, Used_In, Admin_Dependency,
  Policy_Dependency, Decision_Question, Source 등).
- **정규화 규칙**: 소스 행에 없는 canonical 필드는 빈 문자열로 채운다. 스키마에 없는
  추가 필드는 무시한다.

### 2. 정규화 기능정의 소스 (Normalized Feature Definition Source)

저장소 루트 `data/feature-definitions.json`. 선택적(없을 수 있음).

허용 형태 두 가지:
- 배열: `[ {행}, {행}, ... ]`
- 객체: `{ "rows": [ {행}, ... ] }` (그 외 최상위 메타 필드는 무시)

### 3. serviceDefinition 모델 (렌더러 소비 계약 — 무변경)

scanner가 반환하고 렌더러가 소비하는 형태. 이 계약은 유지된다.

```text
{
  sourcePath: string,                 // 읽은 소스 경로(없으면 규약 경로 또는 '')
  columns:    [[key, label, desc]],   // SERVICE_DEFINITION_COLUMNS (스키마 파생)
  rows:       [{ <canonical key>: string }],
  warning:    string                  // 정상이면 ''
}
```

## 상태/전이

해당 없음. 이 기능은 읽기 전용 스캐너이며 상태 전이가 없다.

## 검증 규칙 (spec FR 대응)

| 규칙 | 근거 FR |
| --- | --- |
| 소스 부재 → rows 빈 배열 + warning, 빌드 성공 | FR-004 |
| 손상/구조 불일치 → rows 빈 배열 + warning, 빌드 성공 | FR-006 |
| 정상 → canonical 필드로 정규화(누락은 빈 값) | FR-001, FR-002 |
| columns는 스키마에서 파생, 중복 정의 금지 | FR-002 |
| 로컬 절대경로 참조 없음 | FR-007, SC-004 |
