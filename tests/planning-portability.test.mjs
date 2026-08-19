import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmp } from './helpers/fixture-base.mjs';

import { compilePlanningDirectory } from '../.harness/scripts/docs/lib/compile-planning-manifest.mjs';
import { scanWorkspaces } from '../.harness/scripts/docs/lib/scan-workspaces.mjs';

const source = new URL('../examples/community-app/planning/', import.meta.url);

test('repository 위치가 달라도 relative source와 stable ID/digest가 유지된다', () => {
  const roots = ['one', 'two'].map((name) => tmp(`planning-${name}-`));
  for (const root of roots) {
    mkdirSync(join(root, 'product', 'planning'), { recursive: true });
    cpSync(source, join(root, 'product', 'planning'), { recursive: true });
    mkdirSync(join(root, 'data'), { recursive: true });
    writeFileSync(join(root, 'data', 'hub-workspaces.json'), JSON.stringify({ version: 1, defaultWorkspaceId: 'product', workspaces: [{ id: 'product', title: 'Product', kind: 'downstream', root: 'product', planningSource: 'planning', source: { repositoryId: 'planning-hub', relativeRoot: 'product' } }] }));
  }
  const manifests = roots.map((root) => compilePlanningDirectory({ planningRoot: join(root, 'product', 'planning'), projectId: 'community-app', sourceRevision: 'portable-rev', generatedAt: '2026-07-16T00:00:00.000Z' }));
  assert.equal(manifests[0].digest, manifests[1].digest);
  assert.deepEqual(manifests[0].features.map((item) => item.id), manifests[1].features.map((item) => item.id));
  const descriptors = roots.map((root) => scanWorkspaces(root, { mode: 'strict' }).workspaces[0].sourceDescriptor);
  assert.deepEqual(descriptors, [{ repositoryId: 'planning-hub', relativeRoot: 'product' }, { repositoryId: 'planning-hub', relativeRoot: 'product' }]);
});
