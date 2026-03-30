import Link from "next/link";
import { InsightService } from "@/lib/api/services/insight.service";

export const dynamic = 'force-dynamic';

export default async function InsightsArchivePage() {
  const archives = await InsightService.getInsightArchive();

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">아카이브</h1>
        <p className="text-xl font-medium text-zinc-600 dark:text-zinc-400">
          기록된 모든 인사이트를 연도별로 확인하세요.
        </p>
      </div>

      <div className="space-y-16">
        {archives.map((group) => (
          <section key={group.year} className="space-y-6">
            <h2 className="text-3xl font-bold border-b pb-4">{group.year}</h2>
            <ul className="space-y-4">
              {group.insights.map((insight) => {
                const dateObj = new Date(insight.date);
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                const dd = String(dateObj.getDate()).padStart(2, '0');
                
                return (
                  <li key={insight.id} className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 group">
                    <span className="text-zinc-500 font-mono text-sm sm:text-base min-w-[6rem]">
                      {mm}월 {dd}일
                    </span>
                    <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">-</span>
                    <Link 
                      href={`/insights/${insight.slug}`} 
                      className="text-lg font-medium group-hover:text-primary transition-colors hover:underline underline-offset-4"
                    >
                      {insight.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {archives.length === 0 && (
          <p className="text-muted-foreground pt-8 text-center">아카이브된 인사이트가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
