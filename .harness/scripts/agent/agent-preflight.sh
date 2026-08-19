#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)"
AGENT_NAME="${1:-agent}"

# 프로젝트 소유 규칙(specs/020) 안내: .harness/rules-local/*.md 가 있으면
# 목록을 먼저 출력한다 — Codex 는 매 턴 훅이 없어 진입점 안내가 유일한
# 주입 채널이고, Claude 는 .claude/rules/local 링크로도 상시 로드된다.
rules_local_list=""
for rules_local_file in "$ROOT_DIR/.harness/rules-local"/*.md; do
  [ -f "$rules_local_file" ] || continue
  rules_local_list="$rules_local_list ${rules_local_file##*/}"
done
if [ -n "$rules_local_list" ]; then
  printf '[rules-local] 프로젝트 규칙 로드 대상:%s (.harness/rules-local/)\n' "$rules_local_list"
fi

# lock 모드(specs/005): pending 버전을 에이전트 시작 전에 반영하고(즉시,
# 로컬 연산), 새 버전 감지·수신은 detach 백그라운드로 돌린다. exec 이전
# 반영이므로 이번 세션이 읽는 트리는 항상 단일 버전이다 (FR-004, R5).
if [ -f "$ROOT_DIR/harness.lock" ]; then
  (cd "$ROOT_DIR" && sh "$ROOT_DIR/.harness/scripts/pkg/pkg-apply-pending.sh")
  ( (cd "$ROOT_DIR" && sh "$ROOT_DIR/.harness/scripts/pkg/pkg-update-check.sh" >/dev/null 2>&1 &) & ) || true
fi

if [ "${HARNESS_AUTO_UPDATE:-1}" != "0" ]; then
  "$ROOT_DIR/.harness/scripts/setup/update-check.sh" --background

  if [ "${HARNESS_AUTO_APPLY:-0}" = "1" ]; then
    "$ROOT_DIR/.harness/scripts/setup/update.sh" --auto
  fi
fi

# 마지막 preflight 이후 추가된 shared/local skill을 agent tree에 반영한다.
"$ROOT_DIR/.harness/scripts/setup/skills-link.sh"

# Playwright MCP 양 런타임 등록 패리티 점검 (비차단 — 누락 시 안내만 출력)
mise exec -- node "$ROOT_DIR/.harness/scripts/checks/mcp-registration-check.mjs" --quiet || true

if ! mise exec -- node "$ROOT_DIR/.harness/scripts/checks/context-check.mjs" >/dev/null; then
  mise exec -- node "$ROOT_DIR/.harness/scripts/checks/context-check.mjs"
  exit 1
fi

mise exec -- node -e "for (const file of process.argv.slice(1)) JSON.parse(require('fs').readFileSync(file, 'utf8'))" \
  "$ROOT_DIR/.harness/manifest.json" \
  "$ROOT_DIR/.harness/config/skill-triggers.json" \
  "$ROOT_DIR/.harness/config/tool-permissions.json" >/dev/null

printf '%s' '{"prompt":"npm audit 취약점 Renovate package-lock 업데이트 리뷰"}' \
  | CLAUDE_PROJECT_DIR="$ROOT_DIR" mise exec -- node "$ROOT_DIR/.harness/hooks/skill-injector.mjs" >/dev/null

if [ "$AGENT_NAME" = "codex" ]; then
  cat <<'EOF'
[phase-routing] Checklist: spec? unchecked tasks? subagents? Codi skills? commit permission?
[phase-routing] Routing details: .harness/policies/scenario-phase-routing.md
EOF
fi

printf '하네스 preflight 완료: %s\n' "$AGENT_NAME"
