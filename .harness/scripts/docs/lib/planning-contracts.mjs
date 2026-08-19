import { isAbsolute, relative, resolve, sep } from 'node:path';

const DIGEST = /^sha256:[a-f0-9]{64}$/;
const SEMVER = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

function required(value, fields, errors, prefix = '') {
  for (const field of fields) {
    if (value?.[field] === undefined || value?.[field] === null || value?.[field] === '') {
      errors.push(`${prefix}${field} is required`);
    }
  }
}

function array(value, field, errors) {
  if (!Array.isArray(value?.[field])) errors.push(`${field} must be an array`);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validateWorkspace(value, errors) {
  required(value, ['version', 'defaultWorkspaceId', 'workspaces'], errors);
  if (value?.version !== 1) errors.push('version must be 1');
  array(value, 'workspaces', errors);
  const seen = new Set();
  const workspaces = Array.isArray(value?.workspaces) ? value.workspaces : [];
  for (const [index, workspace] of workspaces.entries()) {
    if (!isPlainObject(workspace)) {
      errors.push(`workspaces[${index}] must be an object`);
      continue;
    }
    required(workspace, ['id', 'title', 'kind', 'root'], errors, `workspaces[${index}].`);
    if (!['demo', 'internal', 'downstream'].includes(workspace.kind)) errors.push(`workspaces[${index}].kind is invalid`);
    if (seen.has(workspace.id)) errors.push(`workspaces[${index}].id is duplicated`);
    seen.add(workspace.id);
    if (workspace.kind === 'demo' && !workspace.badge) errors.push(`workspaces[${index}].badge is required for demo`);
  }
  if (Array.isArray(value?.workspaces) && !seen.has(value.defaultWorkspaceId)) {
    errors.push('defaultWorkspaceId must reference a workspace');
  }
}

function validateManifest(value, errors) {
  required(value, ['schemaVersion', 'manifestVersion', 'projectId', 'sourceRevision', 'generatedAt', 'digestAlgorithm', 'digest'], errors);
  for (const field of ['needs', 'screens', 'features', 'featureDetails', 'flows', 'relations', 'decisions']) array(value, field, errors);
  if (value?.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (value?.manifestVersion && !SEMVER.test(value.manifestVersion)) errors.push('manifestVersion must be semver');
  if (value?.digestAlgorithm !== 'sha256') errors.push('digestAlgorithm must be sha256');
  if (value?.digest && !DIGEST.test(value.digest)) errors.push('digest must be sha256:<hex>');
}

function validateFeatureDetail(value, errors) {
  required(value, ['id', 'owner', 'definitionStatus', 'featureGroupId', 'placements', 'targetReleaseId', 'intent', 'scope', 'behavior', 'states', 'rules', 'interfaces', 'quality', 'acceptance', 'traceability', 'decisions'], errors);
  if (value?.id && !ID.test(value.id)) errors.push('id is invalid');
  if (value?.definitionStatus && !['draft', 'in-review', 'approved', 'deprecated'].includes(value.definitionStatus)) errors.push('definitionStatus is invalid');
  if (value?.placements !== undefined) {
    if (!Array.isArray(value.placements)) errors.push('placements must be an array');
    else {
      for (const [index, placement] of value.placements.entries()) {
        required(placement, ['screenId', 'role'], errors, `placements[${index}].`);
        if (placement?.role && !['primary', 'entry', 'result', 'support'].includes(placement.role)) {
          errors.push(`placements[${index}].role is invalid`);
        }
      }
    }
  }
  if (value?.intent) required(value.intent, ['actor', 'goal'], errors, 'intent.');
  if (value?.behavior) required(value.behavior, ['trigger', 'happyPath'], errors, 'behavior.');
  if (value?.acceptance && !Array.isArray(value.acceptance)) errors.push('acceptance must be an array');
}

function validateDeliveryEvidence(value, errors) {
  required(value, ['schemaVersion', 'projectId', 'consumedManifestDigest', 'sourceRevision', 'collectedAt'], errors);
  if (value?.schemaVersion !== undefined && value.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (value?.consumedManifestDigest && !DIGEST.test(value.consumedManifestDigest)) errors.push('consumedManifestDigest is invalid');
  if (value?.workItems === undefined && value?.features === undefined) errors.push('workItems or features is required');
  if (value?.workItems !== undefined && !Array.isArray(value.workItems)) errors.push('workItems must be an array');
  if (value?.features !== undefined && !Array.isArray(value.features)) errors.push('features must be an array');
}

function validateChangeProposal(value, errors) {
  required(value, ['id', 'entity', 'fieldPath', 'plannedValue', 'observedValue', 'evidence', 'rationale', 'proposer', 'decisionOwner', 'status'], errors);
  if (value?.evidence !== undefined && (!Array.isArray(value.evidence) || value.evidence.length === 0)) errors.push('evidence must contain at least one item');
  if (value?.status && !['open', 'accepted', 'rejected', 'deferred', 'resolved'].includes(value.status)) errors.push('status is invalid');
}

const validators = {
  workspace: validateWorkspace,
  manifest: validateManifest,
  'feature-detail': validateFeatureDetail,
  'delivery-evidence': validateDeliveryEvidence,
  'change-proposal': validateChangeProposal,
};

export function validateContract(kind, value, { mode = 'strict' } = {}) {
  const errors = [];
  const validator = validators[kind];
  if (!validator) errors.push(`Unknown contract: ${kind}`);
  else if (!value || typeof value !== 'object' || Array.isArray(value)) errors.push(`${kind} must be an object`);
  else validator(value, errors);
  return { kind, mode, valid: errors.length === 0, errors };
}

export function assertContract(kind, value) {
  const result = validateContract(kind, value);
  if (!result.valid) throw new Error(`${kind} contract invalid: ${result.errors.join('; ')}`);
  return value;
}

export function resolveSafePath(root, candidate = '.') {
  if (typeof candidate !== 'string' || candidate.length === 0 || isAbsolute(candidate)) {
    throw new Error('source path must be a non-empty relative path');
  }
  const rootPath = resolve(root);
  const targetPath = resolve(rootPath, candidate);
  const rel = relative(rootPath, targetPath);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error('source root resolves outside repository root');
  }
  return targetPath;
}

export function validateSourceDescriptor(repositoryRoot, descriptor = {}) {
  if (!isPlainObject(descriptor)) throw new Error('source descriptor must be a plain object');
  const forbidden = ['command', 'exec', 'executable', 'script', 'token', 'password', 'secret'];
  for (const field of forbidden) {
    if (descriptor[field] !== undefined) throw new Error(`source descriptor executable/credential field is forbidden: ${field}`);
  }
  const repositoryId = descriptor.repositoryId || 'current-repository';
  if (typeof repositoryId !== 'string' || !repositoryId || repositoryId.includes('://') || /[^/]+:[^/]+@/.test(repositoryId)) {
    throw new Error('source repositoryId must be a non-credential identifier, not a credential URL');
  }
  const relativeRoot = descriptor.relativeRoot || '.';
  resolveSafePath(repositoryRoot, relativeRoot);
  return { repositoryId, relativeRoot };
}

export function isDigest(value) {
  return DIGEST.test(String(value || ''));
}
