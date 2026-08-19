# Research: 기능정의서 탭 데이터 소스 전환

Phase 0 산출물. spec의 확정된 설계 방향을 구현 결정으로 구체화한다.

## R1. 소스 규약 경로

**Decision**: 저장소 루트의 `data/feature-definitions.json` 하나로 고정.

**Rationale**:
- `codi-feature-definition-normalizer` 스킬이 권장 산출물로 이미
  `data/feature-definitions.json`을 명시(SKILL.md:145). 계약이 이미 존재.
- 루트 고정 경로는 `registry.json`(루트 고정)과 같은 관례를 따라 일관적.
- 여러 후보 경로 탐색은 spec의 Out of Scope.

**Alternatives considered**:
- `docs/` 하위: 생성물 디렉터리라 소스 입력과 성격이 맞지 않음. 기각.
- 환경변수로 경로 지정: 사용자가 STICKY 환경변수 우회를 완전 제거하기로 결정. 기각.

## R2. 소스 파일 JSON 구조

**Decision**: 최상위가 기능정의 행의 배열이거나, `{ rows: [...] }` 형태의 객체.
둘 다 허용하고 배열을 우선 인식한다.

**Rationale**:
- normalizer 산출물이 순수 배열(`.json`)일 수도, 메타데이터를 감싼 객체일 수도 있음.
  두 형태를 모두 견고하게 받으면 normalizer 구현 세부에 결합하지 않음.
- 각 행은 `feature-definition-schema.json`의 canonical 필드 key를 그대로 사용
  (Row_ID, Title 등). 렌더러가 이미 그 key로 컬럼을 뽑음.

**Alternatives considered**:
- 배열만 허용: 더 단순하지만 normalizer가 메타 래핑을 붙이면 깨짐. 견고성 위해 기각.

## R3. 손상/부재 처리 (fail-open)

**Decision**: 기존 `scanServiceDefinition`의 반환 계약을 그대로 유지한다 —
`{ sourcePath, columns, rows, warning }`. 소스별 처리:
- 파일 없음 → `rows: []`, `warning`에 "not found" 취지 메시지(빈 탭, 빌드 성공).
- 파싱 불가(JSON.parse throw) → `rows: []`, `warning`에 "parse failed".
- 구조 불일치(배열/`rows` 아님) → `rows: []`, `warning`에 구조 경고.
- 정상 → 각 행을 canonical 필드로 정규화(누락 필드는 빈 문자열).

**Rationale**:
- 렌더러(`render-hub.mjs`)가 이 계약을 소비 중이므로 계약을 지키면 렌더러 무변경.
- 기존 build-hub의 fail-open 원칙과 일치.

**Alternatives considered**:
- 손상 시 throw: 전체 허브 빌드가 무너져 FR-006 위반. 기각.

## R4. STICKY 하드코딩/환경변수 제거 범위

**Decision**: 아래를 모두 제거한다.
- `scan-service-definition.mjs`의 `DEFAULT_SERVICE_DEFINITION_PATH` STICKY 절대경로.
- `build-hub.mjs`의 `process.env.SERVICE_DEFINITION_HTML || '<STICKY 절대경로>'` 배선.
- HTML `const DATA` 정규식 추출 로직(`extractRows`) — JSON 읽기로 대체되므로 불필요.

**Rationale**:
- SC-004(로컬 절대경로 정적 검색 0건), FR-007/008을 직접 충족.
- `SERVICE_DEFINITION_HTML` 참조가 남으면 우회 경로가 살아 있어 FR-008 위반.

**Alternatives considered**:
- 환경변수 하위호환 유지: 사용자가 "완전 제거" 결정. 기각.

## R5. 함수/파일 명명

**Decision**: 파일명 `scan-service-definition.mjs`와 export 함수
`scanServiceDefinition`은 유지한다(렌더러·build-hub의 import 경계). 내부 구현만 교체.

**Rationale**:
- 이름을 바꾸면 render-hub/build-hub import와 테스트까지 연쇄 변경 발생. 계약 경계를
  지키면 변경 표면이 scanner 내부로 최소화됨.
- "serviceDefinition"이라는 도메인 용어는 렌더러 모델 key로 이미 굳어 있어, 이름 변경은
  별도 리팩터로 분리하는 편이 안전(이 기능 범위 밖).

**Alternatives considered**:
- `scan-feature-definitions.mjs`로 개명: 의미상 더 정확하나 변경 표면이 커지고 회귀
  위험 증가. 이번 범위에서는 기각(향후 정리 후보로 기록).

## 미해결 사항

없음. spec의 [NEEDS CLARIFICATION] 0건, 위 R1~R5로 구현 결정 확정.
