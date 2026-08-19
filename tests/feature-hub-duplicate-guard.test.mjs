import { tmp } from './helpers/fixture-base.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectDuplicateSuspects } from '../.harness/scripts/docs/lib/detect-duplicate-definition.mjs';

const SEED_SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '.harness/scripts/docs/feature-seed-check.mjs',
);

function runSeedCheck(query, rows) {
  const root = tmp('codi-seed-');
  mkdirSync(join(root, 'data'), { recursive: true });
  writeFileSync(join(root, 'data', 'feature-definitions.json'), JSON.stringify(rows));
  const res = spawnSync('node', [SEED_SCRIPT, query], {
    encoding: 'utf8',
    env: { ...process.env, HUB_ROOT: root },
  });
  rmSync(root, { recursive: true, force: true });
  return res.stdout || '';
}

const row = (id, title) => ({ Row_ID: id, Title: title });

test('숫자 접두사 같고 id 다름 → 의심', () => {
  const s = detectDuplicateSuspects([row('010-login', '로그인'), row('010-login-flow', '로그인 흐름')]);
  assert.equal(s.length, 1);
  assert.deepEqual([s[0].a, s[0].b].sort(), ['010-login', '010-login-flow']);
});

test('id 접두사 포함 → 의심', () => {
  const s = detectDuplicateSuspects([row('010-login', '로그인'), row('010-login-extra', '별개')]);
  assert.equal(s.length, 1);
});

test('Title 정규화 일치(공백/대소문자) → 의심', () => {
  const s = detectDuplicateSuspects([row('F-1', 'Sign In'), row('020-signin', 'sign in')]);
  assert.equal(s.length, 1);
});

test('전혀 다른 기능 → 의심 없음', () => {
  const s = detectDuplicateSuspects([row('010-login', '로그인'), row('900-report', '리포트')]);
  assert.equal(s.length, 0);
});

test('같은 Row_ID(정상 병합됨)는 의심 아님', () => {
  const s = detectDuplicateSuspects([row('010-login', '로그인'), row('010-login', '로그인')]);
  assert.equal(s.length, 0);
});

test('빈/1행 입력 방어', () => {
  assert.deepEqual(detectDuplicateSuspects([]), []);
  assert.deepEqual(detectDuplicateSuspects([row('010-a', 'A')]), []);
  assert.deepEqual(detectDuplicateSuspects(null), []);
});

test('숫자 접두사 없는 서로 다른 id + 다른 Title → 의심 없음(오탐 방지)', () => {
  const s = detectDuplicateSuspects([row('F-1', '로그인'), row('F-2', '결제')]);
  assert.equal(s.length, 0);
});

test('Title 부분 포함은 의심 아님 (실데이터 오탐 방지)', () => {
  // "로그인" ⊂ "관리자 로그인/비밀번호 재설정" 같은 별개 기능이 실데이터 213행에서
  // 대량 오탐을 냈다. 부분 포함은 더 이상 의심으로 보지 않는다.
  const s = detectDuplicateSuspects([
    row('SRC-U1-01', '로그인'),
    row('ADD-A0-001', '관리자 로그인/비밀번호 재설정'),
  ]);
  assert.equal(s.length, 0);
});

test('공백만 다른 Title은 완전일치로 의심 (구매내역 vs 구매 내역)', () => {
  const s = detectDuplicateSuspects([row('ADD-U8-006', '구매내역'), row('SRC-U8-02', '구매 내역')]);
  assert.equal(s.length, 1);
});

test('seed-check: 유사 원장 있으면 Row_ID 안내', () => {
  const out = runSeedCheck('로그인', [{ Row_ID: '010-login', Title: '이메일 로그인' }]);
  assert.match(out, /010-login/);
});

test('seed-check: 유사 원장 없으면 새 id 허용 안내', () => {
  const out = runSeedCheck('결제', [{ Row_ID: '010-login', Title: '이메일 로그인' }]);
  assert.match(out, /없음/);
});

test('seed-check: 카탈로그 FEAT ID 일치도 탐지한다', () => {
  const out = runSeedCheck('FEAT-LOGIN', [{ id: 'FEAT-LOGIN', title: '이메일 로그인' }]);
  assert.match(out, /FEAT-LOGIN/);
  assert.doesNotMatch(out, /없음/);
});

test('seed-check: legacy Row_ID 일치도 탐지한다', () => {
  const out = runSeedCheck('010-login', [{ Row_ID: '010-login', Title: '이메일 로그인' }]);
  assert.match(out, /010-login.*이메일 로그인/);
  assert.doesNotMatch(out, /없음/);
});
