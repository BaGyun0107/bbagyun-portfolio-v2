#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const allowedSecrets = new Set([
  "INFISICAL_CLIENT_ID",
  "INFISICAL_CLIENT_SECRET",
  "GITHUB_TOKEN",
]);

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`fail: ${message}`);
}

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function walk(dir, predicate, results = []) {
  const fullDir = join(root, dir);
  if (!existsSync(fullDir)) return results;
  for (const name of readdirSync(fullDir)) {
    if (name === "node_modules" || name === ".git") continue;
    const rel = `${dir}/${name}`;
    const full = join(root, rel);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(rel, predicate, results);
    } else if (predicate(rel)) {
      results.push(rel);
    }
  }
  return results.sort();
}

function workflowFiles() {
  return walk(".github/workflows", (path) => /\.ya?ml$/i.test(path));
}

function envExampleFiles() {
  return walk(".", (path) => {
    const name = path.split("/").pop();
    return /^\.env(?:\..*)?\.example$|^\.env\.example$|env\.example$/i.test(name);
  });
}

function checkWorkflowSecrets(path) {
  const body = read(path);
  for (const match of body.matchAll(/\$\{\{\s*secrets\.([A-Za-z0-9_]+)\s*\}\}/g)) {
    const name = match[1];
    if (!allowedSecrets.has(name)) {
      fail(`${path} references disallowed GitHub Secret ${name}`);
    }
  }
}

function isAllowedExampleValue(value) {
  if (value === "") return true;
  if (/^(?:change-me|changeme|example|placeholder|dummy|local|localhost|_PROJECT_ID_)/i.test(value)) {
    return true;
  }
  if (/localhost|127\.0\.0\.1|0\.0\.0\.0|example\.com|user:password/i.test(value)) {
    return true;
  }
  return false;
}

function looksSecretValue(key, value) {
  if (/BEGIN (?:OPENSSH|RSA|EC|PRIVATE) PRIVATE KEY/.test(value)) {
    return "private key material";
  }
  if (!/(SECRET|TOKEN|PASSWORD|PRIVATE_KEY|CLIENT_SECRET|DATABASE_URL|API_KEY)/i.test(key)) {
    return null;
  }
  if (isAllowedExampleValue(value)) return null;
  if (value.length >= 20 && /^[A-Za-z0-9+/=_:.-]+$/.test(value)) {
    return "real-looking secret value";
  }
  return null;
}

function checkEnvExample(path) {
  const body = read(path);
  for (const line of body.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    const reason = looksSecretValue(key, value);
    if (reason) {
      fail(`${path} contains ${reason} for ${key}`);
    }
  }
}

for (const path of workflowFiles()) checkWorkflowSecrets(path);
for (const path of envExampleFiles()) checkEnvExample(path);

if (failures > 0) {
  console.error(`\nSecret surface check complete: ${failures} failure(s)`);
  process.exit(1);
}

console.log("ok: secret surface checks passed");
