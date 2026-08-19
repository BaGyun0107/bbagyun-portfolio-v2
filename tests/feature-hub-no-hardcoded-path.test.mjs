import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = join(HERE, '..', '.harness', 'scripts', 'docs');

const TARGETS = [
  join(DOCS, 'lib', 'scan-service-definition.mjs'),
  join(DOCS, 'build-hub.mjs'),
];

// SC-004 / FR-007 / FR-008: 특정 로컬 머신 절대경로와 env 우회가 남아 있으면 안 됨.
for (const file of TARGETS) {
  test(`no-hardcoded-path: ${file}에 STICKY 절대경로 없음`, () => {
    const src = readFileSync(file, 'utf8');
    assert.ok(!src.includes('codi-STICKY-v1'), 'codi-STICKY-v1 경로가 남아 있음');
  });

  test(`no-hardcoded-path: ${file}에 SERVICE_DEFINITION_HTML 우회 없음`, () => {
    const src = readFileSync(file, 'utf8');
    assert.ok(!src.includes('SERVICE_DEFINITION_HTML'), 'SERVICE_DEFINITION_HTML 우회가 남아 있음');
  });
}
