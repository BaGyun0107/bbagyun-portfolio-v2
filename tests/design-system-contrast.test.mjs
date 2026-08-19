import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { tmp } from './helpers/fixture-base.mjs';

const scriptPath = path.resolve(
  '.harness/skills/codi-design-system/resources/contrast-check.mjs',
);

async function writeTokens(css) {
  const dir = tmp('design-system-contrast-');
  const file = path.join(dir, 'tokens.css');
  await writeFile(file, css);
  return file;
}

test('contrast: 검정/흰색 쌍은 21:1 대비로 AA를 통과한다', async () => {
  const { checkTokensFile, contrastRatio } = await import(scriptPath);
  const ratio = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });

  assert.equal(ratio, 21);

  const tokensFile = await writeTokens(`
    :root {
      --background: oklch(100% 0 0);
      --foreground: oklch(0% 0 0);
      --primary: oklch(0% 0 0);
      --primary-foreground: oklch(100% 0 0);
    }
    .dark {
      --background: oklch(0% 0 0);
      --foreground: oklch(100% 0 0);
      --primary: oklch(100% 0 0);
      --primary-foreground: oklch(0% 0 0);
    }
  `);

  const result = await checkTokensFile(tokensFile);

  assert.equal(result.ok, true);
  assert.equal(result.failures.length, 0);
  assert.equal(result.pairs.find((pair) => pair.name === 'background/foreground').ratio, 21);
});

test('contrast: OKLCH 색상은 sRGB로 변환된다', async () => {
  const { oklchToSrgb } = await import(scriptPath);

  assert.deepEqual(oklchToSrgb('oklch(100% 0 0)'), { r: 255, g: 255, b: 255 });
  assert.deepEqual(oklchToSrgb('oklch(0% 0 0)'), { r: 0, g: 0, b: 0 });
});

test('contrast: 4.5:1 미만 전경/배경 쌍은 실패로 판정한다', async () => {
  const { checkTokensFile } = await import(scriptPath);
  const tokensFile = await writeTokens(`
    :root {
      --background: oklch(100% 0 0);
      --foreground: oklch(80% 0 0);
      --primary: oklch(70% 0 0);
      --primary-foreground: oklch(85% 0 0);
    }
    .dark {
      --background: oklch(0% 0 0);
      --foreground: oklch(100% 0 0);
      --primary: oklch(100% 0 0);
      --primary-foreground: oklch(0% 0 0);
    }
  `);

  const result = await checkTokensFile(tokensFile);

  assert.equal(result.ok, false);
  assert.ok(result.failures.some((failure) => failure.name === 'background/foreground'));
  assert.ok(result.failures.every((failure) => failure.ratio < failure.required));
});

test('contrast: .dark에 대응 토큰이 없으면 실패로 판정한다', async () => {
  const { checkTokensFile } = await import(scriptPath);
  const tokensFile = await writeTokens(`
    :root {
      --background: oklch(100% 0 0);
      --foreground: oklch(0% 0 0);
      --primary: oklch(0% 0 0);
      --primary-foreground: oklch(100% 0 0);
    }
    .dark {
      --background: oklch(0% 0 0);
      --foreground: oklch(100% 0 0);
    }
  `);

  const result = await checkTokensFile(tokensFile);

  assert.equal(result.ok, false);
  assert.ok(
    result.failures.some(
      (failure) => failure.type === 'missing-token' && failure.token === '--primary',
    ),
  );
  assert.ok(
    result.failures.some(
      (failure) => failure.type === 'missing-token' && failure.token === '--primary-foreground',
    ),
  );
});
