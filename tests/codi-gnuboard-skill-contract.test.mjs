// 021: codi-gnuboard 스킬 계약 (contracts/skill-codi-gnuboard.md).
// 선례: design-system-skill-contract.test.mjs — 저장소 파일을 직접 검증한다.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { repoRoot } from './helpers/cli-fixture.mjs';

const skillDir = join(repoRoot, '.harness', 'skills', 'codi-gnuboard');
const skillPath = join(skillDir, 'SKILL.md');
const composePath = join(skillDir, 'resources', 'docker-compose.gnuboard.yml');
const gitignorePath = join(skillDir, 'resources', 'gitignore.gnuboard');
const e2ePath = join(skillDir, 'resources', 'e2e-suite-example.sh');
const triggersPath = join(repoRoot, '.harness', 'config', 'skill-triggers.json');

test('codi-gnuboard skill structure exists with merged links', async () => {
  for (const path of [skillPath, composePath, gitignorePath, e2ePath]) {
    assert.ok(existsSync(path), `missing: ${path}`);
  }
  // skills-link 병합 결과 (양 런타임 노출)
  assert.ok(existsSync(join(repoRoot, '.claude', 'skills', 'codi-gnuboard')));
  assert.ok(existsSync(join(repoRoot, '.agents', 'skills', 'codi-gnuboard')));

  const skill = await readFile(skillPath, 'utf8');
  assert.match(skill, /^---\nname: codi-gnuboard\n/);
  assert.match(skill, /\ndescription: .+/);
});

test('SKILL.md covers structure, onboarding, docker, and e2e sections', async () => {
  const skill = await readFile(skillPath, 'utf8');

  // 1. 구조 지식 (5.6.32 기준 디렉터리 지도 + 코어 무수정 원칙)
  for (const marker of ['adm/', 'bbs/', 'shop/', 'skin/', 'extend/', 'data/', '5.6.32']) {
    assert.match(skill, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `missing structure marker: ${marker}`);
  }
  // 2. 온보딩 절차 (몰당 1레포 + apps/<mall> + 제외 목록 + 반영 경로)
  for (const marker of ['apps/<mall>', 'gitignore.gnuboard', 'rsync']) {
    assert.match(skill, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `missing onboarding marker: ${marker}`);
  }
  // 라이브 서버 직접 수정은 승인 대상
  assert.match(skill, /approval/i);
  // 3. 로컬 도커 환경 (템플릿 + 함정)
  for (const marker of ['docker-compose.gnuboard.yml', 'sql-mode', '0000-00-00', 'linux/amd64']) {
    assert.match(skill, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `missing docker marker: ${marker}`);
  }
  // 4. e2e 게이트 소유는 codi-e2e (clarify Q4)
  assert.match(skill, /codi-e2e/);
});

test('docker compose template generalizes the pilot-proven pitfalls', async () => {
  const compose = await readFile(composePath, 'utf8');

  assert.match(compose, /php:7\.4-apache/);
  assert.match(compose, /mysqli/);
  assert.match(compose, /\bgd\b/);
  assert.match(compose, /mysql:5\.7/);
  assert.match(compose, /platform:\s*linux\/amd64/);
  assert.match(compose, /--sql-mode=/);
  assert.match(compose, /healthcheck/);
  assert.match(compose, /\/repo/);
  assert.match(compose, /<mall>/);
});

test('gitignore template excludes runtime data, dumps, and env files', async () => {
  const ignore = await readFile(gitignorePath, 'utf8');

  assert.match(ignore, /apps\/\*\/data\//);
  assert.match(ignore, /\*\.sql/);
  assert.match(ignore, /\.env/);
});

test('e2e suite example follows the check-then-skip gate pattern', async () => {
  const suite = await readFile(e2ePath, 'utf8');

  assert.match(suite, /command -v docker/);
  assert.match(suite, /docker ps|\$DOCKER_BIN.*ps/);
  assert.match(suite, /skip/i);
  assert.match(suite, /exit 0/);
});

test('skill triggers include gnuboard keywords', async () => {
  const triggers = JSON.parse(await readFile(triggersPath, 'utf8'));
  const keywords = triggers['codi-gnuboard']?.keywords ?? [];

  assert.ok(keywords.length > 0, 'codi-gnuboard triggers missing');
  for (const keyword of ['그누보드', 'gnuboard', '영카트', 'php']) {
    assert.ok(keywords.includes(keyword), `missing keyword: ${keyword}`);
  }
});
