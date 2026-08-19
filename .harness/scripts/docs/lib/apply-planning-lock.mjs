import { renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { assertPlanningManifest } from './compile-planning-manifest.mjs';

export function buildPlanningLock({
  candidateManifest,
  importedAt = new Date().toISOString(),
  sourceRepository,
  sourceRef,
} = {}) {
  return {
    version: 1,
    projectId: candidateManifest.projectId,
    ...(sourceRepository ? { sourceRepository } : {}),
    ...(sourceRef ? { sourceRef } : {}),
    manifestVersion: candidateManifest.manifestVersion,
    schemaVersion: candidateManifest.schemaVersion,
    digest: candidateManifest.digest,
    importedAt,
    appliedState: 'applied',
  };
}

export function applyPlanningLock({
  lockPath,
  candidateManifest,
  expectedProjectId,
  importedAt,
  sourceRepository,
  sourceRef,
  replace = renameSync,
} = {}) {
  assertPlanningManifest(candidateManifest);
  if (candidateManifest.projectId !== expectedProjectId) throw new Error(`candidate projectId ${candidateManifest.projectId} does not match ${expectedProjectId}`);
  const lock = buildPlanningLock({ candidateManifest, importedAt, sourceRepository, sourceRef });
  const temporaryPath = join(dirname(lockPath), `.${lockPath.split('/').pop()}.tmp-${process.pid}-${Date.now()}`);
  try {
    writeFileSync(temporaryPath, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
    replace(temporaryPath, lockPath);
  } catch (error) {
    try { unlinkSync(temporaryPath); } catch {}
    throw error;
  }
  return lock;
}
