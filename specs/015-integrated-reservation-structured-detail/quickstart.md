# Quickstart: 행사 호텔 예약·결제 통합 플랫폼 구조화 상세 검증

**Date**: 2026-09-15

## 사전 조건

- 저장소 루트 또는 명시적인 `pnpm --dir apps/front`로 실행한다.
- Next.js 앱 의존성은 `apps/front` 안에서만 관리하고 루트 lockfile을 만들지 않는다.
- 공유 worktree의 기존 변경을 확인하고 관련 없는 파일을 포맷·stage·commit하지 않는다.
- 원본 GTN 저장소는 읽기 전용 근거이며 포트폴리오 빌드·테스트 의존성으로 만들지 않는다.
- 저장소 전역 lint baseline은 이번 기능에서 정리하지 않고 실제 변경 TS/TSX만 lint한다.
- 사용자가 실행한 1104 dev server와 `.next/dev` lock은 종료·재시작·삭제하지 않는다.
- Feature 013의 T045·T047·T048은 체크하거나 수정하지 않는다.

## 1. 기준선 확인

```bash
curl -I http://127.0.0.1:1104/projects/integrated-reservation-platform
curl -I http://127.0.0.1:1104/insights/nestjs-middleware-vs-guard-tradeoff
curl -I http://127.0.0.1:1104/insights/nextjs-nestjs-domain-separation-and-bff
curl -I http://127.0.0.1:1104/insights/https-and-plaintext-password-transmission
curl -I http://127.0.0.1:1104/insights/enterprise-bff-architecture-and-cors
```

기준선에서는 작업물이 legacy Markdown과 `In Progress` 상태 데이터로 남아 있고, 작업물 visual은 없다. 네 인사이트는 별도 legacy 글이며 Middleware 글은 visual 없음으로 고정된 기존 회귀가 있다. 1104는 관찰만 하고 프로세스에 신호를 보내지 않는다.

## 2. RED 증거

구현 전에 아래 테스트에 Feature 015 계약을 추가하고 예상한 이유로 실패하는지 확인한다.

```bash
pnpm --dir apps/front exec vitest run \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/data/portfolio/insight-editorial-quality.test.ts \
  src/components/projects/project-detail-rendering.test.tsx \
  src/components/projects/project-swimlane-layout.test.ts \
  src/components/projects/archify-swimlane-embed.test.tsx \
  src/components/insights/insight-visual-rendering.test.tsx
```

기대 RED는 다음과 같다.

- `On Hold` 타입·공통 상태 표시, 구조화 detail과 근거 카드 부재
- legacy `content` 잔존
- UAT workflow·Core Product 관계 모델과 Archify target 부재
- 세 insight editorial·두 before/after visual 부재
- alias 정적 route·redirect 부재와 exact migration 집합 불일치
- 기존 InsightVisual의 키보드 확대 기능 부재

기존 baseline과 무관한 실패가 섞이면 구현 전에 원인을 분리한다.

## 3. Archify source 작성과 delivery

각 candidate를 작성하기 직전에 Archify skill이 요구하는 type별 schema, `common.schema.json`, 예제 한 건만 읽는다. candidate를 먼저 만든 뒤 update checker를 한 번 실행한다. renderer 내부는 진단이 요구하기 전에는 읽지 않는다.

```bash
node /Users/codiworks_dev/.agents/skills/archify/bin/archify.mjs validate workflow \
  apps/front/diagrams/integrated-reservation-platform/uat-booking-payment-flow.json \
  --quality showcase --json

node /Users/codiworks_dev/.agents/skills/archify/bin/archify.mjs validate architecture \
  apps/front/diagrams/integrated-reservation-platform/core-product-relationships.json \
  --quality showcase --json

node /Users/codiworks_dev/.agents/skills/archify/bin/archify.mjs deliver workflow \
  apps/front/diagrams/integrated-reservation-platform/uat-booking-payment-flow.json \
  apps/front/public/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html \
  --quality showcase --json

node /Users/codiworks_dev/.agents/skills/archify/bin/archify.mjs deliver architecture \
  apps/front/diagrams/integrated-reservation-platform/core-product-relationships.json \
  apps/front/public/diagrams/integrated-reservation-platform/core-product-relationships.html \
  --quality showcase --json

node /Users/codiworks_dev/.agents/skills/archify/bin/archify.mjs visual-check \
  apps/front/public/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html \
  --json

node /Users/codiworks_dev/.agents/skills/archify/bin/archify.mjs visual-check \
  apps/front/public/diagrams/integrated-reservation-platform/core-product-relationships.html \
  --json
```

각 validate는 9개 artifact check, composition error 0, warning 0이어야 한다. delivery 뒤 source와 HTML의 SHA-256·byte count를 기록하고 파일을 직접 수정하지 않는다. `visual-check` 자동 증거와 실제 이미지의 사람·이미지 모델 검토를 구분한다. 두 standalone HTML은 1440×900, 1600×1000, 1920×1080에서 가로·세로 overflow, 첫 화면 균형과 가독성을 확인한다.

## 4. GREEN과 정적 검증

```bash
pnpm --dir apps/front exec tsc --noEmit

pnpm --dir apps/front exec vitest run \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/data/portfolio/insight-editorial-quality.test.ts \
  src/components/projects/project-detail-rendering.test.tsx \
  src/components/projects/project-swimlane-layout.test.ts \
  src/components/projects/archify-swimlane-embed.test.tsx \
  src/components/insights/insight-visual-rendering.test.tsx

pnpm --dir apps/front exec vitest run

# 구현 후 git diff --name-only로 확인한 실제 변경 TS/TSX와 E2E 파일만 나열한다.
pnpm --dir apps/front exec eslint \
  'src/app/(public)/insights/[slug]/page.tsx' \
  'src/app/(public)/projects/[slug]/page.tsx' \
  src/components/insights/InsightVisual.tsx \
  src/components/insights/insight-visual-rendering.test.tsx \
  src/components/projects/ArchifyEmbed.tsx \
  src/components/projects/ArchifySwimlaneEmbed.tsx \
  src/components/projects/ProjectDetailContent.tsx \
  src/components/projects/ProjectRelationshipDiagram.tsx \
  src/components/projects/ProjectStatusBadge.tsx \
  src/components/projects/archify-swimlane-embed.test.tsx \
  src/components/projects/project-detail-rendering.test.tsx \
  src/components/projects/project-swimlane-layout.test.ts \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/data/portfolio/feature-details/index.ts \
  src/data/portfolio/feature-details/integrated-reservation-platform.ts \
  src/data/portfolio/features.ts \
  src/data/portfolio/index.ts \
  src/data/portfolio/insight-editorial-quality.test.ts \
  src/data/portfolio/insight-editorial.ts \
  src/data/portfolio/insights.ts \
  src/data/portfolio/types/feature-detail.dto.ts \
  src/data/portfolio/types/feature.dto.ts \
  e2e/integrated-reservation-structured-detail.spec.ts \
  e2e/portfolio-insight-contract.spec.ts \
  e2e/swimlane-viewer.spec.ts \
  e2e/codi-harness-portfolio-detail.spec.ts \
  e2e/hipass-structured-detail.spec.ts

pnpm --dir apps/front run build
```

존재하지 않거나 실제로 변경되지 않은 후보 파일은 scoped ESLint 목록에서 제외한다.

## 5. 콘텐츠·구조 계약

- 제목·기간·팀·`On Hold` 상태와 고객사 측 사업 여건 문구가 보인다.
- 근거 카드 네 개가 값·종류·기준 시점·관찰 한계를 갖는다.
- Core Product 관계, version 충돌, 단계형 PG와 미완성 재고 복구가 사실대로 구분된다.
- `A-domain.com`·`api.A-domain.com` 외 실제 도메인·IP·고객·인증 정보가 없다.
- 금지 주장과 운영 성과가 0건이다.
- 작업물 workflow 1개와 관계도 1개가 서로 다른 질문을 답한다.
- canonical insight 3개와 alias 1개가 목록 중복 없이 동작한다.
- Middleware·BFF 시각 자료는 각각 1개, HTTPS 시각 자료는 0개다.
- 작업물과 canonical insight 사이 양방향 연결이 존재한다.

## 6. 1104 구현 중 시각 확인

사용자 소유 서버에서 작업물·세 canonical insight·legacy alias 경로를 확인할 수 있다. Next dev 반영 지연이나 기존 `.next/dev` 상태를 최종 증거로 오인하지 않는다. 서버를 종료·재시작하거나 lock을 변경하지 않는다.

## 7. Fresh production E2E

1. 포트 1104 listener를 기록하고 별도 포트(우선 12117)가 비었는지 확인한다.
2. build 후 직접 시작한 production server만 실행한다.

```bash
pnpm --dir apps/front start --port 12117 --hostname 127.0.0.1
```

3. `apply_patch`로 `apps/front/playwright.feature-015.prod.config.ts`를 임시 생성해 baseURL을 `http://127.0.0.1:12117`로 지정한다.
4. 아래 E2E를 실행한다.

```bash
pnpm --dir apps/front exec playwright test \
  e2e/integrated-reservation-structured-detail.spec.ts \
  e2e/portfolio-insight-contract.spec.ts \
  e2e/swimlane-viewer.spec.ts \
  e2e/codi-harness-portfolio-detail.spec.ts \
  e2e/hipass-structured-detail.spec.ts \
  --config=playwright.feature-015.prod.config.ts \
  --reporter=line
```

다음을 확인한다.

- 작업물·canonical 세 경로 200과 legacy BFF alias의 canonical 최종 URL
- 목록에 canonical 세 글만 한 번씩 노출
- 목록→작업물→세 인사이트→작업물 keyboard 이동
- `On Hold` 보이는 상태
- workflow·relationship·두 insight visual의 작은 보기·크게보기
- Escape와 focus 복귀, 동등한 텍스트, HTTPS visual 0개
- 320·768·1024·1440px document overflow 0px, 핵심 텍스트 clipping·요소 overlap 0건
- 기존 Archify 9개 target과 완료된 구조화 상세의 회귀 없음

5. 320px·1440px 작업물, 두 provided insight와 각 크게보기를 캡처해 `view_image`로 잘림·여백·오독 가능성을 검토한다.
6. 임시 config를 `apply_patch`로 삭제하고 직접 시작한 production process만 종료한다.
7. 12117 포트 해제와 기존 1104 listener 보존을 확인한다.

## 8. 최종 검사

```bash
git diff --check
mise run e2e:changed
mise run feature:status:sync
```

공유 worktree 때문에 `e2e:changed` stamp가 거부되면 stage로 우회하지 않고 fresh production E2E 결과와 거부 사유를 기록한다. `speckit-converge`가 `Converged`이기 전에는 완료로 선언하지 않는다.
