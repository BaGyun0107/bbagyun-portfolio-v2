import { tmp } from './helpers/fixture-base.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanSpecs } from '../.harness/scripts/docs/lib/scan-specs.mjs';

function writeFeature({ verification, openDecisions = [], specExtra = '' } = {}) {
  const root = tmp('delivery-evidence-');
  const dir = join(root, 'specs', '010-evidence');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'status.yaml'), [
    'id: "010-evidence"',
    'title: "근거 기능"',
    'status: in-review',
    'phase: P1',
    'owner_roles: [frontend]',
    `open_decisions: [${openDecisions.join(', ')}]`,
    'history:',
    '  - { at: "2026-07-01", to: in-progress }',
    '  - { at: "2026-07-02", to: in-review }',
    '',
  ].join('\n'));
  writeFileSync(join(dir, 'tasks.md'), '- [x] T001 완료\n- [ ] T002 다음 작업\n');
  writeFileSync(join(dir, 'spec.md'), `# Feature Specification: 근거\n\n요약.\n${specExtra}`);
  if (verification !== undefined) writeFileSync(join(dir, 'verification.md'), verification);
  return join(root, 'specs');
}

test('delivery: 다음 작업과 마지막 상태 전이를 파생한다', () => {
  const { features } = scanSpecs(writeFeature());
  const feature = features[0];
  assert.equal(feature.delivery.nextAction, 'T002 다음 작업');
  assert.deepEqual(feature.delivery.lastTransition, { at: '2026-07-02', to: 'in-review' });
});

test('delivery: verification 부재와 체크박스 0개는 미기록이다', () => {
  const absent = scanSpecs(writeFeature()).features[0].delivery.verification;
  const empty = scanSpecs(writeFeature({ verification: '# Verification\n\n서술만 있음.\n' })).features[0].delivery.verification;
  assert.equal(absent.recorded, false);
  assert.equal(empty.recorded, false);
});

test('delivery: verification 비율과 열린 결정을 계산한다', () => {
  const specs = writeFeature({
    verification: '- [x] 자동\n- [ ] 수동\n',
    openDecisions: ['D1', 'D2'],
    specExtra: '\n[NEEDS CLARIFICATION: 정책]\n',
  });
  const delivery = scanSpecs(specs).features[0].delivery;
  assert.deepEqual(delivery.verification, { recorded: true, done: 1, total: 2, percent: 50 });
  assert.equal(delivery.openDecisionCount, 3);
  assert.equal(delivery.doneEligible, false);
});

test('delivery: task와 verification 완료·열린 결정 0건일 때만 done 가능하다', () => {
  const specs = writeFeature({ verification: '- [x] 자동\n' });
  const dir = join(specs, '010-evidence');
  writeFileSync(join(dir, 'tasks.md'), '- [x] T001 완료\n');
  const delivery = scanSpecs(specs).features[0].delivery;
  assert.equal(delivery.doneEligible, true);
});
