import type { FeatureDemo } from '@/data/portfolio';

interface ProjectDemoLinkProps {
  demo?: FeatureDemo;
}

export function ProjectDemoLink(_props: ProjectDemoLinkProps) {
  const { demo } = _props;

  if (!demo || demo.status !== 'available') return null;

  return (
    <div className='space-y-2'>
      <a
        href={demo.url}
        target='_blank'
        rel='noopener noreferrer'
        aria-label={`${demo.label} (새 창에서 열림)`}
        className='inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      >
        {demo.label}
        <span aria-hidden='true' className='ml-2'>
          ↗
        </span>
      </a>
      {demo.note ? <p className='text-sm text-muted-foreground'>{demo.note}</p> : null}
    </div>
  );
}
