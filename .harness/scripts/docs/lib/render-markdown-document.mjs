// 저장소 Markdown을 외부 의존성 없이 안전한 읽기용 HTML로 변환한다.

import { posix } from 'node:path';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSafeLinkTarget(target) {
  const value = String(target ?? '').trim();
  if (!value || /[\u0000-\u001f\u007f]/.test(value)) return false;

  const scheme = value.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  return !scheme || scheme === 'http' || scheme === 'https' || scheme === 'mailto';
}

function resolveLinkTarget(target, sourcePath) {
  const value = String(target ?? '').trim();
  if (!isSafeLinkTarget(value)) return null;
  if (!sourcePath || value.startsWith('#') || value.startsWith('?')) return value;

  const scheme = value.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  if (scheme) return value;

  const suffixIndex = value.search(/[?#]/);
  const markdownPath = suffixIndex === -1 ? value : value.slice(0, suffixIndex);
  if (!markdownPath.toLowerCase().endsWith('.md')) return value;
  if (markdownPath.includes('\\')) return null;

  const source = posix.normalize(String(sourcePath).replace(/^\/+/, ''));
  const candidate = markdownPath.startsWith('/')
    ? markdownPath.slice(1)
    : posix.join(posix.dirname(source), markdownPath);
  const resolved = posix.normalize(candidate);
  if (!resolved || resolved === '..' || resolved.startsWith('../') || posix.isAbsolute(resolved)) return null;

  const category = resolved.startsWith('.harness/docs/') ? 'harness' : 'project';
  return `index.html#${category}:${encodeURIComponent(resolved)}`;
}

function readCodeToken(value, start) {
  let fenceLength = 1;
  while (value[start + fenceLength] === '`') fenceLength += 1;
  const fence = '`'.repeat(fenceLength);
  const end = value.indexOf(fence, start + fenceLength);
  if (end === -1 || end === start + fenceLength) return null;
  return {
    content: value.slice(start + fenceLength, end),
    end: end + fenceLength,
  };
}

function readLinkToken(value, start) {
  const labelEnd = value.indexOf('](', start + 1);
  if (labelEnd === -1 || value.slice(start + 1, labelEnd).includes('\n')) return null;

  let depth = 1;
  let cursor = labelEnd + 2;
  for (; cursor < value.length; cursor += 1) {
    const character = value[cursor];
    if (character === '\n' || /\s/.test(character)) return null;
    if (character === '(') depth += 1;
    if (character !== ')') continue;
    depth -= 1;
    if (depth === 0) {
      return {
        label: value.slice(start + 1, labelEnd),
        target: value.slice(labelEnd + 2, cursor),
        end: cursor + 1,
      };
    }
  }
  return null;
}

function renderInline(source, { sourcePath = '' } = {}) {
  const value = String(source ?? '');
  let cursor = 0;
  let html = '';

  while (cursor < value.length) {
    if (value[cursor] === '`') {
      const token = readCodeToken(value, cursor);
      if (token) {
        html += `<code>${escapeHtml(token.content)}</code>`;
        cursor = token.end;
        continue;
      }
    }
    if (value[cursor] === '[') {
      const token = readLinkToken(value, cursor);
      if (token) {
        const target = resolveLinkTarget(token.target, sourcePath);
        const sourceToken = value.slice(cursor, token.end);
        html += target
          ? `<a href="${escapeHtml(target)}">${escapeHtml(token.label)}</a>`
          : escapeHtml(sourceToken);
        cursor = token.end;
        continue;
      }
    }
    html += escapeHtml(value[cursor]);
    cursor += 1;
  }
  return html;
}

function splitTableRow(line) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = [];
  let cell = '';
  let codeFenceLength = 0;

  for (let index = 0; index < trimmed.length; index += 1) {
    const character = trimmed[index];
    if (character === '`') {
      let runLength = 1;
      while (trimmed[index + runLength] === '`') runLength += 1;
      if (codeFenceLength === 0) codeFenceLength = runLength;
      else if (codeFenceLength === runLength) codeFenceLength = 0;
      cell += '`'.repeat(runLength);
      index += runLength - 1;
      continue;
    }
    if (character === '|' && codeFenceLength === 0) {
      cells.push(cell.trim());
      cell = '';
      continue;
    }
    cell += character;
  }
  cells.push(cell.trim());
  return cells;
}

function isTableSeparator(line) {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function startsBlock(lines, index) {
  const line = lines[index] ?? '';
  if (!line.trim()) return true;
  if (/^\s*```/.test(line)) return true;
  if (/^#{1,6}\s+/.test(line)) return true;
  if (/^\s*(?:[-+*]|\d+[.)])\s+/.test(line)) return true;
  return line.includes('|') && isTableSeparator(lines[index + 1] ?? '');
}

export function renderMarkdownDocument(source = '', options = {}) {
  const text = String(source).replace(/\r\n?/g, '\n');
  if (!text) return '';
  const inlineOptions = { sourcePath: String(options?.sourcePath ?? '') };

  const lines = text.split('\n');
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^\s*```\s*([a-z0-9_-]*)\s*$/i);
    if (fence) {
      const code = [];
      index += 1;
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      const language = fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : '';
      blocks.push(`<pre><code${language}>${escapeHtml(code.join('\n'))}${code.length ? '\n' : ''}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (heading) {
      const level = heading[1].length;
      const headingText = heading[2].replace(/[ \t]+#+[ \t]*$/, '');
      blocks.push(`<h${level}>${renderInline(headingText, inlineOptions)}</h${level}>`);
      index += 1;
      continue;
    }

    if (line.includes('|') && isTableSeparator(lines[index + 1] ?? '')) {
      const headings = splitTableRow(line);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].trim() && lines[index].includes('|')) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      const headHtml = headings.map((cell) => `<th>${renderInline(cell, inlineOptions)}</th>`).join('');
      const bodyHtml = rows.map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell, inlineOptions)}</td>`).join('')}</tr>`).join('');
      blocks.push(`<table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`);
      continue;
    }

    const listItem = line.match(/^\s*([-+*]|\d+[.)])\s+(.+)$/);
    if (listItem) {
      const ordered = /^\d/.test(listItem[1]);
      const items = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s*([-+*]|\d+[.)])\s+(.+)$/);
        if (!item || /^\d/.test(item[1]) !== ordered) break;
        items.push(`<li>${renderInline(item[2], inlineOptions)}</li>`);
        index += 1;
      }
      const tag = ordered ? 'ol' : 'ul';
      blocks.push(`<${tag}>${items.join('')}</${tag}>`);
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && !startsBlock(lines, index)) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(`<p>${renderInline(paragraph.join(' '), inlineOptions)}</p>`);
  }

  return blocks.join('\n');
}
