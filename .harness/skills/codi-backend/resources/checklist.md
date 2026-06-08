# Backend Agent - Self-Verification Checklist

Run through every item before submitting your work.

## API Design
- [ ] RESTful conventions followed (proper HTTP methods, status codes)
- [ ] OpenAPI documentation complete (all endpoints documented)
- [ ] Request/response schemas defined with validation library
- [ ] Pagination for list endpoints returning > 20 items
- [ ] Consistent error response format

## Database
- [ ] Migrations created and tested
- [ ] Migration diff reviewed if generated; rollback or roll-forward strategy documented
- [ ] Destructive migration operations (`DROP`, `TRUNCATE`, destructive `ALTER TABLE`, reset/drop commands) have explicit user approval before execution
- [ ] Migration lock impact, index build method, downtime expectation, and data migration impact reviewed
- [ ] Indexes on foreign keys and frequently queried columns
- [ ] No N+1 queries; relation loading strategy chosen explicitly for the ORM in use
- [ ] No over-fetching; selected only required fields/columns/attributes
- [ ] ORM/query builder preferred; raw SQL justified and parameterized
- [ ] No user input string interpolation in SQL; dynamic identifiers use allowlists
- [ ] Write queries have bounded `WHERE`, tenant/account/user scope where applicable, and affected-row checks
- [ ] Bulk update/delete has dry-run `SELECT`, backup/restore point, transaction or batch rollback plan, and approval when destructive
- [ ] Transactions used for multi-step operations with explicit unit-of-work boundaries
- [ ] Idempotency, retry behavior, and locking/optimistic concurrency reviewed for writes
- [ ] ORM session/client/entity-manager lifecycle matches the framework's concurrency model
- [ ] Query risks reviewed: missing indexes, full scans, repeated identical queries, join row multiplication

## Security
- [ ] JWT authentication on protected endpoints
- [ ] Password hashing with bcrypt — cost factor ≥ 12 (production), ≥ 10 (dev)
- [ ] JWT algorithm pinned — HS256 + env secret OR RS256 + key pair (do not mix)
- [ ] accessToken stored as httpOnly cookie (Secure flag per environment, SameSite=Lax by default)
- [ ] refresh token rotation — issue new token on use, invalidate previous immediately
- [ ] JWT secret injected from Infisical or env vars; never exposed in code, logs, or responses
- [ ] Authorization is separated from authentication (different middleware / guard registration)
- [ ] User/account/tenant/role identity comes from verified server context, not client-supplied IDs
- [ ] Admin, role, permission, ownership, billing, and credential changes emit audit logs
- [ ] Logout and password change use a single token-invalidation entry point (jti blacklist or session rotation)
- [ ] Rate limiting on auth endpoints
- [ ] Input validation enforced (no raw user input in queries)
- [ ] SQL injection protected (ORM or parameterized queries)
- [ ] No secrets in code or logs
- [ ] No production data, PII, tokens, payment records, or support transcripts in fixtures, snapshots, seeds, docs, PRs, or issue bodies
- [ ] CSRF protection — for cookie-based auth, state-changing requests (POST/PUT/PATCH/DELETE) require CSRF token verification. Covers cases SameSite=Lax alone does not (top-level POST, embedded form). Choose one pattern: double-submit cookie OR synchronizer token.
- [ ] CORS policy — explicit origin allowlist (no `*`; wildcards are not allowed with `credentials: include`). Control preflight cache via `Access-Control-Max-Age`. Whitelist methods and headers explicitly.
- [ ] Security headers — set the following on responses:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (under HTTPS)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` — define per project (minimize script-src / style-src / img-src)

> Do not recreate v1 oma files such as `BcryptUtil`, `utils/token.ts`, or `BaseController` in v2. Follow the invariants; file names and directory layout are up to the project.

## Observability
- [ ] Single logger instance — library (pino/winston/...) is free choice, but one instance per process
- [ ] request-id assignment and propagation — assign an identifier to every request and pass it through downstream calls and response headers
- [ ] Structured log format — JSON recommended in production, text fallback allowed in dev
- [ ] Mask sensitive values — password, token, secret, Authorization, Cookie, Set-Cookie, DB URL, OAuth code, session ID, CSRF token, and reset token must not appear in logs
- [ ] Client errors do not expose stack traces, SQL text, internal paths, provider raw errors, secrets, or config values
- [ ] Auth event logging — login success/failure, token issue/revoke must be logged
- [ ] Error logging separation — stack traces only in server logs, client responses contain message only

## External Side Effects
- [ ] Payment capture/refund, SMS/email/push send, webhook replay, and customer sync use sandbox/dry-run/mock paths by default
- [ ] Live external side effects have explicit approval, target scope, count preview, and stop/rollback plan
- [ ] Retried external side effects use idempotency keys or equivalent deduplication
- [ ] Paid/high-volume APIs have timeout, retry, rate limit, and budget/volume guards

## Testing
- [ ] Unit tests for service layer logic
- [ ] Integration tests for all endpoints (happy + error paths)
- [ ] Auth scenarios tested (missing token, expired, wrong role)
- [ ] Authorization scenarios tested (wrong role, wrong tenant/user/account, forbidden resource)
- [ ] Test coverage > 80%

## Code Quality
- [ ] Clean architecture layers: router -> service -> repository
- [ ] No business logic in route handlers
- [ ] Async/await used consistently
- [ ] Type annotations on all function signatures

## Cloud Readiness
- [ ] No hardcoded config values (DB URLs, API keys, ports) — all from env vars
- [ ] No in-process state between requests (sessions, caches, counters)
- [ ] Logs written to stdout/stderr, not file — structured format (JSON) preferred
- [ ] Graceful shutdown handled for background jobs and open connections
