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
  async getRecentLogs(limit: number = 50, pathQuery?: string, options?: { useMock?: boolean }): Promise<LogDto[]> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      // 목업의 최신 로그 반환 (실제로는 정렬되어 있다고 가정)
      return MOCK_LOGS.slice(0, limit);
    }
    // api() 래퍼는 이미 response.data를 언래핑하여 반환합니다.
    const searchParams = new URLSearchParams({ limit: limit.toString() });
    if (pathQuery) searchParams.append("path", pathQuery);
    return api.get<LogDto[]>(`/logs?${searchParams.toString()}`);
  }
};
