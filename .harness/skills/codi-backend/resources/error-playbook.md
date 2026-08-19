# Backend Agent - Error Recovery Playbook

When you encounter a failure, find the matching scenario and follow the recovery steps.
Do NOT stop or ask for help until you have exhausted the playbook.

---

## Import / Module Not Found

**Symptoms**: Module/package not found errors

1. Check the import path — typo? wrong package name?
2. Verify the dependency exists in your package manifest
3. If missing: note it in your result as "requires install the missing dependency" — do NOT install yourself
4. If it's a local module: check the directory structure with `get_symbols_overview`
5. If the path changed: use `search_for_pattern("class ClassName")` to find the new location

---

## Test Failure

**Symptoms**: test runner returns FAILED, assertion errors

1. Read the full error output — which test, which assertion, expected vs actual
2. `find_symbol("test_function_name")` to read the test code
3. Determine: is the test wrong or is the implementation wrong?
   - Test expects old behavior → update test
   - Implementation has a bug → fix implementation
4. Run the specific failing test with verbose output
5. After fix, run full test suite to check for regressions
6. **After 3 failures**: Try a different approach. Record current attempt in progress and implement alternative

---

## Database Migration Error

**Symptoms**: Migration command fails, `IntegrityError`, duplicate column

1. Read the error — is it a conflict with existing migration?
2. Check current DB state: Check current migration state
3. If migration conflicts: Rollback one migration step then fix migration script
4. If schema mismatch: compare model with actual DB schema
5. **NEVER do this**: Force-mark migrations as applied (risk of data loss)

---

## Authentication / JWT Error

**Symptoms**: 401/403 responses, `InvalidTokenError`, `ExpiredSignatureError`

1. Check: is the secret key consistent between encode and decode?
2. Check: is the algorithm specified (`HS256` vs `RS256`)? — do not mix (encode and decode must match)
3. Check: missing secret? — verify Infisical connection and env var injection order (never hardcode the secret in code or lock files)
4. Check: is the token being sent in the correct transport? — Bearer header OR httpOnly cookie (use a single storage location)
5. Check: is token expiry set correctly? (access: 15min, refresh: 7day)
6. Check: refresh rotation race — concurrent requests must keep jti single-use (invalidate the previous jti before issuing the next)
7. Check: are authentication (JWT verify) and authorization (permission check) in different middleware / guards? — authorization failure is 403, authentication failure is 401
8. Check: CSRF verification failed? — `X-CSRF-Token` header missing on a state-changing request, or header value does not match the cookie. Confirm the CSRF cookie was issued right after login.
9. Test with a manually created token to isolate the issue

---

## CORS / Preflight Error

**Symptoms**: browser console shows `blocked by CORS policy`, preflight OPTIONS responds 4xx, cookies are not sent

1. **Origin allowlist check** — with `credentials: true`, `Access-Control-Allow-Origin: *` is not allowed; an explicit origin is required
2. **Allowed methods/headers** — the preflight response must include the actual request's method and headers (especially `X-CSRF-Token`, `Content-Type`)
3. **`Access-Control-Allow-Credentials: true`** — required for cookie-based auth; the frontend must also set `credentials: include`
4. **Preflight cache** — use `Access-Control-Max-Age` to reduce OPTIONS call frequency (commonly 600~86400)
5. **Dev vs prod split** — separate dev origin (localhost:3000) and prod origin (app.example.com) via env vars

---

## N+1 Query / Slow Response

**Symptoms**: API response > 500ms, many similar SQL queries in logs

1. Enable SQL logging on the database connection
2. Count queries for a single request
3. If N+1: add eager loading strategy appropriate for your ORM to the query
4. If slow single query: check indexes with `EXPLAIN ANALYZE`
5. If still slow: consider caching with Redis

---

## Rate Limit / Quota Error (Gemini API)

**Symptoms**: `429`, `RESOURCE_EXHAUSTED`, `rate limit exceeded`

1. **Stop immediately** — do not make additional API calls
2. Save current work to `progress-{agent-id}[-{sessionId}].md`
3. Record Status: `quota_exceeded` in `result-{agent-id}[-{sessionId}].md`
4. Specify remaining tasks so orchestrator can retry later

---

## Serena Memory Unavailable

**Symptoms**: `write_memory` / `read_memory` failure, timeout

1. Retry once (may be transient error)
2. If 2 consecutive failures: fall back to local files
   - progress → write to `/tmp/progress-{agent-id}[-{sessionId}].md`
   - result → write to `/tmp/result-{agent-id}[-{sessionId}].md`
3. Add `memory_fallback: true` flag to result

---

## General Principles

- **After 3 failures**: If same approach fails 3 times, must try a different method
- **Blocked**: If no progress after 5 turns, save current state and record `Status: blocked` in result
- **Out of scope**: If you find issues in another agent's domain, only record in result — do not modify directly
- **Response schema consistency**: every endpoint follows `{ status, code?, message?, data? }` or one stack convention. Do not let a single endpoint diverge.
- **No information leakage in error messages**: never include stack traces, DB queries, secrets, or internal paths in the client response. Details go to server logs only; clients see a generalized message.
- **Generalize 5xx**: 5xx is a server problem the user cannot fix, so expose only a generic message such as "Internal Server Error" plus the request ID. 4xx returns a concrete message so the user can correct the request.
