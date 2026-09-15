# Quickstart: Archify 스윔레인 파일럿 검증

**Date**: 2026-09-09

## 사전 조건

- 저장소 루트: `/Users/codiworks_dev/Desktop/bbagyun-portfolio-v2`
- 프런트엔드 패키지 매니저: `pnpm`; install은 필요할 때 `pnpm --dir apps/front`로만 실행
- Archify 2.17: `/Users/codiworks_dev/.agents/skills/archify`
- 사용자가 실행한 port 1104 dev server는 종료·재시작하거나 `.next/dev` lock을 건드리지 않음
- 공유 worktree의 관련 없는 변경을 포맷·stage·삭제하지 않음
- 저장소 전역 lint baseline은 범위 밖이며 실제 변경 TS/TSX/test 파일만 검사

## 1. 기준선과 불변 의미 확인

```bash
curl -I http://127.0.0.1:1104/projects/hotel-reservation-platform
```

기준선에서 다음을 기록한다.

- React 작은 미리보기와 `크게 보기` 존재
- `platform-change-verification-deployment`의 node 10개, edge 12개
- 세 코드 배치 분기와 패리티 복구 경로
- `Archify로 보기`는 아직 없음

## 2. RED: DTO·validator·렌더링 계약을 먼저 실패시킨다

구현 전에 다음 테스트에 계약을 추가한다.

- 유효한 `archify.url`·`label` 허용
- 빈 label, 외부 URL, `/diagrams/` 밖의 path와 `.html`이 아닌 path 거부
- 호텔 대상 스윔레인 한 건만 metadata 보유
- JSON·HTML 파일 존재와 public URL 일치
- React canonical data와 Archify source의 node 10개·edge 12개 parity
- metadata가 있을 때만 안전한 새 탭 link 표시
- 기존 `크게 보기`와 metadata 없는 스윔레인의 DOM 보존

```bash
pnpm --dir apps/front vitest run \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/components/projects/project-detail-rendering.test.tsx
```

테스트가 새 DTO·validator·artifact·link 부재를 이유로 실패하는 것을 확인하고 RED 증거를 기록한다.

## 3. GREEN: 최소 DTO·validator·UI 연결

다음 순서로 최소 구현한다.

1. `FeatureSwimlane.archify` 선택 타입 추가
2. URL·label content validator 추가
3. 호텔 대상 스윔레인에만 metadata 추가
4. 기존 card header를 보존하면서 조건부 새 탭 link 추가
5. RED 테스트 통과

```bash
pnpm --dir apps/front vitest run \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/components/projects/project-detail-rendering.test.tsx
```

## 4. Archify candidate 작성과 검증

Archify skill root에서 workflow schema v2, common schema와 workflow example 하나만 읽은 뒤, 다음 파일을 첫 candidate로 작성한다.

```text
apps/front/diagrams/hotel-reservation-platform/platform-change-verification-deployment.json
```

candidate를 쓴 다음 update checker를 한 번 실행하고, 매 JSON 수정 직후 validation을 수행한다.

```bash
node /Users/codiworks_dev/.agents/skills/archify/scripts/check-update.mjs

node /Users/codiworks_dev/.agents/skills/archify/bin/archify.mjs \
  validate workflow \
  apps/front/diagrams/hotel-reservation-platform/platform-change-verification-deployment.json \
  --quality showcase \
  --json
```

최종 acceptance:

- artifact check 9/9
- composition error 0
- warning 0
- canonical node 10개·edge 12개와 의미 mismatch 0

필요한 geometry diagnostic은 `--layout-json`으로 확인하고, supported control을 한 번에 하나만 수정한다. 최종 validation 통과 뒤 JSON을 동결한다.

## 5. Delivery와 Archify browser evidence

```bash
node /Users/codiworks_dev/.agents/skills/archify/bin/archify.mjs \
  deliver workflow \
  apps/front/diagrams/hotel-reservation-platform/platform-change-verification-deployment.json \
  apps/front/public/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html \
  --quality showcase \
  --json

node /Users/codiworks_dev/.agents/skills/archify/bin/archify.mjs \
  visual-check \
  apps/front/public/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html \
  --json
```

`deliver`의 specification/artifact SHA-256·byte count와 `visual-check`의 viewport 결과를 분리해 기록한다. 생성 screenshot은 `view_image`로 직접 열어 node 관통, edge 충돌, label 잘림·겹침과 주·분기·복구 경로 오독 여부를 확인한다.

## 6. 정적·회귀 검증

```bash
pnpm --dir apps/front exec tsc --noEmit

pnpm --dir apps/front vitest run \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/components/projects/project-detail-rendering.test.tsx

pnpm --dir apps/front vitest run

# 구현 뒤 git diff --name-only로 확인한 실제 변경 TS/TSX/test 파일만 지정한다.
pnpm --dir apps/front exec eslint \
  src/components/projects/ProjectSwimlane.tsx \
  src/components/projects/project-detail-rendering.test.tsx \
  src/data/portfolio/types/feature-detail.dto.ts \
  src/data/portfolio/feature-details/index.ts \
  src/data/portfolio/feature-details/hotel-reservation-platform.ts \
  src/data/portfolio/feature-detail-quality.test.ts \
  e2e/swimlane-viewer.spec.ts

pnpm --dir apps/front run build
```

## 7. Fresh production E2E

port 1104 listener를 먼저 기록하고, 12113 같은 별도 빈 포트를 선택한다. production build 뒤 해당 포트에서만 소유한 server를 실행한다.

```bash
pnpm --dir apps/front start --port 12113 --hostname 127.0.0.1
```

`apply_patch`로 Feature 011 전용 임시 Playwright config를 만들고 base URL을 `http://127.0.0.1:12113`으로 지정한 뒤 실행한다.

```bash
pnpm --dir apps/front exec playwright test \
  e2e/swimlane-viewer.spec.ts \
  --config=playwright.feature-011.prod.config.ts \
  --reporter=line
```

브라우저에서 다음을 확인한다.

- 대상 프로젝트 page와 standalone HTML HTTP 200
- 기존 `크게 보기`와 `Archify로 보기`가 함께 표시됨
- keyboard로 Archify link를 활성화하면 정확한 새 page가 열림
- 기존 React Dialog의 열기·Escape 닫기·focus 복귀 유지
- 다른 구조화 작업물에 Archify action·placeholder 없음
- 원본 page 320/768/1024/1440px에서 document overflow·title/action 겹침 0
- standalone viewer 1440×900/1600×1000/1920×1080에서 x/y overflow와 핵심 요소 가림 0

검증 뒤 임시 config는 `apply_patch`로 삭제하고, 소유한 production process만 종료한다. 12113이 해제되고 1104 listener와 PID가 보존됐는지 확인한다.

## 8. 최종 검사

```bash
git diff --check
mise run e2e:changed
mise run feature:status:sync
```

`verification.md`에 RED/GREEN, typecheck·Vitest·scoped lint·build, Archify validate/deliver/visual-check, Playwright와 이미지 검토를 각각 기록한다. `speckit-converge`가 `Converged`이고 review의 Critical/Important finding이 0건이기 전에는 완료로 선언하지 않는다.
