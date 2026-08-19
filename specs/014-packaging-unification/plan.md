# Implementation Plan: 패키징 단일화

**Branch**: `feature/014-packaging-unification` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-packaging-unification/spec.md`

## Summary

팀원이 알아야 할 하네스 명령을 `./harness bootstrap` 하나로 줄이고, copy 모드
은퇴의 첫 단계(예고)를 넣는다. 핵심 판단은 "명령을 없애는 게 아니라 노출을
줄인다" 다 — `install`/`pkg-sync` 는 스킬 트리 구성과 vendor 배치를 담당해
제거하면 준비 과정이 깨진다 (research R1).

구현은 네 갈래다: (1) 도움말을 일상/전체로 분할, (2) `bootstrap` 에 결과 요약
추가, (3) `bootstrap` 단계 스킵 판정 보강, (4) copy 모드 갱신 시 은퇴 예고.
모두 기존 스크립트에 대한 국소 변경이며 새 모듈은 상태 파일 규약 하나뿐이다.

## Technical Context

**Language/Version**: POSIX sh (스크립트), Node.js 24 (검증·JSON 처리)

**Primary Dependencies**: 없음 — 하네스 스크립트는 외부 런타임 의존을 두지
않는다. 테스트만 `node:test` 사용.

**Storage**: 파일 기반. 상태는 `.harness/state/*` (git-ignored, 세션 로컬),
버전 캐시는 `~/.codi-harness/versions/<X.Y.Z>`.

**Testing**: `node --test` (`tests/*.test.mjs`), 현재 655건 통과

**Target Platform**: macOS (bootstrap), POSIX sh 전반 (나머지 스크립트)

**Project Type**: CLI 도구 모음 (단일 저장소, 앱 없음)

**Performance Goals**: 해당 없음 — 실행 빈도가 하루 1회 수준이라 지연이 축이
아니다 (spec Assumptions).

**Constraints**:
- 다운스트림 CI 10곳 이상이 `harness` 런처의 자가 부트스트랩(7~55행)에
  의존한다. 이 경로를 깨면 동시에 깨진다 (FR-014).
- 기존 655건 테스트가 그린이어야 한다 (SC-007).
- `bootstrap` 진행 표시는 `[bootstrap N/7]` 형식이며 번호 일관성이 요구된다
  (FR-016).

**Scale/Scope**: 다운스트림 수십 개, 팀원 소수. 변경 대상 파일 5개 내외.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 판정 | 근거 |
|---|---|---|
| I. Dual-Runtime Parity | **해당 없음** | 셸 스크립트 변경이며 Claude/Codex 룰 계층을 건드리지 않는다. 도움말은 두 런타임 공통. |
| II. Policy as Source of Truth | **통과** | 계획은 `specs/014-*/` 에 있고 채팅에 남기지 않는다. 정책 문서 변경은 없다. |
| III. Test-First | **통과 (준수 필요)** | 모든 동작 변경에 회귀 테스트를 먼저 쓴다. tasks 에 테스트 태스크를 명시 요청한다. |
| IV. Human Gates | **통과** | clarify 는 대화로 끝났고, tasks.md 리뷰 게이트는 auto-loop Stage B 가 강제한다. |
| V. Upgrade Resilience | **통과** | 외부 도구를 건드리지 않는다. `.harness/skills/**` 수정 없음. |

**위반 없음** — Complexity Tracking 불필요.

### 재평가 (Phase 1 이후)

설계 산출물을 만든 뒤 재확인: 새로 도입하는 것은 상태 파일 규약
(`.harness/state/bootstrap-summary`) 하나뿐이며, 이는 이미 쓰이는 패턴
(`current-size`, `touches-user-flow`, `e2e-last-run`)의 연장이다. 새 원칙
위반 없음.

## Project Structure

### Documentation (this feature)

```text
specs/014-packaging-unification/
├── plan.md              # 이 파일
├── research.md          # Phase 0 — R1~R6
├── data-model.md        # Phase 1 — 상태 파일 규약
├── quickstart.md        # Phase 1 — 검증 시나리오
├── contracts/           # Phase 1 — CLI 계약
│   └── harness-cli.md
└── tasks.md             # /speckit-tasks 산출 (이 명령이 만들지 않음)
```

### Source Code (repository root)

```text
harness                                  # 런처 — 도움말 분할 (FR-004)
.harness/scripts/setup/
├── bootstrap.sh                         # 결과 요약, 스킵 판정 (FR-017/018)
└── update.sh                            # copy 모드 은퇴 예고 (FR-006/007)
.harness/scripts/pkg/
└── pkg-sync.sh                          # 버전 변화를 상태 파일로 기록 (FR-017)
.harness/scripts/checks/
└── doctor.sh                            # 배포 모드 보고 (FR-008)

tests/
├── harness-cli.test.mjs                 # 도움말 분할 회귀
├── pkg-migrate.test.mjs                 # 요약 데이터 기록 회귀
└── bootstrap-summary.test.mjs           # 신규 — 요약 출력 계약
```

**Structure Decision**: 새 디렉터리를 만들지 않는다. 변경은 기존 스크립트
5개와 테스트 3개(1개 신규)에 국한된다. 하네스는 단일 저장소 CLI 모음이라
`src/` 레이아웃이 없으며, 스크립트는 역할별 디렉터리
(`setup`/`pkg`/`checks`/`agent`)로 이미 나뉘어 있다.

## Phase 1 설계 요지

### 요약 데이터의 흐름 (FR-017)

stdout 파싱은 문구 변경에 취약하므로 상태 파일을 경유한다 (research R5).

```
pkg-sync   → .harness/state/bootstrap-summary 에 버전 전/후 append
reclaim    → 같은 파일에 정리 건수 append
doctor     → 같은 파일에 fail/warn 건수 append
bootstrap  → 7단계 끝에 읽어서 요약 출력 후 파일 삭제
```

`bootstrap` 을 거치지 않고 하위 명령을 직접 실행하면 파일이 남지만, 다음
`bootstrap` 실행 시작 시 삭제하므로 누적되지 않는다.

### 도움말 분할 (FR-004)

`harness help` 는 일상 4개(`bootstrap`, `doctor`, `codex`, `claude`)만 싣고,
`harness help --all` 이 전체를 그룹 제목과 함께 출력한다. 기본 출력 끝에
`--all` 안내 한 줄을 둔다. 명령 자체는 전부 그대로 동작한다.

### copy 은퇴 예고 (FR-006/007)

`update.sh` 의 `apply-harness` 모드 진입 시점에 경고를 출력한다. lock 모드는
이미 조기 종료하므로(`pkg-legacy-guard` 테스트가 고정) 자연히 copy 레포에서만
표시된다 — 별도 조건 분기가 필요 없다.

### 배포 모드 보고 (FR-008)

`doctor` 에 `harness.lock` 유무 기반 한 줄 보고를 추가한다. 판정 로직은 이미
런처와 여러 스크립트가 쓰는 것과 동일하다.

## Complexity Tracking

> Constitution Check 위반 없음 — 이 섹션은 비워 둔다.
