// Medium+ Size 게이트 경고(비차단) 회귀 배터리.
// guardrails.mjs 를 자식 프로세스로 띄워 Write 도구 입력 JSON 을 흘리고,
// 비차단 경고(additionalContext) 발동 여부를 기대값과 대조한다.
// 실제 파일 쓰기는 일어나지 않는다 — 훅은 PreToolUse 라 판정만 한다.
//
// 핵심 불변식 (AND 3조건 모두 충족할 때만 경고):
//   1. .harness/state/current-size 마커가 Medium 이상
//   2. 대상이 specs/(및 .specify/, docs/audits/ 예외) 밖의 설계성 .md
//   3. specs/ 에 feature 산출물(.md)이 아직 없음
//   하나라도 어긋나면 침묵 (특히 Small·마커 미존재면 절대 발동 안 함).

import { tmp } from './helpers/fixture-base.mjs';
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const HOOK = join(REPO, ".harness/hooks/guardrails.mjs");

// 임시 프로젝트를 구성하고 Write 입력을 훅에 흘린다.
// opts: { marker?: string, target: string(상대경로), planningFiles?: [상대경로] }
function runWriteGuard({ marker, target, planningFiles = [] }) {
  const root = tmp("codi-sizegate-");
  try {
    mkdirSync(join(root, ".harness", "state"), { recursive: true });
    mkdirSync(join(root, ".planning"), { recursive: true });
    if (marker !== undefined) {
      writeFileSync(join(root, ".harness", "state", "current-size"), marker);
    }
    for (const rel of planningFiles) {
      const abs = join(root, rel);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, "x");
    }
    const absTarget = join(root, target);
    mkdirSync(dirname(absTarget), { recursive: true });
    const payload = JSON.stringify({
      tool_name: "Write",
      tool_input: { file_path: absTarget, cwd: root, content: "x" },
    });
    const res = spawnSync("node", [HOOK], { input: payload, encoding: "utf8" });
    const stdout = res.stdout || "";
    const warned = stdout.includes('"additionalContext"');
    return { warned, stdout };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

// ── 경고가 발동해야 하는 경우 ──
test("WARN: Medium+ 마커 + specs 밖 설계 .md + 빈 specs", () => {
  for (const marker of ["Medium\n", "Large\n", "Extra-large\n", "medium", "  Medium  \n"]) {
    const { warned } = runWriteGuard({ marker, target: "docs/DESIGN.md" });
    assert.equal(warned, true, `마커 '${JSON.stringify(marker)}' 에서 경고가 떠야 한다`);
  }
});

// ── 침묵해야 하는 경우 (오탐 방지) ──
test("SILENT: 마커 없음 / Small 이면 침묵", () => {
  assert.equal(runWriteGuard({ target: "docs/DESIGN.md" }).warned, false, "마커 미존재");
  assert.equal(runWriteGuard({ marker: "Small\n", target: "docs/DESIGN.md" }).warned, false, "Small");
  assert.equal(runWriteGuard({ marker: "\n", target: "docs/DESIGN.md" }).warned, false, "빈 마커");
});

test("SILENT: specs/ 안에 쓰면 침묵 (올바른 목적지)", () => {
  const { warned } = runWriteGuard({
    marker: "Medium\n",
    target: "specs/001-x/plan.md",
  });
  assert.equal(warned, false);
});

test("WARN: 제거 예정 legacy .planning/ 에 쓰면 경고 (감사 기록은 docs/audits/)", () => {
  const { warned } = runWriteGuard({
    marker: "Medium\n",
    target: ".planning/audits/2026-08-recheck.md",
  });
  assert.equal(warned, true);
});

test("SILENT: docs/audits/ 감사 기록은 침묵 (유효 목적지)", () => {
  const { warned } = runWriteGuard({
    marker: "Medium\n",
    target: "docs/audits/2026-08-recheck.md",
  });
  assert.equal(warned, false);
});

test("SILENT: specs/ 에 이미 feature 산출물이 있으면 침묵", () => {
  const { warned } = runWriteGuard({
    marker: "Medium\n",
    target: "docs/DESIGN.md",
    planningFiles: ["specs/001-x/spec.md"],
  });
  assert.equal(warned, false);
});

test("SILENT: 설계 문서가 아닌 코드/설정 파일이면 침묵", () => {
  for (const target of ["src/thing.ts", "config.json", "docs/notes.txt"]) {
    const { warned } = runWriteGuard({ marker: "Medium\n", target });
    assert.equal(warned, false, `${target} 에서 침묵해야 한다`);
  }
});
