# Implementation Plan: 백엔드 중심 포트폴리오 비교 화면

**Branch**: `001-backend-first-portfolio` | **Date**: 2026-08-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-backend-first-portfolio/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

기존 공개 라우트(`/`, `/projects`, `/projects/[slug]`)를 그대로 유지하면서 `/preview`와 `/preview/projects/[slug]` 비교 라우트를 추가한다. 새 라우트는 현재 8개 작업물을 모두 같은 재사용 템플릿으로 렌더링하고, 작업물별로 데모·시스템 개요·스윔레인/시퀀스·ERD·API 계약·운영 지표 중 존재하는 증거를 조합한다. 파일럿 콘텐츠는 외부 예약 API·로깅 병목 작업물에 먼저 채우되, 구현 범위는 8개 전체다.

테마는 기존 공개 라우트에 영향을 주지 않도록 비교 영역 안에서만 동작하는 라이트·다크 전환으로 구현한다. 장문 Markdown은 유지하고, 다이어그램과 ERD는 구조화된 메타데이터 및 SVG/HTML 렌더링 경로로 제공한다.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript, Next.js 16.1.6, React 19.2.3, target Node runtime from the existing app configuration

**Primary Dependencies**: Existing Next.js App Router, Tailwind CSS v4, Radix/shadcn primitives, react-markdown, lucide-react, existing `motion` and `next-themes` packages only when compatible with route-scoped behavior

**Storage**: Existing static TypeScript portfolio data; browser localStorage for comparison-route theme preference

**Testing**: TDD-oriented component/data contract checks where the existing harness supports them, Next.js lint/build, and Playwright MCP browser verification for route preservation, responsive diagrams, theme switching, and all 8 project links

**Target Platform**: Browser-based Next.js application at 320px, 768px, 1024px, and 1440px viewports

**Project Type**: Next.js web application, comparison-route frontend feature

**Performance Goals**: Preserve current route build behavior; keep comparison pages statically renderable; keep diagram containers from causing page-level horizontal overflow; avoid loading unnecessary media for projects without configured artifacts

**Constraints**: Existing public routes must remain comparable; no source-code publishing; no demo forced for projects without one; no backend API or database migration in this pass; accessible keyboard/focus/alternative text; diagrams may scroll horizontally only inside their own container

**Scale/Scope**: 8 existing project records, 2 new comparison route families, one reusable detail template, one content-rich pilot, optional evidence metadata for all projects

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The repository constitution is still a template placeholder and does not define enforceable project-specific principles. The active AGENTS and harness policies therefore supply the applicable gates: preserve existing routes, use the Spec Kit feature state, request TDD test tasks, keep the existing Next.js runtime, use `apps/front` ownership rules, and verify user-facing flows with browser QA.

**Gate result**: PASS with policy-based controls. No backend API or database migration is introduced, so the split profile remains a frontend-only implementation stream for this feature.

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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
apps/front/src/app/(preview)/preview/page.tsx
apps/front/src/app/(preview)/preview/projects/[slug]/page.tsx
apps/front/src/app/(preview)/preview/layout.tsx
apps/front/src/components/portfolio-preview/
├── PreviewHeader.tsx
├── PreviewThemeToggle.tsx
├── PreviewHome.tsx
├── ProjectEvidence.tsx
├── ProjectTableOfContents.tsx
├── ArchitectureArtifact.tsx
├── ErdArtifact.tsx
└── DiagramFrame.tsx
apps/front/src/data/portfolio/
├── features.ts
├── feature-evidence.ts
└── types/
    ├── feature.dto.ts
    └── feature-evidence.dto.ts
apps/front/src/styles/portfolio-preview.css
specs/001-backend-first-portfolio/
├── research.md
├── data-model.md
├── contracts/portfolio-preview-ui.md
├── quickstart.md
├── plan.md
├── tasks.md
└── spec.md
```

**Structure Decision**: Keep the existing public route tree untouched. Add a dedicated `(preview)` route group under `apps/front/src/app` and compose the new experience from `components/portfolio-preview`. Keep project-specific evidence data separate from the existing long Markdown seed content so the eight existing projects can share one renderer without turning `features.ts` into a page component. Use route-scoped theme state so comparison work does not alter the baseline view.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
