import type { FeatureDetailDto } from '../types/feature-detail.dto';

export const HOTEL_RESERVATION_PLATFORM_DETAIL: FeatureDetailDto = {
  role: `2024년 11월부터 2025년 10월까지 FE 2명(본인 포함), BE 1명과 협업했습니다. 저는 서버·코드 Config를 중심으로 한 플랫폼 구조와 예약 상태 구조, NICEPAY 모바일 결제 복귀 흐름의 설계와 주요 구현을 주도했습니다. 다른 프론트엔드 개발자와 화면 구현을 나누고 백엔드 개발자와 API 계약을 맞췄습니다.

2026년 6월부터 8월까지는 호텔별 운영 브랜치에 나뉘어 있던 코드를 하나의 기준 소스로 리빌딩했습니다. 공통 동작을 맡는 \`core\`와 호텔별 확장을 맡는 \`platform\`의 경계를 설계하고, 기존 운영 코드를 새 구조로 옮기는 주요 마이그레이션을 수행했습니다.`,
  highlights: [
    {
      id: 'production-platforms',
      label: '운영 적용 플랫폼',
      value: '5개',
      kind: 'reported',
      asOf: '2026-08',
      evidence: '2026년 리빌딩 구조를 5개 호텔 예약 플랫폼에 적용해 운영했다는 인터뷰 확인값입니다.',
      caveat: '저장소의 platform 디렉터리는 구조를 보조할 뿐 실제 운영 상태를 단독으로 증명하지는 않습니다.'
    },
    {
      id: 'canonical-source',
      label: '기준 소스',
      value: '1개',
      kind: 'measured',
      asOf: '2026-08',
      evidence: '읽기 전용 저장소에서 하나의 core와 5개 platform 확장이 한 기준 코드에 놓인 구조를 직접 확인했습니다.',
      caveat: '기준 소스가 하나라는 뜻이며, 플랫폼별 빌드와 배포 단위까지 하나라는 의미는 아닙니다.'
    },
    {
      id: 'parity-detection',
      label: '패리티 누락 발견',
      value: '운영 배포 전',
      kind: 'reported',
      asOf: '2026-08',
      evidence:
        '개발·통합 검증 중 이전 기준점 이후의 운영 변경 누락을 발견하고 배포 전에 보완했다는 인터뷰 확인값입니다.',
      caveat: '내부 감사 건수나 개선율을 공개하는 지표가 아니며, 운영 장애가 발생하지 않았다는 일반 보장도 아닙니다.'
    }
  ],
  problem: `최초 구조의 문제는 호텔마다 별도 코드베이스를 둔 것이 아니라, 하나의 공통 코드베이스에 호텔별 조건 분기가 계속 쌓이는 데 있었습니다. 1차 구축에서는 서버 설정, 코드 Config, 환경변수와 배포 브랜치를 이용해 값과 기능 차이를 설정 쪽으로 옮겼습니다.

하지만 5개 호텔 운영 브랜치가 각자 배포되면서 공통 수정도 브랜치마다 반복해야 했고, 시간이 지나면 같은 기능의 코드가 서로 달라질 수 있었습니다. 예약 화면에서는 여러 단계를 지나며 중간 컴포넌트가 사용하지 않는 예약 상태와 setter를 계속 전달하는 Props Drilling도 있었습니다. 모바일 NICEPAY는 외부 결제 화면으로 이동하고 페이지가 다시 로드되므로 메모리에 있던 입력 상태를 그대로 유지할 수 없었습니다.`,
  constraints: `호텔 예약의 공통 사용자 흐름은 공유해야 했지만 호텔별 정책, 화면과 외부 연동 차이는 계속 수용해야 했습니다. 2026년 리빌딩 뒤에도 플랫폼별 빌드와 호텔별 운영 폴더 배포 방식은 유지했습니다. 런타임에 하나의 앱이 모든 호텔을 전환하는 구조가 아니었습니다.

마이그레이션은 실제 운영 브랜치의 동작을 보존해야 했습니다. 공개 자료에는 고객 정보, 인증 정보와 시크릿, 실제 요청 값, 비공개 소스·로그 및 내부 감사 수치를 포함하지 않습니다.`,
  alternatives: `1차 구축에서는 계속 늘어나는 조건 분기를 컴포넌트 안에 두는 대신, 서버 설정과 코드 Config에서 값을 읽어 공통 화면이 동작하도록 바꿨습니다. 이 방식은 값 차이를 줄이는 데 유효했지만 브랜치별 코드 편차까지 없애지는 못했습니다.

예약 상태는 Redux 도입도 검토했습니다. 다만 예약 흐름 안에서만 함께 사용하는 상태였고 기존 코드의 전환 비용을 고려해 예약 라우터 범위의 Context를 선택했습니다. NICEPAY 복귀 상태는 브라우저에 임시 보존하되 최종 결과는 예약번호로 서버에서 다시 조회하는 경계를 택했습니다.`,
  swimlanes: [
    {
      id: 'platform-change-verification-deployment',
      title: '플랫폼 변경·검증·배포 흐름',
      purpose:
        '변경의 성격에 따라 코드를 배치하고 플랫폼별로 검증·배포하며, 패리티 누락을 발견했을 때 운영 기준을 복구한 흐름을 보여줍니다.',
      summary:
        '모든 플랫폼의 공통 동작은 core, 값 차이는 rsConfig, 화면·로직 차이는 platform에 둡니다. 플랫폼별 빌드와 계약·동작 검증을 거쳐 호텔별 운영 폴더에 배포하며, 누락을 발견하면 운영 브랜치를 감사하고 수동 이식한 뒤 다시 검증합니다.',
      lanes: [
        { id: 'requirement', label: '요구사항' },
        { id: 'core', label: '기준 코드' },
        { id: 'platform', label: '플랫폼 확장' },
        { id: 'delivery', label: '검증·배포' }
      ],
      steps: [
        {
          id: 'request-change',
          laneId: 'requirement',
          row: 0,
          shape: 'start',
          label: '변경 요청',
          description: '호텔 예약 플랫폼의 기능 또는 정책 변경을 접수합니다.'
        },
        {
          id: 'classify-difference',
          laneId: 'requirement',
          row: 1,
          shape: 'decision',
          label: '차이 분류',
          description: '변경이 공통 동작인지, 값 차이인지, 화면·로직 차이인지 판단합니다.'
        },
        {
          id: 'place-core',
          laneId: 'core',
          row: 2,
          shape: 'process',
          label: 'core에 공통 동작 배치',
          description: '모든 플랫폼이 같은 방식으로 수행하는 동작을 기준 코드에 둡니다.'
        },
        {
          id: 'place-rsconfig',
          laneId: 'platform',
          row: 3,
          shape: 'process',
          label: 'rsConfig에 값 배치',
          description: '동작은 같고 플랫폼마다 값만 다른 설정을 rsConfig에 둡니다.'
        },
        {
          id: 'delegate-platform',
          laneId: 'platform',
          row: 4,
          shape: 'process',
          label: 'platform에 화면·로직 배치',
          description: '플랫폼 고유 화면이나 로직을 platform 확장 구현에 둡니다.'
        },
        {
          id: 'build-platforms',
          laneId: 'delivery',
          row: 5,
          shape: 'process',
          label: '플랫폼별 빌드',
          description: 'build-time alias로 대상을 선택해 각 플랫폼 산출물을 만듭니다.'
        },
        {
          id: 'verify-platforms',
          laneId: 'delivery',
          row: 6,
          shape: 'decision',
          label: '계약·동작 검증',
          description: 'alias, platform 경로 계약과 주요 예약 흐름의 동작 패리티를 확인합니다.'
        },
        {
          id: 'deploy-platforms',
          laneId: 'delivery',
          row: 7,
          shape: 'end',
          label: '호텔별 운영 폴더 배포',
          description: '검증을 통과한 산출물을 운영 서버의 호텔별 프로젝트 폴더에 배포합니다.'
        },
        {
          id: 'audit-operational-delta',
          laneId: 'requirement',
          row: 7,
          shape: 'process',
          label: '운영 브랜치 감사',
          description: '기준점 이후 운영 브랜치에 반영된 변경의 의도와 범위를 비교합니다.'
        },
        {
          id: 'port-missing-delta',
          laneId: 'core',
          row: 8,
          shape: 'process',
          label: 'core·platform 수동 이식',
          description: '누락된 운영 변경을 성격에 맞는 경계로 수동 이식합니다.'
        }
      ],
      edges: [
        {
          id: 'request-classify',
          from: 'request-change',
          to: 'classify-difference',
          kind: 'normal',
          outcome: 'continue'
        },
        {
          id: 'classify-core',
          from: 'classify-difference',
          to: 'place-core',
          kind: 'normal',
          outcome: 'continue',
          label: '모든 플랫폼 공통'
        },
        {
          id: 'classify-rsconfig',
          from: 'classify-difference',
          to: 'place-rsconfig',
          kind: 'normal',
          outcome: 'continue',
          label: '값만 다름'
        },
        {
          id: 'classify-platform',
          from: 'classify-difference',
          to: 'delegate-platform',
          kind: 'normal',
          outcome: 'continue',
          label: '화면·로직 차이'
        },
        { id: 'core-build', from: 'place-core', to: 'build-platforms', kind: 'normal', outcome: 'continue' },
        { id: 'rsconfig-build', from: 'place-rsconfig', to: 'build-platforms', kind: 'normal', outcome: 'continue' },
        { id: 'platform-build', from: 'delegate-platform', to: 'build-platforms', kind: 'normal', outcome: 'continue' },
        { id: 'build-verify', from: 'build-platforms', to: 'verify-platforms', kind: 'normal', outcome: 'continue' },
        {
          id: 'verify-deploy',
          from: 'verify-platforms',
          to: 'deploy-platforms',
          kind: 'normal',
          outcome: 'continue',
          label: '검증 통과'
        },
        {
          id: 'verify-audit',
          from: 'verify-platforms',
          to: 'audit-operational-delta',
          kind: 'exception',
          outcome: 'recover',
          label: '패리티 누락'
        },
        {
          id: 'audit-port',
          from: 'audit-operational-delta',
          to: 'port-missing-delta',
          kind: 'normal',
          outcome: 'continue'
        },
        {
          id: 'port-reverify',
          from: 'port-missing-delta',
          to: 'verify-platforms',
          kind: 'exception',
          outcome: 'recover',
          label: '수동 이식 후 재검증'
        }
      ],
      exceptions: [
        {
          id: 'restore-operational-parity',
          trigger: '통합 구조의 개발·검증 중 이전 기준점 이후 운영 변경이 빠진 것을 발견했습니다.',
          response:
            '운영 브랜치와 commit·파일 차이를 감사하고 변경 의도를 확인한 뒤 core 또는 platform에 수동 이식해 다시 검증했습니다.',
          edgeIds: ['verify-audit', 'port-reverify']
        }
      ],
      archify: {
        url: '/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html'
      }
    }
  ],
  implementation: `1차 구축에서는 초기 로딩 때 서버 설정을 받아 Config Context에 주입하고, 코드 Config와 환경변수 및 호텔별 배포 브랜치를 함께 사용했습니다. 2026년 리빌딩에서는 공통 동작을 \`core\`, 값 차이를 \`rsConfig\`, 화면·로직 차이를 \`platform\`에 배치했습니다. build-time alias가 대상 platform 구현을 선택하며 각 플랫폼은 따로 빌드해 호텔별 운영 폴더에 배포했습니다. 자세한 배치 판단은 [Config 이후의 경계: 멀티플랫폼 React를 core·rsConfig·platform으로 나눈 이유](/insights/config-driven-architecture-react)에서 다룹니다.

예약 단계에서는 예약 라우터에 \`ReservationProvider\`를 두고 하위 화면이 \`useReservation\`으로 상태를 소비하게 해 중간 컴포넌트의 Props Drilling을 줄였습니다. Provider가 예약 흐름과 함께 마운트·해제되는 생명주기 경계를 만들었지만 상태 접근 권한이나 렌더링 성능을 자동으로 보장하는 장치는 아닙니다. 이 판단은 [Props Drilling을 줄이기 위해 예약 Context의 생명주기를 라우터에 둔 이유](/insights/context-api-encapsulation-and-router-level-isolation)에서 분리해 설명합니다.

NICEPAY 모바일 결제 이동 전 입력 상태는 \`sessionStorage\`에 1시간 만료 기준으로 저장했습니다. 결제 화면에서 돌아온 뒤에는 저장된 입력을 복원하고 예약번호로 최종 예약 결과를 서버에서 조회했습니다. 그 이후의 결제 보상 단계는 이 작업의 확인 범위에 포함하지 않습니다.`,
  outcomes: `2026년 8월 기준 새 구조는 5개 호텔 예약 플랫폼에 적용되어 운영됐습니다. 공통 변경은 하나의 기준 소스인 core에서 한 번 수정하고, 값 또는 화면·로직 차이는 rsConfig와 platform에 격리할 수 있게 됐습니다. 배포 산출물은 계속 플랫폼별로 만들고 각 호텔 운영 폴더에 배포했습니다.

초기 마이그레이션은 과거 기준점에서 시작해 이후 운영 변경 일부가 빠졌지만 개발·통합 검증 중 운영 배포 전에 발견했습니다. commit과 파일 차이를 확인하고 필요한 코드를 수동 이식한 뒤 5개 플랫폼 빌드, alias·경로 계약과 주요 동작을 다시 확인했습니다. 이후에는 공통 변경을 확인하려고 최신 호텔 브랜치들을 다시 기준 소스로 비교할 필요가 없는 구조로 전환했습니다. 개발·배포 시간이나 오류 감소율은 측정하지 않았습니다.`,
  retrospective: `마이그레이션에서 가장 먼저 고정했어야 할 것은 새 디렉터리 구조가 아니라 최신 운영 동작의 기준선이었습니다. 다시 진행한다면 5개 운영 브랜치의 차이와 변경 의도를 먼저 목록화하고, 승인된 기준선을 만든 뒤 구조 변경을 시작하겠습니다.

platform이 화면 전체 구현을 위임할 수 있는 경계는 예외를 수용하기 쉽지만 공통 변경이 빠질 위험도 큽니다. 값 차이와 작은 행동 차이는 더 좁은 contract로 만들고, 전체 구현 위임은 실제로 필요한 부분에만 남기는 방향이 적합합니다. 빌드 성공과 경로 확인만으로는 행동 패리티를 증명할 수 없으므로 공통 계약 테스트와 호텔별 핵심 예약 흐름 테스트를 함께 두는 것이 다음 개선점입니다.`
};
