# Feature Specification: 프로젝트 소유 규칙 경로(rules-local)와 배포 이력 기반 stale 삭제 제한

**Feature Branch**: `feature/rules-local-protection`

**Created**: 2026-08-07

**Status**: Draft

**Input**: User description: "다운스트림 프로젝트 소유 규칙 경로(rules-local) 신설 + 배포 이력 기반 stale 삭제 제한. 승인된 설계 문서 docs/superpowers/specs/2026-08-07-rules-local-design.md 를 입력으로 사용. include test tasks (TDD)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 프로젝트 규칙의 보장된 저장 경로 (Priority: P1)

다운스트림 팀이 프로젝트 전역 팀 규칙을 `.harness/rules-local/`에
커밋하면, 하네스 업데이트가 그 파일을 절대 덮어쓰거나 삭제하지 않고,
Claude 세션에는 상시 로드 규칙으로 자동 반영된다.

**Why this priority**: 사고(프로젝트 규칙 오삭제)의 직접 해결책이자 이
기능의 존재 이유다. 이 스토리만 구현해도 "규칙을 안전하게 둘 자리"라는
핵심 가치가 전달된다.

**Independent Test**: 다운스트림 형태의 테스트 레포에
`.harness/rules-local/sample.md`를 만들고 update 적용 + 링크 단계를
실행해, 파일이 보존되고 `.claude/rules/local/sample.md` 링크가 생기는지
확인한다.

**Acceptance Scenarios**:

1. **Given** 다운스트림 레포에 `.harness/rules-local/foo.md`가 커밋되어
   있을 때, **When** `./harness update --apply-harness`를 실행하면,
   **Then** 파일은 덮어쓰기·삭제·복원 대상에서 제외된다(project-owned
   건너뜀으로 보고).
2. **Given** `.harness/rules-local/foo.md`가 존재할 때, **When** 링크
   단계(skills-link)가 실행되면, **Then**
   `.claude/rules/local/foo.md` 상대경로 심링크가 생성되고 재실행해도
   결과가 같다(멱등).
3. **Given** `.harness/rules-local/`이 없는 fresh clone에서, **When**
   링크 단계가 실행되면, **Then** 디렉터리가 지연 생성되고 실패하지
   않는다.

---

### User Story 2 - 배포한 적 없는 파일은 stale로 삭제하지 않음 (Priority: P2)

하네스 업데이트의 stale 정리가, 하네스가 실제로 배포했던(이전 로컬
shared-manifest에 실재했던) 파일만 삭제한다. 배포 이력이 없는 파일은
보존하고 "프로젝트 고유 파일로 보임 — 규칙이면 `.harness/rules-local/`로
이전" 비차단 안내를 낸다. doctor도 같은 감지를 보고한다.

**Why this priority**: US1이 새 규칙의 자리를 만들지만, 기존
다운스트림에 이미 존재하는 위험 파일(예:
`.claude/rules/codi-architecture.md`)은 US2가 있어야 보호된다. 사고
형태의 구조적 재발 방지.

**Independent Test**: 테스트 레포의 `.claude/rules/`에 manifest에 없는
파일을 커밋해 두고 update를 실행해, 파일이 보존되고 이전 안내 경고가
출력되는지, 반대로 이전 manifest에 실재했던 stale 파일은 여전히
삭제되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** `.claude/rules/my-rule.md`가 커밋돼 있고 어떤 로컬
   shared-manifest에도 실린 적이 없을 때, **When** update의 stale 정리가
   실행되면, **Then** 파일은 삭제되지 않고 rules-local 이전 안내
   경고가 출력된다.
2. **Given** 이전 로컬 shared-manifest에 실재했으나 새 upstream
   manifest에서 빠진 공유 파일이 있을 때, **When** stale 정리가
   실행되면, **Then** 그 파일은 기존과 같이 삭제된다.
3. **Given** 이전 로컬 shared-manifest를 읽을 수 없을 때, **When**
   stale 정리가 실행되면, **Then** stale 삭제 전체가 생략된다
   (fail-safe, 경고만).
4. **Given** 배포 이력 없는 파일이 하네스 소유 스캔 트리에 남아 있을
   때, **When** `./harness doctor`를 실행하면, **Then** 같은 이전 안내가
   비차단 경고로 보고된다.

---

### User Story 3 - Codex 세션의 프로젝트 규칙 인지 (Priority: P3)

Codex 세션도 시작 시점에 프로젝트 규칙의 존재와 목록을 안내받는다:
공유 `AGENTS.md`의 일반 로드 문구 + `agent-preflight` 출력의 rules-local
파일 목록.

**Why this priority**: 양 런타임 패리티 원칙의 충족. Claude 배선(US1)이
먼저 가치를 전달하고, Codex는 진입점 안내로 따라온다.

**Independent Test**: rules-local 파일이 있는 레포에서
`agent-preflight`를 실행해 목록이 출력되는지, `AGENTS.md`에 로드 문구가
있는지 확인한다.

**Acceptance Scenarios**:

1. **Given** `.harness/rules-local/foo.md`가 존재할 때, **When**
   `agent-preflight`가 실행되면, **Then** rules-local 파일 목록이
   출력된다.
2. **Given** `.harness/rules-local/`이 비어 있거나 없을 때, **When**
   `agent-preflight`가 실행되면, **Then** 관련 출력이 없고 실패하지
   않는다.

### Edge Cases

- 업스트림이 `.claude/rules/local/` 이름을 배포하려 하면? — 배포 금지
  가드(테스트)가 업스트림에서 실패해야 한다. 다운스트림 병합 규칙은
  존재하지 않는다(shadowing 미지원).
- lock 모드에서 `.claude/rules/local`이 이미 심링크일 때 재링크? —
  멱등해야 하며, copy/lock 양 모드에서 동작이 같아야 한다.
- `.harness/rules-local/`에 `.md` 아닌 파일이나 하위 디렉터리가 있으면?
  — 링크 단계는 `.md` 파일만 링크하고 나머지는 무시한다(실패 금지).
- stale 후보가 로컬 미커밋 변경을 가진 경우? — 기존 동작(보존+경고)
  유지.
- 이전 로컬 shared-manifest가 구버전이라 최근 배포 파일이 빠져 있는
  경우? — 그 파일은 삭제 대신 안내 대상이 된다(오삭제보다 잔재 원칙).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 다운스트림 프로젝트는 `.harness/rules-local/`에 팀 공유
  규칙 파일(.md)을 커밋할 수 있어야 한다.
- **FR-002**: 하네스 업데이트(덮어쓰기·삭제·복원·stale 정리)는
  `.harness/rules-local/`과 `.claude/rules/local/`을 절대 건드리지
  않아야 한다(project-owned 분류: Node 분류기·셸 fallback·정책 문서·정합
  테스트 4중 등재).
- **FR-003**: 링크 단계는 `.harness/rules-local/*.md`를
  `.claude/rules/local/<name>.md` 상대경로 심링크로 멱등하게 반영해야
  하며, 기존 링크 단계 호출 지점(install·preflight·update·pre-commit)에서
  자동 실행되어야 한다.
- **FR-004**: 업스트림 하네스는 `.claude/rules/local/` 이름을 배포할 수
  없어야 한다(가드 테스트가 업스트림에서 실패).
- **FR-005**: update의 stale 정리는 이전 로컬 shared-manifest에 실재했던
  파일만 삭제해야 하며, 그 외 파일은 보존하고 rules-local 이전 안내를
  비차단 경고로 출력해야 한다. 이전 manifest를 읽을 수 없으면 stale
  삭제 전체를 생략해야 한다.
- **FR-006**: doctor는 하네스 소유 스캔 트리에서 배포 이력 없는 파일을
  감지하면 같은 이전 안내를 비차단으로 보고해야 한다.
- **FR-007**: 공유 `AGENTS.md`는 `.harness/rules-local/` 존재 시
  프로젝트 규칙으로 로드하라는 일반 문구를 포함해야 하고,
  `agent-preflight`는 존재하는 rules-local 파일 목록을 출력해야 한다.
- **FR-008**: 관련 정책 문서(update-policy 등)와 상시 로드 룰 문서에
  rules-local 소유권 관례가 반영되어야 한다(새 상시 로드 룰 파일 신설
  없이 기존 문서에 편입).

### Key Entities

- **rules-local 규칙 파일**: `.harness/rules-local/<name>.md` — 팀 공유
  프로젝트 규칙의 단일 소스(커밋 대상, project-owned).
- **소비 링크**: `.claude/rules/local/<name>.md` — 링크 단계가 생성하는
  상대경로 심링크(Claude 상시 로드 표면).
- **이전 로컬 shared-manifest**: 업데이트 적용 전
  `.harness/shared-manifest.json` — "하네스가 배포했던 파일"의 판정
  기준(삭제 허용 목록).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 다운스트림 형태 레포에서 rules-local 파일을 두고 update를
  실행했을 때, 덮어쓰기·삭제·복원이 0건이다.
- **SC-002**: 배포 이력 없는 커밋 파일이 하네스 소유 스캔 트리에 있는
  상태로 update를 실행했을 때, 삭제 0건 + 이전 안내 경고 1건 이상이
  출력된다 (사고 사례 시나리오의 재현 불가).
- **SC-003**: 이전 manifest에 실재했던 stale 공유 파일은 update 후
  제거된다 (기존 정리 능력의 회귀 없음).
- **SC-004**: 링크 단계를 2회 연속 실행해도 결과 트리가 동일하다(멱등).
- **SC-005**: 기존 update 적용 회귀 테스트("830 사고 형태" 핀 포함)가
  전부 통과한다.

## Assumptions

- 규칙 성격은 커밋되는 팀 공유 규칙이다. 개인(비커밋) 규칙은 기존
  `CLAUDE.local.md`/`AGENTS.local.md` 관례가 계속 담당한다.
- 자동 마이그레이션(위험 파일을 rules-local로 자동 이동)은 범위 밖 —
  감지+안내까지만 (사용자 결정 2026-08-07).
- `.codex/rules-local/`(execpolicy 로컬 확장)과 공유 규칙
  shadowing/override는 범위 밖.
- Codex는 매 턴 훅이 없어 첫 턴 이후 규칙 재주입이 안 된다 — 기존
  하네스 규칙과 동일한 수준의 잔여 갭으로 수용한다.
- Claude의 `.claude/rules/` 서브디렉터리 로딩은 lock 모드
  `.claude/rules/shared` 심링크로 이미 검증된 동작을 전제로 한다.
- 승인된 설계 문서: `docs/superpowers/specs/2026-08-07-rules-local-design.md`.
