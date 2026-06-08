# Frontend Agent - Tech Stack Reference

## Core Framework
- **Runtime**: project-detected Node.js runtime, commonly Node.js 20, 22, or 24
- **Package manager**: React-only uses npm through `mise exec -- npm ...`; Next.js uses pnpm through `mise exec -- pnpm ...`. Do not use yarn or bun.
- **Base UI runtime**: the project's existing React version
- **Supported app profiles**:
  - React-only SPA or client app, commonly Vite + React Router or TanStack Router
  - Next.js App Router, only when the project depends on `next`
- **Language**: TypeScript (strict mode)
- **Testing**: Vitest, React Testing Library, Playwright

## Runtime Detection

Before adding dependencies or syntax, detect the target app runtime in this order:

1. app-local `mise.toml`
2. `.node-version`
3. `.nvmrc`
4. `package.json#engines.node`
5. CI workflow image or setup-node version

The harness itself runs on Node.js 24, but target app code must remain compatible with the app's own runtime. For Node 20/22 projects, do not introduce dependencies or framework versions that require a newer Node major unless the user approves a runtime upgrade.

## Framework Detection

Before writing frontend code, inspect `package.json` and route structure.

| Signal | Profile |
| --- | --- |
| `next` dependency, `app/`, `pages/`, `next.config.*` | Next.js |
| `vite`, `@vitejs/plugin-react`, `index.html`, `src/main.tsx` | React-only |
| `react-router` / `@tanstack/react-router` without `next` | React-only |

Default to React-only if `next` is not present. Do not introduce Next.js APIs into React-only apps.

## React-only Conventions

- Follow the existing router and bundler. Do not replace routing just because another router is preferred.
- Use ordinary React components, hooks, route modules, and provider composition.
- Use project-local image/link/navigation patterns. Do not import `next/image`, `next/link`, `next/font`, or `next/dynamic`.
- Code splitting should use the project's existing route lazy-loading or `React.lazy` / `Suspense` pattern.
- Auth gates belong in the router/provider layer or API client layer, not in `proxy.ts` or `middleware.ts`.

## Next.js 16 Conventions

Use this section only when the project actually uses Next.js 16+.

### Proxy replaces Middleware

`middleware.ts` is **BANNED** in Next.js 16+ projects. It is not merely deprecated. Use `proxy.ts` with Next.js 16+.

- File: `middleware.ts` → `proxy.ts` (root or `src/`)
- Exported function: `middleware` → `proxy`
- Config flags: `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`, etc.
- `src/proxy.ts` is the canonical request-proxy / auth-gate location

Forbidden actions (any of these is a fatal self-error — retract immediately):

- Creating a new `middleware.ts`
- Suggesting a rename of `proxy.ts` back to `middleware.ts`
- Flagging `proxy.ts` as dead code, unused, or not-wired
- Creating `proxy.ts` in a React-only app

Reference: https://nextjs.org/docs/messages/middleware-to-proxy

## Serena MCP Shortcuts
- `find_symbol("ComponentName")` — locate existing component
- `get_symbols_overview("src/components")` — list all components
- `find_referencing_symbols("Button")` — find usages before changes
