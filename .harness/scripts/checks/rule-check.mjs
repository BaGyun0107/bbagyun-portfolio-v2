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
    .sort()
    .flatMap((name) => {
      const fullPath = join(fullDir, name);
      if (statSync(fullPath).isDirectory()) {
        return listFiles(`${dir}/${name}`, suffix);
      }
      return name.endsWith(suffix) ? [`${dir}/${name}`] : [];
    });
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

// execpolicy validates that every `match` example matches at least one declared
// rule, else it refuses to load the WHOLE .codex/rules/ directory (one broken
// file disables every Codex guardrail). prefix_rule matches on argv TOKENS, and
// the colon in `e2e:changed` is NOT a token separator, so the token after
// `mise run` is the single token `e2e:changed` -- which a pattern ending in the
// bare token `e2e` does not match. That exact shape (this bug) broke the whole
// .codex/rules/ load.
//
// We do NOT re-implement execpolicy's shell-quote-aware tokenizer in JS -- that
// would be fragile (escaped quotes, $VARs) and the mirror-map warns against it.
// We narrowly check the case this bug belongs to: an example's leading
// whitespace-delimited token equal to the pattern's first token, where a later
// pattern token is a bare word (no quotes/spaces) but the example's token at
// that position differs only by a trailing `:suffix` (or similar) -- i.e. the
// pattern token is a strict prefix of the example token but not equal. Examples
// containing embedded quotes are skipped (their tokenization needs the real
// parser; codex loads them fine today).
function looksTokenSafe(example) {
  // Skip examples whose tokenization depends on shell quoting we don't model.
  return !example.includes('"') && !example.includes("'");
}

function requirePrefixExamplesMatchPattern(path) {
  const body = read(path);
  const ruleBlocks = body.match(/prefix_rule\(([\s\S]*?)^\)/gm) ?? [];
  for (const block of ruleBlocks) {
    const patternMatch = block.match(/pattern\s*=\s*\[([^\]]*)\]/);
    if (!patternMatch) continue;
    const patternTokens = (patternMatch[1].match(/"([^"]*)"/g) ?? []).map((s) =>
      s.slice(1, -1),
    );
    if (patternTokens.length === 0) continue;

    // Only the `match` list: its examples MUST match the pattern. `not_match`
    // examples are deliberately chosen NOT to match (e.g. "pnpm test" under a
    // ["pnpm","install"] pattern), so checking them here would be backwards and
    // would false-fail. The leading [\s,(] boundary stops this regex from also
    // matching the `match` substring inside `not_match = [...]`.
    const listMatch = block.match(/(?:^|[\s,(])match\s*=\s*\[([\s\S]*?)\]/);
    if (!listMatch) continue;
    const examples = (listMatch[1].match(/"((?:[^"\\]|\\.)*)"/g) ?? []).map((s) =>
      s.slice(1, -1).replace(/\\"/g, '"'),
    );
    for (const example of examples) {
      if (!looksTokenSafe(example)) continue;
      const exampleTokens = example.trim().split(/\s+/).filter(Boolean);
      if (exampleTokens.length < patternTokens.length) {
        fail(
          `${path}: prefix_rule match example "${example}" has fewer tokens ` +
            `than pattern [${patternTokens.join(" ")}] (execpolicy would refuse ` +
            `to load the whole .codex/rules/ dir)`,
        );
        continue;
      }
      patternTokens.forEach((patTok, i) => {
        if (exampleTokens[i] !== patTok) {
          fail(
            `${path}: prefix_rule match example "${example}" token ` +
              `"${exampleTokens[i]}" != pattern token "${patTok}" at position ` +
              `${i} (colon/suffix mismatch like e2e vs e2e:changed breaks the ` +
              `whole .codex/rules/ load)`,
          );
        }
      });
    }
  }
}

function requireResolvableRuleRefs(path) {
  const body = read(path);
  for (const match of body.match(/\.claude\/rules\/[\w./-]+/g) ?? []) {
    const target = match.replace(/[.,:;]+$/, "");
    // lock 모드(specs/006): 공유 룰 참조는 shared/ 링크 경유로 존재할 수 있다.
    const sharedVariant = target.replace(
      /^\.claude\/rules\//,
      ".claude/rules/shared/",
    );
    if (
      !existsSync(join(root, target)) &&
      !existsSync(join(root, sharedVariant))
    ) {
      fail(`${path} reference ${target} must resolve to an existing path`);
    }
  }
}

const claudeRules = listFiles(".claude/rules", ".md");
const claudeTopLevelRules = claudeRules.filter(
  (path) => !path.slice(".claude/rules/".length).includes("/"),
);
const codexRules = listFiles(".codex/rules", ".rules");
const docs = policyCorpus();
const doctor = read(".harness/scripts/checks/doctor.sh");

for (const path of claudeTopLevelRules) {
  requireReferenced(path, docs);
  requireDoctor(path, doctor);
}

for (const path of claudeRules) {
  requireResolvableRuleRefs(path);
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
  requirePrefixExamplesMatchPattern(path);
}

// lock 모드(specs/006)에서는 공유 룰이 .claude/rules/shared/ 링크 경유로
// 제공된다 — 두 위치 모두 짝으로 인정한다.
const claudeSharedRules = claudeRules.filter((path) =>
  path.startsWith(".claude/rules/shared/"),
);
const claudeBases = new Set([
  ...claudeTopLevelRules.map((path) => baseName(path, ".md")),
  ...claudeSharedRules.map((path) => baseName(path, ".md")),
]);
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
