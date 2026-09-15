# Data Model: 호텔 예약 플랫폼 구조화 상세와 인사이트 시각 자료

**Date**: 2026-09-09

## 1. Feature 메타데이터

| 필드 | 목표 값/규칙 |
| --- | --- |
| `slug` | `hotel-reservation-platform` 불변 |
| `description` | 호텔별 조건 분기가 누적된 단일 코드베이스를 설정 중심 구조와 `core/platform` 경계로 발전시킨 프로젝트로 요약 |
| `overview` | 1차 설정 구조, 2026년 리빌딩, 사용자의 설계·주요 구현 책임과 5개 운영 적용을 과장 없이 요약 |
| `period` | `2024.11 – 2025.10 / 2026.06 – 2026.08`처럼 1차 구축과 리빌딩 시기를 함께 표시 |
| `team` | `FE 2명 (본인 포함) / BE 1명` |
| `status` | `Production` 유지. 5개 플랫폼이 현재 운영 유지 중 |
| `content` | 제거. 구조화 상세와 중복 렌더링 금지 |

## 2. FeatureDetailDto 인스턴스

### 역할

- 1차 구축: FE 2명(사용자 포함), BE 1명 협업
- 사용자: Config 중심 플랫폼 구조, 예약 상태 구조와 NICEPAY 모바일 복귀 흐름의 설계·주요 구현 주도
- 2026년: `core/platform` 경계와 통합 방식을 설계하고 주요 마이그레이션 수행
- 다른 FE·BE의 담당 구현을 사용자 단독 개발로 표현하지 않음

### 공개 지표

| id | label | value | kind | asOf | 근거와 제한 |
| --- | --- | --- | --- | --- | --- |
| `production-platforms` | 운영 적용 플랫폼 | `5개` | reported | `2026-08` | 사용자 인터뷰에서 새 구조의 전체 운영 적용을 확인. 코드의 5개 platform 디렉터리는 구조만 보조 확인하며 운영 상태를 대신 증명하지 않음 |
| `canonical-source` | 기준 소스 | `1개` | measured | `2026-08` | 읽기 전용 저장소에서 하나의 core와 5개 platform 확장 구조를 직접 확인. 실행·배포 단위 통합을 의미하지 않음 |
| `parity-detection` | 패리티 누락 발견 | `운영 배포 전` | reported | `2026-08` | 개발·통합 검증 중 발견했다는 승인 인터뷰. 운영 장애나 누락 0건 성과로 확대하지 않음 |

세 값으로 개발시간·배포시간·오류 감소율·신규 호텔 온보딩 속도를 계산하거나 추정하지 않는다.

### 서술 필드

| 필드 | 포함할 핵심 | 공개 한계 |
| --- | --- | --- |
| `problem` | 단일 코드의 호텔별 조건 분기, 1차 개선 뒤 5개 배포 브랜치의 반복 수정·편차, 깊은 예약 단계의 Props Drilling, 모바일 결제 복귀 시 메모리 상태 유실 | 프로젝트별 복제, Provider Hell, 가격·재고 불일치를 직접 문제로 쓰지 않음 |
| `constraints` | 공통 사용자 흐름, 호텔별 정책·UI·연동 차이, 기존 플랫폼별 빌드·배포 유지, 운영 기준선 보존 | 런타임 테넌트 전환이나 무배포 구성을 목표로 쓰지 않음 |
| `alternatives` | 1차는 조건 분기를 설정으로 옮기는 방향, Context에서는 Redux 비교, NICEPAY에서는 브라우저 임시 저장과 복귀 조회 | 모노레포·npm package·Zustand·React Query·SSR을 당시 대안/확정 계획으로 쓰지 않음 |
| `implementation` | 서버 설정과 초기 로딩, `core/rsConfig/platform`, build-time platform 선택, Context route boundary, `sessionStorage` 1시간 만료와 예약번호 조회 | 단일 runtime tenant, 접근 제어, 가격·재고 재검증·자동 취소로 확대 금지 |
| `outcomes` | 5개 운영 적용, 공통 변경의 기준 코드 1회 수정, 호텔별 변경 격리, 최신 브랜치 비교 제거 | 단일 배포·무수정 신규 호텔·측정 개선율 금지 |
| `retrospective` | 최신 운영 기준선 선고정, 전체 위임 영역 세분화, contract와 행동 검증 병행 | 마이그레이션 누락을 운영 장애로 쓰지 않음 |

## 3. 플랫폼 변경·검증·배포 스윔레인

lane은 `요구사항`, `기준 코드`, `플랫폼 확장`, `검증·배포` 네 개다.

```text
변경 요청
  → 차이 분류
      ├─ 모든 플랫폼 공통 → core
      ├─ 값만 다름 → rsConfig
      └─ 화면·로직 차이 → platform 구현
  → 대상 플랫폼별 build
  → alias·계약·주요 동작 검증
      ├─ 통과 → 호텔별 운영 폴더 배포
      └─ 패리티 누락 → 운영 브랜치 감사 → core/platform 수동 이식 → 다시 검증
```

- 정상 경로는 변경 요청에서 운영 폴더 배포까지 이어진다.
- 세 분류는 모두 실제 선택이며 우열이 아니라 차이의 성격에 따른 배치다.
- 패리티 누락은 운영 배포 전 발견한 복구 경로다.
- 플랫폼별 build와 호텔별 운영 폴더 배포를 하나의 build·배포로 합쳐 표현하지 않는다.

## 4. Insight visual 일반화 계약

기존 `InsightVisual = InsightDataFlowVisual | InsightBeforeAfterVisual` 구조와 두 variant는 유지한다.

### Data-flow 변형

```ts
interface InsightDataFlowEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  outcome: 'normal' | 'success' | 'failure' | 'retry';
}
```

- 공통 검증: 필수 텍스트, 고유 ID, 모든 참조 node 존재
- 개별 visual이 필요한 outcome만 사용 가능
- Feature 010 코드 경계 visual은 `normal` edge만 사용
- 기존 하이패스 정산 visual의 success·failure·retry 존재 조건은 콘텐츠 회귀 테스트에서 유지

### Before/After 변형

```ts
type InsightArchitectureActorRole =
  | 'server'
  | 'room'
  | 'recipient'
  | 'unrelated'
  | 'source'
  | 'relay'
  | 'boundary'
  | 'consumer';

type InsightArchitectureConnectionScope =
  | 'intended'
  | 'overbroad'
  | 'indirect'
  | 'direct';
```

- 정확히 before/after 두 패널
- 필수 텍스트, 패널 내부 고유 ID, 모든 관계 참조 actor 존재, 패널별 관계 최소 1개
- Feature 010 Before는 `source → relay → consumer`의 `indirect`, After는 `boundary → consumer`의 `direct` 관계 사용
- 기존 Socket.io visual의 before `overbroad`, after `intended` 조건은 콘텐츠 회귀 테스트에서 유지

## 5. 코드 경계 인사이트

| 필드 | 목표 |
| --- | --- |
| slug | `config-driven-architecture-react` 불변 |
| title | `Config 이후의 경계: 멀티플랫폼 React를 core·rsConfig·platform으로 나눈 이유` |
| type/source | `project-case` / `hotel-reservation-platform` |
| visual assessment | `provided`, `data-flow` |
| 질문 | 공통 동작, 값 차이, 화면·로직 차이를 각각 어디에 배치할 것인가? |

visual node는 `변경 요구`, `차이 분류`, `core`, `rsConfig`, `platform`으로 구성한다. edge label은 `모든 플랫폼 공통`, `값만 다름`, `화면·로직 차이`를 문자로 표시한다.

본문은 질문, 설정만으로 남은 문제, 세 배치 기준, build-time 확장 방식, 적용·회피 조건, 전체 구현 위임의 검증 한계 순으로 구성한다. 작업물 전체 연혁·역할·Context·NICEPAY를 반복하지 않는다.

## 6. 예약 Context 인사이트

| 필드 | 목표 |
| --- | --- |
| slug | `context-api-encapsulation-and-router-level-isolation` 불변 |
| title | `Props Drilling을 줄이기 위해 예약 Context의 생명주기를 라우터에 둔 이유` |
| type/source | `project-case` / `hotel-reservation-platform` |
| visual assessment | `provided`, `architecture` + `before-after` variant |
| 질문 | 예약 단계가 공유하는 상태의 소유 범위와 전달 경로를 어디에 둘 것인가? |

Before panel은 상위 상태 소유자, 중간 컴포넌트, 예약 단계 화면을 `indirect` 관계로 연결한다. After panel은 예약 라우터의 `ReservationProvider`와 하위 단계의 `useReservation` 직접 소비를 `direct` 관계로 연결한다.

본문은 Props Drilling, Redux 비교, route-scoped Provider 선택, props 전달 감소와 생명주기 경계, 적용·회피 조건, 접근 통제·성능 자동 보장 아님 순으로 구성한다.

## 7. 렌더링 상태와 연결

```text
visual 없음 → 기존 제목·excerpt·Markdown·sidebar만 표시
visual 있음 → excerpt 다음, Markdown 본문 이전에 제목·질문·diagram·text alternative 표시
```

- data-flow의 세 분류와 before/after의 간접·직접 관계는 색뿐 아니라 label과 구조로 구분한다.
- 320px에서는 node와 panel 관계를 문서 폭 안에서 세로로 읽는다.
- 768px 이상에서는 관계를 가로로 읽되 document 전체 가로 스크롤을 만들지 않는다.
- node/actor/relationship label은 서로 겹치거나 잘리지 않는다.

```text
/projects/hotel-reservation-platform
  ├─ /insights/config-driven-architecture-react
  └─ /insights/context-api-encapsulation-and-router-level-isolation

각 insight 연관 기록 → /projects/hotel-reservation-platform
```

제목 변경은 링크의 보이는 이름과 이전·다음 탐색에 반영하되 slug는 바꾸지 않는다.
