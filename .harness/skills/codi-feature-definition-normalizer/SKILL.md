---
name: codi-feature-definition-normalizer
description: Use this whenever an external or irregular feature-definition source must be converted into the Codi harness feature-definition schema. Trigger for CSV, Markdown, HTML, pasted spreadsheet tables, Excel exports, loose product notes, legacy service-definition files, or Korean requests such as "이 문서로 기능정의서 만들어줘", "기능정의 정규화", "외부 문서 기능정의로 변환". Do not use when authoring definitions from scratch with no source document (use codi-feature-definition-authoring) or for build/sync/status operations (use codi-feature-hub).
---

# Codi Feature Definition Normalizer

Normalize external feature-definition material into a stable Codi feature-definition
model. This skill exists for import/cleanup work. It is not the default path for
features that originate inside this harness.

## When To Use

Use this skill when the input is external, irregular, or legacy:

- CSV, TSV, Excel export, copied spreadsheet table, or pasted table text.
- Markdown tables or narrative Markdown requirements.
- HTML service-definition pages, generated HTML, or static pages with embedded data.
- Loose product notes, meeting notes, or mixed Korean/English requirements that need
  to become a feature-definition list.
- A user asks to "make a feature definition", "normalize feature definitions",
  "convert this document into the feature-definition sheet", or similar.

Do not use this skill when the user is authoring a new feature definition from
scratch with no source document — that is the `codi-feature-definition-authoring`
entrance. When the work is implementation rather than definition, seed Spec Kit
(`speckit-specify`) with the same feature ID and let `specs/<NNN>/status.yaml`
feed the feature hub.

## Relationship To The Other Feature Skills

- `codi-feature-definition-normalizer` (this skill) — import entrance: converts
  external material into the planning contract.
- `codi-feature-definition-authoring` — authoring entrance: creates the same
  contract from scratch. Its SKILL.md holds the canonical catalog/detail field
  contract; this skill reuses that contract for its final output.
- `codi-feature-hub` — operations: renders the page set, reconciles, gates
  merges, and moves feature status. After normalization, use its commands such
  as `mise run docs:build` and `mise run feature:status:sync`.

## Canonical Output Contract

산출은 카탈로그 단일 계약이다(012에서 legacy 행 산출 은퇴). legacy 21필드
행 모델은 **입력 호환 참조**로만 남는다 — 외부/기존 파일을 읽을 때의
필드 대응표이지, 새로 만들어내는 산출물이 아니다.

**Layer 1 — Planning Hub contract (유일한 산출).** The final deliverable is the
FeatureDefinition catalog (`feature-definitions.json`) plus the 11-group
FeatureDetail (`feature-details.json`) in the workspace `planningSource`
directory. The field contract, stable ID rules (`FEAT-*` immutable, never
reused), placement roles (primary/entry/result/support), and the acceptance
requirement are defined once in `codi-feature-definition-authoring`'s SKILL.md —
follow that contract verbatim. Schema sources:
`.harness/config/feature-detail-schema.json`, `sitemap-schema.json`,
`feature-definition-schema.json`.

**legacy row model (입력 호환 참조 — 신규 산출 금지).** 아래 21필드 행
모델은 외부/기존 파일을 해석할 때의 대응표다. `scan-service-definition.mjs`
는 legacy 행을 fail-open으로 계속 수용하지만, 빌드가 `legacy 기능정의 행
N건` 힌트로 카탈로그 변환을 안내한다. 정규화 결과를 legacy 행으로
저장하지 마라 — provenance는 카탈로그 항목과 `Source`/`Source_ID` 필드로
보존한다. 헤더·필드의 진실의 원천은
`.harness/config/feature-definition-schema.json`이다.

Preserve source traceability even when the input is messy: keep original IDs in
`Source_ID`/`Source`, and carry legacy `Phase_Suggestion`/`Status`/
`Decision_Level` as provenance candidates — they never auto-become the new
priority or definition lifecycle.

| Hub Header | Canonical Field | Notes |
|---|---|---|
| Row ID | `Row_ID` | Stable identifier. Generate one only when missing. |
| 기능 | `Title` | Human-readable feature name. |
| Phase | `Phase_Suggestion` | `P1`, `P2`, `P3`, or blank when unknown. |
| 처리/검토 | `Status` + `Decision_Level` | Status and review state stay separate internally. |
| 변경 | `Change_Type` + `Change_Summary` | Short change classification plus one-line summary. |
| 정의 요약 | `Why` | Definition, reason, and expected behavior summary. |
| 연결 화면 | `Used_In` | Screens, flows, admin pages, APIs, or related areas. |
| 운영/정책 체크 | `Admin_Dependency` + `Policy_Dependency` | Operations, admin, permission, legal, data, payment, license checks. |

Use these additional fields when available:

```json
{
  "Row_ID": "",
  "Master_Group": "",
  "Record_Type": "",
  "Function_Type": "",
  "Source_ID": "",
  "Area": "",
  "Title": "",
  "Actor": "",
  "Surface": "",
  "Phase_Suggestion": "",
  "Status": "",
  "Decision_Level": "",
  "Change_Type": "",
  "Change_Target": "",
  "Change_Summary": "",
  "Why": "",
  "Used_In": "",
  "Admin_Dependency": "",
  "Policy_Dependency": "",
  "Decision_Question": "",
  "Source": ""
}
```

## Normalization Workflow

0. **사이트맵 선행 (Step 0 — 화면 구조를 먼저 확정).**
   - 정식 기능정의를 뽑기 전에 소스 문서에서 화면/영역 후보를 추출해
     사이트맵 초안을 사용자에게 제시한다. surface는 `user`(사용자 앱),
     `admin`(관리자/운영), `common`(공통/시스템) 3종을 표준으로 한다.
   - 사용자 확인/수정 후 확정본을 workspace `planningSource`의
     `sitemap.json`으로 저장한다(이 저장소 자체 워크스페이스는
     `data/sitemap.json`, 데모는 `examples/community-app/planning/sitemap.json`).
     스키마 진실의 원천은 `.harness/config/sitemap-schema.json`이다.
   - 확인은 벌크 승인이 아니라 **surface 단위**로 받는다: user/admin/common
     각각의 노드 목록을 따로 제시한다. 기존 사이트맵이 있으면 전체를
     다시 보여주지 말고 **변경분(추가·이동·삭제 노드)만 요약**해
     확인받는다.
   - 이후 각 행의 `Area`를 확정된 노드 `id`(또는 `aliases`)에 맞춰
     정규화한다. 노드와 일치하지 않는 행은 "미배치"로 남고, 빌드가
     비차단 힌트로 알린다.
   - 실제 화면이 있으면 그 화면에 배치한다(여러 surface가 공유하는 실제
     화면이면 `common` surface). 화면이 없는 시스템/API/정책성 기능은
     억지로 배치하지 않고 미배치로 둔다 — 배치를 위해 가짜 화면 노드를
     만들지 않으며, 연결이 필요하면 traceability 관계로 표현한다.
     (`codi-feature-definition-authoring`·빅 가이드와 공통 규칙)
   - 사용자 행위와 관리자 처리가 모두 있는 도메인(예: 신고 접수와 신고
     검토)은 actor별로 기능을 **분리**한다(FEAT-REPORT / FEAT-MODERATION
     패턴). 한 기능을 user와 admin surface에 동시에 배치하지 않는다.
     actor와 surface가 어긋난 배치는 빌드가 `actor-surface 불일치`
     힌트로 알린다.
   - 이 단계는 새 mise 태스크를 만들지 않는다. `mise run docs:build`
     끝의 비차단 힌트(사이트맵 미정의 / 미배치 N건 / 빈 화면 노드 N개)로
     충분하다. 기능정의 중 새 화면이 나오면 같은 `planningSource`의
     `sitemap.json`을 갱신하는 것이 정상 플로우다(반복 허용, 동결 문서 아님).
   - bottom-up(스펙부터 시작)은 사이트맵 없이도 동작한다(fail-open).

1. **Identify the source type.**
   - Prefer structured parsers and tables when possible.
   - For HTML, look for embedded JSON arrays, table rows, headings, and repeated
     detail cards before falling back to prose extraction.
   - For Markdown, parse tables first, then headings and bullet sections.
   - For pasted text, infer row boundaries from IDs, headings, bullets, and repeated
     field labels.

2. **Map columns conservatively.**
   - Keep source terms in `Source` or `Source_ID` when mapping is uncertain.
   - Do not invent policy, operation, or phase details. Leave unknown fields blank
     and add a `Decision_Question`.
   - Split combined fields only when the boundary is clear. For example, a value
     like `개정반영 / 확정` maps to `Status=개정반영`,
     `Decision_Level=확정`.

3. **Create stable row IDs.**
   - Preserve existing IDs such as `ADD-U2-009`, `A2-01`, or `SRC-*`.
   - If no ID exists, generate a deterministic ID from the area and order, such as
     `IMP-U2-001` or `IMP-GEN-001`.
   - Do not reuse the same `Row_ID` for different meanings. If a row splits into
     multiple features, suffix with `-A`, `-B`, etc.

4. **Normalize status and phase.**
   - `Phase_Suggestion`: use explicit `P1/P2/P3` if present. Otherwise infer only
     from strong cues and explain the inference.
   - `Status`: examples include `원본기록`, `개정반영`, `범위결정`, `보류`.
   - `Decision_Level`: examples include `확정`, `검토메모`, `우선결정`,
     `보류검토`.

5. **Preserve detail.**
   - Put the concise feature definition in `Why`.
   - Put screen, flow, admin, API, or sitemap links in `Used_In`.
   - Put admin/operator dependencies in `Admin_Dependency`.
   - Put policy, license, permission, data, privacy, payment, or contract checks in
     `Policy_Dependency`.
   - Put unresolved questions in `Decision_Question`.

6. **Validate before handoff.**
   - Read `.harness/config/feature-definition-schema.json` and validate against
     its `requiredFields`, `contentFallbackFields`, `canonicalFields`, and
     `hubTableColumns`.
   - Check for duplicate `Row_ID`.
   - Check that every row has at least `Row_ID`, `Title`, and one of `Why`,
     `Change_Summary`, or `Used_In`.
   - Report unmapped source columns and low-confidence rows.
   - Keep generated output separate from source files.

## Planning Contract Pipeline

For Planning Hub v1, normalize irregular input through these explicit layers:

1. Source evidence: preserve the original label, location, and confidence.
2. Screen-only sitemap: confirm screens and navigation before assigning features.
3. Feature catalog: create thin comparison records with stable IDs, actor, value,
   priority, owner, and definition lifecycle.
4. Feature detail: create the behavior, states, rules, interfaces, quality,
   acceptance, traceability, and decision groups required for implementation.
5. Planning manifest: compile the complete validated source into an immutable digest.

Never invent a missing state, policy, API, metric, implementation status, or
verification result. Preserve an unknown as an explicit gap with an owner and
resolution condition. Legacy `Phase_Suggestion`, `Status`, and `Decision_Level`
remain provenance/candidates; they do not automatically become the new priority,
definition, delivery, or sync lifecycle.

The manifest is generated output. Normalization may update project-owned planning
source after human review, but it must not write Delivery Evidence, Planning Lock,
Sync Result, or downstream implementation source.

## Recommended Deliverables

For small imports, returning a normalized table in the response is acceptable.
For repository work, write project-owned artifacts rather than changing generated
HTML directly. Target the workspace `planningSource` directory registered in
`data/hub-workspaces.json` (this repository's own workspace uses `data/`):

- `<planningSource>/feature-definitions.json` — Layer-1 카탈로그 (신형).
- `<planningSource>/feature-details.json` — 11그룹 상세. 카탈로그만 만들고
  상세를 비워 두면 Planning Hub가 `정의 불완전`으로 표시한다 — 확인된 정보가
  부족하면 빈 그룹 대신 열린 결정을 남긴다.
- `<planningSource>/sitemap.json` — confirmed sitemap (Step 0 output —
  human-owned; schema: `.harness/config/sitemap-schema.json`).
- `registry.json` only when the rows are intended to seed features that do not yet
  have `specs/<NNN>/`.
- `docs/feature-definition-normalization.md` when decisions, assumptions, or
  unmapped columns need a durable note.

`docs:build` reads `data/feature-definitions.json` (array `[...]` or object
`{ rows: [...] }`) for the document-hub 기능정의서 table and accepts both
legacy rows and Layer-1 catalog entries (the scanner projects catalog entries
to legacy columns). The Planning Hub 기능 정의/기능 현황 화면은 workspace
`planningSource`의 카탈로그+상세를 읽는다. Run `mise run docs:build` after
writing — no adapter or env var is needed. If a source is absent or malformed,
the build still succeeds and reports fail-open hints.

## Response Template

When reporting normalization results, use this concise structure:

```markdown
## Normalized Output
- Source: <file/path/source>
- Rows: <count>
- High-confidence rows: <count>
- Needs review: <count>

## Files Written
- <path> — <purpose>

## Mapping Notes
- <source column> -> <canonical field>

## Review Needed
- <Row_ID>: <question or uncertainty>

## Next Step
- Run `mise run docs:build` or seed `speckit-specify` from selected rows.
```

## Guardrails

- Do not overwrite `docs/index.html`; it is generated by `docs:build`.
- Do not treat normalized rows as final product decisions when source data is
  ambiguous.
- Do not force every row into a Spec Kit feature. Some rows are screen states,
  admin dependencies, policy checks, or source notes.
- Do not auto-transition feature status. Use `feature:status:sync` for hints and
  explicit status commands for changes.
- Do not put project-local import rules under `.harness/skills/` in downstream
  repositories. Downstream customizations belong in `.harness/skills-local/`.
