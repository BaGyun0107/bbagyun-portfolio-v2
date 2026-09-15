import { expect, test, type Page } from '@playwright/test';

const HARNESS_PATH = '/projects/codi-harness-dx-platform';
const BLACKSTONE_PATH = '/projects/blackstone-belleforet-resort';
const BLACKSTONE_INSIGHT_PATH = '/insights/spa-api-key-exposure-and-bff-architecture';
const HARNESS_SWIMLANES = [
  {
    title: '설계·개발·검증',
    url: '/diagrams/codi-harness-dx-platform/design-development-verification.html',
    normalEdges: 6,
    exceptionEdges: 3,
    nodes: 7,
    labels: ['승인', '통과', '요구 보강', '미승인', '실패']
  },
  {
    title: 'CI/CD·시크릿·배포',
    url: '/diagrams/codi-harness-dx-platform/cicd-secrets-deployment.html',
    normalEdges: 5,
    exceptionEdges: 3,
    nodes: 7,
    labels: ['통과', '실패', '일치', '불일치', '원인 수정 후 처음부터 재실행']
  }
] as const;
const BLACKSTONE_SWIMLANE_URL = '/diagrams/blackstone-belleforet-resort/payment-and-compensation.html';
const CANONICAL_HARNESS_INSIGHT_PATH = '/insights/codi-harness-dx-platform-design';
const PRESERVED_HARNESS_INFRA_INSIGHTS = [
  {
    slug: 'jenkins-retirement-and-github-actions-migration',
    title: 'GitHub Actions 전환보다 중요했던 배포 단위 재설계',
    bodySnippet: '이 값은 기존 Jenkins의 순차 실행 화면과 GitHub Actions matrix 실행 화면을 비교한 관찰값입니다.'
  },
  {
    slug: 'infisical-centralized-secrets-and-spof-defense',
    title: '환경변수 중앙화는 저장보다 경계 설계다: Infisical Self-Hosted 도입기',
    bodySnippet: '중앙화로 환경변수의 소유권과 배포 실패 경계는 분리했지만'
  },
  {
    slug: 'cloudflare-tunnel-zero-trust-cicd-and-troubleshooting',
    title: 'Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다',
    bodySnippet:
      'Tunnel과 Bastion을 프로젝트마다 새로 만들지 않고 공용으로 재사용하되, 한 프로젝트의 SSH 키가 다른 서버의 배포 권한으로 이어지지 않도록'
  }
] as const;
const REMOVED_HARNESS_INSIGHT_SLUGS = [
  'harness-lock-and-project-ownership-boundary',
  'harness-cli-and-doctor-productization',
  'claude-codex-policy-parity-and-regression-testing',
  'multi-session-testbed-and-context-lifecycle'
] as const;
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

async function expectArchifyPreviewReady(page: Page, title: string, url: string) {
  const card = page.getByRole('article', { name: title });
  const preview = card.locator('[data-archify-swimlane="preview"]');
  await preview.scrollIntoViewIfNeeded();
  await expect(preview).toHaveAttribute('data-archify-state', 'ready', { timeout: 15_000 });
  const frame = preview.locator('[data-archify-frame="preview"]');
  await expect(frame).toHaveAttribute('src', url);

  return { card, preview, content: frame.contentFrame() };
}

async function expectArchifyDialogReady(page: Page, url: string) {
  const dialog = page.getByRole('dialog');
  const embed = dialog.locator('[data-archify-swimlane="dialog"]');
  await expect(embed).toHaveAttribute('data-archify-state', 'ready', { timeout: 15_000 });
  const frame = embed.locator('[data-archify-frame="dialog"]');
  await expect(frame).toHaveAttribute('src', url);

  return { dialog, content: frame.contentFrame() };
}

test.describe('Codi Harness 작업물 상세', () => {
  test('개요, 역할과 근거 지표를 장문 구현보다 먼저 보여준다', async ({ page }) => {
    await page.goto(HARNESS_PATH);

    const overview = page.getByRole('heading', { name: '프로젝트 개요', exact: true });
    const role = page.getByRole('heading', { name: '나의 역할과 책임 범위', exact: true });
    const highlights = page.getByRole('heading', { name: '핵심 결과 요약', exact: true });
    const implementation = page.getByRole('heading', { name: '핵심 설계와 구현', exact: true });

    await expect(overview).toBeVisible();
    await expect(role).toBeVisible();
    await expect(highlights).toBeVisible();
    await expect(implementation).toBeVisible();

    const headingOrder = await page.locator('main h2').allTextContents();
    expect(headingOrder.indexOf('프로젝트 개요')).toBeLessThan(headingOrder.indexOf('핵심 설계와 구현'));
    expect(headingOrder.indexOf('핵심 결과 요약')).toBeLessThan(headingOrder.indexOf('핵심 설계와 구현'));

    await expect(page.getByText('11개', { exact: true })).toBeVisible();
    await expect(page.getByText('8개', { exact: true })).toBeVisible();
    await expect(page.getByText('3명', { exact: true })).toBeVisible();
    await expect(page.getByText('$151.84/월', { exact: true })).toBeVisible();
    await expect(page.getByText('약 15분 → 약 3분', { exact: true })).toBeVisible();
  });

  test('검증된 데모가 없는 하네스에는 데모 CTA를 만들지 않는다', async ({ page }) => {
    await page.goto(HARNESS_PATH);

    await expect(page.getByRole('link', { name: /데모|시뮬레이터|준비 중/ })).toHaveCount(0);
  });

  test('10개 공통 제목을 승인된 읽기 순서로 표시한다', async ({ page }) => {
    await page.goto(HARNESS_PATH);

    await expect(page.locator('main h2')).toHaveText([
      '프로젝트 개요',
      '나의 역할과 책임 범위',
      '핵심 결과 요약',
      '문제 상황과 제약 조건',
      '대안 검토와 선택',
      '시스템 흐름',
      '핵심 설계와 구현',
      '결과와 검증 근거',
      '회고와 다음 개선',
      '관련 인사이트'
    ]);
  });

  test('라이트·다크 모드에서 semantic token으로 연결형 흐름을 구분한다', async ({ page }) => {
    await page.goto(HARNESS_PATH);

    const normalizeDash = (value: string | null) =>
      (value ?? '')
        .trim()
        .toLowerCase()
        .replaceAll('px', '')
        .replace(/\s*,\s*/g, ',')
        .replace(/\s+/g, ',');
    const assertOpaqueStroke = (stroke: string) => {
      const normalized = stroke.toLowerCase().replace(/\s+/g, '');

      expect(normalized).not.toBe('');
      expect(normalized).not.toBe('none');
      expect(normalized).not.toBe('transparent');
      expect(normalized).not.toMatch(/^rgba?\([^)]*,0(?:\.0*)?\)$/);
      expect(normalized).not.toMatch(/\/0(?:\.0*)?\)$/);
    };
    const assertThemeSemantics = async () => {
      for (const target of HARNESS_SWIMLANES) {
        const { card } = await expectArchifyPreviewReady(page, target.title, target.url);
        await expect(card.locator('[data-swimlane-line-legend]')).toBeVisible();
        await card.getByRole('button', { name: `${target.title} 크게 보기`, exact: true }).click();
        const { dialog, content } = await expectArchifyDialogReady(page, target.url);
        const normalEdge = content.locator('path.a-default[data-edge-id]:visible').first();
        const exceptionEdge = content.locator('path.a-security[data-edge-id]:visible').first();

        await expect(normalEdge).toBeVisible();
        await expect(exceptionEdge).toBeVisible();
        await expect(content.locator('[data-legend]')).toBeHidden();

        const edgeStyles = await Promise.all(
          [normalEdge, exceptionEdge].map((edge) =>
            edge.evaluate((element) => {
              const style = getComputedStyle(element);

              return {
                dashAttribute: element.getAttribute('stroke-dasharray'),
                computedDash: style.strokeDasharray,
                stroke: style.stroke
              };
            })
          )
        );
        const [normalStyle, exceptionStyle] = edgeStyles;
        const normalDash = normalizeDash(normalStyle.computedDash);
        const exceptionDashes = [
          normalizeDash(exceptionStyle.computedDash),
          normalizeDash(exceptionStyle.dashAttribute)
        ];

        expect(normalStyle.dashAttribute).toBeNull();
        expect(normalDash === '' || normalDash === 'none' || /^0(?:,0)*$/.test(normalDash)).toBe(true);
        expect(exceptionDashes).toContain('5,5');
        assertOpaqueStroke(normalStyle.stroke);
        assertOpaqueStroke(exceptionStyle.stroke);
        expect(normalStyle.stroke).not.toBe(exceptionStyle.stroke);

        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
      }
    };

    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await assertThemeSemantics();

    await page.locator('html').evaluate((element) => element.classList.add('dark'));

    await expect(page.locator('html')).toHaveClass(/dark/);
    await assertThemeSemantics();
  });

  test('두 Archify 스윔레인에서 전체 진행·예외 경로를 읽을 수 있다', async ({ page }) => {
    await page.goto(HARNESS_PATH);

    await expect(page.locator('#design-development-verification-inline-summary')).toBeVisible();
    await expect(page.locator('#design-development-verification-inline-summary')).toContainText(
      /요청·맥락 전달.*문제 정의.*명세·계획.*승인.*테스트·구현.*리뷰·검증/
    );
    await expect(page.locator('#cicd-secrets-deployment-inline-summary')).toBeVisible();
    await expect(page.locator('#cicd-secrets-deployment-inline-summary')).toContainText(
      /변경 감지.*품질 검사.*환경·대상 결정.*시크릿 조회.*병렬 배포.*결과 확인/
    );
    for (const target of HARNESS_SWIMLANES) {
      const { card, preview } = await expectArchifyPreviewReady(page, target.title, target.url);
      await expect(preview).toHaveAttribute('aria-describedby', expect.stringContaining('-inline-summary'));
      await card.getByRole('button', { name: `${target.title} 크게 보기`, exact: true }).click();
      const { dialog, content } = await expectArchifyDialogReady(page, target.url);
      await expect(content.locator('path.a-default[data-edge-id]')).toHaveCount(target.normalEdges);
      await expect(content.locator('path.a-security[data-edge-id]')).toHaveCount(target.exceptionEdges);
      await expect(content.locator('[data-node-id]')).toHaveCount(target.nodes);
      const transcript = dialog.locator('[data-swimlane-mobile-transcript]');
      await expect(transcript.locator('[data-swimlane-transcript-step]')).toHaveCount(target.nodes);
      for (const label of target.labels) {
        await expect(transcript).toContainText(label);
      }

      await expect(content.locator('[tabindex="0"]')).toHaveCount(0);
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
    }

    await expect(page.getByText('전체 흐름 설명', { exact: true })).toHaveCount(2);
    await expect(page.getByText('예외 상황과 대응', { exact: true })).toHaveCount(2);
    await expect(page.getByText('사용자에게 추가 질문한 뒤 문제 정의를 다시 진행합니다.')).toBeVisible();
    await expect(page.getByText('배포를 중단하고 설정을 수정한 뒤 workflow를 처음부터 다시 실행합니다.')).toBeVisible();
    for (const title of ['설계·개발·검증', 'CI/CD·시크릿·배포']) {
      const article = page.getByRole('article', { name: title });
      const preview = article.locator('[data-swimlane-preview]');

      await expect(preview).toHaveCount(1);
      await expect(preview).not.toHaveAttribute('tabindex');
    }

    for (const forbiddenCopy of ['연결과 분기', '순서형 대체 설명', '이전 단계로 복구', '계속', '제한:']) {
      await expect(page.getByText(forbiddenCopy, { exact: false })).toHaveCount(0);
    }
  });

  for (const width of [320, 768, 1024, 1440]) {
    test(`${width}px에서 페이지 전체 가로 넘침이 없다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(HARNESS_PATH);

      await expect(page.getByRole('heading', { name: '프로젝트 개요', exact: true })).toBeVisible();
      await expect(page.locator('[data-archify-swimlane="preview"]')).toHaveCount(2);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test('대표 설계 네 개와 도구 전환 판단을 작업물 본문에서 확인한다', async ({ page }) => {
    await page.goto(HARNESS_PATH);

    const headings = [
      './harness와 doctor',
      'harness.lock과 소유권 경계',
      '공통 정책과 런타임 어댑터',
      '변경 범위 기반 배포와 Infisical 경계'
    ];

    await expect(page.getByRole('heading', { name: '핵심 설계와 구현', exact: true })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: '변경 범위 기반 배포와 Infisical 경계', exact: true })
    ).toBeVisible();

    const subsectionOrder = (await page.getByRole('heading', { level: 3 }).allTextContents()).map((heading) =>
      heading.replaceAll('`', '').replace(/\s+/g, '')
    );
    let previousIndex = -1;

    for (const heading of headings) {
      const normalizedHeading = heading.replace(/\s+/g, '');
      expect(subsectionOrder.filter((renderedHeading) => renderedHeading === normalizedHeading)).toHaveLength(1);
      const index = subsectionOrder.indexOf(normalizedHeading);
      expect(index).toBeGreaterThan(previousIndex);
      await expect(page.getByRole('heading', { level: 3 }).nth(index)).toBeVisible();
      previousIndex = index;
    }
    await expect(page.getByText('GSD → Spec Kit', { exact: false })).toBeVisible();
    await expect(page.getByText('GStack → Playwright MCP', { exact: false })).toBeVisible();
    await expect(page.getByText('문서 양식 통제와 사용자 의견 반영', { exact: false })).toBeVisible();
    await expect(page.getByText('browse 외 활용이 크지 않아', { exact: false })).toBeVisible();
  });

  test('통합 대표 insight 링크를 키보드로 같은 탭에서 열고 8단계 발전 서사를 표시한다', async ({ page }) => {
    await page.goto(HARNESS_PATH);

    const implementationSection = page.getByRole('heading', { name: '핵심 설계와 구현', exact: true }).locator('..');
    const deeperReadingHeading = implementationSection.getByRole('heading', { name: '더 깊이 읽기', exact: true });
    const canonicalLink = implementationSection.getByRole('link', {
      name: 'DX 하네스 v2: 복사형 도구에서 사내 개발 운영 플랫폼까지',
      exact: true
    });

    await expect(deeperReadingHeading).toBeVisible();
    await expect(canonicalLink).toBeVisible();
    await expect(canonicalLink).toHaveAttribute('href', CANONICAL_HARNESS_INSIGHT_PATH);
    await expect(canonicalLink).not.toHaveAttribute('target', '_blank');
    await canonicalLink.focus();
    await expect(canonicalLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${CANONICAL_HARNESS_INSIGHT_PATH}$`));
    await expect(
      page.getByRole('heading', {
        name: 'DX 하네스 v2: 복사형 도구에서 사내 개발 운영 플랫폼까지',
        exact: true
      })
    ).toBeVisible();
    await expect(page.getByText('9 min', { exact: true })).toBeVisible();
    await expect(page.locator('article h2')).toHaveText(CANONICAL_HARNESS_HEADINGS);
    await expect(page.getByText('공통 정책과 소유권 경계', { exact: false })).toBeVisible();
    await expect(page.getByText('전적으로 혼자 구성하고 설계했습니다', { exact: false })).toHaveCount(0);
    const evolutionTimeline = page.locator('article pre code', { hasText: 'Jenkins 제거와 배포 자동화' });
    const handoffTimeline = page.locator('article pre code', { hasText: '사용자의 명시적인 codi-auto-loop 요청 대기' });
    await expect(evolutionTimeline).toContainText('Jenkins 제거와 배포 자동화');
    await expect(handoffTimeline).toContainText('사용자의 명시적인 codi-auto-loop 요청 대기');

    await page.goto(HARNESS_PATH);
    const externalLink = page.getByRole('link', {
      name: 'AWS EC2 On-Demand 공개 가격 (새 창에서 열림)',
      exact: true
    });
    await expect(externalLink).toHaveAttribute('target', '_blank');
    await expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('제거된 네 insight route는 redirect 없이 404다', async ({ page }) => {
    for (const slug of REMOVED_HARNESS_INSIGHT_SLUGS) {
      const response = await page.goto(`/insights/${slug}`);

      expect(response?.request().redirectedFrom(), slug).toBeNull();
      expect(new URL(page.url()).pathname, slug).toBe(`/insights/${slug}`);
      expect(response?.status(), slug).toBe(404);
    }
  });

  test('유지 인프라 세 경로는 제목과 현재 근거 경계를 표시한다', async ({ page }) => {
    for (const fixture of PRESERVED_HARNESS_INFRA_INSIGHTS) {
      const response = await page.goto(`/insights/${fixture.slug}`);

      expect(response?.ok(), fixture.slug).toBe(true);
      expect(response?.request().redirectedFrom(), fixture.slug).toBeNull();
      await expect(page.getByRole('heading', { level: 1, name: fixture.title, exact: true })).toBeVisible();
      await expect(
        page.getByRole('article').getByText(fixture.bodySnippet, { exact: false }),
        fixture.slug
      ).toBeVisible();
    }
  });

  test('실제 작업물 route는 연결 insight를 본문·하단·사이드바에 모두 노출하고 제거 href는 0개다', async ({ page }) => {
    await page.goto(HARNESS_PATH);
    await expect(page.getByRole('heading', { name: '핵심 설계와 구현', exact: true })).toBeVisible();

    // 본문 인라인 링크 1개 + 하단 '관련 인사이트' 카드 1개 + 사이드바 1개.
    await expect(page.locator(`a[href="${CANONICAL_HARNESS_INSIGHT_PATH}"]`)).toHaveCount(3);

    // 하단과 사이드바는 연결된 insight 네 개를 모두 제공한다.
    for (const { slug } of PRESERVED_HARNESS_INFRA_INSIGHTS) {
      await expect(page.locator(`a[href="/insights/${slug}"]`), slug).toHaveCount(2);
    }

    for (const slug of REMOVED_HARNESS_INSIGHT_SLUGS) {
      await expect(page.locator(`a[href="/insights/${slug}"]`), slug).toHaveCount(0);
    }
  });

  test('320px에서 스윔레인 미리보기가 가로 스크롤과 키보드 정지점을 만들지 않는다', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(HARNESS_PATH);

    for (const title of ['설계·개발·검증', 'CI/CD·시크릿·배포']) {
      const preview = page.getByRole('article', { name: title }).locator('[data-swimlane-preview]');

      await expect(preview).toHaveCount(1);
      await expect(preview).not.toHaveAttribute('tabindex');
      expect(await preview.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
      await expect(preview.locator('[data-swimlane-step][tabindex], [data-edge-kind][tabindex]')).toHaveCount(0);
    }
  });

  test('8개 작업물 경로와 구조화 상세를 유지한다', async ({ page }) => {
    const structuredSlugs = [
      'codi-harness-dx-platform',
      'the-siena-golf-reservation',
      'hanmaum-science-institute',
      'blackstone-belleforet-resort',
      'hipass-b2b-platform',
      'hotel-reservation-platform',
      'integrated-sso-server',
      'integrated-reservation-platform'
    ];

    expect(structuredSlugs).toHaveLength(8);

    for (const slug of structuredSlugs) {
      const response = await page.goto(`/projects/${slug}`);
      expect(response?.ok(), slug).toBe(true);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.getByRole('heading', { name: '프로젝트 개요', exact: true }), slug).toBeVisible();
    }

    await page.goto('/projects/integrated-reservation-platform');
    await expect(page.getByRole('heading', { name: '시스템 흐름', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: '핵심 데이터 관계', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /데모|시뮬레이터|준비 중/ })).toHaveCount(0);
  });
});

test.describe('블랙스톤 벨포레 리조트 구조화 상세', () => {
  test('공통 10개 제목과 근거 지표를 표시하고 데모 대신 연결 인사이트를 제공한다', async ({ page }) => {
    await page.goto(BLACKSTONE_PATH);

    await expect(page.locator('main h2')).toHaveText([
      '프로젝트 개요',
      '나의 역할과 책임 범위',
      '핵심 결과 요약',
      '문제 상황과 제약 조건',
      '대안 검토와 선택',
      '시스템 흐름',
      '핵심 설계와 구현',
      '결과와 검증 근거',
      '회고와 다음 개선',
      '관련 인사이트'
    ]);

    for (const value of ['10건 미만', '2024년 오픈 ~ 현재 진행 중']) {
      await expect(page.getByText(value, { exact: true })).toBeVisible();
    }
    await expect(page.getByText('약 20초', { exact: true })).toHaveCount(0);
    await expect(page.getByText('약 1시간', { exact: true })).toHaveCount(0);
    await expect(page.getByText('사용자 보고값', { exact: true })).toHaveCount(2);
    await expect(page.getByText('측정값', { exact: true })).toHaveCount(0);
    await expect(page.getByText('실제 불일치 건수의 하한', { exact: false })).toBeVisible();
    await expect(page.getByRole('link', { name: /데모|시뮬레이터|준비 중/ })).toHaveCount(0);
    await expect(page.locator(`a[href="${BLACKSTONE_INSIGHT_PATH}"]`)).toHaveCount(3);
  });

  test('결제·보상취소 흐름의 정상 경로와 세 예외를 텍스트와 선 종류로 구분한다', async ({ page }) => {
    await page.goto(BLACKSTONE_PATH);

    const article = page.getByRole('article', { name: '결제·보상취소 흐름' });
    const preview = article.locator('[data-swimlane-preview]');

    await expect(article).toBeVisible();
    await expect(preview).not.toHaveAttribute('tabindex');
    const archify = await expectArchifyPreviewReady(page, '결제·보상취소 흐름', BLACKSTONE_SWIMLANE_URL);
    await expect(archify.content.locator('path.a-default[data-edge-id]')).toHaveCount(5);
    await expect(archify.content.locator('path.a-security[data-edge-id]')).toHaveCount(3);
    await expect(archify.content.locator('[data-node-id]')).toHaveCount(9);
    await expect(page.getByText('전체 흐름 설명', { exact: true })).toBeVisible();
    await expect(page.getByText('예외 상황과 대응', { exact: true })).toBeVisible();
    await expect(page.getByText(/fallback|resvId|tid/)).toHaveCount(0);
    await expect(archify.content.locator('[data-edge-label="응답 미도달·생성 실패·PHP 예외"]').first()).toBeVisible();
    await expect(archify.content.locator('[data-edge-label="외부 PMS 장애"]').first()).toBeVisible();
    await expect(archify.content.locator('[data-edge-label="12초 timeout 조기 실패 오판"]').first()).toBeVisible();
    await expect(archify.content.locator('path.a-default[data-edge-id]').first()).toHaveCSS('stroke-dasharray', 'none');
    await expect(archify.content.locator('path.a-security[data-edge-id]').first()).toHaveCSS(
      'stroke-dasharray',
      '5px, 5px'
    );
  });

  for (const width of [320, 768, 1024, 1440]) {
    test(`${width}px에서 문서와 결제 흐름 미리보기에 가로 넘침이 없다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(BLACKSTONE_PATH);

      const preview = page.getByRole('article', { name: '결제·보상취소 흐름' }).locator('[data-swimlane-preview]');
      await expect(preview).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(1);
      expect(await preview.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
      await expect(preview).not.toHaveAttribute('tabindex');
    });
  }
});
