import { expect, test, type Locator } from '@playwright/test';

const PROJECT_PATH = '/projects/hipass-b2b-platform';
const SETTLEMENT_PATH = '/insights/json-outbox-pattern-for-settlement';
const SOCKET_PATH = '/insights/socketio-realtime-architecture-and-reliability';

const SETTLEMENT_TITLE = '정산 상태는 DB에, 재처리 입력은 JSON에 둔 이유';
const SOCKET_TITLE = '공용 Room에서 화원별 User Room으로: 전달 범위와 전달 보장은 다르다';

const expectNoPairwiseOverlap = async (locator: Locator, description: string) => {
  const boxes = await locator.evaluateAll((elements) =>
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

test.describe('하이패스 구조화 상세와 인사이트 시각 자료', () => {
  test('세 route는 서로 다른 질문을 답하는 시각 자료를 하나씩 제공한다', async ({ page }) => {
    await page.goto(PROJECT_PATH);
    await expect(page.locator('[data-swimlane-card]')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: '주문·결제·보상 취소 흐름', exact: true })).toBeVisible();

    await page.goto(SETTLEMENT_PATH);
    await expect(page.getByRole('heading', { name: SETTLEMENT_TITLE, exact: true })).toBeVisible();
    await expect(page.locator('[data-insight-visual="data-flow"]')).toHaveCount(1);
    await expect(
      page.getByText('지급 판단 상태와 재처리 입력은 어디에 있고 성공·실패 뒤 어떻게 바뀌는가?', {
        exact: true
      })
    ).toBeVisible();
    await expect(page.getByText(/DB의 PROCESSING 상태를 확인한 뒤 JSON 지급 입력/)).toBeVisible();

    await page.goto(SOCKET_PATH);
    await expect(page.getByRole('heading', { name: SOCKET_TITLE, exact: true })).toBeVisible();
    await expect(page.locator('[data-insight-visual="before-after"]')).toHaveCount(1);
    await expect(
      page.getByText('공용 Room에서 화원별 User Room으로 바꾸자 주문 이벤트의 수신 대상은 어떻게 달라졌는가?', {
        exact: true
      })
    ).toBeVisible();
    await expect(page.getByText(/변경 전에는 서버가 공용 Room을 통해/)).toBeVisible();
  });

  test('typed visual이 없는 기존 인사이트에는 빈 시각 자료 영역을 만들지 않는다', async ({ page }) => {
    await page.goto('/insights/https-and-plaintext-password-transmission');

    await expect(page.locator('[data-insight-visual]')).toHaveCount(0);
    await expect(
      page.getByRole('heading', {
        name: '구글과 네이버는 왜 비밀번호를 평문으로 보낼까? (개발자 도구의 착시와 HTTPS의 진실)'
      })
    ).toBeVisible();
  });

  for (const width of [320, 768, 1024, 1440]) {
    for (const target of [
      { path: PROJECT_PATH, type: 'project' },
      { path: SETTLEMENT_PATH, type: 'data-flow' },
      { path: SOCKET_PATH, type: 'before-after' }
    ] as const) {
      test(`${target.type}는 ${width}px에서 넘침과 요소 겹침이 없다`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(target.path);
        await expect(page.locator('main')).toBeVisible();

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(overflow, `${target.path}: document overflow`).toBeLessThanOrEqual(1);

        if (target.type === 'project') {
          const preview = page.locator('[data-archify-swimlane="preview"]');
          await preview.scrollIntoViewIfNeeded();
          await expect(preview).toHaveAttribute('data-archify-state', 'ready', { timeout: 15_000 });
          return;
        }

        const visual = page.locator(`[data-insight-visual="${target.type}"]`);
        await expect(visual).toBeVisible();
        expect(await visual.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);

        if (target.type === 'data-flow') {
          await expectNoPairwiseOverlap(visual.locator('[data-insight-node]'), `${target.path}: nodes`);
          await expectNoPairwiseOverlap(visual.locator('[data-insight-edge]'), `${target.path}: edges`);
        } else {
          for (const panel of await visual.locator('[data-insight-panel]').all()) {
            await expectNoPairwiseOverlap(panel.locator('[data-insight-actor]'), `${target.path}: actors`);
            await expectNoPairwiseOverlap(panel.locator('[data-insight-connection]'), `${target.path}: connections`);
          }
        }
      });
    }
  }
});
