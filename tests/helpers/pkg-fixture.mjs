// 패키지화 테스트 공용 픽스처 (specs/005-harness-packaging T001).
// 실제 네트워크·실제 홈을 절대 건드리지 않는다: 가짜 업스트림은 로컬
// bare repo, 캐시/HOME은 임시 디렉토리, 다운스트림은 최소 스캐폴드.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitRaw as git, tmp } from './fixture-base.mjs';

// 태그가 있는 가짜 업스트림 bare repo를 만든다.
// versions: [{ version: '1.0.0', files: { 'claude-rules/base.md': '...' } }]
export function makeFakeUpstream(versions) {
  const work = tmp('codi-pkg-upstream-work-');
  const bare = tmp('codi-pkg-upstream-');
  git(bare, 'init', '--bare', '--initial-branch=main', '.');
  git(work, 'init', '--initial-branch=main', '.');
  git(work, 'remote', 'add', 'origin', bare);
  git(work, 'config', 'user.email', 'test@example.com');
  git(work, 'config', 'user.name', 'pkg-fixture');
  for (const { version, files = {} } of versions) {
    const allFiles = { 'VERSION.txt': version, ...files };
    for (const [rel, content] of Object.entries(allFiles)) {
      const abs = join(work, rel);
      mkdirSync(join(abs, '..'), { recursive: true });
      writeFileSync(abs, content);
    }
    git(work, 'add', '-A');
    git(work, 'commit', '-m', `release ${version}`);
    git(work, 'tag', '-a', `v${version}`, '-m', `v${version}`);
  }
  git(work, 'push', 'origin', 'main', '--tags');
  return { bare, work, addVersion: (v) => addUpstreamVersion({ work }, v) };
}

// 기존 업스트림에 새 버전 태그를 추가한다 (US2 시나리오).
export function addUpstreamVersion({ work }, { version, files = {} }) {
  const allFiles = { 'VERSION.txt': version, ...files };
  for (const [rel, content] of Object.entries(allFiles)) {
    const abs = join(work, rel);
    mkdirSync(join(abs, '..'), { recursive: true });
    writeFileSync(abs, content);
  }
  git(work, 'add', '-A');
  git(work, 'commit', '-m', `release ${version}`);
  git(work, 'tag', '-a', `v${version}`, '-m', `v${version}`);
  git(work, 'push', 'origin', 'main', '--tags');
}

// 격리된 캐시 루트와 HOME.
export function makeIsolatedEnv() {
  return {
    cacheDir: tmp('codi-pkg-cache-'),
    home: tmp('codi-pkg-home-'),
  };
}

// 복사본 커밋형(구 방식) 가짜 다운스트림 — migrate 테스트용 (specs/006 T001).
// sharedFiles는 커밋되고, 같은 목록이 패키지의 shared-manifest.json에 실린다.
// projectFiles는 프로젝트 소유물로 함께 커밋된다.
export function makeLegacyDownstream({ sharedFiles = {}, projectFiles = {} }) {
  const repo = tmp('codi-pkg-legacy-');
  git(repo, 'init', '--initial-branch=main', '.');
  git(repo, 'config', 'user.email', 'test@example.com');
  git(repo, 'config', 'user.name', 'legacy-fixture');
  const all = { ...sharedFiles, ...projectFiles };
  for (const [rel, content] of Object.entries(all)) {
    const abs = join(repo, rel);
    mkdirSync(join(abs, '..'), { recursive: true });
    writeFileSync(abs, content);
  }
  git(repo, 'add', '-A');
  git(repo, 'commit', '-m', 'legacy downstream seed');
  return repo;
}

// migrate용 패키지 업스트림 — 패키지 안에 shared-manifest.json을 포함시킨다.
export function makeMigrateUpstream({ version = '1.0.0', sharedFiles = {} }) {
  const manifest = {
    schema_version: 1,
    file_count: Object.keys(sharedFiles).length,
    files: Object.keys(sharedFiles).sort(),
  };
  return makeFakeUpstream([
    {
      version,
      files: {
        ...sharedFiles,
        '.harness/shared-manifest.json': JSON.stringify(manifest, null, 2),
      },
    },
  ]);
}

// lock 파일이 있는 최소 다운스트림 레포 스캐폴드.
export function makeDownstreamRepo(lock) {
  const repo = tmp('codi-pkg-repo-');
  mkdirSync(join(repo, '.claude/rules'), { recursive: true });
  mkdirSync(join(repo, '.harness'), { recursive: true });
  if (lock !== undefined) {
    writeFileSync(join(repo, 'harness.lock'), JSON.stringify(lock, null, 2));
  }
  return repo;
}
