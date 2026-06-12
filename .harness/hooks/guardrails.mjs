#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

function readInput() {
  try {
    const raw = readFileSync(0, "utf8");
    if (!raw.trim()) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function block(reason) {
  process.stdout.write(
    JSON.stringify({
      decision: "block",
      reason,
    }),
  );
}

const input = readInput();
if (!input) process.exit(0);

function getRawCwd(input) {
  return (
    input?.tool_input?.cwd ||
    input?.cwd ||
    process.env.CLAUDE_PROJECT_DIR ||
    process.cwd()
  );
}

function getCwd(input) {
  const raw = getRawCwd(input);
  // 경로 비교 전에 macOS /var 리다이렉션 같은 symlink 차이를 정규화한다.
  try {
    return realpathSync(raw);
  } catch {
    return raw;
  }
}

function isInsidePath(basePath, targetPath) {
  const rel = relative(basePath, targetPath);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function currentBranch(cwd) {
  const result = spawnSync("git", ["branch", "--show-current"], {
    cwd,
    encoding: "utf8",
  });
  if (result.status !== 0) return "";
  return result.stdout.trim();
}

function isProtectedBranch(branch) {
  return branch === "main" || branch === "dev";
}

function isWriteLikeTool(toolName) {
  return ["Write", "Edit", "MultiEdit"].includes(toolName);
}

// 공용 skill을 수정할 수 있는 harness repo인지 판정한다. 애매하면
// 하위 프로젝트로 보고 .harness/skills 쓰기를 막는다.
const HARNESS_PACKAGE_NAME = "codi-harness-v2";
// 소유자/repo뿐 아니라 host까지 canonical allowlist와 일치해야 한다.
const HARNESS_CANONICAL_HOSTS = ["github.com"];
const HARNESS_CANONICAL_OWNERS = ["CODIWORKS-Engineer"];
const HARNESS_CANONICAL_REPOS = ["codi-harness", "codi-harness-v2"];

function originMatchesCanonical(remote) {
  // 정식 https, git@, ssh://git@ 형태만 허용하고 나머지는 거부한다.
  const trimmed = remote.trim().replace(/\/$/, "").replace(/\.git$/, "");
  let normalized;
  const sshShortMatch = trimmed.match(/^git@([^:]+):(.+)$/);
  if (sshShortMatch) {
    normalized = `${sshShortMatch[1]}/${sshShortMatch[2]}`;
  } else if (trimmed.startsWith("https://")) {
    normalized = trimmed.slice("https://".length);
  } else if (trimmed.startsWith("ssh://git@")) {
    normalized = trimmed.slice("ssh://git@".length);
  } else {
    return false;
  }
  const m = normalized.match(/(?:^|@)([^/]+)\/([^/]+)\/([^/]+)$/);
  if (!m) return false;
  const host = m[1];
  const owner = m[2];
  const repo = m[3];
  return (
    HARNESS_CANONICAL_HOSTS.includes(host) &&
    HARNESS_CANONICAL_OWNERS.includes(owner) &&
    HARNESS_CANONICAL_REPOS.includes(repo)
  );
}

function isHarnessRepo(cwd) {
  const pkgPath = resolve(cwd, "package.json");
  if (!existsSync(pkgPath)) return false;
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  } catch {
    return false;
  }
  if (pkg?.name !== HARNESS_PACKAGE_NAME) return false;
  const remoteResult = spawnSync("git", ["remote", "get-url", "origin"], {
    cwd,
    encoding: "utf8",
  });
  if (remoteResult.status !== 0) return false;
  return originMatchesCanonical(remoteResult.stdout);
}

// 파일 변경 도구 계열의 대상 경로를 꺼낸다.
function writeTargetPath(input) {
  const target =
    input?.tool_input?.file_path ||
    input?.tool_input?.path ||
    input?.tool_input?.filename ||
    null;
  if (typeof target !== "string" || target.length === 0) return null;
  return target;
}

function isUnderSharedSkillsTree(absolutePath, projectRoot) {
  if (!isInsidePath(projectRoot, absolutePath)) return false;
  const rel = relative(projectRoot, absolutePath);
  const posixRel = rel.split(sep).join("/");
  return (
    posixRel === ".harness/skills" ||
    posixRel.startsWith(".harness/skills/")
  );
}

function guardSharedSkillsWrite(input) {
  const toolName = input.tool_name;
  if (!isWriteLikeTool(toolName)) return false;
  const target = writeTargetPath(input);
  if (!target) return false;
  const cwd = getCwd(input);
  const projectRoot = resolveProjectRoot(cwd);
  // 대상 파일이 아직 없어도 가장 가까운 기존 부모를 realpath로 맞춘다.
  let absoluteTarget = resolve(cwd, target);
  try {
    absoluteTarget = realpathSync.native
      ? realpathSync.native(absoluteTarget)
      : realpathSync(absoluteTarget);
  } catch {
    // 파일이 없으면 가장 가까운 기존 부모만 realpath로 맞춘다.
    let probe = absoluteTarget;
    const segments = [];
    while (probe && probe !== sep) {
      try {
        const realParent = realpathSync(probe);
        absoluteTarget = segments.length === 0 ? realParent : join(realParent, ...segments.reverse());
        break;
      } catch {
        segments.push(probe.split(sep).pop());
        probe = probe.substring(0, probe.lastIndexOf(sep));
      }
    }
  }
  if (!isUnderSharedSkillsTree(absoluteTarget, projectRoot)) return false;
  if (isHarnessRepo(projectRoot)) return false;
  block(
    `Guardrails blocked write to ${relative(projectRoot, absoluteTarget) || target} under .harness/skills/. ` +
      "That tree is upstream-owned and is overwritten by ./harness update --apply-harness. " +
      "Create the new skill under .harness/skills-local/<name>/ instead. " +
      "Shared skill edits are allowed only in the canonical harness repository.",
  );
  return true;
}

function isWriteLikeBash(command) {
  return [
    /\b(?:npm|pnpm)\s+(?:install|add|i)\b/,
    /\b(?:prettier|eslint)\b[^\n;|&]*\b(?:--write|--fix)\b/,
    /\b(?:npm|pnpm)\s+run\b[^\n;|&]*(?:--write|--fix)\b/,
    /\bsed\s+-i\b/,
    /\bperl\s+-pi\b/,
    /\b(?:mv|cp|mkdir|touch)\b/,
    /\b(?:prisma|drizzle-kit|sequelize)\b[^\n;|&]*\b(?:migrate|generate|db:)/,
  ].some((pattern) => pattern.test(command));
}

// 셸 명령은 쓰기 패턴을 열거하지 않고 공용 tree를 언급하는 명령 중
// 검증된 읽기 전용 도구만 통과시킨다. `find`, `less`처럼 옵션으로
// 쓸 수 있는 도구는 허용목록에 두지 않는다. `diff`는 감사/비교에
// 필요하므로 별도 predicate에서 출력 파일 옵션 없이만 허용한다.

const SHARED_SKILLS_READONLY_TOOLS = new Set([
  "ls",
  "cat",
  "head",
  "tail",
  "more",
  "grep",
  "egrep",
  "fgrep",
  "rg",
  "wc",
  "file",
  "stat",
  "cmp",
  "md5sum",
  "sha1sum",
  "sha256sum",
  "shasum",
  "test",
  "[",
]);

function hasUnsafeDiffOption(words) {
  return words.some(
    (word) =>
      word === "--output" ||
      word.startsWith("--output=") ||
      word === "-o" ||
      word.startsWith("-o"),
  );
}

function isSafeDiffCommand(words) {
  return words[0] === "diff" && !hasUnsafeDiffOption(words);
}

// 검사 전에 shell에서 같은 경로가 되는 간단한 spelling 변형을 정규화한다.
// 변수 확장은 실제 shell 상태가 필요하므로 여기서 다루지 않는다.
function collapseParentSegments(s) {
  let cur = s;
  // 따옴표 밖 path에서 의미 없는 backslash만 제거한다.
  cur = cur.replace(/\\([A-Za-z0-9_/.\-])/g, "$1");
  // 빈 quote pair는 bash에서 no-op이다.
  cur = cur.replace(/''/g, "").replace(/""/g, "");
  // `//`와 `/./`를 반복 축약한다.
  let prev;
  do {
    prev = cur;
    cur = cur.replace(/\/\.\//g, "/").replace(/\/{2,}/g, "/");
  } while (cur !== prev);
  // 부모 traversal도 반복 축약한다.
  do {
    prev = cur;
    cur = cur.replace(/[^\s/]+\/\.\.\/(?!\.\.\/)/g, "");
  } while (cur !== prev);
  return cur;
}

// 동기 hook이 멈추지 않도록 치환 깊이와 명령 길이를 제한한다. 초과하면 차단한다.
const SUBSTITUTION_MAX_DEPTH = 32;
const COMMAND_MAX_LENGTH = 16 * 1024;

// 단순 brace expansion을 펼쳐 `.harness/{skills,foo}` 형태도 검사에 보이게 한다.
function expandBraces(s) {
  let cur = s;
  let safety = 32;
  while (safety-- > 0) {
    const m = cur.match(/\{([^{}]*)\}/);
    if (!m) break;
    const body = m[1];
    const before = cur.slice(0, m.index);
    const after = cur.slice(m.index + m[0].length);
    // 쉼표가 없는 brace는 목록 확장이 아니므로 내용만 분리해 노출한다.
    if (!body.includes(",")) {
      cur = `${before} ${body} ${after}`;
      continue;
    }
    // 앞뒤 고정 문자열을 붙인 각 variant를 독립 토큰으로 노출한다.
    const prefixMatch = before.match(/(\S*)$/);
    const prefix = prefixMatch ? prefixMatch[1] : "";
    const beforeHead = before.slice(0, before.length - prefix.length);
    const suffixMatch = after.match(/^([^\s|&;<>()`]*)/);
    const suffix = suffixMatch ? suffixMatch[1] : "";
    const afterTail = after.slice(suffix.length);
    const expanded = body
      .split(",")
      .map((v) => `${prefix}${v}${suffix}`)
      .join(" ");
    cur = `${beforeHead}${expanded}${afterTail}`;
  }
  return cur;
}

// 명령/process substitution 내부도 별도 명령처럼 재평가한다.
function extractSubstitutionBodies(command, depth = 0) {
  if (depth >= SUBSTITUTION_MAX_DEPTH) return [];
  const bodies = [];
  let i = 0;
  let quote = null;
  while (i < command.length) {
    const c = command[i];
    const next = command[i + 1];
    if (quote === "'") {
      // 단일 quote 안에서는 치환을 열지 않는다.
      if (c === "'") quote = null;
      i += 1;
      continue;
    }
    if (quote === '"') {
      // 이중 quote 안에서는 명령 substitution이 유효하다.
      if (c === "\\" && next) {
        i += 2;
        continue;
      }
      if (c === '"') {
        quote = null;
        i += 1;
        continue;
      }
      if (c === "$" && next === "(") {
        const body = readBalanced(command, i + 2, "(", ")");
        if (body) {
          bodies.push(body.text);
          bodies.push(...extractSubstitutionBodies(body.text, depth + 1));
          i = body.end + 1;
          continue;
        }
      }
      if (c === "`") {
        const body = readBacktick(command, i + 1);
        if (body) {
          bodies.push(body.text);
          bodies.push(...extractSubstitutionBodies(body.text, depth + 1));
          i = body.end + 1;
          continue;
        }
      }
      i += 1;
      continue;
    }
    if (c === "\\" && next) {
      i += 2;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      i += 1;
      continue;
    }
    if (c === "$" && next === "(") {
      const body = readBalanced(command, i + 2, "(", ")");
      if (body) {
        bodies.push(body.text);
        bodies.push(...extractSubstitutionBodies(body.text, depth + 1));
        i = body.end + 1;
        continue;
      }
    }
    if ((c === "<" || c === ">") && next === "(") {
      const body = readBalanced(command, i + 2, "(", ")");
      if (body) {
        bodies.push(body.text);
        bodies.push(...extractSubstitutionBodies(body.text, depth + 1));
        i = body.end + 1;
        continue;
      }
    }
    if (c === "`") {
      const body = readBacktick(command, i + 1);
      if (body) {
        bodies.push(body.text);
        bodies.push(...extractSubstitutionBodies(body.text, depth + 1));
        i = body.end + 1;
        continue;
      }
    }
    i += 1;
  }
  return bodies;
}

// 중첩 괄호와 quote를 고려해 matching close까지 읽는다.
function readBalanced(s, start, open, close) {
  let depth = 1;
  let i = start;
  let quote = null;
  while (i < s.length) {
    const c = s[i];
    const next = s[i + 1];
    if (quote) {
      if (quote === "'") {
        if (c === "'") quote = null;
        i += 1;
        continue;
      }
      if (c === "\\" && next) {
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i += 1;
      continue;
    }
    if (c === "\\" && next) {
      i += 2;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      i += 1;
      continue;
    }
    if (c === open) {
      depth += 1;
      i += 1;
      continue;
    }
    if (c === close) {
      depth -= 1;
      if (depth === 0) return { text: s.slice(start, i), end: i };
      i += 1;
      continue;
    }
    i += 1;
  }
  return null;
}

// 역따옴표 치환은 다음 escape되지 않은 역따옴표까지 읽는다.
function readBacktick(s, start) {
  let i = start;
  while (i < s.length) {
    const c = s[i];
    const next = s[i + 1];
    if (c === "\\" && next) {
      i += 2;
      continue;
    }
    if (c === "`") return { text: s.slice(start, i), end: i };
    i += 1;
  }
  return null;
}

// 따옴표를 존중하면서 shell control operator 기준으로 단순 명령을 나눈다.
// 치환 내부는 별도 단계에서 꺼내 검사한다.
function splitSimpleCommands(command) {
  const parts = [];
  let buf = "";
  let i = 0;
  let quote = null;
  while (i < command.length) {
    const c = command[i];
    const next = command[i + 1];
    if (quote) {
      buf += c;
      if (c === quote) quote = null;
      i += 1;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      buf += c;
      i += 1;
      continue;
    }
    if (c === "\\" && next) {
      buf += c + next;
      i += 2;
      continue;
    }
    // 두 글자 control operator.
    if ((c === "&" && next === "&") || (c === "|" && next === "|")) {
      parts.push(buf);
      buf = "";
      i += 2;
      continue;
    }
    // 한 글자 control operator.
    if (c === ";" || c === "|") {
      parts.push(buf);
      buf = "";
      i += 1;
      continue;
    }
    buf += c;
    i += 1;
  }
  if (buf.length > 0) parts.push(buf);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

// 래퍼를 벗긴 뒤 첫 토큰을 읽기 전용 allowlist와 비교한다.
const COMMAND_PREFIX_RES = [
  /^sudo(?:\s+-\S+)*\s+/,
  /^mise\s+exec\s+--\s+/,
  /^env(?:\s+-\S+)*(?:\s+[A-Za-z_][A-Za-z0-9_]*=\S*)*\s+/,
  /^command\s+(?:-\S+\s+)*/,
  /^builtin\s+/,
  /^time\s+/,
  /^nice(?:\s+-\S+)*\s+/,
  /^nohup\s+/,
];

function stripCommandPrefixes(simpleCommand) {
  let working = simpleCommand.replace(/^[\s]+/, "");
  // 앞쪽 env assignment를 제거한다.
  while (/^[A-Za-z_][A-Za-z0-9_]*=\S*\s+/.test(working)) {
    working = working.replace(/^[A-Za-z_][A-Za-z0-9_]*=\S*\s+/, "");
  }
  // 실제 도구를 바꾸지 않는 wrapper만 제거한다. xargs/parallel은 실행기라 제외한다.
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of COMMAND_PREFIX_RES) {
      if (re.test(working)) {
        working = working.replace(re, "");
        changed = true;
        break;
      }
    }
  }
  return working;
}

function firstToken(simpleCommand) {
  const working = stripCommandPrefixes(simpleCommand);
  const m = working.match(/^([^\s;|&<>]+)/);
  if (!m) return "";
  return m[1].replace(/^['"]|['"]$/g, "");
}

function commandWords(simpleCommand) {
  const working = stripCommandPrefixes(simpleCommand);
  const words = [];
  const re = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^']*)'|[^\s;|&<>]+/g;
  let m;
  while ((m = re.exec(working)) !== null) {
    words.push(m[1] ?? m[2] ?? m[0]);
  }
  return words;
}

// .harness/skills를 대상으로 하는 출력/read-write redirect를 찾는다.
function redirectTargetsSharedSkills(simpleCommand) {
  // 파일 descriptor 번호와 따옴표가 붙은 일반 redirect.
  const standardRe =
    /(?:^|\s)(?:[0-9]+|&)?(?:>>?\|?|<>)\s*['"]?\.harness\/skills(?:\/|['"]?\s|['"]?$)/;
  if (standardRe.test(simpleCommand)) return true;
  // 공용 tree를 건드리는 process substitution 출력.
  const procSubRe =
    /(?:^|\s)>\s*>\(\s*[^)]*['"]?\.harness\/skills(?:\/|['"]?\s)[^)]*\)/;
  if (procSubRe.test(simpleCommand)) return true;
  return false;
}

// 따옴표를 제거한 뒤 공용 tree 언급 여부를 본다.
function mentionsSharedSkills(simpleCommand) {
  const dequoted = simpleCommand.replace(/['"]/g, " ").replace(/\$\s+/g, "$");
  return (
    /\.harness\/skills\//.test(dequoted) ||
    /\.harness\/skills(?:\s|$)/.test(dequoted)
  );
}

function evaluateSimpleCommand(simpleCommand) {
  if (!mentionsSharedSkills(simpleCommand)) return false;
  if (redirectTargetsSharedSkills(simpleCommand)) return true;
  const tool = firstToken(simpleCommand);
  const words = commandWords(simpleCommand);
  if (isSharedSkillsIndexOnlyGitCommand(words)) return false;
  if (tool && SHARED_SKILLS_READONLY_TOOLS.has(tool)) return false;
  if (isSafeDiffCommand(commandWords(simpleCommand))) return false;
  return true;
}

// 셸 cwd가 이미 공용 skill tree 안인지 검사한다.
//
// 반환값:
//   "outside"    -- 공용 tree 밖. 일반 평가 로직 사용
//   "harness"    -- cwd = .harness. `skills/...` 상대경로가 공용 tree를 가리킴
//   "shared"     -- cwd가 .harness/skills 또는 그 하위. 모든 쓰기 명령이 공용 write
//   없음         -- 판정 불가 (projectRoot 누락 등)
function cwdSharedSkillsMode(cwd, projectRoot, rawCwd = null) {
  if (!cwd || !projectRoot) return null;
  // 1) realpath된 cwd가 프로젝트 루트 안에 들어 있으면 mode를 그대로 판정.
  if (isInsidePath(projectRoot, cwd)) {
    const rel = relative(projectRoot, cwd);
    const posixRel = rel.split(sep).join("/");
    if (posixRel === ".harness") return "harness";
    if (posixRel === ".harness/skills") return "shared";
    if (posixRel.startsWith(".harness/skills/")) return "shared";
    return "outside";
  }
  // 2) realpath로 프로젝트 밖으로 빠졌더라도 raw cwd 또는 realpath된 cwd
  //    자체에 ".harness" 세그먼트가 보이면 symlink로 redirect된 경우다.
  //    이 경우 mode는 raw 경로의 세그먼트 기준으로 판정한다.
  for (const candidate of [rawCwd, cwd]) {
    if (!candidate) continue;
    const segments = candidate.split(sep);
    const harnessIdx = segments.indexOf(".harness");
    if (harnessIdx < 0) continue;
    const rest = segments.slice(harnessIdx + 1);
    if (rest.length === 0) return "harness";
    if (rest[0] === "skills") return "shared";
    // .harness/* (skills 외)에서는 일반 평가에 맡긴다.
  }
  return "outside";
}

// 현재 경로가 공용 tree 안이어도 명백히 읽기/환경 확인인 명령만 허용한다.
const CWD_INSIDE_AMBIENT_SAFE_TOOLS = new Set([
  "pwd",
  "which",
  "type",
  "command",
  "echo",
  "printf",
  "true",
  "false",
  "date",
  "env",
  "printenv",
  "hostname",
  "uname",
  "whoami",
  "id",
  "ps",
  "top",
  "df",
  "du",
  "free",
  "uptime",
  "history",
  "alias",
  "set",
  "export",
  "declare",
  "readonly",
  "unset",
  "shopt",
  "trap",
  "jobs",
  "bg",
  "fg",
  "wait",
  "kill",
  "exit",
  "return",
  ":",
]);

const SAFE_GIT_SUBCOMMANDS = new Set([
  "status",
  "log",
  "show",
  "diff",
  "rev-parse",
  "ls-files",
  "grep",
]);

const GIT_OPTIONS_WITH_VALUE = new Set([
  "-C",
  "-c",
  "--git-dir",
  "--work-tree",
  "--namespace",
  "--super-prefix",
]);

function gitSubcommandIndex(words) {
  if (words[0] !== "git") return -1;
  for (let i = 1; i < words.length; i += 1) {
    const word = words[i];
    if (word === "--") return -1;
    if (
      GIT_OPTIONS_WITH_VALUE.has(word) ||
      word.startsWith("--git-dir=") ||
      word.startsWith("--work-tree=") ||
      word.startsWith("--namespace=") ||
      word.startsWith("--super-prefix=")
    ) {
      if (!word.includes("=")) i += 1;
      continue;
    }
    if (word.startsWith("-")) continue;
    return i;
  }
  return -1;
}

function hasUnsafeGitOption(words) {
  return words.some(
    (word) =>
      word === "--output" ||
      word.startsWith("--output=") ||
      word === "-o" ||
      word === "--ext-diff",
  );
}

function isSafeGitCommand(words) {
  if (words[0] !== "git") return false;
  if (hasUnsafeGitOption(words)) return false;
  const subcommandIndex = gitSubcommandIndex(words);
  if (subcommandIndex === -1) return true;
  const subcommand = words[subcommandIndex];
  if (SAFE_GIT_SUBCOMMANDS.has(subcommand)) return true;
  if (subcommand !== "remote") return false;
  const remoteAction = words.find(
    (word, index) => index > subcommandIndex && !word.startsWith("-"),
  );
  return !remoteAction || remoteAction === "get-url";
}

function isSharedSkillsIndexOnlyGitCommand(words) {
  if (words[0] !== "git") return false;
  const subcommandIndex = gitSubcommandIndex(words);
  if (subcommandIndex === -1) return false;
  const subcommand = words[subcommandIndex];

  // `git add .harness/skills/...` only stages an existing worktree state.
  // Downstream projects need this after `./harness update --apply-harness`
  // changes upstream-owned skills.
  if (subcommand === "add") return true;

  if (subcommand === "restore") {
    const args = words.slice(subcommandIndex + 1);
    return (
      args.some((word) => word === "--staged" || word === "-S") &&
      !args.some((word) => word === "--worktree" || word === "-W")
    );
  }

  if (subcommand === "reset") {
    const args = words.slice(subcommandIndex + 1);
    return !args.some((word) =>
      ["--hard", "--merge", "--keep", "--recurse-submodules"].includes(word),
    );
  }

  return false;
}

function isVersionOnlyCommand(words) {
  if (!["node", "npm", "pnpm", "yarn", "mise"].includes(words[0])) return false;
  if (words.length === 1) return true;
  return words.slice(1).every((word) => ["--version", "-v", "version"].includes(word));
}

function isCwdInsideAmbientSafeCommand(simpleCommand) {
  const tool = firstToken(simpleCommand);
  if (!tool) return true;
  if (SHARED_SKILLS_READONLY_TOOLS.has(tool)) return true;
  if (CWD_INSIDE_AMBIENT_SAFE_TOOLS.has(tool)) return true;
  const words = commandWords(simpleCommand);
  return isSafeDiffCommand(words) || isSafeGitCommand(words) || isVersionOnlyCommand(words);
}

function normalizeHarnessCwdTokenText(simpleCommand) {
  return simpleCommand
    .replace(/['"]/g, "")
    .replace(/(?:^|[\s|&;<>()`])\.\//g, (m) => m.slice(0, -2));
}

function mentionsHarnessCwdSharedPath(simpleCommand) {
  const dequoted = normalizeHarnessCwdTokenText(simpleCommand);
  return (
    mentionsSharedSkills(dequoted) ||
    /(?:^|[\s|&;<>()`])skills(?:\/|[\s|&;<>()`]|$)/.test(dequoted)
  );
}

function mentionsHarnessCwdLocalPath(simpleCommand) {
  const dequoted = normalizeHarnessCwdTokenText(simpleCommand);
  return /(?:^|[\s|&;<>()`])(?:skills-local|::LOCAL::)(?:\/|[\s|&;<>()`]|$)/.test(
    dequoted,
  );
}

// 현재 경로가 공용 tree 안이면 상대경로 쓰기는 전부 공용 write로 본다.
function evaluateCwdInsideSimple(simpleCommand, projectRoot) {
  // 상대 redirect 대상은 공용 tree 안으로 들어가므로 차단한다.
  const redirectMatch = simpleCommand.match(
    /(?:^|\s)(?:[0-9]+|&)?(?:>>?\|?|<>)\s*(['"]?)(\S+?)\1(?:\s|$)/,
  );
  if (redirectMatch) {
    const target = redirectMatch[2];
    if (target === "/dev/null") {
      // 명시적 noop은 통과.
    } else if (target.startsWith("/") || target.startsWith("~")) {
      // 절대 또는 홈 기반 redirect가 다시 우리 프로젝트의 공용 tree로
      // 들어오는 경우를 차단한다. projectRoot가 주어지지 않으면
      // 보수적으로 literal mention만 검사한다.
      if (projectRoot && target.startsWith("/")) {
        if (isUnderSharedSkillsTree(target, projectRoot)) return true;
      }
      // literal `.harness/skills/...` 토큰이 들어있으면 절대경로든 아니든 차단한다.
      if (/\.harness\/skills(?:\/|$)/.test(target)) return true;
    } else {
      return true;
    }
  }
  const tool = firstToken(simpleCommand);
  if (!tool) return false;
  return !isCwdInsideAmbientSafeCommand(simpleCommand);
}

function evaluateHarnessCwdSimple(simpleCommand, projectRoot) {
  if (
    mentionsHarnessCwdLocalPath(simpleCommand) &&
    !mentionsHarnessCwdSharedPath(simpleCommand)
  ) {
    return false;
  }
  return evaluateCwdInsideSimple(simpleCommand, projectRoot);
}

function isBashSharedSkillsWrite(command, projectRoot, bashCwd, depth = 0, rawCwd = null) {
  // 과도하게 깊거나 긴 입력은 fail-closed로 차단한다.
  if (depth >= SUBSTITUTION_MAX_DEPTH) return true;
  if (command.length > COMMAND_MAX_LENGTH) return true;

  // 셸에서 같은 경로가 되는 표기를 먼저 canonical form으로 맞춘다.
  let normalized = collapseParentSegments(command);
  // 중괄호 expansion이 만든 공용 경로도 literal 검사 전에 드러낸다.
  normalized = expandBraces(normalized);
  // 프로젝트 소유 로컬 tree는 공용 matcher에서 제외한다.
  normalized = normalized.replace(/\.harness\/skills-local\b/g, "::LOCAL::");

  // 현재 경로가 .harness 또는 .harness/skills 안이면 literal 경로 없이도 차단한다.
  const cwdMode = cwdSharedSkillsMode(bashCwd, projectRoot, rawCwd);
  if (cwdMode === "harness" || cwdMode === "shared") {
    const substitutionBodies = extractSubstitutionBodies(normalized);
    for (const body of substitutionBodies) {
      if (isBashSharedSkillsWrite(body, projectRoot, bashCwd, depth + 1, rawCwd)) {
        return true;
      }
    }
    for (const simple of splitSimpleCommands(normalized)) {
      if (
        cwdMode === "harness"
          ? evaluateHarnessCwdSimple(simple, projectRoot)
          : evaluateCwdInsideSimple(simple, projectRoot)
      ) {
        return true;
      }
    }
    return false;
  }

  // 치환 내부에 숨은 쓰기도 같은 pipeline으로 재평가한다.
  const substitutionBodies = extractSubstitutionBodies(normalized);
  for (const body of substitutionBodies) {
    if (isBashSharedSkillsWrite(body, projectRoot, bashCwd, depth + 1, rawCwd)) return true;
  }
  if (!mentionsSharedSkills(normalized)) return false;
  // 단순 명령 중 하나라도 읽기 전용이 아니면 전체를 차단한다.
  for (const simple of splitSimpleCommands(normalized)) {
    if (evaluateSimpleCommand(simple)) return true;
  }
  return false;
}

function guardProtectedBranch(input) {
  const toolName = input.tool_name;
  const command = input.tool_input?.command;
  const shouldCheck =
    isWriteLikeTool(toolName) ||
    (toolName === "Bash" &&
      typeof command === "string" &&
      isWriteLikeBash(command));

  if (!shouldCheck) return false;

  const branch = currentBranch(getCwd(input));
  if (!isProtectedBranch(branch)) return false;

  block(
    `Guardrails blocked write-like work on protected branch '${branch}'. Create a working branch before changing code, config, or documentation.`,
  );
  return true;
}

if (input.tool_name !== "Bash") {
  if (guardSharedSkillsWrite(input)) process.exit(0);
  guardProtectedBranch(input);
  process.exit(0);
}

const command = input.tool_input?.command;
if (!command || typeof command !== "string") process.exit(0);

// 셸 cwd와 별개로 프로젝트 루트를 해석한다. tool_input.cwd가
// `$PROJECT/.harness`인 Bash 호출도 $PROJECT 기준으로 공용 tree 판정이
// 이뤄지도록 한다.
//
// 환경의 프로젝트 루트와 git root가 없으면 .harness 부모를 root로 추론한다.
function resolveProjectRoot(bashCwd, rawCwd) {
  if (process.env.CLAUDE_PROJECT_DIR) {
    try {
      return realpathSync(process.env.CLAUDE_PROJECT_DIR);
    } catch {
      return process.env.CLAUDE_PROJECT_DIR;
    }
  }
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    cwd: bashCwd,
    encoding: "utf8",
  });
  if (result.status === 0 && result.stdout.trim()) {
    try {
      return realpathSync(result.stdout.trim());
    } catch {
      return result.stdout.trim();
    }
  }
  // 셸 cwd 자체에 ".harness"가 포함되면 그 직전을 프로젝트 루트로 추론한다.
  // realpath된 bashCwd와 raw cwd 둘 다 시도해 symlink로 우회되는 경우도 막는다.
  for (const candidate of [rawCwd, bashCwd]) {
    if (!candidate) continue;
    const segments = candidate.split(sep);
    const harnessIdx = segments.indexOf(".harness");
    if (harnessIdx > 0) {
      const inferred = segments.slice(0, harnessIdx).join(sep) || sep;
      try {
        return realpathSync(inferred);
      } catch {
        return inferred;
      }
    }
  }
  return bashCwd;
}

const rawCwd = getRawCwd(input);
const bashCwd = getCwd(input);
const projectRoot = resolveProjectRoot(bashCwd, rawCwd);
if (
  isBashSharedSkillsWrite(command, projectRoot, bashCwd, 0, rawCwd) &&
  !isHarnessRepo(projectRoot)
) {
  block(
    "Guardrails blocked a Bash write into .harness/skills/. " +
      "That tree is upstream-owned and overwritten by ./harness update --apply-harness. " +
      "Put new skills under .harness/skills-local/<name>/ instead. " +
      "Shared skill edits are allowed only in the canonical harness repository.",
  );
  process.exit(0);
}

// 명령줄에 위험 문구가 "검색 인자"나 "방출 텍스트"로만 들어간 경우를
// 실제 위험 실행과 구분한다. 위험 검사 테이블은 평면 정규식이라 위치를
// 모르므로, 텍스트 전용 도구(grep/echo/git log/gh pr create 등)에 한해
// 따옴표 안 리터럴을 비운 뒤 검사한다. 실행기(psql/sh/docker 등)는
// 절대 면제하지 않아 미탐(FN)이 생기지 않는다.

// 따옴표(작은/큰) 안 내용만 공백으로 비운다. $(...) 등 따옴표 밖
// substitution 은 그대로 남겨 위험 검사가 계속 보게 한다.
function blankQuotedLiterals(simpleCommand) {
  let out = "";
  let i = 0;
  let quote = null;
  while (i < simpleCommand.length) {
    const c = simpleCommand[i];
    const next = simpleCommand[i + 1];
    if (quote) {
      if (c === "\\" && next && quote === '"') {
        out += "  ";
        i += 2;
        continue;
      }
      if (c === quote) {
        out += c;
        quote = null;
        i += 1;
        continue;
      }
      // 따옴표 안 한 글자를 공백으로 치환해 위험 substring 을 지운다.
      out += " ";
      i += 1;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      out += c;
      i += 1;
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

// 따옴표 안 텍스트를 위험 검사에서 면제해도 안전한 "텍스트 전용" 도구인지.
// grep 계열·검색·방출 도구와, 부작용 없는 git/gh 읽기 서브커맨드만 해당.
const TEXT_ONLY_TOOLS = new Set([
  "grep",
  "egrep",
  "fgrep",
  "rg",
  "ag",
  "ack",
  "echo",
  "printf",
  "cat",
  "head",
  "tail",
  "less",
  "more",
]);

const GIT_READONLY_SUBCMDS = new Set([
  "log",
  "show",
  "diff",
  "blame",
  "grep",
  "shortlog",
]);

// gh pr 의 부작용 없는 서브커맨드. merge 는 절대 포함하지 않는다.
const GH_PR_SAFE_SUBCMDS = new Set([
  "create",
  "edit",
  "view",
  "list",
  "diff",
  "checkout",
  "comment",
  "ready",
  "status",
]);

function isTextOnlySimpleCommand(simpleCommand) {
  const tool = firstToken(simpleCommand);
  if (!tool) return false;
  if (TEXT_ONLY_TOOLS.has(tool)) return true;
  const words = commandWords(simpleCommand);
  if (tool === "git" && GIT_READONLY_SUBCMDS.has(words[1])) return true;
  // gh pr <safe-subcmd> 는 본문/제목 텍스트만 다루므로 면제. merge 는 제외.
  if (tool === "gh" && words[1] === "pr" && GH_PR_SAFE_SUBCMDS.has(words[2])) {
    return true;
  }
  return false;
}

// 위험 검사 대상 명령에서, 텍스트 전용 simple command 의 따옴표 리터럴만
// 비워 위험 검사용 문자열을 만든다. 그 외 simple command 는 원문 유지.
function dangerScanTarget(command) {
  const simples = splitSimpleCommands(command);
  if (simples.length === 0) return command;
  return simples
    .map((s) => (isTextOnlySimpleCommand(s) ? blankQuotedLiterals(s) : s))
    .join(" ; ");
}

const checks = [
  {
    pattern: /\brm\s+-[^\n;|&]*r[^\n;|&]*f\b|\brm\s+-[^\n;|&]*f[^\n;|&]*r\b/,
    label: "recursive force delete",
  },
  { pattern: /\bgit\s+push\b[^\n;|&]*(--force|--force-with-lease|-f)\b/, label: "force push" },
  { pattern: /\bgit\s+reset\s+--hard\b/, label: "hard reset" },
  { pattern: /\bgit\s+clean\b[^\n;|&]*-[^\n;|&]*f/, label: "git clean force" },
  { pattern: /\bgh\s+pr\s+merge\b/, label: "PR merge" },
  { pattern: /\bgh\s+repo\s+delete\b/, label: "repository deletion" },
  { pattern: /\bDROP\s+(TABLE|DATABASE|SCHEMA)\b/i, label: "DROP statement" },
  { pattern: /\bTRUNCATE\b/i, label: "TRUNCATE statement" },
  {
    pattern: /\bALTER\s+TABLE\b[^\n;|&]*(?:\bDROP\b|\bRENAME\b|\bALTER\s+COLUMN\b|\bMODIFY\b|\bCHANGE\b)/i,
    label: "destructive ALTER TABLE",
  },
  { pattern: /\bUPDATE\b[\s\S]*?\bSET\b(?![\s\S]*\bWHERE\b)/i, label: "unbounded UPDATE" },
  { pattern: /\bDELETE\s+FROM\b(?![\s\S]*\bWHERE\b)/i, label: "unbounded DELETE" },
  { pattern: /\bprisma\s+migrate\s+reset\b/, label: "database reset" },
  { pattern: /\bprisma\s+db\s+push\b[^\n;|&]*--force-reset\b/, label: "database reset" },
  { pattern: /\bdrizzle-kit\s+drop\b/, label: "database drop" },
  { pattern: /\bsequelize\b[^\n;|&]*\bdb:drop\b/, label: "database drop" },
  { pattern: /\btypeorm\b[^\n;|&]*\bschema:drop\b/, label: "database drop" },
  { pattern: /\bdropdb\b/, label: "database drop" },
  { pattern: /\bmysqladmin\s+drop\b/, label: "database drop" },
  {
    pattern:
      /\b(?:psql|mysql|mariadb|sqlite3)\b[^\n;|&]*(?:\bprod\b|\bproduction\b)/i,
    label: "production data access",
  },
  {
    pattern:
      /\binfisical\s+run\b[^\n;|&]*(?:--env(?:=|\s+)prod\b|--environment(?:=|\s+)prod\b)/i,
    label: "production secret context",
  },
  {
    pattern:
      /\b(?:stripe|twilio|sendgrid|resend)\b[^\n;|&]*(?:refund|capture|charge|payment|send|message|mail|webhook|customer|live)/i,
    label: "external side effect",
  },
  {
    pattern: /\bopenai\b[^\n;|&]*(?:api|responses|chat|images|audio|batches|files)\b/i,
    label: "paid external API call",
  },
  { pattern: /\bkubectl\s+delete\b/, label: "kubernetes delete" },
  { pattern: /\bdocker\s+system\s+prune\b/, label: "docker system prune" },
  { pattern: /\bterraform\s+destroy\b/, label: "terraform destroy" },
  {
    // 환경 전체 출력, 비밀 *파일* 출력, 비밀 환경변수 echo, gh secret 조회를 차단한다.
    // 비밀 파일은 .env 계열 / *.pem / *.key / id_rsa·id_ed25519 같은 실제 키 파일만
    // 매칭한다. 'secret' 이라는 단어가 파일명 일부로 들어간 일반 파일(예:
    // 비밀 표면 검사 스크립트는 비밀이 아니므로 매칭하지 않는다.
    pattern:
      /^\s*(?:mise\s+exec\s+--\s+)?(?:printenv|env)(?:\s|$)|\b(?:cat|less|more|tail|head)\b[^\n;|&]*(?:(?:^|[/\s])\.env(?:\.[A-Za-z0-9_.-]+)?\b|\.pem\b|\.key\b|\bid_(?:rsa|ed25519|ecdsa|dsa)\b)|\b(?:echo|printf)\b[^\n;|&]*\$[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PASS|CREDENTIAL|PRIVATE_KEY)[A-Z0-9_]*|\bgh\s+secret\s+(?:list|view)\b/,
    label: "secret or environment printing",
  },
  {
    pattern:
      /\b(?:vercel|netlify|fly|railway|render|wrangler)\b[^\n;|&]*(?:\bdeploy\b|\brollback\b|--prod\b|\bproduction\b)|\b(?:server-deploy|deploy|rollback)\b[^\n;|&]*(?:\bprod\b|\bproduction\b)|\bgh\s+workflow\s+run\b[^\n;|&]*(?:\bprod\b|\bproduction\b|\bdeploy\b|\brollback\b)|\bkubectl\s+rollout\s+undo\b/,
    label: "production deploy or rollback",
  },
];

// 위치 인식 대상: 텍스트 전용 명령의 따옴표 리터럴은 비운다.
const positionAwareTarget = dangerScanTarget(command);
// 따옴표 안에 숨은 substitution($(...)·`...`)은 비워질 수 있으므로,
// 모든 substitution body 를 원문 그대로 따로 검사해 미탐을 막는다.
const substitutionBodies = extractSubstitutionBodies(command);
const dangerTargets = [positionAwareTarget, ...substitutionBodies];

const hit = checks.find((check) =>
  dangerTargets.some((target) => check.pattern.test(target)),
);
if (hit) {
  block(
    `Guardrails blocked ${hit.label}. Ask the user for explicit approval before running this command. Do not bypass this guard.`,
  );
  process.exit(0);
}

guardProtectedBranch(input);
