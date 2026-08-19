# CLI Contracts: 다운스트림 잔재 정리 완결

기존 명령의 계약 확장만 있고 신규 명령은 없다.

## `./harness pkg-sync` (팀원/소유자 공용 — 읽기 전용 강화)

- 기존: lock 해석 → fetch → materialize → keep-committed 갱신 → reclaim.
- 변경:
  1. materialize 직후 `ensure-gitignore.mjs`(ROOT_DIR=레포 루트) 실행.
     stdout의 변경 라인을 그대로 표출하고 bootstrap-summary에
     `gitignore <N>` 라인 기록 (0이면 기록 없음).
  2. reclaim 단계는 **보고 전용**: 잔재 목록을 분류별 건수로 출력하고
     bootstrap-summary에 `residue <N>` 기록. `git rm --cached` 실행 금지.
     잔재 >0이면 소유자 절차 안내 1줄 출력:
     `정리는 소유자가: ./harness prune-downstream 으로 확인 후 --apply`.
- 불변: 오프라인 시 캐시 버전 유지, copy 모드(lock 없음) no-op, 종료 코드
  기존 유지 (잔재 발견은 실패가 아님 — exit 0).

## `./harness prune-downstream [--apply]` (소유자 전용 표면)

- check 모드(기본): 모든 잔재를 분류별로 보고 — 감사 표면(FR-008).
  ```text
  [prune-downstream] check 모드 — 잔재 <N>건:
    shared-tracked (<n>): <path>...
    consumer-link (<n>): <path>...
    upstream-state (<n>): <path>...
    upstream-copy (<n>): <path>...
    harness-selfstate (<n>): <path> (<처리: 삭제|정규화|스텁 교체>)...
  ```
  잔재 0이면 `정리 대상 없음 — 이미 깨끗합니다.` 출력, exit 0.
- `--apply`: 분류별 apply 동작(data-model.md 1절) 실행 후 요약 출력.
  커밋은 하지 않는다 — 마지막 줄에 커밋 안내를 출력한다.
- 가드 불변: 하네스 upstream 레포에서는 실행 거부(exit 2). copy 모드
  (.harness/current 부재)에서는 선별·내용 판정을 건너뛰고 통짜 경로만
  보고(기존 동작 유지).
- 종료 코드: 0 정상(잔재 유무 무관), 2 upstream 거부.

## `materialize.sh` / `skills-link.sh` (링크 생성 계약)

- 생성·재생성하는 리포 내부 링크 값은 상대경로여야 한다
  (data-model.md 2절 불변식). `.harness/current`만 절대경로 허용.
- 멱등: 기대값(상대경로)과 현재값이 다르면 재작성 — 기존 절대 링크는 다음
  실행에서 상대로 수렴한다.
- 실파일 보존 규칙(기존): 링크 자리에 실파일/비어있지 않은 실디렉터리가
  있으면 보존 + 경고 (변경 없음).

## `./harness bootstrap` (팀원 단일 표면)

- 7단계 구성 불변. 요약 블록에 신규 라인 추가 가능:
  `gitignore 반영 <N>건`, `잔재 <N>건 — 소유자 정리 필요` (0이면 생략).
- 불변식: bootstrap 전 과정에서 git 인덱스 변경 0 (검증: 실행 전후
  `git diff --cached` 동일). 잔재 없는 레포에서는 워킹트리 변경도 0.

## `reclaim-shared.sh` (은퇴 예고)

- pkg-sync 내 자동 회수 역할을 잃고 보고 전용 경로에 위임한다. 파일은 한
  버전 동안 thin wrapper로 유지(외부 직접 호출 호환), 다음 major에서 제거
  예고를 주석으로 남긴다.

## `required-gitignore.json` (설정 계약)

- `entries`에 `.claude/skills`, `.agents/skills` 추가 (모드 무관 필수 —
  merged tree는 어느 모드에서도 생성물).
- `lockModeEntries`는 기존 유지. 소비 측 링크 개별 등재는 하지 않는다 —
  merged tree 디렉터리 통짜 ignore가 이미 하위 링크·speckit 실파일을 덮고,
  speckit-* 실파일은 install이 매 머신 재배치하므로 커밋 불필요.

