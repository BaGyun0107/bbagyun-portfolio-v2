# Tool Call Payload Safety

This rule applies to every session. It exists because large or complex single
tool-call payloads get truncated or corrupted while streaming, which breaks the
tool-call markup itself. When that happens the call is not executed: the raw
`<…invoke…>` / `<…parameter…>` tags leak into the chat as plain text and the
turn stops. This is **not** a permissions, hook, or harness-rule problem, and it
**cannot** be fixed by adding to a permission allowlist — the broken call never
reaches the permission layer. The only fix is to keep each tool-call payload
small and simple.

## Symptom (so you can recognize it)

- The literal words `call`, `<invoke …>`, or `<parameter …>` appear as text in
  the output instead of running.
- A parameter name is mangled (e.g. `name="desc.spec.js — GET…"` instead of
  `name="command"`), or text is cut mid-character and overwritten by the next
  output.
- A "malformed tool call could not be parsed" error.

All of these mean the payload was too large/complex and the stream corrupted the
markup. Do not retry the same large call verbatim — shrink it first.

## Rules

These are mandatory. They trade a few extra small calls for reliability; the
extra calls are far cheaper than a corrupted turn that must be restarted.

1. **One tool call = one small, simple payload.** Do not pack a large file body,
   a long script, or many chained commands into a single call.

2. **Do not create large files with `Write` in one shot.** For a new file that
   is long (~50+ lines) or contains a lot of non-ASCII (e.g. Korean) text,
   write a small skeleton first, then grow it with successive `Edit` calls in
   small blocks. Each `Edit` is its own small payload.

3. **Commit messages go through a file, never a heredoc.** Do not use
   `git commit -m "$(cat <<EOF … EOF)"` with a long/multi-line/Korean body.
   Write the message to a file (e.g. with `Write`) and run
   `git commit -F <file>`.

4. **Long or multi-line scripts go through a file, never `-e`/heredoc.** Do not
   use `node -e '…long multi-line script…'` or `python - <<EOF …`. `Write` the
   script to a `.js`/`.py` file and run `node file.js` / `python file.py`.

5. **Keep Bash commands single-purpose and ASCII.** No long `&&`/`;`/`|` chains
   in one call — split into separate calls, one command each. Put Korean
   explanations in the chat body, not inside Bash (`echo`, comments). Bash
   payloads should be short ASCII commands.

6. **Read files with the file tools, not Bash.** Use `Read`/`Grep`/`Glob`
   instead of `cd … && cat/sed/grep file`. They have small, fixed payloads and
   never stream a large command string.

## Why this is the real fix

Payload size is the single variable that drives stream corruption. Non-ASCII
text costs more bytes per token and makes long blocks more fragile, and nested
delimiters (heredocs, embedded scripts) give the parser more ways to lose the
closing tag. Shrinking the payload removes the cause; everything else
(permissions, hooks, retries) only treats symptoms.

## Enforcement

This is a narrative rule loaded into context every session — there is no
blocking hook for it (a hook cannot see a tool call that was corrupted before it
was emitted). It works by being in context so the agent keeps each payload
small. The same guidance is mirrored to the global `~/.claude/CLAUDE.md` so it
applies outside this repo as well.
