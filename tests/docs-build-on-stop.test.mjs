import { tmp } from './helpers/fixture-base.mjs';
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { buildWorkItemReminder, changedPathsFromPorcelainV1Z, classifyPlanningChanges, collectConfiguredEvidencePaths, hasSpecsChange, isGeneratedPlanningPath, parsePorcelainV1Z, runNonBlockingPlanningSync, runPlanningSyncIfRelevant } from "../.harness/hooks/docs-build-on-stop.mjs";

test("변경 없음(빈 출력) → false, build 생략", () => {
  assert.equal(hasSpecsChange(""), false);
  assert.equal(hasSpecsChange("\n"), false);
  assert.equal(hasSpecsChange("   \n  \n"), false);
});

test("추적 파일 수정 → true", () => {
  assert.equal(hasSpecsChange(" M specs/003-feature-definition-source/status.yaml\n"), true);
});

test("미추적 새 spec 파일 → true", () => {
  assert.equal(hasSpecsChange("?? specs/004-new-feature/status.yaml\n"), true);
});

test("여러 줄 변경 → true", () => {
  const out = " M specs/003/status.yaml\n?? specs/004/spec.md\n";
  assert.equal(hasSpecsChange(out), true);
});

test("undefined/null 방어 → false", () => {
  assert.equal(hasSpecsChange(undefined), false);
  assert.equal(hasSpecsChange(null), false);
});

test("planning source group을 분류하고 generated output은 제외한다", () => {
  const groups = classifyPlanningChanges([
    "data/sitemap.json",
    "specs/010-planning-hub-redesign/tasks.md",
    "examples/community-app/downstream/delivery-evidence.json",
    "docs/index.html",
    "docs/planning.html",
    ".harness/state/planning-automation.json",
  ]);
  assert.deepEqual(groups, ["data", "specs", "evidence"]);
});

test("Claude/Codex 공용 Stop adapter는 두 페이지를 같은 generated set으로 분류한다", () => {
  assert.equal(isGeneratedPlanningPath("docs/index.html"), true);
  assert.equal(isGeneratedPlanningPath("docs/planning.html"), true);
  assert.equal(isGeneratedPlanningPath("data/sitemap.json"), false);
  assert.deepEqual(classifyPlanningChanges(["docs/index.html"]), []);
  assert.deepEqual(classifyPlanningChanges(["docs/planning.html"]), []);
});

test("workitem-reminder: specs 진행 변화 + evidence 미갱신이면 비차단 안내를 만든다", () => {
  const reminder = buildWorkItemReminder(
    ["specs/001-x/tasks.md", "src/feature.ts"],
    ["downstream"],
  );
  assert.match(reminder, /workitem-reminder/);
  assert.match(reminder, /workItems/);
  assert.match(reminder, /feature:stub/);
});

test("workitem-reminder: evidence가 함께 갱신되면 침묵한다", () => {
  assert.equal(buildWorkItemReminder(
    ["specs/001-x/tasks.md", "downstream/delivery-evidence.json"],
    ["downstream"],
  ), null);
});

test("workitem-reminder: deliverySource가 specs면 spec 변경이 곧 evidence라 침묵한다", () => {
  assert.equal(buildWorkItemReminder(
    ["specs/001-x/tasks.md", "specs/001-x/status.yaml"],
    ["specs", "examples/community-app/downstream"],
  ), null);
});

test("workitem-reminder: 진행 신호(tasks/status) 없이는 침묵한다", () => {
  assert.equal(buildWorkItemReminder(["specs/001-x/spec.md"], ["downstream"]), null);
});

test("runPlanningSyncIfRelevant는 reminder를 warn 의존성으로 내보낸다", () => {
  const warned = [];
  const porcelain = " M specs/001-x/tasks.md\0";
  runPlanningSyncIfRelevant("/tmp/fake-root", "test", {
    getStatus: () => ({ status: 0, stdout: porcelain }),
    runSync: () => {},
    getConfiguredEvidence: () => ({ paths: ["downstream"], health: [] }),
    warn: (message) => warned.push(message),
  });
  assert.equal(warned.length, 1);
  assert.match(warned[0], /workitem-reminder/);
});

test("configured evidence path도 evidence source로 분류한다", () => {
  assert.deepEqual(classifyPlanningChanges(["reports/delivery.json"], ["reports/delivery.json"]), ["evidence"]);
});

test("configured evidence 디렉터리는 slash를 정규화하고 경계 밖 유사 prefix는 제외한다", () => {
  assert.deepEqual(classifyPlanningChanges(["reports\\delivery\\evidence.json"], ["reports/delivery"]), ["evidence"]);
  assert.deepEqual(classifyPlanningChanges(["reports/delivery-other/evidence.json"], ["reports/delivery"]), []);
  assert.deepEqual(classifyPlanningChanges(["reports/delivery"], ["reports/delivery"]), ["evidence"]);
});

test("workspace deliverySource의 파일·디렉터리를 repo-relative git path로 수집하고 unsafe 경로는 fail-open한다", () => {
  const root = tmp("planning-stop-evidence-paths-");
  mkdirSync(join(root, "data"), { recursive: true });
  writeFileSync(join(root, "data", "hub-workspaces.json"), JSON.stringify({
    version: 1,
    defaultWorkspaceId: "directory-source",
    workspaces: [
      { id: "directory-source", title: "Directory", kind: "downstream", root: ".", deliverySource: "reports/delivery" },
      { id: "file-source", title: "File", kind: "downstream", root: ".", deliverySource: "reports/snapshot.json" },
      { id: "unsafe-source", title: "Unsafe", kind: "downstream", root: ".", deliverySource: "../outside" },
    ],
  }));

  const result = collectConfiguredEvidencePaths(root);

  assert.deepEqual(result.paths, ["reports/delivery", "reports/snapshot.json"]);
  assert.match(result.health.map(({ code }) => code).join("\n"), /delivery-source-unsafe/);
  rmSync(root, { recursive: true, force: true });
});

test("공유 Stop adapter는 configured delivery 변경을 evidence sync로 전달하고 generated page만 바뀌면 호출하지 않는다", () => {
  const root = tmp("planning-stop-configured-evidence-");
  mkdirSync(join(root, "data"), { recursive: true });
  writeFileSync(join(root, "data", "hub-workspaces.json"), JSON.stringify({
    version: 1,
    defaultWorkspaceId: "actual",
    workspaces: [{ id: "actual", title: "Actual", kind: "downstream", root: ".", deliverySource: "reports/delivery" }],
  }));
  const calls = [];
  const pathspecs = [];
  const invoked = runPlanningSyncIfRelevant(root, "codex-stop", {
    getStatus: ({ paths }) => {
      pathspecs.push(...paths);
      return { status: 0, stdout: " M reports/delivery/evidence.json\0" };
    },
    runSync: (options) => calls.push(options),
  });

  assert.equal(invoked, true);
  assert.ok(pathspecs.includes("reports/delivery"));
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].sourceGroups, ["evidence"]);
  assert.equal(calls[0].trigger, "codex-stop");

  let generatedCallCount = 0;
  const generatedOnly = runPlanningSyncIfRelevant(root, "claude-stop", {
    getStatus: () => ({ status: 0, stdout: " M docs/planning.html\0 M docs/index.html\0" }),
    runSync: () => { generatedCallCount += 1; },
  });
  assert.equal(generatedOnly, undefined);
  assert.equal(generatedCallCount, 0);
  rmSync(root, { recursive: true, force: true });
});

test("porcelain v1 -z parser는 한글·공백·화살표 문자열·rename·untracked 경로를 손상하지 않는다", () => {
  const root = tmp("planning-stop-git-z-");
  mkdirSync(join(root, "specs"), { recursive: true });
  mkdirSync(join(root, "data"), { recursive: true });
  const original = "specs/old -> source.md";
  const destination = "specs/ 새 -> 이름 .md";
  const untracked = "data/ 한글 -> 보고서 .json ";
  writeFileSync(join(root, original), "old\n");
  assert.equal(spawnSync("git", ["init", "-q"], { cwd: root }).status, 0);
  assert.equal(spawnSync("git", ["add", "--", original], { cwd: root }).status, 0);
  assert.equal(spawnSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "init"], { cwd: root }).status, 0);
  renameSync(join(root, original), join(root, destination));
  assert.equal(spawnSync("git", ["add", "-A", "--", "specs"], { cwd: root }).status, 0);
  writeFileSync(join(root, untracked), "new\n");

  const status = spawnSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all", "--", "data", "specs", "examples"], { cwd: root, encoding: "utf8" });
  assert.equal(status.status, 0);
  const records = parsePorcelainV1Z(status.stdout);
  const changed = changedPathsFromPorcelainV1Z(status.stdout);

  assert.ok(records.some(({ path, originalPath }) => path === destination && originalPath === original));
  assert.ok(records.some(({ status: code, path }) => code === "??" && path === untracked));
  assert.ok(changed.includes(destination));
  assert.ok(changed.includes(original), "rename source/deletion도 분류 입력에 남긴다");
  assert.ok(changed.includes(untracked));
  assert.deepEqual(classifyPlanningChanges(changed), ["specs", "data"]);
  rmSync(root, { recursive: true, force: true });
});

test("Claude/Codex 공용 Stop 경계는 sync 실패를 경고하고 비차단으로 끝낸다", () => {
  const warnings = [];
  const result = runNonBlockingPlanningSync(
    () => { throw new Error("projection failed"); },
    (message) => warnings.push(message),
  );

  assert.equal(result, false);
  assert.deepEqual(warnings, ["[planning-sync-on-stop] projection failed — 무시\n"]);
});
