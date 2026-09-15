import type { FeatureCategory, FeatureStatus } from './types/feature.dto';

// prisma/data/features.ts
// 실제 작업물(Feature) 데이터를 이 파일에서 관리합니다.
// 새 프로젝트 추가 시 아래 배열에 객체를 추가하세요.

// 프로젝트명 (제목)
// 간단한 설명 (1~2문장)
// 기술 스택 (예: NestJS, PostgreSQL, Redis...)
// 개발 기간 (예: 2024.07 ~ 2024.11)
// 역할/팀 구성 (예: 백엔드 단독, 또는 팀 2명)
// 프로젝트 개요 및 본문 (마크다운 가능, 문제 상황/접근 방법/결과 등)

export type SeedFeature = {
  slug: string;
  title: string;
  description: string;
  iconName: string;
  category: FeatureCategory;
  techStack: string[];
  status: FeatureStatus;
  overview: string;
  period?: string | null;
  team?: string | null;
  content?: string | null;
};

const PROJECT_STATUS_REASON_BY_SLUG: Readonly<Record<string, string>> = {
  'integrated-reservation-platform': '고객사 측 사업 여건으로 개발 보류'
};

export const getProjectStatusReason = (slug: string): string | undefined => PROJECT_STATUS_REASON_BY_SLUG[slug];

export const REAL_FEATURES: SeedFeature[] = [
  {
    slug: 'codi-harness-dx-platform',
    title: '사내 DX 하네스 v2 구축',
    description:
      '팀원과 AI 에이전트가 프로젝트마다 다르게 수행하던 설계·검증·배포 절차를 공통 정책, CLI와 CI/CD로 집행하는 사내 개발 운영 플랫폼입니다.',
    iconName: 'Workflow',
    category: 'DevOps',
    techStack: ['Spec Kit', 'Superpowers', 'Playwright MCP', 'Codi skills', 'GitHub Actions', 'Infisical'],
    status: 'Production',
    overview:
      'Jenkins 비용과 운영 부담을 줄이는 것에서 시작했지만, 실제 문제는 프로젝트가 늘어날 때마다 초기화·배포·검증 기준을 다시 결정하고 팀원과 AI 에이전트마다 다른 방식으로 작업하는 데 있었습니다. 그래서 프로젝트가 시작되고 계획되고 검증되고 배포되는 기준을 하나의 하네스로 묶었고, 2026년 4월부터 실제 프로젝트에 적용하며 패키징과 실행 규칙을 지속적으로 발전시키고 있습니다.',
    period: '2026.04 – 현재',
    team: 'DX/DevOps 단독 설계 및 구현'
  },
  {
    slug: 'the-siena-golf-reservation',
    title: '골프 예약 시스템 구축',
    description:
      '입사 후 처음 맡은 프로젝트로, 외부 파트너사 예약 API를 연동한 골프 예약·마이페이지를 구현하고 운영 중 조회하기 어려워진 통신 로그를 업무 DB에서 시스템 로그로 분리했습니다.',
    iconName: 'CalendarCheck',
    category: 'Fullstack',
    techStack: ['PHP', 'MySQL'],
    status: 'Production',
    overview:
      '입사 후 첫 프로젝트로, 이미 정해진 구조 안에서 외부 파트너사 예약 API 연동과 예약·마이페이지 기능을 구현했습니다. 운영 중 통신 로그가 수백만 건으로 늘어 장애 조사 시 테이블에 접근하기 어려워지자, 로그 저장 경로를 업무 DB에서 시스템 로그로 분리했습니다.',
    period: '2023.05 – 현재',
    team: 'FE/BE 단독 구현'
  },
  {
    slug: 'hanmaum-science-institute',
    title: '법문검색 엔진 구축',
    description:
      '약 77만 자의 Word 교재를 검색 가능한 데이터로 옮기고, 외부 검색 인프라 없이 레거시 데이터베이스 안에서 2단계 검색 구조를 만들어 응답 시간을 줄인 백엔드 단독 프로젝트입니다.',
    iconName: 'Search',
    category: 'Fullstack',
    techStack: ['JavaScript', 'React', 'Node.js', 'Express', 'MySQL', 'Sequelize', 'GitHub Actions', 'PHP'],
    status: 'Production',
    overview:
      '최대 454페이지, 약 77만 자의 Word 교재를 웹 서비스로 옮기면서 두 가지를 동시에 풀어야 했습니다. 하나는 레거시 데이터베이스에서 한국어 단락 검색을 쓸 만한 속도로 만드는 것이었고, 다른 하나는 카테고리와 권, 단락 구분이 서식과 표기 관례에만 의존하는 원문을 데이터 손실 없이 적재하는 것이었습니다. 백엔드를 단독으로 맡아 검색 구조, 파싱·적재, 인증, 배포까지 담당했습니다.',
    period: '2023.06 – 2023.10',
    team: 'FE 2명 (본인 포함), BE 1명 (본인)'
  },
  {
    slug: 'blackstone-belleforet-resort',
    title: '리조트 웹사이트 리뉴얼 및 예약 시스템 구축',
    description:
      '기존 그누보드 자산 위에 PHP와 React를 결합해 신규 리조트 서비스를 구축하고, 결제·예약 불일치와 API Key 노출 문제를 원인별로 보강한 프로젝트입니다.',
    iconName: 'Laptop',
    category: 'Fullstack',
    techStack: ['JavaScript', 'React', 'Node.js', 'Express', 'MySQL', 'Sequelize', 'Jenkins', 'PHP'],
    status: 'Production',
    overview:
      '모든 설계를 혼자 맡은 1인 백엔드 겸 프론트엔드 개발자로서 PHP·React 공존 구조, 인증과 결제·예약 보상 흐름, API Key 서버 프록시를 설계·구현하며 프로젝트 전반을 주도했습니다.',
    period: '2023.12 – 2024.10',
    team: 'FE 3명 (본인 포함) / BE 1명 (본인)'
  },
  {
    slug: 'integrated-sso-server',
    title: '중앙 회원 관리·인증 서버 설계 및 구축',
    description:
      '서비스마다 회원·비밀번호·인증 로직을 반복하지 않도록 회원 원본과 인증 책임을 중앙 서버로 분리하고, 첫 운영 서비스에서 UUID 기반 데이터 연결과 로컬 토큰 검증을 구현한 프로젝트입니다.',
    iconName: 'ShieldCheck',
    category: 'Backend',
    techStack: ['JavaScript', 'Express', 'TypeScript', 'NestJS', 'MySQL', 'Prisma', 'Jenkins', 'PM2'],
    status: 'Production',
    overview:
      '1인 백엔드 개발자로 Express 기반 초기 서버부터 NestJS·Prisma 전환까지 중앙 회원 관리·인증 서버 전반을 설계하고 구현했습니다. ID·비밀번호·UUID를 중앙에서 관리하고, 첫 번째 운영 서비스가 중앙 서버에서 인증과 토큰 발급을 처리하면서도 자신의 도메인 데이터는 별도 DB에 유지하도록 구성했습니다.',
    period: '2024.07 – 2025.06',
    team: 'BE 1명 (본인)'
  },
  {
    slug: 'hipass-b2b-platform',
    title: '화훼 도소매 B2B 주문 플랫폼',
    description:
      '전화·팩스·카카오톡 주문과 계좌이체에 의존하던 화훼 거래를 온라인 주문·승인·배송·결제·정산 흐름으로 새로 구축한 B2B 플랫폼입니다.',
    iconName: 'Store',
    category: 'Fullstack',
    techStack: ['JavaScript', 'React', 'Node.js', 'Express', 'MySQL', 'Sequelize', 'Jenkins', 'Socket.io'],
    status: 'Archived',
    overview:
      '백엔드 전반을 혼자 담당하고 프론트엔드 2인 개발에 참여해 거래 흐름과 기능 단위 구조를 구축했습니다. 신규 거래 운영은 2026년 6월 종료됐으며 현재는 관리자 조회와 기존 데이터 보존 상태를 유지합니다.',
    period: '2024.08 – 2025.08',
    team: 'FE 2명 (본인 포함) / BE 1명 (본인)'
  },
  {
    slug: 'hotel-reservation-platform',
    title: '호텔 예약 시스템 플랫폼화 및 구조 고도화',
    description:
      '하나의 코드베이스에 누적된 호텔별 조건 분기를 설정 중심 구조로 정리하고, 2026년에는 core·rsConfig·platform 경계의 단일 기준 소스로 리빌딩한 예약 플랫폼입니다.',
    iconName: 'LayoutTemplate',
    category: 'Frontend',
    techStack: ['JavaScript', 'React', 'PHP', 'MySQL', 'Sequelize', 'Jenkins'],
    status: 'Production',
    overview:
      'Config 중심의 1차 플랫폼 구조를 설계·주요 구현한 뒤, 호텔별 운영 브랜치의 편차를 줄이기 위해 core와 platform 경계를 다시 설계하고 주요 마이그레이션을 수행했습니다. 2026년 8월 기준 새 구조로 전환한 5개 플랫폼이 운영됐습니다.',
    period: '2024.11 – 2025.10 / 2026.06 – 2026.08',
    team: 'FE 2명 (본인 포함) / BE 1명'
  },
  {
    slug: 'integrated-reservation-platform',
    title: '행사 호텔 예약·결제 통합 플랫폼',
    description: '행사별 호텔 예약·결제 운영을 위해 신규 구축한 시스템입니다.',
    iconName: 'Server',
    category: 'Backend',
    techStack: ['TypeScript', 'NestJS', 'MySQL', 'Prisma', 'Jenkins', 'PM2', 'Cloudflare'],
    status: 'On Hold',
    overview:
      '행사별 호텔 예약·결제 운영을 위해 신규 구축한 시스템입니다. 고객사는 스테이징에서 핵심 객실 예약 흐름과 PG 테스트 결제를 UAT로 확인했으며, 정식 운영 전 고객사 측 사업 여건으로 개발이 보류됐습니다.',
    period: '2025.12 – 2026.03',
    team: 'FE 3명 / BE 1명 (본인) / PM·PL 겸임'
  }
];
