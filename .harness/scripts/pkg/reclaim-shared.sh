#!/usr/bin/env sh
# [은퇴 예고] 잔재 회수는 prune-downstream --apply 로 통합됐다 (specs/015).
# 이 스크립트는 외부 직접 호출 호환을 위해 한 버전 동안 보고 전용 wrapper 로
# 남는다 — v2.0.0 에서 제거 예정 (ROADMAP.md 예정 작업 등재).
# 인덱스는 더 이상 건드리지 않는다:
# 팀원 머신에서 인덱스 회수가 돌면 워킹트리가 dirty 가 되기 때문이다
# (specs/015 US2·갭 6). 정리·커밋은 소유자 플로우가 담당한다.
# 사용법: reclaim-shared.sh <패키지 루트> <레포 루트>
# 주의: <패키지 루트> 는 호출 호환용으로만 남았고 판정 패키지를 고르지 않는다 —
# 판정은 항상 <레포 루트>/.harness/current 가 가리키는 버전 기준이다.
set -eu

PKG_ROOT="${1:?패키지 루트가 필요합니다}"
REPO_ROOT="${2:?레포 루트가 필요합니다}"

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

PRUNE_MJS="$PKG_ROOT/.harness/scripts/setup/prune-downstream.mjs"
[ -f "$PRUNE_MJS" ] || PRUNE_MJS="$SCRIPT_DIR/../setup/prune-downstream.mjs"
[ -f "$PRUNE_MJS" ] || exit 0
command -v node >/dev/null 2>&1 || exit 0

COUNT="$(HARNESS_ROOT="$REPO_ROOT" node "$PRUNE_MJS" --count 2>/dev/null || printf '0')"
case "$COUNT" in
  ''|*[!0-9]*) COUNT=0 ;;
esac
if [ "$COUNT" -gt 0 ]; then
  echo "하네스 잔재 ${COUNT}건 발견 — './harness prune-downstream' 으로 확인 후 --apply 로 정리하세요."
fi
