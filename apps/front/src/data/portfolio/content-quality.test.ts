import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { getAllFeatures, getAllInsights, getAllStudies, getFeatureBySlug, getFeatureDetailBySlug } from './index';

const CANONICAL_HARNESS_HEADINGS = [
  '규칙 문서가 아니라 같은 행동을 만드는 하네스',
  'Jenkins 제거에서 반복 가능한 개발 운영으로',
  '하네스는 어떻게 발전했는가',
  'v1: 파일을 복사하면 시작은 쉽지만 변경을 전파하기 어렵다',
  'CLI와 doctor: 사람이 기억하던 절차를 실행 가능한 계약으로',
  '같은 문장을 복사해도 Claude Code와 Codex는 다르게 행동했다',
  '채팅이 아니라 spec을 작업 상태의 정본으로',
  '운영에서 발견한 마찰을 다시 규칙과 검증으로 돌려보내다',
  'harness.lock: 공통 변경과 프로젝트 소유권을 분리하다',
  '멀티 세션: 규칙 통일 다음에는 실행 환경 격리가 필요했다',
  '적용 범위와 비용',
  '회고'
] as const;

const APPROVED_JENKINS_COPY = readFileSync(
  new URL(
    '../../../../../specs/007-portfolio-content-authoring/jenkins-matrix-insight-approved-copy.md',
    import.meta.url
  ),
  'utf8'
);

const extractApprovedJenkinsCopy = (source: string): { excerpt: string; content: string } => {
  const excerptMarker = '## Excerpt';
  const contentMarker = '## Content';
  const excerptMatches = [...source.matchAll(/^## Excerpt$/gm)];
  const contentMatches = [...source.matchAll(/^## Content$/gm)];

  if (excerptMatches.length !== 1) {
    throw new Error(`${excerptMarker} marker must appear exactly once; found ${excerptMatches.length}.`);
  }
  if (contentMatches.length !== 1) {
    throw new Error(`${contentMarker} marker must appear exactly once; found ${contentMatches.length}.`);
  }

  const excerptStart = excerptMatches[0].index! + excerptMarker.length;
  const contentStart = contentMatches[0].index!;
  if (contentStart <= excerptStart) {
    throw new Error(`${contentMarker} marker must follow ${excerptMarker}.`);
  }
  if (/^## /m.test(source.slice(excerptStart, contentStart))) {
    throw new Error(`${contentMarker} marker must be the next document heading after ${excerptMarker}.`);
  }

  const excerpt = source.slice(excerptStart, contentStart).trim();
  const content = source.slice(contentStart + contentMarker.length).trim();
  if (!excerpt || !content) {
    throw new Error(`${excerptMarker} and ${contentMarker} sections must both contain text.`);
  }

  return { excerpt, content };
};

const APPROVED_JENKINS_SECTIONS = extractApprovedJenkinsCopy(APPROVED_JENKINS_COPY);

const splitClaimSentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const getNearbySentences = (text: string, matcher: RegExp) => {
  const sentences = splitClaimSentences(text);
  const nearby = new Set<string>();

  sentences.forEach((sentence, index) => {
    if (!matcher.test(sentence)) return;
    sentences.slice(Math.max(0, index - 1), index + 2).forEach((candidate) => nearby.add(candidate));
  });

  return [...nearby].join('\n');
};

const UNAPPROVED_SYSLOG_YEAR_MONTH = /20\d{2}(?:[.-](?:0[1-9]|1[0-2])|년\s*(?:[1-9]|1[0-2])월)/g;
const APPROVED_SIENA_YEAR_MONTHS = new Set([
  '2023.05',
  '2023.06',
  '2023년 5월',
  '2023년 6월',
  '2026-09',
  '2026.09',
  '2026년 9월'
]);

const findUnqualifiedClaims = (text: string, topic: RegExp, positiveClaim: RegExp) =>
  splitClaimSentences(text).filter(
    (sentence) =>
      topic.test(sentence) &&
      positiveClaim.test(sentence) &&
      !/(?:아니|아닌|않|못|없|제한|범위|하한|미확인|미검증)/.test(sentence)
  );

interface LimitedClaimRule {
  claim: RegExp;
  directLimitation: RegExp;
}

const splitClaimClauses = (sentence: string) =>
  sentence
    .split(/(?:지만|으나|반면|그러나|다만|[;,])/)
    .map((clause) => clause.trim())
    .filter(Boolean);

const hasForbiddenClaimOccurrence = (clause: string, { claim, directLimitation }: LimitedClaimRule) => {
  const occurrencePattern = new RegExp(claim.source, `${claim.flags.replaceAll('g', '')}g`);
  const occurrences = [...clause.matchAll(occurrencePattern)];

  return occurrences.some((occurrence, index) => {
    const start = occurrence.index;
    const end = occurrences[index + 1]?.index ?? clause.length;
    return !directLimitation.test(clause.slice(start, end));
  });
};

const FORBIDDEN_OPERATION_CLAIMS: LimitedClaimRule[] = [
  {
    claim: /완성형 BFF/,
    directLimitation: /완성형 BFF(?:가|는|은|이|를|을|로|라고|도)?\s*(?:아니|않|못|없|미완성|구현하지|구축하지)/
  },
  {
    claim: /응답 (?:조합|가공)/,
    directLimitation: /응답 (?:조합|가공)(?:이|가|은|는|을|를|도)?\s*(?:아니|않|못|없|미구현|구현하지|제공하지)/
  },
  {
    claim: /프론트 전용 권한/,
    directLimitation: /프론트 전용 권한(?:이|가|은|는|을|를|도)?\s*(?:아니|않|못|없|미구현|구현하지|제공하지)/
  },
  {
    claim: /전 환경 정상/,
    directLimitation: /전 환경 정상(?:화|화되| 동작)?(?:이|가|은|는|을|를|도)?\s*(?:아니|않|못|없|미완성|되지)/
  },
  {
    claim: /운영 (?:건수|장애율|성과|지표)/,
    directLimitation:
      /운영 (?:건수|장애율|성과|지표)(?:이|가|은|는|을|를|도)?\s*(?:아니|않|못|없|미측정|미확인|측정하지|확인하지|검증하지)/
  },
  {
    claim:
      /(?:성능(?:(?!개선|%|퍼센트|[,;.!?\n]).){0,32}(?:개선(?:률)?|\d+(?:\.\d+)?\s*(?:%|퍼센트))|\d+(?:\.\d+)?\s*(?:%|퍼센트)[^,;.!?\n]{0,16}?개선)/,
    directLimitation:
      /(?:성능(?:(?![,;.!?\n]).){0,48}(?:개선(?:률)?|\d+(?:\.\d+)?\s*(?:%|퍼센트))|\d+(?:\.\d+)?\s*(?:%|퍼센트)[^,;.!?\n]{0,16}?개선)(?:(?![,;.!?\n]).){0,24}(?:아니|않|못|없|미측정|미검증|측정하지|검증하지)/
  }
];

const findForbiddenOperationClaimSentences = (text: string) =>
  splitClaimSentences(text).filter((sentence) =>
    splitClaimClauses(sentence).some((clause) =>
      FORBIDDEN_OPERATION_CLAIMS.some((rule) => hasForbiddenClaimOccurrence(clause, rule))
    )
  );

const FEATURE_015_REJECTED_CLAIMS = [
  /백엔드[^.\n]*(?:전적으로|완전히|모두)[^.\n]*(?:단독|혼자)|(?:전적으로|완전히|모두)[^.\n]*백엔드[^.\n]*(?:단독|혼자)/,
  /실제 (?:데이터베이스|DB)[^.\n]*병렬[^.\n]*(?:통합 ?(?:테스트|검증))[^.\n]*(?:완료|통과|검증)/,
  /운영[^.\n]*정합성[^.\n]*(?:완전히|항상|전면적으로)?\s*(?:보장|확보)/,
  /(?:완성된|완전한)[^.\n]*(?:결제[^.\n]*)?보상 흐름|(?:결제[^.\n]*)?보상 흐름[^.\n]*(?:완성|구축 완료)/,
  /운영 장애[^.\n]*(?:해결|복구|해소)/,
  /임의[^.\n]*상품[^.\n]*(?:(?:무변경|변경 없이)[^.\n]*(?:확장|추가)|(?:확장|추가)[^.\n]*(?:무변경|변경 없이))/
] as const;

const findFeature015RejectedClaimSentences = (text: string) =>
  splitClaimSentences(text).filter((sentence) => FEATURE_015_REJECTED_CLAIMS.some((claim) => claim.test(sentence)));

describe('상세 콘텐츠 품질 계약', () => {
  it('모든 작업물은 면접관이 사고 흐름을 따라갈 수 있는 공통 섹션을 가진다', () => {
    const requiredSections = [
      '나의 역할과 책임 범위',
      '문제 상황과 제약 조건',
      '대안 검토와 선택',
      '결과와 검증',
      '회고와 다음 개선'
    ];

    for (const feature of getAllFeatures()) {
      if (getFeatureDetailBySlug(feature.slug)) continue;

      const { slug } = feature;
      for (const section of requiredSections) {
        expect(feature.content, `${slug}: ${section}`).toContain(section);
      }
    }
  });

  it('모든 작업물은 문제와 해결 흐름을 설명하는 본문을 가진다', () => {
    for (const feature of getAllFeatures()) {
      const detail = getFeatureDetailBySlug(feature.slug);

      if (detail) {
        expect(detail.problem, feature.slug).toMatch(/문제|복잡도/);
        expect(detail.outcomes, feature.slug).toMatch(/결과|적용|운영/);
        continue;
      }

      expect(feature.content, feature.slug).toBeTruthy();
      expect(feature.content, feature.slug).toMatch(/문제|챌린지/);
      expect(feature.content, feature.slug).toMatch(/해결|결과|회고/);
    }
  });

  it('공부와 인사이트 상세 페이지는 비어 있지 않은 장문 본문을 가진다', () => {
    for (const entry of [...getAllStudies(), ...getAllInsights()]) {
      const content = entry.content ?? '';
      expect(content, entry.slug).toBeTruthy();
      expect(content.trim().length, entry.slug).toBeGreaterThan(240);
    }

    for (const study of getAllStudies()) {
      expect(study.content, study.slug).toMatch(/적용 기준/);
    }
  });

  it('인사이트 본문은 독자가 구조를 파악할 수 있는 Markdown 소제목을 가진다', () => {
    for (const insight of getAllInsights()) {
      expect(insight.content, insight.slug).toMatch(/^#{1,3} .+/m);
    }
  });

  it('하네스 outcomes는 측정·관찰·산정 근거를 자체적으로 구분한다', () => {
    const detail = getFeatureDetailBySlug('codi-harness-dx-platform');
    const outcomes = detail?.outcomes ?? '';

    expect(outcomes).toContain('실행 화면 기준');
    expect(outcomes).toContain('현재까지 다시 관찰되지 않았습니다');
    expect(outcomes).toContain('공개 가격으로 계산한 월 $151.84 컴퓨팅 추정치');
    expect(outcomes).toContain('스토리지·네트워크·세금은 포함하지 않습니다');
    expect(outcomes).not.toContain('성공률 100%');
    expect(outcomes).not.toContain('향후 발생 가능성이 0입니다');
    expect(outcomes).not.toContain('완전 무결점');
  });

  it('canonical insight는 승인된 발전 서사와 단독 설계·행동 패리티 근거를 깊이 있게 제공한다', () => {
    const canonicalInsight = getAllInsights().find(({ slug }) => slug === 'codi-harness-dx-platform-design');
    const content = canonicalInsight?.content ?? '';
    const headings = [...(canonicalInsight?.content ?? '').matchAll(/^## (.+)$/gm)].map(([, heading]) => heading);

    expect(canonicalInsight?.title).toBe('DX 하네스 v2: 복사형 도구에서 사내 개발 운영 플랫폼까지');
    expect(canonicalInsight?.readTime).toBe('9 min');
    expect(headings).toEqual(CANONICAL_HARNESS_HEADINGS);
    expect(content.trim().length).toBeGreaterThan(6500);
    expect(content).not.toContain('전적으로 혼자 구성하고 설계했습니다');
    expect(content).toContain(
      '공통 정책과 소유권 경계, `./harness` CLI와 doctor, Claude Code·Codex의 규칙 집행 방식, 회귀 검증과 패키징 구조까지 직접 설계하고 구현했습니다'
    );
    expect(content).toContain('제가 만든 도구가 아닙니다');
    expect(content).toContain('Jenkins 서버와 플러그인을 직접 관리해야 하는 부담');
    expect(content).toContain('약 2개월 동안 사용');
    expect(content).toContain('같은 변경을 여러 저장소에 다시 복사하고 커밋');
    expect(content).toContain('./harness doctor');
    expect(content).toContain('사용자 확인 지점에서 멈추지 않고 다음 계획 단계까지 진행한 사례');
    expect(content).toContain('사용자의 명시적인 codi-auto-loop 요청 대기');
    expect(content).toContain('양 런타임의 공통 계약');
    expect(content).toContain('spec.md');
    expect(content).toContain('Feature Hub');
    expect(content).toContain('코드베이스 전체를 반복해서 탐색하고 이전 판단을 다시 복원해야 하는 범위');
    expect(content).toContain('약 5주간의 초기 감사');
    expect(content).toContain('Playwright MCP');
    expect(content).toContain('CHANGELOG');
    expect(content).toContain('harness.lock');
    expect(content).toContain('약 2주');
    expect(content).toContain('운영 확장 실험');
    expect(content).toMatch(/2026-08-20 기준[^.\n]*11개[^.\n]*8개[^.\n]*3명/);
    expect(content).not.toContain('약 15분에서 약 3분');
    expect(content).not.toContain('$151.84');
    expect(content).not.toContain('토큰 사용량');
    expect(content).not.toContain('성공률 100%');
    expect(content).not.toContain('공개 데모');
  });
});

describe('행사 호텔 예약·결제 통합 플랫폼 공개 콘텐츠 RED 계약', () => {
  const feature = () => getFeatureBySlug('integrated-reservation-platform');
  const detail = () => getFeatureDetailBySlug('integrated-reservation-platform');

  const publicCorpus = () => {
    const target = feature();
    const targetDetail = detail();
    return [
      target?.description,
      target?.overview,
      targetDetail?.role,
      targetDetail?.problem,
      targetDetail?.constraints,
      targetDetail?.alternatives,
      targetDetail?.implementation,
      targetDetail?.outcomes,
      targetDetail?.retrospective,
      ...(targetDetail?.highlights.flatMap(({ evidence, caveat }) => [evidence, caveat]) ?? [])
    ].join('\n');
  };

  it('승인된 제목·기간·팀·On Hold와 legacy 본문 제거를 제공한다', () => {
    const target = feature();
    expect(target, '승인된 카드 메타와 legacy 본문 제거 계약이 필요합니다.').toMatchObject({
      title: '행사 호텔 예약·결제 통합 플랫폼',
      period: '2025.12 – 2026.03',
      team: 'FE 3명 / BE 1명 (본인) / PM·PL 겸임',
      status: 'On Hold',
      content: undefined
    });
    expect(target?.description).toBe('행사별 호텔 예약·결제 운영을 위해 신규 구축한 시스템입니다.');
    expect(target?.overview).toBe(
      '행사별 호텔 예약·결제 운영을 위해 신규 구축한 시스템입니다. 고객사는 스테이징에서 핵심 객실 예약 흐름과 PG 테스트 결제를 UAT로 확인했으며, 정식 운영 전 고객사 측 사업 여건으로 개발이 보류됐습니다.'
    );
    expect(detail()?.alternatives).toBe(
      '당시 별도의 대안을 비교한 기록은 남아 있지 않습니다. 구현에서는 Products를 공통 상품 부모로 두고 객실과 관광 세부 모델을 연결했으며, 주문 항목이 공통 productId를 참조하도록 구성했습니다. 외부 PG가 내부 데이터베이스 트랜잭션에 포함되지 않는 경계를 고려해 주문·재고 사전 기록, PG 승인, 주문·결제 확정을 단계별로 나눴습니다. 브라우저의 API 직접 호출에서 쿠키 저장·전달 실패를 확인한 뒤에는 Next.js reverse proxy로 요청 Origin을 프론트엔드에 맞췄습니다.'
    );
  });

  it('네 근거 카드의 값·reported 종류·기준 시점과 관찰 한계를 모두 제공한다', () => {
    const targetDetail = detail();
    expect(targetDetail?.highlights, '카드별 근거와 한계는 승인된 관찰 의미를 그대로 유지해야 합니다.').toEqual([
      {
        id: 'backend-leadership',
        label: '역할 범위',
        value: '1인 백엔드 · PM/PL',
        kind: 'reported',
        asOf: '2026-03',
        evidence: '사용자 인터뷰에서 백엔드 전반과 PM·PL 책임을 확인한 보고값입니다.',
        caveat: 'FE 3명과 협업했고 프론트엔드 개발자의 일시적 관리자 목록 API 기여 1건이 있었습니다.'
      },
      {
        id: 'customer-uat',
        label: '고객사 검증',
        value: '핵심 객실 예약 흐름 UAT',
        kind: 'reported',
        asOf: '2026-03',
        evidence: '고객사가 스테이징에서 행사 생성부터 관리자 예약 취소까지 확인한 사용자 보고값입니다.',
        caveat: '핵심 객실 예약 흐름의 확인이며 전체 기능 완성이나 운영 검증은 아닙니다.'
      },
      {
        id: 'payment-scope',
        label: '결제 검증 환경',
        value: 'PG 테스트 환경',
        kind: 'reported',
        asOf: '2026-03',
        evidence: '고객사 UAT에서 결제 승인과 취소를 PG 테스트 환경으로 확인한 사용자 보고값입니다.',
        caveat: '실제 운영 결제가 아니라 테스트 승인·취소 범위입니다.'
      },
      {
        id: 'delivery-status',
        label: '공개 상태',
        value: '정식 운영 전 보류',
        kind: 'reported',
        asOf: '2026-03',
        evidence:
          '정식 운영을 시작하기 전에 프로젝트가 멈춘 상태를 기록한 사용자 보고값이며, 현재 개발 중이거나 기술 실패했다는 의미가 아닙니다.',
        caveat: '고객사 측 사업 여건으로 개발 보류'
      }
    ]);
  });

  it('역할·신규 구축·UAT·PG 미완성·BFF와 현재 인증 회고를 승인 경계로 제공한다', () => {
    const publicText = publicCorpus();

    expect(publicText, '1인 백엔드 책임을 축소하거나 공동 백엔드처럼 표현하면 안 됩니다.').toMatch(/1인 백엔드/);
    expect(publicText, 'PM·PL로 고객사와 FE 3명의 우선순위·분담·API 계약을 조율한 범위가 필요합니다.').toMatch(
      /PM.?PL[^.\n]*(?:FE 3명|고객사)|(?:FE 3명|고객사)[^.\n]*PM.?PL/
    );
    expect(publicText, 'FE의 일시적 관리자 목록 API 기여 1건을 협업 경계로 밝혀야 합니다.').toMatch(
      /(?:FE|프론트엔드)[^.\n]*(?:일시적|일시적으로)[^.\n]*(?:API|백엔드)[^.\n]*1건/
    );
    expect(publicText).toMatch(/신규 구축/);
    expect(publicText).toMatch(/스테이징[^.\n]*(?:UAT|고객사)|(?:UAT|고객사)[^.\n]*스테이징/);
    expect(publicText).toMatch(/PG 테스트 환경/);
    expect(publicText, 'PG 승인 실패 때 차감 재고 즉시 복구가 미완성이었던 사실을 숨기면 안 됩니다.').toMatch(
      /PG 승인 실패[^.\n]*재고[^.\n]*(?:즉시 복구|자동 복구)[^.\n]*미완성/
    );
    expect(publicText).toMatch(/reverse proxy[^.\n]*BFF|BFF[^.\n]*reverse proxy/);
    expect(publicText).toMatch(/Cloudflare[^.\n]*스테이징|스테이징[^.\n]*Cloudflare/);
    expect(publicText).toMatch(/Express[^.\n]*Middleware/);
    expect(publicText).toMatch(/현재[^.\n]*Global Auth Guard/);
  });

  it('작업물과 근거 카드에서 공개 금지 사실과 과장된 운영 주장을 제거한다', () => {
    const publicText = publicCorpus();
    const claimSentences = publicText
      .split(/[.\n]+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => /\S/.test(sentence));
    const publicDomains = [...publicText.matchAll(/\b(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}\b/g)].map(([domain]) => domain);
    const approvedDotTokens = new Set(['A-domain.com', 'api.A-domain.com', 'Next.js', 'req.user']);

    expect(publicText).toMatch(/고객사 측 사업 여건[^.\n]*개발 보류/);
    expect(claimSentences.filter((sentence) => /고객사 측 사업 여건/.test(sentence))).toEqual([
      '고객사는 스테이징에서 핵심 객실 예약 흐름과 PG 테스트 결제를 UAT로 확인했으며, 정식 운영 전 고객사 측 사업 여건으로 개발이 보류됐습니다',
      '고객사 측 사업 여건으로 개발 보류'
    ]);
    expect(publicText).toMatch(/정식 운영[^.\n]*(없|아니)/);
    expect(publicText).toMatch(/실제 운영 결제[^.\n]*(없|아니)/);
    expect(publicDomains.filter((domain) => !approvedDotTokens.has(domain))).toEqual([]);
    expect(claimSentences.filter((sentence) => /고객사[^.\n]*(?:자금|재정|예산|사업 자금)/.test(sentence))).toEqual([]);
    expect(findForbiddenOperationClaimSentences(publicText)).toEqual([]);
    expect(findFeature015RejectedClaimSentences(publicText)).toEqual([]);
    for (const forbidden of [
      /(?:서버 )?IP(?: 주소)?\s*[:=]?\s*\d{1,3}(?:\.\d{1,3}){3}/i,
      /(?:api[_ -]?key|secret|시크릿|인증값|password|비밀번호)\s*[:=]\s*["']?[^\s"']+/i,
      /JOIN\s*(?:Depth|단계)?\s*\d+|최대\s*\d+\s*단계/i,
      /불일치[^.\n]*0건|고아 재고[^.\n]*0건|초과 예약[^.\n]*(?:완전|방지)/,
      /(?:예약|결제|재고)[^.\n]*(?:하나의|단일)[^.\n]*트랜잭션/,
      /Middleware[^.\n]*(?:항상|완전히|누락.*0)|모든 (?:클라이언트 )?AES[^.\n]*(?:제거|없)/i
    ]) {
      expect(publicText).not.toMatch(forbidden);
    }
  });

  it('금지 claim에 직접 붙은 부정·한계만 허용하고 같은 문장의 무관한 제한절은 면제로 쓰지 않는다', () => {
    const rejected = [
      '완성형 BFF를 구축했지만 운영 지표는 없다',
      '성능이 30% 개선됐지만 정식 운영은 없다',
      '응답 조합을 구현했고 일부 제한은 남아 있다',
      '초기에는 완성형 BFF가 아니었지만 이후 완성형 BFF를 구축했다',
      '성능 개선은 없었지만 이후 30% 개선했다'
    ];
    const allowed = [
      '완성형 BFF가 아니라 reverse proxy 단계였다',
      '운영 지표는 없다',
      '완성형 BFF가 아니었다',
      '성능 개선은 없었다'
    ];

    expect(findForbiddenOperationClaimSentences(rejected.join('\n'))).toEqual(rejected);
    expect(findForbiddenOperationClaimSentences(allowed.join('\n'))).toEqual([]);
  });

  it.each([
    [
      '역할 과장',
      'FE의 일시적 관리자 목록 API 기여 1건이 있었지만 백엔드를 전적으로 단독 구현했습니다.',
      'FE 3명 중 프론트엔드 개발자 한 명의 일시적 관리자 목록 API 기여 1건을 협업 경계로 기록합니다.'
    ],
    [
      '실제 DB 병렬 통합 완료',
      '실제 데이터베이스 병렬 요청을 포함한 통합 테스트를 완료했습니다.',
      '실제 데이터베이스 병렬 요청을 포함한 통합 검증 범위는 아닙니다.'
    ],
    ['운영 정합성 보장', '운영 재고 정합성을 완전히 보장했습니다.', '정식 운영은 시작하지 않았습니다.'],
    [
      '완성된 보상 흐름',
      '완성된 결제 보상 흐름을 구축했습니다.',
      'PG 승인 실패 때 차감 재고의 즉시 복구는 보류 시점에 미완성이었습니다.'
    ],
    ['운영 장애 해결', '운영 장애를 해결했습니다.', '고객사 스테이징 통신과 인증 흐름을 복구했습니다.'],
    [
      '임의 상품 무변경 확장',
      '임의 상품을 무변경 확장할 수 있습니다.',
      'Products를 공통 상품 부모로 두고 객실과 관광 세부 모델을 연결했습니다.'
    ]
  ])('%s 금지 주장은 승인된 한계 문구와 공존해도 탐지한다', (_label, rejected, approvedBoundary) => {
    expect(findFeature015RejectedClaimSentences(rejected)).toEqual([rejected]);
    expect(findFeature015RejectedClaimSentences(`${approvedBoundary}\n${rejected}`)).toEqual([rejected]);
  });
});

describe('행사 호텔 예약·결제 연결 인사이트 공개 문구 RED 계약', () => {
  const insightBySlug = (slug: string) => getAllInsights().find((insight) => insight.slug === slug);

  it('Middleware 글은 당시 책임과 현재 Global Guard 판단을 검증 범위와 함께 분리한다', () => {
    const target = insightBySlug('nestjs-middleware-vs-guard-tradeoff');
    const publicText = `${target?.excerpt ?? ''}\n${target?.content ?? ''}`;

    expect(publicText).toMatch(/Express[^#]*AdminAuthMiddleware[^#]*AdminLevelGuard/);
    expect(publicText).toMatch(/현재의 판단[^#]*Global Auth Guard[^#]*공개 경로[^#]*권한 Guard/);
    expect(publicText).toMatch(/다시 구현하거나 운영으로 검증한 결과가 아니/);
    expect(publicText).not.toMatch(/MiddlewareConsumer|수십 개의 `\/admin`|압도적으로 유리|훨씬 더 견고/);
  });

  it('BFF 글은 관찰된 쿠키 실패와 reverse proxy·Cloudflare 스테이징 경계만 공개한다', () => {
    const target = insightBySlug('nextjs-nestjs-domain-separation-and-bff');
    const publicText = `${target?.excerpt ?? ''}\n${target?.content ?? ''}`;

    expect(publicText).toMatch(/A-domain\.com[^#]*api\.A-domain\.com[^#]*서로 다른 Origin/);
    expect(publicText).toMatch(/쿠키[^#]*(?:저장|전달)[^#]*정확한 실패 원인[^#]*단정하지 않/);
    expect(publicText).toMatch(/\/bff[^#]*Next\.js rewrite[^#]*reverse proxy/);
    expect(publicText).toMatch(/Cloudflare[^#]*고정 IP[^#]*고객사 스테이징/);
    expect(publicText).toMatch(/모든 외부 API 호출[^#]*일반화하지 않/);
    expect(publicText).not.toMatch(/A\.com|B\.com|대기업|Webpack|써드 파티 쿠키|스트림\(Stream\)|Private Network/);
  });

  it('HTTPS 글은 Payload·TLS·bcrypt와 비밀번호 전송용 제거 범위를 구분한다', () => {
    const target = insightBySlug('https-and-plaintext-password-transmission');
    const publicText = `${target?.excerpt ?? ''}\n${target?.content ?? ''}`;

    expect(publicText).toMatch(/Request Payload[^#]*네트워크[^#]*오해/);
    expect(publicText).toMatch(/구글과 네이버[^#]*HTTPS[^#]*별도의 클라이언트 암호화 없이/);
    expect(publicText).toMatch(/비밀번호 전송[^#]*클라이언트 암호화를 제거[^#]*bcrypt/);
    expect(publicText).toMatch(/예약 임시 데이터[^#]*sessionStorage[^#]*AES[^#]*남아/);
    expect(publicText).toMatch(/모든 애플리케이션 계층 암호화[^#]*일반화하지 않/);
    expect(publicText).not.toMatch(/mySecretPassword|AWS|Argon2|미련 없이 전부 폐기/);
  });
});

describe('하이패스 구조화 콘텐츠 계약', () => {
  const feature = () => getFeatureBySlug('hipass-b2b-platform');
  const detail = () => getFeatureDetailBySlug('hipass-b2b-platform');

  it('legacy 본문을 제거하고 코드 작업 기간·거래 운영 종료·현재 보존 상태를 구분한다', () => {
    expect(feature()?.content).toBeUndefined();
    expect(feature()?.period).toBe('2024.08 – 2025.08');
    expect(feature()?.status).toBe('Archived');
    expect(`${feature()?.description}\n${feature()?.overview}`).toMatch(/전화|팩스|카카오톡|계좌이체/);
    expect(`${feature()?.description}\n${feature()?.overview}`).toMatch(/2026년 6월|2026-06/);
    expect(`${feature()?.description}\n${feature()?.overview}`).toMatch(/관리자 조회|데이터 보존/);
  });

  it('백엔드 단독 책임과 프론트엔드 2인 협업 범위를 분리한다', () => {
    const role = detail()?.role ?? '';

    expect(role).toMatch(/백엔드[^.\n]*(혼자|단독)/);
    expect(role).toMatch(/프론트엔드[^.\n]*2명/);
    expect(role).toMatch(/기능[^.\n]*페이지[^.\n]*디렉터리|기능·페이지 단위/);
    expect(role).toMatch(/전역 상태/);
    expect(role).not.toMatch(/생산성[^.\n]*(향상|개선)[^.\n]*%/);
  });

  it('네 운영 지표의 단위·측정 종류·기준 시점과 관찰 한계를 보존한다', () => {
    const highlights = detail()?.highlights ?? [];

    expect(highlights.map(({ id, value, kind, asOf }) => ({ id, value, kind, asOf }))).toEqual([
      { id: 'monthly-orders', value: '약 100건', kind: 'measured', asOf: '2026-06' },
      { id: 'monthly-payment-volume', value: '약 400~500만 원', kind: 'measured', asOf: '2026-06' },
      { id: 'monthly-settlement-orders', value: '약 70건', kind: 'measured', asOf: '2026-06' },
      { id: 'monthly-paid-gardens', value: '약 10~20곳', kind: 'measured', asOf: '2026-06' }
    ]);
    expect(highlights.find(({ id }) => id === 'monthly-settlement-orders')?.evidence).toMatch(/완료 주문/);
    expect(highlights.find(({ id }) => id === 'monthly-paid-gardens')?.evidence).toMatch(/등록[^.\n]*약 50곳/);
    for (const metric of highlights) expect(metric.caveat, metric.id).toMatch(/근사|전수|평균|관찰/);
  });

  it('대사·결제 보상 결과를 검증 범위 안에서만 공개한다', () => {
    const target = detail();
    const publicText = [
      feature()?.description,
      feature()?.overview,
      target?.problem,
      target?.constraints,
      target?.alternatives,
      target?.implementation,
      target?.outcomes,
      target?.retrospective
    ].join('\n');

    expect(target?.outcomes).toMatch(/월 2회/);
    expect(target?.outcomes).toMatch(/지급대행[^.\n]*대조|대사/);
    expect(target?.outcomes).toMatch(/불일치[^.\n]*중복[^.\n]*(확인하지 못|관찰되지 않)/);
    expect(publicText).toMatch(/취소 API[^.\n]*실패/);
    expect(publicText).toMatch(/자동 복구[^.\n]*(없|구현하지)/);
    expect(publicText).not.toMatch(/간이 Outbox|RabbitMQ|Kafka|k6|K6|ACK|DLQ|Redis Stream|Redis Adapter/);
    expect(publicText).not.toMatch(/Polling[^.\n]*(제거|걷어)/);
    expect(publicText).not.toMatch(/외부 결제와 내부 (?:주문 )?DB를 하나의 원자적 트랜잭션으로 (?:묶었|처리했)/);
  });
});

describe('하이패스 정산 인사이트 사실 계약', () => {
  const insight = () => getAllInsights().find(({ slug }) => slug === 'json-outbox-pattern-for-settlement');

  it('DB 상태와 JSON 재처리 입력의 역할을 분리한다', () => {
    const target = insight();
    const text = `${target?.excerpt ?? ''}\n${target?.content ?? ''}`;

    expect(target?.title).toBe('정산 상태는 DB에, 재처리 입력은 JSON에 둔 이유');
    expect(target?.featureSlug).toBe('hipass-b2b-platform');
    expect(text).toMatch(/PENDING[^#]*PROCESSING[^#]*COMPLETED/);
    expect(text).toMatch(/DB[^.\n]*(?:판단 기준|기준|판단)/);
    expect(text).toMatch(/JSON[^.\n]*(?:보조 저장소|재처리 입력)/);
    expect(text).toMatch(/지급 (?:요청 )?직전[^.\n]*DB 상태[^.\n]*다시 (?:조회|확인)/);
    expect(text).toMatch(/PROCESSING[^.\n]*(?:건만|상태만)[^.\n]*지급/);
    expect(text).toMatch(/COMPLETED[^.\n]*(?:다시 지급하지|건너)/);
    expect(text).toMatch(/복잡한 쿼리[^.\n]*계산[^.\n]*(?:정산 대상|금액|지급 입력)/);
  });

  it('성공 제거·실패 보존과 10시·14시 재시도를 실제 구현 범위로 설명한다', () => {
    const text = `${insight()?.excerpt ?? ''}\n${insight()?.content ?? ''}`;

    expect(text).toMatch(/성공[^.\n]*DB[^.\n]*COMPLETED[^.\n]*JSON[^.\n]*제거/);
    expect(text).toMatch(/실패[^.\n]*JSON[^.\n]*(?:남|보존)/);
    expect(text).toMatch(/매일[^.\n]*10시[^.\n]*14시/);
    expect(text).toMatch(/재시도[^.\n]*DB 상태[^.\n]*다시 (?:조회|확인)|DB 상태[^.\n]*다시 (?:조회|확인)[^.\n]*재시도/);
    expect(text).toMatch(/단일 PM2 (?:프로세스|스케줄러)/);
    expect(text).toMatch(/다중 웹 워커[^.\n]*중복 실행[^.\n]*(?:막|방지)/);
    expect(text).toMatch(/웹 요청 처리[^.\n]*(?:분리|영향)/);
  });

  it('운영 관찰과 적용 경계를 보장으로 확대하지 않는다', () => {
    const text = `${insight()?.excerpt ?? ''}\n${insight()?.content ?? ''}`;

    expect(text).toMatch(/월 2회/);
    expect(text).toMatch(/2026년 6월[^#]*(?:JSON 파일 )?유실[^#]*손상[^#]*중복 실행[^#]*확인하지 못/);
    expect(text).toMatch(/지급대행[^.\n]*(?:대조|대사)/);
    expect(text).toMatch(/불일치[^.\n]*중복 지급[^.\n]*(?:확인하지 못|관찰되지 않)/);
    expect(text).toMatch(/단일 서버[^.\n]*단일 스케줄러[^.\n]*(?:작은|소규모)/);
    expect(text).toMatch(/로드밸런싱|스케일 아웃/);
    expect(text).toMatch(/로컬 JSON[^.\n]*(?:그대로 적용하지|피해야|적합하지)/);
    expect(text).toMatch(/Redis[^#]*DB(?:만으로| 단독)[^#]*스케줄러[^#]*(?:비교|검증)하지/);
  });

  it('당시 알지 못했거나 검증하지 않은 기술과 성과를 쓰지 않는다', () => {
    const text = `${insight()?.title ?? ''}\n${insight()?.excerpt ?? ''}\n${insight()?.content ?? ''}`;

    expect(text).not.toMatch(/Outbox|RabbitMQ|Kafka|Message Queue|Idempotency-Key/);
    expect(text).not.toMatch(/다음 영업일|DB (?:조회|재조회)(?:가|는|를)?\s*0회|DB 조회를 다시 할 필요 없이/);
    expect(text).not.toMatch(/금융 데이터의 무결성|데이터 유실을 방어|최후의 보루|획기적으로/);
    expect(text).not.toMatch(/Redis[^#]*(?:도입|전환|선택|구축)(?:할|하겠|합니다|했습니다)/);
  });
});

describe('하이패스 Socket.io 인사이트 사실 계약', () => {
  const insight = () => getAllInsights().find(({ slug }) => slug === 'socketio-realtime-architecture-and-reliability');

  it('신규 구축 당시 Polling과 비교해 Socket.io를 선택한 사실만 공개한다', () => {
    const target = insight();
    const text = `${target?.excerpt ?? ''}\n${target?.content ?? ''}`;

    expect(target?.title).toBe('공용 Room에서 화원별 User Room으로: 전달 범위와 전달 보장은 다르다');
    expect(target?.featureSlug).toBe('hipass-b2b-platform');
    expect(text).toMatch(/신규 구축[^#]*Polling[^#]*Socket\.io/);
    expect(text).toMatch(/즉시[^.\n]*상태[^.\n]*전달/);
    expect(text).not.toMatch(/기존[^.\n]*Polling[^.\n]*(?:제거|걷어|전환)/);
  });

  it('공용 Room의 과도한 수신 범위를 발견하고 화원별 Room으로 바꾼 과정을 설명한다', () => {
    const text = `${insight()?.excerpt ?? ''}\n${insight()?.content ?? ''}`;

    expect(text).toMatch(/개발[^.\n]*코드[^.\n]*(?:재검토|검토)/);
    expect(text).toMatch(/관계없는 사용자[^.\n]*주문 이벤트/);
    expect(text).toContain('`user_<gardenId>`');
    expect(text).toMatch(/주문 화원[^.\n]*수주 화원/);
    expect(text).toMatch(/서로 다른 화원 계정[^.\n]*관련 사용자[^.\n]*화면 갱신/);
    expect(text).toMatch(/성능[^.\n]*측정하지/);
  });

  it('전달 범위 개선을 메시지 도달 보장으로 확대하지 않는다', () => {
    const text = `${insight()?.excerpt ?? ''}\n${insight()?.content ?? ''}`;

    expect(text).toMatch(/공용 Room[^#]*서버 송신 기록[^#]*브라우저[^#]*수신하지 못/);
    expect(text).toMatch(/User Room[^#]*(?:재현하는 방법|재현 방법)[^#]*(?:찾지 못|확인하지 못)/);
    expect(text).toMatch(/Room 변경[^.\n]*유실[^.\n]*(?:해결|보장)[^.\n]*(?:주장하지|단정하지)/);
    expect(text).toMatch(/전달 범위[^.\n]*전달 보장[^.\n]*(?:다른|별개)/);
  });

  it('운영 PM2 3개 워커의 확인 범위와 미검증 경계를 함께 쓴다', () => {
    const text = `${insight()?.excerpt ?? ''}\n${insight()?.content ?? ''}`;

    expect(text).toMatch(/PM2[^.\n]*3개 워커/);
    expect(text).toMatch(/cluster adapter/i);
    expect(text).toMatch(/브라우저[^.\n]*소켓 이벤트[^.\n]*정상/);
    expect(text).toMatch(/워커 간[^.\n]*(?:전달|이벤트)[^.\n]*(?:분리해 검증하지|정확히 이해하지|확인하지 못)/);
    expect(text).not.toMatch(/k6|K6|ACK|Acknowledgement|DLQ|Dead Letter|Redis Stream|Redis Adapter|cursor|Inbox/);
    expect(text).not.toMatch(/O\(1\)|O\(N\)|1,000명|1만 명|트래픽[^.\n]*(?:감소|절감|개선)[^.\n]*%/);
  });

  it('사용자별 Room과 공용 Room의 적용 기준을 구분한다', () => {
    const text = `${insight()?.excerpt ?? ''}\n${insight()?.content ?? ''}`;

    expect(text).toMatch(/특정 사용자·조직[^.\n]*사용자별 Room/);
    expect(text).toMatch(/모두에게 같은 정보[^.\n]*공지성 이벤트[^.\n]*공용 Room/);
  });
});

describe('하이패스 작업물과 인사이트 공개 연결 계약', () => {
  const settlementTitle = '정산 상태는 DB에, 재처리 입력은 JSON에 둔 이유';
  const socketTitle = '공용 Room에서 화원별 User Room으로: 전달 범위와 전달 보장은 다르다';

  it('세 공개 slug와 두 insight의 project origin을 유지한다', () => {
    const feature = getFeatureBySlug('hipass-b2b-platform');
    const settlement = getAllInsights().find(({ slug }) => slug === 'json-outbox-pattern-for-settlement');
    const socket = getAllInsights().find(({ slug }) => slug === 'socketio-realtime-architecture-and-reliability');

    expect(feature?.slug).toBe('hipass-b2b-platform');
    expect(settlement).toMatchObject({ title: settlementTitle, featureSlug: 'hipass-b2b-platform' });
    expect(socket).toMatchObject({ title: socketTitle, featureSlug: 'hipass-b2b-platform' });
  });

  it('작업물 본문은 정정 제목과 기존 route를 함께 사용한다', () => {
    const implementation = getFeatureDetailBySlug('hipass-b2b-platform')?.implementation ?? '';

    expect(implementation).toContain(`[${settlementTitle}](/insights/json-outbox-pattern-for-settlement)`);
    expect(implementation).toContain(`[${socketTitle}](/insights/socketio-realtime-architecture-and-reliability)`);
  });
});

describe('호텔 예약 플랫폼 구조화 콘텐츠 계약', () => {
  const feature = () => getFeatureBySlug('hotel-reservation-platform');
  const detail = () => getFeatureDetailBySlug('hotel-reservation-platform');

  it('두 구축 시기와 3인 협업·현재 운영 상태를 legacy 본문 없이 구분한다', () => {
    const target = feature();
    const meta = `${target?.description ?? ''}\n${target?.overview ?? ''}\n${target?.period ?? ''}`;

    expect(target?.content).toBeUndefined();
    expect(target?.status).toBe('Production');
    expect(target?.team).toBe('FE 2명 (본인 포함) / BE 1명');
    expect(meta).toMatch(/2024\.11[^\n]*2025\.10/);
    expect(meta).toMatch(/2026\.06[^\n]*2026\.08/);
    expect(meta).toMatch(/5개[^.\n]*운영|운영[^.\n]*5개/);
  });

  it('사용자의 1차 주도 범위와 2026년 설계·마이그레이션 책임을 구분한다', () => {
    const role = detail()?.role ?? '';

    expect(role).toMatch(/Config|설정 중심/);
    expect(role).toMatch(/예약 상태/);
    expect(role).toMatch(/NICEPAY|모바일 결제/);
    expect(role).toMatch(/2026년[^#]*(?:core|`core`)[^#]*(?:platform|`platform`)[^#]*(?:설계|마이그레이션)/i);
    expect(role).toMatch(/FE[^.\n]*2명[^.\n]*BE[^.\n]*1명/);
    expect(role).not.toMatch(/전적으로 혼자|전체를 혼자|단독 개발/);
  });

  it('확인 가능한 세 지표만 근거 종류·시점·한계와 함께 공개한다', () => {
    const highlights = detail()?.highlights ?? [];

    expect(highlights.map(({ id, value, kind, asOf }) => ({ id, value, kind, asOf }))).toEqual([
      { id: 'production-platforms', value: '5개', kind: 'reported', asOf: '2026-08' },
      { id: 'canonical-source', value: '1개', kind: 'measured', asOf: '2026-08' },
      { id: 'parity-detection', value: '운영 배포 전', kind: 'reported', asOf: '2026-08' }
    ]);
    for (const metric of highlights) expect(metric.evidence, metric.id).not.toHaveLength(0);
    expect(JSON.stringify(highlights)).not.toMatch(/개발시간|배포시간|버그 감소|생산성|온보딩 속도/);
  });

  it('단일 조건 분기에서 설정과 core·rsConfig·platform 경계로 발전한 사실만 공개한다', () => {
    const target = detail();
    const publicText = [
      feature()?.description,
      feature()?.overview,
      target?.problem,
      target?.constraints,
      target?.alternatives,
      target?.implementation,
      target?.outcomes,
      target?.retrospective
    ].join('\n');

    expect(publicText).toMatch(/하나의 (?:공통 )?코드베이스[^#]*(?:조건 분기|if-else)/);
    expect(publicText).toMatch(/서버 설정[^#]*(?:환경변수|배포 브랜치)/);
    expect(publicText).toMatch(/core[^#]*rsConfig[^#]*platform/i);
    expect(publicText).toMatch(/플랫폼별[^.\n]*(?:빌드|build)[^.\n]*(?:배포|deploy)/i);
    expect(publicText).toMatch(/운영 배포 전[^#]*(?:패리티|차이|누락)/);
    expect(publicText).not.toMatch(/복제형|프로젝트를 복제|코드 수정 없이|배포 없이|N건\s*→\s*0건/);
    expect(publicText).not.toMatch(/단일 배포[^.\n]*(?:전체|모든) 호텔/);
  });

  it('Context와 NICEPAY 구현 범위를 확인하지 않은 성과로 확대하지 않는다', () => {
    const target = detail();
    const publicText = `${target?.implementation ?? ''}\n${target?.outcomes ?? ''}\n${target?.retrospective ?? ''}`;

    expect(publicText).toMatch(/Props Drilling/);
    expect(publicText).toMatch(/ReservationProvider|예약 라우터/);
    expect(publicText).toMatch(/sessionStorage[^.\n]*1시간/);
    expect(publicText).toMatch(/예약번호[^.\n]*(?:조회|최종 예약)/);
    expect(publicText).not.toMatch(/Provider Hell|Zustand|localStorage|React Query/);
    expect(publicText).not.toMatch(/접근 권한[^.\n]*(?:통제|차단)|리렌더링[^.\n]*(?:개선|제거)/);
    expect(publicText).not.toMatch(/가격[^.\n]*재고[^.\n]*재검증|불일치[^.\n]*(?:자동 취소|PG 승인 취소)/);
  });

  it('고객 정보·시크릿·비공개 소스와 내부 감사 수치를 공개하지 않는다', () => {
    const target = detail();
    const publicText = JSON.stringify({ feature: feature(), detail: target });

    expect(publicText).not.toMatch(
      /BEGIN (?:RSA |EC )?PRIVATE KEY|access[_-]?token|refresh[_-]?token|client[_-]?secret/i
    );
    expect(publicText).not.toMatch(/감사 대상[^.\n]*\d+개|누락 후보[^.\n]*\d+개/);
    expect(target?.constraints).toMatch(/고객 정보|비공개|시크릿/);
  });
});

describe('블랙스톤 구조화 콘텐츠 계약', () => {
  const detail = () => getFeatureDetailBySlug('blackstone-belleforet-resort');
  const feature = () => getFeatureBySlug('blackstone-belleforet-resort');
  const linkedInsight = () => getAllInsights().find(({ slug }) => slug === 'spa-api-key-exposure-and-bff-architecture');

  it('legacy 본문 없이 공통 상세 필드를 제공하고 데모를 만들지 않는다', () => {
    const feature = getFeatureBySlug('blackstone-belleforet-resort');
    const detail = getFeatureDetailBySlug('blackstone-belleforet-resort');

    expect(feature?.content).toBeUndefined();
    expect(detail).not.toBeNull();
    expect(detail).toMatchObject({
      role: expect.any(String),
      highlights: expect.any(Array),
      problem: expect.any(String),
      constraints: expect.any(String),
      alternatives: expect.any(String),
      implementation: expect.any(String),
      outcomes: expect.any(String),
      retrospective: expect.any(String)
    });
    expect(detail?.demo).toBeUndefined();
  });

  it('공개 지표 두 개의 값과 근거 등급·시점·한계를 exact 계약으로 제공한다', () => {
    const highlights = detail()?.highlights ?? [];

    expect(highlights).toEqual([
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
    ]);
  });

  it('컴플레인과 현재 진행 중인 운영 관찰만 지표로 제공한다', () => {
    const highlights = detail()?.highlights ?? [];
    const complaint = highlights.find(({ id }) => id === 'reported-complaint-mismatches');
    const observation = highlights.find(({ id }) => id === 'operating-observation-period');

    expect(complaint).toMatchObject({ kind: 'reported', value: '10건 미만', asOf: '2026-08' });
    expect(`${complaint?.evidence ?? ''} ${complaint?.caveat ?? ''}`).toContain('고객 컴플레인');
    expect(`${complaint?.evidence ?? ''} ${complaint?.caveat ?? ''}`).toContain('시스템 전수 집계가 아니');
    expect(`${complaint?.evidence ?? ''} ${complaint?.caveat ?? ''}`).toContain('하한');
    expect(observation).toMatchObject({
      kind: 'reported',
      value: '2024년 오픈 ~ 현재 진행 중',
      asOf: '현재 진행 중'
    });
    expect(highlights.map(({ id }) => id)).not.toContain('pms-average-response');
    expect(highlights.map(({ id }) => id)).not.toContain('pms-outage-duration');
  });

  it('확인할 수 없는 결제 총량·누적·비율을 만들지 않는다', () => {
    const publicText = `${feature()?.description ?? ''}\n${feature()?.overview ?? ''}\n${JSON.stringify(detail())}\n${linkedInsight()?.excerpt ?? ''}\n${linkedInsight()?.content ?? ''}`;

    expect(publicText).not.toMatch(/총 결제 건수|누적 결제 건수|성공률|불일치율|\d+(?:\.\d+)?%/);
    expect(publicText).not.toMatch(/평일\s*10건|주말\s*30건/);
  });

  it('모든 설계를 혼자 맡은 1인 백엔드 주도와 신규 구축 사실을 유지한다', () => {
    const role = detail()?.role ?? '';
    const publicText = `${feature()?.description ?? ''}\n${feature()?.overview ?? ''}\n${JSON.stringify(detail())}\n${linkedInsight()?.excerpt ?? ''}\n${linkedInsight()?.content ?? ''}`;

    expect(role).toBe(
      '모든 설계를 혼자 맡았고, 1인 백엔드 겸 프론트엔드 개발자로서 기존 그누보드 자산 위의 PHP·React 공존 구조와 인증, 결제·예약 연동, 보상취소, API Key 프록시를 설계·구현하며 프로젝트 전반을 주도했습니다.'
    );
    expect(feature()?.description).toBe(
      '기존 그누보드 자산 위에 PHP와 React를 결합해 신규 리조트 서비스를 구축하고, 결제·예약 불일치와 API Key 노출 문제를 원인별로 보강한 프로젝트입니다.'
    );
    expect(publicText).not.toMatch(/무중단|운영 중 서비스|중단하지 않고|단계적 전환|점진적 전환/);
  });

  it('10건 미만을 고객 컴플레인 접수와 실제 불일치 하한으로 한정한다', () => {
    const complaint = detail()?.highlights.find(({ id }) => id === 'reported-complaint-mismatches');
    const text = `${complaint?.label ?? ''} ${complaint?.value ?? ''} ${complaint?.evidence ?? ''} ${complaint?.caveat ?? ''}`;

    expect(text).toContain('10건 미만');
    expect(text).toContain('고객 컴플레인');
    expect(text).toContain('하한');
    expect(detail()?.outcomes).toContain(
      '고객 컴플레인으로 접수된 결제·예약 불일치는 2026-08 기준 10건 미만이었습니다. 이는 시스템 전수 집계가 아니라 실제 불일치의 하한입니다.'
    );
  });

  it('timeout 장애를 당시 API 문제와 현재 수정 상태를 구분해 설명한다', () => {
    const implementation = detail()?.implementation ?? '';

    expect(implementation).toContain(
      '외부 근거 없이 12초로 임의 설정한 뒤 정상 처리 중인 요청을 실패로 오판했습니다. 당시 약 20초까지 걸린 응답은 PMS의 정상 평균 속도가 아니라 해당 API에 문제가 있어 지연된 상태였습니다. 사용자 경험상 30초도 검토했지만 결제 안전성을 우선해 장애 대응값을 60초로 늘렸고, 이후 해당 API가 수정되어 현재는 과거처럼 오래 걸리지 않습니다.'
    );
    expect(implementation).toContain(
      '이 경험을 통해 timeout은 임의의 숫자가 아니라 정상 응답 범위, 장애 상태, 실패 비용을 구분해 정해야 한다는 점을 배웠습니다.'
    );
  });

  it('실제로 검토한 PHP 보상 방식과 React 환경변수 오해 발견만 남긴다', () => {
    const alternatives = detail()?.alternatives ?? '';
    const implementation = detail()?.implementation ?? '';

    expect(alternatives).not.toMatch(/2PC|이벤트 소싱/);
    expect(alternatives).not.toContain('환경변수 난독화');
    expect(alternatives).toContain(
      'Node.js에서는 ORM 트랜잭션으로 결제 상태 변경을 묶어 왔지만, 기존 PHP 결제 흐름에 같은 방식을 그대로 적용하기 어려웠습니다.'
    );
    expect(alternatives).toContain(
      '외부 결제와 PMS까지 하나의 트랜잭션으로 묶는 대신 중간 단계가 실패하면 역방향으로 되돌리는 보상 방식을 택했습니다.'
    );
    expect(implementation).toContain(
      '프로젝트 중간에 React 환경변수가 빌드 산출물에 포함되고 브라우저에서 확인될 수 있다는 사실을 발견했습니다.'
    );
  });

  it('WebView 원인의 전달 범위와 연결 인사이트의 신규 구축 전제를 맞춘다', () => {
    const detailText = `${detail()?.constraints ?? ''}\n${detail()?.implementation ?? ''}`;
    const insightText = `${linkedInsight()?.excerpt ?? ''}\n${linkedInsight()?.content ?? ''}`;

    expect(detailText).toContain(
      'WebView에서 자동로그인 토큰이 유실되는 원인은 앱 개발자에게 전달받은 내용이라 직접 규명한 사실처럼 단정할 수 없습니다.'
    );
    expect(detail()?.constraints).not.toContain('고객 거래 데이터, 시크릿, 비공개 소스도 공개하지 않습니다.');
    expect(detailText).toContain(
      '원인을 직접 규명했다고 쓰는 대신, 앱 개발자와 브릿지 인터페이스를 맞추고 토큰을 네이티브 앱에 전달한 구현 사실을 남겼습니다.'
    );
    expect(linkedInsight()?.excerpt).toBe(
      '개발계 테스트 중 React 빌드 산출물에 API Key가 포함될 수 있음을 확인하고 모든 요청을 PHP Proxy 뒤로 옮겼습니다. 당시의 단순 Proxy 구현과 지금 생각하는 BFF의 적용 기준을 구분해 정리합니다.'
    );
    expect(insightText).toContain(
      '발견 직후 API Key가 브라우저에 머물지 않도록 모든 요청을 PHP Proxy로 보내도록 변경했습니다.'
    );
    expect(insightText).not.toMatch(/핫픽스|무중단|운영 중 서비스|중단하지 않고|단계적 전환|점진적 전환/);
  });

  it('직접 확인되지 않은 결제 fallback 식별자를 공개 서술에서 제거한다', () => {
    const publicText = JSON.stringify(detail());

    expect(publicText).not.toMatch(/fallback|resvId|tid/);
  });
});

describe('골프 예약 작업물과 연결 인사이트 사실 계약', () => {
  const golf = () => getFeatureBySlug('the-siena-golf-reservation');
  const detail = () => getFeatureDetailBySlug('the-siena-golf-reservation');
  const insight = () =>
    getAllInsights().find(({ slug }) => slug === 'logging-decoupling-and-buffering-in-external-api-systems');

  it('구조화 상세가 첫 프로젝트의 구현 범위와 운영 유지보수 책임을 legacy 본문 없이 공개한다', () => {
    const text = [
      golf()?.description,
      golf()?.overview,
      detail()?.role,
      detail()?.implementation,
      detail()?.retrospective
    ].join('\n');

    expect(golf()?.period).toBe('2023.05 – 현재');
    expect(golf()?.content).toBeUndefined();
    expect(detail()).not.toBeNull();
    expect(text).toContain('첫 프로젝트');
    expect(text).toContain('정해진 구조');
    expect(text).toMatch(/예약 화면.*PHP.*외부 PMS|PHP.*외부 PMS.*예약 화면/);
    expect(text).toMatch(/FE\/BE[^.\n]*단독/);
    expect(text).toMatch(/중복 요청 방어|동일 세션.*2초/);
    expect(text).toContain('통신 로그');
    expect(text).toMatch(/syslog.*(?:결정|방향).*직접 구현|(?:결정|방향).*syslog.*직접 구현/);
    expect(text).toContain('운영 유지보수 과정');

    const syslogMigrationContext = getNearbySentences(text, /syslog|로그 저장 경로|시스템 로그/);
    const unapprovedYearMonths = [...syslogMigrationContext.matchAll(UNAPPROVED_SYSLOG_YEAR_MONTH)]
      .map(([yearMonth]) => yearMonth)
      .filter((yearMonth) => !APPROVED_SIENA_YEAR_MONTHS.has(yearMonth));

    expect(unapprovedYearMonths).toEqual([]);
  });

  it('예약 결과·관찰 범위·예약 기능 영향과 검증하지 않은 성과를 구분한다', () => {
    const text = [
      golf()?.description,
      golf()?.overview,
      detail()?.problem,
      detail()?.implementation,
      detail()?.outcomes,
      detail()?.retrospective
    ].join('\n');

    expect(text).toContain('동일 예약의 중복 호출 이력');
    expect(text).toContain('중복 예약 관련 CS');
    expect(text).toContain('2023년 오픈');
    expect(text).toContain('2026-09');
    expect(text).toContain('직접 관찰한 통신 로그');
    expect(text).toContain('지원 범위');
    expect(text).toContain('발견하지 못');
    expect(text).toContain('DB GUI가 다운');
    expect(text).toContain('예약 기능 자체에 미친 영향은 거의 없었습니다');
    expect(text).toContain('PMS 업체');
    expect(text).toContain('요청과 응답을 직접 확인');
    expect(text).not.toMatch(/중복률\s*0%|영구.*정합|처리 시간.*단축|장애(?:율| 발생률).*감소|사용자.*이탈|전환.*개선/);
    expect(text).not.toMatch(/20건|2초마다 flush|파일 I\/O 약 95%|인메모리 버퍼링|ELK|Loki|Datadog|Redis TTL/);
    expect(findUnqualifiedClaims(text, /전체 아키텍처|아키텍처/, /설계|주도/)).toEqual([]);
    expect(
      findUnqualifiedClaims(
        text,
        /Redis|작업 큐|메시지 큐|queue|별도 로그 DB/,
        /도입|구축|운영|사용|적용|선택|검토|설계/
      )
    ).toEqual([]);
    expect(
      findUnqualifiedClaims(
        text,
        /(?:전체|모든|전수)\s*예약(?:\s*(?:요청|건|결과))?|예약(?:\s*(?:요청|건|결과))?.*(?:전체|모든|전수)/,
        /관찰|확인|검증|집계|성공|완료|미발생/
      )
    ).toEqual([]);
    expect(text).not.toMatch(
      /(?:전체|모든|전수)\s*예약(?:\s*(?:요청|건|결과|건수))?[^.!?\n]{0,30}(?:\d[\d,]*|\d+\s*[만억])(?:\s*건)?/
    );

    const logIncidentContext = getNearbySentences(text, /로그 테이블|DB GUI|통신 로그/);
    expect(logIncidentContext).not.toMatch(
      /예약 기능[\s\S]{0,80}(?:중단|장애|멈춤|정지)|(?:중단|장애|멈춤|정지)[\s\S]{0,80}예약 기능/
    );
  });

  it('연결 인사이트의 제목·project-case·시각 자료와 reciprocal source link를 보존한다', () => {
    const insightContent = insight()?.content ?? '';

    expect(insight()?.title).toBe('로그는 남기는 것보다 조회할 수 있어야 한다: 외부 API 로그 분리기');
    expect(insight()?.featureSlug).toBe('the-siena-golf-reservation');
    expect(insight()?.editorial?.type).toBe('project-case');
    expect(insight()?.editorial?.visualAssessment).toMatchObject({
      decision: 'provided',
      kind: 'architecture'
    });
    expect(insight()?.excerpt).toContain('수백만 건');
    expect(insight()?.excerpt).toContain('syslog');
    expect(insight()?.excerpt).toContain('요청과 응답');
    expect(insightContent).toContain('로그를 남기는 것과 장애 시점에 로그를 조회할 수 있는 것은 다른 문제');
    expect(insightContent).toContain('인증값과 개인정보를 마스킹');
    expect(insightContent).toContain('로그 보존 기간');
  });
});

describe('한마음 구조화 상세 계약', () => {
  const detail = () => getFeatureDetailBySlug('hanmaum-science-institute');

  it('하네스와 동일한 공통 섹션 계약을 만족한다', () => {
    const harness = getFeatureDetailBySlug('codi-harness-dx-platform');
    const target = detail();

    expect(target).not.toBeNull();
    for (const key of Object.keys(harness ?? {})) {
      if (key === 'demo' || key === 'swimlanes') continue;
      expect(target, key).toHaveProperty(key);
    }
    expect(getFeatureBySlug('hanmaum-science-institute')?.content).toBeUndefined();
  });

  it('지표는 정확히 세 개이며 복원되지 않은 값을 추가하지 않는다', () => {
    const highlights = detail()?.highlights ?? [];

    // 인터뷰로 복원된 값만 공개한다. 단락 레코드 수처럼 복원되지 않은 값은 추가하지 않는다.
    expect(highlights.map(({ id }) => id)).toEqual(['search-response-time', 'source-volume', 'ingestion-duration']);
    for (const metric of highlights) {
      expect(metric.kind, metric.id).toBeTruthy();
      expect(metric.asOf, metric.id).toBeTruthy();
      expect(metric.evidence.trim().length, metric.id).toBeGreaterThan(10);
    }
  });

  it('검색 응답 지표는 측정값이며 측정 대상과 비교 조건을 밝힌다', () => {
    const metric = detail()?.highlights.find(({ id }) => id === 'search-response-time');

    expect(metric?.kind).toBe('measured');
    expect(metric?.value).toContain('1500ms');
    expect(metric?.value).toContain('400ms');
    expect(metric?.evidence).toContain('네트워크');
    expect(metric?.evidence).toContain('같은 검색어');
    expect(metric?.evidence).toContain('전량 적재');
    expect(metric?.evidence).toContain('여러 차례');
  });

  it('적재 소요는 측정값으로 주장하지 않고 계측 기록 부재를 밝힌다', () => {
    const metric = detail()?.highlights.find(({ id }) => id === 'ingestion-duration');

    expect(metric?.kind).not.toBe('measured');
    expect(metric?.caveat).toContain('계측');
  });
});

describe('한마음 사실 정정 계약', () => {
  const body = () => {
    const d = getFeatureDetailBySlug('hanmaum-science-institute');
    return [d?.problem, d?.constraints, d?.alternatives, d?.implementation, d?.outcomes, d?.retrospective].join('\n');
  };

  it('최소 토큰 길이를 버전이 강제했다고 주장하지 않는다', () => {
    const text = body();

    expect(text).not.toContain('2로 강제');
    expect(text).not.toContain('2로 제한');
    expect(text).toContain('1로 낮추려 시도했지만 적용되지 않았습니다');
    // 설정과 토큰화 방식의 차이를 구분하는 것이 이 정정의 핵심이다.
    expect(text).toContain('성공했더라도 결과는 같았을 것입니다');
    expect(text).toContain('자르는 방식 자체를 바꾸지 못하기 때문입니다');
  });

  it('파싱 실행을 서버 업로드 처리로 서술하고 로컬 스크립트 채택으로 적지 않는다', () => {
    const text = body();

    expect(text).toContain('파일을 올리면 서버가 처리하도록');
    expect(text).not.toContain('로컬 스크립트');
  });

  it('외부 검색 엔진은 검토 후 기각이 아니라 비용으로 시도하지 못한 것으로 적는다', () => {
    const text = body();

    expect(text).toContain('비용이 발생해 시도하지 못했습니다');
    expect(text).toContain('처음부터 선택지에 들어오지 않았습니다');
    // 하지 않은 검토를 했다고 주장하는 표현을 모두 차단한다.
    expect(text).not.toContain('기각');
    expect(text).not.toContain('검토했');
    expect(text).not.toContain('검토 후');
    expect(text).not.toContain('고려했');
  });

  it('예외 롤백과 검증 롤백을 서로 다른 장치로 구분한다', () => {
    const implementation = getFeatureDetailBySlug('hanmaum-science-institute')?.implementation ?? '';

    expect(implementation).toContain('예외 롤백');
    expect(implementation).toContain('검증 롤백');
    expect(implementation).toContain('두 롤백은 역할이 다릅니다');
    // 도입 경위와 대응 방식이 함께 남아야 실패에서 배운 서사가 성립한다.
    expect(implementation).toContain('원인 지점을 알기 위해 검증을 추가했습니다');
    expect(implementation).toContain('원본 교재를 고치지 않고 파싱 규칙만 보완했습니다');
  });
});

describe('상세와 연결 인사이트의 사실 일치', () => {
  const linkedInsight = () => getAllInsights().find(({ slug }) => slug === 'optimizing-770k-text-search-in-rdbms');

  it('연결 인사이트도 상세와 같은 사실 정정을 반영한다', () => {
    const content = linkedInsight()?.content ?? '';

    // 상세에서 정정한 3건을 인사이트가 반대로 주장하면 링크를 따라간 독자가
    // 정정 이전 서술을 만나게 된다.
    expect(content).not.toContain('2로 제한');
    expect(content).not.toContain('고려했습니다');
    expect(content).not.toContain('로컬 스크립트');
  });

  it('연결 인사이트는 최소 인덱싱 길이와 토큰화 방식을 구분한다', () => {
    const content = linkedInsight()?.content ?? '';

    expect(content).toContain('최소 길이는 이미 잘라낸 토큰 중 무엇을 인덱싱할지를 정하고');
    expect(content).toContain('토큰화 방식은 문장을 어떻게 자를지를 정하는 별개의 문제');
    expect(content).toContain('비용과 인프라 복잡성');
  });

  it('FULLTEXT 동작 원리와 현재 토큰별 보완 조건을 확인된 구현으로 제한한다', () => {
    const content = linkedInsight()?.content ?? '';

    expect(content).toContain('역인덱스');
    expect(content).toContain('공백과 구두점을 기준으로 토큰을 만들기 때문에');
    expect(content).toContain('두 글자 이상인 토큰은 `+token*`');
    expect(content).toContain('모든 토큰은 `%token%` LIKE 조건');
    expect(content).toContain('한 글자 토큰으로만 구성되면 LIKE-only');
    expect(content).not.toContain('+홍길동*');
    expect(content).not.toContain('+안*');
    expect(content).not.toMatch(/두 번째 쿼리를 실행하는 방식입니다/);
  });
});

describe('feature 007 연결 콘텐츠 사실 계약 RED', () => {
  const insightBySlug = (slug: string) => getAllInsights().find((insight) => insight.slug === slug);

  it('하네스 대표 글은 canonical 용어와 2026-08-20 기준 운영 수치를 함께 기록한다', () => {
    const insight = insightBySlug('codi-harness-dx-platform-design');
    const text = `${insight?.excerpt ?? ''}\n${insight?.content ?? ''}`;

    expect(text).toContain('별도 심화 인사이트');
    expect(text).not.toContain('독립 인사이트');
    expect(text).toMatch(/2026-08-20 기준[^.\n]*11개[^.\n]*8개[^.\n]*3명/);
  });

  it('Jenkins 글은 도구 교체와 배포 단위 재설계를 구분하고 관찰 한계를 공개한다', () => {
    const insight = insightBySlug('jenkins-retirement-and-github-actions-migration');
    const text = `${insight?.excerpt ?? ''}\n${insight?.content ?? ''}`;
    const headings = [...(insight?.content ?? '').matchAll(/^## (.+)$/gm)].map(([, heading]) => heading);
    const visual = insight?.editorial?.visualAssessment;

    expect(insight?.featureSlug).toBe('codi-harness-dx-platform');
    expect(insight?.title).toBe('GitHub Actions 전환보다 중요했던 배포 단위 재설계');
    expect(insight?.date).toBe('2026-07-07T00:00:00.000Z');
    expect(insight?.excerpt).toBe(APPROVED_JENKINS_SECTIONS.excerpt);
    expect(insight?.content).toBe(APPROVED_JENKINS_SECTIONS.content);
    expect(headings).toEqual([
      '기존 Jenkins는 제가 설계한 영역이 아니었다',
      '구조가 복잡한 프로젝트를 거의 마지막에 이전했다',
      '도구가 아니라 배포 단위를 바꿨다',
      '병렬 실행과 취소 경계를 함께 나눴다',
      '다섯 호텔 배포 화면에서 약 15분이 약 3분이 됐다',
      '병렬화 전에 배포 단위를 분리할 수 있어야 한다'
    ]);

    expect(text).toContain('기존 Jenkins 구성은 제가 설계하거나 설정한 영역이 아니었습니다.');
    expect(text).toContain('새로운 workflow 설계부터 담당했습니다.');
    expect(text).toContain('Jenkins slave나 executor를 늘리는 방안은 별도로 검토하지 않았습니다.');
    expect(text).toContain('`codi-rs-module`을 거의 마지막에 이전했습니다.');
    expect(text).toContain('공통 코드가 변경되면 다섯 호텔 전체');
    expect(text).toContain('특정 호텔의 코드만 변경되면 해당 호텔만');
    expect(text).toContain('`fail-fast: false`');
    expect(text).toMatch(/특정 호텔 job이 실패하더라도[^.\n]*다른 호텔 job[^.\n]*즉시 취소하지 않도록/);
    expect(text).toMatch(/의도적으로 실패시키지는 않았[^.\n]*다른 호텔의 완료 여부[^.\n]*대조한 기록도 없습니다/);
    expect(text).toMatch(/실패 격리는 설정과 실행 구조의 의도로만 설명[^.\n]*검증된 장애 격리 성과로 확대하지 않/);
    expect(text).toContain('실행 화면을 비교한 관찰값');
    expect(text).toMatch(/약 15분[^.\n]*약 3분/);
    expect(text).toMatch(/동일한 조건에서 여러 번 실행해 계산한 평균이나 통제된 성능 실험은 아닙니다\./);
    expect(text).toMatch(/여러 배포 대상이 서로 독립적이고[^.\n]*영향을 주는지 계산할 수 있을 때 적합/);
    expect(text).toContain('대상 사이에 순서가 필요');
    expect(text).toContain('영향을 주는지 정확히 구분할 수 없다면');
    expect(text).toContain('월 `$151.84`는 과거 실제 청구액이 아니라');
    expect(text).toMatch(
      /2026-08-20[^.\n]*AWS 서울 리전[^.\n]*`t3\.large` 2대[^.\n]*월 730시간[^.\n]*공개 가격[^.\n]*컴퓨팅 추정치/
    );
    expect(text).toContain('스토리지·네트워크·세금은 포함하지 않습니다.');
    expect(text).toMatch(
      /GitHub Actions 무료 티어를 초과하지 않았지만[^.\n]*앞으로도 비용이 발생하지 않는다는 의미는 아닙니다/
    );

    const falseClaimGuards = [
      {
        label: '기존 Jenkins 소유권',
        pattern:
          /기존 Jenkins (?:구성|설정)[^.\n]*(?:직접\s*)?(?:설계|설정|구성|구축|담당|관리)[^.\n]*(?:했습니다|했다|되었습니다|되었다|맡았습니다|맡았다|주도했습니다|주도했다)/,
        prohibited: ['기존 Jenkins 구성은 제가 직접 구축했습니다.', '기존 Jenkins 설정은 제가 직접 담당했습니다.'],
        allowed: [
          '기존 Jenkins 구성은 제가 설계하거나 설정한 영역이 아니었습니다.',
          '기존 Jenkins 설정을 직접 담당하지 않았습니다.'
        ]
      },
      {
        label: 'Jenkins 확장 대안',
        pattern:
          /Jenkins (?:slave|executor)[^.\n]*(?:늘리|확장|스케일|증설)[^.\n]*(?:비교(?:했|하여)|검토(?:했|하여)|고려(?:했|하여)|평가(?:했|하여)|선택(?:했|하여)|도입(?:했|하여)|기각(?:했|하여)|채택(?:했|하여))/i,
        prohibited: [
          'Jenkins executor 증설을 대안으로 고려했습니다.',
          'Jenkins executor 증설을 대안으로 평가했습니다.'
        ],
        allowed: ['Jenkins slave나 executor를 늘리는 방안은 별도로 검토하지 않았습니다.']
      },
      {
        label: '실패 격리 검증',
        pattern:
          /(?:실패 격리|다른 호텔(?:의 (?:배포 )?완료 여부| job))[^.\n]*(?:검증|확인|관찰|대조|입증)[^.\n]*(?:했습니다|했다|되었습니다|되었다|됐습니다|됐다|확인됨)/,
        prohibited: ['실패 격리가 검증되었습니다.', '다른 호텔 job이 끝나는 것을 확인했습니다.'],
        allowed: [
          '실패 격리는 설정과 실행 구조의 의도로만 설명하며, 검증된 장애 격리 성과로 확대하지 않습니다.',
          '운영 중 실제 실패 사례로 다른 호텔의 완료 여부를 대조한 기록도 없습니다.'
        ]
      },
      {
        label: '실제 비용·절감',
        pattern:
          /(?:과거 실제 청구액(?:은|이)?\s*`?\$151\.84`?\s*(?:였습니다|였다|입니다|이다|으로 확인)|(?:월\s*)?`?\$151\.84`?(?!\s*(?:는|은|이|가)?\s*(?:과거 실제 청구액|실제 절감액)[^.\n]*(?:아니|않|없))[^.\n]*(?:비용\s*(?:절감|감소)|절감 효과|절감(?:했|하여)|줄였|아꼈))/i,
        prohibited: [
          '실제로 월 $151.84를 줄였습니다.',
          '월 $151.84의 비용 절감 효과가 있었습니다.',
          '과거 실제 청구액은 $151.84였습니다.',
          '월 $151.84를 절감했고 스토리지는 포함하지 않았습니다.'
        ],
        allowed: [
          '포트폴리오에서 사용하는 월 `$151.84`는 과거 실제 청구액이 아니라 공개 가격으로 다시 계산한 컴퓨팅 추정치입니다.'
        ]
      },
      {
        label: '무료 보장',
        pattern:
          /(?:GitHub Actions[^.\n]*)?(?:완전 무료|영구 무료|비용이? 0|공짜|무료로 (?:계속|유지)|비용[^.\n]*(?:없|0)[^.\n]*(?:보장|확정|지속))(?!\s*(?:가|은|는|이)?\s*(?:아니|아닙|않|없))/i,
        prohibited: ['GitHub Actions는 완전 무료입니다.', 'GitHub Actions 비용 0을 보장합니다.'],
        allowed: ['GitHub Actions는 완전 무료가 아닙니다.', '앞으로도 비용이 발생하지 않는다는 의미는 아닙니다.']
      }
    ] as const;
    const unsupportedPerformanceClaim =
      /(?:(?:\d+(?:\.\d+)?%\s*(?:개선|향상|감소|단축|절감))|성공률\s*100%)(?!`?\s*같은 비율로 일반화하지 않습니다)/;
    const performanceCases = {
      prohibited: [
        '80% 개선을 달성했습니다.',
        '79% 개선을 기록했습니다.',
        '배포 시간 80% 단축 효과가 있었습니다.',
        '성공률 100%를 달성했습니다.'
      ],
      allowed: ['`80% 개선` 같은 비율로 일반화하지 않습니다.']
    } as const;

    for (const { label, pattern, prohibited, allowed } of falseClaimGuards) {
      for (const claim of prohibited) {
        expect(claim, `${label}: prohibited`).toMatch(pattern);
      }
      for (const boundary of allowed) {
        expect(boundary, `${label}: allowed`).not.toMatch(pattern);
      }
      expect(text, label).not.toMatch(pattern);
      expect(APPROVED_JENKINS_COPY, label).not.toMatch(pattern);
    }
    for (const claim of performanceCases.prohibited) {
      expect(claim, '성능 성과: prohibited').toMatch(unsupportedPerformanceClaim);
    }
    for (const boundary of performanceCases.allowed) {
      expect(boundary, '성능 성과: allowed').not.toMatch(unsupportedPerformanceClaim);
    }
    expect(text, '성능 성과').not.toMatch(unsupportedPerformanceClaim);
    expect(APPROVED_JENKINS_COPY, '성능 성과').not.toMatch(unsupportedPerformanceClaim);

    expect(visual?.decision).toBe('provided');
    if (visual?.decision !== 'provided') return;
    expect(visual.kind).toBe('data-flow');
    expect(visual.question).toMatch(/순차 대기열[^?\n]*대상별 matrix|대상별 matrix[^?\n]*순차 대기열/i);
    expect(visual.textAlternative).toMatch(/Jenkins[^.\n]*순차[\s\S]*변경 범위[\s\S]*matrix[^.\n]*병렬/i);
    expect(visual.nonDuplicationReason).toMatch(/작업물[^.\n]*전체 CI\/CD[^.\n]*인사이트[^.\n]*배포 단위/i);
  });

  it('하네스 작업물과 Jenkins 심화 글은 fail-fast를 미검증 취소 경계 의도로만 맞춘다', () => {
    const detail = getFeatureDetailBySlug('codi-harness-dx-platform');
    const insight = insightBySlug('jenkins-retirement-and-github-actions-migration');
    const sourceText = detail?.implementation ?? '';
    const insightText = `${insight?.excerpt ?? ''}\n${insight?.content ?? ''}`;

    for (const [record, text] of [
      ['project', sourceText],
      ['insight', insightText]
    ] as const) {
      expect(text, `${record}: fail-fast`).toContain('`fail-fast: false`');
      expect(text, `${record}: cancellation intention`).toMatch(
        /다른 호텔 job[^.\n]*즉시 취소[^.\n]*(?:막|않도록)[^.\n]*(?:설계 의도|설계)/
      );
      expect(text, `${record}: deliberate failure limit`).toMatch(/의도적으로 실패시키(?:지 않았|지는 않았)/);
      expect(text, `${record}: operational comparison limit`).toMatch(
        /운영 중 실제 실패 사례[^.\n]*완료 여부[^.\n]*대조[^.\n]*기록도 없/
      );
      expect(text, `${record}: no validated isolation outcome`).toMatch(/검증된 (?:장애 )?격리 성과로 확대하지 않/);
    }

    expect(sourceText).not.toMatch(/다섯 중 셋이 성공하면[^.\n]*서버 인스턴스까지 배포가 끝난 상태/);
  });

  it('공부 기록의 Jenkins 인접 읽기 링크는 승인된 제목과 slug를 함께 유지한다', () => {
    const study = getAllStudies().find(({ slug }) => slug === 'ai-dx-harness-starter-kit');

    expect(study?.content).toContain(
      '[GitHub Actions 전환보다 중요했던 배포 단위 재설계](/insights/jenkins-retirement-and-github-actions-migration)'
    );
    expect(study?.content).not.toContain('Jenkins 제거와 GitHub Actions CI/CD 마이그레이션');
  });

  it('하네스 대표 글은 현재 운영 스윔레인과 중복되지 않는 발전 타임라인을 제공한다', () => {
    const insight = insightBySlug('codi-harness-dx-platform-design');
    const text = `${insight?.excerpt ?? ''}\n${insight?.content ?? ''}`;
    const visual = insight?.editorial?.visualAssessment;

    expect(text).toMatch(/Jenkins 제거와 배포 자동화[^#]*v1 공통 파일 복사·동기화[^#]*멀티 세션 실행 격리 실험/);
    expect(visual?.decision).toBe('provided');
    if (visual?.decision !== 'provided') return;
    expect(visual.kind).toBe('timeline');
    expect(visual.question).toMatch(/하네스.*어떻게 발전/);
    expect(visual.textAlternative).toMatch(
      /Jenkins[^.]*v1[^.]*CLI[^.]*패리티[^.]*Spec Kit[^.]*harness\.lock[^.]*감사[^.]*멀티 세션/
    );
    expect(visual.nonDuplicationReason).toMatch(/작업물[^.]*현재[^.]*스윔레인[^.]*인사이트[^.]*발전/);
  });

  it('Infisical 글은 환경변수 혼입 장애와 검증한 배포 경계, 남은 복구 한계를 구분한다', () => {
    const insight = insightBySlug('infisical-centralized-secrets-and-spof-defense');
    const study = getAllStudies().find(({ slug }) => slug === 'ai-dx-harness-starter-kit');
    const text = `${insight?.excerpt ?? ''}\n${insight?.content ?? ''}`;
    const visual = insight?.editorial?.visualAssessment;

    expect(insight?.title).toBe('환경변수 중앙화는 저장보다 경계 설계다: Infisical Self-Hosted 도입기');
    expect(insight?.featureSlug).toBe('codi-harness-dx-platform');
    expect(study?.content).toContain(
      '[환경변수 중앙화는 저장보다 경계 설계다: Infisical Self-Hosted 도입기](/insights/infisical-centralized-secrets-and-spof-defense)'
    );
    expect(study?.content).not.toContain('Infisical 도입기: 환경변수 중앙화와 단일 장애점');
    expect(text).toContain('Jenkins UI·로컬 `.env`·Slack');
    expect(text).toMatch(/다른 호텔[^.\n]*환경변수[^.\n]*운영 배포/);
    expect(text).toMatch(/예약·조회 요청[^.\n]*실패/);
    expect(text).toMatch(/화면과 기능 설정[^.\n]*다른 호텔/);
    expect(text).toMatch(/약 10분[^.\n]*운영 서비스 장애/);
    expect(text).toMatch(/정확한 원인[^.\n]*규명하지 못/);
    expect(text).toMatch(/Jenkins 자체 오류[^.\n]*단정할 근거[^.\n]*없/);
    expect(text).toContain('/frontend/github-actions');
    expect(text).toContain('/backend/github-actions');
    expect(text).toContain('Shared-Secrets');
    expect(text).toMatch(/Infisical Cloud[^.\n]*정식 비교[^.\n]*아니/);
    expect(text).toMatch(/GitHub Actions[^#]*배포 단계[^#]*Infisical[^#]*\.env 파일/);
    expect(text).toMatch(/연결할 수 없는 경우[^.\n]*로컬 `.env`[^.\n]*대체/);
    expect(text).toMatch(/별도의 테스트 프로젝트와 서버[^#]*의도적으로 중단/);
    expect(text).toMatch(/GitHub Actions[^.\n]*시크릿 조회 단계[^.\n]*실패/);
    expect(text).toMatch(/기존에 실행 중이던 테스트 서비스[^.\n]*정상적으로 동작/);
    expect(text).toMatch(/2026년 8월 현재까지[^.\n]*동일 유형 문제[^.\n]*다시 발견하지 못/);
    expect(text).toMatch(/시스템 전수 집계나 장애율 통계[^.\n]*아닙니다/);
    expect(text).toMatch(/백업 파일[^.\n]*같은 인스턴스 서버/);
    expect(text).toMatch(/데이터베이스와 백업 파일[^.\n]*함께 삭제[^.\n]*복구할 방법[^.\n]*없/);
    expect(text).toMatch(/Self-Hosted 선택은 유지/);
    expect(text).toMatch(/아직 구현하지 않은 고도화나 DX 개선[^.\n]*완료된 기능처럼 공개하지/);

    expect(visual?.decision).toBe('provided');
    if (visual?.decision !== 'provided') return;
    expect(visual.kind).toBe('architecture');
    expect(visual.question).toMatch(/환경변수.*소유권.*배포.*복구 경계/);
    expect(visual.textAlternative).toMatch(/도입 전[^.]*도입 후[^.]*배포 실패[^.]*백업/);
    expect(visual.nonDuplicationReason).toMatch(/작업물[^.]*CI\/CD[^.]*스윔레인[^.]*인사이트[^.]*경계/);

    expect(text).not.toContain('실제 Infisical 장애를 겪고 복구 결과를 측정한 기록이 아니라');
    expect(text).not.toMatch(/Build-Time Injection/i);
    expect(text).not.toMatch(
      /(?:빌드 시점|빌드할 때)(?![^.\n]*(?:아니라|아닌|않))[^.\n]*(?:환경변수|시크릿)[^.\n]*(?:주입|조회|가져)/
    );
    expect(text).not.toMatch(/끊임없이|컴플라이언스|극적으로 쾌적|아무런 타격|장애 가능성 0|완전한 고가용성/);
  });

  it('Cloudflare 글은 초기 실패에서 Bastion 권한 경계로 발전한 관찰 범위를 구분한다', () => {
    const insight = insightBySlug('cloudflare-tunnel-zero-trust-cicd-and-troubleshooting');
    const study = getAllStudies().find(({ slug }) => slug === 'ai-dx-harness-starter-kit');
    const text = `${insight?.excerpt ?? ''}\n${insight?.content ?? ''}`;
    const normalizedText = text.replace(/\s+/g, ' ');
    const visual = insight?.editorial?.visualAssessment;
    const forbiddenClaimGuards = [
      {
        pattern: /잘못된 서버[^.\n]*배포(?:했습니다|했다|됐습니다|됐다|되었다|되었습니다|완료했습니다|완료했다|됨)/,
        example: '잘못된 서버에 서비스를 배포했습니다.'
      },
      {
        pattern:
          /Cloudflare[^.\n]*(?:[A-Za-z][A-Za-z-]+|알고리즘|라우팅)\s*방식(?:으로|이)[^.\n]*(?:connector[^.\n]*)?(?:선택|라우팅|분산)[^.\n]*(?:합니다|한다|됩니다|된다|할 수 있습니다|할 수 있다|으로 처리)/i,
        example: 'Cloudflare가 least-connections 방식으로 connector를 선택합니다.'
      },
      {
        pattern:
          /(?:보안|가용성|안전성|안전)[^.\n]*보장(?:합니다|한다|됩니다|된다|할 수 있습니다|할 수 있다|할 수 있음)/i,
        example: '이 구조는 배포 보안을 보장합니다.'
      }
    ] as const;

    expect(insight?.title).toBe('Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다');
    expect(insight?.featureSlug).toBe('codi-harness-dx-platform');
    expect(study?.content).toContain(
      '[Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다](/insights/cloudflare-tunnel-zero-trust-cicd-and-troubleshooting)'
    );

    expect(text).toMatch(/직접[^.\n]*(?:설계하고 구현|구현하고 설계)|(?:설계하고 구현|구현하고 설계)[^.\n]*직접/);
    expect(normalizedText).toMatch(/direct SSH|직접 SSH/i);
    expect(normalizedText).toMatch(
      /(?:direct|직접) SSH[^.\n]*(?:Cloudflare Tunnel)|(?:Cloudflare Tunnel)[^.\n]*(?:direct|직접) SSH/i
    );
    expect(normalizedText).toMatch(/(?:22번 포트|인바운드)[^.\n]*(?:열|허용)|(?:열|허용)[^.\n]*(?:22번 포트|인바운드)/);
    expect(normalizedText).toMatch(
      /GitHub Actions[^.\n]*(?:runner|IP)[^.\n]*(?:허용 범위|대역|방화벽)[^.\n]*(?:확인|관리|반영)/i
    );
    expect(normalizedText).toMatch(/Self-hosted GitHub\s*Actions runner[^.\n]*(?:검토한 것은 아니|검토하지 않)/i);

    expect(normalizedText).toMatch(/2026년 4월[^.\n]*(?:초기 구성|초기)/);
    expect(normalizedText).toContain('이벤트 로그');
    expect(normalizedText).toMatch(/WAF에서 차단된 기록/);
    expect(normalizedText).toMatch(/(?:hostname|호스트명)[^.\n]*예외[^.\n]*적용/i);
    expect(normalizedText).toMatch(/같은 workflow[^.\n]*(?:다시 실행|재실행)/i);
    expect(normalizedText).toMatch(
      /(?:이전에 막히던|막히던)[^.\n]*(?:Cloudflare 접근 단계|접근 단계)[^.\n]*(?:통과|성공)/i
    );
    expect(normalizedText).toMatch(/WAF 규칙 자체[^.\n]*Service Token[^.\n]*(?:아닙|않)/i);

    expect(normalizedText).toMatch(/같은 hostname[^.\n]*(?:서로 다른 서버|다른 서버)[^.\n]*connector/);
    expect(normalizedText).toMatch(/의도하지 않은 connector[^.\n]*(?:서버 방향|방향)/);
    expect(normalizedText).toMatch(/SSH 연결 단계에서 실패했습니다/);
    expect(normalizedText).toMatch(/(?:파일 전송|배포 명령)[^.\n]*(?:전|이전)/);
    expect(normalizedText).toMatch(/잘못된 서버[^.\n]*(?:서비스가 )?배포되지는 않았습니다/);
    expect(normalizedText).toMatch(/Cloudflare[^.\n]*(?:알고리즘|라우팅 방식)[^.\n]*(?:확인하지 못|단정하지 않)/i);
    expect(normalizedText).toMatch(/대상별[^.\n]*(?:hostname|호스트명)[^.\n]*(?:분리|구분)/i);
    expect(normalizedText).toMatch(
      /같은 workflow[^.\n]*(?:다시 실행|재실행)[^.\n]*(?:의도한 서버|배포)[^.\n]*(?:정상 완료|완료|연결)/i
    );

    expect(normalizedText).toMatch(/2026년 5월[^.\n]*(?:공용|재사용)[^.\n]*(?:Bastion|진입점)/i);
    expect(normalizedText).toContain('ProxyCommand');
    expect(normalizedText).toContain('ProxyJump');
    expect(normalizedText).toMatch(/Service Token/);
    expect(normalizedText).toMatch(/배포 전용 사용자[^.\n]*(?:shell 실행 차단|nologin|로그인 shell 차단)/i);
    expect(normalizedText).toContain('PermitOpen');
    expect(normalizedText).toMatch(/프로젝트\s*[×x]\s*배포 서버별 SSH 키/);

    expect(normalizedText).toMatch(/2026-08-27 기준[^.\n]*9개 프로젝트[^.\n]*5대 서버/);
    expect(normalizedText).toMatch(/동일 유형 문제[^.\n]*(?:다시 발견하지 못|재발하지 않)/);
    expect(normalizedText).toMatch(/(?:사용자 보고값|사용자 보고)[^.\n]*(?:관찰 범위|운영 과정)/);
    expect(normalizedText).toMatch(/(?:시스템 전체|전체 시스템)[^.\n]*장애율[^.\n]*집계한 결과[^.\n]*(?:아닙|아니|않)/);
    expect(normalizedText).toMatch(
      /Cloudflare Tunnel[^.\n]*(?:보안·가용성|보안과 가용성)[^.\n]*보장(?:하는 수치(?:는|가)? ?(?:아닙|아니)|하지 않|할 수 없)/i
    );
    for (const { pattern, example } of forbiddenClaimGuards) {
      expect(normalizedText).not.toMatch(pattern);
      expect(example).toMatch(pattern);
    }

    expect(normalizedText).toMatch(/Bastion이 중단되면[^.\n]*(?:새 배포|신규 배포)[^.\n]*(?:함께 )?막힙니다/i);
    expect(normalizedText).toMatch(
      /실제 Bastion[^.\n]*(?:중단|장애)[^.\n]*(?:테스트해 확인한 결과는 아닙|확인한 결과는 아니)/i
    );
    expect(normalizedText).toMatch(
      /(?:자동화[^.\n]*(?:PermitOpen|공개키|public key)[^.\n]*Infisical[^.\n]*(?:경로|연결)|PermitOpen[^.\n]*(?:공개키|public key)[^.\n]*Infisical[^.\n]*(?:경로|연결)[^.\n]*자동화)/i
    );
    expect(normalizedText).toMatch(/현재[^.\n]*(?:개선하고 싶은|먼저 개선)[^.\n]*자동화/i);
    expect(normalizedText).toMatch(/아직 구현하지 않은 자동화[^.\n]*현재 성과로 기록하지(?:는 )?않/);
    expect(normalizedText).not.toMatch(
      /(?:PermitOpen|공개키|public key|Infisical)[^.\n]*자동화[^.\n]*(?:완료했습니다|구현했습니다|완성했습니다|구현을 마쳤습니다)/i
    );

    expect(normalizedText).not.toMatch(/L4|L7|라운드 로빈|round[- ]robin/i);
    expect(normalizedText).not.toMatch(/Bastion[^.\n]*(?:중단 테스트|장애)[^.\n]*(?:확인|관찰)했/i);
    expect(normalizedText).not.toMatch(/Self-hosted GitHub\s*Actions runner[^.\n]*(?:비교|검토)했/i);

    expect(visual?.decision).toBe('provided');
    if (visual?.decision !== 'provided') return;
    expect(visual.kind).toBe('data-flow');
    expect(visual.question).toMatch(
      /외부 진입 인증[^?\n]*(?:내부 배포 대상 권한|내부.*권한)|내부 배포 대상 권한[^?\n]*외부 진입 인증/
    );
    expect(visual.textAlternative).toMatch(/4월[\s\S]*5월[\s\S]*9개 프로젝트[\s\S]*5대 서버/);
    expect(visual.nonDuplicationReason).toMatch(/작업물[^.\n]*스윔레인[^.\n]*인사이트[^.\n]*실패[^.\n]*권한 경계/i);
    expect(visual.nonDuplicationReason).toMatch(/인사이트[^.\n]*(?:발전|진화|4월[^.\n]*5월|초기[^.\n]*현재)/i);
  });

  it('한마음 글은 DB 쿼리 평균이나 73%가 아니라 브라우저 네트워크 반복 관찰을 사용한다', () => {
    const insight = insightBySlug('optimizing-770k-text-search-in-rdbms');
    const text = `${insight?.excerpt ?? ''}\n${insight?.content ?? ''}`;

    expect(insight?.featureSlug).toBe('hanmaum-science-institute');
    expect(text).toContain('약 1500ms');
    expect(text).toContain('약 400ms');
    expect(text).toContain('브라우저 네트워크');
    expect(text).toContain('같은 검색어');
    expect(text).toContain('전량 적재');
    expect(text).toContain('여러 차례');
    expect(text).toContain('정확한 표본 수와 평균은 복원되지 않았으므로');
    expect(text).not.toMatch(/(?:평균|쿼리) 응답 시간(?:은|이)\s*약|73%/);
    expect(text).not.toMatch(/복원되지 않은.*단락|단락.*레코드 수/);
  });

  it('한마음 글은 2023년 LIKE 성능 관찰과 이후 FULLTEXT 발전 단계를 분리한다', () => {
    const insight = insightBySlug('optimizing-770k-text-search-in-rdbms');
    const text = `${insight?.excerpt ?? ''}\n${insight?.content ?? ''}`;
    const visual = insight?.editorial?.visualAssessment;

    expect(insight?.title).toBe('LIKE에서 FULLTEXT·토큰 검증까지: RDBMS 검색을 단계적으로 개선한 과정');
    expect(text).toMatch(/2023년[^#]*LIKE 기반[^#]*약 1500ms[^#]*약 400ms/);
    expect(text).toMatch(/2025년[^#]*FULLTEXT/);
    expect(text).toMatch(/2026년[^#]*FULLTEXT[^#]*LIKE/);
    expect(text).toContain('하나의 SQL');
    expect(text).toMatch(/Elasticsearch[^.\n]*아직 직접 사용[^.\n]*않/);
    expect(text).not.toMatch(/FULLTEXT[^.\n]*(?:약 1500ms|약 400ms)[^.\n]*(?:성과|줄었|감소)/);

    expect(visual?.decision).toBe('provided');
    if (visual?.decision !== 'provided') return;
    expect(visual.kind).toBe('timeline');
    expect(visual.question).toMatch(/2023년.*2026년.*어떻게 변했/);
    expect(visual.textAlternative).toMatch(/2023년[^.]*LIKE[^.]*2025년[^.]*FULLTEXT[^.]*2026년[^.]*LIKE/);
    expect(visual.nonDuplicationReason).toMatch(/작업물[^.]*검색 요청[^.]*인사이트[^.]*시간/);
  });

  it('블랙스톤 글은 신규 구축과 빌드 산출물 발견을 쓰고 결제 API 서사를 섞지 않는다', () => {
    const insight = insightBySlug('spa-api-key-exposure-and-bff-architecture');
    const text = `${insight?.excerpt ?? ''}\n${insight?.content ?? ''}`;

    expect(insight?.featureSlug).toBe('blackstone-belleforet-resort');
    expect(text).toMatch(/신규[^.\n]*구축/);
    expect(text).toContain('프로젝트 중간');
    expect(text).toContain('빌드 산출물');
    expect(text).not.toMatch(/20초|현재.*수정|Request Header|fallback|resvId|tid/);
    expect(text).not.toMatch(/무중단|운영 중 서비스|단계적 전환|점진적 전환/);
  });

  it('블랙스톤 글은 당시 PHP Proxy와 현재의 BFF 판단을 분리한다', () => {
    const insight = insightBySlug('spa-api-key-exposure-and-bff-architecture');
    const text = `${insight?.excerpt ?? ''}\n${insight?.content ?? ''}`;

    expect(insight?.title).toBe('React API Key 노출을 서버 경계로 옮기며 배운 BFF의 필요성');
    expect(text).toContain('개발계 테스트');
    expect(text).toContain('제3자가 키를 악용한 일은 없었습니다');
    expect(text).toContain('모든 요청을 PHP Proxy로 보내도록 변경');
    expect(text).toContain('JWT 쿠키 검증은 PHP 미들웨어');
    expect(text).toContain('원본 응답을 그대로 React에 전달');
    expect(text).toContain('당시 구현을 BFF였다고 소급해 부르지는 않습니다');
    expect(text).toMatch(/API Key·Secret·인증 헤더[^#]*반드시 서버/);
    expect(text).toMatch(/공개 정보[^#]*별도 인증 정보가 없다면[^#]*브라우저의 직접 호출/);
    expect(text).toMatch(/응답 조합·가공|권한 통제|여러 API 취합/);
    expect(text).toMatch(/public API[^.\n]*private API/);
    expect(text).not.toContain('블랙스톤 작업물 전체');
    expect(text).not.toMatch(/모든 외부 API[^.\n]*반드시 BFF|BFF를 구현했습니다|BFF로 전환했습니다/);
  });

  it('중앙 회원 인사이트는 UUID 관계와 운영 읽기 모델만 확대한다', () => {
    const insight = insightBySlug('sso-authentication-and-soft-fk');
    const text = `${insight?.excerpt ?? ''}\n${insight?.content ?? ''}`;
    const visual = insight?.editorial?.visualAssessment;

    expect(insight?.title).toBe('UUID Soft FK만으로는 부족했다: 분리된 회원 데이터의 조회 경계');
    expect(insight?.featureSlug).toBe('integrated-sso-server');
    expect(text).toContain('시스템 식별자와 운영 식별자는 달랐다');
    expect(text).toContain('user_tokens');
    expect(text).toContain('Batch API');
    expect(text).toContain('운영 읽기 모델');
    expect(text).not.toMatch(/Access Token\s*\(10분\)|Refresh Token\s*\(7일\)|JWT Payload[^.\n]*UUID/);
    expect(text).not.toMatch(/여러 (?:개의 )?사내 서비스[^.\n]*통합|SSO DB[^.\n]*Refresh Token/);

    expect(visual?.decision).toBe('provided');
    if (visual?.decision !== 'provided') return;
    expect(visual.kind).toBe('data-flow');
    expect(visual.question).toMatch(/UUID.*운영.*조회/);
    expect(visual.textAlternative).toMatch(/초기[^.]*UUID[^.]*이후[^.]*로그인 ID[^.]*Batch API/);
    expect(visual.nonDuplicationReason).toMatch(/작업물[^.]*인증 흐름[^.]*인사이트[^.]*조회/);
  });

  it('Vercel 글과 공부 기록은 같은 기준 시점, 공식 URL, 계산·제외 전제를 공유한다', () => {
    const insight = insightBySlug('vercel-team-plan-bypass-and-serverless-cost-analysis');
    const study = getAllStudies().find(({ slug }) => slug === 'ai-dx-harness-starter-kit');
    const insightText = `${insight?.excerpt ?? ''}\n${insight?.content ?? ''}`;
    const studyText = `${study?.overview ?? ''}\n${study?.content ?? ''}`;

    expect(insight?.studySlug).toBe('ai-dx-harness-starter-kit');
    for (const [label, text] of [
      ['insight', insightText],
      ['study', studyText]
    ] as const) {
      expect(text, label).toMatch(/Pro[^.\n]*(?:월\s*\$20|\$20(?:\/month| per month))/i);
      expect(text, label).toMatch(
        /(?:개발자|Developer) (?:seat|좌석) 1개[^.\n]*포함|1개의? (?:개발자|Developer) (?:seat|좌석)[^.\n]*포함/i
      );
      expect(text, label).toMatch(
        /추가 (?:개발자|Developer) (?:seat|좌석)[^.\n]*(?:월\s*\$20|\$20(?:\/month| per month))/i
      );
      expect(text, label).toMatch(/(?:viewer|뷰어)[^.\n]*(?:무료|free)/i);
      expect(text, label).toMatch(/월\s*\$20\s*(?:usage )?(?:credit|크레딧)|\$20 monthly usage credit/i);
      expect(text, label).toContain('2026-08');
      expect(text, label).toMatch(/https:\/\/vercel\.com\/(?:docs\/|pricing(?:\/|\b))/);
      expect(text, label).toMatch(/공개 가격/);
      expect(text, label).toMatch(/계산|산식/);
      expect(text, label).toMatch(/제외/);
      expect(text, label).toMatch(/실제 (?:청구|비용).*(?:아닙니다|뜻하지 않습니다)/);
    }
  });
});
