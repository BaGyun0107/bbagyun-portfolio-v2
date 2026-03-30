# Code Review Standards

## Checklist

### Every PR

- [ ] TypeScript 컴파일 오류 없음
- [ ] Clean Architecture 레이어 규칙 준수 (Domain ← Application ← Infrastructure)
- [ ] 새 API 엔드포인트는 `withApiHandler` 래퍼 사용
- [ ] API 응답은 `{ success, data, message }` 포맷 준수
- [ ] 민감 데이터가 클라이언트에 노출되지 않음
- [ ] Import alias `@/*` 사용 (상대 경로 `../../` 지양)

### Backend 변경 시

- [ ] Repository 인터페이스가 `core/domain/repositories/`에 정의됨
- [ ] Use Case가 Infrastructure를 직접 임포트하지 않음
- [ ] DTO를 통한 데이터 전달 (Prisma 모델 직접 반환 금지)
- [ ] 에러 처리가 `withApiHandler`에 위임됨

### Frontend 변경 시

- [ ] 공개 페이지는 Server Component 우선
- [ ] API 호출은 `lib/api/fetcher.ts` 통해서만
- [ ] shadcn/ui 컴포넌트 직접 수정 최소화
- [ ] Tailwind CSS 유틸리티 우선 (인라인 스타일 금지)

### 보안 민감 변경 시

- [ ] JWT 관련 변경은 Edge Middleware 검증 경로 확인
- [ ] 새 쿠키는 httpOnly + Secure 플래그
- [ ] 사용자 입력은 서버 측에서 검증

## Severity Levels

| Level | Definition | Action |
|-------|-----------|--------|
| BLOCKER | 보안 취약점, 데이터 손실 위험 | 즉시 수정, 머지 불가 |
| MAJOR | 아키텍처 위반, 성능 심각 저하 | 수정 후 머지 |
| MINOR | 코드 스타일, 미미한 개선 | 다음 PR에서 수정 가능 |
| NIT | 선호도 차이, 사소한 제안 | 선택적 반영 |

## Domain-Specific Review Focus

| 영역 | 추가 검토 항목 |
|------|---------------|
| `core/domain/` | 외부 의존성 없음 확인, 인터페이스 변경 시 구현체 동기화 |
| `core/application/` | Domain만 임포트, Use Case 단일 책임 |
| `infrastructure/` | Prisma 쿼리 성능, N+1 방지 |
| `app/api/` | 인증 검증, 입력 검증, 응답 포맷 |
| `components/ui/` | shadcn/ui 업데이트 영향도 |
| `middleware.ts` | JWT 검증 경로 누락 없음 |

## Anti-Patterns to Flag

1. **레이어 역전**: Domain이 Infrastructure를 임포트
2. **Fat Controller**: Route Handler에 비즈니스 로직 직접 작성
3. **Prisma 모델 직접 반환**: DTO 없이 Prisma 객체를 API 응답으로 전달
4. **클라이언트 시크릿 노출**: `NEXT_PUBLIC_`에 민감 정보
5. **any 타입 남용**: TypeScript strict 모드 무력화
6. **피처 간 직접 임포트**: 도메인 경계 무시한 컴포넌트 참조

<!-- MANUAL: Notes below this line are preserved on regeneration -->
