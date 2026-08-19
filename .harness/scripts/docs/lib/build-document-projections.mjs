import { renderMarkdownDocument } from './render-markdown-document.mjs';

export const DOCUMENT_BODY_SAFETY = 'escaped-markdown-v1';

function copyDocument(document) {
  if (!document || typeof document !== 'object') return {};

  const copy = {};
  for (const key of Reflect.ownKeys(document)) {
    const descriptor = Object.getOwnPropertyDescriptor(document, key);
    if (!descriptor?.enumerable) continue;
    if ('value' in descriptor) {
      copy[key] = descriptor.value;
      continue;
    }
    try {
      copy[key] = document[key];
    } catch {
      // 실패한 accessor는 해당 문서의 conversion health에서 처리한다.
    }
  }
  return copy;
}

function safePath(document, copy) {
  try {
    return String(document?.path ?? copy.path ?? '알 수 없는 Markdown 원본');
  } catch {
    return '알 수 없는 Markdown 원본';
  }
}

export function buildDocumentProjections(docs = []) {
  if (!Array.isArray(docs)) return [];

  return docs.map((document) => {
    const copy = copyDocument(document);
    let searchText = '';
    try {
      searchText = String(document?.content ?? '');
      return {
        ...copy,
        bodyHtml: renderMarkdownDocument(searchText, { sourcePath: safePath(document, copy) }),
        bodySafety: DOCUMENT_BODY_SAFETY,
        searchText,
        health: 'available',
        recovery: null,
      };
    } catch {
      const path = safePath(document, copy);
      return {
        ...copy,
        bodyHtml: '<section class="docs-conversion-failed" role="status"><h2>문서를 표시할 수 없습니다</h2><p>Markdown 변환에 실패했습니다. 원본을 수정한 뒤 문서 허브를 다시 생성하세요.</p></section>',
        bodySafety: DOCUMENT_BODY_SAFETY,
        searchText,
        health: 'conversion-failed',
        recovery: `${path} 원본 Markdown을 수정한 뒤 문서 허브를 다시 생성하세요.`,
      };
    }
  });
}
