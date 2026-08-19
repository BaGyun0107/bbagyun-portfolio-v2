#!/usr/bin/env sh
# harness pin — 즉시 고정/롤백, 채널 복귀 (specs/005-harness-packaging US3).
# 사용법: pin.sh <X.Y.Z> | pin.sh --channel latest-minor
# 순서 보장: 버전 확보(캐시 또는 수신) → lock 재작성 → materialize.
# 확보 실패 시 lock과 트리는 그대로 남는다 (FR-010).
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(pwd)"
LOCK="$ROOT_DIR/harness.lock"
CACHE_DIR="${CODI_HARNESS_CACHE_DIR:-$HOME/.codi-harness}"

if [ ! -f "$LOCK" ]; then
  echo "harness.lock이 없습니다 (lock 모드 아님)." >&2
  exit 1
fi

if [ "${1:-}" = "--channel" ]; then
  CHANNEL="${2:?채널 이름이 필요합니다}"
  node "$SCRIPT_DIR/resolve-version.mjs" rewrite "$LOCK" channel "$CHANNEL"
  echo "lock을 채널($CHANNEL)로 되돌렸습니다. 다음 세션 시작부터 자동 반영됩니다."
  exit 0
fi

VERSION="${1:?X.Y.Z 버전 또는 --channel 이 필요합니다}"
case "$VERSION" in
  [0-9]*.[0-9]*.[0-9]*) ;;
  *)
    echo "version은 X.Y.Z semver여야 합니다: $VERSION" >&2
    exit 2
    ;;
esac

# 1) 버전 확보 — 캐시에 없으면 수신 시도 (오프라인이면 여기서 실패)
if [ ! -d "$CACHE_DIR/versions/$VERSION" ]; then
  REPO_URL="$(node "$SCRIPT_DIR/resolve-version.mjs" repo "$LOCK")"
  if ! sh "$SCRIPT_DIR/fetch-version.sh" "$REPO_URL" "$VERSION"; then
    echo "버전 $VERSION 을 확보하지 못해 pin을 중단합니다 (lock·트리 불변)." >&2
    exit 1
  fi
fi

# 2) lock 재작성 → 3) 즉시 반영
node "$SCRIPT_DIR/resolve-version.mjs" rewrite "$LOCK" "$VERSION"
sh "$SCRIPT_DIR/apply-version.sh" "$VERSION"
rm -f "$ROOT_DIR/.harness/state/pkg-pending"
echo "버전 $VERSION 으로 고정(pin)했습니다."
