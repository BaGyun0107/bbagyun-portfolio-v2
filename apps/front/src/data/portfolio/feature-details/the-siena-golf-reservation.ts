import type { FeatureDetailDto } from '../types/feature-detail.dto';

export const THE_SIENA_GOLF_RESERVATION_DETAIL: FeatureDetailDto = {
  role: `입사 후 첫 프로젝트였습니다. 전체 구조는 이미 정해져 있었고, 그 안에서 예약 화면, PHP 요청 처리, 외부 PMS 연동, 중복 요청 방어와 통신 로그 기록을 FE/BE 범위 모두 단독으로 구현했습니다. 이후 운영 유지보수 과정에서는 외부 API 통신 로그를 업무 DB에서 syslog로 옮기는 방향을 결정하고 직접 구현했습니다.`,
  highlights: [
    {
      id: 'initial-build-period',
      label: '최초 구축',
      value: '2023.05 – 2023.06',
      kind: 'reported',
      asOf: '2023.06',
      evidence: '예약 화면과 PHP 요청 처리, 외부 PMS 연동을 신규 구축한 기간으로 보고된 값입니다.',
      caveat: '현재까지 계속 구축했다는 뜻이 아니라 최초 구축 기간만 나타냅니다.'
    },
    {
      id: 'maintenance-period',
      label: '운영 유지보수',
      value: '2023년 오픈 – 현재',
      kind: 'reported',
      asOf: '2026-09',
      evidence: '2023년 오픈 이후 현재까지 유지보수 계약과 직접 유지보수가 이어진 상태를 기준으로 합니다.',
      caveat: '2026-09 검토 시점의 상태이며 앞으로의 영구 지속을 보장하지 않습니다.'
    },
    {
      id: 'incident-log-scale',
      label: '장애 조사 당시 통신 로그',
      value: '수백만 건',
      kind: 'measured',
      asOf: '운영 유지보수 과정',
      evidence: '예약 문제 조사 중 업무 DB의 로그 테이블을 열었을 때 DB GUI에서 직접 확인한 규모입니다.',
      caveat: '당시의 정확한 전수 건수는 복원하지 못했습니다.'
    }
  ],
  problem: `초기에는 예약·회원 업무 데이터와 외부 API 통신 로그가 같은 업무 DB에 있었습니다. 운영 유지보수 과정에서 로그가 수백만 건으로 누적된 뒤 예약 문제를 조사하려고 로그 테이블을 열자 DB GUI가 다운됐고, 당사 기록을 조회할 수 없어 당시에는 PMS 업체에 예약 건 확인을 요청해야 했습니다. 예약 기능 자체에 미친 영향은 거의 없었습니다. 필요한 시점에 당사 통신 기록을 조회하지 못한 것이 운영 문제였습니다.`,
  constraints: `예약 원본과 최종 결과는 외부 PMS가 소유합니다. 당사 서비스는 예약 요청을 전달하고 중복 호출을 완화하며 외부 오류에 맞는 사용자 안내를 제공하는 범위이므로, PMS의 처리 결과 자체를 내부에서 확정할 수는 없었습니다. 최초 구축에서는 이미 정해진 구조 안에서 구현해야 했습니다.`,
  alternatives: `최초 구축에서는 정해진 요청 흐름을 유지하면서 클라이언트와 서버 양쪽에 중복 방어를 두었습니다. 이후 로그 조회 문제가 드러났을 때는 예약 요청 흐름을 바꾸지 않고, 업무 데이터와 외부 API 통신 로그의 저장 경계를 분리하는 방향을 선택했습니다.`,
  swimlanes: [
    {
      id: 'reservation-request-and-exception-flow',
      title: '예약 요청·중복 방어·외부 장애 안내 흐름',
      purpose:
        '예약 요청이 React와 PHP 서버를 거쳐 외부 PMS로 전달되는 정상 경로와 중복·5xx·timeout 예외의 처리 위치를 보여줍니다.',
      summary:
        '예약 요청: 사용자가 예약을 요청합니다. 버튼 비활성화·스피너 표시: React는 버튼을 비활성화하고 스피너를 표시합니다. 2초 중복 요청 검사: PHP 서버는 같은 세션의 같은 요청이 2초 이내 반복됐는지 검사합니다. 중복 요청 차단: 중복이면 외부 PMS 호출 전에 차단합니다. 30초 timeout으로 PMS 호출: 중복이 아니면 30초 timeout으로 외부 PMS에 예약 요청을 전달합니다. PMS 예약 처리·결과 반환: 외부 PMS는 예약 원본을 처리하고 결과를 반환합니다. 사용자 결과·안내 완료: 정상 PMS 경로에서는 예약 성공 결과를 표시하고, 오류 경로에서는 재시도 또는 혼잡 안내로 마칩니다. 잠시 후 재시도 안내: 5xx에는 잠시 후 재시도 안내를 제공합니다. 일시적 혼잡 안내: 30초 timeout에는 일시적 혼잡 안내를 제공합니다. 외부 PMS가 예약 원본과 결과를 소유하고 당사 서비스는 요청 전달과 안내를 담당합니다.',
      lanes: [
        { id: 'user', label: '예약 사용자' },
        { id: 'react', label: 'React' },
        { id: 'php-server', label: 'PHP 서버' },
        { id: 'external-pms', label: '외부 PMS' }
      ],
      steps: [
        {
          id: 'request-reservation',
          laneId: 'user',
          row: 0,
          shape: 'start',
          label: '예약 요청',
          description: '사용자가 예약을 요청합니다.'
        },
        {
          id: 'lock-ui',
          laneId: 'react',
          row: 1,
          shape: 'process',
          label: '버튼 비활성화·스피너 표시',
          description: 'React는 버튼을 비활성화하고 스피너를 표시합니다.'
        },
        {
          id: 'check-duplicate',
          laneId: 'php-server',
          row: 2,
          shape: 'decision',
          label: '2초 중복 요청 검사',
          description: 'PHP 서버는 같은 세션의 같은 요청이 2초 이내 반복됐는지 검사합니다.'
        },
        {
          id: 'stop-duplicate',
          laneId: 'php-server',
          row: 3,
          shape: 'stop',
          label: '중복 요청 차단',
          description: '중복이면 외부 PMS 호출 전에 차단합니다.'
        },
        {
          id: 'call-pms',
          laneId: 'php-server',
          row: 4,
          shape: 'process',
          label: '30초 timeout으로 PMS 호출',
          description: '중복이 아니면 30초 timeout으로 외부 PMS에 예약 요청을 전달합니다.'
        },
        {
          id: 'process-pms-reservation',
          laneId: 'external-pms',
          row: 5,
          shape: 'process',
          label: 'PMS 예약 처리·결과 반환',
          description: '외부 PMS는 예약 원본을 처리하고 결과를 반환합니다.'
        },
        {
          id: 'guide-retry',
          laneId: 'user',
          row: 6,
          shape: 'process',
          label: '잠시 후 재시도 안내',
          description: '5xx에는 잠시 후 재시도 안내를 제공합니다.'
        },
        {
          id: 'guide-congestion',
          laneId: 'user',
          row: 7,
          shape: 'process',
          label: '일시적 혼잡 안내',
          description: '30초 timeout에는 일시적 혼잡 안내를 제공합니다.'
        },
        {
          id: 'complete-user-feedback',
          laneId: 'user',
          row: 8,
          shape: 'end',
          label: '사용자 결과·안내 완료',
          description:
            '정상 PMS 경로에서는 예약 성공 결과를 표시하고, 오류 경로에서는 재시도 또는 혼잡 안내로 마칩니다.'
        }
      ],
      edges: [
        {
          id: 'request-lock-ui',
          from: 'request-reservation',
          to: 'lock-ui',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'lock-ui-check-duplicate',
          from: 'lock-ui',
          to: 'check-duplicate',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'check-duplicate-call-pms',
          from: 'check-duplicate',
          to: 'call-pms',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          label: '중복 아님',
          labelAt: { column: 0.5, row: 3.5 }
        },
        {
          id: 'check-duplicate-stop',
          from: 'check-duplicate',
          to: 'stop-duplicate',
          kind: 'exception',
          outcome: 'stop',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          label: '같은 세션·같은 요청 2초 이내: PMS 호출 전 차단',
          labelAt: { column: 0.5, row: 2.5 }
        },
        {
          id: 'call-pms-process-reservation',
          from: 'call-pms',
          to: 'process-pms-reservation',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'process-reservation-complete-user-feedback',
          from: 'process-pms-reservation',
          to: 'complete-user-feedback',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'left',
          toAnchor: 'right',
          label: '예약 성공 결과',
          labelAt: { column: 2.5, row: 7.5 }
        },
        {
          id: 'pms-5xx-guide-retry',
          from: 'process-pms-reservation',
          to: 'guide-retry',
          kind: 'exception',
          outcome: 'recover',
          fromAnchor: 'left',
          toAnchor: 'right',
          label: '5xx: 잠시 후 재시도 안내',
          labelAt: { column: 1.5, row: 5.5 }
        },
        {
          id: 'pms-timeout-guide-congestion',
          from: 'call-pms',
          to: 'guide-congestion',
          kind: 'exception',
          outcome: 'recover',
          fromAnchor: 'left',
          toAnchor: 'right',
          label: '30초 timeout: 일시적 혼잡 안내',
          labelAt: { column: 1.5, row: 6.5 }
        },
        {
          id: 'retry-guide-complete-user-feedback',
          from: 'guide-retry',
          to: 'complete-user-feedback',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'congestion-guide-complete-user-feedback',
          from: 'guide-congestion',
          to: 'complete-user-feedback',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        }
      ],
      exceptions: [
        {
          id: 'duplicate-request',
          trigger: '같은 세션에서 같은 요청이 2초 이내 반복됐습니다.',
          response: '외부 PMS 호출 전에 중복 요청을 차단합니다.',
          edgeIds: ['check-duplicate-stop']
        },
        {
          id: 'pms-5xx',
          trigger: '외부 PMS가 예약 요청에 5xx로 응답했습니다.',
          response: '사용자에게 잠시 후 재시도하도록 안내하고, 예약 성공 결과와 구분된 안내 완료 상태로 끝납니다.',
          edgeIds: ['pms-5xx-guide-retry']
        },
        {
          id: 'pms-timeout',
          trigger: '외부 PMS가 30초 안에 응답하지 않았습니다.',
          response: '사용자에게 일시적 혼잡을 안내하고, 예약 성공 결과와 구분된 안내 완료 상태로 끝납니다.',
          edgeIds: ['pms-timeout-guide-congestion']
        }
      ],
      archify: {
        url: '/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html'
      }
    }
  ],
  implementation: `예약 요청 직후 React에서 버튼을 비활성화하고 스피너를 표시했습니다. PHP 서버에서는 같은 세션의 같은 요청이 2초 이내 반복되면 외부 PMS 호출 전에 차단했고, 외부 PMS 요청에는 30초 timeout을 적용했습니다. PMS가 5xx를 반환하면 잠시 후 재시도 안내를, timeout이면 일시적 혼잡 안내를 제공했습니다.

초기에는 예약·회원 업무 데이터와 외부 API 통신 로그를 같은 업무 DB에 저장했습니다. 운영 유지보수 과정에서 로그 테이블 조회가 어려워진 뒤에는 예약 요청 흐름을 유지하면서 통신 로그의 저장 경계를 syslog로 분리하는 방향을 결정하고 직접 구현했습니다. 분리 뒤 실제 예약 문제가 접수됐을 때 당사 시스템 로그에서 해당 요청과 응답을 직접 확인할 수 있었습니다.

로그를 남기는 것과 장애 시점에 조회할 수 있는 것의 차이와 저장 경계 판단은 [로그는 남기는 것보다 조회할 수 있어야 한다: 외부 API 로그 분리기](/insights/logging-decoupling-and-buffering-in-external-api-systems)에서 별도로 다룹니다.`,
  outcomes: `2023년 오픈부터 현재 2026-09 검토 시점까지 제가 직접 관찰한 통신 로그와 지원 범위에서는 동일 예약의 중복 호출 이력과 중복 예약 관련 CS를 발견하지 못했습니다. 이는 전체 예약 전수 집계나 영구적인 예약 무결성 보장이 아니라, 직접 유지보수하며 확인할 수 있었던 기록과 접수 범위의 결과입니다.

외부 PMS 5xx와 timeout에는 구현한 재시도·혼잡 안내가 동작했습니다. syslog 분리 뒤에는 실제 예약 문제의 요청과 응답을 당사 시스템에서 직접 확인할 수 있었습니다.`,
  retrospective: `지금 다시 다듬는다면 syslog 분리 경계는 유지하되 인증값과 개인정보를 마스킹하고, 장애 추적에 필요한 정보만 기록하며 로그 보존 기간을 함께 관리하겠습니다.`
};
