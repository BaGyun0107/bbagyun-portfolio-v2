#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`fail: ${message}`);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function hasFile(path) {
  return existsSync(join(root, path));
}

function appDirs() {
  const apps = join(root, "apps");
  if (!existsSync(apps) || !statSync(apps).isDirectory()) return [];
  return readdirSync(apps)
    .map((name) => `apps/${name}`)
    .filter((dir) => hasFile(`${dir}/package.json`))
    .sort();
}

function appStack(dir) {
  const pkg = readJson(join(root, dir, "package.json"));
  const deps = {
    ...(pkg?.dependencies ?? {}),
    ...(pkg?.devDependencies ?? {}),
    ...(pkg?.peerDependencies ?? {}),
  };
  if (deps.next || deps["@nestjs/core"]) return "pnpm";
  if (deps.react || deps.express) return "npm";
  return null;
}

function checkAppLockfile(dir) {
  const expected = appStack(dir);
  if (!expected) return;

  const hasPnpm = hasFile(`${dir}/pnpm-lock.yaml`);
  const hasNpm = hasFile(`${dir}/package-lock.json`) || hasFile(`${dir}/npm-shrinkwrap.json`);

  if (expected === "pnpm" && hasNpm) {
    fail(`${dir} uses pnpm stack but has an npm lockfile`);
  }
  if (expected === "npm" && hasPnpm) {
    fail(`${dir} uses npm stack but has pnpm-lock.yaml`);
  }
}

const dirs = appDirs();
if (dirs.length > 0) {
  if (hasFile("pnpm-workspace.yaml")) {
    fail("app monorepos must not define a root pnpm-workspace.yaml");
  }

  const rootPkg = readJson(join(root, "package.json"));
  if (rootPkg?.workspaces) {
    fail("app monorepos must not define root package.json workspaces");
  }

  for (const dir of dirs) {
    checkAppLockfile(dir);
  }
}

if (failures > 0) {
  console.error(`\nPackage policy check complete: ${failures} failure(s)`);
  process.exit(1);
}

console.log("ok: package policy checks passed");
