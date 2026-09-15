# Archify 포트폴리오 임베드 전환 설계

**작성일**: 2026-09-10
**대상 작업물**: `hotel-reservation-platform`
**대상 스윔레인**: `platform-change-verification-deployment`
**선행 기능**: `specs/011-archify-swimlane-pilot/`
**상태**: 사용자 설계 승인 완료, 문서 검토 대기

## 1. 목적

Feature 011에서 검증한 Archify 결과는 유지하되, 포트폴리오 독자에게는 standalone Viewer의 많은 탐색 기능 대신 현재 스윔레인 카드와 `크게 보기` 경험만 제공한다.

작은 미리보기와 크게 보기는 모두 Archify가 동일한 JSON 원본에서 생성한 실제 다이어그램을 사용한다. Superpowers Visual Companion에서 만든 화면은 카드 구성과 정보 밀도를 결정하기 위한 설계 목업일 뿐이며 구현 산출물로 복사하지 않는다.

## 2. 확정된 사용자 결정

- 현재 포트폴리오의 스윔레인 카드, 제목, 목적, `크게 보기`, 전체 흐름 설명과 예외 대응 구조를 유지한다.
- 작은 미리보기까지 Archify 기반으로 전환한다.
- 작은 보기와 크게 보기는 같은 10개 node·12개 edge 배치를 공유한다.
- 작은 보기는 node 제목과 전체 구조에 집중하고, 크게 보기는 node 세부 설명과 모든 의미 있는 관계 label을 표시한다.
- Archify의 검색, 내보내기, 테마 선택, 프레젠테이션, 확대·축소, 관계 추적과 키보드 단축키는 포트폴리오에서 제공하지 않는다.
- 별도 `Archify로 보기` 버튼과 새 탭 연결을 제거한다.
- 색상은 A1 규칙을 사용한다. node와 정상선은 `foreground`, lane은 `muted`, 경계는 `border`, 예외만 `destructive`와 점선으로 표현한다.
- 우선 호텔 예약 시스템 한 건에만 적용하고, 승인 뒤 다른 스윔레인의 후속 전환을 별도 기능으로 다룬다.

## 3. 선택한 구현 방식

Archify가 생성한 same-origin HTML을 iframe으로 불러오고 기존 `data-embed`와 Reading Depth 기능을 포트폴리오 전용 어댑터가 제한적으로 사용한다.

이 방식을 선택한 이유는 다음과 같다.

- 사용자가 승인한 Archify의 실제 node 위치, edge 경로, 화살표와 전체 구조를 그대로 사용한다.
- generated HTML을 직접 수정하지 않아 Feature 011의 delivery hash와 provenance를 유지한다.
- 기존 포트폴리오 renderer를 Archify처럼 다시 구현하는 중복 작업을 피한다.
- 한 건의 파일럿에서는 generated HTML에 포함된 숨은 Viewer runtime 비용을 감수할 수 있다.
- 여러 스윔레인으로 확대할 때는 별도의 정적 SVG 생성 파이프라인을 후속 검토할 수 있다.

정적 SVG 추출은 다수 스윔레인 전환 시 더 가벼울 수 있지만, 현재 범위에서는 compact/detail 표현과 테마 변환을 위한 추가 생성 파이프라인이 필요해 선택하지 않는다. 기존 React renderer를 Archify 스타일로 재작성하는 방식은 실제 Archify 결과를 사용하지 않고 geometry 책임을 다시 앱에 복제하므로 제외한다.

## 4. 컴포넌트 구조

`ProjectSwimlane`의 외부 구조는 유지한다. Archify metadata가 있는 대상에서만 내부 diagram renderer를 교체한다.

```text
ProjectSwimlane
├─ header
│  ├─ title + purpose
│  └─ 크게 보기
├─ preview figure
│  └─ ArchifySwimlaneEmbed(mode="preview")
├─ 전체 흐름 설명
└─ 예외 상황과 대응

Dialog
└─ ArchifySwimlaneEmbed(mode="dialog")
```

- `preview`는 Archify `MAP` 밀도를 사용한다.
- `dialog`는 Archify `READ` 밀도를 사용한다.
- 두 instance는 같은 HTML URL과 동일한 authored geometry를 사용한다.
- Dialog instance는 Dialog가 열릴 때만 생성한다.
- metadata가 없는 기존 스윔레인은 현재 `ResponsiveSwimlaneDiagram`을 계속 사용한다.

현재 새 탭 링크에 사용한 `archify.label`은 더 이상 공개 UI에서 사용하지 않는다. 선택형 metadata는 same-origin HTML URL만 소유하는 embed 계약으로 정리하며, 표시 문구는 기존 `크게 보기`를 그대로 사용한다.

## 5. 임베드 준비 과정

generated HTML 파일 자체는 수정하지 않는다. iframe을 숨긴 상태로 로드한 뒤 same-origin document가 준비되면 어댑터가 runtime DOM에만 다음 상태를 적용한다.

1. 예상한 `.diagram-container > svg`가 존재하는지 확인한다.
2. document root에 `data-embed="true"`를 설정한다.
3. 모션을 정지 상태로 고정한다.
4. preview는 `.diagram-container[data-detail-level="map"]`, Dialog는 `data-detail-level="read"`를 적용한다.
5. 포트폴리오 테마 색상을 Archify CSS 변수에 전달한다.
6. iframe 내부의 focus와 pointer interaction을 비활성화한다.
7. 준비가 끝난 뒤 iframe을 표시한다.

stored URL에는 query나 fragment를 추가하지 않는다. 현재의 safe same-origin `/diagrams/**/*.html` 경로 검증을 유지하며 embed와 밀도 상태는 부모 컴포넌트가 로드 후 설정한다.

## 6. 정보 밀도

두 화면의 topology와 authored 의미는 동일하다. 밀도 차이는 Archify가 생성한 `data-detail` 표시 여부로만 만든다.

### 작은 보기 — MAP

- lane, node 형태, node 제목, 화살표와 전체 분기·복구 구조를 표시한다.
- node sublabel과 관계 label처럼 `context`로 분류된 세부 정보는 숨긴다.
- node나 관계를 삭제하거나 작은 보기 전용 요약 topology를 만들지 않는다.
- pointer interaction과 iframe Tab 진입을 막는다.

### 크게 보기 — READ

- 작은 보기와 같은 위치와 경로를 유지한다.
- node sublabel과 의미 있는 관계 label을 표시한다.
- Viewer toolbar, 검색, 내보내기, 확대·축소, semantic 기능과 presentation 기능은 숨긴다.
- 기존 Dialog의 닫기, Escape와 trigger focus 복귀만 사용자 동작으로 제공한다.

## 7. 포트폴리오 테마 통합

고정 hex 색상을 새로 만들지 않고 부모 페이지의 실제 computed theme 값을 iframe에 전달한다.

| Archify 표현 | 포트폴리오 토큰 |
| --- | --- |
| 문서·node 배경 | `card` |
| lane 배경 | `muted` |
| 본문·node·정상 관계 | `foreground` |
| 보조 문구 | `muted-foreground` |
| panel·lane·node 경계 | `border` |
| 예외 관계 | `destructive` |

- 모든 component kind는 별도 기술 색상으로 구분하지 않는다.
- 정상 관계는 색만으로 의미를 만들지 않고 방향과 구조를 유지한다.
- 예외 관계는 `destructive` 색상과 점선을 함께 사용한다.
- 포트폴리오 light/dark 상태가 바뀌면 iframe을 다시 불러오지 않고 CSS 변수만 다시 동기화한다.
- 테마와 embed 준비가 끝나기 전에는 iframe을 표시하지 않아 원래 Archify chrome이나 색상이 순간적으로 노출되지 않게 한다.

## 8. 접근성·상호작용 경계

포트폴리오에서는 Archify iframe을 탐색 도구가 아니라 하나의 시각 자료로 취급한다.

- 바깥 wrapper가 `role="img"`와 스윔레인 제목을 제공한다.
- 기존 전체 흐름 설명을 `aria-describedby`로 연결한다.
- iframe은 보조기술과 Tab 순서에서 제외하고 내부 document를 inert 상태로 만든다.
- 작은 보기와 크게 보기 모두 pointer interaction을 차단한다.
- `크게 보기` Button은 기존 accessible name을 유지한다.
- Dialog는 기존 focus trap, Escape close와 trigger focus return을 유지한다.
- 색상만으로 정상·예외를 구분하지 않으며 관계 방향, 점선과 외부 텍스트 설명을 함께 유지한다.

## 9. 실패 대응

다음 중 하나가 발생하면 해당 instance는 빈 iframe을 남기지 않고 기존 React 스윔레인으로 대체한다.

- generated HTML을 불러오지 못함
- same-origin document에 예상한 diagram container 또는 SVG가 없음
- 제한 시간 안에 embed 준비가 끝나지 않음
- iframe document 접근이 같은 origin 계약을 충족하지 않음

fallback은 기존 `FeatureSwimlane` 데이터를 사용하는 `ResponsiveSwimlaneDiagram`이다. 전체 흐름 설명과 예외 대응은 renderer와 독립적으로 항상 남는다.

public HTML 누락이나 metadata와 artifact 경로 불일치는 빌드 전 품질 검사에서도 실패해야 한다. runtime fallback은 배포 전 검증을 대신하지 않는다.

## 10. 성능 경계

- 작은 preview iframe은 viewport에 가까워질 때 lazy load한다.
- Dialog iframe은 Dialog가 열릴 때만 mount하고 닫히면 제거할 수 있다.
- 한 화면에서 같은 generated HTML runtime을 불필요하게 두 번 먼저 실행하지 않는다.
- Archify package를 앱 dependency에 추가하지 않으며 Next.js build 중 Archify generation을 수행하지 않는다.
- 현재 한 건의 파일럿은 self-contained HTML 크기를 허용한다.
- 후속으로 여러 스윔레인을 전환할 때는 정적 SVG pipeline과 artifact 중복 비용을 다시 평가한다.

## 11. TDD와 검증 전략

### 단위·렌더링 RED/GREEN

- 대상 스윔레인 한 건만 Archify embed metadata를 가진다.
- 새 탭 label 계약을 제거하고 same-origin HTML URL 계약은 유지한다.
- 대상 preview와 Dialog에서 `ArchifySwimlaneEmbed`이 각각 한 번 사용된다.
- 별도 `Archify로 보기` 링크와 `target="_blank"`가 렌더링되지 않는다.
- preview는 MAP, Dialog는 READ 준비 모드를 사용한다.
- metadata 없는 스윔레인은 기존 React renderer를 유지한다.
- 준비 실패와 timeout은 기존 React renderer로 전환한다.
- 테마 token mapping은 허용된 A1 변수만 전달한다.

### 실제 브라우저

- light/dark에서 iframe node, lane, 정상선과 예외선이 포트폴리오 토큰과 일치한다.
- 작은 보기에서 node 제목과 구조가 보이고 context sublabel·관계 label은 숨겨진다.
- 크게 보기에서 같은 geometry의 sublabel과 의미 있는 관계 label이 보인다.
- iframe toolbar와 Viewer control이 보이지 않고 Tab이나 pointer로 활성화되지 않는다.
- 기존 `크게 보기`의 click·keyboard·mobile tap, Escape close와 focus return이 유지된다.
- 320, 768, 1024, 1440px 작업물에서 document overflow와 카드 경계 침범이 없다.
- artifact가 유효하지 않은 fixture에서는 기존 React fallback이 보인다.
- 다른 구조화 작업물의 기존 스윔레인과 공개 문구가 변경되지 않는다.

### Archify 증거

- 기존 JSON을 다시 작성하지 않고 현재 source hash를 유지한다.
- generated HTML을 직접 수정하지 않고 현재 artifact hash를 유지한다.
- Archify validate·delivery receipt·visual-check와 포트폴리오 production E2E를 별도 증거로 기록한다.
- 실제 작은 보기와 Dialog를 light/dark 및 지원 viewport에서 이미지로 확인한다.

## 12. 범위

### 포함

- 대상 스윔레인 metadata를 새 탭 link에서 embed 계약으로 정리
- 포트폴리오 전용 Archify iframe adapter
- MAP preview와 READ Dialog
- A1 theme bridge
- interaction suppression, 접근성 wrapper와 React fallback
- 관련 단위·렌더링·production E2E 및 이미지 검토
- Feature 011의 후속 결정을 새 기능 명세와 검증 기록에 연결

### 제외

- Archify JSON node·edge·geometry 변경
- generated HTML 직접 수정 또는 Archify renderer 수정
- 다른 작업물 스윔레인의 전환
- 프로젝트·인사이트 공개 문구 변경
- standalone Viewer 자체의 기능 삭제
- 앱 build-time Archify generation
- 정적 SVG export pipeline

## 13. 완료 조건

- 작은 보기와 크게 보기 모두 실제 Archify generated HTML을 사용한다.
- 작은 보기는 MAP, 크게 보기는 READ 밀도로 같은 geometry를 보여준다.
- A1 색상 규칙이 light/dark에서 포트폴리오와 일치한다.
- 별도 Archify 링크와 Viewer 부가 기능이 포트폴리오에 노출되지 않는다.
- 기존 카드·설명·예외·Dialog focus 계약과 다른 스윔레인이 보존된다.
- 실패 시 기존 React renderer가 빈 영역 없이 복구한다.
- source와 artifact hash가 Feature 011 기록과 일치한다.
- scoped automated test, production build, production E2E와 이미지 검토가 모두 통과한다.
- 이 파일럿의 화면을 사용자가 다시 확인하기 전에는 다른 스윔레인을 전환하지 않는다.

## 14. 후속 판단

사용자가 호텔 예약 시스템의 작은 보기와 크게 보기를 확인한 뒤 다음 중 하나를 별도 결정한다.

- 현재 iframe 방식을 다른 스윔레인에도 점진 적용
- 여러 artifact의 runtime 비용을 줄이기 위한 정적 SVG pipeline 설계
- Archify 적용 범위를 유지하고 기존 React renderer를 병행

이번 기능은 다른 스윔레인의 자동 전환이나 기존 React renderer 제거를 승인하지 않는다.
