#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)"
HARNESS_SOURCE_REPO="${HARNESS_SOURCE_REPO:-https://github.com/CODIWORKS-Engineer/codi-harness.git}"
HARNESS_SOURCE_REF="${HARNESS_SOURCE_REF:-v2}"
STATE_DIR="$ROOT_DIR/.harness/state"
STATE_FILE="$STATE_DIR/update-state.env"
LOCK_DIR="$STATE_DIR/update-check.lock"
NOTICE_FILE="$STATE_DIR/update-notice.txt"
TZ_NAME="${HARNESS_TZ:-Asia/Seoul}"

# --background: 무거운 daily/weekly 작업(원격 git fetch 등)은
# 실측 18초로 hook timeout(10초)을 넘겨 state 저장에 도달하지 못하고, 그래서
# 스로틀이 무력화돼 매 프롬프트마다 재시도된다. background 모드는 이 작업을
# detach된 자식으로 돌리고 즉시 반환한다. 자식이 끝나면 state가 갱신되어
# 다음 실행부터 스로틀이 정상 작동하고, 알림은 NOTICE_FILE에 남겨 다음
# 실행이 출력한다(한 프롬프트 지연은 무해).
BACKGROUND=0
WORKER=0
for arg in "$@"; do
  case "$arg" in
    --background) BACKGROUND=1 ;;
    --worker) WORKER=1 ;;
  esac
done

mkdir -p "$STATE_DIR"

LAST_DAILY=""
LAST_WEEKLY=""

if [ -f "$STATE_FILE" ]; then
  # shellcheck disable=SC1090
  . "$STATE_FILE"
fi

today="$(TZ="$TZ_NAME" date +%Y-%m-%d)"
week="$(TZ="$TZ_NAME" date +%G-W%V)"

save_state() {
  {
    printf 'LAST_DAILY=%s\n' "$LAST_DAILY"
    printf 'LAST_WEEKLY=%s\n' "$LAST_WEEKLY"
  } > "$STATE_FILE"
}

daily_speckit_check() {
  if command -v node >/dev/null 2>&1 && [ -f "$ROOT_DIR/.harness/scripts/checks/speckit-drift-check.mjs" ]; then
    ROOT_DIR="$ROOT_DIR" NOTICE_FILE="$NOTICE_FILE" node "$ROOT_DIR/.harness/scripts/checks/speckit-drift-check.mjs" || true
  fi
}

daily_harness_repo() {
  # 헤더는 찍지 않는다. 실제 업데이트/stale이 있을 때만 print_harness_update_notice가
  # 알림을 남긴다. 최신 상태면 아무 출력도 없다.
  # lock 모드(specs/006 US3): 하네스 본체 확인은 pkg-update-check가 대체한다.
  if [ -f "$ROOT_DIR/harness.lock" ]; then
    return
  fi
  if ! command -v git >/dev/null 2>&1; then
    echo "경고: git을 사용할 수 없어 하네스 repository 점검을 건너뜁니다."
    return
  fi

  if ! git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "경고: $ROOT_DIR 은(는) git repository가 아니므로 하네스 repository 점검을 건너뜁니다."
    return
  fi

  check_current_branch_harness_update
  check_canonical_harness_update
}

# 프로젝트 소유 분류는 가능하면 project-owned.mjs에 위임한다.
PROJECT_OWNED_CLASSIFIER="$ROOT_DIR/.harness/scripts/setup/project-owned.mjs"

# 셸 fallback 은 공용 파일에서 source 한다 (감사 L-1 — 복제 case 통일).
. "$ROOT_DIR/.harness/scripts/setup/project-owned-fallback.sh"

is_project_owned_path() {
  if command -v node >/dev/null 2>&1 && [ -f "$PROJECT_OWNED_CLASSIFIER" ]; then
    node "$PROJECT_OWNED_CLASSIFIER" --check "$1"
    return $?
  fi
  is_project_owned_path_fallback "$1"
}

# 표준 입력 경로에서 공용 경로만 남긴다.
filter_shared_paths() {
  if command -v node >/dev/null 2>&1 && [ -f "$PROJECT_OWNED_CLASSIFIER" ]; then
    node "$PROJECT_OWNED_CLASSIFIER" --filter
    return
  fi
  while IFS= read -r path; do
    [ -n "$path" ] || continue
    is_project_owned_path "$path" || printf '%s\n' "$path"
  done
}

print_harness_update_notice() {
  source="$1"
  action="$2"
  changed_files="$3"

  echo "안내: $source 에서 Codi 하네스 업데이트를 사용할 수 있습니다."
  echo "안내: 변경된 하네스 파일:"
  printf '%s\n' "$changed_files" | sed 's/^/  - /'

  if [ -n "$(git -C "$ROOT_DIR" status --porcelain)" ]; then
    echo "안내: worktree에 로컬 변경이 있습니다. 먼저 commit 또는 stash 후 $action"
  else
    echo "안내: $action"
  fi
}

check_current_branch_harness_update() {
  upstream="$(git -C "$ROOT_DIR" rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>/dev/null || true)"
  if [ -z "$upstream" ]; then
    echo "경고: 현재 브랜치에 upstream이 없어 현재 브랜치 하네스 점검을 건너뜁니다."
    return
  fi

  if ! git -C "$ROOT_DIR" fetch --quiet; then
    echo "경고: $upstream fetch 실패로 현재 브랜치 하네스 점검을 건너뜁니다."
    return
  fi

  counts="$(git -C "$ROOT_DIR" rev-list --left-right --count "HEAD...$upstream" 2>/dev/null || true)"
  set -- $counts
  ahead="${1:-0}"
  behind="${2:-0}"

  if [ "$behind" -eq 0 ]; then
    return
  fi

  changed_files="$(git -C "$ROOT_DIR" diff --name-only "HEAD..$upstream" 2>/dev/null | filter_shared_paths || true)"

  if [ -z "$changed_files" ]; then
    return
  fi

  echo "안내: 로컬 브랜치가 $behind commit 뒤처져 있고, $ahead commit 앞서 있습니다."
  print_harness_update_notice "$upstream" "실행: git pull --ff-only" "$changed_files"
}

check_canonical_harness_update() {
  if [ -z "$HARNESS_SOURCE_REPO" ] || [ -z "$HARNESS_SOURCE_REF" ]; then
    return
  fi

  if ! git -C "$ROOT_DIR" fetch --quiet --depth=1 "$HARNESS_SOURCE_REPO" "$HARNESS_SOURCE_REF"; then
    echo "경고: $HARNESS_SOURCE_REPO $HARNESS_SOURCE_REF fetch 실패로 canonical 하네스 점검을 건너뜁니다."
    return
  fi

  changed_files="$(git -C "$ROOT_DIR" diff --name-only HEAD FETCH_HEAD 2>/dev/null | filter_shared_paths || true)"

  stale_files=""
  if command -v node >/dev/null 2>&1 \
    && git -C "$ROOT_DIR" cat-file -e "FETCH_HEAD:.harness/shared-manifest.json" 2>/dev/null \
    && [ -f "$ROOT_DIR/.harness/scripts/setup/prune-stale.mjs" ]; then
    manifest_tmp="$(mktemp)"
    git -C "$ROOT_DIR" show "FETCH_HEAD:.harness/shared-manifest.json" > "$manifest_tmp" 2>/dev/null || true
    if [ -s "$manifest_tmp" ]; then
      stale_files="$(MANIFEST_FILE="$manifest_tmp" ROOT_DIR="$ROOT_DIR" \
        node "$ROOT_DIR/.harness/scripts/setup/prune-stale.mjs" 2>/dev/null || true)"
    fi
    rm -f "$manifest_tmp"
  fi

  if [ -z "$changed_files" ] && [ -z "$stale_files" ]; then
    return
  fi

  if [ -n "$changed_files" ]; then
    print_harness_update_notice "$HARNESS_SOURCE_REPO#$HARNESS_SOURCE_REF" "최신 Codi 하네스를 이 repo에 병합한 뒤 ./harness doctor 실행" "$changed_files"
  fi

  if [ -n "$stale_files" ]; then
    echo "안내: stale shared 하네스 파일이 감지되었습니다 (upstream manifest에서 제거됨):"
    printf '%s\n' "$stale_files" | sed 's/^/  - /'
    echo "안내: 정리하려면 ./harness update 를 실행하세요."
  fi
}

weekly_check_only() {
  echo "하네스 주간 점검: Superpowers"

  # Spec Kit은 사용자가 프로젝트별로 uvx로 설치·갱신하므로 주간 점검 대상이
  # 아니다. Superpowers는 Claude Code / Codex 의 plugin marketplace 가 update 를
  # 관리한다. 외부 git 태그 polling 은 의미가 없으므로 안내만 출력한다.
  echo "Superpowers: Claude Code / Codex 내부 plugin marketplace에서 관리됩니다."
}

# 대기 중인 알림이 있으면 출력하고 지운다. background worker가 남긴 결과를
# 다음 실행이 사용자에게 보여주는 통로다.
flush_pending_notice() {
  if [ -s "$NOTICE_FILE" ]; then
    cat "$NOTICE_FILE"
    rm -f "$NOTICE_FILE"
  fi
}

# 무거운 daily/weekly 작업 본체. 출력은 NOTICE_FILE에 모아 두고, 끝나면 state를
# 갱신한다. foreground 모드는 이 출력을 그대로 stdout으로도 흘린다.
run_checks() {
  ran=0
  : > "$NOTICE_FILE"
  if [ "$LAST_DAILY" != "$today" ]; then
    { daily_harness_repo; daily_speckit_check; } >> "$NOTICE_FILE" 2>&1
    LAST_DAILY="$today"
    ran=1
  fi
  # lock 모드(specs/005): 채널 확인·수신의 일일 폴백 경로. 주 경로는
  # preflight의 detached 감지이고, 반영(flip)은 pkg-apply-pending 담당 (R5).
  if [ -f "$ROOT_DIR/harness.lock" ]; then
    (cd "$ROOT_DIR" && sh "$ROOT_DIR/.harness/scripts/pkg/pkg-update-check.sh") >> "$NOTICE_FILE" 2>&1 || true
  fi
  if [ "$LAST_WEEKLY" != "$week" ]; then
    weekly_check_only >> "$NOTICE_FILE" 2>&1
    LAST_WEEKLY="$week"
    ran=1
  fi
  if [ "$ran" -eq 1 ]; then
    save_state
  fi
  [ -s "$NOTICE_FILE" ] || rm -f "$NOTICE_FILE"
}

if [ "${HARNESS_AUTO_UPDATE:-1}" = "0" ]; then
  exit 0
fi

# worker: detach된 자식. 무거운 작업만 수행하고 락을 해제한다. 출력은
# NOTICE_FILE에만 남기므로 stdout으로는 아무것도 내보내지 않는다.
if [ "$WORKER" -eq 1 ]; then
  trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT
  run_checks >/dev/null 2>&1 || true
  exit 0
fi

# 할 일이 없으면(오늘·이번 주 이미 성공) 대기 알림만 흘리고 즉시 종료한다.
# foreground/background 공통으로 여기서 사실상 0초에 끝난다.
if [ "$LAST_DAILY" = "$today" ] && [ "$LAST_WEEKLY" = "$week" ]; then
  flush_pending_notice
  exit 0
fi

if [ "$BACKGROUND" -eq 1 ]; then
  # 이미 도는 worker가 있으면(락 획득 실패) 새로 띄우지 않는다. mkdir는 원자적.
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    # 자기 자신을 worker로 detach하고 즉시 반환한다. hook은 여기서 멈추지 않는다.
    ( "$SCRIPT_DIR/update-check.sh" --worker >/dev/null 2>&1 & ) &
  fi
  # background 실행이라도 지난번 worker가 남긴 알림은 지금 흘려 준다.
  flush_pending_notice
  exit 0
fi

# foreground(기본): 기존처럼 동기 실행. 수동 ./harness update-check 호출용.
run_checks
flush_pending_notice
