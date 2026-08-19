// UserFlow 원본을 정상 경로와 발생 단계별 분기로 투영한다.
// 입력은 읽기 전용이며, 불완전한 그래프에서도 bounded traversal로 종료한다.

const BRANCH_KINDS = new Set(['decision', 'failure', 'recovery']);
const NORMAL_EDGE_KINDS = new Set(['normal', 'success', 'happy-path']);
const MAX_TRAVERSAL_STEPS = 10_000;

function text(value) {
  return typeof value === 'string' ? value : '';
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function stringArray(value) {
  return Array.isArray(value)
    ? value.filter(nonEmpty).map((item) => item.trim())
    : [];
}

function normalizeEdge(edge) {
  if (!edge || typeof edge !== 'object' || !nonEmpty(edge.to)) return null;
  return {
    ...edge,
    to: edge.to.trim(),
    condition: nonEmpty(edge.condition) ? edge.condition : '',
    kind: nonEmpty(edge.kind) ? edge.kind : '',
  };
}

function normalizeStep(step) {
  if (!step || typeof step !== 'object' || !nonEmpty(step.id)) return null;
  return {
    ...step,
    id: step.id.trim(),
    title: nonEmpty(step.title) ? step.title : step.id.trim(),
    kind: nonEmpty(step.kind) ? step.kind : '',
    screenIds: stringArray(step.screenIds),
    featureIds: stringArray(step.featureIds),
    next: Array.isArray(step.next) ? step.next.map(normalizeEdge).filter(Boolean) : [],
  };
}

function branchKind(source, edge, target) {
  if (BRANCH_KINDS.has(edge.kind)) return edge.kind;
  if (target && (target.kind === 'failure' || target.kind === 'recovery')) return target.kind;
  if (source.kind === 'decision') return 'decision';
  if (source.kind === 'failure' || source.kind === 'recovery') return source.kind;
  return '';
}

function chooseNormalEdge(source, edges, stepById) {
  if (edges.length === 0) return { edge: null, ambiguous: false };

  const declaredId = nonEmpty(source.normalNextId) ? source.normalNextId.trim() : '';
  if (declaredId) {
    const declared = edges.filter((edge) => edge.to === declaredId);
    return { edge: declared.length === 1 ? declared[0] : null, ambiguous: declared.length !== 1 };
  }

  const explicitlyNormal = edges.filter((edge) => edge.normal === true || NORMAL_EDGE_KINDS.has(edge.kind));
  if (explicitlyNormal.length > 0) {
    return { edge: explicitlyNormal.length === 1 ? explicitlyNormal[0] : null, ambiguous: explicitlyNormal.length !== 1 };
  }

  if (edges.length === 1) {
    const edge = edges[0];
    return { edge: BRANCH_KINDS.has(edge.kind) ? null : edge, ambiguous: false };
  }

  const nonBranchEdges = edges.filter((edge) => !BRANCH_KINDS.has(edge.kind));
  if (nonBranchEdges.length === 1 && edges.some((edge) => BRANCH_KINDS.has(edge.kind))) {
    return { edge: nonBranchEdges[0], ambiguous: false };
  }

  const successTargets = edges.filter((edge) => stepById.get(edge.to)?.kind === 'success');
  if (successTargets.length === 1) return { edge: successTargets[0], ambiguous: false };
  if (successTargets.length > 1) return { edge: null, ambiguous: true };

  return { edge: null, ambiguous: true };
}

function orderedAlternative(rawSteps) {
  const lines = [];
  rawSteps.forEach((rawStep, index) => {
    const step = normalizeStep(rawStep);
    const id = step?.id || `invalid-step-${index + 1}`;
    const title = step?.title || (rawStep && typeof rawStep === 'object' && nonEmpty(rawStep.title) ? rawStep.title : '유효하지 않은 단계');
    lines.push(`${index + 1}. ${title} [${id}]`);
    const edges = rawStep && typeof rawStep === 'object' && Array.isArray(rawStep.next) ? rawStep.next : [];
    edges.forEach((rawEdge, edgeIndex) => {
      const edge = normalizeEdge(rawEdge);
      const to = edge?.to || 'broken-target';
      const condition = edge?.condition || '조건 미정';
      const kind = edge?.kind || 'kind 미정';
      lines.push(`${id} 분기 ${edgeIndex + 1}: ${condition} -> ${to} (${kind})`);
    });
  });
  return lines;
}

export function buildUserFlowStory(flow) {
  if (!flow || typeof flow !== 'object') {
    return {
      actor: '',
      goal: '',
      normalPath: [],
      branches: [],
      health: [{ type: 'invalid-flow' }],
      orderedText: [],
    };
  }

  const rawSteps = Array.isArray(flow.steps) ? flow.steps : [];
  const health = [];
  const steps = [];
  const stepById = new Map();
  rawSteps.forEach((rawStep, index) => {
    const step = normalizeStep(rawStep);
    if (!step) {
      health.push({ type: 'invalid-step', index });
      return;
    }
    if (stepById.has(step.id)) {
      health.push({ type: 'duplicate-step', id: step.id, index });
      return;
    }
    stepById.set(step.id, step);
    steps.push(step);
  });

  for (const step of steps) {
    for (const edge of step.next) {
      if (!stepById.has(edge.to)) health.push({ type: 'broken-target', from: step.id, to: edge.to });
    }
  }

  const branches = [];
  const normalByStep = new Map();
  for (const step of steps) {
    const choice = chooseNormalEdge(step, step.next, stepById);
    if (choice.ambiguous) health.push({ type: 'ambiguous-branch', from: step.id });
    if (choice.edge) normalByStep.set(step.id, choice.edge);
    for (const edge of step.next) {
      if (edge === choice.edge) continue;
      const classifiedKind = branchKind(step, edge, stepById.get(edge.to));
      const kind = classifiedKind || 'unclassified';
      branches.push({ from: step.id, condition: edge.condition, to: edge.to, kind });
      if (!classifiedKind) {
        health.push({ type: 'unclassified-branch', from: step.id, condition: edge.condition, to: edge.to });
      }
    }
  }

  const normalPath = [];
  const visited = new Set();
  const entryStepId = nonEmpty(flow.entryStepId) ? flow.entryStepId.trim() : '';
  let current = stepById.get(entryStepId) || null;
  if (!current) health.push({ type: 'broken-entry', entryStepId });

  const traversalLimit = Math.min(Math.max(stepById.size + 1, 1), MAX_TRAVERSAL_STEPS);
  let visits = 0;
  while (current && visits < traversalLimit) {
    if (visited.has(current.id)) break;
    visited.add(current.id);
    normalPath.push({
      ...current,
      screenIds: [...current.screenIds],
      featureIds: [...current.featureIds],
      next: current.next.map((edge) => ({ ...edge })),
    });
    visits += 1;
    const next = normalByStep.get(current.id);
    if (!next) break;
    if (!stepById.has(next.to)) break;
    if (visited.has(next.to)) {
      health.push({ type: 'cycle', from: current.id, to: next.to });
      break;
    }
    current = stepById.get(next.to);
  }
  if (current && visits >= traversalLimit && normalByStep.has(current.id)) {
    health.push({ type: 'traversal-limit', limit: traversalLimit });
  }

  return {
    actor: text(flow.actor),
    goal: text(flow.goal),
    normalPath,
    branches,
    health,
    orderedText: orderedAlternative(rawSteps),
  };
}
