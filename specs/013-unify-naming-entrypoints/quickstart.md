# Quickstart Validation: Unify Spec Kit Naming and Entry-Point Structure

Run from the repo root. All commands must succeed for the feature to count
as done.

## 1. No dotted names on live surfaces (SC-001)

```sh
grep -rn "speckit\.\(specify\|clarify\|plan\|tasks\|analyze\|implement\|converge\|constitution\)" \
  AGENTS.md CLAUDE.md README.md ARCHITECTURE.md CONTRIBUTING.md \
  docs/harness-overview.md .harness/workflow.md .harness/policies \
  .harness/hooks .harness/scripts/checks .harness/skills \
  .claude/rules .codex/rules tests
```

Expected: no output (exit 1). The historical/vendored paths are deliberately
not part of this sweep.

## 2. Entry-point structure (SC-002)

```sh
grep -n "^@AGENTS.md$" CLAUDE.md        # exactly one bare import line
grep -c "speckit-specify" AGENTS.md      # >= 1 (hyphenated names present)
```

Manual (once): start a Claude Code session and run `/context` — CLAUDE.md
must appear under Memory files with the AGENTS.md import expanded.

## 3. Check pipeline green (SC-003)

```sh
npm test
./harness context-check
./harness rule-check
./harness doctor
```

Expected: all pass; context-check includes the new assertion that CLAUDE.md
contains the bare `@AGENTS.md` import.

## 4. Codex behavior unchanged (SC-004)

```sh
git diff v2 -- AGENTS.md
```

Expected: naming updates and additions only — no rule removed or weakened.

## 5. Historical records untouched (FR-002)

```sh
git diff v2 --stat -- docs/audits specs/002-feature-hub specs/008-linked-feature-hub
```

Expected: no output.
