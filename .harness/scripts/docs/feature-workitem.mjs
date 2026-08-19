#!/usr/bin/env node
// explicit FeatureWorkItem 기록 마찰 제거 (백로그 7): delivery evidence의
// workItems에 한 건을 추가한다. 기존 ID는 덮어쓰지 않고, done은 acceptance
// 근거가 필요하므로 이 명령으로 만들 수 없다. demo 워크스페이스는 제외.
//
// 사용법: mise run feature:workitem "<FEAT-ID>" <workType> "<제목>" [status] [releaseId]

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { scanWorkspaces } from './lib/scan-workspaces.mjs';

const ROOT = process.env.HUB_ROOT || join(import.meta.dirname, '..', '..', '..');
const WORK_TYPES = new Set(['frontend', 'backend', 'db', 'qa', 'infra', 'unspecified']);
const CREATABLE_STATUSES = new Set(['planned', 'in-progress', 'in-review']);

function pickWorkspace(config) {
  const nonDemo = (config.workspaces || []).filter((workspace) => workspace.kind !== 'demo');
  return nonDemo.find((workspace) => workspace.id === config.defaultWorkspaceId)
    || nonDemo[0]
    || null;
}

function main() {
  const [featureId, workType, title, status = 'planned', releaseId = 'unassigned'] = process.argv.slice(2);
  if (!featureId || !workType || !title || !featureId.startsWith('FEAT-')) {
    process.stderr.write('[feature:workitem] 사용법: mise run feature:workitem "<FEAT-ID>" <workType> "<제목>" [status] [releaseId]\n');
    process.exit(1);
  }
  if (!WORK_TYPES.has(workType)) {
    process.stderr.write(`[feature:workitem] 지원하지 않는 workType '${workType}' — frontend/backend/db/qa/infra/unspecified 중 하나여야 합니다.\n`);
    process.exit(1);
  }
  if (!CREATABLE_STATUSES.has(status)) {
    process.stderr.write(`[feature:workitem] status '${status}'로는 생성할 수 없습니다. done은 acceptance 결과와 evidence가 필요하므로 완료 가드를 통과하는 갱신으로만 도달합니다.\n`);
    process.exit(1);
  }

  const workspace = pickWorkspace(scanWorkspaces(ROOT));
  if (!workspace?.rootPath) {
    process.stderr.write('[feature:workitem] 대상 워크스페이스를 찾지 못했습니다. data/hub-workspaces.json을 확인하세요.\n');
    process.exit(1);
  }
  const evidencePath = join(workspace.rootPath, workspace.deliverySource || 'downstream', 'delivery-evidence.json');

  let evidence;
  try {
    evidence = existsSync(evidencePath)
      ? JSON.parse(readFileSync(evidencePath, 'utf8'))
      : { schemaVersion: 1, projectId: workspace.id, collectedAt: new Date().toISOString(), workItems: [] };
  } catch (error) {
    process.stderr.write(`[feature:workitem] evidence 파싱 실패 — 손대지 않았습니다: ${error.message}\n`);
    process.exit(1);
  }
  if (!Array.isArray(evidence.workItems)) evidence.workItems = [];

  const itemId = `WORK-${featureId.replace(/^FEAT-/, '')}-${workType.toUpperCase()}`;
  if (evidence.workItems.some((item) => item?.id === itemId)) {
    process.stderr.write(`[feature:workitem] '${itemId}' 이미 존재 — ID는 불변입니다. 분할이 필요하면 -A/-B 접미사로 직접 기록하세요.\n`);
    process.exit(1);
  }

  evidence.workItems.push({
    id: itemId,
    featureDefinitionId: featureId,
    title,
    workType,
    releaseId,
    status,
    taskRefs: [],
    evidenceRefs: [],
  });
  evidence.collectedAt = new Date().toISOString();
  mkdirSync(dirname(evidencePath), { recursive: true });
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);

  process.stdout.write(`[feature:workitem] ${itemId} 기록 완료 (${evidencePath})\n`);
  process.stdout.write('[feature:workitem] taskRefs/evidenceRefs는 진행하며 채우세요. 카탈로그에 없는 기능이면 mise run feature:stub 으로 draft 정의를 등록하세요.\n');
  process.stdout.write('[feature:workitem] 다음 단계: mise run docs:build 로 기능 현황 반영을 확인하세요.\n');
}

main();
