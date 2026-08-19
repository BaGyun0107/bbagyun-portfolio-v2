# Verification: 007-sitemap-board

## US1 (T008~T012) — 보드 기본 화면 (파생 모드)

### 자동 검증 (완료)

- `npm test` 전체 379 pass / 0 fail (사이트맵 스캔·매핑·보드 렌더 포함).
- `tests/feature-hub-render.test.mjs`:
  - 요약 바(`definitionSummary`, `data-summary-filter`), 트리
    (`sitemapTree`, `data-sitemap-node`), 화면별 카드(`boardBody`)가
    기본 화면에 렌더됨.
  - "표로 보기" 토글(`definitionViewToggle`) 존재, 표는 초기 숨김.
  - 기존 사이트맵 모달 마크업(`sitemapModal`/`업무용 사이트맵`/
    `definitionAreaButton`) 제거 확인.
- 인라인 클라이언트 스크립트 문법 검증 OK (`new Function` 파싱, 32973자).
- `mise run docs:build` exit 0 — 파생 모드로 `docs/index.html` 생성
  (문서 90 / 기능 6 / 기능정의 6). 생성물에 보드 마커 9개 존재.
  참고: 생성물에 남은 `sitemapModal` 문자열은 index.html이 색인한
  spec/tasks 문서 본문 텍스트이며 실제 UI 마크업이 아님.

### 수동 검증 (quickstart 5절) — 2026-07-18 대체 판정으로 종결

아래 5개는 구 단일 허브 보드 UI의 브라우저 체크였다. 해당 UI는
010(페이지 분리)에서 Planning Hub 화면 구조 보기로 대체되고
012(render-hub.mjs 제거)에서 물리 제거되어, 항목 원문 그대로는 검증
대상이 존재하지 않는다. 대체 화면의 동등 불변식은
`tests/planning-sitemap-render.test.mjs`(구조/트리/표 동일 screen ID,
접근성 트리)와 `tests/planning-feature-workbench-render.test.mjs`
(필터·선택 상태)로 자동 검증된다. 이에 따라 superseded로 체크한다.

- [x] (superseded) 요약 바 숫자 클릭 → 필터 적용
- [x] (superseded) 트리 노드 클릭 → 우측 카드 범위 축소
- [x] (superseded) 카드 클릭 → 기존 상세 화면 열림
- [x] (superseded) "표로 보기" 토글 왕복 → 필터/선택 상태 유지
- [x] (superseded) 0건 노드가 회색으로 구분됨

## US2 (T013~T020) — 확정 모드 + 빌드 힌트 + 스킬

### 자동 검증 (완료)

- `tests/feature-hub-sitemap-build.test.mjs` 3 케이스 pass — 확정
  사이트맵(미배치/빈 노드 힌트 + DATA 주입), 부재(미정의 힌트 + null),
  스키마 위반(경고 + null, fail-open).
- `tests/feature-hub-render.test.mjs` 확정 모드 주입/파생 마커 pass.
- `tests/feature-definition-normalizer-skill.test.mjs` — normalizer
  Step 0 문구, feature-hub 사이트맵 소유권/힌트 규칙 pass.

### 실제 실행 (quickstart 3절)

`data/sitemap.json`에 샘플 사이트맵 배치 후 `mise run docs:build`:

```
▸ 미배치 기능정의 6건 — 사이트맵 노드와 Area 불일치
▸ 빈 화면 노드 5개 — 기능정의가 없는 화면
```

(샘플 노드 id와 이 저장소 기능정의 Area가 다르므로 6건 전부 미배치가
정상 — 힌트가 정확히 계산됨.) 검증 후 임시 사이트맵을 제거하고 파생
모드 복귀를 확인:

```
[docs:build] 사이트맵 미정의 — 기능 행에서 파생 렌더 중 (data/sitemap.json)
```

## US3 (T021~T023) — fail-open 무중단

### 자동 검증 (완료)

- `tests/feature-hub-sitemap-build.test.mjs` fail-open 케이스 — 부재,
  파싱 실패(`{ broken`), 스키마 위반 세 경우 모두 `index.html` 생성
  성공 + `res.sitemap === null`(파생 모드).

### 실제 실행 (quickstart 4절)

US2 절에서 스키마 위반본과 부재 상태로 `mise run docs:build`를 돌려
두 경우 모두 exit 0 + 파생 모드 렌더를 확인함(위 US2 로그 참조).

## Post-review 구현 판단 근거 문서 검증 (T028~T030)

### 문서 무결성

- `implementation-basis.md`의 Markdown 링크를 스캔한 결과 총 24개:
  로컬 링크 11개, 외부 출처 링크 13개(고유 URL 12개), 누락된 로컬
  대상 0개.
- R1~R6의 핵심 주장마다 외부 출처를 인접 배치했고, 현재 저장소에 관한
  E1~E6은 schema, renderer, spec, task, verification, status 등 로컬
  진실의 원천에 연결했다.
- `TBD`, `TODO`, `PLACEHOLDER`는 0건이다. `research.md`의
  `NEEDS CLARIFICATION 0건`은 기존 Phase 0 완료 기록이며 미해결 표시가
  아니다.
- `git diff --check` 통과 — 새 근거 문서와 연결 문서에 공백 오류 없음.

### 생성물과 상태 동기화

- `mise run docs:build` exit 0 — `docs/index.html` 생성 성공
  (문서 92건, 기능 7건, 기능정의 7건).
- 같은 실행에서 `미배치 기능정의 7건`, `빈 화면 노드 5개`가 보고됐다.
  현재 `data/sitemap.json`이 샘플 노드이고 기능 행의 `Area`가 비어 있는
  E3의 관찰과 일치한다. 이는 Gate 0의 D1 결정 전까지 해소하지 않는다.
- `mise run feature:status:sync` exit 0 — 상태 전이 제안 없음.
- 저장소의 기존 미추적 `data/`, `social-media-app-sitemap.png`와 기존
  생성물 변경 `docs/index.html`은 삭제·재해석하지 않았다. 이번 기록은
  `specs/007-sitemap-board/`와 현재 데이터로 재생성된 `docs/index.html`
  에만 영향을 준다.

### 상태 판단

문서 판단 기록(T028~T030)은 완료다. US1 수동 브라우저 체크 5개는
2026-07-18 대체 판정(superseded — 010/012에서 UI 대체·제거, 동등
불변식은 현행 렌더러 테스트로 검증)으로 종결되어 done 근거가 완비됐다.
후속 허브 v2는 008~012에서 별도 Spec Kit 기능으로 구현 완료됐다.
