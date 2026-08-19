// lock 모드 materialize 의 스킬 트리 3종 누락 회귀 (2026-08-03 다운스트림 보고).
// 계약: materialize 는 skills-link.sh 와 같은 결과를 내야 한다 —
// (1) .claude/skills 와 .agents/skills 엔트리 집합 동일
// (2) .harness/skills-local 병합 포함
// (3) 이름 충돌 시 fail-fast
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot, tmp, write } from './helpers/downstream-fixture.mjs';

// 가짜 캐시 버전 + lock 다운스트림 레포를 만들고 materialize 를 실행한다.
function setup({ withPkgSkillsLink = true, localSkills = ['my-local-skill'] } = {}) {
  const cacheDir = tmp('codi-cache-');
  const pkg = join(cacheDir, 'versions', '1.0.0');
  mkdirSync(pkg, { recursive: true });
  write(pkg, '.harness/skills/codi-backend/SKILL.md', '# backend\n');
  write(pkg, '.harness/skills/codi-frontend/SKILL.md', '# frontend\n');
  write(pkg, '.harness/skills/_shared/common.md', 'shared asset\n');
  if (withPkgSkillsLink) {
    cpSync(
      join(repoRoot, '.harness/scripts/setup/skills-link.sh'),
      join(pkg, '.harness/scripts/setup/skills-link.sh'),
    );
  }
  const repo = tmp('codi-lock-repo-');
  for (const name of localSkills) {
    write(repo, `.harness/skills-local/${name}/SKILL.md`, `# ${name}\n`);
  }
  const result = spawnSync(
    'sh',
    [join(repoRoot, '.harness/scripts/pkg/materialize.sh'), '1.0.0'],
    {
      cwd: repo,
      encoding: 'utf8',
      env: { ...process.env, CODI_HARNESS_CACHE_DIR: cacheDir },
    },
  );
  return { cacheDir, pkg, repo, result };
}

function treeEntries(repo, tree) {
  return readdirSync(join(repo, tree)).sort();
}

test('lock: materialize 후 두 스킬 트리의 엔트리 집합이 동일하다', () => {
  const { repo, result } = setup();
  assert.equal(result.status, 0, result.stderr);
  const claude = treeEntries(repo, '.claude/skills');
  const agents = treeEntries(repo, '.agents/skills');
  assert.deepEqual(agents, claude);
  assert.ok(claude.includes('codi-backend'), `업스트림 스킬 누락: ${claude}`);
});

test('lock: skills-local 스킬이 두 트리 모두에 나타난다', () => {
  const { repo, result } = setup();
  assert.equal(result.status, 0, result.stderr);
  for (const tree of ['.claude/skills', '.agents/skills']) {
    assert.equal(
      readFileSync(join(repo, tree, 'my-local-skill/SKILL.md'), 'utf8'),
      '# my-local-skill\n',
      `${tree} 에 skills-local 스킬이 없다`,
    );
  }
});

test('lock: 두 트리의 링크가 lock 된 버전(캐시 패키지)으로 해석된다', () => {
  const { pkg, repo, result } = setup();
  assert.equal(result.status, 0, result.stderr);
  const pkgReal = realpathSync(pkg);
  for (const tree of ['.claude/skills', '.agents/skills']) {
    const real = realpathSync(join(repo, tree, 'codi-backend'));
    assert.ok(
      real.startsWith(pkgReal),
      `${tree}/codi-backend 이 캐시 밖을 가리킨다: ${real}`,
    );
  }
});

test('lock: skills/<name> 과 skills-local/<name> 충돌 시 fail-fast 한다', () => {
  const { result } = setup({ localSkills: ['codi-backend'] });
  assert.notEqual(result.status, 0, 'materialize 가 충돌을 통과시켰다');
  assert.match(result.stderr, /충돌/);
});

test('lock: 구버전 materialize 가 남긴 트리(구형 링크·.agents 부재)가 재실행으로 수렴한다', () => {
  const { cacheDir, repo, result } = setup();
  assert.equal(result.status, 0, result.stderr);
  // 구버전 산출 재현: .agents 트리를 지우고 .claude 링크를 구형(current 직결)으로 되돌린다.
  spawnSync('rm', ['-rf', join(repo, '.agents')]);
  spawnSync('rm', ['-f', join(repo, '.claude/skills/codi-backend')]);
  spawnSync('ln', [
    '-s',
    '../../.harness/current/.harness/skills/codi-backend',
    join(repo, '.claude/skills/codi-backend'),
  ]);
  const again = spawnSync(
    'sh',
    [join(repoRoot, '.harness/scripts/pkg/materialize.sh'), '1.0.0'],
    {
      cwd: repo,
      encoding: 'utf8',
      env: { ...process.env, CODI_HARNESS_CACHE_DIR: cacheDir },
    },
  );
  assert.equal(again.status, 0, again.stderr);
  assert.deepEqual(treeEntries(repo, '.agents/skills'), treeEntries(repo, '.claude/skills'));
});

test('lock: 패키지에 skills-link.sh 가 없어도(구버전 캐시) 레포 사본으로 폴백한다', () => {
  const { repo, result } = setup({ withPkgSkillsLink: false });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(treeEntries(repo, '.agents/skills'), treeEntries(repo, '.claude/skills'));
  assert.ok(treeEntries(repo, '.claude/skills').includes('my-local-skill'));
});
