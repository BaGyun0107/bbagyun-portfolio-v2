/**
 * 시스템 설정 정보에 대한 DTO 인터페이스
 */
export interface SystemSettingsDto {
  id: string;
  siteName: string;
  seoDescription: string;
  maintenanceMode: boolean;
  analyticsEnabled: boolean;
  apiVersion: string;
  updatedAt: Date | string;
}

/**
 * 시스템 설정 수정을 위한 DTO
 */
export type UpdateSystemSettingsDto = Partial<Omit<SystemSettingsDto, 'id' | 'updatedAt'>>;
