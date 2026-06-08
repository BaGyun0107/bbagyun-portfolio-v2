# Backend Agent - Examples

## Example 1: CRUD API Endpoint

**Input**: "Create a TODO CRUD API with user ownership"

**Output**:
```
## Task: TODO CRUD API

### Endpoints Implemented
- POST /api/todos (create)
- GET /api/todos (list, user-scoped)
- GET /api/todos/{id} (detail)
- PATCH /api/todos/{id} (update)
- DELETE /api/todos/{id} (delete)

### Database Schema
- todos table: id (UUID), title (VARCHAR), completed (BOOL), user_id (FK), created_at
- Index on user_id

### Security
- [x] All endpoints require JWT auth
- [x] User can only access own todos (user_id filter)
- [x] Input validated with schema validation

### Files Created
- app/models/todo.*
- app/schemas/todo.*
- app/services/todo_service.*
- app/api/todos.*
- tests/test_todos.*
- migrations/xxx_add_todos.*
```

## Example 2: Authentication System

**Input**: "Add JWT authentication with register and login"

**Output**:
```
## Task: JWT Authentication

### Endpoints Implemented
- POST /api/auth/register (email + password)
- POST /api/auth/login (sets httpOnly cookies)
- POST /api/auth/refresh (refresh token rotation)
- POST /api/auth/logout (cookie clear + token revoke)

### Security
- [x] Password hashed with bcrypt — cost factor 12
- [x] JWT algorithm pinned — HS256 + Infisical-injected secret (or RS256 + key pair)
- [x] Access token stored as httpOnly cookie — 15min, Secure(prod), SameSite=Lax
- [x] Refresh token stored as httpOnly cookie — 7day, single-use rotation, jti tracked
- [x] CSRF token — login response issues CSRF token as a non-httpOnly cookie; state-changing requests echo it as `X-CSRF-Token` header; server verifies header matches cookie (double-submit pattern)
- [x] Single entry point for logout / password change — delegated to a token-invalidation middleware
- [x] Authentication != authorization — JWT verification middleware and permission guard are registered separately
- [x] CORS — explicit frontend origin allowlist, `credentials: true`, preflight cache 600s
- [x] Security headers — HSTS, X-Content-Type-Options, X-Frame-Options=DENY, Referrer-Policy set
- [x] Rate limiting: 5 attempts/min on login
- [x] Login success and failure both written to logger (email + IP only; password and tokens masked)

### Files Created (example layout — adapt to project structure)
- app/models/user.*
- app/schemas/auth.*
- app/services/auth_service.*
- app/api/auth.*
- app/core/security.* (JWT helpers, password hashing)
- tests/test_auth.*
```

> File names and directory layout are an example, not a mandate. Do not recreate v1 oma files such as `BcryptUtil`, `utils/token.ts`, or `asyncErrorWrapper`; use Express 5 native async error handling or NestJS Exception Filter.

## Example 3: Fixing N+1 Query

**Input**: "The /api/posts endpoint is slow, taking 2s for 50 posts"

**Output**:
```
## Task: Fix N+1 Query in Posts API

### Root Cause
Each post triggers a separate query for its author (N+1 problem).

### Fix
Added eager loading for the Post.author relation.

### Before: 51 queries (1 + 50)
### After: 1 query with JOIN

### Files Modified
- app/api/posts.* (added eager loading)
- tests/test_posts.* (added performance assertion)
```

## Example 4: Centralized Error Handling

**Input**: "Standardize error responses across all endpoints"

**Output**:
```
## Task: Centralized Error Handling

### Response schema (success and error)
- Success: { status: "success", data: <payload> }
- Error: { status: "error", code: <string>, message: <string>, details?: <any> }

### Exception -> HTTP status mapping
| Exception | HTTP | code |
| --- | --- | --- |
| ValidationError | 400 | VALIDATION_FAILED |
| UnauthorizedError | 401 | UNAUTHORIZED |
| CsrfError | 403 | CSRF_INVALID |
| ForbiddenError | 403 | FORBIDDEN |
| NotFoundError | 404 | NOT_FOUND |
| ConflictError | 409 | CONFLICT |
| RateLimitError | 429 | RATE_LIMITED |
| (uncaught) | 500 | INTERNAL_ERROR |

### Core rules
- [x] No repeated try/catch in route handlers — delegate to a single central error handler
- [x] 4xx returns the original client message; 5xx returns a generalized message and writes the stack trace to the server log
- [x] Never expose stack traces, DB queries, or secrets in client responses
- [x] Every error is recorded in the logger (request ID, path, user ID, status, code)
```

## Example 5: Logger with Request ID

**Input**: "Add structured logging with request tracing"

**Output**:
```
## Task: Logger + Request ID

### Touchpoints
- request-id middleware — at the entry point, read X-Request-ID header or generate a UUID
- logger instance — one per process; create a child logger from the request context
- response header — echo X-Request-ID back

### Masked fields
password, token, refreshToken, accessToken, secret, authorization, cookie, x-api-key

### Auth log examples
- login.success: { event, userId, ip, requestId }
- login.failure: { event, email(masked), ip, reason, requestId }
- token.issue / token.revoke: { event, userId, jti, requestId }

### Core rules
- [x] Logger library is free choice — pick one of pino, winston, bunyan, etc.
- [x] Structured JSON output in prod, text fallback in dev
- [x] Stack traces only in server logs; client responses contain message only
- [x] request-id is also forwarded as a header to downstream API calls
```
