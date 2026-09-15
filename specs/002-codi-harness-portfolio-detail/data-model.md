# Data Model: Codi Harness 포트폴리오 상세 개선

## 1. Feature

기존 목록·라우팅 메타데이터다.

| 필드 | 타입 | 규칙 |
|---|---|---|
| `slug` | `string` | 8개 작업물에서 고유하며 공개 경로 키다. |
| `category` | `FeatureCategory` | `Backend \| Frontend \| DevOps \| Fullstack`만 허용한다. |
| `status` | `FeatureStatus` | `Production \| Beta \| Archived \| In Progress`만 허용한다. |
| `overview` | `string` | 상세 페이지 상단에 항상 표시한다. |
| `content` | `string?` | 아직 구조화되지 않은 작업물의 레거시 본문이다. |

`SeedFeature`가 위 union을 직접 사용하며 DTO 변환에서 강제 캐스팅하지 않는다.

## 2. FeatureDetailDto

인터뷰를 마친 한 작업물의 구조화 상세다.

| 필드 | 타입 | 필수 | 규칙 |
|---|---|---|---|
| `role` | `string` | 예 | 작성자의 책임 경계를 설명한다. |
| `highlights` | `FeatureMetric[]` | 예 | 하네스는 최소 5개이며 모두 근거 메타데이터를 가진다. |
| `problem` | `string` | 예 | 문제 상황을 설명한다. |
| `constraints` | `string` | 예 | 공개·운영·사실성 제약을 설명한다. |
| `alternatives` | `string` | 예 | 검토한 대안과 선택 이유를 설명한다. |
| `swimlanes` | `FeatureSwimlane[]?` | 아니오 | 존재할 때만 렌더링하며 하네스에는 정확히 2개다. |
| `implementation` | `string` | 예 | 핵심 설계와 네 개 상세 인사이트 링크를 포함한다. |
| `outcomes` | `string` | 예 | 결과와 검증 근거를 분리해 설명한다. |
| `retrospective` | `string` | 예 | 한계와 다음 개선을 설명한다. |
| `demo` | `FeatureDemo?` | 아니오 | 검증된 공개 데모가 있을 때만 존재한다. 하네스에는 없다. |

### Relationship

- `Feature.slug 1 — 0..1 FeatureDetailDto`
- 상세 레지스트리는 존재하는 `Feature.slug`만 키로 허용한다.
- 상세가 없으면 같은 `Feature`의 `content`를 fallback으로 사용한다.

## 3. FeatureMetric

| 필드 | 타입 | 규칙 |
|---|---|---|
| `id` | `string` | 한 상세 안에서 고유하다. |
| `label` | `string` | 지표 의미를 설명한다. |
| `value` | `string` | 공개 표시값이다. |
| `kind` | `measured \| reported \| estimated` | 근거 종류를 구분한다. |
| `asOf` | `string` | 기준 시점을 명시한다. |
| `evidence` | `string` | 인터뷰·실행 화면·공개 가격 등 근거를 설명한다. |
| `caveat` | `string?` | 추정값에는 필수이며 포함하지 않는 범위를 설명한다. |

### Validation

- 모든 문자열은 trim 후 비어 있지 않아야 한다.
- `estimated`는 `caveat`가 반드시 존재한다.
- 하네스 비용은 `$151.84`, `2026-08-20`, 서울 `t3.large` 2대·730시간이라는
  기준과 컴퓨팅 외 비용 제외를 함께 가진다.

## 4. FeatureDemo

| 필드 | 타입 | 규칙 |
|---|---|---|
| `url` | `string` | 검증된 `https` 공개 주소다. |
| `label` | `string` | 링크 목적을 설명한다. |
| `kind` | `production \| portfolio` | 운영 서비스와 포트폴리오 데모를 구분한다. |
| `note` | `string?` | 로그인 등 접근 안내다. |
| `status` | `available \| unavailable` | CTA는 `available`일 때만 렌더링한다. |

하네스에는 `demo` 필드를 생성하지 않는다. `unavailable` 상태도 CTA나 준비 중 UI를
만들지 않는다. `available` 상태의 UI 계약은 테스트 fixture로 검증해 첫 데모 작업물
이전 전에도 공통 템플릿이 사용할 수 있게 한다.

## 5. FeatureSwimlane

| 필드 | 타입 | 규칙 |
|---|---|---|
| `id` | `string` | 한 상세 안에서 고유하다. |
| `title` | `string` | 흐름의 공개 제목이다. |
| `purpose` | `string` | 흐름이 증명하는 내용을 설명한다. |
| `lanes` | `SwimlaneLane[]` | 한 스윔레인에서 ID가 고유하다. |
| `steps` | `SwimlaneStep[]` | ID가 고유하고 존재하는 lane을 참조한다. |
| `edges` | `SwimlaneEdge[]` | ID가 고유하고 존재하는 step 쌍을 참조한다. |
| `alternativeText` | `string` | 비어 있지 않은 전체 흐름 요약이다. |

### SwimlaneLane

- `id`: stable machine key
- `label`: 공개 책임 주체

### SwimlaneStep

- `id`: 한 스윔레인에서 고유
- `laneId`: 존재하는 lane 참조
- `label`: 짧은 단계명
- `description`: 판단·행동·결과 설명

### SwimlaneEdge

- `id`: 한 스윔레인에서 고유
- `from`, `to`: 존재하는 서로 다른 step 참조
- `kind`: `normal | failure | recovery`
- `outcome`: `continue | recover | stop`
- `label?`: 분기 이유 또는 결과

### Cross-field Validation

1. lane, step, edge ID는 각 컬렉션에서 중복될 수 없다.
2. 모든 `step.laneId`는 존재하는 lane을 참조한다.
3. 모든 edge의 `from`과 `to`는 존재하는 step을 참조한다.
4. `failure` edge는 `recover` 또는 `stop` outcome을 가져야 한다.
5. `recovery` edge는 복구 대상을 설명하는 label을 가져야 한다.
6. 각 스윔레인은 최소 한 개의 정상 흐름과 실패 후 복구 또는 중단 흐름을 가진다.
7. 시각 표현과 순서형 대체 목록은 같은 steps/edges를 사용한다.

## 6. Insight

기존 `InsightDto`를 유지한다. 하네스 신규 인사이트 4개는 모두
`featureSlug: 'codi-harness-dx-platform'`을 가지며 다음 slug를 사용한다.

1. `harness-lock-and-project-ownership-boundary`
2. `harness-cli-and-doctor-productization`
3. `claude-codex-policy-parity-and-regression-testing`
4. `multi-session-testbed-and-context-lifecycle`

하네스 `implementation` 본문은 네 slug의 공개 링크를 직접 포함하고, related insight
조회도 동일한 `featureSlug` 관계를 사용한다.

## State Transitions

### 작업물 상세 이전

```text
legacy content only
  → 인터뷰 및 공개 범위 승인
  → structured detail 등록 + legacy content 보존
  → structured detail 렌더링 검증
  → 전체 작업물 이전 후 별도 기능에서 legacy content 제거 검토
```

이번 기능에서는 하네스만 세 번째 상태까지 이동한다. 다른 7개 작업물은 첫 상태에
머문다.

### 데모 노출

```text
demo 없음 또는 unavailable → CTA 없음
demo available + 검증된 https URL → 외부 CTA 표시
```
