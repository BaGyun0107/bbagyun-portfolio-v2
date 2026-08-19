import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeServiceDefinition } from '../.harness/scripts/docs/lib/merge-service-definition.mjs';

// normalizerModel: scanServiceDefinition 반환형 { sourcePath, columns, rows, warning }
// specFeatures: scanSpecs features[] 요소 형태
const emptyModel = (warning = '') => ({
  sourcePath: '/x/data/feature-definitions.json',
  columns: [
    ['Row_ID', 'Row ID', ''],
    ['Title', 'Title', ''],
    ['Surface', 'Surface', ''],
    ['Phase_Suggestion', 'Phase', ''],
    ['Status', 'Status', ''],
    ['Decision_Level', '결정 레벨', ''],
    ['Source', 'Source', ''],
  ],
  rows: [],
  warning,
});
const spec = (over) => ({
  id: '001-a',
  title: '기능 A',
  status: 'done',
  phase: 'P1',
  decision_level: '확정',
  surface: 'UserApp',
  ...over,
});

test('spec만 있고 normalizer 없음 → spec 파생 행, warning 비움', () => {
  const out = mergeServiceDefinition(emptyModel('feature definition source not found: /x'), [spec()]);
  assert.equal(out.rows.length, 1);
  const r = out.rows[0];
  assert.equal(r.Row_ID, '001-a');
  assert.equal(r.Title, '기능 A');
  assert.equal(r.Surface, 'UserApp');
  assert.equal(r.Phase_Suggestion, 'P1');
  assert.equal(r.Status, 'done');
  assert.equal(r.Decision_Level, '확정');
  assert.equal(r.Source, 'spec');
  assert.equal(out.warning, '');
});

test('spec 여러 개 → 여러 행, Row_ID 정렬', () => {
  const out = mergeServiceDefinition(emptyModel(), [spec({ id: '005-b' }), spec({ id: '001-a' })]);
  assert.deepEqual(out.rows.map((r) => r.Row_ID), ['001-a', '005-b']);
});

test('normalizer만 있음 → normalizer 행 그대로', () => {
  const model = emptyModel();
  model.rows = [{ Row_ID: 'F-001', Title: '원장행', Surface: 'Admin', Phase_Suggestion: '', Status: '원본기록', Decision_Level: '', Source: '레거시' }];
  const out = mergeServiceDefinition(model, []);
  assert.equal(out.rows.length, 1);
  assert.equal(out.rows[0].Title, '원장행');
});

test('id 일치 → normalizer 우선 + 빈칸만 spec으로 fill-in, 중복 없음', () => {
  const model = emptyModel();
  model.rows = [{ Row_ID: '001-a', Title: '원장제목', Surface: '', Phase_Suggestion: 'P3', Status: '', Decision_Level: '', Source: '' }];
  const out = mergeServiceDefinition(model, [spec()]);
  assert.equal(out.rows.length, 1);
  assert.equal(out.rows[0].Title, '원장제목');
  assert.equal(out.rows[0].Phase_Suggestion, 'P3');
  assert.equal(out.rows[0].Surface, 'UserApp');
  assert.equal(out.rows[0].Status, 'done');
});

test('id 불일치 → 양쪽 다 독립 행', () => {
  const model = emptyModel();
  model.rows = [{ Row_ID: 'F-099', Title: '독립원장', Source: '레거시' }];
  const out = mergeServiceDefinition(model, [spec({ id: '001-a' })]);
  assert.deepEqual(out.rows.map((r) => r.Row_ID).sort(), ['001-a', 'F-099']);
});

test('파싱 실패 normalizer + 정상 spec → spec 파생 행 살아남음, warning 유지', () => {
  const out = mergeServiceDefinition(emptyModel('feature definition source parse failed: X'), [spec()]);
  assert.equal(out.rows.length, 1);
  assert.equal(out.warning, 'feature definition source parse failed: X');
});

test('반환형은 { sourcePath, columns, rows, warning } (렌더러 호환)', () => {
  const model = emptyModel();
  const out = mergeServiceDefinition(model, [spec()]);
  assert.equal(out.sourcePath, model.sourcePath);
  assert.equal(out.columns, model.columns);
  assert.ok(Array.isArray(out.rows));
});
