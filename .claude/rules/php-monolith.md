---
paths:
  - "**/*.php"
---

# PHP Monolith (Gnuboard) Routing

This rule is path-scoped: it loads when Claude reads a PHP file — the
moment a session is most likely to misdiagnose the project as a Node.js
app. Codex counterpart: `.codex/rules/php-monolith.rules` (always-on
narrative; Codex has no path-scoping).

- Check `.harness/config/project-profile.yaml`. If `mode: php-monolith`,
  this project is a PHP monolith (typically a Gnuboard5/YoungCart mall):
  mall code lives under `apps/<mall>/`, and the Node app surfaces
  (`apps/front`, `apps/back`) are disabled — the shared profile guard
  blocks writes to them on both runtimes.
- Load the `codi-gnuboard` skill before PHP mall work. It owns the
  Gnuboard5 structure map, the git onboarding procedure for
  server-resident code, the local Docker environment template
  (php 7.4 + MySQL 5.7 with the pilot-proven pitfalls), and e2e suite
  wiring (gate tasks stay owned by `codi-e2e`).
- Do not assume npm/pnpm, Next.js, or Express/NestJS conventions for
  mall code, and do not route it to `codi-frontend`/`codi-backend`.
- Never patch Gnuboard core files in place — behavior changes go in
  `extend/` (`*.extend.php`) or skins/themes.
- Editing files directly on the live server is a production-affecting
  operation: it requires explicit user approval naming the operation and
  target, and must be back-ported to the repo immediately.
