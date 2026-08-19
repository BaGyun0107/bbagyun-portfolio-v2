#!/usr/bin/env sh
# .harness/skills와 .harness/skills-local을 agent별 skill tree로 링크한다.
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
# lock 모드 materialize 는 캐시 패키지 안의 이 스크립트 사본을 소비 레포에
# 적용한다 — 그때는 스크립트 위치가 레포 밖이라 루트 재지정이 필요하다.
# 기본값은 기존 그대로 스크립트 위치 기준이다 (비-lock 경로 동작 불변).
ROOT_DIR="${HARNESS_ROOT_DIR:-$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)}"

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

# 링크 값은 리포 내부 상대경로다 (specs/015 US4·갭 5) — 절대경로는 생성
# 머신 밖에서 깨진다. 트리(.claude/skills 등)에서 ROOT 까지의 상대 접두어를
# 트리당 한 번만 계산해 링크마다 node 를 띄우지 않는다.
# GNU realpath --relative-to 는 macOS 에 없어 Node 를 쓴다.
relative_prefix() {
  # $1: 링크가 사는 디렉터리 절대경로. 실패 시 빈 값(호출부가 절대경로 폴백).
  node -e 'const p=require("node:path");console.log(p.relative(process.argv[1],process.argv[2]))' "$1" "$ROOT_DIR" 2>/dev/null || true
}

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

  # non-symlink 항목 처리: Spec Kit처럼 외부 도구가 이 트리에 직접 설치한
  # 실제 스킬 디렉터리(예: speckit-*)는 harness 소유가 아니므로 그대로 보존한다.
  # harness는 자기 symlink만 관리하고, 외부 소유 디렉터리는 삭제/재생성하지 않는다.
  # 다만 디렉터리가 아닌 실제 파일이 최상위에 있으면 실수일 가능성이 높으므로
  # 중단하지 않고 경고만 남긴다(외부 소유 항목을 지우지 않기 위해서다).
  for entry in "$link_path"/* "$link_path"/.*; do
    [ -e "$entry" ] || [ -L "$entry" ] || continue
    base="$(basename "$entry")"
    case "$base" in
      .|..) continue ;;
    esac
    [ -L "$entry" ] && continue
    if [ -d "$entry" ]; then
      # 외부 소유 스킬 디렉터리(Spec Kit 등)로 간주하고 보존한다.
      continue
    fi
    printf '경고: %s 은(는) symlink도 디렉터리도 아닙니다. 외부 소유 항목으로 보고 보존합니다.\n' "$local_path/$base" >&2
    printf '  힌트: 실수로 만든 파일이면 %s 을(를) 직접 이동하거나 삭제하세요.\n' "$entry" >&2
  done

  # 트리 → ROOT 상대 접두어 (예: ../..). node 부재 시 절대경로로 폴백한다.
  rel_root="$(relative_prefix "$link_path")"
  [ -n "$rel_root" ] || rel_root="$ROOT_DIR"

  expected_skill_target() {
    name="$1"
    case "$name" in
      _shared) return 1 ;;
    esac
    if [ -d "$ROOT_DIR/.harness/skills/$name" ]; then
      printf '%s\n' "$rel_root/.harness/skills/$name"
      return 0
    fi
    if [ -d "$ROOT_DIR/.harness/skills-local/$name" ]; then
      printf '%s\n' "$rel_root/.harness/skills-local/$name"
      return 0
    fi
    return 1
  }

  # 삭제된 skill symlink만 정리한다. 올바른 symlink는 보존해 preflight 반복
  # 실행이 불필요한 unlink/link 작업으로 느려지지 않게 한다.
  for entry in "$link_path"/* "$link_path"/.*; do
    [ -L "$entry" ] || continue
    base="$(basename "$entry")"
    case "$base" in
      .|..) continue ;;
    esac
    if expected_target="$(expected_skill_target "$base")"; then
      current_target="$(readlink "$entry" 2>/dev/null || true)"
      if [ "$current_target" = "$expected_target" ]; then
        continue
      fi
    fi
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
      target="$link_path/$name"
      # 링크 값은 상대경로 — skill_dir 절대경로에서 ROOT 접두어만 바꾼다.
      rel_skill="$rel_root/${skill_dir#"$ROOT_DIR/"}"
      # 외부 소유 실제 디렉터리(예: Spec Kit이 같은 이름으로 설치한 스킬)가
      # 이미 있으면 그 안에 링크를 만들지 않도록 건너뛴다. ln -sfn은 대상이
      # 디렉터리면 그 안쪽에 링크를 생성하므로 harness 스킬을 잘못 넣게 된다.
      if [ -d "$target" ] && [ ! -L "$target" ]; then
        printf '경고: %s 은(는) 외부 소유 디렉터리라 harness skill %s 링크를 건너뜁니다.\n' "$target" "$name" >&2
        continue
      fi
      if [ -L "$target" ] && [ "$(readlink "$target" 2>/dev/null || true)" = "$rel_skill" ]; then
        continue
      fi
      ln -sfn "$rel_skill" "$target"
    done
  }

  link_source "$ROOT_DIR/.harness/skills"
  link_source "$ROOT_DIR/.harness/skills-local"
}

# 프로젝트 소유 규칙 링크 (specs/020): .harness/rules-local/*.md 를
# .claude/rules/local/<name>.md 상대경로 심링크로 반영한다. skills-local 과
# 같은 정신 모델 — 소스는 project-owned, 소비 트리는 링크다.
link_rules_local() {
  rules_src="$ROOT_DIR/.harness/rules-local"
  rules_link_dir="$ROOT_DIR/.claude/rules/local"
  # fresh clone 에서도 소스 디렉터리를 지연 생성한다 (skills-local 과 동일).
  mkdir -p "$rules_src"
  mkdir -p "$rules_link_dir"

  rules_rel_root="$(relative_prefix "$rules_link_dir")"
  [ -n "$rules_rel_root" ] || rules_rel_root="$ROOT_DIR"

  # 고아 링크 정리: 소스 .md 가 사라진 심링크만 지운다. 링크 생성과 같은
  # 범위(.md)만 다뤄 비대칭을 없애고, 실제 파일은 사용자 소유일 수
  # 있으므로 보존한다 (스킬 트리와 동일한 보존 원칙).
  for entry in "$rules_link_dir"/*.md; do
    [ -L "$entry" ] || continue
    base="$(basename "$entry")"
    if [ ! -f "$rules_src/$base" ]; then
      rm -f "$entry"
    fi
  done

  # .md 파일만 링크한다 — 그 외 파일·하위 디렉터리는 규칙 로드 대상이 아니다.
  for rule_file in "$rules_src"/*.md; do
    [ -f "$rule_file" ] || continue
    base="$(basename "$rule_file")"
    target="$rules_link_dir/$base"
    rel_rule="$rules_rel_root/.harness/rules-local/$base"
    if [ -e "$target" ] && [ ! -L "$target" ]; then
      printf '경고: %s 은(는) 실제 파일이라 rules-local 링크를 건너뜁니다.\n' ".claude/rules/local/$base" >&2
      continue
    fi
    if [ -L "$target" ] && [ "$(readlink "$target" 2>/dev/null || true)" = "$rel_rule" ]; then
      continue
    fi
    ln -sfn "$rel_rule" "$target"
  done
}

if ! collision_check; then
  exit 1
fi

build_merged_tree ".claude/skills"
build_merged_tree ".agents/skills"
link_rules_local

if [ "$failures" -gt 0 ]; then
  exit 1
fi
