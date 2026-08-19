// e2e 검증 게이트 경고(비차단) 회귀 배터리.
// guardrails.mjs 를 자식 프로세스로 띄워 Bash `git commit` 입력 JSON 을 흘리고,
// 비차단 경고(additionalContext) 발동 여부를 기대값과 대조한다.
// 실제 커밋은 일어나지 않는다 — 훅은 PreToolUse 라 판정만 한다.
//
// 핵심 불변식 (AND 3조건 모두 충족할 때만 경고):
//   1. .harness/state/touches-user-flow 마커가 'yes'
//   2. Bash 명령이 진짜 `git commit` 서브커맨드
//   3. e2e-last-run 트리 해시가 현재 staged tree 와 불일치(=신선한 증거 없음)
//   하나라도 어긋나면 침묵.

import { tmp } from './helpers/fixture-base.mjs';
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const HOOK = join(REPO, ".harness/hooks/guardrails.mjs");

// 임시 git 프로젝트를 구성하고 Bash 입력을 훅에 흘린다.
// opts: { flowMarker?: string, evidence?: string|null, command: string,
//         stageContent?: string }
// evidence 가 "MATCH" 면 staged tree 와 일치하도록 실제 해시를 기록한다.
function runBashGuard({ flowMarker, evidence, command, stageContent = "x" }) {
  const root = tmp("codi-e2egate-");
  try {
    // 최소 git repo: 훅의 git write-tree / rev-parse 가 동작하도록.
    spawnSync("git", ["init", "-q"], { cwd: root });
    spawnSync("git", ["config", "user.email", "t@t"], { cwd: root });
    spawnSync("git", ["config", "user.name", "t"], { cwd: root });
    mkdirSync(join(root, ".harness", "state"), { recursive: true });
    writeFileSync(join(root, "app.txt"), stageContent);
    spawnSync("git", ["add", "app.txt"], { cwd: root });
    if (flowMarker !== undefined) {
      writeFileSync(
        join(root, ".harness", "state", "touches-user-flow"),
        flowMarker,
      );
    }
    if (evidence === "MATCH") {
      // 현재 staged tree 해시를 그대로 증거로 기록 → 신선한 증거.
      const tree = spawnSync("git", ["write-tree"], {
        cwd: root,
        encoding: "utf8",
      }).stdout.trim();
      writeFileSync(join(root, ".harness", "state", "e2e-last-run"), tree + "\n");
    } else if (typeof evidence === "string") {
      writeFileSync(join(root, ".harness", "state", "e2e-last-run"), evidence);
    }
    const payload = JSON.stringify({
      tool_name: "Bash",
      tool_input: { command, cwd: root },
    });
    const res = spawnSync("node", [HOOK], { input: payload, encoding: "utf8" });
    const stdout = res.stdout || "";
    return {
      warned: stdout.includes('"additionalContext"'),
      blocked: stdout.includes('"decision":"block"'),
      stdout,
    };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

// ── 경고가 발동해야 하는 경우 (TP) ──
test("WARN: yes 마커 + 진짜 git commit + 증거 없음", () => {
  const { warned } = runBashGuard({
    flowMarker: "yes\n",
    evidence: null,
    command: 'git commit -m "feat: add login flow"',
  });
  assert.equal(warned, true);
});

// 멀티라인 Bash 의 둘째 줄 git commit 도 인식해야 한다. splitSimpleCommands 가
// 개행을 명령 구분자로 쪼개지 않으면 첫 줄(git status 등)만 보고 commit 을 놓쳐
// 게이트가 조용히 빠져나간다 — 흔한 false-negative.
test("WARN: 멀티라인 Bash 의 둘째 줄 git commit 도 인식한다", () => {
  assert.equal(
    runBashGuard({
      flowMarker: "yes\n",
      evidence: null,
      command: 'git status --short\ngit commit -m "feat: add login flow"',
    }).warned,
    true,
    "newline-separated commit",
  );
  assert.equal(
    runBashGuard({
      flowMarker: "yes\n",
      evidence: null,
      command: 'git add -A\r\ngit commit -m "x"',
    }).warned,
    true,
    "CRLF-separated commit",
  );
});

// 따옴표 안의 개행은 명령 구분자가 아니다 — 인용된 "git commit" 텍스트가
// 진짜 커밋으로 오인되면 안 된다.
test("SILENT: 따옴표 안 개행 속 git commit 텍스트는 커밋이 아니다", () => {
  assert.equal(
    runBashGuard({
      flowMarker: "yes\n",
      evidence: null,
      command: 'echo "first line\ngit commit -m fake"',
    }).warned,
    false,
  );
});

// ── 침묵해야 하는 경우 (마커 조건) ──
test("SILENT: 마커 없음 / no 이면 침묵", () => {
  const cmd = 'git commit -m "x"';
  assert.equal(
    runBashGuard({ evidence: null, command: cmd }).warned,
    false,
    "마커 미존재",
  );
  assert.equal(
    runBashGuard({ flowMarker: "no\n", evidence: null, command: cmd }).warned,
    false,
    "no",
  );
});

// ── freshness (조건 3) ──
test("SILENT: 증거 트리 해시가 현재 staged tree 와 일치하면 침묵", () => {
  const { warned } = runBashGuard({
    flowMarker: "yes\n",
    evidence: "MATCH", // 헬퍼가 실제 staged tree 해시를 기록
    command: 'git commit -m "feat: x"',
  });
  assert.equal(warned, false);
});

test("WARN: 증거 트리 해시가 staged tree 와 불일치하면 경고", () => {
  const { warned } = runBashGuard({
    flowMarker: "yes\n",
    evidence: "0000000000000000000000000000000000000000\n", // 다른 해시
    command: 'git commit -m "feat: x"',
  });
  assert.equal(warned, true);
});

// ── 조건 2 매처: 진짜 commit 만, 텍스트/읽기전용 mention 은 침묵 (FP=0) ──
test("SILENT: git commit 을 언급만 하는 read-only/텍스트 명령은 침묵", () => {
  const negatives = [
    "git log --grep='git commit' --oneline",
    "grep -rn 'git commit' .claude/rules/",
    'git commit --dry-run -m "x"',
    "echo 'run git commit'",
  ];
  for (const cmd of negatives) {
    const { warned } = runBashGuard({
      flowMarker: "yes\n",
      evidence: null,
      command: cmd,
    });
    assert.equal(warned, false, `'${cmd}' 에서 침묵해야 한다`);
  }
});

// ── 진짜 commit 변형은 발동 (TP) ──
test("WARN: git -C path commit 같은 진짜 commit 변형도 발동", () => {
  const { warned } = runBashGuard({
    flowMarker: "yes\n",
    evidence: null,
    command: 'git -C . commit -m "feat: x"',
  });
  assert.equal(warned, true);
});

// ── emission discipline: stdout JSON 은 최대 1개 ──
test("emission: 경고 시 stdout 에 JSON 객체가 정확히 1개", () => {
  const { stdout } = runBashGuard({
    flowMarker: "yes\n",
    evidence: null,
    command: 'git commit -m "feat: x"',
  });
  // 단일 JSON.parse 가 성공하고, 두 번째 객체 시작 '}{' 이 없어야 한다.
  assert.doesNotThrow(() => JSON.parse(stdout.trim()));
  assert.equal(stdout.includes("}{"), false, "이중 출력 금지");
});

// ── 에스컬레이션 카운터: 반복 발동 시 강도 상승, 정상화 시 리셋 ──
test("escalation: 반복 커밋마다 강도 상승, 증거 신선화로 리셋", () => {
  const root = tmp("codi-e2eesc-");
  try {
    spawnSync("git", ["init", "-q"], { cwd: root });
    spawnSync("git", ["config", "user.email", "t@t"], { cwd: root });
    spawnSync("git", ["config", "user.name", "t"], { cwd: root });
    mkdirSync(join(root, ".harness", "state"), { recursive: true });
    writeFileSync(join(root, "app.txt"), "x");
    spawnSync("git", ["add", "app.txt"], { cwd: root });
    writeFileSync(join(root, ".harness", "state", "touches-user-flow"), "yes\n");

    const fire = () => {
      const payload = JSON.stringify({
        tool_name: "Bash",
        tool_input: { command: 'git commit -m "feat: x"', cwd: root },
      });
      return spawnSync("node", [HOOK], { input: payload, encoding: "utf8" })
        .stdout || "";
    };

    const first = fire();
    assert.match(first, /non-blocking reminder/);
    assert.doesNotMatch(first, /Reminder 2|STRONG/);

    const second = fire();
    assert.match(second, /Reminder 2/);

    fire(); // 3회차
    const fourth = fire();
    assert.match(fourth, /STRONG reminder \(#4\)/);

    // 정상화: 신선한 증거 기록 → 침묵 + 카운터 파일 제거
    const tree = spawnSync("git", ["write-tree"], {
      cwd: root,
      encoding: "utf8",
    }).stdout.trim();
    writeFileSync(join(root, ".harness", "state", "e2e-last-run"), tree + "\n");
    const clean = fire();
    assert.equal(clean.includes('"additionalContext"'), false);
    assert.equal(
      existsSync(join(root, ".harness", "state", "e2e-warn-count")),
      false,
      "카운터가 리셋되어야 한다",
    );

    // 다시 증거가 낡으면 레벨 1부터 재시작
    writeFileSync(join(root, "app.txt"), "changed");
    spawnSync("git", ["add", "app.txt"], { cwd: root });
    const restart = fire();
    assert.match(restart, /non-blocking reminder/);
    assert.doesNotMatch(restart, /Reminder 2|STRONG/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ── 위험 명령이 같은 줄에 있어도 block 이 우선, 경고는 추가 출력 안 함 ──
test("precedence: 위험 명령이 섞이면 block 만 나오고 경고 JSON 은 없음", () => {
  const { blocked, stdout } = runBashGuard({
    flowMarker: "yes\n",
    evidence: null,
    command: 'git commit -m "x" && rm -rf /tmp/x',
  });
  assert.equal(blocked, true, "위험 명령이라 block");
  assert.equal(stdout.includes('"additionalContext"'), false, "block 시 경고 없음");
});
