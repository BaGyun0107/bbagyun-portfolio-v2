import type { FeatureDetailDto } from '../types/feature-detail.dto';

export const INTEGRATED_ACCOUNT_SERVER_DETAIL: FeatureDetailDto = {
  role: `1인 백엔드 개발자로 Express 기반 초기 서버부터 NestJS·Prisma 전환까지 중앙 회원 관리·인증 서버 전반을 설계하고 구현했습니다. 회원 원본과 서비스 데이터의 책임 분리, 회원가입·로그인·토큰 발급과 갱신, Provider 권한, UUID 연결, 서비스의 로컬 토큰 검증과 키 캐시를 담당했습니다.`,
  highlights: [
    {
      id: 'operating-service-scope',
      label: '운영 적용 범위',
      value: '서비스 1개',
      kind: 'reported',
      asOf: '2026-09',
      evidence: '사용자 인터뷰와 중앙 회원 서버·HiPass 연동 코드에서 확인한 공개 범위입니다.',
      caveat: '여러 서비스의 인증을 통합한 성과가 아니라 첫 운영 서비스에 적용한 범위입니다.'
    },
    {
      id: 'build-and-expansion-period',
      label: '구축·확장 기간',
      value: '2024.07 – 2025.06',
      kind: 'reported',
      asOf: '2025-06',
      evidence:
        '초기 Express 구축 시점은 사용자 인터뷰, 2025년 NestJS·Prisma 전환과 기능 확장은 Git 이력으로 확인했습니다.'
    },
    {
      id: 'maintenance-status',
      label: '현재 상태',
      value: '운영·유지보수 중',
      kind: 'reported',
      asOf: '2026-09',
      evidence: '첫 연동 서비스가 현재도 운영 중이라는 사용자 보고 범위입니다.'
    }
  ],
  problem: `문제는 향후 서비스마다 회원 테이블과 비밀번호 처리, 인증 API를 반복해서 구현해야 한다는 점이었습니다. 이를 피하기 위해 회원 원본과 인증 책임을 별도 서버로 분리해야 했습니다. 목표는 한 번의 로그인으로 여러 서비스를 이용하게 하는 SSO가 아니라, 회사 차원에서 ID·비밀번호·UUID를 하나의 원본으로 관리하고 각 서비스가 자신의 도메인 데이터와 접근 정책에 집중하도록 만드는 것이었습니다.

첫 번째 목표는 다중 서비스 통합 성과가 아니었습니다. 중앙 회원 관리 구조를 실제 운영 서비스 하나에 적용해 회원가입·로그인·토큰 갱신·서비스 데이터 연결이 동작하도록 만드는 데 범위를 한정했습니다.`,
  constraints: `중앙 회원 서버와 서비스는 물리적으로 다른 데이터베이스를 사용했습니다. DB Foreign Key로 회원과 서비스 데이터를 직접 연결할 수 없었고, 서비스가 중앙 회원 DB를 직접 공유하면 데이터 소유권과 접근 책임이 섞였습니다. 반대로 모든 요청에서 중앙 API를 조회하면 서비스의 도메인 처리까지 중앙 서버 응답에 의존하게 됩니다.

Provider 키 조회 실패에는 서비스가 보관한 JSON 캐시를 사용하는 경로를 두었습니다. 그러나 로그인 API 자체가 중단됐을 때 신규 로그인을 처리하는 fallback은 구현하거나 테스트하지 않았습니다. 이미 발급된 토큰으로 가능한 범위 역시 장애 실험으로 확인하지 않았으므로 가용성 성과로 주장하지 않습니다.`,
  alternatives: `당시 실제로 비교한 대안은 중앙 회원 DB를 서비스가 직접 공유하는 방식과, 서비스가 회원을 식별할 때마다 중앙 회원 API를 조회하는 방식이었습니다.

공용 DB 방식은 별도 조회 API가 필요 없지만 인증 원본과 서비스 도메인 데이터의 책임·보안 경계를 섞습니다. 매 요청 조회 방식은 중앙 원본을 기준으로 처리할 수 있지만 서비스 도메인 요청도 중앙 응답에 의존합니다. 그래서 ID·비밀번호·UUID는 중앙 서버가 관리하고, 서비스는 로그인 응답으로 받은 UUID를 자신의 DB에 저장해 논리적으로 연결하는 방식을 선택했습니다. Redis 중앙 세션은 당시 검토한 대안으로 기록하지 않습니다.`,
  swimlanes: [
    {
      id: 'central-account-auth-flow',
      title: '중앙 회원 인증과 서비스 로컬 검증',
      purpose: 'Provider 키 준비부터 로그인, 서비스의 로컬 검증, 토큰 갱신과 확인되지 않은 장애 경계를 보여줍니다.',
      summary:
        '서비스는 중앙 회원 서버에서 Provider 키를 받아 캐시하고, 로그인 응답의 UUID와 토큰을 저장한 뒤 Access Token은 로컬에서 검증하고 Refresh Token 갱신은 중앙 서버에 요청합니다.',
      lanes: [
        { id: 'user', label: '사용자' },
        { id: 'service', label: 'HiPass 서버' },
        { id: 'account', label: '중앙 회원 서버' },
        { id: 'database', label: 'HiPass DB·캐시' }
      ],
      steps: [
        {
          id: 'service-start',
          laneId: 'service',
          row: 0,
          shape: 'start',
          label: '서비스 시작',
          description: '인증 요청을 처리하기 전에 Provider 키를 준비합니다.'
        },
        {
          id: 'request-provider',
          laneId: 'service',
          row: 1,
          shape: 'process',
          label: 'Provider 정보 요청',
          description: 'Provider 식별자와 API 인증값을 담아 중앙 회원 서버에 키 정보를 요청합니다.'
        },
        {
          id: 'provider-return',
          laneId: 'account',
          row: 2,
          shape: 'process',
          label: '권한 확인과 키 반환',
          description: 'Provider와 요청 권한, 허용 서버를 확인하고 토큰·비밀번호 처리 키를 반환합니다.'
        },
        {
          id: 'cache-provider',
          laneId: 'database',
          row: 3,
          shape: 'process',
          label: 'Provider 키 캐시',
          description: '정상 응답은 JSON으로 저장하고 통신 실패 시 마지막 파일을 사용합니다.'
        },
        {
          id: 'user-login',
          laneId: 'user',
          row: 4,
          shape: 'process',
          label: '로그인 요청',
          description: '사용자가 서비스에 ID와 비밀번호를 제출합니다.'
        },
        {
          id: 'forward-login',
          laneId: 'service',
          row: 5,
          shape: 'process',
          label: '인증 요청 전달',
          description: '서비스 서버가 중앙 회원 API로 자격 증명을 전달합니다.'
        },
        {
          id: 'issue-token',
          laneId: 'account',
          row: 6,
          shape: 'process',
          label: '검증과 토큰 발급',
          description: '중앙 회원 서버가 비밀번호를 검증하고 UUID와 Access·Refresh Token을 반환합니다.'
        },
        {
          id: 'persist-session',
          laneId: 'database',
          row: 7,
          shape: 'process',
          label: '회원 연결과 토큰 저장',
          description: 'UUID·로그인 ID·토큰을 user_tokens에 저장하고 UUID로 서비스 도메인 데이터를 연결합니다.'
        },
        {
          id: 'login-stop',
          laneId: 'account',
          row: 7,
          shape: 'stop',
          label: '신규 로그인 중단',
          description: '로그인 API 장애에 대한 별도 fallback은 구현하거나 테스트하지 않았습니다.'
        },
        {
          id: 'api-request',
          laneId: 'user',
          row: 8,
          shape: 'process',
          label: '인증 API 요청',
          description: '사용자가 발급받은 토큰으로 서비스 기능을 요청합니다.'
        },
        {
          id: 'verify-token',
          laneId: 'service',
          row: 9,
          shape: 'decision',
          label: 'Access Token 검증',
          description: '캐시한 키로 토큰을 로컬 검증하고 user_tokens에서 UUID를 복원합니다.'
        },
        {
          id: 'refresh-token',
          laneId: 'account',
          row: 10,
          shape: 'process',
          label: 'Refresh Token 검증',
          description: 'Access Token이 만료되면 중앙 회원 서버가 Refresh Token을 검증하고 새 토큰을 발급합니다.'
        },
        {
          id: 'update-token',
          laneId: 'database',
          row: 11,
          shape: 'process',
          label: '로컬 토큰 갱신',
          description: '새 Access Token과 만료 정보를 서비스 DB에 반영합니다.'
        },
        {
          id: 'domain-response',
          laneId: 'database',
          row: 12,
          shape: 'end',
          label: '도메인 데이터 응답',
          description: 'UUID를 기준으로 서비스 데이터를 조회해 응답합니다.'
        }
      ],
      edges: [
        {
          id: 'start-request-provider',
          from: 'service-start',
          to: 'request-provider',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'request-provider-return',
          from: 'request-provider',
          to: 'provider-return',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'provider-return-cache',
          from: 'provider-return',
          to: 'cache-provider',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'provider-cache-fallback',
          from: 'provider-return',
          to: 'cache-provider',
          kind: 'exception',
          outcome: 'recover',
          fromAnchor: 'right',
          toAnchor: 'right',
          label: 'Provider 키 조회 실패'
        },
        {
          id: 'cache-user-login',
          from: 'cache-provider',
          to: 'user-login',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'user-forward-login',
          from: 'user-login',
          to: 'forward-login',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'forward-issue-token',
          from: 'forward-login',
          to: 'issue-token',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'issue-persist-session',
          from: 'issue-token',
          to: 'persist-session',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'login-api-stop',
          from: 'issue-token',
          to: 'login-stop',
          kind: 'exception',
          outcome: 'stop',
          fromAnchor: 'right',
          toAnchor: 'top',
          label: '로그인 API 응답 없음'
        },
        {
          id: 'persist-api-request',
          from: 'persist-session',
          to: 'api-request',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'api-verify-token',
          from: 'api-request',
          to: 'verify-token',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'verify-domain-response',
          from: 'verify-token',
          to: 'domain-response',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          label: 'Access Token 유효'
        },
        {
          id: 'verify-refresh-token',
          from: 'verify-token',
          to: 'refresh-token',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          label: '만료 + Refresh Token 있음'
        },
        {
          id: 'refresh-update-token',
          from: 'refresh-token',
          to: 'update-token',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'update-domain-response',
          from: 'update-token',
          to: 'domain-response',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        }
      ],
      exceptions: [
        {
          id: 'provider-key-cache-fallback',
          trigger: '중앙 회원 서버에서 Provider 키를 가져오는 요청이 실패했습니다.',
          response: '서비스가 마지막으로 저장한 JSON 캐시를 읽어 토큰 검증에 사용할 키를 준비합니다.',
          edgeIds: ['provider-cache-fallback']
        },
        {
          id: 'login-api-unavailable',
          trigger: '중앙 회원 서버의 로그인 API가 응답하지 않습니다.',
          response: '신규 로그인 fallback은 구현하거나 테스트하지 않았으므로 흐름이 중단됩니다.',
          edgeIds: ['login-api-stop']
        }
      ],
      archify: {
        url: '/diagrams/integrated-sso-server/central-account-auth-flow.html'
      }
    }
  ],
  implementation: `### 중앙 회원 원본과 Provider 경계

중앙 회원 서버가 ID·비밀번호·UUID의 원본을 관리합니다. 서비스 서버는 Provider 식별자와 API 인증값을 포함해 회원가입·로그인 요청을 전달하고, 중앙 서버는 등록된 Provider와 허용 서버를 확인한 뒤 요청을 처리합니다.

중앙 회원 서버가 Access Token과 Refresh Token을 발급하고 UUID를 회원정보로 반환합니다. 2024년 초기 토큰에 어떤 회원 식별자가 포함됐는지는 코드를 확인하지 못했으므로 공개 사실로 단정하지 않습니다.

### 서비스 로컬 검증과 UUID 연결

HiPass는 로그인 응답의 UUID·로그인 ID·Access Token·Refresh Token과 만료 정보를 로컬 \`user_tokens\` 테이블에 저장합니다. 이후 Access Token은 Provider 키로 로컬 검증하고, \`user_tokens\`에서 로그인 ID에 대응하는 UUID를 복원해 서비스 도메인 데이터를 조회합니다.

Access Token 재발급은 Refresh Token을 중앙 회원 서버에 보내 처리합니다. 서비스 DB의 \`user_tokens\` 레코드를 직접 제거한 뒤 해당 사용자가 재로그인을 요구받는 것도 확인했습니다. 중앙에서 모든 서비스의 세션을 한 번에 종료하는 기능은 구상했지만 구현하지 않았습니다.

### 키 캐시와 운영 조회

서비스는 중앙 회원 서버의 Provider 정보를 JSON 파일에 캐시합니다. 주기적 갱신이나 서비스 시작 시 통신에 실패하면 마지막 파일을 사용해 키 조회 실패가 즉시 토큰 검증 중단으로 이어지지 않게 했습니다. 이 fallback은 로그인 API 장애까지 해결하지 않습니다.

UUID만으로 관리자 목록과 장애 로그를 추적하기 어려워 서비스에는 로그인 ID를 함께 저장했습니다. 이후 중앙 회원 서버에 UUID 배열을 한 번에 조회하는 Batch API를 추가하고, 관리자 목록에서 여러 회원의 로그인 ID를 한 번에 가져오도록 보완했습니다.

### Express에서 NestJS로 확장

2024년 Express 기반으로 시작했고 2025년 4월 NestJS로 전환했습니다. 이어 Prisma 전환과 회원 조회·변경, 관리자 기능을 확장했습니다. Module·Provider·DI, Middleware·Guard·Decorator, DTO 검증과 예외 처리 기준은 이후 다른 사내 백엔드 프로젝트에도 재사용했고, \`nestjs-expert\` 스킬을 구성할 때 참고한 실무 근거 중 하나가 됐습니다.

### 더 깊이 읽기

- [UUID Soft FK만으로는 부족했다: 분리된 회원 데이터의 조회 경계](/insights/sso-authentication-and-soft-fk)`,
  outcomes: `중앙 회원 관리 구조를 운영 서비스 하나에 적용했고 현재도 유지보수하고 있습니다. 회원가입·로그인, 중앙 토큰 발급, 서비스의 로컬 검증, Refresh Token 갱신, UUID 기반 서비스 데이터 연결과 로컬 토큰 레코드 제거 후 재로그인 요구를 확인했습니다.

Git 이력에서는 2025년 4월 NestJS 전환, 5월 Prisma 전환과 회원 조회·변경 API, 6월 관리자 대리 로그인 기능 확장이 확인됩니다.

인증 장애 감소율이나 성능 개선 수치는 측정하지 않았고 여러 서비스를 통합한 결과도 아닙니다. 중앙 로그인 API 장애와 다중 서비스 세션 통제 역시 검증된 성과에 포함하지 않습니다.`,
  retrospective: `이 프로젝트를 통해 공통 회원 원본 관리와 Single Sign-On은 별개의 요구사항이라는 점을 구분하게 됐습니다. 사용자 집단과 로그인 경험을 실제로 공유해야 할 때만 SSO를 확장하고, 그렇지 않다면 중앙 회원 원본과 서비스별 인증·권한 경계를 명확히 하는 편이 적합합니다.

Provider 키 조회 실패에는 파일 캐시 fallback을 두었지만 로그인 API 장애에는 대응하지 못했습니다. 지금 다시 설계한다면 로그인 API의 가용성 요구와 장애 시 사용자 경험을 먼저 정의하고, 재시도·이중화 또는 제한된 장애 대응 범위를 직접 테스트하겠습니다.

UUID로 시스템 관계를 잇는 것과 운영자가 회원을 추적할 읽기 모델을 만드는 것도 별개의 문제였습니다. 원본 데이터, 서비스 도메인 데이터와 운영 조회용 복제 값의 책임을 처음부터 구분해야 한다는 판단이 남았습니다.`
};
