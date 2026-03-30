# Security Policy

## Auth Pattern

### JWT + httpOnly Cookies
- **accessToken**: 10분 만료, httpOnly cookie
- **refreshToken**: 7일 만료, httpOnly cookie
- **csrfToken**: accessToken 갱신 시 함께 회전

### 인증 흐름
1. `POST /api/v1/auth/login` — 자격증명 검증, 3개 토큰 발급 (cookie)
2. Edge Middleware (`src/middleware.ts`) — `/admin/**` 요청 시 JWT 검증
3. `POST /api/v1/auth/refresh` — accessToken 만료 시 refreshToken으로 갱신
4. `POST /api/v1/auth/logout` — 모든 토큰 쿠키 제거

### 비밀번호
- bcryptjs 해싱 (저장 시)
- 평문 전송 금지 (HTTPS 필수)

## Data Handling

### 민감 데이터
- JWT 시크릿: 환경변수 (`JWT_SECRET`, `REFRESH_TOKEN_SECRET`)
- DB 파일: `.gitignore`에 등록 (`*.db`)
- `.env` 파일 커밋 금지

### 입력 검증
- API 라우트 핸들러에서 입력 검증 수행
- Prisma의 parameterized queries로 SQL injection 방지
- XSS: React의 기본 이스케이프 + 마크다운 렌더링 시 주의

## Forbidden Patterns

1. **클라이언트에 시크릿 노출 금지** — `NEXT_PUBLIC_` 접두사에 비밀키 사용 금지
2. **직접 SQL 쿼리 금지** — 반드시 Prisma ORM 사용
3. **토큰을 localStorage에 저장 금지** — httpOnly cookie만 사용
4. **CORS wildcard 금지** — 명시적 origin 설정
5. **인증 우회 API 금지** — `/admin/**` 외 민감 데이터 접근 API는 별도 검증 추가

## OWASP Top 10 체크리스트

| # | 항목 | 대응 |
|---|------|------|
| A01 | Broken Access Control | Edge Middleware JWT 검증, 역할 기반 접근 |
| A02 | Cryptographic Failures | bcryptjs 해싱, httpOnly/Secure cookie |
| A03 | Injection | Prisma parameterized queries |
| A04 | Insecure Design | Clean Architecture 레이어 분리 |
| A05 | Security Misconfiguration | 환경변수 분리, `.env` 미커밋 |
| A07 | XSS | React 자동 이스케이프, CSP 헤더 |

<!-- MANUAL: Notes below this line are preserved on regeneration -->
