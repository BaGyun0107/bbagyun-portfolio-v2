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
MODE="check"
AUTO_APPLY=0
HARNESS_UPDATE_VERBOSE="${HARNESS_UPDATE_VERBOSE:-0}"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --check)
      MODE="check"
      shift
      ;;
    --apply-harness)
      MODE="apply-harness"
      shift
      ;;
    --auto)
      AUTO_APPLY=1
      shift
      ;;
    --verbose)
      HARNESS_UPDATE_VERBOSE=1
      shift
      ;;
    --write-lock)
      MODE="write-lock"
      shift
      ;;
    --source-repo)
      HARNESS_SOURCE_REPO="${2:?--source-repo 값이 필요합니다}"
      shift 2
      ;;
    --source-ref)
      HARNESS_SOURCE_REF="${2:?--source-ref 값이 필요합니다}"
      shift 2
      ;;
    *)
      echo "알 수 없는 인자입니다: $1" >&2
      exit 2
      ;;
  esac
done

# 프로젝트 소유 분류는 Node가 있으면 project-owned.mjs에 위임한다.
# 아래 case는 Node가 없는 환경을 위한 최소 fallback이다.
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

is_verbose() {
  case "$HARNESS_UPDATE_VERBOSE" in
    1|true|yes|on)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

count_lines() {
  awk 'NF { count += 1 } END { print count + 0 }' "$1"
}

print_path_summary() {
  title="$1"
  file="$2"
  suffix="${3:-}"
  count="$(count_lines "$file")"
  [ "$count" -gt 0 ] || return 0

  if is_verbose; then
    echo "$title:"
    if [ -n "$suffix" ]; then
      while IFS= read -r path; do
        [ -n "$path" ] || continue
        echo "  - $path $suffix"
      done < "$file"
    else
      sed 's/^/  - /' "$file"
    fi
  else
    echo "$title: $count"
    echo "  전체 파일 목록은 --verbose 또는 HARNESS_UPDATE_VERBOSE=1로 확인하세요."
  fi
}

ensure_required_gitignore() {
  # .gitignore는 project-owned다. update는 덮어쓰지 않지만, 하네스가 보장해야
  # 하는 필수 entry는 누락 시 idempotent하게 append한다. 이미 있으면 no-op.
  if ! command -v node >/dev/null 2>&1; then
    return 0
  fi
  if [ ! -f "$ROOT_DIR/.harness/scripts/setup/ensure-gitignore.mjs" ]; then
    return 0
  fi
  added="$(ROOT_DIR="$ROOT_DIR" node "$ROOT_DIR/.harness/scripts/setup/ensure-gitignore.mjs" 2>/dev/null || true)"
  if [ -n "$added" ]; then
    echo "필수 .gitignore 항목을 추가했습니다:"
    printf '%s\n' "$added" | sed 's/^/  - /'
  fi
}

matches_fetch_head_file() {
  path="$1"
  git -C "$ROOT_DIR" cat-file -e "FETCH_HEAD:$path" 2>/dev/null || return 1
  [ -f "$ROOT_DIR/$path" ] || return 1
  git -C "$ROOT_DIR" show "FETCH_HEAD:$path" 2>/dev/null | cmp -s - "$ROOT_DIR/$path"
}

is_blocking_dirty_path() {
  path="$1"
  status="$(git -C "$ROOT_DIR" status --porcelain -- "$path" 2>/dev/null || true)"
  [ -n "$status" ] || return 1

  # 추적 중인 로컬 삭제는 커밋/스태시 전까지 의도적 로컬 상태로 본다.
  # update가 조용히 되살리지 않도록 dirty로 막는다. 단, upstream에서도
  # 삭제된 shared 파일은 이미 적용된 삭제 상태이므로 막지 않는다.
  case "$status" in
    D*|?D*)
      if ! git -C "$ROOT_DIR" cat-file -e "FETCH_HEAD:$path" 2>/dev/null; then
        return 1
      fi
      return 0
      ;;
    '?? '*)
      if matches_fetch_head_file "$path"; then
        return 1
      fi
      return 0
      ;;
  esac

  if git -C "$ROOT_DIR" cat-file -e "FETCH_HEAD:$path" 2>/dev/null; then
    if [ ! -e "$ROOT_DIR/$path" ] && [ ! -L "$ROOT_DIR/$path" ]; then
      return 1
    fi
    if git -C "$ROOT_DIR" diff --quiet --no-ext-diff FETCH_HEAD -- "$path" 2>/dev/null; then
      return 1
    fi
  fi

  return 0
}

apply_harness_update() {
  selected_file="$(mktemp)"
  skipped_project_owned_file="$(mktemp)"
  dirty_file="$(mktemp)"
  deleted_file="$(mktemp)"
  manifest_file="$(mktemp)"
  stale_file="$(mktemp)"
  stale_dirty_file="$(mktemp)"
  trap 'rm -f "$selected_file" "$skipped_project_owned_file" "$dirty_file" "$deleted_file" "$manifest_file" "$stale_file" "$stale_dirty_file"' EXIT

  echo "Codi 하네스를 가져옵니다: $HARNESS_SOURCE_REPO#$HARNESS_SOURCE_REF"
  git -C "$ROOT_DIR" fetch --quiet --depth=1 "$HARNESS_SOURCE_REPO" "$HARNESS_SOURCE_REF"

  changed_files="$(git -C "$ROOT_DIR" diff --name-only HEAD FETCH_HEAD 2>/dev/null || true)"

  # 큰 diff에서도 빠르게 처리하려고 Node 한 번으로 batch 분류한다.
  if [ -n "$changed_files" ] && command -v node >/dev/null 2>&1 \
    && [ -f "$PROJECT_OWNED_CLASSIFIER" ]; then
    all_changed="$(mktemp)"
    trap 'rm -f "$selected_file" "$skipped_project_owned_file" "$dirty_file" "$deleted_file" "$manifest_file" "$stale_file" "$stale_dirty_file" "$all_changed"' EXIT
    printf '%s\n' "$changed_files" > "$all_changed"
    node "$PROJECT_OWNED_CLASSIFIER" --filter < "$all_changed" > "$selected_file"
    # 제외된 project-owned 경로는 기본 요약만 보여주고, 상세 목록은 verbose에서만 보여준다.
    while IFS= read -r path; do
      [ -n "$path" ] || continue
      grep -Fxq -- "$path" "$selected_file" 2>/dev/null && continue
      printf '%s\n' "$path" >> "$skipped_project_owned_file"
    done < "$all_changed"
  else
    printf '%s\n' "$changed_files" | while IFS= read -r path; do
      [ -n "$path" ] || continue
      if is_project_owned_path "$path"; then
        printf '%s\n' "$path" >> "$skipped_project_owned_file"
        continue
      fi
      printf '%s\n' "$path"
    done > "$selected_file"
  fi

  print_path_summary "project-owned 경로 건너뜀" "$skipped_project_owned_file"

  # 상위 manifest로 삭제/이동된 공용 파일을 찾아낸다.
  if git -C "$ROOT_DIR" cat-file -e "FETCH_HEAD:.harness/shared-manifest.json" 2>/dev/null; then
    git -C "$ROOT_DIR" show "FETCH_HEAD:.harness/shared-manifest.json" > "$manifest_file"
  else
    : > "$manifest_file"
  fi

  if [ -s "$manifest_file" ] && command -v node >/dev/null 2>&1; then
    # 오래된 파일 감지 실패는 수동 모드에서 nonzero로 드러낸다.
    if ! MANIFEST_FILE="$manifest_file" ROOT_DIR="$ROOT_DIR" \
      node "$ROOT_DIR/.harness/scripts/setup/prune-stale.mjs" > "$stale_file"; then
      if [ "$AUTO_APPLY" -eq 1 ]; then
        echo "경고: prune-stale.mjs 실행 실패로 stale 파일 정리를 건너뜁니다. ./harness update --apply-harness를 수동으로 실행하세요." >&2
        : > "$stale_file"
      else
        echo "실패: 하네스 적용 중 prune-stale.mjs 실행에 실패했습니다. 스크립트를 고친 뒤 ./harness update --apply-harness를 다시 실행하세요." >&2
        exit 1
      fi
    fi
  fi

  # manifest에 등록된 shared 파일 중 다운스트림에 없는 파일을 selected_file에
  # 추가한다. 기존 diff 기반 흐름은 다운스트림이 옛 버전에서 시작해 어떤
  # shared 파일을 받지 못한 채 시간이 흐른 경우 그 파일을 영원히 무시한다.
  # 누락 복구는 그 격차를 매번 메운다.
  if [ -s "$manifest_file" ] && command -v node >/dev/null 2>&1 \
    && [ -f "$ROOT_DIR/.harness/scripts/setup/restore-missing-shared.mjs" ]; then
    missing_file="$(mktemp)"
    if MANIFEST_FILE="$manifest_file" ROOT_DIR="$ROOT_DIR" \
      node "$ROOT_DIR/.harness/scripts/setup/restore-missing-shared.mjs" > "$missing_file"; then
      if [ -s "$missing_file" ]; then
        restored_file="$(mktemp)"
        while IFS= read -r path; do
          [ -n "$path" ] || continue
          # 이미 selected_file에 있으면 중복 추가하지 않는다.
          if ! grep -Fxq -- "$path" "$selected_file" 2>/dev/null; then
            printf '%s\n' "$path" >> "$selected_file"
            printf '%s\n' "$path" >> "$restored_file"
          fi
        done < "$missing_file"
        print_path_summary "로컬에 없는 shared 파일 복구" "$restored_file" "(로컬에 없음)"
        rm -f "$restored_file"
      fi
    else
      if [ "$AUTO_APPLY" -eq 1 ]; then
        echo "경고: restore-missing-shared.mjs 실행 실패로 누락 파일 복구를 건너뜁니다. ./harness update --apply-harness를 수동으로 실행하세요." >&2
      else
        echo "실패: 하네스 적용 중 restore-missing-shared.mjs 실행에 실패했습니다. 스크립트를 고친 뒤 ./harness update --apply-harness를 다시 실행하세요." >&2
        rm -f "$missing_file"
        exit 1
      fi
    fi
    rm -f "$missing_file"
  fi

  if [ ! -s "$selected_file" ] && [ ! -s "$stale_file" ]; then
    echo "하네스가 이미 최신 상태입니다."
    ensure_required_gitignore
    return 0
  fi

  if [ ! -s "$selected_file" ] && [ -s "$stale_file" ]; then
    echo "변경된 shared 하네스 파일은 없지만 stale 파일이 감지되었습니다."
  fi

  while IFS= read -r path; do
    if is_blocking_dirty_path "$path"; then
      printf '%s\n' "$path" >> "$dirty_file"
    fi
  done < "$selected_file"

  if [ -s "$dirty_file" ]; then
    if [ "$AUTO_APPLY" -eq 1 ]; then
      echo "경고: shared 하네스 경로에 로컬 변경이 있어 자동 적용을 건너뜁니다:" >&2
      sed 's/^/  - /' "$dirty_file" >&2
      echo "경고: 로컬 변경을 검토한 뒤 ./harness update --apply-harness를 수동으로 실행하세요." >&2
      return 0
    fi

    echo "shared 하네스 경로의 로컬 변경을 덮어쓰지 않습니다:" >&2
    sed 's/^/  - /' "$dirty_file" >&2
    echo "먼저 해당 변경을 커밋하거나 stash 하세요." >&2
    exit 1
  fi

  if [ -s "$selected_file" ]; then
    applied_file="$(mktemp)"
    removed_upstream_file="$(mktemp)"
    while IFS= read -r path; do
      if git -C "$ROOT_DIR" cat-file -e "FETCH_HEAD:$path" 2>/dev/null; then
        printf '%s\n' "$path" >> "$applied_file"
        git -C "$ROOT_DIR" restore --source=FETCH_HEAD --worktree -- "$path"
      elif [ -e "$ROOT_DIR/$path" ] || [ -L "$ROOT_DIR/$path" ]; then
        if [ "$AUTO_APPLY" -eq 1 ]; then
          printf '%s\n' "$path" >> "$deleted_file"
        else
          printf '%s\n' "$path" >> "$removed_upstream_file"
          rm -f "$ROOT_DIR/$path"
        fi
      fi
    done < "$selected_file"
    print_path_summary "shared 하네스 파일 적용" "$applied_file"
    print_path_summary "upstream에서 삭제된 shared 파일 제거" "$removed_upstream_file"
    rm -f "$applied_file" "$removed_upstream_file"
  fi

  if [ -s "$deleted_file" ]; then
    echo "경고: 자동 하네스 적용 중 upstream에서 삭제된 파일은 제거하지 않았습니다:" >&2
    sed 's/^/  - /' "$deleted_file" >&2
    echo "경고: 삭제까지 반영하려면 ./harness update --apply-harness를 수동으로 실행하세요." >&2
  fi

  if [ -s "$stale_file" ]; then
    # 변경 적용이 이미 처리한 경로는 stale-dirty 판정에서 제외한다.
    if [ -s "$selected_file" ]; then
      filtered_stale="$(mktemp)"
      grep -Fxv -f "$selected_file" "$stale_file" > "$filtered_stale" 2>/dev/null || true
      mv "$filtered_stale" "$stale_file"
    fi

    while IFS= read -r path; do
      [ -n "$path" ] || continue
      if [ -n "$(git -C "$ROOT_DIR" status --porcelain -- "$path" 2>/dev/null)" ]; then
        printf '%s\n' "$path" >> "$stale_dirty_file"
      fi
    done < "$stale_file"

    if [ -s "$stale_dirty_file" ]; then
      echo "경고: stale shared 파일에 로컬 변경이 있어 그대로 둡니다:" >&2
      sed 's/^/  - /' "$stale_dirty_file" >&2
      echo "경고: 직접 검토한 뒤 커밋하거나 제거하세요." >&2
    fi

    # 로컬 edit이 없는 stale 파일만 삭제한다.
    pruned_any=0
    pruned_file="$(mktemp)"
    while IFS= read -r path; do
      [ -n "$path" ] || continue
      if grep -Fxq -- "$path" "$stale_dirty_file" 2>/dev/null; then
        continue
      fi
      pruned_any=1
      printf '%s\n' "$path" >> "$pruned_file"
      rm -f "$ROOT_DIR/$path"
    done < "$stale_file"
    print_path_summary "upstream에 더 이상 없는 stale shared 파일 정리" "$pruned_file"
    rm -f "$pruned_file"

    # 공용 root 아래에서 비게 된 디렉터리만 정리한다.
    for sub in .harness .claude/rules .codex/rules; do
      [ -d "$ROOT_DIR/$sub" ] || continue
      find "$ROOT_DIR/$sub" -mindepth 1 -depth -type d -empty \
        ! -path "$ROOT_DIR/.harness/skills-local" \
        ! -path "$ROOT_DIR/.harness/skills-local/*" \
        ! -path "$ROOT_DIR/.harness/state" \
        ! -path "$ROOT_DIR/.harness/state/*" \
        -delete 2>/dev/null || true
    done

    # 로컬 edit이 남은 stale 공용 파일은 수동 모드에서 실패로 드러낸다.
    if [ -s "$stale_dirty_file" ] && [ "$AUTO_APPLY" -ne 1 ]; then
      echo "실패: 로컬 변경이 있는 stale shared 파일이 남아 하네스 적용이 완료되지 않았습니다. 검토 후 ./harness update --apply-harness를 다시 실행하세요." >&2
      exit 1
    fi
  fi

  # 적용 직후 agent-facing skill tree를 갱신한다. 수동 모드에서는 추적 중인
  # 레거시 symlink 마이그레이션도 명시적으로 수행한다.
  if [ -x "$ROOT_DIR/.harness/scripts/setup/skills-link.sh" ]; then
    skills_link_args=""
    if [ "$AUTO_APPLY" -ne 1 ]; then
      skills_link_args="--migrate-tracked-legacy"
    fi
    # shellcheck disable=SC2086
    if ! "$ROOT_DIR/.harness/scripts/setup/skills-link.sh" $skills_link_args; then
      if [ "$AUTO_APPLY" -eq 1 ]; then
        echo "경고: skills-link.sh 실행 실패로 .claude/skills와 .agents/skills가 stale 상태일 수 있습니다. ./harness skills-link를 수동으로 실행하세요." >&2
      else
        echo "실패: 하네스 업데이트 적용 후 skills-link.sh 실행에 실패했습니다. 문제 상태를 고친 뒤 ./harness skills-link를 다시 실행하세요." >&2
        exit 1
      fi
    fi
  fi

  ensure_required_gitignore

  echo "하네스 파일 적용 완료. diff를 검토한 뒤 ./harness doctor를 실행하세요."
}

if ! command -v git >/dev/null 2>&1; then
  echo "git이 필요합니다." >&2
  exit 1
fi

if [ "$MODE" = "apply-harness" ]; then
  apply_harness_update
  exit 0
fi

echo "GStack 확인 중"
if [ -d "$GSTACK_SOURCE_DIR/.git" ]; then
  git -C "$GSTACK_SOURCE_DIR" fetch --prune || true
  git -C "$GSTACK_SOURCE_DIR" rev-parse HEAD || true
  git -C "$GSTACK_SOURCE_DIR" rev-parse origin/main || true
else
  echo "경고: $GSTACK_SOURCE_DIR가 설치되어 있지 않습니다."
fi

echo "GSD 확인 중"
if command -v mise >/dev/null 2>&1; then
  mise exec -- npm view @opengsd/get-shit-done-redux version || true
else
  echo "경고: mise를 사용할 수 없습니다."
fi

echo "Superpowers 확인 중 (plugin marketplace 설치 항목 — 이 스크립트가 직접 관리하지 않음)"
if [ -d "$HOME/.claude/plugins/superpowers" ] || [ -d "$HOME/.claude/plugins/superpowers@claude-plugins-official" ]; then
  echo "  Claude Code: superpowers plugin 감지됨"
else
  echo "  Claude Code: superpowers plugin 미감지 — Claude Code에서 /plugin install superpowers@claude-plugins-official 실행"
fi
if [ -d "$HOME/.codex/plugins/superpowers" ]; then
  echo "  Codex: superpowers plugin 감지됨"
else
  echo "  Codex: superpowers plugin 미감지 — Codex에서 /plugins 실행 후 설치"
fi

if [ "$MODE" = "write-lock" ]; then
  if ! command -v node >/dev/null 2>&1; then
    echo ".harness/lock.json을 쓰려면 node가 필요합니다." >&2
    exit 1
  fi

  node "$ROOT_DIR/.harness/scripts/agent/write-lock.mjs" "$ROOT_DIR"
  echo ".harness/lock.json 업데이트 완료"
else
  echo "확인 완료. 업데이트 내용이 적절하면 글로벌 설치를 갱신하세요."
fi
