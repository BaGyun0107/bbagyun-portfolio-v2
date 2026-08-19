# Feature Specification: GStack 전면 제거 및 Playwright MCP 대체 도입

**Feature Branch**: `feature/018-gstack-to-playwright-mcp`

**Created**: 2026-08-06

**Status**: Draft

**Input**: User description: "GStack 전면 제거 및 Playwright MCP 대체 도입 (2026-08-06 재측정 근거, 양 런타임 등록 패리티, PHP 파일럿, 정책 참조 제거, 전역 스킬 제거 + 롤백 문서화)"

## Clarifications

### Session 2026-08-06

- Q: PHP 파일럿 대상과 접속 방식은? → A: php-gnuboard5-6-32를 로컬
  기동(docker 또는 로컬 서버 구성) 후 검증
- Q: 전역 제거 시 `~/.gstack` 사용자 데이터 처리? → A: 스킬과 함께 전부
  삭제 (완전 제거, 롤백 시 데이터 미복원 감수)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 양 런타임에서 브라우저 QA 대체 수단 확보 (Priority: P1)

개발자가 Claude Code와 Codex 어느 쪽에서 작업하든, GStack browse 없이
Playwright MCP로 즉석 브라우저 QA(페이지 열기, 요소 확인/조작, 스크린샷)를
수행할 수 있다. 제거보다 대체 수단 확보가 먼저다.

**Why this priority**: 대체 수단이 검증되기 전에 GStack을 제거하면 QA 공백이
생긴다. 이 스토리 하나만 완료돼도 "browse 대신 MCP를 쓴다"는 가치가 성립한다.

**Independent Test**: 두 런타임 각각에서 임의 사이트를 열어 스냅샷 →
요소 클릭/입력 → 스크린샷 흐름을 재현하면 단독 검증 가능.

**Acceptance Scenarios**:

1. **Given** Playwright MCP가 등록된 Claude Code 세션, **When** 페이지 열기와
   요소 조작을 요청하면, **Then** 브라우저가 조작되고 결과(스냅샷/스크린샷)가
   확인된다.
2. **Given** Playwright MCP가 등록된 Codex 세션, **When** 동일 흐름을
   요청하면, **Then** 동일하게 동작한다.
3. **Given** 새 머신/팀원 환경, **When** 하네스 설치 절차를 따르면, **Then**
   별도 수동 작업 없이 양 런타임 등록이 갖춰진다.

---

### User Story 2 - PHP 프로젝트 파일럿 검증 (Priority: P2)

gnuboard 계열 PHP 프로젝트에서도 앱을 띄운 뒤 동일한 MCP QA 흐름이
동작함을 확인한다. 백엔드 스택과 무관함을 실증하는 파일럿이다.

**Why this priority**: 팀 프로젝트에 PHP 비중이 있어, Node 앱에서만 검증하면
전환 결정의 근거가 불완전하다.

**Independent Test**: php-gnuboard5-6-32를 로컬로 기동하고 MCP로 로그인 등
핵심 흐름 1개를 재현하면 단독 검증 가능.

**Acceptance Scenarios**:

1. **Given** 기동된 gnuboard 앱, **When** MCP로 메인 페이지 접근과 폼 상호작용을
   수행하면, **Then** browse로 하던 QA와 동등한 결과를 얻는다.

---

### User Story 3 - 하네스에서 GStack 흔적 제거 (Priority: P3)

새 세션을 시작한 에이전트가 GStack을 안내받거나 라우팅하지 않도록, 하네스
정책·규칙·문서에서 GStack 참조를 제거한다.

**Why this priority**: 대체 수단 검증(US1-2) 이후에 의미가 있다. 참조가 남으면
에이전트가 제거된 도구를 호출하려다 실패한다.

**Independent Test**: 저장소 전체에서 GStack 참조를 검색해 정책/규칙/스킬
라우팅 경로에 잔존 0건이면 통과 (역사 기록인 감사 문서 제외).

**Acceptance Scenarios**:

1. **Given** 정리 완료된 하네스, **When** 새 세션이 시작되면, **Then** 컨텍스트에
   GStack 게이트/유틸 안내가 나타나지 않는다.
2. **Given** 정리 완료된 하네스, **When** 품질 게이트(rule-check 등)를 돌리면,
   **Then** 모두 통과한다.

---

### User Story 4 - 전역 GStack 설치 제거와 롤백 경로 (Priority: P4)

머신 전역(`~/.claude/skills`, `~/.codex/skills`)의 gstack 스킬과 사용자
데이터 디렉터리(`~/.gstack`)를 제거하되, 실행 직전 사용자 승인을 받고,
되돌리고 싶을 때 재설치할 수 있는 절차를 문서로 남긴다 (데이터는 복원되지
않는 신규 설치임을 명시).

**Why this priority**: 파괴적·전 프로젝트 영향 작업이라 가장 마지막이며,
정책 변경 PR 머지 후에만 실행한다.

**Independent Test**: 제거 후 전역 스킬 목록에 gstack 계열 0건 + 롤백 문서의
절차만으로 재설치가 가능함을 확인.

**Acceptance Scenarios**:

1. **Given** 정책 변경이 머지된 상태, **When** 사용자가 제거를 승인하면,
   **Then** 전역 gstack 스킬이 제거되고 결과가 기록된다.
2. **Given** 제거 완료 상태, **When** 롤백 문서 절차를 따르면, **Then** GStack이
   재설치되어 이전 상태로 복귀한다.

### Edge Cases

- Node/npx가 없거나 네트워크가 막힌 머신에서 MCP 서버 기동이 실패하면?
  (설치 절차가 사전 점검과 안내를 제공해야 함)
- 브라우저 바이너리(chromium) 미설치 상태로 첫 QA를 시도하면? (1회 설치
  안내 또는 자동화)
- Codex 샌드박스/승인 모드에서 MCP 도구 호출이 차단되면? (권한 정책 반영)
- 다운스트림 프로젝트의 CLAUDE.md에 과거 gstack 라우팅 절("## Skill
  routing")이 주입돼 있으면? (파일럿에서 존재 확인 후 정리 목록화)
- 재측정 계획(룰 A)과의 정합성: 제거는 "게이트 0회" 조건이 아닌 사용자
  명시 결정에 근거함을 감사 기록에 남겨야 함.
- 루트 mise.toml의 bun이 GStack 외 다른 용도로 쓰이고 있으면? (제거 전 검증)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Playwright MCP가 Claude Code와 Codex 양 런타임에 등록되어야
  하며, 버전은 고정(pin)되어야 한다.
- **FR-002**: 하네스 설치/프리플라이트가 양 런타임의 등록 상태 패리티를
  점검하고, 누락 시 안내 또는 자동 등록해야 한다 (신규 머신·팀원 포함).
- **FR-003**: 도구 권한 정책(tool-permissions)에 Playwright MCP 권한
  우선순위가 양 런타임 공통으로 반영되어야 한다.
- **FR-004**: php-gnuboard5-6-32를 로컬 기동한 뒤 MCP QA 흐름 파일럿을
  수행하고 증적(흐름, 명령, 결과)을 기록해야 한다.
- **FR-005**: 하네스 정책·규칙·문서에서 GStack 참조가 제거되어야 한다.
  대상은 저장소 전수 검색으로 확정하되 최소 AGENTS.md, CLAUDE.md,
  scenario-phase-routing, tool-permissions, agent-routing을 포함한다.
  역사 기록(docs/audits/**)은 보존한다.
- **FR-006**: 스킬 사용 재측정 계획의 룰 A(GStack 게이트)에 본 결정으로
  대체되었음을 기록하는 후속 주석이 추가되어야 한다.
- **FR-007**: 루트 mise.toml의 bun 선언은 GStack 외 용도가 없음을 확인한
  뒤 제거해야 한다.
- **FR-008**: 전역 스킬 제거는 `~/.gstack` 사용자 데이터 삭제를 포함해
  실행 직전 사용자 승인을 받아야 하며, 재설치 절차(롤백 경로)가
  문서화되어야 한다. 롤백은 데이터가 복원되지 않는 신규 설치임을 문서에
  명시한다.
- **FR-009**: 참조 제거 후 하네스 품질 게이트(rule-check, context-check,
  doctor, 테스트)가 통과해야 하며, GStack 참조 잔존을 검출하는 회귀
  검증이 포함되어야 한다 (TDD: 검증을 먼저 작성해 현재 상태에서 실패함을
  확인 후 정리 진행).
- **FR-010**: AI는 PR을 머지하지 않는다. 전역 제거(FR-008)는 정책 변경 PR이
  사용자에 의해 머지된 뒤에만 실행한다.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Claude Code와 Codex 각각에서 브라우저 QA 흐름(페이지 열기 →
  요소 확인/조작 → 스크린샷)이 추가 수동 설정 없이 성공한다.
- **SC-002**: PHP 프로젝트 1곳에서 동일 QA 흐름이 성공하고 증적이 스펙
  디렉터리에 기록된다.
- **SC-003**: 정책·규칙·스킬 라우팅 경로의 GStack 참조가 0건이다 (감사
  기록 제외), 그리고 잔존 검출 회귀 검증이 지속적으로 이를 보장한다.
- **SC-004**: 하네스 품질 게이트 4종(rule-check, context-check, doctor,
  테스트)이 모두 통과한다.
- **SC-005**: 전역 제거 후, 롤백 문서만 보고 GStack을 재설치해 사용 가능한
  상태로 복귀할 수 있다 (사용자 데이터는 미복원, 신규 설치 기준).
- **SC-006**: 신규 머신/팀원이 하네스 설치 절차만으로 두 런타임 모두에서
  SC-001을 재현할 수 있다.

## Assumptions

- MCP 등록 범위는 사용자 레벨(머신 전역)로 한다 — GStack도 전역 설치였고,
  프로젝트별 커밋 방식은 전 레포 수정이 필요해 과하다. 하네스
  설치/프리플라이트가 사용자 레벨 등록을 점검한다.
- 실브라우저 세션이 필요한 케이스(본인인증, 복잡한 로그인 등)는
  claude-in-chrome이 담당하며 본 피처 범위 밖이다.
- GStack의 게이트 외 부가 유틸(scrape, make-pdf, diagram, learn 등)도 함께
  제거된다 — "전부 제거"가 사용자 결정이며, 필요 시 Playwright MCP·기본
  도구로 대체 가능하다.
- 감사 기록(docs/audits/**)과 과거 스펙 문서의 GStack 언급은 역사 기록으로
  보존한다.
- 2026-08-06 재측정(PR #128)이 결정의 근거 데이터이며, 재측정 룰 A의 "0회면
  제안" 조건과 무관하게 사용자가 명시 결정했다.
- 팀은 2인(프론트/백 별도 clone)이므로, 팀원 머신 반영은 하네스 설치 절차
  갱신으로 충족한다.
- 브라우저 바이너리 설치는 머신당 1회 허용되는 준비 작업이다.
- PHP 레포에 커밋형 Playwright e2e 스위트를 추가하는 것은 본 피처 범위
  밖이다 (원하면 별도 피처로 진행).
