#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)"
GSTACK_SOURCE_DIR="${GSTACK_SOURCE_DIR:-${HOME:?HOME 값이 필요합니다}/.claude/skills/gstack}"
case "$GSTACK_SOURCE_DIR" in
  /*) ;;
  *) echo "GSTACK_SOURCE_DIR는 절대경로여야 합니다: $GSTACK_SOURCE_DIR" >&2; exit 2 ;;
esac
CHANNEL="stable"
DRY_RUN=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --channel)
      CHANNEL="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    *)
      echo "알 수 없는 인자입니다: $1" >&2
      exit 2
      ;;
  esac
done

run() {
  if [ "$DRY_RUN" -eq 1 ]; then
    printf 'dry-run: %s\n' "$*"
  else
    "$@"
  fi
}

read_json() {
  key="$1"
  fallback="$2"
  if command -v node >/dev/null 2>&1; then
    node -e "const f=require('fs'); const lock=JSON.parse(f.readFileSync(process.argv[1],'utf8')); const path=process.argv[2].split('.'); let v=lock; for (const p of path) v=v && v[p]; console.log(v || process.argv[3]);" "$ROOT_DIR/.harness/lock.json" "$key" "$fallback"
  else
    printf '%s\n' "$fallback"
  fi
}

run mkdir -p "$(dirname "$GSTACK_SOURCE_DIR")" "$ROOT_DIR/.harness/state"
run mkdir -p "$ROOT_DIR/.agents" "$ROOT_DIR/.claude" "$ROOT_DIR/.codex"

echo "하네스 채널 설치 중: $CHANNEL"

if ! command -v git >/dev/null 2>&1; then
  echo "git이 필요합니다." >&2
  exit 1
fi

if ! command -v mise >/dev/null 2>&1; then
  echo "Node.js 24 및 npm runtime 관리를 위해 mise가 필요합니다." >&2
  exit 1
fi

run mise install

build_merged_skill_trees() {
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "dry-run: $ROOT_DIR/.harness/scripts/setup/skills-link.sh --migrate-tracked-legacy"
  else
    "$ROOT_DIR/.harness/scripts/setup/skills-link.sh" --migrate-tracked-legacy
  fi
}

remove_project_skill_root() {
  local_path="$1"
  link_path="$ROOT_DIR/$local_path"
  if [ -L "$link_path" ]; then
    link_target="$(readlink "$link_path" || true)"
    if [ "$link_target" = "../.harness/skills" ]; then
      run rm -f "$link_path"
    fi
  elif [ -e "$link_path" ]; then
    echo "경고: $local_path 이(가) symlink가 아니므로 그대로 둡니다." >&2
  fi
}

remove_legacy_harness_skill_links() {
  skills_dir="$1"
  [ -d "$skills_dir" ] || return 0
  for skill in codi-phase-routing karpathy-style codi-backend codi-frontend codi-db codi-dev-workflow codi-dependency-review init-project nestjs-expert team-mode-operator; do
    link_path="$skills_dir/$skill"
    if [ -L "$link_path" ]; then
      link_target="$(readlink "$link_path" || true)"
      if [ "$link_target" = "$ROOT_DIR/.harness/skills/$skill" ]; then
        run rm -f "$link_path"
      fi
    fi
  done
}

legacy_gsd_available() {
  command -v get-shit-done-cc >/dev/null 2>&1 \
    || { command -v mise >/dev/null 2>&1 && mise exec -- sh -c 'command -v get-shit-done-cc' >/dev/null 2>&1; }
}

remove_legacy_gsd() {
  echo "구버전 GSD 패키지 확인 중: get-shit-done-cc"
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "dry-run: mise exec -- get-shit-done-cc --claude --global --uninstall"
    echo "dry-run: mise exec -- get-shit-done-cc --codex --global --uninstall"
    echo "dry-run: mise exec -- npm uninstall -g get-shit-done-cc"
    return 0
  fi

  if legacy_gsd_available; then
    echo "Claude Code 구버전 GSD runtime 파일 제거 중"
    mise exec -- get-shit-done-cc --claude --global --uninstall || true
    echo "Codex 구버전 GSD runtime 파일 제거 중"
    mise exec -- get-shit-done-cc --codex --global --uninstall || true
    echo "구버전 GSD npm 패키지 제거 중"
    mise exec -- npm uninstall -g get-shit-done-cc || true
  else
    echo "구버전 GSD 패키지가 감지되지 않았습니다."
  fi
}

build_merged_skill_trees
remove_project_skill_root ".codex/skills"

GSD_PACKAGE="$(read_json tools.gsd.package @opengsd/get-shit-done-redux)"
GSD_BIN="$(read_json tools.gsd.bin get-shit-done-redux)"
GSD_VERSION="$(read_json tools.gsd.version latest)"
GSD_PROFILE="$(read_json tools.gsd.profile standard)"
GSTACK_REPO="$(read_json tools.gstack.repo https://github.com/garrytan/gstack.git)"

remove_legacy_gsd

echo "GSD 패키지 설치 중: $GSD_PACKAGE@$GSD_VERSION"
run mise exec -- npm install -g "$GSD_PACKAGE@$GSD_VERSION"

# GSD CLI 호출은 npm 글로벌 설치 직후 발생하므로, mise가 관리하는
# PATH에서 새로 등록된 bin을 찾을 수 있도록 mise exec --로 감싼다.
echo "Claude Code용 GSD runtime skill 배포 중 (profile: $GSD_PROFILE)"
run mise exec -- "$GSD_BIN" --claude --global --"$GSD_PROFILE"
echo "Codex용 GSD runtime skill 배포 중 (profile: $GSD_PROFILE)"
run mise exec -- "$GSD_BIN" --codex --global --"$GSD_PROFILE"

GSTACK_NEEDS_CLONE=0
if [ -L "$GSTACK_SOURCE_DIR" ]; then
  echo "GStack source를 symlink에서 실제 글로벌 설치 경로로 전환합니다: $GSTACK_SOURCE_DIR"
  run rm -f "$GSTACK_SOURCE_DIR"
  GSTACK_NEEDS_CLONE=1
fi

if [ "$GSTACK_NEEDS_CLONE" -eq 1 ] || [ ! -d "$GSTACK_SOURCE_DIR/.git" ]; then
  echo "GStack clone 중"
  run git clone "$GSTACK_REPO" "$GSTACK_SOURCE_DIR"
else
  echo "GStack 갱신 중"
  run git -C "$GSTACK_SOURCE_DIR" pull --ff-only
fi

if [ "$DRY_RUN" -eq 1 ]; then
  echo "dry-run: $GSTACK_SOURCE_DIR/setup --host claude --team"
  echo "dry-run: $GSTACK_SOURCE_DIR/setup --host codex --team"
elif [ -x "$GSTACK_SOURCE_DIR/setup" ]; then
  echo "Claude용 GStack team setup 실행 중"
  run "$GSTACK_SOURCE_DIR/setup" --host claude --team
  echo "Codex용 GStack team setup 실행 중"
  run "$GSTACK_SOURCE_DIR/setup" --host codex --team
else
  echo "경고: $GSTACK_SOURCE_DIR/setup 파일이 없거나 실행할 수 없습니다." >&2
fi

AGENTS_SKILLS_DIR="${AGENTS_SKILLS_DIR:-$HOME/.agents/skills}"
CODEX_SKILLS_DIR="${CODEX_SKILLS_DIR:-$HOME/.codex/skills}"
CLAUDE_SKILLS_DIR="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"

for skills_dir in "$AGENTS_SKILLS_DIR" "$CODEX_SKILLS_DIR" "$CLAUDE_SKILLS_DIR"; do
  echo "구버전 Codi 하네스 글로벌 링크 제거 중: $skills_dir"
  remove_legacy_harness_skill_links "$skills_dir"
done

cat <<'SUPERPOWERS_INSTRUCTIONS'

Superpowers는 Claude Code와 Codex 각각의 공식 plugin marketplace로 설치해야
auto-trigger와 plugin update가 정상 동작한다. 비대화형 외부 셸 설치 경로는
공식적으로 지원되지 않아 install.sh에서 자동 설치하지 않는다.

  Claude Code: 세션 안에서 다음 명령 실행
    /plugin install superpowers@claude-plugins-official

  Codex CLI: 세션 안에서 다음 명령 실행
    /plugins
    # "superpowers" 검색 → Install Plugin

이미 설치한 경우 이 단계는 건너뛰어도 된다. 설치 상태는 ./harness doctor 가
확인한다.

SUPERPOWERS_INSTRUCTIONS

echo "설치 완료. 다음으로 ./harness doctor 를 실행하세요."
