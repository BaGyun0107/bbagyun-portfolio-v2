#!/bin/bash
set -euo pipefail

# ── harness 프로젝트 초기화 스크립트 (B방식) ──
# 사용법: .harness/scripts/init-project.sh <repo-name> [--org <org>] [--mode <mode>] [--push]
# 또는: ./harness init-project <repo-name> [--org <org>] [--mode <mode>] [--push]
# 예시:
#   ./harness init-project codi-my-app
#   ./harness init-project codi-my-app --org CODIWORKS-Engineer --mode backend-only --push
#
# 방식 설명:
# - 입력한 repo 이름 그대로 모노레포 1개에서 apps/front(Vercel CLI), apps/back(SSH/PM2) 직접 배포
# - front-<project>, back-<project> 배포 레포 생성하지 않음
# - Infisical 배선은 콘솔 작업 후 ./harness wire-infisical 로 별도 실행

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# ── 기본 설정 ──
DEFAULT_ORG="CODIWORKS-Engineer"
INFISICAL_API_URL="${INFISICAL_API_URL:-https://env.co-di.com}"
DEFAULT_PROFILE_MODE="split-front-back"

# ── 색상 ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[정보]${NC} $*"; }
warn()  { echo -e "${YELLOW}[경고]${NC} $*"; }
error() { echo -e "${RED}[오류]${NC} $*" >&2; }

run_mise_bootstrap() {
  if ! command -v mise &> /dev/null; then
    error "mise가 필요합니다."
    echo "  설치: curl https://mise.run | sh"
    exit 1
  fi

  if command -v node &> /dev/null; then
    node_version="$(node -v 2>/dev/null || true)"
    case "$node_version" in
      v24.*)
        info "  node: ${node_version} (mise bootstrap 건너뜀)"
        return 0
        ;;
    esac
  fi

  info "  mise: Node.js 24 런타임 준비"
  mise trust
  mise install

  if ! command -v node &> /dev/null; then
    error "Node.js를 찾을 수 없습니다. mise shell activation을 확인하세요."
    echo "  예: echo 'eval \"\$(~/.local/bin/mise activate zsh)\"' >> ~/.zshrc"
    exit 1
  fi
}

harness_install_needed() {
  if [ "$FORCE_INSTALL" -eq 1 ]; then
    return 0
  fi
  if [ "$SKIP_INSTALL" -eq 1 ]; then
    return 1
  fi

  for required_path in \
    ".specify/templates" \
    ".specify/scripts" \
    ".specify/workflows" \
    ".agents/skills/init-project/SKILL.md" \
    ".agents/skills/speckit-specify/SKILL.md" \
    ".claude/skills/init-project/SKILL.md" \
    ".claude/skills/speckit-specify/SKILL.md"
  do
    if [ ! -e "${PROJECT_ROOT}/${required_path}" ]; then
      return 0
    fi
  done

  return 1
}

run_harness_install_if_needed() {
  if [ "$SKIP_INSTALL" -eq 1 ]; then
    warn "  --skip-install 지정됨: 하네스 통합 도구 설치를 건너뜁니다."
    return 0
  fi

  if harness_install_needed; then
    if [ "$FORCE_INSTALL" -eq 1 ]; then
      info "  --force-install 지정됨: 하네스 통합 도구를 다시 설치합니다."
    else
      info "  하네스 통합 도구 상태 보강 필요 — install 실행"
    fi
    "${PROJECT_ROOT}/.harness/scripts/setup/install.sh"
  else
    info "  하네스 통합 도구 이미 준비됨 — install 건너뜀"
  fi
}

# ── 인자 파싱 ──
if [ $# -lt 1 ]; then
  echo "사용법: $0 <repo-name> [--org <org>] [--mode <mode>]"
  echo ""
  echo "인자:"
  echo "  repo-name  프로젝트/repo 이름 (예: codi-my-app)"
  echo ""
  echo "옵션:"
  echo "  --org         GitHub Organization (기본값: ${DEFAULT_ORG})"
  echo "  --mode        프로젝트 profile mode: split-front-back | next-fullstack | frontend-only | backend-only | planning-only"
  echo "  --push        main/dev 브랜치를 commit 후 origin에 push"
  echo "  --reset-git   하네스 clone의 .git을 제거하고 새 git 히스토리로 다시 시작"
  echo "  --skip-install 하네스 통합 도구 설치/갱신을 건너뜀"
  echo "  --force-install 하네스 통합 도구 설치/갱신을 강제로 실행"
  echo ""
  echo "예시:"
  echo "  $0 codi-my-app"
  echo "  $0 codi-my-app --org ${DEFAULT_ORG} --mode backend-only --push"
  exit 1
fi

PROJECT_NAME="$1"
shift

ORG="${DEFAULT_ORG}"
PUSH_REMOTE=0
PROFILE_MODE=""
RESET_GIT=0
SKIP_INSTALL=0
FORCE_INSTALL=0

while [ $# -gt 0 ]; do
  case "$1" in
    --org)
      ORG="$2"
      shift 2
      ;;
    --push)
      PUSH_REMOTE=1
      shift
      ;;
    --mode)
      PROFILE_MODE="$2"
      shift 2
      ;;
    --reset-git)
      RESET_GIT=1
      shift
      ;;
    --skip-install)
      SKIP_INSTALL=1
      shift
      ;;
    --force-install)
      FORCE_INSTALL=1
      shift
      ;;
    *)
      error "알 수 없는 옵션: $1"
      exit 1
      ;;
  esac
done

if [ "$SKIP_INSTALL" -eq 1 ] && [ "$FORCE_INSTALL" -eq 1 ]; then
  error "--skip-install 과 --force-install 은 함께 사용할 수 없습니다."
  exit 2
fi

is_supported_profile_mode() {
  case "$1" in
    split-front-back|next-fullstack|frontend-only|backend-only|planning-only)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

choose_profile_mode() {
  if [ -n "$PROFILE_MODE" ]; then
    if ! is_supported_profile_mode "$PROFILE_MODE"; then
      error "지원하지 않는 profile mode입니다: ${PROFILE_MODE}"
      echo "  지원 모드: split-front-back, next-fullstack, frontend-only, backend-only, planning-only"
      exit 2
    fi
    return 0
  fi

  if [ -t 0 ]; then
    echo "프로젝트 profile mode를 선택하세요:"
    echo "  1) split-front-back  - apps/front + apps/back"
    echo "  2) next-fullstack    - apps/front Next.js full-stack"
    echo "  3) frontend-only     - apps/front only"
    echo "  4) backend-only      - apps/back only"
    echo "  5) planning-only     - 기획 산출물 전용 (앱 표면 없음)"
    printf "선택 [1]: "
    read -r answer
    case "${answer:-1}" in
      1|split-front-back) PROFILE_MODE="split-front-back" ;;
      2|next-fullstack) PROFILE_MODE="next-fullstack" ;;
      3|frontend-only) PROFILE_MODE="frontend-only" ;;
      4|backend-only) PROFILE_MODE="backend-only" ;;
      5|planning-only) PROFILE_MODE="planning-only" ;;
      *)
        error "지원하지 않는 선택: ${answer}"
        exit 2
        ;;
    esac
  else
    PROFILE_MODE="$DEFAULT_PROFILE_MODE"
  fi
}

choose_profile_mode

info "프로젝트: ${PROJECT_NAME}"
info "Org: ${ORG}"
info "Profile mode: ${PROFILE_MODE}"

# .git이 하네스를 그대로 clone한 흔적인지 판별한다.
# 단순 substring 대신 canonical owner/repo/host로만 판별한다.
origin_matches_harness() {
  local url="$1"
  # 선택적 .git suffix와 trailing slash를 제거한다.
  url="${url%/}"
  url="${url%.git}"
  case "$url" in
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
}

# 스켈레톤 출발 판정 (specs/019 R4): harness.lock이 있고 upstream 작업
# 상태(정본 목록)가 하나도 없으면 new-project 스켈레톤에서 시작한 프로젝트다.
# origin URL 기반 판정은 로컬 clone에서 오판한 이력이 있어 쓰지 않는다.
is_skeleton_origin() {
  [ -f "$PROJECT_ROOT/harness.lock" ] || return 1
  local paths p
  paths="$(node -e "import('${PROJECT_ROOT}/.harness/scripts/setup/upstream-project-state.mjs').then(m => console.log(m.UPSTREAM_PROJECT_STATE_PATHS.join('\n')))" 2>/dev/null || true)"
  [ -n "$paths" ] || return 1
  while IFS= read -r p; do
    [ -n "$p" ] || continue
    if [ -e "$PROJECT_ROOT/$p" ]; then
      return 1
    fi
  done <<EOF
$paths
EOF
  return 0
}

is_harness_clone() {
  if ! git -C "$PROJECT_ROOT" rev-parse --is-inside-work-tree &>/dev/null; then
    return 1
  fi
  local origin_url
  origin_url="$(git -C "$PROJECT_ROOT" remote get-url origin 2>/dev/null || true)"
  if [ -n "$origin_url" ]; then
    # 원격 origin이 있으면 정식 URL만 신뢰한다.
    if origin_matches_harness "$origin_url"; then
      return 0
    fi
    return 1
  fi
  # 원격 origin이 없어도 다른 remote가 있으면 branch marker fallback을 쓰지 않는다.
  local remote_list
  remote_list="$(git -C "$PROJECT_ROOT" remote 2>/dev/null || true)"
  if [ -n "$remote_list" ]; then
    return 1
  fi
  # 원격이 전혀 없는 fresh local clone만 v1/v2 branch marker를 허용한다.
  if git -C "$PROJECT_ROOT" show-ref --verify --quiet refs/heads/v1 ||
     git -C "$PROJECT_ROOT" show-ref --verify --quiet refs/heads/v2; then
    return 0
  fi
  return 1
}

# 하네스 clone의 .git을 제거하고 새 git 히스토리로 다시 시작한다.
# 하네스의 v1/v2 버전 브랜치와 전체 히스토리가 사라지므로,
# 이후 subtree import 시 외부 레포 브랜치와 충돌하지 않는다.
# 신규 프로젝트를 lock 모드(specs/005)로 배선한다. 하네스 본체 버전은
# harness.lock 채널이 관리하고, 첫 ./harness install 때 pkg-sync가 캐시
# 수신과 materialize를 수행한다. gitignore 항목은 하네스 .gitignore가 이미
# 포함하므로 lock 파일만 만든다.
write_harness_lock() {
  local lock_path="${PROJECT_ROOT}/harness.lock"
  if [ -f "$lock_path" ]; then
    info "  harness.lock 이미 존재 — 유지"
    return 0
  fi
  local upstream_url="${CODI_HARNESS_UPSTREAM_URL:-https://github.com/CODIWORKS-Engineer/codi-harness.git}"
  cat > "$lock_path" <<LOCK
{
  "schema_version": 1,
  "channel": "latest-minor",
  "repo": "${upstream_url}"
}
LOCK
  info "  harness.lock 생성 (channel: latest-minor, repo: ${upstream_url})"
}

reset_git_history() {
  info "  하네스 clone .git 제거 후 새 git 히스토리 시작..."
  rm -rf "${PROJECT_ROOT}/.git"
  git -C "$PROJECT_ROOT" init -q
  git -C "$PROJECT_ROOT" checkout -q -b main 2>/dev/null || true
  info "  새 git 히스토리 시작 (브랜치: main)"
}

normalize_app_start_scripts() {
  local app_dir="$1"
  local infisical_path="$2"

  if [ ! -f "${app_dir}/package.json" ]; then
    return 0
  fi

  node - "$app_dir/package.json" "$infisical_path" <<'NODE'
const fs = require('node:fs');

const [pkgPath, infisicalPath] = process.argv.slice(2);
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const scripts = pkg.scripts || {};
const runner = `.harness/scripts/deploy/dev-runner.js ${infisicalPath}`;
const runnerMarker = '.harness/scripts/deploy/dev-runner.js';
// `node ../../.harness/scripts/deploy/dev-runner.js <app> <real command...>` 형태에서
// 접두를 제거해 원래 command 만 남기기 위한 패턴.
const runnerPrefixPattern =
  /^node\s+(?:\.\.\/)+\.harness\/scripts\/deploy\/dev-runner\.js\s+\S+\s+/;
let changed = false;

// dev 스크립트만 dev-runner 로 감싼다. dev-runner 는 로컬 개발 전용 래퍼이며,
// production 진입점(start 등)에 끼우면 배포 환경에서 .harness 경로가 없어 깨진다.
const devCommand = scripts.dev;
if (devCommand && !devCommand.includes(runnerMarker)) {
  scripts.dev = `node ../../${runner} ${devCommand}`;
  changed = true;
}

// dev 이외 스크립트에 dev-runner 가 잘못 끼워져 있던 과거 버전을 migration.
// production start (CRA/Vite/Next.js/Express/NestJS) 는 절대 dev-runner 를 거치면 안 된다.
for (const [name, command] of Object.entries(scripts)) {
  if (name === 'dev') continue;
  if (typeof command !== 'string' || !command.includes(runnerMarker)) continue;
  const stripped = command.replace(runnerPrefixPattern, '');
  if (stripped === command) continue;
  scripts[name] = stripped;
  changed = true;
}

if (changed) {
  pkg.scripts = scripts;
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}
NODE

  info "  ${app_dir}/package.json dev/start 스크립트 dev-runner 경유 확인"
}

# 루트 package.json 의 harness-self 항목(test/codex:replay-check/check/name)을
# 정규화한다. 로직은 prune-downstream 과 공유하는 단일 출처 모듈에 있다
# (specs/015 갭 2 — flow 1/flow 2 정리 비대칭 해소).
normalize_root_scripts() {
  if [ ! -f "${PROJECT_ROOT}/package.json" ]; then
    return 0
  fi

  node "$PROJECT_ROOT/.harness/scripts/setup/normalize-root-package.mjs" \
    "$PROJECT_ROOT/package.json" "$PROJECT_NAME"

  info "  루트 package.json harness-self 항목(test/codex:replay-check/name) 정리"
}

# 하네스 clone을 새 프로젝트로 바꿀 때 upstream repo 자체의 작업 상태를 제거한다.
# update 보호(project-owned)는 "기존 downstream 상태를 덮어쓰지 않기"이고,
# 이 정리는 "첫 downstream commit에 upstream 상태를 싣지 않기"다.
# 삭제 대상 경로는 공유 모듈(upstream-project-state.mjs)에서 읽어
# `./harness prune-downstream` 과 목록을 단일화한다.
prune_upstream_project_state() {
  local removed=0
  local path
  local paths
  paths="$(node -e "import('${PROJECT_ROOT}/.harness/scripts/setup/upstream-project-state.mjs').then(m => console.log(m.UPSTREAM_PROJECT_STATE_PATHS.join('\n')))" 2>/dev/null || true)"
  if [ -z "$paths" ]; then
    # 하드코딩 폴백은 두지 않는다 — 폴백 목록은 정본과 드리프트해 잔재를
    # 재생산했다 (2026-07-31 감사 M-3: 6개 vs 정본 8개). 정본을 못 읽으면
    # 조용히 일부만 지우는 대신 명시적으로 실패해 원인을 고치게 한다.
    echo "오류: upstream-project-state.mjs 를 읽지 못해 정리를 중단합니다." >&2
    echo "  (node 실행 가능 여부와 ${PROJECT_ROOT}/.harness/scripts/setup/ 경로를 확인하세요)" >&2
    return 1
  fi
  while IFS= read -r path; do
    [ -z "$path" ] && continue
    if [ -e "${PROJECT_ROOT}/${path}" ]; then
      rm -rf "${PROJECT_ROOT:?}/${path}"
      removed=$((removed + 1))
      info "  upstream project state 제거: ${path}"
    fi
  done <<EOF
$paths
EOF

  if [ "$removed" -eq 0 ]; then
    info "  upstream project state 제거 대상 없음"
  fi
}

# ══════════════════════════════════════════════════════════
#  사전 체크
# ══════════════════════════════════════════════════════════
info "사전 체크..."
run_mise_bootstrap

if ! command -v node &> /dev/null; then
  error "Node.js가 필요합니다."
  echo "  실행: mise install"
  exit 1
fi
info "  node: $(node -v)"

# 도구 확인: GitHub CLI
if ! command -v gh &> /dev/null; then
  error "GitHub CLI (gh) 가 설치되어 있지 않습니다."
  echo "  설치: brew install gh"
  exit 1
fi

if ! gh auth status &> /dev/null; then
  error "GitHub CLI 로그인이 필요합니다."
  echo "  실행: gh auth login"
  exit 1
fi
info "  gh: 로그인됨"

# ── 실패 시 안내 ──
CREATED_REPOS=()
cleanup() {
  if [ ${#CREATED_REPOS[@]} -gt 0 ]; then
    error "오류 발생. 아래 레포가 생성된 상태일 수 있습니다."
    for repo in "${CREATED_REPOS[@]}"; do
      warn "생성됨: $repo"
    done
    echo "필요한 경우 GitHub UI에서 직접 확인 후 삭제하세요."
  fi
}
trap cleanup ERR

# ── 레포 존재 여부 체크 후 생성 ──
create_repo_if_not_exists() {
  local repo="$1"
  local desc="$2"
  if gh repo view "$repo" &>/dev/null; then
    info "  $repo (이미 존재 — 건너뜀)"
  else
    gh repo create "$repo" --private --description "$desc"
    CREATED_REPOS+=("$repo")
    info "  $repo (생성 완료)"
  fi
}

TOTAL_STEPS=5

# ══════════════════════════════════════════════════════════
#  1단계: GitHub 레포 생성
# ══════════════════════════════════════════════════════════
info "Step 1/${TOTAL_STEPS}: GitHub 레포 생성..."

info "  ${PROJECT_NAME} (모노레포)"
create_repo_if_not_exists "${ORG}/${PROJECT_NAME}" "Monorepo for ${PROJECT_NAME}"

# ══════════════════════════════════════════════════════════
#  2단계: 팀 권한 추가
# ══════════════════════════════════════════════════════════
TEAM_SLUG="codi-engineers"
info "Step 2/${TOTAL_STEPS}: 팀 권한 추가 (${TEAM_SLUG} → admin)..."

gh api -X PUT "orgs/${ORG}/teams/${TEAM_SLUG}/repos/${ORG}/${PROJECT_NAME}" \
  -f permission=admin --silent 2>/dev/null \
  && info "  ${ORG}/${PROJECT_NAME} ← ${TEAM_SLUG} (admin)" \
  || warn "  팀 권한 추가 실패 — 수동 등록 필요"

# ══════════════════════════════════════════════════════════
#  3단계: 앱 스크립트 / profile 정규화
# ══════════════════════════════════════════════════════════
info "Step 3/${TOTAL_STEPS}: 앱 스크립트 / profile 정규화..."

if [ "$PROFILE_MODE" != "backend-only" ]; then
  normalize_app_start_scripts "apps/front" "frontend"
else
  info "  ${PROFILE_MODE}: apps/front dev/start 정규화를 건너뜁니다."
fi

if [ "$PROFILE_MODE" = "split-front-back" ] || [ "$PROFILE_MODE" = "backend-only" ]; then
  normalize_app_start_scripts "apps/back" "backend"
else
  info "  ${PROFILE_MODE}: apps/back dev/start 정규화를 건너뜁니다."
fi

node "$PROJECT_ROOT/.harness/scripts/tooling/profile.mjs" set "$PROFILE_MODE"

# 루트 package.json 의 harness-self 스크립트(test/codex:replay-check)를 정리한다.
normalize_root_scripts

# 신규 프로젝트의 .gitignore 에 harness 필수 항목(.planning managed 블록 등)을
# 보장한다. update.sh 의 ensure_required_gitignore 와 동일 동작이며, init 경로
# 에서도 legacy .planning 전환기 보호가 적용되게 한다(제거 전까지 ignore 금지,
# 제거는 git rm 경유 — docs/audits/2026-07-07-planning-retirement.md 참조).
if [ -f "$PROJECT_ROOT/.harness/scripts/setup/ensure-gitignore.mjs" ]; then
  added="$(ROOT_DIR="$PROJECT_ROOT" node "$PROJECT_ROOT/.harness/scripts/setup/ensure-gitignore.mjs" 2>/dev/null || true)"
  if [ -n "$added" ]; then
    info "  .gitignore 필수 항목 반영:"
    printf '%s\n' "$added" | sed 's/^/    - /'
  fi
fi

# ══════════════════════════════════════════════════════════
#  4단계: Git 히스토리 / remote / 브랜치 설정
# ══════════════════════════════════════════════════════════
info "Step 4/${TOTAL_STEPS}: Git 히스토리 / remote / 브랜치 설정..."

# 하네스를 git clone으로 받은 .git을 그대로 쓰면 하네스의 v1/v2 버전
# 브랜치와 전체 히스토리가 새 프로젝트에 남아, 이후 subtree import 시
# 외부 레포 브랜치와 충돌한다. 새 git 히스토리로 시작해야 한다.
SKELETON_ORIGIN=0
if is_skeleton_origin; then
  SKELETON_ORIGIN=1
  info "  스켈레톤 출발 프로젝트 (harness.lock + upstream 잔재 없음) — 히스토리 재시작·잔재 정리를 건너뜁니다."
fi

if [ "$SKELETON_ORIGIN" -eq 1 ]; then
  : # 스켈레톤은 태어날 때부터 자기 히스토리라 정리할 것이 없다 (specs/019 FR-006)
elif [ "$RESET_GIT" -eq 1 ]; then
  if is_harness_clone; then
    reset_git_history
  else
    warn "  --reset-git 지정됨: 현재 origin은 하네스 clone으로 판별되지 않아 .git 재생성은 건너뜁니다."
  fi
else
  if is_harness_clone; then
    warn "  이 디렉터리의 .git은 하네스 clone입니다 (v1/v2 브랜치·하네스 히스토리 포함)."
    warn "  그대로 두면 subtree import 시 외부 레포 브랜치와 충돌할 수 있습니다."
    echo "  새 git 히스토리로 다시 시작하려면 --reset-git 옵션으로 재실행하거나,"
    echo "  직접 실행하세요:"
    echo "    rm -rf .git && git init && git checkout -b main"
  fi
fi

# upstream 상태 정리는 --reset-git 과 무관하다. 하네스 clone 으로 새 프로젝트를
# 만들면 옵션 여부와 상관없이 upstream 의 specs/ROADMAP/tests 가 딸려오기
# 때문이다. 과거에는 이 호출이 위 --reset-git 분기 안에 있어서, 옵션 없이 만든
# 프로젝트가 하네스 사본을 안고 시작했다 (2026-07-30 codi-account 실측:
# specs 10건이 전부 하네스 것, 자체 spec 0건 — 그 상태로 speckit-specify 를
# 부르면 자기 첫 기능인데 011 부터 번호가 매겨진다).
# 스켈레톤 출발이면 정리할 upstream 상태 자체가 없다 (specs/019 FR-006).
if [ "$SKELETON_ORIGIN" -eq 0 ]; then
  prune_upstream_project_state
fi

if git remote get-url origin &>/dev/null; then
  git remote set-url origin "https://github.com/${ORG}/${PROJECT_NAME}.git"
else
  git remote add origin "https://github.com/${ORG}/${PROJECT_NAME}.git"
fi
info "  origin → ${ORG}/${PROJECT_NAME}"

# ══════════════════════════════════════════════════════════
#  5단계: 하네스 통합 도구 설치
# ══════════════════════════════════════════════════════════
info "Step 5/${TOTAL_STEPS}: 하네스 통합 도구 설치..."
write_harness_lock
# 룰 이중 로드 해소(specs/006 US2): 복사본 공유 파일을 패키지 링크로
# 대체한다. 반드시 install(→pkg-sync materialize)보다 먼저 실행해야 한다 —
# 복사본 실디렉토리가 남은 채 materialize가 먼저 돌면 링크가 생성되지
# 못하고("실파일 보존" 경고), migrate가 전환 완료로 오판해 복사본 제거를
# 건너뛰는 혼합 상태가 된다 (시나리오 A 리허설 발견).
# 업스트림에 릴리스 태그가 없거나 오프라인이면 안내만 남긴다.
if ! (cd "$PROJECT_ROOT" && sh .harness/scripts/pkg/migrate.sh --fresh); then
  warn "  migrate --fresh 를 완료하지 못했습니다. 첫 하네스 릴리스 태그 발행 후"
  warn "  프로젝트 루트에서 './harness migrate --fresh' 를 다시 실행하세요."
fi
run_harness_install_if_needed

if [ "$PUSH_REMOTE" -eq 1 ]; then
  git add -A
  git commit -m "chore: 프로젝트 초기화 ${PROJECT_NAME}" --allow-empty || true
  git push -u origin main

  if git show-ref --verify --quiet refs/heads/dev; then
    git checkout dev
  else
    git checkout -b dev
  fi
  git push -u origin dev
  git checkout main

  info "  main, dev 브랜치 push 완료"
else
  warn "  --push 옵션이 없어 commit/push를 건너뜁니다."
  echo "  변경사항을 확인한 뒤 직접 실행하세요:"
  echo "    git add -A"
  echo "    git commit -m \"chore: 프로젝트 초기화 ${PROJECT_NAME}\""
  echo "    git push -u origin main"
  echo "    git checkout -b dev"
  echo "    git push -u origin dev"
fi

# ══════════════════════════════════════════════════════════
#  완료 안내
# ══════════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}  Project ${PROJECT_NAME} 초기화 완료! (B방식)${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "  Repo: https://github.com/${ORG}/${PROJECT_NAME}"
echo "  Profile mode: ${PROFILE_MODE}"
echo "  나중에 변경: ./harness profile set <mode>"
echo ""
echo "════════════════════════════════════════════════════════════"
echo -e "${YELLOW}  수동 설정 필요${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "  1. Infisical 프로젝트 준비 (${INFISICAL_API_URL}):"
echo "     - 프로젝트 생성: ${PROJECT_NAME}"
echo "     - dev 환경에 폴더 + 시크릿 등록:"
echo "       /backend/                   DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, NODE_ENV, PORT"
echo "       /backend/github-actions/    BACK_TARGET_HOST, BACK_TARGET_PORT, BACK_SERVER_USER,"
echo "                                   BACK_DEPLOY_DIR, BACK_APP_NAME, BACK_TAR_FILE,"
echo "                                   BACK_SSH_PRIVATE_KEY, BACK_APP_TYPE (선택, 기본 pm2)"
echo "                                   USE_CLOUDFLARE_TUNNEL=true 인 workflow에서만"
echo "                                   BACK_SSH_TUNNEL_HOST, BACK_BASTION_USER, BACK_BASTION_PORT 필요"
echo "       /frontend/                  NEXT_PUBLIC_*"
echo "       /frontend/github-actions/   (Vercel)   VERCEL_ORG_ID, VERCEL_PROJECT_ID"
echo "                                   (PM2/Docker) FRONT_TARGET_HOST, FRONT_TARGET_PORT,"
echo "                                                FRONT_SERVER_USER,"
echo "                                                FRONT_DEPLOY_DIR, FRONT_APP_NAME, FRONT_TAR_FILE,"
echo "                                                FRONT_SSH_PRIVATE_KEY, FRONT_APP_TYPE (pm2|static)"
echo "                                                USE_CLOUDFLARE_TUNNEL=true 인 workflow에서만"
echo "                                                FRONT_SSH_TUNNEL_HOST, FRONT_BASTION_USER,"
echo "                                                FRONT_BASTION_PORT 필요"
echo "       (Shared) /slack/            slack_bot_token, slack_channel"
echo "       (Shared) /vercel/           VERCEL_TOKEN"
echo "       (Shared) _CF_SHARED_PATH_   CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET"
echo "                                   ※ PM2/Docker 배포에서 Cloudflare Tunnel 통과 시에만 필요"
echo "                                   ※ 경로 예: /cloudflare/{domain}/{subdomain}"
echo "                                   ※ 워크플로우 _CF_SHARED_PATH_ placeholder를 직접 수정"
echo "                                     (docs/cloudflare-tunnel-ssh-guide.md 참조)"
echo "     - Project Settings → Copy Project ID 값은 3번 이후 wire-infisical에서 사용"
echo ""
echo "  2. 팀원 Join (env.co-di.com → All Projects → ${PROJECT_NAME}):"
echo "     - ai@co-di.com 은 admin"
echo "     - dev@co-di.com, su@co-di.com, design@co-di.com 은 member"
echo ""
echo "  3. Machine Identity (CI/CD 런타임용) 생성 또는 재사용:"
echo "     - Organization Access Control > Machine Identities"
echo "     - Auth Method: Universal Auth, TTL: 0"
echo "     - 이 프로젝트에 Read 권한 부여"
echo "     - Client ID/Secret을 복사해 둔 뒤 ./harness wire-infisical에서 사용"
echo ""
echo "  4. Cloudflare Tunnel 사용 프로젝트만 워크플로우 _CF_SHARED_PATH_ 직접 수정:"
echo "     - .github/workflows/deploy-*.yml 5개 파일의 _CF_SHARED_PATH_ 자리에"
echo "       이 프로젝트가 사용할 Cloudflare 시크릿 path 입력 (예: /cloudflare/<env>)"
echo "     - 사용할 PM2/Docker workflow env의 USE_CLOUDFLARE_TUNNEL 값을 \"true\"로 변경"
echo "     - 이 boolean은 Infisical secret으로 관리하지 않음"
echo ""
echo "  5. Shared-Secrets 프로젝트 접근 권한 (Slack/Vercel 공용):"
echo "     - /slack/      (slack_bot_token, slack_channel)"
echo "     - /vercel/     (VERCEL_TOKEN)"
echo "     - Machine Identity에 Shared-Secrets 프로젝트 Read 권한 부여"
echo ""
echo "  6. GitHub Actions Variables:"
echo "     - NODE_VERSION: 앱 런타임이 24가 아니면 20 또는 22로 지정"
echo "     - OSV_FAIL_ON_SEVERITY: 기본 high"
echo "     - BACKEND_DEPLOY_MODE: pm2 | docker | none (기본 pm2)"
echo "     - FRONTEND_DEPLOY_MODE: vercel | pm2 | docker | none (기본 vercel)"
echo "     - 예: React SPA를 PM2/static 서버로 배포하면 FRONTEND_DEPLOY_MODE=pm2"
echo "     - 자동 실행 진입점은 .github/workflows/pipeline.yml 하나만 사용"
echo ""
echo "  7. Vercel 프로젝트 연결 (${ORG}/${PROJECT_NAME}):"
echo "     - Vercel 대시보드에서 New Project → 레포 import"
echo "     - Root Directory: 빈 값"
echo "     - main → Production, dev → Preview"
echo "     - Settings > Git > Disconnect (GitHub Actions로 배포)"
echo "     - Infisical > Integrations > Vercel 연결 (자동 env 동기화)"
echo ""
echo "  8. 의존성 보안 자동화 설정:"
echo "     - Renovate GitHub App 설치 후 ${ORG}/${PROJECT_NAME} 레포 활성화"
echo "     - GitHub Settings > Code security에서 Dependency graph, Dependabot alerts 활성화"
echo "     - Private repository + GitHub Free 플랜에서는 Code scanning 저장을 사용하지 않음"
echo "     - Branch protection 또는 ruleset을 사용할 수 있으면 Pipeline 체크를 필수로 설정"
echo "     - Free/private 제한으로 세부 rule이 어렵더라도 Pipeline 내부 needs 관계가"
echo "       CI/Dependency Security 성공 후에만 배포를 실행"
echo "     - 수동 설정 체크리스트: .harness/docs/dependency-security-manual-setup.md"
echo "     - 세부 운영 기준: .harness/docs/dependency-security-automation.md"
echo ""
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}  다음 단계${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "  1. Infisical 콘솔 작업 후: ./harness wire-infisical ${PROJECT_NAME} --org ${ORG}"
echo "  2. 로컬 개발: infisical login 후 npm run dev"
echo "  3. 배포: git push origin dev → GitHub Actions 자동 배포"
echo "  4. 프로덕션: main 브랜치 push"
echo "  5. Profile 변경 시 ARCHITECTURE.md 또는 해당 spec(plan.md)에 architecture decision 기록"
echo ""
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}  Post-Setup 체크리스트 (필독)${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "  위에 안내된 Infisical 콘솔 작업, Machine Identity 발급,"
echo "  wire-infisical 실행, _CF_SHARED_PATH_ 치환,"
echo "  Renovate/Dependabot/Branch protection 설정까지 확인하세요."
echo ""
echo "  전체 체크리스트와 수동/자동 처리 경계는 아래 문서를 참고하세요:"
echo "    .harness/docs/init-project-post-setup.md"
echo ""
