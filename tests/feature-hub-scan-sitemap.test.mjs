import { tmp } from './helpers/fixture-base.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanSitemap } from '../.harness/scripts/docs/lib/scan-sitemap.mjs';

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'feature-hub',
);

function withRoot(setup) {
  const root = tmp('codi-sitemap-');
  mkdirSync(join(root, 'data'), { recursive: true });
  try {
    setup?.(root);
    return { root, done: () => rmSync(root, { recursive: true, force: true }) };
  } catch (e) {
    rmSync(root, { recursive: true, force: true });
    throw e;
  }
}

test('scan: 유효 사이트맵 통과 (surface 3종/children/aliases)', () => {
  const { root, done } = withRoot((r) => {
    cpSync(join(FIXTURES, 'sitemap.valid.json'), join(r, 'data', 'sitemap.json'));
  });
  const res = scanSitemap(root);
  done();
  assert.ok(res.sitemap, 'sitemap must be returned');
  assert.equal(res.warnings.length, 0);
  assert.equal(res.sitemap.surfaces.length, 3);
  assert.equal(res.sitemap.surfaces[0].nodes[0].children[0].id, 'U1-1');
});

test('scan: 파일 부재 → null + 미정의 경고 (fail-open)', () => {
  const { root, done } = withRoot();
  const res = scanSitemap(root);
  done();
  assert.equal(res.sitemap, null);
  assert.ok(res.warnings.some((w) => w.includes('사이트맵 미정의')));
});

test('scan: 파싱 실패 → null + 경고 (fail-open)', () => {
  const { root, done } = withRoot((r) => {
    writeFileSync(join(r, 'data', 'sitemap.json'), '{ broken');
  });
  const res = scanSitemap(root);
  done();
  assert.equal(res.sitemap, null);
  assert.ok(res.warnings.length >= 1);
});

test('scan: 비표준 surface key → null + 경고 (스키마 위반)', () => {
  const { root, done } = withRoot((r) => {
    cpSync(join(FIXTURES, 'sitemap.invalid.json'), join(r, 'data', 'sitemap.json'));
  });
  const res = scanSitemap(root);
  done();
  assert.equal(res.sitemap, null);
  assert.ok(res.warnings.some((w) => w.includes('surface')));
});

function sitemapWith(nodes) {
  return JSON.stringify({
    version: 1,
    surfaces: [{ key: 'user', title: '사용자 앱', nodes }],
  });
}

test('scan: 필수 키 누락(node title 없음) → null + 경고', () => {
  const { root, done } = withRoot((r) => {
    writeFileSync(join(r, 'data', 'sitemap.json'), sitemapWith([{ id: 'U1' }]));
  });
  const res = scanSitemap(root);
  done();
  assert.equal(res.sitemap, null);
  assert.ok(res.warnings.length >= 1);
});

test('scan: node id 중복 → 경고 + 선선언 유지 (사이트맵은 유지)', () => {
  const { root, done } = withRoot((r) => {
    writeFileSync(join(r, 'data', 'sitemap.json'), sitemapWith([
      { id: 'U1', title: '먼저' },
      { id: 'U1', title: '나중' },
    ]));
  });
  const res = scanSitemap(root);
  done();
  assert.ok(res.sitemap, 'soft violation keeps sitemap');
  assert.ok(res.warnings.some((w) => w.includes('중복')));
});

test('scan: alias가 다른 노드 id와 충돌 → 경고 + 사이트맵 유지', () => {
  const { root, done } = withRoot((r) => {
    writeFileSync(join(r, 'data', 'sitemap.json'), sitemapWith([
      { id: 'U1', title: '회원' },
      { id: 'U2', title: '홈', aliases: ['U1'] },
    ]));
  });
  const res = scanSitemap(root);
  done();
  assert.ok(res.sitemap);
  assert.ok(res.warnings.some((w) => w.includes('alias')));
});
