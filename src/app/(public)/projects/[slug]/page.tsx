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

  // Find related insights based on tech stack overlap
  const relatedInsights = feature && feature.techStack
    ? (await InsightService.getAllInsights()).filter(
        (insight) =>
          insight.tags.some((tag) =>
            feature.techStack.includes(tag),
          ) || insight.tags.includes(feature.category),
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
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">기간:</span>
            <span>2024.07 ~ 2024.11</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Version:</span>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="font-mono text-xs">Node v20.11.0</Badge>
              <Badge variant="outline" className="font-mono text-xs">Npm 10.2.4</Badge>
              <Badge variant="outline" className="font-mono text-xs">nest.js v11.0.6</Badge>
              <Badge variant="outline" className="font-mono text-xs">typescript v5.8.3</Badge>
              <Badge variant="outline" className="font-mono text-xs">Rocky 8.9</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Team:</span>
            <span>BackEnd ( 본인 1명 )</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
          {(() => {
            const isRefactor = ["payment-gateway", "admin-system"].includes(
              feature.slug,
            );
            const content = isRefactor
              ? {
                  problem:
                    "**기존 레거시 시스템**은 높은 결합도와 노후화된 기술 스택으로 인해 유지보수 비용이 지속적으로 증가했습니다. \n\n특히 새로운 비즈니스 요구사항을 반영하기 위한 리드 타임이 길어지고, 사이드 이펙트로 인한 **장애 발생 위험**이 컸습니다.",
                  approach:
                    "**점진적인 리팩토링(Strangler Pattern)** 전략을 수립하여 서비스 중단 없이 시스템을 개선하는 것을 목표로 했습니다. \n\n* **클린 아키텍처**를 도입하여 비즈니스 로직과 UI를 분리\n* **테스트 커버리지**를 확보하여 안정성을 강화하는 방향으로 접근했습니다.",
                  process:
                    "1. **분석**: 기존 코드베이스를 분석하여 핵심 도메인 로직을 식별하는 것부터 시작했습니다. \n2. **안전장치 마련**: 단위 테스트 및 통합 테스트를 작성하여 리팩토링 중 발생할 수 있는 문제를 예방했습니다. \n3. **구조 개선**: 컴포넌트 기반 설계를 적용하고 상태 관리 로직을 최적화했습니다. \n4. **전환**: 최종적으로 레거시 코드를 단계적으로 제거하며 신규 아키텍처로 완전히 전환했습니다.",
                  result:
                    "코드 복잡도를 **50% 이상 감소**시키고, 기능 추가 속도를 **2배 향상**시켰습니다. 또한 테스트 자동화를 통해 배포 안정성을 확보하고, 개발팀의 생산성을 크게 높일 수 있었습니다.",
                  lesson:
                    "기술적 부채를 해결하는 과정에서 코드 품질뿐만 아니라 **팀의 개발 문화와 프로세스**까지 개선하는 경험을 했습니다. 지속 가능한 소프트웨어 설계를 위한 원칙들의 중요성을 다시 한번 깨달았습니다.",
                }
              : {
                  problem:
                    "서비스 초기 설계 단계에서 향후 **트래픽 급증**과 **데이터 양의 증가**를 고려하지 않을 경우, 데이터베이스 병목 현상과 시스템 응답 지연이 발생할 수 있는 잠재적 리스크가 있었습니다.",
                  approach:
                    "**확장성**과 **고가용성**을 최우선으로 고려하여 아키텍처를 설계했습니다. \n\n* **마이크로서비스 아키텍처**를 도입하여 서비스 간 결합도를 낮춤\n* **Redis 캐싱 전략**을 통해 데이터베이스 부하를 최소화하는 예방적 접근을 취했습니다.",
                  process:
                    "1. **설계**: 요구사항 분석을 통해 핵심 도메인을 정의하고, 도메인 주도 설계(DDD)를 적용했습니다. \n2. **구현**: 이벤트 기반 아키텍처를 구현하여 서비스 간 비동기 통신을 처리했습니다. \n3. **배포**: Docker와 Kubernetes를 활용하여 자동화된 배포 파이프라인을 구축했습니다.",
                  result:
                    "예상 트래픽의 **5배에 달하는 부하 테스트**를 성공적으로 통과했으며, **99.9%의 시스템 가동률**을 달성했습니다. 사용자 응답 속도는 평균 100ms 이내로 유지되었습니다.",
                  lesson:
                    "초기 아키텍처 설계 단계에서의 **명확한 의사결정**과 **트레이드오프 분석**이 프로젝트의 장기적인 성공에 얼마나 큰 영향을 미치는지 깊이 이해하게 되었습니다.",
                };

            return (
              <>
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold border-b pb-2">
                    프로젝트 개요
                  </h2>
                  <MarkdownViewer content={feature.overview + "\n\n" + feature.description} />
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold border-b pb-2">
                    문제 상황
                  </h2>
                  <MarkdownViewer content={content.problem} />
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold border-b pb-2">
                    접근 전략
                  </h2>
                  <MarkdownViewer content={content.approach} />
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold border-b pb-2">
                    구체적 해결 과정
                  </h2>
                  <MarkdownViewer content={content.process} />
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold border-b pb-2">
                    결과 및 영향
                  </h2>
                  <MarkdownViewer content={content.result} />
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold border-b pb-2">
                    배운 점 및 확장 사고
                  </h2>
                  <MarkdownViewer content={content.lesson} />
                </section>
              </>
            );
          })()}
        </div>

        {/* Sidebar / Meta Info */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                기술
              </CardTitle>
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
                  Check out the blog for more engineering deep
                  dives.
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