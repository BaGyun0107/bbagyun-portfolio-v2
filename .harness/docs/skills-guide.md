# 스킬 가이드

> **shared 하네스 문서입니다.** 다운스트림 프로젝트는 직접 수정하지 않습니다.
> 소유권 정책의 정본은 `.claude/rules/skill-ownership.md`입니다.

## 두 소스

스킬은 두 디렉터리에서 옵니다.

- `.harness/skills/` — **상류 공유**. 모든 Codi 프로젝트가 같은 내용을 받습니다.
  `./harness update`가 덮어씁니다. 다운스트림에서 수정 금지.
  읽기 전용 inspection, audit, safe diff는 허용됩니다.
- `.harness/skills-local/` — **프로젝트 전용**. 이 프로젝트만의 스킬.
  업데이트가 절대 손대지 않고, 다른 프로젝트로 전파되지 않습니다.

## 머지 트리

Codex와 Claude Code는 `.agents/skills/`와 `.claude/skills/` 머지 트리를 통해
두 소스를 동시에 봅니다. `./harness skills-link`가 install/preflight/pre-commit
시 자동으로 머지 트리를 다시 만듭니다.

- 두 소스에서 같은 이름을 쓰면 머지 단계가 fail합니다 — 로컬 스킬 이름을 바꾸세요.
- 상류 스킬을 덮어쓰는 fork는 지원하지 않습니다.
- Spec Kit처럼 외부 도구가 머지 트리에 직접 설치한 실제 디렉터리(`speckit-*`)는
  외부 소유로 간주해 보존하며, skills-link가 삭제하거나 fail하지 않습니다.

## 새 스킬을 만들 위치

- **하네스 레포에서**: `.harness/skills/<name>/`. 모든 다운스트림이 받게 됩니다.
- **다운스트림 프로젝트에서**: 반드시 `.harness/skills-local/<name>/`.

`.harness/skills/skill-creator/`는
[anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/skill-creator)에서
가져온 스킬 작성 도우미입니다.

로컬 스킬을 모든 프로젝트로 승격하고 싶다면
[upstream-contribution.md](./upstream-contribution.md)의 절차를 따릅니다.

## 주요 도메인 스킬

| 스킬                     | 용도                                                               |
| ------------------------ | ------------------------------------------------------------------ |
| `codi-frontend`          | React/Next.js, Tailwind, shadcn/ui, better-auth                    |
| `codi-backend`           | TypeScript Express/NestJS                                          |
| `nestjs-expert`          | NestJS 전용 아키텍처, DI, 모듈, 테스트                             |
| `codi-db`                | DB 모델링, 마이그레이션, 인덱스                                    |
| `codi-dev-workflow`      | mise, npm, CI/CD, 검증 파이프라인                                  |
| `codi-dependency-review` | npm audit, OSV, Renovate, lockfile 리뷰                            |
| `codi-design-system`     | 프로젝트 소유 design token/문서 생성, contrast gate                |
| `codi-e2e`               | e2e 게이트 스캐폴드/실행/트러블슈팅                                |
| `codi-feature-definition-authoring` | 기능정의서 신규 작성 입구 — 사이트맵→카탈로그→11그룹 상세→검증 |
| `codi-feature-definition-normalizer` | 기능정의서 변환 입구 — 외부 CSV/MD/HTML 문서를 같은 계약으로 정규화 |
| `codi-feature-hub`       | 기능정의 체계 운영 — `docs:build`/`planning:sync`/`planning:check`, FeatureWorkItem 기록, 상태 flow |
| `init-project`           | 신규 프로젝트 초기화, Infisical 연결, 기존 레포 통합               |
| `skill-creator`          | 신규 스킬 작성, 기존 스킬 개선, eval 실행                          |

`codi-phase-routing`은 외부 Spec Kit/Superpowers 호출 순서를 요약하는
routing 스킬입니다. upstream 도구의 복제본이 아닙니다.
