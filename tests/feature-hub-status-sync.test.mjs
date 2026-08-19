import { tmp } from './helpers/fixture-base.mjs';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planStatusSync, applyStatusSync } from '../.harness/scripts/docs/lib/status-sync.mjs';

function makeRoot() {
  const root = tmp('feature-status-sync-');
  mkdirSync(join(root, 'specs'), { recursive: true });
  return root;
}

function writeFeature(root, id, status, tasks, evidence = {}) {
  const dir = join(root, 'specs', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'status.yaml'), [
    `id: "${id}"`,
    `title: "${id} title"`,
    'phase: P1',
    `status: ${status}`,
    'decision_level: 확정',
    'owner_roles: [frontend]',
    'surface: UserApp',
    'depends_on: []',
    `open_decisions: ${JSON.stringify(evidence.openDecisions || [])}`,
    'history:',
    '',
  ].join('\n'));
  if (tasks) writeFileSync(join(dir, 'tasks.md'), tasks);
  if (evidence.verification) writeFileSync(join(dir, 'verification.md'), evidence.verification);
}

test('status-sync: planned + 일부 완료 task는 in-progress를 제안한다', () => {
  const root = makeRoot();
  writeFeature(root, '003-x', 'planned', '- [x] 시작\n- [ ] 남음\n');

  const plan = planStatusSync(root);

  assert.deepEqual(plan.suggestions.map((s) => [s.id, s.from, s.to]), [
    ['003-x', 'planned', 'in-progress'],
  ]);
  assert.match(plan.suggestions[0].reason, /작업 시작/);
});

test('status-sync: in-progress + 모든 task 완료는 in-review를 제안한다', () => {
  const root = makeRoot();
  writeFeature(root, '004-y', 'in-progress', '- [x] 하나\n- [X] 둘\n');

  const plan = planStatusSync(root);

  assert.deepEqual(plan.suggestions.map((s) => [s.id, s.from, s.to]), [
    ['004-y', 'in-progress', 'in-review'],
  ]);
  assert.match(plan.suggestions[0].reason, /모든 작업/);
});

test('status-sync: --apply 경로는 status.yaml과 history를 갱신한다', () => {
  const root = makeRoot();
  writeFeature(root, '005-z', 'in-progress', '- [x] 하나\n');

  const result = applyStatusSync(root, { at: '2026-07-08' });
  const text = readFileSync(join(root, 'specs', '005-z', 'status.yaml'), 'utf8');

  assert.deepEqual(result.applied.map((s) => [s.id, s.from, s.to]), [
    ['005-z', 'in-progress', 'in-review'],
  ]);
  assert.match(text, /^status: in-review/m);
  assert.match(text, /at: "2026-07-08", to: in-review/);
});

test('status-sync: status.yaml 없는 spec 디렉터리는 진단만 남긴다', () => {
  const root = makeRoot();
  mkdirSync(join(root, 'specs', '006-missing'), { recursive: true });
  writeFileSync(join(root, 'specs', '006-missing', 'spec.md'), '# Missing\n');

  const plan = planStatusSync(root);

  assert.deepEqual(plan.missingStatus, ['006-missing']);
  assert.deepEqual(plan.suggestions, []);
});

test('status-sync: in-review 완료 작업 + 검증 100% + 열린 결정 0건만 done을 제안한다', () => {
  const root = makeRoot();
  writeFeature(root, '007-ready', 'in-review', '- [x] 구현\n- [x] 검토\n', {
    verification: '- [x] 단위 테스트\n- [X] 브라우저 검증\n',
  });

  const plan = planStatusSync(root);

  assert.deepEqual(plan.suggestions.map((s) => [s.id, s.from, s.to]), [
    ['007-ready', 'in-review', 'done'],
  ]);
  assert.match(plan.suggestions[0].reason, /작업.*검증.*열린 결정/);
});

test('status-sync: in-review 작업 미완료면 검증이 완료되어도 done을 제안하지 않는다', () => {
  const root = makeRoot();
  writeFeature(root, '008-task-open', 'in-review', '- [x] 구현\n- [ ] 검토\n', {
    verification: '- [x] 단위 테스트\n',
  });

  assert.deepEqual(planStatusSync(root).suggestions, []);
});

test('status-sync: in-review 검증 기록이 없으면 done을 제안하지 않는다', () => {
  const root = makeRoot();
  writeFeature(root, '009-no-verification', 'in-review', '- [x] 구현\n');

  assert.deepEqual(planStatusSync(root).suggestions, []);
});

test('status-sync: in-review 검증이 일부만 완료되면 done을 제안하지 않는다', () => {
  const root = makeRoot();
  writeFeature(root, '010-partial', 'in-review', '- [x] 구현\n', {
    verification: '- [x] 단위 테스트\n- [ ] 브라우저 검증\n',
  });

  assert.deepEqual(planStatusSync(root).suggestions, []);
});

test('status-sync: in-review 열린 결정이 있으면 작업·검증 완료여도 done을 제안하지 않는다', () => {
  const root = makeRoot();
  writeFeature(root, '011-decision-open', 'in-review', '- [x] 구현\n', {
    verification: '- [x] 단위 테스트\n',
    openDecisions: ['노출 정책 확정'],
  });

  assert.deepEqual(planStatusSync(root).suggestions, []);
});

test('applyStatusEdit는 status 라인만 교체하고 history에 최소 수정으로 append한다', async () => {
  const { applyStatusEdit } = await import('../.harness/scripts/docs/lib/status-file.mjs');

  const withHistory = ['id: "010-x"', 'status: in-progress', 'history:', '  - { at: "2026-07-01", to: in-progress }', 'notes: keep'].join('\n');
  const edited = applyStatusEdit(withHistory, 'in-review', '2026-07-17');
  assert.deepEqual(edited.split('\n'), [
    'id: "010-x"',
    'status: in-review',
    'history:',
    '  - { at: "2026-07-01", to: in-progress }',
    '  - { at: "2026-07-17", to: in-review }',
    'notes: keep',
  ]);

  const withoutHistory = 'id: "010-y"\nstatus: planned\n\n';
  const created = applyStatusEdit(withoutHistory, 'in-progress', '2026-07-17');
  assert.deepEqual(created.split('\n'), [
    'id: "010-y"',
    'status: in-progress',
    'history:',
    '  - { at: "2026-07-17", to: in-progress }',
    '',
  ]);

  const statusLikeValue = ['status: planned', 'meta:', '  status: nested-untouched'].join('\n');
  const once = applyStatusEdit(statusLikeValue, 'done', '2026-07-17');
  assert.match(once, /^status: done/m);
  assert.match(once, /  status: nested-untouched/);
  assert.equal((once.match(/status: done/g) || []).length, 1, '첫 top-level status 라인만 교체한다');
});
