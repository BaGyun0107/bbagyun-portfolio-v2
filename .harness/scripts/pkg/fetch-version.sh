#!/usr/bin/env sh
# 하네스 버전 캐시 수신 (specs/005-harness-packaging R2).
# 사용법: fetch-version.sh <repo-url> <X.Y.Z>
# partial→mv 확정으로 "불완전 수신이 정식 버전으로 보이는" 상태를 배제한다.
set -eu

REPO_URL="${1:?repo URL이 필요합니다}"
VERSION="${2:?X.Y.Z 버전이 필요합니다}"
CACHE_DIR="${CODI_HARNESS_CACHE_DIR:-$HOME/.codi-harness}"
VERSIONS_DIR="$CACHE_DIR/versions"
FINAL="$VERSIONS_DIR/$VERSION"
PARTIAL="$VERSIONS_DIR/$VERSION.partial"
LOCKDIR="$CACHE_DIR/fetch.lock"

mkdir -p "$VERSIONS_DIR"

if [ -d "$FINAL" ]; then
  echo "버전 $VERSION 은 이미 캐시에 있습니다."
  exit 0
fi

# mkdir 기반 lockdir로 동시 수신을 직렬화한다 (최대 60초 대기).
i=0
while ! mkdir "$LOCKDIR" 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -gt 600 ]; then
    echo "fetch lock 대기 초과: $LOCKDIR 를 확인 후 재실행하세요." >&2
    exit 1
  fi
  sleep 0.1
done
trap 'rmdir "$LOCKDIR" 2>/dev/null || true' EXIT INT TERM

# 락 획득 후 재확인 — 대기 중 다른 프로세스가 이미 받았을 수 있다.
if [ -d "$FINAL" ]; then
  echo "버전 $VERSION 은 이미 캐시에 있습니다."
  exit 0
fi

rm -rf "$PARTIAL"
if ! git clone --quiet --depth 1 --branch "v$VERSION" "$REPO_URL" "$PARTIAL"; then
  rm -rf "$PARTIAL"
  echo "버전 v$VERSION 수신에 실패했습니다. 네트워크와 태그 존재를 확인 후 재실행하세요." >&2
  exit 1
fi
mv "$PARTIAL" "$FINAL"
echo "버전 $VERSION 수신 완료: $FINAL"
