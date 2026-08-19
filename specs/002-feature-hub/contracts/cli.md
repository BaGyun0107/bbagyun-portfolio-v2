# CLI Contract: docs:build / feature:status / feature:status:sync

이 기능이 사용자(팀원)에게 노출하는 인터페이스는 세 개의 mise 태스크다.

## `mise run docs:build`

**목적**: 역할별 허브 + MD 색인 + 기능 대시보드를 담은 `docs/index.html`을 생성.

**입력**: 없음(인자 없음). 저장소의 `specs/*/status.yaml`, `registry.json`(있으면),
색인 대상 MD 폴더를 읽는다.

**출력**:
- `docs/index.html` 파일 생성/덮어쓰기.
- stdout: 생성 요약(색인 문서 수, 기능 수) + 자동 힌트(전이 제안)가 있으면 함께.
- exit 0: 성공. 색인 폴더가 비어도, 상태 데이터가 없어도 성공(FR-016).
- exit 1: 쓰기 실패 등 회복 불가 오류만.

**불변식**:
- 생성 HTML은 외부 네트워크 참조 0(오프라인 열람 가능).
- 잘못된 status.yaml은 건너뛰고 stderr 경고, 전체 실패로 이어지지 않음.

## `mise run feature:status <id> <state>`

**목적**: 기능 하나의 상태를 명시적으로 전이하고 이력을 남김.

**입력**:
- `<id>`: `specs/` 아래 존재하는 기능 디렉터리명. 없으면 exit 1 + 오류.
- `<state>`: `planned` | `in-progress` | `in-review` | `done` | `on-hold` 중 하나.
- (태스크가 주입) 현재 날짜 `YYYY-MM-DD` — 스크립트는 시각을 직접 읽지 않음(결정성).

**동작**:
- 유효 전이면 `specs/<id>/status.yaml`의 `status`를 갱신하고 `history`에
  `{ at: <날짜>, to: <state> }`를 추가.
- 정의 안 된 점프(예: planned→done)는 거부(exit 1) + 안내. `--force`가 있으면 경고 후 허용.
- 역방향은 경고하되 허용.

**출력**:
- stdout: 전이 결과(`003: in-progress → in-review`).
- 전이 후 자동 힌트가 있으면 출력(차단 아님).
- exit 0: 전이 성공. exit 1: 존재하지 않는 id / 잘못된 state / 거부된 점프.

## `mise run feature:status:sync [--apply] [--id <id>]`

**목적**: Codex/Claude 작업자가 수동 전이를 잊어도 repo 상태와 기능 현황 상태의 차이를
확인하고, 안전한 인접 정방향 전이를 명시적으로 적용한다.

**입력**:
- 기본 인자 없음: 전체 `specs/*/status.yaml` 점검.
- `--id <id>` 또는 `--id=<id>`: `--apply` 적용 대상을 특정 기능으로 제한.
- `--apply`: check-only가 아니라 `status.yaml`을 수정하고 `history`를 남긴다.

**동작**:
- 기본 모드는 파일을 수정하지 않고 제안만 출력한다.
- `planned` + 완료된 task 일부 존재 → `in-progress` 제안.
- `in-progress` + 모든 task 완료 → `in-review` 제안.
- `in-review` + 신선한 e2e 증거 → `done` 제안.
- `on-hold`는 자동 제안/적용하지 않는다.
- `status.yaml`이 없는 spec 디렉터리는 기능 현황 대상에서 제외됨을 경고한다.

**출력**:
- stdout: 전이 제안 또는 적용 결과.
- stderr: 누락 `status.yaml`, 잘못된 상태 파일 경고.
- exit 0: 제안 없음/제안 있음/적용 성공. exit 1: `--apply`에 필요한 날짜 주입 누락 등 실행 오류.

## 자동 힌트 계약 (비차단, FR-010)

`docs:build`와 `feature:status` 실행 끝에 각 기능을 점검해 stdout에 제안만 출력:

- 조건 A: `tasks.md` 전부 `[x]` && `status == in-progress` → "▸ <id>: 작업 완료됨.
  in-review로 전이하려면 `mise run feature:status <id> in-review`".
- 조건 B: `.harness/state/e2e-last-run` 존재 && 해당 spec 경로가 그 이후 미변경 &&
  `status == in-review` → "▸ <id>: e2e 증거 신선함. done으로 전이 제안".

힌트는 **출력만**, 어떤 파일도 자동 변경하지 않고 exit code에 영향 없음.
