# Contract: 통합 예약 인사이트 4→3 정리와 연결

**Date**: 2026-09-15

## Canonical 인사이트

### 1. `nestjs-middleware-vs-guard-tradeoff`

- 기존 경로를 유지한다.
- 핵심 메시지는 `NestJS 인증은 Middleware와 Guard 중 하나를 고르는 문제가 아니었다`다.
- 핵심 메시지를 공개 제목으로 사용한다.
- 당시 Express 경험에서 익숙한 Middleware를 선택한 배경을 숨기지 않는다.
- 당시 `AdminAuthMiddleware`의 토큰·쿠키·CSRF·`req.user` 책임과 `AdminLevelGuard`의 등급 책임을 구분한다.
- 현재는 Global Auth Guard로 인증을 기본 적용하고 공개 경로만 제외하며 등급 권한 Guard를 분리하는 방향을 제시한다.
- Middleware가 Guard보다 항상 견고하거나 누락을 완전히 제거했다는 결론을 사용하지 않는다.

시각 자료는 before/after 한 건을 제공한다.

```text
Before: 요청 → AdminAuthMiddleware → req.user → AdminLevelGuard → Controller
After: 요청 → Global Auth Guard(공개 경로 제외) → Permission Guard → Controller
```

### 2. `nextjs-nestjs-domain-separation-and-bff`

- BFF 통합 글의 canonical 경로다.
- 기존 canonical 제목 `[Next.js x NestJS] 프론트엔드와 백엔드의 도메인 분리와 BFF 설계`를 유지한다.
- 프론트엔드 `A-domain.com`과 API `api.A-domain.com`은 같은 기본 도메인의 서로 다른 Origin으로 표현한다.
- 브라우저 직접 API 호출에서 쿠키 저장·전달 실패를 확인한 경험을 시작점으로 둔다.
- Next.js `/bff` rewrite로 브라우저 Origin을 통일하고 cookie/CSRF 요청을 전달한 경계를 설명한다.
- 이후 서버→API 요청의 Cloudflare 봇 차단을 확인하고 고정 IP 허용 규칙으로 스테이징 통신을 복구한 순서를 설명한다.
- reverse proxy를 응답 조합·가공·프론트 전용 권한과 성능 개선을 갖춘 완성형 BFF로 확대하지 않는다.
- 대기업 일반화, 다른 최상위 도메인과 스트리밍 성능 주장을 제거한다.

시각 자료는 before/after 한 건을 제공한다.

```text
Before: Browser(A-domain.com) → api.A-domain.com 직접 호출 → 쿠키 저장·전달 실패
After: Browser → A-domain.com/bff → Next reverse proxy → Cloudflare → Nest API
                                     └ 고정 IP 허용으로 스테이징 서버 요청 복구
```

### 3. `https-and-plaintext-password-transmission`

- 기존 경로를 유지한다.
- 기존 제목 `구글과 네이버는 왜 비밀번호를 평문으로 보낼까? (개발자 도구의 착시와 HTTPS의 진실)`를 유지하되 본문에서 `평문`이 DevTools payload와 TLS 전송 구간을 혼동한 질문임을 바로 설명한다.
- DevTools Request Payload와 TLS가 적용되는 네트워크 전송 구간을 구분한다.
- 프론트엔드 복호화 키 노출 때문에 비밀번호 전송용 추가 암호화의 실효성이 낮다고 판단한 경험을 설명한다.
- 구글·네이버의 HTTPS 비밀번호 요청을 직접 확인한 사실과 서버 bcrypt 저장을 구분한다.
- 클라이언트 비밀번호 암호화를 구현했다가 제거한 경험은 사용자 보고값으로 다룬다.
- 현재 예약 임시 데이터·이메일용 AES가 남아 있으므로 모든 클라이언트 암호화를 제거했다고 쓰지 않는다.
- 시각 자료는 `not-needed`로 판정하고 빈 visual 영역이나 placeholder를 만들지 않는다.

## Alias 계약

```text
/insights/enterprise-bff-architecture-and-cors
  → permanent redirect
/insights/nextjs-nestjs-domain-separation-and-bff
```

- alias는 정적 파라미터에 포함돼 직접 접근 시 404가 되지 않는다.
- alias는 목록, archive, tag count, 이전글/다음글, 작업물 관련 인사이트에 중복 글로 나타나지 않는다.
- redirect는 query/hash를 임의의 외부 주소로 보내지 않고 고정 canonical 내부 경로만 사용한다.
- canonical slug는 alias 대상이 될 수 있지만 alias가 다른 alias, 자기 자신과 없는 slug를 가리키면 안 된다.

## Editorial 집합 계약

- canonical insight 총수는 17개다.
- editorial migrated는 16개다.
  - `project-case`: 15개
  - `technical-exploration`: 1개
- legacy canonical 글은 1개다.
- 이 세 대상 모두 `project-case`, `featureSlug: integrated-reservation-platform`이다.
- exact fixture, title, route, source, visual 필요성·질문·텍스트 대안과 콘텐츠 hash를 구현 뒤 다시 고정한다.

## 공통 시각·확대 계약

- Middleware와 BFF before/after는 기존 `InsightVisual` 데이터 계약을 사용한다.
- 두 visual은 title, question, textAlternative, nonDuplicationReason을 모두 제공한다.
- 작은 보기와 Dialog가 같은 actor·connection 관계를 표시한다.
- `크게 보기`를 keyboard로 열고 Escape로 닫은 뒤 focus가 trigger로 돌아온다.
- panel, actor, connection은 320·768·1024·1440px에서 잘리거나 겹치지 않는다.
- HTTPS 글에는 `[data-insight-visual]`과 확대 버튼이 0개다.

## 양방향 연결과 비중복 계약

- 작업물은 canonical 세 글을 관련 인사이트로 표시한다.
- canonical 세 글은 모두 `연관된 기록`에서 작업물로 돌아간다.
- legacy BFF alias로 진입해도 canonical 글에서 작업물로 돌아갈 수 있다.
- 작업물은 전체 프로젝트 책임, Core Product·재고·결제와 UAT를 설명한다.
- Middleware 글은 인증·권한 책임의 당시/현재 차이만 깊게 다룬다.
- BFF 글은 쿠키·Origin·reverse proxy·Cloudflare 경계만 깊게 다룬다.
- HTTPS 글은 payload·TLS·추가 암호화·bcrypt 경계만 깊게 다룬다.
- 작업물 workflow·관계도와 두 인사이트 before/after는 같은 질문을 복제하지 않는다.
