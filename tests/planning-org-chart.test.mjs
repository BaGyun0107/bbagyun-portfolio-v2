import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const LAYOUT_MODULE = '../.harness/scripts/docs/lib/layout-sitemap-org-chart.mjs';

async function communitySitemap() {
  return JSON.parse(await readFile(new URL('../examples/community-app/planning/sitemap.json', import.meta.url), 'utf8'));
}

test('조직도 layout은 Community Demo의 screen-only 14개 ID를 결정적으로 배치한다', async () => {
  const { layoutSitemapOrgChart } = await import(LAYOUT_MODULE);
  const sitemap = await communitySitemap();
  const before = structuredClone(sitemap);

  const first = layoutSitemapOrgChart(sitemap);
  const second = layoutSitemapOrgChart(sitemap);

  assert.deepEqual(first, second, '같은 sitemap은 같은 좌표와 edge를 반환해야 한다');
  assert.deepEqual(sitemap, before, 'layout은 입력 sitemap을 수정하지 않아야 한다');
  assert.equal(first.nodes.length, 14);
  assert.deepEqual(
    new Set(first.nodes.map(({ id }) => id)),
    new Set([
      'SCREEN-HOME', 'SCREEN-FEED', 'SCREEN-POST-DETAIL', 'SCREEN-CREATE',
      'SCREEN-PROFILE', 'SCREEN-NOTIFICATIONS', 'SCREEN-SEARCH', 'SCREEN-SETTINGS',
      'ADMIN-HOME', 'ADMIN-MODERATION', 'ADMIN-USERS', 'ADMIN-REPORTS',
      'SCREEN-AUTH', 'SCREEN-HELP',
    ]),
  );
  assert.equal(first.nodes.filter(({ parentId }) => parentId === 'SCREEN-HOME').length, 7);
  assert.equal(first.nodes.filter(({ parentId }) => parentId === 'ADMIN-HOME').length, 3);
  assert.equal(first.nodes.filter(({ parentId }) => parentId === null).length, 4);
  assert.ok(first.nodes.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y)));
  assert.ok(first.width > 0 && first.height > 0);
  assert.deepEqual(first.bounds, {
    minX: Math.min(...first.nodes.map(({ x }) => x)),
    minY: Math.min(...first.nodes.map(({ y }) => y)),
    maxX: Math.max(...first.nodes.map(({ x, width }) => x + width)),
    maxY: Math.max(...first.nodes.map(({ y, height }) => y + height)),
    width: Math.max(...first.nodes.map(({ x, width }) => x + width)) - Math.min(...first.nodes.map(({ x }) => x)),
    height: Math.max(...first.nodes.map(({ y, height }) => y + height)) - Math.min(...first.nodes.map(({ y }) => y)),
  });

  const byId = new Map(first.nodes.map((node) => [node.id, node]));
  const home = byId.get('SCREEN-HOME');
  const homeChildren = first.nodes.filter(({ parentId }) => parentId === 'SCREEN-HOME');
  assert.equal(new Set(homeChildren.map(({ x }) => x)).size, 7, '홈의 1차 주요 영역은 서로 다른 x에 펼쳐져야 한다');
  assert.ok(homeChildren.every(({ y }) => y > home.y), '홈의 1차 주요 영역은 root보다 아래에 있어야 한다');

  const surfaceRootY = new Map();
  for (const rootId of first.roots) {
    const root = byId.get(rootId);
    const values = surfaceRootY.get(root.surface) || [];
    values.push(root.y);
    surfaceRootY.set(root.surface, values);
  }
  assert.ok(Math.max(...surfaceRootY.get('user')) < Math.min(...surfaceRootY.get('admin')));
  assert.ok(Math.max(...surfaceRootY.get('admin')) < Math.min(...surfaceRootY.get('common')));
});

test('조직도 layout은 1차 영역은 좌우로, 더 깊은 화면은 아래로 배치한다', async () => {
  const { layoutSitemapOrgChart } = await import(LAYOUT_MODULE);
  const layout = layoutSitemapOrgChart({ surfaces: [{ key: 'user', title: '사용자', nodes: [{
    id: 'SCREEN-HOME', title: '홈', children: [
      { id: 'SCREEN-A', title: 'A', children: [{ id: 'SCREEN-A-DETAIL', title: 'A 상세' }] },
      { id: 'SCREEN-B', title: 'B' },
    ],
  }] }] });
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));

  assert.notEqual(byId.get('SCREEN-A').x, byId.get('SCREEN-B').x);
  assert.ok(byId.get('SCREEN-A').y > byId.get('SCREEN-HOME').y);
  assert.ok(byId.get('SCREEN-A-DETAIL').y > byId.get('SCREEN-A').y);
});

test('조직도 layout은 hierarchy와 유효한 direct-navigation을 별도 edge layer로 유지한다', async () => {
  const { layoutSitemapOrgChart } = await import(LAYOUT_MODULE);
  const layout = layoutSitemapOrgChart(await communitySitemap());

  assert.equal(layout.hierarchyEdges.length, 10);
  assert.ok(layout.hierarchyEdges.every(({ kind }) => kind === 'hierarchy'));
  assert.ok(layout.directEdges.length > 0);
  assert.ok(layout.directEdges.every(({ kind }) => kind === 'direct-navigation'));
  assert.ok(layout.directEdges.some(({ from, to }) => from === 'SCREEN-HOME' && to === 'SCREEN-CREATE'));
  assert.ok(layout.directEdges.some(({ from, to }) => from === 'SCREEN-SETTINGS' && to === 'SCREEN-AUTH'));
  assert.equal(layout.health.brokenDirectEdges.length, 0);
});

test('조직도 layout은 가짜 root를 만들지 않고 malformed 입력을 fail-open 처리한다', async () => {
  const { layoutSitemapOrgChart } = await import(LAYOUT_MODULE);

  assert.deepEqual(layoutSitemapOrgChart(null).nodes, []);
  assert.deepEqual(layoutSitemapOrgChart({ surfaces: 'broken' }).nodes, []);
  assert.deepEqual(layoutSitemapOrgChart(null).bounds, { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 });

  const layout = layoutSitemapOrgChart({
    surfaces: [{
      key: 'user',
      title: '사용자',
      nodes: [
        { id: 'SCREEN-A', title: 'A', directNavigation: ['MISSING'], children: [{ id: '', title: 'invalid' }] },
        { id: 'SCREEN-A', title: 'duplicate' },
        { id: 'FEATURE-NOT-A-SCREEN', title: '이름만 feature인 실제 screen destination', type: 'page' },
      ],
    }],
  });

  assert.deepEqual(layout.nodes.map(({ id }) => id), ['SCREEN-A', 'FEATURE-NOT-A-SCREEN']);
  assert.deepEqual(layout.roots, ['SCREEN-A', 'FEATURE-NOT-A-SCREEN']);
  assert.deepEqual(layout.health.duplicateIds, ['SCREEN-A']);
  assert.deepEqual(layout.health.brokenDirectEdges, [{ from: 'SCREEN-A', to: 'MISSING' }]);
});
