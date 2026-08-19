// 루트 package.json harness-self 정규화 회귀 (specs/015 T004, 갭 2).
// 실측 근거: codi-hansi 의 name=codi-harness-v2, check 에 npm test 잔존
// (tests/ 부재로 깨진 참조, 2026-07-30).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeRootPackage } from '../.harness/scripts/setup/normalize-root-package.mjs';

const HARNESS_PKG = {
  name: 'codi-harness-v2',
  private: true,
  scripts: {
    test: 'node --test tests/*.test.mjs',
    'codex:replay-check': 'node --test --test-name-pattern "codex replay check" tests/*.test.mjs',
    check: 'npm test && ./harness doctor',
    doctor: './harness doctor',
    dev: 'npm run dev:front',
  },
};

test('harness-self 스크립트(test/codex:replay-check) 제거, check 는 doctor 만 남김', () => {
  const { pkg, changed } = normalizeRootPackage(structuredClone(HARNESS_PKG), {
    projectName: 'codi-my-app',
  });
  assert.equal(changed, true);
  assert.equal(pkg.scripts.test, undefined);
  assert.equal(pkg.scripts['codex:replay-check'], undefined);
  assert.equal(pkg.scripts.check, './harness doctor');
  assert.equal(pkg.scripts.dev, 'npm run dev:front');
});

test('name 이 codi-harness-v2 면 프로젝트 이름으로 교체', () => {
  const { pkg } = normalizeRootPackage(structuredClone(HARNESS_PKG), {
    projectName: 'codi-my-app',
  });
  assert.equal(pkg.name, 'codi-my-app');
});

test('자체 name 은 유지하고, 정규화할 것이 없으면 changed=false (멱등)', () => {
  const own = {
    name: 'codi-my-app',
    scripts: { check: './harness doctor', dev: 'vite' },
  };
  const { pkg, changed } = normalizeRootPackage(structuredClone(own), {
    projectName: 'codi-my-app',
  });
  assert.equal(changed, false);
  assert.deepEqual(pkg, own);
});
