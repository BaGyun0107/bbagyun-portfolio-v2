# Frontend Architecture

## Stack

- **Framework**: Next.js 15+ (App Router) + React 19
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v4 + CSS Modules
- **UI Library**: shadcn/ui (Radix UI 기반, 53+ 컴포넌트)
- **Forms**: react-hook-form
- **Charts**: Recharts
- **DnD**: React DnD (dnd-kit)
- **Icons**: Lucide React
- **Markdown**: react-markdown + remark-gfm + rehype

## Structure

```
apps/front/src/
├── app/
│   ├── (public)/          # 공개 페이지 (SSR/RSC)
│   │   ├── page.tsx       # 메인 포트폴리오
│   │   ├── insights/      # 블로그/인사이트
│   │   ├── study/         # 학습 기록
│   │   └── projects/      # 프로젝트 포트폴리오
│   ├── admin/             # 관리자 페이지 (Client Components, JWT 보호)
│   └── layout.tsx         # Root Layout
├── components/
│   ├── ui/                # shadcn/ui 베이스 컴포넌트
│   ├── admin/             # 관리자 전용 컴포넌트
│   ├── common/            # 공용 재사용 컴포넌트
│   ├── figma/             # Figma 디자인 시스템 연동
│   └── layout/            # Header, Footer, Sidebar
├── lib/
│   ├── api/               # API 클라이언트 레이어
│   │   ├── fetcher.ts     # 통합 API 클라이언트 (SSR/CSR 자동 감지)
│   │   ├── config.ts      # Base URL 설정
│   │   └── services/      # 도메인별 클라이언트 서비스
│   └── utils.ts           # cn() — Tailwind 클래스 병합
└── data/                  # 정적 데이터, 상수
```

## Rules

### 렌더링 전략
- **공개 페이지**: Server Components (RSC) 우선 — SEO, 초기 로딩 성능
- **관리자 페이지**: Client Components — 인터랙티브 폼, 상태 관리

### 컴포넌트 규칙
- `components/ui/` — shadcn/ui 컴포넌트만 배치, 직접 수정 최소화
- 피처 컴포넌트는 `components/{domain}/`에 배치
- Import alias: `@/*` → `src/`

### API 클라이언트
- `lib/api/fetcher.ts` 통해서만 API 호출
- SSR 환경: `SERVER_INTERNAL_URL` 또는 `localhost:1104` 사용
- CSR 환경: 상대 경로 `/api/v1/` 사용
- Mock API: `NEXT_PUBLIC_USE_MOCK_API=true` 로 전환 가능

### 스타일링
- Tailwind CSS v4 유틸리티 클래스 우선
- `cn()` 유틸리티로 조건부 클래스 병합
- 커스텀 CSS는 CSS Modules 사용

<!-- MANUAL: Notes below this line are preserved on regeneration -->
