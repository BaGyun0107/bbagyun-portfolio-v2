# Implementation Plan: 그누보드5 PHP 쇼핑몰 프로젝트 하네스 지원

**Branch**: `feat/gnuboard-php-support` | **Date**: 2026-08-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/021-gnuboard-php-support/spec.md`

## Summary

파일럿(gnuboard5.6.32 레포)에서 실전 검증된 그누보드5 대응 패턴을
업스트림으로 증류한다: (1) 공유 스킬 `codi-gnuboard`(구조 지식 + 깃
온보딩 절차 + 도커 compose 템플릿 + e2e 스위트 예시), (2) 프로필 모드
`php-monolith` 추가(레지스트리·가드·정책·인젝터), (3) `.php` 감지
path-scoped 룰. 기존 5개 모드와 Node 스킬 동작은 회귀 없이 유지한다.

## Technical Context

**Language/Version**: Node.js 24 (mise 고정) — 훅·스크립트·테스트.
스킬 본문은 Markdown. 템플릿 산출물의 대상 스택은 PHP 7.4 + MySQL
5.7(도커 이미지, 이 레포에서는 실행하지 않음)

**Primary Dependencies**: 신규 없음. `node:test`(기존 테스트 러너),
기존 훅 인프라(`project-profile-guard.mjs`, `skill-injector.mjs`,
`codex-pretooluse.mjs`)

**Storage**: N/A (파일 기반 구성)

**Testing**: `npm test`(node --test), `./harness rule-check`,
`./harness context-check`, `./harness doctor`

**Target Platform**: macOS/Linux 개발 머신, Claude Code + Codex 양 런타임

**Project Type**: 하네스 툴링 레포 (스킬/정책/훅/CLI)

**Performance Goals**: N/A (훅은 기존 실행 경로 재사용, 추가 프로세스 없음)

**Constraints**: 듀얼 런타임 패리티(constitution I), 루트 엔트리포인트
얇게 유지(II, ≤200줄), path-scoped 룰은 Claude 전용 메커니즘이므로
Codex 보상 통제 필요

**Scale/Scope**: 공유 스킬 1개(+resources 3~4파일), 프로필 모드 1개
추가에 따른 터치 포인트 6곳, 신규 테스트 파일 ~4개

## Constitution Check

*GATE: Phase 0 전 통과 필요. Phase 1 설계 후 재점검.*

| 원칙 | 판정 | 근거 |
|---|---|---|
| I. Dual-Runtime Parity | PASS (보상 통제 포함) | 스킬은 `.claude/skills`·`.agents/skills` 병합으로 양 런타임 노출. 프로필 가드는 단일 구현(`project-profile-guard.mjs`)을 Codex 어댑터가 공유. path-scoped 룰은 Claude 전용이므로 Codex 측은 `.codex/rules/php-monolith.rules`(항상 로드 프리픽스 룰) + AGENTS 라우팅 문구로 보상. plan에 명시 |
| II. Thin Entry Points | PASS | AGENTS.md 스킬 목록 1줄, CLAUDE.md path-scoped 목록 1줄만 추가. 실질 내용은 `.harness/policies/`·스킬로 |
| III. Test-First | PASS | 프로필 렌더/체크, 가드 차단·비차단, 인젝터 모드 스킵, 스킬 계약 테스트를 구현 전 작성(tasks에 TDD 순서 명시) |
| IV. Human Gates | PASS | clarify 완료(4문답), tasks.md 리뷰 게이트에서 일시정지 예정 |
| V. Upgrade Resilience | PASS | 외부 도구 내부 단계 비의존. 파일럿 패턴은 복사·일반화(참조 아님). 업스트림 소유 디렉터리는 이 레포(업스트림)에서만 수정 |

**Post-Phase-1 재점검**: PASS — 설계 산출물이 위 판정을 바꾸지 않음.
계약은 기존 스키마(front/back 블록 유지)를 확장만 하므로 다운스트림
호환 리스크 없음.

## Project Structure

### Documentation (this feature)

```text
specs/021-gnuboard-php-support/
├── spec.md
├── plan.md              # 이 파일
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── profile-php-monolith.md   # 모드 렌더·가드 동작 계약
│   └── skill-codi-gnuboard.md    # 스킬 구조·resources 계약
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks 산출 (plan에서는 만들지 않음)
```

### Source Code (repository root)

```text
.harness/skills/codi-gnuboard/
├── SKILL.md                          # 구조 지식 + 온보딩 절차 + 로컬 환경 + e2e 안내
└── resources/
    ├── docker-compose.gnuboard.yml   # 로컬 환경 템플릿 (파일럿 검증 함정 대응 포함)
    ├── gitignore.gnuboard            # 온보딩용 제외 목록 템플릿
    └── e2e-suite-example.sh          # e2e 게이트에 꽂히는 스위트 예시 패턴

.harness/scripts/tooling/profile.mjs      # modes 레지스트리에 php-monolith 추가
.harness/hooks/project-profile-guard.mjs  # php-monolith: apps/front·back 차단
.harness/hooks/skill-injector.mjs         # php-monolith: codi-backend/frontend 제안 스킵
.harness/config/skill-triggers.json       # codi-gnuboard 키워드 등록
.harness/policies/project-profile.md      # 모드 문서 추가
.claude/rules/php-monolith.md             # path-scoped 룰 (paths: **/*.php)
.codex/rules/php-monolith.rules           # Codex 보상 미러
CLAUDE.md                                 # path-scoped 룰 목록 1줄
AGENTS.md                                 # 스킬 책임 목록 1줄
tests/profile-php-monolith.test.mjs       # 렌더·check·가드·인젝터
tests/codi-gnuboard-skill-contract.test.mjs  # 스킬 구조·resources 계약
```

**Structure Decision**: 기존 관례를 그대로 따른다 — 공유 스킬은
`.harness/skills/<name>/`(업스트림 레포이므로 공유 경로가 맞음, 스킬
소유권 룰 준수), 훅·레지스트리는 기존 파일 수정, 룰 미러는
`monorepo-packages` 선례(path-scoped Claude 룰 + Codex prefix 룰)를
따른다.

## Complexity Tracking

위반 없음 — 표 생략.
