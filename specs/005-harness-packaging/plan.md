# Implementation Plan: 하네스 패키지화 — 버전 캐시와 lock 기반 배포 (Phase 2)

**Branch**: `feature/harness-packaging` | **Date**: 2026-07-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-harness-packaging/spec.md`

## Summary

하네스 공유 본체를 semver git 태그로 발행하고, 다운스트림은 루트
`harness.lock`(자동 채널 latest-minor 또는 고정 버전) 하나로 소비한다.
버전은 `~/.codi-harness/versions/<ver>/` 불변 캐시에 shallow clone으로
수신되고, `.claude/.codex` 트리는 캐시를 가리키는 심링크로
materialize(git-ignore)된다. 반영은 세션 시작 시점에만, minor/patch만
자동이며 `harness pin`이 즉시 고정/롤백 안전판이다. 상위 설계:
설계 초안(2026-07-18 정리 — git history) (B절).

## Technical Context

**Language/Version**: POSIX sh(플로우) + Node 24 mjs(semver 비교·lock 파싱 등
로직), 기존 setup 스크립트 컨벤션 준수

**Primary Dependencies**: git(태그 조회 `ls-remote --tags`, shallow clone),
기존 `skills-link.sh` 심링크 패턴, SessionStart 훅(`update-check.sh`) 연계

**Storage**: `~/.codi-harness/versions/<ver>/` 불변 캐시(완료 마커로 원자성),
루트 `harness.lock`(JSON, 커밋) — 기존 `.harness/lock.json`(외부 도구 정책)과
별개 파일로 분리

**Testing**: `node --test tests/*.test.mjs` + 가짜 업스트림(태그 있는 로컬
bare git repo) + `CODI_HARNESS_CACHE_DIR`/`HOME` 오버라이드로 완전 격리. TDD.

**Target Platform**: macOS (zsh). CI 소비는 동일 흐름이나 실측 검증은 macOS.

**Project Type**: CLI (하네스 런처 서브커맨드 + pkg 스크립트 모음)

**Performance Goals**: 세션 시작 지연 ≤ 5초(SC-002, 백그라운드 확인),
pin/롤백 캐시 보유 시 즉시(SC-003)

**Constraints**: 원자적 전환(FR-010), 진행 중 세션 불변(FR-004), 오프라인
동작(FR-007), 프로젝트 소유물 불가침(FR-003)

**Scale/Scope**: pkg 스크립트 4~5개 + 런처 case 2~3개 + init-project 연계 +
gitignore 갱신 + 테스트 3~4파일. 기존 다운스트림 migrate는 Phase 3.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

constitution.md는 미작성 템플릿 — 하네스 자체 규칙을 게이트로 적용:

- 가드레일: 캐시·심링크 조작은 전부 멱등 + 원자적 flip, 사용자 소유 실파일은
  덮어쓰지 않음(엣지 케이스 명세). **PASS**
- skill-ownership: `.harness/skills/` 무수정. materialize는 기존
  `skills-link.sh`와 같은 "머지 트리 생성" 부류로 프로젝트-소유 로직. **PASS**
- work-safety: 태그 발행은 업스트림 관리자 절차(US4)로 분리, force-push·태그
  삭제 없음. **PASS**
- 페이로드 안전: 스크립트·긴 문서는 파일 작성 + 소단위 Edit. **PASS**

Post-design 재점검(Phase 1 산출물 반영 후): 위반 없음. **PASS**

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
harness                                  # pin / update / pkg 관련 case 추가
harness.lock.example                     # 다운스트림용 lock 형식 예시 (업스트림 레포는 소비자가 아님)
.harness/scripts/pkg/
├── resolve-version.mjs                  # lock 파싱, ls-remote 태그 조회, semver 채널 해석
├── fetch-version.sh                     # 캐시 수신 (shallow clone + 완료 마커, 동시성 lockdir)
├── materialize.sh                       # .claude/.codex 트리 심링크 생성 + 원자적 flip
├── pin.sh                               # harness pin <ver> (lock 갱신 + 즉시 flip)
└── release-check.sh                     # 업스트림 발행 검증 (태그 형식 + CHANGELOG 게이트)
.harness/scripts/setup/
├── update-check.sh                      # 세션 시작 채널 확인 연계 (기존 파일 확장)
└── init-project.sh                      # 신규 프로젝트에 lock 모드 배선 (기존 파일 확장)
CHANGELOG.md                             # 릴리스 항목 (신규)
tests/
├── pkg-resolve.test.mjs                 # 채널 해석·semver 비교 (TDD)
├── pkg-fetch-materialize.test.mjs       # 가짜 업스트림 → 캐시 → 트리 (TDD)
└── pkg-pin-update.test.mjs              # pin/롤백/오프라인/원자성 (TDD)
```

**Structure Decision**: 플로우는 POSIX sh(기존 setup 컨벤션), 판단 로직
(semver·lock)은 mjs로 분리해 node --test로 직접 검증. 캐시 경로와 HOME은
env 오버라이드로 테스트 격리. 하네스 레포 자체는 lock 소비자가 아니므로
`harness.lock`은 example 파일로만 두고 init-project가 신규 프로젝트에
실파일을 생성한다.

## Complexity Tracking

Constitution Check 위반 없음 — 해당 없음.
