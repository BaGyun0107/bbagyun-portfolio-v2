# Codi Harness — 팀 온보딩 개요

> 이 문서는 팀원이 **하네스의 전체 그림**을 한 번에 이해하도록 만든 설명서입니다.
> "무엇으로, 어떻게 구성돼 있고, 왜 그런가"를 다룹니다.
> "어떻게 실행하는가(설치·명령)"는 [README.md](../README.md),
> 실제 개발 절차는 [CONTRIBUTING.md](../CONTRIBUTING.md),
> 오케스트레이터 내부 실행 모델은 [ARCHITECTURE.md](../ARCHITECTURE.md)를 봅니다.

## 목차

1. [한 줄 정의](#1-한-줄-정의)
2. [기본 구조: thin harness, external tools, fat skills](#2-기본-구조)
3. [통합된 3개 외부 프레임워크](#3-통합된-3개-외부-프레임워크)
4. [무엇을 설치하는가](#4-무엇을-설치하는가)
5. [규칙과 정책의 계층 구조](#5-규칙과-정책의-계층-구조)
6. [Claude Code와 Codex 병렬 적용](#6-claude-code와-codex-병렬-적용)
7. [훅(hooks): 차단과 경고](#7-훅-hooks)
8. [스킬 시스템](#8-스킬-시스템)
9. [작업 워크플로우와 페이즈 라우팅](#9-작업-워크플로우와-페이즈-라우팅)
10. [기능정의와 팀 허브](#10-기능정의와-팀-허브)
11. [개인 로컬 설정 (local override)](#11-개인-로컬-설정-local-override)
12. [모델과 서브에이전트 모델](#12-모델과-서브에이전트-모델)
13. [팀원 온보딩 체크리스트](#13-팀원-온보딩-체크리스트)

---

## 1. 한 줄 정의

**Codi Harness는 Codex와 Claude Code를 같은 런타임·같은 스킬·같은 작업 흐름·같은 검증 기준으로 쓰기 위한 팀 공용 에이전트 하네스입니다.**

핵심 목표는 "어떤 AI 에이전트를 쓰든 동일한 규칙과 품질 게이트가 적용된다"는 것입니다.
같은 위험 명령 차단, 같은 브랜치 보호, 같은 phase 라우팅이 Claude와 Codex 양쪽에서
하나의 구현으로 동작합니다.

## 2. 기본 구조

하네스는 **thin harness, external tools, fat skills** 구조를 따릅니다.
(근거: `ARCHITECTURE.md`)

- **thin harness** — 하네스 자체는 작게 유지합니다. 런처(`./harness`), 훅, 설정,
  스킬 링크만 담당합니다.
- **external tools** — 실제 판단·실행 규율은 외부 프레임워크(Spec Kit,
  Superpowers)와 Playwright MCP에 위임합니다.
- **fat skills** — 도메인별 세부 규칙(백엔드, 프론트, DB, e2e 등)은 스킬에 담습니다.

```text
사용자 요청
  -> 메인 오케스트레이터 (Codex 또는 Claude)
      -> 필요한 phase와 외부 도구 선택
      -> specs/<NNN-feature> 상태 갱신
      -> 구현 / 검증 / 리뷰 실행
      -> 다음 phase 결정
```

작업의 source of truth는 **채팅이 아니라 커밋된 `specs/<NNN-feature>/`**입니다.
대화 기록은 언제든 사라질 수 있으므로, 여러 단계에 걸치는 작업 상태는 반드시
커밋된 spec 디렉터리에 남깁니다.

## 3. 통합된 3개 외부 프레임워크

세 도구는 **항상 함께 쓰이지 않습니다.** 작업 크기와 phase 리스크에 따라 필요한
역할만 선택합니다. 라우팅의 정식 정의는
`.harness/policies/scenario-phase-routing.md`에 있습니다.

| 프레임워크 | 정체 | 담당 역할 |
| --- | --- | --- |
| **Spec Kit** | GitHub `github/spec-kit` | 기능 계획 엔진. 기능 명세(spec)·계획(plan)·작업 분해(tasks)·검증 기록·세션 연속성. 커밋되는 `specs/<NNN-feature>/`의 소유자 |
| **Playwright MCP** | `@playwright/mcp` (Microsoft 공식) | 즉석 브라우저 QA — 페이지 로드/접근성 스냅샷/폼 조작/스크린샷. 사용자 레벨 MCP 등록(양 런타임), 버전 핀 |
| **Superpowers** | `superpowers@claude-plugins-official` (Anthropic 공식 마켓플레이스 플러그인) | 실행 규율과 TDD. 구현 중 test-driven-development를 기본으로, brainstorming·systematic-debugging·verification 등을 제공 |

### Spec Kit 명령 흐름

```text
speckit-specify  ->  speckit-clarify  ->  speckit-plan  ->  speckit-tasks  ->  speckit-analyze
                                                                                     |
                                                        구현(미완료 tasks.md 기반)  |
                                                                                     v
                                                              speckit-converge ("Converged"까지)
```

- **test task는 명시적으로 요청해야** 생성됩니다 (specify/tasks 호출 시
  "include test tasks (TDD)").
- 생략 불가한 두 human gate: **clarify 질문 답변**, **구현 전 tasks.md 리뷰**.
- 프로젝트 첫 기능 전에 `speckit-constitution`을 1회 실행합니다.

### 이전 게이트 도구가 제거된 이유

2026-07-06 스킬 사용 감사에서 5주간 게이트의 실제 호출이 0회여서 opt-in으로
강등됐고, 2026-08-06 재측정 후 사용자 결정으로 전면 제거됐습니다. 브라우저
QA는 Playwright MCP가 대체합니다. 재설치 절차는
`.harness/docs/gstack-rollback.md`를 참고하세요.

> 참고: 개인 환경에 `frontend-design` 같은 다른 Claude 플러그인이 설치돼 있을 수
> 있으나, 하네스가 **명시적으로 관리·통합하는 것은 위 3종뿐**입니다.

## 4. 무엇을 설치하는가

세 프레임워크는 **설치 형태가 서로 다릅니다.** 이 차이를 아는 것이 업데이트를
이해하는 열쇠입니다.

| 프레임워크 | 설치 형태 | 위치 | 갱신 방법 |
| --- | --- | --- | --- |
| **Spec Kit** | **Vendored (저장소 안에 고정)** | `.harness/vendor/speckit/` → `./harness install`이 `.specify/`·`speckit-*` 스킬로 배치 | 하네스 레포에서만 `./harness speckit-vendor <tag>` (uvx 필요). 현재 고정: **v0.12.7** |
| **Playwright MCP** | **사용자 레벨 MCP 등록 (버전 핀)** | Claude `~/.claude.json`, Codex `~/.codex/config.toml` | `./harness install`이 등록, preflight/doctor가 점검. 핀 갱신은 `mcp-registration-check.mjs`의 상수 수정 |
| **Superpowers** | **Claude/Codex 플러그인 (수동 설치)** | 각 런타임의 plugin marketplace | 하네스는 안내만 출력. `/plugin install superpowers@claude-plugins-official` |

### 런타임: mise + Node.js 24

- 런타임 버전은 **mise**가 고정 관리합니다: `mise.toml`의 `node = "24"`.
- 하네스 명령은 `mise exec -- node ...` / mise task로 래핑되어 항상 같은 Node
  버전에서 실행됩니다.
- 팀원 온보딩은 `mise trust` → `mise install` → `./harness install` 순서입니다.

### `./harness install`이 하는 일

1. `mise install`로 Node.js 24 설치
2. `skills-link`로 `.claude/skills`·`.agents/skills` 머지 트리 생성
3. vendored Spec Kit 자산을 `.specify/`와 skill 트리에 배치
4. Playwright MCP 사용자 레벨 등록 (양 런타임, 핀 버전)
5. Superpowers plugin 설치 **안내만** 출력 (자동 설치 안 함)

### 업데이트 흐름

- **SessionStart 훅**이 `./harness update-check --background`를 백그라운드로 실행합니다.
  무거운 원격 fetch는 detach된 worker로 돌고, 결과 알림은 다음 실행 때 표시됩니다.
- 날짜 스로틀: daily(하네스 레포 drift 확인, Spec Kit drift)와
  weekly(Superpowers 안내) 단위로 나뉩니다.
- 상태는 `.harness/state/update-state.env`에 `LAST_DAILY`/`LAST_WEEKLY`로 기록됩니다.
- **자동 merge/deploy는 하지 않습니다.** drift 리포트만 냅니다. `HARNESS_AUTO_UPDATE=0`으로
  끌 수 있습니다.

## 5. 규칙과 정책의 계층 구조

하네스의 규칙은 **여러 레이어**에 나뉘어 있습니다. 이 계층을 이해하면
"어떤 규칙이 어디에 있고, 무엇이 진실의 원천인지" 알 수 있습니다.
(source of truth 표: `.harness/policies/context-engineering.md`)

| 레이어 | 위치 | 역할 |
| --- | --- | --- |
| **공통 정책 (도구 중립)** | `.harness/policies/*.md` | 규칙의 **본문/원천**. Codex·Claude·headless 공통 |
| **Codex 진입점** | `AGENTS.md` | 두꺼운 쪽. 공통 규칙의 서술형 요약 (Codex는 `.claude/rules`를 못 읽으므로 여기 담김) |
| **Claude 진입점** | `CLAUDE.md` | 얇은 쪽. "AGENTS.md와 같은 규칙을 따른다" 선언 + Claude 전용 훅/런처/스킬 경로만 추가 |
| **Claude 네이티브 규칙** | `.claude/rules/*.md` | 항상 로드되는 narrative 규칙 |
| **Codex 네이티브 규칙** | `.codex/rules/*.rules` | execpolicy (명령 prefix 기반 allow/prompt/forbidden) |
| **런타임 차단/검사** | `.harness/hooks/*` | 실제로 명령을 막거나 경고하는 코드 |

**핵심 원칙:** 공통 규칙은 `.harness/policies`에 먼저 두고, 필요하면 각 도구
네이티브 레이어에 미러링합니다. 파일명이 같다고 parity를 가정하지 말고
`./harness rule-check` / `doctor` / `npm test`로 검증합니다.

### 주요 정책 파일 (`.harness/policies/`)

| 파일 | 역할 |
| --- | --- |
| `guardrails.md` | **마스터 안전 정책** — 브랜치 보호, PR 흐름, 파괴적 명령, DB write/migration, 프로덕션 데이터, 시크릿, auth 경계, 외부 API side effect |
| `scenario-phase-routing.md` | **라우팅 정식 정의** — P1~P5 phase map, Size 분류, Medium+ Hard Gate, Plan-of-Record Gate |
| `agent-routing.md` | 외부 도구 책임 분담, Handoff Contract, Codex subagent 라우팅 |
| `tool-permissions.md` | 권한 해석 8단계 순서, 패키지 매니저·MCP 접근 모델 |
| `quality-gates.md` | 실행/리뷰/검증 전 게이트, user-facing flow 정의, e2e best-practice |
| `context-engineering.md` | 컨텍스트 관리, source-of-truth 표, Codex/Claude parity 규칙 |
| `rule-lifecycle.md` | 규칙 추가/변경/삭제 체크리스트, Mirror Rules 절차, Accepted Asymmetry |
| `tdd.md` | 비trivial 구현 TDD 5단계, 면제 조건 |
| `update-policy.md` | 하네스 업데이트 정책, project-owned 경로 보존 |

### Claude 네이티브 규칙 (`.claude/rules/`)

| 파일 | 한 줄 요약 |
| --- | --- |
| `work-safety.md` | `main`/`dev` 직접 작업 금지, 파괴적/시크릿/프로덕션 명령은 명시 승인 필요, `gh pr merge`는 승인해도 절대 금지 |
| `skill-ownership.md` | 신규 스킬 배치 위치 규정 (upstream vs local), 공유 스킬 다운스트림 수정 금지 |
| `phase-routing.md` | Medium+ 작업은 구현 전 Size 선언 + `specs/`에 plan-of-record 존재 |
| `e2e-validation.md` | user-facing flow 변경 시 e2e 필수 + 증거 기록, 검증 순서 typecheck→unit→integration→e2e |
| `tool-call-payload-safety.md` | 단일 tool-call payload를 작고 단순하게 유지 (스트림 손상 방지) |
| `monorepo-packages.md` | (경로 스코프) 각 앱이 자체 package.json/lockfile 소유, 루트 install 금지 |

## 6. Claude Code와 Codex 병렬 적용

하네스의 가장 중요한 특징은 **위험 명령 차단·브랜치 보호·공유 스킬 보호가
하나의 구현으로 두 런타임에서 동일하게 동작한다**는 것입니다.

### 하나의 구현, 두 런타임

```text
[Claude Code]  Bash/Write/Edit 전  ->  guardrails.mjs 직접 실행
                                            ^
                                            | (같은 파일 재사용)
                                            v
[Codex]  Bash 실행 전  ->  codex-pretooluse.mjs (어댑터)  ->  guardrails.mjs
```

- **Claude 경로:** Claude Code가 PreToolUse 훅으로 `.harness/hooks/guardrails.mjs`를
  직접 실행합니다.
- **Codex 경로:** `.codex/hooks.json`이 `codex-pretooluse.mjs`를 실행하고, 이 어댑터가
  Codex 페이로드를 Claude 형태로 변환해 **같은 `guardrails.mjs`를 그대로 재사용**합니다.

결과적으로 브랜치 인식 차단, 위험 명령 차단, 공유 스킬 write 차단이 **양쪽에서
동일한 단일 구현으로** 실행됩니다. (2026-07-06부터 적용)

### 양쪽에서 동일하게 차단되는 것 (block)

- 보호 브랜치(`main`/`dev`)에서의 write-like 작업
- 위험 명령: `rm -rf`, `git push --force`, `git reset --hard`, `git clean -f`,
  `gh pr merge`, `gh repo delete`
- 파괴적 SQL: `DROP`/`TRUNCATE`, WHERE 없는 `UPDATE`/`DELETE`, DB reset/drop
- 프로덕션 접근, 외부 side effect(stripe/twilio/sendgrid 등), 유료 API
- 인프라: `kubectl delete`, `docker system prune`, `terraform destroy`
- 시크릿/환경변수 출력, 프로덕션 배포/롤백
- 다운스트림에서 `.harness/skills/`(공유 트리) 쓰기

### 비대칭: 아직 Claude에만 있는 것

Codex 어댑터는 **차단(block)만** 포팅했습니다(파일럿 범위). `guardrails.mjs`의
**비차단 경고(warn)는 Claude 전용**입니다. Codex에 아직 없는 것:

| 기능 | 상태 | Codex의 대안 |
| --- | --- | --- |
| Size 마커 경고 (Medium+인데 specs/ 밖 design doc) | Claude만 | 마커 + narrative 규칙 |
| e2e 커밋 리마인더 | Claude만 | narrative 규칙 |
| Superpowers 문서 sink 힌트 | Claude만 | — |
| UserPromptSubmit skill-injector (키워드 스킬 제안) | Claude만 | `./harness codex` 시작 시 preflight 1회 |
| `tool-call-payload-safety` 네이티브 미러 | Claude만 | 전역 `~/.claude/CLAUDE.md` |

이 비대칭은 정책에 공식 기록돼 있습니다 (`rule-lifecycle.md`의 "Accepted
Asymmetry"). execpolicy는 명령 인자 prefix만 보므로 브랜치·cwd·SQL 본문·마커 파일을
볼 수 없고, 그래서 그 부분은 어댑터 경유 `guardrails.mjs`가 담당합니다.

> **Codex 사용자 주의:** Codex는 매 프롬프트 훅이 없으므로, 정책(특히 Size 선언·
> phase 라우팅)을 매 턴 **직접 적용**해야 합니다.

### PR 흐름 (양쪽 공통)

- `gh pr merge`는 **영구 금지** — 승인을 받아도 AI는 merge하지 않습니다.
  merge는 GitHub에서 사람이 합니다.
- 앱 저장소 흐름: feature 브랜치 → `dev` PR → 사람이 merge → `dev`→`main` PR →
  사람이 merge. hotfix는 `hotfix/<name>` 브랜치 후 `main` PR.

## 7. 훅 (hooks)

훅에는 두 종류가 있습니다: **차단(block)**과 **비차단 경고(warn)**.
차단은 도구 실행을 멈추고, 경고는 멈추지 않고 메시지만 주입합니다.
경고를 비차단으로 두는 이유는 `--no-verify` 같은 우회 습관을 만들지 않기 위해서입니다.

### Claude Code 훅 배선 (`.claude/settings.json`)

| 이벤트 | 대상 | 스크립트 | 종류 |
| --- | --- | --- | --- |
| SessionStart | 전체 | `update-check --background` | — |
| UserPromptSubmit | 전체 | `skill-injector.mjs` | 비차단 (스킬 제안) |
| PreToolUse | 전체 | `tool-permission-guard.mjs` | **차단** |
| PreToolUse | Bash | `guardrails.mjs` → `project-profile-guard.mjs` → `test-filter.mjs` | 차단 / 차단 / 출력변형 |
| PreToolUse | Write/Edit/MultiEdit | `guardrails.mjs` → `project-profile-guard.mjs` | **차단** |
| Stop | 전체 | `decision-notifier.mjs` | 비차단 (알림) |
| statusLine | — | `hud.mjs` | 상태줄 |

### 주요 훅 역할

- **`guardrails.mjs`** — 가장 큰 훅. 위험 명령·보호 브랜치·공유 스킬 write를
  **차단**하고, e2e/Size/planning 라우팅을 **경고**합니다.
- **`tool-permission-guard.mjs`** — 패키지 매니저 정책(npm/pnpm만, yarn/bun 금지),
  모노레포 루트 install 차단, MCP 도구 경계를 **차단**합니다.
- **`project-profile-guard.mjs`** — 프로필 mode에 따라 금지된 앱 디렉터리 수정을
  **차단**합니다 (예: `frontend-only`에서 `apps/back` 수정, `planning-only`는
  양쪽 앱 표면 전부). Codex 어댑터도 같은 가드를 실행합니다.
- **`skill-injector.mjs`** — 프롬프트 키워드로 관련 스킬을 최대 3개 *제안*합니다
  (비차단, 유도이지 강제 아님).
- **`codex-pretooluse.mjs`** — Codex 어댑터 (섹션 6 참조).

### 자기선언 마커 (`.harness/state/`)

이 디렉터리는 **전체가 git-ignored**된 세션 로컬 상태입니다. 에이전트가 자기 작업의
성격을 선언하면 훅이 그에 맞춰 경고합니다.

| 마커 | 역할 | 조작 |
| --- | --- | --- |
| `current-size` | `Medium`+면 Medium+ 게이트 활성 (specs/ 밖 design doc 경고) | `printf 'Small\n' > .harness/state/current-size` |
| `touches-user-flow` | `yes`면 커밋 시 e2e 증거 게이트 활성 | `printf 'no\n' > .harness/state/touches-user-flow` |
| `e2e-last-run` | e2e가 마지막으로 성공한 시점의 `git write-tree` 해시 (신선도 증거) | e2e task가 통과 시 자동 기록 |

## 8. 스킬 시스템

스킬은 **두 소스**에서 옵니다. 이 2원 구조가 "공유 vs 프로젝트 전용"을 나눕니다.

| 디렉터리 | 소유 | 업데이트 동작 |
| --- | --- | --- |
| `.harness/skills/` | **upstream (공유)** | `./harness update`가 upstream으로 **덮어씀** |
| `.harness/skills-local/` | **프로젝트 소유** | 업데이트가 **절대 건드리지 않음** |

- 두 소스는 `./harness skills-link`가 `.claude/skills/`와 `.agents/skills/`
  **머지 트리로 심볼릭 링크**합니다. 이 머지 트리는 git-ignored이며 install이
  재생성합니다.
- **이름 충돌은 금지** — 같은 이름이면 skills-link가 fail-fast합니다. 공유 스킬을
  로컬로 shadowing하는 것은 지원하지 않습니다.
- **새 스킬 배치 규칙:** 하네스 레포에서는 `.harness/skills/`에, 다운스트림
  프로젝트에서는 `.harness/skills-local/`에 만듭니다. 공유 스킬을 다운스트림에서
  수정하면 다음 업데이트에 덮어쓰입니다 (읽기·diff는 허용).

### 도메인 스킬 (`codi-*`)

| 스킬 | 역할 |
| --- | --- |
| `codi-backend` | TypeScript 백엔드 — Express/NestJS API, DB, 인증, 클린 아키텍처 |
| `codi-frontend` | TypeScript 프론트 — React/Next.js, FSD-lite, shadcn/ui, Tailwind |
| `nestjs-expert` | NestJS 전용 (codi-backend가 NestJS 감지 시 로드) |
| `codi-db` | DB 모델링·마이그레이션·인덱싱·쿼리 튜닝·RAG |
| `codi-e2e` | e2e 게이트 셋업/실행 (Playwright, mise e2e task) |
| `codi-dev-workflow` | mise·git 훅·CI/CD·빌드·릴리스 조율 |
| `codi-dependency-review` | npm audit·OSV·Renovate·lockfile 리뷰 |
| `codi-feature-hub` | 기능정의 체계 운영 — 문서 허브+Planning Hub 빌드, planning:sync/check, FeatureWorkItem 기록, 상태 flow |
| `codi-feature-definition-authoring` | 기능정의서 신규 작성 입구 — 사이트맵→카탈로그→11그룹 상세 |
| `codi-feature-definition-normalizer` | 기능정의서 변환 입구 — 외부 CSV/MD/HTML 문서를 같은 계약으로 정규화 |
| `codi-design-system` | 프로젝트 소유 디자인 토큰/시스템 생성 |
| `codi-phase-routing` | 작업을 외부 도구(Spec Kit/Superpowers)로 라우팅 |
| `codi-rule-authoring` | 규칙/정책 추가·변경 (Codex/Claude parity 관리) |
| `codi-planning-retirement` | 레거시 `.planning` 제거 |

### 운영 스킬

| 스킬 | 역할 |
| --- | --- |
| `init-project` | 프로젝트 초기화 오케스트레이터 (스캐폴드, import, Infisical, 배포) |
| `karpathy-style` | Karpathy 스타일 프롬프트 래퍼 |
| `skill-creator` | 신규 스킬 저작·개선·측정 |

> Spec Kit의 `speckit-*` 10종은 `.harness/skills/`가 아니라 외부(Spec Kit) 소유
> 실제 디렉터리로 머지 트리에 배치됩니다.

## 9. 작업 워크플로우와 페이즈 라우팅

### 5단계 흐름

중요한 작업은 항상 이 순서를 따릅니다. 단, 이것은 **사고 흐름이지 매번 파일을
만드는 규약이 아닙니다.**

```text
1. Brainstorming   (P1 Strategy)      문제/제약/접근 정리; 창작이면 Superpowers brainstorming
2. Planning        (P2 Specify/plan)  speckit-specify -> clarify -> plan -> tasks -> analyze
3. Execution       (P3 Implementation) 미완료 tasks.md 구현 + Superpowers TDD
4. Review          (P4 Validation)     speckit-converge ("Converged"까지) + 검증 습관
5. Verification     (P5 Completion)     converge green -> ROADMAP.md 갱신 -> PR 준비
```

### Size 분류 (라우팅 결정)

Size는 시간이나 파일 개수가 아니라 **라우팅 결정**입니다.

| Size | 기준 | 처리 |
| --- | --- | --- |
| **Small** | 방향 고정·로컬·되돌리기 쉬움·기계적 (오타, 리터럴 값, 명백한 docs edit) | 선언 없이 **직접 처리** |
| **Medium** | 하나의 일관된 결과지만 무엇을 확인/변경/검증할지 판단 필요 | Size 선언 후 가장 작은 외부 도구로 라우팅 |
| **Large** | 다단계, 다중 서브시스템, cross-file 영향, API/contract 변경, 세션 연속성 | Spec Kit 기능 흐름 (specify→converge) |
| **Extra large / risky** | Large + production/deploy/DB schema/auth/payment/security | 전체 흐름 + 모든 게이트에 명시 checkpoint |

### 두 개의 게이트

- **Medium+ Hard Gate** — 명백히 Small이 아닌 작업은 **구현 코드 전에 Size를
  선언**합니다: `Size: <Medium|Large|Extra large>, because <이유>`. 동시에 마커에
  기록합니다: `printf 'Medium\n' > .harness/state/current-size`.
  (advisory/soft — 차단 훅이 아니라 항상-로드 규칙으로 작동)
- **Plan-of-Record Gate** — Medium+ 작업의 plan of record는 **반드시
  `specs/<NNN-feature>/` 디렉터리로 존재**해야 하며, 첫 구현 코드 편집 전에
  만들어져야 합니다. brainstorming·chat·Artifact 출력은 입력 재료일 뿐 plan of
  record가 아닙니다.

### 세션 연속성

- 새 Medium+ 작업 전에 **in-flight 기능을 먼저 확인**합니다: 미완료 항목이 있는
  `specs/<NNN-*>/tasks.md`가 있으면 그 기능을 우선 재개합니다.
- checkpoint = 미완료 tasks.md 항목 + `.specify/` 런타임 상태.
- cross-feature 개요는 얇게 유지하는 루트 `ROADMAP.md`가 담당합니다.

### 자동 라우팅 안내

- **Claude Code:** 매 프롬프트 `skill-injector.mjs`가 키워드로 스킬을 제안합니다
  (유도이지 강제 아님).
- **Codex:** `./harness codex` 시작 시 preflight로 라우팅 리마인더가 1회 출력됩니다.
  이후에는 매 턴 정책을 직접 적용해야 합니다.

## 10. 기능정의와 Planning Hub

여러 역할(PM/PL, 웹 디자이너, 프론트, 백)이 한 곳에서 제품 계획과 구현 현황을
보도록 하는 시스템입니다. `mise run docs:build`가 **두 생성 페이지**를 함께
만듭니다: `docs/index.html`(문서 허브)과 `docs/planning.html`(Planning Hub).

### 두 페이지 — 문서 허브와 Planning Hub

| 페이지 | 내용 | 소스 |
| --- | --- | --- |
| 문서 허브 | 하네스 가이드/프로젝트 문서 색인·검색·reader + 기능정의서 표 + specs 기반 상태 보드 | Markdown, `data/feature-definitions.json`, `specs/<NNN>/status.yaml` |
| Planning Hub | 여섯 제품 보기(개요·화면 구조·기능 정의·기능 현황·사용자 흐름·추적성) + `운영·고급` disclosure | 워크스페이스 planning/delivery 소스 (`data/hub-workspaces.json`에 등록) |

Planning Hub의 소스 계약(워크스페이스 단위):

- **planningSource** — `sitemap.json`(화면 구조), `feature-definitions.json`
  (FeatureDefinition 카탈로그), `feature-details.json`(11그룹 구현 가능 상세),
  선택적으로 `user-flows.json`·`feature-relations.json`.
- **deliverySource** — `delivery-evidence.json`(FeatureWorkItem 구현 작업과 검증
  근거 — 기능 현황 Kanban 카드의 원본), `planning.lock.json`(수신한 계획 버전).
- 정의(FeatureDefinition)는 구현 상태를 저장하지 않고, 작업(FeatureWorkItem)이
  `featureDefinitionId`로 정의를 1:N 참조합니다. Release는 작업 속성입니다.

### 기능정의서를 만드는 세 스킬 (입구 2 + 운영 1)

| 스킬 | 언제 |
| --- | --- |
| `codi-feature-definition-authoring` | 처음부터 작성 (사이트맵→카탈로그→상세) |
| `codi-feature-definition-normalizer` | 외부 CSV/MD/HTML/레거시 문서 변환 |
| `codi-feature-hub` | 빌드·동기화(`planning:sync`/`planning:check`/`planning:pull`)·작업 기록·상태 전이 운영 |

두 입구는 같은 파일 계약으로 수렴합니다. 스키마 진실의 원천은
`.harness/config/`의 schema JSON들입니다(feature-definition, feature-detail,
feature-work-item, sitemap, user-flow, traceability, planning-manifest 등).
빠른 사용법은 `.harness/docs/feature-hub-guide.md`, 전체 구조 해설은
`docs/feature-definition-planning-hub-guide.md`를 참고하세요.

### 기능 현황의 진실의 원천

```text
specs/<NNN>/status.yaml   <- 진실의 원천 (상태·담당·의존)
        +
specs/<NNN>/tasks.md       <- 진행률 ([ ]/[x]로 계산, 저장 안 함)
        |
        v  mise run docs:build
docs/index.html (기능 현황 탭)  <- 생성물. 손으로 안 고침
```

- `owner_roles`는 `pm | designer | frontend | backend` 4개만입니다. **QA는 역할이
  아니라 `in-review` 상태**입니다.

### 관련 명령

| 명령 | 역할 |
| --- | --- |
| `mise run docs:build` | 두 생성 페이지 재생성 (외부 의존성 0) + 비차단 힌트 |
| `mise run planning:sync` | 원본 검증 → 근거 수집 → 조정(drift 판정) → 재생성 |
| `mise run planning:check` | merge-ready 일관성 게이트 (fail-closed) |
| `mise run planning:pull` | 검증된 manifest를 Planning Lock에 원자 적용 (유일한 수신 경로) |
| `mise run feature:status <id> <state>` | 상태 전이 + 이력 기록 |
| `mise run feature:status:sync` | 안전한 전이 제안 (기본 check-only, `--apply` 시만 수정) |

### 상태 전이 규칙

- 정방향 인접만: `planned → in-progress → in-review → done`
- `on-hold`는 어디서든 가능, 역방향은 경고 후 허용, 미정의 점프는 `--force` 필요
- 전이마다 history에 `{at, to}` 추가

> 기능 작업을 마무리하기 전에 `mise run feature:status:sync`를 실행하고,
> deterministic한 인접 정방향 전이만 `--apply`합니다. 모호하거나 `on-hold`인 경우는
> 보고만 합니다.

### 기능을 채우는 두 시작 경로

- **Top-down (계획이 먼저)** — authoring 또는 normalizer 스킬로 카탈로그+상세를
  작성 → `mise run feature:seed-check`로 ID 확인 → 구현 착수 시 같은 `FEAT-*`
  ID를 씨앗으로 `speckit-specify` → 구현 작업은 delivery evidence의
  FeatureWorkItem으로 기록.
- **Bottom-up (구현이 먼저)** — `speckit-specify`로 바로 `specs/<NNN>/`를 만들고
  `status.yaml`을 두는 것부터 시작. 계획 쪽 정의는 나중에 같은 ID로 작성해
  연결합니다.

`registry.json`은 어느 쪽에서도 필수가 아닙니다 — "아직 spec 없는 기능 + 담당
시드"를 담는 선택적 캐시일 뿐이고, 없어도 `docs:build`는 정상 동작합니다.

### 항시 동기화 규약 (사람이 지킬 4가지)

1. `FEAT-*`/`WORK-*`/`SCREEN-*` ID는 불변 — 바꾸지도 재사용하지도 않는다.
2. 구현 상태 변화는 delivery evidence의 work item 갱신으로 기록한다.
3. 머지 전 `mise run planning:check` 초록을 확인한다.
4. 계획 반영은 `mise run planning:pull` 명시 실행으로만 하고, 변경 제안은
   사람이 결정한다.

## 11. 개인 로컬 설정 (local override)

팀 규칙을 바꾸지 않으면서 **개인 환경만** 조정하고 싶을 때 쓰는 파일들입니다.
공통 원칙: **이 파일들은 전부 git에 올리지 않는 개인 전용**이고, **팀 규칙(source of
truth)을 override 하지 못합니다.**

### 로컬 파일 4종

| 파일 | 용도 | 실제 적용 위치 |
| --- | --- | --- |
| `AGENTS.local.md` | Codex용 개인 메모/선호 | 저장소 루트 (git-ignored) |
| `CLAUDE.local.md` | Claude용 개인 메모/선호 | 저장소 루트 (git-ignored) |
| `.claude/settings.local.json` | 개인 permission allowlist 등 | `.claude/settings.json`과 병합(Claude Code 기본 동작) |
| `.codex/config.toml` | 개인 Codex 설정 | **실제로는 `~/.codex/config.toml`이 적용됨** (아래 주의) |

네 파일 모두 `.gitignore`에 등재돼 있어 커밋되지 않습니다.

### 우선순위 — 개인 설정은 팀 규칙을 못 이긴다

`.harness/policies/context-engineering.md`가 규정하는 계층:

```text
.harness/policies · .harness/imported-rules · 루트 AGENTS.md/CLAUDE.md   (공유, 최상위)
        ↑ 약화 불가, "더 엄격하게만" 허용
apps/*/AGENTS.md · apps/*/CLAUDE.md   (팀 app-local, 커밋됨)
        ↑ 팀 규칙 override 불가
AGENTS.local.md · CLAUDE.local.md · settings.local.json · .codex/config.toml
   (개인 로컬, git-ignored — "personal scratch notes only")
```

- **"개인 선호는 팀 규칙을 override 하지 못한다"** — `context-engineering.md:105`.
- 공유하고 싶은 규칙이면 로컬 파일이 아니라 `.harness/policies`나 루트 진입점에
  **PR로** 반영합니다.
- 특정 앱에만 적용할 규칙이면 `apps/*/AGENTS.md`·`apps/*/CLAUDE.md`에 커밋합니다
  (단, 공유 정책을 약화시킬 수 없고 더 엄격하게만 가능).

### 사용법과 주의

- **개인 선호는 각 도구의 global config에 두는 것이 권장**입니다
  (`context-engineering.md:107`). 예: 개인 모델 선호, 개인 권한은 `~/.claude`,
  `~/.codex`에.
- **`.codex/config.toml` 주의**: Codex CLI가 실제로 읽는 파일은
  **`~/.codex/config.toml`(홈)**입니다. 저장소의 `.codex/config.example.toml`은
  "필요할 때 홈 config에 병합하라"는 **템플릿**이고, 저장소의 `.codex/config.toml`
  자체는 로컬 전용입니다(`config.example.toml:1-5`).
- **`.claude/settings.local.json`**: 개인 permission allowlist 등을 담아 반복 승인을
  줄이는 용도입니다. `settings.json`과의 병합은 Claude Code CLI의 표준 동작입니다
  (하네스가 별도로 로드하지 않음).
- **자동 로드는 각 CLI 도구의 동작**입니다. 하네스에는 이 로컬 파일들을 읽는 코드나
  훅이 없습니다 — 하네스는 이들을 "개인 스크래치 노트"로만 취급합니다.

## 12. 모델과 서브에이전트 모델

> **먼저 짚을 것**: 이 하네스에는 "서브에이전트에게 특정 모델을 배정하는" 저장소
> 설정이 **존재하지 않습니다.** 서브에이전트가 어떤 모델을 쓰는지는 **각 CLI 런타임의
> 기본 동작**이지 하네스 구성이 아닙니다. 저장소가 다루는 것은 "언제 서브에이전트를
> 띄울지"(라우팅)이지 "어떤 모델로 띄울지"가 아닙니다.

### 메인(오케스트레이션) 모델은 어디서 정하나

- 메인 세션 모델은 각 CLI의 설정에서 정합니다:
  - **Claude Code**: `~/.claude/settings.json`의 `"model"`(예: `opus[1m]`), 또는
    프로젝트 `.claude/settings.json`의 `"model"`, 또는 세션 중 `/config`·`/model`.
    현재 저장소의 프로젝트 `.claude/settings.json`에는 `model` 키가 **없어서** 홈 전역
    설정값이 적용됩니다.
  - **Codex**: `~/.codex/config.toml`의 `model`, 또는 `--profile`.
- 즉 **모델을 바꾼다 = 세션 전체 모델을 바꾼다**입니다.

### 서브에이전트가 메인 모델을 "따라간다"는 것의 정체

- Claude Code에서 서브에이전트의 모델 기본값은 **`inherit`(메인 세션 모델 상속)**
  입니다 — 이것은 **Claude Code 런타임의 기본 동작**이지 하네스가 설정한 게 아닙니다.
  저장소에는 서브에이전트 모델을 바꾸는 override가 전혀 없으므로 지금은 전부 이 런타임
  기본값(상속)을 따릅니다. 즉 "서브에이전트가 오케스트레이션 모델을 따라간다"는 말은
  맞지만, 그건 하네스 구성이 아니라 런타임 기본값입니다.

### 서브에이전트 모델 우선순위 (Claude Code 런타임)

Claude Code는 서브에이전트 모델을 아래 우선순위로 정합니다(위가 최우선):

| 순위 | 지정 방법 | 범위 |
| --- | --- | --- |
| 1 | `CLAUDE_CODE_SUBAGENT_MODEL` 환경변수 | 모든 서브에이전트 일괄 |
| 2 | Agent(Task) 도구 호출 시 `model` 파라미터 | 그 호출 1건 |
| 3 | 커스텀 에이전트 정의 `.claude/agents/*.md`의 `model:` frontmatter | 그 에이전트 |
| 4 | 메인 세션 모델 (= `inherit`, 최종 폴백) | 전체 기본 |

유효한 `model` 값: 별칭 `sonnet`·`opus`·`haiku`·`fable`, 전체 ID(예: `claude-opus-4-8`),
또는 `inherit`(메인 세션 모델 사용).

### 다른 모델을 쓰게 하려면

목적에 따라 위 우선순위 중 하나를 씁니다. **현재 저장소에는 이들 중 어느 것도 설정돼
있지 않으므로**(→ 전부 `inherit`), 아래는 팀이 새로 추가하는 방법입니다.

1. **모든 서브에이전트를 특정 모델로 일괄 지정** — 가장 쉬운 방법. 개인 환경이면
   `~/.claude/settings.json`, 프로젝트 공용이면 `.claude/settings.json`의 `env`에:
   ```json
   { "env": { "CLAUDE_CODE_SUBAGENT_MODEL": "haiku" } }
   ```
   예: 메인은 `opus`, 서브에이전트는 `haiku`/`sonnet`으로 두어 비용·속도 최적화.
2. **특정 종류의 에이전트만 다른 모델** — 커스텀 에이전트 정의를
   `.claude/agents/<name>.md`에 만들고 frontmatter에 `model: sonnet` 등을 둡니다.
   현재 저장소에는 `.claude/agents/` 디렉터리 자체가 없습니다.
3. **세션 전체(메인+서브)를 바꾸기** — Claude는 `settings.json`의 `"model"` 또는 세션 중
   `/model`, Codex는 `~/.codex/config.toml`의 `model`/`--profile`. 서브에이전트는
   `inherit`이므로 자동으로 따라옵니다.

> **주의(Codex)**: 위 1·2번은 **Claude Code 런타임 기능**입니다. Codex 서브에이전트는
> 세션 `model`을 따르며(`~/.codex/config.toml`), `[agents]`의 `max_threads`/`max_depth`는
> 동시 실행 수·깊이 상한일 뿐 모델 지정이 아닙니다. Codex에는 서브에이전트만 다른
> 모델로 두는 동등 수단이 저장소 기준으로 확인되지 않습니다.

> **정리**: 서브에이전트는 기본적으로 메인 모델을 **상속(`inherit`)**합니다(런타임
> 기본). 바꾸려면 (a) `CLAUDE_CODE_SUBAGENT_MODEL`로 일괄 지정, (b) 커스텀 에이전트
> frontmatter, (c) Agent 도구 호출 시 `model`, (d) 세션 모델 자체 변경 중 목적에 맞는
> 것을 씁니다. 이들은 런타임 기능이며 현재 저장소엔 아직 설정돼 있지 않습니다.

## 13. 팀원 온보딩 체크리스트

이미 생성된 프로젝트에 합류한 팀원 기준입니다.

```sh
# 1. 필수 도구
#    - mise (curl https://mise.run | sh, 셸 활성화 필수)
#    - Codex CLI 또는 Claude Code
#    - (선택) gh, infisical, uv

# 2. 클론 후 세팅
git clone <project-repo-url>
cd <project-repo>
mise trust
mise install
./harness install
./harness doctor      # 실패 0개인지 확인

# 3. Superpowers 플러그인 설치 (install이 안내만 함)
#    Claude Code:  /plugin install superpowers@claude-plugins-official
#    Codex CLI:    /plugins -> superpowers 검색 -> Install

# 4. 에이전트 실행 (codex/claude를 직접 실행하지 말고 런처 사용)
./harness codex       # 또는
./harness claude
```

### 처음 알아야 할 5가지

1. **`codex`/`claude`를 직접 실행하지 말고 `./harness codex` / `./harness claude`를
   씁니다.** 런처가 preflight(update-check, skill 동기화, config 검증)를 돕습니다.
2. **작업 상태는 채팅이 아니라 커밋된 `specs/<NNN-feature>/`에** 남습니다.
3. **`main`/`dev`에서 직접 작업하지 않습니다.** 작업 브랜치를 먼저 만듭니다.
4. **AI는 PR을 merge하지 않습니다.** merge는 GitHub에서 사람이 합니다.
5. **위험 명령은 훅이 차단**하고, 이는 Claude와 Codex 양쪽에서 동일하게 동작합니다.

### 더 읽을 것

| 문서 | 용도 |
| --- | --- |
| [README.md](../README.md) | 빠른 시작, 설치, 명령 레퍼런스 |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | 실제 개발 절차, phase별 라우팅 |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | 오케스트레이터 실행 구조 |
| `.harness/policies/` | 공통 정책 원본 (가드레일, 라우팅, 권한 등) |
| `.harness/docs/` | 주제별 상세 가이드 (스킬, 초기화, Infisical, 배포) |
