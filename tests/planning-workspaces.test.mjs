import { tmp } from './helpers/fixture-base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const modulePath = '../.harness/scripts/docs/lib/scan-workspaces.mjs';
const workspaceModelPath = '../.harness/scripts/docs/lib/build-workspace-hub-model.mjs';

test('workspace config가 없으면 actual-project 하나만 기본값으로 사용한다', async () => {
  const { scanWorkspaces } = await import(modulePath);
  const root = tmp('planning-workspace-');
  const result = scanWorkspaces(root);
  assert.equal(result.defaultWorkspaceId, 'actual-project');
  assert.deepEqual(result.workspaces.map(({ id, kind }) => ({ id, kind })), [
    { id: 'actual-project', kind: 'downstream' },
  ]);
  assert.equal(result.workspaces.some((workspace) => workspace.kind === 'demo'), false);
});

test('workspace root는 저장소 밖으로 탈출할 수 없다', async () => {
  const { scanWorkspaces } = await import(modulePath);
  const root = tmp('planning-workspace-');
  mkdirSync(join(root, 'data'));
  writeFileSync(join(root, 'data', 'hub-workspaces.json'), JSON.stringify({
    version: 1,
    defaultWorkspaceId: 'escape',
    workspaces: [{ id: 'escape', title: 'Escape', kind: 'downstream', root: '../../outside' }],
  }));
  const result = scanWorkspaces(root, { mode: 'preview' });
  assert.equal(result.workspaces.length, 0);
  assert.match(result.health.map((issue) => issue.message).join('\n'), /outside|root|relative/);
});

test('invalid actual source는 demo로 대체되지 않는다', async () => {
  const { scanWorkspaces } = await import(modulePath);
  const root = tmp('planning-workspace-');
  mkdirSync(join(root, 'data'));
  writeFileSync(join(root, 'data', 'hub-workspaces.json'), '{ invalid');
  const result = scanWorkspaces(root, { mode: 'preview' });
  assert.equal(result.defaultWorkspaceId, 'actual-project');
  assert.equal(result.workspaces.some((workspace) => workspace.kind === 'demo'), false);
  assert.ok(result.health.length > 0);
});

test('harness preview config는 Community Demo를 명시적 기본값으로 선언한다', async () => {
  const { scanWorkspaces } = await import(modulePath);
  const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
  const result = scanWorkspaces(root);
  assert.equal(result.defaultWorkspaceId, 'community-demo');
  assert.equal(result.workspaces.find(({ id }) => id === 'community-demo').badge, 'DEMO DATA');
  assert.ok(result.workspaces.some(({ id }) => id === 'harness-internal'));
});

test('Community Demo workspace는 explicit work items와 feature rollup을 함께 제공한다', async () => {
  const { scanWorkspaces } = await import(modulePath);
  const { loadPlanningWorkspace } = await import(workspaceModelPath);
  const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
  const descriptor = scanWorkspaces(root).workspaces.find(({ id }) => id === 'community-demo');

  const workspace = loadPlanningWorkspace(descriptor);
  const postItems = workspace.featureWorkItems.filter(
    ({ featureDefinitionId }) => featureDefinitionId === 'FEAT-POST-CREATE',
  );

  assert.ok(Array.isArray(workspace.workItemHealth));
  assert.deepEqual(
    workspace.health.filter(({ code }) => code.startsWith('work-item') || code.startsWith('legacy-feature')),
    workspace.workItemHealth,
  );
  assert.deepEqual(postItems.map(({ workType, releaseId, status }) => ({
    workType,
    releaseId,
    status,
  })), [
    { workType: 'frontend', releaseId: 'R1', status: 'planned' },
    { workType: 'backend', releaseId: 'R1', status: 'in-progress' },
    { workType: 'qa', releaseId: 'R1', status: 'in-review' },
  ]);
  assert.deepEqual(workspace.featureRollups['FEAT-POST-CREATE'], {
    featureDefinitionId: 'FEAT-POST-CREATE',
    releaseId: null,
    status: 'in-progress',
    counts: {
      planned: 1,
      'in-progress': 1,
      'in-review': 1,
      done: 0,
      onHold: 0,
      total: 3,
    },
    blockedDoneCount: 0,
    health: [],
    invalidItemCount: 0,
  });
});

test('legacy feature evidence는 stable unspecified/unassigned work item으로 투영한다', async () => {
  const { loadPlanningWorkspace } = await import(workspaceModelPath);
  const root = tmp('planning-workspace-legacy-');
  mkdirSync(join(root, 'planning'));
  mkdirSync(join(root, 'downstream'));
  writeFileSync(join(root, 'planning', 'feature-definitions.json'), JSON.stringify([
    { id: 'FEAT-LEGACY', title: 'Legacy feature' },
  ]));
  writeFileSync(join(root, 'downstream', 'delivery-evidence.json'), JSON.stringify({
    features: [{ featureId: 'FEAT-LEGACY', deliveryStatus: 'in-progress' }],
  }));

  const workspace = loadPlanningWorkspace({
    id: 'legacy',
    title: 'Legacy',
    kind: 'downstream',
    root: '.',
    rootPath: root,
    planningSource: 'planning',
    deliverySource: 'downstream',
  });

  assert.deepEqual(workspace.workItemHealth, []);
  assert.deepEqual(workspace.featureWorkItems, [{
    id: 'WORK-FEAT-LEGACY-LEGACY',
    featureDefinitionId: 'FEAT-LEGACY',
    title: 'Legacy feature',
    workType: 'unspecified',
    releaseId: 'unassigned',
    status: 'in-progress',
    taskRefs: [],
    evidenceRefs: [],
    source: 'legacy-delivery-evidence',
  }]);
});

test('상세 기대는 detailId 명시 선언 시에만 — 미선언은 카탈로그-only 정상 상태다', async () => {
  // 2026-08-03 D-3(DEC-HARNESS-DETAIL-BACKFILL 종결): detailId 를 선언하지
  // 않은 기능은 카탈로그-only 운영으로 보고 경고하지 않는다. 선언했는데
  // 상세가 없을 때만 advisory 가 남는다.
  const { loadPlanningWorkspace } = await import(workspaceModelPath);
  const root = tmp('planning-workspace-advisory-');
  mkdirSync(join(root, 'planning'));
  mkdirSync(join(root, 'downstream'));
  writeFileSync(join(root, 'planning', 'feature-definitions.json'), JSON.stringify([
    { id: '001-sample', title: '상세 없는 기능(미선언)', definitionStatus: 'draft' },
    {
      id: '002-declared',
      title: '상세를 선언했지만 없는 기능',
      definitionStatus: 'draft',
      detailId: '002-declared',
    },
  ]));

  const workspace = loadPlanningWorkspace({
    id: 'advisory',
    title: 'Advisory',
    kind: 'downstream',
    root: '.',
    rootPath: root,
    planningSource: 'planning',
    deliverySource: 'downstream',
  });

  assert.equal(workspace.source.health, 'available');
  const detailWarnings = workspace.health.filter(
    ({ code }) => code === 'feature-detail-missing',
  );
  assert.deepEqual(
    detailWarnings.map(({ featureId }) => featureId),
    ['002-declared'],
    '미선언(001)은 경고 없음, 선언(002)만 경고여야 한다',
  );
});

test('원본 파싱 실패는 여전히 source invalid다 (advisory 분리 후 회귀 방지)', async () => {
  const { loadPlanningWorkspace } = await import(workspaceModelPath);
  const root = tmp('planning-workspace-invalid-');
  mkdirSync(join(root, 'planning'));
  writeFileSync(join(root, 'planning', 'feature-definitions.json'), '{{{ broken');

  const workspace = loadPlanningWorkspace({
    id: 'broken',
    title: 'Broken',
    kind: 'downstream',
    root: '.',
    rootPath: root,
    planningSource: 'planning',
    deliverySource: 'downstream',
  });

  assert.equal(workspace.source.health, 'invalid');
});

test('workspace 경로에서 needs.json과 spec 검증이 registry에 등록되어 typed 관계가 깨지지 않는다', async () => {
  const { loadPlanningWorkspace } = await import(workspaceModelPath);
  const root = tmp('planning-workspace-typed-');
  mkdirSync(join(root, 'planning'));
  mkdirSync(join(root, 'specs', '001-x'), { recursive: true });
  writeFileSync(join(root, 'planning', 'feature-definitions.json'), JSON.stringify([
    { id: '001-x', title: '기능 X', definitionStatus: 'draft' },
  ]));
  writeFileSync(join(root, 'planning', 'needs.json'), JSON.stringify([
    { id: 'NEED-X', title: '요구 X' },
  ]));
  writeFileSync(join(root, 'planning', 'feature-relations.json'), JSON.stringify({
    version: 1,
    entities: [],
    links: [
      { from: { type: 'need', id: 'NEED-X' }, to: { type: 'feature', id: '001-x' }, type: 'satisfied-by', evidence: 'confirmed: test' },
      { from: { type: 'feature', id: '001-x' }, to: { type: 'verification', id: '001-x' }, type: 'verified-by', evidence: 'confirmed: test' },
    ],
  }));
  writeFileSync(join(root, 'specs', '001-x', 'status.yaml'), [
    'id: "001-x"', 'title: "기능 X"', 'status: done',
  ].join('\n'));
  writeFileSync(join(root, 'specs', '001-x', 'verification.md'), '- [x] 검증 완료\n');

  const workspace = loadPlanningWorkspace({
    id: 'typed',
    title: 'Typed',
    kind: 'downstream',
    root: '.',
    rootPath: root,
    planningSource: 'planning',
    deliverySource: 'specs',
  });

  assert.deepEqual(workspace.linkedHub.traceability.health.brokenLinks, []);
});

test('late planning source parse 실패는 workspace와 source health에 모두 반영한다', async () => {
  const { loadPlanningWorkspace } = await import(workspaceModelPath);
  const root = tmp('planning-workspace-late-health-');
  mkdirSync(join(root, 'planning'));
  mkdirSync(join(root, 'downstream'));
  writeFileSync(join(root, 'planning', 'feature-definitions.json'), '[]');
  writeFileSync(join(root, 'planning', 'feature-details.json'), '[]');
  writeFileSync(join(root, 'planning', 'sitemap.json'), '{ invalid');

  const workspace = loadPlanningWorkspace({
    id: 'late-health',
    title: 'Late health',
    kind: 'downstream',
    root: '.',
    rootPath: root,
    planningSource: 'planning',
    deliverySource: 'downstream',
  });

  assert.ok(workspace.health.some(({ code, source }) => (
    code === 'workspace-source-invalid' && source.endsWith('/planning/sitemap.json')
  )));
  assert.equal(workspace.source.health, 'invalid');
  assert.deepEqual(workspace.source, {
    root: '.',
    planningSource: 'planning',
    deliverySource: 'downstream',
    health: 'invalid',
  });
});
