/**
 * 로그 요청 메서드 구분
 */
export type LogMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";

/**
 * 새로운 로그 기록 생성을 위한 DTO
 */
export type CreateLogDto = Omit<LogDto, 'id' | 'timestamp'>;

/**
 * 단일 로그 정보에 대한 DTO 인터페이스
 */
export interface LogDto {
  id: string;
  method: LogMethod;
  path: string;
  status: number;
  latency: number;
  requestData?: string;
  responseData?: string;
  errorMessage?: string;
  timestamp: Date | string;
}
