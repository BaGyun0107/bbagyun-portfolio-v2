# Implementation Plan: 하이패스 B2B 플랫폼 구조화 상세와 연결 인사이트 정정

**Branch**: `chore/cleanup-downstream-harness` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-hipass-structured-detail/spec.md`

## Summary

`hipass-b2b-platform`을 기존 공통 구조화 상세 DTO와 렌더러로 이전하고, 승인 인터뷰에 맞춰 프로젝트 소개·역할·지표·결제 보상·정산·Socket.io·프론트엔드 협업 서술을 정정한다. 기존 경로를 유지한 두 프로젝트 사례 인사이트는 각각 DB 상태와 JSON 재처리 입력의 역할 분리, 공용 Room과 화원별 User Room의 전달 범위 차이에만 집중하도록 다시 쓴다.

작업물에는 기존 반응형 `ProjectSwimlane`으로 주문·결제·보상 취소 흐름 하나를 제공한다. 인사이트에는 범용 편집기를 만들지 않고 `data-flow`와 `before-after` 두 변형만 갖는 작은 선택형 시각 계약과 공통 `InsightVisual` 렌더러를 추가한다. 세 시각 자료는 서로 다른 질문을 답하고, 각자 동등한 텍스트 설명과 비중복 근거를 가진다. 콘텐츠·DTO·렌더링 계약은 Vitest에서 먼저 실패시키고, 별도 포트의 production build에서 세 공개 경로와 양방향 키보드 탐색, 지원 화면 폭, 실제 도형 겹침을 Playwright로 검증한다.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.3, Next.js 16.1.6 (App Router), Node.js 24 harness runtime

**Primary Dependencies**: 기존 React SVG, Tailwind CSS 4, `react-markdown`, lucide-react, 기존 shadcn/Radix UI 구성. 신규 런타임 의존성은 추가하지 않는다.

**Storage**: 정적 TypeScript 포트폴리오 데이터. 데이터베이스·외부 API 변경 없음.

**Testing**: Vitest 4.1.11 (콘텐츠·DTO·렌더링 계약), Playwright 1.62.1 (공개 경로, 양방향 탐색, 키보드, 반응형 overflow와 실제 시각 배치)

**Target Platform**: 웹 브라우저, 320/768/1024/1440px. 마우스·터치·키보드와 보조기술용 텍스트 대안 지원.

**Project Type**: split-front-back 모노레포의 프런트엔드 전용 변경 (`apps/front`), pnpm. 백엔드와 원본 비공개 하이패스 저장소는 변경하지 않는다.

**Performance Goals**: 네트워크 요청이나 신규 route를 추가하지 않는다. 정적 시각 자료는 페이지 로드 후 추가 fetch 없이 렌더링하고, 두 인사이트 외의 페이지에는 추가 DOM을 만들지 않는다.

**Constraints**: 승인 인터뷰 밖의 수치·기술 검토·운영 결과를 만들지 않는다. 고객 거래 데이터, 계좌 정보, 시크릿, 비공개 로그·소스를 공개하지 않는다. 포트 1104의 기존 dev server와 `.next/dev` lock은 건드리지 않고 E2E는 별도 포트 production server를 사용한다. 저장소 전역 lint baseline은 범위 밖이며 변경 파일만 검사하고 관련 없는 파일을 포맷하지 않는다. 기존 세 공개 slug를 유지한다.

**Scale/Scope**: 작업물 1개 구조화 이전, 기존 인사이트 2개 사실 정정, 작업물 스윔레인 1개, 인사이트 시각 자료 2개, 선택형 시각 DTO·검증기·공통 렌더러 1세트와 관련 단위·E2E.

## Constitution Check

*GATE: Phase 0 이전 통과. Phase 1 설계 후 재확인.*

| 원칙 | 준수 방법 | 판정 |
| --- | --- | --- |
| I. Evidence-First Portfolio Truth | 2026-09-04 승인 인터뷰를 사실 기준으로 사용하고, Outbox·MQ·k6 결과·유실 해결·원자적 외부 결제처럼 철회된 주장은 테스트로 차단한다. 모든 공개 수치는 종류·시점·관찰 범위를 구분한다 | PASS |
| II. Interview-Driven Progressive Completion | 하이패스 작업물과 연결 인사이트 두 건만 인터뷰·문안·시각 방향 승인 범위에서 함께 수정한다. 다른 작업물과 인사이트는 보존한다 | PASS |
| III. Shared Information Architecture, Optional Evidence | 작업물은 기존 `FeatureDetailDto`와 공통 상세 렌더러를 재사용한다. 인사이트는 실제 제공하기로 승인한 두 변형만 선택형 계약으로 추가하고 데이터가 없는 글에는 빈 영역을 만들지 않는다 | PASS |
| IV. Accessible and Responsive Reading | 세 시각 자료에 질문·텍스트 대안을 제공하고 상태·전후 차이를 색상에만 의존하지 않는다. 320~1440px overflow·겹침과 키보드 양방향 탐색을 실제 화면에서 확인한다 | PASS |
| V. Test-First, Verifiable Delivery | 콘텐츠 금지문·DTO 검증·조건부 렌더링·양방향 링크를 RED로 먼저 고정하고 typecheck, 관련·전체 Vitest, scoped lint, build, fresh production E2E 순으로 검증한다 | PASS |

**위반 없음.** Complexity Tracking은 필요하지 않다.

## Project Structure

### Documentation (this feature)

```text
specs/009-hipass-structured-detail/
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
├── app/(public)/insights/[slug]/page.tsx
├── components/
│   ├── insights/
│   │   ├── InsightVisual.tsx
│   │   ├── InsightVisualDiagram.tsx
│   │   └── insight-visual-rendering.test.tsx
│   └── projects/
│       └── project-detail-rendering.test.tsx
└── data/portfolio/
    ├── feature-details/
    │   ├── hipass-b2b-platform.ts
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
└── hipass-structured-detail.spec.ts
```

**Structure Decision**: `apps/front`의 기존 정적 데이터 계층과 공개 route만 수정한다. 하이패스 구조화 상세은 별도 데이터 모듈로 만들고 기존 `ProjectDetailContent`와 `ProjectSwimlane`을 그대로 사용한다. 실제 인사이트 시각 데이터는 `InsightDto`의 선택 필드로 보관해 본문과 분리된 slug registry를 만들지 않는다. `InsightVisual`은 제목·질문·텍스트 대안·범례를 담당하고 `InsightVisualDiagram`은 승인된 두 변형만 SVG/semantic HTML로 표현한다. 시각 데이터가 없는 기존 인사이트의 markup은 변하지 않는다.

### Interface Contracts

- [insight-visual-contract.md](./contracts/insight-visual-contract.md): 두 시각 변형의 입력, 검증, 렌더링, 접근성·반응형 계약
- [public-content-contract.md](./contracts/public-content-contract.md): 작업물·인사이트의 공개 문안, 지표, 경로, 양방향 연결과 금지 주장 계약

## Post-Design Constitution Re-check

Phase 1 산출물을 기준으로 모든 원칙을 다시 통과했다.

| 원칙 | 설계 결과 확인 |
| --- | --- |
| I | data-model과 공개 콘텐츠 계약에 각 수치의 단위·근거·시점·한계 및 철회 문구 0건 조건을 명시했다 |
| II | 인터뷰 밖 기술은 `검토하지 않음` 또는 `현재 고민`의 사실 경계로만 기록하고 세 승인 기록 밖 콘텐츠는 제외했다 |
| III | 기존 작업물 구조와 renderer를 재사용하며, 인사이트 시각 계약은 제공 대상 두 건과 두 변형으로 제한했다 |
| IV | 텍스트 대안, 전후·성공·실패 문자 표지, responsive wrapping, document overflow 0건을 계약화했다 |
| V | quickstart에 RED 증거와 콘텐츠·렌더링·production E2E 검증 순서를 분리해 기록했다 |

설계 예외나 헌법 위반이 없으므로 Complexity Tracking은 생략한다.
