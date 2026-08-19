import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import {
  aggregateAllFeatures,
  aggregateFeatureWorkItems,
  canCompleteWorkItem,
  unregisteredWorkItemSummary,
} from '../.harness/scripts/docs/lib/aggregate-feature-work-items.mjs';
import { normalizeFeatureWorkItems } from '../.harness/scripts/docs/lib/normalize-feature-work-items.mjs';

const root = resolve(import.meta.dirname, '..');
const readSchema = (name) => JSON.parse(
  readFileSync(resolve(root, '.harness', 'config', name), 'utf8'),
);

test('feature work-item schema separates project delivery ownership from planning', () => {
  const schema = readSchema('feature-work-item-schema.json');

  assert.equal(schema.ownership, 'project-delivery-source');
  assert.deepEqual(schema.statuses, [
    'planned',
    'in-progress',
    'in-review',
    'done',
  ]);
  assert.deepEqual(schema.workTypes, [
    'frontend',
    'backend',
    'db',
    'qa',
    'infra',
    'unspecified',
  ]);
  assert.deepEqual(schema.requiredFields, [
    'id',
    'featureDefinitionId',
    'workType',
    'title',
    'releaseId',
    'status',
    'taskRefs',
    'evidenceRefs',
  ]);
  assert.deepEqual(schema.completionRequiredFields, [
    'requiredAcceptanceCriterionIds',
    'acceptanceResults',
  ]);
  assert.equal(schema.repositoryFieldAllowed, false);
  assert.deepEqual(schema.holdFields, [
    'active',
    'reason',
    'releaseCondition',
  ]);
});

test('feature detail schema requires grouping, placements and target Release metadata', () => {
  const schema = readSchema('feature-detail-schema.json');

  for (const field of ['featureGroupId', 'placements', 'targetReleaseId']) {
    assert.ok(schema.requiredFields.includes(field), `${field} must be required`);
  }
  assert.deepEqual(schema.placementRoles, [
    'primary',
    'entry',
    'result',
    'support',
  ]);
});

test('explicit work items preserve a feature definition 1:N relationship and owned fields', () => {
  const features = [{ id: 'FEAT-POST-CREATE' }];
  const evidence = {
    workItems: [
      {
        id: 'WORK-POST-BACKEND',
        featureDefinitionId: 'FEAT-POST-CREATE',
        title: '게시글 작성 API',
        workType: 'backend',
        releaseId: 'REL-2',
        status: 'in-progress',
        taskRefs: ['specs/010/tasks.md#T107'],
        evidenceRefs: ['src/post/create.ts', 'tests/post-create.test.ts'],
        acceptanceResults: [{ criterionId: 'AC-POST-1', evidenceRefs: ['tests/post-create.test.ts'] }],
      },
      {
        id: 'WORK-POST-FRONTEND',
        featureDefinitionId: 'FEAT-POST-CREATE',
        title: '게시글 작성 화면',
        workType: 'frontend',
        releaseId: 'REL-1',
        status: 'planned',
        taskRefs: ['specs/010/tasks.md#T111'],
        evidenceRefs: [],
      },
    ],
  };

  const result = normalizeFeatureWorkItems({ features, evidence });

  assert.deepEqual(result.health, []);
  assert.deepEqual(result.items.map((item) => ({
    id: item.id,
    featureDefinitionId: item.featureDefinitionId,
    releaseId: item.releaseId,
    workType: item.workType,
    status: item.status,
    taskRefs: item.taskRefs,
    evidenceRefs: item.evidenceRefs,
    source: item.source,
  })), [
    {
      id: 'WORK-POST-BACKEND',
      featureDefinitionId: 'FEAT-POST-CREATE',
      releaseId: 'REL-2',
      workType: 'backend',
      status: 'in-progress',
      taskRefs: ['specs/010/tasks.md#T107'],
      evidenceRefs: ['src/post/create.ts', 'tests/post-create.test.ts'],
      source: 'explicit',
    },
    {
      id: 'WORK-POST-FRONTEND',
      featureDefinitionId: 'FEAT-POST-CREATE',
      releaseId: 'REL-1',
      workType: 'frontend',
      status: 'planned',
      taskRefs: ['specs/010/tasks.md#T111'],
      evidenceRefs: [],
      source: 'explicit',
    },
  ]);
  assert.notStrictEqual(result.items[0].acceptanceResults, evidence.workItems[0].acceptanceResults);
  assert.notStrictEqual(result.items[0].acceptanceResults[0].evidenceRefs, evidence.workItems[0].acceptanceResults[0].evidenceRefs);
});

test('explicit nested values must be safe JSON data and valid JSON values are deeply cloned', () => {
  const circular = { label: 'cycle' };
  circular.self = circular;
  const customPrototype = Object.create({ polluted: true });
  customPrototype.safeLooking = true;
  const dangerousKeys = {
    ['__proto__']: { polluted: true },
    prototype: { polluted: true },
    constructor: { polluted: true },
  };
  const invalidNestedValues = [
    ['WORK-BIGINT', 1n],
    ['WORK-MAP', new Map([['key', 'value']])],
    ['WORK-DATE', new Date('2026-07-16T00:00:00.000Z')],
    ['WORK-CIRCULAR', circular],
    ['WORK-UNDEFINED', undefined],
    ['WORK-NAN', Number.NaN],
    ['WORK-INFINITY', Number.POSITIVE_INFINITY],
    ['WORK-FUNCTION', () => true],
    ['WORK-SYMBOL', Symbol('invalid')],
    ['WORK-DANGEROUS-KEYS', dangerousKeys],
    ['WORK-CUSTOM-PROTOTYPE', customPrototype],
  ];
  const base = {
    featureDefinitionId: 'FEAT-JSON',
    title: 'JSON evidence',
    workType: 'backend',
    releaseId: 'REL-1',
    status: 'planned',
    taskRefs: [],
    evidenceRefs: [],
  };
  const safeMetadata = {
    nullable: null,
    string: 'safe',
    boolean: true,
    number: 3.5,
    nested: [{ refs: ['a', 'b'] }],
  };
  let result;

  assert.doesNotThrow(() => {
    result = normalizeFeatureWorkItems({
      features: [{ id: 'FEAT-JSON' }],
      evidence: {
        workItems: [
          ...invalidNestedValues.map(([id, metadata]) => ({ ...base, id, metadata })),
          { ...base, id: 'WORK-JSON-SAFE', metadata: safeMetadata },
        ],
      },
    });
  });

  assert.deepEqual(result.items.map((item) => item.id), ['WORK-JSON-SAFE']);
  for (const [itemId] of invalidNestedValues) {
    assert.ok(result.health.some((entry) => (
      entry.code === 'work-item-not-json-compatible' && entry.itemId === itemId
    )), `${itemId} must report JSON compatibility health`);
  }
  assert.deepEqual(result.items[0].metadata, safeMetadata);
  assert.notStrictEqual(result.items[0].metadata, safeMetadata);
  assert.notStrictEqual(result.items[0].metadata.nested, safeMetadata.nested);
  assert.notStrictEqual(result.items[0].metadata.nested[0].refs, safeMetadata.nested[0].refs);
});

test('legacy evidence projects one unspecified item only without inferring technical work', () => {
  const features = [
    { id: 'FEAT-POST-CREATE', title: 'API와 DB를 사용하는 게시글 작성' },
    { id: 'FEAT-SEARCH', title: '검색 화면' },
  ];
  const evidence = {
    workItems: [{
      id: 'WORK-POST-QA',
      featureDefinitionId: 'FEAT-POST-CREATE',
      title: '게시글 작성 검증',
      workType: 'qa',
      releaseId: 'REL-1',
      status: 'in-review',
      taskRefs: [],
      evidenceRefs: ['tests/post.test.ts'],
    }],
    features: [
      {
        featureId: 'FEAT-POST-CREATE',
        title: 'backend DB migration',
        deliveryStatus: 'done',
        taskRefs: ['tasks.md#backend'],
      },
      {
        featureId: 'FEAT-SEARCH',
        title: 'frontend search page',
        path: 'src/frontend/search.tsx',
        deliveryStatus: 'in-progress',
        taskRefs: ['tasks.md#database-index'],
        evidenceRefs: ['src/search.tsx'],
      },
    ],
  };

  const result = normalizeFeatureWorkItems({ features, evidence });

  assert.deepEqual(result.items.map((item) => item.id), [
    'WORK-POST-QA',
    'WORK-FEAT-SEARCH-LEGACY',
  ]);
  assert.deepEqual(result.items[1], {
    id: 'WORK-FEAT-SEARCH-LEGACY',
    featureDefinitionId: 'FEAT-SEARCH',
    title: 'frontend search page',
    workType: 'unspecified',
    releaseId: 'unassigned',
    status: 'in-progress',
    taskRefs: ['tasks.md#database-index'],
    evidenceRefs: ['src/search.tsx'],
    source: 'legacy-delivery-evidence',
  });
  assert.equal(result.items.some((item) => item.id === 'WORK-FEAT-POST-CREATE-LEGACY'), false);
});

test('invalid work-item records are isolated with actionable stable health', () => {
  const base = {
    featureDefinitionId: 'FEAT-VALID',
    title: 'valid title',
    workType: 'backend',
    releaseId: 'REL-1',
    status: 'planned',
    taskRefs: [],
    evidenceRefs: [],
  };
  const evidence = {
    workItems: [
      { ...base, id: 'WORK-VALID' },
      { ...base, id: 'WORK-BAD-STATUS', status: 'blocked' },
      { ...base, id: 'WORK-BAD-TYPE', workType: 'mobile' },
      { ...base, id: 'WORK-BAD-STRING', title: '' },
      { ...base, id: 'WORK-BAD-ARRAY', taskRefs: 'tasks.md#T1' },
      { ...base, id: 'WORK-VALID' },
      { ...base, id: 'WORK-BROKEN-PARENT', featureDefinitionId: 'FEAT-MISSING' },
      { ...base, id: 'WORK-REPOSITORY', repository: 'api-repo' },
      { ...base, id: 'WORK-REPOSITORY-ID', repositoryId: 'api-repo' },
      null,
    ],
  };

  const result = normalizeFeatureWorkItems({ features: [{ id: 'FEAT-VALID' }], evidence });

  assert.deepEqual(result.items.map((item) => item.id), ['WORK-VALID', 'WORK-BROKEN-PARENT']);
  assert.equal(result.items[0].registered, undefined);
  assert.equal(result.items[1].registered, false);
  for (const code of [
    'work-item-invalid-status',
    'work-item-invalid-work-type',
    'work-item-required-string-invalid',
    'work-item-required-array-invalid',
    'work-item-id-duplicate',
    'work-item-feature-reference-broken',
    'work-item-repository-field-forbidden',
    'work-item-not-object',
  ]) {
    assert.ok(result.health.some((issue) => issue.code === code), `${code} health is required`);
  }
  for (const issue of result.health) {
    assert.equal(typeof issue.code, 'string');
    assert.equal(typeof issue.itemId, 'string');
    assert.ok(issue.itemId.length > 0);
    assert.equal(typeof issue.action, 'string');
    assert.ok(issue.action.length > 0);
  }
});

test('미등록 기능 work item은 registered:false로 유지되고 health가 남는다', () => {
  const item = {
    id: 'WORK-ORPHAN',
    featureDefinitionId: 'FEAT-NOT-YET',
    title: '먼저 구현한 작업',
    workType: 'backend',
    releaseId: 'R1',
    status: 'in-progress',
    taskRefs: ['specs/x/tasks.md'],
    evidenceRefs: [],
  };
  const result = normalizeFeatureWorkItems({
    features: [{ id: 'FEAT-VALID' }],
    evidence: { workItems: [item, 'not-an-object'] },
  });

  assert.deepEqual(result.items.map(({ id }) => id), ['WORK-ORPHAN']);
  assert.equal(result.items[0].registered, false);
  assert.equal(result.items[0].source, 'explicit');
  assert.ok(result.health.some((issue) => (
    issue.code === 'work-item-feature-reference-broken' && issue.itemId === 'WORK-ORPHAN'
  )));
  assert.ok(result.health.some((issue) => issue.code === 'work-item-not-object'));
});

test('draft stub 기능의 done 요청은 acceptance 부재로 in-review 강등된다 (회귀 고정)', () => {
  const item = {
    id: 'WORK-DRAFT-DONE',
    featureDefinitionId: 'FEAT-DRAFT-STUB',
    title: 'stub 기능 작업',
    workType: 'backend',
    releaseId: 'R1',
    status: 'done',
    taskRefs: ['specs/x/tasks.md'],
    tasks: { done: 2, total: 2 },
    evidenceRefs: ['src/x.ts:1'],
  };
  const completion = canCompleteWorkItem(item);
  assert.equal(completion.complete, false);
  assert.ok(completion.missing.includes('acceptance-verification'));

  const rollup = aggregateFeatureWorkItems({ featureDefinitionId: 'FEAT-DRAFT-STUB', items: [item] });
  assert.equal(rollup.counts['in-review'], 1);
  assert.equal(rollup.counts.done, 0);
  assert.equal(rollup.blockedDoneCount, 1);
});

test('미등록 항목은 기능 rollup에 섞이지 않고 요약 헬퍼로 집계된다', () => {
  const items = [
    {
      id: 'WORK-KNOWN', featureDefinitionId: 'FEAT-A', title: 'a', workType: 'backend',
      releaseId: 'R1', status: 'planned', taskRefs: [], evidenceRefs: [], source: 'explicit',
    },
    {
      id: 'WORK-ORPHAN-1', featureDefinitionId: 'FEAT-NOT-YET', title: 'b', workType: 'frontend',
      releaseId: 'R1', status: 'in-progress', taskRefs: [], evidenceRefs: [], source: 'explicit', registered: false,
    },
    {
      id: 'WORK-ORPHAN-2', featureDefinitionId: 'FEAT-NOT-YET', title: 'c', workType: 'qa',
      releaseId: 'R1', status: 'planned', taskRefs: [], evidenceRefs: [], source: 'explicit', registered: false,
    },
  ];
  const rollups = aggregateAllFeatures({ features: [{ id: 'FEAT-A' }], items });
  assert.deepEqual(Object.keys(rollups), ['FEAT-A']);
  assert.equal(rollups['FEAT-A'].counts.total, 1);

  const summary = unregisteredWorkItemSummary(items);
  assert.equal(summary.itemCount, 2);
  assert.deepEqual(summary.featureIds, ['FEAT-NOT-YET']);
});

test('미등록 기능이 카탈로그에 등록되면 registered 마커 없이 정상 항목이 된다', () => {
  const item = {
    id: 'WORK-ORPHAN',
    featureDefinitionId: 'FEAT-NOT-YET',
    title: '먼저 구현한 작업',
    workType: 'backend',
    releaseId: 'R1',
    status: 'in-progress',
    taskRefs: ['specs/x/tasks.md'],
    evidenceRefs: [],
  };
  const result = normalizeFeatureWorkItems({
    features: [{ id: 'FEAT-NOT-YET' }],
    evidence: { workItems: [item] },
  });

  assert.deepEqual(result.items.map(({ id }) => id), ['WORK-ORPHAN']);
  assert.equal(result.items[0].registered, undefined);
  assert.equal(result.health.length, 0);
});

test('the first explicit source occurrence reserves a stable ID even when that record is invalid', () => {
  const base = {
    id: 'WORK-DUPLICATE',
    featureDefinitionId: 'FEAT-A',
    title: 'duplicate candidate',
    workType: 'backend',
    releaseId: 'REL-1',
    status: 'planned',
    taskRefs: [],
    evidenceRefs: [],
  };
  const result = normalizeFeatureWorkItems({
    features: [{ id: 'FEAT-A' }],
    evidence: {
      workItems: [
        { ...base, status: 'blocked' },
        { ...base, title: 'later valid candidate' },
        { ...base, id: 'WORK-UNIQUE', title: 'independent valid item' },
      ],
    },
  });

  assert.deepEqual(result.items.map((item) => item.id), ['WORK-UNIQUE']);
  assert.deepEqual(
    result.health.filter((issue) => issue.itemId === 'WORK-DUPLICATE').map((issue) => issue.code),
    ['work-item-invalid-status', 'work-item-id-duplicate'],
  );
});

test('legacy generated IDs cannot collide with any encountered explicit ID', () => {
  const base = {
    featureDefinitionId: 'FEAT-OWNER',
    title: 'explicit work',
    workType: 'backend',
    releaseId: 'REL-1',
    status: 'planned',
    taskRefs: [],
    evidenceRefs: [],
  };
  const result = normalizeFeatureWorkItems({
    features: [
      { id: 'FEAT-OWNER' },
      { id: 'FEAT-VALID-COLLISION' },
      { id: 'FEAT-INVALID-COLLISION' },
    ],
    evidence: {
      workItems: [
        { ...base, id: 'WORK-FEAT-VALID-COLLISION-LEGACY' },
        { ...base, id: 'WORK-FEAT-INVALID-COLLISION-LEGACY', status: 'blocked' },
      ],
      features: [
        { featureId: 'FEAT-VALID-COLLISION', title: 'valid explicit ID collision' },
        { featureId: 'FEAT-INVALID-COLLISION', title: 'invalid explicit ID collision' },
      ],
    },
  });

  assert.deepEqual(result.items.map((item) => item.id), ['WORK-FEAT-VALID-COLLISION-LEGACY']);
  for (const itemId of [
    'WORK-FEAT-VALID-COLLISION-LEGACY',
    'WORK-FEAT-INVALID-COLLISION-LEGACY',
  ]) {
    assert.ok(result.health.some((issue) => issue.code === 'work-item-id-duplicate' && issue.itemId === itemId));
  }
});

test('an invalid explicit item reserves only its stable existing feature parent from legacy fallback', () => {
  const base = {
    title: 'invalid explicit work',
    workType: 'backend',
    releaseId: 'REL-1',
    status: 'blocked',
    taskRefs: [],
    evidenceRefs: [],
  };
  const result = normalizeFeatureWorkItems({
    features: [{ id: 'FEAT-A' }, { id: 'FEAT-B' }],
    evidence: {
      workItems: [
        { ...base, id: 'WORK-A-INVALID', featureDefinitionId: 'FEAT-A' },
        { ...base, id: 'WORK-BROKEN-PARENT', featureDefinitionId: 'FEAT-MISSING' },
        { ...base, id: 'WORK-MISSING-PARENT', featureId: 'FEAT-B' },
      ],
      features: [
        { featureId: 'FEAT-A', title: 'must be suppressed' },
        { featureId: 'FEAT-B', title: 'must remain visible' },
      ],
    },
  });

  assert.deepEqual(result.items.map((item) => item.id), ['WORK-FEAT-B-LEGACY']);
  assert.ok(result.health.some((issue) => (
    issue.code === 'work-item-invalid-status' && issue.itemId === 'WORK-A-INVALID'
  )));
  assert.ok(result.health.some((issue) => (
    issue.code === 'work-item-feature-reference-broken' && issue.itemId === 'WORK-BROKEN-PARENT'
  )));
  assert.ok(result.health.some((issue) => (
    issue.code === 'work-item-required-string-invalid' && issue.itemId === 'WORK-MISSING-PARENT'
  )));
});

test('legacy projection preserves a valid release and uses unassigned only when release is missing', () => {
  const result = normalizeFeatureWorkItems({
    features: [{ id: 'FEAT-RELEASED' }, { id: 'FEAT-UNASSIGNED' }],
    evidence: {
      features: [
        { featureId: 'FEAT-RELEASED', title: 'released legacy work', releaseId: 'REL-7' },
        { featureId: 'FEAT-UNASSIGNED', title: 'unclassified legacy work' },
      ],
    },
  });

  assert.deepEqual(result.items.map(({ id, releaseId }) => ({ id, releaseId })), [
    { id: 'WORK-FEAT-RELEASED-LEGACY', releaseId: 'REL-7' },
    { id: 'WORK-FEAT-UNASSIGNED-LEGACY', releaseId: 'unassigned' },
  ]);
});

test('malformed containers fail open, preserve deterministic order and never mutate inputs', () => {
  const malformedCases = [
    undefined,
    null,
    {},
    { features: [], evidence: null },
    { features: null, evidence: { workItems: [], features: [] } },
    { features: {}, evidence: [] },
    { features: [{ id: 'FEAT-A' }], evidence: { workItems: {}, features: 'invalid' } },
  ];

  for (const input of malformedCases) {
    assert.doesNotThrow(() => normalizeFeatureWorkItems(input));
  }
  const malformedContainers = normalizeFeatureWorkItems({
    features: [{ id: 'FEAT-A' }],
    evidence: { workItems: {}, features: 'invalid' },
  });
  assert.ok(malformedContainers.health.some((issue) => issue.code === 'work-items-not-array'));
  assert.ok(malformedContainers.health.some((issue) => issue.code === 'legacy-features-not-array'));

  const input = {
    features: [{ id: 'FEAT-A' }, { id: 'FEAT-B' }, { id: 'FEAT-C' }],
    evidence: {
      workItems: [
        { id: 'WORK-B-2', featureDefinitionId: 'FEAT-B', title: 'B2', workType: 'db', releaseId: 'REL-2', status: 'planned', taskRefs: ['nested-task-ref'], evidenceRefs: [] },
        { id: 'WORK-A-1', featureDefinitionId: 'FEAT-A', title: 'A1', workType: 'frontend', releaseId: 'REL-1', status: 'done', taskRefs: [], evidenceRefs: ['nested-evidence-ref'] },
      ],
      features: [{ featureId: 'FEAT-C', title: 'C legacy' }],
    },
  };
  const snapshot = structuredClone(input);

  const first = normalizeFeatureWorkItems(input);
  const second = normalizeFeatureWorkItems(input);

  assert.deepEqual(first, second);
  assert.deepEqual(first.items.map((item) => item.id), [
    'WORK-B-2',
    'WORK-A-1',
    'WORK-FEAT-C-LEGACY',
  ]);
  assert.deepEqual(input, snapshot);
});

test('completion requires real completed tasks, passed acceptance results, evidence and no blockers', () => {
  const complete = {
    tasks: { done: 2, total: 2 },
    requiredAcceptanceCriterionIds: ['AC-POST-1', 'AC-POST-2'],
    acceptanceResults: [
      { criterionId: 'AC-POST-1', status: 'passed' },
      { criterionId: 'AC-POST-2', status: 'passed' },
    ],
    evidenceRefs: ['src/post/create.ts', 'tests/post-create.test.ts'],
    blockingDecisions: [],
  };

  assert.deepEqual(canCompleteWorkItem(complete), { complete: true, missing: [] });
  assert.deepEqual(canCompleteWorkItem({ ...complete, blockingDecisions: undefined }), {
    complete: true,
    missing: [],
  });
  assert.deepEqual(canCompleteWorkItem({
    tasks: { done: 0, total: 0 },
    requiredAcceptanceCriterionIds: ['AC-POST-1'],
    acceptanceResults: [{ criterionId: 'AC-POST-1', status: 'pending' }],
    evidenceRefs: [],
    blockingDecisions: ['DEC-OPEN'],
  }), {
    complete: false,
    missing: ['tasks', 'acceptance-verification', 'evidence', 'blocking-decision'],
  });

  for (const tasks of [
    { done: -1, total: -1 },
    { done: -1, total: 1 },
    { done: 2, total: 1 },
    { done: 1.5, total: 1.5 },
    { done: 1.5, total: 2 },
    { done: 1, total: 1.5 },
    { done: Number.MAX_SAFE_INTEGER + 1, total: Number.MAX_SAFE_INTEGER + 1 },
    { done: 1, total: Number.NaN },
    { done: 1, total: Number.POSITIVE_INFINITY },
    { done: 1, total: 2 },
  ]) {
    assert.ok(canCompleteWorkItem({ ...complete, tasks }).missing.includes('tasks'));
  }
  assert.doesNotThrow(() => canCompleteWorkItem(null));
});

test('criteria aliases and invalid acceptance results cannot satisfy completion', () => {
  const base = {
    tasks: { done: 1, total: 1 },
    requiredAcceptanceCriterionIds: ['AC-REQUIRED'],
    evidenceRefs: ['verification.md'],
    blockingDecisions: [],
  };

  assert.deepEqual(canCompleteWorkItem({
    ...base,
    criteria: [{ criterionId: 'AC-LEGACY', status: 'passed' }],
  }), {
    complete: false,
    missing: ['acceptance-verification'],
  });

  for (const acceptanceResults of [
    [],
    [{ criterionId: 'AC-REQUIRED', status: 'pending' }],
    [null],
    ['passed'],
  ]) {
    assert.deepEqual(canCompleteWorkItem({ ...base, acceptanceResults }), {
      complete: false,
      missing: ['acceptance-verification'],
    });
  }
});

test('completion requires unique required criterion coverage and structurally valid results', () => {
  const base = {
    tasks: { done: 1, total: 1 },
    requiredAcceptanceCriterionIds: ['AC-1', 'AC-2'],
    acceptanceResults: [
      { criterionId: 'AC-1', status: 'passed' },
      { criterionId: 'AC-2', status: 'passed' },
    ],
    evidenceRefs: ['verification.md'],
    blockingDecisions: [],
  };
  const invalidCases = [
    { requiredAcceptanceCriterionIds: [] },
    { requiredAcceptanceCriterionIds: ['AC-1', 'AC-1'] },
    { requiredAcceptanceCriterionIds: ['AC-1', ''] },
    { acceptanceResults: [{ criterionId: 'AC-1', status: 'passed' }] },
    {
      acceptanceResults: [
        { criterionId: 'AC-1', status: 'passed' },
        { criterionId: 'AC-1', status: 'passed' },
        { criterionId: 'AC-2', status: 'passed' },
      ],
    },
    { acceptanceResults: [{ criterionId: '', status: 'passed' }] },
    { acceptanceResults: [{ criterionId: 'AC-1', status: '' }] },
    { acceptanceResults: [new Date('2026-07-17T00:00:00.000Z')] },
  ];

  for (const override of invalidCases) {
    assert.deepEqual(canCompleteWorkItem({ ...base, ...override }), {
      complete: false,
      missing: ['acceptance-verification'],
    });
  }
});

test('completion requires safe integer task totals and stable evidence references', () => {
  const complete = {
    tasks: { done: 1, total: 1 },
    requiredAcceptanceCriterionIds: ['AC-1'],
    acceptanceResults: [{ criterionId: 'AC-1', status: 'passed' }],
    evidenceRefs: ['verification.md'],
    blockingDecisions: [],
  };

  for (const evidenceRefs of [[], [''], [null], [{}], ['', null, {}]]) {
    assert.deepEqual(canCompleteWorkItem({ ...complete, evidenceRefs }), {
      complete: false,
      missing: ['evidence'],
    });
  }
});

test('feature rollup filters releases, preserves base columns and blocks unsupported done attempts', () => {
  const doneEvidence = {
    tasks: { done: 2, total: 2 },
    requiredAcceptanceCriterionIds: ['AC-POST-1'],
    acceptanceResults: [{ criterionId: 'AC-POST-1', status: 'passed' }],
    evidenceRefs: ['tests/post.e2e.ts'],
    blockingDecisions: [],
  };
  const items = [
    {
      id: 'WORK-R1-PLANNED',
      featureDefinitionId: 'FEAT-POST',
      releaseId: 'R1',
      status: 'planned',
      hold: {
        active: true,
        reason: '외부 API 계약 대기',
        releaseCondition: 'DEC-API-CLOSED',
      },
    },
    { id: 'WORK-R1-ACTIVE', featureDefinitionId: 'FEAT-POST', releaseId: 'R1', status: 'in-progress' },
    { id: 'WORK-R1-REVIEW', featureDefinitionId: 'FEAT-POST', releaseId: 'R1', status: 'in-review' },
    { id: 'WORK-R1-DONE', featureDefinitionId: 'FEAT-POST', releaseId: 'R1', status: 'done', ...doneEvidence },
    {
      id: 'WORK-R1-BLOCKED-DONE',
      featureDefinitionId: 'FEAT-POST',
      releaseId: 'R1',
      status: 'done',
      ...doneEvidence,
      evidenceRefs: [],
    },
    { id: 'WORK-R2-PLANNED', featureDefinitionId: 'FEAT-POST', releaseId: 'R2', status: 'planned' },
    { id: 'WORK-R2-REVIEW', featureDefinitionId: 'FEAT-POST', releaseId: 'R2', status: 'in-review' },
    { id: 'WORK-OTHER', featureDefinitionId: 'FEAT-OTHER', releaseId: 'R1', status: 'in-progress' },
  ];
  const snapshot = structuredClone(items);

  assert.deepEqual(
    aggregateFeatureWorkItems({ featureDefinitionId: 'FEAT-POST', releaseId: 'R1', items }),
    {
      featureDefinitionId: 'FEAT-POST',
      releaseId: 'R1',
      status: 'in-progress',
      counts: {
        planned: 1,
        'in-progress': 1,
        'in-review': 2,
        done: 1,
        onHold: 1,
        total: 5,
      },
      blockedDoneCount: 1,
      health: [],
      invalidItemCount: 0,
    },
  );
  assert.deepEqual(
    aggregateFeatureWorkItems({ featureDefinitionId: 'FEAT-POST', releaseId: 'R2', items }),
    {
      featureDefinitionId: 'FEAT-POST',
      releaseId: 'R2',
      status: 'in-review',
      counts: {
        planned: 1,
        'in-progress': 0,
        'in-review': 1,
        done: 0,
        onHold: 0,
        total: 2,
      },
      blockedDoneCount: 0,
      health: [],
      invalidItemCount: 0,
    },
  );
  assert.deepEqual(items, snapshot);
});

test('feature rollup distinguishes zero work from all verified work', () => {
  const verifiedDone = {
    featureDefinitionId: 'FEAT-DONE',
    releaseId: 'R1',
    status: 'done',
    tasks: { done: 1, total: 1 },
    requiredAcceptanceCriterionIds: ['AC-DONE-1'],
    acceptanceResults: [{ criterionId: 'AC-DONE-1', status: 'passed' }],
    evidenceRefs: ['verification.md'],
    blockingDecisions: [],
  };
  const items = [
    { ...verifiedDone, id: 'WORK-DONE-1' },
    { ...verifiedDone, id: 'WORK-DONE-2' },
  ];

  assert.equal(aggregateFeatureWorkItems({ featureDefinitionId: 'FEAT-DONE', items }).status, 'done');
  assert.deepEqual(
    aggregateFeatureWorkItems({ featureDefinitionId: 'FEAT-DONE', releaseId: 'R404', items }),
    {
      featureDefinitionId: 'FEAT-DONE',
      releaseId: 'R404',
      status: 'work-not-created',
      counts: {
        planned: 0,
        'in-progress': 0,
        'in-review': 0,
        done: 0,
        onHold: 0,
        total: 0,
      },
      blockedDoneCount: 0,
      health: [],
      invalidItemCount: 0,
    },
  );
  assert.equal(
    aggregateFeatureWorkItems({ featureDefinitionId: 'FEAT-NO-WORK', items }).status,
    'work-not-created',
  );
});

test('all-feature rollups keep the first valid feature ID and skip malformed entries deterministically', () => {
  const input = {
    features: [
      null,
      {},
      { id: '' },
      { id: 'FEAT-B' },
      { id: 'FEAT-A' },
      { id: 'FEAT-B', title: 'duplicate must not replace the first occurrence' },
      'invalid',
    ],
    items: [
      null,
      { featureDefinitionId: 'FEAT-A', releaseId: 'R1', status: 'planned' },
      { featureDefinitionId: 'FEAT-B', releaseId: 'R2', status: 'in-progress' },
    ],
    releaseId: 'R1',
  };
  const snapshot = structuredClone(input);

  const first = aggregateAllFeatures(input);
  const second = aggregateAllFeatures(input);

  assert.deepEqual(first, second);
  assert.deepEqual(Object.keys(first), ['FEAT-B', 'FEAT-A']);
  assert.equal(first['FEAT-B'].status, 'work-not-created');
  assert.equal(first['FEAT-A'].status, 'planned');
  assert.deepEqual(input, snapshot);
  assert.doesNotThrow(() => aggregateAllFeatures({ features: {}, items: null }));
});

test('feature rollup reports invalid targets and scoped malformed work separately from zero work', () => {
  const emptyCounts = {
    planned: 0,
    'in-progress': 0,
    'in-review': 0,
    done: 0,
    onHold: 0,
    total: 0,
  };

  for (const featureDefinitionId of [undefined, null, '', '   ']) {
    const rollup = aggregateFeatureWorkItems({
      featureDefinitionId,
      items: [{ featureDefinitionId, status: 'planned' }],
    });

    assert.deepEqual(rollup.counts, emptyCounts);
    assert.equal(rollup.status, 'work-not-created');
    assert.equal(rollup.invalidItemCount, 1);
    assert.deepEqual(rollup.health, [{
      code: 'feature-rollup-id-invalid',
      itemId: 'featureDefinitionId',
      action: 'featureDefinitionId를 비어 있지 않은 문자열로 제공하세요.',
    }]);
  }

  assert.deepEqual(aggregateFeatureWorkItems({
    featureDefinitionId: 'FEAT-A',
    releaseId: 'R1',
    items: [
      null,
      { id: 'WORK-A-BAD', featureDefinitionId: 'FEAT-A', releaseId: 'R1', status: 'blocked' },
      { id: 'WORK-B-BAD', featureDefinitionId: 'FEAT-B', releaseId: 'R1', status: 'blocked' },
    ],
  }), {
    featureDefinitionId: 'FEAT-A',
    releaseId: 'R1',
    status: 'work-not-created',
    counts: emptyCounts,
    blockedDoneCount: 0,
    health: [
      {
        code: 'work-item-not-object',
        itemId: 'items[0]',
        action: 'FeatureWorkItem을 객체로 수정하세요.',
      },
      {
        code: 'work-item-invalid-status',
        itemId: 'WORK-A-BAD',
        action: 'status를 지원되는 기본 상태로 수정하세요.',
      },
    ],
    invalidItemCount: 2,
  });
});

test('all-feature aggregation scales across indexed feature buckets with exact counts', () => {
  const featureCount = 500;
  const itemCount = 2_000;
  const features = Array.from({ length: featureCount }, (_, index) => ({ id: `FEAT-${index}` }));
  const items = Array.from({ length: itemCount }, (_, index) => ({
    id: `WORK-${index}`,
    featureDefinitionId: `FEAT-${index % featureCount}`,
    releaseId: `R-${index % 2}`,
    status: 'planned',
  }));
  const startedAt = performance.now();

  const rollups = aggregateAllFeatures({ features, items });
  const elapsedMs = performance.now() - startedAt;

  assert.equal(Object.keys(rollups).length, featureCount);
  for (const feature of features) {
    assert.equal(rollups[feature.id].counts.planned, 4);
    assert.equal(rollups[feature.id].counts.total, 4);
    assert.deepEqual(rollups[feature.id].health, []);
    assert.equal(rollups[feature.id].invalidItemCount, 0);
  }
  assert.ok(elapsedMs < 2_000, `aggregation took ${elapsedMs.toFixed(1)}ms`);
});
