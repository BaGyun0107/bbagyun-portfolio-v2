# Phase 1 Data Model: 기능 허브 + 기능정의 상태 flow

## Entity: Feature Status (`specs/<NNN>/status.yaml`)

기능 하나의 진실의 원천. 평면 YAML 서브셋(D1).

| 필드 | 타입 | 필수 | 값/제약 |
|---|---|---|---|
| `id` | string | ✅ | `specs/` 디렉터리명과 동일 (예: `002-feature-hub`) |
| `title` | string | ✅ | 사람이 읽는 제목 |
| `phase` | enum | ✅ | `P1` \| `P2` \| `P3` |
| `status` | enum | ✅ | `planned` \| `in-progress` \| `in-review` \| `done` \| `on-hold` |
| `decision_level` | enum | ✅ | `확정` \| `검토중` \| `우선결정` \| `보류검토` |
| `owner_roles` | list<enum> | ✅ | `pm` \| `designer` \| `frontend` \| `backend` (복수) |
| `surface` | enum | ✅ | `UserApp` \| `Admin` \| `둘다` |
| `depends_on` | list<string> | ⬜ | 다른 기능 `id`들 (없으면 빈 리스트) |
| `history` | list<record> | ✅ | 전이 이력. 각 항목 `{ at: YYYY-MM-DD, to: <status> }` |

**검증 규칙**:
- 필수 필드 누락 또는 enum 밖 값 → 생성기가 해당 기능을 건너뛰고 경고(FR-016).
- `owner_roles`가 빈 리스트면 경고하되 표시는 유지("담당 미정").
- `id`가 실제 디렉터리명과 다르면 경고.

**진행률(파생, 저장 안 함)**: `specs/<id>/tasks.md`의 `- [ ]` / `- [x]` 라인을 세어
`완료/전체`로 계산. tasks.md 없으면 "작업 미정".

### 상태 전이 (State Machine)

```text
planned ──▶ in-progress ──▶ in-review ──▶ done
   │             │              │            │
   └─────────────┴──────────────┴────────────┴──▶ on-hold  (어디서든)

on-hold ──▶ (복귀는 직전 유효 상태로; 커맨드가 대상 상태를 명시)
```

- 유효 정방향: `planned→in-progress→in-review→done` 인접 단계만.
- `on-hold`: 어느 상태에서든 진입 가능. 복귀는 명시적 대상 지정.
- 역방향(예: `done→planned`): 경고 후 허용(되돌리기 필요 가능, FR-009).
- 정의 안 된 점프(예: `planned→done`): 거부 또는 경고(D: 거부, `--force` 없으면 막음).

## Entity: Registry Entry (`registry.json` 의 `features[]`)

아직 spec 없는 기능 + 담당 시드. 선택적(FR-013).

| 필드 | 타입 | 필수 | 값/제약 |
|---|---|---|---|
| `id` | string | ✅ | 미래 spec 디렉터리명 예상값 |
| `title` | string | ✅ | 제목 |
| `phase` | enum | ✅ | `P1` \| `P2` \| `P3` |
| `status` | enum | ✅ | Feature Status와 동일 enum (보통 `planned`) |
| `owner_roles` | list<enum> | ⬜ | 역할 4종 |
| `surface` | enum | ⬜ | `UserApp` \| `Admin` \| `둘다` |
| `spec_link` | string\|null | ✅ | spec 생기면 `specs/<id>` 경로, 없으면 `null` |

**최상위**: `{ "generated_at": null, "features": [...] }`. `generated_at`은 생성기가
스탬프할 수 있으나 결정성을 위해 기본 `null`.

## Entity: Doc Index Entry (파생, 저장 안 함)

색인 시점에 생성기가 만든다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `path` | string | 저장소 루트 기준 상대 경로 |
| `href` | string | `docs/index.html` 기준 상대 링크(URL 인코딩) |
| `title` | string | 파일 내 첫 `# 제목`, 없으면 파일명 |
| `category` | string | 경로 접두어 기반 분류(D3) |
| `snippet` | string | 코드블록/마크다운 기호 제거 후 ~260자 발췌 |

## Entity: Role (고정 enum)

`pm` | `designer` | `frontend` | `backend`. QA는 역할 아님 — `in-review` 상태로 표현.

## 병합 규칙 (Merge, FR-012~015)

`scan-specs` 결과(spec 있는 기능) + `registry.json`(선택) →

1. 같은 `id`가 양쪽에 있으면 **spec 우선**. registry 항목의 `spec_link`를 `specs/<id>`로
   자동 채움. status/phase 등은 spec 값 사용.
2. registry에만 있고 spec 없음 → 그대로 표시(보통 `planned`, `spec_link: null`).
3. spec에만 있고 registry에 없음 → 그대로 표시(bottom-up 생성 기능).
4. 결과는 `id` 기준 정렬된 단일 배열 → 대시보드 데이터.
