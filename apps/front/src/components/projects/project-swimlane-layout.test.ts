import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { describe, expect, it } from 'vitest';

import type { FeatureSwimlane, FeatureSwimlaneAnchor, FeatureSwimlaneEdge } from '@/data/portfolio';
import { getFeatureDetailBySlug } from '@/data/portfolio';

import { getArchifyPreviewAspectRatio } from './ArchifySwimlaneEmbed';
import * as swimlaneLayout from './project-swimlane-layout';
import {
  DIAGRAM_PADDING,
  EDGE_CORNER_RADIUS,
  EDGE_END_SEGMENT_LENGTH,
  EDGE_LABEL_HEIGHT,
  HEADER_HEIGHT,
  LANE_WIDTH,
  ROW_HEIGHT,
  calculateSwimlaneLayout,
  getAnchorPoint,
  getDiagramSize,
  getEdgePoints,
  getRoundedFinalStraightLength,
  getRoundedPathPointAtRatio,
  getGridPoint,
  getNodeGeometry,
  rectanglesOverlap
} from './project-swimlane-layout';
import { ProjectSwimlane } from './ProjectSwimlane';

const geometryFixture: FeatureSwimlane = {
  id: 'geometry-fixture',
  title: 'Geometry fixture',
  purpose: '스윔레인 좌표 계약을 검증합니다.',
  summary: '시작에서 처리 단계를 거쳐 완료합니다.',
  lanes: [
    { id: 'left', label: '왼쪽' },
    { id: 'right', label: '오른쪽' }
  ],
  steps: [
    {
      id: 'start',
      laneId: 'left',
      row: 0,
      shape: 'start',
      label: '시작',
      description: '흐름을 시작합니다.'
    },
    {
      id: 'finish',
      laneId: 'right',
      row: 2,
      shape: 'end',
      label: '완료',
      description: '흐름을 완료합니다.'
    }
  ],
  edges: [
    {
      id: 'start-finish',
      from: 'start',
      to: 'finish',
      kind: 'normal',
      outcome: 'continue',
      fromAnchor: 'right',
      toAnchor: 'left'
    }
  ],
  exceptions: []
};

const createRoutingFixture = ({
  fromColumn,
  fromRow,
  toColumn,
  toRow,
  edge
}: {
  fromColumn: number;
  fromRow: number;
  toColumn: number;
  toRow: number;
  edge?: Partial<FeatureSwimlaneEdge>;
}): { swimlane: FeatureSwimlane; edge: FeatureSwimlaneEdge } => {
  const lanes = ['left', 'center', 'right'].map((id) => ({ id, label: id }));
  const routedEdge = {
    id: 'source-target',
    from: 'source',
    to: 'target',
    kind: 'normal',
    outcome: 'continue',
    ...edge
  } as FeatureSwimlaneEdge;
  const swimlane: FeatureSwimlane = {
    id: 'routing-fixture',
    title: 'Routing fixture',
    purpose: '연결 방향을 검증합니다.',
    summary: 'source에서 target으로 이동합니다.',
    lanes,
    steps: [
      {
        id: 'source',
        laneId: lanes[fromColumn].id,
        row: fromRow,
        shape: 'process',
        label: 'source',
        description: '출발 노드입니다.'
      },
      {
        id: 'target',
        laneId: lanes[toColumn].id,
        row: toRow,
        shape: 'process',
        label: 'target',
        description: '도착 노드입니다.'
      }
    ],
    edges: [routedEdge],
    exceptions: []
  };

  return { swimlane, edge: routedEdge };
};

type ResolvedEdgeAnchors = {
  fromAnchor: FeatureSwimlaneAnchor;
  toAnchor: FeatureSwimlaneAnchor;
};

type LabelGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  lines: string[];
};

const ARCHIFY_PREVIEW_TARGETS = [
  'codi-harness-dx-platform',
  'hanmaum-science-institute',
  'blackstone-belleforet-resort',
  'integrated-sso-server',
  'hotel-reservation-platform'
] as const;

describe('Archify preview 카드 경계', () => {
  it('각 검증 artifact preview는 공통 비율과 overflow 차단을 유지한다', () => {
    for (const slug of ARCHIFY_PREVIEW_TARGETS) {
      const detail = getFeatureDetailBySlug(slug);
      if (!detail) throw new Error(`${slug} 상세을 찾을 수 없습니다.`);

      for (const swimlane of detail.swimlanes?.filter(({ archify }) => archify !== undefined) ?? []) {
        const html = renderToStaticMarkup(createElement(ProjectSwimlane, { swimlane }));
        expect(html).toContain('data-archify-swimlane="preview"');
        expect(html).toContain(`style="aspect-ratio:${getArchifyPreviewAspectRatio(swimlane.archify!.url)}"`);
        expect(html).toContain('min-w-0');
        expect(html).toContain('max-w-full');
        expect(html).toContain('overflow-hidden');
      }
    }
  });
});

describe('시에나 예약 요청·예외 흐름 geometry', () => {
  it('compact fallback에서도 예약 완료·중복 중단·PMS 5xx·timeout 경로를 충돌 없이 배치한다', () => {
    const flow = getFeatureDetailBySlug('the-siena-golf-reservation')?.swimlanes?.find(
      ({ id }) => id === 'reservation-request-and-exception-flow'
    );
    if (!flow) throw new Error('시에나 예약 요청·예외 스윔레인을 찾을 수 없습니다.');

    const layout = calculateSwimlaneLayout(flow, { width: 252, minimumFontSize: 10 });
    const labels = layout.edges.flatMap(({ label }) => (label ? [label] : []));

    expect(flow.lanes.map(({ id }) => id)).toEqual(['user', 'react', 'php-server', 'external-pms']);
    expect(flow.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'normal', outcome: 'continue' }),
        expect.objectContaining({ kind: 'exception', outcome: 'stop' }),
        expect.objectContaining({ kind: 'exception', outcome: 'recover', label: expect.stringMatching(/5xx.*재시도/) }),
        expect.objectContaining({
          kind: 'exception',
          outcome: 'recover',
          label: expect.stringMatching(/30초.*혼잡|혼잡.*30초/)
        })
      ])
    );
    expect(layout.nodes).toHaveLength(flow.steps.length);
    for (let leftIndex = 0; leftIndex < labels.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < labels.length; rightIndex += 1) {
        expect(rectanglesOverlap(labels[leftIndex], labels[rightIndex])).toBe(false);
      }
    }
  });
});

describe('스윔레인 기본 geometry', () => {
  it('노드의 상·하·좌·우 변 중앙을 anchor로 반환한다', () => {
    const node = { x: 200, y: 150, width: 120, height: 60 };

    expect(getAnchorPoint(node, 'top')).toEqual({ x: 200, y: 120 });
    expect(getAnchorPoint(node, 'right')).toEqual({ x: 260, y: 150 });
    expect(getAnchorPoint(node, 'bottom')).toEqual({ x: 200, y: 180 });
    expect(getAnchorPoint(node, 'left')).toEqual({ x: 140, y: 150 });
  });

  it('lane과 row를 고정 좌표계의 중심점으로 변환한다', () => {
    expect(getGridPoint({ column: 0, row: 0 })).toEqual({
      x: DIAGRAM_PADDING + LANE_WIDTH / 2,
      y: HEADER_HEIGHT + ROW_HEIGHT / 2
    });
    expect(getGridPoint({ column: 1, row: 2 })).toEqual({
      x: DIAGRAM_PADDING + LANE_WIDTH + LANE_WIDTH / 2,
      y: HEADER_HEIGHT + ROW_HEIGHT / 2 + ROW_HEIGHT * 2
    });
  });

  it('첫 row의 모든 노드 shape가 lane header 아래에서 시작한다', () => {
    for (const shape of ['start', 'process', 'decision', 'end', 'stop'] as const) {
      const node = getNodeGeometry(
        {
          id: shape,
          laneId: 'left',
          row: 0,
          shape,
          label: shape,
          description: `${shape} geometry를 검증합니다.`
        },
        0
      );

      expect(node.y - node.height / 2, shape).toBeGreaterThan(HEADER_HEIGHT);
    }
  });

  it('lane 수와 가장 큰 row로 자연 diagram 크기를 계산한다', () => {
    expect(getDiagramSize(geometryFixture)).toEqual({
      width: DIAGRAM_PADDING * 2 + LANE_WIDTH * 2,
      height: HEADER_HEIGHT + ROW_HEIGHT * 3 + DIAGRAM_PADDING
    });
  });
});

describe('스윔레인 edge anchor와 직교 routing', () => {
  const resolveAnchors = Reflect.get(swimlaneLayout, 'getResolvedEdgeAnchors') as
    | ((swimlane: FeatureSwimlane, edge: FeatureSwimlaneEdge) => ResolvedEdgeAnchors)
    | undefined;

  it.each([
    { fromColumn: 0, fromRow: 0, toColumn: 2, toRow: 0, expected: ['right', 'left'] },
    { fromColumn: 2, fromRow: 0, toColumn: 0, toRow: 0, expected: ['left', 'right'] },
    { fromColumn: 1, fromRow: 0, toColumn: 1, toRow: 2, expected: ['bottom', 'top'] },
    { fromColumn: 1, fromRow: 2, toColumn: 1, toRow: 0, expected: ['top', 'bottom'] }
  ] as const)('상대 위치 $expected 방향을 자동 선택한다', ({ expected, ...positions }) => {
    const fixture = createRoutingFixture(positions);

    expect(resolveAnchors).toBeTypeOf('function');
    if (!resolveAnchors) return;
    expect(resolveAnchors(fixture.swimlane, fixture.edge)).toMatchObject({
      fromAnchor: expected[0],
      toAnchor: expected[1]
    });
  });

  it('한쪽 또는 양쪽에 명시한 anchor를 자동 선택보다 우선한다', () => {
    const fixture = createRoutingFixture({
      fromColumn: 0,
      fromRow: 0,
      toColumn: 2,
      toRow: 1,
      edge: { fromAnchor: 'top', toAnchor: 'bottom' }
    });

    expect(resolveAnchors).toBeTypeOf('function');
    if (!resolveAnchors) return;
    expect(resolveAnchors(fixture.swimlane, fixture.edge)).toMatchObject({
      fromAnchor: 'top',
      toAnchor: 'bottom'
    });

    const oneSidedFixture = createRoutingFixture({
      fromColumn: 0,
      fromRow: 0,
      toColumn: 2,
      toRow: 0,
      edge: { fromAnchor: 'bottom' }
    });
    expect(resolveAnchors(oneSidedFixture.swimlane, oneSidedFixture.edge)).toMatchObject({
      fromAnchor: 'bottom',
      toAnchor: 'left'
    });
  });

  it.each([
    { toAnchor: 'left', expectedAxis: 'x', expectedDirection: 1 },
    { toAnchor: 'right', expectedAxis: 'x', expectedDirection: -1 },
    { toAnchor: 'top', expectedAxis: 'y', expectedDirection: 1 },
    { toAnchor: 'bottom', expectedAxis: 'y', expectedDirection: -1 }
  ] as const)('$toAnchor 변에 10px 이상의 수직 직선으로 도착한다', ({ toAnchor, expectedAxis, expectedDirection }) => {
    const fixture = createRoutingFixture({
      fromColumn: 0,
      fromRow: 0,
      toColumn: 2,
      toRow: 2,
      edge: { fromAnchor: 'right', toAnchor }
    });
    const points = getEdgePoints(fixture.swimlane, fixture.edge);

    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      expect(previous.x === current.x || previous.y === current.y).toBe(true);
      expect(previous).not.toEqual(current);
    }

    const beforeTarget = points.at(-2)!;
    const beforeCorner = points.at(-3)!;
    const target = points.at(-1)!;
    const delta = expectedAxis === 'x' ? target.x - beforeTarget.x : target.y - beforeTarget.y;
    const crossDelta = expectedAxis === 'x' ? target.y - beforeTarget.y : target.x - beforeTarget.x;
    const incomingLength = Math.hypot(beforeTarget.x - beforeCorner.x, beforeTarget.y - beforeCorner.y);
    const finalLength = Math.abs(delta);
    const renderedCornerRadius = Math.min(EDGE_CORNER_RADIUS, incomingLength / 2, finalLength / 2);

    expect(finalLength).toBeGreaterThanOrEqual(EDGE_END_SEGMENT_LENGTH);
    expect(finalLength - renderedCornerRadius).toBeGreaterThanOrEqual(EDGE_END_SEGMENT_LENGTH);
    expect(Math.sign(delta)).toBe(expectedDirection);
    expect(crossDelta).toBe(0);
  });

  it('명시 waypoint를 보존하면서 중복점과 불필요한 공선점을 제거한다', () => {
    const fixture = createRoutingFixture({
      fromColumn: 0,
      fromRow: 0,
      toColumn: 2,
      toRow: 2,
      edge: {
        fromAnchor: 'bottom',
        toAnchor: 'top',
        waypoints: [{ column: 1, row: 1 }]
      }
    });
    const waypoint = getGridPoint({ column: 1, row: 1 });
    const points = getEdgePoints(fixture.swimlane, fixture.edge);

    expect(points).toContainEqual(waypoint);
    for (let index = 2; index < points.length; index += 1) {
      const before = points[index - 2];
      const middle = points[index - 1];
      const after = points[index];
      if (middle.x === waypoint.x && middle.y === waypoint.y) continue;
      expect((before.x === middle.x && middle.x === after.x) || (before.y === middle.y && middle.y === after.y)).toBe(
        false
      );
    }
  });

  it.each([
    { fromAnchor: 'right', toAnchor: 'bottom' },
    { fromAnchor: 'top', toAnchor: 'left' }
  ] as const)('명시 anchor $fromAnchor → $toAnchor에서도 180도 hairpin을 만들지 않는다', (edge) => {
    const fixture = createRoutingFixture({
      fromColumn: 0,
      fromRow: 0,
      toColumn: 2,
      toRow: 2,
      edge
    });
    const points = getEdgePoints(fixture.swimlane, fixture.edge);

    for (let index = 2; index < points.length; index += 1) {
      const before = points[index - 2];
      const middle = points[index - 1];
      const after = points[index];
      const incoming = { x: middle.x - before.x, y: middle.y - before.y };
      const outgoing = { x: after.x - middle.x, y: after.y - middle.y };

      expect(incoming.x * outgoing.x + incoming.y * outgoing.y, JSON.stringify(points)).toBeGreaterThanOrEqual(0);
    }
  });

  it('자동 경로가 source와 target 사이의 다른 노드 내부를 통과하지 않는다', () => {
    const fixture = createRoutingFixture({ fromColumn: 0, fromRow: 0, toColumn: 2, toRow: 0 });
    fixture.swimlane.steps.splice(1, 0, {
      id: 'blocker',
      laneId: 'center',
      row: 0,
      shape: 'process',
      label: 'blocker',
      description: '직선 경로 사이의 노드입니다.'
    });
    const blocker = getNodeGeometry(fixture.swimlane.steps[1], 1);
    const points = getEdgePoints(fixture.swimlane, fixture.edge);

    for (let index = 1; index < points.length; index += 1) {
      const from = points[index - 1];
      const to = points[index];
      const crossesHorizontally =
        from.y === to.y &&
        from.y > blocker.y - blocker.height / 2 &&
        from.y < blocker.y + blocker.height / 2 &&
        Math.max(from.x, to.x) > blocker.x - blocker.width / 2 &&
        Math.min(from.x, to.x) < blocker.x + blocker.width / 2;
      const crossesVertically =
        from.x === to.x &&
        from.x > blocker.x - blocker.width / 2 &&
        from.x < blocker.x + blocker.width / 2 &&
        Math.max(from.y, to.y) > blocker.y - blocker.height / 2 &&
        Math.min(from.y, to.y) < blocker.y + blocker.height / 2;

      expect(crossesHorizontally || crossesVertically).toBe(false);
    }
  });

  it('명시 waypoint가 다른 노드 내부에 있으면 경로 생성을 차단한다', () => {
    const fixture = createRoutingFixture({
      fromColumn: 0,
      fromRow: 0,
      toColumn: 2,
      toRow: 2,
      edge: { waypoints: [{ column: 1, row: 1 }] }
    });
    fixture.swimlane.steps.splice(1, 0, {
      id: 'blocker',
      laneId: 'center',
      row: 1,
      shape: 'process',
      label: 'blocker',
      description: 'waypoint와 겹치는 노드입니다.'
    });

    expect(() => getEdgePoints(fixture.swimlane, fixture.edge)).toThrow(/waypoint.*blocker/);
  });
});

describe('스윔레인 둥근 path와 label pill', () => {
  const toRoundedPath = Reflect.get(swimlaneLayout, 'toRoundedPath') as
    | ((points: Array<{ x: number; y: number }>, radius?: number) => string)
    | undefined;
  const getEdgeLabelGeometry = Reflect.get(swimlaneLayout, 'getEdgeLabelGeometry') as
    | ((
        text: string,
        points: Array<{ x: number; y: number }>,
        size: { width: number; height: number },
        explicitPoint?: { x: number; y: number }
      ) => LabelGeometry)
    | undefined;

  it('직교점 배열을 최대 8px 곡률의 단일 path로 변환한다', () => {
    expect(toRoundedPath).toBeTypeOf('function');
    if (!toRoundedPath) return;

    expect(
      toRoundedPath([
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { x: 40, y: 40 }
      ])
    ).toBe('M 0 0 L 32 0 Q 40 0 40 8 L 40 40');
  });

  it('짧은 구간에서는 곡률을 인접 구간 절반으로 줄인다', () => {
    expect(toRoundedPath).toBeTypeOf('function');
    if (!toRoundedPath) return;

    expect(
      toRoundedPath([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 20 }
      ])
    ).toBe('M 0 0 L 5 0 Q 10 0 10 5 L 10 20');
  });

  it('마지막 구간이 10px이면 곡률로 도착 직선을 줄이지 않는다', () => {
    expect(toRoundedPath).toBeTypeOf('function');
    if (!toRoundedPath) return;

    expect(
      toRoundedPath([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 }
      ])
    ).toBe('M 0 0 L 10 0 L 10 10');
  });

  it('자동 label을 가장 긴 구간 중앙에 두고 전체 pill을 경계 안으로 보정한다', () => {
    expect(getEdgeLabelGeometry).toBeTypeOf('function');
    if (!getEdgeLabelGeometry) return;

    const size = { width: 280, height: 320 };
    const geometry = getEdgeLabelGeometry(
      '원인 수정 후 처음부터 재실행',
      [
        { x: 20, y: 20 },
        { x: 30, y: 20 },
        { x: 30, y: 220 },
        { x: 40, y: 220 }
      ],
      size
    );

    expect(geometry.text).toBe('원인 수정 후 처음부터 재실행');
    expect(geometry.lines.join('')).toBe(geometry.text);
    expect(geometry.height).toBeGreaterThan(0);
    expect(geometry.width).toBeGreaterThan(geometry.text.length * 6);
    expect(geometry.x - geometry.width / 2).toBeGreaterThanOrEqual(DIAGRAM_PADDING);
    expect(geometry.x + geometry.width / 2).toBeLessThanOrEqual(size.width - DIAGRAM_PADDING);
    expect(geometry.y - geometry.height / 2).toBeGreaterThanOrEqual(DIAGRAM_PADDING);
    expect(geometry.y + geometry.height / 2).toBeLessThanOrEqual(size.height - DIAGRAM_PADDING);
  });

  it('text-xs에서 한글을 Latin과 공백보다 보수적인 폭으로 계산한다', () => {
    expect(getEdgeLabelGeometry).toBeTypeOf('function');
    if (!getEdgeLabelGeometry) return;

    const points = [
      { x: 100, y: 100 },
      { x: 400, y: 100 }
    ];
    const size = { width: 500, height: 320 };
    const korean = getEdgeLabelGeometry('한글너비', points, size);
    const latin = getEdgeLabelGeometry('ABCD', points, size);
    const latinWithSpace = getEdgeLabelGeometry('AB C', points, size);

    expect(korean.width).toBeGreaterThan(latin.width);
    expect(latin.width).toBeGreaterThan(latinWithSpace.width);
  });

  it('긴 혼합 label을 여러 행으로 나누고 모든 행과 pill을 viewBox 안에 둔다', () => {
    expect(getEdgeLabelGeometry).toBeTypeOf('function');
    if (!getEdgeLabelGeometry) return;

    const size = { width: 280, height: 320 };
    const text = '배포 workflow 실패 원인 수정 후 처음부터 다시 실행하고 verify results';
    const geometry = getEdgeLabelGeometry(
      text,
      [
        { x: 20, y: 20 },
        { x: 260, y: 20 }
      ],
      size,
      { x: 270, y: 310 }
    );

    expect(geometry.lines.length).toBeGreaterThan(1);
    expect(geometry.lines.join('')).toBe(text);
    expect(geometry.height).toBeGreaterThan(EDGE_LABEL_HEIGHT);
    for (const line of geometry.lines) {
      const lineGeometry = getEdgeLabelGeometry(line, [{ x: 0, y: 0 }], size);
      expect(lineGeometry.width).toBeLessThanOrEqual(geometry.width);
    }
    expect(geometry.width).toBeLessThanOrEqual(size.width - DIAGRAM_PADDING * 2);
    expect(geometry.x - geometry.width / 2).toBeGreaterThanOrEqual(DIAGRAM_PADDING);
    expect(geometry.x + geometry.width / 2).toBeLessThanOrEqual(size.width - DIAGRAM_PADDING);
    expect(geometry.y - geometry.height / 2).toBeGreaterThanOrEqual(DIAGRAM_PADDING);
    expect(geometry.y + geometry.height / 2).toBeLessThanOrEqual(size.height - DIAGRAM_PADDING);
  });

  it('명시 labelAt 좌표를 우선한 뒤 pill 경계를 보정한다', () => {
    expect(getEdgeLabelGeometry).toBeTypeOf('function');
    if (!getEdgeLabelGeometry) return;

    const size = { width: 500, height: 320 };
    const explicitPoint = { x: 470, y: 120 };
    const geometry = getEdgeLabelGeometry(
      '명시 위치',
      [
        { x: 100, y: 100 },
        { x: 400, y: 100 }
      ],
      size,
      explicitPoint
    );

    expect(geometry.y).toBe(explicitPoint.y);
    expect(geometry.x).toBeLessThan(explicitPoint.x);
    expect(geometry.x + geometry.width / 2).toBeLessThanOrEqual(size.width - DIAGRAM_PADDING);
  });
});

describe('viewport 기반 스윔레인 layout', () => {
  const getResponsiveFixture = (laneCount: 3 | 4): FeatureSwimlane => ({
    id: `responsive-${laneCount}`,
    title: '반응형 fixture',
    purpose: '좁은 폭에서도 구조와 문구를 보존합니다.',
    summary: '긴 문구가 node 안에서 줄바꿈됩니다.',
    lanes: Array.from({ length: laneCount }, (_, index) => ({ id: `lane-${index}`, label: `담당 ${index + 1}` })),
    steps: [
      {
        id: 'start',
        laneId: 'lane-0',
        row: 0,
        shape: 'start',
        label: '사용자가 결제와 예약 생성을 요청',
        description: '긴 시작 문구입니다.'
      },
      {
        id: 'decision',
        laneId: `lane-${laneCount - 1}`,
        row: 1,
        shape: 'decision',
        label: '외부 응답과 식별자 생성 결과를 판단',
        description: '긴 판단 문구입니다.'
      },
      {
        id: 'end',
        laneId: 'lane-0',
        row: 2,
        shape: 'end',
        label: '전체 처리 완료',
        description: '종료 문구입니다.'
      }
    ],
    edges: [
      {
        id: 'start-decision',
        from: 'start',
        to: 'decision',
        kind: 'normal',
        outcome: 'continue',
        label: '처리 결과 전달'
      },
      {
        id: 'decision-end',
        from: 'decision',
        to: 'end',
        kind: 'normal',
        outcome: 'continue',
        label: '완료 조건 충족'
      }
    ],
    exceptions: []
  });

  it.each([
    { laneCount: 4 as const, width: 252 },
    { laneCount: 4 as const, width: 307 },
    { laneCount: 4 as const, width: 684 },
    { laneCount: 3 as const, width: 766.7 }
  ])('$laneCount-lane $width px에서 10px 글자와 node 안전 영역을 유지한다', ({ laneCount, width }) => {
    const swimlane = getResponsiveFixture(laneCount);
    const layout = calculateSwimlaneLayout(swimlane, { width, minimumFontSize: 10 });

    expect(layout.size.width).toBeCloseTo(width, 1);
    expect(layout.lanes).toHaveLength(laneCount);
    expect(layout.nodes).toHaveLength(swimlane.steps.length);
    expect(layout.edges).toHaveLength(swimlane.edges.length);

    for (const node of layout.nodes) {
      expect(node.text.fontSize).toBeGreaterThanOrEqual(10);
      expect(node.text.lines.join('')).toBe(node.step.label);
      expect(node.text.width).toBeLessThanOrEqual(node.safeTextRect.width);
      expect(node.text.height).toBeLessThanOrEqual(node.safeTextRect.height);
    }
  });

  it('긴 node 문구의 줄 수에 맞춰 node와 다음 row 간격을 늘린다', () => {
    const swimlane = getResponsiveFixture(4);
    const narrow = calculateSwimlaneLayout(swimlane, { width: 252, minimumFontSize: 10 });
    const wide = calculateSwimlaneLayout(swimlane, { width: 684, minimumFontSize: 10 });
    const narrowStart = narrow.nodes.find(({ step }) => step.id === 'start');
    const wideStart = wide.nodes.find(({ step }) => step.id === 'start');

    expect(narrowStart?.text.lines.length).toBeGreaterThan(wideStart?.text.lines.length ?? 0);
    expect(narrowStart?.height).toBeGreaterThan(wideStart?.height ?? 0);
    expect(narrow.rowCenters[1] - narrow.rowCenters[0]).toBeGreaterThan(wide.rowCenters[1] - wide.rowCenters[0]);
  });

  it.each(['top', 'right', 'bottom', 'left'] as const)(
    'compact 반응형 경로가 $toAnchor 도착 전에 렌더링 직선 10px를 보존한다',
    (toAnchor) => {
      const fixture = createRoutingFixture({
        fromColumn: 0,
        fromRow: 0,
        toColumn: 2,
        toRow: 2,
        edge: { fromAnchor: 'right', toAnchor }
      });
      const layout = calculateSwimlaneLayout(fixture.swimlane, { width: 252, minimumFontSize: 10 });

      expect(getRoundedFinalStraightLength(layout.edges[0].points)).toBeGreaterThanOrEqual(EDGE_END_SEGMENT_LENGTH);
    }
  );

  it('실제 5개 작업물의 모든 반응형 경로가 지원 폭에서 렌더링 직선 10px를 보존한다', () => {
    const slugs = [
      'codi-harness-dx-platform',
      'hanmaum-science-institute',
      'blackstone-belleforet-resort',
      'integrated-sso-server',
      'hotel-reservation-platform'
    ] as const;

    for (const slug of slugs) {
      const detail = getFeatureDetailBySlug(slug);
      if (!detail?.swimlanes) throw new Error(`${slug} 스윔레인을 찾을 수 없습니다.`);

      for (const width of [252, 307, 684, 766.7]) {
        for (const swimlane of detail.swimlanes) {
          const layout = calculateSwimlaneLayout(swimlane, { width, minimumFontSize: 10 });

          for (const { edge, points } of layout.edges) {
            expect(
              getRoundedFinalStraightLength(points),
              `${slug}/${swimlane.id}/${edge.id}/${width}px`
            ).toBeGreaterThanOrEqual(EDGE_END_SEGMENT_LENGTH);
          }
        }
      }
    }
  });

  it('실제 5개 작업물의 연결선이 비연결 node를 관통하거나 행 범위 밖으로 역주행하지 않는다', () => {
    const slugs = [
      'codi-harness-dx-platform',
      'hanmaum-science-institute',
      'blackstone-belleforet-resort',
      'integrated-sso-server',
      'hotel-reservation-platform'
    ] as const;
    const segmentCrossesNode = (
      from: { x: number; y: number },
      to: { x: number; y: number },
      node: { x: number; y: number; width: number; height: number }
    ) => {
      const left = node.x - node.width / 2;
      const right = node.x + node.width / 2;
      const top = node.y - node.height / 2;
      const bottom = node.y + node.height / 2;

      if (from.y === to.y) {
        return from.y > top && from.y < bottom && Math.max(from.x, to.x) > left && Math.min(from.x, to.x) < right;
      }

      return from.x > left && from.x < right && Math.max(from.y, to.y) > top && Math.min(from.y, to.y) < bottom;
    };

    for (const slug of slugs) {
      const detail = getFeatureDetailBySlug(slug);
      if (!detail?.swimlanes) throw new Error(`${slug} 스윔레인을 찾을 수 없습니다.`);

      for (const width of [252, 307, 684, 766.7]) {
        for (const swimlane of detail.swimlanes) {
          const layout = calculateSwimlaneLayout(swimlane, { width, minimumFontSize: 10 });

          for (const edgeLayout of layout.edges) {
            const { edge, points } = edgeLayout;
            const unrelatedNodes = layout.nodes.filter(({ step }) => step.id !== edge.from && step.id !== edge.to);

            for (let index = 1; index < points.length; index += 1) {
              const crossedNode = unrelatedNodes.find((node) =>
                segmentCrossesNode(points[index - 1], points[index], node)
              );
              expect(
                crossedNode?.step.id,
                `${slug}/${swimlane.id}/${edge.id}/${width}px segment ${index - 1}-${index} ` +
                  `${JSON.stringify(points[index - 1])}->${JSON.stringify(points[index])} ` +
                  `node=${crossedNode ? JSON.stringify({ x: crossedNode.x, y: crossedNode.y, width: crossedNode.width, height: crossedNode.height }) : 'none'}`
              ).toBeUndefined();
            }

            const fromNode = layout.nodes.find(({ step }) => step.id === edge.from)!;
            const toNode = layout.nodes.find(({ step }) => step.id === edge.to)!;
            if (edge.fromAnchor === 'bottom' && edge.toAnchor === 'top' && toNode.y > fromNode.y) {
              const startY = getAnchorPoint(fromNode, 'bottom').y;
              const endY = getAnchorPoint(toNode, 'top').y;
              expect(
                Math.min(...points.map(({ y }) => y)),
                `${slug}/${swimlane.id}/${edge.id}/${width}px minimum y`
              ).toBeGreaterThanOrEqual(startY);
              expect(
                Math.max(...points.map(({ y }) => y)),
                `${slug}/${swimlane.id}/${edge.id}/${width}px maximum y`
              ).toBeLessThanOrEqual(endY);
            }
          }
        }
      }
    }
  });

  it('CI/CD 실패 분기는 배포 중단 node의 오른쪽, 시크릿 불일치는 아래쪽으로 도착한다', () => {
    const detail = getFeatureDetailBySlug('codi-harness-dx-platform');
    const swimlane = detail?.swimlanes?.find(({ id }) => id === 'cicd-secrets-deployment');
    if (!swimlane) throw new Error('CI/CD·시크릿·배포 스윔레인을 찾을 수 없습니다.');

    expect(swimlane.edges.find(({ id }) => id === 'quality-stop')?.toAnchor).toBe('right');
    expect(swimlane.edges.find(({ id }) => id === 'secrets-stop')?.toAnchor).toBe('bottom');
  });

  it('시크릿 불일치 경로는 배포 중단 node를 가로지르지 않고 아래쪽 변으로 진입한다', () => {
    const detail = getFeatureDetailBySlug('codi-harness-dx-platform');
    const swimlane = detail?.swimlanes?.find(({ id }) => id === 'cicd-secrets-deployment');
    if (!swimlane) throw new Error('CI/CD·시크릿·배포 스윔레인을 찾을 수 없습니다.');

    const layout = calculateSwimlaneLayout(swimlane, { width: 766.7, minimumFontSize: 10 });
    const stopped = layout.nodes.find(({ step }) => step.id === 'stopped');
    const secretsStop = layout.edges.find(({ edge }) => edge.id === 'secrets-stop');
    if (!stopped || !secretsStop) throw new Error('배포 중단 node 또는 시크릿 불일치 경로를 찾을 수 없습니다.');

    const targetBounds = {
      left: stopped.x - stopped.width / 2,
      right: stopped.x + stopped.width / 2,
      top: stopped.y - stopped.height / 2,
      bottom: stopped.y + stopped.height / 2
    };
    const crossesTargetBeforeArrival = secretsStop.points.slice(1, -1).some((to, index) => {
      const from = secretsStop.points[index];
      if (from.y === to.y) {
        return (
          from.y > targetBounds.top &&
          from.y < targetBounds.bottom &&
          Math.max(from.x, to.x) > targetBounds.left &&
          Math.min(from.x, to.x) < targetBounds.right
        );
      }
      return (
        from.x > targetBounds.left &&
        from.x < targetBounds.right &&
        Math.max(from.y, to.y) > targetBounds.top &&
        Math.min(from.y, to.y) < targetBounds.bottom
      );
    });

    expect(crossesTargetBeforeArrival).toBe(false);
    expect(secretsStop.points.at(-2)?.y).toBeGreaterThan(secretsStop.points.at(-1)?.y ?? Number.POSITIVE_INFINITY);
  });

  it.each([252, 307, 684, 766.7])('블랙스톤 결과 분기를 목적지 좌→우 순서의 계단형 통로로 구분한다: %spx', (width) => {
    const detail = getFeatureDetailBySlug('blackstone-belleforet-resort');
    const swimlane = detail?.swimlanes?.find(({ id }) => id === 'payment-and-compensation');
    if (!swimlane) throw new Error('결제·보상취소 흐름 스윔레인을 찾을 수 없습니다.');

    const layout = calculateSwimlaneLayout(swimlane, { width, minimumFontSize: 10 });
    const getLongestHorizontalChannelY = (edgeId: string): number => {
      const edge = layout.edges.find(({ edge: candidate }) => candidate.id === edgeId);
      if (!edge) throw new Error(`${edgeId} 경로를 찾을 수 없습니다.`);

      const horizontalSegments = edge.points
        .slice(1)
        .map((to, index) => ({ from: edge.points[index], to }))
        .filter(({ from, to }) => from.y === to.y && from.x !== to.x)
        .sort((left, right) => Math.abs(right.to.x - right.from.x) - Math.abs(left.to.x - left.from.x));
      if (!horizontalSegments[0]) throw new Error(`${edgeId}의 수평 통로를 찾을 수 없습니다.`);
      return horizontalSegments[0].from.y;
    };

    const channelYs = ['evaluate-complete', 'evaluate-compensate', 'evaluate-timeout'].map(
      getLongestHorizontalChannelY
    );
    expect(channelYs[0]).toBeLessThan(channelYs[1]);
    expect(channelYs[1]).toBeLessThan(channelYs[2]);

    const outage = layout.edges.find(({ edge }) => edge.id === 'evaluate-outage');
    expect(new Set(outage?.points.map(({ x }) => x)).size).toBe(1);
  });
});

describe('rounded path 중앙과 label 충돌 resolver', () => {
  const getLabelFallbackFixture = (label: string): FeatureSwimlane => ({
    id: 'label-fallback',
    title: 'label 줄바꿈',
    purpose: 'label 줄 수 폴백을 확인합니다.',
    summary: '빈 가운데 row에 label을 고정합니다.',
    lanes: [
      { id: 'left', label: '왼쪽' },
      { id: 'right', label: '오른쪽' }
    ],
    steps: [
      { id: 'from', laneId: 'left', row: 0, shape: 'start', label: '시작', description: '시작' },
      { id: 'to', laneId: 'right', row: 2, shape: 'end', label: '종료', description: '종료' }
    ],
    edges: [
      {
        id: 'from-to',
        from: 'from',
        to: 'to',
        kind: 'normal',
        outcome: 'continue',
        label,
        labelAt: { column: 0.5, row: 1 }
      }
    ],
    exceptions: []
  });

  it('quadratic corner를 포함한 전체 rounded path 길이의 50% 지점을 계산한다', () => {
    expect(
      getRoundedPathPointAtRatio(
        [
          { x: 0, y: 0 },
          { x: 40, y: 0 },
          { x: 40, y: 40 }
        ],
        0.5
      )
    ).toEqual({ x: 38, y: 2 });
  });

  it('충돌이 없는 자동 label은 path 중앙과 0번 track을 유지한다', () => {
    const swimlane: FeatureSwimlane = {
      id: 'single-label',
      title: '단일 label',
      purpose: '충돌 없는 중앙 배치를 확인합니다.',
      summary: '한 edge만 있습니다.',
      lanes: [
        { id: 'left', label: '왼쪽' },
        { id: 'right', label: '오른쪽' }
      ],
      steps: [
        { id: 'from', laneId: 'left', row: 0, shape: 'start', label: '시작', description: '시작' },
        { id: 'to', laneId: 'right', row: 1, shape: 'end', label: '종료', description: '종료' }
      ],
      edges: [
        {
          id: 'from-to',
          from: 'from',
          to: 'to',
          kind: 'normal',
          outcome: 'continue',
          label: '충돌 없음'
        }
      ],
      exceptions: []
    };
    const layout = calculateSwimlaneLayout(swimlane, { width: 684, minimumFontSize: 10 });
    const edge = layout.edges[0];

    expect(edge.label?.track).toBe(0);
    expect(edge.label?.x).toBeCloseTo(edge.label?.basePoint.x ?? 0, 4);
    expect(edge.label?.y).toBeCloseTo(edge.label?.basePoint.y ?? 0, 4);
  });

  it('같은 중앙을 공유한 자동 label은 0/-1/+1/-2/+2의 최소 빈 track을 순서대로 사용한다', () => {
    const fixture = getLabelFallbackFixture('분기');
    const swimlane: FeatureSwimlane = {
      ...fixture,
      edges: Array.from({ length: 5 }, (_, index) => ({
        ...fixture.edges[0],
        id: `shared-${index}`,
        labelAt: undefined
      }))
    };
    const layout = calculateSwimlaneLayout(swimlane, { width: 684, minimumFontSize: 10 });

    expect(layout.edges.map(({ label }) => label?.track)).toEqual([0, -1, 1, -2, 2]);
  });

  it('label은 한 줄에서 2줄, 3줄 순으로만 폴백하고 그래도 불가능하면 오류를 낸다', () => {
    const oneLine = calculateSwimlaneLayout(getLabelFallbackFixture('한 줄'), {
      width: 252,
      minimumFontSize: 10
    });
    const twoLines = calculateSwimlaneLayout(getLabelFallbackFixture('두 줄 폴백을 확인하는 충분히 긴 라벨 문구'), {
      width: 252,
      minimumFontSize: 10
    });
    const threeLines = calculateSwimlaneLayout(
      getLabelFallbackFixture('세 줄 폴백을 확인하기 위해 두 줄보다 더 길게 작성한 라벨 문구입니다'),
      { width: 252, minimumFontSize: 10 }
    );

    expect(oneLine.edges[0].label?.lines).toHaveLength(1);
    expect(twoLines.edges[0].label?.lines).toHaveLength(2);
    expect(threeLines.edges[0].label?.lines).toHaveLength(3);
    expect(() =>
      calculateSwimlaneLayout(
        getLabelFallbackFixture(
          '세 줄 안에도 들어갈 수 없도록 같은 설명을 매우 길게 반복해서 작성한 라벨 문구입니다'.repeat(8)
        ),
        { width: 252, minimumFontSize: 10 }
      )
    ).toThrow(/label을 충돌 없이 배치할 수 없습니다/);
  });

  it('Blackstone 네 label을 원문 그대로 유지하면서 서로 겹치지 않게 배치한다', () => {
    const detail = getFeatureDetailBySlug('blackstone-belleforet-resort');
    const swimlane = detail?.swimlanes?.[0];
    if (!swimlane) throw new Error('Blackstone 스윔레인을 찾을 수 없습니다.');

    const layout = calculateSwimlaneLayout(swimlane, { width: 252, minimumFontSize: 10 });
    const labels = layout.edges.flatMap(({ label }) => (label ? [label] : []));

    expect(labels.map(({ text }) => text)).toEqual(swimlane.edges.flatMap(({ label }) => (label ? [label] : [])));
    for (let leftIndex = 0; leftIndex < labels.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < labels.length; rightIndex += 1) {
        expect(rectanglesOverlap(labels[leftIndex], labels[rightIndex])).toBe(false);
      }
    }
  });

  it('오른쪽 anchor를 공유하는 SSO 예외 경로도 compact 경계 안에 label을 유지한다', () => {
    const detail = getFeatureDetailBySlug('integrated-sso-server');
    const swimlane = detail?.swimlanes?.[0];
    if (!swimlane) throw new Error('SSO 스윔레인을 찾을 수 없습니다.');

    const layout = calculateSwimlaneLayout(swimlane, { width: 252, minimumFontSize: 10 });
    const fallbackLabel = layout.edges.find(({ edge }) => edge.id === 'provider-cache-fallback')?.label;

    expect(fallbackLabel).toBeDefined();
    expect(fallbackLabel!.x + fallbackLabel!.width / 2).toBeLessThanOrEqual(layout.size.width - 4);
  });

  it('명시 labelAt은 이동하지 않고 자동 label만 다른 track으로 피한다', () => {
    const swimlane = geometryFixture;
    const explicitPoint = { column: 0.5, row: 1 };
    const withLabels: FeatureSwimlane = {
      ...swimlane,
      edges: [
        { ...swimlane.edges[0], id: 'explicit', label: '명시 위치', labelAt: explicitPoint },
        { ...swimlane.edges[0], id: 'automatic', label: '자동 위치' }
      ]
    };
    const layout = calculateSwimlaneLayout(withLabels, { width: 500, minimumFontSize: 10 });
    const explicit = layout.edges.find(({ edge }) => edge.id === 'explicit')?.label;
    const automatic = layout.edges.find(({ edge }) => edge.id === 'automatic')?.label;

    expect(explicit?.placement).toBe('explicit');
    expect(explicit?.track).toBe(0);
    expect(explicit?.x).toBeCloseTo(explicit?.basePoint.x ?? 0, 4);
    expect(explicit?.y).toBeCloseTo(explicit?.basePoint.y ?? 0, 4);
    expect(automatic?.placement).toBe('automatic');
    expect(rectanglesOverlap(explicit!, automatic!)).toBe(false);
  });
});

describe('행사 호텔 예약·결제 UAT fallback geometry RED 계약', () => {
  const getUatFlow = () => {
    const flow = getFeatureDetailBySlug('integrated-reservation-platform')?.swimlanes?.find(
      ({ id }) => id === 'uat-booking-payment-flow'
    );
    if (!flow) throw new Error('행사 호텔 예약·결제 UAT 스윔레인이 등록되지 않았습니다.');
    return flow;
  };

  it('다섯 책임 lane에서 설정→예약→PAYMENT_PENDING→PG 승인→확정→관리자 확인·취소 순서를 제공한다', () => {
    const flow = getUatFlow();
    const steps = new Map(flow.steps.map((step) => [step.id, step]));
    const sequence = flow.edges.filter(({ kind }) => kind === 'normal').map(({ from, to }) => `${from}->${to}`);

    expect(flow.lanes.map(({ id }) => id)).toEqual([
      'customer-operator',
      'user',
      'nextjs-bff',
      'nest-api-db',
      'pg-test'
    ]);
    expect([...steps.values()].map(({ label, description }) => `${label}\n${description}`).join('\n')).toMatch(
      /행사.*호텔.*객실.*재고.*등록/
    );
    expect([...steps.values()].map(({ label, description }) => `${label}\n${description}`).join('\n')).toMatch(
      /PAYMENT_PENDING/
    );
    expect([...steps.values()].map(({ label, description }) => `${label}\n${description}`).join('\n')).toMatch(
      /PG 테스트 승인/
    );
    expect([...steps.values()].map(({ label, description }) => `${label}\n${description}`).join('\n')).toMatch(
      /관리자.*예약.*확인.*취소/
    );
    expect(sequence).toEqual([
      'configure-inventory->browse-and-reserve',
      'browse-and-reserve->bff-forward',
      'bff-forward->record-pending-and-decrement',
      'record-pending-and-decrement->pg-approve',
      'pg-approve->confirm-order-and-payment',
      'confirm-order-and-payment->admin-confirm-or-cancel'
    ]);
  });

  it('재고 version 충돌은 PG 호출 전에 중단하고 PG 승인 실패는 CANCELLED·ABORTED와 미완성 재고 복구를 함께 남긴다', () => {
    const flow = getUatFlow();
    const exceptionById = new Map(flow.exceptions.map((exception) => [exception.id, exception]));
    const edgeById = new Map(flow.edges.map((edge) => [edge.id, edge]));

    const inventoryConflict = exceptionById.get('inventory-version-conflict');
    const pgDeclined = exceptionById.get('pg-approval-failed');
    expect(flow.exceptions.map(({ id }) => id)).toEqual(['inventory-version-conflict', 'pg-approval-failed']);
    expect(flow.exceptions).toHaveLength(2);
    expect(flow.edges.filter(({ kind }) => kind === 'exception').map(({ id }) => id)).toEqual([
      'inventory-version-conflict-stop',
      'pg-approval-failed-stop'
    ]);
    expect(inventoryConflict?.trigger).toMatch(/version.*충돌|조건부 갱신.*0건/);
    expect(inventoryConflict?.response).toMatch(/PG 호출 전.*재시도/);
    expect(inventoryConflict?.edgeIds).toEqual(['inventory-version-conflict-stop']);
    expect(edgeById.get('inventory-version-conflict-stop')).toMatchObject({
      from: 'record-pending-and-decrement',
      to: 'inventory-conflict',
      kind: 'exception',
      outcome: 'stop'
    });
    expect(pgDeclined?.trigger).toMatch(/PG.*승인 실패/);
    expect(pgDeclined?.response).toMatch(/CANCELLED/);
    expect(pgDeclined?.response).toMatch(/ABORTED/);
    expect(pgDeclined?.response).toMatch(/재고.*자동 복구.*미완성/);
    expect(pgDeclined?.edgeIds).toEqual(['pg-approval-failed-stop']);
    expect(edgeById.get('pg-approval-failed-stop')).toMatchObject({
      from: 'pg-approve',
      to: 'pg-failed',
      kind: 'exception',
      outcome: 'stop'
    });
  });

  it.each([252, 320])('실제 fallback layout은 %ipx에서 렌더링 예외 없이 좌표를 배치한다', (width) => {
    const flow = getUatFlow();

    const layout = calculateSwimlaneLayout(flow, { width, minimumFontSize: 10 });
    expect(
      layout.nodes.every((node, index) =>
        layout.nodes.slice(index + 1).every((other) => !rectanglesOverlap(node, other))
      )
    ).toBe(true);
    expect(
      layout.edges.every(({ points }) => points.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y)))
    ).toBe(true);
    expect(layout.edges.filter(({ edge }) => edge.label).every(({ label }) => label !== undefined)).toBe(true);
  });
});
