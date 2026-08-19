import { manifestDigest, verifyManifestDigest } from './canonical-json.mjs';
import { assertContract } from './planning-contracts.mjs';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function compilePlanningManifest({
  projectId,
  manifestVersion = '1.0.0',
  sourceRevision,
  generatedAt = new Date().toISOString(),
  needs = [],
  screens = [],
  features = [],
  featureDetails = [],
  flows = [],
  relations = [],
  decisions = [],
}) {
  const manifest = {
    schemaVersion: 1,
    manifestVersion,
    projectId,
    sourceRevision,
    generatedAt,
    digestAlgorithm: 'sha256',
    digest: '',
    needs,
    screens,
    features,
    featureDetails,
    flows,
    relations,
    decisions,
  };
  manifest.digest = manifestDigest(manifest);
  assertContract('manifest', manifest);
  return manifest;
}

export function assertPlanningManifest(manifest) {
  assertContract('manifest', manifest);
  if (!verifyManifestDigest(manifest)) throw new Error('manifest digest mismatch');
  return manifest;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function flattenScreens(sitemap) {
  const screens = [];
  for (const surface of sitemap.surfaces || []) {
    const walk = (nodes, parentId = null) => {
      for (const node of nodes || []) {
        const { children: _children, ...screen } = node;
        screens.push({ ...screen, surface: surface.key, parentId });
        walk(node.children, node.id);
      }
    };
    walk(surface.nodes);
  }
  return screens;
}

export function compilePlanningDirectory({
  planningRoot,
  projectId,
  manifestVersion = '1.0.0',
  sourceRevision,
  generatedAt = new Date().toISOString(),
}) {
  const sitemap = readJson(join(planningRoot, 'sitemap.json'));
  const flowSource = readJson(join(planningRoot, 'user-flows.json'));
  const relationSource = readJson(join(planningRoot, 'feature-relations.json'));
  return compilePlanningManifest({
    projectId,
    manifestVersion,
    sourceRevision,
    generatedAt,
    needs: readJson(join(planningRoot, 'needs.json')),
    screens: flattenScreens(sitemap),
    features: readJson(join(planningRoot, 'feature-definitions.json')),
    featureDetails: readJson(join(planningRoot, 'feature-details.json')),
    flows: flowSource.flows || [],
    relations: relationSource.links || [],
    decisions: readJson(join(planningRoot, 'decisions.json')),
  });
}

export function writePlanningManifest(path, manifest) {
  assertPlanningManifest(manifest);
  const temporaryPath = `${path}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  renameSync(temporaryPath, path);
  return path;
}
