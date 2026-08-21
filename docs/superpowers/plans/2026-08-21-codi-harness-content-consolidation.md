# Codi Harness Content Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 하네스 작업물 상세에 대표 설계 결정 네 개를 복원하고 짧은 인사이트 네 개를 발전 과정 중심 대표 인사이트 하나로 통합한다.

**Architecture:** 작업물 기본 메타데이터는 `features.ts`, 구조화 작업물 상세는 `feature-details/codi-harness-dx-platform.ts`, 대표 발전 서사는 `insights.ts`의 `codi-harness-dx-platform-design` 객체를 각각 단일 정본으로 사용한다. React 컴포넌트와 연결형 스윔레인은 변경하지 않고 데이터 기반 렌더링을 유지하며, 삭제되는 네 insight slug는 내부 참조 없이 404가 되도록 registry에서 제거한다.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, TypeScript, MarkdownViewer, Vitest, React DOM server rendering, Playwright, pnpm, mise

---

## 실행 전 저장소 규칙

- Size는 **Large**다. 작업물 본문, 공개 insight 경로, 콘텐츠 정본, server rendering과 E2E 계약이 함께 변경된다.
- 새 Spec Kit plan of record는 `specs/004-codi-harness-content-consolidation/`을 사용한다.
- 이 문서는 `speckit-specify`에 전달할 구현 입력이며, Spec Kit checklist와 analyze gate 승인 전에는 앱 파일을 수정하지 않는다.
- 저장소 규칙상 `$speckit-implement` 단계는 commit 또는 stage를 수행하지 않는다. 아래 task는 commit 단계 대신 검증 checkpoint로 끝낸다.
- 기존 dirty worktree의 관련 없는 사용자 변경은 포맷·복구·삭제하지 않는다.
- 연결형 스윔레인 데이터, 여섯 지표 값, 다른 7개 작업물, Jenkins·Infisical·Cloudflare 독립 insight는 변경하지 않는다.

## 파일 책임 맵

**Modify**

- `apps/front/src/data/portfolio/features.ts`
  - 하네스 제목·설명·개요·기간·기술 스택 메타데이터
  - 사용되지 않는 하네스 legacy `content` 제거
- `apps/front/src/data/portfolio/feature-details/codi-harness-dx-platform.ts`
  - 작업물 상세의 역할·문제·제약·대안·설계·결과·회고 정본
  - 연결형 스윔레인과 여섯 지표는 그대로 보존
- `apps/front/src/data/portfolio/insights.ts`
  - 대표 insight 하나의 제목·요약·본문·읽기 시간
  - 짧은 insight 네 개와 대표 insight의 `legacyContent` 제거
- `apps/front/src/data/portfolio/feature-detail-quality.test.ts`
  - 하네스 단일 정본, 대표 설계 네 개, insight registry·본문 순서 계약
- `apps/front/src/components/projects/project-detail-rendering.test.tsx`
  - 실제 공개 HTML의 대표 설계·회고·대표 링크·제거 링크 부재 계약
- `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`
  - 대표 insight 이동, 제거 route 404, 유지 insight와 스윔레인·legacy project 회귀
- `specs/004-codi-harness-content-consolidation/verification.md`
  - RED/GREEN, 품질 gate와 공개 경로 증거
- `specs/004-codi-harness-content-consolidation/tasks.md`
  - 실제 Spec Kit task 완료 상태
- `ROADMAP.md`
  - 수렴 이후 기능 완료 상태

**No component changes expected**

- `apps/front/src/components/projects/ProjectDetailContent.tsx`
- `apps/front/src/components/projects/ProjectMarkdown.tsx`
- `apps/front/src/components/projects/ProjectSwimlane.tsx`
- `apps/front/src/components/projects/ProjectSwimlaneDiagram.tsx`

현재 컴포넌트는 구조화 상세과 Markdown link를 이미 데이터 기반으로 렌더링하므로, 테스트가 컴포넌트 결함을 드러내지 않는 한 수정하지 않는다.

---

### Task 1: 콘텐츠 통합 계약을 RED로 고정

**Files:**

- Modify: `apps/front/src/data/portfolio/feature-detail-quality.test.ts:884-928`
- Modify: `apps/front/src/components/projects/project-detail-rendering.test.tsx:64-170`
- Modify: `apps/front/e2e/codi-harness-portfolio-detail.spec.ts:269-319`
- Create through Spec Kit before execution: `specs/004-codi-harness-content-consolidation/verification.md`

- [ ] **Step 1: 기존 두 data test를 단일 정본과 대표 발전 서사 계약으로 교체**

`feature-detail-quality.test.ts`의 `현재 구조, 역사적 전환과 런타임 집행 계층을 구분한다`와 `네 구현 주제를 독립 인사이트와 본문 링크로 연결한다` 테스트를 아래 두 테스트로 교체한다.

```ts
it('하네스 작업물은 구조화 상세만 본문 정본으로 사용한다', () => {
  const feature = getFeatureBySlug('codi-harness-dx-platform');
  const detail = getFeatureDetailBySlug('codi-harness-dx-platform');
  const implementation = detail?.implementation ?? '';

  expect(feature?.description).toBe(
    '팀원과 AI 에이전트가 프로젝트마다 다르게 수행하던 설계·검증·배포 절차를 공통 정책, CLI와 CI/CD로 집행하는 사내 개발 운영 플랫폼입니다.'
  );
  expect(feature?.content).toBeUndefined();
  expect(detail?.role).toMatch(/하네스 아키텍처.*초기화·진단.*CI\/CD·시크릿/s);
  expect(detail?.problem).toMatch(/반복되는 초기화·배포 설정.*AI 에이전트.*환경과 배포 대상/s);
  expect(detail?.constraints).toMatch(/공개할 수 없.*Claude Code와 Codex.*덮어써서는 안/s);
  expect(detail?.alternatives).toMatch(/Jenkins.*workflow.*공통 정책.*CLI.*검증 게이트/s);

  const designHeadings = [
    '### `./harness`와 `doctor`',
    '### `harness.lock`과 소유권 경계',
    '### 공통 정책과 런타임 어댑터',
    '### 변경 범위 기반 배포와 Infisical 경계'
  ];
  let previousIndex = -1;
  for (const heading of designHeadings) {
    const index = implementation.indexOf(heading);
    expect(index, heading).toBeGreaterThan(previousIndex);
    previousIndex = index;
  }
  expect(implementation).toContain('GSD → Spec Kit');
  expect(implementation).toContain('GStack → Playwright MCP');
  expect(implementation).toContain('](/insights/codi-harness-dx-platform-design)');
});

it('대표 insight 하나가 승인된 발전 과정과 운영 성숙도를 제공한다', () => {
  const removedSlugs = [
    'harness-lock-and-project-ownership-boundary',
    'harness-cli-and-doctor-productization',
    'claude-codex-policy-parity-and-regression-testing',
    'multi-session-testbed-and-context-lifecycle'
  ];
  const insights = getAllInsights();
  const canonical = insights.find(({ slug }) => slug === 'codi-harness-dx-platform-design');

  expect(removedSlugs.every((slug) => !insights.some((insight) => insight.slug === slug))).toBe(true);
  expect(canonical?.title).toBe('DX 하네스 v2: 복사형 도구에서 사내 개발 운영 플랫폼까지');
  expect(canonical?.readTime).toBe('9 min');
  expect(canonical?.legacyContent).toBeUndefined();
  expect(canonical?.featureSlug).toBe('codi-harness-dx-platform');
  expect(canonical?.content.trim().length).toBeGreaterThan(3500);

  const headings = [
    '## Jenkins 제거가 출발점이었다',
    '## v1: 복사는 설치를 쉽게 했지만 업데이트를 어렵게 했다',
    '## harness.lock: 재사용성을 안전한 변경 전파로 다시 정의하다',
    '## ./harness와 doctor: 체크리스트를 내부 제품으로 만들다',
    '## AI 작업 규칙: 문서를 복사하는 것에서 행동을 검증하는 것으로',
    '## 멀티 세션: 규칙 통일에서 실행 환경 격리로 확장하다',
    '## 결과: 하네스가 관리하는 것은 파일이 아니라 반복 가능한 작업 방식이다',
    '## 회고'
  ];
  let previousIndex = -1;
  for (const heading of headings) {
    const index = canonical?.content.indexOf(heading) ?? -1;
    expect(index, heading).toBeGreaterThan(previousIndex);
    previousIndex = index;
  }
  expect(canonical?.content).toContain('운영 중인 핵심 구조');
  expect(canonical?.content).toContain('실제 적용 결과');
  expect(canonical?.content).toContain('운영 확장 실험');
});
```

- [ ] **Step 2: 실제 하네스 HTML의 대표 설계와 링크 계약 추가**

`project-detail-rendering.test.tsx`에 다음 테스트를 추가한다.

```tsx
it('하네스 상세은 대표 설계 네 개와 통합 insight 하나만 직접 연결한다', () => {
  const detail = getFeatureDetailBySlug('codi-harness-dx-platform');
  if (!detail) throw new Error('하네스 상세 fixture를 찾을 수 없습니다.');

  const html = renderToStaticMarkup(
    <ProjectDetailContent
      overview='Jenkins 교체에서 개발 운영 기준 통합으로 문제를 확장했습니다.'
      detail={detail}
      relatedInsights={[
        {
          slug: 'codi-harness-dx-platform-design',
          title: 'DX 하네스 v2: 복사형 도구에서 사내 개발 운영 플랫폼까지',
          excerpt: '하네스가 발전한 과정을 설명합니다.'
        }
      ]}
    />
  );

  for (const heading of [
    './harness와 doctor',
    'harness.lock과 소유권 경계',
    '공통 정책과 런타임 어댑터',
    '변경 범위 기반 배포와 Infisical 경계'
  ]) {
    expect(html).toContain(heading);
  }
  expect(html).toContain('재사용성은 파일을 복사하기 쉽게 만드는 것이 아니라');
  expect(html).toContain('guardrail은 개발자와 AI 에이전트를 느리게 만드는 장치가 아니라');
  expect(html).toContain('href="/insights/codi-harness-dx-platform-design"');
  for (const removedSlug of [
    'harness-lock-and-project-ownership-boundary',
    'harness-cli-and-doctor-productization',
    'claude-codex-policy-parity-and-regression-testing',
    'multi-session-testbed-and-context-lifecycle'
  ]) {
    expect(html).not.toContain(`/insights/${removedSlug}`);
  }
});
```

- [ ] **Step 3: E2E의 네 독립 링크 계약을 통합 대표 insight 계약으로 교체**

`codi-harness-portfolio-detail.spec.ts`의 `현재 도구와 발전 기록 및 런타임 집행 계층을 분리해 보여준다`, `본문의 네 구현 링크가 각각 독립 인사이트로 연결된다`, `키보드로 내부 인사이트를 같은 탭에서 열고 외부 근거의 새 창 안내를 확인한다`를 아래 테스트로 교체한다.

```ts
test('대표 설계 네 개와 도구 전환 판단을 작업물 본문에서 확인한다', async ({ page }) => {
  await page.goto(HARNESS_PATH);

  for (const heading of [
    './harness와 doctor',
    'harness.lock과 소유권 경계',
    '공통 정책과 런타임 어댑터',
    '변경 범위 기반 배포와 Infisical 경계'
  ]) {
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  await expect(page.getByText('GSD → Spec Kit', { exact: true })).toBeVisible();
  await expect(page.getByText('GStack → Playwright MCP', { exact: true })).toBeVisible();
});

test('통합 대표 insight를 같은 탭에서 열고 발전 과정 전체를 확인한다', async ({ page }) => {
  await page.goto(HARNESS_PATH);

  const link = page
    .getByRole('link', { name: 'DX 하네스 v2: 복사형 도구에서 사내 개발 운영 플랫폼까지', exact: true })
    .first();
  await expect(link).toHaveAttribute('href', '/insights/codi-harness-dx-platform-design');
  await expect(link).not.toHaveAttribute('target', '_blank');
  await link.focus();
  await expect(link).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/\/insights\/codi-harness-dx-platform-design$/);
  await expect(page.locator('h1')).toHaveText('DX 하네스 v2: 복사형 도구에서 사내 개발 운영 플랫폼까지');
  await expect(page.getByText('9 min', { exact: true })).toBeVisible();
  for (const heading of [
    'Jenkins 제거가 출발점이었다',
    'v1: 복사는 설치를 쉽게 했지만 업데이트를 어렵게 했다',
    'harness.lock: 재사용성을 안전한 변경 전파로 다시 정의하다',
    './harness와 doctor: 체크리스트를 내부 제품으로 만들다',
    'AI 작업 규칙: 문서를 복사하는 것에서 행동을 검증하는 것으로',
    '멀티 세션: 규칙 통일에서 실행 환경 격리로 확장하다',
    '결과: 하네스가 관리하는 것은 파일이 아니라 반복 가능한 작업 방식이다',
    '회고'
  ]) {
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
});

test('제거된 네 insight route는 404이고 독립 인프라 insight는 유지한다', async ({ page }) => {
  for (const slug of [
    'harness-lock-and-project-ownership-boundary',
    'harness-cli-and-doctor-productization',
    'claude-codex-policy-parity-and-regression-testing',
    'multi-session-testbed-and-context-lifecycle'
  ]) {
    const response = await page.goto(`/insights/${slug}`);
    expect(response?.status(), slug).toBe(404);
  }

  for (const slug of [
    'jenkins-retirement-and-github-actions-migration',
    'infisical-centralized-secrets-and-spof-defense',
    'cloudflare-tunnel-zero-trust-cicd-and-troubleshooting'
  ]) {
    const response = await page.goto(`/insights/${slug}`);
    expect(response?.ok(), slug).toBe(true);
    await expect(page.locator('h1')).toBeVisible();
  }

  await page.goto(HARNESS_PATH);
  const externalLink = page.getByRole('link', {
    name: 'AWS EC2 On-Demand 공개 가격 (새 창에서 열림)',
    exact: true
  });
  await expect(externalLink).toHaveAttribute('target', '_blank');
  await expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
});
```

- [ ] **Step 4: focused unit/server RED 확인**

Run:

```bash
pnpm --dir apps/front exec vitest run \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/components/projects/project-detail-rendering.test.tsx \
  -t '구조화 상세만 본문 정본|대표 insight 하나|대표 설계 네 개'
```

Expected: 새 data 계약 2건과 server rendering 계약 1건이 현재 중복 `content`, 네 insight 객체, 기존 구현 문구 때문에 FAIL한다. Vite native config loader 경고는 기존 비차단 경고로 기록한다.

- [ ] **Step 5: targeted browser RED 확인**

Run:

```bash
pnpm --dir apps/front exec playwright test \
  e2e/codi-harness-portfolio-detail.spec.ts \
  --grep '대표 설계 네 개|통합 대표 insight|제거된 네 insight'
```

Expected: 현재 작업물에는 새 네 heading과 대표 제목이 없고 제거 대상 route가 200이므로 3개 시나리오가 요구한 이유로 FAIL한다.

- [ ] **Step 6: RED 증거 기록**

`specs/004-codi-harness-content-consolidation/verification.md`에 명령, 실패 test 이름, 예상과 실제 원인을 기록한다. 앱 파일은 아직 수정하지 않는다.

---

### Task 2: 작업물 상세를 단일 정본으로 재작성

**Files:**

- Modify: `apps/front/src/data/portfolio/features.ts:27-252`
- Modify: `apps/front/src/data/portfolio/feature-details/codi-harness-dx-platform.ts:4-60,445-476`
- Test: `apps/front/src/data/portfolio/feature-detail-quality.test.ts`
- Test: `apps/front/src/components/projects/project-detail-rendering.test.tsx`

- [ ] **Step 1: 하네스 기본 설명과 개요를 역할별로 분리**

`features.ts`의 하네스 `description`과 `overview`를 다음 값으로 교체한다.

```ts
description:
  '팀원과 AI 에이전트가 프로젝트마다 다르게 수행하던 설계·검증·배포 절차를 공통 정책, CLI와 CI/CD로 집행하는 사내 개발 운영 플랫폼입니다.',
overview:
  'Jenkins 비용과 운영 부담을 줄이는 것에서 시작했지만, 실제 문제는 프로젝트가 늘어날 때마다 초기화·배포·검증 기준을 다시 결정하고 팀원과 AI 에이전트마다 다른 방식으로 작업하는 데 있었습니다. 그래서 프로젝트가 시작되고 계획되고 검증되고 배포되는 기준을 하나의 하네스로 묶었고, 2026년 4월부터 실제 프로젝트에 적용하며 패키징과 실행 규칙을 계속 발전시키고 있습니다.',
```

- [ ] **Step 2: 하네스의 사용되지 않는 legacy `content` 제거**

`features.ts`의 `codi-harness-dx-platform` 객체에서 `content: \`...\`` 속성 전체를 제거한다. `team` 뒤에서 객체를 닫고 다음 작업물 객체가 바로 이어지게 한다.

```ts
period: '2026.04 – 현재',
team: 'DX/DevOps 단독 설계 및 구현'
```

다른 7개 작업물의 `content`는 수정하지 않는다.

- [ ] **Step 3: 역할·문제·제약·대안을 승인 문구로 교체**

`codi-harness-dx-platform.ts`의 네 필드를 다음으로 교체한다.

```ts
role: `하네스 아키텍처와 파일 소유권 정책, 프로젝트 초기화·진단과 AI 작업 규칙 자동화, CI/CD·시크릿 구조와 실제 프로젝트 적용·운영 검증을 단독으로 설계하고 구현했습니다. 팀원 3명의 사용 피드백과 실제 프로젝트의 배포·규칙 회귀를 바탕으로 공통 정책, CLI와 진단 체계를 반복 개선했습니다.`,
problem: `프로젝트가 추가될 때마다 저장소 구조, CI/CD workflow, 브랜치·환경 매핑과 시크릿 경로를 다시 설정해야 했습니다. 팀원과 AI 에이전트에 따라 spec 문서화, TDD, 담당 코드 영역, 스킬 선택과 위험 명령 기준도 달라졌습니다. 여러 호텔을 같은 Jenkins 대기열에서 배포할 때는 다른 호텔의 환경변수가 섞이는 문제까지 발생해, 환경과 배포 대상을 실행 단위에서 분리해야 했습니다.`,
constraints: `사내 하네스 원본, 고객 코드와 시크릿은 공개할 수 없었습니다. Claude Code와 Codex는 서로 다른 진입 파일, rule 형식과 hook payload를 사용하므로 같은 정책 문구를 복사하는 것만으로 같은 집행 결과를 보장할 수 없었습니다. 또한 하네스 업데이트는 앱 코드, 프로젝트 설정과 진행 중 작업처럼 다운스트림이 소유한 파일을 덮어써서는 안 됐습니다.`,
alternatives: `Jenkins 설정을 정리해 유지하는 안, GitHub Actions workflow를 프로젝트마다 복사하는 안, 공통 정책·CLI·검증 게이트를 포함한 하네스를 만드는 안을 비교했습니다. Jenkins 유지안은 서버와 플러그인 운영 부담을 남기고, workflow 복사안은 v1에서 경험한 버전 드리프트와 수동 업데이트 전파를 반복합니다. 초기 도입 속도보다 프로젝트가 늘어나도 같은 기준을 안전하게 반복할 수 있는지를 선택 기준으로 두고 하네스 구조를 채택했습니다.`,
```

- [ ] **Step 4: `implementation`을 대표 설계 결정 네 개로 교체**

기존 `### 현재 구조`, `### 발전 기록`, 네 개의 짧은 insight 링크 목록을 아래 Markdown으로 전부 교체한다.

```ts
implementation: `### \`./harness\`와 \`doctor\`

프로젝트가 생길 때마다 저장소 생성, profile 선택, front/back 통합, Infisical 연결, workflow placeholder, 브랜치와 환경 매핑을 사람이 확인하면 문서가 있어도 실행 순서와 결과가 달라질 수 있습니다. 그래서 \`./harness\`를 신규 프로젝트 생성과 기존 프로젝트 수신의 단일 진입점으로 만들고, 선택한 profile을 파일·경로·패키지 매니저 정책에 반영했습니다.

초기화 명령이 성공했다고 현재 상태가 올바르다고 단정하지 않았습니다. \`./harness doctor\`가 필수 파일, lock과 manifest, skill link tree, hook과 project profile을 다시 읽어 계약과 실제 상태의 차이를 진단하게 했습니다. CLI는 원하는 상태를 만들고 doctor는 다시 검증하는 책임 분리입니다.

### \`harness.lock\`과 소유권 경계

v1은 공통 정책과 skill을 프로젝트마다 복사해 첫 설치는 쉬웠지만, 프로젝트별 버전 드리프트와 공통 변경의 수동 전파 비용을 만들었습니다. v2에서는 공통 정책·스크립트·shared skill을 shared로, \`apps/**\`·패키지 파일·project profile·local skill을 project-owned로 분류했습니다.

다운스트림은 \`harness.lock\`으로 사용할 버전을 고정하고 manifest 기준으로 shared 파일만 materialize합니다. shared 파일이라도 로컬 변경이 있으면 자동으로 덮어쓰지 않고, stale 파일 정리도 shared root 안으로 제한했습니다. 업데이트 구현은 복잡해졌지만 공통 변경을 프로젝트 소유권을 침범하지 않고 전달할 수 있게 됐습니다.

### 공통 정책과 런타임 어댑터

팀의 작업 규모, Brainstorming·Planning·Execution·Review·Verification 순서, TDD, 코드 소유권과 위험 명령 기준은 \`.harness/policies/\`를 정본으로 둡니다. Claude Code는 rules·settings·hook으로, Codex는 AGENTS·rules·preflight·PreToolUse hook으로 같은 정책 의미를 각 런타임 형식에 맞게 집행합니다.

패리티는 파일 내용이 같다는 뜻이 아니라 같은 입력에서 같은 허용·차단 결과를 내는 상태로 정의했습니다. \`context-check\`, \`rule-check\`, 실제 hook payload와 Codex transcript replay로 규칙의 존재가 아니라 행동을 회귀 검증합니다. 초기의 GSD → Spec Kit 전환은 문서 양식 통제와 사용자 의견 반영을 강화하기 위한 결정이었고, GStack → Playwright MCP 전환은 약 5주간 사용량을 확인했을 때 browse 외 활용이 크지 않아 실제 브라우저 검증에 집중하기 위한 결정이었습니다.

### 변경 범위 기반 배포와 Infisical 경계

호텔 예약 플랫폼의 pipeline은 공통 코드·패키지·workflow가 바뀌면 전체 호텔을, 특정 호텔 영역만 바뀌면 해당 호텔만 배포 대상으로 계산합니다. 검증된 대상은 matrix로 병렬 실행하고, 운영 브랜치는 운영 검증이 끝난 호텔만 포함합니다.

GitHub Secrets에는 Infisical 접근용 bootstrap secret만 두고 실제 런타임·배포 변수는 프로젝트·환경·목적별 경로에서 조회합니다. 변경 범위와 환경 조회를 실행 단위로 묶은 뒤 5개 호텔 배포는 실행 화면 기준 약 15분에서 약 3분으로 줄었고, 다른 호텔 환경변수가 섞인 동일 유형 문제는 전환 후 관찰되지 않았습니다. 이 결과는 향후 발생 가능성이 0이라는 주장이 아니라 현재 운영 관찰 범위입니다.

### 더 깊이 읽기

- [DX 하네스 v2: 복사형 도구에서 사내 개발 운영 플랫폼까지](/insights/codi-harness-dx-platform-design)`,
```

- [ ] **Step 5: 결과와 회고를 설계 결정에 연결**

`outcomes`와 `retrospective`를 다음으로 교체한다.

```ts
outcomes: `변경 범위를 계산한 병렬 matrix는 5개 호텔의 배포 시간을 실행 화면 기준 약 15분에서 약 3분으로 줄였습니다. Infisical의 환경·목적별 조회 경계를 적용한 뒤 다른 호텔 환경변수가 섞인 동일 유형 문제는 현재까지 다시 관찰되지 않았습니다. CLI·doctor와 공통 정책은 11개 프로젝트에 적용됐고 그중 8개가 실제 운영 중이며 팀원 3명이 사용하고 있습니다. Jenkins 제거 범위는 과거 청구액이 아니라 2026-08-20 AWS 서울 리전 t3.large 2대의 공개 가격으로 계산한 월 $151.84 컴퓨팅 추정치이며, 스토리지·네트워크·세금은 포함하지 않습니다.`,
retrospective: `재사용성은 파일을 복사하기 쉽게 만드는 것이 아니라, 공통 변경을 프로젝트 소유권을 침범하지 않고 안전하게 전파하는 능력이었습니다. guardrail은 개발자와 AI 에이전트를 느리게 만드는 장치가 아니라, 빠르게 작업하더라도 반드시 지켜야 하는 경계를 제공하는 장치였습니다. 다음 개선은 멀티 세션에서 실행 자원과 handoff를 더 안정적으로 격리하고, 언제 컨텍스트를 줄이거나 다음 세션으로 넘길지 자동 판단하는 것입니다. 이 범위는 운영 중인 핵심 기능과 구분한 확장 실험으로 다룹니다.`
```

- [ ] **Step 6: 작업물 data와 server rendering 집중 GREEN 확인**

Run:

```bash
pnpm --dir apps/front exec vitest run \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/components/projects/project-detail-rendering.test.tsx \
  -t '구조화 상세만 본문 정본|대표 설계 네 개'
```

Expected: 작업물 단일 정본과 server rendering 테스트는 PASS한다. 대표 insight 통합 test는 Task 3 전까지 FAIL 상태로 남을 수 있으므로 이 명령에서는 해당 이름을 포함하지 않는다.

- [ ] **Step 7: Task 2 checkpoint 기록**

`verification.md`에 제거한 하네스 legacy `content`, 유지한 여섯 지표·두 스윔레인, 실제 네 설계 heading과 focused test 결과를 기록한다. commit 또는 stage하지 않는다.

---

### Task 3: 네 insight를 대표 발전 서사 하나로 통합

**Files:**

- Modify: `apps/front/src/data/portfolio/insights.ts:27-277`
- Test: `apps/front/src/data/portfolio/feature-detail-quality.test.ts`
- Test: `apps/front/src/data/portfolio/content-quality.test.ts`

- [ ] **Step 1: 짧은 insight 네 객체 제거**

`insights.ts`에서 다음 slug를 가진 객체 네 개를 배열에서 완전히 제거한다.

```text
harness-lock-and-project-ownership-boundary
harness-cli-and-doctor-productization
claude-codex-policy-parity-and-regression-testing
multi-session-testbed-and-context-lifecycle
```

다른 insight 객체의 순서와 데이터는 변경하지 않는다.

- [ ] **Step 2: 대표 insight 메타데이터와 이중 정본 제거**

`codi-harness-dx-platform-design` 객체의 `title`, `excerpt`, `readTime`을 아래 값으로 교체하고 `legacyContent` 속성 전체를 제거한다.

```ts
title: 'DX 하네스 v2: 복사형 도구에서 사내 개발 운영 플랫폼까지',
excerpt:
  'Jenkins 제거에서 시작한 하네스가 파일 복사의 한계를 넘어 소유권 경계, CLI 진단, AI 정책 집행과 멀티 세션 실험을 갖춘 사내 개발 운영 플랫폼으로 발전한 과정입니다.',
readTime: '9 min',
```

- [ ] **Step 3: 대표 insight `content`를 승인된 발전 과정으로 교체**

기존 링크 허브 형태의 짧은 `content`를 아래 Markdown으로 전부 교체한다.

```markdown
## Jenkins 제거가 출발점이었다

v2 하네스는 Jenkins 서버 비용과 운영 부담을 줄이는 작업에서 시작했습니다. 별도 관리 담당자가 없는 환경에서 플러그인과 서버 상태를 유지해야 했고, 여러 프로젝트가 같은 대기열에서 순차 배포됐습니다. 환경변수도 Jenkins UI에 모여 있어 어떤 프로젝트와 환경의 값이 실제 배포에 사용되는지 확인하기 어려웠습니다.

GitHub Actions와 Infisical로 전환하면 서버 운영과 시크릿 보관 문제는 줄일 수 있었습니다. 하지만 workflow 파일을 각 프로젝트에 복사하고 저장소 구조, 브랜치, 환경과 시크릿 경로를 다시 설정한다면 Jenkins만 사라졌을 뿐 사람이 반복해야 하는 판단은 남습니다.

그래서 목표를 CI 도구 교체가 아니라 프로젝트가 시작되고 계획되고 검증되고 배포되는 방식을 반복 가능한 운영 모델로 만드는 것으로 확장했습니다. Jenkins 전환과 Infisical의 상세 구성은 각각의 독립 인사이트에서 다루고, 이 글은 그 이후 하네스 구조가 어떻게 발전했는지에 집중합니다.

## v1: 복사는 설치를 쉽게 했지만 업데이트를 어렵게 했다

v1에서는 공통 정책과 skill을 프로젝트 저장소마다 복사했습니다. 필요한 파일이 한곳에 있어 첫 설치는 쉬웠지만 시간이 지나자 프로젝트별 버전이 달라졌습니다. 공통 규칙을 고쳐도 이미 만들어진 프로젝트에는 자동으로 전달되지 않았고, 여러 저장소에 같은 변경을 다시 복사하고 커밋해야 했습니다.

처음에는 저장소 용량이나 clone 비용을 문제로 생각할 수 있었지만 실제 비용은 버전 드리프트와 업데이트 전파였습니다. 공통 파일을 복사하는 구조는 설치 시점만 같게 만들 뿐 운영 중에도 같은 기준을 유지하게 만들지 못했습니다.

이 경험으로 재사용성의 기준을 바꿨습니다. 같은 파일을 여러 프로젝트에서 사용하는 것보다 공통 변경을 각 프로젝트의 소유권을 침범하지 않고 반복 전달할 수 있어야 했습니다.

## harness.lock: 재사용성을 안전한 변경 전파로 다시 정의하다

v2는 파일을 shared와 project-owned로 구분했습니다. 공통 정책, 하네스 스크립트, shared skill과 검증 규칙은 하네스가 관리합니다. 반대로 앱 코드, workflow, 패키지 파일, project profile과 local skill은 프로젝트가 소유합니다.

다운스트림 프로젝트는 `harness.lock`으로 사용할 하네스 버전을 고정합니다. 설치와 업데이트는 lock과 manifest를 기준으로 shared 파일만 materialize하고 project-owned 파일은 대상에서 제외합니다. shared 파일이라도 로컬 수정이 있으면 자동으로 덮어쓰지 않고 충돌을 알려 사용자가 판단하게 했습니다. upstream에서 제거된 stale 파일도 shared root 안에서만 정리합니다.

이 경계 때문에 업데이트 로직과 검증 항목은 늘었습니다. 그러나 공통 변경을 빠르게 배포한다는 이유로 진행 중인 앱 코드나 프로젝트 설정을 잃는 것보다 비용이 낮다고 판단했습니다. 재사용성은 복사의 편의성이 아니라 안전한 변경 전파 능력이 됐습니다.

## ./harness와 doctor: 체크리스트를 내부 제품으로 만들다

파일 배포 방식이 정리돼도 신규·기존 프로젝트를 같은 상태로 만드는 문제는 남았습니다. 저장소 생성, 팀 권한, split-front-back·next-fullstack 같은 profile, 기존 front/back 저장소 통합, Infisical 연결, workflow placeholder와 브랜치·환경 매핑을 사람이 확인하면 순서와 결과가 달라질 수 있었습니다.

`./harness` CLI는 이 절차를 하나의 진입점으로 묶습니다. 사용자가 project profile을 선택하면 도구가 파일 구조, 허용 경로와 패키지 매니저 정책에 반영합니다. 외부 저장소와 시크릿 bootstrap처럼 실제 상태를 바꾸는 단계는 숨기지 않고 명시적으로 드러냅니다.

초기화 명령이 성공했다는 사실만으로 설치가 올바르다고 판단하지 않았습니다. `./harness doctor`가 필수 파일, lock과 manifest, skill link tree, hook과 profile을 다시 읽어 현재 상태를 진단합니다. CLI는 원하는 상태를 만들고 doctor는 실제 상태가 계약과 같은지 검증합니다. 제품화의 핵심은 명령 하나가 아니라 사람이 기억하던 절차를 다시 실행하고 진단할 수 있는 계약으로 옮긴 것이었습니다.

## AI 작업 규칙: 문서를 복사하는 것에서 행동을 검증하는 것으로

하네스를 실제 프로젝트에 적용하면서 배포 설정만큼 개발 작업 방식의 편차가 중요해졌습니다. 팀원이나 AI 에이전트에 따라 설계 내용을 spec에 남기지 않거나 TDD와 검증 순서를 생략하고, 모노레포에서 담당하지 않은 영역을 수정하거나 위험 명령을 승인 없이 실행할 수 있었습니다.

작업 규모와 Brainstorming·Planning·Execution·Review·Verification 순서, 코드 소유권, 스킬 선택, 브랜치·PR과 위험 명령 기준은 `.harness/policies/`를 정본으로 둡니다. Claude Code는 rules·settings·hook으로, Codex는 AGENTS·rules·preflight·PreToolUse hook으로 같은 의미를 각 런타임 형식에 맞게 집행합니다.

두 런타임은 진입 파일과 hook payload, 명령 해석 방식이 다르므로 같은 문장을 복사해도 같은 행동을 보장하지 못했습니다. 패리티를 파일 내용의 동일성이 아니라 같은 입력에서 같은 허용·차단 결과를 내는 상태로 정의했습니다. `context-check`, `rule-check`, 실제 hook payload fixture와 Codex transcript replay로 규칙 파일의 존재가 아니라 관찰 가능한 행동을 회귀 검증합니다.

도구 선택도 이 기준에 맞춰 바뀌었습니다. GSD는 문서 양식을 직접 통제하고 작성 과정에 사용자 의견을 더 반영하기 위해 Spec Kit으로 전환했습니다. GStack은 약 5주간 사용량을 확인했을 때 browse 외 활용이 크지 않아, 필요한 브라우저 검증을 프로젝트 흐름에 직접 구성하는 Playwright MCP로 전환했습니다. 도구 이름을 유지하는 것보다 실제 작업 계약을 더 잘 집행하는지가 선택 기준이었습니다.

## 멀티 세션: 규칙 통일에서 실행 환경 격리로 확장하다

정책과 단일 세션 흐름이 안정되자 여러 에이전트가 같은 목표를 나눠 수행하는 운영으로 범위를 넓혔습니다. 이 테스트베드는 모든 하네스 프로젝트의 기본 기능이 아니라 PHP 그누보드 데이터베이스 마이그레이션 프로젝트에서 약 2주 동안 검증한 운영 확장 실험입니다.

planner는 작업 경계와 공유 계약을 정하고 worker는 독립 구현과 검증을 수행하며 shipper는 결과와 남은 위험을 모읍니다. 파일 경로만 분리해서는 Playwright 데이터가 섞일 수 있어 각 worker에 worktree뿐 아니라 container, database schema와 port를 따로 할당했습니다.

세션을 넘길 때는 채팅을 정본으로 사용하지 않습니다. 목표, 결정, 테스트 명령과 결과를 feature spec, plan과 미완료 task에 남기고 다음 세션은 필요한 상태만 읽어 재개합니다. 아직 해결되지 않은 문제는 언제 context를 clear하거나 compact할지 자동으로 판단하는 것입니다. 너무 이르면 판단 이유를 잃고, 너무 늦으면 관련 없는 기록이 다음 실행을 흐립니다.

현재 결론은 세션 수보다 격리된 실행 자원, 명시적인 handoff와 durable state의 품질이 병렬 작업의 신뢰도를 결정한다는 것입니다.

## 결과: 하네스가 관리하는 것은 파일이 아니라 반복 가능한 작업 방식이다

운영 중인 핵심 구조는 `harness.lock`과 소유권 경계, `./harness`와 doctor, 공통 정책과 Claude/Codex 런타임 집행입니다. 이 구조는 11개 프로젝트에 적용됐고 그중 8개가 실제 운영 중이며 팀원 3명이 사용하고 있습니다.

실제 적용 결과는 초기화 파일이 존재한다는 사실보다 같은 profile과 검증 기준을 다시 진단할 수 있다는 데 있습니다. 공통 변경은 프로젝트 소유 파일을 피해 전달되고, 정책 변경은 두 런타임의 행동 테스트를 다시 통과해야 완료됩니다.

멀티 세션과 컨텍스트 수명주기 자동화는 운영 중인 핵심 구조와 같은 성숙도로 주장하지 않습니다. 약 2주의 운영 확장 실험에서 실행 자원 격리와 durable handoff의 필요성을 확인한 단계이며, context 축소 시점의 자동화는 다음 개선으로 남아 있습니다.

## 회고

재사용성은 파일을 복사하기 쉽게 만드는 것이 아니라 공통 변경을 프로젝트 소유권을 침범하지 않고 안전하게 전파하는 능력이었습니다. CLI의 가치도 명령 수가 아니라 사람이 기억하던 절차를 실행하고 다시 진단할 수 있게 만든 데 있었습니다.

guardrail은 개발자와 AI 에이전트를 느리게 만드는 장치가 아닙니다. 빠르게 작업하더라도 반드시 지켜야 하는 경계를 제공하고, 정책이 바뀌었을 때 같은 행동을 다시 검증할 수 있게 만드는 장치입니다.

내부 도구의 가치는 기능 수가 아니라, 팀이 같은 기준으로 안전하게 반복할 수 있는 일을 얼마나 늘렸는가로 판단해야 합니다. Jenkins 제거는 시작점이었고 하네스가 최종적으로 관리하게 된 것은 파일이 아니라 반복 가능한 작업 방식이었습니다.
```

TypeScript template literal에 넣을 때 본문 안의 backtick은 `\``로 escape한다. 위 Markdown의 문장·heading 순서·운영 성숙도 구분은 변경하지 않는다.

- [ ] **Step 4: insight data 계약 GREEN 확인**

Run:

```bash
pnpm --dir apps/front exec vitest run \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/data/portfolio/content-quality.test.ts \
  -t '대표 insight 하나|장문 본문|Markdown 소제목'
```

Expected: 대표 insight 계약, 모든 insight 장문/heading 계약이 PASS한다. 제거된 네 객체 때문에 유지 insight가 잘못 삭제되지 않았는지도 전체 registry loop가 확인한다.

- [ ] **Step 5: 삭제 slug와 남은 내부 참조 정적 검사**

Run:

```bash
rg -n \
  'harness-lock-and-project-ownership-boundary|harness-cli-and-doctor-productization|claude-codex-policy-parity-and-regression-testing|multi-session-testbed-and-context-lifecycle' \
  apps/front/src apps/front/e2e
```

Expected: 제거 route를 404로 검증하는 E2E의 slug 배열 외 production data·본문에는 0건이다. Test fixture의 의도된 404 참조만 남았음을 경로별로 기록한다.

- [ ] **Step 6: Task 3 checkpoint 기록**

`verification.md`에 제거 객체 4개, 대표 title·readTime·본문 heading 8개, `legacyContent` 제거와 focused GREEN 결과를 기록한다. commit 또는 stage하지 않는다.

---

### Task 4: 통합 렌더링과 공개 경로를 GREEN으로 검증

**Files:**

- Test: `apps/front/src/data/portfolio/content-quality.test.ts`
- Test: `apps/front/src/data/portfolio/feature-detail-quality.test.ts`
- Test: `apps/front/src/components/projects/project-detail-rendering.test.tsx`
- Test: `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`
- Modify only if a test exposes a real renderer defect: `apps/front/src/components/projects/ProjectDetailContent.tsx`

- [ ] **Step 1: focused unit/server 전체 GREEN 실행**

Run:

```bash
pnpm --dir apps/front exec vitest run \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/components/projects/project-swimlane-layout.test.ts \
  src/components/projects/project-detail-rendering.test.tsx
```

Expected: 4 files, 65 tests가 PASS한다. 실제 test 수가 Spec Kit task 생성 과정에서 달라지면 각 파일과 실제 합계를 그대로 기록하고, 실패를 합계 차이로 숨기지 않는다.

- [ ] **Step 2: targeted Playwright GREEN 실행**

Run:

```bash
pnpm --dir apps/front exec playwright test \
  e2e/codi-harness-portfolio-detail.spec.ts \
  --grep '대표 설계 네 개|통합 대표 insight|제거된 네 insight'
```

Expected: 3 tests PASS. 대표 링크는 같은 탭으로 이동하고 새 heading 8개를 표시하며, 제거 route 4개는 404, 유지 infra route 3개는 200이다.

- [ ] **Step 3: 하네스 전체 E2E GREEN 실행**

Run:

```bash
pnpm --dir apps/front exec playwright test e2e/codi-harness-portfolio-detail.spec.ts
```

Expected: 14 tests PASS. 기존 두 스윔레인의 6/3 및 5/3 edge, 4개 viewport overflow, light/dark contrast, keyboard scroll, no-demo와 8개 project route 계약을 유지한다.

- [ ] **Step 4: 컴포넌트 변경 여부 결정**

데이터 변경만으로 Step 1~3이 통과하면 component 파일을 수정하지 않는다. 실패가 Markdown heading, 내부 link 또는 related insight 조건부 렌더링의 실제 component 결함일 때만 실패 test를 보존한 상태로 최소 수정하고 영향받은 test를 다시 실행한다.

- [ ] **Step 5: 브라우저 관찰 기록**

`verification.md`에 다음 실제 관찰을 기록한다.

```text
- 작업물 상세에서 대표 설계 heading 4개가 모두 보임
- 대표 insight h1, 9 min과 발전 heading 8개가 순서대로 보임
- 제거 route 4개 HTTP 404
- 유지 infra route 3개 HTTP 200
- 320/768/1024/1440 document overflow <= 1px
- 두 diagram ArrowRight 내부 scroll 증가
- 하네스 demo/준비 중 CTA 0개
- 다른 7개 작업물 legacy body 유지
```

---

### Task 5: 전체 품질 gate, 리뷰와 상태 수렴

**Files:**

- Modify: `specs/004-codi-harness-content-consolidation/verification.md`
- Modify: `specs/004-codi-harness-content-consolidation/tasks.md`
- Modify: `ROADMAP.md`
- Review scope: Task 1~4의 모든 modified file

- [ ] **Step 1: 전체 검증 명령을 정책 순서대로 실행**

Run each command separately in this exact order:

```bash
pnpm --dir apps/front exec tsc --noEmit
pnpm --dir apps/front test
pnpm --dir apps/front run lint
pnpm --dir apps/front run build
mise run //apps/front:e2e
git diff --check
```

Expected:

- typecheck: exit 0
- unit: 모든 test PASS
- full lint: 기존 저장소 전역 Prettier 기준선 때문에 실패할 수 있으며 실제 problem 수를 기록
- build: exit 0, 제거된 네 insight static path가 생성되지 않고 대표 path는 생성
- app E2E: 모든 scenario PASS
- diff-check: exit 0

full lint가 기존 기준선으로 실패해도 build와 E2E를 생략하지 않는다. 관련 없는 사용자 파일을 일괄 포맷하지 않는다.

- [ ] **Step 2: 기능 범위 전체 ESLint 실행**

Run:

```bash
pnpm --dir apps/front exec eslint \
  src/data/portfolio/features.ts \
  src/data/portfolio/feature-details/codi-harness-dx-platform.ts \
  src/data/portfolio/insights.ts \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/components/projects/project-detail-rendering.test.tsx \
  e2e/codi-harness-portfolio-detail.spec.ts
```

Expected: exit 0. 만약 `features.ts`와 `insights.ts`의 unrelated legacy Prettier baseline만 실패하면 `prettier/prettier: off`로 비포맷 규칙을 별도 실행하고, 이번에 작성한 범위는 exact formatting check로 확인한다. 파일 전체를 자동 포맷하지 않는다.

- [ ] **Step 3: 최종 코드·콘텐츠 리뷰**

Reviewer에게 다음 질문을 전달한다.

```text
Feature 004를 읽기 전용으로 검토한다. Critical/Important/Minor를 파일:라인 근거와 함께 보고한다.
1. 작업물 상세만으로 문제·역할·대표 설계 4개·결과를 이해할 수 있는가?
2. 대표 insight가 v1→lock→CLI/doctor→policy parity→multi-session 순서를 인과적으로 설명하는가?
3. 운영 중 구조, 실제 적용 결과와 확장 실험을 혼동하지 않는가?
4. 숨은 legacy content/legacyContent 또는 제거 slug production 참조가 남았는가?
5. 기존 지표, 스윔레인, demo 없음, 7개 legacy project와 유지 infra insight에 회귀가 있는가?
```

Critical 또는 Important가 있으면 실패 test를 먼저 추가하거나 보존하고 최소 수정한 뒤 Step 1~2와 영향받은 E2E를 재실행한다.

- [ ] **Step 4: `speckit-converge` 실행**

`specs/004-codi-harness-content-consolidation/spec.md`, `plan.md`, `tasks.md`, 헌법과 현재 코드를 대조한다. finding이 없으면 tasks를 byte-for-byte 유지하고 다음 결과를 기록한다.

```text
✅ Converged — the implementation satisfies the spec, plan, and tasks.
```

finding이 있으면 append-only Convergence phase를 추가하고 `$speckit-implement`로 완료한 뒤 다시 수렴한다.

- [ ] **Step 5: feature 상태 동기화**

Run:

```bash
mise run feature:status:sync
```

Expected: task가 존재하면 deterministic adjacent transition만 `--apply`한다. 현재 저장소처럼 task가 없으면 정확한 `no task` 오류를 `verification.md`에 기록하고 `ROADMAP.md`의 Completed에 `하네스 콘텐츠 보강 및 인사이트 통합`을 수동 반영한다.

- [ ] **Step 6: 최종 완료 감사**

Run:

```bash
rg -n "^- \[ \]" specs/004-codi-harness-content-consolidation/tasks.md
git diff --check
```

Expected:

- unchecked task: 0건(`rg` exit 1, output 없음)
- diff-check: exit 0
- removed production slug reference: 0건
- 대표 insight route: 1개
- 하네스 legacy `content`: 없음
- 대표 insight `legacyContent`: 없음
- commit, stage, push, merge, deploy: 수행하지 않음

`verification.md`에 최종 결과를 기록하고 `.harness/state/current-size`를 `Small`로 되돌린다.

---

## Plan Self-Review

- 승인된 작업물 상세 11개 구간 중 실제 데이터 변경이 필요한 설명·개요·역할·문제·제약·대안·설계·결과·회고·대표 링크를 Task 2가 모두 포함한다.
- 승인된 대표 insight 8개 발전 단계를 Task 3의 완성된 Markdown이 모두 포함한다.
- 제거 slug 4개, 유지 infra slug 3개와 canonical slug 1개를 data·E2E에서 직접 검증한다.
- 연결형 스윔레인, 지표와 7개 legacy project는 변경하지 않고 Task 4에서 회귀 검증한다.
- placeholder, 구현자 선택 분기와 정의되지 않은 함수는 없다.
- TypeScript property는 현재 `SeedFeature`, `FeatureDetailDto`, `SeedInsight`와 일치한다.
- 저장소의 Spec Kit ownership과 implement no-commit 규칙을 일반 writing-plans commit 관례보다 우선했다.
