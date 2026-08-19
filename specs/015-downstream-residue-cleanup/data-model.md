# Data Model: 다운스트림 잔재 정리 완결

## 1. 잔재 분류 (Residue Classes)

판정 정본은 코드 모듈이며, 이 표는 그 계약을 요약한다.

| 클래스 | 판정 기준 | 정본 모듈 | apply 동작 |
|---|---|---|---|
| shared-tracked | manifest ∩ tracked, 또는 SHARED_DIR_ROOTS 하위/자체 | migrate-plan.mjs `computeRemovals` | `git rm --cached` (워킹트리 링크 유지) |
| consumer-link | CONSUMER_LINK_ROOTS 하위 또는 CONSUMER_LINK_PATHS 일치 추적분 | migrate-plan.mjs (신규 export) | `git rm --cached` |
| upstream-state | UPSTREAM_PROJECT_STATE_PATHS (통짜) | upstream-project-state.mjs | 파일 삭제 |
| upstream-copy | specs/·tests/ 이름 일치, docs/audits·data/ 이름+내용 일치 | upstream-project-state.mjs (선별) | 파일 삭제 |
| harness-selfstate | .specify 하네스 참조, README/package.json/lock 하네스 원본 일치 | upstream-project-state.mjs + normalize-root-package.mjs | 리셋/정규화/삭제 (R6·R7). 단 .specify 구분: 벤더 자산(templates/scripts/workflows, 바이트 일치)은 `git rm --cached`만(파일 유지 — install 관리), 하네스 참조 런타임 상태(feature.json 등)와 바이트 일치 constitution은 파일 삭제 |

판정 공통 규칙: 비교 기준은 항상 현재 materialize된 패키지
(`.harness/current/`)에서 읽는다 — 버전과 함께 자동 갱신. 불확실하면 보존
(오삭제보다 잔재).

## 2. 링크 불변식 (Link Invariants)

| 링크 | 대상 | 경로 형태 | git 상태 |
|---|---|---|---|
| `.harness/current` | 머신 캐시 `versions/<v>` | **절대** (유일한 예외) | 비추적 (gitignore) |
| `.harness/{hooks,policies,...}`, `.harness/config/*`, `.claude/rules/shared`, `.codex/*`, 루트 공유 파일 | `.harness/current/...` 경유 리포 내부 | **상대** | 비추적 |
| `.claude/skills/*`, `.agents/skills/*` | `.harness/skills*/<name>` (리포 내부) | **상대** | 비추적 |

상대경로 값 = `path.relative(dirname(link), target)`. 기존 절대 링크는
materialize/skills-link 재실행이 멱등 재작성한다(현재값≠기대값 판정에
반영).

## 3. 플로우별 허용 동작 (Flow Permissions)

| 동작 | 팀원 bootstrap (pkg-sync 경유) | 소유자 prune-downstream --apply |
|---|---|---|
| 버전 수신·materialize·링크 재작성 | 허용 | 허용 |
| gitignore 필수 항목 반영 | 허용 (워킹트리 파일, 인덱스 아님) | 허용 |
| KEEP_COMMITTED 갱신 | 허용 (기존 동작 유지) | 허용 |
| 잔재 보고 (분류별) | 허용 — bootstrap-summary `residue <N>` | 허용 (check 모드) |
| `git rm --cached` / 파일 삭제 / 정규화 | **금지** | 허용 (사용자 승인 후) |
| commit / push / merge | 금지 | 소유자(사람)만 |

## 4. 상태 전이 (레포 단위)

```text
[전환 직후: 잔재 잔존]
  → (owner: pkg-sync 신규 버전) [gitignore 최신 + 잔재 보고]
  → (owner: prune-downstream --apply + commit + push) [clean: 잔재 0]
  → (member: clone + bootstrap) [작업 가능, git status clean]
  → (하네스 새 항목 추가 시) pkg-sync가 gitignore 자동 반영 → clean 유지
```

## 5. 관련 파일 소유권 정리 (이 기능 이후의 정본)

- `docs/audits/**`: 다운스트림 소유 — 단 하네스 사본(이름+내용 일치)은 잔재.
- `README.md`, `package.json`, `package-lock.json`: 다운스트림 소유 — 단
  하네스 원본 그대로면 잔재(정규화 대상).
- `.specify/**`: 벤더 자산은 install 관리(커밋 불필요), 런타임 상태·
  constitution은 프로젝트 소유 — 하네스 참조를 담은 상태만 잔재.
- `bootstrap-summary` 라인 추가: `residue <N>` (0이면 기록하지 않음, 기존
  `reclaimed`/`version` 라인 관례와 동일).

