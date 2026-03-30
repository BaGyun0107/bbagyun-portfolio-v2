import { Loader2 } from "lucide-react";

export function GlobalLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground animate-in fade-in duration-500">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm font-medium tracking-wider animate-pulse">
        데이터를 불러오는 중입니다...
      </p>
    </div>
  );
}
