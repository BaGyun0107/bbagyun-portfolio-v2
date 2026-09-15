# UI Contract: Portfolio Preview Routes

## Routes

| Route | Required behavior |
|---|---|
| `/preview` | Renders the new backend-first home comparison screen with all 8 projects |
| `/preview/projects/[slug]` | Renders the reusable project detail template for every existing feature slug |
| Existing `/`, `/projects`, `/projects/[slug]` | Must remain available and visually comparable; no route replacement in this feature |

## Project detail evidence contract

The detail page renders these blocks in order when data exists:

1. Snapshot
2. Long-form case study
3. Architecture-flow entry point and artifact
4. ERD or equivalent data-design explanation
5. API/operations/metrics evidence when configured
6. Related insights

The page must not render empty cards or placeholder buttons for missing optional artifacts.

## Demo contract

- `demo.status = available`: render a visible demo CTA with accessible name and external-link behavior.
- `demo.status = limited`: render the CTA and an access note.
- Missing demo or `unavailable`: omit the demo CTA and keep the architecture-flow CTA.
- Source repository links are not part of the public contract.

## Diagram contract

- Every visual artifact has a non-empty `altText`.
- Wide artifacts are contained inside their own scroll/zoom region.
- The surrounding page never gains horizontal overflow because of a diagram.
- A caption or adjacent explanation states what decision or behavior the artifact proves.

## Theme contract

- The preview shell provides a button with an accessible name and pressed/current-state indication.
- Initial theme follows system preference when no explicit preview preference exists.
- Explicit preference is stored under a preview-specific browser key.
- The preview theme wrapper does not replace the existing public route shell.
