import { SystemSettingsDto, UpdateSystemSettingsDto } from "../../application/dtos/system-setting.dto";

/**
 * 전역 시스템 설정(System Settings) 데이터베이스 접근을 추상화한 Repository 인터페이스입니다.
 */
export interface ISystemSettingsRepository {
  /** 시스템 설정 조회 */
  getSettings(): Promise<SystemSettingsDto | null>;
  /** 시스템 설정 업데이트 (또는 없을 시 등록) */
  updateSettings(data: UpdateSystemSettingsDto): Promise<SystemSettingsDto>;
}
