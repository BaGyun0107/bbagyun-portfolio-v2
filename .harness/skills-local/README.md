# .harness/skills-local

This directory holds **project-specific skills** that live only in this
downstream project and never propagate to other projects.

## When to put a skill here vs in `.harness/skills/`

| Question | Answer | Where |
| --- | --- | --- |
| Is this a skill every Codi project should have? | yes | `.harness/skills/` (harness repo PR) |
| Does only this project need it? | yes | `.harness/skills-local/` |
| Is it tied to one client, domain, or app? | yes | `.harness/skills-local/` |
| Does the harness repo already ship a similar skill? | yes | extend it via a harness PR, do not fork locally |

The rule is: **anything in `.harness/skills/` is upstream-managed**.
`./harness update --apply-harness` overwrites `.harness/skills/` with the
upstream version on every run. Local edits there are lost.

Anything in `.harness/skills-local/` is **never** touched by `update` and
**never** propagated upstream. It is project-owned.

## Creating a new skill

Use the `skill-creator` skill that ships in `.harness/skills/skill-creator/`.
When you invoke it from a project (not from the harness repo itself), it
must create the new skill under this directory:

```
.harness/skills-local/<your-skill-name>/SKILL.md
```

Optionally with extra files:

```
.harness/skills-local/<your-skill-name>/
  SKILL.md
  references/
  scripts/
  assets/
```

## Name collisions

A `skills-local/` skill must not use the same directory name as any
`.harness/skills/` skill. The `./harness install` and preflight steps build
a merged `.claude/skills/` and `.agents/skills/` tree and fail fast on a
collision. If a collision happens, rename the local skill — do not try to
shadow an upstream skill.

If you need to *change behavior* of an upstream skill rather than just
add a new one, propose the change upstream. Forking into `skills-local/`
under the same name is explicitly not supported.

## Authoritative rule

The full ownership policy is in
[`.claude/rules/skill-ownership.md`](../../.claude/rules/skill-ownership.md).
