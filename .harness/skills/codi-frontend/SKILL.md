---
name: codi-frontend
description: TypeScript frontend specialist for project-detected Node.js runtimes, React apps, Next.js when present, FSD-lite architecture, shadcn/ui, Tailwind, and design system alignment. Use for UI, component, page, layout, CSS, Tailwind, and shadcn work.
---

# Frontend Agent - UI/UX Specialist

## Scheduling

### Goal
Build, modify, and verify React/Next.js/TypeScript user interfaces that follow the target project's Node.js runtime, architecture, design-system constraints, accessibility expectations, and existing frontend conventions.

### Intent signature
- User asks for UI, component, page, layout, CSS, Tailwind, shadcn, form, interaction, client state, or frontend API integration work.
- User needs browser-facing implementation in a React TypeScript codebase, including React-only SPA apps and Next.js apps.

### When to use
- Building user interfaces and components
- Client-side logic and state management
- Styling and responsive design
- Form validation and user interactions
- Integrating with backend APIs

### When NOT to use
- Backend API implementation → use Backend Agent
- Database access, migrations, or ORM setup → use Backend Agent
- Auth server setup (better-auth server library, DB adapters) → use Backend Agent
- Native mobile development → use Mobile Agent

### Expected inputs
- Target page, component, flow, or UI behavior
- Existing app structure, design tokens, component library, i18n files, and API contracts
- Acceptance criteria and target responsive states

### Expected outputs
- Frontend code changes in pages, components, hooks, styles, tests, or wrappers
- UI that respects project tokens, i18n, server/client boundaries, and accessibility expectations
- Verification results from relevant lint, typecheck, tests, or browser checks

### Dependencies
- Target project runtime from `mise.toml`, `.node-version`, `.nvmrc`, `package.json#engines`, CI config, or lockfile metadata
- React, TypeScript, TailwindCSS, and `shadcn/ui` versions already used by the project
- Next.js App Router only when the target project actually uses Next.js
- Project sources of truth such as `packages/design-tokens`, `packages/i18n`, and shared utilities
- `resources/execution-protocol.md`, `resources/checklist.md`, examples, snippets, and Tailwind rules

### Control-flow features
- Branches by server/client component boundary, responsive state, component library availability, and i18n/token requirements
- Reads and writes frontend codebase files
- May call shadcn registry tools or local verification commands

## Structural Flow

### Entry
1. Identify target route, component, state boundary, and design-system constraints.
2. Detect the target project runtime before choosing dependencies or syntax:
   - prefer app-local `mise.toml`, then `.node-version`, `.nvmrc`, `package.json#engines`, and CI images
   - Node 20/22/24 projects must keep dependencies, syntax, build commands, and CI compatible with that runtime
3. Read existing patterns before adding components or utilities.
4. Detect the frontend framework profile before choosing patterns:
   - `next` dependency or `app/` routes: Next.js 16 App Router profile
   - `vite`, `react-router`, `@tanstack/react-router`, or SPA entry files: React-only profile
5. Determine whether work belongs in framework routes, components, wrappers, hooks, or styles.

### Scenes
1. **PREPARE**: Load relevant project conventions, UI requirements, and acceptance criteria.
2. **ACQUIRE**: Inspect existing components, tokens, i18n keys, APIs, and shadcn availability.
3. **ACT**: Implement UI, state, styles, validation, and integration.
4. **VERIFY**: Run checklist, automated checks, and browser/responsive validation when applicable.
5. **FINALIZE**: Summarize changed UI behavior and verification.

### Transitions
- If a strict shadcn primitive exists, use or wrap it before creating generic markup.
- If UI text is user-facing and i18n exists, add strings through the i18n source of truth.
- If the project is Next.js and interaction or hooks are needed, mark the boundary as Client Component.
- If the project is React-only, do not introduce Next.js files, imports, Server Components, `proxy.ts`, `generateMetadata`, `next/image`, `next/link`, or `next/dynamic`.
- If backend contracts are missing, coordinate with backend/API planning.

### Failure and recovery
- If design tokens or i18n sources are missing, state assumptions and follow existing local patterns.
- If verification fails, fix before handoff or report the blocker.
- If required shadcn registry access fails, use existing local components or document fallback.

### Exit
- Success: UI works across target responsive states and passes relevant checks.
- Partial success: missing assets, backend contracts, or verification gaps are explicit.

## Logical Operations

### Actions
| Action | SSL primitive | Evidence |
|--------|---------------|----------|
| Inspect existing frontend patterns | `READ` | Components, routes, hooks, styles |
| Select component and state approach | `SELECT` | Server/client and shadcn workflow |
| Implement UI code | `WRITE` | TSX, CSS, hooks, wrappers |
| Validate form/data contracts | `VALIDATE` | Zod/forms/API schemas |
| Call shadcn or verification tools | `CALL_TOOL` | Registry, lint, typecheck, tests |
| Compare responsive states | `COMPARE` | Desktop/mobile behavior |
| Report result | `NOTIFY` | Final summary |

### Tools and instruments
- React, TypeScript, TailwindCSS v4, shadcn/ui
- Next.js only when present in the target project
- `ahooks`, `es-toolkit`, `nuqs`, TanStack Query, Jotai, TanStack React Form, `zod`
- Lint, typecheck, tests, and browser inspection when applicable

### Canonical workflow path
```bash
rg --files
rg "components/ui|shadcn|use client|generateMetadata|useQuery|i18n|design-tokens|react-router|@tanstack/react-router|vite|next" .
```

Then run the project's frontend verification commands, typically lint, typecheck, tests, and browser/responsive checks when the UI changes.

### Resource scope
| Scope | Resource target |
|-------|-----------------|
| `CODEBASE` | Frontend routes, components, styles, hooks, tests |
| `LOCAL_FS` | Design tokens, i18n files, resource references |
| `PROCESS` | Build, lint, typecheck, test, browser commands |
| `NETWORK` | Backend APIs or registry tools when required |

### Preconditions
- Target UI behavior and affected frontend area are identifiable.
- Required design tokens, i18n, and API contracts are available or assumptions are stated.

### Effects and side effects
- Mutates frontend source, styles, tests, and possibly i18n keys.
- May add dependencies or shadcn components only when justified by project conventions.
- Does not edit `components/ui/*` directly.

### Guardrails
1. Follow the existing React, TypeScript, routing, bundler, and FSD-lite architecture in the target project.
2. Use `shadcn/ui` primitives and wrappers for UI work; treat `components/ui/*` as read-only.
3. Keep framework boundaries explicit. In Next.js, use Server Components for static/layout work and Client Components for interaction and hooks. In React-only apps, do not invent server/client component boundaries.
4. Use project sources of truth for design tokens, i18n strings, and shared utilities before adding local alternatives.
5. Run the execution checklist before handoff and include relevant verification results.
6. **Next.js 16 `proxy.ts` rule is conditional**: when and only when the target project uses Next.js 16+, the canonical request-proxy / auth-gate file is `proxy.ts` (root or `src/`) exporting a `proxy` function. In that profile, `middleware.ts` is BANNED. In React-only apps, do not create `proxy.ts` or `middleware.ts`.

### Libraries

| Category | Library |
|----------|---------|
| Runtime | Project-detected Node.js runtime, commonly 20, 22, or 24. The harness itself uses Node 24, but target app code must follow the app's runtime. |
| Package manager | React-only uses `npm` via `mise exec -- npm ...`; Next.js uses `pnpm` via `mise exec -- pnpm ...`. Do not use `yarn` or `bun`. |
| Framework | Use the project's existing React/Next versions. For new Codi-scaffolded apps, prefer React 19+ and Next.js 16+ when compatible with the selected Node runtime. |
| Date | `luxon` |
| Styling | `TailwindCSS v4` + `shadcn/ui` |
| Hooks | `ahooks` (pre-made hooks preferred) |
| Utils | `es-toolkit` (first choice) |
| State (URL) | `nuqs` |
| State (Server) | `TanStack Query` |
| State (Client) | `Jotai` (minimize use) |
| Forms | `@tanstack/react-form` + `zod` |
| Auth | `better-auth` (client SDK only — never import server library or database adapters) |
| Animation | `motion` — import from `motion/react`. `framer-motion` (legacy package name) is BANNED. |

### Shadcn Workflow

1. Search: `shadcn_search_items_in_registries`
2. Review: `shadcn_get_item_examples_from_registries`
3. Install: `shadcn_get_add_command_for_items`

### Framework Profiles

#### React-only

- Follow the existing bundler and router, such as Vite, React Router, or TanStack Router.
- Use client-side routing/data patterns already present in the project.
- Do not add Next.js-only APIs, files, imports, or conventions.

#### Next.js 16

- Use App Router conventions.
- Use `proxy.ts` instead of `middleware.ts` for request proxy/auth-gate behavior.
- Keep Server Component and Client Component boundaries explicit.

### Server vs Client Components

- **Server Components**: Layouts, marketing pages, SEO metadata (`generateMetadata`, `sitemap`)
- **Client Components**: Interactive features and `useQuery` hooks

This section applies only to Next.js projects. In React-only apps, components are client-rendered by default unless the project has its own SSR framework.

### UI Implementation (Shadcn/UI)

- **Usage**: Prefer strict shadcn primitives (`Card`, `Sheet`, `Typography`, `Table`) over `div` or generic classes.
- **Responsiveness**: Use `Drawer` (mobile) vs `Dialog` (desktop) via `useResponsive`.
- **Customization**: Treat `components/ui/*` as read-only. Create wrappers (e.g., `components/common/ProductButton.tsx`) or use `cva` composition. Never edit `components/ui/button.tsx` directly.

### Sources of Truth

- **DESIGN.md** (project root): visual system source of truth — read Section 9 (Agent Prompt Guide) verbatim for component prompts when present
- **Design Tokens**: `packages/design-tokens` (OKLCH) — never hardcode colors
- **i18n strings**: `packages/i18n` — never hardcode UI text
- **Custom utilities**: check `es-toolkit` first; if implementing custom logic, >90% unit test coverage is mandatory

### Designer Collaboration

- **Sync**: Map code variables to Figma layer names
- **UX**: Ensure key actions are visible "Above the Fold"

### Stack Reference

Project stack conventions live in dedicated files. **Read these before coding** — they are not optional appendix material.

| File | Owns |
|---|---|
| `resources/tech-stack.md` | Framework detection, React-only rules, Next.js 16 `proxy.ts` conventions, Serena shortcuts |
| `resources/tailwind-rules.md` | Design tokens, focus states, Tailwind v4 `@theme` syntax |
| `resources/snippets.md` | React 19 hook patterns, TanStack Query/Form, a11y card |

To extend: add `resources/<name>.md` and append a row above.

## References

1. Follow `resources/execution-protocol.md` step by step.
2. Before submitting, run `resources/checklist.md`.
Source files live under `../_shared/runtime/execution-protocols/{vendor}.md`.

- Project frontend rules (MUST load before review/implementation): `../../imported-rules/frontend.md`
- Execution steps: `resources/execution-protocol.md`
- Checklist: `resources/checklist.md`
- Error recovery: `resources/error-playbook.md`
- Context loading: `../_shared/core/context-loading.md`
- Reasoning templates: `../_shared/core/reasoning-templates.md`
- Clarification: `../_shared/core/clarification-protocol.md`
- Context budget: `../_shared/core/context-budget.md`
- Lessons learned: `../_shared/core/lessons-learned.md`

> [!IMPORTANT]
> Treat `components/ui/*` as read-only. Create wrappers for customization.
