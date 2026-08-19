#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.env.ROOT_DIR || process.cwd());
const noticeFile = process.env.NOTICE_FILE || '';
const infoPath = resolve(root, '.harness/vendor/speckit/VENDOR-INFO.json');
const lockPath = resolve(root, '.harness/lock.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function versionParts(tag) {
  return tag
    .replace(/^v/, '')
    .split(/[.-]/)
    .map((part) => {
      const number = Number.parseInt(part, 10);
      return Number.isFinite(number) ? number : 0;
    });
}

function compareTags(a, b) {
  const av = versionParts(a);
  const bv = versionParts(b);
  const max = Math.max(av.length, bv.length);
  for (let i = 0; i < max; i += 1) {
    const diff = (av[i] ?? 0) - (bv[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return a.localeCompare(b);
}

if (!existsSync(infoPath)) {
  process.exit(0);
}

const info = readJson(infoPath);
const current = info.speckit_version;
if (!current) {
  process.exit(0);
}

let repo = 'https://github.com/github/spec-kit.git';
if (existsSync(lockPath)) {
  try {
    const lock = readJson(lockPath);
    repo = lock.tools?.speckit?.repo || repo;
  } catch {
    // lock 파싱 실패는 drift 알림을 조용히 건너뛰지 않도록 기본 repo로 계속한다.
  }
}
repo = `${repo.replace(/\.git$/, '')}.git`;

let output = '';
try {
  output = execFileSync('git', ['ls-remote', '--tags', '--refs', repo, 'refs/tags/v*'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
} catch {
  process.exit(0);
}

const tags = output
  .split('\n')
  .map((line) => line.trim().split(/\s+/)[1])
  .filter(Boolean)
  .map((ref) => ref.replace(/^refs\/tags\//, ''))
  .filter((tag) => /^v\d+\.\d+\.\d+/.test(tag))
  .sort(compareTags);

const latest = tags.at(-1);
if (!latest || compareTags(latest, current) <= 0) {
  process.exit(0);
}

const message = `안내: speckit 새 릴리스 ${latest} (vendored: ${current}). 올리려면 \`./harness speckit-vendor ${latest}\`\n`;
if (noticeFile) {
  appendFileSync(noticeFile, message);
} else {
  process.stdout.write(message);
}
