# Implementation Plan: 포트폴리오 콘텐츠 작성 규칙과 인사이트 계약

**Branch**: `chore/cleanup-downstream-harness` | **Date**: 2026-08-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-portfolio-content-authoring/spec.md`

## Summary

작업물·공부 기록·인사이트를 하나의 사실 계약으로 관리하는 프로젝트 전용 작성
체계를 만든다. 짧은 always-on rule은 적용 시점과 불변 조건만 선언하고,
project-local skill은 근거 확인, 인사이트 유형·출처·의미 계약·시각 자료 필요성,
연결 콘텐츠 교차 검증 절차를 담당한다.

프론트엔드는 점진 이전이 가능한 선택적 editorial metadata와 검증기를 도입한다.
초기에는 구조화가 끝난 작업물 3개에 연결된 프로젝트 사례형 6개와 기존 공부 기록에
연결된 기술 탐구형 1개를 적용했다. 이어 2026-08-26 사용자 승인 The Siena 로그 분리
후속을 프로젝트 사례형으로 편입해, 현재는 프로젝트 사례형 7개와 기술 탐구형 1개,
총 8개를 적용한다. 나머지 10개의 공개 본문과 경로는 보존한다.
작성 skill은 6개 실패 시나리오를 기준/적용 쌍으로 검증하고, 공개 화면은 유형과
출처를 표시하며 기존 양방향 탐색을 회귀 테스트로 고정한다.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19 / Next.js 16 (App Router), Markdown

**Primary Dependencies**: 기존 정적 portfolio data layer, React Server Components,
Tailwind CSS 4, repo-local harness rule/skill link mechanism. 신규 런타임 의존성은
추가하지 않는다.

**Storage**: 정적 TypeScript 데이터 모듈과 committed Markdown/JSON 파일. DB 없음.

**Testing**: Vitest 4 (데이터·렌더링 계약), Playwright 1.62 (공개 흐름 E2E),
skill baseline/with-skill paired evaluations

**Target Platform**: 웹, 320/768/1024/1440px 뷰포트; Claude Code와 Codex
두 agent runtime

**Project Type**: split-front-back 프로필의 모노레포 중 프론트엔드와 프로젝트
로컬 harness context만 변경

**Performance Goals**: 신규 route와 런타임 네트워크 요청 없이 현재 정적 페이지
생성 방식을 유지한다. 목록·상세에 추가하는 metadata 표현은 서버 렌더링만 사용한다.

**Constraints**: Size: Large. 프로젝트 전용 skill은 `.harness/skills-local/`만
사용한다. AI-read rule/skill prose는 영어로 작성한다. 현재 적용 범위 밖의 아직
인터뷰하지 않은 작업물과 연결 글 10개의 본문은 보존한다. The Siena 로그 분리 글은
승인된 후속으로 현재 적용 범위에 포함한다. 저장소 전역 lint baseline은 범위 밖이며 변경 파일만
검사한다. 포트 1104의 기존 dev 서버 잠금을 피하려 E2E는 프로덕션 빌드를 별도
포트로 실행하고 임시 설정은 삭제한다.

**Scale/Scope**: 공개 작업물 8개, 공부 기록 1개, 인사이트 18개 중 정확히 8개를
현재 적용. 프로젝트 사례형 7개와 기술 탐구형 1개이며, The Siena 로그 분리 후속을
포함한다. always-on rule 1개, project-local skill 1개와 reference/eval 파일,
frontend editorial contract·validator·목록/상세 표시·계약/E2E 테스트를 변경한다.

## Constitution Check

*GATE: Phase 0 이전 통과 필요. Phase 1 이후 재확인.*

| 원칙 | 준수 방법 | 판정 |
| --- | --- | --- |
| I. Evidence-First Portfolio Truth | 인터뷰와 완료된 feature 기록을 프로젝트 사실의 우선 근거로 사용한다. 기술 탐구형의 변경 가능한 외부 가격은 공식 Vercel 문서와 기준 시점을 사용하고 추정과 실제 비용을 분리한다. 연결 글의 역할·수치·원인·결과 충돌을 테스트한다 | PASS |
| II. Interview-Driven Progressive Completion | 인터뷰가 완료된 하네스·The Siena·한마음·블랙스톤 연결 글 7개를 프로젝트 사례형으로 점검한다. 기술 탐구형 1개는 기존 공부 기록과 공식 자료 범위에서만 점검하며, 나머지 10개 본문은 보존한다. The Siena는 2026-08-26의 승인 후속이다 | PASS |
| III. Shared Information Architecture, Optional Evidence | 같은 Markdown 제목은 강제하지 않고 의미 계약만 검증한다. editorial metadata는 선택 필드로 도입해 점진 이전을 허용한다. 시각 자료는 필요성 판정만 의무이며 새 다이어그램을 일괄 생성하지 않는다 | PASS |
| IV. Accessible and Responsive Reading | 유형·출처는 텍스트로 표시한다. 시각 자료를 후속 제공할 때 텍스트 대체 설명을 계약으로 강제한다. 목록·상세의 좁은 화면 overflow와 키보드 링크를 E2E로 확인한다 | PASS |
| V. Test-First, Verifiable Delivery | skill 작성 전 6개 baseline을 수집하고, frontend 계약과 UI는 RED 확인 후 최소 구현으로 GREEN 전환한다. typecheck·변경 범위 lint·build·fresh production E2E를 기록한다 | PASS |

**위반 없음.** Complexity Tracking 섹션은 필요하지 않다.

## Project Structure

### Documentation (this feature)

```text
specs/007-portfolio-content-authoring/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── portfolio-insight-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.harness/
├── rules-local/
│   └── portfolio-editorial-standard.md
└── skills-local/
    └── portfolio-content-authoring/
        ├── SKILL.md
        ├── evals/
        │   └── evals.json
        └── references/
            ├── evidence-and-linking.md
            ├── insight-contract.md
            ├── project-detail-contract.md
            └── visual-evidence.md

apps/front/
├── src/app/(public)/insights/
│   ├── page.tsx
│   └── [slug]/page.tsx
├── src/data/portfolio/
│   ├── insight-editorial.ts
│   ├── insight-editorial-quality.test.ts
│   ├── content-quality.test.ts
│   ├── index.ts
│   ├── insights.ts
│   ├── studies.ts
│   └── types/insight.dto.ts
└── e2e/
    └── portfolio-insight-contract.spec.ts
```

**Structure Decision**: 콘텐츠 판단 규칙과 실행 절차를 분리한다. always-on rule은
skill을 호출해야 하는 조건과 핵심 불변 조건만 담아 context 비용을 제한한다.
상세 예시와 점검 절차는 project-owned skill reference로 이동한다. 프론트엔드에는
별도 저장소나 CMS를 추가하지 않고 기존 정적 data layer에 점진형 계약을 확장한다.
UI는 현재 페이지에서 작은 유형·출처 표시만 추가하고 공용 UI 컴포넌트는 수정하지
않는다.

## Phase Deliverables

- Phase 0: [research.md](./research.md) — 규칙/skill 경계, 점진 metadata,
  첫 적용 집합, 시각 자료 판정, 외부 근거 처리 결정
- Phase 1: [data-model.md](./data-model.md) — union 계약, validator 상태 전이,
  첫 적용 fixture와 보존 경계
- Phase 1: [contracts/portfolio-insight-contract.md](./contracts/portfolio-insight-contract.md)
  — authoring 및 public rendering 계약
- Phase 1: [quickstart.md](./quickstart.md) — TDD·skill eval·frontend 검증 실행 순서
- Phase 2: `tasks.md` — 사용자 검토 게이트 전 마지막 자동 생성 산출물

## Post-Design Constitution Re-check

Phase 1 설계 후에도 위반은 없다.

| 원칙 | 설계 결과 확인 |
| --- | --- |
| I | `InsightEditorialMetadata`가 출처·독립 사유·시각 판정 이유를 구조화하고 validator가 상호 배타성과 참조 무결성을 검사한다. 변경 가능한 Vercel 가격은 2026-08 공식 문서 기준으로만 다룬다 |
| II | `MIGRATED_INSIGHT_SLUGS`는 정확히 8개(프로젝트 사례형 7개, 기술 탐구형 1개)로 고정하고 나머지 10개에는 metadata를 요구하지 않는다. The Siena 로그 분리 글은 승인된 후속으로 포함한다 |
| III | seed metadata는 선택 필드이되 존재하면 완전해야 하고, legacy DTO는 `editorial: null`로 단일화한다. `visualAssessment.decision = not-needed`를 정상 상태로 허용한다 |
| IV | 공개 UI는 텍스트 badge와 유효한 링크를 사용한다. `provided` 시각 증거에는 text alternative가 필수다 |
| V | quickstart가 skill baseline → skill 작성/재평가, frontend RED → GREEN, fresh E2E 순서를 고정한다 |

설계 예외가 없으므로 Complexity Tracking은 생략한다.
