import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const skillPath = '.harness/skills/codi-design-system/SKILL.md';
const frontendSkillPath = '.harness/skills/codi-frontend/SKILL.md';
const tailwindRulesPath = '.harness/skills/codi-frontend/resources/tailwind-rules.md';
const designRulesPath = '.harness/imported-rules/design.md';
const initFlowPath = '.harness/skills/init-project/references/flow.md';
const triggersPath = '.harness/config/skill-triggers.json';

test('design-system skill documents the standard contract and execution modes', async () => {
  const skill = await readFile(skillPath, 'utf8');

  for (const required of [
    'apps/front/src/styles/tokens.css',
    'docs/design-system.md',
    'apps/front/components/ui/',
    'Creation Mode',
    'Edit Mode',
    'Partial Recovery Mode',
    'contrast-check.mjs',
    'backend-only',
  ]) {
    assert.match(skill, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('frontend guidance uses project-owned design-system paths instead of the old package path', async () => {
  const frontendSkill = await readFile(frontendSkillPath, 'utf8');
  const tailwindRules = await readFile(tailwindRulesPath, 'utf8');

  assert.match(frontendSkill, /apps\/front\/src\/styles\/tokens\.css/);
  assert.match(frontendSkill, /docs\/design-system\.md/);
  assert.match(tailwindRules, /Project design-system priority/);
  assert.match(tailwindRules, /apps\/front\/src\/styles\/tokens\.css/);
  assert.doesNotMatch(frontendSkill, /packages\/design-tokens/);
  assert.doesNotMatch(tailwindRules, /packages\/design-tokens/);
});

test('shared design rules and init flow expose design-system priority without preloading values', async () => {
  const designRules = await readFile(designRulesPath, 'utf8');
  const initFlow = await readFile(initFlowPath, 'utf8');

  assert.match(designRules, /Project Design System Priority/);
  assert.match(designRules, /Read those files on demand/);
  assert.match(initFlow, /codi-design-system/);
});

test('skill triggers include Korean and English design-system keywords', async () => {
  const triggers = JSON.parse(await readFile(triggersPath, 'utf8'));
  const keywords = triggers['codi-design-system']?.keywords ?? [];

  for (const keyword of ['design system', 'design tokens', '브랜드 컬러', '디자인 시스템', '토큰']) {
    assert.ok(keywords.includes(keyword), `missing keyword: ${keyword}`);
  }
});
