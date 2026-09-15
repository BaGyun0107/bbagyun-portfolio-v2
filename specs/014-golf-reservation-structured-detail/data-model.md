# Data Model: 골프 예약 시스템 구조화 상세

**Date**: 2026-09-11

## 1. Feature 메타데이터

| 필드 | 목표 값/규칙 |
| --- | --- |
| `slug` | `the-siena-golf-reservation` 불변 |
| `description` | 첫 프로젝트에서 외부 PMS 예약 연동과 요청 방어를 구현하고 운영 중 로그 저장 경계를 개선한 사례로 요약 |
| `overview` | 정해진 구조 안의 FE/BE 구현 책임과 유지보수 중 직접 판단한 `syslog` 분리를 구분 |
| `period` | 카드 `2023.05 – 현재`; 본문은 최초 구축 `2023.05 – 2023.06`과 오픈 이후 현재 유지보수를 분리 |
| `team` | 승인 인터뷰에 없는 인원·직책을 새로 만들지 않고 현재 확인된 표현만 사용 |
| `content` | 구조화 이전 후 제거 |
| `detail` | `FEATURE_DETAILS_BY_SLUG`에서 새 `FeatureDetailDto`에 연결 |

## 2. 구조화 상세

### 역할

- 입사 후 첫 프로젝트
- 정해진 구조 안에서 예약 화면, PHP 요청 처리, 외부 PMS 연동, 중복 방어, 통신 로그 기록을 FE/BE 범위 모두 단독으로 구현
- 전체 아키텍처나 최초 구조를 단독 설계했다는 표현 금지
- 운영 유지보수 중 업무 DB→`syslog` 저장 경계 개선은 방향 결정과 구현을 직접 수행

### Highlights

| id | label | value | kind | asOf | evidence/caveat |
| --- | --- | --- | --- | --- | --- |
| `initial-build` | 최초 구축 | `2023.05 – 2023.06` | `reported` | `2023.06` | 사용자 인터뷰로 확인한 구현 기간; 현재까지 계속 구축했다는 뜻이 아님 |
| `maintenance-period` | 운영 유지보수 | `2023년 오픈 – 현재` | `reported` | `2026-09` | 유지보수 계약과 직접 유지보수 상태; 향후 영구 지속 보장 아님 |
| `api-log-volume` | 장애 조사 당시 로그 | `수백만 건` | `measured` | `운영 유지보수 과정` | DB GUI에서 직접 확인한 누적 규모; 정확한 전수 건수는 복원하지 않음 |

`kind`는 `FeatureMetricKind`의 기존 `measured | reported | estimated`만 사용한다. 모든 카드에는 `evidence`가 있고 필요한 카드에는 `caveat`가 있다.

### 본문 경계

| section | 포함 내용 |
| --- | --- |
| `problem` | 외부 PMS 중심 예약을 웹 화면과 내부 PHP 요청 경계로 연결; 업무 DB에 통신 로그 누적 후 장애 조사 불가 |
| `constraints` | 예약 원본·결과는 외부 PMS가 소유; 당사 서비스는 전달·안내; 외부 장애와 내부 transaction으로 묶을 수 없는 경계; 비공개 데이터 미공개 |
| `alternatives` | 당시 확인된 선택만 설명: 화면 즉시 잠금, PHP 세션 2초 필터, PMS timeout·오류 안내, 업무 DB→`syslog`; 검토하지 않은 기술 비교 금지 |
| `implementation` | React→PHP→PMS 요청, 정상·예외 처리, 통신 로그 저장 경계 분리, 연결 인사이트 요약 링크 |
| `outcomes` | 유지보수 범위에서 중복 호출 이력·관련 CS 미확인, 5xx/timeout 안내 동작, 당사 로그로 요청·응답 확인; 비율·개선율 금지 |
| `retrospective` | syslog 분리 유지, 인증값·개인정보 마스킹, 추적 필드 최소화, 보존 기간 관리 |

## 3. 예약 처리 스윔레인

```ts
interface FeatureSwimlane {
  id: 'reservation-request-and-exception-flow';
  title: '예약 요청·중복 방어·외부 장애 안내 흐름';
  lanes: FeatureSwimlaneLane[];
  steps: FeatureSwimlaneStep[];
  edges: FeatureSwimlaneEdge[];
  exceptions: FeatureSwimlaneException[];
  archify: {
    url: '/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html';
  };
}
```

### Lanes

| id | label | 책임 |
| --- | --- | --- |
| `user` | 예약 사용자 | 요청 시작, 결과·안내 확인 |
| `react` | React | 버튼 잠금·스피너, 서버 응답에 따른 표시 |
| `php-server` | PHP 서버 | 세션 기반 동일 요청 검사, PMS 호출, 응답 분기 |
| `external-pms` | 외부 PMS | 예약 원본 처리와 결과 반환 |

### Steps

| id | lane | shape | 의미 |
| --- | --- | --- | --- |
| `request-reservation` | user | start | 예약 요청 |
| `lock-submit` | react | process | 버튼 비활성화·스피너 표시 |
| `check-session-request` | php-server | decision | 동일 세션·동일 요청 2초 검사 |
| `block-duplicate` | php-server | stop | 외부 호출 전 재요청 차단 |
| `call-pms` | php-server | process | 30초 timeout으로 외부 PMS 요청 |
| `process-reservation` | external-pms | decision | PMS 예약 처리·응답 |
| `show-success` | react | end | 예약 결과 표시 |
| `show-retry` | react | stop | 5xx 시 잠시 후 재시도 안내 |
| `show-congestion` | react | stop | 30초 timeout 시 일시적 혼잡 안내 |

### Edges와 exceptions

- 정상: request→lock→session check→PMS call→PMS process→success
- 예외 1: session check→duplicate block, `2초 이내 동일 요청`, 외부 PMS 미호출
- 예외 2: PMS process→retry guidance, `PMS 5xx`
- 예외 3: PMS call→congestion guidance, `30초 timeout`
- 정상과 예외는 색만이 아니라 실선/점선, edge label, exception 텍스트로 구분
- `summary`와 step `description`은 시각 자료 없이도 같은 순서와 책임 경계를 전달

## 4. Archify artifact

| 계층 | 경로 | 계약 |
| --- | --- | --- |
| source | `apps/front/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.json` | lane/node/edge stable ID, label, normal/exception 의미의 원본 |
| generated HTML | `apps/front/public/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html` | Archify `deliver workflow` 결과; 수동 편집 금지 |
| typed target | `FEATURE_SWIMLANE_ARCHIFY_TARGETS` | feature slug, swimlane ID, URL의 정확한 조합 |
| preview ratio | `ARCHIFY_PREVIEW_ASPECT_RATIOS` | 생성 SVG viewBox 기준 비율 |
| React fallback | `FeatureSwimlane` | iframe 실패·timeout에서도 동등한 핵심 흐름 제공 |

source와 generated HTML은 validate/deliver 후 ID·방향·kind·outcome·label parity를 확인한다. preview는 MAP 밀도, dialog는 READ 밀도와 공통 선 범례·transcript를 제공한다.

## 5. 연결 인사이트

| 필드 | 목표 |
| --- | --- |
| slug | `logging-decoupling-and-buffering-in-external-api-systems` 불변 |
| title | `로그는 남기는 것보다 조회할 수 있어야 한다: 외부 API 로그 분리기` 유지 |
| type/source | `project-case` / `the-siena-golf-reservation` 유지 |
| 질문 | 업무 데이터와 외부 API 통신 로그의 저장 경계를 왜 분리했는가? |
| visual | 기존 업무 DB→`syslog` before/after 시각 자료 유지 |
| 금지 | 프로젝트 전체 역할·기간·예약 방어 흐름 반복, 버퍼링·파일 I/O 성과, 미검토 기술 추가 |

## 6. 공개 관계와 상태 전이

```text
/projects 목록
  → /projects/the-siena-golf-reservation
      → /insights/logging-decoupling-and-buffering-in-external-api-systems
          → /projects/the-siena-golf-reservation
```

- slug와 route는 바뀌지 않는다.
- 작업물 legacy `content` 존재 → 구조화 detail 등록 → legacy `content` 제거 순서로 전이한다.
- Archify source 없음 → validate 통과 source → delivery HTML → typed target·ratio 등록 → preview/dialog 준비 완료 순서로 전이한다.
- visual 준비 실패·URL 불일치·필수 DOM 부재·timeout이면 빈 영역이 아니라 기존 React fallback을 표시한다.

## 7. 검증 불변식

1. 작업물 스윔레인은 정확히 1개이고 인사이트 visual을 반복하지 않는다.
2. 공개 근거 카드 3개 모두 값·종류·기준 시점·설명과 필요한 관찰 한계를 가진다.
3. 전체 아키텍처 설계 주도, 중복률 0%, 총 예약 건수 비율, 처리 시간·장애율·파일 I/O 개선, 요청 간 버퍼링 성과는 0건이다.
4. 두 route와 두 방향 링크가 keyboard로 동작한다.
5. 320/768/1024/1440px에서 document overflow와 핵심 node/edge label overlap은 0건이다.
6. 다른 구조화 작업물과 기존 인사이트의 공개 내용은 변경하지 않는다.
