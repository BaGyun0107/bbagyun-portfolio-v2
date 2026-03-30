import { prisma } from "@/infrastructure/config/prisma";
import { DashboardSummaryDto } from "../dtos/dashboard.dto";

export class DashboardUseCases {
  async getSummary(): Promise<DashboardSummaryDto> {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. 활성 사용자 및 작업물 수
    const activeUsersCount = await prisma.user.count({
      where: { status: "Active" }
    });
    
    const totalFeaturesCount = await prisma.feature.count();

    // 2. 24시간 내 API 호출 통계
    const logs24h = await prisma.log.findMany({
      where: { timestamp: { gte: twentyFourHoursAgo } },
      select: { status: true }
    });

    const totalCalls24h = logs24h.length;
    const errorCalls24h = logs24h.filter(log => log.status >= 400).length;
    const errorRate24h = totalCalls24h > 0 ? (errorCalls24h / totalCalls24h) * 100 : 0;
    
    // 3. 차트 데이터 (최근 7일 일별 API 호출 수)
    const logs7d = await prisma.log.findMany({
      where: { timestamp: { gte: sevenDaysAgo } },
      select: { timestamp: true }
    });

    // Group by day Name (e.g. 월, 화, 수)
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const chartDataMap: Record<string, number> = {};
    
    // Initialize last 7 days keys
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const k = `${d.getMonth()+1}/${d.getDate()} (${dayNames[d.getDay()]})`;
        chartDataMap[k] = 0;
    }

    logs7d.forEach(log => {
      const d = log.timestamp;
      const k = `${d.getMonth()+1}/${d.getDate()} (${dayNames[d.getDay()]})`;
      if (chartDataMap[k] !== undefined) {
         chartDataMap[k]++;
      }
    });

    const chartData = Object.keys(chartDataMap).map(key => ({
      name: key,
      api: chartDataMap[key]
    }));

    // 4. 최근 활동 내역 가져오기 (시간 역순)
    const recentActivities: DashboardSummaryDto["recentActivities"] = [];

    // 최근 작업물
    const recentFeatures = await prisma.feature.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5
    });
    recentFeatures.forEach(f => {
      recentActivities.push({
        id: `feat-${f.id}`,
        type: f.createdAt.getTime() === f.updatedAt.getTime() ? "FEATURE_CREATED" : "FEATURE_UPDATED",
        name: f.createdAt.getTime() === f.updatedAt.getTime() ? "작업물 등록됨" : "작업물 수정됨",
        detail: f.title,
        status: "성공",
        time: this.timeAgo(f.updatedAt),
        timestamp: f.updatedAt.getTime()
      });
    });

    // 최근 인사이트
    const recentInsights = await prisma.insight.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    recentInsights.forEach(i => {
      recentActivities.push({
        id: `ins-${i.id}`,
        type: "INSIGHT_CREATED",
        name: "인사이트 등록됨",
        detail: i.title,
        status: "성공",
        time: this.timeAgo(i.createdAt),
        timestamp: i.createdAt.getTime()
      });
    });

    // 최근 생성된 유저
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3
    });
    recentUsers.forEach(u => {
      recentActivities.push({
        id: `user-${u.id}`,
        type: "USER_CREATED",
        name: "새 사용자 가입",
        detail: `${u.name} (${u.role})`,
        status: "성공",
        time: this.timeAgo(u.createdAt),
        timestamp: u.createdAt.getTime()
      });
    });

    // 최신순 정렬 및 상위 7개 추출
    recentActivities.sort((a, b) => b.timestamp - a.timestamp);
    const topActivities = recentActivities.slice(0, 7);

    return {
      metrics: {
        totalFeatures: { value: totalFeaturesCount, trend: "전체 누적" },
        activeUsers: { value: activeUsersCount, trend: "활성 상태" },
        apiCalls24h: { value: totalCalls24h, trend: "최근 24시간" },
        errorRate: { value: `${errorRate24h.toFixed(2)}%`, trend: "최근 24시간" }
      },
      chartData,
      recentActivities: topActivities
    };
  }

  private timeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "년 전";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "달 전";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "일 전";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "시간 전";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "분 전";
    return Math.floor(seconds) + "초 전";
  }
}
