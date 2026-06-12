# Portfolio V2 — Web (Next.js)

> 박윤신 포트폴리오 사이트([bbagyun.com](https://bbagyun.com))의 프론트엔드 애플리케이션입니다.

`portfolio_v2` 모노레포의 `apps/front`에 위치한 Next.js(App Router) 앱입니다.
작업물·인사이트·학습 기록 등 포트폴리오 콘텐츠를 **코드 내 TypeScript 데이터 파일**로 관리하는 정적 중심 사이트이며, 별도 데이터베이스나 백오피스 없이 동작합니다.

---

## 🛠️ 기술 스택

| 구분 | 기술 |
| --- | --- |
| Framework | [Next.js](https://nextjs.org/) 16 (App Router, Turbopack) |
| Runtime | [React](https://react.dev/) 19 |
| Language | [TypeScript](https://www.typescriptlang.org/) 5 (strict) |
| 스타일링 | [Tailwind CSS](https://tailwindcss.com/) 4 |
| 컴포넌트 | [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/), 일부 [MUI](https://mui.com/) |
| 아이콘 | [Lucide React](https://lucide.dev/) |
| 애니메이션 | [Motion](https://motion.dev/) |
| 차트 | [Recharts](https://recharts.org/) |
| 코드 품질 | ESLint 9 (Flat Config), TypeScript strict |

> 정확한 버전은 [`package.json`](./package.json)을 기준으로 합니다.

---

## 🏗️ 디렉토리 구조

```
src/
├── app/
│   ├── (public)/           # 공개 페이지
│   │   ├── about/          # 소개
│   │   ├── projects/       # 작업물 (목록 + [slug] 상세)
│   │   ├── insights/       # 인사이트 (목록 + [slug] 상세 + archive/tags)
│   │   ├── study/          # 학습 기록 ([slug] 상세)
│   │   └── contact/        # 연락처
│   └── api/
│       └── health/         # 헬스 체크 엔드포인트
│
├── data/
│   └── portfolio/          # 콘텐츠 데이터 소스 (DB 대체)
│       ├── features.ts     # 작업물(프로젝트) 데이터
│       ├── insights.ts     # 인사이트 글 데이터
│       ├── studies.ts      # 학습 기록 데이터
│       ├── index.ts        # 조회 함수(getAllFeatures, getInsightBySlug 등)
│       └── types/          # DTO 타입 (feature/insight/study)
│
├── components/
│   ├── layout/             # 레이아웃
│   ├── common/             # 공통 컴포넌트
│   ├── ui/                 # shadcn/ui 기반 원자 컴포넌트
│   └── figma/              # 디자인 연동 컴포넌트
│
└── lib/                    # 공유 유틸리티
```

콘텐츠를 추가·수정할 때는 `src/data/portfolio/`의 해당 `*.ts` 파일을 편집합니다.
작업물은 `features.ts`, 기술 글은 `insights.ts`, 학습 기록은 `studies.ts`에 객체로 추가하며, 라우트와 화면은 데이터 변경에 따라 자동으로 생성됩니다(`generateStaticParams`).

---

## 🚀 시작하기

이 앱은 **pnpm**을 사용하며, 명령은 이 디렉토리(`apps/front`)에서 실행합니다.

```bash
# 1. 의존성 설치
pnpm install

# 2. 개발 서버 실행
pnpm dev
# → http://localhost:1104
```

> pnpm이 없다면 `corepack enable pnpm`으로 활성화하거나 `corepack pnpm <명령>`으로 실행할 수 있습니다.
> 모노레포 규칙상 의존성은 **루트가 아니라 이 디렉토리에서** 설치합니다.

---

## 📜 스크립트

| 명령어 | 설명 |
| --- | --- |
| `pnpm dev` | 개발 서버 실행 (포트 1104) |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm start` | 빌드 결과 실행 |
| `pnpm lint` | ESLint 검사 |

---

## 🚢 빌드 & 배포

- **CI**: 루트의 GitHub Actions 워크플로(`.github/workflows/deploy.yml`)가 `main`/`dev` push·PR에서 `pnpm build`로 빌드를 검증합니다.
- **배포**: 프로덕션 배포는 **Vercel**이 담당하며, `main` 머지 시 자동 배포됩니다.
- 별도 컨테이너·서버 인프라(Docker/EC2)나 런타임 데이터베이스는 사용하지 않습니다.
