# Phase 0 Research: 행사 호텔 예약·결제 통합 플랫폼 구조화 상세

**Date**: 2026-09-15

승인 인터뷰, 현재 포트폴리오 구조와 두 원본 저장소의 `dev` 브랜치를 기준으로 아래 결정을 확정했다. Technical Context의 미확정 항목은 없다.

## D-001. 작업물을 공통 구조화 상세로 이전하고 legacy 본문은 제거한다

**Decision**: `feature-details/integrated-reservation-platform.ts`를 추가해 기존 `FeatureDetailDto`의 공통 읽기 순서를 사용한다. `features.ts`에는 승인된 카드 메타데이터만 남기고 legacy `content`를 제거하며 slug와 목록 위치는 유지한다.

**Rationale**: 이미 이전된 작업물과 같은 순서로 역할·근거·판단·결과를 비교할 수 있고, 사실 계약을 타입과 테스트로 검증할 수 있다.

**Alternatives considered**: legacy Markdown만 고치는 안은 근거 카드와 선택형 시각 자료를 공통 계약으로 검사하기 어렵다. 전용 상세 페이지는 공유 정보 구조 원칙에 맞지 않아 제외했다.

## D-002. 기간·상태·책임과 검증 범위를 분리한다

**Decision**: 기간은 `2025.12 – 2026.03`, 상태는 `On Hold`로 정정하고 실제 화면에 표시한다. 2025년 12월의 요구사항·설계 준비, 1인 백엔드와 PM·PL 책임, FE 3명과의 조율, 고객사 스테이징 UAT와 PG 테스트 환경을 구분한다. 프론트엔드 개발자의 관리자 목록 API 커밋 1건은 전체 백엔드 책임을 뒤집지 않는 일시적 기여로만 취급한다.

**Rationale**: 프로젝트는 고객사 측 사업 여건으로 보류됐고 정식 운영되지 않았다. `In Progress`나 운영 성과로 읽히지 않아야 하며 실제 담당 범위도 축소·과장하지 않아야 한다.

**Alternatives considered**: `Archived`는 고객사 재개 가능성과 보류 의미를 잃고, `In Progress`는 현재 개발 중이라는 오해를 만든다. 고객사 자금 사정을 직접 쓰는 안은 공개 경계를 넘는다.

## D-003. 네 근거 카드만 제공한다

**Decision**: `백엔드·PM/PL 책임`, `고객사 UAT 범위`, `PG 테스트 환경`, `정식 운영 전 보류` 네 카드를 모두 사용자 보고값으로 제공하고 기준 시점과 관찰 한계를 붙인다.

**Rationale**: 이 작업물의 결과를 이해하는 데 필요한 것은 운영 수치가 아니라 누가 무엇을 책임졌고 어디까지 검증됐는지다.

**Alternatives considered**: 운영 건수·장애율·성능·전환율은 존재하지 않거나 확인할 수 없어 제외한다. 단위 테스트를 운영 지표처럼 카드화하지 않는다.

## D-004. Core Product 관계는 코드 확인값으로, 효과는 목적 수준으로 공개한다

**Decision**: `Products`를 공통 부모로 두고 `ProductRooms`·`ProductTours`가 연결되며 주문 항목은 공통 `productId`를 참조한 사실을 설명한다. 객실 재고가 객실과 옵션을 직접 참조한 관계도 공개한다. 목적은 객실·관광을 하나의 주문·결제 모델로 처리하고 재고 조회 경로를 짧게 유지하는 데 한정한다.

**Rationale**: 원본 `prisma/schema.prisma`에서 관계를 직접 확인할 수 있지만 JOIN 단계 감소나 임의 상품 확장의 성능·변경량은 검증되지 않았다.

**Alternatives considered**: `JOIN 5→3`, 컴퓨터·마우스 예시와 다른 화훼 프로젝트 구조를 가져오는 안은 기억·범위를 벗어나 삭제한다.

## D-005. 재고 충돌은 구현과 사용자 보고 테스트를 구분한다

**Decision**: `version`을 조건으로 한 `updateMany`와 갱신 건수 0의 충돌 처리는 코드 확인값으로 공개한다. 정상·충돌 분기를 단위 테스트했다는 경험은 승인 인터뷰의 사용자 보고값으로만 표현한다. 현재 `dev`에서 확인되는 성공 분기 테스트를 충돌 분기 코드 증거로 확대하지 않는다.

**Rationale**: 구현과 테스트 증거의 강도가 다르다. 실제 DB 병렬 요청, 초과 예약 방지와 정합성 보장을 주장할 근거는 없다.

**Alternatives considered**: `불일치 0건`, `초과 예약 완전 방지`, 운영 정합성과 실제 병렬 통합 테스트 주장은 삭제한다.

## D-006. PG 처리는 단계형 경계와 미완성 보상을 함께 공개한다

**Decision**: 주문·재고의 사전 트랜잭션, 외부 PG 승인, 주문·결제 확정 트랜잭션을 서로 다른 단계로 설명한다. 최종 내부 확정 실패 시 PG 취소 시도는 구현값으로, PG 승인 실패 시 `CANCELLED`·`ABORTED` 기록 뒤 차감 재고의 즉시 복구가 없는 상태는 보류 시점의 미완성 범위로 공개한다.

**Rationale**: 외부 PG는 DB 트랜잭션 안에 묶이지 않는다. 성공 경로뿐 아니라 실제 남은 실패 경계를 보여 주는 것이 현재 판단을 더 정확히 설명한다.

**Alternatives considered**: 단일 원자적 트랜잭션, 고아 재고 0건과 완성된 보상 흐름 주장은 코드와 다르므로 금지한다.

## D-007. BFF는 reverse proxy로 경계를 만든 단계로 제한한다

**Decision**: `A-domain.com`의 브라우저가 `api.A-domain.com`을 직접 호출할 때 쿠키 저장·전달 실패를 확인한 뒤 Next.js `/bff` rewrite로 브라우저 Origin을 통일한 순서를 설명한다. 응답 조합·프론트 전용 가공·별도 권한 정책을 갖춘 완성형 BFF라고 부르지 않는다.

**Rationale**: 원본 `next.config.ts`와 Axios 설정은 reverse proxy, cookie/CSRF 요청을 뒷받침하지만 더 넓은 BFF 기능은 없다.

**Alternatives considered**: 다른 최상위 도메인 예시, 스트리밍 성능 개선, 모든 외부 API에 BFF가 필수라는 일반화는 실제 사례와 다르거나 범위를 넘는다.

## D-008. Cloudflare 대응은 스테이징 사용자 보고 범위로 제한한다

**Decision**: BFF 서버의 NestJS API 요청이 Cloudflare 봇 차단에 걸린 원인을 사용자가 확인하고 고정 IP 허용 규칙으로 스테이징 통신·인증을 복구한 경험을 공개한다. 실제 IP와 환경 설정값은 공개하지 않는다.

**Rationale**: Cloudflare 설정 변경은 포트폴리오 원본 저장소에서 직접 검증할 수 없지만 승인 인터뷰에 근거가 있다. 운영 환경 전체 성과로 확대할 수 없다.

**Alternatives considered**: 전 환경 정상화, 운영 장애 해결과 Cloudflare 비활성화 비교는 근거가 없어 제외한다.

## D-009. Middleware·Guard 글은 당시 구현과 현재 판단을 분리한다

**Decision**: 당시 `AdminAuthMiddleware`의 토큰·쿠키·CSRF·`req.user` 책임과 `AdminLevelGuard`의 등급 권한 책임을 코드 확인값으로 설명한다. Middleware 선택은 Express 경험에서 출발했음을 밝히고, 현재는 Global Auth Guard를 기본 적용하고 공개 경로만 제외하며 권한 Guard를 분리하는 구성을 개선 판단으로 제시한다.

**Rationale**: 책임 분리는 의도적이었지만 Middleware 선택 자체가 NestJS 대안을 충분히 비교한 결과는 아니었다.

**Alternatives considered**: Middleware가 Guard보다 항상 견고하다거나 인증 선언 누락을 완전히 없앴다는 기존 결론은 삭제한다.

## D-010. 비밀번호 암호화 글은 과거 경험과 현재 코드를 구분한다

**Decision**: 비밀번호 전송용 클라이언트 암호화를 구현했다가 제거한 경험은 사용자 보고값으로 공개한다. 현재 HTTPS 요청 payload 전달과 서버 bcrypt 저장은 코드 확인값으로 설명한다. 예약 임시 데이터와 이메일용 AES 유틸리티가 남아 있으므로 모든 클라이언트 암호화를 제거했다고 쓰지 않는다.

**Rationale**: 과거 암호화 커밋은 현재 `dev` 이력에서 확인되지 않지만 사용자가 직접 수행한 경험이다. 현재 코드와 충돌하지 않도록 적용 범위를 비밀번호 전송으로 제한해야 한다.

**Alternatives considered**: DevTools payload를 네트워크 평문으로 부르는 안과 프론트엔드 키로 실질적 비밀을 만든다는 주장은 삭제한다.

## D-011. 네 인사이트를 세 canonical 글과 alias 하나로 정리한다

**Decision**: `nestjs-middleware-vs-guard-tradeoff`, `nextjs-nestjs-domain-separation-and-bff`, `https-and-plaintext-password-transmission` 세 slug를 canonical 글로 유지한다. `enterprise-bff-architecture-and-cors`는 목록·이전글/다음글·작업물 관련 글에서 제거하고 BFF canonical 글로 영구 redirect하는 alias로 보존한다.

**Rationale**: 두 BFF 글은 같은 프로젝트의 쿠키·proxy·Cloudflare 경계를 반복한다. `dynamicParams = false` 환경에서는 alias를 정적 파라미터에 명시하지 않으면 기존 주소가 404가 된다.

**Alternatives considered**: 중복 SeedInsight를 남기면 기본 콘텐츠 3개 계약과 목록 비중복을 깨고, alias를 삭제하면 기존 북마크가 깨진다.

## D-012. 인사이트 시각 자료는 기존 before/after 타입을 재사용한다

**Decision**: Middleware 글은 `Express에 익숙했던 당시 Middleware+권한 Guard`와 `현재 Global Auth Guard+권한 Guard`를, BFF 글은 `브라우저의 API Origin 직접 호출`과 `Next.js reverse proxy 뒤 서버 요청·Cloudflare 허용`을 각각 before/after로 비교한다. HTTPS 글의 `visualAssessment`는 `not-needed`로 기록하고 visual 데이터는 두지 않는다.

**Rationale**: 두 비교 질문은 기존 `InsightVisual`이 지원하는 타입으로 충분하고, HTTPS 경계는 짧은 글로 더 정확하게 설명할 수 있다.

**Alternatives considered**: 새 인사이트 시각 타입과 작업물 UAT 흐름 복제는 불필요하다.

## D-013. 모든 제공 시각 자료에 같은 확대 접근성을 적용한다

**Decision**: 기존 인사이트 visual에도 `크게 보기` Dialog를 추가해 Enter/Space로 열고 Escape로 닫은 뒤 trigger로 focus를 복귀한다. 작업물 workflow와 관계도도 같은 사용자 동작을 제공하되 각각의 텍스트 대안과 관계 목록을 유지한다.

**Rationale**: 현재 작업물 Archify만 확대가 가능해 FR-054를 충족하지 못한다. 공통 shadcn Dialog를 사용하면 새 의존성 없이 동작을 통일할 수 있다.

**Alternatives considered**: 작은 카드만 확대 없이 제공하거나 Archify Viewer 전체 UI를 노출하는 안은 승인된 읽기 경험과 맞지 않는다.

## D-014. UAT는 workflow, Core Product 관계는 architecture로 분리한다

**Decision**: `uat-booking-payment-flow`는 Archify workflow와 `FeatureSwimlane` fallback으로, `core-product-relationships`는 Archify architecture와 새 `FeatureRelationshipDiagram` fallback으로 만든다. 공통 iframe 준비·theme·timeout은 `ArchifyEmbed`로 추출하고, workflow의 선 범례·예외와 관계도의 엔터티·관계 설명은 섞지 않는다.

**Rationale**: 시간 순서와 데이터 관계는 다른 질문이다. 관계도를 두 번째 스윔레인으로 넣으면 스윔레인 1개 계약과 의미가 모두 깨진다.

**Alternatives considered**: Mermaid, 수동 SVG, 두 번째 swimlane과 인사이트 visual 타입 재사용은 기존 Archify delivery 및 의미 계약과 맞지 않는다.

## D-015. 상태 타입과 보이는 메타 정보를 함께 확장한다

**Decision**: `FeatureStatus`에 `On Hold`를 추가하고 작업물 상세 상단의 공통 메타 영역에 상태를 표시한다. 모든 프로젝트는 이미 보유한 status 값을 같은 위치에서 보게 되므로 대상 페이지뿐 아니라 기존 상태들의 표시 회귀도 확인한다.

**Rationale**: 데이터 값만 바꾸고 렌더링하지 않으면 사용자가 보류 상태를 확인할 수 없다. 특별 문구를 본문에만 넣는 것보다 기존 status 필드를 공통 표시하는 편이 타입과 UI가 일치한다.

**Alternatives considered**: 대상 slug만 조건 분기해 배지를 붙이는 안은 공통 정보 구조를 깨뜨린다.

## D-016. 검증은 사실·구조·artifact·브라우저 계층으로 나눈다

**Decision**: Vitest에서 카드·상태·구조화 등록·금지 주장·alias·visual 타입·renderer를 먼저 RED로 만든다. Archify CLI로 workflow와 architecture source/artifact를 각각 showcase 검증하고, Playwright로 작업물과 기존 네 insight 주소, 목록 중복 없음, redirect, 양방향 링크, 네 visual의 preview/dialog, 4개 viewport를 검증한다.

**Rationale**: 문자열 테스트만으로 생성 artifact와 실제 화면 동작을 증명할 수 없고 브라우저만으로 모든 금지 주장을 안정적으로 검사하기 어렵다.

**Alternatives considered**: 수동 확인만으로 끝내거나 1104 dev server만 최종 증거로 사용하는 안은 반복 가능성과 격리가 부족하다.

## D-017. 1104는 보존하고 별도 production 포트를 사용한다

**Decision**: 사용자가 실행한 1104 dev server는 기준선과 구현 중 확인에만 재사용하며 종료·재시작하지 않는다. 최종 E2E는 build 뒤 별도 빈 포트의 production server에서 수행하고 임시 Playwright 설정은 `apply_patch`로 만들었다가 삭제한다.

**Rationale**: 1104의 `.next/dev` lock과 사용자 소유 실행 상태를 침범하지 않으면서 재현 가능한 결과를 얻어야 한다.

**Alternatives considered**: 1104 종료, lock 삭제와 두 번째 dev server 실행은 제외한다.

## Visual Evidence Inventory

| 공개 기록 | 판정 | 종류 | 답하는 질문 | 비중복 근거 |
| --- | --- | --- | --- | --- |
| `integrated-reservation-platform` UAT | provided | Archify workflow | 행사·재고 설정부터 예약·PG 테스트 결제·관리자 확인까지 책임과 실패 지점은 어디인가? | 사용자·시스템의 시간 순서와 예외를 설명한다 |
| `integrated-reservation-platform` Core Product | provided | Archify architecture | 객실·관광·주문·재고는 공통 Product를 중심으로 어떻게 연결되는가? | 데이터 관계만 설명하고 UAT 순서를 반복하지 않는다 |
| `nestjs-middleware-vs-guard-tradeoff` | provided | before-after | 당시 인증·권한 책임과 현재 개선 판단은 어떻게 다른가? | 요청 생명주기와 책임 배치를 비교한다 |
| `nextjs-nestjs-domain-separation-and-bff` | provided | before-after | 브라우저 직접 호출에서 reverse proxy 경계로 바뀌며 쿠키와 Cloudflare 문제는 어떻게 분리됐는가? | 네트워크·Origin 경계를 비교한다 |
| `https-and-plaintext-password-transmission` | not-needed | text | DevTools payload와 TLS 전송·서버 저장 경계는 무엇이 다른가? | 짧은 문장으로 충분하며 다른 시각 자료를 반복하지 않는다 |

모든 시각 자료는 실제 회사 도메인·IP, 고객 데이터, 인증값, 시크릿과 비공개 소스를 포함하지 않는다.
