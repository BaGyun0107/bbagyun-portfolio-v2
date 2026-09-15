# Feature Specification: 백엔드 중심 포트폴리오 비교 화면

**Feature Branch**: `001-backend-first-portfolio`

**Created**: 2026-08-19

**Status**: Retired — implementation removed by user direction on 2026-08-19; content-only work continues on public detail routes.

**Input**: User description: 기존 포트폴리오를 유지한 채 별도 비교 라우트로 현재 8개 작업물 전체에 백엔드 중심 홈 화면과 작업물 상세 경험을 구현하고, 작업물별 특성에 따라 데모·아키텍처 흐름·ERD·장문 케이스 스터디·다크모드를 적용한다.

## Clarifications

### Session 2026-08-19

- Q: 파일럿 적용이 현재 작업물 8개 중 하나만 새 구조로 구현한다는 뜻인가? → A: 아니다. 8개 전체를 새 비교 라우트에서 제공하고, 외부 예약 API·로깅 병목 작업물은 내용이 풍부한 대표 사례로 먼저 검증한다.

## User Scenarios & Testing

### User Story 1 - 기존 화면과 새 포트폴리오 화면 비교 (Priority: P1)

포트폴리오 운영자는 기존 화면을 그대로 유지하면서 별도 비교 라우트에서 새로운 백엔드 중심 포트폴리오 경험을 확인하고 싶다.

**Why this priority**: 기존 콘텐츠와 화면을 잃지 않고 변경 효과를 비교해야 안전하게 개편 방향을 검증할 수 있다.

**Independent Test**: 기존 홈·작업물 라우트와 새 비교 라우트를 각각 방문해 두 화면이 모두 정상적으로 렌더링되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 기존 포트폴리오 라우트가 존재할 때, **When** 사용자가 기존 홈과 8개 작업물의 상세 라우트에 방문하면, **Then** 기존 화면과 콘텐츠가 새 화면 구현에 의해 변경되지 않고 표시된다.
2. **Given** 새 비교 라우트가 존재할 때, **When** 사용자가 비교 홈과 비교 작업물 상세 라우트에 방문하면, **Then** 백엔드 중심 새 구조를 확인할 수 있다.
3. **Given** 새 비교 라우트의 작업물 목록에 현재 작업물 8개가 있을 때, **When** 사용자가 각 작업물 카드를 선택하면, **Then** 8개 모두 해당 작업물의 비교 상세 페이지로 이동한다.
4. **Given** 새 비교 라우트에서 작업물 카드를 선택했을 때, **When** 사용자가 상세 페이지로 이동하면, **Then** 동일 작업물의 장문 케이스 스터디와 작업물별 증거 블록을 확인할 수 있다.

### User Story 2 - 대표 작업물의 문제 해결 과정 읽기 (Priority: P1)

면접관은 대표 작업물에서 기술 스택 목록이 아니라 문제 상황, 역할, 제약, 설계 판단, 구현 과정, 결과와 회고를 순서대로 읽고 싶다.

**Why this priority**: 백엔드 중심 개발자의 판단력과 문제 해결력을 가장 직접적으로 보여주는 핵심 경험이다.

**Independent Test**: 파일럿 작업물 상세 페이지에서 목차를 따라 각 서술 섹션과 관련 증거를 확인한다.

**Acceptance Scenarios**:

1. **Given** 작업물 상세 페이지를 열었을 때, **When** 사용자가 상단 요약을 읽으면, **Then** 프로젝트 목적, 기간, 역할, 상태, 핵심 결과를 빠르게 파악할 수 있다.
2. **Given** 장문 케이스 스터디가 표시될 때, **When** 사용자가 목차 항목을 선택하면, **Then** 해당 섹션으로 이동할 수 있다.
3. **Given** 본문이 표시될 때, **When** 사용자가 내용을 읽으면, **Then** 문제 → 제약과 판단 → 구현 → 결과 → 회고의 흐름이 유지된다.
4. **Given** 실제 수치가 없는 결과 항목일 때, **When** 페이지가 표시되면, **Then** 근거 없는 수치를 생성하지 않고 적용 범위·운영 상태·정성적 결과를 표시한다.

### User Story 3 - 작업물의 아키텍처와 데이터 구조 확인 (Priority: P1)

면접관은 프론트엔드 작업물과 백엔드·인프라 작업물 모두에서 시스템 흐름과 데이터 설계를 다이어그램으로 확인하고 싶다.

**Why this priority**: 아키텍처 흐름과 ERD는 백엔드 개발자의 설계 능력을 보여주는 핵심 증거이며, 데모가 없는 작업물을 설명하는 방법이기도 하다.

**Independent Test**: 파일럿 작업물 상세 페이지에서 시스템 개요도, 스윔레인/시퀀스 다이어그램, ERD를 각각 확인하고 본문 설명과 일치하는지 검토한다.

**Acceptance Scenarios**:

1. **Given** 작업물 상세 페이지에 아키텍처 증거가 있을 때, **When** 사용자가 아키텍처 흐름을 선택하면, **Then** 시스템 주체·책임·데이터 흐름이 이미지처럼 명확한 다이어그램으로 표시된다.
2. **Given** 다이어그램이 화면 너비보다 클 때, **When** 사용자가 모바일 화면에서 확인하면, **Then** 확대 또는 가로 스크롤로 전체 다이어그램을 볼 수 있다.
3. **Given** 핵심 데이터 모델이 있는 작업물일 때, **When** 사용자가 ERD를 확인하면, **Then** 핵심 엔티티·관계·상태 생명주기·정합성 제약에 대한 설명을 함께 확인할 수 있다.
4. **Given** 프론트엔드가 없는 작업물일 때, **When** 사용자가 상세 페이지를 열면, **Then** 데모 버튼을 표시하지 않고 아키텍처·ERD·운영 증거를 우선 표시한다.

### User Story 4 - 데모와 아키텍처 증거를 구분해서 접근 (Priority: P2)

면접관은 실행 가능한 제품 작업물은 직접 사용해 보고, 백엔드·인프라 작업물은 아키텍처와 운영 결과를 확인하고 싶다.

**Why this priority**: 모든 작업물에 동일한 데모를 강제하지 않으면서도 각 작업물의 강점을 가장 적절한 방식으로 보여준다.

**Independent Test**: 데모가 있는 작업물과 없는 작업물의 상세 페이지를 각각 열어 상단 액션과 증거 블록이 다르게 표시되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 데모 URL이 있는 작업물일 때, **When** 사용자가 상세 페이지 상단을 보면, **Then** 데모 실행과 아키텍처 흐름 보기 액션을 모두 확인할 수 있다.
2. **Given** 데모 URL이 없는 작업물일 때, **When** 사용자가 상세 페이지 상단을 보면, **Then** 아키텍처 흐름 보기 액션만 확인할 수 있고 존재하지 않는 데모 링크는 노출되지 않는다.
3. **Given** 소스 코드가 비공개인 작업물일 때, **When** 사용자가 상세 페이지를 보면, **Then** 소스 코드 공개를 전제로 하지 않는 설명·다이어그램·API 계약·운영 증거를 확인할 수 있다.

### User Story 5 - 라이트·다크 테마로 읽기 (Priority: P2)

면접관은 긴 케이스 스터디와 다이어그램을 선호하는 화면 테마로 읽고 싶다.

**Why this priority**: 긴 글과 기술 다이어그램의 읽기 지속성을 높이고, 사용자의 시스템 테마를 존중한다.

**Independent Test**: 비교 라우트에서 테마 버튼을 클릭하고 새로고침한 뒤 본문·카드·다이어그램·ERD의 대비가 유지되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 사용자가 비교 라우트에 방문했을 때, **When** 헤더의 테마 버튼을 클릭하면, **Then** 라이트와 다크 테마가 즉시 전환된다.
2. **Given** 사용자가 테마를 선택했을 때, **When** 페이지를 새로고침하면, **Then** 마지막으로 선택한 테마가 유지된다.
3. **Given** 다크 테마가 활성화되어 있을 때, **When** 사용자가 본문·다이어그램·ERD를 읽으면, **Then** 텍스트, 선, 범례, 상태 색상이 식별 가능하게 표시된다.
4. **Given** 사용자가 키보드로 탐색할 때, **When** 테마 버튼에 도달하면, **Then** 버튼의 목적과 현재 상태가 보조기술에 전달된다.

### Edge Cases

- 사용자가 직접 테마를 선택하지 않은 첫 방문에서는 시스템의 선호 테마를 사용한다.
- 데모 URL이 없거나 접근할 수 없으면 데모 액션을 숨기고 아키텍처 증거를 기본 경로로 제공한다.
- 다이어그램 원본이나 이미지가 로드되지 않으면 대체 설명과 핵심 흐름 텍스트를 제공한다.
- ERD에 표시할 핵심 엔티티가 없는 작업물은 ERD 대신 데이터 저장 방식과 정합성 설명을 제공한다.
- 기존 라우트와 비교 라우트가 같은 작업물 데이터를 사용하더라도 한쪽의 표현 변경이 다른 쪽 화면을 깨뜨리지 않아야 한다.
- 모바일에서 긴 본문과 넓은 다이어그램이 서로의 가로 스크롤을 방해하지 않아야 한다.

## Requirements

### Functional Requirements

- **FR-001**: System MUST preserve the existing public home and project detail routes without replacing their current content or layout during comparison work.
- **FR-002**: System MUST provide separate comparison routes for the new home experience and new project detail experience without replacing the existing routes.
- **FR-003**: The comparison experience MUST expose all 8 existing projects in the comparison project list and provide a working detail route for each project.
- **FR-004**: The comparison home MUST place featured work above recent development records and keep study/insight sections discoverable.
- **FR-005**: The comparison project detail MUST render a long-form case study with overview, role, problem, constraints, decisions, implementation, result, and retrospective sections.
- **FR-006**: The comparison project detail MUST provide a navigable table of contents for long-form content.
- **FR-007**: The content model MUST support optional demo information without requiring every project to have a demo.
- **FR-008**: The content model MUST support architecture diagrams, sequence/swimlane diagrams, ERD artifacts, API contracts, decisions, and metrics as separately addressable evidence.
- **FR-009**: The comparison project detail MUST show architecture flow access for every project and MUST show demo access only when demo information exists.
- **FR-010**: The comparison project detail MUST present ERD or an equivalent data-design explanation when the project contains a meaningful data model.
- **FR-011**: Diagrams MUST remain readable on desktop and mobile through responsive sizing, horizontal scrolling, or an equivalent accessible presentation.
- **FR-012**: The content presentation MUST preserve user-authored reasoning, rejected alternatives, constraints, and retrospective details rather than reducing every project to a short summary.
- **FR-013**: The comparison routes MUST provide a theme toggle that supports system preference as the initial default and persists explicit user choice across reloads.
- **FR-014**: The theme presentation MUST maintain sufficient contrast for long-form text, diagram lines, labels, legends, ERD relationships, badges, and code blocks.
- **FR-015**: The comparison experience MUST provide accessible names, keyboard access, visible focus, and meaningful alternative text for interactive controls and diagrams.
- **FR-016**: The implementation MUST use one reusable comparison template that can render all 8 projects with project-specific content and evidence blocks.

### Key Entities

- **Feature**: A project or meaningful engineering initiative with long-form case study content.
- **Artifact**: A separately addressable project evidence item such as a system diagram, swimlane, ERD, API contract, metric chart, or operational record.
- **Demo**: Optional controlled demo information for a project, including URL and access guidance.
- **Decision**: A recorded problem, selected approach, rejected alternatives, reasoning, and outcome.
- **Metric**: A measured result with label, value, unit, comparison, and measurement context.
- **DevelopmentLog**: A future source record for daily Claude Code/Codex work history before it is promoted to public content.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A visitor can identify the comparison route's featured work and enter either a demo or architecture view within 10 seconds.
- **SC-002**: A visitor can locate the role, problem, architecture, data model, result, and retrospective sections of the pilot project within 3 minutes.
- **SC-003**: All 8 comparison project detail pages show an architecture-flow entry point, while only projects with configured demo information show a demo entry point.
- **SC-004**: The existing home and 8 existing project detail routes render successfully before and after the comparison experience is added.
- **SC-005**: All 8 comparison project detail pages can be viewed at viewport widths of 320px, 768px, 1024px, and 1440px without loss of content access or horizontal page overflow outside diagram containers.
- **SC-006**: Theme selection is retained after a full page reload and all comparison-page primary text and controls remain readable in both themes.
- **SC-007**: The content-rich pilot project renders a system-flow artifact and an ERD or equivalent data-design artifact alongside the long-form case study.
- **SC-008**: The pilot page preserves the user's authored rationale and retrospective in full sections rather than only card summaries, and the remaining 7 projects render through the same reusable structure without requiring a second page template.

## Assumptions

- The external reservation API and logging/buffering project will be used as the content-rich pilot for validating the reusable template; this does not reduce the implementation scope, which includes all 8 existing projects.
- Existing public routes remain the comparison baseline and are not migrated in the first implementation pass.
- Demo URLs, if any, are supplied as content configuration and are not created as part of this feature.
- Source code remains private and is not required for acceptance.
- The first pass can use local static content and artifact metadata; automatic Claude Code/Codex history ingestion is a follow-up feature that will consume the DevelopmentLog concept.
- The existing application theme tokens and installed theme-related dependencies may be reused where compatible with the comparison routes.
- No new backend API or database migration is required for the first comparison-route implementation.
