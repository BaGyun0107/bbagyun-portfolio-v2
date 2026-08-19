// registry(선택) + scan-specs 결과 병합 (data-model 병합 규칙, FR-012~015).
// spec 우선, spec_link 자동 연결, id 기준 정렬.

export function mergeRegistry(specFeatures, registry) {
  const byId = new Map();

  // registry 항목 먼저(있으면). spec이 나중에 덮어쓴다.
  const regFeatures = registry && Array.isArray(registry.features) ? registry.features : [];
  for (const r of regFeatures) {
    byId.set(r.id, { ...r });
  }

  // spec 우선: 같은 id면 덮어쓰고 spec_link를 보장한다.
  for (const s of specFeatures) {
    const spec_link = s.spec_link ?? `specs/${s.id}`;
    byId.set(s.id, { ...byId.get(s.id), ...s, spec_link });
  }

  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}
