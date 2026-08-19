#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="${HARNESS_ROOT_DIR:-$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)}"
LOCK_PATH="$ROOT_DIR/.harness/lock.json"
VENDOR_DIR="$ROOT_DIR/.harness/vendor/speckit"
TAG="${1:-}"

if [ -z "$TAG" ]; then
  echo "릴리스 태그가 필요합니다. 사용법: ./harness speckit-vendor <tag>" >&2
  exit 2
fi

case "$TAG" in
  latest|main|master|HEAD)
    echo "고정 릴리스 태그만 허용합니다: $TAG" >&2
    exit 2
    ;;
esac

case "$TAG" in
  v[0-9]*)
    ;;
  *)
    echo "고정 릴리스 태그 형식(vX.Y.Z)이 필요합니다: $TAG" >&2
    exit 2
    ;;
esac

if ! command -v uvx >/dev/null 2>&1; then
  echo "uvx가 필요합니다." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node가 필요합니다." >&2
  exit 1
fi

if [ ! -f "$LOCK_PATH" ]; then
  echo ".harness/lock.json 파일이 필요합니다: $LOCK_PATH" >&2
  exit 1
fi

SPECKIT_REPO="$(node -e "const fs=require('fs'); const p=process.argv[1]; const lock=JSON.parse(fs.readFileSync(p,'utf8')); console.log(lock.tools?.speckit?.repo || 'https://github.com/github/spec-kit');" "$LOCK_PATH")"
SPECKIT_GIT_REPO="${SPECKIT_REPO%.git}.git"
SPECKIT_REF="git+${SPECKIT_GIT_REPO}@${TAG}"
tmp="$(mktemp -d)"
old_vendor="$(mktemp -d)"
new_vendor="$(mktemp -d)"
trap 'rm -rf "$tmp" "$old_vendor" "$new_vendor"' EXIT

if [ -d "$VENDOR_DIR" ]; then
  cp -R "$VENDOR_DIR/." "$old_vendor/"
fi

(
  cd "$tmp"
  uvx --from "$SPECKIT_REF" specify init --here --integration claude
  uvx --from "$SPECKIT_REF" specify integration install codex --force
)

mkdir -p \
  "$new_vendor/templates" \
  "$new_vendor/scripts" \
  "$new_vendor/skills-claude" \
  "$new_vendor/skills-codex"

if [ -d "$tmp/.specify/templates" ]; then
  for entry in "$tmp/.specify/templates"/* "$tmp/.specify/templates"/.[!.]* "$tmp/.specify/templates"/..?*; do
    [ -e "$entry" ] || continue
    name="$(basename "$entry")"
    [ "$name" = "overrides" ] && continue
    cp -R "$entry" "$new_vendor/templates/"
  done
fi

if [ -d "$tmp/.specify/scripts/bash" ]; then
  cp -R "$tmp/.specify/scripts/bash/." "$new_vendor/scripts/"
fi

if [ -f "$tmp/.specify/workflows/speckit/workflow.yml" ]; then
  cp "$tmp/.specify/workflows/speckit/workflow.yml" "$new_vendor/workflow.yml"
fi

if [ -f "$tmp/.specify/memory/constitution.md" ]; then
  cp "$tmp/.specify/memory/constitution.md" "$new_vendor/memory-constitution.md"
fi

if [ -d "$tmp/.claude/skills" ]; then
  for skill in "$tmp/.claude/skills"/speckit-*; do
    [ -d "$skill" ] || continue
    cp -R "$skill" "$new_vendor/skills-claude/"
  done
fi

if [ -d "$tmp/.agents/skills" ]; then
  for skill in "$tmp/.agents/skills"/speckit-*; do
    [ -d "$skill" ] || continue
    cp -R "$skill" "$new_vendor/skills-codex/"
  done
fi

vendored_commit="$(git ls-remote --tags "$SPECKIT_GIT_REPO" "refs/tags/$TAG" "refs/tags/$TAG^{}" 2>/dev/null | awk '$2 ~ /\^\{\}$/ { peeled=$1 } $2 !~ /\^\{\}$/ && base == "" { base=$1 } END { print (peeled != "" ? peeled : base) }' || true)"
if [ -z "$vendored_commit" ]; then
  vendored_commit="$(git rev-parse HEAD 2>/dev/null || true)"
fi
vendored_by_harness_commit="$(git -C "$ROOT_DIR" rev-parse HEAD 2>/dev/null || true)"
vendored_at="${HARNESS_VENDOR_DATE:-$(date +%Y-%m-%d)}"

node - "$new_vendor/VENDOR-INFO.json" "$TAG" "$SPECKIT_REF" "$vendored_commit" "$vendored_at" "$vendored_by_harness_commit" <<'NODE'
const fs = require('fs');
const [path, version, ref, commit, date, harnessCommit] = process.argv.slice(2);
const info = {
  speckit_version: version,
  speckit_ref: ref,
  vendored_commit: commit || null,
  vendored_at: date,
  vendored_by_harness_commit: harnessCommit || null,
};
fs.writeFileSync(path, `${JSON.stringify(info, null, 2)}\n`);
NODE

rm -rf "$VENDOR_DIR"
mkdir -p "$VENDOR_DIR"
cp -R "$new_vendor/." "$VENDOR_DIR/"

node - "$LOCK_PATH" "$TAG" <<'NODE'
const fs = require('fs');
const [path, version] = process.argv.slice(2);
const lock = JSON.parse(fs.readFileSync(path, 'utf8'));
lock.policy ??= {};
lock.policy.speckit = 'vendored-fixed-tag';
lock.tools ??= {};
lock.tools.speckit ??= {};
lock.tools.speckit.version = version;
lock.tools.speckit.auto_update = false;
lock.tools.speckit.notes =
  'Spec Kit shared assets are vendored in .harness/vendor/speckit and placed by ./harness install. Upgrade with ./harness speckit-vendor <tag>.';
fs.writeFileSync(path, `${JSON.stringify(lock, null, 2)}\n`);
NODE

echo "speckit vendor diff ($TAG):"
(
  cd "$VENDOR_DIR"
  find . -type f | sed 's#^\./##' | sort
) > "$tmp/new-files.txt"
(
  cd "$old_vendor"
  find . -type f | sed 's#^\./##' | sort
) > "$tmp/old-files.txt"

while IFS= read -r file; do
  [ -n "$file" ] || continue
  if ! grep -Fxq "$file" "$tmp/old-files.txt"; then
    printf '  added    %s\n' "$file"
  elif ! cmp -s "$old_vendor/$file" "$VENDOR_DIR/$file"; then
    printf '  modified %s\n' "$file"
  fi
done < "$tmp/new-files.txt"

while IFS= read -r file; do
  [ -n "$file" ] || continue
  if ! grep -Fxq "$file" "$tmp/new-files.txt"; then
    printf '  removed  %s\n' "$file"
  fi
done < "$tmp/old-files.txt"

echo "Spec Kit vendoring complete. Review diff before committing."
