# Quickstart: 골프 예약 시스템 구조화 상세 검증

**Date**: 2026-09-11

## 사전 조건

- 저장소 루트 또는 명시적인 `pnpm --dir apps/front`로 실행한다.
- Next.js 앱 의존성 설치는 `apps/front` 안에서만 수행하며 루트 lockfile을 만들지 않는다.
- 공유 worktree의 기존 변경을 먼저 확인하고 관련 없는 파일을 포맷하지 않는다.
- 저장소 전역 lint baseline은 이번 기능에서 수정하지 않고 실제 변경 파일만 lint한다.
- 사용자가 실행한 1104 dev server와 `.next/dev` lock은 종료·재시작·삭제하지 않는다.
- 최종 E2E는 별도 빈 production 포트를 사용하고 임시 설정은 실행 후 `apply_patch`로 삭제한다.

## 1. 기준선 확인

```bash
curl -I http://127.0.0.1:1104/projects/the-siena-golf-reservation
curl -I http://127.0.0.1:1104/insights/logging-decoupling-and-buffering-in-external-api-systems
```

기준선에서는 골프 작업물이 legacy 본문으로 표시되고 구조화 상세 registry와 Archify 예약 스윔레인은 없다. 기존 로그 분리 인사이트의 승인 본문·시각 자료·작업물 복귀 링크는 보존 대상이다.

## 2. RED 증거

구현 전에 아래 테스트에 Feature 014 계약을 추가하고 실패를 확인한다.

```bash
pnpm --dir apps/front exec vitest run \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/data/portfolio/insight-editorial-quality.test.ts \
  src/components/projects/project-detail-rendering.test.tsx \
  src/components/projects/project-swimlane-layout.test.ts \
  src/components/projects/archify-swimlane-embed.test.tsx
```

기대 RED는 골프 구조화 상세·typed Archify target 부재, legacy content 잔존, 승인된 스윔레인과 근거 카드 부재다. 기존 인사이트 보존 계약은 RED를 만들기 위해 내용을 훼손하지 않고 회귀 assertion으로 유지한다.

## 3. Archify source 검증과 HTML delivery

```bash
node /Users/codiworks_dev/.agents/skills/archify/bin/archify.mjs validate workflow \
  apps/front/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.json \
  --quality showcase --json

node /Users/codiworks_dev/.agents/skills/archify/bin/archify.mjs deliver workflow \
  apps/front/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.json \
  apps/front/public/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html \
  --quality showcase --json

node /Users/codiworks_dev/.agents/skills/archify/bin/archify.mjs visual-check \
  apps/front/public/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html \
  --json
```

validate receipt의 9개 artifact check, composition error 0, warning 0을 확인한다. delivery 뒤 source·HTML의 SHA-256과 byte count, lane/node/edge parity를 `verification.md`에 기록한다. visual-check screenshot의 자동 측정과 사람의 이미지 검토를 구분한다.

## 4. GREEN과 정적 검증

```bash
pnpm --dir apps/front exec tsc --noEmit

pnpm --dir apps/front exec vitest run \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/data/portfolio/insight-editorial-quality.test.ts \
  src/components/projects/project-detail-rendering.test.tsx \
  src/components/projects/project-swimlane-layout.test.ts \
  src/components/projects/archify-swimlane-embed.test.tsx

pnpm --dir apps/front exec vitest run

# 구현 후 git diff --name-only로 확인한 실제 변경 TS/TSX 파일만 나열한다.
pnpm --dir apps/front exec eslint \
  src/components/projects/ArchifySwimlaneEmbed.tsx \
  src/components/projects/archify-swimlane-embed.test.tsx \
  src/components/projects/project-detail-rendering.test.tsx \
  src/components/projects/project-swimlane-layout.test.ts \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/data/portfolio/feature-details/index.ts \
  src/data/portfolio/feature-details/the-siena-golf-reservation.ts \
  src/data/portfolio/features.ts \
  src/data/portfolio/types/feature-detail.dto.ts \
  e2e/golf-reservation-structured-detail.spec.ts

pnpm --dir apps/front run build
```

## 5. 콘텐츠·렌더링 계약

- 작업물 카드 `2023.05 – 현재`, 본문 최초 구축 `2023.05 – 2023.06`, 오픈 이후 현재 유지보수가 구분된다.
- 첫 프로젝트와 정해진 구조 안의 FE/BE 구현 책임, 운영 로그 분리에서의 직접 판단이 구분된다.
- 근거 카드 3개가 값·종류·기준 시점·설명과 필요한 관찰 한계를 갖는다.
- 화면 잠금, PHP 세션 2초 필터, 30초 timeout, 5xx/timeout 안내가 실제 구현으로 표시된다.
- 중복 호출 이력·관련 CS 미확인은 유지보수 관찰 범위이며 비율·전수 보장이 아니다.
- 로그 문제는 예약 기능 중단이 아니라 조사 시 당사 기록 조회 실패로 제한된다.
- 철회·금지 주장 0건, 고객·인증·비공개 정보 0건이다.
- 작업물 스윔레인 1개와 기존 인사이트 before/after 1개가 서로 다른 질문을 답한다.
- 기존 두 slug와 양방향 링크가 유지된다.

## 6. 1104 구현 중 시각 확인

사용자가 실행한 서버에서 두 공개 route와 작업물의 작은 보기·크게보기를 확인할 수 있다. 인사이트 클라이언트 로딩 화면을 최종 상태로 오인하지 않도록 승인 제목이 나타난 뒤 확인한다. 1104 프로세스에 신호를 보내거나 lock 파일을 변경하지 않는다.

## 7. Fresh production E2E

1. 포트 1104 listener를 기록하고 별도 포트(우선 12116)가 비었는지 확인한다.
2. `pnpm --dir apps/front run build` 후 production server를 실행한다.

```bash
pnpm --dir apps/front start --port 12116 --hostname 127.0.0.1
```

3. `apply_patch`로 `apps/front/playwright.feature-014.prod.config.ts`를 임시 생성해 baseURL을 `http://127.0.0.1:12116`으로 설정한다.
4. 아래 E2E를 실행한다.

```bash
pnpm --dir apps/front exec playwright test \
  e2e/golf-reservation-structured-detail.spec.ts \
  e2e/portfolio-insight-contract.spec.ts \
  e2e/swimlane-viewer.spec.ts \
  --config=playwright.feature-014.prod.config.ts \
  --reporter=line
```

두 route 200, 목록 진입, 양방향 keyboard 탐색, preview/dialog, Escape와 focus 복귀, 320/768/1024/1440px document overflow 0px, 핵심 node·edge label 겹침 0건, 기존 구조화 상세 공통 시각 계약을 확인한다.

5. 320px와 1440px의 작업물·인사이트 화면 및 크게보기를 캡처해 `view_image`로 잘림·여백·오독 가능성을 확인한다.
6. 임시 config를 `apply_patch`로 삭제하고 직접 시작한 production process만 종료한다.
7. 12116 포트 해제와 기존 1104 listener 보존을 확인한다.

## 8. 최종 검사

```bash
git diff --check
mise run e2e:changed
mise run feature:status:sync
```

저장소에 존재하지 않는 mise task는 성공으로 간주하거나 임의로 추가하지 않고 verification에 기록한다. 공유 worktree 때문에 E2E stamp가 거부되면 stage로 우회하지 않고 fresh production E2E 결과와 거부 사유를 남긴다. `speckit-converge`가 Converged이기 전에는 완료로 선언하지 않는다.
