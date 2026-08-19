#!/usr/bin/env node
// merge-ready planning 계약과 생성물 일관성을 엄격하게 검증한다.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { build } from './build-hub.mjs';
import { assertPlanningManifest } from './lib/compile-planning-manifest.mjs';
import { loadPlanningWorkspace, openDecisionSummary } from './lib/build-workspace-hub-model.mjs';
import { scanWorkspaces } from './lib/scan-workspaces.mjs';
import { unregisteredWorkItemSummary } from './lib/aggregate-feature-work-items.mjs';
import { isMain } from './lib/is-main.mjs';

// 미등록 기능 work item과 열린 결정은 fail이 아니라 경고다
// (정의-후행 경로 FR-011 + 열린 결정 소비 루프).
export function collectPlanningWarnings(workspaces = []) {
  const warnings = [];
  for (const workspace of Array.isArray(workspaces) ? workspaces : []) {
    const summary = unregisteredWorkItemSummary(workspace?.featureWorkItems);
    if (summary.featureIds.length > 0) {
      warnings.push(
        `${workspace.id}: 미등록 기능 ${summary.featureIds.length}건 (${summary.featureIds.join(', ')}) — `
        + `mise run feature:stub "<FEAT-ID>" "<제목>"으로 draft 정의를 등록하세요.`,
      );
    }
    const openDecisions = openDecisionSummary(workspace?.decisions);
    if (openDecisions.count > 0) {
      warnings.push(
        `${workspace.id}: 열린 결정 ${openDecisions.count}건 (${openDecisions.ids.join(', ')}) — `
        + 'owner와 해소 조건을 확인하세요.',
      );
    }
  }
  return warnings;
}

function endpointKey(endpoint) { return `${endpoint?.type}:${endpoint?.id}`; }

const GENERATED_PAGE_PATHS = ['docs/index.html', 'docs/planning.html'];

export function checkGeneratedPageSet({ expected = {}, actual = {} } = {}) {
  const errors = [];
  for (const path of GENERATED_PAGE_PATHS) {
    if (actual[path] === null || actual[path] === undefined) {
      errors.push(`missing generated output: ${path} — run mise run docs:build`);
    } else if (actual[path] !== expected[path]) {
      errors.push(`stale generated output: ${path} — run mise run docs:build`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function checkPlanningState({ manifest, lock, evidence, syncResult, generatedOutput, expectedOutput } = {}) {
  const errors = [];
  try { assertPlanningManifest(manifest); } catch (error) { errors.push(`invalid manifest/digest: ${error.message}`); }
  if (lock && (lock.projectId !== manifest?.projectId || lock.digest !== manifest?.digest)) errors.push('Planning Lock digest/project mismatch');
  if (evidence && (evidence.projectId !== manifest?.projectId || evidence.consumedManifestDigest !== lock?.digest)) errors.push('Delivery Evidence digest/project mismatch');
  const known = new Set();
  const typeFields = { need: 'needs', screen: 'screens', feature: 'features', flow: 'flows', decision: 'decisions' };
  for (const [type, field] of Object.entries(typeFields)) for (const item of manifest?.[field] || []) known.add(`${type}:${item.id}`);
  for (const relation of manifest?.relations || []) {
    if (!known.has(endpointKey(relation.from)) || !known.has(endpointKey(relation.to))) errors.push(`broken relation: ${endpointKey(relation.from)} -> ${endpointKey(relation.to)}`);
  }
  if (syncResult?.status === 'conflicted') errors.push('unresolved planning conflict');
  if (generatedOutput !== undefined && expectedOutput !== undefined && generatedOutput !== expectedOutput) errors.push('stale generated output: docs/index.html');
  return { valid: errors.length === 0, errors };
}

export function runPlanningCheck(root) {
  const config = scanWorkspaces(root, { mode: 'strict' });
  const preview = build(root, { write: false });
  const expected = {
    'docs/index.html': preview.documentsHtml,
    'docs/planning.html': preview.planningHtml,
  };
  const actual = Object.fromEntries(GENERATED_PAGE_PATHS.map((path) => {
    const outputPath = join(root, path);
    return [path, existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : null];
  }));
  const errors = [...checkGeneratedPageSet({ expected, actual }).errors];
  const warnings = [];
  for (const descriptor of config.workspaces.filter((item) => item.planningSource)) {
    const workspace = loadPlanningWorkspace(descriptor);
    warnings.push(...collectPlanningWarnings([workspace]));
    if (!workspace.planningManifest) continue;
    const result = checkPlanningState({
      manifest: workspace.planningManifest,
      lock: existsSync(join(descriptor.rootPath, descriptor.deliverySource || 'downstream', 'planning.lock.json'))
        ? JSON.parse(readFileSync(join(descriptor.rootPath, descriptor.deliverySource || 'downstream', 'planning.lock.json'), 'utf8')) : null,
      evidence: workspace.deliveryEvidence,
      syncResult: workspace.syncResult,
    });
    errors.push(...result.errors.map((message) => `${descriptor.id}: ${message}`));
  }
  return { valid: errors.length === 0, errors, warnings };
}

if (isMain(import.meta.url)) {
  const root = process.env.HUB_ROOT || join(import.meta.dirname, '..', '..', '..');
  const result = runPlanningCheck(root);
  for (const warning of result.warnings || []) {
    process.stderr.write(`[planning:check] 경고: ${warning}\n`);
  }
  if (!result.valid) {
    for (const error of result.errors) process.stderr.write(`[planning:check] ${error}\n`);
    process.exit(1);
  }
  process.stdout.write('[planning:check] manifest, lock, evidence, relation, sync, generated output 일치\n');
}
