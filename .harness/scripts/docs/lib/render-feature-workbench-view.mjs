import { canCompleteWorkItem } from './aggregate-feature-work-items.mjs';

const PLACEMENT_ROLES = new Set(['primary', 'entry', 'result', 'support']);
const WORK_TYPES = ['frontend', 'backend', 'db', 'qa', 'infra', 'unspecified'];
const WORK_STATUSES = ['planned', 'in-progress', 'in-review', 'done'];
const STATUS_LABELS = {
  planned: '예정',
  'in-progress': '진행 중',
  'in-review': '검토·검증',
  done: '완료',
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function text(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function uniqueStrings(value) {
  return [...new Set(safeArray(value).filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()))];
}

function fallbackPlacements(screenIds) {
  return uniqueStrings(screenIds).map((screenId, index) => ({
    screenId,
    role: index === 0 ? 'primary' : 'support',
  }));
}

function normalizedPlacements(feature) {
  const seen = new Set();
  const placements = [];
  for (const placement of safeArray(feature?.placements)) {
    if (!isObject(placement)) continue;
    const screenId = text(placement.screenId);
    const role = text(placement.role);
    const key = `${screenId}\u0000${role}`;
    if (!screenId || !PLACEMENT_ROLES.has(role) || seen.has(key)) continue;
    seen.add(key);
    placements.push({ screenId, role });
  }
  return placements.length ? placements : fallbackPlacements(feature?.screenIds);
}

function defaultCounts() {
  return { planned: 0, 'in-progress': 0, 'in-review': 0, done: 0, onHold: 0, total: 0 };
}

function normalizedRollup(value) {
  const source = isObject(value) ? value : {};
  const counts = defaultCounts();
  for (const key of Object.keys(counts)) {
    const candidate = Number(source.counts?.[key]);
    counts[key] = Number.isFinite(candidate) && candidate >= 0 ? candidate : 0;
  }
  return {
    status: text(source.status, 'work-not-created'),
    counts,
  };
}

function workDistribution(workspace, featureId) {
  const counts = Object.fromEntries(WORK_TYPES.map((workType) => [workType, 0]));
  for (const item of safeArray(workspace?.featureWorkItems)) {
    if (!isObject(item) || item.featureDefinitionId !== featureId) continue;
    const workType = WORK_TYPES.includes(item.workType) ? item.workType : 'unspecified';
    counts[workType] += 1;
  }
  return counts;
}

export function buildFeatureDefinitionClientModel(workspace = {}) {
  const source = isObject(workspace) ? workspace : {};
  const detailById = new Map(safeArray(source.featureDetails)
    .filter(isObject)
    .map((detail) => [text(detail.id), detail]));
  const rollups = isObject(source.featureRollups) ? source.featureRollups : {};
  const records = [];
  const seenIds = new Set();

  for (const feature of safeArray(source.features)) {
    if (!isObject(feature)) continue;
    const id = text(feature.id);
    if (!id || seenIds.has(id)) continue;
    seenIds.add(id);
    const detail = detailById.get(text(feature.detailId, id));
    const placements = normalizedPlacements(feature);
    const primaryScreenId = placements.find(({ role }) => role === 'primary')?.screenId
      || uniqueStrings(feature.screenIds)[0]
      || '';
    const groupId = text(feature.featureGroupId, text(detail?.featureGroupId, 'ungrouped'));
    const targetReleaseId = text(feature.targetReleaseId, text(detail?.targetReleaseId));
    const userGoal = text(feature.userGoal, text(detail?.intent?.goal, text(feature.summary)));
    const rollup = normalizedRollup(rollups[id]);
    const distribution = workDistribution(source, id);
    const searchText = [
      id,
      feature.title,
      feature.summary,
      feature.actor,
      userGoal,
      groupId,
      targetReleaseId,
      rollup.status,
      ...placements.map(({ screenId, role }) => `${screenId} ${role}`),
    ].filter(Boolean).join(' ').toLowerCase();

    records.push({
      id,
      title: text(feature.title, id),
      summary: text(feature.summary),
      actor: text(feature.actor),
      userGoal,
      priority: text(feature.priority, '미정'),
      definitionStatus: text(feature.definitionStatus, text(detail?.definitionStatus, '미정')),
      groupId,
      placements,
      primaryScreenId,
      targetReleaseId,
      rollup,
      workDistribution: distribution,
      searchText,
    });
  }
  return records;
}

function normalizedHold(value) {
  const source = isObject(value) ? value : {};
  return {
    active: source.active === true,
    reason: text(source.reason),
    releaseCondition: text(source.releaseCondition),
  };
}

function normalizedTasks(value) {
  if (!isObject(value)) return null;
  const done = Number(value.done);
  const total = Number(value.total);
  return Number.isSafeInteger(done) && Number.isSafeInteger(total) && done >= 0 && total >= done
    ? { done, total }
    : null;
}

function normalizedAcceptanceResults(value) {
  const results = [];
  const seenCriterionIds = new Set();
  for (const result of safeArray(value)) {
    if (!isObject(result)) continue;
    const criterionId = text(result.criterionId);
    const status = text(result.status);
    if (!criterionId || !status || seenCriterionIds.has(criterionId)) continue;
    seenCriterionIds.add(criterionId);
    results.push({ criterionId, status });
  }
  return results;
}

export function buildFeatureStatusClientModel(workspace = {}) {
  const source = isObject(workspace) ? workspace : {};
  const definitions = buildFeatureDefinitionClientModel(source);
  const featureById = new Map(definitions.map((feature) => [feature.id, feature]));
  const records = [];
  const seenIds = new Set();

  for (const item of safeArray(source.featureWorkItems)) {
    if (!isObject(item)) continue;
    const id = text(item.id);
    const featureDefinitionId = text(item.featureDefinitionId);
    const feature = featureById.get(featureDefinitionId);
    const requestedStatus = text(item.status);
    if (!id || seenIds.has(id) || !WORK_STATUSES.includes(requestedStatus)) continue;
    // 미등록 기능(registered:false)은 버리지 않고 미등록 묶음으로 표시한다.
    const unregistered = !feature && item.registered === false;
    if (!feature && !unregistered) continue;
    seenIds.add(id);
    const completion = canCompleteWorkItem(item);
    const blockedDone = requestedStatus === 'done' && !completion.complete;
    const status = blockedDone ? 'in-review' : requestedStatus;
    const hold = normalizedHold(item.hold);
    const workType = WORK_TYPES.includes(item.workType) ? item.workType : 'unspecified';
    const releaseId = text(item.releaseId, 'unassigned');
    const taskRefs = uniqueStrings(item.taskRefs);
    const evidenceRefs = uniqueStrings(item.evidenceRefs);
    const requiredAcceptanceCriterionIds = uniqueStrings(item.requiredAcceptanceCriterionIds);
    const acceptanceResults = normalizedAcceptanceResults(item.acceptanceResults);
    const blockingDecisions = uniqueStrings(item.blockingDecisions);
    const title = text(item.title, id);

    records.push({
      id,
      featureDefinitionId,
      featureTitle: unregistered ? '미등록 기능' : feature.title,
      featureGroupId: unregistered ? '미등록' : feature.groupId,
      featurePrimaryScreenId: unregistered ? '' : feature.primaryScreenId,
      featureTargetReleaseId: unregistered ? '' : feature.targetReleaseId,
      unregistered,
      title,
      workType,
      releaseId,
      requestedStatus,
      status,
      blockedDone,
      completion: { complete: completion.complete, missing: [...completion.missing] },
      hold,
      taskRefs,
      tasks: normalizedTasks(item.tasks),
      requiredAcceptanceCriterionIds,
      acceptanceResults,
      evidenceRefs,
      blockingDecisions,
      searchText: [
        id, title, featureDefinitionId, feature?.title, feature?.groupId, feature?.primaryScreenId,
        unregistered ? '미등록 unregistered' : '',
        workType, releaseId, requestedStatus, hold.reason, hold.releaseCondition,
      ].filter(Boolean).join(' ').toLowerCase(),
    });
  }
  return records;
}

function flattenSitemap(sitemap) {
  const surfaces = [];
  for (const surface of safeArray(sitemap?.surfaces)) {
    if (!isObject(surface)) continue;
    const surfaceKey = text(surface.key, 'unknown');
    const surfaceTitle = text(surface.title, surfaceKey);
    const screens = [];
    const seen = new Set();
    const walk = (nodes, depth = 0) => {
      for (const node of safeArray(nodes)) {
        if (!isObject(node)) continue;
        const id = text(node.id);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        screens.push({ id, title: text(node.title, id), depth });
        walk(node.children, depth + 1);
      }
    };
    walk(surface.nodes);
    surfaces.push({ key: surfaceKey, title: surfaceTitle, screens });
  }
  return surfaces;
}

function renderEmpty(title, action) {
  return `<div class="planning-empty" role="status"><b>${esc(title)}</b><p>${esc(action)}</p></div>`;
}

function renderValue(value) {
  if (value === undefined || value === null || value === '') return '<span class="missing-value">정의 없음</span>';
  if (Array.isArray(value)) return value.length
    ? `<ul>${value.map((item) => `<li>${isObject(item) ? renderValue(item) : esc(item)}</li>`).join('')}</ul>`
    : '<span class="empty-value">해당 없음</span>';
  if (isObject(value)) return `<dl>${Object.entries(value).map(([key, item]) => `<div><dt>${esc(key)}</dt><dd>${renderValue(item)}</dd></div>`).join('')}</dl>`;
  return `<span>${esc(value)}</span>`;
}

function distributionText(record) {
  const parts = WORK_TYPES
    .filter((workType) => record.workDistribution[workType] > 0)
    .map((workType) => `${workType} ${record.workDistribution[workType]}`);
  return parts.length ? parts.join(' · ') : '연결 작업 없음';
}

function renderScreenRegion(surfaces, selectedScreenId) {
  const content = surfaces.some(({ screens }) => screens.length)
    ? surfaces.map((surface) => `<section data-feature-surface="${esc(surface.key)}"><h4>${esc(surface.title)}</h4><ul role="tree">${surface.screens.map((screen) => `<li role="treeitem" aria-level="${screen.depth + 1}"><button type="button" data-feature-screen="${esc(screen.id)}" data-feature-screen-select="${esc(screen.id)}" aria-pressed="${screen.id === selectedScreenId}"><span aria-hidden="true">${'—'.repeat(screen.depth)}</span>${esc(screen.title)} <code>${esc(screen.id)}</code></button></li>`).join('')}</ul></section>`).join('')
    : renderEmpty('화면 구조 미수집', 'planning sitemap source와 screen ID를 확인하세요.');
  return `<aside data-feature-surface-screen-region aria-labelledby="featureScreenRegionTitle"><h3 id="featureScreenRegionTitle">Surface와 Screen</h3><button type="button" class="feature-screen-clear" data-feature-screen-select="" aria-pressed="${selectedScreenId ? 'false' : 'true'}">전체 화면</button>${content}</aside>`;
}

function renderListRegion(records, selected, selectedScreenId) {
  const groups = [...new Set(records.map(({ groupId }) => groupId))];
  const rows = records.map((record) => {
    const visible = !selectedScreenId || record.placements.some(({ screenId }) => screenId === selectedScreenId);
    return `<button type="button" class="planning-feature-row${record.id === selected.id ? ' selected' : ''}${visible ? '' : ' hidden'}" data-feature-definition-row data-planning-feature-id="${esc(record.id)}" data-feature-group="${esc(record.groupId)}" data-feature-screens="${esc(JSON.stringify(record.placements.map(({ screenId }) => screenId)))}" data-feature-search="${esc(record.searchText)}" aria-pressed="${record.id === selected.id}"><strong>${esc(record.title)}</strong><span>그룹 ${esc(record.groupId)}</span><span data-placement-role="primary">주 화면 ${esc(record.primaryScreenId || '배치 미정')}</span><span data-feature-rollup="${esc(record.id)}">${esc(distributionText(record))} · ${esc(record.rollup.status)} · Release ${esc(record.targetReleaseId || '미정')}</span><small>우선순위 ${esc(record.priority)}</small></button>`;
  }).join('');
  return `<section data-feature-group-list-region aria-labelledby="featureListRegionTitle"><h3 id="featureListRegionTitle">선택 화면의 기능 그룹과 정의</h3><div class="planning-feature-toolbar"><label>기능명, 사용자 목표, 화면 검색 <input type="search" data-feature-query="true" placeholder="기능명, 목표, 화면 ID"></label><label>기능 그룹 <select data-feature-group-filter="true"><option value="">전체</option>${groups.map((groupId) => `<option value="${esc(groupId)}">${esc(groupId)}</option>`).join('')}</select></label></div><div class="planning-feature-list">${rows}</div><p data-feature-filter-empty class="planning-empty hidden" role="status">조건에 맞는 기능 정의가 없습니다.</p></section>`;
}

function renderDetailRegion(workspace, records, selected) {
  const detailById = new Map(safeArray(workspace?.featureDetails).filter(isObject).map((detail) => [text(detail.id), detail]));
  const featureById = new Map(safeArray(workspace?.features).filter(isObject).map((feature) => [text(feature.id), feature]));
  const deliveryById = new Map(safeArray(workspace?.deliveryEvidence?.features).filter(isObject).map((item) => [text(item.featureId, text(item.id)), item]));
  const syncById = new Map(safeArray(workspace?.syncResult?.featureResults).filter(isObject).map((item) => [text(item.featureId, text(item.id)), item]));
  const articles = records.map((record) => {
    const feature = featureById.get(record.id) || {};
    const detail = detailById.get(text(feature.detailId, record.id));
    const delivery = deliveryById.get(record.id);
    const sync = syncById.get(record.id);
    const body = detail
      ? `<div class="rich-detail-grid"><section><h4>1. 목적과 범위</h4>${renderValue({ intent: detail.intent, scope: detail.scope })}</section><section><h4>2. 행동과 상태</h4>${renderValue({ behavior: detail.behavior, states: detail.states })}</section><section><h4>3. 규칙과 데이터</h4>${renderValue({ rules: detail.rules, interfaces: detail.interfaces })}</section><section><h4>4. 품질과 보안</h4>${renderValue(detail.quality)}</section><section><h4>5. 인수 조건</h4>${renderValue(detail.acceptance)}</section><section><h4>6. 근거와 결정</h4>${renderValue({ traceability: detail.traceability, decisions: detail.decisions })}</section></div>`
      : renderEmpty('상세 원본 미연결', `${record.id}의 rich detail을 작성하세요.`);
    return `<article class="planning-feature-detail${record.id === selected.id ? '' : ' hidden'}" data-feature-definition-detail="${esc(record.id)}" data-planning-feature-detail="${esc(record.id)}"><header><div><code>${esc(record.id)}</code><h3>${esc(record.title)}</h3><p>${esc(record.summary)}</p></div><span class="priority-badge">우선순위 ${esc(record.priority)}</span></header><dl><div><dt>사용자 목표</dt><dd>${esc(record.userGoal || '미정')}</dd></div><div><dt>기능 그룹</dt><dd>${esc(record.groupId)}</dd></div><div><dt>Target Release</dt><dd>${esc(record.targetReleaseId || '미정')}</dd></div></dl><div class="feature-placements"><h4>화면 배치</h4>${record.placements.length ? `<ul>${record.placements.map(({ screenId, role }) => `<li data-placement-role="${esc(role)}"><b>${esc(role)}</b> ${esc(screenId)}</li>`).join('')}</ul>` : '<p role="status">배치 미정</p>'}</div><div class="feature-status-groups"><span><b>정의 상태</b>${esc(record.definitionStatus)}</span><span><b>구현 상태</b>${esc(delivery?.deliveryStatus || delivery?.status || record.rollup.status)}</span><span><b>동기화 상태</b>${esc(sync?.status || '동기화 미수집')}</span></div><p data-feature-rollup="${esc(record.id)}"><b>작업 분포</b> ${esc(distributionText(record))} · 총 ${record.rollup.counts.total}</p>${body}<button type="button" data-open-feature-status="${esc(record.id)}">기능 현황에서 보기</button></article>`;
  }).join('');
  return `<section data-feature-detail-region aria-labelledby="featureDetailRegionTitle"><h3 id="featureDetailRegionTitle">선택 기능 상세</h3><div data-feature-selection-empty class="planning-empty hidden" role="status"><b>현재 필터에서 선택할 기능 정의가 없습니다.</b><p>화면, 기능 그룹 또는 검색 조건을 조정하세요.</p></div>${articles}</section>`;
}

export function renderFeatureDefinitionView({ workspace = {}, selectedFeatureId = null } = {}) {
  const source = isObject(workspace) ? workspace : {};
  const records = buildFeatureDefinitionClientModel(source);
  const selected = records.find(({ id }) => id === selectedFeatureId) || records[0] || null;
  const surfaces = flattenSitemap(source.sitemap);
  const selectedScreenId = '';
  if (!selected) {
    return `<div class="feature-definition-explorer" data-feature-definition-explorer>${renderScreenRegion(surfaces, selectedScreenId)}<section data-feature-group-list-region aria-label="기능 정의 목록">${renderEmpty('연결된 기능 정의 없음', 'planning feature source를 연결하세요.')}</section><section data-feature-detail-region aria-label="선택 기능 상세">${renderEmpty('선택할 기능 정의 없음', '기능 catalog의 stable ID를 확인하세요.')}</section></div>`;
  }
  return `<div class="feature-definition-explorer" data-feature-definition-explorer>${renderScreenRegion(surfaces, selectedScreenId)}${renderListRegion(records, selected, selectedScreenId)}${renderDetailRegion(source, records, selected)}</div>`;
}

function statusCounts(records) {
  const counts = Object.fromEntries(WORK_STATUSES.map((status) => [status, 0]));
  counts.onHold = 0;
  for (const record of records) {
    counts[record.status] += 1;
    if (record.hold.active) counts.onHold += 1;
  }
  return counts;
}

function renderFeatureStatusContexts(features, records, selectedFeatureId) {
  return features.map((feature) => {
    const linked = records.filter((record) => record.featureDefinitionId === feature.id);
    const counts = statusCounts(linked);
    const taskCount = linked.reduce((sum, record) => sum + record.taskRefs.length, 0);
    const acceptanceCount = linked.reduce((sum, record) => sum + record.requiredAcceptanceCriterionIds.length, 0);
    const evidenceCount = linked.reduce((sum, record) => sum + record.evidenceRefs.length, 0);
    const blockerCount = linked.reduce((sum, record) => sum + record.blockingDecisions.length + (record.blockedDone ? 1 : 0), 0);
    return `<article class="feature-status-context${feature.id === selectedFeatureId ? '' : ' hidden'}" data-status-feature-context="${esc(feature.id)}"><code>${esc(feature.id)}</code><h3>${esc(feature.title)}</h3><dl><div><dt>주 화면</dt><dd>${esc(feature.primaryScreenId || '배치 미정')}</dd></div><div><dt>기능 그룹</dt><dd>${esc(feature.groupId)}</dd></div><div><dt>Target Release</dt><dd>${esc(feature.targetReleaseId || '미정')}</dd></div></dl><div class="feature-status-counts" aria-label="작업 상태 집계"><span>예정 ${counts.planned}</span><span>진행 중 ${counts['in-progress']}</span><span>검토·검증 ${counts['in-review']}</span><span>완료 ${counts.done}</span><span>보류 ${counts.onHold}</span></div><dl><div><dt>Task</dt><dd>${taskCount}</dd></div><div><dt>Acceptance</dt><dd>${acceptanceCount}</dd></div><div><dt>Evidence</dt><dd>${evidenceCount}</dd></div><div><dt>Blocker</dt><dd>${blockerCount}</dd></div></dl><button type="button" data-return-feature-definition="true">기능 정의로 돌아가기</button></article>`;
  }).join('');
}

function acceptanceSummary(record) {
  const resultByCriterionId = new Map(record.acceptanceResults.map((result) => [result.criterionId, result.status]));
  const passed = record.requiredAcceptanceCriterionIds.filter((criterionId) => resultByCriterionId.get(criterionId) === 'passed').length;
  return `${passed}/${record.requiredAcceptanceCriterionIds.length} passed`;
}

function workDetailValues(record) {
  const taskSummary = record.tasks ? `${record.tasks.done}/${record.tasks.total} 진행` : `${record.taskRefs.length}개 참조`;
  const completion = record.completion.complete
    ? '완료 조건 충족'
    : `완료 조건 미충족: ${record.completion.missing.join(', ') || '상세 근거 확인 필요'}`;
  return {
    title: record.title,
    meta: `${record.featureTitle} · ${record.workType} · Release ${record.releaseId}`,
    state: `${STATUS_LABELS[record.status]}${record.blockedDone ? ' · 완료 요청 차단' : ''}`,
    hold: record.hold.active ? `보류 · ${record.hold.reason || '사유 미수집'} · 해제 조건 ${record.hold.releaseCondition || '미수집'}` : '보류 아님',
    task: `${taskSummary} · ${record.taskRefs.join(' · ') || 'Task 참조 미수집'}`,
    acceptance: `${acceptanceSummary(record)} · ${record.requiredAcceptanceCriterionIds.join(' · ') || '필수 Acceptance 미수집'}`,
    evidence: record.evidenceRefs.join(' · ') || 'Evidence 미수집',
    blocker: `${record.blockingDecisions.join(' · ') || '열린 결정 없음'} · ${completion}`,
  };
}

function workDataAttributes(record) {
  const detail = workDetailValues(record);
  return `data-work-record data-work-item-feature="${esc(record.featureDefinitionId)}" data-work-status="${esc(record.status)}" data-work-release="${esc(record.releaseId)}" data-work-group="${esc(record.featureGroupId)}" data-work-type="${esc(record.workType)}" data-work-hold="${record.hold.active}" data-work-search="${esc(record.searchText)}" data-work-detail-title="${esc(detail.title)}" data-work-detail-meta="${esc(detail.meta)}" data-work-detail-state="${esc(detail.state)}" data-work-detail-hold="${esc(detail.hold)}" data-work-detail-task="${esc(detail.task)}" data-work-detail-acceptance="${esc(detail.acceptance)}" data-work-detail-evidence="${esc(detail.evidence)}" data-work-detail-blocker="${esc(detail.blocker)}"`;
}

function renderHold(record) {
  if (!record.hold.active) return '';
  return `<span class="work-item-hold"><b>보류</b> ${esc(record.hold.reason || '사유 미수집')} · 해제 조건 ${esc(record.hold.releaseCondition || '미수집')}</span>`;
}

function renderWorkCard(record, selectedWorkItemId) {
  const state = record.blockedDone ? '완료 차단' : STATUS_LABELS[record.status];
  const unregisteredBadge = record.unregistered ? '<span class="work-item-unregistered">미등록 기능</span>' : '';
  return `<button type="button" class="feature-work-item-card${record.id === selectedWorkItemId ? ' selected' : ''}" data-work-item-id="${esc(record.id)}" data-work-select="${esc(record.id)}" data-work-item-hold="${record.hold.active}" data-work-item-unregistered="${record.unregistered === true}" ${workDataAttributes(record)} aria-pressed="${record.id === selectedWorkItemId}"><strong>${esc(record.title)}</strong><code>${esc(record.id)}</code><span>${esc(record.workType)} · Release ${esc(record.releaseId)}</span><span>${esc(state)}</span>${unregisteredBadge}${renderHold(record)}</button>`;
}

function renderKanban(records, selectedWorkItemId) {
  return `<div class="feature-status-kanban" data-status-view="kanban">${WORK_STATUSES.map((status) => {
    const statusRecords = records.filter((record) => record.status === status);
    const titleId = `workStatus-${status.replace(/[^a-z]/g, '')}`;
    return `<section data-kanban-column="${status}" aria-labelledby="${titleId}"><h3 id="${titleId}">${STATUS_LABELS[status]} <span>${statusRecords.length}</span></h3><div data-status-work-items="${status}">${statusRecords.map((record) => renderWorkCard(record, selectedWorkItemId)).join('')}</div>${statusRecords.length ? '' : `<p class="planning-empty" role="status">${STATUS_LABELS[status]} 작업이 없습니다.</p>`}</section>`;
  }).join('')}</div>`;
}

function renderGrouped(features) {
  return `<div class="feature-status-grouped hidden" data-status-view="feature-grouped">${features.map((feature) => `<section data-grouped-feature="${esc(feature.id)}"><h3><code>${esc(feature.id)}</code> ${esc(feature.title)}</h3><div data-grouped-work-items="${esc(feature.id)}"></div></section>`).join('')}</div>`;
}

function renderWorkDetails(record) {
  const detail = record ? workDetailValues(record) : null;
  return `<section class="feature-work-item-details" aria-labelledby="workDetailTitle"><h3 id="workDetailTitle">선택 작업 근거</h3><div data-work-selection-empty class="planning-empty${detail ? ' hidden' : ''}" role="status"><b>선택할 작업이 없습니다.</b><p>필터를 조정하거나 FeatureWorkItem을 연결하세요.</p></div><article class="feature-work-item-detail${detail ? '' : ' hidden'}" data-work-item-detail><header><code data-work-detail-id>${esc(record?.id || '')}</code><h3 data-work-detail-title>${esc(detail?.title || '')}</h3><p data-work-detail-meta>${esc(detail?.meta || '')}</p></header><p><b>상태</b> <span data-work-detail-state>${esc(detail?.state || '')}</span></p><p data-work-detail-hold>${esc(detail?.hold || '')}</p><div class="work-evidence-detail"><section><h4>Task</h4><p data-work-detail-task>${esc(detail?.task || '')}</p></section><section><h4>Acceptance</h4><p data-work-detail-acceptance>${esc(detail?.acceptance || '')}</p></section><section><h4>Evidence</h4><p data-work-detail-evidence>${esc(detail?.evidence || '')}</p></section><section><h4>Blocker</h4><p data-work-detail-blocker>${esc(detail?.blocker || '')}</p></section></div></article></section>`;
}

function renderWorkFilters(features, records) {
  const releases = [...new Set(records.map(({ releaseId }) => releaseId))];
  const groups = [...new Set(features.map(({ groupId }) => groupId))];
  const workTypes = [...new Set(records.map(({ workType }) => workType))];
  const options = (values) => values.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
  return `<div class="feature-work-filters"><label>Release <select data-work-release-filter><option value="">전체</option>${options(releases)}</select></label><label>기능 그룹 <select data-work-group-filter><option value="">전체</option>${options(groups)}</select></label><label>Work type <select data-work-type-filter><option value="">전체</option>${options(workTypes)}</select></label><label>보류 <select data-work-hold-filter><option value="">전체</option><option value="true">보류 중</option><option value="false">보류 아님</option></select></label><label>작업 검색 <input type="search" data-work-query placeholder="작업명, 기능, Release"></label></div>`;
}

export function renderFeatureStatusView({ workspace = {}, selectedFeatureId = null, selectedWorkItemId = null } = {}) {
  const source = isObject(workspace) ? workspace : {};
  const features = buildFeatureDefinitionClientModel(source);
  const records = buildFeatureStatusClientModel(source);
  const selectedFeature = features.find(({ id }) => id === selectedFeatureId) || features[0] || null;
  const selectedWork = records.find(({ id }) => id === selectedWorkItemId) || records[0] || null;
  if (!features.length) return `<div data-feature-status-workbench>${renderEmpty('표시할 기능 현황이 없습니다.', '기능 catalog와 Delivery Evidence를 연결하세요.')}</div>`;
  const unregisteredIds = [...new Set(records.filter((record) => record.unregistered).map((record) => record.featureDefinitionId))];
  const unregisteredNote = unregisteredIds.length
    ? `<p class="planning-unregistered-note" data-unregistered-note role="status">미등록 기능 ${unregisteredIds.length}건 (${esc(unregisteredIds.join(', '))}) — <code>mise run feature:stub "&lt;FEAT-ID&gt;" "&lt;제목&gt;"</code>으로 draft 정의를 등록하세요. 미등록 작업은 전체 작업 범위에서 보입니다.</p>`
    : '';
  return `<div class="feature-status-workbench" data-feature-status-workbench><aside data-feature-status-context aria-label="선택 기능 컨텍스트">${renderFeatureStatusContexts(features, records, selectedFeature?.id)}</aside><main class="feature-status-board"><header><div role="group" aria-label="기능 현황 보기"><button type="button" data-status-view-select="kanban" aria-pressed="true">Kanban</button><button type="button" data-status-view-select="feature-grouped" aria-pressed="false">기능별</button></div><div role="group" aria-label="작업 범위" class="feature-work-scope"><button type="button" data-work-scope-select="feature" aria-pressed="true">선택 기능 작업</button><button type="button" data-work-scope-select="all" aria-pressed="false">전체 작업</button></div><p data-work-scope-label role="status" aria-live="polite">선택 기능의 작업만 표시하고 있습니다.</p>${unregisteredNote}${renderWorkFilters(features, records)}</header>${renderKanban(records, selectedWork?.id)}${renderGrouped(features)}<p data-work-filter-empty class="planning-empty hidden" role="status">조건에 맞는 FeatureWorkItem이 없습니다. 작업 범위(선택 기능/전체 작업)와 필터를 확인하세요.</p>${renderWorkDetails(selectedWork)}</main></div>`;
}
