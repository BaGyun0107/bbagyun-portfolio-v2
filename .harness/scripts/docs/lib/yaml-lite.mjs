// 평면 YAML 서브셋 파서 (research D1). 런타임 의존성 0.
// 지원: `key: value`, 인라인 리스트 `[a, b]`, `history:` 아래 `- { at, to }` 라인.
// 허용 밖 구조는 스로우하지 않고 warnings에 담는다.

function stripQuotes(s) {
  const t = s.trim();
  if (t.length >= 2 && ((t[0] === '"' && t.at(-1) === '"') || (t[0] === "'" && t.at(-1) === "'"))) {
    return t.slice(1, -1);
  }
  return t;
}

function parseInlineList(raw) {
  const inner = raw.trim().slice(1, -1).trim();
  if (inner === '') return [];
  return inner.split(',').map((x) => stripQuotes(x));
}

// `{ at: "x", to: y }` 형태의 인라인 맵을 파싱한다.
function parseInlineMap(raw) {
  const inner = raw.trim().slice(1, -1).trim();
  const obj = {};
  for (const part of inner.split(',')) {
    const idx = part.indexOf(':');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = stripQuotes(part.slice(idx + 1));
    obj[k] = v;
  }
  return obj;
}

export function parseYamlLite(text) {
  const data = {};
  const warnings = [];
  const lines = text.split('\n');
  let currentListKey = null;

  for (const line of lines) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    // history 같은 블록 리스트 항목: 들여쓰기 후 `- { ... }`
    const listItem = line.match(/^\s+-\s+(\{.*\})\s*$/);
    if (listItem) {
      if (currentListKey) {
        data[currentListKey].push(parseInlineMap(listItem[1]));
      } else {
        warnings.push(`리스트 항목의 상위 key 없음: ${line.trim()}`);
      }
      continue;
    }

    // 최상위 `key: value` 또는 `key:` (블록 리스트 시작)
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) {
      const key = kv[1];
      const rawVal = kv[2].trim();
      if (rawVal === '') {
        // 블록 리스트 시작 (예: history:)
        data[key] = [];
        currentListKey = key;
      } else if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
        data[key] = parseInlineList(rawVal);
        currentListKey = null;
      } else {
        data[key] = stripQuotes(rawVal);
        currentListKey = null;
      }
      continue;
    }

    warnings.push(`파싱 불가 라인: ${line.trim()}`);
  }

  return { data, warnings };
}
