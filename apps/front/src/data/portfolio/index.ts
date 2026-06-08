import { FeatureDto, FeatureCategory, FeatureStatus } from './types/feature.dto';
import { InsightDto, InsightArchiveDto, InsightTagDto, InsightNavigationDto } from './types/insight.dto';
import { StudyDto, StudyCategory, StudyStatus } from './types/study.dto';

export type { FeatureDto, FeatureCategory, FeatureStatus } from './types/feature.dto';
export type { InsightDto, InsightArchiveDto, InsightTagDto, InsightNavigationDto } from './types/insight.dto';
export type { StudyDto, StudyCategory, StudyStatus } from './types/study.dto';
import { REAL_FEATURES, SeedFeature } from './features';
import { REAL_INSIGHTS, SeedInsight } from './insights';
import { REAL_STUDIES, SeedStudy } from './studies';

const BUILD_TIME = new Date().toISOString();

const featureToDto = (f: SeedFeature): FeatureDto => ({
  id: `feature-${f.slug}`,
  slug: f.slug,
  title: f.title,
  description: f.description,
  iconName: f.iconName,
  category: f.category as FeatureCategory,
  techStack: f.techStack,
  status: f.status as FeatureStatus,
  apiCount: f.apiCount,
  overview: f.overview,
  period: f.period ?? undefined,
  team: f.team ?? undefined,
  content: f.content ?? undefined,
  createdAt: BUILD_TIME,
  updatedAt: BUILD_TIME,
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
  updatedAt: BUILD_TIME,
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
  createdAt: BUILD_TIME,
  updatedAt: BUILD_TIME,
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

const FEATURES: FeatureDto[] = REAL_FEATURES
  .map(featureToDto)
  .sort((a, b) => getPeriodSortTime(b.period) - getPeriodSortTime(a.period));
const STUDIES: StudyDto[] = REAL_STUDIES.map(studyToDto);
const INSIGHTS: InsightDto[] = REAL_INSIGHTS
  .map(insightToDto)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const getAllFeatures = (): FeatureDto[] => FEATURES;

export const getFeatureBySlug = (slug: string): FeatureDto | null =>
  FEATURES.find((f) => f.slug === slug) ?? null;

export const getAllStudies = (): StudyDto[] => STUDIES;

export const getStudyBySlug = (slug: string): StudyDto | null =>
  STUDIES.find((s) => s.slug === slug) ?? null;

export const getAllInsights = (): InsightDto[] => INSIGHTS;

export const getInsightBySlug = (slug: string): InsightDto | null =>
  INSIGHTS.find((i) => i.slug === slug) ?? null;

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
        tags: i.tags,
      })),
    }));
};

export const getInsightsByTag = (tag: string): InsightDto[] =>
  INSIGHTS.filter((i) => i.tags.includes(tag));

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
  slug: string,
): { prev: InsightNavigationDto | null; next: InsightNavigationDto | null } => {
  const idx = INSIGHTS.findIndex((i) => i.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  const toNav = (i: InsightDto): InsightNavigationDto => ({ slug: i.slug, title: i.title });
  return {
    prev: idx < INSIGHTS.length - 1 ? toNav(INSIGHTS[idx + 1]) : null,
    next: idx > 0 ? toNav(INSIGHTS[idx - 1]) : null,
  };
};
