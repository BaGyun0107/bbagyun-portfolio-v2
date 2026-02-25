import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeatureService } from "@/lib/api/services/feature.service";

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const FEATURES = await FeatureService.getAllFeatures();
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
      <div className="mb-12 space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">작업물</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          제가 설계한 프로덕션 수준의 시스템과 컴포넌트 모음입니다.
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>2024.07 ~ 2024.11</span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span>BackEnd ( 본인 1명 )</span>
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="font-mono text-[10px] px-1.5 h-5 rounded-sm bg-zinc-50/50 dark:bg-zinc-900/50 text-muted-foreground">Node v20.11.0</Badge>
                  <Badge variant="outline" className="font-mono text-[10px] px-1.5 h-5 rounded-sm bg-zinc-50/50 dark:bg-zinc-900/50 text-muted-foreground">Npm 10.2.4</Badge>
                  <Badge variant="outline" className="font-mono text-[10px] px-1.5 h-5 rounded-sm bg-zinc-50/50 dark:bg-zinc-900/50 text-muted-foreground">nest.js v11.0.6</Badge>
                  <Badge variant="outline" className="font-mono text-[10px] px-1.5 h-5 rounded-sm bg-zinc-50/50 dark:bg-zinc-900/50 text-muted-foreground">typescript v5.8.3</Badge>
                  <Badge variant="outline" className="font-mono text-[10px] px-1.5 h-5 rounded-sm bg-zinc-50/50 dark:bg-zinc-900/50 text-muted-foreground">Rocky 8.9</Badge>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {feature.description}
                </p>

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