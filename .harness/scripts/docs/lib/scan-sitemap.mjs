// data/sitemap.json(사람 소유 확정 사이트맵)을 읽고 검증한다.
// 부재/파싱 실패/구조 위반은 null + 경고로 파생 모드에 넘긴다(fail-open).
// 중복 id/alias는 soft 위반 — 경고만 내고 선선언 우선으로 유지한다.
// 스키마 진실의 원천: .harness/config/sitemap-schema.json

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const SITEMAP_SCHEMA_PATH = join(HERE, '..', '..', '..', 'config', 'sitemap-schema.json');

export const SITEMAP_SCHEMA = JSON.parse(readFileSync(SITEMAP_SCHEMA_PATH, 'utf8'));

function fatal(warnings, message) {
  warnings.push(message);
  return { sitemap: null, warnings };
}

// 노드 트리를 걷어 필수 키를 검사하고 id/alias 충돌을 수집한다.
// 구조 위반은 fatal(전체 파생 모드), 충돌은 soft(경고 + 선선언 우선).
function walkNodes(nodes, seen, warnings, path) {
  if (!Array.isArray(nodes)) {
    warnings.push(`sitemap ${path}: nodes must be an array`);
    return false;
  }
  for (const node of nodes) {
    if (!node || typeof node.id !== 'string' || !node.id.trim()
      || typeof node.title !== 'string' || !node.title.trim()) {
      warnings.push(`sitemap ${path}: node requires id and title`);
      return false;
    }
    const id = node.id.trim();
    if (seen.has(id)) {
      warnings.push(`sitemap node id 중복: '${id}' — 선선언 우선`);
    } else {
      seen.set(id, 'id');
    }
    for (const alias of node.aliases ?? []) {
      const a = String(alias).trim();
      if (seen.has(a)) {
        warnings.push(`sitemap alias 충돌: '${a}' — 선선언 우선`);
      } else {
        seen.set(a, 'alias');
      }
    }
    if (node.children !== undefined) {
      if (!walkNodes(node.children, seen, warnings, `${path}>${id}`)) return false;
    }
  }
  return true;
}

export function scanSitemap(root) {
  const warnings = [];
  const path = join(root, ...SITEMAP_SCHEMA.sitemapPath.split('/'));

  if (!existsSync(path)) {
    return fatal(warnings, `사이트맵 미정의 — 기능 행에서 파생 렌더 중 (${SITEMAP_SCHEMA.sitemapPath})`);
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    return fatal(warnings, `sitemap 파싱 실패 — 파생 모드로 렌더: ${error.message}`);
  }

  if (!parsed || typeof parsed.version !== 'number' || !Array.isArray(parsed.surfaces)) {
    return fatal(warnings, 'sitemap 구조 위반(version/surfaces) — 파생 모드로 렌더');
  }

  const seen = new Map();
  for (const surface of parsed.surfaces) {
    if (!surface || typeof surface.key !== 'string' || typeof surface.title !== 'string') {
      return fatal(warnings, 'sitemap 구조 위반(surface key/title) — 파생 모드로 렌더');
    }
    if (!SITEMAP_SCHEMA.surfaceKeys.includes(surface.key)) {
      return fatal(
        warnings,
        `sitemap surface key 비표준: '${surface.key}' (허용: ${SITEMAP_SCHEMA.surfaceKeys.join(', ')}) — 파생 모드로 렌더`,
      );
    }
    if (!walkNodes(surface.nodes, seen, warnings, surface.key)) {
      return { sitemap: null, warnings };
    }
  }

  return { sitemap: parsed, warnings };
}
