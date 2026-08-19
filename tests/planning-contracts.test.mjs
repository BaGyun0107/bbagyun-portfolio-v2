import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const modulePath = '../.harness/scripts/docs/lib/planning-contracts.mjs';
const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/planning-hub/contracts/${name}`, import.meta.url)));
const schema = (name) => JSON.parse(readFileSync(new URL(`../.harness/config/${name}`, import.meta.url)));

test('workspace 계약은 valid fixture를 통과시키고 default 누락을 진단한다', async () => {
  const { validateContract } = await import(modulePath);
  assert.deepEqual(validateContract('workspace', fixture('valid/workspace.json')).errors, []);
  assert.match(validateContract('workspace', fixture('invalid/workspace.json')).errors.join('\n'), /defaultWorkspaceId/);
});

test('workspace 계약은 non-array workspaces를 throw 없이 진단한다', async () => {
  const { validateContract } = await import(modulePath);

  for (const mode of ['strict', 'preview']) {
    let result;
    assert.doesNotThrow(() => {
      result = validateContract('workspace', {
        defaultWorkspaceId: 'x',
        workspaces: {},
      }, { mode });
    });
    assert.equal(result.mode, mode);
    assert.match(result.errors.join('\n'), /workspaces must be an array/);
  }
});

test('workspace 계약은 null workspace 원소를 throw 없이 진단한다', async () => {
  const { validateContract } = await import(modulePath);

  for (const mode of ['strict', 'preview']) {
    let result;
    assert.doesNotThrow(() => {
      result = validateContract('workspace', {
        defaultWorkspaceId: 'x',
        workspaces: [null],
      }, { mode });
    });
    assert.equal(result.mode, mode);
    assert.match(result.errors.join('\n'), /workspaces\[0\] must be an object/);
  }
});

test('manifest 계약은 필수 envelope와 digest 형식을 검증한다', async () => {
  const { validateContract } = await import(modulePath);
  const input = fixture('digest/manifest-input.json');
  const missingDigest = validateContract('manifest', input);
  assert.match(missingDigest.errors.join('\n'), /digest/);
  const valid = validateContract('manifest', { ...input, digest: `sha256:${'a'.repeat(64)}` });
  assert.deepEqual(valid.errors, []);
});

test('detail/evidence/proposal 계약은 핵심 owner와 provenance를 요구한다', async () => {
  const { validateContract } = await import(modulePath);
  assert.match(validateContract('feature-detail', { id: 'FEAT-1' }).errors.join('\n'), /intent|acceptance/);
  assert.match(validateContract('delivery-evidence', { schemaVersion: 1 }).errors.join('\n'), /projectId|consumedManifestDigest/);
  assert.match(validateContract('change-proposal', { id: 'PROP-1' }).errors.join('\n'), /evidence|decisionOwner/);
});

test('delivery evidence metadata는 explicit workItems와 legacy features를 함께 지원한다', () => {
  const evidenceSchema = schema('delivery-evidence-schema.json');

  assert.deepEqual(evidenceSchema.optionalFields, ['workItems', 'features']);
  assert.equal(evidenceSchema.preferredDeliveryField, 'workItems');
  assert.deepEqual(evidenceSchema.legacyCompatibility, {
    field: 'features',
    mode: 'read-only-projection',
  });
  assert.equal(evidenceSchema.requiredFields.includes('features'), false);
});

test('feature detail runtime 계약은 group, target Release와 typed placements를 검증한다', async () => {
  const { validateContract } = await import(modulePath);
  const legacyShape = {
    id: 'FEAT-1',
    owner: 'planning',
    definitionStatus: 'approved',
    intent: { actor: 'member', goal: 'publish a post' },
    scope: {},
    behavior: { trigger: 'submit', happyPath: [] },
    states: {},
    rules: {},
    interfaces: {},
    quality: {},
    acceptance: [],
    traceability: {},
    decisions: [],
  };

  const missing = validateContract('feature-detail', legacyShape);
  assert.match(missing.errors.join('\n'), /featureGroupId/);
  assert.match(missing.errors.join('\n'), /placements/);
  assert.match(missing.errors.join('\n'), /targetReleaseId/);

  const valid = validateContract('feature-detail', {
    ...legacyShape,
    featureGroupId: 'GROUP-POST',
    placements: [{ screenId: 'SCREEN-FEED', role: 'primary' }],
    targetReleaseId: 'RELEASE-1',
  });
  assert.deepEqual(valid.errors, []);

  const invalidPlacement = validateContract('feature-detail', {
    ...legacyShape,
    featureGroupId: 'GROUP-POST',
    placements: [{ screenId: 'SCREEN-FEED', role: 'repository' }],
    targetReleaseId: 'RELEASE-1',
  });
  assert.match(invalidPlacement.errors.join('\n'), /placements\[0\]\.role/);

  const nonArrayPlacements = validateContract('feature-detail', {
    ...legacyShape,
    featureGroupId: 'GROUP-POST',
    placements: { screenId: 'SCREEN-FEED', role: 'primary' },
    targetReleaseId: 'RELEASE-1',
  });
  assert.match(nonArrayPlacements.errors.join('\n'), /placements must be an array/);
});

test('delivery evidence runtime 계약은 explicit 또는 legacy 배열 중 하나를 요구한다', async () => {
  const { validateContract } = await import(modulePath);
  const envelope = {
    schemaVersion: 1,
    projectId: 'PROJECT-1',
    consumedManifestDigest: `sha256:${'a'.repeat(64)}`,
    sourceRevision: 'revision-1',
    collectedAt: '2026-07-16T00:00:00.000Z',
  };

  assert.deepEqual(validateContract('delivery-evidence', {
    ...envelope,
    workItems: [],
  }).errors, []);
  assert.deepEqual(validateContract('delivery-evidence', {
    ...envelope,
    features: [],
  }).errors, []);
  assert.deepEqual(validateContract('delivery-evidence', {
    ...envelope,
    workItems: [],
    features: [],
  }).errors, []);
  assert.match(
    validateContract('delivery-evidence', envelope).errors.join('\n'),
    /workItems|features/,
  );
  assert.match(
    validateContract('delivery-evidence', {
      ...envelope,
      workItems: {},
    }).errors.join('\n'),
    /workItems must be an array/,
  );
  assert.match(
    validateContract('delivery-evidence', {
      ...envelope,
      features: {},
    }).errors.join('\n'),
    /features must be an array/,
  );
});

test('strict mode는 오류를 던지고 preview mode는 안전한 진단을 반환한다', async () => {
  const { assertContract, validateContract } = await import(modulePath);
  const invalid = fixture('invalid/workspace.json');
  assert.throws(() => assertContract('workspace', invalid), /workspace contract/);
  assert.ok(validateContract('workspace', invalid, { mode: 'preview' }).errors.length > 0);
});

test('source descriptor는 path escape, credential URL과 executable field를 거부한다', async () => {
  const { validateSourceDescriptor } = await import(modulePath);
  assert.deepEqual(
    validateSourceDescriptor('/repo', { repositoryId: 'planning', relativeRoot: '.' }),
    { repositoryId: 'planning', relativeRoot: '.' },
  );
  assert.throws(() => validateSourceDescriptor('/repo', { repositoryId: 'planning', relativeRoot: '../outside' }), /outside/);
  assert.throws(() => validateSourceDescriptor('/repo', { repositoryId: 'https://user:secret@example.com/repo.git', relativeRoot: '.' }), /credential|identifier/);
  assert.throws(() => validateSourceDescriptor('/repo', { repositoryId: 'planning', relativeRoot: '.', command: 'curl evil' }), /executable|command/);
});

test('source descriptor는 string 입력을 contract error로 거부한다', async () => {
  const { validateSourceDescriptor } = await import(modulePath);
  assert.throws(
    () => validateSourceDescriptor('/repo', 'planning'),
    /source descriptor must be a plain object/,
  );
});

test('source descriptor는 array 입력을 contract error로 거부한다', async () => {
  const { validateSourceDescriptor } = await import(modulePath);
  assert.throws(
    () => validateSourceDescriptor('/repo', []),
    /source descriptor must be a plain object/,
  );
});

test('source descriptor는 null 입력을 contract error로 거부한다', async () => {
  const { validateSourceDescriptor } = await import(modulePath);
  assert.throws(
    () => validateSourceDescriptor('/repo', null),
    /source descriptor must be a plain object/,
  );
});
