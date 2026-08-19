import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseYamlLite } from '../.harness/scripts/docs/lib/yaml-lite.mjs';

test('yaml-lite: 스칼라 key: value 파싱', () => {
  const { data } = parseYamlLite('id: "003-sample"\nphase: P1\n');
  assert.equal(data.id, '003-sample');
  assert.equal(data.phase, 'P1');
});

test('yaml-lite: 따옴표 없는 값과 있는 값 모두 처리', () => {
  const { data } = parseYamlLite('title: 샘플 기능\nstatus: in-progress\n');
  assert.equal(data.title, '샘플 기능');
  assert.equal(data.status, 'in-progress');
});

test('yaml-lite: 인라인 리스트 [a, b] 파싱', () => {
  const { data } = parseYamlLite('owner_roles: [frontend, backend]\n');
  assert.deepEqual(data.owner_roles, ['frontend', 'backend']);
});

test('yaml-lite: 빈 인라인 리스트 []', () => {
  const { data } = parseYamlLite('depends_on: []\n');
  assert.deepEqual(data.depends_on, []);
});

test('yaml-lite: history 블록 리스트 - { at, to } 파싱', () => {
  const src = 'history:\n  - { at: "2026-07-08", to: in-progress }\n  - { at: "2026-07-09", to: done }\n';
  const { data } = parseYamlLite(src);
  assert.deepEqual(data.history, [
    { at: '2026-07-08', to: 'in-progress' },
    { at: '2026-07-09', to: 'done' },
  ]);
});

test('yaml-lite: 전체 status.yaml 통합 파싱', () => {
  const src = [
    'id: "003-sample"',
    'title: 샘플',
    'phase: P1',
    'status: in-progress',
    'owner_roles: [frontend, backend]',
    'depends_on: ["002-feature-hub"]',
    'history:',
    '  - { at: "2026-07-08", to: in-progress }',
    '',
  ].join('\n');
  const { data } = parseYamlLite(src);
  assert.equal(data.id, '003-sample');
  assert.deepEqual(data.owner_roles, ['frontend', 'backend']);
  assert.deepEqual(data.depends_on, ['002-feature-hub']);
  assert.equal(data.history.length, 1);
});

test('yaml-lite: 주석과 빈 줄 무시', () => {
  const { data } = parseYamlLite('# 주석\n\nid: x\n');
  assert.equal(data.id, 'x');
  assert.equal(Object.keys(data).length, 1);
});

test('yaml-lite: 허용 밖 구조는 warnings에 담기고 스로우하지 않음', () => {
  const { data, warnings } = parseYamlLite('  깊은들여쓰기없는이상한줄\nid: y\n');
  assert.equal(data.id, 'y');
  assert.ok(warnings.length >= 1);
});
