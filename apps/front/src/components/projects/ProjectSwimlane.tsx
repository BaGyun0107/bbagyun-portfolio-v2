'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { isFeatureSwimlaneArchifyUrlForSwimlane, type FeatureSwimlane } from '@/data/portfolio';

import { ArchifySwimlaneEmbed, type ArchifyEmbedMode } from './ArchifySwimlaneEmbed';
import { ResponsiveSwimlaneDiagram } from './ResponsiveSwimlaneDiagram';

interface ProjectSwimlaneProps {
  swimlane: FeatureSwimlane;
}

interface SwimlaneVisualProps {
  swimlane: FeatureSwimlane;
  mode: ArchifyEmbedMode;
  describedBy: string;
}

function ArchifySwimlaneLegend({ title }: { title: string }) {
  return (
    <aside data-swimlane-line-legend aria-label={`${title} 선 의미`} className='border-t px-3 py-2.5 sm:px-4'>
      <ul className='flex flex-wrap gap-x-5 gap-y-2 text-xs leading-5 text-muted-foreground'>
        <li data-swimlane-line-legend-item='normal' className='flex items-center gap-2'>
          <span aria-hidden='true' className='w-8 shrink-0 border-t-2 border-foreground' />
          <span>일반 진행·검증 통과</span>
        </li>
        <li data-swimlane-line-legend-item='exception' className='flex items-center gap-2'>
          <span aria-hidden='true' className='w-8 shrink-0 border-t-2 border-dashed border-destructive' />
          <span>예외 발견·복구 및 재검증</span>
        </li>
      </ul>
    </aside>
  );
}

function SwimlaneVisual({ swimlane, mode, describedBy }: SwimlaneVisualProps) {
  const instanceKey = mode === 'preview' ? 'inline' : 'dialog';
  const fallback = (
    <ResponsiveSwimlaneDiagram swimlane={swimlane} describedBy={describedBy} instanceKey={instanceKey} />
  );

  if (!swimlane.archify || !isFeatureSwimlaneArchifyUrlForSwimlane(swimlane.id, swimlane.archify.url)) return fallback;

  return (
    <div data-archify-swimlane-visual className='min-w-0'>
      <ArchifySwimlaneEmbed
        url={swimlane.archify.url}
        mode={mode}
        title={swimlane.title}
        describedBy={describedBy}
        fallback={fallback}
      />
      <ArchifySwimlaneLegend title={swimlane.title} />
    </div>
  );
}

export function SwimlaneDialogTranscript({ swimlane }: Pick<ProjectSwimlaneProps, 'swimlane'>) {
  const stepLabels = new Map(swimlane.steps.map((step) => [step.id, step.label]));
  const labeledEdges = swimlane.edges.filter(
    (edge): edge is typeof edge & { label: string } => typeof edge.label === 'string' && edge.label.length > 0
  );

  return (
    <section
      data-swimlane-mobile-transcript
      aria-label={`${swimlane.title} 단계와 관계 설명`}
      className='space-y-4 rounded-lg border bg-card p-4 lg:hidden'
    >
      <div>
        <h4 className='font-semibold'>단계와 관계 읽기</h4>
        <p className='mt-1 text-sm leading-6 text-muted-foreground'>
          작은 화면에서는 아래 목록으로 세부 흐름을 확인합니다.
        </p>
      </div>

      <div className='space-y-2'>
        <h5 className='text-sm font-semibold'>단계</h5>
        <ol className='space-y-2'>
          {swimlane.steps.map((step, index) => (
            <li
              key={step.id}
              data-swimlane-transcript-step={step.id}
              className='rounded-md bg-muted/40 p-3 text-sm leading-6'
            >
              <p className='font-medium'>
                {index + 1}. {step.label}
              </p>
              <p className='text-muted-foreground'>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className='space-y-2'>
        <h5 className='text-sm font-semibold'>의미 있는 관계</h5>
        <ul className='space-y-2'>
          {labeledEdges.map((edge) => (
            <li
              key={edge.id}
              data-swimlane-transcript-edge={edge.id}
              data-swimlane-transcript-edge-kind={edge.kind}
              data-swimlane-transcript-edge-outcome={edge.outcome}
              className='rounded-md border px-3 py-2 text-sm leading-6'
            >
              <p className='font-medium'>
                {stepLabels.get(edge.from)} → {stepLabels.get(edge.to)}
              </p>
              <p className='mt-1 flex flex-wrap items-center gap-2'>
                {edge.kind === 'exception' ? (
                  <span className='rounded-full border border-destructive/40 px-2 py-0.5 text-xs font-medium text-destructive'>
                    {edge.outcome === 'recover' ? '예외·복구 흐름' : '예외·중단 흐름'}
                  </span>
                ) : null}
                <span className={edge.kind === 'exception' ? 'text-destructive' : 'text-muted-foreground'}>
                  {edge.label}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ProjectSwimlane({ swimlane }: ProjectSwimlaneProps) {
  const titleId = `${swimlane.id}-title`;
  const inlineSummaryId = `${swimlane.id}-inline-summary`;
  const dialogSummaryId = `${swimlane.id}-dialog-summary`;
  const hasArchifyEmbed =
    swimlane.archify !== undefined && isFeatureSwimlaneArchifyUrlForSwimlane(swimlane.id, swimlane.archify.url);

  return (
    <article
      data-swimlane-card
      aria-labelledby={titleId}
      className='min-w-0 space-y-5 rounded-xl border bg-card p-4 sm:p-6'
    >
      <header className='flex flex-col items-start gap-4 sm:flex-row sm:justify-between'>
        <div className='min-w-0'>
          <h3 id={titleId} className='text-xl font-semibold'>
            {swimlane.title}
          </h3>
          <p className='mt-2 max-w-3xl text-sm leading-6 text-muted-foreground'>{swimlane.purpose}</p>
        </div>

        <div data-swimlane-actions className='flex flex-wrap items-center gap-2'>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                data-swimlane-expand
                type='button'
                variant='outline'
                size='sm'
                aria-label={`${swimlane.title} 크게 보기`}
              >
                크게 보기
              </Button>
            </DialogTrigger>
            <DialogContent
              data-swimlane-dialog
              className='max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto p-4 sm:max-w-[calc(100vw-2rem)] sm:p-6 2xl:max-w-[96rem]'
            >
              <DialogHeader className='pr-10'>
                <DialogTitle>{`${swimlane.title} 크게 보기`}</DialogTitle>
                <DialogDescription>{swimlane.purpose}</DialogDescription>
              </DialogHeader>

              <figure className='min-w-0 space-y-4'>
                <div className='min-w-0 max-w-full rounded-lg border bg-muted/20'>
                  <SwimlaneVisual swimlane={swimlane} mode='dialog' describedBy={dialogSummaryId} />
                </div>
                {hasArchifyEmbed ? <SwimlaneDialogTranscript swimlane={swimlane} /> : null}
                <figcaption
                  id={dialogSummaryId}
                  className='rounded-lg bg-muted/40 p-4 text-sm leading-6 text-muted-foreground'
                >
                  {swimlane.summary}
                </figcaption>
              </figure>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <figure className='space-y-4'>
        <div data-swimlane-preview className='min-w-0 max-w-full rounded-lg border bg-muted/20'>
          <SwimlaneVisual swimlane={swimlane} mode='preview' describedBy={inlineSummaryId} />
        </div>
        <figcaption className='rounded-lg bg-muted/40 p-4'>
          <h4 className='font-semibold'>전체 흐름 설명</h4>
          <p id={inlineSummaryId} className='mt-2 text-sm leading-6 text-muted-foreground'>
            {swimlane.summary}
          </p>
        </figcaption>
      </figure>

      {swimlane.exceptions.length > 0 ? (
        <section className='space-y-3'>
          <h4 className='font-semibold'>예외 상황과 대응</h4>
          <ul className='grid gap-3 sm:grid-cols-2'>
            {swimlane.exceptions.map((exception) => (
              <li key={exception.id} className='rounded-lg border border-destructive/40 bg-muted/20 p-4'>
                <h5 className='text-sm font-semibold text-foreground'>{exception.trigger}</h5>
                <p className='mt-2 text-sm leading-6 text-muted-foreground'>{exception.response}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
