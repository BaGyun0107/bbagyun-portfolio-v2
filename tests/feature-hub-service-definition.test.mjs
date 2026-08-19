import { tmp } from './helpers/fixture-base.mjs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanServiceDefinition } from '../.harness/scripts/docs/lib/scan-service-definition.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, 'fixtures', 'feature-hub');

function tmpFile(name, content) {
  const dir = tmp('feature-hub-def-');
  const file = join(dir, name);
  writeFileSync(file, content);
  return file;
}

// --- US1: 정상 소스 (contract 표 1·2·7·8행) ---

test('scan-service-definition: 정상 배열 JSON을 기능정의 행으로 추출', () => {
  const result = scanServiceDefinition(join(FIXTURES, 'feature-definitions.valid.json'));

  assert.equal(result.warning, '');
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0].Row_ID, 'ADD-U2-009');
  assert.equal(result.rows[0].Title, '공공 관광정보 기반 지역 콘텐츠 보강');
  assert.equal(result.rows[1].Row_ID, 'ADD-U2-010');
  assert.ok(result.columns.some((column) => column[0] === 'Decision_Question'));
});

test('scan-service-definition: 신형 planning 카탈로그 행은 레거시 열로 투영한다', () => {
  const file = tmpFile('feature-definitions.json', JSON.stringify([
    {
      id: 'FEAT-POST-CREATE', title: '게시물 작성', actor: 'member', priority: 'P1',
      owner: 'product', definitionStatus: 'approved', featureGroupId: 'GROUP-CONTENT',
      summary: '게시물을 작성하고 발행한다.',
      placements: [{ screenId: 'SCREEN-CREATE', role: 'primary' }],
      screenIds: ['SCREEN-CREATE'], flowIds: ['FLOW-PUBLISH'], needIds: ['NEED-1'], detailId: 'FEAT-POST-CREATE',
    },
    { Row_ID: 'LEG-001', Title: '레거시 행 유지', Why: '혼합 입력도 행별로 처리한다.' },
  ]));
  const result = scanServiceDefinition(file);

  assert.equal(result.warning, '');
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0].Row_ID, 'FEAT-POST-CREATE');
  assert.equal(result.rows[0].Title, '게시물 작성');
  assert.equal(result.rows[0].Why, '게시물을 작성하고 발행한다.');
  assert.equal(result.rows[0].Phase_Suggestion, 'P1');
  assert.equal(result.rows[0].Status, 'approved');
  assert.ok(result.rows[0].Used_In.includes('SCREEN-CREATE'));
  assert.ok(result.rows[0].Used_In.includes('FLOW-PUBLISH'));
  assert.equal(result.rows[0].Source, 'planning-catalog');
  assert.equal(result.rows[1].Row_ID, 'LEG-001');
  assert.equal(result.rows[1].Title, '레거시 행 유지');
  assert.equal(result.legacyRowCount, 1);
});

test('scan-service-definition: 카탈로그 전용 입력은 legacyRowCount 0', () => {
  const file = tmpFile('feature-definitions.catalog.json', JSON.stringify([
    { id: 'FEAT-A', title: '카탈로그 A' },
    { id: 'FEAT-B', title: '카탈로그 B' },
  ]));
  const result = scanServiceDefinition(file);
  assert.equal(result.legacyRowCount, 0);
});

test('scan-service-definition: 객체형 {rows:[...]} JSON도 배열과 동일 처리', () => {
  const result = scanServiceDefinition(join(FIXTURES, 'feature-definitions.object.json'));

  assert.equal(result.warning, '');
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].Row_ID, 'OBJ-001');
  assert.equal(result.rows[0].Title, '객체형 소스 첫 행');
});

test('scan-service-definition: 누락 canonical 필드는 빈 문자열, 추가 필드는 무시', () => {
  const file = tmpFile(
    'partial.json',
    JSON.stringify([{ Row_ID: 'P-1', Title: '부분 행', ExtraField: '무시대상' }]),
  );
  const result = scanServiceDefinition(file);

  assert.equal(result.warning, '');
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].Row_ID, 'P-1');
  // 누락된 canonical 필드는 빈 문자열
  assert.equal(result.rows[0].Area, '');
  // 스키마 외 추가 필드는 반환 행에 포함되지 않음
  assert.equal(result.rows[0].ExtraField, undefined);
});

// --- US2: 소스 부재 (contract 표 3행) ---

test('scan-service-definition: 소스 파일이 없어도 빈 모델로 성공', () => {
  const result = scanServiceDefinition('/path/not-found/feature-definitions.json');

  assert.equal(result.rows.length, 0);
  assert.match(result.warning, /not found/i);
  assert.ok(result.columns.length > 0);
});

// --- US3: 손상/구조불일치/빈배열 (contract 표 4·5·6행) ---

test('scan-service-definition: 파싱 불가 JSON은 경고와 함께 빈 rows, 예외 없음', () => {
  const result = scanServiceDefinition(join(FIXTURES, 'feature-definitions.broken.json'));

  assert.equal(result.rows.length, 0);
  assert.match(result.warning, /parse/i);
  assert.ok(result.columns.length > 0);
});

test('scan-service-definition: 배열도 {rows}도 아닌 구조는 경고와 함께 빈 rows', () => {
  const file = tmpFile('bad-shape.json', JSON.stringify({ notRows: 123 }));
  const result = scanServiceDefinition(file);

  assert.equal(result.rows.length, 0);
  assert.notEqual(result.warning, '');
});

test('scan-service-definition: 빈 배열 소스는 정상(경고 없음)', () => {
  const file = tmpFile('empty.json', '[]');
  const result = scanServiceDefinition(file);

  assert.equal(result.rows.length, 0);
  assert.equal(result.warning, '');
});
