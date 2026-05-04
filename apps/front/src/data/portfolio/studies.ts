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
    title: 'AI 기반 DX 고도화 및 사내 표준 하네스(Harness) 구축',
    description:
      '파편화된 사내 프로젝트 환경을 통합하고, AI 에이전트(gstack) 기반의 개발 생산성을 극대화하기 위해 사내 표준 Harness Starter-kit을 단독 설계 및 구축한 프로젝트입니다.',
    iconName: 'Rocket',
    category: 'DevOps',
    techStack: ['GitHub Actions', 'Vercel', 'Cloudflare Tunnel', 'Infisical', 'Next.js', 'Node.js', 'Monorepo'],
    status: 'Published',
    overview:
      '인원 감축의 위기를 모노레포 아키텍처, 환경변수 중앙화, 서버리스 CI/CD 마이그레이션으로 돌파하며 월 50만 원의 인프라 비용 절감과 Zero Trust 보안을 달성했습니다.',
    period: '2026.04 (3주 ~ 4주)',
    content: `## 1. 도입 배경 및 목표

다수의 외주 및 자체 프로젝트가 동시다발적으로 진행되면서 팀원마다 개발 환경과 배포 파이프라인이 파편화되는 기술 부채가 한계에 달했습니다. 이를 해결하기 위해 프론트엔드(Next.js)와 백엔드(Node.js/Express)를 아우르는 모노레포 기반의 'Harness Starter-kit'을 주도적으로 설계했습니다. AI 에이전트 연동부터 Infisical 기반의 \`.env\` 중앙화, GitHub Actions 마이그레이션, Vercel 비용 우회까지 개발자 경험을 끌어올리기 위한 전사적 인프라 대공사를 단독으로 수행했습니다.

## 2. 핵심 챌린지 및 문제 해결

### 챌린지 1: AI 컨텍스트 동기화와 Monorepo 아키텍처

#### 문제 상황

AI 에이전트 기반 개발을 사내에 안착시키려 했으나, 작업자마다 로컬 AI 플러그인 환경이 달라 생산성 편차가 발생했습니다. 또한, 기존에는 Front와 Back 레포지토리가 분리되어 있어 AI가 전체 API 스펙이나 아키텍처의 문맥을 한 번에 파악하기 힘든 구조적 한계가 있었습니다.

#### 고려한 대안과 판단

| **대안** | **접근** | **기타 사유** |
| --- | --- | --- |
| Superpowers AI | 각 로컬 환경에 개별 플러그인 설치 | 팀원별 세팅 파편화 발생, 프로젝트 전환 시 번거로움 |
| **gstack (선택)** | **레포지토리 내 \`.agents\`, \`.claude\` 등 설정 파일 직접 포함** | **Clone 즉시 동일한 AI 컨텍스트 보장, 의존성 통일** |

#### 해결 과정

- \`gstack\`을 활용해 레포지토리를 Clone 하는 것만으로 팀원 누구나 100% 동일한 AI 에이전트 환경에서 작업하도록 세팅을 표준화했습니다.
- Front/Back 분리 구조를 모노레포로 통합하여 관리 포인트를 줄이고, 프로젝트 진행 중 도출되는 유용한 로직은 '공용 스킬'로 분리해 팀원 간 공유하도록 룰을 정립했습니다.

#### 결과

- 팀원 간 AI 개발 환경 동기화 완수 및 프로젝트 초기 세팅 시간 대폭 단축
- 인원 감축 상황에서도 모노레포를 통한 관리 리소스 방어 및 AI 코드 작성 정확도 향상

### 챌린지 2: 인프라 기술 부채 청산과 CI/CD 비용 최적화

#### 문제 상황

배포를 위해 가동 중인 3대의 Jenkins 노드 서버는 잦은 OOM(Out of Memory) 병목을 일으켰고 매월 50만 원의 유지비를 발생시켰습니다. 대체재로 Vercel을 도입하려 했으나, 팀원을 추가할 때마다 인당 $20의 과금이 발생하는 Vercel 팀 플랜의 구조적 함정이 있어 무작정 확장하기 부담스러운 상황이었습니다.

#### 고려한 대안과 판단

| **대안** | **접근** | **기타 사유** |
| --- | --- | --- |
| 현행 유지 (Jenkins) | 기존 인스턴스 스펙 업그레이드 | 고정비 추가 지출, 서버 직접 관리 리소스 지속 |
| Vercel Team Plan | Vercel의 Git Integration 공식 기능 활용 | 인원 증가 시 고정 비용 기하급수적 증가 |
| **GH Actions + Vercel CLI 커스텀** | **서버리스 CI/CD 전환 및 토큰 기반 배포 자동화** | **인프라 유지비 0원, Vercel 계정 추가 비용 완벽 방어** |

단순한 도구 교체가 아니라 인프라의 체질을 바꾸기 위해 Jenkins를 과감히 폐기하고 GitHub Actions로 마이그레이션했습니다. Vercel 역시 팀 플랜 결제 대신 메인 계정의 Token을 Actions Secrets에 등록하여 우회 배포하는 파이프라인을 구축했습니다.

#### 해결 과정

- \`npm ci\`와 \`actions/cache\`를 적극 도입해 \`node_modules\` 빌드 캐시 적중률을 높여 배포 속도를 최적화했습니다.
- Vercel 배포 시 \`vercel deploy --prebuilt\` 명령어와 \`--meta\` 태그를 결합하여, Vercel 서버의 빌드 큐를 거치지 않고 GitHub Actions에서 사전 빌드된 결과물만 전송하도록 파이프라인을 커스텀했습니다.
- 각 서버에 파편화되어 있던 \`.sh\` 스크립트를 범용 스크립트로 추상화하여, 파이프라인 설정만으로 즉각 대응이 가능한 구조를 완성했습니다.

#### 결과

- 3대의 Jenkins 서버 폐기로 **매월 50만 원 이상의 인프라 유지 비용 영구 절감**
- Vercel 팀원 추가 비용(인당 $20) 방어 및 핫픽스 동시 빌드 병목 현상 완벽 해소

> Vercel 과금 우회 전략과 서버리스 환경의 요금 시뮬레이션에 대해서는 인사이트 **[Vercel의 팀 플랜 과금 우회부터 BFF 서버리스 요금 분석까지](/insights/vercel-team-plan-bypass-and-serverless-cost-analysis)**에서 다루고 있습니다.

> Jenkins 폐기 결단의 배경과 GitHub Actions 파이프라인 고도화 과정에 대해서는 인사이트 **[과감한 Jenkins 폐기와 CI/CD 마이그레이션](/insights/jenkins-retirement-and-github-actions-migration)**에서 다루고 있습니다.

### 챌린지 3: Zero Trust 보안 통제와 환경변수 중앙화

#### 문제 상황

GitHub Actions 러너가 사내 인스턴스에 배포하려면 22번 포트를 전면 개방하거나 방대한 IP를 화이트리스트 처리해야 하는 치명적인 보안 리스크가 있었습니다. 또한, 환경변수(\`.env\`)를 슬랙으로 공유하다 보니 PRD/DEV 환경 변수가 뒤바뀌거나 업데이트가 누락되는 대형 휴먼 에러가 빈번했습니다.

#### 고려한 대안과 판단

| **대안** | **접근** | **기타 사유** |
| --- | --- | --- |
| 22포트 개방 / IP 화이트리스트 | 방화벽 정책 수정 및 Actions IP 대역 허용 | 외부 노출 위험 극대화, 동적인 IP 관리 사실상 불가 |
| SaaS 시크릿 매니저 | 클라우드 구독형 관리 툴 사용 | 핵심 Key 외부 보관에 대한 보안 컴플라이언스 및 비용 부담 |
| **CF Tunnel + Self-hosted Infisical** | **아웃바운드 터널링 및 사내 환경변수 중앙화** | **인바운드 포트 Zero 방어, 데이터 통제권 확보** |

보안을 위해 **Cloudflare Tunnel**과 사내망에 구축한 **Infisical**을 결합했습니다. 다만 Infisical 서버가 죽었을 때 실 서비스도 함께 죽는 단일 장애점 리스크를 막기 위한 아키텍처적 타협이 필요했습니다.

#### 해결 과정

- \`ProxyCommand\`를 통해 Cloudflare 엣지 네트워크 인증을 거친 뒤 아웃바운드 터널을 타고 내부에 도달하는 **Zero Trust 아키텍처**를 구축했습니다.
- 사내 인스턴스에 Infisical을 구축해 모든 \`.env\`를 중앙화하고, 로컬 개발 시 CLI 래퍼와 \`.infisical.json\`을 통해 브랜치별 환경변수를 자동 매핑했습니다.
- SPoF 방어를 위해 런타임 의존성을 제거하고, CI/CD 빌드 타임에 스크립트를 통해 물리적 \`.env\` 파일을 직접 생성/주입하는 **로직**을 설계했습니다.

#### 결과

- 인바운드 22번 포트 단 한 개도 개방하지 않고 안전한 CI/CD 배포망 구축 완료
- 슬랙을 통한 \`.env\` 공유 중단으로 환경변수 관련 배포 사고율 0% 달성

> WAF 바이패스, L4/L7 로드밸런싱 충돌 등 터널링 구축 과정에서의 트러블슈팅에 대해서는 인사이트 **[Cloudflare Tunnel을 활용한 Zero Trust CI/CD 구축과 3번의 삽질](/insights/cloudflare-tunnel-zero-trust-cicd-and-troubleshooting)**에서 다루고 있습니다.

> Infisical Self-Hosted 도입과 단일 장애점(SPoF) 방어를 위한 Build-Time Injection 전략에 대해서는 인사이트 **[Infisical 도입기: 환경변수 중앙화와 단일 장애점(SPoF)을 방어하는 CI/CD 아키텍처](/insights/infisical-centralized-secrets-and-spof-defense)**에서 다루고 있습니다.

## 3. 공부 회고

- **개발자 경험의 상향 평준화:** 복잡했던 배포 보안 계층과 환경변수 관리가 하네스 파이프라인 뒤로 완벽히 캡슐화되었습니다. 덕분에 팀원들은 인프라 고민 없이 오직 비즈니스 로직에만 집중할 수 있는 쾌적한 환경을 얻게 되었습니다.
- **비용 절감도 아키텍처의 일부다:** Jenkins 서버를 서버리스로 전환하고, Vercel 계정 과금을 토큰으로 방어하는 치열한 과정을 통해, 엔지니어링이 단순히 코드를 짜는 것을 넘어 '회사의 자본 효율을 최적화하는 과정'임을 뼈저리게 체감했습니다.`,
  },
];
