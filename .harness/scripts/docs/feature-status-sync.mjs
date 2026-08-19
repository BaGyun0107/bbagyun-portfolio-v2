#!/usr/bin/env node
// 기능 상태 sync 커맨드. 기본은 check-only, --apply일 때만 status.yaml을 수정한다.

import { join } from 'node:path';
import { applyStatusSync, planStatusSync } from './lib/status-sync.mjs';

const ROOT = process.env.HUB_ROOT || join(import.meta.dirname, '..', '..', '..');

function parseArgs(argv) {
  const ids = [];
  let apply = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--apply') {
      apply = true;
    } else if (arg === '--id' && argv[i + 1]) {
      ids.push(argv[i + 1]);
      i += 1;
    } else if (arg.startsWith('--id=')) {
      ids.push(arg.slice('--id='.length));
    }
  }
  return { apply, ids };
}

function printPlan(plan, prefix = '[feature:status:sync]') {
  for (const warning of plan.warnings || []) {
    process.stderr.write(`${prefix} 경고: ${warning}\n`);
  }
  for (const id of plan.missingStatus || []) {
    process.stderr.write(`${prefix} 경고: specs/${id}/status.yaml 없음 — 기능 현황 대상에서 제외됨\n`);
  }
  if (!plan.suggestions.length) {
    process.stdout.write(`${prefix} 상태 전이 제안 없음\n`);
    return;
  }
  for (const suggestion of plan.suggestions) {
    process.stdout.write(
      `${prefix} ${suggestion.id}: ${suggestion.from} → ${suggestion.to} (${suggestion.reason})\n`
        + `  apply: ${suggestion.command}\n`,
    );
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.apply) {
    printPlan(planStatusSync(ROOT));
    return;
  }

  const at = process.env.FEATURE_STATUS_DATE;
  if (!at) {
    process.stderr.write('[feature:status:sync] FEATURE_STATUS_DATE 누락\n');
    process.exit(1);
  }
  const result = applyStatusSync(ROOT, { at, ids: args.ids });
  printPlan(result);
  if (!result.applied.length) {
    process.stdout.write('[feature:status:sync] 적용된 전이 없음\n');
    return;
  }
  for (const applied of result.applied) {
    process.stdout.write(`[feature:status:sync] 적용됨: ${applied.id}: ${applied.from} → ${applied.to}\n`);
  }
}

main();
