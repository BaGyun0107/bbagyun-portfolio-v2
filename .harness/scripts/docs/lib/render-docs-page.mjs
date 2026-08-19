// 하네스/프로젝트 Markdown을 탐색하는 자체 완결 문서 전용 페이지.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DOCUMENT_BODY_SAFETY } from './build-document-projections.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_CATEGORIES = new Set(['프로젝트 문서', '진입점', '기능 명세']);
const UNSAFE_BODY_FALLBACK = '<section class="docs-conversion-failed" role="status"><h2>안전하게 변환되지 않은 문서</h2><p>Markdown projection을 다시 생성한 뒤 문서 허브를 빌드하세요.</p></section>';

function loadCss() {
  const cssPath = join(HERE, '..', 'templates', 'hub.css');
  try {
    return readFileSync(cssPath, 'utf8');
  } catch (error) {
    throw new Error(`문서 허브 CSS를 읽을 수 없습니다: ${cssPath}`, { cause: error });
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonForScript(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function categoryForDocument(document) {
  if (document.category === '하네스 가이드') return 'harness';
  if (PROJECT_CATEGORIES.has(document.category)) return 'project';
  return null;
}

function normalizeDocuments(documents) {
  if (!Array.isArray(documents)) return [];
  return documents.flatMap((document) => {
    const category = categoryForDocument(document ?? {});
    if (!category) return [];
    const trustedBody = document?.bodySafety === DOCUMENT_BODY_SAFETY;
    return [{
      path: String(document?.path ?? ''),
      title: String(document?.title ?? document?.path ?? '제목 없는 문서'),
      category,
      sourceCategory: String(document?.category ?? ''),
      snippet: String(document?.snippet ?? ''),
      searchText: typeof document?.searchText === 'string' ? document.searchText : '',
      bodyHtml: trustedBody ? String(document?.bodyHtml ?? '') : UNSAFE_BODY_FALLBACK,
      health: trustedBody ? String(document?.health ?? 'available') : 'conversion-failed',
      recovery: trustedBody
        ? (document?.recovery == null ? null : String(document.recovery))
        : '검증된 Markdown projection을 다시 생성하세요.',
    }];
  });
}

function renderDocumentButton(document, currentPath) {
  const current = document.path === currentPath ? ' aria-current="page"' : '';
  return `<button type="button" class="docs-document-link" data-doc-path="${escapeHtml(document.path)}"${current}><strong>${escapeHtml(document.title)}</strong><small>${escapeHtml(document.path)}</small><span>${escapeHtml(document.snippet)}</span></button>`;
}

function emptyReader() {
  return '<div class="docs-empty" role="status"><h2>문서가 없습니다</h2><p>Markdown 수집 대상을 확인하고 문서를 추가한 뒤 다시 생성하세요.</p></div>';
}

function runDocsClient(documents, environment = globalThis) {
  const document = environment.document;
  const location = environment.location;
  const history = environment.history;
  const categories = new Set(['harness', 'project']);
  const fallbackCategory = documents.some((item) => item.category === 'harness') ? 'harness' : 'project';
  const state = { category: fallbackCategory, path: null, query: '' };
  const list = document.getElementById('docsList');
  const reader = document.getElementById('docsReader');
  const search = document.getElementById('docsSearch');
  const status = document.getElementById('docsSearchStatus');

  function documentsForCategory(category) {
    return documents.filter((item) => item.category === category);
  }

  function parseFragment() {
    const fragment = location.hash.slice(1);
    const separator = fragment.indexOf(':');
    const requestedCategory = separator === -1 ? fragment : fragment.slice(0, separator);
    const encodedPath = separator === -1 ? '' : fragment.slice(separator + 1);
    state.category = categories.has(requestedCategory) ? requestedCategory : fallbackCategory;
    try {
      state.path = encodedPath ? decodeURIComponent(encodedPath) : null;
    } catch {
      state.path = null;
    }
  }

  function setFragment() {
    const next = state.path
      ? `#${state.category}:${encodeURIComponent(state.path)}`
      : `#${state.category}`;
    if (location.hash !== next) history.replaceState(null, '', next);
  }

  function filteredDocuments() {
    const query = state.query.trim().toLocaleLowerCase();
    const candidates = documentsForCategory(state.category);
    if (!query) return candidates;
    return candidates.filter((item) =>
      `${item.title} ${item.path} ${item.snippet} ${item.searchText}`.toLocaleLowerCase().includes(query));
  }

  function appendEmpty(target, title, guidance) {
    const empty = document.createElement('div');
    empty.className = 'docs-empty';
    empty.setAttribute('role', 'status');
    const heading = document.createElement('h2');
    heading.textContent = title;
    const paragraph = document.createElement('p');
    paragraph.textContent = guidance;
    empty.append(heading, paragraph);
    target.append(empty);
  }

  function renderReader(selected) {
    reader.replaceChildren();
    if (!selected) {
      appendEmpty(reader, '문서가 없습니다', state.query ? '검색 조건을 바꾸거나 다른 범주를 선택하세요.' : 'Markdown 수집 대상을 확인하고 문서를 추가하세요.');
      return;
    }
    const header = document.createElement('header');
    header.className = 'docs-reader-header';
    const category = document.createElement('span');
    category.textContent = selected.sourceCategory;
    const title = document.createElement('h1');
    title.textContent = selected.title;
    const path = document.createElement('code');
    path.textContent = selected.path;
    header.append(category, title, path);
    const body = document.createElement('div');
    body.className = 'docs-reader-body';
    body.innerHTML = selected.bodyHtml;
    reader.append(header, body);
    if (selected.recovery) {
      const recovery = document.createElement('p');
      recovery.className = 'docs-reader-recovery';
      recovery.textContent = selected.recovery;
      reader.append(recovery);
    }
  }

  function render() {
    const visible = filteredDocuments();
    if (!visible.some((item) => item.path === state.path)) state.path = visible[0]?.path ?? null;
    const selected = visible.find((item) => item.path === state.path) ?? null;
    list.replaceChildren();
    for (const item of visible) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'docs-document-link';
      button.dataset.docPath = item.path;
      if (item.path === state.path) button.setAttribute('aria-current', 'page');
      const title = document.createElement('strong');
      title.textContent = item.title;
      const path = document.createElement('small');
      path.textContent = item.path;
      const snippet = document.createElement('span');
      snippet.textContent = item.snippet;
      button.append(title, path, snippet);
      list.append(button);
    }
    if (!visible.length) appendEmpty(list, '문서가 없습니다', '검색 조건을 바꾸거나 Markdown 수집 대상을 확인하세요.');
    document.querySelectorAll('[data-doc-category]').forEach((button) => {
      if (button.dataset.docCategory === state.category) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    renderReader(selected);
    status.textContent = selected ? `${visible.length}개 문서 · ${selected.title}` : '검색 결과 없음';
    setFragment();
  }

  document.querySelectorAll('[data-doc-category]').forEach((button) => {
    button.addEventListener('click', () => {
      state.category = button.dataset.docCategory;
      state.path = documentsForCategory(state.category)[0]?.path ?? null;
      render();
    });
  });
  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-doc-path]');
    if (!button) return;
    state.path = button.dataset.docPath;
    render();
  });
  search.addEventListener('input', () => {
    state.query = search.value;
    render();
  });
  environment.addEventListener('hashchange', () => {
    state.query = '';
    search.value = '';
    parseFragment();
    render();
  });

  parseFragment();
  render();
}

export function renderDocsPage({ documents = [] } = {}) {
  const normalized = normalizeDocuments(documents);
  const harnessDocuments = normalized.filter((document) => document.category === 'harness');
  const projectDocuments = normalized.filter((document) => document.category === 'project');
  const initialCategory = harnessDocuments.length > 0 ? 'harness' : 'project';
  const initialDocuments = initialCategory === 'harness' ? harnessDocuments : projectDocuments;
  const initialDocument = initialDocuments[0] ?? null;
  const initialList = initialDocuments.length
    ? initialDocuments.map((document) => renderDocumentButton(document, initialDocument?.path)).join('')
    : emptyReader();
  const initialReader = initialDocument
    ? `<header class="docs-reader-header"><span id="docsReaderCategory">${escapeHtml(initialDocument.sourceCategory)}</span><h1 id="docsReaderTitle">${escapeHtml(initialDocument.title)}</h1><code id="docsReaderPath">${escapeHtml(initialDocument.path)}</code></header><div id="docsReaderBody" class="docs-reader-body">${initialDocument.bodyHtml}</div><p id="docsReaderRecovery" class="docs-reader-recovery"${initialDocument.recovery ? '' : ' hidden'}>${escapeHtml(initialDocument.recovery ?? '')}</p>`
    : emptyReader();
  const css = loadCss();
  const model = jsonForScript(normalized);

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>문서 허브</title>
  <style>${css}</style>
</head>
<body>
  <div class="docs-app">
    <aside class="docs-sidebar">
      <header><span aria-hidden="true">⌘</span><strong>CODI DOCS</strong><small>문서 허브</small></header>
      <nav aria-label="문서 범주">
        <button type="button" data-doc-category="harness"${initialCategory === 'harness' ? ' aria-current="page"' : ''}>하네스 가이드</button>
        <button type="button" data-doc-category="project"${initialCategory === 'project' ? ' aria-current="page"' : ''}>프로젝트 문서</button>
        <a href="planning.html">Planning Hub</a>
      </nav>
    </aside>
    <main class="docs-main">
      <section class="docs-library" aria-labelledby="docsLibraryTitle">
        <header><h1 id="docsLibraryTitle">문서 목록</h1><label for="docsSearch">문서 검색</label><input id="docsSearch" type="search" placeholder="제목, 경로, 내용 검색"><span id="docsSearchStatus" class="docs-search-status" aria-live="polite"></span></header>
        <div id="docsList" class="docs-list">${initialList}</div>
      </section>
      <article id="docsReader" class="docs-reader">${initialReader}</article>
    </main>
  </div>
  <script>
  (${runDocsClient.toString()})(${model});
  </script>
</body>
</html>`;
}
