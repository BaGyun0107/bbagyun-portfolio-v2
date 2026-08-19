#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)"
HARNESS_SOURCE_REPO="${HARNESS_SOURCE_REPO:-https://github.com/CODIWORKS-Engineer/codi-harness.git}"
HARNESS_SOURCE_REF="${HARNESS_SOURCE_REF:-v2}"
MODE="apply-harness"
AUTO_APPLY=0
HARNESS_UPDATE_VERBOSE="${HARNESS_UPDATE_VERBOSE:-0}"

# lock 모드(specs/006 US3): 공유 파일 동기화는 pkg 흐름이 담당한다.
# 구 덮어쓰기 적용을 수행하면 두 체계가 겹쳐 혼합 상태가 되므로 안내만 한다.
if [ -f "$ROOT_DIR/harness.lock" ]; then
  echo "lock 모드 레포입니다 — 하네스 동기화는 './harness pkg-sync' 가 담당합니다."
  echo "버전 고정/롤백은 './harness pin <버전>', major 전환은 './harness update --major' 를 사용하세요."
  exit 0
fi

while [ "$#" -gt 0 ]; do
  case "$1" in
    --check)
      MODE="check"
      shift
      ;;
    --apply-harness)
      MODE="apply-harness"
      shift
      ;;
    --auto)
      AUTO_APPLY=1
      shift
      ;;
    --verbose)
      HARNESS_UPDATE_VERBOSE=1
      shift
      ;;
    --write-lock)
      MODE="write-lock"
      shift
      ;;
    --source-repo)
      HARNESS_SOURCE_REPO="${2:?--source-repo 값이 필요합니다}"
      shift 2
      ;;
    --source-ref)
      HARNESS_SOURCE_REF="${2:?--source-ref 값이 필요합니다}"
      shift 2
      ;;
    *)
      echo "알 수 없는 인자입니다: $1" >&2
      exit 2
      ;;
  esac
done

# 프로젝트 소유 분류는 Node가 있으면 project-owned.mjs에 위임한다.
# 아래 case는 Node가 없는 환경을 위한 최소 fallback이다.
PROJECT_OWNED_CLASSIFIER="$ROOT_DIR/.harness/scripts/setup/project-owned.mjs"

# 셸 fallback 은 공용 파일에서 source 한다 (감사 L-1 — 복제 case 통일).
. "$ROOT_DIR/.harness/scripts/setup/project-owned-fallback.sh"

is_project_owned_path() {
  if command -v node >/dev/null 2>&1 && [ -f "$PROJECT_OWNED_CLASSIFIER" ]; then
    node "$PROJECT_OWNED_CLASSIFIER" --check "$1"
    return $?
  fi
  is_project_owned_path_fallback "$1"
}

is_verbose() {
  case "$HARNESS_UPDATE_VERBOSE" in
    1|true|yes|on)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

count_lines() {
  awk 'NF { count += 1 } END { print count + 0 }' "$1"
}

print_path_summary() {
  title="$1"
  file="$2"
  suffix="${3:-}"
  count="$(count_lines "$file")"
  [ "$count" -gt 0 ] || return 0

  if is_verbose; then
    echo "$title:"
    if [ -n "$suffix" ]; then
      while IFS= read -r path; do
        [ -n "$path" ] || continue
        echo "  - $path $suffix"
      done < "$file"
    else
      sed 's/^/  - /' "$file"
    fi
  else
    echo "$title: $count"
    echo "  전체 파일 목록은 --verbose 또는 HARNESS_UPDATE_VERBOSE=1로 확인하세요."
  fi
}

ensure_required_gitignore() {
  # .gitignore는 project-owned다. update는 덮어쓰지 않지만, 하네스가 보장해야
  # 하는 필수 entry는 누락 시 idempotent하게 append한다. 이미 있으면 no-op.
  if ! command -v node >/dev/null 2>&1; then
    return 0
  fi
  if [ ! -f "$ROOT_DIR/.harness/scripts/setup/ensure-gitignore.mjs" ]; then
    return 0
  fi
  added="$(ROOT_DIR="$ROOT_DIR" node "$ROOT_DIR/.harness/scripts/setup/ensure-gitignore.mjs" 2>/dev/null || true)"
  if [ -n "$added" ]; then
    echo "필수 .gitignore 항목을 추가했습니다:"
    printf '%s\n' "$added" | sed 's/^/  - /'
  fi
}

matches_fetch_head_file() {
  path="$1"
  git -C "$ROOT_DIR" cat-file -e "FETCH_HEAD:$path" 2>/dev/null || return 1
  [ -f "$ROOT_DIR/$path" ] || return 1
  git -C "$ROOT_DIR" show "FETCH_HEAD:$path" 2>/dev/null | cmp -s - "$ROOT_DIR/$path"
}

is_blocking_dirty_path() {
  path="$1"
  status="$(git -C "$ROOT_DIR" status --porcelain -- "$path" 2>/dev/null || true)"
  [ -n "$status" ] || return 1

  # 추적 중인 로컬 삭제는 커밋/스태시 전까지 의도적 로컬 상태로 본다.
  # update가 조용히 되살리지 않도록 dirty로 막는다. 단, upstream에서도
  # 삭제된 shared 파일은 이미 적용된 삭제 상태이므로 막지 않는다.
  case "$status" in
    D*|?D*)
      if ! git -C "$ROOT_DIR" cat-file -e "FETCH_HEAD:$path" 2>/dev/null; then
        return 1
      fi
      return 0
      ;;
    '?? '*)
      if matches_fetch_head_file "$path"; then
        return 1
      fi
      return 0
      ;;
  esac

  if git -C "$ROOT_DIR" cat-file -e "FETCH_HEAD:$path" 2>/dev/null; then
    if [ ! -e "$ROOT_DIR/$path" ] && [ ! -L "$ROOT_DIR/$path" ]; then
      return 1
    fi
    if git -C "$ROOT_DIR" diff --quiet --no-ext-diff FETCH_HEAD -- "$path" 2>/dev/null; then
      return 1
    fi
  fi

  return 0
}

apply_harness_update() {
  selected_file="$(mktemp)"
  skipped_project_owned_file="$(mktemp)"
  dirty_file="$(mktemp)"
  deleted_file="$(mktemp)"
  manifest_file="$(mktemp)"
  stale_file="$(mktemp)"
  stale_dirty_file="$(mktemp)"
  handled_file="$(mktemp)"
  prior_manifest_list="$(mktemp)"
  trap 'rm -f "$selected_file" "$skipped_project_owned_file" "$dirty_file" "$deleted_file" "$manifest_file" "$stale_file" "$stale_dirty_file" "$handled_file" "$prior_manifest_list"' EXIT

  echo "Codi 하네스를 가져옵니다: $HARNESS_SOURCE_REPO#$HARNESS_SOURCE_REF"
  git -C "$ROOT_DIR" fetch --quiet --depth=1 "$HARNESS_SOURCE_REPO" "$HARNESS_SOURCE_REF"

  changed_files="$(git -C "$ROOT_DIR" diff --name-only HEAD FETCH_HEAD 2>/dev/null || true)"

  # 큰 diff에서도 빠르게 처리하려고 Node 한 번으로 batch 분류한다.
  if [ -n "$changed_files" ] && command -v node >/dev/null 2>&1 \
    && [ -f "$PROJECT_OWNED_CLASSIFIER" ]; then
    all_changed="$(mktemp)"
    trap 'rm -f "$selected_file" "$skipped_project_owned_file" "$dirty_file" "$deleted_file" "$manifest_file" "$stale_file" "$stale_dirty_file" "$handled_file" "$prior_manifest_list" "$all_changed"' EXIT
    printf '%s\n' "$changed_files" > "$all_changed"
    node "$PROJECT_OWNED_CLASSIFIER" --filter < "$all_changed" > "$selected_file"
    # 제외된 project-owned 경로는 기본 요약만 보여주고, 상세 목록은 verbose에서만 보여준다.
    while IFS= read -r path; do
      [ -n "$path" ] || continue
      grep -Fxq -- "$path" "$selected_file" 2>/dev/null && continue
      printf '%s\n' "$path" >> "$skipped_project_owned_file"
    done < "$all_changed"
  else
    printf '%s\n' "$changed_files" | while IFS= read -r path; do
      [ -n "$path" ] || continue
      if is_project_owned_path "$path"; then
        printf '%s\n' "$path" >> "$skipped_project_owned_file"
        continue
      fi
      printf '%s\n' "$path"
    done > "$selected_file"
  fi

  print_path_summary "project-owned 경로 건너뜀" "$skipped_project_owned_file"

  # 상위 manifest로 삭제/이동된 공용 파일을 찾아낸다.
  if git -C "$ROOT_DIR" cat-file -e "FETCH_HEAD:.harness/shared-manifest.json" 2>/dev/null; then
    git -C "$ROOT_DIR" show "FETCH_HEAD:.harness/shared-manifest.json" > "$manifest_file"
  else
    : > "$manifest_file"
  fi

  if [ -s "$manifest_file" ] && command -v node >/dev/null 2>&1; then
    # 오래된 파일 감지 실패는 수동 모드에서 nonzero로 드러낸다.
    if ! MANIFEST_FILE="$manifest_file" ROOT_DIR="$ROOT_DIR" \
      node "$ROOT_DIR/.harness/scripts/setup/prune-stale.mjs" > "$stale_file"; then
      if [ "$AUTO_APPLY" -eq 1 ]; then
        echo "경고: prune-stale.mjs 실행 실패로 stale 파일 정리를 건너뜁니다. ./harness update를 수동으로 실행하세요." >&2
        : > "$stale_file"
      else
        echo "실패: 하네스 적용 중 prune-stale.mjs 실행에 실패했습니다. 스크립트를 고친 뒤 ./harness update를 다시 실행하세요." >&2
        exit 1
      fi
    fi
  fi

  # manifest에 등록된 shared 파일 중 다운스트림에 없는 파일을 selected_file에
  # 추가한다. 기존 diff 기반 흐름은 다운스트림이 옛 버전에서 시작해 어떤
  # shared 파일을 받지 못한 채 시간이 흐른 경우 그 파일을 영원히 무시한다.
  # 누락 복구는 그 격차를 매번 메운다.
  if [ -s "$manifest_file" ] && command -v node >/dev/null 2>&1 \
    && [ -f "$ROOT_DIR/.harness/scripts/setup/restore-missing-shared.mjs" ]; then
    missing_file="$(mktemp)"
    if MANIFEST_FILE="$manifest_file" ROOT_DIR="$ROOT_DIR" \
      node "$ROOT_DIR/.harness/scripts/setup/restore-missing-shared.mjs" > "$missing_file"; then
      if [ -s "$missing_file" ]; then
        restored_file="$(mktemp)"
        while IFS= read -r path; do
          [ -n "$path" ] || continue
          # 이미 selected_file에 있으면 중복 추가하지 않는다.
          if ! grep -Fxq -- "$path" "$selected_file" 2>/dev/null; then
            printf '%s\n' "$path" >> "$selected_file"
            printf '%s\n' "$path" >> "$restored_file"
          fi
        done < "$missing_file"
        print_path_summary "로컬에 없는 shared 파일 복구" "$restored_file" "(로컬에 없음)"
        rm -f "$restored_file"
      fi
    else
      if [ "$AUTO_APPLY" -eq 1 ]; then
        echo "경고: restore-missing-shared.mjs 실행 실패로 누락 파일 복구를 건너뜁니다. ./harness update를 수동으로 실행하세요." >&2
      else
        echo "실패: 하네스 적용 중 restore-missing-shared.mjs 실행에 실패했습니다. 스크립트를 고친 뒤 ./harness update를 다시 실행하세요." >&2
        rm -f "$missing_file"
        exit 1
      fi
    fi
    rm -f "$missing_file"
  fi

  if [ ! -s "$selected_file" ] && [ ! -s "$stale_file" ]; then
    echo "하네스가 이미 최신 상태입니다."
    ensure_required_gitignore
    return 0
  fi

  if [ ! -s "$selected_file" ] && [ -s "$stale_file" ]; then
    echo "변경된 shared 하네스 파일은 없지만 stale 파일이 감지되었습니다."
  fi

  while IFS= read -r path; do
    if is_blocking_dirty_path "$path"; then
      printf '%s\n' "$path" >> "$dirty_file"
    fi
  done < "$selected_file"

  if [ -s "$dirty_file" ]; then
    if [ "$AUTO_APPLY" -eq 1 ]; then
      echo "경고: shared 하네스 경로에 로컬 변경이 있어 자동 적용을 건너뜁니다:" >&2
      sed 's/^/  - /' "$dirty_file" >&2
      echo "경고: 로컬 변경을 검토한 뒤 ./harness update를 수동으로 실행하세요." >&2
      return 0
    fi

    echo "shared 하네스 경로의 로컬 변경을 덮어쓰지 않습니다:" >&2
    sed 's/^/  - /' "$dirty_file" >&2
    echo "먼저 해당 변경을 커밋하거나 stash 하세요." >&2
    exit 1
  fi

  # 다운스트림 고유 파일 보호: 제거는 하네스가 이전에 배포한 파일(적용 전
  # 로컬 shared-manifest 목록)로만 제한한다. diff 기반 제거와 stale 정리가
  # 같은 목록을 쓴다 (specs/020). 목록을 읽지 못하면 fail-safe로 제거를
  # 건너뛴다. 두 임시 파일은 함수 상단에서 생성되고 trap 이 정리한다.
  have_prior_manifest=0
  if command -v node >/dev/null 2>&1 && [ -f "$ROOT_DIR/.harness/shared-manifest.json" ]; then
    if node -e 'const m=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8"));for(const f of m.files||[])console.log(f)' "$ROOT_DIR/.harness/shared-manifest.json" > "$prior_manifest_list" 2>/dev/null; then
      have_prior_manifest=1
    else
      : > "$prior_manifest_list"
    fi
  fi
  if [ -s "$selected_file" ]; then
    applied_file="$(mktemp)"
    removed_upstream_file="$(mktemp)"
    skipped_downstream_file="$(mktemp)"
    # HEAD..FETCH_HEAD 교차 diff에는 이 저장소 고유 경로(예: 프로젝트
    # planning 자료)도 나타나므로, 목록에 없는 경로는 절대 삭제하지 않는다.
    while IFS= read -r path; do
      if git -C "$ROOT_DIR" cat-file -e "FETCH_HEAD:$path" 2>/dev/null; then
        printf '%s\n' "$path" >> "$applied_file"
        git -C "$ROOT_DIR" restore --source=FETCH_HEAD --worktree -- "$path"
      elif [ -e "$ROOT_DIR/$path" ] || [ -L "$ROOT_DIR/$path" ]; then
        if ! grep -Fxq -- "$path" "$prior_manifest_list" 2>/dev/null; then
          printf '%s\n' "$path" >> "$skipped_downstream_file"
        elif [ "$AUTO_APPLY" -eq 1 ]; then
          printf '%s\n' "$path" >> "$deleted_file"
        else
          printf '%s\n' "$path" >> "$removed_upstream_file"
          rm -f "$ROOT_DIR/$path"
        fi
      fi
    done < "$selected_file"
    print_path_summary "shared 하네스 파일 적용" "$applied_file"
    print_path_summary "upstream에서 삭제된 shared 파일 제거" "$removed_upstream_file"
    print_path_summary "다운스트림 고유 파일 보호(제거 생략)" "$skipped_downstream_file"
    cat "$applied_file" "$removed_upstream_file" "$deleted_file" > "$handled_file" 2>/dev/null || true
    rm -f "$applied_file" "$removed_upstream_file" "$skipped_downstream_file"
  fi

  if [ -s "$deleted_file" ]; then
    echo "경고: 자동 하네스 적용 중 upstream에서 삭제된 파일은 제거하지 않았습니다:" >&2
    sed 's/^/  - /' "$deleted_file" >&2
    echo "경고: 삭제까지 반영하려면 ./harness update를 수동으로 실행하세요." >&2
  fi

  if [ -s "$stale_file" ]; then
    # 변경 적용이 실제로 처리(적용·제거·자동모드 보류)한 경로만 stale 판정에서
    # 제외한다. 다운스트림 고유 파일 보호로 건너뛴 경로는 stale 흐름이
    # (하네스 소유 스캔 트리 한정, 새 upstream manifest 기준으로) 다시 판정한다.
    if [ -s "$handled_file" ]; then
      filtered_stale="$(mktemp)"
      grep -Fxv -f "$handled_file" "$stale_file" > "$filtered_stale" 2>/dev/null || true
      mv "$filtered_stale" "$stale_file"
    fi

    while IFS= read -r path; do
      [ -n "$path" ] || continue
      if [ -n "$(git -C "$ROOT_DIR" status --porcelain -- "$path" 2>/dev/null)" ]; then
        printf '%s\n' "$path" >> "$stale_dirty_file"
      fi
    done < "$stale_file"

    if [ -s "$stale_dirty_file" ]; then
      echo "경고: stale shared 파일에 로컬 변경이 있어 그대로 둡니다:" >&2
      sed 's/^/  - /' "$stale_dirty_file" >&2
      echo "경고: 직접 검토한 뒤 커밋하거나 제거하세요." >&2
    fi

    # 로컬 edit이 없는 stale 파일 중, 배포 이력(이전 로컬 shared-manifest
    # 실재)이 있는 파일만 삭제한다 (specs/020). 이력이 없는 파일은 하네스가
    # 배포한 적 없는 다운스트림 고유 파일일 수 있으므로 보존하고 안내한다.
    if [ "$have_prior_manifest" -ne 1 ]; then
      echo "경고: 로컬 shared-manifest 를 읽을 수 없어 stale 파일 삭제를 생략합니다 (배포 이력 확인 불가)." >&2
    fi
    pruned_file="$(mktemp)"
    unknown_stale_file="$(mktemp)"
    while IFS= read -r path; do
      [ -n "$path" ] || continue
      if grep -Fxq -- "$path" "$stale_dirty_file" 2>/dev/null; then
        continue
      fi
      if [ "$have_prior_manifest" -eq 1 ] && grep -Fxq -- "$path" "$prior_manifest_list" 2>/dev/null; then
        printf '%s\n' "$path" >> "$pruned_file"
        rm -f "$ROOT_DIR/$path"
      else
        printf '%s\n' "$path" >> "$unknown_stale_file"
      fi
    done < "$stale_file"
    print_path_summary "upstream에 더 이상 없는 stale shared 파일 정리" "$pruned_file"
    if [ -s "$unknown_stale_file" ]; then
      echo "경고: 하네스가 배포한 적 없는 파일은 정리하지 않습니다:" >&2
      sed 's/^/  - /' "$unknown_stale_file" >&2
      echo "경고: 프로젝트 규칙이면 .harness/rules-local/ 로 옮기세요 (project-owned 보호, 다음 skills-link 가 .claude/rules/local 로 링크)." >&2
    fi
    rm -f "$pruned_file" "$unknown_stale_file"

    # 공용 root 아래에서 비게 된 디렉터리만 정리한다.
    for sub in .harness .claude/rules .codex/rules; do
      [ -d "$ROOT_DIR/$sub" ] || continue
      find "$ROOT_DIR/$sub" -mindepth 1 -depth -type d -empty \
        ! -path "$ROOT_DIR/.harness/skills-local" \
        ! -path "$ROOT_DIR/.harness/skills-local/*" \
        ! -path "$ROOT_DIR/.harness/state" \
        ! -path "$ROOT_DIR/.harness/state/*" \
        -delete 2>/dev/null || true
    done

    # 로컬 edit이 남은 stale 공용 파일은 수동 모드에서 실패로 드러낸다.
    if [ -s "$stale_dirty_file" ] && [ "$AUTO_APPLY" -ne 1 ]; then
      echo "실패: 로컬 변경이 있는 stale shared 파일이 남아 하네스 적용이 완료되지 않았습니다. 검토 후 ./harness update를 다시 실행하세요." >&2
      exit 1
    fi
  fi
  rm -f "$handled_file" "$prior_manifest_list"

  # 적용 직후 agent-facing skill tree를 갱신한다. 수동 모드에서는 추적 중인
  # 레거시 symlink 마이그레이션도 명시적으로 수행한다.
  if [ -x "$ROOT_DIR/.harness/scripts/setup/skills-link.sh" ]; then
    skills_link_args=""
    if [ "$AUTO_APPLY" -ne 1 ]; then
      skills_link_args="--migrate-tracked-legacy"
    fi
    # shellcheck disable=SC2086
    if ! "$ROOT_DIR/.harness/scripts/setup/skills-link.sh" $skills_link_args; then
      if [ "$AUTO_APPLY" -eq 1 ]; then
        echo "경고: skills-link.sh 실행 실패로 .claude/skills와 .agents/skills가 stale 상태일 수 있습니다. ./harness skills-link를 수동으로 실행하세요." >&2
      else
        echo "실패: 하네스 업데이트 적용 후 skills-link.sh 실행에 실패했습니다. 문제 상태를 고친 뒤 ./harness skills-link를 다시 실행하세요." >&2
        exit 1
      fi
    fi
  fi

  ensure_required_gitignore

  echo "하네스 파일 적용 완료. diff를 검토한 뒤 ./harness doctor를 실행하세요."
}

if ! command -v git >/dev/null 2>&1; then
  echo "git이 필요합니다." >&2
  exit 1
fi

if [ "$MODE" = "apply-harness" ]; then
  # copy 은퇴 예고 (specs/014 FR-006/007). lock 모드는 파일 상단에서 이미
  # 조기 종료하므로 여기까지 오는 실행은 전부 copy 모드다 — 별도 조건 분기를
  # 두면 같은 판정이 두 곳으로 갈라져 드리프트한다 (research R2).
  # 실패가 아니라 안내이므로 stdout 으로 내고, 종료 코드에 영향을 주지 않는다.
  echo "안내: copy 방식 하네스는 단계적으로 은퇴합니다."
  echo "  이 레포를 패키징(lock) 구조로 전환하려면:"
  echo "    ./harness migrate"
  echo "    git push"
  echo "  전환 후에는 ./harness bootstrap 하나로 준비·갱신이 끝납니다."
  apply_harness_update
  exit 0
fi

# Playwright MCP는 사용자 레벨 등록 + 핀 버전으로 관리한다. 등록 상태는
# ./harness doctor 와 preflight의 mcp-registration-check가 확인한다.

# Spec Kit은 사용자가 프로젝트별로 uvx로 설치·갱신하므로 update가 관리하지
# 않는다. 설치 방법은 README를 참고한다.

# Superpowers는 Claude Code / Codex 각각의 plugin marketplace가 설치·update를
# 관리한다. marketplace의 내부 저장 구조(디렉터리/캐시/매니페스트)는 런타임
# 버전에 따라 바뀌므로 존재 여부를 흉내내 감지하면 오탐이 난다. 감지하지 않고
# 설치 방법 안내만 출력한다.
echo "Superpowers (plugin marketplace 설치 항목 — 이 스크립트가 관리하지 않음):"
echo "  Claude Code: /plugin install superpowers@claude-plugins-official"
echo "  Codex: /plugins 실행 후 superpowers 설치"

if [ "$MODE" = "write-lock" ]; then
  if ! command -v node >/dev/null 2>&1; then
    echo ".harness/lock.json을 쓰려면 node가 필요합니다." >&2
    exit 1
  fi

  node "$ROOT_DIR/.harness/scripts/agent/write-lock.mjs" "$ROOT_DIR"
  echo ".harness/lock.json 업데이트 완료"
else
  echo "확인 완료. 업데이트 내용이 적절하면 글로벌 설치를 갱신하세요."
fi
