# Phase 1 Data Model: 블랙스톤 벨포레 리조트 구조화 상세

**Date**: 2026-08-24

기존 `FeatureDetailDto` 계약을 그대로 사용한다. 타입과 렌더러 변경은 없다.
이 문서는 새로 채울 값, 연결 인사이트의 정합성 경계, 회귀 계약, 스윔레인
검증 제약을 정의한다.

## 1. Feature 메타 변경 (`features.ts`)

| 필드 | 처리 |
| --- | --- |
| `description` | 갱신 — 신규 구축, 결제 장애 대응, API Key 발견을 사실 순서대로 요약하고 "운영 중" 전제를 제거 |
| `overview` | 갱신 — 1인 백엔드 주도와 PHP·React 결합, 결제 안정화, 프록시 대응을 요약 |
| `content` | **제거** — 구조화 상세로 이전되므로 legacy 장문 삭제 |
| `techStack` | 유지 |
| `period`, `team`, `status`, `iconName`, `category` | 유지 |

`content` 제거 후 `getFeatureDetailBySlug('blackstone-belleforet-resort')`가
상세를 반환하므로 project route는 공통 구조화 렌더러를 사용한다.

## 2. FeatureDetailDto 필드 계획

### role

모든 설계를 혼자 했고, 1인 백엔드 겸 프론트엔드 개발자로서 PHP·React 공존
구조, 인증, 결제·예약 연동, 보상취소, API Key 프록시를 설계·구현하고 프로젝트
전반을 주도한 사실을 유지한다. 인터뷰에서 실제와 일치하므로 표현을 낮추지 않는다.

### highlights (2개)

| id | label | value | kind | asOf | caveat |
| --- | --- | --- | --- | --- | --- |
| `reported-complaint-mismatches` | 컴플레인 접수 불일치 | `10건 미만` | `reported` | `2026-08` | 시스템 집계가 아니며 실제 불일치의 하한 |
| `operating-observation-period` | 운영 관찰 기간 | `2024년 오픈 ~ 현재 진행 중` | `reported` | `현재 진행 중` | 유지보수 과정에서 같은 유형 문제가 없었다는 회고 범위 |

`evidence` 필수 요건:

- `reported-complaint-mismatches`: 고객 컴플레인 접수 기준, 시스템 집계 아님,
  실제 불일치의 하한을 모두 포함한다.
- `operating-observation-period`: 2024년 오픈 이후 현재까지 유지보수 중이며
  같은 유형 문제가 없었다는 인터뷰 범위를 밝힌다.

약 20초의 PMS 응답 지연과 약 1시간의 장애 지속 시간은 결과 카드에서 제외한다.
약 20초는 정상 평균 응답 속도가 아니라 당시 해당 API에 문제가 있어 지연된
상태였으므로 timeout 교훈의 맥락에서만 설명한다.

금지 사항:

- 총 결제 건수와 누적 결제 건수 추가
- 총 결제 건수를 분모로 한 비율 또는 퍼센트 주장
- 평일·주말 대략적 결제량으로 누적값 계산
- 두 지표 외 인터뷰로 복원되지 않은 수치 추가

### problem

세 문제를 하나의 배경으로 연결한다.

1. 기존 그누보드 자산을 유지하면서 PHP와 React가 같은 origin에서 공존해야 했다.
2. 결제는 PHP, 예약·티켓 생성은 별도 단계에 흩어져 중간 실패 시 결제와 실제
   예약 상태가 어긋날 수 있었다.
3. React 환경변수가 빌드 산출물에 포함된다는 점을 몰라 외부 API Key가
   클라이언트에서 보일 수 있는 구조를 프로젝트 중간에 발견했다.

신규 구축이므로 운영 중 서비스의 무중단 전환을 문제나 제약으로 쓰지 않는다.

### constraints

- 기존 그누보드 자산과 PHP 결제 흐름을 활용해야 했다.
- 서브도메인 분리는 CORS, 쿠키 공유, 기존 SEO·링크 유지 부담이 있었다.
- 외부 PMS·결제 시스템의 응답과 장애를 내부 트랜잭션으로 묶을 수 없었다.
- WebView 자동로그인 토큰 유실 원인은 앱 개발자에게 전달받은 내용이라 직접
  확인한 사실처럼 단정할 수 없다.

### alternatives

실제로 확인된 판단만 남긴다.

- 서브도메인 분리는 실제로 검토했고 CORS, 쿠키 공유 복잡도, 기존 SEO·링크
  단절 가능성 때문에 같은 origin의 경로 분기를 택했다.
- 기존 자산과 일정 안에서 PHP와 React를 결합했다. 운영 중 서비스의 무중단
  전환 때문에 PHP 전면 교체를 기각했다고 쓰지 않는다.
- Node.js에서는 ORM 트랜잭션으로 결제 상태 변경을 묶어 왔지만 PHP 결제 흐름에
  같은 방법을 그대로 적용하기 어려워, 실패 시 역방향으로 되돌리는 보상 방식을
  택했다.
- API Key 대응은 대안 비교가 아니라 실수 발견 후 수정이다. 환경변수 난독화
  비교표를 만들지 않는다.

### swimlanes (1개)

3절의 `payment-and-compensation`만 제공한다. 라우팅·인증 흐름은 만들지 않는다.

### implementation

소제목 3개로 구성한다.

1. **기존 자산 위의 PHP·React 공존과 인증** — 신규 구축 전제, Nginx 경로
   분기, JWT 검증 미들웨어, WebView 원인 caveat와 브릿지 구현
2. **결제·예약 보상 흐름과 timeout 교훈** — PHP에서 ORM 트랜잭션을 그대로
   쓰기 어려웠던 배경, 자동 보상취소, 외부 PMS 장애 로그, 12초 임의 설정,
   당시 API 문제로 발생한 약 20초 지연, 장애 대응의 60초 판단, 이후 API 수정
3. **API Key 오해 발견과 서버 프록시** — 빌드 산출물 포함 사실을 몰랐던 실수,
   프로젝트 중간 발견, PHP 프록시와 서버 환경변수 이관

마지막에 "더 깊이 읽기"로
`spa-api-key-exposure-and-bff-architecture`를 연결한다.

### outcomes

- 고객 컴플레인으로 접수된 불일치 10건 미만이라는 범위와 하한 caveat
- 2024년 오픈부터 현재까지 유지보수 중 같은 유형 문제를 파악하지 못했다는
  관찰 범위
- 자동 보상취소·로그·timeout 정책 보강
- API Key를 서버 프록시 뒤로 이동한 결과

무중단 전환, 시스템 전수 집계, 비율, 확인할 수 없는 누적 결제량을 성과로
쓰지 않는다.

### retrospective

본문 문장을 되풀이하지 않고 다음 교훈을 남긴다.

- 근거 없이 임의 설정한 timeout은 정상 처리 중인 요청도 실패로 오판할 수
  있으므로 정상 응답 범위, 장애 상태, 실패 비용을 구분해 정해야 한다.
- 30초 사용자 경험과 60초 결제 안전성 중 실패 비용이 큰 쪽을 기준으로 선택했다.
- SPA의 시크릿 경계를 잘못 이해했던 사실을 숨기지 않고, 클라이언트 산출물은
  공개된다는 원칙으로 다음 설계를 바꿨다.
- 약 20초는 당시 API 문제로 지연된 값이고 현재는 API가 수정됐다는 시점을
  구분해, 과거 장애 값을 현재 성능처럼 일반화하지 않는다.

### demo

설정하지 않는다.

## 3. 스윔레인 데이터 설계

### 3.1 결제·보상취소 (`payment-and-compensation`)

**lanes** (4): `guest`(이용자), `php-service`(PHP 서버),
`payment-provider`(결제사), `pms`(PMS·티켓)

**steps** (9):

| id | laneId | row | shape | label |
| --- | --- | --- | --- | --- |
| `submit-payment` | `guest` | 0 | `start` | 결제 요청 |
| `approve-payment` | `payment-provider` | 1 | `process` | 결제 승인 |
| `persist-payment` | `php-service` | 2 | `process` | 결제 정보 처리 |
| `create-reservation` | `pms` | 3 | `process` | 예약·티켓 생성 |
| `evaluate-result` | `php-service` | 4 | `decision` | 생성 결과 판단 |
| `complete-service` | `guest` | 5 | `end` | 예약 완료 |
| `auto-compensation` | `payment-provider` | 5 | `stop` | 자동 보상취소 |
| `pms-outage-observation` | `php-service` | 5 | `stop` | 장애 구간 확인 |
| `timeout-mismatch` | `pms` | 5 | `stop` | 조기 실패 오판 |

row 5의 네 node는 lane이 모두 달라 lane 내 row 중복 규칙을 위반하지 않는다.
stop node 셋은 장애 대응의 종료 지점이고 정상 end는 `complete-service` 하나다.

**normal edges** (5):

| id | from → to | outcome | label |
| --- | --- | --- | --- |
| `submit-approve` | `submit-payment` → `approve-payment` | continue | — |
| `approve-persist` | `approve-payment` → `persist-payment` | continue | — |
| `persist-create` | `persist-payment` → `create-reservation` | continue | — |
| `create-evaluate` | `create-reservation` → `evaluate-result` | continue | — |
| `evaluate-complete` | `evaluate-result` → `complete-service` | continue | `예약·티켓 생성 확인` |

**exception edges** (3):

| id | from → to | outcome | label |
| --- | --- | --- | --- |
| `evaluate-compensate` | `evaluate-result` → `auto-compensation` | stop | `응답 미도달·생성 실패·PHP 예외` |
| `evaluate-outage` | `evaluate-result` → `pms-outage-observation` | stop | `외부 PMS 장애` |
| `evaluate-timeout` | `evaluate-result` → `timeout-mismatch` | stop | `12초 timeout 조기 실패 오판` |

decision에서 나가는 네 edge는 모두 결과 label을 가진다. exception edge의
대상은 모두 stop shape이므로 `outcome: 'stop'` 제약을 만족한다.

**exceptions** (3):

| id | trigger | response | edgeIds |
| --- | --- | --- | --- |
| `response-or-generation-failure` | 결제 응답이 프론트에 도달하지 않거나 예약·티켓 생성 실패·무응답·PHP 예외가 발생 | 서버가 결제 보상취소를 수행하고 결과를 남긴다 | `evaluate-compensate` |
| `pms-outage-observation` | 외부 PMS 장애가 발생 | 로그의 최초 발생 시각과 종료 시각을 대조해 장애 구간을 확인한다 | `evaluate-outage` |
| `premature-timeout` | 임의의 12초 timeout이 정상 처리 중인 요청을 실패로 오판 | 당시 API 문제로 약 20초까지 지연된 상태를 확인하고 30초 UX와 결제 안전성을 비교해 장애 대응값 60초를 선택한다. 이후 API가 수정되어 현재는 과거처럼 오래 걸리지 않는다 | `evaluate-timeout` |

**summary**: 결제 승인 뒤 예약·티켓 생성 결과를 확인해 성공 시 예약을 완료하고,
응답 미도달·외부 장애·timeout 오판 시 각각 자동 보상취소, 장애 구간 로그 확인,
timeout 정책 보강으로 대응했다.

**purpose**: 같은 "결제 후 예약 미생성" 현상 아래 서로 다른 세 원인과 대응이
어떻게 갈리는지 보여준다.

## 4. 연결 인사이트 정합성

대상: `spa-api-key-exposure-and-bff-architecture`

| 항목 | 유지/변경 |
| --- | --- |
| SPA 특성을 몰라 브라우저에서 API Key 노출을 발견 | 유지 — 인터뷰와 일치 |
| PHP 프록시와 서버 환경변수로 이동 | 유지 — 인터뷰와 일치 |
| BFF로 확장하고 싶은 현재 시점 회고 | 유지 — 실제 구현과 구분되어 있음 |
| "핫픽스" 표현 | 변경 — 운영 중 수정으로 읽히지 않도록 프로젝트 중간 발견 후 즉시 수정으로 명시 |
| 무중단 전환·환경변수 난독화 대안 | 추가 금지 |

## 5. 회귀 계약 재고정 대상

| 파일 | 현재 | 변경 후 |
| --- | --- | --- |
| `feature-detail-quality.test.ts` | `LEGACY_FEATURE_CONTENT_FIXTURES` 6개 | 5개 (블랙스톤 제거, 나머지 보존) |
| `feature-detail-quality.test.ts` | 구조화 상세 목록 2개 | 정확한 3개 목록으로 고정 |
| `content-quality.test.ts` | 블랙스톤 구조화·지표·정정 계약 없음 | 지표 2개, PMS 카드·금지 수치·정정 사실·인사이트 정합성 계약 추가 |
| `e2e/codi-harness-portfolio-detail.spec.ts` | `legacyBodyBySlug`에 블랙스톤 포함 | 블랙스톤 제거 |
| `e2e/codi-harness-portfolio-detail.spec.ts` | `structuredSlugs` 2개 | 블랙스톤을 추가해 3개, 전체 8개 길이 유지 |

## 6. 검증 규칙 요약

- 상세의 `role`, `problem`, `constraints`, `alternatives`, `implementation`,
  `outcomes`, `retrospective`는 비어 있지 않아야 한다.
- 지표 2개의 ID 목록을 정확히 고정하고 각 `label`, `value`, `kind`, `asOf`,
  `evidence`를 검증한다.
- 근거가 제한된 `reported` 지표에는 caveat를 명시하고, `estimated` 지표를
  새로 만들지 않는다.
- 결제 총량, 누적 건수, 퍼센트 주장은 0건이어야 한다.
- 정정 6종은 단어 하나가 아니라 실제 순서를 담은 문장 단위 assertion으로 고정한다.
- 연결 인사이트에도 운영 중 무중단·초기부터 알고 선택한 API Key 대안 서술이
  없어야 한다.
- 스윔레인은 정확히 1개이고 lane 4·step 9·edge 8·exception 3 구조를 가진다.
- start/end는 각 1개이며 정상 경로는
  `submit-payment → approve-payment → persist-payment → create-reservation →
  evaluate-result → complete-service`로 이어진다.
- decision의 모든 분기에 label이 있고 exception edge 세 개는 stop node를 대상으로 한다.
- 공개 상세·스윔레인·회고에 `resvId`·`tid`·결제 fallback 주장이 없어야 한다.
- 전체 8개 작업물 경로, 구조화 3개 목록, legacy 5개 본문을 정확히 고정한다.
- `demo`는 존재하지 않아야 한다.
