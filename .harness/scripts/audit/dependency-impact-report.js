#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const [outputPath = "dependency-impact-report.md", osvResultsPath = "osv-results.json"] =
  process.argv.slice(2);

const DEPENDENCY_SECTIONS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

const MANUAL_REVIEW_PATTERNS = [
  /^next$/,
  /^react$/,
  /^react-dom$/,
  /^@nestjs\//,
  /^express$/,
  /^prisma$/,
  /^@prisma\//,
  /^typeorm$/,
  /^drizzle-orm$/,
  /^better-auth$/,
  /^next-auth$/,
  /^stripe$/,
  /^@stripe\//,
];

const severityRank = {
  none: 0,
  low: 1,
  medium: 2,
  moderate: 2,
  high: 3,
  critical: 4,
  unknown: 1,
};

function git(args, options = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    ...options,
  }).trim();
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonFromGit(ref, filePath) {
  try {
    const raw = git(["show", `${ref}:${filePath}`]);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function changedFiles() {
  const baseSha = process.env.BASE_SHA;
  const headSha = process.env.HEAD_SHA || "HEAD";

  if (baseSha) {
    return git(["diff", "--name-only", `${baseSha}...${headSha}`])
      .split("\n")
      .filter(Boolean);
  }

  return git(["diff", "--name-only", "HEAD^", "HEAD"]).split("\n").filter(Boolean);
}

function dependencyMap(pkgJson) {
  const result = new Map();
  for (const section of DEPENDENCY_SECTIONS) {
    for (const [name, version] of Object.entries(pkgJson?.[section] ?? {})) {
      result.set(name, { name, version: String(version), section });
    }
  }
  return result;
}

function changedPackages(packageJsonPath) {
  const baseSha = process.env.BASE_SHA;
  const before = baseSha ? readJsonFromGit(baseSha, packageJsonPath) : null;
  const after = fs.existsSync(packageJsonPath) ? readJsonFile(packageJsonPath) : null;
  const beforeDeps = dependencyMap(before);
  const afterDeps = dependencyMap(after);
  const names = new Set([...beforeDeps.keys(), ...afterDeps.keys()]);
  const changes = [];

  for (const name of [...names].sort()) {
    const previous = beforeDeps.get(name);
    const current = afterDeps.get(name);
    if (previous?.version === current?.version && previous?.section === current?.section) {
      continue;
    }

    changes.push({
      name,
      section: current?.section ?? previous?.section ?? "unknown",
      before: previous?.version ?? "not present",
      after: current?.version ?? "removed",
      manualReview: MANUAL_REVIEW_PATTERNS.some((pattern) => pattern.test(name)),
    });
  }

  return changes;
}

function normalizeSeverity(value) {
  if (!value) return "unknown";
  const normalized = String(value).toLowerCase();
  if (normalized === "moderate") return "medium";
  if (severityRank[normalized] !== undefined) return normalized;

  const numeric = Number.parseFloat(normalized);
  if (!Number.isNaN(numeric)) {
    if (numeric >= 9) return "critical";
    if (numeric >= 7) return "high";
    if (numeric >= 4) return "medium";
    if (numeric > 0) return "low";
    return "none";
  }

  return "unknown";
}

function vulnerabilitySeverity(vulnerability) {
  const candidates = [];
  const databaseSeverity = normalizeSeverity(vulnerability?.database_specific?.severity);
  if (databaseSeverity) candidates.push(databaseSeverity);

  for (const severity of vulnerability?.severity ?? []) {
    candidates.push(normalizeSeverity(severity?.score));
  }

  return candidates.reduce(
    (highest, current) => (severityRank[current] > severityRank[highest] ? current : highest),
    "unknown",
  );
}

function osvSummary(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      available: false,
      total: 0,
      counts: { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 },
      top: [],
    };
  }

  const data = readJsonFile(filePath);
  const findings = [];
  const seen = new Set();

  for (const result of data.results ?? []) {
    const source = result?.source?.path ?? "unknown-source";
    for (const packageResult of result?.packages ?? []) {
      const pkg = packageResult?.package ?? {};
      for (const vulnerability of packageResult?.vulnerabilities ?? []) {
        const id = vulnerability?.id ?? "unknown-id";
        const key = [source, pkg.ecosystem, pkg.name, pkg.version, id].join("|");
        if (seen.has(key)) continue;
        seen.add(key);

        findings.push({
          id,
          severity: vulnerabilitySeverity(vulnerability),
          packageName: pkg.name ?? "unknown-package",
          version: pkg.version ?? "unknown-version",
          source,
        });
      }
    }
  }

  const counts = { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 };
  for (const finding of findings) {
    counts[finding.severity] = (counts[finding.severity] ?? 0) + 1;
  }

  findings.sort((left, right) => severityRank[right.severity] - severityRank[left.severity]);

  return {
    available: true,
    total: findings.length,
    counts,
    top: findings.slice(0, 10),
  };
}

function bulletList(values, emptyText) {
  if (values.length === 0) return `- ${emptyText}`;
  return values.map((value) => `- ${value}`).join("\n");
}

function relativeLockfileLabel(filePath) {
  if (filePath.endsWith("package-lock.json")) return "npm lockfile";
  if (filePath.endsWith("pnpm-lock.yaml")) return "pnpm lockfile";
  if (filePath.endsWith("npm-shrinkwrap.json")) return "npm shrinkwrap";
  return "dependency file";
}

const files = changedFiles();
const packageJsonFiles = files.filter((file) => file.endsWith("package.json"));
const lockFiles = files.filter((file) =>
  ["package-lock.json", "npm-shrinkwrap.json", "pnpm-lock.yaml", "pnpm-workspace.yaml"].some(
    (suffix) => file.endsWith(suffix),
  ),
);

const directChanges = packageJsonFiles.flatMap((file) =>
  changedPackages(file).map((change) => ({ ...change, file })),
);
const osv = osvSummary(osvResultsPath);
const manualReviewChanges = directChanges.filter((change) => change.manualReview);
const runtimeChanges = directChanges.filter((change) =>
  ["dependencies", "optionalDependencies", "peerDependencies"].includes(change.section),
);
const devChanges = directChanges.filter((change) => change.section === "devDependencies");

const lines = [
  "<!-- codi-dependency-impact-report -->",
  "## Dependency Update Impact Report",
  "",
  "### 변경 범위",
  bulletList(
    files.map((file) => `\`${file}\``),
    "변경된 dependency 파일을 찾지 못했습니다.",
  ),
  "",
  "### 직접 dependency 변경",
  bulletList(
    directChanges.map((change) => {
      const marker = change.manualReview ? " [manual-review]" : "";
      return `\`${change.name}\` (${change.section}, ${change.file}): \`${change.before}\` -> \`${change.after}\`${marker}`;
    }),
    "package.json의 직접 dependency 변경은 없습니다. lockfile 전이 변경으로 보입니다.",
  ),
  "",
  "### 영향도 힌트",
  bulletList(
    [
      runtimeChanges.length > 0
        ? `runtime dependency 변경 ${runtimeChanges.length}건: 앱 실행 경로 smoke check가 필요합니다.`
        : null,
      devChanges.length > 0
        ? `devDependency 변경 ${devChanges.length}건: install/build/test 도구 체인 영향이 주 대상입니다.`
        : null,
      lockFiles.length > 0
        ? `${lockFiles.map((file) => `${relativeLockfileLabel(file)} \`${file}\``).join(", ")} 변경: 전이 dependency 업데이트가 포함될 수 있습니다.`
        : null,
      manualReviewChanges.length > 0
        ? `manual-review 패키지 ${manualReviewChanges.length}건: changelog와 breaking change를 사람이 확인해야 합니다.`
        : null,
    ].filter(Boolean),
    "runtime 직접 변경 없이 dependency 파일만 변경되었습니다.",
  ),
  "",
  "### OSV 요약",
  osv.available
    ? `- total=${osv.total}, critical=${osv.counts.critical}, high=${osv.counts.high}, medium=${osv.counts.medium}, low=${osv.counts.low}, unknown=${osv.counts.unknown}`
    : "- OSV artifact를 찾지 못했습니다. Actions의 OSV PR scan 로그를 확인하세요.",
  ...osv.top.map(
    (finding) =>
      `- ${finding.severity.toUpperCase()} ${finding.id} \`${finding.packageName}@${finding.version}\` in \`${finding.source}\``,
  ),
  "",
  "### 권장 agent 검증",
  "- `gstack`: `cso` -> `review` -> `qa` 순서로 보안, diff, smoke risk를 확인합니다.",
  "- `superpowers`: 실패가 있으면 `systematic-debugging`, 구현 수정이 필요하면 `test-driven-development`를 사용합니다.",
  "- 자동 병합 후보라도 manual-review 패키지나 OSV high 이상이 있으면 사람이 최종 확인합니다.",
];

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${lines.join("\n")}\n`);
