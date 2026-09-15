import type {
  FeatureSwimlane,
  FeatureSwimlaneEdge,
  FeatureSwimlaneNodeShape,
  FeatureSwimlanePoint,
  FeatureSwimlaneStep
} from './types/feature-detail.dto';

export const SWIMLANE_LANE_WIDTH = 220;
export const SWIMLANE_HEADER_HEIGHT = 70;
export const SWIMLANE_ROW_HEIGHT = 110;
export const SWIMLANE_DIAGRAM_PADDING = 30;
export const SWIMLANE_EDGE_OBSTACLE_CLEARANCE = 12;

export const SWIMLANE_NODE_SIZE: Readonly<
  Record<FeatureSwimlaneNodeShape, Readonly<{ width: number; height: number }>>
> = {
  process: { width: 150, height: 58 },
  stop: { width: 150, height: 58 },
  decision: { width: 120, height: 76 },
  start: { width: 150, height: 50 },
  end: { width: 150, height: 50 }
};

export const findWaypointCollisionStep = (
  swimlane: FeatureSwimlane,
  edge: FeatureSwimlaneEdge,
  point: FeatureSwimlanePoint
): FeatureSwimlaneStep | undefined => {
  if (!Number.isFinite(point.column) || !Number.isFinite(point.row)) return undefined;

  return swimlane.steps.find((step) => {
    if (step.id === edge.from || step.id === edge.to) return false;

    const laneIndex = swimlane.lanes.findIndex(({ id }) => id === step.laneId);
    if (laneIndex < 0 || !Number.isFinite(step.row)) return false;

    const nodeSize = SWIMLANE_NODE_SIZE[step.shape];
    if (!nodeSize) return false;

    const horizontalDistance = Math.abs(point.column - laneIndex) * SWIMLANE_LANE_WIDTH;
    const verticalDistance = Math.abs(point.row - step.row) * SWIMLANE_ROW_HEIGHT;

    return (
      horizontalDistance < nodeSize.width / 2 + SWIMLANE_EDGE_OBSTACLE_CLEARANCE &&
      verticalDistance < nodeSize.height / 2 + SWIMLANE_EDGE_OBSTACLE_CLEARANCE
    );
  });
};
