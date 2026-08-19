// 021: php-monolith 프로필 계약 (contracts/profile-php-monolith.md).
// CLI 렌더/check, 가드 차단/통과 행렬(기존 모드 회귀 포함), 인젝터 스킵.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { tmp } from './helpers/fixture-base.mjs';
import { runNode } from './helpers/cli-fixture.mjs';

const PROFILE = '.harness/scripts/tooling/profile.mjs';
const GUARD = '.harness/hooks/project-profile-guard.mjs';
const INJECTOR = '.harness/hooks/skill-injector.mjs';

function makeProject(mode) {
  const dir = tmp('codi-php-monolith-test-');
  mkdirSync(join(dir, '.harness', 'config'), { recursive: true });
  // dev-role 1회성 힌트가 통과(빈 출력) 판정에 섞이지 않게 억제한다
  mkdirSync(join(dir, '.harness', 'state'), { recursive: true });
  writeFileSync(join(dir, '.harness', 'state', 'dev-role-hint-shown'), 'x\n');
  if (mode) {
    writeFileSync(
      join(dir, '.harness', 'config', 'project-profile.yaml'),
      `mode: ${mode}\n`,
    );
  }
  return dir;
}

test('profile list includes php-monolith and keeps the existing five modes', () => {
  const listed = runNode(PROFILE, ['list']);
  assert.equal(listed.status, 0, listed.stderr);
  for (const mode of [
    'php-monolith',
    'planning-only',
    'split-front-back',
    'next-fullstack',
    'frontend-only',
    'backend-only',
  ]) {
    assert.match(listed.stdout, new RegExp(`^${mode}: `, 'm'), `missing mode: ${mode}`);
  }
});

test('profile set php-monolith renders disabled node surfaces and passes check', () => {
  const project = makeProject(null);
  const set = runNode(PROFILE, ['set', 'php-monolith'], { cwd: project });
  assert.equal(set.status, 0, set.stderr);

  const yaml = readFileSync(
    join(project, '.harness', 'config', 'project-profile.yaml'),
    'utf8',
  );
  assert.match(yaml, /^mode: php-monolith$/m);
  // front/back 스키마 블록 유지 + 둘 다 disabled (research D1)
  assert.match(yaml, /front:\n\s+path: apps\/front\n\s+enabled: false/);
  assert.match(yaml, /back:\n\s+path: apps\/back\n\s+enabled: false/);
  // rules 블록: 금지 경로 + 소유 스킬
  assert.match(yaml, /php-monolith:/);
  assert.match(yaml, /apps\/front\/\*\*/);
  assert.match(yaml, /apps\/back\/\*\*/);
  assert.match(yaml, /owner_skill: codi-gnuboard/);

  const checked = runNode(PROFILE, ['check'], { cwd: project });
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  assert.match(checked.stdout, /ok: project profile php-monolith/);
});

test('profile set keeps existing split-front-back rendering (regression)', () => {
  const project = makeProject(null);
  const set = runNode(PROFILE, ['set', 'split-front-back'], { cwd: project });
  assert.equal(set.status, 0, set.stderr);
  const yaml = readFileSync(
    join(project, '.harness', 'config', 'project-profile.yaml'),
    'utf8',
  );
  assert.match(yaml, /front:\n\s+path: apps\/front\n\s+enabled: true/);
  const checked = runNode(PROFILE, ['check'], { cwd: project });
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
});

test('guard blocks node app surfaces in php-monolith but allows mall paths', () => {
  const project = makeProject('php-monolith');
  const run = (toolInput) =>
    runNode(GUARD, [], {
      cwd: project,
      input: JSON.stringify({ cwd: project, tool_input: toolInput }),
    });

  // Node 표면 차단 + codi-gnuboard 라우팅 안내 (research D2)
  const frontBlocked = run({ file_path: 'apps/front/src/page.tsx', content: 'x' });
  assert.match(frontBlocked.stdout, /"decision":"block"/);
  assert.match(frontBlocked.stdout, /codi-gnuboard/);
  const backBlocked = run({ file_path: 'apps/back/src/server.ts', content: 'x' });
  assert.match(backBlocked.stdout, /"decision":"block"/);

  // 몰 경로와 무관 명령은 통과
  const mallWrite = run({ file_path: 'apps/bzmall/shop/list.php', content: 'x' });
  assert.equal(mallWrite.stdout, '');
  const bashRead = run({ command: 'cat apps/bzmall/common.php' });
  assert.equal(bashRead.stdout, '');
});

test('guard keeps existing mode behavior (regression matrix)', () => {
  const cases = [
    { mode: 'next-fullstack', target: 'apps/back/src/a.ts', blocked: true },
    { mode: 'next-fullstack', target: 'apps/front/src/a.ts', blocked: false },
    { mode: 'backend-only', target: 'apps/front/src/a.tsx', blocked: true },
    { mode: 'split-front-back', target: 'apps/back/src/a.ts', blocked: false },
    { mode: 'planning-only', target: 'apps/front/src/a.tsx', blocked: true },
  ];
  for (const { mode, target, blocked } of cases) {
    const project = makeProject(mode);
    const res = runNode(GUARD, [], {
      cwd: project,
      input: JSON.stringify({
        cwd: project,
        tool_input: { file_path: target, content: 'x' },
      }),
    });
    if (blocked) {
      assert.match(res.stdout, /"decision":"block"/, `${mode} should block ${target}`);
    } else {
      assert.equal(res.stdout, '', `${mode} should allow ${target}`);
    }
  }
});

test('injector skips node skills in php-monolith and suggests codi-gnuboard', () => {
  const project = makeProject('php-monolith');
  // 인젝터는 프로젝트의 트리거·스킬 디렉터리를 읽는다 — 최소 픽스처 구성
  writeFileSync(
    join(project, '.harness', 'config', 'skill-triggers.json'),
    JSON.stringify({
      'codi-backend': { keywords: ['api'] },
      'codi-frontend': { keywords: ['ui'] },
      'codi-gnuboard': { keywords: ['그누보드'] },
    }),
  );
  for (const name of ['codi-backend', 'codi-frontend', 'codi-gnuboard']) {
    mkdirSync(join(project, '.harness', 'skills', name), { recursive: true });
    writeFileSync(
      join(project, '.harness', 'skills', name, 'SKILL.md'),
      `---\nname: ${name}\n---\n`,
    );
  }

  const res = runNode(INJECTOR, [], {
    input: JSON.stringify({ prompt: 'api ui 그누보드 수정', cwd: project }),
  });
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /codi-gnuboard/);
  assert.doesNotMatch(res.stdout, /codi-backend/);
  assert.doesNotMatch(res.stdout, /codi-frontend/);
});
