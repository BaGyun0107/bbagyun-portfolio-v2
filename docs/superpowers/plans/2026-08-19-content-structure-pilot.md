# Content Structure Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply a consistent interview-oriented case-study structure to two representative work detail pages without changing the existing visual design.

**Architecture:** Keep the existing public App Router and Markdown renderer unchanged. Update only the two feature content strings and extend the content-quality contract so each pilot entry exposes role, constraints, decision trade-offs, verification, and retrospective sections.

**Tech Stack:** Next.js 16, TypeScript, MarkdownViewer, Vitest, Playwright MCP browser QA.

---

### Task 1: Add the pilot content contract

**Files:**
- Modify: `apps/front/src/data/portfolio/content-quality.test.ts`
- Test: `apps/front/src/data/portfolio/content-quality.test.ts`

- [x] **Step 1: Write the failing assertions**

Require the two pilot slugs to contain the canonical editorial sections:

```ts
const pilotSlugs = ['codi-harness-dx-platform', 'the-siena-golf-reservation'];
const requiredSections = [
  '나의 역할과 책임 범위',
  '문제 상황과 제약 조건',
  '대안 검토와 선택',
  '결과와 검증',
  '회고와 다음 개선'
];
```

- [x] **Step 2: Run the focused test and confirm it fails**

Run `pnpm --dir apps/front test --run src/data/portfolio/content-quality.test.ts`. The expected failure is that both pilot entries do not yet contain all canonical headings.

### Task 2: Rewrite two pilot bodies without changing page UI

**Files:**
- Modify: `apps/front/src/data/portfolio/features.ts`

- [x] **Step 1: Add the canonical sections to the harness entry**

Preserve the existing factual content, move its existing role description into `나의 역할과 책임 범위`, rename the existing problem/solution/result/retrospective headings to the canonical structure, and explicitly state the operational constraints and trade-offs.

- [x] **Step 2: Add the canonical sections to the reservation entry**

Preserve the existing external API, duplicate-request, file logging, and buffering facts. Add an explicit role/constraint section, a consolidated alternatives section, measurement context for the 95% I/O reduction claim, and a retrospective section.

- [x] **Step 3: Run the focused content test**

Run `pnpm --dir apps/front test --run src/data/portfolio/content-quality.test.ts`. Expect all content assertions to pass.

### Task 3: Verify the visual comparison in existing public pages

**Files:**
- Verify: `apps/front/src/app/(public)/projects/[slug]/page.tsx`

- [x] **Step 1: Run typecheck and production build**

Run `pnpm --dir apps/front exec tsc --noEmit` and `pnpm --dir apps/front build`.

- [x] **Step 2: Navigate to both public detail URLs**

Use Playwright MCP to visit:

- `http://localhost:1104/projects/codi-harness-dx-platform`
- `http://localhost:1104/projects/the-siena-golf-reservation`

Confirm the existing title, metadata, Markdown headings, long-form content, and related-insight area render without a new route or CSS surface.

- [x] **Step 3: Compare the two pages at desktop and mobile widths**

Use the existing page at 1440px and 390px widths. Confirm that only content length/heading hierarchy changes and that no page-level horizontal overflow is introduced.

### Task 4: Record verification

**Files:**
- Modify: `docs/superpowers/plans/2026-08-19-content-structure-pilot.md`

- [x] **Step 1: Mark completed steps and record commands**

Verification: `pnpm --dir apps/front test --run` passed with 4 tests, targeted ESLint passed for the changed content files, `pnpm --dir apps/front exec tsc --noEmit` passed through the production build, and `pnpm --dir apps/front build` generated 38 public routes. Playwright MCP confirmed both pilot URLs at 1440px and the reservation URL at 390px with no horizontal overflow. No visual styles, demo URLs, or diagram placeholders were added.
