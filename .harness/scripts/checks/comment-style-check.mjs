#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const extensions = new Set(['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts', '.sh', '.bash', '.py', '.php', '.css', '.yaml', '.yml', '.toml']);
const excluded = /(?:^|\/)(?:\.git|node_modules|vendor|dist|build|coverage|\.specify)(?:\/|$)|^\.harness\/(?:cache|current|state)\//;

function supported(path) {
  return !excluded.test(path) && (extensions.has(extname(path)) || path === 'harness' || /^\.husky\/[^/.]+$/.test(path));
}

function quotedEnd(source, start, quote) {
  let i = start + quote.length;
  while (i < source.length) {
    if (source[i] === '\\') { i += 2; continue; }
    if (source.startsWith(quote, i)) return i + quote.length;
    i++;
  }
  return source.length;
}

function templateEnd(source, start) {
  let i = start + 1;
  while (i < source.length) {
    if (source[i] === '\\') { i += 2; continue; }
    if (source[i] === '`') return i + 1;
    if (source.startsWith('${', i)) {
      i += 2;
      let depth = 1;
      while (i < source.length && depth) {
        const c = source[i];
        if (c === '"' || c === "'") { i = quotedEnd(source, i, c); continue; }
        if (c === '`') { i = templateEnd(source, i); continue; }
        if (source.startsWith('//', i)) { i = lineEnd(source, i); continue; }
        if (source.startsWith('/*', i)) { i = blockEnd(source, i); continue; }
        if (c === '{') depth++;
        if (c === '}') depth--;
        i++;
      }
      continue;
    }
    i++;
  }
  return source.length;
}

const lineEnd = (source, i) => { const end = source.indexOf('\n', i); return end < 0 ? source.length : end; };
const blockEnd = (source, i) => { const end = source.indexOf('*/', i + 2); return end < 0 ? source.length : end + 2; };

function regexEnd(source, start) {
  let bracket = false;
  for (let i = start + 1; i < source.length && source[i] !== '\n'; i++) {
    if (source[i] === '\\') { i++; continue; }
    if (source[i] === '[') bracket = true;
    if (source[i] === ']') bracket = false;
    if (source[i] === '/' && !bracket) return i + 1;
  }
  return start + 1;
}

/** 지원 구문의 주석 범위를 반환한다. 문장의 의미는 판정하지 않는다. */
export function extractComments(path, source) {
  const ext = extname(path);
  const shell = ['.sh', '.bash'].includes(ext) || path === 'harness' || path.startsWith('.husky/');
  const yaml = ['.yaml', '.yml'].includes(ext);
  const triple = ['.py', '.toml'].includes(ext);
  const php = ext === '.php';
  const hash = shell || yaml || triple || php;
  const slash = !hash || php;
  const js = ['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts'].includes(ext);
  const comments = [];
  let i = 0;
  let inPhp = !php;
  let scalarIndent = null;
  const heredocs = [];
  while (i < source.length) {
    if (!inPhp) {
      const opening = /<\?(?:php\b|=)/ig;
      opening.lastIndex = i;
      const match = opening.exec(source);
      if (!match) break;
      i = opening.lastIndex;
      inPhp = true;
      continue;
    }
    if (php && source.startsWith('?>', i)) { inPhp = false; i += 2; continue; }
    if (i === 0 || source[i - 1] === '\n') {
      const end = lineEnd(source, i);
      const line = source.slice(i, end);
      if (heredocs.length) {
        const { delimiter, tabs, php: phpDoc } = heredocs[0];
        const value = tabs ? line.replace(/^\t+/, '') : phpDoc ? line.trimStart() : line;
        if (value === delimiter || (phpDoc && value === `${delimiter};`)) heredocs.shift();
        i = end + 1;
        continue;
      }
      if (yaml) {
        const indent = line.match(/^ */)[0].length;
        if (scalarIndent !== null && (!line.trim() || indent > scalarIndent)) { i = end + 1; continue; }
        scalarIndent = null;
        if (/[:\-]\s*[|>][+\-\d]*\s*(?:#.*)?$/.test(line)) scalarIndent = indent;
      }
    }
    const c = source[i];
    if (shell && source.startsWith('<<<', i)) { i += 3; continue; }
    if ((shell || php) && source.startsWith(php ? '<<<' : '<<', i)) {
      const match = source.slice(i).match(php ? /^<<<[ \t]*(?:'([\w]+)'|"([\w]+)"|([\w]+))/ : /^<<(-?)[ \t]*(?:'([^'\n]+)'|"([^"\n]+)"|([\w]+))/);
      if (match) {
        heredocs.push(php ? { delimiter: match[1] || match[2] || match[3], php: true } : { delimiter: match[2] || match[3] || match[4], tabs: match[1] === '-' });
        i += match[0].length;
        continue;
      }
    }
    if (c === '"' || c === "'") {
      const quote = triple && source.startsWith(c.repeat(3), i) ? c.repeat(3) : c;
      i = quotedEnd(source, i, quote);
      continue;
    }
    if (c === '`' && js) { i = templateEnd(source, i); continue; }
    if (c === '`' && (shell || php)) { i = quotedEnd(source, i, c); continue; }
    if (hash && c === '#' && (!shell || i === 0 || /[\s;|&()]/.test(source[i - 1]))) {
      const end = lineEnd(source, i);
      if (!(i === 0 && source[i + 1] === '!')) comments.push({ start: i, end, text: source.slice(i + 1, end) });
      i = end;
      continue;
    }
    if (slash && (source.startsWith('//', i) && ext !== '.css' || source.startsWith('/*', i))) {
      const block = source[i + 1] === '*';
      const end = block ? blockEnd(source, i) : lineEnd(source, i);
      comments.push({ start: i, end, text: source.slice(i + 2, block && source.slice(end - 2, end) === '*/' ? end - 2 : end) });
      i = end;
      continue;
    }
    if (js && c === '/') {
      const prefix = source.slice(Math.max(0, i - 80), i).trimEnd();
      if (!prefix || /[=(:,!&|?;{}\[\]]$|\b(?:return|throw|yield|case|typeof|void|delete|in|of)$/.test(prefix) || /\b(?:if|while|for|with)\s*\([^()]*\)$/.test(prefix)) {
        i = regexEnd(source, i);
        continue;
      }
    }
    if (shell && c === '\\') { i += 2; continue; }
    i++;
  }
  return comments;
}

/** 결과의 줄 번호는 1부터 시작한다. 변경 범위 선택은 호출자가 담당한다. */
export function checkSource(path, source) {
  const findings = [];
  for (const comment of extractComments(path, source)) {
    if (/SPDX-License-Identifier:|@license|copyright/i.test(comment.text)) continue;
    const startLine = source.slice(0, comment.start).split('\n').length;
    for (const [offset, raw] of comment.text.split('\n').entries()) {
      const text = raw.replace(/^\s*\*?\s*/, '').trim();
      const debt = text.match(/\b(?:TODO|FIXME)(?:\(([^)\n]*)\))?\s*:/) || text.match(/^(?:TODO|FIXME)\b/);
      const tracked = debt && /(?:#\d+\b|https?:\/\/\S+\/(?:issues|pull)\/\d+\b|specs\/\d{3,}(?:-[\w-]+)?\s+T\d{3,}\b)/.test(text.slice(debt.index));
      const body = tracked ? text.replace(/\b(?:TODO|FIXME)\([^)]*\)/, '') : text;
      let rule;
      if (debt && !tracked) rule = 'untracked-debt';
      else if (/\bspecs?\/\d{3,}\b|\bT\d{3,}\b|\b(?:FR|SC)-\d{3}\b|\bUS\d{1,3}\b|(?:research(?:\.md)?|감사)\s+[A-Z]-?\d+/.test(body) && !tracked) rule = 'provenance';
      else if (/^[=─━_\-]{4,}|[─━]{4,}|[=─━_\-]{4,}$/.test(text)) rule = 'separator';
      if (rule) findings.push({ path, line: startLine + offset, rule, message: {
        provenance: '완료 작업의 출처는 Git/spec에 남기고 주석에는 이유와 제약을 남기세요.',
        'untracked-debt': 'TODO/FIXME에 해결 대상 issue 또는 spec-task 참조가 필요합니다.',
        separator: '장식성 구분선을 제거하고 필요한 설명만 남기세요.',
      }[rule] });
    }
  }
  return findings;
}

function git(root, args) {
  return execFileSync('git', ['-c', 'core.quotePath=false', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
}

function addedLines(diff) {
  const lines = new Set();
  for (const match of diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const start = Number(match[1]);
    const count = match[2] === undefined ? 1 : Number(match[2]);
    for (let i = start; i < start + count; i++) lines.add(i);
  }
  return lines;
}

export function runCheck(root, mode = 'changed') {
  root = git(root, ['rev-parse', '--show-toplevel']).trim();
  const index = new Map(git(root, ['ls-files', '--stage', '-z']).split('\0').filter(Boolean).map(entry => {
    const split = entry.indexOf('\t');
    return [entry.slice(split + 1), entry.slice(0, split).split(' ')];
  }));
  const untracked = mode === 'staged' ? [] : git(root, ['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean);
  if ([...index.values()].some(entry => entry[2] !== '0')) throw new Error('Git index의 충돌을 먼저 해결하세요.');
  let head;
  try { head = git(root, ['rev-parse', '--verify', '--quiet', '--end-of-options', 'HEAD']); }
  catch (error) {
    if (error.status !== 1) throw error;
    const ref = git(root, ['symbolic-ref', 'HEAD']).trim();
    let missingRef = false;
    try { git(root, ['show-ref', '--verify', '--quiet', ref]); }
    catch (missing) { if (missing.status !== 1) throw missing; missingRef = true; }
    if (!missingRef) throw error;
    head = '';
  }
  return inspect(root, mode, index, untracked, head.trim());
}

function inspect(root, mode, index, untracked, head) {
  const diffArgs = ['diff', '--no-ext-diff', '--no-textconv', '--no-renames', '--unified=0'];
  const base = head || git(root, ['hash-object', '-t', 'tree', '--stdin']).trim();
  const changed = mode === 'all' ? [...index.keys()] : git(root, [...diffArgs, ...(mode === 'staged' ? ['--cached'] : []), '--name-only', '-z', '--diff-filter=ACM', base, '--']).split('\0').filter(Boolean);
  const findings = [];
  for (const path of new Set([...changed, ...untracked])) {
    if (!supported(path)) continue;
    const entry = index.get(path);
    if (entry && entry[2] !== '0') throw new Error(`충돌을 먼저 해결하세요: ${path}`);
    if (entry && !['100644', '100755'].includes(entry[0])) continue;
    let source;
    if (mode === 'staged') source = git(root, ['show', `:${path}`]);
    else {
      try { if (!lstatSync(resolve(root, path)).isFile()) continue; }
      catch (error) { if (error.code === 'ENOENT') continue; throw error; }
      source = readFileSync(resolve(root, path), 'utf8');
    }
    const selected = mode === 'all' || untracked.includes(path) ? null : addedLines(git(root, [...diffArgs, ...(mode === 'staged' ? ['--cached'] : []), base, '--', `:(literal)${path}`]));
    findings.push(...checkSource(path, source).filter(f => !selected || selected.has(f.line)));
  }
  return findings;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    if (args.length > 1 || args.some(arg => !['--all', '--staged'].includes(arg))) throw new Error('사용법: comment-check [--staged|--all]');
    const findings = runCheck(process.cwd(), args[0] === '--all' ? 'all' : args[0] === '--staged' ? 'staged' : 'changed');
    for (const f of findings) console.error(`${f.path}:${f.line}: [${f.rule}] ${f.message}`);
    console.log(`comment-check: ${findings.length}개 위반`);
    if (findings.length) process.exitCode = 1;
  } catch (error) {
    console.error(`comment-check: ${error.message}`);
    process.exitCode = 1;
  }
}
