#!/usr/bin/env node
// 정의-후행 경량 등록: 카탈로그에 없는 기능을 draft FeatureDefinition으로
// 등록하고 소급 상세 필요를 열린 결정으로 남긴다. 기존 ID는 덮어쓰지
// 않으며, demo 워크스페이스는 대상에서 제외한다.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { scanWorkspaces } from './lib/scan-workspaces.mjs';

const ROOT = process.env.HUB_ROOT || join(import.meta.dirname, '..', '..', '..');

function readJsonArray(path) {
  if (!existsSync(path)) return [];
  const parsed = JSON.parse(readFileSync(path, 'utf8'));
  return Array.isArray(parsed) ? parsed : [];
}

function pickWorkspace(config) {
  const nonDemo = (config.workspaces || []).filter((workspace) => workspace.kind !== 'demo');
  return nonDemo.find((workspace) => workspace.id === config.defaultWorkspaceId)
    || nonDemo[0]
    || (config.workspaces || [])[0]
    || null;
}

function main() {
  const [id, title, summary = '', ownerRole = 'product'] = process.argv.slice(2);
  if (!id || !title || !id.startsWith('FEAT-')) {
    process.stderr.write('[feature:stub] 사용법: mise run feature:stub "<FEAT-ID>" "<제목>" [요약] [owner]\n');
    process.stderr.write('[feature:stub] ID는 FEAT- 접두사로 시작해야 합니다.\n');
    process.exit(1);
  }

  const workspace = pickWorkspace(scanWorkspaces(ROOT));
  if (!workspace?.rootPath) {
    process.stderr.write('[feature:stub] 대상 워크스페이스를 찾지 못했습니다. data/hub-workspaces.json을 확인하세요.\n');
    process.exit(1);
  }
  const planningRoot = join(workspace.rootPath, workspace.planningSource || 'planning');
  const defsPath = join(planningRoot, 'feature-definitions.json');
  const decisionsPath = join(planningRoot, 'decisions.json');

  let defs;
  let decisions;
  try {
    defs = readJsonArray(defsPath);
    decisions = readJsonArray(decisionsPath);
  } catch (error) {
    process.stderr.write(`[feature:stub] planning source 파싱 실패 — 손대지 않았습니다: ${error.message}\n`);
    process.exit(1);
  }

  const existing = defs.find((entry) => entry?.id === id);
  if (existing) {
    process.stdout.write(`[feature:stub] '${id}' 이미 존재 (definitionStatus: ${existing.definitionStatus || '미정'}) — 아무것도 변경하지 않았습니다.\n`);
    process.exit(0);
  }

  mkdirSync(planningRoot, { recursive: true });
  const stub = { id, title, definitionStatus: 'draft', lastReviewedAt: new Date().toISOString() };
  if (summary) stub.summary = summary;
  defs.push(stub);

  const decisionId = `DEC-STUB-${id}`;
  if (!decisions.some((entry) => entry?.id === decisionId)) {
    decisions.push({
      id: decisionId,
      title: `${id} 소급 상세 작성`,
      status: 'open',
      owner: ownerRole,
      question: '11그룹 상세와 acceptance를 작성해 draft 정의를 승격해야 합니다.',
      resolutionCondition: 'feature detail 작성 후 definitionStatus 승격',
    });
  }

  writeFileSync(defsPath, `${JSON.stringify(defs, null, 2)}\n`);
  writeFileSync(decisionsPath, `${JSON.stringify(decisions, null, 2)}\n`);
  process.stdout.write(`[feature:stub] ${id} draft 등록 완료 (workspace: ${workspace.id})\n`);
  process.stdout.write(`[feature:stub] - ${defsPath}\n`);
  process.stdout.write(`[feature:stub] - ${decisionsPath} (열린 결정 ${decisionId})\n`);
  process.stdout.write('[feature:stub] 다음 단계: mise run docs:build 후 Planning Hub에서 draft 표시를 확인하세요.\n');
}

main();
