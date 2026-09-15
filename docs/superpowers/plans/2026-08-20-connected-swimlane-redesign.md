# Connected Swimlane Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the harness portfolio's disconnected lane cards and technical edge list with two reusable, data-driven cross-functional SVG swimlanes, while replacing the ambiguous metric label `제한` with evidence-specific scope labels.

**Architecture:** Extend the static portfolio DTO with explicit node positions, shapes, edge anchors, normalized waypoints, and visitor-facing exception narratives. A pure geometry module converts grid data into SVG coordinates, while a server-rendered `ProjectSwimlaneDiagram` draws the lanes, nodes, decisions, and arrows; `ProjectSwimlane` owns the accessible figure, horizontal scroll region, flow summary, and exception prose.

**Tech Stack:** TypeScript 5, React 19 Server Components, Next.js 16 App Router, SVG, Tailwind CSS 4, Vitest 4, Playwright 1.62.1

---

## Plan-of-record note

This document is implementation input, not durable feature state. Before editing application code,
create a new Spec Kit follow-up feature from the approved design in
`docs/superpowers/specs/2026-08-20-codi-harness-portfolio-detail-design.md`, complete the repository's
clarify handoff, and wait for an explicit `codi-auto-loop` start. The resulting
`specs/003-connected-swimlane-redesign/` directory owns the execution checklist and verification
record. The harness implement phase never commits; the commit steps normally suggested by
`superpowers:writing-plans` are intentionally omitted.

## File responsibility map

- `apps/front/src/data/portfolio/types/feature-detail.dto.ts`: public detail, metric, node, edge,
  route, and exception contracts.
- `apps/front/src/data/portfolio/index.ts` and `apps/front/src/data/portfolio/types/index.ts`:
  newly added connected-flow type exports.
- `apps/front/src/data/portfolio/feature-details/index.ts`: build-time content validation, graph
  reachability, and layout integrity.
- `apps/front/src/data/portfolio/feature-details/codi-harness-dx-platform.ts`: the two approved
  six-stage harness flows and their exception narratives.
- `apps/front/src/components/projects/project-swimlane-layout.ts`: pure grid-to-SVG geometry only.
- `apps/front/src/components/projects/ProjectSwimlaneDiagram.tsx`: SVG primitives and connecting
  paths only.
- `apps/front/src/components/projects/ProjectSwimlane.tsx`: figure semantics, scroll boundary,
  summary, and exception copy.
- `apps/front/src/components/projects/ProjectHighlights.tsx`: evidence-specific scope labels.
- `apps/front/src/data/portfolio/feature-detail-quality.test.ts`: invalid graph and content
  contract tests.
- `apps/front/src/components/projects/project-swimlane-layout.test.ts`: deterministic geometry
  tests without React.
- `apps/front/src/components/projects/project-detail-rendering.test.tsx`: server-rendered public
  wording and SVG semantics.
- `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`: keyboard, responsive, dark-mode, and
  public-flow acceptance tests.

### Task 1: Replace the ambiguous metric caveat label

**Files:**

- Modify: `apps/front/src/components/projects/project-detail-rendering.test.tsx`
- Modify: `apps/front/src/components/projects/ProjectHighlights.tsx`

- [ ] **Step 1: Write a failing rendering test for evidence-specific scope labels**

Add a focused fixture with one metric of each kind and assert the public labels:

```tsx
it('지표의 해석 범위를 근거 종류에 맞는 문구로 표시한다', () => {
  const html = renderToStaticMarkup(
    <ProjectHighlights
      highlights={[
        {
          id: 'estimate',
          label: '비용',
          value: '$151.84/월',
          kind: 'estimated',
          asOf: '2026-08-20',
          evidence: 'AWS 공개 가격',
          caveat: '컴퓨팅 비용만 포함한다.'
        },
        {
          id: 'measurement',
          label: '배포 시간',
          value: '약 3분',
          kind: 'measured',
          asOf: '2026-08-20',
          evidence: '실행 화면 비교',
          caveat: '5개 호텔 배포 실행을 비교했다.'
        },
        {
          id: 'observation',
          label: '재발 여부',
          value: '미발생',
          kind: 'reported',
          asOf: '2026-08-20',
          evidence: '전환 후 운영 관찰',
          caveat: '향후 가능성이 0이라는 의미는 아니다.'
        }
      ]}
    />
  );

  expect(html).toContain('산정 범위');
  expect(html).toContain('측정 범위');
  expect(html).toContain('관찰 범위');
  expect(html).not.toContain('제한:');
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
pnpm --dir apps/front exec vitest run src/components/projects/project-detail-rendering.test.tsx
```

Expected: FAIL because `ProjectHighlights` still renders `제한:` for every caveat.

- [ ] **Step 3: Add the scope-label mapping**

In `ProjectHighlights.tsx`, keep `caveat` as the internal field name and translate only the public
label:

```ts
const METRIC_SCOPE_LABEL: Record<FeatureMetricKind, string> = {
  measured: '측정 범위',
  reported: '관찰 범위',
  estimated: '산정 범위'
};
```

Replace the caveat paragraph body with:

```tsx
<span className='font-medium'>{METRIC_SCOPE_LABEL[highlight.kind]}</span>
<span>: {highlight.caveat}</span>
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the Step 2 command again.

Expected: all rendering tests pass and the HTML contains no `제한:` label.

### Task 2: Define and validate the connected-flow data contract

**Files:**

- Modify: `apps/front/src/data/portfolio/types/feature-detail.dto.ts`
- Modify: `apps/front/src/data/portfolio/types/index.ts`
- Modify: `apps/front/src/data/portfolio/index.ts`
- Modify: `apps/front/src/data/portfolio/feature-detail-quality.test.ts`
- Modify: `apps/front/src/data/portfolio/feature-details/index.ts`

- [ ] **Step 1: Write failing validation tests**

Add tests for a duplicate node position, a missing start/end, a disconnected normal path, an
exception without visitor-facing prose, and an exception referencing a normal edge. Use this
minimal valid flow fixture:

```ts
const createValidSwimlane = (): FeatureSwimlane => ({
  id: 'flow',
  title: '검증 흐름',
  purpose: '연결형 흐름을 검증한다.',
  summary: '시작한 뒤 작업을 수행하고 완료한다.',
  lanes: [
    { id: 'requester', label: '요청자' },
    { id: 'worker', label: '작업자' }
  ],
  steps: [
    {
      id: 'start',
      laneId: 'requester',
      row: 0,
      shape: 'start',
      label: '시작',
      description: '요청한다.'
    },
    {
      id: 'work',
      laneId: 'worker',
      row: 1,
      shape: 'process',
      label: '작업',
      description: '처리한다.'
    },
    {
      id: 'finish',
      laneId: 'worker',
      row: 2,
      shape: 'end',
      label: '완료',
      description: '결과를 확인한다.'
    }
  ],
  edges: [
    {
      id: 'start-work',
      from: 'start',
      to: 'work',
      kind: 'normal',
      outcome: 'continue',
      fromAnchor: 'bottom',
      toAnchor: 'top'
    },
    {
      id: 'work-finish',
      from: 'work',
      to: 'finish',
      kind: 'normal',
      outcome: 'continue',
      fromAnchor: 'bottom',
      toAnchor: 'top'
    }
  ],
  exceptions: []
});
```

Assert exact Korean error paths for:

```ts
'swimlanes[0].steps: lane "worker"의 row 1 위치가 중복됩니다.'
'swimlanes[0].steps: start node가 정확히 하나 필요합니다.'
'swimlanes[0].steps: end node가 정확히 하나 필요합니다.'
'swimlanes[0].edges: start에서 end까지 이어지는 정상 경로가 필요합니다.'
'swimlanes[0].exceptions[0].response: 필수 값이 비어 있습니다.'
'swimlanes[0].exceptions[0].edgeIds[0]: exception edge를 참조해야 합니다.'
```

- [ ] **Step 2: Run the contract test and verify RED**

Run:

```bash
pnpm --dir apps/front exec vitest run src/data/portfolio/feature-detail-quality.test.ts
```

Expected: TypeScript compilation fails because the position, shape, anchor, summary, and exception
fields do not exist yet.

- [ ] **Step 3: Replace the old edge contract with the connected-flow types**

Define these types in `feature-detail.dto.ts` and export them through the existing type barrel:

```ts
export type FeatureSwimlaneNodeShape = 'start' | 'process' | 'decision' | 'end' | 'stop';
export type FeatureSwimlaneAnchor = 'top' | 'right' | 'bottom' | 'left';

export interface FeatureSwimlanePoint {
  column: number;
  row: number;
}

export interface FeatureSwimlaneStep {
  id: string;
  laneId: string;
  row: number;
  shape: FeatureSwimlaneNodeShape;
  label: string;
  description: string;
}

export interface FeatureSwimlaneEdge {
  id: string;
  from: string;
  to: string;
  kind: 'normal' | 'exception';
  outcome: 'continue' | 'recover' | 'stop';
  fromAnchor: FeatureSwimlaneAnchor;
  toAnchor: FeatureSwimlaneAnchor;
  label?: string;
  labelAt?: FeatureSwimlanePoint;
  waypoints?: FeatureSwimlanePoint[];
}

export interface FeatureSwimlaneException {
  id: string;
  trigger: string;
  response: string;
  edgeIds: string[];
}

export interface FeatureSwimlane {
  id: string;
  title: string;
  purpose: string;
  lanes: FeatureSwimlaneLane[];
  steps: FeatureSwimlaneStep[];
  edges: FeatureSwimlaneEdge[];
  summary: string;
  exceptions: FeatureSwimlaneException[];
}
```

- [ ] **Step 4: Implement graph and layout validation**

Add a pure reachability helper in `feature-details/index.ts`:

```ts
const hasNormalPath = (swimlane: FeatureSwimlane, startId: string, endId: string): boolean => {
  const adjacency = new Map<string, string[]>();

  swimlane.edges
    .filter((edge) => edge.kind === 'normal')
    .forEach((edge) => adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge.to]));

  const queue = [startId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === endId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    queue.push(...(adjacency.get(current) ?? []));
  }

  return false;
};
```

Extend `validateFeatureDetail` to enforce:

```ts
const startSteps = swimlane.steps.filter(({ shape }) => shape === 'start');
const endSteps = swimlane.steps.filter(({ shape }) => shape === 'end');

if (startSteps.length !== 1) {
  errors.push(`${swimlanePath}.steps: start node가 정확히 하나 필요합니다.`);
}
if (endSteps.length !== 1) {
  errors.push(`${swimlanePath}.steps: end node가 정확히 하나 필요합니다.`);
}
if (
  startSteps.length === 1 &&
  endSteps.length === 1 &&
  !hasNormalPath(swimlane, startSteps[0].id, endSteps[0].id)
) {
  errors.push(`${swimlanePath}.edges: start에서 end까지 이어지는 정상 경로가 필요합니다.`);
}
```

Also validate finite non-negative integer step rows, unique `[laneId, row]`, valid anchors, and
finite waypoint/label coordinates within column `-0.5..lanes.length - 0.5` and row
`0..maximum step row`. Require every non-stop step to be reachable from start and able to reach end
through normal edges, and require every normal edge to progress to a greater row. Enforce
`normal/continue` and `exception/recover|stop`, require a stop outcome to target a stop node, and
forbid normal edges from targeting stop nodes. Require nonblank `summary`, nonblank exception
`trigger` and `response`, a nonblank label on every exception edge, every `edgeIds` entry to
reference an exception edge, and every exception edge to be covered by at least one narrative.

- [ ] **Step 5: Run the contract test and verify GREEN**

Run the Step 2 command.

Expected: all data-contract tests pass.

### Task 3: Write connected-flow rendering and browser acceptance tests before UI changes

Before migrating flow data or replacing the card UI, add the server-rendering assertions described
in Task 6 and the Playwright assertions described in Task 7. Run both focused commands against the
current card UI and record RED because no connected SVG exists. Include the retained no-demo CTA,
internal/external link, eight-route, legacy-content, responsive, keyboard, and dark-mode contracts.

### Task 4: Migrate the two harness flows to the approved six-stage narratives

**Files:**

- Modify: `apps/front/src/data/portfolio/feature-detail-quality.test.ts`
- Modify: `apps/front/src/data/portfolio/feature-details/codi-harness-dx-platform.ts`

- [ ] **Step 1: Write the failing content assertions**

Replace assertions for the old eight-step/card presentation with the approved sequences:

```ts
expect(designFlow.steps.filter(({ id }) => id !== 'complete').map(({ label }) => label)).toEqual([
  '요청·맥락 전달',
  '문제 정의',
  '명세·계획',
  '승인',
  '테스트·구현',
  '리뷰·검증'
]);

expect(deploymentFlow.steps.filter(({ shape }) => shape !== 'stop').map(({ label }) => label)).toEqual([
  '변경 감지',
  '품질 검사',
  '환경·대상 결정',
  '시크릿 조회',
  '병렬 배포',
  '결과 확인'
]);

expect(designFlow.exceptions.map(({ response }) => response)).toEqual([
  '사용자에게 추가 질문한 뒤 문제 정의를 다시 진행합니다.',
  '명세와 계획을 보강한 뒤 다시 승인을 요청합니다.',
  '테스트·구현 단계로 돌아가 수정한 뒤 다시 검증합니다.'
]);

expect(deploymentFlow.exceptions.map(({ response }) => response)).toEqual([
  '시크릿 조회와 배포를 시작하지 않습니다.',
  '배포를 중단하고 설정을 수정한 뒤 workflow를 처음부터 다시 실행합니다.'
]);
```

- [ ] **Step 2: Run the content-contract test and verify RED**

Run the Task 2 Step 2 command.

Expected: FAIL because the existing data still contains eight development steps, seven deployment
steps, separate recovery edges, and `alternativeText`.

- [ ] **Step 3: Replace the design/development flow data**

Use four lanes named `사용자`, `AI 에이전트`, `계획·구현`, and `리뷰·검증`. Define these six
ordered core nodes plus one auxiliary completion node:

```ts
[
  ['request', 'user', 0, 'start', '요청·맥락 전달'],
  ['define', 'agent', 1, 'process', '문제 정의'],
  ['plan', 'delivery', 2, 'process', '명세·계획'],
  ['approve', 'user', 3, 'decision', '승인'],
  ['implement', 'delivery', 4, 'process', '테스트·구현'],
  ['verify', 'verification', 5, 'decision', '리뷰·검증'],
  ['complete', 'verification', 6, 'end', '완료']
] as const;
```

The first six entries are the approved core stages; `완료` is an auxiliary terminal state. Create
six normal edges connecting the main order to completion and three exception edges using this route table.
Each waypoint is a normalized `{ column, row }` grid point:

| Edge | From | To | Kind / outcome | Anchors | Waypoints |
| --- | --- | --- | --- | --- | --- |
| `request-define` | `request` | `define` | normal / continue | bottom → top | `{0,0.5}`, `{1,0.5}` |
| `define-plan` | `define` | `plan` | normal / continue | bottom → top | `{1,1.5}`, `{2,1.5}` |
| `plan-approve` | `plan` | `approve` | normal / continue | bottom → top | `{2,2.5}`, `{0,2.5}` |
| `approve-implement` | `approve` | `implement` | normal / continue | bottom → top | `{0,3.5}`, `{2,3.5}` |
| `implement-verify` | `implement` | `verify` | normal / continue | bottom → top | `{2,4.5}`, `{3,4.5}` |
| `verify-complete` | `verify` | `complete` | normal / continue | bottom → top | 없음 |
| `ambiguity-return` | `define` | `request` | exception / recover | left → left | `{-0.4,1}`, `{-0.4,0}` |
| `approval-return` | `approve` | `plan` | exception / recover | left → left | `{-0.4,3}`, `{-0.4,2}` |
| `verification-return` | `verify` | `implement` | exception / recover | left → right | `{2.7,5}`, `{2.7,4}` |

Map the three exception edge IDs to the approved `trigger` and `response` sentences.
Label `approve-implement` as `승인`, `approval-return` as `미승인`, `verify-complete` as `통과`,
and `verification-return` as `실패`. Exception edges, including `ambiguity-return`, must also have
a concise visitor-facing condition label.

- [ ] **Step 4: Replace the deployment flow data**

Use lanes named `GitHub 저장소`, `GitHub Actions`, `Infisical`, and `배포 대상`. Define the six
main nodes and one auxiliary stop node:

```ts
[
  ['detect', 'repository', 0, 'start', '변경 감지'],
  ['quality', 'actions', 1, 'decision', '품질 검사'],
  ['target', 'actions', 2, 'process', '환경·대상 결정'],
  ['secrets', 'infisical', 3, 'decision', '시크릿 조회'],
  ['deploy', 'deployment', 4, 'process', '병렬 배포'],
  ['confirm', 'deployment', 5, 'end', '결과 확인'],
  ['stopped', 'repository', 3, 'stop', '배포 중단']
] as const;
```

Create five normal edges connecting the six main nodes. Use the following exception routes:

| Edge | From | To | Outcome | Anchors | Waypoints |
| --- | --- | --- | --- | --- | --- |
| `quality-stop` | `quality` | `stopped` | stop | left → top | `{0.4,1}`, `{0.4,3}` |
| `secrets-stop` | `secrets` | `stopped` | stop | left → right | 없음 |
| `stopped-retry` | `stopped` | `detect` | recover | left → left | `{-0.4,3}`, `{-0.4,0}` |

All three use kind `exception`. The `품질 검사 실패` narrative references `quality-stop` and
`stopped-retry`; the `환경·시크릿 불일치` narrative references `secrets-stop` and
`stopped-retry`.
Label the quality decision as `통과`/`실패`, the secrets decision as `일치`/`불일치`, and label
`stopped-retry` as `원인 수정 후 처음부터 재실행`.

- [ ] **Step 5: Run the content and validator tests and verify GREEN**

Run:

```bash
pnpm --dir apps/front exec vitest run src/data/portfolio/feature-detail-quality.test.ts
```

Expected: the registry initializes without error and the exact six-stage/exception assertions pass.

### Task 5: Build and test the pure SVG geometry module

**Files:**

- Create: `apps/front/src/components/projects/project-swimlane-layout.ts`
- Create: `apps/front/src/components/projects/project-swimlane-layout.test.ts`

- [ ] **Step 1: Write failing geometry tests**

Cover lane centers, shape-specific anchor points, waypoint conversion, and polyline serialization:

```ts
it('lane과 row를 SVG 중심 좌표로 변환한다', () => {
  expect(getGridPoint({ column: 1, row: 2 })).toEqual({ x: 360, y: 345 });
});

it('process node의 오른쪽과 위쪽 anchor를 계산한다', () => {
  const node = { x: 360, y: 310, width: 150, height: 58 };
  expect(getAnchorPoint(node, 'right')).toEqual({ x: 435, y: 310 });
  expect(getAnchorPoint(node, 'top')).toEqual({ x: 360, y: 281 });
});

it('edge의 anchor와 waypoint를 SVG polyline으로 직렬화한다', () => {
  expect(toPolylinePoints([{ x: 10, y: 20 }, { x: 30, y: 20 }, { x: 30, y: 40 }])).toBe(
    '10,20 30,20 30,40'
  );
});
```

- [ ] **Step 2: Run the geometry test and verify RED**

Run:

```bash
pnpm --dir apps/front exec vitest run src/components/projects/project-swimlane-layout.test.ts
```

Expected: FAIL because the layout module does not exist.

- [ ] **Step 3: Implement deterministic geometry helpers**

Use these exported constants and pure functions:

```ts
export const LANE_WIDTH = 220;
export const HEADER_HEIGHT = 70;
export const ROW_HEIGHT = 110;
export const DIAGRAM_PADDING = 30;

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

export const toPolylinePoints = (points: SvgPoint[]): string =>
  points.map(({ x, y }) => `${x},${y}`).join(' ');
```

Add `getNodeGeometry(step, laneIndex)` with sizes `150×58` for process, `120×76` for decision,
`150×50` for start/end, and `150×58` for stop. Add `getDiagramSize(swimlane)` and
`getEdgePoints(swimlane, edge)` so the renderer does not perform coordinate arithmetic.

- [ ] **Step 4: Run the geometry test and verify GREEN**

Run the Step 2 command.

Expected: all geometry tests pass without rendering React.

### Task 6: Render the connected and accessible SVG swimlane

**Files:**

- Create: `apps/front/src/components/projects/ProjectSwimlaneDiagram.tsx`
- Modify: `apps/front/src/components/projects/ProjectSwimlane.tsx`
- Modify: `apps/front/src/components/projects/project-detail-rendering.test.tsx`

- [ ] **Step 1: Write failing server-rendering assertions**

Render `ProjectDetailContent` with the harness detail and assert:

```ts
expect(html).toContain('<figure');
expect(html).toContain('<svg');
expect(html).toContain('aria-label="설계·개발·검증 전체 흐름"');
expect(html).toContain('data-node-shape="decision"');
expect(html).toContain('data-edge-kind="normal"');
expect(html).toContain('data-edge-kind="exception"');
expect(html).toContain('전체 흐름 설명');
expect(html).toContain('예외 상황과 대응');
expect(html).not.toContain('연결과 분기');
expect(html).not.toContain('순서형 대체 설명');
expect(html).not.toContain('이전 단계로 복구');
```

Also assert that `data-swimlane-step` elements have no `tabindex` and the scroll region retains
`role="region"`, its visible-flow accessible name, and `tabindex="0"`.

- [ ] **Step 2: Run the rendering test and verify RED**

Run:

```bash
pnpm --dir apps/front exec vitest run src/components/projects/project-detail-rendering.test.tsx
```

Expected: FAIL because the current component renders grid cards and `연결과 분기` list items.

- [ ] **Step 3: Implement `ProjectSwimlaneDiagram`**

The component receives one validated `FeatureSwimlane`, creates per-diagram marker IDs, renders
edges before nodes, and delegates all coordinates to the layout module:

```tsx
export function ProjectSwimlaneDiagram({
  swimlane,
  describedBy
}: {
  swimlane: FeatureSwimlane;
  describedBy: string;
}) {
  const { width, height } = getDiagramSize(swimlane);
  const normalMarkerId = `${swimlane.id}-normal-arrow`;
  const exceptionMarkerId = `${swimlane.id}-exception-arrow`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className='min-w-[52rem] w-full'
      role='img'
      aria-label={`${swimlane.title} 전체 흐름`}
      aria-describedby={describedBy}
    >
      <defs>
        <marker id={normalMarkerId} markerWidth='8' markerHeight='8' refX='7' refY='4' orient='auto'>
          <path d='M0,0 L8,4 L0,8 Z' className='fill-foreground' />
        </marker>
        <marker
          id={exceptionMarkerId}
          markerWidth='8'
          markerHeight='8'
          refX='7'
          refY='4'
          orient='auto'
        >
          <path d='M0,0 L8,4 L0,8 Z' className='fill-destructive' />
        </marker>
      </defs>

      <SwimlaneLanes swimlane={swimlane} height={height} />
      <SwimlaneEdges
        swimlane={swimlane}
        normalMarkerId={normalMarkerId}
        exceptionMarkerId={exceptionMarkerId}
      />
      <SwimlaneNodes swimlane={swimlane} />
    </svg>
  );
}
```

Keep `SwimlaneLanes`, `SwimlaneEdges`, `SwimlaneNodes`, and `SwimlaneNodeShape` private to this
file. Render decision nodes with `<polygon>`, process/stop nodes with `<rect rx='8'>`, and start/end
nodes with `<rect rx='25'>`. Use `strokeDasharray='8 6'` plus `text` labels for exception edges so
color is never the only signal.

- [ ] **Step 4: Replace the old `ProjectSwimlane` presentation**

Keep the existing article heading and purpose, then render:

```tsx
<figure className='space-y-4'>
  <div
    data-swimlane-scroll
    role='region'
    aria-label={`${swimlane.title} 다이어그램`}
    tabIndex={0}
    className='max-w-full overflow-x-auto rounded-lg border bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
  >
    <ProjectSwimlaneDiagram swimlane={swimlane} describedBy={`${swimlane.id}-summary`} />
  </div>
  <figcaption className='rounded-lg bg-muted/40 p-4'>
    <h4 className='font-semibold'>전체 흐름 설명</h4>
    <p id={`${swimlane.id}-summary`} className='mt-2 text-sm leading-6 text-muted-foreground'>
      {swimlane.summary}
    </p>
  </figcaption>
</figure>
```

Render `예외 상황과 대응` only when `exceptions.length > 0`. Each list item must show
`trigger` as the heading and `response` as a complete sentence. Delete `FLOW_PRESENTATION`,
`OUTCOME_LABEL`, the public edge-card list, and the ordered duplicate step list.

- [ ] **Step 5: Run rendering and geometry tests and verify GREEN**

Run:

```bash
pnpm --dir apps/front exec vitest run src/components/projects/project-detail-rendering.test.tsx src/components/projects/project-swimlane-layout.test.ts
```

Expected: both files pass; no old technical heading or outcome wording remains in public HTML.

### Task 7: Verify the complete public flow and preserve legacy projects

**Files:**

- Modify: `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`
- Modify: `specs/003-connected-swimlane-redesign/verification.md`
- Modify: `specs/003-connected-swimlane-redesign/tasks.md`
- Modify: `ROADMAP.md`

- [ ] **Step 1: Reuse the pre-implementation failing Playwright assertions for the connected diagrams**

Task 3 already replaces the old edge-card assertions with the following test and records RED before
the UI migration. At this stage, rerun the same test as the browser acceptance target:

```ts
test('두 연결형 스윔레인에서 lane과 전체 진행·예외 경로를 이해한다', async ({ page }) => {
  await page.goto(HARNESS_PATH);

  const design = page.getByRole('img', { name: '설계·개발·검증 전체 흐름' });
  const deployment = page.getByRole('img', { name: 'CI/CD·시크릿·배포 전체 흐름' });

  await expect(design).toBeVisible();
  await expect(deployment).toBeVisible();
  await expect(design.locator('[data-edge-kind="normal"]')).toHaveCount(6);
  await expect(design.locator('[data-edge-kind="exception"]')).toHaveCount(3);
  await expect(deployment.locator('[data-edge-kind="normal"]')).toHaveCount(5);
  await expect(deployment.locator('[data-edge-kind="exception"]')).toHaveCount(3);
  await expect(page.getByText('예외 상황과 대응', { exact: true })).toHaveCount(2);
  await expect(page.getByText('연결과 분기', { exact: true })).toHaveCount(0);
  await expect(page.getByText('순서형 대체 설명', { exact: true })).toHaveCount(0);
  await expect(page.getByText('제한:', { exact: false })).toHaveCount(0);
});
```

Keep and update the existing 320/768/1024/1440 page-overflow test, 320px ArrowRight scroll test,
dark-mode test, internal/external link test, and all-eight-project-path regression test.

- [ ] **Step 2: Run the new E2E scenario and verify GREEN**

Run:

```bash
pnpm --dir apps/front exec playwright test e2e/codi-harness-portfolio-detail.spec.ts --grep "두 연결형 스윔레인"
```

Expected: PASS because the implementation now renders both connected SVG flows; the corresponding
RED result was recorded before Task 4 changed the flow data or UI.

- [ ] **Step 3: Run the complete verification sequence**

Run in this exact order and record every result, including existing repository-baseline failures:

```bash
pnpm --dir apps/front exec tsc --noEmit
pnpm --dir apps/front test
pnpm --dir apps/front run lint
pnpm --dir apps/front run build
mise run //apps/front:e2e
git diff --check
```

Expected feature results: typecheck passes, all Vitest suites pass, production build generates all
eight project paths, all Playwright scenarios pass, and `git diff --check` passes. If full-repository
lint still fails only on the recorded pre-existing Prettier baseline, run full-rule ESLint on every
new file plus non-format ESLint on touched legacy files and record both scopes without mass-formatting
unrelated user changes.

- [ ] **Step 4: Perform visual and accessibility observations**

At 320, 768, 1024, and 1440px verify:

```text
- page-level horizontal overflow <= 1px
- diagram-level horizontal scroll remains available when needed
- each diagram has one accessible image name and one focusable scroll region
- static nodes and edges create no tab stops
- normal solid and exception dashed paths remain distinguishable in light and dark mode
- flow summary and exception prose remain readable without the SVG
```

- [ ] **Step 5: Review, converge, and synchronize status**

Run the repository's review and `speckit-converge` phases. Resolve every Critical/Important finding,
rerun affected checks, mark the Spec Kit tasks only after evidence is recorded, then run:

```bash
mise run feature:status:sync
```

If the task remains unavailable, record the exact error in the new feature verification file and
update `ROADMAP.md` manually. Do not commit, push, merge, or deploy during implementation.
