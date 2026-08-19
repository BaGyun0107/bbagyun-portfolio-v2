// Planning Hub 전용 정적 HTML renderer.
// 제품 계획/전달 projection만 읽으며 원본 model을 수정하지 않는다.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { layoutSitemapOrgChart } from './layout-sitemap-org-chart.mjs';
import {
  renderFeatureDefinitionView,
  renderFeatureStatusView,
} from './render-feature-workbench-view.mjs';
import { renderUserFlowStoryView } from './render-user-flow-story-view.mjs';
import { renderTraceabilityCoverageView } from './render-traceability-coverage-view.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

const PLANNING_VIEWS = [
  ['overview', '개요', '계획의 범위와 원본은 무엇인가?'],
  ['screens', '화면 구조', '어떤 화면이 있고 어떻게 이동하는가?'],
  ['features', '기능 정의', '무엇을 어떻게 구현하고 검증하는가?'],
  ['status', '기능 현황', '선택한 기능은 어디까지 전달됐는가?'],
  ['flows', '사용자 흐름', '사용자는 목표를 어떤 경로로 달성하는가?'],
  ['traceability', '추적성', '요구·기능·화면·명세·검증은 어떻게 연결되는가?'],
];

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function activeWorkspace(hub) {
  const workspaces = safeArray(hub?.workspaces);
  return workspaces.find(({ id }) => id === hub?.defaultWorkspaceId) || workspaces[0] || null;
}

function renderEmpty(title, action) {
  return `<div class="planning-empty"><b>${esc(title)}</b><p>${esc(action)}</p></div>`;
}

function flattenScreens(sitemap) {
  const output = [];
  for (const surface of safeArray(sitemap?.surfaces)) {
    const seen = new Set();
    const walk = (nodes, parentId = null, depth = 0) => {
      for (const node of safeArray(nodes)) {
        if (!node || typeof node !== 'object' || typeof node.id !== 'string' || !node.id.trim() || seen.has(node.id)) continue;
        seen.add(node.id);
        output.push({
          ...node,
          id: node.id.trim(),
          title: typeof node.title === 'string' && node.title.trim() ? node.title.trim() : node.id.trim(),
          surface: surface.key || 'unknown',
          surfaceTitle: surface.title || surface.key || '미분류',
          parentId,
          depth,
        });
        walk(node.children, node.id.trim(), depth + 1);
      }
    };
    walk(surface?.nodes);
  }
  return output;
}

function edgePath(from, to) {
  if (!from || !to) return '';
  const startX = from.x + from.width / 2;
  const startY = from.y + from.height;
  const endX = to.x + to.width / 2;
  const endY = to.y;
  const middleY = startY + (endY - startY) / 2;
  return `M ${startX} ${startY} C ${startX} ${middleY}, ${endX} ${middleY}, ${endX} ${endY}`;
}

function renderOrgChart(sitemap) {
  const layout = layoutSitemapOrgChart(sitemap);
  if (layout.nodes.length === 0) return renderEmpty('조직도로 표시할 화면이 없습니다.', 'sitemap source와 screen ID를 확인하세요.');
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
  const edges = [
    ...layout.hierarchyEdges.map((edge) => ({ ...edge, path: edgePath(byId.get(edge.from), byId.get(edge.to)) })),
    ...layout.directEdges.map((edge) => ({ ...edge, path: edgePath(byId.get(edge.from), byId.get(edge.to)) })),
  ];
  return `<div class="org-chart-shell">
    <div class="org-chart-toolbar" aria-label="조직도 이동과 확대 제어">
      <button type="button" data-org-action="pan-left" aria-label="왼쪽으로 이동">←</button>
      <button type="button" data-org-action="pan-right" aria-label="오른쪽으로 이동">→</button>
      <button type="button" data-org-action="pan-up" aria-label="위로 이동">↑</button>
      <button type="button" data-org-action="pan-down" aria-label="아래로 이동">↓</button>
      <button type="button" data-org-action="zoom-out" aria-label="조직도 축소">−</button>
      <button type="button" data-org-action="zoom-in" aria-label="조직도 확대">＋</button>
      <button type="button" data-org-action="fit">화면 맞춤</button>
    </div>
    <div class="org-chart-legend" aria-label="조직도 범례">
      ${layout.surfaces.map((surface) => `<span><i data-surface-swatch="${esc(surface.key)}"></i>${esc(surface.title)}</span>`).join('')}
      <span><i class="legend-line solid"></i>상하위 구조</span><span><i class="legend-line dotted"></i>직접 이동</span>
    </div>
    <div id="orgChartCanvas" class="org-chart-canvas" tabindex="0" aria-label="화면 조직도 캔버스. 방향키로 이동하고 더하기와 빼기 키로 확대 또는 축소합니다. 마우스 휠 확대와 드래그 이동도 지원합니다." data-org-min-x="${layout.bounds.minX}" data-org-min-y="${layout.bounds.minY}" data-org-max-x="${layout.bounds.maxX}" data-org-max-y="${layout.bounds.maxY}">
      <svg id="planningOrgChart" viewBox="0 0 ${layout.width} ${layout.height}" role="group" aria-labelledby="orgChartTitle orgChartDescription">
        <title id="orgChartTitle">화면 조직도</title>
        <desc id="orgChartDescription">surface 색과 이름으로 구분한 screen-only 구조입니다. 실선은 상하위 구조, 점선 화살표는 직접 이동입니다.</desc>
        <defs><marker id="orgDirectArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker></defs>
        <g id="orgViewport">
          <g class="org-chart-edges">${edges.map((edge) => `<path d="${edge.path}" data-edge-kind="${edge.kind}" data-from="${esc(edge.from)}" data-to="${esc(edge.to)}"${edge.kind === 'direct-navigation' ? ' marker-end="url(#orgDirectArrow)"' : ''}></path>`).join('')}</g>
          <g class="org-chart-nodes">${layout.nodes.map((node) => `<g class="org-chart-node" data-surface="${esc(node.surface)}" data-search="${esc(`${node.id} ${node.title}`.toLowerCase())}" data-screen-record data-screen-id="${esc(node.id)}" role="button" tabindex="0" aria-pressed="false" aria-label="${esc(`${node.title} 화면 ${node.id}`)}">
            <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="10"></rect>
            <text x="${node.x + 14}" y="${node.y + 22}" class="org-surface-label">${esc(node.surfaceTitle)}</text>
            <text x="${node.x + 14}" y="${node.y + 47}" class="org-node-title">${esc(node.title)}</text>
            <text x="${node.x + 14}" y="${node.y + 67}" class="org-node-id">${esc(node.id)}</text>
          </g>`).join('')}</g>
        </g>
      </svg>
    </div>
    ${layout.health.brokenDirectEdges.length ? `<p class="org-chart-health" role="status">연결 대상이 없는 직접 이동 ${layout.health.brokenDirectEdges.length}건은 선에서 제외했습니다.</p>` : ''}
  </div>`;
}

function renderStructureExplorer(workspace) {
  const screens = flattenScreens(workspace?.sitemap);
  if (screens.length === 0) return renderEmpty('화면 구조 미수집', 'planning sitemap source와 복구 행동을 확인하세요.');
  const surfaceOptions = safeArray(workspace?.sitemap?.surfaces).map((surface) => `<option value="${esc(surface.key)}">${esc(surface.title)}</option>`).join('');
  const cards = screens.map((screen) => `<button type="button" class="structure-screen-card" data-screen-record data-screen-id="${esc(screen.id)}" data-surface="${esc(screen.surface)}" data-search="${esc(`${screen.id} ${screen.title}`.toLowerCase())}" aria-pressed="false"><span>${esc(screen.surfaceTitle)}</span><b>${esc(screen.title)}</b><code>${esc(screen.id)}</code><small>${screen.parentId ? `상위 ${esc(screen.parentId)}` : '최상위 화면'}</small></button>`).join('');
  const tree = screens.map((screen) => `<li role="treeitem" aria-level="${screen.depth + 1}" data-screen-record data-surface="${esc(screen.surface)}" data-search="${esc(`${screen.id} ${screen.title}`.toLowerCase())}"><button type="button" data-screen-id="${esc(screen.id)}" aria-pressed="false"><span aria-hidden="true">${'—'.repeat(screen.depth)}</span>${esc(screen.title)} <code>${esc(screen.id)}</code></button></li>`).join('');
  const rows = screens.map((screen) => `<tr data-screen-record data-surface="${esc(screen.surface)}" data-search="${esc(`${screen.id} ${screen.title}`.toLowerCase())}"><th scope="row"><button type="button" data-screen-id="${esc(screen.id)}" aria-pressed="false">${esc(screen.id)}</button></th><td>${esc(screen.title)}</td><td>${esc(screen.surfaceTitle)}</td><td>${esc(screen.parentId || '최상위')}</td><td>${esc(safeArray(screen.directNavigation).join(', ') || '-')}</td></tr>`).join('');
  return `<div class="sitemap-toolbar"><label>표면 <select id="sitemapSurfaceFilter"><option value="">전체</option>${surfaceOptions}</select></label><label>화면 검색 <input id="sitemapScreenSearch" type="search" placeholder="화면명 또는 ID"></label></div>
    <div class="structure-screen-grid">${cards}</div>
    <details class="planning-alternative"><summary>계층 목록(접근성 보기)</summary><ul role="tree" class="planning-screen-tree">${tree}</ul></details>
    <details class="planning-alternative"><summary>화면 비교표</summary><div class="planning-table-wrap"><table><thead><tr><th>ID</th><th>화면</th><th>Surface</th><th>상위</th><th>직접 이동</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
}

function renderScreens(workspace) {
  return `<div class="screen-view-tabs" role="group" aria-label="화면 구조 보기 방식"><button type="button" data-screen-view="structure" aria-pressed="true">구조 탐색</button><button type="button" data-screen-view="organization" aria-pressed="false">가로 조직도</button></div>
    <section data-screen-view-panel="structure">${renderStructureExplorer(workspace)}</section>
    <section data-screen-view-panel="organization" class="hidden">${renderOrgChart(workspace?.sitemap)}</section>
    <aside id="planningScreenDetail" class="planning-screen-detail"><b>화면을 선택하세요</b><p>stable ID, 상위 화면, route, 접근 조건과 직접 이동을 표시합니다.</p></aside>`;
}

function renderValue(value) {
  if (value === undefined || value === null || value === '') return '<span class="missing-value">정의 없음</span>';
  if (Array.isArray(value)) return value.length ? `<ul>${value.map((item) => `<li>${typeof item === 'object' ? renderValue(item) : esc(item)}</li>`).join('')}</ul>` : '<span class="empty-value">해당 없음</span>';
  if (typeof value === 'object') return `<dl>${Object.entries(value).map(([key, item]) => `<div><dt>${esc(key)}</dt><dd>${renderValue(item)}</dd></div>`).join('')}</dl>`;
  return `<span>${esc(value)}</span>`;
}

function renderFeatures(workspace) {
  return renderFeatureDefinitionView({ workspace });
}

function renderStatusWorkbench(workspace) {
  return renderFeatureStatusView({ workspace });
}

function workspaceFlows(workspace) {
  if (workspace && Object.hasOwn(workspace, 'userFlows') && workspace.userFlows !== undefined) {
    return safeArray(workspace.userFlows?.flows);
  }
  return safeArray(workspace?.planningManifest?.flows);
}

function renderFlows(workspace) {
  return renderUserFlowStoryView({ flows: workspaceFlows(workspace) });
}

function renderTraceability(workspace) {
  return renderTraceabilityCoverageView({ workspace, selectedFeatureId: safeArray(workspace?.features)[0]?.id || null });
}

function renderOperations(workspace) {
  const manifest = workspace?.planningManifest;
  const evidence = workspace?.deliveryEvidence;
  const sync = workspace?.syncResult;
  return `<div class="planning-sync-summary"><article><b>Planning package</b><strong>${esc(manifest?.sourceRevision || '미수집')}</strong><code>${esc(manifest?.digest || 'digest 없음')}</code><p>${manifest?.manifestVersion !== undefined ? `manifest v${esc(manifest.manifestVersion)}` : 'manifest version 미수집'}</p></article><article><b>Delivery source</b><strong>${esc(evidence?.sourceRevision || '미수집')}</strong><code>${esc(evidence?.consumedManifestDigest || 'digest 없음')}</code></article><article><b>동기화 health</b><strong>${esc(sync?.status || '미수집')}</strong><p>${esc(sync?.health?.[0]?.message || '수집 오류가 없습니다.')}</p></article><article><b>자동화 기록</b><strong>마지막 정상 수집</strong><p>${esc(sync?.lastSuccessfulAt || '기록 없음')}</p></article></div><section class="sync-recovery"><h3>복구 행동</h3><p>${esc(sync?.health?.[0]?.action || 'source를 확인한 뒤 planning:check를 실행하세요.')}</p></section>`;
}

function renderOverview(workspace) {
  if (!workspace) return renderEmpty('Planning workspace를 찾을 수 없습니다.', 'workspace config와 source 경로를 확인하세요.');
  const features = safeArray(workspace.features);
  const details = safeArray(workspace.featureDetails);
  const evidence = safeArray(workspace?.deliveryEvidence?.features);
  const proposals = safeArray(workspace?.changeProposals).length ? workspace.changeProposals : safeArray(workspace?.syncResult?.proposals);
  const nextAction = workspace?.syncResult?.health?.[0]?.action || '';
  return `<div class="planning-overview-grid"><article><b>현재 원본</b><strong>${esc(workspace.title || workspace.id)}</strong><p>${esc(workspace?.planningManifest?.sourceRevision || workspace?.source?.root || 'source unavailable')}</p></article><article><b>제품 구조</b><strong>${flattenScreens(workspace.sitemap).length} 화면</strong><p>${features.length} 기능 · ${safeArray(workspace?.userFlows?.flows).length} 사용자 흐름</p></article><article><b>Source health</b><strong>${safeArray(workspace.health).length ? '확인 필요' : '정상'}</strong><p>${esc(workspace.health?.[0]?.message || (safeArray(workspace.health).length ? '운영·고급에서 health 항목을 확인하세요.' : '현재 수집 오류가 없습니다.'))}</p></article></div>
    <section class="overview-delivery-summary" data-overview-delivery aria-label="계획·전달·조정 요약"><article><b>제품 정의</b><strong>${details.filter((item) => item.readiness?.ready !== false).length}/${features.length}</strong><p>구현 판단에 필요한 정의 준비 상태입니다.</p></article><article><b>구현 전달</b><strong>${evidence.length}/${features.length}</strong><p>Spec, task, 코드와 검증 근거가 연결된 기능 수입니다. 상세 근거는 기능 현황에서 확인합니다.</p></article><article><b>현실 조정</b><strong>${esc(workspace?.syncResult?.status || '미수집')}</strong><p>${proposals.length ? `사람의 판단이 필요한 변경 제안 ${proposals.length}건` : '열린 변경 제안이 없습니다.'}</p></article><article><b>다음 행동</b><p>${esc(nextAction || '열린 복구 행동이 없습니다.')}</p></article></section>`;
}

const VIEW_RENDERERS = { overview: renderOverview, screens: renderScreens, features: renderFeatures, status: renderStatusWorkbench, flows: renderFlows, traceability: renderTraceability };

function renderView(key, workspace) {
  return VIEW_RENDERERS[key](workspace);
}

function renderPlanningClientScript() {
  return `
(function planningPageClient() {
  const hub = DATA.workspaceHub && Array.isArray(DATA.workspaceHub.workspaces) ? DATA.workspaceHub : { workspaces: [] };
  let workspaceId = hub.defaultWorkspaceId || (hub.workspaces[0] && hub.workspaces[0].id) || '';
  let selectedFeatureDefinitionId = '';
  let selectedWorkItemId = '';
  let selectedFeatureScreenId = '';
  let selectedStatusView = 'kanban';
  let selectedWorkScope = 'feature';
  let visibleDefinitionFeatureIds = null;
  let selectedScreenId = '';
  let selectedFlowId = '';
  let selectedFlowStepId = '';
  let orgScale = 1;
  let orgPanX = 0;
  let orgPanY = 0;
  let orgPointer = null;
  const viewCache = new Map();
  const operationsCache = new Map();
  const workspaceSelections = new Map();

  function currentWorkspace() { return hub.workspaces.find(function(item) { return item.id === workspaceId; }) || hub.workspaces[0] || null; }
  function workspaceFlows(workspace) { if (workspace && Object.hasOwn(workspace, 'userFlows') && workspace.userFlows !== undefined) return workspace.userFlows && Array.isArray(workspace.userFlows.flows) ? workspace.userFlows.flows : []; return workspace && workspace.planningManifest && Array.isArray(workspace.planningManifest.flows) ? workspace.planningManifest.flows : []; }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function normalizeList(value) { if (Array.isArray(value)) return value.filter(function(item) { return typeof item === 'string' && item.trim(); }); if (typeof value === 'string' && value.trim()) return [value.trim()]; return []; }
  function flattenScreens(sitemap) { const output = []; (sitemap && Array.isArray(sitemap.surfaces) ? sitemap.surfaces : []).forEach(function(surface) { (function walk(nodes, parentId) { (Array.isArray(nodes) ? nodes : []).forEach(function(node) { if (!node || !node.id) return; output.push(Object.assign({}, node, { parentId: parentId || null, surface: surface.key, surfaceTitle: surface.title })); walk(node.children, node.id); }); })(surface.nodes, null); }); return output; }

  function setPlanningView(key) {
    document.querySelectorAll('[data-workspace-view]').forEach(function(panel) { panel.classList.toggle('hidden', panel.dataset.workspaceView !== key); });
    document.querySelectorAll('[data-planning-view-button]').forEach(function(button) { const active = button.dataset.planningViewButton === key; button.classList.toggle('active', active); button.setAttribute('aria-pressed', active ? 'true' : 'false'); });
  }

  function selectFlowStep(id, flowId) {
    selectedFlowStepId = id || '';
    document.querySelectorAll('[data-flow-step-select]').forEach(function(button) { const active = button.dataset.flowId === (flowId || selectedFlowId) && button.dataset.flowStepSelect === selectedFlowStepId; button.classList.toggle('selected', active); button.setAttribute('aria-pressed', active ? 'true' : 'false'); });
    document.querySelectorAll('[data-flow-step-detail]').forEach(function(detail) { const active = detail.dataset.flowId === (flowId || selectedFlowId) && detail.dataset.flowStepDetail === selectedFlowStepId; detail.classList.toggle('hidden', !active); });
  }

  function selectFlow(id, preferredStepId) {
    selectedFlowId = id || '';
    document.querySelectorAll('[data-flow-select]').forEach(function(button) { const active = button.dataset.flowSelect === selectedFlowId; button.classList.toggle('selected', active); button.setAttribute('aria-pressed', active ? 'true' : 'false'); });
    document.querySelectorAll('[data-flow-story]').forEach(function(story) { story.classList.toggle('hidden', story.dataset.flowStory !== selectedFlowId); });
    const flow = workspaceFlows(currentWorkspace()).find(function(item) { return item && item.id === selectedFlowId; }) || null;
    const steps = flow && Array.isArray(flow.steps) ? flow.steps.filter(function(step) { return step && typeof step.id === 'string' && step.id.trim(); }) : [];
    const preferred = steps.find(function(step) { return step.id === preferredStepId; });
    const entry = steps.find(function(step) { return step.id === flow.entryStepId; });
    const selected = preferred || entry || steps[0] || null;
    selectFlowStep(selected && selected.id || '', selectedFlowId);
  }

  function selectFeature(id) {
    const changed = selectedFeatureDefinitionId !== id;
    selectedFeatureDefinitionId = id;
    document.querySelectorAll('[data-planning-feature-id]').forEach(function(button) { const active = button.dataset.planningFeatureId === id; button.classList.toggle('selected', active); button.setAttribute('aria-pressed', active ? 'true' : 'false'); });
    document.querySelectorAll('[data-planning-feature-detail]').forEach(function(detail) { detail.classList.toggle('hidden', detail.dataset.planningFeatureDetail !== id); });
    document.querySelectorAll('[data-feature-definition-detail]').forEach(function(detail) { const visibleInDefinition = visibleDefinitionFeatureIds === null || visibleDefinitionFeatureIds.has(id); detail.classList.toggle('hidden', !visibleInDefinition || detail.dataset.featureDefinitionDetail !== id); });
    document.querySelectorAll('[data-status-feature-detail]').forEach(function(detail) { detail.classList.toggle('hidden', detail.dataset.statusFeatureDetail !== id); });
    document.querySelectorAll('[data-status-feature-context]').forEach(function(context) { context.classList.toggle('hidden', context.dataset.statusFeatureContext !== id); });
    updateTraceabilityNeighborhood(id);
    if (changed && selectedWorkScope === 'feature') applyWorkItemFilters();
  }

  function updateTraceabilityNeighborhood(id) {
    const container = document.querySelector('[data-traceability-neighborhood]');
    if (!container) return;
    const workspace = currentWorkspace();
    if (!workspace) return;
    const features = Array.isArray(workspace.features) ? workspace.features : [];
    const feature = features.find(function(item) { return item && item.id === id; });
    if (!feature) return;
    const details = Array.isArray(workspace.featureDetails) ? workspace.featureDetails : [];
    const detail = details.find(function(item) { return item && item.id === (feature.detailId || feature.id); }) || null;
    const workItems = (Array.isArray(workspace.featureWorkItems) ? workspace.featureWorkItems : []).filter(function(item) { return item && item.featureDefinitionId === id; });
    const assignments = workspace.linkedHub && workspace.linkedHub.screenAssignments && Array.isArray(workspace.linkedHub.screenAssignments[id]) ? workspace.linkedHub.screenAssignments[id] : [];
    const screens = featureScreenIds(feature).concat(normalizeList(assignments).filter(function(screenId) { return featureScreenIds(feature).indexOf(screenId) < 0; }));
    const flowIds = normalizeList(feature.flowIds);
    workspaceFlows(workspace).forEach(function(flow) {
      if (!flow || flowIds.indexOf(flow.id) >= 0) return;
      const referenced = (Array.isArray(flow.steps) ? flow.steps : []).some(function(step) { return (step && Array.isArray(step.featureIds) ? step.featureIds : []).indexOf(id) >= 0; });
      if (referenced) flowIds.push(flow.id);
    });
    const specs = detail && detail.traceability && Array.isArray(detail.traceability.specIds) ? detail.traceability.specIds.filter(function(value) { return typeof value === 'string' && value.trim(); }) : [];
    const verifications = [];
    workItems.forEach(function(item) { (Array.isArray(item.acceptanceResults) ? item.acceptanceResults : []).forEach(function(result) { if (result && result.criterionId) verifications.push(item.id + ':' + result.criterionId + ' · ' + (result.status || '상태 없음')); }); });
    const evidenceFeatures = workspace.deliveryEvidence && Array.isArray(workspace.deliveryEvidence.features) ? workspace.deliveryEvidence.features : [];
    const evidenceEntry = evidenceFeatures.find(function(item) { return item && (item.featureId || item.id) === id; }) || null;
    (evidenceEntry && Array.isArray(evidenceEntry.criteria) ? evidenceEntry.criteria : []).forEach(function(criterion) { if (criterion && criterion.id) verifications.push('evidence:' + criterion.id + ' · ' + (criterion.status || '상태 없음')); });
    const labels = { need: '요구', screen: '화면', flow: '사용자 흐름', spec: 'Spec', 'work-item': '구현 작업', verification: '검증' };
    const kinds = [['need', normalizeList(feature.needIds)], ['screen', screens], ['flow', flowIds], ['spec', specs], ['work-item', workItems.map(function(item) { return item.id; })], ['verification', verifications]];
    container.innerHTML = '<header><code>' + escapeHtml(id) + '</code><h3>' + escapeHtml(feature.title || id) + '</h3></header><div class="neighborhood-grid">'
      + kinds.map(function(entry) {
        const list = entry[1].length ? '<ul>' + entry[1].map(function(value) { return '<li><code>' + escapeHtml(value) + '</code></li>'; }).join('') + '</ul>' : '<p class="empty-value">연결 없음</p>';
        return '<div data-neighborhood-kind="' + entry[0] + '"><h4>' + labels[entry[0]] + '</h4>' + list + '</div>';
      }).join('') + '</div>';
  }

  function setWorkScope(key) {
    selectedWorkScope = key === 'all' ? 'all' : 'feature';
    document.querySelectorAll('[data-work-scope-select]').forEach(function(button) { const active = button.dataset.workScopeSelect === selectedWorkScope; button.classList.toggle('active', active); button.setAttribute('aria-pressed', active ? 'true' : 'false'); });
    applyWorkItemFilters();
  }

  function selectWorkItem(id) {
    selectedWorkItemId = id || '';
    document.querySelectorAll('[data-work-select]').forEach(function(button) { const active = button.dataset.workSelect === selectedWorkItemId; button.classList.toggle('selected', active); button.setAttribute('aria-pressed', active ? 'true' : 'false'); });
    const card = Array.from(document.querySelectorAll('[data-work-item-id]')).find(function(item) { return item.dataset.workItemId === selectedWorkItemId; }) || null;
    const detail = document.querySelector('[data-work-item-detail]');
    if (detail) detail.classList.toggle('hidden', !card);
    const fields = {
      '[data-work-item-detail] [data-work-detail-id]': card && card.dataset.workItemId,
      '[data-work-item-detail] [data-work-detail-title]': card && card.dataset.workDetailTitle,
      '[data-work-item-detail] [data-work-detail-meta]': card && card.dataset.workDetailMeta,
      '[data-work-item-detail] [data-work-detail-state]': card && card.dataset.workDetailState,
      '[data-work-item-detail] [data-work-detail-hold]': card && card.dataset.workDetailHold,
      '[data-work-item-detail] [data-work-detail-task]': card && card.dataset.workDetailTask,
      '[data-work-item-detail] [data-work-detail-acceptance]': card && card.dataset.workDetailAcceptance,
      '[data-work-item-detail] [data-work-detail-evidence]': card && card.dataset.workDetailEvidence,
      '[data-work-item-detail] [data-work-detail-blocker]': card && card.dataset.workDetailBlocker,
    };
    Object.keys(fields).forEach(function(selector) { const field = document.querySelector(selector); if (field) field.textContent = fields[selector] || ''; });
  }

  function setStatusView(key) {
    selectedStatusView = key === 'feature-grouped' ? 'feature-grouped' : 'kanban';
    const groupedTargets = Array.from(document.querySelectorAll('[data-grouped-work-items]'));
    const statusTargets = Array.from(document.querySelectorAll('[data-status-work-items]'));
    document.querySelectorAll('[data-work-item-id]').forEach(function(card) {
      const target = selectedStatusView === 'feature-grouped'
        ? groupedTargets.find(function(container) { return container.dataset.groupedWorkItems === card.dataset.workItemFeature; })
        : statusTargets.find(function(container) { return container.dataset.statusWorkItems === card.dataset.workStatus; });
      if (target && typeof target.appendChild === 'function') target.appendChild(card);
    });
    document.querySelectorAll('[data-status-view]').forEach(function(panel) { panel.classList.toggle('hidden', panel.dataset.statusView !== selectedStatusView); });
    document.querySelectorAll('[data-status-view-select]').forEach(function(button) { const active = button.dataset.statusViewSelect === selectedStatusView; button.classList.toggle('active', active); button.setAttribute('aria-pressed', active ? 'true' : 'false'); });
  }

  function applyWorkItemFilters() {
    const releaseFilter = document.querySelector('[data-work-release-filter]');
    const groupFilter = document.querySelector('[data-work-group-filter]');
    const typeFilter = document.querySelector('[data-work-type-filter]');
    const holdFilter = document.querySelector('[data-work-hold-filter]');
    const queryInput = document.querySelector('[data-work-query]');
    const release = releaseFilter ? releaseFilter.value : '';
    const group = groupFilter ? groupFilter.value : '';
    const workType = typeFilter ? typeFilter.value : '';
    const hold = holdFilter ? holdFilter.value : '';
    const query = queryInput ? queryInput.value.trim().toLowerCase() : '';
    const visibleIds = [];
    document.querySelectorAll('[data-work-record]').forEach(function(record) {
      const scoped = selectedWorkScope === 'all' || !selectedFeatureDefinitionId || !record.dataset.workItemFeature || record.dataset.workItemFeature === selectedFeatureDefinitionId;
      const visible = scoped
        && (!release || record.dataset.workRelease === release)
        && (!group || record.dataset.workGroup === group)
        && (!workType || record.dataset.workType === workType)
        && (!hold || record.dataset.workHold === hold)
        && (!query || (record.dataset.workSearch || '').indexOf(query) >= 0);
      record.classList.toggle('hidden', !visible);
      if (visible && visibleIds.indexOf(record.dataset.workSelect) < 0) visibleIds.push(record.dataset.workSelect);
    });
    const scopeLabel = document.querySelector('[data-work-scope-label]');
    if (scopeLabel) scopeLabel.textContent = selectedWorkScope === 'all' ? '전체 작업을 표시하고 있습니다.' : '선택 기능 ' + (selectedFeatureDefinitionId || '없음') + '의 작업만 표시하고 있습니다.';
    const hasResults = visibleIds.length > 0;
    document.querySelectorAll('[data-work-filter-empty]').forEach(function(empty) { empty.classList.toggle('hidden', hasResults); });
    document.querySelectorAll('[data-work-selection-empty]').forEach(function(empty) { empty.classList.toggle('hidden', hasResults); });
    if (!hasResults) { selectWorkItem(''); return; }
    selectWorkItem(visibleIds.indexOf(selectedWorkItemId) >= 0 ? selectedWorkItemId : visibleIds[0]);
  }

  function featureScreenIds(feature) {
    const placements = feature && Array.isArray(feature.placements) ? feature.placements.filter(function(placement) { return placement && typeof placement.screenId === 'string' && placement.screenId.trim(); }).map(function(placement) { return placement.screenId.trim(); }) : [];
    const legacy = feature && Array.isArray(feature.screenIds) ? feature.screenIds.filter(function(id) { return typeof id === 'string' && id.trim(); }).map(function(id) { return id.trim(); }) : [];
    return Array.from(new Set(placements.length ? placements : legacy));
  }

  function applyFeatureDefinitionFilters() {
    const groupFilter = document.querySelector('[data-feature-group-filter]');
    const queryInput = document.querySelector('[data-feature-query]');
    const group = groupFilter ? groupFilter.value : '';
    const query = queryInput ? queryInput.value.trim().toLowerCase() : '';
    const visibleIds = [];
    document.querySelectorAll('[data-feature-definition-row]').forEach(function(row) {
      let screens = [];
      try { const parsed = JSON.parse(row.dataset.featureScreens || '[]'); screens = Array.isArray(parsed) ? parsed : []; } catch { screens = []; }
      const visible = (!selectedFeatureScreenId || screens.indexOf(selectedFeatureScreenId) >= 0)
        && (!group || row.dataset.featureGroup === group)
        && (!query || (row.dataset.featureSearch || '').indexOf(query) >= 0);
      row.classList.toggle('hidden', !visible);
      if (visible) visibleIds.push(row.dataset.planningFeatureId);
    });
    visibleDefinitionFeatureIds = new Set(visibleIds);
    const hasResults = visibleIds.length > 0;
    document.querySelectorAll('[data-feature-filter-empty]').forEach(function(empty) { empty.classList.toggle('hidden', hasResults); });
    document.querySelectorAll('[data-feature-selection-empty]').forEach(function(empty) { empty.classList.toggle('hidden', hasResults); });
    document.querySelectorAll('[data-open-feature-status]').forEach(function(button) { button.disabled = !hasResults; });
    if (!hasResults) {
      document.querySelectorAll('[data-feature-definition-row]').forEach(function(row) { row.classList.remove('selected'); row.setAttribute('aria-pressed', 'false'); });
      document.querySelectorAll('[data-feature-definition-detail]').forEach(function(detail) { detail.classList.add('hidden'); });
      return;
    }
    selectFeature(visibleDefinitionFeatureIds.has(selectedFeatureDefinitionId) ? selectedFeatureDefinitionId : visibleIds[0]);
  }

  function selectFeatureScreen(id) {
    selectedFeatureScreenId = id || '';
    document.querySelectorAll('[data-feature-screen-select]').forEach(function(button) { const active = button.dataset.featureScreenSelect === selectedFeatureScreenId; button.classList.toggle('selected', active); button.setAttribute('aria-pressed', active ? 'true' : 'false'); });
    applyFeatureDefinitionFilters();
  }

  function selectScreen(id) {
    selectedScreenId = id;
    document.querySelectorAll('[data-screen-id]').forEach(function(node) { const active = node.dataset.screenId === id; node.classList.toggle('selected', active); node.setAttribute('aria-pressed', active ? 'true' : 'false'); });
    const workspace = currentWorkspace();
    const screen = flattenScreens(workspace && workspace.sitemap).find(function(item) { return item.id === id; });
    const detail = document.getElementById('planningScreenDetail');
    if (detail && screen) {
      const features = workspace && Array.isArray(workspace.features) ? workspace.features : [];
      const details = workspace && Array.isArray(workspace.featureDetails) ? workspace.featureDetails : [];
      const flows = workspace && workspace.userFlows && Array.isArray(workspace.userFlows.flows) ? workspace.userFlows.flows : [];
      const featureIds = Array.from(new Set([].concat(Array.isArray(screen.featureIds) ? screen.featureIds : [], features.filter(function(feature) { const featureDetail = details.find(function(item) { return item.id === (feature.detailId || feature.id); }); const catalogScreens = Array.isArray(feature.screenIds) ? feature.screenIds : []; const detailScreens = featureDetail && featureDetail.traceability && Array.isArray(featureDetail.traceability.screenIds) ? featureDetail.traceability.screenIds : []; return catalogScreens.indexOf(id) >= 0 || detailScreens.indexOf(id) >= 0; }).map(function(feature) { return feature.id; }))));
      const flowIds = Array.from(new Set([].concat(Array.isArray(screen.flowIds) ? screen.flowIds : [], flows.filter(function(flow) { return (Array.isArray(flow.steps) ? flow.steps : []).some(function(step) { return (Array.isArray(step.screenIds) ? step.screenIds : []).indexOf(id) >= 0; }); }).map(function(flow) { return flow.id; }), features.filter(function(feature) { return featureIds.indexOf(feature.id) >= 0; }).flatMap(function(feature) { return Array.isArray(feature.flowIds) ? feature.flowIds : []; }))));
      const deliveryFeatures = workspace && workspace.deliveryEvidence && Array.isArray(workspace.deliveryEvidence.features) ? workspace.deliveryEvidence.features : [];
      const delivery = featureIds.map(function(featureId) { const evidence = deliveryFeatures.find(function(item) { return (item.featureId || item.id) === featureId; }); return featureId + ': ' + (evidence && (evidence.deliveryStatus || evidence.status) || '구현 근거 미수집'); });
      detail.innerHTML = '<span>' + escapeHtml(screen.surfaceTitle || screen.surface) + '</span><h3>' + escapeHtml(screen.title) + '</h3><code>' + escapeHtml(screen.id) + '</code><dl><div><dt>종류</dt><dd>' + escapeHtml(screen.type || 'page') + '</dd></div><div><dt>상위 화면</dt><dd>' + escapeHtml(screen.parentId || '최상위') + '</dd></div><div><dt>Route</dt><dd>' + escapeHtml(screen.route || '미정') + '</dd></div><div><dt>접근</dt><dd>' + escapeHtml(normalizeList(screen.access).join(', ') || '미정') + '</dd></div><div><dt>직접 이동</dt><dd>' + escapeHtml(normalizeList(screen.directNavigation).join(', ') || '없음') + '</dd></div></dl>'
        + '<section class="screen-related-links"><h4>관련 계획 항목</h4><p><b>기능</b> ' + escapeHtml(featureIds.join(', ') || '연결 없음') + '</p><p><b>흐름</b> ' + escapeHtml(flowIds.join(', ') || '연결 없음') + '</p><p><b>전달</b> ' + escapeHtml(delivery.join(', ') || '연결 없음') + '</p><div>'
        + '<button type="button" data-screen-target-view="features"' + (featureIds[0] ? ' data-related-feature-id="' + escapeHtml(featureIds[0]) + '"' : ' disabled') + '>관련 기능 정의 보기</button>'
        + '<button type="button" data-screen-target-view="flows"' + (flowIds[0] ? '' : ' disabled') + '>관련 사용자 흐름 보기</button>'
        + '<button type="button" data-screen-target-view="status"' + (featureIds[0] ? ' data-related-feature-id="' + escapeHtml(featureIds[0]) + '"' : ' disabled') + '>관련 기능 현황 보기</button></div></section>';
    }
  }

  function applyScreenFilter() {
    const surface = document.getElementById('sitemapSurfaceFilter'); const search = document.getElementById('sitemapScreenSearch');
    const surfaceValue = surface ? surface.value : ''; const query = search ? search.value.trim().toLowerCase() : '';
    document.querySelectorAll('[data-screen-record]').forEach(function(item) { const visible = (!surfaceValue || item.dataset.surface === surfaceValue) && (!query || (item.dataset.search || '').indexOf(query) >= 0); item.classList.toggle('screen-filtered', !visible); });
  }

  function orgGeometry() {
    const canvas = document.getElementById('orgChartCanvas');
    const svg = document.getElementById('planningOrgChart');
    if (!canvas || !svg) return null;
    const bounds = { minX: Number(canvas.dataset.orgMinX), minY: Number(canvas.dataset.orgMinY), maxX: Number(canvas.dataset.orgMaxX), maxY: Number(canvas.dataset.orgMaxY) };
    if (!Number.isFinite(bounds.minX) || !Number.isFinite(bounds.minY) || !Number.isFinite(bounds.maxX) || !Number.isFinite(bounds.maxY)) return null;
    const box = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : null;
    const rect = svg.getBoundingClientRect ? svg.getBoundingClientRect() : null;
    if (!box || !Number.isFinite(box.width) || !Number.isFinite(box.height) || box.width <= 0 || box.height <= 0) return null;
    let inverse = null;
    try { const matrix = svg.getScreenCTM ? svg.getScreenCTM() : null; inverse = matrix && typeof matrix.inverse === 'function' ? matrix.inverse() : null; } catch { inverse = null; }
    function screenDeltaToUser(dx, dy) { if (inverse) return { x: inverse.a * dx + inverse.c * dy, y: inverse.b * dx + inverse.d * dy }; return { x: rect && rect.width ? dx * box.width / rect.width : dx, y: rect && rect.height ? dy * box.height / rect.height : dy }; }
    function screenPointToUser(x, y) { if (inverse) return { x: inverse.a * x + inverse.c * y + inverse.e, y: inverse.b * x + inverse.d * y + inverse.f }; return { x: box.x + (rect && rect.width ? (x - rect.left) * box.width / rect.width : x), y: box.y + (rect && rect.height ? (y - rect.top) * box.height / rect.height : y) }; }
    return { canvas: canvas, svg: svg, box: box, rect: rect, bounds: bounds, screenDeltaToUser: screenDeltaToUser, screenPointToUser: screenPointToUser };
  }
  function clampValue(value, minimum, maximum) { if (minimum > maximum) return (minimum + maximum) / 2; return Math.min(maximum, Math.max(minimum, value)); }
  function clampOrgPan() {
    const geometry = orgGeometry(); if (!geometry) return;
    const visible = geometry.screenDeltaToUser(48, 48); const bounds = geometry.bounds; const box = geometry.box;
    const visibleX = Math.abs(visible.x); const visibleY = Math.abs(visible.y);
    orgPanX = clampValue(orgPanX, box.x + visibleX - bounds.maxX * orgScale, box.x + box.width - visibleX - bounds.minX * orgScale);
    orgPanY = clampValue(orgPanY, box.y + visibleY - bounds.maxY * orgScale, box.y + box.height - visibleY - bounds.minY * orgScale);
  }
  function updateOrgTransform() { clampOrgPan(); const viewport = document.getElementById('orgViewport'); if (viewport) viewport.setAttribute('transform', 'translate(' + orgPanX + ' ' + orgPanY + ') scale(' + orgScale + ')'); }
  function fitOrgChart() { const geometry = orgGeometry(); if (!geometry) { orgScale = 1; orgPanX = 0; orgPanY = 0; return; } const bounds = geometry.bounds; const box = geometry.box; const padding = geometry.screenDeltaToUser(16, 16); const width = Math.max(1, bounds.maxX - bounds.minX); const height = Math.max(1, bounds.maxY - bounds.minY); orgScale = Math.min(1.8, Math.max(0.5, Math.min((box.width - Math.abs(padding.x) * 2) / width, (box.height - Math.abs(padding.y) * 2) / height))); orgPanX = box.x + box.width / 2 - ((bounds.minX + bounds.maxX) / 2) * orgScale; orgPanY = box.y + box.height / 2 - ((bounds.minY + bounds.maxY) / 2) * orgScale; }
  function orgZoomLimits(geometry) {
    // 최대 배율은 화면 픽셀 기준으로 계산한다. 넓은 조직도일수록 viewBox가
    // 축소 렌더되므로, 노드 글자가 자연 크기의 약 1.5배까지 커질 수 있게
    // 사용자 좌표 상한을 동적으로 올린다 (좁은 차트는 기존 1.8 유지).
    if (!geometry || !geometry.rect || !geometry.rect.width || !geometry.box || !geometry.box.width) return { min: 0.5, max: 1.8 };
    const pxPerUnit = geometry.rect.width / geometry.box.width;
    return { min: 0.5, max: Math.max(1.8, pxPerUnit > 0 ? 1.5 / pxPerUnit : 1.8) };
  }
  function runOrgAction(action) { const geometry = orgGeometry(); const oldScale = orgScale; const limits = orgZoomLimits(geometry); if (action === 'zoom-in') orgScale = Math.min(limits.max, orgScale * 1.25); if (action === 'zoom-out') orgScale = Math.max(limits.min, orgScale / 1.25); if (geometry && orgScale !== oldScale) { const rect = geometry.rect; const center = geometry.screenPointToUser(rect ? rect.left + rect.width / 2 : 0, rect ? rect.top + rect.height / 2 : 0); const worldX = (center.x - orgPanX) / oldScale; const worldY = (center.y - orgPanY) / oldScale; orgPanX = center.x - worldX * orgScale; orgPanY = center.y - worldY * orgScale; } const pan = geometry ? geometry.screenDeltaToUser(48, 48) : { x: 48, y: 48 }; if (action === 'pan-left') orgPanX -= Math.abs(pan.x); if (action === 'pan-right') orgPanX += Math.abs(pan.x); if (action === 'pan-up') orgPanY -= Math.abs(pan.y); if (action === 'pan-down') orgPanY += Math.abs(pan.y); if (action === 'fit') fitOrgChart(); updateOrgTransform(); }

  function cacheWorkspaceViews(id) { if (!id || viewCache.has(id)) return; const views = {}; document.querySelectorAll('[data-workspace-view]').forEach(function(panel) { const body = panel.querySelector('[data-view-body]'); if (body) views[panel.dataset.workspaceView] = body.innerHTML; }); viewCache.set(id, views); }

  function switchWorkspace(id) {
    workspaceSelections.set(workspaceId, { featureDefinitionId: selectedFeatureDefinitionId, featureScreenId: selectedFeatureScreenId, workItemId: selectedWorkItemId, statusView: selectedStatusView, workScope: selectedWorkScope, flowId: selectedFlowId, flowStepId: selectedFlowStepId });
    cacheWorkspaceViews(workspaceId);
    const operationsBody = document.querySelector('[data-operations-body]');
    if (operationsBody) {
      operationsCache.set(workspaceId, operationsBody.innerHTML);
      const operationsTemplate = document.querySelector('template[data-workspace-template="' + id.replace(/[^A-Za-z0-9_-]/g, '') + '"][data-view="operations"]');
      if (operationsCache.has(id)) operationsBody.innerHTML = operationsCache.get(id);
      else if (operationsTemplate) operationsBody.innerHTML = operationsTemplate.innerHTML;
    }
    workspaceId = id; selectedFeatureDefinitionId = ''; selectedWorkItemId = ''; selectedFeatureScreenId = ''; selectedStatusView = 'kanban'; selectedWorkScope = 'feature'; visibleDefinitionFeatureIds = null; selectedScreenId = ''; selectedFlowId = ''; selectedFlowStepId = ''; orgScale = 1; orgPanX = 0; orgPanY = 0;
    document.querySelectorAll('[data-workspace-view]').forEach(function(panel) { const body = panel.querySelector('[data-view-body]'); if (!body) return; const cached = viewCache.get(id); const template = document.querySelector('template[data-workspace-template="' + id.replace(/[^A-Za-z0-9_-]/g, '') + '"][data-view="' + panel.dataset.workspaceView + '"]'); if (cached && Object.prototype.hasOwnProperty.call(cached, panel.dataset.workspaceView)) body.innerHTML = cached[panel.dataset.workspaceView]; else if (template) body.innerHTML = template.innerHTML; });
    cacheWorkspaceViews(id);
    const workspace = currentWorkspace(); const badge = document.getElementById('workspaceBadge'); if (badge) badge.textContent = workspace && workspace.badge || 'ACTUAL DATA';
    const features = workspace && Array.isArray(workspace.features) ? workspace.features : []; const stored = workspaceSelections.get(id); const selected = features.find(function(feature) { return stored && feature.id === stored.featureDefinitionId; }) || features[0]; if (selected) { selectFeature(selected.id); } selectFeatureScreen(stored && stored.featureScreenId ? stored.featureScreenId : '');
    const workItems = workspace && Array.isArray(workspace.featureWorkItems) ? workspace.featureWorkItems : []; const selectedWork = workItems.find(function(item) { return stored && item.id === stored.workItemId; }) || workItems[0]; selectWorkItem(selectedWork && selectedWork.id || ''); setStatusView(stored && stored.statusView || 'kanban'); setWorkScope(stored && stored.workScope || 'feature'); applyWorkItemFilters();
    const flows = workspaceFlows(workspace); const selectedFlow = flows.find(function(flow) { return stored && flow && flow.id === stored.flowId; }) || flows[0]; selectFlow(selectedFlow && selectedFlow.id || '', stored && stored.flowStepId || '');
    setPlanningView('overview');
  }

  document.addEventListener('click', function(event) {
    const view = event.target.closest('[data-planning-view-button]'); if (view) { setPlanningView(view.dataset.planningViewButton); return; }
    const flow = event.target.closest('[data-flow-select]'); if (flow) { selectFlow(flow.dataset.flowSelect, ''); return; }
    const flowStep = event.target.closest('[data-flow-step-select]'); if (flowStep) { if (flowStep.dataset.flowId !== selectedFlowId) selectFlow(flowStep.dataset.flowId, flowStep.dataset.flowStepSelect); else selectFlowStep(flowStep.dataset.flowStepSelect, flowStep.dataset.flowId); return; }
    const featureScreen = event.target.closest('[data-feature-screen-select]'); if (featureScreen) { selectFeatureScreen(featureScreen.dataset.featureScreenSelect); return; }
    const openStatus = event.target.closest('[data-open-feature-status]'); if (openStatus) { if (openStatus.disabled) return; selectFeature(openStatus.dataset.openFeatureStatus); setPlanningView('status'); const workTarget = Array.from(document.querySelectorAll('[data-workspace-view="status"] [data-work-item-id]')).find(function(button) { return button.dataset.workItemFeature === openStatus.dataset.openFeatureStatus; }); if (workTarget) selectWorkItem(workTarget.dataset.workItemId); applyWorkItemFilters(); const legacyTarget = Array.from(document.querySelectorAll('[data-workspace-view="status"] [data-planning-feature-id]')).find(function(button) { return button.dataset.planningFeatureId === openStatus.dataset.openFeatureStatus; }); const focusTarget = workTarget || legacyTarget; if (focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus(); return; }
    const statusView = event.target.closest('[data-status-view-select]'); if (statusView) { setStatusView(statusView.dataset.statusViewSelect); return; }
    const workScope = event.target.closest('[data-work-scope-select]'); if (workScope) { setWorkScope(workScope.dataset.workScopeSelect); return; }
    const gap = event.target.closest('[data-gap-select]'); if (gap) { selectFeature(gap.dataset.gapSelect); document.querySelectorAll('[data-gap-select]').forEach(function(button) { const active = button.dataset.gapSelect === gap.dataset.gapSelect; button.classList.toggle('selected', active); button.setAttribute('aria-pressed', active ? 'true' : 'false'); }); return; }
    const returnDefinition = event.target.closest('[data-return-feature-definition]'); if (returnDefinition) { setPlanningView('features'); return; }
    const workItem = event.target.closest('[data-work-select]'); if (workItem) { selectWorkItem(workItem.dataset.workSelect); return; }
    const screenView = event.target.closest('[data-screen-view]'); if (screenView) { document.querySelectorAll('[data-screen-view]').forEach(function(button) { const active = button.dataset.screenView === screenView.dataset.screenView; button.setAttribute('aria-pressed', active ? 'true' : 'false'); }); document.querySelectorAll('[data-screen-view-panel]').forEach(function(panel) { panel.classList.toggle('hidden', panel.dataset.screenViewPanel !== screenView.dataset.screenView); }); return; }
    const screenTarget = event.target.closest('[data-screen-target-view]'); if (screenTarget) { if (screenTarget.dataset.relatedFeatureId) selectFeature(screenTarget.dataset.relatedFeatureId); setPlanningView(screenTarget.dataset.screenTargetView); return; }
    const feature = event.target.closest('[data-planning-feature-id]'); if (feature) { selectFeature(feature.dataset.planningFeatureId); return; }
    const screen = event.target.closest('[data-screen-id]'); if (screen) { selectScreen(screen.dataset.screenId); return; }
    const orgAction = event.target.closest('[data-org-action]'); if (orgAction) runOrgAction(orgAction.dataset.orgAction);
  });
  document.addEventListener('keydown', function(event) { const flow = event.target.closest('[data-flow-select]'); if (flow && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); selectFlow(flow.dataset.flowSelect, ''); return; } const flowStep = event.target.closest('[data-flow-step-select]'); if (flowStep && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); if (flowStep.dataset.flowId !== selectedFlowId) selectFlow(flowStep.dataset.flowId, flowStep.dataset.flowStepSelect); else selectFlowStep(flowStep.dataset.flowStepSelect, flowStep.dataset.flowId); return; } const screen = event.target.closest('[data-screen-id][role="button"]'); if (screen && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); selectScreen(screen.dataset.screenId); return; } const canvas = event.target.closest('#orgChartCanvas'); if (!canvas) return; const actions = { ArrowLeft: 'pan-left', ArrowRight: 'pan-right', ArrowUp: 'pan-up', ArrowDown: 'pan-down', '+': 'zoom-in', '=': 'zoom-in', '-': 'zoom-out', '0': 'fit' }; if (actions[event.key]) { event.preventDefault(); runOrgAction(actions[event.key]); } });
  document.addEventListener('pointerdown', function(event) { const canvas = event.target.closest('#orgChartCanvas'); if (!canvas || event.target.closest('[data-screen-id]')) return; orgPointer = { id: event.pointerId, x: event.clientX, y: event.clientY }; canvas.setPointerCapture && canvas.setPointerCapture(event.pointerId); canvas.classList.add('panning'); });
  document.addEventListener('pointermove', function(event) { if (!orgPointer || event.pointerId !== orgPointer.id) return; const geometry = orgGeometry(); const delta = geometry ? geometry.screenDeltaToUser(event.clientX - orgPointer.x, event.clientY - orgPointer.y) : { x: event.clientX - orgPointer.x, y: event.clientY - orgPointer.y }; orgPanX += delta.x; orgPanY += delta.y; orgPointer.x = event.clientX; orgPointer.y = event.clientY; updateOrgTransform(); });
  function clearOrgPointer(event) { if (!orgPointer || event.pointerId !== orgPointer.id) return; const canvas = document.getElementById('orgChartCanvas'); if (canvas) canvas.classList.remove('panning'); orgPointer = null; }
  document.addEventListener('wheel', function(event) {
    const canvas = event.target.closest('#orgChartCanvas'); if (!canvas) return;
    event.preventDefault();
    const geometry = orgGeometry(); if (!geometry) return;
    const limits = orgZoomLimits(geometry);
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    const next = Math.min(limits.max, Math.max(limits.min, orgScale * factor));
    if (next === orgScale) return;
    const point = geometry.screenPointToUser(event.clientX, event.clientY);
    const worldX = (point.x - orgPanX) / orgScale; const worldY = (point.y - orgPanY) / orgScale;
    orgScale = next; orgPanX = point.x - worldX * orgScale; orgPanY = point.y - worldY * orgScale;
    updateOrgTransform();
  }, { passive: false });
  document.addEventListener('pointerup', clearOrgPointer);
  document.addEventListener('pointercancel', clearOrgPointer);
  document.addEventListener('lostpointercapture', clearOrgPointer);
  document.addEventListener('input', function(event) { if (event.target.dataset && Object.prototype.hasOwnProperty.call(event.target.dataset, 'featureQuery')) applyFeatureDefinitionFilters(); if (event.target.dataset && Object.prototype.hasOwnProperty.call(event.target.dataset, 'workQuery')) applyWorkItemFilters(); if (event.target.id === 'planningFeatureSearch') { const query = event.target.value.trim().toLowerCase(); document.querySelectorAll('[data-feature-search]').forEach(function(item) { item.classList.toggle('hidden', Boolean(query) && item.dataset.featureSearch.indexOf(query) < 0); }); } if (event.target.id === 'sitemapScreenSearch') applyScreenFilter(); });
  document.addEventListener('change', function(event) { if (event.target.id === 'workspaceSelect') switchWorkspace(event.target.value); if (event.target.id === 'sitemapSurfaceFilter') applyScreenFilter(); if (event.target.dataset && Object.prototype.hasOwnProperty.call(event.target.dataset, 'featureGroupFilter')) applyFeatureDefinitionFilters(); if (event.target.dataset && (Object.prototype.hasOwnProperty.call(event.target.dataset, 'workReleaseFilter') || Object.prototype.hasOwnProperty.call(event.target.dataset, 'workGroupFilter') || Object.prototype.hasOwnProperty.call(event.target.dataset, 'workTypeFilter') || Object.prototype.hasOwnProperty.call(event.target.dataset, 'workHoldFilter'))) applyWorkItemFilters(); });
  cacheWorkspaceViews(workspaceId);
  const firstFeature = currentWorkspace() && Array.isArray(currentWorkspace().features) && currentWorkspace().features[0]; if (firstFeature) { selectFeature(firstFeature.id); } selectFeatureScreen('');
  const firstWorkItem = currentWorkspace() && Array.isArray(currentWorkspace().featureWorkItems) && currentWorkspace().featureWorkItems[0]; selectWorkItem(firstWorkItem && firstWorkItem.id || ''); setStatusView('kanban'); applyWorkItemFilters();
  const firstFlow = workspaceFlows(currentWorkspace())[0]; selectFlow(firstFlow && firstFlow.id || '', '');
})();`;
}

export function renderPlanningPage(model = {}) {
  const normalizedModel = model && typeof model === 'object' ? model : {};
  const hubCandidate = normalizedModel.workspaceHub && typeof normalizedModel.workspaceHub === 'object' ? normalizedModel.workspaceHub : {};
  const workspaces = safeArray(hubCandidate.workspaces);
  const hub = { ...hubCandidate, workspaces };
  const active = activeWorkspace(hub);
  const css = readFileSync(join(HERE, '..', 'templates', 'hub.css'), 'utf8');
  const dataJson = jsonForScript({ workspaceHub: hub });
  const emptyPage = !active;

  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Planning Hub</title><style>${css}</style></head>
<body class="planning-page"><a class="skip-link" href="#planningMain">본문 바로가기</a><div class="planning-page-shell">
  <aside class="planning-sidebar" aria-label="Planning Hub 메뉴"><a class="planning-brand" href="#planning"><span>c</span><strong>Planning Hub</strong></a><nav><a href="index.html#harness">하네스 가이드</a><a href="index.html#project">프로젝트 문서</a></nav><hr><nav aria-label="Planning 보기">${PLANNING_VIEWS.map(([key, label], index) => `<button type="button" data-planning-view-button="${key}" class="${index === 0 ? 'active' : ''}" aria-pressed="${index === 0}"><span>${index + 1}</span>${label}</button>`).join('')}</nav><small>생성물 · mise run docs:build</small></aside>
  <main class="planning-main" id="planningMain" tabindex="-1"><header class="planning-header"><div><span class="eyebrow">PLANNING HUB</span><h1>제품 계획과 전달 상태</h1><p>기능 정의와 기능 현황을 같은 stable ID로 연결해 봅니다.</p></div><div class="workspace-control"><label for="workspaceSelect">워크스페이스</label><select id="workspaceSelect"${emptyPage ? ' disabled' : ''}>${workspaces.map((workspace) => `<option value="${esc(workspace.id)}"${workspace.id === active?.id ? ' selected' : ''}>${esc(workspace.title || workspace.id)}</option>`).join('')}</select><span id="workspaceBadge" class="workspace-badge${active?.badge ? ' demo' : ''}">${esc(active?.badge || 'ACTUAL DATA')}</span></div></header>
    ${emptyPage ? `<section class="planning-source-empty">${renderEmpty('Planning workspace를 찾을 수 없습니다.', 'workspace config와 source 경로를 확인하세요.')}<a href="index.html#project">문서 허브로 이동</a></section>` : PLANNING_VIEWS.map(([key, label, question], index) => `<section data-workspace-view="${key}" class="planning-view${index ? ' hidden' : ''}"><div class="planning-view-head"><h2>${label}</h2><p>${question}</p></div><div data-view-body>${renderView(key, active)}</div></section>`).join('')}
    ${emptyPage ? '' : `<details class="planning-operations" data-operations-disclosure><summary>운영·고급</summary><div data-operations-body>${renderOperations(active)}</div></details>`}
    ${workspaces.filter((workspace) => workspace !== active).map((workspace) => PLANNING_VIEWS.map(([key]) => `<template data-workspace-template="${esc(String(workspace.id || '').replace(/[^A-Za-z0-9_-]/g, ''))}" data-view="${key}">${renderView(key, workspace)}</template>`).join('') + `<template data-workspace-template="${esc(String(workspace.id || '').replace(/[^A-Za-z0-9_-]/g, ''))}" data-view="operations">${renderOperations(workspace)}</template>`).join('')}
  </main>
</div><script>const DATA = ${dataJson};</script><script>${renderPlanningClientScript()}</script></body></html>`;
}
