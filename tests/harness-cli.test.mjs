import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sanitizeSessionSegment = (value) => value.replace(/[^A-Za-z0-9_-]/g, '-');

function runNode(relativeScript, args = [], options = {}) {
  return spawnSync(process.execPath, [join(root, relativeScript), ...args], {
    cwd: options.cwd ?? root,
    input: options.input,
    encoding: 'utf8',
    env: { ...process.env, ...(options.env ?? {}) },
  });
}

function runCommand(command, args = [], options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd ?? root,
    input: options.input,
    encoding: 'utf8',
    env: { ...process.env, ...(options.env ?? {}) },
  });
}

function makeProject() {
  const dir = mkdtempSync(join(tmpdir(), 'codi-harness-test-'));
  return dir;
}

function initGitRepo(dir) {
  assert.equal(runCommand('git', ['init', '-q'], { cwd: dir }).status, 0);
  assert.equal(
    runCommand('git', ['config', 'user.email', 'test@example.com'], {
      cwd: dir,
    }).status,
    0,
  );
  assert.equal(
    runCommand('git', ['config', 'user.name', 'Harness Test'], { cwd: dir })
      .status,
    0,
  );
}

function commitAll(dir, message) {
  assert.equal(runCommand('git', ['add', '.'], { cwd: dir }).status, 0);
  const committed = runCommand('git', ['commit', '-q', '-m', message], {
    cwd: dir,
  });
  assert.equal(committed.status, 0, committed.stderr);
}

test('legacy local spec and board commands are removed from the launcher', () => {
  const launcher = readFileSync(join(root, 'harness'), 'utf8');
  assert.doesNotMatch(launcher, /^\s*phase-prompt\)/m);
  assert.doesNotMatch(launcher, /^\s*spec\)/m);
  assert.doesNotMatch(launcher, /^\s*board\)/m);

  const help = runCommand('./harness', ['help']);
  assert.equal(help.status, 0, help.stderr);
  assert.doesNotMatch(help.stdout, /phase-prompt/);
  assert.doesNotMatch(help.stdout, /\bspec\b/);
  assert.doesNotMatch(help.stdout, /\bboard\b/);
});

test('harness wire-infisical surfaces in help and dispatches', () => {
  const help = runCommand('./harness', ['--help']);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /wire-infisical/);

  const dryRun = runCommand('./harness', ['wire-infisical']);
  assert.notEqual(dryRun.status, 0);
  assert.match(dryRun.stderr + dryRun.stdout, /project-name|INFISICAL_PROJECT_ID/);
});

test('external phase routing replaces local wrapper skills and spec artifacts', () => {
  for (const removed of [
    'specs',
    '.harness/scripts/tooling/spec.mjs',
    '.harness/scripts/tooling/phase-prompt.mjs',
    '.harness/scripts/tooling/board.mjs',
    '.harness/hooks/board-refresh.mjs',
    '.harness/templates/phase-handoff.md',
    '.harness/skills/gsd',
    '.harness/skills/gstack',
    '.harness/skills/superpowers',
  ]) {
    assert.equal(existsSync(join(root, removed)), false, `${removed} must be removed`);
  }

  for (const skillPath of [
    '.harness/skills/codi-phase-routing/SKILL.md',
    '.harness/skills/team-mode-operator/SKILL.md',
  ]) {
    assert.equal(existsSync(join(root, skillPath)), true, `${skillPath} must exist`);
  }

  for (const activeSkill of ['codi-phase-routing', 'karpathy-style', 'team-mode-operator']) {
    const skillBody = readFileSync(
      join(root, '.harness', 'skills', activeSkill, 'SKILL.md'),
      'utf8',
    );
    assert.doesNotMatch(skillBody, /specs\/<feature>/);
    assert.doesNotMatch(skillBody, /01-brainstorming\.md/);
    assert.doesNotMatch(skillBody, /harness phase-prompt/);
  }
});

test('install script removes legacy get-shit-done-cc before installing open-gsd', () => {
  const install = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'install.sh'),
    'utf8',
  );

  assert.match(
    install,
    /get-shit-done-cc --claude --global --uninstall/,
    'Claude Code legacy GSD runtime install must be removed',
  );
  assert.match(
    install,
    /get-shit-done-cc --codex --global --uninstall/,
    'Codex legacy GSD runtime install must be removed',
  );
  assert.match(
    install,
    /npm uninstall -g get-shit-done-cc/,
    'legacy GSD npm package must be removed',
  );
  assert.match(
    install,
    /get-shit-done-redux/,
    'open-gsd installer must remain the active installer',
  );
});

test('team skill catalog is documented in phase routing config', () => {
  const manifest = JSON.parse(
    readFileSync(join(root, '.harness', 'manifest.json'), 'utf8'),
  );
  const codiConfig = readFileSync(
    join(root, '.harness', 'config', 'codi-config.yaml'),
    'utf8',
  );
  const phaseRouting = readFileSync(
    join(root, '.harness', 'skills', 'codi-phase-routing', 'SKILL.md'),
    'utf8',
  );

  for (const skill of manifest.team_skills.enabled) {
    assert.match(codiConfig, new RegExp(`- ${skill}\\b`));
  }

  for (const skill of manifest.team_skills.enabled.filter(
    (skill) => skill !== 'codi-phase-routing',
  )) {
    assert.match(phaseRouting, new RegExp(`\\b${skill}\\b`));
  }

  assert.match(phaseRouting, /\.harness\/config\/project-profile\.yaml/);
  assert.match(phaseRouting, /\.harness\/imported-rules\/frontend\.md/);
  assert.match(phaseRouting, /\.harness\/policies\/agent-routing\.md/);
});

test('init-project normalize_app_start_scripts wraps dev only, migrates start', () => {
  const initScript = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'init-project.sh'),
    'utf8',
  );

  // dev-runner 는 로컬 개발 전용 래퍼이므로 dev 스크립트에만 적용해야 한다.
  // 과거에는 ['dev', 'start'] 양쪽을 감쌌고, 그 결과 배포 환경에서 .harness 경로가
  // 없어 production start 가 깨졌다. 회귀를 막기 위해 ['dev'] 한정과
  // start migration 코드가 모두 존재하는지 정적으로 검증한다.
  assert.doesNotMatch(initScript, /for\s*\(\s*const\s+name\s+of\s+\[\s*'dev'\s*,\s*'start'\s*\]\s*\)/);
  assert.match(initScript, /const\s+devCommand\s*=\s*scripts\.dev/);
  assert.match(initScript, /runnerPrefixPattern/);
  assert.match(initScript, /name\s*===\s*'dev'/);
});

test('init-project rehearsal checks current shared script layout', () => {
  const rehearsal = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'test-init-project-flows.sh'),
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

test('guard and permission hooks block representative unsafe inputs', () => {
  const destructive = runNode('.harness/hooks/guardrails.mjs', [], {
    input: JSON.stringify({
      tool_name: 'Bash',
      tool_input: { command: 'rm -rf dist' },
    }),
  });
  assert.equal(destructive.status, 0);
  assert.match(destructive.stdout, /"decision":"block"/);

  const unboundedUpdate = runNode('.harness/hooks/guardrails.mjs', [], {
    input: JSON.stringify({
      tool_name: 'Bash',
      tool_input: {
        command: 'psql "$DATABASE_URL" -c "UPDATE users SET disabled = true"',
      },
    }),
  });
  assert.equal(unboundedUpdate.status, 0);
  assert.match(unboundedUpdate.stdout, /unbounded UPDATE/);

  const destructiveAlter = runNode('.harness/hooks/guardrails.mjs', [], {
    input: JSON.stringify({
      tool_name: 'Bash',
      tool_input: {
        command:
          'psql "$DATABASE_URL" -c "ALTER TABLE users DROP COLUMN email"',
      },
    }),
  });
  assert.equal(destructiveAlter.status, 0);
  assert.match(destructiveAlter.stdout, /destructive ALTER TABLE/);

  const productionDataAccess = runNode('.harness/hooks/guardrails.mjs', [], {
    input: JSON.stringify({
      tool_name: 'Bash',
      tool_input: { command: 'psql prod -c "SELECT email FROM users LIMIT 1"' },
    }),
  });
  assert.equal(productionDataAccess.status, 0);
  assert.match(productionDataAccess.stdout, /production data access/);

  const livePayment = runNode('.harness/hooks/guardrails.mjs', [], {
    input: JSON.stringify({
      tool_name: 'Bash',
      tool_input: { command: 'stripe refunds create --payment-intent pi_123' },
    }),
  });
  assert.equal(livePayment.status, 0);
  assert.match(livePayment.stdout, /external side effect/);

  const bannedPackageManager = runNode(
    '.harness/hooks/tool-permission-guard.mjs',
    [],
    {
      input: JSON.stringify({
        tool_name: 'Bash',
        tool_input: { command: 'yarn install', cwd: root },
      }),
    },
  );
  assert.equal(bannedPackageManager.status, 0);
  assert.match(
    bannedPackageManager.stdout,
    /Package manager policy blocked 'yarn'/,
  );

  const databaseDropMcp = runNode(
    '.harness/hooks/tool-permission-guard.mjs',
    [],
    {
      input: JSON.stringify({
        tool_name: 'mcp__postgres__drop_database',
        tool_input: { database: 'app_dev' },
      }),
    },
  );
  assert.equal(databaseDropMcp.status, 0);
  assert.match(databaseDropMcp.stdout, /database drop\/reset/);

  const productionDatabaseMcp = runNode(
    '.harness/hooks/tool-permission-guard.mjs',
    [],
    {
      input: JSON.stringify({
        tool_name: 'mcp__postgres__read_query',
        tool_input: {
          environment: 'production',
          query: 'select count(*) from users',
        },
      }),
    },
  );
  assert.equal(productionDatabaseMcp.status, 0);
  assert.match(productionDatabaseMcp.stdout, /production database\/data access/);

  const sideEffectMcp = runNode(
    '.harness/hooks/tool-permission-guard.mjs',
    [],
    {
      input: JSON.stringify({
        tool_name: 'mcp__stripe__create_refund',
        tool_input: { paymentIntent: 'pi_123', mode: 'live' },
      }),
    },
  );
  assert.equal(sideEffectMcp.status, 0);
  assert.match(sideEffectMcp.stdout, /external side-effect access/);
});

test('guardrails block protected branch edits and sensitive commands', () => {
  const project = makeProject();
  initGitRepo(project);
  writeFileSync(join(project, 'README.md'), '# Demo\n');
  commitAll(project, '초기 커밋');
  assert.equal(
    runCommand('git', ['checkout', '-q', '-b', 'main'], { cwd: project }).status,
    0,
  );

  const protectedWrite = runNode('.harness/hooks/guardrails.mjs', [], {
    cwd: project,
    input: JSON.stringify({
      cwd: project,
      tool_name: 'Write',
      tool_input: { file_path: 'README.md', content: '# Changed\n' },
    }),
  });
  assert.equal(protectedWrite.status, 0);
  assert.match(protectedWrite.stdout, /"decision":"block"/);
  assert.match(protectedWrite.stdout, /protected branch/);

  const protectedBash = runNode('.harness/hooks/guardrails.mjs', [], {
    cwd: project,
    input: JSON.stringify({
      cwd: project,
      tool_name: 'Bash',
      tool_input: { command: 'npm run format -- --write' },
    }),
  });
  assert.equal(protectedBash.status, 0);
  assert.match(protectedBash.stdout, /protected branch/);

  const secretPrint = runNode('.harness/hooks/guardrails.mjs', [], {
    input: JSON.stringify({
      tool_name: 'Bash',
      tool_input: { command: 'echo $INFISICAL_CLIENT_SECRET' },
    }),
  });
  assert.equal(secretPrint.status, 0);
  assert.match(secretPrint.stdout, /secret/i);

  const productionDeploy = runNode('.harness/hooks/guardrails.mjs', [], {
    input: JSON.stringify({
      tool_name: 'Bash',
      tool_input: { command: './harness server-deploy production' },
    }),
  });
  assert.equal(productionDeploy.status, 0);
  assert.match(productionDeploy.stdout, /production/i);
});

test('skill injector and project profile guard preserve routing boundaries', () => {
  const injected = runNode('.harness/hooks/skill-injector.mjs', [], {
    input: JSON.stringify({
      prompt: 'npm audit 취약점 Renovate package-lock 업데이트 리뷰',
      cwd: root,
    }),
  });
  assert.equal(injected.status, 0);
  assert.match(injected.stdout, /codi-dependency-review/);

  const project = makeProject();
  mkdirSync(join(project, '.harness', 'config'), { recursive: true });
  writeFileSync(
    join(project, '.harness', 'config', 'project-profile.yaml'),
    'mode: next-fullstack\n',
  );

  const blocked = runNode('.harness/hooks/project-profile-guard.mjs', [], {
    cwd: project,
    input: JSON.stringify({
      cwd: project,
      tool_input: { file_path: 'apps/back/src/server.ts' },
    }),
  });
  assert.equal(blocked.status, 0);
  assert.match(blocked.stdout, /"decision":"block"/);
});

test('profile CLI lists, shows, and sets official project modes', () => {
  const project = makeProject();
  mkdirSync(join(project, '.harness', 'config'), { recursive: true });

  const listed = runNode('.harness/scripts/tooling/profile.mjs', ['list'], {
    cwd: project,
  });
  assert.equal(listed.status, 0, listed.stderr);
  assert.match(listed.stdout, /split-front-back/);
  assert.match(listed.stdout, /next-fullstack/);
  assert.match(listed.stdout, /frontend-only/);
  assert.match(listed.stdout, /backend-only/);

  writeFileSync(
    join(project, '.harness', 'config', 'project-profile.yaml'),
    'mode: split-front-back\n',
  );
  const set = runNode(
    '.harness/scripts/tooling/profile.mjs',
    ['set', 'frontend-only'],
    { cwd: project },
  );
  assert.equal(set.status, 0, set.stderr);

  const profile = readFileSync(
    join(project, '.harness', 'config', 'project-profile.yaml'),
    'utf8',
  );
  assert.match(profile, /mode: frontend-only/);
  assert.match(profile, /apps\/back\/\*\*/);
  assert.match(profile, /backend_owner_skill: codi-frontend/);

  const shown = runNode('.harness/scripts/tooling/profile.mjs', ['show'], {
    cwd: project,
  });
  assert.equal(shown.status, 0, shown.stderr);
  assert.match(shown.stdout, /frontend-only/);
  assert.match(shown.stdout, /apps\/back/);

  const setBackendOnly = runNode(
    '.harness/scripts/tooling/profile.mjs',
    ['set', 'backend-only'],
    { cwd: project },
  );
  assert.equal(setBackendOnly.status, 0, setBackendOnly.stderr);
  const backendOnlyProfile = readFileSync(
    join(project, '.harness', 'config', 'project-profile.yaml'),
    'utf8',
  );
  assert.match(backendOnlyProfile, /mode: backend-only/);
  assert.match(backendOnlyProfile, /enabled: false/);
  assert.match(backendOnlyProfile, /apps\/front\/\*\*/);
  assert.match(backendOnlyProfile, /backend_owner_skill: codi-backend/);

  const setSplit = runNode(
    '.harness/scripts/tooling/profile.mjs',
    ['set', 'split-front-back'],
    { cwd: project },
  );
  assert.equal(setSplit.status, 0, setSplit.stderr);
  const splitProfile = readFileSync(
    join(project, '.harness', 'config', 'project-profile.yaml'),
    'utf8',
  );
  assert.match(splitProfile, /mode: split-front-back/);
  assert.match(splitProfile, /split-front-back:/);
  assert.match(splitProfile, /frontend_owner_skill: codi-frontend/);
  assert.match(splitProfile, /backend_owner_skill: codi-backend/);

  const rejected = runNode(
    '.harness/scripts/tooling/profile.mjs',
    ['set', 'unknown-mode'],
    { cwd: project },
  );
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /Unsupported mode/);

  const initProject = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'init-project.sh'),
    'utf8',
  );
  assert.match(
    initProject,
    /split-front-back\|next-fullstack\|frontend-only\|backend-only/,
  );
  assert.match(initProject, /4\|backend-only/);

  const manifest = JSON.parse(
    readFileSync(join(root, '.harness', 'manifest.json'), 'utf8'),
  );
  assert.deepEqual(manifest.project_profile.supported_modes, [
    'split-front-back',
    'next-fullstack',
    'frontend-only',
    'backend-only',
  ]);
});

test('profile check rejects deterministic project profile drift', () => {
  const project = makeProject();
  mkdirSync(join(project, '.harness', 'config'), { recursive: true });
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(project, '.harness', 'scripts', _d), { recursive: true });
  }
  cpSync(
    join(root, '.harness', 'scripts', 'tooling', 'profile.mjs'),
    join(project, '.harness', 'scripts', 'tooling', 'profile.mjs'),
  );

  const initialized = runNode(
    '.harness/scripts/tooling/profile.mjs',
    ['set', 'next-fullstack'],
    { cwd: project },
  );
  assert.equal(initialized.status, 0, initialized.stderr);

  const valid = runNode('.harness/scripts/tooling/profile.mjs', ['check'], {
    cwd: project,
  });
  assert.equal(valid.status, 0, valid.stderr);

  const profilePath = join(project, '.harness', 'config', 'project-profile.yaml');
  const brokenProfile = readFileSync(profilePath, 'utf8').replace(
    'enabled: false',
    'enabled: true',
  );
  writeFileSync(profilePath, brokenProfile);

  const invalid = runNode('.harness/scripts/tooling/profile.mjs', ['check'], {
    cwd: project,
  });
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /apps\/back/i);
});

test('frontend-only and next-fullstack block backend path edits and backend skill injection', () => {
  for (const mode of ['frontend-only', 'next-fullstack']) {
    const project = makeProject();
    mkdirSync(join(project, '.harness', 'config'), { recursive: true });
    mkdirSync(join(project, '.harness', 'skills', 'codi-backend'), {
      recursive: true,
    });
    writeFileSync(
      join(project, '.harness', 'config', 'project-profile.yaml'),
      `mode: ${mode}\n`,
    );
    cpSync(
      join(root, '.harness', 'config', 'skill-triggers.json'),
      join(project, '.harness', 'config', 'skill-triggers.json'),
    );
    writeFileSync(
      join(project, '.harness', 'skills', 'codi-backend', 'SKILL.md'),
      '# Backend Skill\n',
    );

    const blocked = runNode('.harness/hooks/project-profile-guard.mjs', [], {
      cwd: project,
      input: JSON.stringify({
        cwd: project,
        tool_input: { file_path: 'apps/back/src/server.ts' },
      }),
    });
    assert.equal(blocked.status, 0);
    assert.match(
      blocked.stdout,
      /"decision":"block"/,
      `${mode} should block apps/back`,
    );

    const injected = runNode('.harness/hooks/skill-injector.mjs', [], {
      input: JSON.stringify({
        prompt: 'Express backend API server controller endpoint',
        cwd: project,
      }),
    });
    assert.equal(injected.status, 0);
    assert.doesNotMatch(
      injected.stdout,
      /codi-backend/,
      `${mode} should not inject codi-backend`,
    );
  }
});

test('backend-only blocks frontend path edits and frontend skill injection', () => {
  const project = makeProject();
  mkdirSync(join(project, '.harness', 'config'), { recursive: true });
  mkdirSync(join(project, '.harness', 'skills', 'codi-frontend'), {
    recursive: true,
  });
  writeFileSync(
    join(project, '.harness', 'config', 'project-profile.yaml'),
    'mode: backend-only\n',
  );
  cpSync(
    join(root, '.harness', 'config', 'skill-triggers.json'),
    join(project, '.harness', 'config', 'skill-triggers.json'),
  );
  writeFileSync(
    join(project, '.harness', 'skills', 'codi-frontend', 'SKILL.md'),
    '# Frontend Skill\n',
  );

  const blocked = runNode('.harness/hooks/project-profile-guard.mjs', [], {
    cwd: project,
    input: JSON.stringify({
      cwd: project,
      tool_input: { file_path: 'apps/front/src/App.tsx' },
    }),
  });
  assert.equal(blocked.status, 0);
  assert.match(blocked.stdout, /"decision":"block"/);

  const backendAllowed = runNode(
    '.harness/hooks/project-profile-guard.mjs',
    [],
    {
      cwd: project,
      input: JSON.stringify({
        cwd: project,
        tool_input: { file_path: 'apps/back/src/server.ts' },
      }),
    },
  );
  assert.equal(backendAllowed.status, 0);
  assert.equal(backendAllowed.stdout, '');

  const injected = runNode('.harness/hooks/skill-injector.mjs', [], {
    input: JSON.stringify({
      prompt: 'React frontend UI component page',
      cwd: project,
    }),
  });
  assert.equal(injected.status, 0);
  assert.doesNotMatch(injected.stdout, /codi-frontend/);
});

test('split-front-back allows frontend and backend paths and skill injection', () => {
  const project = makeProject();
  mkdirSync(join(project, '.harness', 'config'), { recursive: true });
  mkdirSync(join(project, '.harness', 'skills', 'codi-frontend'), {
    recursive: true,
  });
  mkdirSync(join(project, '.harness', 'skills', 'codi-backend'), {
    recursive: true,
  });
  writeFileSync(
    join(project, '.harness', 'config', 'project-profile.yaml'),
    'mode: split-front-back\n',
  );
  cpSync(
    join(root, '.harness', 'config', 'skill-triggers.json'),
    join(project, '.harness', 'config', 'skill-triggers.json'),
  );
  writeFileSync(
    join(project, '.harness', 'skills', 'codi-frontend', 'SKILL.md'),
    '# Frontend Skill\n',
  );
  writeFileSync(
    join(project, '.harness', 'skills', 'codi-backend', 'SKILL.md'),
    '# Backend Skill\n',
  );

  for (const file_path of [
    'apps/front/src/App.tsx',
    'apps/back/src/server.ts',
  ]) {
    const allowed = runNode('.harness/hooks/project-profile-guard.mjs', [], {
      cwd: project,
      input: JSON.stringify({ cwd: project, tool_input: { file_path } }),
    });
    assert.equal(allowed.status, 0);
    assert.equal(allowed.stdout, '');
  }

  const injected = runNode('.harness/hooks/skill-injector.mjs', [], {
    input: JSON.stringify({
      prompt: 'React frontend UI and Express backend API server',
      cwd: project,
    }),
  });
  assert.equal(injected.status, 0);
  assert.match(injected.stdout, /codi-frontend/);
  assert.match(injected.stdout, /codi-backend/);
});

test('Cloudflare tunnel toggle is workflow env, not an Infisical secret', () => {
  const workflowFiles = [
    '.github/workflows/deploy-backend-pm2.yml',
    '.github/workflows/deploy-backend-docker.yml',
    '.github/workflows/deploy-frontend-pm2.yml',
    '.github/workflows/deploy-frontend-docker.yml',
  ];

  for (const file of workflowFiles) {
    const body = readFileSync(join(root, file), 'utf8');
    assert.match(
      body,
      /^\s+USE_CLOUDFLARE_TUNNEL:\s+["']?(?:true|false)["']?\s*$/m,
      `${file} must define workflow env flag (true|false)`,
    );
    assert.doesNotMatch(
      body,
      /get_secret\s+(?:BACK|FRONT)_USE_CLOUDFLARE_TUNNEL/,
      `${file} must not fetch the toggle from Infisical`,
    );
    assert.doesNotMatch(
      body,
      /(?:BACK|FRONT)_USE_CLOUDFLARE_TUNNEL/,
      `${file} must use the generic workflow toggle name`,
    );
  }
});

test('Vercel frontend deploy targets the dev custom environment', () => {
  const workflow = readFileSync(
    join(root, '.github', 'workflows', 'deploy-frontend-vercel.yml'),
    'utf8',
  );
  const envExample = readFileSync(join(root, 'apps', 'front', '.env.example'), 'utf8');
  const docs = readFileSync(
    join(root, '.harness', 'docs', 'vercel-infisical-secret-sync.md'),
    'utf8',
  );

  assert.match(workflow, /echo "vercel_env=dev"/);
  assert.match(workflow, /echo "target_flag=--target=dev"/);
  assert.match(
    workflow,
    /vercel pull --yes\s+\\\s+--environment=\$\{\{ steps\.env\.outputs\.vercel_env \}\}/,
  );
  assert.match(workflow, /vercel build \$\{\{ steps\.env\.outputs\.target_flag \}\}/);
  assert.match(workflow, /vercel deploy --prebuilt \$\{\{ steps\.env\.outputs\.target_flag \}\}/);
  assert.match(workflow, /environment-url: \$\{\{ steps\.public-url\.outputs\.url \}\}/);
  assert.doesNotMatch(workflow, /vercel alias set/);

  assert.match(docs, /custom environment `dev`/);
  assert.match(docs, /vercel deploy --prebuilt --target=dev/);
});

test('harness repository branch policy is separated from app repository PR flow', () => {
  const files = [
    'AGENTS.md',
    'CLAUDE.md',
    '.harness/policies/guardrails.md',
    'CONTRIBUTING.md',
  ];

  for (const file of files) {
    const body = readFileSync(join(root, file), 'utf8');
    assert.match(
      body,
      /(?:하네스 레포.*버전 브랜치|harness repo.*version branch)/s,
      `${file} must document harness version branches`,
    );
    assert.match(
      body,
      /(?:앱 레포.*dev.*main|app repo.*dev.*main)/s,
      `${file} must keep app repository dev/main flow`,
    );
  }
});

test('root agent entrypoints delegate project-specific rules to project profile and app-local docs', () => {
  const files = [
    'AGENTS.md',
    'CLAUDE.md',
    '.harness/policies/context-engineering.md',
  ];

  for (const file of files) {
    const body = readFileSync(join(root, file), 'utf8');
    assert.match(
      body,
      /app-local|apps\/\*/,
      `${file} must mention app-local project rules`,
    );
    assert.match(
      body,
      /project-profile\.yaml/,
      `${file} must keep project profile as the app structure source`,
    );
  }

  const agents = readFileSync(join(root, 'AGENTS.md'), 'utf8');
  const claude = readFileSync(join(root, 'CLAUDE.md'), 'utf8');
  assert.doesNotMatch(
    agents,
    /split-front-back|next-fullstack/,
    'AGENTS.md must not encode project mode details',
  );
  assert.doesNotMatch(
    claude,
    /split-front-back|next-fullstack/,
    'CLAUDE.md must not encode project mode details',
  );

  const contextPolicy = readFileSync(
    join(root, '.harness', 'policies', 'context-engineering.md'),
    'utf8',
  );
  assert.match(
    contextPolicy,
    /must not weaken/i,
    'app-local rules must not weaken shared policy',
  );
  assert.match(
    contextPolicy,
    /shared rule|shared policy/i,
    'shared policy must win app-local conflicts',
  );
});

test('workflow validation is wired through actionlint', () => {
  const ci = readFileSync(join(root, '.github/workflows/ci-node.yml'), 'utf8');
  const doctor = readFileSync(join(root, '.harness/scripts/checks/doctor.sh'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

  assert.match(ci, /rhysd\/actionlint/, 'ci-node workflow must run actionlint');
  assert.match(
    doctor,
    /workflow-check\.sh/,
    'doctor must know about workflow-check.sh',
  );
  assert.match(pkg.scripts['workflow:check'] || '', /workflow-check\.sh/);
});

test('dependency security workflows avoid non-dependency PR and push runs', () => {
  const pipeline = readFileSync(join(root, '.github/workflows/pipeline.yml'), 'utf8');
  const dependencyPr = readFileSync(
    join(root, '.github/workflows/dependency-security-pr.yml'),
    'utf8',
  );

  assert.match(dependencyPr, /^\s*pull_request:\s*$/m);
  assert.match(dependencyPr, /^\s*paths:\s*$/m);
  for (const dependencyPath of [
    "'**/package.json'",
    "'**/package-lock.json'",
    "'**/npm-shrinkwrap.json'",
    "'**/pnpm-lock.yaml'",
    "'**/pnpm-workspace.yaml'",
  ]) {
    assert.match(dependencyPr, new RegExp(escapeRegExp(dependencyPath)));
  }
  assert.match(
    dependencyPr,
    /uses: \.\/\.github\/workflows\/dependency-security\.yml/,
  );

  assert.match(pipeline, /dependency_changed:/);
  assert.match(
    pipeline,
    /github\.event_name == 'push' &&\s+needs\.detect-deploy-targets\.outputs\.dependency_changed == 'true'/,
  );
  assert.match(
    pipeline,
    /needs\.dependency-security\.result == 'success' \|\|\s+needs\.dependency-security\.result == 'skipped'/,
  );
});

test('GitHub Actions runner jobs define timeout limits', () => {
  const workflowDir = join(root, '.github', 'workflows');
  const workflowFiles = [
    'ci-node.yml',
    'dependency-security.yml',
    'deploy-backend-docker.yml',
    'deploy-backend-pm2.yml',
    'deploy-frontend-docker.yml',
    'deploy-frontend-pm2.yml',
    'deploy-frontend-vercel.yml',
    'pipeline.yml',
  ];

  for (const file of workflowFiles) {
    const lines = readFileSync(join(workflowDir, file), 'utf8').split('\n');
    for (let index = 0; index < lines.length; index += 1) {
      if (!/^\s+runs-on:\s+ubuntu-latest\s*$/.test(lines[index])) continue;

      const nearby = lines.slice(index + 1, index + 4).join('\n');
      assert.match(
        nearby,
        /^\s+timeout-minutes:\s+\d+\s*$/m,
        `${file}:${index + 1} must define timeout-minutes near runs-on`,
      );
    }
  }
});

test('harness update apply imports common harness files and preserves project-owned files', () => {
  const updateScript = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'update.sh'),
    'utf8',
  );
  assert.match(
    updateScript,
    /\|apps\/\*[|)]/,
    'apps/* must be project-owned (covers app-local AGENTS.md and CLAUDE.md)',
  );

  const source = mkdtempSync(join(tmpdir(), 'codi-harness-source-'));
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-project-'));

  initGitRepo(source);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(source, '.harness', 'scripts', _d), { recursive: true });
  }
  mkdirSync(join(source, '.harness', 'config'), { recursive: true });
  mkdirSync(join(source, '.harness', 'state'), { recursive: true });
  mkdirSync(join(source, '.github', 'workflows'), { recursive: true });
  mkdirSync(join(source, 'apps', 'front'), { recursive: true });
  mkdirSync(join(source, 'apps', 'back'), { recursive: true });
  writeFileSync(
    join(source, '.harness', 'scripts', 'tooling', 'profile.mjs'),
    'source profile\n',
  );
  writeFileSync(
    join(source, '.harness', 'config', 'project-profile.yaml'),
    'mode: source\n',
  );
  writeFileSync(
    join(source, '.harness', 'state', 'update-state.env'),
    'SOURCE=1\n',
  );
  writeFileSync(
    join(source, '.github', 'workflows', 'ci-node.yml'),
    'source workflow\n',
  );
  writeFileSync(
    join(source, 'apps', 'front', 'AGENTS.md'),
    'source front agents\n',
  );
  writeFileSync(
    join(source, 'apps', 'front', 'CLAUDE.md'),
    'source front claude\n',
  );
  writeFileSync(
    join(source, 'apps', 'back', 'AGENTS.md'),
    'source back agents\n',
  );
  writeFileSync(
    join(source, 'apps', 'back', 'CLAUDE.md'),
    'source back claude\n',
  );
  writeFileSync(join(source, 'AGENTS.md'), 'source agents\n');
  writeFileSync(join(source, 'README.md'), 'source readme\n');
  writeFileSync(join(source, 'mise.toml'), 'node = "24"\n');
  writeFileSync(join(source, 'harness'), 'source harness\n');
  commitAll(source, 'source');
  assert.equal(runCommand('git', ['branch', 'v2'], { cwd: source }).status, 0);

  initGitRepo(project);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(project, '.harness', 'scripts', _d), { recursive: true });
  }
  mkdirSync(join(project, '.harness', 'config'), { recursive: true });
  mkdirSync(join(project, '.harness', 'state'), { recursive: true });
  mkdirSync(join(project, '.github', 'workflows'), { recursive: true });
  mkdirSync(join(project, '.agents'), { recursive: true });
  mkdirSync(join(project, 'apps', 'front'), { recursive: true });
  mkdirSync(join(project, 'apps', 'back'), { recursive: true });
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'update.sh'),
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
  );
  writeFileSync(join(project, '.harness', 'scripts', 'tooling', 'profile.mjs'), 'old profile\n');
  writeFileSync(
    join(project, '.harness', 'config', 'project-profile.yaml'),
    'mode: project\n',
  );
  writeFileSync(
    join(project, '.harness', 'state', 'update-state.env'),
    'PROJECT=1\n',
  );
  writeFileSync(
    join(project, '.github', 'workflows', 'ci-node.yml'),
    'project workflow\n',
  );
  writeFileSync(
    join(project, 'apps', 'front', 'AGENTS.md'),
    'project front agents\n',
  );
  writeFileSync(
    join(project, 'apps', 'front', 'CLAUDE.md'),
    'project front claude\n',
  );
  writeFileSync(
    join(project, 'apps', 'back', 'AGENTS.md'),
    'project back agents\n',
  );
  writeFileSync(
    join(project, 'apps', 'back', 'CLAUDE.md'),
    'project back claude\n',
  );
  writeFileSync(join(project, 'AGENTS.md'), 'old agents\n');
  writeFileSync(join(project, 'README.md'), 'project readme\n');
  writeFileSync(join(project, 'mise.toml'), 'node = "20"\n');
  writeFileSync(join(project, 'harness'), 'old harness\n');
  commitAll(project, 'project');

  const applied = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
    ['--apply-harness', '--source-repo', source, '--source-ref', 'v2'],
    { cwd: project },
  );

  assert.equal(applied.status, 0, applied.stderr);
  assert.match(
    applied.stdout,
    /project-owned 경로 건너뜀: [1-9][0-9]*/,
    'project-owned paths should be summarized by default',
  );
  assert.doesNotMatch(
    applied.stdout,
    /skip project-owned path: apps\/front\/AGENTS\.md/,
    'default update output should not print every skipped project-owned path',
  );
  assert.match(
    applied.stdout,
    /shared 하네스 파일 적용: [1-9][0-9]*/,
    'applied shared files should be summarized by default',
  );
  assert.equal(
    readFileSync(join(project, '.harness', 'scripts', 'tooling', 'profile.mjs'), 'utf8'),
    'source profile\n',
  );
  assert.equal(
    readFileSync(join(project, 'AGENTS.md'), 'utf8'),
    'source agents\n',
  );
  assert.equal(
    readFileSync(join(project, 'harness'), 'utf8'),
    'source harness\n',
  );
  assert.equal(
    readFileSync(join(project, '.github', 'workflows', 'ci-node.yml'), 'utf8'),
    'project workflow\n',
  );
  assert.equal(
    readFileSync(join(project, 'apps', 'front', 'AGENTS.md'), 'utf8'),
    'project front agents\n',
  );
  assert.equal(
    readFileSync(join(project, 'apps', 'front', 'CLAUDE.md'), 'utf8'),
    'project front claude\n',
  );
  assert.equal(
    readFileSync(join(project, 'apps', 'back', 'AGENTS.md'), 'utf8'),
    'project back agents\n',
  );
  assert.equal(
    readFileSync(join(project, 'apps', 'back', 'CLAUDE.md'), 'utf8'),
    'project back claude\n',
  );
  assert.equal(
    readFileSync(
      join(project, '.harness', 'config', 'project-profile.yaml'),
      'utf8',
    ),
    'mode: project\n',
  );
  assert.equal(
    readFileSync(
      join(project, '.harness', 'state', 'update-state.env'),
      'utf8',
    ),
    'PROJECT=1\n',
  );
  assert.equal(
    readFileSync(join(project, 'README.md'), 'utf8'),
    'project readme\n',
  );
  assert.equal(
    readFileSync(join(project, 'mise.toml'), 'utf8'),
    'node = "20"\n',
  );
});

test('harness update --apply-harness verbose mode prints file lists', () => {
  const source = mkdtempSync(join(tmpdir(), 'codi-harness-verbose-source-'));
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-verbose-project-'));

  initGitRepo(source);
  mkdirSync(join(source, '.harness', 'scripts', 'setup'), { recursive: true });
  mkdirSync(join(source, 'apps', 'front'), { recursive: true });
  writeFileSync(
    join(source, '.harness', 'scripts', 'setup', 'update.sh'),
    'source update\n',
  );
  writeFileSync(join(source, 'apps', 'front', 'AGENTS.md'), 'source app\n');
  commitAll(source, 'source');
  assert.equal(runCommand('git', ['branch', 'v2'], { cwd: source }).status, 0);

  initGitRepo(project);
  mkdirSync(join(project, '.harness', 'scripts', 'setup'), { recursive: true });
  mkdirSync(join(project, 'apps', 'front'), { recursive: true });
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'update.sh'),
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
  );
  writeFileSync(join(project, 'apps', 'front', 'AGENTS.md'), 'project app\n');
  commitAll(project, 'project');

  const applied = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
    [
      '--apply-harness',
      '--verbose',
      '--source-repo',
      source,
      '--source-ref',
      'v2',
    ],
    { cwd: project },
  );

  assert.equal(applied.status, 0, applied.stderr);
  assert.match(applied.stdout, /project-owned 경로 건너뜀:\n/);
  assert.match(applied.stdout, /  - apps\/front\/AGENTS\.md/);
  assert.match(applied.stdout, /shared 하네스 파일 적용:\n/);
  assert.match(applied.stdout, /  - \.harness\/scripts\/setup\/update\.sh/);
});

test('harness auto apply warns without overwriting dirty shared paths', () => {
  const source = mkdtempSync(join(tmpdir(), 'codi-harness-source-'));
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-project-'));

  initGitRepo(source);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(source, '.harness', 'scripts', _d), { recursive: true });
  }
  writeFileSync(
    join(source, '.harness', 'scripts', 'tooling', 'profile.mjs'),
    'source profile\n',
  );
  commitAll(source, 'source');
  assert.equal(runCommand('git', ['branch', 'v2'], { cwd: source }).status, 0);

  initGitRepo(project);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(project, '.harness', 'scripts', _d), { recursive: true });
  }
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'update.sh'),
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
  );
  writeFileSync(join(project, '.harness', 'scripts', 'tooling', 'profile.mjs'), 'old profile\n');
  commitAll(project, 'project');
  writeFileSync(
    join(project, '.harness', 'scripts', 'tooling', 'profile.mjs'),
    'local dirty profile\n',
  );

  const applied = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
    [
      '--apply-harness',
      '--auto',
      '--source-repo',
      source,
      '--source-ref',
      'v2',
    ],
    { cwd: project },
  );

  assert.equal(applied.status, 0, applied.stderr);
  assert.match(applied.stderr, /로컬 변경/);
  assert.equal(
    readFileSync(join(project, '.harness', 'scripts', 'tooling', 'profile.mjs'), 'utf8'),
    'local dirty profile\n',
  );
});

test('harness auto apply does not delete files removed upstream', () => {
  const source = mkdtempSync(join(tmpdir(), 'codi-harness-source-'));
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-project-'));

  initGitRepo(source);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(source, '.harness', 'scripts', _d), { recursive: true });
  }
  writeFileSync(
    join(source, '.harness', 'scripts', 'tooling', 'profile.mjs'),
    'source profile\n',
  );
  commitAll(source, 'source');
  assert.equal(runCommand('git', ['branch', 'v2'], { cwd: source }).status, 0);

  initGitRepo(project);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(project, '.harness', 'scripts', _d), { recursive: true });
  }
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'update.sh'),
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
  );
  writeFileSync(join(project, '.harness', 'scripts', 'tooling', 'profile.mjs'), 'old profile\n');
  writeFileSync(
    join(project, '.harness', 'scripts', 'obsolete.mjs'),
    'keep me\n',
  );
  commitAll(project, 'project');

  const applied = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
    [
      '--apply-harness',
      '--auto',
      '--source-repo',
      source,
      '--source-ref',
      'v2',
    ],
    { cwd: project },
  );

  assert.equal(applied.status, 0, applied.stderr);
  assert.match(applied.stderr, /upstream에서 삭제된 파일/);
  assert.equal(
    readFileSync(join(project, '.harness', 'scripts', 'tooling', 'profile.mjs'), 'utf8'),
    'source profile\n',
  );
  assert.equal(
    readFileSync(join(project, '.harness', 'scripts', 'obsolete.mjs'), 'utf8'),
    'keep me\n',
  );
});

test('codex and claude launchers use the shared agent preflight', () => {
  const launcher = readFileSync(join(root, 'harness'), 'utf8');
  const codexWrapper = readFileSync(
    join(root, '.harness', 'scripts', 'agent', 'codex-preflight.sh'),
    'utf8',
  );

  assert.match(launcher, /agent-preflight\.sh" codex/);
  assert.match(launcher, /agent-preflight\.sh" claude/);
  assert.match(codexWrapper, /agent-preflight\.sh/);
});

test('harness exposes opt-in team mode without replacing single-agent launchers', () => {
  const launcher = readFileSync(join(root, 'harness'), 'utf8');
  const help = runCommand('./harness', ['help']);

  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /harness team\s+선택형 cmux\/tmux 팀 모드 실행/);
  assert.match(launcher, /^\s*team\)/m);
  assert.match(launcher, /team-session\.sh/);
  assert.match(launcher, /agent-preflight\.sh" codex/);
  assert.match(launcher, /agent-preflight\.sh" claude/);
});

test('team-session dry-run prints a role plan without requiring cmux or tmux', () => {
  const dryRun = runCommand('.harness/scripts/agent/team-session.sh', [
    'claude',
    '--dry-run',
    '--session',
    'demo-team',
  ]);

  assert.equal(dryRun.status, 0, dryRun.stderr);
  assert.match(dryRun.stdout, /팀 모드 실행 계획/);
  assert.match(dryRun.stdout, /세션: demo-team/);
  assert.match(dryRun.stdout, /agent: claude/);
  assert.match(dryRun.stdout, /우선 backend: cmux -> tmux/);
  for (const role of ['orchestrator', 'planner', 'implementer', 'reviewer', 'qa', 'shell']) {
    assert.match(dryRun.stdout, new RegExp(`CODI_TEAM_ROLE=${role}`));
  }
});

test('harness team accepts a positional agent shortcut', () => {
  const dryRun = runCommand('./harness', ['team', 'claude', '--dry-run']);

  assert.equal(dryRun.status, 0, dryRun.stderr);
  assert.match(dryRun.stdout, /agent: claude/);
  assert.match(dryRun.stdout, /exec claude/);
});

test('team-session default session name includes the selected agent', () => {
  const codexDryRun = runCommand('.harness/scripts/agent/team-session.sh', [
    'codex',
    '--dry-run',
  ]);
  const claudeDryRun = runCommand('.harness/scripts/agent/team-session.sh', [
    'claude',
    '--dry-run',
  ]);

  assert.equal(codexDryRun.status, 0, codexDryRun.stderr);
  assert.equal(claudeDryRun.status, 0, claudeDryRun.stderr);
  const repoSegment = sanitizeSessionSegment(basename(root));
  assert.match(
    codexDryRun.stdout,
    new RegExp(`세션: ${escapeRegExp(repoSegment)}-codex-team`),
  );
  assert.match(
    claudeDryRun.stdout,
    new RegExp(`세션: ${escapeRegExp(repoSegment)}-claude-team`),
  );
});

test('team-session exposes cmux status hooks and tmux pane titles', () => {
  const script = readFileSync(
    join(root, '.harness', 'scripts', 'agent', 'team-session.sh'),
    'utf8',
  );

  assert.match(script, /CMUX_BIN=.*find_cmux/);
  assert.match(script, /Applications\/cmux\.app\/Contents\/Resources\/bin\/cmux/);
  assert.match(script, /"\$CMUX_BIN" set-status/);
  assert.match(script, /"\$CMUX_BIN" log/);
  assert.match(script, /"\$CMUX_BIN" notify/);
  assert.match(script, /@codi_role "orchestrator"/);
  assert.match(script, /@codi_role "planner"/);
  assert.match(script, /@codi_role "implementer"/);
  assert.match(script, /@codi_role "reviewer"/);
  assert.match(script, /@codi_role "qa"/);
  assert.match(script, /@codi_role "shell"/);
  assert.match(script, /tmux select-pane[^\n]+-T "orchestrator"/);
  assert.match(script, /tmux select-pane[^\n]+-T "planner"/);
  assert.match(script, /tmux select-pane[^\n]+-T "implementer"/);
  assert.match(script, /tmux select-pane[^\n]+-T "reviewer"/);
  assert.match(script, /tmux select-pane[^\n]+-T "qa"/);
  assert.match(script, /tmux select-pane[^\n]+-T "shell"/);
  assert.match(script, /pane-border-status/);
});

test('team-mode-operator skill documents cmux and tmux operating rules', () => {
  const skill = readFileSync(
    join(root, '.harness', 'skills', 'team-mode-operator', 'SKILL.md'),
    'utf8',
  );

  for (const expected of [
    './harness team claude',
    './harness team codex',
    'cmux-workspace',
    'cmux-diagnostics',
    'cmux-markdown',
    'tmux-agent-status',
    'CODI_TEAM_ROLE',
    '.planning',
    'worktree',
  ]) {
    assert.match(skill, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('team-session rejects unsupported agents before launching panes', () => {
  const result = runCommand('.harness/scripts/agent/team-session.sh', [
    '--dry-run',
    '--agent',
    'vim',
  ]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /지원하지 않는 agent입니다: vim/);
});

test('doctor treats cmux and tmux as optional team readiness checks', () => {
  const doctor = readFileSync(
    join(root, '.harness', 'scripts', 'checks', 'doctor.sh'),
    'utf8',
  );

  assert.match(doctor, /팀 모드 사용 가능/);
  assert.match(doctor, /팀 모드를 사용할 수 없습니다/);
  assert.doesNotMatch(doctor, /require_command cmux/);
  assert.doesNotMatch(doctor, /require_command tmux/);
});

test('team mode documentation keeps normal launchers as the default path', () => {
  const docs = [
    readFileSync(join(root, 'README.md'), 'utf8'),
    readFileSync(join(root, 'CONTRIBUTING.md'), 'utf8'),
    readFileSync(join(root, 'ARCHITECTURE.md'), 'utf8'),
    readFileSync(join(root, '.harness', 'workflow.md'), 'utf8'),
    readFileSync(
      join(root, '.harness', 'skills', 'codi-phase-routing', 'SKILL.md'),
      'utf8',
    ),
  ].join('\n');

  assert.match(docs, /팀 모드|Team Mode/);
  assert.match(docs, /opt-in|선택/);
  assert.match(docs, /\.\/harness codex/);
  assert.match(docs, /\.\/harness claude/);
  assert.match(docs, /\.\/harness team/);
  assert.match(docs, /\.planning/);
  assert.match(docs, /cmux/);
  assert.match(docs, /tmux/);
});
test('board.html is no longer a required generated artifact', () => {
  const updateScript = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'update.sh'),
    'utf8',
  );
  const policy = readFileSync(
    join(root, '.harness', 'policies', 'update-policy.md'),
    'utf8',
  );
  const requiredGitignore = JSON.parse(
    readFileSync(join(root, '.harness', 'config', 'required-gitignore.json'), 'utf8'),
  );

  assert.doesNotMatch(updateScript, /board\.html/, 'update.sh must not special-case board.html');
  assert.doesNotMatch(policy, /board\.html/, 'update-policy.md must not document board.html');
  assert.deepEqual(requiredGitignore.entries, []);
});

test('ensure-gitignore appends missing required entries idempotently', () => {
  const projectDir = mkdtempSync(join(tmpdir(), 'codi-harness-gitignore-'));
  mkdirSync(join(projectDir, '.harness', 'config'), { recursive: true });
  mkdirSync(join(projectDir, '.harness', 'scripts', 'setup'), {
    recursive: true,
  });

  cpSync(
    join(root, '.harness', 'config', 'required-gitignore.json'),
    join(projectDir, '.harness', 'config', 'required-gitignore.json'),
  );
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'ensure-gitignore.mjs'),
    join(projectDir, '.harness', 'scripts', 'setup', 'ensure-gitignore.mjs'),
  );

  const ensureScript = join(
    projectDir,
    '.harness',
    'scripts',
    'setup',
    'ensure-gitignore.mjs',
  );
  const gitignorePath = join(projectDir, '.gitignore');

  // 빈 .gitignore에서 시작: 더 이상 required entry가 없으므로 변경이 없어야 한다.
  writeFileSync(gitignorePath, '');
  const firstRun = runCommand('node', [ensureScript], {
    cwd: projectDir,
    env: { ...process.env, ROOT_DIR: projectDir },
  });
  assert.equal(firstRun.status, 0, firstRun.stderr);
  assert.equal(firstRun.stdout, '', 'stdout must not report additions');
  const afterFirst = readFileSync(gitignorePath, 'utf8');
  assert.equal(afterFirst, '', '.gitignore must remain unchanged');

  // 같은 입력으로 다시 실행: 변경이 없어야 한다 (idempotent).
  const secondRun = runCommand('node', [ensureScript], {
    cwd: projectDir,
    env: { ...process.env, ROOT_DIR: projectDir },
  });
  assert.equal(secondRun.status, 0, secondRun.stderr);
  assert.equal(secondRun.stdout, '', 'second run must produce no additions');
  const afterSecond = readFileSync(gitignorePath, 'utf8');
  assert.equal(afterSecond, afterFirst, '.gitignore content must be unchanged on idempotent run');

  // 기존 항목도 보존만 하고 중복 추가하지 않는다.
  writeFileSync(gitignorePath, 'board.html\n');
  const slashRun = runCommand('node', [ensureScript], {
    cwd: projectDir,
    env: { ...process.env, ROOT_DIR: projectDir },
  });
  assert.equal(slashRun.status, 0, slashRun.stderr);
  assert.equal(slashRun.stdout, '', 'slash-normalized existing pattern must be respected');
  assert.equal(readFileSync(gitignorePath, 'utf8'), 'board.html\n');
});

test('restore-missing-shared lists shared manifest files absent from the worktree', () => {
  const projectDir = mkdtempSync(join(tmpdir(), 'codi-harness-restore-'));
  mkdirSync(join(projectDir, '.harness', 'scripts', 'setup'), {
    recursive: true,
  });
  mkdirSync(join(projectDir, '.husky'), { recursive: true });

  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'project-owned.mjs'),
    join(projectDir, '.harness', 'scripts', 'setup', 'project-owned.mjs'),
  );
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'restore-missing-shared.mjs'),
    join(projectDir, '.harness', 'scripts', 'setup', 'restore-missing-shared.mjs'),
  );

  // pre-commit은 있고 post-commit은 없음. project-owned 경로(.gitignore)는 manifest에
  // 들어있어도 출력에서 제외되어야 한다.
  writeFileSync(join(projectDir, '.husky', 'pre-commit'), '#!/bin/sh\n');
  const manifestPath = join(projectDir, 'manifest.json');
  writeFileSync(
    manifestPath,
    JSON.stringify({
      files: [
        '.husky/post-commit',
        '.husky/pre-commit',
        '.gitignore',
      ],
    }),
  );

  const restoreScript = join(
    projectDir,
    '.harness',
    'scripts',
    'setup',
    'restore-missing-shared.mjs',
  );
  const res = runCommand('node', [restoreScript], {
    cwd: projectDir,
    env: {
      ...process.env,
      MANIFEST_FILE: manifestPath,
      ROOT_DIR: projectDir,
    },
  });
  assert.equal(res.status, 0, res.stderr);
  const lines = res.stdout.trim().split('\n').filter(Boolean);
  assert.deepEqual(
    lines,
    ['.husky/post-commit'],
    'only missing shared (non-project-owned) files must be reported',
  );
});

test('harness update can recover missing shared files after a self-update rerun', () => {
  const source = mkdtempSync(join(tmpdir(), 'codi-harness-self-update-src-'));
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-self-update-proj-'));

  initGitRepo(source);
  mkdirSync(join(source, '.harness', 'scripts', 'setup'), { recursive: true });
  mkdirSync(join(source, '.husky'), { recursive: true });
  mkdirSync(join(source, 'tests'), { recursive: true });
  for (const file of [
    'update.sh',
    'project-owned.mjs',
    'prune-stale.mjs',
    'restore-missing-shared.mjs',
    'skills-link.sh',
  ]) {
    cpSync(
      join(root, '.harness', 'scripts', 'setup', file),
      join(source, '.harness', 'scripts', 'setup', file),
    );
  }
  writeFileSync(join(source, 'AGENTS.md'), 'source agents\n');
  writeFileSync(join(source, '.husky', 'post-commit'), 'source hook\n');
  writeFileSync(join(source, 'tests', 'harness-cli.test.mjs'), 'source test\n');
  writeFileSync(
    join(source, '.harness', 'shared-manifest.json'),
    `${JSON.stringify(
      {
        schema_version: 1,
        source_ref: 'v2',
        file_count: 9,
        files: [
          '.harness/scripts/setup/project-owned.mjs',
          '.harness/scripts/setup/prune-stale.mjs',
          '.harness/scripts/setup/restore-missing-shared.mjs',
          '.harness/scripts/setup/skills-link.sh',
          '.harness/scripts/setup/update.sh',
          '.harness/shared-manifest.json',
          '.husky/post-commit',
          'AGENTS.md',
          'tests/harness-cli.test.mjs',
        ],
      },
      null,
      2,
    )}\n`,
  );
  commitAll(source, 'source');
  assert.equal(runCommand('git', ['branch', 'v2'], { cwd: source }).status, 0);

  initGitRepo(project);
  mkdirSync(join(project, '.harness', 'scripts', 'setup'), { recursive: true });
  mkdirSync(join(project, '.harness'), { recursive: true });
  mkdirSync(join(project, '.harness', 'scripts'), { recursive: true });
  mkdirSync(join(project, 'tests'), { recursive: true });
  writeFileSync(join(project, 'AGENTS.md'), 'old agents\n');
  writeFileSync(join(project, '.harness', 'scripts', 'update.sh'), 'old flat updater\n');
  writeFileSync(join(project, 'tests', 'harness-cli.test.mjs'), 'old test\n');
  writeFileSync(
    join(project, '.harness', 'shared-manifest.json'),
    '{"schema_version":1,"files":[]}\n',
  );
  commitAll(project, 'project');
  rmSync(join(project, '.harness', 'scripts', 'update.sh'));

  for (const file of [
    'update.sh',
    'project-owned.mjs',
    'prune-stale.mjs',
    'restore-missing-shared.mjs',
    'skills-link.sh',
  ]) {
    cpSync(
      join(root, '.harness', 'scripts', 'setup', file),
      join(project, '.harness', 'scripts', 'setup', file),
    );
  }

  // 첫 self-update 실행이 helper와 manifest를 가져왔지만, 당시 helper 부재로
  // missing restore를 못 실행한 상태를 재현한다. 이 상태에서 두 번째 apply는
  // 이미 upstream과 같은 dirty/untracked 파일을 local divergence로 오판하지
  // 않아야 한다. upstream에서 삭제된 옛 shared 파일이 로컬에서도 이미 삭제된
  // 상태도 dirty로 막지 않아야 한다.
  writeFileSync(join(project, 'AGENTS.md'), 'source agents\n');
  cpSync(
    join(source, '.harness', 'shared-manifest.json'),
    join(project, '.harness', 'shared-manifest.json'),
  );

  const applied = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
    ['--apply-harness', '--source-repo', source, '--source-ref', 'v2'],
    { cwd: project },
  );

  assert.equal(applied.status, 0, applied.stderr);
  assert.match(
    applied.stdout,
    /shared 하네스 파일 적용: [1-9][0-9]*/,
    'missing shared files recovered through selected shared apply should be summarized',
  );
  assert.equal(
    readFileSync(join(project, '.husky', 'post-commit'), 'utf8'),
    'source hook\n',
  );
  assert.equal(
    readFileSync(join(project, 'tests', 'harness-cli.test.mjs'), 'utf8'),
    'source test\n',
  );
});

test('board-refresh hook is no longer registered as a PostToolUse hook', () => {
  const settings = JSON.parse(
    readFileSync(join(root, '.claude', 'settings.json'), 'utf8'),
  );
  assert.doesNotMatch(JSON.stringify(settings.hooks.PostToolUse ?? []), /board-refresh/);
});

test('guardrails hook is registered for Bash and file mutation tools', () => {
  const settings = JSON.parse(
    readFileSync(join(root, '.claude', 'settings.json'), 'utf8'),
  );
  const preToolUse = settings.hooks.PreToolUse ?? [];

  for (const matcher of ['Bash', 'Write', 'Edit', 'MultiEdit']) {
    const entry = preToolUse.find((item) => item.matcher === matcher);
    assert.ok(entry, `${matcher} PreToolUse entry exists`);
    assert.match(
      JSON.stringify(entry.hooks),
      /guardrails\.mjs/,
      `${matcher} must run guardrails.mjs`,
    );
  }
});

test('.husky remains shared without the legacy board post-commit hook', () => {
  const policy = readFileSync(
    join(root, '.harness', 'policies', 'update-policy.md'),
    'utf8',
  );
  assert.match(policy, /\.husky/, 'update-policy.md documents .husky as shared');
  assert.equal(existsSync(join(root, '.husky', 'post-commit')), false);
});
function makeUpdatePair(extraSource, extraProject) {
  const source = mkdtempSync(join(tmpdir(), 'codi-harness-source-'));
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-project-'));

  initGitRepo(source);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(source, '.harness', 'scripts', _d), { recursive: true });
  }
  writeFileSync(join(source, '.harness', 'scripts', 'tooling', 'profile.mjs'), 'source profile\n');
  if (extraSource) extraSource(source);
  commitAll(source, 'source');
  assert.equal(runCommand('git', ['branch', 'v2'], { cwd: source }).status, 0);

  initGitRepo(project);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(project, '.harness', 'scripts', _d), { recursive: true });
  }
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'update.sh'),
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
  );
  writeFileSync(join(project, '.harness', 'scripts', 'tooling', 'profile.mjs'), 'old profile\n');
  if (extraProject) extraProject(project);
  commitAll(project, 'project');

  return { source, project };
}

function applyHarness(project, source) {
  return runCommand(
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
    ['--apply-harness', '--source-repo', source, '--source-ref', 'v2'],
    { cwd: project },
  );
}

test('blocklist apply propagates a brand-new top-level directory', () => {
  const { source, project } = makeUpdatePair((src) => {
    mkdirSync(join(src, 'newtool'), { recursive: true });
    writeFileSync(join(src, 'newtool', 'config.sh'), 'echo new tool\n');
  });

  const applied = applyHarness(project, source);
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(
    readFileSync(join(project, 'newtool', 'config.sh'), 'utf8'),
    'echo new tool\n',
  );
});

test('blocklist apply propagates new native rule files as shared harness files', () => {
  const { source, project } = makeUpdatePair((src) => {
    mkdirSync(join(src, '.claude', 'rules'), { recursive: true });
    mkdirSync(join(src, '.codex', 'rules'), { recursive: true });
    writeFileSync(join(src, '.claude', 'rules', 'new-rule.md'), '# New Rule\n');
    writeFileSync(
      join(src, '.codex', 'rules', 'new-rule.rules'),
      'prefix_rule(pattern = ["demo"], decision = "prompt", justification = "demo")\n',
    );
  });

  const applied = applyHarness(project, source);
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(
    readFileSync(join(project, '.claude', 'rules', 'new-rule.md'), 'utf8'),
    '# New Rule\n',
  );
  assert.match(
    readFileSync(join(project, '.codex', 'rules', 'new-rule.rules'), 'utf8'),
    /prefix_rule/,
  );
});

test('blocklist apply preserves downstream .planning work state', () => {
  const { source, project } = makeUpdatePair(
    (src) => {
      mkdirSync(join(src, '.planning'), { recursive: true });
      writeFileSync(
        join(src, '.planning', 'STATE.md'),
        'source planning\n',
      );
    },
    (proj) => {
      mkdirSync(join(proj, '.planning'), { recursive: true });
      writeFileSync(
        join(proj, '.planning', 'STATE.md'),
        'project planning\n',
      );
    },
  );

  const applied = applyHarness(project, source);
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(
    readFileSync(join(project, '.planning', 'STATE.md'), 'utf8'),
    'project planning\n',
  );
});

test('blocklist apply never restores upstream .planning into downstream projects', () => {
  const { source, project } = makeUpdatePair((src) => {
    mkdirSync(join(src, '.planning', 'phases'), { recursive: true });
    writeFileSync(join(src, '.planning', 'PROJECT.md'), 'source project\n');
    writeFileSync(join(src, '.planning', 'STATE.md'), 'source state\n');
    writeFileSync(
      join(src, '.planning', 'phases', 'stage-3.md'),
      'source phase\n',
    );
  });

  const applied = applyHarness(project, source);
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(
    existsSync(join(project, '.planning')),
    false,
    'tracked upstream .planning must not be restored into downstream projects',
  );
});

test('blocklist apply preserves .gitignore and renovate.json', () => {
  const { source, project } = makeUpdatePair(
    (src) => {
      writeFileSync(join(src, '.gitignore'), 'source-ignore\n');
      writeFileSync(join(src, 'renovate.json'), '{"source": true}\n');
    },
    (proj) => {
      writeFileSync(join(proj, '.gitignore'), 'project-ignore\n');
      writeFileSync(join(proj, 'renovate.json'), '{"project": true}\n');
    },
  );

  const applied = applyHarness(project, source);
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(
    readFileSync(join(project, '.gitignore'), 'utf8'),
    'project-ignore\n',
  );
  assert.equal(
    readFileSync(join(project, 'renovate.json'), 'utf8'),
    '{"project": true}\n',
  );
});

test('is_project_owned_path is identical in update.sh and update-check.sh', () => {
  const extract = (file) => {
    const text = readFileSync(join(root, '.harness', 'scripts', file), 'utf8');
    const match = text.match(
      /is_project_owned_path\(\)\s*\{[\s\S]*?\n\}/,
    );
    assert.ok(match, `${file} must define is_project_owned_path`);
    return match[0];
  };
  assert.equal(
    extract('setup/update.sh'),
    extract('setup/update-check.sh'),
    'is_project_owned_path must be identical in both scripts',
  );
});
function makeGuardRepo({ withApp }) {
  const dir = mkdtempSync(join(tmpdir(), 'codi-harness-guard-'));
  mkdirSync(join(dir, '.harness', 'hooks'), { recursive: true });
  mkdirSync(join(dir, '.harness', 'config'), { recursive: true });
  cpSync(
    join(root, '.harness', 'hooks', 'tool-permission-guard.mjs'),
    join(dir, '.harness', 'hooks', 'tool-permission-guard.mjs'),
  );
  cpSync(
    join(root, '.harness', 'config', 'tool-permissions.json'),
    join(dir, '.harness', 'config', 'tool-permissions.json'),
  );
  if (withApp) {
    mkdirSync(join(dir, 'apps', 'front'), { recursive: true });
    writeFileSync(
      join(dir, 'apps', 'front', 'package.json'),
      JSON.stringify({ name: 'front', dependencies: { next: '15.0.0' } }),
    );
  }
  return dir;
}

function runGuard(repoDir, toolInput) {
  return spawnSync(
    process.execPath,
    [join(repoDir, '.harness', 'hooks', 'tool-permission-guard.mjs')],
    {
      cwd: repoDir,
      input: JSON.stringify({ tool_name: 'Bash', tool_input: toolInput }),
      encoding: 'utf8',
      env: process.env,
    },
  );
}

test('tool-permission-guard blocks a root-level install in an app monorepo', () => {
  const repo = makeGuardRepo({ withApp: true });
  const result = runGuard(repo, { command: 'pnpm install', cwd: '.' });
  assert.equal(result.status, 0);
  const decision = JSON.parse(result.stdout || '{}');
  assert.equal(
    decision.decision,
    'block',
    'pnpm install at the monorepo root must be blocked',
  );
  assert.match(decision.reason, /root-level install/);
});

test('tool-permission-guard allows an install inside an app directory', () => {
  const repo = makeGuardRepo({ withApp: true });
  const viaCwd = runGuard(repo, {
    command: 'pnpm install',
    cwd: 'apps/front',
  });
  assert.equal(viaCwd.stdout.trim(), '', 'app-cwd install must not be blocked');

  const viaDir = runGuard(repo, {
    command: 'pnpm --dir apps/front install',
    cwd: '.',
  });
  assert.equal(
    viaDir.stdout.trim(),
    '',
    'pnpm --dir apps/front install must not be blocked',
  );
});

test('tool-permission-guard does not block a root install when no app package exists', () => {
  const repo = makeGuardRepo({ withApp: false });
  const result = runGuard(repo, { command: 'npm install', cwd: '.' });
  assert.equal(
    result.stdout.trim(),
    '',
    'npm install must not be blocked outside an app monorepo',
  );
});

test('package policy check catches static monorepo package drift', () => {
  const project = makeProject();
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(project, '.harness', 'scripts', _d), { recursive: true });
  }
  mkdirSync(join(project, 'apps', 'front'), { recursive: true });
  cpSync(
    join(root, '.harness', 'scripts', 'checks', 'package-policy-check.mjs'),
    join(project, '.harness', 'scripts', 'checks', 'package-policy-check.mjs'),
  );

  writeFileSync(
    join(project, 'apps', 'front', 'package.json'),
    JSON.stringify({ name: 'front', dependencies: { next: '15.0.0' } }),
  );
  writeFileSync(join(project, 'apps', 'front', 'pnpm-lock.yaml'), 'lockfile\n');

  const valid = runNode('.harness/scripts/checks/package-policy-check.mjs', [], {
    cwd: project,
  });
  assert.equal(valid.status, 0, valid.stderr);

  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'root', workspaces: ['apps/*'] }),
  );
  writeFileSync(join(project, 'pnpm-workspace.yaml'), 'packages:\n  - apps/*\n');
  writeFileSync(join(project, 'apps', 'front', 'package-lock.json'), '{}\n');

  const invalid = runNode('.harness/scripts/checks/package-policy-check.mjs', [], {
    cwd: project,
  });
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /workspace|lockfile/i);
});

test('monorepo package rules are mirrored across .claude/rules and AGENTS.md', () => {
  const claudeRule = readFileSync(
    join(root, '.claude', 'rules', 'monorepo-packages.md'),
    'utf8',
  );
  const agents = readFileSync(join(root, 'AGENTS.md'), 'utf8');
  for (const doc of [claudeRule, agents]) {
    assert.match(doc, /apps\//, 'rule must mention the apps/ layout');
    assert.match(
      doc,
      /repo root|root/,
      'rule must mention the repo-root hoisting prohibition',
    );
    assert.match(doc, /install/, 'rule must mention installs');
  }
});

test('.codex/rules/monorepo-packages.rules declares install and banned-manager rules', () => {
  const rules = readFileSync(
    join(root, '.codex', 'rules', 'monorepo-packages.rules'),
    'utf8',
  );
  assert.match(rules, /prefix_rule\(/, 'must use prefix_rule()');
  assert.match(rules, /"pnpm"/, 'must cover pnpm');
  assert.match(rules, /install/, 'must cover install commands');
  assert.match(rules, /decision = "prompt"/, 'installs must be prompt');
  assert.match(rules, /decision = "forbidden"/, 'yarn/bun must be forbidden');
});

test('work safety rules are mirrored across policy, Claude, Codex, and hook wiring', () => {
  const policy = readFileSync(
    join(root, '.harness', 'policies', 'guardrails.md'),
    'utf8',
  );
  const claudeRule = readFileSync(
    join(root, '.claude', 'rules', 'work-safety.md'),
    'utf8',
  );
  const codexRules = readFileSync(
    join(root, '.codex', 'rules', 'work-safety.rules'),
    'utf8',
  );

  for (const doc of [policy, claudeRule]) {
    assert.match(doc, /main.*dev|dev.*main/s, 'must mention protected branches');
    assert.match(doc, /secret/i, 'must mention secret safety');
    assert.match(doc, /production/i, 'must mention production safety');
    assert.match(
      doc,
      /data[- ]?mutat|데이터 변동|mutate persisted data/i,
      'must require approval before any data mutation',
    );
    assert.match(doc, /production data/i, 'must mention production data safety');
    assert.match(doc, /PII|payment/i, 'must mention sensitive record safety');
    assert.match(
      doc,
      /external side effects?|payment capture|SMS\/email/i,
      'must mention external side-effect safety',
    );
  }

  assert.match(codexRules, /gh", "pr", "merge/, 'must forbid PR merge');
  assert.match(
    codexRules,
    /pattern = \["git", "reset", "--hard"\][\s\S]*?decision = "prompt"/,
    'hard reset must require approval rather than be permanently forbidden',
  );
  assert.match(
    codexRules,
    /pattern = \["rm", "-rf"\][\s\S]*?decision = "prompt"/,
    'rm -rf must require approval rather than be permanently forbidden',
  );
  assert.match(
    codexRules,
    /data[- ]?mutat|mutate persisted data/i,
    'Codex work-safety rules must mention data mutation approval',
  );
  assert.match(codexRules, /infisical.*prod/s, 'must prompt production env wrappers');
  assert.match(codexRules, /stripe/, 'must prompt payment side-effect CLIs');
  assert.match(codexRules, /twilio|sendgrid|resend/, 'must prompt message side-effect CLIs');
  assert.match(codexRules, /printenv/, 'must prompt secret-like printing');
  assert.match(codexRules, /server-deploy/, 'must prompt deploy commands');
});

test('secret surface check allows only Infisical bootstrap GitHub secrets', () => {
  const project = makeProject();
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(project, '.harness', 'scripts', _d), { recursive: true });
  }
  mkdirSync(join(project, '.github', 'workflows'), { recursive: true });
  mkdirSync(join(project, 'apps', 'front'), { recursive: true });
  cpSync(
    join(root, '.harness', 'scripts', 'checks', 'secret-surface-check.mjs'),
    join(project, '.harness', 'scripts', 'checks', 'secret-surface-check.mjs'),
  );

  writeFileSync(
    join(project, '.github', 'workflows', 'deploy.yml'),
    'env:\n  CLIENT_ID: ${{ secrets.INFISICAL_CLIENT_ID }}\n  CLIENT_SECRET: ${{ secrets.INFISICAL_CLIENT_SECRET }}\n',
  );
  writeFileSync(
    join(project, 'apps', 'front', '.env.example'),
    'NEXT_PUBLIC_APP_URL=http://localhost:3000\nJWT_ACCESS_SECRET=change-me-access-secret\n',
  );

  const valid = runNode('.harness/scripts/checks/secret-surface-check.mjs', [], {
    cwd: project,
  });
  assert.equal(valid.status, 0, valid.stderr);

  writeFileSync(
    join(project, '.github', 'workflows', 'deploy.yml'),
    'env:\n  DATABASE_URL: ${{ secrets.DATABASE_URL }}\n',
  );
  writeFileSync(
    join(project, 'apps', 'front', '.env.example'),
    'SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----\n',
  );

  const invalid = runNode('.harness/scripts/checks/secret-surface-check.mjs', [], {
    cwd: project,
  });
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /DATABASE_URL/);
  assert.match(invalid.stderr, /private key/i);
});

test('doctor.sh requires mirrored rule files', () => {
  const doctor = readFileSync(
    join(root, '.harness', 'scripts', 'checks', 'doctor.sh'),
    'utf8',
  );
  assert.match(
    doctor,
    /\.claude\/rules\/monorepo-packages\.md/,
    'doctor must require the Claude monorepo rule',
  );
  assert.match(
    doctor,
    /\.codex\/rules\/monorepo-packages\.rules/,
    'doctor must require the Codex monorepo rule',
  );
  assert.match(
    doctor,
    /\.claude\/rules\/work-safety\.md/,
    'doctor must require the Claude work-safety rule',
  );
  assert.match(
    doctor,
    /\.codex\/rules\/work-safety\.rules/,
    'doctor must require the Codex work-safety rule',
  );
});

test('rule-check validates mirrored rule lifecycle wiring', () => {
  const result = runNode('.harness/scripts/checks/rule-check.mjs');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ok: rule lifecycle checks passed/);

  const script = readFileSync(
    join(root, '.harness', 'scripts', 'checks', 'rule-check.mjs'),
    'utf8',
  );
  assert.match(script, /\.claude\/rules/, 'must scan Claude rules');
  assert.match(script, /\.codex\/rules/, 'must scan Codex rules');
  assert.match(script, /doctor\.sh/, 'must validate doctor wiring');

  const launcher = readFileSync(join(root, 'harness'), 'utf8');
  assert.match(launcher, /rule-check\)/, 'harness launcher must expose rule-check');
});

test('rule-check rejects orphan and undocumented rule files', () => {
  const project = makeProject();
  mkdirSync(join(project, '.claude', 'rules'), { recursive: true });
  mkdirSync(join(project, '.codex', 'rules'), { recursive: true });
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(project, '.harness', 'scripts', _d), { recursive: true });
  }
  mkdirSync(join(project, '.harness', 'policies'), { recursive: true });
  cpSync(
    join(root, '.harness', 'scripts', 'checks', 'rule-check.mjs'),
    join(project, '.harness', 'scripts', 'checks', 'rule-check.mjs'),
  );
  writeFileSync(
    join(project, '.claude', 'rules', 'orphan.md'),
    '# Orphan\n',
  );
  writeFileSync(
    join(project, '.codex', 'rules', 'orphan.rules'),
    'prefix_rule(pattern = ["demo"], decision = "prompt", justification = "demo")\n',
  );
  writeFileSync(join(project, '.harness', 'policies', 'guardrails.md'), '# Guardrails\n');
  writeFileSync(join(project, '.harness', 'policies', 'tool-permissions.md'), '# Permissions\n');
  writeFileSync(join(project, '.harness', 'scripts', 'checks', 'doctor.sh'), '#!/usr/bin/env sh\n');

  const result = runNode('.harness/scripts/checks/rule-check.mjs', [], {
    cwd: project,
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must be referenced/);
  assert.match(result.stderr, /doctor\.sh/);
});

test('completed rules are enforced directly without a rule backlog document', () => {
  assert.equal(
    existsSync(join(root, '.harness', 'policies', 'rule-backlog.md')),
    false,
    'rule backlog policy must be removed after all items are implemented',
  );

  const result = runNode('.harness/scripts/checks/rule-check.mjs');
  assert.equal(result.status, 0, result.stderr);

  for (const file of [
    '.harness/scripts/checks/secret-surface-check.mjs',
    '.harness/scripts/checks/package-policy-check.mjs',
    '.harness/scripts/tooling/profile.mjs',
    '.harness/scripts/checks/doctor.sh',
  ]) {
    const body = readFileSync(join(root, file), 'utf8');
    assert.doesNotMatch(body, /rule-backlog\.md/);
  }

  const doctor = readFileSync(
    join(root, '.harness', 'scripts', 'checks', 'doctor.sh'),
    'utf8',
  );
  assert.match(doctor, /secret-surface-check\.mjs/);
  assert.match(doctor, /package-policy-check\.mjs/);
  assert.match(doctor, /profile\.mjs" check|profile\.mjs check/);
  assert.doesNotMatch(doctor, /spec\.mjs/);
});

test('generate-manifest.mjs writes a deterministic shared-manifest.json', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-manifest-'));
  initGitRepo(project);
  mkdirSync(join(project, '.harness', 'scripts', 'setup'), { recursive: true });
  mkdirSync(join(project, '.harness', 'policies'), { recursive: true });
  mkdirSync(join(project, '.planning'), { recursive: true });
  mkdirSync(join(project, 'apps', 'front'), { recursive: true });
  mkdirSync(join(project, '.github', 'workflows'), { recursive: true });
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'generate-manifest.mjs'),
    join(project, '.harness', 'scripts', 'setup', 'generate-manifest.mjs'),
  );
  writeFileSync(join(project, '.harness', 'policies', 'guardrails.md'), 'shared\n');
  writeFileSync(join(project, '.planning', 'STATE.md'), 'project owned\n');
  writeFileSync(join(project, 'apps', 'front', 'AGENTS.md'), 'project owned\n');
  writeFileSync(
    join(project, '.github', 'workflows', 'ci.yml'),
    'project owned\n',
  );
  writeFileSync(join(project, 'README.md'), 'project owned\n');
  writeFileSync(join(project, 'AGENTS.md'), 'shared agents\n');
  commitAll(project, 'init');

  const first = runNode(
    '.harness/scripts/setup/generate-manifest.mjs',
    [],
    { cwd: project },
  );
  assert.equal(first.status, 0, first.stderr);

  const manifestPath = join(project, '.harness', 'shared-manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.schema_version, 1);
  assert.ok(Array.isArray(manifest.files));

  const expectedShared = [
    '.harness/policies/guardrails.md',
    '.harness/scripts/setup/generate-manifest.mjs',
    '.harness/shared-manifest.json',
    'AGENTS.md',
  ];
  for (const path of expectedShared) {
    assert.ok(
      manifest.files.includes(path),
      `${path} must be in shared manifest`,
    );
  }

  const projectOwned = [
    'apps/front/AGENTS.md',
    '.github/workflows/ci.yml',
    '.planning/STATE.md',
    'README.md',
  ];
  for (const path of projectOwned) {
    assert.ok(
      !manifest.files.includes(path),
      `${path} must NOT be in shared manifest (project-owned)`,
    );
  }
  const sorted = [...manifest.files].sort();
  assert.deepEqual(manifest.files, sorted, 'manifest.files must be sorted');

  const firstSerialized = readFileSync(manifestPath, 'utf8');
  const second = runNode(
    '.harness/scripts/setup/generate-manifest.mjs',
    [],
    { cwd: project },
  );
  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /up to date/);
  assert.equal(readFileSync(manifestPath, 'utf8'), firstSerialized);
});

test('prune-stale.mjs identifies shared files missing from the manifest', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-prune-'));
  mkdirSync(join(project, '.harness', 'scripts', 'checks'), { recursive: true });
  mkdirSync(join(project, '.harness', 'scripts', 'setup'), { recursive: true });
  mkdirSync(join(project, '.harness', 'policies'), { recursive: true });
  mkdirSync(join(project, '.planning'), { recursive: true });
  mkdirSync(join(project, 'apps', 'front'), { recursive: true });

  const manifest = {
    schema_version: 1,
    files: [
      '.harness/policies/guardrails.md',
      '.harness/scripts/checks/doctor.sh',
    ].sort(),
  };
  const manifestPath = join(project, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  writeFileSync(join(project, '.harness', 'policies', 'guardrails.md'), 'ok');
  writeFileSync(join(project, '.harness', 'scripts', 'checks', 'doctor.sh'), 'ok');
  writeFileSync(
    join(project, '.harness', 'scripts', 'checks', 'old-check.sh'),
    'stale',
  );
  writeFileSync(
    join(project, '.harness', 'scripts', 'setup', 'old-helper.mjs'),
    'stale',
  );
  writeFileSync(
    join(project, '.planning', 'STATE.md'),
    'project work',
  );
  writeFileSync(join(project, 'apps', 'front', 'AGENTS.md'), 'project work');

  const result = runNode(
    '.harness/scripts/setup/prune-stale.mjs',
    [],
    {
      cwd: project,
      env: { MANIFEST_FILE: manifestPath, ROOT_DIR: project },
    },
  );
  assert.equal(result.status, 0, result.stderr);

  const staleLines = result.stdout.split('\n').filter((l) => l.length > 0);
  assert.deepEqual(staleLines.sort(), [
    '.harness/scripts/checks/old-check.sh',
    '.harness/scripts/setup/old-helper.mjs',
  ]);
  assert.ok(!staleLines.includes('.planning/STATE.md'));
  assert.ok(!staleLines.includes('apps/front/AGENTS.md'));
});

test('harness update --apply-harness prunes stale shared files using the upstream manifest', () => {
  const source = mkdtempSync(join(tmpdir(), 'codi-harness-source-'));
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-project-'));

  initGitRepo(source);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(source, '.harness', 'scripts', _d), { recursive: true });
  }
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'generate-manifest.mjs'),
    join(source, '.harness', 'scripts', 'setup', 'generate-manifest.mjs'),
  );
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'prune-stale.mjs'),
    join(source, '.harness', 'scripts', 'setup', 'prune-stale.mjs'),
  );
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'project-owned.mjs'),
    join(source, '.harness', 'scripts', 'setup', 'project-owned.mjs'),
  );
  writeFileSync(
    join(source, '.harness', 'scripts', 'tooling', 'profile.mjs'),
    'source profile\n',
  );
  writeFileSync(join(source, 'AGENTS.md'), 'source agents\n');
  const sourceManifest = runNode(
    '.harness/scripts/setup/generate-manifest.mjs',
    [],
    { cwd: source },
  );
  assert.equal(sourceManifest.status, 0, sourceManifest.stderr);
  commitAll(source, 'source');
  assert.equal(runCommand('git', ['branch', 'v2'], { cwd: source }).status, 0);

  initGitRepo(project);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(project, '.harness', 'scripts', _d), { recursive: true });
  }
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'update.sh'),
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
  );
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'prune-stale.mjs'),
    join(project, '.harness', 'scripts', 'setup', 'prune-stale.mjs'),
  );
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'project-owned.mjs'),
    join(project, '.harness', 'scripts', 'setup', 'project-owned.mjs'),
  );
  writeFileSync(
    join(project, '.harness', 'scripts', 'tooling', 'profile.mjs'),
    'old profile\n',
  );
  writeFileSync(
    join(project, '.harness', 'scripts', 'checks', 'stale-doctor.sh'),
    'old doctor\n',
  );
  writeFileSync(join(project, 'AGENTS.md'), 'old agents\n');
  commitAll(project, 'project');

  const applied = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
    ['--apply-harness', '--source-repo', source, '--source-ref', 'v2'],
    { cwd: project },
  );
  assert.equal(applied.status, 0, applied.stderr);
  assert.match(applied.stdout, /upstream에 더 이상 없는 stale shared 파일 정리: [1-9][0-9]*/);
  assert.doesNotMatch(
    applied.stdout,
    /stale-doctor\.sh/,
    'default update output should summarize pruned files instead of listing each path',
  );
  assert.equal(
    existsSync(join(project, '.harness', 'scripts', 'checks', 'stale-doctor.sh')),
    false,
    'stale shared file must be pruned',
  );
  assert.equal(
    readFileSync(
      join(project, '.harness', 'scripts', 'tooling', 'profile.mjs'),
      'utf8',
    ),
    'source profile\n',
  );
  assert.equal(
    readFileSync(join(project, 'AGENTS.md'), 'utf8'),
    'source agents\n',
  );
});

test('harness update --apply-harness prunes stale shared skill directories', () => {
  const source = mkdtempSync(join(tmpdir(), 'codi-harness-skill-prune-source-'));
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-skill-prune-project-'));

  initGitRepo(source);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(source, '.harness', 'scripts', _d), { recursive: true });
  }
  mkdirSync(join(source, '.harness', 'skills', 'current-skill'), {
    recursive: true,
  });
  for (const f of ['generate-manifest.mjs', 'prune-stale.mjs', 'project-owned.mjs']) {
    cpSync(
      join(root, '.harness', 'scripts', 'setup', f),
      join(source, '.harness', 'scripts', 'setup', f),
    );
  }
  writeFileSync(
    join(source, '.harness', 'skills', 'current-skill', 'SKILL.md'),
    'current skill\n',
  );
  const sourceManifest = runNode(
    '.harness/scripts/setup/generate-manifest.mjs',
    [],
    { cwd: source },
  );
  assert.equal(sourceManifest.status, 0, sourceManifest.stderr);
  commitAll(source, 'source');
  assert.equal(runCommand('git', ['branch', 'v2'], { cwd: source }).status, 0);

  initGitRepo(project);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(project, '.harness', 'scripts', _d), { recursive: true });
  }
  mkdirSync(join(project, '.harness', 'skills', 'old-skill'), {
    recursive: true,
  });
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'update.sh'),
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
  );
  for (const f of ['prune-stale.mjs', 'project-owned.mjs']) {
    cpSync(
      join(root, '.harness', 'scripts', 'setup', f),
      join(project, '.harness', 'scripts', 'setup', f),
    );
  }
  writeFileSync(
    join(project, '.harness', 'skills', 'old-skill', 'SKILL.md'),
    'old skill\n',
  );
  commitAll(project, 'project');

  const applied = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
    ['--apply-harness', '--source-repo', source, '--source-ref', 'v2'],
    { cwd: project },
  );
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(
    existsSync(join(project, '.harness', 'skills', 'old-skill')),
    false,
    'stale shared skill directory must be pruned',
  );
  assert.equal(
    existsSync(join(project, '.harness', 'skills', 'current-skill', 'SKILL.md')),
    true,
    'current upstream skill must be restored',
  );
});

test('update.sh prune step never touches project-owned paths', () => {
  const pruneSource = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'prune-stale.mjs'),
    'utf8',
  );
  const scanRootsMatch = pruneSource.match(/const SCAN_ROOTS = \[([\s\S]*?)\];/);
  assert.ok(scanRootsMatch, 'SCAN_ROOTS array must be present');
  const scanRoots = scanRootsMatch[1];
  for (const forbidden of ['"apps"', '"."', '".github"', '".planning"']) {
    assert.ok(
      !scanRoots.includes(forbidden),
      `SCAN_ROOTS must not include ${forbidden}`,
    );
  }
  const classifierSource = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'project-owned.mjs'),
    'utf8',
  );
  assert.match(classifierSource, /"\.planning"/);
  assert.match(classifierSource, /"apps"/);
  assert.match(classifierSource, /"\.github"/);
});

test('skills-link builds a merged tree from .harness/skills and .harness/skills-local', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-skills-link-'));
  mkdirSync(join(project, '.harness', 'skills', 'shared-skill'), { recursive: true });
  mkdirSync(join(project, '.harness', 'skills-local', 'project-skill'), {
    recursive: true,
  });
  writeFileSync(
    join(project, '.harness', 'skills', 'shared-skill', 'SKILL.md'),
    '# Shared\n',
  );
  writeFileSync(
    join(project, '.harness', 'skills-local', 'project-skill', 'SKILL.md'),
    '# Local\n',
  );

  mkdirSync(join(project, '.harness', 'scripts', 'setup'), { recursive: true });
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'skills-link.sh'),
    join(project, '.harness', 'scripts', 'setup', 'skills-link.sh'),
  );

  const result = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'skills-link.sh'),
    [],
    { cwd: project },
  );
  assert.equal(result.status, 0, result.stderr);

  for (const treeRoot of ['.claude/skills', '.agents/skills']) {
    const sharedLink = join(project, treeRoot, 'shared-skill');
    const localLink = join(project, treeRoot, 'project-skill');
    assert.ok(existsSync(sharedLink), `${treeRoot}/shared-skill must exist`);
    assert.ok(existsSync(localLink), `${treeRoot}/project-skill must exist`);
    assert.equal(
      lstatSyncIsSymlink(sharedLink),
      true,
      `${treeRoot}/shared-skill must be a symlink`,
    );
    assert.equal(
      lstatSyncIsSymlink(localLink),
      true,
      `${treeRoot}/project-skill must be a symlink`,
    );
  }
});

function lstatSyncIsSymlink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

test('skills-link does not delete tracked legacy skill symlinks by default', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-skills-link-legacy-'));
  initGitRepo(project);
  mkdirSync(join(project, '.harness', 'skills', 'shared-skill'), { recursive: true });
  mkdirSync(join(project, '.harness', 'skills-local'), { recursive: true });
  mkdirSync(join(project, '.harness', 'scripts', 'setup'), { recursive: true });
  mkdirSync(join(project, '.claude'), { recursive: true });
  mkdirSync(join(project, '.agents'), { recursive: true });
  writeFileSync(
    join(project, '.harness', 'skills', 'shared-skill', 'SKILL.md'),
    '# Shared\n',
  );
  writeFileSync(join(project, '.harness', 'skills-local', '.gitkeep'), '');
  symlinkSync('../.harness/skills', join(project, '.claude', 'skills'));
  symlinkSync('../.harness/skills', join(project, '.agents', 'skills'));
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'skills-link.sh'),
    join(project, '.harness', 'scripts', 'setup', 'skills-link.sh'),
  );
  commitAll(project, 'legacy symlink baseline');

  const result = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'skills-link.sh'),
    [],
    { cwd: project },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /추적 중인 구버전 symlink/);
  const status = runCommand('git', ['status', '--porcelain'], { cwd: project });
  assert.equal(status.status, 0, status.stderr);
  assert.equal(status.stdout, '', 'preflight-safe run must not dirty tracked symlinks');
});

test('skills-link fails on a name collision between shared and local', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-skills-collision-'));
  mkdirSync(join(project, '.harness', 'skills', 'codi-backend'), {
    recursive: true,
  });
  mkdirSync(join(project, '.harness', 'skills-local', 'codi-backend'), {
    recursive: true,
  });
  mkdirSync(join(project, '.harness', 'scripts', 'setup'), { recursive: true });
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'skills-link.sh'),
    join(project, '.harness', 'scripts', 'setup', 'skills-link.sh'),
  );

  const result = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'skills-link.sh'),
    [],
    { cwd: project },
  );
  assert.notEqual(result.status, 0, 'collision must fail');
  assert.match(result.stderr, /이름 충돌/);
  assert.match(result.stderr, /codi-backend/);
});

test('update --apply-harness preserves .harness/skills-local', () => {
  const source = mkdtempSync(join(tmpdir(), 'codi-harness-source-local-'));
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-project-local-'));

  initGitRepo(source);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(source, '.harness', 'scripts', _d), { recursive: true });
  }
  mkdirSync(join(source, '.harness', 'skills', 'codi-backend'), {
    recursive: true,
  });
  writeFileSync(
    join(source, '.harness', 'skills', 'codi-backend', 'SKILL.md'),
    'source skill\n',
  );
  commitAll(source, 'source');
  assert.equal(runCommand('git', ['branch', 'v2'], { cwd: source }).status, 0);

  initGitRepo(project);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(project, '.harness', 'scripts', _d), { recursive: true });
  }
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'update.sh'),
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
  );
  mkdirSync(join(project, '.harness', 'skills-local', 'project-only-skill'), {
    recursive: true,
  });
  writeFileSync(
    join(
      project,
      '.harness',
      'skills-local',
      'project-only-skill',
      'SKILL.md',
    ),
    'local only — never overwrite me\n',
  );
  commitAll(project, 'project');

  const applied = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
    ['--apply-harness', '--source-repo', source, '--source-ref', 'v2'],
    { cwd: project },
  );
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(
    readFileSync(
      join(
        project,
        '.harness',
        'skills-local',
        'project-only-skill',
        'SKILL.md',
      ),
      'utf8',
    ),
    'local only — never overwrite me\n',
  );
});

test('update --apply-harness preserves an empty .harness/skills-local directory', () => {
  const source = mkdtempSync(join(tmpdir(), 'codi-harness-source-empty-local-'));
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-project-empty-local-'));

  initGitRepo(source);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(source, '.harness', 'scripts', _d), { recursive: true });
  }
  mkdirSync(join(source, '.harness', 'skills', 'codi-backend'), {
    recursive: true,
  });
  writeFileSync(
    join(source, '.harness', 'skills', 'codi-backend', 'SKILL.md'),
    'source skill\n',
  );
  commitAll(source, 'source');
  assert.equal(runCommand('git', ['branch', 'v2'], { cwd: source }).status, 0);

  initGitRepo(project);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(project, '.harness', 'scripts', _d), { recursive: true });
  }
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'update.sh'),
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
  );
  mkdirSync(join(project, '.harness', 'skills-local'), { recursive: true });
  commitAll(project, 'project');

  const applied = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
    ['--apply-harness', '--source-repo', source, '--source-ref', 'v2'],
    { cwd: project },
  );
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(
    existsSync(join(project, '.harness', 'skills-local')),
    true,
    'empty project-owned skill directory must survive update cleanup',
  );
});

test('skills-local protection lives in the single classifier and shell fallbacks', () => {
  const classifier = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'project-owned.mjs'),
    'utf8',
  );
  assert.match(
    classifier,
    /\.harness\/skills-local/,
    'project-owned.mjs must protect .harness/skills-local',
  );
  assert.match(
    classifier,
    /\.harness\/config\/skill-triggers\.local\.json/,
    'project-owned.mjs must protect local skill triggers',
  );
  for (const file of [
    '.harness/scripts/setup/update.sh',
    '.harness/scripts/setup/update-check.sh',
  ]) {
    const body = readFileSync(join(root, file), 'utf8');
    assert.match(
      body,
      /\.harness\/skills-local/,
      `${file} shell fallback must protect .harness/skills-local`,
    );
    assert.match(
      body,
      /\.harness\/config\/skill-triggers\.local\.json/,
      `${file} shell fallback must protect local skill triggers`,
    );
  }
  for (const file of [
    '.harness/scripts/setup/generate-manifest.mjs',
    '.harness/scripts/setup/prune-stale.mjs',
  ]) {
    const body = readFileSync(join(root, file), 'utf8');
    assert.match(
      body,
      /from\s+"\.\/project-owned\.mjs"/,
      `${file} must import isProjectOwned from the shared classifier`,
    );
    assert.doesNotMatch(
      body,
      /function\s+isProjectOwned\s*\(/,
      `${file} must not re-implement isProjectOwned`,
    );
  }
});

test('skill-injector picks up a new skill in .harness/skills-local', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-injector-'));
  mkdirSync(join(project, '.harness', 'config'), { recursive: true });
  mkdirSync(
    join(project, '.harness', 'skills-local', 'my-domain-skill'),
    { recursive: true },
  );
  writeFileSync(
    join(
      project,
      '.harness',
      'skills-local',
      'my-domain-skill',
      'SKILL.md',
    ),
    '---\nname: my-domain-skill\ndescription: project-only skill\n---\n',
  );
  writeFileSync(
    join(project, '.harness', 'config', 'skill-triggers.local.json'),
    JSON.stringify({
      'my-domain-skill': { keywords: ['widget pipeline'] },
    }),
  );
  writeFileSync(
    join(project, '.harness', 'config', 'skill-triggers.json'),
    JSON.stringify({}),
  );

  const result = spawnSync(
    process.execPath,
    [join(root, '.harness', 'hooks', 'skill-injector.mjs')],
    {
      cwd: project,
      input: JSON.stringify({ prompt: 'help me extend the widget pipeline' }),
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_PROJECT_DIR: project },
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.match(parsed.additionalContext, /my-domain-skill/);
  assert.match(parsed.additionalContext, /\.harness\/skills-local/);
});

test('project-owned classifier exposes a deterministic --check CLI', () => {
  const cases = [
    ['.planning/STATE.md', 0, 'project-owned'],
    ['.harness/skills/codi-backend/SKILL.md', 1, 'shared'],
    ['.harness/skills-local/my-skill/SKILL.md', 0, 'project-owned'],
    ['.harness/config/skill-triggers.local.json', 0, 'project-owned'],
    ['apps/front/page.tsx', 0, 'project-owned'],
    ['AGENTS.md', 1, 'shared'],
    ['.harness/state/update-state.env', 0, 'project-owned'],
    ['.github/workflows/ci.yml', 0, 'project-owned'],
  ];
  for (const [path, expected, label] of cases) {
    const r = spawnSync(
      process.execPath,
      [
        join(root, '.harness', 'scripts', 'setup', 'project-owned.mjs'),
        '--check',
        path,
      ],
      { encoding: 'utf8' },
    );
    assert.equal(
      r.status,
      expected,
      `${path} expected to be ${label} (exit=${expected}), got exit=${r.status}`,
    );
  }
});

test('project-owned classifier --filter drops project-owned paths from stdin', () => {
  const input = [
    '.harness/skills/codi-backend/SKILL.md',
    '.planning/STATE.md',
    'apps/front/page.tsx',
    'AGENTS.md',
    '.harness/skills-local/my/SKILL.md',
    '',
    'README.md',
  ].join('\n');
  const r = spawnSync(
    process.execPath,
    [
      join(root, '.harness', 'scripts', 'setup', 'project-owned.mjs'),
      '--filter',
    ],
    { input, encoding: 'utf8' },
  );
  assert.equal(r.status, 0, r.stderr);
  const out = r.stdout.split('\n').filter((line) => line.length > 0).sort();
  assert.deepEqual(out, ['.harness/skills/codi-backend/SKILL.md', 'AGENTS.md']);
});

test('doctor self-heals a missing .harness/skills-local without failing', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-doctor-skills-local-'));
  cpSync(join(root, '.harness'), join(project, '.harness'), {
    recursive: true,
  });
  cpSync(join(root, '.claude'), join(project, '.claude'), { recursive: true });
  cpSync(join(root, '.codex'), join(project, '.codex'), { recursive: true });
  cpSync(join(root, '.agents'), join(project, '.agents'), { recursive: true });
  cpSync(join(root, 'tests'), join(project, 'tests'), { recursive: true });
  for (const f of [
    'AGENTS.md',
    'CLAUDE.md',
    'README.md',
    'ARCHITECTURE.md',
    'CONTRIBUTING.md',
    'mise.toml',
    'package.json',
    'package-lock.json',
    '.gitignore',
    'harness',
    'lint-staged.config.mjs',
  ]) {
    try {
      cpSync(join(root, f), join(project, f));
    } catch {}
  }
  const skillsLocal = join(project, '.harness', 'skills-local');
  if (existsSync(skillsLocal)) {
    spawnSync('rm', ['-rf', skillsLocal]);
  }
  assert.equal(existsSync(skillsLocal), false, 'precondition: skills-local removed');
  const r = spawnSync('bash', [join(project, '.harness', 'scripts', 'checks', 'doctor.sh')], {
    cwd: project,
    encoding: 'utf8',
  });
  assert.match(
    r.stdout,
    /skills-local 이 없어 빈 디렉터리를 생성했습니다/,
    'doctor should have warned and self-healed',
  );
  assert.equal(
    existsSync(skillsLocal),
    true,
    'doctor must have created .harness/skills-local',
  );
});

test('update --apply-harness invokes skills-link.sh at the end', () => {
  const body = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'update.sh'),
    'utf8',
  );
  const fnStart = body.indexOf('apply_harness_update()');
  assert.ok(fnStart >= 0, 'apply_harness_update function must exist');
  const fnEnd = body.indexOf('\n}\n', fnStart);
  assert.ok(fnEnd > fnStart, 'apply_harness_update function must close');
  const fnBody = body.slice(fnStart, fnEnd);
  assert.match(
    fnBody,
    /skills-link\.sh/,
    'apply_harness_update must invoke skills-link.sh',
  );
});

test('skills-link fails fast on a non-symlink child in the merged tree', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-link-nonsymlink-'));
  mkdirSync(join(project, '.harness', 'skills', 'shared'), { recursive: true });
  writeFileSync(
    join(project, '.harness', 'skills', 'shared', 'SKILL.md'),
    '# Shared\n',
  );
  mkdirSync(join(project, '.harness', 'scripts', 'setup'), { recursive: true });
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'skills-link.sh'),
    join(project, '.harness', 'scripts', 'setup', 'skills-link.sh'),
  );
  mkdirSync(join(project, '.claude', 'skills'), { recursive: true });
  writeFileSync(
    join(project, '.claude', 'skills', 'real-file.md'),
    'oops, not a symlink',
  );

  const r = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'skills-link.sh'),
    [],
    { cwd: project },
  );
  assert.notEqual(r.status, 0, 'skills-link must fail when a non-symlink child is present');
  assert.match(r.stderr, /symlink가 아니므로/);
});

test('guardrails block .harness/skills writes in a downstream project', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-guard-downstream-'));
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'my-downstream-app' }),
  );
  const input = JSON.stringify({
    tool_name: 'Write',
    tool_input: {
      file_path: join(project, '.harness', 'skills', 'foo', 'SKILL.md'),
    },
    cwd: project,
  });
  const r = spawnSync(
    process.execPath,
    [join(root, '.harness', 'hooks', 'guardrails.mjs')],
    { input, encoding: 'utf8' },
  );
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.stdout.length > 0, 'guardrails must print a decision JSON');
  const decision = JSON.parse(r.stdout);
  assert.equal(decision.decision, 'block');
  assert.match(decision.reason, /skills-local/);
});

test('guardrails block relative Write/Edit paths when cwd is under .harness', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-guard-relative-'));
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'my-downstream-app' }),
  );
  mkdirSync(join(project, '.harness', 'skills', 'foo'), { recursive: true });
  mkdirSync(join(project, '.harness', 'skills-local', 'foo'), { recursive: true });
  for (const [cwd, filePath, expect] of [
    [project, '.harness/skills/foo/SKILL.md', 'block'],
    [join(project, '.harness'), 'skills/foo/SKILL.md', 'block'],
    [join(project, '.harness', 'skills'), 'foo/SKILL.md', 'block'],
    [join(project, '.harness', 'skills', 'foo'), 'SKILL.md', 'block'],
    [join(project, '.harness'), 'skills-local/foo/SKILL.md', 'allow'],
  ]) {
    const input = JSON.stringify({
      tool_name: 'Write',
      tool_input: { file_path: filePath },
      cwd,
    });
    const r = spawnSync(
      process.execPath,
      [join(root, '.harness', 'hooks', 'guardrails.mjs')],
      { input, encoding: 'utf8' },
    );
    assert.equal(r.status, 0, r.stderr);
    if (expect === 'block') {
      const decision = JSON.parse(r.stdout || '{}');
      assert.equal(
        decision.decision,
        'block',
        `must block cwd=${cwd} file_path=${filePath}`,
      );
    } else {
      assert.equal(r.stdout, '', `must allow cwd=${cwd} file_path=${filePath}`);
    }
  }
});

test('guardrails allow .harness/skills writes in the harness repo itself', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-guard-harnessrepo-'));
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'codi-harness-v2' }),
  );
  assert.equal(spawnSync('git', ['init', '-q'], { cwd: project }).status, 0);
  assert.equal(
    spawnSync('git', ['remote', 'add', 'origin', 'https://github.com/CODIWORKS-Engineer/codi-harness.git'], {
      cwd: project,
    }).status,
    0,
  );
  const input = JSON.stringify({
    tool_name: 'Write',
    tool_input: {
      file_path: join(project, '.harness', 'skills', 'foo', 'SKILL.md'),
    },
    cwd: project,
  });
  const r = spawnSync(
    process.execPath,
    [join(root, '.harness', 'hooks', 'guardrails.mjs')],
    { input, encoding: 'utf8' },
  );
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, '', 'no block decision should be emitted');
});

test('guardrails do not allow HARNESS_REPO env to bypass downstream skill protection', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-env-bypass-'));
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'my-downstream-app' }),
  );
  const input = JSON.stringify({
    tool_name: 'Write',
    tool_input: {
      file_path: join(project, '.harness', 'skills', 'foo', 'SKILL.md'),
    },
    cwd: project,
  });
  const r = spawnSync(
    process.execPath,
    [join(root, '.harness', 'hooks', 'guardrails.mjs')],
    {
      input,
      encoding: 'utf8',
      env: { ...process.env, HARNESS_REPO: '1' },
    },
  );
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.stdout.length > 0, 'env var alone must not bypass downstream guard');
  const decision = JSON.parse(r.stdout);
  assert.equal(decision.decision, 'block');
});

test('guardrails allow .harness/skills-local writes everywhere', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-guard-skills-local-'));
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'my-downstream-app' }),
  );
  const input = JSON.stringify({
    tool_name: 'Write',
    tool_input: {
      file_path: join(project, '.harness', 'skills-local', 'my-skill', 'SKILL.md'),
    },
    cwd: project,
  });
  const r = spawnSync(
    process.execPath,
    [join(root, '.harness', 'hooks', 'guardrails.mjs')],
    { input, encoding: 'utf8' },
  );
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, '', 'no block decision should be emitted');
});

test('guardrails block every Bash write path into .harness/skills/', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-bash-bypass-'));
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'my-downstream-app' }),
  );
  const commands = [
    'echo x > .harness/skills/foo/SKILL.md',
    'echo x >> .harness/skills/foo/SKILL.md',
    'echo x 3> .harness/skills/foo/SKILL.md',
    'echo x 9> .harness/skills/foo/SKILL.md',
    'echo x | tee .harness/skills/foo/SKILL.md',
    'cp /tmp/x .harness/skills/foo/SKILL.md',
    'diff --output=.harness/skills/foo/SKILL.md /tmp/a /tmp/b',
    'diff --output .harness/skills/foo.patch /tmp/a /tmp/b',
    'less -o .harness/skills/foo/SKILL.md /tmp/a',
    'mv /tmp/x .harness/skills/foo/SKILL.md',
    'install /tmp/x .harness/skills/foo/SKILL.md',
    'ln -s /tmp/x .harness/skills/foo/SKILL.md',
    'cp -r /tmp/foo .harness/skills',
    'rsync /tmp/x .harness/skills',
    'mkdir -p .harness/skills/foo',
    'touch .harness/skills/foo/SKILL.md',
    'touch /tmp/ref .harness/skills/foo/SKILL.md',
    'touch -r /tmp/ref .harness/skills/foo/SKILL.md',
    'touch -t 202401010101 .harness/skills/foo/SKILL.md',
    'cp /tmp/x .harness/skills/foo/SKILL.md > /dev/null',
    'cp .harness/skills/foo/SKILL.md .harness/skills-local/foo/SKILL.md',
    'cp /tmp/x .harness/skills/foo/SKILL.md 2>/tmp/err',
    'cp /tmp/x .harness/skills/foo/SKILL.md </tmp/in',
    'cp /tmp/x .harness/skills/foo/SKILL.md # comment',
    'cp /tmp/x .harness/skills/foo/SKILL.md &> /tmp/log',
    "cp /tmp/x '.harness/skills/foo/SKILL.md'",
    'cp /tmp/x ".harness/skills/foo/SKILL.md"',
    "mv /tmp/x '.harness/skills/foo/SKILL.md'",
    "rsync /tmp/x '.harness/skills/foo/SKILL.md'",
    'echo x > .harness/skills-local/../skills/foo/SKILL.md',
    'python -c "open(\'.harness/skills/foo/SKILL.md\',\'w\').write(\'x\')"',
    'node -e "require(\'fs\').writeFileSync(\'.harness/skills/foo/SKILL.md\',\'x\')"',
    'sudo cp /tmp/x .harness/skills/foo/SKILL.md',
    'mise exec -- node -e "require(\'fs\').writeFileSync(\'.harness/skills/foo/SKILL.md\',\'x\')"',
    'cat .harness/skills/foo/SKILL.md; cp /tmp/x .harness/skills/bar/SKILL.md',
    'ls .harness/skills && touch .harness/skills/foo/SKILL.md',
    'ls .harness/skills || echo > .harness/skills/foo/SKILL.md',
    'cat .harness/skills/foo | tee .harness/skills/bar/SKILL.md',
    'find .harness/skills -type f -delete',
    'find .harness/skills -exec rm {} +',
    "find .harness/skills -name '*.md'",
    'git rm .harness/skills/foo/SKILL.md',
    'git restore .harness/skills/foo/SKILL.md',
    'git checkout -- .harness/skills/foo/SKILL.md',
    'cat /tmp/x 10> .harness/skills/foo/SKILL.md',
    'cat /tmp/x 3<> .harness/skills/foo/SKILL.md',
    'cat /tmp/x > >(tee .harness/skills/foo/SKILL.md)',
    'cat $(cp /tmp/x .harness/skills/foo/SKILL.md)',
    'ls `touch .harness/skills/foo/SKILL.md`',
    'cat <(cp /tmp/x .harness/skills/foo/SKILL.md)',
    'echo $(cat $(cp /tmp/x .harness/skills/foo/SKILL.md))',
    'cp /tmp/x .harness//skills/foo/SKILL.md',
    'cp /tmp/x .harness/./skills/foo/SKILL.md',
    "cp /tmp/x .harness/skill''s/foo/SKILL.md",
    'cp /tmp/x .harness/skill""s/foo/SKILL.md',
    'cp /tmp/x .harness/skill\\s/foo/SKILL.md',
    'cp /tmp/x .harness/.//.//skills/foo/SKILL.md',
    'touch .harness/{skills,foo}/SKILL.md',
    'echo x > .harness/{skills,foo}/SKILL.md',
    'touch .harness/{skill,skill}s/foo/SKILL.md',
  ];
  for (const command of commands) {
    const input = JSON.stringify({
      cwd: project,
      tool_name: 'Bash',
      tool_input: { command },
    });
    const r = spawnSync(
      process.execPath,
      [join(root, '.harness', 'hooks', 'guardrails.mjs')],
      { input, encoding: 'utf8' },
    );
    assert.equal(r.status, 0, r.stderr);
    assert.ok(
      r.stdout.length > 0,
      `Bash bypass should be blocked: ${command}`,
    );
    const decision = JSON.parse(r.stdout);
    assert.equal(decision.decision, 'block', `must block: ${command}`);
  }
});

test('guardrails allow safe Bash commands around .harness/skills', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-bash-allow-'));
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'my-downstream-app' }),
  );
  const allowed = [
    'ls .harness/skills/',
    'ls .harness/skills',
    'cat .harness/skills/codi-backend/SKILL.md',
    'grep -r foo .harness/skills/',
    'head .harness/skills/x/SKILL.md',
    'wc -l .harness/skills/codi-backend/SKILL.md',
    'stat .harness/skills/codi-backend/SKILL.md',
    'diff -ru .harness/skills .harness/skills-local',
    'diff .harness/skills/foo/SKILL.md .harness/skills-local/foo/SKILL.md',
    'cat .harness/skills/foo/SKILL.md > /tmp/copy',
    'grep -l foo .harness/skills/ > /tmp/list',
    'echo x > .harness/skills-local/my/SKILL.md',
    'mkdir -p .harness/skills-local/my',
    'touch .harness/skills-local/my/SKILL.md',
    'cp /tmp/x .harness/skills-local/my/SKILL.md',
    'cat < .harness/skills/foo/SKILL.md',
    'ls .harness/skills && cat .harness/skills/foo/SKILL.md',
    'cat .harness/skills/a; ls .harness/skills',
    'time cat .harness/skills/foo/SKILL.md',
    'nice cat .harness/skills/foo/SKILL.md',
    'git add .harness/skills/foo/SKILL.md',
    'git add -A .harness/skills',
    'git -C . add .harness/skills/foo/SKILL.md',
    'git restore --staged .harness/skills/foo/SKILL.md',
    'git reset HEAD -- .harness/skills/foo/SKILL.md',
  ];
  for (const command of allowed) {
    const input = JSON.stringify({
      cwd: project,
      tool_name: 'Bash',
      tool_input: { command },
    });
    const r = spawnSync(
      process.execPath,
      [join(root, '.harness', 'hooks', 'guardrails.mjs')],
      { input, encoding: 'utf8' },
    );
    assert.equal(r.status, 0, r.stderr);
    assert.equal(
      r.stdout,
      '',
      `safe Bash command must not be blocked: ${command}`,
    );
  }
});
test('guardrails block cwd-relative writes when cwd is inside the shared tree', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-cwd-write-'));
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'downstream-app' }),
  );
  mkdirSync(join(project, '.harness', 'skills'), { recursive: true });
  for (const [bashCwd, command, expect] of [
    [join(project, '.harness'), 'touch skills/foo/SKILL.md', 'block'],
    [join(project, '.harness'), 'echo x > skills/foo/SKILL.md', 'block'],
    [join(project, '.harness'), 'cp /tmp/x skills/foo/SKILL.md', 'block'],
    [join(project, '.harness'), 'touch ./skills/foo/SKILL.md', 'block'],
    [join(project, '.harness'), 'echo x > ./skills/foo/SKILL.md', 'block'],
    [join(project, '.harness'), 'touch "skills"/foo/SKILL.md', 'block'],
    [join(project, '.harness'), "touch 'skills'/foo/SKILL.md", 'block'],
    [join(project, '.harness'), 'cat skills/foo/SKILL.md', 'allow'],
    [join(project, '.harness'), 'ls skills', 'allow'],
    [join(project, '.harness'), 'git status', 'allow'],
    [join(project, '.harness'), 'pwd', 'allow'],
    [join(project, '.harness'), 'node --version', 'allow'],
    [join(project, '.harness'), 'cp /tmp/x skills-local/my/SKILL.md', 'allow'],
    [join(project, '.harness'), 'mkdir -p skills-local/my', 'allow'],
    [join(project, '.harness', 'skills'), 'touch foo/SKILL.md', 'block'],
    [join(project, '.harness', 'skills'), 'echo x > foo/SKILL.md', 'block'],
    [join(project, '.harness', 'skills'), 'cp /tmp/x foo/SKILL.md', 'block'],
    [join(project, '.harness', 'skills'), 'git checkout -- SKILL.md', 'block'],
    [join(project, '.harness', 'skills'), 'git diff --output=SKILL.md', 'block'],
    [join(project, '.harness', 'skills'), 'git log --output=SKILL.md', 'block'],
    [join(project, '.harness', 'skills'), 'git show --output=SKILL.md', 'block'],
    [join(project, '.harness', 'skills'), 'git grep foo --output=SKILL.md', 'block'],
    [join(project, '.harness', 'skills'), 'git diff --ext-diff', 'block'],
    [join(project, '.harness', 'skills'), 'cat foo/SKILL.md', 'allow'],
    [join(project, '.harness', 'skills'), 'ls', 'allow'],
    [join(project, '.harness', 'skills'), 'git status', 'allow'],
    [join(project, '.harness', 'skills'), 'git rev-parse --show-toplevel', 'allow'],
    [join(project, '.harness', 'skills'), 'pwd', 'allow'],
    [join(project, '.harness', 'skills'), 'which node', 'allow'],
    [join(project, '.harness', 'skills'), 'node --version', 'allow'],
    [join(project, '.harness', 'skills'), 'npm --version', 'allow'],
    [join(project, '.harness', 'skills'), 'echo hello', 'allow'],
  ]) {
    const input = JSON.stringify({
      cwd: bashCwd,
      tool_name: 'Bash',
      tool_input: { command, cwd: bashCwd },
    });
    const r = spawnSync(
      process.execPath,
      [join(root, '.harness', 'hooks', 'guardrails.mjs')],
      { input, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: project } },
    );
    assert.equal(r.status, 0, r.stderr);
    if (expect === 'block') {
      assert.ok(
        r.stdout.length > 0,
        `must block cwd=${bashCwd} cmd=${command}`,
      );
    } else {
      assert.equal(
        r.stdout,
        '',
        `must allow cwd=${bashCwd} cmd=${command}: ${r.stdout}`,
      );
    }
  }
});
test('guardrails infer project root from .harness ancestor when env+git absent', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-no-root-'));
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'downstream-app' }),
  );
  mkdirSync(join(project, '.harness', 'skills'), { recursive: true });
  const envWithoutClaude = { ...process.env };
  delete envWithoutClaude.CLAUDE_PROJECT_DIR;
  for (const [bashCwd, command, expect] of [
    [join(project, '.harness'), 'touch skills/foo/SKILL.md', 'block'],
    [join(project, '.harness', 'skills'), 'touch foo/SKILL.md', 'block'],
    [join(project, '.harness', 'skills'), 'cat foo/SKILL.md', 'allow'],
  ]) {
    const input = JSON.stringify({
      cwd: bashCwd,
      tool_name: 'Bash',
      tool_input: { command, cwd: bashCwd },
    });
    const r = spawnSync(
      process.execPath,
      [join(root, '.harness', 'hooks', 'guardrails.mjs')],
      { input, encoding: 'utf8', env: envWithoutClaude },
    );
    assert.equal(r.status, 0, r.stderr);
    if (expect === 'block') {
      assert.ok(
        r.stdout.length > 0,
        `must block cwd=${bashCwd} cmd=${command}`,
      );
    } else {
      assert.equal(
        r.stdout,
        '',
        `must allow cwd=${bashCwd} cmd=${command}: ${r.stdout}`,
      );
    }
  }
});
// skills-local 예외는 한 simple 단위로만 적용된다. 같은 줄에 공용
// tree를 건드리는 다른 simple이 섞이면 차단해야 한다.
test('guardrails skills-local carve-out is per simple command', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-carve-out-'));
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'downstream-app' }),
  );
  mkdirSync(join(project, '.harness', 'skills'), { recursive: true });
  const bashCwd = join(project, '.harness');
  for (const command of [
    'cat /etc/passwd; cp /tmp/x skills/foo/SKILL.md # skills-local',
    'cp /tmp/x skills/foo/SKILL.md skills-local/',
    ': skills-local; cp /tmp/x skills/foo/SKILL.md',
    'mkdir -p skills-local/my && touch skills/foo/SKILL.md',
  ]) {
    const input = JSON.stringify({
      cwd: bashCwd,
      tool_name: 'Bash',
      tool_input: { command, cwd: bashCwd },
    });
    const r = spawnSync(
      process.execPath,
      [join(root, '.harness', 'hooks', 'guardrails.mjs')],
      { input, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: project } },
    );
    assert.equal(r.status, 0, r.stderr);
    assert.ok(r.stdout.length > 0, `must block compound: ${command}`);
  }
});

// 공용 tree 안에서의 ambient 허용은 `git status`, `node --version` 같은
// 읽기 형태만 인정한다. 변경 가능한 subcommand나 명령 실행기는 차단해야 한다.
test('guardrails ambient-safe list refuses mutating subcommands', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-ambient-'));
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'downstream-app' }),
  );
  mkdirSync(join(project, '.harness', 'skills'), { recursive: true });
  const inside = join(project, '.harness', 'skills');
  for (const command of [
    'git rm SKILL.md',
    'git apply /tmp/patch.diff',
    'git -C skills rm foo/SKILL.md',
    'node -e "require(\'fs\').writeFileSync(\'foo\',\'x\')"',
    'npm --prefix skills install left-pad',
    'pnpm install',
    'mise run build',
    'source /tmp/write-shared.sh',
  ]) {
    const input = JSON.stringify({
      cwd: inside,
      tool_name: 'Bash',
      tool_input: { command, cwd: inside },
    });
    const r = spawnSync(
      process.execPath,
      [join(root, '.harness', 'hooks', 'guardrails.mjs')],
      { input, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: project } },
    );
    assert.equal(r.status, 0, r.stderr);
    assert.ok(r.stdout.length > 0, `must block mutating subcommand: ${command}`);
  }
});

// 절대경로 redirect가 다시 자기 프로젝트의 공용 tree로 들어오면 차단한다.
// 프로젝트 밖 절대경로와 /dev/null은 통과한다.
test('guardrails block absolute redirects back into the project shared tree', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-abs-redir-'));
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'downstream-app' }),
  );
  mkdirSync(join(project, '.harness', 'skills'), { recursive: true });
  const inside = join(project, '.harness', 'skills');
  const harnessCwd = join(project, '.harness');
  const shared = join(project, '.harness', 'skills', 'foo', 'SKILL.md');
  for (const [bashCwd, command, expect] of [
    [inside, `echo x > ${shared}`, 'block'],
    [harnessCwd, `echo x > ${shared}`, 'block'],
    [inside, 'echo x > /tmp/external-redir.txt', 'allow'],
    [inside, 'echo x > /dev/null', 'allow'],
  ]) {
    const input = JSON.stringify({
      cwd: bashCwd,
      tool_name: 'Bash',
      tool_input: { command, cwd: bashCwd },
    });
    const r = spawnSync(
      process.execPath,
      [join(root, '.harness', 'hooks', 'guardrails.mjs')],
      { input, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: project } },
    );
    assert.equal(r.status, 0, r.stderr);
    if (expect === 'block') {
      assert.ok(r.stdout.length > 0, `must block ${command}`);
    } else {
      assert.equal(r.stdout, '', `must allow ${command}: ${r.stdout}`);
    }
  }
});

// `.harness`가 프로젝트 밖을 가리키는 symlink여도 realpath 이전의 cwd
// 세그먼트를 함께 보고 공용 tree write로 판정한다.
test('guardrails detect symlinked .harness via raw cwd inspection', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-symlink-'));
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'downstream-app' }),
  );
  const real = mkdtempSync(join(tmpdir(), 'codi-harness-symlink-real-'));
  mkdirSync(join(real, 'skills'), { recursive: true });
  spawnSync('ln', ['-s', real, join(project, '.harness')]);
  for (const [bashCwd, command, expect] of [
    [join(project, '.harness'), 'touch skills/foo/SKILL.md', 'block'],
    [join(project, '.harness', 'skills'), 'touch foo/SKILL.md', 'block'],
    [join(project, '.harness'), 'cat skills/foo/SKILL.md', 'allow'],
  ]) {
    const input = JSON.stringify({
      cwd: bashCwd,
      tool_name: 'Bash',
      tool_input: { command, cwd: bashCwd },
    });
    const r = spawnSync(
      process.execPath,
      [join(root, '.harness', 'hooks', 'guardrails.mjs')],
      { input, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: project } },
    );
    assert.equal(r.status, 0, r.stderr);
    if (expect === 'block') {
      assert.ok(r.stdout.length > 0, `must block cwd=${bashCwd} cmd=${command}`);
    } else {
      assert.equal(r.stdout, '', `must allow cwd=${bashCwd} cmd=${command}: ${r.stdout}`);
    }
  }
});

test('guardrails cap substitution recursion depth (fail closed)', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-dos-cap-'));
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'downstream-app' }),
  );
  const depth = 200;
  const command =
    'cat ' +
    '$('.repeat(depth) +
    'cp /tmp/x .harness/skills/foo/SKILL.md' +
    ')'.repeat(depth);
  const start = Date.now();
  const input = JSON.stringify({
    cwd: project,
    tool_name: 'Bash',
    tool_input: { command },
  });
  const r = spawnSync(
    process.execPath,
    [join(root, '.harness', 'hooks', 'guardrails.mjs')],
    { input, encoding: 'utf8', timeout: 5000 },
  );
  const elapsed = Date.now() - start;
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.stdout.length > 0, 'deep nesting must block');
  assert.ok(elapsed < 4000, `must complete fast even for depth=${depth} (got ${elapsed}ms)`);
});

test('guardrails accept the canonical harness origin (HTTPS and SSH)', () => {
  for (const remote of [
    'https://github.com/CODIWORKS-Engineer/codi-harness.git',
    'https://github.com/CODIWORKS-Engineer/codi-harness-v2',
    'git@github.com:CODIWORKS-Engineer/codi-harness.git',
  ]) {
    const project = mkdtempSync(join(tmpdir(), 'codi-harness-origin-ok-'));
    writeFileSync(
      join(project, 'package.json'),
      JSON.stringify({ name: 'codi-harness-v2' }),
    );
    assert.equal(spawnSync('git', ['init', '-q'], { cwd: project }).status, 0);
    assert.equal(
      spawnSync('git', ['remote', 'add', 'origin', remote], { cwd: project }).status,
      0,
    );
    const input = JSON.stringify({
      cwd: project,
      tool_name: 'Write',
      tool_input: {
        file_path: join(project, '.harness', 'skills', 'foo', 'SKILL.md'),
      },
    });
    const r = spawnSync(
      process.execPath,
      [join(root, '.harness', 'hooks', 'guardrails.mjs')],
      { input, encoding: 'utf8' },
    );
    assert.equal(r.status, 0, r.stderr);
    assert.equal(
      r.stdout,
      '',
      `canonical origin ${remote} must not be blocked`,
    );
  }
});

test('update.sh manual apply fails nonzero when skills-link fails; --auto warns', () => {
  const source = mkdtempSync(join(tmpdir(), 'codi-harness-fail-src-'));
  initGitRepo(source);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(source, '.harness', 'scripts', _d), { recursive: true });
  }
  for (const f of ['update.sh', 'generate-manifest.mjs', 'prune-stale.mjs', 'project-owned.mjs', 'skills-link.sh']) {
    cpSync(
      join(root, '.harness', 'scripts', 'setup', f),
      join(source, '.harness', 'scripts', 'setup', f),
    );
  }
  mkdirSync(join(source, '.harness', 'skills', 'sample'), { recursive: true });
  writeFileSync(
    join(source, '.harness', 'skills', 'sample', 'SKILL.md'),
    'upstream skill\n',
  );
  commitAll(source, 'initial');
  const r1 = runNode(
    '.harness/scripts/setup/generate-manifest.mjs',
    [],
    { cwd: source },
  );
  assert.equal(r1.status, 0, r1.stderr);
  runCommand('git', ['add', '.harness/shared-manifest.json'], { cwd: source });
  runCommand('git', ['commit', '-q', '-m', 'manifest'], { cwd: source });
  assert.equal(runCommand('git', ['branch', 'v2'], { cwd: source }).status, 0);
  function makeProject() {
    const project = mkdtempSync(join(tmpdir(), 'codi-harness-fail-proj-'));
    initGitRepo(project);
    for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
      mkdirSync(join(project, '.harness', 'scripts', _d), { recursive: true });
    }
    for (const f of ['update.sh', 'prune-stale.mjs', 'project-owned.mjs', 'skills-link.sh']) {
      cpSync(
        join(root, '.harness', 'scripts', 'setup', f),
        join(project, '.harness', 'scripts', 'setup', f),
      );
    }
    commitAll(project, 'project');
    mkdirSync(join(project, '.claude', 'skills'), { recursive: true });
    writeFileSync(
      join(project, '.claude', 'skills', 'polluted.md'),
      'not a symlink',
    );
    return project;
  }

  const manualProject = makeProject();
  const manualResult = runCommand(
    join(manualProject, '.harness', 'scripts', 'setup', 'update.sh'),
    ['--apply-harness', '--source-repo', source, '--source-ref', 'v2'],
    { cwd: manualProject },
  );
  assert.notEqual(manualResult.status, 0, 'manual apply must fail nonzero when skills-link fails');
  assert.match(
    manualResult.stderr,
    /skills-link\.sh 실행에 실패/,
    'manual apply must surface the skills-link failure',
  );

  const autoProject = makeProject();
  const autoResult = runCommand(
    join(autoProject, '.harness', 'scripts', 'setup', 'update.sh'),
    ['--apply-harness', '--auto', '--source-repo', source, '--source-ref', 'v2'],
    { cwd: autoProject },
  );
  assert.equal(autoResult.status, 0, '--auto must keep going after skills-link failure');
  assert.match(
    autoResult.stderr,
    /skills-link\.sh 실행 실패/,
    '--auto must warn about skills-link failure',
  );
});

test('project-profile-guard blocks apps/back via absolute path under next-fullstack', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-profile-abs-'));
  mkdirSync(join(project, '.harness', 'config'), { recursive: true });
  writeFileSync(
    join(project, '.harness', 'config', 'project-profile.yaml'),
    'mode: next-fullstack\n',
  );
  const input = JSON.stringify({
    cwd: project,
    tool_input: {
      file_path: join(project, 'apps', 'back', 'src', 'server.ts'),
    },
  });
  const r = spawnSync(
    process.execPath,
    [join(root, '.harness', 'hooks', 'project-profile-guard.mjs')],
    { input, encoding: 'utf8' },
  );
  assert.equal(r.status, 0, r.stderr);
  const decision = JSON.parse(r.stdout || '{}');
  assert.equal(decision.decision, 'block');
  assert.match(decision.reason, /apps\/back/);
});

test('project-profile-guard still allows apps/front under next-fullstack via absolute path', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-profile-allow-'));
  mkdirSync(join(project, '.harness', 'config'), { recursive: true });
  writeFileSync(
    join(project, '.harness', 'config', 'project-profile.yaml'),
    'mode: next-fullstack\n',
  );
  const input = JSON.stringify({
    cwd: project,
    tool_input: {
      file_path: join(project, 'apps', 'front', 'src', 'page.tsx'),
    },
  });
  const r = spawnSync(
    process.execPath,
    [join(root, '.harness', 'hooks', 'project-profile-guard.mjs')],
    { input, encoding: 'utf8' },
  );
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, '', 'apps/front must not be blocked under next-fullstack');
});

test('guardrails reject spoofed harness origins (owner and host)', () => {
  const hostiles = [
    'https://github.com/evil/codi-harness-v2.git',
    'https://github.com/foo/codi-harness.git',
    'https://evil.com/CODIWORKS-Engineer/codi-harness-v2.git',
    'https://gitlab.com/CODIWORKS-Engineer/codi-harness.git',
    'git@evil.com:CODIWORKS-Engineer/codi-harness.git',
    'ssh://git@bitbucket.org/CODIWORKS-Engineer/codi-harness-v2',
  ];
  for (const remote of hostiles) {
    const project = mkdtempSync(join(tmpdir(), 'codi-harness-host-spoof-'));
    writeFileSync(
      join(project, 'package.json'),
      JSON.stringify({ name: 'codi-harness-v2' }),
    );
    assert.equal(spawnSync('git', ['init', '-q'], { cwd: project }).status, 0);
    assert.equal(
      spawnSync('git', ['remote', 'add', 'origin', remote], { cwd: project })
        .status,
      0,
    );
    const input = JSON.stringify({
      cwd: project,
      tool_name: 'Write',
      tool_input: {
        file_path: join(project, '.harness', 'skills', 'foo', 'SKILL.md'),
      },
    });
    const r = spawnSync(
      process.execPath,
      [join(root, '.harness', 'hooks', 'guardrails.mjs')],
      { input, encoding: 'utf8' },
    );
    assert.equal(r.status, 0, r.stderr);
    assert.ok(
      r.stdout.length > 0,
      `host-spoofed origin must not bypass guard: ${remote}`,
    );
    const decision = JSON.parse(r.stdout);
    assert.equal(decision.decision, 'block');
  }
});

test('update.sh manual mode exits nonzero on stale dirty files; --auto warns', () => {
  const source = mkdtempSync(join(tmpdir(), 'codi-harness-stale-dirty-src-'));
  initGitRepo(source);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(source, '.harness', 'scripts', _d), { recursive: true });
  }
  for (const f of ['update.sh', 'prune-stale.mjs', 'project-owned.mjs', 'skills-link.sh']) {
    cpSync(
      join(root, '.harness', 'scripts', 'setup', f),
      join(source, '.harness', 'scripts', 'setup', f),
    );
  }
  const manifest = {
    schema_version: 1,
    files: [
      '.harness/scripts/setup/update.sh',
      '.harness/scripts/setup/prune-stale.mjs',
      '.harness/scripts/setup/project-owned.mjs',
      '.harness/scripts/setup/skills-link.sh',
    ].sort(),
  };
  writeFileSync(
    join(source, '.harness', 'shared-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  commitAll(source, 'initial');
  assert.equal(runCommand('git', ['branch', 'v2'], { cwd: source }).status, 0);

  function makeProjectWithDirtyStale() {
    const project = mkdtempSync(join(tmpdir(), 'codi-harness-stale-dirty-proj-'));
    initGitRepo(project);
    for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
      mkdirSync(join(project, '.harness', 'scripts', _d), { recursive: true });
    }
    for (const f of ['update.sh', 'prune-stale.mjs', 'project-owned.mjs', 'skills-link.sh']) {
      cpSync(
        join(root, '.harness', 'scripts', 'setup', f),
        join(project, '.harness', 'scripts', 'setup', f),
      );
    }
    writeFileSync(
      join(project, '.harness', 'shared-manifest.json'),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    commitAll(project, 'initial');
    writeFileSync(
      join(project, '.harness', 'scripts', 'checks', 'stale-script.sh'),
      'untracked stale work\n',
    );
    return project;
  }

  const manualProject = makeProjectWithDirtyStale();
  const manualResult = runCommand(
    join(manualProject, '.harness', 'scripts', 'setup', 'update.sh'),
    ['--apply-harness', '--source-repo', source, '--source-ref', 'v2'],
    { cwd: manualProject },
  );
  assert.notEqual(
    manualResult.status,
    0,
    'manual update must exit nonzero when stale dirty files remain',
  );
  assert.match(
    manualResult.stderr,
    /stale shared 파일에 로컬 변경|하네스 적용이 완료되지 않았습니다/,
    'manual must surface the stale dirty failure',
  );

  const autoProject = makeProjectWithDirtyStale();
  const autoResult = runCommand(
    join(autoProject, '.harness', 'scripts', 'setup', 'update.sh'),
    ['--apply-harness', '--auto', '--source-repo', source, '--source-ref', 'v2'],
    { cwd: autoProject },
  );
  assert.equal(
    autoResult.status,
    0,
    '--auto must keep going after stale dirty warning',
  );
});

test('tool-permission-guard does not misclassify apps/frontier as apps/front', () => {
  const guardSource = readFileSync(
    join(root, '.harness', 'hooks', 'tool-permission-guard.mjs'),
    'utf8',
  );
  assert.doesNotMatch(
    guardSource,
    /resolvedCwd\.includes\(\s*`\${rootDir}\/apps\/front/,
    'substring includes() check must be removed',
  );
  assert.doesNotMatch(
    guardSource,
    /resolvedCwd\.includes\(\s*`\${rootDir}\/apps\/back/,
    'substring includes() check must be removed',
  );
  assert.match(
    guardSource,
    /posixRel === "apps\/front"\s*\|\|\s*posixRel\.startsWith\("apps\/front\/"\)/,
    'segment-boundary check must be present for apps/front',
  );
  assert.match(
    guardSource,
    /posixRel === "apps\/back"\s*\|\|\s*posixRel\.startsWith\("apps\/back\/"\)/,
    'segment-boundary check must be present for apps/back',
  );
});

test('tool-permission-guard does not classify apps/front-old as apps/front via command path', () => {
  const guardSource = readFileSync(
    join(root, '.harness', 'hooks', 'tool-permission-guard.mjs'),
    'utf8',
  );
  assert.doesNotMatch(
    guardSource,
    /pattern:\s*\/\\bapps\\\/front\\b\//,
    'plain \\b boundary must be replaced',
  );
  assert.match(guardSource, /SEGMENT_TERMINATOR\s*=/);
  assert.match(
    guardSource,
    /apps\\\\\/front\(\?:\\\\\/\|\(\?=\${SEGMENT_TERMINATOR}\)\)/,
    'apps/front pattern must use the segment-terminator constant',
  );
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

test('update.sh fails nonzero when prune-stale.mjs cannot run in manual mode', () => {
  const source = mkdtempSync(join(tmpdir(), 'codi-harness-prune-fail-src-'));
  initGitRepo(source);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(source, '.harness', 'scripts', _d), { recursive: true });
  }
  for (const f of ['update.sh', 'generate-manifest.mjs', 'prune-stale.mjs', 'project-owned.mjs', 'skills-link.sh']) {
    cpSync(
      join(root, '.harness', 'scripts', 'setup', f),
      join(source, '.harness', 'scripts', 'setup', f),
    );
  }
  commitAll(source, 'initial');
  const r1 = runNode(
    '.harness/scripts/setup/generate-manifest.mjs',
    [],
    { cwd: source },
  );
  assert.equal(r1.status, 0, r1.stderr);
  runCommand('git', ['add', '.harness/shared-manifest.json'], { cwd: source });
  runCommand('git', ['commit', '-q', '-m', 'manifest'], { cwd: source });
  assert.equal(runCommand('git', ['branch', 'v2'], { cwd: source }).status, 0);

  function makeProjectWithBrokenPrune() {
    const project = mkdtempSync(join(tmpdir(), 'codi-harness-prune-fail-proj-'));
    initGitRepo(project);
    for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
      mkdirSync(join(project, '.harness', 'scripts', _d), { recursive: true });
    }
    for (const f of ['update.sh', 'project-owned.mjs', 'skills-link.sh']) {
      cpSync(
        join(root, '.harness', 'scripts', 'setup', f),
        join(project, '.harness', 'scripts', 'setup', f),
      );
    }
    writeFileSync(
      join(project, '.harness', 'scripts', 'setup', 'prune-stale.mjs'),
      'this is not valid javascript ;;;',
    );
    commitAll(project, 'project');
    return project;
  }

  const manualProject = makeProjectWithBrokenPrune();
  const manualResult = runCommand(
    join(manualProject, '.harness', 'scripts', 'setup', 'update.sh'),
    ['--apply-harness', '--source-repo', source, '--source-ref', 'v2'],
    { cwd: manualProject },
  );
  assert.notEqual(
    manualResult.status,
    0,
    'manual mode must exit nonzero when prune-stale fails',
  );
  assert.match(manualResult.stderr, /prune-stale\.mjs 실행에 실패/);

  const autoProject = makeProjectWithBrokenPrune();
  const autoResult = runCommand(
    join(autoProject, '.harness', 'scripts', 'setup', 'update.sh'),
    ['--apply-harness', '--auto', '--source-repo', source, '--source-ref', 'v2'],
    { cwd: autoProject },
  );
  assert.equal(
    autoResult.status,
    0,
    '--auto must keep going after prune-stale failure',
  );
  assert.match(autoResult.stderr, /prune-stale\.mjs 실행 실패/);
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
    const project = mkdtempSync(join(tmpdir(), 'codi-harness-clone-'));
    spawnSync('git', ['init', '-q'], { cwd: project });
    spawnSync('git', ['config', 'user.email', 't@t'], { cwd: project });
    spawnSync('git', ['config', 'user.name', 't'], { cwd: project });
    setup(project);
    const script = `set -eu
PROJECT_ROOT="$1"
${body
  .match(/^origin_matches_harness\(\)[\s\S]*?^}/m)[0]}
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
        ['remote', 'add', 'harness', 'https://github.com/foo/codi-harness-evil.git'],
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
        ['remote', 'add', 'origin', 'https://github.com/foo/codi-harness-evil.git'],
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
        ['remote', 'add', 'origin', 'https://github.com/CODIWORKS-Engineer/codi-harness.git'],
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

test('guardrails reject http:// canonical origin (https-only)', () => {
  const project = mkdtempSync(join(tmpdir(), 'codi-harness-http-'));
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'codi-harness-v2' }),
  );
  assert.equal(spawnSync('git', ['init', '-q'], { cwd: project }).status, 0);
  assert.equal(
    spawnSync(
      'git',
      ['remote', 'add', 'origin', 'http://github.com/CODIWORKS-Engineer/codi-harness-v2.git'],
      { cwd: project },
    ).status,
    0,
  );
  const input = JSON.stringify({
    cwd: project,
    tool_name: 'Write',
    tool_input: {
      file_path: join(project, '.harness', 'skills', 'foo', 'SKILL.md'),
    },
  });
  const r = spawnSync(
    process.execPath,
    [join(root, '.harness', 'hooks', 'guardrails.mjs')],
    { input, encoding: 'utf8' },
  );
  assert.equal(r.status, 0, r.stderr);
  const decision = JSON.parse(r.stdout || '{}');
  assert.equal(decision.decision, 'block', 'http:// must not pass as canonical');
});

test('tool-permission-guard segment terminator catches redirect-adjacent paths', () => {
  const guardSource = readFileSync(
    join(root, '.harness', 'hooks', 'tool-permission-guard.mjs'),
    'utf8',
  );
  const SEGMENT_TERMINATOR = "[\\s\"';|&<>]|$";
  const pattern = new RegExp(
    `--prefix\\s+(?:\\.\\/)?apps\\/front(?:\\/|(?=${SEGMENT_TERMINATOR}))`,
  );
  for (const command of [
    'npm --prefix apps/front>>log install',
    'pnpm --prefix apps/front<input install',
    'npm --prefix apps/front> log install',
    'npm --prefix apps/front install',
    'npm --prefix apps/front/src install',
  ]) {
    assert.ok(
      pattern.test(command),
      `terminator must match apps/front in: ${command}`,
    );
  }
  for (const command of [
    'npm --prefix apps/front-old install',
    'npm --prefix apps/frontier install',
  ]) {
    assert.ok(
      !pattern.test(command),
      `terminator must NOT match neighbor segment in: ${command}`,
    );
  }
  assert.match(guardSource, /SEGMENT_TERMINATOR\s*=/);
});
