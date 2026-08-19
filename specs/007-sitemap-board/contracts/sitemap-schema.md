# Contract: 사이트맵 스키마와 빌드 인터페이스

## 1. `.harness/config/sitemap-schema.json` (신설, 진실의 원천)

`feature-definition-schema.json`과 같은 지위. 사이트맵 필드/규칙이
바뀌면 이 파일을 먼저 수정하고 스캐너/렌더러/스킬이 따라간다.
필드 정의는 [data-model.md](../data-model.md) 참조.

## 2. `data/sitemap.json` (프로젝트 소유 입력)

- 사람이 소유. `docs:build`가 읽기만 한다(쓰지 않음).
- 부재/파싱 실패/스키마 위반 → 경고 후 파생 모드 (fail-open, 빌드
  exit 0 유지).

## 3. `scan-sitemap.mjs` 모듈 계약

```
scanSitemap(root) -> { sitemap: Sitemap|null, warnings: string[] }
```

- `sitemap === null`이면 파생 모드. warnings는 stderr 힌트로 출력.
- 검증: 필수 키, surface key 표준값, node id 전역 유일, alias 충돌
  (경고 + 선선언 우선, D1).

## 4. merge 계약 (기존 확장)

```
mergeSitemap(sitemap|null, rows) ->
  { surfaces: [...노드+배치행수+행목록], unassigned: rows[] }
```

- 파생 모드: `sitemapGroups()` 기반 user/admin 2그룹, unassigned 없음.

## 5. `docs:build` stderr 힌트 (비차단)

- `▸ 사이트맵 미정의 — 기능 행에서 파생 렌더 중 (data/sitemap.json)`
- `▸ 미배치 기능정의 N건 — 사이트맵 노드와 Area 불일치`
- `▸ 빈 화면 노드 N개 — 기능정의가 없는 화면`

## 6. 허브 UI 계약 (렌더 산출물 마크업 존재 보장)

- 기본 화면: 요약 바(`data-summary-*`), 트리(`data-sitemap-node`),
  화면별 카드 섹션, 카드 클릭 → 기존 상세 재사용.
- `표로 보기` 토글: 기존 8컬럼 표 렌더 유지, 필터 상태 공유.
- 기존 사이트맵 모달 마크업(`sitemapModal`) 제거.

## 7. 스킬 계약

- normalizer SKILL.md: Workflow 맨 앞 0단계(초안 제시 → 사용자 확인 →
  저장 → Area 정규화). 산출물 목록에 `data/sitemap.json` 추가.
- feature-hub SKILL.md: sitemap 진실의 원천/소유권 규칙, 파생 모드
  설명, 힌트 3종 문서화.
