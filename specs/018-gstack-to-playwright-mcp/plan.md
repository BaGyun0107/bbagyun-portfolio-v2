# Implementation Plan: GStack 전면 제거 및 Playwright MCP 대체 도입

**Branch**: `feature/018-gstack-to-playwright-mcp` | **Date**: 2026-08-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/018-gstack-to-playwright-mcp/spec.md`

## Summary

브라우저 QA 대체 수단(Playwright MCP)을 양 런타임에 먼저 확보·검증한 뒤,
하네스에서 GStack 참조를 제거하고, 마지막으로 전역 설치를 삭제한다.
순서가 안전장치다: 대체 확보(P1) → PHP 파일럿(P2) → 참조 제거(P3) →
전역 삭제(P4, 사용자 승인 + 정책 PR 머지 후).

## Technical Context

**Language/Version**: Bash(하네스 스크립트), Node.js 24(mise 고정), Markdown 정책

**Primary Dependencies**: `@playwright/mcp` 0.0.79 핀(2026-08-06 기준 최신),
Chromium 바이너리(`npx playwright install chromium`, 머신당 1회)

**Storage**: N/A (설정 파일 — `~/.claude.json` mcpServers, `~/.codex/config.toml`)

**Testing**: `npm test`(하네스 테스트), `./harness rule-check`,
`./harness context-check`, `./harness doctor`

**Target Platform**: macOS 개발 머신 2대(2인 팀), 하네스 다운스트림 전 프로젝트

**Project Type**: 하네스 인프라(정책 + 설치 스크립트 + 런타임 설정)

**Performance Goals**: N/A

**Constraints**: AI는 PR 머지 금지. 전역 삭제(`~/.claude/skills`의 gstack 계열,
`~/.codex/skills`의 gstack 계열, `~/.gstack`)는 파괴적 작업 — 실행 직전 사용자
승인 필수, 정책 PR 머지 후에만 실행

**Scale/Scope**: 저장소 내 gstack 참조 파일 약 25곳(감사/과거 스펙 기록 제외),
전역 스킬 디렉터리 2곳 + 데이터 디렉터리 1곳

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dual-Runtime Parity**: PASS — MCP 등록을 Claude(`claude mcp add --scope
  user`)와 Codex(`config.toml`) 양쪽에 적용하고, 프리플라이트가 양쪽 패리티를
  점검. 등록 방식의 비대칭(파일 포맷 차이)은 research.md에 문서화.
- **II. Policy as Source of Truth**: PASS — 규칙 변경은 `.harness/policies/*`가
  원본, AGENTS/CLAUDE 및 네이티브 미러는 얇게 갱신.
- **III. Test-First**: PASS — gstack 참조 잔존 검출 테스트를 먼저 작성해
  현 상태에서 실패(RED) 확인 후 정리 진행. 품질 게이트 4종 통과가 완료 조건.
- **IV. Human Gates**: PASS — clarify 완료(2문항), tasks.md 리뷰에서 일시정지
  예정, 전역 삭제는 실행 직전 명시 승인, PR 머지는 사용자.
- **V. Upgrade Resilience**: PASS — `@playwright/mcp`는 0.0.79로 핀(floating
  latest 금지). 본 레포는 하네스 업스트림이므로 `.harness/skills/**` 내
  gstack 언급 수정은 소유권 규칙에 부합.

Post-design 재점검(Phase 1 완료 후): 위반 없음, Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/018-gstack-to-playwright-mcp/
├── spec.md
├── plan.md              # 이 문서
├── research.md          # Phase 0 결정 기록
├── quickstart.md        # 검증 시나리오 가이드
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks 출력 (다음 단계)
```

data-model.md, contracts/: 생략 — 데이터 엔티티와 외부 인터페이스 계약이
없는 인프라 작업 (설정 파일 스키마는 research.md에 기록).

### Source Code (repository root)

```text
.harness/policies/       # scenario-phase-routing, tool-permissions, agent-routing, quality-gates
.harness/scripts/setup/  # install.sh, update-check.sh, update.sh, init-project.sh
.harness/scripts/agent/  # agent-preflight.sh (등록 패리티 점검 추가 지점)
.harness/scripts/checks/ # doctor.sh
.harness/config/         # skill-triggers.json (gstack 트리거 제거)
.harness/manifest.json, .harness/lock.json
.claude/rules/phase-routing.md, .codex/rules/phase-routing.rules
AGENTS.md, CLAUDE.md, README.md, ARCHITECTURE.md, CONTRIBUTING.md
mise.toml                # bun 선언 제거
tests/                   # harness-cli.test.mjs 갱신 + gstack 잔존 검출 테스트 신설
docs/audits/             # 결정 근거 후속 주석(재측정 계획 룰 A)
```

**Structure Decision**: 기존 하네스 저장소 구조를 그대로 사용. 신규
디렉터리 없음. 전역 머신 상태(`~/.claude.json`, `~/.codex/config.toml`,
스킬 디렉터리)는 저장소 밖이므로 설치 스크립트/문서를 통해 관리.

## Complexity Tracking

위반 없음 — 해당 없음.
