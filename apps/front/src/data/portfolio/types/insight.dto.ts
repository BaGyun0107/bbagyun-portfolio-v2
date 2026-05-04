/**
 * 인사이트 정보에 대한 DTO 인터페이스
 */
export interface InsightDto {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: Date | string;
  /**
   * 참고: Prisma SQLite에서는 JSON 문자열로 저장되지만,
   * DTO에서는 배열 형태로 표현 및 반환됩니다.
   */
  tags: string[];
  readTime: string;
  featureSlug?: string | null;
  studySlug?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * 새로운 인사이트 생성을 위한 DTO
 */
export type CreateInsightDto = Omit<InsightDto, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 기존 인사이트 수정을 위한 DTO
 */
export type UpdateInsightDto = Partial<CreateInsightDto>;

/**
 * 인사이트 이전글, 다음글 네비게이션을 위한 DTO
 */
export interface InsightNavigationDto {
  slug: string;
  title: string;
}

/**
 * 인사이트 연도별 아카이브 데이터를 위한 DTO
 */
export interface InsightArchiveDto {
  year: string;
  insights: Pick<InsightDto, 'id' | 'slug' | 'title' | 'date' | 'tags'>[];
}

/**
 * 인사이트 태그 클라우드를 위한 DTO
 */
export interface InsightTagDto {
  tag: string;
  count: number;
}
