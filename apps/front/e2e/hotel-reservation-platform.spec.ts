import { expect, test, type Locator, type Page } from '@playwright/test';

const ROUTES = [
  {
    path: '/projects/hotel-reservation-platform',
    heading: '호텔 예약 시스템 플랫폼화 및 구조 고도화',
    visualSelector: '[data-swimlane-preview]',
    question: '변경의 성격에 따라 코드를 배치하고 플랫폼별로 검증·배포하며'
  },
  {
    path: '/insights/config-driven-architecture-react',
    heading: 'Config 이후의 경계: 멀티플랫폼 React를 core·rsConfig·platform으로 나눈 이유',
    visualSelector: '[data-insight-visual="data-flow"]',
    question: '공통 동작, 값 차이, 화면·로직 차이는 각각 어디에 배치할 것인가?'
  },
  {
    path: '/insights/context-api-encapsulation-and-router-level-isolation',
    heading: 'Props Drilling을 줄이기 위해 예약 Context의 생명주기를 라우터에 둔 이유',
    visualSelector: '[data-insight-visual="before-after"]',
    question: '예약 단계가 공유하는 상태의 소유 범위와 전달 경로를 어디에 둘 것인가?'
  }
] as const;

const expectNoDocumentOverflow = async (page: Page, description: string) => {
  const overflow = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));

  expect(overflow.documentWidth, description).toBeLessThanOrEqual(overflow.viewportWidth + 1);
};

const expectVisibleItemsFit = async (items: Locator, description: string) => {
  const states = await items.evaluateAll((elements) =>
    elements.map((element) => ({
      text: element.textContent?.trim() ?? '',
      clippedHorizontally: element.scrollWidth > element.clientWidth + 1,
      clippedVertically: element.scrollHeight > element.clientHeight + 1
    }))
  );

  expect(states.length, `${description}: 검사 대상`).toBeGreaterThan(0);
  for (const state of states) {
    expect(state.clippedHorizontally, `${description}: ${state.text}`).toBe(false);
    expect(state.clippedVertically, `${description}: ${state.text}`).toBe(false);
  }
};

const expectNoPairwiseOverlap = async (items: Locator, description: string) => {
  const boxes = await items.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    })
  );

  for (let leftIndex = 0; leftIndex < boxes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < boxes.length; rightIndex += 1) {
      const left = boxes[leftIndex];
      const right = boxes[rightIndex];
      const overlapWidth = Math.min(left.right, right.right) - Math.max(left.left, right.left);
      const overlapHeight = Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top);

      expect(overlapWidth > 1 && overlapHeight > 1, `${description}: ${leftIndex}-${rightIndex}`).toBe(false);
    }
  }
};

test.describe('호텔 예약 플랫폼 작업물과 인사이트 시각 계약', () => {
  for (const fixture of ROUTES) {
    test(`${fixture.path}는 질문이 다른 시각 자료 하나만 제공한다`, async ({ page }) => {
      const response = await page.goto(fixture.path);

      expect(response?.ok(), fixture.path).toBe(true);
      await expect(page.getByRole('heading', { level: 1, name: fixture.heading, exact: true })).toBeVisible();
      await expect(page.locator(fixture.visualSelector)).toHaveCount(1);
      await expect(page.getByText(fixture.question, { exact: false }).first()).toBeVisible();
    });
  }

  test('두 인사이트는 NICEPAY 전용 visual을 추가하지 않는다', async ({ page }) => {
    for (const fixture of ROUTES.slice(1)) {
      await page.goto(fixture.path);
      await expect(page.locator('[data-insight-visual]')).toHaveCount(1);
      await expect(page.locator('figure').filter({ hasText: /NICEPAY|결제 복귀/ })).toHaveCount(0);
    }
  });

  for (const width of [320, 768, 1024, 1440]) {
    test(`${width}px에서 세 화면의 시각 자료가 문서 폭과 요소 경계를 넘지 않는다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });

      for (const fixture of ROUTES) {
        await page.goto(fixture.path);
        await expect(page.getByRole('heading', { level: 1, name: fixture.heading, exact: true })).toBeVisible();
        await expect(page.locator(fixture.visualSelector)).toBeVisible();
        await expectNoDocumentOverflow(page, `${fixture.path} @ ${width}px`);

        if (fixture.path.startsWith('/insights/')) {
          const visual = page.locator(fixture.visualSelector);
          await expectVisibleItemsFit(
            visual.locator('[data-insight-node], [data-insight-edge], [data-insight-actor], [data-insight-connection]'),
            `${fixture.path} @ ${width}px`
          );

          if (fixture.visualSelector.includes('data-flow')) {
            await expectNoPairwiseOverlap(visual.locator('[data-insight-node]'), `${fixture.path}: nodes @ ${width}px`);
            await expectNoPairwiseOverlap(visual.locator('[data-insight-edge]'), `${fixture.path}: edges @ ${width}px`);
          } else {
            for (const panel of await visual.locator('[data-insight-panel]').all()) {
              await expectNoPairwiseOverlap(
                panel.locator('[data-insight-actor]'),
                `${fixture.path}: actors @ ${width}px`
              );
              await expectNoPairwiseOverlap(
                panel.locator('[data-insight-connection]'),
                `${fixture.path}: connections @ ${width}px`
              );
            }
          }
        }
      }
    });
  }
});
