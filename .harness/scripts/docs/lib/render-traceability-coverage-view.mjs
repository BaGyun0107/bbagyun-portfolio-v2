// 추적성 coverage/gap/bounded neighborhood 화면 renderer.
// coverage 요약과 누락 작업함이 기본이고 전체 matrix/CSV는 접힌 보조 진단이다.

import { buildTraceabilityCoverage } from './build-traceability-coverage.mjs';

const NEIGHBORHOOD_KINDS = [
  ['need', '요구'],
  ['screen', '화면'],
  ['flow', '사용자 흐름'],
  ['spec', 'Spec'],
  ['work-item', '구현 작업'],
  ['verification', '검증'],
];

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function renderSummary(summary) {
  return `<section class="traceability-coverage" data-traceability-coverage aria-label="추적성 coverage 요약">
    <article><b>전체 기능</b><strong>${summary.total}</strong></article>
    <article><b>완결</b><strong>${summary.complete}</strong><p>요구·화면·흐름·Spec·근거가 모두 연결된 기능</p></article>
    <article><b>근거 누락</b><strong>${summary.evidenceMissing}</strong><p>구현·검증 근거가 없는 기능</p></article>
    <article><b>깨진 관계</b><strong>${summary.broken}</strong><p>endpoint가 없는 관계 링크</p></article>
  </section>`;
}

function renderGapQueue(gaps) {
  if (gaps.length === 0) {
    return '<section class="traceability-gap-queue" data-traceability-gap-queue><p role="status">열린 누락이 없습니다.</p></section>';
  }
  const items = gaps.map((gap) => {
    const heading = `<span class="gap-severity" data-severity="${esc(gap.severity)}">${esc(gap.severity)}</span><b>${esc(gap.type)}</b>`;
    const body = `<small>${esc(gap.featureTitle ? `${gap.featureTitle} · ` : '')}${esc(gap.message)}</small><span class="gap-action">행동: ${esc(gap.action)}</span>`;
    if (gap.featureId) {
      return `<li><button type="button" data-gap-select="${esc(gap.featureId)}" aria-pressed="false">${heading}${body}</button></li>`;
    }
    return `<li class="gap-static">${heading}${body}</li>`;
  }).join('');
  return `<section class="traceability-gap-queue" data-traceability-gap-queue aria-label="누락 작업함"><h3>누락 작업함</h3><ol>${items}</ol></section>`;
}

export function renderNeighborhoodBody(neighborhood) {
  const nodes = safeArray(neighborhood?.nodes);
  const feature = nodes.find((node) => node.type === 'feature');
  if (!feature) {
    return '<p>기능을 선택하면 요구·화면·흐름·Spec·구현 작업·검증의 국소 관계를 표시합니다.</p>';
  }
  const groups = NEIGHBORHOOD_KINDS.map(([kind, label]) => {
    const members = nodes.filter((node) => node.type === kind);
    const list = members.length
      ? `<ul>${members.map((node) => `<li><code>${esc(node.id)}</code> ${esc(node.title || '')}</li>`).join('')}</ul>`
      : '<p class="empty-value">연결 없음</p>';
    return `<div data-neighborhood-kind="${kind}"><h4>${label}</h4>${list}</div>`;
  }).join('');
  return `<header><code>${esc(feature.id)}</code><h3>${esc(feature.title || feature.id)}</h3></header><div class="neighborhood-grid">${groups}</div>`;
}

function renderMatrix(matrixRows) {
  const rows = matrixRows.map((row) => `<tr><th scope="row">${esc(row.featureId)} · ${esc(row.title)}</th><td>${esc(row.needIds.join(', ') || '-')}</td><td>${esc(row.screenIds.join(', ') || '-')}</td><td>${esc(row.flowIds.join(', ') || '-')}</td><td>${esc(row.specIds.join(', ') || '-')}</td><td>${esc(row.workItemIds.join(', ') || '-')}</td></tr>`).join('');
  return `<details class="planning-alternative" data-traceability-matrix><summary>전체 매트릭스 (보조 진단)</summary><div class="planning-table-wrap"><table><thead><tr><th>기능</th><th>요구</th><th>화면</th><th>흐름</th><th>Spec</th><th>구현 작업</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
}

function renderCsv(csv) {
  return `<details class="planning-alternative" data-traceability-csv><summary>CSV export (보조 진단)</summary><textarea readonly rows="6" aria-label="추적성 CSV">${esc(csv)}</textarea></details>`;
}

export function renderTraceabilityCoverageView({ workspace = {}, selectedFeatureId = null } = {}) {
  const features = safeArray(workspace?.features);
  if (features.length === 0) {
    return '<div class="planning-empty"><b>추적성 대상 미수집</b><p>기능 catalog와 관계 원본을 연결하세요.</p></div>';
  }
  const coverage = buildTraceabilityCoverage(workspace, { selectedFeatureId });
  return `${renderSummary(coverage.summary)}
${renderGapQueue(coverage.gaps)}
<section class="traceability-neighborhood-shell" aria-label="선택 기능 국소 관계"><h3>선택 기능 국소 관계</h3><div class="traceability-neighborhood" data-traceability-neighborhood aria-live="polite">${renderNeighborhoodBody(coverage.neighborhood)}</div></section>
${renderMatrix(coverage.matrixRows)}
${renderCsv(coverage.csv)}`;
}
