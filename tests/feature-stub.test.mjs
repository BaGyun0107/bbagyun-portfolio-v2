import { tmp } from './helpers/fixture-base.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const STUB_SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '.harness/scripts/docs/feature-stub.mjs',
);

function withRoot(config) {
  const root = tmp('codi-stub-');
  mkdirSync(join(root, 'data'), { recursive: true });
  if (config) {
    writeFileSync(join(root, 'data', 'hub-workspaces.json'), JSON.stringify(config));
  }
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

function runStub(root, args) {
  return spawnSync('node', [STUB_SCRIPT, ...args], {
    encoding: 'utf8',
    env: { ...process.env, HUB_ROOT: root },
  });
}

const SINGLE = {
  version: 1,
  defaultWorkspaceId: 'proj',
  workspaces: [{
    id: 'proj', title: 'Proj', kind: 'downstream', root: '.',
    planningSource: 'planning', deliverySource: 'downstream',
  }],
};

test('stub 생성: draft 항목과 열린 결정이 추가된다', () => {
  const { root, done } = withRoot(SINGLE);
  const res = runStub(root, ['FEAT-X', '기능 X', '요약입니다', 'product']);
  const defs = JSON.parse(readFileSync(join(root, 'planning', 'feature-definitions.json'), 'utf8'));
  const decisions = JSON.parse(readFileSync(join(root, 'planning', 'decisions.json'), 'utf8'));
  done();

  assert.equal(res.status, 0, res.stderr);
  assert.equal(defs.length, 1);
  assert.equal(defs[0].id, 'FEAT-X');
  assert.equal(defs[0].title, '기능 X');
  assert.equal(defs[0].summary, '요약입니다');
  assert.equal(defs[0].definitionStatus, 'draft');
  assert.equal(decisions.length, 1);
  assert.equal(decisions[0].id, 'DEC-STUB-FEAT-X');
  assert.equal(decisions[0].status, 'open');
  assert.equal(decisions[0].owner, 'product');
  assert.match(res.stdout, /FEAT-X/);
  assert.match(res.stdout, /docs:build/);
});

test('stub 중복: 기존 항목을 덮어쓰지 않고 안내만 한다', () => {
  const { root, done } = withRoot(SINGLE);
  runStub(root, ['FEAT-X', '기능 X']);
  const res = runStub(root, ['FEAT-X', '다른 제목']);
  const defs = JSON.parse(readFileSync(join(root, 'planning', 'feature-definitions.json'), 'utf8'));
  const decisions = JSON.parse(readFileSync(join(root, 'planning', 'decisions.json'), 'utf8'));
  done();

  assert.equal(res.status, 0);
  assert.match(res.stdout, /이미 존재/);
  assert.equal(defs.length, 1);
  assert.equal(defs[0].title, '기능 X');
  assert.equal(decisions.length, 1);
});

test('stub 형식 검증: FEAT- 접두사가 아니면 실패한다', () => {
  const { root, done } = withRoot(SINGLE);
  const res = runStub(root, ['BAD-ID', '제목']);
  const created = existsSync(join(root, 'planning', 'feature-definitions.json'));
  done();

  assert.equal(res.status, 1);
  assert.match(res.stderr, /FEAT-/);
  assert.equal(created, false);
});

test('mise.toml에 feature:stub 태스크가 등록되어 있다', () => {
  const miseToml = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '..', 'mise.toml'),
    'utf8',
  );
  assert.match(miseToml, /\[tasks\."feature:stub"\]/);
  assert.match(miseToml, /feature-stub\.mjs/);
});

test('stub 대상 선택: demo 워크스페이스는 건너뛰고 비-demo를 쓴다', () => {
  const { root, done } = withRoot({
    version: 1,
    defaultWorkspaceId: 'demo',
    workspaces: [
      {
        id: 'demo', title: 'Demo', kind: 'demo', badge: 'DEMO DATA', root: 'examples/app',
        planningSource: 'planning', deliverySource: 'downstream',
      },
      {
        id: 'internal', title: 'Internal', kind: 'internal', root: '.',
        planningSource: 'data', deliverySource: 'specs',
      },
    ],
  });
  mkdirSync(join(root, 'examples', 'app'), { recursive: true });
  const res = runStub(root, ['FEAT-Y', '내부 기능']);
  const internalDefs = JSON.parse(readFileSync(join(root, 'data', 'feature-definitions.json'), 'utf8'));
  const demoCreated = existsSync(join(root, 'examples', 'app', 'planning', 'feature-definitions.json'));
  done();

  assert.equal(res.status, 0, res.stderr);
  assert.equal(internalDefs[0].id, 'FEAT-Y');
  assert.equal(demoCreated, false);
});
