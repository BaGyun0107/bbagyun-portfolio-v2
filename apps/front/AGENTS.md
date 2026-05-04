<!-- Parent: ../AGENTS.md -->

# Next.js App (apps/front/)

> 풀스택 포트폴리오 + Admin CMS — 프론트엔드와 백엔드가 통합된 메인 앱

## Constraints

- Clean Architecture 4계층 엄수: `core/domain/`은 외부 의존성 없음
- API 라우트는 반드시 `withApiHandler` 래퍼 사용
- 공개 페이지는 Server Components 우선
- Import alias `@/*` → `src/` (상대 경로 `../../` 지양)
- shadcn/ui 컴포넌트는 `components/ui/`에만 배치

## Working Here

- **API 추가**: `app/api/v1/{domain}/route.ts` → Use Case → Repository Interface → Prisma 구현체
- **페이지 추가**: `app/(public)/{page}/page.tsx` (SSR) 또는 `app/admin/{page}/page.tsx` (Client)
- **컴포넌트 추가**: `components/{domain}/` 또는 `components/common/`
- **DB 변경**: `prisma/schema.prisma` 수정 → `npx prisma generate` → Repository 업데이트

## Dependencies

- Depends on: SQLite (개발) / MySQL (프로덕션), Node.js 24
- Depended on by: Docker 배포, GitHub Actions CI/CD

<!-- MANUAL: Notes below this line are preserved on regeneration -->
