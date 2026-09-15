import type { FeatureDetailDto } from '../types/feature-detail.dto';

export const INTEGRATED_RESERVATION_PLATFORM_DETAIL: FeatureDetailDto = {
  role: `1인 백엔드로 데이터 모델, 관리자 인증, 객실·재고·예약·결제 API와 배포 환경을 포함한 백엔드 전반을 설계하고 구현했습니다. PM·PL로 고객사 소통과 요구사항·일정을 관리하고, FE 3명의 작업 우선순위·분담과 API 계약을 조율했습니다. FE 3명 중 프론트엔드 개발자 한 명이 일시적으로 관리자 목록 API를 추가한 기여 1건이 있었으며, 이를 공동 백엔드 담당으로 확대하지 않고 협업 경계로 기록합니다.`,
  highlights: [
    {
      id: 'backend-leadership',
      label: '역할 범위',
      value: '1인 백엔드 · PM/PL',
      kind: 'reported',
      asOf: '2026-03',
      evidence: '사용자 인터뷰에서 백엔드 전반과 PM·PL 책임을 확인한 보고값입니다.',
      caveat: 'FE 3명과 협업했고 프론트엔드 개발자의 일시적 관리자 목록 API 기여 1건이 있었습니다.'
    },
    {
      id: 'customer-uat',
      label: '고객사 검증',
      value: '핵심 객실 예약 흐름 UAT',
      kind: 'reported',
      asOf: '2026-03',
      evidence: '고객사가 스테이징에서 행사 생성부터 관리자 예약 취소까지 확인한 사용자 보고값입니다.',
      caveat: '핵심 객실 예약 흐름의 확인이며 전체 기능 완성이나 운영 검증은 아닙니다.'
    },
    {
      id: 'payment-scope',
      label: '결제 검증 환경',
      value: 'PG 테스트 환경',
      kind: 'reported',
      asOf: '2026-03',
      evidence: '고객사 UAT에서 결제 승인과 취소를 PG 테스트 환경으로 확인한 사용자 보고값입니다.',
      caveat: '실제 운영 결제가 아니라 테스트 승인·취소 범위입니다.'
    },
    {
      id: 'delivery-status',
      label: '공개 상태',
      value: '정식 운영 전 보류',
      kind: 'reported',
      asOf: '2026-03',
      evidence:
        '정식 운영을 시작하기 전에 프로젝트가 멈춘 상태를 기록한 사용자 보고값이며, 현재 개발 중이거나 기술 실패했다는 의미가 아닙니다.',
      caveat: '고객사 측 사업 여건으로 개발 보류'
    }
  ],
  problem: `문제는 행사별 호텔 예약·결제 운영을 신규 구축하면서 객실과 관광 상품을 공통 주문·결제 구조에 연결하고, 같은 객실 재고를 갱신하는 요청의 충돌과 외부 PG 호출 전후의 서로 다른 상태를 함께 다루는 것이었습니다. 프론트엔드 A-domain.com과 API api.A-domain.com은 같은 기본 도메인의 서로 다른 Origin이어서 브라우저 직접 호출에서는 인증 쿠키의 저장·전달 실패도 확인했습니다.`,
  constraints: `구축과 검증은 고객사 스테이징과 PG 테스트 환경까지 진행됐습니다. 관광 예약, 결제 링크, 일부 엑셀 다운로드와 문서 템플릿은 보류 시점에 미완성이었습니다. 재고 충돌은 정상·충돌 분기를 단위 테스트로 확인했다는 사용자 보고 범위이며 실제 데이터베이스 병렬 요청을 포함한 통합 검증 범위는 아닙니다.`,
  alternatives: `당시 별도의 대안을 비교한 기록은 남아 있지 않습니다. 구현에서는 Products를 공통 상품 부모로 두고 객실과 관광 세부 모델을 연결했으며, 주문 항목이 공통 productId를 참조하도록 구성했습니다. 외부 PG가 내부 데이터베이스 트랜잭션에 포함되지 않는 경계를 고려해 주문·재고 사전 기록, PG 승인, 주문·결제 확정을 단계별로 나눴습니다. 브라우저의 API 직접 호출에서 쿠키 저장·전달 실패를 확인한 뒤에는 Next.js reverse proxy로 요청 Origin을 프론트엔드에 맞췄습니다.`,
  swimlanes: [
    {
      id: 'uat-booking-payment-flow',
      title: '고객사 UAT 예약·결제 흐름',
      purpose:
        '행사·재고 설정부터 사용자 예약·PG 테스트 결제와 관리자 확인·취소까지의 책임 경계와 재고 충돌·PG 승인 실패 지점을 보여줍니다.',
      summary:
        '고객사 운영자가 행사·호텔·객실·재고를 등록하면 사용자가 객실을 조회하고 예약을 요청합니다. Next.js BFF가 요청을 같은 Origin 경계에서 Nest API로 전달하고, API는 주문을 PAYMENT_PENDING으로 기록한 뒤 version 조건으로 재고를 차감합니다. 충돌이 없으면 PG 테스트 승인을 거쳐 주문·결제를 확정하고 관리자가 예약을 확인하거나 취소합니다. 조건부 재고 갱신이 0건이면 PG 호출 전에 충돌 응답과 재시도 안내로 종료합니다. PG 승인 실패 시 주문은 CANCELLED, 결제 이력은 ABORTED로 기록하지만 차감 재고 자동 복구는 보류 시점에 미완성이었습니다.',
      lanes: [
        { id: 'customer-operator', label: '고객사 운영자' },
        { id: 'user', label: '사용자' },
        { id: 'nextjs-bff', label: 'Next.js BFF' },
        { id: 'nest-api-db', label: 'Nest API·DB' },
        { id: 'pg-test', label: 'PG 테스트' }
      ],
      steps: [
        {
          id: 'configure-inventory',
          laneId: 'customer-operator',
          row: 0,
          shape: 'start',
          label: '행사·호텔·객실·재고 등록',
          description: '고객사 운영자가 행사와 판매할 호텔·객실·날짜별 재고를 설정합니다.'
        },
        {
          id: 'browse-and-reserve',
          laneId: 'user',
          row: 1,
          shape: 'process',
          label: '객실 조회·예약 요청',
          description: '사용자가 행사 객실을 조회하고 예약과 PG 테스트 결제를 요청합니다.'
        },
        {
          id: 'bff-forward',
          laneId: 'nextjs-bff',
          row: 2,
          shape: 'process',
          label: 'Next.js BFF 전달',
          description: 'Next.js reverse proxy가 브라우저 요청을 같은 Origin 경계에서 Nest API로 전달합니다.'
        },
        {
          id: 'record-pending-and-decrement',
          laneId: 'nest-api-db',
          row: 3,
          shape: 'decision',
          label: 'PAYMENT_PENDING 기록·version 조건 재고 차감',
          description:
            '주문을 PAYMENT_PENDING으로 기록하고 현재 version을 조건으로 재고를 차감하며, 갱신 건수가 0이면 충돌로 처리합니다.'
        },
        {
          id: 'inventory-conflict',
          laneId: 'nest-api-db',
          row: 4,
          shape: 'stop',
          label: '재고 version 충돌',
          description: '조건부 갱신 0건이면 PG 호출 전에 충돌 응답과 재시도 안내로 종료합니다.'
        },
        {
          id: 'pg-approve',
          laneId: 'pg-test',
          row: 5,
          shape: 'decision',
          label: 'PG 테스트 승인',
          description: 'PG 테스트 환경이 결제 승인 또는 승인 실패를 반환합니다.'
        },
        {
          id: 'pg-failed',
          laneId: 'nest-api-db',
          row: 6,
          shape: 'stop',
          label: 'PG 승인 실패 기록',
          description:
            '주문을 CANCELLED, 결제 이력을 ABORTED로 기록합니다. 차감 재고 자동 복구는 보류 시점에 미완성이었습니다.'
        },
        {
          id: 'confirm-order-and-payment',
          laneId: 'nest-api-db',
          row: 7,
          shape: 'process',
          label: '주문·결제 확정',
          description: 'PG 테스트 승인 결과를 별도 내부 단계에서 주문과 결제 이력에 확정합니다.'
        },
        {
          id: 'admin-confirm-or-cancel',
          laneId: 'customer-operator',
          row: 8,
          shape: 'end',
          label: '관리자 예약 확인·취소',
          description: '고객사 운영자가 예약을 확인하고 PG 테스트 환경에서 취소 흐름을 검증합니다.'
        }
      ],
      edges: [
        {
          id: 'configure-inventory-browse-and-reserve',
          from: 'configure-inventory',
          to: 'browse-and-reserve',
          kind: 'normal',
          outcome: 'continue'
        },
        {
          id: 'browse-and-reserve-bff-forward',
          from: 'browse-and-reserve',
          to: 'bff-forward',
          kind: 'normal',
          outcome: 'continue'
        },
        {
          id: 'bff-forward-record-pending-and-decrement',
          from: 'bff-forward',
          to: 'record-pending-and-decrement',
          kind: 'normal',
          outcome: 'continue'
        },
        {
          id: 'record-pending-and-decrement-pg-approve',
          from: 'record-pending-and-decrement',
          to: 'pg-approve',
          kind: 'normal',
          outcome: 'continue',
          label: '재고 차감 성공'
        },
        {
          id: 'pg-approve-confirm-order-and-payment',
          from: 'pg-approve',
          to: 'confirm-order-and-payment',
          kind: 'normal',
          outcome: 'continue',
          label: '승인 성공'
        },
        {
          id: 'confirm-order-and-payment-admin-confirm-or-cancel',
          from: 'confirm-order-and-payment',
          to: 'admin-confirm-or-cancel',
          kind: 'normal',
          outcome: 'continue'
        },
        {
          id: 'inventory-version-conflict-stop',
          from: 'record-pending-and-decrement',
          to: 'inventory-conflict',
          kind: 'exception',
          outcome: 'stop',
          label: '조건부 갱신 0건: PG 호출 전 재시도 안내',
          labelAt: { column: 0.9, row: 3.5 }
        },
        {
          id: 'pg-approval-failed-stop',
          from: 'pg-approve',
          to: 'pg-failed',
          kind: 'exception',
          outcome: 'stop',
          label: 'PG 승인 실패: CANCELLED·ABORTED 기록'
        }
      ],
      exceptions: [
        {
          id: 'inventory-version-conflict',
          trigger: 'version 조건부 재고 갱신 결과가 0건인 재고 충돌입니다.',
          response: 'PG 호출 전에 충돌 응답을 반환하고 사용자에게 재시도를 안내합니다.',
          edgeIds: ['inventory-version-conflict-stop']
        },
        {
          id: 'pg-approval-failed',
          trigger: '재고 차감과 pending 기록 뒤 PG 테스트 승인 실패가 발생했습니다.',
          response:
            '주문은 CANCELLED, 결제 이력은 ABORTED로 기록합니다. 차감 재고 자동 복구는 보류 시점에 미완성이었습니다.',
          edgeIds: ['pg-approval-failed-stop']
        }
      ],
      archify: {
        url: '/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html'
      }
    }
  ],
  relationshipDiagrams: [
    {
      id: 'core-product-relationships',
      title: 'Core Product 관계도',
      purpose: '공통 Product와 객실·관광 세부 모델, 주문 항목, 객실 옵션·날짜별 재고의 참조 관계를 보여줍니다.',
      summary:
        'Products는 객실과 관광의 공통 상품 부모이며 PurchaseOrderItems가 공통 productId로 참조합니다. ProductRoomStocks는 조회 경로에 맞춰 객실과 객실 옵션을 직접 참조합니다.',
      textAlternative:
        'Products 하나는 ProductRooms와 ProductTours를 각각 0개 또는 1개 연결하고 PurchaseOrderItems 여러 개에서 참조됩니다. ProductRooms 하나에는 ProductRoomOptions와 ProductRoomStocks 여러 개가 연결되며, ProductRoomOptions 하나도 ProductRoomStocks 여러 개에서 직접 참조됩니다.',
      entities: [
        {
          id: 'products',
          label: 'Products',
          role: 'parent',
          description: '객실·관광 세부 모델과 주문 항목이 공유하는 공통 상품 부모입니다.'
        },
        {
          id: 'product-rooms',
          label: 'ProductRooms',
          role: 'subtype',
          description: 'Products에 연결되는 객실 상품의 세부 모델입니다.'
        },
        {
          id: 'product-tours',
          label: 'ProductTours',
          role: 'subtype',
          description: 'Products에 연결되는 관광 상품의 세부 모델입니다.'
        },
        {
          id: 'purchase-order-items',
          label: 'PurchaseOrderItems',
          role: 'transaction',
          description: '공통 productId로 Products를 참조하는 주문 항목입니다.'
        },
        {
          id: 'product-room-options',
          label: 'ProductRoomOptions',
          role: 'option',
          description: '객실 상품에서 선택할 수 있는 옵션입니다.'
        },
        {
          id: 'product-room-stocks',
          label: 'ProductRoomStocks',
          role: 'inventory',
          description: '객실과 객실 옵션을 직접 참조하는 날짜별 재고입니다.'
        }
      ],
      relationships: [
        {
          id: 'products-rooms',
          from: 'products',
          to: 'product-rooms',
          label: '공통 상품이 객실 세부 모델을 선택적으로 가집니다.',
          cardinality: '1 → 0..1'
        },
        {
          id: 'products-tours',
          from: 'products',
          to: 'product-tours',
          label: '공통 상품이 관광 세부 모델을 선택적으로 가집니다.',
          cardinality: '1 → 0..1'
        },
        {
          id: 'products-orders',
          from: 'products',
          to: 'purchase-order-items',
          label: '여러 주문 항목이 공통 productId로 상품을 참조합니다.',
          cardinality: '1 → N'
        },
        {
          id: 'rooms-options',
          from: 'product-rooms',
          to: 'product-room-options',
          label: '객실 상품이 여러 객실 옵션을 가집니다.',
          cardinality: '1 → N'
        },
        {
          id: 'rooms-stocks',
          from: 'product-rooms',
          to: 'product-room-stocks',
          label: '날짜별 객실 재고가 객실 상품을 직접 참조합니다.',
          cardinality: '1 → N'
        },
        {
          id: 'options-stocks',
          from: 'product-room-options',
          to: 'product-room-stocks',
          label: '날짜별 객실 재고가 객실 옵션을 직접 참조합니다.',
          cardinality: '1 → N'
        }
      ],
      archify: {
        url: '/diagrams/integrated-reservation-platform/core-product-relationships.html'
      }
    }
  ],
  implementation: `Products를 공통 상품 부모로 두고 ProductRooms와 ProductTours를 세부 모델로 연결했습니다. 주문 항목은 공통 productId를 참조하고, 날짜별 객실 재고는 빈번한 조회 경로를 짧게 유지하도록 객실과 객실 옵션을 직접 참조했습니다.

재고 갱신 조건에 version을 포함하고 갱신 건수가 0이면 다른 요청이 먼저 변경한 충돌로 처리했습니다. 이 구현의 검증은 사용자 인터뷰에서 확인한 단위 테스트의 정상·충돌 분기 범위로 한정합니다.

결제는 주문과 재고를 PAYMENT_PENDING으로 먼저 기록하고 외부 PG 승인을 요청한 뒤, 성공 결과를 별도 내부 단계에서 주문·결제에 확정했습니다. 최종 내부 확정 실패에는 PG 취소를 시도했습니다. PG 승인 실패 때 주문은 CANCELLED, 결제 이력은 ABORTED로 기록했지만 차감 재고의 즉시 복구는 보류 시점에 미완성이었습니다.

브라우저가 API Origin을 직접 호출할 때 쿠키 저장·전달 실패를 확인한 뒤 Next.js /bff rewrite를 reverse proxy로 사용해 브라우저 Origin을 프론트엔드로 통일했습니다. 이 BFF 구현은 reverse proxy 경계를 만든 범위입니다. 이후 BFF 서버 요청이 Cloudflare 봇 차단에 걸린 원인을 확인하고 서버의 고정 IP를 허용 규칙에 등록해 스테이징 통신과 인증 흐름을 복구했습니다.

관리자 인증에는 Express 경험에서 출발해 Middleware를 먼저 선택했습니다. 당시 인증 Middleware는 토큰·쿠키·CSRF 확인과 req.user 주입을, 관리자 등급 Guard는 세부 권한 확인을 담당했습니다.`,
  outcomes: `고객사는 스테이징에서 행사 생성, 호텔·객실·재고 등록, 사용자 객실 조회·예약·PG 테스트 결제, 관리자 예약 확인·취소로 이어지는 핵심 객실 예약 흐름을 UAT로 확인했습니다. 이는 전체 기능 완성이나 운영 검증을 뜻하지 않습니다.

2026년 3월 보류 시점까지 정식 운영은 시작하지 않았으며 실제 운영 결제는 없었습니다. 관광 예약, 결제 링크, 일부 엑셀 다운로드와 문서 템플릿은 미완성으로 남았습니다.`,
  retrospective: `외부 결제가 포함된 흐름을 다시 설계한다면 실패 지점별 상태 전이, 보상, 재시도와 운영자 확인 절차를 함께 정의하겠습니다. 재고 충돌에는 실제 데이터베이스로 병렬 요청을 보내는 통합 테스트를 추가하겠습니다. 인증은 현재 Global Auth Guard를 기본 적용하고 공개 경로만 제외한 뒤, 관리자 등급을 별도 권한 Guard로 분리하는 구성이 더 알맞다고 판단합니다.`
};
