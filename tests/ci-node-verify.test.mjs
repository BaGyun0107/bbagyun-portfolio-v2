// ci-node-verify.sh 설치 격리 회귀 테스트.
// 배경: npm --prefix 는 패키지 해석 위치만 바꾸고 cwd 를 옮기지 않아, 루트
// 검증이 먼저 만든 루트 node_modules/lockfile 컨텍스트와 앱 검증이 섞여
// 다운스트림 CI 의 `npm ci` 가 EUSAGE 로 실패했다. 설치는 반드시 대상
// 디렉터리로 cd 해서 실행돼야 한다 (maybe_prisma_generate 와 동일 규칙).
// 전략: npm/pnpm 을 스텁으로 바꿔 "어느 cwd 에서 어떤 인자로 불렀는지"만
// 기록·검증한다 — 네트워크/실설치 없이 호출 계약을 고정한다.
import { tmp, write } from './helpers/fixture-base.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { chmodSync, realpathSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(root, '.harness/scripts/checks/ci-node-verify.sh');

function makeStubBin(logPath) {
  const bin = tmp('codi-node-verify-bin-');
  for (const name of ['npm', 'pnpm']) {
    const path = join(bin, name);
    writeFileSync(path, `#!/bin/sh\necho "${name}|$(pwd -P)|$*" >> "${logPath}"\nexit 0\n`);
    chmodSync(path, 0o755);
  }
  return bin;
}

function runVerify(fixture, logPath) {
  return spawnSync('bash', [SCRIPT], {
    cwd: fixture,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${makeStubBin(logPath)}${delimiter}${process.env.PATH}`,
    },
  });
}

// 다운스트림 재현 픽스처: 루트 package.json(도구 전용, lockfile 없음) +
// apps/front(자체 package.json + package-lock.json 보유).
test('npm: 앱 설치는 앱 디렉터리를 cwd 로 하여 npm ci 로 실행된다', () => {
  const fixture = tmp('codi-node-verify-fix-');
  write(
    fixture,
    'package.json',
    JSON.stringify({ name: 'repo-tools', devDependencies: { husky: '^9.0.0' } }),
  );
  write(
    fixture,
    'apps/front/package.json',
    JSON.stringify({ name: 'front', dependencies: { react: '^18.0.0' } }),
  );
  write(fixture, 'apps/front/package-lock.json', '{}');
  const logPath = join(fixture, 'calls.log');

  const result = runVerify(fixture, logPath);
  assert.equal(result.status, 0, result.stderr);

  const npmCalls = calls(logPath).filter((c) => c.bin === 'npm');
  assert.equal(npmCalls.length, 2, JSON.stringify(npmCalls));

  // 루트: lockfile 이 없으므로 npm install, cwd 는 루트.
  assert.equal(npmCalls[0].cwd, realpathSync(fixture));
  assert.equal(npmCalls[0].args, 'install --ignore-scripts');

  // 앱: 자기 lockfile 로 npm ci, cwd 는 앱 디렉터리 — --prefix 금지.
  assert.equal(npmCalls[1].cwd, realpathSync(join(fixture, 'apps/front')));
  assert.equal(npmCalls[1].args, 'ci --ignore-scripts');
});

// 앱에 lockfile 이 없으면 상위(루트) lockfile 을 근거로 npm ci 를 돌리면
// 안 된다 — npm 은 workspace 선언 없이 상위 lockfile 을 쓰지 않는다
// (monorepo-packages: 각 앱이 자체 lockfile 을 소유).
test('npm: 앱 lockfile 부재 시 루트 lockfile 을 잡아 ci 로 승격하지 않는다', () => {
  const fixture = tmp('codi-node-verify-fix-');
  write(
    fixture,
    'package.json',
    JSON.stringify({ name: 'repo-tools', devDependencies: { husky: '^9.0.0' } }),
  );
  write(fixture, 'package-lock.json', '{}');
  write(
    fixture,
    'apps/front/package.json',
    JSON.stringify({ name: 'front', dependencies: { react: '^18.0.0' } }),
  );
  const logPath = join(fixture, 'calls.log');

  const result = runVerify(fixture, logPath);
  assert.equal(result.status, 0, result.stderr);

  const npmCalls = calls(logPath).filter((c) => c.bin === 'npm');
  assert.equal(npmCalls.length, 2, JSON.stringify(npmCalls));
  assert.equal(npmCalls[0].args, 'ci --ignore-scripts');
  assert.equal(npmCalls[1].cwd, realpathSync(join(fixture, 'apps/front')));
  assert.equal(npmCalls[1].args, 'install --ignore-scripts');
});

test('pnpm: 앱 설치는 앱 디렉터리를 cwd 로 하여 frozen-lockfile 로 실행된다', () => {
  const fixture = tmp('codi-node-verify-fix-');
  write(fixture, 'package.json', JSON.stringify({ name: 'repo-tools' }));
  write(
    fixture,
    'apps/api/package.json',
    JSON.stringify({
      name: 'api',
      packageManager: 'pnpm@10.0.0',
      dependencies: { '@nestjs/core': '^11.0.0' },
    }),
  );
  write(fixture, 'apps/api/pnpm-lock.yaml', '');
  const logPath = join(fixture, 'calls.log');

  const result = runVerify(fixture, logPath);
  assert.equal(result.status, 0, result.stderr);

  const pnpmCalls = calls(logPath).filter((c) => c.bin === 'pnpm');
  assert.equal(pnpmCalls.length, 1, JSON.stringify(pnpmCalls));
  assert.equal(pnpmCalls[0].cwd, realpathSync(join(fixture, 'apps/api')));
  assert.equal(pnpmCalls[0].args, 'install --frozen-lockfile --ignore-scripts');
});

// pnpm workspace 멤버는 workspace 루트의 lockfile 을 공유하므로 frozen 설치가
// 맞다. 반면 workspace 밖의 상위 lockfile 은 근거가 아니다.
test('pnpm: workspace 멤버는 workspace 루트 lockfile 로 frozen 설치한다', () => {
  const fixture = tmp('codi-node-verify-fix-');
  write(
    fixture,
    'apps/api/package.json',
    JSON.stringify({ name: 'api', packageManager: 'pnpm@10.0.0' }),
  );
  write(fixture, 'apps/api/pnpm-workspace.yaml', 'packages:\n  - core\n');
  write(fixture, 'apps/api/pnpm-lock.yaml', '');
  write(
    fixture,
    'apps/api/core/package.json',
    JSON.stringify({
      name: 'api-core',
      packageManager: 'pnpm@10.0.0',
      dependencies: { '@nestjs/core': '^11.0.0' },
    }),
  );
  const logPath = join(fixture, 'calls.log');

  const result = runVerify(fixture, logPath);
  assert.equal(result.status, 0, result.stderr);

  const memberCalls = calls(logPath).filter(
    (c) => c.bin === 'pnpm' && c.cwd === realpathSync(join(fixture, 'apps/api/core')),
  );
  assert.equal(memberCalls.length, 1, JSON.stringify(calls(logPath)));
  assert.equal(memberCalls[0].args, 'install --frozen-lockfile --ignore-scripts');
});

function calls(logPath) {
  if (!existsSync(logPath)) return [];
  return readFileSync(logPath, 'utf8')
    .trim()
    .split('\n')
    .map((line) => {
      const [bin, cwd, args] = line.split('|');
      return { bin, cwd, args };
    });
}
