# Verification: 기능정의서 탭 데이터 소스 전환

**Date**: 2026-07-10 | **Feature**: [spec.md](./spec.md)

## 구현 요약

기능정의서 탭 소스를 STICKY v1 HTML 하드코딩 → 저장소 루트
`data/feature-definitions.json`으로 전환. serviceDefinition 모델 계약
`{ sourcePath, columns, rows, warning }`은 유지하고 scanner 내부만 교체.

**변경 파일:**
- `.harness/scripts/docs/lib/scan-service-definition.mjs` — HTML `const DATA` 정규식
  파싱 제거, JSON(배열/`{rows}`) 읽기 + canonical 정규화로 교체. STICKY 기본경로 상수를
  저장소 루트 `data/feature-definitions.json`으로 대체.
- `.harness/scripts/docs/build-hub.mjs` — `SERVICE_DEFINITION_HTML` env 우회 + STICKY
  절대경로 fallback 제거, 규약 경로로 호출.
- `tests/feature-hub-service-definition.test.mjs` — HTML 케이스 → JSON 소스 8케이스 재작성.
- `tests/feature-hub-no-hardcoded-path.test.mjs` — 신규(정적 하드코딩 부재 단언).
- `tests/fixtures/feature-hub/feature-definitions.{valid,broken,object}.json` — 신규 fixture.
- `docs/harness-overview.md` — 기능정의서 탭 설명을 새 소스로 갱신(T023).
- `.harness/skills/codi-feature-definition-normalizer/SKILL.md` — "adapter 필요" 문구를
  "직접 소비" 안내로 갱신(T024).

**무변경(계약 유지):** `render-hub.mjs`, `feature-definition-schema.mjs`,
`feature-definition-schema.json`.

## 검증 실행 기록

### 테스트 (TDD)

| 단계 | 명령 | 결과 |
| --- | --- | --- |
| Baseline | `npm test` | 239 pass / 0 fail |
| RED | `node --test tests/feature-hub-service-definition.test.mjs tests/feature-hub-no-hardcoded-path.test.mjs` | 11 tests / 3 pass / **8 fail** (구현 전) |
| GREEN (scanner) | 위와 동일 | 11 pass / 0 fail (구현 후) |
| 회귀 전체 | `npm test` | **248 pass / 0 fail** |

### quickstart 검증 (docs:build end-to-end)

| 검증 | 시나리오 | 결과 |
| --- | --- | --- |
| 1 | 정상 소스 → 기능정의서 탭 렌더 | "기능정의 2건", `docs/index.html`에 `ADD-U2-009` 렌더 확인 |
| 2 | 소스 부재 → 빌드 성공 | exit 0, "기능정의 0건", 다른 탭 정상 |
| 3 | 손상 JSON → fail-open | exit 0, "parse failed" 경고 + "기능정의 0건" |
| 5 | 정적 검색 | `codi-STICKY-v1` 0건, `SERVICE_DEFINITION_HTML` 0건 (`.harness/scripts/docs`) |

임시 `data/feature-definitions.json`은 검증 후 삭제(커밋 대상 아님), `docs/index.html`은
소스 없는 상태로 복원.

## 적대적 검증 (multi-agent workflow)

4개 차원 독립 검증 + major 발견 적대적 재확인:

| 차원 | 판정 |
| --- | --- |
| contract-coverage (8케이스 커버) | **pass** |
| contract-boundary (계약 유지·런타임 안전) | **pass** |
| e2e-render (US1 실렌더) | **pass** |
| docs-skill-parity | issues → T023/T024로 해소 완료 |

발견된 문서/스킬 불일치 2건(major T023, minor T024)은 모두 해소했고, 코드 결함은 0건.

## Success Criteria 대응

- **SC-001** 정상 소스 100% 표시: ✅ (검증 1)
- **SC-002** 소스 부재 빌드 성공: ✅ (검증 2)
- **SC-003** 손상 소스 fail-open: ✅ (검증 3)
- **SC-004** 로컬 절대경로 0건: ✅ (검증 5)
- **SC-005** 정상/부재/손상 자동 테스트: ✅ (8케이스 + 정적 테스트)
- **SC-006** 회귀 없음: ✅ (248 pass, 기존 feature-hub 테스트 불변)

## specs 자동 반영 (US4, 2026-07-10 후속)

- **소스 부재 파생**: `data/feature-definitions.json` 없는 상태에서 `mise run docs:build`
  → "기능정의 3건"(specs 001/002/003 파생), 각 행 `Source=spec`, `Row_ID`=spec id,
  Title/Surface/Phase/Status가 status.yaml에서 매핑됨, warning 없음, exit 0. ✅
- **동기화 확인**: 기능현황 탭(3건)과 기능정의서 탭(3건)이 같은 기능 집합을 표시. ✅
- **id 병합**: `Row_ID`=spec id인 normalizer 행은 우선하고 빈 컬럼만 fill-in, 중복
  행 없음 — `tests/feature-hub-merge-service-definition.test.mjs` 7 tests PASS. ✅
- **회귀 없음**: 전체 스위트 259 pass (기존 render/service-definition/no-hardcoded-path
  불변). ✅
- **렌더러/탭 UI 불변**: 출력 schema(columns/rows) 동일, `render-hub.mjs` 미변경. ✅

## top-down 중복 방지 (US5, 2026-07-10 후속)

- 유사 판별 순수함수 `detectDuplicateSuspects` — 숫자 접두사/ id 접두사/ Title
  유사 세 신호, `tests/feature-hub-duplicate-guard.test.mjs`로 검증(9 tests PASS). ✅
- `docs:build` 3층 경고: 원장 `003-feat-def` + spec `003-feature-definition-source`
  케이스에서 `▸ 중복 의심` 출력, 빌드 성공(비차단). ✅
- `feature:seed-check "로그인"`: 유사 원장 `010-login` 안내, "결제"는 새 id 허용. ✅
- Claude/Codex 공통(mise/노드 스크립트, 추가 훅 불필요). ✅

## 결론

모든 FR/SC 충족. 코드·테스트·문서·스킬 정합성 확인 완료. spec 003 구현 종료.
US4(specs 자동 반영), US5(top-down 중복 방지)까지 후속 반영 완료.

## 재검증 체크리스트 (2026-07-18)

- [x] 기능정의 데이터 소스 스캔·투영(신형 카탈로그 수용 포함) —
  `tests/feature-hub-service-definition.test.mjs` 통과
- [x] spec 병합·중복 제거 — `tests/feature-hub-merge-service-definition.test.mjs` 통과
- [x] 중복 가드·seed-check(ID 일치 포함) —
  `tests/feature-hub-duplicate-guard.test.mjs` 통과
- [x] `mise run docs:build` exit 0 + `mise run planning:check` 통과

참고: legacy 21필드 행은 012에서 신규 작성 계약에서 은퇴(입력 호환만
유지) — 003의 데이터 소스 계약은 카탈로그 단일 모델로 승계됐다.
