# Contract: UAT 흐름과 Core Product 관계 시각 자료

**Date**: 2026-09-15

## 시각 자료 분리

| id | 종류 | 답하는 질문 |
| --- | --- | --- |
| `uat-booking-payment-flow` | Archify workflow + `FeatureSwimlane` fallback | 행사·재고 설정부터 예약·PG 테스트 결제·관리자 확인까지 책임과 실패 지점은 어디인가? |
| `core-product-relationships` | Archify architecture + `FeatureRelationshipDiagram` fallback | 객실·관광·주문·재고는 공통 Product를 중심으로 어떻게 연결되는가? |

첫 번째는 시간 순서, 두 번째는 데이터 관계를 설명한다. 관계도를 두 번째 스윔레인으로 등록하거나 두 자료에서 같은 설명을 반복하지 않는다.

## UAT workflow 계약

### 책임 레인

1. `고객사 운영자`: 행사·호텔·객실·재고를 설정하고 예약을 확인·취소한다.
2. `사용자`: 객실을 조회하고 예약·PG 테스트 결제를 요청한다.
3. `Next.js BFF`: 브라우저 요청을 같은 Origin 경계로 받아 API에 전달한다.
4. `Nest API·DB`: 재고 version 충돌을 검사하고 주문·재고·결제 상태를 단계별로 기록한다.
5. `PG 테스트`: 테스트 승인 또는 승인 실패를 반환한다.

### 정상 경로

```text
행사·호텔·객실·재고 등록
→ 객실 조회·예약 요청
→ BFF 전달
→ PAYMENT_PENDING 주문 기록·version 조건 재고 차감
→ PG 테스트 승인
→ 주문·결제 확정
→ 관리자 예약 확인·취소
```

### 예외

| 예외 | 분기 위치 | 결과 |
| --- | --- | --- |
| 재고 version 충돌 | PG 호출 전 조건부 갱신 0건 | 충돌 응답과 재시도 안내로 종료 |
| PG 승인 실패 | 재고 차감과 pending 기록 뒤 | 주문 `CANCELLED`, 이력 `ABORTED`; 재고 자동 복구는 미완성 |

예외는 점선·label·문구를 함께 사용해 색상만으로 구분하지 않는다. 미완성 재고 복구를 정상 보상 경로로 그리지 않는다.

## Core Product architecture 계약

### 엔터티

- `Products`: 공통 상품 부모
- `ProductRooms`: 객실 세부 모델
- `ProductTours`: 관광 세부 모델
- `PurchaseOrderItems`: 공통 상품을 참조하는 주문 항목
- `ProductRoomOptions`: 객실 옵션
- `ProductRoomStocks`: 객실·옵션을 직접 참조하는 날짜별 재고

### 관계

- `Products 1 → 0..1 ProductRooms`
- `Products 1 → 0..1 ProductTours`
- `Products 1 → N PurchaseOrderItems`
- `ProductRooms 1 → N ProductRoomOptions`
- `ProductRooms 1 → N ProductRoomStocks`
- `ProductRoomOptions 1 → N ProductRoomStocks`

관계 label과 cardinality를 텍스트로 함께 제공한다. 전체 스키마 필드, 고객 데이터, 확인되지 않은 JOIN 수치와 임의 상품 확장 예시는 포함하지 않는다.

## Source와 artifact 계약

| 항목 | UAT | Core Product |
| --- | --- | --- |
| source | `apps/front/diagrams/integrated-reservation-platform/uat-booking-payment-flow.json` | `apps/front/diagrams/integrated-reservation-platform/core-product-relationships.json` |
| generated HTML | `apps/front/public/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html` | `apps/front/public/diagrams/integrated-reservation-platform/core-product-relationships.html` |
| public URL | `/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html` | `/diagrams/integrated-reservation-platform/core-product-relationships.html` |
| Archify type | workflow v2 | architecture |

- Archify skill의 matching schema·common schema·example만 candidate 작성 직전에 읽는다.
- `meta.quality_profile`은 `showcase`다.
- validate는 9개 artifact check, composition error 0, warning 0을 요구한다.
- deliver 성공 뒤 source와 generated HTML을 직접 수정하지 않는다.
- source, HTML과 fallback의 stable ID·방향·정상/예외 또는 entity/relation 의미가 일치한다.

## 작은 보기 계약

- 기존 포트폴리오의 카드·질문·요약·`크게 보기` 위치와 semantic token을 따른다.
- Archify iframe은 viewport 접근 시 지연 준비하고 5초 안에 준비되지 않으면 빈 영역 대신 fallback을 보인다.
- workflow는 시작·정상 종료·두 예외 종료를, 관계도는 여섯 엔터티와 여섯 관계를 프레임에서 식별할 수 있어야 한다.
- Viewer toolbar, 검색·export·presentation UI와 중복 Legend를 표시하지 않는다.
- 문서 전체 가로 scroll을 만들지 않는다.

## 크게 보기와 텍스트 대안 계약

- Button은 보이는 `크게 보기`와 대상별 접근 가능한 이름을 제공한다.
- Dialog는 viewport 안에서 scroll 가능하고 diagram 전체를 자르지 않는다.
- Enter/Space로 열고 Escape로 닫은 뒤 trigger에 focus가 돌아온다.
- workflow는 단계·의미 있는 edge·예외 transcript를 제공한다.
- 관계도는 entity 설명과 관계 label·cardinality 목록을 제공한다.
- iframe은 직접 상호작용 대상이 아니며 동등한 DOM 텍스트가 보조기술에 제공된다.

## Theme와 반응형 계약

- 포트폴리오의 `background`, `foreground`, `card`, `muted`, `destructive`, `border` semantic token을 artifact에 적용한다.
- 정상·예외와 부모·세부·주문·재고 역할은 색상뿐 아니라 label·선 종류·텍스트로 구분한다.
- 320·768·1024·1440px에서 document overflow, preview/dialog 핵심 텍스트 잘림, node/entity/label 겹침은 0건이다.
- Core Product 관계도 standalone HTML은 1440×900, 1600×1000, 1920×1080에서 문서 가로·세로 overflow 없이 첫 화면 균형과 가독성을 확인한다.
- 5개 책임 lane을 모두 유지한 UAT workflow standalone HTML은 가로 overflow·노드/선/라벨 겹침 없이 읽혀야 한다. 다만 폭 맞춤 과정에서 발생하는 세로 overflow는 2026-09-15 사용자 승인 known limitation으로 유지하며, standalone 첫 화면 containment를 공개 acceptance로 사용하지 않는다.
- UAT workflow의 사용자 노출 acceptance surface는 포트폴리오 preview/Dialog다. 이 두 surface는 320·768·1024·1440px에서 iframe 내부 가로·세로 containment와 문서 가로 overflow 0건을 충족해야 한다.
- 기존 9개 Archify swimlane target과 preview/dialog/fallback/theme 계약은 회귀하지 않는다.
