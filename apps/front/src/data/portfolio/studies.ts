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

이 단계에서 프론트엔드(Next.js)와 백엔드(Node.js/Express)를 아우르는 모노레포 기반의 'Harness Starter-kit'을 만들고, AI 에이전트 연동부터 Infisical 기반 \`.env\` 중앙화, GitHub Actions 마이그레이션, Vercel 비용 우회, Cloudflare Tunnel 배포 접근까지 검증했습니다. 이후 이 학습 결과를 바탕으로 실제 사내 사용을 목표로 한 v2 하네스를 별도 작업물로 발전시켰습니다.

## 2. 핵심 챌린지 및 문제 해결

### 챌린지 1: AI 컨텍스트 동기화와 Monorepo 아키텍처

#### 문제 상황

AI 에이전트 기반 개발을 사내에 안착시키기 전에, 작업자마다 로컬 AI 플러그인 환경이 달라질 경우 생산성 편차가 생길 수 있다고 판단했습니다. 또한 Front와 Back 레포지토리가 분리된 구조에서는 AI가 전체 API 스펙이나 아키텍처의 문맥을 한 번에 파악하기 힘든 한계가 있었습니다.

#### 고려한 대안과 판단

| **대안** | **접근** | **기타 사유** |
| --- | --- | --- |
| Superpowers AI | 각 로컬 환경에 개별 플러그인 설치 | 팀원별 세팅 파편화 발생, 프로젝트 전환 시 번거로움 |
| **gstack (선택)** | **레포지토리 내 \`.agents\`, \`.claude\` 등 설정 파일 직접 포함** | **Clone 즉시 동일한 AI 컨텍스트 보장, 의존성 통일** |

#### 해결 과정

- \`gstack\`을 활용해 레포지토리를 Clone 한 뒤 같은 기준의 AI 에이전트 환경에서 작업하도록 세팅을 표준화했습니다.
- Front/Back 분리 구조를 모노레포로 통합하여 관리 포인트를 줄이고, 프로젝트 진행 중 도출되는 유용한 로직은 향후 '공용 스킬'로 분리해 공유할 수 있도록 룰을 정리했습니다.

#### 결과

- 팀 단위 적용 전에 AI 개발 환경 차이를 줄일 수 있는 구조 검증
- 모노레포와 공용 스킬 구조가 AI 컨텍스트 관리에 유효하다는 점 확인

### 챌린지 2: 인프라 기술 부채 청산과 CI/CD 비용 최적화

#### 문제 상황

사내 Jenkins 서버 2대는 매월 20만 원의 유지비를 발생시키고 있었고, 여러 프로젝트가 묶여 있는 구조 때문에 동시에 업데이트가 발생하면 순차 배포 병목이 생길 수 있었습니다. v1에서는 이 문제를 실제 전환하기 전에 GitHub Actions와 Vercel CLI 기반 배포로 대체할 수 있는지 검증했습니다. 또한 Vercel은 팀원을 추가할 때마다 인당 $20의 과금이 발생하는 구조가 있어, 팀 플랜에 의존하지 않는 배포 방식도 함께 검토했습니다.

#### 고려한 대안과 판단

| **대안** | **접근** | **기타 사유** |
| --- | --- | --- |
| 현행 유지 (Jenkins) | 기존 인스턴스 스펙 업그레이드 | 고정비 추가 지출, 서버 직접 관리 리소스 지속 |
| Vercel Team Plan | Vercel의 Git Integration 공식 기능 활용 | 인원 증가 시 고정 비용 기하급수적 증가 |
| **GH Actions + Vercel CLI 커스텀** | **서버리스 CI/CD 전환 및 토큰 기반 배포 자동화** | **Jenkins 고정비 절감, Vercel 계정 추가 비용 방어** |

단순한 도구 교체가 아니라 인프라 운영 방식을 바꿀 수 있는지 확인하기 위해 GitHub Actions 마이그레이션 흐름을 검증했습니다. Vercel 역시 팀 플랜 결제 대신 메인 계정의 Token을 Actions Secrets에 등록하여 배포하는 파이프라인을 테스트했습니다.

#### 해결 과정

- \`npm ci\`와 \`actions/cache\`를 적극 도입해 \`node_modules\` 빌드 캐시 적중률을 높여 배포 속도를 최적화했습니다.
- Vercel 배포 시 \`vercel deploy --prebuilt\` 명령어와 \`--meta\` 태그를 결합하여, Vercel 서버의 빌드 큐를 거치지 않고 GitHub Actions에서 사전 빌드된 결과물만 전송하도록 파이프라인을 커스텀했습니다.
- 각 서버에 파편화되어 있던 \`.sh\` 스크립트를 범용 스크립트로 추상화하여, 파이프라인 설정만으로 즉각 대응이 가능한 구조를 완성했습니다.

#### 결과

- Jenkins 서버 2대 제거 시 **매월 20만 원의 인프라 유지 비용 절감** 가능성 확인
- Vercel 팀원 추가 비용(인당 $20)을 피하는 CLI 기반 배포 흐름 검증

> Vercel 과금 우회 전략과 서버리스 환경의 요금 시뮬레이션에 대해서는 인사이트 **[Vercel의 팀 플랜 과금 우회부터 BFF 서버리스 요금 분석까지](/insights/vercel-team-plan-bypass-and-serverless-cost-analysis)**에서 다루고 있습니다.

> Jenkins 제거 판단의 배경과 GitHub Actions 파이프라인 고도화 과정에 대해서는 인사이트 **[Jenkins 제거와 GitHub Actions CI/CD 마이그레이션](/insights/jenkins-retirement-and-github-actions-migration)**에서 다루고 있습니다.

### 챌린지 3: Zero Trust 보안 통제와 환경변수 중앙화

#### 문제 상황

GitHub Actions 러너가 사내 인스턴스에 배포하려면 22번 포트를 전면 개방하거나 방대한 IP를 화이트리스트 처리해야 하는 큰 보안 리스크가 있었습니다. 또한, 환경변수(\`.env\`)를 슬랙으로 공유하는 방식은 PRD/DEV 환경 변수가 뒤바뀌거나 업데이트가 누락될 수 있는 관리 리스크가 있었습니다.

#### 고려한 대안과 판단

| **대안** | **접근** | **기타 사유** |
| --- | --- | --- |
| 22포트 개방 / IP 화이트리스트 | 방화벽 정책 수정 및 Actions IP 대역 허용 | 외부 노출 위험 증가, 동적인 IP 관리 사실상 불가 |
| SaaS 시크릿 매니저 | 클라우드 구독형 관리 툴 사용 | 핵심 Key 외부 보관에 대한 보안 컴플라이언스 및 비용 부담 |
| **CF Tunnel + Self-hosted Infisical** | **아웃바운드 터널링 및 사내 환경변수 중앙화** | **인바운드 포트 Zero 방어, 데이터 통제권 확보** |

보안을 위해 **Cloudflare Tunnel**과 사내망에 구축한 **Infisical**을 결합했습니다. 다만 Infisical 서버가 죽었을 때 실 서비스도 함께 죽는 단일 장애점 리스크를 막기 위한 아키텍처적 타협이 필요했습니다.

#### 해결 과정

- \`ProxyCommand\`를 통해 Cloudflare 엣지 네트워크 인증을 거친 뒤 아웃바운드 터널을 타고 내부에 도달하는 **Zero Trust 아키텍처**를 구축했습니다.
- 사내 인스턴스에 Infisical을 구축해 모든 \`.env\`를 중앙화하고, 로컬 개발 시 CLI 래퍼와 \`.infisical.json\`을 통해 브랜치별 환경변수를 자동 매핑했습니다.
- SPoF 방어를 위해 런타임 의존성을 제거하고, CI/CD 빌드 타임에 스크립트를 통해 물리적 \`.env\` 파일을 직접 생성/주입하는 **로직**을 설계했습니다.

#### 결과

- 인바운드 22번 포트를 열지 않는 CI/CD 배포망 구성 가능성 확인
- 슬랙 기반 \`.env\` 공유를 Infisical 중심 관리로 대체할 수 있는 구조 검증

> WAF 바이패스, L4/L7 로드밸런싱 충돌 등 터널링 구축 과정에서의 트러블슈팅에 대해서는 인사이트 **[Cloudflare Tunnel을 활용한 Zero Trust CI/CD 구축과 트러블슈팅](/insights/cloudflare-tunnel-zero-trust-cicd-and-troubleshooting)**에서 다루고 있습니다.

> Infisical Self-Hosted 도입과 단일 장애점(SPoF) 방어를 위한 Build-Time Injection 전략에 대해서는 인사이트 **[Infisical 도입기: 환경변수 중앙화와 단일 장애점(SPoF)을 방어하는 CI/CD 아키텍처](/insights/infisical-centralized-secrets-and-spof-defense)**에서 다루고 있습니다.

## 3. 공부 회고

- **v1의 역할은 검증이었다:** v1은 팀 전체가 사용하는 도구라기보다, 혼자 여러 인프라 선택지를 테스트하며 무엇을 사내 표준으로 가져갈 수 있는지 검증한 단계였습니다. 이 과정에서 복사형 하네스의 한계, 공통 스킬 버전 드리프트, 업데이트 전파 문제를 발견했습니다.
- **v2로 이어진 설계 근거:** Jenkins 제거, GitHub Actions 단일 진입점, Infisical 중앙화, Cloudflare Tunnel, Vercel CLI 배포는 v1에서 가능성을 확인한 뒤 v2에서 사내 사용 도구로 재구성했습니다. 비용 절감도 단순 운영비 문제가 아니라, 회사 상황에 맞는 인프라 체급을 선택하는 아키텍처 판단이라는 점을 체감했습니다.`,
  },
];
