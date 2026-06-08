# 하네스 아키텍처

> **이 파일은 shared 하네스 파일입니다.** 다운스트림 프로젝트는 이 파일을 직접 수정하지 않습니다. `./harness update --apply-harness`가 upstream 버전으로 덮어씁니다. 프로젝트별 아키텍처 결정은 GSD가 관리하는 `.planning/`에 기록합니다.

이 하네스는 thin harness, external tools, fat skills 구조를 따릅니다. 하네스 자체는 작게 유지하고, 실제 판단과 실행 규칙은 외부 GSD/GStack/Superpowers, `.harness/skills`, `.harness/policies`, `.planning/`에 둡니다.

## 핵심 모델

```text
사용자 요청
  -> 메인 오케스트레이터
      -> 필요한 phase와 외부 도구 선택
      -> GSD .planning 상태 갱신
      -> 구현/검증/리뷰 실행
      -> 다음 phase 결정
```

메인 세션의 책임:

- 사용자의 목표와 제약을 정리합니다.
- 필요한 phase와 도구를 고릅니다.
- 여러 phase에 걸치는 상태는 `.planning/`에 남깁니다.
- 하위 실행의 결과 요약만 받아서 다음 phase로 넘깁니다.

## 도구별 책임

| 도구 | 책임 |
| --- | --- |
| GStack | 전략, 보안, 역할 기반 의사결정, 리뷰/QA/ship 게이트 |
| GSD | 프로젝트 구조, milestone, phase plan, phase 실행 상태, 검증 기록, `.planning/` |
| Superpowers | TDD, systematic debugging, parallel agents, verification 습관 |
| Codi Skills | Node.js 24, npm/pnpm, Next.js, Express, NestJS, DB, CI/CD 세부 규칙 |

세 도구는 항상 동시에 실행하는 통합 스택이 아닙니다. 작업 크기와 phase 리스크에 따라 필요한 역할만 선택합니다.

## Phase Flow

```text
Phase 1 Strategy       ->  /cso -> optional /office-hours -> /autoplan
Phase 2 Structure      ->  /gsd-new-project -> /gsd-new-milestone -> /gsd-plan-phase
Phase 3 Implementation ->  /gsd-execute-phase + Superpowers TDD/debugging
Phase 4 Validation     ->  /gsd-validate-phase -> /gsd-verify-work -> /review -> /qa
Phase 5 Completion     ->  /ship -> /gsd-complete-milestone
```

The phase model is a thinking flow, not a local spec-file convention.

## 컨텍스트 보존 규칙

- 중요한 결정은 `.planning/`에 기록합니다.
- acceptance 기준과 phase boundary는 GSD state에 남깁니다.
- 실행 로그와 검증 결과는 phase handoff 요약에 남깁니다.
- 하위 세션은 phase 결과, 변경 파일, 실행한 명령, 남은 리스크만 반환합니다.
- 메인 세션은 다음 phase에 필요한 정보만 유지합니다.

## 자동화 경계

자동화해도 되는 것:

- phase routing reminder
- GSD/GStack/Superpowers 명령 안내
- 결과 요약 저장
- 테스트/빌드/doctor 실행

자동화 전에 확인해야 하는 것:

- 외부 서비스 생성
- GitHub 레포 생성과 push
- Infisical secret 등록
- 배포 workflow `push` 활성화
- 권한 상승 또는 파괴적 명령

## Team Mode

기본 구조는 여전히 단일 오케스트레이터 모델입니다.

```sh
./harness codex
./harness claude
```

큰 작업에서 여러 역할을 동시에 보며 진행해야 할 때만 선택적으로 팀 모드를 씁니다.

```sh
./harness team
./harness team claude
./harness team --agent codex
./harness team --agent claude
./harness team --dry-run
```

`./harness team`은 shared preflight를 한 번 실행한 뒤 macOS에서는 cmux를 먼저 사용하고, cmux가 없으면 tmux session으로 fallback합니다. 둘 다 없어도 일반 `codex`/`claude` 런처와 `doctor` 성공 여부에는 영향을 주지 않습니다.

팀 모드의 기본 역할은 `orchestrator`, `planner`, `implementer`, `reviewer`, `qa`, `shell`입니다. 각 pane/process에는 `CODI_TEAM_ROLE`과 `CODI_AGENT_ROLE`이 설정됩니다. pane scrollback은 source of truth가 아니며, phase handoff와 검증 기록은 `.harness/policies/orchestration-loop.md`의 handoff contract를 따라 GSD `.planning/`, PR, verification 기록에 남깁니다.

팀 모드 운영 규칙은 `team-mode-operator` skill에 둡니다. phase routing은 `codi-phase-routing`이 맡고, cmux/tmux pane 운영, status/notification, worktree 격리, handoff 형식은 `team-mode-operator`가 맡습니다.
