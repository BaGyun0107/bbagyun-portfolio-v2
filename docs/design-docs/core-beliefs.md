# Core Beliefs

## Operating Principles

1. **에이전트가 코드를 작성하고, 사람이 방향을 설정한다** — 멀티에이전트 시스템(oh-my-agent)으로 작업을 병렬 실행
2. **모든 변경은 CI만으로 검증 가능해야 한다**
3. **명시적 > 암묵적** — 매직 코드 금지
4. **API 계약 우선** — API 계약을 먼저 정의하고, 프론트/백 각각 구현

## Architecture Decisions

| 결정 | 근거 |
|------|------|
| Next.js 풀스택 모놀리스 | 단일 배포 단위로 복잡성 최소화, 포트폴리오 규모에 적합 |
| Clean Architecture 4계층 | 테스트 가능성, 의존성 방향 제어, 프레임워크 독립성 |
| SQLite (개발) + MySQL (프로덕션) | 로컬 개발 편의성 + 프로덕션 안정성 |
| JWT + httpOnly Cookie | SPA 인증의 보안 모범 사례, CSRF 토큰 회전 |
| shadcn/ui | 커스터마이징 가능한 컴포넌트, Radix UI 접근성 기반 |
| Prisma ORM | 타입 안전 DB 접근, 마이그레이션 관리, 스키마 우선 개발 |

## Quality Expectations

| 영역 | 기대 수준 |
|------|----------|
| 타입 안전성 | TypeScript strict, `any` 사용 금지 |
| API 일관성 | 모든 엔드포인트 `{ success, data, message }` 포맷 |
| 보안 | OWASP Top 10 준수, 인증 우회 불가 |
| 코드 구조 | Clean Architecture 레이어 규칙 절대 위반 금지 |
| 테스트 | 핵심 Use Case 단위 테스트 필수 (목표) |

<!-- MANUAL: Notes below this line are preserved on regeneration -->
