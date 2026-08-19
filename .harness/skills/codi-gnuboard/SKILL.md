---
name: codi-gnuboard
description: Gnuboard5 PHP shopping-mall specialist for the php-monolith profile. Use for gnuboard/영카트 structure questions, onboarding server-resident PHP mall code into git, local Docker environment setup (php 7.4 + MySQL 5.7), and wiring PHP mall e2e suites into the harness gate.
---

# Codi Gnuboard - PHP Mall Support

Use this skill in `php-monolith` profile projects. It covers four jobs:
Gnuboard5 structure knowledge, onboarding server-resident code into git,
the local Docker environment, and wiring PHP mall e2e suites into the
harness gate. Do not assume Node.js app surfaces (`apps/front`,
`apps/back`, npm/pnpm) in these projects.

## 1. Gnuboard5 Structure (baseline: 5.6.32 pristine)

Mall code lives under `apps/<mall>/` (one repo per mall; the same layout
works when several malls share one repo). Top-level map of a pristine
Gnuboard 5.6.32 tree:

| Path | Role |
| --- | --- |
| `common.php`, `_common.php` | Entry bootstrap; every page includes this first |
| `config.php` | Site-level constants (table prefix, URL) |
| `adm/` | Admin dashboard (members, boards, shop management) |
| `bbs/` | Board flows (read/write/comment/login) |
| `shop/` | YoungCart shop (item, cart, order, mypage) |
| `skin/` | Feature-level presentation (board, shop, member, ...) |
| `theme/` | Site-wide theme overriding skins |
| `extend/` | **The** no-core-modification extension point (`*.extend.php` auto-loaded) |
| `lib/` | Shared PHP libraries |
| `mobile/` | Mobile presentation variants |
| `install/` | Installer + reference schema (`gnuboard5.sql`, `gnuboard5shop.sql`) |
| `data/` | Runtime output: uploads, cache, sessions, and `dbconfig.php` (DB secret). Never tracked in git |
| `plugin/`, `js/`, `css/`, `img/` | Assets and bundled plugins |

Core rules:

- **Never patch core files in place.** Put behavior changes in `extend/`
  (`*.extend.php` files are loaded automatically by `common.php`) or in
  skins/themes. This keeps upstream Gnuboard security updates applicable.
- `data/` is created at install time and holds both user uploads and the
  DB secret (`data/dbconfig.php`) — this is why git onboarding excludes
  the whole directory.
- Version-difference checkpoints (when a mall is not exactly 5.6.32):
  confirm `version.php`, whether `shop/` exists (board-only installs),
  the skin directory layout under `skin/`, and PHP version constraints
  (5.6.32 targets PHP 7.x; do not assume PHP 8 compatibility).

## 2. Git Onboarding (server-resident code -> repo)

Goal: stop the "edit directly on the live server" workflow. One mall =
one repo, code under `apps/<mall>/`.

1. **Download over SSH** into the repo layout:
   `rsync -az --exclude 'data/' user@server:/path/to/mall/ apps/<mall>/`
   (dry-run first with `-n`; `data/` stays on the server).
2. **Apply the exclusion list**: copy `resources/gitignore.gnuboard` to
   the repo root as `.gitignore`. It excludes `apps/*/data/` (uploads,
   cache, sessions, and the `dbconfig.php` secret), `*.sql` operational
   dumps (PII risk — hand them over outside git), and `.env*`.
3. **Verify before the first commit**: `git status` must show no
   `data/`, no `*.sql`, no `dbconfig.php`. Then make the initial commit.
   Production DB dumps are sensitive data (PII): handling them follows
   the guardrails sensitive-data rules — production data reads/exports
   need explicit user approval, and dumps travel outside git.
4. **After onboarding, changes flow through git**: edit locally on a
   working branch, verify in the local Docker environment (section 3),
   PR-review, then deploy with
   `rsync -az --exclude 'data/' apps/<mall>/ user@server:/path/to/mall/`
   (again `-n` first).
5. **Editing files directly on the live server is not a supported
   workflow.** It is a production-affecting operation: it requires
   explicit user approval naming the operation and target (guardrails
   policy), and the change must be back-ported to the repo immediately.

## 3. Local Docker Environment

Template: `resources/docker-compose.gnuboard.yml` (php:7.4-apache with
mysqli/gd + mysql:5.7). Copy it to the repo root, replace `<mall>` with
the mall directory name, then `docker compose up -d`. Import the DB:
`docker exec -i gnuboard-local-db mysql -uroot -plocaldev gnuboard < dump.sql`
and point `data/dbconfig.php` (inside the container volume) at the `db`
host. The mall opens at `http://127.0.0.1:38080`.

Four pilot-proven pitfalls are already handled in the template — keep
them when adapting it:

1. **`--sql-mode=` (non-STRICT)**: Gnuboard 5.6 conventionally stores
   `0000-00-00` datetimes; MySQL 5.7 STRICT mode rejects them
   (err 1292) during import and at runtime.
2. **Repo-root mount (`.:/repo`) + DocumentRoot rewrite**: keeps
   relative symlinks valid inside the container; mounting only the mall
   directory breaks links that point outside it (403).
3. **`data/` as a named container volume**: cache/session/upload output
   stays out of the host working tree (which git excludes anyway).
4. **`platform: linux/amd64`**: mysql:5.7 has no arm64 image; Apple
   Silicon runs it under emulation.

PHP version note: stay on php 7.4 images for 5.6.32-era malls; do not
"upgrade" the image to PHP 8 as part of environment setup.

## 4. E2E Gate Wiring

The harness e2e gate tasks (`e2e` / `e2e:changed`, evidence stamping)
are owned by the `codi-e2e` skill — do not fork them here. What this
skill provides is the mall-suite pattern that plugs into that gate:
`resources/e2e-suite-example.sh` (absolute-path docker fallback ->
container check -> silent skip with exit 0 and no evidence when the
environment is absent -> run the critical-flow checks). Copy it into the
project (e.g. `tools/e2e/`), fill in the mall's critical flows, and call
it from the gate task per `codi-e2e` guidance.
