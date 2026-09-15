# Contract: Portfolio Project Detail

## Purpose

이 계약은 작업물 목록 데이터와 선택형 구조화 상세 데이터가 하나의 공개 상세
페이지에서 어떻게 결합되는지 정의한다. 외부 HTTP API 계약이 아니라 빌드 타임 데이터
접근자와 공개 UI의 동작 계약이다.

## Data Access Contract

### `getFeatureBySlug(slug)`

- 기존 8개 작업물의 `FeatureDto | null`을 반환한다.
- `overview`는 상세 데이터 존재 여부와 관계없이 공개 페이지 상단에 표시된다.
- category/status 변환에 강제 캐스팅을 사용하지 않는다.

### `getFeatureDetailBySlug(slug)`

- 반환: `FeatureDetailDto | null`
- 하네스 slug에는 검증된 구조화 상세를 반환한다.
- 아직 인터뷰하지 않은 7개 slug에는 `null`을 반환한다.
- 알려지지 않은 slug에는 `null`을 반환한다.
- 레지스트리 초기화 시 모든 구조화 상세의 지표·스윔레인 무결성을 검증한다.

### `validateFeatureDetail(detail)`

- 유효하면 오류 목록이 비어 있다.
- 중복 ID, 누락 lane/step 참조, 빈 대체 설명, 잘못된 실패 outcome,
  근거가 부족한 지표와 검증되지 않은 데모를 식별 가능한 오류로 반환한다.
- 입력 데이터를 자동 보정하거나 잘못된 항목을 조용히 삭제하지 않는다.

## Rendering Contract

### Shared summary

모든 유효한 작업물 상세 경로는 제목, 기간, 팀, 상태, 설명과 `overview`를 장문
본문보다 먼저 표시한다.

### Structured state

`getFeatureDetailBySlug(slug)`가 상세를 반환하면 다음 순서를 사용한다.

1. 프로젝트 개요
2. 나의 역할과 책임 범위
3. 핵심 결과 요약
4. 문제 상황과 제약 조건
5. 대안 검토와 선택
6. 시스템 흐름
7. 핵심 설계와 구현
8. 결과와 검증 근거
9. 회고와 다음 개선
10. 관련 인사이트

선택 데이터가 없으면 해당 블록을 완전히 생략한다. 빈 카드, 비활성 CTA와 준비 중
문구를 만들지 않는다.

### Legacy state

구조화 상세가 없으면 `FeatureDto.content`를 기존 Markdown 렌더러로 표시한다.
다른 작업물의 상세를 대신 사용하거나 기존 본문을 변경하지 않는다.

### Unknown state

작업물 slug가 없으면 기존과 같이 `notFound()`로 처리한다.

## Demo Contract

| 입력 | 공개 결과 |
|---|---|
| `demo` 없음 | CTA 없음 |
| `status: unavailable` | CTA 및 준비 중 UI 없음 |
| `status: available` + 검증된 `https` URL | 목적·새 탭 안내가 있는 CTA 표시 |
| 잘못된 URL 또는 필수 필드 누락 | 데이터 검증 실패 |

하네스는 첫 번째 상태다.

공개 작업물에는 아직 데모가 없으므로 `available` 상태는 렌더링 fixture로 검증한다.
CTA의 접근 가능한 이름은 새 창 동작을 알리고 `target="_blank"`와
`rel="noopener noreferrer"`를 함께 사용한다.

## Swimlane Contract

- 하네스는 `설계·개발·검증`과 `CI/CD·시크릿·배포` 두 스윔레인을 표시한다.
- 각 스윔레인은 제목, 목적, lane, steps, normal/failure/recovery 흐름과 순서형
  대체 설명을 제공한다.
- 색상 외에 선 스타일, 아이콘 또는 텍스트 label로 흐름 종류를 구분한다.
- 정적 step은 키보드 tab stop이 아니다.
- 넓은 시각 영역은 자체 컨테이너만 `overflow-x`를 사용한다.
- 320/768/1024/1440px에서 `document.documentElement.scrollWidth`가 viewport보다
  커지지 않는다.

## Insight Contract

- 본문의 핵심 구현 영역에서 네 신규 인사이트 slug로 직접 이동할 수 있다.
- 공개 링크는 실제 `InsightDto`와 대응해야 한다.
- 신규 4개와 기존 관련 4개는 모두 같은 featureSlug로 관련성을 유지한다.
- 현재 도구 목록에는 GSD/GStack이 없고, 두 도구는 발전 기록에만 등장한다.
- Jenkins 비용·배포 시간·환경변수 결과가 작업물과 인사이트 사이에서 충돌하지 않는다.

## Compatibility Contract

- `generateStaticParams()`는 계속 8개 작업물 경로를 생성한다.
- 하네스 외 7개 경로와 본문은 유지된다.
- 구조화 상세가 없는 작업물에서도 빈 스윔레인/데모 영역은 나타나지 않는다.
- 후속 작업물은 새 페이지 없이 레지스트리 항목만 추가해 같은 계약을 사용한다.

## Automated Proof Contract

- 구성 요소 테스트는 10개 공통 섹션의 heading 순서를 검사한다.
- 구성 요소 테스트는 `available` demo fixture의 접근 가능한 새 창 안내와 안전한
  link 속성을 검사한다.
- E2E는 하네스에 demo CTA가 없고 외부 근거 링크에는 새 창 안내가 있음을 검사한다.
