# Data Model: Codi Harness 콘텐츠 보강 및 인사이트 통합

## 1. 하네스 기본 작업물 (`SeedFeature`)

기존 `REAL_FEATURES` 배열의 `codi-harness-dx-platform` 항목이다.

| Field | Rule |
| --- | --- |
| `slug` | `codi-harness-dx-platform` 유지 |
| `title` | `사내 DX 하네스 v2 구축` 유지 |
| `description` | 도구 나열보다 사내 개발 운영 플랫폼의 가치를 한 문장으로 설명 |
| `overview` | Jenkins 교체에서 개발 운영 기준 통합으로 문제가 확장된 과정 설명; 결과 지표 반복 금지 |
| `content` | 하네스 항목에서는 부재해야 함; 구조화 상세가 본문 정본 |
| `techStack`, `status`, `period`, `team` | 기존 값 유지 |

`SeedFeature.content` 자체는 optional로 유지한다. 하네스 외 7개 레거시 작업물이 이 필드로 본문을 제공하기 때문이다.

## 2. 하네스 구조화 상세 (`FeatureDetail`)

`feature-details/codi-harness-dx-platform.ts`가 소유한다.

| Field | Required content |
| --- | --- |
| `role` | 아키텍처·소유권, 초기화·진단·AI 규칙, CI/CD·시크릿·운영 검증의 세 책임 |
| `problem` | 반복 초기화/배포, 사람·AI 규칙 편차, 호텔 환경·대상 혼입 위험 |
| `constraints` | 비공개 자료, Claude/Codex 집행 차이, project-owned 보존 |
| `alternatives` | Jenkins 유지, workflow 복사, 공통 하네스 비교와 선택 기준 |
| `implementation` | 승인된 대표 설계 네 heading과 대표 insight 링크 하나 |
| `outcomes` | 배포·시크릿·적용 범위·Jenkins 제거 결과를 해당 설계와 연결 |
| `retrospective` | 안전한 변경 전파와 guardrail 판단, 멀티 세션은 후속 실험으로 구분 |
| `highlights` | 기존 여섯 지표를 값·근거 종류·출처까지 변경 없이 보존 |
| `swimlanes` | 기존 두 연결형 흐름을 데이터와 순서까지 변경 없이 보존 |
| `demo` | 부재 유지 |

대표 설계 heading 순서:

1. `./harness와 doctor`
2. `harness.lock과 소유권 경계`
3. `공통 정책과 런타임 어댑터`
4. `변경 범위 기반 배포와 Infisical 경계`

## 3. 대표 인사이트 (`PortfolioInsight`)

기존 `INSIGHTS` 배열의 `codi-harness-dx-platform-design` 항목을 확장한다.

| Field | Rule |
| --- | --- |
| `slug` | `codi-harness-dx-platform-design` 유지 |
| `title` | `DX 하네스 v2: 복사형 도구에서 사내 개발 운영 플랫폼까지` |
| `readTime` | `9 min` |
| `featureSlug` | `codi-harness-dx-platform` |
| `content` | 승인된 8개 구간의 유일한 현재 본문 |
| `legacyContent` | 타입과 데이터에서 제거 |

본문 구간 순서:

1. Jenkins 제거가 출발점이었다
2. v1: 복사는 설치를 쉽게 했지만 업데이트를 어렵게 했다
3. harness.lock: 재사용성을 안전한 변경 전파로 다시 정의하다
4. ./harness와 doctor: 체크리스트를 내부 제품으로 만들다
5. AI 작업 규칙: 문서를 복사하는 것에서 행동을 검증하는 것으로
6. 멀티 세션: 규칙 통일에서 실행 환경 격리로 확장하다
7. 결과: 하네스가 관리하는 것은 파일이 아니라 반복 가능한 작업 방식이다
8. 회고

본문에는 `운영 중인 핵심 구조`, `실제 적용 결과`, `운영 확장 실험`의 세 성숙도 표지가 모두 존재해야 한다.

## 4. 제거 인사이트

아래 객체는 `INSIGHTS` registry에서 완전히 제거되며 별도 상태를 갖지 않는다.

- `harness-lock-and-project-ownership-boundary`
- `harness-cli-and-doctor-productization`
- `claude-codex-policy-parity-and-regression-testing`
- `multi-session-testbed-and-context-lifecycle`

상태 전이는 `published → absent`다. 목록·navigation·연관 글·정적 params에서 사라지고 직접 조회는 `notFound()`로 404가 된다. redirect 상태는 존재하지 않는다.

## 5. 보존 집합

- 독립 인프라 insight: Jenkins, Infisical, Cloudflare 관련 3개 slug와 본문 유지
- 작업물: 전체 8개 공개 route 유지
- 레거시 작업물: 하네스 외 7개 `content` 유지
- 하네스 evidence: 여섯 highlight, 두 swimlane, demo 부재 유지
