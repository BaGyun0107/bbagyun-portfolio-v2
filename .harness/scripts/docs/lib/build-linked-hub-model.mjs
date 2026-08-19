// 기능정의, Spec Kit, 사이트맵, flow, typed relation을 하나의 조회 모델로 연결한다.
// renderer는 이 결과를 표시만 하고 endpoint 검증이나 우선순위를 재구현하지 않는다.

const ORPHAN_TYPES = ['feature', 'screen', 'flow', 'spec', 'verification'];

function entityKey(entity) {
  return `${entity.type}:${entity.id}`;
}

function addEntity(registry, entity, origin) {
  if (!entity?.type || !entity?.id) return;
  const normalized = { ...entity, origin };
  const key = entityKey(normalized);
  if (!registry.has(key)) registry.set(key, normalized);
}

function addSitemapNodes(registry, nodes) {
  for (const node of nodes || []) {
    addEntity(registry, { type: 'screen', id: node.id, title: node.title }, 'sitemap');
    addSitemapNodes(registry, node.children);
  }
}

function buildRegistry({ features, rows, sitemap, userFlows, traceability, needs, verificationIds }) {
  const registry = new Map();
  for (const row of rows) {
    addEntity(registry, { type: 'feature', id: row.Row_ID, title: row.Title || row.Row_ID }, 'catalog');
  }
  for (const feature of features) {
    addEntity(registry, { type: 'spec', id: feature.id, title: feature.title || feature.id }, 'spec');
    if (feature.delivery?.verification?.recorded) {
      addEntity(registry, {
        type: 'verification',
        id: feature.id,
        title: `${feature.title || feature.id} 검증`,
      }, 'verification');
    }
  }
  // planningSource의 needs.json과 spec 스캔의 검증 기록도 registry 소스다
  // (백로그 10) — relations entities 선언에만 의존하면 카탈로그 경로에서
  // satisfied-by/verified-by가 오탐으로 깨진다.
  for (const need of needs || []) {
    if (need && typeof need === 'object' && need.id) {
      addEntity(registry, { type: 'need', id: need.id, title: need.title || need.id }, 'needs');
    }
  }
  for (const id of verificationIds || []) {
    if (typeof id === 'string' && id.trim()) {
      addEntity(registry, { type: 'verification', id, title: `${id} 검증` }, 'verification');
    }
  }
  for (const surface of sitemap?.surfaces || []) addSitemapNodes(registry, surface.nodes);
  for (const flow of userFlows?.flows || []) {
    addEntity(registry, { type: 'flow', id: flow.id, title: flow.title }, 'flow');
  }
  for (const entity of traceability?.entities || []) addEntity(registry, entity, 'supplemental');
  return registry;
}

function buildFlowLinks(userFlows, registry) {
  const links = [];
  const brokenFlowEdges = [...(userFlows?.health?.brokenFlowEdges || [])];
  const seen = new Set();
  for (const flow of userFlows?.flows || []) {
    for (const step of flow.steps || []) {
      for (const [type, ids] of [['screen', step.screenIds], ['feature', step.featureIds]]) {
        for (const id of ids || []) {
          const link = {
            from: { type: 'flow', id: flow.id },
            to: { type, id },
            type: 'uses',
            stepId: step.id,
          };
          const targetKey = entityKey(link.to);
          if (!registry.has(targetKey)) {
            brokenFlowEdges.push({
              flowId: flow.id,
              from: step.id,
              to: targetKey,
              reason: `missing ${type}`,
            });
            continue;
          }
          const key = `${entityKey(link.from)}|${link.type}|${targetKey}`;
          if (!seen.has(key)) links.push(link);
          seen.add(key);
        }
      }
    }
  }
  return {
    links,
    brokenFlowEdges,
    flowCycles: [...(userFlows?.health?.flowCycles || [])],
  };
}

function validateLinks(traceability, registry, flowModel) {
  const configured = Boolean(traceability);
  const links = [];
  const brokenLinks = [];
  const duplicateLinks = [];
  const seen = new Set();
  for (const link of traceability?.links || []) {
    const fromKey = entityKey(link.from || {});
    const toKey = entityKey(link.to || {});
    const key = `${fromKey}|${link.type}|${toKey}`;
    if (seen.has(key)) {
      duplicateLinks.push({ ...link, reason: 'duplicate' });
      continue;
    }
    seen.add(key);
    const missing = [fromKey, toKey].filter((endpoint) => !registry.has(endpoint));
    if (missing.length > 0) {
      brokenLinks.push({ ...link, reason: `missing endpoint: ${missing.join(', ')}` });
      continue;
    }
    links.push(link);
  }

  const orphans = Object.fromEntries(ORPHAN_TYPES.map((type) => [type, []]));
  if (configured) {
    const connected = new Set();
    for (const link of links) {
      connected.add(entityKey(link.from));
      connected.add(entityKey(link.to));
    }
    for (const link of flowModel.links) {
      connected.add(entityKey(link.from));
      connected.add(entityKey(link.to));
    }
    for (const entity of registry.values()) {
      if (ORPHAN_TYPES.includes(entity.type) && !connected.has(entityKey(entity))) {
        orphans[entity.type].push(entity);
      }
    }
  }
  return {
    configured,
    entities: [...registry.values()],
    links,
    health: {
      status: configured ? 'configured' : 'not-configured',
      brokenLinks,
      duplicateLinks,
      brokenFlowEdges: flowModel.brokenFlowEdges,
      flowCycles: flowModel.flowCycles,
      orphans,
      counts: {
        broken: brokenLinks.length,
        duplicate: duplicateLinks.length,
        orphan: Object.values(orphans).reduce((sum, values) => sum + values.length, 0),
        flowBroken: flowModel.brokenFlowEdges.length,
        flowCycle: flowModel.flowCycles.length,
      },
    },
  };
}

function explicitSpecId(rowId, links, specsById) {
  for (const link of links) {
    if (
      link.type === 'specified-by'
      && link.from.type === 'feature'
      && link.from.id === rowId
      && link.to.type === 'spec'
      && specsById.has(link.to.id)
    ) return link.to.id;
  }
  return null;
}

function screenAssignments(links) {
  const assignments = {};
  for (const link of links) {
    if (link.type !== 'appears-on' || link.from.type !== 'feature' || link.to.type !== 'screen') continue;
    if (!assignments[link.from.id]) assignments[link.from.id] = [];
    assignments[link.from.id].push(link.to.id);
  }
  return assignments;
}

export function buildLinkedHubModel({
  features = [],
  rows = [],
  sitemap = null,
  traceability = null,
  userFlows = null,
  needs = [],
  verificationIds = [],
} = {}) {
  const specsById = new Map(features.map((feature) => [feature.id, feature]));
  const registry = buildRegistry({ features, rows, sitemap, userFlows, traceability, needs, verificationIds });
  const flowModel = buildFlowLinks(userFlows, registry);
  const traceabilityModel = validateLinks(traceability, registry, flowModel);
  const featureDetails = {};

  // spec status.yaml의 featureId 역방향 연결 (011). 우선순위:
  // planning 명시(specified-by) > 역방향 featureId > ID 동일성.
  const reverseSpecByFeatureId = new Map();
  for (const feature of features) {
    const featureId = typeof feature?.featureId === 'string' ? feature.featureId.trim() : '';
    if (featureId && !reverseSpecByFeatureId.has(featureId)) {
      reverseSpecByFeatureId.set(featureId, feature.id);
    }
  }
  const linkConflicts = [];

  for (const row of rows) {
    const rowId = String(row?.Row_ID || '').trim();
    if (!rowId) continue;
    const explicitId = explicitSpecId(rowId, traceabilityModel.links, specsById);
    const reverseId = reverseSpecByFeatureId.get(rowId) || null;
    if (explicitId && reverseId && explicitId !== reverseId) {
      linkConflicts.push({
        code: 'spec-feature-link-conflict',
        featureId: rowId,
        planningSpecId: explicitId,
        reverseSpecId: reverseId,
      });
    }
    const spec = specsById.get(explicitId || reverseId || rowId) || null;
    featureDetails[rowId] = {
      rowId,
      source: spec ? (explicitId ? 'explicit' : reverseId ? 'reverse' : 'id') : 'none',
      specId: spec?.id || null,
      specLink: spec?.spec_link || null,
      specDetail: spec?.spec_detail || null,
      delivery: spec?.delivery || null,
    };
  }

  return {
    featureDetails,
    linkConflicts,
    traceability: traceabilityModel,
    userFlows: userFlows || null,
    flowLinks: flowModel.links,
    screenAssignments: screenAssignments(traceabilityModel.links),
  };
}
