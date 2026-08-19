#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)"

if command -v actionlint >/dev/null 2>&1; then
  actionlint "$ROOT_DIR/.github/workflows"/*.yml
  exit 0
fi

echo "경고: actionlint를 사용할 수 없습니다. 로컬 GitHub Actions 검증을 하려면 actionlint를 설치하세요." >&2
exit 0
