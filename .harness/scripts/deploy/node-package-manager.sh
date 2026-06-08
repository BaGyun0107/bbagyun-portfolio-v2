#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="${1:-.}"

node -e '
  const fs = require("fs");
  const path = require("path");

  const target = path.resolve(process.argv[1]);
  const pkgPath = path.join(target, "package.json");

  if (!fs.existsSync(pkgPath)) {
    console.error(`package.json not found: ${pkgPath}`);
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const manager = typeof pkg.packageManager === "string" ? pkg.packageManager.split("@")[0] : "";
  if (manager) {
    console.log(manager);
    process.exit(0);
  }

  if (fs.existsSync(path.join(target, "pnpm-lock.yaml"))) {
    console.log("pnpm");
    process.exit(0);
  }

  if (fs.existsSync(path.join(target, "package-lock.json")) || fs.existsSync(path.join(target, "npm-shrinkwrap.json"))) {
    console.log("npm");
    process.exit(0);
  }

  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  if (deps.next || Object.keys(deps).some((name) => name.startsWith("@nestjs/"))) {
    console.log("pnpm");
    process.exit(0);
  }

  if (deps.express || deps.vite || deps["@vitejs/plugin-react"] || deps.react) {
    console.log("npm");
    process.exit(0);
  }

  console.log("npm");
' "$TARGET_DIR"
