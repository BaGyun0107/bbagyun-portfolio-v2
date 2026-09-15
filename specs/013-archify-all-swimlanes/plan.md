# Implementation Plan: 전체 스윔레인 Archify 임베드 전환

**Branch**: `chore/cleanup-downstream-harness` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/013-archify-all-swimlanes/spec.md`

## Summary

현재 데이터에 존재하는 8개 스윔레인을 실제 Archify 정적 artifact 기반의 공통 작은 보기·크게 보기로 전환한다. Feature 012에서 검증된 `ArchifySwimlaneEmbed` 어댑터와 `ProjectSwimlane`의 Dialog·범례·transcript 계약을 재사용하고, 각 흐름의 승인된 단계·관계·예외 의미를 새 Archify workflow source와 생성 HTML에 1:1로 반영한다. 기존 `ResponsiveSwimlaneDiagram`은 artifact 로드·구조·테마·시간 제한 실패 시의 독립 fallback으로 보존한다.

생성 결과는 정적 same-origin HTML로 배포하며 Archify Viewer를 런타임 제작 도구로 사용하지 않는다. 8개 source와 HTML의 구조 검증, source/artifact parity, provenance receipt, 실제 브라우저의 preview·Dialog·반응형·접근성·fallback 검증을 하나의 feature 검증 기록으로 연결한다. Feature 012의 호텔 artifact는 동결 상태로 읽기·회귀 기준으로만 사용하고 수정하거나 재생성하지 않는다.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.3, Next.js 16.1.6 (App Router), Node.js 24 harness runtime

**Primary Dependencies**: 기존 React, Tailwind CSS 4, Radix Dialog, lucide-react, Vitest 4.1.11, Playwright 1.62.1. Archify는 저장소 밖 skill의 CLI로 artifact를 생성·검증하며 앱 runtime dependency로 추가하지 않는다.

**Storage**: 정적 TypeScript portfolio data, `apps/front/diagrams/**`의 Archify workflow source JSON, `apps/front/public/diagrams/**`의 self-contained HTML. 데이터베이스·외부 API 변경 없음.

**Testing**: Vitest 단위·통합 테스트, Archify `validate`·`deliver` 구조 검증, artifact parity/hash 검사, Playwright 실제 브라우저 검사, production build, 지원 viewport screenshot과 사람의 이미지 검토

**Target Platform**: `apps/front` 프로젝트 상세 화면의 최신 데스크톱·모바일 브라우저. 320px, 768px, 1024px, 1440px 및 기존 Radix Dialog를 지원한다.

**Project Type**: split-front-back 모노레포의 프런트엔드 단일 스트림 변경 (`apps/front`). `apps/back`와 API는 변경하지 않는다.

**Performance Goals**: preview artifact는 IntersectionObserver root margin 240px 안에 들어올 때 준비하고 Dialog artifact는 열릴 때만 mount한다. 각 준비는 5초 안에 완료되지 않으면 fallback으로 전환하며, 페이지 진입 시 8개 preview·8개 Dialog를 모두 eager mount하지 않는다.

**Constraints**: 각 스윔레인의 승인된 topology·문구·예외 의미를 바꾸지 않는다. Feature 012의 호텔 JSON·HTML SHA-256과 byte count를 유지한다. `/diagrams/*.html` 형태의 검증된 same-origin 상대 경로만 허용하고 query/hash·외부 URL은 거부한다. Viewer toolbar·검색·내보내기·pan/zoom·단축키와 iframe 내부 focus/pointer를 표시·활성화하지 않는다. 페이지 전체 가로 overflow는 금지하되, 좁은 Dialog의 문구는 transcript로 제공한다. 사용자가 실행 중인 1104 dev server는 종료·재시작하지 않으며 최종 E2E는 별도 production 포트에서 수행한다. 저장소 전역 lint baseline과 무관한 파일은 포맷하지 않는다.

**Scale/Scope**: 기존 8개 스윔레인, 8개 Archify workflow source, 8개 generated HTML, 공통 adapter·데이터 계약·parity validator·테스트·검증 문서. 새 작업물·새 인사이트·새 공개 문구 작성은 포함하지 않는다.

## Constitution Check

*GATE: Phase 0 이전 통과. Phase 1 설계 후 재확인.*

| 원칙 | 준수 방법 | 판정 |
| --- | --- | --- |
| I. Evidence-First Portfolio Truth | 8개 source를 현재 승인된 feature detail 데이터에서 만들고, 각 artifact의 provenance·parity·validation receipt를 기록한다. 수치와 공개 문구는 전환 중 변경하지 않는다. | PASS |
| II. Interview-Driven Progressive Completion | 대상 8개와 “모두 실제 Archify artifact를 사용하고 React renderer를 fallback으로 보존”하는 A 방향이 사용자 승인으로 확정됐다. | PASS |
| III. Shared Information Architecture, Optional Evidence | 공통 `ProjectSwimlane`·Dialog·legend·transcript·adapter를 사용하고, artifact 실패나 metadata 누락 시 기존 renderer를 유지한다. | PASS |
| IV. Accessible and Responsive Reading | wrapper의 텍스트 설명, keyboard/focus 계약, 색상 외 선·구조 차이, 지원 viewport overflow와 좁은 화면 transcript를 검증한다. | PASS |
| V. Test-First, Verifiable Delivery | artifact·metadata·adapter·fallback·브라우저 흐름을 RED 테스트로 고정한 뒤 targeted lint, typecheck, build, production browser evidence와 이미지 검토를 분리한다. | PASS |

**위반 없음.** Complexity Tracking은 필요하지 않다.

## Phase 0: Research and artifact authoring decisions

1. Feature detail source에서 8개 스윔레인의 stable node/edge ID, canonical 책임 경계, anchor/waypoint, exception edge를 추출하고 Archify workflow source의 의미 입력으로 매핑한다. 독립 viewer의 무스크롤 판독을 위해 인접 책임을 presentation band로 통합할 때는 node/edge topology를 유지하고 canonical lane→band 매핑을 provenance에 기록한다.
2. 새 workflow는 Archify schema v2와 `meta.quality_profile: "showcase"`를 사용한다. 자동 route를 우선하고, validator가 진단한 경우에만 최소 geometry control을 한 번에 하나씩 적용한다. 관계 label은 의미가 있는 경우 유지하며 topology를 보기 좋게 만든다는 이유로 삭제하지 않는다.
3. 각 source를 Archify `validate workflow ... --quality showcase --json`으로 검증한 뒤 `deliver workflow ... --quality showcase --json`으로 동일 이름의 public HTML을 만든다. deliver 이후 source와 HTML을 동결하고 `visual-check`는 동결된 HTML에만 실행한다.
4. 기존 호텔 artifact는 Feature 012의 frozen identity로 해시·구조 회귀만 확인하며 새 전체 전환 source에 복사하거나 수정하지 않는다.
5. 색상·정보 밀도·내부 상호작용·fallback은 기존 adapter의 공통 계약을 확장한다. artifact별로 bespoke renderer를 만들지 않는다.

## Phase 1: Design and contracts

### Artifact inventory

| Feature | Swimlane ID | Source JSON | Generated HTML |
| --- | --- | --- | --- |
| Codi Harness DX Platform | `design-development-verification` | `apps/front/diagrams/codi-harness-dx-platform/design-development-verification.json` | `apps/front/public/diagrams/codi-harness-dx-platform/design-development-verification.html` |
| Codi Harness DX Platform | `cicd-secrets-deployment` | `apps/front/diagrams/codi-harness-dx-platform/cicd-secrets-deployment.json` | `apps/front/public/diagrams/codi-harness-dx-platform/cicd-secrets-deployment.html` |
| 한마음과학원 | `ingestion-and-recovery` | `apps/front/diagrams/hanmaum-science-institute/ingestion-and-recovery.json` | `apps/front/public/diagrams/hanmaum-science-institute/ingestion-and-recovery.html` |
| 한마음과학원 | `search-request-flow` | `apps/front/diagrams/hanmaum-science-institute/search-request-flow.json` | `apps/front/public/diagrams/hanmaum-science-institute/search-request-flow.html` |
| 블랙스톤 벨포레 리조트 | `payment-and-compensation` | `apps/front/diagrams/blackstone-belleforet-resort/payment-and-compensation.json` | `apps/front/public/diagrams/blackstone-belleforet-resort/payment-and-compensation.html` |
| 하이패스 B2B 플랫폼 | `order-payment-compensation` | `apps/front/diagrams/hipass-b2b-platform/order-payment-compensation.json` | `apps/front/public/diagrams/hipass-b2b-platform/order-payment-compensation.html` |
| 호텔 예약 플랫폼 | `platform-change-verification-deployment` | existing Feature 012 frozen files | existing Feature 012 frozen files |
| 통합 SSO 서버 | `central-account-auth-flow` | `apps/front/diagrams/integrated-sso-server/central-account-auth-flow.json` | `apps/front/public/diagrams/integrated-sso-server/central-account-auth-flow.html` |

### Source and runtime boundaries

- `FeatureSwimlane.archify`는 허용된 relative HTML URL만 저장하는 optional metadata로 유지한다.
- `ArchifySwimlaneEmbed`는 preview/Dialog mode, lazy/eager lifecycle, same-origin DOM preparation, theme bridge, timeout/error fallback을 공통으로 소유한다.
- `ProjectSwimlane`은 카드·Dialog·legend·transcript와 기존 `ResponsiveSwimlaneDiagram` fallback을 소유한다. 대상별 조건문은 artifact URL 선택에만 사용한다.
- 별도 Viewer route, 새 탭 action, 서버 API, 데이터베이스 schema, 사용자 계정·인사이트 모델은 만들지 않는다.

### Planned design artifacts

- `research.md`: Archify schema v2, artifact delivery/freeze, source parity, theme/accessibility and failure-boundary decisions
- `data-model.md`: 8개 artifact inventory, source node/edge parity manifest, embed lifecycle and validation receipt entities
- `contracts/archify-embed-contract.md`: URL, artifact, MAP/READ, lazy mount, interaction blocking and fallback contract
- `contracts/portfolio-theme-accessibility-contract.md`: token bridge, line semantics, transcript, focus and responsive contract
- `quickstart.md`: artifact generation/validation, targeted tests, production browser verification and manual visual review commands

## Project Structure

### Documentation (this feature)

```text
specs/013-archify-all-swimlanes/
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
├── diagrams/{codi-harness-dx-platform,hanmaum-science-institute,
│             blackstone-belleforet-resort,hipass-b2b-platform,
│             integrated-sso-server}/
│   └── *.json                                      # 새 Archify workflow source
├── public/diagrams/{same project directories}/
│   └── *.html                                      # 동결된 generated artifact
└── src/
    ├── components/projects/
    │   ├── ArchifySwimlaneEmbed.tsx                # 공통 lifecycle/adapter 확장
    │   ├── ProjectSwimlane.tsx                     # 공통 preview/Dialog/legend/transcript
    │   ├── ResponsiveSwimlaneDiagram.tsx           # 모든 대상의 fallback
    │   ├── archify-swimlane-embed.test.tsx         # adapter/fallback 단위 테스트
    │   ├── project-detail-rendering.test.tsx       # 8개 metadata/rendering 통합 테스트
    │   └── project-swimlane-layout.test.ts        # 공통 layout/overflow 계약
    ├── data/portfolio/feature-details/*.ts         # 승인 데이터 및 URL metadata
    └── data/portfolio/feature-detail-quality.test.ts # source/artifact parity·범위 검사
```

**Structure Decision**: 프런트엔드 소유 경계인 `apps/front`만 변경한다. 8개 artifact는 프로젝트·스윔레인 ID로 1:1 대응하는 정적 파일로 관리하고, 공통 React adapter가 표시·테마·실패 경계를 담당한다. 기존 React SVG는 제거하지 않고 모든 대상의 fallback 및 사실 비교 기준으로 둔다.

## Post-Design Constitution Re-check

Phase 1 설계를 기준으로 모든 원칙을 다시 통과했다.

| 원칙 | 설계 결과 확인 |
| --- | --- |
| I | data model과 parity manifest가 승인 source와 generated artifact의 stable ID·방향·예외 의미·receipt를 연결하고, Feature 012 artifact 불변을 고정한다. |
| II | 현재 데이터의 8개 기존 스윔레인만 대상으로 하며 새 작업물·인사이트·공개 문구를 범위에서 제외한다. |
| III | 모든 대상이 하나의 adapter·card·Dialog·fallback 계약을 재사용하고, artifact가 없는 상태도 빈 카드 없이 동작한다. |
| IV | theme/accessibility contract가 선 종류·구조화 텍스트·focus·viewport를 다루고, 내부 Viewer 상호작용을 차단한다. |
| V | 각 story의 TDD task와 artifact validate/deliver, targeted lint·typecheck·build·production browser evidence를 quickstart와 verification에 분리한다. |

설계 예외나 헌법 위반이 없으므로 Complexity Tracking은 생략한다.
