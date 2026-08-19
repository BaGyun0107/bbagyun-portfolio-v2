import { tmp } from './helpers/fixture-base.mjs';
import { runCommand, runNode } from './helpers/cli-fixture.mjs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// runNode/runCommand 는 helpers/cli-fixture.mjs 공용 실행기를 쓴다
// (specs/016 M-17 격리 + specs/017 M-15 분할).

function makeProject() {
  const dir = tmp('codi-harness-test-');
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

// upstream(harness clone)을 흉내내는 source 픽스처용. generate-manifest 의
// isHarnessRepo 가드는 canonical origin 또는 v1/v2 브랜치가 있을 때만 manifest
// 를 쓴다. source 픽스처들은 manifest 생성 시점에 아직 v2 브랜치가 없으므로
// canonical origin 을 달아 harness clone 으로 식별되게 한다.
function markHarnessClone(dir) {
  assert.equal(
    runCommand(
      'git',
      [
        'remote',
        'add',
        'origin',
        'git@github.com:CODIWORKS-Engineer/codi-harness-v2.git',
      ],
      { cwd: dir },
    ).status,
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
  // wire-infisical 은 계약상 "레포 운영" 그룹이라 기본 도움말에서 빠진다
  // (specs/014 FR-004). 노출 검증은 --all 로 옮긴다 — 테스트 의도(도움말에
  // 문서화 + 디스패치 동작)는 그대로다.
  const help = runCommand('./harness', ['help', '--all']);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /wire-infisical/);

  const dryRun = runCommand('./harness', ['wire-infisical']);
  assert.notEqual(dryRun.status, 0);
  assert.match(
    dryRun.stderr + dryRun.stdout,
    /project-name|INFISICAL_PROJECT_ID/,
  );
});

test('external phase routing replaces local wrapper skills and spec artifacts', () => {
  // 제거 대상은 "옛 로컬 planning wrapper" 잔재다. `specs/` 디렉터리는 한때 이 로컬
  // tooling(spec.mjs/board.mjs 등)이 만들던 산출물이라 이 목록에 있었으나, 이제 외부
  // Spec Kit(uvx specify)이 committed `specs/<NNN-feature>/`를 만드는 게 정상 흐름이다
  // (phase-routing 규칙 + 아래 install 테스트가 uvx/specify를 명시적으로 허용). 따라서
  // `specs/` 부재가 아니라 로컬 tooling **스크립트**의 부재만 검증한다.
  for (const removed of [
    '.harness/scripts/tooling/spec.mjs',
    '.harness/scripts/tooling/phase-prompt.mjs',
    '.harness/scripts/tooling/board.mjs',
    '.harness/hooks/board-refresh.mjs',
    '.harness/templates/phase-handoff.md',
    '.harness/skills/superpowers',
  ]) {
    assert.equal(
      existsSync(join(root, removed)),
      false,
      `${removed} must be removed`,
    );
  }

  // Spec Kit 도입 확인: 외부 도구 인프라가 자리 잡았어야 한다.
  assert.equal(
    existsSync(join(root, '.specify')),
    true,
    '.specify (Spec Kit infra) must exist — 로컬 wrapper를 외부 Spec Kit이 대체',
  );

  for (const skillPath of ['.harness/skills/codi-phase-routing/SKILL.md']) {
    assert.equal(
      existsSync(join(root, skillPath)),
      true,
      `${skillPath} must exist`,
    );
  }

  for (const activeSkill of ['codi-phase-routing', 'karpathy-style']) {
    const skillBody = readFileSync(
      join(root, '.harness', 'skills', activeSkill, 'SKILL.md'),
      'utf8',
    );
    assert.doesNotMatch(skillBody, /specs\/<feature>/);
    assert.doesNotMatch(skillBody, /01-brainstorming\.md/);
    assert.doesNotMatch(skillBody, /harness phase-prompt/);
  }
});

test('install script no longer installs a planning-engine runtime', () => {
  const install = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'install.sh'),
    'utf8',
  );

  assert.doesNotMatch(
    install,
    /get-shit-done/,
    'the retired planning-engine runtime must not be installed or uninstalled by install.sh',
  );
  // 주석과 출력 전용 안내 heredoc(cat <<'NAME' ... NAME)의 uvx 언급은
  // 허용하고, 실제 실행 위치(비주석 라인)의 uvx 만 금지한다. .specify/
  // 존재 감지나 안내 echo 는 설치 실행이 아니므로 대상이 아니다.
  const withoutGuideHeredocs = install.replace(/<<'(\w+)'[\s\S]*?\n\1\n/g, '');
  assert.doesNotMatch(
    withoutGuideHeredocs,
    /(?:^|\n)[^#\n]*\buvx\b/,
    'Spec Kit is installed per-project by the user via uvx; install.sh must not auto-install it',
  );
  assert.match(
    install,
    /SPECKIT_INSTRUCTIONS/,
    'the Spec Kit install instructions must remain',
  );
  assert.match(
    install,
    /npm ci/,
    'install.sh must install root npm dependencies (husky prepare activates pre-commit hooks)',
  );
  assert.match(
    install,
    /mise trust/,
    'install.sh must trust the repo path before mise install (fresh clone/init path)',
  );
  assert.match(
    install,
    /mcp-registration-check\.mjs/,
    'the Playwright MCP registration step must remain',
  );
  assert.match(
    install,
    /SUPERPOWERS_INSTRUCTIONS/,
    'the Superpowers marketplace instructions must remain',
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
  assert.match(
    productionDatabaseMcp.stdout,
    /production database\/data access/,
  );

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
    runCommand('git', ['checkout', '-q', '-b', 'main'], { cwd: project })
      .status,
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
      tool_input: {
        command:
          'bash .harness/scripts/deploy/server-deploy.sh /srv/app app.tar.gz app production pm2',
      },
    }),
  });
  assert.equal(productionDeploy.status, 0);
  assert.match(productionDeploy.stdout, /production/i);
});

test('skill injector surfaces codi-phase-routing on scope-signal prompts but not on small edits', () => {
  // 정탐: 범위/규모 신호(한국어) → phase-routing 추천 발화
  const scopedKo = runNode('.harness/hooks/skill-injector.mjs', [], {
    input: JSON.stringify({
      prompt: '전체 회원가입 기능 처음부터 붙여줘',
      cwd: root,
    }),
  });
  assert.equal(scopedKo.status, 0);
  assert.match(scopedKo.stdout, /codi-phase-routing/);

  // 정탐: 범위/규모 신호(영어) → phase-routing 추천 발화
  const scopedEn = runNode('.harness/hooks/skill-injector.mjs', [], {
    input: JSON.stringify({
      prompt: 'refactor the auth flow across multiple modules',
      cwd: root,
    }),
  });
  assert.equal(scopedEn.status, 0);
  assert.match(scopedEn.stdout, /codi-phase-routing/);

  // 오탐 억제: 작은 편집 → phase-routing 미발화 (Small 직행 보존)
  const smallEdit = runNode('.harness/hooks/skill-injector.mjs', [], {
    input: JSON.stringify({
      prompt: '이 오타 수정해줘',
      cwd: root,
    }),
  });
  assert.equal(smallEdit.status, 0);
  assert.doesNotMatch(smallEdit.stdout, /codi-phase-routing/);

  // 회귀 불변: 과제형(라우팅 키워드 없음)은 구현 스킬이 여전히 떠야 한다
  const implTask = runNode('.harness/hooks/skill-injector.mjs', [], {
    input: JSON.stringify({
      prompt: 'NestJS 배치 서버 만들어줘',
      cwd: root,
    }),
  });
  assert.equal(implTask.status, 0);
  assert.match(implTask.stdout, /codi-backend|nestjs-expert/);
});

test('codex replay check catches split app orchestration regressions', () => {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.match(
    packageJson.scripts['codex:replay-check'],
    /^node --test --test-name-pattern "codex replay check" tests\/\*\.test\.mjs$/,
  );

  const empty = runNode('.harness/scripts/checks/codex-replay-check.mjs', ['-'], {
    input: '',
  });
  assert.equal(empty.status, 1);
  assert.match(empty.stdout, /Transcript is empty/);

  const badTranscript = [
    'Size: Large, because this creates a split frontend/backend app.',
    'There is no existing specs/ state and the apps/ directories are only policy shells.',
    'The harness command named progress is not present here, so I will inspect specs/ directly.',
    'I am using codi-backend, nestjs-expert, codi-frontend, and codi-dev-workflow.',
    'I am going to scaffold the smallest split Next/Nest implementation now.',
  ].join('\n');

  const failed = runNode('.harness/scripts/checks/codex-replay-check.mjs', ['-'], {
    input: badTranscript,
  });
  assert.equal(failed.status, 1);
  assert.match(failed.stdout, /repo-local \.\/harness progress/);
  assert.match(failed.stdout, /project-profile\.yaml/);
  assert.match(failed.stdout, /without a `Subagent decision:` block/);

  const largeWithoutSpec = [
    'Size: Large, because this is a split frontend/backend app scaffold with framework-specific setup and runtime verification.',
    'There is no specs/ state to resume.',
    'Using karpathy-style, codi-frontend, codi-backend, nestjs-expert, codi-dev-workflow, and Superpowers execution skills.',
    'I will keep concrete scope, alternatives, and verification, while not creating unnecessary durable files for a small mock-data scaffold.',
    'Subagent decision:',
    '- workstreams: frontend, backend',
    '- authorization: user explicitly requested subagents',
    '- selected action: spawn',
    '- context boundary: frontend owns apps/front, backend owns apps/back',
    'I will scaffold the backend and frontend files.',
  ].join('\n');

  const largeWithoutSpecFailed = runNode('.harness/scripts/checks/codex-replay-check.mjs', ['-'], {
    input: largeWithoutSpec,
  });
  assert.equal(largeWithoutSpecFailed.status, 1);
  assert.match(largeWithoutSpecFailed.stdout, /without evidence that `codi-phase-routing` was loaded/);
  assert.match(largeWithoutSpecFailed.stdout, /without Spec Kit flow use/);
  assert.match(largeWithoutSpecFailed.stdout, /downshifted a declared Large/);

  const specStateWithoutResume = [
    'Size: Large, because this is a split frontend/backend app scaffold with framework setup and verification across two runtimes.',
    'I read scenario-phase-routing.md and agent-routing.md.',
    'specs/002-pension-dashboard/tasks.md에 unchecked 항목이 있어서 먼저 진행 상태를 확인하고 기존 앱 구조와 스택 규칙에 맞춰 작업 범위를 잡겠습니다.',
    'Subagent decision:',
    '- workstreams: frontend scaffold/UI, backend Nest API, workflow/verification',
    '- authorization: 아직 명시 승인 없음',
    '- selected action: ask',
    '- context boundary: subagent를 허용하면 각 workstream을 나눠 진행하고, 아니면 inline으로 진행하겠습니다.',
  ].join('\n');

  const specStateWithoutResumeFailed = runNode('.harness/scripts/checks/codex-replay-check.mjs', ['-'], {
    input: specStateWithoutResume,
  });
  assert.equal(specStateWithoutResumeFailed.status, 1);
  assert.match(specStateWithoutResumeFailed.stdout, /Existing specs\/ state was acknowledged/);
  assert.match(specStateWithoutResumeFailed.stdout, /project profile allowed/);

  const splitWorkWithoutProfile = [
    'Size: Large, because this is a split frontend/backend app scaffold.',
    'I loaded codi-phase-routing and am applying the Codex Medium+ Checklist.',
    'I am resuming the unchecked tasks.md items in specs/002-pension-dashboard before the subagent gate.',
    'Subagent decision:',
    '- workstreams: frontend, backend',
    '- authorization: user explicitly requested subagents',
    '- selected action: spawn',
    '- context boundary: frontend owns apps/front, backend owns apps/back',
    'I will scaffold the backend and frontend files.',
  ].join('\n');

  const splitWorkWithoutProfileFailed = runNode('.harness/scripts/checks/codex-replay-check.mjs', ['-'], {
    input: splitWorkWithoutProfile,
  });
  assert.equal(splitWorkWithoutProfileFailed.status, 1);
  assert.match(splitWorkWithoutProfileFailed.stdout, /project-profile\.yaml/);
  assert.match(splitWorkWithoutProfileFailed.stdout, /project profile allowed/);

  const subagentAskWithoutRoutingGate = [
    'Size: Large, because this is split frontend/backend app scaffolding with framework choices, package setup, and verification across two runtimes.',
    'I read .harness/config/project-profile.yaml; mode: split-front-back allows apps/front and apps/back.',
    'I read .harness/policies/agent-routing.md and .harness/policies/scenario-phase-routing.md.',
    'Using superpowers:using-superpowers for skill discipline and karpathy-style for the repo response shape.',
    'Subagent decision:',
    '- Workstreams: Frontend, Backend, Workflow, Review/QA',
    '- Authorization source: no explicit user authorization for subagents has been given yet.',
    '- Selected action: ask.',
    '- Context boundary: Frontend uses codi-frontend; Backend uses codi-backend plus nestjs-expert.',
    '커밋은 하지 않겠습니다. 승인을 받기 전에는 구현 파일 생성, 의존성 설치, 스캐폴딩을 진행하지 않습니다.',
  ].join('\n');

  const subagentAskWithoutRoutingGateFailed = runNode('.harness/scripts/checks/codex-replay-check.mjs', ['-'], {
    input: subagentAskWithoutRoutingGate,
  });
  assert.equal(subagentAskWithoutRoutingGateFailed.status, 1);
  assert.match(subagentAskWithoutRoutingGateFailed.stdout, /subagent routing was decided without evidence that `codi-phase-routing`/);
  assert.match(subagentAskWithoutRoutingGateFailed.stdout, /before invoking `speckit-specify` or resuming unchecked/);

  const specSkimWithoutResume = [
    'Size: Large, because this is split Next.js + NestJS app work across apps/front and apps/back.',
    'specs/002-pension-dashboard exists with spec.md, plan.md, and tasks.md.',
    'Ran ls specs/002-pension-dashboard.',
    'Ran cat specs/002-pension-dashboard/spec.md.',
    'I skimmed the spec files just enough to see whether there is an active feature.',
    'Subagent decision:',
    '- Workstreams: Frontend stream, Backend stream, Workflow stream, Review/verification stream',
    '- Authorization source: No explicit subagent authorization has been given yet.',
    '- Selected action: ask',
    '- Context boundaries: Frontend uses apps/front/** and Backend uses apps/back/**.',
  ].join('\n');

  const specSkimWithoutResumeFailed = runNode('.harness/scripts/checks/codex-replay-check.mjs', ['-'], {
    input: specSkimWithoutResume,
  });
  assert.equal(specSkimWithoutResumeFailed.status, 1);
  assert.match(specSkimWithoutResumeFailed.stdout, /Spec files were skimmed/);
  assert.match(specSkimWithoutResumeFailed.stdout, /Existing specs\/ state was acknowledged/);

  const proseSubagentAskWithoutBlock = [
    'Size: Large, because this is a split frontend/backend app scaffold with verification across two runtimes.',
    'I loaded codi-phase-routing and am applying the Codex Medium+ Checklist.',
    'speckit-specify is the next step because no feature spec covers this dashboard yet.',
    'Subagent tooling exists, but its own policy only permits spawning when the user explicitly asks for subagents or parallel agent work.',
    '진행 전에 한 번만 승인 필요합니다. 레포 정책상 split frontend/backend 구현은 subagent 결정을 명시해야 하고, 현재 subagent 도구는 사용자가 명시적으로 승인해야만 쓸 수 있습니다.',
    'A. Subagent 승인 후 진행',
    'B. Subagent 없이 inline fallback 승인',
    '구현 설계는 이렇게 잡겠습니다.',
  ].join('\n');

  const proseSubagentAskWithoutBlockFailed = runNode('.harness/scripts/checks/codex-replay-check.mjs', ['-'], {
    input: proseSubagentAskWithoutBlock,
  });
  assert.equal(proseSubagentAskWithoutBlockFailed.status, 1);
  assert.match(proseSubagentAskWithoutBlockFailed.stdout, /without a `Subagent decision:` block/);

  const manualSpec = [
    'Size: Large, because this creates a split frontend/backend app.',
    'There is no existing specs/ directory, so I will create the durable spec files myself.',
    'Ran mkdir -p specs/001-pension-dashboard',
    'I will write specs/001-pension-dashboard/plan.md and then scaffold the app.',
    'Subagent decision:',
    '- workstreams: frontend, backend',
    '- authorization: user did not explicitly request subagents',
    '- selected action: ask',
    '- context boundary: frontend owns apps/front, backend owns apps/back',
    'Now I will scaffold the backend and frontend files.',
  ].join('\n');

  const manualSpecFailed = runNode('.harness/scripts/checks/codex-replay-check.mjs', ['-'], {
    input: manualSpec,
  });
  assert.equal(manualSpecFailed.status, 1);
  assert.match(manualSpecFailed.stdout, /manually created specs\//);
  assert.match(manualSpecFailed.stdout, /must stop before implementation/);

  const legacyPlanningCreation = [
    'Size: Large, because this creates a split frontend/backend app.',
    'Ran mkdir -p .planning/phases/001-dashboard',
    'I will write .planning/phases/001-dashboard/PLAN.md before scaffolding.',
  ].join('\n');

  const legacyPlanningCreationFailed = runNode('.harness/scripts/checks/codex-replay-check.mjs', ['-'], {
    input: legacyPlanningCreation,
  });
  assert.equal(legacyPlanningCreationFailed.status, 1);
  assert.match(legacyPlanningCreationFailed.stdout, /scheduled for removal/);

  const incompleteDecision = [
    'Size: Large, because this creates a split frontend/backend app.',
    'I will run speckit-plan before implementation.',
    'Subagent decision:',
    '- selected action: ask',
  ].join('\n');

  const incompleteDecisionFailed = runNode('.harness/scripts/checks/codex-replay-check.mjs', ['-'], {
    input: incompleteDecision,
  });
  assert.equal(incompleteDecisionFailed.status, 1);
  assert.match(incompleteDecisionFailed.stdout, /must include `workstreams:`/);
  assert.match(incompleteDecisionFailed.stdout, /must include `authorization:`/);
  assert.match(incompleteDecisionFailed.stdout, /must include `context boundary:`/);

  const askThenImplement = [
    'Size: Large, because this creates a split frontend/backend app.',
    'I will run speckit-tasks with test tasks (TDD) before implementation.',
    'Subagent decision:',
    '- workstreams: frontend, backend',
    '- authorization: user did not explicitly request subagents',
    '- selected action: ask',
    '- context boundary: frontend owns apps/front, backend owns apps/back',
    'Now I will scaffold the smallest split Next/Nest implementation.',
  ].join('\n');

  const askThenImplementFailed = runNode('.harness/scripts/checks/codex-replay-check.mjs', ['-'], {
    input: askThenImplement,
  });
  assert.equal(askThenImplementFailed.status, 1);
  assert.match(askThenImplementFailed.stdout, /must stop before implementation/);

  const noCommitViolated = [
    'User: 커밋은 하지 마.',
    'Size: Medium, because this edits policy and tests.',
    'I will not commit unless asked.',
    'Ran git commit -m "fix: update policy"',
  ].join('\n');

  const noCommitViolatedFailed = runNode('.harness/scripts/checks/codex-replay-check.mjs', ['-'], {
    input: noCommitViolated,
  });
  assert.equal(noCommitViolatedFailed.status, 1);
  assert.match(noCommitViolatedFailed.stdout, /despite an explicit no-commit instruction/);

  const actualReplayRegression = [
    'Size: Large, because this is a split frontend/backend app scaffold with framework-specific setup and runtime verification.',
    'I loaded codi-phase-routing and am applying the Codex Medium+ Checklist.',
    'specs/ has no unchecked tasks.md items for this dashboard, so I will run speckit-specify for the new feature.',
    '이제 구현 방식을 고정합니다. 백엔드는 Nest 서비스가 mock 데이터를 반환하며 프론트는 Next 서버 컴포넌트에서 해당 API를 읽습니다.',
    '파일 편집을 시작합니다. 먼저 테스트와 타입 계약을 만들고, 그 다음 최소 구현을 추가하는 순서로 진행하겠습니다.',
    'apps/back package.json and Nest files added.',
    'apps/front package.json and Next files added.',
    'specs/ 디렉터리에는 이번 구현과 검증 차단 사유를 기록해 다음 세션에서 바로 이어갈 수 있게 하겠습니다.',
  ].join('\n');

  const actualReplayRegressionFailed = runNode('.harness/scripts/checks/codex-replay-check.mjs', ['-'], {
    input: actualReplayRegression,
  });
  assert.equal(actualReplayRegressionFailed.status, 1);
  assert.match(actualReplayRegressionFailed.stdout, /without a `Subagent decision:` block/);
  assert.match(actualReplayRegressionFailed.stdout, /updated only after implementation/);

  const goodTranscript = [
    'Size: Large, because this creates a split frontend/backend app.',
    'I read .harness/config/project-profile.yaml; mode: split-front-back allows apps/front and apps/back.',
    'I loaded codi-phase-routing and am applying the Codex Medium+ Checklist.',
    'I checked specs/ for unchecked tasks.md items; none exist, so the next valid step is speckit-specify (requesting test tasks) before implementation.',
    'Subagent decision:',
    '- workstreams: frontend, backend, workflow/verification',
    '- Authorization source: user did not explicitly request subagents',
    '- selected action: ask',
    '- Context boundaries: frontend owns apps/front, backend owns apps/back, workflow owns verification commands',
  ].join('\n');

  const passed = runNode('.harness/scripts/checks/codex-replay-check.mjs', ['-'], {
    input: goodTranscript,
  });
  assert.equal(passed.status, 0, passed.stdout + passed.stderr);
  assert.match(passed.stdout, /0 failure/);
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

test('dev-role front blocks apps/back writes but allows reads and own-surface work', () => {
  const project = makeProject();
  mkdirSync(join(project, '.harness', 'state'), { recursive: true });
  writeFileSync(join(project, '.harness', 'state', 'dev-role'), 'front\n');

  const run = (toolInput) =>
    runNode('.harness/hooks/project-profile-guard.mjs', [], {
      cwd: project,
      input: JSON.stringify({ cwd: project, tool_input: toolInput }),
    });

  // Write 도구: 상대 영역 파일 경로는 차단
  const blockedWrite = run({ file_path: 'apps/back/src/server.ts', content: 'x' });
  assert.match(blockedWrite.stdout, /"decision":"block"/);
  assert.match(blockedWrite.stdout, /write-protected/);

  // Write 도구: 자기 영역은 content가 apps/back을 "언급"해도 통과
  const ownWrite = run({ file_path: 'apps/front/src/api.ts', content: 'reads apps/back schema' });
  assert.equal(ownWrite.stdout, '');

  // Bash 읽기(cat/grep)는 상대 영역이어도 통과 — 계약-우선 정책의 전제
  const bashRead = run({ command: 'cat apps/back/src/entity/user.ts' });
  assert.equal(bashRead.stdout, '');

  // Bash 쓰기 형태는 차단: cp / 리다이렉트
  const bashCp = run({ command: 'cp tmp.ts apps/back/src/tmp.ts' });
  assert.match(bashCp.stdout, /"decision":"block"/);
  const bashRedirect = run({ command: 'echo hi > apps/back/note.md' });
  assert.match(bashRedirect.stdout, /"decision":"block"/);
  // 구분자 뒤의 쓰기 명령도 차단 (&& 케이스)
  const bashChain = run({ command: 'cd apps/back && rm -rf dist' });
  assert.match(bashChain.stdout, /"decision":"block"/);
});

test('dev-role back/fullstack/missing semantics and role CLI lifecycle', () => {
  const project = makeProject();
  mkdirSync(join(project, '.harness', 'state'), { recursive: true });

  const run = (toolInput) =>
    runNode('.harness/hooks/project-profile-guard.mjs', [], {
      cwd: project,
      input: JSON.stringify({ cwd: project, tool_input: toolInput }),
    });

  // back: apps/front 쓰기 차단, apps/back 허용
  writeFileSync(join(project, '.harness', 'state', 'dev-role'), 'back\n');
  assert.match(run({ file_path: 'apps/front/src/page.tsx' }).stdout, /"decision":"block"/);
  assert.equal(run({ file_path: 'apps/back/src/server.ts' }).stdout, '');

  // fullstack: 양쪽 모두 허용
  writeFileSync(join(project, '.harness', 'state', 'dev-role'), 'fullstack\n');
  assert.equal(run({ file_path: 'apps/front/src/page.tsx' }).stdout, '');
  assert.equal(run({ file_path: 'apps/back/src/server.ts' }).stdout, '');

  // 마커 없음: 차단 없이 1회성 안내, 두 번째부터는 침묵
  rmSync(join(project, '.harness', 'state', 'dev-role'));
  const hinted = run({ file_path: 'apps/back/src/server.ts' });
  assert.doesNotMatch(hinted.stdout, /"decision":"block"/);
  assert.match(hinted.stdout, /harness role front\|back\|fullstack/);
  const silent = run({ file_path: 'apps/back/src/server.ts' });
  assert.equal(silent.stdout, '');

  // role CLI: set / show / clear
  const setFront = runNode('.harness/scripts/tooling/role.mjs', ['front'], { cwd: project });
  assert.equal(setFront.status, 0, setFront.stderr);
  assert.equal(
    readFileSync(join(project, '.harness', 'state', 'dev-role'), 'utf8').trim(),
    'front',
  );
  const shown = runNode('.harness/scripts/tooling/role.mjs', ['show'], { cwd: project });
  assert.match(shown.stdout, /front/);
  const cleared = runNode('.harness/scripts/tooling/role.mjs', ['clear'], { cwd: project });
  assert.equal(cleared.status, 0);
  assert.equal(existsSync(join(project, '.harness', 'state', 'dev-role')), false);
  const invalid = runNode('.harness/scripts/tooling/role.mjs', ['sideways'], { cwd: project });
  assert.equal(invalid.status, 1);
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
  assert.match(listed.stdout, /planning-only/);

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

  const setPlanningOnly = runNode(
    '.harness/scripts/tooling/profile.mjs',
    ['set', 'planning-only'],
    { cwd: project },
  );
  assert.equal(setPlanningOnly.status, 0, setPlanningOnly.stderr);
  const planningOnlyProfile = readFileSync(
    join(project, '.harness', 'config', 'project-profile.yaml'),
    'utf8',
  );
  assert.match(planningOnlyProfile, /mode: planning-only/);
  assert.match(planningOnlyProfile, /apps\/front\/\*\*/);
  assert.match(planningOnlyProfile, /apps\/back\/\*\*/);
  const planningOnlyCheck = runNode(
    '.harness/scripts/tooling/profile.mjs',
    ['check'],
    { cwd: project },
  );
  assert.equal(planningOnlyCheck.status, 0, planningOnlyCheck.stderr);

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
  assert.match(initProject, /5\|planning-only/);

  const manifest = JSON.parse(
    readFileSync(join(root, '.harness', 'manifest.json'), 'utf8'),
  );
  assert.deepEqual(manifest.project_profile.supported_modes, [
    'split-front-back',
    'next-fullstack',
    'frontend-only',
    'backend-only',
    'planning-only',
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

  const profilePath = join(
    project,
    '.harness',
    'config',
    'project-profile.yaml',
  );
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
  // role 미설정 1회 힌트를 시드로 잠재워 프로필 의미론만 검증한다.
  mkdirSync(join(project, '.harness', 'state'), { recursive: true });
  writeFileSync(join(project, '.harness', 'state', 'dev-role-hint-shown'), 'seeded\n');
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
  // role 미설정 1회 힌트를 시드로 잠재워 프로필 의미론만 검증한다.
  mkdirSync(join(project, '.harness', 'state'), { recursive: true });
  writeFileSync(join(project, '.harness', 'state', 'dev-role-hint-shown'), 'seeded\n');
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
  assert.match(
    workflow,
    /vercel build \$\{\{ steps\.env\.outputs\.target_flag \}\}/,
  );
  assert.match(
    workflow,
    /vercel deploy --prebuilt \$\{\{ steps\.env\.outputs\.target_flag \}\}/,
  );
  assert.match(
    workflow,
    /environment-url: \$\{\{ steps\.public-url\.outputs\.url \}\}/,
  );
  assert.doesNotMatch(workflow, /vercel alias set/);

  assert.match(docs, /custom environment `dev`/);
  assert.match(docs, /vercel deploy --prebuilt --target=dev/);
});

test('harness repository branch policy is separated from app repository PR flow', () => {
  // CLAUDE.md는 bare @AGENTS.md import로 공통 본문을 로드하므로 이 공통
  // 규칙 검증은 AGENTS.md 쪽에서 담당한다 (specs/013).
  const files = [
    'AGENTS.md',
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

test('live surfaces use hyphenated speckit skill names (specs/013)', () => {
  // 패턴을 조각으로 조립해 이 테스트 파일 자신이 스위프에 걸리지 않게 한다.
  // 역사 기록(docs/audits, 완료된 specs)과 vendored/생성 트리는 대상이 아니다.
  const dotted = new RegExp(
    ['speckit', '\\.', '(specify|clarify|plan|tasks|analyze|implement|converge|constitution|checklist|taskstoissues)'].join(''),
  );
  // 아래 명시 목록의 파일이 이동/삭제되면 readFileSync가 ENOENT로 크게
  // 실패한다(조용한 누락 방지) — 그때는 이 목록을 갱신하라.
  const surfaces = [
    'AGENTS.md',
    'CLAUDE.md',
    'README.md',
    'ARCHITECTURE.md',
    'CONTRIBUTING.md',
    'docs/harness-overview.md',
    '.harness/workflow.md',
    '.harness/hooks/guardrails.mjs',
    '.harness/scripts/checks/context-check.mjs',
    '.harness/scripts/checks/codex-replay-check.mjs',
    'tests/harness-cli.test.mjs',
  ];
  for (const dir of ['.harness/policies', '.claude/rules', '.codex/rules']) {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      if (entry.isFile()) surfaces.push(`${dir}/${entry.name}`);
    }
  }
  // 스킬 트리는 재귀로 훑는다: resources/, variants/, _shared/ 같은 하위
  // 디렉터리에 dotted 표기가 재유입되는 것도 잡기 위해서다.
  const walkMd = (dir) => {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walkMd(rel);
      else if (entry.isFile() && entry.name.endsWith('.md')) surfaces.push(rel);
    }
  };
  walkMd('.harness/skills');
  const offenders = [];
  for (const file of surfaces) {
    if (dotted.test(readFileSync(join(root, file), 'utf8'))) offenders.push(file);
  }
  assert.deepEqual(
    offenders,
    [],
    'live surfaces must use hyphenated speckit-* skill names',
  );
});

test('root agent entrypoints delegate project-specific rules to project profile and app-local docs', () => {
  // CLAUDE.md는 bare @AGENTS.md import로 공통 본문을 로드하므로 이 공통
  // 규칙 검증은 AGENTS.md 쪽에서 담당한다 (specs/013).
  const files = [
    'AGENTS.md',
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
  const doctor = readFileSync(
    join(root, '.harness/scripts/checks/doctor.sh'),
    'utf8',
  );
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
  const pipeline = readFileSync(
    join(root, '.github/workflows/pipeline.yml'),
    'utf8',
  );
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
    'harness-ci.yml',
    'pipeline.yml',
    'release.yml',
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

test('project-owned: 셸 fallback 은 공용 파일 하나이고 mjs 테이블과 정확 일치한다 (L-1)', async () => {
  // 과거에는 동일 case 가 update.sh/update-check.sh 두 곳에 복제돼 있었고,
  // 테스트는 사본 간 동일성만 봤다 — 정본(mjs)과의 대조가 없어 드리프트를
  // 못 잡았다. 이제 fallback 은 한 파일이고, 여기서 mjs 테이블과 case 패턴
  // 집합을 양방향 기계 대조한다.
  for (const script of ['update.sh', 'update-check.sh']) {
    const body = readFileSync(join(root, '.harness', 'scripts', 'setup', script), 'utf8');
    assert.match(
      body,
      /project-owned-fallback\.sh/,
      `${script} must source the shared fallback`,
    );
    assert.doesNotMatch(
      body,
      /\|data\/\*[|)]/,
      `${script} must not carry its own copy of the fallback case`,
    );
  }
  const fallback = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
    'utf8',
  );
  const caseTokens = [...fallback.matchAll(/^\s{4}([^*\s)][^)]*)\)$/gm)]
    .flatMap((m) => m[1].split('|'))
    .filter((t) => t && t !== '*');
  const { PROJECT_OWNED_DIRS, PROJECT_OWNED_FILES } = await import(
    '../.harness/scripts/setup/project-owned.mjs'
  );
  const expected = [
    ...PROJECT_OWNED_DIRS.flatMap((d) => [d, `${d}/*`]),
    ...PROJECT_OWNED_FILES,
  ].sort();
  assert.deepEqual(
    [...caseTokens].sort(),
    expected,
    'fallback case 패턴과 mjs 테이블이 다르다 — 한쪽만 갱신됨',
  );
  // 행위 확인: 대표 경로가 정식 분류기에서 project-owned 다.
  const classifier = join(root, '.harness', 'scripts', 'setup', 'project-owned.mjs');
  for (const p of [
    'data/sitemap.json',
    'data/feature-definitions.json',
    'docs/audits/2026-07-07-planning-retirement.md',
    'examples/community-app/planning/sitemap.json',
    'projects/newcz-hotel-website-renewal/planning/sitemap.json',
    'registry.json',
    // 020: 프로젝트 소유 규칙 경로 — 소스와 소비 링크 트리 양쪽
    '.harness/rules-local/team-rule.md',
    '.claude/rules/local/team-rule.md',
  ]) {
    assert.equal(
      runCommand('node', [classifier, '--check', p]).status,
      0,
      `project-owned.mjs must classify ${p} as project-owned`,
    );
  }
});

test('harness update imports common harness files and preserves project-owned files', () => {
  // 토큰 단위 fallback 대조는 L-1 정확 일치 테스트로 이전됐다 — 여기서는
  // 행위(분류기 호출 + 실제 update 실행)만 검증한다.
  assert.equal(
    runCommand('node', [
      join(root, '.harness', 'scripts', 'setup', 'project-owned.mjs'),
      '--check',
      'tests/harness-cli.test.mjs',
    ]).status,
    0,
    'project-owned.mjs must classify tests/ files as project-owned',
  );
  for (const p of [
    'specs/002-feature-hub/spec.md',
    '.specify/feature.json',
    'ROADMAP.md',
  ]) {
    assert.equal(
      runCommand('node', [
        join(root, '.harness', 'scripts', 'setup', 'project-owned.mjs'),
        '--check',
        p,
      ]).status,
      0,
      `project-owned.mjs must classify ${p} as project-owned (Spec Kit output)`,
    );
  }

  const source = tmp('codi-harness-source-');
  const project = tmp('codi-harness-project-');

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
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
    join(project, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
  );
  writeFileSync(
    join(project, '.harness', 'scripts', 'tooling', 'profile.mjs'),
    'old profile\n',
  );
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
  // 다운스트림 고유 파일(비-project-owned 경로)과, 하네스가 이전에 배포했던
  // stale shared 파일을 함께 두어 제거 범위가 manifest로 제한되는지 검증한다.
  mkdirSync(join(project, 'projects', 'demo', 'planning'), { recursive: true });
  writeFileSync(
    join(project, 'projects', 'demo', 'planning', 'sitemap.json'),
    '{"version":1}\n',
  );
  // 2026-08-07 gnuboard 사고 회귀 핀: 어떤 보호 목록에도 없(었)던 루트
  // 디렉터리(다운스트림 이관 도구)는 manifest 제한만으로도 살아남아야 한다.
  mkdirSync(join(project, 'tools', 'db-migration'), { recursive: true });
  writeFileSync(
    join(project, 'tools', 'db-migration', 'step1.sql'),
    'SELECT 1;\n',
  );
  writeFileSync(join(project, '.harness', 'stale-shared.md'), 'old shared\n');
  writeFileSync(
    join(project, '.harness', 'shared-manifest.json'),
    `${JSON.stringify({ schema_version: 1, files: ['.harness/stale-shared.md'] })}\n`,
  );
  commitAll(project, 'project');

  const applied = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
    ['--source-repo', source, '--source-ref', 'v2'],
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
  assert.ok(
    existsSync(join(project, 'projects', 'demo', 'planning', 'sitemap.json')),
    'downstream-only files outside the prior shared manifest must survive update',
  );
  assert.ok(
    existsSync(join(project, 'tools', 'db-migration', 'step1.sql')),
    'downstream tools/ must survive update (2026-08-07 incident regression)',
  );
  assert.ok(
    !existsSync(join(project, '.harness', 'stale-shared.md')),
    'prior-manifest shared files deleted upstream must still be removed',
  );
  assert.match(
    applied.stdout,
    /다운스트림 고유 파일 보호\(제거 생략\): [1-9][0-9]*/,
    'downstream-only candidates must be reported as protected, not removed',
  );
});

test('lock 모드 fresh clone에서 런처가 자가 부트스트랩한다', () => {
  // clone 직후에는 공유 스크립트가 materialize 되지 않은 상태다 — 런처가
  // harness.lock만으로 패키지를 수신해 트리를 구성해야 한다 (specs/006 후속).
  const source = tmp('codi-lock-src-');
  const consumer = tmp('codi-lock-consumer-');
  const cache = tmp('codi-lock-cache-');
  try {
    initGitRepo(source);
    mkdirSync(join(source, '.harness', 'scripts'), { recursive: true });
    cpSync(join(root, '.harness', 'scripts', 'pkg'), join(source, '.harness', 'scripts', 'pkg'), { recursive: true });
    commitAll(source, 'pkg');
    assert.equal(runCommand('git', ['tag', '-a', 'v0.0.1', '-m', 'v0.0.1'], { cwd: source }).status, 0);

    cpSync(join(root, 'harness'), join(consumer, 'harness'));
    writeFileSync(
      join(consumer, 'harness.lock'),
      `${JSON.stringify({ schema_version: 1, channel: 'latest-minor', repo: source })}\n`,
    );

    const synced = runCommand('sh', [join(consumer, 'harness'), 'pkg-sync'], {
      cwd: consumer,
      env: { ...process.env, CODI_HARNESS_CACHE_DIR: cache },
    });
    assert.equal(synced.status, 0, synced.stderr);
    assert.match(synced.stdout, /lock 부트스트랩 완료: v0\.0\.1/);
    assert.ok(
      existsSync(join(consumer, '.harness', 'scripts', 'pkg', 'pkg-sync.sh')),
      'materialize 후 공유 스크립트가 current 경유로 보여야 한다',
    );

    // 재실행은 자가 부트스트랩 없이 정식 pkg-sync만 수행한다 (멱등).
    const again = runCommand('sh', [join(consumer, 'harness'), 'pkg-sync'], {
      cwd: consumer,
      env: { ...process.env, CODI_HARNESS_CACHE_DIR: cache },
    });
    assert.equal(again.status, 0, again.stderr);
    assert.doesNotMatch(again.stdout, /lock 부트스트랩 완료/);
  } finally {
    for (const dir of [source, consumer, cache]) rmSync(dir, { recursive: true, force: true });
  }
});

test('harness update --check keeps check-only mode', () => {
  const project = tmp('codi-harness-check-project-');
  mkdirSync(join(project, '.harness', 'scripts', 'setup'), { recursive: true });
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'update.sh'),
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
  );
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
    join(project, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
  );

  const checked = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
    ['--check'],
    {
      cwd: project,
    },
  );

  assert.equal(checked.status, 0, checked.stderr);
  assert.match(checked.stdout, /확인 완료/);
  assert.doesNotMatch(checked.stdout, /하네스 파일 적용 완료/);
});

test('harness update verbose mode prints file lists', () => {
  const source = tmp('codi-harness-verbose-source-');
  const project = tmp('codi-harness-verbose-project-');

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
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
    join(project, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
  );
  writeFileSync(join(project, 'apps', 'front', 'AGENTS.md'), 'project app\n');
  commitAll(project, 'project');

  const applied = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
    [
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
  const source = tmp('codi-harness-source-');
  const project = tmp('codi-harness-project-');

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
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
    join(project, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
  );
  writeFileSync(
    join(project, '.harness', 'scripts', 'tooling', 'profile.mjs'),
    'old profile\n',
  );
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
    readFileSync(
      join(project, '.harness', 'scripts', 'tooling', 'profile.mjs'),
      'utf8',
    ),
    'local dirty profile\n',
  );
});

test('harness auto apply does not delete files removed upstream', () => {
  const source = tmp('codi-harness-source-');
  const project = tmp('codi-harness-project-');

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
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
    join(project, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
  );
  writeFileSync(
    join(project, '.harness', 'scripts', 'tooling', 'profile.mjs'),
    'old profile\n',
  );
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
  // 로컬 shared-manifest가 없으면 제거 후보는 다운스트림 고유 파일 보호로
  // 건너뛴다 — auto 모드의 "삭제하지 않음" 보장은 더 강해졌다.
  assert.match(
    applied.stdout,
    /다운스트림 고유 파일 보호\(제거 생략\): [1-9][0-9]*/,
  );
  assert.equal(
    readFileSync(
      join(project, '.harness', 'scripts', 'tooling', 'profile.mjs'),
      'utf8',
    ),
    'source profile\n',
  );
  assert.equal(
    readFileSync(join(project, '.harness', 'scripts', 'obsolete.mjs'), 'utf8'),
    'keep me\n',
  );
});

test('codex and claude launchers use the shared agent preflight', () => {
  const launcher = readFileSync(join(root, 'harness'), 'utf8');

  assert.match(launcher, /agent-preflight\.sh" codex/);
  assert.match(launcher, /agent-preflight\.sh" claude/);
});

test('agent preflight는 rules-local 규칙 목록을 안내한다 (020)', () => {
  const project = tmp('codi-harness-preflight-rules-');
  mkdirSync(join(project, '.harness', 'scripts', 'agent'), { recursive: true });
  cpSync(
    join(root, '.harness', 'scripts', 'agent', 'agent-preflight.sh'),
    join(project, '.harness', 'scripts', 'agent', 'agent-preflight.sh'),
  );
  const script = join(project, '.harness', 'scripts', 'agent', 'agent-preflight.sh');
  const env = { ...process.env, HARNESS_AUTO_UPDATE: '0' };

  // 규칙 존재: 목록 1줄 출력 (뒤 단계 실패와 무관하게 안내는 먼저 나온다).
  mkdirSync(join(project, '.harness', 'rules-local'), { recursive: true });
  writeFileSync(join(project, '.harness', 'rules-local', 'team-rule.md'), '# r\n');
  const withRules = runCommand(script, ['claude'], { cwd: project, env });
  assert.match(
    withRules.stdout,
    /rules-local[^\n]*team-rule\.md/,
    'preflight must list project rules when present',
  );

  // 규칙 부재: 관련 출력이 없어야 한다.
  rmSync(join(project, '.harness', 'rules-local', 'team-rule.md'));
  const withoutRules = runCommand(script, ['claude'], { cwd: project, env });
  assert.doesNotMatch(
    withoutRules.stdout,
    /rules-local/,
    'preflight must stay silent when no project rules exist',
  );
});

test('agent preflight keeps launcher startup lightweight by default', () => {
  const preflight = readFileSync(
    join(root, '.harness', 'scripts', 'agent', 'agent-preflight.sh'),
    'utf8',
  );

  assert.match(
    preflight,
    /update-check\.sh" --background/,
    'daily update checks must not block agent startup',
  );
  assert.match(
    preflight,
    /\$\{HARNESS_AUTO_APPLY:-0\}" = "1"/,
    'automatic harness application must be opt-in for launchers',
  );
  assert.doesNotMatch(
    preflight,
    /\$\{HARNESS_AUTO_APPLY:-1\}/,
    'launchers must not apply harness updates on every start by default',
  );
  assert.match(
    preflight,
    /context-check\.mjs" >\/dev\/null/,
    'successful context checks should stay quiet during launcher startup',
  );
});

test('harness keeps single-agent launchers wired to the shared preflight', () => {
  const launcher = readFileSync(join(root, 'harness'), 'utf8');
  const help = runCommand('./harness', ['help']);

  assert.equal(help.status, 0, help.stderr);
  assert.match(launcher, /agent-preflight\.sh" codex/);
  assert.match(launcher, /agent-preflight\.sh" claude/);
  assert.doesNotMatch(launcher, /^\s*team\)/m);
  assert.doesNotMatch(help.stdout, /harness team/);
});

test('team mode is fully removed from launchers, checks, and docs', () => {
  const surfaces = [
    readFileSync(join(root, 'harness'), 'utf8'),
    readFileSync(join(root, 'README.md'), 'utf8'),
    readFileSync(join(root, 'CONTRIBUTING.md'), 'utf8'),
    readFileSync(join(root, 'ARCHITECTURE.md'), 'utf8'),
    readFileSync(join(root, '.harness', 'workflow.md'), 'utf8'),
    readFileSync(join(root, '.harness', 'scripts', 'checks', 'doctor.sh'), 'utf8'),
    readFileSync(
      join(root, '.harness', 'skills', 'codi-phase-routing', 'SKILL.md'),
      'utf8',
    ),
  ].join('\n');

  assert.doesNotMatch(surfaces, /cmux/i);
  assert.doesNotMatch(surfaces, /tmux/i);
  assert.doesNotMatch(surfaces, /\.\/harness team/);
  assert.doesNotMatch(surfaces, /team-mode-operator/);
  assert.doesNotMatch(surfaces, /CODI_TEAM_ROLE/);

  // 단일 에이전트 런처는 그대로 기본 경로다.
  assert.match(surfaces, /\.\/harness codex/);
  assert.match(surfaces, /\.\/harness claude/);
});
test('.planning removal goes through git rm, never gitignore, and context-check enforces that direction', () => {
  // .planning 은 제거 예정 legacy 다(docs/audits/2026-07-07-planning-retirement.md).
  // 제거는 git rm 경유이며, 전체 무시로 숨기면 다운스트림 삭제 절차가 깨진다.
  const gitignore = readFileSync(join(root, '.gitignore'), 'utf8');
  assert.doesNotMatch(gitignore, /^\.planning(\/(\*|\*\*))?$/m); // 전체 무시는 금지

  // context-check 가드는 ".planning 전체 무시 금지" 방향이어야 한다.
  const contextCheck = readFileSync(
    join(root, '.harness', 'scripts', 'checks', 'context-check.mjs'),
    'utf8',
  );
  assert.match(contextCheck, /must NOT ignore all of \.planning/);
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
    readFileSync(
      join(root, '.harness', 'config', 'required-gitignore.json'),
      'utf8',
    ),
  );

  assert.doesNotMatch(
    updateScript,
    /board\.html/,
    'update.sh must not special-case board.html',
  );
  assert.doesNotMatch(
    policy,
    /board\.html/,
    'update-policy.md must not document board.html',
  );
  // 공용 entries 는 링크 트리 경로뿐(specs/015 T018 + specs/020 rules 링크)
  // 이고, lock 모드 항목은 전용 키로 분리 — board.html 부재 유지.
  assert.deepEqual(requiredGitignore.entries, [
    '.claude/skills',
    '.agents/skills',
    '.claude/rules/local',
  ]);
  assert.ok(!requiredGitignore.entries.includes('board.html'));
  assert.ok(
    requiredGitignore.lockModeEntries.includes('.harness/current'),
    'lock 모드 materialize 생성물은 lockModeEntries로 관리한다',
  );
  assert.doesNotMatch(JSON.stringify(requiredGitignore), /board\.html/);
});

// ensure-gitignore 테스트용 프로젝트 fixture를 만든다. config 인자로 임의의
// required-gitignore.json 내용을 주입해 entries / managedBlocks 동작을 격리
// 검증한다(실제 config 변경에 흔들리지 않게).
function makeEnsureGitignoreProject(config) {
  const projectDir = tmp('codi-harness-gitignore-');
  mkdirSync(join(projectDir, '.harness', 'config'), { recursive: true });
  mkdirSync(join(projectDir, '.harness', 'scripts', 'setup'), {
    recursive: true,
  });
  writeFileSync(
    join(projectDir, '.harness', 'config', 'required-gitignore.json'),
    `${JSON.stringify(config, null, 2)}\n`,
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
  const run = () =>
    runCommand('node', [ensureScript], {
      cwd: projectDir,
      env: { ...process.env, ROOT_DIR: projectDir },
    });
  return { projectDir, gitignorePath, run };
}

test('ensure-gitignore appends missing required entries idempotently', () => {
  // entries 전용 fixture(managedBlocks 없음)로 append-only 의도를 격리한다.
  const { gitignorePath, run } = makeEnsureGitignoreProject({
    entries: [{ pattern: 'coverage/' }],
  });

  // 빈 .gitignore → 누락 entry append.
  writeFileSync(gitignorePath, '');
  const firstRun = run();
  assert.equal(firstRun.status, 0, firstRun.stderr);
  assert.match(firstRun.stdout, /coverage\//, 'missing entry must be appended');
  const afterFirst = readFileSync(gitignorePath, 'utf8');
  assert.match(afterFirst, /coverage\//);

  // 재실행 → 멱등(변경/출력 없음).
  const secondRun = run();
  assert.equal(secondRun.status, 0, secondRun.stderr);
  assert.equal(secondRun.stdout, '', 'second run must produce no additions');
  assert.equal(
    readFileSync(gitignorePath, 'utf8'),
    afterFirst,
    '.gitignore content must be unchanged on idempotent run',
  );

  // leading-slash 변형이 이미 있으면 중복 추가하지 않는다(기존 계약: leading
  // slash 만 정규화). `/coverage/` 는 entry `coverage/` 와 같은 패턴으로 본다.
  writeFileSync(gitignorePath, '/coverage/\n');
  const slashRun = run();
  assert.equal(slashRun.status, 0, slashRun.stderr);
  assert.equal(
    slashRun.stdout,
    '',
    'slash-normalized existing pattern must be respected',
  );
  assert.equal(readFileSync(gitignorePath, 'utf8'), '/coverage/\n');
});

test('ensure-gitignore manages the .planning shared block (create/replace/neutralize/idempotent)', () => {
  // 실제 config 의 .planning managed 블록을 그대로 쓴다(전파될 정의를 검증).
  const realConfig = JSON.parse(
    readFileSync(
      join(root, '.harness', 'config', 'required-gitignore.json'),
      'utf8',
    ),
  );
  assert.ok(
    Array.isArray(realConfig.managedBlocks) &&
      realConfig.managedBlocks.some((b) => b.id === 'planning'),
    'required-gitignore.json must define a .planning managed block',
  );
  const { gitignorePath, run } = makeEnsureGitignoreProject(realConfig);

  // 1) 빈 .gitignore → managed 블록 생성.
  writeFileSync(gitignorePath, '');
  const created = run();
  assert.equal(created.status, 0, created.stderr);
  assert.match(created.stdout, /added managed block: planning/);
  const afterCreate = readFileSync(gitignorePath, 'utf8');
  assert.match(afterCreate, /codi-harness managed \(\.planning\)/);
  assert.match(afterCreate, /removal goes through git rm, not ignore/);
  // 제거 예정(전환기) 정책: 블록이 .planning 을 무시하는 활성 라인을 넣지 않는다.
  const activeIgnoreLines = afterCreate
    .split('\n')
    .filter((l) => l.trim().startsWith('.planning'));
  assert.equal(
    activeIgnoreLines.length,
    0,
    'the managed block must not actively ignore any .planning path',
  );

  // 2) 재실행 → 멱등.
  const idem = run();
  assert.equal(idem.stdout, '', 'managed block must be idempotent');
  assert.equal(readFileSync(gitignorePath, 'utf8'), afterCreate);

  // 3) 옛 `.planning/` 전체 무시 + project 라인 → 무력화 + 블록 추가 + 보존.
  writeFileSync(gitignorePath, 'node_modules/\n.planning/\ndist/\n');
  const neutralized = run();
  assert.match(neutralized.stdout, /neutralized: \.planning\//);
  const afterNeutralize = readFileSync(gitignorePath, 'utf8');
  // 옛 전체 무시 라인은 주석 처리되어 무력화된다.
  assert.match(
    afterNeutralize,
    /^# \.planning\/\s+# codi-harness:/m,
    '.planning/ blanket ignore must be commented out',
  );
  // project 라인은 보존된다.
  assert.match(afterNeutralize, /^node_modules\/$/m);
  assert.match(afterNeutralize, /^dist\/$/m);
  // managed 블록도 추가된다.
  assert.match(afterNeutralize, /codi-harness managed \(\.planning\)/);
  // 활성(주석 아닌) `.planning/` 전체 무시 라인은 남지 않아야 한다.
  const activePlanningBlanket = afterNeutralize
    .split('\n')
    .filter((l) => l.trim() === '.planning/' || l.trim() === '.planning');
  assert.equal(
    activePlanningBlanket.length,
    0,
    'no active blanket .planning ignore may remain',
  );

  // 4) 낡은 블록 내용 → 교체.
  writeFileSync(
    gitignorePath,
    [
      '# >>> codi-harness managed (.planning) — do not edit between markers >>>',
      '.planning/OLD.md',
      '# <<< codi-harness managed (.planning) <<<',
      '',
    ].join('\n'),
  );
  const replaced = run();
  assert.match(replaced.stdout, /updated managed block: planning/);
  const afterReplace = readFileSync(gitignorePath, 'utf8');
  assert.doesNotMatch(afterReplace, /\.planning\/OLD\.md/);
  assert.match(afterReplace, /removal goes through git rm, not ignore/);

  // 5) 정규화된(블록이 이미 올바른) .gitignore 는 재실행 시 완전 no-op 이다.
  //    trailing-newline 차이로 매번 다시 쓰지 않는지까지 확인한다.
  const normalized = readFileSync(gitignorePath, 'utf8');
  const noop = run();
  assert.equal(noop.stdout, '', 'normalized managed block must be a no-op');
  assert.equal(
    readFileSync(gitignorePath, 'utf8'),
    normalized,
    'no-op run must not rewrite the file (no trailing-newline churn)',
  );
});

test('restore-missing-shared lists shared manifest files absent from the worktree', () => {
  const projectDir = tmp('codi-harness-restore-');
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
    join(
      projectDir,
      '.harness',
      'scripts',
      'setup',
      'restore-missing-shared.mjs',
    ),
  );

  // pre-commit은 있고 post-commit은 없음. project-owned 경로(.gitignore)는 manifest에
  // 들어있어도 출력에서 제외되어야 한다.
  writeFileSync(join(projectDir, '.husky', 'pre-commit'), '#!/bin/sh\n');
  const manifestPath = join(projectDir, 'manifest.json');
  writeFileSync(
    manifestPath,
    JSON.stringify({
      files: ['.husky/post-commit', '.husky/pre-commit', '.gitignore'],
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
  const source = tmp('codi-harness-self-update-src-');
  const project = tmp('codi-harness-self-update-proj-');

  initGitRepo(source);
  mkdirSync(join(source, '.harness', 'scripts', 'setup'), { recursive: true });
  mkdirSync(join(source, '.husky'), { recursive: true });
  for (const file of [
    'update.sh',
    'project-owned-fallback.sh',
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
  // shared 디렉터리 복구의 대표 사례: .harness/workflow.md 는 shared 파일이다.
  // (tests/ 는 project-owned 라 apply 가 복구하지 않으므로 여기 쓰지 않는다.)
  writeFileSync(join(source, '.harness', 'workflow.md'), 'source workflow\n');
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
          '.harness/workflow.md',
          '.husky/post-commit',
          'AGENTS.md',
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
  writeFileSync(join(project, 'AGENTS.md'), 'old agents\n');
  writeFileSync(
    join(project, '.harness', 'scripts', 'update.sh'),
    'old flat updater\n',
  );
  writeFileSync(join(project, '.harness', 'workflow.md'), 'old workflow\n');
  writeFileSync(
    join(project, '.harness', 'shared-manifest.json'),
    '{"schema_version":1,"files":[]}\n',
  );
  commitAll(project, 'project');
  rmSync(join(project, '.harness', 'scripts', 'update.sh'));

  for (const file of [
    'update.sh',
    'project-owned-fallback.sh',
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
    readFileSync(join(project, '.harness', 'workflow.md'), 'utf8'),
    'source workflow\n',
  );
});

test('board-refresh hook is no longer registered as a PostToolUse hook', () => {
  const settings = JSON.parse(
    readFileSync(join(root, '.claude', 'settings.json'), 'utf8'),
  );
  assert.doesNotMatch(
    JSON.stringify(settings.hooks.PostToolUse ?? []),
    /board-refresh/,
  );
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
  assert.match(
    policy,
    /\.husky/,
    'update-policy.md documents .husky as shared',
  );
  assert.equal(existsSync(join(root, '.husky', 'post-commit')), false);
});
function makeUpdatePair(extraSource, extraProject) {
  const source = tmp('codi-harness-source-');
  const project = tmp('codi-harness-project-');

  initGitRepo(source);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(source, '.harness', 'scripts', _d), { recursive: true });
  }
  writeFileSync(
    join(source, '.harness', 'scripts', 'tooling', 'profile.mjs'),
    'source profile\n',
  );
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
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
    join(project, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
  );
  writeFileSync(
    join(project, '.harness', 'scripts', 'tooling', 'profile.mjs'),
    'old profile\n',
  );
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
      writeFileSync(join(src, '.planning', 'STATE.md'), 'source planning\n');
    },
    (proj) => {
      mkdirSync(join(proj, '.planning'), { recursive: true });
      writeFileSync(join(proj, '.planning', 'STATE.md'), 'project planning\n');
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
    const match = text.match(/is_project_owned_path\(\)\s*\{[\s\S]*?\n\}/);
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
  const dir = tmp('codi-harness-guard-');
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

  const valid = runNode(
    '.harness/scripts/checks/package-policy-check.mjs',
    [],
    {
      cwd: project,
    },
  );
  assert.equal(valid.status, 0, valid.stderr);

  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'root', workspaces: ['apps/*'] }),
  );
  writeFileSync(
    join(project, 'pnpm-workspace.yaml'),
    'packages:\n  - apps/*\n',
  );
  writeFileSync(join(project, 'apps', 'front', 'package-lock.json'), '{}\n');

  const invalid = runNode(
    '.harness/scripts/checks/package-policy-check.mjs',
    [],
    {
      cwd: project,
    },
  );
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
    assert.match(
      doc,
      /main.*dev|dev.*main/s,
      'must mention protected branches',
    );
    assert.match(doc, /secret/i, 'must mention secret safety');
    assert.match(doc, /production/i, 'must mention production safety');
    assert.match(
      doc,
      /data[- ]?mutat|데이터 변동|mutate persisted data/i,
      'must require approval before any data mutation',
    );
    assert.match(
      doc,
      /production data/i,
      'must mention production data safety',
    );
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
  assert.match(
    codexRules,
    /infisical.*prod/s,
    'must prompt production env wrappers',
  );
  assert.match(codexRules, /stripe/, 'must prompt payment side-effect CLIs');
  assert.match(
    codexRules,
    /twilio|sendgrid|resend/,
    'must prompt message side-effect CLIs',
  );
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

  const valid = runNode(
    '.harness/scripts/checks/secret-surface-check.mjs',
    [],
    {
      cwd: project,
    },
  );
  assert.equal(valid.status, 0, valid.stderr);

  writeFileSync(
    join(project, '.github', 'workflows', 'deploy.yml'),
    'env:\n  DATABASE_URL: ${{ secrets.DATABASE_URL }}\n',
  );
  writeFileSync(
    join(project, 'apps', 'front', '.env.example'),
    'SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----\n',
  );

  const invalid = runNode(
    '.harness/scripts/checks/secret-surface-check.mjs',
    [],
    {
      cwd: project,
    },
  );
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

test('doctor.sh accepts vendored Spec Kit skills without integration manifests', () => {
  const doctor = readFileSync(
    join(root, '.harness', 'scripts', 'checks', 'doctor.sh'),
    'utf8',
  );
  assert.match(
    doctor,
    /\.claude\/skills\/speckit-specify\/SKILL\.md/,
    'doctor must verify Claude Spec Kit via the vendored skill file',
  );
  assert.match(
    doctor,
    /\.agents\/skills\/speckit-specify\/SKILL\.md/,
    'doctor must verify Codex Spec Kit via the vendored skill file',
  );
  assert.doesNotMatch(
    doctor,
    /specify integration install/,
    'doctor must not ask downstream users to run upstream integration install for vendored assets',
  );
  assert.doesNotMatch(
    doctor,
    /\.specify\/integrations\/\$integration\.manifest\.json/,
    'doctor must not require upstream integration manifests for harness install output',
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
  assert.match(
    launcher,
    /rule-check\)/,
    'harness launcher must expose rule-check',
  );
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
  writeFileSync(join(project, '.claude', 'rules', 'orphan.md'), '# Orphan\n');
  writeFileSync(
    join(project, '.codex', 'rules', 'orphan.rules'),
    'prefix_rule(pattern = ["demo"], decision = "prompt", justification = "demo")\n',
  );
  writeFileSync(
    join(project, '.harness', 'policies', 'guardrails.md'),
    '# Guardrails\n',
  );
  writeFileSync(
    join(project, '.harness', 'policies', 'tool-permissions.md'),
    '# Permissions\n',
  );
  writeFileSync(
    join(project, '.harness', 'scripts', 'checks', 'doctor.sh'),
    '#!/usr/bin/env sh\n',
  );

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
  const project = tmp('codi-harness-manifest-');
  initGitRepo(project);
  // generate-manifest 는 정식 harness clone 에서만 실행된다(isHarnessRepo 가드).
  // 임시 repo 에 canonical origin 을 달아 harness clone 을 흉내낸다.
  assert.equal(
    runCommand(
      'git',
      [
        'remote',
        'add',
        'origin',
        'git@github.com:CODIWORKS-Engineer/codi-harness-v2.git',
      ],
      { cwd: project },
    ).status,
    0,
  );
  mkdirSync(join(project, '.harness', 'scripts', 'setup'), { recursive: true });
  mkdirSync(join(project, '.harness', 'policies'), { recursive: true });
  mkdirSync(join(project, '.planning'), { recursive: true });
  mkdirSync(join(project, 'apps', 'front'), { recursive: true });
  mkdirSync(join(project, '.github', 'workflows'), { recursive: true });
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'generate-manifest.mjs'),
    join(project, '.harness', 'scripts', 'setup', 'generate-manifest.mjs'),
  );
  writeFileSync(
    join(project, '.harness', 'policies', 'guardrails.md'),
    'shared\n',
  );
  writeFileSync(join(project, '.planning', 'STATE.md'), 'project owned\n');
  writeFileSync(join(project, 'apps', 'front', 'AGENTS.md'), 'project owned\n');
  writeFileSync(
    join(project, '.github', 'workflows', 'ci.yml'),
    'project owned\n',
  );
  writeFileSync(join(project, 'README.md'), 'project owned\n');
  writeFileSync(join(project, 'AGENTS.md'), 'shared agents\n');
  commitAll(project, 'init');

  const first = runNode('.harness/scripts/setup/generate-manifest.mjs', [], {
    cwd: project,
  });
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
    '.specify/feature.json',
    'docs/index.html',
    'docs/planning.html',
    'README.md',
    'specs/002-feature-hub/spec.md',
    'tests/harness-cli.test.mjs',
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
  const second = runNode('.harness/scripts/setup/generate-manifest.mjs', [], {
    cwd: project,
  });
  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /up to date/);
  assert.equal(readFileSync(manifestPath, 'utf8'), firstSerialized);
});

test('generate-manifest.mjs is a no-op in a downstream project', () => {
  // 다운스트림(비-harness) origin 을 가진 repo 에서는 manifest 를 재생성하지
  // 않아야 한다. 그렇지 않으면 source_ref 가 그 프로젝트의 브랜치명으로
  // 오염되어 전파된다(누락 #1 회귀 가드).
  const project = tmp('codi-harness-downstream-');
  initGitRepo(project);
  assert.equal(
    runCommand(
      'git',
      [
        'remote',
        'add',
        'origin',
        'git@github.com:some-org/some-downstream-app.git',
      ],
      { cwd: project },
    ).status,
    0,
  );
  mkdirSync(join(project, '.harness', 'scripts', 'setup'), { recursive: true });
  mkdirSync(join(project, '.harness', 'policies'), { recursive: true });
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'generate-manifest.mjs'),
    join(project, '.harness', 'scripts', 'setup', 'generate-manifest.mjs'),
  );
  writeFileSync(
    join(project, '.harness', 'policies', 'guardrails.md'),
    'shared\n',
  );
  commitAll(project, 'init');

  const result = runNode('.harness/scripts/setup/generate-manifest.mjs', [], {
    cwd: project,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    existsSync(join(project, '.harness', 'shared-manifest.json')),
    false,
    'downstream project must NOT have a manifest written',
  );
});

test('prune-stale.mjs identifies shared files missing from the manifest', () => {
  const project = tmp('codi-harness-prune-');
  mkdirSync(join(project, '.harness', 'scripts', 'checks'), {
    recursive: true,
  });
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
  writeFileSync(
    join(project, '.harness', 'scripts', 'checks', 'doctor.sh'),
    'ok',
  );
  writeFileSync(
    join(project, '.harness', 'scripts', 'checks', 'old-check.sh'),
    'stale',
  );
  writeFileSync(
    join(project, '.harness', 'scripts', 'setup', 'old-helper.mjs'),
    'stale',
  );
  writeFileSync(join(project, '.planning', 'STATE.md'), 'project work');
  writeFileSync(join(project, 'apps', 'front', 'AGENTS.md'), 'project work');

  const result = runNode('.harness/scripts/setup/prune-stale.mjs', [], {
    cwd: project,
    env: { MANIFEST_FILE: manifestPath, ROOT_DIR: project },
  });
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
  const source = tmp('codi-harness-source-');
  const project = tmp('codi-harness-project-');

  initGitRepo(source);
  markHarnessClone(source);
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
    join(root, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
    join(project, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
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
  // 020: 로컬 shared-manifest 가 없으면 배포 이력을 알 수 없다 — diff 기반
  // 제거와 마찬가지로 stale 삭제도 전체 생략한다 (fail-safe, 오삭제보다 잔재).
  assert.doesNotMatch(
    applied.stdout,
    /upstream에 더 이상 없는 stale shared 파일 정리: [1-9][0-9]*/,
  );
  assert.match(
    applied.stderr,
    /로컬 shared-manifest/,
    'stale deletion must be skipped with a warning when the prior manifest is missing',
  );
  assert.equal(
    existsSync(
      join(project, '.harness', 'scripts', 'checks', 'stale-doctor.sh'),
    ),
    true,
    'without a prior manifest no stale file may be deleted',
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
  const source = tmp('codi-harness-skill-prune-source-');
  const project = tmp('codi-harness-skill-prune-project-');

  initGitRepo(source);
  markHarnessClone(source);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(source, '.harness', 'scripts', _d), { recursive: true });
  }
  mkdirSync(join(source, '.harness', 'skills', 'current-skill'), {
    recursive: true,
  });
  for (const f of [
    'generate-manifest.mjs',
    'prune-stale.mjs',
    'project-owned.mjs',
  ]) {
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
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
    join(project, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
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
  // 020: stale 삭제는 배포 이력(이전 로컬 shared-manifest 실재)이 있어야
  // 한다 — old-skill 이 과거에 배포됐음을 로컬 manifest 로 기록한다.
  writeFileSync(
    join(project, '.harness', 'shared-manifest.json'),
    `${JSON.stringify({ files: ['.harness/skills/old-skill/SKILL.md'] }, null, 1)}\n`,
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
    existsSync(
      join(project, '.harness', 'skills', 'current-skill', 'SKILL.md'),
    ),
    true,
    'current upstream skill must be restored',
  );
});

test('update stale 정리는 배포 이력 파일만 삭제하고 미상 파일은 이전 안내한다 (020)', () => {
  const source = tmp('codi-harness-stale-limit-source-');
  const project = tmp('codi-harness-stale-limit-project-');

  initGitRepo(source);
  markHarnessClone(source);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(source, '.harness', 'scripts', _d), { recursive: true });
  }
  for (const f of ['generate-manifest.mjs', 'prune-stale.mjs', 'project-owned.mjs']) {
    cpSync(
      join(root, '.harness', 'scripts', 'setup', f),
      join(source, '.harness', 'scripts', 'setup', f),
    );
  }
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
  for (const f of [
    'update.sh',
    'project-owned-fallback.sh',
    'prune-stale.mjs',
    'project-owned.mjs',
  ]) {
    cpSync(
      join(root, '.harness', 'scripts', 'setup', f),
      join(project, '.harness', 'scripts', 'setup', f),
    );
  }
  // distributed-stale: 이전 로컬 manifest 에 실재 — 삭제돼야 한다.
  writeFileSync(
    join(project, '.harness', 'scripts', 'checks', 'stale-doctor.sh'),
    'old doctor\n',
  );
  // unknown-file: 배포 이력 없음 — 보존 + rules-local 이전 안내 대상.
  mkdirSync(join(project, '.claude', 'rules'), { recursive: true });
  writeFileSync(
    join(project, '.claude', 'rules', 'my-rule.md'),
    '# 프로젝트 규칙\n',
  );
  writeFileSync(join(project, 'AGENTS.md'), 'old agents\n');
  writeFileSync(
    join(project, '.harness', 'shared-manifest.json'),
    `${JSON.stringify(
      { files: ['.harness/scripts/checks/stale-doctor.sh', 'AGENTS.md'] },
      null,
      1,
    )}\n`,
  );
  commitAll(project, 'project');

  const applied = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'update.sh'),
    ['--apply-harness', '--source-repo', source, '--source-ref', 'v2'],
    { cwd: project },
  );
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(
    existsSync(join(project, '.harness', 'scripts', 'checks', 'stale-doctor.sh')),
    false,
    'distributed-stale must still be pruned',
  );
  assert.equal(
    existsSync(join(project, '.claude', 'rules', 'my-rule.md')),
    true,
    'files the harness never distributed must be preserved',
  );
  assert.match(
    applied.stderr,
    /rules-local/,
    'preserved unknown files must come with a rules-local migration hint',
  );
  assert.match(
    applied.stderr,
    /my-rule\.md/,
    'the hint must name the preserved file',
  );
});

test('doctor는 배포 이력 없는 하네스 트리 파일을 비차단 경고한다 (020)', () => {
  const project = tmp('codi-harness-doctor-unknown-');
  cpSync(join(root, '.harness'), join(project, '.harness'), { recursive: true });
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
  writeFileSync(
    join(project, '.claude', 'rules', 'my-rule.md'),
    '# 프로젝트 규칙\n',
  );
  const r = spawnSync(
    'bash',
    [join(project, '.harness', 'scripts', 'checks', 'doctor.sh')],
    { cwd: project, encoding: 'utf8' },
  );
  const out = `${r.stdout}${r.stderr}`;
  assert.match(
    out,
    /- \.claude\/rules\/my-rule\.md/,
    'doctor must list the non-distributed file as drift',
  );
  assert.match(
    out,
    /힌트: 하네스가 배포한 적 없는 프로젝트 파일이면 \.harness\/rules-local\//,
    'downstream doctor must attach the rules-local migration hint',
  );
});

test('update.sh prune step never touches project-owned paths', () => {
  const pruneSource = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'prune-stale.mjs'),
    'utf8',
  );
  const scanRootsMatch = pruneSource.match(
    /const SCAN_ROOTS = \[([\s\S]*?)\];/,
  );
  assert.ok(scanRootsMatch, 'SCAN_ROOTS array must be present');
  const scanRoots = scanRootsMatch[1];
  for (const forbidden of ['"apps"', '"."', '".github"', '".planning"']) {
    assert.ok(
      !scanRoots.includes(forbidden),
      `SCAN_ROOTS must not include ${forbidden}`,
    );
  }
  // 분류는 소스 문자열이 아니라 행위로 검증한다 (감사 M-14) — export 된
  // isProjectOwned 를 직접 호출하면 리팩터(따옴표·상수명 변경)에 안 깨진다.
  return import('../.harness/scripts/setup/project-owned.mjs').then(({ isProjectOwned }) => {
    for (const p of ['.planning/x', 'apps/front/a.ts', '.github/workflows/ci.yml', 'tools/migrate/step1.sql']) {
      assert.equal(isProjectOwned(p), true, `${p} 는 project-owned 여야 한다`);
    }
    assert.equal(isProjectOwned('.harness/policies/guardrails.md'), false);
  });
});

test('skills-link builds a merged tree from .harness/skills and .harness/skills-local', () => {
  const project = tmp('codi-harness-skills-link-');
  mkdirSync(join(project, '.harness', 'skills', 'shared-skill'), {
    recursive: true,
  });
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

test('skills-link links rules-local into .claude/rules/local (020)', () => {
  const project = tmp('codi-harness-rules-link-');
  mkdirSync(join(project, '.harness', 'rules-local'), { recursive: true });
  writeFileSync(
    join(project, '.harness', 'rules-local', 'team-rule.md'),
    '# 팀 규칙\n',
  );
  // .md 외 항목과 하위 디렉터리는 링크 대상이 아니다.
  writeFileSync(join(project, '.harness', 'rules-local', 'notes.txt'), 'x\n');
  mkdirSync(join(project, '.harness', 'rules-local', 'sub'), { recursive: true });

  mkdirSync(join(project, '.harness', 'scripts', 'setup'), { recursive: true });
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'skills-link.sh'),
    join(project, '.harness', 'scripts', 'setup', 'skills-link.sh'),
  );
  const script = join(project, '.harness', 'scripts', 'setup', 'skills-link.sh');

  const first = runCommand(script, [], { cwd: project });
  assert.equal(first.status, 0, first.stderr);

  const link = join(project, '.claude', 'rules', 'local', 'team-rule.md');
  assert.ok(existsSync(link), '.claude/rules/local/team-rule.md must exist');
  assert.equal(lstatSyncIsSymlink(link), true, 'must be a symlink');
  const target = readlinkSync(link);
  assert.ok(!target.startsWith('/'), `link must be relative, got ${target}`);
  assert.equal(readFileSync(link, 'utf8'), '# 팀 규칙\n');
  assert.ok(
    !existsSync(join(project, '.claude', 'rules', 'local', 'notes.txt')),
    'non-md entries must not be linked',
  );
  assert.ok(
    !existsSync(join(project, '.claude', 'rules', 'local', 'sub')),
    'subdirectories must not be linked',
  );

  // 멱등: 재실행해도 링크 대상이 같다.
  const second = runCommand(script, [], { cwd: project });
  assert.equal(second.status, 0, second.stderr);
  assert.equal(readlinkSync(link), target);

  // 고아 정리: 소스가 사라지면 링크도 사라진다.
  rmSync(join(project, '.harness', 'rules-local', 'team-rule.md'));
  const third = runCommand(script, [], { cwd: project });
  assert.equal(third.status, 0, third.stderr);
  assert.ok(!existsSync(link), 'orphan rule link must be pruned');
});

test('skills-link links rules-local in lock mode via HARNESS_ROOT_DIR (020)', () => {
  // lock 모드 materialize 는 버전 캐시 안의 스크립트 사본을 HARNESS_ROOT_DIR
  // 재지정으로 소비 레포에 적용한다 — 같은 형태로 rules 링크를 검증한다.
  const pkgCache = tmp('codi-harness-rules-link-pkg-');
  const project = tmp('codi-harness-rules-link-lock-');
  mkdirSync(join(pkgCache, 'setup'), { recursive: true });
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'skills-link.sh'),
    join(pkgCache, 'setup', 'skills-link.sh'),
  );
  mkdirSync(join(project, '.harness', 'rules-local'), { recursive: true });
  writeFileSync(join(project, '.harness', 'rules-local', 'lock-rule.md'), '# r\n');

  const result = runCommand(join(pkgCache, 'setup', 'skills-link.sh'), [], {
    cwd: project,
    env: { ...process.env, HARNESS_ROOT_DIR: project },
  });
  assert.equal(result.status, 0, result.stderr);
  const link = join(project, '.claude', 'rules', 'local', 'lock-rule.md');
  assert.equal(lstatSyncIsSymlink(link), true, 'lock-mode rules link must exist');
  assert.ok(
    !readlinkSync(link).startsWith('/'),
    'lock-mode rules link must stay relative',
  );
  assert.equal(readFileSync(link, 'utf8'), '# r\n');
});

test('skills-link lazily creates .harness/rules-local on fresh clones (020)', () => {
  const project = tmp('codi-harness-rules-link-fresh-');
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
  assert.ok(
    existsSync(join(project, '.harness', 'rules-local')),
    '.harness/rules-local must be lazily created',
  );
});

test('skills-link keeps already-correct skill symlinks stable', () => {
  const project = tmp('codi-harness-skills-link-stable-');
  mkdirSync(join(project, '.harness', 'skills', 'shared-skill'), {
    recursive: true,
  });
  mkdirSync(join(project, '.harness', 'skills-local'), { recursive: true });
  mkdirSync(join(project, '.harness', 'scripts', 'setup'), { recursive: true });
  writeFileSync(
    join(project, '.harness', 'skills', 'shared-skill', 'SKILL.md'),
    '# Shared\n',
  );
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'skills-link.sh'),
    join(project, '.harness', 'scripts', 'setup', 'skills-link.sh'),
  );

  const first = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'skills-link.sh'),
    [],
    { cwd: project },
  );
  assert.equal(first.status, 0, first.stderr);
  const link = join(project, '.claude', 'skills', 'shared-skill');
  const firstStat = lstatSync(link);
  const firstTarget = readlinkSync(link);

  const second = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'skills-link.sh'),
    [],
    { cwd: project },
  );
  assert.equal(second.status, 0, second.stderr);
  const secondStat = lstatSync(link);

  assert.equal(readlinkSync(link), firstTarget);
  assert.equal(
    secondStat.ino,
    firstStat.ino,
    'idempotent run must not unlink and recreate a correct symlink',
  );
});

function lstatSyncIsSymlink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

test('skills-link does not delete tracked legacy skill symlinks by default', () => {
  const project = tmp('codi-harness-skills-link-legacy-');
  initGitRepo(project);
  mkdirSync(join(project, '.harness', 'skills', 'shared-skill'), {
    recursive: true,
  });
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
  assert.equal(
    status.stdout,
    '',
    'preflight-safe run must not dirty tracked symlinks',
  );
});

test('skills-link fails on a name collision between shared and local', () => {
  const project = tmp('codi-harness-skills-collision-');
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
  const source = tmp('codi-harness-source-local-');
  const project = tmp('codi-harness-project-local-');

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
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
    join(project, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
  );
  mkdirSync(join(project, '.harness', 'skills-local', 'project-only-skill'), {
    recursive: true,
  });
  writeFileSync(
    join(project, '.harness', 'skills-local', 'project-only-skill', 'SKILL.md'),
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
  const source = tmp('codi-harness-source-empty-local-');
  const project = tmp('codi-harness-project-empty-local-');

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
  cpSync(
    join(root, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
    join(project, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
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
  {
    // 셸 fallback 은 공용 파일 하나다 (L-1) — 거기서 보호 항목을 확인한다.
    const body = readFileSync(
      join(root, '.harness', 'scripts', 'setup', 'project-owned-fallback.sh'),
      'utf8',
    );
    assert.match(
      body,
      /\.harness\/skills-local/,
      'shared shell fallback must protect .harness/skills-local',
    );
    assert.match(
      body,
      /\.harness\/config\/skill-triggers\.local\.json/,
      'shared shell fallback must protect local skill triggers',
    );
  }
  for (const file of [
    '.harness/scripts/setup/generate-manifest.mjs',
    '.harness/scripts/setup/prune-stale.mjs',
  ]) {
    const body = readFileSync(join(root, file), 'utf8');
    // 따옴표 스타일에 묶이지 않게 완화 (감사 M-14).
    assert.match(
      body,
      /from\s+['"]\.\/project-owned\.mjs['"]/,
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
  const project = tmp('codi-harness-injector-');
  mkdirSync(join(project, '.harness', 'config'), { recursive: true });
  mkdirSync(join(project, '.harness', 'skills-local', 'my-domain-skill'), {
    recursive: true,
  });
  writeFileSync(
    join(project, '.harness', 'skills-local', 'my-domain-skill', 'SKILL.md'),
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
    ['docs/index.html', 0, 'project-owned'],
    ['docs/planning.html', 0, 'project-owned'],
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
  const out = r.stdout
    .split('\n')
    .filter((line) => line.length > 0)
    .sort();
  assert.deepEqual(out, ['.harness/skills/codi-backend/SKILL.md', 'AGENTS.md']);
});

test('doctor self-heals a missing .harness/skills-local without failing', () => {
  const project = tmp('codi-harness-doctor-skills-local-');
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
  assert.equal(
    existsSync(skillsLocal),
    false,
    'precondition: skills-local removed',
  );
  const r = spawnSync(
    'bash',
    [join(project, '.harness', 'scripts', 'checks', 'doctor.sh')],
    {
      cwd: project,
      encoding: 'utf8',
    },
  );
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

// f443732 이후 계약: 머지 트리의 non-symlink 자식은 fail-fast가 아니라 "외부 소유"로
// 보고 보존한다. 디렉터리(Spec Kit speckit-* 등)는 조용히 공존시키고, 실제 파일은
// 실수 가능성이 높으므로 경고만 남긴다(둘 다 exit 0, 외부 항목을 지우지 않음).
test('skills-link preserves a non-symlink file child with a warning (exit 0)', () => {
  const project = tmp('codi-harness-link-nonsymlink-');
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
  assert.equal(
    r.status,
    0,
    'skills-link must not fail on a non-symlink file — it preserves and warns',
  );
  assert.match(r.stderr, /symlink도 디렉터리도 아닙니다|외부 소유/);
  // 외부 파일은 지워지지 않고 보존된다.
  assert.equal(
    existsSync(join(project, '.claude', 'skills', 'real-file.md')),
    true,
    '외부 소유 파일은 보존되어야 한다',
  );
  // harness 소유 스킬은 symlink로 정상 생성된다.
  assert.equal(
    lstatSync(join(project, '.claude', 'skills', 'shared')).isSymbolicLink(),
    true,
  );
});

// speckit-* 같은 외부 소유 디렉터리는 경고 없이 조용히 공존해야 한다.
test('skills-link coexists with an external-owned directory (Spec Kit)', () => {
  const project = tmp('codi-harness-link-external-');
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
  mkdirSync(join(project, '.claude', 'skills', 'speckit-plan'), {
    recursive: true,
  });
  writeFileSync(
    join(project, '.claude', 'skills', 'speckit-plan', 'SKILL.md'),
    '# speckit plan\n',
  );

  const r = runCommand(
    join(project, '.harness', 'scripts', 'setup', 'skills-link.sh'),
    [],
    { cwd: project },
  );
  assert.equal(r.status, 0, r.stderr);
  // 외부 소유 디렉터리는 그대로 보존된다.
  assert.equal(
    existsSync(join(project, '.claude', 'skills', 'speckit-plan', 'SKILL.md')),
    true,
  );
  // harness 소유 스킬 symlink도 함께 생성된다.
  assert.equal(
    lstatSync(join(project, '.claude', 'skills', 'shared')).isSymbolicLink(),
    true,
  );
});

test('guardrails block .harness/skills writes in a downstream project', () => {
  const project = tmp('codi-harness-guard-downstream-');
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
  const project = tmp('codi-harness-guard-relative-');
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'my-downstream-app' }),
  );
  mkdirSync(join(project, '.harness', 'skills', 'foo'), { recursive: true });
  mkdirSync(join(project, '.harness', 'skills-local', 'foo'), {
    recursive: true,
  });
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
  const project = tmp('codi-harness-guard-harnessrepo-');
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'codi-harness-v2' }),
  );
  assert.equal(spawnSync('git', ['init', '-q'], { cwd: project }).status, 0);
  assert.equal(
    spawnSync(
      'git',
      [
        'remote',
        'add',
        'origin',
        'https://github.com/CODIWORKS-Engineer/codi-harness.git',
      ],
      {
        cwd: project,
      },
    ).status,
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
  const project = tmp('codi-harness-env-bypass-');
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
  assert.ok(
    r.stdout.length > 0,
    'env var alone must not bypass downstream guard',
  );
  const decision = JSON.parse(r.stdout);
  assert.equal(decision.decision, 'block');
});

test('guardrails allow .harness/skills-local writes everywhere', () => {
  const project = tmp('codi-harness-guard-skills-local-');
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'my-downstream-app' }),
  );
  const input = JSON.stringify({
    tool_name: 'Write',
    tool_input: {
      file_path: join(
        project,
        '.harness',
        'skills-local',
        'my-skill',
        'SKILL.md',
      ),
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
  const project = tmp('codi-harness-bash-bypass-');
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
    "python -c \"open('.harness/skills/foo/SKILL.md','w').write('x')\"",
    "node -e \"require('fs').writeFileSync('.harness/skills/foo/SKILL.md','x')\"",
    'sudo cp /tmp/x .harness/skills/foo/SKILL.md',
    "mise exec -- node -e \"require('fs').writeFileSync('.harness/skills/foo/SKILL.md','x')\"",
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
    assert.ok(r.stdout.length > 0, `Bash bypass should be blocked: ${command}`);
    const decision = JSON.parse(r.stdout);
    assert.equal(decision.decision, 'block', `must block: ${command}`);
  }
});

test('guardrails allow safe Bash commands around .harness/skills', () => {
  const project = tmp('codi-harness-bash-allow-');
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
  const project = tmp('codi-harness-cwd-write-');
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
    [
      join(project, '.harness', 'skills'),
      'git diff --output=SKILL.md',
      'block',
    ],
    [join(project, '.harness', 'skills'), 'git log --output=SKILL.md', 'block'],
    [
      join(project, '.harness', 'skills'),
      'git show --output=SKILL.md',
      'block',
    ],
    [
      join(project, '.harness', 'skills'),
      'git grep foo --output=SKILL.md',
      'block',
    ],
    [join(project, '.harness', 'skills'), 'git diff --ext-diff', 'block'],
    [join(project, '.harness', 'skills'), 'cat foo/SKILL.md', 'allow'],
    [join(project, '.harness', 'skills'), 'ls', 'allow'],
    [join(project, '.harness', 'skills'), 'git status', 'allow'],
    [
      join(project, '.harness', 'skills'),
      'git rev-parse --show-toplevel',
      'allow',
    ],
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
      {
        input,
        encoding: 'utf8',
        env: { ...process.env, CLAUDE_PROJECT_DIR: project },
      },
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
  const project = tmp('codi-harness-no-root-');
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
  const project = tmp('codi-harness-carve-out-');
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
      {
        input,
        encoding: 'utf8',
        env: { ...process.env, CLAUDE_PROJECT_DIR: project },
      },
    );
    assert.equal(r.status, 0, r.stderr);
    assert.ok(r.stdout.length > 0, `must block compound: ${command}`);
  }
});

// 공용 tree 안에서의 ambient 허용은 `git status`, `node --version` 같은
// 읽기 형태만 인정한다. 변경 가능한 subcommand나 명령 실행기는 차단해야 한다.
test('guardrails ambient-safe list refuses mutating subcommands', () => {
  const project = tmp('codi-harness-ambient-');
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
    "node -e \"require('fs').writeFileSync('foo','x')\"",
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
      {
        input,
        encoding: 'utf8',
        env: { ...process.env, CLAUDE_PROJECT_DIR: project },
      },
    );
    assert.equal(r.status, 0, r.stderr);
    assert.ok(
      r.stdout.length > 0,
      `must block mutating subcommand: ${command}`,
    );
  }
});

// 절대경로 redirect가 다시 자기 프로젝트의 공용 tree로 들어오면 차단한다.
// 프로젝트 밖 절대경로와 /dev/null은 통과한다.
test('guardrails block absolute redirects back into the project shared tree', () => {
  const project = tmp('codi-harness-abs-redir-');
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
      {
        input,
        encoding: 'utf8',
        env: { ...process.env, CLAUDE_PROJECT_DIR: project },
      },
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
  const project = tmp('codi-harness-symlink-');
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'downstream-app' }),
  );
  const real = tmp('codi-harness-symlink-real-');
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
      {
        input,
        encoding: 'utf8',
        env: { ...process.env, CLAUDE_PROJECT_DIR: project },
      },
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

test('guardrails cap substitution recursion depth (fail closed)', () => {
  const project = tmp('codi-harness-dos-cap-');
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
  assert.ok(
    elapsed < 4000,
    `must complete fast even for depth=${depth} (got ${elapsed}ms)`,
  );
});

test('guardrails accept the canonical harness origin (HTTPS and SSH)', () => {
  for (const remote of [
    'https://github.com/CODIWORKS-Engineer/codi-harness.git',
    'https://github.com/CODIWORKS-Engineer/codi-harness-v2',
    'git@github.com:CODIWORKS-Engineer/codi-harness.git',
  ]) {
    const project = tmp('codi-harness-origin-ok-');
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
    assert.equal(
      r.stdout,
      '',
      `canonical origin ${remote} must not be blocked`,
    );
  }
});

test('update.sh manual apply fails nonzero when skills-link fails; --auto warns', () => {
  const source = tmp('codi-harness-fail-src-');
  initGitRepo(source);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(source, '.harness', 'scripts', _d), { recursive: true });
  }
  for (const f of [
    'update.sh',
    'project-owned-fallback.sh',
    'generate-manifest.mjs',
    'prune-stale.mjs',
    'project-owned.mjs',
    'skills-link.sh',
  ]) {
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
  const r1 = runNode('.harness/scripts/setup/generate-manifest.mjs', [], {
    cwd: source,
  });
  assert.equal(r1.status, 0, r1.stderr);
  runCommand('git', ['add', '.harness/shared-manifest.json'], { cwd: source });
  runCommand('git', ['commit', '-q', '-m', 'manifest'], { cwd: source });
  assert.equal(runCommand('git', ['branch', 'v2'], { cwd: source }).status, 0);
  function makeProject() {
    const project = tmp('codi-harness-fail-proj-');
    initGitRepo(project);
    for (const _d of [
      'checks',
      'tooling',
      'setup',
      'deploy',
      'agent',
      'audit',
    ]) {
      mkdirSync(join(project, '.harness', 'scripts', _d), { recursive: true });
    }
    for (const f of [
      'update.sh',
      'project-owned-fallback.sh',
      'prune-stale.mjs',
      'project-owned.mjs',
      'skills-link.sh',
    ]) {
      cpSync(
        join(root, '.harness', 'scripts', 'setup', f),
        join(project, '.harness', 'scripts', 'setup', f),
      );
    }
    // skills-link 실패를 유발한다. f443732 이후 non-symlink 파일은 더 이상
    // 실패가 아니므로(경고만), 확실히 fail하는 이름 충돌로 트리거한다:
    // .harness/skills 와 .harness/skills-local 에 같은 이름이 있으면
    // collision_check가 fail한다. project는 update.sh로 source의 'sample'
    // upstream skill을 받으므로, 로컬에 같은 'sample'을 심어 충돌시킨다.
    mkdirSync(join(project, '.harness', 'skills-local', 'sample'), {
      recursive: true,
    });
    writeFileSync(
      join(project, '.harness', 'skills-local', 'sample', 'SKILL.md'),
      '# local sample (collides with upstream)\n',
    );
    commitAll(project, 'project');
    return project;
  }

  const manualProject = makeProject();
  const manualResult = runCommand(
    join(manualProject, '.harness', 'scripts', 'setup', 'update.sh'),
    ['--apply-harness', '--source-repo', source, '--source-ref', 'v2'],
    { cwd: manualProject },
  );
  assert.notEqual(
    manualResult.status,
    0,
    'manual apply must fail nonzero when skills-link fails',
  );
  assert.match(
    manualResult.stderr,
    /skills-link\.sh 실행에 실패/,
    'manual apply must surface the skills-link failure',
  );

  const autoProject = makeProject();
  const autoResult = runCommand(
    join(autoProject, '.harness', 'scripts', 'setup', 'update.sh'),
    [
      '--apply-harness',
      '--auto',
      '--source-repo',
      source,
      '--source-ref',
      'v2',
    ],
    { cwd: autoProject },
  );
  assert.equal(
    autoResult.status,
    0,
    '--auto must keep going after skills-link failure',
  );
  assert.match(
    autoResult.stderr,
    /skills-link\.sh 실행 실패/,
    '--auto must warn about skills-link failure',
  );
});

test('project-profile-guard blocks apps/back via absolute path under next-fullstack', () => {
  const project = tmp('codi-harness-profile-abs-');
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
  const project = tmp('codi-harness-profile-allow-');
  mkdirSync(join(project, '.harness', 'config'), { recursive: true });
  // role 미설정 1회 힌트를 시드로 잠재워 프로필 의미론만 검증한다.
  mkdirSync(join(project, '.harness', 'state'), { recursive: true });
  writeFileSync(join(project, '.harness', 'state', 'dev-role-hint-shown'), 'seeded\n');
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
  assert.equal(
    r.stdout,
    '',
    'apps/front must not be blocked under next-fullstack',
  );
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
    const project = tmp('codi-harness-host-spoof-');
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
  const source = tmp('codi-harness-stale-dirty-src-');
  initGitRepo(source);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(source, '.harness', 'scripts', _d), { recursive: true });
  }
  for (const f of [
    'update.sh',
    'project-owned-fallback.sh',
    'prune-stale.mjs',
    'project-owned.mjs',
    'skills-link.sh',
  ]) {
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
    const project = tmp('codi-harness-stale-dirty-proj-');
    initGitRepo(project);
    for (const _d of [
      'checks',
      'tooling',
      'setup',
      'deploy',
      'agent',
      'audit',
    ]) {
      mkdirSync(join(project, '.harness', 'scripts', _d), { recursive: true });
    }
    for (const f of [
      'update.sh',
      'project-owned-fallback.sh',
      'prune-stale.mjs',
      'project-owned.mjs',
      'skills-link.sh',
    ]) {
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
    [
      '--apply-harness',
      '--auto',
      '--source-repo',
      source,
      '--source-ref',
      'v2',
    ],
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

// (감사 M-14) SEGMENT_TERMINATOR 상수명·정규식 원문을 단언하던 소스 대조
// 테스트는 삭제했다 — apps/front 차단·apps/back 허용은 위의 행위 테스트가
// 실제 실행으로 검증하므로 커버리지 손실이 없고, 상수 개명 리팩터에 깨지지
// 않는다.

test('update.sh fails nonzero when prune-stale.mjs cannot run in manual mode', () => {
  const source = tmp('codi-harness-prune-fail-src-');
  initGitRepo(source);
  markHarnessClone(source);
  for (const _d of ['checks', 'tooling', 'setup', 'deploy', 'agent', 'audit']) {
    mkdirSync(join(source, '.harness', 'scripts', _d), { recursive: true });
  }
  for (const f of [
    'update.sh',
    'project-owned-fallback.sh',
    'generate-manifest.mjs',
    'prune-stale.mjs',
    'project-owned.mjs',
    'skills-link.sh',
  ]) {
    cpSync(
      join(root, '.harness', 'scripts', 'setup', f),
      join(source, '.harness', 'scripts', 'setup', f),
    );
  }
  commitAll(source, 'initial');
  const r1 = runNode('.harness/scripts/setup/generate-manifest.mjs', [], {
    cwd: source,
  });
  assert.equal(r1.status, 0, r1.stderr);
  runCommand('git', ['add', '.harness/shared-manifest.json'], { cwd: source });
  runCommand('git', ['commit', '-q', '-m', 'manifest'], { cwd: source });
  assert.equal(runCommand('git', ['branch', 'v2'], { cwd: source }).status, 0);

  function makeProjectWithBrokenPrune() {
    const project = tmp('codi-harness-prune-fail-proj-');
    initGitRepo(project);
    for (const _d of [
      'checks',
      'tooling',
      'setup',
      'deploy',
      'agent',
      'audit',
    ]) {
      mkdirSync(join(project, '.harness', 'scripts', _d), { recursive: true });
    }
    for (const f of [
      'update.sh',
      'project-owned-fallback.sh',
      'project-owned.mjs',
      'skills-link.sh',
    ]) {
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
    [
      '--apply-harness',
      '--auto',
      '--source-repo',
      source,
      '--source-ref',
      'v2',
    ],
    { cwd: autoProject },
  );
  assert.equal(
    autoResult.status,
    0,
    '--auto must keep going after prune-stale failure',
  );
  assert.match(autoResult.stderr, /prune-stale\.mjs 실행 실패/);
});

test('guardrails reject http:// canonical origin (https-only)', () => {
  const project = tmp('codi-harness-http-');
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ name: 'codi-harness-v2' }),
  );
  assert.equal(spawnSync('git', ['init', '-q'], { cwd: project }).status, 0);
  assert.equal(
    spawnSync(
      'git',
      [
        'remote',
        'add',
        'origin',
        'http://github.com/CODIWORKS-Engineer/codi-harness-v2.git',
      ],
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
  assert.equal(
    decision.decision,
    'block',
    'http:// must not pass as canonical',
  );
});

test('tool-permission-guard segment terminator catches redirect-adjacent paths', () => {
  const guardSource = readFileSync(
    join(root, '.harness', 'hooks', 'tool-permission-guard.mjs'),
    'utf8',
  );
  const SEGMENT_TERMINATOR = '[\\s"\';|&<>]|$';
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

test('rule-check rejects a prefix_rule whose match example mismatches the pattern token (e2e vs e2e:changed)', () => {
  // Regression: a prefix_rule with pattern [...,"e2e"] but a match example
  // "mise run e2e:changed" makes the real codex execpolicy refuse to load the
  // WHOLE .codex/rules/ dir, silently disabling every Codex guardrail. The
  // static check must reject it without needing the codex binary.
  const project = makeProject();
  mkdirSync(join(project, '.claude', 'rules'), { recursive: true });
  mkdirSync(join(project, '.codex', 'rules'), { recursive: true });
  mkdirSync(join(project, '.harness', 'scripts', 'checks'), {
    recursive: true,
  });
  mkdirSync(join(project, '.harness', 'policies'), { recursive: true });
  cpSync(
    join(root, '.harness', 'scripts', 'checks', 'rule-check.mjs'),
    join(project, '.harness', 'scripts', 'checks', 'rule-check.mjs'),
  );
  // Fully-wired fixture so ONLY the token-mismatch check can fail.
  writeFileSync(join(project, '.claude', 'rules', 'demo.md'), '# Demo\n');
  writeFileSync(
    join(project, '.codex', 'rules', 'demo.rules'),
    'prefix_rule(\n' +
      '    pattern = ["mise", "run", "e2e"],\n' +
      '    decision = "allow",\n' +
      '    justification = "demo",\n' +
      '    match = [\n' +
      '        "mise run e2e",\n' +
      '        "mise run e2e:changed",\n' +
      '    ],\n' +
      ')\n',
  );
  writeFileSync(
    join(project, '.harness', 'policies', 'guardrails.md'),
    '# refs .claude/rules/demo.md and .codex/rules/demo.rules\n',
  );
  writeFileSync(
    join(project, '.harness', 'scripts', 'checks', 'doctor.sh'),
    '#!/usr/bin/env sh\n' +
      '# require_file ".claude/rules/demo.md"\n' +
      '# require_file ".codex/rules/demo.rules"\n',
  );

  const result = runNode('.harness/scripts/checks/rule-check.mjs', [], {
    cwd: project,
  });
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stderr, /e2e:changed/);
  assert.match(result.stderr, /e2e vs e2e:changed/);
});

test('rule-check does not false-fail on not_match examples (the match substring inside not_match)', () => {
  // Regression: the `match = [...]` regex must not also grab the examples inside
  // `not_match = [...]`. not_match examples are deliberately chosen NOT to match
  // the pattern, so treating them as `match` examples would wrongly fail. A
  // prefix_rule with ONLY not_match (no match list) must pass clean.
  const project = makeProject();
  mkdirSync(join(project, '.claude', 'rules'), { recursive: true });
  mkdirSync(join(project, '.codex', 'rules'), { recursive: true });
  mkdirSync(join(project, '.harness', 'scripts', 'checks'), {
    recursive: true,
  });
  mkdirSync(join(project, '.harness', 'policies'), { recursive: true });
  cpSync(
    join(root, '.harness', 'scripts', 'checks', 'rule-check.mjs'),
    join(project, '.harness', 'scripts', 'checks', 'rule-check.mjs'),
  );
  writeFileSync(join(project, '.claude', 'rules', 'demo.md'), '# Demo\n');
  writeFileSync(
    join(project, '.codex', 'rules', 'demo.rules'),
    'prefix_rule(\n' +
      '    pattern = ["pnpm", "install"],\n' +
      '    decision = "prompt",\n' +
      '    justification = "demo",\n' +
      '    not_match = [\n' +
      '        "pnpm test",\n' +
      '        "pnpm build",\n' +
      '    ],\n' +
      ')\n',
  );
  writeFileSync(
    join(project, '.harness', 'policies', 'guardrails.md'),
    '# refs .claude/rules/demo.md and .codex/rules/demo.rules\n',
  );
  writeFileSync(
    join(project, '.harness', 'scripts', 'checks', 'doctor.sh'),
    '#!/usr/bin/env sh\n' +
      '# require_file ".claude/rules/demo.md"\n' +
      '# require_file ".codex/rules/demo.rules"\n',
  );

  const result = runNode('.harness/scripts/checks/rule-check.mjs', [], {
    cwd: project,
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('prune-downstream: specs/.specify 를 통째로 지우는 목록에 넣지 않는다', async () => {
  // specs/ 를 통째로 지우면 자체 spec 까지 날아간다. 사본만 골라 지우는
  // 경로가 따로 있다 (selectHarnessSpecCopies) — 이 목록에는 들어가면 안 된다.
  // .specify/ 는 벤더 자산을 install 이 덮어쓰고 런타임 상태는 프로젝트
  // 소유라, 통째로 지우면 진행 중 기능의 체크포인트가 사라진다.
  const mod = await import(
    '../.harness/scripts/setup/upstream-project-state.mjs'
  );
  for (const p of ['specs', '.specify']) {
    assert.ok(
      !mod.PRUNE_DOWNSTREAM_PATHS.includes(p),
      `${p} 는 운영 중 레포의 자체 데이터라 자동 삭제 대상이 될 수 없다`,
    );
  }
  // 나머지는 init 목록의 부분집합이어야 한다 (드리프트 방지).
  for (const p of mod.PRUNE_DOWNSTREAM_PATHS) {
    assert.ok(
      mod.UPSTREAM_PROJECT_STATE_PATHS.includes(p),
      `${p} 가 init 목록에 없다 — 두 목록이 드리프트했다`,
    );
  }
});

test('release-on-merge 워크플로우: v2 전용 + 레포 가드 + release-check 재사용', () => {
  const wf = readFileSync(join(root, '.github', 'workflows', 'release.yml'), 'utf8');

  // 트리거는 업스트림 v2 push뿐 — 다운스트림(dev/main)에서는 절대 돌지 않는다.
  assert.match(wf, /branches:\s*\[v2\]/);
  assert.match(wf, /github\.repository == 'CODIWORKS-Engineer\/codi-harness'/);
  assert.match(wf, /permissions:\s*\n\s*contents: write/);
  // 검증·태그 생성은 로컬 수동 경로와 같은 스크립트를 재사용한다.
  assert.match(wf, /release-check\.sh/);
  // 릴리스 노트는 CHANGELOG 절에서 추출한다.
  assert.match(wf, /gh release create/);
  // 미태그 최신 CHANGELOG 절이 있을 때만 발행한다(배칭 유지).
  assert.match(wf, /rev-parse -q --verify "refs\/tags\//);
});

test('lock 모드 CI: 워크플로우가 호출하는 스크립트는 커밋으로 남는다', async () => {
  // lock 모드에서 .harness/** 는 git 비추적이라 actions/checkout 에는
  // 없다. 이 스크립트들을 KEEP_COMMITTED 로 남겨 CI가 복원 스텝이나
  // 업스트림 인증 없이 그대로 동작하게 한다 (2026-07-29).
  const { KEEP_COMMITTED } = await import(
    '../.harness/scripts/pkg/migrate-plan.mjs'
  );
  const dir = join(root, '.github', 'workflows');
  const called = new Set();
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.yml')) continue;
    if (entry.name === 'release.yml') continue; // 업스트림 전용
    const body = readFileSync(join(dir, entry.name), 'utf8');
    for (const m of body.matchAll(/(?:bash|sh|node) (\.harness\/scripts\/\S+)/g)) {
      called.add(m[1]);
    }
  }
  const missing = [...called].filter((p) => !KEEP_COMMITTED.includes(p)).sort();
  assert.deepEqual(
    missing,
    [],
    'CI가 호출하는 스크립트는 KEEP_COMMITTED 에 있어야 한다 (migrate-plan.mjs)',
  );
  assert.ok(called.size > 0, '검사 대상 호출을 하나도 못 찾았다면 패턴이 낡은 것');
});

// --- T031~T034: bootstrap 준비 계약 회귀 (specs/014-packaging-unification) ---
//
// bootstrap.sh 전체는 CI 에서 돌릴 수 없다. 1단계가 Darwin 을 요구하고,
// 3단계는 mise.run 을 curl 하며, 4단계는 mise install, 5단계는 gh auth,
// 6단계의 install.sh 는 네트워크 설치를 수행하고 $HOME 을 건드린다.
// 그래서 두 갈래로 나눠 검증한다.
//   (1) 6단계가 실제로 수행하는 "복구 가능한" 준비 작업(skills-link,
//       place-speckit-assets)은 네트워크 없이 격리 픽스처에서 진짜로 실행한다.
//       멱등성(T031)과 소실 복구(T032), 산출물 존재(T033)가 여기서 검증된다.
//   (2) 그 준비 작업이 bootstrap 경로에 실제로 배선돼 있는지와 진행 표시
//       번호(T034)는 bootstrap.sh / install.sh 소스를 정적 대조해 고정한다.

// 6단계 준비 작업을 격리 실행할 수 있는 최소 레포를 만든다. 실제 스크립트는
// 자기 위치에서 ROOT_DIR 을 유도하므로 디렉터리 배치를 그대로 흉내내야 한다.
function makeBootstrapPrepFixture() {
  const dir = tmp('codi-harness-prep-');
  mkdirSync(join(dir, '.harness', 'scripts', 'setup'), { recursive: true });
  cpSync(
    join(root, '.harness/scripts/setup/skills-link.sh'),
    join(dir, '.harness/scripts/setup/skills-link.sh'),
  );
  // vendored Spec Kit 자산은 place-speckit-assets 의 입력이다. 없으면 그
  // 스크립트가 조용히 early-exit 하므로 .specify 검증이 무의미해진다.
  cpSync(join(root, '.harness/vendor'), join(dir, '.harness/vendor'), {
    recursive: true,
  });
  for (const name of ['alpha-skill', 'beta-skill']) {
    mkdirSync(join(dir, '.harness', 'skills', name), { recursive: true });
    writeFileSync(join(dir, '.harness', 'skills', name, 'SKILL.md'), '# x\n');
  }
  mkdirSync(join(dir, '.harness', 'skills-local', 'local-skill'), {
    recursive: true,
  });
  writeFileSync(
    join(dir, '.harness', 'skills-local', 'local-skill', 'SKILL.md'),
    '# y\n',
  );
  return dir;
}

// bootstrap 6단계가 위임하는 준비 작업을 네트워크 없이 그대로 수행한다.
function runPrepStep(fixture) {
  const linked = runCommand(
    'sh',
    [join(fixture, '.harness/scripts/setup/skills-link.sh')],
    { cwd: fixture },
  );
  assert.equal(linked.status, 0, linked.stdout + linked.stderr);
  const placed = runCommand(
    'sh',
    [join(root, '.harness/scripts/setup/place-speckit-assets.sh')],
    { cwd: fixture, env: { HARNESS_ROOT_DIR: fixture } },
  );
  assert.equal(placed.status, 0, placed.stdout + placed.stderr);
}

// 트리 상태를 비교 가능한 스냅샷으로 만든다. symlink 는 따라가지 않고 대상
// 문자열을 기록해야 링크가 파일로 바뀌는 드리프트를 잡을 수 있다.
function snapshotTree(dir) {
  const lines = [];
  const walk = (current, prefix) => {
    if (!existsSync(current)) return;
    for (const entry of readdirSync(current, { withFileTypes: true }).sort(
      (a, b) => a.name.localeCompare(b.name),
    )) {
      const abs = join(current, entry.name);
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (lstatSync(abs).isSymbolicLink()) {
        lines.push(`link ${rel} -> ${readlinkSync(abs)}`);
      } else if (entry.isDirectory()) {
        lines.push(`dir  ${rel}`);
        walk(abs, rel);
      } else {
        lines.push(`file ${rel} ${readFileSync(abs, 'utf8').length}`);
      }
    }
  };
  walk(dir, '');
  return lines.join('\n');
}

// --- FR-012: 신규 프로젝트 결과 구조 == 전환 완료된 기존 레포 구조 ---

// init-project.sh 는 GitHub 레포 생성과 push 를 하므로 통째로 실행할 수 없다.
// 대신 init 이 lock 배선을 위임하는 실제 단계(write_harness_lock 이 만드는
// lock + `migrate.sh --fresh`)를 하네스 clone 모양의 픽스처 위에서 그대로
// 돌린다. 정적 매치가 아니라 결과 구조를 검사해야 FR-012 가 실제로 지켜진다.

const FR012_SHARED = {
  '.claude/rules/phase-routing.md': 'shared rule',
  '.harness/policies/guardrails.md': 'policy',
  '.harness/hooks/guardrails.mjs': '// hook',
  harness: '#!/bin/sh\necho launcher\n',
};

// 하네스 clone 에서 출발한 신규 프로젝트를 재현한다. 핵심은 공유 경로가
// "실파일 사본" 으로 존재한다는 점 — research R3 이 지적한, --fresh 가
// 반드시 필요한 입력 모양이다.
function makeFreshCloneRepo() {
  const repo = tmp('codi-fr012-repo-');
  runCommand('git', ['init', '--initial-branch=main', '.'], { cwd: repo });
  runCommand('git', ['config', 'user.email', 'test@example.com'], { cwd: repo });
  runCommand('git', ['config', 'user.name', 'fr012'], { cwd: repo });
  // 프로젝트 소유물만 커밋된다 (init 이 reset_git_history 로 새 히스토리를
  // 시작한 직후 상태). 공유 복사본은 untracked 로 남는다.
  const owned = join(repo, '.harness/config/project-profile.yaml');
  mkdirSync(join(owned, '..'), { recursive: true });
  writeFileSync(owned, 'mode: split');
  runCommand('git', ['add', '-A'], { cwd: repo });
  runCommand('git', ['commit', '-m', 'seed'], { cwd: repo });
  for (const [rel, content] of Object.entries(FR012_SHARED)) {
    const abs = join(repo, rel);
    mkdirSync(join(abs, '..'), { recursive: true });
    writeFileSync(abs, content);
  }
  return repo;
}

// init-project.sh 의 write_harness_lock 본문을 읽어 채널/스키마가 위 검증과
// 같은지 대조한다. 스크립트가 다른 값으로 드리프트하면 여기서 잡힌다.
function initProjectLockShape() {
  const script = readFileSync(
    join(root, '.harness', 'scripts', 'setup', 'init-project.sh'),
    'utf8',
  );
  const body = script.match(/^write_harness_lock\(\)\s*\{[\s\S]*?\n\}/m);
  assert.ok(body, 'write_harness_lock 함수를 찾지 못했다');
  return body[0];
}

test('FR-012: 신규 프로젝트 생성 결과가 lock 구조를 갖춘다', async () => {
  const { makeMigrateUpstream, makeIsolatedEnv } = await import(
    './helpers/pkg-fixture.mjs'
  );
  const upstream = makeMigrateUpstream({
    version: '1.0.0',
    sharedFiles: FR012_SHARED,
  });
  const env = makeIsolatedEnv();
  const repo = makeFreshCloneRepo();

  // 1) write_harness_lock 상당 — init 5단계의 첫 동작.
  const lockPath = join(repo, 'harness.lock');
  writeFileSync(
    lockPath,
    `{\n  "schema_version": 1,\n  "channel": "latest-minor",\n  "repo": "${upstream.bare}"\n}\n`,
  );

  // 2) migrate --fresh — init 이 lock 배선을 위임하는 실제 단계.
  const r = runCommand(
    'sh',
    [join(root, '.harness/scripts/pkg/migrate.sh'), '--fresh'],
    {
      cwd: repo,
      env: {
        CODI_HARNESS_CACHE_DIR: env.cacheDir,
        CODI_HARNESS_UPSTREAM_URL: upstream.bare,
      },
    },
  );
  assert.equal(r.status, 0, r.stderr + r.stdout);

  // lock 구조 조건 1: harness.lock 존재 + 스키마 유효
  assert.ok(existsSync(lockPath), 'harness.lock 이 있어야 한다');
  const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  assert.equal(lock.schema_version, 1);
  assert.equal(lock.channel, 'latest-minor');

  // lock 구조 조건 2: .harness/current 가 캐시 버전을 가리키는 심링크
  const current = join(repo, '.harness/current');
  assert.ok(
    lstatSync(current).isSymbolicLink(),
    '.harness/current 는 버전 전환용 심링크여야 한다',
  );
  assert.match(readlinkSync(current), /1\.0\.0$/);

  // lock 구조 조건 3: 공유 경로가 실파일 사본이 아니라 링크 경유여야 한다.
  // clone 이 남긴 복사본이 그대로 살아 있으면 룰이 이중 로드된다.
  assert.ok(
    lstatSync(join(repo, '.harness/policies')).isSymbolicLink(),
    '공유 디렉토리가 패키지 링크로 대체되어야 한다',
  );
  assert.equal(
    existsSync(join(repo, '.claude/rules/phase-routing.md')),
    false,
    '공유 룰 복사본이 원래 자리에 남아 있으면 안 된다',
  );
  assert.equal(
    readFileSync(join(repo, '.claude/rules/shared/phase-routing.md'), 'utf8'),
    'shared rule',
    '공유 룰은 패키지 경유로만 보여야 한다',
  );

  // 프로젝트 소유물은 보존된다.
  assert.equal(
    readFileSync(join(repo, '.harness/config/project-profile.yaml'), 'utf8'),
    'mode: split',
  );

  const writeLock = initProjectLockShape();
  assert.match(writeLock, /"schema_version": 1/);
  assert.match(writeLock, /"channel": "latest-minor"/);
});

test('T031 bootstrap 준비를 2회 실행해도 두 번째가 트리를 바꾸지 않는다', () => {
  // FR-002 / SC-003. "워킹트리에 변경 0건" 을 git 없이도 재현하려면 준비
  // 산출물 트리 자체를 스냅샷 비교하는 게 더 강하다 — git status 는 .gitignore
  // 된 경로의 드리프트를 놓치기 때문이다.
  const fixture = makeBootstrapPrepFixture();

  runPrepStep(fixture);
  const first = snapshotTree(fixture);

  runPrepStep(fixture);
  const second = snapshotTree(fixture);

  assert.equal(second, first, '두 번째 준비 실행이 트리를 변경했다 (멱등 위반)');
});

test('T031 bootstrap 준비 재실행은 git 워킹트리를 더럽히지 않는다', () => {
  // 같은 요구를 사용자가 실제로 보는 표면(git status)에서도 고정한다.
  const fixture = makeBootstrapPrepFixture();
  initGitRepo(fixture);
  runPrepStep(fixture);
  commitAll(fixture, 'prep baseline');

  runPrepStep(fixture);

  const status = runCommand('git', ['status', '--porcelain'], { cwd: fixture });
  assert.equal(status.status, 0, status.stderr);
  assert.equal(
    status.stdout.trim(),
    '',
    `재실행이 워킹트리에 변경을 남겼다:\n${status.stdout}`,
  );
});

test('T032 공유 경로가 소실돼도 준비 1회로 복구된다', () => {
  // FR-003 / SC-004. 소실 시나리오 3종을 한 번의 준비 실행으로 수렴시킨다.
  // 범위: install 이 만드는 파생물(머지 스킬 트리, Spec Kit 자산)이다.
  // materialize 가 만드는 공유 링크(.harness/policies 등)의 드리프트 복구는
  // lock 모드 픽스처가 필요해 tests/pkg-migrate.test.mjs 의
  // "구버전이 만든 scripts 통짜 심링크를 하위 링크 구조로 교체한다" 가 덮는다.
  const fixture = makeBootstrapPrepFixture();
  runPrepStep(fixture);
  const healthy = snapshotTree(fixture);

  // (1) 머지 스킬 트리 통째 소실 — git pull 로 링크가 사라진 상태.
  rmSync(join(fixture, '.claude', 'skills'), { recursive: true, force: true });
  // (2) 링크 드리프트 — 엉뚱한 곳을 가리키는 symlink.
  // symlink 는 unlink 로 지운다. rmSync 는 디렉터리를 가리키는 링크에
  // ERR_FS_EISDIR 을 내고, recursive 를 주면 링크 대상을 지울 위험이 있다.
  unlinkSync(join(fixture, '.agents/skills/alpha-skill'));
  symlinkSync('/nonexistent/target', join(fixture, '.agents/skills/alpha-skill'));
  unlinkSync(join(fixture, '.agents/skills/beta-skill'));
  // (3) Spec Kit 자산 소실.
  rmSync(join(fixture, '.specify'), { recursive: true, force: true });

  assert.notEqual(snapshotTree(fixture), healthy, '픽스처 손상이 실패했다');

  runPrepStep(fixture);

  assert.equal(
    snapshotTree(fixture),
    healthy,
    '준비 1회로 정상 상태에 수렴하지 못했다',
  );
});

test('T033 준비 후 병합 스킬 트리와 .specify 자산이 존재한다', () => {
  // FR-005. T011/T015 가 bootstrap 을 고치면서 준비 작업을 떨어뜨리는 회귀를
  // 막는다.
  const fixture = makeBootstrapPrepFixture();
  runPrepStep(fixture);

  for (const tree of ['.claude/skills', '.agents/skills']) {
    const treePath = join(fixture, tree);
    assert.ok(existsSync(treePath), `${tree} 가 없다`);
    // upstream 과 local 양쪽이 모두 병합돼야 "머지 트리" 다.
    for (const name of ['alpha-skill', 'beta-skill', 'local-skill']) {
      const link = join(treePath, name);
      assert.ok(
        lstatSyncIsSymlink(link),
        `${tree}/${name} 이 symlink 로 병합되지 않았다`,
      );
      assert.ok(existsSync(link), `${tree}/${name} 링크가 끊어져 있다`);
    }
  }

  // Spec Kit 자산 — templates/scripts 는 배치의 핵심 산출물이다.
  assert.ok(existsSync(join(fixture, '.specify')), '.specify 가 없다');
  for (const sub of ['templates', 'scripts/bash']) {
    assert.ok(
      existsSync(join(fixture, '.specify', sub)),
      `.specify/${sub} 가 배치되지 않았다`,
    );
  }
});

test('T033 bootstrap 경로에 준비 작업이 실제로 배선돼 있다', () => {
  // 위 테스트는 준비 스크립트를 직접 불러 검증한다. 그 스크립트가 bootstrap
  // 에서 떨어져 나가면 위 테스트는 여전히 통과하므로, 배선 자체를 고정한다.
  const bootstrap = readFileSync(
    join(root, '.harness/scripts/setup/bootstrap.sh'),
    'utf8',
  );
  assert.match(
    bootstrap,
    /^\s*run "\$ROOT_DIR\/harness" install\s*$/m,
    'bootstrap 이 더 이상 ./harness install 을 호출하지 않는다',
  );

  const install = readFileSync(
    join(root, '.harness/scripts/setup/install.sh'),
    'utf8',
  );
  // 앵커 없이 파일 이름만 찾으면 dry-run echo 문자열이나 주석에도 매치돼
  // 실제 호출을 지워도 통과한다 — 정확히 막으려던 회귀를 놓친다.
  // 줄 시작(공백 허용) + 따옴표로 시작하는 실행 형태만 인정한다.
  assert.match(
    install,
    /^\s*"\$ROOT_DIR\/\.harness\/scripts\/setup\/skills-link\.sh"/m,
    'install 이 스킬 트리를 안 만든다',
  );
  assert.match(
    install,
    /^\s*"\$ROOT_DIR\/\.harness\/scripts\/setup\/place-speckit-assets\.sh"/m,
    'install 이 Spec Kit 자산을 안 배치한다',
  );
});

test('T034 진행 표시는 1/7~7/7 이 누락·중복 없이 연속이다', () => {
  // FR-016. 실행이 아니라 소스를 대조한다 — bootstrap 을 끝까지 돌리려면
  // macOS + 네트워크 + gh 인증이 필요해 CI 에서 재현할 수 없다.
  const bootstrap = readFileSync(
    join(root, '.harness/scripts/setup/bootstrap.sh'),
    'utf8',
  );

  // 총 단계 수는 step() 의 출력 형식이 소유한다. 형식과 호출이 함께 움직이게
  // 총계를 하드코딩하지 않고 뽑아낸다.
  const format = bootstrap.match(
    /step\(\)\s*\{\s*printf\s+'\[bootstrap %s\/(\d+)\]/,
  );
  assert.ok(format, 'step() 의 [bootstrap N/M] 출력 형식을 찾지 못했다');
  const total = Number(format[1]);
  assert.equal(total, 7, '계약상 총 단계는 7 이다 (contracts/harness-cli.md)');

  // 주석(`# --- 4/7 ... ---`)이 아니라 실제 호출만 센다.
  const called = [
    ...bootstrap.matchAll(/^\s*step\s+(\d+)\s/gm),
  ].map((match) => Number(match[1]));
  assert.ok(called.length > 0, 'step 호출을 하나도 찾지 못했다');

  const unique = [...new Set(called)].sort((a, b) => a - b);
  assert.deepEqual(
    unique,
    Array.from({ length: total }, (_, index) => index + 1),
    `번호가 연속이 아니다 (발견: ${unique.join(',')})`,
  );

  // 번호는 소스 순서대로 단조 증가해야 한다. 같은 번호의 분기별 재호출
  // (예: 확인됨 / 설치 필요)은 허용하지만 뒤로 돌아가면 안 된다.
  for (let index = 1; index < called.length; index += 1) {
    assert.ok(
      called[index] >= called[index - 1],
      `단계 번호가 역행한다: ${called[index - 1]} 다음에 ${called[index]}`,
    );
  }

  // 범위를 벗어난 번호는 사용자에게 [bootstrap 8/7] 로 보인다.
  for (const number of called) {
    assert.ok(
      number >= 1 && number <= total,
      `범위를 벗어난 단계 번호: ${number}/${total}`,
    );
  }
});

// --- 014 US1: 도움말 분할 (FR-004) ---

// 명령 목록을 테스트에 하드코딩하면 "런처에 명령을 추가하고 도움말에 안 넣는"
// 바로 그 회귀를 못 잡는다. 런처 소스의 case 분기에서 뽑아야 대조가 성립한다.
function launcherCommands() {
  const src = readFileSync(join(root, 'harness'), 'utf8');
  const body = src.slice(src.indexOf('case "$cmd" in'));
  const names = new Set();
  for (const m of body.matchAll(/^ {2}([a-z][a-z0-9|_-]*)\)/gm)) {
    for (const name of m[1].split('|')) {
      // help 자신과 플래그 별칭(--help/-h)은 문서화 대상 명령이 아니다.
      if (name === 'help' || name.startsWith('-')) continue;
      names.add(name);
    }
  }
  return [...names];
}

test('T006: 기본 도움말은 일상 명령 4개만 싣는다', () => {
  const help = runCommand('./harness', ['help']);
  assert.equal(help.status, 0, help.stderr);

  for (const name of ['bootstrap', 'doctor', 'codex', 'claude']) {
    assert.match(help.stdout, new RegExp(`\\./harness ${name}\\b`), `일상 명령 ${name} 누락`);
  }
  // 나머지는 전부 숨는다 — 하드코딩 대신 런처에서 뽑아 대조한다.
  const daily = new Set(['bootstrap', 'doctor', 'codex', 'claude']);
  for (const name of launcherCommands().filter((n) => !daily.has(n))) {
    assert.doesNotMatch(
      help.stdout,
      new RegExp(`\\./harness ${name}\\b`),
      `${name} 은 기본 도움말에서 빠져야 한다`,
    );
  }
  assert.match(help.stdout, /전체 명령 목록: \.\/harness help --all/);
});

test('T006: 기본 도움말에서 숨긴 명령도 정상 동작한다', () => {
  // 숨김이지 제거가 아니다. 출력만 검사하면 둘을 구분하지 못한다.
  const r = runCommand('./harness', ['profile']);
  assert.equal(r.status, 0, r.stderr);
});

test('T007: help --all 은 런처의 모든 명령을 빠짐없이 문서화한다', () => {
  const help = runCommand('./harness', ['help', '--all']);
  assert.equal(help.status, 0, help.stderr);

  const commands = launcherCommands();
  // 헬퍼가 조용히 빈 목록을 내면 아래 루프가 통과해 버린다 — 그러면 이
  // 테스트는 아무것도 검증하지 않는다.
  assert.ok(commands.length >= 20, `런처 명령 추출 실패 (${commands.length}개)`);

  const missing = commands.filter(
    (name) => !new RegExp(`\\./harness ${name}\\b`).test(help.stdout),
  );
  assert.deepEqual(missing, [], `--all 에 누락된 명령: ${missing.join(', ')}`);

  for (const group of ['일상:', '점검:', '패키지 관리:', '레포 운영:']) {
    assert.match(help.stdout, new RegExp(group), `그룹 제목 ${group} 누락`);
  }
});

test('T007: --help --all 과 -h --all 은 help --all 과 동일하다', () => {
  const canonical = runCommand('./harness', ['help', '--all']).stdout;
  for (const alias of ['--help', '-h']) {
    assert.equal(
      runCommand('./harness', [alias, '--all']).stdout,
      canonical,
      `${alias} --all 출력이 다르다`,
    );
  }
});

// --- 014 US2: doctor 배포 모드 보고 (FR-008) ---

test('T019: doctor 는 배포 모드를 보고하고 집계를 바꾸지 않는다', () => {
  const r = runCommand('./harness', ['doctor']);
  const out = r.stdout + r.stderr;
  // 이 저장소는 copy 모드다(harness.lock 없음).
  assert.match(out, /배포 모드 copy — 전환하려면 \.\/harness migrate/);
  // copy 는 아직 지원되는 상태이므로 ok 여야 한다 — fail/warn 이면 다운스트림
  // CI 기대값이 깨진다.
  assert.doesNotMatch(out, /(실패|경고): 배포 모드/);
});

test('T019: doctor 배포 모드 줄이 fail/warn 집계에 잡히지 않는다', () => {
  const out = runCommand('./harness', ['doctor']).stdout;
  const m = out.match(/doctor 완료: 실패 (\d+)개, 경고 (\d+)개/);
  assert.ok(m, '집계 줄을 찾지 못했다');
  // ok() 로 낸 줄이므로 집계 증가가 없어야 한다. 배포 모드 보고를 넣기 전과
  // 같은 값이어야 하며, 특히 실패는 0 이어야 한다.
  assert.equal(m[1], '0', `배포 모드 보고가 실패를 늘렸다: ${m[1]}`);
});

