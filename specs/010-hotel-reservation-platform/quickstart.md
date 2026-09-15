# Quickstart: 호텔 예약 플랫폼 구조화 상세와 연결 인사이트 검증

**Date**: 2026-09-09

## 사전 조건

- 작업 디렉터리: `apps/front`
- 패키지 매니저: pnpm. 저장소 루트 install·lockfile 생성 금지
- 공유 worktree의 기존 변경을 먼저 확인하고 관련 없는 파일을 포맷하지 않음
- 저장소 전역 lint baseline은 이번 기능에서 수정하지 않고 실제 변경 파일만 lint
- 포트 1104는 사용자가 실행한 dev server다. 기준선과 구현 중 시각 확인에 사용할 수 있지만 종료·재시작하지 않음
- 최종 E2E는 `.next/dev` lock과 dev 상태를 건드리지 않도록 별도 빈 production 포트를 사용

## 1. 기준선 확인

1104에서 아래 세 경로가 200으로 응답하는지 확인한다.

```bash
curl -I http://127.0.0.1:1104/projects/hotel-reservation-platform
curl -I http://127.0.0.1:1104/insights/config-driven-architecture-react
curl -I http://127.0.0.1:1104/insights/context-api-encapsulation-and-router-level-isolation
```

2026-09-09 기준선에서는 작업물에 legacy Markdown이 표시되고, 두 인사이트는 클라이언트 데이터 로딩 후 기존 제목과 철회 대상 문구가 표시된다. 자동 캡처는 제목이 보일 때까지 기다린 뒤 수행한다.

## 2. RED 증거

구현 전에 다음 테스트에 Feature 010 계약을 추가하고 기존 콘텐츠·시각 계약에서 실패함을 확인한다.

```bash
pnpm vitest run \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/data/portfolio/insight-editorial-quality.test.ts \
  src/components/projects/project-detail-rendering.test.tsx \
  src/components/insights/insight-visual-rendering.test.tsx
```

기대 RED는 호텔 예약 구조화 상세 부재, 철회 주장 잔존, 두 인사이트의 승인 인터뷰 불일치, 일반화되지 않은 visual validator·role·scope다.

## 3. GREEN 및 정적 검증

```bash
pnpm exec tsc --noEmit

pnpm vitest run \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/data/portfolio/insight-editorial-quality.test.ts \
  src/components/projects/project-detail-rendering.test.tsx \
  src/components/projects/project-swimlane-layout.test.ts \
  src/components/insights/insight-visual-rendering.test.tsx

pnpm vitest run

# 구현 후 `git diff --name-only`로 확인한 실제 변경 TS/TSX 파일만 나열해 검사한다.
pnpm exec eslint \
  src/components/insights/InsightVisualDiagram.tsx \
  src/components/insights/insight-visual-rendering.test.tsx \
  src/components/projects/project-detail-rendering.test.tsx \
  src/components/projects/project-swimlane-layout.test.ts \
  src/data/portfolio \
  e2e/hotel-reservation-platform.spec.ts \
  e2e/portfolio-insight-contract.spec.ts

pnpm run build
```

## 4. 콘텐츠·렌더링 계약

- 작업물 meta에서 두 기간, 3인 협업, 사용자의 실제 책임과 5개 운영 적용이 구분됨
- 프로젝트 복제가 아닌 단일 코드의 조건 분기, 1차 설정 구조와 2차 코드 경계의 인과관계가 표시됨
- 기준 소스 1개와 플랫폼별 build·deploy 5개가 모순 없이 설명됨
- 패리티 누락은 운영 배포 전 발견과 수동 이식으로 제한되고 내부 감사 수치가 없음
- Context는 Props Drilling 감소와 route 생명주기, NICEPAY는 `sessionStorage` 1시간과 예약번호 조회까지만 포함
- 금지 주장 0건, 세 기존 slug 보존, 양방향 연결 4개 동작
- 작업물 swimlane 1개, 코드 경계 data-flow 1개, Context before-after 1개
- 코드 경계 data-flow는 가짜 success·failure·retry 없이 normal 분류 edge만 사용
- Context before-after는 component·provider 역할과 indirect·direct 관계를 사용
- 기존 하이패스 두 visual은 success·failure·retry 및 overbroad·intended 의미를 유지
- visual이 없는 다른 insight에는 빈 UI 없음

## 5. 1104 구현 중 시각 확인

각 변경 뒤 사용자가 실행한 서버에서 아래를 확인한다.

- 세 route의 정정 제목·본문과 양방향 링크
- 작업물 inline swimlane과 크게 보기
- 두 인사이트 visual의 node·actor·relation label
- 기존 하이패스 두 visual의 표시 회귀

클라이언트 로딩 화면을 최종 화면으로 오인하지 않도록 인사이트 제목이 보인 다음 캡처한다. 1104 프로세스에는 신호를 보내거나 lock 파일을 변경하지 않는다.

## 6. Fresh production E2E

1. 포트 1104 listener를 기록하고 별도 포트(우선 12112)가 비었는지 확인한다.
2. `pnpm run build` 뒤 production server를 실행한다.

```bash
pnpm start --port 12112 --hostname 127.0.0.1
```

3. `apply_patch`로 `apps/front/playwright.feature-010.prod.config.ts`를 임시 생성해 baseURL을 `http://127.0.0.1:12112`로 설정한다.
4. 다음 E2E를 실행한다.

```bash
pnpm exec playwright test \
  e2e/hotel-reservation-platform.spec.ts \
  e2e/portfolio-insight-contract.spec.ts \
  e2e/hipass-structured-detail.spec.ts \
  e2e/swimlane-viewer.spec.ts \
  --config=playwright.feature-010.prod.config.ts \
  --reporter=line
```

브라우저에서 세 대상 route 200, 목록·양방향 keyboard 탐색, 320/768/1024/1440px document overflow 0px, 세 신규 visual의 node·actor·label 겹침 0건, 기존 하이패스 visual 회귀와 text alternative를 확인한다.

5. 320px와 1440px 화면을 캡처해 `view_image`로 잘림·여백·오독 가능성을 확인한다.
6. 임시 config를 `apply_patch`로 삭제하고 소유한 production process만 종료한다.
7. 포트 12112 해제와 포트 1104 listener·process 보존을 확인한다.

## 7. 최종 검사

```bash
git diff --check
mise run e2e:changed
mise run feature:status:sync
```

저장소에 존재하지 않는 mise task는 성공으로 간주하거나 임의로 추가하지 않고 baseline 제약으로 verification에 기록한다. 공유 worktree 때문에 E2E stamp가 거부되면 우회 stage하지 않고 fresh production E2E 결과와 거부 사유를 기록한다. `speckit-converge`가 Converged이기 전에는 완료로 선언하지 않는다.
