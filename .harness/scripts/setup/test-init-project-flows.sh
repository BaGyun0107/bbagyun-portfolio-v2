#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
WORK_DIR="${INIT_PROJECT_TEST_WORK_DIR:-$(mktemp -d "/private/tmp/codi-init-project-test.XXXXXX")}"
MOCK_BIN="$WORK_DIR/bin"
LOG_DIR="$WORK_DIR/logs"
ORG="${INIT_PROJECT_TEST_ORG:-CODIWORKS-Engineer}"

log() {
  echo "==> $*"
}

fail() {
  echo "fail: $*" >&2
  exit 1
}

assert_file() {
  [ -f "$1" ] || fail "missing file: $1"
}

assert_contains() {
  local file="$1"
  local pattern="$2"
  grep -q -- "$pattern" "$file" || fail "expected '$pattern' in $file"
}

assert_not_contains() {
  local file="$1"
  local pattern="$2"
  if grep -q -- "$pattern" "$file"; then
    fail "unexpected '$pattern' in $file"
  fi
}

assert_json_value() {
  local file="$1"
  local expression="$2"
  local expected="$3"

  node -e '
    const fs = require("fs");
    const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const value = Function("data", `return ${process.argv[2]}`)(data);
    if (value !== process.argv[3]) {
      console.error(`expected ${process.argv[2]} to be ${process.argv[3]}, got ${value}`);
      process.exit(1);
    }
  ' "$file" "$expression" "$expected"
}

assert_log_contains() {
  local file="$1"
  local pattern="$2"
  grep -q -- "$pattern" "$file" || fail "expected mock log '$pattern' in $file"
}

write_mocks() {
  mkdir -p "$MOCK_BIN" "$LOG_DIR"

  cat > "$MOCK_BIN/gh" <<'MOCK_GH'
#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="${MOCK_GH_LOG:?MOCK_GH_LOG is required}"
cmd="${1:-}"

{
  printf 'gh'
  for arg in "$@"; do
    printf ' %q' "$arg"
  done
  printf '\n'
} >> "$LOG_FILE"

case "$cmd" in
  auth)
    if [ "${1:-}" = "auth" ] && [ "${2:-}" = "status" ]; then
      exit 0
    fi
    ;;
  repo)
    sub="${2:-}"
    case "$sub" in
      view)
        exit 1
        ;;
      create)
        exit 0
        ;;
      *)
        exit 0
        ;;
    esac
    ;;
  api)
    exit 0
    ;;
  secret)
    if [ "${2:-}" = "set" ]; then
      cat >/dev/null
    fi
    exit 0
    ;;
esac

exit 0
MOCK_GH

  cat > "$MOCK_BIN/infisical" <<'MOCK_INFISICAL'
#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="${MOCK_INFISICAL_LOG:?MOCK_INFISICAL_LOG is required}"
printf 'infisical' >> "$LOG_FILE"
for arg in "$@"; do
  printf ' %q' "$arg" >> "$LOG_FILE"
done
printf '\n' >> "$LOG_FILE"

if [ "${1:-}" = "--version" ]; then
  echo "infisical mock"
  exit 0
fi

if [ "${1:-}" = "user" ]; then
  echo "Logged in"
  exit 0
fi

exit 0
MOCK_INFISICAL

  chmod +x "$MOCK_BIN/gh" "$MOCK_BIN/infisical"
}

copy_harness_repo() {
  local target="$1"
  local branch
  branch="$(git -C "$ROOT_DIR" rev-parse --abbrev-ref HEAD)"
  git clone --quiet "$ROOT_DIR" "$target"
  git -C "$target" pull --quiet --ff-only origin "$branch"

  if ! git -C "$ROOT_DIR" diff --quiet; then
    git -C "$ROOT_DIR" diff --binary | git -C "$target" apply --quiet
  fi

  while IFS= read -r file; do
    mkdir -p "$target/$(dirname "$file")"
    cp "$ROOT_DIR/$file" "$target/$file"
  done < <(git -C "$ROOT_DIR" ls-files --others --exclude-standard)
}

seed_git_repo() {
  local dir="$1"
  local message="$2"
  git -C "$dir" init --quiet
  git -C "$dir" config user.name "Codi Harness Test"
  git -C "$dir" config user.email "test@example.invalid"
  git -C "$dir" add -A
  git -C "$dir" commit --quiet -m "$message"
}

commit_if_dirty() {
  local dir="$1"
  local message="$2"

  if [ -n "$(git -C "$dir" status --porcelain)" ]; then
    git -C "$dir" add -A
    git -C "$dir" commit --quiet -m "$message"
  fi
}

create_app_repo() {
  local dir="$1"
  local app_name="$2"
  local stack="$3"

  mkdir -p "$dir/src"
  cat > "$dir/package.json" <<EOF
{
  "name": "$app_name",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "start": "node src/index.js",
    "build": "node -e \\"console.log('build $app_name')\\""
  },
  "dependencies": {
    "$stack": "0.0.0"
  }
}
EOF
  echo "console.log('$app_name');" > "$dir/src/index.js"
  seed_git_repo "$dir" "chore: seed $app_name"
}

run_init_project() {
  local repo_dir="$1"
  local project="$2"
  local log_name="$3"

  MOCK_GH_LOG="$LOG_DIR/$log_name-gh.log" \
  MOCK_INFISICAL_LOG="$LOG_DIR/$log_name-infisical.log" \
  PATH="$MOCK_BIN:$PATH" \
    bash -c 'cd "$1" && ./harness init-project "$2" --org "$3"' \
      _ "$repo_dir" "$project" "$ORG" \
      > "$LOG_DIR/$log_name.out"
}

run_wire_infisical() {
  local repo_dir="$1"
  local project="$2"
  local log_name="$3"

  MOCK_GH_LOG="$LOG_DIR/$log_name-gh.log" \
  MOCK_INFISICAL_LOG="$LOG_DIR/$log_name-infisical.log" \
  PATH="$MOCK_BIN:$PATH" \
  INFISICAL_PROJECT_ID="mock-project-id-$project" \
  INFISICAL_CLIENT_ID="mock-client-id" \
  INFISICAL_CLIENT_SECRET="mock-client-secret" \
    bash -c 'cd "$1" && ./harness wire-infisical "$2" --org "$3"' \
      _ "$repo_dir" "$project" "$ORG" \
      > "$LOG_DIR/$log_name.out"
}

case_empty_pull_then_init() {
  local repo="$WORK_DIR/case-empty/codi-empty"
  log "Case 1: empty directory -> pull clone -> init-project"
  mkdir -p "$(dirname "$repo")"
  copy_harness_repo "$repo"

  run_init_project "$repo" "empty-smoke" "case1"

  local output="$LOG_DIR/case1.out"
  assert_contains "$output" "Repo: https://github.com/${ORG}/codi-empty-smoke"
  assert_contains "$output" "--push 옵션이 없어 commit/push를 건너뜁니다"
  assert_file "$repo/.husky/pre-commit"
  assert_file "$repo/package-lock.json"
  assert_file "$repo/.github/workflows/pipeline.yml"
  assert_file "$repo/.github/workflows/dependency-security-pr.yml"
  assert_contains "$repo/.github/workflows/pipeline.yml" "uses: ./.github/workflows/ci-node.yml"
  assert_contains "$repo/.github/workflows/dependency-security-pr.yml" "pull_request:"
  assert_contains "$repo/.github/workflows/dependency-security-pr.yml" "paths:"
  assert_contains "$repo/.github/workflows/ci-node.yml" "workflow_call:"
  assert_not_contains "$repo/.github/workflows/ci-node.yml" "pull_request:"
  assert_not_contains "$repo/.github/workflows/dependency-security.yml" "pull_request:"
  assert_not_contains "$repo/.github/workflows/dependency-security.yml" "security-events:"
  assert_contains "$repo/.github/workflows/dependency-security.yml" "ghcr.io/google/osv-scanner:v2.3.1"
  assert_not_contains "$repo/.github/workflows/dependency-security.yml" "dependency-review-action"
  assert_not_contains "$repo/.github/workflows/dependency-security.yml" "enable-dependency-review"
  assert_not_contains "$repo/.harness/scripts/checks/ci-node-verify.sh" "for script in typecheck test build"
  assert_contains "$repo/.github/workflows/dependency-security.yml" "Dependency full scan cache"
  assert_contains "$repo/.github/workflows/dependency-security.yml" 'dependency-security-${KST_DATE}-${HASH}'
  assert_contains "$repo/.github/workflows/dependency-security.yml" "Renovate impact report"
  assert_file "$repo/.harness/scripts/audit/osv-severity-gate.js"
  assert_file "$repo/.harness/scripts/audit/dependency-impact-report.js"
  assert_json_value "$repo/package.json" "data.scripts.prepare" "husky"
  assert_json_value "$repo/package.json" "data.devDependencies.husky" "^9.1.7"
  assert_json_value "$repo/package.json" "data.devDependencies['lint-staged']" "^16.2.7"
  assert_log_contains "$LOG_DIR/case1-gh.log" "repo create ${ORG}/codi-empty-smoke"
  assert_not_contains "$LOG_DIR/case1-gh.log" "secret set INFISICAL_CLIENT_ID"

  local origin
  origin="$(git -C "$repo" remote get-url origin)"
  [ "$origin" = "https://github.com/${ORG}/codi-empty-smoke.git" ] \
    || fail "unexpected case1 origin: $origin"

  assert_not_contains "$LOG_DIR/case1-gh.log" "repo delete"
  if git -C "$repo" log --oneline -1 --pretty=%s | grep -q "^chore: 프로젝트 초기화 empty-smoke$"; then
    fail "case1 should not auto-commit without --push"
  fi
}

case_existing_front_back_import() {
  local base="$WORK_DIR/case-import"
  local front_repo="$base/source-front"
  local back_repo="$base/source-back"
  local mono_repo="$base/codi-imported"

  log "Case 2: existing front/back repos -> monorepo import -> init-project"
  mkdir -p "$base"
  create_app_repo "$front_repo" "source-front" "react"
  create_app_repo "$back_repo" "source-back" "express"
  copy_harness_repo "$mono_repo"
  git -C "$mono_repo" config user.name "Codi Harness Test"
  git -C "$mono_repo" config user.email "test@example.invalid"
  commit_if_dirty "$mono_repo" "chore: apply working tree under test"

  # 하네스는 apps/front, apps/back 템플릿 디렉터리를 동봉하므로
  # subtree add 전에 import 대상 템플릿을 제거한다 (import-mode.md Preflight).
  git -C "$mono_repo" rm -r --quiet apps/front apps/back
  git -C "$mono_repo" commit --quiet -m "chore: import 대상 apps 템플릿 제거"

  git -C "$mono_repo" subtree add --quiet --prefix=apps/front "$front_repo" HEAD --squash
  git -C "$mono_repo" subtree add --quiet --prefix=apps/back "$back_repo" HEAD --squash

  cat > "$mono_repo/apps/front/.infisical.json" <<'EOF'
{
  "workspaceId": "_PROJECT_ID_",
  "defaultEnvironment": "local-dev",
  "gitBranchToEnvironmentMapping": {
    "main": "prod",
    "dev": "dev"
  }
}
EOF
  cp "$mono_repo/apps/front/.infisical.json" "$mono_repo/apps/back/.infisical.json"

  run_init_project "$mono_repo" "import-smoke" "case2"

  assert_file "$mono_repo/apps/front/package.json"
  assert_file "$mono_repo/apps/back/package.json"
  assert_file "$mono_repo/.husky/pre-commit"
  assert_file "$mono_repo/package-lock.json"
  assert_file "$mono_repo/.github/workflows/pipeline.yml"
  assert_contains "$mono_repo/.github/workflows/pipeline.yml" "needs.ci-node.result == 'success'"
  assert_contains "$mono_repo/.github/workflows/pipeline.yml" "needs.dependency-security.result == 'success'"
  assert_contains "$mono_repo/.github/workflows/pipeline.yml" "needs.dependency-security.result == 'skipped'"
  assert_contains "$mono_repo/.github/workflows/pipeline.yml" "dependency_changed"
  assert_contains "$mono_repo/.github/workflows/pipeline.yml" "cron: \"30 17"
  assert_not_contains "$mono_repo/.github/workflows/pipeline.yml" "security-events:"
  assert_contains "$mono_repo/.github/workflows/deploy-backend-pm2.yml" "workflow_call:"
  assert_not_contains "$mono_repo/.github/workflows/deploy-backend-pm2.yml" "push:"
  assert_json_value "$mono_repo/package.json" "data.scripts.prepare" "husky"
  assert_json_value "$mono_repo/package.json" "data.devDependencies.husky" "^9.1.7"
  assert_json_value "$mono_repo/package.json" "data.devDependencies['lint-staged']" "^16.2.7"
  # dev-runner 는 production 진입점(start)에 끼우면 배포 환경에서 .harness 경로가 없어
  # 깨지므로 dev 스크립트에만 적용한다. fixture 에는 dev 가 없고 start 만 있으므로
  # start 는 원본 그대로 유지되어야 한다.
  assert_json_value "$mono_repo/apps/front/package.json" "data.scripts.start" "node src/index.js"
  assert_json_value "$mono_repo/apps/back/package.json" "data.scripts.start" "node src/index.js"
  assert_contains "$mono_repo/apps/front/.infisical.json" "_PROJECT_ID_"
  assert_contains "$mono_repo/apps/back/.infisical.json" "_PROJECT_ID_"
  assert_contains "$mono_repo/.github/workflows/deploy-frontend-vercel.yml" "_PROJECT_ID_"
  assert_contains "$mono_repo/.github/workflows/deploy-backend-pm2.yml" "_PROJECT_ID_"
  assert_contains "$LOG_DIR/case2.out" "Root Directory: 빈 값"
  assert_contains "$LOG_DIR/case2.out" "--push 옵션이 없어 commit/push를 건너뜁니다"
  assert_log_contains "$LOG_DIR/case2-gh.log" "repo create ${ORG}/codi-import-smoke"
  assert_not_contains "$LOG_DIR/case2-gh.log" "repo delete"

  # --squash import는 외부 레포 히스토리를 단일 squash 커밋으로 합치므로
  # 개별 커밋(seed ...) 대신 squash 커밋과 import된 파일 존재로 검증한다.
  git -C "$mono_repo" log --oneline --all > "$LOG_DIR/case2-git-log.txt"
  assert_contains "$LOG_DIR/case2-git-log.txt" "Squashed 'apps/front/'"
  assert_contains "$LOG_DIR/case2-git-log.txt" "Squashed 'apps/back/'"
  [ -f "$mono_repo/apps/front/package.json" ] \
    || fail "expected imported apps/front/package.json"
  [ -f "$mono_repo/apps/back/package.json" ] \
    || fail "expected imported apps/back/package.json"
}

case_wire_infisical_after_init() {
  local repo="$WORK_DIR/case-wire/codi-wire"
  log "Case 3: init-project leaves Infisical placeholders -> wire-infisical replaces them"
  mkdir -p "$(dirname "$repo")"
  copy_harness_repo "$repo"

  run_init_project "$repo" "wire-smoke" "case3-init"

  assert_contains "$repo/apps/front/.infisical.json" "<INFISICAL_PROJECT_ID>"
  assert_contains "$repo/apps/back/.infisical.json" "<INFISICAL_PROJECT_ID>"
  assert_contains "$repo/.github/workflows/deploy-frontend-vercel.yml" "_PROJECT_ID_"
  assert_contains "$repo/.github/workflows/deploy-backend-pm2.yml" "_PROJECT_ID_"
  assert_not_contains "$LOG_DIR/case3-init-gh.log" "secret set INFISICAL_CLIENT_ID"

  run_wire_infisical "$repo" "wire-smoke" "case3-wire"

  assert_contains "$repo/apps/front/.infisical.json" "mock-project-id-wire-smoke"
  assert_contains "$repo/apps/back/.infisical.json" "mock-project-id-wire-smoke"
  assert_not_contains "$repo/.github/workflows/deploy-frontend-vercel.yml" "_PROJECT_ID_"
  assert_not_contains "$repo/.github/workflows/deploy-backend-pm2.yml" "_PROJECT_ID_"
  assert_log_contains "$LOG_DIR/case3-wire-gh.log" "secret set INFISICAL_CLIENT_ID"
  assert_log_contains "$LOG_DIR/case3-wire-gh.log" "secret set INFISICAL_CLIENT_SECRET"
}

main() {
  log "work dir: $WORK_DIR"
  write_mocks
  case_empty_pull_then_init
  case_existing_front_back_import
  case_wire_infisical_after_init
  log "init-project flow tests passed"
}

main "$@"
