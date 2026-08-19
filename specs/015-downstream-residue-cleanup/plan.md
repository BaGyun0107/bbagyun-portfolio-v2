# Implementation Plan: 다운스트림 잔재 정리 완결

**Branch**: `015-downstream-residue-cleanup` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-downstream-residue-cleanup/spec.md`

## Summary

다운스트림 잔재의 구조적 갭 6개를 닫는다: (1) pkg-sync에 ensure-gitignore 편입,
(2) prune-downstream을 flow 2 project-state 정리(하네스 .specify 상태·README·
package.json/lock·docs/audits)까지 확장, (3) 소비 측 링크(.claude/skills 등)
추적분 회수, (4) migrate-plan의 디렉터리-자체-링크 포착, (5) materialize/
skills-link의 상대경로 링크 전환, (6) 소유자/팀원 플로우 분리 — 인덱스 변경은
소유자 명령(prune-downstream --apply)에만, 팀원 bootstrap은 보고만. 그 위에서
6개 다운스트림 레포를 일괄 정리한다. 판정 로직은 기존 단일 출처 모듈
(upstream-project-state.mjs, migrate-plan.mjs, project-owned.mjs)의 확장으로만
추가하고 하드코딩 중복을 만들지 않는다.

## Technical Context

**Language/Version**: POSIX sh(스크립트 표면) + Node.js 24 ESM(판정 로직·테스트) — mise 고정

**Primary Dependencies**: 없음(Node 내장 모듈만). git CLI, GNU 비의존(macOS BSD 도구 호환 필수 — `realpath --relative-to` 사용 금지)

**Storage**: 파일 시스템 — git 인덱스, `.gitignore`, `~/.codi-harness/versions/<v>` 패키지 캐시, `.harness/state/` 로컬 마커

**Testing**: `npm test` = `node --test tests/*.test.mjs` (node:test 러너, 픽스처 git 레포 생성 방식은 기존 bootstrap-flow.test.mjs 패턴 재사용)

**Target Platform**: macOS(darwin, 주 개발) + Ubuntu(GitHub Actions CI)

**Project Type**: CLI 도구 체인(하네스 스크립트) — `./harness` 런처 하위 명령

**Performance Goals**: 해당 없음(대화식 CLI, 레포당 수백 파일 스캔 수준)

**Constraints**: 오프라인 시 기존 동작 유지(캐시 버전 유지), copy 모드 레포 무해성, 팀원 머신 인덱스 불변, 오삭제보다 잔재 보존 원칙

**Scale/Scope**: 스크립트 6곳 수정 + 테스트 신규 ~5본 + 다운스트림 6개 레포 롤아웃

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dual-Runtime Parity**: PASS — 에이전트 룰 변경 없음. 수정 대상은 `./harness`
  하위 명령(양 런타임 공용 CLI 표면)뿐이라 미러링 대상이 아니다.
- **II. Policy as Source of Truth**: PASS — plan of record는 이 spec 디렉터리.
  분류 기준은 기존 단일 출처 모듈 확장으로만 반영(하드코딩 중복 금지, FR-007).
  update-policy 문서(`.harness/docs/`)의 관련 서술은 구현과 함께 갱신한다.
- **III. Test-First**: PASS — FR-011이 TDD를 명시. 각 갭은 "기존 나쁜 동작이
  실패로 재현되는" 회귀 테스트를 먼저 작성한다. 종료 조건에 `npm test`,
  `./harness context-check`, `./harness rule-check`, `./harness doctor` 포함.
  e2e 게이트: 사용자-facing 앱 플로우 아님(도구 체인) — e2e 비대상.
- **IV. Human Gates**: PASS — tasks.md 리뷰 게이트에서 일시정지. AI는 PR 머지
  금지. 6개 레포 `--apply`(파일 삭제·인덱스 회수)는 레포·작업을 명시한 사용자
  승인 후 실행하고, 정리 커밋/push는 소유자가 수행한다.
- **V. Upgrade Resilience**: PASS — 외부 도구(Spec Kit/GStack/Superpowers) 결합
  변화 없음. `.harness/skills/` 등 upstream-소유 경로의 다운스트림 편집 없음
  (오히려 그 보호를 강화하는 작업).

**Post-design 재평가 (Phase 1 후)**: 위반 없음 — 신규 명령을 만들지 않고 기존
명령(pkg-sync, prune-downstream, materialize, skills-link)의 계약을 확장하는
설계로 수렴했다. Complexity Tracking 해당 없음.

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
.harness/scripts/pkg/
├── materialize.sh          # 수정: link_entry 상대경로 생성 (갭 5)
├── migrate-plan.mjs        # 수정: 디렉터리-자체-링크 포착(갭 4) + 소비 측 링크 목록 export(갭 3)
├── reclaim-shared.sh       # 수정: 회수 로직을 prune-downstream 공용 경로로 위임(갭 6)
└── pkg-sync.sh             # 수정: ensure-gitignore 편입(갭 1) + 잔재 check 보고(갭 6)

.harness/scripts/setup/
├── skills-link.sh          # 수정: 스킬 링크 상대경로 생성 (갭 5)
├── ensure-gitignore.mjs    # 수정 없음 예상(ROOT_DIR 기반 동작 확인됨) — 호출 지점만 추가
├── upstream-project-state.mjs  # 수정: project-state 잔재 판정 확장 (갭 2 단일 출처)
├── prune-downstream.mjs    # 수정: project-state 정리 + 추적 링크 회수 + check 보고 확장
├── normalize-root-package.mjs  # 신규: init-project 인라인 로직 추출(package.json 정규화 공용화)
└── init-project.sh         # 수정: normalize_root_scripts를 공용 모듈 호출로 대체

.harness/config/
└── required-gitignore.json # 수정: entries에 .claude/skills·.agents/skills 추가

tests/
├── materialize-relative-links.test.mjs   # 신규 (갭 5)
├── migrate-plan.test.mjs                 # 기존 확장 (갭 3·4) — 파일명은 기존 테스트 관례 확인 후 확정
├── prune-downstream-project-state.test.mjs  # 신규 (갭 2)
├── pkg-sync-gitignore.test.mjs           # 신규 (갭 1)
└── member-flow-index-immutable.test.mjs  # 신규 (갭 6)
```

**Structure Decision**: 신규 명령·신규 디렉터리 없이 기존 스크립트 표면을
확장한다. 판정 로직은 전부 `.mjs` 단일 출처 모듈에 두고 sh 스크립트는 호출만
한다(기존 관례). 테스트는 루트 `tests/`의 node:test 관례를 따른다.

## Complexity Tracking

해당 없음 — Constitution Check 위반 없음.
