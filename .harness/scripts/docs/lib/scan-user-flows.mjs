// 선택적 user-flow 원본을 읽어 step/next 구조와 cycle을 검증한다.
// sitemap/feature endpoint 존재 여부는 linked model이 전체 원본을 모은 뒤 판정한다.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SCHEMA_PATH = join(import.meta.dirname, '..', '..', '..', 'config', 'user-flow-schema.json');
export const USER_FLOW_SCHEMA = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function fail(warnings, message) {
  warnings.push(message);
  return { userFlows: null, warnings };
}

function stringArray(value) {
  return Array.isArray(value) ? value.filter(nonEmpty) : [];
}

function normalizeEdges(value, flowId, stepId, warnings) {
  if (!Array.isArray(value)) return [];
  const edges = [];
  value.forEach((edge, edgeIndex) => {
    const hasKind = edge && typeof edge === 'object' && Object.hasOwn(edge, 'kind');
    const hasNormal = edge && typeof edge === 'object' && Object.hasOwn(edge, 'normal');
    if (
      !edge
      || typeof edge !== 'object'
      || !nonEmpty(edge.to)
      || (hasKind && (!nonEmpty(edge.kind) || !USER_FLOW_SCHEMA.edgeKinds.includes(edge.kind)))
      || (hasNormal && typeof edge.normal !== 'boolean')
    ) {
      warnings.push(`user-flow ${flowId} ${stepId} edge 구조 위반 #${edgeIndex + 1}`);
      return;
    }
    edges.push({
      to: edge.to,
      ...(nonEmpty(edge.condition) ? { condition: edge.condition } : {}),
      ...(hasKind ? { kind: edge.kind } : {}),
      ...(hasNormal ? { normal: edge.normal } : {}),
    });
  });
  return edges;
}

function findCycles(flow) {
  const graph = new Map(flow.steps.map((step) => [step.id, (step.next || []).map((edge) => edge.to)]));
  const visiting = new Set();
  const visited = new Set();
  const cycles = [];
  const seenEdges = new Set();

  function visit(id) {
    if (visited.has(id)) return;
    visiting.add(id);
    for (const next of graph.get(id) || []) {
      if (visiting.has(next)) {
        const key = `${id}->${next}`;
        if (!seenEdges.has(key)) cycles.push({ flowId: flow.id, from: id, to: next });
        seenEdges.add(key);
      } else {
        visit(next);
      }
    }
    visiting.delete(id);
    visited.add(id);
  }
  visit(flow.entryStepId);
  for (const step of flow.steps) visit(step.id);
  return cycles;
}

function normalizeFlow(raw, index, warnings, brokenFlowEdges) {
  if (
    !raw
    || !nonEmpty(raw.id)
    || !nonEmpty(raw.title)
    || !nonEmpty(raw.actor)
    || !nonEmpty(raw.goal)
    || !nonEmpty(raw.entryStepId)
    || !Array.isArray(raw.steps)
    || raw.steps.length === 0
  ) {
    warnings.push(`user-flow 필수 필드 위반 #${index + 1}`);
    return null;
  }

  const steps = [];
  const ids = new Set();
  raw.steps.forEach((step, stepIndex) => {
    if (!step || !nonEmpty(step.id) || !nonEmpty(step.title) || !USER_FLOW_SCHEMA.stepKinds.includes(step.kind)) {
      warnings.push(`user-flow ${raw.id} step 구조 위반 #${stepIndex + 1}`);
      return;
    }
    if (ids.has(step.id)) {
      warnings.push(`user-flow ${raw.id} step 중복: ${step.id} — 선선언 우선`);
      return;
    }
    ids.add(step.id);
    steps.push({
      id: step.id,
      title: step.title,
      kind: step.kind,
      ...(nonEmpty(step.normalNextId) ? { normalNextId: step.normalNextId.trim() } : {}),
      screenIds: stringArray(step.screenIds),
      featureIds: stringArray(step.featureIds),
      next: normalizeEdges(step.next, raw.id, step.id, warnings),
    });
  });
  if (steps.length === 0) return null;

  const validIds = new Set(steps.map((step) => step.id));
  for (const step of steps) {
    step.next = step.next.filter((edge) => {
      if (validIds.has(edge.to)) return true;
      const broken = { flowId: raw.id, from: step.id, to: edge.to, reason: 'broken next' };
      brokenFlowEdges.push(broken);
      warnings.push(`user-flow ${raw.id} broken next: ${step.id} -> ${edge.to}`);
      return false;
    });
  }
  if (!validIds.has(raw.entryStepId)) {
    warnings.push(`user-flow ${raw.id} entryStepId 없음: ${raw.entryStepId}`);
  }
  return {
    id: raw.id,
    title: raw.title,
    actor: raw.actor,
    goal: raw.goal,
    entryStepId: validIds.has(raw.entryStepId) ? raw.entryStepId : steps[0].id,
    steps,
  };
}

export function scanUserFlows(root) {
  const warnings = [];
  const path = join(root, ...USER_FLOW_SCHEMA.sourcePath.split('/'));
  if (!existsSync(path)) return fail(warnings, `user-flow 미정의 (${USER_FLOW_SCHEMA.sourcePath})`);

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    return fail(warnings, `user-flow 파싱 실패 — flow 없이 렌더: ${error.message}`);
  }
  if (!parsed || parsed.version !== USER_FLOW_SCHEMA.version || !Array.isArray(parsed.flows)) {
    return fail(warnings, 'user-flow 구조 위반(version/flows) — flow 없이 렌더');
  }

  const brokenFlowEdges = [];
  const flows = [];
  const flowIds = new Set();
  parsed.flows.forEach((raw, index) => {
    const flow = normalizeFlow(raw, index, warnings, brokenFlowEdges);
    if (!flow) return;
    if (flowIds.has(flow.id)) {
      warnings.push(`user-flow id 중복: ${flow.id} — 선선언 우선`);
      return;
    }
    flowIds.add(flow.id);
    flows.push(flow);
  });

  const flowCycles = flows.flatMap(findCycles);
  for (const cycle of flowCycles) {
    warnings.push(`user-flow cycle: ${cycle.flowId} ${cycle.from} -> ${cycle.to}`);
  }
  return {
    userFlows: {
      version: parsed.version,
      flows,
      health: { brokenFlowEdges, flowCycles },
    },
    warnings,
  };
}
