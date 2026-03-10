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
                 <span className="font-medium text-foreground">3년 차</span>
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
                지난 3년간 호텔 예약 시스템부터 호텔 예약 · 결제 통합 플랫폼에 이르기까지, 다양한 비즈니스 도메인의 기반을 다지고 시스템을 고도화해 왔습니다. React를 활용한 프론트엔드 최적화부터 Node.js, NestJS 기반의 견고한 백엔드 설계까지 <span className="text-primary">전체 시스템의 흐름을 꿰뚫어 보는 시야</span>를 갖추고 있습니다. <br/><br/>
                저의 개발 철학은 단순한 구현자에 머물지 않는 것입니다. 주어진 API 명세서를 코드로 옮기기보다 프론트엔드와 백엔드의 요구사항을 조율하는 <span className="text-primary">공동 설계자</span>로 임합니다. <br/><br/>
                코드를 작성하는 것만큼이나 동료, 고객과의 소통을 중요하게 생각합니다. 표면적인 에러가 아닌 문제의 근본 원인을 다각도로 분석하며, 제가 내린 아키텍처적 의사결정과 작성한 코드에는 끝까지 책임을 다하는 든든한 엔지니어로 성장해 나가겠습니다
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
                      호텔·골프 예약 플랫폼 및 B2B 구독 시스템의 아키텍처 설계와 풀스택 개발을 주도하고 있습니다. 요구사항 정의부터 배포까지 프로덕트의 전체 라이프사이클을 관리하며, 시스템의 안정성과 유지보수성을 높이는 데 집중합니다.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-3 list-disc pl-5">
                      <li className="pl-1"><strong className="text-foreground">견고한 코어 아키텍처 설계:</strong> 신규 서비스의 초기 인프라/모듈 구조를 수립하고, NestJS 기반의 통합 회원 인증(SSO) 서버를 단독으로 설계 및 구축했습니다.</li>
                      <li className="pl-1"><strong className="text-foreground">트랜잭션 기반 결제·정산 시스템:</strong> PG사(토스, 나이스페이) 연동, 실시간 구독/빌링 로직을 설계하며 서버 중심의 결제 검증으로 금융 데이터의 정합성을 100% 확보했습니다.</li>
                      <li className="pl-1"><strong className="text-foreground">성능 및 운영 환경 최적화:</strong> 대용량 텍스트 검색 속도 개선, 결제 안정화 등 지속적인 구조적 리팩토링을 수행하며, Jenkins 기반 CI/CD 파이프라인을 구축해 운영 효율을 높였습니다.</li>
                      <li className="pl-1"><strong className="text-foreground">주도적인 프로덕트 매니지먼트:</strong> 단순 구현을 넘어 고객사 및 기획자와 직접 협업하며, 비즈니스 요구사항을 기술적 아키텍처로 풀어내는 역할을 수행합니다.</li>
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
