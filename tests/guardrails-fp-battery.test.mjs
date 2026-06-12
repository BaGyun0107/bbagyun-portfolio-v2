// 가드레일 오탐(FP)/미탐(FN) 회귀 배터리.
// guardrails.mjs 를 자식 프로세스로 띄워 stdin 으로 명령 JSON 을 흘리고,
// 차단(block) 여부를 기대값과 대조한다. 실제 명령은 절대 실행되지 않는다.
//
// 핵심 불변식:
//   - DANGEROUS 군: 전부 여전히 block 되어야 한다 (FN=0 보장).
//   - LEGIT 군: read-only 검색·텍스트 방출 명령은 통과(allow)해야 한다 (FP 제거).
//   - 우회 경로(substitution / compound 뒤 숨은 위험)는 여전히 block.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const HOOK = join(REPO, ".harness/hooks/guardrails.mjs");

// 위험 토큰은 셸 명령줄이 아니라 이 파일 안 문자열로만 존재하므로
// 테스트 러너의 Bash 가드를 건드리지 않는다.
function runGuard(command, cwd = REPO) {
  const payload = JSON.stringify({
    tool_name: "Bash",
    tool_input: { command, cwd },
  });
  const res = spawnSync("node", [HOOK], {
    input: payload,
    encoding: "utf8",
  });
  const blocked = (res.stdout || "").includes('"decision":"block"');
  return { blocked, stdout: res.stdout || "" };
}

// ── 통과해야 하는 명령 (read-only 검색 / 텍스트 방출) ──
const LEGIT_ALLOW = [
  // 클래스 1: 위험 문구를 검색 인자로 넘기는 read-only 명령
  ["grep -rn 'gh pr merge' .claude/rules/", "grep: pr-merge 문구 검색"],
  ["grep -rn 'rm -rf' .harness/policies/guardrails.md", "grep: 재귀삭제 문구 검색"],
  ["rg -n 'DROP TABLE' .harness/hooks/guardrails.mjs", "rg: DROP 문구 검색"],
  ["grep -n 'git reset --hard' .claude/rules/work-safety.md", "grep: hard reset 문구 검색"],
  ["egrep -rn 'TRUNCATE' db/migrations", "egrep: TRUNCATE 검색"],
  ["fgrep -rn 'docker system prune' scripts/", "fgrep: docker prune 검색"],
  ["git log --grep='kubectl delete' --oneline", "git log --grep: kubectl 검색"],
  ["git log -S 'git push --force' --oneline", "git log -S: force push 검색"],
  ["git show HEAD --stat", "git show: read-only"],
  // 클래스 2: 위험 문구가 방출 텍스트(메시지/본문)에 든 명령
  ["echo 'Never run terraform destroy without approval.'", "echo: 규칙 설명 텍스트"],
  ["printf 'rule: do not git push --force\\n'", "printf: 규칙 설명 텍스트"],
  ["gh pr create --title docs --body 'AI must never run gh pr merge.'", "gh pr create: never-merge 규칙을 본문에 문서화"],
  ["gh pr edit 51 --body 'note: gh pr merge is forbidden'", "gh pr edit: 본문에 금지 문구"],
  // 대조군: 위험 단어 없는 평범한 read-only / 안전 쓰기 (원래도 통과)
  ["git log --oneline -20", "git log: 일반"],
  ["cat .harness/policies/guardrails.md", "cat: 일반"],
  ["touch /tmp/codi-fp-test.txt", "touch: 안전 쓰기"],
  ["ls -la .harness/skills", "ls: 공유 트리 읽기"],
];

// ── 여전히 차단되어야 하는 진짜 위험 명령 (FN=0) ──
// 위험 토큰을 그대로 적되, 이 파일 문자열 안에만 존재한다.
const DANGEROUS_BLOCK = [
  ["rm -rf /tmp/x", "실제 재귀 force 삭제"],
  ["git reset --hard origin/main", "실제 hard reset"],
  ["git push --force origin main", "실제 force push"],
  ["gh pr merge 51", "실제 PR 머지"],
  ["psql -c 'DROP TABLE users'", "psql 실행으로 DROP (executor — 따옴표 안이어도 차단)"],
  ["mysql -e 'TRUNCATE accounts'", "mysql 실행으로 TRUNCATE"],
  ["kubectl delete pod web-0", "kubectl delete"],
  ["docker system prune -af", "docker system prune"],
  ["terraform destroy -auto-approve", "terraform destroy"],
  // 우회 경로
  ["echo ok ; rm -rf /tmp/x", "compound 뒤 숨은 재귀삭제"],
  ["echo ok && git push --force origin main", "compound 뒤 force push"],
  ["grep foo $(rm -rf /tmp/x)", "substitution 안의 재귀삭제 (read-only 외피)"],
  ["echo \"$(gh pr merge 51)\"", "substitution 안의 실제 머지"],
];

test("LEGIT 군: read-only 검색/텍스트 방출은 통과(allow)", () => {
  const fps = [];
  for (const [cmd, desc] of LEGIT_ALLOW) {
    const { blocked } = runGuard(cmd);
    if (blocked) fps.push(`  FP: ${desc} :: ${cmd}`);
  }
  assert.equal(fps.length, 0, `오탐 ${fps.length}건:\n${fps.join("\n")}`);
});

test("DANGEROUS 군: 진짜 위험·우회는 모두 차단(block) — FN=0", () => {
  const fns = [];
  for (const [cmd, desc] of DANGEROUS_BLOCK) {
    const { blocked } = runGuard(cmd);
    if (!blocked) fns.push(`  FN: ${desc} :: ${cmd}`);
  }
  assert.equal(fns.length, 0, `미탐(위험 누락) ${fns.length}건:\n${fns.join("\n")}`);
});
