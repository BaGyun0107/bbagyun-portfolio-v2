import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDocsPage } from '../.harness/scripts/docs/lib/render-docs-page.mjs';
import { buildDocumentProjections } from '../.harness/scripts/docs/lib/build-document-projections.mjs';

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.attributes = new Map();
    this.children = [];
    this.dataset = {};
    this.listeners = new Map();
    this.className = '';
    this.textContent = '';
    this.innerHTML = '';
    this.value = '';
    this.parentNode = null;
  }

  setAttribute(name, value) {
    const stringValue = String(value);
    this.attributes.set(name, stringValue);
    if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      this.dataset[key] = stringValue;
    }
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  append(...children) {
    for (const child of children) {
      child.parentNode = this;
      this.children.push(child);
    }
  }

  replaceChildren(...children) {
    this.children = [];
    this.append(...children);
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type, event = {}) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ target: this, ...event });
    }
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (selector === '[data-doc-path]' && current.dataset.docPath !== undefined) return current;
      current = current.parentNode;
    }
    return null;
  }
}

function createClientHarness(hash = '') {
  const elements = {
    docsList: new FakeElement('div'),
    docsReader: new FakeElement('article'),
    docsSearch: new FakeElement('input'),
    docsSearchStatus: new FakeElement('span'),
  };
  const categoryButtons = ['harness', 'project'].map((category) => {
    const button = new FakeElement('button');
    button.setAttribute('data-doc-category', category);
    return button;
  });
  const windowListeners = new Map();
  const location = { hash };
  const environment = {
    document: {
      createElement: (tagName) => new FakeElement(tagName),
      getElementById: (id) => elements[id] ?? null,
      querySelectorAll: (selector) => selector === '[data-doc-category]' ? categoryButtons : [],
    },
    location,
    history: {
      replaceState(_state, _title, nextHash) {
        location.hash = nextHash;
      },
    },
    addEventListener(type, listener) {
      const listeners = windowListeners.get(type) ?? [];
      listeners.push(listener);
      windowListeners.set(type, listeners);
    },
  };
  return {
    ...elements,
    categoryButtons,
    environment,
    emit(type) {
      for (const listener of windowListeners.get(type) ?? []) listener();
    },
  };
}

function findChild(element, tagName) {
  if (element.tagName === tagName.toUpperCase()) return element;
  for (const child of element.children) {
    const match = findChild(child, tagName);
    if (match) return match;
  }
  return null;
}

function findByClass(element, className) {
  if (element.className.split(/\s+/).includes(className)) return element;
  for (const child of element.children) {
    const match = findByClass(child, className);
    if (match) return match;
  }
  return null;
}

function currentListButton(harness) {
  return harness.docsList.children.find((child) => child.getAttribute('aria-current') === 'page');
}

function mountRenderedPage(sourceDocuments, hash = '') {
  const harness = createClientHarness(hash);
  const html = renderDocsPage({ documents: sourceDocuments });
  const start = html.indexOf('<script>') + '<script>'.length;
  const end = html.lastIndexOf('</script>');
  assert.ok(start >= '<script>'.length && end > start, '실행할 inline script가 있어야 한다');
  const execute = new Function('globalThis', html.slice(start, end));
  execute(harness.environment);
  return harness;
}

const documents = [
  {
    path: '.harness/docs/guide.md',
    title: '하네스 시작',
    category: '하네스 가이드',
    snippet: '하네스 안내',
    content: '# 하네스 시작\n\n안내',
    searchText: '# 하네스 시작\n\n안내',
    bodyHtml: '<h1>하네스 시작</h1><p>안내</p>',
    bodySafety: 'escaped-markdown-v1',
    health: 'available',
    recovery: null,
  },
  {
    path: 'README.md',
    title: '프로젝트 시작',
    category: '진입점',
    snippet: '프로젝트 안내',
    content: '# 프로젝트 시작\n\n프로젝트 본문',
    searchText: '# 프로젝트 시작\n\n프로젝트 본문',
    bodyHtml: '<h1>프로젝트 시작</h1><p>프로젝트 본문</p>',
    bodySafety: 'escaped-markdown-v1',
    health: 'available',
    recovery: null,
  },
  {
    path: 'specs/010-reader/spec.md',
    title: '기능 명세',
    category: '기능 명세',
    snippet: '명세 안내',
    content: '# 기능 명세\n\n본문 후반 deep-search-token',
    searchText: '# 기능 명세\n\n본문 후반 deep-search-token',
    bodyHtml: '<h1>기능 명세</h1><pre><code>feature()</code></pre>',
    bodySafety: 'escaped-markdown-v1',
    health: 'available',
    recovery: null,
  },
];

test('문서 전용 페이지에 범주 sidebar, 검색 목록, reader와 Planning 링크를 렌더링한다', () => {
  const html = renderDocsPage({ documents });

  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /class="docs-app"/);
  assert.match(html, /class="docs-sidebar"/);
  assert.match(html, /class="docs-library"/);
  assert.match(html, /class="docs-list"/);
  assert.match(html, /class="docs-reader"/);
  assert.match(html, /<nav[^>]+aria-label="문서 범주"/);
  assert.match(html, /<button[^>]+data-doc-category="harness"/);
  assert.match(html, /<button[^>]+data-doc-category="project"/);
  assert.match(html, /<input[^>]+type="search"/);
  assert.match(html, /id="docsSearchStatus"[^>]+aria-live="polite"/);
  assert.ok(!/id="docsList"[^>]+aria-live/.test(html));
  assert.ok(!/id="docsReader"[^>]+aria-live/.test(html));
  assert.match(html, /data-doc-path="\.harness\/docs\/guide\.md"[^>]+aria-current="page"/);
  assert.match(html, /id="docsReaderBody" class="docs-reader-body"><h1>하네스 시작<\/h1><p>안내<\/p><\/div>/);
  assert.match(html, /href="planning\.html"/);
  assert.ok(!html.includes('data-workspace-view'));
});

test('문서 전용 페이지 CSS는 1280·768·375에서 탐색 목록과 reader를 읽을 수 있게 배치한다', () => {
  const html = renderDocsPage({ documents });
  const css = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';

  const appRule = cssRule(css, '.docs-app');
  assert.match(appRule, /display:\s*grid/);
  assert.match(appRule, /grid-template-columns:\s*minmax\([^;]+\)\s+minmax\([^;]+\)/);
  assert.match(appRule, /overflow-x:\s*hidden/);

  const sidebarRule = cssRule(css, '.docs-sidebar');
  assert.match(sidebarRule, /position:\s*sticky/);
  assert.match(sidebarRule, /height:\s*100vh/);
  assert.match(sidebarRule, /overflow[^:]*:\s*auto/);

  const mainRule = cssRule(css, '.docs-main');
  assert.match(mainRule, /display:\s*grid/);
  assert.match(mainRule, /grid-template-columns:\s*minmax\([^;]+\)\s+minmax\([^;]+\)/);
  assert.match(mainRule, /min-width:\s*0/);

  const libraryRule = cssRule(css, '.docs-library');
  assert.match(libraryRule, /display:\s*grid/);
  assert.match(libraryRule, /min-height:\s*0/);

  const listRule = cssRule(css, '.docs-list');
  assert.match(listRule, /overflow-y:\s*auto/);
  assert.match(listRule, /max-height:\s*calc\(/);

  const readerRule = cssRule(css, '.docs-reader');
  assert.match(readerRule, /min-width:\s*0/);
  assert.match(readerRule, /min-height:\s*calc\(/);

  assert.match(css, /\.docs-document-link\[aria-current="page"\][^{]*\{[^}]*border[^}]*background/);
  assert.match(css, /\.docs-sidebar[^}]*\[aria-current="page"\][^{]*\{[^}]*background/);
  assert.match(css, /\.docs-app[^}]*:focus-visible[^{]*\{[^}]*outline/);

  const bodyRule = cssRule(css, '.docs-reader-body');
  assert.match(bodyRule, /overflow-wrap:\s*anywhere/);
  assert.match(bodyRule, /overflow-x:\s*auto/);
  assert.match(cssRule(css, '.docs-reader-body table'), /border-collapse:\s*collapse/);
  assert.match(cssRule(css, '.docs-reader-body table'), /min-width:/);
  assert.match(cssRule(css, '.docs-reader-body pre'), /overflow-x:\s*auto/);
  assert.match(cssRule(css, '.docs-reader-body code'), /font-family/);

  const tabletCss = css.slice(css.lastIndexOf('@media (max-width: 900px)'));
  assert.match(cssRule(tabletCss, '.docs-app'), /grid-template-columns:\s*1fr/);
  assert.match(cssRule(tabletCss, '.docs-sidebar'), /position:\s*static/);
  assert.match(cssRule(tabletCss, '.docs-sidebar'), /height:\s*auto/);

  const mobileCss = css.slice(css.lastIndexOf('@media (max-width: 600px)'));
  assert.match(cssRule(mobileCss, '.docs-main'), /grid-template-columns:\s*1fr/);
  assert.match(cssRule(mobileCss, '.docs-list'), /max-height:/);
});

function cssRule(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
}

test('진입점과 기능 명세를 프로젝트 문서 reader에 포함한다', () => {
  const harness = mountRenderedPage(documents, '#project');

  assert.deepEqual(
    harness.docsList.children.map((button) => button.dataset.docPath),
    ['README.md', 'specs/010-reader/spec.md'],
  );
  assert.equal(findChild(harness.docsReader, 'h1').textContent, '프로젝트 시작');
});

test('hostile 문서 text와 script 종료 문자열을 HTML 및 script data 경계에서 이스케이프한다', () => {
  const html = renderDocsPage({ documents: [{
    path: 'docs/\" onclick=\"alert(1).md',
    title: '</script><script>globalThis.pwned=true</script>',
    category: '프로젝트 문서',
    snippet: '<img src=x onerror=alert(1)>',
    bodyHtml: '<p>&lt;안전&gt;</p>',
    bodySafety: 'escaped-markdown-v1',
    health: 'available',
    recovery: null,
  }] });

  assert.ok(!html.includes('</script><script>globalThis.pwned=true</script>'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('onclick="alert(1).md'));
  assert.match(html, /\\u003c\/script\\u003e\\u003cscript\\u003eglobalThis\.pwned=true\\u003c\/script\\u003e/);
});

test('빈 문서 집합은 명시적인 empty state를 제공하고 입력을 수정하지 않는다', () => {
  const source = structuredClone(documents);
  renderDocsPage({ documents });
  assert.deepEqual(documents, source);

  const html = renderDocsPage();
  assert.match(html, /문서가 없습니다/);
  assert.match(html, /Markdown 수집 대상을 확인/);
});

test('외부 network 의존성 없이 file URL에서 자체 완결된 페이지를 만든다', () => {
  const html = renderDocsPage({ documents });

  assert.ok(!/<(?:script|link|img)[^>]+(?:src|href)="https?:/i.test(html));
  assert.match(html, /<style>[\s\S]+<\/style>/);
  assert.match(html, /<script>[\s\S]+<\/script>/);
});

test('직접 fragment 진입은 encoded path의 범주, reader와 현재 문서를 복원한다', () => {
  const path = '.harness/docs/guide.md';
  const harness = mountRenderedPage(documents, `#harness:${encodeURIComponent(path)}`);

  assert.equal(findChild(harness.docsReader, 'h1').textContent, '하네스 시작');
  assert.equal(findChild(harness.docsReader, 'code').textContent, path);
  assert.equal(findByClass(harness.docsReader, 'docs-reader-body').innerHTML, '<h1>하네스 시작</h1><p>안내</p>');
  assert.equal(currentListButton(harness).dataset.docPath, path);
  assert.equal(harness.categoryButtons[0].getAttribute('aria-current'), 'page');
});

test('unknown path는 선택 범주의 첫 문서로 fallback하고 문서가 없으면 empty를 표시한다', () => {
  const fallback = mountRenderedPage(documents, '#project:unknown%2Fdocument.md');

  assert.equal(findChild(fallback.docsReader, 'h1').textContent, '프로젝트 시작');
  assert.equal(fallback.environment.location.hash, '#project:README.md');

  const malformed = mountRenderedPage(documents, '#harness:%E0%A4%A');
  assert.equal(findChild(malformed.docsReader, 'h1').textContent, '하네스 시작');
  assert.equal(malformed.environment.location.hash, '#harness:.harness%2Fdocs%2Fguide.md');

  const empty = mountRenderedPage([], '#project:missing.md');
  assert.equal(findChild(empty.docsReader, 'h2').textContent, '문서가 없습니다');
  assert.equal(currentListButton(empty), undefined);
});

test('범주 click 한 번으로 해당 목록과 첫 reader를 함께 전환한다', () => {
  const harness = mountRenderedPage(documents, '#harness');

  harness.categoryButtons[1].dispatch('click');

  assert.deepEqual(
    harness.docsList.children.map((button) => button.dataset.docPath),
    ['README.md', 'specs/010-reader/spec.md'],
  );
  assert.equal(findChild(harness.docsReader, 'h1').textContent, '프로젝트 시작');
  assert.equal(findByClass(harness.docsReader, 'docs-reader-body').innerHTML, '<h1>프로젝트 시작</h1><p>프로젝트 본문</p>');
  assert.equal(harness.environment.location.hash, '#project:README.md');
});

test('문서 click은 reader, fragment와 aria-current를 같은 문서로 갱신한다', () => {
  const harness = mountRenderedPage(documents, '#project');
  const target = harness.docsList.children[1];

  harness.docsList.dispatch('click', { target });

  assert.equal(findChild(harness.docsReader, 'h1').textContent, '기능 명세');
  assert.equal(findByClass(harness.docsReader, 'docs-reader-body').innerHTML, '<h1>기능 명세</h1><pre><code>feature()</code></pre>');
  assert.equal(currentListButton(harness).dataset.docPath, 'specs/010-reader/spec.md');
  assert.equal(harness.environment.location.hash, '#project:specs%2F010-reader%2Fspec.md');
});

test('검색은 결과 목록과 reader를 첫 일치 문서 또는 empty로 함께 전환한다', () => {
  const harness = mountRenderedPage(documents, '#project');

  harness.docsSearch.value = '명세';
  harness.docsSearch.dispatch('input');
  assert.deepEqual(harness.docsList.children.map((button) => button.dataset.docPath), ['specs/010-reader/spec.md']);
  assert.equal(findChild(harness.docsReader, 'h1').textContent, '기능 명세');
  assert.equal(findByClass(harness.docsReader, 'docs-reader-body').innerHTML, '<h1>기능 명세</h1><pre><code>feature()</code></pre>');

  harness.docsSearch.value = '없는 검색어';
  harness.docsSearch.dispatch('input');
  assert.equal(findChild(harness.docsReader, 'h2').textContent, '문서가 없습니다');
});

test('hashchange는 전달된 범주와 선택 문서 상태를 다시 복원한다', () => {
  const harness = mountRenderedPage(documents, '#harness');

  harness.environment.location.hash = `#project:${encodeURIComponent('specs/010-reader/spec.md')}`;
  harness.emit('hashchange');

  assert.equal(findChild(harness.docsReader, 'h1').textContent, '기능 명세');
  assert.equal(currentListButton(harness).dataset.docPath, 'specs/010-reader/spec.md');
  assert.equal(harness.categoryButtons[1].getAttribute('aria-current'), 'page');
});

test('marker 없는 임의 bodyHtml은 static/client reader의 active HTML이 되지 않는다', () => {
  const rawDocument = {
    path: 'docs/raw.md',
    title: 'Raw 문서',
    category: '프로젝트 문서',
    content: '원본 없음',
    bodyHtml: '<img src=x onerror="globalThis.pwned=true">',
  };
  const html = renderDocsPage({ documents: [rawDocument] });
  const harness = mountRenderedPage([rawDocument], '#project');
  const body = findByClass(harness.docsReader, 'docs-reader-body');

  assert.ok(!html.includes('<img src=x'));
  assert.ok(!body.innerHTML.includes('<img'));
  assert.match(body.innerHTML, /안전하게 변환되지 않은 문서/);
});

test('hostile Markdown은 projection부터 page reader까지 text로만 유지한다', () => {
  const projected = buildDocumentProjections([{
    path: 'docs/hostile.md',
    title: 'Hostile',
    category: '프로젝트 문서',
    snippet: 'hostile source',
    content: '<img src=x onerror="globalThis.pwned=true">',
  }]);
  const harness = mountRenderedPage(projected, '#project');
  const body = findByClass(harness.docsReader, 'docs-reader-body');

  assert.ok(!body.innerHTML.includes('<img'));
  assert.match(body.innerHTML, /&lt;img src=x onerror=&quot;globalThis\.pwned=true&quot;&gt;/);
});

test('검색은 snippet에 없는 content 후반의 고유 term도 찾는다', () => {
  const harness = mountRenderedPage(documents, '#project');

  harness.docsSearch.value = 'deep-search-token';
  harness.docsSearch.dispatch('input');

  assert.deepEqual(harness.docsList.children.map((button) => button.dataset.docPath), ['specs/010-reader/spec.md']);
  assert.equal(findChild(harness.docsReader, 'h1').textContent, '기능 명세');
});

test('검색 중 외부 hashchange는 query를 지우고 요청 문서를 우선 복원한다', () => {
  const harness = mountRenderedPage(documents, '#project');
  harness.docsSearch.value = '명세';
  harness.docsSearch.dispatch('input');
  assert.equal(findChild(harness.docsReader, 'h1').textContent, '기능 명세');

  harness.environment.location.hash = '#project:README.md';
  harness.emit('hashchange');

  assert.equal(harness.docsSearch.value, '');
  assert.equal(findChild(harness.docsReader, 'h1').textContent, '프로젝트 시작');
  assert.equal(currentListButton(harness).dataset.docPath, 'README.md');
});

test('conversion-failed projection의 hostile content를 page에서 다시 변환하지 않는다', () => {
  const hostileContent = {
    toString() {
      throw new Error('content conversion failed');
    },
  };
  const [failed] = buildDocumentProjections([{
    path: 'docs/broken.md',
    title: '깨진 문서',
    category: '프로젝트 문서',
    snippet: '변환 실패',
    content: hostileContent,
  }]);

  assert.equal(failed.health, 'conversion-failed');
  assert.doesNotThrow(() => renderDocsPage({ documents: [failed] }));
  assert.equal(failed.searchText, '');

  const harness = mountRenderedPage([failed], '#project');
  assert.equal(findChild(harness.docsReader, 'h1').textContent, '깨진 문서');
  assert.match(findByClass(harness.docsReader, 'docs-reader-body').innerHTML, /문서를 표시할 수 없습니다/);
});
