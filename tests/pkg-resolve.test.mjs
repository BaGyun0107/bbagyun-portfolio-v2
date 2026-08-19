// lock 파싱·semver·채널 해석 (specs/005-harness-packaging T003/T004).
// 계약: data-model.md(harness.lock), research.md R1.
import { tmp } from './helpers/fixture-base.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseLock,
  compareSemver,
  parseTagList,
  resolveVersion,
} from '../.harness/scripts/pkg/resolve-version.mjs';

// --- parseLock ---

test('parseLock: 채널 형태', () => {
  const lock = parseLock('{"schema_version":1,"channel":"latest-minor"}');
  assert.deepEqual(lock, { channel: 'latest-minor' });
});

test('parseLock: 고정 버전 형태', () => {
  const lock = parseLock('{"schema_version":1,"version":"1.4.0"}');
  assert.deepEqual(lock, { version: '1.4.0' });
});

test('parseLock: channel과 version 동시 지정은 거부', () => {
  assert.throws(() =>
    parseLock('{"schema_version":1,"channel":"latest-minor","version":"1.0.0"}'),
  );
});

test('parseLock: 둘 다 없으면 거부', () => {
  assert.throws(() => parseLock('{"schema_version":1}'));
});

test('parseLock: 지원하지 않는 채널명 거부', () => {
  assert.throws(() => parseLock('{"schema_version":1,"channel":"nightly"}'));
});

test('parseLock: semver 형식 위반 거부', () => {
  assert.throws(() => parseLock('{"schema_version":1,"version":"1.4"}'));
});

test('parseLock: JSON 아님 거부', () => {
  assert.throws(() => parseLock('channel=latest-minor'));
});

test('CLI: 심링크 경유 실행에서도 동작한다 (lock 모드 필수)', () => {
  const dir = tmp('codi-symlink-cli-');
  const real = join(
    dirname(fileURLToPath(import.meta.url)),
    '../.harness/scripts/pkg/resolve-version.mjs',
  );
  const linked = join(dir, 'resolve-version.mjs');
  symlinkSync(real, linked);
  const lockPath = join(dir, 'harness.lock');
  writeFileSync(
    lockPath,
    '{"schema_version":1,"channel":"latest-minor","repo":"https://example.com/h.git"}',
  );
  const r = spawnSync(process.execPath, [linked, 'repo', lockPath], {
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), 'https://example.com/h.git');
});

test('parseLock: repo 필드는 그대로 전달', () => {
  const lock = parseLock(
    '{"schema_version":1,"channel":"latest-minor","repo":"https://example.com/h.git"}',
  );
  assert.deepEqual(lock, {
    channel: 'latest-minor',
    repo: 'https://example.com/h.git',
  });
});

// --- compareSemver ---

test('compareSemver: 자릿수 함정 포함 정렬', () => {
  assert.equal(compareSemver('1.10.0', '1.9.9'), 1);
  assert.equal(compareSemver('1.0.0', '1.0.1'), -1);
  assert.equal(compareSemver('2.0.0', '2.0.0'), 0);
});

// --- parseTagList ---

test('parseTagList: ls-remote 출력에서 v태그만 추출·중복 제거', () => {
  const out = [
    'abc1\trefs/tags/v1.0.0',
    'abc2\trefs/tags/v1.0.0^{}',
    'abc3\trefs/tags/v1.2.0',
    'abc4\trefs/tags/not-a-version',
    'abc5\trefs/tags/v2.0.0',
  ].join('\n');
  assert.deepEqual(parseTagList(out), ['1.0.0', '1.2.0', '2.0.0']);
});

// --- resolveVersion ---

const TAGS = ['1.0.0', '1.2.0', '1.2.5', '2.0.0'];

test('resolveVersion: 채널 + current 있음 → 같은 major 최신, major는 안내만', () => {
  const r = resolveVersion({
    lock: { channel: 'latest-minor' },
    tags: TAGS,
    currentVersion: '1.0.0',
  });
  assert.equal(r.target, '1.2.5');
  assert.equal(r.majorAvailable, '2.0.0');
});

test('resolveVersion: 채널 + current 없음(첫 설치) → 전체 최신', () => {
  const r = resolveVersion({ lock: { channel: 'latest-minor' }, tags: TAGS });
  assert.equal(r.target, '2.0.0');
  assert.equal(r.majorAvailable, null);
});

test('resolveVersion: 채널인데 상위 없음 → target은 current 유지', () => {
  const r = resolveVersion({
    lock: { channel: 'latest-minor' },
    tags: TAGS,
    currentVersion: '1.2.5',
  });
  assert.equal(r.target, '1.2.5');
});

test('resolveVersion: 고정 버전 존재 → 그대로', () => {
  const r = resolveVersion({ lock: { version: '1.2.0' }, tags: TAGS });
  assert.equal(r.target, '1.2.0');
});

test('resolveVersion: 고정 버전이 태그에 없으면 에러에 가용 버전 포함', () => {
  assert.throws(
    () => resolveVersion({ lock: { version: '9.9.9' }, tags: TAGS }),
    /1\.2\.5/,
  );
});
