/**
 * Study 파트의 카테고리 정의
 */
export type StudyCategory = "Frontend" | "Backend" | "Architecture" | "CS" | "Etc";

/**
 * Study 파트의 상태 정의
 */
export type StudyStatus = "Draft" | "Published" | "Archived";

/**
 * Study 정보에 대한 DTO 인터페이스
 */
export interface StudyDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  iconName: string;
  category: StudyCategory;
  /**
   * Prisma SQLite에서는 JSON 문자열로 저장되지만,
   * DTO에서는 배열 형태로 표현 및 반환됩니다.
   */
  techStack: string[];
  status: StudyStatus;
  overview: string;
  period?: string;
  content?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * 새로운 Study 단건 생성을 위한 DTO
 */
export type CreateStudyDto = Omit<StudyDto, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 기존 Study 수정을 위한 DTO
 */
export type UpdateStudyDto = Partial<CreateStudyDto>;
