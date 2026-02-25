"use client";

import { useEffect, useRef, useState } from "react";
import { LogService } from "@/lib/api/services/log.service";
import { Button } from "@/components/ui/button";
import { RefreshCw, TerminalSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogTerminal() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    setIsRefreshing(true);
    try {
      const data = await LogService.getFileLogs(200);
      setLogs(data);
    } catch (e) {
      console.error(e);
      setLogs(["Failed to fetch log file."]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Auto refresh every 10 seconds
    const interval = setInterval(() => {
      fetchLogs();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Scroll to bottom when logs change
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // 단순 반복문 렌더링
  const renderLogLine = (line: string, index: number) => {
    const isError = line.includes("[error]") || line.includes("[API ERR]");
    const isWarn = line.includes("[warn]");
    
    return (
      <div 
        key={index} 
        className={cn(
          "font-mono text-xs break-all",
          isError ? "text-red-400" : isWarn ? "text-yellow-400" : "text-green-400"
        )}
      >
        {line}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[650px] rounded-md border border-zinc-800 bg-[#0c0c0c] overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-zinc-400">
          <TerminalSquare className="w-4 h-4" />
          <span className="text-xs font-medium font-mono">logs/combined.log</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={fetchLogs}
        >
          <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
        </Button>
      </div>
      <div 
        ref={terminalRef}
        className="flex-1 p-4 overflow-y-auto space-y-1"
      >
        {logs.length === 0 ? (
          <div className="text-zinc-600 font-mono text-xs italic">Loading logs...</div>
        ) : (
          logs.map((line, i) => renderLogLine(line, i))
        )}
      </div>
    </div>
  );
}
