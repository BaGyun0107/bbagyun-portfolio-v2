import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import {
  DEFINITION_TABLE_COLUMNS,
  FEATURE_DEFINITION_SCHEMA,
  FEATURE_DEFINITION_SCHEMA_PATH,
  SERVICE_DEFINITION_COLUMNS,
} from '../.harness/scripts/docs/lib/feature-definition-schema.mjs';
import { legacyRowToCatalogCandidate } from '../.harness/scripts/docs/lib/merge-service-definition.mjs';

const root = resolve(import.meta.dirname, '..');
const schemaRelPath = '.harness/config/feature-definition-schema.json';

test('feature-definition schema is the single source for scanner and hub table columns', () => {
  assert.equal(FEATURE_DEFINITION_SCHEMA_PATH, join(root, schemaRelPath));
  assert.equal(FEATURE_DEFINITION_SCHEMA.version, 1);
  assert.ok(FEATURE_DEFINITION_SCHEMA.canonicalFields.length > 0);
  assert.ok(FEATURE_DEFINITION_SCHEMA.hubTableColumns.length > 0);

  assert.deepEqual(
    SERVICE_DEFINITION_COLUMNS,
    FEATURE_DEFINITION_SCHEMA.canonicalFields.map((field) => [
      field.key,
      field.label,
      field.description,
    ]),
  );
  assert.deepEqual(
    DEFINITION_TABLE_COLUMNS,
    FEATURE_DEFINITION_SCHEMA.hubTableColumns.map((column) => [
      column.header,
      ...column.fields,
    ]),
  );
});

test('feature-definition schema keeps the current required contract explicit', () => {
  assert.deepEqual(FEATURE_DEFINITION_SCHEMA.requiredFields, ['Row_ID', 'Title']);
  assert.deepEqual(FEATURE_DEFINITION_SCHEMA.contentFallbackFields, [
    'Why',
    'Change_Summary',
    'Used_In',
  ]);

  const canonicalKeys = new Set(
    FEATURE_DEFINITION_SCHEMA.canonicalFields.map((field) => field.key),
  );
  for (const key of [
    ...FEATURE_DEFINITION_SCHEMA.requiredFields,
    ...FEATURE_DEFINITION_SCHEMA.contentFallbackFields,
  ]) {
    assert.ok(canonicalKeys.has(key), `${key} must be a canonical field`);
  }
  for (const column of FEATURE_DEFINITION_SCHEMA.hubTableColumns) {
    for (const key of column.fields) {
      assert.ok(canonicalKeys.has(key), `${column.header} references unknown ${key}`);
    }
  }
});

test('planning-owned feature definitions do not declare a repository field', () => {
  const canonicalKeys = FEATURE_DEFINITION_SCHEMA.canonicalFields.map(
    (field) => field.key.toLowerCase(),
  );

  assert.equal(canonicalKeys.includes('repository'), false);
  assert.equal(canonicalKeys.includes('repositoryid'), false);
});

test('feature-definition skills point agents to the schema source of truth', () => {
  const schema = readFileSync(join(root, schemaRelPath), 'utf8');
  assert.doesNotThrow(() => JSON.parse(schema));

  for (const skillPath of [
    '.harness/skills/codi-feature-definition-normalizer/SKILL.md',
    '.harness/skills/codi-feature-hub/SKILL.md',
  ]) {
    const skill = readFileSync(join(root, skillPath), 'utf8');
    assert.match(
      skill,
      /\.harness\/config\/feature-definition-schema\.json/,
      `${skillPath} must direct agents to the schema file`,
    );
  }
});

test('doctor requires the feature-definition schema files', () => {
  const doctor = readFileSync(
    join(root, '.harness', 'scripts', 'checks', 'doctor.sh'),
    'utf8',
  );
  assert.match(doctor, /\.harness\/config\/feature-definition-schema\.json/);
  assert.match(doctor, /\.harness\/scripts\/docs\/lib\/feature-definition-schema\.mjs/);
});

test('legacy Phase/Status/Decision은 priority candidate와 provenance로만 보존되고 새 lifecycle로 승격되지 않는다', () => {
  const candidate = legacyRowToCatalogCandidate({
    Row_ID: 'LEGACY-1', Title: '레거시 기능', Actor: '사용자', Phase_Suggestion: 'P1',
    Status: '개정반영', Decision_Level: '확정', Why: '기존 설명', Area: 'SCREEN-HOME',
  });
  assert.equal(candidate.priorityCandidate, 'P1');
  assert.equal(candidate.definitionStatus, undefined);
  assert.deepEqual(candidate.legacy, { status: '개정반영', decisionLevel: '확정' });
  assert.equal(candidate.provenance.certainty, 'inferred');
});
