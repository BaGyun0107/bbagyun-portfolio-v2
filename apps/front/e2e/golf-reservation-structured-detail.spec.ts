import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test';

const PROJECT_LIST_PATH = '/projects';
const SIENA_PROJECT_PATH = '/projects/the-siena-golf-reservation';
const LOGGING_INSIGHT_PATH = '/insights/logging-decoupling-and-buffering-in-external-api-systems';
const SIENA_PROJECT_TITLE = '골프 예약 시스템 구축';
const LOGGING_INSIGHT_TITLE = '로그는 남기는 것보다 조회할 수 있어야 한다: 외부 API 로그 분리기';
const SIENA_FLOW_TITLE = '예약 요청·중복 방어·외부 장애 안내 흐름';
const SIENA_ARTIFACT_URL = '/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html';

const CORE_EDGE_IDS = [
  'check-duplicate-call-pms',
  'check-duplicate-stop',
  'pms-5xx-guide-retry',
  'pms-timeout-guide-congestion',
  'process-reservation-complete-user-feedback'
];

const expectNoDocumentOverflow = async (page: Page, description: string) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );

  expect(overflow, description).toBeLessThanOrEqual(1);
};

const expectSienaEmbedReady = async (container: Locator, mode: 'preview' | 'dialog') => {
  const embed = container.locator(`[data-archify-swimlane="${mode}"]`);

  await expect(embed).toHaveAttribute('data-archify-state', 'ready', { timeout: 15_000 });
  const frame = embed.locator(`[data-archify-frame="${mode}"]`);
  await expect(frame).toHaveAttribute('src', SIENA_ARTIFACT_URL, { timeout: 15_000 });

  return { embed, frame, content: frame.contentFrame() };
};

const expectCoreDiagramGeometry = async (content: FrameLocator, description: string) => {
  const geometry = await content.locator('.diagram-container > svg').evaluate(
    (svg, { edgeIds }) => {
      const container = svg.getBoundingClientRect();
      const nodeBoxes: Array<{ id: string; box: DOMRect }> = [];
      const missing: string[] = [];
      const outside: string[] = [];
      const overlaps: string[] = [];
      const isInside = (box: DOMRect) =>
        box.left >= container.left - 1 &&
        box.right <= container.right + 1 &&
        box.top >= container.top - 1 &&
        box.bottom <= container.bottom + 1;
      const intersects = (left: DOMRect, right: DOMRect) =>
        Math.min(left.right, right.right) - Math.max(left.left, right.left) > 1 &&
        Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > 1;

      for (const node of svg.querySelectorAll<SVGGElement>('[data-node-id]')) {
        const nodeId = node.getAttribute('data-node-id') ?? 'missing-node-id';
        const nodeShape = node?.querySelector<SVGGraphicsElement>('rect:not(.c-mask), polygon:not(.c-mask)');
        if (!nodeShape) {
          missing.push(`node:${nodeId}`);
          continue;
        }

        const box = nodeShape.getBoundingClientRect();
        nodeBoxes.push({ id: nodeId, box });
        if (!isInside(box)) outside.push(`node:${nodeId}`);
      }

      for (const edgeId of edgeIds) {
        const labelGroup = svg.querySelector<SVGGElement>(`g[data-edge-id="${edgeId}"][data-edge-label]`);
        const labelText = labelGroup?.querySelector<SVGTextElement>('text');
        const labelMask = labelGroup?.querySelector<SVGRectElement>('rect.c-mask');
        if (!labelGroup || !labelText || !labelMask) {
          missing.push(`label:${edgeId}`);
          continue;
        }

        const box = labelGroup.getBoundingClientRect();
        if (!isInside(box)) outside.push(`label:${edgeId}`);
        for (const node of nodeBoxes) {
          if (intersects(box, node.box)) overlaps.push(`${edgeId}:${node.id}`);
        }
      }

      return { missing, outside, overlaps };
    },
    { edgeIds: CORE_EDGE_IDS }
  );

  expect(geometry.missing, `${description}: 9개 node와 핵심 label visual group 존재`).toEqual([]);
  expect(geometry.outside, `${description}: 핵심 label visual group container 내부`).toEqual([]);
  expect(geometry.overlaps, `${description}: 5개 edge label visual group이 9개 node 위를 침범하지 않음`).toEqual([]);
};

test.describe('골프 예약 구조화 상세 browser 계약', () => {
  test('목록에서 골프 작업물과 로그 인사이트를 키보드로 왕복하고 기존 slug는 200을 반환한다', async ({ page }) => {
    for (const path of [PROJECT_LIST_PATH, SIENA_PROJECT_PATH, LOGGING_INSIGHT_PATH]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
    }

    await page.goto(PROJECT_LIST_PATH);
    const projectLink = page.locator(`a[href="${SIENA_PROJECT_PATH}"]`).first();
    await expect(projectLink).toContainText(SIENA_PROJECT_TITLE);
    await projectLink.focus();
    await expect(projectLink).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(new RegExp(`${SIENA_PROJECT_PATH}$`));
    await expect(page.getByRole('heading', { level: 1, name: SIENA_PROJECT_TITLE, exact: true })).toBeVisible();

    const insightLink = page.locator(`a[href="${LOGGING_INSIGHT_PATH}"]`).first();
    await expect(insightLink).toContainText(LOGGING_INSIGHT_TITLE);
    await insightLink.focus();
    await expect(insightLink).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(new RegExp(`${LOGGING_INSIGHT_PATH}$`));
    await expect(page.getByRole('heading', { level: 1, name: LOGGING_INSIGHT_TITLE, exact: true })).toBeVisible();

    const sourceLink = page.locator(`a[href="${SIENA_PROJECT_PATH}"]`).first();
    await expect(sourceLink).toContainText(SIENA_PROJECT_TITLE);
    await sourceLink.focus();
    await expect(sourceLink).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(new RegExp(`${SIENA_PROJECT_PATH}$`));
    await expect(page.getByRole('heading', { level: 1, name: SIENA_PROJECT_TITLE, exact: true })).toBeVisible();
  });

  for (const width of [320, 768, 1024, 1440]) {
    test(`${width}px에서 Siena preview/dialog 흐름·핵심 geometry·Escape focus 복귀를 보장한다`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width, height: 900 });
      await page.goto(SIENA_PROJECT_PATH);

      await expect(page.getByRole('heading', { level: 1, name: SIENA_PROJECT_TITLE, exact: true })).toBeVisible();
      await expectNoDocumentOverflow(page, `${width}px project document overflow`);

      const trigger = page.getByRole('button', { name: `${SIENA_FLOW_TITLE} 크게 보기`, exact: true });
      const card = trigger.locator('xpath=ancestor::article[@data-swimlane-card]');
      const preview = card.locator('[data-archify-swimlane="preview"]');
      await preview.scrollIntoViewIfNeeded();

      const previewArtifact = await expectSienaEmbedReady(card, 'preview');
      await expect(previewArtifact.content.locator('g[data-node-id]')).toHaveCount(9);
      await expect(previewArtifact.content.locator('path[data-edge-id]')).toHaveCount(10);
      await expectCoreDiagramGeometry(previewArtifact.content, `${width}px preview`);
      expect(await card.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);

      await trigger.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('heading', { name: `${SIENA_FLOW_TITLE} 크게 보기`, exact: true })).toBeVisible();
      const dialogArtifact = await expectSienaEmbedReady(dialog, 'dialog');
      await expect(dialogArtifact.content.locator('.diagram-container')).toHaveAttribute('data-detail-level', 'read');
      await expect(dialogArtifact.content.locator('g[data-node-id]')).toHaveCount(9);
      await expect(dialogArtifact.content.locator('path[data-edge-id]')).toHaveCount(10);
      await expectCoreDiagramGeometry(dialogArtifact.content, `${width}px dialog`);
      expect(await dialog.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
      await expectNoDocumentOverflow(page, `${width}px dialog document overflow`);

      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    });
  }
});
