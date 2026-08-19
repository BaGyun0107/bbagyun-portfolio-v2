# Skill Ownership

This rule applies to every session. It defines where new skills go and which
skill directories the agent is allowed to modify.

## Two skill sources

The harness keeps skills in two directories:

- `.harness/skills/` — **shared, upstream-owned**. Every Codi project gets
  the same content here. `./harness update --apply-harness` overwrites this
  directory with the upstream version on every run (in lock mode the version
  materialize has the same effect — local edits are lost either way).
- `.harness/skills-local/` — **project-owned**. Each project's own skills
  live here. `./harness update --apply-harness` never touches this
  directory, and these skills never propagate to other projects.

Both sources are merged into `.claude/skills/` and `.agents/skills/` by
`./harness skills-link` (also called automatically by `./harness install`,
agent preflight, and the harness repo's pre-commit hook). Each entry in the
merged tree is a symlink to one of the two sources.

## Project-owned rules (rules-local)

The same ownership split applies to always-loaded rules (specs/020):
`.claude/rules/*.md` is upstream-owned and moves with updates, while
`.harness/rules-local/*.md` is the project-owned home for committed
project-wide team rules. Never create downstream rules directly under
`.claude/rules/` — update's stale pruning treats non-distributed files
there as migration candidates (preserved with a hint, but unmanaged).
`./harness skills-link` mirrors `rules-local` into `.claude/rules/local/`
(git-ignored link tree) so Claude auto-loads them; Codex sees them via the
AGENTS.md loading clause and the preflight listing — execpolicy cannot
carry narrative rules, so that is the accepted Codex mirror.

## Where to create a new skill

When the user asks for a new skill (for example, "create a skill for X" or
through the `skill-creator` skill), the destination depends on which
repository is open:

- **In the harness repo itself** (`codi-harness-v2` / the upstream): create
  the skill under `.harness/skills/<name>/`. It becomes part of the shared
  baseline that every downstream project will receive.
- **In any other (downstream) project**: create the skill under
  `.harness/skills-local/<name>/`. Do **not** create it under
  `.harness/skills/`.

If unsure whether the current repo is the harness, check whether
`.harness/shared-manifest.json` lists this repo's own paths — only the
harness repo regenerates that manifest from its own tracked files.

## Do not modify .harness/skills/ in a downstream project

Files under `.harness/skills/` are upstream-owned. Editing them in a
downstream project causes `./harness update --apply-harness` to either
refuse to apply (dirty-path warning) or, after the user stashes the local
edit, silently overwrite the work.

If a shared skill needs to change for everyone, open a PR against the
harness repo. If a shared skill needs to behave differently for **just
this** project, add a parallel local skill under
`.harness/skills-local/<name>/` and reference it from the project's spec
or routing — do not fork the shared one in place.

Read-only inspection is allowed. Agents may read, grep, list, audit, and run
safe diffs against `.harness/skills/**` to understand upstream behavior or
compare it with `.harness/skills-local/**`. The protection is about preventing
downstream worktree changes, not preventing review. Do not use `cp` as a
general way to fork a shared skill into `.harness/skills-local/**`; if that
workflow is needed later, add an explicit command such as
`./harness skills-local fork <skill-name>` with its own validation.

## Name collisions are forbidden

A `.harness/skills-local/<name>` directory may not use the same name as
any `.harness/skills/<name>` directory. The merge step
(`./harness skills-link`) fails fast on a collision: it cannot pick a
winner safely. Resolve the collision by renaming the local skill.

This also rules out "shadowing" — there is no supported way to override a
shared skill from a local copy. Either change the shared skill upstream
or build a parallel local skill with a distinct name.

## The skill-creator skill

`.harness/skills/skill-creator/` is imported from
[anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/skill-creator)
and used to author new skills. When invoking it:

1. Confirm with the user whether the new skill is general-purpose
   (upstream-able) or project-specific.
2. Apply the destination rule above.
3. Run `./harness skills-link` after writing the skill so the merged
   `.claude/skills/` and `.agents/skills/` trees pick it up.

## Enforcement

The full shell-guard internals (the 9-step Bash model, redirect blocking,
`COMMAND_MAX_LENGTH`, out-of-scope bypass classes, known false positives)
are documented in
`.claude/rules/references/skill-ownership-enforcement.md`. Read that file
only when needed.

The hook is a "navigate-by-mistake" defense only, not a shell sandbox — do
NOT rely on it. The load-bearing rule is the upstream/local convention
itself.
