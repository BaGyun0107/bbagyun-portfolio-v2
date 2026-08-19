// 확정 사이트맵(또는 null)과 기능정의 행을 병합해 보드 모델을 만든다.
// - 확정 모드: Area(trim)를 노드 id → aliases 순서로 정확 일치 매칭,
//   불일치 행은 unassigned 버킷. 0건 노드도 유지한다(구조-먼저 뷰의 핵심).
// - 파생 모드(sitemap null): 행의 Area를 노드로 승격, user/admin 2그룹.
// 충돌(id/alias 중복)은 scan 단계 경고 + 여기서는 선선언 우선(Map 선점).

function rowArea(row) {
  return row.Area || row.Master_Group || row.Function_Type || '미분류';
}

function buildNode(node) {
  return {
    id: node.id.trim(),
    title: node.title,
    description: node.description ?? '',
    rows: [],
    total: 0,
    children: (node.children ?? []).map(buildNode),
  };
}

// id/alias → 노드 참조 색인. 선선언 우선: 이미 있으면 덮지 않는다.
function indexNode(node, index, aliases) {
  if (!index.has(node.id)) index.set(node.id, node);
  for (const alias of aliases ?? []) {
    const a = String(alias).trim();
    if (!index.has(a)) index.set(a, node);
  }
}

function indexTree(rawNodes, builtNodes, index) {
  rawNodes.forEach((raw, i) => {
    const built = builtNodes[i];
    indexNode(built, index, raw.aliases);
    indexTree(raw.children ?? [], built.children, index);
  });
}

function sumTotals(node) {
  node.total = node.rows.length + node.children.reduce((acc, c) => acc + sumTotals(c), 0);
  return node.total;
}

function countEmpty(node, coveredScreens = new Set()) {
  const empty = node.total === 0 && !coveredScreens.has(node.id) ? 1 : 0;
  return empty + node.children.reduce((acc, c) => acc + countEmpty(c, coveredScreens), 0);
}

function mergeExplicit(sitemap, rows, options = {}) {
  const index = new Map();
  const surfaces = sitemap.surfaces.map((surface) => {
    const nodes = (surface.nodes ?? []).map(buildNode);
    indexTree(surface.nodes ?? [], nodes, index);
    return { key: surface.key, title: surface.title, nodes };
  });

  const unassigned = [];
  for (const row of rows ?? []) {
    const assignedIds = options.screenAssignments?.[row.Row_ID] || [];
    const node = assignedIds.map((id) => index.get(String(id).trim())).find(Boolean)
      || index.get(String(rowArea(row)).trim());
    if (node) node.rows.push(row);
    else unassigned.push(row);
  }

  // 빈 노드 = 행 미배정 + typed appears-on 커버도 없는 화면.
  // 보드 배치는 기능당 첫 화면 하나지만, 관계가 있는 화면은
  // "기능정의가 없는 화면"이 아니므로 힌트 카운트에서 제외한다.
  const coveredScreens = new Set(
    Object.values(options.screenAssignments || {}).flat().map((id) => String(id).trim()),
  );
  let emptyNodeCount = 0;
  for (const surface of surfaces) {
    for (const node of surface.nodes) {
      sumTotals(node);
      emptyNodeCount += countEmpty(node, coveredScreens);
    }
  }

  return {
    derived: false,
    surfaces,
    unassigned,
    unassignedCount: unassigned.length,
    emptyNodeCount,
  };
}

function mergeDerived(rows) {
  const byArea = new Map();
  for (const row of rows ?? []) {
    const area = rowArea(row);
    if (!byArea.has(area)) byArea.set(area, []);
    byArea.get(area).push(row);
  }
  const groups = [
    { key: 'user', title: '사용자 앱 / 공통', nodes: [] },
    { key: 'admin', title: '관리자 / 운영', nodes: [] },
  ];
  const areas = [...byArea.entries()].sort((a, b) =>
    String(a[0]).localeCompare(String(b[0]), 'ko'),
  );
  for (const [area, areaRows] of areas) {
    const first = areaRows[0] ?? {};
    const isAdmin = first.Surface === 'Admin' || /^A\d+/i.test(area);
    const node = {
      id: area,
      title: area,
      description: '',
      rows: areaRows,
      total: areaRows.length,
      children: [],
    };
    groups[isAdmin ? 1 : 0].nodes.push(node);
  }
  return {
    derived: true,
    surfaces: groups,
    unassigned: [],
    unassignedCount: 0,
    emptyNodeCount: 0,
  };
}

export function mergeSitemap(sitemap, rows, options = {}) {
  return sitemap ? mergeExplicit(sitemap, rows, options) : mergeDerived(rows);
}

// actor↔surface 교차 힌트 (백로그 항목 4). 확실한 조합만 지적한다:
// 관리자류 actor가 user surface 화면에, 사용자류 actor가 admin surface
// 화면에 배치된 경우. 목록 밖 actor·common surface·미배치는 침묵(fail-open).
const ADMIN_ACTORS = new Set(['admin', 'administrator', 'operator', 'moderator', '관리자', '운영자']);
const USER_ACTORS = new Set(['user', 'member', 'guest', 'customer', 'visitor', '사용자', '회원', '고객', '게스트']);

export function actorSurfaceMismatches(sitemap, features = [], options = {}) {
  const extraAdmin = Array.isArray(options?.actorClasses?.admin) ? options.actorClasses.admin : [];
  const extraUser = Array.isArray(options?.actorClasses?.user) ? options.actorClasses.user : [];
  const adminActors = new Set([...ADMIN_ACTORS, ...extraAdmin.map((value) => String(value).toLowerCase())]);
  const userActors = new Set([...USER_ACTORS, ...extraUser.map((value) => String(value).toLowerCase())]);
  const surfaceByScreenId = new Map();
  for (const surface of sitemap?.surfaces ?? []) {
    const stack = [...(surface.nodes ?? [])];
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== 'object') continue;
      if (typeof node.id === 'string' && node.id && !surfaceByScreenId.has(node.id)) {
        surfaceByScreenId.set(node.id, surface.key);
      }
      for (const child of node.children ?? []) stack.push(child);
    }
  }
  const mismatches = [];
  for (const feature of features ?? []) {
    const actor = typeof feature?.actor === 'string' ? feature.actor.trim().toLowerCase() : '';
    if (!actor) continue;
    const actorClass = adminActors.has(actor) ? 'admin' : userActors.has(actor) ? 'user' : null;
    if (!actorClass) continue;
    const screenIds = Array.isArray(feature.placements) && feature.placements.length > 0
      ? feature.placements.map((placement) => placement?.screenId).filter(Boolean)
      : Array.isArray(feature.screenIds) ? feature.screenIds : [];
    for (const screenId of screenIds) {
      const surfaceKey = surfaceByScreenId.get(screenId);
      if (surfaceKey !== 'user' && surfaceKey !== 'admin') continue;
      if (surfaceKey !== actorClass) {
        mismatches.push({ featureId: feature.id, actor: feature.actor, screenId, surface: surfaceKey });
      }
    }
  }
  return mismatches;
}
