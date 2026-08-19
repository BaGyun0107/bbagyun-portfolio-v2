# Contract: Hub Workspace Configuration v1

## Purpose

Declare available planning/delivery sources and default display without hardcoding repository
names.

## Rules

- Workspace IDs are unique and stable.
- All source paths are repository-relative and remain inside the root.
- Demo workspaces require a persistent user-facing demo badge.
- Harness preview config may default to Community Demo.
- No config means a single actual downstream workspace at the repository root.
- Invalid actual data never falls back to demo.
- Switching workspace changes all six product views and the operations disclosure
  atomically; views never combine entities from different active workspaces.

## Preview vs strict behavior

- Preview preserves other valid workspaces when one fails and shows source health.
- Strict check validates every configured required workspace and expected snapshot.
