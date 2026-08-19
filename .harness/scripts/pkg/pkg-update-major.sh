#!/usr/bin/env sh
# 상위 major 반영 — 명시적 실행 전용 (specs/005-harness-packaging FR-005).
# 사용법: pkg-update-major.sh (다운스트림 레포 루트에서; ./harness update --major)
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(pwd)"
LOCK="$ROOT_DIR/harness.lock"

if [ ! -f "$LOCK" ]; then
  echo "harness.lock이 없습니다 (lock 모드 아님)." >&2
  exit 1
fi

REPO_URL="$(node "$SCRIPT_DIR/resolve-version.mjs" repo "$LOCK")"
TAGS="$(git ls-remote --tags "$REPO_URL" 2>/dev/null || true)"
if [ -z "$TAGS" ]; then
  echo "업스트림($REPO_URL)에 접근할 수 없습니다. 네트워크 연결 후 재실행하세요." >&2
  exit 1
fi

TARGET="$(printf '%s\n' "$TAGS" | node "$SCRIPT_DIR/resolve-version.mjs" latest "$LOCK")"

CURRENT="-"
if [ -L "$ROOT_DIR/.harness/current" ]; then
  CURRENT="$(basename "$(readlink "$ROOT_DIR/.harness/current")")"
fi
if [ "$TARGET" = "$CURRENT" ]; then
  echo "이미 최신 버전($CURRENT)입니다."
  exit 0
fi

sh "$SCRIPT_DIR/fetch-version.sh" "$REPO_URL" "$TARGET"
# 고정 lock이면 고정값을 새 major로 갱신하고, 채널 lock은 그대로 둔다
# (채널은 반영된 current를 기준으로 새 major 안에서 추적을 계속한다).
if grep -q '"version"' "$LOCK"; then
  node "$SCRIPT_DIR/resolve-version.mjs" rewrite "$LOCK" "$TARGET"
fi
sh "$SCRIPT_DIR/apply-version.sh" "$TARGET"
rm -f "$ROOT_DIR/.harness/state/pkg-pending"
echo "상위 major 버전 $TARGET 반영 완료. breaking 변경은 CHANGELOG를 확인하세요."
