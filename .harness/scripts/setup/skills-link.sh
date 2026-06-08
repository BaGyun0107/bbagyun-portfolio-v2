#!/usr/bin/env sh
# .harness/skills와 .harness/skills-local을 agent별 skill tree로 링크한다.
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)"

failures=0
migrate_tracked_legacy=0

fail() {
  failures=$((failures + 1))
  printf '실패: %s\n' "$1" >&2
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --migrate-tracked-legacy)
      migrate_tracked_legacy=1
      ;;
    *)
      fail "알 수 없는 인자입니다: $1"
      ;;
  esac
  shift
done

if [ "$failures" -gt 0 ]; then
  exit 1
fi

# 로컬 skill 디렉터리는 프로젝트 소유라 fresh clone에서도 지연 생성한다.
mkdir -p "$ROOT_DIR/.harness/skills-local"

is_tracked_path() {
  git -C "$ROOT_DIR" ls-files --error-unmatch "$1" >/dev/null 2>&1
}

collision_check() {
  collisions=""
  if [ -d "$ROOT_DIR/.harness/skills-local" ]; then
    for local_skill in "$ROOT_DIR"/.harness/skills-local/*; do
      [ -d "$local_skill" ] || continue
      name="$(basename "$local_skill")"
      case "$name" in
        _shared) continue ;;
      esac
      if [ -d "$ROOT_DIR/.harness/skills/$name" ]; then
        collisions="$collisions $name"
      fi
    done
  fi
  if [ -n "$collisions" ]; then
    fail ".harness/skills 와 .harness/skills-local 사이에 skill 이름 충돌이 있습니다:"
    for name in $collisions; do
      printf '  - %s\n' "$name" >&2
    done
    printf '로컬 skill 이름을 바꾸세요. upstream skill 덮어쓰기는 지원하지 않습니다.\n' >&2
    return 1
  fi
}

build_merged_tree() {
  local_path="$1"
  link_path="$ROOT_DIR/$local_path"

  if [ -L "$link_path" ]; then
    if is_tracked_path "$local_path" && [ "$migrate_tracked_legacy" -ne 1 ]; then
      printf '경고: %s 은(는) 추적 중인 구버전 symlink입니다. preflight-safe mode에서는 migration을 건너뜁니다. 전환하려면 ./harness skills-link --migrate-tracked-legacy 를 실행하세요.\n' "$local_path" >&2
      return 0
    fi
    rm -f "$link_path"
  fi

  if [ -e "$link_path" ] && [ ! -d "$link_path" ]; then
    fail "$local_path 이(가) 존재하지만 디렉터리나 symlink가 아닙니다."
    return 1
  fi

  mkdir -p "$link_path"

  # 실제 파일이 섞여 있으면 사용자가 만든 내용을 지울 수 있어 중단한다.
  for entry in "$link_path"/* "$link_path"/.*; do
    [ -e "$entry" ] || [ -L "$entry" ] || continue
    base="$(basename "$entry")"
    case "$base" in
      .|..) continue ;;
    esac
    if [ ! -L "$entry" ]; then
      fail "$local_path/$base 은(는) symlink가 아니므로 머지 트리를 재생성하지 않습니다."
      printf '  힌트: %s 에는 skills-link.sh가 생성한 symlink만 있어야 합니다.\n' "$local_path" >&2
      printf '  힌트: 실수로 만든 파일이면 %s 을(를) 직접 이동하거나 삭제하세요.\n' "$entry" >&2
      return 1
    fi
  done

  # 삭제된 skill symlink가 남지 않도록 매번 재생성한다.
  for entry in "$link_path"/* "$link_path"/.*; do
    [ -L "$entry" ] || continue
    base="$(basename "$entry")"
    case "$base" in
      .|..) continue ;;
    esac
    rm -f "$entry"
  done

  link_source() {
    source_dir="$1"
    [ -d "$source_dir" ] || return 0
    for skill_dir in "$source_dir"/*; do
      [ -d "$skill_dir" ] || continue
      name="$(basename "$skill_dir")"
      case "$name" in
        _shared) continue ;;
      esac
      ln -sfn "$skill_dir" "$link_path/$name"
    done
  }

  link_source "$ROOT_DIR/.harness/skills"
  link_source "$ROOT_DIR/.harness/skills-local"
}

if ! collision_check; then
  exit 1
fi

build_merged_tree ".claude/skills"
build_merged_tree ".agents/skills"

if [ "$failures" -gt 0 ]; then
  exit 1
fi
