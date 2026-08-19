# 기능정의서와 Planning Hub 가이드

팀(PM/PL, 디자이너, 프론트, 백)이 같은 기준으로 제품 계획과 구현 현황을 보기
위한 체계. 상세 규칙의 정본은 스킬 3종(`codi-feature-definition-authoring`,
`codi-feature-definition-normalizer`, `codi-feature-hub`)이다.

## 한눈 요약

```sh
mise run docs:build   # 두 생성 페이지를 함께 재생성
```

| 생성 페이지 | 열기 | 내용 |
| --- | --- | --- |
| 문서 허브 | `docs/index.html` | 하네스/프로젝트 Markdown 색인·검색·reader |
| Planning Hub | `docs/planning.html` | 여섯 제품 보기 + `운영·고급` disclosure |

Planning Hub의 여섯 제품 보기: **개요 · 화면 구조 · 기능 정의 · 기능 현황 ·
사용자 흐름 · 추적성**. version/digest·동기화 health·자동화 기록은
`운영·고급`을 열 때만 보인다. 두 HTML은 생성물이므로 직접 수정하지 않는다.

## 스킬 3종 (입구 2 + 운영 1)

| 스킬 | 언제 | 결과물 |
| --- | --- | --- |
| `codi-feature-definition-authoring` | 기능정의서를 처음부터 작성할 때 | 카탈로그 + 11그룹 상세 |
| `codi-feature-definition-normalizer` | 외부 CSV/MD/HTML/레거시 문서를 변환할 때 | 같은 계약으로 수렴 |
| `codi-feature-hub` | 만들어진 원본을 빌드·조정·게이트·상태 전이로 운영할 때 | 생성 페이지, 동기화 판정 |

두 입구는 같은 파일 계약으로 수렴하므로 어느 쪽으로 시작해도 운영은 동일하다.

## 파일 계약

워크스페이스는 `data/hub-workspaces.json`에 등록한다. 각 워크스페이스는
계획 소스(`planningSource`)와 구현 근거 소스(`deliverySource`)를 가진다.
워크스페이스 항목에 `actorClasses: { admin: [...], user: [...] }`를 두면
actor-surface 힌트의 어휘가 기본 목록에 병합 확장된다.

| 파일 (planningSource) | 역할 | 스키마 |
| --- | --- | --- |
| `sitemap.json` | screen-only 화면 구조 (user/admin/common) | `.harness/config/sitemap-schema.json` |
| `feature-definitions.json` | FeatureDefinition 카탈로그 | `.harness/config/feature-definition-schema.json` |
| `feature-details.json` | 11그룹 구현 가능 상세 (acceptance 필수) | `.harness/config/feature-detail-schema.json` |
| `user-flows.json` | actor/goal 사용자 흐름 (선택) | `.harness/config/user-flow-schema.json` |
| `feature-relations.json` | typed 관계 (선택) | `.harness/config/traceability-schema.json` |
| `planning-manifest.json` | 게시용 immutable manifest (컴파일 생성물) | `.harness/config/planning-manifest-schema.json` |

| 파일 (deliverySource) | 역할 |
| --- | --- |
| `delivery-evidence.json` | FeatureWorkItem(구현 작업)과 검증 근거 — 기능 현황 카드의 원본 |
| `planning.lock.json` | 수신한 계획 버전 기록 — `planning:pull`만 교체 |
| `change-proposals.json` | 사람 결정이 필요한 역방향 제안 |

## 정의 ↔ 현황 동기화

연결 고리는 기능 ID(`FEAT-*`) 하나다. 지켜야 할 규약 4가지:

1. **ID 불변** — `FEAT-*`/`WORK-*`/`SCREEN-*`는 바꾸지도 재사용하지도 않는다.
   이름 변경은 `title`만.
2. **상태는 파일로 기록** — 착수/완료/검증 통과는 delivery evidence의
   work item 갱신으로 표현해야 화면과 동기화 판정에 반영된다.
3. **머지 전 `mise run planning:check` 초록 확인** — fail-closed 게이트.
4. **계획 반영은 `mise run planning:pull` 명시 실행** — 자동 반영 없음.
   변경 제안은 쌓이면 사람이 결정한다.

단일 저장소(planning과 구현이 같은 repo)에서는 planning source 수정 후
`mise run planning:publish` → `mise run planning:pull` 두 명령이 왕복의
전부다. publish는 manifest만 재컴파일하고, Lock 교체는 여전히 pull만
할 수 있다(자동 승격 금지 유지). demo 워크스페이스는 id를 명시해야
publish 대상이 된다.

나머지(재생성, drift 감지, 완료 가드, 전이 제안)는 Stop 훅과
`planning:sync`가 자동 처리한다.

**정의-후행(definition-later) 흐름 (011)**: 정의 없이 먼저 구현해도
데이터가 사라지지 않는다. 미등록 `featureDefinitionId`의 work item은
"미등록 기능" 묶음으로 표시되고 빌드/게이트가 개수를 경고(비차단)한다.
`mise run feature:stub`으로 draft 정의를 등록하면 정식 기능 아래로
이동하며, 소급 상세는 열린 결정으로 남는다. spec 쪽에서는
`status.yaml`에 `featureId: "FEAT-*"`를 적어 역방향 연결할 수 있다
(planning 명시 관계가 우선, 충돌은 진단 힌트). deliverySource가 spec
디렉터리인 워크스페이스는 spec 스캔 결과가 delivery 근거로 보충
투영된다(명시 evidence 우선). Stop 훅은 specs 진행 변화 대비 evidence
미갱신을 감지하면 `[workitem-reminder]` 비차단 안내를 낸다.

## 명령 세트

```sh
mise run docs:build            # 두 페이지 재생성 + 비차단 힌트
mise run planning:sync         # 원본 검증 → 근거 수집 → 조정 → 재생성
mise run planning:check        # merge-ready 일관성 게이트 (fail-closed)
mise run planning:publish      # planningSource 컴파일 → manifest 게시
mise run planning:pull         # 검증된 manifest를 Planning Lock에 원자 적용
mise run feature:seed-check "<기능명>"   # 새 기능 이름·ID 중복 확인
mise run feature:stub "<FEAT-ID>" "<제목>"  # 정의-후행 draft 등록 (011)
mise run feature:workitem "<FEAT-ID>" <type> "<제목>"  # explicit 작업 기록
mise run feature:status <id> <state>     # specs 기반 상태 전이
mise run feature:status:sync             # 전이 제안 (--apply는 인접 전이만)
```

## Spec 기반 상태 전이 (specs/ 흐름)

이 절은 Spec(구현 단위) 상태 축이다. Planning Hub 기능 현황 카드는 별개
축인 delivery evidence의 work item(위 파일 계약 표)이며, 두 축은 기능
ID로만 연결된다. done 조건도 축마다 다르다: work item은 acceptance 통과 +
evidence, Spec은 아래 tasks + verification 체크리스트.

`specs/<id>/status.yaml`이 이 축의 원본이다. 상태는
`planned → in-progress → in-review → done` 한 칸씩, `on-hold`는 사유가 필요한
수동 상태. 진행률은 `tasks.md` 체크박스에서 계산하며 저장하지 않는다.
`in-review → done` 제안은 task 전부 완료 + verification 체크 전부 완료 +
열린 결정 0건일 때만 나온다. 기능 작업 마무리 전에 `feature:status:sync`를
실행한다.

## 하네스 자체 카탈로그 (012)

하네스 저장소 자신도 `data/feature-definitions.json` 카탈로그로 기능을
관리한다 — 카탈로그 ID는 spec ID를 재사용하고, harness-internal
워크스페이스는 planning 경로로 로드되며 spec 유래 현황이 투영된다.
상세(11그룹)는 `DEC-HARNESS-DETAIL-BACKFILL` 열린 결정으로 소급 작성한다.

## Legacy 경로 (입력 호환만 — 신규 계약 아님)

- legacy 21필드 행은 2026-07-18(012)부터 신규 작성 계약이 아니다. 기존
  파일은 fail-open으로 계속 읽히지만 빌드가 `legacy 기능정의 행 N건`
  힌트로 카탈로그 변환(normalizer)을 안내한다.
- `registry.json`은 Spec이 아직 없는 기능의 선택적 seed다. 필수가 아니다.
- 명시적 work item이 없는 legacy delivery evidence는 기능당 최대 1개의
  `unspecified` 작업으로 투영된다.

## 더 읽기

- 운영·소유권·자동화 상세: `codi-feature-hub` 스킬
- 작성 계약(카탈로그·11그룹 상세 필드): `codi-feature-definition-authoring` 스킬
- 체계 전체 해설(개념·화면·파일·스키마·용어):
  `docs/feature-definition-planning-hub-guide.md` (하네스 저장소)
- 분리 저장소 인계와 금지 자동화: `docs/planning-hub-handoff.md` (하네스 저장소)
