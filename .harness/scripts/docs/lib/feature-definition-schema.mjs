import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const FEATURE_DEFINITION_SCHEMA_PATH = join(
  HERE,
  '..',
  '..',
  '..',
  'config',
  'feature-definition-schema.json',
);

function readSchema() {
  return JSON.parse(readFileSync(FEATURE_DEFINITION_SCHEMA_PATH, 'utf8'));
}

export const FEATURE_DEFINITION_SCHEMA = readSchema();

export const SERVICE_DEFINITION_COLUMNS = FEATURE_DEFINITION_SCHEMA.canonicalFields.map(
  (field) => [field.key, field.label, field.description],
);

export const DEFINITION_TABLE_COLUMNS = FEATURE_DEFINITION_SCHEMA.hubTableColumns.map(
  (column) => [column.header, ...column.fields],
);

// 신형 planning 카탈로그(FeatureDefinition) 항목을 레거시 기능정의 행으로 투영한다.
// 워크스페이스 로더와 루트 data/ 스캐너가 같은 투영을 공유한다.
// 신형 카탈로그 항목(id/title)과 레거시 21필드 행(Row_ID/Title)을 구분한다.
export function isCatalogRecord(row) {
  return Boolean(row)
    && typeof row.id === 'string' && row.id.trim()
    && typeof row.title === 'string' && row.title.trim()
    && row.Row_ID === undefined && row.Title === undefined;
}

export function catalogAsLegacyRows(features) {
  return (features || []).map((feature) => {
    const row = Object.fromEntries(SERVICE_DEFINITION_COLUMNS.map(([key]) => [key, '']));
    row.Row_ID = feature.id;
    row.Title = feature.title;
    row.Actor = feature.actor;
    row.Area = feature.screenIds?.[0] || feature.placements?.[0]?.screenId || '';
    row.Surface = 'Planning';
    row.Phase_Suggestion = feature.priority;
    row.Status = feature.definitionStatus;
    row.Decision_Level = feature.definitionStatus === 'approved' ? '확정' : '검토메모';
    row.Why = feature.summary;
    row.Used_In = [...(feature.screenIds || []), ...(feature.flowIds || [])].join(', ');
    row.Source = 'planning-catalog';
    return row;
  });
}
