import type { FeatureDetailDto } from '../types/feature-detail.dto';

export const HANMAUM_SCIENCE_INSTITUTE_DETAIL: FeatureDetailDto = {
  role: `백엔드를 단독으로 맡아 검색 API와 인덱스 전략, 원문 파싱과 적재, 관리자 인증과 배포 파이프라인을 담당했습니다. 아래에서는 그중 판단이 가장 많이 필요했던 두 가지, 외부 검색 인프라 없이 검색 구조를 어떻게 나눌지와 원문이 규칙과 어긋날 때 데이터를 어떻게 지킬지를 다룹니다.`,
  highlights: [
    {
      id: 'search-response-time',
      label: '검색 응답 시간',
      value: '약 1500ms → 약 400ms',
      kind: 'measured',
      asOf: '2023-10',
      evidence:
        '브라우저 네트워크 탭에 기록된 응답 시간 기준. 같은 검색어로, 데이터를 전량 적재한 상태에서, 구버전과 신규 기능이 서로 다른 도메인에 동시에 떠 있어 직접 비교했고 날짜를 달리해 여러 차례 관측했습니다.',
      caveat: '데이터베이스 쿼리 실행 시간이 아니라 서버 처리와 전송을 포함한 엔드투엔드 응답 시간입니다.'
    },
    {
      id: 'source-volume',
      label: '원문 규모',
      value: '약 77만 자 / 최대 454페이지',
      kind: 'reported',
      asOf: '2023-10',
      evidence: '이관 대상 교재 원본 기준으로 확인한 분량입니다.'
    },
    {
      id: 'ingestion-duration',
      label: '전체 적재 소요',
      value: '5분 이내',
      kind: 'reported',
      asOf: '2023-10',
      evidence: '전체 원문을 한 번에 적재했을 때의 실행 경험 기준입니다.',
      caveat: '계측 도구로 남긴 기록이 아니라 당시 실행을 회고한 값이므로 측정값으로 다루지 않습니다.'
    }
  ],
  problem: `교재를 웹으로 옮기는 것보다 어려운 문제는 옮긴 뒤에 있었습니다. 단락 단위 검색이 핵심 기능인데 약 77만 자를 대상으로 부분 일치를 걸면 전체를 훑어야 해서 느렸습니다. 반대로 인덱스를 쓰면 한국어에서 한 글자 검색과 조사가 붙은 형태를 놓쳤습니다. 원문도 문제였습니다. Word 교재는 카테고리·권·단락 구분이 서식과 표기 관례에 의존해 일관된 구조가 없었고, 규칙에 어긋나는 부분이 섞여 있어도 그대로 적재하면 일부만 들어간 교재가 남았습니다.`,
  constraints: `외부 검색 엔진을 도입할 예산이 없었습니다. 데이터베이스 버전이 낮아 한국어에 맞는 토큰화 방식을 쓸 수 없었고, 버전을 올리는 것은 운영 중인 환경에서 선택지가 아니었습니다. 교재 갱신은 자주 일어나지 않았습니다. 고객사의 교재 원문과 실제 구현 코드는 공개할 수 없습니다.`,
  alternatives: `외부 검색 엔진은 비용이 발생해 시도하지 못했습니다. 검토를 거쳐 제외한 것이 아니라 처음부터 선택지에 들어오지 않았습니다.

남은 범위는 쓰고 있던 데이터베이스 안이었습니다. 부분 일치만 쓰면 정확하지만 느리고, 인덱스만 쓰면 빠르지만 한국어에서 놓치는 것이 생깁니다. 둘 중 하나를 고르는 대신 순서를 나눠 각각 잘하는 일만 맡기는 방향을 택했습니다.

원문 적재는 관리자가 파일을 업로드하면 서버가 처리하는 방식으로 만들었습니다. 갱신 빈도가 낮아 상시 자동화가 필요하지 않았고, 대신 사람이 올린 파일이 규칙과 어긋날 때 무엇이 잘못됐는지 알려주는 쪽이 더 중요했습니다.`,
  swimlanes: [
    {
      id: 'ingestion-and-recovery',
      title: '원문 적재와 실패 복구',
      purpose: '원문이 규칙과 어긋났을 때 데이터가 어떻게 보호되고 어떤 정보가 돌아오는지 보여줍니다.',
      summary:
        '업로드에서 시작해 문서 변환, 규칙 매칭, 트랜잭션 저장을 거쳐 매칭 누락을 검사하고, 누락이 없을 때만 커밋합니다.',
      lanes: [
        { id: 'admin', label: '관리자' },
        { id: 'parsing', label: '파싱' },
        { id: 'persistence', label: '적재' },
        { id: 'validation', label: '검증' }
      ],
      steps: [
        {
          id: 'upload',
          laneId: 'admin',
          row: 0,
          shape: 'start',
          label: '원문 업로드',
          description: '관리자가 교재 파일을 올립니다.'
        },
        {
          id: 'convert',
          laneId: 'parsing',
          row: 1,
          shape: 'process',
          label: '문서 변환',
          description: '서식 정보를 유지한 형태로 변환합니다.'
        },
        {
          id: 'match',
          laneId: 'parsing',
          row: 2,
          shape: 'process',
          label: '규칙 매칭',
          description: '카테고리와 권, 단락 식별자를 규칙으로 추출합니다.'
        },
        {
          id: 'persist',
          laneId: 'persistence',
          row: 3,
          shape: 'process',
          label: '트랜잭션 저장',
          description: '전체 적재를 하나의 트랜잭션으로 묶어 저장합니다.'
        },
        {
          id: 'verify',
          laneId: 'validation',
          row: 4,
          shape: 'decision',
          label: '매칭 누락 검사',
          description: '차례에서 추출한 제목이 모두 단락과 짝을 이뤘는지 확인합니다.'
        },
        {
          id: 'commit',
          laneId: 'persistence',
          row: 5,
          shape: 'end',
          label: '커밋 완료',
          description: '누락이 없을 때만 적재를 확정합니다.'
        },
        {
          id: 'abort',
          laneId: 'validation',
          row: 5,
          shape: 'stop',
          label: '적재 취소',
          description: '되돌리고 남은 제목을 함께 반환합니다.'
        }
      ],
      edges: [
        {
          id: 'upload-convert',
          from: 'upload',
          to: 'convert',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'convert-match',
          from: 'convert',
          to: 'match',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'match-persist',
          from: 'match',
          to: 'persist',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'persist-verify',
          from: 'persist',
          to: 'verify',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'verify-commit',
          from: 'verify',
          to: 'commit',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          label: '누락 없음'
        },
        {
          id: 'verify-abort',
          from: 'verify',
          to: 'abort',
          kind: 'exception',
          outcome: 'stop',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          label: '누락 항목 있음'
        },
        {
          id: 'abort-upload',
          from: 'abort',
          to: 'upload',
          kind: 'exception',
          outcome: 'recover',
          fromAnchor: 'right',
          toAnchor: 'right',
          label: '규칙 보완 후 재실행'
        }
      ],
      exceptions: [
        {
          id: 'unmatched-title',
          trigger: '규칙과 어긋나 매칭되지 않은 제목이 남았습니다.',
          response: '예외가 없어도 적재를 되돌리고 남은 제목을 알려 원인 지점을 좁힙니다.',
          edgeIds: ['verify-abort']
        },
        {
          id: 'rule-refinement',
          trigger: '반환된 제목으로 어떤 표기에서 규칙이 깨졌는지 확인했습니다.',
          response: '원본 교재가 아니라 파싱 규칙을 보완한 뒤 다시 실행합니다.',
          edgeIds: ['abort-upload']
        }
      ],
      archify: {
        url: '/diagrams/hanmaum-science-institute/ingestion-and-recovery.html'
      }
    },
    {
      id: 'search-request-flow',
      title: '검색 요청 처리',
      purpose: '속도를 담당하는 단계와 정확도를 담당하는 단계가 어떻게 나뉘는지 보여줍니다.',
      summary: '검색어를 분석해 인덱스로 후보군을 좁힌 뒤, 좁혀진 범위에서만 정밀 검증을 수행해 결과를 반환합니다.',
      lanes: [
        { id: 'reader', label: '이용자' },
        { id: 'routing', label: '라우팅' },
        { id: 'storage', label: '데이터' }
      ],
      steps: [
        {
          id: 'query',
          laneId: 'reader',
          row: 0,
          shape: 'start',
          label: '검색어 입력',
          description: '찾으려는 표현을 입력합니다.'
        },
        {
          id: 'route',
          laneId: 'routing',
          row: 1,
          shape: 'process',
          label: '검색어 구성 분석',
          description: '검색어를 나눠 어느 단계에서 무엇을 맡을지 정합니다.'
        },
        {
          id: 'narrow',
          laneId: 'storage',
          row: 2,
          shape: 'process',
          label: '후보군 압축',
          description: '인덱스로 전체 단락을 검토 가능한 범위까지 좁힙니다.'
        },
        {
          id: 'refine',
          laneId: 'storage',
          row: 3,
          shape: 'process',
          label: '정밀 검증',
          description: '좁혀진 범위에서만 모든 검색어가 실제 문장에 있는지 확인합니다.'
        },
        {
          id: 'respond',
          laneId: 'reader',
          row: 4,
          shape: 'end',
          label: '결과 확인',
          description: '조건을 만족한 단락을 확인합니다.'
        }
      ],
      edges: [
        {
          id: 'query-route',
          from: 'query',
          to: 'route',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'route-narrow',
          from: 'route',
          to: 'narrow',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'narrow-refine',
          from: 'narrow',
          to: 'refine',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        },
        {
          id: 'refine-respond',
          from: 'refine',
          to: 'respond',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        }
      ],
      exceptions: [],
      archify: {
        url: '/diagrams/hanmaum-science-institute/search-request-flow.html'
      }
    }
  ],
  implementation: `### 속도와 정확도를 나눈 2단계 검색

인덱스 검색만으로 해결하려 했지만 한국어에서 막혔습니다. 기본 토큰화가 공백과 구두점 기준이라 "수행자의"는 통째로 하나의 토큰이 됩니다. "수행자"로 검색하면 정확히 일치하지 않아 찾지 못하고, 한 글자 검색은 아예 대상이 되지 않습니다.

최소 토큰 길이를 1로 낮추려 시도했지만 적용되지 않았습니다. 이후 확인해보니 성공했더라도 결과는 같았을 것입니다. 그 설정은 잘라낸 토큰 중 무엇을 인덱싱할지 정할 뿐, 자르는 방식 자체를 바꾸지 못하기 때문입니다. 한 글자 토큰이 애초에 만들어지지 않으니 기준을 낮춰도 인덱싱할 대상이 없습니다. 자르는 방식을 바꾸려면 N-gram 방식이 필요한데 이는 상위 버전과 특정 엔진을 요구했습니다.

그래서 하나의 쿼리로 해결하는 대신 순서를 나눴습니다. 먼저 두 글자 이상 단어로 인덱스 검색을 걸어 전체 단락을 다시 훑을 만한 범위까지 좁히고, 조사가 붙은 형태도 걸리도록 검색어 뒤를 열어 두었습니다. 그다음 좁혀진 범위에서만 부분 일치로 다시 걸러 한 글자를 포함한 모든 검색어가 실제 문장에 있는지 확인합니다.

부분 일치가 느린 이유는 연산 자체가 아니라 대상 건수였습니다. 대상을 먼저 줄이면 같은 방식도 감당할 수 있습니다. 속도는 인덱스가, 정확도는 부분 일치가 맡는 구조입니다.

### 틀이 일정하지 않은 원문을 다루는 적재 경로

원문 적재는 관리자가 화면에서 파일을 올리면 서버가 처리하도록 만들었습니다. Word를 변환해 서식 정보를 살린 뒤, 카테고리와 권, 단락 식별자를 정규식으로 추출해 구조화합니다.

하나의 처리 경로가 최초 적재와 이후 갱신을 모두 담당합니다. 요청 파라미터로 신규 등록과 갱신을 구분해, 교재가 개정돼도 같은 경로로 처리할 수 있게 했습니다.

### 오류가 없어도 되돌리는 검증

전체 적재를 하나의 트랜잭션으로 묶었습니다. 처리 도중 예외가 나면 예외 롤백으로 전부 되돌아가므로 일부만 들어간 상태가 남지 않습니다.

여기까지는 실패를 막았지만 어디서 실패했는지는 알려주지 않았습니다. 규칙과 어긋나는 표기가 섞여 있으면 파싱이 조용히 건너뛰고, 빈 값이 들어가는 경우도 있었습니다. 그래서 원인 지점을 알기 위해 검증을 추가했습니다.

차례에서 뽑은 제목은 본문 단락과 모두 짝을 이루면 남는 것이 없어야 합니다. 남아 있다면 규칙이 그 문서를 다 읽지 못했다는 뜻입니다. 그래서 예외가 나지 않았더라도 커밋 직전에 남은 제목이 있으면 검증 롤백으로 되돌리고, 어떤 제목이 남았는지 함께 알립니다. 오류가 없다는 것과 데이터가 올바르다는 것은 다르기 때문입니다.

두 롤백은 역할이 다릅니다. 예외 롤백은 처리가 실패했을 때 작동하고, 검증 롤백은 처리가 성공했는데도 결과가 계약과 맞지 않을 때 작동합니다.

이 장치는 실제로 여러 번 작동했습니다. 대응할 때는 원본 교재를 고치지 않고 파싱 규칙만 보완했습니다. 원본을 고치면 다음 갱신 때 같은 작업을 반복해야 하고 고객사 문서를 훼손할 위험도 생깁니다. 규칙을 고치면 그 예외가 이후에도 처리됩니다.

### 더 깊이 읽기

- [1500ms에서 400ms로 RDBMS 환경에서 77만 자 대용량 텍스트 검색 최적화기](/insights/optimizing-770k-text-search-in-rdbms)`,
  outcomes: `후보군을 먼저 좁히고 정밀 검증을 뒤로 미룬 구조는 검색 응답 시간을 약 1500ms에서 약 400ms로 줄였습니다. 측정 조건과 범위는 위 지표에 적어 두었고, 여기서는 쿼리 단독 시간이 아니라는 점만 다시 밝힙니다.

한 글자 검색과 조사가 붙은 형태는 2단계 구조의 뒷단이 보완했습니다. 속도만 얻고 정확도를 잃는 교환이 아니었다는 점이 이 구조를 택한 결과로 남았습니다.

원문은 전량 구조화해 적재했고, 검증 롤백 덕분에 일부만 반영된 상태가 남은 적은 없습니다. 규칙을 원본이 아닌 코드 쪽에서 보완했기 때문에 이후 교재가 개정돼도 같은 경로로 처리할 수 있었습니다.`,
  retrospective: `가장 크게 남은 것은 실패를 막는 것과 실패를 이해하는 것이 다르다는 점이었습니다. 트랜잭션은 잘못된 데이터가 남지 않게 해줬지만 무엇이 잘못됐는지는 알려주지 않았습니다. 되돌리는 것만으로는 부족했고, 되돌리면서 어디서 멈췄는지 함께 알려주는 장치를 만들고 나서야 반복 개선이 가능해졌습니다.

제약을 인정하고 범위를 나눈 것도 배운 점입니다. 인덱스로 모든 것을 해결하려던 시도가 막혔을 때 설정을 바꾸는 데 매달리기보다, 각 방식이 잘하는 일을 나눠 맡기는 편이 빨랐습니다. 다만 당시에는 설정이 적용되지 않은 이유를 끝까지 확인하지 못했고, 토큰화 방식과 인덱싱 기준의 차이를 나중에야 정리했습니다.

지금 다시 만든다면 검색은 외부 엔진을 검토해 토큰화와 결과 순위를 직접 제어하겠습니다. 현재 구조는 정확도를 부분 일치로 보완하는 만큼 결과 순위를 세밀하게 다루지 못합니다. 인증도 이 프로젝트에서 처음 구현하며 쿠키 속성으로 스크립트 접근은 막았지만 요청 위조 대응이 부족했고, 이후 프로젝트에서 그 부분을 보완했습니다.`
};
