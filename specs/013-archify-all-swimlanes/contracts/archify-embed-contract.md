# Contract: 전체 스윔레인 Archify 임베드

**Date**: 2026-09-10

## Purpose

8개 기존 스윔레인의 실제 Archify 생성 HTML을 현재 포트폴리오 카드와 Dialog 안에서 같은 방식으로 표시한다.

## Data boundary

```ts
interface FeatureSwimlaneArchifyEmbed {
  url: string;
}
```

- 선택 metadata이며 값이 없거나 검증에 실패하면 기존 renderer를 사용한다.
- URL은 query/hash 없는 `/diagrams/<feature>/<swimlane>.html` 상대 경로만 허용한다.
- label, 새 탭 action, 외부 origin은 계약에 포함하지 않는다.
- URL의 feature/swimlane ID는 명세의 8개 대상과 일치해야 한다.

## Artifact boundary

- source: `apps/front/diagrams/<feature>/<swimlane>.json`
- generated artifact: `apps/front/public/diagrams/<feature>/<swimlane>.html`
- source와 artifact는 Archify `validate workflow --quality showcase` 및 `deliver workflow --quality showcase` 결과를 provenance로 기록한다.
- source의 node/relationship stable ID, 방향, 정상·예외 의미와 의미 있는 label은 대응 `FeatureSwimlane`과 parity가 1:1이어야 한다. canonical lane은 동일 책임의 presentation band에 직접 또는 문서화된 다대일 매핑으로 대응해야 한다.
- Feature 012 호텔 JSON·HTML은 해시와 byte count를 유지하며 이 feature에서 직접 편집하거나 재생성하지 않는다.

## Runtime preparation

iframe load 후 다음 준비를 하나의 transaction으로 수행한다.

1. same-origin `contentDocument`에 접근한다.
2. `.diagram-container > svg`를 포함한 필수 DOM을 확인한다.
3. root에 표시 전용 embed와 정지 motion 상태를 적용한다.
4. preview는 MAP, Dialog는 READ 정보 밀도를 선택한다.
5. parent portfolio semantic token을 artifact root에 연결한다.
6. body/iframe 내부의 pointer, keyboard, focus와 Viewer chrome을 차단한다.
7. 모든 단계가 성공한 뒤에만 iframe을 공개한다.

중간 실패는 부분 Viewer 화면을 공개하지 않고 fallback으로 전환한다.

## Load scheduling

- preview는 IntersectionObserver root margin 240px에서만 mount한다.
- Dialog는 열릴 때만 상세 instance를 mount한다.
- 5초 준비 제한 시간을 넘기면 fallback한다.
- 각 instance의 observer·timer·theme lifecycle은 다른 카드와 격리한다.

## Display contract

| Mode | Visible content | Hidden content |
| --- | --- | --- |
| preview | 전체 topology, lane, 단계명, 관계선 | 단계 세부 설명, 관계 label, Viewer UI |
| dialog | preview와 같은 topology, 단계 세부 설명, 의미 있는 관계 label, 공통 범례 | Viewer UI, 새 탭 action |

1024px 미만 Dialog에는 원본 `FeatureSwimlane`에서 파생한 단계·label 관계 transcript를 추가한다. transcript는 14px 이상의 구조화 텍스트로 읽을 수 있어야 한다.

## Fallback

다음은 모두 해당 instance의 기존 `ResponsiveSwimlaneDiagram`으로 대체한다.

- 허용되지 않은 URL, 외부 URL, query/hash, 누락 artifact
- iframe load error 또는 same-origin 접근 실패
- 필수 Archify DOM 부재 또는 adapter 적용 실패
- 5초 준비 timeout

fallback 상태에서도 카드 제목·목적·전체 흐름 설명·예외 상황과 대응·Dialog 초점 계약을 유지한다. 한 instance의 실패가 다른 스윔레인 상태를 바꾸지 않는다.

## Acceptance

- 명세에 열거한 8개 대상 모두 동일한 adapter/card/Dialog 구조를 사용한다.
- preview와 Dialog는 같은 artifact URL·topology를 사용한다.
- preview에서 세부 설명·관계 label 노출이 0건이고, Dialog/transcript에서 승인된 문구 누락이 0건이다.
- Viewer toolbar, 검색, export, pan/zoom, 새 탭 action은 사용자에게 노출·활성화되지 않는다.
- artifact 실패 조건에서 빈 영역 없이 fallback으로 수렴한다.
