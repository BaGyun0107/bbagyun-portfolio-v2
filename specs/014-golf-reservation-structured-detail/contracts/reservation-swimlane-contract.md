# Contract: 예약 요청·중복 방어·외부 장애 안내 스윔레인

**Date**: 2026-09-11

## 범위

작업물은 `reservation-request-and-exception-flow` 스윔레인 정확히 1개를 제공한다. 이 시각 자료는 예약 요청의 정상 경로와 예외 처리 위치를 설명하며, 연결 인사이트의 업무 DB→`syslog` 전후 그림이나 ERD를 포함하지 않는다.

## 책임 레인

1. `예약 사용자`: 예약 요청을 시작하고 결과 또는 안내를 확인한다.
2. `React`: 요청 직후 버튼을 잠그고 스피너를 표시하며 최종 응답을 표현한다.
3. `PHP 서버`: 동일 세션·동일 요청 2초 검사를 한 뒤 외부 PMS를 호출하고 오류를 분기한다.
4. `외부 PMS`: 예약 원본을 처리하고 성공 또는 5xx 결과를 반환한다.

## 정상 경로

```text
예약 요청
→ 버튼 비활성화·스피너
→ 동일 세션·동일 요청 검사
→ 30초 timeout으로 PMS 호출
→ PMS 예약 처리
→ 예약 결과 표시
```

정상 경로는 일반 실선과 의미 있는 단계 설명으로 표시한다.

## 예외 경로

| 예외 | 분기 위치 | 응답 | 외부 호출 |
| --- | --- | --- | --- |
| 2초 이내 동일 세션·동일 요청 | PHP 서버의 세션 검사 | 중복 요청 차단 | 발생하지 않음 |
| 외부 PMS 5xx | PMS 응답 처리 | 잠시 후 재시도 안내 | 이미 발생함 |
| 30초 timeout | PHP 서버의 외부 호출 | 일시적 혼잡 안내 | 완료 응답 없음 |

예외는 점선·label·예외 설명을 함께 사용해 색상만으로 구분하지 않는다. 세 예외는 trigger와 response가 서로 바뀌거나 하나로 합쳐지면 안 된다.

## Source와 artifact 계약

- source: `apps/front/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.json`
- generated HTML: `apps/front/public/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html`
- public URL: `/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html`
- feature slug: `the-siena-golf-reservation`
- swimlane ID: `reservation-request-and-exception-flow`

Archify `validate workflow --quality showcase`가 composition error 0, warning 0으로 통과한 source만 delivery한다. HTML은 `deliver workflow` 결과로 생성하고 직접 편집하지 않는다. source, HTML과 React fallback의 lane/node/edge ID, 방향, 정상·예외 종류, 결과와 label은 의미상 일치해야 한다.

## 작은 보기 계약

- 기존 `ArchifySwimlaneEmbed`의 MAP 밀도와 지연 로딩을 사용한다.
- 전체 흐름의 시작·정상 종료·세 예외 종료가 프레임 안에서 식별 가능해야 한다.
- Viewer chrome, 세부 transcript와 중복 Legend를 작은 보기 안에 표시하지 않는다.
- 포트폴리오 카드 폭을 넘기거나 문서 전체 가로 scroll을 만들지 않는다.
- artifact 준비 실패·timeout·URL 불일치에서는 빈 영역 대신 React fallback을 표시한다.

## 크게보기 계약

- 기존 dialog에서 READ 밀도, 공통 선 범례와 transcript를 제공한다.
- diagram 전체가 dialog 안에 잘리지 않고 표시된다.
- mouse, touch, keyboard로 열 수 있고 Escape로 닫은 뒤 trigger에 focus가 돌아온다.
- dialog와 iframe은 각각 접근 가능한 이름과 설명 관계를 갖는다.

## Theme와 접근성 계약

- 포트폴리오의 밝은/어두운 theme token을 iframe에 적용한다.
- 일반 실선·일반 점선·강조 실선·강조 점선 의미는 공통 범례와 일치한다.
- edge label과 검증·종료 상태 글자색은 theme foreground/destructive 의미에 맞고 배경 대비를 잃지 않는다.
- `summary`, step `description`, exception trigger/response가 diagram과 동등한 텍스트 설명을 제공한다.

## 반응형 계약

320, 768, 1024, 1440px에서 다음을 만족한다.

- document `scrollWidth - clientWidth = 0`
- preview와 dialog의 핵심 node·edge label 잘림 0건
- 핵심 node·화살표·label 겹침 0건
- 시작·정상 결과·세 예외 결과가 viewport나 dialog 밖으로 사라지지 않음
- 기존 구조화 작업물의 preview/dialog 포맷과 공통 범례가 회귀하지 않음
