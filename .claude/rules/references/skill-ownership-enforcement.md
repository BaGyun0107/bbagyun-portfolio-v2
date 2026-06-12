# Skill Ownership — Enforcement Internals

이 문서는 `.claude/rules/skill-ownership.md`의 "## Enforcement" 절을 옮겨 온 on-demand 레퍼런스다. 필요할 때만 읽는다.

## Enforcement

Hard enforcement (code-level):

- `.harness/scripts/setup/skills-link.sh` fails fast on a name collision
  between `.harness/skills/<name>/` and `.harness/skills-local/<name>/`.
- `.harness/scripts/setup/update.sh` and `update-check.sh` treat
  `.harness/skills-local/**` as project-owned and never overwrite or prune
  it.
- `.harness/scripts/setup/prune-stale.mjs` and
  `.harness/scripts/setup/generate-manifest.mjs` mirror the same
  project-owned classification.
- `.harness/scripts/checks/doctor.sh` verifies both merged trees exist as
  directories of symlinks (or as legacy single symlinks pending an
  `./harness install`).

Narrative enforcement (agent-level):

- This rule is loaded into the Claude Code session context and the agent
  is expected to follow it when creating new skills.
- `.codex/rules/skill-ownership.rules` declares the routine harness
  skill-management commands as `allow`. It does **not** block writes to
  `.harness/skills/<name>/` because Codex execpolicy `prefix_rule()` only
  matches command argument prefixes — it cannot inspect a trailing path
  argument like `.harness/skills/my-skill`.
- Consequently, an agent that ignores this rule and writes directly under
  `.harness/skills/` will not be blocked by execpolicy. If the wrong
  destination is used, the next `./harness update --apply-harness` either
  warns (dirty path) or silently overwrites the new skill — the agent
  must put new downstream skills under `.harness/skills-local/`.

Bash enforcement model — read-only allow-list:

Enumerating every write shape with regex (cp/mv/rsync/tee/touch/mkdir/
dd/redirects/interpreters) does not hold up against ordinary shell
syntax (numeric fds, quoted destinations, GNU `-t`, comments after
destinations, etc.). The current `.harness/hooks/guardrails.mjs` uses
a different approach:

1. **Path normalization** runs before any matcher: backslash escapes
   are stripped, empty quote pairs (`''`, `""`) are removed, double
   slashes and `/./` segments collapse, and `dir/..` parent traversal
   resolves. This means `.harness//skills`, `.harness/./skills`,
   `.harness/skill''s`, and `.harness/skill\s` are all detected as
   `.harness/skills` before the next step.
2. **Brace expansion** turns `prefix{a,b}suffix` into separate
   whitespace-delimited tokens before matching, so
   `.harness/{skills,foo}/SKILL.md` is detected.
3. **cwd-relative path resolution**: if the Bash call's cwd already
   sits inside `.harness` or `.harness/skills`, the matcher splices
   the cwd-relative prefix in (or, for cwd inside the shared tree,
   treats EVERY simple command as a potential shared-tree write). So
   `cd .harness; touch skills/foo/SKILL.md` blocks even though the
   command text never contains `.harness/skills`.
4. **Substitution unwrapping**: the bodies of `$(...)`, `` `...` ``,
   `<(...)`, and `>(...)` are extracted and re-evaluated through the
   same pipeline. An outer read-only command can no longer launder a
   hidden write (e.g.
   `cat $(cp /tmp/x .harness/skills/foo/SKILL.md)` blocks).
5. **Recursion / length caps**: nested substitution depth and total
   command length are bounded. Beyond the caps the guard fails closed
   (blocks), so an adversarial 1000-level-deep input cannot DoS the
   synchronous hook.
6. **Redirect to `.harness/skills/`** is always blocked, regardless of
   the tool on the left side. This catches `echo > path`,
   `cat src > path`, `tee path`, any fd / `&>` variant, including
   quoted paths.
7. **Otherwise**, a command that mentions `.harness/skills/` passes
   only if its leading token is on a small read-only allow-list
   (`ls`, `cat`, `head`, `tail`, `grep`, `wc`, `stat`, hash
   utilities, etc.) or if it is a `diff` command that does not use output-file
   options. `diff -ru .harness/skills .harness/skills-local` is allowed;
   `diff --output=.harness/skills/foo.patch a b` and any `diff --output`
   form are blocked. `sudo`, `mise exec --`, `env`, `command`,
   `builtin`, `time`, `nice`, `nohup` wrapper prefixes are stripped
   before the lookup so a write tool cannot be disguised. `xargs` and
   `parallel` are intentionally NOT stripped — they are command
   runners, so the underlying tool is opaque to the guard.
8. **Compound commands** (`;`, `&&`, `||`, `|`) are split into simple
   commands and each evaluated independently. ANY simple command that
   fails blocks the whole input.
9. Anything else that touches the shared tree is blocked.

`.harness/skills-local/` writes are always allowed — that is the
project-owned directory. When Bash is already running from `.harness`,
the `skills-local` exception is evaluated per simple command. A command
line that merely mentions `skills-local` in a comment, a previous `:`
command, or a separate operand does not exempt a later
`cp ... skills/...` write.

When Bash is already running inside `.harness` or `.harness/skills`,
ambient metadata commands are allowed, but tools with write or code
execution surfaces are narrowed to safe forms. `git status`,
`git log`, `git show`, `git diff`, `git rev-parse`, `git ls-files`,
`git grep`, and `git remote get-url` pass; `git rm`, `git add`,
`git checkout`, `git reset`, and `git apply` block. `node`, `npm`,
`pnpm`, `yarn`, and `mise` pass only for version-style commands such
as `--version` / `-v`; `node -e`, `npm install`, and similar write or
execution forms block.

Trade-off: `cp -t target .harness/skills/source` and
`cp .harness/skills/source .harness/skills-local/source` are rejected even
when `.harness/skills/source` is the source, not the destination, because `cp`
is not on the read-only list. Agents that need to inspect or compare the
shared tree should use the Read tool, `cat src > /tmp/dest`, or safe `diff`.
Similarly, `find` is not on the allow-list because `-delete`, `-exec`,
`-execdir`, `-fprint*`, and `-fls` give find write or execution capability;
use `ls -R`, `grep -r`, `rg`, or the Read tool instead. This is the cost of not
parsing every shell argument — a small, well-defined surface area in exchange
for a guarantee against shell-syntax bypasses.

The hook is a "navigate-by-mistake" defense, not a shell sandbox. The
remaining bypass classes below are out-of-scope by policy — an agent
reaching for them is intentionally evading the guard, and the
upstream/local convention plus `./harness update --apply-harness`
overwrite behaviour are the load-bearing rule.

Out of scope — structural gaps the hook does not close:

These are real bypass classes. Some may be reachable by an honest
agent (variable indirection in particular), not just by intentional
evasion. The policy still treats them as out-of-scope because
implementing a complete shell parser in a synchronous PreToolUse hook
trades soundness for a bigger blast radius. If an agent steps on one
of these by accident, the upstream/local convention plus
`./harness update --apply-harness` overwrite behaviour catch the
problem on the next sync. Don't rely on the hook for these:

- **Variable indirection** across statements
  (`d=.harness; cp ... "$d/skills/..."`). The hook does not implement
  shell variable expansion. This pattern CAN happen by accident —
  agents commonly set `target=...` before `cp`/`mkdir`/`touch`. Treat
  the hook as a hint, not a guarantee, in code that builds paths via
  variables.
- **ANSI-C quoting** (`$'\x2eharness/skills/foo'`,
  `$'.harness/...'`, etc.). The hook does not decode `$'...'` hex /
  octal / unicode escapes. Reaching this pattern by accident is
  unlikely; literal-string forms like `$'.harness/skills/...'` still
  block because the literal path survives.
- **Bash 5.3+ value substitution** `${ cmd; }`. The hook unwraps
  `$(...)`, backticks, `<(...)`, and `>(...)` but not `${ cmd; }`.
- **Bash brace expansion edge cases**: simple comma lists
  (`{a,b,c}`) are expanded, but **nested non-comma braces**
  (`{skill{s},foo}`) and **ranges** (`{a..z}`, `{1..10}`) are not.
- **Interpreter heredocs** (`python - <<EOF`) when the script body
  is delivered on stdin rather than `-c`.
- **An agent that reads/writes the shared tree through an MCP tool**
  rather than Bash.

Known false positives:

- **Literal-string mentions** of the shared path: a command line whose
  backslash-escape pattern looks like path normalization noise can be
  normalized too eagerly. `echo 'literal .harness\/skills path'` and
  similar literal-string references may block even though no write is
  intended. Deliberate trade — the guard prefers blocking a literal
  false positive over admitting a same-shape real write.
- **16KB command length cap**: the global `COMMAND_MAX_LENGTH` is
  16384 bytes. ANY Bash command above that limit blocks, not only
  shared-skill-touching ones. This is a defence against synchronous-
  hook DoS via deeply nested substitutions. A legitimate 17KB
  `printf`/`awk`/`git log` query is uncommon but possible — if a
  caller hits this in normal use, raise the cap; do not work around
  by deleting the check.
- **Danger-command substring matches (resolved 2026-06-10)**: the
  separate destructive-command table in `guardrails.mjs` (the `checks`
  array — `rm -rf`, `git push --force`, `gh pr merge`, `DROP`/`TRUNCATE`,
  `kubectl delete`, etc.) historically tested its patterns against the
  whole command string. A danger phrase appearing only as a *search
  argument* (`grep "gh pr merge" .claude/rules/`) or as *emitted text*
  (a `gh pr create --body` documenting the never-merge rule, an `echo`
  explaining a forbidden command) blocked even though no dangerous
  action ran. This was the class that bit anyone auditing or documenting
  the safety rules themselves. It is now resolved: the table evaluates
  per simple-command and, for text-only first tokens (`grep`/`rg`/`echo`/
  `printf`, `git log`/`show`/`diff`, `gh pr` non-`merge` subcommands),
  blanks quoted-literal regions before matching while still scanning every
  `$(...)`/backtick substitution body in full. Executors (`psql`, `mysql`,
  `sh`, `docker`, an actual `gh pr merge`) are never exempted, so
  false-negatives stay at zero. The regression battery lives in
  `tests/guardrails-fp-battery.test.mjs`; keep it green when touching the
  `checks` table or the text-only exemption sets.

The hook is the safety net for the simple cases; the narrative rule
above is the policy.
