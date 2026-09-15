# Research: Archify 스윔레인 임베드 전환

**Date**: 2026-09-10

## D001. 공개 시각 자료의 기준

**Decision**: Feature 011에서 Archify가 생성한 self-contained HTML을 작은 보기와 크게 보기의 실제 화면으로 사용한다.

**Rationale**: 사용자가 승인한 것은 Archify의 node·edge·배치 결과다. 별도 목업이나 React SVG 재작성은 “실제 Archify 기준”이라는 요구를 충족하지 못하고 두 표현의 drift 가능성을 만든다.

**Alternatives considered**:

- Superpowers 목업을 제품 코드로 옮김: 방향 확인 자료일 뿐 실제 Archify 결과가 아니다.
- 기존 React renderer를 Archify처럼 스타일링함: topology를 두 번 관리하게 된다.

## D002. 통합 경계

**Decision**: same-origin 정적 HTML을 iframe으로 로드하고 parent에서 준비가 끝난 뒤 노출한다.

**Rationale**: 생성 HTML은 CSS와 동작을 포함한 독립 문서다. iframe은 앱 CSS와 생성 문서 CSS의 충돌을 막으면서, same-origin contentDocument 접근으로 표시 밀도·테마·상호작용을 조정할 수 있다.

**Alternatives considered**:

- HTML 문자열을 앱 DOM에 직접 삽입: script·id·global style 충돌과 hydration 위험이 크다.
- build-time SVG 추출: 실제 생성 문서 동작과 구조를 별도 파이프라인으로 복제해야 한다.
- 새 탭 Viewer 유지: 사용자가 요구한 현재 카드·Dialog 안의 읽기 경험과 맞지 않는다.

## D003. 동결 artifact 보존

**Decision**: JSON·HTML 파일은 수정하거나 재생성하지 않고 런타임 DOM adapter만 추가한다.

**Rationale**: Feature 011의 source/artifact SHA-256와 byte count가 생성 근거다. 표시 통합 때문에 파일을 바꾸면 선행 검증과 provenance가 무효화된다.

**Alternatives considered**:

- embed 전용 HTML을 다시 deliver함: 같은 의미라도 artifact identity가 달라진다.
- 생성 HTML에 수동 CSS를 삽입함: 생성물 직접 편집 금지와 재현성 계약을 위반한다.

## D004. 한 artifact의 두 정보 밀도

**Decision**: preview는 data-detail-level="map", Dialog는 data-detail-level="read"를 사용한다.

**Rationale**: 생성 HTML이 이미 MAP에서 context/fine을 숨기고 READ에서 context를 표시한다. 따라서 10개 node·12개 edge와 geometry를 그대로 공유하면서 preview의 sublabel·edge label만 줄일 수 있다.

**Alternatives considered**:

- 서로 다른 HTML 두 개 생성: topology와 layout drift 위험이 생긴다.
- CSS selector를 앱에서 모두 재정의: 생성 schema 변경에 더 취약하다.

**Responsive clarification**: 2026-09-10 독립 리뷰에서 1085×528 전체 geometry를 320px에 무스크롤로 축소하면 node label이 약 4px가 되는 상충 조건을 확인했다. 사용자는 A 정책을 선택해 preview를 실제 Archify 전체 topology의 구조 미리보기로 유지하고, 좁은 화면의 단계명·세부 문구 판독은 같은 artifact를 READ 밀도로 여는 기존 `크게 보기`가 담당하도록 확정했다. 모바일 React renderer 전환, 가로 스크롤과 responsive geometry 재작성은 선택하지 않았다.

## D005. 포트폴리오 테마 연결

**Decision**: parent document.documentElement의 computed CSS variables를 읽어 iframe root에 Archify CSS variable bridge를 적용하고, parent class 변경을 MutationObserver로 반영한다.

**Rationale**: 앱은 --background, --foreground, --muted, --muted-foreground, --destructive, --border를 밝고 어두운 화면의 source of truth로 사용한다. 별도 theme provider 의존 없이 실제 계산값을 전달하면 포트폴리오와 동기화되고 iframe reload가 필요 없다.

**Mapping**:

| Portfolio token | Archify target |
| --- | --- |
| --background, --card | --bg, --panel, --mask |
| --foreground | --text, 정상 node text, --arrow, --arrow-emphasis |
| --muted | --lane-fill |
| --muted-foreground | --text-muted |
| --border | --panel-border, --lane-stroke, 정상 node stroke |
| --destructive | --security-stroke, 예외 edge |

정상 node의 모든 기술 종류 색상은 같은 foreground/border 계열로 통일하고, security·dashed 예외 관계만 destructive와 점선을 사용한다.

**Alternatives considered**:

- Archify preset 색상 유지: 현재 포트폴리오와 어울리지 않고 기술 종류별 범례가 생긴다.
- 고정 light/dark hex 사용: 앱 token 변경과 동기화되지 않는다.
- iframe reload로 theme 변경: 준비 화면 flash와 불필요한 artifact 재로드가 생긴다.

## D006. 표시 전용 접근성 경계

**Decision**: 외부 wrapper가 role="img"와 aria-describedby로 의미를 제공하고, iframe은 aria-hidden, tabIndex=-1, 내부 body.inert, pointer 차단 상태로 둔다.

**Rationale**: 카드의 전체 흐름 설명과 예외 대응이 텍스트 대안이다. 생성 문서의 검색·zoom·관계 추적 같은 Viewer UI를 숨기는 것만으로는 keyboard focus와 script 동작이 남을 수 있으므로 문서 자체를 비상호작용 presentation으로 제한해야 한다.

**Alternatives considered**:

- iframe title만 제공: 내부 Viewer focus가 계속 노출된다.
- toolbar CSS 숨김만 적용: shortcut·pointer·프로그램적 focus를 차단하지 못한다.

## D007. 실패 안전성

**Decision**: load error, same-origin 접근 실패, .diagram-container > svg 부재, 5초 준비 timeout은 모두 기존 ResponsiveSwimlaneDiagram fallback으로 수렴한다.

**Rationale**: 정적 문서가 HTTP 200이어도 예상 구조가 아니면 성공이 아니다. 검증된 React renderer를 재사용하면 빈 영역이나 새 오류 UI 없이 모든 기존 설명을 유지할 수 있다.

**Alternatives considered**:

- 오류 문구만 표시: 시각 증거가 사라진다.
- 무한 loading: 사용자가 내용을 확인할 수 없다.
- 부분 준비 상태 공개: 원래 Viewer 색상과 기능이 flash될 수 있다.

## D008. 로드 비용

**Decision**: preview는 IntersectionObserver의 rootMargin 240px 0px 경계에서 mount하고, Dialog artifact는 Dialog가 열릴 때만 mount한다.

**Rationale**: 714KB 수준의 self-contained HTML을 페이지 진입 시 두 번 로드할 이유가 없다. 각 표현은 실제로 읽을 시점에만 준비한다.

**Alternatives considered**:

- 두 iframe 즉시 mount: 초기 네트워크·DOM·script 비용을 중복 지불한다.
- 하나의 iframe을 DOM 간 이동: Dialog focus lifecycle과 responsive sizing이 복잡해진다.

## D009. metadata 계약

**Decision**: FeatureSwimlane.archify는 same-origin HTML url만 보유한다. 선행 파일럿의 link label은 제거한다.

**Rationale**: 이제 metadata는 새 탭 action이 아니라 embed source 선택이다. 표시 문구가 없는 url-only 계약이 책임을 정확히 드러내고 dead data를 남기지 않는다.

**Alternatives considered**:

- 기존 { url, label } 유지: 사용하지 않는 “Archify로 보기” 문구가 공개 계약에 남는다.
- target id를 컴포넌트에 hard-code: 데이터 기반 선택 렌더링과 다른 작업물 회귀 검증이 어려워진다.

## D010. 허용 URL

**Decision**: /diagrams/로 시작하고 .html로 끝나며 query와 hash가 없는 relative same-origin URL만 허용한다.

**Rationale**: parent DOM adapter는 same-origin 접근을 전제로 한다. query/hash나 외부 origin을 허용하면 검증된 artifact identity와 보안 경계가 흐려진다.

**Alternatives considered**:

- 일반 URL 허용: cross-origin 접근이 실패하고 임의 embed source가 생긴다.
- absolute same-origin URL 허용: 환경별 origin이 데이터에 고정된다.

## D011. 검증 분리

**Decision**: Vitest의 계약·adapter 검사, artifact hash 검사, production Playwright의 실제 browser 검사와 screenshot 육안 검토를 별도 근거로 기록한다.

**Rationale**: DOM unit test는 브라우저 layout과 focus를 증명하지 못하고, screenshot은 lazy/fallback/data contract를 증명하지 못한다. 각 근거의 한계를 분리해야 SC-012를 충족한다.

**Alternatives considered**:

- snapshot 하나로 완료: 동작·provenance·responsive 근거가 부족하다.
- dev server E2E만 사용: 사용자 소유 port와 .next/dev lock을 방해한다.

## D012. 파일럿 범위

**Decision**: hotel-reservation-platform / platform-change-verification-deployment 한 건만 전환한다.

**Rationale**: 사용자가 이 결과를 화면에서 승인한 뒤 다른 스윔레인을 후속 전환하기로 했다. 성급한 공통 확대는 아직 승인되지 않은 표현을 바꾼다.

**Alternatives considered**:

- metadata가 있는 모든 스윔레인 자동 전환: 현재 metadata는 파일럿 한 건뿐이어도 후속 범위가 암묵적으로 열린다.
- 전체 스윔레인 일괄 전환: 별도 artifact와 사용자 검토가 없다.
