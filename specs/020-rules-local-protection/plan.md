# Implementation Plan: rules-local 보장 경로와 배포 이력 기반 stale 삭제 제한

**Branch**: `feature/rules-local-protection` | **Date**: 2026-08-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/020-rules-local-protection/spec.md`

## Summary

다운스트림 프로젝트 팀 규칙의 보장 경로 `.harness/rules-local/`을
신설하고(skills-local 패턴 복제: project-owned 4중 등재 + skills-link
확장으로 `.claude/rules/local/` 심링크 배선 + Codex 진입점 안내),
update의 stale 삭제를 "이전 로컬 shared-manifest에 실재했던 파일"로
제한해 배포 이력 없는 파일의 오삭제를 구조적으로 차단한다. 승인 설계:
`docs/superpowers/specs/2026-08-07-rules-local-design.md`.

## Technical Context

**Language/Version**: POSIX sh (setup 스크립트), Node.js 24 ESM(.mjs)

**Primary Dependencies**: 기존 하네스 스크립트만 — `project-owned.mjs`,
`project-owned-fallback.sh`, `skills-link.sh`, `update.sh`,
`prune-stale.mjs`, `agent-preflight.sh`, `doctor.sh`. 신규 외부 의존성
없음.

**Storage**: 파일 시스템(레포 트리) + `.harness/shared-manifest.json`

**Testing**: `node --test` (tests/*.test.mjs, npm test), 기존 update
적용 회귀 테스트 확장

**Target Platform**: macOS/Linux 개발 머신 (다운스트림 레포 copy/lock
양 모드)

**Project Type**: 하네스 인프라(CLI 스크립트 + 정책 문서)

**Performance Goals**: 해당 없음 (update/preflight 체감 지연 없음 유지)

**Constraints**: 오삭제 금지가 최우선(불확실하면 보존), fail-safe 기본,
멱등 링크, Codex/Claude 패리티, 기존 "830 사고 형태" 핀 테스트 불변

**Scale/Scope**: 스크립트 6곳 수정 + 정책/진입점 문서 3곳 + 테스트
4묶음. 앱 코드·사용자 플로우 없음(e2e 게이트 비대상,
touches-user-flow=no)

## Constitution Check

*GATE: Phase 0 전 통과, Phase 1 후 재확인.*

- **I. Dual-Runtime Parity**: 통과 — 소스는 `.harness/rules-local/`
  단일, Claude는 링크로 상시 로드, Codex는 AGENTS.md 문구+preflight
  출력. 잔여 비대칭(Codex 첫 턴 이후 재주입 불가)은 spec Assumptions에
  보상 통제와 함께 문서화됨.
- **II. Thin Entry Points**: 통과 — AGENTS.md에는 문구 1개만 추가, 상세
  서술은 `update-policy.md` 등 정책 파일에. 새 상시 로드 룰 파일 신설
  없음.
- **III. Test-First**: 통과 — tasks 단계에서 TDD 테스트 태스크 명시
  요청, "이전 나쁜 동작이 이제 실패함"을 증명하는 회귀 테스트(FR-005
  보존 시나리오) 포함. npm test/context-check/rule-check/doctor 통과가
  종료 조건.
- **IV. Human Gates**: 통과 — auto-loop의 tasks.md 리뷰 게이트에서
  정지 예정. 파괴적 작업 없음.
- **Post-Phase 1 재확인** (research/data-model/contracts/quickstart 작성
  후): 위반 없음 — 설계 산출물이 원칙과 충돌하는 항목을 추가하지 않음.

## Project Structure

### Documentation (this feature)

```text
specs/020-rules-local-protection/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── cli-behavior.md
└── tasks.md            # /speckit-tasks 산출 (이 명령이 만들지 않음)
```

### Source Code (repository root)

```text
.harness/scripts/setup/
├── project-owned.mjs            # PROJECT_OWNED_DIRS 2항목 추가
├── project-owned-fallback.sh    # 동일 항목 동기 (테스트가 기계 대조)
├── skills-link.sh               # rules 링크 단계 추가
└── update.sh                    # stale 삭제를 prior manifest로 제한 + 안내

.harness/scripts/checks/
└── doctor.sh                    # 배포 이력 없는 파일 감지 항목 추가

.harness/policies/
└── update-policy.md             # 보호 서술 갱신

AGENTS.md                        # rules-local 로드 문구 1개
.harness/scripts/agent/agent-preflight.sh  # rules-local 목록 출력

tests/
├── project-owned-parity.test.mjs (기존 확장)
├── update-apply.test.mjs (기존 확장: 보존+안내, prior-stale 삭제 유지)
├── skills-link.test.mjs (기존 확장: rules 링크·멱등·local 배포 금지)
└── doctor 관련 테스트 (기존 확장)
```

**Structure Decision**: 신규 디렉터리·모듈 없음. 기존 스크립트의 최소
확장으로 구현하고, 판정 로직의 단일 출처(project-owned.mjs, prior
manifest 목록)를 재사용한다. 테스트 파일명은 기존 명명을 따르되 실제
파일 배치는 tasks 단계에서 기존 테스트 구조를 확인해 확정한다.

## Complexity Tracking

해당 없음 — Constitution Check 위반 없음.
