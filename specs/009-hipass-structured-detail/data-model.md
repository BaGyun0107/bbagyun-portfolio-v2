# Data Model: 하이패스 구조화 상세와 인사이트 시각 자료

**Date**: 2026-09-04

## 1. Feature 메타데이터

| 필드 | 목표 값/규칙 |
| --- | --- |
| `slug` | `hipass-b2b-platform` 불변 |
| `description` | 전화·팩스·카카오톡 주문과 계좌이체 업무를 온라인 주문·승인·배송·결제·정산으로 신규 구축한 프로젝트로 요약 |
| `overview` | 백엔드 단독 책임, 프론트엔드 2인 협업, 실제 운영·현재 상태를 과장 없이 요약 |
| `period` | `2024.08 – 2025.08` (기능 설계부터 마지막 코드 수정까지) |
| `team` | `FE 2명 (본인 포함) / BE 1명 (본인)` |
| `status` | `Archived` (신규 거래 운영 2026-06 종료, 관리자 조회·데이터 보존 유지) |
| `content` | 제거. 구조화 상세와 중복 렌더링 금지 |

## 2. FeatureDetailDto 인스턴스

### 역할

- 백엔드 서버, 결제·정산·Socket.io, 운영 유지보수: 사용자 단독 책임
- 프론트엔드: 사용자 포함 2명
- 사용자 프론트엔드 기여: 최초 기능/페이지 단위 디렉터리와 상태 소유 규칙 제안, 기능 구현, 코드 리뷰·유지보수에서 규칙 확인
- 측정하지 않은 생산성 향상률, 팀 표준 전체 확산 주장은 금지

### 공개 지표

| id | label | value | kind | asOf | 근거와 제한 |
| --- | --- | --- | --- | --- | --- |
| `monthly-orders` | 월 주문 | `약 100건` | measured | `2026-06` | 거래 운영 기간의 월말 보고서와 관리자·DB 기록에서 확인한 근사 규모. 전수 평균 아님 |
| `monthly-payment-volume` | 월 결제액 | `약 400~500만 원` | measured | `2026-06` | 같은 운영 기록의 근사 범위. 누적액·매출·정산액으로 확대 금지 |
| `monthly-settlement-orders` | 월 정산 포함 완료 주문 | `약 70건` | measured | `2026-06` | 정산 지급 횟수나 화원 수가 아니라 정산 계산에 포함된 완료 주문 수 |
| `monthly-paid-gardens` | 월 실지급 화원 | `약 10~20곳` | measured | `2026-06` | 등록 정산 대상 약 50곳 중 해당 월 지급대행 내역에 실제 지급된 화원 범위 |

모든 값은 `약` 또는 범위를 유지한다. 네 값으로 비율·합계·평균을 새로 계산하지 않는다.

### 서술 필드

| 필드 | 포함할 핵심 | 공개 한계 |
| --- | --- | --- |
| `problem` | 오프라인 주문 창구와 계좌이체, 결제·내부 DB·지급대행의 경계, 관련 사용자만 받아야 하는 실시간 변경 | 기존 운영 Polling 제거로 쓰지 않음 |
| `constraints` | 소규모 팀, 외부 결제/지급 API 비원자성, 단일 서버·단일 스케줄러 운영, 거래·시크릿 비공개 | MQ를 검토한 제약으로 쓰지 않음 |
| `alternatives` | 신규 실시간 기능에서 Polling과 Socket.io 비교, 정산의 실제 DB+JSON·단일 scheduler 선택 | Outbox/MQ/ACK/Redis 대안 비교 금지 |
| `implementation` | 결제 보상 취소, DB 상태+JSON 재처리, user room, 프론트 기능 단위 구조 | 구현하지 않은 복구/성능 성과 금지 |
| `outcomes` | 2026-06까지 월 2회 대사에서 불일치·중복 미확인, 개발 환경 보상 취소 성공, 관련 화원만 수신 확인 | 보편적 무결성·전달 보장으로 확대 금지 |
| `retrospective` | 결제 취소 이중 실패 시 운영 알림/수동 확인 필요, 로컬 JSON의 scale-out 한계, 전달 범위와 보장 구분 | 검토하지 않은 해결책을 확정안으로 쓰지 않음 |

## 3. 결제·보상 취소 스윔레인

lane은 `주문 사용자`, `하이패스 서버`, `Toss 결제`, `주문 DB` 네 개다.

```text
주문 요청 → DB transaction 시작 → Toss 결제 승인 → 주문 저장 → commit → 주문 완료

주문 저장 실패 → rollback → Toss 자동 취소
                             ├─ 취소 성공 → 결제 취소로 종료
                             └─ 취소 API 실패 → 복구 미구현·운영 확인 필요(stop)
```

- 정상 path의 start와 end는 하나씩 둔다.
- DB 실패 뒤 rollback과 자동 취소는 개발 환경에서 성공 검증한 구현 경로다.
- 취소 API 실패는 개발 환경에서 재현했으나 자동 재시도·알림·복구가 없었던 stop 경로다.
- 현재 권장 대응인 운영자 알림·수동 확인/취소는 회고 문장으로만 쓰고 구현 node로 오해시키지 않는다.

## 4. Insight visual 선택형 계약

```ts
interface InsightVisualBase {
  id: string;
  title: string;
  question: string;
  textAlternative: string;
}

type InsightVisual = InsightDataFlowVisual | InsightBeforeAfterVisual;
```

`InsightDto.visual?: InsightVisual`은 선택 필드다. 이 기능의 두 인사이트만 값을 추가하며 다른 legacy 인사이트는 변경하지 않는다.

### Data-flow 변형

```ts
interface InsightDataFlowNode {
  id: string;
  label: string;
  detail: string;
  role: 'state' | 'data' | 'action' | 'terminal';
}

interface InsightDataFlowEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  outcome: 'normal' | 'success' | 'failure' | 'retry';
}

interface InsightDataFlowVisual extends InsightVisualBase {
  variant: 'data-flow';
  nodes: InsightDataFlowNode[];
  edges: InsightDataFlowEdge[];
}
```

정산 node는 DB 상태 조회/선점, JSON 지급 입력, 지급대행 호출, 성공 시 DB `COMPLETED`와 JSON 성공 항목 제거, 실패 시 JSON 실패 항목 보존, 매일 10시·14시 재실행 전 DB 재확인을 표현한다. JSON을 상태 원본으로 표시하지 않는다.

### Before/After 변형

```ts
interface InsightArchitectureActor {
  id: string;
  label: string;
  role: 'server' | 'room' | 'recipient' | 'unrelated';
}

interface InsightArchitectureConnection {
  id: string;
  from: string;
  to: string;
  label: string;
  scope: 'intended' | 'overbroad';
}

interface InsightArchitecturePanel {
  id: 'before' | 'after';
  title: string;
  summary: string;
  actors: InsightArchitectureActor[];
  connections: InsightArchitectureConnection[];
}

interface InsightBeforeAfterVisual extends InsightVisualBase {
  variant: 'before-after';
  panels: [InsightArchitecturePanel, InsightArchitecturePanel];
}
```

Before는 서버 → 공용 order room → 관련 화원과 무관 사용자까지 같은 전달 범위를, After는 서버 → `user_<gardenId>` room → 관련 화원만 전달 대상을 표현한다. After에 ACK, 재전송, 유실 복구 또는 다중 워커 보장을 넣지 않는다.

## 5. Editorial 일치 규칙

| slug | editorial type | decision | kind | visual variant |
| --- | --- | --- | --- | --- |
| `json-outbox-pattern-for-settlement` | project-case | provided | data-flow | data-flow |
| `socketio-realtime-architecture-and-reliability` | project-case | provided | architecture | before-after |

- typed `visual`이 있으면 assessment decision은 `provided`여야 한다.
- visual과 assessment의 `question`, `textAlternative`는 동일해야 한다.
- data-flow ↔ `data-flow`, before-after ↔ `architecture` kind만 허용한다.
- node/actor/edge/connection ID는 visual 안에서 유일하고 모든 연결 참조가 존재해야 한다.
- data-flow는 success, failure, retry를 각각 하나 이상 가진다.
- before-after는 정확히 두 패널과 `overbroad`, `intended` 관계를 각각 하나 이상 가진다.
- 빈 제목·질문·설명·라벨은 허용하지 않는다.
- typed visual이 없는 기존 인사이트의 legacy `provided` 판정은 이번 기능에서 거부하지 않는다.

## 6. 렌더링 상태와 연결

```text
visual 없음 → 기존 제목·excerpt·Markdown·sidebar만 표시
visual 있음 → excerpt 다음, Markdown 본문 이전에 제목·질문·diagram·text alternative 표시
```

- 차이는 색뿐 아니라 `정상`, `성공`, `실패`, `재시도`, `변경 전`, `변경 후` 텍스트와 선/테두리로 구분한다.
- 320px에서는 node와 패널이 문서 폭 안에서 세로로 재배치된다.
- 768px 이상에서는 관계를 가로로 읽되 document 전체 가로 스크롤을 만들지 않는다.
- 연결선은 node/actor의 보이는 텍스트를 통과하지 않는다.

```text
/projects/hipass-b2b-platform
  ├─ /insights/json-outbox-pattern-for-settlement
  └─ /insights/socketio-realtime-architecture-and-reliability

각 insight sidebar → /projects/hipass-b2b-platform
```

제목 변경은 링크 label에 반영하되 slug는 바꾸지 않는다.
