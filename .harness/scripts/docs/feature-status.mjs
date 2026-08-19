#!/usr/bin/env node
// 상태 전이 커맨드 진입점 (contracts/cli.md).
// 사용법: node feature-status.mjs <id> <state> <YYYY-MM-DD> [--force]
// 날짜는 태스크 러너가 주입한다(스크립트는 시각을 직접 읽지 않음 — 결정성).

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseYamlLite } from './lib/yaml-lite.mjs';
import { validateTransition, collectHints } from './lib/transition.mjs';
import { scanSpecs } from './lib/scan-specs.mjs';
import { applyStatusEdit } from './lib/status-file.mjs';

const ROOT = process.env.HUB_ROOT || join(import.meta.dirname, '..', '..', '..');

function fail(msg) {
  process.stderr.write(`[feature:status] ${msg}\n`);
  process.exit(1);
}

function main() {
  const raw = process.argv.slice(2);
  const force = raw.includes('--force');
  // 위치 인자: <id> <state>. 날짜는 환경변수로 주입된다(태스크 러너가 결정).
  const positional = raw.filter((a) => !a.startsWith('--'));
  const [id, toState] = positional;
  // FEATURE_STATUS_DATE는 mise 태스크가 주입. 직접 실행 시 인자 3번째로도 허용.
  const at = process.env.FEATURE_STATUS_DATE || positional[2];

  if (!id || !toState) fail('사용법: feature:status <id> <state> [--force]');
  if (!at) fail('날짜 누락(FEATURE_STATUS_DATE 환경변수 또는 3번째 인자)');

  const statusPath = join(ROOT, 'specs', id, 'status.yaml');
  if (!existsSync(statusPath)) fail(`존재하지 않는 기능: ${id} (${statusPath} 없음)`);

  const text = readFileSync(statusPath, 'utf8');
  const { data } = parseYamlLite(text);
  const from = data.status;

  const verdict = validateTransition(from, toState, { force });
  if (!verdict.ok) fail(verdict.reason);
  if (verdict.warning) process.stderr.write(`[feature:status] 경고: ${verdict.warning}\n`);

  writeFileSync(statusPath, applyStatusEdit(text, toState, at), 'utf8');
  process.stdout.write(`[feature:status] ${id}: ${from} → ${toState}\n`);

  // 전이 후 비차단 힌트
  const { features } = scanSpecs(join(ROOT, 'specs'));
  for (const h of collectHints(features, ROOT)) process.stdout.write(`▸ ${h}\n`);
}

main();
