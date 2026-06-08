#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)"
DEFAULT_SESSION="$(printf '%s' "$(basename "$ROOT_DIR")" | tr -c 'A-Za-z0-9_-' '-')"

AGENT="codex"
SESSION_NAME=""
DRY_RUN=0
CMUX_BIN=""

usage() {
  cat <<'EOF'
사용법:
  ./harness team [codex|claude] [--session <name>] [--dry-run]
  ./harness team [--agent codex|claude] [--session <name>] [--dry-run]

팀 모드는 선택 실행 방식입니다. 공통 하네스 preflight를 한 번 실행한 뒤,
macOS에서 cmux를 사용할 수 있으면 cmux로, 아니면 tmux로 role별 agent pane을 시작합니다.
EOF
}

die() {
  printf '오류: %s\n' "$1" >&2
  exit "${2:-1}"
}

shell_quote() {
  escaped="$(printf '%s' "$1" | sed "s/'/'\"'\"'/g")"
  printf "'%s'" "$escaped"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --agent)
      [ "$#" -ge 2 ] || die "--agent 에는 codex 또는 claude 값이 필요합니다." 2
      AGENT="$2"
      shift 2
      ;;
    --agent=*)
      AGENT="${1#--agent=}"
      shift
      ;;
    --session)
      [ "$#" -ge 2 ] || die "--session 에는 이름이 필요합니다." 2
      SESSION_NAME="$2"
      shift 2
      ;;
    --session=*)
      SESSION_NAME="${1#--session=}"
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    codex|claude)
      AGENT="$1"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      die "알 수 없는 옵션입니다: $1" 2
      ;;
  esac
done

case "$AGENT" in
  codex|claude) ;;
  *) die "지원하지 않는 agent입니다: $AGENT" 2 ;;
esac

if [ -z "$SESSION_NAME" ]; then
  SESSION_NAME="$DEFAULT_SESSION-$AGENT-team"
fi

ROOT_Q="$(shell_quote "$ROOT_DIR")"
SHELL_Q="$(shell_quote "${SHELL:-/bin/sh}")"

role_command() {
  role="$1"
  if [ "$role" = "shell" ]; then
    printf 'cd %s && CODI_TEAM_ROLE=shell CODI_AGENT_ROLE=shell exec %s' "$ROOT_Q" "$SHELL_Q"
  else
    printf 'cd %s && CODI_TEAM_ROLE=%s CODI_AGENT_ROLE=%s exec %s' "$ROOT_Q" "$role" "$role" "$AGENT"
  fi
}

print_plan() {
  cat <<EOF
팀 모드 실행 계획
  세션: $SESSION_NAME
  agent: $AGENT
  우선 backend: cmux -> tmux
  preflight: .harness/scripts/agent/agent-preflight.sh $AGENT

Roles
EOF
  for role in orchestrator planner implementer reviewer qa shell; do
    printf '  - %s: %s\n' "$role" "$(role_command "$role")"
  done
}

find_cmux() {
  if command -v cmux >/dev/null 2>&1; then
    command -v cmux
    return 0
  fi

  if [ -x /Applications/cmux.app/Contents/Resources/bin/cmux ]; then
    printf '%s\n' /Applications/cmux.app/Contents/Resources/bin/cmux
    return 0
  fi

  return 1
}

send_cmux_command() {
  "$CMUX_BIN" send "$1
"
}

cmux_status_start() {
  "$CMUX_BIN" set-status harness "team:$AGENT" --priority 80 >/dev/null 2>&1 || true
  "$CMUX_BIN" log --level progress --source harness "$SESSION_NAME 시작 중 ($AGENT)" >/dev/null 2>&1 || true
}

cmux_status_ready() {
  "$CMUX_BIN" log --level success --source harness "팀 workspace 준비 완료: $SESSION_NAME" >/dev/null 2>&1 || true
  "$CMUX_BIN" notify --title "Harness Team Mode" --body "$SESSION_NAME 시작 완료 ($AGENT)" >/dev/null 2>&1 || true
}

launch_cmux() {
  [ "$(uname -s 2>/dev/null || printf unknown)" = "Darwin" ] || return 1
  CMUX_BIN="$(find_cmux)" || return 1
  "$CMUX_BIN" ping >/dev/null 2>&1 || return 1

  "$CMUX_BIN" new-workspace >/dev/null
  cmux_status_start
  send_cmux_command "$(role_command orchestrator)"
  "$CMUX_BIN" new-split right >/dev/null
  send_cmux_command "$(role_command planner)"
  "$CMUX_BIN" new-split down >/dev/null
  send_cmux_command "$(role_command implementer)"
  "$CMUX_BIN" new-split right >/dev/null
  send_cmux_command "$(role_command reviewer)"
  "$CMUX_BIN" new-split down >/dev/null
  send_cmux_command "$(role_command qa)"
  "$CMUX_BIN" new-split down >/dev/null
  send_cmux_command "$(role_command shell)"
  cmux_status_ready
  printf 'cmux 팀 workspace 시작 완료: %s\n' "$SESSION_NAME"
}

set_tmux_pane_titles() {
  tmux set-window-option -t "$SESSION_NAME:team" pane-border-status top >/dev/null
  tmux set-window-option -t "$SESSION_NAME:team" pane-border-format ' #{?pane_active,#[reverse],}#{@codi_role} ' >/dev/null
  tmux set-option -pt "$SESSION_NAME:team.0" @codi_role "orchestrator" >/dev/null
  tmux set-option -pt "$SESSION_NAME:team.1" @codi_role "planner" >/dev/null
  tmux set-option -pt "$SESSION_NAME:team.2" @codi_role "implementer" >/dev/null
  tmux set-option -pt "$SESSION_NAME:team.3" @codi_role "reviewer" >/dev/null
  tmux set-option -pt "$SESSION_NAME:team.4" @codi_role "qa" >/dev/null
  tmux select-pane -t "$SESSION_NAME:team.0" -T "orchestrator" >/dev/null
  tmux select-pane -t "$SESSION_NAME:team.1" -T "planner" >/dev/null
  tmux select-pane -t "$SESSION_NAME:team.2" -T "implementer" >/dev/null
  tmux select-pane -t "$SESSION_NAME:team.3" -T "reviewer" >/dev/null
  tmux select-pane -t "$SESSION_NAME:team.4" -T "qa" >/dev/null

  tmux set-window-option -t "$SESSION_NAME:shell" pane-border-status top >/dev/null
  tmux set-window-option -t "$SESSION_NAME:shell" pane-border-format ' #{@codi_role} ' >/dev/null
  tmux set-option -pt "$SESSION_NAME:shell.0" @codi_role "shell" >/dev/null
  tmux select-pane -t "$SESSION_NAME:shell.0" -T "shell" >/dev/null
}

launch_tmux() {
  command -v tmux >/dev/null 2>&1 || return 1

  if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    die "tmux session이 이미 존재합니다: $SESSION_NAME" 1
  fi

  tmux new-session -d -s "$SESSION_NAME" -n team "$(role_command orchestrator)"
  tmux split-window -t "$SESSION_NAME:team" -h "$(role_command planner)"
  tmux select-pane -t "$SESSION_NAME:team.0"
  tmux split-window -t "$SESSION_NAME:team" -v "$(role_command implementer)"
  tmux select-pane -t "$SESSION_NAME:team.1"
  tmux split-window -t "$SESSION_NAME:team" -v "$(role_command reviewer)"
  tmux select-pane -t "$SESSION_NAME:team.2"
  tmux split-window -t "$SESSION_NAME:team" -v "$(role_command qa)"
  tmux select-layout -t "$SESSION_NAME:team" tiled >/dev/null
  tmux new-window -t "$SESSION_NAME" -n shell "$(role_command shell)"
  set_tmux_pane_titles
  tmux select-window -t "$SESSION_NAME:team"
  tmux attach-session -t "$SESSION_NAME"
}

if [ "$DRY_RUN" -eq 1 ]; then
  print_plan
  exit 0
fi

"$ROOT_DIR/.harness/scripts/agent/agent-preflight.sh" "$AGENT"

if launch_cmux; then
  exit 0
fi

if launch_tmux; then
  exit 0
fi

cat >&2 <<EOF
오류: 팀 모드는 macOS의 cmux 또는 tmux가 필요합니다.

아래 중 하나를 설치하세요:
  - cmux: https://cmux.com/
  - tmux: brew install tmux

수동 대체 실행:
  ./harness codex
  ./harness claude

role 명령을 확인하려면 './harness team --dry-run'을 실행하세요.
EOF
exit 1
