'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { FeatureSwimlane } from '@/data/portfolio';

import { calculateSwimlaneLayout } from './project-swimlane-layout';
import { ProjectSwimlaneDiagram } from './ProjectSwimlaneDiagram';

export const COMPACT_SWIMLANE_WIDTH = 252;
const MINIMUM_SWIMLANE_FONT_SIZE = 10;

interface ResponsiveSwimlaneDiagramProps {
  swimlane: FeatureSwimlane;
  describedBy: string;
  instanceKey: 'inline' | 'dialog';
}

export const normalizeObservedSwimlaneWidth = (nextWidth: number, currentWidth: number): number => {
  if (!Number.isFinite(nextWidth) || nextWidth <= 0) return currentWidth;
  const roundedWidth = Math.round(nextWidth);
  return roundedWidth === currentWidth ? currentWidth : roundedWidth;
};

export function ResponsiveSwimlaneDiagram({ swimlane, describedBy, instanceKey }: ResponsiveSwimlaneDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(COMPACT_SWIMLANE_WIDTH);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = entry?.contentRect.width;
      if (nextWidth === undefined) return;
      setWidth((currentWidth) => normalizeObservedSwimlaneWidth(nextWidth, currentWidth));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(
    () => calculateSwimlaneLayout(swimlane, { width, minimumFontSize: MINIMUM_SWIMLANE_FONT_SIZE }),
    [swimlane, width]
  );

  return (
    <div ref={containerRef} data-responsive-swimlane={instanceKey} className='min-w-0 w-full max-w-full'>
      <ProjectSwimlaneDiagram swimlane={swimlane} describedBy={describedBy} instanceKey={instanceKey} layout={layout} />
    </div>
  );
}
