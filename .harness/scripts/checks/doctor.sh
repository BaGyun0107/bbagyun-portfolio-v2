#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)"

failures=0
warnings=0

ok() {
  printf '확인: %s\n' "$1"
}

warn() {
  warnings=$((warnings + 1))
  printf '경고: %s\n' "$1"
}

fail() {
  failures=$((failures + 1))
  printf '실패: %s\n' "$1"
}

require_file() {
  if [ -f "$ROOT_DIR/$1" ]; then
    ok "$1 존재"
  else
    fail "$1 누락"
  fi
}

require_dir() {
  if [ -d "$ROOT_DIR/$1" ]; then
    ok "$1 존재"
  else
    fail "$1 누락"
  fi
}

require_command() {
  if command -v "$1" >/dev/null 2>&1; then
    ok "$1 사용 가능"
  else
    warn "$1 사용 불가"
  fi
}

require_file "AGENTS.md"
require_file "CLAUDE.md"
require_file "README.md"
require_file "ARCHITECTURE.md"
require_file ".gitignore"
require_file ".harness/manifest.json"
require_file ".harness/shared-manifest.json"
require_file ".harness/lock.json"
require_file ".harness/config/codi-config.yaml"
require_file ".harness/config/project-profile.yaml"
require_file ".harness/prompt-style/karpathy.md"
require_file ".harness/workflow.md"
require_file ".harness/policies/orchestration-loop.md"
require_file ".harness/policies/scenario-phase-routing.md"
require_file ".harness/policies/guardrails.md"
require_file ".harness/policies/project-profile.md"
require_file ".harness/policies/tool-permissions.md"
require_file ".harness/policies/context-engineering.md"
require_file ".harness/policies/rule-lifecycle.md"
require_file "mise.toml"
require_file ".harness/scripts/setup/install.sh"
require_file ".harness/scripts/setup/update.sh"
require_file ".harness/scripts/setup/update-check.sh"
require_file ".harness/scripts/setup/init-project.sh"
require_file ".harness/scripts/setup/generate-manifest.mjs"
require_file ".harness/scripts/setup/prune-stale.mjs"
require_file ".harness/scripts/setup/project-owned.mjs"
require_file ".harness/scripts/setup/restore-missing-shared.mjs"
require_file ".harness/scripts/setup/ensure-gitignore.mjs"
require_file ".harness/config/required-gitignore.json"
require_file ".harness/scripts/setup/skills-link.sh"
require_file ".harness/scripts/checks/doctor.sh"
require_file ".harness/scripts/checks/context-check.mjs"
require_file ".harness/scripts/checks/rule-check.mjs"
require_file ".harness/scripts/checks/secret-surface-check.mjs"
require_file ".harness/scripts/checks/package-policy-check.mjs"
require_file ".harness/scripts/checks/workflow-check.sh"
require_file ".harness/scripts/tooling/profile.mjs"
require_file ".harness/scripts/deploy/dev-runner.js"
require_file ".harness/scripts/deploy/server-deploy.sh"
require_file ".harness/scripts/agent/agent-preflight.sh"
require_file ".harness/scripts/agent/codex-preflight.sh"
require_file ".harness/scripts/agent/team-session.sh"
require_file ".harness/scripts/agent/notify.mjs"
require_file ".claude/settings.json"
require_file ".claude/rules/monorepo-packages.md"
require_file ".claude/rules/work-safety.md"
require_file ".claude/rules/skill-ownership.md"
require_file ".claude/rules/phase-routing.md"
require_file ".codex/rules/monorepo-packages.rules"
require_file ".codex/rules/work-safety.rules"
require_file ".codex/rules/skill-ownership.rules"
require_file ".codex/rules/phase-routing.rules"
require_file ".harness/hooks/skill-injector.mjs"
require_file ".harness/hooks/guardrails.mjs"
require_file ".harness/hooks/decision-notifier.mjs"
require_file ".harness/hooks/project-profile-guard.mjs"
require_file ".harness/hooks/tool-permission-guard.mjs"
require_file ".harness/hooks/test-filter.mjs"
require_file ".harness/hooks/filter-test-output.sh"
require_file ".harness/hooks/hud.mjs"
require_file ".harness/config/skill-triggers.json"

require_dir ".harness/skills/codi-backend"
require_dir ".harness/skills/codi-frontend"
require_dir ".harness/skills/codi-db"
require_dir ".harness/skills/codi-dev-workflow"
require_dir ".harness/skills/codi-dependency-review"
require_dir ".harness/skills/init-project"
require_dir ".harness/skills/nestjs-expert"
require_dir ".harness/skills/codi-phase-routing"
require_dir ".harness/skills/karpathy-style"
require_dir ".harness/skills/_shared"
require_dir ".harness/skills/skill-creator"
require_dir ".harness/skills/team-mode-operator"

# .harness/skills-local은 project-owned라 update로 전파되지 않는다.
# 기존 downstream 프로젝트를 위해 없으면 doctor가 지연 생성한다.
if [ ! -d "$ROOT_DIR/.harness/skills-local" ]; then
  mkdir -p "$ROOT_DIR/.harness/skills-local"
  warn ".harness/skills-local 이 없어 빈 디렉터리를 생성했습니다 (project-owned이므로 커밋하거나 그대로 두세요)"
else
  ok ".harness/skills-local 존재"
fi
require_dir ".agents/results"

# .agents/skills와 .claude/skills는 shared/local skill symlink를 담는 merged tree다.
# 설치 전의 legacy 단일 symlink도 유효한 상태로 본다.
check_skill_tree() {
  path="$1"
  if [ -L "$ROOT_DIR/$path" ]; then
    ok "$path 은(는) symlink입니다 (구버전 layout; 머지 트리로 전환하려면 ./harness install 실행)"
    return
  fi
  if [ ! -d "$ROOT_DIR/$path" ]; then
    fail "$path 은(는) 디렉터리 또는 symlink여야 합니다"
    return
  fi
  bad=0
  for entry in "$ROOT_DIR/$path"/*; do
    [ -e "$entry" ] || [ -L "$entry" ] || continue
    if [ ! -L "$entry" ]; then
      bad=1
      fail "$path/$(basename "$entry") 은(는) symlink여야 합니다 (./harness install 실행)"
    fi
  done
  [ "$bad" -eq 0 ] && ok "$path 은(는) 머지된 skill tree입니다"
}

check_skill_tree ".agents/skills"
check_skill_tree ".claude/skills"

if [ -x "$ROOT_DIR/harness" ]; then
  ok "harness launcher 실행 가능"
else
  fail "harness launcher 실행 불가"
fi

# 스크립트는 역할별 하위 디렉터리(checks/tooling/setup/deploy/agent/audit)로
# 나뉜다. 디렉터리를 글롭으로 순회하므로 스크립트를 추가해도 이 목록을 손댈
# 필요가 없다.
for script in "$ROOT_DIR"/.harness/scripts/*/*.sh \
              "$ROOT_DIR"/.harness/scripts/*/*.mjs \
              "$ROOT_DIR"/.harness/scripts/*/*.js; do
  [ -e "$script" ] || continue
  rel="${script#"$ROOT_DIR"/}"
  if [ -x "$script" ]; then
    ok "$rel 실행 가능"
  else
    fail "$rel 실행 불가"
  fi
done

for hook in skill-injector.mjs guardrails.mjs decision-notifier.mjs project-profile-guard.mjs tool-permission-guard.mjs test-filter.mjs filter-test-output.sh hud.mjs; do
  if [ -x "$ROOT_DIR/.harness/hooks/$hook" ]; then
    ok ".harness/hooks/$hook 실행 가능"
  else
    fail ".harness/hooks/$hook 실행 불가"
  fi
done

require_command git
require_command mise
require_command npm
require_command node
require_command codex
require_command claude

if command -v cmux >/dev/null 2>&1; then
  ok "팀 모드 사용 가능 (cmux)"
elif command -v tmux >/dev/null 2>&1; then
  ok "팀 모드 사용 가능 (tmux fallback)"
else
  warn "팀 모드를 사용할 수 없습니다. ./harness team 을 쓰려면 cmux 또는 tmux를 설치하세요"
fi

# claude 바이너리는 네이티브 설치와 npm 글로벌 설치가 공존할 수 있다.
# PATH 우선순위에 따라 다른 버전이 실행되어 디버깅이 어려워지므로
# 중복 설치를 감지해서 경고한다. Anthropic은 네이티브 단일 설치를 권장한다.
if command -v claude >/dev/null 2>&1; then
  claude_paths="$(command -v -a claude 2>/dev/null || which -a claude 2>/dev/null || true)"
  claude_count="$(printf '%s\n' "$claude_paths" | grep -c '^/' || true)"
  if [ "${claude_count:-0}" -gt 1 ]; then
    warn "PATH에서 claude binary가 여러 개 감지되었습니다 (Anthropic은 native 단일 설치를 권장):"
    printf '%s\n' "$claude_paths" | sed 's/^/  - /'
  else
    ok "claude 단일 설치 확인"
  fi
fi

if command -v actionlint >/dev/null 2>&1; then
  ok "actionlint 사용 가능"
else
  warn "actionlint를 사용할 수 없어 로컬 workflow 문법 검증이 제한됩니다"
fi

if command -v pnpm >/dev/null 2>&1; then
  ok "Next.js/NestJS 앱용 pnpm 사용 가능"
else
  warn "pnpm을 사용할 수 없습니다. Next.js/NestJS 앱 workflow에는 pnpm이 필요합니다"
fi

if command -v node >/dev/null 2>&1; then
  node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$ROOT_DIR/.harness/manifest.json" \
    && ok ".harness/manifest.json JSON 유효" \
    || fail ".harness/manifest.json JSON 오류"
  node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$ROOT_DIR/.harness/shared-manifest.json" \
    && ok ".harness/shared-manifest.json JSON 유효" \
    || fail ".harness/shared-manifest.json JSON 오류"
  node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$ROOT_DIR/.harness/lock.json" \
    && ok ".harness/lock.json JSON 유효" \
    || fail ".harness/lock.json JSON 오류"

  # 목록에는 없지만 로컬에 남은 stale 공용 파일을 찾는다.
  if [ -f "$ROOT_DIR/.harness/scripts/setup/prune-stale.mjs" ] \
    && [ -f "$ROOT_DIR/.harness/shared-manifest.json" ]; then
    stale_output="$(MANIFEST_FILE="$ROOT_DIR/.harness/shared-manifest.json" \
      ROOT_DIR="$ROOT_DIR" \
      node "$ROOT_DIR/.harness/scripts/setup/prune-stale.mjs" 2>/dev/null || true)"
    if [ -z "$stale_output" ]; then
      ok "shared-manifest.json 이 worktree와 일치"
    else
      warn "shared-manifest.json drift 감지 (./harness manifest 또는 ./harness update --apply-harness 실행):"
      printf '%s\n' "$stale_output" | sed 's/^/  - /'
    fi
  fi
  node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$ROOT_DIR/.claude/settings.json" \
    && ok ".claude/settings.json JSON 유효" \
    || fail ".claude/settings.json JSON 오류"
  node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$ROOT_DIR/.harness/config/skill-triggers.json" \
    && ok ".harness/config/skill-triggers.json JSON 유효" \
    || fail ".harness/config/skill-triggers.json JSON 오류"
  node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$ROOT_DIR/.harness/config/tool-permissions.json" \
    && ok ".harness/config/tool-permissions.json JSON 유효" \
    || fail ".harness/config/tool-permissions.json JSON 오류"

  node -e "const pkg = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); process.exit(pkg.scripts && pkg.scripts.test ? 0 : 1)" "$ROOT_DIR/package.json" \
    && ok "package.json test script 정의됨" \
    || fail "package.json에 test script가 필요합니다"

  if [ -f "$ROOT_DIR/tests/harness-cli.test.mjs" ]; then
    ok "tests/harness-cli.test.mjs 존재"
  else
    fail "tests/harness-cli.test.mjs 누락"
  fi
else
  warn "node를 사용할 수 없어 JSON 검증을 건너뜁니다"
fi

if command -v mise >/dev/null 2>&1; then
  mise_node_version="$(mise exec -- node -v 2>/dev/null || true)"
  if [ -n "$mise_node_version" ]; then
    mise_node_major="$(printf '%s' "$mise_node_version" | sed 's/^v//' | cut -d. -f1)"
    expected_node_major="$(sed -n 's/^[[:space:]]*node[[:space:]]*=[[:space:]]*"\([0-9][0-9]*\).*"$/\1/p' "$ROOT_DIR/mise.toml" | head -1)"
    expected_node_major="${expected_node_major:-24}"
    if [ "$mise_node_major" = "$expected_node_major" ]; then
      ok "mise-managed node major version 확인: $mise_node_major"
    else
      warn "mise-managed node major version은 $mise_node_major 입니다. 기대값 $expected_node_major; mise install 실행"
    fi
  else
    warn "mise-managed node version을 읽을 수 없습니다"
  fi
fi

if command -v node >/dev/null 2>&1; then
  if "$ROOT_DIR/.harness/scripts/tooling/profile.mjs" check; then
    ok "project profile 검증 통과"
  else
    fail "project profile 검증 실패"
  fi

  if "$ROOT_DIR/.harness/scripts/checks/workflow-check.sh"; then
    ok "workflow 검증 완료"
  else
    fail "workflow 검증 실패"
  fi

  if "$ROOT_DIR/.harness/scripts/checks/context-check.mjs"; then
    ok "AGENTS.md 및 CLAUDE.md context parity 점검 통과"
  else
    fail "AGENTS.md 및 CLAUDE.md context parity 점검 실패"
  fi

  if "$ROOT_DIR/.harness/scripts/checks/rule-check.mjs"; then
    ok "rule lifecycle parity 점검 통과"
  else
    fail "rule lifecycle parity 점검 실패"
  fi

  if "$ROOT_DIR/.harness/scripts/checks/secret-surface-check.mjs"; then
    ok "secret surface 점검 통과"
  else
    fail "secret surface 점검 실패"
  fi

  if "$ROOT_DIR/.harness/scripts/checks/package-policy-check.mjs"; then
    ok "package policy 점검 통과"
  else
    fail "package policy 점검 실패"
  fi
else
  warn "node를 사용할 수 없어 context parity 점검을 건너뜁니다"
fi

if grep -q '"gstack": "managed-latest"' "$ROOT_DIR/.harness/lock.json" \
  && grep -q '"gsd": "external-tool-check-only"' "$ROOT_DIR/.harness/lock.json" \
  && grep -q '"superpowers": "plugin-marketplace-manual"' "$ROOT_DIR/.harness/lock.json"; then
  ok "agent integration lock policy가 외부 도구 routing과 일치"
else
  warn "agent integration lock policy가 외부 도구 routing과 일치하지 않습니다"
fi

# GSD 외부 도구 설치 검증 — install.sh 가 open-gsd npm 패키지를 깔고
# 인스톨러를 --claude / --codex 두 번 호출해 runtime skill 디렉터리에 배포한다.
if command -v get-shit-done-redux >/dev/null 2>&1; then
  ok "get-shit-done-redux CLI가 PATH에 있음"
elif command -v mise >/dev/null 2>&1 && mise exec -- sh -c 'command -v get-shit-done-redux' >/dev/null 2>&1; then
  ok "get-shit-done-redux CLI를 mise로 실행 가능"
else
  warn "get-shit-done-redux CLI를 찾지 못했습니다 — GSD 설치를 위해 ./harness install 실행"
fi

if [ -d "$HOME/.claude/skills/gsd-new-project" ] && [ -d "$HOME/.claude/skills/gsd-plan-phase" ]; then
  ok "Claude Code용 GSD runtime skill 배포됨 (~/.claude/skills/gsd-*)"
else
  warn "Claude Code용 GSD runtime skill 누락 (예상: ~/.claude/skills/gsd-*) — ./harness install 실행"
fi

if [ -d "$HOME/.codex/skills/gsd-new-project" ] && [ -d "$HOME/.codex/skills/gsd-plan-phase" ]; then
  ok "Codex용 GSD runtime skill 배포됨 (~/.codex/skills/gsd-*)"
else
  warn "Codex용 GSD runtime skill 누락 (예상: ~/.codex/skills/gsd-*) — ./harness install 실행"
fi

# Superpowers는 install.sh 가 자동 설치하지 않으며 plugin marketplace 경유다.
# Claude Code plugin은 ~/.claude/plugins/superpowers, Codex plugin은
# ~/.codex/plugins/superpowers 아래에 노출된다 (런타임이 marketplace install로 만든다).
if [ -d "$HOME/.claude/plugins/superpowers" ] || [ -d "$HOME/.claude/plugins/superpowers@claude-plugins-official" ]; then
  ok "Claude Code용 Superpowers plugin 설치됨"
else
  warn "Claude Code용 Superpowers plugin 미감지 — Claude Code에서 /plugin install superpowers@claude-plugins-official 실행"
fi

if [ -d "$HOME/.codex/plugins/superpowers" ]; then
  ok "Codex용 Superpowers plugin 설치됨"
else
  warn "Codex용 Superpowers plugin 미감지 — Codex에서 /plugins 실행 후 superpowers 설치"
fi

printf '\n하네스 doctor 완료: 실패 %s개, 경고 %s개\n' "$failures" "$warnings"

if [ "$failures" -gt 0 ]; then
  exit 1
fi
