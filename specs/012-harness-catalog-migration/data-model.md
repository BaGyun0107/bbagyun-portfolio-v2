# Data Model: 하네스 카탈로그 전환

## health 분류

- `SOURCE_HEALTH_CODES` (source.health를 invalid로 만드는 부류):
  `workspace-source-invalid`, `workspace-reconcile-failed` 등 원본
  파싱·가용성·경로 안전 문제.
- 그 외 전부 advisory — 모델의 `health`/`workItemHealth`에 그대로
  남고 노출 경로 불변. 분류 밖 신규 코드는 advisory 기본값.
- `source.health` 판정: `health.some(code ∈ SOURCE_HEALTH_CODES)`.

## 하네스 카탈로그 항목 (`data/feature-definitions.json`)

- `id`: 기존 spec ID 그대로 (예: `011-definition-later-path`) — 불변.
- `title`/`summary`: status.yaml title 기반.
- `actor`: `developer` 또는 `operator`(팀 내부 어휘 — actor-surface
  힌트 표준 목록 밖이라 침묵, 의도된 fail-open).
- `definitionStatus`: spec done → `approved`, 그 외 → `draft`.
- `placements`: `data/feature-relations.json`의 appears-on 링크를
  screenId로 옮김(첫 항목 primary, 나머지 support).
- `screenIds`: placements와 동일 집합(legacy 미러 규칙 준수).

## 열린 결정 (`data/decisions.json`)

- `DEC-HARNESS-DETAIL-BACKFILL` 1건: status `open`, owner `product`,
  11개 기능 상세 백필 계획. 기능별 남발 금지(FR-004).

## legacy 행 감지 힌트

- 빌드가 `data/feature-definitions.json` 항목 중 `Row_ID`형(legacy)
  행을 발견하면 힌트: `legacy 기능정의 행 N건 — normalizer로 카탈로그
  변환을 권장` (fail-open, 렌더/스캔은 유지).

## 제거 후 불변 조건

- 생성 페이지(docs/index.html, planning.html) 산출은 render-hub 제거
  전후 동일해야 한다(프로덕션 참조 0의 검증).
- canonical 스냅샷(11 기능/84 링크)은 카탈로그 도입 후에도 동일 집합.
