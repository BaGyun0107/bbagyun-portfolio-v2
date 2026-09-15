# Data Model: 행사 호텔 예약·결제 통합 플랫폼 구조화 상세

**Date**: 2026-09-15

## 1. Feature 메타데이터

| 필드 | 목표 값/규칙 |
| --- | --- |
| `slug` | `integrated-reservation-platform` 불변 |
| `title` | `행사 호텔 예약·결제 통합 플랫폼` |
| `description` | 1인 백엔드·PM/PL 책임과 고객사 UAT, 보류 상태를 과장 없이 요약 |
| `overview` | 행사 단위 신규 구축, FE 3명 조율, 스테이징 UAT와 미운영 범위를 분리 |
| `period` | `2025.12 – 2026.03` |
| `team` | `FE 3명 / BE 1명 (본인) / PM·PL 겸임` |
| `status` | `On Hold`; `FeatureStatus` union과 상세 화면 표시를 함께 지원 |
| `content` | 구조화 이전 후 제거 |
| `detail` | `FEATURE_DETAILS_BY_SLUG`에서 새 `FeatureDetailDto`에 연결 |
| `demo` | 없음; 빈 카드나 준비 중 문구를 만들지 않음 |

## 2. 구조화 상세

### 역할

- 1인 백엔드로 데이터 모델, 관리자 인증, 객실·재고·예약·결제 API와 배포 환경 전반을 설계·구현
- PM·PL로 고객사 소통, 요구사항·일정, FE 3명의 우선순위·분담과 API 계약을 조율
- 프론트엔드 개발자의 일시적 관리자 목록 API 기여 1건을 공동 백엔드 담당자로 확대하지 않음

### Highlights

| `id` | label | value | kind | asOf | evidence/caveat |
| --- | --- | --- | --- | --- | --- |
| `backend-leadership` | 역할 범위 | `1인 백엔드 · PM/PL` | `reported` | `2026-03` | 사용자 인터뷰 기준; FE 3명과 협업했으며 일시적 백엔드 기여 1건이 있음 |
| `customer-uat` | 고객사 검증 | `핵심 객실 예약 흐름 UAT` | `reported` | `2026-03` | 스테이징에서 행사 생성부터 관리자 취소까지 확인; 전체 기능 완성이나 운영 검증이 아님 |
| `payment-scope` | 결제 검증 환경 | `PG 테스트 환경` | `reported` | `2026-03` | 실제 운영 결제 없이 승인·취소를 테스트 환경에서만 확인 |
| `delivery-status` | 공개 상태 | `정식 운영 전 보류` | `reported` | `2026-03` | 고객사 측 사업 여건으로 개발 보류; 현재 개발 중 또는 기술 실패 의미가 아님 |

네 카드 모두 값·종류·기준 시점·설명과 관찰 한계를 가진다. 운영 건수·비율·성능 수치를 추가하지 않는다.

### 서사 필드

- `problem`: 행사별 호텔·객실·재고·예약·결제 운영을 신규 구축하면서 상품 관계, 동시 재고 요청, 외부 PG와 분리된 상태, 교차 Origin 쿠키 문제를 함께 다뤄야 했음
- `constraints`: 1인 백엔드와 FE 3명 협업, PG 테스트·스테이징 범위, 보류 시점의 관광·결제 링크·일부 문서 기능 미완성, 비공개 회사·고객 정보
- `alternatives`: 실제 검토가 확인된 범위만 사용하며, 확인되지 않은 비관적 락·queue·Cloudflare 비활성화 기각표를 만들지 않음
- `implementation`: Core Product, version 조건 갱신, 단계형 PG 처리, reverse proxy와 Cloudflare 대응을 사실·미완성 경계와 함께 설명
- `outcomes`: 고객사 UAT 범위와 `On Hold`, 비운영·PG 테스트 환경을 분리
- `retrospective`: 결제 실패 지점별 상태·보상·재시도·운영자 확인, 실제 DB 병렬 통합 테스트, Global Auth Guard 기본 거부 구조를 다음 개선으로 제시

## 3. UAT 예약·결제 스윔레인

| 필드 | 값/규칙 |
| --- | --- |
| `id` | `uat-booking-payment-flow` |
| `archify.url` | `/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html` |
| `lanes` | 고객사 운영자, 사용자, Next.js BFF, Nest API·DB, PG 테스트 |
| 정상 질문 | 설정·조회·예약·테스트 결제·관리자 확인·취소가 어느 책임 경계를 지나는가? |
| 예외 | 재고 버전 충돌, PG 승인 실패 |

정상 경로는 다음 의미를 유지한다.

```text
행사 생성·호텔/객실/재고 등록
→ 사용자 객실 조회·예약 요청
→ Next.js BFF 전달
→ 주문 PAYMENT_PENDING 기록·version 조건 재고 차감
→ PG 테스트 승인
→ 주문·결제 확정
→ 관리자 예약 확인·취소
```

- 재고 갱신 건수 0: PG 호출 전에 충돌 응답과 재시도 안내로 종료
- PG 승인 실패: 주문 `CANCELLED`·결제 이력 `ABORTED`; 차감 재고 자동 복구는 보류 시점 미완성
- 최종 내부 확정 실패의 PG 취소 시도는 본문에 남기되, 시각 자료의 핵심 예외 2개를 불필요하게 늘리지 않음

## 4. Core Product 관계 다이어그램

새 선택형 모델은 다음과 같다.

```text
FeatureRelationshipDiagram
├── id: string
├── title: string
├── purpose: string
├── summary: string
├── textAlternative: string
├── entities: FeatureRelationshipEntity[]
├── relationships: FeatureRelationship[]
└── archify?: { url: FeatureRelationshipArchifyUrl }

FeatureRelationshipEntity
├── id: string
├── label: string
├── role: parent | subtype | transaction | inventory | option
└── description: string

FeatureRelationship
├── id: string
├── from: entity id
├── to: entity id
├── label: string
└── cardinality: string
```

`FeatureDetailDto.relationshipDiagrams?: FeatureRelationshipDiagram[]`로 두되 이 기능에서는 정확히 1개만 제공한다.

| entity | role | 공개 관계 |
| --- | --- | --- |
| `products` | parent | 객실·관광과 주문 항목이 공유하는 공통 상품 |
| `product-rooms` | subtype | `Products`의 객실 세부 모델 |
| `product-tours` | subtype | `Products`의 관광 세부 모델 |
| `purchase-order-items` | transaction | 공통 `productId`로 `Products` 참조 |
| `product-room-options` | option | 객실의 선택 옵션 |
| `product-room-stocks` | inventory | 객실·옵션을 직접 참조하는 날짜별 재고 |

관계 label은 FK 방향과 `1:N` 또는 `1:0..1` 의미를 텍스트로 제공한다. 필드 목록 전체, 실제 테이블의 민감 데이터와 확인되지 않은 JOIN 단계는 표시하지 않는다.

## 5. Archify artifact

| 종류 | source | generated HTML | 타입 |
| --- | --- | --- | --- |
| UAT | `apps/front/diagrams/integrated-reservation-platform/uat-booking-payment-flow.json` | `apps/front/public/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html` | workflow v2 |
| Core Product | `apps/front/diagrams/integrated-reservation-platform/core-product-relationships.json` | `apps/front/public/diagrams/integrated-reservation-platform/core-product-relationships.html` | architecture |

- 각 source는 `meta.quality_profile: "showcase"`를 사용한다.
- schema/common/example은 candidate 작성 직전에 Archify skill에서 요구한 최소 파일만 읽는다.
- candidate를 먼저 쓴 뒤 update checker를 한 번 실행한다.
- validate는 9개 artifact check, composition error 0, warning 0이어야 한다.
- deliver 뒤 source를 수정하지 않고 HTML을 직접 편집하지 않는다.
- workflow와 architecture URL은 서로 다른 typed target으로 검증한다.
- 공통 embed는 preview 지연 로딩, dialog 즉시 로딩, theme 동기화, 5초 fallback을 제공한다.
- workflow fallback은 lane/step/edge/exception을, relationship fallback은 entity/relationship 목록을 제공한다.

## 6. 연결 인사이트

| canonical slug | 제목 계약 | 핵심 질문 | visual |
| --- | --- | --- | --- |
| `nestjs-middleware-vs-guard-tradeoff` | `NestJS 인증은 Middleware와 Guard 중 하나를 고르는 문제가 아니었다` | 당시 Middleware·등급 Guard와 현재 Global Auth Guard 개선 판단은 어떻게 다른가? | before-after, provided |
| `nextjs-nestjs-domain-separation-and-bff` | 기존 canonical 제목 유지 | 브라우저 직접 호출의 쿠키 실패에서 reverse proxy와 Cloudflare 허용 경계로 어떻게 바뀌었는가? | before-after, provided |
| `https-and-plaintext-password-transmission` | 기존 제목 유지 | DevTools payload, TLS 전송과 서버 bcrypt 저장은 어떤 경계인가? | not-needed, visual 없음 |

세 글은 모두 `project-case`, `featureSlug: integrated-reservation-platform`을 사용하고 작업물 복귀 링크를 제공한다. Middleware·BFF visual은 질문·텍스트 대안·비중복 이유가 `visualAssessment`와 실제 visual에서 일치해야 한다.

### Alias

```text
enterprise-bff-architecture-and-cors
  → permanent redirect
nextjs-nestjs-domain-separation-and-bff
```

- alias는 `getAllInsights()`와 목록·archive·tag·navigation에 포함하지 않는다.
- alias는 정적 route param에는 포함한다.
- redirect 대상은 허용된 canonical slug만 참조한다.
- alias 순환·자기 참조·존재하지 않는 대상은 validator/test에서 거부한다.

예상 집합은 canonical insight 총 17개, editorial migrated 16개(`project-case` 15개 + `technical-exploration` 1개), legacy 1개다.

## 7. 공개 관계와 상태 전이

```text
/projects 목록
  → /projects/integrated-reservation-platform (On Hold)
      ├→ /insights/nestjs-middleware-vs-guard-tradeoff
      ├→ /insights/nextjs-nestjs-domain-separation-and-bff
      └→ /insights/https-and-plaintext-password-transmission
          └→ /projects/integrated-reservation-platform

/insights/enterprise-bff-architecture-and-cors
  → permanent redirect
  → /insights/nextjs-nestjs-domain-separation-and-bff
```

- 작업물 legacy `content` 존재 → 구조화 detail 등록 → legacy `content` 제거
- 상태 `In Progress` → `On Hold` 타입·화면 표시
- BFF 글 2개 → canonical 1개 + alias 1개
- visual 미제공 → Middleware/BFF provided, HTTPS not-needed
- Archify source 없음 → validate source → delivered HTML → typed target·ratio → preview/dialog ready
- artifact 준비 실패·URL 불일치·필수 DOM 부재·timeout → 빈 영역 대신 typed fallback

## 8. 검증 불변식

1. 작업물 스윔레인은 정확히 1개, 관계 다이어그램은 정확히 1개다.
2. 네 근거 카드가 모두 값·종류·기준 시점·설명과 관찰 한계를 가진다.
3. 실제 회사 도메인·IP·고객 데이터·인증값·시크릿 노출은 0건이다.
4. JOIN 단계 수치, 불일치·고아 재고 0건, 단일 트랜잭션, 완성형 BFF, 전 환경·운영 성과 주장은 0건이다.
5. 네 기존 인사이트 경로가 응답하되 목록과 작업물 관련 글에는 canonical 세 글만 한 번씩 나타난다.
6. 작업물과 canonical 글 세 건의 양방향 링크가 키보드로 동작한다.
7. 제공 시각 자료 네 건은 질문이 서로 다르고 HTTPS에는 빈 visual이 없다.
8. 320/768/1024/1440px에서 document overflow, 핵심 text clipping과 요소 overlap은 0건이다.
9. 다른 작업물·인사이트 내용과 Feature 013의 T045/T047/T048은 변경하지 않는다.
