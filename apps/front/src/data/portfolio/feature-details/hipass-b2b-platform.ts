import type { FeatureDetailDto } from '../types/feature-detail.dto';

export const HIPASS_B2B_PLATFORM_DETAIL: FeatureDetailDto = {
  role: `백엔드는 혼자 담당했고 서버와 결제·정산, Socket.io 실시간 이벤트, 운영 유지보수를 맡았습니다. 프론트엔드는 저를 포함한 2명이 함께 개발했고, 최초 구축 단계에서 기능·페이지 단위 디렉터리와 기능 내부 상태 소유 규칙을 제안한 뒤 실제 화면 기능도 구현했습니다.

공통 전역 상태는 사용자 정보처럼 여러 기능이 함께 쓰는 값으로 제한했습니다. 이 규칙은 두 명이 기능을 나눠 구현하고 이후 코드를 리뷰·유지보수하는 동안 기능과 상태의 위치를 찾고 공용 파일 충돌을 줄이는 기준으로 사용했습니다. 별도의 생산성 수치로 측정하지는 않았습니다.`,
  highlights: [
    {
      id: 'monthly-orders',
      label: '월 주문',
      value: '약 100건',
      kind: 'measured',
      asOf: '2026-06',
      evidence: '거래 운영 기간의 월말 보고서와 관리자·DB 기록에서 반복 확인한 월 주문 규모입니다.',
      caveat: '정확한 전수 평균이 아니라 운영 기록에서 확인한 근사 규모입니다.'
    },
    {
      id: 'monthly-payment-volume',
      label: '월 결제액',
      value: '약 400~500만 원',
      kind: 'measured',
      asOf: '2026-06',
      evidence: '같은 월말 보고서와 관리자·DB 기록에서 확인한 월 결제액 범위입니다.',
      caveat: '누적 매출이나 정산액이 아닌 월 결제 근사 범위이며 전수 평균은 남아 있지 않습니다.'
    },
    {
      id: 'monthly-settlement-orders',
      label: '월 정산 포함 완료 주문',
      value: '약 70건',
      kind: 'measured',
      asOf: '2026-06',
      evidence: '월말 정산 계산에 포함된 완료 주문을 운영 보고서에서 확인한 값입니다.',
      caveat: '지급 횟수나 지급 화원 수가 아니며 월별 완료 주문의 근사 규모입니다.'
    },
    {
      id: 'monthly-paid-gardens',
      label: '월 실지급 화원',
      value: '약 10~20곳',
      kind: 'measured',
      asOf: '2026-06',
      evidence: '등록된 정산 대상 약 50곳 중 지급대행 내역에서 해당 월 실제 지급을 확인한 화원 범위입니다.',
      caveat: '등록 대상 전체가 아니라 월별 지급대행 내역에서 관찰한 실지급 화원의 근사 범위입니다.'
    }
  ],
  problem: `하이패스 이전에는 화원이 전화, 팩스, 카카오톡으로 주문하고 결제는 계좌이체로 처리했습니다. 주문 접수부터 승인, 배송, 결제와 정산까지 한 화면에서 이어지는 B2B 거래 서비스를 새로 구축해야 했습니다.

기술적으로는 외부 결제 승인과 내부 주문 DB 저장을 하나의 원자적 트랜잭션으로 묶을 수 없다는 문제가 있었습니다. 결제가 승인된 뒤 주문 저장이 실패하면 실제 결제만 남을 수 있었고, 월 두 차례 지급대행을 실행할 때는 어떤 상태를 지급 기준으로 삼고 실패 입력을 어떻게 남길지도 정해야 했습니다.

주문 상태 변경은 관련 화원에게 바로 보여야 했지만, 관계없는 사용자까지 같은 이벤트를 받으면 안 됐습니다. 프론트엔드 두 명이 기능을 나눠 개발하는 동안 상태와 공용 파일의 소유권이 섞이지 않게 하는 기준도 필요했습니다.`,
  constraints: `결제사와 지급대행사의 외부 API는 내부 DB transaction에 포함할 수 없었습니다. 운영 환경은 단일 서버였고 정산 scheduler도 별도의 단일 PM2 process로 실행했기 때문에, 당시 구현을 여러 서버에 그대로 복제할 수 있는 구조로 설명할 수 없습니다.

정산과 결제는 실제 현금 이동을 포함하지만 자동 보상 취소의 이중 실패까지 복구하는 별도 체계는 없었습니다. 공개 내용에는 고객 거래 내역, 계좌 정보, 인증 정보, 시크릿, 실제 요청 payload와 비공개 로그·소스를 포함하지 않습니다.`,
  alternatives: `신규 실시간 기능을 설계할 때 HTTP Polling과 Socket.io를 비교했습니다. 주문 상태가 바뀌는 시점에 관련 대상만 갱신해야 했기 때문에 주기적으로 다시 조회하는 방식보다 Socket.io 이벤트를 선택했습니다. 이는 운영 중이던 Polling을 교체한 작업이 아니라 최초 구축의 선택입니다.

정산에서는 DB 상태를 지급 여부의 기준으로 두고, 계산을 마친 지급 입력과 실패 후 다시 사용할 입력을 JSON 파일에 남기는 방식을 사용했습니다. 지급 전에는 DB를 다시 확인하고 단일 scheduler process만 실행하도록 분리했습니다. 당시 별도의 메시지 시스템이나 검증하지 않은 복구 기술을 비교해 선택한 것은 아닙니다.`,
  swimlanes: [
    {
      id: 'order-payment-compensation',
      title: '주문·결제·보상 취소 흐름',
      purpose: '외부 결제 승인 뒤 내부 주문 저장이 실패했을 때 실제 구현이 어디까지 보상했는지 보여줍니다.',
      summary:
        '정상 경로에서는 내부 transaction을 시작하고 결제를 승인한 뒤 주문을 저장해 commit합니다. 주문 저장이 실패하면 rollback 후 결제 자동 취소를 호출했으며, 취소 API도 실패하면 자동 복구 없이 운영 확인이 필요한 상태로 끝났습니다.',
      archify: {
        url: '/diagrams/hipass-b2b-platform/order-payment-compensation.html'
      },
      lanes: [
        { id: 'client', label: '주문 사용자' },
        { id: 'order-server', label: '하이패스 서버' },
        { id: 'payment', label: 'Toss 결제' },
        { id: 'database', label: '주문 DB' }
      ],
      steps: [
        {
          id: 'request-order',
          laneId: 'client',
          row: 0,
          shape: 'start',
          label: '주문·결제 요청',
          description: '사용자가 주문과 결제를 요청합니다.'
        },
        {
          id: 'begin-transaction',
          laneId: 'order-server',
          row: 1,
          shape: 'process',
          label: 'DB transaction 시작',
          description: '서버가 내부 주문 저장을 위한 transaction을 시작합니다.'
        },
        {
          id: 'approve-payment',
          laneId: 'payment',
          row: 2,
          shape: 'process',
          label: '결제 승인',
          description: 'Toss 결제 API에서 결제가 승인됩니다.'
        },
        {
          id: 'save-order',
          laneId: 'database',
          row: 3,
          shape: 'decision',
          label: '주문 저장',
          description: '승인 결과를 바탕으로 주문 데이터를 저장하고 성공 여부를 확인합니다.'
        },
        {
          id: 'commit-order',
          laneId: 'order-server',
          row: 4,
          shape: 'process',
          label: 'commit',
          description: '주문 저장이 성공하면 내부 transaction을 commit합니다.'
        },
        {
          id: 'complete-order',
          laneId: 'client',
          row: 5,
          shape: 'end',
          label: '주문 완료',
          description: '결제와 주문 저장이 모두 확인된 결과를 사용자에게 제공합니다.'
        },
        {
          id: 'request-compensation',
          laneId: 'order-server',
          row: 5,
          shape: 'process',
          label: 'rollback·결제 취소 요청',
          description: '주문 저장 실패 시 내부 transaction을 rollback하고 결제 취소 API를 호출합니다.'
        },
        {
          id: 'compensation-complete',
          laneId: 'payment',
          row: 6,
          shape: 'end',
          label: '결제 취소 성공·보상 종료',
          description: '결제 취소 API 성공을 확인하고 보상 완료 상태로 종료합니다.'
        },
        {
          id: 'compensation-failed',
          laneId: 'payment',
          row: 7,
          shape: 'stop',
          label: '취소 API 실패·복구 미구현',
          description: '취소 API도 실패하면 자동 재시도나 복구 없이 운영 확인이 필요한 상태로 끝납니다.'
        }
      ],
      edges: [
        { id: 'request-begin', from: 'request-order', to: 'begin-transaction', kind: 'normal', outcome: 'continue' },
        { id: 'begin-approve', from: 'begin-transaction', to: 'approve-payment', kind: 'normal', outcome: 'continue' },
        { id: 'approve-save', from: 'approve-payment', to: 'save-order', kind: 'normal', outcome: 'continue' },
        {
          id: 'save-commit',
          from: 'save-order',
          to: 'commit-order',
          kind: 'normal',
          outcome: 'continue',
          label: '저장 성공'
        },
        { id: 'commit-complete', from: 'commit-order', to: 'complete-order', kind: 'normal', outcome: 'continue' },
        {
          id: 'save-request-compensation',
          from: 'save-order',
          to: 'request-compensation',
          kind: 'exception',
          outcome: 'recover',
          label: 'DB 저장 실패'
        },
        {
          id: 'compensation-success',
          from: 'request-compensation',
          to: 'compensation-complete',
          kind: 'normal',
          outcome: 'continue'
        },
        {
          id: 'compensation-api-failed',
          from: 'request-compensation',
          to: 'compensation-failed',
          kind: 'exception',
          outcome: 'stop',
          label: '취소 API 실패'
        }
      ],
      exceptions: [
        {
          id: 'payment-compensation-success',
          trigger: '결제 승인 뒤 주문 DB 저장이 실패하고 결제 취소 API는 성공했습니다.',
          response:
            '내부 transaction을 rollback하고 결제를 자동 취소해 주문과 결제가 함께 남지 않게 했습니다. 개발 환경에서 이 흐름의 성공을 확인했습니다.',
          edgeIds: ['save-request-compensation']
        },
        {
          id: 'payment-compensation-double-failure',
          trigger: '결제 승인 뒤 주문 DB 저장과 결제 취소 API가 모두 실패했습니다.',
          response:
            '개발 환경에서 실패를 재현했지만 자동 복구는 구현하지 못했습니다. 운영자가 결제 상태를 확인하고 수동 대응해야 하는 한계로 남았습니다.',
          edgeIds: ['save-request-compensation', 'compensation-api-failed']
        }
      ]
    }
  ],
  implementation: `결제 승인 전 내부 DB transaction을 시작하고, 승인 뒤 주문 저장이 성공하면 commit했습니다. 주문 저장에서 오류가 나면 rollback한 다음 결제 취소 API를 호출하는 보상 흐름을 구현했습니다. 개발 환경에서는 자동 취소 성공과 취소 API 실패를 각각 확인했습니다.

정산은 DB의 상태를 지급 판단 기준으로 사용했습니다. 지급 직전에 DB 상태를 다시 확인했고, 계산된 지급 입력은 JSON 파일로 보존했습니다. 성공한 항목은 완료 상태로 바꾸고 JSON에서 제거했으며 실패한 항목은 파일에 남겨 매일 10시와 14시에 다시 확인했습니다. scheduler는 웹 요청을 처리하는 worker와 분리한 단일 PM2 process로 실행해 같은 서버 안에서 중복 schedule이 시작되지 않게 했습니다. 자세한 판단은 [정산 상태는 DB에, 재처리 입력은 JSON에 둔 이유](/insights/json-outbox-pattern-for-settlement)에서 다룹니다.

실시간 상태는 최초 공용 Room에서 시작했지만 개발 중 코드 재검토에서 관계없는 사용자까지 받을 수 있는 구조임을 발견했습니다. 이후 \`user_<gardenId>\` 형태의 화원별 Room으로 바꾸고 여러 계정으로 관련 화원만 이벤트를 받는지 확인했습니다. 이 변경은 전달 대상을 좁힌 것이며 이벤트 도달 자체를 보장한 것은 아닙니다. 자세한 범위는 [공용 Room에서 화원별 User Room으로: 전달 범위와 전달 보장은 다르다](/insights/socketio-realtime-architecture-and-reliability)에서 분리해 설명합니다.`,
  outcomes: `신규 거래 운영 기간에는 월 2회 정산했고, 운영팀이 월말 보고서를 준비할 때 내부 정산 내역과 지급대행사의 실제 지급 내역을 함께 대조했습니다. 2026년 6월까지 이 대사 범위에서 정산 금액 불일치나 중복 지급을 확인하지 못했습니다. 이는 시스템 전체의 영구적인 무결성을 보장한다는 뜻이 아니라 매월 수행한 운영 확인 결과입니다.

결제 보상 흐름은 개발 환경에서 주문 DB 저장 실패 뒤 rollback과 자동 취소가 성공하는 것을 확인했습니다. 동시에 취소 API 자체가 실패하는 경우도 재현했고, 그 뒤 자동 복구가 없다는 한계를 구분했습니다. Socket.io는 개발 중 여러 계정으로 관련 주문·수령 화원만 이벤트를 받고 화면이 갱신되는 것을 확인했습니다. 성능 개선률이나 유실 방지 효과는 측정하지 않았습니다.

기능 설계부터 마지막 코드 수정은 2024년 8월부터 2025년 8월까지 진행했습니다. 신규 주문·결제·정산 운영은 2026년 6월에 종료됐고, 현재는 관리자 조회와 기존 데이터 보존 상태를 유지하고 있습니다.`,
  retrospective: `외부 결제 승인과 내부 DB 저장 사이에는 항상 이중 실패 가능성이 남습니다. 지금 다시 구성한다면 결제 취소 API까지 실패하는 즉시 운영자에게 알리고, 결제사와 내부 주문 상태를 수동 확인·취소할 수 있는 절차부터 명확히 두겠습니다. 검증하지 않은 자동 복구를 구현된 기능처럼 설명하지 않는 것도 중요합니다.

정산에서 DB를 상태 기준으로 둔 판단은 유지할 수 있지만, 서버 로컬 JSON 파일은 로드밸런싱이나 scale-out 환경에서 같은 방식으로 사용할 수 없습니다. 파일을 다른 저장소로 옮길지 DB만으로 관리할지, scheduler 실행 구조를 어떻게 바꿀지는 아직 검토해 확정한 답이 없습니다.

실시간 이벤트에서는 전달 범위와 전달 보장을 분리해서 봐야 한다는 점을 배웠습니다. 사용자나 조직에 속한 상태는 대상별 Room으로 제한하고, 모두가 받아야 하는 진짜 공지만 공용 Room을 사용할 수 있습니다. 다만 Room을 나누는 것만으로 연결이 끊긴 동안의 이벤트 도달을 증명할 수는 없습니다.`
};
