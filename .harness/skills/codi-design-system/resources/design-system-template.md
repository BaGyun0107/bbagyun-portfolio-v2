# Design System

This document records project-specific design decisions and reasoning. Keep
token values in `apps/front/src/styles/tokens.css`; do not duplicate the full
token table here.

## Mood And Direction

- Mood: `{{mood}}`
- Product character: `{{product_character}}`
- Primary audience: `{{audience}}`
- Rationale: Explain why these choices fit the product and users.

## Color

- Primary color intent: `{{primary_color_intent}}`
- Accessibility gate: Run
  `node .harness/skills/codi-design-system/resources/contrast-check.mjs apps/front/src/styles/tokens.css`
  after every token change.
- Rule: Use semantic tokens such as `bg-background`, `text-foreground`,
  `bg-primary`, and `text-primary-foreground`. Do not hardcode raw colors in UI
  code.
- Rationale: Summarize the contrast and brand tradeoffs without copying every
  token value from `tokens.css`.

## Typography

- Font stack: `{{font_stack}}`
- CJK support: `{{cjk_support}}`
- Scale: Use the project framework and Tailwind utilities before adding custom
  sizes.
- Rationale: Explain readability, language coverage, and product tone.

## Radius And Density

- Radius: `{{radius}}`
- Density: `{{density}}`
- Rule: Match repeated controls and cards to the tokenized radius. Avoid one-off
  spacing or radius values unless the component contract requires it.
- Rationale: Explain how shape and density support the product workflow.

## Motion

- Default: Inherit the shared Codi motion standard.
- Project exceptions: `{{motion_exceptions}}`
- Rule: Motion should clarify state changes, not decorate static content.

## Component Rules

- Build custom UI in `apps/front/components/ui/` from existing shadcn primitives.
- Use composition and `cva` variants for repeated visual variants.
- Keep primitive copies maintainable; wrap or compose rather than scattering
  raw markup and hardcoded classes across routes.
- Interactive components need visible focus states using the `ring` token.

## Decision Log

| Date | Change | Reason | Verification |
| --- | --- | --- | --- |
| `{{date}}` | Initial design system | `{{initial_reason}}` | Contrast gate passed |
