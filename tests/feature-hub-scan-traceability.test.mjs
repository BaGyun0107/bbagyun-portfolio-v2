import { tmp } from './helpers/fixture-base.mjs';
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanTraceability } from '../.harness/scripts/docs/lib/scan-traceability.mjs';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'feature-hub');

function rootWith(name) {
  const root = tmp('traceability-');
  mkdirSync(join(root, 'data'), { recursive: true });
  if (name) cpSync(join(FIXTURES, name), join(root, 'data', 'feature-relations.json'));
  return root;
}

test('traceability scan: 유효 entity와 link를 유지한다', () => {
  const result = scanTraceability(rootWith('feature-relations.valid.json'));
  assert.equal(result.traceability.version, 1);
  assert.equal(result.traceability.entities.length, 2);
  assert.equal(result.traceability.links.length, 4);
  assert.deepEqual(result.warnings, []);
});

test('traceability scan: 파일 부재와 파싱 실패는 null + warning이다', () => {
  const absent = scanTraceability(rootWith());
  assert.equal(absent.traceability, null);
  assert.match(absent.warnings.join('\n'), /미정의/);

  const brokenRoot = rootWith();
  writeFileSync(join(brokenRoot, 'data', 'feature-relations.json'), '{ broken');
  const broken = scanTraceability(brokenRoot);
  assert.equal(broken.traceability, null);
  assert.match(broken.warnings.join('\n'), /파싱 실패/);
});

test('traceability scan: 최상위 계약 위반은 fail-open null이다', () => {
  const result = scanTraceability(rootWith('feature-relations.invalid.json'));
  assert.equal(result.traceability, null);
  assert.match(result.warnings.join('\n'), /구조 위반/);
});

test('traceability scan: 개별 오류는 제외하고 유효 항목과 broken 후보를 유지한다', () => {
  const result = scanTraceability(rootWith('feature-relations.partial.json'));
  assert.ok(result.traceability);
  assert.equal(result.traceability.entities.length, 1, '잘못된 type과 중복 entity 제외');
  assert.equal(result.traceability.links.length, 3, 'endpoint 존재 여부는 linked model에서 판정');
  assert.match(result.warnings.join('\n'), /entity type/);
  assert.match(result.warnings.join('\n'), /entity 중복/);
  assert.match(result.warnings.join('\n'), /link 중복/);
});
