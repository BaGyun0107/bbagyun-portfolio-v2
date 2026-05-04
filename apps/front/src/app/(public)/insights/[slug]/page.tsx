import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllInsights,
  getInsightBySlug,
  getInsightNavigation,
  getFeatureBySlug,
  getStudyBySlug,
} from "@/data/portfolio";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Calendar, Clock, Briefcase, BookOpen } from "lucide-react";
import { MarkdownViewer } from "@/components/ui/MarkdownViewer";
import { InlineMarkdown } from "@/components/ui/InlineMarkdown";
import { ShareButton } from "@/components/ui/ShareButton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function generateStaticParams() {
  return getAllInsights().map((i) => ({ slug: i.slug }));
}

export default async function InsightDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const insight = getInsightBySlug(slug);

  if (!insight) {
    notFound();
  }

  const { prev, next } = getInsightNavigation(slug);

  const relatedFeature = insight.featureSlug ? getFeatureBySlug(insight.featureSlug) : null;
  const relatedStudy = insight.studySlug ? getStudyBySlug(insight.studySlug) : null;
  
  const hasSidebar = !!(relatedFeature || relatedStudy);

  return (
    <div className={`container mx-auto px-4 py-8 md:py-12 ${hasSidebar ? 'max-w-7xl' : 'max-w-3xl'}`}>
      <Link 
        href="/insights" 
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Insights
      </Link>

      <div className={hasSidebar ? "grid grid-cols-1 lg:grid-cols-3 gap-10" : "block"}>
        <div className={hasSidebar ? "lg:col-span-2 space-y-8" : "space-y-8"}>
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

        {/* Sidebar */}
        {hasSidebar && (
          <div className="space-y-8">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  연관된 기록
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {relatedFeature && (
                  <Link href={`/projects/${relatedFeature.slug}`} className="block group p-3 rounded-lg border bg-background hover:bg-muted/50 hover:border-primary/50 transition-colors">
                    <div className="flex items-center text-xs font-medium text-primary mb-1">
                      <Briefcase className="mr-1.5 h-3.5 w-3.5" /> 작업물
                    </div>
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                      {relatedFeature.title}
                    </h4>
                  </Link>
                )}
                {relatedStudy && (
                  <Link href={`/study/${relatedStudy.slug}`} className="block group p-3 rounded-lg border bg-background hover:bg-muted/50 hover:border-primary/50 transition-colors">
                    <div className="flex items-center text-xs font-medium text-primary mb-1">
                      <BookOpen className="mr-1.5 h-3.5 w-3.5" /> 공부 기록
                    </div>
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                      {relatedStudy.title}
                    </h4>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
