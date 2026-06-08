# 하네스 사용 가이드

> **이 파일은 shared 하네스 파일입니다.** 다운스트림 프로젝트는 이 파일을 직접 수정하지 않습니다. `./harness update --apply-harness`가 upstream 버전으로 덮어씁니다. 프로젝트별 절차나 추가 규칙은 다음 파일에 둡니다.
>
> - `CONTRIBUTING.local.md` — 레포 전체에 적용되는 프로젝트별 절차
> - `apps/*/CONTRIBUTING.md` — 특정 앱에만 적용되는 절차
>
> 두 파일은 update 명령에서 제외되어 보존됩니다. 분류 기준은 [.harness/policies/update-policy.md](./.harness/policies/update-policy.md) 참고.

이 문서는 Codex 또는 Claude Code로 실제 작업을 진행할 때 따르는 운영 절차입니다. 최초 클론과 설치는 [README.md](README.md) 참고.

## 기본 원칙

- 에이전트는 `./harness codex` 또는 `./harness claude`로 실행합니다.
- 팀 모드는 `./harness team`으로만 켜는 선택 기능입니다. 일반 실행을 대체하지 않습니다.
- 여러 phase에 걸치는 작업 상태는 채팅이 아니라 외부 GSD의 `.planning/`에 남깁니다.
- 중요한 작업은 Brainstorming → Planning → Execution → Review → Verification 순서를 따릅니다.
- 하네스 자체 런타임은 `mise`가 관리하는 Node.js 24 + npm입니다. 대상 앱이 Node.js 20/22를 선언하면 앱의 런타임 설정이 우선입니다.
- 앱 패키지 매니저는 스택별로 고정합니다(README의 표 참고). `yarn`과 `bun`은 사용하지 않습니다.
- 스킬 원본은 `.harness/skills`입니다. `.agents/skills`와 `.claude/skills`는 이 경로를 바라봅니다.
- 공통 규칙은 `.harness/policies/context-engineering.md`를 기준으로 합니다.

## 언어 정책

- 코드 주석: 한글을 기본으로 하되, 외부 API 이름이나 표준 용어는 원문을 유지합니다.
- 커밋 메시지: type 접두사는 영문, 설명은 한글로 작성합니다.
- PR/이슈 제목과 본문: 한글로 작성합니다.
- 변수명, 함수명, 파일명, 디렉토리명: 영문으로 작성합니다.

커밋 예시:

```text
feat: 로그인 페이지 구현
fix: 토큰 만료 시 리다이렉트 안 되는 문제 수정
chore: GitHub Actions 배포 파이프라인 추가
refactor: 사용자 인증 로직 분리
docs: 하네스 사용 가이드 추가
```

권장 type: `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`, `perf`.

## 브랜치와 환경 매핑

| 브랜치 | Infisical 환경 | 배포 환경 |
| --- | --- | --- |
| `dev` | `dev` | development |
| `main` | `prod` | production |

앱의 `.infisical.json` 기본 구조:

```json
{
  "workspaceId": "<INFISICAL_PROJECT_ID>",
  "defaultEnvironment": "local-dev",
  "gitBranchToEnvironmentMapping": {
    "main": "prod",
    "dev": "dev"
  }
}
```

## 프로젝트 프로필

앱 구조는 `.harness/config/project-profile.yaml`이 결정합니다. 지원 모드와 명령은 README의 "프로젝트 관리 > 프로젝트 프로필"을 참고합니다.

`split-front-back`에서는 `apps/front/**`와 `apps/back/**`가 모두 활성화되어 frontend는 `codi-frontend`, backend는 `codi-backend`가 담당합니다.

`next-fullstack` 또는 `frontend-only`에서는 다음을 금지합니다.

- `apps/back/**` 파일 생성 또는 수정
- Next.js route handler, server action, server component 작업에 `codi-backend` 사용
- `apps/back` 스캐폴딩 또는 import

`next-fullstack`에서는 API-like 작업, auth, server action, route handler를 `codi-frontend`가 담당합니다. `frontend-only`에서 backend가 필요해지면 먼저 프로젝트 프로필을 바꾸는 architecture decision을 남깁니다.

`backend-only`에서는 `apps/front/**` 생성/수정과 `codi-frontend` 라우팅을 금지합니다. UI가 필요해지면 프로필 변경 결정을 먼저 남깁니다.

## 권한과 패키지 매니저

권한 판정 우선순위는 `.harness/policies/tool-permissions.md`를 기준으로 합니다.

```text
사용자 명시 결정
-> hard deny
-> 프로젝트 프로필 경계
-> 역할/팀 정책
-> 패키지 매니저 정책
-> 도구별 ask 정책
-> 기본 최소 권한
```

deny는 allow보다 우선합니다. 운영, 시크릿, 데이터 삭제, Git 히스토리 변경, MCP 쓰기 권한 같은 민감한 작업은 자동 진행하지 않고 사용자에게 묻습니다.

## AGENTS.md / CLAUDE.md 관리

`AGENTS.md`와 `CLAUDE.md`는 긴 매뉴얼이 아니라 에이전트가 세션 시작 시 읽는 얇은 진입점입니다.

운영 기준:

- Codex 진입점은 `AGENTS.md`, Claude Code 진입점은 `CLAUDE.md`입니다.
- 두 파일에 공통 규칙을 길게 복제하지 않습니다.
- 공통 정책은 `.harness/policies`, `.harness/imported-rules`, `.harness/skills`에 둡니다.
- 프로젝트별 팀 규칙은 `.harness/config/project-profile.yaml` 또는 app-local `apps/*/AGENTS.md`, `apps/*/CLAUDE.md`에 둡니다.
- 앱 소스와 app-local `apps/*/.env.example`, `apps/*/.infisical.json`은 downstream-owned 파일이며, 하네스 업데이트가 덮어쓰지 않습니다.
- 작업별 결정과 이유는 GSD가 관리하는 `.planning/` 또는 관련 정책 문서에 남깁니다.
- 루트 진입점 파일은 각각 200줄 이하를 목표로 합니다.
- 긴 코드 예시는 넣지 말고 실제 파일 경로나 정책 문서를 참조합니다.

규칙을 추가할 때 세 축:

| 축 | 설명 | 권장 위치 |
| --- | --- | --- |
| WHAT | 스택, 구조, 주요 경로 | project profile, app-local agent docs, runtime files |
| WHY | 결정 배경, tradeoff, 예외 사유 | `decisions.md`, `ARCHITECTURE.md` |
| HOW | 명령, 검증, 브랜치/PR | `CONTRIBUTING.md`, `.harness/policies` |

수정 후 검사:

```sh
./harness context-check
./harness doctor
./harness workflow-check
```

`workflow-check`는 로컬에 `actionlint`가 있을 때 GitHub Actions workflow를 검사합니다. 로컬에 없으면 CI의 `rhysd/actionlint`가 최종 gate를 맡습니다.

개인 선호는 source of truth가 아닙니다. `AGENTS.local.md`, `CLAUDE.local.md`, `.claude/settings.local.json`, `.codex/config.toml`은 git에 올리지 않습니다. 팀 공통 규칙은 PR로 `.harness`에 반영하고, 특정 앱에만 적용되는 팀 규칙은 app-local 문서에 반영합니다.

## 브랜치, PR, Guardrails

자세한 강제 규칙은 `.harness/policies/guardrails.md`와 `.harness/policies/tool-permissions.md`를 기준으로 합니다.

### 작업 브랜치

`main`과 `dev` 브랜치에서는 직접 작업하지 않습니다. 현재 브랜치가 `main` 또는 `dev`인 상태에서 변경을 요청하면 AI는 먼저 새 작업 브랜치를 만들도록 유도해야 합니다.

권장 브랜치 이름:

```text
feat/<short-kebab-name>
fix/<short-kebab-name>
test/<short-kebab-name>
docs/<short-kebab-name>
chore/<short-kebab-name>
hotfix/<short-kebab-name>
```

### PR 흐름

AI는 PR 생성까지만 할 수 있습니다. 어떠한 경우에도 PR merge는 직접 할 수 없습니다.

앱 레포 일반 작업:

```text
feat/*, fix/*, test/*, docs/*, chore/*
  -> dev로 PR 생성  ->  사용자 merge
  -> dev에서 main으로 PR 생성  ->  사용자 merge
```

하네스 레포 작업:

```text
chore/*, fix/*, test/*, docs/*
  -> 요청된 버전 브랜치로 PR 생성  ->  사용자 merge
```

하네스 레포 자체는 버전 브랜치 기반으로 관리합니다. 앱 레포의 `dev -> main` 승격 흐름을 하네스 레포 작업에 강제하지 않습니다.

HOTFIX:

```text
hotfix/*
  -> dev 선반영 없이 main으로 바로 PR 생성  ->  사용자 merge
  -> main 변경분을 dev로 되돌리는 main -> dev 역동기화 PR 생성  ->  사용자 merge
```

앱 레포에서 `main`에 바로 PR을 만들 수 있는 경우는 `HOTFIX`뿐입니다. Hotfix가 `main`에 merge된 경우에는 반드시 `main -> dev` 역동기화 PR을 만들어 사용자 merge까지 진행합니다.

### 위험 명령

아래 작업은 어떤 상황에서도 사용자에게 명시적으로 확인받습니다.

```text
rm -rf
git push --force
git reset --hard
git clean -fd
DROP TABLE / DROP DATABASE / TRUNCATE
WHERE 없는 DELETE FROM
prisma migrate reset
kubectl delete
docker system prune
terraform destroy
gh pr merge
gh repo delete
production deploy 또는 rollback
secret/token/env 출력
```

Claude Code에서는 `.harness/hooks/guardrails.mjs`와 `.harness/hooks/tool-permission-guard.mjs`가 일부 위험 Bash 명령과 패키지 매니저 오사용을 실행 전에 차단합니다. `gh pr merge`는 에이전트가 영구적으로 실행하면 안 되며 사용자가 GitHub에서 직접 병합합니다. `git reset --hard`, `rm -rf`, `git clean`, production deploy/rollback 같은 작업은 구체적 대상에 대한 명시 승인 없이는 실행하지 않습니다. Codex prefix rule은 현재 작업 디렉터리를 볼 수 없으므로 앱 설치 예시는 `pnpm --dir apps/front install`, `npm --prefix apps/front install`처럼 대상 디렉터리를 명시하는 형태를 우선 사용합니다.

### 사용자 결정 알림

에이전트가 사용자 선택 없이 진행할 수 없는 경우에는 질문만 남기지 말고 알림도 보냅니다.

```sh
./harness notify-decision "사용자 결정이 필요합니다: 배포 workflow를 전환할지 확인해주세요."
```

Claude Code는 `Stop` hook에서 마지막 응답이 결정 질문처럼 보이면 `.harness/hooks/decision-notifier.mjs`로 로컬 알림을 보냅니다. Codex는 동일한 정책을 따르되, 필요할 때 `./harness notify-decision`을 직접 호출합니다.

## 오케스트레이터 실행 모델

메인 에이전트는 모든 세부 작업을 오래 붙잡고 있기보다 오케스트레이터 역할을 합니다. 자세한 구조는 [ARCHITECTURE.md](ARCHITECTURE.md)를 참고합니다.

```text
사용자 요청
  -> 메인 에이전트
      -> Strategy / Project Structure / Implementation / Validation / Completion
```

1~5단계는 개발 사고 흐름입니다. 로컬 feature spec 파일을 매번 만드는 규칙이 아닙니다. 여러 phase에 걸치는 작업은 외부 GSD가 만드는 `.planning/`을 커밋해 상태를 남깁니다.

사용자는 매번 `GSD`, `GStack`, `Superpowers`를 직접 언급할 필요가 없습니다. 하네스가 내부 역할을 배정합니다. 세 도구를 항상 합쳐 쓰지 않고, 작업 크기와 phase 리스크에 맞춰 가장 필요한 도구만 고릅니다.

### Team Mode

일반 실행은 아래 두 명령입니다.

```sh
./harness codex
./harness claude
```

큰 작업에서 역할별 terminal이 필요하면 팀 모드를 선택합니다.

```sh
./harness team
./harness team claude
./harness team --agent codex
./harness team --agent claude
./harness team --dry-run
```

팀 모드는 shared preflight를 한 번 실행하고, macOS에서는 cmux를 먼저 쓰며 없으면 tmux로 fallback합니다. cmux/tmux가 없어도 `./harness doctor`는 실패하지 않고 선택 readiness warning만 냅니다.

기본 역할은 `orchestrator`, `planner`, `implementer`, `reviewer`, `qa`, `shell`입니다. 각 process는 `CODI_TEAM_ROLE`/`CODI_AGENT_ROLE`을 받습니다. 역할 간 전달은 `.harness/policies/orchestration-loop.md`의 handoff contract를 따르고, durable state는 GSD `.planning/`에 남깁니다.

팀 모드를 실행하거나 개선할 때는 `codi-phase-routing`과 함께 `team-mode-operator` skill을 사용합니다. cmux 공식 skill이 설치된 환경에서는 `cmux-workspace`, `cmux-diagnostics`, `cmux-markdown`을 우선 사용하고, tmux fallback에서는 pane title과 `tmux-agent-status` 같은 상태 표시 도구를 우선합니다.

### Phase별 기본 라우팅

새 작업을 시작하기 전에 `.planning/`이 있으면 GSD progress/manager 상태를 먼저 확인합니다. `.planning/.continue-here.md`, paused 상태, 진행 중인 phase가 있으면 사용자가 명시적으로 새 작업을 지시하지 않는 한 기존 작업을 우선 이어갑니다.

| 단계 | 기본 방향 |
| --- | --- |
| 1. Strategy | GStack `cso` 기본 보안 gate + 필요한 decision gate, 필요 시 Superpowers brainstorming |
| 2. Project and plan | GSD codebase map, milestone, discuss, phase plan |
| 3. Execution | GSD execute + Superpowers TDD/debugging/plan execution |
| 4. Review / Verification | GSD code review/verify + GStack review/QA/design/DX/perf gate |
| 5. Ship / Completion | GStack `ship` release gate + GSD audit/summary/complete |

상세 스킬 매핑과 조건부 스킬은 `.harness/policies/scenario-phase-routing.md`가 source of truth입니다.

### 작업 규모별 기본 적용

| 규모 | 기준 | 적용 |
| --- | --- | --- |
| 소 | 방향과 대상이 고정되어 있고, 영향 범위가 작고, 쉽게 되돌릴 수 있으며, 바로 검증 가능한 기계적 수정 | 직접 처리 |
| 중 | 파일 1개여도 무엇을 확인하고 무엇을/어떻게 바꾸며 어떻게 검증할지 에이전트 판단이 필요한 순간 | 필요한 phase와 외부 도구만 사용 |
| 대 | 여러 phase, 여러 소유 영역, 역할 검토, handoff, 사용자 workflow/API 영향, 넓은 영향 | GSD phase + 필요한 GStack gate + Superpowers |
| 특대/위험 | production, deploy/rollback, CI/CD, infra, DB schema/data 이동, auth, permission, payment, security, secret, privacy, 파괴적 작업, 되돌리기 어려운 작업 | Triple Crown 전체 흐름과 명시적 checkpoint |

파일 개수, 키워드, 사용자가 붙인 규모 라벨은 결정적인 신호가 아닙니다. 작은 작업으로 시작했더라도 판단 지점이나 더 큰 리스크가 드러나면 즉시 중/대 이상으로 올립니다.

### 자동 라우팅 안내

사용자는 짧게 요청하고, phase·스킬 선택은 에이전트가 맡습니다. 매핑 기준은 `.harness/policies/scenario-phase-routing.md`입니다.

자동화 동작은 에이전트별로 다릅니다.

- Claude Code는 UserPromptSubmit hook이 매 프롬프트마다 `.harness/hooks/skill-injector.mjs`를 호출해 키워드 매칭으로 스킬을 *제안*합니다(강제 아님).
- Codex는 `./harness codex` 시작 시 preflight 1회 + `AGENTS.md` 텍스트 정책으로 동작합니다. 매 응답마다 phase 표를 직접 적용해야 합니다.

```text
이 기능을 Triple Crown 흐름으로 진행해줘.
GSD milestone과 phase plan을 만들어줘.
계획된 GSD phase를 실행해줘.
리뷰와 검증까지 마무리해줘.
```

## 전체 작업 순서

### 1. Strategy

문제, 제약, 모르는 점, 가능한 접근을 정리합니다. 아직 구현하지 않습니다.

- GStack: `cso`, 필요 시 `office-hours`, `autoplan`
- 조건부 GStack: `plan-ceo-review`, `plan-eng-review`, `plan-design-review`, `plan-devex-review`
- Superpowers: 창의적 기능, 제품 방향, 아키텍처 선택이 있으면 `brainstorming`

```text
이 작업을 strategy 단계로 정리해줘.
```

### 2. Project Structure

구현 범위, acceptance criteria, 작업 순서, 리스크, 리뷰 게이트를 정합니다.

- GSD: `gsd-map-codebase`, `gsd-new-project`, `gsd-new-milestone`, `gsd-discuss-phase`, `gsd-plan-phase`
- GStack: 열린 decision gate가 있으면 해당 role review
- Superpowers: 별도 구현 계획이 유용할 때만 `writing-plans`, 격리 작업이 필요하면 `using-git-worktrees`
- 결과 상태는 `.planning/`에 남기고 커밋합니다.

GStack은 모든 planning에 고정으로 붙이지 않습니다. scope, architecture, UX, security, release confidence 중 열린 decision gate가 있을 때 해당 gate만 사용합니다.

```text
GSD milestone과 phase plan을 만들어줘.
```

### 3. Implementation

작은 단위로 구현하고, 가능한 경우 테스트를 먼저 작성합니다.

- GSD: `gsd-execute-phase`, 이어가기에는 `gsd-progress --next`, `gsd-resume-work`, `gsd-pause-work --report`
- Superpowers: `test-driven-development`, `systematic-debugging`, `executing-plans`, 필요 시 `dispatching-parallel-agents`, `subagent-driven-development`
- Codi Skills: `codi-frontend` / `codi-backend` / `nestjs-expert` / `codi-db` / `codi-dev-workflow` / `codi-dependency-review`

문서 전용, 주석 전용, 기계적 formatting, 실행 동작이 없는 순수 설정 scaffold는 TDD 예외로 기록할 수 있습니다.

```text
계획된 GSD phase를 실행해줘.
```

직접 명령을 실행할 때는 mise task를 우선 사용합니다.

```sh
mise run test
mise run typecheck
mise run lint
```

task가 없으면 `mise exec -- npm run test`, `mise exec -- npm run build` 형태로 실행합니다.

### 4. Validation / Review

버그, 회귀, 보안 문제, UX 문제, 유지보수 리스크를 찾습니다.

- GSD: `gsd-code-review`, `gsd-verify-work`, validation coverage gap 보강이 필요할 때 `gsd-validate-phase`
- GStack: 코드 리뷰는 `review`, QA는 `qa`/`qa-only`, 보안은 `cso`, UX/DX/perf는 `design-review`/`devex-review`/`benchmark`
- Superpowers: `requesting-code-review`, `receiving-code-review`, `verification-before-completion`

```text
review phase를 진행해줘.
```

### 5. Completion / Ship

실제로 동작하는지 명령, 테스트, 로그, 화면 확인으로 증명하고 완료 상태를 닫습니다.

- GStack: `ship`, 필요 시 `document-release`, `canary`, `retro`
- GSD: PR 준비를 GSD phase state에서 생성해야 할 때만 `gsd-ship`을 먼저 사용하고, milestone 마무리는 `gsd-audit-milestone`, `gsd-complete-milestone`, `gsd-milestone-summary`
- Superpowers: `finishing-a-development-branch`, `verification-before-completion`

```text
verification과 ship 준비까지 마무리해줘.
```

## 신규 프로젝트 초기화

`init-project`는 두 가지 방식으로 사용할 수 있습니다.

### 에이전트에게 `init-project` 스킬을 요청하는 방식 (권장)

에이전트가 다음을 판단합니다.

- 완전 신규 프로젝트인지
- 이미 `apps/front` 또는 `apps/back`이 있는지
- 기존 별도 레포를 `git subtree add`로 가져와야 하는지
- Frontend 배포가 Vercel/PM2/Docker 중 무엇인지
- Backend 배포가 PM2/Docker 중 무엇인지
- Infisical Project ID와 Machine Identity가 준비되었는지

요청 예:

```text
새 프로젝트 초기화를 도와줘.
기존 back 레포를 현재 dev 프로젝트의 apps/back으로 통합해줘.
프론트는 Next.js, 백엔드는 NestJS로 하고 배포는 front Vercel, back PM2로 갈게.
```

### `./harness init-project`를 직접 실행하는 방식

이 명령은 오케스트레이터가 아니라 결정적 실행 스크립트입니다. 사용법과 옵션은 README의 "프로젝트 초기화" 섹션을 참고합니다.

이 스크립트가 **하지 않는 일**:

- 앱 구조 설계
- `apps/front` 또는 `apps/back` 스캐폴딩 판단
- 기존 레포 import 판단
- Infisical 프로젝트/폴더/시크릿 생성
- Machine Identity 생성
- Vercel 프로젝트 연결
- Cloudflare Tunnel 구성
- 배포 방식 선택에 따른 워크플로우 리뷰

처음 프로젝트를 만들 때는 에이전트에게 `init-project` 스킬로 계획과 검토를 먼저 맡기고, 준비가 끝난 뒤 `./harness init-project`를 실행하는 흐름을 권장합니다.

### git 히스토리 분리

하네스를 `git clone`으로 받으면 `.git`에 하네스의 전체 히스토리와 `v1`/`v2` 버전 브랜치, 하네스 origin이 따라옵니다. 이 `.git`을 그대로 둔 채 새 프로젝트를 초기화하면 버전 브랜치가 프로젝트에 남고, 기존 레포를 `git subtree`로 통합할 때 그 레포의 브랜치와 충돌합니다.

`./harness init-project`는 하네스 clone 상태(`codi-harness` origin 또는 `v1`/`v2` 브랜치)를 감지하면 경고하고, `--reset-git`을 주면 `.git`을 제거한 뒤 새 git 히스토리(`main` 브랜치)로 다시 시작합니다. 직접 하려면 초기화 전에 다음을 실행합니다.

```sh
rm -rf .git && git init && git checkout -b main
```

기존 front/back 레포 통합은 `git subtree add --prefix=apps/<front|back> <remote>/<branch> --squash`를 사용합니다. `--squash`로 외부 레포 히스토리를 단일 커밋으로 합쳐 모노레포 히스토리를 깔끔하게 유지하고, 외부 레포 브랜치 tip이 이 레포 ref에 섞이지 않게 합니다.

## Infisical 준비 체크리스트

`./harness init-project`를 실행하기 전에 아래를 준비합니다.

1. **Infisical 프로젝트 생성** — 프로젝트명 `codi-{project}`, URL `https://env.co-di.com`
2. **프로젝트 경로 생성** — `/backend`, `/backend/github-actions`, `/frontend`, `/frontend/github-actions`
3. **Shared-Secrets 접근 확인** — `/slack`, `/vercel`, `/cloudflare/<domain>/<subdomain>`(Cloudflare Tunnel 사용 시)
4. **Machine Identity 생성** — Organization Access Control > Machine Identities, Auth Method: Universal Auth, TTL: 0
5. **Machine Identity 권한 부여** — `codi-{project}`에 Read, Shared-Secrets에 Read
6. **Client ID와 Client Secret 확보**

```sh
export INFISICAL_PROJECT_ID="<project-id>"
export INFISICAL_CLIENT_ID="<client-id>"
export INFISICAL_CLIENT_SECRET="<client-secret>"
```

Client Secret은 생성 직후 한 번만 볼 수 있으므로 바로 저장합니다.

Cloudflare Tunnel을 쓰는 PM2/Docker 배포 프로젝트만 Shared-Secrets의 Cloudflare 경로 접근 권한이 필요합니다. 해당 프로젝트는 PM2/Docker workflow의 top-level env에서 `USE_CLOUDFLARE_TUNNEL: "true"`로 설정합니다. 이 boolean은 Infisical secret으로 관리하지 않습니다.

## CI/CD 운영

배포 워크플로우 목록과 정책은 README의 "프로젝트 관리 > 배포"를 참고합니다.

한 앱에 대해 `push`로 활성화된 워크플로우는 하나만 둡니다. 배포 방식을 바꿀 때는 새 워크플로우를 `workflow_dispatch`로 먼저 테스트한 뒤, 기존 `push`를 끄고 새 `push`를 켭니다.

## 작업 완료 전 체크

완료 전 최소 확인:

```sh
./harness doctor
```

`.harness` 스크립트, 훅, 정책, 또는 워크플로우를 수정했다면 하네스 회귀
스위트를 함께 실행합니다. `tests/`는 하네스 자체를 검증하는 shared 파일로,
`./harness update --apply-harness`가 `.harness`와 함께 덮어쓰기 동기화합니다
(소유권 규칙은 `.harness/policies/update-policy.md` 참고).

```sh
npm test
```

프로젝트 코드가 있다면 가능한 범위에서:

```sh
mise run typecheck
mise run lint
mise run test
mise run build
```

task가 없다면 각 앱의 `package.json`을 확인한 뒤 `mise exec -- npm ...` 형태로 실행합니다.
