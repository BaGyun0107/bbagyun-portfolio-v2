#!/usr/bin/env sh
# 기존(복사본 커밋) 다운스트림의 lock 모드 전환 (specs/006-harness-migrate).
# 계약: specs/006-harness-migrate/contracts/migrate-cli.md
# 종료: 0 완료/dry-run/멱등, 1 중단(dirty·오프라인·검증), 2 사용법·업스트림
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(pwd)"
LOCK="$ROOT_DIR/harness.lock"
UPSTREAM_URL="${CODI_HARNESS_UPSTREAM_URL:-https://github.com/CODIWORKS-Engineer/codi-harness.git}"
CACHE_DIR="${CODI_HARNESS_CACHE_DIR:-$HOME/.codi-harness}"
DRY_RUN=0
FRESH=0

# 경로 자신 또는 조상 중 하나라도 심링크면 참. lock 모드에서는 공유 경로가
# 캐시를 가리키는 심링크라, 그 아래를 rm 하면 링크를 따라가 캐시 원본을
# 파괴한다(다른 레포까지 동시 손상). 직속 부모만 보면 .harness/scripts/pkg
# 처럼 링크 아래의 실디렉토리를 놓치므로 조상 전체를 훑는다.
path_has_symlink() {
  _p="$1"
  while [ -n "$_p" ] && [ "$_p" != "." ] && [ "$_p" != "/" ]; do
    [ ! -L "$ROOT_DIR/$_p" ] || return 0
    case "$_p" in
      */*) _p="${_p%/*}" ;;
      *) _p="" ;;
    esac
  done
  return 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --fresh) FRESH=1; shift ;;
    *)
      echo "알 수 없는 인자입니다: $1 (사용법: ./harness migrate [--dry-run])" >&2
      exit 2
      ;;
  esac
done

# 1) 업스트림 하네스 레포 거부 — 패키지의 원천은 소비자가 될 수 없다.
origin_url="$(git -C "$ROOT_DIR" remote get-url origin 2>/dev/null || true)"
origin_url="${origin_url%/}"; origin_url="${origin_url%.git}"
case "$origin_url" in
  https://github.com/CODIWORKS-Engineer/codi-harness|\
  https://github.com/CODIWORKS-Engineer/codi-harness-v2|\
  git@github.com:CODIWORKS-Engineer/codi-harness|\
  git@github.com:CODIWORKS-Engineer/codi-harness-v2)
    echo "업스트림 하네스 레포에서는 migrate를 실행할 수 없습니다." >&2
    exit 2
    ;;
esac
if [ -z "$(git -C "$ROOT_DIR" remote 2>/dev/null || true)" ]; then
  if git -C "$ROOT_DIR" show-ref --verify --quiet refs/heads/v1 ||
     git -C "$ROOT_DIR" show-ref --verify --quiet refs/heads/v2; then
    echo "업스트림 하네스 레포(버전 브랜치 감지)에서는 migrate를 실행할 수 없습니다." >&2
    exit 2
  fi
fi

# 2) 멱등 — 이미 전환된 레포. --fresh는 예외: init 도중 pkg-sync가 먼저
# materialize 해 current가 생겨도 복사본 제거는 아직일 수 있으므로
# (시나리오 A 리허설 발견) 끝까지 진행해 복사본을 정리한다.
if [ "$FRESH" -eq 0 ] && [ -f "$LOCK" ] && [ -L "$ROOT_DIR/.harness/current" ]; then
  echo "이미 lock 모드로 전환된 레포입니다. 동기화는 ./harness pkg-sync 를 사용하세요."
  exit 0
fi

# 참고: --fresh는 lock/current가 이미 있어도 끝까지 진행한다(v1.0.3 혼합
# 상태 복구). 대신 삭제 루프가 심링크 경유 경로를 건너뛰어 공유 캐시 원본
# 파괴를 막는다 — 아래 "심링크 경유 경로는 제외" 주석 참조.

# 3) dirty 워킹트리 중단 (dry-run 제외 — 읽기 전용. --fresh 제외 —
# init 직후는 복사본이 의도적으로 untracked 상태다.)
if [ "$DRY_RUN" -eq 0 ] && [ "$FRESH" -eq 0 ] && [ -n "$(git -C "$ROOT_DIR" status --porcelain)" ]; then
  echo "워킹트리에 커밋되지 않은 변경이 있어 중단합니다:" >&2
  git -C "$ROOT_DIR" status --porcelain >&2
  echo "커밋 또는 스태시 후 재실행하세요." >&2
  exit 1
fi

# 4) 대상 버전 결정 + 수신 (오프라인이면 여기서 중단 — lock 미생성)
TAGS="$(git ls-remote --tags "$UPSTREAM_URL" 2>/dev/null || true)"
if [ -z "$TAGS" ]; then
  echo "업스트림($UPSTREAM_URL)에 접근할 수 없어 중단합니다. 네트워크 연결 후 재실행하세요." >&2
  exit 1
fi
TMP_LOCK="$(mktemp)"
printf '{"schema_version":1,"channel":"latest-minor","repo":"%s"}\n' "$UPSTREAM_URL" > "$TMP_LOCK"
TARGET="$(printf '%s\n' "$TAGS" | node "$SCRIPT_DIR/resolve-version.mjs" resolve "$TMP_LOCK" -)"
TARGET="${TARGET%% *}"
rm -f "$TMP_LOCK"
sh "$SCRIPT_DIR/fetch-version.sh" "$UPSTREAM_URL" "$TARGET" >/dev/null

# 5) 제거 목록 계산 (dry-run은 여기서 목록만 출력하고 종료)
MANIFEST="$CACHE_DIR/versions/$TARGET/.harness/shared-manifest.json"
PLAN_FLAGS=""
[ "$FRESH" -eq 1 ] && PLAN_FLAGS="--disk"
# shellcheck disable=SC2086
MIGRATE_PLAN_MJS="$SCRIPT_DIR/migrate-plan.mjs"
REMOVALS="$(node "$MIGRATE_PLAN_MJS" "$ROOT_DIR" "$MANIFEST" $PLAN_FLAGS)"
if [ "$DRY_RUN" -eq 1 ]; then
  echo "dry-run: 전환 시 제거될 커밋 파일 목록 (버전 $TARGET 기준):"
  printf '%s\n' "$REMOVALS"
  echo "dry-run: 생성될 파일: harness.lock (channel: latest-minor)"
  exit 0
fi

# 6) 전환 실행 — lock 생성(없을 때만) → 삭제 → materialize.
# 순서가 중요하다: 커밋 실파일이 링크 자리를 차지한 채 materialize가 먼저
# 돌면 링크가 생성되지 못하고, 뒤이은 삭제가 경로를 통째로 비운다
# (codi-crew 리허설에서 실증된 결함).
LOCK_CREATED=0
if [ ! -f "$LOCK" ]; then
  printf '{\n  "schema_version": 1,\n  "channel": "latest-minor",\n  "repo": "%s"\n}\n' "$UPSTREAM_URL" > "$LOCK"
  LOCK_CREATED=1
fi
printf '%s\n' "$REMOVALS" | while IFS= read -r f; do
  [ -n "$f" ] || continue
  if [ "$FRESH" -eq 1 ]; then
    # 신규 레포: untracked 복사본 — 파일 삭제 (tracked면 인덱스도 정리)
    git -C "$ROOT_DIR" rm -q --ignore-unmatch -- "$f" 2>/dev/null || true
    # 심링크 경유 경로는 제외 — 링크를 따라가 공유 캐시 원본을 지우는 사고
    # 방지 (혼합 상태 복구 재실행에서 실제로 발생했다).
    path_has_symlink "$f" || rm -f "$ROOT_DIR/$f"
  else
    git -C "$ROOT_DIR" rm --quiet -- "$f"
  fi
done

# git rm은 tracked 파일만 지운다. 다운스트림이 공유 경로를 .gitignore에
# 올려 둔 경우(예: .harness/vendor) 복사본이 untracked라 살아남고, 비어 있지
# 않은 실디렉토리가 materialize의 링크 자리를 막아 "실파일 보존" 경고와 함께
# 혼합 상태가 된다. manifest가 공유로 선언한 경로에 한해 잔재를 정리한다.
# 프로젝트 소유 경로는 migrate-plan이 이미 제외했으므로 여기서는 안전하다.
# 실행 원본은 캐시 쪽이어야 한다: 바로 위 git rm이 레포 사본의
# .harness/scripts/** 를 지웠으므로 $SCRIPT_DIR 경로는 이미 없을 수 있다
# (없으면 조용히 건너뛰어 vendor 잔재가 남는 결함이 실제로 발생했다).
PLAN_MJS_RUN="$CACHE_DIR/versions/$TARGET/.harness/scripts/pkg/migrate-plan.mjs"
[ -f "$PLAN_MJS_RUN" ] || PLAN_MJS_RUN="$MIGRATE_PLAN_MJS"
node "$PLAN_MJS_RUN" "$ROOT_DIR" "$MANIFEST" --disk 2>/dev/null \
  | while IFS= read -r f; do
      [ -n "$f" ] || continue
      path_has_symlink "$f" && continue
      [ ! -f "$ROOT_DIR/$f" ] || rm -f "$ROOT_DIR/$f"
    done

# 파일 제거 후 비게 된 공유 디렉토리를 정리한다 — 빈 실디렉토리가 남으면
# materialize의 link_entry가 링크로 대체하지 못하고 "실파일 보존" 경고와
# 함께 혼합 상태가 된다 (--fresh 재실행 복구 경로 포함).
for sub in .harness .claude/rules .codex; do
  [ -d "$ROOT_DIR/$sub" ] || continue
  find "$ROOT_DIR/$sub" -mindepth 1 -depth -type d -empty \
    ! -path "$ROOT_DIR/.harness/skills-local" \
    ! -path "$ROOT_DIR/.harness/skills-local/*" \
    ! -path "$ROOT_DIR/.harness/state" \
    ! -path "$ROOT_DIR/.harness/state/*" \
    -delete 2>/dev/null || true
done
# 이후 단계는 캐시 패키지의 스크립트로 위임한다. 위의 git rm이 이 레포의
# .harness/scripts/** 자체를 지웠으므로($SCRIPT_DIR가 레포 사본이면 자기
# 삭제), 실행 원본은 삭제 영향이 없는 캐시 쪽이어야 한다. 패키지에 해당
# 스크립트가 없는 예외(최소 픽스처 등)에만 기존 $SCRIPT_DIR로 폴백한다.
PKG_SCRIPTS="$CACHE_DIR/versions/$TARGET/.harness/scripts"
# materialize + KEEP_COMMITTED 는 단일 진입점 apply-version.sh 로 묶는다
# (specs/017 M-1). 구버전 패키지에는 없을 수 있어 레포 사본으로 폴백한다.
APPLY_SH="$PKG_SCRIPTS/pkg/apply-version.sh"
[ -f "$APPLY_SH" ] || APPLY_SH="$SCRIPT_DIR/apply-version.sh"
ENSURE_GITIGNORE_MJS="$PKG_SCRIPTS/setup/ensure-gitignore.mjs"
[ -f "$ENSURE_GITIGNORE_MJS" ] || ENSURE_GITIGNORE_MJS="$SCRIPT_DIR/../setup/ensure-gitignore.mjs"

if ! (cd "$ROOT_DIR" && sh "$APPLY_SH" "$TARGET"); then
  [ "$LOCK_CREATED" -eq 1 ] && rm -f "$LOCK"
  echo "materialize에 실패해 전환을 중단했습니다. 삭제분은 'git restore --staged --worktree .' 로 복원할 수 있습니다." >&2
  exit 1
fi

# lock 모드 필수 gitignore 항목 반영 (.harness/current 등) — 프로젝트 소유
# .gitignore에 idempotent append (required-gitignore.json 메커니즘 재사용)
ROOT_DIR="$ROOT_DIR" node "$ENSURE_GITIGNORE_MJS" || true

# 머지 스킬 트리(.claude/.agents)와 결과 디렉토리 구성 — install을 기다리지
# 않고 전환 직후 바로 작동 상태를 만든다 (리허설 발견).
mkdir -p "$ROOT_DIR/.agents/results"
if [ -e "$ROOT_DIR/.harness/scripts/setup/skills-link.sh" ]; then
  (cd "$ROOT_DIR" && sh .harness/scripts/setup/skills-link.sh >/dev/null) || \
    echo "경고: skills-link 실패 — './harness install' 로 다시 시도하세요." >&2
fi

# 7) 검증 + 요약
REMOVED_COUNT="$(printf '%s\n' "$REMOVALS" | grep -c . || true)"
if [ -f "$ROOT_DIR/harness" ] && [ -e "$ROOT_DIR/.harness/scripts/checks/doctor.sh" ]; then
  if ! (cd "$ROOT_DIR" && sh ./harness doctor >/dev/null 2>&1); then
    echo "경고: doctor 검증에서 실패 항목이 있습니다. './harness doctor'로 확인하세요." >&2
  fi
else
  echo "안내: 이 레포에는 doctor가 없어 검증을 건너뜁니다."
fi
echo "전환 완료: 공유 파일 ${REMOVED_COUNT}건 제거, harness.lock 생성 (버전 $TARGET)."
if [ "$FRESH" -eq 0 ]; then
  echo "diff를 리뷰한 뒤 커밋하세요. 되돌리기: git restore --staged --worktree ."
fi
