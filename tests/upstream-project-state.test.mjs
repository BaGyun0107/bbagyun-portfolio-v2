// harness-selfstate 판정 회귀 (specs/015 T003, 갭 2).
// 실측 근거: 6/6 레포의 .specify/feature.json 이 하네스 spec(013)을 가리키고,
// docs/audits 10개·하네스 README 가 project-owned 보호로 영구 잔존 (2026-07-30).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectHarnessSelfstate } from '../.harness/scripts/setup/upstream-project-state.mjs';
import { makePackage, write, tmp } from './helpers/downstream-fixture.mjs';

function actions(found) {
  return Object.fromEntries(found.map((f) => [f.path, f.action]));
}

test('.specify: 하네스 spec 을 가리키는 feature.json 은 delete, 자체 spec 은 보존', () => {
  const pkg = makePackage();
  const repo = tmp('codi-repo-');
  write(repo, '.specify/feature.json', '{"feature_directory":"specs/013-unify-naming-entrypoints"}\n');
  const map = actions(selectHarnessSelfstate(repo, pkg));
  assert.equal(map['.specify/feature.json'], 'delete');

  const repo2 = tmp('codi-repo-');
  write(repo2, '.specify/feature.json', '{"feature_directory":"specs/001-own-feature"}\n');
  const map2 = actions(selectHarnessSelfstate(repo2, pkg));
  assert.equal(map2['.specify/feature.json'], undefined);
});

test('.specify: constitution 바이트 일치는 delete, 수정본은 보존', () => {
  const pkg = makePackage();
  const repo = tmp('codi-repo-');
  write(repo, '.specify/memory/constitution.md', '# harness constitution\n');
  const map = actions(selectHarnessSelfstate(repo, pkg));
  assert.equal(map['.specify/memory/constitution.md'], 'delete');

  const repo2 = tmp('codi-repo-');
  write(repo2, '.specify/memory/constitution.md', '# project constitution\n');
  const map2 = actions(selectHarnessSelfstate(repo2, pkg));
  assert.equal(map2['.specify/memory/constitution.md'], undefined);
});

test('.specify: 벤더 자산 바이트 일치는 uncache(파일 유지·추적만 해제)', () => {
  const pkg = makePackage();
  const repo = tmp('codi-repo-');
  write(repo, '.specify/templates/spec-template.md', '# template\n');
  const map = actions(selectHarnessSelfstate(repo, pkg));
  assert.equal(map['.specify/templates/spec-template.md'], 'uncache');
});

test('README: 구버전 사본(바이트 불일치)도 하네스 제목이면 stub-readme (v1.3.1 후속 1)', () => {
  // 실측(2026-07-30 롤아웃): 6/6 레포 README 가 clone 시점 구버전이라 현행
  // 패키지와 바이트가 달라 미판정 — 제목 줄은 하네스 마커라 정확 판정 가능.
  const pkg = makePackage();
  const repo = tmp('codi-repo-');
  write(repo, 'README.md', '# Codi Harness v2\n\n옛날 버전 본문입니다.\n');
  const map = actions(selectHarnessSelfstate(repo, pkg));
  assert.equal(map['README.md'], 'stub-readme');

  // 프로젝트가 제목을 바꿨으면 본문이 무엇이든 보존.
  const repo2 = tmp('codi-repo-');
  write(repo2, 'README.md', '# My App\n\nCodi Harness v2 기반 프로젝트.\n');
  const map2 = actions(selectHarnessSelfstate(repo2, pkg));
  assert.equal(map2['README.md'], undefined);
});

test('README: 하네스 원본 그대로면 stub-readme, 수정본은 보존', () => {
  const pkg = makePackage();
  const repo = tmp('codi-repo-');
  write(repo, 'README.md', '# Codi Harness v2\n');
  const map = actions(selectHarnessSelfstate(repo, pkg));
  assert.equal(map['README.md'], 'stub-readme');

  const repo2 = tmp('codi-repo-');
  write(repo2, 'README.md', '# My Project\n');
  const map2 = actions(selectHarnessSelfstate(repo2, pkg));
  assert.equal(map2['README.md'], undefined);
});

test('package.json/lock: 하네스 이름·lock 원본 일치는 normalize/delete', () => {
  const pkg = makePackage();
  const repo = tmp('codi-repo-');
  write(repo, 'package.json', '{"name":"codi-harness-v2","scripts":{"test":"node --test tests/*.test.mjs"}}\n');
  write(repo, 'package-lock.json', '{"name":"codi-harness-v2"}\n');
  const map = actions(selectHarnessSelfstate(repo, pkg));
  assert.equal(map['package.json'], 'normalize');
  assert.equal(map['package-lock.json'], 'delete');
});

test('docs/audits: 이름+내용 일치만 delete, 이름 같고 내용 다르면 보존', () => {
  const pkg = makePackage();
  const repo = tmp('codi-repo-');
  write(repo, 'docs/audits/2026-07-07-planning-retirement.md', '# audit\n');
  write(repo, 'docs/audits/my-own-audit.md', '# mine\n');
  const map = actions(selectHarnessSelfstate(repo, pkg));
  assert.equal(map['docs/audits/2026-07-07-planning-retirement.md'], 'delete');
  assert.equal(map['docs/audits/my-own-audit.md'], undefined);

  const repo2 = tmp('codi-repo-');
  write(repo2, 'docs/audits/2026-07-07-planning-retirement.md', '# modified by project\n');
  const map2 = actions(selectHarnessSelfstate(repo2, pkg));
  assert.equal(map2['docs/audits/2026-07-07-planning-retirement.md'], undefined);
});

test('패키지가 없으면(copy 모드) 아무것도 판정하지 않는다', () => {
  const repo = tmp('codi-repo-');
  write(repo, 'README.md', '# Codi Harness v2\n');
  assert.deepEqual(selectHarnessSelfstate(repo, '/nonexistent-pkg'), []);
});
