import { tmp } from './helpers/fixture-base.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { scanSpecs } from '../.harness/scripts/docs/lib/scan-specs.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SPECS = join(HERE, 'fixtures', 'feature-hub', 'specs');

test('scan-specs: status.yaml을 읽어 기능 목록 생성', () => {
  const { features } = scanSpecs(SPECS);
  const sample = features.find((f) => f.id === '003-sample');
  assert.ok(sample);
  assert.equal(sample.title, '샘플 기능');
  assert.equal(sample.status, 'in-progress');
  assert.deepEqual(sample.owner_roles, ['frontend', 'backend']);
});

test('scan-specs: tasks.md 체크박스로 진행률 계산', () => {
  const { features } = scanSpecs(SPECS);
  const sample = features.find((f) => f.id === '003-sample');
  // 픽스처 tasks.md: [x] 1개, [ ] 2개 → 1/3
  assert.equal(sample.progress.done, 1);
  assert.equal(sample.progress.total, 3);
});

test('scan-specs: spec_link이 specs/<id>로 채워짐', () => {
  const { features } = scanSpecs(SPECS);
  const sample = features.find((f) => f.id === '003-sample');
  assert.equal(sample.spec_link, 'specs/003-sample');
});

test('scan-specs: 잘못된 status 값은 경고하고 건너뜀', () => {
  const { features, warnings } = scanSpecs(SPECS);
  assert.ok(!features.find((f) => f.id === '091-broken'));
  assert.ok(warnings.some((w) => w.includes('091-broken')));
});

test('scan-specs: 존재하지 않는 specs 경로는 빈 결과', () => {
  const { features } = scanSpecs(join(HERE, 'fixtures', 'feature-hub', 'nope'));
  assert.deepEqual(features, []);
});

function withSpecs(files) {
  const root = tmp('codi-scan-specs-');
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(root, dirname(path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

test('scan-specs: status.yaml featureId를 spec 레코드에 싣는다', () => {
  const { root, done } = withSpecs({
    '020-linked/status.yaml': [
      'id: "020-linked"',
      'title: "역방향 연결 spec"',
      'status: in-progress',
      'featureId: "FEAT-LINKED"',
    ].join('\n'),
  });
  const { features, warnings } = scanSpecs(root);
  done();
  assert.equal(features[0].featureId, 'FEAT-LINKED');
  assert.equal(warnings.some((w) => w.includes('featureId')), false);
});

test('scan-specs: 빈 featureId는 무시하고 경고한다 (fail-open)', () => {
  const { root, done } = withSpecs({
    '021-bad/status.yaml': [
      'id: "021-bad"',
      'title: "잘못된 역방향 연결"',
      'status: planned',
      'featureId: ""',
    ].join('\n'),
  });
  const { features, warnings } = scanSpecs(root);
  done();
  assert.equal(features.length, 1);
  assert.equal(features[0].featureId, undefined);
  assert.ok(warnings.some((w) => w.includes('021-bad') && w.includes('featureId')));
});
