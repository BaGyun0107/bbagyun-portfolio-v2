# Implementation Plan: 하네스 원클릭 온보딩 부트스트랩 (Phase 1)

**Branch**: `feature/bootstrap-packaging-design` | **Date**: 2026-07-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-onboarding-bootstrap/spec.md`

## Summary

macOS 전용 멱등 부트스트랩(`./harness bootstrap`)이 Xcode CLT 확인 → mise
설치 → mise.toml 선언 도구 설치(node·bun·uv·pnpm·gh) → gh 인증 안내 →
기존 `./harness install` 위임 → Superpowers 자동 설치 시도 → doctor 검증을
한 번에 수행한다. 도구 목록은 루트 mise.toml이 단일 출처로 소유하고,
부트스트랩은 목록을 모르는 얇은 진입점으로 유지한다(상위 설계:
설계 초안(2026-07-18 정리 — git history)).

## Technical Context

**Language/Version**: POSIX sh (기존 setup 스크립트와 동일), 훅 수정은 Node 24 (mjs)

**Primary Dependencies**: mise(런타임 관리자, `curl https://mise.run`으로 설치),
gh CLI, 기존 `.harness/scripts/setup/install.sh`·`checks/doctor.sh`

**Storage**: 없음 (설치 상태는 실행 시점 환경 검사로 파생, FR 관련 상태 파일 없음)

**Testing**: `node --test tests/*.test.mjs` (기존 패턴, `harness-cli.test.mjs` 참조)
+ 셸 플로우 테스트(`test-init-project-flows.sh` 스타일). TDD로 진행.

**Target Platform**: macOS (Apple Silicon/Intel), zsh 기본 셸

**Project Type**: CLI (하네스 런처 서브커맨드 + setup 스크립트)

**Performance Goals**: 신규 머신 15분 이내 완료, 완료 상태 재실행 1분 이내 (SC-002/003)

**Constraints**: 멱등성(FR-003), 도구 목록 하드코딩 금지(FR-004), 대화형 입력
최대 2지점(SC-001), 미지원 OS 무변경 종료(FR-002)

**Scale/Scope**: 스크립트 1개 + 런처 case 1개 + mise.toml [tools] 확장 +
tool-permission-guard.mjs carve-out + install.sh Superpowers 절 연계 + 테스트

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md`는 미작성 템플릿이므로 constitution 게이트는
없음. 대신 하네스 자체 규칙을 게이트로 적용한다:

- 가드레일 정책(`.harness/policies/guardrails.md`): 부트스트랩은 사용자
  머신 전역 상태(셸 프로필, 도구 설치)를 바꾸므로 각 변경은 멱등 + 명시적
  로그 출력이어야 함 — 설계에 반영됨. **PASS**
- skill-ownership: `.harness/skills/` 수정 없음. **PASS**
- e2e-validation: 사용자-facing 웹 플로우 아님(개발자 도구). e2e 게이트
  비대상, 검증은 셸/unit 테스트 + quickstart 실측. **PASS**
- 페이로드 안전 규칙: 스크립트는 파일로 작성, 커밋 메시지는 `-F`. **PASS**

Post-design 재점검(Phase 1 완료 후): 위반 없음 유지. **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
harness                                  # bootstrap 서브커맨드 case 추가
mise.toml                                # [tools]에 bun·uv·pnpm·gh 추가
.harness/scripts/setup/
├── bootstrap.sh                         # 신규: 멱등 온보딩 마법사
└── install.sh                           # Superpowers 절을 bootstrap과 공유하도록 연계
.harness/hooks/
└── tool-permission-guard.mjs            # 패키지 매니저 정책 carve-out (V3)
tests/
├── bootstrap-flow.test.mjs              # 신규: 단계 스킵/멱등/미지원 OS (TDD)
└── tool-permission-guard-carveout.test.mjs  # 신규: carve-out 회귀 (TDD)
```

**Structure Decision**: 기존 setup 스크립트 컨벤션(POSIX sh, 한국어 안내
출력, `run()` dry-run 헬퍼)을 그대로 따르는 단일 스크립트 + 런처 case 추가.
도구 목록은 mise.toml [tools]가 단일 출처(FR-004).

## Complexity Tracking

Constitution Check 위반 없음 — 해당 없음.
