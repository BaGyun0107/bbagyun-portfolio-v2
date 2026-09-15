import type {
  FeatureSwimlane,
  FeatureSwimlaneAnchor,
  FeatureSwimlaneEdge,
  FeatureSwimlaneNodeShape,
  FeatureSwimlanePoint,
  FeatureSwimlaneStep
} from '@/data/portfolio';
import {
  findWaypointCollisionStep,
  SWIMLANE_DIAGRAM_PADDING,
  SWIMLANE_EDGE_OBSTACLE_CLEARANCE,
  SWIMLANE_HEADER_HEIGHT,
  SWIMLANE_LANE_WIDTH,
  SWIMLANE_NODE_SIZE,
  SWIMLANE_ROW_HEIGHT
} from '@/data/portfolio/swimlane-geometry';

export const LANE_WIDTH = SWIMLANE_LANE_WIDTH;
export const HEADER_HEIGHT = SWIMLANE_HEADER_HEIGHT;
export const ROW_HEIGHT = SWIMLANE_ROW_HEIGHT;
export const DIAGRAM_PADDING = SWIMLANE_DIAGRAM_PADDING;
export const EDGE_CORNER_RADIUS = 8;
export const EDGE_END_SEGMENT_LENGTH = 10;
export const EDGE_LABEL_HEIGHT = 24;
export const EDGE_LABEL_LINE_HEIGHT = 16;

const EDGE_LABEL_HORIZONTAL_PADDING = 10;
const EDGE_LABEL_VERTICAL_PADDING = 4;
const EDGE_LABEL_CJK_CHARACTER_WIDTH = 12;
const EDGE_LABEL_LATIN_CHARACTER_WIDTH = 7;
const EDGE_LABEL_SPACE_WIDTH = 4;
const EDGE_LABEL_MINIMUM_WIDTH = 40;
const CJK_CHARACTER_PATTERN = /[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}]/u;
const EDGE_OBSTACLE_CLEARANCE = SWIMLANE_EDGE_OBSTACLE_CLEARANCE;
const EDGE_DOGLEG_OFFSET = 24;

export interface SvgPoint {
  x: number;
  y: number;
}

export interface NodeGeometry extends SvgPoint {
  width: number;
  height: number;
}

export interface DiagramSize {
  width: number;
  height: number;
}

export interface ResolvedEdgeAnchors {
  fromAnchor: FeatureSwimlaneAnchor;
  toAnchor: FeatureSwimlaneAnchor;
  fromPoint: SvgPoint;
  toPoint: SvgPoint;
}

export interface EdgeLabelGeometry extends SvgPoint {
  width: number;
  height: number;
  text: string;
  lines: string[];
}

const NODE_SIZE: Record<FeatureSwimlaneNodeShape, Pick<NodeGeometry, 'width' | 'height'>> = SWIMLANE_NODE_SIZE;

export const getGridPoint = ({ column, row }: FeatureSwimlanePoint): SvgPoint => ({
  x: DIAGRAM_PADDING + column * LANE_WIDTH + LANE_WIDTH / 2,
  y: HEADER_HEIGHT + ROW_HEIGHT / 2 + row * ROW_HEIGHT
});

export const getAnchorPoint = (node: NodeGeometry, anchor: FeatureSwimlaneAnchor): SvgPoint => {
  if (anchor === 'top') return { x: node.x, y: node.y - node.height / 2 };
  if (anchor === 'right') return { x: node.x + node.width / 2, y: node.y };
  if (anchor === 'bottom') return { x: node.x, y: node.y + node.height / 2 };
  return { x: node.x - node.width / 2, y: node.y };
};

export const getNodeGeometry = (step: FeatureSwimlaneStep, laneIndex: number): NodeGeometry => ({
  ...getGridPoint({ column: laneIndex, row: step.row }),
  ...NODE_SIZE[step.shape]
});

export const getDiagramSize = (swimlane: FeatureSwimlane): DiagramSize => {
  const maximumRow = Math.max(0, ...swimlane.steps.map(({ row }) => row));

  return {
    width: DIAGRAM_PADDING * 2 + swimlane.lanes.length * LANE_WIDTH,
    height: HEADER_HEIGHT + (maximumRow + 1) * ROW_HEIGHT + DIAGRAM_PADDING
  };
};

const getStepGeometry = (swimlane: FeatureSwimlane, stepId: string): NodeGeometry => {
  const step = swimlane.steps.find(({ id }) => id === stepId);
  if (!step) throw new Error(`존재하지 않는 step "${stepId}"의 geometry를 계산할 수 없습니다.`);

  const laneIndex = swimlane.lanes.findIndex(({ id }) => id === step.laneId);
  if (laneIndex < 0) throw new Error(`존재하지 않는 lane "${step.laneId}"의 geometry를 계산할 수 없습니다.`);

  return getNodeGeometry(step, laneIndex);
};

const getAutomaticAnchors = (
  fromNode: NodeGeometry,
  toNode: NodeGeometry
): Pick<ResolvedEdgeAnchors, 'fromAnchor' | 'toAnchor'> => {
  const horizontalDistance = toNode.x - fromNode.x;
  const verticalDistance = toNode.y - fromNode.y;

  if (Math.abs(horizontalDistance) >= Math.abs(verticalDistance)) {
    return horizontalDistance >= 0
      ? { fromAnchor: 'right', toAnchor: 'left' }
      : { fromAnchor: 'left', toAnchor: 'right' };
  }

  return verticalDistance >= 0 ? { fromAnchor: 'bottom', toAnchor: 'top' } : { fromAnchor: 'top', toAnchor: 'bottom' };
};

export const getResolvedEdgeAnchors = (swimlane: FeatureSwimlane, edge: FeatureSwimlaneEdge): ResolvedEdgeAnchors => {
  const fromNode = getStepGeometry(swimlane, edge.from);
  const toNode = getStepGeometry(swimlane, edge.to);
  const automaticAnchors = getAutomaticAnchors(fromNode, toNode);
  const fromAnchor = edge.fromAnchor ?? automaticAnchors.fromAnchor;
  const toAnchor = edge.toAnchor ?? automaticAnchors.toAnchor;

  return {
    fromAnchor,
    toAnchor,
    fromPoint: getAnchorPoint(fromNode, fromAnchor),
    toPoint: getAnchorPoint(toNode, toAnchor)
  };
};

const getAnchorNormal = (anchor: FeatureSwimlaneAnchor): SvgPoint => {
  if (anchor === 'top') return { x: 0, y: -1 };
  if (anchor === 'right') return { x: 1, y: 0 };
  if (anchor === 'bottom') return { x: 0, y: 1 };
  return { x: -1, y: 0 };
};

const movePoint = (point: SvgPoint, direction: SvgPoint, distance: number): SvgPoint => ({
  x: point.x + direction.x * distance,
  y: point.y + direction.y * distance
});

const pointKey = ({ x, y }: SvgPoint): string => `${x}:${y}`;

const isSamePoint = (left: SvgPoint, right: SvgPoint): boolean => left.x === right.x && left.y === right.y;

const getSegmentAxis = (from: SvgPoint, to: SvgPoint): 'horizontal' | 'vertical' =>
  from.y === to.y ? 'horizontal' : 'vertical';

const appendOrthogonalPoint = (points: SvgPoint[], target: SvgPoint): void => {
  const current = points.at(-1);
  if (!current || isSamePoint(current, target)) return;

  if (current.x === target.x || current.y === target.y) {
    points.push(target);
    return;
  }

  const previous = points.at(-2);
  const previousAxis = previous ? getSegmentAxis(previous, current) : 'horizontal';
  const corner = previousAxis === 'horizontal' ? { x: target.x, y: current.y } : { x: current.x, y: target.y };

  if (!isSamePoint(current, corner)) points.push(corner);
  if (!isSamePoint(points.at(-1)!, target)) points.push(target);
};

const compactOrthogonalPoints = (points: SvgPoint[], protectedPoints: Set<string>): SvgPoint[] => {
  const uniquePoints = points.filter((point, index) => index === 0 || !isSamePoint(point, points[index - 1]));
  const compacted: SvgPoint[] = [];

  uniquePoints.forEach((point) => {
    const before = compacted.at(-2);
    const middle = compacted.at(-1);
    const isProtected = middle ? protectedPoints.has(pointKey(middle)) : false;

    if (
      before &&
      middle &&
      !isProtected &&
      ((before.x === middle.x && middle.x === point.x) || (before.y === middle.y && middle.y === point.y))
    ) {
      compacted[compacted.length - 1] = point;
      return;
    }

    compacted.push(point);
  });

  return compacted;
};

interface ObstacleRect {
  id: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const getObstacleRects = (swimlane: FeatureSwimlane, edge: FeatureSwimlaneEdge): ObstacleRect[] =>
  swimlane.steps
    .filter(({ id }) => id !== edge.from && id !== edge.to)
    .map((step) => {
      const laneIndex = swimlane.lanes.findIndex(({ id }) => id === step.laneId);
      const node = getNodeGeometry(step, laneIndex);

      return {
        id: step.id,
        left: node.x - node.width / 2 - EDGE_OBSTACLE_CLEARANCE,
        right: node.x + node.width / 2 + EDGE_OBSTACLE_CLEARANCE,
        top: node.y - node.height / 2 - EDGE_OBSTACLE_CLEARANCE,
        bottom: node.y + node.height / 2 + EDGE_OBSTACLE_CLEARANCE
      };
    });

const segmentIntersectsRect = (from: SvgPoint, to: SvgPoint, rect: ObstacleRect): boolean => {
  if (from.y === to.y) {
    return (
      from.y > rect.top &&
      from.y < rect.bottom &&
      Math.max(from.x, to.x) > rect.left &&
      Math.min(from.x, to.x) < rect.right
    );
  }

  return (
    from.x > rect.left &&
    from.x < rect.right &&
    Math.max(from.y, to.y) > rect.top &&
    Math.min(from.y, to.y) < rect.bottom
  );
};

const getPathScore = (points: SvgPoint[], obstacles: ObstacleRect[], diagramSize: DiagramSize): number => {
  let score = 0;

  for (let index = 1; index < points.length; index += 1) {
    score += getDistance(points[index - 1], points[index]);
    score +=
      obstacles.filter((obstacle) => segmentIntersectsRect(points[index - 1], points[index], obstacle)).length * 10_000;
  }

  for (let index = 2; index < points.length; index += 1) {
    const before = points[index - 2];
    const middle = points[index - 1];
    const after = points[index];
    const incoming = { x: middle.x - before.x, y: middle.y - before.y };
    const outgoing = { x: after.x - middle.x, y: after.y - middle.y };
    if (incoming.x * outgoing.x + incoming.y * outgoing.y < 0 && incoming.x * outgoing.y === incoming.y * outgoing.x) {
      score += 100_000;
    }
  }

  score +=
    points.filter(
      ({ x, y }) =>
        x < DIAGRAM_PADDING / 2 ||
        x > diagramSize.width - DIAGRAM_PADDING / 2 ||
        y < HEADER_HEIGHT ||
        y > diagramSize.height
    ).length * 1_000;

  return score;
};

const expandHairpins = (points: SvgPoint[], obstacles: ObstacleRect[], diagramSize: DiagramSize): SvgPoint[] => {
  if (points.length < 3) return points;
  const expanded = [points[0]];

  for (let index = 1; index < points.length - 1; index += 1) {
    const before = expanded.at(-1)!;
    const middle = points[index];
    const after = points[index + 1];
    const incoming = { x: middle.x - before.x, y: middle.y - before.y };
    const outgoing = { x: after.x - middle.x, y: after.y - middle.y };
    const isReversal =
      incoming.x * outgoing.x + incoming.y * outgoing.y < 0 && incoming.x * outgoing.y === incoming.y * outgoing.x;

    if (!isReversal) {
      expanded.push(middle);
      continue;
    }

    const candidates =
      incoming.x === 0
        ? [-EDGE_DOGLEG_OFFSET, EDGE_DOGLEG_OFFSET].map((offset) => [
            before,
            { x: before.x + offset, y: before.y },
            { x: middle.x + offset, y: middle.y },
            middle
          ])
        : [-EDGE_DOGLEG_OFFSET, EDGE_DOGLEG_OFFSET].map((offset) => [
            before,
            { x: before.x, y: before.y + offset },
            { x: middle.x, y: middle.y + offset },
            middle
          ]);
    const beforeBefore = expanded.at(-2);
    const scoreCandidate = (candidate: SvgPoint[]) =>
      getPathScore(beforeBefore ? [beforeBefore, ...candidate] : candidate, obstacles, diagramSize);
    const [, ...detour] = candidates.sort((left, right) => scoreCandidate(left) - scoreCandidate(right))[0];
    expanded.push(...detour);
  }

  expanded.push(points.at(-1)!);
  return expanded;
};

const avoidObstacleIntersections = (
  initialPoints: SvgPoint[],
  obstacles: ObstacleRect[],
  diagramSize: DiagramSize
): SvgPoint[] => {
  let points = initialPoints;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    let replacement: SvgPoint[] | null = null;
    let replacementIndex = -1;

    for (let index = 1; index < points.length; index += 1) {
      const from = points[index - 1];
      const to = points[index];
      const obstacle = obstacles.find((candidate) => segmentIntersectsRect(from, to, candidate));
      if (!obstacle) continue;

      const candidates =
        from.y === to.y
          ? [obstacle.top, obstacle.bottom].map((y) => [from, { x: from.x, y }, { x: to.x, y }, to])
          : [obstacle.left, obstacle.right].map((x) => [from, { x, y: from.y }, { x, y: to.y }, to]);
      replacement = candidates.sort(
        (left, right) => getPathScore(left, obstacles, diagramSize) - getPathScore(right, obstacles, diagramSize)
      )[0];
      replacementIndex = index;
      break;
    }

    if (!replacement) return points;
    points = [...points.slice(0, replacementIndex), ...replacement, ...points.slice(replacementIndex + 1)];
  }

  throw new Error('노드 내부를 통과하지 않는 직교 경로를 계산할 수 없습니다.');
};

export const getEdgePoints = (swimlane: FeatureSwimlane, edge: FeatureSwimlaneEdge): SvgPoint[] => {
  const { fromAnchor, toAnchor, fromPoint, toPoint } = getResolvedEdgeAnchors(swimlane, edge);
  const fromExit = movePoint(fromPoint, getAnchorNormal(fromAnchor), EDGE_END_SEGMENT_LENGTH);
  const toApproach = movePoint(toPoint, getAnchorNormal(toAnchor), EDGE_END_SEGMENT_LENGTH + EDGE_CORNER_RADIUS);
  const waypoints = edge.waypoints?.map(getGridPoint) ?? [];
  const obstacles = getObstacleRects(swimlane, edge);
  const diagramSize = getDiagramSize(swimlane);
  const blockedWaypointIndex = edge.waypoints?.findIndex((point) => findWaypointCollisionStep(swimlane, edge, point));

  if (blockedWaypointIndex !== undefined && blockedWaypointIndex >= 0) {
    const blockedStep = findWaypointCollisionStep(swimlane, edge, edge.waypoints![blockedWaypointIndex])!;
    throw new Error(`waypoint가 step "${blockedStep.id}" 내부에 있어 경로를 계산할 수 없습니다.`);
  }

  const points = [fromPoint, fromExit];

  [...waypoints, toApproach].forEach((point) => appendOrthogonalPoint(points, point));
  appendOrthogonalPoint(points, toPoint);

  const protectedPoints = new Set(waypoints.map(pointKey));
  const compacted = compactOrthogonalPoints(points, protectedPoints);
  const withoutHairpins = expandHairpins(compacted, obstacles, diagramSize);
  const obstacleSafe = avoidObstacleIntersections(withoutHairpins, obstacles, diagramSize);
  const routed = expandHairpins(compactOrthogonalPoints(obstacleSafe, protectedPoints), obstacles, diagramSize);
  const beforeTarget = routed.at(-2)!;
  const finalVector = { x: toPoint.x - beforeTarget.x, y: toPoint.y - beforeTarget.y };
  const inwardNormal = getAnchorNormal(toAnchor);
  const finalLength = getDistance(beforeTarget, toPoint);
  const isPerpendicularArrival =
    finalLength >= EDGE_END_SEGMENT_LENGTH &&
    finalVector.x * inwardNormal.y === finalVector.y * inwardNormal.x &&
    finalVector.x * inwardNormal.x + finalVector.y * inwardNormal.y < 0;

  if (isPerpendicularArrival) return routed;

  return expandHairpins([...routed.slice(0, -1), toApproach, toPoint], obstacles, diagramSize);
};

const formatCoordinate = (value: number): string => Number(value.toFixed(2)).toString();

const formatPoint = ({ x, y }: SvgPoint): string => `${formatCoordinate(x)} ${formatCoordinate(y)}`;

const getDistance = (from: SvgPoint, to: SvgPoint): number => Math.hypot(to.x - from.x, to.y - from.y);

const getRoundedCornerRadius = (points: SvgPoint[], cornerIndex: number, radius = EDGE_CORNER_RADIUS): number => {
  const previous = points[cornerIndex - 1];
  const corner = points[cornerIndex];
  const next = points[cornerIndex + 1];
  const finalArrivalAllowance =
    cornerIndex === points.length - 2
      ? Math.max(0, getDistance(corner, next) - EDGE_END_SEGMENT_LENGTH)
      : Number.POSITIVE_INFINITY;

  return Math.min(radius, getDistance(previous, corner) / 2, getDistance(corner, next) / 2, finalArrivalAllowance);
};

export const getRoundedFinalStraightLength = (points: SvgPoint[], radius = EDGE_CORNER_RADIUS): number => {
  if (points.length < 2) return 0;
  const finalLength = getDistance(points.at(-2)!, points.at(-1)!);
  if (points.length < 3) return finalLength;

  return finalLength - getRoundedCornerRadius(points, points.length - 2, radius);
};

const moveToward = (from: SvgPoint, to: SvgPoint, distance: number): SvgPoint => {
  const segmentLength = getDistance(from, to);
  if (segmentLength === 0) return from;

  return {
    x: from.x + ((to.x - from.x) / segmentLength) * distance,
    y: from.y + ((to.y - from.y) / segmentLength) * distance
  };
};

export const toRoundedPath = (points: SvgPoint[], radius = EDGE_CORNER_RADIUS): string => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${formatPoint(points[0])}`;

  const commands = [`M ${formatPoint(points[0])}`];

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const corner = points[index];
    const next = points[index + 1];
    const cornerRadius = getRoundedCornerRadius(points, index, radius);

    if (cornerRadius === 0) {
      commands.push(`L ${formatPoint(corner)}`);
      continue;
    }

    const beforeCorner = moveToward(corner, previous, cornerRadius);
    const afterCorner = moveToward(corner, next, cornerRadius);

    commands.push(`L ${formatPoint(beforeCorner)}`, `Q ${formatPoint(corner)} ${formatPoint(afterCorner)}`);
  }

  commands.push(`L ${formatPoint(points.at(-1)!)}`);
  return commands.join(' ');
};

export const getEdgeLabelGeometry = (
  text: string,
  points: SvgPoint[],
  diagramSize: DiagramSize,
  explicitPoint?: SvgPoint
): EdgeLabelGeometry => {
  const getCharacterWidth = (character: string): number => {
    if (/\s/u.test(character)) return EDGE_LABEL_SPACE_WIDTH;
    if (CJK_CHARACTER_PATTERN.test(character)) return EDGE_LABEL_CJK_CHARACTER_WIDTH;
    return EDGE_LABEL_LATIN_CHARACTER_WIDTH;
  };
  const getTextWidth = (value: string): number =>
    Array.from(value).reduce((width, character) => width + getCharacterWidth(character), 0);
  const availableLabelWidth = diagramSize.width - DIAGRAM_PADDING * 2;
  const maximumLineWidth = availableLabelWidth - EDGE_LABEL_HORIZONTAL_PADDING * 2;
  const lines: string[] = [];
  let currentLine = '';
  let currentLineWidth = 0;

  for (const character of Array.from(text)) {
    const characterWidth = getCharacterWidth(character);

    if (currentLine && currentLineWidth + characterWidth > maximumLineWidth) {
      lines.push(currentLine);
      currentLine = character;
      currentLineWidth = characterWidth;
      continue;
    }

    currentLine += character;
    currentLineWidth += characterWidth;
  }

  lines.push(currentLine);

  const labelWidth = Math.min(
    availableLabelWidth,
    Math.max(EDGE_LABEL_MINIMUM_WIDTH, Math.max(...lines.map(getTextWidth)) + EDGE_LABEL_HORIZONTAL_PADDING * 2)
  );
  const labelHeight = EDGE_LABEL_VERTICAL_PADDING * 2 + lines.length * EDGE_LABEL_LINE_HEIGHT;
  let anchorPoint = explicitPoint;

  if (!anchorPoint) {
    let longestSegment = { from: points[0], to: points[1] ?? points[0], length: -1 };

    for (let index = 1; index < points.length; index += 1) {
      const from = points[index - 1];
      const to = points[index];
      const length = getDistance(from, to);
      if (length > longestSegment.length) longestSegment = { from, to, length };
    }

    anchorPoint = {
      x: (longestSegment.from.x + longestSegment.to.x) / 2,
      y: (longestSegment.from.y + longestSegment.to.y) / 2
    };
  }

  const minimumX = DIAGRAM_PADDING + labelWidth / 2;
  const maximumX = diagramSize.width - DIAGRAM_PADDING - labelWidth / 2;
  const minimumY = DIAGRAM_PADDING + labelHeight / 2;
  const maximumY = diagramSize.height - DIAGRAM_PADDING - labelHeight / 2;

  return {
    x: Math.min(maximumX, Math.max(minimumX, anchorPoint.x)),
    y: Math.min(maximumY, Math.max(minimumY, anchorPoint.y)),
    width: labelWidth,
    height: labelHeight,
    text,
    lines
  };
};

export const getEdgeLabelPoint = (edge: FeatureSwimlaneEdge): SvgPoint | null =>
  edge.labelAt ? getGridPoint(edge.labelAt) : null;

export interface SwimlaneLayoutViewport {
  width: number;
  minimumFontSize: number;
}

export interface TextLayout {
  text: string;
  lines: string[];
  fontSize: number;
  lineHeight: number;
  width: number;
  height: number;
}

export interface LayoutRectangle extends SvgPoint {
  width: number;
  height: number;
}

export interface SwimlaneLaneLayout {
  lane: FeatureSwimlane['lanes'][number];
  x: number;
  width: number;
  text: TextLayout;
}

export interface SwimlaneNodeLayout extends NodeGeometry {
  step: FeatureSwimlaneStep;
  text: TextLayout;
  safeTextRect: LayoutRectangle;
}

export interface ResolvedEdgeLabelGeometry extends EdgeLabelGeometry {
  fontSize: number;
  lineHeight: number;
  basePoint: SvgPoint;
  track: number;
  placement: 'explicit' | 'automatic';
}

export interface SwimlaneEdgeLayout {
  edge: FeatureSwimlaneEdge;
  points: SvgPoint[];
  path: string;
  label?: ResolvedEdgeLabelGeometry;
}

export interface SwimlaneLayout {
  viewport: SwimlaneLayoutViewport;
  size: DiagramSize;
  padding: number;
  headerHeight: number;
  laneWidth: number;
  lanes: SwimlaneLaneLayout[];
  nodes: SwimlaneNodeLayout[];
  edges: SwimlaneEdgeLayout[];
  rowCenters: number[];
}

const RESPONSIVE_NODE_HORIZONTAL_PADDING = 8;
const RESPONSIVE_NODE_VERTICAL_PADDING = 8;
const RESPONSIVE_ROW_MINIMUM_GAP = 56;
const RESPONSIVE_ROW_MAXIMUM_GAP = 88;
const RESPONSIVE_LABEL_FONT_SIZE = 10;
const RESPONSIVE_LABEL_TRACK_GAP = 8;
const RESPONSIVE_DIAGRAM_BOUNDARY_INSET = 4;
const RESPONSIVE_LABEL_TRACKS = [0, -1, 1, -2, 2] as const;

const getResponsiveCharacterWidth = (character: string, fontSize: number): number => {
  if (/\s/u.test(character)) return fontSize * 0.35;
  if (CJK_CHARACTER_PATTERN.test(character)) return fontSize;
  return fontSize * 0.58;
};

const getResponsiveTextWidth = (text: string, fontSize: number): number =>
  Array.from(text).reduce((width, character) => width + getResponsiveCharacterWidth(character, fontSize), 0);

const splitLongToken = (token: string, maximumWidth: number, fontSize: number): string[] => {
  const segments: string[] = [];
  let segment = '';
  let width = 0;

  for (const character of Array.from(token)) {
    const characterWidth = getResponsiveCharacterWidth(character, fontSize);
    if (segment && width + characterWidth > maximumWidth) {
      segments.push(segment);
      segment = character;
      width = characterWidth;
      continue;
    }
    segment += character;
    width += characterWidth;
  }

  if (segment || segments.length === 0) segments.push(segment);
  return segments;
};

const wrapResponsiveText = (text: string, maximumWidth: number, fontSize: number): string[] => {
  const safeMaximumWidth = Math.max(fontSize, maximumWidth);
  const tokens = text.match(/\s+|[^\s]+/gu) ?? [''];
  const lines: string[] = [];
  let currentLine = '';

  for (const token of tokens) {
    const candidate = `${currentLine}${token}`;
    if (!currentLine || getResponsiveTextWidth(candidate, fontSize) <= safeMaximumWidth) {
      if (getResponsiveTextWidth(candidate, fontSize) <= safeMaximumWidth) {
        currentLine = candidate;
        continue;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = '';
    }

    const tokenSegments = splitLongToken(token, safeMaximumWidth, fontSize);
    lines.push(...tokenSegments.slice(0, -1));
    currentLine = tokenSegments.at(-1) ?? '';
  }

  if (currentLine || lines.length === 0) lines.push(currentLine);
  return lines;
};

const createResponsiveTextLayout = (
  text: string,
  maximumWidth: number,
  fontSize: number,
  lineHeight = fontSize * 1.35
): TextLayout => {
  const lines = wrapResponsiveText(text, maximumWidth, fontSize);

  return {
    text,
    lines,
    fontSize,
    lineHeight,
    width: Math.max(0, ...lines.map((line) => getResponsiveTextWidth(line, fontSize))),
    height: lines.length * lineHeight
  };
};

const createLabelTextLayout = (text: string, availableWidth: number, maximumLines: 1 | 2 | 3): TextLayout | null => {
  const fontSize = RESPONSIVE_LABEL_FONT_SIZE;
  const contentWidth = Math.max(fontSize, availableWidth - EDGE_LABEL_HORIZONTAL_PADDING * 2);

  if (maximumLines === 1) {
    const naturalWidth = getResponsiveTextWidth(text, fontSize);
    if (naturalWidth > contentWidth) return null;
    return createResponsiveTextLayout(text, naturalWidth, fontSize, EDGE_LABEL_LINE_HEIGHT);
  }

  let lowerBound = fontSize;
  let upperBound = contentWidth;
  let result: TextLayout | null = null;

  for (let attempt = 0; attempt < 18; attempt += 1) {
    const candidateWidth = (lowerBound + upperBound) / 2;
    const candidate = createResponsiveTextLayout(text, candidateWidth, fontSize, EDGE_LABEL_LINE_HEIGHT);
    if (candidate.lines.length <= maximumLines) {
      result = candidate;
      upperBound = candidateWidth;
    } else {
      lowerBound = candidateWidth;
    }
  }

  const widest = createResponsiveTextLayout(text, contentWidth, fontSize, EDGE_LABEL_LINE_HEIGHT);
  if (widest.lines.length > maximumLines) return null;
  return result ?? widest;
};

const getResponsivePadding = (): number => 40;

const getResponsiveNodeSafeWidth = (shape: FeatureSwimlaneNodeShape, nodeWidth: number): number =>
  Math.max(10, nodeWidth * (shape === 'decision' ? 0.58 : 1) - RESPONSIVE_NODE_HORIZONTAL_PADDING * 2);

const getResponsiveNodeHeight = (shape: FeatureSwimlaneNodeShape, textHeight: number): number => {
  const contentHeight = textHeight + RESPONSIVE_NODE_VERTICAL_PADDING * 2;
  if (shape === 'decision') return Math.max(56, contentHeight / 0.58);
  if (shape === 'start' || shape === 'end') return Math.max(40, contentHeight);
  return Math.max(44, contentHeight);
};

const getResponsiveGridPoint = (
  point: FeatureSwimlanePoint,
  padding: number,
  laneWidth: number,
  rowCenters: number[]
): SvgPoint => {
  const lowerRow = Math.max(0, Math.min(rowCenters.length - 1, Math.floor(point.row)));
  const upperRow = Math.max(0, Math.min(rowCenters.length - 1, Math.ceil(point.row)));
  const fraction = point.row - Math.floor(point.row);
  const lowerY = rowCenters[lowerRow] ?? 0;
  const upperY = rowCenters[upperRow] ?? lowerY;

  return {
    x: padding + (point.column + 0.5) * laneWidth,
    y: lowerY + (upperY - lowerY) * fraction
  };
};

const getResponsiveObstacleRects = (nodes: SwimlaneNodeLayout[], edge: FeatureSwimlaneEdge): ObstacleRect[] =>
  nodes
    .filter(({ step }) => step.id !== edge.from && step.id !== edge.to)
    .map((node) => ({
      id: node.step.id,
      left: node.x - node.width / 2 - EDGE_OBSTACLE_CLEARANCE,
      right: node.x + node.width / 2 + EDGE_OBSTACLE_CLEARANCE,
      top: node.y - node.height / 2 - EDGE_OBSTACLE_CLEARANCE,
      bottom: node.y + node.height / 2 + EDGE_OBSTACLE_CLEARANCE
    }));

const finalizeResponsiveArrival = (
  points: SvgPoint[],
  toPoint: SvgPoint,
  toAnchor: FeatureSwimlaneAnchor,
  toApproach: SvgPoint,
  obstacles: ObstacleRect[],
  diagramSize: DiagramSize
): SvgPoint[] => {
  const hasSafeArrival = (candidate: SvgPoint[]): boolean => {
    const beforeTarget = candidate.at(-2);
    if (!beforeTarget) return false;
    const finalVector = { x: toPoint.x - beforeTarget.x, y: toPoint.y - beforeTarget.y };
    const inwardNormal = getAnchorNormal(toAnchor);

    return (
      getDistance(beforeTarget, toPoint) >= EDGE_END_SEGMENT_LENGTH &&
      finalVector.x * inwardNormal.y === finalVector.y * inwardNormal.x &&
      finalVector.x * inwardNormal.x + finalVector.y * inwardNormal.y < 0
    );
  };

  if (hasSafeArrival(points)) return points;

  const repaired = points.slice(0, -1);
  appendOrthogonalPoint(repaired, toApproach);
  appendOrthogonalPoint(repaired, toPoint);
  const protectedPoints = new Set([pointKey(toApproach)]);
  const withoutHairpins = expandHairpins(compactOrthogonalPoints(repaired, protectedPoints), obstacles, diagramSize);
  const obstacleSafe = avoidObstacleIntersections(withoutHairpins, obstacles, diagramSize);
  const finalized = expandHairpins(compactOrthogonalPoints(obstacleSafe, protectedPoints), obstacles, diagramSize);

  if (!hasSafeArrival(finalized)) {
    throw new Error('target 변에 수직인 10px 도착 직선을 계산할 수 없습니다.');
  }

  return finalized;
};

const getSiblingBranchChannelY = (
  swimlane: FeatureSwimlane,
  edge: FeatureSwimlaneEdge,
  nodes: SwimlaneNodeLayout[]
): number | null => {
  if (edge.waypoints?.length) return null;

  const fromNode = nodes.find(({ step }) => step.id === edge.from);
  const toNode = nodes.find(({ step }) => step.id === edge.to);
  if (!fromNode || !toNode) return null;

  const direction = Math.sign(toNode.y - fromNode.y);
  if (direction === 0) return null;

  const siblings = swimlane.edges
    .filter((candidate) => candidate.from === edge.from && !candidate.waypoints?.length)
    .map((candidate) => {
      const candidateToNode = nodes.find(({ step }) => step.id === candidate.to);
      if (!candidateToNode || candidateToNode.step.row !== toNode.step.row) return null;
      if (Math.sign(candidateToNode.y - fromNode.y) !== direction) return null;

      const automaticAnchors = getAutomaticAnchors(fromNode, candidateToNode);
      const fromAnchor = candidate.fromAnchor ?? automaticAnchors.fromAnchor;
      const toAnchor = candidate.toAnchor ?? automaticAnchors.toAnchor;
      if (!['top', 'bottom'].includes(fromAnchor) || !['top', 'bottom'].includes(toAnchor)) return null;

      const fromPoint = getAnchorPoint(fromNode, fromAnchor);
      const toPoint = getAnchorPoint(candidateToNode, toAnchor);
      const fromExit = movePoint(fromPoint, getAnchorNormal(fromAnchor), EDGE_END_SEGMENT_LENGTH);
      const toApproach = movePoint(toPoint, getAnchorNormal(toAnchor), EDGE_END_SEGMENT_LENGTH + EDGE_CORNER_RADIUS);

      return {
        edge: candidate,
        targetX: candidateToNode.x,
        minimumTravelY: Math.min(fromExit.y, toApproach.y),
        maximumTravelY: Math.max(fromExit.y, toApproach.y)
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((left, right) => left.targetX - right.targetX || left.edge.id.localeCompare(right.edge.id));

  if (siblings.length < 3) return null;
  const siblingIndex = siblings.findIndex((candidate) => candidate.edge.id === edge.id);
  if (siblingIndex < 0) return null;

  const sharedMinimumY = Math.max(...siblings.map(({ minimumTravelY }) => minimumTravelY));
  const sharedMaximumY = Math.min(...siblings.map(({ maximumTravelY }) => maximumTravelY));
  if (sharedMaximumY <= sharedMinimumY) return null;

  return sharedMinimumY + ((sharedMaximumY - sharedMinimumY) * (siblingIndex + 1)) / (siblings.length + 1);
};

const getResponsiveEdgePoints = (
  swimlane: FeatureSwimlane,
  edge: FeatureSwimlaneEdge,
  nodes: SwimlaneNodeLayout[],
  padding: number,
  laneWidth: number,
  rowCenters: number[],
  diagramSize: DiagramSize
): SvgPoint[] => {
  const fromNode = nodes.find(({ step }) => step.id === edge.from);
  const toNode = nodes.find(({ step }) => step.id === edge.to);
  if (!fromNode || !toNode) throw new Error(`edge "${edge.id}"의 node geometry를 찾을 수 없습니다.`);

  const automaticAnchors = getAutomaticAnchors(fromNode, toNode);
  const fromAnchor = edge.fromAnchor ?? automaticAnchors.fromAnchor;
  const toAnchor = edge.toAnchor ?? automaticAnchors.toAnchor;
  const fromPoint = getAnchorPoint(fromNode, fromAnchor);
  const toPoint = getAnchorPoint(toNode, toAnchor);
  const fromExit = movePoint(fromPoint, getAnchorNormal(fromAnchor), EDGE_END_SEGMENT_LENGTH);
  const toApproach = movePoint(toPoint, getAnchorNormal(toAnchor), EDGE_END_SEGMENT_LENGTH + EDGE_CORNER_RADIUS);
  const waypoints = edge.waypoints?.map((point) => getResponsiveGridPoint(point, padding, laneWidth, rowCenters)) ?? [];
  const obstacles = getResponsiveObstacleRects(nodes, edge);
  const points = [fromPoint, fromExit];

  if (waypoints.length === 0 && (fromAnchor === 'left' || fromAnchor === 'right') && fromAnchor === toAnchor) {
    const direction = fromAnchor === 'right' ? 1 : -1;
    const clearance = Math.min(EDGE_END_SEGMENT_LENGTH + EDGE_CORNER_RADIUS, Math.max(10, laneWidth * 0.14));
    const channelX =
      direction > 0 ? Math.max(fromPoint.x, toPoint.x) + clearance : Math.min(fromPoint.x, toPoint.x) - clearance;
    const sidePoints = [fromPoint, { x: channelX, y: fromPoint.y }, { x: channelX, y: toPoint.y }, toPoint];

    const withoutHairpins = expandHairpins(compactOrthogonalPoints(sidePoints, new Set()), obstacles, diagramSize);
    const obstacleSafe = avoidObstacleIntersections(withoutHairpins, obstacles, diagramSize);

    return finalizeResponsiveArrival(
      expandHairpins(compactOrthogonalPoints(obstacleSafe, new Set()), obstacles, diagramSize),
      toPoint,
      toAnchor,
      toApproach,
      obstacles,
      diagramSize
    );
  }

  if (
    waypoints.length === 0 &&
    fromNode.step.row === toNode.step.row &&
    (fromAnchor === 'left' || fromAnchor === 'right') &&
    (toAnchor === 'top' || toAnchor === 'bottom')
  ) {
    const arrivalChannelPoints = [fromPoint, fromExit, { x: fromExit.x, y: toApproach.y }, toApproach, toPoint];
    const withoutHairpins = expandHairpins(
      compactOrthogonalPoints(arrivalChannelPoints, new Set()),
      obstacles,
      diagramSize
    );
    const obstacleSafe = avoidObstacleIntersections(withoutHairpins, obstacles, diagramSize);

    return finalizeResponsiveArrival(
      expandHairpins(compactOrthogonalPoints(obstacleSafe, new Set()), obstacles, diagramSize),
      toPoint,
      toAnchor,
      toApproach,
      obstacles,
      diagramSize
    );
  }

  if (
    waypoints.length === 0 &&
    (fromAnchor === 'top' || fromAnchor === 'bottom') &&
    (toAnchor === 'top' || toAnchor === 'bottom') &&
    fromPoint.x !== toPoint.x
  ) {
    const minimumX = Math.min(fromPoint.x, toPoint.x);
    const maximumX = Math.max(fromPoint.x, toPoint.x);
    const minimumTravelY = Math.min(fromExit.y, toApproach.y);
    const maximumTravelY = Math.max(fromExit.y, toApproach.y);
    const crossedObstacles = obstacles.filter(
      ({ left, right, top, bottom }) =>
        right > minimumX && left < maximumX && bottom > minimumTravelY && top < maximumTravelY
    );
    const preferredChannelY = getSiblingBranchChannelY(swimlane, edge, nodes);
    const channelCandidates = [
      fromExit.y,
      toApproach.y,
      ...(preferredChannelY === null ? [] : [preferredChannelY]),
      ...crossedObstacles.flatMap(({ top, bottom }) => [top - 2, bottom + 2])
    ]
      .filter((candidate, index, candidates) => {
        return (
          candidate >= minimumTravelY &&
          candidate <= maximumTravelY &&
          candidates.findIndex((value) => value === candidate) === index
        );
      })
      .map((channelY) => {
        const candidatePoints = [...points];
        [{ x: fromExit.x, y: channelY }, { x: toApproach.x, y: channelY }, toApproach, toPoint].forEach((point) =>
          appendOrthogonalPoint(candidatePoints, point)
        );
        const intersectsObstacle = candidatePoints
          .slice(1)
          .some((to, index) =>
            obstacles.some((obstacle) => segmentIntersectsRect(candidatePoints[index], to, obstacle))
          );
        return { channelY, points: candidatePoints, intersectsObstacle };
      })
      .sort((left, right) => {
        if (left.intersectsObstacle !== right.intersectsObstacle) return left.intersectsObstacle ? 1 : -1;
        if (preferredChannelY !== null) {
          const preferredDistance =
            Math.abs(left.channelY - preferredChannelY) - Math.abs(right.channelY - preferredChannelY);
          if (preferredDistance !== 0) return preferredDistance;
        }
        return getPathScore(left.points, obstacles, diagramSize) - getPathScore(right.points, obstacles, diagramSize);
      });
    const withoutHairpins = expandHairpins(
      compactOrthogonalPoints(channelCandidates[0]?.points ?? points, new Set()),
      obstacles,
      diagramSize
    );
    const obstacleSafe = avoidObstacleIntersections(withoutHairpins, obstacles, diagramSize);

    return finalizeResponsiveArrival(
      expandHairpins(compactOrthogonalPoints(obstacleSafe, new Set()), obstacles, diagramSize),
      toPoint,
      toAnchor,
      toApproach,
      obstacles,
      diagramSize
    );
  }

  [...waypoints, toApproach].forEach((point) => appendOrthogonalPoint(points, point));
  appendOrthogonalPoint(points, toPoint);

  const protectedPoints = new Set(waypoints.map(pointKey));
  const compacted = compactOrthogonalPoints(points, protectedPoints);
  const withoutHairpins = expandHairpins(compacted, obstacles, diagramSize);
  try {
    const obstacleSafe = avoidObstacleIntersections(withoutHairpins, obstacles, diagramSize);
    return finalizeResponsiveArrival(
      expandHairpins(compactOrthogonalPoints(obstacleSafe, protectedPoints), obstacles, diagramSize),
      toPoint,
      toAnchor,
      toApproach,
      obstacles,
      diagramSize
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 routing 오류';
    throw new Error(`edge "${edge.id}": ${message}`);
  }
};

interface RoundedLineSegment {
  kind: 'line';
  from: SvgPoint;
  to: SvgPoint;
}

interface RoundedQuadraticSegment {
  kind: 'quadratic';
  from: SvgPoint;
  control: SvgPoint;
  to: SvgPoint;
}

type RoundedPathSegment = RoundedLineSegment | RoundedQuadraticSegment;

const getRoundedPathSegments = (points: SvgPoint[], radius = EDGE_CORNER_RADIUS): RoundedPathSegment[] => {
  if (points.length < 2) return [];
  const segments: RoundedPathSegment[] = [];
  let current = points[0];

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const corner = points[index];
    const next = points[index + 1];
    const cornerRadius = getRoundedCornerRadius(points, index, radius);

    if (cornerRadius === 0) {
      if (!isSamePoint(current, corner)) segments.push({ kind: 'line', from: current, to: corner });
      current = corner;
      continue;
    }

    const beforeCorner = moveToward(corner, previous, cornerRadius);
    const afterCorner = moveToward(corner, next, cornerRadius);

    if (!isSamePoint(current, beforeCorner)) segments.push({ kind: 'line', from: current, to: beforeCorner });
    segments.push({ kind: 'quadratic', from: beforeCorner, control: corner, to: afterCorner });
    current = afterCorner;
  }

  const finalPoint = points.at(-1)!;
  if (!isSamePoint(current, finalPoint)) segments.push({ kind: 'line', from: current, to: finalPoint });
  return segments;
};

const getQuadraticPoint = (segment: RoundedQuadraticSegment, ratio: number): SvgPoint => {
  const inverse = 1 - ratio;
  return {
    x: inverse * inverse * segment.from.x + 2 * inverse * ratio * segment.control.x + ratio * ratio * segment.to.x,
    y: inverse * inverse * segment.from.y + 2 * inverse * ratio * segment.control.y + ratio * ratio * segment.to.y
  };
};

const flattenRoundedPath = (segments: RoundedPathSegment[]): SvgPoint[] => {
  const points: SvgPoint[] = [];
  for (const segment of segments) {
    if (points.length === 0) points.push(segment.from);
    if (segment.kind === 'line') {
      points.push(segment.to);
      continue;
    }
    for (let step = 1; step <= 64; step += 1) points.push(getQuadraticPoint(segment, step / 64));
  }
  return points;
};

export const getRoundedPathPointAtRatio = (points: SvgPoint[], ratio: number): SvgPoint => {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];
  const flattened = flattenRoundedPath(getRoundedPathSegments(points));
  const lengths = flattened.slice(1).map((point, index) => getDistance(flattened[index], point));
  const totalLength = lengths.reduce((total, length) => total + length, 0);
  const targetLength = totalLength * Math.min(1, Math.max(0, ratio));
  let traversed = 0;

  for (let index = 1; index < flattened.length; index += 1) {
    const segmentLength = lengths[index - 1];
    if (traversed + segmentLength >= targetLength) {
      const segmentRatio = segmentLength === 0 ? 0 : (targetLength - traversed) / segmentLength;
      return {
        x: Number((flattened[index - 1].x + (flattened[index].x - flattened[index - 1].x) * segmentRatio).toFixed(4)),
        y: Number((flattened[index - 1].y + (flattened[index].y - flattened[index - 1].y) * segmentRatio).toFixed(4))
      };
    }
    traversed += segmentLength;
  }

  return flattened.at(-1)!;
};

export const rectanglesOverlap = (left: LayoutRectangle, right: LayoutRectangle): boolean =>
  Math.abs(left.x - right.x) * 2 < left.width + right.width &&
  Math.abs(left.y - right.y) * 2 < left.height + right.height;

const isRectangleInsideDiagram = (rectangle: LayoutRectangle, size: DiagramSize): boolean =>
  rectangle.x - rectangle.width / 2 >= RESPONSIVE_DIAGRAM_BOUNDARY_INSET &&
  rectangle.x + rectangle.width / 2 <= size.width - RESPONSIVE_DIAGRAM_BOUNDARY_INSET &&
  rectangle.y - rectangle.height / 2 >= RESPONSIVE_DIAGRAM_BOUNDARY_INSET &&
  rectangle.y + rectangle.height / 2 <= size.height - RESPONSIVE_DIAGRAM_BOUNDARY_INSET;

const createResolvedLabel = ({
  edge,
  basePoint,
  diagramSize,
  padding,
  obstacles,
  occupied,
  explicit
}: {
  edge: FeatureSwimlaneEdge;
  basePoint: SvgPoint;
  diagramSize: DiagramSize;
  padding: number;
  obstacles: LayoutRectangle[];
  occupied: LayoutRectangle[];
  explicit: boolean;
}): ResolvedEdgeLabelGeometry => {
  const availableWidth = diagramSize.width - padding * 2;
  const lineOptions = explicit ? ([1, 2, 3] as const) : ([1, 2, 3] as const);
  const rejectionSummary: string[] = [];

  for (const maximumLines of lineOptions) {
    const text = createLabelTextLayout(edge.label!, availableWidth, maximumLines);
    if (!text) continue;
    const width = Math.max(EDGE_LABEL_MINIMUM_WIDTH, text.width + EDGE_LABEL_HORIZONTAL_PADDING * 2);
    const height = text.height + EDGE_LABEL_VERTICAL_PADDING * 2;
    const tracks = explicit ? ([0] as const) : RESPONSIVE_LABEL_TRACKS;

    for (const track of tracks) {
      const candidate: ResolvedEdgeLabelGeometry = {
        x: basePoint.x,
        y: basePoint.y + track * (height + RESPONSIVE_LABEL_TRACK_GAP),
        width,
        height,
        text: edge.label!,
        lines: text.lines,
        fontSize: text.fontSize,
        lineHeight: text.lineHeight,
        basePoint,
        track,
        placement: explicit ? 'explicit' : 'automatic'
      };
      const collisionIndex = [...obstacles, ...occupied].findIndex((rectangle) =>
        rectanglesOverlap(candidate, rectangle)
      );
      const inside = isRectangleInsideDiagram(candidate, diagramSize);
      if (inside && collisionIndex < 0) return candidate;
      rejectionSummary.push(
        `${maximumLines}줄/${track}트랙(${width.toFixed(1)}x${height.toFixed(1)}):${inside ? `충돌-${collisionIndex}` : '경계'}`
      );
    }
  }

  throw new Error(
    `edge "${edge.id}" label을 충돌 없이 배치할 수 없습니다. base=(${basePoint.x},${basePoint.y}), ` +
      `diagram=(${diagramSize.width},${diagramSize.height}), candidates=${rejectionSummary.join(',')}`
  );
};

export const calculateSwimlaneLayout = (
  swimlane: FeatureSwimlane,
  viewport: SwimlaneLayoutViewport
): SwimlaneLayout => {
  const width = Number.isFinite(viewport.width) && viewport.width > 0 ? viewport.width : 252;
  const minimumFontSize = Math.max(10, viewport.minimumFontSize);
  const padding = getResponsivePadding();
  const laneWidth = Math.max(1, (width - padding * 2) / Math.max(1, swimlane.lanes.length));
  const laneTextLayouts = swimlane.lanes.map(({ label }) =>
    createResponsiveTextLayout(label, Math.max(10, laneWidth - 8), minimumFontSize)
  );
  const headerHeight = Math.max(44, ...laneTextLayouts.map(({ height }) => height + 16));
  const maximumRow = Math.max(0, ...swimlane.steps.map(({ row }) => Math.ceil(row)));
  const nodeDrafts = swimlane.steps.map((step) => {
    const laneIndex = swimlane.lanes.findIndex(({ id }) => id === step.laneId);
    if (laneIndex < 0) throw new Error(`step "${step.id}"의 lane "${step.laneId}"을 찾을 수 없습니다.`);
    const width = Math.max(22, Math.min(laneWidth - 12, laneWidth * 0.76));
    const safeWidth = getResponsiveNodeSafeWidth(step.shape, width);
    const text = createResponsiveTextLayout(step.label, safeWidth, minimumFontSize);
    const height = getResponsiveNodeHeight(step.shape, text.height);
    const safeHeight = step.shape === 'decision' ? height * 0.58 : height - RESPONSIVE_NODE_VERTICAL_PADDING * 2;

    return { step, laneIndex, width, height, safeWidth, safeHeight, text };
  });
  const rowHeights = Array.from({ length: maximumRow + 1 }, (_, row) =>
    Math.max(40, ...nodeDrafts.filter(({ step }) => step.row === row).map(({ height }) => height))
  );
  const baseRowGap = Math.max(RESPONSIVE_ROW_MINIMUM_GAP, Math.min(RESPONSIVE_ROW_MAXIMUM_GAP, 145 - laneWidth * 0.55));
  const rowGaps = Array.from({ length: maximumRow }, () => baseRowGap);
  const stepsById = new Map(swimlane.steps.map((step) => [step.id, step]));
  const labelsByAdjacentRowGap = new Map<number, FeatureSwimlaneEdge[]>();

  for (const edge of swimlane.edges) {
    if (!edge.label) continue;
    const fromStep = stepsById.get(edge.from);
    const toStep = stepsById.get(edge.to);
    if (!fromStep || !toStep || Math.abs(toStep.row - fromStep.row) !== 1) continue;
    const gapIndex = Math.min(fromStep.row, toStep.row);
    labelsByAdjacentRowGap.set(gapIndex, [...(labelsByAdjacentRowGap.get(gapIndex) ?? []), edge]);
  }

  for (const [gapIndex, edges] of labelsByAdjacentRowGap) {
    if (edges.length < 2 || rowGaps[gapIndex] === undefined) continue;
    const maximumLabelHeight = Math.max(
      ...edges.map(({ label }) => {
        for (const maximumLines of [1, 2, 3] as const) {
          const text = createLabelTextLayout(label!, width - padding * 2, maximumLines);
          if (text) return text.height + EDGE_LABEL_VERTICAL_PADDING * 2;
        }
        return EDGE_LABEL_VERTICAL_PADDING * 2 + EDGE_LABEL_LINE_HEIGHT * 3;
      })
    );
    rowGaps[gapIndex] += (edges.length - 1) * (maximumLabelHeight + RESPONSIVE_LABEL_TRACK_GAP);
  }
  const rowCenters: number[] = [];

  rowHeights.forEach((rowHeight, row) => {
    if (row === 0) {
      rowCenters.push(headerHeight + padding + rowHeight / 2);
      return;
    }
    rowCenters.push(rowCenters[row - 1] + rowHeights[row - 1] / 2 + rowGaps[row - 1] + rowHeight / 2);
  });

  const nodes: SwimlaneNodeLayout[] = nodeDrafts.map((draft) => {
    const x = padding + draft.laneIndex * laneWidth + laneWidth / 2;
    const y = rowCenters[draft.step.row];
    return {
      step: draft.step,
      x,
      y,
      width: draft.width,
      height: draft.height,
      text: draft.text,
      safeTextRect: { x, y, width: draft.safeWidth, height: draft.safeHeight }
    };
  });
  const height = (rowCenters.at(-1) ?? headerHeight) + (rowHeights.at(-1) ?? 0) / 2 + padding;
  const size = { width, height };
  const lanes = swimlane.lanes.map((lane, index) => ({
    lane,
    x: padding + index * laneWidth,
    width: laneWidth,
    text: laneTextLayouts[index]
  }));
  const edgesWithoutLabels: SwimlaneEdgeLayout[] = swimlane.edges.map((edge) => {
    const points = getResponsiveEdgePoints(swimlane, edge, nodes, padding, laneWidth, rowCenters, size);
    return { edge, points, path: toRoundedPath(points) };
  });
  const labelByEdgeId = new Map<string, ResolvedEdgeLabelGeometry>();
  const occupied: LayoutRectangle[] = [];
  const nodeObstacles: LayoutRectangle[] = nodes.map(({ x, y, width, height }) => ({ x, y, width, height }));
  const orderedEdges = [...edgesWithoutLabels].sort((left, right) => {
    const getPriority = ({ edge }: SwimlaneEdgeLayout): number => {
      if (edge.labelAt) return 0;
      return edge.kind === 'normal' ? 1 : 2;
    };
    const priorityDifference = getPriority(left) - getPriority(right);
    if (priorityDifference !== 0) return priorityDifference;
    return swimlane.edges.indexOf(left.edge) - swimlane.edges.indexOf(right.edge);
  });

  for (const edgeLayout of orderedEdges) {
    if (!edgeLayout.edge.label) continue;
    const explicit = Boolean(edgeLayout.edge.labelAt);
    const basePoint = edgeLayout.edge.labelAt
      ? getResponsiveGridPoint(edgeLayout.edge.labelAt, padding, laneWidth, rowCenters)
      : getRoundedPathPointAtRatio(edgeLayout.points, 0.5);
    const label = createResolvedLabel({
      edge: edgeLayout.edge,
      basePoint,
      diagramSize: size,
      padding,
      obstacles: nodeObstacles,
      occupied,
      explicit
    });
    labelByEdgeId.set(edgeLayout.edge.id, label);
    occupied.push(label);
  }

  return {
    viewport: { width, minimumFontSize },
    size,
    padding,
    headerHeight,
    laneWidth,
    lanes,
    nodes,
    edges: edgesWithoutLabels.map((edgeLayout) => ({
      ...edgeLayout,
      label: labelByEdgeId.get(edgeLayout.edge.id)
    })),
    rowCenters
  };
};
