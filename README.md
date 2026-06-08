# Codi Harness v2

> **이 파일은 project-owned입니다.** 다운스트림 프로젝트는 자신의 README를 자유롭게 수정할 수 있습니다. `./harness update --apply-harness`는 이 파일을 덮어쓰지 않습니다. 분류 기준은 [.harness/policies/update-policy.md](./.harness/policies/update-policy.md) 참고.

Codex와 Claude Code를 같은 런타임, 같은 스킬, 같은 작업 흐름, 같은 검증 기준으로 사용하기 위한 팀 공용 에이전트 하네스입니다.

세부 정책은 본문이 아니라 아래 문서에 있습니다. 이 README는 빠른 시작과 길찾기만 담당합니다.

| 문서 | 용도 |
| --- | --- |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 실제 개발 절차, phase별 라우팅, 스킬 사용 순서, 초기화 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 메인 오케스트레이터와 phase별 실행 구조 |
| [AGENTS.md](AGENTS.md) / [CLAUDE.md](CLAUDE.md) | Codex / Claude Code 진입점 |
| [.harness/policies/](./.harness/policies) | 공통 정책 (컨텍스트, 가드레일, 권한, 업데이트, TDD 등) |

---

## 신규 사용자: 빠른 시작

처음 클론한 팀원이 에이전트를 실행할 수 있는 상태까지 가는 최단 경로입니다.

### 1. 필수 도구

| 도구 | 용도 |
| --- | --- |
| Git | 저장소 클론 |
| mise | Node.js 24 런타임 설치 |
| npm / pnpm | 하네스 루트는 npm, 앱 스택별 패키지 매니저는 아래 표 참고 |
| Codex CLI 또는 Claude Code | 에이전트 실행 |
| GitHub CLI `gh` | `init-project`로 GitHub repo를 만들고 `wire-infisical`로 bootstrap Secret을 등록할 때 |
| Infisical CLI | 로컬 개발에서 Infisical secret을 주입할 때 |

`mise`가 없다면 먼저 설치합니다.

```sh
curl https://mise.run | sh
echo 'eval "$(~/.local/bin/mise activate zsh)"' >> ~/.zshrc
```

### 2. 클론 후 세팅

하네스를 새 프로젝트의 출발점으로 쓸 때는 프로젝트 이름의 폴더로 클론합니다. `git clone <repo-url>`만 쓰면 폴더가 `codi-harness`로 생기므로 폴더명을 직접 지정합니다.

```sh
git clone <repo-url> codi-<project>
cd codi-<project>
mise trust && mise install
./harness install
./harness doctor
```

`mise trust`와 `mise install`은 반드시 같이 실행합니다. `mise trust`만 실행하면 Node.js 24 런타임이 설치되지 않아 다음 `./harness install`이 실패합니다.

이렇게 클론한 `.git`에는 하네스 레포의 전체 히스토리와 `v1`/`v2` 버전 브랜치, 하네스 origin이 그대로 들어 있습니다. **새 프로젝트로 시작할 때는 git 히스토리를 새로 시작해야 합니다.** `./harness init-project`가 `--reset-git` 옵션으로 이를 처리하며(아래 "프로젝트 초기화" 참고), 직접 하려면 다음과 같이 합니다.

```sh
rm -rf .git && git init && git checkout -b main
```

> 하네스 자체를 개발/기여하려고 클론한 경우에는 `.git`을 그대로 둡니다. 이 초기화는 새 프로젝트를 시작할 때만 필요합니다.

`./harness install`은 open-gsd GSD runtime skill 배포, GStack team setup, Superpowers plugin marketplace 설치 안내, `.agents/skills`/`.claude/skills` 머지 트리 생성을 수행합니다. GStack clone 원본은 기본적으로 `~/.claude/skills/gstack`에 저장되며, 필요하면 `GSTACK_SOURCE_DIR` 절대경로로 위치를 바꿉니다.

`./harness doctor`의 실패가 0개여야 합니다.

### 3. 에이전트 실행

```sh
./harness codex     # Codex
./harness claude    # Claude Code
```

`codex`, `claude`를 직접 실행하지 말고 하네스 런처를 사용합니다. 런처는 update-check, 안전 자동 하네스 적용, context-check, JSON config parse, skill-injector smoke를 preflight로 실행합니다. `HARNESS_AUTO_UPDATE=0`이면 체크와 자동 적용을 모두, `HARNESS_AUTO_APPLY=0`이면 자동 적용만 건너뜁니다.

팀 모드는 큰 작업에서만 선택적으로 사용합니다.

```sh
./harness team
./harness team claude
./harness team --agent codex
./harness team --agent claude
./harness team --dry-run
```

`./harness team`은 cmux-first, tmux fallback으로 역할별 terminal을 띄웁니다. cmux/tmux는 필수 의존성이 아니며, 없더라도 일반 `./harness codex`와 `./harness claude` 흐름은 그대로 동작합니다.

### 4. 선택 세팅

Infisical 로컬 개발이 필요하면:

```sh
infisical login --domain=https://env.co-di.com
```

GitHub repo 생성과 bootstrap Secret 등록을 자동화하려면:

```sh
gh auth login
```

---

## 일상 사용자: 작업 흐름

중요한 작업은 항상 아래 순서로 진행합니다.

1. Brainstorming
2. Planning
3. Execution
4. Review
5. Verification

대화 기록은 작업의 최종 출처가 아닙니다. 여러 phase에 걸치는 작업 상태는 외부 GSD가 만드는 `.planning/`에 남기고 커밋합니다.

새 기능이나 큰 변경을 시작할 때는 Triple Crown 흐름을 사용합니다. 이미 `.planning/`이 있으면 새 작업을 만들기 전에 GSD progress/manager 상태를 먼저 확인하고, 진행 중이거나 보류된 phase가 있으면 그 작업을 우선 이어갑니다.

```text
Phase 1 Strategy       GStack cso + decision gates; Superpowers brainstorming when needed
Phase 2 Plan           GSD map/discuss/plan/milestone state
Phase 3 Execution      GSD execute + Superpowers TDD/debugging/plan execution
Phase 4 Verification   GSD review/verify + GStack review/QA gates
Phase 5 Completion     GStack ship gate + GSD audit/summary/complete; gsd-ship only for GSD-state PR prep
```

phase별 GSD/GStack/Superpowers 라우팅, Codi 스킬 선택, 실제 개발 절차는 [CONTRIBUTING.md](CONTRIBUTING.md)와 [.harness/policies/scenario-phase-routing.md](./.harness/policies/scenario-phase-routing.md)를 참고합니다.

> **자동 라우팅 안내** — 자연어로 요청하면 에이전트가 phase와 스킬을 선택합니다. 키워드를 명시할 필요는 없습니다. Claude Code는 매 프롬프트마다 `.harness/hooks/skill-injector.mjs`가 키워드 매칭으로 스킬을 *제안*하고, Codex는 `./harness codex` 시작 시 preflight 1회만 동작합니다. 두 경우 모두 *유도이지 강제 아님*. 자세한 매핑은 `.harness/policies/scenario-phase-routing.md`.

큰 작업에서 팀 모드를 켜도 source of truth는 pane scrollback이 아닙니다. phase handoff, 결정, 검증 결과는 기존 원칙대로 GSD `.planning/`, PR, verification 기록에 남깁니다.

### 패키지 매니저

| 대상 | 스택 | 패키지 매니저 |
| --- | --- | --- |
| 하네스 루트 | - | `npm` |
| `apps/front` | React-only | `npm` |
| `apps/front` | Next.js | `pnpm` |
| `apps/back` | Express | `npm` |
| `apps/back` | NestJS | `pnpm` |

`yarn`과 `bun`은 사용하지 않습니다. 프로젝트에 `mise` task가 있으면 `mise run`을 우선합니다.

### 스킬

스킬은 두 소스에서 옵니다:

- `.harness/skills/` — **상류 공유**. 모든 Codi 프로젝트가 같은 내용을 받습니다. `./harness update --apply-harness`가 덮어씁니다. 다운스트림에서 수정 금지입니다. 읽기 전용 inspection, audit, safe diff는 허용됩니다.
- `.harness/skills-local/` — **프로젝트 전용**. 이 프로젝트만의 skill. 업데이트가 절대 손대지 않고, 다른 프로젝트로 propagate되지 않습니다.

Codex와 Claude Code는 `.agents/skills/`와 `.claude/skills/` 머지 트리를 통해 두 소스를 동시에 봅니다. `./harness skills-link`가 install/preflight/pre-commit 시 자동으로 두 소스를 머지해 머지 트리를 다시 만듭니다. 두 소스에서 같은 이름을 쓰면 머지 단계가 fail합니다 — 로컬 skill을 다른 이름으로 바꾸세요. 상류 skill을 덮어쓰는 fork는 지원하지 않습니다.

새 skill을 만들 때:

- **하네스 레포에서**: `.harness/skills/<name>/`에 둡니다. 모든 다운스트림이 받게 됩니다.
- **다운스트림 프로젝트에서**: 반드시 `.harness/skills-local/<name>/`에 둡니다.

`.harness/skills/skill-creator/`는 [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/skill-creator)에서 가져온 skill 작성 도우미입니다. 자세한 정책은 `.claude/rules/skill-ownership.md` 참고.

`codi-phase-routing`은 외부 GSD/GStack/Superpowers 호출 순서를 요약하는 routing skill입니다. upstream 도구의 복제본이 아닙니다.

주요 도메인 스킬:

| 스킬 | 용도 |
| --- | --- |
| `codi-frontend` | React/Next.js, Tailwind, shadcn/ui, better-auth |
| `codi-backend` | TypeScript Express/NestJS |
| `nestjs-expert` | NestJS 전용 아키텍처, DI, 모듈, 테스트 |
| `codi-db` | DB 모델링, 마이그레이션, 인덱스 |
| `codi-dev-workflow` | mise, npm, CI/CD, 검증 파이프라인 |
| `codi-dependency-review` | npm audit, OSV, Renovate, lockfile 리뷰 |
| `init-project` | 신규 프로젝트 초기화, Infisical 연결, 기존 레포 통합 |
| `skill-creator` | 신규 skill 작성, 기존 skill 개선, eval 실행 |
| `team-mode-operator` | `./harness team`, cmux/tmux 역할 pane, worktree 격리, handoff 규칙 |

---

## 프로젝트 관리

### 프로젝트 프로필

앱 구조는 [.harness/config/project-profile.yaml](.harness/config/project-profile.yaml)에서 관리합니다.

| mode | 설명 |
| --- | --- |
| `split-front-back` | `apps/front`와 `apps/back`을 모두 사용 |
| `next-fullstack` | `apps/front`의 Next.js 하나에서 UI와 backend behavior를 모두 처리 |
| `frontend-only` | `apps/front`만 사용 |
| `backend-only` | `apps/back`만 사용 |

```sh
./harness profile list
./harness profile show
./harness profile set backend-only
```

프로필 변경은 architecture decision이므로 GSD가 관리하는 `.planning/`에 기록합니다.

### 프로젝트 초기화

새 프로젝트나 기존 front/back 레포를 `codi-{project}` 모노레포에 통합할 때:

```sh
./harness init-project <project-name> --org CODIWORKS-Engineer --mode split-front-back
```

초기화 흐름은 두 단계로 나뉩니다. 먼저 `init-project`가 GitHub 레포 생성/재사용, `codi-engineers` 팀 권한 부여, `origin` 설정을 수행합니다. 그 다음 사용자가 Infisical 콘솔에서 프로젝트와 Machine Identity를 만든 뒤 `./harness wire-infisical <project-name>`을 실행해 `.infisical.json` 치환, `_PROJECT_ID_` 치환, GitHub Secrets 등록을 끝냅니다. 기본 실행은 commit/push를 하지 않으며, 자동 push가 필요하면 `--push`를 추가합니다.

Infisical 콘솔 작업이 끝난 뒤:

```sh
export INFISICAL_PROJECT_ID="<project-id>"
export INFISICAL_CLIENT_ID="<client-id>"
export INFISICAL_CLIENT_SECRET="<client-secret>"
./harness wire-infisical <project-name> --org CODIWORKS-Engineer
```

스크립트가 끝난 뒤에도 Infisical 콘솔 작업(프로젝트/환경/Path/Machine Identity), `wire-infisical` 실행, `_CF_SHARED_PATH_` placeholder 치환, GitHub Dependabot/Renovate/Branch protection 설정처럼 후속 단계가 남습니다. 정본 체크리스트는 [.harness/docs/init-project-post-setup.md](./.harness/docs/init-project-post-setup.md)에 모두 모아두었습니다.

하네스를 `git clone`으로 받은 `.git`을 그대로 둔 채 초기화하면 하네스의 `v1`/`v2` 버전 브랜치가 새 프로젝트에 남고, 기존 레포를 `git subtree`로 통합할 때 그 레포의 브랜치와 충돌할 수 있습니다. `init-project`는 이 상태를 감지하면 경고하며, `--reset-git`을 주면 하네스 `.git`을 제거하고 새 git 히스토리(`main` 브랜치)로 다시 시작합니다.

```sh
./harness init-project <project-name> --org CODIWORKS-Engineer --reset-git
```

앱 내부 구조는 `init-project`가 강제로 만들지 않습니다. `create-next-app`, Nest CLI, Express 초기화 결과를 우선합니다.

기존 front/back 레포를 통합할 때는 `git subtree add --prefix=apps/<front|back> <remote>/<branch> --squash`를 사용합니다. `--squash`는 외부 레포의 전체 커밋을 단일 커밋으로 합쳐 모노레포 히스토리를 깔끔하게 유지합니다. 상세 절차는 에이전트에게 `init-project` 스킬로 요청하면 안내됩니다.

### Infisical

GitHub Secrets에는 아래 두 개만 둡니다.

```text
INFISICAL_CLIENT_ID
INFISICAL_CLIENT_SECRET
```

나머지 시크릿은 Infisical에서 관리합니다.

| 경로 | 용도 |
| --- | --- |
| `/backend` | 백엔드 런타임 환경변수 |
| `/backend/github-actions` | 백엔드 배포 변수 |
| `/frontend` | 프론트엔드 런타임 환경변수 |
| `/frontend/github-actions` | 프론트엔드 배포 변수 |
| Shared-Secrets `/slack` | Slack 알림 |
| Shared-Secrets `/vercel` | Vercel 토큰 |
| Shared-Secrets의 Cloudflare 경로 | Cloudflare Tunnel을 쓰는 PM2/Docker 배포의 Access 값 |

로컬 개발에서 Infisical CLI가 설치/로그인되어 있고 앱의 `.infisical.json`이 유효하면 `dev-runner`가 자동으로 `infisical run`을 사용합니다.

### 배포

GitHub Actions 워크플로우는 `.github/workflows` 아래에 있습니다.

| 종류 | 워크플로우 |
| --- | --- |
| Frontend | `deploy-frontend-vercel.yml`, `deploy-frontend-pm2.yml`, `deploy-frontend-docker.yml` |
| Backend | `deploy-backend-pm2.yml`, `deploy-backend-docker.yml` |

기본값은 Frontend Vercel, Backend PM2입니다. 한 앱에 대해 `push`로 활성화된 배포 워크플로우는 하나만 있어야 합니다.

PM2 또는 static 배포 서버에는 공용 서버 배포 스크립트를 1회 배치합니다.

```sh
scp .harness/scripts/deploy/server-deploy.sh <user>@<server>:~/server-deploy.sh
ssh <user>@<server> "chmod +x ~/server-deploy.sh"
```

Cloudflare Tunnel SSH 구성이 필요하면 PM2/Docker workflow의 top-level env에서 `USE_CLOUDFLARE_TUNNEL: "true"`로 바꾸고 [.harness/docs/cloudflare-tunnel-ssh-guide.md](./.harness/docs/cloudflare-tunnel-ssh-guide.md)를 참고합니다.

---

## 운영자: 업데이트와 중앙 소스

업데이트 정책은 [.harness/policies/update-policy.md](./.harness/policies/update-policy.md)가 source of truth입니다. 아래는 요약입니다.

| 대상 | 정책 |
| --- | --- |
| Codi Harness Repo | daily check-only, 다운스트림은 `update --apply-harness`로 선택 적용 |
| GStack | 팀 모드 기반 managed latest |
| GSD | weekly check-only |
| Superpowers | weekly check-only |
| Karpathy-Style | 저장소 정책 파일로 버전 관리 |
| Codi Skills | 저장소에 버전 관리 |

### 이 하네스 레포에서

`./harness install`은 `.harness/skills`를 갱신하지 않습니다. 하네스 레포 자체의 변경은 `git pull`, PR merge, 브랜치 전환 같은 일반 git 흐름으로 들어옵니다.

### 다운스트림 앱 레포에서

중앙 하네스의 공통 파일만 선택 적용합니다.

```sh
./harness update-check
./harness update --check
./harness update --apply-harness
```

이 명령은 `.github/workflows`, `README.md`, `mise.toml`, `package.json`, lockfile, `.harness/config/project-profile.yaml`, `.harness/state`, `apps/**`처럼 프로젝트별로 달라지는 파일은 보존합니다. 여기에는 app-local `apps/*/AGENTS.md`, `apps/*/CLAUDE.md`, `apps/*/.env.example`, `apps/*/.infisical.json`, 앱 소스와 앱별 패키지 파일이 포함됩니다. 루트 `AGENTS.md`와 `CLAUDE.md`는 공통 진입점이므로 업데이트 대상입니다.

중앙 하네스의 `apps/**` 파일은 신규/기존 앱 adopt용 참조 템플릿입니다. 다운스트림 업데이트 체크와 자동 적용은 실제 앱 코드와 app-local 설정을 비교하거나 덮어쓰지 않습니다.

런처는 시작 시 `./harness update --apply-harness --auto`를 사용합니다. 이 모드는 shared harness path에 local change가 있으면 warning만 출력하며 적용하지 않고, upstream 삭제도 자동 삭제하지 않습니다. 삭제 반영, stale skill directory 정리, dirty path 처리는 수동 `./harness update --apply-harness`에서만 수행합니다.

`update --apply-harness`는 변경된 공유 파일을 적용한 뒤, 상류 `.harness/shared-manifest.json`을 기준으로 다운스트림 worktree에서 stale 공유 파일을 prune합니다. 평면 시절 `.harness/scripts/<name>.sh`나 삭제된 `.harness/skills/<name>/`처럼 상류 rename/move/delete로 더 이상 존재하지 않는 파일과 빈 디렉터리가 정리됩니다. 로컬 수정이 있는 stale 파일은 warning과 함께 보존됩니다.

기본 출력은 건너뛴 project-owned 경로, 적용 파일, 복구 파일, prune 파일 개수만 요약합니다. 전체 파일 목록이 필요하면 `./harness update --apply-harness --verbose` 또는 `HARNESS_UPDATE_VERBOSE=1 ./harness update --apply-harness`를 사용합니다.

중앙 하네스 확인 경로 기본값은 `https://github.com/CODIWORKS-Engineer/codi-harness.git#v2`입니다. 필요하면 `HARNESS_SOURCE_REPO`, `HARNESS_SOURCE_REF` 또는 `--source-repo`, `--source-ref`로 바꿉니다.

### 컨텍스트 진입점 검사

```sh
./harness context-check
```

`AGENTS.md`와 `CLAUDE.md`가 공통 `.harness` 정책을 참조하는지, 두 파일이 시작 컨텍스트를 낭비할 만큼 커지지 않았는지 확인합니다. `./harness doctor`도 이 검사를 함께 실행합니다.

---

## Reference

### 주요 파일

| 경로 | 설명 |
| --- | --- |
| `AGENTS.md` | Codex 진입점 |
| `CLAUDE.md` | Claude Code 진입점 |
| `CONTRIBUTING.md` | 실제 개발 절차, 스킬 사용 순서, 초기화 |
| `ARCHITECTURE.md` | 메인 오케스트레이터와 phase별 실행 구조 |
| `harness` | 하네스 런처 |
| `mise.toml` | 하네스 루트 Node.js 24 런타임 |
| `.harness/manifest.json` | 하네스 구성 매니페스트 |
| `.harness/shared-manifest.json` | 다운스트림에 적용/prune 대상이 되는 공유 파일 전체 목록 (자동 생성) |
| `.harness/skills` | 상류 공유 skill (업데이트 시 덮어쓰기) |
| `.harness/skills-local` | 프로젝트 전용 skill (업데이트가 절대 손대지 않음) |
| `.harness/lock.json` | 외부 도구 버전/소스 정책 |
| `.harness/config/codi-config.yaml` | Codi 하네스 설정 |
| `.harness/config/skill-triggers.json` | 프롬프트 기반 스킬 매칭 |
| `.harness/hooks` | Claude hook, 스킬 주입, 테스트 출력 필터, HUD |
| `.harness/policies/` | 가드레일, 컨텍스트, 권한, 업데이트, TDD 등 |
| `.harness/scripts` | 설치, 업데이트, doctor, init-project, dev-runner, 배포 |
| `.harness/skills` | Codex/Claude 공용 스킬 원본 |

### 자주 쓰는 명령

```sh
./harness doctor
./harness context-check
./harness workflow-check
npm test
./harness update-check
./harness update --apply-harness
./harness manifest    # 하네스 레포에서만 사용 — shared-manifest.json 재생성
./harness skills-link # .claude/skills, .agents/skills 머지 트리 재생성
./harness notify-decision "사용자 결정이 필요합니다"
./harness codex
./harness claude
./harness init-project <project-name> --org CODIWORKS-Engineer
./harness wire-infisical <project-name> --org CODIWORKS-Engineer
```

외부 phase 도구는 각 런타임 UI에서 실행합니다. Claude Code는 `/gsd-*`, Codex는 `$gsd-*` 문법을 씁니다. 아래 예시는 Codex 문법이며, Claude Code에서는 `$`를 `/`로 바꿔 호출합니다.

```text
$gsd-progress
$gsd-manager
$gsd-plan-phase
$gsd-execute-phase
$gsd-verify-work
/review
/qa
```

### 운영 원칙

- 작업 상태는 채팅이 아니라 `.planning/`에 남깁니다.
- 새 Medium 이상 작업 전에는 기존 `.planning/` 상태를 먼저 확인합니다.
- Small은 방향/대상/검증이 고정되고 되돌리기 쉬운 로컬 수정일 때만 적용합니다.
- 무엇을 확인하고 바꿀지 에이전트 판단이 필요하면 Medium 이상으로 올립니다.
- production, data, security, deploy, auth/payment/permission, secret, destructive work는 Large 이상 위험 작업으로 봅니다.
- 실행 단계에서는 Superpowers의 TDD 흐름을 기본으로 합니다.
- 중요한 의사결정은 필요한 GStack 역할 리뷰를 거칩니다.
- 컨텍스트가 길어지는 작업은 GSD 방식으로 경계와 검증 기록을 유지합니다.
- 공유 스킬은 `.harness/skills`에서 관리하고, 프로젝트별 스킬은 `.harness/skills-local`에 둡니다. 다운스트림은 공유 스킬을 수정하지 않지만 읽기 전용 비교와 감사는 할 수 있습니다.
- 시크릿은 Infisical을 원본으로 삼고 GitHub Secrets를 최소화합니다.
- 개인 선호는 repo에 커밋하지 않습니다(`AGENTS.local.md`, `CLAUDE.local.md`, `.claude/settings.local.json`, `.codex/config.toml`은 로컬 전용).
