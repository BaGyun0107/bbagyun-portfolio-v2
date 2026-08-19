# Update Policy

## Two distribution modes

A downstream repository consumes the harness in one of two modes, detected by
the presence of `harness.lock` at the repo root:

- **lock mode** (default for new projects): the shared harness body is not
  committed in the downstream repo. `harness.lock` (a committed, project-owned
  3-line file declaring `schema_version` and `channel`) drives version
  resolution; versions are fetched into the machine-local cache
  (`$HOME/.codi-harness/versions/<X.Y.Z>`) and activated by atomically
  switching the `.harness/current` symlink. New minor/patch versions are
  fetched at session start and applied only at the NEXT session start
  (`pkg-update-check` → `.harness/state/pkg-pending` → `pkg-apply-pending`);
  a running session never changes. Major upgrades and pin/rollback are always
  explicit (`./harness update --major`, `./harness pin <ver>`). In lock mode,
  non-major `./harness update` replaces the copy sync with guidance
  (specs/006 FR-009). User guide: `.harness/docs/packaging-guide.md`.
  Surface boundary (specs/014·015): the **member surface** is
  `./harness bootstrap` alone, and it never mutates the git index on a
  member machine — residue is report-only. Index mutations (residue
  reclaim/cleanup commits) belong to the **owner surface**:
  `./harness prune-downstream --apply` plus the migrate transition commit.
- **copy mode** (legacy): shared harness files are committed in the downstream
  repo and `./harness update` applies upstream changes file-by-file using the
  ownership tiers below. Copy mode is on a staged retirement path: it is
  removed once every downstream has completed the lock migration (a condition,
  not a date — specs/014). New adopters must use lock mode.

The ownership tiers below govern the copy-mode apply flow (and, in lock mode,
any residual shared files until `./harness migrate` removes them).
`harness.lock` itself is not an upstream tracked file, so the apply flow never
touches it; treat it as project-owned by definition.

## File ownership in downstream app repositories

When a downstream project applies shared harness files via `./harness update`,
files are classified into ownership tiers.
The apply flow uses a blocklist: it applies every changed tracked file except
paths classified as project-owned.

| Tier | Files | Behavior |
| --- | --- | --- |
| shared | Every tracked file that is not project-owned: `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `harness`, `lint-staged.config.mjs`, `.agents/**` except `.agents/skills`, `.claude/**` except `.claude/skills`, `.codex/**`, `.harness/**` except project-owned subpaths, `.husky/**`, and new upstream directories | Overwritten with the upstream version. Local edits block manual apply. |
| project-owned | `README.md`, `.github/**`, `mise.toml`, `package.json`, lockfiles, `pnpm-workspace.yaml`, `renovate.json`, `.gitignore`, `docs/audits/**`, `docs/superpowers/**` and `docs/prompts/**` (upstream design-history documents — never propagated downstream), `docs/index.html`, `docs/planning.html`, `data/**` (normalized feature definitions, sitemap), `projects/**` (per-project planning source in planning-only repositories), `registry.json` (root feature seed read by docs:build), `.planning/**` (transition protection — see Rationale), `specs/**`, `.specify/**`, `tests/**`, `ROADMAP.md`, `CHANGELOG.md` (upstream release-gate input), `harness.lock.example` (upstream doc sample), `.harness/config/project-profile.yaml`, `.harness/config/skill-triggers.local.json`, `.harness/state/**`, `.harness/skills-local/**`, `examples/**` (harness demo workspace — never propagated downstream), `apps/**`, `tools/**` (downstream migration/operations tooling — 2026-08-07 incident: an old update.sh deleted 830 downstream tool files) | Preserved. The harness never overwrites these. |
| project-owned extension | `CONTRIBUTING.local.md`, `apps/*/CONTRIBUTING.md`, `AGENTS.local.md`, `CLAUDE.local.md`, `.claude/settings.local.json`, `.codex/config.toml` | Preserved as the supported project-specific extension surface. |
| regenerated | `.claude/skills/**`, `.agents/skills/**` | Rebuilt by `./harness skills-link` from `.harness/skills/` and `.harness/skills-local/`. |

The project-owned blocklist is defined in `.harness/scripts/setup/project-owned.mjs`.
Shell fallbacks in `update.sh` and `update-check.sh` must match it.

Note: project-owned only means the update apply flow never overwrites the
path. It does not by itself exempt a path from clone-residue pruning —
`UPSTREAM_PROJECT_STATE_PATHS` in
`.harness/scripts/setup/upstream-project-state.mjs` governs that. For example
`examples/**` is project-owned for updates yet still pruned from downstream
clones as a harness demo workspace.

## Skill ownership

Skill ownership (upstream-owned `.harness/skills/`, project-owned
`.harness/skills-local/`) and the read-only inspection carve-out are defined
once in the "Shared Skill Ownership" section of
`.harness/policies/guardrails.md`; the Claude mirror is
`.claude/rules/skill-ownership.md`. The update-relevant facts: `.harness/skills/`
moves with upstream, `.harness/skills-local/` is preserved, and
`./harness skills-link` rebuilds `.claude/skills` and `.agents/skills` from
both sources, rejecting name collisions.

## Shared manifest and stale-file pruning

The harness repository publishes `.harness/shared-manifest.json`, a sorted list
of shared tracked paths generated by `.harness/scripts/setup/generate-manifest.mjs`.

`./harness update` uses it in three steps:

1. Apply changed shared paths from upstream.
2. Restore shared paths present in the upstream manifest but missing locally.
3. Prune stale files under shared roots that are absent from the upstream
   manifest — but only files the harness actually distributed (present in
   the repository's own `.harness/shared-manifest.json` before the update).
   Files with no distribution history are preserved and reported with a
   migration hint pointing at `.harness/rules-local/`; if the prior local
   manifest cannot be read, stale deletion is skipped entirely (fail-safe).

The prune step scans only shared roots such as `.harness`, `.claude/rules`,
`.codex/rules`, and `.agents/results`. It does not scan `.planning/`,
`docs/audits/`, `docs/index.html`, `docs/planning.html`, `specs/`, `.specify/`,
`apps/`, `.github/`, or other project-owned trees. `.harness/rules-local/`
and the `.claude/rules/local/` link tree are project-owned and therefore
excluded even though they sit inside scanned roots. In lock mode it also skips
symlinks — those are consumption links created by materialize, not stale files.

**Downstream-unique file protection.** The diff-based removal in step 1
("removed upstream") only deletes paths that were listed in the repository's
own `.harness/shared-manifest.json` before the update — files the harness
actually distributed. Paths that appear in the cross-repo diff but were never
distributed (for example a planning repository's own `projects/**` before it
was classified project-owned) are reported as "다운스트림 고유 파일 보호(제거
생략)" and never deleted. If the local manifest cannot be read, removal is
skipped entirely (fail-safe).

## Rationale

- `README.md`, app code, CI workflows, package files, and `.gitignore` vary per
  downstream project and are project-owned.
- `docs/audits/**` holds each project's active audit records (audit records
  moved here from `.planning/audits/`). It is project-owned: excluded from
  the shared manifest and never overwritten or restored by harness updates.
- `.planning/**` is legacy workflow state from the previous planning engine,
  scheduled for removal per `docs/audits/2026-07-07-planning-retirement.md`
  (distill -> `git rm`; git history is the archive). Until every downstream
  deletes it, it stays project-owned so harness updates never overwrite or
  restore it into downstream projects. This entry is transition protection
  with an expiry (remove it after all downstreams have deleted `.planning/`;
  check at the 2026-08 recheck), not an endorsement of keeping the directory.
- `specs/**`, `.specify/**`, and the root `ROADMAP.md` are the Spec Kit
  plan-of-record surface: committed per-feature spec directories, runtime
  state, and the thin cross-feature overview. They are project-owned team
  assets and are never overwritten or restored by harness updates.
- `docs/index.html` and `docs/planning.html` are generated from the local
  project's docs/planning/spec state by `mise run docs:build`; upstream must
  not overwrite a downstream project's generated page set.
- `tests/**` verifies the upstream harness itself. It is project-owned in
  downstream repositories so harness self-tests do not overwrite or restore
  project-local tests.
- `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `.harness/**`,
  `.codex/**`, `.claude/rules/**`, and `.husky/**` define shared harness
  behavior and move with upstream.
- `.harness/rules-local/**` holds committed project-wide team rules
  (specs/020). It is project-owned: never overwritten, restored, or pruned
  by harness updates. `./harness skills-link` mirrors it into the
  `.claude/rules/local/` link tree (also project-owned, git-ignored), and
  upstream must never ship a `.claude/rules/local/` path — a guard test
  pins this.
- The harness no longer creates local feature specs or a generated board. There
  are no required `.gitignore` entries for that old convention.

## Required .gitignore entries

`.gitignore` remains project-owned. `.harness/config/required-gitignore.json`
carries three mechanisms, all applied idempotently by
`.harness/scripts/setup/ensure-gitignore.mjs`:

- `entries` — single lines appended when missing. The JSON file is the
  canonical list; do not re-enumerate it in prose.
- `lockModeEntries` — lock-mode-only lines for paths that materialize provides
  as symlinks. `{pattern, real: true}` objects mark install-managed real
  directories (the `.specify` vendor assets) that skip the symlink check.
- `managedBlocks` — harness-owned regions between marker comments whose body
  is kept in sync (e.g. the `planning` block that comments out bare
  `.planning` ignore lines found outside the block — a leftover legacy
  `.planning/` is removed via `git rm` per
  `docs/audits/2026-07-07-planning-retirement.md`, not hidden by ignore).

The application path differs by mode: in copy mode `./harness update` applies
them via `update.sh`; in lock mode `update.sh` exits early, so `pkg-sync.sh`
(run by `./harness bootstrap` / `./harness install`) is the only application
path.

Committed project state under `.specify/` (`feature.json`, `memory/`) needs no
ignore entries; the vendor asset paths that `./harness install` re-places are
ignored in lock mode via the `real: true` entries above. Spec Kit output
(`specs/**`, root `ROADMAP.md`) is committed. Everything outside managed
blocks is project-owned and never modified.

## Adopting external plugins and skills

Before adopting any external Claude Code plugin or skill, check Anthropic's
official curated directory first (`claude-plugins-official`, installable from
inside Claude Code). Third-party marketplaces carry an explicit trust warning
in the official docs; prefer the official directory, then well-adopted
community sources with verifiable maintenance, and record the adoption
decision (source, version, why) in `docs/audits/`. This is documentation-only
guidance — no command surface exists to enforce it, so no Codex execpolicy
mirror is created (rule-lifecycle "Accepted Asymmetry").

## Divergence

If a downstream needs to deviate from a shared file, prefer:

1. Put the project-specific content in a supported local or app-local file.
2. Propose the change upstream.
3. Record temporary divergence in `docs/audits/` and resolve the dirty
   shared path before applying future harness updates.

## Daily

The update check fetches the current branch and the canonical Codi harness
source, then reports shared-file drift using the same ownership classifier as
`./harness update`. It does not automatically merge PRs or deploy.
