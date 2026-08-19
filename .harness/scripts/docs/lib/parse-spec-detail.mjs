// Spec Kit Markdown에서 기능 상세에 필요한 의미 섹션만 구조화한다.
// 완전한 Markdown parser가 아니라 Spec Kit heading/목록 계약을 좁게 따른다.

function cleanInline(value) {
  return String(value || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function headingLevel(line) {
  const match = /^(#{1,6})\s+/.exec(line);
  return match ? match[1].length : 0;
}

function section(lines, headingPattern) {
  const start = lines.findIndex((line) => headingPattern.test(line));
  if (start < 0) return [];
  const level = headingLevel(lines[start]);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const candidate = headingLevel(lines[index]);
    if (candidate > 0 && candidate <= level) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end);
}

function listItems(lines, marker) {
  const items = [];
  for (const line of lines) {
    const match = marker.exec(line);
    if (match) {
      items.push(cleanInline(match[1]));
      continue;
    }
    if (items.length > 0 && /^\s{2,}\S/.test(line) && !headingLevel(line)) {
      items[items.length - 1] = cleanInline(`${items[items.length - 1]} ${line.trim()}`);
    }
  }
  return items.filter(Boolean);
}

function identifiedItems(lines, prefix) {
  return listItems(lines, /^\s*-\s+(.+)$/)
    .map((text) => {
      const match = new RegExp(`^(${prefix}-\\d+):\\s*(.+)$`).exec(text);
      return match ? { id: match[1], text: match[2] } : null;
    })
    .filter(Boolean);
}

function summaryFrom(lines) {
  const firstHeading = lines.findIndex((line) => /^#\s+/.test(line));
  const start = firstHeading >= 0 ? firstHeading + 1 : 0;
  const paragraph = [];
  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (/^##\s+/.test(line)) break;
    if (!line || /^\*\*[^*]+\*\*:/.test(line) || line.startsWith('>')) {
      if (paragraph.length > 0) break;
      continue;
    }
    paragraph.push(line);
  }
  return cleanInline(paragraph.join(' '));
}

function parseUserStories(lines) {
  const stories = [];
  const storyHeading = /^###\s+User Story\s+\d+\s+-\s+(.+?)(?:\s+\(Priority:\s*([^)]+)\))?\s*$/;
  for (let index = 0; index < lines.length; index += 1) {
    const match = storyHeading.exec(lines[index]);
    if (!match) continue;
    let end = lines.length;
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      if (/^###\s+/.test(lines[cursor])) {
        end = cursor;
        break;
      }
    }
    const bodyLines = lines.slice(index + 1, end);
    const acceptanceIndex = bodyLines.findIndex((line) => /Acceptance Scenarios/.test(line));
    const descriptionLines = (acceptanceIndex >= 0 ? bodyLines.slice(0, acceptanceIndex) : bodyLines)
      .filter((line) => line.trim() && !/^\*\*[^*]+\*\*:/.test(line.trim()));
    stories.push({
      title: cleanInline(match[1]),
      priority: cleanInline(match[2] || ''),
      description: cleanInline(descriptionLines.join(' ')),
      acceptanceScenarios: acceptanceIndex >= 0
        ? listItems(bodyLines.slice(acceptanceIndex + 1), /^\s*\d+\.\s+(.+)$/)
        : [],
    });
    index = end - 1;
  }
  return stories;
}

export function parseSpecDetail(markdown) {
  const lines = String(markdown || '').split(/\r?\n/);
  return {
    summary: summaryFrom(lines),
    userStories: parseUserStories(lines),
    edgeCases: listItems(section(lines, /^###\s+Edge Cases\s*$/), /^\s*-\s+(.+)$/),
    functionalRequirements: identifiedItems(
      section(lines, /^###\s+Functional Requirements\s*$/),
      'FR',
    ),
    successCriteria: identifiedItems(
      section(lines, /^###\s+Measurable Outcomes\s*$/),
      'SC',
    ),
  };
}
