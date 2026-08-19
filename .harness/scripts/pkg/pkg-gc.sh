#!/usr/bin/env sh
# 버전 캐시 정리 (pkg-gc). 어떤 레포도 참조하지 않는 구버전을 제거한다.
# 사용법: pkg-gc.sh [--dry-run]
#
# 보존 규칙:
#   1. 레지스트리($CACHE_DIR/repos)에 등록된 각 레포의 .harness/current 대상 버전
#   2. 각 레포의 .harness/state/pkg-pending 에 기록된 수신 완료 대기 버전
#   3. 캐시의 최신 semver 버전 (새 레포 부트스트랩 재수신 방지)
# 레지스트리가 없으면 참조 판단이 불가능하므로 아무것도 지우지 않고 안내한다.
set -eu

CACHE_DIR="${CODI_HARNESS_CACHE_DIR:-$HOME/.codi-harness}"
VERSIONS_DIR="$CACHE_DIR/versions"
REPOS_FILE="$CACHE_DIR/repos"
LOCKDIR="$CACHE_DIR/fetch.lock"
DRY_RUN=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    *)
      echo "알 수 없는 인자입니다: $1 (사용법: ./harness pkg-gc [--dry-run])" >&2
      exit 2
      ;;
  esac
done

[ -d "$VERSIONS_DIR" ] || { echo "버전 캐시가 없습니다: $VERSIONS_DIR"; exit 0; }

if [ ! -s "$REPOS_FILE" ]; then
  echo "소비 레포 레지스트리($REPOS_FILE)가 비어 있어 참조 버전을 판단할 수 없습니다." >&2
  echo "각 레포에서 './harness pkg-sync' 를 한 번 실행해 등록한 뒤 다시 실행하세요." >&2
  exit 1
fi

# fetch와 동시 실행을 직렬화한다 (fetch-version.sh와 같은 lockdir).
i=0
while ! mkdir "$LOCKDIR" 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -gt 600 ]; then
    echo "cache lock 대기 초과: $LOCKDIR 를 확인 후 재실행하세요." >&2
    exit 1
  fi
  sleep 0.1
done
trap 'rmdir "$LOCKDIR" 2>/dev/null || true' EXIT INT TERM

keep_file="$(mktemp)"
live_repos="$(mktemp)"

# 1) 레지스트리 정리 + 참조 버전 수집 (current 대상 + pending)
while IFS= read -r repo; do
  [ -n "$repo" ] || continue
  [ -d "$repo" ] || continue
  printf '%s\n' "$repo" >> "$live_repos"
  target="$(readlink "$repo/.harness/current" 2>/dev/null || true)"
  case "$target" in
    "$VERSIONS_DIR"/*) basename "$target" >> "$keep_file" ;;
  esac
  pending="$repo/.harness/state/pkg-pending"
  if [ -f "$pending" ]; then
    sed -n 's/^[v ]*\([0-9][0-9.]*\).*$/\1/p' "$pending" | head -n 1 >> "$keep_file"
  fi
done < "$REPOS_FILE"
sort -u "$live_repos" > "$REPOS_FILE"

# 2) 최신 버전은 항상 보존
latest="$(ls "$VERSIONS_DIR" 2>/dev/null \
  | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' \
  | sort -t . -k 1,1n -k 2,2n -k 3,3n | tail -n 1)"
[ -n "$latest" ] && printf '%s\n' "$latest" >> "$keep_file"

removed=0
kept=0
for dir in "$VERSIONS_DIR"/*; do
  [ -d "$dir" ] || continue
  version="$(basename "$dir")"
  if grep -Fxq -- "$version" "$keep_file" 2>/dev/null; then
    kept=$((kept + 1))
    continue
  fi
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "dry-run: 제거 대상 $version"
  else
    rm -rf "$dir"
    echo "제거: $version"
  fi
  removed=$((removed + 1))
done
rm -f "$keep_file" "$live_repos"

if [ "$DRY_RUN" -eq 1 ]; then
  echo "dry-run 완료: 보존 ${kept}개, 제거 대상 ${removed}개 (변경 없음)"
else
  echo "pkg-gc 완료: 보존 ${kept}개, 제거 ${removed}개"
fi
