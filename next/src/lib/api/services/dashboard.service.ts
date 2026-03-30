import { api } from "../fetcher";
import { API_CONFIG } from "../config";
import { DashboardSummaryDto } from "@/core/application/dtos/dashboard.dto";

/**
 * 대시보드 통계 및 요약(System Dashboard) API 서비스
 */
export const DashboardService = {
  /**
   * 전체 대시보드 요약 정보를 조회합니다.
   */
  async getSummary(options?: { useMock?: boolean }): Promise<DashboardSummaryDto> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        metrics: {
          totalFeatures: { value: 25, trend: "전체 누적" },
          activeUsers: { value: 12, trend: "전월 대비 동일" },
          apiCalls24h: { value: 432, trend: "+5% 어제 대비" },
          errorRate: { value: "0.04%", trend: "-0.01% 개선됨" },
        },
        chartData: [
          { name: "월", api: 400 },
          { name: "화", api: 300 },
          { name: "수", api: 550 },
          { name: "목", api: 450 },
          { name: "금", api: 600 },
          { name: "토", api: 200 },
          { name: "일", api: 100 },
        ],
        recentActivities: [
          {
            id: "1",
            type: "FEATURE_CREATED",
            name: "작업물 등록됨",
            detail: "호텔 예약 시스템 v2",
            status: "성공",
            time: "10분 전",
            timestamp: Date.now() - 1000 * 60 * 10
          },
          {
            id: "2",
            type: "INSIGHT_CREATED",
            name: "인사이트 발행",
            detail: "Next.js 서버 컴포넌트",
            status: "대기",
            time: "2시간 전",
            timestamp: Date.now() - 1000 * 60 * 60 * 2
          },
          {
            id: "3",
            type: "USER_CREATED",
            name: "새 사용자 가입",
            detail: "test_viewer@example.com",
            status: "성공",
            time: "1일 전",
            timestamp: Date.now() - 1000 * 60 * 60 * 24
          }
        ]
      };
    }
    return api.get<DashboardSummaryDto>('/dashboard/summary');
  }
};
