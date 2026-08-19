#!/usr/bin/env sh
# 새 프로젝트 최소 스켈레톤 생성 (specs/019 US3).
# 사용: ./harness new-project <dir>
# 스켈레톤 = 런처 + harness.lock + 씨앗 파일. 나머지는 ./harness bootstrap의
# lock 자가 부트스트랩(materialize)이 채운다. 하네스-자체 작업 상태(specs,
# tests, docs 등)는 절대 포함하지 않는다.
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)"
TARGET="${1:?사용법: new-project-skeleton.sh <target-dir>}"

mkdir -p "$TARGET"
TARGET="$(CDPATH= cd -- "$TARGET" && pwd)"

if [ "$TARGET" = "$ROOT_DIR" ]; then
  echo "오류: 하네스 트리 자신에는 스켈레톤을 생성할 수 없습니다." >&2
  exit 2
fi

# 정본 목록 — 여기가 스켈레톤 구성의 단일 소스다.
# 복사: 실행 중인 하네스 트리의 공유 씨앗 파일. 생성: lock 선언 + README 스텁.
# 디렉터리 씨앗: project-owned 설정(project-profile)과 배포/CI 워크플로
# (업스트림 전용 release.yml·harness-ci.yml 제외 — upstream-project-state 참조).
COPY_FILES="harness mise.toml .gitignore AGENTS.md CLAUDE.md"
GENERATED_FILES="harness.lock README.md"
SEED_DIRS=".harness .github"
UPSTREAM_ONLY_WORKFLOWS="release.yml harness-ci.yml"

# 대상 검증: 빈 디렉터리이거나, 스켈레톤 구성물만 있는 디렉터리(멱등 재실행)
# 만 허용한다. 그 외 파일이 있으면 기존 작업을 덮어쓸 수 있어 거부한다.
allowed() {
  entry="$1"
  [ "$entry" = ".git" ] && return 0
  for f in $COPY_FILES $GENERATED_FILES $SEED_DIRS; do
    [ "$entry" = "$f" ] && return 0
  done
  return 1
}

for entry in "$TARGET"/* "$TARGET"/.*; do
  base="$(basename "$entry")"
  [ "$base" = "." ] || [ "$base" = ".." ] && continue
  [ -e "$entry" ] || continue
  if ! allowed "$base"; then
    echo "오류: 대상 디렉터리에 스켈레톤 외 항목이 있습니다: $base" >&2
    echo "빈 디렉터리에서 실행하세요." >&2
    exit 2
  fi
done

for f in $COPY_FILES; do
  if [ ! -f "$ROOT_DIR/$f" ]; then
    echo "오류: 원본 파일이 없습니다: $ROOT_DIR/$f" >&2
    exit 2
  fi
  cp "$ROOT_DIR/$f" "$TARGET/$f"
done
chmod +x "$TARGET/harness"

# project-owned 설정 씨앗 — mode는 init-project/아키텍처 결정에서 확정한다.
mkdir -p "$TARGET/.harness/config"
cp "$ROOT_DIR/.harness/config/project-profile.yaml" "$TARGET/.harness/config/project-profile.yaml"

# 배포/CI 워크플로 씨앗 (업스트림 전용 제외)
mkdir -p "$TARGET/.github/workflows"
for wf in "$ROOT_DIR"/.github/workflows/*.yml; do
  base="$(basename "$wf")"
  skip=0
  for u in $UPSTREAM_ONLY_WORKFLOWS; do
    [ "$base" = "$u" ] && skip=1
  done
  [ "$skip" -eq 1 ] || cp "$wf" "$TARGET/.github/workflows/$base"
done

HARNESS_REPO_URL="${HARNESS_SOURCE_REPO:-https://github.com/CODIWORKS-Engineer/codi-harness.git}"
printf '{\n  "schema_version": 1,\n  "channel": "latest-minor",\n  "repo": "%s"\n}\n' \
  "$HARNESS_REPO_URL" > "$TARGET/harness.lock"

if [ ! -f "$TARGET/README.md" ]; then
  {
    printf '# %s\n\n' "$(basename "$TARGET")"
    printf 'Codi 하네스 프로젝트. 준비: `./harness bootstrap` 실행 후\n'
    printf '에이전트 세션(`./harness claude`)에서 "새 프로젝트 초기화"를 요청하세요.\n'
  } > "$TARGET/README.md"
fi

# 스켈레톤은 태어날 때부터 자기 히스토리로 시작한다 — 하네스 히스토리가
# 아예 없으므로 --reset-git 자체가 불필요해진다.
if [ ! -d "$TARGET/.git" ]; then
  git -C "$TARGET" init -b main >/dev/null 2>&1 || git -C "$TARGET" init >/dev/null
fi

echo "스켈레톤 생성 완료: $TARGET"
echo "다음 단계: cd $TARGET && ./harness bootstrap"
