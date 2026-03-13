import Link from "next/link";
import { notFound } from "next/navigation";
import { InsightService } from "@/lib/api/services/insight.service";

export const dynamic = 'force-dynamic';
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import { MarkdownViewer } from "@/components/ui/MarkdownViewer";
import { InlineMarkdown } from "@/components/ui/InlineMarkdown";
import { ShareButton } from "@/components/ui/ShareButton";

export default async function InsightDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const insight = await InsightService.getInsightBySlug(slug);

  if (!insight) {
    notFound();
  }

  const { prev, next } = await InsightService.getInsightNavigation(slug);

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-3xl">
      <Link 
        href="/insights" 
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Insights
      </Link>

      <article className="space-y-8">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {insight.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            {insight.title}
          </h1>

          <div className="flex items-center gap-6 text-sm text-muted-foreground border-b pb-8">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(insight.date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {insight.readTime}
            </span>
          </div>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <InlineMarkdown content={insight.excerpt} className="text-xl leading-relaxed text-muted-foreground block" />
          <div className="my-8 h-px bg-zinc-200 dark:bg-zinc-800" />
          
          <MarkdownViewer content={insight.content} />
        </div>

        <div className="pt-8 border-t mt-12">
          <div className="flex justify-between items-center mb-12">
             <div className="text-sm text-muted-foreground">
               Thanks for reading!
             </div>
             <ShareButton />
          </div>

          {/* Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-8">
            {prev ? (
              <Link
                href={`/insights/${prev.slug}`}
                className="group flex flex-col items-start gap-2 p-4 rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  <ArrowLeft className="mr-2 h-4 w-4" /> 이전글
                </div>
                <div className="font-semibold line-clamp-2">{prev.title}</div>
              </Link>
            ) : (
              <div />
            )}
            
            {next ? (
              <Link
                href={`/insights/${next.slug}`}
                className="group flex flex-col items-end gap-2 p-4 rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-right md:-col-start-auto"
              >
                <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  다음글 <ArrowRight className="ml-2 h-4 w-4" />
                </div>
                <div className="font-semibold line-clamp-2">{next.title}</div>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
