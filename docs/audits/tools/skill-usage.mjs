// Skill usage measurement for harness audits. Runtime-neutral: run with
// `node docs/audits/tools/skill-usage.mjs --since 2026-07-07`
// Scans Claude Code MAIN session transcripts (~/.claude/projects/*/*.jsonl,
// subagent files excluded) and counts three signals per skill:
//   - Skill tool_use invocations
//   - SlashCommand tool_use invocations
//   - user-typed slash commands (<command-name> entries)
// Output is deterministic: sorted by count desc, then name asc.

import { createReadStream, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { homedir } from "node:os";

const args = process.argv.slice(2);
function flag(name, dflt) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
}
const SINCE = flag("since", "2026-07-07");
const UNTIL = flag("until", "9999-12-31");
const OUT = flag("out", "");

const ROOT = join(homedir(), ".claude", "projects");
const files = [];
for (const dir of readdirSync(ROOT)) {
  let entries;
  try { entries = readdirSync(join(ROOT, dir)); } catch { continue; }
  for (const f of entries) {
    if (f.endsWith(".jsonl")) files.push({ path: join(ROOT, dir, f), project: dir });
  }
}

const bySkill = new Map();
function record(skill, project, ts) {
  const day = (ts || "").slice(0, 10);
  if (!day || day < SINCE || day > UNTIL) return;
  const k = skill.replace(/^superpowers:/, "");
  let e = bySkill.get(k);
  if (!e) { e = { count: 0, projects: {}, last: "" }; bySkill.set(k, e); }
  e.count += 1;
  e.projects[project] = (e.projects[project] || 0) + 1;
  if (day > e.last) e.last = day;
}

async function scan(file) {
  const rl = createInterface({ input: createReadStream(file.path), crlfDelay: Infinity });
  for await (const line of rl) {
    const hasTool = line.includes('"Skill"') || line.includes('"SlashCommand"');
    const hasTyped = line.includes("<command-name>");
    if (!hasTool && !hasTyped) continue;
    let obj;
    try { obj = JSON.parse(line); } catch { continue; }
    const content = obj?.message?.content;
    if (hasTool && Array.isArray(content)) {
      for (const c of content) {
        if (c?.type !== "tool_use") continue;
        if (c.name === "Skill" && c.input?.skill) record(c.input.skill, file.project, obj.timestamp);
        if (c.name === "SlashCommand" && typeof c.input?.command === "string") {
          const m = c.input.command.match(/^\/([a-z0-9:_-]+)/i);
          if (m) record(m[1], file.project, obj.timestamp);
        }
      }
    }
    if (hasTyped) {
      const texts = typeof content === "string"
        ? [content]
        : Array.isArray(content)
          ? content.filter((c) => c?.type === "text").map((c) => c.text || "")
          : [];
      for (const t of texts) {
        const m = t.match(/<command-name>\/?([a-z0-9:_-]+)<\/command-name>/i);
        if (m) record(m[1], file.project, obj.timestamp);
      }
    }
  }
}

for (const f of files) await scan(f);

const rows = [...bySkill.entries()]
  .map(([skill, e]) => ({ skill, ...e }))
  .sort((a, b) => b.count - a.count || (a.skill < b.skill ? -1 : 1));
const result = { since: SINCE, until: UNTIL, mainSessionFiles: files.length, rows };
if (OUT) writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n");
console.log(`window: ${SINCE} .. ${UNTIL} | main-session files: ${files.length}`);
for (const r of rows) console.log(String(r.count).padStart(5), r.skill, "last:", r.last);
if (!rows.length) console.log("(no skill invocations in window)");
