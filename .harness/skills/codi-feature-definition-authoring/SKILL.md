---
name: codi-feature-definition-authoring
description: Use when creating feature definitions from scratch inside the harness planning structure (top-down authoring). Trigger for Korean requests such as "기능정의서 새로 작성", "기능정의 처음부터 만들기", "새 기능 정의 추가", "카탈로그에 기능 추가", or when a product idea must become a FeatureDefinition catalog entry plus an 11-group FeatureDetail. Do not use for converting external/legacy documents (use codi-feature-definition-normalizer) or for build/sync/status operations (use codi-feature-hub).
---

# Codi Feature Definition Authoring

Author new feature definitions directly into the Planning Hub source contract:
a screen-only sitemap, a thin FeatureDefinition catalog, and an implementable
11-group FeatureDetail — all connected by one stable feature ID.

## Position Among The Three Skills

- `codi-feature-definition-normalizer` — import entrance: converts external or
  irregular material into this same contract.
- `codi-feature-definition-authoring` (this skill) — authoring entrance: creates
  the contract files from scratch.
- `codi-feature-hub` — operations: builds pages, reconciles, gates merges, and
  moves feature status. Both entrances converge on the same files, so operations
  are identical afterward.

## File Contract (where output goes)

The target directory is the workspace `planningSource` registered in
`data/hub-workspaces.json`. For this repository's own workspace that is `data/`;
for the demo it is `examples/community-app/planning/`.

| File | Role | Schema source of truth |
| --- | --- | --- |
| `sitemap.json` | screen-only 화면 구조 (surfaces: user/admin/common) | `.harness/config/sitemap-schema.json` |
| `feature-definitions.json` | FeatureDefinition 카탈로그 (얇은 비교 레코드) | `.harness/config/feature-definition-schema.json` + 아래 카탈로그 계약 |
| `feature-details.json` | 11그룹 FeatureDetail (구현 가능한 상세) | `.harness/config/feature-detail-schema.json` |
| `user-flows.json` (선택) | actor/goal 흐름 | `.harness/config/user-flow-schema.json` |
| `feature-relations.json` (선택) | typed 관계 (appears-on, specified-by 등) | `.harness/config/traceability-schema.json` |
| `needs.json`, `decisions.json` (선택) | 요구와 열린 결정 | `.harness/config/planning-manifest-schema.json` 참조 |

All of these are human-owned planning source. Never edit generated
`docs/index.html`/`docs/planning.html`, Delivery Evidence, Planning Lock, or
Sync Result from this skill.

## Stable ID Rules (동기화의 근간)

- Feature ID (`FEAT-*`)는 불변이다. 한번 게시된 ID는 이름이 바뀌어도 유지하고,
  삭제된 ID는 다른 의미로 재사용하지 않는다. 이름 변경은 `title`만 바꾼다.
- 새 ID를 만들기 전에 `mise run feature:seed-check "<기능명>"`으로 중복을
  확인한다(기능명 유사 행과 ID 일치 행을 함께 찾는다 — `FEAT-*` ID를
  검색어로 넣으면 ID 중복도 잡힌다).
- Screen ID(`SCREEN-*`), Flow ID(`FLOW-*`), Need ID(`NEED-*`)도 같은 불변
  규칙을 따른다. 기능 현황·추적성·동기화가 전부 이 ID로 연결된다.

## Catalog Entry Contract (`feature-definitions.json`)

One JSON array. Each entry:

```json
{
  "id": "FEAT-POST-CREATE",
  "title": "게시물 작성",
  "summary": "게시물을 작성하고 발행한다.",
  "actor": "member",
  "priority": "P1",
  "owner": "product",
  "definitionStatus": "approved",
  "featureGroupId": "GROUP-CONTENT",
  "targetReleaseId": "R1",
  "placements": [{ "screenId": "SCREEN-CREATE", "role": "primary" }],
  "screenIds": ["SCREEN-CREATE"],
  "needIds": ["NEED-1"],
  "flowIds": ["FLOW-PUBLISH"],
  "detailId": "FEAT-POST-CREATE",
  "lastReviewedAt": "2026-07-17"
}
```

- `placements[].role`은 `primary`/`entry`/`result`/`support` 중 하나다.
  사용자에게 노출되는 기능은 정확히 하나의 `primary` placement를 가진다.
- 실제 화면이 있으면 그 화면에 배치한다(여러 surface가 공유하는 실제
  화면이면 `common` surface). 화면이 없는 시스템·정책 기능은 억지로
  배치하지 않고 미배치로 둔다(빌드가 힌트로 알린다) — 배치를 위해 가짜
  화면 노드를 만들지 않으며, 연결이 필요하면 traceability 관계로 표현한다.
- 사용자 행위와 관리자 처리가 모두 있는 도메인(예: 신고 접수와 신고
  검토)은 actor별로 기능을 분리한다(FEAT-REPORT / FEAT-MODERATION 패턴).
  한 기능을 user와 admin surface에 동시에 배치하지 않는다. actor와
  surface가 어긋나면 빌드가 `actor-surface 불일치` 힌트로 알린다.
- `priority`(P1/P2/P3)는 우선순위일 뿐 정의 lifecycle·구현 상태·동기화 상태와
  다른 축이다. 서로 바꿔 쓰지 않는다.
- Release는 카탈로그의 `targetReleaseId`(계획 의도)까지만이다. 저장소 위치나
  구현 상태를 카탈로그에 저장하지 않는다 — 그것은 FeatureWorkItem 소유다.
- `screenIds`는 legacy 호환 미러다. `placements`와 같은 화면 집합을 유지한다.

## Detail Contract (`feature-details.json`, 11 groups)

Each catalog entry needs a matching detail (`id` = catalog `detailId`).
Required groups — write every group or record a reasoned exemption:

1. `intent` — problem, actor, goal, outcome, evidence.
2. `scope` — inScope, nonGoals.
3. `behavior` — trigger, preconditions, happyPath, alternativePaths, failures,
   postconditions.
4. `states` — processing, emptyOrNoInput, errorRetry, permissionDenied. 적용
   불가한 상태는 비우지 말고 사유를 적는다(예: "백그라운드 작업이라 화면 상태
   없음").
5. `rules` — 정책·제약 목록.
6. `interfaces` — inputs, outputs, integrations.
7. `quality` — 접근성·성능·보안 요구.
8. `acceptance` — 최소 1개의 측정 가능한 criterion:
   `{ "id": "AC-1", "statement": "...", "metric": "...", "verificationStatus": "pending" }`.
   acceptance가 없는 정의는 완료 판정이 영구히 차단된다(완료 가드).
9. `traceability` — specIds, screenIds 등 연결.
10. `decisions` — 열린 결정은 owner와 해결 조건을 함께 적는다.
11. `definitionStatus`/`owner`/`placements` — 카탈로그와 일치시킨다.

Provenance rules: 모르는 값은 발명하지 않는다. 확인된 사실(confirmed),
추론(inferred), 질문(question)을 구분해 남기고, 불확실한 항목은
`decisions`의 열린 결정으로 만든다.

## Authoring Workflow

1. **사이트맵 먼저.** 새 기능이 새 화면을 만들면 `sitemap.json`에 화면을 먼저
   추가한다(surface: user/admin/common). 화면 ID가 확정돼야 배치를 쓸 수 있다.
   확인은 surface 단위로 받고, 기존 사이트맵 갱신 시에는 변경분(추가·이동·
   삭제 노드)만 요약해 확인받는다.
2. **ID 확정.** `mise run feature:seed-check "<기능명>"`으로 중복 확인 후
   `FEAT-*` ID를 만든다.
3. **카탈로그 항목 작성.** 위 계약대로 `feature-definitions.json`에 추가한다.
4. **상세 작성.** `feature-details.json`에 11그룹을 작성한다. acceptance 없이
   끝내지 않는다.
5. **관계·흐름 연결(선택).** user flow의 step `featureIds`, 관계 원본의
   `appears-on` 링크를 같은 ID로 연결한다.
6. **검증.** `mise run docs:build` 후 힌트(미배치/빈 화면/정의 불완전)를 읽고,
   `mise run planning:check`가 통과하는지 확인한다. Planning Hub의 기능 정의
   화면에서 배치·상세·인수 조건이 보이는지 연다.
7. **게시(선택, 다중 프로젝트 공유 시).** planning manifest가 필요한 경우에만
   컴파일한다. 전용 mise 태스크는 아직 없으므로 짧은 스크립트로
   `compilePlanningDirectory` + `writePlanningManifest`
   (`.harness/scripts/docs/lib/compile-planning-manifest.mjs`)를 호출한다.
   downstream 반영은 반드시 `mise run planning:pull` 명시 실행으로만 한다.

## Connecting To Feature Status (기능 현황과의 연결)

이 스킬은 정의까지만 만든다. Kanban 카드가 되는 구현 작업(FeatureWorkItem)은
프로젝트(구현) 쪽이 소유하며 Delivery Evidence의 `workItems`로 기록된다 —
각 작업의 `featureDefinitionId`가 여기서 만든 `FEAT-*` ID를 가리킨다.
작업 기록 계약과 상태 전이는 `codi-feature-hub` 스킬을 따른다.

## Guardrails

- 생성물(`docs/*.html`)과 Delivery Evidence·Planning Lock·Sync Result를 쓰지
  않는다.
- 구현 상태·검증 결과를 정의에 저장하지 않는다.
- 정의를 고칠 때는 planning source에서만 고친다. 구현에서 발견한 차이는 변경
  제안(Change Proposal) 경로로 올린다.
- downstream 프로젝트에서 이 스킬을 커스터마이즈할 때는
  `.harness/skills-local/`에 별도 스킬을 만든다. `.harness/skills/`는 상위
  저장소 소유다.

## Response Template

```markdown
## 작성 결과
- 대상 워크스페이스: <id> (planningSource: <path>)
- 카탈로그 추가/수정: <N>건 (FEAT-…)
- 상세 작성: <N>건 (acceptance <N>개)
- 사이트맵 변경: <있음/없음>

## 검증
- docs:build 힌트: <요약>
- planning:check: <exit>

## 열린 결정
- <FEAT-…>: <질문 · owner · 해결 조건>

## 다음 단계
- 구현 착수 시 Spec Kit(specify)로 같은 FEAT ID를 시드
- 작업 기록은 codi-feature-hub의 FeatureWorkItem 계약을 따름
```
