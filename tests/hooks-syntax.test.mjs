// 모든 훅 파일이 구문상 유효한지 검증한다 (node --check).
// 배경: PR #61 병합 과정의 텍스트 자동 병합이 guardrails.mjs 에 함수 중복
// 선언(SyntaxError)을 남겼고, 훅 레이어 전체가 조용히 fail-open 됐다.
// 개별 동작 테스트는 특정 입력 경로만 스폰하므로 파일 전체 파싱 실패를
// 놓칠 수 있다 — 이 테스트는 파싱 자체를 직접 검증한다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const hooksDir = fileURLToPath(new URL("../.harness/hooks/", import.meta.url));
const hookFiles = readdirSync(hooksDir).filter((f) => f.endsWith(".mjs"));

test("훅 디렉토리에 검사할 .mjs 파일이 존재한다", () => {
  assert.ok(hookFiles.length > 0, ".harness/hooks/*.mjs 가 비어 있음");
});

for (const file of hookFiles) {
  test(`${file} 는 node --check 를 통과한다`, () => {
    execFileSync(process.execPath, ["--check", join(hooksDir, file)], {
      stdio: "pipe",
    });
  });
}
