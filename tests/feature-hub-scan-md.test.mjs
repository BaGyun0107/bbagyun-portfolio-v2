import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { scanMd } from '../.harness/scripts/docs/lib/scan-md.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIX = join(HERE, 'fixtures', 'feature-hub');

test('scan-md: 제목 있는 MD에서 첫 # 헤더를 title로 추출', () => {
  const entries = scanMd([join(FIX, 'docs')], FIX);
  const withTitle = entries.find((e) => e.path.endsWith('guide-with-title.md'));
  assert.ok(withTitle);
  assert.equal(withTitle.title, '가이드 제목');
});

test('scan-md: 제목 없는 MD는 파일명을 title로 사용', () => {
  const entries = scanMd([join(FIX, 'docs')], FIX);
  const noTitle = entries.find((e) => e.path.endsWith('no-title.md'));
  assert.ok(noTitle);
  assert.equal(noTitle.title, 'no-title');
});

test('scan-md: 발췌에서 코드블록과 마크다운 기호가 제거됨', () => {
  const entries = scanMd([join(FIX, 'docs')], FIX);
  const withTitle = entries.find((e) => e.path.endsWith('guide-with-title.md'));
  assert.ok(!withTitle.snippet.includes('shouldBeStripped'));
  assert.ok(!withTitle.snippet.includes('```'));
});

test('scan-md: 각 항목에 path/href/title/category/snippet 필드 존재', () => {
  const entries = scanMd([join(FIX, 'docs')], FIX);
  assert.ok(entries.length >= 2);
  for (const e of entries) {
    assert.ok(typeof e.path === 'string');
    assert.ok(typeof e.href === 'string');
    assert.ok(typeof e.title === 'string');
    assert.ok(typeof e.category === 'string');
    assert.ok(typeof e.snippet === 'string');
  }
});

test('scan-md: 존재하지 않는 폴더는 건너뛰고 스로우하지 않음', () => {
  const entries = scanMd([join(FIX, 'does-not-exist')], FIX);
  assert.deepEqual(entries, []);
});

test('scan-md: 빈 폴더 목록은 빈 배열 반환', () => {
  const entries = scanMd([], FIX);
  assert.deepEqual(entries, []);
});
