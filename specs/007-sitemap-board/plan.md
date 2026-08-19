# Implementation Plan: 기능정의서 사이트맵 보드 + 사이트맵 선행 플로우

**Branch**: `007-sitemap-board` | **Date**: 2026-07-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-sitemap-board/spec.md`

## Summary

사이트맵을 독립 산출물(`data/sitemap.json`)로 선행 확정하고, 허브
기능정의서 탭 기본 화면을 사이트맵 보드(요약 바 + 좌측 트리 + 화면별
기능 카드)로 재구성한다. 기존 8컬럼 표는 "표로 보기" 토글 보조 뷰로
유지, 사이트맵 부재 시 행 파생 트리로 fail-open. 설계 확정본:
`설계 초안(2026-07-18 정리 — git history)`.

## Technical Context

**Language/Version**: Node.js v24 (mise 관리), ESM `.mjs`

**Primary Dependencies**: 없음(외부 의존성 0 유지). `docs/index.html`은
단일 파일 생성물, 인라인 CSS/JS.

**Storage**: 파일 — `data/sitemap.json`(사람 소유),
`.harness/config/sitemap-schema.json`(스키마 진실의 원천),
`data/feature-definitions.json`(기존)

**Testing**: `node --test tests/*.test.mjs` (`npm test`), node:test +
assert/strict. TDD — 구현 전 테스트 작성.

**Target Platform**: 로컬 Chrome에서 파일로 여는 정적 HTML + Node 빌드
스크립트(`mise run docs:build`)

**Project Type**: 하네스 내부 도구(빌드 스크립트 + 정적 허브 + 스킬 문서)

**Performance Goals**: 기존 수준 유지 — 수백 행 규모에서 빌드/렌더 지연
체감 없음

**Constraints**: fail-open(사이트맵 부재/손상 시 빌드 성공), 비차단
힌트만(차단 훅 금지), `docs/index.html` 손편집 금지(생성물), 행 스키마
필드 추가 금지(Area 재사용)

**Scale/Scope**: 기능정의 수백 행, 사이트맵 노드 수십 개, 렌더러
~836줄 + CSS 확장, 스킬 문서 2건 갱신

## Constitution Check

`.specify/memory/constitution.md`는 미기입 템플릿 — 프로젝트 고유
게이트 없음. 대신 저장소 규칙을 게이트로 적용한다:

- [x] 생성물(`docs/index.html`) 손편집 없음 — 렌더러만 수정
- [x] fail-open: 새 입력(sitemap.json) 부재/손상이 빌드를 깨지 않음
- [x] 비차단 힌트만 추가, 차단 훅 없음
- [x] 스키마 진실의 원천 규칙 준수: `.harness/config/*-schema.json`
      먼저, 렌더러/스킬은 따라감
- [x] 업스트림 소유 `.harness/skills/` 갱신은 하네스 repo에서만(현재
      repo가 업스트림이므로 적합)
- [x] TDD: 테스트 먼저 (superpowers test-driven-development)

## Project Structure

### Documentation (this feature)

```text
specs/007-sitemap-board/
├── spec.md
├── plan.md              # 이 파일
├── research.md          # Phase 0
├── implementation-basis.md # post-review 후속 구현 판단 근거
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── sitemap-schema.md
└── tasks.md             # /speckit-tasks 산출 (plan에서는 생성 안 함)
```

### Source Code (repository root)

```text
.harness/config/
└── sitemap-schema.json            # 신설 — 사이트맵 스키마 진실의 원천

.harness/scripts/docs/
├── build-hub.mjs                  # scan-sitemap 연결 + 힌트 출력 확장
└── lib/
    ├── scan-sitemap.mjs           # 신설 — 로드 + 검증 + fail-open
    ├── merge-service-definition.mjs  # 노드 매핑/미배치 버킷 확장
    └── render-hub.mjs             # 사이트맵 보드 렌더 + 표 토글

.harness/scripts/docs/templates/
└── hub.css                        # 보드 레이아웃 스타일 확장

.harness/skills/
├── codi-feature-definition-normalizer/SKILL.md  # 0단계 추가
└── codi-feature-hub/SKILL.md                    # sitemap 규칙 추가

tests/
├── feature-hub-scan-sitemap.test.mjs   # 신설 — 스키마/fail-open
├── feature-hub-sitemap-merge.test.mjs  # 신설 — 매핑/미배치/0건
└── feature-hub-render.test.mjs         # 확장 — 보드/토글 스모크
```

**Structure Decision**: 기존 기능 허브 파이프라인(scan → merge →
render)에 사이트맵 스캐너를 추가하는 구조. 신규 디렉터리 없음, 기존
lib 모듈 패턴과 테스트 파일 명명(`feature-hub-*.test.mjs`)을 따른다.

## Post-review Follow-up Boundary

[implementation-basis.md](./implementation-basis.md)는 007 구현 이후의
PM/PL·IA·traceability 조사와 후속 구현 판단을 기록한다. 이 문서에서
권장한 detail aggregation, typed relation contract, 사이트맵 관계도,
user-flow view, delivery intelligence는 현재 plan의 구현 범위가 아니다.

007은 기존 acceptance와 수동 브라우저 검증을 마쳐 `done` 여부를
판단한다. 후속 변경은 implementation-basis의 D1~D6 결정 이후 별도
Spec Kit 기능으로 계획한다.

## Complexity Tracking

위반 없음 — 게이트 전부 통과.
