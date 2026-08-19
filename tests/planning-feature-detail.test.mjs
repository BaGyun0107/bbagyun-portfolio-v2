import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { scanFeatureDetails } from '../.harness/scripts/docs/lib/scan-feature-details.mjs';

const details = JSON.parse(readFileSync(new URL('../examples/community-app/planning/feature-details.json', import.meta.url)));
const catalog = JSON.parse(readFileSync(new URL('../examples/community-app/planning/feature-definitions.json', import.meta.url)));

test('rich detail readiness는 actor, goal, happy path, state와 acceptance를 검증한다', () => {
  const result = scanFeatureDetails(details, { catalog });
  assert.equal(result.byId['FEAT-FEED'].readiness.ready, true);
  assert.equal(result.byId['FEAT-SETTINGS'].readiness.ready, false);
  assert.ok(result.byId['FEAT-SETTINGS'].readiness.missing.includes('states.errorRetry'));
  assert.ok(result.health.some((issue) => issue.code === 'definition-incomplete' && issue.featureId === 'FEAT-SETTINGS'));
});

test('적용 불가 state는 명시적 사유가 있으면 누락으로 계산하지 않는다', () => {
  const result = scanFeatureDetails(details, { catalog });
  assert.equal(result.byId['FEAT-FEED'].readiness.missing.includes('states.permissionDenied'), false);
});

test('open decision은 owner와 resolveBy가 없으면 readiness를 차단한다', () => {
  const invalid = structuredClone(details[0]);
  invalid.decisions = [{ id: 'QUESTION-1', status: 'open' }];
  const result = scanFeatureDetails([invalid], { catalog: [catalog[0]] });
  assert.ok(result.byId[invalid.id].readiness.missing.includes('decisions[0].owner'));
  assert.ok(result.byId[invalid.id].readiness.missing.includes('decisions[0].resolveBy'));
});
