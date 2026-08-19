# Contract: scanServiceDefinition 스캐너

이 기능이 바꾸는 유일한 인터페이스. import 경계(파일 경로·함수명·반환 형태)는
유지하고 내부 소스 읽기만 교체한다.

## 인터페이스

- **모듈**: `.harness/scripts/docs/lib/scan-service-definition.mjs`
- **export**: `scanServiceDefinition(sourcePath?) -> Model`
- **export**: `SERVICE_DEFINITION_COLUMNS` (스키마 파생, 유지)

## 입력

- `sourcePath` (선택): 소스 파일 경로. 생략 시 저장소 규약 경로
  `data/feature-definitions.json`을 사용한다.
- **제거**: STICKY 절대경로 기본값, `DEFAULT_SERVICE_DEFINITION_PATH` 상수의 STICKY
  경로, 그리고 build-hub의 `SERVICE_DEFINITION_HTML` 환경변수 우회.

## 출력 (Model — 렌더러 소비 계약, 무변경)

```text
{
  sourcePath: string,
  columns:    [[key, label, desc], ...],   // SERVICE_DEFINITION_COLUMNS
  rows:       [{ <canonical key>: string }, ...],
  warning:    string                        // 정상이면 ''
}
```

## 동작 계약 (테스트 대상)

| 입력 | rows | warning |
| --- | --- | --- |
| 유효한 배열 JSON | 각 행을 canonical 필드로 정규화 | `''` |
| 유효한 `{rows:[...]}` 객체 JSON | 위와 동일 | `''` |
| 파일 없음 | `[]` | not-found 취지 |
| 파싱 불가(JSON syntax error) | `[]` | parse-failed 취지 |
| 배열/`rows` 아닌 구조 | `[]` | 구조 경고 |
| 빈 배열 | `[]` | `''` (정상) |
| 행에 canonical 필드 일부 누락 | 누락은 빈 문자열로 채움 | `''` |
| 행에 스키마 외 추가 필드 | 무시 | `''` |

## 불변식

- `columns`는 항상 `SERVICE_DEFINITION_COLUMNS`와 동일(어떤 입력에서도).
- 어떤 입력에서도 예외를 던지지 않는다(fail-open).
- 반환 객체는 STICKY/로컬 절대경로를 어떤 필드에도 담지 않는다.

## build-hub 배선 계약

- `build-hub.mjs`는 `scanServiceDefinition()`을 인자 없이(또는 규약 경로로) 호출한다.
- 반환 `warning`이 있으면 stderr로 출력(기존 동작 유지).
- `serviceDefinition.rows.length`를 생성 로그의 "기능정의 N건"으로 보고(FR-003).
