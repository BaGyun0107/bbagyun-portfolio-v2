import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyManifestDigest } from '../.harness/scripts/docs/lib/canonical-json.mjs';
import { reconcilePlanningDelivery } from '../.harness/scripts/docs/lib/reconcile-planning-delivery.mjs';
import { normalizeFeatureWorkItems } from '../.harness/scripts/docs/lib/normalize-feature-work-items.mjs';

const read = (path) => JSON.parse(readFileSync(new URL(`../examples/community-app/${path}`, import.meta.url), 'utf8'));
const flattenScreens = (nodes = []) => nodes.flatMap((node) => [node, ...flattenScreens(node.children)]);

test('Community Demo는 7 need, 14 screen, 18 feature, 4 flow를 제공한다', () => {
  const needs = read('planning/needs.json');
  const sitemap = read('planning/sitemap.json');
  const features = read('planning/feature-definitions.json');
  const flows = read('planning/user-flows.json');
  assert.equal(needs.length, 7);
  assert.equal(sitemap.surfaces.flatMap((surface) => flattenScreens(surface.nodes)).length, 14);
  assert.equal(features.length, 18);
  assert.equal(flows.flows.length, 4);
  for (const flow of flows.flows) {
    for (const step of flow.steps.filter(({ next }) => Array.isArray(next) && next.length > 1)) {
      assert.equal(typeof step.normalNextId, 'string', `${flow.id}/${step.id} normalNextId`);
      assert.ok(step.next.some(({ to }) => to === step.normalNextId), `${flow.id}/${step.id} normalNextId target`);
      assert.ok(step.next.filter(({ to }) => to !== step.normalNextId).every(({ kind }) => (
        ['decision', 'failure', 'recovery'].includes(kind)
      )), `${flow.id}/${step.id} nonnormal branch kind`);
    }
  }
  assert.equal(new Set(features.map((feature) => feature.id)).size, 18);
  for (const feature of features) {
    assert.match(feature.featureGroupId, /^GROUP-/);
    assert.match(feature.targetReleaseId, /^R\d+$/);
    assert.ok(Array.isArray(feature.placements) && feature.placements.length > 0);
    assert.equal(feature.placements.filter(({ role }) => role === 'primary').length, 1);
    assert.ok(feature.placements.every(({ role }) => ['primary', 'entry', 'result', 'support'].includes(role)));
    assert.deepEqual(
      new Set(feature.placements.map(({ screenId }) => screenId)),
      new Set(feature.screenIds),
    );
  }
});

test('Community Demo는 한 기능에 frontend/backend/qa explicit work items를 제공한다', () => {
  const evidence = read('downstream/delivery-evidence.json');
  const postItems = evidence.workItems.filter(
    ({ featureDefinitionId }) => featureDefinitionId === 'FEAT-POST-CREATE',
  );

  assert.deepEqual(postItems.map(({ id, workType, releaseId, status }) => ({
    id,
    workType,
    releaseId,
    status,
  })), [
    { id: 'WORK-POST-CREATE-FRONTEND', workType: 'frontend', releaseId: 'R1', status: 'planned' },
    { id: 'WORK-POST-CREATE-BACKEND', workType: 'backend', releaseId: 'R1', status: 'in-progress' },
    { id: 'WORK-POST-CREATE-QA', workType: 'qa', releaseId: 'R1', status: 'in-review' },
  ]);
});

test('Community Demo는 모든 기능이 최소 1개의 work item을 갖는다', () => {
  const features = read('planning/feature-definitions.json');
  const evidence = read('downstream/delivery-evidence.json');
  const { items, health } = normalizeFeatureWorkItems({ features, evidence });
  assert.deepEqual(health, []);
  const covered = new Set(items.map(({ featureDefinitionId }) => featureDefinitionId));
  for (const feature of features) {
    assert.ok(covered.has(feature.id), `${feature.id} has no work item`);
  }
  const legacyOnly = items
    .filter(({ source }) => source === 'legacy-delivery-evidence')
    .map(({ featureDefinitionId }) => featureDefinitionId)
    .sort();
  assert.deepEqual(legacyOnly, ['FEAT-POST-DETAIL', 'FEAT-REACTION']);
});

test('Community Demo의 의도적 planning drift와 change proposal은 유지된다', () => {
  const manifest = read('planning/planning-manifest.json');
  const lock = read('downstream/planning.lock.json');
  const evidence = read('downstream/delivery-evidence.json');
  const result = reconcilePlanningDelivery({
    workspaceId: 'community-demo',
    manifest,
    lock,
    evidence,
    generatedAt: evidence.collectedAt,
  });

  assert.equal(result.featureResults.find(({ featureId }) => featureId === 'FEAT-POST-CREATE').status, 'drifted');
  assert.ok(result.proposals.some(({ entity, fieldPath }) => (
    entity.id === 'FEAT-POST-CREATE' && fieldPath === 'rules.imageLimit'
  )));
});

test('Community Demo manifest와 expected health는 반복 검증 가능한 snapshot이다', () => {
  const manifest = read('planning/planning-manifest.json');
  const health = read('expected/health-report.json');
  assert.equal(verifyManifestDigest(manifest), true);
  assert.equal(manifest.needs.length, 7);
  assert.equal(manifest.screens.length, 14);
  assert.equal(manifest.features.length, 18);
  assert.equal(manifest.featureDetails.length, 18);
  assert.equal(manifest.flows.length, 4);
  assert.deepEqual(health.expectedStatuses, ['aligned', 'behind', 'drifted', 'conflicted', 'collection-failed']);
  assert.ok(health.seededCases.some((item) => item.code === 'definition-incomplete'));
  assert.ok(health.seededCases.some((item) => item.code === 'unverified-criterion'));
});
