#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const CONTRAST_PAIRS = [
  ['background', 'foreground'],
  ['card', 'card-foreground'],
  ['popover', 'popover-foreground'],
  ['primary', 'primary-foreground'],
  ['secondary', 'secondary-foreground'],
  ['muted', 'muted-foreground'],
  ['accent', 'accent-foreground'],
  ['destructive', 'destructive-foreground'],
  ['sidebar', 'sidebar-foreground'],
  ['sidebar-primary', 'sidebar-primary-foreground'],
  ['sidebar-accent', 'sidebar-accent-foreground'],
];

const REQUIRED_RATIO = 4.5;

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function parseOklch(value) {
  const match = value
    .trim()
    .match(/^oklch\(\s*([0-9.]+%?)\s+([0-9.]+)\s+([0-9.]+)(?:deg)?(?:\s*\/\s*[0-9.]+%?)?\s*\)$/i);

  if (!match) {
    throw new Error(`Unsupported color format: ${value}`);
  }

  const lightness = match[1].endsWith('%')
    ? Number.parseFloat(match[1]) / 100
    : Number.parseFloat(match[1]);

  return {
    l: lightness,
    c: Number.parseFloat(match[2]),
    h: (Number.parseFloat(match[3]) * Math.PI) / 180,
  };
}

function linearToSrgb(value) {
  const clamped = clamp(value);
  if (clamped <= 0.0031308) return 12.92 * clamped;
  return 1.055 * clamped ** (1 / 2.4) - 0.055;
}

export function oklchToSrgb(value) {
  const { l, c, h } = parseOklch(value);
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);

  const lPrime = l + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = l - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = lPrime ** 3;
  const m3 = mPrime ** 3;
  const s3 = sPrime ** 3;

  const red = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const green = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const blue = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  return {
    r: Math.round(linearToSrgb(red) * 255),
    g: Math.round(linearToSrgb(green) * 255),
    b: Math.round(linearToSrgb(blue) * 255),
  };
}

function channelLuminance(value) {
  const normalized = value / 255;
  if (normalized <= 0.04045) return normalized / 12.92;
  return ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(color) {
  return (
    0.2126 * channelLuminance(color.r) +
    0.7152 * channelLuminance(color.g) +
    0.0722 * channelLuminance(color.b)
  );
}

export function contrastRatio(foreground, background) {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

function parseBlock(css, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blockMatch = css.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`, 'm'));
  if (!blockMatch) return {};

  const tokens = {};
  const tokenPattern = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  for (const match of blockMatch[1].matchAll(tokenPattern)) {
    tokens[`--${match[1]}`] = match[2].trim();
  }
  return tokens;
}

export function parseTokens(css) {
  return {
    light: parseBlock(css, ':root'),
    dark: parseBlock(css, '.dark'),
  };
}

function allDefinedTokenNames(tokens) {
  return [...new Set([...Object.keys(tokens.light), ...Object.keys(tokens.dark)])].sort();
}

function checkCompleteness(tokens, failures) {
  for (const token of allDefinedTokenNames(tokens)) {
    for (const mode of ['light', 'dark']) {
      if (!(token in tokens[mode])) {
        failures.push({
          type: 'missing-token',
          mode,
          token,
          message: `${mode} is missing ${token}`,
        });
      }
    }
  }
}

function checkPair(tokens, mode, backgroundName, foregroundName, failures, pairs) {
  const backgroundToken = `--${backgroundName}`;
  const foregroundToken = `--${foregroundName}`;
  const background = tokens[mode][backgroundToken];
  const foreground = tokens[mode][foregroundToken];
  const pairName = `${backgroundName}/${foregroundName}`;

  if (!background || !foreground) {
    for (const token of [backgroundToken, foregroundToken]) {
      if (!tokens[mode][token]) {
        failures.push({
          type: 'missing-token',
          mode,
          token,
          pair: pairName,
          message: `${mode} is missing ${token} for ${pairName}`,
        });
      }
    }
    return;
  }

  const ratio = contrastRatio(oklchToSrgb(foreground), oklchToSrgb(background));
  const result = {
    name: pairName,
    mode,
    background: backgroundToken,
    foreground: foregroundToken,
    ratio,
    required: REQUIRED_RATIO,
    ok: ratio >= REQUIRED_RATIO,
  };

  pairs.push(result);

  if (!result.ok) {
    failures.push({
      type: 'contrast',
      ...result,
      message: `${mode} ${pairName} contrast ${ratio}:1 is below ${REQUIRED_RATIO}:1`,
    });
  }
}

export async function checkTokensFile(filePath) {
  const css = await readFile(filePath, 'utf8');
  const tokens = parseTokens(css);
  const failures = [];
  const pairs = [];

  checkCompleteness(tokens, failures);

  for (const [backgroundName, foregroundName] of CONTRAST_PAIRS) {
    const backgroundToken = `--${backgroundName}`;
    const foregroundToken = `--${foregroundName}`;
    const pairExists = ['light', 'dark'].some(
      (mode) => backgroundToken in tokens[mode] || foregroundToken in tokens[mode],
    );

    if (!pairExists) continue;

    for (const mode of ['light', 'dark']) {
      checkPair(tokens, mode, backgroundName, foregroundName, failures, pairs);
    }
  }

  return {
    ok: failures.length === 0,
    file: filePath,
    requiredRatio: REQUIRED_RATIO,
    pairs,
    failures,
  };
}

async function main(argv) {
  const filePath = argv[2];
  if (!filePath) {
    console.error('Usage: node contrast-check.mjs <tokens.css>');
    return 2;
  }

  const result = await checkTokensFile(filePath);
  console.log(JSON.stringify(result, null, 2));
  return result.ok ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv)
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 2;
    });
}
