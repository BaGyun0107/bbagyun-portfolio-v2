# Tasks: 기능정의서 사이트맵 보드 + 사이트맵 선행 플로우

**Input**: Design documents from `/specs/007-sitemap-board/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: TDD 요청됨 — 각 구현 태스크 앞에 실패하는 테스트 태스크 배치.

**Organization**: 유저 스토리 단위 독립 구현/검증.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

**Purpose**: 테스트 픽스처 준비

- [x] T001 [P] 사이트맵 테스트 픽스처 추가 — `tests/fixtures/`에
      유효 사이트맵(surface 3종·children·aliases), 스키마 위반본,
      매핑용 기능정의 행 샘플 (기존 fixtures 컨벤션 준수)

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 스키마 + 스캐너 + 매핑 헬퍼 — 모든 스토리의 공통 기반

**⚠️ CRITICAL**: 이 단계 완료 전 스토리 작업 시작 금지

- [x] T002 실패 테스트 작성: 사이트맵 스캔/검증 —
      `tests/feature-hub-scan-sitemap.test.mjs` (유효 통과, 필수 키
      누락, surface key 비표준, node id 중복, alias 충돌 경고+선선언
      우선, 파일 부재/파싱 실패 시 null+경고 반환)
- [x] T003 스키마 진실의 원천 신설 —
      `.harness/config/sitemap-schema.json` (data-model.md 필드/규칙)
- [x] T004 스캐너 구현 → T002 green —
      `.harness/scripts/docs/lib/scan-sitemap.mjs`
      (`scanSitemap(root) -> { sitemap|null, warnings[] }`)
- [x] T005 실패 테스트 작성: 매핑/파생 헬퍼 —
      `tests/feature-hub-sitemap-merge.test.mjs` (Area→id/aliases
      정확 일치 배치, 미배치 버킷, 0건 노드 유지, sitemap null 시
      user/admin 2그룹 파생, 빈 노드/미배치 카운트)
- [x] T006 매핑/파생 헬퍼 구현 → T005 green —
      `.harness/scripts/docs/lib/merge-sitemap.mjs`
      (contracts/sitemap-schema.md 4절 계약)
- [x] T007 [P] `data/` project-owned 3경로 정합성 확인·갱신 —
      `.harness/scripts/setup/prune-stale.mjs`,
      `generate-manifest.mjs`, 셸 fallback, 정책 문서에서 `data/`
      분류 확인, 누락 시 갱신 + 테스트 고정 (research D6)

**Checkpoint**: 기반 완료 — 스토리 병렬 진행 가능

## Phase 3: User Story 1 - 사이트맵 보드 기본 화면 (Priority: P1) 🎯 MVP

**Goal**: 기능정의서 탭 기본 화면을 보드(요약 바+트리+카드)로 재구성,
기존 표는 토글 보조 뷰. 사이트맵 파일 없이(파생 모드) 동작.

**Independent Test**: quickstart.md 2절 — sitemap.json 없는 상태에서
`mise run docs:build` 후 보드 렌더 + 표 토글 확인.

- [x] T008 [US1] 실패 테스트 작성: 보드 마크업 —
      `tests/feature-hub-render.test.mjs` 확장 (요약 바
      `data-summary-*`, 트리 `data-sitemap-node`, 화면별 카드 섹션,
      "표로 보기" 토글, 기존 `sitemapModal` 마크업 부재)
- [x] T009 [US1] 보드 렌더 구현 —
      `.harness/scripts/docs/lib/render-hub.mjs` (기본 뷰 보드: 요약
      바 숫자 클릭 필터, 트리 건수 뱃지/0건 회색, 카드=기능명+Phase+
      처리/검토+한 줄 요약, 카드 클릭 시 기존 상세 재사용; 파생 모드
      데이터로 동작)
- [x] T010 [US1] 표 토글 + 모달 제거 —
      `.harness/scripts/docs/lib/render-hub.mjs` (`viewMode` 상태,
      필터 상태 보드/표 공유, 왕복 시 유지, 사이트맵 모달 코드 삭제)
      → T008 green
- [x] T011 [P] [US1] 보드 레이아웃 스타일 —
      `.harness/scripts/docs/templates/hub.css` (요약 바, 2단 레이아웃,
      트리, 카드, 회색 0건 노드, 토글 버튼)
- [x] T012 [US1] 수동 검증 — quickstart.md 2절 실행 + 5절(UI 확인)
      체크리스트 전 항목 통과를 verification 기록에 기재 (동적 UI
      동작은 정적 렌더 테스트로 못 잡으므로 이 기록이 필수 증거)

**Checkpoint**: US1 = 배포 가능한 MVP (기존 프로젝트 즉시 개선)

## Phase 4: User Story 2 - 사이트맵 선행 확정 모드 (Priority: P2)

**Goal**: 확정 `data/sitemap.json` 기반 렌더(서피스 3종·0건 회색·
미배치 버킷) + 빌드 힌트 + normalizer 0단계.

**Independent Test**: quickstart.md 3절 — 샘플 사이트맵 복사 후
빌드하여 확정 모드 렌더와 힌트 확인.

- [x] T013 [US2] 실패 테스트 작성: 빌드 통합 —
      `tests/feature-hub-sitemap-build.test.mjs` 신설 (HUB_ROOT 픽스처
      로 build-hub 실행: DATA.sitemap 주입, stderr 힌트 `미배치 N건`
      `빈 화면 노드 N개`, exit 0)
- [x] T014 [US2] 빌드 배선 구현 → T013 green —
      `.harness/scripts/docs/build-hub.mjs` (scanSitemap 연결,
      DATA.sitemap 주입, merge-sitemap 카운트로 힌트 출력)
- [x] T015 [US2] 실패 테스트 작성: 확정 모드 렌더 —
      `tests/feature-hub-render.test.mjs` 확장 (서피스 3종 트리
      마크업, aliases 매칭 반영, 미배치 버킷이 트리 최하단, 0건 노드
      회색 클래스)
- [x] T016 [US2] 확정 모드 트리 렌더 구현 → T015 green —
      `.harness/scripts/docs/lib/render-hub.mjs` (DATA.sitemap 존재 시
      서피스 3종 트리, aliases 매칭, 미배치 버킷 트리 최하단, 필터
      연동)
- [x] T017 [US2] 실패 테스트 작성: 스킬 계약 —
      `tests/feature-definition-normalizer-skill.test.mjs` 확장
      (0단계 문구, `data/sitemap.json` 산출물 등재, feature-hub
      SKILL.md sitemap 소유권/힌트 문구)
- [x] T018 [US2] normalizer 0단계 추가 → T017 green —
      `.harness/skills/codi-feature-definition-normalizer/SKILL.md`
      (초안 제시→사용자 확인→저장→Area 정규화, 반복 허용)
- [x] T019 [P] [US2] feature-hub 스킬 규칙 추가 —
      `.harness/skills/codi-feature-hub/SKILL.md` (sitemap 진실의
      원천/사람 소유, 파생 모드, 힌트 3종, 하지 말 것 갱신)
- [x] T020 [US2] 수동 검증 — quickstart.md 3절 실행, verification 기록

**Checkpoint**: 선행 플로우 + 확정 모드 완성

## Phase 5: User Story 3 - fail-open 무중단 (Priority: P3)

**Goal**: 사이트맵 부재/손상 시 빌드 성공 + 파생 모드 렌더 + 안내
힌트 — 기존 프로젝트 무중단 보증.

**Independent Test**: quickstart.md 2절(부재)·4절(위반) — 두 경우 모두
exit 0 + 파생 모드 렌더.

- [x] T021 [US3] 실패 테스트 작성: fail-open 통합 —
      `tests/feature-hub-sitemap-build.test.mjs` 확장 (부재 시
      `사이트맵 미정의` 힌트+파생 모드 렌더, 스키마 위반 시 경고+
      파생 모드 렌더, 두 경우 exit 0)
- [x] T022 [US3] fail-open 경로 마감 → T021 green —
      `.harness/scripts/docs/build-hub.mjs`,
      `.harness/scripts/docs/lib/scan-sitemap.mjs` (경고 문구 확정,
      파생 모드 전환 보증)
- [x] T023 [US3] 수동 검증 — quickstart.md 4절 실행, verification 기록

**Checkpoint**: 하위 호환 보증 완료

## Phase 6: Polish & Cross-Cutting

- [x] T024 [P] `CHANGELOG.md`에 기능 항목 추가 (한국어 규칙)
- [x] T025 전체 검증 — `npm test` 전체 green +
      `mise run docs:build` 실행 증거 + `node
      .harness/scripts/checks/rule-check.mjs` 통과 (스킬/규칙 정합)
- [x] T026 `mise run feature:status:sync` 실행, deterministic 인접
      전이만 `--apply` (CLAUDE.md 마무리 규칙)
- [x] T027 `specs/007-sitemap-board/status.yaml` 작성/갱신 (기능 허브
      대시보드 반영)

## Phase 7: Post-review Implementation Decision Record

- [x] T028 심층 조사와 현재 구현 증거를
      `implementation-basis.md`에 정리하고 사실·해석·권고를 구분
- [x] T029 후속 구현 대안, 권장 순서, 결정 게이트, 검증 기준을 기록하고
      `research.md`와 `plan.md`에서 판단 문서를 연결
- [x] T030 문서 링크·출처·미결정 항목·저장소 상태를 검증하고 결과 기록

## Dependencies

- Phase 2 → 모든 스토리의 선행 조건 (T002→T004, T005→T006 TDD 순서)
- US1(Phase 3)은 T006(파생 헬퍼)에 의존, scan-sitemap(T004)에는
  비의존 — 파생 모드만으로 완결
- US2는 T004+T006+US1의 렌더 뼈대(T009~T010)에 의존
- US3는 T004(널 반환)+T014(빌드 배선)에 의존 — US2 이후 권장
- Polish는 전 스토리 완료 후

## Parallel Execution Examples

- Phase 2: T007(project-owned 정합)은 T002~T006과 병렬 가능
- US1: T011(hub.css)은 T009~T010과 병렬 가능
- US2: T019(feature-hub SKILL.md)는 T017~T018과 병렬 가능
- 스토리 간: US1 완료 후 US2와 US3 테스트 작성은 병렬 착수 가능

## Implementation Strategy

- **MVP = US1** (Phase 1~3): 사이트맵 파일 없이도 모든 기존 프로젝트의
  기능정의서 가독성이 즉시 개선된다. 여기까지가 배포 가능한 1차 증분.
- 2차 증분 = US2 (선행 플로우 + 확정 모드), 3차 = US3 (fail-open
  통합 마감).
- 각 구현 태스크는 대응 실패 테스트가 red인 것을 확인한 뒤 시작한다
  (superpowers test-driven-development).
- e2e 게이트: 이 기능은 앱 사용자 플로우가 아닌 하네스 내부 도구이므로
  `touches-user-flow` 마커는 `no` 유지. 검증은 T025의 유닛/통합 +
  quickstart 수동 확인으로 충분.
