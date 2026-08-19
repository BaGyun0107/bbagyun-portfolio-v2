// scanServiceDefinition 결과(normalizer 산출물)와 scanSpecs features를 병합한다.
// spec 하나 = 기능정의 1행 자동 파생, id 일치 시 normalizer 우선 + 빈칸 fill-in.
// 반환형은 scanServiceDefinition과 동일해 renderHub가 그대로 소비한다.

// spec status.yaml 필드 → canonical 컬럼 매핑
function specToRow(feature, columns) {
  const row = {};
  for (const [key] of columns) row[key] = '';
  row.Row_ID = feature.id ?? '';
  row.Title = feature.title ?? '';
  row.Surface = feature.surface ?? '';
  row.Phase_Suggestion = feature.phase ?? '';
  row.Status = feature.status ?? '';
  row.Decision_Level = feature.decision_level ?? '';
  row.Source = 'spec';
  return row;
}

export function legacyRowToCatalogCandidate(row = {}) {
  return {
    id: row.Row_ID || '',
    title: row.Title || '',
    summary: row.Why || row.Change_Summary || '',
    actor: row.Actor || '',
    priorityCandidate: row.Phase_Suggestion || '',
    screenCandidates: [row.Area, row.Used_In].filter(Boolean),
    legacy: {
      status: row.Status || '',
      decisionLevel: row.Decision_Level || '',
    },
    provenance: {
      certainty: 'inferred',
      source: row.Source || 'legacy-feature-definition',
    },
  };
}

// normalizer 행이 비워둔 컬럼만 spec 파생값으로 채운다(normalizer 우선).
function fillIn(baseRow, specRow, columns) {
  const merged = { ...baseRow };
  for (const [key] of columns) {
    const cur = merged[key];
    if (cur === undefined || cur === null || cur === '') {
      merged[key] = specRow[key];
    }
  }
  return merged;
}

export function mergeServiceDefinition(normalizerModel, specFeatures) {
  const columns = normalizerModel.columns;
  const byId = new Map();

  // 1) normalizer 행 먼저 (상세 원장)
  for (const r of normalizerModel.rows) {
    const id = r.Row_ID ?? '';
    byId.set(id, { ...r });
  }

  // 2) spec 파생: id 일치면 normalizer 우선 + 빈칸 fill-in, 없으면 새 행
  let derivedCount = 0;
  for (const f of specFeatures ?? []) {
    const specRow = specToRow(f, columns);
    const id = specRow.Row_ID;
    if (byId.has(id)) {
      byId.set(id, fillIn(byId.get(id), specRow, columns));
    } else {
      byId.set(id, specRow);
      derivedCount += 1;
    }
  }

  const rows = [...byId.values()].sort((a, b) =>
    String(a.Row_ID).localeCompare(String(b.Row_ID)),
  );

  // 파생 행이 생겼고 소스 부재 warning이면 지운다.
  // 소스가 있는데 파싱 실패한 warning은 유지한다.
  const sourceMissing = /not found/.test(normalizerModel.warning || '');
  const warning = derivedCount > 0 && sourceMissing ? '' : normalizerModel.warning;

  return { sourcePath: normalizerModel.sourcePath, columns, rows, warning };
}
