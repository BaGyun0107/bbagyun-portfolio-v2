import { getFeatureDetailBySlug, validateFeatureDetail } from './feature-details';
import { REAL_FEATURES } from './features';
import { REAL_INSIGHTS } from './insights';
import { REAL_STUDIES } from './studies';

import type { SeedFeature } from './features';
import type { SeedInsight } from './insights';
import type { SeedStudy } from './studies';
import type { FeatureDto } from './types/feature.dto';
import type { InsightArchiveDto, InsightDto, InsightNavigationDto, InsightTagDto } from './types/insight.dto';
import type { StudyCategory, StudyDto, StudyStatus } from './types/study.dto';

export type { FeatureDto, FeatureCategory, FeatureStatus } from './types/feature.dto';
export type {
  FeatureDemo,
  FeatureDetailDto,
  FeatureArchifyUrl,
  FeatureMetric,
  FeatureMetricKind,
  FeatureRelationship,
  FeatureRelationshipArchifyEmbed,
  FeatureRelationshipArchifyUrl,
  FeatureRelationshipDiagram,
  FeatureRelationshipEntity,
  FeatureRelationshipEntityRole,
  FeatureSwimlane,
  FeatureSwimlaneAnchor,
  FeatureSwimlaneEdge,
  FeatureSwimlaneException,
  FeatureSwimlaneLane,
  FeatureSwimlaneNodeShape,
  FeatureSwimlanePoint,
  FeatureSwimlaneStep
} from './types/feature-detail.dto';
export type {
  InsightDto,
  InsightArchiveDto,
  InsightTagDto,
  InsightNavigationDto,
  InsightType,
  InsightVisualKind,
  InsightVisualAssessment,
  InsightEditorialMetadata,
  InsightVisual,
  InsightDataFlowVisual,
  InsightBeforeAfterVisual,
  InsightDataFlowNode,
  InsightDataFlowEdge,
  InsightDataFlowNodeRole,
  InsightDataFlowEdgeOutcome,
  InsightArchitecturePanel,
  InsightArchitectureActor,
  InsightArchitectureConnection
} from './types/insight.dto';
export type { StudyDto, StudyCategory, StudyStatus } from './types/study.dto';
export {
  FEATURE_RELATIONSHIP_ARCHIFY_TARGETS,
  FEATURE_RELATIONSHIP_ARCHIFY_URLS,
  isFeatureRelationshipArchifyTarget,
  isFeatureRelationshipArchifyUrlForDiagram,
  isFeatureSwimlaneArchifyTarget,
  isFeatureSwimlaneArchifyUrlForSwimlane
} from './types/feature-detail.dto';

const BUILD_TIME = new Date().toISOString();

const featureToDto = (f: SeedFeature): FeatureDto => ({
  id: `feature-${f.slug}`,
  slug: f.slug,
  title: f.title,
  description: f.description,
  iconName: f.iconName,
  category: f.category,
  techStack: f.techStack,
  status: f.status,
  overview: f.overview,
  period: f.period ?? undefined,
  team: f.team ?? undefined,
  content: f.content ?? undefined,
  createdAt: BUILD_TIME,
  updatedAt: BUILD_TIME
});

const studyToDto = (s: SeedStudy): StudyDto => ({
  id: `study-${s.slug}`,
  slug: s.slug,
  title: s.title,
  description: s.description,
  iconName: s.iconName,
  category: s.category as StudyCategory,
  techStack: s.techStack,
  status: s.status as StudyStatus,
  overview: s.overview,
  period: s.period ?? undefined,
  content: s.content ?? undefined,
  createdAt: BUILD_TIME,
  updatedAt: BUILD_TIME
});

const insightToDto = (i: SeedInsight): InsightDto => ({
  id: `insight-${i.slug}`,
  slug: i.slug,
  title: i.title,
  excerpt: i.excerpt,
  content: i.content,
  date: i.date.toISOString(),
  tags: i.tags,
  readTime: i.readTime,
  featureSlug: i.featureSlug ?? null,
  studySlug: i.studySlug ?? null,
  editorial: i.editorial
    ? {
        ...i.editorial,
        visualAssessment: { ...i.editorial.visualAssessment }
      }
    : null,
  visual: i.visual
    ? i.visual.variant === 'data-flow'
      ? {
          ...i.visual,
          nodes: i.visual.nodes.map((node) => ({ ...node })),
          edges: i.visual.edges.map((edge) => ({ ...edge }))
        }
      : {
          ...i.visual,
          panels: i.visual.panels.map((panel) => ({
            ...panel,
            actors: panel.actors.map((actor) => ({ ...actor })),
            connections: panel.connections.map((connection) => ({ ...connection }))
          })) as typeof i.visual.panels
        }
    : null,
  createdAt: BUILD_TIME,
  updatedAt: BUILD_TIME
});

const getPeriodSortTime = (period?: string): number => {
  if (!period) return 0;
  if (/현재|진행|present|now/i.test(period)) return Number.MAX_SAFE_INTEGER;

  const matches = Array.from(period.matchAll(/(\d{4})\.(\d{2})/g));
  const latest = matches.at(-1);

  if (!latest) return 0;

  const year = Number(latest[1]);
  const month = Number(latest[2]);

  return year * 100 + month;
};

const FEATURES: FeatureDto[] = REAL_FEATURES.map(featureToDto).sort(
  (a, b) => getPeriodSortTime(b.period) - getPeriodSortTime(a.period)
);
const STUDIES: StudyDto[] = REAL_STUDIES.map(studyToDto);
const INSIGHTS: InsightDto[] = REAL_INSIGHTS.map(insightToDto).sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

export const INSIGHT_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  'enterprise-bff-architecture-and-cors': 'nextjs-nestjs-domain-separation-and-bff'
});

export const validateInsightAliases = (
  aliases: Readonly<Record<string, string>>,
  canonicalSlugs: ReadonlySet<string>
): string[] => {
  const aliasSlugs = new Set(Object.keys(aliases));
  const errors: string[] = [];

  for (const [alias, target] of Object.entries(aliases)) {
    if (alias === target) {
      errors.push(`alias-self-reference:${alias}`);
      continue;
    }
    if (aliasSlugs.has(target)) {
      errors.push(`alias-target-is-alias:${alias}`);
      continue;
    }
    if (!canonicalSlugs.has(target)) errors.push(`alias-unknown-target:${alias}`);
  }

  return errors;
};

export const resolveInsightAlias = (slug: string): string | null => INSIGHT_ALIASES[slug] ?? null;

export const getInsightRouteSlugs = (): readonly string[] => [
  ...INSIGHTS.map(({ slug }) => slug),
  ...Object.keys(INSIGHT_ALIASES)
];

export const getAllFeatures = (): FeatureDto[] => FEATURES;

export const getFeatureBySlug = (slug: string): FeatureDto | null => FEATURES.find((f) => f.slug === slug) ?? null;

export { getFeatureDetailBySlug, validateFeatureDetail };

export const getAllStudies = (): StudyDto[] => STUDIES;

export const getStudyBySlug = (slug: string): StudyDto | null => STUDIES.find((s) => s.slug === slug) ?? null;

export const getAllInsights = (): InsightDto[] => INSIGHTS;

export const getInsightBySlug = (slug: string): InsightDto | null => INSIGHTS.find((i) => i.slug === slug) ?? null;

export const getInsightArchive = (): InsightArchiveDto[] => {
  const groups = new Map<string, InsightDto[]>();
  for (const insight of INSIGHTS) {
    const year = new Date(insight.date).getFullYear().toString();
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year)!.push(insight);
  }
  return Array.from(groups.entries())
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, items]) => ({
      year,
      insights: items.map((i) => ({
        id: i.id,
        slug: i.slug,
        title: i.title,
        date: i.date,
        tags: i.tags
      }))
    }));
};

export const getInsightsByTag = (tag: string): InsightDto[] => INSIGHTS.filter((i) => i.tags.includes(tag));

export const getInsightTags = (): InsightTagDto[] => {
  const counts = new Map<string, number>();
  for (const insight of INSIGHTS) {
    for (const tag of insight.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
};

export const getInsightNavigation = (
  slug: string
): { prev: InsightNavigationDto | null; next: InsightNavigationDto | null } => {
  const idx = INSIGHTS.findIndex((i) => i.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  const toNav = (i: InsightDto): InsightNavigationDto => ({ slug: i.slug, title: i.title });
  return {
    prev: idx < INSIGHTS.length - 1 ? toNav(INSIGHTS[idx + 1]) : null,
    next: idx > 0 ? toNav(INSIGHTS[idx - 1]) : null
  };
};
