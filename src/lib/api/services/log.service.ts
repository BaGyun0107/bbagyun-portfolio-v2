import { api } from "../fetcher";
import { API_CONFIG } from "../config";
import { LogDto } from "@/core/application/dtos/log.dto";
import { MOCK_LOGS } from "@/data/mock";

/**
 * 접속 로그 (System Log) 도메인 API 서비스
 */
export const LogService = {
  /**
   * 전체 접속 로그 목록을 조회합니다.
   */
  async getRecentLogs(limit: number = 50, options?: { useMock?: boolean }): Promise<LogDto[]> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      // 목업의 최신 로그 반환 (실제로는 정렬되어 있다고 가정)
      return MOCK_LOGS.slice(0, limit);
    }
    return api.get<LogDto[]>(`/logs?limit=${limit}`);
  },

  /**
   * 서버 파일 기반 시스템 실시간 로그(combined.log) 배열을 반환합니다.
   * @param lines 가져올 마지막 라인 수 (기본 200)
   */
  async getFileLogs(lines: number = 200, options?: { useMock?: boolean }): Promise<string[]> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return [
        "2023-10-25 10:00:00 [info]: [API REQ] GET /api/v1/features",
        "2023-10-25 10:00:05 [info]: [API REQ] GET /api/v1/insights",
        "2023-10-25 10:01:00 [error]: [API ERR] POST /api/v1/auth/login {\"error\":\"Invalid credentials\"}",
      ];
    }
    const response = await api.get<{ logs: string[] }>(`/api/v1/logs/file?lines=${lines}`);
    return response.logs;
  }
};
