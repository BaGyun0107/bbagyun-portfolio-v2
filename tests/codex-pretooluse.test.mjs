// Codex PreToolUse 어댑터 회귀 배터리.
// Codex 공식 훅 페이로드 형태(cwd/tool_name/tool_input.command)를 어댑터에
// 흘려, guardrails.mjs 의 Bash 차단이 Codex 거부 규약(exit 2 + stderr 사유)
// 으로 번역되는지 검증한다. 경고는 파일럿 범위 밖(통과)이다.

import { tmp } from './helpers/fixture-base.mjs';
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const ADAPTER = join(REPO, ".harness/hooks/codex-pretooluse.mjs");

// CLAUDE_PROJECT_DIR 이 있으면 guardrails 의 프로젝트 루트 해석이 이 repo 로
// 고정되므로 테스트용 임시 repo 판정이 오염된다 — 제거한 env 로 실행.
const cleanEnv = { ...process.env };
delete cleanEnv.CLAUDE_PROJECT_DIR;

function runAdapter(payload) {
  const input = typeof payload === "string" ? payload : JSON.stringify(payload);
  const res = spawnSync("node", [ADAPTER], {
    input,
    encoding: "utf8",
    env: cleanEnv,
  });
  return { code: res.status, stderr: res.stderr || "", stdout: res.stdout || "" };
}

function makeRepo(branch) {
  const root = tmp("codi-codexhook-");
  spawnSync("git", ["init", "-q", "-b", branch], { cwd: root });
  spawnSync("git", ["config", "user.email", "t@t"], { cwd: root });
  spawnSync("git", ["config", "user.name", "t"], { cwd: root });
  writeFileSync(join(root, "seed.txt"), "x");
  spawnSync("git", ["add", "."], { cwd: root });
  spawnSync("git", ["commit", "-qm", "seed"], { cwd: root });
  return root;
}

test("BLOCK: 위험 명령은 exit 2 + stderr 사유", () => {
  const root = makeRepo("feature/x");
  try {
    const r = runAdapter({
      session_id: "s",
      hook_event_name: "PreToolUse",
      cwd: root,
      tool_name: "Bash",
      tool_input: { command: "rm -rf /tmp/whatever" },
    });
    assert.equal(r.code, 2);
    assert.ok(r.stderr.length > 0, "사유가 stderr 로 나가야 한다");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("BLOCK: 보호 브랜치(main)에서 write-like 명령은 차단", () => {
  const root = makeRepo("main");
  try {
    const r = runAdapter({
      cwd: root,
      tool_name: "Bash",
      tool_input: { command: "touch newfile.txt" },
    });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /protected branch/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("ALLOW: feature 브랜치에서는 같은 명령이 통과", () => {
  const root = makeRepo("feature/x");
  try {
    const r = runAdapter({
      cwd: root,
      tool_name: "Bash",
      tool_input: { command: "touch newfile.txt" },
    });
    assert.equal(r.code, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("ALLOW: 셸이 아닌 도구(apply_patch)는 어댑터가 관여하지 않는다", () => {
  const r = runAdapter({
    cwd: "/tmp",
    tool_name: "apply_patch",
    tool_input: { command: "rm -rf /" },
  });
  assert.equal(r.code, 0);
});

test("ALLOW: 소문자 shell 도구명도 인식하되 안전 명령은 통과", () => {
  const root = makeRepo("feature/y");
  try {
    const blocked = runAdapter({
      cwd: root,
      tool_name: "shell",
      tool_input: { command: "rm -rf /tmp/x" },
    });
    assert.equal(blocked.code, 2, "shell 도구명으로도 차단 동작");
    const ok = runAdapter({
      cwd: root,
      tool_name: "shell",
      tool_input: { command: "ls -la" },
    });
    assert.equal(ok.code, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("ALLOW: 파싱 불가 페이로드는 fail-open (exit 0)", () => {
  assert.equal(runAdapter("not-json{{{").code, 0);
  assert.equal(runAdapter({ tool_name: "Bash" }).code, 0, "command 없음");
});

test("BLOCK: planning-only 프로필이면 apps 표면 명령이 Codex에서도 차단", () => {
  const root = makeRepo("feature/x");
  try {
    mkdirSync(join(root, ".harness", "config"), { recursive: true });
    writeFileSync(
      join(root, ".harness", "config", "project-profile.yaml"),
      "mode: planning-only\n",
    );
    const blocked = runAdapter({
      cwd: root,
      tool_name: "Bash",
      tool_input: { command: "mkdir -p apps/front/src" },
    });
    assert.equal(blocked.code, 2, "planning-only 에서 apps/front 생성은 차단");
    assert.match(blocked.stderr, /planning-only/);
    const ok = runAdapter({
      cwd: root,
      tool_name: "Bash",
      tool_input: { command: "ls -la" },
    });
    assert.equal(ok.code, 0, "안전 명령은 통과");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
