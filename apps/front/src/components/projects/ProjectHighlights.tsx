import type { FeatureMetric, FeatureMetricKind } from '@/data/portfolio';

const METRIC_KIND_LABEL: Record<FeatureMetricKind, string> = {
  measured: '측정값',
  reported: '사용자 보고값',
  estimated: '공개 가격 추정값'
};

const METRIC_SCOPE_LABEL: Record<FeatureMetricKind, string> = {
  measured: '측정 범위',
  reported: '관찰 범위',
  estimated: '산정 범위'
};

interface ProjectHighlightsProps {
  highlights: FeatureMetric[];
}

export function ProjectHighlights({ highlights }: ProjectHighlightsProps) {
  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      {highlights.map((highlight) => (
        <article key={highlight.id} className='rounded-xl border bg-card p-5 text-card-foreground'>
          <p className='text-sm text-muted-foreground'>{highlight.label}</p>
          <p className='mt-2 text-2xl font-semibold tracking-tight'>{highlight.value}</p>
          <dl className='mt-4 space-y-2 text-sm'>
            <div className='flex flex-wrap gap-x-2'>
              <dt className='font-medium'>근거 종류</dt>
              <dd className='text-muted-foreground'>{METRIC_KIND_LABEL[highlight.kind]}</dd>
            </div>
            <div className='flex flex-wrap gap-x-2'>
              <dt className='font-medium'>기준 시점</dt>
              <dd className='text-muted-foreground'>{highlight.asOf}</dd>
            </div>
          </dl>
          <p className='mt-3 text-sm leading-6 text-muted-foreground'>{highlight.evidence}</p>
          {highlight.caveat ? (
            <p className='mt-3 border-l-2 border-border pl-3 text-xs leading-5 text-muted-foreground'>
              <span className='font-medium text-foreground'>{METRIC_SCOPE_LABEL[highlight.kind]}:</span>{' '}
              {highlight.caveat}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
