# Data Model: Archify 스윔레인 임베드 전환

**Date**: 2026-09-10

## 1. FeatureSwimlaneArchifyEmbed

대상 스윔레인이 실제 Archify 정적 문서를 선택할 때 사용하는 선택 metadata다.

~~~ts
interface FeatureSwimlaneArchifyEmbed {
  url: string;
}

interface FeatureSwimlane {
  // 기존 필드 유지
  archify?: FeatureSwimlaneArchifyEmbed;
}
~~~

### Validation

- url은 비어 있지 않아야 한다.
- /diagrams/로 시작하는 root-relative path여야 한다.
- .html로 끝나야 한다.
- scheme, protocol-relative origin, query와 hash를 허용하지 않는다.
- 대상 호텔 스윔레인 한 건만 값을 가진다.
- label은 embed 계약에 존재하지 않는다.

## 2. ArchifyEmbedMode

같은 artifact의 표시 밀도를 선택하는 UI 입력이다.

~~~ts
type ArchifyEmbedMode = 'preview' | 'dialog';
~~~

| mode | Archify detail level | 표시 내용 | mount 시점 |
| --- | --- | --- | --- |
| preview | map | node label, 모든 관계 geometry | viewport 240px 접근 |
| dialog | read | node label+sublabel, 의미 있는 edge label | Dialog open |

두 mode는 같은 URL, node, edge와 geometry를 사용한다.

## 3. ArchifyEmbedState

iframe lifecycle을 사용자에게 노출 가능한 상태로 제한한다.

~~~ts
type ArchifyEmbedState = 'idle' | 'loading' | 'ready' | 'fallback';
~~~

### State transitions

~~~text
idle
 ├─ preview가 viewport 근처 / Dialog open ─> loading
 └─ mount하지 않음 ─────────────────────────> idle

loading
 ├─ load + same-origin + diagram DOM + adapter 완료 ─> ready
 ├─ load error ──────────────────────────────────────> fallback
 ├─ same-origin/DOM 검증 실패 ──────────────────────> fallback
 └─ 5초 timeout ─────────────────────────────────────> fallback

ready
 ├─ parent theme class 변경 ─> ready (CSS variables만 갱신)
 └─ unmount ─────────────────> idle

fallback
 └─ 해당 mount lifecycle 동안 ResponsiveSwimlaneDiagram 유지
~~~

원래 Viewer 화면은 loading에서 숨기고 ready가 된 뒤에만 공개한다.

## 4. PortfolioThemeSnapshot

parent document의 computed token을 iframe에 전달하기 위한 런타임 값이다. 데이터 저장 대상이 아니다.

~~~ts
interface PortfolioThemeSnapshot {
  background: string;
  foreground: string;
  card: string;
  muted: string;
  mutedForeground: string;
  destructive: string;
  border: string;
}
~~~

모든 값은 현재 parent root의 computed CSS custom property에서 읽는다. 빈 값은 adapter 실패로 취급하거나 안전한 기존 computed 값으로 유지하되 고정 제품 색상을 새로 정의하지 않는다.

## 5. ArchifyDocumentContract

same-origin document가 준비 가능하다고 판단하는 최소 runtime 구조다.

~~~ts
interface ArchifyDocumentContract {
  root: HTMLElement;
  diagramContainer: HTMLElement;
  svg: SVGSVGElement;
}
~~~

### Required DOM

- document.documentElement
- .diagram-container
- .diagram-container > svg

### Applied attributes

- root data-embed="true"
- root data-motion="still"
- diagram container data-detail-level="map" | "read"
- body inert

### Removed interaction

- iframe tabIndex=-1, aria-hidden=true
- iframe surface pointer interaction 차단
- 내부 interactive element의 focus/activation 차단
- Viewer toolbar, search, export, theme, presentation, zoom/pan, semantic UI 미표시

## 6. ArchifyArtifactIdentity

런타임 데이터가 아니라 회귀 검증 기준이다.

| Artifact | SHA-256 | Bytes |
| --- | --- | ---: |
| JSON source | b5472af8952722b9b5fea87fc930f2c5880634ff8da5f17f16c6aaa4f819c419 | 4,355 |
| generated HTML | a23ebd2219cda3bad5deccc3461e7d6522cfc90d5e34d6d4dffd5469817f49d3 | 714,531 |

Feature 012는 두 파일을 수정·재생성하지 않는다. node 10개와 edge 12개, edge 방향, security와 dashed 변형도 함께 검사한다.

## Relationships

~~~text
FeatureDetail
  └─ FeatureSwimlane
       ├─ existing lanes/nodes/edges ──> ResponsiveSwimlaneDiagram fallback
       └─ archify.url ─────────────────> ArchifySwimlaneEmbed
                                           ├─ preview -> MAP
                                           └─ dialog  -> READ

ArchifySwimlaneEmbed
  ├─ reads PortfolioThemeSnapshot
  ├─ validates ArchifyDocumentContract
  └─ preserves ArchifyArtifactIdentity
~~~
