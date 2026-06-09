import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Github } from "lucide-react";
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
                예약, 결제, 정산, 인증처럼 데이터 정합성과 운영 안정성이 중요한 기능을 주로 설계해 온 {Math.max(1, new Date().getFullYear() - 2023)}+년 차 백엔드 중심 풀스택 개발자입니다. Node.js와 NestJS 기반의 서버 설계부터 React 기반 화면 구현까지 경험했지만, 강점은 시스템 전체 흐름을 이해하고 안정적으로 운영될 수 있는 구조를 만드는 데 있습니다.
                <br/><br/>
                <span className="font-bold">[요구사항의 목적을 함께 보는 개발자]</span><br />
                저의 역할은 주어진 기획을 그대로 코드로 옮기는 데서 끝나지 않는다고 생각합니다. 고객의 요구사항을 분석하는 과정에서 구현 복잡도나 운영 리스크가 보이면, 본래의 목적을 해치지 않는 범위에서 더 단순하고 안전한 대안을 제안하려고 합니다. 개발자의 시선에만 갇히지 않고 고객, 기획자, 동료와 대화하며 현실적인 합의점을 찾는 것을 중요하게 생각합니다.
                <br /><br />
                <span className="font-bold">[운영을 고려한 구조 설계]</span><br />
                당장의 기능 동작보다 운영 중 문제가 드러나는 지점을 먼저 생각합니다. 장애가 발생했을 때 원인을 추적할 수 있는지, 실패한 작업을 다시 처리할 수 있는지, 환경변수와 배포 권한이 명확히 분리되어 있는지 같은 기준을 설계 초기에 확인하려고 합니다. 최근에는 배포와 환경 관리가 개인의 기억에 의존하지 않도록 사내 하네스를 만들며, 팀이 같은 기준으로 개발·배포할 수 있는 흐름을 정리했습니다.
                <br/><br/>
                제가 작성한 코드와 설계 방향에 책임을 갖고, 제품이 안정적으로 운영될 수 있는 구조를 만드는 개발자가 되고자 합니다.
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
                  {["Jenkins", "GitHub Actions", "Infisical", "PM2", "Docker", "Vercel", "Socket.io"].map(skill => (
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
                      백엔드 개발을 주도하고, 필요한 경우 프론트엔드와 운영 도구까지 함께 구현했습니다. 1인 백엔드 개발자로 여러 프로젝트의 서버 구조, 외부 연동, 배포·운영 흐름을 설계하고 개선했습니다.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-3 list-disc pl-5">
                      <li className="pl-1">7개 프로젝트 <strong className="text-foreground">백엔드 개발 주도</strong>, 일부 프로젝트에서 PM/PL을 겸임하며 요구사항 정의부터 배포·운영까지 수행</li>
                      <li className="pl-1">NestJS 기반 <strong className="text-foreground">SSO 통합 인증 서버 단독 설계·구축</strong>, 초기 서비스 연동까지 적용</li>
                      <li className="pl-1">PG 연동(토스, 나이스페이) 결제·정산 시스템 설계, <strong className="text-foreground">운영 중 확인된 결제·정산 데이터 불일치 0건</strong></li>
                      <li className="pl-1">MySQL FULLTEXT 기반 검색 최적화로 응답 시간 <strong className="text-foreground">1500ms → 400ms</strong> 개선, 파일 기반 로깅 구조 개선으로 I/O 약 95% 감소</li>
                      <li className="pl-1">Jenkins 기반 배포 환경을 <strong className="text-foreground">GitHub Actions·Infisical 중심의 사내 DX 하네스</strong>로 전환</li>
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
