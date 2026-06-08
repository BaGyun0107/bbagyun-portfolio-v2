# Frontend Agent - Self-Verification Checklist

Run through every item before submitting your work.

## Framework Profile
- [ ] `package.json` and route structure were checked before selecting patterns
- [ ] If `next` is absent, no Next.js-only imports/files/conventions were introduced
- [ ] If `next` is present, App Router / Server Component / Client Component boundaries were respected

## Next.js 16 Conventions (only when `next` is present)
- [ ] Request-proxy/auth-gate file is named `proxy.ts` (NOT `middleware.ts`) and exports `proxy` (NOT `middleware`)
- [ ] Do NOT flag `src/proxy.ts` as dead code or recommend renaming to `middleware.ts` — `proxy.ts` is the canonical Next.js 16+ convention
- [ ] Config flags use the `Proxy` form (e.g. `skipProxyUrlNormalize`), not the legacy `Middleware` form

## React-only Conventions (only when `next` is absent)
- [ ] Existing router/bundler conventions were followed
- [ ] No `next/link`, `next/image`, `next/font`, `next/dynamic`, `generateMetadata`, `proxy.ts`, or `middleware.ts` was added
- [ ] Route-level splitting uses the project's router or `React.lazy` / `Suspense` conventions

## TypeScript
- [ ] Strict mode, no `any` types
- [ ] Explicit interfaces for all component props
- [ ] No TypeScript errors (`npx tsc --noEmit`)

## Styling
- [ ] Tailwind CSS only (no inline styles, no CSS modules)
- [ ] Responsive at 320px, 768px, 1024px, 1440px
- [ ] Dark mode supported (if project uses it)
- [ ] No hardcoded colors (use Tailwind theme tokens)

## Accessibility (WCAG 2.1 AA)
- [ ] Semantic HTML elements (`<nav>`, `<main>`, `<button>`)
- [ ] All images have alt text
- [ ] Color contrast >= 4.5:1 (normal text), >= 3:1 (large text)
- [ ] Keyboard navigation works for all interactive elements
- [ ] ARIA labels on non-obvious interactive elements
- [ ] Focus indicators visible

## UX States
- [ ] Loading state (skeleton or spinner)
- [ ] Error state (user-friendly message + retry action)
- [ ] Empty state (helpful message + CTA)
- [ ] Optimistic updates where appropriate

## Auth Boundary
- [ ] Token storage — backend sets httpOnly cookies; frontend JS never touches tokens directly
- [ ] Do not store accessToken or refreshToken in `localStorage` / `sessionStorage`
- [ ] Single post-login routing entry point (handled once in a router guard or layout)
- [ ] On 401 response, retry refresh at most once; on failure, force-redirect to the login page
- [ ] Auth-related UI (login, logout, session expiry) wires to server state (TanStack Query); do not mirror it into Jotai

## API Client
- [ ] Single client factory — choose either fetch OR axios; do not mix within the project
- [ ] BaseURL, shared headers, and credentials are centralized in the client factory
- [ ] `credentials: 'include'` — the default for every request under cookie-based auth
- [ ] CSRF token — state-changing methods (POST/PUT/PATCH/DELETE) automatically attach `X-CSRF-Token` header. The factory reads the token from the backend-issued non-httpOnly cookie and echoes it (double-submit)
- [ ] Token refresh runs only in request/response interceptors (individual hooks do not handle 401 directly)
- [ ] Error response normalization — map the backend response schema (`status` / `code` / `message`) directly to UI state
- [ ] Retry policy — N retries for network errors, no retries for 4xx (except `CSRF_INVALID` allows one retry after fetching a new token)
- [ ] State separation — server state in TanStack Query, URL state in nuqs, client-only state in Jotai
- [ ] Feature API hooks live under `features/<name>/api/*`; avoid component-local fetch
- [ ] request-id propagation — use the header echoed by the backend in client logs and error tracking

> Do not recreate v1 oma files such as `api-client.ts` or `feature-api.ts` with the same names or structure; follow the invariants. Directory layout is up to the project.

## Deferred / Stub Markers (transparency)
- [ ] Every deferred external integration is wrapped in `// TODO(codi-deferred): <vendor or feature>`
- [ ] Every mock data block has `// MVP: replace with <real-source>` on top
- [ ] Every save/persist UI has a working storage adapter (localStorage, IndexedDB, or API). Empty `onClick={() => console.log("save")}` does NOT count — wire actual persistence, or mark explicitly: `// TODO(codi-deferred): persist <state> to <storage>`
- [ ] Reload-after-save round-trips state for any save action surfaced in the UI

## React 19 hook patterns (catch what eslint catches)
React 19 + recent `eslint-plugin-react-hooks` flag these as hard errors. They aren't style nits — they break runtime behavior. Avoid them at write-time, not "fix later".

- [ ] **Don't put `setState` synchronously inside `useEffect`** (`react-hooks/set-state-in-effect`). Cascading renders trash performance and, in graphics contexts, can exhaust GPU resources. Replace with: derive in render (`const count = items.length`), lazy `useState` initializer (`useState(() => computeOnce())`), move the update into the event handler that triggered it, or `useSyncExternalStore` for external subscriptions.
- [ ] **Don't read `ref.current` during render** (`react-hooks/refs`). Refs are null on first render and don't trigger re-renders when they attach, so any JSX gated on `ref.current` is wrong. Read refs only inside event handlers or effects. When a child component needs an instance, pass the ref object itself (or use a callback ref) — let the child read `.current` from inside its own effect/handler.
- [ ] **`useEffect` deps complete and stable.** List every referenced reactive value. Wrap object/array literals in `useMemo` so the dep identity doesn't change every render.
- [ ] **No prop-mirroring via effect.** `useEffect(() => setX(derive(props)))` is always a bug — compute `x` in the render body or memoize.

## react-three-fiber specifics
- [ ] Heavy components (`Canvas`, drei helpers, anything that touches `window`/WebGL) load through the framework's client-only pattern. In Next.js use `next/dynamic` with `ssr: false`; in React-only apps use existing lazy-loading or route splitting.
- [ ] Effects, helpers, and post-process passes mount unconditionally on the relevant state — don't gate them on `ref.current` truthiness in JSX.
- [ ] Background and lighting work without remote assets when the project doesn't ship a CDN HDR. Solid `<color attach="background">` or local textures beat a `<Environment preset>` that depends on network.
- [ ] Shadow map sizes scale to the number of lights; default to 1024 unless the scene needs more. Multiple 2048-shadowed lights drain GPU memory on integrated graphics.

## Performance
- [ ] No unnecessary re-renders (check with React DevTools Profiler)
- [ ] Code splitting for route-level components
- [ ] Images optimized and lazy-loaded

## Testing
- [ ] Unit tests for components with logic
- [ ] User interactions tested (click, type, submit)
- [ ] Async behavior tested (loading -> data -> display)
