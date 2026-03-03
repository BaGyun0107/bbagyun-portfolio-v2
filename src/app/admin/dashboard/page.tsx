"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Activity, Users, AlertCircle, GitCommit, FileCode, CheckCircle2, UserPlus, LineChart, Loader2, Package } from "lucide-react";
import { DashboardService } from "@/lib/api/services/dashboard.service";
import { DashboardSummaryDto } from "@/core/application/dtos/dashboard.dto";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summary = await DashboardService.getSummary();
        setData(summary);
      } catch (error) {
        toast.error("대시보드 데이터를 불러오는데 실패했습니다.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        대시보드 데이터를 표시할 수 없습니다.
      </div>
    );
  }

  const { metrics, chartData, recentActivities } = data;

  const getIconForType = (type: string) => {
    switch (type) {
      case "FEATURE_CREATED":
        return { icon: CheckCircle2, color: "text-green-500" };
      case "FEATURE_UPDATED":
        return { icon: GitCommit, color: "text-purple-500" };
      case "INSIGHT_CREATED":
        return { icon: LineChart, color: "text-blue-500" };
      case "USER_CREATED":
        return { icon: UserPlus, color: "text-amber-500" };
      default:
        return { icon: FileCode, color: "text-zinc-500" };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">시스템 성능 및 개발 지표 개요</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">등록된 작업물</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalFeatures.value.toLocaleString()}개</div>
            <p className="text-xs text-muted-foreground">{metrics.totalFeatures.trend}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers.value.toLocaleString()}명</div>
            <p className="text-xs text-muted-foreground">{metrics.activeUsers.trend}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API 호출 (24시간)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.apiCalls24h.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{metrics.apiCalls24h.trend}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">에러율 (24시간)</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.errorRate.value}</div>
            <p className="text-xs text-muted-foreground">{metrics.errorRate.trend}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>시스템 API 부하 (최근 7일)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorApi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Area type="monotone" dataKey="api" stroke="#8884d8" fillOpacity={1} fill="url(#colorApi)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>최근 주요 활동</CardTitle>
            <div className="text-sm text-muted-foreground">
              최신 시스템 도메인 등록 및 수정 현황
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentActivities.map((item) => {
                const { icon: ActivityIcon, color } = getIconForType(item.type);
                return (
                  <div key={item.id} className="flex items-center">
                    <div className={`h-9 w-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center`}>
                      <ActivityIcon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{item.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={item.detail}>{item.detail}</p>
                    </div>
                    <div className="ml-auto font-medium text-sm text-right min-w-[60px]">
                      {item.status}
                      <div className="text-xs text-muted-foreground font-normal">{item.time}</div>
                    </div>
                  </div>
                );
              })}
              {recentActivities.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  최근 활동 내역이 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
