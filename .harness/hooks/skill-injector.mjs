#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MAX_SKILLS = 3;

function readInput() {
  try {
    const raw = readFileSync(0, "utf8");
    if (!raw.trim()) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matches(prompt, keyword) {
  const escaped = escapeRegex(keyword).replace(/\s+/g, "\\s+");
  if (/[^\p{ASCII}]/u.test(keyword)) {
    return new RegExp(escaped, "iu").test(prompt);
  }
  return new RegExp(`\\b${escaped}\\b`, "iu").test(prompt);
}

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

function readProjectMode(projectDir) {
  try {
    const profile = readFileSync(join(projectDir, ".harness", "config", "project-profile.yaml"), "utf8");
    const match = profile.match(/^\s*mode:\s*([A-Za-z0-9_-]+)/m);
    return match?.[1] || "split-front-back";
  } catch {
    return "split-front-back";
  }
}

function makeOutput(context) {
  return JSON.stringify({ additionalContext: context });
}

const input = readInput();
if (!input) process.exit(0);

const prompt = input.prompt || input.user_prompt || input.message || "";
if (!prompt || typeof prompt !== "string") process.exit(0);

const projectDir = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
const triggersPath = join(projectDir, ".harness", "config", "skill-triggers.json");
const triggersLocalPath = join(projectDir, ".harness", "config", "skill-triggers.local.json");
const sharedSkillsDir = join(projectDir, ".harness", "skills");
const localSkillsDir = join(projectDir, ".harness", "skills-local");

// 로컬 trigger는 skill 이름 단위로 공용 trigger 전체를 덮어쓴다.
// 공용 skill에 키워드를 추가하려면 upstream 공용 파일을 수정한다.
const triggers = { ...loadJson(triggersPath), ...loadJson(triggersLocalPath) };
const projectMode = readProjectMode(projectDir);

function findSkillDir(skillName) {
  // 로컬 skill을 먼저 찾되, skills-link가 공용/로컬 이름 충돌을 막는다.
  for (const root of [localSkillsDir, sharedSkillsDir]) {
    const candidate = join(root, skillName, "SKILL.md");
    if (existsSync(candidate)) return { path: candidate, root };
  }
  return null;
}

function relativeSkillPath(root, skillName) {
  return root === localSkillsDir
    ? `.harness/skills-local/${skillName}/SKILL.md`
    : `.harness/skills/${skillName}/SKILL.md`;
}

const scored = [];
for (const [skillName, config] of Object.entries(triggers)) {
  if (["next-fullstack", "frontend-only"].includes(projectMode) && skillName === "codi-backend") continue;
  if (projectMode === "backend-only" && skillName === "codi-frontend") continue;

  const found = findSkillDir(skillName);
  if (!found) continue;

  const matched = [];
  for (const keyword of config.keywords || []) {
    if (matches(prompt, keyword)) matched.push(keyword);
  }

  if (matched.length > 0) {
    scored.push({
      skillName,
      skillPath: relativeSkillPath(found.root, skillName),
      score: matched.length,
      matched,
    });
  }
}

scored.sort((a, b) => b.score - a.score || a.skillName.localeCompare(b.skillName));
const selected = scored.slice(0, MAX_SKILLS);
if (selected.length === 0) process.exit(0);

const lines = [
  "Codi harness matched stack skills for this prompt. Load only the relevant SKILL.md files before acting:",
  ...selected.map(
    (item) => `- ${item.skillName}: ${item.skillPath} (matched: ${item.matched.slice(0, 4).join(", ")})`,
  ),
];

process.stdout.write(makeOutput(lines.join("\n")));
