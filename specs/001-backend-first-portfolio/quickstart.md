# Quickstart: 백엔드 중심 포트폴리오 비교 화면

## Prerequisites

- Node runtime and pnpm configured for `apps/front`.
- Existing app dependencies installed inside `apps/front`.

## Run the comparison experience

```bash
mise exec -- pnpm --dir apps/front dev
```

Open:

- `http://localhost:1104/` — existing baseline home
- `http://localhost:1104/projects` — existing baseline project list
- `/preview` comparison routes were retired on 2026-08-19. Use the public routes below for content review.

## Manual acceptance checks

1. Confirm the baseline home and project pages still load.
2. Confirm the comparison home lists all 8 current projects.
3. Open every comparison project card and verify its slug resolves.
4. On the pilot detail page, verify the long-form sections, table of contents, architecture artifact, and ERD/equivalent data evidence.
5. On a project with no demo, verify that no demo button appears and the architecture-flow action remains.
6. Toggle light/dark theme, reload, and confirm the selected preview theme persists.
7. Resize to 320px, 768px, 1024px, and 1440px. Confirm only diagram containers scroll horizontally.
8. Tab through the header, theme button, CTAs, table of contents, diagram controls, and related links.

## Automated verification

```bash
mise exec -- pnpm --dir apps/front lint
mise exec -- pnpm --dir apps/front build
```

Use Playwright MCP browser QA for live route snapshots, link traversal, theme persistence, keyboard focus, and responsive diagram behavior. Record evidence in the feature verification record before claiming completion.
