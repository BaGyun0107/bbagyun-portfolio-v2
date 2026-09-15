# Implementation Plan: Archify 스윔레인 임베드 전환

**Branch**: `chore/cleanup-downstream-harness` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/012-archify-swimlane-embed/spec.md`

## Summary

호텔 예약 시스템의 `플랫폼 변경·검증·배포 흐름` 한 건을 기존 React SVG에서 실제 Archify 생성 HTML로 전환한다. 현재 `ProjectSwimlane` 카드의 제목·목적·요약·예외 대응과 Radix Dialog 기반 `크게 보기`는 유지하고, 같은 출처의 정적 HTML을 작은 보기에서는 MAP 밀도, Dialog에서는 READ 밀도로 준비한다.

새 `ArchifySwimlaneEmbed` 어댑터는 same-origin iframe이 준비된 뒤에만 노출한다. 생성 문서의 embed 모드, 정보 밀도, 정지 모션과 현재 포트폴리오 CSS 변수 기반 테마를 런타임에 적용하고 내부 상호작용을 inert 처리한다. 로드 실패·예상 DOM 부재·제한 시간 초과·same-origin 접근 실패 때는 검증된 `ResponsiveSwimlaneDiagram`으로 대체한다. Feature 011의 JSON·HTML은 직접 수정하거나 재생성하지 않고 해시를 검증하며, 별도 `Archify로 보기` 링크는 제거한다.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.3, Next.js 16.1.6 (App Router), Node.js 24 harness runtime

**Primary Dependencies**: 기존 React, Tailwind CSS 4, Radix Dialog, lucide-react. 신규 앱 dependency와 Archify 제작/runtime dependency는 추가하지 않는다.

**Storage**: 정적 TypeScript 포트폴리오 데이터와 Feature 011에서 생성된 same-origin self-contained HTML. 데이터베이스·외부 API 변경 없음.

**Testing**: Vitest 4.1.11 (DTO·validator·렌더링·DOM 준비·fallback), Playwright 1.62.1 (lazy load, Dialog, keyboard/focus, theme, responsive overflow, 다른 작업물 회귀), production build, screenshot 이미지 검토

**Target Platform**: 최신 데스크톱·모바일 브라우저의 프로젝트 상세 화면, 320/768/1024/1440px와 기존 Dialog

**Project Type**: split-front-back 모노레포의 프런트엔드 단일 스트림 변경 (`apps/front`), pnpm. `apps/back` 변경 없음.

**Performance Goals**: 작은 보기 artifact는 viewport의 240px root margin 안에 들어올 때 준비하고 상세 artifact는 Dialog가 열릴 때만 mount한다. 준비는 5초 안에 완료하지 못하면 기존 renderer로 대체한다. 페이지 진입 시 두 iframe을 함께 준비하지 않으며 준비 중 원래 Viewer 화면을 노출하지 않는다.

**Constraints**: 승인된 10개 node·12개 edge의 topology와 문구를 바꾸지 않는다. `apps/front/diagrams/...json`과 `apps/front/public/diagrams/...html`의 Feature 011 해시를 유지한다. same-origin `/diagrams/*.html`만 허용한다. iframe 내부의 Viewer 도구·pointer·keyboard 동작을 제거하고 시각 자료 바깥의 텍스트 대안을 유지한다. 사용자가 실행 중인 1104 dev server를 종료·재시작하지 않으며 E2E는 별도 production 포트에서 수행한다. 저장소 전역 lint baseline과 관련 없는 포맷은 범위 밖이다.

**Scale/Scope**: 대상 스윔레인 1개, url-only embed metadata 1개, 공통 embed 어댑터 1개, 기존 카드 renderer·validator·테스트·E2E 수정. 다른 스윔레인은 전환하지 않는다.

## Constitution Check

*GATE: Phase 0 이전 통과. Phase 1 설계 후 재확인.*

| 원칙 | 준수 방법 | 판정 |
| --- | --- | --- |
| I. Evidence-First Portfolio Truth | Feature 011의 동결된 JSON·HTML과 10개 node·12개 edge를 유일한 시각 근거로 사용한다. 본문·인사이트·수치·기술 주장을 변경하지 않는다 | PASS |
| II. Interview-Driven Progressive Completion | 대상, MAP/READ 밀도, A1 색상, 기능 제거, fallback과 단일 파일럿 범위를 사용자와 질의응답으로 승인했다 | PASS |
| III. Shared Information Architecture, Optional Evidence | 기존 `ProjectSwimlane` 카드와 Dialog를 유지하고 선택 metadata가 없는 작업물은 현재 React renderer를 그대로 사용한다 | PASS |
| IV. Accessible and Responsive Reading | 시각 자료는 외부 `role=img`와 설명을 제공하고 iframe은 assistive technology·Tab·pointer에서 제외한다. 지정 viewport overflow와 focus 복귀를 검사한다 | PASS |
| V. Test-First, Verifiable Delivery | metadata·렌더링·DOM adapter·fallback·browser behavior를 RED로 먼저 고정하고 targeted lint, typecheck, build, production E2E와 이미지 검토를 분리한다 | PASS |

**위반 없음.** Complexity Tracking은 필요하지 않다.

## Project Structure

### Documentation (this feature)

```text
specs/012-archify-swimlane-embed/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── archify-embed-contract.md
│   └── portfolio-theme-accessibility-contract.md
├── checklists/
│   └── requirements.md
├── tasks.md
└── verification.md
```

### Source Code (repository root)

```text
apps/front/
├── diagrams/hotel-reservation-platform/
│   └── platform-change-verification-deployment.json       # 동결 원본
├── public/diagrams/hotel-reservation-platform/
│   └── platform-change-verification-deployment.html       # 동결 생성물
├── src/
│   ├── components/projects/
│   │   ├── ArchifySwimlaneEmbed.tsx                       # 신규 same-origin adapter
│   │   ├── ProjectSwimlane.tsx                            # 대상 선택·Dialog 통합
│   │   ├── ResponsiveSwimlaneDiagram.tsx                  # 실패·비대상 fallback
│   │   ├── archify-swimlane-embed.test.tsx                # 신규 adapter 단위 테스트
│   │   └── project-detail-rendering.test.tsx              # 통합 렌더링 테스트
│   └── data/portfolio/
│       ├── feature-details/
│       │   ├── hotel-reservation-platform.ts              # url-only 선택 metadata
│       │   └── index.ts                                   # same-origin 검증
│       ├── types/feature-detail.dto.ts                     # embed 계약
│       └── feature-detail-quality.test.ts                  # 데이터 품질·해시·범위
└── e2e/
    └── swimlane-viewer.spec.ts                            # 실제 브라우저 회귀
```

**Structure Decision**: `apps/front` 내부의 기존 스윔레인 소유 경계만 확장한다. 생성 HTML은 정적 자료로 유지하고, 클라이언트 컴포넌트가 same-origin document에 표시 전용 속성·CSS 변수·상호작용 차단을 적용한다. 별도 Viewer route나 Archify runtime을 만들지 않는다. React renderer는 비대상과 실패 상태의 유일한 fallback이다.

### Interface Contracts

- [archify-embed-contract.md](./contracts/archify-embed-contract.md): url-only metadata, MAP/READ DOM 준비, lazy mount, 실패 상태와 동결 artifact 계약
- [portfolio-theme-accessibility-contract.md](./contracts/portfolio-theme-accessibility-contract.md): CSS 변수 매핑, 기능 제거, inert iframe, 접근성·responsive·Dialog 계약

## Post-Design Constitution Re-check

Phase 1 산출물을 기준으로 모든 원칙을 다시 통과했다.

| 원칙 | 설계 결과 확인 |
| --- | --- |
| I | data model과 embed contract가 Feature 011 artifact identity와 topology를 보존하고 공개 본문 변경을 금지한다 |
| II | 승인된 호텔 예약 시스템 한 건과 두 정보 밀도만 허용하며 다른 작업물 자동 전환을 제외한다 |
| III | 선택 metadata와 실패 상태 모두 기존 공통 카드·Dialog·fallback 경계를 재사용한다 |
| IV | theme/accessibility contract가 텍스트 대안, 색상 외 예외 표시, iframe 비상호작용, focus와 viewport 검사를 명시한다 |
| V | quickstart가 RED→GREEN→REFACTOR, targeted 정적 검사, production E2E, 해시와 이미지 검토를 분리한다 |

설계 예외나 헌법 위반이 없으므로 Complexity Tracking은 생략한다.
