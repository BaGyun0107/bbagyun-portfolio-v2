// Plan-of-Record 힌트(비차단) 회귀 배터리.
// Superpowers 문서 경로(docs/superpowers/**, docs/plans/**)에 새 .md 를 Write 로
// 만들 때, Size 마커와 무관하게 비차단 힌트가 뜨는지 검증한다.
// 마커 기반 Medium+ 경고가 먼저 뜨면 힌트는 중복 출력되지 않아야 한다.

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

function runGuard({ tool = "Write", marker, target, planningFiles = [] }) {
  const root = tmp("codi-por-");
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
      tool_name: tool,
      tool_input: { file_path: absTarget, cwd: root, content: "x" },
    });
    const res = spawnSync("node", [HOOK], { input: payload, encoding: "utf8" });
    const stdout = res.stdout || "";
    const hits = stdout.split('"additionalContext"').length - 1;
    return { warned: hits > 0, hits, stdout };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("HINT: 마커 없이도 docs/superpowers/** 새 .md 는 힌트", () => {
  const r = runGuard({ target: "docs/superpowers/specs/feature.md" });
  assert.equal(r.warned, true);
  assert.match(r.stdout, /plan of record/i);
});

test("HINT: docs/plans/** 도 동일", () => {
  assert.equal(runGuard({ target: "docs/plans/impl.md" }).warned, true);
});

test("SILENT: Edit(문서 다듬기)에는 침묵 — Write 전용", () => {
  const r = runGuard({ tool: "Edit", target: "docs/superpowers/specs/feature.md" });
  assert.equal(r.warned, false);
});

test("SILENT: superpowers 경로 밖 docs .md 는 마커 없으면 침묵", () => {
  assert.equal(runGuard({ target: "docs/DESIGN.md" }).warned, false);
});

test("SILENT: superpowers 경로라도 .md 가 아니면 침묵", () => {
  assert.equal(runGuard({ target: "docs/superpowers/notes.txt" }).warned, false);
});

test("SILENT: specs/ 안 쓰기는 항상 침묵 (올바른 목적지)", () => {
  const r = runGuard({ marker: "Medium\n", target: "specs/001-feature/plan.md" });
  assert.equal(r.warned, false);
});

test("WARN: 제거 예정 .planning/audits 쓰기는 Medium+ 마커 경고 (감사 기록은 docs/audits/)", () => {
  const r = runGuard({ marker: "Medium\n", target: ".planning/audits/2026-08-recheck.md" });
  assert.equal(r.warned, true);
});

test("SILENT: docs/audits/ 감사 기록은 침묵 (유효 목적지)", () => {
  const r = runGuard({ marker: "Medium\n", target: "docs/audits/2026-08-recheck.md" });
  assert.equal(r.warned, false);
});

test("NO-DOUBLE: Medium+ 마커 + superpowers 경로 = 경고 1건만", () => {
  const r = runGuard({ marker: "Medium\n", target: "docs/superpowers/specs/feature.md" });
  assert.equal(r.warned, true);
  assert.equal(r.hits, 1, "마커 경고와 힌트가 중복 출력되면 안 된다");
});
