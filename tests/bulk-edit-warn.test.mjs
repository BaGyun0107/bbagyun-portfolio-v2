// 일괄 in-place 편집 경고(비차단) 회귀 배터리.
// guardrails.mjs 를 자식 프로세스로 띄워 Bash 입력 JSON 을 흘리고,
// apps/** 대상 sed -i / perl -i / awk -i inplace 에서만 경고가 발동하고
// 차단은 절대 하지 않음을 대조한다.

import { tmp } from "./helpers/fixture-base.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, rmSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const HOOK = join(REPO, ".harness/hooks/guardrails.mjs");

// cwdSub: 프로젝트 루트 하위 상대 경로에서 실행하는 경우 지정.
function runBashGuard({ command, cwdSub }) {
  const root = tmp("codi-bulkedit-");
  try {
    spawnSync("git", ["init", "-q"], { cwd: root });
    const cwd = cwdSub ? join(root, cwdSub) : root;
    if (cwdSub) mkdirSync(cwd, { recursive: true });
    const payload = JSON.stringify({
      tool_name: "Bash",
      tool_input: { command, cwd },
    });
    const res = spawnSync("node", [HOOK], {
      input: payload,
      encoding: "utf8",
      env: { ...process.env, CLAUDE_PROJECT_DIR: root },
    });
    const stdout = res.stdout || "";
    return {
      warned: stdout.includes("bulk in-place edit"),
      blocked: stdout.includes('"decision":"block"'),
      stdout,
    };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

// ── 경고가 발동해야 하는 경우 (TP) ──
test("WARN: sed -i + apps/ 경로", () => {
  const r = runBashGuard({
    command: "sed -i 's/a/b/g' apps/bzmall/adm/couponlist.php",
  });
  assert.equal(r.warned, true);
  assert.equal(r.blocked, false);
});

test("WARN: perl -pi + apps/ 경로", () => {
  const r = runBashGuard({
    command: "perl -pi -e 's/x/y/' apps/bzmall/lib/coupon.lib.php",
  });
  assert.equal(r.warned, true);
  assert.equal(r.blocked, false);
});

test("WARN: BSD sed -i '' + cwd 가 apps 하위", () => {
  const r = runBashGuard({
    command: "sed -i '' -e 's/a/b/' couponlist.php",
    cwdSub: "apps/bzmall/adm",
  });
  assert.equal(r.warned, true);
});

test("WARN: find -exec sed -i", () => {
  const r = runBashGuard({
    command: "find apps/bzmall -name '*.php' -exec sed -i 's/a/b/' {} +",
  });
  assert.equal(r.warned, true);
});

test("WARN: xargs sed -i", () => {
  const r = runBashGuard({
    command: "ls apps/bzmall/*.php | xargs sed -i 's/a/b/'",
  });
  assert.equal(r.warned, true);
});

test("WARN: awk -i inplace + apps/ 경로", () => {
  const r = runBashGuard({
    command: "awk -i inplace '{gsub(/a/,\"b\")}1' apps/bzmall/x.php",
  });
  assert.equal(r.warned, true);
});

// ── 침묵해야 하는 경우 (FP 방지) ──
test("SILENT: apps 밖 sed -i", () => {
  const r = runBashGuard({ command: "sed -i 's/a/b/' docs/notes.md" });
  assert.equal(r.warned, false);
});

test("SILENT: grep 검색 인자 속 'sed -i' 문구", () => {
  const r = runBashGuard({ command: 'grep -rn "sed -i" apps/bzmall' });
  assert.equal(r.warned, false);
});

test("SILENT: in-place 아닌 sed (stdout 출력)", () => {
  const r = runBashGuard({ command: "sed 's/a/b/' apps/bzmall/x.php" });
  assert.equal(r.warned, false);
});

test("SILENT: perl -Ilib 는 in-place 가 아니다", () => {
  const r = runBashGuard({ command: "perl -Ilib tools/run.pl apps/x.php" });
  assert.equal(r.warned, false);
});

test("SILENT: webapps/ 는 apps/ 가 아니다", () => {
  const r = runBashGuard({ command: "sed -i 's/a/b/' webapps/x.php" });
  assert.equal(r.warned, false);
});

test("SILENT: apps 하위 cwd 라도 편집 명령이 아니면 침묵", () => {
  const r = runBashGuard({
    command: "grep -n tenant couponlist.php",
    cwdSub: "apps/bzmall/adm",
  });
  assert.equal(r.warned, false);
});
