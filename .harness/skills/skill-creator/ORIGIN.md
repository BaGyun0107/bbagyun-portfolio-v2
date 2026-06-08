# Origin

This skill is imported as-is from upstream
[anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/skill-creator)
under the license recorded in `LICENSE.txt`.

## Provenance

- **Upstream repo**: https://github.com/anthropics/skills
- **Upstream commit SHA**: `690f15cac7f7b4c055c5ab109c79ed9259934081`
- **Upstream commit date**: 2026-05-19
- **Imported on**: 2026-05-20
- **Imported by**: `codi-harness-v2` PR introducing the
  `.harness/skills-local/` ownership model
- **Review notes**: The Python scripts under `scripts/` and the HTML/JS in
  `eval-viewer/` were copied verbatim. They are treated as trusted
  vendored tooling. The harness install and preflight steps must NOT
  execute these scripts automatically — they are invoked only when the
  `skill-creator` skill is explicitly activated by the agent.

The harness vendors this skill so downstream projects can create new skills
via `./harness claude` without depending on an external skill registry. The
authoritative version lives upstream; this copy is refreshed by re-importing
from the upstream tree (record a new SHA, date, and review note above each
time), not by editing it in place.

## Skill ownership

If you want to add project-specific guidance, do not edit the files in this
directory. Create a new skill under `.harness/skills-local/<name>/` instead.
The skill-ownership rules in `.claude/rules/skill-ownership.md` describe the
shared-vs-local boundary in detail.
