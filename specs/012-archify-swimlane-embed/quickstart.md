# Quickstart: Archify 스윔레인 임베드 전환 검증

**Date**: 2026-09-10

## 사전 조건

- 저장소 루트: /Users/codiworks_dev/Desktop/bbagyun-portfolio-v2
- 프런트엔드 패키지 매니저: pnpm; root install과 신규 dependency 추가 없음
- 사용자가 실행한 port 1104 dev server와 .next/dev lock을 종료·재시작하지 않음
- 공유 worktree의 관련 없는 변경을 포맷·stage·삭제하지 않음
- 전역 lint baseline 대신 실제 변경 TS/TSX/test 파일만 검사
- Feature 011 JSON·HTML을 편집하거나 Archify로 재생성하지 않음

## 1. 기준선과 동결 artifact

~~~bash
curl -I http://127.0.0.1:1104/projects/hotel-reservation-platform

shasum -a 256 +  apps/front/diagrams/hotel-reservation-platform/platform-change-verification-deployment.json +  apps/front/public/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html

wc -c +  apps/front/diagrams/hotel-reservation-platform/platform-change-verification-deployment.json +  apps/front/public/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html
~~~

Expected:

- JSON: b5472af8952722b9b5fea87fc930f2c5880634ff8da5f17f16c6aaa4f819c419, 4,355 bytes
- HTML: a23ebd2219cda3bad5deccc3461e7d6522cfc90d5e34d6d4dffd5469817f49d3, 714,531 bytes
- JSON node 10개, edge 12개

## 2. RED: 계약을 먼저 실패시킨다

구현 전에 테스트를 추가한다.

- url-only embed DTO와 query/hash 없는 same-origin /diagrams/*.html validator
- 대상 한 건만 metadata를 가지며 label은 존재하지 않음
- source/artifact hash와 node·edge parity
- 대상은 Archify embed, 비대상은 기존 React renderer
- preview MAP, Dialog READ 준비 계약
- Viewer 기능·focus·pointer 차단
- load error, DOM 부재와 timeout fallback
- preview 240px root margin lazy mount, Dialog on-demand mount와 5초 timeout
- 대표 Viewer 단축키 입력 전후 camera·theme·presentation·focus 불변
- 별도 새 탭 action 제거

~~~bash
pnpm --dir apps/front exec vitest run +  src/data/portfolio/feature-detail-quality.test.ts +  src/components/projects/archify-swimlane-embed.test.tsx +  src/components/projects/project-detail-rendering.test.tsx
~~~

새 계약이 구현되지 않아 실패하는 것을 RED 근거로 기록한다.

## 3. GREEN: 최소 adapter와 통합

1. FeatureSwimlaneArchifyEmbed { url }과 validator를 적용한다.
2. ArchifySwimlaneEmbed에 same-origin DOM 준비, MAP/READ, theme bridge와 inert 처리를 구현한다.
3. ProjectSwimlane에서 대상 preview와 Dialog만 adapter를 사용한다.
4. 실패와 비대상은 ResponsiveSwimlaneDiagram을 사용한다.
5. Archify로 보기 link와 새 탭 flow를 제거한다.

~~~bash
pnpm --dir apps/front exec vitest run +  src/data/portfolio/feature-detail-quality.test.ts +  src/components/projects/archify-swimlane-embed.test.tsx +  src/components/projects/project-detail-rendering.test.tsx
~~~

## 4. 정적·회귀 검증

~~~bash
pnpm --dir apps/front exec tsc --noEmit

pnpm --dir apps/front test

pnpm --dir apps/front exec eslint +  src/components/projects/ArchifySwimlaneEmbed.tsx +  src/components/projects/archify-swimlane-embed.test.tsx +  src/components/projects/ProjectSwimlane.tsx +  src/components/projects/project-detail-rendering.test.tsx +  src/data/portfolio/types/feature-detail.dto.ts +  src/data/portfolio/feature-details/index.ts +  src/data/portfolio/feature-details/hotel-reservation-platform.ts +  src/data/portfolio/feature-detail-quality.test.ts +  e2e/swimlane-viewer.spec.ts

pnpm --dir apps/front build
~~~

실제 변경 파일 목록이 다르면 scoped eslint 인자를 그 목록에 맞춘다.

## 5. 별도 production E2E

1104 listener와 PID를 먼저 기록하고 빈 별도 포트를 선택한다. build 뒤 해당 포트에서 소유한 production server만 실행한다.

~~~bash
pnpm --dir apps/front start --port 12114 --hostname 127.0.0.1
~~~

apply_patch로 Feature 012 전용 임시 Playwright config를 만들어 base URL을 http://127.0.0.1:12114로 지정한 뒤 실행한다.

~~~bash
pnpm --dir apps/front exec playwright test +  e2e/swimlane-viewer.spec.ts +  --config=playwright.feature-012.prod.config.ts +  --reporter=line
~~~

Browser checks:

- target preview는 viewport 접근 전 iframe 0, 접근 뒤 ready iframe 1
- page 진입 시 Dialog iframe 0, Dialog open 뒤 READ iframe 1
- preview sublabel·edge label visible 0
- Dialog의 승인된 sublabel·edge label 누락 0
- toolbar/search/export/theme/presentation/zoom/pan/semantic control visible·focusable 0
- iframe pointer activation·Tab 진입 0
- 대표 Viewer 단축키 입력 전후 camera·theme·presentation·focus 변경 0
- light/dark 전환 뒤 reload 없이 portfolio token 반영
- 크게 보기 mouse·touch·keyboard, Escape close, trigger focus 복귀
- 320/768/1024/1440px document overflow·카드/close 겹침 0
- 320/768/1024/1440px preview node 10개·edge 12개 유지와 Dialog READ context 확인
- 잘못된 artifact 조건에서 React fallback
- 한마음 과학원 등 비대상 스윔레인의 기존 renderer·Dialog 회귀 0
- 별도 Archify로 보기 link·새 탭 0

검증 뒤 임시 config는 apply_patch로 삭제하고 소유한 production process만 종료한다. 12114 해제와 기존 1104 PID 보존을 확인한다.

## 6. 이미지와 provenance 검토

preview light/dark와 Dialog light/dark screenshot을 저장해 직접 연다.

- node·edge·arrow clipping 0
- node title과 edge label 겹침 0
- preview 정보 과밀 0
- Dialog 세부 문구 누락 0
- 정상/예외 경로 오독 0
- Viewer chrome flash 0

마지막에 JSON·HTML hash와 byte count를 다시 계산해 기준값과 일치시킨다.

## 7. 완료 검사

~~~bash
git diff --check
mise run e2e:changed
mise run feature:status:sync
~~~

task가 저장소에 없거나 baseline 때문에 실패하면 원인과 범위를 verification.md에 기록한다. RED/GREEN, unit/integration, typecheck, scoped lint, build, production E2E, artifact identity와 이미지 검토를 서로 구분하고 speckit-converge가 Converged이기 전에는 완료로 선언하지 않는다.
