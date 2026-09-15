# Implementation Plan: 블랙스톤 벨포레 리조트 구조화 상세 이전

**Branch**: `chore/cleanup-downstream-harness` | **Date**: 2026-08-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-blackstone-belleforet-resort/spec.md`

## Summary

`blackstone-belleforet-resort`를 기존 두 작업물과 같은 구조화 상세 계약으로
이전한다. 동시에 2026-08-24 인터뷰와 2026-08-25 후속 정정에서 확인한 사실
오류를 바로잡고, 결제 안정화 지표 두 개에 근거 등급과 한계를 부착한다.
PMS 응답·장애 수치는 카드에서 제외하고 timeout 설계 교훈의 맥락으로만
사용한다. 스윔레인은 사용자가 확정한 결제·보상취소 흐름 하나만 제공한다.

기존 회귀 계약은 assertion을 삭제하거나 개수 검사로 완화하지 않는다. 구조화
상세 3개, legacy 본문 5개, 전체 경로 8개의 정확한 목록으로 원자적으로 다시
고정하고, 직접 연결된 API Key 인사이트도 같은 사실 전제를 유지하는지 검증한다.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.3 / Next.js 16.1.6 (App Router)

**Primary Dependencies**: 기존 `FeatureDetailDto` 계약과
`apps/front/src/components/projects/`의 구조화 상세 렌더러를 그대로 재사용한다.
신규 런타임 의존성은 추가하지 않는다.

**Storage**: 정적 TypeScript 데이터 모듈 (`apps/front/src/data/portfolio/`)

**Testing**: Vitest 4.1.11 (데이터·콘텐츠·렌더링 계약), Playwright 1.62.1 (E2E)

**Target Platform**: 웹, 320/768/1024/1440px 뷰포트 지원

**Project Type**: 모노레포의 프론트엔드 앱 (`apps/front`), pnpm

**Performance Goals**: 신규 route 없이 프로덕션 빌드의 static page 38개를 유지한다

**Constraints**: 앱 로컬 패키지 매니저와 Node.js 24 선언을 보존한다. 확인할 수
없는 총 결제 건수·누적 건수·비율을 만들지 않는다. 저장소 전역 lint의 기존
기준선은 이번 범위에서 수정하지 않고 변경 파일만 검사한다. 포트 1104의 기존
개발 서버와 `.next/dev` 잠금을 재사용하지 않고 별도 포트의 프로덕션 서버로
E2E를 수행한 뒤 임시 설정을 삭제한다.

**Scale/Scope**: 작업물 8개 중 1개 이전. 구조화 상세 2개 → 3개, legacy 본문
6개 → 5개. 신규 상세 데이터 1개, registry·메타·연결 인사이트와 테스트·E2E
계약 갱신이 범위다.

## Constitution Check

*GATE: Phase 0 이전 통과 필요. Phase 1 이후 재확인.*

| 원칙 | 준수 방법 | 판정 |
| --- | --- | --- |
| I. Evidence-First Portfolio Truth | 지표 두 개에 `kind`·`asOf`·`evidence`를 부착한다. 컴플레인 10건 미만은 `reported`와 하한 caveat, 운영 관찰 기간은 현재 진행 중인 회고 범위로 한정한다. PMS 응답·장애 카드는 제거하고, 직접 확인되지 않은 fallback 구현도 공개하지 않는다. 총 결제 건수·누적·비율은 만들지 않는다 | PASS |
| II. Interview-Driven Progressive Completion | 2026-08-24 인터뷰 완료 후 착수했다. 다른 legacy 5개 작업물은 이번 범위에서 수정하지 않는다 | PASS |
| III. Shared Information Architecture, Optional Evidence | 기존 10섹션 렌더러와 데이터 계약을 재사용한다. 검증된 데모가 없어 생략하고, 사용자 결정에 따라 결제·보상취소 스윔레인 1개만 제공한다 | PASS |
| IV. Accessible and Responsive Reading | 기존 스윔레인 접근성 계약을 재사용하고 텍스트 요약, 키보드 접근, 상태를 색상 외 방식으로 구분하며 문서 전체 가로 넘침을 막는다 | PASS |
| V. Test-First, Verifiable Delivery | 콘텐츠·데이터·E2E 계약을 구현 전에 작성해 RED를 확인한 뒤 GREEN으로 전환한다. 검증 체인은 타입 → 단위·계약 → 변경 범위 lint → build → fresh E2E → 공백 검사 순서다 | PASS |

**위반 없음.** Complexity Tracking 섹션은 필요하지 않다.

## Project Structure

### Documentation (this feature)

```text
specs/006-blackstone-belleforet-resort/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/
│   └── requirements.md
├── tasks.md             # speckit-tasks가 생성
└── verification.md      # 구현·리뷰·검증 증거
```

### Source Code (repository root)

```text
apps/front/src/data/portfolio/
├── features.ts
├── insights.ts
├── content-quality.test.ts
├── feature-detail-quality.test.ts
└── feature-details/
    ├── blackstone-belleforet-resort.ts
    └── index.ts

apps/front/src/components/projects/
└── 기존 구조화 상세·지표·스윔레인 렌더러 재사용 (변경 없음)

apps/front/e2e/
└── codi-harness-portfolio-detail.spec.ts
```

**Structure Decision**: 신규 컴포넌트와 route를 만들지 않는다. 이미 검증된
`ProjectDetailContent`, `ProjectHighlights`, `ProjectSwimlane` 계열 렌더러는
`FeatureDetailDto` 데이터만 추가하면 블랙스톤에도 같은 읽기 순서와 접근성 계약을
적용한다. 이번 기능은 정적 데이터 추가, legacy 본문 제거, 사실·회귀 계약 갱신에
한정한다.

### Contracts

별도 `contracts/` 디렉터리를 만들지 않는다. 외부 API나 새 공개 인터페이스를
추가하지 않으며, 기존 `FeatureDetailDto`와 런타임 검증기
`validateFeatureDetail`이 이번 기능의 계약을 이미 강제한다. 새로 채울 값과
스윔레인 제약은 [data-model.md](./data-model.md)에 기록한다.

## Post-Design Constitution Re-check

Phase 1 설계 후 재확인한 결과 위반 없음.

| 원칙 | 설계 결과 확인 |
| --- | --- |
| I | 지표 2개의 등급·근거·caveat를 분리했고(D-002), 사실 정정과 연결 인사이트 정합성을 결정했다(D-003, D-004). PMS 수치 카드와 확인되지 않은 fallback 구현, 총 결제 건수·비율·미복원 수치 금지를 고정했다 |
| II | 인터뷰 완료 상태를 확인했고, 회귀 fixture에서 빠지는 블랙스톤 외 legacy 5개는 내용 변경 대상에서 제외했다 |
| III | 기존 계약·렌더러 재사용(D-001), 데모 생략(D-007), 스윔레인 1개(D-005)를 확정했다 |
| IV | 스윔레인의 정상 경로·예외 설명·텍스트 요약과 4개 뷰포트 검증을 data-model과 quickstart에 명시했다 |
| V | 문장 단위 사실 계약과 목록 계약을 RED 먼저 작성하고, fresh 프로덕션 E2E까지 수행하는 순서를 quickstart에 고정했다 |

설계가 헌법을 우회하거나 예외를 요구하는 지점이 없으므로 Complexity Tracking
섹션은 생략한다.
