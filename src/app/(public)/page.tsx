import Link from "next/link";
import { ArrowRight, Server, Terminal, Database, Code, Cpu, Globe, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureService } from "@/lib/api/services/feature.service";
import { InsightService } from "@/lib/api/services/insight.service";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [FEATURES, INSIGHTS] = await Promise.all([
    FeatureService.getAllFeatures(),
    InsightService.getAllInsights()
  ]);
  const techStack = [
    { icon: Server, name: "Node.js" },
    { icon: Database, name: "PostgreSQL" },
    { icon: Cpu, name: "Redis" },
    { icon: Globe, name: "AWS" },
    { icon: Code, name: "TypeScript" },
    { icon: Terminal, name: "Docker" },
  ];

  return (
    <div className="space-y-16 py-10 md:py-20">
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      {/* Hero Section */}
      <section 
        className="container mx-auto px-4 max-w-4xl text-center space-y-6"
      >
        <Badge variant="secondary" className="mb-4">Open to work</Badge>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight lg:text-7xl">
          Backend-focused <br className="hidden md:block"/> Fullstack Developer
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Building scalable systems, not just websites. <br/>
          Specialized in high-concurrency, distributed architecture, and developer tools.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button size="lg" asChild>
            <Link href="/projects">
              작업물 보기 <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/contact">문의하기</Link>
          </Button>
        </div>
      </section>

      {/* Tech Stack Marquee */}
      <div className="w-full overflow-hidden border-y bg-zinc-50/50 dark:bg-zinc-900/50 py-8">
        <div className="animate-marquee">
           <div className="flex gap-12 px-6">
              {[...techStack, ...techStack, ...techStack, ...techStack].map((tech, i) => (
                 <div key={i} className="flex items-center gap-2 text-muted-foreground/50 grayscale opacity-70 whitespace-nowrap">
                    <tech.icon className="h-6 w-6"/> <span className="text-lg font-medium">{tech.name}</span>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <section 
        className="container mx-auto px-4 max-w-5xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">작업물 갯수</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{FEATURES.length}</div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">인사이트 갯수</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{INSIGHTS.length}</div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">연차</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">5+</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Works */}
      <section className="container mx-auto px-4 max-w-5xl space-y-8">
         <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">최근 작업물</h2>
            <Link href="/projects" className="text-sm text-primary hover:underline">전체 보기</Link>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.slice(0, 2).map((feature) => (
                <Link key={feature.id} href={`/projects/${feature.slug}`} className="block h-full group">
                  <Card className="h-full border-zinc-200 dark:border-zinc-800 transition-all duration-200 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md flex flex-col p-6 gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-xl group-hover:text-primary transition-colors flex items-center gap-2 mb-1.5">
                          {feature.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>2024.07 ~ 2024.11</span>
                          <span className="text-zinc-300 dark:text-zinc-700">•</span>
                          <span>BackEnd</span>
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

                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
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
            ))}
         </div>
      </section>

      {/* Recent Activity / Updates */}
      <section className="container mx-auto px-4 max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
           <h2 className="text-2xl font-bold tracking-tight">최근 업데이트</h2>
           <Link href="/insights" className="text-sm text-primary hover:underline">전체 보기</Link>
        </div>
        
        <div className="space-y-8 pl-4 border-l-2 border-zinc-100 dark:border-zinc-800 ml-2">
           {INSIGHTS.slice(0, 2).map((insight) => (
             <div key={insight.id} className="relative pl-8">
               <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-zinc-200 dark:bg-zinc-800 border-4 border-background" />
               <span className="text-sm text-muted-foreground mb-1 block">{String(insight.date)}</span>
               <h3 className="text-lg font-semibold hover:text-primary cursor-pointer transition-colors">
                 <Link href="/insights">{insight.title}</Link>
               </h3>
               <p className="text-muted-foreground mt-2">{insight.excerpt}</p>
             </div>
           ))}
           <div className="relative pl-8">
             <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-zinc-200 dark:bg-zinc-800 border-4 border-background" />
             <span className="text-sm text-muted-foreground mb-1 block">2025-08-15</span>
             <h3 className="text-lg font-semibold">Deployed Admin System v2.0</h3>
             <p className="text-muted-foreground mt-2">Migrated the entire dashboard to a new design system and improved data fetching performance by 40%.</p>
           </div>
        </div>
      </section>

    </div>
  );
}