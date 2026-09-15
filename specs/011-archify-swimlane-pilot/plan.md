# Implementation Plan: Archify 스윔레인 파일럿

**Branch**: `chore/cleanup-downstream-harness` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-archify-swimlane-pilot/spec.md`

## Summary

호텔 예약 시스템의 기존 `플랫폼 변경·검증·배포 흐름` React 미리보기와 `크게 보기` Dialog를 그대로 유지하면서, 동일한 10개 단계와 12개 관계를 Archify `workflow` standalone viewer로 새 탭에서 제공한다. 대상 스윔레인에만 선택형 링크 metadata를 추가하고, 연결되지 않은 다른 스윔레인에는 새 UI나 placeholder를 만들지 않는다.

Archify의 편집 가능한 JSON 원본과 검증된 self-contained HTML을 저장소에 함께 보존한다. 앱의 build와 runtime은 Archify 설치나 실행에 의존하지 않고 `public/diagrams`의 정적 HTML만 제공한다. 구현은 DTO·validator·조건부 렌더링 테스트를 먼저 실패시키고, 승인된 기존 의미와 Archify 원본의 parity 검사, showcase validation·delivery receipt·visual-check, 별도 production 포트의 Playwright와 이미지 기반 육안 검토로 완료한다.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.3, Next.js 16.1.6 (App Router), Node.js 24 harness runtime

**Primary Dependencies**: 기존 React SVG/semantic HTML, Tailwind CSS 4, Radix Dialog, lucide-react. 제작·검증 도구는 사용자 환경의 Archify 2.17을 사용하지만 신규 앱 runtime dependency는 추가하지 않는다.

**Storage**: 정적 TypeScript 포트폴리오 데이터, 편집 가능한 Archify workflow JSON, `apps/front/public`의 self-contained HTML. 데이터베이스·외부 API 변경 없음.

**Testing**: Vitest 4.1.11 (DTO·validator·의미 parity·조건부 렌더링·파일 존재), Archify showcase validate/deliver/visual-check, Playwright 1.62.1 (새 탭, HTTP 200, 키보드, 회귀, responsive overflow), screenshot 이미지 검토

**Target Platform**: 기존 프로젝트 페이지 320/768/1024/1440px, standalone viewer 1440×900/1600×1000/1920×1080의 웹 브라우저

**Project Type**: split-front-back 모노레포의 프런트엔드 전용 변경 (`apps/front`), pnpm. `apps/back` 변경 없음.

**Performance Goals**: 프로젝트 본문은 기존 렌더링 비용을 유지하고 대상 카드에 정적 링크 하나만 추가한다. standalone HTML은 별도 애플리케이션 호출이나 런타임 생성 없이 같은 출처에서 직접 응답한다.

**Constraints**: 기존 10개 단계·12개 관계·주 흐름·동등한 세 분기·패리티 복구 의미를 변경하지 않는다. 공개 본문과 인사이트 문구, 수치, 기술 구성요소와 성과를 추가하거나 수정하지 않는다. Archify JSON 최종 validation 통과 뒤 원본을 동결하고 `deliver` 결과를 직접 편집하지 않는다. 고정 Viewer UI와 문서 언어는 영어 fallback이고 작성된 diagram content는 한국어다. 기존 1104 dev server를 종료·재시작하지 않으며 최종 E2E는 별도 production 포트를 사용한다. 저장소 전역 lint baseline과 관련 없는 포맷 변경은 범위 밖이다.

**Scale/Scope**: 스윔레인 1개, 선택형 metadata 1개, Archify workflow JSON 1개, standalone HTML 1개, 기존 프로젝트 카드 action 1개, 관련 validator·단위 테스트·E2E와 Feature 011 검증 문서

## Constitution Check

*GATE: Phase 0 이전 통과. Phase 1 설계 후 재확인.*

| 원칙 | 준수 방법 | 판정 |
| --- | --- | --- |
| I. Evidence-First Portfolio Truth | Feature 010의 승인된 10개 단계와 12개 관계를 유일한 의미 기준으로 사용하고 새 수치·구성요소·성과를 금지한다. JSON·HTML·검증 자료에도 고객 정보, 시크릿, 비공개 소스·로그를 넣지 않는다 | PASS |
| II. Interview-Driven Progressive Completion | 사용자가 대상, 표현 방식, 기존 UI 보존, 새 탭, 원본·결과물 관리와 후속 전환 제외를 모두 승인했다. 본문·인사이트의 substantive copy는 변경하지 않는다 | PASS |
| III. Shared Information Architecture, Optional Evidence | 기존 `FeatureSwimlane`과 공통 `ProjectSwimlane`을 선택 필드로 확장하며 metadata가 없는 작업물에는 빈 UI를 만들지 않는다 | PASS |
| IV. Accessible and Responsive Reading | 새 링크에 대상·새 탭을 포함한 accessible name과 안전한 관계를 제공한다. 카드와 viewer의 지정 viewport overflow·겹침을 브라우저에서 검사하고 기존 text alternative를 유지한다 | PASS |
| V. Test-First, Verifiable Delivery | DTO·validator·조건부 렌더링·의미 parity를 RED로 먼저 만들고 typecheck, Vitest, scoped lint, build, Archify receipt, fresh production E2E와 이미지 검토를 분리한다 | PASS |

**위반 없음.** Complexity Tracking은 필요하지 않다.

## Project Structure

### Documentation (this feature)

```text
specs/011-archify-swimlane-pilot/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── archify-artifact-contract.md
│   └── archify-link-contract.md
├── checklists/
│   └── requirements.md
├── tasks.md
└── verification.md
```

### Source Code (repository root)

```text
apps/front/
├── diagrams/
│   └── hotel-reservation-platform/
│       └── platform-change-verification-deployment.json
├── public/diagrams/
│   └── hotel-reservation-platform/
│       └── platform-change-verification-deployment.html
├── src/
│   ├── components/projects/
│   │   ├── ProjectSwimlane.tsx
│   │   └── project-detail-rendering.test.tsx
│   └── data/portfolio/
│       ├── feature-details/
│       │   ├── hotel-reservation-platform.ts
│       │   └── index.ts
│       ├── types/feature-detail.dto.ts
│       └── feature-detail-quality.test.ts
└── e2e/
    └── swimlane-viewer.spec.ts
```

**Structure Decision**: 변경은 `apps/front`의 기존 정적 데이터·공통 스윔레인 렌더러·테스트에 한정한다. Archify JSON은 앱 외부 제작 도구가 읽는 의미 원본이고, 생성 HTML은 Next.js가 수정 없이 제공하는 정적 공개 산출물이다. 선택형 metadata는 기존 DTO와 validator에서 안전한 same-origin `/diagrams/*.html` 경로만 허용하며, 실제 UI는 metadata가 있을 때만 기존 card header에 링크를 추가한다.

### Interface Contracts

- [archify-link-contract.md](./contracts/archify-link-contract.md): 선택형 DTO, 경로 검증, 조건부 action, 접근성·안전한 새 탭 계약
- [archify-artifact-contract.md](./contracts/archify-artifact-contract.md): 기존 의미와 Archify workflow parity, source/artifact 배치, validate·deliver·browser·육안 증거 계약

## Post-Design Constitution Re-check

Phase 1 산출물을 기준으로 모든 원칙을 다시 통과했다.

| 원칙 | 설계 결과 확인 |
| --- | --- |
| I | data model과 artifact contract가 기존 10개 단계·12개 관계를 canonical source로 삼고 새 주장과 비공개 자료를 차단한다 |
| II | 사용자 승인 범위인 호텔 예약 시스템 스윔레인 하나만 대상으로 고정하고 본문·인사이트 변경과 후속 전환을 제외한다 |
| III | 선택형 metadata가 없는 기존 콘텐츠의 DOM과 동작을 보존하고 placeholder를 만들지 않는다 |
| IV | link contract와 quickstart가 accessible name, safe new-tab, 카드·viewer viewport와 이미지 검토를 구분한다 |
| V | quickstart에 RED/GREEN, Archify 3단계 증거, production E2E와 최종 회귀 검증 순서를 기록했다 |

설계 예외나 헌법 위반이 없으므로 Complexity Tracking은 생략한다.
