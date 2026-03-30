# Reliability

## Error Handling

### 계층별 에러 처리

| Layer | 전략 |
|-------|------|
| Route Handler | `withApiHandler` 래퍼가 예외 캐치 → `{ success: false, message }` 응답 |
| Use Case | 비즈니스 규칙 위반 시 예외 throw |
| Repository | Prisma 에러를 비즈니스 예외로 변환 |
| Client | `lib/api/fetcher.ts`에서 403 시 toast, 네트워크 에러 처리 |

### HTTP 상태 코드

| Code | 사용 |
|------|------|
| 200 | 성공 |
| 201 | 리소스 생성 |
| 400 | 잘못된 요청 (입력 검증 실패) |
| 401 | 인증 필요 (토큰 없음/만료) |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 500 | 서버 내부 에러 |

## Logging

- **HTTP 요청 로깅**: `lib/utils/httpLogger.ts` — 모든 API 요청의 method, path, status, latency 기록
- **Log 모델**: DB에 영구 저장 (`api/v1/logs`)
- **관리자 조회**: Admin Dashboard에서 접속 로그 확인

## Performance Baselines

| 항목 | 기준 |
|------|------|
| API 응답 시간 | < 500ms (CRUD 기본 작업) |
| 페이지 초기 로드 | < 3s (SSR/RSC) |
| DB 쿼리 | < 100ms (인덱스 활용) |

## Health Check

- `GET /api/health` — 서버 생존 확인
- Docker 헬스 체크: `wget` 기반

<!-- MANUAL: Notes below this line are preserved on regeneration -->
