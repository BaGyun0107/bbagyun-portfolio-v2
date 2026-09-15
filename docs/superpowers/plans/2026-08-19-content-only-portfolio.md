# Content-Only Portfolio Detail Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the existing portfolio design while making work, study, and insight detail content the only product surface that changes.

**Architecture:** Keep the public App Router and Tailwind layout untouched. Treat the Markdown fields in `features.ts`, `studies.ts`, and `insights.ts` as the content source of truth, add regression checks for their required editorial sections, and remove the retired `/preview` implementation entirely.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, MarkdownViewer, Vitest.

---

### Task 1: Freeze the no-redesign boundary

**Files:**
- Delete: `apps/front/src/app/(preview)/preview/`
- Delete: `apps/front/src/components/portfolio-preview/`
- Delete: `apps/front/src/styles/portfolio-preview.css`
- Delete: `apps/front/e2e/portfolio-preview.spec.ts`

- [x] **Step 1: Write the failing regression assertion**

Assert that the public detail routes remain available after deleting the retired comparison route. Do not add a replacement visual route.

- [x] **Step 2: Run the public route checks and confirm the boundary**

Run the existing content tests and production build. The expected result is that public routes remain unaffected and `/preview` is no longer part of the application route tree.

- [x] **Step 3: Remove the retired comparison implementation**

Keep the public layout and global styles unchanged. Do not replace the public route tree.

- [x] **Step 4: Re-run public route verification**

Confirm the public route and detail content assertions pass.

### Task 2: Add content-quality contracts

**Files:**
- Create: `apps/front/src/data/portfolio/content-quality.test.ts`
- Modify: `apps/front/src/data/portfolio/studies.ts`

- [x] **Step 1: Write failing content-quality tests**

Test that every feature, study, and insight has a non-empty detail body; every feature body includes problem and resolution language; and no feature exposes source-code URLs or an unverified demo URL.

- [x] **Step 2: Run the tests and verify the expected failure**

Run `pnpm --dir apps/front test --run src/data/portfolio/content-quality.test.ts`. Fix only malformed or genuinely missing content identified by the failure.

- [x] **Step 3: Implement the minimum data corrections**

Update only `features.ts`, `studies.ts`, or `insights.ts` content fields. Preserve factual wording and do not invent metrics or links.

- [x] **Step 4: Run the content tests and all unit tests**

Run the focused test, then `pnpm --dir apps/front test --run`; both must pass.

### Task 3: Verify the existing detail-page content flow

**Files:**
- Verify: `apps/front/src/app/(public)/projects/[slug]/page.tsx`
- Verify: `apps/front/src/app/(public)/study/[slug]/page.tsx`
- Verify: `apps/front/src/app/(public)/insights/[slug]/page.tsx`

- [x] **Step 1: Add public detail-page assertions**

Visit one work detail, the study detail, and one insight detail. Assert that the title, long-form body, and related navigation render through the existing public layout. The test must not assert new CSS classes or a new visual structure.

- [x] **Step 2: Run content and build checks and fix only content-flow regressions**

Run `pnpm --dir apps/front test --run` and `pnpm --dir apps/front build`. Keep the existing public layout and route tree intact.

### Task 4: Complete verification and handoff

**Files:**
- Modify: `specs/001-backend-first-portfolio/verification.md`
- Modify: `specs/001-backend-first-portfolio/tasks.md`

- [x] **Step 1: Run TypeScript and production build**

Run `pnpm --dir apps/front exec tsc --noEmit` and `pnpm --dir apps/front build`. The build must generate the public detail routes without any comparison routes.

- [x] **Step 2: Run targeted lint**

Run ESLint only for changed TypeScript/TSX files. Do not claim the pre-existing full-repository lint baseline is fixed.

- [x] **Step 3: Record the no-redesign decision and content-only verification**

Document that public design files were not changed, detail content is data-driven, and the Apple experiment is not the promotion target.
