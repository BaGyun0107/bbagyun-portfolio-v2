#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="${HARNESS_ROOT_DIR:-$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)}"
VENDOR_DIR="$ROOT_DIR/.harness/vendor/speckit"

copy_tree_contents() {
  src="$1"
  dest="$2"
  [ -d "$src" ] || return 0
  mkdir -p "$dest"
  cp -R "$src/." "$dest/"
}

copy_templates_without_overrides() {
  src="$1"
  dest="$2"
  [ -d "$src" ] || return 0
  mkdir -p "$dest"
  for entry in "$src"/* "$src"/.[!.]* "$src"/..?*; do
    [ -e "$entry" ] || continue
    name="$(basename "$entry")"
    [ "$name" = "overrides" ] && continue
    cp -R "$entry" "$dest/"
  done
}

if [ ! -d "$VENDOR_DIR" ]; then
  exit 0
fi

copy_templates_without_overrides "$VENDOR_DIR/templates" "$ROOT_DIR/.specify/templates"
copy_tree_contents "$VENDOR_DIR/scripts" "$ROOT_DIR/.specify/scripts/bash"

if [ -f "$VENDOR_DIR/workflow.yml" ]; then
  mkdir -p "$ROOT_DIR/.specify/workflows/speckit"
  cp "$VENDOR_DIR/workflow.yml" "$ROOT_DIR/.specify/workflows/speckit/workflow.yml"
fi

if [ -f "$VENDOR_DIR/memory-constitution.md" ] && [ ! -f "$ROOT_DIR/.specify/memory/constitution.md" ]; then
  mkdir -p "$ROOT_DIR/.specify/memory"
  cp "$VENDOR_DIR/memory-constitution.md" "$ROOT_DIR/.specify/memory/constitution.md"
fi

copy_tree_contents "$VENDOR_DIR/skills-claude" "$ROOT_DIR/.claude/skills"
copy_tree_contents "$VENDOR_DIR/skills-codex" "$ROOT_DIR/.agents/skills"

echo "Spec Kit vendored assets placed."
