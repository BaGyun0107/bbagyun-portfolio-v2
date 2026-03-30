export interface DashboardSummaryDto {
  metrics: {
    totalFeatures: { value: number; trend: string };
    activeUsers: { value: number; trend: string };
    apiCalls24h: { value: number; trend: string };
    errorRate: { value: string; trend: string };
  };
  chartData: { name: string; api: number }[];
  recentActivities: {
    id: string;
    type: "FEATURE_CREATED" | "FEATURE_UPDATED" | "INSIGHT_CREATED" | "USER_CREATED";
    name: string;
    detail: string;
    status: "성공" | "대기" | "실패";
    time: string;
    timestamp: number; // For sorting
  }[];
}
