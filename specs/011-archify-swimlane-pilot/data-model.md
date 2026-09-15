# Data Model: Archify 스윔레인 파일럿

**Date**: 2026-09-09

## 1. FeatureSwimlaneArchifyLink

기존 `FeatureSwimlane`에 선택적으로 연결되는 standalone viewer metadata다.

```ts
interface FeatureSwimlaneArchifyLink {
  url: string;
  label: string;
}

interface FeatureSwimlane {
  // 기존 필드 유지
  archify?: FeatureSwimlaneArchifyLink;
}
```

### 필드와 검증

| 필드 | 필수 | 규칙 | 파일럿 값 |
| --- | --- | --- | --- |
| `url` | metadata가 있으면 필수 | `/diagrams/`로 시작하는 same-origin path, `.html` 확장자, query/hash/external origin 금지 | `/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html` |
| `label` | metadata가 있으면 필수 | trim 후 비어 있지 않은 사용자 표시 문자열 | `Archify로 보기` |

### 관계

- 하나의 `FeatureSwimlane`은 0개 또는 1개의 Archify link를 가진다.
- 파일럿에서는 `hotel-reservation-platform`의 `platform-change-verification-deployment`만 link를 가진다.
- link가 없는 스윔레인은 기존 DOM과 동작만 가진다.

### 상태

```text
metadata 없음
  → 기존 React preview/Dialog만 공개

유효 metadata + 검증된 HTML 존재
  → 기존 React preview/Dialog + Archify 새 탭 action 공개

metadata 오류 또는 HTML 없음
  → 품질 검사 실패, 공개 산출물로 승인하지 않음
```

## 2. CanonicalSwimlaneMeaning

Feature 010에 이미 존재하는 React 스윔레인의 승인 의미다. 새 저장 모델을 만들지 않고 parity 검사의 기준으로 사용한다.

### 식별자

- project slug: `hotel-reservation-platform`
- swimlane id: `platform-change-verification-deployment`
- node count: 10
- edge count: 12
- lane count: 4
- recovery exception count: 1

### 불변 의미

- 주 흐름: 변경 요청 → 차이 분류 → 배치 경계 → 플랫폼별 빌드 → 계약·동작 검증 → 호텔별 운영 폴더 배포
- 동등 분기:
  - 모든 플랫폼 공통 → `core`
  - 값만 다름 → `rsConfig`
  - 화면·로직 차이 → `platform`
- 복구 흐름: 패리티 누락 → 운영 브랜치 감사 → `core·platform` 수동 이식 → 계약·동작 재검증
- 새 시스템 구성요소, 자동화, 수치와 성과 없음

## 3. ArchifyWorkflowSource

`apps/front/diagrams/hotel-reservation-platform/platform-change-verification-deployment.json`에 저장하는 편집 가능한 의미 원본이다.

### 핵심 필드

| 필드 | 규칙 |
| --- | --- |
| `schema_version` | 새 workflow이므로 `2` |
| `meta.quality_profile` | `showcase` |
| authored language | node·edge·설명은 한국어, 코드 identifier는 원문 유지 |
| primary nodes | CanonicalSwimlaneMeaning의 10개 단계와 1:1 대응 |
| edges | CanonicalSwimlaneMeaning의 12개 관계와 방향·조건 의미 대응 |
| presentation bands | canonical 4개 lane의 ownership을 node에 보존하되 Archify에서는 `요구사항 / 코드 경계 / 검증·배포` 3개 band로 표시한다. `기준 코드`와 `플랫폼 확장`은 `코드 경계`에 합치며 core·rsConfig·platform 도착점은 node label로 구분한다 |
| component type | 이 흐름은 React 플랫폼 코드 배치·빌드·검증·배포 범위이므로 모든 node를 `frontend`로 사용한다. `backend`·`security`·`cloud` 등의 추가 구성 의미를 부여하지 않는다 |
| optional presentation | `visual_preset`, `subtitle`, `animation`, `engineering_profile`, Korean locale은 사용하지 않음 |
| geometry | 최초 candidate는 자동 route·label, validator diagnostic이 요구할 때만 한 번에 하나의 supported control 추가 |

### validation

- 모든 stable ID는 원본 안에서 고유하다.
- edge의 source와 target은 존재하는 node를 참조한다.
- 기존 10/12 수량과 주·분기·복구 의미가 누락되거나 추가되지 않는다.
- showcase artifact check 9개가 통과한다.
- composition error 0, warning 0이다.
- 고객 정보, 예약·결제 식별자, secret, private source/log와 내부 감사 수치가 없다.

### 상태 전이

```text
candidate 작성
  → validate 실패: diagnosed subject만 수정 후 재검증
  → validate 통과: source 동결
      → deliver 실패: 공개 HTML과 metadata를 새 결과로 승인하지 않음
      → deliver 통과: DeliveredArchifyArtifact 생성
```

동결 뒤 source 변경이 필요하면 기존 HTML을 직접 고치지 않고 candidate validation부터 다시 수행한다.

## 4. DeliveredArchifyArtifact

`apps/front/public/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html`에 제공하는 self-contained standalone viewer다.

### 속성

| 속성 | 규칙 |
| --- | --- |
| public URL | DTO metadata의 `url`과 정확히 일치 |
| source provenance | delivery receipt의 specification SHA-256과 byte count로 고정 |
| artifact identity | artifact SHA-256과 byte count 기록 |
| runtime dependency | Archify package·network generation·Next.js route handler 없음 |
| authored content | 한국어 node·edge·설명 유지 |
| fixed Viewer UI | 영어 fallback 한계 허용 |

### 불변 조건

- delivered HTML을 직접 편집하지 않는다.
- failed delivery 뒤 이전 last-good artifact를 새 결과로 검사하지 않는다.
- artifact가 없어도 기존 React preview와 Dialog는 독립적으로 동작한다.

## 5. ArchifyEvidenceRecord

Feature 011의 `verification.md`에 기록하는 검증 집합이다.

| 증거 | 증명 범위 | 완료 조건 |
| --- | --- | --- |
| parity test | React canonical meaning과 JSON 의미 대응 | node 10, edge 12, 방향·label·분기·복구 mismatch 0 |
| showcase validate | source 구조와 composition | artifact check 9/9, error 0, warning 0 |
| deliver receipt | frozen source와 HTML provenance | specification/artifact SHA-256·bytes 기록, exit 0 |
| visual-check | delivered HTML의 bounded browser behavior | 요구 viewport 성공, overflow 기준 통과 |
| Playwright | 실제 공개 URL, 새 탭·키보드·기존 UI 회귀 | 대상 action 1개, 다른 action 0개, HTTP 200, 기존 Dialog 통과 |
| image review | 지각적 완성도 | node 관통, label 잘림·겹침, 분기·복구 오독 finding 0 |

각 증거는 서로 대체하지 않는다. 자동 구조 검사가 이미지 검토를, 이미지 검토가 deterministic delivery receipt를 대신할 수 없다.
