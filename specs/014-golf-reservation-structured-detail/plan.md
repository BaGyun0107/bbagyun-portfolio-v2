# Implementation Plan: 골프 예약 시스템 구조화 상세

**Branch**: `chore/cleanup-downstream-harness` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/014-golf-reservation-structured-detail/spec.md`

## Summary

`the-siena-golf-reservation`의 기존 공개 경로와 목록 항목을 유지하면서 legacy Markdown을 공통 `FeatureDetailDto` 기반 구조화 상세로 이전한다. 첫 프로젝트에서 정해진 구조 안의 예약 화면·PHP 요청 처리·외부 PMS 연동·중복 방어·통신 로그 기록을 구현한 책임과, 운영 유지보수 중 업무 DB의 로그를 `syslog`로 분리한 후속 판단을 구분한다.

작업물에는 사용자·React·PHP 서버·외부 PMS 사이의 정상 예약과 2초 이내 동일 세션 재요청, PMS 5xx, 30초 timeout 분기를 보여 주는 Archify 스윔레인 하나만 제공한다. 연결된 로그 분리 인사이트는 승인된 본문과 업무 DB→`syslog` 전후 시각 자료를 유지하고 작업물 전체 서사를 반복하지 않는다. 콘텐츠·DTO·Archify source·renderer·공개 경로 계약을 테스트에서 먼저 실패시킨 뒤 구현하며, 최종 브라우저 검증은 사용자가 실행한 1104 dev server를 건드리지 않고 별도 production 포트에서 수행한다.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.3, Next.js 16.1.6 App Router, Node.js 24 harness runtime

**Primary Dependencies**: 기존 `FeatureDetailDto`, `ProjectDetailContent`, `ProjectSwimlane`, `ArchifySwimlaneEmbed`, Tailwind CSS 4, `react-markdown`, lucide-react, Archify CLI. 신규 런타임 의존성은 추가하지 않는다.

**Storage**: 정적 TypeScript 포트폴리오 데이터, Archify source JSON과 생성된 정적 HTML. 데이터베이스·외부 API 변경 없음.

**Testing**: Vitest 4.1.11(콘텐츠·DTO·등록·렌더링·Archify 임베드), Archify validate/deliver/visual-check, Playwright 1.62.1(공개 경로·목록·양방향 링크·키보드·반응형·overflow·시각 배치)

**Target Platform**: 웹 브라우저 320/768/1024/1440px, 마우스·터치·키보드와 보조기술용 동등한 텍스트 설명

**Project Type**: split-front-back 모노레포의 프런트엔드 전용 변경(`apps/front`), pnpm

**Performance Goals**: 신규 API나 동적 데이터 요청을 추가하지 않는다. Archify preview는 기존 지연 로딩을 재사용하고, 크게보기와 fallback 동작을 유지한다. 페이지 전체 가로 overflow와 핵심 노드·화살표·라벨 겹침은 지원 viewport에서 0건이어야 한다.

**Constraints**: 승인 인터뷰 밖의 수치·대안·성과를 만들지 않는다. 고객 예약 내역, 인증 정보, 개인정보, 시크릿, 실제 요청·응답 값과 비공개 소스를 공개하지 않는다. 작업물에는 스윔레인 정확히 1개만 제공하고 ERD·로그 전후 비교를 추가하지 않는다. 총 예약 건수를 분모로 한 비율, 중복률 0%, 무결성 보장, 처리 시간·장애율·파일 I/O 개선 주장을 금지한다. 저장소 전역 lint baseline은 범위 밖이며 실제 변경 파일만 검사하고 관련 없는 파일을 포맷하지 않는다. 사용자가 실행한 1104 dev server와 `.next/dev` lock을 건드리지 않는다.

**Scale/Scope**: 작업물 1개 구조화 이전, 기존 인사이트 1개 사실·비중복·양방향 연결 회귀 검증, Archify source/HTML 1쌍, 기존 typed allowlist와 preview ratio 1항목 확장, 관련 단위·E2E 검증

## Constitution Check

*GATE: Phase 0 이전 통과. Phase 1 설계 후 재확인.*

| 원칙 | 준수 방법 | 판정 |
| --- | --- | --- |
| I. Evidence-First Portfolio Truth | 승인 인터뷰를 최우선 근거로 삼고 역할·기간·수치의 근거 종류와 관찰 한계를 분리한다. 철회한 버퍼링 성과와 비공개 정보는 금지문·품질 테스트로 차단한다 | PASS |
| II. Interview-Driven Progressive Completion | 인터뷰와 최종 공개 문안이 승인된 골프 작업물 1개와 연결 인사이트 1개만 다룬다. Feature 013 잔여 작업과 다른 작업물은 보존한다 | PASS |
| III. Shared Information Architecture, Optional Evidence | 기존 `FeatureDetailDto`와 공통 상세 renderer를 재사용하고 승인된 스윔레인 1개만 선택형 근거로 추가한다. 데모·ERD·빈 placeholder는 만들지 않는다 | PASS |
| IV. Accessible and Responsive Reading | 스윔레인에 동등한 텍스트 설명을 제공하고 정상·예외를 선 종류와 문구로 구분한다. 키보드, focus 복귀, 4개 viewport와 document overflow를 실제 화면에서 검증한다 | PASS |
| V. Test-First, Verifiable Delivery | 콘텐츠·등록·시각 계약을 먼저 RED로 고정하고 관련 Vitest, typecheck, scoped lint, build, Archify receipts, fresh production E2E 순으로 검증한다 | PASS |

**위반 없음.** Complexity Tracking은 필요하지 않다.

## Project Structure

### Documentation (this feature)

```text
specs/014-golf-reservation-structured-detail/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── public-content-contract.md
│   └── reservation-swimlane-contract.md
├── checklists/
│   └── requirements.md
├── tasks.md
└── verification.md
```

### Source Code (repository root)

```text
apps/front/
├── diagrams/the-siena-golf-reservation/
│   └── reservation-request-and-exception-flow.json
├── public/diagrams/the-siena-golf-reservation/
│   └── reservation-request-and-exception-flow.html
├── src/
│   ├── components/projects/
│   │   ├── ArchifySwimlaneEmbed.tsx
│   │   ├── archify-swimlane-embed.test.tsx
│   │   ├── project-detail-rendering.test.tsx
│   │   └── project-swimlane-layout.test.ts
│   └── data/portfolio/
│       ├── feature-details/
│       │   ├── index.ts
│       │   └── the-siena-golf-reservation.ts
│       ├── content-quality.test.ts
│       ├── feature-detail-quality.test.ts
│       ├── features.ts
│       └── types/feature-detail.dto.ts
└── e2e/
    ├── golf-reservation-structured-detail.spec.ts
    ├── portfolio-insight-contract.spec.ts
    └── swimlane-viewer.spec.ts
```

**Structure Decision**: 변경은 `apps/front`의 기존 정적 콘텐츠 계층과 공통 Archify 임베드에만 둔다. 골프 상세 데이터는 독립 모듈로 만들고 registry에서 slug에 연결한다. 시각 자료는 Archify source JSON을 검증·delivery해 생성한 정적 HTML을 typed allowlist와 기존 preview/dialog 컴포넌트로 표시한다. 기존 로그 분리 인사이트 데이터와 시각 자료는 다시 만들지 않고 승인 본문, 출처 연결, 비중복 계약만 검증한다.

### Interface Contracts

- [public-content-contract.md](./contracts/public-content-contract.md): 작업물·인사이트의 경로, 공개 사실, 근거 경계, 금지 주장과 양방향 연결 계약
- [reservation-swimlane-contract.md](./contracts/reservation-swimlane-contract.md): 예약 정상·예외 흐름, Archify parity, 텍스트 대안, 작은 보기·크게보기와 반응형 계약

## Post-Design Constitution Re-check

Phase 1 산출물을 기준으로 모든 원칙을 다시 통과했다.

| 원칙 | 설계 결과 확인 |
| --- | --- |
| I | data-model과 공개 콘텐츠 계약에 승인 사실, 근거 종류, 관찰 한계와 금지 주장을 명시했다 |
| II | 골프 작업물과 이미 연결된 로그 분리 인사이트만 대상으로 고정하고 다른 콘텐츠를 수정하지 않는다 |
| III | 기존 DTO·renderer·Archify 임베드를 재사용하며 스윔레인 1개 외의 선택형 근거를 만들지 않는다 |
| IV | source와 fallback 데이터의 동등성, 텍스트 대안, 선 범례, keyboard·responsive 검증을 계약화했다 |
| V | quickstart에 RED→GREEN, Archify 검증, production E2E와 수동 이미지 검토를 분리해 기록했다 |

설계 예외나 헌법 위반이 없으므로 Complexity Tracking은 생략한다.
