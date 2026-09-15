# Contract: Portfolio Theme and Accessibility for Swimlanes

**Date**: 2026-09-10

## Theme bridge

The parent portfolio remains the source of truth for semantic colors. The adapter reads the computed values for:

```text
--background, --foreground, --card, --muted,
--muted-foreground, --destructive, --border
```

and maps them to the artifact's background, panel, lane, text, border and relationship variables without hard-coded product colors. A parent light/dark class change updates the prepared document without a reload.

## Flow semantics

| Meaning | Visual contract | Text/structure supplement |
| --- | --- | --- |
| General progress or validation pass | foreground-colored solid line | direction and endpoint nodes |
| Exception, recovery or re-verification | destructive-colored dashed line | exception label, arrow direction, transcript badge |

Technical node categories do not receive a separate public legend. State meaning must not depend on color alone.

## Accessible presentation

- The outer visual wrapper has an accessible name and is described by the existing summary text.
- The iframe is `aria-hidden`, removed from the tab order, and pointer-inert.
- Internal Viewer controls, focusable elements, shortcuts and navigation are not exposed to users.
- Dialog open/close works with mouse, touch, keyboard and Escape; focus returns to the original trigger.
- At widths below 1024px, the Dialog transcript exposes every step and every labeled relationship in structured text of at least 14px.

## Responsive contract

- The card and Dialog fit within the viewport at 320px, 768px, 1024px and 1440px without page-level horizontal overflow.
- The preview preserves the complete topology; it does not invent a second mobile topology.
- When diagram text cannot be comfortably read in a narrow viewport, the Dialog transcript is the text reading path.
- A failed artifact shows the existing React fallback and never leaves an empty or indefinite loading area.

## Verification

The contract is verified with DOM/unit tests, source-artifact parity checks, production browser checks and screenshot review as separate evidence. No single screenshot or DOM assertion is treated as proof of all four categories.
