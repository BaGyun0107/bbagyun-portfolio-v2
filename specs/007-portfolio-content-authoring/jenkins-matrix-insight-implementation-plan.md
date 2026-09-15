# Jenkins Matrix Insight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 승인된 Jenkins→GitHub Actions matrix 인사이트 문안과 before/after data-flow를 기존 route에 적용하고, 작업물 연결·사실 경계·반응형 공개 화면을 회귀 계약으로 고정한다.

**Architecture:** 기존 `REAL_INSIGHTS` 정적 registry와 project-case 연결 구조를 유지한다. Jenkins insight 한 건의 metadata·본문만 승인 문안으로 교체하고, 데이터 계약과 permanent Playwright suite가 역할·시점·관찰 한계·시각 자료·양방향 연결을 검증한다. 작업물의 기존 CI/CD swimlane은 수정하지 않는다.

**Tech Stack:** TypeScript, Next.js 16 App Router, React 19, Vitest, Playwright, Markdown renderer, Spec Kit verification records

---

## Scope and source of truth

- Interview: `docs/portfolio-interviews/2026-08-27-jenkins-github-actions-matrix.md`
- Design: `specs/007-portfolio-content-authoring/jenkins-matrix-insight-design.md`
- Exact approved public copy: `specs/007-portfolio-content-authoring/jenkins-matrix-insight-approved-copy.md`
- Existing route: `/insights/jenkins-retirement-and-github-actions-migration`
- Existing source: `/projects/codi-harness-dx-platform`
- External code evidence, read-only: `/Users/codiworks_dev/Desktop/codi-rs-module/.github/workflows/pipeline.yml`, `.github/scripts/compute-platform-matrix.mjs`, relevant Git history

Do not alter the slug, origin project, unrelated insight bodies, the project swimlanes, or port 1104. Do not publish repository paths, private infrastructure identifiers, credentials, environment values, or source excerpts. The implementation step does not commit, push, create a PR, merge, or deploy.

## File map

**Modify:**

- `apps/front/src/data/portfolio/insights.ts` — replace only the Jenkins insight title, excerpt, date, editorial visual metadata, and content.
- `apps/front/src/data/portfolio/content-quality.test.ts` — lock approved Jenkins facts, boundaries, headings, date, and forbidden claims.
- `apps/front/src/data/portfolio/insight-editorial-quality.test.ts` — change the Jenkins inventory title, meaning contract, and visual decision from `not-needed` to `provided / data-flow`.
- `apps/front/src/data/portfolio/feature-detail-quality.test.ts` — update the preserved infrastructure fixture title and representative approved boundary sentence.
- `apps/front/e2e/portfolio-insight-contract.spec.ts` — update list/round-trip fixtures, add the Jenkins render contract, and include the route in the four-width overflow matrix.
- `apps/front/e2e/codi-harness-portfolio-detail.spec.ts` — update the preserved Jenkins title/body fixture used by source-route regression checks.
- `specs/007-portfolio-content-authoring/data-model.md` — update the Jenkins visual row to `provided / data-flow`.
- `specs/007-portfolio-content-authoring/verification.md` — append the evidence matrix, visual inventory, RED/GREEN history, production QA, review, and convergence result.
- `ROADMAP.md` — update Feature 007 verification counts and mention the Jenkins follow-up only after final verification.

**Create temporarily, then delete:**

- `apps/front/playwright.prod.config.ts` — production base URL for the isolated server.
- `apps/front/test-results/.last-run.json` — Playwright-generated state; remove after the run.

**Create and preserve:**

- `apps/front/test-results/jenkins-matrix-insight-approved.png` — approved 1440px full-page evidence.

## Task 1: RED unit contracts for the approved editorial boundary

**Files:**

- Modify: `apps/front/src/data/portfolio/content-quality.test.ts`
- Modify: `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`
- Modify: `apps/front/src/data/portfolio/feature-detail-quality.test.ts`

- [ ] **Step 1: Record the focused baseline**

Run:

```bash
cd apps/front
pnpm exec vitest run \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/insight-editorial-quality.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts
```

Expected: the pre-change focused suite passes. Record the exact count in `verification.md`; do not assume a count if concurrent work changed it.

- [ ] **Step 2: Replace the Jenkins content contract with the approved behavior**

In `content-quality.test.ts`, import `readFileSync` from `node:fs` and add this module-level approved-copy fixture before the test. Its parser must require exactly one `## Excerpt` and one following `## Content` heading, exclude the artifact metadata from both payloads, and compare the extracted strings exactly with the public getter DTO's rendered `excerpt` and `content`. Then replace the existing Jenkins test body with this contract. Keep the existing local `insightBySlug` helper.

```ts
const APPROVED_JENKINS_COPY = readFileSync(
  new URL('../../../../../specs/007-portfolio-content-authoring/jenkins-matrix-insight-approved-copy.md', import.meta.url),
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
```

```ts
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
  expect(text).toMatch(/2026-08-20[^.\n]*AWS 서울 리전[^.\n]*`t3\.large` 2대[^.\n]*월 730시간[^.\n]*공개 가격[^.\n]*컴퓨팅 추정치/);
  expect(text).toContain('스토리지·네트워크·세금은 포함하지 않습니다.');
  expect(text).toMatch(/GitHub Actions 무료 티어를 초과하지 않았지만[^.\n]*앞으로도 비용이 발생하지 않는다는 의미는 아닙니다/);

  const falseClaimGuards = [
    {
      label: '기존 Jenkins 소유권',
      pattern:
        /기존 Jenkins (?:구성|설정)[^.\n]*(?:직접\s*)?(?:설계|설정|구성|구축|담당|관리)[^.\n]*(?:했습니다|했다|되었습니다|되었다|맡았습니다|맡았다|주도했습니다|주도했다)/,
      prohibited: ['기존 Jenkins 구성은 제가 직접 구축했습니다.', '기존 Jenkins 설정은 제가 직접 담당했습니다.'],
      allowed: ['기존 Jenkins 구성은 제가 설계하거나 설정한 영역이 아니었습니다.', '기존 Jenkins 설정을 직접 담당하지 않았습니다.']
    },
    {
      label: 'Jenkins 확장 대안',
      pattern:
        /Jenkins (?:slave|executor)[^.\n]*(?:늘리|확장|스케일|증설)[^.\n]*(?:비교(?:했|하여)|검토(?:했|하여)|고려(?:했|하여)|평가(?:했|하여)|선택(?:했|하여)|도입(?:했|하여)|기각(?:했|하여)|채택(?:했|하여))/i,
      prohibited: ['Jenkins executor 증설을 대안으로 고려했습니다.', 'Jenkins executor 증설을 대안으로 평가했습니다.'],
      allowed: ['Jenkins slave나 executor를 늘리는 방안은 별도로 검토하지 않았습니다.']
    },
    {
      label: '실패 격리 검증',
      pattern:
        /(?:실패 격리|다른 호텔(?:의 (?:배포 )?완료 여부| job))[^.\n]*(?:검증|확인|관찰|대조|입증)[^.\n]*(?:했습니다|했다|되었습니다|되었다|됐습니다|됐다|확인됨)/,
      prohibited: ['실패 격리가 검증되었습니다.', '다른 호텔 job이 끝나는 것을 확인했습니다.'],
      allowed: ['실패 격리는 설정과 실행 구조의 의도로만 설명하며, 검증된 장애 격리 성과로 확대하지 않습니다.', '운영 중 실제 실패 사례로 다른 호텔의 완료 여부를 대조한 기록도 없습니다.']
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
      allowed: ['포트폴리오에서 사용하는 월 `$151.84`는 과거 실제 청구액이 아니라 공개 가격으로 다시 계산한 컴퓨팅 추정치입니다.']
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
    prohibited: ['80% 개선을 달성했습니다.', '79% 개선을 기록했습니다.', '배포 시간 80% 단축 효과가 있었습니다.', '성공률 100%를 달성했습니다.'],
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
```

- [ ] **Step 3: Update the editorial fixture and meaning contract**

In `insight-editorial-quality.test.ts`, replace the Jenkins `TARGET_INSIGHTS` row with:

```ts
{
  slug: 'jenkins-retirement-and-github-actions-migration',
  type: 'project-case',
  sourceSlug: 'codi-harness-dx-platform',
  visualDecision: 'provided',
  visualKind: 'data-flow',
  rationaleContext:
    /^(?=[\s\S]*Jenkins)(?=[\s\S]*(?:단일 slave|slave 1개|순차 대기열|순차 실행))(?=[\s\S]*(?:변경 범위|변경[^.\n]*(?:대상|영향)|배포 대상[^.\n]*계산))(?=[\s\S]*matrix)(?=[\s\S]*(?:병렬|배포 단위))[\s\S]+$/i
},
```

Replace its inventory title with:

```ts
title: 'GitHub Actions 전환보다 중요했던 배포 단위 재설계',
```

Replace the Jenkins `PROJECT_CASE_MEANING_CONTRACTS` row with:

```ts
{
  slug: 'jenkins-retirement-and-github-actions-migration',
  meanings: {
    role: /기존 Jenkins 구성[^#]*설계하거나 설정한 영역이 아니[^#]*workflow 설계부터 담당/,
    problem: /Jenkins slave[^#]*호텔별로 순차 실행/,
    constraint: /공통 코드[^#]*다섯 호텔별 코드[^#]*거의 마지막에 이전/,
    implementation: /변경 파일[^#]*배포 대상 플랫폼[^#]*GitHub Actions matrix[^#]*독립된 matrix job/,
    outcome:
      /^(?=[\s\S]*실행 화면[^.\n]*(?:비교한 관찰값|약 3분이 걸리는 것을 확인))(?=[\s\S]*약 15분[\s\S]*약 3분)(?=[\s\S]*평균이나 통제된 성능 실험은 아닙니다)(?=[\s\S]*80% 개선[^.\n]*일반화하지 않습니다)[\s\S]+$/,
    limitation:
      /^(?=[\s\S]*특정 호텔 job이 실패하더라도[^.\n]*즉시 취소하지 않도록)(?=[\s\S]*의도적으로 실패시키지는 않았[^.\n]*다른 호텔의 완료 여부[^.\n]*대조한 기록도 없습니다)(?=[\s\S]*설정과 실행 구조의 의도로만 설명[^.\n]*검증된 장애 격리 성과로 확대하지 않)(?=[\s\S]*평균이나 통제된 성능 실험은 아닙니다)(?=[\s\S]*서로 독립적이고[^.\n]*영향을 주는지 계산할 수 있을 때)(?=[\s\S]*순서가 필요[^.\n]*정확히 구분할 수 없다면)[\s\S]+$/
  }
},
```

- [ ] **Step 4: Update the preserved source-route fixture**

In `feature-detail-quality.test.ts`, replace only the Jenkins row in `PRESERVED_HARNESS_INFRA_INSIGHTS`:

```ts
{
  slug: 'jenkins-retirement-and-github-actions-migration',
  title: 'GitHub Actions 전환보다 중요했던 배포 단위 재설계',
  bodySnippet:
    '이 값은 기존 Jenkins의 순차 실행 화면과 GitHub Actions matrix 실행 화면을 비교한 관찰값입니다.'
},
```

- [ ] **Step 5: Run the focused suite and verify RED**

Run the Step 1 command again.

Expected: FAIL because production data still has the old title, `2026-04-23`, `not-needed`, old headings, and old role/time-boundary copy. A syntax, import, fixture-shape, or missing-helper error is not an acceptable RED; fix the test only until it fails for those behavior differences.

## Task 2: RED permanent browser contract

**Files:**

- Modify: `apps/front/e2e/portfolio-insight-contract.spec.ts`
- Modify: `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`

- [ ] **Step 1: Update list and round-trip titles**

In `portfolio-insight-contract.spec.ts`, change the Jenkins title in both `MIGRATED_INSIGHTS` and `ROUND_TRIPS` to:

```ts
'GitHub Actions 전환보다 중요했던 배포 단위 재설계'
```

Do not change the route or source title.

- [ ] **Step 2: Add the dedicated Jenkins render contract**

Place this test after the Cloudflare-specific test and before the round-trip loop:

```ts
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
```

The current renderer UI date contract is the exact zero-padded `2026.07.07`; assert it article-scoped with `{ exact: true }`. Do not change production date or use a selector that could match unrelated page text.

- [ ] **Step 3: Add the Jenkins route-specific contract to the existing four-width matrix**

Keep this path in the existing array inside the `[320, 768, 1024, 1440]` loop and, only when that path is active, scope the data-flow assertion through the route article. Confirm the before/after relationship (`slave 1개`, `변경 범위 계산`, `대상별 matrix job`, `약 15분`, and `약 3분`). Preserve the page-level overflow assertion (`≤1`); do not require all `pre` text to fit in the viewport. Instead, inspect the internal `pre` overflow and dimensions, accepting `scrollWidth >= clientWidth`, and when it overflows, prove its horizontal scroll can move and return to its original position.

```ts
for (const path of [
  // existing paths
  '/insights/jenkins-retirement-and-github-actions-migration'
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
    expect(scrollState.overflowX).toMatch(/auto|scroll/);
    expect(scrollState.scrollWidth).toBeGreaterThanOrEqual(scrollState.clientWidth);

    if (scrollState.scrollWidth > scrollState.clientWidth) {
      const scrollResult = await dataFlow.evaluate((element) => {
        const initialScrollLeft = element.scrollLeft;
        element.scrollLeft = element.scrollWidth - element.clientWidth;
        const scrolledLeft = element.scrollLeft;
        element.scrollLeft = initialScrollLeft;

        return { initialScrollLeft, scrolledLeft, restoredScrollLeft: element.scrollLeft };
      });
      expect(scrollResult.scrolledLeft).toBeGreaterThan(scrollResult.initialScrollLeft);
      expect(scrollResult.restoredScrollLeft).toBe(scrollResult.initialScrollLeft);
    }
  }
}
```

Do not create four duplicate tests or require focus on the rendered `pre`; reuse the established matrix and retain the existing document-level overflow check.

- [ ] **Step 4: Update the preserved infrastructure E2E fixture**

In `codi-harness-portfolio-detail.spec.ts`, replace only the Jenkins row:

```ts
{
  slug: 'jenkins-retirement-and-github-actions-migration',
  title: 'GitHub Actions 전환보다 중요했던 배포 단위 재설계',
  bodySnippet:
    '이 값은 기존 Jenkins의 순차 실행 화면과 GitHub Actions matrix 실행 화면을 비교한 관찰값입니다.'
},
```

- [ ] **Step 5: Confirm test discovery without starting a second dev server**

Run:

```bash
cd apps/front
pnpm exec playwright test --list
```

Expected: one more permanent E2E than the pre-change 59-test baseline, normally 60 tests in 4 files. This is discovery only. Do not run against port 1104 and do not touch `.next/dev`.

## Task 3: Minimal approved public implementation

**Files:**

- Modify: `apps/front/src/data/portfolio/insights.ts`
- Modify: `specs/007-portfolio-content-authoring/data-model.md`

- [ ] **Step 1: Replace only the Jenkins insight object**

Keep the existing slug, tags, `readTime: '7 min'`, and `featureSlug`. Set these fields exactly:

```ts
title: 'GitHub Actions 전환보다 중요했던 배포 단위 재설계',
date: new Date('2026-07-07'),
editorial: {
  type: 'project-case',
  visualAssessment: {
    decision: 'provided',
    kind: 'data-flow',
    rationale:
      'Jenkins slave 1개의 순차 대기열에서 변경 범위 기반 matrix 병렬 실행으로 배포 단위가 바뀐 관계를 before/after data-flow로 제공합니다.',
    question: '배포 단위를 순차 대기열에서 대상별 matrix로 어떻게 다시 설계했는가?',
    textAlternative:
      'Jenkins에서는 slave 1개가 다섯 호텔을 순차 배포했지만, GitHub Actions에서는 공통 코드와 호텔별 코드의 변경 범위를 계산해 선택된 대상을 matrix job으로 병렬 배포합니다.',
    nonDuplicationReason:
      '작업물의 swimlane은 현재 전체 CI/CD 실행과 책임 경계를 보여 주고, 인사이트 data-flow는 Jenkins 순차 대기열에서 대상별 matrix로 배포 단위가 바뀐 전후만 비교합니다.'
  }
},
```

Copy the `Excerpt` and `Content` blocks byte-for-byte from `jenkins-matrix-insight-approved-copy.md`. Do not polish adjacent sentences or add code facts discovered after content approval.

- [ ] **Step 2: Keep the origin relationship automatic**

Do not edit `features.ts`, `studies.ts`, or project detail copy. The unchanged `featureSlug: 'codi-harness-dx-platform'` and updated insight title must drive the existing project list/card links. The project’s two swimlanes remain byte-for-byte unchanged.

- [ ] **Step 3: Update the Feature 007 visual fixture**

In `data-model.md`, replace the Jenkins row with:

```markdown
| `jenkins-retirement-and-github-actions-migration` | project-case | `codi-harness-dx-platform` | provided | data-flow |
```

## Task 4: GREEN unit, type, and scoped static verification

**Files:**

- Verify all Task 1 and Task 3 files.

- [ ] **Step 1: Run the focused GREEN suite**

Run the Task 1 Step 1 command.

Expected: all focused tests pass. If an approved sentence wraps across source lines, adjust only the test regex’s whitespace boundary; do not change approved public wording to satisfy a brittle locator.

- [ ] **Step 2: Run the full unit suite**

Run:

```bash
cd apps/front
pnpm test
```

Expected: 5 files pass. With the planned replacement-only unit contract, the current count remains 176 tests unless another in-flight change legitimately changes it; record the observed count.

- [ ] **Step 3: Run TypeScript**

Run:

```bash
cd apps/front
pnpm exec tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 4: Run scoped ESLint**

Run:

```bash
cd apps/front
pnpm exec eslint \
  src/data/portfolio/insights.ts \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/insight-editorial-quality.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts \
  e2e/portfolio-insight-contract.spec.ts \
  e2e/codi-harness-portfolio-detail.spec.ts
```

Expected: no new diagnostics in the Jenkins block or changed tests. `insights.ts` currently has ten pre-existing Prettier diagnostics before the Jenkins block at lines around 447–895; record them as baseline and do not run broad formatting or `--fix`.

- [ ] **Step 5: Run whitespace checks**

Run:

```bash
git diff --check
```

For untracked plan/interview/spec files, also run `git diff --no-index --check /dev/null <file>` and treat exit 1 with no output as a clean new-file diff. Expected: no whitespace diagnostics.

## Task 5: Fresh production E2E and visual verification

**Files:**

- Create temporarily: `apps/front/playwright.prod.config.ts`
- Preserve: `apps/front/test-results/jenkins-matrix-insight-approved.png`
- Delete after run: `apps/front/playwright.prod.config.ts`
- Delete after run if generated: `apps/front/test-results/.last-run.json`

- [ ] **Step 1: Build production output**

Run:

```bash
cd apps/front
pnpm run build
```

Expected: build passes and 38 static pages are generated. Record the existing multiple-lockfile workspace-root warning without changing lockfiles.

- [ ] **Step 2: Confirm port isolation**

Run:

```bash
lsof -nP -iTCP:1104 -sTCP:LISTEN
lsof -nP -iTCP:1116 -sTCP:LISTEN
```

Expected: preserve the existing 1104 process. Port 1116 must be free; if it is occupied, choose a confirmed free adjacent port and use it consistently below.

- [ ] **Step 3: Start the production server on 1116**

Run from `apps/front` in an owned PTY session:

```bash
pnpm start --port 1116 --hostname 127.0.0.1
```

Expected: `http://127.0.0.1:1116` becomes ready. Save the session id and stop only this process during cleanup.

- [ ] **Step 4: Create the temporary Playwright config with `apply_patch`**

Create exactly:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://127.0.0.1:1116'
  }
});
```

- [ ] **Step 5: Run all permanent E2E tests**

Run:

```bash
cd apps/front
pnpm exec playwright test --config=playwright.prod.config.ts --reporter=line
```

Expected: normally 60/60 pass, 0 fail, 0 skip. The suite must cover the Jenkins route, list entry, project↔insight keyboard round-trip, data-flow, preserved legacy routes, and 320/768/1024/1440px overflow.

- [ ] **Step 6: Capture and inspect the approved screen**

Run:

```bash
cd apps/front
pnpm exec playwright screenshot \
  --viewport-size="1440,1000" \
  --full-page \
  --wait-for-selector="h1" \
  --wait-for-timeout=500 \
  http://127.0.0.1:1116/insights/jenkins-retirement-and-github-actions-migration \
  test-results/jenkins-matrix-insight-approved.png
```

Inspect the image with `view_image`. Confirm the H1, date, six sections, before/after data-flow, cost caveat, measurement limit, apply/avoid boundary, and source card are readable without clipping or broken monospace text.

- [ ] **Step 7: Clean temporary state**

Use `apply_patch` to delete `playwright.prod.config.ts` and `.last-run.json` if it exists. Stop only the owned 1116 PTY process. Verify:

```bash
test ! -e apps/front/playwright.prod.config.ts
test ! -e apps/front/test-results/.last-run.json
lsof -nP -iTCP:1116 -sTCP:LISTEN
lsof -nP -iTCP:1104 -sTCP:LISTEN
```

Expected: the first two commands pass, 1116 has no listener, and the original 1104 listener is unchanged.

## Task 6: Verification record, independent review, and convergence

**Files:**

- Modify: `specs/007-portfolio-content-authoring/verification.md`
- Modify after green evidence: `ROADMAP.md`

- [ ] **Step 1: Append the Jenkins evidence record**

Add a dated section containing:

- the eight-row project-case meaning matrix from the design;
- separate source and insight visual necessity inventories and final decisions;
- exact code/history evidence without private identifiers or source excerpts;
- public verification matrix for route, list, reciprocal links, accessible names, keyboard movement, responsive widths, long-form duplication, and visual duplication;
- RED failure reasons, GREEN counts, TypeScript, scoped lint baseline, build, E2E, screenshot, ports, and temporary-file cleanup;
- explicit boundaries: original Jenkins ownership, unconsidered Jenkins expansion, untested failure isolation, public-price estimate, non-average timing, no percentage claim.

- [ ] **Step 2: Run an independent specification review**

Reviewer inputs:

- `jenkins-matrix-insight-design.md`
- `jenkins-matrix-insight-approved-copy.md`
- interview record
- implementation diff
- unit/E2E evidence

The reviewer must report Critical, Important, and Minor findings separately and verify that the approved copy was not strengthened or silently polished.

- [ ] **Step 3: Run an independent code/content quality review**

The reviewer must inspect false-positive and false-negative guards, brittle E2E locators, current data model consistency, unrelated-content preservation, visual text equivalence, responsive coverage, and temporary artifact hygiene. Resolve every Critical or Important finding and rerun the affected checks.

- [ ] **Step 4: Run `speckit-converge`**

Compare the final implementation to Feature 007 spec, plan, tasks, constitution, and this approved follow-up design. Do not append empty convergence tasks or modify `tasks.md` when there are no findings. Record the exact converged result and confirm the `tasks.md` SHA-256 is unchanged.

- [ ] **Step 5: Attempt feature status synchronization**

Run:

```bash
mise run feature:status:sync
```

Expected in the current repository: exit 1 because the task is unavailable. Record the actual output. Do not invent a replacement task and do not run `--apply` when the base task does not exist.

- [ ] **Step 6: Update ROADMAP only from observed final evidence**

Update Feature 007’s completed entry with the Jenkins follow-up and the observed Vitest/E2E counts. Keep the existing known formatting baseline note. Do not claim an automatic status transition.

- [ ] **Step 7: Final verification-before-completion rerun**

Freshly rerun the full Vitest suite, TypeScript, scoped ESLint classification, `git diff --check`, production build, permanent production E2E, screenshot inspection, port cleanup, and temporary-file checks in the completing session. Report commit, push, PR, merge, and deploy as not performed.

## Expected final state

- The existing slug returns 200 with the approved new title and `2026-07-07` date.
- The insight is still a `project-case` connected only to `codi-harness-dx-platform`.
- The article distinguishes original Jenkins ownership from the author’s migration/workflow responsibility.
- The article places the five-hotel deployment-unit redesign ahead of cost.
- The before/after data-flow is present, accessible through surrounding text, and non-duplicative with the project swimlane.
- The approximately 15-minute to 3-minute result remains a bounded screen observation without a percentage claim.
- `fail-fast: false` remains an untested design intention, not a claimed incident result.
- The route, related records, legacy insights, project swimlanes, port 1104, and unrelated formatting remain preserved.
