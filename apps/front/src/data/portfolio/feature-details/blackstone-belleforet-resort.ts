import type { FeatureDetailDto } from '../types/feature-detail.dto';

export const BLACKSTONE_BELLEFORET_RESORT_DETAIL: FeatureDetailDto = {
  role: `모든 설계를 혼자 맡았고, 1인 백엔드 겸 프론트엔드 개발자로서 기존 그누보드 자산 위의 PHP·React 공존 구조와 인증, 결제·예약 연동, 보상취소, API Key 프록시를 설계·구현하며 프로젝트 전반을 주도했습니다.`,
  highlights: [
    {
      id: 'reported-complaint-mismatches',
      label: '컴플레인 접수 불일치',
      value: '10건 미만',
      kind: 'reported',
      asOf: '2026-08',
      evidence: '고객 컴플레인으로 접수된 결제·예약 불일치 기준이며 시스템 전수 집계가 아닙니다.',
      caveat: '시스템 전수 집계가 아니며 실제 불일치 건수의 하한입니다.'
    },
    {
      id: 'operating-observation-period',
      label: '운영 관찰 기간',
      value: '2024년 오픈 ~ 현재 진행 중',
      kind: 'reported',
      asOf: '현재 진행 중',
      evidence: '2024년 오픈 이후 현재까지 유지보수하면서 같은 유형의 문제를 파악하지 못했다는 인터뷰 회고입니다.',
      caveat: '시스템 전수 집계가 아니라 유지보수 과정에서 확인한 관찰 범위입니다.'
    }
  ],
  problem: `문제는 세 갈래였습니다. 기존 그누보드 자산을 활용하면서 예약·로그인·마이페이지에는 React를 결합해 신규 리조트 서비스를 구축해야 했습니다. PHP와 React가 같은 origin에서 경로와 인증 상태를 공유해야 했고, 결제는 PHP 서버에서 처리한 뒤 예약·티켓 생성이 별도 단계로 이어져 중간 실패 시 결제와 실제 예약 상태가 어긋날 수 있었습니다.

또한 프로젝트 중간에 React 환경변수가 빌드 산출물에 포함된다는 점을 몰랐던 사실을 확인했습니다. 외부 API Key가 클라이언트에서 보일 수 있는 구조였기 때문에 결제 안정화와 함께 시크릿 경계도 바로잡아야 했습니다.`,
  constraints: `기존 그누보드 자산과 PHP 결제 흐름을 활용해야 했습니다. 서브도메인 분리는 CORS와 쿠키 공유, 기존 SEO·링크 유지 부담을 만들었고, 외부 PMS와 결제 시스템의 응답과 장애는 내부 트랜잭션 하나로 묶을 수 없었습니다.

WebView에서 자동로그인 토큰이 유실되는 원인은 앱 개발자에게 전달받은 내용이라 직접 규명한 사실처럼 단정할 수 없습니다.`,
  alternatives: `서브도메인 분리는 실제로 검토했습니다. 그러나 CORS와 쿠키 공유 복잡도, 기존 SEO·링크 단절 가능성을 감수하기보다 같은 origin 안에서 Nginx 경로를 나누는 편이 기존 자산과 일정에 맞았습니다.

기존 자산 위에 PHP와 React를 함께 두는 방향은 신규 구축의 제약 안에서 내린 판단이었습니다.

Node.js에서는 ORM 트랜잭션으로 결제 상태 변경을 묶어 왔지만, 기존 PHP 결제 흐름에 같은 방식을 그대로 적용하기 어려웠습니다. 외부 결제와 PMS까지 하나의 트랜잭션으로 묶는 대신 중간 단계가 실패하면 역방향으로 되돌리는 보상 방식을 택했습니다. API Key 대응은 대안 비교가 아니라 잘못 이해한 시크릿 경계를 발견한 뒤 수정한 작업입니다.`,
  swimlanes: [
    {
      id: 'payment-and-compensation',
      title: '결제·보상취소 흐름',
      purpose: '같은 결제 후 예약 미생성 현상에서 서로 다른 세 원인과 대응이 어떻게 갈리는지 보여줍니다.',
      summary:
        '결제 승인 뒤 예약·티켓 생성 결과를 확인해 성공 시 예약을 완료하고, 응답 미도달·외부 장애·timeout 오판 시 각각 자동 보상취소, 장애 구간 로그 확인, timeout 정책 보강으로 대응했습니다.',
      lanes: [
        { id: 'guest', label: '이용자' },
        { id: 'php-service', label: 'PHP 서버' },
        { id: 'payment-provider', label: '결제사' },
        { id: 'pms', label: 'PMS·티켓' }
      ],
      steps: [
        {
          id: 'submit-payment',
          laneId: 'guest',
          row: 0,
          shape: 'start',
          label: '결제 요청',
          description: '이용자가 예약·티켓 결제를 요청합니다.'
        },
        {
          id: 'approve-payment',
          laneId: 'payment-provider',
          row: 1,
          shape: 'process',
          label: '결제 승인',
          description: '결제사가 요청을 승인합니다.'
        },
        {
          id: 'persist-payment',
          laneId: 'php-service',
          row: 2,
          shape: 'process',
          label: '결제 정보 처리',
          description: 'PHP 서버가 승인 결과와 예약 요청에 필요한 정보를 처리합니다.'
        },
        {
          id: 'create-reservation',
          laneId: 'pms',
          row: 3,
          shape: 'process',
          label: '예약·티켓 생성',
          description: '외부 PMS가 예약과 티켓을 생성합니다.'
        },
        {
          id: 'evaluate-result',
          laneId: 'php-service',
          row: 4,
          shape: 'decision',
          label: '생성 결과 판단',
          description: '응답과 식별자를 확인해 완료 또는 장애 대응 경로를 결정합니다.'
        },
        {
          id: 'complete-service',
          laneId: 'guest',
          row: 5,
          shape: 'end',
          label: '예약 완료',
          description: '결제와 예약·티켓 생성이 모두 확인된 결과를 이용자에게 제공합니다.'
        },
        {
          id: 'auto-compensation',
          laneId: 'payment-provider',
          row: 5,
          shape: 'stop',
          label: '자동 보상취소',
          description: '예약 생성 실패나 응답 미도달 시 서버가 결제를 취소합니다.'
        },
        {
          id: 'pms-outage-observation',
          laneId: 'php-service',
          row: 5,
          shape: 'stop',
          label: '장애 구간 확인',
          description: '로그의 최초 발생 시각과 종료 시각을 대조해 외부 PMS 장애 구간을 확인합니다.'
        },
        {
          id: 'timeout-mismatch',
          laneId: 'pms',
          row: 5,
          shape: 'stop',
          label: '조기 실패 오판',
          description: '12초 timeout이 정상 처리 중인 요청을 실패로 판단한 지점을 종료 상태로 구분합니다.'
        }
      ],
      edges: [
        {
          id: 'submit-approve',
          from: 'submit-payment',
          to: 'approve-payment',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'approve-persist',
          from: 'approve-payment',
          to: 'persist-payment',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'persist-create',
          from: 'persist-payment',
          to: 'create-reservation',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'create-evaluate',
          from: 'create-reservation',
          to: 'evaluate-result',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'evaluate-complete',
          from: 'evaluate-result',
          to: 'complete-service',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          label: '예약·티켓 생성 확인'
        },
        {
          id: 'evaluate-compensate',
          from: 'evaluate-result',
          to: 'auto-compensation',
          kind: 'exception',
          outcome: 'stop',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          label: '응답 미도달·생성 실패·PHP 예외'
        },
        {
          id: 'evaluate-outage',
          from: 'evaluate-result',
          to: 'pms-outage-observation',
          kind: 'exception',
          outcome: 'stop',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          label: '외부 PMS 장애'
        },
        {
          id: 'evaluate-timeout',
          from: 'evaluate-result',
          to: 'timeout-mismatch',
          kind: 'exception',
          outcome: 'stop',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          label: '12초 timeout 조기 실패 오판'
        }
      ],
      exceptions: [
        {
          id: 'response-or-generation-failure',
          trigger: '결제 응답이 프론트에 도달하지 않거나 예약·티켓 생성 실패·무응답·PHP 예외가 발생했습니다.',
          response: '서버가 결제 보상취소를 수행하고 결과를 남깁니다.',
          edgeIds: ['evaluate-compensate']
        },
        {
          id: 'pms-outage-observation',
          trigger: '외부 PMS 장애가 발생했습니다.',
          response: '로그의 최초 발생 시각과 종료 시각을 대조해 장애 구간을 확인했습니다.',
          edgeIds: ['evaluate-outage']
        },
        {
          id: 'premature-timeout',
          trigger: '임의의 12초 timeout이 정상 처리 중인 요청을 실패로 오판했습니다.',
          response:
            '당시 API 문제로 약 20초까지 지연된 상태를 확인하고 30초 UX와 결제 안전성을 비교해 장애 대응값 60초를 선택했습니다. 이후 API가 수정되어 현재는 과거처럼 오래 걸리지 않습니다.',
          edgeIds: ['evaluate-timeout']
        }
      ],
      archify: {
        url: '/diagrams/blackstone-belleforet-resort/payment-and-compensation.html'
      }
    }
  ],
  implementation: `### 기존 자산 위의 PHP·React 공존과 인증

기존 그누보드 자산 위에 신규 서비스를 구축하면서 같은 origin 안에서 PHP와 React가 공존하도록 Nginx 경로를 분기했습니다. React 경로를 직접 열어도 빌드 진입점으로 연결하고, PHP와 React가 같은 JWT를 사용하도록 PHP 쪽에 JWT 검증 미들웨어를 추가했습니다.

WebView 자동로그인 토큰 유실 원인은 앱 개발자에게 전달받은 내용으로만 한정했습니다. 원인을 직접 규명했다고 쓰는 대신, 앱 개발자와 브릿지 인터페이스를 맞추고 토큰을 네이티브 앱에 전달한 구현 사실을 남겼습니다.

### 결제·예약 보상 흐름과 timeout 교훈

결제 승인 뒤 예약·티켓 생성이 실패하거나 응답이 프론트에 도달하지 못하면 PHP 서버가 결제를 자동 보상취소하도록 만들었습니다. 외부 PMS 장애는 로그의 최초 발생 시각과 종료 시각을 대조해 장애 구간을 확인했습니다.

세 번째 원인은 timeout 정책이었습니다. 외부 근거 없이 12초로 임의 설정한 뒤 정상 처리 중인 요청을 실패로 오판했습니다. 당시 약 20초까지 걸린 응답은 PMS의 정상 평균 속도가 아니라 해당 API에 문제가 있어 지연된 상태였습니다. 사용자 경험상 30초도 검토했지만 결제 안전성을 우선해 장애 대응값을 60초로 늘렸고, 이후 해당 API가 수정되어 현재는 과거처럼 오래 걸리지 않습니다. 이 경험을 통해 timeout은 임의의 숫자가 아니라 정상 응답 범위, 장애 상태, 실패 비용을 구분해 정해야 한다는 점을 배웠습니다.

### API Key 오해 발견과 서버 프록시

프로젝트 중간에 React 환경변수가 빌드 산출물에 포함되고 브라우저에서 확인될 수 있다는 사실을 발견했습니다. 클라이언트 환경변수에 시크릿을 둘 수 있다고 잘못 이해했던 문제였습니다. 외부 API 호출을 PHP 프록시 뒤로 옮기고 API Key는 서버 환경변수에서만 읽도록 수정했습니다.

### 더 깊이 읽기

- [React API Key 노출을 서버 경계로 옮기며 배운 BFF의 필요성](/insights/spa-api-key-exposure-and-bff-architecture)`,
  outcomes: `고객 컴플레인으로 접수된 결제·예약 불일치는 2026-08 기준 10건 미만이었습니다. 이는 시스템 전수 집계가 아니라 실제 불일치의 하한입니다.

응답 미도달, PMS 장애, 조기 timeout 오판을 차례로 추적하면서 자동 보상취소와 장애 로그 확인, timeout 정책을 보강했습니다. 2024년 오픈부터 현재까지 유지보수하는 동안 같은 유형의 문제를 추가로 파악하지 못했지만, 이 역시 전수 집계가 아닌 운영 관찰 범위입니다.`,
  retrospective: `외부 근거 없이 임의 설정한 timeout은 정상 요청도 실패로 오판하게 만들 수 있었습니다. 당시 약 20초 지연은 API 문제로 발생한 상태였고 현재는 해당 API가 수정됐습니다. 다음에는 정상 응답 범위와 장애 상태를 구분하고 외부 계약과 실패 비용을 확인한 뒤 timeout을 정해야 합니다. 이 작업에서는 30초 사용자 경험과 60초 결제 안전성 사이에서 조기 취소의 실패 비용이 더 크다고 보고 장애 대응값 60초를 선택했습니다.

SPA의 시크릿 경계를 잘못 이해했던 사실도 숨기지 않습니다. 클라이언트 빌드 산출물은 공개된다는 원칙을 이후 설계의 출발점으로 삼았고, 프록시를 만드는 데서 끝내지 않고 시크릿이 머무는 경계를 서버로 옮겼습니다.

자동 보상취소만 구현하는 데서 끝내지 않고 장애 구간을 확인할 수 있는 로그와 timeout 정책을 함께 다뤄야 서로 다른 실패를 구분할 수 있다는 점이 가장 크게 남았습니다.`
};
