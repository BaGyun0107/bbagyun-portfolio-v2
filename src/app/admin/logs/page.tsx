"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, ShieldAlert, Copy, CheckCircle2, HelpCircle, Search, Filter, RefreshCw, Database } from "lucide-react";
import { LogService } from "@/lib/api/services/log.service";
import { LogDto } from "@/core/application/dtos/log.dto";
import { cn } from "@/lib/utils";

function JsonViewerBlock({ title, data, isError = false }: { title: string, data?: string, isError?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (data) {
      const textToCopy = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatJson = (dataStr?: string) => {
    if (!dataStr) return "데이터 없음";
    let formatted = dataStr;
    try {
      const parsed = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
      formatted = JSON.stringify(parsed, null, 2);
    } catch {
      return formatted;
    }

    const escapeHtml = (unsafe: string) => unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const htmlSafe = escapeHtml(formatted);
    const jsonRegex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;
    
    const highlighted = htmlSafe.replace(jsonRegex, (match) => {
      let cls = 'text-amber-400'; 
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-[#2dd4bf]'; // teal-400 (키)
          const keyStr = match.substring(0, match.length - 1);
          return `<span class="${cls}">${keyStr}</span><span class="text-slate-400">:</span>`;
        } else {
          cls = 'text-[#fbbf24]'; // amber-400 (문자열 값)
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-slate-300'; // boolean
      } else if (/null/.test(match)) {
        cls = 'text-slate-500'; // null
      } else {
        cls = 'text-[#fb7185]'; // rose-400 (숫자)
      }
      return `<span class="${cls}">${match}</span>`;
    });

    return highlighted;
  };

  return (
    <div className={cn(
      "flex flex-col rounded-lg overflow-hidden font-mono text-sm", "border border-slate-800"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3 border-b", "bg-[#1e293b] border-slate-700/50"
      )}>
        <span className={cn("text-[13px] font-semibold", "text-slate-200")}>
          {title}
        </span>
        <div className="flex items-center gap-3 text-slate-400">
          <button onClick={handleCopy} className="hover:text-slate-200 transition-colors" title="복사">
            {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {/* Body */}
      <div className={cn(
        "p-4 overflow-auto max-h-[35vh]", "bg-[#0b162c]"
      )}>
        <pre 
          className="text-[13px] leading-[1.6] text-slate-300 whitespace-pre-wrap word-break-all"
          dangerouslySetInnerHTML={{ __html: formatJson(data) }} 
        />
      </div>
    </div>
  );
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogDto[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogDto | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    refreshLogs();
  }, []);

  const refreshLogs = async (query = searchQuery) => {
    setIsRotating(true);
    try {
      const data = await LogService.getRecentLogs(200, query); // 200개 단위 로드
      setLogs(data);
      if (data.length > 0 && (!selectedLog || !data.find(l => l.id === selectedLog.id))) {
        setSelectedLog(data[0]);
      } else if (data.length === 0) {
        setSelectedLog(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">시스템 로그</h1>
          <p className="text-muted-foreground">API 요청 및 시스템 이벤트의 실시간 검사.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refreshLogs()}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isRotating && "animate-spin")} />
            새로고침
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 mt-4">
        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="로그 경로 검색..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    refreshLogs(searchQuery);
                  }
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="text-sm text-muted-foreground ml-2">
              최근 {logs.length}개 항목 표시 중
            </div>
          </div>

          <div className="flex-1 flex gap-4 min-h-0">
            {/* Left Pane: Log List */}
            <Card className="w-[380px] flex-shrink-0 flex flex-col overflow-hidden border-zinc-200 dark:border-zinc-800">
              <div className="rounded-t-md border-b bg-zinc-100 dark:bg-zinc-900/50 p-3 font-mono text-xs text-muted-foreground grid grid-cols-12 gap-2 flex-shrink-0">
                <div className="col-span-3">시간</div>
                <div className="col-span-2">메서드</div>
                <div className="col-span-5">경로</div>
                <div className="col-span-2 text-right">상태</div>
              </div>
              <div className="flex-1 overflow-auto divide-y">
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    className={cn(
                      "grid grid-cols-12 gap-2 p-3 text-sm font-mono cursor-pointer transition-colors items-center",
                      selectedLog?.id === log.id 
                        ? "bg-accent text-accent-foreground" 
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                    )}
                  >
                    <div className="col-span-3 text-muted-foreground text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="col-span-2">
                      <Badge variant="outline" className="font-normal text-[10px] h-5 px-1 truncate max-w-full">
                        {log.method}
                      </Badge>
                    </div>
                    <div className="col-span-5 truncate text-xs" title={log.path}>
                      {log.path}
                    </div>
                    <div className="col-span-2 text-right flex justify-end">
                      <span className={cn(
                        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                        log.status >= 200 && log.status < 300 && "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/20",
                        log.status >= 400 && log.status < 500 && "bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-500 dark:ring-yellow-500/20",
                        log.status >= 500 && "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-500/20",
                      )}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    로그 기록이 없습니다.
                  </div>
                )}
              </div>
            </Card>

            {/* Right Pane: Log Detail */}
            <Card className="flex-1 flex flex-col overflow-hidden border-zinc-200 dark:border-zinc-800">
              {selectedLog ? (
                <>
                  <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-900/30 flex-shrink-0 space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge className={cn(
                          "px-2 py-1",
                          selectedLog.method === "GET" && "bg-blue-500 hover:bg-blue-600",
                          selectedLog.method === "POST" && "bg-green-500 hover:bg-green-600",
                          selectedLog.method === "PUT" && "bg-orange-500 hover:bg-orange-600",
                          selectedLog.method === "DELETE" && "bg-red-500 hover:bg-red-600",
                      )}>
                        {selectedLog.method}
                      </Badge>
                      <span className="font-mono font-medium">{selectedLog.path}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                      <div className="flex items-center gap-1">
                         <span className={cn(
                           "font-bold",
                           selectedLog.status >= 400 ? "text-red-500" : "text-green-500"
                         )}>
                           {selectedLog.status} {(selectedLog.status >= 400 && selectedLog.errorMessage) ? `(${selectedLog.errorMessage})` : "OK"}
                         </span>
                      </div>
                      <div>•</div>
                      <div>{new Date(selectedLog.timestamp).toLocaleString()}</div>
                      <div>•</div>
                      <div>{selectedLog.latency}ms</div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto p-4 space-y-6">
                    <JsonViewerBlock 
                      title="요청 (Request)" 
                      data={selectedLog.requestData} 
                    />
                    
                    <JsonViewerBlock 
                      title="응답 (Response)" 
                      data={selectedLog.responseData} 
                      isError={selectedLog.status >= 400}
                    />
                  </div>
                </>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <Database className="h-12 w-12 mb-4 opacity-20" />
                  <p>목록에서 로그를 선택하면 상세 정보가 표시됩니다.</p>
                </div>
              )}
            </Card>
        </div>
      </div>
    </div>
  );
}
