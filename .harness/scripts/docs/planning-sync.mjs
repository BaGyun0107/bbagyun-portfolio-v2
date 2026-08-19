#!/usr/bin/env node
// 계획 원본과 downstream 근거를 같은 코어로 재수집한다. --pull만 Planning Lock을 쓴다.

import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';

import { build } from './build-hub.mjs';
import { applyPlanningLock } from './lib/apply-planning-lock.mjs';
import { resolveSafePath } from './lib/planning-contracts.mjs';
import { scanWorkspaces } from './lib/scan-workspaces.mjs';
import { isMain } from './lib/is-main.mjs';

const TRIGGERS = new Map([
  ['manual', 'manual'], ['watch', 'watch'], ['claude', 'claude-stop'], ['claude stop', 'claude-stop'], ['claude-stop', 'claude-stop'],
  ['codex', 'codex-stop'], ['codex stop', 'codex-stop'], ['codex-stop', 'codex-stop'], ['ci', 'ci'],
]);
const GENERATED = new Set([
  'docs/index.html',
  'docs/planning.html',
  '.harness/state/planning-automation.json',
]);
const DEFAULT_DIGEST_LIMITS = Object.freeze({ maxFiles: 10_000, maxBytes: 50 * 1024 * 1024, maxDepth: 64 });

function normalizeRepoPath(path) {
  return String(path || '').replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '');
}

function insideRoot(root, candidate) {
  const rel = relative(root, candidate);
  return rel === '' || !(rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel));
}

export function collectConfiguredEvidencePaths(root) {
  let config;
  try {
    config = scanWorkspaces(root, { mode: 'preview' });
  } catch (error) {
    return { paths: [], health: [{ code: 'workspace-scan-failed', message: error.message }] };
  }

  const paths = [];
  const health = [...(config.health || [])];
  const rootReal = realpathSync(root);
  for (const workspace of config.workspaces || []) {
    if (workspace.deliverySource === undefined) continue;
    try {
      const sourcePath = resolveSafePath(workspace.rootPath, workspace.deliverySource);
      const repoPath = relative(root, sourcePath);
      if (!insideRoot(root, sourcePath)) throw new Error('delivery source resolves outside repository root');
      if (existsSync(sourcePath)) {
        if (lstatSync(sourcePath).isSymbolicLink()) throw Object.assign(new Error('delivery source symlink is not followed'), { healthCode: 'delivery-source-symlink' });
        const sourceReal = realpathSync(sourcePath);
        if (!insideRoot(rootReal, sourceReal)) throw new Error('delivery source realpath resolves outside repository root');
      }
      paths.push(normalizeRepoPath(repoPath || '.'));
    } catch (error) {
      health.push({
        code: error.healthCode || 'delivery-source-unsafe',
        workspaceId: workspace.id,
        message: error.message,
      });
    }
  }
  return { paths: [...new Set(paths)].sort(), health };
}

export function planningSourceGroups() {
  return ['data', 'specs', 'examples', 'evidence'];
}

export function normalizePlanningTrigger(value) {
  return TRIGGERS.get(String(value || 'manual').trim().toLowerCase()) || 'manual';
}

function collectFiles(root, sourceGroups, { limits = DEFAULT_DIGEST_LIMITS } = {}) {
  const roots = sourceGroups.length ? sourceGroups : planningSourceGroups(root);
  const effectiveLimits = { ...DEFAULT_DIGEST_LIMITS, ...limits };
  const files = [];
  const seenFiles = new Set();
  const rootReal = realpathSync(root);
  let totalBytes = 0;
  const walk = (path, depth = 0) => {
    if (!existsSync(path)) return;
    if (depth > effectiveLimits.maxDepth) throw new Error(`planning input depth limit exceeded: ${effectiveLimits.maxDepth}`);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) return;
    const real = realpathSync(path);
    if (!insideRoot(rootReal, real)) throw new Error(`planning input resolves outside repository root: ${path}`);
    if (stat.isDirectory()) {
      for (const name of readdirSync(path).sort()) walk(join(path, name), depth + 1);
      return;
    }
    if (!stat.isFile()) return;
    const rel = relative(root, path).replaceAll('\\', '/');
    if (GENERATED.has(rel) || seenFiles.has(rel)) return;
    seenFiles.add(rel);
    if (seenFiles.size > effectiveLimits.maxFiles) throw new Error(`planning input file limit exceeded: ${effectiveLimits.maxFiles}`);
    totalBytes += stat.size;
    if (totalBytes > effectiveLimits.maxBytes) throw new Error(`planning input byte limit exceeded: ${effectiveLimits.maxBytes}`);
    files.push(rel);
  };
  for (const group of roots) {
    if (group !== 'evidence') {
      walk(join(root, group));
      continue;
    }

    // 설정이 아직 없거나 손상된 데모 저장소에서도 examples/*/downstream
    // 변경을 놓치지 않는다. 설정된 workspace의 deliverySource는 아래에서
    // 별도로 수집하므로 실제 planning-hub 분리 구조도 같은 의미로 처리된다.
    walk(join(root, 'examples'));
    const configured = collectConfiguredEvidencePaths(root);
    for (const path of configured.paths) walk(join(root, path));
  }
  return [...new Set(files)].sort();
}

export function planningInputDigest(root, sourceGroups = [], options = {}) {
  const hash = createHash('sha256');
  for (const file of collectFiles(root, sourceGroups, options)) {
    hash.update(file).update('\0').update(readFileSync(join(root, file))).update('\0');
  }
  return `sha256:${hash.digest('hex')}`;
}

function readState(path) {
  if (!existsSync(path)) return { lastRun: null, lastSuccessfulRunId: null };
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return { lastRun: null, lastSuccessfulRunId: null }; }
}

export function runPlanningSync({
  root,
  trigger = 'manual',
  sourceGroups = [],
  build: buildProjection = () => build(root),
  now = () => new Date().toISOString(),
  force = false,
} = {}) {
  const effectiveSourceGroups = sourceGroups.length ? sourceGroups : planningSourceGroups(root);
  const normalizedTrigger = normalizePlanningTrigger(trigger);
  const statePath = join(root, '.harness', 'state', 'planning-automation.json');
  const state = readState(statePath);
  const startedAt = now();
  const inputDigest = planningInputDigest(root, effectiveSourceGroups);
  const runId = `${normalizedTrigger}-${startedAt.replace(/[^0-9]/g, '')}`;
  let result = 'success';
  const warnings = [];
  if (!force && state.lastRun?.inputDigest === inputDigest && state.lastRun?.result !== 'failed') {
    result = 'skipped';
  } else {
    try { buildProjection(); } catch (error) { result = 'failed'; warnings.push({ message: error.message }); }
  }
  const finishedAt = now();
  const durationMs = Math.max(0, Date.parse(finishedAt) - Date.parse(startedAt)) || 0;
  const lastSuccessfulRunId = result === 'success' ? runId : state.lastSuccessfulRunId;
  const run = { runId, trigger: normalizedTrigger, sourceGroups: effectiveSourceGroups, inputDigest, startedAt, finishedAt, durationMs, result, warnings, lastSuccessfulRunId };
  mkdirSync(join(root, '.harness', 'state'), { recursive: true });
  writeFileSync(statePath, `${JSON.stringify({ version: 1, lastRun: run, lastSuccessfulRunId }, null, 2)}\n`, 'utf8');
  if (result === 'failed') throw new Error(`planning sync failed: ${warnings[0].message}`);
  return run;
}

function argument(name) {
  const direct = process.argv.find((value) => value.startsWith(`${name}=`));
  if (direct) return direct.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function explicitPull(root) {
  const config = scanWorkspaces(root, { mode: 'strict' });
  const workspace = config.workspaces.find((item) => item.id === config.defaultWorkspaceId) || config.workspaces[0];
  if (!workspace?.planningSource || !workspace?.deliverySource) throw new Error('default workspace does not declare planningSource/deliverySource');
  const candidatePath = join(workspace.rootPath, workspace.planningSource, 'planning-manifest.json');
  const lockPath = join(workspace.rootPath, workspace.deliverySource, 'planning.lock.json');
  const candidateManifest = JSON.parse(readFileSync(candidatePath, 'utf8'));
  const currentLock = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, 'utf8')) : null;
  return applyPlanningLock({ lockPath, candidateManifest, expectedProjectId: currentLock?.projectId || candidateManifest.projectId, sourceRepository: workspace.id, sourceRef: candidateManifest.sourceRevision });
}

if (isMain(import.meta.url)) {
  const root = process.env.HUB_ROOT || join(import.meta.dirname, '..', '..', '..');
  if (process.argv.includes('--pull')) explicitPull(root);
  const run = runPlanningSync({ root, trigger: argument('--trigger') || 'manual', force: process.argv.includes('--force') });
  process.stdout.write(`[planning:sync] ${run.result} · ${run.trigger} · ${run.inputDigest}\n`);
}
