#!/usr/bin/env sh
# 원클릭 온보딩 부트스트랩 (specs/004-onboarding-bootstrap).
# 계약: specs/004-onboarding-bootstrap/contracts/bootstrap-cli.md
# 종료 코드: 0 성공/확인, 1 실패, 2 사용법·미지원 OS, 3 재실행 필요
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)"
DRY_RUN=0
MARKER="# codi-harness: mise activate"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    *)
      echo "알 수 없는 인자입니다: $1" >&2
      echo "사용법: ./harness bootstrap [--dry-run]" >&2
      exit 2
      ;;
  esac
done

step() { printf '[bootstrap %s/7] %s\n' "$1" "$2"; }

# 하위 단계(pkg-sync / doctor)가 결과를 append 하는 파일.
# 형식은 specs/014-packaging-unification/data-model.md 1절.
SUMMARY_FILE="$ROOT_DIR/.harness/state/bootstrap-summary"
SUMMARY_PARSER="$SCRIPT_DIR/bootstrap-summary.mjs"

# 이전 회차의 값이 이번 요약으로 새어 나오지 않게 시작 시 비운다.
# dry-run 은 하위 단계를 돌리지 않으므로 남의 상태를 지울 이유가 없다.
if [ "$DRY_RUN" -eq 0 ]; then
  rm -f "$SUMMARY_FILE" 2>/dev/null || true
fi

run() {
  if [ "$DRY_RUN" -eq 1 ]; then
    printf 'dry-run: %s\n' "$*"
  else
    "$@"
  fi
}

# --- 1/7 OS 확인 ---
if [ "$(uname -s)" != "Darwin" ]; then
  echo "이 부트스트랩은 macOS 전용입니다. 다른 OS는 지원하지 않습니다." >&2
  exit 2
fi
step 1 "macOS 확인됨"

# --- 2/7 git / Xcode Command Line Tools ---
if xcode-select -p >/dev/null 2>&1; then
  step 2 "Xcode Command Line Tools 확인됨"
else
  step 2 "Xcode Command Line Tools 설치 필요"
  if [ "$DRY_RUN" -eq 1 ]; then
    printf 'dry-run: %s\n' "xcode-select --install"
  else
    xcode-select --install || true
    echo "설치 창에서 Command Line Tools 설치를 완료한 뒤 ./harness bootstrap 을 재실행하세요."
    exit 3
  fi
fi

# --- 3/7 mise 설치 + 셸 활성화 (멱등) ---
if command -v mise >/dev/null 2>&1; then
  step 3 "mise 확인됨"
else
  step 3 "mise 설치 중"
  if [ "$DRY_RUN" -eq 1 ]; then
    printf 'dry-run: %s\n' "curl -fsSL https://mise.run | sh"
  else
    curl -fsSL https://mise.run | sh
    PATH="$HOME/.local/bin:$PATH"
    export PATH
  fi
fi

ZSHRC="$HOME/.zshrc"
# 우리 마커뿐 아니라 사용자가 직접 넣은 활성화 라인도 존중한다 (중복 금지).
if grep -qs "mise activate" "$ZSHRC"; then
  : # 이미 활성화 설정 존재 — 중복 추가하지 않는다
elif [ "$DRY_RUN" -eq 1 ]; then
  printf 'dry-run: %s\n' "~/.zshrc 에 mise activate 라인 추가"
else
  {
    printf '\n%s\n' "$MARKER"
    printf 'eval "$(mise activate zsh)"\n'
  } >> "$ZSHRC"
  echo "~/.zshrc 에 mise 활성화 설정을 추가했습니다."
fi

# --- 4/7 도구 설치 (목록은 mise.toml 소유) ---
# 여기에 "이미 설치됨" 스킵 판정을 두지 않는 것은 의도다 (FR-018, research R4).
# mise install 자체가 이미 설치된 도구를 건너뛰므로, 별도 캐시 마커를 두면
# mise.toml 의 실제 상태와 어긋날 수 있는 두 번째 진실이 생긴다 — 이중 관리
# 비용과 드리프트 위험만 늘고 얻는 시간은 mise 가 이미 벌어 준다.
step 4 "도구 설치 (mise install)"
if [ "$DRY_RUN" -eq 1 ]; then
  printf 'dry-run: %s\n' "mise trust && mise install (cwd: $ROOT_DIR)"
else
  # 새 clone 경로는 신뢰되지 않아 mise가 설정을 읽지 않는다 (리허설 발견).
  (cd "$ROOT_DIR" && mise trust >/dev/null 2>&1 || true)
  (cd "$ROOT_DIR" && mise install)
fi

# --- 5/7 GitHub 인증 ---
if gh auth status >/dev/null 2>&1; then
  step 5 "GitHub 인증 확인됨"
else
  step 5 "GitHub 인증 필요"
  if [ "$DRY_RUN" -eq 1 ]; then
    printf 'dry-run: %s\n' "gh auth login"
  elif [ -t 0 ]; then
    gh auth login || true
    if ! gh auth status >/dev/null 2>&1; then
      echo "GitHub 인증이 완료되지 않았습니다. gh auth login 후 ./harness bootstrap 을 재실행하세요." >&2
      exit 3
    fi
    step 5 "GitHub 인증 확인됨"
  else
    echo "gh auth login 을 실행해 GitHub 인증을 완료한 뒤 ./harness bootstrap 을 재실행하세요." >&2
    exit 3
  fi
fi

# --- 6/7 하네스 설치 위임 + Superpowers ---
step 6 "하네스 설치 (./harness install)"
run "$ROOT_DIR/harness" install

# copy 모드에서는 bootstrap 이 하네스 파일을 갱신하지 않는다 — 일상 갱신
# 표면은 lock 모드 전제다 (감사 L-7). 은퇴 예고 중인 모드라 1회 안내만 한다.
if [ ! -f "$ROOT_DIR/harness.lock" ]; then
  echo "안내: copy 모드입니다 — 하네스 갱신은 ./harness update, lock 전환은 ./harness migrate (copy 모드는 은퇴 예고 상태)."
fi

# Superpowers 자동 설치 시도 (specs/004-onboarding-bootstrap research.md R4).
# claude plugin install 은 문서화된 유일한 비대화식 설치 경로다.
SUPERPOWERS_MANUAL=0
if command -v claude >/dev/null 2>&1; then
  if claude plugin list 2>/dev/null | grep -q "superpowers"; then
    echo "Superpowers 플러그인 확인됨"
  elif [ "$DRY_RUN" -eq 1 ]; then
    printf 'dry-run: %s\n' "claude plugin install superpowers@claude-plugins-official"
  else
    claude plugin marketplace add anthropics/claude-plugins-official >/dev/null 2>&1 || true
    if claude plugin install superpowers@claude-plugins-official; then
      echo "Superpowers 플러그인 설치됨"
    else
      SUPERPOWERS_MANUAL=1
    fi
  fi
else
  SUPERPOWERS_MANUAL=1
fi

# --- 7/7 검증 + 요약 ---
step 7 "설치 검증 (./harness doctor)"
run "$ROOT_DIR/harness" doctor

# 요약 출력. 보고 기능이 준비 자체를 막으면 안 되므로(계약) 파서 실패·파서
# 부재·읽기 실패는 전부 삼키고 블록만 생략한다. dry-run 은 실제 변경이
# 없으므로 요약하지 않는다.
if [ "$DRY_RUN" -eq 0 ] && [ -f "$SUMMARY_PARSER" ] && command -v node >/dev/null 2>&1; then
  SUMMARY_TEXT="$(node "$SUMMARY_PARSER" "$SUMMARY_FILE" 2>/dev/null || true)"
  if [ -n "$SUMMARY_TEXT" ]; then
    echo ""
    printf '%s\n' "$SUMMARY_TEXT"
  fi
  rm -f "$SUMMARY_FILE" 2>/dev/null || true
fi

echo ""
echo "부트스트랩 완료. 새 터미널을 열거나 'source ~/.zshrc' 로 셸 설정을 반영하세요."

if [ "$SUPERPOWERS_MANUAL" -eq 1 ]; then
  cat <<'SUPERPOWERS_MANUAL_NOTE'

남은 수동 단계 1개 — Superpowers 플러그인:
  claude CLI가 없거나 자동 설치에 실패했습니다. 아래 중 하나로 설치하세요.
  - 셸에서: claude plugin install superpowers@claude-plugins-official
  - Claude Code 세션 안에서: /plugin install superpowers@claude-plugins-official
SUPERPOWERS_MANUAL_NOTE
fi
