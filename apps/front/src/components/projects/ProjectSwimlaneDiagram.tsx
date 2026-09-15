import type { FeatureSwimlane, FeatureSwimlaneNodeShape } from '@/data/portfolio';

import type { SwimlaneEdgeLayout, SwimlaneLayout, SwimlaneNodeLayout, TextLayout } from './project-swimlane-layout';

interface ProjectSwimlaneDiagramProps {
  swimlane: FeatureSwimlane;
  describedBy: string;
  instanceKey: 'inline' | 'dialog';
  layout: SwimlaneLayout;
}

const getFirstLineY = (centerY: number, text: TextLayout): number =>
  centerY - ((text.lines.length - 1) * text.lineHeight) / 2;

function SwimlaneLanes({ layout }: { layout: SwimlaneLayout }) {
  return (
    <g data-swimlane-layer='lanes' aria-hidden='true'>
      {layout.lanes.map(({ lane, x, width, text }) => (
        <g key={lane.id}>
          <rect
            data-swimlane-lane-body={lane.id}
            x={x}
            y={0}
            width={width}
            height={layout.size.height - layout.padding}
            className='fill-card stroke-border'
          />
          <rect
            data-swimlane-lane-header={lane.id}
            x={x}
            y={0}
            width={width}
            height={layout.headerHeight}
            className='fill-muted stroke-border'
          />
          <text
            x={x + width / 2}
            y={getFirstLineY(layout.headerHeight / 2, text)}
            fontSize={text.fontSize}
            textAnchor='middle'
            dominantBaseline='middle'
            className='fill-foreground font-semibold'
          >
            {text.lines.map((line, index) => (
              <tspan key={`${lane.id}-${index}`} x={x + width / 2} dy={index === 0 ? 0 : text.lineHeight}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
      ))}
    </g>
  );
}

function SwimlaneEdges({
  edges,
  normalMarkerId,
  exceptionMarkerId
}: {
  edges: SwimlaneEdgeLayout[];
  normalMarkerId: string;
  exceptionMarkerId: string;
}) {
  return (
    <g data-swimlane-layer='edges' aria-hidden='true'>
      {edges.map(({ edge, path }) => {
        const isException = edge.kind === 'exception';

        return (
          <path
            key={edge.id}
            data-edge-id={edge.id}
            data-edge-kind={edge.kind}
            data-edge-from={edge.from}
            data-edge-to={edge.to}
            d={path}
            fill='none'
            strokeWidth='2'
            strokeLinecap='butt'
            strokeLinejoin='round'
            strokeDasharray={isException ? '8 6' : undefined}
            markerEnd={`url(#${isException ? exceptionMarkerId : normalMarkerId})`}
            className={isException ? 'stroke-destructive dark:stroke-destructive-foreground' : 'stroke-foreground'}
          />
        );
      })}
    </g>
  );
}

function SwimlaneEdgeLabels({ edges }: { edges: SwimlaneEdgeLayout[] }) {
  return (
    <g data-swimlane-layer='edge-labels' aria-hidden='true'>
      {edges.map(({ edge, label }) => {
        if (!label) return null;
        const isException = edge.kind === 'exception';
        const firstLineY = label.y - ((label.lines.length - 1) * label.lineHeight) / 2;

        return (
          <g
            key={edge.id}
            data-edge-label={edge.id}
            data-label-placement={label.placement}
            data-label-track={label.track}
          >
            <rect
              x={label.x - label.width / 2}
              y={label.y - label.height / 2}
              width={label.width}
              height={label.height}
              rx={label.height / 2}
              strokeWidth='1'
              className='fill-card stroke-border'
            />
            <text
              x={label.x}
              y={firstLineY}
              fontSize={label.fontSize}
              textAnchor='middle'
              dominantBaseline='middle'
              className={
                isException
                  ? 'fill-destructive font-semibold dark:fill-destructive-foreground'
                  : 'fill-foreground font-semibold'
              }
            >
              {label.lines.map((line, index) => (
                <tspan key={`${edge.id}-${index}`} x={label.x} dy={index === 0 ? 0 : label.lineHeight}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </g>
  );
}

const getNodeClassName = (shape: FeatureSwimlaneNodeShape): string =>
  shape === 'stop' ? 'fill-card stroke-destructive dark:stroke-destructive-foreground' : 'fill-card stroke-foreground';

function SwimlaneNodeShape({ node }: { node: SwimlaneNodeLayout }) {
  const { step } = node;
  const sharedClassName = getNodeClassName(step.shape);

  if (step.shape === 'decision') {
    const points = [
      `${node.x},${node.y - node.height / 2}`,
      `${node.x + node.width / 2},${node.y}`,
      `${node.x},${node.y + node.height / 2}`,
      `${node.x - node.width / 2},${node.y}`
    ].join(' ');

    return <polygon points={points} strokeWidth='2' className={sharedClassName} />;
  }

  const radius = step.shape === 'start' || step.shape === 'end' ? node.height / 2 : step.shape === 'stop' ? 0 : 8;

  return (
    <rect
      x={node.x - node.width / 2}
      y={node.y - node.height / 2}
      width={node.width}
      height={node.height}
      rx={radius}
      strokeWidth='2'
      className={sharedClassName}
    />
  );
}

function SwimlaneNodeShapes({ nodes }: { nodes: SwimlaneNodeLayout[] }) {
  return (
    <g data-swimlane-layer='node-shapes' aria-hidden='true'>
      {nodes.map((node) => (
        <g key={node.step.id} data-swimlane-step={node.step.id} data-node-shape={node.step.shape}>
          <title>{`${node.step.label}: ${node.step.description}`}</title>
          <SwimlaneNodeShape node={node} />
        </g>
      ))}
    </g>
  );
}

function SwimlaneNodeLabels({ nodes }: { nodes: SwimlaneNodeLayout[] }) {
  return (
    <g data-swimlane-layer='node-labels' aria-hidden='true'>
      {nodes.map((node) => {
        const firstLineY = getFirstLineY(node.y, node.text);
        return (
          <text
            key={node.step.id}
            data-swimlane-node-label={node.step.id}
            x={node.x}
            y={firstLineY}
            fontSize={node.text.fontSize}
            textAnchor='middle'
            dominantBaseline='middle'
            className='pointer-events-none fill-foreground font-semibold'
          >
            {node.text.lines.map((line, index) => (
              <tspan key={`${node.step.id}-${index}`} x={node.x} dy={index === 0 ? 0 : node.text.lineHeight}>
                {line}
              </tspan>
            ))}
          </text>
        );
      })}
    </g>
  );
}

export function ProjectSwimlaneDiagram({ swimlane, describedBy, instanceKey, layout }: ProjectSwimlaneDiagramProps) {
  const { width, height } = layout.size;
  const titleId = `${swimlane.id}-${instanceKey}-diagram-title`;
  const descriptionId = `${swimlane.id}-${instanceKey}-diagram-description`;
  const normalMarkerId = `${swimlane.id}-${instanceKey}-normal-arrow`;
  const exceptionMarkerId = `${swimlane.id}-${instanceKey}-exception-arrow`;
  const accessibleName =
    instanceKey === 'inline' ? `${swimlane.title} 전체 흐름 미리보기` : `${swimlane.title} 전체 흐름 크게 보기`;

  return (
    <svg
      data-swimlane-view={instanceKey}
      data-swimlane-layout-width={width}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className='block h-auto w-full max-w-full'
      role='img'
      aria-labelledby={titleId}
      aria-describedby={`${descriptionId} ${describedBy}`}
    >
      <title id={titleId}>{accessibleName}</title>
      <desc id={descriptionId}>{swimlane.purpose}</desc>
      <defs>
        <marker
          id={normalMarkerId}
          markerWidth='6'
          markerHeight='6'
          refX='6'
          refY='3'
          orient='auto'
          markerUnits='userSpaceOnUse'
        >
          <path d='M0,0 L6,3 L0,6 Z' className='fill-foreground' />
        </marker>
        <marker
          id={exceptionMarkerId}
          markerWidth='6'
          markerHeight='6'
          refX='6'
          refY='3'
          orient='auto'
          markerUnits='userSpaceOnUse'
        >
          <path d='M0,0 L6,3 L0,6 Z' className='fill-destructive dark:fill-destructive-foreground' />
        </marker>
      </defs>

      <SwimlaneLanes layout={layout} />
      <SwimlaneNodeShapes nodes={layout.nodes} />
      <SwimlaneEdges edges={layout.edges} normalMarkerId={normalMarkerId} exceptionMarkerId={exceptionMarkerId} />
      <SwimlaneNodeLabels nodes={layout.nodes} />
      <SwimlaneEdgeLabels edges={layout.edges} />
    </svg>
  );
}
