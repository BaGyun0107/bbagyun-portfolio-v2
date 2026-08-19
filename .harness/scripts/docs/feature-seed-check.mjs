#!/usr/bin/env node
// 1층 예방: spec을 만들기 전에 기능정의서(data/feature-definitions.json)를
// 탐색해, 만들려는 기능명과 유사한 행 또는 ID가 일치하는 행(FEAT-* 카탈로그
// ID 포함 — 카탈로그 항목은 Row_ID로 투영됨)이 이미 있으면 그 Row_ID를
// 재사용하라고 안내한다. 없으면 새 id로 만들어도 된다고 알린다.
//
// 사용법: node feature-seed-check.mjs "<기능명 또는 검색어>"

import { join } from 'node:path';
import { scanServiceDefinition } from './lib/scan-service-definition.mjs';

const ROOT = process.env.HUB_ROOT || join(import.meta.dirname, '..', '..', '..');

function normalize(s) {
  return String(s || '').replace(/\s+/g, '').toLowerCase();
}

function main() {
  const query = process.argv.slice(2).join(' ').trim();
  if (!query) {
    process.stderr.write('[feature:seed-check] 사용법: feature:seed-check "<기능명>"\n');
    process.exit(1);
  }

  const model = scanServiceDefinition(join(ROOT, 'data', 'feature-definitions.json'));
  const q = normalize(query);
  const hits = model.rows.filter((r) => {
    const t = normalize(r.Title);
    const id = normalize(r.Row_ID);
    return (t && (t.includes(q) || q.includes(t))) || (id && id === q);
  });

  if (hits.length === 0) {
    process.stdout.write(
      `[feature:seed-check] '${query}'와 일치하는 원장 행 없음 — 새 spec id로 만들어도 됩니다.\n`,
    );
    return;
  }

  process.stdout.write(
    `[feature:seed-check] '${query}'와 유사한 기능정의 원장 ${hits.length}건 — spec id를 아래 Row_ID로 맞추세요:\n`,
  );
  for (const r of hits) {
    process.stdout.write(`  ${r.Row_ID}  (${r.Title})\n`);
  }
}

main();
