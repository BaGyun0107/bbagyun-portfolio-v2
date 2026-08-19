#!/usr/bin/env sh
# lock 해석 → 수신 → materialize 오케스트레이션 (specs/005-harness-packaging).
# 사용법: pkg-sync.sh  (다운스트림 레포 루트에서 실행; lock 없으면 no-op)
# 오프라인이면 현재 캐시 버전으로 조용히 유지한다 (FR-007).
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(pwd)"
LOCK="$ROOT_DIR/harness.lock"

if [ ! -f "$LOCK" ]; then
  echo "harness.lock이 없어 패키지 동기화를 건너뜁니다 (lock 모드 아님)."
  exit 0
fi

REPO_URL="$(node "$SCRIPT_DIR/resolve-version.mjs" repo "$LOCK")"

# bootstrap 이 7단계 끝에 취합하는 결과 요약(specs/014 data-model.md 1절).
# 기록 실패가 동기화를 막으면 안 되므로 전부 무시한다.
SUMMARY_FILE="$ROOT_DIR/.harness/state/bootstrap-summary"
record_summary() {
  mkdir -p "$ROOT_DIR/.harness/state" 2>/dev/null || return 0
  printf '%s\n' "$1" >> "$SUMMARY_FILE" 2>/dev/null || true
}

CURRENT="-"
if [ -L "$ROOT_DIR/.harness/current" ]; then
  CURRENT="$(basename "$(readlink "$ROOT_DIR/.harness/current")")"
fi

# stderr를 보존한다: private 업스트림 인증 실패가 "접근 불가"로 뭉뚱그려지면
# 원인 파악이 불가능하다 (CI 실측).
LS_ERR="$(mktemp)"
TAGS="$(git ls-remote --tags "$REPO_URL" 2>"$LS_ERR" || true)"
if [ -z "$TAGS" ]; then
  if [ "$CURRENT" != "-" ]; then
    echo "업스트림에 접근할 수 없어 현재 버전($CURRENT)을 유지합니다."
    rm -f "$LS_ERR"
    exit 0
  fi
  echo "업스트림($REPO_URL)에 접근할 수 없고 캐시된 버전도 없습니다." >&2
  if [ -s "$LS_ERR" ]; then
    echo "git 원인:" >&2
    sed 's/^/  /' "$LS_ERR" >&2
    echo "업스트림이 private이면 읽기 권한이 있는 자격증명이 필요합니다" >&2
    echo "(CI에서는 checkout 이후 하네스 레포 읽기 토큰을 git credential 또는" >&2
    echo " git config url.\"https://x-access-token:<token>@github.com/\".insteadOf 로 주입하세요)." >&2
  else
    echo "네트워크 연결 후 재실행하세요." >&2
  fi
  rm -f "$LS_ERR"
  exit 1
fi
rm -f "$LS_ERR"

RESULT="$(printf '%s\n' "$TAGS" | node "$SCRIPT_DIR/resolve-version.mjs" resolve "$LOCK" "$CURRENT")"
TARGET="${RESULT%% *}"
MAJOR="${RESULT##* }"

if [ "$TARGET" != "$CURRENT" ] || [ ! -L "$ROOT_DIR/.harness/current" ]; then
  sh "$SCRIPT_DIR/fetch-version.sh" "$REPO_URL" "$TARGET"
  sh "$SCRIPT_DIR/apply-version.sh" "$TARGET"
  # 이 분기는 버전이 바뀐 경우와 링크만 깨진 경우를 함께 탄다. 후자는 버전이
  # 그대로이므로 "X -> X" 로 보고하면 사용자를 오도한다.
  if [ "$TARGET" = "$CURRENT" ]; then
    record_summary "version unchanged:$CURRENT"
  else
    # CURRENT 가 "-" 인 첫 수신도 그대로 남긴다 — 요약에서 "- -> X" 로 읽힌다.
    record_summary "version $CURRENT->$TARGET"
  fi
else
  echo "버전 $CURRENT 이(가) 최신입니다."
  record_summary "version unchanged:$CURRENT"
  # 이미 최신이어도 materialize를 재실행(멱등)한다 — 링크 드리프트를 복구하고
  # 소비 레포를 pkg-gc 레지스트리에 등록하는 유일한 지점이기 때문이다.
  sh "$SCRIPT_DIR/apply-version.sh" "$CURRENT"
  TARGET="$CURRENT"
fi

# KEEP_COMMITTED 갱신은 apply-version.sh 가 materialize 와 함께 수행한다
# (specs/017 M-1 — 단일 진입점).
CACHE_DIR="${CODI_HARNESS_CACHE_DIR:-$HOME/.codi-harness}"

# gitignore 필수 항목 반영 (specs/015 US3·갭 1): lock 레포의 정기 갱신 경로는
# pkg-sync 뿐이다 — update.sh 는 lock 모드에서 조기 종료한다. materialize 뒤에
# 돌려야 lockModeEntries 의 "심링크가 된 뒤 등재" 가드가 올바로 동작한다.
ENSURE_MJS="$CACHE_DIR/versions/$TARGET/.harness/scripts/setup/ensure-gitignore.mjs"
[ -f "$ENSURE_MJS" ] || ENSURE_MJS="$SCRIPT_DIR/../setup/ensure-gitignore.mjs"
if [ -f "$ENSURE_MJS" ] && command -v node >/dev/null 2>&1; then
  GITIGNORE_OUT="$(ROOT_DIR="$ROOT_DIR" node "$ENSURE_MJS" 2>/dev/null || true)"
  if [ -n "$GITIGNORE_OUT" ]; then
    echo "gitignore 필수 항목 반영:"
    printf '%s\n' "$GITIGNORE_OUT" | sed 's/^/  - /'
    GITIGNORE_COUNT="$(printf '%s\n' "$GITIGNORE_OUT" | grep -c . || true)"
    case "$GITIGNORE_COUNT" in
      ''|*[!0-9]*) ;;
      0) ;;
      *) record_summary "gitignore $GITIGNORE_COUNT" ;;
    esac
  fi
fi

# 잔재 보고 (specs/015 US2·갭 6): 여기서는 보고만 한다. 인덱스 변경
# (git rm --cached)·파일 삭제는 소유자 명령 prune-downstream --apply 전용이다 —
# 팀원 머신에서 인덱스를 바꾸면 bootstrap 후 워킹트리가 dirty 가 된다.
PRUNE_MJS="$CACHE_DIR/versions/$TARGET/.harness/scripts/setup/prune-downstream.mjs"
[ -f "$PRUNE_MJS" ] || PRUNE_MJS="$SCRIPT_DIR/../setup/prune-downstream.mjs"
if [ -f "$PRUNE_MJS" ] && command -v node >/dev/null 2>&1; then
  RESIDUE="$(node "$PRUNE_MJS" --count 2>/dev/null || printf '0')"
  case "$RESIDUE" in
    ''|*[!0-9]*) RESIDUE=0 ;;
  esac
  if [ "$RESIDUE" -gt 0 ]; then
    echo "하네스 잔재 ${RESIDUE}건 발견 — 정리는 소유자가 수행합니다:"
    echo "  ./harness prune-downstream        # 분류별 확인"
    echo "  ./harness prune-downstream --apply  # 정리 후 커밋"
    record_summary "residue $RESIDUE"
  fi
fi

if [ "$MAJOR" != "-" ]; then
  echo "안내: 상위 major 버전 v$MAJOR 이(가) 있습니다. 반영하려면 './harness update --major' 를 실행하세요."
fi
