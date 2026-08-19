# Implementation Plan: 기존 다운스트림 migrate와 구 동기화 은퇴 (Phase 3)

**Branch**: `feature/harness-migrate` | **Date**: 2026-07-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-harness-migrate/spec.md`

## Summary

`./harness migrate`가 기존(복사본 커밋) 다운스트림을 lock 모드로 전환한다 —
제거 목록은 패키지(current)의 shared-manifest ∩ tracked − project-owned로
계산하고, 전환은 워킹트리 변경으로만 만들어 사용자가 리뷰·커밋한다.
init-project는 같은 pruning을 재사용해 신규 프로젝트의 룰 이중 로드를
해소하고, 구 동기화 커맨드(update 적용·prune·restore)는 lock 모드에서 안내로
대체된다. 업스트림 하네스 레포는 영향 없음.

## Technical Context

**Language/Version**: 제거 목록 계산은 Node 24 mjs(`migrate-plan.mjs`),
플로우는 POSIX sh(`migrate.sh`) — 005 패턴 계승

**Primary Dependencies**: 005의 pkg 스크립트(fetch/materialize/pkg-sync),
패키지의 `shared-manifest.json`, 기존 `project-owned.mjs` 분류기(단일 출처
재사용 — 3경로 정합 메모리 참조), `git ls-files`/`git status --porcelain`

**Storage**: 없음 (전환 결과는 워킹트리 변경뿐)

**Testing**: `node --test` + 005 픽스처 확장(복사본 커밋형 가짜 다운스트림
생성 헬퍼). TDD.

**Target Platform**: macOS (Phase 1/2와 동일)

**Project Type**: CLI (런처 서브커맨드 + 스크립트)

**Performance Goals**: migrate 실행(전환 계산+제거+동기화) 5분 이내,
dry-run 10초 이내

**Constraints**: 프로젝트 소유물 불가침(FR-002), dirty 중단(FR-003),
워킹트리 변경만(FR-004), 업스트림 거부(FR-006), 멱등(FR-007)

**Scale/Scope**: migrate 스크립트 2개 + 런처 case + init-project 재사용 +
구 동기화 3개 스크립트 lock 가드 + 문서 2건 + 테스트 2파일

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

constitution.md 미작성 — 하네스 자체 규칙 게이트:

- work-safety: migrate는 파일 삭제를 수행하므로 ① dry-run 기본 안내,
  ② dirty 중단, ③ 워킹트리 변경만(커밋은 사용자), ④ git 복원 안내로
  통제한다. `git rm` 수준의 추적된 삭제만 하며 `rm -rf` 부류 없음. **PASS**
- 가드레일: 구 동기화 가드는 lock 감지 시 "변경 0 + 안내"로 안전 방향
  실패. **PASS**
- skill-ownership: `.harness/skills/` 무수정, skills-local 충돌은 기존
  fail-fast 유지. **PASS**
- 페이로드 안전: 스크립트 파일 작성 + 소단위 Edit. **PASS**

Post-design 재점검: 위반 없음. **PASS**

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
harness                                  # migrate case 추가
.harness/scripts/pkg/
├── migrate-plan.mjs                     # 제거 목록 계산 (manifest ∩ tracked − project-owned)
└── migrate.sh                           # 전환 플로우 (검사→pkg-sync→제거→검증→안내)
.harness/scripts/setup/
├── init-project.sh                      # 신규 프로젝트에 pruning 재사용 (US2)
├── update.sh                            # lock 모드 가드 (US3)
├── prune-downstream.mjs                 # lock 모드 가드 (US3)
└── restore-missing-shared.mjs           # lock 모드 가드 (US3)
AGENTS.md                                # 패키지 매니저 문구 정합화 (US4)
tests/
├── pkg-migrate.test.mjs                 # US1/US2 (TDD)
└── pkg-legacy-guard.test.mjs            # US3 (TDD)
```

**Structure Decision**: 제거 목록 계산은 판단 로직이므로 mjs로 분리해 단독
테스트하고, 플로우는 sh. 분류는 `project-owned.mjs`를 import 재사용해 3경로
(분류기·정책·테스트) 정합을 유지한다.

## Complexity Tracking

Constitution Check 위반 없음 — 해당 없음.
