#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)"
AGENT_NAME="${1:-agent}"

if [ "${HARNESS_AUTO_UPDATE:-1}" != "0" ]; then
  "$ROOT_DIR/.harness/scripts/setup/update-check.sh"

  if [ "${HARNESS_AUTO_APPLY:-1}" != "0" ]; then
    "$ROOT_DIR/.harness/scripts/setup/update.sh" --apply-harness --auto
  fi
fi

# 마지막 preflight 이후 추가된 shared/local skill을 agent tree에 반영한다.
"$ROOT_DIR/.harness/scripts/setup/skills-link.sh"

mise exec -- node "$ROOT_DIR/.harness/scripts/checks/context-check.mjs"

for json_file in \
  "$ROOT_DIR/.harness/manifest.json" \
  "$ROOT_DIR/.harness/config/skill-triggers.json" \
  "$ROOT_DIR/.harness/config/tool-permissions.json"; do
  mise exec -- node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$json_file" >/dev/null
done

printf '%s' '{"prompt":"npm audit 취약점 Renovate package-lock 업데이트 리뷰"}' \
  | CLAUDE_PROJECT_DIR="$ROOT_DIR" mise exec -- node "$ROOT_DIR/.harness/hooks/skill-injector.mjs" >/dev/null

if [ "$AGENT_NAME" = "codex" ]; then
  cat <<'EOF'
[phase-routing] 새 Medium 이상 작업 전에는 GSD progress/manager로 .planning 상태를 확인하고, 진행 중이거나 일시정지된 작업을 먼저 이어가세요.
[phase-routing] Size: Small은 방향/범위/되돌림/직접 검증이 고정된 경우만 해당합니다. agent가 조사·수정·검증 대상을 판단해야 하면 Medium, production/data/security/deploy 위험은 Large+입니다.
[phase-routing] Flow: P1 strategy -> P2 GSD plan -> P3 execution discipline -> P4 review/QA -> P5 ship/complete. 상세: .harness/policies/scenario-phase-routing.md.
EOF
fi

printf '하네스 preflight 완료: %s\n' "$AGENT_NAME"
