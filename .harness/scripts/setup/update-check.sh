#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)"
GSTACK_SOURCE_DIR="${GSTACK_SOURCE_DIR:-${HOME:?HOME 값이 필요합니다}/.claude/skills/gstack}"
HARNESS_SOURCE_REPO="${HARNESS_SOURCE_REPO:-https://github.com/CODIWORKS-Engineer/codi-harness.git}"
HARNESS_SOURCE_REF="${HARNESS_SOURCE_REF:-v2}"
case "$GSTACK_SOURCE_DIR" in
  /*) ;;
  *) echo "GSTACK_SOURCE_DIR는 절대경로여야 합니다: $GSTACK_SOURCE_DIR" >&2; exit 2 ;;
esac
STATE_DIR="$ROOT_DIR/.harness/state"
STATE_FILE="$STATE_DIR/update-state.env"
TZ_NAME="${HARNESS_TZ:-Asia/Seoul}"

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

daily_gstack() {
  echo "하네스 일일 점검: GStack"
  if [ -d "$GSTACK_SOURCE_DIR/.git" ]; then
    git -C "$GSTACK_SOURCE_DIR" pull --ff-only || true
    if [ -x "$GSTACK_SOURCE_DIR/setup" ]; then
      "$GSTACK_SOURCE_DIR/setup" --host claude --team || true
      "$GSTACK_SOURCE_DIR/setup" --host codex --team || true
    fi
  elif command -v gstack-team-init >/dev/null 2>&1; then
    if [ -n "${PWD:-}" ]; then
      (cd "$ROOT_DIR" && gstack-team-init required) || true
    else
      gstack-team-init required || true
    fi
  else
    echo "경고: GStack이 아직 설치되지 않았습니다. ./harness install 을 실행하세요."
  fi
}

daily_harness_repo() {
  echo "하네스 일일 점검: repository"

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

is_project_owned_path() {
  if command -v node >/dev/null 2>&1 && [ -f "$PROJECT_OWNED_CLASSIFIER" ]; then
    node "$PROJECT_OWNED_CLASSIFIER" --check "$1"
    return $?
  fi
  case "$1" in
    .planning|.planning/*)
      return 0
      ;;
    .github|.github/*|README.md|mise.toml|package.json|package-lock.json|pnpm-lock.yaml|pnpm-workspace.yaml|renovate.json|.gitignore|.harness/config/project-profile.yaml|.harness/config/skill-triggers.local.json|.harness/state|.harness/state/*|.harness/skills-local|.harness/skills-local/*|apps|apps/*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
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
    echo "안내: 정리하려면 ./harness update --apply-harness 를 실행하세요."
  fi
}

weekly_check_only() {
  echo "하네스 주간 점검: GSD 및 Superpowers"
  if command -v mise >/dev/null 2>&1; then
    mise exec -- npm view @opengsd/get-shit-done-redux version 2>/dev/null || true
  else
    echo "경고: mise를 사용할 수 없어 GSD 최신 버전 확인을 건너뜁니다."
  fi

  # Superpowers는 Claude Code / Codex 의 plugin marketplace 가 update 를 관리한다.
  # 외부 git 태그 polling 은 의미가 없으므로 안내만 출력한다.
  echo "Superpowers: Claude Code / Codex 내부 plugin marketplace에서 관리됩니다."
}

if [ "${HARNESS_AUTO_UPDATE:-1}" = "0" ]; then
  exit 0
fi

if [ "$LAST_DAILY" != "$today" ]; then
  daily_harness_repo
  daily_gstack
  LAST_DAILY="$today"
  save_state
fi

if [ "$LAST_WEEKLY" != "$week" ]; then
  weekly_check_only
  LAST_WEEKLY="$week"
  save_state
fi
