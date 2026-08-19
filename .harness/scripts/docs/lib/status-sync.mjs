// 기능 상태 sync: repo 상태를 보고 안전한 전이 제안을 만들고, --apply 시에만 기록한다.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { scanSpecs } from './scan-specs.mjs';
import { validateTransition } from './transition.mjs';
import { applyStatusEdit } from './status-file.mjs';

function specsDir(root) {
  return join(root, 'specs');
}

function listMissingStatus(root) {
  let entries = [];
  try {
    entries = readdirSync(specsDir(root), { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !existsSync(join(specsDir(root), name, 'status.yaml')))
    .sort((a, b) => a.localeCompare(b));
}

function suggestionForFeature(feature) {
  if (feature.status === 'planned' && feature.progress && feature.progress.done > 0) {
    return { to: 'in-progress', reason: 'tasks.md에 완료 항목이 있어 작업 시작으로 판단' };
  }
  if (
    feature.status === 'in-progress'
    && feature.progress
    && feature.progress.total > 0
    && feature.progress.done === feature.progress.total
  ) {
    return { to: 'in-review', reason: 'tasks.md의 모든 작업 항목 완료' };
  }
  if (feature.status === 'in-review' && feature.delivery?.doneEligible) {
    return {
      to: 'done',
      reason: '모든 작업 완료 · 검증 100% 기록 · 열린 결정 0건',
    };
  }
  return null;
}

export function planStatusSync(root) {
  const { features, warnings } = scanSpecs(specsDir(root));
  const suggestions = [];

  for (const feature of features) {
    const suggestion = suggestionForFeature(feature);
    if (!suggestion) continue;
    const verdict = validateTransition(feature.status, suggestion.to);
    if (!verdict.ok) {
      warnings.push(`${feature.id}: sync 전이 불가 — ${verdict.reason}`);
      continue;
    }
    suggestions.push({
      id: feature.id,
      from: feature.status,
      to: suggestion.to,
      reason: suggestion.reason,
      command: `mise run feature:status ${feature.id} ${suggestion.to}`,
    });
  }

  return {
    suggestions,
    warnings,
    missingStatus: listMissingStatus(root),
  };
}

export function applyStatusSync(root, options = {}) {
  const at = options.at;
  if (!at) throw new Error('at is required');
  const onlyIds = new Set(options.ids || []);
  const plan = planStatusSync(root);
  const applied = [];

  for (const suggestion of plan.suggestions) {
    if (onlyIds.size && !onlyIds.has(suggestion.id)) continue;
    const statusPath = join(specsDir(root), suggestion.id, 'status.yaml');
    const text = readFileSync(statusPath, 'utf8');
    writeFileSync(statusPath, applyStatusEdit(text, suggestion.to, at), 'utf8');
    applied.push(suggestion);
  }

  return { ...plan, applied };
}
