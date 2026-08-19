# Implementation Plan: 기능 허브 + 기능정의 상태 flow

**Branch**: `feat/feature-hub-and-status-flow` (spec dir: `002-feature-hub`) | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-feature-hub/spec.md`

## Summary

STICKY-v1의 두 기능을 하네스에 이식한다. (1) `mise run docs:build`가 역할별 진입 카드 +
MD 문서 색인 + 기능 상태 대시보드를 담은 자체 완결 `docs/index.html` 한 장을 생성한다.
(2) `specs/<NNN>/status.yaml`을 진실의 원천으로 하는 기능정의 상태 flow —
`mise run feature:status <id> <state>` 명시 커맨드로 전이하고 이력을 남기며, 비차단 자동
힌트를 출력한다. registry.json은 선택적 시드/캐시로 없어도 동작한다.

기술 접근: 외부 의존성 0의 Node.js ESM 스크립트를 `.harness/scripts/docs/`에 두고, 순수
함수 lib(scan-specs, scan-md, merge-registry, render-hub, transition)로 분해해 단위 테스트
가능하게 한다. HTML은 서버측(생성시점) 집계 + 인라인 JS 검색/필터. 공유 스킬
`.harness/skills/codi-feature-hub/`가 워크플로우를 문서화한다.

## Technical Context

**Language/Version**: Node.js (하네스 mise가 관리하는 버전), ESM(`.mjs`)

**Primary Dependencies**: 없음(런타임 의존성 0). Node 표준 라이브러리(`fs`, `path`)만 사용.
YAML 파싱은 status.yaml의 제한된 서브셋을 자체 파서로 처리하거나, 이미 devDependency로
존재하는 경우에 한해 재사용(research에서 확정).

**Storage**: 파일시스템. 진실의 원천은 `specs/<NNN>/status.yaml`(+ `tasks.md`). 선택적
`registry.json`(루트). 생성물은 `docs/index.html`.

**Testing**: `node --test tests/*.test.mjs`(저장소 관례). 테스트는 루트 `tests/`에
`feature-hub-*.test.mjs`로 둔다. scan-md, merge-registry, transition 3개 lib는 TDD로 단위
테스트 선작성.

**Target Platform**: 로컬 개발자 머신. 생성된 HTML은 Chrome 등 브라우저에서 `file://`로
오프라인 열람.

**Project Type**: 저장소 도구(harness tooling) — 앱/서버 아님. `.harness/scripts` +
`mise.toml` 태스크 + 공유 스킬.

**Performance Goals**: 도구 성격상 엄격한 목표 없음. 수백 개 spec/문서 규모에서 생성이
체감 지연 없이(수 초 내) 끝나면 충분.

**Constraints**: 생성 HTML은 외부 네트워크·CDN·폰트·스크립트 의존 0(오프라인). 색인 폴더
부재/빈 상태/잘못된 상태값에도 생성 실패 금지(건너뛰고 경고). 생성물 손수정 금지 배너.

**Scale/Scope**: 5개 lib 모듈 + 2개 진입 스크립트(build-hub, feature-status) + 1개 공유
스킬 + mise 태스크 2개 + 단위/통합 테스트. 단일 저장소, 단일 개발자 스트림.

## Constitution Check

*프로젝트 constitution은 미작성 템플릿 상태다. 대신 하네스의 실제 규칙(AGENTS.md,
`.claude/rules/*`, `.harness/policies/*`)을 게이트로 적용한다.*

| 게이트 | 규칙 출처 | 판정 | 근거 |
|---|---|---|---|
| Skill ownership | `skill-ownership.md` | ✅ PASS | 새 공유 스킬을 `.harness/skills/`에 둔다(여기가 upstream). `skills-local` 아님 — 사용자와 확정. |
| 보호 브랜치 | `work-safety.md` | ✅ PASS | `feat/feature-hub-and-status-flow` 작업 브랜치에서 작업. main/dev 직접 수정 없음. |
| TDD | Superpowers/AGENTS | ✅ PASS | scan-md/merge-registry/transition 단위 테스트 선작성을 tasks에 포함. |
| E2E 게이트 | `e2e-validation.md` | ✅ PASS(해당 없음) | 이 기능은 사용자 대면 앱 플로우가 아니라 저장소 도구다. 대신 도구 자체의 e2e 게이트 **연동**을 구현(FR-011). 도구 검증은 통합 테스트(실제 `docs:build` 실행 + 렌더 확인)로. |
| Payload safety | `tool-call-payload-safety.md` | ✅ PASS | 긴 파일은 스켈레톤+Edit, 커밋 메시지는 파일 경유로 이미 준수 중. |
| 비차단 훅 철학 | `guardrails.mjs` 관례 | ✅ PASS | 상태 전이 자동 힌트는 출력만, 차단 없음(FR-010). |
| YAGNI / 단순성 | AGENTS | ✅ PASS | Out of Scope로 차단형 훅·자동 재생성·registry 필수화 등 제외. 런타임 의존성 0. |

**게이트 위반 없음.** Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/002-feature-hub/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (CLI/파일 계약)
├── checklists/
│   └── requirements.md  # spec 품질 체크리스트 (완료)
└── tasks.md             # /speckit-tasks 출력 (이 명령에서는 생성 안 함)
```

### Source Code (repository root)

```text
.harness/
├── scripts/docs/
│   ├── build-hub.mjs          # 진입점: lib 조합 → docs/index.html
│   ├── feature-status.mjs     # 진입점: 상태 전이 커맨드
│   ├── lib/
│   │   ├── scan-specs.mjs     # specs/*/status.yaml + tasks.md 진행률
│   │   ├── scan-md.mjs        # MD 색인 (제목/카테고리/발췌)
│   │   ├── merge-registry.mjs # registry + specs 병합
│   │   ├── render-hub.mjs     # 병합 데이터 → HTML 문자열
│   │   └── transition.mjs     # 유효 전이 판정 + 자동 힌트
│   └── templates/
│       └── hub.css            # 인라인될 스타일
└── skills/codi-feature-hub/
    └── SKILL.md               # 워크플로우 (top-down/bottom-up 분기)

tests/                         # 저장소 관례: node --test tests/*.test.mjs
├── feature-hub-scan-md.test.mjs
├── feature-hub-merge-registry.test.mjs
└── feature-hub-transition.test.mjs

registry.json                  # 루트, 선택적 (없어도 동작)
docs/index.html                # ★ 생성물 (손수정 금지)
mise.toml                      # docs:build, feature:status 태스크 추가
```

**Structure Decision**: 하네스 도구 관례를 따른다 — 실행 로직은 `.harness/scripts/`,
사용자 진입은 `mise.toml` 태스크, 워크플로우 문서는 `.harness/skills/`. 앱 코드(`apps/`,
`src/`)는 이 기능과 무관하다. 각 lib는 순수 함수로 `__tests__/`에서 독립 테스트한다. spec의
status.yaml은 각 `specs/<NNN>/`에 살고, 이 기능이 만드는 도구가 그것을 읽는다.

## Complexity Tracking

Constitution Check 위반 없음 — 이 섹션은 비워 둔다.
