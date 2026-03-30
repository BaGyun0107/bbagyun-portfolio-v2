import { LogDto, CreateLogDto } from "../../application/dtos/log.dto";

/**
 * 시스템 로그(SystemLog) 데이터베이스 접근을 추상화한 Repository 인터페이스입니다.
 */
export interface ILogRepository {
  /** 지정된 ID로 로그 조회 */
  findById(id: string): Promise<LogDto | null>;
  /** 전체 로그 목록 조회 */
  findAll(searchParams?: { path?: string, limit?: number }): Promise<LogDto[]>;
  /** 새로운 로그 생성 */
  create(data: CreateLogDto): Promise<LogDto>;
  /**
   * 지정된 보존 기한이 지난 오래된 로그 제거
   * @param {number} daysToKeep - 남겨둘 최근 일수
   * @returns {Promise<number>} 삭제된 로그 개수
   */
  deleteOldLogs(daysToKeep: number): Promise<number>; 
}
