// Codex Stop 어댑터 계약 테스트.
// Codex Stop 훅 규약: exit 0 + stdout은 JSON, 비차단(어떤 입력도 turn을 막지 않음).
// 실제 build 실행/판정은 docs-build-on-stop.test.mjs 와 실 repo 검증이 커버한다.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ADAPTER = join(HERE, "..", ".harness/hooks/codex-stop.mjs");

function runAdapter(input) {
  const res = spawnSync("node", [ADAPTER], { input, encoding: "utf8" });
  return { code: res.status, stdout: res.stdout || "", stderr: res.stderr || "" };
}

test("정상 Stop payload → exit 0, stdout은 {} (JSON 계약)", () => {
  const r = runAdapter(JSON.stringify({ cwd: HERE, turn_id: "t1", hook_event_name: "Stop" }));
  assert.equal(r.code, 0);
  assert.doesNotThrow(() => JSON.parse(r.stdout), "stdout은 유효 JSON이어야 함");
  assert.equal(r.stdout, "{}");
});

test("잘못된(non-JSON) payload → fail-open, exit 0 + {}", () => {
  const r = runAdapter("not-json-garbage");
  assert.equal(r.code, 0);
  assert.equal(r.stdout, "{}");
});

test("빈 payload → fail-open, exit 0 + {}", () => {
  const r = runAdapter("");
  assert.equal(r.code, 0);
  assert.equal(r.stdout, "{}");
});

test("cwd 없는 payload → exit 0 + {} (turn 안 막음)", () => {
  const r = runAdapter(JSON.stringify({ turn_id: "t2" }));
  assert.equal(r.code, 0);
  assert.equal(r.stdout, "{}");
});

test("Codex adapter는 shared planning sync adapter를 호출한다", () => {
  const source = readFileSync(ADAPTER, "utf8");
  assert.match(source, /runPlanningSyncIfRelevant/);
  assert.doesNotMatch(source, /build-hub\.mjs/);
});
