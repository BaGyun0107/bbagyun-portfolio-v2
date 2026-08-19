# Quickstart: 007-sitemap-board 검증 가이드

## 전제

- repo 루트, `mise` 사용 가능, Node v24.

## 1. 테스트 (TDD 기준선)

```sh
npm test
```

기대: `feature-hub-scan-sitemap`, `feature-hub-sitemap-merge`,
`feature-hub-render`(보드/토글 케이스 포함) 전부 green.

## 2. 파생 모드 (사이트맵 없음 = 기존 프로젝트 시나리오)

```sh
rm -f data/sitemap.json   # 없는 상태 확인용 (실제로는 원래 없음)
mise run docs:build
```

기대: exit 0, stderr에 `사이트맵 미정의` 힌트. `docs/index.html` 열면
기능정의서 탭 기본 화면이 보드(요약 바 + user/admin 2그룹 파생 트리 +
카드)로 렌더, "표로 보기" 토글 시 기존 8컬럼 표.

## 3. 확정 사이트맵 모드

```sh
cp specs/007-sitemap-board/contracts/sample-sitemap.json data/sitemap.json
mise run docs:build
```

기대: 트리가 surface 3종 구조로 렌더, 0건 노드 회색, Area 불일치 행은
"미배치" + stderr `미배치 N건` 힌트, 빈 노드는 `빈 화면 노드 N개` 힌트.

## 4. 스키마 위반 fail-open

`data/sitemap.json`에 잘못된 surface key를 넣고 `mise run docs:build`
→ exit 0 + 경고 + 파생 모드 렌더.

## 5. UI 수동 확인 (Chrome)

- 요약 바 숫자 클릭 → 필터 적용.
- 트리 노드 클릭 → 우측 카드 범위 축소.
- 카드 클릭 → 기존 상세 화면.
- 표 토글 왕복 → 필터/선택 상태 유지.
- 기존 사이트맵 모달 버튼이 없어야 함.

## 6. 스킬 계약 테스트

normalizer/feature-hub SKILL.md의 0단계·사이트맵 규칙 문구는
`tests/feature-definition-normalizer-skill.test.mjs` 계약 테스트
확장으로 고정한다.
