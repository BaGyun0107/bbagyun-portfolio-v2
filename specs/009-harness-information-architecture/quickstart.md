# Quickstart: canonical information architecture

## 1. 정본 편집 순서

1. `research.md`의 evidence decision을 확인한다.
2. 실제 화면 계층은 `data/sitemap.json`에만 편집한다.
3. need/feature/screen/spec/verification 연결은 `data/feature-relations.json`에 편집한다.
4. 목표 행동·결정·종료 과정은 `data/user-flows.json`에 편집한다.
5. inferred relation은 label과 evidence에 PM/PL 재검토 상태를 남긴다.
6. 근거가 없는 question은 정본에 추가하지 않는다.

## 2. Focused validation

```bash
node --test tests/feature-hub-canonical-data.test.mjs
```

기대 결과: actual sitemap 17개 node, feature 9개 coverage, relation 64개,
flow 3개와 canonical model health 0건.

## 3. 전체 자동 검증

```bash
node --test --test-reporter=dot tests/*.test.mjs
node .harness/scripts/checks/rule-check.mjs
mise run docs:build
mise run feature:status:sync
```

`feature:status:sync --apply`는 결정적인 인접 전이만 적용할 때 사용한다.
ambiguous 또는 on-hold 항목은 자동 적용하지 않는다.

## 4. 브라우저 검증

`docs/index.html`을 Chromium에서 열어 다음을 확인한다.

- relation/tree/table/flow/detail 전환과 stable ID 일치
- 기능 9개와 실제 사이트맵 17개 node 탐색
- source/evidence 상세와 inferred label
- 키보드만으로 view 전환·선택·상세 탐색
- 375×812에서 수평 overflow 0, console error 0

## 5. 수정 금지 범위

- `specs/007-sitemap-board/contracts/sample-sitemap.json`
- `tests/fixtures/feature-hub/*.json`
- `.harness/config/*-schema.json`
- `.harness/scripts/docs/lib/*.mjs`

builder가 `data/`를 다시 쓰게 만들지 않는다.
