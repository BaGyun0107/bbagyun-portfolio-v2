import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllStudies, getStudyBySlug, getAllInsights } from "@/data/portfolio";
import { Badge } from "@/components/ui/badge";
import { MarkdownViewer } from "@/components/ui/MarkdownViewer";
import { InlineMarkdown } from "@/components/ui/InlineMarkdown";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  BookOpen,
} from "lucide-react";

export function generateStaticParams() {
  return getAllStudies().map((s) => ({ slug: s.slug }));
}

export default async function StudyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = getStudyBySlug(slug);

  if (!study) {
    notFound();
  }

  const relatedInsights = getAllInsights().filter(
    (insight) => insight.studySlug === slug,
  );

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
      <div className="mb-8">
        <Link
          href="/study"
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> 뒤로가기
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            {study.title}
          </h1>
        </div>
        <div className="flex flex-col gap-2 mt-4 text-sm text-muted-foreground">
          {study.period && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">기간:</span>
              <span>{study.period}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">카테고리:</span>
            <span>{study.category}</span>
          </div>
        </div>
        
        {/* Description / Summary */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg border-l-4 border-primary/50 text-muted-foreground">
          <InlineMarkdown content={study.description} className="text-sm leading-relaxed" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {study.content ? (
            <div className="mt-4">
              <MarkdownViewer content={study.content} />
            </div>
          ) : (
            <>
              <section className="space-y-4 mt-4">
                <h2 className="text-2xl font-semibold border-b pb-2">학습 개요</h2>
                <MarkdownViewer content={study.overview || "내용이 없습니다."} />
              </section>
            </>
          )}
        </div>

        {/* Sidebar / Meta Info */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">기술 스택 및 키워드</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {study.techStack.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Related Insights (Sidebar) */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg text-primary flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                관련된 인사이트
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {relatedInsights.length > 0 ? (
                relatedInsights.slice(0, 4).map((insight) => (
                  <Link
                    key={insight.id}
                    href={`/insights/${insight.slug}`}
                    className="block group"
                  >
                    <h4 className="font-medium text-sm group-hover:text-primary transition-colors mb-1">
                      {insight.title}
                    </h4>
                    <InlineMarkdown content={insight.excerpt} className="text-xs text-muted-foreground line-clamp-2" />
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  작성된 기술 블로그(인사이트) 글이 없습니다.
                </p>
              )}
              <Link
                href="/insights"
                className="text-xs text-primary hover:underline inline-block mt-2"
              >
                모든 인사이트 보기 &rarr;
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
