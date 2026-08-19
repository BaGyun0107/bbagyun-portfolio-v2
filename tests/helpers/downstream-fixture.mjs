// 다운스트림 잔재 픽스처 헬퍼 (specs/015-downstream-residue-cleanup T001).
// 가짜 패키지 캐시 + 잔재를 가진 가짜 다운스트림 git 레포를 만든다.
// 관례: bootstrap-flow.test.mjs 의 mkdtemp + spawnSync 격리 패턴.
import { mkdirSync, readdirSync, readlinkSync, symlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gitRaw, initGitRepo, lexists, tmp, write } from './fixture-base.mjs';

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// 공통 기반 재수출 — 기존 소비자 API 유지 (specs/016 L-9).
export { initGitRepo, lexists, tmp, write };

export function git(cwd, ...args) {
  return gitRaw(cwd, ...args).trim();
}

export function commitAll(dir, message = 'fixture') {
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', message, '--allow-empty');
}

export function link(base, relPath, target) {
  const abs = join(base, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  symlinkSync(target, abs);
  return abs;
}

// 레포 안 모든 심링크의 [상대경로, 링크값] 목록. materialize 산출 검증과
// 드리프트 가드(specs/016 H-7)가 공유한다.
export function collectLinks(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const abs = join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      out.push([abs.slice(base.length + 1), readlinkSync(abs)]);
    } else if (entry.isDirectory()) {
      out.push(...collectLinks(abs, base));
    }
  }
  return out;
}

// 가짜 하네스 패키지(버전 캐시 내용물). 판정 기준으로 쓰이는 최소 구성.
export function makePackage(opts = {}) {
  const pkg = tmp('codi-pkg-');
  write(pkg, 'specs/013-unify-naming-entrypoints/spec.md', '# harness spec\n');
  write(pkg, 'tests/harness-cli.test.mjs', '// harness test\n');
  write(pkg, 'docs/audits/2026-07-07-planning-retirement.md', '# audit\n');
  write(pkg, 'data/decisions.json', '[]\n');
  write(pkg, 'README.md', '# Codi Harness v2\n');
  // ROADMAP 바이트 판정(M-5)의 기준 사본 — 잔재 픽스처와 동일 내용.
  write(pkg, 'ROADMAP.md', '# harness roadmap\n');
  write(
    pkg,
    'package.json',
    `${JSON.stringify(
      {
        name: 'codi-harness-v2',
        private: true,
        scripts: {
          test: 'node --test tests/*.test.mjs',
          'codex:replay-check': 'node --test tests/*.test.mjs',
          check: 'npm test && ./harness doctor',
          doctor: './harness doctor',
        },
      },
      null,
      2,
    )}\n`,
  );
  write(pkg, 'package-lock.json', '{"name":"codi-harness-v2"}\n');
  write(pkg, '.specify/templates/spec-template.md', '# template\n');
  write(pkg, '.specify/memory/constitution.md', '# harness constitution\n');
  write(pkg, '.harness/skills/codi-backend/SKILL.md', '# skill\n');
  write(pkg, '.harness/config/sitemap-schema.json', '{"a":1}\n');
  const manifestFiles = opts.manifestFiles ?? [
    '.harness/config/sitemap-schema.json',
    '.harness/skills/codi-backend/SKILL.md',
    'CONTRIBUTING.md',
  ];
  write(
    pkg,
    '.harness/shared-manifest.json',
    `${JSON.stringify({ files: manifestFiles }, null, 2)}\n`,
  );
  return pkg;
}

// 잔재를 가진 가짜 다운스트림 레포. opts 플래그로 잔재 구성을 고른다.
// 반환: 레포 절대 경로. 잔재는 전부 커밋된(tracked) 상태다.
export function makeDownstream(pkg, opts = {}) {
  const repo = tmp('codi-downstream-');
  initGitRepo(repo);
  write(repo, 'harness.lock', '{"schema_version":1,"channel":"latest-minor"}\n');
  write(repo, 'app/own-file.txt', 'project-owned\n');
  if (opts.currentLink !== false) {
    link(repo, '.harness/current', pkg);
  }
  return repo;
}
