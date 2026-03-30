import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FeatureService } from "@/lib/api/services/feature.service";
import { InlineMarkdown } from "@/components/ui/InlineMarkdown";

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const FEATURES = await FeatureService.getAllFeatures();
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
      <div className="mb-12 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">작업물</h1>
        <p className="text-xl font-medium text-zinc-600 dark:text-zinc-400 max-w-2xl">
          단순한 기능 구현을 넘어, 견고한 아키텍처로 비즈니스 문제를 해결한 실무 프로젝트 기록입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((feature) => (
          <div key={feature.id}>
            <Link href={`/projects/${feature.slug}`} className="block h-full group">
              <Card className="h-full border-zinc-200 dark:border-zinc-800 transition-all duration-200 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md flex flex-col p-6 gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-xl group-hover:text-primary transition-colors flex items-center gap-2 mb-1.5">
                      {feature.title}
                    </h3>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      {feature.period && <span>{feature.period}</span>}
                      {feature.team && <span>{feature.team}</span>}
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <InlineMarkdown content={feature.description} className="text-sm text-muted-foreground leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all" />

                <div className="mt-auto pt-2 flex flex-wrap gap-1.5">
                  {feature.techStack.map(tech => (
                    <span key={tech} className="text-xs text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                      {tech}
                    </span>
                  ))}
                </div>
              </Card>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
