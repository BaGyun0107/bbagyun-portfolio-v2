import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertContract, resolveSafePath, validateContract, validateSourceDescriptor } from './planning-contracts.mjs';

function actualProject(root, health = []) {
  return {
    version: 1,
    defaultWorkspaceId: 'actual-project',
    workspaces: [{
      id: 'actual-project',
      title: 'Actual Project',
      kind: 'downstream',
      root: '.',
      rootPath: root,
      sourceHealth: health.length === 0 ? 'available' : 'invalid',
    }],
    health,
    configured: false,
  };
}

export function scanWorkspaces(root, { mode = 'preview', configPath = join(root, 'data', 'hub-workspaces.json') } = {}) {
  if (!existsSync(configPath)) return actualProject(root);
  let config;
  try {
    config = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (error) {
    if (mode === 'strict') throw new Error(`workspace config parse failed: ${error.message}`);
    return actualProject(root, [{ code: 'workspace-config-invalid', message: `workspace config parse failed: ${error.message}`, action: 'data/hub-workspaces.json을 수정하세요.' }]);
  }

  const validation = validateContract('workspace', config, { mode });
  if (!validation.valid && mode === 'strict') assertContract('workspace', config);
  const health = validation.errors.map((message) => ({ code: 'workspace-config-invalid', message, action: 'workspace 구성을 수정하세요.' }));
  const workspaces = [];
  for (const workspace of config.workspaces || []) {
    try {
      const rootPath = resolveSafePath(root, workspace.root);
      const sourceDescriptor = validateSourceDescriptor(root, workspace.source || { repositoryId: 'current-repository', relativeRoot: workspace.root });
      workspaces.push({ ...workspace, rootPath, sourceDescriptor, sourceHealth: 'available' });
    } catch (error) {
      if (mode === 'strict') throw error;
      health.push({ code: 'workspace-root-unsafe', workspaceId: workspace.id, message: error.message, action: 'repository-relative root를 사용하세요.' });
    }
  }
  if (validation.errors.length > 0 && workspaces.length === 0) {
    return { ...actualProject(root, health), configured: true };
  }
  const defaultWorkspaceId = workspaces.some(({ id }) => id === config.defaultWorkspaceId)
    ? config.defaultWorkspaceId
    : workspaces[0]?.id || 'actual-project';
  return { version: 1, defaultWorkspaceId, workspaces, health, configured: true };
}
