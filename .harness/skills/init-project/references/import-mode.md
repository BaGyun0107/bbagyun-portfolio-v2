# Existing Repository Import

Use this when moving an existing frontend or backend repository into the
`codi-{project}` monorepo while preserving history.

Read `.harness/config/project-profile.yaml` first. If the project profile is
`next-fullstack`, importing into `apps/back` is forbidden unless the user first
approves changing the profile to `split-front-back` and the decision is recorded.

## Rules

- Use `git subtree add` with `--squash`. `--squash` collapses the imported
  repo's full history into a single commit so the monorepo history stays
  readable and the imported branch tips do not enter this repo's ref space.
- `git subtree add` fails if the target prefix directory already exists. The
  harness ships placeholder `apps/front`/`apps/back` directories, so the import
  target's template directory must be removed first — see Preflight.
- Do not delete or overwrite an `apps/front` or `apps/back` that holds real
  application code (as opposed to the harness placeholder template).
- Do not import backend code into `apps/back` in `next-fullstack` mode.
- Do not assume the imported repo default branch is `main`.
- Keep the import remote temporary.
- Confirm the import target and repo URL with the user before running commands.
- Do not import into a `.git` that is still the cloned harness repository (it
  carries the harness `v1`/`v2` version branches and full history). Reset the
  git history first — see Preflight.

## Target Selection

| apps/front | apps/back | import target                              |
| ---------: | --------: | ------------------------------------------ |
|    present |   missing | backend into `apps/back`                   |
|    missing |   present | frontend into `apps/front`                 |
|    missing |   missing | ask whether to import front, back, or both |
|    present |   present | import is usually unnecessary              |

In `next-fullstack` mode, only frontend import into `apps/front` is valid. A
separate backend import requires a profile change.

## Branch Detection

```bash
gh repo view <repo-url> --json defaultBranchRef --jq '.defaultBranchRef.name'
```

If `gh` cannot access the repo, ask for the branch explicitly.

## Preflight

```bash
git status --porcelain
git remote get-url origin
git show-ref --verify --quiet refs/heads/v2 && echo "harness clone detected"
test -d apps/back
test -d apps/front
```

If the worktree is dirty with unrelated changes, pause before import.

If `origin` still points at a `codi-harness` URL, or `v1`/`v2` branches exist,
the `.git` is the cloned harness repository. Importing into it mixes the harness
history with the imported repo and risks branch-name collisions. Reset the git
history before importing:

```bash
rm -rf .git && git init && git checkout -b main
git add -A && git commit -m "chore: 프로젝트 초기화"
```

### Clear the harness app templates first

The harness repo ships placeholder `apps/front/` and `apps/back/` directories
(`AGENTS.md`, `CLAUDE.md`, `.env.example`, `.infisical.json`, lint configs).
`git subtree add --prefix=apps/front ...` fails with `prefix 'apps/front'
already exists` whenever that directory is present. Before importing, remove the
template directory for the import target only:

```bash
git rm -r --quiet apps/front   # import target only
git commit -m "chore: import 대상 apps/front 템플릿 제거"
```

Keep the app-local files you still need (for example `apps/front/AGENTS.md`,
`.env.example`, `.infisical.json`) by copying them aside first and restoring
them after the subtree import. If the target directory exists and contains real
application code rather than the harness template, stop and ask the user to
choose a cleanup path.

`./harness init-project <name> --reset-git` does the same reset as part of
project initialization.

## Import Commands

Backend example:

```bash
git remote add import-back <repo-url>
git fetch import-back
git subtree add --prefix=apps/back import-back/<branch> --squash
git remote remove import-back
```

Frontend example:

```bash
git remote add import-front <repo-url>
git fetch import-front
git subtree add --prefix=apps/front import-front/<branch> --squash
git remote remove import-front
```

If a command fails after adding the temporary remote, remove that remote before
finishing:

```bash
git remote remove import-back
git remote remove import-front
```

## Post Import

Check:

```bash
git log --oneline -- apps/back | head
git log --oneline -- apps/front | head
```

Remove imported app-level `.github/workflows` files only after review. They will
not trigger from `apps/*/.github/workflows`, but they usually become stale
documentation once the monorepo workflows own deployment.

Then continue with Infisical normalization and workflow verification.
