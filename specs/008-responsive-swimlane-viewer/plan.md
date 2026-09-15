# Implementation Plan: 반응형 스윔레인 뷰어

**Branch**: `chore/cleanup-downstream-harness` | **Date**: 2026-09-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-responsive-swimlane-viewer/spec.md`

## Summary

구조화 작업물 네 개에서 사용하는 공통 스윔레인 뷰어의 기존 lane·node·edge 관계를
유지하면서 실제 컨테이너 폭에 맞춰 geometry를 다시 계산한다. 본문과 `크게 보기`
Dialog는 같은 데이터와 layout 함수를 사용한다. node 글자는 실제 10px 이상을 유지하고
필요할 때 node 안에서 줄바꿈하며, edge label은 둥근 전체 path 길이의 중앙을 기본으로
충돌하는 항목만 가장 가까운 위·아래 트랙으로 옮긴다. 기존 네 방향 anchor, 작은
화살촉, no-scroll Dialog와 anchor·waypoint·labelAt override는 보존한다.

연결 경로는 source와 target 사이의 실제 행 구간에 있는 node만 장애물 후보로 사용하고,
비연결 node 도형·문구와의 교차를 순수 geometry와 실제 SVG에서 모두 차단한다.
같은 판단 node에서 같은 다음 행으로 갈라지는 세 개 이상의 분기는 목적지 좌→우 순서에
따라 별도 수평 통로를 배정하고, 같은 lane의 분기는 가장 짧은 수직 경로를 유지한다.
같은 행에서 가로로 출발해 target의 위·아래 변으로 도착할 때는 target 바깥쪽 도착
통로로 먼저 이동해 node와 문구를 가로지르지 않는다.

작업물 본문과 공개 문구는 수정하지 않는다. 사용자 화면 피드백으로 승인된 Harness의
두 `배포 중단` 도착 anchor만 서로 교환하고, 불필요해진 수동 waypoint는 제거한다.
나머지 후속 구현은 공통 text/layout 계산과 관련 단위·브라우저 검증에 한정한다.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.3, Next.js 16.1.6 (App Router)

**Primary Dependencies**: 기존 `@radix-ui/react-dialog` 기반 shadcn Dialog,
Tailwind CSS 4, React SVG 렌더링. 신규 런타임 의존성은 추가하지 않는다.

**Storage**: 정적 TypeScript 포트폴리오 데이터. 데이터베이스·외부 API 변경 없음.

**Testing**: Vitest 4.1.11 (순수 레이아웃 함수, DTO 검증, server-rendered markup),
Playwright 1.62.1 (Dialog 상호작용, 반응형 overflow, 접근성, 실제 네 작업물)

**Target Platform**: 웹 브라우저, 320/375/768/1024/1440px 검증. 마우스·터치·키보드 지원.

**Project Type**: split-front-back 모노레포의 프런트엔드 전용 변경 (`apps/front`), pnpm.
백엔드 변경 없음.

**Performance Goals**: 네트워크 요청과 신규 route를 추가하지 않는다. `ResizeObserver`는
정수 단위의 유효한 폭 변경만 반영하고 동일 폭 갱신을 무시한다. 같은 swimlane과 viewport
입력의 geometry는 결정적으로 계산하며 사용자 입력 중 불필요한 반복 계산을 만들지 않는다.

**Constraints**: 기존 포트 1104 dev server와 `.next/dev` lock을 건드리지 않는다.
E2E는 production build를 별도 미사용 포트로 실행하고 임시 Playwright 설정을 삭제한다.
저장소 전역 lint의 기존 baseline은 이번 범위에서 고치지 않고 변경 파일만 검사한다.
관련 없는 파일을 포맷하지 않으며 사용자 소유의 기존 변경을 보존한다.

**Scale/Scope**: 구조화 작업물 4개, 스윔레인 6개에 공통 적용. 공통 뷰어·다이어그램·
레이아웃과 geometry 상수, 단위/렌더링 테스트 및 전용 E2E를 수정한다. 공개 DTO와
작업물별 공개 콘텐츠 입력은 유지하고 승인된 edge geometry override만 정정한다.

## Constitution Check

*GATE: Phase 0 이전 통과. Phase 1 설계 후 재확인.*

| 원칙 | 준수 방법 | 판정 |
| --- | --- | --- |
| I. Evidence-First Portfolio Truth | 작업물 서술·수치·스윔레인 lane/node/edge/label을 변경하지 않는다. 표현 방식만 공통 렌더러에서 개선한다 | PASS |
| II. Interview-Driven Progressive Completion | 콘텐츠 재작성 없이 사용자가 여러 차례 화면 방향을 검토하고 최종 설계를 승인했다. 미인터뷰 작업물 콘텐츠는 건드리지 않는다 | PASS |
| III. Shared Information Architecture, Optional Evidence | 하나의 DTO와 하나의 렌더러를 모든 구조화 상세에서 재사용하고, 스윔레인이 없는 작업물에는 새 영역을 만들지 않는다 | PASS |
| IV. Accessible and Responsive Reading | no-scroll과 Dialog 접근성을 유지하면서 실제 10px 이상 node 글자, node 내부 줄바꿈, label 충돌과 edge-node 교차 0건을 계약으로 고정한다 | PASS |
| V. Test-First, Verifiable Delivery | viewport layout·path midpoint·충돌 resolver·edge-node 교차 테스트의 RED를 먼저 확인하고 typecheck → unit → scoped lint → build → fresh production E2E 순서로 검증한다 | PASS |

**위반 없음.** Complexity Tracking은 필요하지 않다.

## Project Structure

### Documentation (this feature)

```text
specs/008-responsive-swimlane-viewer/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── swimlane-viewer-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/front/src/
├── components/projects/
│   ├── ProjectSwimlane.tsx
│   ├── ProjectSwimlaneDiagram.tsx
│   ├── ResponsiveSwimlaneDiagram.tsx
│   ├── project-swimlane-layout.ts
│   ├── project-swimlane-layout.test.ts
│   ├── responsive-swimlane-diagram.test.tsx
│   └── project-detail-rendering.test.tsx
└── data/portfolio/
    ├── swimlane-geometry.ts
    ├── types/feature-detail.dto.ts
    ├── feature-details/index.ts
    └── feature-detail-quality.test.ts

apps/front/e2e/
├── swimlane-viewer.spec.ts
├── codi-harness-portfolio-detail.spec.ts
└── hanmaum-search-detail.spec.ts
```

**Structure Decision**: `apps/front`만 변경한다. `ProjectSwimlane`은 기존 Dialog 조합을
유지하고, 새 `ResponsiveSwimlaneDiagram`이 inline·Dialog wrapper 폭을 독립적으로
측정해 viewport 입력을 만든다. `ProjectSwimlaneDiagram`은 완성된 layout 결과만 SVG로
표시한다. 좌표·text wrapping·rounded path midpoint·label collision 계산은
`project-swimlane-layout.ts`의 순수 함수로 집중해 독립 테스트한다. 공통 브라우저 계약은
기존 `swimlane-viewer.spec.ts`에 확장한다.

### Interface Contract

외부 API 계약은 없다. 컴포넌트 입력, 접근 가능한 이름, Dialog 상호작용, 연결선
geometry와 호환성 계약은 [contracts/swimlane-viewer-contract.md](./contracts/swimlane-viewer-contract.md)에
기록한다.

## Post-Design Constitution Re-check

Phase 1 산출물을 기준으로 재확인한 결과 모든 원칙을 통과한다.

| 원칙 | 설계 결과 확인 |
| --- | --- |
| I | data-model에서 기존 공개 데이터 불변 조건과 전체 라벨 보존을 명시했다 |
| II | 콘텐츠 범위를 제외하고 사용자 승인 시각 설계만 구현 대상으로 고정했다 |
| III | 본문·Dialog가 동일 `FeatureSwimlane`과 공통 renderer를 사용하는 UI 계약을 정의했다 |
| IV | 기존 접근 이름·Dialog 조작을 보존하고 실제 최소 글자 크기와 node/label·edge/node 충돌 없는 geometry를 계약화했다 |
| V | quickstart와 tasks에 측정 wrapper, 순수 layout, label resolver와 edge-node 교차의 RED → GREEN 및 별도 포트 production E2E를 포함한다 |

설계 예외나 헌법 위반이 없으므로 Complexity Tracking은 생략한다.
