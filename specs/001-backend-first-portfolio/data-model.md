# Data Model: 백엔드 중심 포트폴리오 비교 화면

## Feature extension

The existing `FeatureDto` remains the canonical project record. The comparison experience adds optional, normalized evidence fields so one renderer can serve all 8 projects.

## FeatureEvidenceDto

Represents one independently addressable artifact or proof block attached to a feature.

| Field | Type | Rules |
|---|---|---|
| `id` | `string` | Unique within the feature |
| `featureSlug` | `string` | Must match an existing feature slug |
| `kind` | `system \| sequence \| erd \| api \| metric \| operations` | Controls renderer and label |
| `title` | `string` | Required, human-readable |
| `description` | `string` | Explains what the artifact proves |
| `asset` | `string` | Optional SVG/diagram asset or structured render key |
| `altText` | `string` | Required for visual artifacts |
| `caption` | `string` | Optional short interpretation |
| `order` | `number` | Stable display order |
| `details` | `string` | Optional Markdown explanation |

## FeatureDemoDto

Optional controlled demo information. A missing record means the project has no public demo and must not render a demo CTA.

| Field | Type | Rules |
|---|---|---|
| `url` | `string` | Valid absolute URL when present |
| `label` | `string` | Defaults to `데모 실행` |
| `accessNote` | `string` | Optional access or limitation note |
| `status` | `available \| limited \| unavailable` | `unavailable` hides the CTA |

## FeatureDecisionDto

Captures the user's reasoning rather than only the final technology.

| Field | Type | Rules |
|---|---|---|
| `title` | `string` | Required |
| `problem` | `string` | Problem or decision context |
| `choice` | `string` | Selected approach |
| `alternatives` | `string[]` | Rejected or considered alternatives |
| `rationale` | `string` | Required reasoning |
| `outcome` | `string` | Optional result or follow-up |

## FeatureMetricDto

Represents a verifiable result without forcing a before/after value.

| Field | Type | Rules |
|---|---|---|
| `label` | `string` | Required |
| `value` | `string` | Result value or qualitative status |
| `before` | `string` | Optional baseline |
| `after` | `string` | Optional improved value |
| `context` | `string` | Required when a numeric value could be misleading |

## FeatureDto comparison extensions

The existing DTO can gain optional fields without changing the existing route's required data:

```text
demo?: FeatureDemoDto
evidence?: FeatureEvidenceDto[]
decisions?: FeatureDecisionDto[]
metrics?: FeatureMetricDto[]
```

The existing `content` field remains the source for long-form Markdown. The comparison renderer composes normalized metadata around it; it does not replace the authored content with generated summaries.

## Future DevelopmentLogDto

Not required for the first public comparison-route implementation, but reserved as the intake model for later local Claude Code/Codex history processing.

```text
DevelopmentLog
├── id
├── date
├── source
├── featureSlug?
├── changedSummary
├── problem?
├── hypothesis?
├── decision?
├── rejectedAlternatives[]
├── verification?
├── result?
├── remainingIssue?
└── publishStatus: inbox | reviewed | published | archived
```

## Relationships

```text
Feature 1 ──── * FeatureEvidenceDto
Feature 1 ──── 0..1 FeatureDemoDto
Feature 1 ──── * FeatureDecisionDto
Feature 1 ──── * FeatureMetricDto
Feature 1 ──── * Insight (existing featureSlug relation)
Feature 1 ──── * DevelopmentLog (future featureSlug relation)
```
