#!/usr/bin/env node
// 단일 저장소 publish 단축 (백로그 5): workspace planningSource를 컴파일해
// planning-manifest.json을 원자 교체한다. Planning Lock 반영은 여전히
// mise run planning:pull 명시 실행만 허용된다.
//
// 사용법: mise run planning:publish [workspaceId] [--revision <rev>]
// demo 워크스페이스는 명시 지정 없이는 대상이 아니다.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { scanWorkspaces } from './lib/scan-workspaces.mjs';
import { compilePlanningDirectory, writePlanningManifest } from './lib/compile-planning-manifest.mjs';

const ROOT = process.env.HUB_ROOT || join(import.meta.dirname, '..', '..', '..');

function parseArgs(argv) {
  const args = { workspaceId: null, revision: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--revision') args.revision = argv[index += 1] ?? null;
    else if (!args.workspaceId) args.workspaceId = argv[index];
  }
  return args;
}

function pickWorkspace(config, workspaceId) {
  if (workspaceId) {
    return (config.workspaces || []).find((workspace) => workspace.id === workspaceId) || null;
  }
  const nonDemo = (config.workspaces || []).filter((workspace) => workspace.kind !== 'demo');
  return nonDemo.find((workspace) => workspace.id === config.defaultWorkspaceId) || nonDemo[0] || null;
}

function nextRevision(existingManifest, workspaceId) {
  const current = existingManifest?.sourceRevision;
  const match = typeof current === 'string' ? current.match(/^(.*-rev-)(\d+)$/) : null;
  if (match) return `${match[1]}${Number(match[2]) + 1}`;
  return `${workspaceId}-rev-1`;
}

function main() {
  const { workspaceId, revision } = parseArgs(process.argv.slice(2));
  const workspace = pickWorkspace(scanWorkspaces(ROOT), workspaceId);
  if (!workspace?.rootPath) {
    process.stderr.write('[planning:publish] 대상 워크스페이스가 없습니다. demo는 id를 명시해야 합니다.\n');
    process.exit(1);
  }
  const planningRoot = join(workspace.rootPath, workspace.planningSource || 'planning');
  const manifestPath = join(planningRoot, 'planning-manifest.json');
  let existing = null;
  if (existsSync(manifestPath)) {
    try {
      existing = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch {
      existing = null;
    }
  }

  try {
    const manifest = compilePlanningDirectory({
      planningRoot,
      projectId: existing?.projectId || workspace.id,
      manifestVersion: existing?.manifestVersion || '1.0.0',
      sourceRevision: revision || nextRevision(existing, workspace.id),
    });
    writePlanningManifest(manifestPath, manifest);
    process.stdout.write(`[planning:publish] ${manifest.projectId} ${manifest.sourceRevision} 게시 완료\n`);
    process.stdout.write(`[planning:publish] - ${manifestPath}\n`);
    process.stdout.write(`[planning:publish] - digest ${manifest.digest}\n`);
    process.stdout.write('[planning:publish] 다음 단계: mise run planning:pull 로 Planning Lock에 반영하세요.\n');
  } catch (error) {
    process.stderr.write(`[planning:publish] 컴파일 실패 — 기존 manifest 보존: ${error.message}\n`);
    process.exit(1);
  }
}

main();
