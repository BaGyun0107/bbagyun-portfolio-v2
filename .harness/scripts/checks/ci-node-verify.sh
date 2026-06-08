#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(pwd)"
SCOPE="${CI_NODE_VERIFY_SCOPE:-}"
RUN_TESTS="${CI_NODE_VERIFY_RUN_TESTS:-false}"

log() {
  echo "==> $*"
}

find_up() {
  local start="$1"
  local filename="$2"
  local dir="$start"

  case "$dir" in
    .)
      dir="$ROOT_DIR"
      ;;
    ./*)
      dir="$ROOT_DIR/${dir#./}"
      ;;
  esac

  while true; do
    if [ -f "$dir/$filename" ]; then
      echo "$dir/$filename"
      return 0
    fi

    if [ "$dir" = "$ROOT_DIR" ]; then
      return 1
    fi

    dir="$(dirname "$dir")"
  done
}

has_dependency_entries() {
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    const fields = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
    process.exit(fields.some((field) => pkg[field] && Object.keys(pkg[field]).length > 0) ? 0 : 1);
  ' "$1"
}

read_package_manager_field() {
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    const manager = typeof pkg.packageManager === "string" ? pkg.packageManager.split("@")[0] : "";
    if (manager) console.log(manager);
  ' "$1"
}

stack_package_manager_for() {
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    if (deps.next) {
      console.log("pnpm");
      process.exit(0);
    }
    if (Object.keys(deps).some((name) => name.startsWith("@nestjs/"))) {
      console.log("pnpm");
      process.exit(0);
    }
    if (deps.express) {
      console.log("npm");
      process.exit(0);
    }
    if (deps.vite || deps["@vitejs/plugin-react"] || deps.react) {
      console.log("npm");
      process.exit(0);
    }
  ' "$1"
}

package_manager_for() {
  local dir="$1"
  local manager=""

  manager="$(read_package_manager_field "$dir/package.json")"
  if [ -n "$manager" ]; then
    echo "$manager"
    return 0
  fi

  if [ -f "$dir/pnpm-lock.yaml" ]; then
    echo "pnpm"
    return 0
  fi

  if [ -f "$dir/package-lock.json" ] || [ -f "$dir/npm-shrinkwrap.json" ]; then
    echo "npm"
    return 0
  fi

  manager="$(stack_package_manager_for "$dir/package.json")"
  if [ -n "$manager" ]; then
    echo "$manager"
    return 0
  fi

  local workspace_file=""
  workspace_file="$(find_up "$dir" "pnpm-workspace.yaml" || true)"
  if [ -n "$workspace_file" ]; then
    local workspace_root
    workspace_root="$(dirname "$workspace_file")"
    manager="$(read_package_manager_field "$workspace_root/package.json" 2>/dev/null || true)"
    if [ "$manager" = "pnpm" ]; then
      echo "pnpm"
      return 0
    fi
  fi

  if find_up "$dir" "pnpm-lock.yaml" >/dev/null; then
    echo "pnpm"
    return 0
  fi

  if find_up "$dir" "package-lock.json" >/dev/null || find_up "$dir" "npm-shrinkwrap.json" >/dev/null; then
    echo "npm"
    return 0
  fi

  echo "npm"
}

has_script() {
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const script = process.argv[2];
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    process.exit(pkg.scripts && pkg.scripts[script] ? 0 : 1);
  ' "$1/package.json" "$2"
}

read_script() {
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const script = process.argv[2];
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    if (pkg.scripts && pkg.scripts[script]) console.log(pkg.scripts[script]);
  ' "$1/package.json" "$2"
}

install_package() {
  local dir="$1"
  local manager="$2"
  local pkg_file="$dir/package.json"
  local lockfile=""

  if ! has_dependency_entries "$pkg_file" \
    && [ ! -f "$dir/package-lock.json" ] \
    && [ ! -f "$dir/npm-shrinkwrap.json" ] \
    && [ ! -f "$dir/pnpm-lock.yaml" ]; then
    log "$dir 설치 건너뜀: dependency entry와 lockfile이 없습니다"
    return 0
  fi

  if [ "$manager" = "pnpm" ]; then
    lockfile="$(find_up "$dir" "pnpm-lock.yaml" || true)"
    if [ -n "$lockfile" ]; then
      pnpm --dir "$dir" install --frozen-lockfile --ignore-scripts
    else
      pnpm --dir "$dir" install --ignore-scripts
    fi
    return 0
  fi

  lockfile="$(find_up "$dir" "package-lock.json" || find_up "$dir" "npm-shrinkwrap.json" || true)"
  if [ -n "$lockfile" ]; then
    npm --prefix "$dir" ci --ignore-scripts
  else
    npm --prefix "$dir" install --ignore-scripts
  fi
}

maybe_prisma_generate() {
  local dir="$1"
  local manager="$2"

  if [ ! -f "$dir/prisma/schema.prisma" ]; then
    return 0
  fi

  log "$dir Prisma client 생성"
  # prisma generate는 schema를 cwd 기준으로 탐색하므로 대상 디렉터리에서 실행한다.
  # npm --prefix / pnpm --dir 는 패키지 해석 위치만 바꾸고 cwd는 옮기지 않는다.
  if [ "$manager" = "pnpm" ]; then
    (cd "$dir" && pnpm exec prisma generate)
  else
    (cd "$dir" && npm exec -- prisma generate)
  fi
}

run_script_if_present() {
  local dir="$1"
  local manager="$2"
  local script="$3"
  local command=""

  if ! has_script "$dir" "$script"; then
    log "$dir $script 건너뜀: script가 없습니다"
    return 0
  fi

  command="$(read_script "$dir" "$script")"

  if [ "$script" = "test" ] && [ "$RUN_TESTS" != "true" ]; then
    log "$dir test 건너뜀: test를 실행하려면 CI_NODE_VERIFY_RUN_TESTS=true 설정"
    return 0
  fi

  if [ "$script" = "test" ] && printf '%s' "$command" | grep -Eq 'no test specified|No test specified'; then
    log "$dir test 건너뜀: 기본 placeholder test script"
    return 0
  fi

  log "$dir 에서 $script 실행"
  if [ "$manager" = "pnpm" ]; then
    pnpm --dir "$dir" run "$script"
  else
    npm --prefix "$dir" run "$script"
  fi
}

should_include_dir() {
  local dir="$1"

  if [ -z "$SCOPE" ]; then
    return 0
  fi

  case "$dir" in
    ./"$SCOPE"|./"$SCOPE"/*|"$SCOPE"|"$SCOPE"/*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

PACKAGE_DIRS=()
while IFS= read -r package_dir; do
  PACKAGE_DIRS+=("$package_dir")
done < <(
  find . \
    -maxdepth 4 \
    \( -path "./.git" \
      -o -path "./node_modules" \
      -o -path "./*/node_modules" \
      -o -path "./.next" \
      -o -path "./*/.next" \
      -o -path "./dist" \
      -o -path "./*/dist" \
      -o -path "./coverage" \
      -o -path "./*/coverage" \) -prune \
    -o -name package.json -print \
    | sed 's|/package.json$||' \
    | sort
)

if [ "${#PACKAGE_DIRS[@]}" -eq 0 ]; then
  log "package.json 파일을 찾지 못했습니다"
  exit 0
fi

for dir in "${PACKAGE_DIRS[@]}"; do
  if ! should_include_dir "$dir"; then
    log "$dir 건너뜀: CI_NODE_VERIFY_SCOPE=$SCOPE 범위 밖"
    continue
  fi

  manager="$(package_manager_for "$dir")"
  if [ "$manager" != "npm" ] && [ "$manager" != "pnpm" ]; then
    echo "$dir 에서 지원하지 않는 package manager입니다: '$manager'" >&2
    exit 1
  fi

  log "$dir 검증 중 ($manager)"
  install_package "$dir" "$manager"
  maybe_prisma_generate "$dir" "$manager"

  for script in typecheck test; do
    run_script_if_present "$dir" "$manager" "$script"
  done
done
