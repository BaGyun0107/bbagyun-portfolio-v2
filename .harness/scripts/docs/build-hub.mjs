#!/usr/bin/env node
// 문서 허브 + Planning Hub 생성기 진입점 (FR-001~005, FR-016, FR-049~050).
// source/model을 한 번 수집하고 두 renderer를 완료한 뒤 page set을 기록한다.
// 상태 데이터/색인 폴더가 없어도 exit 0.

import { readFileSync, writeFileSync, existsSync, mkdirSync, lstatSync, renameSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { scanMd } from './lib/scan-md.mjs';
import { scanSpecs } from './lib/scan-specs.mjs';
import { scanServiceDefinition } from './lib/scan-service-definition.mjs';
import { mergeServiceDefinition } from './lib/merge-service-definition.mjs';
import { mergeRegistry } from './lib/merge-registry.mjs';
import { scanSitemap } from './lib/scan-sitemap.mjs';
import { actorSurfaceMismatches, mergeSitemap } from './lib/merge-sitemap.mjs';
import { scanTraceability } from './lib/scan-traceability.mjs';
import { scanUserFlows } from './lib/scan-user-flows.mjs';
import { buildLinkedHubModel } from './lib/build-linked-hub-model.mjs';
import { buildWorkspaceHubModel, hasPlanningCatalog, loadPlanningWorkspace, openDecisionSummary } from './lib/build-workspace-hub-model.mjs';
import { scanWorkspaces } from './lib/scan-workspaces.mjs';
import { buildDocumentProjections } from './lib/build-document-projections.mjs';
import { isMain } from './lib/is-main.mjs';
import { renderDocsPage } from './lib/render-docs-page.mjs';
import { renderPlanningPage } from './lib/render-planning-page.mjs';
import { collectHints } from './lib/transition.mjs';
import { detectDuplicateSuspects } from './lib/detect-duplicate-definition.mjs';
import { unregisteredWorkItemSummary } from './lib/aggregate-feature-work-items.mjs';

// 저장소 루트 = 이 파일 기준 ../../.. (.harness/scripts/docs/build-hub.mjs)
const ROOT = process.env.HUB_ROOT || join(import.meta.dirname, '..', '..', '..');

// 색인 대상 (research D3). 상수로 두어 조정 쉽게.
const MD_DIRS = ['README.md', 'docs', '.harness/docs', 'specs'];
let pageSetWriteSequence = 0;

function targetSnapshot(path, fs) {
  try {
    const stat = fs.lstatSync(path);
    if (stat.isSymbolicLink()) throw new Error(`generated output target must not be a symlink: ${path}`);
    if (stat.isFile()) return { kind: 'file', content: fs.readFileSync(path) };
    return { kind: 'other' };
  } catch (error) {
    if (error?.code === 'ENOENT') return { kind: 'absent' };
    throw error;
  }
}

function restoreTarget(path, snapshot, fs) {
  if (snapshot.kind === 'file') {
    fs.writeFileSync(path, snapshot.content);
    return;
  }
  if (snapshot.kind === 'absent') {
    try { fs.unlinkSync(path); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
  }
}

export function writeGeneratedPageSet(outDir, pages, fsOverrides = {}) {
  const fs = { readFileSync, writeFileSync, lstatSync, renameSync, unlinkSync, ...fsOverrides };
  const entries = Object.entries(pages);
  const sequence = pageSetWriteSequence += 1;
  const staged = entries.map(([name, content], index) => ({
    name,
    content,
    target: join(outDir, name),
    temp: join(outDir, `.${name}.${process.pid}.${sequence}.${index}.tmp`),
  }));
  const snapshots = new Map(staged.map(({ target }) => [target, targetSnapshot(target, fs)]));
  const replaced = [];

  try {
    for (const item of staged) fs.writeFileSync(item.temp, item.content, 'utf8');
    for (const item of staged) {
      fs.renameSync(item.temp, item.target);
      replaced.push(item);
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const item of replaced.reverse()) {
      try { restoreTarget(item.target, snapshots.get(item.target), fs); } catch (rollbackError) { rollbackErrors.push(rollbackError); }
    }
    if (rollbackErrors.length) throw new AggregateError([error, ...rollbackErrors], 'generated page set replace and rollback failed');
    throw error;
  } finally {
    for (const { temp } of staged) {
      try { fs.unlinkSync(temp); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
    }
  }
}

function loadRegistry(root) {
  const p = join(root, 'registry.json');
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    process.stderr.write('[docs:build] registry.json 파싱 실패 — 무시\n');
    return null;
  }
}

export function build(root = ROOT, { write = true, renderers = {} } = {}) {
  const mdTargets = MD_DIRS.map((p) => join(root, p));
  const docs = scanMd(mdTargets, root);
  const { features: specFeatures, warnings } = scanSpecs(join(root, 'specs'));
  for (const w of warnings) process.stderr.write(`[docs:build] ${w}\n`);

  const features = mergeRegistry(specFeatures, loadRegistry(root));
  const normalizerModel = scanServiceDefinition(join(root, 'data', 'feature-definitions.json'));
  const serviceDefinition = mergeServiceDefinition(normalizerModel, specFeatures);
  if (serviceDefinition.warning) {
    process.stderr.write(`[docs:build] ${serviceDefinition.warning}\n`);
  }

  // 사이트맵(사람 소유). 부재/위반은 경고 후 파생 모드로 fail-open.
  const { sitemap, warnings: sitemapWarnings } = scanSitemap(root);
  for (const w of sitemapWarnings) process.stderr.write(`[docs:build] ${w}\n`);

  const { traceability, warnings: traceabilityWarnings } = scanTraceability(root);
  for (const w of traceabilityWarnings) process.stderr.write(`[docs:build] ${w}\n`);
  const { userFlows, warnings: userFlowWarnings } = scanUserFlows(root);
  for (const w of userFlowWarnings) process.stderr.write(`[docs:build] ${w}\n`);
  const linkedHub = buildLinkedHubModel({
    features,
    rows: serviceDefinition.rows,
    sitemap,
    traceability,
    userFlows,
  });

  const workspaceConfig = scanWorkspaces(root, { mode: 'preview' });
  const workspaceHub = {
    version: 1,
    defaultWorkspaceId: workspaceConfig.defaultWorkspaceId,
    health: workspaceConfig.health,
    // planning 전체 경로는 demo 전용이 아니다: 카탈로그를 가진 워크스페이스는
    // kind와 무관하게 카탈로그+상세+Delivery Evidence 경로로 로드한다.
    workspaces: workspaceConfig.workspaces.map((workspace) => (workspace.kind === 'demo' || hasPlanningCatalog(workspace))
      ? loadPlanningWorkspace(workspace)
      : buildWorkspaceHubModel({
        ...workspace,
        source: { root: workspace.root, rootPath: workspace.rootPath, health: workspace.sourceHealth },
        features,
        serviceDefinition,
        sitemap,
        traceability,
        userFlows,
      })),
  };

  const documents = buildDocumentProjections(docs);
  const model = { docs, documents, features, serviceDefinition, sitemap, linkedHub, workspaceHub };
  const documentsHtml = (renderers.documents || renderDocsPage)({ documents });
  const planningHtml = (renderers.planning || renderPlanningPage)(model);

  if (write) {
    const outDir = join(root, 'docs');
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    // 두 renderer와 두 stage가 모두 완료된 뒤 page set을 교체한다.
    writeGeneratedPageSet(outDir, {
      'index.html': documentsHtml,
      'planning.html': planningHtml,
    });
  }

  // 비차단 힌트 수집(출력은 호출측). 스캐너 경고 + 매핑 카운트를 합친다.
  const board = mergeSitemap(sitemap, serviceDefinition.rows, {
    screenAssignments: linkedHub.screenAssignments,
  });
  const hints = [...sitemapWarnings, ...traceabilityWarnings, ...userFlowWarnings];
  if (normalizerModel.legacyRowCount > 0) {
    hints.push(
      `legacy 기능정의 행 ${normalizerModel.legacyRowCount}건 — 신규 계약은 카탈로그 전용입니다. `
      + 'normalizer(codi-feature-definition-normalizer)로 카탈로그 변환을 권장합니다',
    );
  }
  const unregistered = unregisteredWorkItemSummary(
    workspaceHub.workspaces.flatMap((workspace) => workspace.featureWorkItems || []),
  );
  if (unregistered.featureIds.length > 0) {
    hints.push(
      `미등록 기능 ${unregistered.featureIds.length}건 (${unregistered.featureIds.join(', ')}) — `
      + `mise run feature:stub "<FEAT-ID>" "<제목>"으로 draft 정의를 등록하세요`,
    );
  }
  for (const conflict of linkedHub.linkConflicts || []) {
    hints.push(
      `spec-기능 연결 충돌: ${conflict.featureId} — planning(${conflict.planningSpecId}) 우선, `
      + `spec featureId(${conflict.reverseSpecId})는 무시됨`,
    );
  }
  for (const workspace of workspaceHub.workspaces) {
    for (const mismatch of actorSurfaceMismatches(workspace.sitemap, workspace.features, { actorClasses: workspace.actorClasses })) {
      hints.push(
        `actor-surface 불일치: ${mismatch.featureId} (actor ${mismatch.actor}) → `
        + `${mismatch.screenId} [${mismatch.surface} surface] — 배치 또는 actor를 확인하세요`,
      );
    }
    const openDecisions = openDecisionSummary(workspace.decisions);
    if (openDecisions.count > 0) {
      hints.push(
        `열린 결정 ${openDecisions.count}건 (${openDecisions.ids.join(', ')}) — `
        + `owner와 해소 조건을 확인하세요 (${workspace.id})`,
      );
    }
  }
  if (!board.derived) {
    if (board.unassignedCount > 0) {
      hints.push(`미배치 기능정의 ${board.unassignedCount}건 — 사이트맵 노드와 Area 불일치`);
    }
    if (board.emptyNodeCount > 0) {
      hints.push(`빈 화면 노드 ${board.emptyNodeCount}개 — 기능정의가 없는 화면`);
    }
  }
  if (linkedHub.traceability.configured) {
    const health = linkedHub.traceability.health;
    if (health.counts.broken > 0) hints.push(`traceability broken ${health.counts.broken}건`);
    if (health.counts.duplicate > 0) hints.push(`traceability duplicate ${health.counts.duplicate}건`);
    if (health.counts.orphan > 0) hints.push(`traceability orphan ${health.counts.orphan}건`);
  }
  if (linkedHub.traceability.health.counts.flowBroken > 0) {
    hints.push(`user-flow broken ${linkedHub.traceability.health.counts.flowBroken}건`);
  }
  if (linkedHub.traceability.health.counts.flowCycle > 0) {
    hints.push(`user-flow cycle ${linkedHub.traceability.health.counts.flowCycle}건`);
  }

  return {
    docsCount: docs.length,
    featureCount: features.length,
    serviceDefinitionCount: serviceDefinition.rows.length,
    serviceDefinition,
    specFeatures,
    sitemap,
    linkedHub,
    workspaceHub,
    documents,
    documentsHtml,
    planningHtml,
    // 기존 no-write 호출자는 html을 계속 읽을 수 있으며 이제 문서 허브를 뜻한다.
    html: documentsHtml,
    hints,
  };
}

// 직접 실행 시
if (isMain(import.meta.url)) {
  const res = build(ROOT);
  process.stdout.write(
    `[docs:build] docs/index.html + docs/planning.html 생성 — 문서 ${res.docsCount}건, 기능 ${res.featureCount}건, 기능정의 ${res.serviceDefinitionCount}건\n`,
  );
  // 비차단 자동 힌트 (FR-010) — 출력만, 파일 변경 없음.
  for (const h of collectHints(res.specFeatures, ROOT)) {
    process.stdout.write(`▸ ${h}\n`);
  }
  // 사이트맵 힌트(미정의/미배치/빈 노드) — 비차단.
  for (const h of res.hints) {
    process.stdout.write(`▸ ${h}\n`);
  }
  // 3층: 기능정의서 중복 의심 경고(비차단). id가 어긋난 top-down 중복을 잡는다.
  const suspects = detectDuplicateSuspects(res.serviceDefinition?.rows || []);
  for (const s of suspects) {
    process.stdout.write(
      `▸ 중복 의심: 원장/spec '${s.a}'(${s.titleA})와 '${s.b}'(${s.titleB})가 유사 — 같은 기능이면 id를 통일하세요\n`,
    );
  }
}
