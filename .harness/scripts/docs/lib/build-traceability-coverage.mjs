// 추적성 coverage/gap/bounded neighborhood projection.
// 원본 workspace를 수정하지 않으며 인덱스는 호출당 1회, O(features + items + links)로 구성한다.

const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function cleanIds(value) {
  return safeArray(value).filter(nonEmpty).map((id) => id.trim());
}

function unique(values) {
  return Array.from(new Set(values));
}

function flattenScreenTitles(sitemap) {
  const screens = new Map();
  for (const surface of safeArray(sitemap?.surfaces)) {
    const walk = (nodes) => {
      for (const node of safeArray(nodes)) {
        if (!node || typeof node !== 'object' || !nonEmpty(node.id)) continue;
        const id = node.id.trim();
        if (!screens.has(id)) screens.set(id, nonEmpty(node.title) ? node.title.trim() : id);
        walk(node.children);
      }
    };
    walk(surface?.nodes);
  }
  return screens;
}

function featureScreenIds(feature, assignments) {
  const placements = safeArray(feature?.placements)
    .filter((placement) => placement && nonEmpty(placement.screenId))
    .map((placement) => placement.screenId.trim());
  const legacy = cleanIds(feature?.screenIds);
  const assigned = cleanIds(assignments?.[String(feature.id ?? '').trim()]);
  return unique([...(placements.length ? placements : legacy), ...assigned]);
}

function csvField(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function emptyCoverage() {
  return {
    summary: { total: 0, complete: 0, evidenceMissing: 0, broken: 0 },
    gaps: [],
    neighborhood: { selectedFeatureId: null, nodes: [], edges: [] },
    matrixRows: [],
    csv: 'feature,needs,screens,flows,specs,workItems',
  };
}

export function buildTraceabilityCoverage(workspace = {}, { selectedFeatureId = null } = {}) {
  const source = workspace && typeof workspace === 'object' ? workspace : {};
  const features = safeArray(source.features).filter((feature) => feature && typeof feature === 'object' && nonEmpty(feature.id));
  if (features.length === 0) return emptyCoverage();

  const details = new Map(
    safeArray(source.featureDetails)
      .filter((detail) => detail && typeof detail === 'object' && nonEmpty(detail.id))
      .map((detail) => [detail.id.trim(), detail]),
  );
  const workItems = safeArray(source.featureWorkItems).filter((item) => item && typeof item === 'object' && nonEmpty(item.id));
  const flows = safeArray(source.userFlows?.flows).filter((flow) => flow && typeof flow === 'object' && nonEmpty(flow.id));
  const needTitles = new Map(
    [...safeArray(source.planningManifest?.needs), ...safeArray(source.needs)]
      .filter((need) => need && nonEmpty(need.id))
      .map((need) => [need.id.trim(), nonEmpty(need.title) ? need.title : need.id.trim()]),
  );
  // typed 관계도 coverage 소스다 (백로그 10): satisfied-by → 요구 연결,
  // specified-by와 linked-hub 해상 결과(explicit>reverse>id) → Spec 연결.
  const typedNeeds = new Map();
  const typedSpecs = new Map();
  for (const link of safeArray(source.traceability?.links)) {
    if (!link || typeof link !== 'object') continue;
    if (link.type === 'satisfied-by' && link.from?.type === 'need' && link.to?.type === 'feature'
      && nonEmpty(link.from.id) && nonEmpty(link.to.id)) {
      const featureId = link.to.id.trim();
      if (!typedNeeds.has(featureId)) typedNeeds.set(featureId, []);
      typedNeeds.get(featureId).push(link.from.id.trim());
    }
    if (link.type === 'specified-by' && link.from?.type === 'feature' && link.to?.type === 'spec'
      && nonEmpty(link.from.id) && nonEmpty(link.to.id)) {
      const featureId = link.from.id.trim();
      if (!typedSpecs.has(featureId)) typedSpecs.set(featureId, []);
      typedSpecs.get(featureId).push(link.to.id.trim());
    }
  }
  // 주의: linkedHub.featureDetails의 specId는 워크스페이스 경로에서
  // 카탈로그가 자기 자신과 ID-일치(self-match)하므로 coverage 소스로
  // 쓰지 않는다 — Spec 연결은 detail.specIds와 typed specified-by만 본다.
  const screenTitles = flattenScreenTitles(source.sitemap);
  const evidenceByFeature = new Map(
    safeArray(source.deliveryEvidence?.features)
      .filter((item) => item && typeof item === 'object')
      .map((item) => [item.featureId || item.id, item])
      .filter(([id]) => nonEmpty(id)),
  );
  const assignments = source.linkedHub?.screenAssignments && typeof source.linkedHub.screenAssignments === 'object'
    ? source.linkedHub.screenAssignments
    : {};

  const workByFeature = new Map();
  for (const item of workItems) {
    const featureId = nonEmpty(item.featureDefinitionId) ? item.featureDefinitionId.trim() : '';
    if (!featureId) continue;
    if (!workByFeature.has(featureId)) workByFeature.set(featureId, []);
    workByFeature.get(featureId).push(item);
  }
  const flowsByFeature = new Map();
  const flowTitles = new Map();
  for (const flow of flows) {
    flowTitles.set(flow.id.trim(), nonEmpty(flow.title) ? flow.title : flow.id.trim());
    for (const step of safeArray(flow.steps)) {
      for (const featureId of cleanIds(step?.featureIds)) {
        if (!flowsByFeature.has(featureId)) flowsByFeature.set(featureId, []);
        flowsByFeature.get(featureId).push(flow.id.trim());
      }
    }
  }

  const gaps = [];
  const matrixRows = [];
  const coveredScreens = new Set();
  const relationsByFeature = new Map();
  let complete = 0;
  let evidenceMissing = 0;

  for (const feature of features) {
    const featureId = feature.id.trim();
    const detail = details.get(nonEmpty(feature.detailId) ? feature.detailId.trim() : featureId) || null;
    const needIds = unique([...cleanIds(feature.needIds), ...(typedNeeds.get(featureId) || [])]);
    const screenIds = featureScreenIds(feature, assignments);
    const flowIds = unique([...cleanIds(feature.flowIds), ...(flowsByFeature.get(featureId) || [])]);
    const specIds = unique([
      ...cleanIds(detail?.traceability?.specIds),
      ...(typedSpecs.get(featureId) || []),
    ]);
    const items = workByFeature.get(featureId) || [];
    const evidence = evidenceByFeature.get(featureId) || null;
    const hasEvidence = Boolean(evidence) || items.some((item) => cleanIds(item.evidenceRefs).length > 0);
    for (const screenId of screenIds) coveredScreens.add(screenId);
    relationsByFeature.set(featureId, { feature, detail, needIds, screenIds, flowIds, specIds, items, evidence });

    const featureGaps = [];
    if (!detail || detail.readiness?.ready === false) {
      const missing = cleanIds(detail?.readiness?.missing).join(', ');
      featureGaps.push({ type: '정의 불완전', severity: 'high', message: missing ? `누락 그룹: ${missing}` : '구현 판단에 필요한 정의가 부족합니다.', action: '기능 상세의 누락 그룹을 채우고 정의를 완결하세요.' });
    }
    if (needIds.length === 0) featureGaps.push({ type: '요구 연결 없음', severity: 'medium', message: '이 기능이 어떤 요구를 해결하는지 연결되지 않았습니다.', action: 'planning source의 need와 기능을 연결하세요.' });
    if (screenIds.length === 0) featureGaps.push({ type: '연결된 화면 없음', severity: 'medium', message: '기능이 어떤 화면에 배치되는지 정의되지 않았습니다.', action: '기능정의의 placements에 화면을 배치하세요.' });
    if (flowIds.length === 0) featureGaps.push({ type: '흐름 연결 없음', severity: 'low', message: '사용자 흐름과의 연결이 없습니다.', action: '관련 user flow step에 featureIds를 연결하세요.' });
    if (specIds.length === 0) featureGaps.push({ type: 'Spec 연결 없음', severity: 'low', message: '구현 Spec과의 연결이 없습니다.', action: 'feature detail의 traceability.specIds를 연결하세요.' });
    if (!hasEvidence) {
      evidenceMissing += 1;
      featureGaps.push({ type: '구현 근거 미수집', severity: 'medium', message: '구현·검증 근거가 수집되지 않았습니다.', action: 'FeatureWorkItem 또는 Delivery Evidence를 연결하세요.' });
    }
    if (featureGaps.length === 0) complete += 1;
    for (const gap of featureGaps) {
      gaps.push({ id: `${gap.type}:${featureId}`, featureId, featureTitle: nonEmpty(feature.title) ? feature.title : featureId, ...gap });
    }
    matrixRows.push({ featureId, title: nonEmpty(feature.title) ? feature.title : featureId, needIds, screenIds, flowIds, specIds, workItemIds: items.map((item) => item.id) });
  }

  for (const [screenId, title] of screenTitles) {
    if (coveredScreens.has(screenId)) continue;
    gaps.push({ id: `연결된 기능정의 없음:${screenId}`, screenId, type: '연결된 기능정의 없음', severity: 'high', message: `${title}(${screenId}) 화면에 연결된 기능정의가 없습니다.`, action: '해당 화면의 기능정의를 작성하거나 배치를 연결하세요.' });
  }

  const health = source.linkedHub?.traceability?.health;
  for (const link of safeArray(health?.brokenLinks)) {
    const fromId = link?.from?.id || '알 수 없음';
    const toId = link?.to?.id || '알 수 없음';
    gaps.push({ id: `깨진 관계:${fromId}:${toId}`, featureId: link?.from?.type === 'feature' ? link.from.id : undefined, type: '깨진 관계', severity: 'critical', message: `${fromId} → ${toId} (${link?.reason || 'endpoint 누락'})`, action: '관계 원본에서 endpoint ID를 수정하거나 관계를 제거하세요.' });
  }
  const broken = (Number(health?.counts?.broken) || 0) + (Number(health?.counts?.flowBroken) || 0);

  gaps.sort((a, b) => {
    const rank = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (rank !== 0) return rank;
    if (a.type !== b.type) return a.type < b.type ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const selected = nonEmpty(selectedFeatureId) && relationsByFeature.has(selectedFeatureId.trim())
    ? selectedFeatureId.trim()
    : features[0].id.trim();
  const neighborhood = buildNeighborhood(selected, relationsByFeature, { needTitles, screenTitles, flowTitles });

  const csv = [
    'feature,needs,screens,flows,specs,workItems',
    ...matrixRows.map((row) => [row.featureId, row.needIds.join(';'), row.screenIds.join(';'), row.flowIds.join(';'), row.specIds.join(';'), row.workItemIds.join(';')].map(csvField).join(',')),
  ].join('\n');

  return {
    summary: { total: features.length, complete, evidenceMissing, broken },
    gaps,
    neighborhood,
    matrixRows,
    csv,
  };
}

function buildNeighborhood(featureId, relationsByFeature, { needTitles, screenTitles, flowTitles }) {
  const relations = relationsByFeature.get(featureId);
  if (!relations) return { selectedFeatureId: null, nodes: [], edges: [] };
  const nodes = [];
  const edges = [];
  const featureRef = { type: 'feature', id: featureId };
  nodes.push({ ...featureRef, title: nonEmpty(relations.feature.title) ? relations.feature.title : featureId });
  const push = (type, id, title, edgeType) => {
    nodes.push({ type, id, title });
    edges.push({ from: featureRef, to: { type, id }, type: edgeType });
  };
  for (const id of relations.needIds) push('need', id, needTitles.get(id) || id, 'traces-need');
  for (const id of relations.screenIds) push('screen', id, screenTitles.get(id) || id, 'appears-on');
  for (const id of relations.flowIds) push('flow', id, flowTitles.get(id) || id, 'appears-in-flow');
  for (const id of relations.specIds) push('spec', id, id, 'specified-by');
  for (const item of relations.items) {
    push('work-item', item.id, nonEmpty(item.title) ? item.title : item.id, 'delivered-by');
    for (const result of safeArray(item.acceptanceResults)) {
      if (!result || !nonEmpty(result.criterionId)) continue;
      const id = `${item.id}:${result.criterionId}`;
      nodes.push({ type: 'verification', id, title: `${result.criterionId} · ${result.status || '상태 없음'}` });
      edges.push({ from: { type: 'work-item', id: item.id }, to: { type: 'verification', id }, type: 'verified-by' });
    }
  }
  for (const criterion of safeArray(relations.evidence?.criteria)) {
    if (!criterion || !nonEmpty(criterion.id)) continue;
    const id = `evidence:${criterion.id}`;
    nodes.push({ type: 'verification', id, title: `${criterion.id} · ${criterion.status || '상태 없음'}` });
    edges.push({ from: featureRef, to: { type: 'verification', id }, type: 'verified-by' });
  }
  return { selectedFeatureId: featureId, nodes, edges };
}
