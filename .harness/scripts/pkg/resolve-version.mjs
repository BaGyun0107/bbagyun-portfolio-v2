// harness.lock 파싱과 semver 채널 해석 (specs/005-harness-packaging R1).
// 순수 로직 모듈 — I/O 없음. 플로우 스크립트(fetch/pin/update)가 import한다.

import { readFileSync } from "node:fs";

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;
const CHANNELS = ["latest-minor"];

export function parseLock(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("harness.lock이 JSON이 아닙니다.");
  }
  const hasChannel = data.channel !== undefined;
  const hasVersion = data.version !== undefined;
  if (hasChannel && hasVersion) {
    throw new Error("harness.lock에 channel과 version을 동시에 지정할 수 없습니다.");
  }
  if (!hasChannel && !hasVersion) {
    throw new Error("harness.lock에 channel 또는 version 중 하나가 필요합니다.");
  }
  const repoField = typeof data.repo === "string" ? { repo: data.repo } : {};
  if (hasChannel) {
    if (!CHANNELS.includes(data.channel)) {
      throw new Error(`지원하지 않는 채널입니다: ${data.channel} (지원: ${CHANNELS.join(", ")})`);
    }
    return { channel: data.channel, ...repoField };
  }
  if (typeof data.version !== "string" || !SEMVER_RE.test(data.version)) {
    throw new Error(`version은 X.Y.Z semver여야 합니다: ${data.version}`);
  }
  return { version: data.version, ...repoField };
}

export function compareSemver(a, b) {
  const pa = a.match(SEMVER_RE).slice(1).map(Number);
  const pb = b.match(SEMVER_RE).slice(1).map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) return pa[i] > pb[i] ? 1 : -1;
  }
  return 0;
}

// `git ls-remote --tags` 출력에서 vX.Y.Z 태그만 추출한다.
// annotated tag의 `^{}` dereference 라인은 중복이므로 제거된다.
export function parseTagList(output) {
  const versions = new Set();
  for (const line of output.split("\n")) {
    const m = line.match(/refs\/tags\/v(\d+\.\d+\.\d+)(\^\{\})?$/);
    if (m) versions.add(m[1]);
  }
  return [...versions].sort(compareSemver);
}

// 채널/고정 해석. 반환: { target, majorAvailable }
// - 고정: 태그 존재 검증 후 그대로.
// - 채널 latest-minor: current와 같은 major의 최신을 target으로,
//   상위 major는 majorAvailable로 안내만 한다 (FR-005).
//   current가 없으면(첫 설치) 전체 최신을 채택한다.
export function resolveVersion({ lock, tags, currentVersion = null }) {
  const sorted = [...tags].sort(compareSemver);
  if (lock.version) {
    if (!sorted.includes(lock.version)) {
      throw new Error(
        `버전 v${lock.version} 태그가 업스트림에 없습니다. 사용 가능: ${sorted.join(", ")}`,
      );
    }
    return { target: lock.version, majorAvailable: null };
  }
  if (sorted.length === 0) {
    throw new Error("업스트림에 vX.Y.Z 릴리스 태그가 없습니다.");
  }
  const latest = sorted[sorted.length - 1];
  if (!currentVersion) {
    return { target: latest, majorAvailable: null };
  }
  const currentMajor = Number(currentVersion.match(SEMVER_RE)[1]);
  const sameMajor = sorted.filter(
    (v) => Number(v.match(SEMVER_RE)[1]) === currentMajor,
  );
  const target = sameMajor.length > 0 ? sameMajor[sameMajor.length - 1] : currentVersion;
  const best = compareSemver(target, currentVersion) > 0 ? target : currentVersion;
  const majorAvailable =
    Number(latest.match(SEMVER_RE)[1]) > currentMajor ? latest : null;
  return { target: best, majorAvailable };
}

// CLI 모드 — pkg-sync.sh 등 셸 플로우가 사용한다.
//   node resolve-version.mjs repo <lockPath>
//     → lock의 repo URL 출력 (없으면 exit 1)
//   node resolve-version.mjs resolve <lockPath> <currentVersion|->
//     → stdin으로 `git ls-remote --tags` 출력을 받아 "<target> <major|->" 출력
//   node resolve-version.mjs rewrite <lockPath> <version X.Y.Z | channel <name>>
//     → schema_version과 repo를 보존하며 lock을 재작성
// 심링크 경유 실행(lock 모드 레포의 .harness/scripts 링크)에서도 main 판정이
// 되도록 realpath로 비교한다 — 단순 URL 비교는 물리/논리 경로가 갈려 조용히
// no-op이 된다 (codi-crew 리허설 실증).
const isMain = await (async () => {
  try {
    const { realpathSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    return (
      realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
})();

if (isMain) {
  const [cmd, lockPath, current, extra] = process.argv.slice(2);
  try {
    if (cmd === "rewrite") {
      const { writeFileSync } = await import("node:fs");
      const raw = JSON.parse(readFileSync(lockPath, "utf8"));
      const next = { schema_version: raw.schema_version ?? 1 };
      if (current === "channel") {
        if (!CHANNELS.includes(extra)) throw new Error(`지원하지 않는 채널: ${extra}`);
        next.channel = extra;
      } else {
        if (!SEMVER_RE.test(current ?? "")) {
          process.stderr.write(`version은 X.Y.Z semver여야 합니다: ${current}\n`);
          process.exit(2);
        }
        next.version = current;
      }
      if (typeof raw.repo === "string") next.repo = raw.repo;
      writeFileSync(lockPath, `${JSON.stringify(next, null, 2)}\n`);
      process.exit(0);
    }
    const lock = parseLock(readFileSync(lockPath, "utf8"));
    if (cmd === "repo") {
      if (!lock.repo) {
        process.stderr.write("harness.lock에 repo 필드가 없습니다.\n");
        process.exit(1);
      }
      process.stdout.write(`${lock.repo}\n`);
    } else if (cmd === "latest") {
      // stdin의 태그 목록에서 전체 최신을 출력 (update --major 용)
      const tags = parseTagList(readFileSync(0, "utf8"));
      if (tags.length === 0) throw new Error("업스트림에 vX.Y.Z 릴리스 태그가 없습니다.");
      process.stdout.write(`${tags[tags.length - 1]}\n`);
    } else if (cmd === "resolve") {
      const tags = parseTagList(readFileSync(0, "utf8"));
      const r = resolveVersion({
        lock,
        tags,
        currentVersion: current === "-" ? null : current,
      });
      process.stdout.write(`${r.target} ${r.majorAvailable ?? "-"}\n`);
    } else {
      process.stderr.write(`알 수 없는 명령: ${cmd}\n`);
      process.exit(2);
    }
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  }
}
