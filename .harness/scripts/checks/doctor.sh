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

# 정식 하네스 repo 클론인지 판별한다(origin canonical 매칭).
# init-project.sh 의 is_harness_clone 과 동형이며, 하네스 전용 검사를
# 다운스트림에서 건너뛰기 위해 쓴다. 단순 substring 대신 canonical
# owner/repo/host 로만 판별한다.
is_harness_repo() {
  if ! git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    return 1
  fi
  origin_url="$(git -C "$ROOT_DIR" remote get-url origin 2>/dev/null || true)"
  if [ -n "$origin_url" ]; then
    origin_url="${origin_url%/}"
    origin_url="${origin_url%.git}"
    case "$origin_url" in
      https://github.com/CODIWORKS-Engineer/codi-harness|\
      https://github.com/CODIWORKS-Engineer/codi-harness-v2|\
      git@github.com:CODIWORKS-Engineer/codi-harness|\
      git@github.com:CODIWORKS-Engineer/codi-harness-v2|\
      ssh://git@github.com/CODIWORKS-Engineer/codi-harness|\
      ssh://git@github.com/CODIWORKS-Engineer/codi-harness-v2)
        return 0
        ;;
    esac
    return 1
  fi
  # 원격이 전혀 없는 fresh local clone 만 v1/v2 branch marker 를 허용한다.
  if [ -n "$(git -C "$ROOT_DIR" remote 2>/dev/null || true)" ]; then
    return 1
  fi
  if git -C "$ROOT_DIR" show-ref --verify --quiet refs/heads/v1 ||
     git -C "$ROOT_DIR" show-ref --verify --quiet refs/heads/v2; then
    return 0
  fi
  return 1
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
require_file ".harness/config/feature-definition-schema.json"
require_file ".harness/prompt-style/karpathy.md"
require_file ".harness/workflow.md"
require_file ".harness/policies/orchestration-loop.md"
require_file ".harness/policies/scenario-phase-routing.md"
require_file ".harness/policies/guardrails.md"
require_file ".harness/policies/project-profile.md"
require_file ".harness/policies/tool-permissions.md"
require_file ".harness/policies/context-engineering.md"
require_file ".harness/policies/rule-lifecycle.md"
require_file ".harness/policies/api-contract-first.md"
require_file "mise.toml"
require_file ".harness/scripts/setup/install.sh"
require_file ".harness/scripts/setup/place-speckit-assets.sh"
require_file ".harness/scripts/setup/speckit-vendor.sh"
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
require_file ".harness/scripts/checks/codex-rules-load.sh"
require_file ".harness/scripts/checks/secret-surface-check.mjs"
require_file ".harness/scripts/checks/package-policy-check.mjs"
require_file ".harness/scripts/checks/speckit-drift-check.mjs"
require_file ".harness/scripts/checks/workflow-check.sh"
require_file ".harness/scripts/docs/lib/feature-definition-schema.mjs"
require_file ".harness/scripts/tooling/profile.mjs"
require_file ".harness/scripts/tooling/role.mjs"
require_file ".harness/scripts/deploy/dev-runner.js"
require_file ".harness/scripts/deploy/server-deploy.sh"
require_file ".harness/scripts/agent/agent-preflight.sh"
require_file ".harness/scripts/agent/notify.mjs"
require_file ".claude/settings.json"
# lock 모드(specs/006)에서는 공유 룰이 .claude/rules/shared/ 링크 경유로
# 제공된다 — 두 위치 중 하나면 충족.
require_rule() {
  rel="$1"
  base="${rel#.claude/rules/}"
  if [ -e "$ROOT_DIR/$rel" ] ||
     [ -e "$ROOT_DIR/.claude/rules/shared/$base" ]; then
    ok "$rel 사용 가능"
  else
    fail "$rel 누락"
  fi
}
require_rule ".claude/rules/monorepo-packages.md"
require_rule ".claude/rules/work-safety.md"
require_rule ".claude/rules/skill-ownership.md"
require_rule ".claude/rules/phase-routing.md"
require_rule ".claude/rules/e2e-validation.md"
require_rule ".claude/rules/tool-call-payload-safety.md"
require_rule ".claude/rules/php-monolith.md"
require_file ".codex/rules/monorepo-packages.rules"
require_file ".codex/rules/work-safety.rules"
require_file ".codex/rules/skill-ownership.rules"
require_file ".codex/rules/phase-routing.rules"
require_file ".codex/rules/e2e-validation.rules"
require_file ".codex/rules/php-monolith.rules"
require_file ".harness/hooks/skill-injector.mjs"
require_file ".harness/hooks/guardrails.mjs"
require_file ".harness/hooks/codex-pretooluse.mjs"
require_file ".codex/hooks.json"

# mise.toml 파손은 `mise exec`로 도는 모든 guard 훅을 조용히 무력화한다
# (훅 인프라 실패 = non-blocking = 도구가 무방비로 진행). 파싱 가능 여부를
# 명시적으로 점검해 그 침묵 실패 모드를 doctor에서 크게 드러낸다.
if command -v mise >/dev/null 2>&1; then
  if (cd "$ROOT_DIR" && mise tasks ls >/dev/null 2>&1); then
    ok "mise.toml 파싱 정상 (guard 훅 실행 경로 유효)"
  else
    fail "mise.toml 파싱 실패 — mise exec 기반 guard 훅이 전부 무력화된 상태"
  fi
fi
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

# .harness/skills-local은 project-owned라 update로 전파되지 않는다.
# 기존 downstream 프로젝트를 위해 없으면 doctor가 지연 생성한다.
if [ ! -d "$ROOT_DIR/.harness/skills-local" ]; then
  mkdir -p "$ROOT_DIR/.harness/skills-local"
  warn ".harness/skills-local 이 없어 빈 디렉터리를 생성했습니다 (project-owned이므로 커밋하거나 그대로 두세요)"
else
  ok ".harness/skills-local 존재"
fi
require_dir ".agents/results"

# 루트 npm 의존성이 없으면 `prepare: husky`가 실행되지 않아 pre-commit 훅이
# 비활성 상태다 — 조용한 가드 손실이므로 경고한다.
if [ -f "$ROOT_DIR/package.json" ] && [ ! -d "$ROOT_DIR/node_modules" ]; then
  warn "루트 npm 의존성이 설치되지 않았습니다 (husky pre-commit 훅 비활성) — ./harness install 또는 npm ci 를 실행하세요"
else
  ok "루트 npm 의존성 설치됨"
fi

if [ -f "$ROOT_DIR/.harness/vendor/speckit/VENDOR-INFO.json" ] && command -v node >/dev/null 2>&1; then
  speckit_line="$(node - "$ROOT_DIR/.harness/vendor/speckit/VENDOR-INFO.json" <<'NODE'
const fs = require('fs');
const info = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const version = info.speckit_version || 'unknown';
const date = info.vendored_at || 'unknown-date';
console.log(`speckit vendored: ${version} (${date})`);
NODE
)"
  ok "$speckit_line"
else
  warn "speckit vendored asset stamp 없음 (.harness/vendor/speckit/VENDOR-INFO.json)"
fi

# 전역 이전 게이트 도구 잔재 (018 제거 후 팀원 머신 정리 안내 — 비차단)
if [ -x "$ROOT_DIR/.harness/scripts/setup/gstack-cleanup.sh" ]; then
  if "$ROOT_DIR/.harness/scripts/setup/gstack-cleanup.sh" --quiet; then
    ok "전역 이전 게이트 도구 잔재 없음"
  else
    warn "전역에 이전 게이트 도구 잔재가 있습니다 — ./harness gstack-cleanup 으로 확인하세요 (디렉터리는 --apply, 사용자 settings.json 훅은 안내에 따라 수동 제거)"
  fi
fi

# Playwright MCP 양 런타임 등록 패리티 (핀 버전은 점검 스크립트가 단일 소스)
if command -v node >/dev/null 2>&1 \
  && node "$ROOT_DIR/.harness/scripts/checks/mcp-registration-check.mjs" --strict >/dev/null 2>&1; then
  ok "Playwright MCP 등록 (claude + codex, 핀 일치)"
else
  warn "Playwright MCP 미등록 또는 핀 불일치 — ./harness install 실행 또는 수동 등록 (node .harness/scripts/checks/mcp-registration-check.mjs 로 상세 확인)"
fi

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
  external=0
  for entry in "$ROOT_DIR/$path"/*; do
    [ -e "$entry" ] || [ -L "$entry" ] || continue
    [ -L "$entry" ] && continue
    if [ -d "$entry" ]; then
      # Spec Kit 등 외부 도구가 같은 트리에 직접 설치한 실제 스킬 디렉터리는
      # harness 소유가 아니므로 허용한다(skills-link.sh와 동일한 정책).
      external=$((external + 1))
      continue
    fi
    bad=1
    fail "$path/$(basename "$entry") 은(는) symlink 또는 외부 소유 디렉터리여야 합니다 (./harness install 실행)"
  done
  if [ "$bad" -eq 0 ]; then
    if [ "$external" -gt 0 ]; then
      ok "$path 은(는) 머지된 skill tree입니다 (외부 소유 스킬 $external 개 공존)"
    else
      ok "$path 은(는) 머지된 skill tree입니다"
    fi
  fi
}

check_skill_tree ".agents/skills"
check_skill_tree ".claude/skills"

if [ -x "$ROOT_DIR/harness" ]; then
  ok "harness launcher 실행 가능"
else
  fail "harness launcher 실행 불가"
fi

# 배포 모드 보고 (specs/014 FR-008). copy 는 아직 지원되는 상태라 fail/warn 이
# 아니라 둘 다 ok 다 — 이 줄이 집계를 바꾸면 다운스트림 CI 의 기대값이 깨진다.
if [ -f "$ROOT_DIR/harness.lock" ]; then
  # 버전은 .harness/current 심링크 대상의 디렉터리 이름이 유일한 근거다.
  # 링크가 아직 없는 전환 직후 상태에서는 버전을 단정하지 않는다.
  if [ -L "$ROOT_DIR/.harness/current" ]; then
    deploy_version="$(basename "$(readlink "$ROOT_DIR/.harness/current")")"
    ok "배포 모드 lock (버전 $deploy_version)"
  else
    ok "배포 모드 lock (버전 미확정 — ./harness pkg-sync 실행)"
  fi
else
  ok "배포 모드 copy — 전환하려면 ./harness migrate"
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
      warn "shared-manifest.json drift 감지 (./harness manifest 또는 ./harness update 실행):"
      printf '%s\n' "$stale_output" | sed 's/^/  - /'
      # prune-stale 출력은 정의상 로컬 manifest 에 없는 파일 = 배포 이력이
      # 없는 파일이다 (specs/020). 다운스트림에서는 update 가 이들을 삭제하지
      # 않고 보존하므로 이전 안내를 붙인다. 하네스 업스트림에서는 drift 가
      # "manifest 재생성 필요"를 뜻하므로 안내를 생략한다.
      if ! is_harness_repo; then
        printf '  힌트: 하네스가 배포한 적 없는 프로젝트 파일이면 .harness/rules-local/ 로 옮기세요 (project-owned 보호).\n'
      fi
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
  node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$ROOT_DIR/.harness/config/feature-definition-schema.json" \
    && ok ".harness/config/feature-definition-schema.json JSON 유효" \
    || fail ".harness/config/feature-definition-schema.json JSON 오류"

  # tests/ 와 그 test script 는 하네스 repo 전용이다(project-owned 라 다운스트림
  # 으로 전파되지 않는다). 다운스트림에서는 이 둘을 강제하지 않는다.
  if is_harness_repo; then
    node -e "const pkg = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); process.exit(pkg.scripts && pkg.scripts.test ? 0 : 1)" "$ROOT_DIR/package.json" \
      && ok "package.json test script 정의됨" \
      || fail "package.json에 test script가 필요합니다"

    if [ -f "$ROOT_DIR/tests/harness-cli.test.mjs" ]; then
      ok "tests/harness-cli.test.mjs 존재"
    else
      fail "tests/harness-cli.test.mjs 누락"
    fi
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

  # 실제 codex 파서로 .codex/rules/ 로드 가능성을 확인한다. 깨진 룰 파일 하나가
  # 전체 디렉터리 로드를 막아 모든 Codex 가드레일을 무력화하기 때문이다.
  # codex가 없으면 스크립트가 스스로 skip(exit 0)한다.
  if "$ROOT_DIR/.harness/scripts/checks/codex-rules-load.sh"; then
    ok ".codex/rules 실파서 로드 점검 통과 (또는 codex 미설치로 skip)"
  else
    fail ".codex/rules 실파서 로드 점검 실패 (깨진 .rules 파일이 전체 로드를 막음)"
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

if grep -q '"playwright-mcp": "pinned-version"' "$ROOT_DIR/.harness/lock.json" \
  && grep -q '"superpowers": "plugin-marketplace-manual"' "$ROOT_DIR/.harness/lock.json"; then
  ok "agent integration lock policy가 외부 도구 routing과 일치"
else
  warn "agent integration lock policy가 외부 도구 routing과 일치하지 않습니다"
fi

# Spec Kit은 하네스가 vendored assets를 배치한다. 미설치면 안내만 출력하고
# (실패/경고 카운터에 안 잡음 — 새 프로젝트의 정상 초기 상태), 설치돼 있으면
# 실제 런타임 진입점인 speckit-* skill 파일로 듀얼 런타임(claude+codex)
# 통합을 검증한다. .specify/integrations/*.manifest.json은 upstream specify
# integration install 경로의 산출물이라 하네스 vendored install에는 없어도 정상이다.
speckit_ref="$(node - "$ROOT_DIR/.harness/lock.json" <<'NODE' 2>/dev/null || printf 'git+https://github.com/github/spec-kit.git@v0.12.7\n'
const fs = require('fs');
const lock = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const pkg = lock.tools?.speckit?.package || 'git+https://github.com/github/spec-kit.git';
const version = lock.tools?.speckit?.version || 'v0.12.7';
console.log(`${pkg}@${version}`);
NODE
)"
if [ -d "$ROOT_DIR/.specify" ]; then
  ok "Spec Kit 설치됨 (.specify/ 존재)"
  if [ -f "$ROOT_DIR/.claude/skills/speckit-specify/SKILL.md" ]; then
    ok "Spec Kit claude 통합 설치됨"
  else
    warn "Spec Kit claude skill이 없습니다 — 실행: ./harness install"
  fi
  if [ -f "$ROOT_DIR/.agents/skills/speckit-specify/SKILL.md" ]; then
    ok "Spec Kit codex 통합 설치됨"
  else
    warn "Spec Kit codex skill이 없습니다 — 실행: ./harness install"
  fi
  # constitution은 상태 기반으로 점검한다: 플레이스홀더 템플릿 그대로면
  # plan/analyze의 Constitution Check 게이트가 무력화된 상태다. 이미 기능이
  # 진행 중인(specs/ 존재) 프로젝트는 경고, 첫 기능 전이면 안내만 한다.
  constitution_file="$ROOT_DIR/.specify/memory/constitution.md"
  if [ ! -f "$constitution_file" ] || grep -Fq "[PROJECT_NAME]" "$constitution_file"; then
    if [ -d "$ROOT_DIR/specs" ]; then
      warn "constitution이 플레이스홀더 템플릿 그대로입니다 — plan/analyze의 Constitution Check가 무력화됩니다. 다음 기능 전에 speckit-constitution을 실행하세요"
    else
      printf '안내: 첫 기능 시작 전에 speckit-constitution을 한 번 실행해 프로젝트 헌법을 작성하세요.\n'
    fi
  else
    ok "Spec Kit constitution 작성됨"
  fi
else
  printf '안내: Spec Kit(planning engine)이 이 프로젝트에 설치되지 않았습니다.\n'
  printf '  설치(3명령): README의 "Spec Kit 설치" 절 참고\n'
  printf '  uvx --from %s specify init --here\n' "$speckit_ref"
fi

# specs/ 를 쓰는 프로젝트는 cross-feature 개요인 ROADMAP.md 를 repo 루트에
# 유지해야 하므로 비치명 advisory로만 알린다.
if [ -d "$ROOT_DIR/specs" ]; then
  if [ -f "$ROOT_DIR/ROADMAP.md" ]; then
    ok "specs/ 사용 중이며 ROADMAP.md 존재"
  else
    warn "specs/ 는 있지만 ROADMAP.md 가 repo 루트에 없습니다 — cross-feature 개요를 위해 얇은 ROADMAP.md 를 유지하세요"
  fi
fi

# Superpowers는 install.sh 가 자동 설치하지 않으며 각 런타임의 plugin
# marketplace 경유다. marketplace의 내부 저장 구조는 런타임 버전에 따라 바뀌어
# 존재 여부를 흉내내 감지하면 오탐이 난다(설치돼 있어도 미감지). doctor는
# 감지하지 않고 설치 방법 안내만 출력한다 — 실패/경고 카운터에 잡지 않는다.
printf '안내: Superpowers는 각 런타임 plugin marketplace에서 관리됩니다.\n'
printf '  Claude Code: /plugin install superpowers@claude-plugins-official\n'
printf '  Codex: /plugins 실행 후 superpowers 설치\n'

printf '\n하네스 doctor 완료: 실패 %s개, 경고 %s개\n' "$failures" "$warnings"

# bootstrap 이 7단계 끝에 취합하는 결과 요약(specs/014 data-model.md 1절).
# 요약 기록은 부수 효과일 뿐이므로 실패해도 doctor 결과를 바꾸지 않는다 —
# 그래서 아래 exit 판정보다 먼저 두고 모든 오류를 삼킨다.
# doctor 는 bootstrap 밖에서도 자주 단독 실행된다. 그냥 append 하면 실행할
# 때마다 줄이 쌓여 고아 상태 파일이 무한히 자란다(파서는 마지막 값을 쓰므로
# 정확성은 유지되지만 파일이 커진다). 자기 종류의 이전 줄만 걷어내고 append
# 한다 — 다른 생산자(version/reclaimed)의 줄은 건드리지 않는다.
summary_file="$ROOT_DIR/.harness/state/bootstrap-summary"
mkdir -p "$ROOT_DIR/.harness/state" 2>/dev/null || true
if [ -f "$summary_file" ]; then
  # grep -v 는 남는 줄이 없으면 exit 1 이다(모든 줄이 doctor 인 흔한 경우).
  # `&& mv` 로 엮으면 그때 정리가 통째로 건너뛰어져 줄이 계속 쌓인다.
  # 종료 코드를 무시하고 tmp 가 만들어졌는지로만 판단한다.
  grep -v '^doctor ' "$summary_file" > "$summary_file.tmp" 2>/dev/null || true
  if [ -f "$summary_file.tmp" ]; then
    mv "$summary_file.tmp" "$summary_file" 2>/dev/null || rm -f "$summary_file.tmp"
  fi
fi
printf 'doctor %s/%s\n' "$failures" "$warnings" \
  >> "$summary_file" 2>/dev/null || true

if [ "$failures" -gt 0 ]; then
  exit 1
fi
