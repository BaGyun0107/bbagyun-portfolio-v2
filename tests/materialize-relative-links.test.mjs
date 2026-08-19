// 리포 내부 링크 상대경로 불변식 (specs/015 T019, US4·갭 5).
// 실측 근거: 2026-07-30 감사 — 커밋된 심링크 46개 전부 절대경로(생성자 홈
// 경로 포함). 절대 링크는 생성 머신에서만 유효해 clone 한 두 번째 사람에게서
// 처음 깨진다. 계약: .harness/current(머신 캐시 대상)만 절대경로 예외.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  symlinkSync,
  rmSync,
} from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { collectLinks, repoRoot, tmp, write } from './helpers/downstream-fixture.mjs';

// 가짜 캐시 버전 + 레포를 만들고 materialize 를 실행한다.
function runMaterialize() {
  const cacheDir = tmp('codi-cache-');
  const pkg = join(cacheDir, 'versions', '1.0.0');
  mkdirSync(pkg, { recursive: true });
  write(pkg, '.harness/hooks/guardrails.mjs', '// hook\n');
  write(pkg, '.harness/policies/guardrails.md', 'policy\n');
  write(pkg, '.harness/skills/codi-backend/SKILL.md', '# skill\n');
  write(pkg, '.harness/scripts/setup/x.sh', '# setup\n');
  write(pkg, '.harness/shared-manifest.json', '{"files":[]}\n');
  write(pkg, '.harness/config/sitemap-schema.json', '{"a":1}\n');
  write(pkg, '.claude/rules/phase-routing.md', 'rule\n');
  write(pkg, '.claude/settings.json', '{}\n');
  write(pkg, '.codex/rules/work-safety.rules', 'rules\n');
  write(pkg, 'ARCHITECTURE.md', '# arch\n');

  const repo = tmp('codi-mat-repo-');
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

test('US4: materialize 링크는 .harness/current 만 절대, 나머지는 전부 상대경로다', () => {
  const { repo, result } = runMaterialize();
  assert.equal(result.status, 0, result.stderr);

  const links = collectLinks(repo);
  assert.ok(links.length > 3, `링크가 너무 적다: ${JSON.stringify(links)}`);
  for (const [rel, value] of links) {
    if (rel === '.harness/current') {
      assert.ok(isAbsolute(value), '.harness/current 는 절대경로(머신 캐시)여야 한다');
    } else {
      assert.ok(!isAbsolute(value), `${rel} -> ${value} 는 상대경로여야 한다`);
    }
  }
  // 링크 해석이 유효하다 (current 경유).
  assert.equal(
    readFileSync(join(repo, '.harness/config/sitemap-schema.json'), 'utf8'),
    '{"a":1}\n',
  );
  assert.equal(readFileSync(join(repo, 'ARCHITECTURE.md'), 'utf8'), '# arch\n');
});

test('US4: 레포를 다른 경로로 옮겨도 링크가 유효하다 (current 만 재작성 대상)', () => {
  const { repo, result } = runMaterialize();
  assert.equal(result.status, 0, result.stderr);
  const moved = join(tmp('codi-moved-'), 'relocated');
  cpSync(repo, moved, { recursive: true, verbatimSymlinks: true });
  // current(절대)는 그대로 유효하고, 내부 상대 링크는 새 위치에서도 풀린다.
  assert.equal(
    readFileSync(join(moved, '.harness/config/sitemap-schema.json'), 'utf8'),
    '{"a":1}\n',
  );
});

test('US4: 절대경로 링크가 남은 레포는 재실행 시 상대경로로 수렴한다', () => {
  const first = runMaterialize();
  assert.equal(first.result.status, 0, first.result.stderr);
  // 구버전이 만든 절대 링크를 재현한다.
  rmSync(join(first.repo, '.claude/settings.json'), { force: true });
  symlinkSync(
    join(first.repo, '.harness/current/.claude/settings.json'),
    join(first.repo, '.claude/settings.json'),
  );
  const again = spawnSync(
    'sh',
    [join(repoRoot, '.harness/scripts/pkg/materialize.sh'), '1.0.0'],
    {
      cwd: first.repo,
      encoding: 'utf8',
      env: { ...process.env, CODI_HARNESS_CACHE_DIR: first.cacheDir },
    },
  );
  assert.equal(again.status, 0, again.stderr);
  const value = readlinkSync(join(first.repo, '.claude/settings.json'));
  assert.ok(!isAbsolute(value), `재실행 후에도 절대경로가 남았다: ${value}`);
});

test('US4: skills-link 가 만드는 스킬 링크도 상대경로이고 멱등이다', () => {
  const repo = tmp('codi-skills-repo-');
  // skills-link 는 스크립트 위치에서 ROOT 를 잡는다 — 레포 안에 복사해 실행.
  write(repo, '.harness/skills/codi-backend/SKILL.md', '# skill\n');
  write(repo, '.harness/skills-local/my-skill/SKILL.md', '# mine\n');
  cpSync(
    join(repoRoot, '.harness/scripts/setup/skills-link.sh'),
    join(repo, '.harness/scripts/setup/skills-link.sh'),
  );
  const run = () =>
    spawnSync('sh', [join(repo, '.harness/scripts/setup/skills-link.sh')], {
      cwd: repo,
      encoding: 'utf8',
    });
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  for (const tree of ['.claude/skills', '.agents/skills']) {
    for (const name of ['codi-backend', 'my-skill']) {
      const value = readlinkSync(join(repo, tree, name));
      assert.ok(!isAbsolute(value), `${tree}/${name} -> ${value} 는 상대경로여야 한다`);
      assert.equal(
        readFileSync(join(repo, tree, name, 'SKILL.md'), 'utf8').length > 0,
        true,
      );
    }
  }
  // 멱등: 재실행해도 값이 같다.
  const before = readlinkSync(join(repo, '.claude/skills/codi-backend'));
  const second = run();
  assert.equal(second.status, 0, second.stderr);
  assert.equal(readlinkSync(join(repo, '.claude/skills/codi-backend')), before);
});
