#!/usr/bin/env node
// .harness/config/required-gitignore.json에 정의된 항목을 다운스트림
// .gitignore에 idempotent하게 반영한다. .gitignore는 project-owned이므로
// 하네스는 두 가지 통제 surface만 건드린다:
//
//   1. entries      : 누락된 단일 라인을 append한다. 같은 pattern이 다른
//                     형태로 이미 있으면(예: dist vs /dist) 추가하지 않는다.
//   2. managedBlocks: 마커 주석으로 감싼 하네스 소유 영역. 마커 사이 내용을
//                     `lines`로 교체하고(없으면 파일 끝에 추가), `neutralize`
//                     패턴이 블록 "밖"에 bare 라인으로 있으면 주석 처리한다.
//
// 마커 밖, 그리고 required가 아닌 라인은 project-owned이므로 절대 손대지 않는다.
//
// 환경변수:
//   ROOT_DIR  대상 프로젝트 루트 (필수)
//
// 종료 코드:
//   0  성공 (변경 여부와 무관)
//   1  치명적 오류 (설정 파일 누락, 파싱 실패 등)
//
// stdout: 적용된 변경을 한 줄씩 출력. 변경이 없으면 비어 있다.
import { readFileSync, writeFileSync, existsSync, lstatSync } from "node:fs";
import { join } from "node:path";

const root = process.env.ROOT_DIR;
if (!root) {
  console.error("ROOT_DIR must be set");
  process.exit(1);
}

const configPath = join(root, ".harness/config/required-gitignore.json");
if (!existsSync(configPath)) {
  // 설정 파일이 없으면 보장할 것도 없으므로 정상 종료한다.
  process.exit(0);
}

let config;
try {
  config = JSON.parse(readFileSync(configPath, "utf8"));
} catch (error) {
  console.error(`Failed to parse ${configPath}: ${error.message}`);
  process.exit(1);
}

if (!config || typeof config !== "object") {
  process.exit(0);
}

// entries 는 간결하게 문자열도 허용한다 — lockModeEntries 와 같은 정규화.
const entries = (Array.isArray(config.entries) ? config.entries : []).map((e) =>
  typeof e === "string" ? { pattern: e } : e,
);
// lock 모드(specs/006) 전용 항목 — materialize 생성물(심링크) 무시.
// harness.lock이 있는 레포에만 적용해 업스트림 하네스 레포의 tracked 경로
// (.harness/policies 등)가 upstream .gitignore에 오르는 사고를 막는다.
if (
  existsSync(join(root, "harness.lock")) &&
  Array.isArray(config.lockModeEntries)
) {
  // lockModeEntries는 문자열 또는 {pattern, real} 객체를 허용하고 여기서
  // 객체 형식으로 정규화한다.
  // 문자열 항목은 아직 실파일/실디렉토리인 경로를 제외한다: lock 생성 후
  // migrate 완료 전에 이 스크립트가 돌면(예: 그 사이의 ./harness update)
  // 공유 복사본이 ignore 되어 git rm이 지우지 못하고, 실디렉토리가 링크
  // 자리를 막아 "실파일 보존" 경고와 함께 혼합 상태가 된다. 심링크가 된
  // 뒤(=materialize 완료) 등재된다.
  // real:true 항목은 이 가드를 명시적으로 푼다 — .specify 벤더 경로처럼
  // install 이 만드는 실디렉터리는 영원히 심링크가 되지 않기 때문이다
  // (specs/015 rollout-record 후속 3).
  entries.push(
    ...config.lockModeEntries
      .map((e) => (typeof e === "string" ? { pattern: e } : e))
      .filter((e) => e && typeof e.pattern === "string")
      .filter((e) => {
        if (e.real === true) return true;
        try {
          return lstatSync(join(root, e.pattern)).isSymbolicLink();
        } catch {
          return true; // 아직 없는 경로는 등재해 둔다 (생성 시 심링크가 된다)
        }
      }),
  );
}
const managedBlocks = Array.isArray(config.managedBlocks)
  ? config.managedBlocks
  : [];

if (entries.length === 0 && managedBlocks.length === 0) {
  process.exit(0);
}

const gitignorePath = join(root, ".gitignore");
let existing = "";
if (existsSync(gitignorePath)) {
  existing = readFileSync(gitignorePath, "utf8");
}

const changes = [];

// leading slash 변형은 같은 패턴으로 본다(예: `/dist`와 `dist`). 비교 시
// trailing slash 와 `/*`, `/**` glob 꼬리도 떼어 같은 디렉터리 무시로 본다.
function normalizePattern(line) {
  let s = line.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  s = s.replace(/\/\*\*?$/, "");
  return s;
}

// ── managed 블록 처리 ──────────────────────────────────────────────
// 마커 사이를 lines로 교체하고, neutralize 패턴을 블록 밖에서 주석 처리한다.
// 줄 배열로 다루어 마커 밖 내용을 보존한다.
function applyManagedBlock(text, block) {
  const headerLine = block.header;
  const footerLine = block.footer;
  const bodyLines = Array.isArray(block.lines) ? block.lines : [];
  const neutralize = Array.isArray(block.neutralize) ? block.neutralize : [];
  if (typeof headerLine !== "string" || typeof footerLine !== "string") {
    return { text, changed: false };
  }

  let lines = text.length === 0 ? [] : text.replace(/\n$/, "").split("\n");
  let changed = false;

  // 블록 경계를 찾는다(헤더/푸터 라인 정확 일치).
  const headerIdx = lines.findIndex((l) => l.trim() === headerLine.trim());
  let footerIdx = -1;
  if (headerIdx !== -1) {
    for (let i = headerIdx + 1; i < lines.length; i++) {
      if (lines[i].trim() === footerLine.trim()) {
        footerIdx = i;
        break;
      }
    }
  }

  const desiredBlock = [headerLine, ...bodyLines, footerLine];

  // neutralize: 블록 범위를 제외한 영역의 bare 라인을 주석 처리한다.
  const neutralSet = new Set(neutralize.map(normalizePattern));
  const inBlock = (idx) =>
    headerIdx !== -1 &&
    footerIdx !== -1 &&
    idx >= headerIdx &&
    idx <= footerIdx;
  for (let i = 0; i < lines.length; i++) {
    if (inBlock(i)) continue;
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (neutralSet.has(normalizePattern(trimmed))) {
      lines[i] = `# ${trimmed}  # codi-harness: remove .planning via git rm, not ignore`;
      changed = true;
      changes.push(`neutralized: ${trimmed}`);
    }
  }

  if (headerIdx !== -1 && footerIdx !== -1) {
    // 기존 블록: 내용이 다르면 교체한다.
    const current = lines.slice(headerIdx, footerIdx + 1);
    const same =
      current.length === desiredBlock.length &&
      current.every((l, k) => l === desiredBlock[k]);
    if (!same) {
      lines.splice(headerIdx, footerIdx - headerIdx + 1, ...desiredBlock);
      changed = true;
      changes.push(`updated managed block: ${block.id ?? headerLine}`);
    }
  } else {
    // 블록 없음: 파일 끝에 추가한다(앞에 빈 줄 1개로 구분).
    if (lines.length > 0 && lines[lines.length - 1].trim() !== "") {
      lines.push("");
    }
    lines.push(...desiredBlock);
    changed = true;
    changes.push(`added managed block: ${block.id ?? headerLine}`);
  }

  return { text: lines.join("\n") + "\n", changed };
}

let next = existing;
for (const block of managedBlocks) {
  const result = applyManagedBlock(next, block);
  next = result.text;
}

// ── entries(append-only) 처리 ──────────────────────────────────────
// managed 블록 반영 후의 상태를 기준으로 누락 단일 라인을 append한다.
const existingPatterns = new Set();
for (const raw of next.split("\n")) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  existingPatterns.add(line.replace(/^\/+/, ""));
}

const additions = [];
for (const entry of entries) {
  if (!entry || typeof entry.pattern !== "string") continue;
  const normalized = entry.pattern.replace(/^\/+/, "");
  if (existingPatterns.has(normalized)) continue;
  existingPatterns.add(normalized);
  additions.push(entry);
}

if (additions.length > 0) {
  if (next.length > 0 && !next.endsWith("\n")) {
    next += "\n";
  }
  for (const entry of additions) {
    if (next.length > 0 && !next.endsWith("\n\n")) {
      next += "\n";
    }
    if (entry.section) {
      next += `${entry.section}\n`;
    }
    next += `${entry.pattern}\n`;
    changes.push(entry.pattern);
  }
}

if (next !== existing) {
  writeFileSync(gitignorePath, next);
}

for (const c of changes) {
  console.log(c);
}
