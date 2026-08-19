#!/usr/bin/env node
// Stop 훅 공용 로직: planning source 변경이 있으면 shared planning sync를 1회
// 실행해 검증·reconcile·docs projection을 최신화한다. 비차단 편의 기능.
//
// Claude(이 파일이 직접 Stop 훅)와 Codex(codex-stop.mjs 어댑터)가 같은 구현을
// 공유한다 — parity "one implementation" 원칙.
//
// - git status에서 data/specs/examples와 configured evidence를 분류한다.
// - docs/index.html, docs/planning.html과 자동화 기록은 생성물이므로 트리거 대상이 아니다.
// - build 실패는 무시(경고만). git staging/commit은 절대 건드리지 않는다.
// - specs 변경이 없으면 조용히 통과한다.

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectConfiguredEvidencePaths, runPlanningSync } from "../scripts/docs/planning-sync.mjs";
import { isMain } from "../scripts/docs/lib/is-main.mjs";

export { collectConfiguredEvidencePaths };

const GENERATED_PATHS = new Set([
  "docs/index.html",
  "docs/planning.html",
  ".harness/state/planning-automation.json",
]);

export function isGeneratedPlanningPath(path) {
  return GENERATED_PATHS.has(String(path).replaceAll("\\", "/"));
}

function normalizeRepoPath(path) {
  return String(path || "")
    .replaceAll("\\", "/")
    .replace(/^\.\//, "")
    .replace(/\/$/, "");
}

function matchesConfiguredEvidence(path, configuredPath) {
  if (configuredPath === ".") return true;
  return path === configuredPath || path.startsWith(`${configuredPath}/`);
}

export function classifyPlanningChanges(paths, configuredEvidencePaths = []) {
  const evidence = [...new Set(configuredEvidencePaths.map(normalizeRepoPath).filter(Boolean))];
  const groups = [];
  for (const path of paths || []) {
    const normalized = normalizeRepoPath(path);
    if (isGeneratedPlanningPath(normalized)) continue;
    if (evidence.some((configuredPath) => matchesConfiguredEvidence(normalized, configuredPath))
      || normalized.startsWith("examples/") && normalized.includes("/downstream/")) {
      if (!groups.includes("evidence")) groups.push("evidence");
    } else if (normalized.startsWith("data/")) {
      if (!groups.includes("data")) groups.push("data");
    } else if (normalized.startsWith("specs/")) {
      if (!groups.includes("specs")) groups.push("specs");
    } else if (normalized.startsWith("examples/")) {
      if (!groups.includes("examples")) groups.push("examples");
    }
  }
  return groups;
}

// 항목 3: 구현 진행 신호(specs tasks/status 변경)가 있는데 delivery
// evidence 갱신이 없으면 work item 기록을 비차단으로 상기시킨다.
// deliverySource가 spec 디렉터리인 워크스페이스는 spec 변경 자체가
// evidence로 분류되므로 자연히 침묵한다. 알림일 뿐 어떤 것도 막지 않는다.
export function buildWorkItemReminder(changedPaths, configuredEvidencePaths = []) {
  const evidence = [...new Set(configuredEvidencePaths.map(normalizeRepoPath).filter(Boolean))];
  let progress = false;
  let evidenceTouched = false;
  for (const path of changedPaths || []) {
    const normalized = normalizeRepoPath(path);
    const inEvidence = evidence.some((configuredPath) => matchesConfiguredEvidence(normalized, configuredPath))
      || (normalized.startsWith("examples/") && normalized.includes("/downstream/"));
    if (inEvidence) {
      evidenceTouched = true;
      continue;
    }
    if (/^specs\/[^/]+\/(tasks\.md|status\.yaml)$/.test(normalized)) progress = true;
  }
  if (!progress || evidenceTouched) return null;
  return "[workitem-reminder] specs 진행 변화가 감지됐지만 delivery evidence 갱신이 없습니다. "
    + "구현 상태 변화는 delivery-evidence.json의 workItems 갱신으로 기록하세요 "
    + "(미등록 기능은 mise run feature:stub \"<FEAT-ID>\" \"<제목>\"). 비차단 안내입니다.";
}

export function parsePorcelainV1Z(output) {
  const fields = String(output || "").split("\0");
  const records = [];
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    if (!field) continue;
    const status = field.slice(0, 2);
    const path = field.slice(3);
    const renamed = status.includes("R") || status.includes("C");
    const originalPath = renamed ? (fields[index += 1] ?? null) : null;
    records.push({ status, path, originalPath });
  }
  return records;
}

export function changedPathsFromPorcelainV1Z(output) {
  return parsePorcelainV1Z(output).flatMap(({ path, originalPath }) =>
    originalPath === null ? [path] : [path, originalPath]);
}

// git status --porcelain 결과 문자열을 받아 specs/ 아래 변경이 있으면 true.
// 순수 함수로 분리해 테스트 가능하게 한다.
export function hasSpecsChange(porcelainOutput) {
  if (!porcelainOutput) return false;
  return porcelainOutput
    .split("\n")
    .some((line) => line.trim().length > 0);
}

export function runNonBlockingPlanningSync(
  run,
  warn = (message) => process.stderr.write(message),
) {
  try {
    run();
    return true;
  } catch (error) {
    warn(`[planning-sync-on-stop] ${error.message} — 무시\n`);
    return false;
  }
}

// 저장소 루트를 기준으로 specs 변경 시 docs:build를 실행한다.
// root가 없으면 이 파일 위치에서 저장소 루트를 추정한다(.harness/hooks/ → ../../..).
export function runDocsBuildIfSpecsChanged(root) {
  const repoRoot =
    root ||
    join(dirname(fileURLToPath(import.meta.url)), "..", "..");

  const status = spawnSync("git", ["status", "--porcelain", "--", "specs/"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (status.status !== 0) return; // git 없음/에러 → 조용히 통과
  if (!hasSpecsChange(status.stdout)) return; // specs 변경 없음 → build 생략

  const build = spawnSync(
    "node",
    [join(repoRoot, ".harness", "scripts", "docs", "build-hub.mjs")],
    { cwd: repoRoot, encoding: "utf8" },
  );
  if (build.status !== 0) {
    process.stderr.write("[docs-build-on-stop] docs:build 실패 — 무시\n");
  }
}

export function runPlanningSyncIfRelevant(root, trigger = "claude-stop", dependencies = {}) {
  const repoRoot = root || join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const getConfiguredEvidence = dependencies.getConfiguredEvidence || collectConfiguredEvidencePaths;
  const configuredEvidence = getConfiguredEvidence(repoRoot);
  const paths = [...new Set(["data/", "specs/", "examples/", ...configuredEvidence.paths])];
  const getStatus = dependencies.getStatus || (({ root: cwd, paths: pathspecs }) =>
    spawnSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all", "--", ...pathspecs], { cwd, encoding: "utf8" }));
  const status = getStatus({ root: repoRoot, paths });
  if (status.status !== 0) return;
  const changedPaths = changedPathsFromPorcelainV1Z(status.stdout);
  const sourceGroups = classifyPlanningChanges(changedPaths, configuredEvidence.paths);
  if (!sourceGroups.length) return;
  const reminder = buildWorkItemReminder(changedPaths, configuredEvidence.paths);
  if (reminder) {
    const warn = dependencies.warn || ((message) => process.stderr.write(`${message}\n`));
    warn(reminder);
  }
  const runSync = dependencies.runSync || runPlanningSync;
  return runNonBlockingPlanningSync(() => runSync({ root: repoRoot, trigger, sourceGroups }));
}

// 직접 실행(Claude Stop 훅) 시에만 동작. import(테스트/Codex 어댑터) 시엔 함수만 노출.
if (isMain(import.meta.url)) {
  runPlanningSyncIfRelevant();
}
