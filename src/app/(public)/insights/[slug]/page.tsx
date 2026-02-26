import Link from "next/link";
import { notFound } from "next/navigation";
import { InsightService } from "@/lib/api/services/insight.service";

export const dynamic = 'force-dynamic';
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { MarkdownViewer } from "@/components/ui/MarkdownViewer";
import { ShareButton } from "@/components/ui/ShareButton";


export default async function InsightDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const insight = await InsightService.getInsightBySlug(slug);

  if (!insight) {
    notFound();
  }

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
          <p className="text-xl leading-relaxed text-muted-foreground">
            {insight.excerpt}
          </p>
          <div className="my-8 h-px bg-zinc-200 dark:bg-zinc-800" />
          
          <MarkdownViewer content={insight.content} />
        </div>

        <div className="pt-8 border-t mt-12">
          <div className="flex justify-between items-center">
             <div className="text-sm text-muted-foreground">
               Thanks for reading!
             </div>
             <ShareButton />
          </div>
        </div>
      </article>
    </div>
  );
}
