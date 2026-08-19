// 선택적 typed traceability 원본을 읽고 구조 수준을 검증한다.
// endpoint 존재 여부와 orphan 계산은 build-linked-hub-model이 담당한다.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SCHEMA_PATH = join(import.meta.dirname, '..', '..', '..', 'config', 'traceability-schema.json');
export const TRACEABILITY_SCHEMA = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));

function warningResult(warnings, message) {
  warnings.push(message);
  return { traceability: null, warnings };
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function endpointValid(endpoint) {
  return endpoint
    && TRACEABILITY_SCHEMA.entityTypes.includes(endpoint.type)
    && nonEmpty(endpoint.id);
}

export function scanTraceability(root) {
  const warnings = [];
  const path = join(root, ...TRACEABILITY_SCHEMA.sourcePath.split('/'));
  if (!existsSync(path)) {
    return warningResult(warnings, `traceability 미정의 (${TRACEABILITY_SCHEMA.sourcePath})`);
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    return warningResult(warnings, `traceability 파싱 실패 — 기능 연결 없이 렌더: ${error.message}`);
  }
  if (
    !parsed
    || parsed.version !== TRACEABILITY_SCHEMA.version
    || !Array.isArray(parsed.entities)
    || !Array.isArray(parsed.links)
  ) {
    return warningResult(warnings, 'traceability 구조 위반(version/entities/links) — 기능 연결 없이 렌더');
  }

  const entities = [];
  const entityKeys = new Set();
  parsed.entities.forEach((entity, index) => {
    if (!entity || !TRACEABILITY_SCHEMA.supplementalEntityTypes.includes(entity.type)) {
      warnings.push(`traceability entity type 위반 #${index + 1}`);
      return;
    }
    if (!nonEmpty(entity.id) || !nonEmpty(entity.title)) {
      warnings.push(`traceability entity 필수 필드 누락 #${index + 1}`);
      return;
    }
    const key = `${entity.type}:${entity.id}`;
    if (entityKeys.has(key)) {
      warnings.push(`traceability entity 중복: ${key} — 선선언 우선`);
      return;
    }
    entityKeys.add(key);
    entities.push({
      type: entity.type,
      id: entity.id,
      title: entity.title,
      ...(nonEmpty(entity.href) ? { href: entity.href } : {}),
      ...(nonEmpty(entity.description) ? { description: entity.description } : {}),
    });
  });

  const links = [];
  const linkKeys = new Set();
  parsed.links.forEach((link, index) => {
    if (
      !link
      || !endpointValid(link.from)
      || !endpointValid(link.to)
      || !TRACEABILITY_SCHEMA.relationTypes.includes(link.type)
    ) {
      warnings.push(`traceability link 구조 위반 #${index + 1}`);
      return;
    }
    const key = `${link.from.type}:${link.from.id}|${link.type}|${link.to.type}:${link.to.id}`;
    if (linkKeys.has(key)) warnings.push(`traceability link 중복: ${key} — model에서 선선언 우선`);
    linkKeys.add(key);
    links.push({
      from: { type: link.from.type, id: link.from.id },
      to: { type: link.to.type, id: link.to.id },
      type: link.type,
      ...(nonEmpty(link.label) ? { label: link.label } : {}),
      ...(nonEmpty(link.evidence) ? { evidence: link.evidence } : {}),
    });
  });

  return { traceability: { version: parsed.version, entities, links }, warnings };
}
