import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTransition, collectHints } from '../.harness/scripts/docs/lib/transition.mjs';

test('transition: 유효 인접 정방향 허용', () => {
  assert.equal(validateTransition('planned', 'in-progress').ok, true);
  assert.equal(validateTransition('in-progress', 'in-review').ok, true);
  assert.equal(validateTransition('in-review', 'done').ok, true);
});

test('transition: on-hold는 어느 상태에서든 허용', () => {
  assert.equal(validateTransition('planned', 'on-hold').ok, true);
  assert.equal(validateTransition('in-review', 'on-hold').ok, true);
});

test('transition: on-hold에서 복귀 허용', () => {
  assert.equal(validateTransition('on-hold', 'in-progress').ok, true);
});

test('transition: 정의 안 된 점프는 거부(force 없이)', () => {
  const r = validateTransition('planned', 'done');
  assert.equal(r.ok, false);
  assert.ok(r.reason);
});

test('transition: force면 점프도 허용', () => {
  assert.equal(validateTransition('planned', 'done', { force: true }).ok, true);
});

test('transition: 역방향은 경고하되 허용', () => {
  const r = validateTransition('done', 'planned');
  assert.equal(r.ok, true);
  assert.ok(r.warning);
});

test('transition: 잘못된 대상 상태는 거부', () => {
  assert.equal(validateTransition('planned', 'nonsense').ok, false);
});

test('transition: 같은 상태로의 전이는 거부(변화 없음)', () => {
  assert.equal(validateTransition('done', 'done').ok, false);
});

test('hint A: tasks 전부 완료 + in-progress면 in-review 제안', () => {
  const feats = [{ id: '003-x', status: 'in-progress', progress: { done: 5, total: 5 } }];
  const hints = collectHints(feats, '/tmp/does-not-matter');
  assert.ok(hints.some((h) => h.includes('003-x') && h.includes('in-review')));
});

test('hint A: 진행률 미완이면 제안 없음', () => {
  const feats = [{ id: '003-x', status: 'in-progress', progress: { done: 1, total: 3 } }];
  const hints = collectHints(feats, '/tmp/does-not-matter');
  assert.equal(hints.length, 0);
});

test('hint: 빈 목록/특이 상태는 힌트 없음', () => {
  assert.deepEqual(collectHints([], '/tmp/x'), []);
  assert.deepEqual(collectHints([{ id: 'a', status: 'done', progress: { done: 2, total: 2 } }], '/tmp/x'), []);
});

test('hint: delivery evidence가 모두 충족되면 done 전이를 제안한다', () => {
  const features = [{
    id: '008-ready',
    status: 'in-review',
    progress: { done: 3, total: 3 },
    delivery: {
      doneEligible: true,
      openDecisionCount: 0,
      verification: { recorded: true, done: 2, total: 2, percent: 100 },
    },
  }];

  const hints = collectHints(features, '/tmp/x');

  assert.ok(hints.some((hint) => hint.includes('008-ready') && hint.includes('done')));
  assert.ok(hints.some((hint) => hint.includes('검증 100%')));
});

test('hint: 검증 미기록은 done 대신 보완 근거를 알린다', () => {
  const features = [{
    id: '009-missing',
    status: 'in-review',
    progress: { done: 1, total: 1 },
    delivery: {
      doneEligible: false,
      openDecisionCount: 0,
      verification: { recorded: false, done: 0, total: 0, percent: 0 },
    },
  }];

  assert.ok(collectHints(features, '/tmp/x').some((hint) => hint.includes('검증 기록 없음')));
});

test('hint: 일부 검증과 열린 결정은 각각 남은 근거를 알린다', () => {
  const features = [{
    id: '010-blocked',
    status: 'in-review',
    progress: { done: 2, total: 2 },
    delivery: {
      doneEligible: false,
      openDecisionCount: 2,
      verification: { recorded: true, done: 1, total: 3, percent: 33 },
    },
  }];
  const hints = collectHints(features, '/tmp/x');

  assert.ok(hints.some((hint) => hint.includes('검증 1/3')));
  assert.ok(hints.some((hint) => hint.includes('열린 결정 2건')));
  assert.ok(hints.every((hint) => !hint.includes('done으로 전이 제안')));
});
