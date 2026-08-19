#!/usr/bin/env node
// 관련 source 변경을 debounce해 shared planning sync를 직렬 실행한다.

import { existsSync, lstatSync, watch } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { collectConfiguredEvidencePaths, runPlanningSync } from './planning-sync.mjs';
import { isMain } from './lib/is-main.mjs';

const root = process.env.HUB_ROOT || join(import.meta.dirname, '..', '..', '..');

function normalized(path) {
  return String(path || '').replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '');
}

function nearestExistingParent(path) {
  let candidate = path;
  while (!existsSync(candidate) || !lstatSync(candidate).isDirectory()) {
    const parent = dirname(candidate);
    if (parent === candidate) return null;
    candidate = parent;
  }
  return candidate;
}

export function collectPlanningWatchSources(repoRoot) {
  const sources = [];
  const baseSources = ['data', 'specs', 'examples'];
  for (const sourcePath of baseSources) {
    const watchPath = join(repoRoot, sourcePath);
    if (existsSync(watchPath)) sources.push({ sourcePath, watchPath, kind: 'directory', recursive: true });
  }

  const configured = collectConfiguredEvidencePaths(repoRoot);
  for (const sourcePath of configured.paths) {
    if (baseSources.some((base) => sourcePath === base || sourcePath.startsWith(`${base}/`))) continue;
    const target = resolve(repoRoot, sourcePath);
    if (existsSync(target)) {
      const stat = lstatSync(target);
      if (stat.isDirectory()) sources.push({ sourcePath, watchPath: target, kind: 'directory', recursive: true });
      else sources.push({ sourcePath, watchPath: dirname(target), kind: 'file', recursive: false });
      continue;
    }
    const parent = nearestExistingParent(target);
    if (parent) sources.push({ sourcePath, watchPath: parent, kind: 'missing', recursive: true });
  }
  return sources;
}

export function watchEventMatchesSource(repoRoot, source, filename) {
  if (!filename) return true;
  if (source.sourcePath === '.') return true;
  const changed = normalized(relative(repoRoot, resolve(source.watchPath, String(filename))));
  return changed === source.sourcePath || changed.startsWith(`${source.sourcePath}/`);
}

export function runPlanningWatch(repoRoot = root, { watchFactory = watch, sync = runPlanningSync } = {}) {
  let timer = null;
  let running = false;
  let queued = false;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (running) { queued = true; return; }
      running = true;
      try { sync({ root: repoRoot, trigger: 'watch' }); }
      catch (error) { process.stderr.write(`[planning:watch] ${error.message}\n`); }
      finally { running = false; if (queued) { queued = false; schedule(); } }
    }, 250);
  };
  const sources = collectPlanningWatchSources(repoRoot);
  const watchers = sources.map((source) => watchFactory(source.watchPath, { recursive: source.recursive }, (_event, filename) => {
    if (watchEventMatchesSource(repoRoot, source, filename)) schedule();
  }));
  return { sources, close: () => { clearTimeout(timer); for (const watcher of watchers) watcher.close(); } };
}

if (isMain(import.meta.url)) {
  const runningWatch = runPlanningWatch(root);
  process.stdout.write(`[planning:watch] ${runningWatch.sources.map(({ sourcePath }) => sourcePath).join(', ')} 감시 중\n`);
}
