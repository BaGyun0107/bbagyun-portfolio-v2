# ADR: Clean Architecture 4계층 구조

## Status
draft

## Context
포트폴리오+CMS 앱에서 프레임워크 독립적인 비즈니스 로직 분리가 필요했다.
Next.js Route Handler에 비즈니스 로직을 직접 작성하면 테스트와 재사용이 어려워진다.

## Decision
Domain → Application → Infrastructure → Presentation 4계층 구조를 채택한다.

## Consequences

### 장점
- Use Case 단위 테스트 가능 (DB 모킹)
- 프레임워크 교체 시 Domain/Application 레이어 재사용
- 의존성 방향이 명확하여 순환 참조 방지

### 단점
- 작은 CRUD에도 인터페이스/DTO/구현체 3파일 필요
- 초기 보일러플레이트 증가

### 규칙
- Domain은 외부 의존성 없음 (Prisma 임포트 금지)
- Application은 Domain만 임포트
- Infrastructure는 Domain 인터페이스를 구현
- Route Handler는 Use Case를 호출하고 응답만 포맷

<!-- MANUAL: Notes below this line are preserved on regeneration -->
