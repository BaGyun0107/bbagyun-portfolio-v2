// MD 문서 색인 (STICKY collect_md_docs 이식, research D3).
// 폴더/파일 목록을 재귀 스캔해 Doc Index Entry 배열을 만든다.

import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative, basename, extname } from 'node:path';

function walk(target, out) {
  let st;
  try {
    st = statSync(target);
  } catch {
    return; // 존재하지 않는 경로는 건너뜀
  }
  if (st.isFile()) {
    if (extname(target) === '.md') out.push(target);
    return;
  }
  if (!st.isDirectory()) return;
  let entries;
  try {
    entries = readdirSync(target);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === 'node_modules' || name === '.git' || name.startsWith('.')) continue;
    walk(join(target, name), out);
  }
}

function extractTitle(text, fallback) {
  for (const line of text.split('\n')) {
    const m = line.match(/^#\s+(.+?)\s*$/);
    if (m) return m[1];
  }
  return fallback;
}

function makeSnippet(text) {
  const noCode = text.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ');
  const plain = noCode
    .replace(/^#+\s+/gm, '')
    .replace(/[*_>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.slice(0, 260);
}

function makeContent(text) {
  return text.slice(0, 50000);
}

function categoryFor(relPath) {
  if (relPath.startsWith('.harness/docs/')) return '하네스 가이드';
  if (relPath.startsWith('specs/')) return '기능 명세';
  if (relPath.startsWith('docs/')) return '프로젝트 문서';
  if (relPath === 'README.md' || basename(relPath) === 'README.md') return '진입점';
  return '기타';
}

// targets: 파일 또는 폴더 경로 배열. rootDir: 상대 경로 기준.
export function scanMd(targets, rootDir) {
  const files = [];
  for (const t of targets) walk(t, files);

  const seen = new Set();
  const entries = [];
  for (const abs of files) {
    if (seen.has(abs)) continue;
    seen.add(abs);
    const rel = relative(rootDir, abs);
    let text = '';
    try {
      text = readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    entries.push({
      path: rel,
      href: rel.split('/').map(encodeURIComponent).join('/'),
      title: extractTitle(text, basename(abs, '.md')),
      category: categoryFor(rel),
      snippet: makeSnippet(text),
      content: makeContent(text),
    });
  }
  return entries.sort((a, b) => a.path.localeCompare(b.path));
}
