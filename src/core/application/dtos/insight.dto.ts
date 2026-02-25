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
