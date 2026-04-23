import Link from "next/link";
import { ArrowRight, ArrowUpRight, Server, Cloud, Globe, Cpu, Terminal } from "lucide-react";
import { 
  SiNodedotjs, SiExpress, SiNestjs, SiPhp, 
  SiJavascript, SiTypescript, SiReact, 
  SiMysql, SiPrisma, SiSequelize,
  SiAmazonwebservices, SiRockylinux, SiJenkins, SiGithubactions,
  SiPm2, SiSocketdotio, SiFigma,
  SiAnthropic, SiOpenai, SiGithubcopilot
} from "react-icons/si";
import { Badge } from "@/components/ui/badge";
import { InlineMarkdown } from "@/components/ui/InlineMarkdown";
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
    // Backend
    { icon: SiNodedotjs, name: "Node.js", color: "text-[#339933]" },
    { icon: SiExpress, name: "Express", color: "text-black dark:text-white" },
    { icon: SiNestjs, name: "NestJS", color: "text-[#E0234E]" },
    { icon: SiPhp, name: "PHP", color: "text-[#777BB4]" },
    // Frontend
    { icon: SiJavascript, name: "JavaScript", color: "text-[#F7DF1E]" },
    { icon: SiTypescript, name: "TypeScript", color: "text-[#3178C6]" },
    { icon: SiReact, name: "React", color: "text-[#61DAFB]" },
    // Database
    { icon: SiMysql, name: "MySQL", color: "text-[#4479A1]" },
    { icon: SiPrisma, name: "Prisma", color: "text-[#2D3748] dark:text-white" },
    { icon: SiSequelize, name: "Sequelize", color: "text-[#52B0E7]" },
    // Infra & Cloud
    { icon: SiAmazonwebservices, name: "AWS", color: "text-[#FF9900]" },
    { icon: Cloud, name: "NHN Cloud", color: "text-[#3366FF]" }, 
    { icon: Server, name: "Cafe24", color: "text-black dark:text-white" }, 
    { icon: Globe, name: "Gabia", color: "text-[#333333] dark:text-white" }, 
    { icon: SiRockylinux, name: "Rocky Linux", color: "text-[#10B981]" },
    // DevOps & Tools
    { icon: SiJenkins, name: "Jenkins", color: "text-[#D33833]" },
    { icon: SiGithubactions, name: "GitHub Actions", color: "text-[#2088FF]" },
    { icon: SiPm2, name: "PM2", color: "text-[#2B037A]" },
    { icon: SiSocketdotio, name: "Socket.io", color: "text-black dark:text-white" },
    // AI-Assisted Dev
    { icon: SiFigma, name: "Figma", color: "text-[#F24E1E]" },
    { icon: Terminal, name: "Claude Code", color: "text-[#D97757]" }, 
    { icon: SiOpenai, name: "ChatGPT", color: "text-[#412991] dark:text-white" },
    { icon: SiGithubcopilot, name: "GitHub Copilot", color: "text-black dark:text-white" },
    { icon: Cpu, name: "Antigravity", color: "text-primary" }, 
    { icon: Terminal, name: "Cursor", color: "text-black dark:text-white" }, 
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
          animation: marquee 90s linear infinite;
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
          단순한 기능 구현을 넘어, <br className="hidden md:block"/> 견고한 아키텍처를 설계합니다.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed break-keep">
          사용자를 위한 매끄러운 경험과 팀을 위한 견고한 아키텍처.<br className="hidden md:block"/>시스템의 방향을 설계하고 기술의 깊이를 더하는 {Math.max(1, new Date().getFullYear() - 2023)}년 차 백엔드 중심 풀스택 개발자입니다.
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
                 <div key={i} className="flex items-center gap-2 whitespace-nowrap">
                    <tech.icon className={`h-6 w-6 ${tech.color}`}/> <span className="text-lg font-medium text-foreground/80">{tech.name}</span>
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
              <div className="text-4xl font-bold">{Math.max(1, new Date().getFullYear() - 2023)}+</div>
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
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          {feature.period && <span>{feature.period}</span>}
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>

                    <InlineMarkdown content={feature.description} className="text-sm text-muted-foreground leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all" />

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
           <h2 className="text-2xl font-bold tracking-tight">최근 인사이트</h2>
           <Link href="/insights" className="text-sm text-primary hover:underline">전체 보기</Link>
        </div>
        
        <div className="space-y-8 pl-4 border-l-2 border-zinc-100 dark:border-zinc-800 ml-2">
           {INSIGHTS.slice(0, 3).map((insight) => (
             <div key={insight.id} className="relative pl-8">
               <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-zinc-200 dark:bg-zinc-800 border-4 border-background" />
               <span className="text-sm text-muted-foreground mb-1 block">
                 {new Date(insight.date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}
               </span>
               <h3 className="text-lg font-semibold hover:text-primary cursor-pointer transition-colors">
                 <Link href={`/insights/${insight.slug}`}>{insight.title}</Link>
               </h3>
               <InlineMarkdown content={insight.excerpt} className="text-muted-foreground mt-2 line-clamp-2 group-hover:line-clamp-none transition-all" />
             </div>
           ))}
        </div>
      </section>

    </div>
  );
}