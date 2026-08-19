# Validation Pipeline

Complete validation pipeline with local git hooks and CI/CD integration.

## Commitlint Configuration

```json
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'ci', 'infra']
    ],
    'scope-enum': [
      2,
      'always',
      ['web', 'api', 'mobile', 'worker', 'shared', 'infra', 'deps']
    ]
  }
};
```

## Local Validation (Git Hooks)

### Mise Hooks Setup

```toml
# mise.toml
[hooks]
postinstall = '''
  mkdir -p .git/hooks

  # commit-msg hook
  cat > .git/hooks/commit-msg <<'EOF'
#!/bin/sh
exec mise run git:commit-msg -- "$1"
EOF
  chmod +x .git/hooks/commit-msg

  # pre-commit hook
  cat > .git/hooks/pre-commit <<'EOF'
#!/bin/sh
exec mise run git:pre-commit
EOF
  chmod +x .git/hooks/pre-commit

  # pre-push hook
  cat > .git/hooks/pre-push <<'EOF'
#!/bin/sh
exec mise run git:pre-push
EOF
  chmod +x .git/hooks/pre-push
'''
```

### Git Hook Tasks

```toml
[tasks."git:commit-msg"]
description = "Validate commit message using commitlint"
run = "mise exec -- npm exec --yes -- @commitlint/cli@20 --edit $1"

[tasks."git:pre-commit"]
description = "Run lint on changed files"
run = '''
#!/usr/bin/env bash
changed=$(git diff --cached --name-only)

if echo "$changed" | grep -q "^apps/back/"; then
    echo "[pre-commit] apps/back detected, running lint..."
    mise //apps/back:lint || exit 1
fi

if echo "$changed" | grep -q "^apps/front/"; then
    echo "[pre-commit] apps/front detected, running lint..."
    mise //apps/front:lint || exit 1
fi

if echo "$changed" | grep -q "^apps/mobile/"; then
    echo "[pre-commit] apps/mobile detected, running lint..."
    mise //apps/mobile:lint || exit 1
fi
'''

[tasks."git:pre-push"]
description = "Validate branch name and run tests"
run = '''
#!/usr/bin/env bash
# Validate branch name
npm exec -- @gracefullight/validate-branch || exit 1

# Get changed files
changed=$(git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only HEAD~1)

if echo "$changed" | grep -q "^apps/back/"; then
    echo "[pre-push] apps/back detected, running test..."
    mise //apps/back:test || exit 1
fi

if echo "$changed" | grep -q "^apps/front/"; then
    echo "[pre-push] apps/front detected, running test..."
    mise //apps/front:test || exit 1
fi

if echo "$changed" | grep -q "^apps/mobile/"; then
    echo "[pre-push] apps/mobile detected, running test..."
    mise //apps/mobile:test || exit 1
fi
'''
```

> **E2E is intentionally NOT in the default git hooks.** pre-commit stays lint-
> only and pre-push stays test-only — e2e is too slow for every commit/push. The
> primary e2e entry point is an explicit `mise run e2e:changed` by the agent or
> developer when a user-facing flow changed. CI can run it (see the commented
> recipe below); locally it is on-demand.

## CI/CD Validation (GitHub Actions)

### Full Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: mise run install
      - run: mise run lint
      - run: mise run typecheck
      - run: mise run test
      # --- E2E (opt-in; enable later — costs Actions minutes) ---
      # Uncomment to run e2e in CI. Playwright needs a browser install step.
      # - run: mise exec -- npx playwright install --with-deps chromium
      # - run: mise run e2e
```

### Change-Based Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      web: ${{ steps.changes.outputs.web }}
      api: ${{ steps.changes.outputs.api }}
      mobile: ${{ steps.changes.outputs.mobile }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            web:
              - 'apps/front/**'
            api:
              - 'apps/back/**'
            mobile:
              - 'apps/mobile/**'

  lint-web:
    needs: detect-changes
    if: ${{ needs.detect-changes.outputs.web == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: mise run //apps/front:lint

  lint-api:
    needs: detect-changes
    if: ${{ needs.detect-changes.outputs.api == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: mise run //apps/back:lint

  test-web:
    needs: [detect-changes, lint-web]
    if: ${{ needs.detect-changes.outputs.web == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: mise run //apps/front:test
```

## Reusable Tasks

```toml
# Root mise.toml
[tasks.lint:changed]
description = "Lint only changed apps"
run = '''
#!/usr/bin/env bash
changed_files=$(git diff --name-only HEAD~1)

if echo "$changed_files" | grep -q "^apps/front/"; then
  echo "→ Linting web..."
  mise run //apps/front:lint || exit 1
fi

if echo "$changed_files" | grep -q "^apps/back/"; then
  echo "→ Linting api..."
  mise run //apps/back:lint || exit 1
fi

if echo "$changed_files" | grep -q "^apps/mobile/"; then
  echo "→ Linting mobile..."
  mise run //apps/mobile:lint || exit 1
fi
'''

[tasks.test:changed]
description = "Test only changed apps"
run = '''
#!/usr/bin/env bash
changed_files=$(git diff --name-only HEAD~1)

if echo "$changed_files" | grep -q "^apps/front/"; then
  echo "→ Testing web..."
  mise run //apps/front:test || exit 1
fi

if echo "$changed_files" | grep -q "^apps/back/"; then
  echo "→ Testing api..."
  mise run //apps/back:test || exit 1
fi

if echo "$changed_files" | grep -q "^apps/mobile/"; then
  echo "→ Testing mobile..."
  mise run //apps/mobile:test || exit 1
fi
'''

[tasks.validate:changed]
description = "Validate only changed apps"
depends = ["lint:changed", "test:changed"]
```

### E2E Validation Tasks

E2E is part of validation when a change touches a user-facing flow (see
`.harness/policies/quality-gates.md`). Each app owns its e2e (monorepo-packages
rule — no root install): web uses Playwright, api uses Supertest.

```toml
[tasks."//apps/front:e2e"]
description = "Playwright e2e for web"
dir = "apps/front"
run = "playwright test"

[tasks."//apps/back:e2e"]
description = "Supertest e2e for api"
dir = "apps/back"
run = "jest --config jest-e2e.json"
```

Encode the validation ORDER with `&&` chaining, not `depends`. `depends` runs
tasks in parallel (see `setup-examples.md`), which would run e2e concurrently
with unit/integration and break the pyramid. A `run` task short-circuits on the
first failure:

```toml
[tasks.validate]
description = "typecheck → unit/integration → e2e, in order"
run = "mise run typecheck && mise run test && mise run e2e"
```

e2e runs only after typecheck and unit/integration are green — pyramid preserved
by the `&&` short-circuit.

`e2e:changed` is the DEFAULT command the policy and skills point at. Scope it
against the **index** (`git diff --cached --name-only`), like the pre-commit
hook — NOT `git diff HEAD~1` like `test:changed`. The commit-time gate fires on
*uncommitted* work, so the app under commit may not be in `HEAD~1` at all.

The stamp semantics are critical: a real "ran and passed" run writes the staged
tree hash to `.harness/state/e2e-last-run`. A graceful-skip (no suite found)
prints a notice, exits 0, and **does NOT stamp** — otherwise the bootstrap case
(flow declared, no suite yet) would fake evidence and silence the gate exactly
when nothing enforces it.

Canonical copy of these two task bodies:
`.harness/skills/codi-e2e/resources/mise-e2e-tasks.toml` (consumed by
`./harness init-project` and the `codi-e2e` skill — keep both in sync).

```toml
[tasks.e2e]
description = "Run e2e for all apps that have a suite (stamps evidence on pass)"
run = '''
#!/usr/bin/env bash
set -euo pipefail
ran_any=0

# suite 존재는 `mise tasks ls`의 첫 컬럼(task명)과 정확 비교로 판정한다.
# 과거의 `mise tasks | grep -qxF "$task"`는 표 형식 출력 줄과 task명이 절대
# 일치하지 않아 suite가 있어도 항상 skip되는 버그였다.
tasks_list="$(mise tasks ls --no-header 2>/dev/null | awk '{print $1}')"
has_task() { printf '%s\n' "$tasks_list" | grep -qxF "$1"; }

run_app_e2e() {
  app="$1"; task="$2"
  if [ -d "$app" ] && has_task "$task"; then
    echo "→ e2e: $task"
    mise run "$task" || exit 1
    ran_any=1
  fi
}

run_app_e2e apps/front "//apps/front:e2e"
run_app_e2e apps/back "//apps/back:e2e"

if [ "$ran_any" -eq 0 ]; then
  echo "[e2e] no e2e suite found, skipping (no evidence stamped)"
  exit 0
fi

# stamp는 staged tree 해시이고 e2e는 working tree를 실행하므로, tracked 미스테이징
# 변경뿐 아니라 untracked(.gitignore 제외) 파일도 "테스트한 트리 ≠ 증거 트리"를
# 만든다. 둘 다 깨끗할 때만 stamp한다.
if ! git diff --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  echo "[e2e] unstaged or untracked changes present — refusing to stamp (test tree != staged tree)." >&2
  echo "[e2e] stage everything you tested (git add -A) and re-run, or commit then re-run." >&2
  exit 1
fi

# 실제로 통과한 경우에만 staged tree hash 를 증거로 기록하고 흐름 마커를 내린다.
mkdir -p .harness/state
git write-tree > .harness/state/e2e-last-run
printf 'no\n' > .harness/state/touches-user-flow
echo "[e2e] passed; stamped .harness/state/e2e-last-run"
'''

[tasks."e2e:changed"]
description = "Run e2e only for changed apps (index-scoped); default entry point"
run = '''
#!/usr/bin/env bash
set -euo pipefail
changed=$(git diff --cached --name-only)  # 스테이징된 게 없으면 빈 문자열 → 모든 검사 skip
ran_any=0
uncovered=""

# suite 존재는 `mise tasks ls`의 첫 컬럼(task명)과 정확 비교로 판정한다.
# 과거의 `mise tasks | grep -qxF "$task"`는 출력이 표 형식(name + description +
# source)이라 task명이 줄 전체와 절대 일치하지 않아 suite가 있어도 항상 skip되는
# 버그였다. 첫 컬럼만 뽑아 정확 일치를 본다.
tasks_list="$(mise tasks ls --no-header 2>/dev/null | awk '{print $1}')"
has_task() { printf '%s\n' "$tasks_list" | grep -qxF "$1"; }

maybe_run() {
  app_prefix="$1"; app_dir="$2"; task="$3"
  echo "$changed" | grep -q "^$app_prefix" || return 0   # 이 앱은 안 바뀜
  [ -d "$app_dir" ] || return 0
  if has_task "$task"; then
    echo "→ e2e (changed): $task"
    mise run "$task" || exit 1
    ran_any=1
  else
    # 바뀐 user-facing 앱인데 e2e suite가 없다 → 전역 stamp로 덮어 가짜 증거를
    # 만들면 안 된다. 기록만 해 두고 마지막에 stamp를 막는다.
    uncovered="$uncovered $app_prefix"
  fi
}

maybe_run "apps/front/" apps/front "//apps/front:e2e"
maybe_run "apps/back/" apps/back "//apps/back:e2e"

if [ "$ran_any" -eq 0 ]; then
  echo "[e2e:changed] no changed app with an e2e suite, skipping (no evidence stamped)"
  exit 0
fi

# P1 가드 1: stamp는 staged tree 해시(git write-tree)인데 e2e는 working tree를
# 실행한다. tracked 미스테이징 변경뿐 아니라 untracked(.gitignore 제외) 파일도
# "테스트한 트리 ≠ 증거 트리"를 만든다 — 새 라우트/헬퍼/fixture가 untracked면
# e2e는 그걸로 통과하지만 git write-tree(인덱스)엔 없다. 둘 다 깨끗할 때만 stamp.
if ! git diff --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  echo "[e2e:changed] unstaged or untracked changes present — refusing to stamp (test tree != staged tree)." >&2
  echo "[e2e:changed] stage everything you tested (git add -A) and re-run, or commit then re-run." >&2
  exit 1
fi

# P1 가드 2: 바뀐 user-facing 앱 중 e2e suite가 없는 앱이 있으면 전역 stamp를
# 막는다. 한 앱이 통과해도 suite 없는 다른 앱까지 같은 tree 해시로 덮어
# 가짜 증거가 되기 때문.
if [ -n "$uncovered" ]; then
  echo "[e2e:changed] changed app(s) without an e2e suite:$uncovered — refusing to stamp." >&2
  echo "[e2e:changed] add an e2e suite for them, or lower the flow marker if they are not user-facing." >&2
  exit 1
fi

mkdir -p .harness/state
git write-tree > .harness/state/e2e-last-run
printf 'no\n' > .harness/state/touches-user-flow
echo "[e2e:changed] passed; stamped .harness/state/e2e-last-run"
'''
```

The stamp (`git write-tree`) is the exact identity the `guardrails.mjs`
freshness check recomputes at commit time. The auto-clear (`touches-user-flow`
→ `no`) prevents a stale `yes` from firing the reminder on later non-flow
commits.

## Complete Root mise.toml Example

Choose the Node.js version from the target project. Codi new-project default is
24, but existing projects may pin 20 or 22.

```toml
[tools]
node = "24"
python = "3.12"
flutter = "3"
npm = "latest"

[hooks]
postinstall = '''
  mkdir -p .git/hooks

  cat > .git/hooks/commit-msg <<'EOF'
#!/bin/sh
exec mise run git:commit-msg -- "$1"
EOF
  chmod +x .git/hooks/commit-msg

  cat > .git/hooks/pre-commit <<'EOF'
#!/bin/sh
exec mise run git:pre-commit
EOF
  chmod +x .git/hooks/pre-commit

  cat > .git/hooks/pre-push <<'EOF'
#!/bin/sh
exec mise run git:pre-push
EOF
  chmod +x .git/hooks/pre-push
'''

[tasks.dev]
description = "Start all development services"
depends = ["//apps/back:dev", "//apps/front:dev"]

[tasks.lint]
description = "Lint all apps"
depends = ["//apps/back:lint", "//apps/front:lint", "//apps/mobile:lint"]

[tasks.test]
description = "Test all apps"
depends = ["//apps/back:test", "//apps/front:test", "//apps/mobile:test"]

[tasks."git:commit-msg"]
description = "Validate commit message"
run = "mise exec -- npm exec --yes -- @commitlint/cli@20 --edit $1"

[tasks."git:pre-commit"]
description = "Run lint on changed files"
run = '''
#!/usr/bin/env bash
changed=$(git diff --cached --name-only)

if echo "$changed" | grep -q "^apps/front/"; then
    mise //apps/front:lint || exit 1
fi

if echo "$changed" | grep -q "^apps/back/"; then
    mise //apps/back:lint || exit 1
fi
'''

[tasks."git:pre-push"]
description = "Run tests + branch validation"
run = '''
#!/usr/bin/env bash
npm exec -- @gracefullight/validate-branch || exit 1

changed=$(git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only HEAD~1)

if echo "$changed" | grep -q "^apps/front/"; then
    mise //apps/front:test || exit 1
fi

if echo "$changed" | grep -q "^apps/back/"; then
    mise //apps/back:test || exit 1
fi
'''

[tasks.lint:changed]
description = "Lint only changed apps"
run = '''
#!/usr/bin/env bash
changed_files=$(git diff --name-only HEAD~1)

if echo "$changed_files" | grep -q "^apps/front/"; then
  mise run //apps/front:lint || exit 1
fi

if echo "$changed_files" | grep -q "^apps/back/"; then
  mise run //apps/back:lint || exit 1
fi
'''

[tasks.test:changed]
description = "Test only changed apps"
run = '''
#!/usr/bin/env bash
changed_files=$(git diff --name-only HEAD~1)

if echo "$changed_files" | grep -q "^apps/front/"; then
  mise run //apps/front:test || exit 1
fi

if echo "$changed_files" | grep -q "^apps/back/"; then
  mise run //apps/back:test || exit 1
fi
'''
```
