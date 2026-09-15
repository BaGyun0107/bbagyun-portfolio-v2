# Implementation Plan: 한마음과학원 법문검색 구조화 상세 이전

**Branch**: `chore/cleanup-downstream-harness` | **Date**: 2026-08-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-hanmaum-search-detail/spec.md`

## Summary

`hanmaum-science-institute`를 하네스와 동일한 구조화 상세 계약으로 이전한다.
동시에 2026-08-24 인터뷰와 사용자 제공 코드에서 확인한 사실 오류 3건을 정정하고,
검색 성능 지표에 측정 근거를 부착한다. 스윔레인은 2개를 제공한다.

기존 회귀 계약("구조화 상세는 하네스 하나뿐", legacy 본문 fixture)은 삭제가
아니라 새 상태의 정확한 목록으로 원자적으로 재고정한다.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19 / Next.js 16 (App Router)

**Primary Dependencies**: 기존 `FeatureDetailDto` 계약과 `apps/front/src/components/projects/`
렌더러를 그대로 재사용한다. 신규 런타임 의존성은 추가하지 않는다.

**Storage**: 정적 TypeScript 데이터 모듈 (`apps/front/src/data/portfolio/`)

**Testing**: Vitest (데이터 계약·렌더링), Playwright (E2E)

**Target Platform**: 웹, 320/768/1024/1440px 뷰포트 지원

**Project Type**: 모노레포 내 프론트엔드 앱 (`apps/front`), pnpm

**Performance Goals**: 프로덕션 빌드 static page 수 유지(현재 38), 신규 route 추가 없음

**Constraints**: 앱 로컬 패키지 매니저·런타임 선언 보존. 저장소 전역 lint 기준선의
기존 불일치는 이번 범위에서 수정하지 않는다(변경 범위 검증과 분리 기록).

**Scale/Scope**: 작업물 8개 중 1개 이전. 구조화 상세 1개 → 2개.
데이터 모듈 3개 + 테스트 3개 + E2E 1개 수정 예상.

## Constitution Check

*GATE: Phase 0 이전 통과 필요. Phase 1 이후 재확인.*

| 원칙 | 준수 방법 | 판정 |
| --- | --- | --- |
| I. Evidence-First Portfolio Truth | 모든 지표에 근거 종류·기준 시점·근거 설명 부착. 검색 응답은 `measured`(브라우저 네트워크, 동일 검색어, 전량 적재, 반복 관측), 적재 소요는 `reported`(회고 기반). 복원되지 않은 단락 레코드 수는 생략. 사실 오류 3건 정정. 고객 데이터·소스 비공개 유지 | PASS |
| II. Interview-Driven Progressive Completion | 2026-08-24 인터뷰 완료 후 착수. 인터뷰 기록은 `docs/portfolio-interviews/2026-08-24-hanmaum-science-institute.md`. 다른 6개 작업물 본문은 이번 범위에서 변경하지 않음 | PASS |
| III. Shared Information Architecture, Optional Evidence | 하네스와 동일한 10섹션 읽기 순서와 동일 렌더러 재사용. 검증된 데모 URL이 없으므로 데모 요소를 만들지 않음. 스윔레인은 선택 증거로 제공 | PASS |
| IV. Accessible and Responsive Reading | 스윔레인은 기존 `ProjectSwimlaneDiagram` 계약을 따라 전체 흐름 텍스트 설명, 키보드 탐색, 명암 대비, region 내부 가로 스크롤을 유지 | PASS |
| V. Test-First, Verifiable Delivery | 데이터 계약·렌더링·E2E 테스트를 구현 전에 작성(RED 확인 후 GREEN). 검증 체인은 typecheck → unit → 변경 범위 lint → build → fresh E2E | PASS |

**위반 없음.** Complexity Tracking 섹션 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/005-hanmaum-search-detail/
├── plan.md              # 이 파일
├── spec.md              # 명세
├── research.md          # Phase 0 산출물
├── data-model.md        # Phase 1 산출물
├── quickstart.md        # Phase 1 산출물
├── checklists/
│   └── requirements.md  # 명세 품질 체크리스트
└── tasks.md             # Phase 2 산출물 (speckit-tasks가 생성)
```

### Source Code (repository root)

```text
apps/front/src/
├── data/portfolio/
│   ├── features.ts                          # 한마음 legacy content 제거, 메타 갱신
│   ├── feature-details/
│   │   ├── hanmaum-science-institute.ts     # 신규 구조화 상세
│   │   └── index.ts                         # registry 등록
│   ├── content-quality.test.ts              # 계약 테스트 갱신
│   └── feature-detail-quality.test.ts       # 목록·fixture 재고정
└── components/projects/                     # 변경 없음 (기존 렌더러 재사용)

apps/front/e2e/
└── hanmaum-search-detail.spec.ts            # 신규 E2E (또는 기존 spec 확장)
```

**Structure Decision**: 신규 컴포넌트를 만들지 않는다. 하네스가 이미 검증한
`ProjectDetailContent` / `ProjectSwimlane` / `ProjectHighlights` 렌더러가
`FeatureDetailDto`만 받으면 동작하므로, 이번 작업은 데이터 추가와 회귀 계약
갱신에 한정된다. 이것이 형식 통일이라는 목표와도 일치한다.

### Contracts

별도 `contracts/` 디렉터리를 만들지 않는다. 이 기능이 노출하는 인터페이스는
이미 `apps/front/src/data/portfolio/types/feature-detail.dto.ts`에 타입으로
존재하고, 런타임 검증기(`validateFeatureDetail`)가 그 계약을 강제한다.
새 계약을 정의하는 것이 아니라 기존 계약을 한 번 더 구현하는 작업이므로
문서로 중복 기술하지 않는다. 지켜야 할 검증 규칙은
[data-model.md](./data-model.md) 5절에 정리했다.

## Post-Design Constitution Re-check

Phase 1 설계 후 재확인한 결과 위반 없음.

| 원칙 | 설계 결과 확인 |
| --- | --- |
| I | 지표 3개 모두 근거 등급 부여(D-002). 사실 오류 3건 정정 결정(D-003 토큰 길이, D-004 파싱 위치, D-004b 외부 엔진 배제 사유). 미복원 값 생략 확정(D-008 데모 포함) |
| II | 인터뷰 선행 완료. 다른 6개 작업물 데이터는 설계 대상에서 제외 |
| III | 기존 렌더러 재사용 확정(D-001). `demo` 미설정 확정(D-008). 스윔레인은 선택 증거로 유지 |
| IV | 스윔레인 데이터가 기존 접근성 계약을 그대로 통과하도록 검증 규칙을 data-model 5절에 명시 |
| V | 회귀 계약 재고정 대상을 data-model 4절에 특정. 검증 체인을 quickstart에 순서 고정 |

설계가 원칙을 우회하거나 예외를 요구하는 지점이 없으므로 Complexity Tracking
섹션은 생략한다.
