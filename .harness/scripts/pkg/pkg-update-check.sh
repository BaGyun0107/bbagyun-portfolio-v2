#!/usr/bin/env sh
# 세션 시작 채널 확인 — 수신까지만, 반영은 하지 않는다 (R5, FR-004/FR-005).
# 사용법: pkg-update-check.sh (다운스트림 레포 루트에서; update-check.sh가 호출)
# 오프라인·미설치·pin 최신 상태는 전부 조용히 exit 0.
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(pwd)"
LOCK="$ROOT_DIR/harness.lock"
PENDING="$ROOT_DIR/.harness/state/pkg-pending"

[ -f "$LOCK" ] || exit 0
# 미설치면 install/pkg-sync 경로가 담당한다.
[ -L "$ROOT_DIR/.harness/current" ] || exit 0

CURRENT="$(basename "$(readlink "$ROOT_DIR/.harness/current")")"
REPO_URL="$(node "$SCRIPT_DIR/resolve-version.mjs" repo "$LOCK")"

TAGS="$(git ls-remote --tags "$REPO_URL" 2>/dev/null || true)"
[ -z "$TAGS" ] && exit 0  # 오프라인 — 조용히 유지 (FR-007)

RESULT="$(printf '%s\n' "$TAGS" | node "$SCRIPT_DIR/resolve-version.mjs" resolve "$LOCK" "$CURRENT")"
TARGET="${RESULT%% *}"
MAJOR="${RESULT##* }"

if [ "$TARGET" != "$CURRENT" ]; then
  sh "$SCRIPT_DIR/fetch-version.sh" "$REPO_URL" "$TARGET" >/dev/null
  mkdir -p "$ROOT_DIR/.harness/state"
  printf '%s\n' "$TARGET" > "$PENDING"
  echo "하네스 $TARGET 수신 완료 — 다음 에이전트 시작 시 반영됩니다."
fi

if [ "$MAJOR" != "-" ]; then
  echo "안내: 상위 major 버전 v$MAJOR 이(가) 있습니다. 반영하려면 './harness update --major' 를 실행하세요."
fi
