import type { FeatureDetailDto } from '../types/feature-detail.dto';

export const CODI_HARNESS_DX_PLATFORM_DETAIL: FeatureDetailDto = {
  role: `하네스 아키텍처와 파일 소유권 정책, 프로젝트 초기화·진단과 AI 작업 규칙 자동화, CI/CD·시크릿 구조와 실제 프로젝트 적용·운영 검증을 단독으로 설계하고 구현했습니다. 팀원 3명의 사용 피드백과 실제 프로젝트의 배포·규칙 회귀를 바탕으로 공통 정책, CLI와 진단 체계를 반복 개선했습니다.`,
  highlights: [
    {
      id: 'adopted-projects',
      label: '적용 프로젝트',
      value: '11개',
      kind: 'reported',
      asOf: '2026-08-20',
      evidence: '하네스 적용 저장소 현황과 사용자 인터뷰에서 확인한 누적 범위'
    },
    {
      id: 'production-projects',
      label: '실제 운영 프로젝트',
      value: '8개',
      kind: 'reported',
      asOf: '2026-08-20',
      evidence: '적용 프로젝트 중 운영 환경에서 사용 중인 프로젝트 현황'
    },
    {
      id: 'team-users',
      label: '팀 사용자',
      value: '3명',
      kind: 'reported',
      asOf: '2026-08-20',
      evidence: '실제 하네스를 사용하고 피드백을 제공한 팀원 수'
    },
    {
      id: 'jenkins-compute-estimate',
      label: 'Jenkins 컴퓨팅 비용 추정',
      value: '$151.84/월',
      kind: 'estimated',
      asOf: '2026-08-20',
      evidence: 'AWS 서울 리전 Linux On-Demand t3.large 2대 × 월 730시간 공개 가격 기준',
      caveat:
        '현재 공개 가격으로 다시 산정한 컴퓨팅 비용이며 과거 실제 청구액이 아닙니다. 스토리지, 네트워크, 세금 등 컴퓨팅 외 비용은 포함하지 않습니다.'
    },
    {
      id: 'hotel-deployment-time',
      label: '5개 호텔 배포 시간',
      value: '약 15분 → 약 3분',
      kind: 'measured',
      asOf: '2026-08-20',
      evidence: '기존 순차 배포와 변경 범위 기반 병렬 matrix의 실행 화면 시간 비교'
    },
    {
      id: 'environment-mix-recurrence',
      label: '동일 유형 환경 혼입 재발',
      value: '전환 후 미발생',
      kind: 'reported',
      asOf: '2026-08-20',
      evidence: 'Infisical 환경과 workflow 조회 경계를 분리한 뒤 운영 관찰 결과',
      caveat: '원인 전체를 Jenkins로 단정하거나 향후 발생 가능성이 0이라고 주장하지 않습니다.'
    }
  ],
  problem: `프로젝트가 추가될 때마다 저장소 구조, CI/CD workflow, 브랜치·환경 매핑과 시크릿 경로를 다시 설정해야 했습니다. 팀원과 AI 에이전트에 따라 spec 문서화, TDD, 담당 코드 영역, 스킬 선택과 위험 명령 기준도 달라졌습니다. 여러 호텔을 같은 Jenkins 대기열에서 배포할 때는 다른 호텔의 환경변수가 섞이는 문제까지 발생해, 환경과 배포 대상을 실행 단위에서 분리해야 했습니다.`,
  constraints: `사내 하네스 원본, 고객 코드와 시크릿은 공개할 수 없었습니다. Claude Code와 Codex는 서로 다른 진입 파일, rule 형식과 hook payload를 사용하므로 같은 정책 문구를 복사하는 것만으로 같은 집행 결과를 보장할 수 없었습니다. 또한 하네스 업데이트는 앱 코드, 프로젝트 설정과 진행 중 작업처럼 다운스트림이 소유한 파일을 덮어써서는 안 됐습니다.`,
  alternatives: `Jenkins 설정을 정리해 유지하는 안, GitHub Actions workflow를 프로젝트마다 복사하는 안, 공통 정책·CLI·검증 게이트를 포함한 하네스를 만드는 안을 비교했습니다.

Jenkins 유지안을 기각한 이유는 서버 비용보다 운영 조건에 있었습니다. Jenkins 업데이트와 서버를 **관리할 담당자**가 없어 최초 설정 이후 플러그인과 버전이 방치돼 있었고, 최초 **설계자**가 떠난 뒤 그 공백을 메울 사람도 없었습니다. 환경변수를 등록한 뒤 등록된 값을 다시 **확인하기까지**의 절차도 복잡해, 배포가 어긋났을 때 설정 문제인지 스크립트 문제인지 분리하는 데 시간이 들었습니다. 비용을 감수하더라도 아무도 손댈 수 없는 시스템은 유지 자체가 위험이라고 판단했습니다.

workflow 복사안은 v1에서 이미 겪은 버전 드리프트와 수동 업데이트 전파를 반복합니다. 초기 도입 속도보다 프로젝트가 늘어나도 같은 기준을 안전하게 반복할 수 있는지를 선택 기준으로 두고 하네스 구조를 채택했습니다.`,
  swimlanes: [
    {
      id: 'design-development-verification',
      title: '설계·개발·검증',
      purpose: '사용자 의견이 승인된 계획과 테스트 우선 구현을 거쳐 검증 가능한 결과가 되는 흐름을 보여줍니다.',
      summary:
        '요청·맥락 전달에서 시작해 문제 정의, 명세·계획, 승인, 테스트·구현, 리뷰·검증 순서로 진행하며 검증을 통과하면 완료합니다.',
      lanes: [
        { id: 'user', label: '사용자' },
        { id: 'agent', label: 'AI 에이전트' },
        { id: 'delivery', label: '계획·구현' },
        { id: 'verification', label: '리뷰·검증' }
      ],
      steps: [
        {
          id: 'request',
          laneId: 'user',
          row: 0,
          shape: 'start',
          label: '요청·맥락 전달',
          description: '문제, 공개 범위와 기대 결과를 전달합니다.'
        },
        {
          id: 'define',
          laneId: 'agent',
          row: 1,
          shape: 'process',
          label: '문제 정의',
          description: '전달받은 맥락에서 문제와 모호한 요구를 정리합니다.'
        },
        {
          id: 'plan',
          laneId: 'delivery',
          row: 2,
          shape: 'process',
          label: '명세·계획',
          description: '정의한 문제의 결정, 계약, 테스트와 작업 순서를 명세와 계획에 기록합니다.'
        },
        {
          id: 'approve',
          laneId: 'user',
          row: 3,
          shape: 'decision',
          label: '승인',
          description: '구현 범위와 판단 기준을 사용자가 승인합니다.'
        },
        {
          id: 'implement',
          laneId: 'delivery',
          row: 4,
          shape: 'process',
          label: '테스트·구현',
          description: '행동 변경을 증명할 실패 테스트를 먼저 실행하고 승인된 범위를 구현합니다.'
        },
        {
          id: 'verify',
          laneId: 'verification',
          row: 5,
          shape: 'decision',
          label: '리뷰·검증',
          description: '명세 일치, 회귀, 타입, 테스트, 빌드와 사용자 흐름 증거를 확인합니다.'
        },
        {
          id: 'complete',
          laneId: 'verification',
          row: 6,
          shape: 'end',
          label: '완료',
          description: '리뷰와 검증을 통과한 결과로 작업을 완료합니다.'
        }
      ],
      edges: [
        {
          id: 'request-define',
          from: 'request',
          to: 'define',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: [
            { column: 0, row: 0.5 },
            { column: 1, row: 0.5 }
          ]
        },
        {
          id: 'define-plan',
          from: 'define',
          to: 'plan',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: [
            { column: 1, row: 1.5 },
            { column: 2, row: 1.5 }
          ]
        },
        {
          id: 'plan-approve',
          from: 'plan',
          to: 'approve',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: [
            { column: 2, row: 2.5 },
            { column: 0, row: 2.5 }
          ]
        },
        {
          id: 'approve-implement',
          from: 'approve',
          to: 'implement',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          label: '승인',
          waypoints: [
            { column: 0, row: 3.5 },
            { column: 2, row: 3.5 }
          ]
        },
        {
          id: 'implement-verify',
          from: 'implement',
          to: 'verify',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: [
            { column: 2, row: 4.5 },
            { column: 3, row: 4.5 }
          ]
        },
        {
          id: 'verify-complete',
          from: 'verify',
          to: 'complete',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          label: '통과'
        },
        {
          id: 'ambiguity-return',
          from: 'define',
          to: 'request',
          kind: 'exception',
          outcome: 'recover',
          fromAnchor: 'left',
          toAnchor: 'left',
          label: '요구 보강',
          waypoints: [
            { column: -0.4, row: 1 },
            { column: -0.4, row: 0 }
          ]
        },
        {
          id: 'approval-return',
          from: 'approve',
          to: 'plan',
          kind: 'exception',
          outcome: 'recover',
          fromAnchor: 'left',
          toAnchor: 'left',
          label: '미승인',
          waypoints: [
            { column: -0.4, row: 3 },
            { column: -0.4, row: 2 }
          ]
        },
        {
          id: 'verification-return',
          from: 'verify',
          to: 'implement',
          kind: 'exception',
          outcome: 'recover',
          fromAnchor: 'left',
          toAnchor: 'right',
          label: '실패',
          waypoints: [
            { column: 2.7, row: 5 },
            { column: 2.7, row: 4 }
          ]
        }
      ],
      exceptions: [
        {
          id: 'ambiguous-requirement',
          trigger: '요구가 모호함',
          response: '사용자에게 추가 질문한 뒤 문제 정의를 다시 진행합니다.',
          edgeIds: ['ambiguity-return']
        },
        {
          id: 'unapproved-plan',
          trigger: '계획이 승인되지 않음',
          response: '명세와 계획을 보강한 뒤 다시 승인을 요청합니다.',
          edgeIds: ['approval-return']
        },
        {
          id: 'failed-verification',
          trigger: '검증 실패',
          response: '테스트·구현 단계로 돌아가 수정한 뒤 다시 검증합니다.',
          edgeIds: ['verification-return']
        }
      ],
      archify: {
        url: '/diagrams/codi-harness-dx-platform/design-development-verification.html'
      }
    },
    {
      id: 'cicd-secrets-deployment',
      title: 'CI/CD·시크릿·배포',
      purpose: '코드 변경이 품질 게이트, 환경 선택, 시크릿 주입과 대상 계산을 거쳐 배포되는 책임 경계를 보여줍니다.',
      summary: '변경 감지에서 시작해 품질 검사, 환경·대상 결정, 시크릿 조회, 병렬 배포, 결과 확인 순서로 진행합니다.',
      lanes: [
        { id: 'repository', label: 'GitHub 저장소' },
        { id: 'actions', label: 'GitHub Actions' },
        { id: 'infisical', label: 'Infisical' },
        { id: 'deployment', label: '배포 대상' }
      ],
      steps: [
        {
          id: 'detect',
          laneId: 'repository',
          row: 0,
          shape: 'start',
          label: '변경 감지',
          description: '브랜치와 변경 파일을 기준으로 workflow를 시작합니다.'
        },
        {
          id: 'quality',
          laneId: 'actions',
          row: 1,
          shape: 'decision',
          label: '품질 검사',
          description: '타입, 테스트, 빌드와 보안 검사를 실행합니다.'
        },
        {
          id: 'target',
          laneId: 'actions',
          row: 2,
          shape: 'process',
          label: '환경·대상 결정',
          description: '브랜치와 플랫폼 설정으로 환경과 배포 대상을 결정합니다.'
        },
        {
          id: 'secrets',
          laneId: 'infisical',
          row: 3,
          shape: 'decision',
          label: '시크릿 조회',
          description: '선택된 환경의 시크릿을 Infisical에서 명시적으로 조회합니다.'
        },
        {
          id: 'deploy',
          laneId: 'deployment',
          row: 4,
          shape: 'process',
          label: '병렬 배포',
          description: '검증된 대상만 선택한 환경에 병렬 배포합니다.'
        },
        {
          id: 'confirm',
          laneId: 'deployment',
          row: 5,
          shape: 'end',
          label: '결과 확인',
          description: '실행 결과와 대상별 완료 상태를 확인합니다.'
        },
        {
          id: 'stopped',
          laneId: 'repository',
          row: 3,
          shape: 'stop',
          label: '배포 중단',
          description: '실패 원인이 해소될 때까지 시크릿 조회와 배포를 실행하지 않습니다.'
        }
      ],
      edges: [
        {
          id: 'detect-quality',
          from: 'detect',
          to: 'quality',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'quality-target',
          from: 'quality',
          to: 'target',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          label: '통과'
        },
        {
          id: 'target-secrets',
          from: 'target',
          to: 'secrets',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'secrets-deploy',
          from: 'secrets',
          to: 'deploy',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          label: '일치'
        },
        {
          id: 'deploy-confirm',
          from: 'deploy',
          to: 'confirm',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'quality-stop',
          from: 'quality',
          to: 'stopped',
          kind: 'exception',
          outcome: 'stop',
          fromAnchor: 'left',
          toAnchor: 'right',
          label: '실패'
        },
        {
          id: 'secrets-stop',
          from: 'secrets',
          to: 'stopped',
          kind: 'exception',
          outcome: 'stop',
          fromAnchor: 'left',
          toAnchor: 'bottom',
          label: '불일치'
        },
        {
          id: 'stopped-retry',
          from: 'stopped',
          to: 'detect',
          kind: 'exception',
          outcome: 'recover',
          fromAnchor: 'left',
          toAnchor: 'left',
          label: '원인 수정 후 처음부터 재실행',
          waypoints: [
            { column: -0.4, row: 3 },
            { column: -0.4, row: 0 }
          ]
        }
      ],
      exceptions: [
        {
          id: 'failed-quality-check',
          trigger: '품질 검사 실패',
          response: '시크릿 조회와 배포를 시작하지 않습니다.',
          edgeIds: ['quality-stop', 'stopped-retry']
        },
        {
          id: 'environment-secret-mismatch',
          trigger: '환경·시크릿 불일치',
          response: '배포를 중단하고 설정을 수정한 뒤 workflow를 처음부터 다시 실행합니다.',
          edgeIds: ['secrets-stop', 'stopped-retry']
        }
      ],
      archify: {
        url: '/diagrams/codi-harness-dx-platform/cicd-secrets-deployment.html'
      }
    }
  ],
  implementation: `### \`./harness\`와 \`doctor\`

프로젝트가 생길 때마다 저장소 생성, profile 선택, front/back 통합, Infisical 연결, workflow placeholder, 브랜치와 환경 매핑을 사람이 확인하면 문서가 있어도 실행 순서와 결과가 달라질 수 있습니다. 그래서 \`./harness\`를 신규 프로젝트 생성과 기존 프로젝트 수신의 단일 진입점으로 만들고, 선택한 profile을 파일·경로·패키지 매니저 정책에 반영했습니다.

초기화 명령이 성공했다고 현재 상태가 올바르다고 단정하지 않았습니다. \`./harness doctor\`가 계약과 실제 상태의 차이를 진단합니다. CLI는 원하는 상태를 만들고 doctor는 다시 검증하는 책임 분리입니다.

doctor를 만들면서 가장 신경 쓴 것은 파일이 다 있는데도 아무것도 작동하지 않는 상태였습니다. 하네스의 guard 훅은 \`mise\`로 실행되는데, \`mise.toml\`에 문법 오류가 나면 훅 실행이 실패합니다. 그런데 훅 인프라 실패는 작업을 막지 않는 정책이라 **조용히** 넘어갑니다. 결과적으로 룰 파일도 훅 스크립트도 전부 제자리에 있지만 guardrail은 하나도 걸리지 않는 상태가 됩니다. 그래서 존재만 확인하는 대신 \`mise\`를 실제로 실행해 **파싱**되는지 보고, 설정 JSON들도 읽어서 파싱까지 시도합니다. 설정 파일에 쉼표 하나가 잘못 찍혀도 훅 설정이 통째로 무시되기 때문입니다.

판정 심각도는 프로젝트 상태에 따라 다르게 잡았습니다. 예를 들어 계획 헌법이 템플릿 그대로면, 기능이 이미 진행 중인 프로젝트에서는 검증 게이트가 무력화된 상태라 경고하지만 첫 기능 전이라면 정상 초기 상태이므로 안내만 합니다. 새로 만든 프로젝트가 경고를 쏟아내면 도구를 아무도 보지 않게 되기 때문입니다.

자동 복구는 최소한으로 뒀습니다. 데이터 손실 위험이 없는 빈 디렉터리 생성 한 곳만 자동이고 그것도 경고로 알립니다. 나머지는 무엇이 어긋났는지 보고하고 실행할 명령을 안내할 뿐 직접 고치지 않습니다. update가 로컬 변경을 덮어쓰지 않는 것과 같은 이유로 **진단과 수정을 분리**했습니다.

### \`harness.lock\`과 소유권 경계

v1은 공통 정책과 skill을 프로젝트마다 복사했습니다. 약 2개월 실사용해 보니 같은 소스가 여러 저장소에 흩어져 용량이 늘고, 공통 규칙을 고쳐도 이미 만든 프로젝트에는 전달되지 않았습니다. 그래서 v2에서는 복사 대신 패키징 방식으로 바꾸고, 공통 정책·스크립트·shared skill을 shared로, \`apps/**\`·패키지 파일·project profile·local skill을 project-owned로 분류했습니다.

핵심 문제는 "이 파일을 덮어써도 되는가"를 어떻게 판정하느냐였습니다. 파일 존재나 수정 시각만 보면 프로젝트가 의도적으로 고친 파일까지 되돌리게 됩니다. 그래서 하네스 upstream을 별도로 fetch해 두고, 다운스트림의 현재 파일과 upstream 파일의 **내용을 직접 비교**하는 방식을 택했습니다. 버전은 \`harness.lock\`으로 고정하고, 어떤 파일이 shared인지는 manifest가 정의합니다.

판정은 단순한 같다/다르다가 아니라 네 갈래로 나눴습니다. 프로젝트가 지운 파일은 update가 조용히 되살리지 않도록 막되, upstream에서도 삭제된 파일이면 이미 반영된 상태로 보고 통과시킵니다. git이 **추적하지 않는 파일**이라도 내용이 upstream과 같으면 실질 변경이 아니므로 통과시키고, 다르면 프로젝트 작업물로 보고 건너뜁니다.

여기에 두 가지를 더했습니다. 변경 비교만으로는 옛 버전에서 시작한 프로젝트가 아예 받지 못한 파일을 영원히 놓치므로, manifest 전체 목록과 대조해 누락된 파일을 따로 복구합니다. upstream에서 사라진 파일을 정리할 때는 이전에 실제로 배포한 적이 있는 파일로만 범위를 좁혀, 프로젝트가 같은 이름으로 만든 파일을 지우지 않게 했습니다.

소유권 경계 자체도 설계만으로 완성되지 않았습니다. 팀원이 프로젝트에 직접 만든 skill이 하네스 업데이트에서 덮어써지는 문제가 보고됐는데, 그때까지는 skill 전체를 shared로 다루고 있었기 때문입니다. 이후 \`.harness/skills-local/\`을 프로젝트 소유 영역으로 분리해 업데이트 대상에서 제외하고, 두 영역의 이름이 충돌하면 링크 단계에서 실패하도록 만들었습니다.

업데이트 구현은 복잡해졌지만 공통 변경을 프로젝트 소유권을 침범하지 않고 전달할 수 있게 됐습니다.

### 공통 정책과 런타임 어댑터

팀의 작업 규모, Brainstorming · Planning · Execution · Review · Verification 순서, TDD, 코드 소유권과 위험 명령 기준은 \`.harness/policies/\`를 정본으로 둡니다. Claude Code는 rules·settings·hook으로, Codex는 AGENTS·rules·preflight·PreToolUse hook으로 같은 정책 의미를 각 런타임 형식에 맞게 집행합니다.

정책이 실제로 필요하다는 것도 사용 중에 확인했습니다. Next.js만 쓰는 프로젝트에서 AI 에이전트가 존재하지도 않는 \`apps/back\` 영역을 건드리려 한다는 피드백이 들어왔고, 이후 \`project-profile.yaml\`의 profile로 허용 경로를 선언해 작업 전에 경계를 확인하도록 보완했습니다. 같은 파일이 패키지 매니저 정책도 함께 결정합니다.

패리티는 파일 내용이 같다는 뜻이 아니라 같은 입력에서 같은 허용·차단 결과를 내는 상태로 정의했습니다. 그래서 규칙 파일이 존재하는지가 아니라 실제 hook payload를 넣었을 때 같은 판정이 나오는지를 검증합니다. 초기의 GSD → Spec Kit 전환은 문서 양식 통제와 사용자 의견 반영을 강화하기 위한 결정이었고, GStack → Playwright MCP 전환은 약 5주간 사용량을 확인했을 때 browse 외 활용이 크지 않아 실제 브라우저 검증에 집중하기 위한 결정이었습니다.

### 변경 범위 기반 배포와 Infisical 경계

pipeline은 push마다 전부 배포하는 대신 변경 파일을 먼저 읽어 \`backend_changed\`, \`frontend_changed\`, \`dependency_changed\`를 계산합니다. 프론트엔드만 바뀌면 백엔드 배포를 실행하지 않고, 애플리케이션 변경이 없으면 배포 자체를 건너뜁니다.

호텔 예약 플랫폼의 pipeline은 같은 계산을 대상 단위로 확장해, 공통 코드·패키지·workflow가 바뀌면 전체 호텔을, 특정 호텔 영역만 바뀌면 해당 호텔만 배포 대상으로 잡습니다. 검증된 대상은 matrix로 병렬 실행하고, 운영 브랜치는 운영 검증이 끝난 호텔만 포함합니다.

기존 Jenkins는 master와 slave 구조였지만 slave가 하나만 할당돼 있었습니다. 호텔 5개를 한 번에 걸면 한 번에 하나씩만 실행돼 앞의 배포가 끝나야 다음이 시작됐고, React 빌드가 **약 3분씩** 걸려 전체가 약 15분이 됐습니다. 15분은 어느 한 단계가 느려서가 아니라 3분짜리 작업 다섯 개를 순서대로 세운 결과였습니다. matrix로 다섯 개를 동시에 실행하면 전체 시간은 **가장 오래 걸리는** 하나인 약 3분으로 수렴합니다.

matrix에는 \`fail-fast: false\`를 설정해 특정 호텔 job이 실패하더라도 다른 호텔 job이 독립적으로 실행될 수 있게 하고 GitHub Actions가 즉시 취소하지 않도록 하려는 설계 의도를 뒀습니다. 다만 이를 확인하려고 특정 호텔의 배포를 의도적으로 실패시키지 않았고, 운영 중 실제 실패 사례에서 다른 호텔의 완료 여부를 대조한 기록도 없습니다. 따라서 실패 격리는 설계 의도로만 설명하며 검증된 장애 격리 성과로 확대하지 않습니다.

프로젝트마다 배포 방식이 달랐기 때문에 PM2, Docker, Vercel 배포를 각각 reusable workflow로 분리하고 \`pipeline.yml\` 하나에서 profile에 맞는 것을 호출하도록 했습니다. 배포 대상과 실행 방식을 분리한 덕분에 새 프로젝트는 배포 스크립트를 새로 작성하는 대신 진입점에서 방식을 고르면 됩니다.

GitHub Secrets에는 Infisical 접근용 bootstrap secret만 두고 실제 런타임·배포 변수는 프로젝트·환경·목적별 경로에서 조회합니다.

환경 혼입 문제는 원인을 끝까지 규명하지 못했습니다. **재현**을 시도했지만 같은 증상이 다시 나타나지 않아 **원인을 확정하지** 못했고, 당시에는 Jenkins에 사람이 직접 환경변수를 등록하고 있었으므로 다른 플랫폼 값을 잘못 넣었을 가능성을 배제할 수 없다고 보고 값을 갱신하는 선에서 수습했습니다. 이후에는 5개를 한 번에 대기열에 거는 방식을 그만두고 **하나씩 순차**로 배포했고, 그때부터 같은 문제는 발생하지 않았습니다.

지금 구조에서는 환경과 배포 대상이 실행 단위로 분리돼 있고 값도 사람이 UI에 넣는 대신 경로에서 조회합니다. 다만 위 이력 때문에 이 결과를 "원인을 고쳤다"고 쓰지 않습니다. 원인 미확정 상태에서 운영 방식과 조회 구조가 함께 바뀌었고, 그 뒤로 동일 유형 문제가 관찰되지 않았다는 것이 정확한 범위입니다. 향후 발생 가능성이 0이라는 주장이 아니라 현재 운영 관찰 범위입니다.

### 더 깊이 읽기

- [DX 하네스 v2: 복사형 도구에서 사내 개발 운영 플랫폼까지](/insights/codi-harness-dx-platform-design)`,
  outcomes: `변경 범위를 계산한 병렬 matrix는 5개 호텔의 배포 시간을 실행 화면 기준 약 15분에서 약 3분으로 줄였습니다. Infisical의 환경·목적별 조회 경계를 적용한 뒤 다른 호텔 환경변수가 섞인 동일 유형 문제는 현재까지 다시 관찰되지 않았습니다. CLI·doctor와 공통 정책은 11개 프로젝트에 적용됐고 그중 8개가 실제 운영 중이며 팀원 3명이 사용하고 있습니다. Jenkins 제거 범위는 과거 청구액이 아니라 2026-08-20 AWS 서울 리전 t3.large 2대의 공개 가격으로 계산한 월 $151.84 컴퓨팅 추정치이며, 스토리지·네트워크·세금은 포함하지 않습니다. 가격 기준은 [AWS EC2 On-Demand 공개 가격](https://aws.amazon.com/ec2/pricing/on-demand/)에서 확인할 수 있습니다.`,
  retrospective: `가장 많이 배운 것은 "괜찮아 보이는 상태"를 믿으면 안 된다는 점이었습니다. 파일이 전부 제자리에 있어도 설정 하나가 깨지면 guardrail이 조용히 사라지고, 배포가 성공해도 어떤 값이 들어갔는지는 별개 문제입니다. 그래서 존재가 아니라 작동을, 결과가 아니라 판정 근거를 확인하는 쪽으로 도구를 만들게 됐습니다.

같은 이유로 자동화 범위를 일부러 좁혔습니다. update는 로컬 변경을 덮어쓰지 않고 doctor는 대부분 고치지 않습니다. 사람이 판단해야 할 것을 도구가 대신 결정하면 편해지는 대신 무엇이 바뀌었는지 알 수 없게 되기 때문입니다.

아쉬운 점은 환경 혼입 문제의 원인을 끝내 규명하지 못한 것입니다. 재현이 되지 않아 운영 방식을 바꾸는 선에서 마무리했는데, 당시에 배포별로 어떤 값이 주입됐는지 남기는 기록이 있었다면 원인을 좁힐 수 있었을 것입니다. 지금이라면 값 자체가 아니라 어떤 경로에서 무엇을 조회했는지를 배포 로그에 남기는 것부터 했을 것입니다.

다음 개선은 멀티 세션에서 실행 자원과 handoff를 더 안정적으로 격리하고, 언제 컨텍스트를 줄이거나 다음 세션으로 넘길지 자동 판단하는 것입니다. 이 범위는 운영 중인 핵심 기능과 구분한 확장 실험으로 다룹니다.`
};
