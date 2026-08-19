#!/usr/bin/env sh
# Verify the real Codex execpolicy parser can load every .codex/rules/*.rules
# file. A single malformed file (e.g. a prefix_rule whose `match` example does
# not match its pattern on a token boundary) makes execpolicy refuse to load the
# WHOLE directory, silently disabling every Codex guardrail. rule-check.mjs
# statically catches the known shapes; this asks the actual parser so anything
# the static check misses still surfaces.
#
# Uses `codex execpolicy check`, which loads the rule files and evaluates a
# probe command WITHOUT calling any model: a parse failure exits non-zero
# immediately, a clean parse exits zero. Deterministic, no tokens, no stdin
# wait, CI-safe. Skips cleanly when codex (or the execpolicy subcommand) is
# absent.
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)"
cd "$ROOT_DIR"

if ! command -v codex >/dev/null 2>&1; then
  echo "skip: codex CLI not installed; .codex/rules load not verified"
  exit 0
fi

if [ ! -d "$ROOT_DIR/.codex/rules" ]; then
  echo "skip: no .codex/rules directory"
  exit 0
fi

# Older codex builds may not ship `execpolicy check`. Probe support first; if
# absent, skip rather than false-fail.
if ! codex execpolicy check --help >/dev/null 2>&1; then
  echo "skip: this codex build has no 'execpolicy check' subcommand"
  exit 0
fi

# Collect every rule file as a repeated -r flag. Each must parse.
set --
for f in "$ROOT_DIR"/.codex/rules/*.rules; do
  [ -e "$f" ] || continue
  set -- "$@" -r "$f"
done

if [ "$#" -eq 0 ]; then
  echo "skip: no .codex/rules/*.rules files"
  exit 0
fi

# The probe command tokens are irrelevant to parsing; we only care whether the
# rule files load. A parse error in ANY -r file makes this exit non-zero.
if codex execpolicy check "$@" -- mise run e2e >/dev/null 2>&1; then
  echo "ok: codex execpolicy parsed all .codex/rules/*.rules without error"
  exit 0
fi

echo "fail: codex execpolicy could not parse .codex/rules/ (one bad file disables ALL Codex guardrails):"
# Re-run without suppression to surface the parse error to the user.
codex execpolicy check "$@" -- mise run e2e 2>&1 | head -8 | sed 's/^/  /' || true
exit 1
