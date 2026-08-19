// Goal-oriented user-flow story renderer.
// Source 문자열은 모두 escape하고, 모델 원본은 변경하지 않는다.

import { buildUserFlowStory } from './build-user-flow-story.mjs';

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

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function flowId(flow, index) {
  return nonEmpty(flow?.id) ? flow.id.trim() : `flow-${index + 1}`;
}

function stepOwner(step) {
  for (const field of ['owner', 'actor', 'role', 'systemOwner', 'system', 'ownedBy']) {
    if (nonEmpty(step?.[field])) return { field, value: step[field] };
  }
  return null;
}

function renderRefs(label, values) {
  const refs = safeArray(values).filter(nonEmpty);
  return `<div><dt>${label}</dt><dd>${refs.length ? refs.map((value) => `<code>${esc(value)}</code>`).join(' ') : '연결 없음'}</dd></div>`;
}

function branchLabel(kind) {
  return kind === 'unclassified' ? '미분류 분기' : kind;
}

function renderBranch(branch, target) {
  return `<article class="flow-branch-panel" data-flow-branch-kind="${esc(branch.kind)}" data-flow-branch-from="${esc(branch.from)}" data-flow-branch-to="${esc(branch.to)}">
    <header><b>${esc(branchLabel(branch.kind))}</b><span>${esc(branch.condition || '조건 미정')}</span></header>
    <p><code>${esc(branch.from)}</code> → <code>${esc(branch.to)}</code></p>
    ${target ? `<strong>${esc(target.title || target.id)}</strong><dl>${renderRefs('Screen', target.screenIds)}${renderRefs('Feature', target.featureIds)}</dl>` : '<small>대상 단계를 찾을 수 없습니다.</small>'}
  </article>`;
}

function renderStepDetail(flowIdValue, step, selected) {
  const owner = stepOwner(step);
  return `<section class="flow-step-detail${selected ? '' : ' hidden'}" data-flow-step-detail="${esc(step.id)}" data-flow-id="${esc(flowIdValue)}">
    <header><span>${esc(step.kind || 'kind 미정')}</span><h4>${esc(step.title || step.id)}</h4><code>${esc(step.id)}</code></header>
    <dl>${renderRefs('Screen', step.screenIds)}${renderRefs('Feature', step.featureIds)}${owner ? `<div><dt>Ownership</dt><dd>${esc(owner.field)} · ${esc(owner.value)}</dd></div>` : ''}</dl>
  </section>`;
}

function renderRoleLanes(flowIdValue, steps) {
  const owned = steps.map((step) => ({ step, owner: stepOwner(step) })).filter(({ owner }) => owner);
  if (owned.length === 0) return '';
  const groups = new Map();
  for (const item of owned) {
    const key = `${item.owner.field}:${item.owner.value}`;
    if (!groups.has(key)) groups.set(key, { ...item.owner, steps: [] });
    groups.get(key).steps.push(item.step);
  }
  return `<details data-flow-role-lanes="${esc(flowIdValue)}" class="flow-role-lanes"><summary>역할 레인</summary>${[...groups.values()].map((lane) => `<section><h4>${esc(lane.value)}</h4><ol>${lane.steps.map((step) => `<li><code>${esc(step.id)}</code> ${esc(step.title)}</li>`).join('')}</ol></section>`).join('')}</details>`;
}

function renderStory(flow, index) {
  const id = flowId(flow, index);
  const story = buildUserFlowStory(flow);
  const sourceSteps = safeArray(flow?.steps).filter((step) => step && typeof step === 'object' && nonEmpty(step.id));
  const stepById = new Map(sourceSteps.map((step) => [step.id.trim(), {
    ...step,
    id: step.id.trim(),
    title: nonEmpty(step.title) ? step.title : step.id.trim(),
    screenIds: safeArray(step.screenIds).filter(nonEmpty),
    featureIds: safeArray(step.featureIds).filter(nonEmpty),
  }]));
  const firstStepId = story.normalPath[0]?.id || '';
  const branchesBySource = new Map();
  for (const branch of story.branches) {
    if (!branchesBySource.has(branch.from)) branchesBySource.set(branch.from, []);
    branchesBySource.get(branch.from).push(branch);
  }

  return `<article class="user-flow-story${index ? ' hidden' : ''}" data-flow-story="${esc(id)}">
    <header class="flow-story-header"><div><code>${esc(id)}</code><h3>${esc(flow?.title || id)}</h3></div><dl><div><dt>Actor</dt><dd>${esc(story.actor || '미정')}</dd></div><div><dt>Goal</dt><dd>${esc(story.goal || '미정')}</dd></div></dl></header>
    ${story.normalPath.length ? `<ol class="flow-normal-path" data-flow-normal-path aria-label="${esc(flow?.title || id)} 정상 경로">${story.normalPath.map((step, stepIndex) => `<li class="flow-normal-step">
      <button type="button" data-flow-step-select="${esc(step.id)}" data-flow-id="${esc(id)}" aria-pressed="${stepIndex === 0}"><span>${stepIndex + 1}</span><b>${esc(step.title)}</b><small>${esc(step.kind || 'kind 미정')} · ${esc(step.id)}</small></button>
      ${(branchesBySource.get(step.id) || []).length ? `<aside data-flow-branches-for="${esc(step.id)}" aria-label="${esc(step.title)}에서 발생하는 분기">${branchesBySource.get(step.id).map((branch) => renderBranch(branch, stepById.get(branch.to))).join('')}</aside>` : ''}
    </li>`).join('')}</ol>` : '<div class="planning-empty"><b>정상 경로를 구성할 수 없습니다.</b><p>entry step과 명시적 branch semantics를 확인하세요.</p></div>'}
    <section class="flow-selected-step" aria-label="선택 단계 상세"><h4>선택 단계 상세</h4>${sourceSteps.map((step) => renderStepDetail(id, stepById.get(step.id.trim()), step.id.trim() === firstStepId)).join('') || '<p>표시할 단계가 없습니다.</p>'}</section>
    ${renderRoleLanes(id, [...stepById.values()])}
    ${story.health.length ? `<section class="flow-story-health" role="status"><h4>Flow health</h4><ul>${story.health.map((issue) => `<li>${esc(issue.type)}${issue.from ? ` · ${esc(issue.from)}` : ''}${issue.to ? ` → ${esc(issue.to)}` : ''}</li>`).join('')}</ul></section>` : ''}
    <details class="flow-ordered-alternative"><summary>순서형 대안</summary><ol data-flow-ordered-text>${story.orderedText.map((line) => `<li>${esc(line)}</li>`).join('')}</ol></details>
  </article>`;
}

export function renderUserFlowStoryView({ flows } = {}) {
  const records = safeArray(flows);
  if (records.length === 0) {
    return '<div class="planning-empty"><b>사용자 흐름 미수집</b><p>actor, goal과 순서가 있는 flow source를 연결하세요.</p></div>';
  }
  return `<div data-user-flow-story-view><nav class="flow-story-selector" aria-label="사용자 목표 흐름">${records.map((flow, index) => `<button type="button" data-flow-select="${esc(flowId(flow, index))}" aria-pressed="${index === 0}"><b>${esc(flow?.title || flowId(flow, index))}</b><small>${esc(flow?.actor || 'actor 미정')} · ${esc(flow?.goal || 'goal 미정')}</small></button>`).join('')}</nav><div class="flow-story-deck">${records.map(renderStory).join('')}</div></div>`;
}
