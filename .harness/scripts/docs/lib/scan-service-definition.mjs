// 정규화된 기능정의 산출물(data/feature-definitions.json)을 읽어 기능정의 행으로
// 정규화한다. 소스가 없거나 손상돼도 docs:build가 계속 성공하도록 빈 모델을 반환한다.
// 소스 형태는 배열 `[...]` 또는 객체 `{ rows: [...] }` 둘 다 허용한다.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SERVICE_DEFINITION_COLUMNS, catalogAsLegacyRows, isCatalogRecord } from './feature-definition-schema.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// 저장소 루트 = 이 파일 기준 ../../../.. (.harness/scripts/docs/lib/)
const REPO_ROOT = join(HERE, '..', '..', '..', '..');
export const DEFAULT_FEATURE_DEFINITION_PATH = join(REPO_ROOT, 'data', 'feature-definitions.json');
export { SERVICE_DEFINITION_COLUMNS };

function emptyModel(sourcePath, warning) {
  return { sourcePath: sourcePath || '', columns: SERVICE_DEFINITION_COLUMNS, rows: [], warning, legacyRowCount: 0 };
}

// legacy(Row_ID형) 행은 신규 작성 계약이 아니다(012) — 수용은 유지하되
// legacyRowCount로 노출해 빌드가 카탈로그 변환을 안내한다.
function normalizeRows(rawRows) {
  let legacyRowCount = 0;
  const rows = rawRows.map((row) => {
    if (isCatalogRecord(row)) return catalogAsLegacyRows([row])[0];
    legacyRowCount += 1;
    const normalized = {};
    for (const [key] of SERVICE_DEFINITION_COLUMNS) {
      normalized[key] = row?.[key] ?? '';
    }
    return normalized;
  });
  return { rows, legacyRowCount };
}

export function scanServiceDefinition(path = DEFAULT_FEATURE_DEFINITION_PATH) {
  if (!path || !existsSync(path)) {
    return emptyModel(path, path ? `feature definition source not found: ${path}` : '');
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    return emptyModel(path, `feature definition source parse failed: ${error.message}`);
  }

  let rawRows;
  if (Array.isArray(parsed)) {
    rawRows = parsed;
  } else if (parsed && Array.isArray(parsed.rows)) {
    rawRows = parsed.rows;
  } else {
    return emptyModel(path, `feature definition source has unexpected shape: ${path}`);
  }

  const { rows, legacyRowCount } = normalizeRows(rawRows);
  return {
    sourcePath: path,
    columns: SERVICE_DEFINITION_COLUMNS,
    rows,
    warning: '',
    legacyRowCount,
  };
}
