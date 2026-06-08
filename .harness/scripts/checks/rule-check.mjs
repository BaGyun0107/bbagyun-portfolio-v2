#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`fail: ${message}`);
}

function read(path) {
  try {
    return readFileSync(join(root, path), "utf8");
  } catch {
    return "";
  }
}

function listFiles(dir, suffix) {
  const fullDir = join(root, dir);
  if (!existsSync(fullDir)) return [];

  return readdirSync(fullDir)
    .filter((name) => {
      const fullPath = join(fullDir, name);
      return statSync(fullPath).isFile() && name.endsWith(suffix);
    })
    .sort()
    .map((name) => `${dir}/${name}`);
}

function policyCorpus() {
  const policyDir = join(root, ".harness", "policies");
  const policyFiles = existsSync(policyDir)
    ? readdirSync(policyDir)
        .filter((name) => name.endsWith(".md"))
        .map((name) => `.harness/policies/${name}`)
    : [];

  return [...policyFiles, "AGENTS.md", "CLAUDE.md", "CONTRIBUTING.md"]
    .map((path) => read(path))
    .join("\n");
}

function baseName(path, suffix) {
  return path.split("/").pop().slice(0, -suffix.length);
}

function requireReferenced(path, docs) {
  const name = path.split("/").pop();
  if (!docs.includes(path) && !docs.includes(name)) {
    fail(`${path} must be referenced by .harness policy or entrypoint docs`);
  }
}

function requireDoctor(path, doctor) {
  if (!doctor.includes(path)) {
    fail(`doctor.sh must require ${path}`);
  }
}

const claudeRules = listFiles(".claude/rules", ".md");
const codexRules = listFiles(".codex/rules", ".rules");
const docs = policyCorpus();
const doctor = read(".harness/scripts/checks/doctor.sh");

for (const path of claudeRules) {
  requireReferenced(path, docs);
  requireDoctor(path, doctor);
}

for (const path of codexRules) {
  requireReferenced(path, docs);
  requireDoctor(path, doctor);

  const body = read(path);
  if (!body.includes("prefix_rule(")) {
    fail(`${path} must declare at least one prefix_rule()`);
  }
  if (!/decision\s*=\s*"(?:allow|prompt|forbidden)"/.test(body)) {
    fail(`${path} must declare an allow, prompt, or forbidden decision`);
  }
}

const claudeBases = new Set(claudeRules.map((path) => baseName(path, ".md")));
for (const path of codexRules) {
  const base = baseName(path, ".rules");
  if (!claudeBases.has(base)) {
    fail(`${path} must have a matching .claude/rules/${base}.md narrative rule`);
  }
}

if (failures > 0) {
  console.error(`\nRule lifecycle check complete: ${failures} failure(s)`);
  process.exit(1);
}

console.log("ok: rule lifecycle checks passed");
