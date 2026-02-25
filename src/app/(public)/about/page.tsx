import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Github, Linkedin, Mail, Twitter } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="grid gap-12 md:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <div className="aspect-square overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
             {/* Using a placeholder since I don't have a real profile image */}
             <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800">
               ME
             </div>
          </div>
          
          <div className="space-y-4">
             <div className="flex gap-2 justify-center md:justify-start">
               <Button variant="outline" size="icon">
                 <Github className="h-4 w-4" />
               </Button>
               <Button variant="outline" size="icon">
                 <Linkedin className="h-4 w-4" />
               </Button>
               <Button variant="outline" size="icon">
                 <Twitter className="h-4 w-4" />
               </Button>
               <Button variant="outline" size="icon">
                 <Mail className="h-4 w-4" />
               </Button>
             </div>
             
             <div className="space-y-2 text-sm text-muted-foreground">
               <div className="flex justify-between border-b pb-2">
                 <span>위치</span>
                 <span className="font-medium text-foreground">San Francisco, CA</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                 <span>경력</span>
                 <span className="font-medium text-foreground">5년+</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                 <span>상태</span>
                 <span className="font-medium text-green-600">구직 중</span>
               </div>
             </div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">소개</h1>
            <div className="prose dark:prose-invert">
              <p className="text-lg text-muted-foreground">
                저는 확장 가능한 웹 애플리케이션과 개발자 도구를 만드는 풀스택 개발자입니다. 
                React 생태계와 서버 사이드 성능 최적화를 전문으로 합니다.
              </p>
              <p className="mt-4">
                5년 이상의 운영 경험을 바탕으로 실시간 협업 엔진부터 복잡한 데이터 시각화 대시보드에 이르기까지 다양한 도전을 해결해왔습니다. 
                제 철학은 단순합니다. 사용자가 사랑하고 개발자가 유지보수하기 즐거운 견고하고 타입 안전한 소프트웨어를 만드는 것입니다.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">기술 스택</h2>
            <div className="flex flex-wrap gap-2">
              {["React", "TypeScript", "Node.js", "Next.js", "PostgreSQL", "Redis", "AWS", "Docker", "GraphQL", "TailwindCSS"].map((skill) => (
                <Badge key={skill} variant="secondary" className="px-3 py-1 text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">경력</h2>
            <div className="space-y-6">
              {[
                { role: "Senior Frontend Engineer", company: "TechCorp Inc.", period: "2023 - Present", desc: "Leading the migration to Next.js App Router and establishing a new design system." },
                { role: "Full Stack Developer", company: "StartupOne", period: "2021 - 2023", desc: "Built the MVP from scratch and scaled the backend to handle 10k daily active users." },
                { role: "Frontend Developer", company: "WebAgency", period: "2019 - 2021", desc: "Developed responsive websites and e-commerce platforms for various clients." },
              ].map((job, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                      <h3 className="font-bold">{job.role}</h3>
                      <span className="text-sm text-muted-foreground">{job.period}</span>
                    </div>
                    <div className="text-sm font-medium text-primary mb-2">{job.company}</div>
                    <p className="text-sm text-muted-foreground">{job.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
