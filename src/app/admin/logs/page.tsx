"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter, RefreshCw, Terminal, Database } from "lucide-react";
import { LogService } from "@/lib/api/services/log.service";
import { LogDto } from "@/core/application/dtos/log.dto";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogTerminal } from "@/components/admin/logs/LogTerminal";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogDto[]>([]);
  const [isRotating, setIsRotating] = useState(false);

  // 컴포넌트 마운트 시 최초 1회 로그 로드
  useEffect(() => {
    refreshLogs();
  }, []);

  const refreshLogs = async () => {
    setIsRotating(true);
    try {
      const data = await LogService.getRecentLogs(50);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">시스템 로그</h1>
          <p className="text-muted-foreground">API 요청 및 시스템 이벤트의 실시간 검사.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshLogs}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isRotating && "animate-spin")} />
            새로고침
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> 필터
          </Button>
        </div>
      </div>

      <Tabs defaultValue="terminal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="terminal" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            실시간 터미널 (File)
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            감사 및 에러 기록 (DB)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terminal" className="m-0">
          <LogTerminal />
        </TabsContent>

        <TabsContent value="database" className="m-0 space-y-4">
          <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="로그 검색..." 
            className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800">
        <div className="rounded-md border-b bg-zinc-100 dark:bg-zinc-900/50 p-4 font-mono text-xs text-muted-foreground grid grid-cols-12 gap-4">
          <div className="col-span-2">시간</div>
          <div className="col-span-1">메서드</div>
          <div className="col-span-1">상태</div>
          <div className="col-span-6">경로</div>
          <div className="col-span-2 text-right">지연 시간</div>
        </div>
        <div className="divide-y max-h-[600px] overflow-auto">
          {logs.map((log) => (
            <div key={log.id} className="grid grid-cols-12 gap-4 p-4 text-sm font-mono hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors items-center">
              <div className="col-span-2 text-muted-foreground text-xs">
                {new Date(log.timestamp).toLocaleTimeString()}
              </div>
              <div className="col-span-1">
                <Badge variant="outline" className="font-normal text-[10px] h-5">
                  {log.method}
                </Badge>
              </div>
              <div className="col-span-1">
                <span className={cn(
                  "inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                  log.status >= 200 && log.status < 300 && "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/20",
                  log.status >= 400 && log.status < 500 && "bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-500 dark:ring-yellow-500/20",
                  log.status >= 500 && "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-500/20",
                )}>
                  {log.status}
                </span>
              </div>
              <div className="col-span-6 truncate text-zinc-700 dark:text-zinc-300">
                {log.path}
              </div>
              <div className="col-span-2 text-right text-muted-foreground text-xs">
                {log.latency}ms
              </div>
            </div>
          ))}
        </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
