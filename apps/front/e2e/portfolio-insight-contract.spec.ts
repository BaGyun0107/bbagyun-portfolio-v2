import { expect, test, type Locator, type Page } from '@playwright/test';

const escapeForRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const accessibleName = (value: string) => new RegExp(escapeForRegExp(value));
const TAB_TRAVERSAL_LIMIT = 80;

const focusWithBoundedTabTraversal = async (page: Page, target: Locator, description: string) => {
  await expect(page.locator('body'), `${description}: tab traversal starts from body`).toBeFocused();
  await expect(target, `${description}: target is visible before traversal`).toBeVisible();

  for (let tabCount = 0; tabCount < TAB_TRAVERSAL_LIMIT; tabCount += 1) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((element) => document.activeElement === element)) {
      await expect(target, `${description}: focused after ${tabCount + 1} Tab presses`).toBeFocused();
      return;
    }
  }

  await expect(
    target,
    `${description}: target was not reached within ${TAB_TRAVERSAL_LIMIT} Tab presses`
  ).toBeFocused();
};

const TARGET_INSIGHTS = [
  {
    slug: 'codi-harness-dx-platform-design',
    title: 'DX 하네스 v2: 복사형 도구에서 사내 개발 운영 플랫폼까지',
    label: '프로젝트 사례형'
  },
  {
    slug: 'infisical-centralized-secrets-and-spof-defense',
    title: '환경변수 중앙화는 저장보다 경계 설계다: Infisical Self-Hosted 도입기',
    label: '프로젝트 사례형'
  },
  {
    slug: 'cloudflare-tunnel-zero-trust-cicd-and-troubleshooting',
    title: 'Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다',
    label: '프로젝트 사례형'
  },
  {
    slug: 'jenkins-retirement-and-github-actions-migration',
    title: 'GitHub Actions 전환보다 중요했던 배포 단위 재설계',
    label: '프로젝트 사례형'
  },
  {
    slug: 'logging-decoupling-and-buffering-in-external-api-systems',
    title: '로그는 남기는 것보다 조회할 수 있어야 한다: 외부 API 로그 분리기',
    label: '프로젝트 사례형'
  },
  {
    slug: 'optimizing-770k-text-search-in-rdbms',
    title: 'LIKE에서 FULLTEXT·토큰 검증까지: RDBMS 검색을 단계적으로 개선한 과정',
    label: '프로젝트 사례형'
  },
  {
    slug: 'spa-api-key-exposure-and-bff-architecture',
    title: 'React API Key 노출을 서버 경계로 옮기며 배운 BFF의 필요성',
    label: '프로젝트 사례형'
  },
  {
    slug: 'sso-authentication-and-soft-fk',
    title: 'UUID Soft FK만으로는 부족했다: 분리된 회원 데이터의 조회 경계',
    label: '프로젝트 사례형'
  },
  {
    slug: 'json-outbox-pattern-for-settlement',
    title: '정산 상태는 DB에, 재처리 입력은 JSON에 둔 이유',
    label: '프로젝트 사례형'
  },
  {
    slug: 'socketio-realtime-architecture-and-reliability',
    title: '공용 Room에서 화원별 User Room으로: 전달 범위와 전달 보장은 다르다',
    label: '프로젝트 사례형'
  },
  {
    slug: 'config-driven-architecture-react',
    title: 'Config 이후의 경계: 멀티플랫폼 React를 core·rsConfig·platform으로 나눈 이유',
    label: '프로젝트 사례형'
  },
  {
    slug: 'context-api-encapsulation-and-router-level-isolation',
    title: 'Props Drilling을 줄이기 위해 예약 Context의 생명주기를 라우터에 둔 이유',
    label: '프로젝트 사례형'
  },
  {
    slug: 'nestjs-middleware-vs-guard-tradeoff',
    title: 'NestJS 인증은 Middleware와 Guard 중 하나를 고르는 문제가 아니었다',
    label: '프로젝트 사례형'
  },
  {
    slug: 'nextjs-nestjs-domain-separation-and-bff',
    title: '[Next.js x NestJS] 프론트엔드와 백엔드의 도메인 분리와 BFF 설계',
    label: '프로젝트 사례형'
  },
  {
    slug: 'https-and-plaintext-password-transmission',
    title: '구글과 네이버는 왜 비밀번호를 평문으로 보낼까? (개발자 도구의 착시와 HTTPS의 진실)',
    label: '프로젝트 사례형'
  },
  {
    slug: 'vercel-team-plan-bypass-and-serverless-cost-analysis',
    title: 'Vercel Developer Seat 비용 조건과 Custom CI 배포 검증',
    label: '기술 탐구형'
  }
] as const;

const ROUND_TRIPS = [
  {
    sourcePath: '/projects/codi-harness-dx-platform',
    insightPath: '/insights/codi-harness-dx-platform-design',
    insightTitle: 'DX 하네스 v2: 복사형 도구에서 사내 개발 운영 플랫폼까지',
    sourceTitle: '사내 DX 하네스 v2 구축',
    label: '프로젝트 사례형'
  },
  {
    sourcePath: '/projects/codi-harness-dx-platform',
    insightPath: '/insights/infisical-centralized-secrets-and-spof-defense',
    insightTitle: '환경변수 중앙화는 저장보다 경계 설계다: Infisical Self-Hosted 도입기',
    sourceTitle: '사내 DX 하네스 v2 구축',
    label: '프로젝트 사례형'
  },
  {
    sourcePath: '/projects/codi-harness-dx-platform',
    insightPath: '/insights/cloudflare-tunnel-zero-trust-cicd-and-troubleshooting',
    insightTitle: 'Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다',
    sourceTitle: '사내 DX 하네스 v2 구축',
    label: '프로젝트 사례형'
  },
  {
    sourcePath: '/projects/codi-harness-dx-platform',
    insightPath: '/insights/jenkins-retirement-and-github-actions-migration',
    insightTitle: 'GitHub Actions 전환보다 중요했던 배포 단위 재설계',
    sourceTitle: '사내 DX 하네스 v2 구축',
    label: '프로젝트 사례형'
  },
  {
    sourcePath: '/projects/the-siena-golf-reservation',
    insightPath: '/insights/logging-decoupling-and-buffering-in-external-api-systems',
    insightTitle: '로그는 남기는 것보다 조회할 수 있어야 한다: 외부 API 로그 분리기',
    sourceTitle: '골프 예약 시스템 구축',
    label: '프로젝트 사례형'
  },
  {
    sourcePath: '/projects/hanmaum-science-institute',
    insightPath: '/insights/optimizing-770k-text-search-in-rdbms',
    insightTitle: 'LIKE에서 FULLTEXT·토큰 검증까지: RDBMS 검색을 단계적으로 개선한 과정',
    sourceTitle: '법문검색 엔진 구축',
    label: '프로젝트 사례형'
  },
  {
    sourcePath: '/projects/blackstone-belleforet-resort',
    insightPath: '/insights/spa-api-key-exposure-and-bff-architecture',
    insightTitle: 'React API Key 노출을 서버 경계로 옮기며 배운 BFF의 필요성',
    sourceTitle: '리조트 웹사이트 리뉴얼 및 예약 시스템 구축',
    label: '프로젝트 사례형'
  },
  {
    sourcePath: '/projects/integrated-sso-server',
    insightPath: '/insights/sso-authentication-and-soft-fk',
    insightTitle: 'UUID Soft FK만으로는 부족했다: 분리된 회원 데이터의 조회 경계',
    sourceTitle: '중앙 회원 관리·인증 서버 설계 및 구축',
    label: '프로젝트 사례형'
  },
  {
    sourcePath: '/projects/hipass-b2b-platform',
    insightPath: '/insights/json-outbox-pattern-for-settlement',
    insightTitle: '정산 상태는 DB에, 재처리 입력은 JSON에 둔 이유',
    sourceTitle: '화훼 도소매 B2B 주문 플랫폼',
    label: '프로젝트 사례형'
  },
  {
    sourcePath: '/projects/integrated-reservation-platform',
    insightPath: '/insights/nestjs-middleware-vs-guard-tradeoff',
    insightTitle: 'NestJS 인증은 Middleware와 Guard 중 하나를 고르는 문제가 아니었다',
    sourceTitle: '행사 호텔 예약·결제 통합 플랫폼',
    label: '프로젝트 사례형'
  },
  {
    sourcePath: '/projects/integrated-reservation-platform',
    insightPath: '/insights/nextjs-nestjs-domain-separation-and-bff',
    insightTitle: '[Next.js x NestJS] 프론트엔드와 백엔드의 도메인 분리와 BFF 설계',
    sourceTitle: '행사 호텔 예약·결제 통합 플랫폼',
    label: '프로젝트 사례형'
  },
  {
    sourcePath: '/projects/integrated-reservation-platform',
    insightPath: '/insights/https-and-plaintext-password-transmission',
    insightTitle: '구글과 네이버는 왜 비밀번호를 평문으로 보낼까? (개발자 도구의 착시와 HTTPS의 진실)',
    sourceTitle: '행사 호텔 예약·결제 통합 플랫폼',
    label: '프로젝트 사례형'
  },
  {
    sourcePath: '/projects/hotel-reservation-platform',
    insightPath: '/insights/config-driven-architecture-react',
    insightTitle: 'Config 이후의 경계: 멀티플랫폼 React를 core·rsConfig·platform으로 나눈 이유',
    sourceTitle: '호텔 예약 시스템 플랫폼화 및 구조 고도화',
    label: '프로젝트 사례형'
  },
  {
    sourcePath: '/projects/hotel-reservation-platform',
    insightPath: '/insights/context-api-encapsulation-and-router-level-isolation',
    insightTitle: 'Props Drilling을 줄이기 위해 예약 Context의 생명주기를 라우터에 둔 이유',
    sourceTitle: '호텔 예약 시스템 플랫폼화 및 구조 고도화',
    label: '프로젝트 사례형'
  },
  {
    sourcePath: '/projects/hipass-b2b-platform',
    insightPath: '/insights/socketio-realtime-architecture-and-reliability',
    insightTitle: '공용 Room에서 화원별 User Room으로: 전달 범위와 전달 보장은 다르다',
    sourceTitle: '화훼 도소매 B2B 주문 플랫폼',
    label: '프로젝트 사례형'
  },
  {
    sourcePath: '/study/ai-dx-harness-starter-kit',
    insightPath: '/insights/vercel-team-plan-bypass-and-serverless-cost-analysis',
    insightTitle: 'Vercel Developer Seat 비용 조건과 Custom CI 배포 검증',
    sourceTitle: 'DX 하네스 v1 PoC와 CI/CD·시크릿 인프라 검증',
    label: '기술 탐구형'
  }
] as const;

const LEGACY_INSIGHTS = [['ai-vibe-coding', 'AI 에이전트로 포트폴리오 구축하기: 아키텍트의 역할과 검증 기준']] as const;

test.describe('포트폴리오 인사이트 편집 계약', () => {
  test('목록은 migration 대상에만 15:1 유형 label을 표시한다', async ({ page }) => {
    await page.goto('/insights');
    const main = page.getByRole('main');

    await expect(main.getByText('프로젝트 사례형', { exact: true })).toHaveCount(15);
    await expect(main.getByText('기술 탐구형', { exact: true })).toHaveCount(1);

    for (const target of TARGET_INSIGHTS) {
      const card = main.getByRole('link', { name: accessibleName(target.title) });
      await expect(card, target.slug).toContainText(target.title);
      await expect(card, target.slug).toContainText(target.label);
    }
  });

  test('열여섯 상세 route는 승인된 유형 label을 표시한다', async ({ page }) => {
    for (const target of TARGET_INSIGHTS) {
      await page.goto(`/insights/${target.slug}`);
      const article = page.getByRole('article');

      await expect(
        article.getByRole('heading', { level: 1, name: target.title, exact: true }),
        target.slug
      ).toBeVisible();
      await expect(article.getByText(target.label, { exact: true }), target.slug).toBeVisible();
    }
  });

  test('더 시에나 로그 분리는 승인된 관찰 범위와 전후 architecture만 공개한다', async ({ page }) => {
    await page.goto('/insights');
    const listLink = page
      .getByRole('main')
      .getByRole('link', { name: /로그는 남기는 것보다 조회할 수 있어야 한다: 외부 API 로그 분리기/ });
    await expect(listLink).toBeVisible();
    await focusWithBoundedTabTraversal(page, listLink, 'insight list link');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/insights\/logging-decoupling-and-buffering-in-external-api-systems$/);

    const article = page.getByRole('article');

    await expect(
      article.getByRole('heading', {
        level: 1,
        name: '로그는 남기는 것보다 조회할 수 있어야 한다: 외부 API 로그 분리기',
        exact: true
      })
    ).toBeVisible();
    await expect(article.getByText('프로젝트 사례형', { exact: true })).toBeVisible();
    await expect(article.getByText(/예약 기능 자체에 미친 영향은 거의 없었습니다/)).toBeVisible();
    await expect(article.getByText(/시스템 로그에서 해당 요청과 응답을 직접 확인/)).toBeVisible();
    const architecture = article.locator('pre').filter({ hasText: '변경 전' });
    await expect(architecture).toBeVisible();
    await expect(architecture).toContainText('업무 DB 통신 로그');
    await expect(architecture).toContainText('변경 후');
    await expect(architecture).toContainText('서버 시스템 로그에서 요청·응답 추적');
    await expect(article.getByText(/인증값과 개인정보를 마스킹/)).toBeVisible();
    await expect(article.getByText(/20건|파일 I\/O 약 95%|인메모리 버퍼링|비정상 대량 요청/)).toHaveCount(0);

    await page.goto('/projects/the-siena-golf-reservation');
    const main = page.getByRole('main');
    await expect(main.getByText(/syslog/).first()).toBeVisible();
    await expect(main.getByText(/20건|파일 I\/O 약 95%|인메모리 버퍼링|비정상 대량 요청/)).toHaveCount(0);

    await page.goto('/about');
    await expect(page.getByRole('main').getByText(/외부 API 통신 로그를 업무 DB에서 시스템 로그로 분리/)).toBeVisible();
    await expect(page.getByRole('main').getByText(/I\/O 약 95%/)).toHaveCount(0);
  });

  test('Infisical 중앙화는 운영 장애와 검증한 배포 경계, 남은 복구 한계를 공개한다', async ({ page }) => {
    await page.goto('/insights/infisical-centralized-secrets-and-spof-defense');

    const article = page.getByRole('article');

    await expect(
      article.getByRole('heading', {
        level: 1,
        name: '환경변수 중앙화는 저장보다 경계 설계다: Infisical Self-Hosted 도입기',
        exact: true
      })
    ).toBeVisible();
    await expect(article.getByText(/약 10분[^.]*운영 서비스 장애/)).toBeVisible();
    await expect(article.getByText(/정확한 원인은 끝까지 규명하지 못/)).toBeVisible();
    await expect(article.getByText(/별도의 테스트 프로젝트와 서버/)).toBeVisible();
    await expect(article.getByText(/기존에 실행 중이던 테스트 서비스/)).toBeVisible();
    await expect(article.getByText(/시스템 전수 집계나 장애율 통계/)).toBeVisible();
    await expect(article.getByText(/데이터베이스와 백업 파일이 함께 삭제/)).toBeVisible();

    const architecture = article.locator('pre').filter({ hasText: '도입 전' });
    await expect(architecture).toBeVisible();
    await expect(architecture).toContainText('Infisical SSOT');
    await expect(architecture).toContainText('배포 실패 경계');
    await expect(architecture).toContainText('남은 복구 경계');
    await expect(article.getByText(/실제 Infisical 장애를 겪고 복구 결과를 측정한 기록이 아니라/)).toHaveCount(0);
  });

  test('Cloudflare Tunnel은 초기 실패와 현재 Bastion 권한 경계를 구분한다', async ({ page }) => {
    await page.goto('/insights/cloudflare-tunnel-zero-trust-cicd-and-troubleshooting');

    const article = page.getByRole('article');

    await expect(
      article.getByRole('heading', {
        level: 1,
        name: 'Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다',
        exact: true
      })
    ).toBeVisible();
    await expect(
      article.getByText(/2026-08-27 기준 9개 프로젝트가 하나의 Bastion을 경유해 5대 서버로 배포됩니다/)
    ).toBeVisible();

    const dataFlow = article.locator('pre').filter({ hasText: '2026년 4월 초기 구성' });
    await expect(dataFlow).toBeVisible();
    await expect(dataFlow).toContainText('실제 배포 없음');
    await expect(dataFlow).toContainText('Service Token 인증');
    await expect(dataFlow).toContainText('PermitOpen 대상 제한');
    await expect(dataFlow).toContainText('프로젝트 × 배포 서버별 SSH 키 인증');
    await expect(article.getByText(/잘못된 서버에 서비스가\s+배포되지는 않았습니다/)).toBeVisible();
    await expect(
      article.getByText(/실제 Bastion 중단이나 장애 상황을 테스트해\s+확인한 결과는 아닙니다/)
    ).toBeVisible();
  });

  test('Jenkins 전환은 7월 배포 단위 재설계와 관찰 한계를 구분한다', async ({ page }) => {
    await page.goto('/insights/jenkins-retirement-and-github-actions-migration');

    const article = page.getByRole('article');
    await expect(
      article.getByRole('heading', {
        level: 1,
        name: 'GitHub Actions 전환보다 중요했던 배포 단위 재설계',
        exact: true
      })
    ).toBeVisible();
    await expect(article.getByText('2026.07.07', { exact: true })).toBeVisible();
    await expect(article.getByText(/기존 Jenkins 구성은 제가 설계하거나 설정한 영역이 아니/)).toBeVisible();
    await expect(article.getByText(/구조가 복잡한 프로젝트를 거의 마지막에 이전/)).toBeVisible();
    await expect(article.getByText(/공통 코드가 변경되면 다섯 호텔 전체/)).toBeVisible();
    await expect(article.getByText(/특정 호텔의 코드만 변경되면 해당 호텔만/)).toBeVisible();
    await expect(article.getByText(/실행 화면을 비교한 관찰값/)).toBeVisible();
    await expect(article.getByText(/의도적으로 실패시키지는 않았/)).toBeVisible();
    await expect(article.getByText(/대상 사이에 순서가 필요/)).toBeVisible();

    const dataFlow = article.locator('pre').filter({ hasText: 'GitHub Actions matrix' });
    await expect(dataFlow).toBeVisible();
    await expect(dataFlow).toContainText('slave 1개');
    await expect(dataFlow).toContainText('변경 범위 계산');
    await expect(dataFlow).toContainText('대상별 matrix job');
    await expect(dataFlow).toContainText('약 15분');
    await expect(dataFlow).toContainText('약 3분');
  });

  for (const fixture of ROUND_TRIPS) {
    test(`${fixture.sourcePath}에서 ${fixture.insightPath}를 키보드로 왕복한다`, async ({ page }) => {
      await page.goto(fixture.sourcePath);
      await expect(page.getByRole('heading', { level: 1, name: fixture.sourceTitle, exact: true })).toBeVisible();

      const main = page.getByRole('main');
      const insightLink = fixture.sourcePath.startsWith('/projects/')
        ? main.locator('a:not([target="_blank"])').filter({ hasText: fixture.insightTitle }).first()
        : main.getByRole('heading', { level: 4, name: fixture.insightTitle, exact: true }).locator('..');
      await expect(insightLink).toBeVisible();
      await expect(insightLink).toHaveAttribute('href', fixture.insightPath);
      await focusWithBoundedTabTraversal(page, insightLink, `${fixture.sourcePath} source link`);
      await page.keyboard.press('Enter');

      await expect(page).toHaveURL(new RegExp(`${fixture.insightPath}$`));
      const article = page.getByRole('article');
      await expect(article.getByRole('heading', { level: 1, name: fixture.insightTitle, exact: true })).toBeVisible();
      await expect(article.getByText(fixture.label, { exact: true })).toBeVisible();

      const sourceLink = page.getByRole('main').getByRole('link', { name: accessibleName(fixture.sourceTitle) });
      await expect(sourceLink).toBeVisible();
      await expect(sourceLink).toHaveAttribute('href', fixture.sourcePath);
      await focusWithBoundedTabTraversal(page, sourceLink, `${fixture.insightPath} reverse link`);
      await page.keyboard.press('Enter');

      await expect(page).toHaveURL(new RegExp(`${fixture.sourcePath}$`));
      await expect(page.getByRole('heading', { level: 1, name: fixture.sourceTitle, exact: true })).toBeVisible();
    });
  }

  test('legacy 1개 route와 제목을 보존하고 빈 유형 placeholder를 만들지 않는다', async ({ page }) => {
    for (const [slug, title] of LEGACY_INSIGHTS) {
      const response = await page.goto(`/insights/${slug}`);

      expect(response?.ok(), slug).toBe(true);
      const article = page.getByRole('article');
      await expect(article.getByRole('heading', { level: 1, name: title, exact: true }), slug).toBeVisible();
      await expect(article.getByText('프로젝트 사례형', { exact: true }), slug).toHaveCount(0);
      await expect(article.getByText('기술 탐구형', { exact: true }), slug).toHaveCount(0);
      await expect(article.getByText(/미분류|유형 없음/, { exact: true }), slug).toHaveCount(0);
    }
  });

  for (const width of [320, 768, 1024, 1440]) {
    test(`${width}px에서 목록과 두 유형 상세에 문서 전체 가로 넘침이 없다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });

      for (const path of [
        '/insights',
        '/insights/codi-harness-dx-platform-design',
        '/insights/infisical-centralized-secrets-and-spof-defense',
        '/insights/cloudflare-tunnel-zero-trust-cicd-and-troubleshooting',
        '/insights/jenkins-retirement-and-github-actions-migration',
        '/projects/the-siena-golf-reservation',
        '/insights/logging-decoupling-and-buffering-in-external-api-systems',
        '/insights/vercel-team-plan-bypass-and-serverless-cost-analysis'
      ]) {
        await page.goto(path);
        await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
        if (path === '/insights/jenkins-retirement-and-github-actions-migration') {
          const article = page.getByRole('article');
          const dataFlow = article.locator('pre').filter({ hasText: 'GitHub Actions matrix' });
          await expect(dataFlow).toBeVisible();
          await expect(dataFlow).toContainText('slave 1개');
          await expect(dataFlow).toContainText('변경 범위 계산');
          await expect(dataFlow).toContainText('대상별 matrix job');
          await expect(dataFlow).toContainText('약 15분');
          await expect(dataFlow).toContainText('약 3분');

          const scrollState = await dataFlow.evaluate((element) => ({
            overflowX: getComputedStyle(element).overflowX,
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
            scrollLeft: element.scrollLeft
          }));
          expect(scrollState.overflowX, path).toMatch(/auto|scroll/);
          expect(scrollState.scrollWidth, path).toBeGreaterThanOrEqual(scrollState.clientWidth);

          if (scrollState.scrollWidth > scrollState.clientWidth) {
            const scrollResult = await dataFlow.evaluate((element) => {
              const initialScrollLeft = element.scrollLeft;
              element.scrollLeft = element.scrollWidth - element.clientWidth;
              const scrolledLeft = element.scrollLeft;
              element.scrollLeft = initialScrollLeft;

              return { initialScrollLeft, scrolledLeft, restoredScrollLeft: element.scrollLeft };
            });
            expect(scrollResult.scrolledLeft, path).toBeGreaterThan(scrollResult.initialScrollLeft);
            expect(scrollResult.restoredScrollLeft, path).toBe(scrollResult.initialScrollLeft);
          }
        }
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(overflow, path).toBeLessThanOrEqual(1);
      }
    });
  }
});
