// prune-downstream 확장 회귀 (specs/015 T008·T011, US1).
// 계약: specs/015-downstream-residue-cleanup/contracts/cli.md
// 실측 근거: 2026-07-30 6개 레포 감사 — 분류별 잔재가 어떤 정리 경로에도
// 걸리지 않고 영구 잔존했다.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { STALE_WORKCOPY_PATHS } from '../.harness/scripts/setup/upstream-project-state.mjs';
import {
  repoRoot,
  collectLinks,
  git,
  commitAll,
  lexists,
  link,
  makeDownstream,
  makePackage,
  tmp,
  write,
} from './helpers/downstream-fixture.mjs';

const SCRIPT = join(repoRoot, '.harness/scripts/setup/prune-downstream.mjs');

function runPrune(repo, ...args) {
  return spawnSync('node', [SCRIPT, ...args], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, HARNESS_ROOT: '' },
  });
}

// 실측 잔재 구성을 재현한 픽스처. 전부 커밋된(tracked) 상태로 만든다.
function makeResidueRepo() {
  const pkg = makePackage();
  const repo = makeDownstream(pkg);
  // shared-tracked: manifest 파일 링크 + 디렉터리-자체-링크
  link(repo, '.harness/config/sitemap-schema.json', join(pkg, '.harness/config/sitemap-schema.json'));
  link(repo, '.harness/vendor', join(pkg, '.harness'));
  // consumer-link: 소비 측 스킬 링크·rules/shared
  link(repo, '.claude/skills/codi-backend', join(pkg, '.harness/skills/codi-backend'));
  link(repo, '.claude/rules/shared', join(pkg, '.claude/rules'));
  // upstream-state: 통짜 경로
  write(repo, 'ROADMAP.md', '# harness roadmap\n');
  write(repo, 'docs/index.html', '<html>hub</html>\n');
  write(repo, 'examples/community-app/README.md', '# demo\n');
  // upstream-copy: 이름 일치 specs/tests + 내용 일치 data
  write(repo, 'specs/013-unify-naming-entrypoints/spec.md', '# harness spec\n');
  write(repo, 'specs/001-own-feature/spec.md', '# my spec\n');
  write(repo, 'tests/harness-cli.test.mjs', '// harness test\n');
  write(repo, 'data/decisions.json', '[]\n');
  // harness-selfstate
  write(repo, '.specify/feature.json', '{"feature_directory":"specs/013-unify-naming-entrypoints"}\n');
  write(repo, '.specify/memory/constitution.md', '# harness constitution\n');
  write(repo, '.specify/templates/spec-template.md', '# template\n');
  write(repo, 'README.md', '# Codi Harness v2\n');
  write(repo, 'package.json', '{"name":"codi-harness-v2","scripts":{"check":"npm test && ./harness doctor"}}\n');
  write(repo, 'package-lock.json', '{"name":"codi-harness-v2"}\n');
  write(repo, 'docs/audits/2026-07-07-planning-retirement.md', '# audit\n');
  write(repo, 'docs/audits/my-own-audit.md', '# mine\n');
  commitAll(repo, 'residue fixture');
  return { pkg, repo };
}

test('check: 분류별 잔재를 보고하고 아무것도 바꾸지 않는다', () => {
  const { repo } = makeResidueRepo();
  const before = git(repo, 'ls-files');
  const result = runPrune(repo);
  assert.equal(result.status, 0, result.stderr);
  for (const label of [
    'shared-tracked',
    'consumer-link',
    'upstream-state',
    'upstream-copy',
    'harness-selfstate',
  ]) {
    assert.match(result.stdout, new RegExp(label), `${label} 분류가 출력에 없음`);
  }
  assert.match(result.stdout, /\.harness\/vendor/);
  assert.match(result.stdout, /\.claude\/skills\/codi-backend/);
  assert.match(result.stdout, /README\.md/);
  // 읽기 전용: 인덱스·파일 불변
  assert.equal(git(repo, 'ls-files'), before);
  assert.ok(existsSync(join(repo, 'ROADMAP.md')));
});

test('apply: 분류별 동작 후 check 재실행이 0건이고 프로젝트 소유물은 남는다', () => {
  const { repo } = makeResidueRepo();
  const result = runPrune(repo, '--apply');
  assert.equal(result.status, 0, result.stderr);

  const tracked = new Set(git(repo, 'ls-files').split('\n'));
  // shared-tracked / consumer-link: 인덱스에서 회수, 워킹트리 링크는 유지
  for (const path of [
    '.harness/config/sitemap-schema.json',
    '.harness/vendor',
    '.claude/skills/codi-backend',
    '.claude/rules/shared',
  ]) {
    assert.ok(!tracked.has(path), `${path} 이 여전히 추적됨`);
    assert.ok(lexists(join(repo, path)), `${path} 워킹트리 링크가 사라짐`);
  }
  // upstream-state / upstream-copy: 파일 삭제
  for (const path of [
    'ROADMAP.md',
    'docs/index.html',
    'examples',
    'specs/013-unify-naming-entrypoints',
    'tests/harness-cli.test.mjs',
    'data/decisions.json',
    '.specify/feature.json',
    '.specify/memory/constitution.md',
    'package-lock.json',
    'docs/audits/2026-07-07-planning-retirement.md',
  ]) {
    assert.ok(!existsSync(join(repo, path)), `${path} 이 삭제되지 않음`);
  }
  // uncache: 벤더 자산은 파일 유지 + 추적 해제
  assert.ok(existsSync(join(repo, '.specify/templates/spec-template.md')));
  assert.ok(!tracked.has('.specify/templates/spec-template.md'));
  // README 스텁 교체, package.json 정규화(name=레포 디렉터리명)
  assert.equal(readFileSync(join(repo, 'README.md'), 'utf8'), `# ${basename(repo)}\n`);
  const pkgJson = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8'));
  assert.equal(pkgJson.name, basename(repo));
  assert.equal(pkgJson.scripts.check, './harness doctor');
  // 프로젝트 소유물 보존
  assert.ok(existsSync(join(repo, 'specs/001-own-feature/spec.md')));
  assert.ok(existsSync(join(repo, 'docs/audits/my-own-audit.md')));
  assert.ok(existsSync(join(repo, 'app/own-file.txt')));

  // 완료 집계는 실제 수행한 액션 줄 수와 일치해야 한다 (rollout 기록에 실림).
  const actionLines = result.stdout
    .split('\n')
    .filter((l) => /^\[prune-downstream\] (추적 해제|제거|README 스텁 교체|package\.json 정규화)/.test(l));
  const doneMatch = result.stdout.match(/완료 — (\d+)건 정리/);
  assert.ok(doneMatch, '완료 집계 줄이 없다');
  assert.equal(Number(doneMatch[1]), actionLines.length, '완료 집계와 액션 줄 수 불일치');

  // 재실행: 잔재 0 — 3회차까지 고정점(fixpoint) 확인.
  for (let i = 0; i < 2; i += 1) {
    const recheck = runPrune(repo);
    assert.equal(recheck.status, 0, recheck.stderr);
    assert.match(recheck.stdout, /정리 대상 없음/);
  }
});

test('stale-workcopy: 링크 자리를 막는 실사본을 잡아 정리한다 (v1.3.1 후속 2)', () => {
  // 실측(2026-07-30 롤아웃): .harness/vendor 실디렉터리(3개 레포)와
  // shared-manifest.json 실파일(account)이 비추적이라 어느 분류에도 안 잡혀
  // materialize 가 영구 보존("실파일 보존" 경고)했다. 해당 경로는 정책상
  // upstream 소유(skill-ownership)라 로컬 사본은 항상 stale 이다.
  const pkg = makePackage();
  const repo = makeDownstream(pkg);
  write(repo, 'app/keep.txt', 'mine\n');
  commitAll(repo, 'base');
  // 비추적 실사본 (구 copy 모드 잔재 재현)
  write(repo, '.harness/vendor/spec-kit/templates/spec-template.md', '# old vendor\n');
  write(repo, '.harness/shared-manifest.json', '{"files":[]}\n');
  // 추적 실파일 잔재 (uncache 후에도 파일이 링크 자리를 막는 케이스)
  write(repo, 'CONTRIBUTING.md', 'old contributing\n');
  git(repo, 'add', 'CONTRIBUTING.md');
  git(repo, 'commit', '-q', '-m', 'tracked real shared file');

  const check = runPrune(repo);
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, /stale-workcopy/);
  assert.match(check.stdout, /\.harness\/vendor/);
  assert.match(check.stdout, /\.harness\/shared-manifest\.json/);
  assert.match(check.stdout, /CONTRIBUTING\.md/);

  const apply = runPrune(repo, '--apply');
  assert.equal(apply.status, 0, apply.stderr);
  for (const p of ['.harness/vendor', '.harness/shared-manifest.json', 'CONTRIBUTING.md']) {
    assert.ok(!lexists(join(repo, p)), `${p} 실사본이 남았다`);
  }
  assert.ok(!git(repo, 'ls-files').split('\n').includes('CONTRIBUTING.md'));
  assert.ok(existsSync(join(repo, 'app/keep.txt')));
  const recheck = runPrune(repo);
  assert.match(recheck.stdout, /정리 대상 없음/);
});

test('stale-workcopy: 스킬 실디렉터리는 정리하되 skills-local 은 보존한다 (M-12)', () => {
  // migrate 중단·copy→lock 전환 실패·수동 복사로 남은 공유 스킬 실디렉터리는
  // 항상 stale 이다(skill-ownership). 반면 skills-local 은 프로젝트 소유 형제
  // 경로라 절대 삭제되면 안 된다 — 파괴적 삭제 경로의 경계 회귀.
  const pkg = makePackage();
  const repo = makeDownstream(pkg);
  write(repo, 'app/keep.txt', 'mine\n');
  commitAll(repo, 'base');
  const sharedSkillDir = ['.harness', 'skills', 'codi-backend'].join('/');
  write(repo, `${sharedSkillDir}/SKILL.md`, '# stale shared copy\n');
  write(repo, '.harness/skills-local/my-skill/SKILL.md', '# project skill\n');

  const check = runPrune(repo);
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, /stale-workcopy/);

  const apply = runPrune(repo, '--apply');
  assert.equal(apply.status, 0, apply.stderr);
  assert.ok(!lexists(join(repo, sharedSkillDir)), '공유 스킬 실디렉터리가 남았다');
  assert.ok(
    existsSync(join(repo, '.harness/skills-local/my-skill/SKILL.md')),
    'skills-local 이 삭제됐다 — 프로젝트 소유 경계 침범',
  );
  assert.ok(existsSync(join(repo, 'app/keep.txt')));
});

test('stale-workcopy: 심링크·copy 모드·프로젝트 소유 config 는 잡지 않는다 (v1.3.1 후속 2)', () => {
  const pkg = makePackage();
  // 심링크는 정상 상태 — 잡으면 안 된다.
  const repo = makeDownstream(pkg);
  link(repo, '.harness/policies', join(pkg, '.harness'));
  commitAll(repo, 'base');
  const check = runPrune(repo);
  assert.equal(check.status, 0, check.stderr);
  assert.doesNotMatch(check.stdout, /stale-workcopy/);

  // copy 모드(.harness/current 부재)에서는 실사본이 설계 자체다 — 미판정.
  const copyRepo = makeDownstream(pkg, { currentLink: false });
  write(copyRepo, '.harness/policies/guardrails.md', 'policy copy\n');
  write(copyRepo, 'CONTRIBUTING.md', 'copy-mode contributing\n');
  commitAll(copyRepo, 'copy mode');
  const copyCheck = runPrune(copyRepo);
  assert.equal(copyCheck.status, 0, copyCheck.stderr);
  assert.doesNotMatch(copyCheck.stdout, /stale-workcopy/);
});

// ── 드리프트 가드 (specs/016 H-1·H-7) ──
// 이전 가드(basename 부분문자열 단방향 소스 대조)는 링크 대상 삭제 시뮬레이션을
// 통과해 무효였다 (2026-07-31 감사 H-7). materialize 를 실제 실행해 얻은 링크
// 집합을 기준으로 세 목록을 정확 일치·양방향으로 고정한다.

// materialize 링크 대상이지만 stale-workcopy 비대상인 의도적 예외.
// 예외 원소는 아래 테스트에서 실재(실제 링크 존재)까지 검증한다.
const STALE_GUARD_ALLOWLIST = [
  '.harness/current', // 머신 캐시 대상 — 레포 내부 소유 경로가 아니다
  '.harness/scripts/', // KEEP_COMMITTED 하위(checks 등)가 실디렉터리인 것이 설계
  '.harness/config/', // project-owned 파일과 혼재 — 파일 단위 링크만 제공
  '.claude/skills/', // 소비 측 스킬 링크 — consumer-link 부류로 별도 정리
  '.agents/skills/', // 위와 동일 부류 — lock 모드 3종 누락 수정으로 생성 시작
];

function allowlisted(relPath) {
  return STALE_GUARD_ALLOWLIST.some(
    (ex) => relPath === ex || (ex.endsWith('/') && relPath.startsWith(ex)),
  );
}

// materialize 의 모든 링크 대상 부류에 실파일을 둔 패키지로 실행한다.
// 여기 빠진 부류는 링크가 생성되지 않아 가드가 검증하지 못한다.
function materializedLinkPaths() {
  const cacheDir = tmp('codi-guard-cache-');
  const pkg = join(cacheDir, 'versions', '1.0.0');
  write(pkg, '.harness/hooks/guardrails.mjs', '// hook\n');
  write(pkg, '.harness/policies/guardrails.md', 'policy\n');
  write(pkg, '.harness/imported-rules/database.md', 'rule\n');
  write(pkg, '.harness/prompt-style/karpathy.md', 'style\n');
  write(pkg, '.harness/vendor/speckit/README.md', 'vendor\n');
  write(pkg, '.harness/skills/codi-backend/SKILL.md', '# skill\n');
  write(pkg, '.harness/docs/packaging-guide.md', 'guide\n');
  write(pkg, '.harness/workflow.md', 'workflow\n');
  write(pkg, '.harness/manifest.json', '{}\n');
  write(pkg, '.harness/lock.json', '{}\n');
  write(pkg, '.harness/shared-manifest.json', '{"files":[]}\n');
  write(pkg, '.harness/scripts/setup/x.sh', '# setup\n');
  write(pkg, '.harness/scripts/checks/ci-node-verify.sh', '# keep\n');
  write(pkg, '.harness/config/sitemap-schema.json', '{}\n');
  write(pkg, '.claude/rules/phase-routing.md', 'rule\n');
  write(pkg, '.claude/settings.json', '{}\n');
  write(pkg, '.codex/rules/work-safety.rules', 'rules\n');
  write(pkg, '.codex/hooks.json', '{}\n');
  write(pkg, '.codex/config.example.toml', '# codex\n');
  write(pkg, 'ARCHITECTURE.md', '# arch\n');
  write(pkg, 'CONTRIBUTING.md', '# contrib\n');
  write(pkg, 'lint-staged.config.mjs', 'export default {}\n');
  write(pkg, 'docs/harness-overview.md', '# overview\n');
  write(pkg, 'docs/planning-hub-handoff.md', '# handoff\n');
  write(pkg, 'docs/feature-definition-planning-hub-guide.md', '# guide\n');
  const repo = tmp('codi-guard-repo-');
  const result = spawnSync(
    'sh',
    [join(repoRoot, '.harness/scripts/pkg/materialize.sh'), '1.0.0'],
    { cwd: repo, encoding: 'utf8', env: { ...process.env, CODI_HARNESS_CACHE_DIR: cacheDir } },
  );
  assert.equal(result.status, 0, result.stderr);
  return collectLinks(repo).map(([rel]) => rel);
}

test('드리프트 가드: materialize 링크 ∖ 예외 == STALE_WORKCOPY_PATHS (정확 일치 양방향)', () => {
  const links = materializedLinkPaths();
  // 죽은 예외 방지 — 예외 원소는 실제 링크 집합에 대응물이 있어야 한다.
  for (const ex of STALE_GUARD_ALLOWLIST) {
    assert.ok(
      links.some((l) => l === ex || (ex.endsWith('/') && l.startsWith(ex))),
      `예외 ${ex} 에 해당하는 링크가 실제로 없다 — 예외 목록이 낡았다`,
    );
  }
  const guarded = links.filter((l) => !allowlisted(l)).sort();
  assert.deepEqual(
    guarded,
    [...STALE_WORKCOPY_PATHS].sort(),
    'materialize 링크 대상과 STALE_WORKCOPY_PATHS 가 다르다 — 한쪽만 갱신됨',
  );
});

test('드리프트 가드: 픽스처 패키지가 materialize 링크 부류를 전부 커버한다', () => {
  // materialize 는 존재하는 대상만 링크하므로(`[ -e "$PKG/..." ]` 가드),
  // 픽스처에 파일이 빠진 부류는 링크가 아예 생성되지 않아 위의 정확 일치
  // 대조가 조용히 통과할 수 있다 (2026-07-31 리뷰 지적 #3 — H-1 재발 부류).
  // 링크 루프 토큰마다 실제 링크가 생겼는지 확인해 픽스처 누락을 실패로 만든다.
  const links = materializedLinkPaths();
  const src = readFileSync(
    join(repoRoot, '.harness/scripts/pkg/materialize.sh'),
    'utf8',
  );
  const tokens = [...src.matchAll(/for entry in ([\s\S]*?); do/g)]
    .flatMap((m) => m[1].replace(/\\\n/g, ' ').split(/\s+/))
    .filter(Boolean);
  assert.ok(tokens.includes('docs'), '링크 루프 파싱이 깨졌다 (docs 토큰 부재)');
  for (const t of tokens) {
    assert.ok(
      links.some((l) => l === t || l === `.harness/${t}` || l === `.codex/${t}`),
      `링크 루프 토큰 ${t} 에 대응하는 링크가 없다 — 가드 픽스처 패키지에 해당 파일을 추가하라`,
    );
  }
});

test('드리프트 가드: STALE_WORKCOPY_PATHS ⊆ lockModeEntries, .harness/docs 등재 (H-1)', () => {
  const cfg = JSON.parse(
    readFileSync(join(repoRoot, '.harness/config/required-gitignore.json'), 'utf8'),
  );
  const patterns = new Set(
    cfg.lockModeEntries.map((e) => (typeof e === 'string' ? e : e.pattern)),
  );
  for (const p of STALE_WORKCOPY_PATHS) {
    assert.ok(patterns.has(p), `${p} 가 lockModeEntries 에 없다`);
  }
  // H-1 회귀: 가이드 문서(.harness/docs)는 lock 전환에서 소실되면 안 된다 —
  // 링크·ignore·정리 세 목록 모두에 있어야 한다.
  assert.ok(
    STALE_WORKCOPY_PATHS.includes('.harness/docs'),
    '.harness/docs 가 stale-workcopy 목록에 없다 (lock 전환 시 가이드 영구 소실)',
  );
});

test('upstream-state: 프로젝트가 채운 ROADMAP.md 는 보존한다 (M-5)', () => {
  // ROADMAP 은 AGENTS.md 가 다운스트림 durable state 로 규정한 파일 —
  // 이름 판정으로 지우면 프로젝트 로드맵이 소실된다 (2026-07-31 감사 M-5).
  const pkg = makePackage();
  const repo = makeDownstream(pkg);
  write(repo, 'ROADMAP.md', '# ROADMAP\n\n| 내 기능 | in-progress |\n');
  commitAll(repo, 'own roadmap');
  const check = runPrune(repo);
  assert.equal(check.status, 0, check.stderr);
  assert.doesNotMatch(check.stdout, /ROADMAP\.md/);
  const apply = runPrune(repo, '--apply');
  assert.equal(apply.status, 0, apply.stderr);
  assert.ok(existsSync(join(repo, 'ROADMAP.md')), '수정된 ROADMAP 이 삭제됐다');
});

test('가드: 하네스 upstream 레포에서는 실행을 거부한다 (T011)', () => {
  const repo = makeDownstream(makePackage());
  git(repo, 'checkout', '-q', '-b', 'v2');
  commitAll(repo, 'upstream marker');
  const result = runPrune(repo);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /upstream/);
});

test('copy 모드: 패키지 없이도 통짜 경로·소비 측 링크는 잡고 내용 판정은 건너뛴다 (T011)', () => {
  const pkg = makePackage();
  const repo = makeDownstream(pkg, { currentLink: false });
  write(repo, 'ROADMAP.md', '# roadmap\n');
  write(repo, 'docs/index.html', '<html>hub</html>\n');
  write(repo, 'README.md', '# Codi Harness v2\n');
  write(repo, 'specs/013-unify-naming-entrypoints/spec.md', '# spec\n');
  link(repo, '.claude/skills/codi-backend', join(pkg, '.harness/skills/codi-backend'));
  commitAll(repo, 'copy mode fixture');
  const result = runPrune(repo);
  assert.equal(result.status, 0, result.stderr);
  // 통짜 경로와 소비 측 링크는 패키지 없이 판정 가능
  assert.match(result.stdout, /docs\/index\.html/);
  assert.match(result.stdout, /\.claude\/skills\/codi-backend/);
  // 내용·이름 비교가 필요한 판정은 기준(패키지)이 없어 보존 — ROADMAP 도
  // 바이트 판정 대상이라 기준 없이는 잡지 않는다 (M-5).
  assert.doesNotMatch(result.stdout, /ROADMAP\.md/);
  assert.doesNotMatch(result.stdout, /README\.md/);
  assert.doesNotMatch(result.stdout, /013-unify-naming-entrypoints/);
});
