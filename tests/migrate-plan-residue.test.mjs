// migrate-plan 잔재 포착 회귀 (specs/015 T002, 갭 3·4).
// 실측 근거: codi-crew 의 .harness/vendor 디렉터리-자체-링크,
// codi-account 의 .claude/skills/*·.agents/skills/* 추적분 (2026-07-30).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  computeRemovals,
  CONSUMER_LINK_ROOTS,
  CONSUMER_LINK_PATHS,
} from '../.harness/scripts/pkg/migrate-plan.mjs';

const MANIFEST = [
  '.harness/config/sitemap-schema.json',
  '.harness/skills/codi-backend/SKILL.md',
  'CONTRIBUTING.md',
];

test('갭 4: SHARED_DIR_ROOTS 디렉터리 자체가 추적되면(링크 커밋) 제거 대상이다', () => {
  const removals = computeRemovals({
    manifestFiles: MANIFEST,
    trackedFiles: ['.harness/vendor', 'harness', 'app/own.txt'],
  });
  assert.ok(
    removals.includes('.harness/vendor'),
    `.harness/vendor 이 제거 목록에 없음: ${JSON.stringify(removals)}`,
  );
});

test('갭 3: 소비 측 스킬 링크·실파일 추적분은 제거 대상이다', () => {
  const tracked = [
    '.claude/skills/codi-backend',
    '.claude/skills/_shared',
    '.claude/skills/speckit-analyze/SKILL.md',
    '.agents/skills/codi-backend',
    '.claude/rules/shared',
  ];
  const removals = computeRemovals({
    manifestFiles: MANIFEST,
    trackedFiles: tracked,
  });
  for (const path of tracked) {
    assert.ok(removals.includes(path), `${path} 이 제거 목록에 없음`);
  }
});

test('갭 3: 소비 측 링크 목록이 export 되어 회수·감사가 공유한다', () => {
  assert.ok(Array.isArray(CONSUMER_LINK_ROOTS) && CONSUMER_LINK_ROOTS.length > 0);
  assert.ok(Array.isArray(CONSUMER_LINK_PATHS) && CONSUMER_LINK_PATHS.length > 0);
});

test('보존: project-owned 와 KEEP_COMMITTED 는 여전히 제거되지 않는다', () => {
  const removals = computeRemovals({
    manifestFiles: MANIFEST,
    trackedFiles: [
      'harness',
      'AGENTS.md',
      '.harness/skills-local/my-skill/SKILL.md',
      '.harness/config/project-profile.yaml',
      'app/own.txt',
      'README.md',
    ],
  });
  assert.deepEqual(removals, []);
});
