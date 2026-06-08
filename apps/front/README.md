# 📁 Portfolio V2 — Backend (Next.js)

> 클린 아키텍처 기반의 풀스택 개인 포트폴리오 애플리케이션 (Next.js App Router)

---

## 📌 소개

`portfolio_v2`의 메인 서버/클라이언트 애플리케이션입니다.  
Next.js App Router를 활용하여 **공개 포트폴리오 페이지**와 **관리자 백오피스**를 단일 프레임워크에서 제공합니다.  
클린 아키텍처 원칙을 적용하여 도메인 로직, 인프라, UI를 계층적으로 분리했습니다.

---

## 🛠️ 기술 스택

### Core

| 구분      | 기술                                          | 버전   |
| --------- | --------------------------------------------- | ------ |
| Framework | [Next.js](https://nextjs.org/)                | 16.1.6 |
| Runtime   | [React](https://react.dev/)                   | 19.2.3 |
| Language  | [TypeScript](https://www.typescriptlang.org/) | ^5     |

### Database & ORM

| 구분     | 기술                                     | 버전    |
| -------- | ---------------------------------------- | ------- |
| ORM      | [Prisma](https://www.prisma.io/)         | ^6.19.2 |
| Database | SQLite (개발), 추후 PostgreSQL 전환 예정 | —       |

### Authentication

| 구분       | 기술                                      |
| ---------- | ----------------------------------------- |
| Token 방식 | JWT (AccessToken 10분 / RefreshToken 7일) |
| 라이브러리 | `jsonwebtoken`, `jose`, `bcryptjs`        |
| 전달 방식  | Authorization Header + HTTP-Only Cookie   |

### UI & 스타일링

| 구분                | 기술                                                                       | 버전     |
| ------------------- | -------------------------------------------------------------------------- | -------- |
| CSS Framework       | [Tailwind CSS](https://tailwindcss.com/)                                   | ^4       |
| 컴포넌트 라이브러리 | [Radix UI](https://www.radix-ui.com/), [shadcn/ui](https://ui.shadcn.com/) | —        |
| 아이콘              | [Lucide React](https://lucide.dev/)                                        | 0.487.0  |
| 애니메이션          | [Motion](https://motion.dev/)                                              | 12.23.24 |
| 차트                | [Recharts](https://recharts.org/)                                          | 2.15.2   |
| MUI                 | [@mui/material](https://mui.com/)                                          | 7.3.5    |

### 로깅 & 문서

| 구분      | 기술                                                                                        |
| --------- | ------------------------------------------------------------------------------------------- |
| 서버 로거 | [Winston](https://github.com/winstonjs/winston)                                             |
| HTTP 로거 | [Morgan](https://github.com/expressjs/morgan)                                               |
| API 문서  | [Swagger (next-swagger-doc)](https://github.com/jellydn/next-swagger-doc), swagger-ui-react |

### 코드 품질

| 구분      | 기술                                             |
| --------- | ------------------------------------------------ |
| Linter    | ESLint v9 (Flat Config) + `eslint-plugin-import` |
| Formatter | Prettier ^3                                      |
| 타입 검사 | TypeScript strict mode                           |

### 배포

| 구분       | 기술                                              |
| ---------- | ------------------------------------------------- |
| 컨테이너   | Docker (Next.js standalone + SQLite)               |
| CI/CD      | GitHub Actions (main/dev push → EC2 자동 배포)     |
| 서버       | AWS EC2 (t3.small)                                 |

---

## 🏗️ 아키텍처

클린 아키텍처(Clean Architecture) 원칙에 따라 아래와 같이 계층을 분리합니다.

```
src/
├── app/                    # Next.js App Router (라우팅 진입점)
│   ├── (public)/           # 공개 페이지 (포트폴리오)
│   ├── (admin)/            # 관리자 백오피스 (인증 필요)
│   └── api/                # RESTful API 라우트
│
├── core/                   # 핵심 도메인 계층 (비즈니스 로직)
│   ├── application/
│   │   ├── dtos/           # 데이터 전송 객체 (TypeScript 인터페이스)
│   │   ├── middlewares/    # API 핸들러 래퍼 (인증, 로깅)
│   │   └── utils/          # 공통 유틸리티 (api-response, jwt)
│   └── domain/
│       └── repositories/   # Repository 인터페이스 (추상층)
│
├── infrastructure/         # 인프라 계층 (DB, 외부 서비스)
│   └── repositories/       # Prisma 기반 Repository 구현체
│
├── components/             # 재사용 가능한 UI 컴포넌트
│   ├── layout/             # AdminLayout, PublicLayout
│   └── ui/                 # shadcn/ui 기반 원자 컴포넌트
│
└── lib/                    # 공유 유틸리티
    └── utils/              # logger, jwt, httpLogger
```

---

## 🗄️ 데이터베이스 스키마

Prisma를 통해 관리하며, 모든 테이블·컬럼명은 `snake_case`로 매핑됩니다.

| 테이블             | 설명                                       |
| ------------------ | ------------------------------------------ |
| `users`            | 관리자 계정 정보                           |
| `refresh_tokens`   | JWT 리프레시 토큰 관리 (multi-device 지원) |
| `features`         | 포트폴리오 작업물(Work) 정보               |
| `insights`         | 기술 인사이트 게시글                       |
| `logs`             | API 요청/응답 로그 (상세 로깅 포함)        |
| `system_settings`  | 전역 시스템 설정                           |
| `contact_messages` | 사용자 문의 메시지                         |

---

## 🚀 시작하기

### 1. 패키지 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성하고 값을 채웁니다.

```bash
cp .env.example .env
```

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
JWT_ACCESS_EXPIRES_IN="10m"
JWT_REFRESH_EXPIRES_IN="7d"
```

### 3. 데이터베이스 마이그레이션

```bash
npx prisma migrate dev
```

### 4. (선택) 시드 데이터 삽입

```bash
npx prisma db seed
```

### 5. 개발 서버 실행

```bash
pnpm dev
# → http://localhost:1104
```

---

## 📜 주요 스크립트

| 명령어                   | 설명                       |
| ------------------------ | -------------------------- |
| `pnpm dev`               | 개발 서버 실행 (포트 1104) |
| `pnpm build`             | 프로덕션 빌드              |
| `pnpm start`             | 프로덕션 서버 실행         |
| `pnpm lint`              | ESLint 검사                |
| `npx prisma studio`      | Prisma GUI (DB 조회)       |
| `npx prisma migrate dev` | DB 마이그레이션 실행       |
| `npx prisma db seed`     | 시드 데이터 삽입           |

---

## 🔐 API 인증 흐름

```
[로그인 요청]
    ↓
accessToken (10분) + refreshToken (7일, HTTP-Only Cookie) 발급
    ↓
API 요청 시 Authorization: Bearer <accessToken> 헤더 포함
    ↓
accessToken 만료 시 → /api/v1/auth/refresh 호출하여 재발급
    ↓
refreshToken 만료 시 → 재로그인 필요
```

---

## 📖 API 문서

개발 서버 실행 후 아래 경로에서 Swagger UI를 확인할 수 있습니다.

```
http://localhost:1104/api-doc
```

---

## 🗂️ 버전 히스토리

| 버전    | 날짜       | 변경 내용                                                                |
| ------- | ---------- | ------------------------------------------------------------------------ |
| `0.1.2` | 2026-03-30 | Docker 컨테이너화 + GitHub Actions CI/CD 자동 배포 파이프라인 구축 (AWS EC2) |
| `0.1.1` | 2026-03-30 | oh-my-agent 하네스 적용, AGENTS.md/ARCHITECTURE.md/docs/ 지식 베이스 구축 |
| `0.1.0` | 2026-02-25 | 초기 프로젝트 세팅 (Next.js, Prisma, 클린 아키텍처, 인증/인가 기반 구축) |
