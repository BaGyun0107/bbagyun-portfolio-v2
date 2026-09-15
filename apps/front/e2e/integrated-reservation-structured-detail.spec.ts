import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test';

const PROJECT_PATH = '/projects/integrated-reservation-platform';
const PROJECT_TITLE = '행사 호텔 예약·결제 통합 플랫폼';
const PROJECT_STATUS = 'On Hold';
const WORKFLOW_TITLE = '고객사 UAT 예약·결제 흐름';
const RELATIONSHIP_TITLE = 'Core Product 관계도';
const WORKFLOW_ARTIFACT = '/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html';
const RELATIONSHIP_ARTIFACT = '/diagrams/integrated-reservation-platform/core-product-relationships.html';
const ALIAS_PATH = '/insights/enterprise-bff-architecture-and-cors';

const INSIGHTS = [
  {
    path: '/insights/nestjs-middleware-vs-guard-tradeoff',
    title: 'NestJS 인증은 Middleware와 Guard 중 하나를 고르는 문제가 아니었다',
    visualTitle: '관리자 요청의 인증·권한 책임 비교'
  },
  {
    path: '/insights/nextjs-nestjs-domain-separation-and-bff',
    title: '[Next.js x NestJS] 프론트엔드와 백엔드의 도메인 분리와 BFF 설계',
    visualTitle: '브라우저 직접 호출과 reverse proxy 경계 비교'
  },
  {
    path: '/insights/https-and-plaintext-password-transmission',
    title: '구글과 네이버는 왜 비밀번호를 평문으로 보낼까? (개발자 도구의 착시와 HTTPS의 진실)',
    visualTitle: null
  }
] as const;

const expectNoDocumentOverflow = async (page: Page, description: string) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );

  expect(overflow, description).toBeLessThanOrEqual(1);
};

const expectContainerFits = async (container: Locator, description: string) => {
  const overflow = await container.evaluate((element) => ({
    horizontal: element.scrollWidth - element.clientWidth,
    vertical: element.scrollHeight - element.clientHeight
  }));

  expect(overflow.horizontal, `${description}: horizontal`).toBeLessThanOrEqual(1);
  expect(overflow.vertical, `${description}: vertical`).toBeLessThanOrEqual(1);
};

const expectDialogContained = async (page: Page, dialog: Locator, description: string) => {
  const state = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return {
      left: rect.left,
      top: rect.top,
      rightGap: window.innerWidth - rect.right,
      bottomGap: window.innerHeight - rect.bottom,
      horizontalOverflow: element.scrollWidth - element.clientWidth,
      overflowY: style.overflowY
    };
  });

  expect(state.left, `${description}: left`).toBeGreaterThanOrEqual(-1);
  expect(state.top, `${description}: top`).toBeGreaterThanOrEqual(-1);
  expect(state.rightGap, `${description}: right`).toBeGreaterThanOrEqual(-1);
  expect(state.bottomGap, `${description}: bottom`).toBeGreaterThanOrEqual(-1);
  expect(state.horizontalOverflow, `${description}: horizontal`).toBeLessThanOrEqual(1);
  expect(['auto', 'scroll'], `${description}: vertical scroll contract`).toContain(state.overflowY);
};

const expectVisibleItemsFit = async (items: Locator, description: string) => {
  const states = await items.evaluateAll((elements) =>
    elements.map((element) => ({
      text: element.textContent?.trim() ?? '',
      horizontal: element.scrollWidth - element.clientWidth,
      vertical: element.scrollHeight - element.clientHeight
    }))
  );

  expect(states.length, `${description}: 검사 대상`).toBeGreaterThan(0);
  for (const state of states) {
    expect(state.horizontal, `${description}: ${state.text}`).toBeLessThanOrEqual(1);
    expect(state.vertical, `${description}: ${state.text}`).toBeLessThanOrEqual(1);
  }
};

const expectArchifyViewportFit = async (content: FrameLocator, description: string) => {
  const fit = await content.locator('.diagram-container > svg').evaluate((svg) => {
    const rect = svg.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      rightGap: document.documentElement.clientWidth - rect.right,
      bottomGap: document.documentElement.clientHeight - rect.bottom,
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      documentOverflowY: document.documentElement.scrollHeight - document.documentElement.clientHeight
    };
  });

  expect(fit.left, `${description}: left`).toBeGreaterThanOrEqual(-1);
  expect(fit.top, `${description}: top`).toBeGreaterThanOrEqual(-1);
  expect(fit.rightGap, `${description}: right`).toBeGreaterThanOrEqual(-1);
  expect(fit.bottomGap, `${description}: bottom`).toBeGreaterThanOrEqual(-1);
  expect(fit.documentOverflowX, `${description}: iframe overflow x`).toBeLessThanOrEqual(1);
  expect(fit.documentOverflowY, `${description}: iframe overflow y`).toBeLessThanOrEqual(1);
};

const expectArchifyReady = async (
  container: Locator,
  mode: 'preview' | 'dialog',
  artifact: string,
  nodes: number,
  edges: number,
  description: string
) => {
  const embed = container.locator(`[data-archify-embed="${mode}"]`);
  await embed.scrollIntoViewIfNeeded();
  await expect(embed).toHaveAttribute('data-archify-state', 'ready', { timeout: 15_000 });

  const frame = embed.locator(`[data-archify-frame="${mode}"]`);
  await expect(frame).toHaveAttribute('src', artifact);
  const content = frame.contentFrame();
  await expect(content.locator('g[data-node-id]')).toHaveCount(nodes);
  await expect(content.locator('path[data-edge-id]')).toHaveCount(edges);
  await expect(content.locator('[data-legend]')).toBeHidden();
  await expectArchifyViewportFit(content, description);
  await expectContainerFits(embed, `${description}: embed`);
};

const expectInsightVisual = async (page: Page, title: string, width: number) => {
  const trigger = page.getByRole('button', { name: `${title} 크게 보기`, exact: true });
  const figure = trigger.locator('xpath=ancestor::figure[1]');
  const preview = figure.locator('[data-insight-visual="before-after"]');

  await expect(preview).toHaveCount(1);
  await expectVisibleItemsFit(
    preview.locator('[data-insight-actor], [data-insight-connection]'),
    `${title} @ ${width}px preview`
  );
  await expectContainerFits(figure, `${title} @ ${width}px preview figure`);

  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: title, exact: true })).toBeVisible();
  const dialogVisual = dialog.locator('[data-insight-visual="before-after"]');
  await expect(dialogVisual).toHaveCount(1);
  await expectVisibleItemsFit(
    dialogVisual.locator('[data-insight-actor], [data-insight-connection]'),
    `${title} @ ${width}px dialog`
  );
  await expectDialogContained(page, dialog, `${title} @ ${width}px dialog`);
  await expectNoDocumentOverflow(page, `${title} @ ${width}px dialog document`);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
};

test.describe('행사 호텔 예약·결제 통합 플랫폼 구조화 상세', () => {
  test('목록·작업물·canonical 세 글을 키보드로 왕복하고 legacy BFF 주소는 308로 이동한다', async ({
    page,
    request
  }) => {
    const aliasResponse = await request.get(ALIAS_PATH, { maxRedirects: 0 });
    expect(aliasResponse.status()).toBe(308);
    expect(aliasResponse.headers().location).toBe(INSIGHTS[1].path);

    await page.goto('/insights');
    for (const insight of INSIGHTS) {
      await expect(page.locator(`a[href="${insight.path}"]`)).toHaveCount(1);
    }
    await expect(page.locator(`a[href="${ALIAS_PATH}"]`)).toHaveCount(0);

    await page.goto('/projects');
    const projectListLink = page.locator(`a[href="${PROJECT_PATH}"]`).first();
    await projectListLink.focus();
    await expect(projectListLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${PROJECT_PATH}$`));
    await expect(page.getByRole('heading', { level: 1, name: PROJECT_TITLE, exact: true })).toBeVisible();
    await expect(page.getByText(PROJECT_STATUS, { exact: true })).toBeVisible();

    for (const insight of INSIGHTS) {
      await page.goto(PROJECT_PATH);
      const insightLink = page.locator(`a[href="${insight.path}"]`).first();
      await expect(insightLink).toContainText(insight.title);
      await insightLink.focus();
      await expect(insightLink).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`${insight.path}$`));
      await expect(page.getByRole('heading', { level: 1, name: insight.title, exact: true })).toBeVisible();

      const sourceLink = page.locator(`a[href="${PROJECT_PATH}"]`).first();
      await expect(sourceLink).toContainText(PROJECT_TITLE);
      await sourceLink.focus();
      await expect(sourceLink).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`${PROJECT_PATH}$`));
    }

    await page.goto(ALIAS_PATH);
    await expect(page).toHaveURL(new RegExp(`${INSIGHTS[1].path}$`));
    await expect(page.getByRole('heading', { level: 1, name: INSIGHTS[1].title, exact: true })).toBeVisible();
  });

  for (const width of [320, 768, 1024, 1440]) {
    test(`${width}px에서 작업물 두 visual과 인사이트 두 visual의 preview·Dialog가 잘리지 않는다`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width, height: 900 });
      await page.goto(PROJECT_PATH);
      await expectNoDocumentOverflow(page, `project @ ${width}px`);

      const workflowTrigger = page.getByRole('button', { name: `${WORKFLOW_TITLE} 크게 보기`, exact: true });
      const workflowCard = workflowTrigger.locator('xpath=ancestor::article[@data-swimlane-card]');
      await workflowCard.scrollIntoViewIfNeeded();
      await expectArchifyReady(workflowCard, 'preview', WORKFLOW_ARTIFACT, 9, 8, `workflow @ ${width}px preview`);
      await workflowTrigger.click();
      const workflowDialog = page.getByRole('dialog');
      await expectArchifyReady(workflowDialog, 'dialog', WORKFLOW_ARTIFACT, 9, 8, `workflow @ ${width}px dialog`);
      await expectDialogContained(page, workflowDialog, `workflow @ ${width}px dialog`);
      await page.keyboard.press('Escape');
      await expect(workflowDialog).toBeHidden();
      await expect(workflowTrigger).toBeFocused();

      const relationshipTrigger = page.getByRole('button', {
        name: `${RELATIONSHIP_TITLE} 크게 보기`,
        exact: true
      });
      const relationshipCard = relationshipTrigger.locator('xpath=ancestor::article[@data-relationship-diagram]');
      await relationshipCard.scrollIntoViewIfNeeded();
      await expectArchifyReady(
        relationshipCard,
        'preview',
        RELATIONSHIP_ARTIFACT,
        6,
        6,
        `relationship @ ${width}px preview`
      );
      await relationshipTrigger.click();
      const relationshipDialog = page.getByRole('dialog');
      await expectArchifyReady(
        relationshipDialog,
        'dialog',
        RELATIONSHIP_ARTIFACT,
        6,
        6,
        `relationship @ ${width}px dialog`
      );
      await expectDialogContained(page, relationshipDialog, `relationship @ ${width}px dialog`);
      await page.keyboard.press('Escape');
      await expect(relationshipDialog).toBeHidden();
      await expect(relationshipTrigger).toBeFocused();
      await expectNoDocumentOverflow(page, `project dialogs @ ${width}px`);

      for (const insight of INSIGHTS.slice(0, 2)) {
        await page.goto(insight.path);
        await expectNoDocumentOverflow(page, `${insight.path} @ ${width}px`);
        expect(insight.visualTitle, `${insight.path}: visual title`).not.toBeNull();
        if (!insight.visualTitle) continue;
        await expectInsightVisual(page, insight.visualTitle, width);
      }

      await page.goto(INSIGHTS[2].path);
      await expect(page.locator('[data-insight-visual]')).toHaveCount(0);
      await expect(page.getByRole('button', { name: /크게 보기/ })).toHaveCount(0);
      await expectNoDocumentOverflow(page, `${INSIGHTS[2].path} @ ${width}px`);
    });
  }
});
