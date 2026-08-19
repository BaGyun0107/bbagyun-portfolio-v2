import { tmp } from './helpers/fixture-base.mjs';
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanUserFlows, USER_FLOW_SCHEMA } from '../.harness/scripts/docs/lib/scan-user-flows.mjs';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'feature-hub');

function rootWith(name) {
  const root = tmp('user-flows-');
  mkdirSync(join(root, 'data'), { recursive: true });
  if (name) cpSync(join(FIXTURES, name), join(root, 'data', 'user-flows.json'));
  return root;
}

function scanSource(source) {
  const root = rootWith();
  writeFileSync(join(root, 'data', 'user-flows.json'), JSON.stringify(source));
  return scanUserFlows(root);
}

test('user-flow schema: builder가 지원하는 step/edge kind와 optional semantics metadata를 선언한다', () => {
  assert.deepEqual(USER_FLOW_SCHEMA.stepKinds, ['start', 'action', 'decision', 'system', 'end', 'success', 'failure', 'recovery']);
  assert.deepEqual(USER_FLOW_SCHEMA.edgeKinds, ['normal', 'success', 'happy-path', 'decision', 'failure', 'recovery']);
  assert.deepEqual(USER_FLOW_SCHEMA.requiredEdgeFields, ['to']);
  assert.ok(USER_FLOW_SCHEMA.optionalStepFields.includes('normalNextId'));
  assert.ok(USER_FLOW_SCHEMA.optionalEdgeFields.includes('kind'));
  assert.ok(USER_FLOW_SCHEMA.optionalEdgeFields.includes('normal'));
});

test('user-flow scan: 분기와 순환을 포함한 유효 flow를 유지한다', () => {
  const result = scanUserFlows(rootWith('user-flows.valid.json'));
  assert.equal(result.userFlows.flows.length, 1);
  assert.equal(result.userFlows.flows[0].steps.length, 4);
  assert.equal(result.userFlows.flows[0].steps[1].normalNextId, 'done');
  assert.deepEqual(result.userFlows.flows[0].steps[1].next, [
    { to: 'done', condition: '충분', kind: 'normal', normal: true },
    { to: 'recover', condition: '보완 필요', kind: 'recovery', normal: false },
  ]);
  assert.equal(result.userFlows.flows[0].steps[2].kind, 'recovery');
  assert.equal(result.userFlows.flows[0].steps[3].kind, 'success');
  assert.equal(result.userFlows.health.flowCycles.length, 1);
  assert.match(result.warnings.join('\n'), /cycle/);
});

test('user-flow scan: 지원하지 않는 step kind는 제외하고 warning health를 남긴다', () => {
  const result = scanSource({ version: 1, flows: [{
    id: 'FLOW-STEP-KIND', title: 'Step kind', actor: 'user', goal: 'invalid step 제외', entryStepId: 'invalid',
    steps: [
      { id: 'invalid', title: 'Invalid', kind: 'unsupported', next: [] },
      { id: 'valid', title: 'Valid', kind: 'end', next: [] },
    ],
  }] });

  assert.deepEqual(result.userFlows.flows[0].steps.map(({ id }) => id), ['valid']);
  assert.match(result.warnings.join('\n'), /step 구조 위반/);
});

test('user-flow scan: invalid edge kind/normal은 제외하고 유효 semantics만 보존한다', () => {
  const result = scanSource({ version: 1, flows: [{
    id: 'FLOW-EDGE-KIND', title: 'Edge kind', actor: 'user', goal: 'invalid edge 제외', entryStepId: 'start',
    steps: [
      { id: 'start', title: 'Start', kind: 'start', normalNextId: 'done', next: [
        { to: 'done', kind: 'unsupported' },
        { to: 'done', normal: 'yes' },
        { to: 'done', condition: '완료', kind: 'normal', normal: true },
      ] },
      { id: 'done', title: 'Done', kind: 'success', next: [] },
    ],
  }] });

  assert.deepEqual(result.userFlows.flows[0].steps[0].next, [
    { to: 'done', condition: '완료', kind: 'normal', normal: true },
  ]);
  assert.match(result.warnings.join('\n'), /edge 구조 위반/);
});

test('user-flow scan: 파일 부재와 파싱 실패는 null + warning이다', () => {
  const absent = scanUserFlows(rootWith());
  assert.equal(absent.userFlows, null);
  assert.match(absent.warnings.join('\n'), /미정의/);

  const brokenRoot = rootWith();
  writeFileSync(join(brokenRoot, 'data', 'user-flows.json'), '{ broken');
  const broken = scanUserFlows(brokenRoot);
  assert.equal(broken.userFlows, null);
  assert.match(broken.warnings.join('\n'), /파싱 실패/);
});

test('user-flow scan: 최상위 구조 위반은 fail-open null이다', () => {
  const result = scanUserFlows(rootWith('user-flows.invalid.json'));
  assert.equal(result.userFlows, null);
  assert.match(result.warnings.join('\n'), /구조 위반/);
});

test('user-flow scan: step 중복과 broken next를 제외하고 cycle과 외부 참조는 보존한다', () => {
  const result = scanUserFlows(rootWith('user-flows.partial.json'));
  const flow = result.userFlows.flows[0];
  assert.equal(flow.steps.length, 1, '중복 step 제외');
  assert.deepEqual(flow.steps[0].next, [{ to: 'start', condition: '재시도' }]);
  assert.deepEqual(flow.steps[0].screenIds, ['MISSING-SCREEN']);
  assert.deepEqual(flow.steps[0].featureIds, ['MISSING-FEATURE']);
  assert.equal(result.userFlows.health.brokenFlowEdges.length, 1);
  assert.equal(result.userFlows.health.flowCycles.length, 1);
  assert.match(result.warnings.join('\n'), /step 중복/);
  assert.match(result.warnings.join('\n'), /broken next/);
});
