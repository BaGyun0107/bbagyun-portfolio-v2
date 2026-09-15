# Quickstart: 반응형 스윔레인 뷰어 검증

**Date**: 2026-09-01

이 문서는 구현 결과가 feature 008 계약을 만족하는지 확인하는 실행 가이드다.
세부 결정은 [research.md](./research.md), 데이터 제약은 [data-model.md](./data-model.md),
UI 계약은 [contracts/swimlane-viewer-contract.md](./contracts/swimlane-viewer-contract.md)를
참조한다.

## 사전 조건

- 작업 디렉터리: `apps/front`
- 패키지 매니저: `pnpm`; 루트 설치와 lockfile 변경 금지
- 포트 1104의 기존 dev server와 `.next/dev` lock은 종료·재사용하지 않음
- 저장소 전역 lint baseline은 범위 밖이며 변경 파일만 lint
- 실제 변경 목록과 사용자 소유 변경을 먼저 확인하고 관련 없는 파일은 포맷하지 않음

## 1. RED 확인

구현 전에 다음 테스트를 추가하고 현재 구현에서 실패하는 이유를 기록한다.

```bash
pnpm vitest run \
  src/components/projects/project-swimlane-layout.test.ts \
  src/components/projects/project-detail-rendering.test.tsx \
  src/data/portfolio/feature-detail-quality.test.ts
```

기대 RED:

- 4-lane 고정 940px viewBox가 작은 wrapper에서 전체 축소되어 node 글자가 10px 미만임
- node label이 한 줄 고정이며 shape 안전 폭을 벗어나도 node/row 높이가 늘어나지 않음
- 자동 edge label이 가장 긴 직선 구간 중앙을 사용하고 label끼리 충돌함
- rounded path 전체 50% 지점과 위·아래 최소 이동 resolver가 없음
- wrapper 폭 변경과 compact fallback을 검증하는 측정 계약이 없음
- 실제 진행 행 구간 밖의 node를 장애물로 오인해 연결선이 역주행하고 비연결 node를 관통함

## 2. GREEN 및 정적 검증

```bash
# 타입
pnpm exec tsc --noEmit

# 관련 단위·계약 테스트
pnpm vitest run \
  src/components/projects/project-swimlane-layout.test.ts \
  src/components/projects/project-detail-rendering.test.tsx \
  src/data/portfolio/feature-detail-quality.test.ts

# 전체 단위 테스트
pnpm vitest run

# 변경 범위 lint — 실제 변경 파일 목록과 맞춘다
pnpm exec eslint \
  src/components/projects/ProjectSwimlane.tsx \
  src/components/projects/ProjectSwimlaneDiagram.tsx \
  src/components/projects/ResponsiveSwimlaneDiagram.tsx \
  src/components/projects/project-swimlane-layout.ts \
  src/components/projects/project-swimlane-layout.test.ts \
  src/components/projects/responsive-swimlane-diagram.test.tsx \
  src/components/projects/project-detail-rendering.test.tsx \
  src/data/portfolio/swimlane-geometry.ts \
  src/data/portfolio/types/feature-detail.dto.ts \
  src/data/portfolio/feature-details/index.ts \
  src/data/portfolio/feature-detail-quality.test.ts \
  e2e/swimlane-viewer.spec.ts \
  e2e/codi-harness-portfolio-detail.spec.ts \
  e2e/hanmaum-search-detail.spec.ts

# production build
pnpm run build
```

## 3. 순수 geometry 계약

`project-swimlane-layout.test.ts`에서 다음을 모두 확인한다.

- 상대 위치 기반 right→left, left→right, bottom→top, top→bottom 선택
- 한쪽 또는 양쪽 명시 anchor override 보존
- 모든 인접점의 직교성, 중복·불필요한 공선점 제거
- 네 도착 방향의 마지막 직선이 10px 이상이며 target 변에 수직
- 기본 radius 8px, 짧은 구간에서 안전한 축소
- path 한 개와 6px marker의 접선 일치
- 명시 waypoint와 labelAt 보존
- 252·307·684·766.7px layout에서 node font size 10px 이상
- node text가 shape 안전 영역 안에 있고 줄 수에 따라 node/row/diagram 높이가 증가함
- quadratic corner를 포함한 rounded path 누적 길이의 50% 지점 계산
- 충돌이 없는 자동 label은 중앙점과 이동량 0을 유지함
- 충돌 label은 가장 가까운 위·아래 트랙을 사용하고 Blackstone 네 label 충돌이 0건임
- `labelAt`은 고정되고 자동 label만 피함
- 한 줄 → 2줄 → 3줄 → layout 실패 순서가 결정적으로 동작함
- 실제 4개 작업물·6개 스윔레인의 모든 edge가 source·target 이외 node와 교차하지 않음
- 상·하 진행 edge가 source exit와 target approach의 세로 범위를 벗어나 역주행하지 않음
- Blackstone 결과 분기의 cross-lane 수평 통로가 목적지 좌→우 순서로 증가함
- Blackstone PMS 장애 분기는 same-lane 수직 직선을 유지함
- Harness의 품질 실패·시크릿 불일치가 각각 배포 중단의 오른쪽·아래쪽 변으로 도착하고,
  시크릿 불일치 경로가 node 내부를 가로지르지 않음

## 4. 렌더링·접근성 계약

관련 Vitest와 Playwright에서 확인한다.

- 본문에 `overflow-x-auto`, scroll region, `tabIndex=0`이 없음
- 모든 스윔레인 카드에 보이는 `크게 보기` 버튼이 있음
- 본문과 Dialog가 같은 lane/step/edge/label을 렌더링함
- inline/dialog title·description·marker ID가 충돌하지 않음
- lane → node shape → edge → node text → label pill 순서
- normal 실선, exception 점선
- receive port, 굵은 점과 halo가 없음
- 전체 흐름 설명과 예외 대응 텍스트가 보존됨
- 유효한 wrapper 정수 폭 변경만 layout에 반영되고 동일·0·비유한 폭은 무시됨
- node와 edge label이 계산된 줄마다 `tspan`을 렌더링함

## 5. Fresh production E2E

1. `lsof`로 포트 1104 listener를 기록하고 별도 포트(우선 12109)가 비었는지 확인한다.
2. `pnpm run build`가 완료된 뒤 소유한 PTY에서 다음과 같이 production server를 띄운다.

```bash
pnpm start --port 12109 --hostname 127.0.0.1
```

3. `apply_patch`로 `apps/front/playwright.feature-008.prod.config.ts`를 임시 생성한다.

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://127.0.0.1:12109'
  }
});
```

4. permanent E2E 전체를 실행한다.

```bash
pnpm exec playwright test \
  --config=playwright.feature-008.prod.config.ts \
  --reporter=line
```

브라우저 기대 결과:

- 320/375/768/1024/1440px에서 document와 각 스윔레인 카드의 가로 넘침 0px
- Blackstone, Hanmaum, Harness, 중앙 회원 서버의 스윔레인 총 6개 보존
- 각 카드의 본문 미리보기와 Dialog lane/step/edge/label 일치
- inline/Dialog의 실제 node 글자 크기 10px 이상과 node text overflow 0건
- edge label끼리, edge label과 node, edge label과 SVG 경계의 충돌 0건
- 실제 SVG path와 source·target 이외 node 도형의 교차 0건
- click/keyboard로 열기, Escape 닫기, 원래 버튼으로 focus 복귀
- 상·하·좌·우 화살촉, 긴 한글 label pill과 normal/exception 구분 확인
- 스윔레인이 없는 legacy 작업물에 빈 버튼이나 Dialog가 없음

5. Blackstone·Hanmaum 모바일 본문과 데스크톱 Dialog 승인 화면을 캡처하고
   `view_image`로 글자 크기, node 줄바꿈과 label 배치를 직접 확인한다.
6. 임시 config를 `apply_patch`로 삭제하고 소유한 production process만 종료한다.
7. 포트 12109가 해제되고 포트 1104 listener와 `.next/dev` lock이 유지됐는지 확인한다.

사용 포트가 이미 점유됐으면 확인된 인접 포트를 사용하고 server와 config baseURL을 함께
바꾼다. 임시 config, process와 임시 test result는 실행 후 남기지 않는다.

## 6. 최종 검사

```bash
git diff --check
mise run e2e:changed
mise run feature:status:sync
```

공유 worktree의 기존 unstaged/untracked 변경 때문에 `e2e:changed`가 증거 stamp를 거부하면
이를 우회해 stage하지 않는다. 위 fresh production E2E의 명령·결과와 stamp 거부 사유를
`verification.md`에 구분해 기록한다.

## 완료 판정

- tasks.md 모든 항목 완료
- typecheck, 관련·전체 Vitest, 변경 범위 lint, production build, fresh E2E 통과
- 승인 화면 시각 검사 통과
- 기존 네 작업물 콘텐츠 손실 0건
- `speckit-converge`가 `Converged`
- 리뷰의 Critical·Important 잔여 0건
- 명령·결과·임시 자원 정리·잔여 위험을 `verification.md`에 기록
