# Implementation Plan: 행사 호텔 예약·결제 통합 플랫폼 구조화 상세

**Branch**: `chore/cleanup-downstream-harness` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/015-integrated-reservation-structured-detail/spec.md`

## Summary

`integrated-reservation-platform`의 기존 경로와 목록 위치를 유지하면서 legacy Markdown을 공통 `FeatureDetailDto` 기반 구조화 상세로 이전한다. 공개 상태를 `On Hold`로 바로잡고 1인 백엔드·PM/PL 책임, 고객사 스테이징 UAT, Core Product 관계, `version` 기반 충돌 감지, 단계형 PG 처리와 미완성 재고 복구, Next.js reverse proxy·Cloudflare 대응을 승인된 근거 범위로 제한한다.

작업물에는 고객사 운영자부터 사용자·Next.js BFF·Nest API/DB·PG 테스트 환경까지의 정상 UAT와 재고 충돌·PG 승인 실패를 보여 주는 Archify workflow 하나, Core Product·객실·관광·주문·재고 관계를 보여 주는 소형 Archify architecture 하나를 제공한다. 기존 인사이트 4건은 기본 글 3건으로 재작성하고 중복 BFF 경로 하나는 canonical 글로 영구 연결한다. Middleware·Guard와 BFF 글은 기존 before/after 시각 모델과 키보드 확대 기능을 사용하고 HTTPS 글은 필요성 판정에 따라 텍스트만 제공한다. 콘텐츠·상태·alias·시각 계약을 먼저 RED로 고정한 뒤 구현하며, 1104 개발 서버는 건드리지 않고 별도 production 포트에서 최종 E2E를 수행한다.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.3, Next.js 16.1.6 App Router, Node.js 24 harness runtime

**Primary Dependencies**: 기존 `FeatureDetailDto`, `ProjectDetailContent`, `ProjectSwimlane`, `ArchifySwimlaneEmbed`, `InsightVisual`, shadcn/ui Dialog·Button, Tailwind CSS 4, `react-markdown`, lucide-react, Archify CLI. 신규 런타임 의존성은 추가하지 않는다.

**Storage**: 정적 TypeScript 포트폴리오 데이터, Archify workflow/architecture source JSON과 생성된 정적 HTML. 데이터베이스·외부 API 변경 없음.

**Testing**: Vitest 4.1.11(콘텐츠·DTO·등록·상태·alias·렌더링·시각 모델), Archify showcase validate/deliver/visual-check, Playwright 1.62.1(기존 경로·redirect·목록·양방향 링크·키보드 dialog·반응형·overflow·시각 배치)

**Target Platform**: 웹 브라우저 320/768/1024/1440px, 마우스·터치·키보드와 보조기술용 동등한 텍스트 설명

**Project Type**: split-front-back 모노레포의 프런트엔드 전용 변경(`apps/front`), pnpm. `apps/back`은 변경하지 않는다.

**Performance Goals**: 신규 네트워크 요청이나 동적 데이터 처리를 추가하지 않는다. Archify preview는 기존 지연 로딩과 5초 fallback을 유지한다. 네 시각 자료의 preview/dialog는 페이지 전체 가로 overflow, 핵심 텍스트 잘림과 요소 겹침이 지원 viewport에서 0건이어야 한다.

**Constraints**: 승인 인터뷰 밖의 수치·대안·성과를 만들지 않는다. 코드로 확인되지 않은 충돌 단위 테스트 경험과 비밀번호 암호화 제거는 사용자 보고값으로만 취급한다. 고객 거래 데이터, 실제 회사 도메인·서버 IP, 인증값, 시크릿과 비공개 소스를 공개하지 않는다. 작업물 스윔레인은 정확히 1개이며 관계 다이어그램을 두 번째 스윔레인으로 위장하지 않는다. 기존 Archify viewer의 기능 전체를 노출하지 않고 포트폴리오의 작은 보기·크게보기 계약만 유지한다. `On Hold`는 타입과 실제 화면 모두에 표시한다. 저장소 전역 lint baseline은 범위 밖이며 실제 변경 파일만 검사한다. 1104 사용자 소유 dev server와 `.next/dev` lock을 건드리지 않는다.

**Scale/Scope**: 작업물 1개 구조화 이전, 근거 카드 4개, 작업물 시각 자료 2개, 기존 인사이트 4개→기본 글 3개+호환 alias 1개, 인사이트 시각 자료 2개와 무시각 판정 1개, 공통 상태 표시·Archify embed·시각 확대의 최소 확장, 관련 단위·E2E 검증

## Constitution Check

*GATE: Phase 0 이전 통과. Phase 1 설계 후 재확인.*

| 원칙 | 준수 방법 | 판정 |
| --- | --- | --- |
| I. Evidence-First Portfolio Truth | 승인 인터뷰를 최우선 근거로 삼고 원본 `dev` 코드는 보조 근거로만 사용한다. 직접 확인·사용자 보고·미완성 범위를 분리하고 실제 도메인·IP·고객 데이터·시크릿은 금지 계약으로 차단한다 | PASS |
| II. Interview-Driven Progressive Completion | 인터뷰와 공개 방향이 승인된 통합 예약 작업물 1개와 연결 인사이트 4개만 다룬다. Feature 013 잔여 작업과 다른 콘텐츠는 보존한다 | PASS |
| III. Shared Information Architecture, Optional Evidence | 기존 구조화 DTO·renderer·Archify와 insight visual 계약을 재사용한다. 필요성이 승인된 스윔레인·관계도·인사이트 비교도만 제공하고 HTTPS에는 빈 시각 영역을 만들지 않는다 | PASS |
| IV. Accessible and Responsive Reading | 모든 시각 자료에 동등한 텍스트 설명, 색상 외 문구·선 의미와 키보드 dialog를 제공한다. 4개 viewport와 document overflow를 실제 브라우저에서 검증한다 | PASS |
| V. Test-First, Verifiable Delivery | 상태·콘텐츠·alias·시각 계약을 먼저 RED로 고정하고 관련 Vitest, typecheck, scoped lint, build, Archify receipts, fresh production E2E 순으로 검증한다 | PASS |

**위반 없음.** Complexity Tracking은 필요하지 않다.

## Project Structure

### Documentation (this feature)

```text
specs/015-integrated-reservation-structured-detail/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── public-content-contract.md
│   ├── project-visual-contract.md
│   └── insight-integration-contract.md
├── checklists/
│   └── requirements.md
├── tasks.md
└── verification.md
```

### Source Code (repository root)

```text
apps/front/
├── diagrams/integrated-reservation-platform/
│   ├── uat-booking-payment-flow.json
│   └── core-product-relationships.json
├── public/diagrams/integrated-reservation-platform/
│   ├── uat-booking-payment-flow.html
│   └── core-product-relationships.html
├── src/
│   ├── app/(public)/
│   │   ├── insights/[slug]/page.tsx
│   │   └── projects/[slug]/page.tsx
│   ├── components/
│   │   ├── insights/
│   │   │   ├── InsightVisual.tsx
│   │   │   └── insight-visual-rendering.test.tsx
│   │   └── projects/
│   │       ├── ArchifyEmbed.tsx
│   │       ├── ArchifySwimlaneEmbed.tsx
│   │       ├── ProjectDetailContent.tsx
│   │       ├── ProjectRelationshipDiagram.tsx
│   │       ├── ProjectStatusBadge.tsx
│   │       ├── archify-swimlane-embed.test.tsx
│   │       ├── project-detail-rendering.test.tsx
│   │       └── project-swimlane-layout.test.ts
│   └── data/portfolio/
│       ├── feature-details/
│       │   ├── index.ts
│       │   └── integrated-reservation-platform.ts
│       ├── types/
│       │   ├── feature-detail.dto.ts
│       │   └── feature.dto.ts
│       ├── content-quality.test.ts
│       ├── feature-detail-quality.test.ts
│       ├── features.ts
│       ├── index.ts
│       ├── insight-editorial-quality.test.ts
│       ├── insight-editorial.ts
│       └── insights.ts
└── e2e/
    ├── integrated-reservation-structured-detail.spec.ts
    ├── portfolio-insight-contract.spec.ts
    ├── swimlane-viewer.spec.ts
    ├── codi-harness-portfolio-detail.spec.ts
    └── hipass-structured-detail.spec.ts
```

**Structure Decision**: 변경은 `apps/front`의 정적 콘텐츠와 공통 표시 계층에만 둔다. 작업물 본문은 독립 detail 모듈로 등록하고 legacy `content`를 제거한다. `ProjectStatusBadge`는 기존 status 값을 공통 메타에 표시해 대상별 조건 분기를 피한다. UAT는 기존 `FeatureSwimlane`, 관계도는 새 선택형 `FeatureRelationshipDiagram`으로 모델링한다. Archify iframe 준비·theme·fallback의 공통 동작은 `ArchifyEmbed.tsx`로 최소 추출하되 스윔레인 범례·예외 transcript와 관계도 엔터티·관계 설명은 각 wrapper가 소유한다. 인사이트 비교도는 기존 `InsightVisual` before/after 타입을 유지하고 shadcn Dialog로 확대만 보강한다. canonical insight 목록과 legacy alias를 분리해 목록 중복 없이 정적 redirect를 제공한다.

### Interface Contracts

- [public-content-contract.md](./contracts/public-content-contract.md): 작업물의 역할·기간·상태·근거·구현·미완성·금지 주장 계약
- [project-visual-contract.md](./contracts/project-visual-contract.md): UAT workflow와 Core Product architecture의 질문·artifact·fallback·확대·반응형 계약
- [insight-integration-contract.md](./contracts/insight-integration-contract.md): 인사이트 4→3 통합, alias redirect, 시각 필요성, 양방향 링크와 비중복 계약

## Post-Design Constitution Re-check

Phase 1 산출물을 기준으로 모든 원칙을 다시 통과했다.

| 원칙 | 설계 결과 확인 |
| --- | --- |
| I | data-model과 세 계약이 코드 확인값·사용자 보고값·미완성 범위, 익명화와 금지 주장을 명시한다 |
| II | 통합 예약 작업물과 연결 인사이트만 대상으로 고정하고 다른 작업물 및 Feature 013 상태를 수정하지 않는다 |
| III | 공통 detail·swimlane·insight visual을 재사용하고 관계도 타입과 alias만 필요한 만큼 확장한다. 필요 없는 HTTPS 시각 자료와 demo placeholder는 만들지 않는다 |
| IV | workflow·relationship·before/after 모두 텍스트 대안, 키보드 확대·종료, focus 복귀와 4개 viewport 검증을 계약화했다 |
| V | quickstart가 기준선→RED→구현→Archify delivery→GREEN→production E2E→converge 순서를 고정한다 |

설계 예외나 헌법 위반이 없으므로 Complexity Tracking은 생략한다.
