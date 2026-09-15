# Implementation Plan: 호텔 예약 플랫폼 구조화 상세와 연결 인사이트 정정

**Branch**: `chore/cleanup-downstream-harness` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-hotel-reservation-platform/spec.md`

## Summary

`hotel-reservation-platform`을 기존 공통 구조화 상세 DTO와 렌더러로 이전하고, 1차 설정 중심 플랫폼화에서 2026년 `core/platform` 리빌딩으로 이어진 진화 과정과 실제 책임·검증 범위를 승인 인터뷰에 맞춰 정정한다. 기존 경로를 유지한 두 프로젝트 사례 인사이트는 각각 `core`·`rsConfig`·`platform` 배치 기준과 예약 라우터 범위 Context의 생명주기 판단에만 집중하도록 다시 쓴다.

작업물에는 기존 반응형 `ProjectSwimlane`으로 요구사항 분류부터 플랫폼별 빌드·검증·배포, 패리티 누락의 감사·재이식까지 보여주는 흐름 하나를 제공한다. 두 인사이트는 Feature 009에서 도입한 `data-flow`와 `before-after` 시각 계약을 재사용하되, 하이패스 사례에 종속된 성공·실패·Room 역할 제약을 일반 코드 분류와 컴포넌트 관계에도 맞도록 최소 일반화한다. 콘텐츠·DTO·검증·렌더링 계약은 Vitest에서 먼저 실패시키고, 개발 중에는 사용자가 실행한 1104 서버에서 시각 확인하며 최종 증거는 별도 포트 production build에서 Playwright로 검증한다.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.3, Next.js 16.1.6 (App Router), Node.js 24 harness runtime

**Primary Dependencies**: 기존 React SVG/semantic HTML, Tailwind CSS 4, `react-markdown`, lucide-react, 기존 shadcn/Radix UI 구성. 신규 런타임 의존성은 추가하지 않는다.

**Storage**: 정적 TypeScript 포트폴리오 데이터. 데이터베이스·외부 API 변경 없음.

**Testing**: Vitest 4.1.11 (콘텐츠·DTO·시각 계약·렌더링), Playwright 1.62.1 (공개 경로, 양방향 탐색, 키보드, 반응형 overflow와 실제 시각 배치)

**Target Platform**: 웹 브라우저, 320/768/1024/1440px. 마우스·터치·키보드와 보조기술용 텍스트 대안 지원.

**Project Type**: split-front-back 모노레포의 프런트엔드 전용 변경 (`apps/front`), pnpm. 백엔드와 읽기 전용 원본 저장소 `/Users/codiworks_dev/Desktop/codi-rs-module`은 변경하지 않는다.

**Performance Goals**: 네트워크 요청이나 신규 route를 추가하지 않는다. 정적 시각 자료는 페이지 로드 후 추가 요청 없이 렌더링하고, 대상 두 인사이트 외의 페이지에는 추가 시각 DOM을 만들지 않는다.

**Constraints**: 승인 인터뷰 밖의 수치·대안·운영 결과를 만들지 않는다. 고객 정보, 시크릿, 비공개 소스와 내부 감사 수치를 공개하지 않는다. 1104의 사용자 실행 dev server는 개발 중 기준선·시각 확인에 재사용하고 임의로 종료·재시작하지 않는다. production build 뒤 기존 listener가 사라지는 예외가 발생하면 원인과 stale lock을 먼저 확인하고 사용자 승인 뒤에만 복구한다. 최종 E2E는 `.next/dev` 잠금과 dev 상태 영향을 피하도록 별도 포트 production server를 사용한다. 저장소 전역 lint baseline은 범위 밖이며 변경 파일만 검사하고 관련 없는 파일을 포맷하지 않는다. 기존 세 공개 slug를 유지한다.

**Scale/Scope**: 작업물 1개 구조화 이전, 기존 인사이트 2개 사실 정정, 작업물 스윔레인 1개, 인사이트 시각 자료 2개, 기존 선택형 시각 DTO·검증기의 최소 일반화와 관련 단위·E2E.

## Constitution Check

*GATE: Phase 0 이전 통과. Phase 1 설계 후 재확인.*

| 원칙 | 준수 방법 | 판정 |
| --- | --- | --- |
| I. Evidence-First Portfolio Truth | 2026-09-09 승인 인터뷰와 읽기 전용 소스 확인을 사실 기준으로 사용하고, 프로젝트 복제·무배포 온보딩·상태 접근 통제·가격 및 재고 재검증처럼 철회된 주장은 테스트로 차단한다 | PASS |
| II. Interview-Driven Progressive Completion | 호텔 예약 작업물과 연결 인사이트 두 건만 승인된 문안·시각 방향 범위에서 함께 수정한다. 다른 작업물과 인사이트는 보존한다 | PASS |
| III. Shared Information Architecture, Optional Evidence | 작업물은 기존 `FeatureDetailDto`와 공통 상세 렌더러를 재사용한다. 인사이트는 기존 두 시각 변형을 일반화해 사용하며 데이터가 없는 글에는 빈 영역을 만들지 않는다 | PASS |
| IV. Accessible and Responsive Reading | 세 시각 자료에 질문·동등한 텍스트 대안을 제공하고 관계 차이를 색상에만 의존하지 않는다. 320~1440px overflow·겹침과 키보드 양방향 탐색을 실제 화면에서 확인한다 | PASS |
| V. Test-First, Verifiable Delivery | 콘텐츠 금지문·DTO 검증·조건부 렌더링·양방향 링크를 RED로 먼저 고정하고 typecheck, 관련·전체 Vitest, scoped lint, build, fresh production E2E 순으로 검증한다 | PASS |

**위반 없음.** Complexity Tracking은 필요하지 않다.

## Project Structure

### Documentation (this feature)

```text
specs/010-hotel-reservation-platform/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── insight-visual-contract.md
│   └── public-content-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/front/src/
├── components/
│   ├── insights/
│   │   ├── InsightVisual.tsx
│   │   ├── InsightVisualDiagram.tsx
│   │   └── insight-visual-rendering.test.tsx
│   └── projects/
│       ├── project-detail-rendering.test.tsx
│       └── project-swimlane-layout.test.ts
└── data/portfolio/
    ├── feature-details/
    │   ├── hotel-reservation-platform.ts
    │   └── index.ts
    ├── types/insight.dto.ts
    ├── content-quality.test.ts
    ├── feature-detail-quality.test.ts
    ├── features.ts
    ├── index.ts
    ├── insight-editorial.ts
    ├── insight-editorial-quality.test.ts
    └── insights.ts

apps/front/e2e/
├── hotel-reservation-platform.spec.ts
├── portfolio-insight-contract.spec.ts
└── swimlane-viewer.spec.ts
```

**Structure Decision**: `apps/front`의 기존 정적 데이터 계층과 공개 route만 수정한다. 호텔 예약 작업물 구조화 상세는 별도 데이터 모듈로 만들고 기존 `ProjectDetailContent`와 `ProjectSwimlane`을 그대로 사용한다. 두 인사이트의 실제 시각 데이터는 기존 `InsightDto.visual`에 보관한다. 기존 `data-flow`는 모든 흐름에 성공·실패·재시도를 강제하지 않도록 일반화하고, 기존 `before-after`는 컴포넌트·Provider 관계를 표현할 역할과 관계 범위를 추가한다. 하이패스 고유 성공·실패·재시도 및 Room 범위 조건은 하이패스 콘텐츠 회귀 테스트에 남겨 기존 의미를 보존한다.

### Interface Contracts

- [insight-visual-contract.md](./contracts/insight-visual-contract.md): 일반화된 두 시각 변형의 입력, 검증, 렌더링, 접근성·반응형 계약
- [public-content-contract.md](./contracts/public-content-contract.md): 작업물·두 인사이트의 공개 문안, 경로, 양방향 연결과 금지 주장 계약

## Post-Design Constitution Re-check

Phase 1 산출물을 기준으로 모든 원칙을 다시 통과했다.

| 원칙 | 설계 결과 확인 |
| --- | --- |
| I | data-model과 공개 콘텐츠 계약에 승인 사실, 근거 종류와 철회 문구 0건 조건을 명시했다 |
| II | 승인된 한 작업물과 두 연결 인사이트만 대상으로 고정하고 NICEPAY·패리티 별도 인사이트는 만들지 않았다 |
| III | 기존 작업물 renderer와 두 인사이트 시각 변형을 재사용하며 일반화 범위를 현재 두 의미에 필요한 값으로 제한했다 |
| IV | 텍스트 대안, 분류·전후 관계의 문자 표지, responsive wrapping, document overflow 0건을 계약화했다 |
| V | quickstart에 RED 증거와 콘텐츠·렌더링·production E2E 검증 순서를 분리해 기록했다 |

설계 예외나 헌법 위반이 없으므로 Complexity Tracking은 생략한다.
