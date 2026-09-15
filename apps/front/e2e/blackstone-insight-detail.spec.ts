import { expect, test } from '@playwright/test';

const BLACKSTONE_PATH = '/projects/blackstone-belleforet-resort';
const BLACKSTONE_INSIGHT_PATH = '/insights/spa-api-key-exposure-and-bff-architecture';
const BLACKSTONE_INSIGHT_TITLE = 'React API Key 노출을 서버 경계로 옮기며 배운 BFF의 필요성';

test.describe('블랙스톤 API Key·BFF 인사이트', () => {
  test('당시 Proxy와 현재 BFF 판단을 구분하고 작업물로 돌아갈 수 있다', async ({ page }) => {
    await page.goto(BLACKSTONE_INSIGHT_PATH);

    await expect(page.getByRole('heading', { name: BLACKSTONE_INSIGHT_TITLE, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: '당시에는 모든 요청을 PHP Proxy 뒤로 옮겼다' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '외부 API라면 모두 BFF가 필요한가' })).toBeVisible();
    await expect(page.getByText('제3자가 키를 악용한 일은 없었습니다', { exact: false })).toBeVisible();
    await expect(page.getByText('당시 구현을 BFF였다고 소급해 부르지는 않습니다', { exact: false })).toBeVisible();

    const sourceLink = page.locator(`a[href="${BLACKSTONE_PATH}"]`).first();
    await expect(sourceLink).toBeVisible();
    await sourceLink.focus();
    await expect(sourceLink).toBeFocused();
  });

  for (const width of [320, 768, 1024, 1440]) {
    test(`${width}px에서 전체 본문과 긴 제목에 가로 넘침이 없다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(BLACKSTONE_INSIGHT_PATH);
      await expect(page.getByRole('heading', { name: BLACKSTONE_INSIGHT_TITLE, exact: true })).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );

      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
