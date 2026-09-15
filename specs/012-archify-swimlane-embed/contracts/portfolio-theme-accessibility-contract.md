# Contract: Portfolio Theme and Accessibility

**Date**: 2026-09-10

## Visual contract

Archify preset의 기술 종류별 색상을 공개 화면에 사용하지 않는다. iframe은 parent의 실제 computed CSS variables를 기준으로 다음 의미를 표현한다.

- background/card: 포트폴리오 background·card
- lane: muted
- node, normal edge와 primary text: foreground
- lane/node boundary: border
- sublabel: muted-foreground
- exception edge: destructive와 dashed line

security와 dashed edge는 색상뿐 아니라 원본의 경로·방향·선 종류로도 구분한다. 기술 종류별 legend는 제공하지 않는다.

parent root의 class가 바뀌면 iframe을 reload하지 않고 computed variables를 다시 적용한다. 준비 중에는 iframe을 숨겨 원래 Viewer theme나 chrome이 flash되지 않게 한다.

## Removed Viewer features

작은 보기와 크게 보기 모두 다음을 노출하거나 활성화하지 않는다.

- toolbar와 header
- search와 node finder
- export/copy/share
- theme/preset selector
- presentation/playback
- zoom, pan, overview map과 camera control
- relationship/semantic lens, route probe와 guide
- 내부 keyboard shortcuts

대표 Viewer 단축키를 입력해 camera, theme, presentation과 focus 상태가 바뀌지 않는 것을 자동 검사한다.

## Accessible name and alternative

- 시각 wrapper는 role="img"를 사용한다.
- wrapper의 accessible name은 스윔레인 제목과 표현 종류를 구분한다.
- aria-describedby는 기존 전체 흐름 설명을 가리킨다.
- 예외 대응은 iframe 바깥의 기존 텍스트로 계속 제공한다.
- iframe 자체는 aria-hidden="true", tabIndex={-1}이며 assistive technology reading order에 중복 노출하지 않는다.

## Interaction boundary

- iframe 내부 body는 inert 상태다.
- iframe surface는 pointer interaction을 받지 않는다.
- 내부 focusable element는 Tab 순서와 활성화 대상이 아니다.
- 유일한 공개 상호작용은 기존 크게 보기 trigger와 Dialog close다.
- Dialog는 mouse, touch, Enter/Space로 열리고 Escape와 close로 닫히며 trigger로 focus가 돌아온다.

## Responsive boundary

- 320, 768, 1024, 1440px에서 document-level horizontal overflow가 없어야 한다.
- preview는 카드 경계를 벗어나지 않고 단계명 요소와 전체 topology를 삭제 없이 보여주는 구조 미리보기다.
- 좁은 화면에서 단계명과 세부 문구를 판독하는 책임은 기존 `크게 보기` Dialog가 맡는다.
- Dialog는 viewport 안에서 scroll 책임을 명확히 갖고 close control과 diagram이 겹치지 않아야 한다.
- preview와 Dialog는 각 container의 가용 폭에 맞춰 같은 SVG geometry를 비례 축소하며 iframe 자체가 document-level overflow를 만들지 않아야 한다.
- topology나 label을 화면 폭에 따라 임의 삭제하지 않는다. preview와 Dialog의 차이는 승인된 MAP/READ 밀도뿐이다.

## Browser acceptance

- light와 dark 각각에서 portfolio token 적용
- theme class 변경 후 iframe reload 없이 색상 갱신
- Viewer control의 visible/focusable count 0
- iframe pointer activation과 Tab 진입 0
- 크게 보기 focus lifecycle 통과
- 지정 viewport의 document overflow 0
- 지정 viewport의 preview node 10개·edge 12개 유지와 Dialog READ 문구 확인
- load·DOM·timeout 실패에서 React fallback 100%
