# Phase 0 Research: 하이패스 B2B 플랫폼 구조화 상세와 연결 인사이트 정정

**Date**: 2026-09-04

2026-09-04 사용자 인터뷰, 현재 포트폴리오 데이터·렌더러·테스트, 읽기 전용으로 확인한 하이패스 소스의 구현 경계를 바탕으로 아래 결정을 확정했다. Technical Context의 미확정 항목은 없다.

## D-001. 작업물은 기존 구조화 상세 계약으로 이전한다

**Decision**: `hipass-b2b-platform.ts`를 만들고 `FeatureDetailDto`의 역할, 근거 지표, 문제, 제약, 대안, 스윔레인, 구현, 결과, 회고 순서를 사용한다. legacy `content`는 제거한다.

**Rationale**: 이미 네 작업물이 공통 계약과 renderer를 사용한다. 하이패스 전용 템플릿은 비교 가능한 읽기 순서와 점진 이전 계약을 갈라놓는다.

**Alternatives considered**: legacy Markdown만 정정하는 안은 구조적 비교와 검증을 할 수 없어 기각했다. 하이패스 전용 페이지도 공통 정보 구조 원칙에 맞지 않아 기각했다.

## D-002. 공개 수치는 운영 기록에서 확인한 근사 측정값으로 구분한다

**Decision**: 월 주문 약 100건, 월 결제액 약 400~500만 원, 월 정산 포함 완료 주문 약 70건, 월 실지급 화원 약 10~20곳을 `measured` 카드로 제공한다. `asOf`는 `2026-06`으로 맞추고, 월말 보고서·관리자/DB 기록 및 지급대행 내역 대사에서 확인한 근사값이라는 한계를 쓴다. 등록 정산 대상 약 50곳은 실지급 카드에서 별도 풀 규모로 구분한다.

**Rationale**: 사용자가 운영 기록을 반복 확인했으므로 직접 측정 근거가 있으나 정확한 전수 통계나 표본 평균은 남아 있지 않다. `약`과 범위를 유지하고 비율·합계로 재계산하지 않는다.

**Alternatives considered**: 모두 사용자 보고값으로 낮추는 안은 운영 기록 근거를 약화해 기각했다. 정확한 평균·전환율 계산은 분모와 원시 데이터가 없어 기각했다.

## D-003. 현재 상태는 Archived로 표시하고 기간 의미를 본문에서 분리한다

**Decision**: 기존 `FeatureStatus` 중 `Archived`를 사용한다. 카드 기간은 기능 설계·코드 수정 기간 `2024.08 – 2025.08`을 유지하고, 개요와 결과에서 신규 거래 운영은 `2026-06`에 끝났으며 관리자 조회와 데이터 보존만 유지됨을 밝힌다.

**Rationale**: `Production`은 지금도 신규 주문·결제·정산이 진행되는 것으로 오해될 수 있다. 한 작업물 때문에 전역 status enum을 확장하지 않는다.

## D-004. 작업물 시각 자료는 결제 보상 흐름 하나만 제공한다

**Decision**: 기존 `ProjectSwimlane`으로 주문 요청, 내부 DB 처리, Toss 결제 승인, 주문 저장·commit의 정상 경로와 승인 뒤 DB 실패 시 rollback·자동 취소의 보상 경로를 표현한다. 취소 API도 실패하면 `복구 미구현·운영 확인 필요` stop으로 끝낸다.

**Rationale**: 사용자가 대표 시각 자료 한 건을 승인했다. 이중 실패는 개발 환경에서 재현했지만 자동 복구는 구현하지 않았으므로 성공 경로로 연결하면 안 된다.

**Alternatives considered**: 정산·소켓까지 작업물 스윔레인에 합치는 안은 연결 인사이트와 중복되어 기각했다. 자동 재시도·멱등 처리는 구현 근거가 없어 제외했다.

## D-005. 인사이트 시각 자료는 두 변형의 작은 선택형 계약으로 제공한다

**Decision**: `InsightDto`에 선택형 `visual`을 추가한다. `data-flow`는 정산의 상태·데이터 노드와 성공·실패 edge를 표현하고, `before-after`는 Socket.io의 공용 Room과 화원별 User Room 구조를 두 패널로 비교한다. 범용 좌표 편집, 자동 edge routing, Mermaid, 외부 다이어그램 의존성은 추가하지 않는다.

**Rationale**: 현재 `visualAssessment`는 필요성과 텍스트 대안만 저장하고 실제 시각 데이터를 갖지 않는다. Markdown code fence는 노드와 관계를 타입·반응형 계약으로 검증할 수 없지만 범용 그래프 모델은 정적 두 건에 비해 지나치게 크다.

**Alternatives considered**: ASCII 그림은 의미·접근성·반응형을 보장하기 어려워 기각했다. 작업물 swimlane 재사용은 상태/데이터와 전후 비교를 lane 책임 흐름으로 왜곡해 기각했다. Mermaid 도입도 의존성과 hydration 비용 때문에 제외했다.

## D-006. 시각 판정과 실제 데이터는 함께 검증한다

**Decision**: 두 인사이트의 `visualAssessment.decision`을 `provided`로 바꾸고 실제 `visual.kind`와 일치시킨다. 정산은 `data-flow`, Socket.io는 `architecture` assessment와 `before-after` visual을 사용한다. `question`, `textAlternative`, `nonDuplicationReason`은 필수다. typed visual이 있는데 `provided`가 아니면 게시 검증에서 실패한다.

**Rationale**: 제공됨으로 표시하고 화면에 아무것도 없으면 편집 계약이 사실과 달라진다. 기존 typed visual이 없는 `provided` 글은 이번 기능에서 일괄 이전하지 않고 legacy 상태로 허용한다.

## D-007. 정산 인사이트는 DB 판단과 JSON 입력의 역할 분리만 다룬다

**Decision**: DB `PENDING → PROCESSING → COMPLETED`를 지급 판단 기준으로, JSON을 계산 완료된 지급 입력과 실패 항목 보존 수단으로 설명한다. 실행 전 DB를 재확인하고, 성공 항목은 JSON에서 제거하며 실패 항목은 남겨 매일 10시·14시에 재처리한다. 스케줄러는 단일 PM2 프로세스로 분리한 실제 목적까지만 쓴다.

**Rationale**: JSON은 상태 원본도 Outbox도 아니다. 사용자는 당시 Outbox, RabbitMQ, Kafka를 알지 못했고 현재 Redis·DB 단독·스케줄러 대안을 검증하지 않았다.

## D-008. Socket.io 인사이트는 전달 범위와 전달 보장을 분리한다

**Decision**: 신규 구축 당시 Polling과 Socket.io를 비교한 사실, 개발 중 공용 Room의 과도한 수신 범위를 발견해 `user_<gardenId>`로 변경한 사실, 다계정 브라우저 확인을 중심으로 쓴다. 공용 Room 시절 미수신 관찰과 User Room 이후 미재현은 원인이 규명되지 않은 별도 사실로 둔다. PM2 3개 워커와 cluster adapter는 운영 적용·브라우저 관찰까지만 표현한다.

**Rationale**: User Room은 누가 받을지를 제한하지만 끊긴 클라이언트의 수신을 보장하지 않는다. ACK, DLQ, Redis Stream, cursor 복구, Redis Adapter는 사용자가 당시 검토하지 않았다.

## D-009. 두 인사이트는 작업물 전체 서사를 반복하지 않는다

**Decision**: 작업물은 역할·업무 전환·전체 구현·운영 대사를 설명한다. 정산 인사이트는 DB/JSON 역할과 재처리, Socket.io 인사이트는 Room 전달 범위와 보장 한계만 다룬다. 관련 인사이트 카드와 각 인사이트 sidebar를 양방향 출처 연결로 유지한다.

**Rationale**: 같은 프로젝트 개요를 반복하면 인사이트의 질문과 판단이 묻힌다. 두 글은 모두 하이패스에서 얻은 프로젝트 사례이므로 독립 글로 전환하지 않는다.

## D-010. 검증은 콘텐츠 계약과 fresh production 화면을 함께 사용한다

**Decision**: Vitest에서 승인 문구·금지 주장·수치 단위·slug·양방향 연결·visual 선택형 계약·조건부 렌더링을 먼저 RED로 만든다. Playwright는 세 공개 경로, 목록 진입, 키보드 링크, 320/768/1024/1440px document overflow와 시각 노드·라벨 겹침을 검증한다. 포트 1104가 아닌 별도 포트에서 production build를 실행한다.

**Rationale**: 정적 데이터만으로 route, keyboard focus, CSS 배치를 증명할 수 없고, E2E 문자열만으로 철회된 기술 주장 전체를 안정적으로 차단하기 어렵다.

## Visual Evidence Inventory

| 공개 기록 | 판정 | 종류 | 답하는 질문 | 비중복 근거 |
| --- | --- | --- | --- | --- |
| `hipass-b2b-platform` | provided | swimlane | 외부 결제 승인 뒤 내부 저장이 실패하면 실제 구현은 어디까지 보상했는가? | 작업물의 결제 정상·이중 실패 경계만 표현한다 |
| `json-outbox-pattern-for-settlement` | provided | data-flow | 지급 판단 상태와 재처리 입력은 어디에 있고 성공·실패 뒤 어떻게 바뀌는가? | 결제가 아니라 정산 DB/JSON 역할과 재시도만 표현한다 |
| `socketio-realtime-architecture-and-reliability` | provided | architecture/before-after | 공용 Room에서 화원별 Room으로 바꾸며 수신 대상은 어떻게 달라졌는가? | 지급 흐름이 아니라 실시간 이벤트의 대상 범위만 비교한다 |

세 시각 자료 모두 승인된 사실만 입력하며 고객명, 계좌·결제 식별자, 실제 주문 payload, 시크릿, 비공개 로그·소스는 포함하지 않는다.
