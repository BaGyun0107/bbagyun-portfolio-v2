#!/usr/bin/env sh
# pending 버전 반영 — 에이전트 시작 전(preflight)에만 호출된다 (R5, FR-004).
# 사용법: pkg-apply-pending.sh (다운스트림 레포 루트에서)
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(pwd)"
PENDING="$ROOT_DIR/.harness/state/pkg-pending"
CACHE_DIR="${CODI_HARNESS_CACHE_DIR:-$HOME/.codi-harness}"

[ -f "$PENDING" ] || exit 0
TARGET="$(cat "$PENDING")"

if [ -d "$CACHE_DIR/versions/$TARGET" ]; then
  sh "$SCRIPT_DIR/apply-version.sh" "$TARGET"
  rm -f "$PENDING"
  echo "하네스 $TARGET 반영 완료 (세션 시작 전 flip)."
else
  # 캐시가 사라진 stale pending — 다음 update-check가 다시 수신한다.
  rm -f "$PENDING"
fi
