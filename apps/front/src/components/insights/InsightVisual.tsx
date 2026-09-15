import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import type { InsightVisual as InsightVisualData } from '@/data/portfolio';

import { InsightBeforeAfterDiagram, InsightDataFlowDiagram } from './InsightVisualDiagram';

interface InsightVisualProps {
  visual: InsightVisualData;
}

const renderDiagram = (visual: InsightVisualData) =>
  visual.variant === 'data-flow' ? (
    <InsightDataFlowDiagram visual={visual} />
  ) : (
    <InsightBeforeAfterDiagram visual={visual} />
  );

export function InsightVisual({ visual }: InsightVisualProps) {
  const titleId = `${visual.id}-title`;
  const descriptionId = `${visual.id}-description`;
  const dialogVisual = { ...visual, id: `${visual.id}-dialog` } as InsightVisualData;

  return (
    <Dialog>
      <figure
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className='not-prose my-8 min-w-0 overflow-hidden rounded-2xl border bg-card p-4 text-card-foreground shadow-sm sm:p-6'
      >
        <figcaption className='mb-5 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='min-w-0'>
            <h2 id={titleId} className='break-words text-xl font-semibold'>
              {visual.title}
            </h2>
            <p className='mt-2 break-words text-sm font-medium leading-6'>{visual.question}</p>
            <p id={descriptionId} className='mt-2 break-words text-sm leading-6 text-muted-foreground'>
              {visual.textAlternative}
            </p>
          </div>
          <DialogTrigger asChild>
            <Button
              type='button'
              variant='outline'
              size='sm'
              aria-label={`${visual.title} 크게 보기`}
              className='self-start'
            >
              크게 보기
            </Button>
          </DialogTrigger>
        </figcaption>

        {renderDiagram(visual)}
      </figure>

      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[min(72rem,calc(100%-2rem))]'>
        <DialogHeader className='pr-8'>
          <DialogTitle>{visual.title}</DialogTitle>
          <DialogDescription className='leading-6'>{visual.question}</DialogDescription>
        </DialogHeader>
        <p className='break-words text-sm leading-6 text-muted-foreground'>{visual.textAlternative}</p>
        <div className='min-w-0'>{renderDiagram(dialogVisual)}</div>
      </DialogContent>
    </Dialog>
  );
}
