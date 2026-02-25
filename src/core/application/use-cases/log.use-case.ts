import { ILogRepository } from "../../domain/repositories/log.repository";
import { LogDto, CreateLogDto } from "../dtos/log.dto";

/**
 * 시스템 로그(SystemLog)를 관리하는 Use Case 클래스입니다.
 */
export class LogUseCases {
  constructor(private readonly logRepository: ILogRepository) {}

  /**
   * 지정된 ID로 단일 시스템 로그를 조회합니다.
   * @param {string} id - 로그 ID
   * @returns {Promise<LogDto | null>} 조회된 시스템 로그 반환
   */

  async getLogById(id: string): Promise<LogDto | null> {
    return this.logRepository.findById(id);
  }

  /**
   * 최근 시스템 로그 목록을 조회합니다.
   * @returns {Promise<LogDto[]>} 시스템 로그 배열
   */
  async getAllLogs(): Promise<LogDto[]> {
    return this.logRepository.findAll();
  }

  /**
   * 새로운 시스템 로그를 생성 및 저장합니다.
   * @param {CreateLogDto} data - 저장할 로그 데이터
   * @returns {Promise<LogDto>} 저장된 시스템 로그 정보
   */
  async createLog(data: CreateLogDto): Promise<LogDto> {
    return this.logRepository.create(data);
  }

  /**
   * 오래된 시스템 로그를 삭제하여 정리합니다. 기본 보존 기간은 30일입니다.
   * @param {number} [daysToKeep=30] - 보존할 일수
   * @returns {Promise<number>} 삭제된 로그 개수
   */
  async cleanOldLogs(daysToKeep: number = 30): Promise<number> {
    return this.logRepository.deleteOldLogs(daysToKeep);
  }
}
