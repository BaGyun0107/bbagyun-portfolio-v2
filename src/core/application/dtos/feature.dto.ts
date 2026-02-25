/**
 * 기능 파트의 카테고리 정의
 */
export type FeatureCategory = "Backend" | "Frontend" | "DevOps";

/**
 * 기능 파트의 상태 정의
 */
export type FeatureStatus = "Production" | "Beta" | "Archived";

/**
 * 기능(Feature) 정보에 대한 DTO 인터페이스
 */
export interface FeatureDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  iconName: string;
  category: FeatureCategory;
  /**
   * 참고: Prisma SQLite에서는 JSON 문자열로 저장되지만,
   * DTO에서는 배열 형태로 표현 및 반환됩니다.
   */
  techStack: string[];
  status: FeatureStatus;
  apiCount: number;
  overview: string;
  diagramUrl?: string;
  period?: string;
  version?: string;
  team?: string;
  content?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * 새로운 기능(Feature) 생성을 위한 DTO
 */
export type CreateFeatureDto = Omit<FeatureDto, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 기존 기능(Feature) 수정을 위한 DTO
 */
export type UpdateFeatureDto = Partial<CreateFeatureDto>;
