import { ArrowDown, ArrowRight, RotateCcw } from 'lucide-react';

import type {
  InsightArchitecturePanel,
  InsightBeforeAfterVisual,
  InsightDataFlowEdgeOutcome,
  InsightDataFlowNodeRole,
  InsightDataFlowVisual
} from '@/data/portfolio';
import type {
  InsightArchitectureActorRole,
  InsightArchitectureConnectionScope
} from '@/data/portfolio/types/insight.dto';

const outcomeStyle: Record<InsightDataFlowEdgeOutcome, string> = {
  normal: 'border-border bg-muted/40 text-foreground',
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
  failure: 'border-destructive/40 bg-destructive/10 text-destructive',
  retry: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200'
};

const nodeStyle = {
  state: 'border-sky-500/40 bg-sky-500/10',
  data: 'border-violet-500/40 bg-violet-500/10',
  action: 'border-primary/40 bg-primary/5',
  terminal: 'border-border bg-background'
} as const;

const nodeRoleLabel: Record<InsightDataFlowNodeRole, string> = {
  state: '기준 상태',
  data: '입력',
  action: '처리',
  terminal: '결과'
};

const actorRoleStyle: Record<InsightArchitectureActorRole, string> = {
  server: 'border-border bg-muted/40',
  room: 'border-border bg-muted/40',
  recipient: 'border-border bg-muted/40',
  unrelated: 'border-destructive/50 border-dashed bg-destructive/5 text-destructive',
  source: 'border-primary/40 bg-primary/5 text-foreground',
  relay: 'border-border border-dashed bg-muted/40 text-muted-foreground',
  boundary: 'border-primary/40 bg-primary/10 text-foreground',
  consumer: 'border-border bg-background text-foreground'
};

const actorRoleLabel: Partial<Record<InsightArchitectureActorRole, string>> = {
  source: '상태 소유자',
  relay: '중간 전달',
  boundary: '생명주기 경계',
  consumer: '상태 사용 지점'
};

const connectionScopeStyle: Record<InsightArchitectureConnectionScope, string> = {
  intended: 'border-primary/30 bg-primary/5',
  overbroad: 'border-destructive/40 border-dashed bg-destructive/5',
  indirect: 'border-border border-dashed bg-muted/40 text-muted-foreground',
  direct: 'border-primary/40 bg-primary/10 text-foreground'
};

const connectionScopeLabel: Partial<Record<InsightArchitectureConnectionScope, string>> = {
  indirect: '간접 전달',
  direct: '직접 연결'
};

export function InsightDataFlowDiagram({ visual }: { visual: InsightDataFlowVisual }) {
  const nodes = new Map(visual.nodes.map((node) => [node.id, node]));

  return (
    <div data-insight-visual='data-flow' className='min-w-0 space-y-5'>
      <ol className='grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2'>
        {visual.nodes.map((node) => (
          <li
            key={node.id}
            data-insight-node={node.id}
            className={`min-w-0 rounded-xl border p-4 ${nodeStyle[node.role]}`}
          >
            <span className='text-xs font-semibold text-muted-foreground'>{nodeRoleLabel[node.role]}</span>
            <strong className='mt-1 block break-words text-sm'>{node.label}</strong>
            <span className='mt-1 block break-words text-xs leading-5 text-muted-foreground'>{node.detail}</span>
          </li>
        ))}
      </ol>

      <ul aria-label={`${visual.title} 연결 관계`} className='grid min-w-0 grid-cols-1 gap-2'>
        {visual.edges.map((edge) => (
          <li
            key={edge.id}
            data-insight-edge={edge.id}
            data-edge-outcome={edge.outcome}
            className={`grid min-w-0 grid-cols-1 items-center gap-2 rounded-lg border px-3 py-2 text-xs sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] ${outcomeStyle[edge.outcome]}`}
          >
            <span className='min-w-0 break-words text-center font-medium sm:text-right'>
              {nodes.get(edge.from)?.label}
            </span>
            <span className='flex min-w-0 flex-col items-center gap-1 font-semibold'>
              {edge.outcome === 'retry' ? (
                <RotateCcw aria-hidden='true' className='h-3.5 w-3.5' />
              ) : (
                <>
                  <ArrowDown aria-hidden='true' className='h-3.5 w-3.5 sm:hidden' />
                  <ArrowRight aria-hidden='true' className='hidden h-3.5 w-3.5 sm:block' />
                </>
              )}
              <span className='break-words text-center'>{edge.label}</span>
            </span>
            <span className='min-w-0 break-words text-center font-medium sm:text-left'>
              {nodes.get(edge.to)?.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ArchitecturePanel({
  panel,
  visualId,
  showActorRoleLabels
}: {
  panel: InsightArchitecturePanel;
  visualId: string;
  showActorRoleLabels: boolean;
}) {
  const actors = new Map(panel.actors.map((actor) => [actor.id, actor]));
  const titleId = `${visualId}-${panel.id}-title`;

  return (
    <section
      data-insight-panel={panel.id}
      aria-labelledby={titleId}
      className='min-w-0 rounded-xl border bg-background p-4'
    >
      <div className='mb-4 min-w-0'>
        <p className='text-xs font-semibold uppercase tracking-wide text-primary'>
          {panel.id === 'before' ? 'Before' : 'After'}
        </p>
        <h4 id={titleId} className='mt-1 break-words text-base font-semibold'>
          {panel.title}
        </h4>
        <p className='mt-1 break-words text-sm leading-6 text-muted-foreground'>{panel.summary}</p>
      </div>

      <ol className='grid min-w-0 grid-cols-1 gap-2'>
        {panel.actors.map((actor) => (
          <li
            key={actor.id}
            data-insight-actor={`${panel.id}:${actor.id}`}
            data-actor-role={actor.role}
            className={`min-w-0 rounded-lg border px-3 py-2 text-center text-sm font-medium ${actorRoleStyle[actor.role]}`}
          >
            <span className='break-words'>{actor.label}</span>
            {showActorRoleLabels && actorRoleLabel[actor.role] ? (
              <span className='mt-1 block break-words text-xs font-semibold text-muted-foreground'>
                {actorRoleLabel[actor.role]}
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      <ArrowDown aria-hidden='true' className='mx-auto my-3 h-4 w-4 text-muted-foreground' />

      <ul aria-label={`${panel.title} 연결 관계`} className='grid min-w-0 grid-cols-1 gap-2'>
        {panel.connections.map((connection) => (
          <li
            key={connection.id}
            data-insight-connection={`${panel.id}:${connection.id}`}
            data-connection-scope={connection.scope}
            className={`min-w-0 rounded-lg border px-3 py-2 text-xs ${connectionScopeStyle[connection.scope]}`}
          >
            {connectionScopeLabel[connection.scope] ? (
              <span className='mb-2 block break-words text-center font-semibold'>
                {connectionScopeLabel[connection.scope]}
              </span>
            ) : null}
            <span className='grid min-w-0 grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]'>
              <span className='break-words text-center sm:text-right'>{actors.get(connection.from)?.label}</span>
              <span className='break-words text-center font-semibold'>
                <span className='sm:hidden'>{connection.label} ↓</span>
                <span className='hidden sm:inline'>{connection.label} →</span>
              </span>
              <span className='break-words text-center sm:text-left'>{actors.get(connection.to)?.label}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function InsightBeforeAfterDiagram({ visual }: { visual: InsightBeforeAfterVisual }) {
  return (
    <div data-insight-visual='before-after' className='grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2'>
      {visual.panels.map((panel) => (
        <ArchitecturePanel
          key={panel.id}
          panel={panel}
          visualId={visual.id}
          showActorRoleLabels={visual.showActorRoleLabels !== false}
        />
      ))}
    </div>
  );
}
