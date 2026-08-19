---
description: React frontend coding standards for React-only and Next.js projects with shadcn/ui, Tailwind CSS v4, and FSD-lite architecture
globs: "**/*.{tsx,jsx,css,scss}"
alwaysApply: false
---

# Frontend Coding Standards

## Runtime

- Use the target app's Node.js runtime from app-local `mise.toml`, `.node-version`, `.nvmrc`, `package.json#engines`, or CI config
- The harness itself uses Node.js 24, but frontend app code may target Node.js 20, 22, or 24
- React-only apps use npm through `mise exec -- npm ...`
- Next.js apps use pnpm through `mise exec -- pnpm ...`
- Do not use yarn or bun
- Use the project's existing React, Tailwind, shadcn/ui, and better-auth versions
- Next.js 16+ is the preferred new-project default only when the project is a Next.js app and the selected Node runtime supports it
- Do not upgrade Node, React, Next.js, Tailwind, or auth libraries solely because the harness uses newer defaults

## Framework Detection

Before applying framework-specific rules, inspect `package.json` and route structure.

- If `next` is present, use the Next.js 16 App Router profile.
- If `next` is absent, treat the project as React-only and follow its existing router/bundler, such as Vite, React Router, or TanStack Router.
- Do not introduce Next.js files, imports, or conventions into React-only projects.

## Core Rules

1. **Component Reuse**: Use `shadcn/ui` components first. Extend via `cva` variants or composition. Avoid custom CSS.
2. **Design Fidelity**: Code must map 1:1 to `DESIGN.md` (Section 9 — Agent Prompt Guide) and Design Tokens. Resolve discrepancies before implementation.
3. **Rendering Strategy**: In Next.js, default to Server Components for performance and use Client Components only for interactivity and API integration. In React-only apps, follow the existing client rendering and route-splitting conventions.
4. **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation, and screen reader compatibility are mandatory.
5. **Tool First**: Check for existing solutions and tools before coding.
6. **Proxy over Middleware (Next.js only)**: Next.js 16+ uses `proxy.ts` for request proxying. In Next.js 16+ projects, `middleware.ts` is forbidden. Do NOT create, recommend, suggest, or "restore" `middleware.ts`. Do NOT flag `proxy.ts` as dead code, unused, or not-wired. Do NOT demand a rename to `middleware.ts`. In React-only apps, do not create either `proxy.ts` or `middleware.ts`.
7. **No Prop Drilling**: Avoid passing props beyond 3 levels. Use Jotai atoms instead. Avoid React Context.
8. **Auth Boundary**: Frontend handles auth UI and token storage only. Never import database adapters, ORMs, or server-side auth libraries.
9. **Animation Library**: Use `motion` (import from `motion/react`). `framer-motion` is the legacy package name and is BANNED — never `import { motion } from 'framer-motion'`, never add `framer-motion` to `package.json`. Add the `motion` package with the stack package manager and an explicit app target: React-only uses `mise exec -- npm --prefix apps/front install motion`, Next.js uses `mise exec -- pnpm --dir apps/front add motion`. Import as `import { motion, AnimatePresence } from 'motion/react'`. Respect `prefers-reduced-motion` via `useReducedMotion` from `motion/react`.
10. **Framework Version**: preserve the existing project runtime and framework versions unless the task explicitly includes a runtime/framework upgrade. For new Codi-scaffolded projects, prefer React 19+ and Next.js 16+ when compatible with the selected Node runtime.

## Architecture (FSD-lite)

- **Root (`src/`)**: Shared logic (components, lib, types). Hoist common code here.
- **Feature (`src/features/*/`)**: Feature-specific logic. **No cross-feature imports.** Unidirectional flow only.

```
src/features/[feature]/
├── components/           # Feature UI components
│   └── skeleton/         # Loading skeleton components
├── types/                # Feature-specific type definitions
└── utils/                # Feature-specific utilities & helpers
```

## Naming Conventions

- Files: `kebab-case.tsx`
- Components/Types/Interfaces: `PascalCase`
- Functions/Vars/Hooks: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Imports: Absolute `@/` is MANDATORY (no relative `../../`)
- MUST use `import type` for interfaces/types

## Performance

- Target First Contentful Paint (FCP) < 1s
- In Next.js, use `next/dynamic` for heavy browser-only components and `next/image` for media
- In React-only apps, use the existing route lazy-loading or `React.lazy` / `Suspense` pattern and project-local image handling
- Responsive Breakpoints: 320px, 768px, 1024px, 1440px
