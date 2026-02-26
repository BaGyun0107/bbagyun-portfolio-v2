import Link from "next/link";
import { notFound } from "next/navigation";
import { FeatureService } from "@/lib/api/services/feature.service";
import { InsightService } from "@/lib/api/services/insight.service";

export const dynamic = 'force-dynamic';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownViewer } from "@/components/ui/MarkdownViewer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  BookOpen,
  GitBranch,
  Globe,
} from "lucide-react";

export default async function FeatureDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const feature = await FeatureService.getFeatureBySlug(slug);

  // Find related insights based on 1:N relationship
  const relatedInsights = feature
    ? (await InsightService.getAllInsights()).filter(
        (insight) => insight.featureSlug === slug
      )
    : [];

  if (!feature) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
      <div className="mb-8">
        <Link
          href="/projects"
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Features
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            {feature.title}
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <GitBranch className="mr-2 h-4 w-4" />
              View Repo
            </Button>
            <Button size="sm">
              <Globe className="mr-2 h-4 w-4" />
              Live Demo
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-4 text-sm text-muted-foreground">
          {feature.period && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">기간:</span>
              <span>{feature.period}</span>
            </div>
          )}
          {feature.team && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Team:</span>
              <span>{feature.team}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {feature.content ? (
            <MarkdownViewer content={feature.content} />
          ) : (
            <>
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold border-b pb-2">프로젝트 개요</h2>
                <MarkdownViewer content={feature.overview + "\n\n" + feature.description} />
              </section>
            </>
          )}
        </div>

        {/* Sidebar / Meta Info */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">기술</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {feature.techStack.map((t) => (
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
                인사이트
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {relatedInsights.length > 0 ? (
                relatedInsights.slice(0, 3).map((insight) => (
                  <Link
                    key={insight.id}
                    href={`/insights/${insight.slug}`}
                    className="block group"
                  >
                    <h4 className="font-medium text-sm group-hover:text-primary transition-colors mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {insight.excerpt}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Check out the blog for more engineering deep dives.
                </p>
              )}
              <Link
                href="/insights"
                className="text-xs text-primary hover:underline inline-block mt-2"
              >
                View all insights &rarr;
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
