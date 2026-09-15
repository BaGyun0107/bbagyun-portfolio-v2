import { Badge } from '@/components/ui/badge';
import type { FeatureStatus } from '@/data/portfolio';

interface ProjectStatusBadgeProps {
  status: FeatureStatus;
}

const STATUS_PRESENTATION: Record<
  FeatureStatus,
  {
    slug: string;
    variant: 'default' | 'secondary' | 'outline';
  }
> = {
  Production: { slug: 'production', variant: 'default' },
  Beta: { slug: 'beta', variant: 'secondary' },
  Archived: { slug: 'archived', variant: 'outline' },
  'In Progress': { slug: 'in-progress', variant: 'secondary' },
  'On Hold': { slug: 'on-hold', variant: 'outline' }
};

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const presentation = STATUS_PRESENTATION[status];

  return (
    <Badge
      variant={presentation.variant}
      data-project-status={presentation.slug}
      aria-label={`프로젝트 상태: ${status}`}
    >
      {status}
    </Badge>
  );
}
