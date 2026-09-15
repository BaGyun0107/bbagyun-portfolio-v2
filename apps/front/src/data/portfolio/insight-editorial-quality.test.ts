import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

import InsightDetailPage, {
  generateStaticParams as generateInsightStaticParams
} from '@/app/(public)/insights/[slug]/page';

import { REAL_INSIGHTS } from './insights';

import { getAllFeatures, getAllInsights, getAllStudies } from './index';

type VisualKind =
  | 'swimlane'
  | 'sequence'
  | 'erd'
  | 'architecture'
  | 'data-flow'
  | 'state-transition'
  | 'decision-matrix'
  | 'timeline';

type VisualAssessment =
  | { decision: 'not-needed'; rationale: string }
  | { decision: 'recommended'; kind?: VisualKind; rationale: string }
  | {
      decision: 'provided';
      kind?: VisualKind;
      rationale: string;
      question?: string;
      textAlternative?: string;
      nonDuplicationReason?: string;
    };

type EditorialMetadata =
  | { type: 'project-case'; visualAssessment: VisualAssessment }
  | { type: 'technical-exploration'; independentReason?: string; visualAssessment: VisualAssessment };

type VisualFixture =
  | {
      id: string;
      variant: 'data-flow';
      title: string;
      question: string;
      textAlternative: string;
      nodes: { id: string; label: string; detail: string; role: 'state' | 'data' | 'action' | 'terminal' }[];
      edges: {
        id: string;
        from: string;
        to: string;
        label: string;
        outcome: 'normal' | 'success' | 'failure' | 'retry';
      }[];
    }
  | {
      id: string;
      variant: 'before-after';
      title: string;
      question: string;
      textAlternative: string;
      panels: {
        id: 'before' | 'after';
        title: string;
        summary: string;
        actors: {
          id: string;
          label: string;
          role: 'server' | 'room' | 'recipient' | 'unrelated' | 'source' | 'relay' | 'boundary' | 'consumer';
        }[];
        connections: {
          id: string;
          from: string;
          to: string;
          label: string;
          scope: 'intended' | 'overbroad' | 'indirect' | 'direct';
        }[];
      }[];
    };

type EditorialInsightFixture = {
  slug: string;
  route?: string;
  content?: string;
  featureSlug?: string | null;
  studySlug?: string | null;
  editorial?: EditorialMetadata | null;
  visual?: VisualFixture | null;
};

type LegacyPreservationFixture = {
  slug: string;
  route: string;
  contentHash: string;
};

type EditorialValidationModule = {
  validateInsightEditorial: (
    insight: EditorialInsightFixture,
    featureSlugs: ReadonlySet<string>,
    studySlugs: ReadonlySet<string>
  ) => string[];
  validateMigratedInsightSet: (
    insights: readonly EditorialInsightFixture[],
    featureSlugs: ReadonlySet<string>,
    studySlugs: ReadonlySet<string>,
    legacyFixtures: readonly LegacyPreservationFixture[],
    hashContent: (content: string) => string
  ) => string[];
};

type InsightInventoryItem = {
  slug: string;
  title: string;
  route: string;
  sourceSlug: string | null;
  contentSha256?: string;
};

type MeaningContract = {
  slug: string;
  meanings: {
    role: RegExp;
    problem: RegExp;
    constraint: RegExp;
    implementation: RegExp;
    outcome: RegExp;
    limitation: RegExp;
  };
};

const TARGET_INSIGHTS = [
  {
    slug: 'codi-harness-dx-platform-design',
    type: 'project-case',
    sourceSlug: 'codi-harness-dx-platform',
    visualDecision: 'provided',
    visualKind: 'timeline',
    rationaleContext: /하네스|발전|단계|시간/
  },
  {
    slug: 'infisical-centralized-secrets-and-spof-defense',
    type: 'project-case',
    sourceSlug: 'codi-harness-dx-platform',
    visualDecision: 'provided',
    visualKind: 'architecture',
    rationaleContext: /Infisical|시크릿|환경변수|소유권|배포|복구/
  },
  {
    slug: 'cloudflare-tunnel-zero-trust-cicd-and-troubleshooting',
    type: 'project-case',
    sourceSlug: 'codi-harness-dx-platform',
    visualDecision: 'provided',
    visualKind: 'data-flow',
    rationaleContext: /Cloudflare|WAF|Bastion|인증|권한|배포/
  },
  {
    slug: 'jenkins-retirement-and-github-actions-migration',
    type: 'project-case',
    sourceSlug: 'codi-harness-dx-platform',
    visualDecision: 'provided',
    visualKind: 'data-flow',
    rationaleContext:
      /^(?=[\s\S]*Jenkins)(?=[\s\S]*(?:단일 slave|slave 1개|순차 대기열|순차 실행))(?=[\s\S]*(?:변경 범위|변경[^.\n]*(?:대상|영향)|배포 대상[^.\n]*계산))(?=[\s\S]*matrix)(?=[\s\S]*(?:병렬|배포 단위))[\s\S]+$/i
  },
  {
    slug: 'logging-decoupling-and-buffering-in-external-api-systems',
    type: 'project-case',
    sourceSlug: 'the-siena-golf-reservation',
    visualDecision: 'provided',
    visualKind: 'architecture',
    rationaleContext: /업무 DB|syslog|로그|저장|경계/
  },
  {
    slug: 'optimizing-770k-text-search-in-rdbms',
    type: 'project-case',
    sourceSlug: 'hanmaum-science-institute',
    visualDecision: 'provided',
    visualKind: 'timeline',
    rationaleContext: /검색|LIKE|FULLTEXT|시간|단계/
  },
  {
    slug: 'spa-api-key-exposure-and-bff-architecture',
    type: 'project-case',
    sourceSlug: 'blackstone-belleforet-resort',
    visualDecision: 'recommended',
    visualKind: 'architecture',
    rationaleContext: /API Key|BFF|브라우저|서버|경계/
  },
  {
    slug: 'sso-authentication-and-soft-fk',
    type: 'project-case',
    sourceSlug: 'integrated-sso-server',
    visualDecision: 'provided',
    visualKind: 'data-flow',
    rationaleContext: /UUID|Soft FK|로그인 ID|읽기 모델|Batch API|조회/
  },
  {
    slug: 'json-outbox-pattern-for-settlement',
    type: 'project-case',
    sourceSlug: 'hipass-b2b-platform',
    visualDecision: 'provided',
    visualKind: 'data-flow',
    rationaleContext: /DB|JSON|정산|재처리/
  },
  {
    slug: 'socketio-realtime-architecture-and-reliability',
    type: 'project-case',
    sourceSlug: 'hipass-b2b-platform',
    visualDecision: 'provided',
    visualKind: 'architecture',
    rationaleContext: /공용 Room|User Room|수신 대상|전달 범위/
  },
  {
    slug: 'config-driven-architecture-react',
    type: 'project-case',
    sourceSlug: 'hotel-reservation-platform',
    visualDecision: 'provided',
    visualKind: 'data-flow',
    rationaleContext: /Config|core|rsConfig|platform|분류|경계/
  },
  {
    slug: 'context-api-encapsulation-and-router-level-isolation',
    type: 'project-case',
    sourceSlug: 'hotel-reservation-platform',
    visualDecision: 'provided',
    visualKind: 'architecture',
    rationaleContext: /Props|중간 컴포넌트|예약 라우터|Provider|직접 소비/
  },
  {
    slug: 'nestjs-middleware-vs-guard-tradeoff',
    type: 'project-case',
    sourceSlug: 'integrated-reservation-platform',
    visualDecision: 'provided',
    visualKind: 'architecture',
    rationaleContext: /Middleware|Guard|인증|권한|요청 생명주기/
  },
  {
    slug: 'nextjs-nestjs-domain-separation-and-bff',
    type: 'project-case',
    sourceSlug: 'integrated-reservation-platform',
    visualDecision: 'provided',
    visualKind: 'architecture',
    rationaleContext: /브라우저|Origin|reverse proxy|Cloudflare|네트워크 경계/
  },
  {
    slug: 'https-and-plaintext-password-transmission',
    type: 'project-case',
    sourceSlug: 'integrated-reservation-platform',
    visualDecision: 'not-needed',
    visualKind: undefined,
    rationaleContext: /Payload|TLS|bcrypt|문장|시각적으로/
  },
  {
    slug: 'vercel-team-plan-bypass-and-serverless-cost-analysis',
    type: 'technical-exploration',
    sourceSlug: 'ai-dx-harness-starter-kit',
    visualDecision: 'not-needed',
    visualKind: undefined,
    rationaleContext: /Vercel|가격|비용|조건|본문|표/
  }
] as const;

const INSIGHT_INVENTORY: readonly InsightInventoryItem[] = [
  {
    slug: 'codi-harness-dx-platform-design',
    title: 'DX 하네스 v2: 복사형 도구에서 사내 개발 운영 플랫폼까지',
    route: '/insights/codi-harness-dx-platform-design',
    sourceSlug: 'codi-harness-dx-platform'
  },
  {
    slug: 'logging-decoupling-and-buffering-in-external-api-systems',
    title: '로그는 남기는 것보다 조회할 수 있어야 한다: 외부 API 로그 분리기',
    route: '/insights/logging-decoupling-and-buffering-in-external-api-systems',
    sourceSlug: 'the-siena-golf-reservation'
  },
  {
    slug: 'optimizing-770k-text-search-in-rdbms',
    title: 'LIKE에서 FULLTEXT·토큰 검증까지: RDBMS 검색을 단계적으로 개선한 과정',
    route: '/insights/optimizing-770k-text-search-in-rdbms',
    sourceSlug: 'hanmaum-science-institute'
  },
  {
    slug: 'spa-api-key-exposure-and-bff-architecture',
    title: 'React API Key 노출을 서버 경계로 옮기며 배운 BFF의 필요성',
    route: '/insights/spa-api-key-exposure-and-bff-architecture',
    sourceSlug: 'blackstone-belleforet-resort'
  },
  {
    slug: 'sso-authentication-and-soft-fk',
    title: 'UUID Soft FK만으로는 부족했다: 분리된 회원 데이터의 조회 경계',
    route: '/insights/sso-authentication-and-soft-fk',
    sourceSlug: 'integrated-sso-server'
  },
  {
    slug: 'json-outbox-pattern-for-settlement',
    title: '정산 상태는 DB에, 재처리 입력은 JSON에 둔 이유',
    route: '/insights/json-outbox-pattern-for-settlement',
    sourceSlug: 'hipass-b2b-platform'
  },
  {
    slug: 'config-driven-architecture-react',
    title: 'Config 이후의 경계: 멀티플랫폼 React를 core·rsConfig·platform으로 나눈 이유',
    route: '/insights/config-driven-architecture-react',
    sourceSlug: 'hotel-reservation-platform'
  },
  {
    slug: 'context-api-encapsulation-and-router-level-isolation',
    title: 'Props Drilling을 줄이기 위해 예약 Context의 생명주기를 라우터에 둔 이유',
    route: '/insights/context-api-encapsulation-and-router-level-isolation',
    sourceSlug: 'hotel-reservation-platform'
  },
  {
    slug: 'nestjs-middleware-vs-guard-tradeoff',
    title: 'NestJS 인증은 Middleware와 Guard 중 하나를 고르는 문제가 아니었다',
    route: '/insights/nestjs-middleware-vs-guard-tradeoff',
    sourceSlug: 'integrated-reservation-platform'
  },
  {
    slug: 'nextjs-nestjs-domain-separation-and-bff',
    title: '[Next.js x NestJS] 프론트엔드와 백엔드의 도메인 분리와 BFF 설계',
    route: '/insights/nextjs-nestjs-domain-separation-and-bff',
    sourceSlug: 'integrated-reservation-platform'
  },
  {
    slug: 'https-and-plaintext-password-transmission',
    title: '구글과 네이버는 왜 비밀번호를 평문으로 보낼까? (개발자 도구의 착시와 HTTPS의 진실)',
    route: '/insights/https-and-plaintext-password-transmission',
    sourceSlug: 'integrated-reservation-platform'
  },
  {
    slug: 'ai-vibe-coding',
    title: 'AI 에이전트로 포트폴리오 구축하기: 아키텍트의 역할과 검증 기준',
    route: '/insights/ai-vibe-coding',
    sourceSlug: null,
    contentSha256: '9c2a61cd4570edeea5e68a0362718e524f6d75d12f4a1f5b3ff888d9a39e8b62'
  },
  {
    slug: 'socketio-realtime-architecture-and-reliability',
    title: '공용 Room에서 화원별 User Room으로: 전달 범위와 전달 보장은 다르다',
    route: '/insights/socketio-realtime-architecture-and-reliability',
    sourceSlug: 'hipass-b2b-platform'
  },
  {
    slug: 'vercel-team-plan-bypass-and-serverless-cost-analysis',
    title: 'Vercel Developer Seat 비용 조건과 Custom CI 배포 검증',
    route: '/insights/vercel-team-plan-bypass-and-serverless-cost-analysis',
    sourceSlug: 'ai-dx-harness-starter-kit'
  },
  {
    slug: 'infisical-centralized-secrets-and-spof-defense',
    title: '환경변수 중앙화는 저장보다 경계 설계다: Infisical Self-Hosted 도입기',
    route: '/insights/infisical-centralized-secrets-and-spof-defense',
    sourceSlug: 'codi-harness-dx-platform'
  },
  {
    slug: 'cloudflare-tunnel-zero-trust-cicd-and-troubleshooting',
    title: 'Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다',
    route: '/insights/cloudflare-tunnel-zero-trust-cicd-and-troubleshooting',
    sourceSlug: 'codi-harness-dx-platform'
  },
  {
    slug: 'jenkins-retirement-and-github-actions-migration',
    title: 'GitHub Actions 전환보다 중요했던 배포 단위 재설계',
    route: '/insights/jenkins-retirement-and-github-actions-migration',
    sourceSlug: 'codi-harness-dx-platform'
  }
] as const;

const FEATURE_SLUGS = new Set(getAllFeatures().map(({ slug }) => slug));
const STUDY_SLUGS = new Set(getAllStudies().map(({ slug }) => slug));
const targetSlugSet = new Set<string>(TARGET_INSIGHTS.map(({ slug }) => slug));

const PROJECT_CASE_MEANING_CONTRACTS: readonly MeaningContract[] = [
  {
    slug: 'codi-harness-dx-platform-design',
    meanings: {
      role: /공통 정책과 소유권 경계[^#]*직접 설계하고 구현/,
      problem: /Jenkins 서버와 플러그인을 직접 관리해야 하는 부담/,
      constraint: /프로젝트가 작성한 파일[^.]*공통 업데이트가 덮어쓰지 않도록/,
      implementation: /harness\.lock|\.\/harness doctor/,
      outcome: /2026-08-20 기준[^.]*11개 프로젝트[^.]*8개[^.]*팀원 3명/,
      limitation: /모든 하네스 프로젝트의 기본 기능이 아닙니다|자동으로 판단하는 문제는 해결하지 못했습니다/
    }
  },
  {
    slug: 'infisical-centralized-secrets-and-spof-defense',
    meanings: {
      role: /시크릿 구조와 CI\/CD 조회 흐름을 직접 설계하고 구현/,
      problem: /다른 호텔의 환경변수[^#]*약 10분[^#]*운영 서비스 장애/,
      constraint: /정확한 원인은 끝까지 규명하지 못|Jenkins 자체 오류라고 단정할 근거는 없/,
      implementation: /프로젝트, 환경과 실행 목적[^#]*\/frontend\/github-actions[^#]*Shared-Secrets/,
      outcome: /별도의 테스트 프로젝트와 서버[^#]*기존에 실행 중이던 테스트 서비스[^#]*정상적으로 동작/,
      limitation: /데이터베이스와 백업 파일이 함께 삭제되면[^#]*복구할 방법이 없/
    }
  },
  {
    slug: 'cloudflare-tunnel-zero-trust-cicd-and-troubleshooting',
    meanings: {
      role: /Cloudflare Tunnel[^#]*Bastion[^#]*직접 설계하고 구현/,
      problem:
        /WAF에서 차단된 기록[\s\S]*?같은 hostname[^#]*서로 다른 서버의 Tunnel connector[^#]*의도하지 않은 (?:connector|방향)[^#]*SSH 연결\s+단계에서 실패했습니다/,
      constraint:
        /잘못된 서버에 서비스가\s+배포되지는 않았습니다[^#]*(?:Cloudflare가 내부[^#]*(?:알고리즘|라우팅)[^#]*(?:단정하지 않습니다|단정하지 않)|내부에서 어떤 알고리즘[^#]*단정하지 않습니다)/,
      implementation:
        /Service Token[^#]*배포 전용 사용자 shell 실행 차단[^#]*PermitOpen[^#]*프로젝트\s*[×x]\s*배포 서버별 SSH 키/,
      outcome: /2026-08-27[^#]*9개 프로젝트[^#]*5대 서버[^#]*동일 유형 문제[^#]*(?:다시 발견하지 못|재발하지 않)/,
      limitation:
        /Bastion이\s+중단되면[^#]*(?:새 배포|신규 배포)[^#]*(?:함께 )?막힙니다[^#]*실제 Bastion 중단이나 장애 상황을 테스트해\s+확인한 결과는 아닙니다/
    }
  },
  {
    slug: 'jenkins-retirement-and-github-actions-migration',
    meanings: {
      role: /기존 Jenkins 구성[^#]*설계하거나 설정한 영역이 아니[^#]*workflow 설계부터 담당/,
      problem: /Jenkins slave[^#]*호텔별로 순차 실행/,
      constraint: /공통 코드[^#]*다섯 호텔별 코드[^#]*거의 마지막에 이전/,
      implementation: /변경 파일[^#]*배포 대상 플랫폼[^#]*GitHub Actions matrix[^#]*독립된 matrix job/,
      outcome:
        /^(?=[\s\S]*실행 화면[^.\n]*(?:비교한 관찰값|약 3분이 걸리는 것을 확인))(?=[\s\S]*약 15분[\s\S]*약 3분)(?=[\s\S]*평균이나 통제된 성능 실험은 아닙니다)(?=[\s\S]*80% 개선[^.\n]*일반화하지 않습니다)[\s\S]+$/,
      limitation:
        /^(?=[\s\S]*특정 호텔 job이 실패하더라도[^.\n]*즉시 취소하지 않도록)(?=[\s\S]*의도적으로 실패시키지는 않았[^.\n]*다른 호텔의 완료 여부[^.\n]*대조한 기록도 없습니다)(?=[\s\S]*설정과 실행 구조의 의도로만 설명[^.\n]*검증된 장애 격리 성과로 확대하지 않)(?=[\s\S]*평균이나 통제된 성능 실험은 아닙니다)(?=[\s\S]*서로 독립적이고[^.\n]*영향을 주는지 계산할 수 있을 때)(?=[\s\S]*순서가 필요[^.\n]*정확히 구분할 수 없다면)[\s\S]+$/
    }
  },
  {
    slug: 'logging-decoupling-and-buffering-in-external-api-systems',
    meanings: {
      role: /로그 저장 경로를 분리하는 방향을 정하고 직접 구현/,
      problem: /수백만 건[^#]*DB GUI가 다운/,
      constraint: /예약 기능 자체에 미친 영향은 거의 없|필요한 시점에 조회할 수 없/,
      implementation: /업무 DB[^#]*syslog\(\)/,
      outcome: /시스템 로그에서 해당 요청과 응답을 직접 확인/,
      limitation: /처리 시간 단축이나 장애 감소율을 별도로 측정하지는 않았/
    }
  },
  {
    slug: 'optimizing-770k-text-search-in-rdbms',
    meanings: {
      role: /백엔드와 검색 구조를 혼자 담당/,
      problem: /2023년[^#]*약 1500ms/,
      constraint: /별도의 검색 엔진을 운영하는 비용과 인프라 복잡성|기존 MySQL 환경/,
      implementation: /두 글자 이상[^#]*FULLTEXT[^#]*모든 토큰[^#]*LIKE/,
      outcome: /약 1500ms에서 약 400ms/,
      limitation: /정확한 표본 수와 평균은 복원되지 않았으므로|Elasticsearch는 아직 직접 사용해 보지 않았습니다/
    }
  },
  {
    slug: 'spa-api-key-exposure-and-bff-architecture',
    meanings: {
      role: /모든 요청을 PHP Proxy로 보내도록 변경/,
      problem: /개발계 테스트[^#]*빌드[^#]*API Key/,
      constraint: /API Key·Secret·인증 헤더[^#]*반드시 서버/,
      implementation: /JWT 쿠키 검증[^#]*PHP 미들웨어[^#]*외부 API[^#]*내부 API/,
      outcome: /API Key가 React 빌드 결과에 포함되는 경로를 서버 쪽으로 옮겼/,
      limitation: /제3자가 키를 악용한 일은 없|당시 구현을 BFF였다고 소급해 부르지는 않습니다/
    }
  },
  {
    slug: 'nestjs-middleware-vs-guard-tradeoff',
    meanings: {
      role: /관리자 인증을 구현|AdminAuthMiddleware/,
      problem: /Express[^#]*NestJS[^#]*Middleware/,
      constraint: /충분히 비교[^#]*(?:아니|못)|사후에 합리화/,
      implementation: /(?=[\s\S]*AdminAuthMiddleware)(?=[\s\S]*req\.user)(?=[\s\S]*AdminLevelGuard)/,
      outcome: /코드에 반영[^#]*운영 안전성[^#]*확대하지 않/,
      limitation: /Global Auth Guard[^#]*다시 구현하거나 운영으로 검증[^#]*아니/
    }
  },
  {
    slug: 'nextjs-nestjs-domain-separation-and-bff',
    meanings: {
      role: /행사 호텔 예약·결제 플랫폼/,
      problem: /A-domain\.com[^#]*api\.A-domain\.com[^#]*쿠키[^#]*(?:저장|전달)/,
      constraint: /정확한 실패 원인[^#]*단정하지 않/,
      implementation: /(?=[\s\S]*\/bff)(?=[\s\S]*Next\.js rewrite)(?=[\s\S]*Cloudflare)(?=[\s\S]*고정 IP)/,
      outcome: /고객사 스테이징[^#]*(?:다시 확인|복구)/,
      limitation: /정식 운영 전에 보류[^#]*운영 트래픽과 성능 결과도 없/
    }
  },
  {
    slug: 'https-and-plaintext-password-transmission',
    meanings: {
      role: /비밀번호[^#]*브라우저[^#]*암호화[^#]*직접 구현/,
      problem: /Request Payload[^#]*네트워크[^#]*오해/,
      constraint: /프론트엔드 코드[^#]*키[^#]*비밀 경계[^#]*어려웠/,
      implementation: /비밀번호 전송[^#]*암호화를 제거[^#]*bcrypt/,
      outcome: /전송 구간[^#]*HTTPS[^#]*저장 구간[^#]*단방향 해시/,
      limitation: /예약 임시 데이터[^#]*AES[^#]*남아|모든 애플리케이션 계층 암호화[^#]*일반화하지 않/
    }
  }
] as const;

const validVisual: VisualAssessment = {
  decision: 'not-needed',
  rationale: '단순한 순차 설명만으로 핵심 판단을 이해할 수 있습니다.'
};

const projectCase = (overrides: Partial<EditorialInsightFixture> = {}): EditorialInsightFixture => ({
  slug: 'project-case-fixture',
  featureSlug: 'codi-harness-dx-platform',
  editorial: { type: 'project-case', visualAssessment: validVisual },
  ...overrides
});

const technicalExploration = (overrides: Partial<EditorialInsightFixture> = {}): EditorialInsightFixture => ({
  slug: 'technical-exploration-fixture',
  studySlug: 'ai-dx-harness-starter-kit',
  editorial: { type: 'technical-exploration', visualAssessment: validVisual },
  ...overrides
});

let editorialModule: EditorialValidationModule | null = null;

beforeAll(async () => {
  const moduleUrl = new URL('./insight-editorial.ts', import.meta.url);
  if (!existsSync(fileURLToPath(moduleUrl))) return;

  editorialModule = (await import(/* @vite-ignore */ moduleUrl.href)) as EditorialValidationModule;
});

const getValidator = () => {
  const validator = editorialModule?.validateInsightEditorial;
  expect(validator, 'editorial validator가 아직 구현되지 않았습니다.').toEqual(expect.any(Function));
  return validator;
};

const getSetValidator = () => {
  const validator = editorialModule?.validateMigratedInsightSet;
  expect(validator, 'migration 집합 validator가 아직 구현되지 않았습니다.').toEqual(expect.any(Function));
  return validator;
};

const hashContent = (content: string) => createHash('sha256').update(content).digest('hex');

const LEGACY_PRESERVATION_FIXTURES: readonly LegacyPreservationFixture[] = INSIGHT_INVENTORY.filter(
  (item): item is InsightInventoryItem & { contentSha256: string } => Boolean(item.contentSha256)
).map(({ slug, route, contentSha256 }) => ({ slug, route, contentHash: contentSha256 }));

const insightSetFixture = (): EditorialInsightFixture[] =>
  getAllInsights().map((insight) => ({
    ...insight,
    route: `/insights/${insight.slug}`,
    editorial: insight.editorial
      ? {
          ...insight.editorial,
          visualAssessment: { ...insight.editorial.visualAssessment }
        }
      : null
  }));

describe('호텔 예약 플랫폼 코드 경계 인사이트 계약', () => {
  const insight = () => getAllInsights().find(({ slug }) => slug === 'config-driven-architecture-react');

  it('Config 이후의 세 코드 배치 기준을 프로젝트 사례로 공개한다', () => {
    const target = insight();
    const publicText = `${target?.excerpt ?? ''}\n${target?.content ?? ''}`;

    expect(target?.title).toBe('Config 이후의 경계: 멀티플랫폼 React를 core·rsConfig·platform으로 나눈 이유');
    expect(target?.featureSlug).toBe('hotel-reservation-platform');
    expect(target?.editorial).toMatchObject({
      type: 'project-case',
      visualAssessment: {
        decision: 'provided',
        kind: 'data-flow',
        question: '공통 동작, 값 차이, 화면·로직 차이는 각각 어디에 배치할 것인가?',
        nonDuplicationReason: expect.stringMatching(/작업물[^.]*연혁|코드 배치 기준/)
      }
    });
    expect(publicText).toMatch(/모든 플랫폼[^#]*core[^#]*값[^#]*rsConfig[^#]*화면·로직[^#]*platform/i);
    expect(publicText).toMatch(/플랫폼별[^.\n]*(?:빌드|build)[^.\n]*(?:배포|deploy)/i);
    expect(publicText).toMatch(/runtime|런타임[^#]*(?:그대로 적용하지|적합하지)/i);
    expect(publicText).toMatch(/contract|계약[^#]*(?:행동|패리티)[^#]*(?:검증|비용)/i);
    expect(publicText).not.toMatch(/NICEPAY|ReservationProvider|Props Drilling|역할과 책임|2024년|2025년/);
    expect(publicText).not.toMatch(/코드 수정 없이|배포 없이|N건\s*→\s*0건|단일 배포/);
  });

  it('코드 경계 visual은 정상 분류 관계만 사용한다', () => {
    const visual = insight()?.visual;

    expect(visual?.variant).toBe('data-flow');
    if (visual?.variant !== 'data-flow') return;
    expect(visual.nodes.map(({ label }) => label)).toEqual(
      expect.arrayContaining(['변경 요구', '차이 분류', 'core', 'rsConfig', 'platform'])
    );
    expect(visual.edges.every(({ outcome }) => outcome === 'normal')).toBe(true);
    expect(visual.edges.map(({ label }) => label)).toEqual(
      expect.arrayContaining(['모든 플랫폼 공통', '값만 다름', '화면·로직 차이'])
    );
  });
});

describe('호텔 예약 플랫폼 route-scoped Context 인사이트 계약', () => {
  const insight = () =>
    getAllInsights().find(({ slug }) => slug === 'context-api-encapsulation-and-router-level-isolation');

  it('Props Drilling과 예약 상태 생명주기 경계만 프로젝트 사례로 공개한다', () => {
    const target = insight();
    const publicText = `${target?.excerpt ?? ''}\n${target?.content ?? ''}`;

    expect(target?.title).toBe('Props Drilling을 줄이기 위해 예약 Context의 생명주기를 라우터에 둔 이유');
    expect(target?.featureSlug).toBe('hotel-reservation-platform');
    expect(target?.editorial).toMatchObject({
      type: 'project-case',
      visualAssessment: {
        decision: 'provided',
        kind: 'architecture',
        question: '예약 단계가 공유하는 상태의 소유 범위와 전달 경로를 어디에 둘 것인가?',
        nonDuplicationReason: expect.stringMatching(/플랫폼 코드 경계|상태 전달/)
      }
    });
    expect(publicText).toMatch(/Props Drilling/);
    expect(publicText).toMatch(/Redux[^#]*(?:선택하지|도입하지)/);
    expect(publicText).toMatch(/예약 라우터[^#]*ReservationProvider[^#]*useReservation/);
    expect(publicText).toMatch(/중간 컴포넌트[^#]*props[^#]*(?:줄|제거)/i);
    expect(publicText).toMatch(/생명주기/);
    expect(publicText).toMatch(/접근 권한[^#]*(?:아니|보장하지)/);
    expect(publicText).toMatch(/성능[^#]*(?:자동|보장하지)/);
    expect(publicText).not.toMatch(/Provider Hell|Zustand|React Query|NICEPAY|가격·재고|PG 승인/);
    expect(publicText).not.toMatch(/순차성[^#]*(?:보장|강제)|리렌더링[^#]*(?:개선|제거|최적화)/);
  });

  it('Before 간접 전달과 After 직접 소비 관계를 분리한다', () => {
    const visual = insight()?.visual;

    expect(visual?.variant).toBe('before-after');
    if (visual?.variant !== 'before-after') return;
    expect(visual.panels.map(({ id }) => id)).toEqual(['before', 'after']);
    expect(visual.panels[0].actors.map(({ role }) => role)).toEqual(['source', 'relay', 'consumer']);
    expect(visual.panels[0].connections.every(({ scope }) => scope === 'indirect')).toBe(true);
    expect(visual.panels[1].actors.map(({ role }) => role)).toEqual(['boundary', 'consumer']);
    expect(visual.panels[1].connections.every(({ scope }) => scope === 'direct')).toBe(true);
  });
});

describe('호텔 예약 플랫폼 세 시각 자료의 비중복 계약', () => {
  it('두 인사이트의 질문과 비중복 이유가 서로 다르고 NICEPAY visual은 만들지 않는다', () => {
    const targets = [
      getAllInsights().find(({ slug }) => slug === 'config-driven-architecture-react'),
      getAllInsights().find(({ slug }) => slug === 'context-api-encapsulation-and-router-level-isolation')
    ];
    const assessments = targets.map((target) => target?.editorial?.visualAssessment);
    const questions = assessments.map((assessment) =>
      assessment?.decision === 'provided' ? assessment.question : undefined
    );
    const reasons = assessments.map((assessment) =>
      assessment?.decision === 'provided' ? assessment.nonDuplicationReason : undefined
    );

    expect(new Set(questions).size).toBe(2);
    expect(new Set(reasons).size).toBe(2);
    expect(questions.join('\n')).not.toMatch(/NICEPAY|결제 복귀/);
    expect(targets.map((target) => JSON.stringify(target?.visual)).join('\n')).not.toMatch(/NICEPAY|결제 복귀/);
  });
});

describe('인사이트 inventory와 legacy preservation boundary', () => {
  it('작업물 8개, 공부 기록 1개, canonical 인사이트 17개를 유지한다', () => {
    expect(getAllFeatures()).toHaveLength(8);
    expect(getAllStudies()).toHaveLength(1);
    expect(getAllInsights()).toHaveLength(17);
  });

  it('17개 canonical 인사이트의 승인된 제목, route와 source slug를 exact inventory로 제공한다', () => {
    const actual = getAllInsights()
      .map((insight) => ({
        slug: insight.slug,
        title: insight.title,
        route: `/insights/${insight.slug}`,
        sourceSlug: insight.featureSlug ?? insight.studySlug ?? null
      }))
      .sort((left, right) => left.slug.localeCompare(right.slug));
    const expected = INSIGHT_INVENTORY.map(({ contentSha256: _contentSha256, ...item }) => item).sort((left, right) =>
      left.slug.localeCompare(right.slug)
    );

    expect(actual).toEqual(expected);
  });

  it('migration 밖의 legacy 본문 1개 checksum을 보존한다', () => {
    const expectedChecksums = new Map(
      INSIGHT_INVENTORY.filter(({ contentSha256 }) => contentSha256).map(({ slug, contentSha256 }) => [
        slug,
        contentSha256
      ])
    );
    const actualChecksums = new Map(
      getAllInsights()
        .filter(({ slug }) => !targetSlugSet.has(slug))
        .map(({ slug, content }) => [slug, createHash('sha256').update(content).digest('hex')])
    );

    expect(actualChecksums.size).toBe(1);
    expect(actualChecksums).toEqual(expectedChecksums);
  });
});

describe('인사이트 type과 source validator RED 계약', () => {
  it('유효한 project-case와 technical-exploration source를 허용한다', () => {
    const validate = getValidator();
    if (!validate) return;

    expect(validate(projectCase(), FEATURE_SLUGS, STUDY_SLUGS)).toEqual([]);
    expect(validate(technicalExploration(), FEATURE_SLUGS, STUDY_SLUGS)).toEqual([]);
  });

  it.each([
    ['missing-feature-source', projectCase({ featureSlug: null })],
    ['unknown-feature-source', projectCase({ featureSlug: 'unknown-project' })],
    ['conflicting-study-source', projectCase({ studySlug: 'ai-dx-harness-starter-kit' })],
    ['conflicting-feature-source', technicalExploration({ featureSlug: 'codi-harness-dx-platform' })],
    ['missing-study-or-independent-reason', technicalExploration({ studySlug: null })],
    [
      'ambiguous-study-and-independent-reason',
      technicalExploration({
        editorial: {
          type: 'technical-exploration',
          independentReason: '기존 독립 글로 유지합니다.',
          visualAssessment: validVisual
        }
      })
    ],
    ['unknown-study-source', technicalExploration({ studySlug: 'unknown-study' })],
    [
      'empty-independent-reason',
      technicalExploration({
        studySlug: null,
        editorial: { type: 'technical-exploration', independentReason: '   ', visualAssessment: validVisual }
      })
    ]
  ])('%s 오류를 반환한다', (expectedCode, fixture) => {
    const validate = getValidator();
    if (!validate) return;

    expect(validate(fixture, FEATURE_SLUGS, STUDY_SLUGS)).toContain(expectedCode);
  });

  it('source가 없는 기술 탐구형은 비어 있지 않은 독립 유지 이유 하나만 허용한다', () => {
    const validate = getValidator();
    if (!validate) return;
    const fixture = technicalExploration({
      studySlug: null,
      editorial: {
        type: 'technical-exploration',
        independentReason: '다른 기록에 억지로 연결하지 않고 독립 비교 글로 유지합니다.',
        visualAssessment: validVisual
      }
    });

    expect(validate(fixture, FEATURE_SLUGS, STUDY_SLUGS)).toEqual([]);
  });
});

describe('시각 자료 판정 validator RED 계약', () => {
  it.each([
    ['not-needed', { decision: 'not-needed', rationale: '순차 설명이면 충분합니다.' } satisfies VisualAssessment],
    [
      'recommended',
      {
        decision: 'recommended',
        kind: 'architecture',
        rationale: '세 소유권 경계를 함께 비교해야 합니다.'
      } satisfies VisualAssessment
    ],
    [
      'provided',
      {
        decision: 'provided',
        kind: 'timeline',
        rationale: '시간에 따른 판단 변화를 보여 줍니다.',
        question: '운영 구조는 어떤 계기로 바뀌었는가?',
        textAlternative: 'v1 복사 구조에서 v2 소유권 경계로 이어진 순서를 설명합니다.',
        nonDuplicationReason: '작업물의 전체 흐름 대신 변화 시점만 확대합니다.'
      } satisfies VisualAssessment
    ]
  ])('%s 판정의 완전한 형태를 허용한다', (_decision, visualAssessment) => {
    const validate = getValidator();
    if (!validate) return;

    expect(
      validate(projectCase({ editorial: { type: 'project-case', visualAssessment } }), FEATURE_SLUGS, STUDY_SLUGS)
    ).toEqual([]);
  });

  it.each([
    ['not-needed', { decision: 'not-needed', rationale: '  ' } satisfies VisualAssessment],
    ['recommended', { decision: 'recommended', kind: 'architecture', rationale: '  ' } satisfies VisualAssessment],
    [
      'provided',
      {
        decision: 'provided',
        kind: 'data-flow',
        rationale: '  ',
        question: '데이터는 어디에서 실패하고 복구되는가?',
        textAlternative: '정상 경로와 실패 후 복구 경로를 순서대로 설명합니다.',
        nonDuplicationReason: '작업물의 전체 흐름 대신 복구 분기만 확대합니다.'
      } satisfies VisualAssessment
    ]
  ])('%s 판정에서 구체적인 rationale을 요구한다', (_decision, visualAssessment) => {
    const validate = getValidator();
    if (!validate) return;
    const fixture = projectCase({ editorial: { type: 'project-case', visualAssessment } });

    expect(validate(fixture, FEATURE_SLUGS, STUDY_SLUGS)).toContain('missing-visual-rationale');
  });

  it.each(['recommended', 'provided'] as const)('%s 판정에서 kind를 요구한다', (decision) => {
    const validate = getValidator();
    if (!validate) return;
    const visualAssessment: VisualAssessment =
      decision === 'recommended'
        ? { decision, rationale: '구성요소 관계를 비교해야 합니다.' }
        : {
            decision,
            rationale: '구성요소 관계를 비교해야 합니다.',
            question: '경계는 어떻게 나뉘는가?',
            textAlternative: '세 경계의 관계를 설명합니다.',
            nonDuplicationReason: '기존 전체 흐름과 다른 경계만 확대합니다.'
          };

    expect(
      validate(projectCase({ editorial: { type: 'project-case', visualAssessment } }), FEATURE_SLUGS, STUDY_SLUGS)
    ).toContain('missing-visual-kind');
  });

  it.each(['question', 'textAlternative', 'nonDuplicationReason'] as const)(
    'provided 판정에서 %s를 요구한다',
    (missingField) => {
      const validate = getValidator();
      if (!validate) return;
      const visualAssessment: VisualAssessment = {
        decision: 'provided',
        kind: 'data-flow',
        rationale: '정상·예외 경로를 함께 보여 줍니다.',
        question: '데이터는 어디에서 실패하고 복구되는가?',
        textAlternative: '정상 경로와 실패 후 복구 경로를 순서대로 설명합니다.',
        nonDuplicationReason: '작업물의 전체 흐름 대신 복구 분기만 확대합니다.',
        [missingField]: ' '
      };

      expect(
        validate(projectCase({ editorial: { type: 'project-case', visualAssessment } }), FEATURE_SLUGS, STUDY_SLUGS)
      ).toContain('incomplete-provided-visual');
    }
  );
});

describe('typed 인사이트 시각 자료 validator RED 계약', () => {
  const question = '지급 판단 상태와 재처리 입력은 어디에 있는가?';
  const textAlternative =
    'DB 상태를 확인한 뒤 JSON 입력으로 지급하고 성공 항목은 제거하며 실패 항목은 보존해 재시도합니다.';
  const providedAssessment: VisualAssessment = {
    decision: 'provided',
    kind: 'data-flow',
    rationale: 'DB 상태와 JSON 입력의 역할을 구분합니다.',
    question,
    textAlternative,
    nonDuplicationReason: '작업물의 결제 흐름과 달리 정산 재처리만 보여 줍니다.'
  };
  const validDataFlow: VisualFixture = {
    id: 'settlement-retry',
    variant: 'data-flow',
    title: '정산 상태와 재처리 입력',
    question,
    textAlternative,
    nodes: [
      { id: 'state', label: 'DB PROCESSING', detail: '지급 판단 기준', role: 'state' },
      { id: 'payout', label: '지급 호출', detail: 'JSON 입력 사용', role: 'action' },
      { id: 'success', label: '성공', detail: '완료·제거', role: 'terminal' },
      { id: 'failure', label: '실패', detail: '입력 보존', role: 'terminal' }
    ],
    edges: [
      { id: 'start', from: 'state', to: 'payout', label: '정상', outcome: 'normal' },
      { id: 'ok', from: 'payout', to: 'success', label: '성공', outcome: 'success' },
      { id: 'fail', from: 'payout', to: 'failure', label: '실패', outcome: 'failure' },
      { id: 'retry', from: 'failure', to: 'state', label: '재시도', outcome: 'retry' }
    ]
  };

  it('typed visual이 있으면 provided 판정을 요구한다', () => {
    const validate = getValidator();
    if (!validate) return;
    const fixture = projectCase({
      visual: validDataFlow,
      editorial: {
        type: 'project-case',
        visualAssessment: { decision: 'recommended', kind: 'data-flow', rationale: '시각 자료가 필요합니다.' }
      }
    });

    expect(validate(fixture, FEATURE_SLUGS, STUDY_SLUGS)).toContain('visual-requires-provided-assessment');
  });

  it('data-flow의 dangling 참조를 거부하되 특정 outcome 조합은 강제하지 않는다', () => {
    const validate = getValidator();
    if (!validate) return;
    const fixture = projectCase({
      visual: {
        ...validDataFlow,
        edges: [{ id: 'broken', from: 'state', to: 'missing', label: '정상', outcome: 'normal' }]
      },
      editorial: { type: 'project-case', visualAssessment: providedAssessment }
    });
    const errors = validate(fixture, FEATURE_SLUGS, STUDY_SLUGS);

    expect(errors).toContain('visual-unknown-node-reference');
    expect(errors).not.toContain('visual-missing-success-edge');
    expect(errors).not.toContain('visual-missing-failure-edge');
    expect(errors).not.toContain('visual-missing-retry-edge');
  });

  it('assessment와 visual의 종류·질문·대체 설명이 일치해야 한다', () => {
    const validate = getValidator();
    if (!validate) return;
    const fixture = projectCase({
      visual: { ...validDataFlow, question: '다른 질문', textAlternative: '다른 설명' },
      editorial: {
        type: 'project-case',
        visualAssessment: { ...providedAssessment, kind: 'architecture' }
      }
    });
    const errors = validate(fixture, FEATURE_SLUGS, STUDY_SLUGS);

    expect(errors).toContain('visual-kind-mismatch');
    expect(errors).toContain('visual-question-mismatch');
    expect(errors).toContain('visual-text-alternative-mismatch');
  });

  it('before-after는 정확한 before/after 패널을 요구하되 사례별 scope는 강제하지 않는다', () => {
    const validate = getValidator();
    if (!validate) return;
    const visual: VisualFixture = {
      id: 'room-scope',
      variant: 'before-after',
      title: 'Room 전달 범위 변화',
      question: '수신 대상은 어떻게 달라졌는가?',
      textAlternative:
        '변경 전에는 무관 사용자도 같은 공용 Room에 있었고 변경 후에는 관련 화원 Room만 대상으로 삼았습니다.',
      panels: [
        {
          id: 'before',
          title: '변경 전',
          summary: '공용 Room',
          actors: [
            { id: 'server', label: '서버', role: 'server' },
            { id: 'room', label: '공용 Room', role: 'room' }
          ],
          connections: [{ id: 'wide', from: 'server', to: 'room', label: '전체', scope: 'overbroad' }]
        }
      ]
    };
    const assessment: VisualAssessment = {
      decision: 'provided',
      kind: 'architecture',
      rationale: '변경 전후 전달 범위를 비교합니다.',
      question: visual.question,
      textAlternative: visual.textAlternative,
      nonDuplicationReason: '작업물의 결제 흐름과 다른 전달 범위만 비교합니다.'
    };
    const errors = validate(
      projectCase({ visual, editorial: { type: 'project-case', visualAssessment: assessment } }),
      FEATURE_SLUGS,
      STUDY_SLUGS
    );

    expect(errors).toContain('visual-invalid-before-after-panels');
    expect(errors).not.toContain('visual-missing-overbroad-connection');
    expect(errors).not.toContain('visual-missing-intended-connection');
  });

  it('normal edge만 사용하는 일반 data-flow는 참조와 필수 텍스트가 유효하면 통과한다', () => {
    const validate = getValidator();
    if (!validate) return;
    const visual: VisualFixture = {
      id: 'code-boundary-classification',
      variant: 'data-flow',
      title: '차이의 코드 배치',
      question: '각 차이는 어디에 배치하는가?',
      textAlternative: '공통 동작은 core, 값 차이는 rsConfig, 화면과 로직 차이는 platform으로 분류합니다.',
      nodes: [
        { id: 'change', label: '변경 요구', detail: '차이의 성격 확인', role: 'state' },
        { id: 'core', label: 'core', detail: '공통 동작', role: 'terminal' },
        { id: 'config', label: 'rsConfig', detail: '값 차이', role: 'terminal' },
        { id: 'platform', label: 'platform', detail: '화면·로직 차이', role: 'terminal' }
      ],
      edges: [
        { id: 'to-core', from: 'change', to: 'core', label: '모든 플랫폼 공통', outcome: 'normal' },
        { id: 'to-config', from: 'change', to: 'config', label: '값만 다름', outcome: 'normal' },
        { id: 'to-platform', from: 'change', to: 'platform', label: '화면·로직 차이', outcome: 'normal' }
      ]
    };
    const assessment: VisualAssessment = {
      decision: 'provided',
      kind: 'data-flow',
      rationale: '세 코드 배치 기준을 구분합니다.',
      question: visual.question,
      textAlternative: visual.textAlternative,
      nonDuplicationReason: '작업물 전체 흐름 대신 코드 배치 기준만 보여 줍니다.'
    };

    expect(
      validate(
        projectCase({ visual, editorial: { type: 'project-case', visualAssessment: assessment } }),
        FEATURE_SLUGS,
        STUDY_SLUGS
      )
    ).toEqual([]);
  });

  it('before-after는 indirect와 direct 관계만으로도 공통 계약을 통과한다', () => {
    const validate = getValidator();
    if (!validate) return;
    const visual: VisualFixture = {
      id: 'reservation-context-scope',
      variant: 'before-after',
      title: '예약 상태 전달 전후',
      question: '예약 상태의 소유 범위와 전달 경로는 어떻게 달라졌는가?',
      textAlternative:
        '변경 전에는 상태 소유자가 중간 컴포넌트를 거쳐 예약 단계에 props를 전달했고, 변경 후에는 예약 라우터 Provider를 예약 단계가 직접 소비합니다.',
      panels: [
        {
          id: 'before',
          title: '변경 전',
          summary: '사용하지 않는 중간 컴포넌트가 props를 전달했습니다.',
          actors: [
            { id: 'owner', label: '상위 상태 소유자', role: 'source' },
            { id: 'relay', label: '중간 컴포넌트', role: 'relay' },
            { id: 'step', label: '예약 단계', role: 'consumer' }
          ],
          connections: [
            { id: 'owner-relay', from: 'owner', to: 'relay', label: 'props 전달', scope: 'indirect' },
            { id: 'relay-step', from: 'relay', to: 'step', label: 'props 재전달', scope: 'indirect' }
          ]
        },
        {
          id: 'after',
          title: '변경 후',
          summary: '예약 라우터가 상태 생명주기 경계를 소유합니다.',
          actors: [
            { id: 'provider', label: 'ReservationProvider', role: 'boundary' },
            { id: 'step', label: '예약 단계', role: 'consumer' }
          ],
          connections: [
            { id: 'provider-step', from: 'provider', to: 'step', label: 'useReservation 직접 소비', scope: 'direct' }
          ]
        }
      ]
    };
    const assessment: VisualAssessment = {
      decision: 'provided',
      kind: 'architecture',
      rationale: '간접 props 전달과 Provider 직접 소비를 비교합니다.',
      question: visual.question,
      textAlternative: visual.textAlternative,
      nonDuplicationReason: '작업물의 플랫폼 구조와 다른 라우터 내부 상태 전달만 비교합니다.'
    };

    expect(
      validate(
        projectCase({ visual, editorial: { type: 'project-case', visualAssessment: assessment } }),
        FEATURE_SLUGS,
        STUDY_SLUGS
      )
    ).toEqual([]);
  });

  it('before-after 각 패널에는 참조 가능한 관계가 하나 이상 있어야 한다', () => {
    const validate = getValidator();
    if (!validate) return;
    const visual: VisualFixture = {
      id: 'empty-panel-connections',
      variant: 'before-after',
      title: '빈 관계 패널',
      question: '각 패널의 관계가 존재하는가?',
      textAlternative: '변경 전후 actor는 있지만 변경 후 관계가 비어 있습니다.',
      panels: [
        {
          id: 'before',
          title: '변경 전',
          summary: '간접 전달',
          actors: [
            { id: 'owner', label: '상태 소유자', role: 'source' },
            { id: 'step', label: '예약 단계', role: 'consumer' }
          ],
          connections: [{ id: 'indirect', from: 'owner', to: 'step', label: 'props 전달', scope: 'indirect' }]
        },
        {
          id: 'after',
          title: '변경 후',
          summary: '관계 누락',
          actors: [
            { id: 'provider', label: 'Provider', role: 'boundary' },
            { id: 'step', label: '예약 단계', role: 'consumer' }
          ],
          connections: []
        }
      ]
    };
    const assessment: VisualAssessment = {
      decision: 'provided',
      kind: 'architecture',
      rationale: '패널별 관계 존재 여부를 확인합니다.',
      question: visual.question,
      textAlternative: visual.textAlternative,
      nonDuplicationReason: '빈 패널 검증 fixture입니다.'
    };

    expect(
      validate(
        projectCase({ visual, editorial: { type: 'project-case', visualAssessment: assessment } }),
        FEATURE_SLUGS,
        STUDY_SLUGS
      )
    ).toContain('visual-missing-panel-connection');
  });

  it('완전한 data-flow visual은 통과한다', () => {
    const validate = getValidator();
    if (!validate) return;

    expect(
      validate(
        projectCase({
          visual: validDataFlow,
          editorial: { type: 'project-case', visualAssessment: providedAssessment }
        }),
        FEATURE_SLUGS,
        STUDY_SLUGS
      )
    ).toEqual([]);
  });
});

describe('migration 집합 계약', () => {
  const migratedInsights = () =>
    getAllInsights().filter(
      (insight) => (insight as typeof insight & { editorial?: EditorialMetadata | null }).editorial
    );

  it('editorial metadata가 있는 slug는 승인된 열여섯 개 exact set이다', () => {
    const actual = migratedInsights()
      .map(({ slug }) => slug)
      .sort();
    const expected = TARGET_INSIGHTS.map(({ slug }) => slug).sort();

    expect(actual).toEqual(expected);
  });

  it('현재 집합은 project-case 15개와 technical-exploration 1개다', () => {
    const counts = migratedInsights().reduce(
      (result, insight) => {
        const editorial = (insight as typeof insight & { editorial?: EditorialMetadata | null }).editorial;
        if (editorial) result[editorial.type] += 1;
        return result;
      },
      { 'project-case': 0, 'technical-exploration': 0 }
    );

    expect(counts).toEqual({ 'project-case': 15, 'technical-exploration': 1 });
  });

  it.each(TARGET_INSIGHTS)('$slug DTO는 승인된 type/source/visual fixture로 validator를 통과한다', (target) => {
    const validate = getValidator();
    if (!validate) return;
    const insight = getAllInsights().find(({ slug }) => slug === target.slug);
    const editorial = (insight as (typeof insight & { editorial?: EditorialMetadata | null }) | undefined)?.editorial;
    const visualAssessment = editorial?.visualAssessment;
    const visualKind = visualAssessment && 'kind' in visualAssessment ? visualAssessment.kind : undefined;
    const sourceSlug = insight?.featureSlug ?? insight?.studySlug ?? null;

    expect(insight, target.slug).toBeDefined();
    expect(editorial?.type, target.slug).toBe(target.type);
    expect(sourceSlug, target.slug).toBe(target.sourceSlug);
    expect(
      target.type === 'project-case' ? FEATURE_SLUGS.has(target.sourceSlug) : STUDY_SLUGS.has(target.sourceSlug),
      target.slug
    ).toBe(true);
    expect(visualAssessment?.decision, target.slug).toBe(target.visualDecision);
    expect(visualKind, target.slug).toBe(target.visualKind);
    expect(visualAssessment?.rationale, target.slug).toMatch(/\S/);
    expect(visualAssessment?.rationale, target.slug).toMatch(target.rationaleContext);
    expect(validate(insight as EditorialInsightFixture, FEATURE_SLUGS, STUDY_SLUGS), target.slug).toEqual([]);
  });

  it('열여섯 target의 visual rationale은 글별로 구체적이고 서로 동일하지 않다', () => {
    const rationales = TARGET_INSIGHTS.map(({ slug }) => {
      const insight = getAllInsights().find((candidate) => candidate.slug === slug);
      const editorial = (insight as (typeof insight & { editorial?: EditorialMetadata | null }) | undefined)?.editorial;
      const rationale = editorial?.visualAssessment.rationale ?? '';

      expect(rationale, slug).toMatch(/\S/);
      return rationale.trim();
    });

    expect(new Set(rationales).size).toBe(TARGET_INSIGHTS.length);
  });

  it('migration 밖의 1개에는 빈 editorial placeholder를 만들지 않는다', () => {
    const legacyInsights = getAllInsights().filter(({ slug }) => !targetSlugSet.has(slug));

    expect(legacyInsights).toHaveLength(1);
    for (const insight of legacyInsights) {
      expect((insight as typeof insight & { editorial?: EditorialMetadata | null }).editorial, insight.slug).toBeNull();
    }
  });

  it('exact target-by-slug 유형·출처와 legacy route/body fixture가 모두 맞으면 집합 검증을 통과한다', () => {
    const validateSet = getSetValidator();
    if (!validateSet) return;

    expect(
      validateSet(insightSetFixture(), FEATURE_SLUGS, STUDY_SLUGS, LEGACY_PRESERVATION_FIXTURES, hashContent)
    ).toEqual([]);
  });

  it('유효한 두 target의 유형과 출처를 맞바꿔도 slug별 exact fixture 불일치로 거부한다', () => {
    const validateSet = getSetValidator();
    if (!validateSet) return;
    const insights = insightSetFixture();
    const hanmaum = insights.find(({ slug }) => slug === 'optimizing-770k-text-search-in-rdbms');
    const vercel = insights.find(({ slug }) => slug === 'vercel-team-plan-bypass-and-serverless-cost-analysis');

    expect(hanmaum).toBeDefined();
    expect(vercel).toBeDefined();
    if (!hanmaum || !vercel) return;

    hanmaum.featureSlug = null;
    hanmaum.studySlug = 'ai-dx-harness-starter-kit';
    hanmaum.editorial = vercel.editorial;
    vercel.featureSlug = 'hanmaum-science-institute';
    vercel.studySlug = null;
    vercel.editorial = projectCase().editorial;

    const errors = validateSet(insights, FEATURE_SLUGS, STUDY_SLUGS, LEGACY_PRESERVATION_FIXTURES, hashContent);

    expect(errors).toContain('target-editorial-type-mismatch:optimizing-770k-text-search-in-rdbms');
    expect(errors).toContain('target-source-mismatch:optimizing-770k-text-search-in-rdbms');
    expect(errors).toContain('target-editorial-type-mismatch:vercel-team-plan-bypass-and-serverless-cost-analysis');
    expect(errors).toContain('target-source-mismatch:vercel-team-plan-bypass-and-serverless-cost-analysis');
  });

  it('target metadata가 하나 빠지면 exact migration 집합으로 인정하지 않는다', () => {
    const validateSet = getSetValidator();
    if (!validateSet) return;
    const insights = insightSetFixture();
    const target = insights.find(({ slug }) => slug === 'codi-harness-dx-platform-design');

    expect(target).toBeDefined();
    if (!target) return;
    target.editorial = null;

    expect(validateSet(insights, FEATURE_SLUGS, STUDY_SLUGS, LEGACY_PRESERVATION_FIXTURES, hashContent)).toContain(
      'migrated-insight-set-mismatch'
    );
  });

  it('legacy에 metadata가 하나 추가되면 exact migration 집합으로 인정하지 않는다', () => {
    const validateSet = getSetValidator();
    if (!validateSet) return;
    const insights = insightSetFixture();
    const legacy = insights.find(({ slug }) => slug === 'ai-vibe-coding');

    expect(legacy).toBeDefined();
    if (!legacy) return;
    legacy.editorial = projectCase().editorial;

    expect(validateSet(insights, FEATURE_SLUGS, STUDY_SLUGS, LEGACY_PRESERVATION_FIXTURES, hashContent)).toContain(
      'migrated-insight-set-mismatch'
    );
  });

  it('legacy route가 바뀌면 preservation fixture 불일치로 거부한다', () => {
    const validateSet = getSetValidator();
    if (!validateSet) return;
    const insights = insightSetFixture();
    const legacy = insights.find(({ slug }) => slug === 'ai-vibe-coding');

    expect(legacy).toBeDefined();
    if (!legacy) return;
    legacy.route = '/insights/changed-route';

    expect(validateSet(insights, FEATURE_SLUGS, STUDY_SLUGS, LEGACY_PRESERVATION_FIXTURES, hashContent)).toContain(
      'legacy-route-mismatch:ai-vibe-coding'
    );
  });

  it('legacy body가 바뀌면 preservation fixture 불일치로 거부한다', () => {
    const validateSet = getSetValidator();
    if (!validateSet) return;
    const insights = insightSetFixture();
    const legacy = insights.find(({ slug }) => slug === 'ai-vibe-coding');

    expect(legacy).toBeDefined();
    if (!legacy) return;
    legacy.content = `${legacy.content ?? ''}\n변조된 본문`;

    expect(validateSet(insights, FEATURE_SLUGS, STUDY_SLUGS, LEGACY_PRESERVATION_FIXTURES, hashContent)).toContain(
      'legacy-content-mismatch:ai-vibe-coding'
    );
  });

  it('정산 insight는 승인된 data-flow의 상태·성공·실패·재시도 관계를 제공한다', () => {
    const insight = getAllInsights().find(({ slug }) => slug === 'json-outbox-pattern-for-settlement');
    const editorial = insight?.editorial;
    const visual = insight?.visual;

    expect(editorial).toMatchObject({
      type: 'project-case',
      visualAssessment: {
        decision: 'provided',
        kind: 'data-flow',
        rationale: expect.stringMatching(/DB|JSON|정산|재처리/),
        nonDuplicationReason: expect.stringMatching(/작업물[^.\n]*결제[^.\n]*인사이트[^.\n]*정산|정산[^.\n]*결제/)
      }
    });
    expect(visual).toMatchObject({
      variant: 'data-flow',
      question: editorial?.visualAssessment.decision === 'provided' ? editorial.visualAssessment.question : undefined,
      textAlternative:
        editorial?.visualAssessment.decision === 'provided' ? editorial.visualAssessment.textAlternative : undefined
    });
    if (visual?.variant !== 'data-flow') return;
    expect(visual.nodes.map(({ role }) => role)).toEqual(
      expect.arrayContaining(['state', 'data', 'action', 'terminal'])
    );
    expect(visual.edges.map(({ outcome }) => outcome)).toEqual(
      expect.arrayContaining(['normal', 'success', 'failure', 'retry'])
    );
    expect(visual.textAlternative).toMatch(
      /PROCESSING[^.\n]*JSON[^.\n]*지급[^.\n]*성공[^.\n]*제거[^.\n]*실패[^.\n]*(?:남|보존)[^.\n]*10시[^.\n]*14시/
    );
  });

  it('Socket.io insight는 공용 Room과 화원별 User Room의 전달 범위를 before-after로 비교한다', () => {
    const insight = getAllInsights().find(({ slug }) => slug === 'socketio-realtime-architecture-and-reliability');
    const editorial = insight?.editorial;
    const visual = insight?.visual;

    expect(editorial).toMatchObject({
      type: 'project-case',
      visualAssessment: {
        decision: 'provided',
        kind: 'architecture',
        rationale: expect.stringMatching(/공용 Room|User Room|수신 대상|전달 범위/),
        nonDuplicationReason: expect.stringMatching(
          /작업물[^.\n]*결제[^.\n]*인사이트[^.\n]*(?:(?:Socket\.io )?Room|전달)/
        )
      }
    });
    expect(visual).toMatchObject({
      variant: 'before-after',
      question: editorial?.visualAssessment.decision === 'provided' ? editorial.visualAssessment.question : undefined,
      textAlternative:
        editorial?.visualAssessment.decision === 'provided' ? editorial.visualAssessment.textAlternative : undefined,
      panels: [{ id: 'before' }, { id: 'after' }]
    });
    if (visual?.variant !== 'before-after') return;
    expect(visual.panels[0].connections.find(({ id }) => id === 'common-to-orderer')?.scope).toBe('intended');
    expect(visual.panels[0].connections.find(({ id }) => id === 'common-to-receiver')?.scope).toBe('intended');
    expect(visual.panels[0].connections.find(({ id }) => id === 'common-to-unrelated')?.scope).toBe('overbroad');
    expect(visual.panels[1].connections.map(({ scope }) => scope)).toContain('intended');
    expect(visual.textAlternative).toMatch(
      /변경 전[^.\n]*공용 Room[^.\n]*관계없는 사용자[^.\n]*변경 후[^.\n]*(?:주문 화원[^.\n]*수주 화원[^.\n]*화원별 User Room|화원별 User Room[^.\n]*관련 화원)/
    );
  });

  it('두 전면 개정 인사이트는 승인일을 공개일로 사용한다', () => {
    for (const slug of ['json-outbox-pattern-for-settlement', 'socketio-realtime-architecture-and-reliability']) {
      const insight = getAllInsights().find((candidate) => candidate.slug === slug);

      expect(insight?.date, slug).toBe('2026-09-04T00:00:00.000Z');
    }
  });

  it('DTO editorial과 typed visual은 seed의 중첩 객체를 공유하지 않는다', () => {
    for (const target of TARGET_INSIGHTS) {
      const seed = REAL_INSIGHTS.find(({ slug }) => slug === target.slug);
      const dto = getAllInsights().find(({ slug }) => slug === target.slug);

      expect(seed?.editorial, target.slug).toBeDefined();
      expect(dto?.editorial, target.slug).toBeDefined();
      expect(dto?.editorial, target.slug).not.toBe(seed?.editorial);
      expect(dto?.editorial?.visualAssessment, target.slug).not.toBe(seed?.editorial?.visualAssessment);
      expect(dto?.visual, target.slug).not.toBe(seed?.visual);

      if (dto?.visual?.variant === 'data-flow' && seed?.visual?.variant === 'data-flow') {
        expect(dto.visual.nodes, target.slug).not.toBe(seed.visual.nodes);
        expect(dto.visual.edges, target.slug).not.toBe(seed.visual.edges);
        expect(dto.visual.nodes[0], target.slug).not.toBe(seed.visual.nodes[0]);
        expect(dto.visual.edges[0], target.slug).not.toBe(seed.visual.edges[0]);
      }

      if (dto?.visual?.variant === 'before-after' && seed?.visual?.variant === 'before-after') {
        expect(dto.visual.panels, target.slug).not.toBe(seed.visual.panels);
        expect(dto.visual.panels[0], target.slug).not.toBe(seed.visual.panels[0]);
        expect(dto.visual.panels[0].actors, target.slug).not.toBe(seed.visual.panels[0].actors);
        expect(dto.visual.panels[0].connections, target.slug).not.toBe(seed.visual.panels[0].connections);
        expect(dto.visual.panels[0].actors[0], target.slug).not.toBe(seed.visual.panels[0].actors[0]);
        expect(dto.visual.panels[0].connections[0], target.slug).not.toBe(seed.visual.panels[0].connections[0]);
      }
    }
  });
});

describe('행사 호텔 예약·결제 인사이트 4→3 editorial RED 계약', () => {
  const canonicalSlugs = [
    'nestjs-middleware-vs-guard-tradeoff',
    'nextjs-nestjs-domain-separation-and-bff',
    'https-and-plaintext-password-transmission'
  ] as const;

  const expectedCanonicalInventory = [
    'codi-harness-dx-platform-design',
    'logging-decoupling-and-buffering-in-external-api-systems',
    'optimizing-770k-text-search-in-rdbms',
    'spa-api-key-exposure-and-bff-architecture',
    'sso-authentication-and-soft-fk',
    'json-outbox-pattern-for-settlement',
    'config-driven-architecture-react',
    'context-api-encapsulation-and-router-level-isolation',
    ...canonicalSlugs,
    'ai-vibe-coding',
    'socketio-realtime-architecture-and-reliability',
    'vercel-team-plan-bypass-and-serverless-cost-analysis',
    'infisical-centralized-secrets-and-spof-defense',
    'cloudflare-tunnel-zero-trust-cicd-and-troubleshooting',
    'jenkins-retirement-and-github-actions-migration'
  ].sort();

  type InsightAliasApi = {
    INSIGHT_ALIASES: Readonly<Record<string, string>>;
    getInsightRouteSlugs: () => readonly string[];
    resolveInsightAlias: (slug: string) => string | null;
    validateInsightAliases: (aliases: Readonly<Record<string, string>>, canonical: ReadonlySet<string>) => string[];
  };

  const isStringRecord = (value: unknown): value is Readonly<Record<string, string>> =>
    typeof value === 'object' && value !== null && Object.values(value).every((entry) => typeof entry === 'string');

  const hasInsightAliasApi = (value: object): value is InsightAliasApi =>
    isStringRecord(Reflect.get(value, 'INSIGHT_ALIASES')) &&
    typeof Reflect.get(value, 'getInsightRouteSlugs') === 'function' &&
    typeof Reflect.get(value, 'resolveInsightAlias') === 'function' &&
    typeof Reflect.get(value, 'validateInsightAliases') === 'function';

  it('17개 canonical inventory는 alias를 제외한 exact slug 집합이다', () => {
    expect(
      getAllInsights()
        .map(({ slug }) => slug)
        .sort()
    ).toEqual(expectedCanonicalInventory);
  });

  it('canonical 세 글은 통합 예약 feature의 exact related set이다', () => {
    const related = getAllInsights().filter(({ featureSlug }) => featureSlug === 'integrated-reservation-platform');

    expect(related.map(({ slug }) => slug).sort()).toEqual([...canonicalSlugs].sort());
  });

  it.each([
    [
      'nestjs-middleware-vs-guard-tradeoff',
      'NestJS 인증은 Middleware와 Guard 중 하나를 고르는 문제가 아니었다',
      'provided'
    ],
    [
      'nextjs-nestjs-domain-separation-and-bff',
      '[Next.js x NestJS] 프론트엔드와 백엔드의 도메인 분리와 BFF 설계',
      'provided'
    ],
    [
      'https-and-plaintext-password-transmission',
      '구글과 네이버는 왜 비밀번호를 평문으로 보낼까? (개발자 도구의 착시와 HTTPS의 진실)',
      'not-needed'
    ]
  ] as const)('canonical %s는 승인 제목과 project-case editorial metadata를 제공한다', (slug, title, decision) => {
    const insight = getAllInsights().find((candidate) => candidate.slug === slug);

    expect(insight).toMatchObject({
      title,
      featureSlug: 'integrated-reservation-platform',
      editorial: { type: 'project-case', visualAssessment: { decision } }
    });
  });

  it.each([
    {
      slug: 'nestjs-middleware-vs-guard-tradeoff',
      excerpt:
        'Express에 익숙했던 당시에는 인증과 쿠키 갱신을 Middleware에, 관리자 등급 확인을 Guard에 나눴습니다. 구현 당시의 선택을 합리화하지 않고, 지금 다시 설계한다면 Global Auth Guard와 별도 권한 Guard로 책임을 나누겠다는 판단까지 정리했습니다.',
      readTime: '5 min',
      tags: ['Backend', 'NestJS', 'Authentication', 'Architecture', 'Retrospective'],
      contentSha256: 'febd1f465775093b3a44d7ef2996fd304a14e06c9d20e2cc37db97da325346b8'
    },
    {
      slug: 'nextjs-nestjs-domain-separation-and-bff',
      excerpt:
        'A-domain.com의 브라우저가 api.A-domain.com을 직접 호출할 때 인증 쿠키의 저장·전달 실패를 확인했습니다. Next.js reverse proxy로 요청 Origin을 맞춘 뒤 새로 드러난 Cloudflare 서버 요청 경계까지, 실제 구현과 스테이징 검증 범위로 정리했습니다.',
      readTime: '6 min',
      tags: ['Architecture', 'Next.js', 'NestJS', 'Authentication', 'BFF'],
      contentSha256: 'ae87751accbc245560e222755fae2b071b3dcc7e9523bfe015de8ef61a8b6f47'
    },
    {
      slug: 'https-and-plaintext-password-transmission',
      excerpt:
        '개발자 도구의 Request Payload를 네트워크 평문으로 오해해 비밀번호 전송용 클라이언트 암호화를 구현했다가 제거했습니다. 애플리케이션 Payload, TLS 전송과 서버 bcrypt 저장의 서로 다른 경계를 실제 경험 범위로 정리했습니다.',
      readTime: '5 min',
      tags: ['Security', 'HTTPS', 'Authentication', 'Frontend', 'Backend'],
      contentSha256: '0984a25e6f41e893f991011ab7856be3dc80690914aba9134aaaa0b42472d5cd'
    }
  ])('$slug는 사용자가 승인한 excerpt·readTime·tags·본문 hash를 그대로 제공한다', (fixture) => {
    const insight = getAllInsights().find(({ slug }) => slug === fixture.slug);

    expect(insight?.excerpt).toBe(fixture.excerpt);
    expect(insight?.readTime).toBe(fixture.readTime);
    expect(insight?.tags).toEqual(fixture.tags);
    expect(hashContent(insight?.content ?? '')).toBe(fixture.contentSha256);
  });

  it('Middleware/Guard canonical은 architecture visual assessment를 제공한다', () => {
    const insight = getAllInsights().find(({ slug }) => slug === 'nestjs-middleware-vs-guard-tradeoff');

    expect(insight?.editorial).toMatchObject({ visualAssessment: { decision: 'provided', kind: 'architecture' } });
  });

  it('BFF canonical은 architecture visual assessment를 제공한다', () => {
    const insight = getAllInsights().find(({ slug }) => slug === 'nextjs-nestjs-domain-separation-and-bff');

    expect(insight?.editorial).toMatchObject({ visualAssessment: { decision: 'provided', kind: 'architecture' } });
  });

  it('HTTPS canonical은 top-level visual null을 제공한다', () => {
    const insight = getAllInsights().find(({ slug }) => slug === 'https-and-plaintext-password-transmission');

    expect(insight?.visual).toBeNull();
  });

  it('canonical 세 글은 exact title·project-case source와 visual parity를 제공한다', () => {
    const bySlug = new Map(getAllInsights().map((insight) => [insight.slug, insight]));

    expect(bySlug.get('nestjs-middleware-vs-guard-tradeoff')).toMatchObject({
      title: 'NestJS 인증은 Middleware와 Guard 중 하나를 고르는 문제가 아니었다',
      featureSlug: 'integrated-reservation-platform',
      editorial: { type: 'project-case', visualAssessment: { decision: 'provided', kind: 'architecture' } }
    });
    expect(bySlug.get('nextjs-nestjs-domain-separation-and-bff')).toMatchObject({
      title: '[Next.js x NestJS] 프론트엔드와 백엔드의 도메인 분리와 BFF 설계',
      featureSlug: 'integrated-reservation-platform',
      editorial: { type: 'project-case', visualAssessment: { decision: 'provided', kind: 'architecture' } }
    });
    expect(bySlug.get('https-and-plaintext-password-transmission')).toMatchObject({
      title: '구글과 네이버는 왜 비밀번호를 평문으로 보낼까? (개발자 도구의 착시와 HTTPS의 진실)',
      featureSlug: 'integrated-reservation-platform',
      editorial: { type: 'project-case', visualAssessment: { decision: 'not-needed' } }
    });
  });

  it('17개 canonical은 migrated 16개(project-case 15, technical-exploration 1)와 metadata 없는 legacy 1개로 정확히 분류된다', () => {
    const insights = getAllInsights();
    const migrated = insights.filter((insight) => insight.editorial !== null);
    const legacy = insights.filter((insight) => insight.editorial === null);
    const counts = migrated.reduce(
      (result, insight) => {
        if (insight.editorial) result[insight.editorial.type] += 1;
        return result;
      },
      { 'project-case': 0, 'technical-exploration': 0 }
    );

    expect(insights).toHaveLength(17);
    expect(migrated).toHaveLength(16);
    expect(counts).toEqual({ 'project-case': 15, 'technical-exploration': 1 });
    expect(migrated.map(({ slug }) => slug).sort()).toEqual(
      expectedCanonicalInventory.filter((slug) => slug !== 'ai-vibe-coding').sort()
    );
    expect(legacy.map(({ slug }) => slug)).toEqual(['ai-vibe-coding']);
  });

  it('provided visual assessment는 top-level visual의 kind·question·text alternative와 non-duplication 이유를 정확히 공유한다', () => {
    for (const slug of ['nestjs-middleware-vs-guard-tradeoff', 'nextjs-nestjs-domain-separation-and-bff']) {
      const insight = getAllInsights().find((candidate) => candidate.slug === slug);
      const assessment = insight?.editorial?.visualAssessment;
      const visual = insight?.visual;

      expect(assessment?.decision, slug).toBe('provided');
      expect(visual, slug).not.toBeNull();
      if (!assessment || assessment.decision !== 'provided' || !visual) continue;

      expect(assessment.kind, slug).toBe(visual.variant === 'before-after' ? 'architecture' : 'data-flow');
      expect(assessment.question, slug).toBe(visual.question);
      expect(assessment.textAlternative, slug).toBe(visual.textAlternative);
      expect(assessment.nonDuplicationReason, slug).toMatch(/\S/);
    }
  });

  it('alias registry는 legacy BFF 주소를 canonical 한 곳으로만 해석하고 자기·순환·없는 대상을 거부한다', async () => {
    const portfolio = await import('./index');
    const canonical = new Set(getAllInsights().map(({ slug }) => slug));

    expect(hasInsightAliasApi(portfolio), '인사이트 alias registry API가 아직 구현되지 않았습니다.').toBe(true);
    if (!hasInsightAliasApi(portfolio)) return;

    expect(portfolio.INSIGHT_ALIASES).toEqual({
      'enterprise-bff-architecture-and-cors': 'nextjs-nestjs-domain-separation-and-bff'
    });
    expect(portfolio.resolveInsightAlias('enterprise-bff-architecture-and-cors')).toBe(
      'nextjs-nestjs-domain-separation-and-bff'
    );
    expect(portfolio.resolveInsightAlias('nextjs-nestjs-domain-separation-and-bff')).toBeNull();
    expect(portfolio.validateInsightAliases(portfolio.INSIGHT_ALIASES, canonical)).toEqual([]);
    expect(portfolio.validateInsightAliases({ self: 'self' }, new Set(['self']))).toContain(
      'alias-self-reference:self'
    );
    expect(portfolio.validateInsightAliases({ first: 'second', second: 'first' }, new Set(['target']))).toContain(
      'alias-target-is-alias:first'
    );
    expect(portfolio.validateInsightAliases({ missing: 'unknown' }, canonical)).toContain(
      'alias-unknown-target:missing'
    );
  });

  it('actual insight route includes the alias static param and permanently redirects it to the canonical internal path', async () => {
    expect(generateInsightStaticParams()).toContainEqual({ slug: 'enterprise-bff-architecture-and-cors' });

    const outcome = await InsightDetailPage({
      params: Promise.resolve({ slug: 'enterprise-bff-architecture-and-cors' })
    }).then(
      () => null,
      (error: unknown) => error
    );
    expect(outcome).not.toBeNull();
    expect(Reflect.get(outcome!, 'digest')).toContain('/insights/nextjs-nestjs-domain-separation-and-bff');
    expect(Reflect.get(outcome!, 'digest')).toContain('replace');
    expect(Reflect.get(outcome!, 'digest')).toContain(';308;');
  });
});

describe('첫 migration 본문의 유형별 의미 계약', () => {
  const articleText = (slug: string) => {
    const insight = getAllInsights().find((candidate) => candidate.slug === slug);

    expect(insight, slug).toBeDefined();
    return `${insight?.excerpt ?? ''}\n${insight?.content ?? ''}`;
  };

  it.each(PROJECT_CASE_MEANING_CONTRACTS)(
    '$slug에서 프로젝트 사례형의 여섯 의미를 찾을 수 있다',
    ({ slug, meanings }) => {
      const text = articleText(slug);

      for (const [meaning, pattern] of Object.entries(meanings)) {
        expect(text, `${slug}: ${meaning}`).toMatch(pattern);
      }
    }
  );

  it('Vercel 글에서 기술 탐구형의 질문·근거·실험·대안·조건·한계를 찾을 수 있다', () => {
    const text = articleText('vercel-team-plan-bypass-and-serverless-cost-analysis');
    const meanings = {
      question: /모든 기여자를 유료 Developer Seat로 초대하지 않고도.*배포 흐름/,
      evidence: /2026-08 기준 Vercel 공개 가격.*Pro는 월 \$20/,
      experiment: /직접 확인한 범위는 배포 방식|Custom CI 파이프라인.*구축/,
      alternatives: /Custom CI가 맞는 조건.*다시 검토할 조건/,
      decision: /프로젝트 권한이 필요하지 않은 기여자는.*권한을 가진 배포 주체/,
      limitation: /고정 총액을 계산하지 않았고.*세금과 환율도 계산에서 제외/
    };

    for (const [meaning, pattern] of Object.entries(meanings)) {
      expect(text, `vercel technical-exploration: ${meaning}`).toMatch(pattern);
    }
  });
});
