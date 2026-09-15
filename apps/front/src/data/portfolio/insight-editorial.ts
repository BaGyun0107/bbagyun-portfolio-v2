import type { InsightEditorialMetadata, InsightVisual } from './types/insight.dto';

type InsightEditorialCandidate = {
  slug: string;
  route?: string;
  content?: string;
  featureSlug?: string | null;
  studySlug?: string | null;
  editorial?: InsightEditorialMetadata | null;
  visual?: InsightVisual | null;
};

type TargetInsightFixture = {
  slug: string;
  type: InsightEditorialMetadata['type'];
  sourceKind: 'feature' | 'study';
  sourceSlug: string;
};

type LegacyPreservationFixture = {
  slug: string;
  route: string;
  contentHash: string;
};

const MIGRATED_INSIGHT_FIXTURES: readonly TargetInsightFixture[] = [
  {
    slug: 'codi-harness-dx-platform-design',
    type: 'project-case',
    sourceKind: 'feature',
    sourceSlug: 'codi-harness-dx-platform'
  },
  {
    slug: 'infisical-centralized-secrets-and-spof-defense',
    type: 'project-case',
    sourceKind: 'feature',
    sourceSlug: 'codi-harness-dx-platform'
  },
  {
    slug: 'cloudflare-tunnel-zero-trust-cicd-and-troubleshooting',
    type: 'project-case',
    sourceKind: 'feature',
    sourceSlug: 'codi-harness-dx-platform'
  },
  {
    slug: 'jenkins-retirement-and-github-actions-migration',
    type: 'project-case',
    sourceKind: 'feature',
    sourceSlug: 'codi-harness-dx-platform'
  },
  {
    slug: 'logging-decoupling-and-buffering-in-external-api-systems',
    type: 'project-case',
    sourceKind: 'feature',
    sourceSlug: 'the-siena-golf-reservation'
  },
  {
    slug: 'optimizing-770k-text-search-in-rdbms',
    type: 'project-case',
    sourceKind: 'feature',
    sourceSlug: 'hanmaum-science-institute'
  },
  {
    slug: 'spa-api-key-exposure-and-bff-architecture',
    type: 'project-case',
    sourceKind: 'feature',
    sourceSlug: 'blackstone-belleforet-resort'
  },
  {
    slug: 'sso-authentication-and-soft-fk',
    type: 'project-case',
    sourceKind: 'feature',
    sourceSlug: 'integrated-sso-server'
  },
  {
    slug: 'json-outbox-pattern-for-settlement',
    type: 'project-case',
    sourceKind: 'feature',
    sourceSlug: 'hipass-b2b-platform'
  },
  {
    slug: 'socketio-realtime-architecture-and-reliability',
    type: 'project-case',
    sourceKind: 'feature',
    sourceSlug: 'hipass-b2b-platform'
  },
  {
    slug: 'config-driven-architecture-react',
    type: 'project-case',
    sourceKind: 'feature',
    sourceSlug: 'hotel-reservation-platform'
  },
  {
    slug: 'context-api-encapsulation-and-router-level-isolation',
    type: 'project-case',
    sourceKind: 'feature',
    sourceSlug: 'hotel-reservation-platform'
  },
  {
    slug: 'nestjs-middleware-vs-guard-tradeoff',
    type: 'project-case',
    sourceKind: 'feature',
    sourceSlug: 'integrated-reservation-platform'
  },
  {
    slug: 'nextjs-nestjs-domain-separation-and-bff',
    type: 'project-case',
    sourceKind: 'feature',
    sourceSlug: 'integrated-reservation-platform'
  },
  {
    slug: 'https-and-plaintext-password-transmission',
    type: 'project-case',
    sourceKind: 'feature',
    sourceSlug: 'integrated-reservation-platform'
  },
  {
    slug: 'vercel-team-plan-bypass-and-serverless-cost-analysis',
    type: 'technical-exploration',
    sourceKind: 'study',
    sourceSlug: 'ai-dx-harness-starter-kit'
  }
];

const MIGRATED_INSIGHT_SLUGS = new Set(MIGRATED_INSIGHT_FIXTURES.map(({ slug }) => slug));

const isBlank = (value: unknown): boolean => typeof value !== 'string' || value.trim().length === 0;

const hasDuplicates = (ids: readonly string[]): boolean => new Set(ids).size !== ids.length;

const validateVisual = (visual: InsightVisual): string[] => {
  const errors: string[] = [];

  if ([visual.id, visual.title, visual.question, visual.textAlternative].some(isBlank)) {
    errors.push('visual-missing-required-text');
  }

  if (visual.variant === 'data-flow') {
    const nodeIds = visual.nodes.map(({ id }) => id);
    const edgeIds = visual.edges.map(({ id }) => id);
    const nodeIdSet = new Set(nodeIds);

    if (hasDuplicates(nodeIds) || hasDuplicates(edgeIds)) errors.push('visual-duplicate-id');
    if (visual.nodes.some(({ id, label, detail }) => [id, label, detail].some(isBlank))) {
      errors.push('visual-missing-node-text');
    }
    if (visual.edges.some(({ id, label }) => [id, label].some(isBlank))) {
      errors.push('visual-missing-edge-text');
    }
    if (visual.edges.some(({ from, to }) => !nodeIdSet.has(from) || !nodeIdSet.has(to))) {
      errors.push('visual-unknown-node-reference');
    }
  } else {
    const panelIds = visual.panels.map(({ id }) => id);
    if (
      visual.panels.length !== 2 ||
      panelIds[0] !== 'before' ||
      panelIds[1] !== 'after' ||
      new Set(panelIds).size !== 2
    ) {
      errors.push('visual-invalid-before-after-panels');
    }

    for (const panel of visual.panels) {
      const actorIds = panel.actors.map(({ id }) => id);
      const connectionIds = panel.connections.map(({ id }) => id);
      const actorIdSet = new Set(actorIds);

      if ([panel.title, panel.summary].some(isBlank)) errors.push('visual-missing-panel-text');
      if (hasDuplicates(actorIds) || hasDuplicates(connectionIds)) errors.push('visual-duplicate-id');
      if (panel.actors.some(({ id, label }) => [id, label].some(isBlank))) errors.push('visual-missing-actor-text');
      if (panel.connections.some(({ id, label }) => [id, label].some(isBlank))) {
        errors.push('visual-missing-connection-text');
      }
      if (panel.connections.some(({ from, to }) => !actorIdSet.has(from) || !actorIdSet.has(to))) {
        errors.push('visual-unknown-actor-reference');
      }
      if (panel.connections.length === 0) errors.push('visual-missing-panel-connection');
    }
  }

  return [...new Set(errors)];
};

export const validateInsightEditorial = (
  insight: InsightEditorialCandidate,
  featureSlugs: ReadonlySet<string>,
  studySlugs: ReadonlySet<string>
): string[] => {
  const errors: string[] = [];
  const editorial = insight.editorial;

  if (!editorial) return errors;

  if (editorial.type === 'project-case') {
    if (!insight.featureSlug) {
      errors.push('missing-feature-source');
    } else if (!featureSlugs.has(insight.featureSlug)) {
      errors.push('unknown-feature-source');
    }

    if (insight.studySlug) errors.push('conflicting-study-source');
  } else {
    if (insight.featureSlug) errors.push('conflicting-feature-source');

    const hasStudy = Boolean(insight.studySlug);
    const hasIndependentReason = editorial.independentReason !== undefined;

    if (!hasStudy && !hasIndependentReason) {
      errors.push('missing-study-or-independent-reason');
    }
    if (hasStudy && hasIndependentReason) {
      errors.push('ambiguous-study-and-independent-reason');
    }
    if (insight.studySlug && !studySlugs.has(insight.studySlug)) {
      errors.push('unknown-study-source');
    }
    if (hasIndependentReason && isBlank(editorial.independentReason)) {
      errors.push('empty-independent-reason');
    }
  }

  const visualAssessment = editorial.visualAssessment;
  if (isBlank(visualAssessment.rationale)) {
    errors.push('missing-visual-rationale');
  }

  if (visualAssessment.decision !== 'not-needed' && !('kind' in visualAssessment && visualAssessment.kind)) {
    errors.push('missing-visual-kind');
  }

  if (
    visualAssessment.decision === 'provided' &&
    (isBlank(visualAssessment.question) ||
      isBlank(visualAssessment.textAlternative) ||
      isBlank(visualAssessment.nonDuplicationReason))
  ) {
    errors.push('incomplete-provided-visual');
  }

  if (insight.visual) {
    if (visualAssessment.decision !== 'provided') {
      errors.push('visual-requires-provided-assessment');
    } else {
      const expectedKind = insight.visual.variant === 'data-flow' ? 'data-flow' : 'architecture';
      if (visualAssessment.kind !== expectedKind) errors.push('visual-kind-mismatch');
      if (visualAssessment.question !== insight.visual.question) errors.push('visual-question-mismatch');
      if (visualAssessment.textAlternative !== insight.visual.textAlternative) {
        errors.push('visual-text-alternative-mismatch');
      }
    }
    errors.push(...validateVisual(insight.visual));
  }

  return errors;
};

export const validateMigratedInsightSet = (
  insights: readonly InsightEditorialCandidate[],
  featureSlugs: ReadonlySet<string>,
  studySlugs: ReadonlySet<string>,
  legacyFixtures: readonly LegacyPreservationFixture[],
  hashContent: (content: string) => string
): string[] => {
  const errors: string[] = [];
  const migratedInsights = insights.filter(({ editorial }) => editorial);
  const actualSlugs = new Set(migratedInsights.map(({ slug }) => slug));

  if (
    actualSlugs.size !== MIGRATED_INSIGHT_SLUGS.size ||
    [...MIGRATED_INSIGHT_SLUGS].some((slug) => !actualSlugs.has(slug))
  ) {
    errors.push('migrated-insight-set-mismatch');
  }

  const typeCount = migratedInsights.reduce(
    (count, { editorial }) => {
      if (editorial) count[editorial.type] += 1;
      return count;
    },
    { 'project-case': 0, 'technical-exploration': 0 }
  );

  if (typeCount['project-case'] !== 15 || typeCount['technical-exploration'] !== 1) {
    errors.push('migrated-insight-type-count-mismatch');
  }

  for (const fixture of MIGRATED_INSIGHT_FIXTURES) {
    const insight = insights.find(({ slug }) => slug === fixture.slug);
    if (!insight?.editorial) continue;

    if (insight.editorial.type !== fixture.type) {
      errors.push(`target-editorial-type-mismatch:${fixture.slug}`);
    }

    const hasExpectedSource =
      fixture.sourceKind === 'feature'
        ? insight.featureSlug === fixture.sourceSlug && !insight.studySlug
        : insight.studySlug === fixture.sourceSlug && !insight.featureSlug;
    if (!hasExpectedSource) {
      errors.push(`target-source-mismatch:${fixture.slug}`);
    }
  }

  for (const insight of migratedInsights) {
    errors.push(
      ...validateInsightEditorial(insight, featureSlugs, studySlugs).map((error) => `${insight.slug}:${error}`)
    );
  }

  const expectedLegacySlugs = new Set(legacyFixtures.map(({ slug }) => slug));
  const actualLegacySlugs = new Set(
    insights.filter(({ slug }) => !MIGRATED_INSIGHT_SLUGS.has(slug)).map(({ slug }) => slug)
  );
  if (
    actualLegacySlugs.size !== expectedLegacySlugs.size ||
    [...expectedLegacySlugs].some((slug) => !actualLegacySlugs.has(slug))
  ) {
    errors.push('legacy-insight-set-mismatch');
  }

  for (const fixture of legacyFixtures) {
    const insight = insights.find(({ slug }) => slug === fixture.slug);
    if (!insight) {
      errors.push(`legacy-insight-missing:${fixture.slug}`);
      continue;
    }
    if (insight.route !== fixture.route) {
      errors.push(`legacy-route-mismatch:${fixture.slug}`);
    }
    if (typeof insight.content !== 'string' || hashContent(insight.content) !== fixture.contentHash) {
      errors.push(`legacy-content-mismatch:${fixture.slug}`);
    }
  }

  return errors;
};
