import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { scanSitemap } from '../.harness/scripts/docs/lib/scan-sitemap.mjs';
import { scanSpecs } from '../.harness/scripts/docs/lib/scan-specs.mjs';
import { scanServiceDefinition } from '../.harness/scripts/docs/lib/scan-service-definition.mjs';
import { mergeServiceDefinition } from '../.harness/scripts/docs/lib/merge-service-definition.mjs';
import { scanTraceability } from '../.harness/scripts/docs/lib/scan-traceability.mjs';
import { scanUserFlows } from '../.harness/scripts/docs/lib/scan-user-flows.mjs';
import { buildLinkedHubModel } from '../.harness/scripts/docs/lib/build-linked-hub-model.mjs';
import { mergeSitemap } from '../.harness/scripts/docs/lib/merge-sitemap.mjs';
import { hasPlanningCatalog, loadPlanningWorkspace } from '../.harness/scripts/docs/lib/build-workspace-hub-model.mjs';
import { scanWorkspaces } from '../.harness/scripts/docs/lib/scan-workspaces.mjs';

const ROOT = join(import.meta.dirname, '..');

// 기대 카운트는 리터럴이 아니라 소스에서 유도한다 — spec 추가마다 숫자를
// 고치는 스냅샷 단언은 사람이 옳은지 판단할 수 없다 (2026-07-31 감사 M-13).
const SPEC_DIR_COUNT = readdirSync(join(ROOT, 'specs'), { withFileTypes: true })
  .filter((e) => e.isDirectory() && /^\d{3}-/.test(e.name)).length;
const RAW_DEFINITIONS = JSON.parse(
  readFileSync(join(ROOT, 'data', 'feature-definitions.json'), 'utf8'),
);
const PLACEMENT_COUNT = RAW_DEFINITIONS.reduce(
  (sum, f) => sum + (f.placements?.length ?? 0),
  0,
);

function flatten(nodes) {
  return (nodes || []).flatMap((node) => [node, ...flatten(node.children)]);
}

function canonicalModel() {
  const { features } = scanSpecs(join(ROOT, 'specs'));
  const normalizer = scanServiceDefinition(join(ROOT, 'data', 'feature-definitions.json'));
  const serviceDefinition = mergeServiceDefinition(normalizer, features);
  const { sitemap } = scanSitemap(ROOT);
  const { traceability, warnings: relationWarnings } = scanTraceability(ROOT);
  const { userFlows, warnings: flowWarnings } = scanUserFlows(ROOT);
  const linked = buildLinkedHubModel({
    features,
    rows: serviceDefinition.rows,
    sitemap,
    traceability,
    userFlows,
  });
  const board = mergeSitemap(sitemap, serviceDefinition.rows, {
    screenAssignments: linked.screenAssignments,
  });
  return {
    features,
    serviceDefinition,
    traceability,
    relationWarnings,
    userFlows,
    flowWarnings,
    linked,
    board,
  };
}

test('actual sitemap은 현재 하네스 화면 17개만 안정적 ID로 선언한다', () => {
  const { sitemap, warnings } = scanSitemap(ROOT);
  assert.deepEqual(warnings, []);
  assert.ok(sitemap);
  const nodes = sitemap.surfaces.flatMap((surface) => flatten(surface.nodes));
  assert.equal(nodes.length, 17);
  assert.deepEqual(sitemap.surfaces.map((surface) => surface.key), ['user', 'admin', 'common']);
  assert.deepEqual(
    nodes.map((node) => node.id),
    [
      'HUB-ROOT', 'HUB-GUIDE', 'HUB-PROJECT', 'HUB-DEFINITIONS',
      'HUB-DEFINITIONS-RELATION', 'HUB-DEFINITIONS-SITEMAP',
      'HUB-DEFINITIONS-TABLE', 'HUB-DEFINITIONS-FLOW',
      'HUB-DEFINITIONS-DETAIL', 'HUB-STATUS', 'HUB-STATUS-BOARD',
      'HUB-STATUS-SPEC', 'HUB-STATUS-DELIVERY', 'HUB-C-SEARCH',
      'HUB-C-DETAIL', 'HUB-C-EMPTY', 'HUB-C-HEALTH',
    ],
  );
  assert.equal(sitemap.surfaces.find((surface) => surface.key === 'admin').nodes.length, 0);
});

test('범용 샘플은 actual sitemap에서 제거되고 contract 예시는 보존된다', () => {
  const actual = readFileSync(join(ROOT, 'data', 'sitemap.json'), 'utf8');
  const sample = readFileSync(
    join(ROOT, 'specs', '007-sitemap-board', 'contracts', 'sample-sitemap.json'),
    'utf8',
  );
  assert.doesNotMatch(actual, /회원\/온보딩|투어\/미션|운영 대시보드/);
  assert.match(sample, /사용자 앱/);
});

test('하네스 카탈로그: harness-internal이 planning 경로로 로드되고 spec 현황이 투영된다', () => {
  const descriptor = scanWorkspaces(ROOT).workspaces.find(({ id }) => id === 'harness-internal');
  assert.ok(descriptor, 'harness-internal workspace missing');
  assert.equal(hasPlanningCatalog(descriptor), true);

  const workspace = loadPlanningWorkspace(descriptor);
  assert.equal(workspace.source.health, 'available');
  assert.equal(workspace.features.length, RAW_DEFINITIONS.length);
  assert.equal(workspace.features.length, SPEC_DIR_COUNT, 'specs 디렉터리와 카탈로그가 어긋난다');
  assert.ok(workspace.features.every((feature) => feature.placements.length > 0));
  const specItems = workspace.featureWorkItems.filter(({ source }) => source === 'spec-scan');
  assert.equal(specItems.length, SPEC_DIR_COUNT);
  // D-3 (2026-08-03): 하네스 워크스페이스는 카탈로그-only 로 확정 —
  // detailId 미선언은 정상 상태라 상세-누락 경고가 없어야 한다.
  assert.ok(
    !workspace.health.some(({ code }) => code === 'feature-detail-missing'),
    '카탈로그-only 확정 후에도 feature-detail-missing 경고가 남아 있다',
  );
  const backfill = workspace.decisions.find(({ id }) => id === 'DEC-HARNESS-DETAIL-BACKFILL');
  assert.ok(backfill, '결정 기록 자체는 보존돼야 한다');
  assert.equal(backfill.status, 'resolved');
  const rawDefinitions = JSON.parse(
    readFileSync(join(ROOT, 'data', 'feature-definitions.json'), 'utf8'),
  );
  assert.ok(
    rawDefinitions.every((f) => f.detailId === undefined),
    'detailId 는 D-3 결정으로 전부 제거돼야 한다',
  );
});

test('전 기능은 need·screen·spec과 연결되고 relation health가 깨끗하다', () => {
  const model = canonicalModel();
  // 상호 일치 불변식 — 절대 카운트는 specs 디렉터리 수에서 유도 (M-13).
  const featureCount = SPEC_DIR_COUNT;
  assert.equal(model.features.length, featureCount);
  assert.equal(model.serviceDefinition.rows.length, featureCount);
  assert.deepEqual(model.relationWarnings, []);
  assert.equal(model.traceability.entities.length, featureCount);
  const dependsOnCount = model.features.reduce(
    (sum, f) => sum + (f.depends_on?.length ?? 0),
    0,
  );
  const expectedByType = {
    // 기능마다 need 1건·spec 1건·verification 1건이 카탈로그 계약이다.
    'satisfied-by': featureCount,
    'specified-by': featureCount,
    'depends-on': dependsOnCount,
    'verified-by': featureCount,
    'appears-on': PLACEMENT_COUNT,
  };
  assert.deepEqual(
    Object.fromEntries(
      ['satisfied-by', 'specified-by', 'depends-on', 'verified-by', 'appears-on']
        .map((type) => [type, model.traceability.links.filter((link) => link.type === type).length]),
    ),
    expectedByType,
  );
  assert.equal(
    model.traceability.links.length,
    Object.values(expectedByType).reduce((a, b) => a + b, 0),
    '링크 총수가 타입별 합과 다르다 — 미분류 링크 타입 존재',
  );
  assert.equal(model.board.unassignedCount, 0);
  assert.equal(model.linked.traceability.health.counts.broken, 0);
  assert.equal(model.linked.traceability.health.counts.duplicate, 0);
  assert.equal(model.linked.traceability.health.counts.orphan, 0);
  for (const link of model.traceability.links) assert.ok(link.evidence);
  const expectedDependencies = model.features
    .flatMap((feature) => feature.depends_on.map((dependency) => `${feature.id}->${dependency}`))
    .sort();
  const actualDependencies = model.traceability.links
    .filter((link) => link.type === 'depends-on')
    .map((link) => `${link.from.id}->${link.to.id}`)
    .sort();
  assert.deepEqual(actualDependencies, expectedDependencies);
  const expectedVerifications = model.features
    .filter((feature) => feature.delivery.verification.recorded)
    .map((feature) => `${feature.id}->${feature.id}`)
    .sort();
  const actualVerifications = model.traceability.links
    .filter((link) => link.type === 'verified-by')
    .map((link) => `${link.from.id}->${link.to.id}`)
    .sort();
  assert.deepEqual(actualVerifications, expectedVerifications);
  for (const link of model.traceability.links.filter((item) => item.evidence.startsWith('inferred:'))) {
    assert.equal(link.label, 'inferred — PM/PL review · approved 2026-07-16');
  }
});

test('세 core flow는 목표·종료·복구 경로와 유효한 feature/screen 연결을 가진다', () => {
  const model = canonicalModel();
  assert.ok(model.userFlows);
  assert.deepEqual(
    model.userFlows.flows.map((flow) => flow.id),
    ['FLOW-ONBOARD', 'FLOW-FEATURE-DELIVERY', 'FLOW-HARNESS-DELIVERY'],
  );
  for (const flow of model.userFlows.flows) {
    assert.ok(flow.actor);
    assert.ok(flow.goal);
    assert.ok(flow.steps.some((step) => step.kind === 'start'));
    assert.ok(flow.steps.some((step) => step.kind === 'decision'));
    assert.ok(flow.steps.some((step) => step.kind === 'end'));
  }
  assert.deepEqual(model.flowWarnings, []);
  assert.equal(model.linked.traceability.health.counts.flowBroken, 0);
  assert.equal(model.linked.traceability.health.counts.flowCycle, 0);
  assert.ok(model.linked.flowLinks.length > 0);
});
