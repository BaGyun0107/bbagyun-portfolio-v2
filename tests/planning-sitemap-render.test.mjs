import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPlanningPage } from '../.harness/scripts/docs/lib/render-planning-page.mjs';
import { buildWorkspaceHubModel } from '../.harness/scripts/docs/lib/build-workspace-hub-model.mjs';

// 012: render-hub(은퇴) 대상이던 screen-only 사이트맵 불변식을 현행
// Planning Hub 렌더러로 이식한 테스트.

const screens = {
  version: 1,
  surfaces: [{
    key: 'user',
    title: '사용자 앱',
    nodes: [{ id: 'SCREEN-HOME', title: '홈', directNavigation: ['SCREEN-CREATE'], children: [
      { id: 'SCREEN-FEED', title: '피드' },
      { id: 'SCREEN-CREATE', title: '게시물 작성' },
    ] }],
  }],
};

function html() {
  const workspace = buildWorkspaceHubModel({
    id: 'ws',
    title: 'WS',
    kind: 'downstream',
    badge: '',
    source: { root: '.', planningSource: 'planning', deliverySource: 'downstream', health: 'available' },
    features: [],
    serviceDefinition: { sourcePath: '', columns: [], rows: [], warning: '' },
    sitemap: screens,
  });
  return renderPlanningPage({
    docs: [],
    documents: [],
    features: [],
    serviceDefinition: { rows: [], columns: [] },
    sitemap: screens,
    linkedHub: {
      featureDetails: {},
      linkConflicts: [],
      traceability: { links: [], health: { counts: {} } },
      userFlows: null,
      flowLinks: [],
      screenAssignments: {},
    },
    workspaceHub: { version: 1, defaultWorkspaceId: 'ws', workspaces: [workspace], health: [] },
  });
}

test('사이트맵은 screen node와 hierarchy/direct-navigation legend만 기본 diagram에 노출한다', () => {
  const output = html();
  assert.match(output, /data-screen-id="SCREEN-HOME"/);
  assert.match(output, /data-edge-kind="hierarchy"/);
  assert.match(output, /data-edge-kind="direct-navigation"/);
  assert.match(output, /상하위 구조/);
  assert.match(output, /직접 이동/);
  assert.doesNotMatch(output, /data-screen-id="(?:FEATURE|SPEC|TEST)-/);
});

test('사이트맵 diagram/tree/table은 같은 screen ID와 접근 가능한 탐색 제어를 제공한다', () => {
  const output = html();
  for (const id of ['SCREEN-HOME', 'SCREEN-FEED', 'SCREEN-CREATE']) {
    assert.ok((output.match(new RegExp(id, 'g')) || []).length >= 3, `${id}가 diagram/tree/table에 있어야 한다`);
  }
  assert.match(output, /sitemapSurfaceFilter/);
  assert.match(output, /sitemapScreenSearch/);
  assert.match(output, /data-org-action="zoom-in"/);
  assert.match(output, /data-org-action="fit"/);
  assert.match(output, /role="tree"/);
  assert.match(output, /role="treeitem"/);
});

test('보조 tree는 계층 목록(접근성 보기)로 명명되고 diagram/table과 같은 screen ID를 공유한다', () => {
  const output = html();
  assert.match(output, /계층 목록\(접근성 보기\)/);
  assert.doesNotMatch(output, /키보드 트리/);
  const treeStart = output.indexOf('<ul role="tree"');
  assert.ok(treeStart >= 0);
  const treeSection = output.slice(treeStart, output.indexOf('</ul>', treeStart));
  for (const id of ['SCREEN-HOME', 'SCREEN-FEED', 'SCREEN-CREATE']) {
    assert.match(treeSection, new RegExp(id), `${id}가 계층 목록에 있어야 한다`);
  }
});

test('planning 페이지는 외부 네트워크 참조 없이 자체 완결된다', () => {
  assert.doesNotMatch(html(), /https?:\/\//);
});
