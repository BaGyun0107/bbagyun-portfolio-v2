# Research: GStack 전면 제거 및 Playwright MCP 대체 도입

Date: 2026-08-06. 모든 NEEDS CLARIFICATION 해소됨 (clarify 2문항 + 아래 조사).

## R1. MCP 등록 방식과 범위

- **Decision**: 사용자 레벨 등록. Claude Code는 `claude mcp add --scope user
  playwright -- npx @playwright/mcp@0.0.79`(결과는 `~/.claude.json`의
  mcpServers), Codex는 `~/.codex/config.toml`에 `[mcp_servers.playwright]`
  블록(command="npx", args=["@playwright/mcp@0.0.79"]).
- **Rationale**: GStack도 전역 설치였고, 프로젝트별 `.mcp.json` 커밋은 전
  레포 수정 필요. Codex config.toml에는 이미 node_repl, computer-use 항목이
  있어 동일 패턴. 2026-08-06 확인: Claude 사용자 레벨 mcpServers는 현재 비어
  있음(충돌 없음).
- **Alternatives considered**: 프로젝트 `.mcp.json` 커밋(전 레포 수정 부담,
  기각), 글로벌 npm 설치 후 직접 경로 지정(npx 캐시로 충분, 기각).

## R2. 버전 핀

- **Decision**: `@playwright/mcp` **0.0.79** 고정 (2026-08-06 npm 최신).
  Chromium은 `npx playwright install chromium` 1회. 핀 버전은
  `.harness/policies/tool-permissions.md`와 설치 스크립트에 단일 상수로 기록.
- **Rationale**: constitution V(Upgrade Resilience) — floating latest 금지.
- **Alternatives considered**: `@latest`(재현성 훼손, 기각), playwright 본체
  버전 핀 연동(MCP 패키지가 자체 의존성으로 관리, 불필요).

## R3. 패리티 자동화 지점

- **Decision**: `agent-preflight.sh`에 양 런타임 등록 상태 점검(누락 시 안내)
  을 추가하고, `install.sh`에 최초 등록을 추가. doctor에도 점검 항목 추가.
- **Rationale**: 프리플라이트는 두 런처(`./harness claude`, `./harness codex`)
  가 공유하는 단일 지점 — constitution I의 "한 구현, 양 런타임" 원칙.
- **Alternatives considered**: 훅에서 매 프롬프트 점검(과도한 비용, 기각),
  문서 안내만(신규 머신에서 조용히 누락, 기각).

## R4. GStack 참조 제거 범위 (2026-08-06 전수 grep)

- **Decision**: 수정 대상은 살아 있는 규칙/스크립트/문서 약 25파일 —
  AGENTS.md, CLAUDE.md, README.md, ARCHITECTURE.md, CONTRIBUTING.md,
  `.harness/policies/`(scenario-phase-routing, agent-routing, quality-gates),
  `.harness/workflow.md`, `.harness/config/skill-triggers.json`,
  `.harness/manifest.json`, `.harness/lock.json`, `.harness/docs/`(skills-guide,
  dependency-security-manual-setup), `.harness/scripts/`(doctor.sh,
  update-check.sh, update.sh, install.sh, init-project.sh, write-lock.mjs),
  `.claude/rules/phase-routing.md`, `.codex/rules/phase-routing.rules`,
  `.harness/skills/`(codi-dependency-review, codi-phase-routing),
  `tests/harness-cli.test.mjs`, `mise.toml`, `docs/harness-overview.md`,
  `.specify/memory/constitution.md`(V조 GStack 예시 목록 갱신).
  **보존**: `docs/audits/**`, 과거 `specs/00x-*/**`(역사 기록).
- **Rationale**: FR-005의 "전수 검색으로 확정" 이행. 과거 기록을 고치면
  감사 추적이 깨진다.
- **Alternatives considered**: 최소 목록만 수정(잔존 참조가 에이전트를 없는
  도구로 라우팅, 기각).

## R5. 전역 삭제 절차

- **Decision**: 삭제 대상은 `~/.claude/skills`의 gstack 계열 스킬 디렉터리
  전부, `~/.codex/skills`의 gstack 계열 전부, `~/.gstack`(사용자 데이터 포함
  — clarify Q2 결정). 실행 직전 대상 목록을 제시하고 명시 승인 후 삭제.
  롤백 문서는 GStack 공식 설치 절차 + "데이터 미복원(신규 설치)" 명시.
- **Rationale**: guardrails의 파괴적 작업 승인 규칙. 순서상 정책 PR 머지 후
  실행해 참조-먼저-제거를 보장.
- **Alternatives considered**: 백업 후 삭제(clarify Q2에서 완전 삭제 결정),
  스킬만 삭제(동일).

## R6. PHP 파일럿 실행 형태

- **Decision**: php-gnuboard5-6-32를 로컬 기동(clarify Q1). 기동 방식은 해당
  레포의 기존 로컬 구성을 따르고(없으면 PHP 내장 서버 + MySQL), MCP로 메인
  페이지 로드 → 폼 상호작용 → 스크린샷 흐름을 재현해 증적을 본 스펙
  디렉터리에 기록.
- **Rationale**: 백엔드 스택 무관성 실증이 목적 — 로컬 기동이 dev 서버
  의존 없이 재현 가능.
- **Alternatives considered**: dev 서버 URL(clarify Q1에서 로컬 결정).

## R7. 잔존 검출 회귀 검증 (TDD 진입점)

- **Decision**: 하네스 테스트에 "살아 있는 규칙/스크립트 경로에 gstack 참조
  0건" 검사를 추가(허용 목록: docs/audits, specs 과거 기록, 본 018 스펙).
  구현 전 작성해 현 상태 RED 확인 → 정리 후 GREEN.
- **Rationale**: constitution III — 이전 잘못된 상태가 다시 실패로 증명돼야
  완료. 미래에 gstack 참조가 재유입되는 것도 차단.
- **Alternatives considered**: 일회성 수동 grep(재발 방지 없음, 기각).
