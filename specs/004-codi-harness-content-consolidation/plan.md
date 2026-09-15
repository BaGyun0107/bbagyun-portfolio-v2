# Implementation Plan: Codi Harness 콘텐츠 보강 및 인사이트 통합

**Branch**: `chore/cleanup-downstream-harness` | **Date**: 2026-08-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-codi-harness-content-consolidation/spec.md`

## Summary

하네스 작업물 상세가 링크를 열지 않아도 구현 실체를 전달하도록 대표 설계 결정 네 개를 본문에 복원하고, 네 개의 짧은 인사이트를 기존 대표 경로의 발전 서사 하나로 통합한다. 기존 정적 포트폴리오 데이터와 공통 상세·Markdown 렌더러를 그대로 사용하며, 하네스 작업물의 숨은 장문과 대표 인사이트의 오래된 대체 본문을 제거해 공개 정본을 각각 하나로 만든다. 콘텐츠 계약, 서버 렌더링, 경로 E2E를 먼저 실패시키고 데이터 중심으로 좁게 수정한다. 공개 경로 변경은 canonical 링크 중복을 제거하는 project detail route 필터와 registry 밖 insight slug를 실제 HTTP 404로 확정하는 static route gate로 제한한 뒤 전체 회귀 검증을 수행한다.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 24

**Primary Dependencies**: Next.js 16.1.6 App Router, React 19.2.3, react-markdown 10.1.0, Tailwind CSS 4

**Storage**: 저장소 내부 TypeScript 정적 포트폴리오 데이터; 데이터베이스·외부 API 변경 없음

**Testing**: Vitest 4.1.11, React server rendering assertions, Playwright 1.62.1, TypeScript, ESLint, Next.js production build

**Target Platform**: 정적 생성되는 웹 포트폴리오, 320px·768px·1024px·1440px 화면과 키보드 탐색

**Project Type**: 모노레포의 기존 Next.js 프론트엔드 콘텐츠 변경

**Performance Goals**: 새 런타임 의존성·클라이언트 상태·네트워크 요청을 추가하지 않고 기존 정적 생성 특성을 유지한다.

**Constraints**: 비공개 구현물·시크릿을 노출하지 않는다. 측정·관찰·산정 근거를 혼합하지 않는다. 검증되지 않은 데모나 지표를 추가하지 않는다. 제거 대상 네 경로에는 redirect를 만들지 않는다. 기존 두 스윔레인, 여섯 지표, 데모 없음, 8개 작업물 경로와 하네스 외 7개 본문을 보존한다.

**Scale/Scope**: 하네스 작업물 1개, 대표 인사이트 1개, 제거 인사이트 4개, 유지 인프라 인사이트 3개, 회귀 대상 작업물 8개

## Constitution Check

*GATE: Phase 0 시작 전 통과했으며 Phase 1 설계 후 다시 확인한다.*

- **증거 우선·정직한 범위 — PASS**: 기존 측정·관찰·산정 문구만 재배치하고 새 수치나 데모를 만들지 않는다. 멀티 세션은 약 2주의 운영 확장 실험으로 명시한다.
- **사용자 가치와 읽기 흐름 — PASS**: 작업물 상세에서 문제·책임·선택·결과를 직접 이해하게 하고, 심화 발전 서사는 대표 인사이트 하나로 분리한다.
- **단일 정본 — PASS**: 구조화 상세가 하네스 작업물 본문을, 대표 인사이트의 `content`가 발전 서사를 단독 소유한다. 사용되지 않는 `Feature.content`와 `legacyContent`는 제거한다.
- **선택 영역 생략 — PASS**: 검증된 데모가 없으므로 CTA를 추가하지 않으며, 제거된 글을 준비 중·비활성 UI로 남기지 않는다.
- **접근성·반응형 — PASS**: 기존 의미 구조와 같은 탭 내부 링크, 외부 링크 안전 속성, 다이어그램 한 번의 키보드 정지 및 페이지 overflow 계약을 회귀 검증한다.
- **테스트 우선·품질 게이트 — PASS**: 콘텐츠·렌더링·경로 계약의 RED를 확인한 뒤 구현하며 typecheck → unit → lint → build → E2E → diff 검사를 수행한다.
- **작업 범위 보존 — PASS**: 앱 데이터와 해당 테스트를 중심으로 수정한다. project detail route에서는 구조화 본문이 직접 연결한 canonical insight를 자동 관련 목록에서 제외하고, insight detail route에서는 registry 밖 slug를 router 단계에서 거부한다. 두 변경 모두 공개 정본·경로 계약을 맞추는 최소 route 조정이며 컴포넌트·스타일·백엔드·의존성은 변경하지 않는다.

Phase 1 재검토 결과도 모두 PASS다. 데이터 모델과 공개 계약은 기존 렌더러를 재사용하고 정본·경로·보존 범위를 명시하므로 새 위반이나 예외가 없다.

## Project Structure

### Documentation (this feature)

```text
specs/004-codi-harness-content-consolidation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── portfolio-content-contract.md
├── checklists/
│   └── requirements.md
├── tasks.md
└── verification.md
```

### Source Code (repository root)

```text
apps/front/
├── src/
│   ├── data/portfolio/
│   │   ├── features.ts
│   │   ├── insights.ts
│   │   ├── feature-details/codi-harness-dx-platform.ts
│   │   ├── feature-detail-quality.test.ts
│   │   └── content-quality.test.ts
│   ├── components/projects/
│   │   └── project-detail-rendering.test.tsx
│   └── app/(public)/
│       ├── projects/[slug]/page.tsx
│       └── insights/[slug]/page.tsx
└── e2e/
    └── codi-harness-portfolio-detail.spec.ts
```

**Structure Decision**: `apps/front`가 UI와 정적 콘텐츠를 소유한다. 기존 `ProjectDetailContent`와 Markdown 렌더러는 재사용하고 데이터 계약 및 회귀 테스트를 중심으로 변경한다. 프로젝트 detail route는 구조화 본문이 이미 직접 연결한 canonical insight를 자동 관련 목록에서 제외해 실제 공개 페이지의 중복 링크를 막는 범위에서만 수정한다. Insight detail route는 정적 registry에 없는 slug를 렌더 단계의 streaming `notFound()`까지 보내지 않고 router 단계에서 404로 확정하도록 static params 밖의 동적 경로를 비활성화한다. `apps/back`, 공통 UI primitive, 스타일과 패키지 설정은 범위 밖이다.

## Implementation Strategy

1. 현재 중복 정본, 네 개의 독립 링크와 200 응답을 재현하는 콘텐츠·SSR·E2E 테스트를 먼저 추가·수정해 RED를 확보한다.
2. 하네스 기본 설명과 구조화 상세를 문제·책임·대표 설계 네 개·결과·회고로 보강하고 `Feature.content` 중복을 제거한다.
3. 기존 `codi-harness-dx-platform-design` 인사이트를 여덟 구간의 대표 글로 확장하고 네 짧은 객체와 `legacyContent`를 제거한다.
4. 프로젝트 detail route가 구조화 본문에 이미 포함된 canonical insight를 관련 목록에서 다시 렌더링하지 않도록 좁게 필터링하고, 실제 페이지의 canonical 링크 1개·제거 링크 0개를 검증한다.
5. Insight detail route는 `generateStaticParams()`에 없는 slug를 router 단계에서 거부해 제거 경로가 streaming 404 UI를 포함한 HTTP 200이 아니라 실제 HTTP 404를 반환하게 한다.
6. 404·내부 링크 0개·유지 인사이트 3개·스윔레인·지표·7개 레거시 본문·4개 viewport를 집중 및 전체 검증한다.
7. 실제 명령과 결과, 의도된 E2E 증거 스탬프 제한을 `verification.md`에 기록하고 `ROADMAP.md` 상태를 동기화한다.

## Complexity Tracking

Constitution 위반이 없으므로 별도 복잡성 예외는 없다.
