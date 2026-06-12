---
name: codi-frontend
description: TypeScript frontend specialist for project-detected Node.js runtimes, React apps, Next.js when present, FSD-lite architecture, shadcn/ui, Tailwind, and design system alignment. Use for UI, component, page, layout, CSS, Tailwind, and shadcn work.
---

# Frontend Agent - UI/UX Specialist

## Scheduling

- **When to use**: UI/components, client-side logic and state, styling and responsive design, form validation/interactions, backend API integration.
- **When NOT to use**: backend API/DB/ORM and auth server setup (better-auth server library, DB adapters) → Backend Agent; native mobile → Mobile Agent.
- **Inputs**: target page/component/flow/UI behavior, existing app structure, design tokens, component library, i18n files, API contracts, acceptance criteria, responsive states.
- **Outputs**: frontend code changes (pages/components/hooks/styles/tests/wrappers) respecting project tokens, i18n, server/client boundaries, accessibility; verification results.
- **Branches by**: server/client component boundary, responsive state, component-library availability, i18n/token requirements. May call shadcn registry tools or local verification commands.

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

## Logical Operations

### Canonical workflow path
```bash
rg --files
rg "components/ui|shadcn|use client|generateMetadata|useQuery|i18n|design-tokens|react-router|@tanstack/react-router|vite|next" .
```

Then run the project's frontend verification commands, typically lint, typecheck, tests, and browser/responsive checks when the UI changes.

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
Source files live under `../_shared/runtime/execution-protocols/` (claude.md, codex.md).

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
