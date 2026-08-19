#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)"
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

run mkdir -p "$ROOT_DIR/.harness/state"
run mkdir -p "$ROOT_DIR/.agents/results" "$ROOT_DIR/.claude" "$ROOT_DIR/.codex"

echo "하네스 채널 설치 중: $CHANNEL"

if ! command -v git >/dev/null 2>&1; then
  echo "git이 필요합니다." >&2
  exit 1
fi

if ! command -v mise >/dev/null 2>&1; then
  echo "Node.js 24 및 npm runtime 관리를 위해 mise가 필요합니다." >&2
  exit 1
fi

# 새 clone 경로는 mise가 설정을 신뢰하지 않아 install이 실패한다
# (bootstrap과 동일한 처리 — 재실행 안전).
run sh -c "cd '$ROOT_DIR' && mise trust >/dev/null 2>&1 || true"
run mise install

# 루트 npm 의존성(husky·lint-staged)을 설치한다. `prepare: husky`가 실행돼야
# .husky pre-commit 훅이 활성화되므로 온보딩 필수 단계다. node_modules가
# 이미 있으면 건너뛴다(재실행 안전, doctor가 드리프트를 경고).
if [ -f "$ROOT_DIR/package.json" ] && [ ! -d "$ROOT_DIR/node_modules" ]; then
  if [ -f "$ROOT_DIR/package-lock.json" ]; then
    run sh -c "cd '$ROOT_DIR' && mise exec -- npm ci"
  else
    run sh -c "cd '$ROOT_DIR' && mise exec -- npm install"
  fi
fi

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
  for skill in codi-phase-routing karpathy-style codi-backend codi-frontend codi-db codi-dev-workflow codi-dependency-review init-project nestjs-expert; do
    link_path="$skills_dir/$skill"
    if [ -L "$link_path" ]; then
      link_target="$(readlink "$link_path" || true)"
      if [ "$link_target" = "$ROOT_DIR/.harness/skills/$skill" ]; then
        run rm -f "$link_path"
      fi
    fi
  done
}

build_merged_skill_trees
"$ROOT_DIR/.harness/scripts/setup/place-speckit-assets.sh"
remove_project_skill_root ".codex/skills"

# planning engine은 Spec Kit이며, 하네스는 고정 버전의 vendored assets를
# place-speckit-assets.sh로 배치한다. upstream 버전 갱신은 하네스 레포에서
# ./harness speckit-vendor <tag>로만 수행한다.

AGENTS_SKILLS_DIR="${AGENTS_SKILLS_DIR:-$HOME/.agents/skills}"
CODEX_SKILLS_DIR="${CODEX_SKILLS_DIR:-$HOME/.codex/skills}"
CLAUDE_SKILLS_DIR="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"

for skills_dir in "$AGENTS_SKILLS_DIR" "$CODEX_SKILLS_DIR" "$CLAUDE_SKILLS_DIR"; do
  echo "구버전 Codi 하네스 글로벌 링크 제거 중: $skills_dir"
  remove_legacy_harness_skill_links "$skills_dir"
done

cat <<'SUPERPOWERS_INSTRUCTIONS'

Superpowers는 Claude Code와 Codex 각각의 공식 plugin marketplace로 설치해야
auto-trigger와 plugin update가 정상 동작한다. Claude Code는 셸 CLI로
비대화식 설치가 가능하며(./harness bootstrap 이 자동 시도), Codex는 세션 안
설치만 지원된다.

  Claude Code: 셸에서 실행 (또는 세션 안 /plugin install)
    claude plugin install superpowers@claude-plugins-official

  Codex CLI: 세션 안에서 다음 명령 실행
    /plugins
    # "superpowers" 검색 → Install Plugin

이미 설치한 경우 이 단계는 건너뛰어도 된다. 설치 상태는 ./harness doctor 가
확인한다.

SUPERPOWERS_INSTRUCTIONS

# planning engine(Spec Kit)은 vendored assets 배치 후 doctor가 상태를 검증한다.
if [ -d ".specify" ]; then
  echo "Spec Kit vendored assets 배치 확인: .specify/ 존재 (통합 상태는 ./harness doctor 가 확인)"
else
  cat <<'SPECKIT_INSTRUCTIONS'

Spec Kit(planning engine) 자산이 아직 이 프로젝트에 배치되지 않았습니다.
하네스 레포의 vendored assets를 다시 배치하려면 프로젝트 루트에서 실행합니다.

  ./harness install

하네스 레포에서 vendored Spec Kit 버전을 갱신할 때만
`./harness speckit-vendor <tag>`를 사용합니다.

SPECKIT_INSTRUCTIONS
fi

# Playwright MCP 양 런타임 등록 (버전 핀 단일 소스: mcp-registration-check.mjs)
MCP_CHECK="$ROOT_DIR/.harness/scripts/checks/mcp-registration-check.mjs"
if [ -f "$MCP_CHECK" ] && command -v node >/dev/null 2>&1; then
  MCP_PIN="$(node "$MCP_CHECK" --version)"
  if ! node "$MCP_CHECK" --strict >/dev/null 2>&1; then
    if command -v claude >/dev/null 2>&1; then
      claude mcp add --scope user playwright -- npx "@playwright/mcp@$MCP_PIN" || true
    fi
    if [ -f "$HOME/.codex/config.toml" ] \
      && ! grep -q '^\[mcp_servers\.playwright\]' "$HOME/.codex/config.toml"; then
      printf '\n[mcp_servers.playwright]\ncommand = "npx"\nargs = ["@playwright/mcp@%s"]\n' \
        "$MCP_PIN" >> "$HOME/.codex/config.toml"
    fi
    node "$MCP_CHECK" || true
  fi
  # Chromium 바이너리는 멱등 설치 — 이미 있으면 playwright가 즉시 통과한다.
  # 실패해도 bootstrap을 막지 않는다 (첫 QA 시도 시 안내가 다시 나온다).
  echo "Playwright MCP: Chromium 바이너리 확인/설치 중"
  run npx playwright install chromium || \
    echo "경고: Chromium 설치 실패 — 수동 실행: npx playwright install chromium" >&2
fi

echo "설치 완료. 다음으로 ./harness doctor 를 실행하세요."
