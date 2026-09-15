# Apple-inspired Preview Redesign Implementation Plan

> **Status:** Superseded by `2026-08-19-content-only-portfolio.md` after the user rejected the visual redesign direction. The Apple-specific layer was removed from the active preview route.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the visual language of the `/preview` portfolio with the user-approved Apple-inspired layout while preserving all existing routes, content, evidence, theme behavior, and 8-project coverage.

**Architecture:** Keep the existing preview React component tree and data contracts. Replace the preview stylesheet and make small markup adjustments only where the new section rhythm needs semantic wrappers; do not alter the public route shell or project evidence data. Validate the result through existing Vitest, TypeScript, build, and Playwright checks.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind base, route-scoped CSS, Playwright, Vitest.

---

### Task 1: Record the approved visual direction

**Files:**
- Modify: `docs/superpowers/specs/2026-08-19-backend-first-portfolio-design.md`
- Create: `docs/superpowers/plans/2026-08-19-apple-preview-redesign.md`

- [x] **Step 1: Capture the approved Apple-inspired decisions**

Record the binary canvas palette, single blue accent, cinematic black feature section, large typography, wide whitespace, pill CTA, and no-source-code/no-fake-demo constraints.

- [x] **Step 2: Confirm the implementation boundary**

Keep changes inside `apps/front/src/app/(preview)`, `apps/front/src/components/portfolio-preview`, and preview-scoped styles (`portfolio-preview.css` plus the Apple direction layer in `portfolio-apple.css`); preserve the public route tree and data evidence contracts.

### Task 2: Rework the preview shell and homepage hierarchy

**Files:**
- Modify: `apps/front/src/styles/portfolio-preview.css`
- Modify: `apps/front/src/components/portfolio-preview/PreviewHeader.tsx`
- Modify: `apps/front/src/components/portfolio-preview/PreviewHome.tsx`

- [x] **Step 1: Add a failing visual-contract assertion**

Extend `apps/front/e2e/portfolio-preview.spec.ts` with assertions that `/preview` exposes the Apple-inspired section landmarks: `대표 작업물`, `전체 작업물`, `최근 개발 기록`, and `공부와 인사이트`, while retaining all 8 project links.

- [x] **Step 2: Replace the old preview tokens**

Use CSS variables based on `#f5f5f7`, `#ffffff`, `#000000`, `#1d1d1f`, `#0071e3`, and `#0066cc`. Remove the old teal/warm accent system, dense border treatment, and high-frequency shadows.

- [x] **Step 3: Implement Apple-style navigation**

Make the header a 44–52px translucent dark navigation bar with compact links, a blue pill action, accessible theme toggle, and no heavy bordered panel styling.

- [x] **Step 4: Implement the homepage scene rhythm**

Style the homepage as:

1. light-gray centered hero with large title and two pill actions;
2. black featured-project scene with architecture preview;
3. light-gray two-column all-project card grid/list;
4. white case-study reading preview;
5. black development-record section;
6. white study/insight section.

Keep the current data-driven 8-project rendering and existing links.

- [x] **Step 5: Run the focused E2E test**

Run `pnpm --dir apps/front e2e -- e2e/portfolio-preview.spec.ts`; expect the new landmarks and all existing route assertions to pass.

### Task 3: Rework the detail page visual hierarchy

**Files:**
- Modify: `apps/front/src/styles/portfolio-preview.css`
- Modify: `apps/front/src/components/portfolio-preview/ProjectDetail.tsx`
- Modify: `apps/front/src/components/portfolio-preview/ProjectTableOfContents.tsx`

- [x] **Step 1: Add a failing detail visual assertion**

Assert that the representative detail route contains the case-study hero, left navigation, long-form content, architecture/data evidence, and related content without changing the existing accessible headings.

- [x] **Step 2: Style the detail page as an editorial reading surface**

Use a wide white canvas, compact metadata, large title, blue links, thin separators only where needed, and a readable content column. Keep the TOC sticky on desktop and convert it to a compact block on mobile.

- [x] **Step 3: Preserve evidence readability**

Keep diagram cards, ERD entities, API/operations cards, focus outlines, alt text, and local horizontal scrolling. Recolor artifacts to the Apple neutral/blue palette without removing any evidence.

- [x] **Step 4: Run the detail E2E test**

Run `pnpm --dir apps/front e2e -- e2e/portfolio-preview.spec.ts`; expect project title, problem section, architecture heading, ERD heading, dark mode, and 8-route smoke checks to pass.

### Task 4: Verify responsive and theme behavior

**Files:**
- Modify: `apps/front/src/styles/portfolio-preview.css`
- Modify: `apps/front/e2e/portfolio-preview.spec.ts`

- [x] **Step 1: Add viewport checks**

Verify 320px keeps the diagram scroll local and the navigation usable; verify 768px, 1024px, and 1440px keep the scene widths, cards, and detail columns readable.

- [x] **Step 2: Verify the scoped dark mode**

Keep the preview-only `html.dark` behavior, blue interactive contrast, dark scene surfaces, ERD labels, SVG lines, and focus states readable. Confirm navigating to `/` removes the preview theme class.

- [x] **Step 3: Run the full verification set**

Run:

```bash
pnpm --dir apps/front test --run
pnpm --dir apps/front exec tsc --noEmit
pnpm --dir apps/front build
mise run //apps/front:e2e
```

Expected: Vitest and TypeScript pass, the build statically generates `/preview` and all 8 detail routes, and Playwright passes the preview home, detail, theme, and responsive smoke tests.

### Task 5: Record the visual QA result

**Files:**
- Modify: `specs/001-backend-first-portfolio/verification.md`
- Modify: `specs/001-backend-first-portfolio/tasks.md`

- [x] **Step 1: Record screenshots/viewport outcomes**

Document the tested viewport widths, any known workspace warnings, and whether the new `/preview` should remain a comparison route.

- [x] **Step 2: Mark only verified tasks complete**

Do not mark demo metadata or asset tasks complete until real demo URLs/assets exist. Do not replace `/` in this redesign.
