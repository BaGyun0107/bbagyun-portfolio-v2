# Phase 1 Data Model: 한마음과학원 구조화 상세

**Date**: 2026-08-24

기존 `FeatureDetailDto` 계약을 그대로 사용한다. 타입 변경은 없다.
이 문서는 새로 채울 값의 구조와 검증기를 통과하기 위한 제약을 정의한다.

## 1. Feature 메타 변경 (`features.ts`)

| 필드 | 처리 |
| --- | --- |
| `description` | 갱신 — 검색 성능 중심으로 유지하되 근거 없는 단정 제거 |
| `overview` | 갱신 — 1인 백엔드 담당과 두 축(검색·적재)을 요약 |
| `content` | **제거** — 구조화 상세로 이전되므로 legacy 장문 삭제 |
| `techStack` | 유지 |
| `period`, `team`, `status`, `iconName`, `category` | 유지 |

`content` 제거 후 `getFeatureDetailBySlug('hanmaum-science-institute')`가
상세를 반환하므로 project route가 구조화 렌더러를 사용한다.

## 2. FeatureDetailDto 필드 계획

### role

1인 백엔드로서 담당한 범위를 서술한다. 인터뷰에서 "모두 혼자 맡아서
진행했다"로 확정되었으므로 낮추지 않는다.

### highlights (3개)

| id | label | value | kind | asOf | caveat |
| --- | --- | --- | --- | --- | --- |
| `search-response-time` | 검색 응답 시간 | `약 1500ms → 약 400ms` | `measured` | `2023-10` | 없음 |
| `source-volume` | 원문 규모 | `약 77만 자 / 최대 454페이지` | `reported` | `2023-10` | 없음 |
| `ingestion-duration` | 전체 적재 소요 | `5분 이내` | `reported` | `2023-10` | 계측 기록이 아닌 실행 당시 회고 기준 |

`evidence` 필수 요건:
- `search-response-time`: 브라우저 네트워크 응답 기준임을 명시(엔드투엔드).
  동일 검색어, 데이터 전량 적재 상태, 구/신 도메인 동시 비교, 반복 관측 조건 포함
- `ingestion-duration`: 계측 도구 기록이 없음을 `caveat`에 명시

검증기 제약: `kind === 'estimated'`인 항목에만 `caveat`가 필수다. `reported`도
근거가 불확실하면 `caveat`를 붙일 수 있다(적재 소요가 이 경우).

### problem

검색 성능·인덱스 제약·비정형 원문·적재 무결성을 하나의 문제 서술로 묶는다.

### constraints

- 외부 검색 인프라를 도입할 예산이 없었다
- 레거시 데이터베이스 버전이 낮아 한국어 토큰화 방식을 바꿀 수 없었다
- 원본 교재는 서식에 의존하는 비정형 문서였다
- 고객 원문과 실제 소스는 공개할 수 없다

### alternatives

외부 검색 엔진은 **비용 때문에 시도하지 못했다**로 서술한다(D-004, FR-011).
검토 후 기각이 아니다. 나머지는 당시 조건에서 가능했던 범위를 서술한다.

### swimlanes (2개)

아래 3절 참조.

### implementation

소제목 3개로 구성한다.

1. **하이브리드 검색** — 2단계 역할 분리, 최소 토큰 길이 정정(D-003)
2. **비정형 원문 파싱과 적재** — 서버 업로드 처리, 신규/갱신 단일 경로(D-004)
3. **검증 롤백** — 예외 롤백과 구분, 도입 경위와 대응 방식(D-005)

하네스와 동일하게 마지막에 "더 깊이 읽기"로 연결 인사이트를 링크한다.

### outcomes

검색 응답 개선과 측정 조건, 적재 무결성 확보를 서술한다. 근거 등급을 본문에서도
구분한다.

### retrospective

본문 문장을 되풀이하지 않는다. 기존 회고의 두 항목(검색 엔진 고도화, 보안 설계
성숙)은 현재 시점 판단이므로 유지 가능하되, 인터뷰에서 새로 확인된
"실패에서 진단 가능성을 얻는 장치를 만들었다"는 교훈을 추가한다.

## 3. 스윔레인 데이터 설계

### 3.1 파싱·적재 실패와 복구 (`ingestion-and-recovery`)

**lanes** (4): `admin`(관리자), `parsing`(파싱), `persistence`(적재),
`validation`(검증)

**steps** (7):

| id | laneId | row | shape | label |
| --- | --- | --- | --- | --- |
| `upload` | `admin` | 0 | `start` | 원문 업로드 |
| `convert` | `parsing` | 1 | `process` | 문서 변환 |
| `match` | `parsing` | 2 | `process` | 규칙 매칭 |
| `persist` | `persistence` | 3 | `process` | 트랜잭션 저장 |
| `verify` | `validation` | 4 | `decision` | 매칭 누락 검사 |
| `commit` | `persistence` | 5 | `end` | 커밋 완료 |
| `abort` | `validation` | 5 | `stop` | 적재 취소 |

주의: `commit`(row 5, `persistence`)과 `abort`(row 5, `validation`)는 lane이
다르므로 row 중복 규칙에 걸리지 않는다.

**edges** (6):

| id | from → to | kind | outcome | label |
| --- | --- | --- | --- | --- |
| `upload-convert` | `upload` → `convert` | normal | continue | — |
| `convert-match` | `convert` → `match` | normal | continue | — |
| `match-persist` | `match` → `persist` | normal | continue | — |
| `persist-verify` | `persist` → `verify` | normal | continue | — |
| `verify-commit` | `verify` → `commit` | normal | continue | `누락 없음` (decision 분기라 label 필수) |
| `verify-abort` | `verify` → `abort` | exception | stop | `누락 항목 있음` |
| `abort-upload` | `abort` → `upload` | exception | recover | `규칙 보완 후 재실행` |

주의: `verify-abort`는 `outcome: 'stop'`이므로 대상이 `stop` node여야 한다
(`abort`가 `stop`). `abort-upload`는 row가 감소하지만 exception edge이므로
"normal edge는 더 큰 row로 진행" 규칙에 걸리지 않는다.

**exceptions** (2):

| id | trigger | response | edgeIds |
| --- | --- | --- | --- |
| `unmatched-title` | 규칙과 어긋나 매칭되지 않은 항목이 남음 | 적재를 취소하고 남은 항목을 알려 원인 지점을 좁힌다 | `verify-abort` |
| `rule-refinement` | 원인 지점을 확인함 | 원본 문서가 아니라 파싱 규칙을 보완한 뒤 다시 실행한다 | `abort-upload` |

**summary**: 업로드에서 시작해 변환, 규칙 매칭, 트랜잭션 저장을 거쳐 매칭
누락을 검사하고, 누락이 없을 때만 커밋한다.

### 3.2 검색 요청 처리 (`search-request-flow`)

**lanes** (3): `reader`(이용자), `routing`(라우팅), `storage`(데이터)

**steps** (5):

| id | laneId | row | shape | label |
| --- | --- | --- | --- | --- |
| `query` | `reader` | 0 | `start` | 검색어 입력 |
| `route` | `routing` | 1 | `process` | 검색어 구성 분석 |
| `narrow` | `storage` | 2 | `process` | 후보군 압축 |
| `refine` | `storage` | 3 | `process` | 정밀 검증 |
| `respond` | `reader` | 4 | `end` | 결과 확인 |

**edges** (4): 모두 normal, continue. 순차 연결.

**exceptions**: 빈 배열. 검색 실패 경로는 코드로 확인하지 않았으므로 만들지
않는다(D-006).

**summary**: 검색어를 분석해 인덱스로 후보군을 좁힌 뒤, 좁혀진 범위에서만
정밀 검증을 수행해 결과를 반환한다.

**purpose**: 속도를 담당하는 단계와 정확도를 담당하는 단계가 어떻게 나뉘는지
보여준다.

## 4. 회귀 계약 재고정 대상

| 파일 | 현재 | 변경 후 |
| --- | --- | --- |
| `feature-detail-quality.test.ts` | `LEGACY_FEATURE_CONTENT_FIXTURES` 7개 | 6개 (한마음 제거) |
| `feature-detail-quality.test.ts` | "구조화 상세은 하네스 하나뿐" | 구조화 2개 목록과 legacy 6개 목록을 각각 고정 |
| `content-quality.test.ts` | 공통 섹션 검사에서 `getFeatureDetailBySlug` 있으면 skip | 변경 불필요 (자동 적용) |
| `e2e/codi-harness-portfolio-detail.spec.ts` | 레거시 본문 snippet 맵에 한마음 포함 | 한마음 제거, 구조화 경로 검증으로 이동 |

## 5. 검증 규칙 요약 (구현 시 반드시 만족)

- lane / step / edge / exception ID는 각 스윔레인 내에서 유일
- 같은 lane 안에서 row 중복 불가
- normal edge: `outcome: 'continue'`, 항상 더 큰 row로 진행, `stop` node 대상 불가
- exception edge: `outcome`이 `recover` 또는 `stop`, 조건 label 필수
- decision에서 나가는 모든 edge: 결과 label 필수
- `outcome: 'stop'`인 edge: 대상이 `stop` shape여야 함
- `start` node와 `end` node는 각각 **정확히 하나**여야 함
- `start`에서 normal edge만 따라 `end`에 도달 가능해야 함
- 모든 지표: `label`, `value`, `evidence` 비어 있으면 안 됨
- `kind: 'estimated'`: `caveat` 필수

설계 확인: 두 스윔레인 모두 start 1개, end 1개다. 파싱 흐름은
`upload → convert → match → persist → verify → commit`이 전부 normal edge로
이어져 도달성을 만족한다(`abort`는 `stop`이라 end가 아니다). 검색 흐름은
`query → route → narrow → refine → respond`가 순차 normal이다.
