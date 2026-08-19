// init-project 회귀 — harness-cli.test.mjs 에서 분할 이동 (specs/017 M-15 잔여).
import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runCommand, runNode, repoRoot as root } from './helpers/cli-fixture.mjs';
import { tmp } from './helpers/fixture-base.mjs';

test('init-project normalize_app_start_scripts wraps dev only, migrates start', () => {
  const initScript = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'init-project.sh'),
    'utf8',
  );

  // dev-runner 는 로컬 개발 전용 래퍼이므로 dev 스크립트에만 적용해야 한다.
  // 과거에는 ['dev', 'start'] 양쪽을 감쌌고, 그 결과 배포 환경에서 .harness 경로가
  // 없어 production start 가 깨졌다. 회귀를 막기 위해 ['dev'] 한정과
  // start migration 코드가 모두 존재하는지 정적으로 검증한다.
  assert.doesNotMatch(
    initScript,
    /for\s*\(\s*const\s+name\s+of\s+\[\s*'dev'\s*,\s*'start'\s*\]\s*\)/,
  );
  assert.match(initScript, /const\s+devCommand\s*=\s*scripts\.dev/);
  assert.match(initScript, /runnerPrefixPattern/);
  assert.match(initScript, /name\s*===\s*'dev'/);
});

test('init-project normalizes root scripts and ensures gitignore in step 3', () => {
  // 누락 #2/#3 정적 가드: init-project 가 루트 package.json 의 harness-self
  // 스크립트를 정리하고 ensure-gitignore 를 호출하는 코드를 포함하는지 확인한다.
  const initScript = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'init-project.sh'),
    'utf8',
  );

  // normalize_root_scripts 함수가 정의되고, 3단계에서 실제로 호출된다.
  assert.match(initScript, /^normalize_root_scripts\(\)\s*\{/m);
  assert.match(initScript, /^normalize_root_scripts$/m);

  // ensure-gitignore.mjs 가 init 경로에서 호출된다.
  assert.match(
    initScript,
    /node\s+"\$PROJECT_ROOT\/\.harness\/scripts\/setup\/ensure-gitignore\.mjs"/,
  );
});

test('init-project bootstraps mise and harness install in one command', () => {
  const initScript = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'init-project.sh'),
    'utf8',
  );

  assert.match(initScript, /^run_mise_bootstrap\(\)\s*\{/m);
  assert.match(initScript, /node: \$\{node_version\} \(mise bootstrap 건너뜀\)/);
  assert.match(initScript, /\bmise trust\b/);
  assert.match(initScript, /\bmise install\b/);
  assert.match(
    initScript,
    /info "사전 체크\.\.\."\nrun_mise_bootstrap\n\nif ! command -v node/,
    'mise bootstrap must run before the Node.js preflight check',
  );
  assert.match(initScript, /^harness_install_needed\(\)\s*\{/m);
  assert.match(initScript, /--skip-install/);
  assert.match(initScript, /--force-install/);
  assert.match(initScript, /\.specify\/templates/);
  assert.match(initScript, /\.agents\/skills\/speckit-specify\/SKILL\.md/);
  assert.match(
    initScript,
    /info "Step 5\/\$\{TOTAL_STEPS\}: 하네스 통합 도구 설치\.\.\."\nwrite_harness_lock\n[\s\S]*?migrate\.sh --fresh[\s\S]*?run_harness_install_if_needed[\s\S]*?if \[ "\$PUSH_REMOTE" -eq 1 \]; then/,
    'lock → migrate --fresh → install 순서여야 한다 — install(pkg-sync materialize)이 복사본 제거보다 먼저 돌면 혼합 상태가 된다',
  );
  // specs/014 FR-012(신규 프로젝트 결과가 전환 완료 레포와 같은 구조)는 이
  // 순서 계약이 곧 안전망이다. 순서가 깨지면 링크가 생성되지 않아 lock 구조가
  // 성립하지 않는다. init-project 는 GitHub 레포 생성·push 를 포함해 통째로
  // 실행할 수 없으므로 정적 대조가 실효적인 유일한 검증이다 (T022).
});

test('init-project and wire-infisical use the provided repository name verbatim', () => {
  const initScript = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'init-project.sh'),
    'utf8',
  );
  const wireScript = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'wire-infisical.sh'),
    'utf8',
  );

  for (const [name, script] of [
    ['init-project', initScript],
    ['wire-infisical', wireScript],
  ]) {
    assert.doesNotMatch(
      script,
      /codi-\$\{PROJECT_NAME\}/,
      `${name} must not prepend codi- to the user-provided project name`,
    );
    assert.doesNotMatch(
      script,
      /codi-<project>|codi-\{project\}/,
      `${name} docs/examples must not imply automatic codi- prefixing`,
    );
  }

  assert.match(initScript, /repos\/\$\{ORG\}\/\$\{PROJECT_NAME\}/);
  assert.match(initScript, /github\.com\/\$\{ORG\}\/\$\{PROJECT_NAME\}\.git/);
  assert.match(wireScript, /--repo "\$\{ORG\}\/\$\{PROJECT_NAME\}"/);
});

test('init-project root script normalizer strips harness-self scripts', () => {
  // 누락 #2 동작 가드: 정규화가 test / codex:replay-check 를 삭제하고 check 에서
  // npm test 호출을 떼어내는지 격리 검증한다. 로직은 specs/015 에서
  // normalize-root-package.mjs 단일 출처 모듈로 추출됐다 — init-project.sh 가
  // 그 모듈을 호출하는 배선인지 함께 확인한다.
  const initScript = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'init-project.sh'),
    'utf8',
  );
  assert.match(
    initScript,
    /normalize_root_scripts\(\)[\s\S]*?normalize-root-package\.mjs/,
    'normalize_root_scripts 가 normalize-root-package.mjs 를 호출해야 한다',
  );
  const snippetPath = join(
    root,
    '.harness',
    'scripts',
    'setup',
    'normalize-root-package.mjs',
  );

  const project = tmp('codi-harness-rootscripts-');
  const pkgPath = join(project, 'package.json');
  writeFileSync(
    pkgPath,
    `${JSON.stringify(
      {
        name: 'codi-harness-v2',
        scripts: {
          test: 'node --test tests/*.test.mjs',
          'codex:replay-check': 'node tests/replay-check.mjs',
          check: './harness doctor && npm test',
          doctor: './harness doctor',
          dev: 'next dev',
        },
      },
      null,
      2,
    )}\n`,
  );

  const result = runCommand('node', [snippetPath, pkgPath], { cwd: project });
  assert.equal(result.status, 0, result.stderr);

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  // harness-self 전용 스크립트는 제거된다.
  assert.ok(!('test' in pkg.scripts), 'test 스크립트가 제거되어야 한다');
  assert.ok(
    !('codex:replay-check' in pkg.scripts),
    'codex:replay-check 스크립트가 제거되어야 한다',
  );
  // check 는 npm test 호출이 떨어져 doctor 만 남는다.
  assert.equal(pkg.scripts.check, './harness doctor');
  // 무관한 스크립트는 보존된다.
  assert.equal(pkg.scripts.doctor, './harness doctor');
  assert.equal(pkg.scripts.dev, 'next dev');

  // 멱등: 이미 정리된 package.json 을 다시 돌려도 변하지 않는다.
  const before = readFileSync(pkgPath, 'utf8');
  const second = runCommand('node', [snippetPath, pkgPath], { cwd: project });
  assert.equal(second.status, 0, second.stderr);
  assert.equal(readFileSync(pkgPath, 'utf8'), before);
});

test('init-project prunes upstream-only project state', () => {
  const initScript = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'init-project.sh'),
    'utf8',
  );
  assert.match(initScript, /^prune_upstream_project_state\(\)\s*\{/m);
  // 정리는 --reset-git 분기 **밖**에서 돈다. 분기 안에만 있으면 옵션 없이
  // 만든 프로젝트가 하네스 사본을 안고 시작한다 (codi-account 실측).
  // 예외는 스켈레톤 출발(specs/019 FR-006) 하나뿐 — 정리할 upstream 상태가
  // 애초에 없어서 SKELETON_ORIGIN 가드로만 생략된다.
  assert.match(
    initScript,
    /^fi\n\n#[\s\S]*?\nif \[ "\$SKELETON_ORIGIN" -eq 0 \]; then\n  prune_upstream_project_state\nfi$/m,
    'prune_upstream_project_state 는 RESET_GIT 분기 밖(스켈레톤 출발 제외)에서 호출돼야 한다',
  );

  const match = initScript.match(
    /(prune_upstream_project_state\(\) \{[\s\S]*?\n\})\n\n# ═/m,
  );
  assert.ok(match, 'prune_upstream_project_state 함수를 찾을 수 없습니다');

  const project = tmp('codi-harness-prune-state-');
  for (const dir of ['.specify', 'specs', 'tests', 'docs']) {
    mkdirSync(join(project, dir), { recursive: true });
  }
  // 정본 모듈을 픽스처에 복사한다 — 과거에는 모듈 부재로 하드코딩 fallback 만
  // 검증돼 드리프트를 못 잡았다 (감사 M-3). fallback 은 제거됐고, 이 테스트는
  // 정본 경로를 실행한다.
  mkdirSync(join(project, '.harness', 'scripts', 'setup'), { recursive: true });
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'upstream-project-state.mjs'),
    join(project, '.harness', 'scripts', 'setup', 'upstream-project-state.mjs'),
  );
  writeFileSync(join(project, '.specify', 'feature.json'), '{}\n');
  writeFileSync(join(project, 'specs', '001-demo.md'), '# demo\n');
  writeFileSync(join(project, 'tests', 'harness.test.mjs'), 'test();\n');
  writeFileSync(join(project, 'ROADMAP.md'), '# ROADMAP\n');
  writeFileSync(join(project, 'docs', 'index.html'), '<!doctype html>\n');
  writeFileSync(join(project, 'docs', 'planning.html'), '<!doctype html>\n');
  writeFileSync(join(project, 'docs', 'guide.md'), '# keep\n');

  const scriptPath = join(project, 'prune.sh');
  writeFileSync(
    scriptPath,
    [
      'set -euo pipefail',
      'info() { :; }',
      `PROJECT_ROOT=${JSON.stringify(project)}`,
      match[1],
      'prune_upstream_project_state',
    ].join('\n'),
  );

  const result = runCommand('bash', [scriptPath], { cwd: project });
  assert.equal(result.status, 0, result.stderr);

  for (const removed of ['.specify', 'specs', 'tests', 'ROADMAP.md', 'docs/index.html', 'docs/planning.html']) {
    assert.equal(
      existsSync(join(project, removed)),
      false,
      `${removed} must be removed from a downstream seed`,
    );
  }
  assert.equal(
    existsSync(join(project, 'docs', 'guide.md')),
    true,
    'unrelated docs should be preserved',
  );
});

test('init-project rehearsal checks current shared script layout', () => {
  const rehearsal = readFileSync(
    join(root, 'tests', 'init-project-flows.sh'),
    'utf8',
  );
  const devRunner = readFileSync(
    join(root, '.harness', 'scripts', 'deploy', 'dev-runner.js'),
    'utf8',
  );

  for (const file of [rehearsal, devRunner]) {
    assert.doesNotMatch(file, /\.harness\/scripts\/dev-runner\.js/);
  }

  assert.doesNotMatch(rehearsal, /\.harness\/scripts\/ci-node-verify\.sh/);
  assert.doesNotMatch(rehearsal, /\.harness\/scripts\/osv-severity-gate\.js/);
  assert.doesNotMatch(
    rehearsal,
    /\.harness\/scripts\/dependency-impact-report\.js/,
  );
  assert.match(rehearsal, /\.harness\/scripts\/checks\/ci-node-verify\.sh/);
  assert.match(rehearsal, /\.harness\/scripts\/audit\/osv-severity-gate\.js/);
  assert.match(
    rehearsal,
    /\.harness\/scripts\/audit\/dependency-impact-report\.js/,
  );
  assert.match(devRunner, /\.harness\/scripts\/deploy\/dev-runner\.js/);
});

test('init-project is_harness_clone uses exact canonical URL matching', () => {
  const body = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'init-project.sh'),
    'utf8',
  );
  assert.match(body, /origin_matches_harness\s*\(\s*\)/);
  assert.doesNotMatch(
    body,
    /\*codi-harness\*\)\s*return\s+0/,
    'substring origin match must be removed',
  );
  assert.match(body, /CODIWORKS-Engineer\/codi-harness\b/);
  assert.match(body, /CODIWORKS-Engineer\/codi-harness-v2\b/);
});

test('init-project is_harness_clone gates v1/v2 fallback on no remotes', () => {
  const body = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'init-project.sh'),
    'utf8',
  );
  assert.match(
    body,
    /if\s+\[\s*-n\s+"\$origin_url"\s*\][\s\S]{0,400}origin_matches_harness/,
    'origin-set path must run origin_matches_harness first',
  );
  assert.match(
    body,
    /git\s+-C\s+"\$PROJECT_ROOT"\s+remote\s+2>\/dev\/null[\s\S]{0,800}refs\/heads\/v1/,
    'v1/v2 fallback must check the full remote list, not just origin',
  );
  function classify(setup) {
    const project = tmp('codi-harness-clone-');
    spawnSync('git', ['init', '-q'], { cwd: project });
    spawnSync('git', ['config', 'user.email', 't@t'], { cwd: project });
    spawnSync('git', ['config', 'user.name', 't'], { cwd: project });
    setup(project);
    const script = `set -eu
PROJECT_ROOT="$1"
${body.match(/^origin_matches_harness\(\)[\s\S]*?^}/m)[0]}
${body.match(/^is_harness_clone\(\)[\s\S]*?^}/m)[0]}
if is_harness_clone; then echo HARNESS; else echo NOT_HARNESS; fi`;
    const r = spawnSync('bash', ['-c', script, '_', project], {
      cwd: root,
      encoding: 'utf8',
    });
    return r.stdout.trim();
  }
  assert.equal(
    classify((p) => {
      spawnSync(
        'git',
        [
          'remote',
          'add',
          'harness',
          'https://github.com/foo/codi-harness-evil.git',
        ],
        { cwd: p },
      );
      writeFileSync(join(p, 'foo'), 'x');
      spawnSync('git', ['add', '.'], { cwd: p });
      spawnSync('git', ['commit', '-q', '-m', 'init'], { cwd: p });
      spawnSync('git', ['branch', 'v2'], { cwd: p });
    }),
    'NOT_HARNESS',
    'named remote + v2 branch must NOT count as harness',
  );
  assert.equal(
    classify((p) => {
      spawnSync(
        'git',
        [
          'remote',
          'add',
          'origin',
          'https://github.com/foo/codi-harness-evil.git',
        ],
        { cwd: p },
      );
      writeFileSync(join(p, 'foo'), 'x');
      spawnSync('git', ['add', '.'], { cwd: p });
      spawnSync('git', ['commit', '-q', '-m', 'init'], { cwd: p });
      spawnSync('git', ['branch', 'v2'], { cwd: p });
    }),
    'NOT_HARNESS',
    'evil origin + v2 branch must NOT count as harness',
  );
  assert.equal(
    classify((p) => {
      spawnSync(
        'git',
        [
          'remote',
          'add',
          'origin',
          'https://github.com/CODIWORKS-Engineer/codi-harness.git',
        ],
        { cwd: p },
      );
    }),
    'HARNESS',
    'canonical origin must count as harness',
  );
  assert.equal(
    classify((p) => {
      writeFileSync(join(p, 'foo'), 'x');
      spawnSync('git', ['add', '.'], { cwd: p });
      spawnSync('git', ['commit', '-q', '-m', 'init'], { cwd: p });
      spawnSync('git', ['branch', 'v2'], { cwd: p });
    }),
    'HARNESS',
    'no remote + v2 branch must count as harness (legit fresh local)',
  );
});

test('init-project: upstream 상태 정리는 --reset-git 에 묶이지 않는다', () => {
  // 하네스 clone 으로 새 프로젝트를 만들면 upstream 의 specs/ROADMAP/tests 가
  // 딸려온다. 그 정리가 --reset-git 분기 안에만 있으면, 옵션 없이 만든
  // 프로젝트는 하네스 사본을 안고 시작한다 — codi-account 실측: specs 10건이
  // 전부 하네스 것이고 자체 spec 은 0건이었다 (2026-07-30).
  const src = readFileSync(join(root, '.harness/scripts/setup/init-project.sh'), 'utf8');
  const ifStart = src.indexOf('if [ "$RESET_GIT" -eq 1 ]; then');
  assert.ok(ifStart >= 0, 'RESET_GIT 분기를 찾지 못했다 — 테스트가 낡았다');
  // 분기는 그 if 를 닫는 첫 `^fi$` 까지다. 그 뒤의 호출은 분기 밖이다.
  const afterIf = src.slice(ifStart);
  const fiIndex = afterIf.search(/^fi$/m);
  assert.ok(fiIndex > 0, '분기 종료(fi)를 찾지 못했다 — 테스트가 낡았다');
  const resetBlock = afterIf.slice(0, fiIndex);
  const callsInside = (resetBlock.match(/^\s*prune_upstream_project_state\s*$/gm) || []).length;
  assert.equal(
    callsInside,
    0,
    'prune_upstream_project_state 가 --reset-git 분기 안에만 있으면 옵션 없는 생성에서 정리가 건너뛰어진다',
  );
  // 분기 밖에서 무조건 한 번은 호출돼야 한다.
  const callsTotal = (src.match(/^\s*prune_upstream_project_state\s*$/gm) || []).length;
  assert.ok(callsTotal >= 1, 'prune_upstream_project_state 호출이 사라졌다');
});
