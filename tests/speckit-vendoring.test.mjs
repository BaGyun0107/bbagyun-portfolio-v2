import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { delimiter, join, resolve } from 'node:path';
import test from 'node:test';
import { tmp } from './helpers/fixture-base.mjs';

const root = resolve(import.meta.dirname, '..');

function makeProject(prefix = 'codi-speckit-') {
  return tmp(prefix);
}

function runScript(relativeScript, args = [], options = {}) {
  return spawnSync(join(root, relativeScript), args, {
    cwd: options.cwd ?? root,
    encoding: 'utf8',
    env: { ...process.env, ...(options.env ?? {}) },
  });
}

function writeExecutable(path, body) {
  writeFileSync(path, body);
  chmodSync(path, 0o755);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function makeFakeSpecKitBin(binDir) {
  writeExecutable(
    join(binDir, 'uvx'),
    `#!/usr/bin/env sh
set -eu
printf '%s\\n' "$*" > "$PWD/uvx-args.txt"
mkdir -p .specify/templates/overrides .specify/scripts/bash .specify/workflows/speckit .specify/memory
mkdir -p .claude/skills/speckit-specify .claude/skills/speckit-plan
mkdir -p .agents/skills/speckit-specify .agents/skills/speckit-plan
printf 'core spec template\\n' > .specify/templates/spec-template.md
printf 'local override must stay out\\n' > .specify/templates/overrides/spec-template.md
printf '#!/usr/bin/env bash\\necho create\\n' > .specify/scripts/bash/create-new-feature.sh
printf 'workflow: vendored\\n' > .specify/workflows/speckit/workflow.yml
printf 'constitution seed\\n' > .specify/memory/constitution.md
printf 'claude specify skill\\n' > .claude/skills/speckit-specify/SKILL.md
printf 'claude plan skill\\n' > .claude/skills/speckit-plan/SKILL.md
printf 'codex specify skill\\n' > .agents/skills/speckit-specify/SKILL.md
printf 'codex plan skill\\n' > .agents/skills/speckit-plan/SKILL.md
`,
  );
  writeExecutable(
    join(binDir, 'specify'),
    `#!/usr/bin/env sh
set -eu
printf '%s\\n' "$*" >> "$PWD/specify-args.txt"
`,
  );
  writeExecutable(
    join(binDir, 'git'),
    `#!/usr/bin/env sh
set -eu
case "$1 $2" in
  "ls-remote --tags")
    printf 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\\trefs/tags/v0.12.7\\n'
    printf 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\\trefs/tags/v0.12.7^{}\\n'
    ;;
  "rev-parse HEAD") printf '1111222233334444555566667777888899990000\\n' ;;
  "rev-list --count") printf '4\\n' ;;
  *) exec /usr/bin/git "$@" ;;
esac
`,
  );
}

test('speckit-vendor rejects missing floating refs', () => {
  for (const args of [[], ['latest'], ['main']]) {
    const result = runScript('.harness/scripts/setup/speckit-vendor.sh', args);
    assert.notEqual(result.status, 0, `${args.join(' ') || '<missing>'} must fail`);
    assert.match(result.stderr, /고정 릴리스 태그|릴리스 태그/);
  }
});

test('speckit-vendor extracts fixed-tag assets and updates version stamps', () => {
  const project = makeProject();
  mkdirSync(join(project, '.harness'), { recursive: true });
  writeFileSync(
    join(project, '.harness', 'lock.json'),
    `${JSON.stringify(
      {
        schema_version: 1,
        tools: {
          speckit: {
            repo: 'https://github.com/github/spec-kit',
            version: 'latest',
          },
        },
      },
      null,
      2,
    )}\n`,
  );

  const binDir = join(project, 'bin');
  mkdirSync(binDir);
  makeFakeSpecKitBin(binDir);

  const result = runScript(
    '.harness/scripts/setup/speckit-vendor.sh',
    ['v0.12.7'],
    {
      env: {
        HARNESS_ROOT_DIR: project,
        PATH: `${binDir}${delimiter}${process.env.PATH}`,
        HARNESS_VENDOR_DATE: '2026-07-08',
      },
    },
  );
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, /speckit vendor diff/);

  assert.equal(
    readFileSync(
      join(project, '.harness/vendor/speckit/templates/spec-template.md'),
      'utf8',
    ),
    'core spec template\n',
  );
  assert.equal(
    existsSync(
      join(project, '.harness/vendor/speckit/templates/overrides/spec-template.md'),
    ),
    false,
    'template overrides must not be vendored',
  );
  assert.equal(
    readFileSync(join(project, '.harness/vendor/speckit/scripts/create-new-feature.sh'), 'utf8'),
    '#!/usr/bin/env bash\necho create\n',
  );
  assert.equal(
    readFileSync(join(project, '.harness/vendor/speckit/workflow.yml'), 'utf8'),
    'workflow: vendored\n',
  );
  assert.equal(
    readFileSync(
      join(project, '.harness/vendor/speckit/skills-claude/speckit-specify/SKILL.md'),
      'utf8',
    ),
    'claude specify skill\n',
  );
  assert.equal(
    readFileSync(
      join(project, '.harness/vendor/speckit/skills-codex/speckit-specify/SKILL.md'),
      'utf8',
    ),
    'codex specify skill\n',
  );

  const lock = readJson(join(project, '.harness', 'lock.json'));
  assert.equal(lock.tools.speckit.version, 'v0.12.7');
  assert.equal(lock.tools.speckit.auto_update, false);

  const info = readJson(join(project, '.harness/vendor/speckit/VENDOR-INFO.json'));
  assert.equal(info.speckit_version, 'v0.12.7');
  assert.equal(
    info.speckit_ref,
    'git+https://github.com/github/spec-kit.git@v0.12.7',
  );
  assert.equal(info.vendored_commit, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
  assert.equal(info.vendored_at, '2026-07-08');
});

test('install places vendored Spec Kit assets idempotently and preserves local state', () => {
  const project = makeProject();
  const vendor = join(project, '.harness/vendor/speckit');
  mkdirSync(join(vendor, 'templates'), { recursive: true });
  mkdirSync(join(vendor, 'scripts'), { recursive: true });
  mkdirSync(join(vendor, 'skills-claude/speckit-specify'), { recursive: true });
  mkdirSync(join(vendor, 'skills-codex/speckit-specify'), { recursive: true });
  mkdirSync(join(project, '.specify/templates/overrides'), { recursive: true });
  mkdirSync(join(project, '.specify'), { recursive: true });
  writeFileSync(join(vendor, 'templates/spec-template.md'), 'vendored template\n');
  writeFileSync(join(vendor, 'scripts/create-new-feature.sh'), 'vendored script\n');
  writeFileSync(join(vendor, 'workflow.yml'), 'vendored workflow\n');
  writeFileSync(join(vendor, 'memory-constitution.md'), 'vendored constitution\n');
  writeFileSync(
    join(vendor, 'skills-claude/speckit-specify/SKILL.md'),
    'claude skill\n',
  );
  writeFileSync(
    join(vendor, 'skills-codex/speckit-specify/SKILL.md'),
    'codex skill\n',
  );
  writeFileSync(
    join(project, '.specify/templates/overrides/spec-template.md'),
    'local override\n',
  );
  writeFileSync(join(project, '.specify/feature.json'), '{"feature":"local"}\n');

  const env = { HARNESS_ROOT_DIR: project };
  for (let i = 0; i < 2; i += 1) {
    const result = runScript('.harness/scripts/setup/place-speckit-assets.sh', [], {
      env,
    });
    assert.equal(result.status, 0, result.stderr + result.stdout);
  }

  assert.equal(
    readFileSync(join(project, '.specify/templates/spec-template.md'), 'utf8'),
    'vendored template\n',
  );
  assert.equal(
    readFileSync(
      join(project, '.specify/templates/overrides/spec-template.md'),
      'utf8',
    ),
    'local override\n',
  );
  assert.equal(
    readFileSync(join(project, '.specify/scripts/bash/create-new-feature.sh'), 'utf8'),
    'vendored script\n',
  );
  assert.equal(
    readFileSync(join(project, '.specify/workflows/speckit/workflow.yml'), 'utf8'),
    'vendored workflow\n',
  );
  assert.equal(
    readFileSync(join(project, '.specify/memory/constitution.md'), 'utf8'),
    'vendored constitution\n',
  );
  assert.equal(
    readFileSync(join(project, '.specify/feature.json'), 'utf8'),
    '{"feature":"local"}\n',
  );
  assert.equal(
    readFileSync(join(project, '.claude/skills/speckit-specify/SKILL.md'), 'utf8'),
    'claude skill\n',
  );
  assert.equal(
    readFileSync(join(project, '.agents/skills/speckit-specify/SKILL.md'), 'utf8'),
    'codex skill\n',
  );

  writeFileSync(join(project, '.specify/memory/constitution.md'), 'local constitution\n');
  const third = runScript('.harness/scripts/setup/place-speckit-assets.sh', [], {
    env,
  });
  assert.equal(third.status, 0, third.stderr + third.stdout);
  assert.equal(
    readFileSync(join(project, '.specify/memory/constitution.md'), 'utf8'),
    'local constitution\n',
    'constitution seed must be written only when missing',
  );
});

test('Spec Kit drift check reports newer release tags and stays quiet when current', () => {
  const project = makeProject();
  mkdirSync(join(project, '.harness/vendor/speckit'), { recursive: true });
  writeFileSync(
    join(project, '.harness/vendor/speckit/VENDOR-INFO.json'),
    `${JSON.stringify({ speckit_version: 'v0.12.7' }, null, 2)}\n`,
  );

  const binDir = join(project, 'bin');
  mkdirSync(binDir);
  writeExecutable(
    join(binDir, 'git'),
    `#!/usr/bin/env sh
set -eu
printf 'abc123\\trefs/tags/v0.12.6\\n'
printf 'def456\\trefs/tags/v0.12.8\\n'
`,
  );
  const notice = join(project, 'notice.txt');
  const newer = runScript('.harness/scripts/checks/speckit-drift-check.mjs', [], {
    env: {
      ROOT_DIR: project,
      NOTICE_FILE: notice,
      PATH: `${binDir}${delimiter}${process.env.PATH}`,
    },
  });
  assert.equal(newer.status, 0, newer.stderr + newer.stdout);
  assert.match(readFileSync(notice, 'utf8'), /speckit 새 릴리스 v0\.12\.8/);
  assert.match(readFileSync(notice, 'utf8'), /vendored: v0\.12\.7/);

  writeFileSync(
    join(project, '.harness/vendor/speckit/VENDOR-INFO.json'),
    `${JSON.stringify({ speckit_version: 'v0.12.8' }, null, 2)}\n`,
  );
  writeFileSync(notice, '');
  const current = runScript('.harness/scripts/checks/speckit-drift-check.mjs', [], {
    env: {
      ROOT_DIR: project,
      NOTICE_FILE: notice,
      PATH: `${binDir}${delimiter}${process.env.PATH}`,
    },
  });
  assert.equal(current.status, 0, current.stderr + current.stdout);
  assert.equal(readFileSync(notice, 'utf8'), '');
});

test('Spec Kit runtime state stays project-owned while vendored assets are shared', () => {
  const specifyState = spawnSync(
    process.execPath,
    [join(root, '.harness/scripts/setup/project-owned.mjs'), '--check', '.specify/templates/spec-template.md'],
    { cwd: root, encoding: 'utf8' },
  );
  assert.equal(specifyState.status, 0, specifyState.stderr);

  const vendoredAsset = spawnSync(
    process.execPath,
    [
      join(root, '.harness/scripts/setup/project-owned.mjs'),
      '--check',
      '.harness/vendor/speckit/VENDOR-INFO.json',
    ],
    { cwd: root, encoding: 'utf8' },
  );
  assert.equal(vendoredAsset.status, 1, vendoredAsset.stderr);

  const manifest = readJson(join(root, '.harness/shared-manifest.json'));
  assert.ok(
    manifest.files.includes('.harness/vendor/speckit/VENDOR-INFO.json'),
    'vendored Spec Kit stamp must be distributed as shared harness state',
  );
  assert.ok(
    !manifest.files.includes('.specify/templates/spec-template.md'),
    'Spec Kit runtime placement must remain project-owned',
  );
});
