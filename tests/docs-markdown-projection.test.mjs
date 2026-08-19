import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdownDocument } from '../.harness/scripts/docs/lib/render-markdown-document.mjs';
import { buildDocumentProjections } from '../.harness/scripts/docs/lib/build-document-projections.mjs';

test('Markdown 문서의 제목, 문단, 목록, 표, 링크와 코드를 HTML로 투영한다', () => {
  const source = `# 문서 제목

첫 문단입니다.

- 첫 항목
- 둘째 항목

1. 첫 단계
2. 둘째 단계

| 이름 | 상태 |
| --- | --- |
| 문서 | 준비 |

[안전한 링크](docs/guide.md)와 \`inline()\`을 확인합니다.

\`\`\`js
const value = '<safe>';
\`\`\``;

  const html = renderMarkdownDocument(source);

  assert.match(html, /<h1>문서 제목<\/h1>/);
  assert.match(html, /<p>첫 문단입니다.<\/p>/);
  assert.match(html, /<ul>[\s\S]*<li>첫 항목<\/li>[\s\S]*<\/ul>/);
  assert.match(html, /<ol>[\s\S]*<li>첫 단계<\/li>[\s\S]*<\/ol>/);
  assert.match(html, /<table>[\s\S]*<th>이름<\/th>[\s\S]*<td>준비<\/td>[\s\S]*<\/table>/);
  assert.match(html, /<a href="docs\/guide\.md">안전한 링크<\/a>/);
  assert.match(html, /<code>inline\(\)<\/code>/);
  assert.match(html, /<pre><code class="language-js">const value = &#39;&lt;safe&gt;&#39;;\n<\/code><\/pre>/);
});

test('raw HTML과 실행 가능한 URL은 실행 가능한 markup으로 승격하지 않는다', () => {
  const html = renderMarkdownDocument(`<script>alert('x')</script>

<img src=x onerror="alert(1)">

[위험](javascript:alert(1)) [안전](https://example.com/docs)`);

  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('href="javascript:'));
  assert.match(html, /&lt;script&gt;alert\(&#39;x&#39;\)&lt;\/script&gt;/);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(html, /\[위험\]\(javascript:alert\(1\)\)/);
  assert.match(html, /<a href="https:\/\/example\.com\/docs">안전<\/a>/);
});

test('문서 projection은 원본을 바꾸지 않고 availability metadata를 결합한다', () => {
  const docs = [{
    path: '.harness/docs/guide.md',
    title: '가이드',
    category: '하네스 가이드',
    content: '# 가이드',
  }];
  const snapshot = structuredClone(docs);

  const projected = buildDocumentProjections(docs);

  assert.deepEqual(docs, snapshot);
  assert.notEqual(projected[0], docs[0]);
  assert.deepEqual(projected[0], {
    ...docs[0],
    bodyHtml: '<h1>가이드</h1>',
    bodySafety: 'escaped-markdown-v1',
    searchText: '# 가이드',
    health: 'available',
    recovery: null,
  });
});

test('한 문서 변환 실패를 격리하고 원본 경로를 고치는 복구 행동을 제공한다', () => {
  const brokenContent = { toString() { throw new Error('hostile conversion'); } };
  const docs = [
    { path: 'docs/ok.md', title: '정상', content: '# 정상' },
    { path: 'docs/broken.md', title: '<실패>', content: brokenContent },
  ];

  const projected = buildDocumentProjections(docs);

  assert.equal(projected.length, 2);
  assert.equal(projected[0].health, 'available');
  assert.equal(projected[1].health, 'conversion-failed');
  assert.match(projected[1].bodyHtml, /문서를 표시할 수 없습니다/);
  assert.ok(!projected[1].bodyHtml.includes('<실패>'));
  assert.match(projected[1].recovery, /docs\/broken\.md/);
  assert.match(projected[1].recovery, /수정/);
});

test('기본 입력은 빈 projection을 반환한다', () => {
  assert.equal(renderMarkdownDocument(), '');
  assert.deepEqual(buildDocumentProjections(), []);
});

test('ATX heading 끝의 언어 기호를 closing marker로 오인하지 않는다', () => {
  assert.equal(renderMarkdownDocument('# C#'), '<h1>C#</h1>');
});

test('괄호가 균형 잡힌 URL을 끝까지 링크 대상으로 유지한다', () => {
  const html = renderMarkdownDocument('[문서](https://example.com/api_(stable).md)');
  assert.equal(html, '<p><a href="https://example.com/api_(stable).md">문서</a></p>');
});

test('table cell의 inline code 안에 있는 pipe를 열 구분자로 사용하지 않는다', () => {
  const html = renderMarkdownDocument(`| 표현 | 결과 |
| --- | --- |
| \`a|b\` | 유지 |`);

  assert.match(html, /<tr><td><code>a\|b<\/code><\/td><td>유지<\/td><\/tr>/);
  assert.equal((html.match(/<td>/g) ?? []).length, 2);
});

test('source-relative Markdown 링크를 repository 문서 fragment로 해석한다', () => {
  const root = renderMarkdownDocument('[가이드](docs/guide.md)', { sourcePath: 'README.md' });
  const nested = renderMarkdownDocument('[상위 가이드](../guide.md)', {
    sourcePath: '.harness/docs/setup/install.md',
  });

  assert.match(root, /href="index\.html#project:docs%2Fguide\.md"/);
  assert.match(nested, /href="index\.html#harness:\.harness%2Fdocs%2Fguide\.md"/);
});

test('anchor와 안전한 scheme은 유지하고 repository 밖 path escape는 링크로 승격하지 않는다', () => {
  const html = renderMarkdownDocument(
    '[위치](#section) [웹](https://example.com) [메일](mailto:team@example.com) [탈출](../../outside.md)',
    { sourcePath: 'docs/guide.md' },
  );

  assert.match(html, /href="#section"/);
  assert.match(html, /href="https:\/\/example\.com"/);
  assert.match(html, /href="mailto:team@example\.com"/);
  assert.ok(!html.includes('href="../../outside.md"'));
  assert.match(html, /\[탈출\]\(\.\.\/\.\.\/outside\.md\)/);
});

test('projection은 source path 기반 링크와 검증 가능한 body safety marker를 제공한다', () => {
  const [projected] = buildDocumentProjections([{
    path: 'docs/setup/readme.md',
    content: '[가이드](../guide.md)',
  }]);

  assert.equal(projected.bodySafety, 'escaped-markdown-v1');
  assert.equal(projected.searchText, '[가이드](../guide.md)');
  assert.match(projected.bodyHtml, /href="index\.html#project:docs%2Fguide\.md"/);
});
