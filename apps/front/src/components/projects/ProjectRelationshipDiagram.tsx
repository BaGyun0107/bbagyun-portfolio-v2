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
import {
  isFeatureRelationshipArchifyUrlForDiagram,
  type FeatureRelationshipDiagram,
  type FeatureRelationshipEntityRole
} from '@/data/portfolio';

import { ArchifyEmbed, type ArchifyEmbedMode } from './ArchifyEmbed';

interface ProjectRelationshipDiagramProps {
  diagram: FeatureRelationshipDiagram;
}

interface RelationshipVisualProps extends ProjectRelationshipDiagramProps {
  mode: ArchifyEmbedMode;
  describedBy: string;
}

const ENTITY_ROLE_LABELS: Record<FeatureRelationshipEntityRole, string> = {
  parent: '공통 부모',
  subtype: '세부 모델',
  transaction: '주문',
  inventory: '재고',
  option: '옵션'
};

function RelationshipFallback({ diagram }: ProjectRelationshipDiagramProps) {
  return (
    <div
      data-relationship-fallback='true'
      aria-label={`${diagram.title} 대체 설명 안내`}
      className='flex min-h-64 items-center justify-center bg-muted/20 p-6 text-center text-sm leading-6 text-muted-foreground'
    >
      시각 자료를 준비하지 못했습니다. 아래 엔터티와 관계 설명에서 같은 내용을 확인할 수 있습니다.
    </div>
  );
}

function RelationshipVisual({ diagram, mode, describedBy }: RelationshipVisualProps) {
  const fallback = <RelationshipFallback diagram={diagram} />;

  if (!diagram.archify || !isFeatureRelationshipArchifyUrlForDiagram(diagram.id, diagram.archify.url)) {
    return fallback;
  }

  return (
    <ArchifyEmbed
      url={diagram.archify.url}
      mode={mode}
      title={diagram.title}
      describedBy={describedBy}
      fallback={fallback}
    />
  );
}

function RelationshipTranscript({ diagram, compact = false }: ProjectRelationshipDiagramProps & { compact?: boolean }) {
  const entityLabels = new Map(diagram.entities.map(({ id, label }) => [id, label]));

  return (
    <section
      data-relationship-transcript
      aria-label={`${diagram.title} 엔터티와 관계 설명`}
      className={compact ? 'space-y-4' : 'space-y-5 rounded-lg border bg-card p-4 sm:p-5'}
    >
      <div className='space-y-2'>
        <h4 className='font-semibold'>엔터티</h4>
        <ul className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
          {diagram.entities.map((entity) => (
            <li key={entity.id} data-relationship-entity={entity.id} className='rounded-md bg-muted/40 p-3'>
              <p className='flex flex-wrap items-center gap-2 text-sm font-semibold'>
                <span>{entity.label}</span>
                <span className='rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground'>
                  {ENTITY_ROLE_LABELS[entity.role]}
                </span>
              </p>
              <p className='mt-1 text-sm leading-6 text-muted-foreground'>{entity.description}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className='space-y-2'>
        <h4 className='font-semibold'>관계와 cardinality</h4>
        <ul className='space-y-2'>
          {diagram.relationships.map((relationship) => (
            <li
              key={relationship.id}
              data-relationship-relation={relationship.id}
              className='rounded-md border px-3 py-2 text-sm leading-6'
            >
              <p className='font-medium'>
                {entityLabels.get(relationship.from)} → {entityLabels.get(relationship.to)}
                <span className='ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
                  {relationship.cardinality}
                </span>
              </p>
              <p className='mt-1 text-muted-foreground'>{relationship.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ProjectRelationshipDiagram({ diagram }: ProjectRelationshipDiagramProps) {
  const titleId = `${diagram.id}-title`;
  const previewSummaryId = `${diagram.id}-preview-summary`;
  const dialogSummaryId = `${diagram.id}-dialog-summary`;

  return (
    <article
      data-relationship-diagram='preview'
      aria-labelledby={titleId}
      className='min-w-0 space-y-5 rounded-xl border bg-card p-4 sm:p-6'
    >
      <header className='flex flex-col items-start gap-4 sm:flex-row sm:justify-between'>
        <div className='min-w-0'>
          <h3 id={titleId} className='text-xl font-semibold'>
            {diagram.title}
          </h3>
          <p className='mt-2 max-w-3xl text-sm leading-6 text-muted-foreground'>{diagram.purpose}</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              data-relationship-expand
              type='button'
              variant='outline'
              size='sm'
              aria-label={`${diagram.title} 크게 보기`}
            >
              크게 보기
            </Button>
          </DialogTrigger>
          <DialogContent
            data-relationship-dialog
            className='max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto p-4 sm:max-w-[calc(100vw-2rem)] sm:p-6 2xl:max-w-[96rem]'
          >
            <DialogHeader className='pr-10'>
              <DialogTitle>{`${diagram.title} 크게 보기`}</DialogTitle>
              <DialogDescription>{diagram.purpose}</DialogDescription>
            </DialogHeader>
            <figure className='min-w-0 space-y-4'>
              <div
                data-relationship-diagram='dialog'
                className='min-w-0 max-w-full overflow-hidden rounded-lg border bg-muted/20'
              >
                <RelationshipVisual diagram={diagram} mode='dialog' describedBy={dialogSummaryId} />
              </div>
              <RelationshipTranscript diagram={diagram} compact />
              <figcaption
                id={dialogSummaryId}
                className='rounded-lg bg-muted/40 p-4 text-sm leading-6 text-muted-foreground'
              >
                {diagram.textAlternative}
              </figcaption>
            </figure>
          </DialogContent>
        </Dialog>
      </header>

      <figure className='space-y-4'>
        <div className='min-w-0 max-w-full overflow-hidden rounded-lg border bg-muted/20'>
          <RelationshipVisual diagram={diagram} mode='preview' describedBy={previewSummaryId} />
        </div>
        <figcaption id={previewSummaryId} className='rounded-lg bg-muted/40 p-4'>
          <h4 className='font-semibold'>관계 설명</h4>
          <p className='mt-2 text-sm leading-6 text-muted-foreground'>{diagram.summary}</p>
          <p className='mt-2 text-sm leading-6 text-muted-foreground'>{diagram.textAlternative}</p>
        </figcaption>
      </figure>

      <RelationshipTranscript diagram={diagram} />
    </article>
  );
}
