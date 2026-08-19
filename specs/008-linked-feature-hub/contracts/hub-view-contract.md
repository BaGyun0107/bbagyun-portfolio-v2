# Contract: 기능정의서 v2 View

## Shared state

- `viewMode`: `relation | tree | table | flow`
- search, phase, processing/review filters
- selected screen/feature/flow
- relation과 flow는 일치 기능 0건이어도 entity 자체는 유지한다.

## Relation view

- surface swimlane 안에 sitemap hierarchy node를 표시한다.
- node는 ID, title, feature count, empty/unassigned state를 제공한다.
- 선택 node의 parent/child/cross relation을 강조한다.
- 모든 표시 관계는 키보드 탐색 가능한 관계 목록에 같은 정보가 있어야 한다.

## Tree view

- 007의 기존 sitemap tree + cards 동작을 보존한다.
- 명시적 `appears-on` 관계가 Area fallback보다 우선한다.

## Table view

- 기존 8-column table, 검색, 정렬·필터, 상세 열기를 보존한다.

## Flow view

- flow header: title, actor, goal, health badge.
- step: kind, title, 연결 screen/feature, 조건부 next.
- 시각 순서와 별도로 전체 step/edge 텍스트 목록을 제공한다.

## Feature detail

- catalog summary
- intent/user value
- scenarios and acceptance
- edge cases and requirements
- success criteria
- linked entity/evidence
- delivery evidence
- original spec link

## Empty/error states

- relation 미설정, flow 미설정, 연결 spec 없음, verification 미기록을 서로
  다른 안내 문구로 표시한다.

