# Architecture

> Next.js 15 풀스택 포트폴리오 + Admin CMS — Clean Architecture 4계층

## Domain Map

```
┌─────────────────────────────────────────────────┐
│                   Next.js App                    │
│  ┌───────────┐  ┌────────────┐  ┌────────────┐  │
│  │  Public    │  │   Admin    │  │  API v1    │  │
│  │  Pages     │  │   Pages   │  │  Routes    │  │
│  │ (SSR/RSC)  │  │ (Client)  │  │ (Handlers) │  │
│  └─────┬─────┘  └─────┬─────┘  └─────┬──────┘  │
│        │               │              │          │
│        └───────────────┴──────┬───────┘          │
│                               ▼                  │
│  ┌──────────────────────────────────────────┐    │
│  │        core/application (Use Cases)      │    │
│  │   AuthUC · InsightUC · StudyUC · ...     │    │
│  └──────────────────┬───────────────────────┘    │
│                     ▼                            │
│  ┌──────────────────────────────────────────┐    │
│  │         core/domain (Entities)           │    │
│  │   Interfaces · DTOs · Domain Models      │    │
│  └──────────────────┬───────────────────────┘    │
│                     ▼                            │
│  ┌──────────────────────────────────────────┐    │
│  │    infrastructure (Implementations)      │    │
│  │   Prisma Repositories · External APIs    │    │
│  └──────────────────┬───────────────────────┘    │
│                     ▼                            │
│              ┌────────────┐                      │
│              │  SQLite DB │                      │
│              └────────────┘                      │
└─────────────────────────────────────────────────┘
```

## Domains

| Domain | Owner | Key Files |
|--------|-------|-----------|
| **Auth** | JWT + httpOnly cookies | `api/v1/auth/`, `middleware.ts`, `core/application/use-cases/auth.use-case.ts` |
| **Insights (Blog)** | CRUD + 태그 + 아카이브 | `api/v1/insights/`, `core/application/use-cases/insight.use-case.ts` |
| **Studies** | 학습 기록 CRUD | `api/v1/studies/`, `core/application/use-cases/study.use-case.ts` |
| **Features (Projects)** | 프로젝트 포트폴리오 | `api/v1/features/`, `core/application/use-cases/feature.use-case.ts` |
| **Contact** | 문의 폼 수신/관리 | `api/v1/contact/` |
| **Users** | 사용자 관리 (Admin) | `api/v1/users/` |
| **Dashboard** | 통계 집계 | `api/v1/dashboard/` |
| **Settings** | 시스템 설정 | `api/v1/settings/` |
| **Logs** | HTTP 요청 로깅 | `api/v1/logs/`, `lib/utils/httpLogger.ts` |

## Layer Architecture

```
Domain ← Application ← Infrastructure ← Routes/UI
(안쪽 레이어는 바깥 레이어를 절대 임포트하지 않는다)
```

| Layer | 위치 | 책임 | 규칙 |
|-------|------|------|------|
| **Domain** | `core/domain/` | 엔티티, 리포지토리 인터페이스 | 외부 의존성 없음 |
| **Application** | `core/application/` | Use Cases, DTOs, 미들웨어 | Domain만 임포트 |
| **Infrastructure** | `infrastructure/` | Prisma 구현체, 외부 서비스 | Domain 인터페이스 구현 |
| **Presentation** | `app/`, `components/` | 라우트 핸들러, React 컴포넌트 | 모든 레이어 사용 가능 |

## API Convention

- Base path: `/api/v1/{domain}`
- 응답 포맷: `{ success: boolean, data?: T, message?: string }`
- 에러 처리: `withApiHandler` 래퍼로 일관된 에러 응답
- 인증: Edge Middleware에서 `/admin/**` JWT 검증

## Data Flow

```
Client Request
  → Edge Middleware (JWT 검증, /admin 보호)
  → Route Handler (app/api/v1/)
  → withApiHandler (에러 래핑)
  → Use Case (비즈니스 로직)
  → Repository Interface → Prisma Implementation
  → SQLite DB
  → { success, data, message } 응답
```

## Key Integration Points

- **Client ↔ API**: `lib/api/fetcher.ts` — 통합 API 클라이언트 (SSR/CSR 자동 감지)
- **API ↔ DB**: Prisma ORM — `infrastructure/repositories/*-prisma.repository.ts`
- **Auth 흐름**: accessToken (10분) + refreshToken (7일) + csrfToken 회전

## Infrastructure

- **Runtime**: Node.js 24 (mise)
- **Package Manager**: pnpm
- **Database**: SQLite (개발), MySQL 8.0 (Docker/프로덕션)
- **Deployment**: Docker Compose + GitHub Actions CI/CD
- **Port**: 1104 (개발 서버)

<!-- MANUAL: Notes below this line are preserved on regeneration -->
