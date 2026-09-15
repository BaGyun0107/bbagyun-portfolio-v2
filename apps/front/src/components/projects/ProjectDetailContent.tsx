import Link from 'next/link';

import type { FeatureDetailDto } from '@/data/portfolio';

import { ProjectDemoLink } from './ProjectDemoLink';
import { ProjectHighlights } from './ProjectHighlights';
import { ProjectMarkdown } from './ProjectMarkdown';
import { ProjectNarrative } from './ProjectNarrative';
import { ProjectRelationshipDiagram } from './ProjectRelationshipDiagram';
import { ProjectSwimlane } from './ProjectSwimlane';

interface RelatedInsightSummary {
  slug: string;
  title: string;
  excerpt: string;
}

interface ProjectDetailContentProps {
  overview: string;
  detail: FeatureDetailDto;
  relatedInsights: RelatedInsightSummary[];
}

export function ProjectDetailContent(_props: ProjectDetailContentProps) {
  const { overview, detail, relatedInsights } = _props;

  return (
    <div className='space-y-10'>
      <section className='space-y-4'>
        <h2 className='border-b pb-2 text-2xl font-semibold'>프로젝트 개요</h2>
        <ProjectMarkdown content={overview} />
        <ProjectDemoLink demo={detail.demo} />
      </section>

      <ProjectNarrative title='나의 역할과 책임 범위' content={detail.role} />

      <section className='space-y-4'>
        <h2 className='border-b pb-2 text-2xl font-semibold'>핵심 결과 요약</h2>
        <ProjectHighlights highlights={detail.highlights} />
      </section>

      <section className='space-y-6'>
        <h2 className='border-b pb-2 text-2xl font-semibold'>문제 상황과 제약 조건</h2>
        <div>
          <h3 className='mb-2 text-lg font-semibold'>문제 상황</h3>
          <ProjectMarkdown content={detail.problem} />
        </div>
        <div>
          <h3 className='mb-2 text-lg font-semibold'>제약 조건</h3>
          <ProjectMarkdown content={detail.constraints} />
        </div>
      </section>

      <ProjectNarrative title='대안 검토와 선택' content={detail.alternatives} />

      {detail.swimlanes?.length ? (
        <section className='space-y-4'>
          <h2 className='border-b pb-2 text-2xl font-semibold'>시스템 흐름</h2>
          <div className='space-y-6'>
            {detail.swimlanes.map((swimlane) => (
              <ProjectSwimlane key={swimlane.id} swimlane={swimlane} />
            ))}
          </div>
        </section>
      ) : null}

      {detail.relationshipDiagrams?.length ? (
        <section className='space-y-4'>
          <h2 className='border-b pb-2 text-2xl font-semibold'>핵심 데이터 관계</h2>
          <div className='space-y-6'>
            {detail.relationshipDiagrams.map((diagram) => (
              <ProjectRelationshipDiagram key={diagram.id} diagram={diagram} />
            ))}
          </div>
        </section>
      ) : null}

      <ProjectNarrative title='핵심 설계와 구현' content={detail.implementation} />
      <ProjectNarrative title='결과와 검증 근거' content={detail.outcomes} />
      <ProjectNarrative title='회고와 다음 개선' content={detail.retrospective} />

      {relatedInsights.length ? (
        <section className='space-y-4'>
          <h2 className='border-b pb-2 text-2xl font-semibold'>관련 인사이트</h2>
          <ul className='grid gap-3 sm:grid-cols-2'>
            {relatedInsights.map((insight) => (
              <li key={insight.slug}>
                <Link
                  href={`/insights/${insight.slug}`}
                  className='block rounded-xl border bg-card p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                >
                  <span className='font-medium'>{insight.title}</span>
                  <span className='mt-2 block text-sm leading-6 text-muted-foreground'>{insight.excerpt}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
