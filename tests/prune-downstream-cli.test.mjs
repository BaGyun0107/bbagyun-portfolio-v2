// prune-downstream CLI 회귀 — harness-cli.test.mjs 에서 분할 이동
// (specs/017 M-15·M-16: 237KB 단일 파일 비대화 해소 + 픽스처 헬퍼 통일).
// 판정 단위 회귀는 tests/prune-downstream-project-state.test.mjs 참조.
import assert from 'node:assert/strict';
import test from 'node:test';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { runNode } from './helpers/cli-fixture.mjs';
import { initGitRepo, repoRoot as root, tmp } from './helpers/downstream-fixture.mjs';

// prune-downstream: 다운스트림 upstream 전용 파일 정리
function makeFakeDownstream() {
  const dir = tmp('codi-harness-ds-');
  mkdirSync(join(dir, '.specify'), { recursive: true });
  mkdirSync(join(dir, 'specs'), { recursive: true });
  mkdirSync(join(dir, 'docs'), { recursive: true });
  writeFileSync(join(dir, 'ROADMAP.md'), '# roadmap\n');
  writeFileSync(join(dir, 'docs', 'index.html'), '<html></html>\n');
  writeFileSync(join(dir, 'specs', 'x.md'), 'x\n');
  // origin 없고 v1/v2 브랜치도 없는 fresh repo → isHarnessRepo=false(다운스트림)
  initGitRepo(dir);
  return dir;
}

test('prune-downstream: check 모드는 리포트만 하고 삭제하지 않는다', () => {
  const ds = makeFakeDownstream();
  const result = runNode('.harness/scripts/setup/prune-downstream.mjs', [], {
    env: { HARNESS_ROOT: ds },
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /check 모드/);
  // 삭제되지 않았어야 함
  assert.ok(existsSync(join(ds, '.specify')));
  assert.ok(existsSync(join(ds, 'ROADMAP.md')));
});

test('prune-downstream: --apply 는 upstream 전용 파일을 삭제한다', () => {
  const ds = makeFakeDownstream();
  const result = runNode('.harness/scripts/setup/prune-downstream.mjs', ['--apply'], {
    env: { HARNESS_ROOT: ds },
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.ok(!existsSync(join(ds, 'docs', 'index.html')));
  // ROADMAP 은 바이트 판정 대상 — 패키지 기준이 없으면 보존한다 (감사 M-5).
  assert.ok(existsSync(join(ds, 'ROADMAP.md')), 'ROADMAP 은 기준 없이 지우면 안 된다');
  // specs/.specify 는 운영 중 레포의 자체 데이터라 보존한다.
  assert.ok(existsSync(join(ds, 'specs')), 'specs 는 자동 삭제 대상이 아니다');
  assert.ok(existsSync(join(ds, '.specify')), '.specify 는 자동 삭제 대상이 아니다');
});

test('prune-downstream: lock 모드 레포에서도 잔재를 정리한다', () => {
  // 과거 가드는 "정리는 migrate 가 담당한다"며 lock 레포에서 조기 종료했다.
  // 그 전제는 거짓이다 — migrate 는 전환된 레포를 거부하고 pkg-sync 는 공유
  // 파일만 다룬다. 결과로 lock 레포에는 정리 경로가 없었다
  // (2026-07-30 codi-crawling: 하네스 테스트 90개 잔존).
  const ds = makeFakeDownstream();
  writeFileSync(join(ds, 'harness.lock'), '{"schema_version":1}\n');
  const result = runNode('.harness/scripts/setup/prune-downstream.mjs', ['--apply'], {
    env: { HARNESS_ROOT: ds },
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.doesNotMatch(result.stdout, /migrate 흐름이 담당/);
  assert.ok(!existsSync(join(ds, 'docs', 'index.html')), 'lock 모드에서도 잔재가 지워져야 한다');
});

test('prune-downstream: harness upstream 에서는 실행을 거부한다', () => {
  // 이 저장소(root)는 harness upstream → 거부(exit 2), 아무것도 삭제 안 함
  const result = runNode('.harness/scripts/setup/prune-downstream.mjs', ['--apply']);
  assert.equal(result.status, 2, result.stdout + result.stderr);
  assert.match(result.stderr, /upstream/);
  // 실제 저장소의 specs/tests 는 그대로여야 함
  assert.ok(existsSync(join(root, 'specs')));
  assert.ok(existsSync(join(root, 'tests')));
});

test('prune-downstream: 삭제 목록이 upstream-project-state 모듈과 일치', async () => {
  const mod = await import(
    '../.harness/scripts/setup/upstream-project-state.mjs'
  );
  assert.deepEqual(mod.UPSTREAM_PROJECT_STATE_PATHS, [
    '.specify',
    'specs',
    'tests',
    'ROADMAP.md',
    'docs/index.html',
    'docs/planning.html',
    '.github/workflows/release.yml',
    '.github/workflows/harness-ci.yml',
    'examples',
  ]);
});

// --- specs/ 선별 정리: 하네스 사본만 지우고 자체 spec 은 보존 ---

// upstream spec 사본과 다운스트림 자체 spec 이 섞인 레포.
// 실측 근거: codi-account 10건, codi-hansi 13건 모두 하네스 사본이었고
// 자체 spec 은 0건이었다 (2026-07-30). 그래도 섞인 경우를 계약으로 고정한다.
function makeMixedSpecsDownstream({ upstreamIds, ownIds }) {
  const dir = tmp('codi-harness-mixed-');
  // 패키지(업스트림 spec 목록의 출처) 흉내.
  const pkg = join(dir, '.harness', 'current');
  for (const id of upstreamIds) {
    mkdirSync(join(pkg, 'specs', id), { recursive: true });
    writeFileSync(join(pkg, 'specs', id, 'spec.md'), `upstream ${id}\n`);
  }
  // 레포에는 사본과 자체 spec 이 함께 있다.
  for (const id of [...upstreamIds, ...ownIds]) {
    mkdirSync(join(dir, 'specs', id), { recursive: true });
    writeFileSync(join(dir, 'specs', id, 'spec.md'), `repo ${id}\n`);
  }
  initGitRepo(dir);
  return dir;
}

test('prune-downstream: specs/ 는 upstream 사본만 지우고 자체 spec 은 남긴다', () => {
  const ds = makeMixedSpecsDownstream({
    upstreamIds: ['001-design-system-support', '002-feature-hub'],
    ownIds: ['001-account-login', '900-my-feature'],
  });
  const result = runNode('.harness/scripts/setup/prune-downstream.mjs', ['--apply'], {
    env: { HARNESS_ROOT: ds },
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);

  for (const id of ['001-design-system-support', '002-feature-hub']) {
    assert.ok(!existsSync(join(ds, 'specs', id)), `upstream 사본 ${id} 가 남았다`);
  }
  for (const id of ['001-account-login', '900-my-feature']) {
    assert.ok(existsSync(join(ds, 'specs', id)), `자체 spec ${id} 를 지웠다`);
  }
  // 자체 spec 이 남았으므로 specs/ 디렉터리 자체는 보존된다.
  assert.ok(existsSync(join(ds, 'specs')));
});

test('prune-downstream: tests/ 도 하네스 사본만 지우고 자체 테스트는 남긴다', () => {
  // tests/ 는 앱 레포가 자체 테스트를 두는 가장 흔한 위치다. 경로 이름만 보고
  // 통째로 지우면 프로젝트 테스트가 통째로 날아간다 — specs/ 와 같은 선별
  // 방식으로 통일한다.
  const dir = tmp('codi-harness-tests-');
  const pkg = join(dir, '.harness', 'current');
  mkdirSync(join(pkg, 'tests'), { recursive: true });
  writeFileSync(join(pkg, 'tests', 'harness-cli.test.mjs'), '// upstream\n');
  writeFileSync(join(pkg, 'tests', 'pkg-migrate.test.mjs'), '// upstream\n');

  mkdirSync(join(dir, 'tests'), { recursive: true });
  writeFileSync(join(dir, 'tests', 'harness-cli.test.mjs'), '// copy\n');
  writeFileSync(join(dir, 'tests', 'account-login.test.mjs'), '// 자체 테스트\n');
  initGitRepo(dir);

  const result = runNode('.harness/scripts/setup/prune-downstream.mjs', ['--apply'], {
    env: { HARNESS_ROOT: dir },
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);

  assert.ok(
    !existsSync(join(dir, 'tests', 'harness-cli.test.mjs')),
    '하네스 사본이 남았다',
  );
  assert.ok(
    existsSync(join(dir, 'tests', 'account-login.test.mjs')),
    '자체 테스트를 지웠다',
  );
});

test('prune-downstream: examples/ 는 통째로 지운다', () => {
  // 정책이 "harness demo workspace — never propagated downstream" 이라고
  // 명시하는데도 clone 으로 딸려온다 (codi-account 실측).
  const dir = tmp('codi-harness-ex-');
  mkdirSync(join(dir, '.harness', 'current'), { recursive: true });
  mkdirSync(join(dir, 'examples', 'community-app'), { recursive: true });
  writeFileSync(join(dir, 'examples', 'community-app', 'x.md'), 'demo\n');
  initGitRepo(dir);

  const r = runNode('.harness/scripts/setup/prune-downstream.mjs', ['--apply'], {
    env: { HARNESS_ROOT: dir },
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(!existsSync(join(dir, 'examples')), 'examples 가 남았다');
});

test('prune-downstream: data/ 는 하네스와 내용이 같은 파일만 지운다', () => {
  // data/ 는 파일 이름이 upstream 과 같아도 다운스트림이 자기 기능정의를
  // 넣는 곳이다. 이름으로 판정하면 프로젝트 데이터가 날아간다 — 내용이
  // 하네스 것과 바이트 단위로 같을 때만 손대지 않은 사본으로 본다.
  const dir = tmp('codi-harness-data-');
  const pkg = join(dir, '.harness', 'current');
  mkdirSync(join(pkg, 'data'), { recursive: true });
  writeFileSync(join(pkg, 'data', 'feature-definitions.json'), '[{"id":"001-x"}]\n');
  writeFileSync(join(pkg, 'data', 'sitemap.json'), '{"nodes":[]}\n');

  mkdirSync(join(dir, 'data'), { recursive: true });
  // 손대지 않은 사본 — 지워야 한다.
  writeFileSync(join(dir, 'data', 'sitemap.json'), '{"nodes":[]}\n');
  // 프로젝트가 자기 기능을 넣었다 — 남겨야 한다.
  writeFileSync(join(dir, 'data', 'feature-definitions.json'), '[{"id":"001-my-app"}]\n');
  initGitRepo(dir);

  const r = runNode('.harness/scripts/setup/prune-downstream.mjs', ['--apply'], {
    env: { HARNESS_ROOT: dir },
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(!existsSync(join(dir, 'data', 'sitemap.json')), '손대지 않은 사본이 남았다');
  assert.ok(
    existsSync(join(dir, 'data', 'feature-definitions.json')),
    '프로젝트가 수정한 파일을 지웠다',
  );
});

test('prune-downstream: data/ 는 버전이 달라도 전부 하네스 항목이면 지운다', () => {
  // 내용 대조만으로는 구버전 사본을 놓친다 — codi-account 는 013 까지, 패키지는
  // 014 까지라 바이트가 달라 미탐이었다. 항목 id 가 전부 upstream spec 에
  // 대응하면 다운스트림 데이터가 없다는 뜻이므로 사본으로 본다.
  const dir = tmp('codi-harness-datav-');
  const pkg = join(dir, '.harness', 'current');
  mkdirSync(join(pkg, 'data'), { recursive: true });
  mkdirSync(join(pkg, 'specs', '001-a'), { recursive: true });
  mkdirSync(join(pkg, 'specs', '002-b'), { recursive: true });
  // 패키지는 002 까지 안다.
  writeFileSync(
    join(pkg, 'data', 'feature-definitions.json'),
    JSON.stringify([{ id: '001-a' }, { id: '002-b' }]),
  );

  mkdirSync(join(dir, 'data'), { recursive: true });
  // 구버전 사본 — 001 만 있고 내용이 다르지만 전부 upstream 항목이다.
  writeFileSync(
    join(dir, 'data', 'feature-definitions.json'),
    JSON.stringify([{ id: '001-a' }]),
  );
  initGitRepo(dir);

  const r = runNode('.harness/scripts/setup/prune-downstream.mjs', ['--apply'], {
    env: { HARNESS_ROOT: dir },
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(
    !existsSync(join(dir, 'data', 'feature-definitions.json')),
    '전부 하네스 항목인 구버전 사본이 남았다',
  );
});

test('prune-downstream: data/ 에 프로젝트 항목이 하나라도 있으면 남긴다', () => {
  const dir = tmp('codi-harness-datam-');
  const pkg = join(dir, '.harness', 'current');
  mkdirSync(join(pkg, 'data'), { recursive: true });
  mkdirSync(join(pkg, 'specs', '001-a'), { recursive: true });
  writeFileSync(
    join(pkg, 'data', 'feature-definitions.json'),
    JSON.stringify([{ id: '001-a' }]),
  );

  mkdirSync(join(dir, 'data'), { recursive: true });
  // 하네스 항목 + 프로젝트 자체 항목이 섞였다.
  writeFileSync(
    join(dir, 'data', 'feature-definitions.json'),
    JSON.stringify([{ id: '001-a' }, { id: '900-my-feature' }]),
  );
  initGitRepo(dir);

  const r = runNode('.harness/scripts/setup/prune-downstream.mjs', ['--apply'], {
    env: { HARNESS_ROOT: dir },
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(
    existsSync(join(dir, 'data', 'feature-definitions.json')),
    '프로젝트 항목이 섞였는데 지웠다',
  );
});

test('prune-downstream: lock 모드(캐시 경유 실행)에서 다운스트림을 upstream으로 오판하지 않는다', () => {
  // lock 모드에서 .harness/scripts 는 버전 캐시를 가리키고, 그 캐시는
  // 하네스 저장소 clone이라 origin이 codi-harness.git 이다. ROOT를 스크립트
  // 위치 기준으로 잡으면 어느 다운스트림에서 실행해도 "upstream입니다"로
  // 오판해 정리가 영구 무력화된다 (2026-07-30 실측, 다운스트림 4곳).
  const ds = makeFakeDownstream();
  // 캐시 clone 흉내: 하네스 origin 을 가진 별도 저장소 안에 스크립트를 둔다.
  const cache = tmp('codi-harness-cachelike-');
  spawnSync('git', ['init', '-q'], { cwd: cache });
  spawnSync(
    'git',
    ['remote', 'add', 'origin', 'https://github.com/CODIWORKS-Engineer/codi-harness.git'],
    { cwd: cache },
  );
  const scriptsDir = join(cache, '.harness', 'scripts', 'setup');
  mkdirSync(scriptsDir, { recursive: true });
  // specs/015 부터 prune-downstream 은 migrate-plan(pkg)·normalize-root-package·
  // project-owned 도 import 한다 — 캐시 흉내에도 같은 세트를 싣는다.
  for (const f of [
    'prune-downstream.mjs',
    'upstream-project-state.mjs',
    'normalize-root-package.mjs',
    'project-owned.mjs',
  ]) {
    cpSync(join(root, '.harness/scripts/setup', f), join(scriptsDir, f));
  }
  const pkgDir = join(cache, '.harness', 'scripts', 'pkg');
  mkdirSync(pkgDir, { recursive: true });
  cpSync(
    join(root, '.harness/scripts/pkg/migrate-plan.mjs'),
    join(pkgDir, 'migrate-plan.mjs'),
  );

  // HARNESS_ROOT 없이, 다운스트림을 cwd 로 두고 캐시의 스크립트를 실행한다.
  const result = spawnSync('node', [join(scriptsDir, 'prune-downstream.mjs')], {
    cwd: ds,
    encoding: 'utf8',
  });
  assert.doesNotMatch(
    result.stdout + result.stderr,
    /하네스 upstream입니다/,
    '다운스트림에서 실행했는데 upstream 으로 오판했다',
  );
  assert.match(result.stdout, /check 모드|정리 대상 없음/);
});
