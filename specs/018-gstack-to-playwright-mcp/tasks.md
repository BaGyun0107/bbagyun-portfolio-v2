# Tasks: GStack 전면 제거 및 Playwright MCP 대체 도입

**Input**: Design documents from `/specs/018-gstack-to-playwright-mcp/`

**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: 요청됨(TDD) — US3의 잔존 검출 테스트는 정리 구현보다 먼저(RED
확인 후 진행). data-model/contracts 없음(인프라 작업).

**Organization**: 유저 스토리별 페이즈. US1 → US2 → US3 → US4 순서가 안전
순서(대체 확보 → 실증 → 참조 제거 → 전역 삭제).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [x] T001 실행 환경 사전 점검 — mise Node 24 활성, npx 동작, `~/.codex/config.toml` 쓰기 가능 확인 (결과를 본 파일 하단 Notes에 기록)

---

## Phase 2: Foundational

없음 — 스토리 간 공유 선행 인프라가 없다. US1이 사실상의 선행 스토리다.

---

## Phase 3: User Story 1 - 양 런타임 브라우저 QA 대체 수단 확보 (P1) 🎯 MVP

**Goal**: GStack browse 없이 두 런타임에서 Playwright MCP QA 흐름이 동작.

**Independent Test**: quickstart V1 — 두 런타임에서 페이지 열기 → 조작 →
스크린샷 성공.

- [x] T002 [US1] Claude 사용자 레벨 등록: `claude mcp add --scope user playwright -- npx @playwright/mcp@0.0.79` 실행 후 `claude mcp list`로 확인
- [x] T003 [US1] `~/.codex/config.toml`에 `[mcp_servers.playwright]` 블록 추가 (command="npx", args=["@playwright/mcp@0.0.79"]) — 기존 node_repl 항목 패턴 준수
- [x] T004 [US1] Chromium 1회 설치: `npx playwright install chromium`
- [x] T005 [US1] Claude Code 세션에서 quickstart V1 흐름 검증, 결과 기록
- [x] T006 [US1] Codex 세션에서 quickstart V1 흐름 검증, 결과 기록
- [x] T007 [US1] (TDD RED) `tests/mcp-parity.test.mjs` 신설 — 등록 점검 로직(Claude `~/.claude.json` mcpServers + Codex config.toml 파싱)의 단위 테스트를 먼저 작성, 점검 스크립트 부재로 실패 확인
- [x] T008 [US1] `.harness/scripts/checks/mcp-registration-check.mjs` 구현 — 양 런타임 등록/버전 핀 상태를 판정(T007 GREEN)
- [x] T009 [P] [US1] `.harness/scripts/agent/agent-preflight.sh`에 T008 점검 호출 추가(누락 시 안내 출력, 비차단)
- [x] T010 [P] [US1] `.harness/scripts/setup/install.sh`에 최초 등록(양 런타임) 로직 추가
- [x] T011 [US1] `.harness/scripts/checks/doctor.sh`에 MCP 등록 점검 항목 추가
- [x] T012 [US1] `.harness/policies/tool-permissions.md`에 Playwright MCP 권한 우선순위와 핀 버전(0.0.79) 기록

**Checkpoint**: SC-001 충족 — MVP 성립.

---

## Phase 4: User Story 2 - PHP 프로젝트 파일럿 검증 (P2)

**Goal**: php-gnuboard5-6-32 로컬 기동 후 동일 QA 흐름 실증.

**Independent Test**: quickstart V2.

- [x] T013 [US2] php-gnuboard5-6-32 로컬 기동 — 레포 기존 로컬 구성 확인(없으면 PHP 내장 서버 + MySQL 구성), 기동 절차를 증적에 기록
- [x] T014 [US2] MCP로 QA 흐름 재현: 메인 페이지 로드 → 폼 상호작용(로그인 등 1개 흐름) → 스크린샷
- [x] T015 [US2] 증적 작성: `specs/018-gstack-to-playwright-mcp/pilot-evidence.md` (명령, 결과, 스크린샷 경로)
- [x] T016 [P] [US2] 다운스트림 프로젝트들의 CLAUDE.md에 과거 gstack 라우팅 절("## Skill routing") 주입 여부 전수 확인, 정리 대상 목록을 pilot-evidence.md에 기록

**Checkpoint**: SC-002 충족 — 전환 결정의 실증 근거 확보.

---

## Phase 5: User Story 3 - 하네스에서 GStack 흔적 제거 (P3)

**Goal**: 살아 있는 규칙/스크립트/문서에서 gstack 참조 0건 (감사 기록 제외).

**Independent Test**: quickstart V3, V4.

- [x] T017 [US3] (TDD RED) `tests/gstack-residue.test.mjs` 신설 — 허용 목록(docs/audits/**, specs/001~017/**, specs/018 자신) 외 경로에서 gstack 참조 0건 검사, 현 상태 실패 확인
- [x] T018 [P] [US3] 정책 정리: `.harness/policies/scenario-phase-routing.md`(GStack 게이트 절 제거), `agent-routing.md`, `quality-gates.md`
- [x] T019 [P] [US3] 엔트리포인트 정리: `AGENTS.md`, `CLAUDE.md` (GStack 절 제거, Playwright MCP 언급으로 대체)
- [x] T020 [P] [US3] 네이티브 미러 정리: `.claude/rules/phase-routing.md`, `.codex/rules/phase-routing.rules`
- [x] T021 [P] [US3] 설정 정리: `.harness/config/skill-triggers.json`(gstack 트리거), `.harness/manifest.json`, `.harness/lock.json`(`write-lock.mjs` 경유 재생성 확인)
- [x] T022 [P] [US3] 스크립트 정리: `.harness/scripts/checks/doctor.sh`, `setup/update-check.sh`, `setup/update.sh`, `setup/install.sh`, `setup/init-project.sh`, `agent/write-lock.mjs`
- [x] T023 [P] [US3] 문서 정리: `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `docs/harness-overview.md`, `.harness/workflow.md`, `.harness/docs/skills-guide.md`, `.harness/docs/dependency-security-manual-setup.md`
- [x] T024 [P] [US3] 공유 스킬 내 언급 정리: `.harness/skills/codi-dependency-review/SKILL.md`, `.harness/skills/codi-phase-routing/SKILL.md`
- [x] T025 [US3] `mise.toml`에서 bun 선언 제거 (제거 전 저장소 내 bun 의존 다른 용도 없음을 grep으로 확인)
- [x] T026 [US3] `.specify/memory/constitution.md` V조의 외부 도구 예시에서 GStack 갱신
- [x] T027 [US3] 재측정 계획 룰 A 후속 주석: `docs/audits/2026-08-skill-usage-recheck-plan.md` — PR #128 머지 이후 그 위에 반영(충돌 방지)
- [x] T028 [US3] `tests/harness-cli.test.mjs`의 gstack 관련 기대값 갱신, T017 GREEN 확인
- [x] T029 [US3] 품질 게이트 4종 실행: `./harness rule-check`, `./harness context-check`, `./harness doctor`, `npm test` — 전부 통과 기록

**Checkpoint**: SC-003, SC-004 충족.

---

## Phase 6: User Story 4 - 전역 GStack 설치 제거와 롤백 경로 (P4)

**Goal**: 전역 잔존 0건 + 롤백 문서. 정책 PR 머지 후, 사용자 승인 하에만.

**Independent Test**: quickstart V5.

- [x] T030 [P] [US4] 롤백 문서 작성: `.harness/docs/gstack-rollback.md` — GStack 재설치 절차 + "데이터 미복원(신규 설치)" 명시
- [x] T031 [US4] 018 변경분 PR 생성(대상: 현행 릴리스 브랜치) → **사용자 머지 대기** (AI 머지 금지)
- [x] T032 [US4] (머지 후) 삭제 대상 목록 제시 → **사용자 명시 승인** → `~/.claude/skills`의 gstack 계열, `~/.codex/skills`의 gstack 계열, `~/.gstack` 삭제
- [x] T033 [US4] quickstart V5 검증 실행, 결과를 pilot-evidence.md에 추가 기록

**Checkpoint**: SC-005 충족.

---

## Phase 7: Polish & Cross-Cutting

- [x] T034 [P] 루트 `ROADMAP.md`에 018 상태 반영
- [x] T035 `mise run feature:status:sync` 실행(모호/on-hold는 보고만)
- [x] T036 T016에서 목록화된 다운스트림 CLAUDE.md 라우팅 절 정리를 별도 후속 작업으로 사용자에게 보고 (본 피처 범위 밖 확정)

---

## Dependencies

- US1(T002-T012) → US2(T013-T016): 파일럿은 MCP 등록 필요
- US3(T017-T029)는 US1/US2와 파일 충돌 없음 — T017(RED) 후 T018-T027 병렬
  가능. 단 안전 순서상 US2 완료(실증) 후 착수 권장
- T027은 PR #128 머지에 의존
- US4(T030-T033)는 US3 완료 + PR 머지(T031) + 사용자 승인(T032)에 의존
- T007 → T008 → T009/T010/T011 (테스트 먼저)

## Parallel Example

- US1: T009, T010 병렬 (다른 파일). US3: T018~T024 병렬 (파일군 분리)
- US2의 T016은 T013-T015와 병렬 가능 (다른 대상)

## Implementation Strategy

MVP = US1만으로도 "browse 대체" 가치 성립. US2로 실증을 굳히고, US3은
TDD(RED→GREEN)로 참조 제거를 증명, US4는 인간 게이트 2중(머지+승인) 뒤
파괴적 삭제. 각 체크포인트에서 중단 가능하며 다음 스토리로 자연 확장.

## Notes

- T001 결과: Node v24.12.0, npx 11.6.2, `~/.codex/config.toml` 쓰기 가능
  (2026-08-06 확인).
- T005/T006 검증 방식: MCP는 세션 시작 시 로드되므로, 두 런타임이 사용하는
  것과 동일한 stdio 경로로 스모크 테스트(initialize → tools/list 24개 →
  browser_navigate → browser_snapshot 성공, 서버 Playwright
  1.63.0-alpha)를 수행했다. Claude `claude mcp list`는 Connected 표시.
  세션 내 실사용 재확인은 다음 새 세션에서 1회 수행 예정.
- T029 결과(2026-08-06): rule-check ok / context-check 0실패 0경고 /
  doctor 실패 0(경고 1건은 018 무관 — PATH의 claude 바이너리 중복 안내) /
  npm test 762/762 GREEN (gstack-residue RED 34파일 → GREEN 포함).
- T027은 PR #128 머지 후 반영 대기 (재측정 계획 룰 A 후속 주석).
- 카탈로그 등재: status.yaml, data/feature-definitions.json,
  data/feature-relations.json에 018 추가, verification.md 체크리스트 생성.
- 레포 잔여물 정리: 루트 .playwright-mcp/·스크린샷(MCP 산출물),
  .gstack/(과거 텔레메트리 로그 3파일) 삭제 후 shared-manifest 재생성.
