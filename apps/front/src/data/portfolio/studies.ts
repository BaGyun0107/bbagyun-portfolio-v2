// prisma/data/studies.ts
// 실제 공부(Study) 데이터를 이 파일에서 관리합니다.
// 새 공부 추가 시 아래 배열에 객체를 추가하세요.

export type SeedStudy = {
  slug: string;
  title: string;
  description: string;
  iconName: string;
  category: string;
  techStack: string[];
  status: string;
  overview: string;
  period?: string | null;
  content?: string | null;
};

export const REAL_STUDIES: SeedStudy[] = [
  {
    slug: 'ai-dx-harness-starter-kit',
    title: 'DX 하네스 v1 PoC와 CI/CD·시크릿 인프라 검증',
    description:
      '사내 적용 전 혼자 v1 하네스를 실험하며 GitHub Actions, Vercel, Cloudflare Tunnel, Infisical, AI 에이전트 컨텍스트 관리 방식을 검증한 학습 기록입니다.',
    iconName: 'Rocket',
    category: 'DevOps',
    techStack: ['GitHub Actions', 'Vercel', 'Cloudflare Tunnel', 'Infisical', 'Next.js', 'Node.js', 'Monorepo'],
    status: 'Published',
    overview:
      'v1 하네스를 혼자 테스트하며 모노레포 아키텍처, 환경변수 중앙화, 서버리스 CI/CD, Zero Trust 배포망의 가능성과 한계를 검증했고, 이 경험을 바탕으로 사내 적용용 v2 하네스를 설계했습니다.',
    period: '2026.04 (3주 ~ 4주)',
    content: `## 1. 도입 배경 및 목표

v1 하네스는 실제 팀 운영 도구라기보다, 사내 적용 전에 혼자 구조를 검증한 PoC 성격이 강했습니다. 여러 프로젝트에서 반복될 수 있는 CI/CD 세팅, 환경변수 관리, AI 에이전트 컨텍스트 주입, Vercel 배포 비용 문제를 한 번에 다룰 수 있는지 직접 테스트했습니다.

이 단계에서 프론트엔드(Next.js)와 백엔드(Node.js/Express)를 아우르는 모노레포 기반의 'Harness Starter-kit'을 만들고, AI 에이전트 연동부터 Infisical 기반 \`.env\` 중앙화, GitHub Actions 마이그레이션, Vercel Custom CI, Cloudflare Tunnel 배포 접근까지 검증했습니다. 이후 이 학습 결과를 바탕으로 실제 사내 사용을 목표로 한 v2 하네스를 별도 작업물로 발전시켰습니다.

## 2. 핵심 챌린지 및 문제 해결

### 챌린지 1: AI 컨텍스트 동기화와 Monorepo 아키텍처

#### 문제 상황

AI 에이전트 기반 개발을 사내에 안착시키기 전에, 작업자마다 로컬 AI 플러그인 환경이 달라질 경우 생산성 편차가 생길 수 있다고 판단했습니다. 또한 Front와 Back 레포지토리가 분리된 구조에서는 AI가 전체 API 스펙이나 아키텍처의 문맥을 한 번에 파악하기 힘든 한계가 있었습니다.

#### 고려한 대안과 판단

| **대안** | **접근** | **기타 사유** |
| --- | --- | --- |
| Superpowers AI | 각 로컬 환경에 개별 플러그인 설치 | 팀원별 세팅 파편화 발생, 프로젝트 전환 시 번거로움 |
| **gstack (v1 PoC 당시 선택)** | **레포지토리 내 \`.agents\`, \`.claude\` 등 설정 파일 직접 포함** | **Clone 직후 같은 AI 컨텍스트를 실험하기 위한 선택** |

#### 해결 과정

- \`gstack\`을 활용해 레포지토리를 Clone 한 뒤 같은 기준의 AI 에이전트 환경에서 작업하도록 세팅을 표준화했습니다.
- Front/Back 분리 구조를 모노레포로 통합하여 관리 포인트를 줄이고, 프로젝트 진행 중 도출되는 유용한 로직은 향후 '공용 스킬'로 분리해 공유할 수 있도록 룰을 정리했습니다.

#### 결과

- 팀 단위 적용 전에 AI 개발 환경 차이를 줄일 수 있는 구조 검증
- 모노레포와 공용 스킬 구조가 AI 컨텍스트 관리에 유효하다는 점 확인

### 챌린지 2: 인프라 기술 부채 청산과 CI/CD 비용 최적화

#### 문제 상황

사내 Jenkins 서버 2대는 여러 프로젝트가 묶여 있어 동시에 업데이트하면 순차 배포 병목이 생길 수 있었습니다. 비용 비교는 과거 청구액을 복원한 값이 아니라 2026-08-20 AWS 서울 리전 t3.large 2대의 공개 가격으로 계산한 월 $151.84 컴퓨팅 추정치입니다. 스토리지·네트워크·세금은 제외했으며 실제 청구 비용이 아닙니다. v1에서는 GitHub Actions와 Vercel CLI 기반 배포로 이 구조를 대체할 수 있는지 검증했습니다.

2026-08 기준 Vercel 공개 가격에서 Pro는 월 $20이고 개발자 seat 1개와 월 $20 usage credit이 포함됩니다. 추가 개발자 seat는 월 $20이며 viewer는 무료입니다. 이 기준은 [Vercel Pro plan](https://vercel.com/docs/plans/pro-plan)과 [pricing documentation](https://vercel.com/docs/pricing)에서 확인했습니다. 공개 가격은 플랜 비교 근거일 뿐 실제 청구 비용이 아닙니다. workload 비용 계산에는 요청·전송·컴퓨트 입력과 별도 산식이 필요하며, 이 PoC 기록에서는 해당 입력과 네트워크 전송·세금·환율을 계산에서 제외했습니다.

#### 고려한 대안과 판단

| **대안** | **접근** | **기타 사유** |
| --- | --- | --- |
| 현행 유지 (Jenkins) | 기존 인스턴스 스펙 업그레이드 | 고정비 추가 지출, 서버 직접 관리 리소스 지속 |
| Vercel Pro + Git Integration | Vercel 프로젝트 권한과 공식 Git 연동 사용 | 권한이 필요한 추가 Developer Seat의 비용 검토 필요 |
| **GH Actions + Vercel CLI 커스텀** | **토큰 기반 배포 자동화 직접 실험** | **Vercel 권한이 필요 없는 기여자와 배포 주체를 분리** |

단순한 도구 교체가 아니라 인프라 운영 방식을 바꿀 수 있는지 확인하기 위해 GitHub Actions 마이그레이션 흐름을 검증했습니다. Vercel은 프로젝트 권한을 가진 배포 주체의 Token을 이용해 Actions에서 배포하는 파이프라인을 직접 테스트했습니다.

#### 해결 과정

- Vercel 배포 시 \`vercel deploy --prebuilt\` 명령어와 \`--meta\` 태그를 결합하여, Vercel 서버의 빌드 큐를 거치지 않고 GitHub Actions에서 사전 빌드된 결과물만 전송하도록 파이프라인을 커스텀했습니다.
- Vercel 프로젝트 권한이 필요한 사람과 저장소에 코드만 기여하는 사람을 분리해 적용 조건을 확인했습니다.

#### 결과

- Jenkins 서버 비교값은 과거 절감액이 아닌 **월 $151.84 컴퓨팅 공개 가격 추정**으로 한정
- Vercel 권한이 필요 없는 기여자를 유료 seat로 추가하지 않고 배포할 수 있는 CLI 흐름 검증

> 공식 가격 조건과 Custom CI 적용 범위에 대해서는 인사이트 **[Vercel Developer Seat 비용 조건과 Custom CI 배포 검증](/insights/vercel-team-plan-bypass-and-serverless-cost-analysis)**에서 다루고 있습니다.

> Jenkins 제거 판단의 배경과 GitHub Actions 파이프라인 고도화 과정에 대해서는 인사이트 **[GitHub Actions 전환보다 중요했던 배포 단위 재설계](/insights/jenkins-retirement-and-github-actions-migration)**에서 다루고 있습니다.

### 챌린지 3: Zero Trust 보안 통제와 환경변수 중앙화

#### 문제 상황

GitHub Actions 러너에서 직접 SSH로 사내 인스턴스에 배포하는 구성을 선택하면 인바운드 22번 포트를 열거나 허용해야 했고, Actions의 동적 IP 대역을 계속 관리하는 운영 부담도 있었습니다. 또한, 환경변수(\`.env\`)를 슬랙으로 공유하는 방식은 PRD/DEV 환경 변수가 뒤바뀌거나 업데이트가 누락될 수 있는 관리 리스크가 있었습니다.

#### 고려한 대안과 판단

| **대안** | **접근** | **기타 사유** |
| --- | --- | --- |
| 22포트 개방 / IP 화이트리스트 | 방화벽 정책 수정 및 Actions IP 대역 허용 | 외부 노출 범위와 동적 IP 대역을 계속 관리해야 함 |
| SaaS 시크릿 매니저 | 클라우드 구독형 관리 툴 사용 | 시크릿 보관 위치의 통제 범위와 비용 검토 필요 |
| **CF Tunnel + Self-hosted Infisical** | **아웃바운드 터널링 및 사내 환경변수 중앙화** | **인바운드 포트 Zero 방어, 데이터 통제권 확보** |

보안을 위해 **Cloudflare Tunnel**과 사내망에 구축한 **Infisical**을 결합했습니다. 다만 Infisical 서버가 죽었을 때 실 서비스도 함께 죽는 단일 장애점 리스크를 막기 위한 아키텍처적 타협이 필요했습니다.

#### 해결 과정

- \`ProxyCommand\`를 통해 Cloudflare 엣지 네트워크 인증을 거친 뒤 아웃바운드 터널을 타고 내부에 도달하는 **Zero Trust 아키텍처**를 구축했습니다.
- 사내 인스턴스에 Infisical을 구축해 모든 \`.env\`를 중앙화하고, 로컬 개발 시 CLI 래퍼와 \`.infisical.json\`을 통해 브랜치별 환경변수를 자동 매핑했습니다.
- SPoF 영향 범위를 나누기 위해 배포 시점에 Infisical 값을 조회해 물리적 \`.env\` 파일을 생성하고 인스턴스로 배포하는 **로직**을 설계했습니다. 조회에 실패하면 새 배포는 중단되지만 기존 인스턴스는 이전 배포의 값을 유지하도록 경계를 잡았습니다.

#### 결과

- 인바운드 22번 포트를 열지 않는 CI/CD 배포망 구성 가능성 확인
- 슬랙 기반 \`.env\` 공유를 Infisical 중심 관리로 대체할 수 있는 구조 검증

> 이벤트 로그에서 확인한 WAF 정책 차단과 배포 호스트명·터널·서버의 대상 매핑에 대해서는 인사이트 **[Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다](/insights/cloudflare-tunnel-zero-trust-cicd-and-troubleshooting)**에서 다루고 있습니다.

> Infisical Self-Hosted 도입과 단일 장애점(SPoF)의 영향을 분리한 배포 시점 조회 전략에 대해서는 인사이트 **[환경변수 중앙화는 저장보다 경계 설계다: Infisical Self-Hosted 도입기](/insights/infisical-centralized-secrets-and-spof-defense)**에서 다루고 있습니다.

## 3. 공부 회고

- **v1의 역할은 검증이었다:** v1은 팀 전체가 사용하는 도구라기보다, 혼자 여러 인프라 선택지를 테스트하며 무엇을 사내 표준으로 가져갈 수 있는지 검증한 단계였습니다. 이 과정에서 복사형 하네스의 한계, 공통 스킬 버전 드리프트, 업데이트 전파 문제를 발견했습니다.
- **v2로 이어진 설계 근거:** Jenkins 제거, GitHub Actions 단일 진입점, Infisical 중앙화, Cloudflare Tunnel, Vercel CLI 배포는 v1에서 가능성을 확인한 뒤 v2에서 사내 사용 도구로 재구성했습니다. 비용 절감도 단순 운영비 문제가 아니라, 회사 상황에 맞는 인프라 체급을 선택하는 아키텍처 판단이라는 점을 체감했습니다.

## 4. 공부 후 적용 기준

이번 학습에서 바로 정답을 얻은 것은 아니었습니다. 대신 다음 프로젝트에서 어떤 기준으로 기술을 선택할지 명확해졌습니다.

- **먼저 운영 조건을 정의한다:** 팀 규모, 유지 비용, 배포 빈도, 장애 대응 인력을 확인한 뒤 기술을 선택합니다. 유명한 도구를 먼저 도입하고 운영 조건을 맞추는 방식은 피합니다.
- **검증 단계와 운영 단계를 분리한다:** v1처럼 혼자 가능성을 확인하는 PoC와 팀이 계속 사용하는 v2 운영 도구는 안정성·문서화·업데이트 정책의 기준이 달라야 합니다.
- **보안 경계를 빌드 흐름에 포함한다:** 시크릿을 한곳에 모으는 것만으로 끝내지 않고, 누가 어떤 시점에 어떤 값에 접근하는지와 장애 시 대체 경로까지 함께 설계합니다.
- **도구보다 반복 가능한 기준을 남긴다:** CI/CD, 환경변수, AI 에이전트 설정은 사람이 기억하는 체크리스트가 아니라 초기화·검증 가능한 규칙으로 남겨야 합니다.`
  }
];
