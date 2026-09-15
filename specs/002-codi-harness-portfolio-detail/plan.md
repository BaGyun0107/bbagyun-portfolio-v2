# Implementation Plan: Codi Harness 포트폴리오 상세 개선

**Branch**: `chore/cleanup-downstream-harness` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-codi-harness-portfolio-detail/spec.md`

## Summary

`codi-harness-dx-platform` 작업물을 정적 Markdown 장문에서 타입 안전한 구조화
상세 데이터로 이전한다. 공통 상세 페이지는 프로젝트 개요를 항상 먼저 보여주고,
구조화 데이터가 있으면 역할·지표·판단·스윔레인·결과·회고를 렌더링하며 없으면
기존 `content`를 그대로 표시한다. 하네스에는 접근 가능한 정적 스윔레인 두 개와
네 개의 신규 상세 인사이트를 제공하고, 현재·과거 도구와 지표 근거를 분리한다.
데이터 계약과 UI 흐름은 Vitest 및 Playwright E2E를 먼저 작성해 검증한다.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 24

**Primary Dependencies**: Next.js 16.1.6 App Router, React 19.2.3, Tailwind CSS 4,
기존 shadcn/Radix UI 구성 요소, `react-markdown`

**Storage**: `apps/front/src/data/portfolio/` 아래 빌드 타임 정적 TypeScript 데이터;
데이터베이스와 외부 API 없음

**Testing**: Vitest 4.1.11 데이터 계약 테스트, TypeScript `tsc --noEmit`, ESLint,
Next.js production build, Playwright 1.62.1 E2E 및 브라우저 반응형 확인

**Target Platform**: 정적 생성되는 Next.js 공개 포트폴리오 웹 페이지, 최신 데스크톱·모바일 브라우저

**Project Type**: split-front-back 모노레포의 frontend-only 기능 변경

**Performance Goals**: 정적 상세 화면에 별도 클라이언트 상태와 그래프 런타임을
추가하지 않고, 8개 작업물 상세 경로를 빌드 시 생성한다.

**Constraints**: 공개 데모·비공개 소스·시크릿 미노출, 하네스 외 7개 기존 본문
보존, 320/768/1024/1440px에서 페이지 전체 가로 overflow 없음, 흐름 구분을
색상에만 의존하지 않음, `components/ui/*` 직접 수정 금지

**Scale/Scope**: 작업물 8개 중 하네스 1개를 우선 구조화하고 7개는 fallback 유지;
하네스 지표 6개, 스윔레인 2개, 신규 인사이트 4개와 기존 관련 인사이트 4개 정합성 보정

## Constitution Check

*GATE: Phase 0 시작 전과 Phase 1 설계 후 모두 통과해야 한다.*

| 원칙 | 계획 대응 | 사전 판정 | 설계 후 판정 |
|---|---|---|---|
| I. Evidence-First Portfolio Truth | 인터뷰·하네스 소스·공개 가격을 근거로 측정/보고/추정을 분리하고 비공개 자료는 노출하지 않는다. | PASS | PASS |
| II. Interview-Driven Progressive Completion | 하네스만 구조화하고 나머지 7개 `content`와 경로를 보존한다. | PASS | PASS |
| III. Shared Information Architecture, Optional Evidence | 하나의 페이지와 선택형 `detail`/`demo`/`swimlanes` 계약을 사용한다. | PASS | PASS |
| IV. Accessible and Responsive Reading | 의미 있는 제목, 색상 외 표식, `<ol>` 대체 설명, 컨테이너 내부 overflow를 계약과 E2E로 검증한다. | PASS | PASS |
| V. Test-First, Verifiable Delivery | 데이터 계약 및 E2E 테스트를 구현보다 먼저 두고 typecheck→unit→build→e2e 증거를 남긴다. | PASS | PASS |

의도한 헌법 예외는 없다. 루트 `mise.toml`에 E2E 작업과
`feature:status:sync` 작업이 없는 현재 도구 등록 상태는 구현 전 보완 또는 잔여 위험
기록이 필요하며, 품질 게이트 자체를 면제하지 않는다.

## Project Structure

### Documentation (this feature)

```text
specs/002-codi-harness-portfolio-detail/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── portfolio-detail-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/front/
├── mise.toml                                      # 앱 전용 e2e task
├── playwright.config.ts                          # 공개 작업물 브라우저 검증
├── e2e/
│   └── codi-harness-portfolio-detail.spec.ts
├── src/
│   ├── app/(public)/projects/[slug]/page.tsx      # 단일 상세 페이지 조합
│   ├── components/projects/
│   │   ├── ProjectDetailContent.tsx               # structured/legacy 선택
│   │   ├── ProjectDemoLink.tsx                    # 검증된 선택형 demo CTA
│   │   ├── ProjectHighlights.tsx
│   │   ├── ProjectNarrative.tsx
│   │   ├── ProjectSwimlane.tsx
│   │   └── project-detail-rendering.test.tsx       # 섹션 순서·링크 계약
│   └── data/portfolio/
│       ├── content-quality.test.ts
│       ├── feature-detail-quality.test.ts
│       ├── feature-details/
│       │   ├── index.ts
│       │   └── codi-harness-dx-platform.ts
│       ├── features.ts
│       ├── index.ts
│       ├── insights.ts
│       └── types/
│           ├── feature-detail.dto.ts
│           ├── feature.dto.ts
│           └── index.ts
├── package.json
└── pnpm-lock.yaml

mise.toml                                          # 공통 e2e/e2e:changed task 보완
```

**Structure Decision**: 백엔드나 API 변경 없이 `apps/front`의 정적 데이터, Server
Component와 검증 구성만 변경한다. 구조화 상세는 slug별 파일로 분리해 후속 인터뷰가
끝날 때 한 작업물씩 추가할 수 있게 하고, 공통 페이지는 레지스트리 조회 결과에 따라
구조화 상세 또는 기존 Markdown을 렌더링한다.

## Phase 0: Research Decisions

결정 근거와 대안은 [research.md](./research.md)에 기록한다.

- 정적 구조화 레지스트리와 레거시 fallback
- 순수 TypeScript 교차 참조 검증
- Server Component 기반 정적 스윔레인과 순서형 대체 설명
- 기존 UI 토큰·Card·Badge 재사용
- Vitest 데이터 계약 + Playwright 공개 경로 E2E
- 현재 도구와 역사적 도구의 콘텐츠 경계

## Phase 1: Design and Contracts

- [data-model.md](./data-model.md): 작업물 상세, 지표, 데모, 스윔레인과 검증 규칙
- [contracts/portfolio-detail-contract.md](./contracts/portfolio-detail-contract.md):
  데이터 접근자, structured/legacy 렌더링 상태와 공개 UI 계약
- [quickstart.md](./quickstart.md): 타입·단위·빌드·E2E·접근성 검증 절차

설계 후 헌법 재검토 결과 모든 원칙이 PASS이며 복잡성 예외는 없다.

## Delivery Strategy

1. E2E 작업 등록과 테스트 진입점을 마련한다.
2. 실패하는 데이터 계약 테스트로 타입·검증·fallback 요구를 고정한다.
3. 상세 DTO·레지스트리·하네스 데이터를 구현한다.
4. 실패하는 렌더링/E2E 테스트로 상단 요약, 섹션 순서, 선택형 데모 링크,
   스윔레인, 데모 미표시와 기존 작업물 보존을 고정한다.
5. 공통 상세 구성 요소와 페이지 조합을 구현한다.
6. 네 개 신규 인사이트와 네 개 기존 인사이트의 사실·시점을 정합화한다.
7. typecheck→unit→build→e2e→브라우저 QA 순으로 검증하고 수렴한다.

## Risk Register

| 위험 | 완화 |
|---|---|
| `features.ts`, `insights.ts`, 패키지 파일에 기존 사용자 변경이 있음 | 작업 전 diff를 재확인하고 해당 파일의 승인 범위만 최소 패치하며 사용자 변경을 덮어쓰지 않는다. |
| 넓은 스윔레인이 페이지 전체 overflow를 만들 수 있음 | 명시적 내부 overflow 컨테이너와 4개 viewport E2E assertion을 둔다. |
| 시각 흐름과 대체 설명이 불일치할 수 있음 | 동일 데이터에서 다이어그램과 `<ol>`을 함께 생성하고 계약 테스트로 참조 무결성을 확인한다. |
| 정적 데이터의 잘못된 링크·지표가 빌드에 포함될 수 있음 | 레지스트리 초기화 검증과 Vitest에서 slug·링크·근거 필드를 검사한다. |
| E2E stamp가 기존 dirty worktree 때문에 생성되지 않을 수 있음 | 앱 전용 E2E를 직접 실행해 결과를 기록하고, 사용자 변경을 임의로 stage하지 않는다. stamp 불가는 잔여 위험으로 분리한다. |
| `feature:status:sync` mise 작업이 등록되어 있지 않음 | 완료 시 재시도하고, 계속 없으면 검증 기록에 도구 등록 불일치로 남긴다. |

## Complexity Tracking

헌법 위반이나 별도 복잡성 예외가 없으므로 기록할 항목이 없다.
