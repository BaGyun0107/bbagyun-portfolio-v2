#!/usr/bin/env sh
# KEEP_COMMITTED 파일을 패키지 버전으로 갱신한다 (specs/006 후속).
# 사용법: keep-committed.sh <패키지 루트> <레포 루트>
#
# lock 모드에서도 커밋으로 남는 파일들이라 심링크가 아니다. 버전이 올라가면
# 누군가 복사해 주지 않으면 낡은 채로 남으므로, migrate 와 pkg-sync 양쪽이
# 이 스크립트를 호출한다. 목록의 단일 출처는 migrate-plan.mjs 의
# KEEP_COMMITTED 이며 여기서 그대로 읽어 쓴다 (하드코딩 금지).
set -eu

PKG_ROOT="${1:?패키지 루트가 필요합니다}"
REPO_ROOT="${2:?레포 루트가 필요합니다}"

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PLAN_MJS="$PKG_ROOT/.harness/scripts/pkg/migrate-plan.mjs"
[ -f "$PLAN_MJS" ] || PLAN_MJS="$SCRIPT_DIR/migrate-plan.mjs"
[ -f "$PLAN_MJS" ] || exit 0

# 모듈 경로는 argv 가 아니라 env 로 넘긴다 — argv[1] 로 넘기면 migrate-plan 의
# isMain 가드(argv[1] == 자기 경로)가 오판해 CLI main 이 import 시점에 실행되고,
# 픽스처·비 lock 환경에서는 throw 로 목록이 공백이 돼 갱신이 조용히 무동작했다
# (2026-08-03 specs/017 M-1 구현 중 발견).
FILES="$(HARNESS_PLAN_MJS="$PLAN_MJS" node -e '
import(process.env.HARNESS_PLAN_MJS)
  .then((m) => console.log((m.KEEP_COMMITTED || []).join("\n")))
  .catch(() => process.exit(0));
' 2>/dev/null || true)"

printf '%s\n' "$FILES" | while IFS= read -r f; do
  [ -n "$f" ] || continue
  src="$PKG_ROOT/$f"
  dest="$REPO_ROOT/$f"
  [ -f "$src" ] || continue
  # 심링크 자리는 건드리지 않는다 (materialize 소유). 파일 자체뿐 아니라
  # 상위 디렉터리가 링크인 경우도 건너뛴다 — 그대로 cp 하면 소스와 목적지가
  # 같은 실체라 "are the same file"로 실패한다 (구조 전환 과도기).
  [ ! -L "$dest" ] || continue
  dest_dir="$(dirname "$dest")"
  skip=0
  probe="$dest_dir"
  while [ "$probe" != "$REPO_ROOT" ] && [ "$probe" != "/" ] && [ -n "$probe" ]; do
    if [ -L "$probe" ]; then skip=1; break; fi
    probe="$(dirname "$probe")"
  done
  [ "$skip" -eq 0 ] || continue
  mkdir -p "$dest_dir"
  cp "$src" "$dest"
  case "$f" in
    harness|*.sh) chmod +x "$dest" ;;
  esac
done
