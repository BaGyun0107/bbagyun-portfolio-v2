import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const skillPath = '.harness/skills/codi-feature-definition-normalizer/SKILL.md';
const triggerPath = '.harness/config/skill-triggers.json';

test('feature-definition normalizer skill exists with trigger-focused metadata', () => {
  assert.equal(existsSync(join(root, skillPath)), true);
  const skill = readFileSync(join(root, skillPath), 'utf8');

  assert.match(skill, /^---\nname: codi-feature-definition-normalizer/m);
  assert.match(skill, /CSV, Markdown, HTML/);
  assert.match(skill, /기능정의서/);
  assert.match(skill, /Do not use when authoring definitions from scratch/);
  assert.match(skill, /codi-feature-definition-authoring/);
});

test('feature-definition normalizer documents the canonical row contract', () => {
  const skill = readFileSync(join(root, skillPath), 'utf8');
  assert.match(skill, /\.harness\/config\/feature-definition-schema\.json/);

  for (const field of [
    'Row_ID',
    'Title',
    'Phase_Suggestion',
    'Status',
    'Decision_Level',
    'Change_Type',
    'Change_Summary',
    'Why',
    'Used_In',
    'Admin_Dependency',
    'Policy_Dependency',
    'Decision_Question',
    'Source',
  ]) {
    assert.match(skill, new RegExp(`\\b${field}\\b`), `${field} must be documented`);
  }

  for (const header of [
    'Row ID',
    '기능',
    'Phase',
    '처리/검토',
    '변경',
    '정의 요약',
    '연결 화면',
    '운영/정책 체크',
  ]) {
    assert.match(skill, new RegExp(header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('normalizer는 사이트맵 선행 0단계를 문서화한다', () => {
  const skill = readFileSync(join(root, skillPath), 'utf8');
  // 소스에서 사이트맵 초안 → 사용자 확인 → 저장 → Area 정규화
  assert.match(skill, /사이트맵/);
  assert.match(skill, /data\/sitemap\.json/);
  assert.match(skill, /0단계|Step 0|사이트맵 선행/);
});

test('feature-hub 스킬은 사이트맵 소유권과 힌트 규칙을 문서화한다', () => {
  const hubSkill = readFileSync(
    join(root, '.harness/skills/codi-feature-hub/SKILL.md'),
    'utf8',
  );
  assert.match(hubSkill, /data\/sitemap\.json/);
  assert.match(hubSkill, /sitemap-schema\.json/);
  // human ownership (not generated) + fail-open projection
  assert.match(hubSkill, /human-owned/i);
  assert.match(hubSkill, /fail-open/i);
});

test('feature-hub 스킬은 relation·flow 원본 소유권과 fail-open 계약을 문서화한다', () => {
  const hubSkill = readFileSync(
    join(root, '.harness/skills/codi-feature-hub/SKILL.md'),
    'utf8',
  );
  assert.match(hubSkill, /data\/feature-relations\.json/);
  assert.match(hubSkill, /traceability-schema\.json/);
  assert.match(hubSkill, /data\/user-flows\.json/);
  assert.match(hubSkill, /user-flow-schema\.json/);
  assert.match(hubSkill, /human-owned/i);
  assert.match(hubSkill, /fail-open/i);
});

test('feature-hub 스킬은 durable evidence 기반 done 규칙을 문서화한다', () => {
  const hubSkill = readFileSync(
    join(root, '.harness/skills/codi-feature-hub/SKILL.md'),
    'utf8',
  );
  assert.match(hubSkill, /tasks\.md/);
  assert.match(hubSkill, /verification\.md/);
  assert.match(hubSkill, /zero open\s+decisions/i);
  assert.match(hubSkill, /in-review.*done|done.*전이/s);
  assert.doesNotMatch(hubSkill, /e2e 증거가 신선.*done/);
});

test('feature-hub skill documents the split generated page-set contract', () => {
  const hubSkill = readFileSync(
    join(root, '.harness/skills/codi-feature-hub/SKILL.md'),
    'utf8',
  );

  for (const path of [
    'docs/index.html',
    'docs/planning.html',
    '.harness/scripts/docs/build-hub.mjs',
    '.harness/scripts/docs/lib/render-docs-page.mjs',
    '.harness/scripts/docs/lib/render-planning-page.mjs',
    '.harness/scripts/docs/planning-check.mjs',
    '.harness/hooks/docs-build-on-stop.mjs',
  ]) {
    assert.match(hubSkill, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(hubSkill, /documentsHtml/);
  assert.match(hubSkill, /planningHtml/);
  assert.match(hubSkill, /no-write/i);
  assert.match(hubSkill, /transaction|staged|rollback/i);
});

test('feature-definition normalizer is connected to triggers and feature hub docs', () => {
  const triggers = JSON.parse(readFileSync(join(root, triggerPath), 'utf8'));
  const keywords = triggers['codi-feature-definition-normalizer']?.keywords ?? [];
  assert.ok(keywords.includes('기능정의 정규화'));
  assert.ok(keywords.includes('HTML 기능정의'));

  const hubSkill = readFileSync(
    join(root, '.harness/skills/codi-feature-hub/SKILL.md'),
    'utf8',
  );
  assert.match(hubSkill, /codi-feature-definition-normalizer/);

  const skillsGuide = readFileSync(join(root, '.harness/docs/skills-guide.md'), 'utf8');
  assert.match(skillsGuide, /codi-feature-definition-normalizer/);

  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  assert.match(readme, /codi-feature-definition-normalizer/);
});
