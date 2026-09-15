import { expect, test, type Locator } from '@playwright/test';

const ARCHIFY_PROJECT_PATH = '/projects/hotel-reservation-platform';
const ARCHIFY_ARTIFACT_URL = '/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html';
const ARCHIFY_DIALOG_TARGETS = [
  {
    path: '/projects/codi-harness-dx-platform',
    title: '설계·개발·검증',
    url: '/diagrams/codi-harness-dx-platform/design-development-verification.html',
    aspectRatio: 869 / 836
  },
  {
    path: '/projects/codi-harness-dx-platform',
    title: 'CI/CD·시크릿·배포',
    url: '/diagrams/codi-harness-dx-platform/cicd-secrets-deployment.html',
    aspectRatio: 866 / 836
  },
  {
    path: '/projects/hanmaum-science-institute',
    title: '원문 적재와 실패 복구',
    url: '/diagrams/hanmaum-science-institute/ingestion-and-recovery.html',
    aspectRatio: 805 / 836
  },
  {
    path: '/projects/hanmaum-science-institute',
    title: '검색 요청 처리',
    url: '/diagrams/hanmaum-science-institute/search-request-flow.html',
    aspectRatio: 901 / 528
  },
  {
    path: '/projects/blackstone-belleforet-resort',
    title: '결제·보상취소 흐름',
    url: '/diagrams/blackstone-belleforet-resort/payment-and-compensation.html',
    aspectRatio: 945 / 1076
  },
  {
    path: '/projects/hipass-b2b-platform',
    title: '주문·결제·보상 취소 흐름',
    url: '/diagrams/hipass-b2b-platform/order-payment-compensation.html',
    aspectRatio: 937 / 836
  },
  {
    path: '/projects/hotel-reservation-platform',
    title: '플랫폼 변경·검증·배포 흐름',
    url: '/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html',
    aspectRatio: 1085 / 528
  },
  {
    path: '/projects/integrated-sso-server',
    title: '중앙 회원 인증과 서비스 로컬 검증',
    url: '/diagrams/integrated-sso-server/central-account-auth-flow.html',
    aspectRatio: 930 / 1316
  },
  {
    path: '/projects/integrated-reservation-platform',
    title: '고객사 UAT 예약·결제 흐름',
    url: '/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html',
    aspectRatio: 966 / 786
  },
  {
    path: '/projects/the-siena-golf-reservation',
    title: '예약 요청·중복 방어·외부 장애 안내 흐름',
    url: '/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html',
    aspectRatio: 1362 / 652
  }
] as const;

async function expectArchifyReady(page: import('@playwright/test').Page, mode: 'preview' | 'dialog') {
  const embed = page.locator(`[data-archify-swimlane="${mode}"]`);
  await expect(embed).toHaveAttribute('data-archify-state', 'ready');
  const frame = embed.locator(`[data-archify-frame="${mode}"]`);
  await expect(frame).toHaveAttribute('src', ARCHIFY_ARTIFACT_URL);
  return { embed, frame, content: frame.contentFrame() };
}

async function expectTargetArchifyReady(container: Locator, mode: 'preview' | 'dialog', url: string) {
  const embed = container.locator(`[data-archify-swimlane="${mode}"]`);
  await expect(embed).toHaveAttribute('data-archify-state', 'ready', { timeout: 15_000 });
  const frame = embed.locator(`[data-archify-frame="${mode}"]`);
  await expect(frame).toHaveAttribute('src', url, { timeout: 15_000 });
  return { embed, frame, content: frame.contentFrame() };
}

test.describe('공통 반응형 스윔레인 뷰어', () => {
  for (const width of [320, 768, 1024, 1440]) {
    test(`${width}px에서 열 개 Archify preview가 card와 문서를 가로 넘침 없이 유지한다`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width, height: 900 });

      for (const target of ARCHIFY_DIALOG_TARGETS) {
        await page.goto(target.path);
        const trigger = page.getByRole('button', { name: `${target.title} 크게 보기`, exact: true });
        const card = trigger.locator('xpath=ancestor::article[@data-swimlane-card]');
        const preview = card.locator('[data-archify-swimlane="preview"]');

        await preview.scrollIntoViewIfNeeded();
        const previewArtifact = await expectTargetArchifyReady(card, 'preview', target.url);
        await expect(previewArtifact.content.locator('[data-legend]')).toBeHidden();
        const previewViewport = await previewArtifact.content.locator('.diagram-container > svg').evaluate((svg) => {
          const bounds = svg.getBoundingClientRect();
          return {
            width: bounds.width,
            height: bounds.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight
          };
        });
        expect(Math.abs(previewViewport.width - previewViewport.viewportWidth)).toBeLessThanOrEqual(1);
        expect(Math.abs(previewViewport.height - previewViewport.viewportHeight)).toBeLessThanOrEqual(1);
        await expect(card.locator('[data-swimlane-line-legend]')).toBeVisible();
        expect(
          await card.evaluate((element) => element.scrollWidth - element.clientWidth),
          target.title
        ).toBeLessThanOrEqual(1);

        expect(
          await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
          target.title
        ).toBeLessThanOrEqual(1);
      }
    });
  }

  test('hover가 아닌 명시적 클릭으로 같은 흐름을 열고 Escape 뒤 trigger로 복귀한다', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/projects/codi-harness-dx-platform');

    const cards = page.locator('[data-swimlane-card]');
    await expect(cards).toHaveCount(2);

    for (const target of ARCHIFY_DIALOG_TARGETS.filter(
      (target) => target.path === '/projects/codi-harness-dx-platform'
    )) {
      const card = page
        .getByRole('button', { name: `${target.title} 크게 보기`, exact: true })
        .locator('xpath=ancestor::article');
      const trigger = card.locator('[data-swimlane-expand]');
      const preview = card.locator('[data-archify-swimlane="preview"]');

      await trigger.hover();
      await expect(page.getByRole('dialog')).toHaveCount(0);

      await preview.scrollIntoViewIfNeeded();
      await expectTargetArchifyReady(card, 'preview', target.url);

      await trigger.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expectTargetArchifyReady(dialog, 'dialog', target.url);
      await expect(dialog.getByRole('heading')).toBeVisible();
      await expect(dialog.locator('[data-slot="dialog-description"]')).toBeVisible();
      const dialogBox = await dialog.boundingBox();
      expect(dialogBox?.width).toBeGreaterThanOrEqual(1440 * 0.8);

      const dialogOverflow = await dialog.evaluate((element) => element.scrollWidth - element.clientWidth);
      expect(dialogOverflow).toBeLessThanOrEqual(1);

      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    }
  });

  test('모바일에서 크게 보기 버튼을 tap으로 실행한다', async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: true, viewport: { width: 375, height: 812 } });
    const page = await context.newPage();

    try {
      await page.goto(ARCHIFY_PROJECT_PATH);
      const trigger = page.locator('[data-swimlane-expand]');
      await trigger.tap();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.locator('[data-archify-swimlane="dialog"]')).toHaveCount(1);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(trigger).toBeFocused();
    } finally {
      await context.close();
    }
  });

  test('키보드 Enter와 Space로 크게 보기를 실행한다', async ({ page }) => {
    for (const key of ['Space', 'Enter']) {
      await page.goto('/projects/integrated-sso-server');
      const trigger = page.locator('[data-swimlane-expand]');
      const card = trigger.locator('xpath=ancestor::article[@data-swimlane-card]');
      const preview = card.locator('[data-archify-swimlane="preview"]');
      await preview.scrollIntoViewIfNeeded();
      await expectTargetArchifyReady(card, 'preview', '/diagrams/integrated-sso-server/central-account-auth-flow.html');
      await trigger.focus();
      await page.keyboard.press(key);
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
  });

  test('호텔 스윔레인은 viewport 접근 뒤 MAP을 만들고 Dialog에서 같은 artifact의 READ를 연다', async ({ page }) => {
    await page.route(`**${ARCHIFY_ARTIFACT_URL}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.continue();
    });
    await page.setViewportSize({ width: 1024, height: 480 });
    await page.goto(ARCHIFY_PROJECT_PATH);

    const preview = page.locator('[data-archify-swimlane="preview"]');
    await expect(preview).toHaveCount(1);
    await expect(page.locator('[data-archify-frame="preview"]')).toHaveCount(0);
    await expect(page.locator('[data-archify-frame="dialog"]')).toHaveCount(0);
    await expect(
      page.locator(`a[href="${ARCHIFY_ARTIFACT_URL}"]`),
      '별도 Archify action을 다시 노출하지 않는다.'
    ).toHaveCount(0);

    await preview.scrollIntoViewIfNeeded();
    await expect(preview).toHaveAttribute('data-archify-state', 'loading');
    const loadingBox = await preview.boundingBox();
    const previewArtifact = await expectArchifyReady(page, 'preview');
    const readyBox = await preview.boundingBox();
    if (!loadingBox || !readyBox) throw new Error('Archify preview 영역을 찾을 수 없습니다.');
    expect(Math.abs(loadingBox.height - readyBox.height)).toBeLessThanOrEqual(1);
    expect(readyBox.y + readyBox.height).toBeGreaterThan(0);
    expect(readyBox.y).toBeLessThan(480);
    await expect(previewArtifact.content.locator('.diagram-container')).toHaveAttribute('data-detail-level', 'map');
    const previewContext = previewArtifact.content.locator('[data-detail="context"]');
    expect(await previewContext.count()).toBeGreaterThan(0);
    await expect(previewContext.first()).toHaveCSS('opacity', '0');
    await expect(previewArtifact.content.locator('.toolbar')).toBeHidden();

    await page.getByRole('button', { name: '플랫폼 변경·검증·배포 흐름 크게 보기' }).click();
    const dialogArtifact = await expectArchifyReady(page, 'dialog');
    await expect(dialogArtifact.content.locator('.diagram-container')).toHaveAttribute('data-detail-level', 'read');
    await expect(dialogArtifact.content.locator('[data-detail="context"]').first()).toHaveCSS('opacity', '1');
    expect(await dialogArtifact.frame.getAttribute('src')).toBe(await previewArtifact.frame.getAttribute('src'));
  });

  test('embedded Archify viewer는 포커스·포인터·단축키를 받지 않고 theme만 reload 없이 동기화한다', async ({
    page
  }) => {
    await page.goto(ARCHIFY_PROJECT_PATH);
    const preview = page.locator('[data-archify-swimlane="preview"]');
    await preview.scrollIntoViewIfNeeded();
    const { frame, content } = await expectArchifyReady(page, 'preview');

    await expect(frame).toHaveAttribute('tabindex', '-1');
    await expect(frame).toHaveCSS('pointer-events', 'none');
    await expect(content.locator('body')).toHaveAttribute('inert', '');
    await expect(content.locator('.toolbar')).toBeHidden();
    expect(
      await content.locator('body').evaluate(
        (body) =>
          [...body.querySelectorAll<HTMLElement>('button, a, input, [tabindex]')].filter((element) => {
            const style = getComputedStyle(element);
            return (
              style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              element.getClientRects().length > 0 &&
              element.closest('[inert]') === null &&
              element.tabIndex >= 0
            );
          }).length
      )
    ).toBe(0);

    const readViewerState = () =>
      content.locator('html').evaluate((root) => {
        const diagram = root.querySelector<HTMLElement>('.diagram-container');
        return {
          theme: root.getAttribute('data-theme'),
          preset: root.getAttribute('data-preset'),
          motion: root.getAttribute('data-motion'),
          presentation: root.getAttribute('data-presentation'),
          detail: diagram?.getAttribute('data-detail-level'),
          camera: diagram?.getAttribute('data-camera-mode'),
          transform: diagram?.querySelector<SVGSVGElement>('svg')?.style.transform ?? '',
          activeTag: root.ownerDocument.activeElement?.tagName
        };
      });
    const readEmphasisColors = () =>
      content.locator('html').evaluate((root) => {
        const edge = root.querySelector<SVGPathElement>('path.a-emphasis[data-edge-id="verify-deploy"]');
        const label = root.querySelector<SVGTextElement>('g[data-edge-id="verify-deploy"] text');
        if (!edge || !label) throw new Error('강조 관계선 또는 라벨을 찾을 수 없습니다.');

        return {
          edge: getComputedStyle(edge).stroke,
          label: getComputedStyle(label).fill
        };
      });
    const beforeShortcut = await readViewerState();
    const initialEmphasisColors = await readEmphasisColors();
    expect(initialEmphasisColors.label).toBe(initialEmphasisColors.edge);
    await frame.hover({ force: true });
    const frameBox = await frame.boundingBox();
    if (!frameBox) throw new Error('Archify iframe 영역을 찾을 수 없습니다.');
    await page.mouse.click(frameBox.x + frameBox.width / 2, frameBox.y + frameBox.height / 2);
    for (const key of ['t', 'f', 'p', '/', '+', '-']) await page.keyboard.press(key);
    expect(await readViewerState()).toEqual(beforeShortcut);

    await page.locator('html').evaluate((root) => root.classList.remove('dark'));
    await expect
      .poll(() => content.locator('html').evaluate((root) => root.style.getPropertyValue('--bg').trim()))
      .toBe(
        await page.locator('html').evaluate((root) => getComputedStyle(root).getPropertyValue('--background').trim())
      );
    const lightEmphasisColors = await readEmphasisColors();
    expect(lightEmphasisColors.label).toBe(lightEmphasisColors.edge);
    await content.locator('html').evaluate((root) => root.setAttribute('data-e2e-document', 'stable'));

    await page.locator('html').evaluate((root) => root.classList.add('dark'));
    await expect
      .poll(() => content.locator('html').evaluate((root) => root.style.getPropertyValue('--bg').trim()))
      .toBe(
        await page.locator('html').evaluate((root) => getComputedStyle(root).getPropertyValue('--background').trim())
      );
    const darkEmphasisColors = await readEmphasisColors();
    expect(darkEmphasisColors.label).toBe(darkEmphasisColors.edge);
    await expect(content.locator('html')).toHaveAttribute('data-e2e-document', 'stable');
  });

  test('Siena viewer는 light/dark theme을 reload 없이 동기화하고 예약 성공 강조선과 label 색상을 함께 적용한다', async ({
    page
  }) => {
    const target = ARCHIFY_DIALOG_TARGETS.find(({ path }) => path === '/projects/the-siena-golf-reservation');
    if (!target) throw new Error('Siena Archify target을 찾을 수 없습니다.');

    await page.goto(target.path);
    const trigger = page.getByRole('button', { name: `${target.title} 크게 보기`, exact: true });
    const card = trigger.locator('xpath=ancestor::article[@data-swimlane-card]');
    const preview = card.locator('[data-archify-swimlane="preview"]');
    await preview.scrollIntoViewIfNeeded();
    const { content } = await expectTargetArchifyReady(card, 'preview', target.url);
    const readEmphasisColors = () =>
      content.locator('html').evaluate((root) => {
        const edge = root.querySelector<SVGPathElement>(
          'path.a-emphasis[data-edge-id="process-reservation-complete-user-feedback"]'
        );
        const label = root.querySelector<SVGTextElement>(
          'g[data-edge-id="process-reservation-complete-user-feedback"] text'
        );
        if (!edge || !label) throw new Error('Siena 예약 성공 강조선 또는 label을 찾을 수 없습니다.');

        return {
          edge: getComputedStyle(edge).stroke,
          label: getComputedStyle(label).fill
        };
      });

    const assertHostThemeSync = async () => {
      await expect
        .poll(() => content.locator('html').evaluate((root) => root.style.getPropertyValue('--bg').trim()))
        .toBe(
          await page.locator('html').evaluate((root) => getComputedStyle(root).getPropertyValue('--background').trim())
        );
      const colors = await readEmphasisColors();
      expect(colors.edge).not.toMatch(/^(?:none|transparent|rgba?\([^)]*,\s*0(?:\.0*)?\))$/i);
      expect(colors.label).toBe(colors.edge);
    };

    await page.locator('html').evaluate((root) => root.classList.remove('dark'));
    await assertHostThemeSync();
    await content.locator('html').evaluate((root) => root.setAttribute('data-e2e-document', 'siena-stable'));

    await page.locator('html').evaluate((root) => root.classList.add('dark'));
    await assertHostThemeSync();
    await expect(content.locator('html')).toHaveAttribute('data-e2e-document', 'siena-stable');
  });

  for (const width of [320, 768, 1024, 1440]) {
    test(`호텔 Archify ${width}px에서 card와 Dialog가 넘치거나 close와 겹치지 않는다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(ARCHIFY_PROJECT_PATH);

      const card = page.locator('[data-swimlane-card]');
      const preview = page.locator('[data-archify-swimlane="preview"]');
      const previewLegend = card.locator('[data-swimlane-line-legend]');
      await preview.scrollIntoViewIfNeeded();
      const previewArtifact = await expectArchifyReady(page, 'preview');
      await expect(previewArtifact.content.locator('.diagram-container > svg > g[data-node-id]')).toHaveCount(10);
      await expect(previewArtifact.content.locator('.diagram-container > svg > path[data-edge-id]')).toHaveCount(12);
      await expect(previewLegend).toBeVisible();
      await expect(previewLegend.locator('[data-swimlane-line-legend-item]')).toHaveCount(2);
      await expect(previewLegend).toContainText('일반 진행·검증 통과');
      await expect(previewLegend).toContainText('예외 발견·복구 및 재검증');
      expect(await card.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      ).toBeLessThanOrEqual(1);

      const trigger = page.getByRole('button', { name: '플랫폼 변경·검증·배포 흐름 크게 보기' });
      await trigger.click();
      const dialog = page.getByRole('dialog');
      const heading = dialog.getByRole('heading', {
        name: '플랫폼 변경·검증·배포 흐름 크게 보기',
        exact: true
      });
      const close = dialog.getByRole('button', { name: 'Close' });
      const dialogArtifact = await expectArchifyReady(page, 'dialog');
      const dialogLegend = dialog.locator('[data-swimlane-line-legend]');
      await expect(dialogArtifact.content.locator('[data-detail="context"]').first()).toHaveCSS('opacity', '1');
      await expect(dialogLegend).toBeVisible();
      await expect(dialogLegend.locator('[data-swimlane-line-legend-item]')).toHaveCount(2);
      const mobileTranscript = dialog.locator('[data-swimlane-mobile-transcript]');
      if (width < 1024) {
        await expect(mobileTranscript).toBeVisible();
        await expect(mobileTranscript.locator('[data-swimlane-transcript-step]')).toHaveCount(10);
        await expect(mobileTranscript.locator('[data-swimlane-transcript-edge]')).toHaveCount(6);
        await expect(mobileTranscript.locator('[data-swimlane-transcript-edge-kind="exception"]')).toHaveCount(2);
        await expect(mobileTranscript.getByText('예외·복구 흐름')).toHaveCount(2);
        await expect(mobileTranscript.locator('[data-swimlane-transcript-step]').first()).toHaveCSS(
          'font-size',
          '14px'
        );
      } else {
        await expect(mobileTranscript).toBeHidden();
      }
      const [headingBox, closeBox] = await Promise.all([heading.boundingBox(), close.boundingBox()]);
      if (!headingBox || !closeBox) throw new Error('Dialog 제목 또는 닫기 버튼 영역을 찾을 수 없습니다.');
      expect(
        headingBox.x < closeBox.x + closeBox.width &&
          headingBox.x + headingBox.width > closeBox.x &&
          headingBox.y < closeBox.y + closeBox.height &&
          headingBox.y + headingBox.height > closeBox.y
      ).toBe(false);
      expect(await dialog.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
      if (width < 1024) {
        const lastRelationship = mobileTranscript.locator('[data-swimlane-transcript-edge]').last();
        await lastRelationship.scrollIntoViewIfNeeded();
        await expect(lastRelationship).toBeVisible();
        await expect(lastRelationship).toHaveCSS('font-size', '14px');
      }

      await close.click();
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    });
  }

  test('artifact DOM이 잘못되면 기존 React 흐름으로 복구한다', async ({ page }) => {
    await page.route(`**${ARCHIFY_ARTIFACT_URL}`, (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><html><body><div class="diagram-container"></div></body></html>'
      })
    );
    await page.goto(ARCHIFY_PROJECT_PATH);

    const preview = page.locator('[data-archify-swimlane="preview"]');
    await preview.scrollIntoViewIfNeeded();
    await expect(preview).toHaveAttribute('data-archify-state', 'fallback');
    await expect(preview.locator('[data-responsive-swimlane="inline"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: '전체 흐름 설명' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '예외 상황과 대응' })).toBeVisible();
  });

  test('artifact network 요청이 실패하면 기존 React 흐름으로 복구한다', async ({ page }) => {
    await page.route(`**${ARCHIFY_ARTIFACT_URL}`, (route) => route.abort('failed'));
    await page.goto(ARCHIFY_PROJECT_PATH);

    const preview = page.locator('[data-archify-swimlane="preview"]');
    await preview.scrollIntoViewIfNeeded();
    await expect(preview).toHaveAttribute('data-archify-state', 'fallback');
    await expect(preview.locator('[data-responsive-swimlane="inline"]')).toBeVisible();
  });

  test('artifact 준비가 5초를 넘기면 기존 React 흐름으로 복구한다', async ({ page }) => {
    test.setTimeout(15_000);
    await page.route(`**${ARCHIFY_ARTIFACT_URL}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 6_000));
      await route.continue().catch(() => undefined);
    });
    await page.goto(ARCHIFY_PROJECT_PATH);

    const preview = page.locator('[data-archify-swimlane="preview"]');
    await preview.scrollIntoViewIfNeeded();
    await expect(preview).toHaveAttribute('data-archify-state', 'loading');
    await expect(preview).toHaveAttribute('data-archify-state', 'fallback', { timeout: 7_000 });
    await expect(preview.locator('[data-responsive-swimlane="inline"]')).toBeVisible();
  });

  test('통합 예약 프로젝트는 workflow·relationship embed를 제공하고 Viewer control은 노출하지 않는다', async ({
    page
  }) => {
    await page.goto('/projects/integrated-reservation-platform');
    await expect(page.locator('[data-archify-swimlane="preview"]')).toHaveCount(1);
    await expect(page.locator('[data-relationship-diagram="preview"] [data-archify-embed="preview"]')).toHaveCount(1);
    await expect(page.locator('.toolbar')).toHaveCount(0);
  });

  test('접근 이름·보이는 설명·예외·focus trap·선 종류를 함께 보존한다', async ({ page }) => {
    await page.goto('/projects/codi-harness-dx-platform');

    const card = page.locator('[data-swimlane-card]').first();
    const trigger = card.getByRole('button', { name: '설계·개발·검증 크게 보기' });
    const inlineSummary = card.locator('[id$="-inline-summary"]');
    const exceptionSection = card.getByRole('heading', { name: '예외 상황과 대응' }).locator('..');

    await expect(trigger).toBeVisible();
    await expect(page.getByRole('button', { name: 'CI/CD·시크릿·배포 크게 보기' })).toBeVisible();
    await expect(inlineSummary).toBeVisible();
    await expect(exceptionSection).toContainText('사용자에게 추가 질문한 뒤 문제 정의를 다시 진행합니다.');
    await expect(card.locator('[data-swimlane-line-legend-item="normal"]')).toContainText('일반 진행·검증 통과');
    await expect(card.locator('[data-swimlane-line-legend-item="exception"]')).toContainText(
      '예외 발견·복구 및 재검증'
    );

    await trigger.click();
    const dialog = page.getByRole('dialog');
    const dialogSummary = dialog.locator('[id$="-dialog-summary"]');

    await expectTargetArchifyReady(
      dialog,
      'dialog',
      '/diagrams/codi-harness-dx-platform/design-development-verification.html'
    );
    await expect(dialogSummary).toHaveText((await inlineSummary.textContent()) ?? '');
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);

    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });

  test('열 개 Archify Dialog는 모든 지원 viewport에서 같은 artifact READ·legend·transcript·overflow·Escape 복귀를 보장한다', async ({
    page
  }) => {
    test.setTimeout(180_000);

    for (const width of [320, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });

      for (const target of ARCHIFY_DIALOG_TARGETS) {
        await test.step(`${width}px ${target.title}`, async () => {
          await page.goto(target.path);
          const trigger = page.getByRole('button', { name: `${target.title} 크게 보기`, exact: true });
          const card = trigger.locator('xpath=ancestor::article[@data-swimlane-card]');
          const preview = card.locator('[data-archify-swimlane="preview"]');

          await preview.scrollIntoViewIfNeeded();
          const previewArtifact = await expectTargetArchifyReady(card, 'preview', target.url);
          const previewSrc = await previewArtifact.frame.getAttribute('src');
          expect(await card.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
          await trigger.click();

          const dialog = page.getByRole('dialog');
          const dialogArtifact = await expectTargetArchifyReady(dialog, 'dialog', target.url);
          await expect(dialogArtifact.content.locator('.diagram-container')).toHaveAttribute(
            'data-detail-level',
            'read'
          );
          expect(await dialogArtifact.frame.getAttribute('src')).toBe(previewSrc);
          await expect(dialogArtifact.content.locator('[data-legend]')).toBeHidden();

          const artifactViewport = await dialogArtifact.content.locator('.diagram-container > svg').evaluate((svg) => {
            const bounds = svg.getBoundingClientRect();
            return {
              width: bounds.width,
              height: bounds.height,
              viewportWidth: window.innerWidth,
              viewportHeight: window.innerHeight
            };
          });
          expect(Math.abs(artifactViewport.width - artifactViewport.viewportWidth)).toBeLessThanOrEqual(1);
          expect(Math.abs(artifactViewport.height - artifactViewport.viewportHeight)).toBeLessThanOrEqual(1);

          if (width >= 1024) {
            const embedBox = await dialogArtifact.embed.boundingBox();
            if (!embedBox) throw new Error(`${target.title} Dialog artifact 영역을 찾을 수 없습니다.`);
            expect(embedBox.width / embedBox.height).toBeCloseTo(target.aspectRatio, 2);
          }

          const legend = dialog.locator('[data-swimlane-line-legend]');
          await expect(legend).toBeVisible();
          await expect(legend.locator('[data-swimlane-line-legend-item]')).toHaveCount(2);
          await expect(legend).toContainText('일반 진행·검증 통과');
          await expect(legend).toContainText('예외 발견·복구 및 재검증');

          const transcript = dialog.locator('[data-swimlane-mobile-transcript]');
          if (width < 1024) {
            await expect(transcript).toBeVisible();
            await expect(transcript.getByText('단계와 관계 읽기', { exact: true })).toBeVisible();
            const recoverEdges = transcript.locator('[data-swimlane-transcript-edge-outcome="recover"]');
            const stopEdges = transcript.locator('[data-swimlane-transcript-edge-outcome="stop"]');
            await expect(transcript.getByText('예외·복구 흐름', { exact: true })).toHaveCount(
              await recoverEdges.count()
            );
            await expect(transcript.getByText('예외·중단 흐름', { exact: true })).toHaveCount(await stopEdges.count());
            for (const transcriptEdge of await transcript
              .locator('[data-swimlane-transcript-edge-kind="exception"]')
              .all()) {
              const outcome = await transcriptEdge.getAttribute('data-swimlane-transcript-edge-outcome');
              expect(outcome).toMatch(/^(recover|stop)$/);
              const expectedBadge = outcome === 'recover' ? '예외·복구 흐름' : '예외·중단 흐름';

              await expect(transcriptEdge.getByText(expectedBadge, { exact: true })).toHaveCount(1);
            }
          } else {
            await expect(transcript).toBeHidden();
          }

          expect(await dialog.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
          ).toBeLessThanOrEqual(1);

          const dialogSummary = dialog.locator('[id$="-dialog-summary"]');
          await dialogSummary.scrollIntoViewIfNeeded();
          await expect(dialogSummary).toBeVisible();

          await page.keyboard.press('Escape');
          await expect(dialog).toBeHidden();
          await expect(trigger).toBeFocused();
        });
      }
    }
  });

  test('열 개 Dialog의 iframe error와 timeout fallback은 준비된 preview instance를 바꾸지 않는다', async ({ page }) => {
    test.setTimeout(180_000);

    for (const target of ARCHIFY_DIALOG_TARGETS) {
      await test.step(`${target.title} iframe error`, async () => {
        let requestCount = 0;
        const errorRoute = async (route: import('@playwright/test').Route) => {
          requestCount += 1;
          if (requestCount === 1) await route.continue();
          else await route.abort('failed');
        };
        await page.route(`**${target.url}`, errorRoute);
        await page.goto(target.path);
        const trigger = page.getByRole('button', { name: `${target.title} 크게 보기`, exact: true });
        const card = trigger.locator('xpath=ancestor::article[@data-swimlane-card]');
        const previewEmbed = card.locator('[data-archify-swimlane="preview"]');
        await previewEmbed.scrollIntoViewIfNeeded();
        const preview = await expectTargetArchifyReady(card, 'preview', target.url);
        const previewElement = await preview.embed.elementHandle();
        if (!previewElement) throw new Error(`${target.title} preview DOM을 찾을 수 없습니다.`);
        const previewSnapshot = await previewElement.evaluate((element) => ({
          connected: element.isConnected,
          state: element.getAttribute('data-archify-state'),
          src: element.querySelector('[data-archify-frame="preview"]')?.getAttribute('src')
        }));

        await trigger.click();
        const dialog = page.getByRole('dialog');
        const dialogEmbed = dialog.locator('[data-archify-swimlane="dialog"]');
        await expect(dialogEmbed).toHaveAttribute('data-archify-state', 'fallback');
        await expect(dialogEmbed.locator('[data-responsive-swimlane="dialog"]')).toBeVisible();
        expect(
          await previewElement.evaluate((element) => ({
            connected: element.isConnected,
            state: element.getAttribute('data-archify-state'),
            src: element.querySelector('[data-archify-frame="preview"]')?.getAttribute('src')
          }))
        ).toEqual(previewSnapshot);

        await page.unroute(`**${target.url}`, errorRoute);
      });

      await test.step(`${target.title} iframe timeout`, async () => {
        let requestCount = 0;
        const timeoutRoute = async (route: import('@playwright/test').Route) => {
          requestCount += 1;
          if (requestCount === 1) {
            await route.continue();
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 6_000));
          await route.continue().catch(() => undefined);
        };
        await page.route(`**${target.url}`, timeoutRoute);
        await page.goto(target.path);
        const trigger = page.getByRole('button', { name: `${target.title} 크게 보기`, exact: true });
        const card = trigger.locator('xpath=ancestor::article[@data-swimlane-card]');
        const previewEmbed = card.locator('[data-archify-swimlane="preview"]');
        await previewEmbed.scrollIntoViewIfNeeded();
        const preview = await expectTargetArchifyReady(card, 'preview', target.url);
        const previewElement = await preview.embed.elementHandle();
        if (!previewElement) throw new Error(`${target.title} preview DOM을 찾을 수 없습니다.`);
        const previewSnapshot = await previewElement.evaluate((element) => ({
          connected: element.isConnected,
          state: element.getAttribute('data-archify-state'),
          src: element.querySelector('[data-archify-frame="preview"]')?.getAttribute('src')
        }));

        await trigger.click();
        const dialog = page.getByRole('dialog');
        const dialogEmbed = dialog.locator('[data-archify-swimlane="dialog"]');
        await expect(dialogEmbed).toHaveAttribute('data-archify-state', 'loading');
        await expect(dialogEmbed).toHaveAttribute('data-archify-state', 'fallback', { timeout: 7_000 });
        await expect(dialogEmbed.locator('[data-responsive-swimlane="dialog"]')).toBeVisible();
        expect(
          await previewElement.evaluate((element) => ({
            connected: element.isConnected,
            state: element.getAttribute('data-archify-state'),
            src: element.querySelector('[data-archify-frame="preview"]')?.getAttribute('src')
          }))
        ).toEqual(previewSnapshot);

        await page.unroute(`**${target.url}`, timeoutRoute);
      });
    }
  });
});
