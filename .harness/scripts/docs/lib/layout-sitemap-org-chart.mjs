// 화면 전용 sitemap을 외부 의존성 없는 가로 조직도 좌표로 투영한다.
// 원본 순서를 안정적인 tie-breaker로 사용하고 입력 객체는 수정하지 않는다.

const DEFAULT_OPTIONS = Object.freeze({
  marginX: 56,
  marginY: 48,
  nodeWidth: 176,
  nodeHeight: 82,
  columnGap: 112,
  rowGap: 30,
  surfaceGap: 72,
});

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function layoutSitemapOrgChart(sitemap, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...(options && typeof options === 'object' ? options : {}) };
  const surfaces = safeArray(sitemap?.surfaces);
  const rawNodes = [];
  const seenIds = new Set();
  const duplicateIds = [];
  const roots = [];

  function collect(nodes, surface, parentId, depth, ancestors) {
    for (const candidate of safeArray(nodes)) {
      if (!candidate || typeof candidate !== 'object') continue;
      const id = typeof candidate.id === 'string' ? candidate.id.trim() : '';
      if (!id) continue;
      if (seenIds.has(id)) {
        if (!duplicateIds.includes(id)) duplicateIds.push(id);
        continue;
      }
      if (ancestors.has(id)) continue;

      seenIds.add(id);
      if (parentId === null) roots.push(id);
      rawNodes.push({
        id,
        title: typeof candidate.title === 'string' && candidate.title.trim() ? candidate.title.trim() : id,
        type: typeof candidate.type === 'string' ? candidate.type : 'page',
        route: typeof candidate.route === 'string' ? candidate.route : '',
        access: safeArray(candidate.access).filter((item) => typeof item === 'string'),
        directNavigation: safeArray(candidate.directNavigation).filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()),
        parentId,
        depth,
        surface: surface.key,
        surfaceTitle: surface.title,
        surfaceIndex: surface.surfaceIndex,
        sourceOrder: rawNodes.length,
      });

      const nextAncestors = new Set(ancestors);
      nextAncestors.add(id);
      collect(candidate.children, surface, id, depth + 1, nextAncestors);
    }
  }

  surfaces.forEach((candidate, surfaceIndex) => {
    if (!candidate || typeof candidate !== 'object') return;
    const key = typeof candidate.key === 'string' && candidate.key.trim() ? candidate.key.trim() : `surface-${surfaceIndex + 1}`;
    const title = typeof candidate.title === 'string' && candidate.title.trim() ? candidate.title.trim() : key;
    collect(candidate.nodes, { key, title, surfaceIndex }, null, 0, new Set());
  });

  const childrenByParent = new Map();
  for (const node of rawNodes) {
    if (node.parentId === null) continue;
    const children = childrenByParent.get(node.parentId) || [];
    children.push(node.id);
    childrenByParent.set(node.parentId, children);
  }

  const nodeById = new Map(rawNodes.map((node) => [node.id, node]));
  const positions = new Map();
  const spanCache = new Map();

  function branchSpan(id) {
    if (spanCache.has(id)) return spanCache.get(id);
    const children = childrenByParent.get(id) || [];
    const span = children.length ? children.reduce((total, childId) => total + branchSpan(childId), 0) : 1;
    spanCache.set(id, span);
    return span;
  }

  function placeBranch(id, startColumn, laneY) {
    const node = nodeById.get(id);
    if (!node) return;
    const span = branchSpan(id);
    positions.set(id, {
      x: config.marginX + (startColumn + (span - 1) / 2) * (config.nodeWidth + config.columnGap),
      y: laneY + node.depth * (config.nodeHeight + config.rowGap),
    });
    let childColumn = startColumn;
    for (const childId of childrenByParent.get(id) || []) {
      placeBranch(childId, childColumn, laneY);
      childColumn += branchSpan(childId);
    }
  }

  let laneY = config.marginY;
  for (let surfaceIndex = 0; surfaceIndex < surfaces.length; surfaceIndex += 1) {
    const surfaceRoots = roots.filter((id) => nodeById.get(id)?.surfaceIndex === surfaceIndex);
    if (surfaceRoots.length === 0) continue;
    let nextColumn = 0;
    let maxDepth = 0;
    for (const rootId of surfaceRoots) {
      placeBranch(rootId, nextColumn, laneY);
      nextColumn += branchSpan(rootId) + 1;
      const rootNodes = rawNodes.filter((node) => node.surfaceIndex === surfaceIndex);
      maxDepth = Math.max(maxDepth, ...rootNodes.map((node) => node.depth));
    }
    laneY += (maxDepth + 1) * config.nodeHeight + maxDepth * config.rowGap + config.surfaceGap;
  }

  const nodes = rawNodes.map((node) => ({
    id: node.id,
    title: node.title,
    type: node.type,
    route: node.route,
    access: [...node.access],
    directNavigation: [...node.directNavigation],
    parentId: node.parentId,
    depth: node.depth,
    surface: node.surface,
    surfaceTitle: node.surfaceTitle,
    x: positions.get(node.id)?.x ?? config.marginX,
    y: positions.get(node.id)?.y ?? config.marginY,
    width: config.nodeWidth,
    height: config.nodeHeight,
  }));

  const positionedById = new Map(nodes.map((node) => [node.id, node]));
  const hierarchyEdges = nodes
    .filter((node) => node.parentId && positionedById.has(node.parentId))
    .map((node) => ({ kind: 'hierarchy', from: node.parentId, to: node.id }));
  const directEdges = [];
  const brokenDirectEdges = [];
  for (const node of nodes) {
    for (const target of node.directNavigation) {
      const edge = { from: node.id, to: target };
      if (positionedById.has(target)) directEdges.push({ kind: 'direct-navigation', ...edge });
      else brokenDirectEdges.push(edge);
    }
  }

  const maxRight = nodes.reduce((value, node) => Math.max(value, node.x + node.width), 0);
  const maxBottom = nodes.reduce((value, node) => Math.max(value, node.y + node.height), 0);
  const minX = nodes.reduce((value, node) => Math.min(value, node.x), Number.POSITIVE_INFINITY);
  const minY = nodes.reduce((value, node) => Math.min(value, node.y), Number.POSITIVE_INFINITY);
  const bounds = nodes.length
    ? { minX, minY, maxX: maxRight, maxY: maxBottom, width: maxRight - minX, height: maxBottom - minY }
    : { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  const usedSurfaces = [];
  for (const node of nodes) {
    if (!usedSurfaces.some(({ key }) => key === node.surface)) {
      usedSurfaces.push({ key: node.surface, title: node.surfaceTitle });
    }
  }

  return {
    nodes,
    roots,
    hierarchyEdges,
    directEdges,
    surfaces: usedSurfaces,
    bounds,
    width: nodes.length ? maxRight + config.marginX : 0,
    height: nodes.length ? maxBottom + config.marginY : 0,
    health: { duplicateIds, brokenDirectEdges },
  };
}
