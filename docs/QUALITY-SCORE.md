# Quality Score

> Last updated: 2026-03-30

## Domain Grades

| Domain | Grade | Notes |
|--------|-------|-------|
| Architecture (Clean Arch) | B | 4계층 구조 일관, 일부 레이어 경계 모호 |
| Auth & Security | B- | JWT+Cookie 구현 완료, CSRF 회전 구현, 테스트 미비 |
| API Layer | B | 일관된 응답 포맷, withApiHandler 래퍼 사용, Swagger 문서화 |
| Frontend (Public) | B- | SSR/RSC 활용, shadcn/ui 53+ 컴포넌트, 접근성 미검증 |
| Frontend (Admin) | C+ | 기본 CRUD UI 구현, 폼 검증 부분적 |
| Database | B- | Prisma + SQLite, 스키마 정의 완료, 마이그레이션 전략 미정리 |
| Testing | D | 테스트 파일 없음, 테스트 인프라 미설정 |
| CI/CD | C | GitHub Actions 파이프라인 존재, Docker 설정과 실제 구조 불일치 |
| Documentation | C- | 아키텍처 문서 초기 단계, API 문서 Swagger로 자동 생성 |

## Gap Tracking

| Gap | Priority | Target Grade | Action |
|-----|----------|--------------|--------|
| 테스트 부재 | HIGH | B | 테스트 프레임워크 설정 + 핵심 Use Case 단위 테스트 |
| Docker/배포 구조 불일치 | HIGH | B | Docker 설정을 모놀리식 구조에 맞게 수정 |
| SQLite→MySQL 마이그레이션 전략 | MEDIUM | B | 개발/프로덕션 DB 전환 가이드 문서화 |
| 접근성 (a11y) | MEDIUM | B | WCAG 2.1 AA 기준 감사 및 수정 |
| API 입력 검증 | MEDIUM | A | Zod 등 스키마 검증 도입 |
| 에러 카탈로그 | LOW | B | 표준화된 에러 코드 체계 정의 |

<!-- MANUAL: Notes below this line are preserved on regeneration -->
