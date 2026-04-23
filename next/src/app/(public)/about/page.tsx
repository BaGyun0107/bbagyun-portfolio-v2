import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="grid gap-12 md:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <div className="aspect-square overflow-hidden rounded-2xl">
             <Image
               src="https://avatars.githubusercontent.com/u/95732945?v=4"
               alt="BbaGyun profile"
               width={400}
               height={400}
               className="w-full h-full object-cover"
             />
          </div>
          
          <div className="space-y-4">
             <div className="flex gap-2 justify-center md:justify-start">
               <Button variant="outline" size="icon" asChild>
                 <Link href="https://github.com/BaGyun0107" target="_blank" rel="noopener noreferrer">
                   <Github className="h-4 w-4" />
                 </Link>
               </Button>
             </div>
             
             <div className="space-y-2 text-sm text-muted-foreground">
               <div className="flex justify-between border-b pb-2">
                 <span>위치</span>
                 <span className="font-medium text-foreground">대한민국 서울</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                 <span>경력</span>
                 <span className="font-medium text-foreground">{Math.max(1, new Date().getFullYear() - 2023)}+년 차</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                 <span>상태</span>
                 <span className="font-medium text-green-600">새로운 기회 탐색 중</span>
               </div>
             </div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <div className="prose dark:prose-invert">
              <p className="text-2xl font-bold">
                방향을 정하고 깊이를 더하는 개발자, 박윤신입니다.
              </p>
              <p className="text-lg text-muted-foreground">
                프론트엔드와 백엔드를 아우르며, 비즈니스의 요구를 안정적인 시스템으로 구현해 온 {Math.max(1, new Date().getFullYear() - 2023)}+년 차 풀스택 개발자입니다. Node.js와 NestJS를 활용한 백엔드 설계부터 React 기반의 사용자 경험 최적화까지, 시스템 전체의 흐름을 이해하고 다루는 데 강점이 있습니다.
                <br/><br/>
                <span className="font-bold">[구현자를 넘어선 비즈니스 파트너]</span><br />
                저의 역할은 주어진 기획을 코드로 번역하는 것에 국한되지 않습니다. 고객의 요구사항을 분석할 때 구현이 어려운 병목 지점이 발견되면, 이를 우회하면서도 본래의 비즈니스 목적을 달성할 수 있는 더 나은 대안을 먼저 제시합니다. 개발자의 시선에 갇히지 않고, 고객 및 동료들과 유연하게 소통하며 최적의 합의점을 찾아냅니다.
                <br /><br />
                <span className="font-bold">[확장성을 고려한 유연한 설계]</span><br />
                당장의 기능 동작에만 만족하지 않습니다. 현재 작성하는 코드가 훗날 기술 부채가 되지 않도록 재사용성을 항상 염두에 둡니다. 새로운 기능 요구가 들어오더라도 기존 시스템에 자연스럽게 녹아들 수 있도록, 유연하고 확장성 있는 아키텍처를 구성하는 것을 중요하게 생각합니다.
                <br/><br/>
                제가 작성한 코드와 설계 방향에 대해 끝까지 책임지는 태도로, 팀과 서비스가 함께 성장하는 데 기여하는 든든한 엔지니어가 되겠습니다.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">기술 스택</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground border-b pb-1">Backend</h3>
                <div className="flex flex-wrap gap-2">
                  {["Node.js", "Express", "NestJS", "PHP"].map(skill => (
                    <Badge key={skill} variant="secondary" className="px-2.5 py-0.5 text-xs font-normal">{skill}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground border-b pb-1">Frontend</h3>
                <div className="flex flex-wrap gap-2">
                  {["JavaScript", "TypeScript", "React"].map(skill => (
                    <Badge key={skill} variant="secondary" className="px-2.5 py-0.5 text-xs font-normal">{skill}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground border-b pb-1">Database</h3>
                <div className="flex flex-wrap gap-2">
                  {["MySQL", "Prisma", "Sequelize"].map(skill => (
                    <Badge key={skill} variant="secondary" className="px-2.5 py-0.5 text-xs font-normal">{skill}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground border-b pb-1">Infra & Cloud</h3>
                <div className="flex flex-wrap gap-2">
                  {["AWS", "NHN Cloud", "Cafe24", "Gabia", "Rocky Linux"].map(skill => (
                    <Badge key={skill} variant="secondary" className="px-2.5 py-0.5 text-xs font-normal">{skill}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground border-b pb-1">DevOps & Tools</h3>
                <div className="flex flex-wrap gap-2">
                  {["Jenkins", "GitHub Actions", "PM2", "Socket.io"].map(skill => (
                    <Badge key={skill} variant="secondary" className="px-2.5 py-0.5 text-xs font-normal">{skill}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground border-b pb-1">AI-Assisted Dev</h3>
                <div className="flex flex-wrap gap-2">
                  {["Figma", "Claude Code", "ChatGPT", "GitHub Copilot", "Antigravity", "Cursor"].map(skill => (
                    <Badge key={skill} variant="secondary" className="px-2.5 py-0.5 text-xs font-normal">{skill}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">경력</h2>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Full Stack Developer</h3>
                    <span className="text-sm font-medium bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-muted-foreground mt-2 md:mt-0">2023.04 - Present</span>
                  </div>
                  <div className="text-base font-medium text-primary mb-4">코디웍스</div>
                  
                  <div className="space-y-4">
                    <p className="text-sm text-foreground leading-relaxed">
                      호텔·골프·리조트 예약 플랫폼과 B2B 화훼 유통 시스템의 풀스택 개발을 담당하고 있습니다. 백엔드 1인 개발자로 7개 프로젝트의 서버 아키텍처를 설계하고 운영했습니다.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-3 list-disc pl-5">
                      <li className="pl-1">7개 프로젝트 <strong className="text-foreground">PM/PL 겸임</strong>, 고객사 요구사항 정의부터 배포·운영까지 전 과정 수행</li>
                      <li className="pl-1">NestJS 기반 <strong className="text-foreground">SSO 통합 인증 서버 단독 설계·구축</strong> (4개 서비스 연동)</li>
                      <li className="pl-1">PG 연동(토스, 나이스페이) 결제·정산 시스템 설계, <strong className="text-foreground">금융 데이터 불일치 0건</strong></li>
                      <li className="pl-1">검색 최적화 <strong className="text-foreground">1500ms → 400ms (73% 개선)</strong>, 로깅 I/O 95% 감소 등 성능 개선</li>
                      <li className="pl-1">Jenkins / GitHub Actions 기반 <strong className="text-foreground">CI/CD 구축</strong> 및 배포 자동화</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
