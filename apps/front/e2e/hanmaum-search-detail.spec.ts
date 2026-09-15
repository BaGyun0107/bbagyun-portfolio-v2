import { expect, test } from '@playwright/test';

const HANMAUM_PATH = '/projects/hanmaum-science-institute';
const HANMAUM_INSIGHT_PATH = '/insights/optimizing-770k-text-search-in-rdbms';
const HANMAUM_SWIMLANE_URLS = [
  '/diagrams/hanmaum-science-institute/ingestion-and-recovery.html',
  '/diagrams/hanmaum-science-institute/search-request-flow.html'
] as const;

const SHARED_SECTION_ORDER = [
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
] as const;

test.describe('한마음 법문검색 구조화 상세', () => {
  test('연결 인사이트는 2023~2026 검색 구조의 발전과 근거 경계를 표시한다', async ({ page }) => {
    await page.goto(HANMAUM_INSIGHT_PATH);

    await expect(
      page.getByRole('heading', {
        name: 'LIKE에서 FULLTEXT·토큰 검증까지: RDBMS 검색을 단계적으로 개선한 과정',
        exact: true
      })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: '2023년: LIKE 기반 검색의 응답을 줄이다' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: '2025년: FULLTEXT를 도입했지만 토큰화 한계가 남았다' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: '2026년: FULLTEXT와 토큰별 LIKE를 하나의 조건으로 결합하다' })
    ).toBeVisible();
    await expect(page.getByText('약 1500ms에서 약 400ms로 줄었습니다', { exact: false })).toBeVisible();
    await expect(page.getByText('한 글자 토큰만 있으면 LIKE-only', { exact: false })).toBeVisible();
  });

  test('하네스와 동일한 공통 제목을 승인된 읽기 순서로 표시한다', async ({ page }) => {
    await page.goto(HANMAUM_PATH);

    await expect(page.locator('main h2')).toHaveText([...SHARED_SECTION_ORDER]);
  });

  test('근거 종류와 기준 시점을 포함한 결과 지표를 제공한다', async ({ page }) => {
    await page.goto(HANMAUM_PATH);

    const summary = page.getByRole('heading', { name: '핵심 결과 요약', exact: true });
    await expect(summary).toBeVisible();

    await expect(page.getByText('약 1500ms → 약 400ms', { exact: false })).toBeVisible();
    await expect(page.getByText('측정값', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('2023-10', { exact: false }).first()).toBeVisible();
  });

  test('검증된 데모가 없으므로 데모 관련 요소를 만들지 않는다', async ({ page }) => {
    await page.goto(HANMAUM_PATH);

    await expect(page.getByRole('link', { name: /데모|시뮬레이터|준비 중/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /데모|준비 중/ })).toHaveCount(0);
  });

  test('연결 인사이트를 본문과 사이드바에 모두 노출한다', async ({ page }) => {
    await page.goto(HANMAUM_PATH);

    // 본문 인라인 링크 1개 + 하단 관련 인사이트 1개 + 사이드바 1개
    await expect(page.locator(`a[href="${HANMAUM_INSIGHT_PATH}"]`)).toHaveCount(3);
  });

  test('두 Archify 시스템 흐름과 전체 흐름·예외 설명을 함께 표시한다', async ({ page }) => {
    await page.goto(HANMAUM_PATH);

    await expect(page.getByRole('heading', { name: '원문 적재와 실패 복구', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: '검색 요청 처리', exact: true })).toBeVisible();
    await expect(page.getByText('예외가 없어도 적재를 되돌리고 남은 제목을 알려 원인 지점을 좁힙니다.')).toBeVisible();
    await expect(page.getByText('원본 교재가 아니라 파싱 규칙을 보완한 뒤 다시 실행합니다.')).toBeVisible();

    const cards = page.locator('[data-swimlane-card]');
    await expect(cards).toHaveCount(HANMAUM_SWIMLANE_URLS.length);
    for (const [index, url] of HANMAUM_SWIMLANE_URLS.entries()) {
      const preview = cards.nth(index).locator('[data-archify-swimlane="preview"]');
      await preview.scrollIntoViewIfNeeded();
      await expect(preview).toHaveAttribute('data-archify-state', 'ready', { timeout: 15_000 });
      await expect(preview.locator('[data-archify-frame="preview"]')).toHaveAttribute('src', url);
    }
  });

  for (const width of [320, 768, 1024, 1440]) {
    test(`${width}px에서 페이지 전체 가로 넘침이 없다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(HANMAUM_PATH);
      await expect(page.getByRole('heading', { name: '핵심 설계와 구현', exact: true })).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );

      expect(overflow).toBeLessThanOrEqual(1);
      await expect(page.locator('[data-archify-swimlane="preview"]')).toHaveCount(2);
      for (const card of await page.locator('[data-swimlane-card]').all()) {
        expect(await card.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
      }
    });
  }

  for (const width of [320, 768, 1024, 1440]) {
    test(`연결 인사이트가 ${width}px에서 페이지 전체 가로 넘침이 없다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(HANMAUM_INSIGHT_PATH);
      await expect(page.getByRole('heading', { name: 'LIKE에서 하이브리드 검색까지의 발전' })).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );

      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
