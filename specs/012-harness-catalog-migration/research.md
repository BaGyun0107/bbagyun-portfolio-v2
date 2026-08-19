# Research: 하네스 카탈로그 전환 + legacy 잔재 제거

clarify 확정(카탈로그 우선, 즉시 제거+정리 스윕, 코드 부류 분류)을
구현 지점으로 구체화한다. 조사 근거는 2026-07-17 세션의 grep/런타임
확인이다.

## D1. advisory/source health 분리 지점

- **Decision**: `loadPlanningWorkspace`의 단일 `health` 배열을 유지하되
  코드 부류 집합(SOURCE_HEALTH_CODES: workspace-source-invalid,
  workspace-reconcile-failed 등 가용성 문제)만 `source.health` 판정에
  사용한다. 나머지(definition-incomplete, feature-detail-missing,
  work-item-*, legacy-* 등)는 advisory로 분류되어 모델에 그대로 남고
  기존 노출 경로(운영·고급, 힌트)는 불변이다. 분류 밖 신규 코드는
  기본 advisory.
- **Rationale**: 생성점 수십 곳을 고치지 않는 최소 침습. 데모 seeded
  health 노출 회귀 없음.
- **Alternatives**: severity 필드 전면 도입(반경 큼), 화이트리스트
  (고장 은폐 위험) — clarify에서 기각.

## D2. 하네스 카탈로그 구성

- **Decision**: `data/feature-definitions.json`에 canonical 11개
  기능을 spec ID 그대로 카탈로그화한다. title/summary는
  status.yaml에서, actor는 내부 도구 특성상 팀 어휘(개발자/운영자 —
  actor-surface 힌트 목록 밖이라 침묵), placements는
  data/feature-relations.json의 appears-on 링크를 그대로 옮긴다.
  definitionStatus는 spec status가 done이면 approved, 아니면 draft.
  `data/decisions.json`에 백필 열린 결정 1건(DEC-HARNESS-DETAIL-BACKFILL)
  을 기록한다.
- **Rationale**: spec ID 재사용으로 관계·추적성·spec-scan 투영이
  무변경. appears-on 재사용으로 배치 정합이 이미 검증된 값.
- **Alternatives**: FEAT-* 신규 발급(관계 재작성 + canonical 테스트
  재작성 — 이득 없음).

## D3. 제거 인벤토리 (참조 조사 결과)

| 항목 | 근거 | 처리 |
| --- | --- | --- |
| `.harness/scripts/docs/lib/render-hub.mjs` | 프로덕션 import 0 (테스트 2파일만) | 제거. 단, 그 테스트가 검증하는 살아있는 공유 로직(사이트맵 조직도/구조 보기 등)은 현행 렌더러(render-planning-page) 대상 테스트로 이식 후 제거 |
| `tests/feature-hub-render.test.mjs` | render-hub 전용 | 살아있는 검증 이식 후 제거 |
| `tests/planning-sitemap-render.test.mjs` | renderHub 경유 사이트맵 검증 | 현행 렌더러 대상으로 이식 후 제거 |
| `examples/community-app/expected/hub-snapshot.json` | 소비처 0 (tests/scripts/mise grep) | 제거 |
| `docs/superpowers/specs/*.md` 4건, `docs/superpowers/plans/*.md` 3건 | 010 설계 초안(역사 기록, git history 보존) | 제거 + specs/010 spec.md의 Design Basis 링크를 텍스트 주석으로 갱신 |
| `.harness/scripts/docs/templates/hub.css` | 현행 렌더러 2곳 사용 | **유지** |
| `registry.json` 경로(merge-registry) | 계약상 선택적 seed 유지 | **유지** |

- 제거 게이트: 항목별로 저장소 전체 grep 참조 0 확인(문서 링크 포함) →
  이식 → 삭제 → npm test + docs:build 산출 불변 확인.

## D4. legacy 행 신규 계약 제거

- **Decision**: normalizer SKILL.md의 Layer 2(21필드 산출) 절을 제거해
  카탈로그 전용 산출로 만들고, 빌드는 `data/feature-definitions.json`에
  legacy 행(Row_ID형)이 존재하면 "normalizer로 카탈로그 변환" 힌트를
  낸다. 내부 플러밍(catalogAsLegacyRows 투영, 사이트맵 힌트 계산)은
  내부 표현으로 유지하되 skill/가이드 문서에서 legacy 표 서술을
  정리한다. scan-service-definition의 legacy 행 수용은 fail-open
  하위호환으로 유지(단 신규 계약 아님을 명시).
- **Rationale**: 사용자의 즉시 제거 결정 + fail-open 원칙의 교차점 —
  화면·계약에서 제거하고, 파싱은 깨뜨리는 대신 변환을 유도한다.

## D5. 상세 백필 열린 결정

- **Decision**: 기능별 11건이 아니라 1건(DEC-HARNESS-DETAIL-BACKFILL,
  owner: product)만 기록 — 열린 결정 힌트가 11줄로 도배되는 것을 막고
  (FR-004), 백필 진행은 결정 본문에서 관리한다.
