# Portfolio V2

> Next.js 15 풀스택 포트폴리오 + Admin CMS (Clean Architecture)

## Architecture

[ARCHITECTURE.md](ARCHITECTURE.md) — 도메인 맵, 4계층 구조, 데이터 흐름

## Documentation

- [Design Docs](docs/design-docs/index.md) — 아키텍처 결정과 운영 원칙
- [Execution Plans](docs/exec-plans/) — 활성 및 완료된 실행 플랜
- [Product Specs](docs/product-specs/index.md) — 피처 명세
- [References](docs/references/) — LLM 최적화 외부 라이브러리 문서

## Domain Guides

- [Frontend](docs/FRONTEND.md) — Next.js 15 App Router, React 19, shadcn/ui, SSR/RSC 전략
- [Security](docs/SECURITY.md) — JWT+httpOnly Cookie, CSRF 회전, OWASP 체크리스트
- [Reliability](docs/RELIABILITY.md) — 에러 처리 계층, 로깅, 성능 기준

## Quality & Planning

- [Quality Score](docs/QUALITY-SCORE.md) — 도메인별 품질 등급
- [Code Review](docs/CODE-REVIEW.md) — 리뷰 기준과 체크리스트
- [Plans](docs/PLANS.md) — 플랜 작성 컨벤션
- [Tech Debt](docs/exec-plans/tech-debt-tracker.md) — 기술 부채 트래커 (8건)
- [Product Sense](docs/PRODUCT-SENSE.md) — 제품 비전, 사용자 모델, 우선순위

## 도구 역할 분담

| 역할 | 도구 |
|:-----|:-----|
| 플랜 작성 (CEO→Design→Eng) | `gstack /autoplan` |
| 코드 리뷰 / Codex 2차 검토 | `gstack /review`, `gstack /codex` |
| CI/CD, 커밋, PR, 배포 | `gstack /ship`, `gstack /setup-deploy` |
| 버그 조사 | `gstack /investigate` |
| 브라우저 QA 자동화 | `gstack /qa` |
| **보안/접근성 감사** | `oma-qa` (oh-my-agent) |
| **백엔드 구현** | `oma-backend` → `apps/front/src/app/api/`, `core/`, `infrastructure/` |
| **프론트엔드 구현** | `oma-frontend` → `apps/front/src/app/`, `components/` |
| **DB 스키마/마이그레이션** | `oma-db` → `apps/front/prisma/` |
| **프로젝트 초기화** | `/deepinit` (oh-my-agent) |

## Project Structure

```
apps/front/                  ← 메인 앱 (Next.js 15 풀스택)
  src/app/             ← App Router (공개 + 관리자 + API)
  src/core/            ← Domain + Application (Clean Architecture)
  src/infrastructure/  ← Prisma 구현체
  src/components/      ← React 컴포넌트 (shadcn/ui 53+)
  src/lib/             ← 유틸리티, API 클라이언트
  prisma/              ← DB 스키마, 마이그레이션, 시드
.agents/               ← SSOT (직접 수정 금지)
.claude/               ← Claude Code 설정, 훅, 서브에이전트
docker/                ← Docker Compose 설정
.github/workflows/     ← CI/CD 파이프라인
```

Boundary: [apps/front/AGENTS.md](apps/front/AGENTS.md)

## Quick Rules

1. **Clean Architecture 레이어 규칙**: Domain ← Application ← Infrastructure ← Routes (역방향 임포트 금지)
2. **API 응답 포맷**: 모든 엔드포인트 `{ success, data, message }` 구조
3. **`.agents/` 직접 수정 금지** — `stack/` 디렉터리만 예외
4. **공개 페이지는 SSR/RSC 우선** — Admin만 Client Components
5. **코드 리뷰 기준**: [CODE-REVIEW.md](docs/CODE-REVIEW.md) 참조

<!-- MANUAL: 수동 노트는 이 줄 아래에 -->
