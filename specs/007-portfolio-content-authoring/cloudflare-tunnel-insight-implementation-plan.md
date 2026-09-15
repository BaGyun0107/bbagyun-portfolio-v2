# Cloudflare Tunnel Insight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 승인된 Cloudflare Tunnel 인사이트를 현재 Bastion 운영 구조와 사실 경계에 맞게 반영하고, 연결 제목·시각 자료·양방향 공개 동작을 회귀 계약으로 고정한다.

**Architecture:** 기존 slug와 `project-case` 출처는 유지한다. 데이터 계층의 승인 문안과 `provided: data-flow` metadata를 정본으로 두고, 단위 계약이 역할·사건·현재 구조·수치·한계를 검사한다. 작업물의 기존 CI/CD 스윔레인은 유지하며, 인사이트 visual은 2026년 4월 실패에서 5월 Bastion 구조로 발전한 경계만 다룬다.

**Tech Stack:** TypeScript, Next.js 16 App Router, Vitest, Playwright, Markdown data seed, Spec Kit verification records

---

## File map

- Modify `apps/front/src/data/portfolio/insights.ts`: 승인 제목·요약·본문과 `provided: data-flow` metadata.
- Modify `apps/front/src/data/portfolio/studies.ts`: 관련 읽기 링크의 표시 제목만 승인 제목으로 동기화.
- Modify `apps/front/src/data/portfolio/content-quality.test.ts`: 사건·Bastion·운영 수치·한계·금지 주장 계약.
- Modify `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`: exact migration 제목, 의미 계약, visual 계약.
- Modify `apps/front/src/data/portfolio/feature-detail-quality.test.ts`: 유지 인프라 insight fixture의 제목·대표 근거.
- Modify `apps/front/e2e/portfolio-insight-contract.spec.ts`: 목록·왕복 fixture와 Cloudflare 공개 본문·data-flow 검사.
- Modify `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`: 연결 인사이트 제목·대표 근거 fixture.
- Modify `docs/portfolio-interviews/2026-08-20-codi-harness-v2.md`: 2026-08-27 후속 Q&A와 콘텐츠 승인 기록.
- Modify `specs/007-portfolio-content-authoring/data-model.md`: Cloudflare visual을 `recommended`에서 `provided`로 전환.
- Read/Verify `specs/007-portfolio-content-authoring/cloudflare-tunnel-insight-design.md`: public copy approval과 승인 문안 출처가 확정 상태인지 확인.
- Read exactly: `specs/007-portfolio-content-authoring/cloudflare-tunnel-insight-approved-copy.md`: 승인된 title, excerpt와 content 정본.
- Modify `specs/007-portfolio-content-authoring/verification.md`: 의미·visual·공개 검증 matrix와 실제 명령 결과.
- Preserve `apps/front/test-results/cloudflare-tunnel-insight-approved.png`: 최종 전체 페이지 캡처.

현재 공유 작업트리에 관련 없는 변경이 많으므로 이 계획은 commit 단계를 포함하지 않는다. commit, push, merge와 deploy는 별도 사용자 요청 전까지 수행하지 않는다.

### Task 1: 승인된 사실 계약을 RED로 고정

**Files:**
- Modify: `apps/front/src/data/portfolio/content-quality.test.ts:548`
- Modify: `apps/front/src/data/portfolio/insight-editorial-quality.test.ts:17-310`
- Modify: `apps/front/src/data/portfolio/feature-detail-quality.test.ts:10-28`

- [x] **Step 1: 기존 Cloudflare 계약을 현재 사건·운영 구조 계약으로 교체**

`content-quality.test.ts`의 Cloudflare test를 다음 의미를 모두 검사하도록 교체한다.

```ts
it('Cloudflare 글은 초기 실패에서 Bastion 권한 경계로 발전한 관찰 범위를 구분한다', () => {
  const insight = insightBySlug('cloudflare-tunnel-zero-trust-cicd-and-troubleshooting');
  const study = getAllStudies().find(({ slug }) => slug === 'ai-dx-harness-starter-kit');
  const text = `${insight?.excerpt ?? ''}\n${insight?.content ?? ''}`;
  const visual = insight?.editorial?.visualAssessment;

  expect(insight?.title).toBe('Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다');
  expect(insight?.featureSlug).toBe('codi-harness-dx-platform');
  expect(study?.content).toContain(
    '[Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다](/insights/cloudflare-tunnel-zero-trust-cicd-and-troubleshooting)'
  );

  expect(text).toMatch(/직접[^.\n]*(?:설계|구현)/);
  expect(text).toMatch(/direct SSH[^#]*(?:22번 포트|IP 허용 범위)/i);
  expect(text).toMatch(/Self-hosted GitHub Actions runner[^.\n]*검토한 것은 아니/);
  expect(text).toMatch(/2026년 4월[^#]*이벤트 로그[^#]*WAF[^#]*같은 workflow[^#]*통과/);
  expect(text).toMatch(/WAF 규칙 자체[^.\n]*Service Token[^.\n]*아닙니다/);
  expect(text).toMatch(/같은 hostname[^#]*의도하지 않은 connector[^#]*SSH 연결 단계[^#]*실패/);
  expect(text).toMatch(/실제 파일 전송이나 배포 명령[^.\n]*전[^.\n]*잘못된 서버[^.\n]*배포되지/);
  expect(text).toMatch(/Cloudflare[^.\n]*내부[^.\n]*알고리즘[^.\n]*단정하지/);
  expect(text).toMatch(/배포 대상별[^.\n]*hostname[^#]*정상 완료/);
  expect(text).toMatch(/2026년 5월[^#]*ProxyCommand[^#]*ProxyJump/);
  expect(text).toMatch(/Service Token[^#]*shell 실행 차단[^#]*PermitOpen[^#]*프로젝트×배포 서버별 SSH 키/);
  expect(text).toMatch(/2026-08-27[^.\n]*9개 프로젝트[^.\n]*5대 서버/);
  expect(text).toMatch(/동일 유형 문제[^.\n]*다시 발견하지 못/);
  expect(text).toMatch(/사용자 보고값과 관찰 범위[^.\n]*장애율[^.\n]*아닙니다/);
  expect(text).toMatch(/Bastion[^.\n]*새 배포[^.\n]*막/);
  expect(text).toMatch(/실제 Bastion 중단이나 장애 상황[^.\n]*테스트[^.\n]*아닙니다/);
  expect(text).toMatch(/PermitOpen[^#]*공개키 등록[^#]*Infisical 경로[^#]*자동화/);

  expect(text).not.toMatch(/잘못된 서버에 (?:실제 )?(?:서비스가 )?배포됐|L4|L7|round[- ]robin/i);
  expect(text).not.toMatch(/Bastion[^.\n]*(?:중단 테스트|장애)[^.\n]*(?:확인|관찰)했/);
  expect(text).not.toMatch(/Self-hosted GitHub Actions runner[^.\n]*(?:비교|검토)했/);

  expect(visual?.decision).toBe('provided');
  if (visual?.decision !== 'provided') return;
  expect(visual.kind).toBe('data-flow');
  expect(visual.question).toMatch(/외부 진입 인증.*내부 배포 대상 권한/);
  expect(visual.textAlternative).toMatch(/2026년 4월[^.]*2026년 5월[^.]*9개 프로젝트[^.]*5대 서버/);
  expect(visual.nonDuplicationReason).toMatch(/작업물[^.]*스윔레인[^.]*인사이트[^.]*실패[^.]*권한 경계/);
});
```

- [x] **Step 2: editorial exact fixture와 의미 계약을 교체**

`insight-editorial-quality.test.ts`에서 Cloudflare target을 다음 값으로 바꾼다.

```ts
{
  slug: 'cloudflare-tunnel-zero-trust-cicd-and-troubleshooting',
  type: 'project-case',
  sourceSlug: 'codi-harness-dx-platform',
  visualDecision: 'provided',
  visualKind: 'data-flow',
  rationaleContext: /Cloudflare|WAF|Bastion|인증|권한|배포/
}
```

exact inventory 제목은 `Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다`로 바꾸고 의미 계약은 다음으로 교체한다.

```ts
{
  slug: 'cloudflare-tunnel-zero-trust-cicd-and-troubleshooting',
  meanings: {
    role: /Cloudflare Tunnel[^#]*Bastion[^#]*직접 설계하고 구현/,
    problem: /2026년 4월[^#]*WAF[^#]*같은 hostname[^#]*SSH 연결 단계[^#]*실패/,
    constraint: /잘못된 서버[^.\n]*배포되지는 않았|내부[^.\n]*알고리즘[^.\n]*단정하지/,
    implementation: /Service Token[^#]*PermitOpen[^#]*프로젝트×배포 서버별 SSH 키/,
    outcome: /2026-08-27[^.\n]*9개 프로젝트[^.\n]*5대 서버[^#]*동일 유형 문제[^.\n]*다시 발견하지 못/,
    limitation: /Bastion[^.\n]*새 배포[^.\n]*막[^#]*중단[^.\n]*테스트[^.\n]*아닙니다/
  }
}
```

- [x] **Step 3: 유지 인프라 fixture를 승인 제목과 대표 문장으로 교체**

`feature-detail-quality.test.ts`의 Cloudflare fixture를 다음으로 바꾼다.

```ts
{
  slug: 'cloudflare-tunnel-zero-trust-cicd-and-troubleshooting',
  title: 'Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다',
  bodySnippet:
    'Tunnel과 Bastion을 프로젝트마다 새로 만들지 않고 공용으로 재사용하되, 한 프로젝트의 SSH 키가 다른 서버의 배포 권한으로 이어지지 않도록'
}
```

- [x] **Step 4: focused test를 실행해 RED 확인**

Run:

```bash
cd apps/front
pnpm exec vitest run src/data/portfolio/content-quality.test.ts src/data/portfolio/insight-editorial-quality.test.ts src/data/portfolio/feature-detail-quality.test.ts
```

Expected: 기존 제목, 미래 후보인 Bastion, `recommended` visual, 9개/5대와 승인 본문 부재 때문에 FAIL. 실패·통과 건수를 verification에 기록한다.

### Task 2: 승인 문안과 data-flow metadata 반영

**Files:**
- Modify: `apps/front/src/data/portfolio/insights.ts:1202-1264`
- Modify: `apps/front/src/data/portfolio/studies.ts:121`
- Modify: `specs/007-portfolio-content-authoring/data-model.md:153`
- Verify: `specs/007-portfolio-content-authoring/cloudflare-tunnel-insight-design.md:1-260`

- [x] **Step 1: title, excerpt와 visual metadata를 승인값으로 교체**

`insights.ts`의 기존 slug와 날짜·featureSlug는 유지하고 다음 값을 사용한다.

```ts
title: 'Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다',
excerpt:
  'GitHub Actions에서 사내 서버로 배포하기 위해 Cloudflare Tunnel을 도입했지만, WAF 차단과 같은 hostname의 connector 혼선을 겪었습니다. 실패 단계를 직접 분리해 확인한 뒤, 공용 진입점과 서버별 권한을 나눈 Bastion 구조로 발전시킨 기록입니다.',
editorial: {
  type: 'project-case',
  visualAssessment: {
    decision: 'provided',
    kind: 'data-flow',
    rationale:
      '2026년 4월의 WAF·connector 실패에서 5월의 공용 Bastion과 서버별 권한 분리로 발전한 관계를 하나의 data-flow로 제공합니다.',
    question: '초기 실패 뒤 외부 진입 인증과 내부 배포 대상 권한을 어떻게 분리했는가?',
    textAlternative:
      '2026년 4월에는 GitHub Actions 요청이 WAF에서 차단되고 같은 hostname의 connector가 의도하지 않은 방향으로 연결돼 SSH 단계에서 실패했습니다. 2026년 5월부터는 Cloudflare Access와 Bastion을 공용 진입점으로 두고 PermitOpen과 프로젝트×서버 SSH 키로 대상을 분리했으며, 2026-08-27 기준 9개 프로젝트가 5대 서버로 배포됩니다.',
    nonDuplicationReason:
      '작업물의 CI/CD 스윔레인은 현재 배포 실행 순서를 보여 주고, 인사이트 data-flow는 초기 실패에서 외부 인증과 내부 대상 권한 경계로 발전한 과정만 비교합니다.'
  }
}
```

- [x] **Step 2: content를 승인된 전체 공개 문안으로 교체**

`cloudflare-tunnel-insight-approved-copy.md`의 Title, Excerpt와 Content를 문구 변경
없이 사용한다. 이 파일이 채팅 transcript 대신 승인 문안의 정본이다. 다음 일곱 제목이
모두 포함되어야 한다.

```text
## 22번 포트를 열지 않는 것만으로는 충분하지 않았다
## 이벤트 로그로 WAF 차단을 확인했다
## 같은 hostname의 connector가 배포 대상을 흐렸다
## 대상별 hostname은 해결책이면서 다음 운영 부담이 됐다
## 공용 진입점과 내부 대상 권한을 분리했다
## 9개 프로젝트를 5대 서버에 배포하고 있다
## Bastion도 새로운 운영 경계가 됐다
```

본문의 data-flow에는 아래 관계를 그대로 포함한다.

```text
2026년 4월 초기 구성

GitHub Actions
    ├─ Cloudflare WAF 차단
    │      └─ 이벤트 로그 확인
    │             └─ hostname 예외 적용 후 접근 단계 통과
    └─ 같은 hostname
           ├─ connector A
           └─ connector B
                  └─ 의도하지 않은 방향으로 연결
                         └─ SSH 단계 실패
                                └─ 실제 배포 없음

2026년 5월 이후

GitHub Actions
    ├─ Bastion hostname WAF 예외
    ├─ Cloudflare Access
    │      └─ Service Token 인증
    ├─ Cloudflare Tunnel
    └─ Bastion
           ├─ 배포 전용 사용자 shell 실행 차단
           ├─ SSH 키 인증
           └─ PermitOpen 대상 제한
                  └─ ProxyJump
                         └─ 배포 서버
                                └─ 프로젝트 × 배포 서버별 SSH 키 인증
```

승인된 전체 산문을 요약하거나 다시 작성하지 않는다. 다음 근거 제한 문장도 승인
정본에서 그대로 복사한다.

```text
실제 파일 전송이나 배포 명령 실행 전의 실패였기 때문에 잘못된 서버에 서비스가 배포되지는 않았습니다.
또한 Cloudflare가 내부에서 어떤 알고리즘으로 connector를 선택했는지는 직접 확인하지 못했으므로 특정 라우팅 방식으로 단정하지 않습니다.
이는 운영 과정에서 확인한 사용자 보고값과 관찰 범위입니다. 시스템 전체의 장애율을 집계한 결과나 Cloudflare Tunnel의 보안·가용성을 보장하는 수치는 아닙니다.
실행 중인 서비스는 Bastion과 런타임 통신을 하지 않지만, 실제 Bastion 중단이나 장애 상황을 테스트해 확인한 결과는 아닙니다.
```

- [x] **Step 3: 공부 기록의 관련 읽기 제목 동기화**

`studies.ts`의 Cloudflare 링크 label만 다음으로 바꾼다. study를 두 번째 origin으로 만들거나 학습 본문 전체를 재작성하지 않는다.

```md
[Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다](/insights/cloudflare-tunnel-zero-trust-cicd-and-troubleshooting)
```

- [x] **Step 4: data-model fixture와 approval 상태 동기화**

`data-model.md` row:

```md
| `cloudflare-tunnel-zero-trust-cicd-and-troubleshooting` | project-case | `codi-harness-dx-platform` | provided | data-flow |
```

`cloudflare-tunnel-insight-design.md` header의 `Public copy approval`이 이미 `granted on 2026-08-27`이고 승인 문안 정본 경로와 사용자 승인 범위가 기록되어 있는지 확인한다. drift가 있을 때만 승인 기록과 일치하도록 고친다.

- [x] **Step 5: focused test를 실행해 GREEN 확인**

Run: Task 1 Step 4와 같은 Vitest 명령.

Expected: 3 files PASS. 실제 test 수를 verification에 기록한다.

### Task 3: 인터뷰 정본과 연결 fixture 동기화

**Files:**
- Modify: `docs/portfolio-interviews/2026-08-20-codi-harness-v2.md`
- Modify: `apps/front/e2e/portfolio-insight-contract.spec.ts`
- Modify: `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`

- [x] **Step 1: 2026-08-27 후속 인터뷰 기록 추가**

다음 항목을 별도 섹션으로 기록한다.

```md
## 2026-08-27 후속 인터뷰: Cloudflare Tunnel과 Bastion

- 중심축: 초기 WAF·connector 실패에서 현재 Bastion 경계로 발전한 과정
- 2026-04: direct SSH와 Tunnel 비교, 이벤트 로그 기반 WAF 확인, target hostname 임시 분리
- 영향: SSH 전 실패, 잘못된 서버에 실제 배포 없음
- 2026-05: 공용 Tunnel·Access·Bastion과 대상별 PermitOpen·SSH 키로 전환
- 2026-08-27: 9개 프로젝트가 5대 서버로 배포, 동일 유형 문제 미관찰
- 한계: Bastion 중단 테스트·실제 장애 없음, 배포 단일 장애점은 구조적 판단
- 회고: PermitOpen·키·Infisical 연결 자동화 우선, 이후 가용성 검증
- visual: provided data-flow, 작업물 swimlane은 retain
- content approval: 제목·요약·전체 본문 사용자 승인
```

코드 확인 근거와 사용자 보고·운영 관찰 근거를 분리하고 실제 hostname, IP, 토큰과 키를 넣지 않는다.

- [x] **Step 2: E2E 목록·왕복 fixture 제목 교체**

두 E2E 파일의 기존 Cloudflare 제목을 모두 `Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다`로 바꾸고 대표 body snippet을 다음으로 교체한다.

```ts
bodySnippet:
  'Tunnel과 Bastion을 프로젝트마다 새로 만들지 않고 공용으로 재사용하되, 한 프로젝트의 SSH 키가 다른 서버의 배포 권한으로 이어지지 않도록'
```

- [x] **Step 3: Cloudflare 공개 본문 전용 E2E 추가**

`portfolio-insight-contract.spec.ts`에 다음 검사를 추가한다.

```ts
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
  await expect(article.getByText(/2026-08-27 기준 9개 프로젝트.*5대 서버/)).toBeVisible();

  const flow = article.locator('pre').filter({ hasText: '2026년 4월 초기 구성' });
  await expect(flow).toContainText('실제 배포 없음');
  await expect(flow).toContainText('Service Token 인증');
  await expect(flow).toContainText('PermitOpen 대상 제한');
  await expect(flow).toContainText('프로젝트 × 배포 서버별 SSH 키 인증');

  await expect(article.getByText(/잘못된 서버에 서비스가 배포되지는 않았습니다/)).toBeVisible();
  await expect(article.getByText(/실제 Bastion 중단이나 장애 상황을 테스트해 확인한 결과는 아닙니다/)).toBeVisible();
});
```

- [x] **Step 4: E2E test discovery 확인**

Run:

```bash
cd apps/front
pnpm exec playwright test --list
```

Expected: Cloudflare 전용 test가 목록에 있고 permanent suite total이 기존 58보다 1 증가한다.

### Task 4: 단위·타입·변경 범위 정적 검증

**Files:**
- Verify only

- [x] **Step 1: 전체 Vitest 실행**

Run: `cd apps/front && pnpm test`

Expected: 5 files PASS. 실제 test 수 기록.

- [x] **Step 2: TypeScript 실행**

Run: `cd apps/front && pnpm exec tsc --noEmit`

Expected: exit 0.

- [x] **Step 3: 변경 파일 ESLint 실행**

Run:

```bash
cd apps/front
pnpm exec eslint src/data/portfolio/insights.ts src/data/portfolio/studies.ts src/data/portfolio/content-quality.test.ts src/data/portfolio/insight-editorial-quality.test.ts src/data/portfolio/feature-detail-quality.test.ts e2e/portfolio-insight-contract.spec.ts e2e/codi-harness-portfolio-detail.spec.ts
```

Expected: 새 Cloudflare 구간과 나머지 변경 파일 PASS. `insights.ts`가 기존 전역 Prettier baseline으로 실패하면 line을 기록하고 이번 block 밖인지 확인한다. `--fix`로 관련 없는 본문을 포맷하지 않는다.

- [x] **Step 4: diff whitespace 확인**

Run: `git diff --check`

Expected: exit 0.

### Task 5: fresh production E2E와 화면 검수

**Files:**
- Create temporarily: `apps/front/playwright.prod.config.ts`
- Preserve: `apps/front/test-results/cloudflare-tunnel-insight-approved.png`
- Delete after run: `apps/front/playwright.prod.config.ts`

- [x] **Step 1: production build**

Run: `cd apps/front && pnpm run build`

Expected: build PASS, 38 static pages. 기존 multiple-lockfile warning은 기록하되 lockfile을 수정하지 않는다.

- [x] **Step 2: free port 확인 후 production server 실행**

1104를 사용하지 않는다. 1116이 비어 있으면 다음을 실행한다.

```bash
cd apps/front
pnpm start --port 1116 --hostname 127.0.0.1
```

Expected: `http://127.0.0.1:1116` ready. 포트가 사용 중이면 1117처럼 확인된 별도 포트를 사용하고 이후 명령의 baseURL도 맞춘다.

- [x] **Step 3: 임시 production config 작성**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://127.0.0.1:1116'
  }
});
```

파일 생성·삭제는 `apply_patch`를 사용한다.

- [x] **Step 4: permanent E2E 전체 실행**

Run:

```bash
cd apps/front
pnpm exec playwright test --config=playwright.prod.config.ts --reporter=line
```

Expected: permanent suite 전체 PASS. Cloudflare route, 프로젝트↔인사이트 keyboard 왕복, 320/768/1024/1440px overflow가 포함된다.

- [x] **Step 5: 승인 화면 캡처**

Run:

```bash
cd apps/front
pnpm exec playwright screenshot --viewport-size="1440,1000" --full-page --wait-for-selector="h1" --wait-for-timeout=500 http://127.0.0.1:1116/insights/cloudflare-tunnel-zero-trust-cicd-and-troubleshooting test-results/cloudflare-tunnel-insight-approved.png
```

Expected: 전체 페이지 이미지 생성. `view_image`로 제목, 표, data-flow, 한계, 연결 카드가 읽히는지 확인한다.

- [x] **Step 6: 임시 자원 정리**

`apply_patch`로 `playwright.prod.config.ts`를 삭제하고 production server를 중단한다. `lsof -nP -iTCP:1116 -sTCP:LISTEN`으로 종료를 확인한다. 1104 server와 `.next/dev` lock은 건드리지 않는다.

### Task 6: Feature 007 검증 기록과 상태 동기화

**Files:**
- Modify: `specs/007-portfolio-content-authoring/verification.md`

- [x] **Step 1: project-case 의미 matrix 기록**

역할, 2026-04 문제, direct SSH 비교, WAF 전후 관찰, connector 영향 한계, 2026-05 Bastion 구현, 2026-08-27 9개/5대, 단일 장애점과 미검증 범위를 각각 `supported` 또는 구체적인 `N/A`로 기록한다.

- [x] **Step 2: source와 insight visual inventory 기록**

작업물은 `provided — retain existing swimlane`, 인사이트는 `provided — retain existing data-flow`로 기록한다. actors, parallel, failure, retry, recovery, data, alternatives, time evolution과 existing source visual 각 row를 개별 판정한다.

- [x] **Step 3: 공개 검증 matrix 기록**

route response, list entry, source→insight, insight→source, semantic link names, keyboard, 4개 viewport, long-form duplication과 visual duplication을 실제 E2E 관찰값으로 채운다.

- [x] **Step 4: 명령 결과 기록**

RED/GREEN focused 수, full Vitest, tsc, scoped lint와 기존 baseline, build page 수, E2E pass 수, screenshot 경로, 임시 설정 삭제, 1104 미사용, commit/push/deploy 미수행을 기록한다.

- [x] **Step 5: feature status sync 시도**

Run: `mise run feature:status:sync`

Expected: task가 여전히 없으면 `no task //:feature:status:sync found`를 그대로 기록하고 대체 전이를 추정하지 않는다.

- [x] **Step 6: 최종 hygiene**

Run:

```bash
git diff --check
test ! -e apps/front/playwright.prod.config.ts
rg -n "Cloudflare Tunnel을 활용한 Zero Trust CI/CD 구축과 트러블슈팅" apps/front/src apps/front/e2e
```

Expected: diff check PASS, 임시 config 없음, 구 공개 제목 없음. 테스트의 negative assertion에 구 제목을 의도적으로 남긴 경우에만 해당 위치를 설명한다.

## Execution handoff

이 계획은 승인 문안과 테스트 우선 순서를 고정한다. 실행 시 한 작업씩 RED → 최소 구현 → GREEN → 문서·공개 검증 순으로 처리하고, 다른 Feature 007 변경이나 기존 lint baseline을 정리하지 않는다.
