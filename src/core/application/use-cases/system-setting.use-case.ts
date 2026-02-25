import { ISystemSettingsRepository } from "../../domain/repositories/system-setting.repository";
import { SystemSettingsDto, UpdateSystemSettingsDto } from "../dtos/system-setting.dto";

/**
 * 시스템 설정(System Settings)을 처리하는 Use Case 클래스입니다.
 */
export class SystemSettingsUseCases {
  constructor(private readonly systemSettingsRepository: ISystemSettingsRepository) {}

  /**
   * 애플리케이션의 전역 시스템 설정을 조회합니다.
   * @returns {Promise<SystemSettingsDto | null>} 시스템 설정 정보
   */

  async getSettings(): Promise<SystemSettingsDto | null> {
    return this.systemSettingsRepository.getSettings();
  }

  /**
   * 애플리케이션 전역 시스템 설정을 업데이트(또는 생성)합니다.
   * @param {UpdateSystemSettingsDto} data - 변경할 설정 데이터
   * @returns {Promise<SystemSettingsDto>} 업데이트된 시스템 설정 
   */
  async updateSettings(data: UpdateSystemSettingsDto): Promise<SystemSettingsDto> {
    return this.systemSettingsRepository.updateSettings(data);
  }
}
