# Quickstart: 하이패스 구조화 상세와 연결 인사이트 검증

**Date**: 2026-09-04

## 사전 조건

- 작업 디렉터리: `apps/front`
- 패키지 매니저: pnpm. 저장소 루트 install/lockfile 생성 금지
- 포트 1104의 기존 dev server와 `.next/dev` lock을 종료하거나 재사용하지 않음
- 공유 worktree의 기존 변경을 먼저 확인하고 관련 없는 파일을 포맷하지 않음
- 저장소 전역 lint baseline을 이번 기능에서 수정하지 않고 실제 변경 파일만 lint

## 1. RED 증거

구현 전에 다음 테스트에 하이패스 계약을 추가하고 기존 콘텐츠/타입/렌더러에서 실패함을 확인한다.

```bash
pnpm vitest run \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/data/portfolio/insight-editorial-quality.test.ts \
  src/components/projects/project-detail-rendering.test.tsx \
  src/components/insights/insight-visual-rendering.test.tsx
```

기대 RED는 구조화 상세 부재, 철회 주장 잔존, 두 인사이트의 승인 인터뷰 불일치, 실제 visual 선택형 계약과 조건부 renderer 부재다.

## 2. GREEN 및 정적 검증

```bash
pnpm exec tsc --noEmit

pnpm vitest run \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/data/portfolio/insight-editorial-quality.test.ts \
  src/components/projects/project-detail-rendering.test.tsx \
  src/components/insights/insight-visual-rendering.test.tsx

pnpm vitest run

# 구현 후 `git diff --name-only`로 확인한 실제 변경 TS/TSX 파일만 나열해 검사한다.
pnpm exec eslint \
  'src/app/(public)/insights/[slug]/page.tsx' \
  src/components/insights \
  src/components/projects/project-detail-rendering.test.tsx \
  src/data/portfolio \
  e2e/hipass-structured-detail.spec.ts

pnpm run build
```

## 3. 콘텐츠·렌더링 계약

- 네 지표의 값·단위·`measured`·2026-06·근거/한계 존재
- 월 70건 완료 주문, 10~20곳 실지급 화원, 약 50곳 등록 대상 풀 구분
- 백엔드 단독 책임, 프론트엔드 2인 협업, 코드 기간과 거래 운영 종료 분리
- 월 2회 대사 관찰 범위와 보상 취소 성공/이중 실패·복구 미구현 분리
- 금지 주장 0건, 세 기존 slug 보존, 양방향 연결 4개 동작
- 결제 스윔레인 1개, 정산 data-flow 1개, Socket.io before/after 1개
- visual이 없는 다른 insight에는 빈 UI 없음
- 성공·실패·재시도와 변경 전·후가 문자/선/테두리로도 구분됨

## 4. Fresh production E2E

1. 포트 1104 listener를 기록하고 별도 포트(우선 12110)가 비었는지 확인한다.
2. `pnpm run build` 뒤 production server를 실행한다.

```bash
pnpm start --port 12110 --hostname 127.0.0.1
```

3. `apply_patch`로 `apps/front/playwright.feature-009.prod.config.ts`를 임시 생성해 baseURL을 `http://127.0.0.1:12110`으로 설정한다.
4. 다음 E2E를 실행한다.

```bash
pnpm exec playwright test \
  e2e/hipass-structured-detail.spec.ts \
  e2e/portfolio-insight-contract.spec.ts \
  e2e/swimlane-viewer.spec.ts \
  --config=playwright.feature-009.prod.config.ts \
  --reporter=line
```

브라우저에서 세 route 200, 목록·양방향 keyboard 탐색, 320/768/1024/1440px document overflow 0px, 세 visual의 node/actor/label 겹침 0건, 연결선의 비연결 텍스트 관통 0건, text alternative를 확인한다.

5. 320px와 1440px 화면을 캡처해 `view_image`로 잘림·여백·오독 가능성을 확인한다.
6. 임시 config를 `apply_patch`로 삭제하고 소유한 production process만 종료한다.
7. 포트 12110 해제와 포트 1104 listener/lock 보존을 확인한다.

## 5. 최종 검사

```bash
git diff --check
mise run e2e:changed
mise run feature:status:sync
```

공유 worktree 때문에 E2E stamp가 거부되면 우회 stage하지 않고 fresh production E2E 결과와 거부 사유를 `verification.md`에 기록한다. `speckit-converge`가 Converged이기 전에는 완료로 선언하지 않는다.
