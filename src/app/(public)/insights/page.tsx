import Link from "next/link";
import { ArrowUpRight, Calendar, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InlineMarkdown } from "@/components/ui/InlineMarkdown";
import { InsightService } from "@/lib/api/services/insight.service";

export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  const INSIGHTS = await InsightService.getAllInsights();
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">인사이트</h1>
        <p className="text-xl font-medium text-zinc-600 dark:text-zinc-400">
          '어떻게'보다 '왜'에 집중하며, 아키텍처 설계 과정의 트레이드오프를 조율한 기술 회고입니다.
        </p>
      </div>

      <div className="space-y-6">
        {INSIGHTS.map((insight) => (
          <Link key={insight.id} href={`/insights/${insight.slug}`} className="block group">
            <Card className="border-transparent bg-transparent shadow-none hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
              <CardContent className="p-6 md:p-8 border-b group-hover:border-transparent">
                <div className="flex flex-col md:flex-row gap-4 md:items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(insight.date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {insight.readTime}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold group-hover:text-primary transition-colors flex items-center gap-2">
                      {insight.title}
                    </h2>
                    <InlineMarkdown content={insight.excerpt} className="text-muted-foreground leading-relaxed max-w-2xl" />
                    <div className="flex gap-2 pt-2">
                      {insight.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="font-normal">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="hidden md:block opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary">
                    <ArrowUpRight className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
