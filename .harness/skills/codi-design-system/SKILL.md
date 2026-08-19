---
name: codi-design-system
description: Create or update a project-owned design system for Codi frontend apps. Use when the user mentions design systems, design tokens, brand colors, visual identity, Tailwind/shadcn tokens, or asks to generate project UI foundations.
---

# Codi Design System

Use this skill to create or update the project-owned visual foundation for a
Codi frontend app. The harness owns the contract, templates, and validation
process; each downstream project owns the actual token values and design
decisions.

Do not preload project design-system contents into always-on context. Read the
files below only when a UI/design-system task needs them.

## Contract

### Standard Project-Owned Locations

| Artifact | Path | Format |
| --- | --- | --- |
| Token source of truth | `apps/front/src/styles/tokens.css` | Tailwind v4 CSS with `:root`, `.dark`, and `@theme inline` |
| Design principles | `docs/design-system.md` | Markdown with decisions and rationale only |
| Custom UI components | `apps/front/components/ui/` | shadcn vendored primitives composed with `cva` variants |

### Token Format

- Keep shadcn semantic token names stable: `background`/`foreground`,
  `primary`/`primary-foreground`, `secondary`, `muted`, `accent`,
  `destructive`, `border`/`input`/`ring`, and any chart/sidebar families already
  present.
- Define every color token in both `:root` and `.dark`; the key sets must match.
- Prefer OKLCH values.
- Every foreground/background pair must pass WCAG AA contrast: 4.5:1 for normal
  text. Do not silently accept a failing pair.
- Treat `tokens.css` as the value source of truth. `docs/design-system.md`
  records intent, rationale, and change history instead of duplicating the full
  token table.

### Priority And Loading

1. If `apps/front/src/styles/tokens.css` and `docs/design-system.md` exist, the
   project design system wins.
2. If the project design system is absent, fall back to
   `.harness/imported-rules/design.md`.
3. `codi-frontend` must read the two standard project files at UI work time
   when they exist. Do not copy their contents into `AGENTS.md`, `CLAUDE.md`,
   always-on rules, or other permanently loaded context.

### Extension Path

- Multiple frontend apps: graduate to the official shadcn monorepo pattern by
  centralizing tokens under `packages/ui/src/styles/globals.css` and pointing
  `components.json` at the shared package.
- Shared Codi base: replace the neutral values in
  `resources/tokens-template.css`. Existing project-owned files are unaffected
  until a project intentionally updates them through edit mode.

## Resources

- Token template: `resources/tokens-template.css`
- Document template: `resources/design-system-template.md`
- Contrast gate: `resources/contrast-check.mjs`

Run the gate from the project root:

```bash
node .harness/skills/codi-design-system/resources/contrast-check.mjs apps/front/src/styles/tokens.css
```

## Mode Detection

1. Read `.harness/config/project-profile.yaml` if present.
2. Stop without creating files when the profile excludes a frontend app
   (`backend-only`) or when `apps/front` is clearly absent from a project that
   does not route UI through Next.js.
3. Check the standard files:
   - neither file exists: creation mode.
   - both files exist: edit mode.
   - only one file exists: partial recovery mode, then edit mode.

## Creation Mode

Ask one question at a time. Keep the total at six or fewer unless the user adds
new requirements.

1. Mood and product character.
2. Primary brand color or color direction.
3. Audience and usage density.
4. Typography needs, including whether CJK content is expected.
5. Radius preference and interface density.
6. Motion exceptions, only when the product needs them.

Then:

1. Create `apps/front/src/styles/tokens.css` from `tokens-template.css` and
   replace only values, not token names or structure.
2. Create `docs/design-system.md` from `design-system-template.md`; record the
   answers, rationale, and the first decision-log entry.
3. Prefer CJK-ready font stacks when the user says CJK content is required
   (`Pretendard Variable`, `Noto Sans CJK`, then system fallback).
4. Run the contrast gate.
5. If the gate fails, show the failing pairs and propose adjusted token values.
   Re-run the gate after each adjustment. Continue until it passes, or until the
   user explicitly chooses to proceed with a documented exception.
6. Check whether the app global stylesheet imports the token file. If not, add
   the import when the target file is clear; otherwise give the exact import
   line and target file to the user.

Suggested Tailwind v4 import:

```css
@import "./tokens.css";
```

## Edit Mode

1. Summarize the current design system before asking for changes:
   - token file path and last modified state,
   - current primary/background/accent/radius values,
   - design document sections that will be affected.
2. Ask which item to change. Do not rewrite unrelated sections.
3. Apply a partial token update while preserving the shadcn semantic token
   names, light/dark key symmetry, and `@theme inline` mappings.
4. Update the matching section in `docs/design-system.md` in the same run.
5. Append a decision-log row with the date, change, reason, and verification.
6. Re-run the contrast gate. If it fails, loop with concrete adjustment options.
7. Do not finish with token/document disagreement. If the user forces a failing
   state, record the failure and impact in the decision log.

## Partial Recovery Mode

- If `tokens.css` exists and `docs/design-system.md` is missing, generate the
  document from the template, summarize the existing token intent, and mark the
  decision log as recovered from existing tokens.
- If `docs/design-system.md` exists and `tokens.css` is missing, generate
  tokens from the template, apply any clearly documented project values, and
  record unresolved assumptions in the decision log.
- After recovery, run the contrast gate and continue through edit mode.

## Component Rule

Build project-specific UI in `apps/front/components/ui/` by composing existing
shadcn primitives and `cva` variants. Do not scatter one-off hardcoded color
classes or raw markup across routes when a reusable component contract is
needed.
