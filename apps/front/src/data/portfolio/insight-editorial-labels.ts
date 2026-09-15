import type { InsightType } from './types/insight.dto';

export const INSIGHT_TYPE_LABELS = {
  'project-case': '프로젝트 사례형',
  'technical-exploration': '기술 탐구형'
} as const satisfies Readonly<Record<InsightType, string>>;
