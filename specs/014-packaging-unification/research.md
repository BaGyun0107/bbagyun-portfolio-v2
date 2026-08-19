# Phase 0 Research: 패키징 단일화

**Feature**: 014-packaging-unification
**Date**: 2026-07-30

조사는 모두 이 저장소의 현재 코드를 직접 읽어 수행했다. 아래 줄 번호는
2026-07-30 시점 기준이다.

## R1. `install` 이 실제로 하는 일 — 제거 불가 판정

**Decision**: `install` 을 제거하지 않는다. `bootstrap` 이 계속 위임하고,
사용자 노출만 줄인다.

**Rationale**: `install.sh` 의 책임은 네 가지이며 어느 것도 copy 모드 전용이
아니다.

| 책임 | 구현 | lock 모드에서도 필요? |
|---|---|---|
| lock 동기화 선행 | `harness:68-70` 가 `pkg-sync.sh` 호출 | 필요 |
| 병합 스킬 트리 | `build_merged_skill_trees` → `.claude/skills`, `.agents/skills` | 필요 |
| vendor → `.specify` 배치 | `place-speckit-assets.sh` | 필요 |
| GStack clone | `install.sh` 후반 | 필요 |

`install` 을 지우면 스킬 트리와 `.specify` 자산이 생성되지 않는다. 즉 축소
대상은 "명령의 존재" 가 아니라 "사용자가 알아야 할 명령의 수" 다 (FR-004).

**Alternatives considered**:
- `install` 내용을 `bootstrap` 에 인라인: 단일 파일이 비대해지고, 문제 진단
  시 단계별 재실행이 불가능해진다. 기각.
- `install` 을 `pkg-sync` 에 흡수: 스킬 트리·vendor 배치는 lock 동기화와
  성격이 다르다(패키지 수신이 아니라 로컬 파생물 생성). 책임이 섞인다. 기각.

## R2. copy 전용 코드 경로의 실제 범위

**Decision**: copy 전용은 `update.sh` 의 `apply-harness` 모드와 그것이
호출하는 두 보조 스크립트로 한정된다. 이번 범위에서는 경고만 추가한다.

**Rationale**: 조사 결과 copy 전제 코드는 좁다.

- `update.sh:433` — `MODE = "apply-harness"` 분기가 copy 적용의 본체
- `update.sh:231` — `prune-stale.mjs` (구버전 공유 파일 제거)
- `update.sh:247-250` — `restore-missing-shared.mjs` (누락 공유 파일 복원)
- `update-check.sh:197-202` — `prune-stale.mjs` 를 확인 용도로 재사용

lock 모드에서는 이 경로들이 이미 무력화되어 있다(`pkg-legacy-guard` 테스트가
lock 모드 조기 종료를 고정). 따라서 제거는 "죽은 분기 삭제" 에 가깝고, 위험은
미전환 레포가 남아 있을 때뿐이다 — 그래서 예고를 먼저 넣는다 (FR-006).

**Alternatives considered**:
- 지금 바로 제거: 미전환 레포(예: codi-crawling)가 갱신 수단을 잃는다. 기각.
- 경고 없이 조용히 유지: 사용자가 전환 필요성을 인지할 계기가 없다. 기각.

## R3. `init-project` 의 `migrate --fresh` 필요성

**Decision**: `migrate --fresh` 호출(`init-project.sh:589`)은 유지하되, 실패
시 경고 처리를 지금처럼 둔다. 이번 범위에서 제거하지 않는다.

**Rationale**: 신규 프로젝트는 하네스 clone 에서 출발하므로 `.harness/**` 실
파일 사본이 실재한다. `--fresh` 는 그 사본을 지우고 링크 구조로 바꾸는
단계이며, "복사본이 없으니 불필요" 하다는 최초 가정은 틀렸다 —
`makeLegacyDownstream` 픽스처가 아니라 실제 clone 이 입력이기 때문이다.

FR-013 이 요구하는 "복사본을 만들었다가 제거하는 중간 단계 없음" 은
`init-project` 가 clone 대신 패키지에서 직접 배선하도록 바꿔야 충족되며,
그것은 `init-project` 전면 재작성이다. 이번 범위 밖으로 분리하고 FR-013 은
후속 작업으로 남긴다.

**Alternatives considered**:
- `--fresh` 를 지금 제거: 신규 프로젝트에 실파일 사본이 그대로 남아 혼합
  상태가 된다. 기각 (근거: `materialize.sh:34` 의 "실파일이라 보존합니다" 경고
  경로).

## R4. `bootstrap` 멱등성의 현재 수준

**Decision**: 단계 구성(7단계)을 유지하고, 스킵 판정이 없는 단계에만 판정을
추가한다.

**Rationale**: 실측으로 확인한 현재 상태 —

| 단계 | 스킵 판정 | 비고 |
|---|---|---|
| 1 OS 확인 | 해당 없음 | 즉시 |
| 2 Xcode CLT | 있음 (`xcode-select -p`) | |
| 3 mise 설치 | 있음 (`command -v mise`) | |
| 4 `mise install` | **없음** | 매번 실행 (변경 없으면 빠름) |
| 5 GitHub 인증 | 있음 (`gh auth status`) | |
| 6 하네스 설치 | 부분 | `install` 내부는 대체로 멱등 |
| 7 doctor | 해당 없음 | 검증이므로 매번 |

즉 대부분 이미 멱등이다. 하루 1회 빈도(Assumptions)에서는 4단계를
그대로 두어도 체감 비용이 낮고, 도구 버전 드리프트를 잡아주는 이점이 있다.
FR-018 은 "이미 갖춰진 단계를 다시 수행하지 않는다" 를 요구하므로 4단계에
변경 없음 판정을 넣거나, 없으면 그 사유를 기록한다.

**Alternatives considered**:
- 4단계에 캐시 기반 스킵: `mise install` 자체가 이미 설치된 도구를 건너뛴다.
  별도 캐시는 이중 관리이며 드리프트 위험. 기각.

## R5. 결과 요약(FR-017)에 필요한 데이터의 출처

**Decision**: 요약은 `bootstrap` 이 직접 계산하지 않고, 하위 단계가 남긴
결과를 모아 출력한다.

**Rationale**: 필요한 세 가지 데이터의 출처가 이미 존재한다.

- **버전 변화**: `pkg-sync` 가 `CURRENT` 와 `TARGET` 을 알고 있다
  (`pkg-sync.sh:18-21, 47-60`). 현재는 "버전 X 이(가) 최신입니다" 만 출력.
- **정리된 잔재 건수**: `reclaim-shared.sh` 가 이미 건수를 출력한다.
- **조치 필요 항목**: `doctor` 가 fail/warn 을 집계한다.

따라서 각 단계가 기계 판독 가능한 형태로 결과를 남기고 `bootstrap` 이
마지막에 취합하는 구조가 자연스럽다. 단계별 출력 파싱은 취약하므로 상태
파일(`.harness/state/`)을 경유한다 — 이미 `current-size`,
`touches-user-flow`, `e2e-last-run` 이 같은 패턴을 쓴다.

**Alternatives considered**:
- `bootstrap` 이 stdout 을 파싱: 문구가 바뀌면 조용히 깨진다. 기각.
- 각 단계가 직접 요약을 출력: 7단계가 각자 떠들면 요약이 아니다. 기각.

## R6. 도움말 분할(FR-004)의 경계

**Decision**: 기본 도움말에는 일상 명령만, 나머지는 `--all` 로 노출한다.
일상 명령은 `bootstrap`, `doctor`, `codex`, `claude` 네 개.

**Rationale**: 현재 도움말은 24개를 평면 나열한다(`harness:161-198`).
사용 빈도로 나누면:

- **일상**: `bootstrap`(준비/갱신), `doctor`(상태 확인), `codex`/`claude`(에이전트 시작)
- **점검**: `context-check`, `rule-check`, `secret-surface-check`,
  `package-policy-check`, `workflow-check`, `codex-replay-check`
- **패키지 관리**: `install`, `update`, `pin`, `pkg-sync`, `pkg-gc`, `migrate`,
  `update-check`
- **레포 운영**: `release`, `manifest`, `skills-link`, `init-project`,
  `prune-downstream`, `wire-infisical`, `speckit-vendor`, `profile`, `role`,
  `notify-decision`

`--all` 은 전체를 그룹 제목과 함께 보여준다. 기본에서 빠진 명령도 계속
동작하므로 기존 스크립트·문서 링크가 깨지지 않는다.

**Alternatives considered**:
- 기본에 그룹 제목만 추가하고 24개 유지: 소음이 그대로다. 기각.
- 고급 명령 실행 시 안내 문구 추가: 매 실행마다 노이즈. 기각(Q4에서 사용자가
  B 선택).

