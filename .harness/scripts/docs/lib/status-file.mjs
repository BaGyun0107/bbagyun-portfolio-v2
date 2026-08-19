// status.yaml의 status 라인 교체 + history 항목 추가.
// 평면 YAML 구조 보존을 위해 전체 재직렬화 대신 라인 단위로 최소 수정한다.

export function applyStatusEdit(text, toState, at) {
  const lines = text.split('\n');
  let statusReplaced = false;
  const out = [];
  let historyIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!statusReplaced && /^status:\s*/.test(line)) {
      out.push(`status: ${toState}`);
      statusReplaced = true;
      continue;
    }
    out.push(line);
    if (/^history:\s*$/.test(line)) historyIdx = out.length - 1;
  }

  const entry = `  - { at: "${at}", to: ${toState} }`;
  if (historyIdx === -1) {
    while (out.length && out.at(-1).trim() === '') out.pop();
    out.push('history:', entry, '');
  } else {
    let insertAt = historyIdx + 1;
    while (insertAt < out.length && /^\s+-\s+/.test(out[insertAt])) insertAt += 1;
    out.splice(insertAt, 0, entry);
  }
  return out.join('\n');
}
