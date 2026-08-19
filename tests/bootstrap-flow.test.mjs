// ./harness bootstrap 플로우 테스트 (specs/004-onboarding-bootstrap).
// 전략: 임시 가짜 레포 + 스텁 PATH(uname/xcode-select/mise/gh)로 격리 실행.
// 계약: specs/004-onboarding-bootstrap/contracts/bootstrap-cli.md
import { tmp } from './helpers/fixture-base.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  cpSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BOOTSTRAP_REL = '.harness/scripts/setup/bootstrap.sh';

function writeStub(dir, name, body) {
  const path = join(dir, name);
  writeFileSync(path, `#!/bin/sh\n${body}\n`);
  chmodSync(path, 0o755);
}

// 가짜 레포: 스텁 harness 런처 + 실제 bootstrap.sh 복사본
function makeFakeRepo() {
  const repo = tmp('codi-bootstrap-repo-');
  mkdirSync(join(repo, '.harness/scripts/setup'), { recursive: true });
  cpSync(join(root, BOOTSTRAP_REL), join(repo, BOOTSTRAP_REL));
  writeStub(
    repo,
    'harness',
    'echo "stub-harness $*" >> "$(cd "$(dirname "$0")" && pwd)/harness-calls.log"',
  );
  return repo;
}

// 스텁 PATH: 기본값은 "전부 정상" 환경, opts로 개별 시나리오 재정의
function makeStubBin(opts = {}) {
  const bin = tmp('codi-bootstrap-bin-');
  writeStub(bin, 'uname', `echo "${opts.os ?? 'Darwin'}"`);
  writeStub(
    bin,
    'xcode-select',
    opts.cltMissing
      ? 'if [ "$1" = "-p" ]; then exit 2; fi; echo "$@" >> "$STUB_LOG"; exit 0'
      : 'if [ "$1" = "-p" ]; then echo /Library/Developer; exit 0; fi; exit 0',
  );
  if (!opts.miseMissing) {
    writeStub(bin, 'mise', 'echo "stub-mise $*" >> "$STUB_LOG"; exit 0');
  }
  writeStub(
    bin,
    'gh',
    opts.ghUnauthenticated
      ? 'if [ "$1" = "auth" ] && [ "$2" = "status" ]; then exit 1; fi; echo "stub-gh $*" >> "$STUB_LOG"; exit 0'
      : 'echo "stub-gh $*" >> "$STUB_LOG"; exit 0',
  );
  writeStub(bin, 'curl', 'echo "stub-curl $*" >> "$STUB_LOG"; exit 0');
  writeStub(bin, 'git', 'echo "stub-git $*" >> "$STUB_LOG"; exit 0');
  if (opts.claude) {
    const listOutput = opts.claude.installed
      ? 'superpowers@claude-plugins-official 6.1.1'
      : '';
    writeStub(
      bin,
      'claude',
      [
        'echo "stub-claude $*" >> "$STUB_LOG"',
        `if [ "$1" = "plugin" ] && [ "$2" = "list" ]; then echo "${listOutput}"; fi`,
        'exit 0',
      ].join('\n'),
    );
  }
  return bin;
}

// --- US3: Superpowers 자동 준비 ---

test('US3: claude 존재 + 미설치면 plugin install 비대화식 실행', () => {
  const { result, stubLog } = runBootstrap({
    stub: { claude: { installed: false } },
  });
  assert.equal(result.status, 0);
  assert.match(
    readFileSync(stubLog, 'utf8'),
    /plugin install superpowers@claude-plugins-official/,
  );
});

test('US3: claude 부재면 수동 안내를 요약에 포함', () => {
  const { result } = runBootstrap();
  assert.equal(result.status, 0);
  assert.match(
    result.stdout,
    /\/plugin install superpowers@claude-plugins-official/,
  );
});

test('US3: 이미 설치면 중복 설치 시도 없이 확인됨', () => {
  const { result, stubLog } = runBootstrap({
    stub: { claude: { installed: true } },
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Superpowers.*확인됨/);
  assert.doesNotMatch(readFileSync(stubLog, 'utf8'), /plugin install/);
});

// --- US2: 멱등성 ---

test('US2: 완료 상태 재실행은 변경 0건 (zshrc 중복 없음)', () => {
  const repo = makeFakeRepo();
  const first = runBootstrap({ repo });
  assert.equal(first.result.status, 0);
  const zshrcPath = join(first.home, '.zshrc');
  const afterFirst = readFileSync(zshrcPath, 'utf8');

  const second = runBootstrap({ repo, home: first.home });
  assert.equal(second.result.status, 0);
  assert.equal(readFileSync(zshrcPath, 'utf8'), afterFirst);
  const markers = afterFirst.match(/codi-harness: mise activate/g) ?? [];
  assert.equal(markers.length, 1);
  assert.match(second.result.stdout, /mise 확인됨/);
});

test('US2: zshrc에 활성화 라인이 이미 있으면 append하지 않음', () => {
  const home = tmp('codi-bootstrap-home-');
  const zshrcPath = join(home, '.zshrc');
  writeFileSync(
    zshrcPath,
    '# my config\n# codi-harness: mise activate\neval "$(mise activate zsh)"\n',
  );
  const before = readFileSync(zshrcPath, 'utf8');
  const { result } = runBootstrap({ home });
  assert.equal(result.status, 0);
  assert.equal(readFileSync(zshrcPath, 'utf8'), before);
});

test('US2: 마커 없이 사용자가 직접 추가한 활성화 라인도 존중 (중복 금지)', () => {
  const home = tmp('codi-bootstrap-home-');
  const zshrcPath = join(home, '.zshrc');
  writeFileSync(
    zshrcPath,
    '# my own setup\neval "$(~/.local/bin/mise activate zsh)"\n',
  );
  const before = readFileSync(zshrcPath, 'utf8');
  const { result } = runBootstrap({ home });
  assert.equal(result.status, 0);
  assert.equal(readFileSync(zshrcPath, 'utf8'), before);
});

test('US2: gh 미인증으로 중단 후 재실행하면 이어서 완료', () => {
  const repo = makeFakeRepo();
  const first = runBootstrap({ repo, stub: { ghUnauthenticated: true } });
  assert.equal(first.result.status, 3);
  assert.equal(existsSync(join(repo, 'harness-calls.log')), false);

  const second = runBootstrap({ repo, home: first.home });
  assert.equal(second.result.status, 0);
  const calls = readFileSync(join(repo, 'harness-calls.log'), 'utf8');
  assert.match(calls, /stub-harness install/);
  assert.match(calls, /stub-harness doctor/);
  const zshrc = readFileSync(join(first.home, '.zshrc'), 'utf8');
  const markers = zshrc.match(/codi-harness: mise activate/g) ?? [];
  assert.equal(markers.length, 1);
});

// --- US1: 원클릭 온보딩 ---

test('US1: 미지원 OS는 변경 없이 exit 2', () => {
  const { result, fakeRepo, home } = runBootstrap({ stub: { os: 'Linux' } });
  assert.equal(result.status, 2);
  assert.match(result.stderr + result.stdout, /macOS/);
  assert.equal(existsSync(join(fakeRepo, 'harness-calls.log')), false);
  assert.equal(existsSync(join(home, '.zshrc')), false);
});

test('US1: --dry-run은 7단계를 순서대로 출력하고 변경 없이 exit 0', () => {
  const { result, fakeRepo } = runBootstrap({ args: ['--dry-run'] });
  assert.equal(result.status, 0);
  for (let step = 1; step <= 7; step += 1) {
    assert.match(result.stdout, new RegExp(`\\[bootstrap ${step}/7\\]`));
  }
  const order = [...result.stdout.matchAll(/\[bootstrap (\d)\/7\]/g)].map(
    (m) => Number(m[1]),
  );
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
  assert.equal(existsSync(join(fakeRepo, 'harness-calls.log')), false);
});

test('US1: Xcode CLT 부재 시 설치 유도 후 exit 3', () => {
  const { result, stubLog } = runBootstrap({ stub: { cltMissing: true } });
  assert.equal(result.status, 3);
  assert.match(result.stdout + result.stderr, /재실행/);
  assert.match(readFileSync(stubLog, 'utf8'), /--install/);
});

test('US1: gh 미인증(non-TTY)이면 로그인 안내 후 exit 3', () => {
  const { result } = runBootstrap({ stub: { ghUnauthenticated: true } });
  assert.equal(result.status, 3);
  assert.match(result.stdout + result.stderr, /gh auth login/);
});

test('US1: 전부 정상이면 install→doctor 위임 후 exit 0', () => {
  const { result, fakeRepo } = runBootstrap();
  assert.equal(result.status, 0);
  const calls = readFileSync(join(fakeRepo, 'harness-calls.log'), 'utf8');
  const installIdx = calls.indexOf('stub-harness install');
  const doctorIdx = calls.indexOf('stub-harness doctor');
  assert.ok(installIdx >= 0, 'install 위임 필요');
  assert.ok(doctorIdx > installIdx, 'doctor는 install 이후');
  assert.match(result.stdout, /\[bootstrap 7\/7\]/);
});

function runBootstrap({ args = [], stub = {}, repo, home: homeIn } = {}) {
  const fakeRepo = repo ?? makeFakeRepo();
  const bin = makeStubBin(stub);
  const home = homeIn ?? tmp('codi-bootstrap-home-');
  const stubLog = join(home, 'stub-calls.log');
  const result = spawnSync('sh', [join(fakeRepo, BOOTSTRAP_REL), ...args], {
    cwd: fakeRepo,
    encoding: 'utf8',
    env: {
      PATH: `${bin}:/usr/bin:/bin`,
      HOME: home,
      STUB_LOG: stubLog,
      SHELL: '/bin/zsh',
    },
  });
  return { result, fakeRepo, home, stubLog };
}
