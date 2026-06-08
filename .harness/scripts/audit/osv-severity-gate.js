#!/usr/bin/env node

const fs = require("fs");

const [filePath, failSeverityInput = "high"] = process.argv.slice(2);

if (!filePath) {
  console.error("Usage: osv-severity-gate.js <osv-results.json> [fail-severity]");
  process.exit(2);
}

const rankBySeverity = {
  none: 0,
  low: 1,
  medium: 2,
  moderate: 2,
  high: 3,
  critical: 4,
  unknown: 1,
};

const labelByRank = {
  0: "none",
  1: "low",
  2: "medium",
  3: "high",
  4: "critical",
};

const failRank = rankBySeverity[failSeverityInput.toLowerCase()] ?? rankBySeverity.high;

function roundUp1(value) {
  return Math.ceil(value * 10) / 10;
}

function cvss3Score(vector) {
  const parts = Object.fromEntries(
    vector
      .split("/")
      .filter((part) => part.includes(":"))
      .map((part) => {
        const [key, value] = part.split(":");
        return [key, value];
      }),
  );

  const scopeChanged = parts.S === "C";
  const av = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 }[parts.AV];
  const ac = { L: 0.77, H: 0.44 }[parts.AC];
  const pr = {
    N: 0.85,
    L: scopeChanged ? 0.68 : 0.62,
    H: scopeChanged ? 0.5 : 0.27,
  }[parts.PR];
  const ui = { N: 0.85, R: 0.62 }[parts.UI];
  const c = { H: 0.56, L: 0.22, N: 0 }[parts.C];
  const i = { H: 0.56, L: 0.22, N: 0 }[parts.I];
  const a = { H: 0.56, L: 0.22, N: 0 }[parts.A];

  if ([av, ac, pr, ui, c, i, a].some((value) => value === undefined)) {
    return null;
  }

  const impactSubScore = 1 - (1 - c) * (1 - i) * (1 - a);
  const impact = scopeChanged
    ? 7.52 * (impactSubScore - 0.029) - 3.25 * Math.pow(impactSubScore - 0.02, 15)
    : 6.42 * impactSubScore;
  const exploitability = 8.22 * av * ac * pr * ui;

  if (impact <= 0) {
    return 0;
  }

  const baseScore = scopeChanged
    ? Math.min(1.08 * (impact + exploitability), 10)
    : Math.min(impact + exploitability, 10);
  return roundUp1(baseScore);
}

function severityFromScore(score) {
  if (score >= 9) return "critical";
  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  if (score > 0) return "low";
  return "none";
}

function normalizeSeverity(value) {
  if (!value) return null;
  const normalized = String(value).toLowerCase();
  if (normalized === "moderate") return "medium";
  if (rankBySeverity[normalized] !== undefined) return normalized;

  const numeric = Number.parseFloat(normalized);
  if (!Number.isNaN(numeric)) {
    return severityFromScore(numeric);
  }

  if (normalized.startsWith("cvss:3.")) {
    const score = cvss3Score(value);
    return score === null ? null : severityFromScore(score);
  }

  return null;
}

function vulnerabilitySeverity(vulnerability) {
  const candidates = [];

  const databaseSeverity = normalizeSeverity(vulnerability?.database_specific?.severity);
  if (databaseSeverity) candidates.push(databaseSeverity);

  for (const severity of vulnerability?.severity ?? []) {
    const parsed = normalizeSeverity(severity?.score);
    if (parsed) candidates.push(parsed);
  }

  if (candidates.length === 0) return "unknown";

  return candidates.reduce((highest, current) =>
    rankBySeverity[current] > rankBySeverity[highest] ? current : highest,
  );
}

function readResults(path) {
  const raw = fs.readFileSync(path, "utf8").trim();
  if (!raw) return { results: [] };
  return JSON.parse(raw);
}

const data = readResults(filePath);
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
        ecosystem: pkg.ecosystem ?? "unknown-ecosystem",
        source,
      });
    }
  }
}

const counts = { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 };
for (const finding of findings) {
  counts[finding.severity] = (counts[finding.severity] ?? 0) + 1;
}

console.log(
  `OSV findings: total=${findings.length}, critical=${counts.critical}, high=${counts.high}, medium=${counts.medium}, low=${counts.low}, unknown=${counts.unknown}`,
);

for (const finding of findings.slice(0, 50)) {
  const message = `${finding.severity.toUpperCase()} ${finding.id} ${finding.packageName}@${finding.version} (${finding.ecosystem}) in ${finding.source}`;
  if (rankBySeverity[finding.severity] >= failRank) {
    console.log(`::error::${message}`);
  } else {
    console.log(`::warning::${message}`);
  }
}

if (findings.length > 50) {
  console.log(`::warning::${findings.length - 50} additional OSV findings omitted from annotations. See workflow artifact for full JSON.`);
}

const blocking = findings.filter((finding) => rankBySeverity[finding.severity] >= failRank);
if (blocking.length > 0) {
  console.error(
    `OSV severity gate failed: ${blocking.length} finding(s) at ${labelByRank[failRank]} or higher.`,
  );
  process.exit(1);
}
