#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const modes = {
  "split-front-back": {
    description: "apps/front and apps/back are both active.",
    apps: {
      front: { enabled: true, owns: ["ui", "frontend", "next"] },
      back: { enabled: true, owns: ["api", "backend", "server"] },
    },
    guidance: [
      "Frontend work uses codi-frontend.",
      "Backend work uses codi-backend.",
      "apps/front/** and apps/back/** are both allowed.",
      "NestJS backend work also loads nestjs-expert.",
    ],
  },
  "next-fullstack": {
    description: "apps/front owns UI and backend behavior through Next.js.",
    apps: {
      front: { enabled: true, owns: ["ui", "frontend", "next", "api", "backend", "server"] },
      back: { enabled: false, owns: [] },
    },
    guidance: [
      "Do not create or modify apps/back/**.",
      "Use codi-frontend for route handlers, server actions, and server components.",
      "Do not inject codi-backend unless the profile changes.",
    ],
  },
  "frontend-only": {
    description: "apps/front is the only active app surface; no backend surface is allowed.",
    apps: {
      front: { enabled: true, owns: ["ui", "frontend"] },
      back: { enabled: false, owns: [] },
    },
    guidance: [
      "Do not create or modify apps/back/**.",
      "There is no API/backend surface in this mode.",
      "If backend work is requested, confirm whether the project profile should change first.",
    ],
  },
  "backend-only": {
    description: "apps/back is the only active app surface; no frontend surface is allowed.",
    apps: {
      front: { enabled: false, owns: [] },
      back: { enabled: true, owns: ["api", "backend", "server"] },
    },
    guidance: [
      "Do not create or modify apps/front/**.",
      "Use codi-backend for API, server, Express, and NestJS work.",
      "If frontend work is requested, confirm whether the project profile should change first.",
    ],
  },
};

const profilePath = join(process.cwd(), ".harness", "config", "project-profile.yaml");
const command = process.argv[2] || "show";
const modeArg = process.argv[3];

function readProfile() {
  if (!existsSync(profilePath)) return "";
  return readFileSync(profilePath, "utf8");
}

function readMode() {
  const match = readProfile().match(/^\s*mode:\s*([A-Za-z0-9_-]+)/m);
  return match?.[1] || "split-front-back";
}

function writeProfile(mode) {
  const config = modes[mode];
  mkdirSync(dirname(profilePath), { recursive: true });
  writeFileSync(profilePath, renderProfile(mode, config));
}

function renderList(values, indent) {
  if (values.length === 0) return `${" ".repeat(indent)}[]\n`;
  return values.map((value) => `${" ".repeat(indent)}- ${value}\n`).join("");
}

function renderProfile(mode, config) {
  const front = config.apps.front;
  const back = config.apps.back;
  return `# Project profile controls which app surfaces are allowed.
#
# Supported modes:
# - split-front-back: apps/front + apps/back are both active.
# - next-fullstack: apps/front owns UI and backend behavior through Next.js.
# - frontend-only: apps/front only, with no API/backend surface.
# - backend-only: apps/back only, with no frontend surface.
#
# Change this file deliberately during project initialization or architecture review.

mode: ${mode}

apps:
  front:
    path: apps/front
    enabled: ${front.enabled}
    owns:
${renderList(front.owns, 6)}  back:
    path: apps/back
    enabled: ${back.enabled}
    owns:
${renderList(back.owns, 6)}
rules:
  split-front-back:
    forbidden_paths: []
    frontend_owner_skill: codi-frontend
    backend_owner_skill: codi-backend
    notes:
      - apps/front owns UI, frontend integration, React, and Next.js UI work.
      - apps/back owns API, backend, server, Express, and NestJS work.
      - Use codi-frontend for frontend work and codi-backend for backend work.
  next-fullstack:
    forbidden_paths:
      - apps/back/**
    backend_owner_skill: codi-frontend
    notes:
      - Do not create files under apps/back.
      - Do not use codi-backend for Next.js route handlers, server actions, or server components.
      - Use codi-frontend for full-stack Next.js work unless the project profile changes.
  frontend-only:
    forbidden_paths:
      - apps/back/**
    backend_owner_skill: codi-frontend
    notes:
      - Do not create files under apps/back.
      - This profile has no API/backend surface.
      - Confirm a profile change before accepting backend work.
  backend-only:
    forbidden_paths:
      - apps/front/**
    backend_owner_skill: codi-backend
    notes:
      - Do not create files under apps/front.
      - Use codi-backend for API, server, Express, and NestJS work.
      - Confirm a profile change before accepting frontend work.
`;
}

function printMode(mode) {
  const config = modes[mode];
  if (!config) {
    console.log(`Current mode: ${mode}`);
    console.log("This mode is not one of the official harness profiles.");
    return;
  }

  console.log(`Current mode: ${mode}`);
  console.log(config.description);
  for (const line of config.guidance) {
    console.log(`- ${line}`);
  }
}

function printUsage() {
  console.error("Usage: ./harness profile <list|show|set|check> [mode]");
}

function fail(message) {
  console.error(`fail: ${message}`);
  process.exitCode = 1;
}

function scalarValue(text, key) {
  const match = text.match(new RegExp(`^[ \\t]*${key}:\\s*([^\\n#]+)`, "m"));
  return match?.[1]?.trim() ?? "";
}

function appBlock(text, app) {
  const match = text.match(new RegExp(`^[ ]{2}${app}:\\n([\\s\\S]*?)(?=^[ ]{2}\\w|^rules:|(?![\\s\\S]))`, "m"));
  return match?.[1] ?? "";
}

function ruleBlock(text, mode) {
  const match = text.match(new RegExp(`^[ ]{2}${mode}:\\n([\\s\\S]*?)(?=^[ ]{2}[A-Za-z0-9_-]+:|(?![\\s\\S]))`, "m"));
  return match?.[1] ?? "";
}

function listValues(block, key) {
  const match = block.match(new RegExp(`^[ \\t]*${key}:\\n([\\s\\S]*?)(?=^[ \\t]*[A-Za-z_]+:|(?![\\s\\S]))`, "m"));
  if (!match) return [];
  const body = match[1];
  if (/^\s*\[\]\s*$/m.test(body)) return [];
  return body
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*-\s+(.+?)\s*$/)?.[1])
    .filter(Boolean);
}

function checkProfile() {
  const text = readProfile();
  let failures = 0;

  if (!text.trim()) {
    fail(".harness/config/project-profile.yaml is missing or empty");
    process.exit(1);
  }

  const mode = readMode();
  const config = modes[mode];
  if (!config) {
    fail(`Unsupported mode: ${mode}`);
    failures += 1;
  }

  for (const app of ["front", "back"]) {
    const expected = config?.apps?.[app];
    const block = appBlock(text, app);
    if (!block.trim()) {
      fail(`apps.${app} is missing`);
      failures += 1;
      continue;
    }

    const expectedPath = `apps/${app}`;
    const actualPath = scalarValue(block, "path");
    if (actualPath !== expectedPath) {
      fail(`apps.${app}.path must be ${expectedPath}`);
      failures += 1;
    }

    if (expected) {
      const enabled = scalarValue(block, "enabled");
      if (enabled !== String(expected.enabled)) {
        fail(`${expectedPath} enabled must be ${expected.enabled} for ${mode}`);
        failures += 1;
      }
    }
  }

  if (config) {
    const activeRule = ruleBlock(text, mode);
    const forbidden = listValues(activeRule, "forbidden_paths");
    const expectedForbidden =
      mode === "next-fullstack" || mode === "frontend-only"
        ? ["apps/back/**"]
        : mode === "backend-only"
          ? ["apps/front/**"]
          : [];
    for (const value of expectedForbidden) {
      if (!forbidden.includes(value)) {
        fail(`${mode} must include forbidden path ${value}`);
        failures += 1;
      }
    }
  }

  if (failures > 0) process.exit(1);
  console.log(`ok: project profile ${mode}`);
}

if (command === "list") {
  for (const [mode, config] of Object.entries(modes)) {
    console.log(`${mode}: ${config.description}`);
  }
  process.exit(0);
}

if (command === "show") {
  printMode(readMode());
  process.exit(0);
}

if (command === "check") {
  checkProfile();
  process.exit(0);
}

if (command === "set") {
  readProfile();
  if (!modeArg || !modes[modeArg]) {
    console.error(`Unsupported mode: ${modeArg || ""}`);
    console.error(`Supported modes: ${Object.keys(modes).join(", ")}`);
    process.exit(2);
  }

  writeProfile(modeArg);
  printMode(modeArg);
  console.log("Record this architecture decision in .planning/ when GSD state exists.");
  process.exit(0);
}

printUsage();
process.exit(2);
