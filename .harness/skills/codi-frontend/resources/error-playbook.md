# Frontend Agent - Error Recovery Playbook

When you encounter a failure, find the matching scenario and follow the recovery steps.
Do NOT stop or ask for help until you have exhausted the playbook.

---

## False Positive: `proxy.ts` flagged as dead code or `middleware.ts` demanded

**Symptoms**: Reviewer claims `src/proxy.ts` won't be picked up, demands rename to `src/middleware.ts`, or flags the auth gate as not wired.

1. Check `package.json` first.
2. If `next` is absent, this is a React-only app. Do not create `proxy.ts` or `middleware.ts`; put auth gates in the router/provider/API-client layer.
3. If `next@16+` is present, **STOP. This is a fatal self-error.** Next.js 16+ renamed `middleware.ts` to `proxy.ts`.
4. The canonical request-proxy / auth-gate file is `proxy.ts` (root or `src/`) exporting a `proxy` function.
5. `middleware.ts` is BANNED in Next.js 16+ projects, not merely deprecated.
6. Verify by checking `package.json` for `next@16+`; `proxy.ts` is the only correct answer.
7. Reference: https://nextjs.org/docs/messages/middleware-to-proxy
8. **Retract the finding.** Do NOT raise this as critical / security / medium / low at any severity.

---

## TypeScript Compilation Error

**Symptoms**: `TS2322`, `TS2345`, `Type X is not assignable to type Y`

1. Read the error — which file, which line, which types conflict
2. Check: is the interface/type definition correct?
3. Check: is the API response type matching the expected shape?
4. If API mismatch: update the type to match actual response (don't cast with `as any`)
5. If generic issue: use explicit type parameter `<Type>` instead of inference
6. **NEVER do this**: `@ts-ignore`, `as any` — hides type issues without resolving them

---

## Build Error

**Symptoms**: framework build fails, `Module not found`, `SyntaxError`

1. Read the full error — which module, which file
2. If missing dependency: note in result as "requires `npm install X`" — do NOT install yourself
3. If import path wrong: use `search_for_pattern("export.*ComponentName")` to find actual path
4. If dynamic import issue in Next.js: ensure component is client-side (`'use client'`) or use `next/dynamic` when browser-only code is involved
5. If dynamic import issue in React-only apps: use the existing route lazy-loading or `React.lazy` / `Suspense` pattern
6. Re-run build after fix to confirm

---

## Test Failure

**Symptoms**: `vitest` FAILED, `expect(X).toBe(Y)` assertion errors

1. Read the error — expected vs received, which test file
2. `find_symbol("ComponentName")` to check current implementation
3. Determine: test outdated or implementation wrong?
   - Test expects old behavior → update test
   - Component bug → fix component
4. Re-run the specific test: `npx vitest run path/to/test.ts`
5. **After 3 failures**: Try a different approach. Record in progress

---

## Hydration Mismatch (Next.js)

**Symptoms**: `Hydration failed`, `Text content does not match server-rendered HTML`

1. Find the component that renders differently on server vs client
2. Common causes:
   - `Date.now()` or `Math.random()` in render
   - Browser-only APIs (`window`, `localStorage`) without `useEffect`
   - Conditional rendering based on client-only state
3. Fix: wrap client-only code in `useEffect` + state, or use `'use client'`
4. If third-party component: wrap with `dynamic(() => import(...), { ssr: false })`

---

## API Integration Error

**Symptoms**: `Network Error`, `CORS`, `401 Unauthorized`, wrong data shape

1. **CORS**: Check backend CORS config — is the frontend origin allowed? With `credentials: include`, backend must set `Access-Control-Allow-Credentials: true` and an explicit origin (wildcard `*` is not allowed)
2. **401**: under cookie auth, verify `credentials: 'include'` is present. Auto-refresh runs only in interceptors; individual hooks must not handle 401 directly. On refresh failure, force-redirect to the login page.
3. **Wrong data**: Log `response.data` and compare with the expected type — if the backend response schema (`status` / `code` / `message`) does not match, that's a contract drift; report it to the backend team
4. **Network Error**: Is the backend running? Correct port? Check that the request-id header is echoed back (for debug tracing)
5. **Missing cookie**: under SameSite=Lax + Secure, cookies do not ride on cross-origin or HTTP (non-HTTPS) requests. Check environment splits.
6. **403 CSRF_INVALID**: state-changing request is missing `X-CSRF-Token` header or its value does not match the cookie. Confirm that the `csrf_token` cookie was issued after login and that the client factory reads the cookie and echoes it as a header. Do not cache the CSRF token manually; the backend rotates it and updates the cookie.
7. If backend isn't your responsibility: document the expected API contract in result

---

## Styling / Layout Broken

**Symptoms**: Component renders but looks wrong, responsive breakpoint fails

1. Check Tailwind classes — typo? wrong breakpoint prefix?
2. Check parent container — is it blocking layout? (`overflow-hidden`, fixed width)
3. Test at specific breakpoints: 320px, 768px, 1024px, 1440px
4. Use browser DevTools to inspect computed styles
5. If dark mode issue: check `dark:` variants applied

---

## Rate Limit / Quota Error (Gemini API)

**Symptoms**: `429`, `RESOURCE_EXHAUSTED`, `rate limit exceeded`

1. **Stop immediately** — do not make additional API calls
2. Save current work to `progress-{agent-id}[-{sessionId}].md`
3. Record Status: `quota_exceeded` in `result-{agent-id}[-{sessionId}].md`
4. Specify remaining tasks

---

## Serena Memory Unavailable

1. Retry once
2. If 2 consecutive failures: use local file `/tmp/progress-{agent-id}[-{sessionId}].md`
3. Add `memory_fallback: true` flag to result

---

## Frontend Observability

**Symptoms**: user errors are hard to reproduce; logs and metrics are missing

1. **Error boundary**: a single error boundary at the root forwards caught errors to a logger sink (Sentry or an internal endpoint)
2. **request-id correlation**: include the request-id echoed by the backend in `console.error` and outgoing payloads so it can be correlated with backend logs
3. **Mask sensitive values**: never send form input values (password, token, card number) to logs or sinks
4. **User-facing error message conversion**: map 4xx codes to user-friendly messages; for 5xx, show a generalized message plus the request-id (for support contact)

---

## General Principles

- **After 3 failures**: If same approach fails 3 times, must try a different method
- **Blocked**: If no progress after 5 turns, save current state and record `Status: blocked`
- **Out of scope**: If you find backend issues, only record in result — do not modify directly
