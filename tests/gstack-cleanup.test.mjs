import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// 팀원 머신의 전역 gstack 잔재 정리 명령 (018 후속). check 기본, --apply 삭제,
// --quiet 는 잔존 여부를 종료 코드로만 보고(doctor 연동). 이름이 같아도
// gstack 소유 증거(심링크/마커)가 없는 스킬은 절대 지우지 않는다.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(ROOT, '.harness', 'scripts', 'setup', 'gstack-cleanup.sh');

function fixture() {
  const base = mkdtempSync(join(tmpdir(), 'gstack-cleanup-'));
  const claude = join(base, 'claude-skills');
  const codex = join(base, 'codex-skills');
  const home = join(base, 'gstack-home');

  // gstack 중앙 디렉터리 + 마커 있는 스킬 + 심링크형 스킬
  mkdirSync(join(claude, 'gstack'), { recursive: true });
  writeFileSync(join(claude, 'gstack', 'SKILL.md'), 'Router for the gstack suite');
  mkdirSync(join(claude, 'browse'), { recursive: true });
  writeFileSync(join(claude, 'browse', 'SKILL.md'), 'preamble: ~/.claude/skills/gstack/bin/gstack-config');
  mkdirSync(join(claude, 'make-pdf'), { recursive: true });
  symlinkSync(join(claude, 'gstack', 'make-pdf', 'SKILL.md'), join(claude, 'make-pdf', 'SKILL.md'));
  // 로스터와 이름이 같지만 gstack 소유 증거가 없는 사용자 스킬 — 보존 대상
  mkdirSync(join(claude, 'spec'), { recursive: true });
  writeFileSync(join(claude, 'spec', 'SKILL.md'), 'my own custom spec skill');

  mkdirSync(join(codex, 'gstack-browse'), { recursive: true });
  writeFileSync(join(codex, 'gstack-browse', 'SKILL.md'), 'x');
  mkdirSync(join(codex, 'brainstorming'), { recursive: true });
  writeFileSync(join(codex, 'brainstorming', 'SKILL.md'), 'superpowers');

  mkdirSync(home, { recursive: true });
  writeFileSync(join(home, 'learnings.jsonl'), '{}');

  // 사용자 설정의 고아 훅 — 디렉터리를 지워도 남는 잔재 클래스
  // (2026-08-07 실측: SessionStart 훅이 삭제된 gstack 바이너리를 참조).
  const settings = join(base, 'settings.json');
  writeFileSync(
    settings,
    JSON.stringify({
      hooks: {
        SessionStart: [
          {
            hooks: [
              {
                type: 'command',
                command: join(claude, 'gstack', 'bin', 'gstack-session-update'),
              },
            ],
          },
        ],
      },
    }),
  );

  const env = {
    ...process.env,
    GSTACK_CLEANUP_CLAUDE_SKILLS: claude,
    GSTACK_CLEANUP_CODEX_SKILLS: codex,
    GSTACK_CLEANUP_HOME: home,
    GSTACK_CLEANUP_CLAUDE_SETTINGS: settings,
  };
  return { claude, codex, home, settings, env };
}

function run(env, args = []) {
  try {
    const stdout = execFileSync('sh', [SCRIPT, ...args], { encoding: 'utf8', env });
    return { status: 0, stdout };
  } catch (err) {
    return { status: err.status, stdout: (err.stdout ?? '').toString() };
  }
}

test('스크립트가 존재하고 문법이 유효하다', () => {
  assert.ok(existsSync(SCRIPT), 'gstack-cleanup.sh 부재');
  execFileSync('sh', ['-n', SCRIPT]);
});

test('check 기본 모드: 대상을 나열하고 아무것도 지우지 않는다', () => {
  const { claude, env } = fixture();
  const r = run(env);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /gstack\b/);
  assert.match(r.stdout, /browse/);
  assert.match(r.stdout, /--apply/);
  assert.ok(existsSync(join(claude, 'gstack')), 'check 모드가 삭제를 수행함');
  assert.ok(existsSync(join(claude, 'browse')));
});

test('--apply: gstack 소유만 삭제하고 동명 사용자 스킬·superpowers는 보존한다', () => {
  const { claude, codex, home, env } = fixture();
  const r = run(env, ['--apply']);
  assert.equal(r.status, 0, r.stdout);
  assert.ok(!existsSync(join(claude, 'gstack')));
  assert.ok(!existsSync(join(claude, 'browse')));
  assert.ok(!existsSync(join(claude, 'make-pdf')));
  assert.ok(!existsSync(home), '~/.gstack 상당 디렉터리가 남음');
  assert.ok(!existsSync(join(codex, 'gstack-browse')));
  assert.ok(existsSync(join(codex, 'brainstorming')), 'superpowers 스킬이 삭제됨');
  assert.ok(existsSync(join(claude, 'spec')), '증거 없는 동명 스킬이 삭제됨');
  assert.match(r.stdout, /spec/, '건너뛴 항목 보고 누락');
});

test('--quiet: 잔존 있으면 1, 전부 정리된 뒤에만 0', () => {
  const { settings, env } = fixture();
  assert.equal(run(env, ['--quiet']).status, 1);
  run(env, ['--apply']);
  // 디렉터리를 지워도 설정 훅 잔재가 남아 있으면 여전히 1
  assert.equal(run(env, ['--quiet']).status, 1);
  writeFileSync(settings, JSON.stringify({ hooks: {} }));
  assert.equal(run(env, ['--quiet']).status, 0);
});

test('설정 훅 잔재: check가 파일을 지목하고 --apply는 편집하지 않는다', () => {
  const { settings, env } = fixture();
  const checked = run(env);
  assert.match(checked.stdout, /settings\.json/, 'check가 설정 파일을 지목하지 않음');
  assert.match(checked.stdout, /훅/, '수동 제거 안내 누락');

  const before = readFileSync(settings, 'utf8');
  const applied = run(env, ['--apply']);
  assert.equal(applied.status, 0, applied.stdout);
  assert.equal(readFileSync(settings, 'utf8'), before, '--apply가 설정 파일을 수정함');
  assert.match(applied.stdout, /settings\.json/, 'apply 후 남은 설정 잔재 안내 누락');
});
