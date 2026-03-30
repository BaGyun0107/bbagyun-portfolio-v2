# Tech Debt Tracker

| ID | Priority | Area | Description | Rationale |
|----|----------|------|-------------|-----------|
| TD-001 | HIGH | Testing | 테스트 프레임워크 미설정, 테스트 파일 없음 | 회귀 버그 방지, 리팩토링 안전망 확보 |
| TD-002 | HIGH | Infra | Docker 설정이 `apps/server/`, `apps/front/` 참조 — 실제 구조는 `/next/` 모놀리스 | 배포 파이프라인 작동 불가 |
| TD-003 | HIGH | Infra | GitHub Actions 워크플로우가 이중 앱 구조 가정 | CI/CD 실패 위험 |
| TD-004 | MEDIUM | DB | SQLite(개발)↔MySQL(프로덕션) 전환 전략 미문서화 | 마이그레이션 시 데이터 손실 위험 |
| TD-005 | MEDIUM | API | 입력 검증 스키마 (Zod 등) 미도입 | 잘못된 입력으로 인한 런타임 에러 |
| TD-006 | MEDIUM | Auth | 비밀번호 해싱이 사용자 생성 API에서 누락 가능성 | 평문 비밀번호 저장 위험 |
| TD-007 | LOW | Structure | `apps/back/`, `apps/front/` 빈 디렉토리 잔존 | 프로젝트 구조 혼란 |
| TD-008 | LOW | Docs | API 계약 문서 없음 (Swagger 자동 생성 외) | 프론트/백 동기화 어려움 |

<!-- MANUAL: Notes below this line are preserved on regeneration -->
