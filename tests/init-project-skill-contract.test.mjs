import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// 019 US1/US2: init-project 스킬 계약 — 신규 프로젝트 경로에서 git 히스토리
// 재시작이 질문 계약에 있어야 하고, 실행 명령은 정본 CLI 호출뿐이어야 한다.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL_DIR = join(ROOT, '.harness', 'skills', 'init-project');
const skill = readFileSync(join(SKILL_DIR, 'SKILL.md'), 'utf8');
const flow = readFileSync(join(SKILL_DIR, 'references', 'flow.md'), 'utf8');

test('Workflow 1단계 질문에 git 히스토리 재시작이 포함된다', () => {
  const workflow = skill.split('## Workflow')[1]?.split('## ')[0] ?? '';
  assert.match(
    workflow,
    /git 히스토리|git history/i,
    'Workflow 1단계 필수 질문에 git 히스토리 재시작 여부가 없다',
  );
  assert.match(workflow, /--reset-git/, 'Workflow에 --reset-git 언급이 없다');
});

test('Commands 절에 신규 경로 표준 호출(--reset-git 포함)이 있다', () => {
  const commands = skill.split('## Commands')[1] ?? '';
  assert.match(
    commands,
    /init-project[^\n]*--reset-git/,
    'Commands 절의 신규 프로젝트 표준 호출에 --reset-git이 없다',
  );
});

test('스킬 문서는 정본 CLI만 실행하고 직접 git 히스토리 조작이 없다 (US2)', () => {
  // 초기화 로직이 스킬 쪽에 갈라지면 CLI와 결과가 달라진다 — 히스토리
  // 수술 명령이 문서에 등장하면 정본(--reset-git 내부 처리) 우회다.
  for (const [name, text] of [['SKILL.md', skill], ['flow.md', flow]]) {
    for (const forbidden of [/\bgit init\b/, /--orphan\b/, /rm -rf \.git\b/]) {
      assert.doesNotMatch(
        text,
        forbidden,
        `${name}에 직접 git 히스토리 조작(${forbidden})이 있다 — 정본 CLI로 수렴 필요`,
      );
    }
  }
});
