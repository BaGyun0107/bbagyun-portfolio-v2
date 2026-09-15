# Implementation Plan: 연결형 스윔레인 재설계

**Branch**: `chore/cleanup-downstream-harness` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-connected-swimlane-redesign/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

하네스 상세의 lane별 카드와 별도 edge 목록을 책임 주체 사이의 이동, 의사결정과
되돌림이 실제로 연결된 두 개의 교차 기능 SVG 스윔레인으로 교체한다. 위치·도형·연결과
방문자용 예외 문장을 정적 데이터 계약으로 관리하고 순수 geometry 모듈과 공통 server
renderer로 표현한다. 핵심 결과의 일반적인 `제한` label은 근거 종류에 따라 산정·측정·
관찰 범위로 바꾸며 기존 7개 작업물과 하네스의 나머지 공개 사실은 보존한다.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 24

**Primary Dependencies**: Next.js 16.1.6 App Router, React 19.2.3, Tailwind CSS 4,
기존 `react-markdown`; 신규 diagram dependency 없음

**Storage**: `apps/front/src/data/portfolio/`의 build-time 정적 TypeScript 데이터

**Testing**: Vitest 4.1.11, TypeScript `tsc --noEmit`, ESLint, Next.js production build,
Playwright 1.62.1 E2E

**Target Platform**: 정적 생성되는 공개 포트폴리오 웹 페이지, 최신 데스크톱·모바일 브라우저

**Project Type**: split-front-back 모노레포의 frontend-only 변경

**Performance Goals**: 클라이언트 diagram runtime이나 hydration을 추가하지 않고 두
스윔레인을 build-time 정적 markup으로 생성한다.

**Constraints**: 공개 데모 추가 금지, 기존 지표·인사이트 사실 변경 금지, 외부 diagram
library 추가 금지, `components/ui/*` 수정 금지, 320/768/1024/1440px 페이지 overflow 없음,
키보드와 보조 기술 접근성, 기존 7개 작업물 보존

**Scale/Scope**: 하네스 상세 1개, 스윔레인 2개, 책임 lane 각 4개, 핵심 단계 각 6개,
공통 DTO·validator·geometry·renderer와 관련 unit/E2E 회귀

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 계획 대응 | 사전 판정 | 설계 후 판정 |
| --- | --- | --- | --- |
| I. Evidence-First Portfolio Truth | 공개 지표 값은 바꾸지 않고 기존 caveat를 근거별 범위 label로 정확히 번역한다. 다이어그램도 승인된 운영 흐름만 표현한다. | PASS | PASS |
| II. Interview-Driven Progressive Completion | 사용자와 시각 시안을 승인한 하네스만 재설계하고 나머지 7개 작업물은 보존한다. | PASS | PASS |
| III. Shared Information Architecture, Optional Evidence | 위치 데이터와 공통 renderer를 재사용하되 스윔레인이 없는 작업물에는 빈 영역을 만들지 않는다. | PASS | PASS |
| IV. Accessible and Responsive Reading | 연결선 외에 흐름·예외 문장, 도형·선 스타일, 이름 있는 내부 scroll region과 4개 viewport 검증을 둔다. | PASS | PASS |
| V. Test-First, Verifiable Delivery | 데이터 계약, geometry, server rendering과 E2E를 RED→GREEN 순서로 만들고 type/lint/build/e2e 증거를 기록한다. | PASS | PASS |

의도한 헌법 예외는 없다. 저장소 전역 lint의 기존 Prettier 기준선과 누락된
`feature:status:sync` task는 이전 기능 검증에서 확인된 환경 위험이며 이번 기능의 대상
파일 검증과 전체 명령 결과를 모두 기록한다.

## Project Structure

### Documentation (this feature)

```text
specs/003-connected-swimlane-redesign/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
apps/front/
├── e2e/
│   └── codi-harness-portfolio-detail.spec.ts
└── src/
    ├── components/projects/
    │   ├── ProjectHighlights.tsx
    │   ├── ProjectSwimlane.tsx
    │   ├── ProjectSwimlaneDiagram.tsx               # 신규 SVG renderer
    │   ├── project-swimlane-layout.ts               # 신규 순수 geometry
    │   ├── project-swimlane-layout.test.ts          # 신규 geometry unit
    │   └── project-detail-rendering.test.tsx
    └── data/portfolio/
        ├── index.ts
        ├── feature-detail-quality.test.ts
        ├── feature-details/
        │   ├── index.ts
        │   └── codi-harness-dx-platform.ts
        └── types/
            ├── index.ts
            └── feature-detail.dto.ts
```

**Structure Decision**: 백엔드·API 변경 없이 `apps/front`의 정적 데이터와 Server
Component만 변경한다. 데이터 계약과 콘텐츠 검증은 portfolio data 계층이 소유하고,
좌표 계산은 React 비의존 순수 모듈, SVG markup은 전용 renderer, 공개 설명·scroll 경계는
기존 `ProjectSwimlane`이 소유한다. geometry와 렌더링을 분리해 좌표 계산을 DOM 없이
검증하고 후속 작업물에서도 동일 renderer를 재사용한다.

설계 흐름의 `리뷰·검증`은 성공·실패를 판정하는 decision node로 두고, 성공선 뒤에
보조 `완료` end node를 둔다. 따라서 승인된 핵심 단계는 여섯 개로 유지하면서 완료
상태에서 실패 복귀선이 출발하는 의미 모순을 피한다. 모든 decision 분기선은 색이나
도형만으로 해석하지 않도록 조건 label을 가진다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

헌법 위반이나 별도 복잡성 예외가 없으므로 기록할 항목이 없다.
